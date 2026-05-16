-- ──────────────────────────────────────────────────────────────────────────────
-- Fix incorrectly applied streak saves (identified by diagnostic query).
--
-- connieuitsu@gmail.com  — 2026-05-01 saved but session exists that day
--                          Remove the bad date, restore 1 token.
--                          Still has legitimate save on 2026-05-07 → keep sv1.
--
-- lucaskinzo@hotmail.com — 2026-05-11 saved but session exists that day
--                          Only save, and it was wrong → restore 1 token,
--                          revoke sv1 achievement + notification.
-- ──────────────────────────────────────────────────────────────────────────────

-- ── connieuitsu: remove bad date, restore 1 token ────────────────────────────
UPDATE streak_tokens
SET
  saved_dates = (
    SELECT COALESCE(jsonb_agg(d ORDER BY d), '[]'::jsonb)
    FROM jsonb_array_elements_text(saved_dates) AS d
    WHERE d <> '2026-05-01'
  ),
  balance = balance + 1,
  updated_at = now()
WHERE email = 'connieuitsu@gmail.com';

-- ── lucaskinzo: remove bad date, restore 1 token ─────────────────────────────
UPDATE streak_tokens
SET
  saved_dates = (
    SELECT COALESCE(jsonb_agg(d ORDER BY d), '[]'::jsonb)
    FROM jsonb_array_elements_text(saved_dates) AS d
    WHERE d <> '2026-05-11'
  ),
  balance = balance + 1,
  updated_at = now()
WHERE email = 'lucaskinzo@hotmail.com';

-- Revoke sv1 achievement (saves_used now = 0)
DELETE FROM achievement_events
WHERE email = 'lucaskinzo@hotmail.com'
  AND achievement_id = 'sv1';

-- Remove the notification so it doesn't reappear
DELETE FROM notifications
WHERE email = 'lucaskinzo@hotmail.com'
  AND source_id = 'ach_sv1';

-- ── Verify final state ────────────────────────────────────────────────────────
SELECT
  st.email,
  st.balance,
  st.total_earned,
  GREATEST(0, st.total_earned - st.balance) AS saves_used,
  st.saved_dates,
  EXISTS (
    SELECT 1 FROM achievement_events ae
    WHERE ae.email = st.email AND ae.achievement_id = 'sv1'
  ) AS has_sv1
FROM streak_tokens st
WHERE st.email IN ('connieuitsu@gmail.com', 'lucaskinzo@hotmail.com')
ORDER BY st.email;
