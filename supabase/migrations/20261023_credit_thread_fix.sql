-- One source of truth for the conversation: credit_thread_send no longer writes
-- the legacy `response` column; every message lives in `messages`.
create or replace function public.credit_thread_send(p_id uuid, p_text text, p_media jsonb default '[]'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  r         record;
  v_email   text;
  v_owner   boolean;
  v_name    text;
  v_who     text;
  v_msg     jsonb;
  v_charged boolean := false;
begin
  v_email := lower(coalesce(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'email', ''));
  if v_email = '' then raise exception 'not authorised' using errcode = '42501'; end if;
  select * into r from credit_requests where id = p_id;
  if r.id is null then raise exception 'no such request' using errcode = 'P0002'; end if;
  v_owner := is_owner_caller();
  if not (v_owner or lower(r.email) = v_email) then raise exception 'not authorised' using errcode = '42501'; end if;
  if r.status = 'cancelled' then raise exception 'this request is closed' using errcode = '22023'; end if;
  if coalesce(btrim(p_text), '') = '' and coalesce(jsonb_array_length(p_media), 0) = 0 then
    raise exception 'empty message' using errcode = '22023';
  end if;

  v_msg := jsonb_build_object(
    'from',  case when v_owner then 'owner' else 'member' end,
    'text',  coalesce(p_text, ''),
    'media', coalesce(p_media, '[]'::jsonb),
    'at',    to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'));
  update credit_requests set messages = coalesce(messages, '[]'::jsonb) || v_msg where id = p_id;

  if v_owner and r.status in ('open', 'in_progress') then
    update credit_ledger set kind = 'spend' where ref_id = p_id and kind = 'hold';
    update credit_requests set status = 'delivered', delivered_at = now() where id = p_id;
    perform recompute_credits(r.member_key);
    v_charged := true;
  end if;

  begin
    if v_owner then
      insert into notifications (email, type, title, body, link_url, metadata)
      values (r.email, 'credit_reply', 'Matt replied to your ' || r.kind,
              coalesce(left(p_text, 140), 'Open to read it.'),
              '/ask.html?flow=' || r.kind || '&req=' || p_id,
              jsonb_build_object('request_id', p_id, 'kind', r.kind));
    else
      select name into v_name from member_identities where email = v_email;
      v_who := coalesce(nullif(btrim(v_name), ''), split_part(v_email, '@', 1));
      insert into notifications (email, type, title, body, link_url, metadata)
      values ('matthew@matthewcawood.com', 'credit_reply', v_who || ' replied to their ' || r.kind,
              coalesce(left(p_text, 140), ''),
              '/ask.html?flow=' || r.kind || '&req=' || p_id,
              jsonb_build_object('request_id', p_id, 'kind', r.kind));
    end if;
  exception when others then null;
  end;

  return jsonb_build_object('ok', true, 'charged', v_charged);
end; $function$;

-- Migrate any delivered request that still has a legacy `response`: fold it in as
-- the first owner message (before anything already in messages), then clear it.
update public.credit_requests
set messages = jsonb_build_array(
      jsonb_build_object(
        'from', 'owner',
        'text', coalesce(response ->> 'text', ''),
        'media', coalesce(response -> 'media', '[]'::jsonb),
        'at', to_char(coalesce(delivered_at, now()) at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
    ) || coalesce(messages, '[]'::jsonb),
    response = null
where status = 'delivered' and response is not null and coalesce(response ->> 'text', '') <> '';
