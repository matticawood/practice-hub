-- NOT YET APPLIED. Run this only once production is serving the code that reads
-- these tables by member key. Until then the pages still name the address
-- column, and this would break them.
--
-- Eighteen community tables stop handing a member anybody else's address. Every
-- one of them already carries a member key on every row, and every page that
-- reads them now uses it: who wrote a post, a comment or a message, who liked or
-- reacted to it, who voted in a poll, who RSVPed and who attended.
--
-- A column cannot be taken from a role that holds the privilege on the whole
-- table, so each table grant goes and the remaining columns are granted back by
-- name. Writing is untouched throughout - INSERT, UPDATE and DELETE stay exactly
-- as they are, so a row is still written with its address as before - and the
-- row-level policies are unaffected, because a policy is not checked against the
-- caller's column privileges.
--
-- Two things this had to account for, both measured rather than assumed:
--   * a read of select("*") is refused outright, not silently trimmed, so every
--     one of those was given a column list first;
--   * so is a head count of select("*", { count: "exact" }), which is how three
--     dashboard figures and ten badge counts were being worked out. They now
--     count a named column.
--
-- Not included, and why:
--   practice_sessions  - restricted by row instead (migration 40), which keeps
--                        the sixteen places that read your own sessions working
--                        untouched.
--   event_chat, event_qa - read with select("*") on the live-clinic pages and by
--                        guests, who have no membership and so no key. Those
--                        paths cannot be exercised without a clinic running.
--   feedback           - the board still notifies repliers by address.

do $$
declare
  t   text;
  cols text;
  tables text[] := array[
    'community_messages', 'community_posts', 'community_post_comments',
    'community_post_likes', 'community_chat_reactions', 'activity_comments',
    'activity_reactions', 'content_feed_comments', 'content_feed_likes',
    'content_feed_post_poll_votes', 'weekly_focus_likes', 'weekly_focus_comments',
    'practice_room_update_comments', 'practice_room_update_likes',
    'event_comments', 'event_rsvps', 'event_attendance', 'tc_comment_poll_votes'
  ];
begin
  foreach t in array tables loop
    -- every column except the address, quoted, in table order
    select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
      into cols
      from information_schema.columns
     where table_schema = 'public' and table_name = t and column_name <> 'email';

    if cols is null then
      raise exception 'table % not found', t;
    end if;

    execute format('revoke select on public.%I from anon, authenticated', t);
    execute format('grant select (%s) on public.%I to anon, authenticated', cols, t);
  end loop;
end $$;

notify pgrst, 'reload schema';
