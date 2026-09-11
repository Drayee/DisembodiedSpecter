// server.js — 本地静态服务（无需任何依赖，供双击 start.cmd 使用）
// 用途：ES 模块不能从 file:// 直接加载，需要一个 http 服务；此脚本用 Node 内置模块实现。
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 7788);

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.zip': 'application/zip',
};

const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    let target = path.join(ROOT, urlPath);
    if (!target.startsWith(ROOT)) {
        res.writeHead(403).end('forbidden');
        return;
    }
    fs.stat(target, (err, st) => {
        if (!err && st.isDirectory()) target = path.join(target, 'index.html');
        fs.readFile(target, (err2, buf) => {
            if (err2) {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 ' + urlPath);
                return;
            }
            res.writeHead(200, { 'Content-Type': MIME[path.extname(target).toLowerCase()] || 'application/octet-stream' });
            res.end(buf);
        });
    });
});

server.listen(PORT, () => {
    const url = `http://localhost:${PORT}/`;
    console.log('剧情编排工具已启动：' + url);
    console.log('按 Ctrl+C 结束服务。');
    if (process.platform === 'win32') exec(`start "" "${url}"`);
});
