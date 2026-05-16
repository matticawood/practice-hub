-- ──────────────────────────────────────────────────────────────────────────────
-- Revoke streak-save achievements that were awarded incorrectly.
--
-- Root cause: the achievement check used saved_dates.length, which the nightly
-- cron could populate for users who never missed a day.  The correct metric is
-- (total_earned - balance) — tokens actually consumed.
--
-- This script:
--   1. Deletes achievement_events rows for sv1/sv3/sv5 where the user hasn't
--      genuinely consumed enough tokens to deserve each badge.
--   2. Deletes the matching notifications so the badge doesn't re-appear.
--
-- Safe to re-run: uses DELETE … WHERE which is idempotent.
-- ──────────────────────────────────────────────────────────────────────────────

-- ── Helper: how many saves has each user actually spent? ──────────────────────
-- saves_used = total_earned - balance  (capped at 0 in case of data oddities)

-- ── sv1 — Safety Net (≥ 1 save used) ─────────────────────────────────────────
DELETE FROM achievement_events ae
USING (
  SELECT ae2.email
  FROM achievement_events ae2
  LEFT JOIN streak_tokens st ON st.email = ae2.email
  WHERE ae2.achievement_id = 'sv1'
    AND GREATEST(0, COALESCE(st.total_earned, 0) - COALESCE(st.balance, 0)) < 1
) unearned
WHERE ae.achievement_id = 'sv1'
  AND ae.email = unearned.email;

DELETE FROM notifications
WHERE source_id = 'ach_sv1'
  AND email IN (
    SELECT ae.email
    FROM achievement_events ae
    RIGHT JOIN (
      SELECT DISTINCT email FROM notifications WHERE source_id = 'ach_sv1'
    ) n ON n.email = ae.email AND ae.achievement_id = 'sv1'
    WHERE ae.achievement_id IS NULL  -- no longer in achievement_events
  );

-- ── sv3 — Resilient (≥ 3 saves used) ─────────────────────────────────────────
DELETE FROM achievement_events ae
USING (
  SELECT ae2.email
  FROM achievement_events ae2
  LEFT JOIN streak_tokens st ON st.email = ae2.email
  WHERE ae2.achievement_id = 'sv3'
    AND GREATEST(0, COALESCE(st.total_earned, 0) - COALESCE(st.balance, 0)) < 3
) unearned
WHERE ae.achievement_id = 'sv3'
  AND ae.email = unearned.email;

DELETE FROM notifications
WHERE source_id = 'ach_sv3'
  AND email IN (
    SELECT ae.email
    FROM achievement_events ae
    RIGHT JOIN (
      SELECT DISTINCT email FROM notifications WHERE source_id = 'ach_sv3'
    ) n ON n.email = ae.email AND ae.achievement_id = 'sv3'
    WHERE ae.achievement_id IS NULL
  );

-- ── sv5 — Never Give Up (≥ 5 saves used) ─────────────────────────────────────
DELETE FROM achievement_events ae
USING (
  SELECT ae2.email
  FROM achievement_events ae2
  LEFT JOIN streak_tokens st ON st.email = ae2.email
  WHERE ae2.achievement_id = 'sv5'
    AND GREATEST(0, COALESCE(st.total_earned, 0) - COALESCE(st.balance, 0)) < 5
) unearned
WHERE ae.achievement_id = 'sv5'
  AND ae.email = unearned.email;

DELETE FROM notifications
WHERE source_id = 'ach_sv5'
  AND email IN (
    SELECT ae.email
    FROM achievement_events ae
    RIGHT JOIN (
      SELECT DISTINCT email FROM notifications WHERE source_id = 'ach_sv5'
    ) n ON n.email = ae.email AND ae.achievement_id = 'sv5'
    WHERE ae.achievement_id IS NULL
  );

-- ── Verify: show who still legitimately holds each badge ─────────────────────
SELECT
  ae.achievement_id,
  ae.email,
  GREATEST(0, COALESCE(st.total_earned, 0) - COALESCE(st.balance, 0)) AS saves_used
FROM achievement_events ae
LEFT JOIN streak_tokens st ON st.email = ae.email
WHERE ae.achievement_id IN ('sv1', 'sv3', 'sv5')
ORDER BY ae.achievement_id, saves_used DESC;
