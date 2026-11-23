begin;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('comment', 'reply', 'approved', 'rejected', 'hidden')),
  game_slug text not null references public.games(slug) on delete cascade,
  game_title text not null,
  detail text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_notifications_recipient_recent
  on public.notifications (recipient, created_at desc, id desc);

alter table public.notifications enable row level security;
revoke all on public.notifications from public, anon, authenticated;
grant select, update (read_at) on public.notifications to authenticated;

drop policy if exists "notification recipient reads" on public.notifications;
create policy "notification recipient reads" on public.notifications for select
  to authenticated using (recipient = (select auth.uid()));

drop policy if exists "notification recipient marks read" on public.notifications;
create policy "notification recipient marks read" on public.notifications for update
  to authenticated using (recipient = (select auth.uid()))
  with check (recipient = (select auth.uid()));

create or replace function public.notify_game_review()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.notifications (recipient, kind, game_slug, game_title, detail)
  values (new.owner, new.review_state, new.slug, new.title_cn, new.review_note);
  return new;
end;
$$;

create or replace function public.notify_game_discussion()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.notifications (recipient, kind, game_slug, game_title, detail)
    select g.owner, 'comment', g.slug, g.title_cn, new.author_name
    from public.games g
    where g.slug = new.game_slug and g.review_state = 'approved'
      and g.owner is not null and g.owner is distinct from new.author;
  elsif old.reply is null and new.reply is not null and new.author is not null then
    insert into public.notifications (recipient, kind, game_slug, game_title)
    select new.author, 'reply', g.slug, g.title_cn
    from public.games g
    where g.slug = new.game_slug and g.review_state = 'approved'
      and g.owner is distinct from new.author;
  end if;
  return new;
end;
$$;

revoke all on function public.notify_game_review() from public, anon, authenticated;
revoke all on function public.notify_game_discussion() from public, anon, authenticated;

drop trigger if exists notify_game_review on public.games;
create trigger notify_game_review after update of review_state on public.games
  for each row when (
    new.owner is not null and old.review_state is distinct from new.review_state
    and new.review_state in ('approved', 'rejected', 'hidden')
  ) execute function public.notify_game_review();

drop trigger if exists notify_game_discussion on public.comments;
create trigger notify_game_discussion after insert or update of reply on public.comments
  for each row execute function public.notify_game_discussion();

notify pgrst, 'reload schema';
commit;
