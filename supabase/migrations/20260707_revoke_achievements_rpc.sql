-- ================================================================
-- revoke_achievements(p_ids) — let a member drop badges they no longer qualify for
-- Generated 2026-07-07
--
-- Why: achievements are recorded via record_achievements and are otherwise
-- sticky. When a member reverses the thing that earned a badge (e.g. un-marks a
-- course lesson as complete, which also removes the practice it auto-logged),
-- the badge should go too. Members cannot DELETE their own achievement_events
-- under RLS, so this SECURITY DEFINER function does it for them, but ONLY for
-- their own account (it keys off auth.jwt() email, never a passed-in address).
--
-- The client reconcile decides WHICH ids are no longer earned (by re-running the
-- same check() functions) and passes just those; this function only deletes.
-- It also clears the matching "achievement unlocked" notifications so the badge
-- doesn't linger in the bell. Safe to re-run: DELETE ... WHERE is idempotent.
--
-- Run in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql
-- ================================================================

CREATE OR REPLACE FUNCTION revoke_achievements(p_ids text[])
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(auth.jwt() ->> 'email');
  v_count int := 0;
BEGIN
  IF v_email IS NULL OR v_email = '' OR p_ids IS NULL OR array_length(p_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  DELETE FROM achievement_events
  WHERE lower(email) = v_email
    AND achievement_id = ANY (p_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Drop the "Achievement unlocked" notifications for those ids. Notifications
  -- carry source_id = 'ach_<id>' and metadata->>'achievement_id' = '<id>'.
  DELETE FROM notifications
  WHERE lower(email) = v_email
    AND type = 'achievement'
    AND (
      source_id = ANY (SELECT 'ach_' || x FROM unnest(p_ids) AS x)
      OR (metadata ->> 'achievement_id') = ANY (p_ids)
    );

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION revoke_achievements(text[]) TO authenticated;

NOTIFY pgrst, 'reload schema';
