-- Profile cards showed a home-grown streak (shared-member-modal.js _computeStreaks)
-- that ignored streak-saves and used UTC "today" instead of the member's local day,
-- so it disagreed with the dashboard / stats / leaderboard. Expose the canonical
-- server-computed streak (streak_tokens: save-inclusive, member-local-tz) for any
-- member so the profile chip matches everywhere. Streaks are already semi-public —
-- best_streak is on the leaderboard; this just adds the current streak alongside it.

create or replace function public.get_member_streak(p_email text)
returns table(current_streak integer, best_streak integer)
language sql stable security definer set search_path = public as $$
  select coalesce(st.current_streak, 0)::int,
         coalesce(st.best_streak,    0)::int
  from   (select 1) _
  left join streak_tokens st on lower(st.email) = lower(p_email);
$$;

grant execute on function public.get_member_streak(text) to authenticated;
