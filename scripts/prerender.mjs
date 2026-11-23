import { build } from 'esbuild';
import {
  existsSync, mkdirSync, readFileSync, writeFileSync, rmSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * 游戏详情页预渲染：给每款已上架游戏生成 dist/game/<slug>/index.html，
 * 里面带这款游戏专属的 title / og 标签。
 *
 * 为什么需要：微信/QQ 等社交爬虫不执行 JS，抓 SPA 时只能看到 index.html 里
 * 写死的默认 meta。生成静态 HTML 后，它们直接就能读到正确的封面和标题。
 * 浏览器访问这些路径时，React 应用照常接管，行为不变。
 *
 * 游戏数据取自 src/api/mock.ts（构建时离线可用，不依赖网络）。
 * 线上新发布的游戏在下次构建时会自动包含进来。
 */

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');
const TEMPLATE = join(DIST, 'index.html');
// SITE_URL 只到域名（不含子路径），子路径由 BASE 单独提供，避免重复拼接。
const SITE_URL = (process.env.SITE_URL ?? 'https://donk569.github.io').replace(/\/$/, '');
const BASE = (process.env.BASE_PATH ?? (process.argv.includes('--gh') ? '/jcgame' : '')).replace(/\/$/, '');

if (!existsSync(TEMPLATE)) {
  console.error('缺少 dist/index.html，先跑 vite build');
  process.exit(1);
}

// 数据源优先级：scripts/prerender-games.json（线上真实游戏快照） > mock.ts
// 快照文件由 scripts/sync-games.mjs 从 Supabase 生成，包含线上新发布的作品。
const SNAPSHOT = join(ROOT, 'scripts/prerender-games.json');
let games;
if (existsSync(SNAPSHOT)) {
  games = JSON.parse(readFileSync(SNAPSHOT, 'utf8'));
  console.log(`使用线上游戏快照：${games.length} 款`);
} else {
  // 用 esbuild 把 mock.ts 转成可在 node 里执行的模块
  const bundleResult = await build({
    entryPoints: [join(ROOT, 'src/api/mock.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
    // 固定用 '/'：让 mock 的 A() 产出 /art/...，BASE 只在 absoluteAsset 里加一次
    define: { 'import.meta.env.BASE_URL': JSON.stringify('/') },
  });
  const bundlePath = join(ROOT, '.prerender-mock.mjs');
  writeFileSync(bundlePath, bundleResult.outputFiles[0].text);
  try {
    const module = await import(pathToFileURL(bundlePath).href);
    games = module.mockGames;
  } finally {
    rmSync(bundlePath, { force: true });
  }
  console.log(`使用 mock 数据：${games.length} 款（运行 npm run sync:games 可生成线上快照）`);
}

const template = readFileSync(TEMPLATE, 'utf8');
const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/**
 * 把图片路径变成社交爬虫能用的绝对 URL。
 * 兼容三种输入：完整 URL、/art/covers/x.webp（mock）、covers/x.webp（线上快照）。
 */
function absoluteAsset(path) {
  const fallback = `${SITE_URL}${BASE}/art/keyart/neon-drift-keyart.webp`;
  if (!path) return fallback;
  if (/^https?:\/\//i.test(path)) return path;
  let clean = path.replace(/^\//, '');
  // 线上快照存的是 covers/xx.webp，mock 存的是 art/covers/xx.webp，统一到 art/ 前缀
  if (!clean.startsWith('art/')) clean = `art/${clean}`;
  return `${SITE_URL}${BASE ? `/${BASE.replace(/^\//, '')}` : ''}/${clean}`;
}

/** 替换 <meta ... content="...">，找不到就追加到 head 末尾 */
function setMeta(html, attribute, key, content) {
  const pattern = new RegExp(`<meta\\s+${attribute}="${key}"\\s+content="[^"]*"\\s*/?>`);
  const replacement = `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`;
  if (pattern.test(html)) return html.replace(pattern, replacement);
  return html.replace('</head>', `  ${replacement}\n  </head>`);
}

function setTitle(html, title) {
  return html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`);
}

let count = 0;
for (const game of games) {
  if (!game?.slug) continue;
  const title = `${game.titleCn} — JCGame`;
  const description = game.tagline || `在 JCGame 试玩或下载《${game.titleCn}》`;
  const image = absoluteAsset(game.keyart ?? game.cover);
  const canonical = `${SITE_URL}${BASE}/game/${game.slug}/`;

  let html = template;
  html = setTitle(html, title);
  html = setMeta(html, 'name', 'description', description);
  html = setMeta(html, 'property', 'og:title', title);
  html = setMeta(html, 'property', 'og:description', description);
  html = setMeta(html, 'property', 'og:image', image);
  html = setMeta(html, 'property', 'og:url', canonical);
  html = setMeta(html, 'property', 'og:type', 'website');
  html = setMeta(html, 'name', 'twitter:card', 'summary_large_image');
  html = setMeta(html, 'name', 'twitter:title', title);
  html = setMeta(html, 'name', 'twitter:description', description);
  html = setMeta(html, 'name', 'twitter:image', image);
  html = html.replace(
    /<link\s+rel="preload"\s+as="image"\s+href="[^"]*"\s*\/?>/,
    `<link rel="preload" as="image" href="${escapeHtml(image)}" />`,
  );
  html = html.replace('</head>', `  <link rel="canonical" href="${escapeHtml(canonical)}" />\n  </head>`);

  const dir = join(DIST, 'game', game.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
  count += 1;
}

console.log(`预渲染完成：${count} 个游戏详情页（base=${BASE || '/'}，站点=${SITE_URL}）`);
