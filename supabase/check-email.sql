-- =====================================================================
-- JCGame 邮箱注册前检查：该邮箱是否已有【已验证】账号
-- =====================================================================
-- 前端注册提交前调用，若返回 true 就直接提示"已注册，请登录"，
-- 避免用户填老邮箱后干等一封永远不会来的验证码。
--
-- 安全：security definer；只返回一个布尔值，不暴露用户 id / 邮箱 / 任何字段。
-- 幂等：or replace，可重复执行。
-- =====================================================================

create or replace function public.email_has_verified_account(p_email text)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare v_exists boolean := false;
begin
  if p_email is null or length(trim(p_email)) = 0 then
    return false;
  end if;
  select exists(
    select 1 from auth.users
    where lower(email) = lower(trim(p_email))
      and email_confirmed_at is not null
  ) into v_exists;
  return v_exists;
end $$;

revoke all on function public.email_has_verified_account(text) from public;
grant execute on function public.email_has_verified_account(text) to anon, authenticated;
