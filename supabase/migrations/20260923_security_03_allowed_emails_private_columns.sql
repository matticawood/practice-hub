-- allowed_emails: the private half stops being readable by other members.
--
-- The row policy lets any member read every row, and column privileges let them
-- read nearly every column, so today a member can see everyone's practice goal,
-- whether they opted out of the leaderboard or of email, when they last saw the
-- welcome modal, and when they joined.
--
-- Column privileges belong to the ROLE, so revoking one takes it from a member's
-- own row too. Everything the browser reads for itself therefore moves to one
-- function keyed on the token. Checked first:
--   no select("*") on this table anywhere in the client, so nothing breaks
--   blind;
--   every Netlify function uses the service key, which column grants do not
--   touch, so the email sequences and unsubscribe flow are unaffected;
--   revoking SELECT does not affect UPDATE, so saving a weekly goal or stamping
--   the welcome modal keeps working exactly as before.
--
-- Display fields stay readable, because chat, the community and the member card
-- render other people's name, avatar, badge and profile.

create or replace function public.get_profile_row(p_email text default null)
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
  created_at           timestamptz
)
language plpgsql
stable
security definer
set search_path to 'public'
as $fn$
declare
  v_target text;
begin
  -- no argument means "me", which is how every page but one calls it
  v_target := lower(coalesce(nullif(p_email, ''), (select auth.jwt() ->> 'email')));
  perform public.assert_self_or_owner(v_target);
  return query
    select ae.email, ae.name, ae.avatar_url, ae.welcome_seen_at, ae.info_seen_at,
           ae.notif_seen_at, ae.weekly_goal_minutes, ae.leaderboard_opt_out,
           ae.email_opt_out, ae.tours_seen, ae.created_at
    from allowed_emails ae
    where lower(ae.email) = v_target;
end;
$fn$;

revoke all on function public.get_profile_row(text) from public, anon;
grant execute on function public.get_profile_row(text) to authenticated;

-- email-studio asks which members still want livestream reminders. Owner only.
create or replace function public.admin_reminder_audience()
returns table(email text)
language plpgsql
stable
security definer
set search_path to 'public'
as $fn$
begin
  if lower(coalesce((select auth.jwt() ->> 'email'), '')) <> 'matthew@matthewcawood.com' then
    raise exception 'not authorised' using errcode = '42501';
  end if;
  return query
    select ae.email from allowed_emails ae
    where coalesce(ae.livestream_reminders_opt_out, false) = false;
end;
$fn$;

revoke all on function public.admin_reminder_audience() from public, anon;
grant execute on function public.admin_reminder_audience() to authenticated;

-- and now the private columns leave the browser's reach entirely
revoke select (weekly_goal_minutes, welcome_seen_at, info_seen_at, notif_seen_at,
               tours_seen, email_opt_out, leaderboard_opt_out,
               livestream_reminders_opt_out, created_at)
  on public.allowed_emails from authenticated;

revoke select (weekly_goal_minutes, welcome_seen_at, info_seen_at, notif_seen_at,
               tours_seen, email_opt_out, leaderboard_opt_out,
               livestream_reminders_opt_out, created_at)
  on public.allowed_emails from anon;
