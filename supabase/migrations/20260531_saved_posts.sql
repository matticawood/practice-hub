-- Saved / bookmarked posts. One row per (user, post). Covers every post type
-- that surfaces in the community feed:
--   post_type = 'community'              → community_posts (incl. practice logs)
--               'content_feed'           → content_feed_posts
--               'weekly_focus'           → weekly_focus
--               'practice_room_update'   → practice_room_updates
--
-- post_id is stored as text so it works regardless of the source table's id
-- type. Each user manages only their own rows (RLS, case-insensitive email).
--
-- Run this in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/gyskfutmncprqxazgatv/sql

create table if not exists saved_posts (
  id         uuid        primary key default gen_random_uuid(),
  email      text        not null,
  post_type  text        not null,
  post_id    text        not null,
  created_at timestamptz not null default now(),
  unique (email, post_type, post_id)
);

create index if not exists saved_posts_email_idx on saved_posts (email);

alter table saved_posts enable row level security;

drop policy if exists saved_posts_select_own on saved_posts;
create policy saved_posts_select_own on saved_posts
  for select to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

drop policy if exists saved_posts_insert_own on saved_posts;
create policy saved_posts_insert_own on saved_posts
  for insert to authenticated
  with check (lower(email) = lower(auth.jwt() ->> 'email'));

drop policy if exists saved_posts_delete_own on saved_posts;
create policy saved_posts_delete_own on saved_posts
  for delete to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

notify pgrst, 'reload schema';
