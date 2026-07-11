-- SECURITY (High×several): close anonymous read/write on member-only tables that
-- had anon/public USING(true) policies leaking member emails (game-score
-- leaderboards, the feedback board + replies, content-feed poll tables, community
-- poll/reaction/read tables). Every anon/public policy on these tables is moved to
-- `authenticated` — the app is member-only so nothing logged-in changes; only the
-- anonymous vector is removed. (event_* tables are deliberately EXCLUDED: guests
-- use them logged-out via guest-join.html and need token scoping instead.)
--
-- Applied live via the Management API 2026-07-11; committed to match prod.
do $$
declare r record;
begin
  for r in
    select tablename, policyname
    from pg_policies
    where tablename in (
      'chord_game_scores','ear_game_scores','note_game_scores',
      'feedback','feedback_replies',
      'content_feed_post_polls','content_feed_post_poll_options','content_feed_post_poll_votes',
      'community_chat_reactions','community_chat_reads',
      'community_post_polls','community_post_poll_options','community_post_poll_votes'
    )
    and ('anon' = any(roles) or roles::text = '{public}')
  loop
    execute format('alter policy %I on public.%I to authenticated;', r.policyname, r.tablename);
  end loop;
end $$;

-- community_messages: was readable by ANY authenticated member (all private DMs).
-- Scope reads to the two participants encoded in chat_id ('emailA|emailB'), plus
-- the shared 'group' chat.
drop policy if exists "members read chat" on public.community_messages;
create policy "members read chat" on public.community_messages for select to authenticated
using (
  chat_id = 'group'
  or lower(split_part(chat_id,'|',1)) = lower(auth.jwt()->>'email')
  or lower(split_part(chat_id,'|',2)) = lower(auth.jwt()->>'email')
);
alter policy "members insert chat" on public.community_messages to authenticated;

-- allowed_emails: a logged-in member could SELECT * and read every other member's
-- unsubscribe_token (an actionable secret) and Stripe IDs. Replace the table-wide
-- SELECT grant to `authenticated` with a column grant covering everything EXCEPT
-- unsubscribe_token (no client reads that column; only server functions do, via the
-- service key). The exposed tokens were also rotated once as a one-off data fix
-- (update allowed_emails set unsubscribe_token = gen_random_uuid()) - not repeated
-- here so re-running this migration does not churn tokens.
do $$
declare cols text;
begin
  select string_agg(quote_ident(column_name), ', ') into cols
  from information_schema.columns
  where table_schema='public' and table_name='allowed_emails' and column_name <> 'unsubscribe_token';
  execute 'revoke select on public.allowed_emails from authenticated, anon';
  execute format('grant select (%s) on public.allowed_emails to authenticated', cols);
end $$;
