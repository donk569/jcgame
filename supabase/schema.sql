-- =============================================================
-- JCGame 数据库结构
-- 在 Supabase Dashboard → SQL Editor 里整段粘贴执行一次
-- =============================================================

-- ---------- 用户资料（对应 auth.users） ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  handle     text unique not null,
  name       text not null,
  bio        text not null default '',
  site       text not null default '',
  created_at timestamptz default now()
);

-- ---------- 开发者主页 ----------
create table if not exists public.creators (
  handle    text primary key,
  name      text not null,
  bio       text not null default '',
  followers integer not null default 0,
  since     text,
  location  text default '',
  accent    text default '#8e6bff',
  links     jsonb not null default '[]'::jsonb
);

-- ---------- 作品 ----------
create table if not exists public.games (
  slug          text primary key,
  title         text not null,
  title_cn      text not null,
  tagline       text not null default '',
  description   jsonb not null default '[]'::jsonb,
  studio        jsonb not null default '{}'::jsonb,   -- { name, handle }
  engine        text not null default '',
  engine_version text not null default '',
  categories    jsonb not null default '[]'::jsonb,
  tags          jsonb not null default '[]'::jsonb,
  run_mode      text not null default 'web',          -- web | download
  platforms     jsonb not null default '[]'::jsonb,
  version       text not null default '0.1.0',
  updated_at    date default current_date,
  released_at   date default current_date,
  plays         integer not null default 0,
  likes         integer not null default 0,
  price         text not null default 'free',
  cover         text not null default '',
  keyart        text,
  shots         jsonb not null default '[]'::jsonb,
  web_build     jsonb,
  download      jsonb,
  changelog     jsonb not null default '[]'::jsonb,
  featured      boolean not null default false,
  owner         uuid references auth.users(id) on delete set null
);

-- ---------- 草稿（只有本人可见） ----------
create table if not exists public.drafts (
  id         uuid primary key default gen_random_uuid(),
  owner      uuid not null references auth.users(id) on delete cascade,
  title      text not null default '',
  payload    jsonb not null default '{}'::jsonb,
  progress   integer not null default 0,
  updated_at timestamptz default now()
);

-- ---------- 玩家留言 ----------
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  game_slug   text references public.games(slug) on delete cascade,
  author      uuid references auth.users(id) on delete set null,
  author_name text not null,
  body        text not null,
  reply       text,
  replied_at  timestamptz,
  created_at  timestamptz default now()
);

-- ---------- 收藏 / 点赞 ----------
create table if not exists public.user_games (
  user_id uuid not null references auth.users(id) on delete cascade,
  slug    text not null references public.games(slug) on delete cascade,
  liked   boolean not null default false,
  saved   boolean not null default false,
  primary key (user_id, slug)
);

-- ---------- 关注 ----------
create table if not exists public.follows (
  user_id uuid not null references auth.users(id) on delete cascade,
  handle  text not null references public.creators(handle) on delete cascade,
  primary key (user_id, handle)
);

-- =============================================================
-- 行级安全
-- =============================================================
alter table public.profiles  enable row level security;
alter table public.creators  enable row level security;
alter table public.games     enable row level security;
alter table public.drafts    enable row level security;
alter table public.comments  enable row level security;
alter table public.user_games enable row level security;
alter table public.follows   enable row level security;

-- 公开可读
drop policy if exists "profiles 公开可读" on public.profiles;
create policy "profiles 公开可读" on public.profiles  for select using (true);
drop policy if exists "creators 公开可读" on public.creators;
create policy "creators 公开可读" on public.creators  for select using (true);
drop policy if exists "games 公开可读" on public.games;
create policy "games 公开可读" on public.games     for select using (true);
drop policy if exists "comments 公开可读" on public.comments;
create policy "comments 公开可读" on public.comments  for select using (true);

-- 本人可写
drop policy if exists "本人改资料" on public.profiles;
create policy "本人改资料" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "登录后可建档" on public.profiles;
create policy "登录后可建档" on public.profiles
  for insert with check (auth.uid() = id);

-- 发布作品：登录用户可以插入，且 owner 必须是自己
drop policy if exists "登录后可发布作品" on public.games;
create policy "登录后可发布作品" on public.games
  for insert with check (auth.uid() = owner);

drop policy if exists "作者可改自己作品" on public.games;
create policy "作者可改自己作品" on public.games for update using (auth.uid() = owner) with check (auth.uid() = owner);

-- 草稿：只有本人
drop policy if exists "本人看草稿" on public.drafts;
create policy "本人看草稿" on public.drafts for select using (auth.uid() = owner);
drop policy if exists "本人写草稿" on public.drafts;
create policy "本人写草稿" on public.drafts
  for insert with check (auth.uid() = owner);
drop policy if exists "本人改草稿" on public.drafts;
create policy "本人改草稿" on public.drafts for update using (auth.uid() = owner) with check (auth.uid() = owner);
drop policy if exists "本人删草稿" on public.drafts;
create policy "本人删草稿" on public.drafts
  for delete using (auth.uid() = owner);

-- 留言：登录可发；作者本人或作品所有者可回复
drop policy if exists "登录后可留言" on public.comments;
create policy "登录后可留言" on public.comments
  for insert with check (auth.uid() = author);

drop policy if exists "作品所有者可回复" on public.comments;
create policy "作品所有者可回复" on public.comments
  for update using (
    auth.uid() = author
    or exists (
      select 1 from public.games g
      where g.slug = comments.game_slug and g.owner = auth.uid()
    )
  );

-- 收藏点赞：仅本人
drop policy if exists "本人读收藏" on public.user_games;
create policy "本人读收藏" on public.user_games for select using (auth.uid() = user_id);
drop policy if exists "本人写收藏" on public.user_games;
create policy "本人写收藏" on public.user_games for insert with check (auth.uid() = user_id);
drop policy if exists "本人改收藏" on public.user_games;
create policy "本人改收藏" on public.user_games for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "本人删收藏" on public.user_games;
create policy "本人删收藏" on public.user_games for delete using (auth.uid() = user_id);

-- 关注：仅本人
drop policy if exists "本人读关注" on public.follows;
create policy "本人读关注" on public.follows for select using (auth.uid() = user_id);
drop policy if exists "本人写关注" on public.follows;
create policy "本人写关注" on public.follows for insert with check (auth.uid() = user_id);
drop policy if exists "本人删关注" on public.follows;
create policy "本人删关注" on public.follows for delete using (auth.uid() = user_id);

-- =============================================================
-- 索引
-- =============================================================
create index if not exists idx_games_studio      on public.games ((studio->>'handle'));
create index if not exists idx_games_categories  on public.games using gin (categories);
create index if not exists idx_games_tags        on public.games using gin (tags);
create index if not exists idx_comments_game    on public.comments (game_slug);
create index if not exists idx_drafts_owner      on public.drafts (owner);

-- 兼容旧版本：since 曾被定义为 date，但数据是 "2025-03" 年月格式。
-- 改成 text 后原样存取；已是 text 时本语句为 no-op，不会报错。
alter table public.creators
  alter column since type text using since::text;

-- =============================================================
-- 补充授权
-- 用 SQL Editor 直接建表时，PostgREST 连接用的角色拿不到表权限，
-- 需要显式授权（Dashboard 的 Table Editor 建表会自动做这一步，手写 SQL 不会）。
-- =============================================================

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
