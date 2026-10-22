-- Ask credits: make the owner's new-request notification arrive, and make both
-- notifications land on the thread.
--
-- 1. notifications_guard() requires a cross-user notification to be titled with
--    the sender's name, their email prefix, or to start with "Someone". The
--    title was "New question request", which matches none of those for any
--    member who has a name set in allowed_emails, so the guard raised 42501 and
--    spend_credits' own "exception when others then null" swallowed it. Matt
--    never got told. (With no name set, coalesce(v_name,'') || '%' is just '%',
--    which matches anything, so this only ever failed for named members: most
--    of them.)
--
-- 2. Both link_urls pointed at /practice-log.html?goto=ask, the old in-page
--    panel, and carried no request id, so even a notification that did arrive
--    landed on the hub. Ask is its own page now and routes threads by
--    ?flow=<kind>&req=<id>.
--
-- Bodies are otherwise the live definitions, unchanged.

CREATE OR REPLACE FUNCTION public.spend_credits(p_item text, p_body jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_email   text;
  v_key     uuid;
  v_cost    integer;
  v_balance integer;
  v_req_id  uuid;
begin
  v_email := lower(coalesce(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'email', ''));
  if v_email = '' then raise exception 'not authorised' using errcode = '42501'; end if;
  select mi.member_key into v_key from member_identities mi where mi.email = v_email;
  if v_key is null then raise exception 'not a member' using errcode = '42501'; end if;

  v_cost := case p_item
              when 'question' then 500
              when 'feedback' then 1000
              when 'plan'     then 3000
              when 'lesson'   then 18000
              else null end;
  if v_cost is null then raise exception 'unknown item' using errcode = '22023'; end if;

  perform recompute_credits(v_key);
  select balance into v_balance from member_credits where member_key = v_key;
  if coalesce(v_balance, 0) < v_cost then
    raise exception 'insufficient credits' using errcode = '22003';
  end if;

  insert into credit_requests (member_key, email, kind, status, cost, body)
  values (v_key, v_email, p_item, 'open', v_cost, coalesce(p_body, '{}'::jsonb))
  returning id into v_req_id;

  insert into credit_ledger (member_key, kind, amount, item, ref_id, note)
  values (v_key, 'hold', v_cost, p_item, v_req_id, 'Hold for ' || p_item);

  perform recompute_credits(v_key);
  select balance into v_balance from member_credits where member_key = v_key;

  -- Notify the owner. Non-fatal: the notifications_guard trigger gates member->
  -- third-party inserts, and a rejection there must NOT roll back the spend. The
  -- owner also sees every open request via the credit_requests list regardless.
  begin
    insert into notifications (email, type, title, body, link_url, metadata)
    values ('matthew@matthewcawood.com', 'credit_request',
            case p_item
              when 'question' then 'Someone asked you a question'
              when 'feedback' then 'Someone sent you a recording'
              when 'plan'     then 'Someone asked you for a direction plan'
              when 'lesson'   then 'Someone asked you for a lesson'
              else 'Someone sent you a request' end,
            coalesce(left(p_body ->> 'text', 140), ''),
            '/ask.html?flow=' || p_item || '&req=' || v_req_id,
            jsonb_build_object('request_id', v_req_id, 'kind', p_item));
  exception when others then null;
  end;

  return jsonb_build_object('ok', true, 'request_id', v_req_id, 'balance', v_balance);
end; $function$;

CREATE OR REPLACE FUNCTION public.deliver_credit_request(p_id uuid, p_response jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r record;
begin
  if not is_owner_caller() then raise exception 'not authorised' using errcode = '42501'; end if;
  select * into r from credit_requests where id = p_id;
  if r.id is null then raise exception 'no such request' using errcode = 'P0002'; end if;
  if r.status = 'delivered' then return jsonb_build_object('ok', true, 'already', true); end if;

  update credit_ledger set kind = 'spend' where ref_id = p_id and kind = 'hold';
  update credit_requests set status = 'delivered', response = p_response, delivered_at = now() where id = p_id;

  -- Notify the member (owner is the caller here, so the guard's non-owner cap does
  -- not apply). Still non-fatal so a guard change can never block delivery.
  begin
    insert into notifications (email, type, title, body, link_url, metadata)
    values (r.email, 'credit_reply',
            'Matt replied to your ' || r.kind,
            coalesce(left(p_response ->> 'text', 140), 'Open to read it.'),
            '/ask.html?flow=' || r.kind || '&req=' || p_id,
            jsonb_build_object('request_id', p_id, 'kind', r.kind));
  exception when others then null;
  end;

  perform recompute_credits(r.member_key);
  return jsonb_build_object('ok', true);
end; $function$;
