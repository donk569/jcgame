// 从 src/api/mock.ts 生成 seed SQL（12 款演示游戏 + 5 位创作者）
import { mockGames, mockCreators } from '../src/api/mock.ts';

const q = (v) => {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (Array.isArray(v)) return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
};

// 封面路径去掉 /art/ 前缀与 BASE，存相对路径
const rel = (p) => String(p ?? '').replace(/^\/.*?art\//, '').replace(/^\//, '');

const gameRows = mockGames.map((g) => `(
  ${q(g.slug)}, ${q(g.title)}, ${q(g.titleCn)}, ${q(g.tagline)},
  ${q(g.description)}, ${q(g.studio)}, ${q(g.engine)}, ${q(g.engineVersion)},
  ${q(g.categories)}, ${q(g.tags)}, ${q(g.runMode)}, ${q(g.platforms)},
  ${q(g.version)}, ${q(g.updatedAt)}, ${q(g.releasedAt)}, ${g.plays}, ${g.likes}, ${q(g.price)},
  ${q(rel(g.cover))}, ${g.keyart ? q(rel(g.keyart)) : 'null'}, ${q((g.shots ?? []).map(rel))},
  ${g.webBuild ? q(g.webBuild) : 'null'}, ${g.download ? q(g.download) : 'null'},
  ${q(g.changelog ?? [])}, ${g.featured ? 'true' : 'false'}
)`).join(',\n');

const creatorRows = mockCreators.map((c) => `(
  ${q(c.handle)}, ${q(c.name)}, ${q(c.bio)}, ${c.followers}, ${q(c.since)},
  ${q(c.location)}, ${q(c.accent)}, ${q(c.links)}
)`).join(',\n');

console.log(`-- 由 scripts/gen-seed.mjs 自动生成，共 ${mockGames.length} 款游戏、${mockCreators.length} 位创作者\n`);
console.log(`insert into public.creators (handle, name, bio, followers, since, location, accent, links) values\n${creatorRows}\non conflict (handle) do nothing;\n`);
console.log(`insert into public.games (
  slug, title, title_cn, tagline, description, studio, engine, engine_version,
  categories, tags, run_mode, platforms, version, updated_at, released_at,
  plays, likes, price, cover, keyart, shots, web_build, download, changelog, featured
) values\n${gameRows}\non conflict (slug) do nothing;\n`);
