-- =====================================================================
-- JCGame 注册防绕过 · auth.users BEFORE INSERT Trigger
-- =====================================================================
-- 目的：无论从前端还是直接调 Supabase signUp API 创建用户，都必须在
--       服务端强制消费一个「有效、未用、未过期、邮箱匹配」的滑块凭证。
--       凭证缺失/无效 → RAISE EXCEPTION，用户记录根本不会被创建。
-- GitHub OAuth 等第三方登录不带 captcha_token 字段 → 直接放行。
--
-- 幂等：if not exists / or replace，可重复执行；不含 drop table / 不清数据。
-- =====================================================================

-- 供 Trigger 调用：原子消费滑块凭证（复用 captcha.sql 里的 captcha_consume）
-- 这里再包一层，专门用于 auth.users 创建时校验，错误信息更明确。
create or replace function public.guard_signup_captcha()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
  v_email text;
  v_ok boolean;
begin
  -- 第三方 OAuth 登录（GitHub 等）没有滑块流程，放行
  v_token := nullif(NEW.raw_user_meta_data->>'captcha_token', '');

  if v_token is null then
    -- 邮箱密码注册但没有滑块凭证 → 拒绝
    -- 判断是否邮箱注册：providers 里只有 email 且没有外部 provider
    if coalesce(NEW.raw_app_meta_data->>'provider', '') = 'email' then
      raise exception '人机验证凭证缺失，注册被拒绝' using errcode = '42501';
    end if;
    -- 其他 provider（github 等）放行
    return NEW;
  end if;

  v_email := lower(trim(coalesce(NEW.email, '')));
  if v_email = '' then
    raise exception '邮箱无效，注册被拒绝' using errcode = '42501';
  end if;

  -- 原子消费：无效 / 已用 / 过期 / 邮箱不符 → false
  v_ok := public.captcha_consume(v_token::uuid, v_email);
  if not coalesce(v_ok, false) then
    raise exception '人机验证凭证无效、已使用或已过期，注册被拒绝' using errcode = '42501';
  end if;

  -- 校验通过，允许创建用户
  return NEW;
end $$;

-- 建 Trigger（先删同名再建，幂等）
drop trigger if exists guard_signup_captcha_trigger on auth.users;
create trigger guard_signup_captcha_trigger
  before insert on auth.users
  for each row
  execute function public.guard_signup_captcha();

-- 权限：captcha_consume 已由 captcha.sql 授权；此函数由 trigger 以 definer 身份调用，
-- 前端无需也不能直接执行它。
revoke all on function public.guard_signup_captcha() from public, anon, authenticated;
