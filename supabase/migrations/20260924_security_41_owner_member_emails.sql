-- The owner's own key-to-address list.
--
-- The admin pages are Matthew's, and they legitimately show addresses: that is
-- what an admin page is for. But they read them straight off the content tables,
-- which is the same column a member would read, so the column cannot be closed
-- while they do.
--
-- This gives those pages the one thing they actually need: the mapping from a
-- member key to an address, for the owner alone. The pages can then work in keys
-- like every other page and resolve an address only where one is displayed.
--
-- It answers nobody but the owner. A member calling it gets an empty list, not
-- an error, because an admin page failing loudly on a member's screen is worse
-- than it simply having nothing to show.

create or replace function public.owner_member_emails()
returns table (member_key uuid, email text, name text)
language sql
stable
security definer
set search_path to 'public'
as $$
  select mi.member_key, mi.email, mi.name
  from member_identities mi
  where (select auth.email()) = 'matthew@matthewcawood.com'
$$;

revoke all on function public.owner_member_emails() from public, anon;
grant execute on function public.owner_member_emails() to authenticated, service_role;

notify pgrst, 'reload schema';
