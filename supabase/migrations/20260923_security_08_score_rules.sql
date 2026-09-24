-- Score sanity, at the only bar the whole history clears.
--
-- Identity is already bound: the insert policy requires the row's email to match
-- the token, so nobody can post as somebody else. What was unchecked is the
-- number, which is whatever the browser says. A member demonstrated this by
-- raising his own result by one; the same request would have taken 9999.
--
-- Checked against every row first: 8,349 rows across the four tables, none with
-- score > attempts, highest attempts 67. A gap rule was considered and REJECTED:
-- chord_game_scores has 322 genuine pairs saved less than 45 seconds apart, so
-- it would have refused real play.
--
-- This does not make a score truthful; only a server-side game could. It bounds
-- the damage to something a player could plausibly have done.

alter table public.note_game_scores
  add constraint note_game_scores_sane
  check (score >= 0 and attempts >= 0 and attempts <= 200 and score <= attempts);

alter table public.chord_game_scores
  add constraint chord_game_scores_sane
  check (score >= 0 and attempts >= 0 and attempts <= 200 and score <= attempts);

alter table public.ear_game_scores
  add constraint ear_game_scores_sane
  check (score >= 0 and attempts >= 0 and attempts <= 200 and score <= attempts);

alter table public.interval_game_scores
  add constraint interval_game_scores_sane
  check (score >= 0 and attempts >= 0 and attempts <= 200 and score <= attempts);
