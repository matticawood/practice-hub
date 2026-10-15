-- ════════════════════════════════════════════════════════════════════════════
-- CREDITS ECONOMY — pass 1 (Ask page "private access to Matt").
--
-- Mirrors the streak_tokens architecture: a SECURITY DEFINER replay is the single
-- source of truth, clients only READ (RLS), every mutation goes through a definer
-- RPC. Credits differ from streak in one way — SPENDING is an event, not
-- derivable from practice — so this is a hybrid: earned minutes are derived, and
-- bonuses + holds/spends live in an append-only ledger. Balance is cached per
-- member in member_credits.
--
--   earn   = 1 credit / practised minute, capped 90/day, dates >= genesis
--   join   = one-time 1,000 (the capped backfill: everyone starts here)
--   spend  = a HOLD on request -> converted to SPEND on delivery -> REFUND on cancel
--   balance = earned + bonuses - spends - active holds
--
-- Keyed by member_key (durable across cancel/resubscribe via member_identities).
-- NOTE: no pg_cron / recompute_all / monthly bonus yet — pass 1 recomputes
-- on-demand for the signed-in member only, so only members on the dev page get a
-- balance. Those are switched on at launch.
-- ════════════════════════════════════════════════════════════════════════════

-- ── tables (additive; nothing existing touched) ──────────────────────────────

-- append-only events: bonuses + holds/spends/refunds. Earned minutes are derived,
-- never stored here.
create table if not exists public.credit_ledger (
  id         uuid primary key default gen_random_uuid(),
  member_key uuid not null,
  kind       text not null check (kind in ('join_bonus','monthly_bonus','hold','spend','refund','adjust')),
  amount     integer not null,            -- positive magnitude; sign applied by kind in the math
  item       text,                        -- for holds/spends: question|feedback|plan|lesson
  ref_id     uuid,                        -- the credit_requests row
  note       text,
  created_at timestamptz not null default now()
);
create index if not exists credit_ledger_member_idx on public.credit_ledger (member_key);
create index if not exists credit_ledger_ref_idx    on public.credit_ledger (ref_id);

-- per-member cached balance (the streak_tokens analogue)
create table if not exists public.member_credits (
  member_key    uuid primary key,
  balance       integer not null default 0,
  earned_minutes integer not null default 0,
  bonus_total   integer not null default 0,
  spent_total   integer not null default 0,
  held_total    integer not null default 0,
  updated_at    timestamptz not null default now()
);

-- purchases / access requests to Matt
create table if not exists public.credit_requests (
  id           uuid primary key default gen_random_uuid(),
  member_key   uuid not null,
  email        text not null,             -- denormalised for owner view + notifications
  kind         text not null check (kind in ('question','feedback','plan','lesson')),
  status       text not null default 'open' check (status in ('open','in_progress','delivered','cancelled')),
  cost         integer not null,
  body         jsonb not null default '{}'::jsonb,   -- the question text (later: uploads, goal)
  response     jsonb,                     -- Matt's reply (later: anchored annotations)
  created_at   timestamptz not null default now(),
  delivered_at timestamptz
);
create index if not exists credit_requests_member_idx on public.credit_requests (member_key);
create index if not exists credit_requests_status_idx on public.credit_requests (status);

-- ── identity helper (SECURITY DEFINER so it may be used inside RLS without
--    tripping member_identities' own row security) ───────────────────────────
create or replace function public.current_member_key()
returns uuid language sql stable security definer set search_path = public as $$
  select mi.member_key from member_identities mi
   where mi.email = lower(coalesce(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'email', ''))
   limit 1;
$$;
revoke all on function public.current_member_key() from public, anon;
grant execute on function public.current_member_key() to authenticated;

create or replace function public.is_owner_caller()
returns boolean language sql stable as $$
  select lower(coalesce(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'email', ''))
         = 'matthew@matthewcawood.com';
$$;

-- ── RLS: self-read (owner reads all); no client writes ───────────────────────
alter table public.credit_ledger   enable row level security;
alter table public.member_credits  enable row level security;
alter table public.credit_requests enable row level security;
revoke all on public.credit_ledger, public.member_credits, public.credit_requests from anon, authenticated;
grant select on public.credit_ledger, public.member_credits, public.credit_requests to authenticated;

drop policy if exists credit_ledger_self   on public.credit_ledger;
drop policy if exists member_credits_self   on public.member_credits;
drop policy if exists credit_requests_self  on public.credit_requests;

create policy credit_ledger_self on public.credit_ledger for select to authenticated
  using (member_key = public.current_member_key() or public.is_owner_caller());
create policy member_credits_self on public.member_credits for select to authenticated
  using (member_key = public.current_member_key() or public.is_owner_caller());
create policy credit_requests_self on public.credit_requests for select to authenticated
  using (member_key = public.current_member_key() or public.is_owner_caller());

-- ── earned credits: capped-90/day minutes from genesis forward ───────────────
create or replace function public.derive_credit_earn(p_member_key uuid)
returns integer language plpgsql stable security definer set search_path = public as $$
declare
  v_genesis constant date    := date '2026-10-14';
  v_cap     constant integer := 90;
  v_email   text;
  v_earned  integer := 0;
begin
  select mi.email into v_email from member_identities mi where mi.member_key = p_member_key;
  if v_email is null then return 0; end if;
  select coalesce(sum(least(v_cap, day_min)), 0) into v_earned
  from (
    select session_date, sum(coalesce(duration_minutes, 0)) as day_min
    from practice_sessions
    where email = v_email and session_date is not null and session_date >= v_genesis
    group by session_date
  ) d;
  return v_earned;
end; $$;

-- ── single writer: recompute one member's cached balance ─────────────────────
create or replace function public.recompute_credits(p_member_key uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_join    constant integer := 1000;
  v_email   text;
  v_earned  integer;
  v_bonus   integer;
  v_spent   integer;
  v_held    integer;
  v_balance integer;
begin
  select mi.email into v_email from member_identities mi where mi.member_key = p_member_key;
  if v_email is null then return; end if;

  -- one-time join bonus (capped backfill): everyone starts with 1,000
  if not exists (select 1 from credit_ledger where member_key = p_member_key and kind = 'join_bonus') then
    insert into credit_ledger (member_key, kind, amount, note)
    values (p_member_key, 'join_bonus', v_join, 'Welcome bonus');
  end if;

  v_earned := derive_credit_earn(p_member_key);
  select coalesce(sum(amount), 0) into v_bonus from credit_ledger where member_key = p_member_key and kind in ('join_bonus','monthly_bonus','adjust');
  select coalesce(sum(amount), 0) into v_spent from credit_ledger where member_key = p_member_key and kind = 'spend';
  select coalesce(sum(amount), 0) into v_held  from credit_ledger where member_key = p_member_key and kind = 'hold';
  v_balance := v_earned + v_bonus - v_spent - v_held;

  insert into member_credits (member_key, balance, earned_minutes, bonus_total, spent_total, held_total, updated_at)
  values (p_member_key, v_balance, v_earned, v_bonus, v_spent, v_held, now())
  on conflict (member_key) do update set
    balance        = excluded.balance,
    earned_minutes = excluded.earned_minutes,
    bonus_total    = excluded.bonus_total,
    spent_total    = excluded.spent_total,
    held_total     = excluded.held_total,
    updated_at     = now();
end; $$;

-- ── convenience read: fresh balance for the signed-in member ─────────────────
create or replace function public.get_my_credits()
returns table(balance integer, earned_minutes integer, bonus_total integer, spent_total integer, held_total integer)
language plpgsql security definer set search_path = public as $$
declare v_key uuid;
begin
  v_key := current_member_key();
  if v_key is null then return; end if;
  perform recompute_credits(v_key);
  return query
    select mc.balance, mc.earned_minutes, mc.bonus_total, mc.spent_total, mc.held_total
    from member_credits mc where mc.member_key = v_key;
end; $$;

-- ── spend: atomic hold + request (cost is fixed server-side, never trusted) ──
create or replace function public.spend_credits(p_item text, p_body jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
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
            'New ' || p_item || ' request',
            coalesce(left(p_body ->> 'text', 140), ''),
            '/practice-log.html?goto=ask',
            jsonb_build_object('request_id', v_req_id, 'kind', p_item));
  exception when others then null;
  end;

  return jsonb_build_object('ok', true, 'request_id', v_req_id, 'balance', v_balance);
end; $$;

-- ── owner delivers: hold -> spend, reply, notify the member ──────────────────
create or replace function public.deliver_credit_request(p_id uuid, p_response jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
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
            '/practice-log.html?goto=ask',
            jsonb_build_object('request_id', p_id, 'kind', r.kind));
  exception when others then null;
  end;

  perform recompute_credits(r.member_key);
  return jsonb_build_object('ok', true);
end; $$;

-- ── cancel/refund: the requester or the owner ────────────────────────────────
create or replace function public.cancel_credit_request(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r record;
begin
  select * into r from credit_requests where id = p_id;
  if r.id is null then raise exception 'no such request' using errcode = 'P0002'; end if;
  if not (is_owner_caller() or r.member_key = current_member_key()) then
    raise exception 'not authorised' using errcode = '42501';
  end if;
  if r.status in ('delivered','cancelled') then return jsonb_build_object('ok', true, 'already', true); end if;

  update credit_ledger set kind = 'refund' where ref_id = p_id and kind = 'hold';
  update credit_requests set status = 'cancelled' where id = p_id;
  perform recompute_credits(r.member_key);
  return jsonb_build_object('ok', true);
end; $$;

-- ── grants ───────────────────────────────────────────────────────────────────
grant execute on function public.derive_credit_earn(uuid)        to authenticated;
grant execute on function public.recompute_credits(uuid)         to authenticated;
grant execute on function public.get_my_credits()                to authenticated;
grant execute on function public.spend_credits(text, jsonb)      to authenticated;
grant execute on function public.deliver_credit_request(uuid, jsonb) to authenticated;
grant execute on function public.cancel_credit_request(uuid)     to authenticated;

notify pgrst, 'reload schema';
