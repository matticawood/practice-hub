-- [v5 2026-06-28] Add live-event comments to the activity feed (ev_comments CTE,
-- post_type='event') so clinic-event comments show up like every other comment
-- type. Full recreate of get_activity_feed_v2(); keeps everything from v4.
--
-- [v4 2026-06-13] Add the Chord Ear Training game to the activity feed, exactly
-- like Note/Chord Recognition: per-email personal bests (ear_high_score) and a
-- first-play milestone (ear_game_first). game_clef carries the chord_set so the
-- client can show a "(sevenths)"-style subtitle; game_kind = 'ear'.
--
-- Full recreate of get_activity_feed_v2() (supersedes 20260602). Keeps the
-- content_feed/weekly_focus/update comment CTEs from v3.
--
-- event_type values:
--   session, achievement, post, comment, reply, piece_added,
--   note_high_score, chord_high_score, note_game_first, chord_game_first,
--   ear_high_score, ear_game_first

DROP FUNCTION IF EXISTS get_activity_feed_v2();

CREATE OR REPLACE FUNCTION get_activity_feed_v2()
RETURNS TABLE (
  email             text,
  name              text,
  created_at        timestamptz,
  event_type        text,
  item_id           text,
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
    ps.email, ae.name,
    COALESCE(ps.created_at, ps.session_date::timestamptz) AS created_at,
    'session'::text                AS event_type,
    ps.id::text                    AS item_id,
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
  ORDER BY COALESCE(ps.created_at, ps.session_date::timestamptz) DESC
  LIMIT 50
),

-- 2. Achievement events
achievements AS (
  SELECT
    aev.email, ae.name, aev.earned_at AS created_at,
    'achievement'::text, aev.id::text,
    aev.achievement_id::text,
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
    'post'::text, cp.id::text,
    NULL::text,
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
    cpc.id::text,
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

-- 4b. Content-feed comments (YouTube / articles).
cf_comments AS (
  SELECT
    c.email, ae.name, c.created_at,
    CASE WHEN c.parent_comment_id IS NULL THEN 'comment' ELSE 'reply' END::text,
    c.id::text,
    NULL::text, NULL::integer,
    c.post_id::text, 'content_feed'::text, c.parent_comment_id::text,
    p.title::text, left(c.content, 280)::text, NULL::text,
    NULL::integer, NULL::text, NULL::text
  FROM content_feed_comments c
  LEFT JOIN allowed_emails ae ON ae.email = c.email
  LEFT JOIN content_feed_posts p ON p.id = c.post_id
  WHERE c.email NOT IN (SELECT email FROM excl)
  ORDER BY c.created_at DESC
  LIMIT 30
),

-- 4c. Weekly-focus comments.
wf_comments AS (
  SELECT
    c.email, ae.name, c.created_at,
    CASE WHEN c.parent_comment_id IS NULL THEN 'comment' ELSE 'reply' END::text,
    c.id::text,
    NULL::text, NULL::integer,
    c.focus_id::text, 'weekly_focus'::text, c.parent_comment_id::text,
    f.headline::text, left(c.content, 280)::text, NULL::text,
    NULL::integer, NULL::text, NULL::text
  FROM weekly_focus_comments c
  LEFT JOIN allowed_emails ae ON ae.email = c.email
  LEFT JOIN weekly_focus f ON f.id = c.focus_id
  WHERE c.email NOT IN (SELECT email FROM excl)
  ORDER BY c.created_at DESC
  LIMIT 30
),

-- 4d. Practice-room update comments.
upd_comments AS (
  SELECT
    c.email, ae.name, c.created_at,
    CASE WHEN c.parent_comment_id IS NULL THEN 'comment' ELSE 'reply' END::text,
    c.id::text,
    NULL::text, NULL::integer,
    c.update_id::text, 'update'::text, c.parent_comment_id::text,
    u.title::text, left(c.content, 280)::text, NULL::text,
    NULL::integer, NULL::text, NULL::text
  FROM practice_room_update_comments c
  LEFT JOIN allowed_emails ae ON ae.email = c.email
  LEFT JOIN practice_room_updates u ON u.id = c.update_id
  WHERE c.email NOT IN (SELECT email FROM excl)
  ORDER BY c.created_at DESC
  LIMIT 30
),

-- 4e. Live-event (clinic) comments.
ev_comments AS (
  SELECT
    c.email, ae.name, c.created_at,
    CASE WHEN c.parent_id IS NULL THEN 'comment' ELSE 'reply' END::text,
    c.id::text,
    NULL::text, NULL::integer,
    c.event_id::text, 'event'::text, c.parent_id::text,
    e.title::text, left(c.content, 280)::text, NULL::text,
    NULL::integer, NULL::text, NULL::text
  FROM event_comments c
  LEFT JOIN allowed_emails ae ON ae.email = c.email
  LEFT JOIN live_events e ON e.id = c.event_id
  WHERE c.email NOT IN (SELECT email FROM excl)
  ORDER BY c.created_at DESC
  LIMIT 30
),

-- 5. Pieces added to a collection
pieces_added AS (
  SELECT
    uc.email, ae.name, uc.created_at,
    'piece_added'::text, uc.id::text,
    NULL::text,
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

-- 6. Note-game personal bests
note_pbs AS (
  SELECT id, email, score, clef, created_at FROM (
    SELECT id, email, score, clef, created_at,
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
    'note_high_score'::text, nb.id::text,
    NULL::text,
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
  SELECT id, email, score, clef, created_at FROM (
    SELECT id, email, score, clef, created_at,
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
    'chord_high_score'::text, cb.id::text,
    NULL::text,
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

-- 8. Ear-training game personal bests (game_clef carries chord_set)
ear_pbs AS (
  SELECT id, email, score, chord_set, created_at FROM (
    SELECT id, email, score, chord_set, created_at,
      MAX(score) OVER (
        PARTITION BY email
        ORDER BY created_at
        ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
      ) AS prev_best
    FROM ear_game_scores
  ) sub
  WHERE score > COALESCE(prev_best, -1)
),
ear_high_scores AS (
  SELECT
    eb.email, ae.name, eb.created_at,
    'ear_high_score'::text, eb.id::text,
    NULL::text,
    NULL::integer,
    NULL::text, NULL::text, NULL::text,
    NULL::text, NULL::text, NULL::text,
    eb.score, eb.chord_set, 'ear'::text
  FROM ear_pbs eb
  LEFT JOIN allowed_emails ae ON ae.email = eb.email
  WHERE eb.email NOT IN (SELECT email FROM excl)
  ORDER BY eb.created_at DESC
  LIMIT 30
),

-- 9. First time playing the note game
note_firsts AS (
  SELECT email, MIN(created_at) AS created_at
  FROM note_game_scores
  GROUP BY email
),
note_first_events AS (
  SELECT
    nf.email, ae.name, nf.created_at,
    'note_game_first'::text, NULL::text,
    NULL::text,
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

-- 10. First time playing the chord game
chord_firsts AS (
  SELECT email, MIN(created_at) AS created_at
  FROM chord_game_scores
  GROUP BY email
),
chord_first_events AS (
  SELECT
    cf.email, ae.name, cf.created_at,
    'chord_game_first'::text, NULL::text,
    NULL::text,
    NULL::integer,
    NULL::text, NULL::text, NULL::text,
    NULL::text, NULL::text, NULL::text,
    NULL::integer, NULL::text, 'chord'::text
  FROM chord_firsts cf
  LEFT JOIN allowed_emails ae ON ae.email = cf.email
  WHERE cf.email NOT IN (SELECT email FROM excl)
  ORDER BY cf.created_at DESC
  LIMIT 20
),

-- 11. First time playing the ear-training game
ear_firsts AS (
  SELECT email, MIN(created_at) AS created_at
  FROM ear_game_scores
  GROUP BY email
),
ear_first_events AS (
  SELECT
    ef.email, ae.name, ef.created_at,
    'ear_game_first'::text, NULL::text,
    NULL::text,
    NULL::integer,
    NULL::text, NULL::text, NULL::text,
    NULL::text, NULL::text, NULL::text,
    NULL::integer, NULL::text, 'ear'::text
  FROM ear_firsts ef
  LEFT JOIN allowed_emails ae ON ae.email = ef.email
  WHERE ef.email NOT IN (SELECT email FROM excl)
  ORDER BY ef.created_at DESC
  LIMIT 20
)

SELECT * FROM sessions
UNION ALL SELECT * FROM achievements
UNION ALL SELECT * FROM posts
UNION ALL SELECT * FROM comments
UNION ALL SELECT * FROM cf_comments
UNION ALL SELECT * FROM wf_comments
UNION ALL SELECT * FROM upd_comments
UNION ALL SELECT * FROM ev_comments
UNION ALL SELECT * FROM pieces_added
UNION ALL SELECT * FROM note_high_scores
UNION ALL SELECT * FROM chord_high_scores
UNION ALL SELECT * FROM ear_high_scores
UNION ALL SELECT * FROM note_first_events
UNION ALL SELECT * FROM chord_first_events
UNION ALL SELECT * FROM ear_first_events
ORDER BY created_at DESC
LIMIT 200;
$$;

GRANT EXECUTE ON FUNCTION get_activity_feed_v2() TO authenticated;


-- ── Server-side owner notification for new event comments ────────────────────
-- Replaces the fragile client-side notify (which depended on the commenter's
-- possibly-cached events.html). Fires from the DB for every new TOP-LEVEL comment
-- on a live event, from anyone but the owner.
CREATE OR REPLACE FUNCTION notify_owner_event_comment() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF NEW.parent_id IS NULL AND lower(coalesce(NEW.email,'')) <> 'matthew@matthewcawood.com' THEN
    INSERT INTO notifications (email, type, title, body, link_url, metadata)
    VALUES (
      'matthew@matthewcawood.com',
      'new_comment',
      coalesce(NEW.name, 'Someone') || ' commented on ' ||
        coalesce((SELECT title FROM live_events WHERE id = NEW.event_id), 'an event'),
      left(coalesce(NULLIF(NEW.content, ''), 'Sent an attachment'), 120),
      '/events.html?event=' || NEW.event_id,
      jsonb_build_object('event_id', NEW.event_id, 'comment_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_notify_owner_event_comment ON event_comments;
CREATE TRIGGER trg_notify_owner_event_comment
  AFTER INSERT ON event_comments
  FOR EACH ROW EXECUTE FUNCTION notify_owner_event_comment();

NOTIFY pgrst, 'reload schema';
