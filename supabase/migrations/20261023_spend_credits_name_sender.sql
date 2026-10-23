CREATE OR REPLACE FUNCTION public.spend_credits(p_item text, p_body jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_email   text;
  v_key     uuid;
  v_name    text;
  v_who     text;
  v_cost    integer;
  v_balance integer;
  v_req_id  uuid;
begin
  v_email := lower(coalesce(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'email', ''));
  if v_email = '' then raise exception 'not authorised' using errcode = '42501'; end if;
  select mi.member_key, mi.name into v_key, v_name from member_identities mi where mi.email = v_email;
  if v_key is null then raise exception 'not a member' using errcode = '42501'; end if;
  -- The notifications_guard allows a cross-user title that starts with the
  -- sender's name (or email prefix), so name the member rather than "Someone".
  v_who := coalesce(nullif(btrim(v_name), ''), split_part(v_email, '@', 1));

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
              when 'question' then v_who || ' asked you a question'
              when 'feedback' then v_who || ' sent you a recording'
              when 'plan'     then v_who || ' asked you for a direction plan'
              when 'lesson'   then v_who || ' asked you for a lesson'
              else v_who || ' sent you a request' end,
            coalesce(left(p_body ->> 'text', 140), ''),
            '/ask.html?flow=' || p_item || '&req=' || v_req_id,
            jsonb_build_object('request_id', v_req_id, 'kind', p_item));
  exception when others then null;
  end;

  return jsonb_build_object('ok', true, 'request_id', v_req_id, 'balance', v_balance);
end; $function$;
