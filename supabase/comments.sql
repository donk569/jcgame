-- Apply after schema.sql, grants.sql and moderation.sql.
begin;

drop policy if exists "comments 公开可读" on public.comments;
create policy "comments 公开可读" on public.comments for select
  using (exists (
    select 1 from public.games g
    where g.slug = comments.game_slug and g.review_state = 'approved'
  ));

drop policy if exists "登录后可留言" on public.comments;
drop policy if exists "作品所有者可回复" on public.comments;
revoke all on table public.comments from public, anon, authenticated;
grant select (id, game_slug, author_name, body, reply, created_at)
  on table public.comments to anon, authenticated;

create index if not exists idx_comments_game_recent
  on public.comments (game_slug, created_at desc, id desc);

create or replace function public.post_game_comment(p_game_slug text, p_body text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  player_id uuid := auth.uid();
  comment_body text := btrim(p_body, E' \n\r\t');
begin
  if player_id is null then raise exception 'Login required'; end if;
  if comment_body is null or char_length(comment_body) not between 1 and 1000 then
    raise exception 'Comment must contain 1–1000 characters';
  end if;

  insert into public.comments (game_slug, author, author_name, body)
  select g.slug, player_id, coalesce(nullif(btrim(p.name), ''), '玩家'), comment_body
  from public.games g
  left join public.profiles p on p.id = player_id
  where g.slug = p_game_slug and g.review_state = 'approved';

  if not found then raise exception 'Game unavailable'; end if;
end;
$$;

create or replace function public.reply_to_game_comment(p_comment_id uuid, p_reply text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  player_id uuid := auth.uid();
  reply_body text := btrim(p_reply, E' \n\r\t');
begin
  if player_id is null then raise exception 'Login required'; end if;
  if reply_body is null or char_length(reply_body) not between 1 and 1000 then
    raise exception 'Reply must contain 1–1000 characters';
  end if;

  update public.comments c
  set reply = reply_body, replied_at = now()
  from public.games g
  where c.id = p_comment_id and c.game_slug = g.slug
    and g.owner = player_id and g.review_state = 'approved';

  if not found then raise exception 'Comment unavailable'; end if;
end;
$$;

revoke all on function public.post_game_comment(text, text) from public, anon;
revoke all on function public.reply_to_game_comment(uuid, text) from public, anon;
grant execute on function public.post_game_comment(text, text) to authenticated;
grant execute on function public.reply_to_game_comment(uuid, text) to authenticated;

commit;
