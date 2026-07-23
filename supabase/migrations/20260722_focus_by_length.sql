-- Aggregate (no PII) average focus rating by session-length band, so the Stats
-- deep dive can show how practice quality tracks with how long you sit down for.
-- Members typically have too few of their own ratings to see the shape, so this
-- provides a community reference line alongside their own data.
create or replace function get_focus_by_length()
returns table(band int, sessions bigint, rated bigint, avg_focus numeric)
language sql
security definer
set search_path = public
as $fn$
  select case
           when duration_minutes <  15 then 0
           when duration_minutes <  30 then 1
           when duration_minutes <  60 then 2
           when duration_minutes < 120 then 3
           else 4
         end as band,
         count(*)                              as sessions,
         count(focus_rating)                   as rated,
         round(avg(focus_rating)::numeric, 2)  as avg_focus
  from practice_sessions
  group by 1
  order by 1
$fn$;

-- Members only; anon has no business reading aggregates (see 20260711_security_secdef_revoke_anon).
revoke execute on function get_focus_by_length() from anon, public;
grant  execute on function get_focus_by_length() to authenticated;
