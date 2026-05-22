-- ================================================================
-- Link imported Circle practice-log posts to their practice_sessions rows
-- Generated 2026-05-22
--
-- The Circle posts were all "Share to Community" posts, so every one
-- has a matching practice_sessions row. Parse the date from the Circle
-- text content ("Thursday 21 May 2026  ·  5 min …") and JOIN to
-- practice_sessions on email + session_date to set session_id.
--
-- Posts with no matching session (user not in DB, or date parse fails)
-- are left with session_id = NULL and fall back to text rendering.
-- ================================================================

-- Temporary safe date parser to avoid TO_DATE errors on bad input
CREATE OR REPLACE FUNCTION _parse_circle_session_date(txt TEXT)
RETURNS DATE LANGUAGE plpgsql AS $$
BEGIN
  -- Extract the part before '·', strip to first line, normalise whitespace
  RETURN TO_DATE(
    TRIM(REGEXP_REPLACE(
      SPLIT_PART(SPLIT_PART(txt, '·', 1), chr(10), 1),
      '\s+', ' ', 'g'
    )),
    'FMDay FMDD FMMonth YYYY'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- Update session_id for all unlinked practice_log posts
UPDATE community_posts cp
SET session_id = (
  SELECT ps.id
  FROM   practice_sessions ps
  WHERE  ps.email        = cp.email
    AND  ps.session_date = _parse_circle_session_date(cp.content)
  ORDER  BY ps.id
  LIMIT  1
)
WHERE cp.type        = 'practice_log'
  AND cp.session_id  IS NULL
  AND cp.content     LIKE '%·%';   -- only posts that have the Circle header

-- Remove the temporary helper
DROP FUNCTION IF EXISTS _parse_circle_session_date(TEXT);
