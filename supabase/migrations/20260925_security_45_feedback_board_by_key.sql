-- NOT YET APPLIED. Holds with 40, 42 and 44, and for the same reason: it
-- changes what the upvote and reply functions write, and production's copy of
-- the feedback board still reads the old shape.
--
-- The feedback board keeps addresses in three places, not one:
--   * the email column, 11 addresses
--   * upvoted_by, a JSON array of who upvoted, 3 addresses
--   * replies, a JSON array whose objects each carry the replier's address, 9
-- A column revoke reaches the first and not the other two, so this converts all
-- three and the two functions that write them.
--
-- Every row involved already has a member key, and every address in both JSON
-- columns belongs to a member who has one, so nothing is lost in translation.
-- The DO block refuses to run if that stops being true.

-- ── 1. the existing rows ───────────────────────────────────────────────────
do $$
declare
  v_unmapped int;
begin
  -- Anyone in either JSON column who has no key would be dropped by the
  -- rewrite, so stop rather than lose them.
  select count(*) into v_unmapped from (
    select lower(e) a from feedback f, lateral jsonb_array_elements_text(coalesce(f.upvoted_by,'[]'::jsonb)) e
    union
    select lower(r->>'email') from feedback f, lateral jsonb_array_elements(coalesce(f.replies,'[]'::jsonb)) r
     where r->>'email' is not null
  ) x
  left join member_identities mi on lower(mi.email) = x.a
  where mi.member_key is null;

  if v_unmapped > 0 then
    raise exception '% address(es) in the feedback JSON have no member key; not rewriting', v_unmapped;
  end if;
end $$;

-- who upvoted: addresses become keys, order preserved, anything already a key
-- left alone so this is safe to run twice
update feedback f
set upvoted_by = (
  select coalesce(jsonb_agg(coalesce(mi.member_key::text, e) order by ord), '[]'::jsonb)
  from jsonb_array_elements_text(f.upvoted_by) with ordinality as t(e, ord)
  left join member_identities mi on lower(mi.email) = lower(t.e)
)
where f.upvoted_by is not null and jsonb_array_length(f.upvoted_by) > 0;

-- a reply: gains member_key, loses email, keeps every other field exactly
update feedback f
set replies = (
  select coalesce(jsonb_agg(
           case when r ? 'email'
                then (r - 'email') || jsonb_build_object('member_key', mi.member_key::text)
                else r end
           order by ord), '[]'::jsonb)
  from jsonb_array_elements(f.replies) with ordinality as t(r, ord)
  left join member_identities mi on lower(mi.email) = lower(t.r->>'email')
)
where f.replies is not null and jsonb_array_length(f.replies) > 0;

-- ── 2. what gets written from now on ───────────────────────────────────────
create or replace function public.toggle_feedback_upvote(p_id uuid, p_email text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_key     text;
  v_already boolean;
  v_out     jsonb;
begin
  perform public.assert_self_or_owner(p_email);

  select mi.member_key::text into v_key
    from member_identities mi where lower(mi.email) = lower(p_email);
  if v_key is null then
    raise exception 'unknown member' using errcode = '42501';
  end if;

  -- A row may still hold this person as an address, so look for either and
  -- remove either; only the key is ever added.
  select coalesce(upvoted_by ? v_key, false) or coalesce(upvoted_by ? lower(p_email), false)
    into v_already from feedback where id = p_id;

  if v_already then
    update feedback
       set upvoted_by = (coalesce(upvoted_by, '[]'::jsonb) - v_key) - lower(p_email),
           upvotes    = greatest(upvotes - 1, 0),
           updated_at = now()
     where id = p_id
     returning jsonb_build_object('upvotes', upvotes, 'upvoted', false) into v_out;
  else
    update feedback
       set upvoted_by = coalesce(upvoted_by, '[]'::jsonb) || to_jsonb(v_key),
           upvotes    = coalesce(upvotes, 0) + 1,
           updated_at = now()
     where id = p_id
     returning jsonb_build_object('upvotes', upvotes, 'upvoted', true) into v_out;
  end if;
  return v_out;
end;
$function$;

create or replace function public.add_feedback_reply(
  p_feedback_id uuid, p_email text, p_display_name text, p_body text, p_is_owner boolean)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_reply  jsonb;
  v_claims json;
  v_role   text;
  v_caller text;
  v_email  text;
  v_name   text;
  v_owner  boolean;
  v_key    text;
begin
  v_claims := nullif(current_setting('request.jwt.claims', true), '')::json;
  v_role   := coalesce(v_claims ->> 'role', '');

  if v_role in ('authenticated', 'anon') then
    v_caller := lower(coalesce(v_claims ->> 'email', ''));
    if v_caller = '' then
      raise exception 'not authorised' using errcode = '42501';
    end if;
    v_email := v_caller;
    v_owner := (v_caller = 'matthew@matthewcawood.com');
    select nullif(btrim(ae.name), '') into v_name
      from allowed_emails ae where lower(ae.email) = v_caller;
    v_name := coalesce(v_name, split_part(v_caller, '@', 1));
  else
    -- internal caller: nothing to impersonate, keep the arguments
    v_email := p_email;
    v_name  := p_display_name;
    v_owner := coalesce(p_is_owner, false);
  end if;

  select mi.member_key::text into v_key
    from member_identities mi where lower(mi.email) = lower(v_email);

  /* The reply carries who wrote it as a key and a display name. It no longer
     carries an address: the board shows the name, and the notification that
     goes to a replier is addressed by key. */
  v_reply := jsonb_build_object(
    'id',           gen_random_uuid()::text,
    'member_key',   v_key,
    'display_name', v_name,
    'body',         p_body,
    'is_owner',     v_owner,
    'created_at',   now()::text
  );
  update feedback
     set replies = coalesce(replies, '[]'::jsonb) || jsonb_build_array(v_reply)
   where id = p_feedback_id;

  return v_reply;
end;
$function$;

notify pgrst, 'reload schema';
