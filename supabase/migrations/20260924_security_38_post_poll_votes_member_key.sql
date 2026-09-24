-- The one poll-vote table still without a key.
--
-- community_post_poll_votes was missed when the other tables were given a
-- member_key, because it is empty: nobody has voted on a poll attached to a
-- community post yet, so it leaks nothing today. The moment somebody does, it
-- would be a table of who voted, written in addresses. Give it the same shape
-- as its two siblings before that happens.
--
-- Being empty, this cannot disturb any existing row.

alter table public.community_post_poll_votes
  add column if not exists member_key uuid references public.member_identities(member_key);

drop trigger if exists community_post_poll_votes_member_key_trg on public.community_post_poll_votes;
create trigger community_post_poll_votes_member_key_trg
  before insert or update on public.community_post_poll_votes
  for each row execute function public.stamp_member_key();

create unique index if not exists community_post_poll_votes_member_key_uniq
  on public.community_post_poll_votes (poll_id, member_key);

notify pgrst, 'reload schema';
