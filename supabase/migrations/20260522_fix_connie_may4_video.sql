-- ================================================================
-- Fix: move Mux video from Connie's post to Matthew's comment
-- Generated 2026-05-22
--
-- The video Nonstop_Cam_3_4.mov (Mux Fpo7ZMfebPA1mLaBb01h91hLGS461r78OJ3NEyWqMY004)
-- was mistakenly attached to Connie's "Monday 4 May 2026 · 1h 15m" post.
-- It is actually Matthew's comment on that post ("Here you go! ...").
-- ================================================================

-- 1. Remove the Mux video from Connie's post media
UPDATE community_posts
SET media = COALESCE(
  (
    SELECT jsonb_agg(elem)
    FROM jsonb_array_elements(media) elem
    WHERE elem->>'playback_id' != 'Fpo7ZMfebPA1mLaBb01h91hLGS461r78OJ3NEyWqMY004'
      AND elem->>'playback_id' IS DISTINCT FROM NULL
  ),
  '[]'::jsonb
)
WHERE email      = 'connieuitsu@gmail.com'
  AND created_at = '2026-05-04T22:55:01.485Z'::timestamptz
  AND media::text LIKE '%Fpo7ZMfebPA1mLaBb01h91hLGS461r78OJ3NEyWqMY004%';

-- 2. Add the Mux video to Matthew's comment on that post
--    Comment: "Here you go! It's probably worth mentioning that many players..."
--    Timestamp: 2026-05-05T15:30:47.203Z
UPDATE community_post_comments
SET media = '[{"type":"mux","playback_id":"Fpo7ZMfebPA1mLaBb01h91hLGS461r78OJ3NEyWqMY004"}]'::jsonb
WHERE email      = 'matthew@matthewcawood.com'
  AND created_at = '2026-05-05T15:30:47.203Z'::timestamptz
  AND post_id = (
    SELECT id FROM community_posts
    WHERE email      = 'connieuitsu@gmail.com'
      AND created_at = '2026-05-04T22:55:01.485Z'::timestamptz
    LIMIT 1
  );
