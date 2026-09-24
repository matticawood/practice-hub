-- Polls: vote as yourself, and only attach a poll to your own post or comment.
--
-- What was open: any member could add or delete a poll on anybody's post, add
-- options to anybody's poll, and insert, change or delete anybody's votes. That
-- is ballot stuffing and graffiti, on eight tables.
--
-- Two facts shaped the rules, both checked first:
--   every poll table CASCADES from its parent post or comment, and a cascade
--   bypasses RLS, so deleting a post still clears its poll. Members therefore
--   never need delete rights on polls at all.
--
--   tc_comment_polls.comment_id has no foreign key, because the shared comment
--   component serves six different tables. All six use uuid ids, so a comment
--   can be matched across them without ambiguity.

create or replace function public.owns_comment(p_comment_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $fn$
  select exists (
    select 1 from community_post_comments       where id = p_comment_id and lower(email) = lower((select auth.jwt() ->> 'email'))
    union all
    select 1 from content_feed_comments         where id = p_comment_id and lower(email) = lower((select auth.jwt() ->> 'email'))
    union all
    select 1 from event_comments                where id = p_comment_id and lower(email) = lower((select auth.jwt() ->> 'email'))
    union all
    select 1 from activity_comments             where id = p_comment_id and lower(email) = lower((select auth.jwt() ->> 'email'))
    union all
    select 1 from weekly_focus_comments         where id = p_comment_id and lower(email) = lower((select auth.jwt() ->> 'email'))
    union all
    select 1 from practice_room_update_comments where id = p_comment_id and lower(email) = lower((select auth.jwt() ->> 'email'))
  );
$fn$;

create or replace function public.is_site_owner()
returns boolean
language sql
stable
as $fn$ select lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'matthew@matthewcawood.com'; $fn$;

grant execute on function public.owns_comment(uuid) to authenticated;
grant execute on function public.is_site_owner() to authenticated, anon;

-- ---------------------------------------------------------- community polls --
drop policy if exists "Members can insert polls" on public.community_post_polls;
drop policy if exists "Members can delete polls" on public.community_post_polls;
create policy "poll_insert_on_own_parent" on public.community_post_polls for insert to authenticated
  with check (
    public.is_site_owner()
    or (post_id is not null and exists (
          select 1 from community_posts p
          where p.id = post_id and lower(p.email) = lower((select auth.jwt() ->> 'email'))))
    or (comment_id is not null and public.owns_comment(comment_id))
  );
create policy "poll_delete_owner" on public.community_post_polls for delete to authenticated
  using (public.is_site_owner());

drop policy if exists "Members can insert poll options" on public.community_post_poll_options;
create policy "poll_option_insert_on_own_poll" on public.community_post_poll_options for insert to authenticated
  with check (
    public.is_site_owner()
    or exists (
      select 1 from community_post_polls pl
      where pl.id = poll_id
        and ((pl.post_id is not null and exists (
               select 1 from community_posts p where p.id = pl.post_id
                 and lower(p.email) = lower((select auth.jwt() ->> 'email'))))
          or (pl.comment_id is not null and public.owns_comment(pl.comment_id))))
  );

-- the blanket delete sat beside "Members can manage own votes", which is correct
drop policy if exists "members delete community_post_poll_votes" on public.community_post_poll_votes;

-- ------------------------------------------------------- comment-thread polls --
drop policy if exists "members write tc_comment_polls" on public.tc_comment_polls;
create policy "tc_poll_insert_on_own_comment" on public.tc_comment_polls for insert to authenticated
  with check (public.is_site_owner() or public.owns_comment(comment_id));

drop policy if exists "members write tc_comment_poll_options" on public.tc_comment_poll_options;
create policy "tc_option_insert_on_own_poll" on public.tc_comment_poll_options for insert to authenticated
  with check (
    public.is_site_owner()
    or exists (select 1 from tc_comment_polls pl where pl.id = poll_id and public.owns_comment(pl.comment_id))
  );

drop policy if exists "members insert tc_comment_poll_votes" on public.tc_comment_poll_votes;
drop policy if exists "members update tc_comment_poll_votes" on public.tc_comment_poll_votes;
drop policy if exists "members delete tc_comment_poll_votes" on public.tc_comment_poll_votes;
create policy "tc_vote_insert_own" on public.tc_comment_poll_votes for insert to authenticated
  with check (lower(email) = lower((select auth.jwt() ->> 'email')));
create policy "tc_vote_update_own" on public.tc_comment_poll_votes for update to authenticated
  using (lower(email) = lower((select auth.jwt() ->> 'email')))
  with check (lower(email) = lower((select auth.jwt() ->> 'email')));
create policy "tc_vote_delete_own" on public.tc_comment_poll_votes for delete to authenticated
  using (lower(email) = lower((select auth.jwt() ->> 'email')));

-- ------------------------------------------------------------ content feed --
-- Authored only on content-feed.html, which is Matthew's page. Members vote.
drop policy if exists "members write content_feed_post_polls" on public.content_feed_post_polls;
drop policy if exists "members update content_feed_post_polls" on public.content_feed_post_polls;
drop policy if exists "members delete content_feed_post_polls" on public.content_feed_post_polls;
create policy "cf_poll_write_owner" on public.content_feed_post_polls for all to authenticated
  using (public.is_site_owner()) with check (public.is_site_owner());

drop policy if exists "members write content_feed_post_poll_options" on public.content_feed_post_poll_options;
drop policy if exists "members update content_feed_post_poll_options" on public.content_feed_post_poll_options;
drop policy if exists "members delete content_feed_post_poll_options" on public.content_feed_post_poll_options;
create policy "cf_option_write_owner" on public.content_feed_post_poll_options for all to authenticated
  using (public.is_site_owner()) with check (public.is_site_owner());

drop policy if exists "members insert content_feed_post_poll_votes" on public.content_feed_post_poll_votes;
drop policy if exists "members update content_feed_post_poll_votes" on public.content_feed_post_poll_votes;
drop policy if exists "members delete content_feed_post_poll_votes" on public.content_feed_post_poll_votes;
create policy "cf_vote_insert_own" on public.content_feed_post_poll_votes for insert to authenticated
  with check (lower(email) = lower((select auth.jwt() ->> 'email')));
create policy "cf_vote_update_own" on public.content_feed_post_poll_votes for update to authenticated
  using (lower(email) = lower((select auth.jwt() ->> 'email')))
  with check (lower(email) = lower((select auth.jwt() ->> 'email')));
create policy "cf_vote_delete_own" on public.content_feed_post_poll_votes for delete to authenticated
  using (lower(email) = lower((select auth.jwt() ->> 'email')));

-- ----------------------------------------------------------- event polls ----
drop policy if exists "ev_polls_insert" on public.event_comment_polls;
create policy "ev_poll_insert_on_own_comment" on public.event_comment_polls for insert to authenticated
  with check (
    public.is_site_owner()
    or exists (select 1 from event_comments c where c.id = comment_id
                 and lower(c.email) = lower((select auth.jwt() ->> 'email')))
  );
