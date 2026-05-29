-- get_activity_feed_v2()
--
-- Unified feed for the community activity card. Returns up to ~200 recent
-- events across multiple event_types so the client can group consecutive
-- same-person events into a single summary card.
--
-- Excludes Matthew + secondary + reviewer accounts.
-- Each per-type CTE caps at 50 rows so one chatty member doesn't drown out
-- everyone else, then we ORDER BY created_at DESC and LIMIT 200 overall.
--
-- event_type values:
--   session, achievement, post, comment, reply, piece_added,
--   note_high_score, chord_high_score, note_game_first, chord_game_first

CREATE OR REPLACE FUNCTION get_activity_feed_v2()
RETURNS TABLE (
  email             text,
  name              text,
  created_at        timestamptz,
  event_type        text,
  -- Per-type metadata (NULL where not applicable)
  achievement_id    text,
  duration_minutes  integer,
  post_id           text,
  post_type         text,
  parent_post_id    text,
  piece_title       text,
  piece_composer    text,
  piece_status      text,
  game_score        integer,
  game_clef         text,
  game_kind         text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH excl AS (
  SELECT unnest(ARRAY[
    'matthew@matthewcawood.com',
    'mcawoodcanada@gmail.com',
    'reviewer@matthewcawood.com'
  ]) AS email
),

-- 1. Practice sessions
sessions AS (
  SELECT
    ps.email, ae.name, ps.session_date AS created_at,
    'session'::text                AS event_type,
    NULL::text                     AS achievement_id,
    ps.duration_minutes,
    NULL::text                     AS post_id,
    NULL::text                     AS post_type,
    NULL::text                     AS parent_post_id,
    NULL::text                     AS piece_title,
    NULL::text                     AS piece_composer,
    NULL::text                     AS piece_status,
    NULL::integer                  AS game_score,
    NULL::text                     AS game_clef,
    NULL::text                     AS game_kind
  FROM practice_sessions ps
  LEFT JOIN allowed_emails ae ON ae.email = ps.email
  WHERE ps.email NOT IN (SELECT email FROM excl)
  ORDER BY ps.session_date DESC
  LIMIT 50
),

-- 2. Achievement events
achievements AS (
  SELECT
    aev.email, ae.name, aev.earned_at AS created_at,
    'achievement'::text, aev.achievement_id::text,
    NULL::integer,
    NULL::text, NULL::text, NULL::text,
    NULL::text, NULL::text, NULL::text,
    NULL::integer, NULL::text, NULL::text
  FROM achievement_events aev
  LEFT JOIN allowed_emails ae ON ae.email = aev.email
  WHERE aev.email NOT IN (SELECT email FROM excl)
  ORDER BY aev.earned_at DESC
  LIMIT 50
),

-- 3. Community posts
posts AS (
  SELECT
    cp.email, ae.name, cp.created_at,
    'post'::text, NULL::text,
    NULL::integer,
    cp.id::text, cp.type::text, NULL::text,
    NULL::text, NULL::text, NULL::text,
    NULL::integer, NULL::text, NULL::text
  FROM community_posts cp
  LEFT JOIN allowed_emails ae ON ae.email = cp.email
  WHERE cp.email NOT IN (SELECT email FROM excl)
  ORDER BY cp.created_at DESC
  LIMIT 50
),

-- 4. Community comments (top-level vs reply split by parent_comment_id)
comments AS (
  SELECT
    cpc.email, ae.name, cpc.created_at,
    CASE WHEN cpc.parent_comment_id IS NULL THEN 'comment' ELSE 'reply' END::text,
    NULL::text, NULL::integer,
    cpc.post_id::text, NULL::text, cpc.parent_comment_id::text,
    NULL::text, NULL::text, NULL::text,
    NULL::integer, NULL::text, NULL::text
  FROM community_post_comments cpc
  LEFT JOIN allowed_emails ae ON ae.email = cpc.email
  WHERE cpc.email NOT IN (SELECT email FROM excl)
  ORDER BY cpc.created_at DESC
  LIMIT 50
),

-- 5. Pieces added to a collection
pieces_added AS (
  SELECT
    uc.email, ae.name, uc.created_at,
    'piece_added'::text, NULL::text,
    NULL::integer,
    NULL::text, NULL::text, NULL::text,
    COALESCE(p.title,    up.title)    AS piece_title,
    COALESCE(p.composer, up.composer) AS piece_composer,
    uc.status::text                   AS piece_status,
    NULL::integer, NULL::text, NULL::text
  FROM user_collections uc
  LEFT JOIN allowed_emails ae ON ae.email = uc.email
  LEFT JOIN pieces        p  ON p.id  = uc.piece_id
  LEFT JOIN user_pieces   up ON up.id = uc.user_piece_id
  WHERE uc.email NOT IN (SELECT email FROM excl)
  ORDER BY uc.created_at DESC
  LIMIT 50
),

-- 6. Note-game personal bests (each row where score beats all previous scores
--    for that email — includes the FIRST score because prev_best is NULL).
note_pbs AS (
  SELECT email, score, clef, created_at FROM (
    SELECT email, score, clef, created_at,
      MAX(score) OVER (
        PARTITION BY email
        ORDER BY created_at
        ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
      ) AS prev_best
    FROM note_game_scores
  ) sub
  WHERE score > COALESCE(prev_best, -1)
),
note_high_scores AS (
  SELECT
    nb.email, ae.name, nb.created_at,
    'note_high_score'::text, NULL::text,
    NULL::integer,
    NULL::text, NULL::text, NULL::text,
    NULL::text, NULL::text, NULL::text,
    nb.score, nb.clef, 'note'::text
  FROM note_pbs nb
  LEFT JOIN allowed_emails ae ON ae.email = nb.email
  WHERE nb.email NOT IN (SELECT email FROM excl)
  ORDER BY nb.created_at DESC
  LIMIT 30
),

-- 7. Chord-game personal bests
chord_pbs AS (
  SELECT email, score, clef, created_at FROM (
    SELECT email, score, clef, created_at,
      MAX(score) OVER (
        PARTITION BY email
        ORDER BY created_at
        ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
      ) AS prev_best
    FROM chord_game_scores
  ) sub
  WHERE score > COALESCE(prev_best, -1)
),
chord_high_scores AS (
  SELECT
    cb.email, ae.name, cb.created_at,
    'chord_high_score'::text, NULL::text,
    NULL::integer,
    NULL::text, NULL::text, NULL::text,
    NULL::text, NULL::text, NULL::text,
    cb.score, cb.clef, 'chord'::text
  FROM chord_pbs cb
  LEFT JOIN allowed_emails ae ON ae.email = cb.email
  WHERE cb.email NOT IN (SELECT email FROM excl)
  ORDER BY cb.created_at DESC
  LIMIT 30
),

-- 8. First time playing the note game (one row per email — their earliest)
note_firsts AS (
  SELECT email, MIN(created_at) AS created_at
  FROM note_game_scores
  GROUP BY email
),
note_first_events AS (
  SELECT
    nf.email, ae.name, nf.created_at,
    'note_game_first'::text, NULL::text,
    NULL::integer,
    NULL::text, NULL::text, NULL::text,
    NULL::text, NULL::text, NULL::text,
    NULL::integer, NULL::text, 'note'::text
  FROM note_firsts nf
  LEFT JOIN allowed_emails ae ON ae.email = nf.email
  WHERE nf.email NOT IN (SELECT email FROM excl)
  ORDER BY nf.created_at DESC
  LIMIT 20
),

-- 9. First time playing the chord game
chord_firsts AS (
  SELECT email, MIN(created_at) AS created_at
  FROM chord_game_scores
  GROUP BY email
),
chord_first_events AS (
  SELECT
    cf.email, ae.name, cf.created_at,
    'chord_game_first'::text, NULL::text,
    NULL::integer,
    NULL::text, NULL::text, NULL::text,
    NULL::text, NULL::text, NULL::text,
    NULL::integer, NULL::text, 'chord'::text
  FROM chord_firsts cf
  LEFT JOIN allowed_emails ae ON ae.email = cf.email
  WHERE cf.email NOT IN (SELECT email FROM excl)
  ORDER BY cf.created_at DESC
  LIMIT 20
)

SELECT * FROM sessions
UNION ALL SELECT * FROM achievements
UNION ALL SELECT * FROM posts
UNION ALL SELECT * FROM comments
UNION ALL SELECT * FROM pieces_added
UNION ALL SELECT * FROM note_high_scores
UNION ALL SELECT * FROM chord_high_scores
UNION ALL SELECT * FROM note_first_events
UNION ALL SELECT * FROM chord_first_events
ORDER BY created_at DESC
LIMIT 200;
$$;

GRANT EXECUTE ON FUNCTION get_activity_feed_v2() TO authenticated;

NOTIFY pgrst, 'reload schema';
