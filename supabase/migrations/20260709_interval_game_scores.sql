-- Interval Training game scores (mirrors ear_game_scores / note_game_scores).
-- Each distinct game configuration (side + tier + key mode + playback + key) has its
-- own leaderboard, so the config columns are all part of what a board filters on.
create table if not exists public.interval_game_scores (
  id            bigint generated always as identity primary key,
  email         text not null,
  name          text,
  score         integer not null,
  side          text not null,              -- 'reading' | 'listening'
  tier          text not null,              -- 'number' | 'pm' | 'full'
  key_mode      text not null,              -- 'free' | 'key'
  playback      text,                       -- listening only: 'melodic' | 'harmonic' | 'both'
  key_signature text,                       -- when key_mode = 'key'
  attempts      integer,
  created_at    timestamptz not null default now()
);

create index if not exists interval_game_scores_board_idx
  on public.interval_game_scores (side, tier, key_mode, playback, key_signature, score desc);

alter table public.interval_game_scores enable row level security;

-- Leaderboards are public within the app; anyone may read.
drop policy if exists interval_scores_select on public.interval_game_scores;
create policy interval_scores_select on public.interval_game_scores
  for select using (true);

-- A signed-in member may record their own score.
drop policy if exists interval_scores_insert on public.interval_game_scores;
create policy interval_scores_insert on public.interval_game_scores
  for insert to authenticated with check (lower(email) = lower(auth.jwt() ->> 'email'));

-- Leaderboard computed in SQL: the single best score PER PLAYER for a given config,
-- then the top 10 — so there is NO client-side row cap that could drop a real top-10
-- player from a board full of one player's repeat scores. (`is not distinct from`
-- matches the nullable columns: playback is null for reading, key_signature for free.)
create or replace function public.get_interval_leaderboard(
  p_side text, p_tier text, p_key_mode text,
  p_playback text default null, p_key_signature text default null
) returns table(email text, name text, score integer)
language sql stable as $$
  with best as (
    select s.email, max(s.score) as score
    from public.interval_game_scores s
    where s.side = p_side and s.tier = p_tier and s.key_mode = p_key_mode
      and s.playback is not distinct from p_playback
      and s.key_signature is not distinct from p_key_signature
    group by s.email
  )
  select b.email,
         (select s2.name from public.interval_game_scores s2
           where s2.email = b.email and s2.score = b.score
             and s2.side = p_side and s2.tier = p_tier and s2.key_mode = p_key_mode
             and s2.playback is not distinct from p_playback
             and s2.key_signature is not distinct from p_key_signature
           order by s2.created_at desc limit 1) as name,
         b.score
  from best b
  order by b.score desc, b.email
  limit 10;
$$;

grant execute on function public.get_interval_leaderboard(text, text, text, text, text) to anon, authenticated;
