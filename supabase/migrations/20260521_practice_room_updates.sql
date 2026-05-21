-- ── Practice Room Updates ───────────────────────────────────────────────────
-- Mirrors content_feed_posts / content_feed_comments / content_feed_likes
-- but uses the practice_room_updates namespace.

-- ── 1. Posts table ────────────────────────────────────────────────────────────
create table if not exists practice_room_updates (
  id           uuid        primary key default gen_random_uuid(),
  title        text        not null default '',
  body         text        not null default '',
  media        jsonb       not null default '[]',
  published_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

alter table practice_room_updates enable row level security;

-- Members can read all posts
create policy "members_read_updates"
  on practice_room_updates for select
  using (
    exists (
      select 1 from allowed_emails ae
      where ae.email = auth.email()
    )
  );

-- Admin can insert
create policy "admin_insert_updates"
  on practice_room_updates for insert
  with check (auth.email() = 'matthew@matthewcawood.com');

-- Admin can update
create policy "admin_update_updates"
  on practice_room_updates for update
  using  (auth.email() = 'matthew@matthewcawood.com')
  with check (auth.email() = 'matthew@matthewcawood.com');

-- Admin can delete
create policy "admin_delete_updates"
  on practice_room_updates for delete
  using (auth.email() = 'matthew@matthewcawood.com');


-- ── 2. Comments table ─────────────────────────────────────────────────────────
create table if not exists practice_room_update_comments (
  id                uuid        primary key default gen_random_uuid(),
  update_id         uuid        not null references practice_room_updates(id) on delete cascade,
  parent_comment_id uuid        references practice_room_update_comments(id) on delete cascade,
  email             text        not null,
  name              text        not null default '',
  content           text        not null default '',
  media             jsonb       not null default '[]',
  created_at        timestamptz not null default now()
);

alter table practice_room_update_comments enable row level security;

-- Members can read all comments
create policy "members_read_update_comments"
  on practice_room_update_comments for select
  using (
    exists (
      select 1 from allowed_emails ae
      where ae.email = auth.email()
    )
  );

-- Members can insert their own comments
create policy "members_insert_update_comments"
  on practice_room_update_comments for insert
  with check (
    auth.email() = email
    and exists (
      select 1 from allowed_emails ae
      where ae.email = auth.email()
    )
  );

-- Members can delete their own comments; admin can delete any
create policy "members_delete_own_update_comments"
  on practice_room_update_comments for delete
  using (
    auth.email() = email
    or auth.email() = 'matthew@matthewcawood.com'
  );


-- ── 3. Likes / reactions table ────────────────────────────────────────────────
create table if not exists practice_room_update_likes (
  update_id  uuid  not null references practice_room_updates(id) on delete cascade,
  email      text  not null,
  emoji      text  not null default '❤️',
  created_at timestamptz not null default now(),
  primary key (update_id, email)
);

alter table practice_room_update_likes enable row level security;

-- Members can read all likes
create policy "members_read_update_likes"
  on practice_room_update_likes for select
  using (
    exists (
      select 1 from allowed_emails ae
      where ae.email = auth.email()
    )
  );

-- Members can insert their own likes
create policy "members_insert_update_likes"
  on practice_room_update_likes for insert
  with check (
    auth.email() = email
    and exists (
      select 1 from allowed_emails ae
      where ae.email = auth.email()
    )
  );

-- Members can delete their own likes
create policy "members_delete_own_update_likes"
  on practice_room_update_likes for delete
  using (auth.email() = email);

-- Members can update their own likes (to change emoji)
create policy "members_update_own_update_likes"
  on practice_room_update_likes for update
  using  (auth.email() = email)
  with check (auth.email() = email);
