begin;

-- Your scores are yours.
--
-- These four tables let any signed-in member read every row, which meant the
-- address of everyone who has ever played was a single request away. Nothing
-- needs that now: the pages read your own scores by key, and the boards are
-- served by functions that return a name and a key and no address.
--
-- This restricts the rows rather than revoking the address column, because
-- column privileges belong to the role and the owner is an authenticated user
-- like anyone else. Revoking would have taken the address from his own
-- analytics too. Restricting leaves him reading everything and leaves a member
-- reading their own.
--
-- The insert policies are untouched: you may still record your own score.
drop policy if exists "note_game_scores_select"      on public.note_game_scores;
drop policy if exists "Anyone can read chord scores" on public.chord_game_scores;
drop policy if exists "Anyone can read ear scores"   on public.ear_game_scores;
drop policy if exists "interval_scores_select"       on public.interval_game_scores;

create policy "note_game_scores_select" on public.note_game_scores
  for select to authenticated
  using (lower(email) = lower((select auth.jwt() ->> 'email'))
         or lower((select auth.jwt() ->> 'email')) = 'matthew@matthewcawood.com');

create policy "chord_game_scores_select" on public.chord_game_scores
  for select to authenticated
  using (lower(email) = lower((select auth.jwt() ->> 'email'))
         or lower((select auth.jwt() ->> 'email')) = 'matthew@matthewcawood.com');

create policy "ear_game_scores_select" on public.ear_game_scores
  for select to authenticated
  using (lower(email) = lower((select auth.jwt() ->> 'email'))
         or lower((select auth.jwt() ->> 'email')) = 'matthew@matthewcawood.com');

create policy "interval_game_scores_select" on public.interval_game_scores
  for select to authenticated
  using (lower(email) = lower((select auth.jwt() ->> 'email'))
         or lower((select auth.jwt() ->> 'email')) = 'matthew@matthewcawood.com');

commit;
