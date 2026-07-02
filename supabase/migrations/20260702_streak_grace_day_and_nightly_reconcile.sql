-- ════════════════════════════════════════════════════════════════════════════
-- Streak hardening: one-day grace in the replay (kills timezone phantom saves) +
-- a nightly reconcile of the save achievements. Keeps derive_streak_state in
-- EXACT lockstep with shared-streak.js (same grace: burn only when d < today-1).
--
-- Why the grace: timezone offsets span ~26h, so a wrong/stale/null stored tz can
-- put "today" at most a calendar day off. Never charging a save until a day is
-- elapsed by a FULL extra day means no tz error can burn a save for a day still
-- open in the member's real timezone. Proven against the JS mirror's test harness.
-- ════════════════════════════════════════════════════════════════════════════

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
    v_today := (now() AT TIME ZONE v_tz)::date;
  EXCEPTION WHEN OTHERS THEN
    v_today := (now() AT TIME ZONE 'UTC')::date;
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
    ELSIF d < v_today - 1 THEN                        -- missed day elapsed BEYOND the one-day grace
      IF v_balance > 0 THEN
        v_balance := v_balance - 1;
        v_saved   := v_saved || to_jsonb(to_char(d, 'YYYY-MM-DD'));
        v_streak  := v_streak + 1; counted := true;
      ELSE
        v_streak := 0;
      END IF;
    END IF;                                           -- d is today or yesterday & unlogged: grace, leave open
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

-- ── nightly reconcile: revoke any sv1/sv3/sv5 a member no longer qualifies for ──
-- Belt-and-braces: even if a phantom ever briefly inflates saved_dates, once it
-- settles this scheduled sweep revokes the badge + clears its notification. Same
-- logic as the one-off reconcile, now callable + scheduled.
CREATE OR REPLACE FUNCTION reconcile_streak_save_achievements()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
END; $$;

-- Apply the grace to every existing row, then reconcile the achievements.
SELECT recompute_all_streak_tokens();
SELECT reconcile_streak_save_achievements();

-- Schedule the reconcile nightly (03:20 UTC), after the hourly token recompute.
SELECT cron.unschedule('reconcile_streak_saves')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'reconcile_streak_saves');
SELECT cron.schedule('reconcile_streak_saves', '20 3 * * *', $$ SELECT reconcile_streak_save_achievements(); $$);

NOTIFY pgrst, 'reload schema';
