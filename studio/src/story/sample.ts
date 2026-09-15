/**
 * sample.ts — 示例剧情工程
 * 用途：新用户点一下就能看到一个「有分镜、有分支、有立绘」的完整段落，而不是空白工程。
 * 占位美术由 canvas 现场生成（不依赖任何外部图片），所以示例永远是自洽的、可直接导出的。
 */
import type { StoryProject } from './types'

/** 两个段：序章 + 余响；含旁白、演出、多人立绘对白、选项分支、跨段跳转 */
export function sampleProject(): StoryProject {
    return {
        files: {
            '1.0.0.1': {
                meta: { title: '序章 · 古木之下' },
                nodes: [
                    {
                        id: '1',
                        type: 'narration',
                        text: '古木之上，有丰饶之名。传闻向它许愿的人，都会在某个清晨听见自己的回声。',
                        next: '',
                    },
                    {
                        id: '2',
                        type: 'stage',
                        text: '（风从林梢压下来，光斑碎了一地。）',
                        stage: { bg: 'forest', avatars: [] },
                        next: '',
                    },
                    {
                        id: '3',
                        type: 'dialogue',
                        speaker: '林',
                        text: '你终于来了。我在这里等了三个秋天。',
                        avatars: [
                            { slot: 1, key: 'lin', name: '林', facing: 1 },
                            { slot: 2, key: 'yao', name: '遥', x: 360, facing: -1 },
                        ],
                        next: '',
                    },
                    {
                        id: '4',
                        type: 'choice',
                        text: '你要怎么回答？',
                        options: [
                            { text: '「我来了。这一次不会走。」', next: '1.0.0.1.5' },
                            { text: '（沉默地握住她的手）', next: '1.0.0.1.5' },
                        ],
                        next: '',
                    },
                    {
                        id: '5',
                        type: 'dialogue',
                        speaker: '林',
                        text: '很好。那就把这棵树的名字，记在你的剑上。',
                        avatars: [{ slot: 1, key: 'lin', name: '林', facing: 1 }],
                        next: '1.0.0.2.1',
                    },
                ],
            },
            '1.0.0.2': {
                meta: { title: '余响' },
                nodes: [
                    {
                        id: '1',
                        type: 'dialogue',
                        speaker: '遥',
                        text: '（远处传来钟声，第一片叶子落了下来。）',
                        avatars: [{ slot: 1, key: 'yao', name: '遥', facing: -1 }],
                        next: '',
                    },
                    { id: '2', type: 'action', action: 'end', next: '' },
                ],
            },
        },
        assets: {},
        glossary: {
            古木: '传说中承载丰饶之名的巨树，向它许愿会听见自己的回声。',
            回声: '剧情里用来指代「被记住的人」的隐喻。',
        },
        items: {
            item_1: { name: '丰饶之叶', type: 'item', desc: '古木落下的第一片叶子，边缘还带着光。', iconKey: 'lin' },
            item_2: { name: '林的信', type: 'letter', desc: '「若你读到这封信，请替我把树种回去。」', iconKey: 'yao' },
        },
    }
}

export interface GeneratedAsset {
    key: string
    filename: string
    blob: Blob
}

function canvasOf(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    return { canvas, ctx }
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('canvas.toBlob 失败'))), 'image/png')
    })
}

/** 背景：竖直渐变 + 光斑 + 远景树影 */
async function makeForest(): Promise<Blob> {
    const W = 1280
    const H = 720
    const { canvas, ctx } = canvasOf(W, H)
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#14203a')
    sky.addColorStop(0.45, '#1d3b4a')
    sky.addColorStop(1, '#0b1220')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, H)

    // 天光
    const glow = ctx.createRadialGradient(W * 0.62, H * 0.28, 20, W * 0.62, H * 0.28, 420)
    glow.addColorStop(0, 'rgba(180,220,255,0.45)')
    glow.addColorStop(1, 'rgba(180,220,255,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, H)

    // 远景树影
    ctx.fillStyle = 'rgba(8,16,26,0.85)'
    for (let i = 0; i < 26; i++) {
        const x = (i / 26) * W + ((i * 37) % 40)
        const h = 180 + ((i * 53) % 160)
        ctx.beginPath()
        ctx.moveTo(x - 26, H)
        ctx.lineTo(x, H - h)
        ctx.lineTo(x + 26, H)
        ctx.closePath()
        ctx.fill()
    }

    // 地面雾
    const fog = ctx.createLinearGradient(0, H * 0.6, 0, H)
    fog.addColorStop(0, 'rgba(120,190,190,0)')
    fog.addColorStop(1, 'rgba(90,170,170,0.30)')
    ctx.fillStyle = fog
    ctx.fillRect(0, H * 0.6, W, H * 0.4)

    return toBlob(canvas)
}

/** 立绘：底部渐隐的剪影 + 高光边，颜色由 seed 决定 */
async function makeAvatar(seed: number, label: string): Promise<Blob> {
    const W = 420
    const H = 760
    const { canvas, ctx } = canvasOf(W, H)
    const hue = seed % 2 === 0 ? '#8b7bff' : '#38d9c9'
    const dark = seed % 2 === 0 ? '#241a4d' : '#0f3a38'

    // 身体
    const body = ctx.createLinearGradient(0, 120, 0, H)
    body.addColorStop(0, hue)
    body.addColorStop(1, dark)
    ctx.fillStyle = body

    ctx.beginPath()
    ctx.moveTo(W * 0.5, 130)
    // 头
    ctx.arc(W * 0.5, 150, 74, Math.PI, 0)
    // 肩到裙摆
    ctx.lineTo(W * 0.86, 340)
    ctx.quadraticCurveTo(W * 0.98, 520, W * 0.8, H)
    ctx.lineTo(W * 0.2, H)
    ctx.quadraticCurveTo(W * 0.02, 520, W * 0.14, 340)
    ctx.closePath()
    ctx.fill()

    // 衣褶
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'
    ctx.lineWidth = 3
    for (let i = 0; i < 6; i++) {
        ctx.beginPath()
        ctx.moveTo(W * (0.26 + i * 0.1), 380)
        ctx.quadraticCurveTo(W * (0.3 + i * 0.1), 560, W * (0.24 + i * 0.1), H - 30)
        ctx.stroke()
    }

    // 底部渐隐，方便和背景融合
    const fade = ctx.createLinearGradient(0, H * 0.72, 0, H)
    fade.addColorStop(0, 'rgba(0,0,0,0)')
    fade.addColorStop(1, 'rgba(0,0,0,0.85)')
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = fade
    ctx.fillRect(0, H * 0.72, W, H * 0.28)
    ctx.globalCompositeOperation = 'source-over'

    // 名字水印，方便一眼看出哪个 key 对应哪个立绘
    ctx.font = 'bold 44px sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.textAlign = 'center'
    ctx.fillText(label, W / 2, 240)

    return toBlob(canvas)
}

/** 生成示例所需的 3 张占位图（背景 + 两个立绘） */
export async function sampleAssets(): Promise<GeneratedAsset[]> {
    return [
        { key: 'forest', filename: 'forest.png', blob: await makeForest() },
        { key: 'lin', filename: 'lin.png', blob: await makeAvatar(0, '林') },
        { key: 'yao', filename: 'yao.png', blob: await makeAvatar(1, '遥') },
    ]
}
