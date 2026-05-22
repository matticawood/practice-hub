-- Migration: 20260522_circle_practice_log_reactions.sql
-- Imports Circle community data into the Practice Room database:
--   Section 1: Post likes (182 rows) from Circle practice log posts
--   Section 2: Comments (77 rows) from Circle practice log posts
--   Section 3: Media updates (3 image posts + 1 Mux video for Connie)


-- ============================================================
-- Section 1: Likes
-- ============================================================
INSERT INTO community_post_likes (post_id, email, created_at)
SELECT cp.id, v.liker_email, now()
FROM (VALUES
  ('connieuitsu@gmail.com', '2026-05-20T23:06:21.349Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-20T20:48:11.321Z', 'matthew@matthewcawood.com'),
  ('cecile.dautriat@gmail.com', '2026-05-20T00:25:56.788Z', 'matthew@matthewcawood.com'),
  ('cecile.dautriat@gmail.com', '2026-05-20T00:25:56.788Z', 'norman.jaillet@gmail.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-20T00:25:56.021Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-20T00:25:56.021Z', 'norman.jaillet@gmail.com'),
  ('connieuitsu@gmail.com', '2026-05-19T22:09:29.786Z', 'matthew@matthewcawood.com'),
  ('connieuitsu@gmail.com', '2026-05-19T22:09:29.786Z', 'norman.jaillet@gmail.com'),
  ('connieuitsu@gmail.com', '2026-05-18T22:34:03.144Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-18T21:20:58.081Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-17T23:53:53.049Z', 'matthew@matthewcawood.com'),
  ('connieuitsu@gmail.com', '2026-05-17T23:29:18.340Z', 'matthew@matthewcawood.com'),
  ('connieuitsu@gmail.com', '2026-05-17T23:29:18.340Z', 'norman.jaillet@gmail.com'),
  ('lucaskinzo@hotmail.com', '2026-05-17T21:55:22.826Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-17T21:26:48.434Z', 'matthew@matthewcawood.com'),
  ('cecile.dautriat@gmail.com', '2026-05-17T20:45:47.815Z', 'matthew@matthewcawood.com'),
  ('wg33@live.co.uk', '2026-05-17T17:29:47.791Z', 'matthew@matthewcawood.com'),
  ('lucaskinzo@hotmail.com', '2026-05-17T00:19:11.625Z', 'matthew@matthewcawood.com'),
  ('connieuitsu@gmail.com', '2026-05-16T23:22:37.677Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-16T22:50:10.837Z', 'matthew@matthewcawood.com'),
  ('wg33@live.co.uk', '2026-05-16T15:44:44.202Z', 'matthew@matthewcawood.com'),
  ('cecile.dautriat@gmail.com', '2026-05-15T23:42:05.776Z', 'matthew@matthewcawood.com'),
  ('cecile.dautriat@gmail.com', '2026-05-15T23:42:05.776Z', 'norman.jaillet@gmail.com'),
  ('connieuitsu@gmail.com', '2026-05-15T23:02:16.841Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-15T18:55:35.717Z', 'matthew@matthewcawood.com'),
  ('norman.jaillet@gmail.com', '2026-05-15T13:15:34.555Z', 'cecile.dautriat@gmail.com'),
  ('norman.jaillet@gmail.com', '2026-05-15T13:15:34.555Z', 'connieuitsu@gmail.com'),
  ('norman.jaillet@gmail.com', '2026-05-15T13:15:34.555Z', 'danielduordoe@yahoo.co.uk'),
  ('norman.jaillet@gmail.com', '2026-05-15T13:15:34.555Z', 'matthew@matthewcawood.com'),
  ('norman.jaillet@gmail.com', '2026-05-15T13:15:34.555Z', 'wg33@live.co.uk'),
  ('lucaskinzo@hotmail.com', '2026-05-15T01:03:17.488Z', 'matthew@matthewcawood.com'),
  ('cecile.dautriat@gmail.com', '2026-05-15T00:23:22.926Z', 'matthew@matthewcawood.com'),
  ('connieuitsu@gmail.com', '2026-05-14T22:03:46.823Z', 'matthew@matthewcawood.com'),
  ('connieuitsu@gmail.com', '2026-05-14T22:03:46.823Z', 'norman.jaillet@gmail.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-14T15:57:54.085Z', 'matthew@matthewcawood.com'),
  ('lucaskinzo@hotmail.com', '2026-05-14T00:30:42.609Z', 'matthew@matthewcawood.com'),
  ('cecile.dautriat@gmail.com', '2026-05-13T23:45:02.015Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-13T23:17:26.027Z', 'matthew@matthewcawood.com'),
  ('connieuitsu@gmail.com', '2026-05-13T22:43:37.101Z', 'matthew@matthewcawood.com'),
  ('wg33@live.co.uk', '2026-05-13T18:07:23.585Z', 'matthew@matthewcawood.com'),
  ('michaelpage05@hotmail.co.uk', '2026-05-13T14:16:40.192Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-13T07:23:20.647Z', 'matthew@matthewcawood.com'),
  ('lucaskinzo@hotmail.com', '2026-05-12T23:35:51.837Z', 'matthew@matthewcawood.com'),
  ('connieuitsu@gmail.com', '2026-05-12T22:00:28.255Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-12T15:35:50.159Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-12T12:03:24.195Z', 'matthew@matthewcawood.com'),
  ('michaelpage05@hotmail.co.uk', '2026-05-12T11:47:06.847Z', 'matthew@matthewcawood.com'),
  ('cecile.dautriat@gmail.com', '2026-05-12T00:30:05.398Z', 'matthew@matthewcawood.com'),
  ('connieuitsu@gmail.com', '2026-05-11T22:51:01.203Z', 'danielduordoe@yahoo.co.uk'),
  ('connieuitsu@gmail.com', '2026-05-11T22:51:01.203Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-11T21:43:56.863Z', 'matthew@matthewcawood.com'),
  ('michaelpage05@hotmail.co.uk', '2026-05-11T15:18:21.898Z', 'matthew@matthewcawood.com'),
  ('connieuitsu@gmail.com', '2026-05-10T23:10:35.299Z', 'danielduordoe@yahoo.co.uk'),
  ('connieuitsu@gmail.com', '2026-05-10T23:10:35.299Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-10T21:23:15.740Z', 'matthew@matthewcawood.com'),
  ('cecile.dautriat@gmail.com', '2026-05-10T18:29:52.987Z', 'matthew@matthewcawood.com'),
  ('wg33@live.co.uk', '2026-05-10T18:07:43.183Z', 'matthew@matthewcawood.com'),
  ('lucaskinzo@hotmail.com', '2026-05-10T17:35:31.499Z', 'matthew@matthewcawood.com'),
  ('connieuitsu@gmail.com', '2026-05-09T22:36:54.300Z', 'matthew@matthewcawood.com'),
  ('lucaskinzo@hotmail.com', '2026-05-09T22:09:47.158Z', 'matthew@matthewcawood.com'),
  ('jonathan.arroyo@12yfilms.com', '2026-05-09T19:42:57.190Z', 'matthew@matthewcawood.com'),
  ('wg33@live.co.uk', '2026-05-09T15:41:49.981Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-09T00:40:12.049Z', 'connieuitsu@gmail.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-09T00:40:12.049Z', 'denzelriwai1@gmail.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-09T00:40:12.049Z', 'matthew@matthewcawood.com'),
  ('connieuitsu@gmail.com', '2026-05-08T23:06:52.875Z', 'danielduordoe@yahoo.co.uk'),
  ('connieuitsu@gmail.com', '2026-05-08T23:06:52.875Z', 'matthew@matthewcawood.com'),
  ('cecile.dautriat@gmail.com', '2026-05-08T22:11:14.205Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-08T21:46:20.152Z', 'matthew@matthewcawood.com'),
  ('wg33@live.co.uk', '2026-05-08T17:57:10.916Z', 'matthew@matthewcawood.com'),
  ('michaelpage05@hotmail.co.uk', '2026-05-08T15:13:30.964Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-08T11:31:54.710Z', 'matthew@matthewcawood.com'),
  ('cecile.dautriat@gmail.com', '2026-05-07T23:17:59.198Z', 'matthew@matthewcawood.com'),
  ('connieuitsu@gmail.com', '2026-05-07T23:03:19.502Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-07T20:47:10.708Z', 'matthew@matthewcawood.com'),
  ('wg33@live.co.uk', '2026-05-07T18:35:26.297Z', 'matthew@matthewcawood.com'),
  ('confi1@hotmail.com', '2026-05-07T16:51:19.964Z', 'matthew@matthewcawood.com'),
  ('michaelpage05@hotmail.co.uk', '2026-05-07T15:24:39.764Z', 'matthew@matthewcawood.com'),
  ('lucaskinzo@hotmail.com', '2026-05-07T14:01:30.345Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-07T07:45:09.881Z', 'matthew@matthewcawood.com'),
  ('connieuitsu@gmail.com', '2026-05-06T23:17:57.274Z', 'matthew@matthewcawood.com'),
  ('confi1@hotmail.com', '2026-05-06T19:42:04.045Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-06T19:41:42.570Z', 'matthew@matthewcawood.com'),
  ('jonathan.arroyo@12yfilms.com', '2026-05-06T13:25:44.053Z', 'matthew@matthewcawood.com'),
  ('lucaskinzo@hotmail.com', '2026-05-06T10:46:14.429Z', 'matthew@matthewcawood.com'),
  ('connieuitsu@gmail.com', '2026-05-06T06:30:25.802Z', 'matthew@matthewcawood.com'),
  ('denzelriwai1@gmail.com', '2026-05-06T06:24:01.761Z', 'cecile.dautriat@gmail.com'),
  ('denzelriwai1@gmail.com', '2026-05-06T06:24:01.761Z', 'connieuitsu@gmail.com'),
  ('denzelriwai1@gmail.com', '2026-05-06T06:24:01.761Z', 'matthew@matthewcawood.com'),
  ('cecile.dautriat@gmail.com', '2026-05-05T22:06:10.703Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-05T18:40:17.834Z', 'matthew@matthewcawood.com'),
  ('wg33@live.co.uk', '2026-05-05T18:28:45.686Z', 'matthew@matthewcawood.com'),
  ('norman.jaillet@gmail.com', '2026-05-05T14:44:30.563Z', 'cecile.dautriat@gmail.com'),
  ('norman.jaillet@gmail.com', '2026-05-05T14:44:30.563Z', 'connieuitsu@gmail.com'),
  ('norman.jaillet@gmail.com', '2026-05-05T14:44:30.563Z', 'danielduordoe@yahoo.co.uk'),
  ('norman.jaillet@gmail.com', '2026-05-05T14:44:30.563Z', 'denzelriwai1@gmail.com'),
  ('norman.jaillet@gmail.com', '2026-05-05T14:44:30.563Z', 'matthew@matthewcawood.com'),
  ('michaelpage05@hotmail.co.uk', '2026-05-05T12:09:28.028Z', 'danielduordoe@yahoo.co.uk'),
  ('michaelpage05@hotmail.co.uk', '2026-05-05T12:09:28.028Z', 'matthew@matthewcawood.com'),
  ('michaelpage05@hotmail.co.uk', '2026-05-05T12:09:28.028Z', 'norman.jaillet@gmail.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-05T10:33:22.590Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-04T23:41:10.253Z', 'matthew@matthewcawood.com'),
  ('connieuitsu@gmail.com', '2026-05-04T22:55:01.485Z', 'matthew@matthewcawood.com'),
  ('lucaskinzo@hotmail.com', '2026-05-04T19:57:21.569Z', 'matthew@matthewcawood.com'),
  ('confi1@hotmail.com', '2026-05-04T17:26:37.315Z', 'matthew@matthewcawood.com'),
  ('denzelriwai1@gmail.com', '2026-05-04T16:55:14.170Z', 'matthew@matthewcawood.com'),
  ('denzelriwai1@gmail.com', '2026-05-04T10:43:01.824Z', 'matthew@matthewcawood.com'),
  ('connieuitsu@gmail.com', '2026-05-04T08:09:01.230Z', 'danielduordoe@yahoo.co.uk'),
  ('connieuitsu@gmail.com', '2026-05-04T08:09:01.230Z', 'denzelriwai1@gmail.com'),
  ('connieuitsu@gmail.com', '2026-05-04T08:09:01.230Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-03T23:48:49.517Z', 'matthew@matthewcawood.com'),
  ('cecile.dautriat@gmail.com', '2026-05-03T20:56:53.494Z', 'matthew@matthewcawood.com'),
  ('denzelriwai1@gmail.com', '2026-05-03T14:06:08.277Z', 'matthew@matthewcawood.com'),
  ('cecile.dautriat@gmail.com', '2026-05-03T00:20:19.954Z', 'matthew@matthewcawood.com'),
  ('connieuitsu@gmail.com', '2026-05-02T23:04:39.298Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-02T18:45:05.325Z', 'matthew@matthewcawood.com'),
  ('denzelriwai1@gmail.com', '2026-05-02T16:13:50.292Z', 'danielduordoe@yahoo.co.uk'),
  ('denzelriwai1@gmail.com', '2026-05-02T16:13:50.292Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-02T00:49:56.393Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-02T00:04:11.467Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-05-02T00:00:09.688Z', 'matthew@matthewcawood.com'),
  ('cecile.dautriat@gmail.com', '2026-05-01T23:14:47.029Z', 'matthew@matthewcawood.com'),
  ('connieuitsu@gmail.com', '2026-05-01T23:03:05.458Z', 'matthew@matthewcawood.com'),
  ('confi1@hotmail.com', '2026-05-01T19:37:21.383Z', 'matthew@matthewcawood.com'),
  ('lucaskinzo@hotmail.com', '2026-05-01T10:08:01.902Z', 'matthew@matthewcawood.com'),
  ('cecile.dautriat@gmail.com', '2026-05-01T00:59:23.781Z', 'matthew@matthewcawood.com'),
  ('connieuitsu@gmail.com', '2026-04-30T22:33:30.104Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-04-30T22:15:56.425Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-04-30T22:15:19.807Z', 'matthew@matthewcawood.com'),
  ('lucaskinzo@hotmail.com', '2026-04-30T20:55:59.324Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-04-30T20:48:08.955Z', 'matthew@matthewcawood.com'),
  ('lucaskinzo@hotmail.com', '2026-04-30T14:21:14.556Z', 'matthew@matthewcawood.com'),
  ('cecile.dautriat@gmail.com', '2026-04-30T00:38:28.303Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-04-29T22:53:09.348Z', 'matthew@matthewcawood.com'),
  ('connieuitsu@gmail.com', '2026-04-29T22:30:59.372Z', 'matthew@matthewcawood.com'),
  ('lucaskinzo@hotmail.com', '2026-04-29T22:09:17.041Z', 'matthew@matthewcawood.com'),
  ('connieuitsu@gmail.com', '2026-04-28T22:43:26.301Z', 'matthew@matthewcawood.com'),
  ('cecile.dautriat@gmail.com', '2026-04-28T21:12:52.239Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-04-28T19:48:43.173Z', 'matthew@matthewcawood.com'),
  ('norman.jaillet@gmail.com', '2026-04-28T12:17:35.392Z', 'connieuitsu@gmail.com'),
  ('norman.jaillet@gmail.com', '2026-04-28T12:17:35.392Z', 'matthew@matthewcawood.com'),
  ('connieuitsu@gmail.com', '2026-04-27T22:09:35.761Z', 'matthew@matthewcawood.com'),
  ('connieuitsu@gmail.com', '2026-04-27T22:09:35.761Z', 'norman.jaillet@gmail.com'),
  ('danielduordoe@yahoo.co.uk', '2026-04-27T20:08:19.009Z', 'matthew@matthewcawood.com'),
  ('confi1@hotmail.com', '2026-04-27T17:03:38.469Z', 'matthew@matthewcawood.com'),
  ('steve@sonuslucis.com', '2026-04-27T13:23:07.695Z', 'matthew@matthewcawood.com'),
  ('lucaskinzo@hotmail.com', '2026-04-27T11:16:48.089Z', 'matthew@matthewcawood.com'),
  ('connieuitsu@gmail.com', '2026-04-26T22:43:50.078Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-04-26T22:36:17.858Z', 'matthew@matthewcawood.com'),
  ('lucaskinzo@hotmail.com', '2026-04-26T21:55:11.251Z', 'matthew@matthewcawood.com'),
  ('michaelpage05@hotmail.co.uk', '2026-04-26T17:34:21.148Z', 'matthew@matthewcawood.com'),
  ('cecile.dautriat@gmail.com', '2026-04-26T17:19:55.731Z', 'matthew@matthewcawood.com'),
  ('wg33@live.co.uk', '2026-04-26T17:10:40.179Z', 'matthew@matthewcawood.com'),
  ('connieuitsu@gmail.com', '2026-04-25T21:53:29.236Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-04-25T16:05:07.676Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-04-25T15:44:50.291Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-04-25T13:16:24.928Z', 'matthew@matthewcawood.com'),
  ('lucaskinzo@hotmail.com', '2026-04-25T09:03:44.055Z', 'matthew@matthewcawood.com'),
  ('cecile.dautriat@gmail.com', '2026-04-25T00:45:44.070Z', 'matthew@matthewcawood.com'),
  ('connieuitsu@gmail.com', '2026-04-24T22:11:58.322Z', 'matthew@matthewcawood.com'),
  ('lucaskinzo@hotmail.com', '2026-04-24T20:41:15.553Z', 'matthew@matthewcawood.com'),
  ('michaelpage05@hotmail.co.uk', '2026-04-24T14:30:09.078Z', 'matthew@matthewcawood.com'),
  ('confi1@hotmail.com', '2026-04-24T13:13:59.787Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-04-24T07:08:55.950Z', 'matthew@matthewcawood.com'),
  ('connieuitsu@gmail.com', '2026-04-23T21:51:45.133Z', 'matthew@matthewcawood.com'),
  ('cecile.dautriat@gmail.com', '2026-04-23T21:36:35.621Z', 'matthew@matthewcawood.com'),
  ('norman.jaillet@gmail.com', '2026-04-23T20:17:14.290Z', 'matthew@matthewcawood.com'),
  ('michaelpage05@hotmail.co.uk', '2026-04-23T17:00:33.350Z', 'matthew@matthewcawood.com'),
  ('confi1@hotmail.com', '2026-04-23T16:44:18.631Z', 'matthew@matthewcawood.com'),
  ('danielduordoe@yahoo.co.uk', '2026-04-23T07:08:46.313Z', 'matthew@matthewcawood.com'),
  ('larahnja@gmail.com', '2026-04-23T00:49:33.354Z', 'danielduordoe@yahoo.co.uk'),
  ('larahnja@gmail.com', '2026-04-23T00:49:33.354Z', 'confi1@hotmail.com'),
  ('larahnja@gmail.com', '2026-04-23T00:49:33.354Z', 'matthew@matthewcawood.com'),
  ('lucas.fr6@gmail.com', '2026-04-22T23:12:04.534Z', 'matthew@matthewcawood.com'),
  ('norman.jaillet@gmail.com', '2026-04-22T21:20:48.213Z', 'matthew@matthewcawood.com'),
  ('alexey@peshekhonov.com', '2026-04-22T20:48:03.762Z', 'matthew@matthewcawood.com'),
  ('confi1@hotmail.com', '2026-04-22T17:09:00.819Z', 'matthew@matthewcawood.com'),
  ('michaelpage05@hotmail.co.uk', '2026-04-22T15:20:04.569Z', 'confi1@hotmail.com'),
  ('michaelpage05@hotmail.co.uk', '2026-04-22T15:20:04.569Z', 'matthew@matthewcawood.com'),
  ('michaelpage05@hotmail.co.uk', '2026-04-22T15:20:04.569Z', 'wg33@live.co.uk'),
  ('mflander4@gmail.com', '2026-04-22T13:53:56.356Z', 'confi1@hotmail.com'),
  ('mflander4@gmail.com', '2026-04-22T13:53:56.356Z', 'matthew@matthewcawood.com')
) AS v(post_author_email, post_created_at, liker_email)
JOIN community_posts cp
  ON cp.email = v.post_author_email
 AND cp.created_at = v.post_created_at::timestamptz
ON CONFLICT (post_id, email) DO NOTHING;

-- ============================================================
-- Section 2: Comments
-- ============================================================
INSERT INTO community_post_comments (post_id, email, name, content, created_at)
SELECT cp.id, v.author_email, v.author_name, v.content, v.created_at::timestamptz
FROM (VALUES
  ('connieuitsu@gmail.com', '2026-05-19T22:09:29.786Z', 'connieuitsu@gmail.com', 'Connie Witzoe', '@Norman Jaillet 2 hours in the morning when they were in school/nursery. Then the rest in parts throughout the day and evening :)', '2026-05-20T10:20:31.126Z'),
  ('connieuitsu@gmail.com', '2026-05-19T22:09:29.786Z', 'norman.jaillet@gmail.com', 'Norman Jaillet', '3hr+!!! With kids and all … wow!', '2026-05-20T09:48:34.188Z'),
  ('connieuitsu@gmail.com', '2026-05-18T22:34:03.144Z', 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'That makes sense. Nicely done.', '2026-05-19T20:20:44.618Z'),
  ('connieuitsu@gmail.com', '2026-05-18T22:34:03.144Z', 'connieuitsu@gmail.com', 'Connie Witzoe', '@Daniel Duordoe at the moment I''m switching between about 3 different pieces. Rachmaninoff''s prelude, Florian Christl''s Vivalidi Variation (roughly half way through that one now, been practicing a lot today), and I''m still working on Air on the G string. However I started Arabesque no 1 and Chopin''s Nocturne in C# minor a couple of months ago and stopped about 1.5 pages in, so I''ll likely pick up those again soon.The other pieces (moonlight sonata, clair de lune, Passacaglia, prelude in C minor etc) are pieces I''ve already learned and just playing through regularly so I don''t forget them.', '2026-05-19T13:56:03.417Z'),
  ('connieuitsu@gmail.com', '2026-05-18T22:34:03.144Z', 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'How many pieces do you learn at a go, if you don''t mind me asking? You''re really racing through the pieces. I am still toying with the idea of doing at least a new piece a month but I am quite interested in improvisation as well and my time is quite limited.', '2026-05-19T13:39:07.623Z'),
  ('connieuitsu@gmail.com', '2026-05-17T23:29:18.340Z', 'connieuitsu@gmail.com', 'Connie Witzoe', '@Norman Jaillet yeah I have to do split it up. In the day I''ve got the kids around me so sometimes only get 5 min in here and there, then in the evenings I can sometimes do an hour+ stretch. Monday mornings I often get 1-2 hours in while this kids are in school/nursery so I get the most done then 😊', '2026-05-18T11:53:40.206Z'),
  ('connieuitsu@gmail.com', '2026-05-17T23:29:18.340Z', 'norman.jaillet@gmail.com', 'Norman Jaillet', 'That’s a long time on the bench! Did you break up the session? My goal is 2 hrs/day …. haven’t come close yet!', '2026-05-18T11:44:46.294Z'),
  ('norman.jaillet@gmail.com', '2026-05-15T13:15:34.555Z', 'matthew@matthewcawood.com', 'Matthew Cawood', 'Nice work Norman, you’ve been through quite the collection of pianos! You’re back is just congratulating you for consistent playing, a tough decision though - heal the back or play piano 🤔 - especially when you have this to play on!', '2026-05-15T14:50:14.594Z'),
  ('connieuitsu@gmail.com', '2026-05-11T22:51:01.203Z', 'connieuitsu@gmail.com', 'Connie Witzoe', '@Daniel Duordoe ooh thanks! Saves me trying to find it. Appreciate it 😊', '2026-05-12T07:07:52.200Z'),
  ('connieuitsu@gmail.com', '2026-05-11T22:51:01.203Z', 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'That''s my version in C major.', '2026-05-12T05:17:42.316Z'),
  ('connieuitsu@gmail.com', '2026-05-10T23:10:35.299Z', 'connieuitsu@gmail.com', 'Connie Witzoe', '@Daniel Duordoe oh! I don''t have that version, mine''s super simple 😅 did you get this off the practice hub?', '2026-05-11T15:50:12.682Z'),
  ('connieuitsu@gmail.com', '2026-05-10T23:10:35.299Z', 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'That''s the first page of mine.', '2026-05-11T15:47:43.483Z'),
  ('connieuitsu@gmail.com', '2026-05-10T23:10:35.299Z', 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', '@Connie Witzoe I will try this version and let you know what I think. It''s always a good idea to learn them in different keys.', '2026-05-11T15:47:21.579Z'),
  ('connieuitsu@gmail.com', '2026-05-10T23:10:35.299Z', 'connieuitsu@gmail.com', 'Connie Witzoe', '@Daniel Duordoe this is the first page 😅', '2026-05-11T13:24:47.205Z'),
  ('connieuitsu@gmail.com', '2026-05-10T23:10:35.299Z', 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', '@Connie Witzoe Lool. No, I haven''t seen that one. Yes, the plan is to record it when I am done.', '2026-05-11T13:19:06.274Z'),
  ('connieuitsu@gmail.com', '2026-05-10T23:10:35.299Z', 'connieuitsu@gmail.com', 'Connie Witzoe', '@Daniel Duordoe have you seen the D major version with all the chords in the right hand? 🙈 I''m like “no thanks” 😂You should record it when you''ve polished it 😊', '2026-05-11T11:36:27.729Z'),
  ('connieuitsu@gmail.com', '2026-05-10T23:10:35.299Z', 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', '@Connie Witzoe Yes my version is in C major. It''s not totally done yet - It''s now in the ''Polishing'' phase. I have only done the first line of the Moonlight sonata to be honest; I started it on Friday.', '2026-05-11T11:24:03.821Z'),
  ('connieuitsu@gmail.com', '2026-05-10T23:10:35.299Z', 'connieuitsu@gmail.com', 'Connie Witzoe', '@Daniel Duordoe haha I know 😅 Matt suggested a Bach piece and it was already in my library. Did you do it in C Major? How''s the moonlight sonata going for you?', '2026-05-11T07:58:53.955Z'),
  ('connieuitsu@gmail.com', '2026-05-10T23:10:35.299Z', 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'Haha. We swapped pieces.', '2026-05-11T07:52:38.220Z'),
  ('connieuitsu@gmail.com', '2026-05-08T23:06:52.875Z', 'connieuitsu@gmail.com', 'Connie Witzoe', '@Daniel Duordoe it can be quite fun. :)', '2026-05-09T08:19:31.174Z'),
  ('connieuitsu@gmail.com', '2026-05-08T23:06:52.875Z', 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'Nice! I watched a two-hour improvisation tutorial today. It''s a fascinating concept.', '2026-05-09T00:41:16.812Z'),
  ('denzelriwai1@gmail.com', '2026-05-06T06:24:01.761Z', 'denzelriwai1@gmail.com', 'Denzel R Riwai', '@Matthew Cawood Thank you for the feedback Matt, do you have a favourite scale? Or do you jump between them depending on emotion.', '2026-05-07T04:42:13.529Z'),
  ('denzelriwai1@gmail.com', '2026-05-06T06:24:01.761Z', 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'Thanks for sharing, it never crossed my mind to try that out…', '2026-05-06T23:28:22.214Z'),
  ('denzelriwai1@gmail.com', '2026-05-06T06:24:01.761Z', 'matthew@matthewcawood.com', 'Matthew Cawood', 'Nice work! You’re right…the black keys are a great way of improvising without having the extra barrier of worrying about which keys are a part/not part of the scale. They make a pentatonic scale which is what guitarists use all the time for guitar solos and it’s also used a lot for stereotypical asian sounding music. If you want to add an extra layer on top you could add an “A” to the scale. That makes an F# major blues scale (F# G# A A# C# D#) which can sound cool. You’re doing great! Your sense of rhythm and ability to just play like this is more impressive than you think. Those are skills you get from doing this kind of improvisation stuff and is a massive part of being a well rounded musician that many people struggle with. I’m glad you felt encouraged to post something!', '2026-05-06T08:44:51.955Z'),
  ('norman.jaillet@gmail.com', '2026-05-05T14:44:30.563Z', 'norman.jaillet@gmail.com', 'Norman Jaillet', '@Cécile Dautriat thanks so much!', '2026-05-06T12:27:05.758Z'),
  ('norman.jaillet@gmail.com', '2026-05-05T14:44:30.563Z', 'cecile.dautriat@gmail.com', 'Cécile Dautriat', 'Amazing! Congrats on the recital.', '2026-05-05T22:18:42.234Z'),
  ('norman.jaillet@gmail.com', '2026-05-05T14:44:30.563Z', 'norman.jaillet@gmail.com', 'Norman Jaillet', 'It’s on the list!! 😁', '2026-05-05T21:04:15.075Z'),
  ('norman.jaillet@gmail.com', '2026-05-05T14:44:30.563Z', 'norman.jaillet@gmail.com', 'Norman Jaillet', 'My first one! Been taking lessons for 2 years, after a 50 yr hiatus from playing accordion!', '2026-05-05T21:03:26.872Z'),
  ('norman.jaillet@gmail.com', '2026-05-05T14:44:30.563Z', 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', '@Norman Jaillet Please do Moonlight sonata. I am working on the first movement this month. I believe @Connie Witzoe also has it in her repertoire.', '2026-05-05T18:42:01.744Z'),
  ('norman.jaillet@gmail.com', '2026-05-05T14:44:30.563Z', 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'That''s wonderful! Great job! Do you all get together often for recitals?', '2026-05-05T18:09:41.974Z'),
  ('norman.jaillet@gmail.com', '2026-05-05T14:44:30.563Z', 'norman.jaillet@gmail.com', 'Norman Jaillet', '@Denzel R Riwai i would recommend Hanon to get the fingers going but I also got the Faber-Hanon edition recently. Worth checking out.', '2026-05-05T16:10:57.953Z'),
  ('norman.jaillet@gmail.com', '2026-05-05T14:44:30.563Z', 'denzelriwai1@gmail.com', 'Denzel R Riwai', 'Absolutely Amazing, don''t ever forget that performing for others alone is a feat that takes a lot of confidence and practice. You''re certainly on your way to heights you''re not ready for with practice like this Norman.. your practice is super diligent too, you''re even considering wether it''s worth investing more time into specific pieces lest they return less than you hope.Would you recommend hanons pianist excercises? And yes, we see the virtuoso in the plaid shirt! Looking good Norman, keep it up.', '2026-05-05T15:22:10.872Z'),
  ('norman.jaillet@gmail.com', '2026-05-05T14:44:30.563Z', 'matthew@matthewcawood.com', 'Matthew Cawood', 'Nice work Norman, congratulations on the recital and I’m glad it went well. The photo looks great! 🎉', '2026-05-05T14:56:50.414Z'),
  ('michaelpage05@hotmail.co.uk', '2026-05-05T12:09:28.028Z', 'michaelpage05@hotmail.co.uk', 'Michael Page', '@Denzel R Riwai Yeah. Some of it was time restraints.', '2026-05-05T16:18:38.629Z'),
  ('michaelpage05@hotmail.co.uk', '2026-05-05T12:09:28.028Z', 'denzelriwai1@gmail.com', 'Denzel R Riwai', 'You''re ticking a lot of boxes at once, it''s great to have you back at it.. maybe you feel a little cleaner upon your return? Sometimes a break does more then a practice session.', '2026-05-05T15:25:07.243Z'),
  ('michaelpage05@hotmail.co.uk', '2026-05-05T12:09:28.028Z', 'michaelpage05@hotmail.co.uk', 'Michael Page', '@Daniel Duordoe Thank you. Life just got busy and I wasn’t feeling well.', '2026-05-05T13:13:22.021Z'),
  ('michaelpage05@hotmail.co.uk', '2026-05-05T12:09:28.028Z', 'danielduordoe@yahoo.co.uk', 'Daniel Duordoe', 'Glad to have you back.', '2026-05-05T12:27:33.997Z'),
  ('connieuitsu@gmail.com', '2026-05-04T22:55:01.485Z', 'connieuitsu@gmail.com', 'Connie Witzoe', '@Matthew Cawood you should make it so we can have laugh emojis rather than just "likes" on comments too 😂', '2026-05-05T16:04:07.133Z'),
  ('connieuitsu@gmail.com', '2026-05-04T22:55:01.485Z', 'matthew@matthewcawood.com', 'Matthew Cawood', '@Denzel R Riwai straight out of the back pocket 😂', '2026-05-05T16:00:43.217Z'),
  ('connieuitsu@gmail.com', '2026-05-04T22:55:01.485Z', 'denzelriwai1@gmail.com', 'Denzel R Riwai', 'Matts a final boss of piano for sure 💀, pulled the real sheet music out the archive paper back.', '2026-05-05T15:56:55.754Z'),
  ('connieuitsu@gmail.com', '2026-05-04T22:55:01.485Z', 'connieuitsu@gmail.com', 'Connie Witzoe', '@Matthew Cawood thanks 😁 It will probably be many many months before I finish it and feel comfortable recording it though 😅', '2026-05-05T15:53:44.985Z'),
  ('connieuitsu@gmail.com', '2026-05-04T22:55:01.485Z', 'matthew@matthewcawood.com', 'Matthew Cawood', '@Connie Witzoe I thought you might be! I’m looking forward to hearing this piece, it’s a nice one 😀', '2026-05-05T15:51:09.611Z'),
  ('connieuitsu@gmail.com', '2026-05-04T22:55:01.485Z', 'connieuitsu@gmail.com', 'Connie Witzoe', '@Matthew Cawood aaah nice thank you so much!! That is actually how I''ve been playing it so I''m super relieved now. Though the right hand falls apart a little bit when I add the left in 😅', '2026-05-05T15:45:13.340Z'),
  ('connieuitsu@gmail.com', '2026-05-04T22:55:01.485Z', 'matthew@matthewcawood.com', 'Matthew Cawood', '@Connie Witzoe Here you go! It’s probably worth mentioning that many players will read/play this slightly differently and I am going to take guess that it’s written differently in different editions. However, some players will just play the 2 notes with the last note and use rubato to stretch it out a little (like how it is spaced in my henle edition). But based on the note lengths alone, this is my assessment:Nonstop Cam (3) 4.mov', '2026-05-05T15:30:47.203Z'),
  ('connieuitsu@gmail.com', '2026-05-04T22:55:01.485Z', 'connieuitsu@gmail.com', 'Connie Witzoe', '@Matthew Cawood lol! I couldn''t put 3 different rhythms in to the polyrhythm app so people will probably go "what''s going on there??" when I finally share the piece in the feedback section 😅If you want to share a short video of you playing it suuuuuuuuper slow if you ever have the time, then I would be super grateful 😇🙈 all the versions I''ve heard of it they play that part pretty rubato so I get a little confused 🙈', '2026-05-05T15:05:35.378Z'),
  ('connieuitsu@gmail.com', '2026-05-04T22:55:01.485Z', 'connieuitsu@gmail.com', 'Connie Witzoe', '@Norman Jaillet hahaha let me know if you try it. It helps having heard the piece first of course 😅', '2026-05-05T15:01:32.708Z'),
  ('connieuitsu@gmail.com', '2026-05-04T22:55:01.485Z', 'matthew@matthewcawood.com', 'Matthew Cawood', '@Connie Witzoe you’ll have to get the calculator out for that 😬', '2026-05-05T14:59:48.399Z'),
  ('connieuitsu@gmail.com', '2026-05-04T22:55:01.485Z', 'norman.jaillet@gmail.com', 'Norman Jaillet', '@Connie Witzoe I will! Not hopeful but … 😆', '2026-05-05T14:52:56.728Z'),
  ('connieuitsu@gmail.com', '2026-05-04T22:55:01.485Z', 'connieuitsu@gmail.com', 'Connie Witzoe', '@Norman Jaillet lol! If you tried it you''d know what i mean 😅', '2026-05-05T14:50:16.637Z'),
  ('connieuitsu@gmail.com', '2026-05-04T22:55:01.485Z', 'norman.jaillet@gmail.com', 'Norman Jaillet', 'That #%&amp;* bar 21 - gave me a good chuckle!!', '2026-05-05T14:47:27.639Z'),
  ('connieuitsu@gmail.com', '2026-05-04T22:55:01.485Z', 'connieuitsu@gmail.com', 'Connie Witzoe', '@Denzel R Riwai 100%!', '2026-05-04T23:37:34.166Z'),
  ('connieuitsu@gmail.com', '2026-05-04T22:55:01.485Z', 'denzelriwai1@gmail.com', 'Denzel R Riwai', 'Can''t encourage that little ear training habit enough, keeps you from getting frustrated, gives you a break, ticks the ear training box ( far more beneficial and easier to recognise notes in kids songs ) that small habit will compound Into something very tangible. Absolutely do gotta work with what you can get 😆', '2026-05-04T23:27:52.908Z'),
  ('denzelriwai1@gmail.com', '2026-05-02T16:13:50.292Z', 'matthew@matthewcawood.com', 'Matthew Cawood', 'Sight reading definitely is one of those one’s that is slower until it suddenly becomes way more efficient. The G#, B, G# in the left hand is worth persevering with because that shape is standard arpeggio/chord shaping for a G# minor chord. It’s a little bit more awkward in this particular piece because of the hands crossing over each other, but if you can manage it…I personally think it’s better for technique and voicing of the chord. Also another thing to check with those kind of things; if your left hand feels a little uncomfortable stretching to the right, it might be worth trying it sitting further back 😀', '2026-05-03T10:15:53.380Z'),
  ('connieuitsu@gmail.com', '2026-04-30T22:33:30.104Z', 'gnpedgar@yahoo.com', 'Norma Edgar', 'I missed that. Thanks!', '2026-05-03T00:55:37.959Z'),
  ('connieuitsu@gmail.com', '2026-04-30T22:33:30.104Z', 'connieuitsu@gmail.com', 'Connie Witzoe', '@Norma Edgar hi. It''s the new feature Matt posted to the Practice hub. He made a video about it here in the “updates” space. #UPDATE: Key Explorer', '2026-05-02T23:33:19.456Z'),
  ('connieuitsu@gmail.com', '2026-04-30T22:33:30.104Z', 'gnpedgar@yahoo.com', 'Norma Edgar', 'Hi Connie, what is the Key explorer?', '2026-05-02T23:25:13.588Z'),
  ('danielduordoe@yahoo.co.uk', '2026-04-29T22:53:09.348Z', 'matthew@matthewcawood.com', 'Matthew Cawood', 'Nice to see the passage fixer is still working for you 😊', '2026-04-29T22:58:09.826Z'),
  ('connieuitsu@gmail.com', '2026-04-29T22:30:59.372Z', 'matthew@matthewcawood.com', 'Matthew Cawood', 'You got to the piano, which is the main thing! 😀', '2026-04-29T22:45:26.744Z'),
  ('lucaskinzo@hotmail.com', '2026-04-29T22:09:17.041Z', 'matthew@matthewcawood.com', 'Matthew Cawood', 'Nice work, 1h 50m is quite the session!', '2026-04-29T22:44:56.182Z'),
  ('norman.jaillet@gmail.com', '2026-04-28T12:17:35.392Z', 'matthew@matthewcawood.com', 'Matthew Cawood', 'You’ve really been putting in the time this week Norman! It’s great to see! i like the variety of pieces as well. 😀', '2026-04-28T13:15:17.940Z'),
  ('danielduordoe@yahoo.co.uk', '2026-04-25T15:44:50.291Z', 'matthew@matthewcawood.com', 'Matthew Cawood', 'Excellent takeaways from an excellent video! 😉', '2026-04-25T15:56:27.918Z'),
  ('connieuitsu@gmail.com', '2026-04-24T22:11:58.322Z', 'connieuitsu@gmail.com', 'Connie Witzoe', 'Ah… what a great way of looking at it. And slowing it down even more leading up to before that chord ends will definitely make it sound less abrupt.I think I''ll also watch more videos of how other pianists look like and handle that part to make it sound more natural, most of the audio files I''ve listened to I don''t like their interpretation of it 🙈Thanks for the tips! 😊', '2026-04-25T07:04:12.569Z'),
  ('connieuitsu@gmail.com', '2026-04-24T22:11:58.322Z', 'matthew@matthewcawood.com', 'Matthew Cawood', '@Connie Witzoe I think the silence there says a lot in that moment. Leading up to that bar there is “smorzando” which means dying away in both speed and dynamic. But at the same time as that smorzando, you get an E major chord (with the G#) and then an E minor chord (with the G natural) in bar 22..so you get this momentary feeling of weird positivity before it gets tainted by the E minor and that feels to me almost like coming to terms with and submitting to the inevitable heavy sinking feeling that the piece has (because the chords are wanting to sink from the very beginning).So in bar 23, you have a dominant 7th which wants to resolve, but before we do that at the end of the piece, the silence feels like a breath before finally almost saying goodbye. If you hold the pedal, then I think you lose that moment of reflection and stillness. It’s almost like when you move house and before you lock the door for the final time, you turn around to look at the place.I think the key is really to have slowed down enough and place that chord in bar 23 enough so that the silence almost feels like that natural next thing and you can feel the impact of that silence.', '2026-04-25T00:07:09.940Z'),
  ('connieuitsu@gmail.com', '2026-04-24T22:11:58.322Z', 'connieuitsu@gmail.com', 'Connie Witzoe', '@Matthew Cawood the left hand is definitely challenging in that part.How do you feel about the pause between the final chord in bar 23 leading up to the final bar? I''ve never really liked that silent part before ending the piece and always want to keep the pedal down and link bar 23 and 24 together.', '2026-04-24T23:54:33.808Z'),
  ('connieuitsu@gmail.com', '2026-04-24T22:11:58.322Z', 'matthew@matthewcawood.com', 'Matthew Cawood', 'ahhh bar 16 to 19…everything in that piece is leading to that epic but awkward part!', '2026-04-24T23:40:59.232Z'),
  ('lucaskinzo@hotmail.com', '2026-04-24T20:41:15.553Z', 'matthew@matthewcawood.com', 'Matthew Cawood', 'That’s some series Burgmuller-ing. A nice set of pieces though and they are very good for technique. The Pathetique is a classic!', '2026-04-24T21:38:06.807Z'),
  ('connieuitsu@gmail.com', '2026-04-23T21:51:45.133Z', 'connieuitsu@gmail.com', 'Connie Witzoe', '@Matthew Cawood I''ve only ever improvised in the C Major scale but I know I have to practice all the other scales and it was fun doing it that way. :)', '2026-04-23T22:43:20.482Z'),
  ('connieuitsu@gmail.com', '2026-04-23T21:51:45.133Z', 'matthew@matthewcawood.com', 'Matthew Cawood', 'Nice work, it’s always fun having to relearn something! Nice to see some improvisation in there as well! Your smashing it.', '2026-04-23T22:35:49.601Z'),
  ('cecile.dautriat@gmail.com', '2026-04-23T21:36:35.621Z', 'matthew@matthewcawood.com', 'Matthew Cawood', 'Nice! A full session!', '2026-04-23T22:34:15.535Z'),
  ('norman.jaillet@gmail.com', '2026-04-23T20:17:14.290Z', 'matthew@matthewcawood.com', 'Matthew Cawood', '20 minutes is still a good session to get in. Many people would leave it, so nice work getting it done. 😀', '2026-04-23T22:46:37.526Z'),
  ('michaelpage05@hotmail.co.uk', '2026-04-23T17:00:33.350Z', 'michaelpage05@hotmail.co.uk', 'Michael Page', 'Thank you. I don’t have a lot of time during the week. But try to do 15 minutes a day. I plan to add some sight reading today.', '2026-04-24T06:27:53.596Z'),
  ('michaelpage05@hotmail.co.uk', '2026-04-23T17:00:33.350Z', 'matthew@matthewcawood.com', 'Matthew Cawood', 'Good consistency with the scales and pieces, keeping your core scales and pieces and slowly adding new ones in is the perfect way to do it.', '2026-04-23T22:48:25.423Z'),
  ('confi1@hotmail.com', '2026-04-23T16:44:18.631Z', 'matthew@matthewcawood.com', 'Matthew Cawood', 'Your killing it with the practice Kelly! 🫢', '2026-04-23T16:55:42.963Z'),
  ('confi1@hotmail.com', '2026-04-22T17:09:00.819Z', 'matthew@matthewcawood.com', 'Matthew Cawood', '@Kelly Williams That’s the curse of being a pianist 😂', '2026-04-22T17:49:57.309Z'),
  ('confi1@hotmail.com', '2026-04-22T17:09:00.819Z', 'confi1@hotmail.com', 'Kelly Williams', '@Matthew Cawood somehow it feels like I should always do more!! 😅', '2026-04-22T17:41:06.126Z'),
  ('confi1@hotmail.com', '2026-04-22T17:09:00.819Z', 'matthew@matthewcawood.com', 'Matthew Cawood', 'Nice work! A long session, looks like you got quite a lot done!', '2026-04-22T17:37:34.878Z'),
  ('mflander4@gmail.com', '2026-04-22T13:53:56.356Z', 'matthew@matthewcawood.com', 'Matthew Cawood', 'Great work, You’ve Got a friend in Me is such a great song!', '2026-04-22T14:01:48.745Z')
) AS v(post_author_email, post_created_at, author_email, author_name, content, created_at)
JOIN community_posts cp
  ON cp.email = v.post_author_email
 AND cp.created_at = v.post_created_at::timestamptz
WHERE NOT EXISTS (
  SELECT 1 FROM community_post_comments cpc
  WHERE cpc.post_id = cp.id
    AND cpc.email   = v.author_email
    AND cpc.created_at = v.created_at::timestamptz
);

-- ============================================================
-- Section 3: Media
-- ============================================================

-- Image: Norman's weekly log May 6-15 (slug: norman-s-log-may-6-may-15)
UPDATE community_posts
SET media = media || '[{"type":"image","url":"https://assets-v2.circle.so/u364d6rn38lczbug72ia0hcrumlc"}]'::jsonb
WHERE email = 'norman.jaillet@gmail.com'
  AND created_at = '2026-05-15T13:15:34.555Z'::timestamptz
  AND NOT (media::text LIKE '%u364d6rn38lczbug72ia0hcrumlc%');

-- Image: Norman's weekly log Apr 29–May 5 (slug: norman-s-log-apr-29-may-5)
UPDATE community_posts
SET media = media || '[{"type":"image","url":"https://assets-v2.circle.so/tmjgz3lccbln69mwws6un9xe1oua"}]'::jsonb
WHERE email = 'norman.jaillet@gmail.com'
  AND created_at = '2026-05-05T14:44:30.563Z'::timestamptz
  AND NOT (media::text LIKE '%tmjgz3lccbln69mwws6un9xe1oua%');

-- Image: Daniel's Air on the G String post (slug: monday-27-april-2026-1h-15m-air-on-the-g)
UPDATE community_posts
SET media = media || '[{"type":"image","url":"https://assets-v2.circle.so/erhwiu239nnrgo2xe17uwdunbcm1"}]'::jsonb
WHERE email = 'danielduordoe@yahoo.co.uk'
  AND NOT (media::text LIKE '%erhwiu239nnrgo2xe17uwdunbcm1%');

-- Mux video: Connie's "Monday 4 May 2026 · 1h 15m" practice post
-- Mux playback_id recovered from Nonstop_Cam_3_4.mov (see 20260522_circle_comment_videos_batch2.sql)
UPDATE community_posts
SET media = media || '[{"type":"mux","playback_id":"Fpo7ZMfebPA1mLaBb01h91hLGS461r78OJ3NEyWqMY004"}]'::jsonb
WHERE email = 'connieuitsu@gmail.com'
  AND created_at = '2026-05-04T22:55:01.485Z'::timestamptz
  AND NOT (media::text LIKE '%Fpo7ZMfebPA1mLaBb01h91hLGS461r78OJ3NEyWqMY004%');
