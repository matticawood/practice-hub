begin;

-- The last six tables that hand a member another member's address. Same key,
-- same backfill, same stamp trigger as the twenty-three already carrying one.
-- Nothing reads these columns yet, so this changes no behaviour on its own; it
-- is what lets the pages that show this data stop asking for addresses.
do $$
declare t text;
begin
  foreach t in array array['content_feed_post_poll_votes','community_chat_reactions','feedback',
                           'event_rsvps','event_attendance','tc_comment_poll_votes']
  loop
    execute format('alter table public.%I add column if not exists member_key uuid', t);
    execute format('update public.%I x set member_key = mi.member_key
                      from public.member_identities mi
                     where mi.email = lower(x.email) and x.member_key is null', t);
    execute format('create index if not exists %I on public.%I (member_key)', t || '_member_key_idx', t);
    execute format('drop trigger if exists %I on public.%I', t || '_member_key_trg', t);
    execute format('create trigger %I before insert or update of email on public.%I
                    for each row execute function public.stamp_member_key()', t || '_member_key_trg', t);
  end loop;
end $$;

commit;
