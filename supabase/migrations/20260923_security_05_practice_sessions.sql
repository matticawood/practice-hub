-- practice_sessions: yours, Matthew's, or shared to the community.
--
-- Today every member reads all 5,455 rows, including `notes`, which is where
-- people write what went badly. Three legitimate consumers depend on that blanket
-- read and each gets exactly what it displays, and nothing else:
--
--   the member card's total and streak   -> day + minutes only
--   the member card's activity list      -> id, day, minutes, paged
--   the community rail's weekly count    -> a number
--
-- The activity feed is unaffected: it comes from get_activity_feed_v2(), which is
-- a definer function and never consults these policies. Shared practice logs are
-- unaffected: shared_sessions_are_readable already covers a session referenced by
-- a community post, and practice_items has the matching rule.

create or replace function public.get_member_practice_days(p_email text)
returns table(duration_minutes integer, session_date date)
language sql
stable
security definer
set search_path to 'public'
as $fn$
  select ps.duration_minutes, ps.session_date
  from practice_sessions ps
  where lower(ps.email) = lower(p_email);
$fn$;

create or replace function public.get_member_recent_sessions(p_email text, p_offset integer, p_limit integer)
returns table(id bigint, session_date date, duration_minutes integer)
language sql
stable
security definer
set search_path to 'public'
as $fn$
  select ps.id, ps.session_date, ps.duration_minutes
  from practice_sessions ps
  where lower(ps.email) = lower(p_email)
  order by ps.session_date desc
  offset greatest(p_offset, 0)
  limit least(greatest(p_limit, 0), 200);
$fn$;

create or replace function public.count_sessions_since(p_date date)
returns bigint
language sql
stable
security definer
set search_path to 'public'
as $fn$
  select count(*) from practice_sessions where session_date >= p_date;
$fn$;

revoke all on function public.get_member_practice_days(text) from public, anon;
revoke all on function public.get_member_recent_sessions(text, integer, integer) from public, anon;
revoke all on function public.count_sessions_since(date) from public, anon;
grant execute on function public.get_member_practice_days(text) to authenticated;
grant execute on function public.get_member_recent_sessions(text, integer, integer) to authenticated;
grant execute on function public.count_sessions_since(date) to authenticated;

-- and now the blanket read goes
drop policy if exists "Members can read all sessions" on public.practice_sessions;
