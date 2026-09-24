-- Batch 2: the views the UI already restricts to "yours, or Matthew's".
-- Each original is renamed and left exactly as it was; the name now belongs to a
-- wrapper that checks the caller first. Nothing about the logic moves.

-- ack_custom_piece: never called by the client; no wrapper, just close the door
revoke execute on function public.ack_custom_piece(p_email text, p_user_piece_id bigint) from anon, authenticated;

-- admin_get_user_sessions
alter function public.admin_get_user_sessions(p_email text) rename to _sec_admin_get_user_sessions_23278;
revoke all on function public._sec_admin_get_user_sessions_23278(p_email text) from public, anon, authenticated;

create or replace function public.admin_get_user_sessions(p_email text)
 returns TABLE(session_date date, duration_minutes integer, timing_mode text, practice_items jsonb)
 language plpgsql
 security definer
as $wrap$
begin
  perform public.assert_self_or_owner(p_email);
  return query select * from public._sec_admin_get_user_sessions_23278(p_email);
end;
$wrap$;
grant execute on function public.admin_get_user_sessions(p_email text) to authenticated;

-- admin_record_achievements
alter function public.admin_record_achievements(p_email text, p_ids text[]) rename to _sec_admin_record_achievements_23279;
revoke all on function public._sec_admin_record_achievements_23279(p_email text, p_ids text[]) from public, anon, authenticated;

create or replace function public.admin_record_achievements(p_email text, p_ids text[])
 returns void
 language plpgsql
 security definer
as $wrap$
begin
  perform public.assert_self_or_owner(p_email);
  perform public._sec_admin_record_achievements_23279(p_email, p_ids);
end;
$wrap$;
grant execute on function public.admin_record_achievements(p_email text, p_ids text[]) to authenticated;

-- delete_piece_goal
alter function public.delete_piece_goal(p_id bigint, p_email text) rename to _sec_delete_piece_goal_23223;
revoke all on function public._sec_delete_piece_goal_23223(p_id bigint, p_email text) from public, anon, authenticated;

create or replace function public.delete_piece_goal(p_id bigint, p_email text)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $wrap$
begin
  perform public.assert_self_or_owner(p_email);
  perform public._sec_delete_piece_goal_23223(p_id, p_email);
end;
$wrap$;
grant execute on function public.delete_piece_goal(p_id bigint, p_email text) to authenticated;

-- derive_streak_state: never called by the client; no wrapper, just close the door
revoke execute on function public.derive_streak_state(p_email text) from anon, authenticated;

-- drop_custom_piece: never called by the client; no wrapper, just close the door
revoke execute on function public.drop_custom_piece(p_email text, p_user_piece_id bigint) from anon, authenticated;

-- get_activity_feed: never called by the client; no wrapper, just close the door
revoke execute on function public.get_activity_feed(p_email text) from anon, authenticated;

-- get_custom_piece_statuses
alter function public.get_custom_piece_statuses(p_email text) rename to _sec_get_custom_piece_statuses_31875;
revoke all on function public._sec_get_custom_piece_statuses_31875(p_email text) from public, anon, authenticated;

create or replace function public.get_custom_piece_statuses(p_email text)
 returns TABLE(user_piece_id bigint, title text, status text, difficulty integer)
 language plpgsql
 security definer
 set search_path to 'public'
as $wrap$
begin
  perform public.assert_self_or_owner(p_email);
  return query select * from public._sec_get_custom_piece_statuses_31875(p_email);
end;
$wrap$;
grant execute on function public.get_custom_piece_statuses(p_email text) to authenticated;

-- get_my_sessions
alter function public.get_my_sessions(p_email text) rename to _sec_get_my_sessions_23173;
revoke all on function public._sec_get_my_sessions_23173(p_email text) from public, anon, authenticated;

create or replace function public.get_my_sessions(p_email text)
 returns json
 language plpgsql
 security definer
as $wrap$
begin
  perform public.assert_self_or_owner(p_email);
  return public._sec_get_my_sessions_23173(p_email);
end;
$wrap$;
grant execute on function public.get_my_sessions(p_email text) to authenticated;

-- get_piece_goals
alter function public.get_piece_goals(p_email text) rename to _sec_get_piece_goals_23224;
revoke all on function public._sec_get_piece_goals_23224(p_email text) from public, anon, authenticated;

create or replace function public.get_piece_goals(p_email text)
 returns SETOF piece_goals
 language plpgsql
 security definer
as $wrap$
begin
  perform public.assert_self_or_owner(p_email);
  return query select * from public._sec_get_piece_goals_23224(p_email);
end;
$wrap$;
grant execute on function public.get_piece_goals(p_email text) to authenticated;

-- get_user_achievement_events
alter function public.get_user_achievement_events(p_email text) rename to _sec_get_user_achievement_events_23192;
revoke all on function public._sec_get_user_achievement_events_23192(p_email text) from public, anon, authenticated;

create or replace function public.get_user_achievement_events(p_email text)
 returns TABLE(achievement_id text, earned_at timestamp with time zone)
 language plpgsql
 security definer
as $wrap$
begin
  perform public.assert_self_or_owner(p_email);
  return query select * from public._sec_get_user_achievement_events_23192(p_email);
end;
$wrap$;
grant execute on function public.get_user_achievement_events(p_email text) to authenticated;

-- get_user_collection
alter function public.get_user_collection(p_email text) rename to _sec_get_user_collection_23177;
revoke all on function public._sec_get_user_collection_23177(p_email text) from public, anon, authenticated;

create or replace function public.get_user_collection(p_email text)
 returns TABLE(piece_id bigint, status text, id bigint, title text, composer text, difficulty integer)
 language plpgsql
 security definer
 set search_path to 'public'
as $wrap$
begin
  perform public.assert_self_or_owner(p_email);
  return query select * from public._sec_get_user_collection_23177(p_email);
end;
$wrap$;
grant execute on function public.get_user_collection(p_email text) to authenticated;

-- get_user_passage_games
alter function public.get_user_passage_games(p_email text) rename to _sec_get_user_passage_games_23184;
revoke all on function public._sec_get_user_passage_games_23184(p_email text) from public, anon, authenticated;

create or replace function public.get_user_passage_games(p_email text)
 returns SETOF passage_games
 language plpgsql
 security definer
 set search_path to 'public'
as $wrap$
begin
  perform public.assert_self_or_owner(p_email);
  return query select * from public._sec_get_user_passage_games_23184(p_email);
end;
$wrap$;
grant execute on function public.get_user_passage_games(p_email text) to authenticated;

-- get_user_reading_list
alter function public.get_user_reading_list(p_email text) rename to _sec_get_user_reading_list_23183;
revoke all on function public._sec_get_user_reading_list_23183(p_email text) from public, anon, authenticated;

create or replace function public.get_user_reading_list(p_email text)
 returns TABLE(sheet_id uuid, status text, created_at timestamp with time zone)
 language plpgsql
 security definer
 set search_path to 'public'
as $wrap$
begin
  perform public.assert_self_or_owner(p_email);
  return query select * from public._sec_get_user_reading_list_23183(p_email);
end;
$wrap$;
grant execute on function public.get_user_reading_list(p_email text) to authenticated;

-- get_user_streak_saves
alter function public.get_user_streak_saves(p_email text) rename to _sec_get_user_streak_saves_23281;
revoke all on function public._sec_get_user_streak_saves_23281(p_email text) from public, anon, authenticated;

create or replace function public.get_user_streak_saves(p_email text)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public'
as $wrap$
begin
  perform public.assert_self_or_owner(p_email);
  return public._sec_get_user_streak_saves_23281(p_email);
end;
$wrap$;
grant execute on function public.get_user_streak_saves(p_email text) to authenticated;

-- recompute_streak_tokens
alter function public.recompute_streak_tokens(p_email text) rename to _sec_recompute_streak_tokens_28666;
revoke all on function public._sec_recompute_streak_tokens_28666(p_email text) from public, anon, authenticated;

create or replace function public.recompute_streak_tokens(p_email text)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $wrap$
begin
  perform public.assert_self_or_owner(p_email);
  perform public._sec_recompute_streak_tokens_28666(p_email);
end;
$wrap$;
grant execute on function public.recompute_streak_tokens(p_email text) to authenticated;

-- remove_collection_piece
alter function public.remove_collection_piece(p_email text, p_piece_id integer) rename to _sec_remove_collection_piece_23424;
revoke all on function public._sec_remove_collection_piece_23424(p_email text, p_piece_id integer) from public, anon, authenticated;

create or replace function public.remove_collection_piece(p_email text, p_piece_id integer)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $wrap$
begin
  perform public.assert_self_or_owner(p_email);
  perform public._sec_remove_collection_piece_23424(p_email, p_piece_id);
end;
$wrap$;
grant execute on function public.remove_collection_piece(p_email text, p_piece_id integer) to authenticated;

-- set_collection_status
alter function public.set_collection_status(p_email text, p_piece_id integer, p_status text) rename to _sec_set_collection_status_23423;
revoke all on function public._sec_set_collection_status_23423(p_email text, p_piece_id integer, p_status text) from public, anon, authenticated;

create or replace function public.set_collection_status(p_email text, p_piece_id integer, p_status text)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $wrap$
begin
  perform public.assert_self_or_owner(p_email);
  perform public._sec_set_collection_status_23423(p_email, p_piece_id, p_status);
end;
$wrap$;
grant execute on function public.set_collection_status(p_email text, p_piece_id integer, p_status text) to authenticated;

-- set_piece_goal_done
alter function public.set_piece_goal_done(p_id bigint, p_email text, p_done boolean) rename to _sec_set_piece_goal_done_31874;
revoke all on function public._sec_set_piece_goal_done_31874(p_id bigint, p_email text, p_done boolean) from public, anon, authenticated;

create or replace function public.set_piece_goal_done(p_id bigint, p_email text, p_done boolean)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $wrap$
begin
  perform public.assert_self_or_owner(p_email);
  perform public._sec_set_piece_goal_done_31874(p_id, p_email, p_done);
end;
$wrap$;
grant execute on function public.set_piece_goal_done(p_id bigint, p_email text, p_done boolean) to authenticated;

-- sync_goal_piece_ids
alter function public.sync_goal_piece_ids(p_email text) rename to _sec_sync_goal_piece_ids_23229;
revoke all on function public._sec_sync_goal_piece_ids_23229(p_email text) from public, anon, authenticated;

create or replace function public.sync_goal_piece_ids(p_email text)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $wrap$
begin
  perform public.assert_self_or_owner(p_email);
  perform public._sec_sync_goal_piece_ids_23229(p_email);
end;
$wrap$;
grant execute on function public.sync_goal_piece_ids(p_email text) to authenticated;

-- upsert_piece_goal
alter function public.upsert_piece_goal(p_email text, p_piece_label text, p_composer text, p_piece_id bigint, p_target_date date) rename to _sec_upsert_piece_goal_23222;
revoke all on function public._sec_upsert_piece_goal_23222(p_email text, p_piece_label text, p_composer text, p_piece_id bigint, p_target_date date) from public, anon, authenticated;

create or replace function public.upsert_piece_goal(p_email text, p_piece_label text, p_composer text, p_piece_id bigint, p_target_date date)
 returns bigint
 language plpgsql
 security definer
as $wrap$
begin
  perform public.assert_self_or_owner(p_email);
  return public._sec_upsert_piece_goal_23222(p_email, p_piece_label, p_composer, p_piece_id, p_target_date);
end;
$wrap$;
grant execute on function public.upsert_piece_goal(p_email text, p_piece_label text, p_composer text, p_piece_id bigint, p_target_date date) to authenticated;

-- upsert_piece_goal
alter function public.upsert_piece_goal(p_email text, p_piece_label text, p_composer text, p_piece_id bigint, p_target_date date, p_category text, p_goal_type text, p_target_hours numeric) rename to _sec_upsert_piece_goal_23227;
revoke all on function public._sec_upsert_piece_goal_23227(p_email text, p_piece_label text, p_composer text, p_piece_id bigint, p_target_date date, p_category text, p_goal_type text, p_target_hours numeric) from public, anon, authenticated;

create or replace function public.upsert_piece_goal(p_email text, p_piece_label text, p_composer text, p_piece_id bigint, p_target_date date, p_category text DEFAULT 'piece'::text, p_goal_type text DEFAULT 'deadline'::text, p_target_hours numeric DEFAULT NULL::numeric)
 returns bigint
 language plpgsql
 security definer
as $wrap$
begin
  perform public.assert_self_or_owner(p_email);
  return public._sec_upsert_piece_goal_23227(p_email, p_piece_label, p_composer, p_piece_id, p_target_date, p_category, p_goal_type, p_target_hours);
end;
$wrap$;
grant execute on function public.upsert_piece_goal(p_email text, p_piece_label text, p_composer text, p_piece_id bigint, p_target_date date, p_category text, p_goal_type text, p_target_hours numeric) to authenticated;
