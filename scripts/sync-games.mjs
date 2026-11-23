import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

/**
 * 从 Supabase 拉已上架游戏，生成 scripts/prerender-games.json 快照。
 * 发布新游戏后跑一次 `npm run sync:games`，再 build:gh，
 * 新游戏就有专属的社交分享卡片了。
 *
 * 需要 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY（从 .env.local 读取）。
 * 失败时保留旧快照，不覆盖。
 */
const ROOT = process.cwd();
const SNAPSHOT = join(ROOT, 'scripts/prerender-games.json');

function readEnv(name) {
  for (const file of ['.env.local', '.env']) {
    const path = join(ROOT, file);
    if (!existsSync(path)) continue;
    const line = readFileSync(path, 'utf8').split(/\r?\n/).find((l) => l.startsWith(`${name}=`));
    if (line) return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, '');
  }
  return '';
}

const url = readEnv('VITE_SUPABASE_URL');
const key = readEnv('VITE_SUPABASE_ANON_KEY');
if (!url || !key) {
  console.error('缺少 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY，无法同步游戏快照');
  process.exit(1);
}

try {
  // 国内直连 Supabase 会被干扰，优先用 curl 走环境代理；
  // curl 不可用时退回 Node fetch（海外/代理透明的环境可用）。
  const api = `${url}/rest/v1/games?select=slug,title,title_cn,tagline,cover,keyart&review_state=eq.approved&order=slug`;
  let rows;
  try {
    const output = execFileSync('curl', [
      '-sS', '--max-time', '25', api,
      '-H', `apikey: ${key}`, '-H', `Authorization: Bearer ${key}`,
    ], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
    rows = JSON.parse(output);
    if (!Array.isArray(rows)) throw new Error('响应格式异常');
  } catch {
    const response = await fetch(api, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    rows = await response.json();
  }
  const games = rows.map((r) => ({
    slug: r.slug,
    title: r.title ?? r.title_cn,
    titleCn: r.title_cn ?? r.title,
    tagline: r.tagline ?? '',
    cover: r.cover ?? '',
    keyart: r.keyart ?? null,
  }));
  if (games.length === 0) throw new Error('线上没有已上架游戏，保留旧快照');
  writeFileSync(SNAPSHOT, `${JSON.stringify(games, null, 2)}\n`);
  console.log(`已同步 ${games.length} 款线上游戏到 scripts/prerender-games.json`);
} catch (error) {
  console.error(`同步失败：${error instanceof Error ? error.message : String(error)}（旧快照保留）`);
  process.exit(1);
}
