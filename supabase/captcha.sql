-- =====================================================================
-- JCGame 滑块拼图人机验证 · 服务端部分（Supabase Postgres）
-- =====================================================================
-- 设计原则：
--   1. 答案 answer_x 只存在服务端表里，前端拿不到数值（只拿到画好缺口的 SVG）。
--   2. 挑战随机、5 分钟有效、一次性；验证成功签发短期凭证 token。
--   3. 凭证绑定邮箱、10 分钟有效、一次性消费（注册提交时消费）。
--   4. 创建/验证有限流，验证失败次数有上限。
--   5. 全部用 security definer，前端只能调 RPC，不能直接读写这些表。
--
-- 幂等：可重复执行（if not exists / or replace），不含 drop table，不清数据。
-- 执行方式：Supabase Dashboard → SQL Editor → 粘贴运行。
-- =====================================================================

-- ---------- 1. 表 ----------
create table if not exists public.captcha_challenge (
  id          uuid primary key default gen_random_uuid(),
  session_id  text        not null,
  answer_x    int         not null,          -- 缺口横坐标（服务端机密）
  piece_y     int         not null,          -- 缺口纵坐标
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '5 minutes'),
  consumed_at timestamptz,
  fail_count  int         not null default 0
);
create index if not exists captcha_challenge_session_idx on public.captcha_challenge (session_id, created_at desc);

create table if not exists public.captcha_token (
  token        uuid primary key default gen_random_uuid(),
  email        text        not null,
  challenge_id uuid        not null references public.captcha_challenge(id) on delete cascade,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default (now() + interval '10 minutes'),
  consumed_at  timestamptz
);
create index if not exists captcha_token_email_idx on public.captcha_token (email, created_at desc);

create table if not exists public.captcha_rate (
  k            text primary key,
  n            int         not null default 0,
  window_start timestamptz not null default now()
);

alter table public.captcha_challenge enable row level security;
alter table public.captcha_token      enable row level security;
alter table public.captcha_rate       enable row level security;
-- 不建任何 select/insert policy：前端对这些表零权限，只能通过下面的 RPC。

-- 限流计数：返回 true = 允许，false = 超限
create or replace function public._captcha_rate_allow(p_k text, p_max int, p_window interval)
returns boolean language plpgsql security definer set search_path = public as $$
declare v record;
begin
  select * into v from public.captcha_rate where k = p_k for update;
  if not found then
    insert into public.captcha_rate(k, n, window_start) values (p_k, 1, now());
    return true;
  end if;
  if now() - v.window_start > p_window then
    update public.captcha_rate set n = 1, window_start = now() where k = p_k;
    return true;
  end if;
  if v.n >= p_max then return false; end if;
  update public.captcha_rate set n = n + 1 where k = p_k;
  return true;
end $$;

-- ---------- 2. 创建挑战 ----------
-- 返回缺口遮罩 SVG（前端只当图片渲染，解析不到答案变量）、挑战 id、图块尺寸。
create or replace function public.captcha_new(
  p_session text,
  p_w int default 280,
  p_h int default 150
)
returns table (challenge_id uuid, mask_svg text, piece int, expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  v_id       uuid;
  v_x        int;
  v_y        int;
  v_piece    int := 48;
  v_svg      text;
  v_exp      timestamptz;
begin
  if p_session is null or length(p_session) < 6 then
    raise exception 'invalid session';
  end if;
  if not public._captcha_rate_allow('new:' || p_session, 12, interval '1 minute') then
    raise exception 'too many requests';
  end if;

  -- 缺口范围：留出滑块轨道（w - piece）内的安全区
  v_x := 40 + floor(random() * (p_w - v_piece - 70))::int;
  v_y := 38 + floor(random() * (p_h - v_piece - 30))::int;
  v_exp := now() + interval '5 minutes';

  insert into public.captcha_challenge(session_id, answer_x, piece_y, expires_at)
  values (p_session, v_x, v_y, v_exp) returning id into v_id;

  -- 遮罩：半透明罩 + 圆角缺口（缺口即目标位置，答案数值不出现在 JS 里）
  v_svg := format(
    '<svg xmlns="http://www.w3.org/2000/svg" width="%s" height="%s" viewBox="0 0 %s %s">' ||
    '<defs><mask id="cut"><rect width="%s" height="%s" fill="white"/>' ||
    '<rect x="%s" y="%s" width="%s" height="%s" rx="9" fill="black"/></mask></defs>' ||
    '<rect width="%s" height="%s" fill="rgba(6,9,11,.55)" mask="url(#cut)"/>' ||
    '<rect x="%s" y="%s" width="%s" height="%s" rx="9" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="1.5" stroke-dasharray="4 3"/></svg>',
    p_w, p_h, p_w, p_h, p_w, p_h, v_x, v_y, v_piece, v_piece,
    p_w, p_h, v_x, v_y, v_piece, v_piece
  );

  return query select v_id, v_svg, v_piece, v_exp;
end $$;

-- ---------- 3. 校验挑战（签发凭证） ----------
-- p_x = 用户拖动的位移（前端算出来），p_elapsed_ms = 拖动耗时
create or replace function public.captcha_verify(
  p_challenge_id uuid,
  p_session text,
  p_email text,
  p_x int,
  p_elapsed_ms int
)
returns table (token uuid, expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  c record;
  v_token uuid;
  v_exp timestamptz;
begin
  if p_email is null or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid email';
  end if;
  if not public._captcha_rate_allow('verify:' || p_session, 20, interval '1 minute') then
    raise exception 'too many requests';
  end if;

  select * into c from public.captcha_challenge where id = p_challenge_id for update;
  if not found then raise exception 'challenge not found'; end if;
  if c.session_id <> p_session then raise exception 'session mismatch'; end if;
  if c.consumed_at is not null then raise exception 'challenge already used'; end if;
  if now() > c.expires_at then raise exception 'challenge expired'; end if;
  if c.fail_count >= 5 then raise exception 'too many attempts'; end if;
  -- 太快（<350ms）视为脚本瞬间拖动
  if coalesce(p_elapsed_ms, 0) < 350 then
    update public.captcha_challenge set fail_count = fail_count + 1 where id = c.id;
    raise exception 'suspiciously fast';
  end if;
  -- 位置比对：容差 ±9px
  if abs(p_x - c.answer_x) > 9 then
    update public.captcha_challenge set fail_count = fail_count + 1 where id = c.id;
    raise exception 'mismatch';
  end if;

  -- 挑战一次性消费
  update public.captcha_challenge set consumed_at = now() where id = c.id;
  v_exp := now() + interval '10 minutes';
  insert into public.captcha_token(email, challenge_id, expires_at)
  values (lower(trim(p_email)), c.id, v_exp) returning token into v_token;

  return query select v_token, v_exp;
end $$;

-- ---------- 4. 注册提交时：原子消费凭证 ----------
-- 返回 true 表示凭证合法且已被一次性消费。重复调用必返回 false。
create or replace function public.captcha_consume(p_token uuid, p_email text)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if p_token is null or p_email is null then return false; end if;
  update public.captcha_token
     set consumed_at = now()
   where token = p_token
     and lower(email) = lower(trim(p_email))
     and consumed_at is null
     and now() <= expires_at;
  get diagnostics n = row_count;
  return n = 1;
end $$;

-- ---------- 5. 权限 ----------
revoke all on function public._captcha_rate_allow(text, int, interval) from public, anon, authenticated;
revoke all on function public.captcha_new(text, int, int) from public;
revoke all on function public.captcha_verify(uuid, text, text, int, int) from public;
revoke all on function public.captcha_consume(uuid, text) from public;
grant execute on function public.captcha_new(text, int, int) to anon, authenticated;
grant execute on function public.captcha_verify(uuid, text, text, int, int) to anon, authenticated;
grant execute on function public.captcha_consume(uuid, text) to anon, authenticated;
-- 内部函数只给 definer 自己（security definer 内部调用不需要额外授权）
