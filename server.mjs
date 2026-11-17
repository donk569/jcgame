import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 生产用的极简静态服务器：
 * - 读 process.env.PORT（发布沙箱只给一个端口）
 * - 绑定 0.0.0.0
 * - SPA 回退：非静态资源的路由一律返回 index.html，保证 /explore、/game/xxx 能直接打开
 */

// 线上读 site/（随源码上传的构建产物），本地没有时退回 dist/
const SITE = fileURLToPath(new URL('./site/', import.meta.url));
const DIST = fileURLToPath(new URL('./dist/', import.meta.url));
const ROOT = existsSync(join(SITE, 'index.html')) ? SITE : DIST;
const PORT = Number(process.env.PORT || 3000);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

async function send(res, filePath, status = 200) {
  const buf = await readFile(filePath);
  res.writeHead(status, {
    'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream',
    'Cache-Control': filePath.endsWith('.html')
      ? 'no-cache'
      : 'public, max-age=31536000, immutable',
  });
  res.end(buf);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const clean = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
    let filePath = join(ROOT, clean);

    if (clean !== '/' && clean !== '') {
      try {
        const info = await stat(filePath);
        if (info.isDirectory()) filePath = join(filePath, 'index.html');
      } catch {
        // 不是文件：交给下面的 SPA 回退
        filePath = join(ROOT, 'index.html');
      }
    } else {
      filePath = join(ROOT, 'index.html');
    }

    await send(res, filePath);
  } catch {
    try {
      await send(res, join(ROOT, 'index.html'));
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404');
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`jcgame listening on http://0.0.0.0:${PORT}`);
});
