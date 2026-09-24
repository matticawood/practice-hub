-- NOT YET APPLIED. Run this only once production is serving the code that asks
-- achievement_events by member key. Until then the practice log and the badge
-- engine still filter it by address, and this would break them.
--
-- Why this table first: it is the single biggest source of addresses left. A
-- member can read all 3,765 rows, and the rows carry 148 distinct addresses -
-- almost everything still reachable. Nothing on any member-facing page needs
-- that column any more: a badge belongs to a member key.
--
-- A column cannot be taken away from a role that holds the privilege on the
-- whole table, so the table grant goes and the remaining columns are granted
-- back by name. Writing is untouched: INSERT, UPDATE and DELETE stay exactly as
-- they are, so a badge is still recorded with its address as before, and the
-- row-level policies are unaffected because a policy is not checked against the
-- caller's column privileges.
--
-- Nothing in the database breaks: all twelve functions that read this table are
-- SECURITY DEFINER, so they run with the owner's privileges, not the caller's.
-- The admin pages read it by key now and resolve addresses through
-- owner_member_emails(), which answers Matthew alone.

revoke select on public.achievement_events from anon, authenticated;

grant select (id, achievement_id, earned_at, member_key)
  on public.achievement_events to anon, authenticated;

notify pgrst, 'reload schema';
