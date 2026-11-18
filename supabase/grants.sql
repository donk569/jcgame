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
