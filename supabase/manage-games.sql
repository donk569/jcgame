-- 创作者作品管理：作者读取自己全部状态的作品、修改资料、下架/重新提交审核。
-- 依赖 moderation.sql（review_state / guard_game_review）。
-- 在 Supabase SQL Editor 执行本文件后，前端 src/api/manage.ts 才能工作。
begin;

-- 作者可读自己任意状态的作品（RLS 的公开 SELECT 只放行 approved）。
create or replace function public.my_game_works()
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    jsonb_agg(to_jsonb(g) order by g.updated_at desc, g.slug),
    '[]'::jsonb
  )
  from public.games g
  where g.owner = auth.uid();
$$;

-- 作者改作品资料。只放行白名单字段，slug / owner / plays / likes 不可改。
-- guard_game_review 触发器会在内容变化时把 approved 打回 pending，重新审核。
create or replace function public.update_my_game(p_slug text, p_patch jsonb)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_owner uuid;
  v_state text;
  v_patch jsonb := coalesce(p_patch, '{}'::jsonb);
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if v_patch ?| array['slug', 'owner', 'plays', 'likes', 'featured', 'review_state', 'review_note'] then
    raise exception 'field not editable' using errcode = '42501';
  end if;

  select g.owner, g.review_state into v_owner, v_state
  from public.games g where g.slug = p_slug for update;
  if v_owner is null or v_owner <> auth.uid() then
    raise exception 'game not found' using errcode = '42501';
  end if;

  if v_patch ? 'download' and v_patch -> 'download' ->> 'storagePath' is not null
     and split_part(v_patch -> 'download' ->> 'storagePath', '/', 1) <> auth.uid()::text then
    raise exception 'package path belongs to a different owner' using errcode = '42501';
  end if;

  update public.games g set
    title          = case when v_patch ? 'title'        then left(v_patch ->> 'title', 120)        else g.title end,
    title_cn       = case when v_patch ? 'title_cn'     then left(v_patch ->> 'title_cn', 120)     else g.title_cn end,
    tagline        = case when v_patch ? 'tagline'      then left(v_patch ->> 'tagline', 240)      else g.tagline end,
    description    = case when v_patch ? 'description'  then v_patch -> 'description'              else g.description end,
    studio         = case when v_patch ? 'studio'       then v_patch -> 'studio'                   else g.studio end,
    engine         = case when v_patch ? 'engine'       then left(v_patch ->> 'engine', 60)        else g.engine end,
    engine_version = case when v_patch ? 'engine_version' then left(v_patch ->> 'engine_version', 60) else g.engine_version end,
    categories     = case when v_patch ? 'categories'   then v_patch -> 'categories'               else g.categories end,
    tags           = case when v_patch ? 'tags'         then v_patch -> 'tags'                     else g.tags end,
    cover          = case when v_patch ? 'cover'        then v_patch ->> 'cover'                   else g.cover end,
    keyart         = case when v_patch ? 'keyart'       then v_patch ->> 'keyart'                  else g.keyart end,
    shots          = case when v_patch ? 'shots'        then v_patch -> 'shots'                    else g.shots end,
    web_build      = case when v_patch ? 'web_build'    then v_patch -> 'web_build'                else g.web_build end,
    download       = case when v_patch ? 'download'     then v_patch -> 'download'                 else g.download end,
    version        = case when v_patch ? 'version'      then left(v_patch ->> 'version', 40)       else g.version end,
    changelog      = case when v_patch ? 'changelog'    then v_patch -> 'changelog'                else g.changelog end,
    review_state   = case when v_state = 'approved' then 'pending' else g.review_state end,
    review_note    = case when v_state = 'approved' then null else g.review_note end,
    updated_at     = current_date
  where g.slug = p_slug;

  if not found then
    raise exception 'game not found' using errcode = '42501';
  end if;
end;
$$;

-- 作者下架（approved -> hidden）或重新提交（rejected / hidden -> pending）。
-- 只有本人可操作；pending 状态下不允许重复提交。
create or replace function public.set_my_game_state(p_slug text, p_state text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_owner uuid;
  v_state text;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_state not in ('hidden', 'pending') then
    raise exception 'invalid state';
  end if;

  select g.owner, g.review_state into v_owner, v_state
  from public.games g where g.slug = p_slug for update;
  if v_owner is null or v_owner <> auth.uid() then
    raise exception 'game not found' using errcode = '42501';
  end if;

  if p_state = 'hidden' and v_state not in ('approved', 'pending') then
    raise exception 'state not changeable';
  end if;
  if p_state = 'pending' and v_state not in ('hidden', 'rejected') then
    raise exception 'state not changeable';
  end if;

  update public.games g
  set review_state = p_state,
      review_note = null,
      updated_at = current_date
  where g.slug = p_slug;
end;
$$;

revoke all on function public.my_game_works(), public.update_my_game(text, jsonb),
  public.set_my_game_state(text, text) from public, anon;
grant execute on function public.my_game_works(), public.update_my_game(text, jsonb),
  public.set_my_game_state(text, text) to authenticated;

notify pgrst, 'reload schema';
commit;
