-- ──────────────────────────────────────────────────────────────────────────────
-- Fix: get_user_streak_saves RPC
--
-- Problem: the function was returning saved_dates array length, which can be
-- non-zero even for users who never missed a day (if the cron incorrectly
-- populated saved_dates). This caused Safety Net / Resilient / Never Give Up
-- achievements to fire without the user ever genuinely using a save token.
--
-- Fix: return (total_earned - balance) — tokens earned minus tokens remaining
-- = tokens actually consumed. This is zero until a save is genuinely spent.
-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_user_streak_saves(p_email text)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT GREATEST(0, COALESCE(total_earned, 0) - COALESCE(balance, 0))
  FROM streak_tokens
  WHERE email = p_email
  LIMIT 1;
$$;
