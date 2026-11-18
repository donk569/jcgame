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
  since     date,
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
create policy "profiles 公开可读"  on public.profiles  for select using (true);
create policy "creators 公开可读"  on public.creators  for select using (true);
create policy "games 公开可读"     on public.games     for select using (true);
create policy "comments 公开可读"  on public.comments  for select using (true);

-- 本人可写
create policy "本人改资料" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "登录后可建档" on public.profiles
  for insert with check (auth.uid() = id);

-- 发布作品：登录用户可以插入，且 owner 必须是自己
create policy "登录后可发布作品" on public.games
  for insert with check (auth.uid() = owner);

create policy "作者可改自己作品" on public.games
  for update using (auth.uid() = owner) with check (auth.uid() = owner);

-- 草稿：只有本人
create policy "本人看草稿" on public.drafts
  for select using (auth.uid() = owner);
create policy "本人写草稿" on public.drafts
  for insert with check (auth.uid() = owner);
create policy "本人改草稿" on public.drafts
  for update using (auth.uid() = owner) with check (auth.uid() = owner);
create policy "本人删草稿" on public.drafts
  for delete using (auth.uid() = owner);

-- 留言：登录可发；作者本人或作品所有者可回复
create policy "登录后可留言" on public.comments
  for insert with check (auth.uid() = author);

create policy "作品所有者可回复" on public.comments
  for update using (
    auth.uid() = author
    or exists (
      select 1 from public.games g
      where g.slug = comments.game_slug and g.owner = auth.uid()
    )
  );

-- 收藏点赞：仅本人
create policy "本人读收藏" on public.user_games for select using (auth.uid() = user_id);
create policy "本人写收藏" on public.user_games for insert with check (auth.uid() = user_id);
create policy "本人改收藏" on public.user_games for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "本人删收藏" on public.user_games for delete using (auth.uid() = user_id);

-- 关注：仅本人
create policy "本人读关注" on public.follows for select using (auth.uid() = user_id);
create policy "本人写关注" on public.follows for insert with check (auth.uid() = user_id);
create policy "本人删关注" on public.follows for delete using (auth.uid() = user_id);

-- =============================================================
-- 索引
-- =============================================================
create index if not exists idx_games_studio      on public.games ((studio->>'handle'));
create index if not exists idx_games_categories  on public.games using gin (categories);
create index if not exists idx_games_tags        on public.games using gin (tags);
create index if not exists idx_comments_game    on public.comments (game_slug);
create index if not exists idx_drafts_owner      on public.drafts (owner);
-- 由 scripts/gen-seed.mjs 自动生成，共 12 款游戏、6 位创作者

insert into public.creators (handle, name, bio, followers, since, location, accent, links) values
(
  'nightrunner', '夜行者工作室', '两个人，一台旧工作站，只做雨夜里的车。', 8412, '2025-03',
  '中国 重庆', '#ff7a45', '[{"label":"Bilibili","url":"#"},{"label":"GitHub","url":"#"}]'::jsonb
),
(
  'roadfive', '五号公路', '做走路游戏。前地图测绘员，喜欢把真实地形塞进游戏里。', 3920, '2024-11',
  '中国 哈尔滨', '#6ea8c9', '[{"label":"个人站","url":"#"}]'::jsonb
),
(
  'mojian', '墨见', '三个人，一支笔，一个关于留白的执念。', 15230, '2023-06',
  '中国 杭州', '#c8553d', '[{"label":"Bilibili","url":"#"},{"label":"X","url":"#"}]'::jsonb
),
(
  'triplefold', '三叠工作室', '只做能在浏览器里 3 秒打开的游戏。', 6180, '2024-02',
  '中国 成都', '#8a9b4e', '[{"label":"GitHub","url":"#"}]'::jsonb
),
(
  'stillwater', '静水', '一个人。白天写后端，晚上做让人不敢关灯的东西。', 2740, '2025-01',
  '中国 深圳', '#4e8f96', '[{"label":"个人站","url":"#"}]'::jsonb
),
(
  'jc', 'jc', '关卡设计师，业余做游戏，偏爱光与影。', 1980, '2024-08',
  '中国 深圳', '#8f7bb0', '[{"label":"Bilibili","url":"#"}]'::jsonb
)
on conflict (handle) do nothing;

insert into public.games (
  slug, title, title_cn, tagline, description, studio, engine, engine_version,
  categories, tags, run_mode, platforms, version, updated_at, released_at,
  plays, likes, price, cover, keyart, shots, web_build, download, changelog, featured
) values
(
  'neon-drift', 'Neon Drift', '霓虹漂移', '雨夜、没有刹车、只有一条街和八秒钟。',
  '["《霓虹漂移》是一款纯粹到有点固执的街机竞速。没有车辆改装树，没有开放世界，只有 14 条雨夜街道、一套物理手感和一个要求你把每个弯都跑成直线的计时榜。","抓地力被刻意调低，车身惯性保留到近乎失控。你要做的是在入弯前 0.3 秒松开油门，用一次下滑把车头压回出弯线——做对了，整条街会安静下来，只剩雨刷和引擎的回声。","本作由两个人在 11 个月里完成，网页版本为完整游戏，无内购、无账号要求，进度保存在本地。"]'::jsonb, '{"name":"夜行者工作室","handle":"nightrunner"}'::jsonb, 'Unity', '2022.3.42f1',
  '["竞速","街机"]'::jsonb, '["雨夜","低多边形","排行榜","单人"]'::jsonb, 'web', '["Web"]'::jsonb,
  '1.4.2', '2026-11-09', '2025-08-21', 184320, 12840, 'free',
  'covers/neon-drift.webp', 'keyart/neon-drift-keyart.webp', '["shots/neon-drift-01.webp","shots/neon-drift-02.webp","shots/neon-drift-03.webp"]'::jsonb,
  '{"entry":"index.html","engineVersion":"2022.3.42f1","bytes":62914560,"host":"neon-drift.jcgame.run"}'::jsonb, null,
  '[{"version":"1.4.2","date":"2026-11-09","notes":["修复暴雨场景在 120Hz 屏幕上物理步进抖动的问题","为第 9 条赛道补充夜间雾效","计时榜新增按地区筛选"]},{"version":"1.3.0","date":"2026-08-30","notes":["新增第 13、14 条赛道","手柄支持（XInput / DualShock）","降低首次加载资源体积约 18%"]}]'::jsonb, true
),
(
  'tundra-courier', 'Tundra Courier', '冻原信使', '极夜里，把一封信送到地图上不存在的地方。',
  '["你是一个在极圈内送信的人。没有战斗，没有经验值，只有体温、风力和一封必须在冬天结束前送达的信。","游戏把\"走路\"做成了核心机制：雪深决定速度，风向决定体温流失，而每一步都会改变你回程的路线。全程约 6 小时，一次通关不会看到全部岔路。"]'::jsonb, '{"name":"五号公路","handle":"roadfive"}'::jsonb, 'Godot', '4.3',
  '["探索","叙事"]'::jsonb, '["雪原","步行模拟","无战斗","水彩"]'::jsonb, 'web', '["Web","Windows"]'::jsonb,
  '0.9.7', '2026-11-02', '2026-03-14', 41230, 5210, 'free',
  'covers/tundra-courier.webp', null, '[]'::jsonb,
  '{"entry":"index.html","engineVersion":"4.3","bytes":28311552,"host":"tundra.jcgame.run"}'::jsonb, null,
  '[{"version":"0.9.7","date":"2026-11-02","notes":["重做第四章的风向计算","修复存档在浏览器刷新后丢失"]}]'::jsonb, true
),
(
  'ink-tide', 'Ink Tide', '墨潮', '水墨画的留白里，藏着会动的东西。',
  '["《墨潮》把动作游戏放进一张宣纸里。画面只用墨、水和一点朱红，你的每一次挥击都会在纸上留下不可撤销的一笔——打完整场战斗，纸上会留下一幅属于你的画。","战斗节奏偏向一击必杀：敌人和你都只有一次机会。这不是难度炫耀，而是为了让每一笔都有分量。"]'::jsonb, '{"name":"墨见","handle":"mojian"}'::jsonb, 'Unreal Engine', '5.4',
  '["动作","冒险"]'::jsonb, '["水墨","一击必杀","横版","东方"]'::jsonb, 'download', '["Windows"]'::jsonb,
  '1.0.3', '2026-10-28', '2025-12-05', 96840, 8930, 'paid',
  'covers/ink-tide.webp', null, '[]'::jsonb,
  null, '{"platform":"Windows","arch":"x64","bytes":3221225472,"file":"InkTide-1.0.3-win64.zip","requirements":[{"label":"系统","value":"Windows 10 1909 或更新"},{"label":"处理器","value":"Intel i5-8400 / Ryzen 5 2600"},{"label":"显卡","value":"GTX 1060 6GB / RX 580"},{"label":"内存","value":"8 GB"},{"label":"存储","value":"4 GB 可用空间"}]}'::jsonb,
  '[{"version":"1.0.3","date":"2026-10-28","notes":["修复第 12 章 Boss 战在低帧率下的判定错误","新增手柄震动强度设置"]}]'::jsonb, true
),
(
  'pixel-ronin', 'Pixel Ronin', '像素浪人', '每一次死亡，都会让桥上的枫叶落得更快。',
  '["一款 16 位风格的 Roguelike 动作游戏。你的角色只有一击的血量，但可以在死亡前\"读\"到敌人下一次出刀的方向。","每局 15 分钟，共 9 座桥、40 种敌人组合。真正的进度不是数值，而是你记住的那些节奏。"]'::jsonb, '{"name":"三叠工作室","handle":"triplefold"}'::jsonb, 'HTML5', 'ES2022',
  '["动作","Roguelike"]'::jsonb, '["像素","一击必杀","街机","快节奏"]'::jsonb, 'web', '["Web"]'::jsonb,
  '2.1.0', '2026-11-11', '2025-06-02', 312400, 21870, 'free',
  'covers/pixel-ronin.webp', null, '[]'::jsonb,
  '{"entry":"index.html","engineVersion":"ES2022","bytes":8808448,"host":"ronin.jcgame.run"}'::jsonb, null,
  '[{"version":"2.1.0","date":"2026-11-11","notes":["新增第 9 座桥","支持键盘自定义键位"]}]'::jsonb, false
),
(
  'teeth-of-the-deep', 'Teeth of the Deep', '深喉', '灯照到的地方，就是它想让你看到的地方。',
  '["深海作业潜艇失联 46 小时后，你是唯一下去的人。手电电量有限，氧气有限，而黑暗里的东西似乎很享受你把灯打开。","恐怖来自资源而不是跳脸：你每照亮一次，就离黑暗更近一点。全程约 4 小时，支持手柄。"]'::jsonb, '{"name":"静水","handle":"stillwater"}'::jsonb, 'Unity', '2022.3.38f1',
  '["恐怖","探索"]'::jsonb, '["深海","资源管理","第一人称","单人"]'::jsonb, 'download', '["Windows"]'::jsonb,
  '1.2.0', '2026-10-19', '2026-02-27', 74820, 7420, 'paid',
  'covers/teeth-of-the-deep.webp', null, '[]'::jsonb,
  null, '{"platform":"Windows","arch":"x64","bytes":2040109056,"file":"TeethOfTheDeep-1.2.0-win64.zip","requirements":[{"label":"系统","value":"Windows 10 64 位"},{"label":"处理器","value":"Intel i5-7400 / Ryzen 3 3200G"},{"label":"显卡","value":"GTX 970 / RX 570"},{"label":"内存","value":"8 GB"},{"label":"存储","value":"3 GB 可用空间"}]}'::jsonb,
  '[{"version":"1.2.0","date":"2026-10-19","notes":["新增\"静默\"难度","修复第 3 区手电电量不刷新"]}]'::jsonb, false
),
(
  'last-train', 'Last Train', '末班车', '凌晨三点，站台上还有一个人没上车。',
  '["一款只有对话的叙事游戏。你在末班地铁上遇到五个人，每个人都在回避同一件事。你能做的只有听完，以及在到站前决定要不要开口。","没有分支树，没有选项提示。你说话的方式会改变他们下车时的状态，而你不会知道改了什么。"]'::jsonb, '{"name":"冷光","handle":"coldlight"}'::jsonb, 'Unity', '6000.0.32f1',
  '["叙事","视觉小说"]'::jsonb, '["都市","对话","短篇","中文"]'::jsonb, 'download', '["Windows","macOS"]'::jsonb,
  '1.0.1', '2026-09-30', '2026-05-16', 52310, 6180, 'free',
  'covers/last-train.webp', null, '[]'::jsonb,
  null, '{"platform":"Windows","arch":"x64","bytes":812646400,"file":"LastTrain-1.0.1-win64.zip","requirements":[{"label":"系统","value":"Windows 10 64 位 / macOS 13"},{"label":"处理器","value":"双核 2.4 GHz"},{"label":"显卡","value":"集成显卡即可"},{"label":"内存","value":"4 GB"},{"label":"存储","value":"1 GB 可用空间"}]}'::jsonb,
  '[]'::jsonb, false
),
(
  'iron-harvest', 'Iron Harvest 1919', '铁收割', '用收割机改装成的战争机器，去守住最后一片麦田。',
  '["回合制战术策略。你指挥一支由农业机械改装而来的民兵部队，在 1919 年的东欧平原上守住村庄的收成。","单位不是消耗品：每一台机器都有名字、服役记录和磨损，损失了就真的没有了。战役共 18 关。"]'::jsonb, '{"name":"铁砧游戏","handle":"anvil"}'::jsonb, 'Unreal Engine', '5.3',
  '["策略","回合制"]'::jsonb, '["柴油朋克","战术","战役","长线"]'::jsonb, 'download', '["Windows","Linux"]'::jsonb,
  '1.6.0', '2026-11-14', '2024-11-08', 128900, 11240, 'paid',
  'covers/iron-harvest.webp', null, '[]'::jsonb,
  null, '{"platform":"Windows","arch":"x64","bytes":7516192768,"file":"IronHarvest-1.6.0-win64.zip","requirements":[{"label":"系统","value":"Windows 10 / 11 64 位"},{"label":"处理器","value":"Intel i5-9600K / Ryzen 5 3600"},{"label":"显卡","value":"RTX 2060 / RX 5700"},{"label":"内存","value":"16 GB"},{"label":"存储","value":"8 GB 可用空间"}]}'::jsonb,
  '[]'::jsonb, false
),
(
  'acorn-house', 'Acorn House', '橡果小屋', '把一颗橡果，慢慢改成一个家。',
  '["没有倒计时，没有体力值。你在森林里收集材料，把一颗空橡果改成能住人的房子。","适合睡前玩 20 分钟。音乐由一个人在厨房里录制完成。"]'::jsonb, '{"name":"软木塞","handle":"cork"}'::jsonb, 'Godot', '4.2',
  '["休闲","模拟"]'::jsonb, '["治愈","建造","无压力","低配可玩"]'::jsonb, 'web', '["Web"]'::jsonb,
  '1.1.4', '2026-10-05', '2025-10-12', 224180, 19320, 'free',
  'covers/acorn-house.webp', null, '[]'::jsonb,
  '{"entry":"index.html","engineVersion":"4.2","bytes":18874368,"host":"acorn.jcgame.run"}'::jsonb, null,
  '[]'::jsonb, false
),
(
  'void-basket', 'Void Basket', '零重力篮球', '在地面不存在的球场，规则只剩一条：球进框。',
  '["2v2 零重力篮球。没有走步，没有出界，你可以在空中待 6 秒。","本地分屏 + 网页联机，一局 3 分钟。周末联机人数最多，建议约人一起。"]'::jsonb, '{"name":"抛球","handle":"tossup"}'::jsonb, 'Unity', '2022.3.44f1',
  '["体育","派对"]'::jsonb, '["多人","本地分屏","物理","搞怪"]'::jsonb, 'web', '["Web"]'::jsonb,
  '3.0.1', '2026-11-07', '2025-04-01', 402310, 16720, 'free',
  'covers/void-basket.webp', null, '[]'::jsonb,
  '{"entry":"index.html","engineVersion":"2022.3.44f1","bytes":41360384,"host":"voidbasket.jcgame.run"}'::jsonb, null,
  '[]'::jsonb, false
),
(
  'circuit-bloom', 'Circuit Bloom', '电路花期', '每按对一个节拍，花就开一瓣。',
  '["一款不需要\"手速\"的音游。判定窗口宽，但连击越长音乐层叠得越复杂，你是在和时间一起编曲。","内置 24 首曲目，支持导入自己的音频自动生成谱面（浏览器内完成，不上传）。"]'::jsonb, '{"name":"相位","handle":"phase"}'::jsonb, 'TypeScript', 'Web Audio API',
  '["音乐","休闲"]'::jsonb, '["音游","可导入曲目","极简","浏览器运行"]'::jsonb, 'web', '["Web"]'::jsonb,
  '1.8.0', '2026-11-15', '2026-01-20', 156740, 14210, 'free',
  'covers/circuit-bloom.webp', null, '[]'::jsonb,
  '{"entry":"index.html","engineVersion":"Web Audio API","bytes":5242880,"host":"bloom.jcgame.run"}'::jsonb, null,
  '[]'::jsonb, false
),
(
  'half-light', 'Half-Light', '半光', '灯灭了以后，路才会显出来。',
  '["横版平台跳跃，但光是资源：灯亮时能看清地形，也会吸引东西过来；灯灭时安全，但你只能靠记忆走路。","共 26 个关卡，每个关卡只有一张存档点。"]'::jsonb, '{"name":"jc","handle":"jc"}'::jsonb, 'Unity', '2021.3.45f1',
  '["平台跳跃","解谜"]'::jsonb, '["光影","硬核","像素","单人"]'::jsonb, 'download', '["Windows"]'::jsonb,
  '1.3.2', '2026-08-22', '2025-09-09', 61240, 4980, 'free',
  'covers/half-light.webp', null, '[]'::jsonb,
  null, '{"platform":"Windows","arch":"x64","bytes":356515840,"file":"HalfLight-1.3.2-win64.zip","requirements":[{"label":"系统","value":"Windows 7 SP1 或更新"},{"label":"处理器","value":"双核 2.0 GHz"},{"label":"显卡","value":"支持 DirectX 11"},{"label":"内存","value":"4 GB"},{"label":"存储","value":"500 MB 可用空间"}]}'::jsonb,
  '[]'::jsonb, false
),
(
  'paper-kite', 'Paper Kite', '纸鸢', '把一根线，放到云的那一边。',
  '["手工纸片风格的物理解谜。你只能改变风向和线的长度，让纸鸢飞过 40 个山丘。","所有画面都是纸、剪刀和胶水做出来的，然后逐帧拍摄。"]'::jsonb, '{"name":"剪纸铺","handle":"papercut"}'::jsonb, 'Cocos Creator', '3.8.3',
  '["解谜","休闲"]'::jsonb, '["纸艺","物理","手作","亲子"]'::jsonb, 'web', '["Web"]'::jsonb,
  '1.0.8', '2026-07-18', '2026-04-11', 88910, 8340, 'free',
  'covers/paper-kite.webp', null, '[]'::jsonb,
  '{"entry":"index.html","engineVersion":"3.8.3","bytes":12582912,"host":"paperkite.jcgame.run"}'::jsonb, null,
  '[]'::jsonb, false
)
on conflict (slug) do nothing;

