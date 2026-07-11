-- Move the difficulty mapping server-side so a custom piece can be completed + rated
-- from ANY page (the library "mark completed", the dashboard card, a session) without
-- the client needing the roadmap. The client just sends the relative choice
-- ('below' | 'at' | 'above'); the RPC works out the member's stage tier from their
-- practice hours and stores the absolute difficulty.

drop function if exists public.complete_custom_piece(text, bigint, smallint);

create or replace function public.complete_custom_piece(
  p_email         text,
  p_user_piece_id bigint,
  p_rating        text            -- 'below' (comfortable) | 'at' (challenging) | 'above' (stretch)
) returns smallint
language plpgsql security definer set search_path = public as $$
declare
  v_min   numeric := 0;
  v_hours numeric;
  v_tier  int;
  v_diff  int;
begin
  -- total practice minutes = logged item durations + any prior-hours baseline,
  -- matching the roadmap's "total" track (_rmTrackMinutes().total).
  select coalesce(sum(pi.duration_minutes), 0) into v_min
    from practice_items pi
    join practice_sessions ps on ps.id = pi.session_id
   where lower(ps.email) = lower(p_email);
  v_min := v_min + coalesce(
    (select total_minutes from practice_baseline where lower(email) = lower(p_email)), 0);
  v_hours := v_min / 60.0;

  -- hours -> stage tier, from ROADMAP "total" track:
  --   hours [0, 50, 150, 350, 700, 1200, 2000, 3500] -> tier [0, 1, 1, 2, 3, 4, 4, 5]
  v_tier := case
    when v_hours >= 3500 then 5
    when v_hours >= 1200 then 4
    when v_hours >= 700  then 3
    when v_hours >= 350  then 2
    when v_hours >= 50   then 1
    else 0 end;

  -- 'below' ranks one tier under the member's level; 'at'/'above' both = their level
  -- (a stretch piece still only counts toward the level they are currently on).
  v_diff := case when p_rating = 'below' then greatest(0, v_tier - 1) else v_tier end;

  update user_pieces set difficulty = v_diff, dormancy_acked_at = now()
   where id = p_user_piece_id and lower(email) = lower(p_email);
  if not found then return null; end if;

  if exists (select 1 from user_collections
             where lower(email) = lower(p_email) and user_piece_id = p_user_piece_id) then
    update user_collections set status = 'completed'
     where lower(email) = lower(p_email) and user_piece_id = p_user_piece_id;
  else
    insert into user_collections (email, user_piece_id, status)
    values (p_email, p_user_piece_id, 'completed');
  end if;

  return v_diff;
end; $$;
grant execute on function public.complete_custom_piece(text, bigint, text) to authenticated;
