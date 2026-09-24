begin;

-- Step one of two. The boards still return the address, because production is
-- serving a page that reads it and taking it away now would empty the
-- leaderboards mid-session. What they gain here is the two facts the pages
-- actually use it for: whether a row is an owner account, which both boards
-- hide, and whether it is the reviewer account, which only the practice log
-- hides. Once the pages read these instead, the address goes.

drop function if exists public.get_achievement_leaderboard();
create function public.get_achievement_leaderboard()
returns TABLE(email text, name text, achievement_count bigint, member_key uuid, is_owner_account boolean, is_reviewer boolean)
language sql volatile security definer set search_path to 'public'
as $wrap$
  select f.email, f.name, f.achievement_count, mi.member_key,
         (lower(f.email) in ('matthew@matthewcawood.com','mcawoodcanada@gmail.com')),
         (lower(f.email) = 'reviewer@matthewcawood.com')
  from public._sec_lb_get_achievement_leaderboard_29547() f
  left join member_identities mi on mi.email = lower(f.email)
$wrap$;
revoke all on function public.get_achievement_leaderboard() from public, anon;
grant execute on function public.get_achievement_leaderboard() to authenticated, service_role;

drop function if exists public.get_alltime_leaderboard();
create function public.get_alltime_leaderboard()
returns TABLE(email text, name text, total_minutes numeric, member_key uuid, is_owner_account boolean, is_reviewer boolean)
language sql volatile security definer set search_path to 'public'
as $wrap$
  select f.email, f.name, f.total_minutes, mi.member_key,
         (lower(f.email) in ('matthew@matthewcawood.com','mcawoodcanada@gmail.com')),
         (lower(f.email) = 'reviewer@matthewcawood.com')
  from public._sec_lb_get_alltime_leaderboard_23188() f
  left join member_identities mi on mi.email = lower(f.email)
$wrap$;
revoke all on function public.get_alltime_leaderboard() from public, anon;
grant execute on function public.get_alltime_leaderboard() to authenticated, service_role;

drop function if exists public.get_interval_leaderboard(p_side text, p_tier text, p_key_mode text, p_playback text, p_key_signature text);
create function public.get_interval_leaderboard(p_side text, p_tier text, p_key_mode text, p_playback text DEFAULT NULL::text, p_key_signature text DEFAULT NULL::text)
returns TABLE(email text, name text, score integer, member_key uuid, is_owner_account boolean, is_reviewer boolean)
language sql stable
as $wrap$
  select f.email, f.name, f.score, (select s.member_key from public.interval_game_scores s where lower(s.email)=lower(f.email) limit 1),
         (lower(f.email) in ('matthew@matthewcawood.com','mcawoodcanada@gmail.com')),
         (lower(f.email) = 'reviewer@matthewcawood.com')
  from public._sec_lb_get_interval_leaderboard_29791(p_side, p_tier, p_key_mode, p_playback, p_key_signature) f
$wrap$;
revoke all on function public.get_interval_leaderboard(p_side text, p_tier text, p_key_mode text, p_playback text, p_key_signature text) from public, anon;
grant execute on function public.get_interval_leaderboard(p_side text, p_tier text, p_key_mode text, p_playback text, p_key_signature text) to authenticated, service_role;

drop function if exists public.get_last_month_leaderboard();
create function public.get_last_month_leaderboard()
returns TABLE(email text, name text, total_minutes numeric, member_key uuid, is_owner_account boolean, is_reviewer boolean)
language sql volatile security definer set search_path to 'public'
as $wrap$
  select f.email, f.name, f.total_minutes, mi.member_key,
         (lower(f.email) in ('matthew@matthewcawood.com','mcawoodcanada@gmail.com')),
         (lower(f.email) = 'reviewer@matthewcawood.com')
  from public._sec_lb_get_last_month_leaderboard_23189() f
  left join member_identities mi on mi.email = lower(f.email)
$wrap$;
revoke all on function public.get_last_month_leaderboard() from public, anon;
grant execute on function public.get_last_month_leaderboard() to authenticated, service_role;

drop function if exists public.get_last_month_leaderboard_full();
create function public.get_last_month_leaderboard_full()
returns TABLE(email text, name text, total_minutes numeric, member_key uuid, is_owner_account boolean, is_reviewer boolean)
language sql volatile security definer set search_path to 'public'
as $wrap$
  select f.email, f.name, f.total_minutes, mi.member_key,
         (lower(f.email) in ('matthew@matthewcawood.com','mcawoodcanada@gmail.com')),
         (lower(f.email) = 'reviewer@matthewcawood.com')
  from public._sec_lb_get_last_month_leaderboard_full_67417() f
  left join member_identities mi on mi.email = lower(f.email)
$wrap$;
revoke all on function public.get_last_month_leaderboard_full() from public, anon;
grant execute on function public.get_last_month_leaderboard_full() to authenticated, service_role;

drop function if exists public.get_leaderboard();
create function public.get_leaderboard()
returns TABLE(email text, name text, total_minutes bigint, member_key uuid, is_owner_account boolean, is_reviewer boolean)
language sql volatile security definer set search_path to 'public'
as $wrap$
  select f.email, f.name, f.total_minutes, mi.member_key,
         (lower(f.email) in ('matthew@matthewcawood.com','mcawoodcanada@gmail.com')),
         (lower(f.email) = 'reviewer@matthewcawood.com')
  from public._sec_lb_get_leaderboard_23076() f
  left join member_identities mi on mi.email = lower(f.email)
$wrap$;
revoke all on function public.get_leaderboard() from public, anon;
grant execute on function public.get_leaderboard() to authenticated, service_role;

drop function if exists public.get_note_game_leaderboard();
create function public.get_note_game_leaderboard()
returns TABLE(email text, name text, score integer, clef text, accidentals boolean, member_key uuid, is_owner_account boolean, is_reviewer boolean)
language sql volatile security definer set search_path to 'public'
as $wrap$
  select f.email, f.name, f.score, f.clef, f.accidentals, mi.member_key,
         (lower(f.email) in ('matthew@matthewcawood.com','mcawoodcanada@gmail.com')),
         (lower(f.email) = 'reviewer@matthewcawood.com')
  from public._sec_lb_get_note_game_leaderboard_23421() f
  left join member_identities mi on mi.email = lower(f.email)
$wrap$;
revoke all on function public.get_note_game_leaderboard() from public, anon;
grant execute on function public.get_note_game_leaderboard() to authenticated, service_role;

drop function if exists public.get_piece_leaderboard();
create function public.get_piece_leaderboard()
returns TABLE(email text, name text, piece_name text, total_minutes bigint, member_key uuid, is_owner_account boolean, is_reviewer boolean)
language sql volatile security definer set search_path to 'public'
as $wrap$
  select f.email, f.name, f.piece_name, f.total_minutes, mi.member_key,
         (lower(f.email) in ('matthew@matthewcawood.com','mcawoodcanada@gmail.com')),
         (lower(f.email) = 'reviewer@matthewcawood.com')
  from public._sec_lb_get_piece_leaderboard_23077() f
  left join member_identities mi on mi.email = lower(f.email)
$wrap$;
revoke all on function public.get_piece_leaderboard() from public, anon;
grant execute on function public.get_piece_leaderboard() to authenticated, service_role;

drop function if exists public.get_piece_leaderboard_month();
create function public.get_piece_leaderboard_month()
returns TABLE(email text, name text, piece_name text, total_minutes numeric, member_key uuid, is_owner_account boolean, is_reviewer boolean)
language sql volatile security definer set search_path to 'public'
as $wrap$
  select f.email, f.name, f.piece_name, f.total_minutes, mi.member_key,
         (lower(f.email) in ('matthew@matthewcawood.com','mcawoodcanada@gmail.com')),
         (lower(f.email) = 'reviewer@matthewcawood.com')
  from public._sec_lb_get_piece_leaderboard_month_23434() f
  left join member_identities mi on mi.email = lower(f.email)
$wrap$;
revoke all on function public.get_piece_leaderboard_month() from public, anon;
grant execute on function public.get_piece_leaderboard_month() to authenticated, service_role;

drop function if exists public.get_scale_leaderboard();
create function public.get_scale_leaderboard()
returns TABLE(email text, name text, technique_name text, session_count bigint, member_key uuid, is_owner_account boolean, is_reviewer boolean)
language sql volatile security definer set search_path to 'public'
as $wrap$
  select f.email, f.name, f.technique_name, f.session_count, mi.member_key,
         (lower(f.email) in ('matthew@matthewcawood.com','mcawoodcanada@gmail.com')),
         (lower(f.email) = 'reviewer@matthewcawood.com')
  from public._sec_lb_get_scale_leaderboard_23078() f
  left join member_identities mi on mi.email = lower(f.email)
$wrap$;
revoke all on function public.get_scale_leaderboard() from public, anon;
grant execute on function public.get_scale_leaderboard() to authenticated, service_role;

drop function if exists public.get_scale_leaderboard_month();
create function public.get_scale_leaderboard_month()
returns TABLE(email text, name text, technique_name text, session_count bigint, member_key uuid, is_owner_account boolean, is_reviewer boolean)
language sql volatile security definer set search_path to 'public'
as $wrap$
  select f.email, f.name, f.technique_name, f.session_count, mi.member_key,
         (lower(f.email) in ('matthew@matthewcawood.com','mcawoodcanada@gmail.com')),
         (lower(f.email) = 'reviewer@matthewcawood.com')
  from public._sec_lb_get_scale_leaderboard_month_23435() f
  left join member_identities mi on mi.email = lower(f.email)
$wrap$;
revoke all on function public.get_scale_leaderboard_month() from public, anon;
grant execute on function public.get_scale_leaderboard_month() to authenticated, service_role;

drop function if exists public.get_streak_leaderboard();
create function public.get_streak_leaderboard()
returns TABLE(email text, name text, best_streak bigint, member_key uuid, is_owner_account boolean, is_reviewer boolean)
language sql stable security definer set search_path to 'public'
as $wrap$
  select f.email, f.name, f.best_streak, mi.member_key,
         (lower(f.email) in ('matthew@matthewcawood.com','mcawoodcanada@gmail.com')),
         (lower(f.email) = 'reviewer@matthewcawood.com')
  from public._sec_lb_get_streak_leaderboard_24806() f
  left join member_identities mi on mi.email = lower(f.email)
$wrap$;
revoke all on function public.get_streak_leaderboard() from public, anon;
grant execute on function public.get_streak_leaderboard() to authenticated, service_role;

notify pgrst, 'reload schema';
commit;
