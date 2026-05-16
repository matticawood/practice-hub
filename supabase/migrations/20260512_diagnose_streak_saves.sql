-- ──────────────────────────────────────────────────────────────────────────────
-- Diagnostic: for every user who holds sv1, show their saved_dates alongside
-- their actual session dates so we can see if each saved date genuinely bridges
-- a gap between two real sessions.
--
-- A saved date is LEGITIMATE if:
--   • there is a real session on the day BEFORE the saved date  OR
--   • there is a real session somewhere earlier (it bridges a multi-day gap)
--   AND
--   • there is NO real session on the saved date itself
--     (if they practiced that day, the save was unnecessary)
-- ──────────────────────────────────────────────────────────────────────────────

WITH sv1_holders AS (
  SELECT email FROM achievement_events WHERE achievement_id = 'sv1'
),
saves AS (
  -- Unpack saved_dates JSONB array into individual rows
  SELECT
    st.email,
    saved_date::date AS saved_date,
    st.balance,
    st.total_earned,
    GREATEST(0, COALESCE(st.total_earned,0) - COALESCE(st.balance,0)) AS saves_used
  FROM streak_tokens st
  JOIN sv1_holders h ON h.email = st.email
  CROSS JOIN LATERAL jsonb_array_elements_text(st.saved_dates) AS saved_date
),
sessions AS (
  SELECT DISTINCT email, session_date
  FROM practice_sessions
  WHERE email IN (SELECT email FROM sv1_holders)
),
annotated AS (
  SELECT
    sv.email,
    sv.saved_date,
    sv.saves_used,
    -- Is there a real session on this saved date? (save was wasted/wrong)
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.email = sv.email AND s.session_date = sv.saved_date
    ) AS session_exists_on_saved_date,
    -- Is there a real session in the 7 days before this saved date?
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.email = sv.email
        AND s.session_date >= sv.saved_date - INTERVAL '7 days'
        AND s.session_date < sv.saved_date
    ) AS anchored_behind,
    -- Is there a real session in the 7 days after this saved date?
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.email = sv.email
        AND s.session_date > sv.saved_date
        AND s.session_date <= sv.saved_date + INTERVAL '7 days'
    ) AS anchored_ahead
  FROM saves sv
)
SELECT
  email,
  saved_date,
  saves_used,
  CASE
    WHEN session_exists_on_saved_date THEN '❌ WRONG — practiced this day, save not needed'
    WHEN NOT anchored_behind          THEN '❌ WRONG — no session in 7 days before'
    WHEN NOT anchored_ahead           THEN '⚠️  SUSPECT — no session after (dangling)'
    ELSE                                   '✅ OK — genuine gap bridge'
  END AS verdict
FROM annotated
ORDER BY email, saved_date;
