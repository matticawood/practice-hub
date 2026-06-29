-- ════════════════════════════════════════════════════════════════════════════
-- Streak + streak-save system: ONE canonical derive-from-data source of truth.
--
-- Replaces the fragile client-side incremental logic (browser ++ / direct
-- upserts off stale snapshots) that let balances drift past the 15 cap
-- (connieuitsu 21, lucaskinzo 20) and never auto-applied saves at end of day.
--
-- derive_streak_state(email) replays the member's practice history day-by-day in
-- THEIR local timezone and returns the only correct streak/balance/earned/saved.
-- It mirrors shared-streak.js (deriveStreakState) EXACTLY — keep them in lockstep.
-- ════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ── new columns (additive; constraint added after the one-off correction) ─────
ALTER TABLE streak_tokens ADD COLUMN IF NOT EXISTS timezone       text;
ALTER TABLE streak_tokens ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0;
ALTER TABLE streak_tokens ADD COLUMN IF NOT EXISTS best_streak    integer NOT NULL DEFAULT 0;

-- ── the canonical replay ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION derive_streak_state(p_email text)
RETURNS TABLE(current_streak integer, best_streak integer, balance integer, total_earned integer, saved_dates jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  MAX_SAVES constant integer := 15;
  v_tz      text;
  v_today   date;
  v_days    date[];
  v_streak  integer := 0;
  v_best    integer := 0;
  v_balance integer := 0;
  v_earned  integer := 0;
  v_saved   jsonb   := '[]'::jsonb;
  d         date;
  counted   boolean;
BEGIN
  SELECT timezone INTO v_tz FROM streak_tokens WHERE email = p_email;
  IF v_tz IS NULL THEN v_tz := 'UTC'; END IF;
  BEGIN
    v_today := (now() AT TIME ZONE v_tz)::date;     -- member's LOCAL today
  EXCEPTION WHEN OTHERS THEN
    v_today := (now() AT TIME ZONE 'UTC')::date;     -- bad tz string -> UTC
  END;

  SELECT array_agg(DISTINCT session_date ORDER BY session_date) INTO v_days
  FROM practice_sessions WHERE email = p_email AND session_date IS NOT NULL;

  IF v_days IS NULL THEN
    current_streak := 0; best_streak := 0; balance := 0; total_earned := 0; saved_dates := '[]'::jsonb;
    RETURN NEXT; RETURN;
  END IF;

  d := v_days[1];
  WHILE d <= v_today LOOP
    counted := false;
    IF d = ANY(v_days) THEN
      v_streak := v_streak + 1; counted := true;
    ELSIF d < v_today THEN                            -- a fully-elapsed missed day
      IF v_balance > 0 THEN
        v_balance := v_balance - 1;
        v_saved   := v_saved || to_jsonb(to_char(d, 'YYYY-MM-DD'));
        v_streak  := v_streak + 1; counted := true;
      ELSE
        v_streak := 0;                                -- saves exhausted -> streak breaks
      END IF;
    END IF;                                           -- d = today & unlogged: leave streak (today still open)
    IF counted AND v_streak % 5 = 0 THEN
      v_earned := v_earned + 1;
      IF v_balance < MAX_SAVES THEN v_balance := v_balance + 1; END IF;
    END IF;
    IF v_streak > v_best THEN v_best := v_streak; END IF;
    d := d + 1;
  END LOOP;

  current_streak := v_streak; best_streak := v_best; balance := v_balance;
  total_earned := v_earned; saved_dates := v_saved;
  RETURN NEXT;
END; $$;

-- ── single writer: recompute one member's row from the replay ─────────────────
CREATE OR REPLACE FUNCTION recompute_streak_tokens(p_email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM derive_streak_state(p_email);
  INSERT INTO streak_tokens (email, balance, total_earned, saved_dates, current_streak, best_streak, updated_at)
  VALUES (p_email, r.balance, r.total_earned, r.saved_dates, r.current_streak, r.best_streak, now())
  ON CONFLICT (email) DO UPDATE SET
    balance        = excluded.balance,
    total_earned   = excluded.total_earned,
    saved_dates    = excluded.saved_dates,
    current_streak = excluded.current_streak,
    best_streak    = excluded.best_streak,
    updated_at     = now();
END; $$;

-- ── recompute everyone (one-off correction + hourly cron) ─────────────────────
CREATE OR REPLACE FUNCTION recompute_all_streak_tokens()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE em text; n integer := 0;
BEGIN
  FOR em IN SELECT DISTINCT email FROM practice_sessions WHERE email IS NOT NULL LOOP
    PERFORM recompute_streak_tokens(em);
    n := n + 1;
  END LOOP;
  RETURN n;
END; $$;

-- ── member sets their own timezone (table is read-only to clients) ────────────
CREATE OR REPLACE FUNCTION set_my_timezone(p_tz text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE em text;
BEGIN
  em := lower(auth.jwt() ->> 'email');
  IF em IS NULL OR p_tz IS NULL THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = p_tz) THEN RETURN; END IF;
  INSERT INTO streak_tokens (email, timezone, balance, total_earned, saved_dates, updated_at)
  VALUES (em, p_tz, 0, 0, '[]'::jsonb, now())
  ON CONFLICT (email) DO UPDATE SET timezone = excluded.timezone;
  PERFORM recompute_streak_tokens(em);
END; $$;
GRANT EXECUTE ON FUNCTION set_my_timezone(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION recompute_streak_tokens(text) TO authenticated;

-- ── ONE-OFF CORRECTION: fix every existing (inflated) row, then lock the cap ──
SELECT recompute_all_streak_tokens();

ALTER TABLE streak_tokens DROP CONSTRAINT IF EXISTS streak_tokens_balance_chk;
ALTER TABLE streak_tokens ADD  CONSTRAINT streak_tokens_balance_chk CHECK (balance BETWEEN 0 AND 15);

-- ── reconcile save achievements against the corrected saves-used ──────────────
-- saves_used is now jsonb_array_length(saved_dates) (genuine spends). Revoke any
-- sv1/sv3/sv5 a member no longer qualifies for, and clear its notification.
DO $reconcile$
DECLARE rec record;
BEGIN
  FOR rec IN SELECT * FROM (VALUES ('sv1',1),('sv3',3),('sv5',5)) AS v(aid, thresh) LOOP
    DELETE FROM achievement_events ae
    USING (
      SELECT ae2.email FROM achievement_events ae2
      LEFT JOIN streak_tokens st ON st.email = ae2.email
      WHERE ae2.achievement_id = rec.aid
        AND COALESCE(jsonb_array_length(st.saved_dates), 0) < rec.thresh
    ) gone
    WHERE ae.achievement_id = rec.aid AND ae.email = gone.email;

    DELETE FROM notifications
    WHERE source_id = 'ach_' || rec.aid
      AND email NOT IN (SELECT email FROM achievement_events WHERE achievement_id = rec.aid);
  END LOOP;
END $reconcile$;

-- ── leaderboard now counts saves (reads the maintained best_streak) ───────────
CREATE OR REPLACE FUNCTION get_streak_leaderboard()
RETURNS TABLE(email text, name text, best_streak bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ae.email, ae.name, COALESCE(st.best_streak, 0)::bigint AS best_streak
  FROM allowed_emails ae
  LEFT JOIN streak_tokens st ON st.email = ae.email
  WHERE ae.email IS NOT NULL AND COALESCE(st.best_streak, 0) > 0
  ORDER BY best_streak DESC;
$$;

-- ── saves-used = genuine spends (saved_dates is now correct by construction) ──
CREATE OR REPLACE FUNCTION get_user_streak_saves(p_email text)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_array_length(saved_dates), 0) FROM streak_tokens WHERE email = p_email LIMIT 1;
$$;

-- ── hourly recompute = end-of-day auto-apply per member timezone ──────────────
-- Hourly catches each member's local midnight within the hour; cheap (~hundreds
-- of rows). derive_streak_state only burns a save for a day fully elapsed in the
-- member's tz, so this never burns early (the old premature-burn bug).
SELECT cron.unschedule('recompute_streak_tokens')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'recompute_streak_tokens');
SELECT cron.schedule('recompute_streak_tokens', '7 * * * *', $$ SELECT recompute_all_streak_tokens(); $$);

NOTIFY pgrst, 'reload schema';
