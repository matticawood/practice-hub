-- One row per person, said in keys.
--
-- These tables each hold "one row per person per thing": one like per post, one
-- vote per poll, one RSVP per event. The app relies on that when it upserts,
-- naming the pair in an ON CONFLICT clause - and every one of those pairs is
-- currently written in addresses. To say the same thing by key, a unique index
-- on the key pair has to exist.
--
-- These are additions. The existing keys and constraints are left exactly as
-- they are, so nothing that writes today changes behaviour. Every row on every
-- one of these tables already carries a member key, and the address pair is
-- already unique, so the key pair is unique too: a key maps to exactly one
-- address (283 addresses, 283 keys).
--
-- Guests are why NULLS NOT DISTINCT is not used: a guest at a live event has no
-- membership and so no key, and two guests must not collide with each other.

create unique index if not exists achievement_events_member_key_achievement_id_key
  on public.achievement_events (member_key, achievement_id);

create unique index if not exists activity_reactions_member_key_uniq
  on public.activity_reactions (member_key, event_type, item_id, emoji);

create unique index if not exists community_chat_reactions_member_key_uniq
  on public.community_chat_reactions (message_id, member_key);

create unique index if not exists community_post_likes_member_key_uniq
  on public.community_post_likes (post_id, member_key);

create unique index if not exists content_feed_likes_member_key_uniq
  on public.content_feed_likes (post_id, member_key);

create unique index if not exists content_feed_post_poll_votes_member_key_uniq
  on public.content_feed_post_poll_votes (poll_id, member_key);

create unique index if not exists event_attendance_member_key_uniq
  on public.event_attendance (event_id, member_key);

create unique index if not exists event_rsvps_member_key_uniq
  on public.event_rsvps (event_id, member_key);

create unique index if not exists practice_room_update_likes_member_key_uniq
  on public.practice_room_update_likes (update_id, member_key);

create unique index if not exists tc_comment_poll_votes_member_key_uniq
  on public.tc_comment_poll_votes (poll_id, member_key);

create unique index if not exists weekly_focus_likes_member_key_uniq
  on public.weekly_focus_likes (focus_id, member_key);

notify pgrst, 'reload schema';
