/**
 * zip.ts — 无依赖 ZIP 打包/解包（STORE + deflate-raw）
 * 打包：优先 CompressionStream('deflate-raw')，不可用则 STORE（不压缩）。
 * 解包：支持 STORE 与 deflate（method 8，经 DecompressionStream）。Chromium 103+ / 新 Electron 均可。
 */

const CRC_TABLE = (() => {
    const t = new Uint32Array(256)
    for (let i = 0; i < 256; i++) {
        let c = i
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
        t[i] = c >>> 0
    }
    return t
})()

function crc32(u8: Uint8Array): number {
    let c = 0xffffffff
    for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xff] ^ (c >>> 8)
    return (c ^ 0xffffffff) >>> 0
}

const enc = new TextEncoder()
const dec = new TextDecoder()

async function deflateRaw(u8: Uint8Array): Promise<Uint8Array | null> {
    if (typeof CompressionStream === 'undefined') return null
    const cs = new CompressionStream('deflate-raw')
    const stream = new Blob([u8 as unknown as BlobPart]).stream().pipeThrough(cs)
    return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function inflateRaw(u8: Uint8Array): Promise<Uint8Array> {
    if (typeof DecompressionStream === 'undefined') {
        throw new Error('当前浏览器不支持解压（需要 Chrome/Edge 103+ 或新 Electron）')
    }
    const ds = new DecompressionStream('deflate-raw')
    const stream = new Blob([u8 as unknown as BlobPart]).stream().pipeThrough(ds)
    return new Uint8Array(await new Response(stream).arrayBuffer())
}

function dosDateTime(d = new Date()) {
    const time = ((d.getHours() & 0x1f) << 11) | ((d.getMinutes() & 0x3f) << 5) | ((d.getSeconds() / 2) & 0x1f)
    const date = (((d.getFullYear() - 1980) & 0x7f) << 9) | (((d.getMonth() + 1) & 0x0f) << 5) | (d.getDate() & 0x1f)
    return { time, date }
}

export interface ZipEntry {
    path: string
    data: Uint8Array
}

/** 打包 zip */
export async function zipCreate(entries: ZipEntry[]): Promise<Blob> {
    const chunks: (Uint8Array | BlobPart)[] = []
    const central: Uint8Array[] = []
    let offset = 0
    const { time, date } = dosDateTime()

    for (const e of entries) {
        const nameBytes = enc.encode(e.path)
        const raw = e.data instanceof Uint8Array ? e.data : new Uint8Array(e.data)
        const crc = crc32(raw)
        let method = 0
        let body: Uint8Array = raw
        const deflated = await deflateRaw(raw)
        if (deflated && deflated.length < raw.length) {
            method = 8
            body = deflated
        }

        const local = new Uint8Array(30 + nameBytes.length)
        const lv = new DataView(local.buffer)
        lv.setUint32(0, 0x04034b50, true)
        lv.setUint16(4, 20, true)
        lv.setUint16(6, 0x0800, true) // UTF-8 名称
        lv.setUint16(8, method, true)
        lv.setUint16(10, time, true)
        lv.setUint16(12, date, true)
        lv.setUint32(14, crc, true)
        lv.setUint32(18, body.length, true)
        lv.setUint32(22, raw.length, true)
        lv.setUint16(26, nameBytes.length, true)
        lv.setUint16(28, 0, true)
        local.set(nameBytes, 30)
        chunks.push(local, body)

        const cd = new Uint8Array(46 + nameBytes.length)
        const cv = new DataView(cd.buffer)
        cv.setUint32(0, 0x02014b50, true)
        cv.setUint16(4, 20, true)
        cv.setUint16(6, 20, true)
        cv.setUint16(8, 0x0800, true)
        cv.setUint16(10, method, true)
        cv.setUint16(12, time, true)
        cv.setUint16(14, date, true)
        cv.setUint32(16, crc, true)
        cv.setUint32(20, body.length, true)
        cv.setUint32(24, raw.length, true)
        cv.setUint16(28, nameBytes.length, true)
        cv.setUint16(30, 0, true)
        cv.setUint16(32, 0, true)
        cv.setUint16(34, 0, true)
        cv.setUint16(36, 0, true)
        cv.setUint32(38, 0, true)
        cv.setUint32(42, offset, true)
        cd.set(nameBytes, 46)
        central.push(cd)

        offset += local.length + body.length
    }

    const centralSize = central.reduce((s, c) => s + c.length, 0)
    const eocd = new Uint8Array(22)
    const ev = new DataView(eocd.buffer)
    ev.setUint32(0, 0x06054b50, true)
    ev.setUint16(8, central.length, true)
    ev.setUint16(10, central.length, true)
    ev.setUint32(12, centralSize, true)
    ev.setUint32(16, offset, true)
    ev.setUint16(20, 0, true)

    return new Blob([...chunks, ...central, eocd] as BlobPart[], { type: 'application/zip' })
}

/** 解包 zip */
export async function zipRead(buf: ArrayBuffer): Promise<ZipEntry[]> {
    const u8 = new Uint8Array(buf)
    const dv = new DataView(buf)
    let eocd = -1
    for (let i = u8.length - 22; i >= 0 && i > u8.length - 22 - 65557; i--) {
        if (dv.getUint32(i, true) === 0x06054b50) {
            eocd = i
            break
        }
    }
    if (eocd < 0) throw new Error('不是有效的 zip 文件（未找到 EOCD）')
    const count = dv.getUint16(eocd + 10, true)
    let p = dv.getUint32(eocd + 16, true)

    const out: ZipEntry[] = []
    for (let i = 0; i < count; i++) {
        if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('zip 中央目录损坏')
        const method = dv.getUint16(p + 10, true)
        const compSize = dv.getUint32(p + 20, true)
        const nameLen = dv.getUint16(p + 28, true)
        const extraLen = dv.getUint16(p + 30, true)
        const commentLen = dv.getUint16(p + 32, true)
        const localOff = dv.getUint32(p + 42, true)
        const name = dec.decode(u8.subarray(p + 46, p + 46 + nameLen))

        const lNameLen = dv.getUint16(localOff + 26, true)
        const lExtraLen = dv.getUint16(localOff + 28, true)
        const dataStart = localOff + 30 + lNameLen + lExtraLen
        const comp = u8.subarray(dataStart, dataStart + compSize)
        let data: Uint8Array
        if (method === 0) data = comp.slice()
        else if (method === 8) data = await inflateRaw(comp)
        else throw new Error(`不支持的压缩方式：${method}（${name}）`)
        out.push({ path: name, data })

        p += 46 + nameLen + extraLen + commentLen
    }
    return out
}

export function bytesToText(u8: Uint8Array): string {
    return dec.decode(u8)
}

export function textToBytes(str: string): Uint8Array {
    return enc.encode(str)
}
