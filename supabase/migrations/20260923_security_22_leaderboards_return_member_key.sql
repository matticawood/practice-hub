begin;

-- get_achievement_leaderboard: body preserved untouched, wrapped to add the member's key
alter function public.get_achievement_leaderboard() rename to _sec_lb_get_achievement_leaderboard_29547;
create function public.get_achievement_leaderboard()
returns TABLE(email text, name text, achievement_count bigint, member_key uuid)
language sql volatile security definer set search_path to 'public'
as $wrap$
  select f.*, mi.member_key
  from public._sec_lb_get_achievement_leaderboard_29547() f
  left join member_identities mi on mi.email = lower(f.email)
$wrap$;
revoke all on function public._sec_lb_get_achievement_leaderboard_29547() from public, anon, authenticated;
grant execute on function public._sec_lb_get_achievement_leaderboard_29547() to service_role;
revoke all on function public.get_achievement_leaderboard() from public, anon;
grant execute on function public.get_achievement_leaderboard() to authenticated, service_role;

-- get_alltime_leaderboard: body preserved untouched, wrapped to add the member's key
alter function public.get_alltime_leaderboard() rename to _sec_lb_get_alltime_leaderboard_23188;
create function public.get_alltime_leaderboard()
returns TABLE(email text, name text, total_minutes numeric, member_key uuid)
language sql volatile security definer set search_path to 'public'
as $wrap$
  select f.*, mi.member_key
  from public._sec_lb_get_alltime_leaderboard_23188() f
  left join member_identities mi on mi.email = lower(f.email)
$wrap$;
revoke all on function public._sec_lb_get_alltime_leaderboard_23188() from public, anon, authenticated;
grant execute on function public._sec_lb_get_alltime_leaderboard_23188() to service_role;
revoke all on function public.get_alltime_leaderboard() from public, anon;
grant execute on function public.get_alltime_leaderboard() to authenticated, service_role;

-- get_interval_leaderboard: body preserved untouched, wrapped to add the member's key
alter function public.get_interval_leaderboard(p_side text, p_tier text, p_key_mode text, p_playback text, p_key_signature text) rename to _sec_lb_get_interval_leaderboard_29791;
create function public.get_interval_leaderboard(p_side text, p_tier text, p_key_mode text, p_playback text DEFAULT NULL::text, p_key_signature text DEFAULT NULL::text)
returns TABLE(email text, name text, score integer, member_key uuid)
language sql stable
as $wrap$
  select f.*, (select s.member_key from public.interval_game_scores s
                 where lower(s.email) = lower(f.email) limit 1)
  from public._sec_lb_get_interval_leaderboard_29791(p_side, p_tier, p_key_mode, p_playback, p_key_signature) f
$wrap$;
-- this wrapper is NOT security definer, so it runs as the member and must be
-- able to call the inner function. The inner keeps exactly the privileges the
-- original had, so nothing about who may read this board changes.
revoke all on function public._sec_lb_get_interval_leaderboard_29791(p_side text, p_tier text, p_key_mode text, p_playback text, p_key_signature text) from public, anon;
grant execute on function public._sec_lb_get_interval_leaderboard_29791(p_side text, p_tier text, p_key_mode text, p_playback text, p_key_signature text) to authenticated, service_role;
revoke all on function public.get_interval_leaderboard(p_side text, p_tier text, p_key_mode text, p_playback text, p_key_signature text) from public, anon;
grant execute on function public.get_interval_leaderboard(p_side text, p_tier text, p_key_mode text, p_playback text, p_key_signature text) to authenticated, service_role;

-- get_last_month_leaderboard: body preserved untouched, wrapped to add the member's key
alter function public.get_last_month_leaderboard() rename to _sec_lb_get_last_month_leaderboard_23189;
create function public.get_last_month_leaderboard()
returns TABLE(email text, name text, total_minutes numeric, member_key uuid)
language sql volatile security definer set search_path to 'public'
as $wrap$
  select f.*, mi.member_key
  from public._sec_lb_get_last_month_leaderboard_23189() f
  left join member_identities mi on mi.email = lower(f.email)
$wrap$;
revoke all on function public._sec_lb_get_last_month_leaderboard_23189() from public, anon, authenticated;
grant execute on function public._sec_lb_get_last_month_leaderboard_23189() to service_role;
revoke all on function public.get_last_month_leaderboard() from public, anon;
grant execute on function public.get_last_month_leaderboard() to authenticated, service_role;

-- get_last_month_leaderboard_full: body preserved untouched, wrapped to add the member's key
alter function public.get_last_month_leaderboard_full() rename to _sec_lb_get_last_month_leaderboard_full_67417;
create function public.get_last_month_leaderboard_full()
returns TABLE(email text, name text, total_minutes numeric, member_key uuid)
language sql volatile security definer set search_path to 'public'
as $wrap$
  select f.*, mi.member_key
  from public._sec_lb_get_last_month_leaderboard_full_67417() f
  left join member_identities mi on mi.email = lower(f.email)
$wrap$;
revoke all on function public._sec_lb_get_last_month_leaderboard_full_67417() from public, anon, authenticated;
grant execute on function public._sec_lb_get_last_month_leaderboard_full_67417() to service_role;
revoke all on function public.get_last_month_leaderboard_full() from public, anon;
grant execute on function public.get_last_month_leaderboard_full() to authenticated, service_role;

-- get_leaderboard: body preserved untouched, wrapped to add the member's key
alter function public.get_leaderboard() rename to _sec_lb_get_leaderboard_23076;
create function public.get_leaderboard()
returns TABLE(email text, name text, total_minutes bigint, member_key uuid)
language sql volatile security definer set search_path to 'public'
as $wrap$
  select f.*, mi.member_key
  from public._sec_lb_get_leaderboard_23076() f
  left join member_identities mi on mi.email = lower(f.email)
$wrap$;
revoke all on function public._sec_lb_get_leaderboard_23076() from public, anon, authenticated;
grant execute on function public._sec_lb_get_leaderboard_23076() to service_role;
revoke all on function public.get_leaderboard() from public, anon;
grant execute on function public.get_leaderboard() to authenticated, service_role;

-- get_note_game_leaderboard: body preserved untouched, wrapped to add the member's key
alter function public.get_note_game_leaderboard() rename to _sec_lb_get_note_game_leaderboard_23421;
create function public.get_note_game_leaderboard()
returns TABLE(email text, name text, score integer, clef text, accidentals boolean, member_key uuid)
language sql volatile security definer set search_path to 'public'
as $wrap$
  select f.*, mi.member_key
  from public._sec_lb_get_note_game_leaderboard_23421() f
  left join member_identities mi on mi.email = lower(f.email)
$wrap$;
revoke all on function public._sec_lb_get_note_game_leaderboard_23421() from public, anon, authenticated;
grant execute on function public._sec_lb_get_note_game_leaderboard_23421() to service_role;
revoke all on function public.get_note_game_leaderboard() from public, anon;
grant execute on function public.get_note_game_leaderboard() to authenticated, service_role;

-- get_piece_leaderboard: body preserved untouched, wrapped to add the member's key
alter function public.get_piece_leaderboard() rename to _sec_lb_get_piece_leaderboard_23077;
create function public.get_piece_leaderboard()
returns TABLE(email text, name text, piece_name text, total_minutes bigint, member_key uuid)
language sql volatile security definer set search_path to 'public'
as $wrap$
  select f.*, mi.member_key
  from public._sec_lb_get_piece_leaderboard_23077() f
  left join member_identities mi on mi.email = lower(f.email)
$wrap$;
revoke all on function public._sec_lb_get_piece_leaderboard_23077() from public, anon, authenticated;
grant execute on function public._sec_lb_get_piece_leaderboard_23077() to service_role;
revoke all on function public.get_piece_leaderboard() from public, anon;
grant execute on function public.get_piece_leaderboard() to authenticated, service_role;

-- get_piece_leaderboard_month: body preserved untouched, wrapped to add the member's key
alter function public.get_piece_leaderboard_month() rename to _sec_lb_get_piece_leaderboard_month_23434;
create function public.get_piece_leaderboard_month()
returns TABLE(email text, name text, piece_name text, total_minutes numeric, member_key uuid)
language sql volatile security definer set search_path to 'public'
as $wrap$
  select f.*, mi.member_key
  from public._sec_lb_get_piece_leaderboard_month_23434() f
  left join member_identities mi on mi.email = lower(f.email)
$wrap$;
revoke all on function public._sec_lb_get_piece_leaderboard_month_23434() from public, anon, authenticated;
grant execute on function public._sec_lb_get_piece_leaderboard_month_23434() to service_role;
revoke all on function public.get_piece_leaderboard_month() from public, anon;
grant execute on function public.get_piece_leaderboard_month() to authenticated, service_role;

-- get_scale_leaderboard: body preserved untouched, wrapped to add the member's key
alter function public.get_scale_leaderboard() rename to _sec_lb_get_scale_leaderboard_23078;
create function public.get_scale_leaderboard()
returns TABLE(email text, name text, technique_name text, session_count bigint, member_key uuid)
language sql volatile security definer set search_path to 'public'
as $wrap$
  select f.*, mi.member_key
  from public._sec_lb_get_scale_leaderboard_23078() f
  left join member_identities mi on mi.email = lower(f.email)
$wrap$;
revoke all on function public._sec_lb_get_scale_leaderboard_23078() from public, anon, authenticated;
grant execute on function public._sec_lb_get_scale_leaderboard_23078() to service_role;
revoke all on function public.get_scale_leaderboard() from public, anon;
grant execute on function public.get_scale_leaderboard() to authenticated, service_role;

-- get_scale_leaderboard_month: body preserved untouched, wrapped to add the member's key
alter function public.get_scale_leaderboard_month() rename to _sec_lb_get_scale_leaderboard_month_23435;
create function public.get_scale_leaderboard_month()
returns TABLE(email text, name text, technique_name text, session_count bigint, member_key uuid)
language sql volatile security definer set search_path to 'public'
as $wrap$
  select f.*, mi.member_key
  from public._sec_lb_get_scale_leaderboard_month_23435() f
  left join member_identities mi on mi.email = lower(f.email)
$wrap$;
revoke all on function public._sec_lb_get_scale_leaderboard_month_23435() from public, anon, authenticated;
grant execute on function public._sec_lb_get_scale_leaderboard_month_23435() to service_role;
revoke all on function public.get_scale_leaderboard_month() from public, anon;
grant execute on function public.get_scale_leaderboard_month() to authenticated, service_role;

-- get_streak_leaderboard: body preserved untouched, wrapped to add the member's key
alter function public.get_streak_leaderboard() rename to _sec_lb_get_streak_leaderboard_24806;
create function public.get_streak_leaderboard()
returns TABLE(email text, name text, best_streak bigint, member_key uuid)
language sql stable security definer set search_path to 'public'
as $wrap$
  select f.*, mi.member_key
  from public._sec_lb_get_streak_leaderboard_24806() f
  left join member_identities mi on mi.email = lower(f.email)
$wrap$;
revoke all on function public._sec_lb_get_streak_leaderboard_24806() from public, anon, authenticated;
grant execute on function public._sec_lb_get_streak_leaderboard_24806() to service_role;
revoke all on function public.get_streak_leaderboard() from public, anon;
grant execute on function public.get_streak_leaderboard() to authenticated, service_role;

notify pgrst, 'reload schema';
commit;
