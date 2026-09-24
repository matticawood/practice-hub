begin;

-- The page builds a direct-message id with [myEmail, otherEmail].sort().join("|"),
-- and JavaScript's sort compares UTF-16 code units. The database's default
-- collation does not: it orders uppercase and underscore differently, which
-- would have produced a different id for anyone with a capital letter in their
-- address, and so a second, orphaned conversation. COLLATE "C" compares bytes,
-- which is what the page does. Both sides are lowercased first, because that is
-- how every address and every existing chat id is stored.
create or replace function public.chat_dm_id(p_member_key uuid)
returns text
language plpgsql
stable
security definer
set search_path to 'public'
as $fn$
declare
  v_claims json;
  v_me     text;
  v_them   text;
begin
  v_claims := nullif(current_setting('request.jwt.claims', true), '')::json;
  v_me     := lower(coalesce(v_claims ->> 'email', ''));
  if v_me = '' then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  select lower(mi.email) into v_them
    from member_identities mi
   where mi.member_key = p_member_key and mi.is_member;
  if v_them is null then
    raise exception 'unknown member' using errcode = '42501';
  end if;

  return case when v_me collate "C" <= v_them collate "C"
              then v_me || '|' || v_them
              else v_them || '|' || v_me end;
end;
$fn$;

revoke all on function public.chat_dm_id(uuid) from public, anon;
grant execute on function public.chat_dm_id(uuid) to authenticated, service_role;

commit;
