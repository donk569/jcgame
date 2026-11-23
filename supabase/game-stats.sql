-- Run after moderation.sql, which adds review_state.
begin;

create table if not exists public.game_activity (
  game_slug text not null references public.games(slug) on delete cascade,
  bucket timestamptz not null,
  kind text not null check (kind in ('play', 'download')),
  viewer uuid not null,
  primary key (game_slug, bucket, kind, viewer)
);
alter table public.game_activity enable row level security;
revoke all on public.game_activity from public, anon, authenticated;
create index if not exists idx_games_owner_release on public.games (owner, released_at desc, slug);
create index if not exists idx_user_games_saved_slug on public.user_games (slug) where saved;

create or replace function public.record_game_activity(p_slug text, p_kind text, p_viewer uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_bucket timestamptz := date_bin('5 minutes', now(), '2000-01-01T00:00:00Z'::timestamptz);
  v_viewer uuid := coalesce(auth.uid(), p_viewer);
begin
  if v_viewer is null or p_kind not in ('play', 'download') then
    return false;
  end if;

  -- Serialize visibility changes with event acceptance.
  perform 1 from public.games
  where slug = p_slug and review_state = 'approved'
    and (
      (run_mode = 'web' and p_kind = 'play' and web_build ->> 'launchUrl' ~* '^https://')
      or (run_mode = 'download' and p_kind = 'download' and (download ->> 'file' ~* '^https?://' or nullif(download ->> 'storagePath', '') is not null))
    )
  for no key update;
  if not found then return false; end if;

  insert into public.game_activity (game_slug, bucket, kind, viewer)
  values (p_slug, v_bucket, p_kind, v_viewer)
  on conflict do nothing;
  if not found then return false; end if;

  if p_kind = 'play' then
    update public.games set plays = plays + 1 where slug = p_slug;
  end if;
  return true;
end;
$$;

create or replace function public.creator_game_stats()
returns jsonb
language sql stable security definer set search_path = ''
as $$
  with mine as materialized (
    select slug from public.games where owner = auth.uid()
  ),
  bounds as (
    select (now() at time zone 'Asia/Shanghai')::date as today
  ),
  days as (
    select (today - offset_day) as day
    from bounds cross join generate_series(0, 6) as offsets(offset_day)
  ),
  daily_activity as (
    select (a.bucket at time zone 'Asia/Shanghai')::date as day,
      count(*) filter (where a.kind = 'play') as plays,
      count(*) filter (where a.kind = 'download') as downloads
    from public.game_activity a
    join mine m on m.slug = a.game_slug
    cross join bounds b
    where a.bucket >= (b.today - 6)::timestamp at time zone 'Asia/Shanghai'
    group by 1
  )
  select jsonb_build_object(
    'plays', (select count(*) from public.game_activity a join mine m on m.slug = a.game_slug where a.kind = 'play'),
    'downloads', (select count(*) from public.game_activity a join mine m on m.slug = a.game_slug where a.kind = 'download'),
    'collections', (select count(*) from public.user_games u join mine m on m.slug = u.slug where u.saved),
    'trend', (select jsonb_agg(jsonb_build_object(
      'date', d.day, 'plays', coalesce(a.plays, 0), 'downloads', coalesce(a.downloads, 0)
    ) order by d.day) from days d left join daily_activity a using (day))
  );
$$;

revoke all on function public.record_game_activity(text, text, uuid) from public, anon, authenticated;
revoke all on function public.creator_game_stats() from public, anon, authenticated;
grant execute on function public.record_game_activity(text, text, uuid) to anon, authenticated;
grant execute on function public.creator_game_stats() to authenticated;

commit;
