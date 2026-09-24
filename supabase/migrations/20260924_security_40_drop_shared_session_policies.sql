-- NOT YET APPLIED. Run this only once production is serving the code that
-- reads a shared practice log through shared_practice_log() and
-- shared_practice_items(). Until then these two policies are what make the feed
-- card's items appear, and dropping them early would empty those cards.
--
-- What they do today: let any member read the practice_sessions row and the
-- practice_items behind any log that has been shared to the community. The card
-- needs that content, but a session row also carries the sharer's address, so
-- this is how a member could collect the address of everyone who has ever
-- shared a log - 21 of them.
--
-- With the two functions in place the card gets exactly the same rows (verified
-- row for row, and in the same order, against every shared session) without the
-- address column being readable at all. Dropping these leaves practice_sessions
-- and practice_items as they should be: your own rows, and Matthew's.

drop policy if exists shared_sessions_are_readable on public.practice_sessions;
drop policy if exists shared_session_items_are_readable on public.practice_items;

notify pgrst, 'reload schema';
