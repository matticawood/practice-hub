-- Stage 2a: give reactions a member_key alongside the email.
--
-- Purely additive. Nothing reads member_key yet, nothing stops reading email,
-- so this cannot change what anybody sees. The client moves over in the next
-- step, and only then does the email column get taken away.
--
-- The email column stays in the table and stays writable: the insert policy
-- checks it against the token, which is what stops people reacting as somebody
-- else. What changes later is only whether it is READABLE.

alter table public.activity_reactions add column if not exists member_key uuid;

update public.activity_reactions r
   set member_key = ae.member_key
  from public.allowed_emails ae
 where lower(ae.email) = lower(r.email)
   and r.member_key is null;

create index if not exists activity_reactions_member_key_idx on public.activity_reactions (member_key);

-- keep it filled as rows arrive, whoever writes them
create or replace function public.stamp_member_key()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $fn$
begin
  if new.member_key is null and new.email is not null then
    select ae.member_key into new.member_key
      from allowed_emails ae where lower(ae.email) = lower(new.email);
  end if;
  return new;
end;
$fn$;

drop trigger if exists activity_reactions_member_key_trg on public.activity_reactions;
create trigger activity_reactions_member_key_trg
  before insert or update of email on public.activity_reactions
  for each row execute function public.stamp_member_key();

-- the caller needs to know their own key to spot their own reactions.
-- Dropped and recreated inside one transaction: the return type gained a
-- column, which Postgres will not do in place, and a bare DROP would leave a
-- window where a live page calling it gets an error.
begin;

drop function if exists public.get_profile_row(text);

create function public.get_profile_row(p_email text default null)
returns table(
  email                text,
  name                 text,
  avatar_url           text,
  welcome_seen_at      timestamptz,
  info_seen_at         timestamptz,
  notif_seen_at        timestamptz,
  weekly_goal_minutes  integer,
  leaderboard_opt_out  boolean,
  email_opt_out        boolean,
  tours_seen           jsonb,
  created_at           timestamptz,
  member_key           uuid
)
language plpgsql
stable
security definer
set search_path to 'public'
as $fn$
declare
  v_target text;
begin
  v_target := lower(coalesce(nullif(p_email, ''), (select auth.jwt() ->> 'email')));
  perform public.assert_self_or_owner(v_target);
  return query
    select ae.email, ae.name, ae.avatar_url, ae.welcome_seen_at, ae.info_seen_at,
           ae.notif_seen_at, ae.weekly_goal_minutes, ae.leaderboard_opt_out,
           ae.email_opt_out, ae.tours_seen, ae.created_at, ae.member_key
    from allowed_emails ae
    where lower(ae.email) = v_target;
end;
$fn$;

revoke all on function public.get_profile_row(text) from public, anon;
grant execute on function public.get_profile_row(text) to authenticated;

commit;
