-- Let a shared practice-log post bundle in the member's other activity from the
-- same day (auto-logged games/lessons/articles + earlier logged-but-unshared
-- sessions), so they never re-log something just to get it into a community post.
-- The primary session stays in session_id; the extra chosen sessions go here.
-- The community feed hydrates + merges these client-side.

alter table public.community_posts
  add column if not exists extra_session_ids bigint[];

comment on column public.community_posts.extra_session_ids is
  'Additional practice_sessions.id the member chose to bundle into this shared practice-log post (same day). Rendered merged with session_id in the community feed.';
