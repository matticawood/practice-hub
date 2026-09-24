begin;

-- Starting a conversation with people you picked from the member list.
--
-- The picker works in keys now and holds no addresses, but a chat is still
-- identified by them: a direct message is the two addresses joined with a pipe,
-- and a group is a room with a participant row per address. So the chat is
-- created here, and the caller gets back only the id of the conversation they
-- deliberately started.
--
-- One key returns the direct-message id, exactly as the page used to build it.
-- Several create a room and return its id. Everyone named must be a current
-- member, and the caller is always a participant.
create or replace function public.chat_create(p_member_keys uuid[])
returns text
language plpgsql
volatile
security definer
set search_path to 'public'
as $fn$
declare
  v_claims  json;
  v_me      text;
  v_emails  text[];
  v_them    text;
  v_room    uuid;
begin
  v_claims := nullif(current_setting('request.jwt.claims', true), '')::json;
  v_me     := lower(coalesce(v_claims ->> 'email', ''));
  if v_me = '' then
    raise exception 'not authorised' using errcode = '42501';
  end if;
  if p_member_keys is null or array_length(p_member_keys, 1) is null then
    raise exception 'nobody chosen' using errcode = '22023';
  end if;
  if array_length(p_member_keys, 1) > 50 then
    raise exception 'too many people' using errcode = '22023';
  end if;

  select array_agg(lower(mi.email) order by lower(mi.email))
    into v_emails
    from member_identities mi
   where mi.member_key = any (p_member_keys) and mi.is_member;

  if v_emails is null or array_length(v_emails, 1) <> array_length(
       (select array_agg(distinct k) from unnest(p_member_keys) k), 1) then
    raise exception 'unknown member' using errcode = '42501';
  end if;

  -- one person: the direct-message id, ordered by bytes the way the page orders it
  if array_length(v_emails, 1) = 1 then
    v_them := v_emails[1];
    return case when v_me collate "C" <= v_them collate "C"
                then v_me || '|' || v_them
                else v_them || '|' || v_me end;
  end if;

  -- several: a room, with the caller included
  insert into community_chat_rooms (created_by) values (v_me) returning id into v_room;
  insert into community_chat_participants (room_id, email)
  select v_room, e from unnest(v_emails || array[v_me]) e group by e;

  return v_room::text;
end;
$fn$;

revoke all on function public.chat_create(uuid[]) from public, anon;
grant execute on function public.chat_create(uuid[]) to authenticated, service_role;

commit;
