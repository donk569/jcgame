-- =============================================================
-- 修复：creators.since 原本是 date 类型，但数据是 "2025-03" 这种年月格式，
-- Postgres 的 date 解析不了。改成 text，原样存取，前端显示不受影响。
-- =============================================================

alter table public.creators
  alter column since type text using since::text;
