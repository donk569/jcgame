-- Apply after schema.sql. Existing games remain visible only according to games RLS.
begin;

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;
set local search_path = public, extensions;

create or replace function public.game_search_text(
  english_title text,
  chinese_title text,
  game_engine text,
  game_studio jsonb,
  game_tags jsonb,
  game_categories jsonb
)
returns text
language sql
immutable
parallel safe
as $$
  select lower(
    english_title || ' ' || chinese_title || ' ' || game_engine || ' '
    || coalesce(game_studio->>'name', '') || ' '
    || coalesce((select string_agg(value, ' ' order by position)
      from jsonb_array_elements_text(case when jsonb_typeof(game_tags) = 'array' then game_tags else '[]'::jsonb end)
      with ordinality as tags(value, position)), '') || ' '
    || coalesce((select string_agg(value, ' ' order by position)
      from jsonb_array_elements_text(case when jsonb_typeof(game_categories) = 'array' then game_categories else '[]'::jsonb end)
      with ordinality as categories(value, position)), '')
  );
$$;

create index if not exists games_search_text_idx on public.games
using gin (public.game_search_text(title, title_cn, engine, studio, tags, categories) gin_trgm_ops);

create or replace function public.search_games(search_query text, page_size integer, page_offset integer)
returns setof public.games
language sql
stable
security invoker
set search_path = public
as $$
  with needle as (
    select lower(left(btrim(coalesce(search_query, '')), 120)) as term
  ), pattern as (
    select term, replace(replace(replace(term, '!', '!!'), '%', '!%'), '_', '!_') as escaped
    from needle
  )
  select game.*
  from public.games as game cross join pattern
  where term <> '' and public.game_search_text(
    game.title, game.title_cn, game.engine, game.studio, game.tags, game.categories
  ) like '%' || escaped || '%' escape '!'
  order by case
    when lower(game.title) = term or lower(game.title_cn) = term then 0
    when lower(game.title) like escaped || '%' escape '!'
      or lower(game.title_cn) like escaped || '%' escape '!' then 1
    else 2
  end, game.released_at desc nulls last, game.slug
  limit least(greatest(coalesce(page_size, 7), 1), 51)
  offset greatest(coalesce(page_offset, 0), 0);
$$;

revoke all on function public.search_games(text, integer, integer) from public;
grant execute on function public.search_games(text, integer, integer) to anon, authenticated;

notify pgrst, 'reload schema';
commit;
