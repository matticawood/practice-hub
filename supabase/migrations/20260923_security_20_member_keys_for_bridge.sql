begin;

-- A bridge while surfaces convert from addresses to keys, one at a time.
--
-- Some callers still hold an address for someone they have already notified
-- another way, and pass it so that person is not notified twice. Until those
-- callers carry keys, they need to turn the address they already have into the
-- key the notification path now uses.
--
-- This tells the caller nothing it did not already know: it answers only for
-- addresses the caller itself supplied, and returns keys, which are not secret
-- (they appear in the page). It is deliberately narrow so it can be deleted
-- once the last caller carries keys.
create or replace function public.member_keys_for(p_emails text[])
returns table(email text, member_key uuid)
language sql
stable
security definer
set search_path to 'public'
as $fn$
  select mi.email, mi.member_key
  from member_identities mi
  where mi.email = any (select lower(btrim(e)) from unnest(coalesce(p_emails, '{}')) e)
$fn$;

revoke all on function public.member_keys_for(text[]) from public, anon;
grant execute on function public.member_keys_for(text[]) to authenticated, service_role;

commit;
