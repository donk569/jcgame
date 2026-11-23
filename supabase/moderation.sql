begin;

alter table public.games add column if not exists review_state text not null default 'approved'
  check (review_state in ('pending', 'approved', 'rejected', 'hidden'));
alter table public.games add column if not exists review_note text;
alter table public.games alter column review_state set default 'pending';
create index if not exists idx_games_review on public.games (review_state, released_at desc);

create or replace function public.is_jcgame_moderator()
returns boolean language sql stable set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'jcgame_moderator', '') = 'true'
$$;

create or replace function public.guard_game_review()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if current_user not in ('anon', 'authenticated') then return new; end if;
  if new.download ->> 'storagePath' is not null and (
    new.owner is null or split_part(new.download ->> 'storagePath', '/', 1) <> new.owner::text
  ) then
    raise exception 'package path belongs to a different owner' using errcode = '42501';
  end if;
  if tg_op = 'INSERT' then
    new.review_state := 'pending';
    new.review_note := null;
    new.featured := false;
    new.plays := 0;
    new.likes := 0;
  else
    new.review_state := old.review_state;
    new.review_note := old.review_note;
    new.featured := old.featured;
    new.plays := old.plays;
    new.likes := old.likes;
    if old.review_state = 'approved' and (
      new.title, new.title_cn, new.tagline, new.description, new.studio,
      new.cover, new.keyart, new.shots, new.web_build, new.download, new.changelog
    ) is distinct from (
      old.title, old.title_cn, old.tagline, old.description, old.studio,
      old.cover, old.keyart, old.shots, old.web_build, old.download, old.changelog
    ) then
      new.review_state := 'pending';
      new.review_note := null;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_game_review on public.games;
create trigger guard_game_review before insert or update on public.games
for each row execute function public.guard_game_review();

drop policy if exists "games 公开可读" on public.games;
create policy "games 公开可读" on public.games for select using (review_state = 'approved');
-- Authors read their pending submissions via a scoped RPC. Direct public SELECT stays approved-only.
revoke all on public.games from public, anon, authenticated;
grant select on public.games to anon, authenticated;
grant insert, update on public.games to authenticated;

create table if not exists public.game_reports (
  id uuid primary key default gen_random_uuid(),
  slug text not null references public.games(slug) on delete cascade,
  reporter uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(btrim(reason)) between 3 and 500),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (slug, reporter)
);
alter table public.game_reports enable row level security;
revoke all on public.game_reports from public, anon, authenticated;

create or replace function public.my_submissions()
returns table (slug text, title text, status text, note text)
language sql stable security definer set search_path = ''
as $$
  select g.slug, g.title_cn, g.review_state, g.review_note
  from public.games g where g.owner = auth.uid() and g.review_state <> 'approved'
  order by g.updated_at desc, g.slug
$$;

create or replace function public.report_game(p_slug text, p_reason text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if not exists (select 1 from public.games g where g.slug = p_slug and g.review_state = 'approved') then
    raise exception 'game unavailable';
  end if;
  insert into public.game_reports (slug, reporter, reason)
  values (p_slug, auth.uid(), btrim(p_reason))
  on conflict (slug, reporter) do update
    set reason = excluded.reason, created_at = now(), resolved_at = null
    where game_reports.resolved_at is not null;
end;
$$;

create or replace function public.review_queue()
returns table (slug text, title text, status text, launch_url text, package_path text, package_name text, description jsonb, cover text, shots jsonb, reasons text[])
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_jcgame_moderator() then raise exception 'moderator required' using errcode = '42501'; end if;
  return query
    select g.slug, g.title_cn, g.review_state, g.web_build ->> 'launchUrl',
      g.download ->> 'storagePath', g.download ->> 'fileName', g.description, g.cover, g.shots,
      coalesce(array_agg(r.reason order by r.created_at desc) filter (where r.id is not null), array[]::text[])
    from public.games g left join public.game_reports r on r.slug = g.slug and r.resolved_at is null
    where g.review_state = 'pending' or r.id is not null
    group by g.slug
    order by g.updated_at, g.slug
    limit 100;
end;
$$;

create or replace function public.set_game_review(p_slug text, p_status text, p_note text default null)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_jcgame_moderator() then raise exception 'moderator required' using errcode = '42501'; end if;
  if p_status is null or p_status not in ('approved', 'rejected', 'hidden') then raise exception 'invalid status'; end if;
  if char_length(coalesce(p_note, '')) > 500 then raise exception 'review note too long'; end if;
  update public.games set review_state = p_status, review_note = nullif(btrim(p_note), '')
  where slug = p_slug and (
    (review_state = 'pending' and p_status in ('approved', 'rejected'))
    or (review_state = 'approved' and p_status in ('approved', 'hidden'))
  );
  if not found then raise exception 'review status changed'; end if;
  update public.game_reports set resolved_at = now() where slug = p_slug and resolved_at is null;
end;
$$;

revoke execute on function public.my_submissions(), public.report_game(text, text),
  public.review_queue(), public.set_game_review(text, text, text) from public, anon;
grant execute on function public.my_submissions(), public.report_game(text, text),
  public.review_queue(), public.set_game_review(text, text, text) to authenticated;

insert into storage.buckets (id, name, public) values ('game-builds', 'game-builds', false)
on conflict (id) do nothing;

drop policy if exists "game builds uploads" on storage.objects;
create policy "game builds uploads" on storage.objects for insert to authenticated
with check (bucket_id = 'game-builds' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "game builds published download" on storage.objects;
create policy "game builds published download" on storage.objects for select to anon, authenticated
using (
  bucket_id = 'game-builds' and (
    public.is_jcgame_moderator()
    or exists (select 1 from public.games g
      where g.review_state = 'approved' and g.download ->> 'storagePath' = storage.objects.name)
  )
);

commit;
