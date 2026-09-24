begin;

-- Resolving somebody you are already talking to.
--
-- Chat and the live event pages hold addresses they came by legitimately: the
-- other half of a conversation id, the participants of your own room, the
-- author of a message in front of you. They only ever need a name and a
-- picture for them. This answers exactly that, and only for addresses the
-- caller supplies, so it cannot be used to enumerate the membership the way
-- reading the table could.
--
-- It is the same shape as member_keys_for and should be retired alongside it
-- when chat identity stops being built out of addresses.
create or replace function public.member_cards_for(p_emails text[])
returns table(email text, name text, avatar_url text)
language sql
stable
security definer
set search_path to 'public'
as $fn$
  select mi.email, mi.name, mi.avatar_url
  from member_identities mi
  where mi.email = any (select lower(btrim(e)) from unnest(coalesce(p_emails, '{}')) e)
$fn$;

revoke all on function public.member_cards_for(text[]) from public, anon;
grant execute on function public.member_cards_for(text[]) to authenticated, service_role;

-- Starting a conversation with somebody you picked from the member list.
--
-- A direct message is identified by the two addresses joined with a pipe, in a
-- fixed order. The picker now works in keys and has no addresses, so the id is
-- built here instead. It refuses anyone who is not a current member, and it
-- only ever reveals the one person the caller deliberately chose.
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

  select mi.email into v_them
    from member_identities mi
   where mi.member_key = p_member_key and mi.is_member;
  if v_them is null then
    raise exception 'unknown member' using errcode = '42501';
  end if;

  -- the same ordering the page has always used
  return case when v_me <= v_them then v_me || '|' || v_them
              else v_them || '|' || v_me end;
end;
$fn$;

revoke all on function public.chat_dm_id(uuid) from public, anon;
grant execute on function public.chat_dm_id(uuid) to authenticated, service_role;

commit;
