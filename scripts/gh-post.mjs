import { copyFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// GitHub Pages 没有服务端重写：未知路径会返回 404.html。
// 把 index.html 复制成 404.html，React Router 就能接管深链接（/explore、/game/xxx）。
const dist = 'dist';
const index = join(dist, 'index.html');

if (!existsSync(index)) {
  console.error('缺少 dist/index.html，先跑 vite build');
  process.exit(1);
}

copyFileSync(index, join(dist, '404.html'));
// 关掉 Jekyll 处理，避免下划线开头的文件被忽略
writeFileSync(join(dist, '.nojekyll'), '');

console.log('GitHub Pages 产物就绪：404.html + .nojekyll');
