-- SECURITY (Pass 2, Medium): authenticated member-vs-member IDOR. Pass 1 blocked
-- anonymous callers; these SECURITY DEFINER write functions still trusted a
-- client-supplied p_email, so a logged-IN member could pass another member's
-- email and corrupt their pieces/goals/collection/feedback. Each now refuses
-- when a logged-in caller's JWT email is neither the target email nor the owner
-- (service_role/cron calls have no JWT email and pass through). search_path is
-- pinned on the ones that lacked it. Applied live via the Management API
-- 2026-07-11; committed to match prod.

-- Guard helper pattern inlined per fn:
--   if a logged-in user is calling (jwt email present) and it isn't the target
--   email and isn't the owner, refuse. Anon can't reach here (Pass 1 revoke);
--   service_role/cron calls have no jwt email and pass through.

CREATE OR REPLACE FUNCTION public.ack_custom_piece(p_email text, p_user_piece_id bigint)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
begin
  if auth.jwt()->>'email' is not null and lower(auth.jwt()->>'email') is distinct from lower(p_email) and lower(auth.jwt()->>'email') is distinct from 'matthew@matthewcawood.com' then raise exception 'forbidden'; end if;
  update user_pieces set dormancy_acked_at = now() where id = p_user_piece_id and lower(email) = lower(p_email);
end; $fn$;

CREATE OR REPLACE FUNCTION public.drop_custom_piece(p_email text, p_user_piece_id bigint)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
begin
  if auth.jwt()->>'email' is not null and lower(auth.jwt()->>'email') is distinct from lower(p_email) and lower(auth.jwt()->>'email') is distinct from 'matthew@matthewcawood.com' then raise exception 'forbidden'; end if;
  update user_pieces set dormancy_acked_at = now() where id = p_user_piece_id and lower(email) = lower(p_email);
  delete from user_collections where lower(email) = lower(p_email) and user_piece_id = p_user_piece_id;
end; $fn$;

CREATE OR REPLACE FUNCTION public.complete_custom_piece(p_email text, p_user_piece_id bigint, p_rating text)
 RETURNS smallint LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
declare v_min numeric := 0; v_hours numeric; v_tier int; v_diff int;
begin
  if auth.jwt()->>'email' is not null and lower(auth.jwt()->>'email') is distinct from lower(p_email) and lower(auth.jwt()->>'email') is distinct from 'matthew@matthewcawood.com' then raise exception 'forbidden'; end if;
  select coalesce(sum(pi.duration_minutes), 0) into v_min from practice_items pi join practice_sessions ps on ps.id = pi.session_id where lower(ps.email) = lower(p_email);
  v_min := v_min + coalesce((select total_minutes from practice_baseline where lower(email) = lower(p_email)), 0);
  v_hours := v_min / 60.0;
  v_tier := case when v_hours >= 3500 then 5 when v_hours >= 1200 then 4 when v_hours >= 700 then 3 when v_hours >= 350 then 2 when v_hours >= 50 then 1 else 0 end;
  v_diff := case when p_rating = 'below' then greatest(0, v_tier - 1) else v_tier end;
  update user_pieces set difficulty = v_diff, dormancy_acked_at = now() where id = p_user_piece_id and lower(email) = lower(p_email);
  if not found then return null; end if;
  if exists (select 1 from user_collections where lower(email) = lower(p_email) and user_piece_id = p_user_piece_id) then
    update user_collections set status = 'completed' where lower(email) = lower(p_email) and user_piece_id = p_user_piece_id;
  else
    insert into user_collections (email, user_piece_id, status) values (p_email, p_user_piece_id, 'completed');
  end if;
  return v_diff;
end; $fn$;

CREATE OR REPLACE FUNCTION public.delete_piece_goal(p_id bigint, p_email text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
begin
  if auth.jwt()->>'email' is not null and lower(auth.jwt()->>'email') is distinct from lower(p_email) and lower(auth.jwt()->>'email') is distinct from 'matthew@matthewcawood.com' then raise exception 'forbidden'; end if;
  delete from piece_goals where id = p_id and email = p_email;
end; $fn$;

CREATE OR REPLACE FUNCTION public.remove_collection_piece(p_email text, p_piece_id integer)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
begin
  if auth.jwt()->>'email' is not null and lower(auth.jwt()->>'email') is distinct from lower(p_email) and lower(auth.jwt()->>'email') is distinct from 'matthew@matthewcawood.com' then raise exception 'forbidden'; end if;
  delete from user_collections where email = p_email and piece_id = p_piece_id;
end; $fn$;

CREATE OR REPLACE FUNCTION public.set_collection_status(p_email text, p_piece_id integer, p_status text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
begin
  if auth.jwt()->>'email' is not null and lower(auth.jwt()->>'email') is distinct from lower(p_email) and lower(auth.jwt()->>'email') is distinct from 'matthew@matthewcawood.com' then raise exception 'forbidden'; end if;
  insert into user_collections (email, piece_id, status) values (p_email, p_piece_id, p_status)
  on conflict (email, piece_id) do update set status = p_status;
end; $fn$;

CREATE OR REPLACE FUNCTION public.sync_goal_piece_ids(p_email text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
begin
  if auth.jwt()->>'email' is not null and lower(auth.jwt()->>'email') is distinct from lower(p_email) and lower(auth.jwt()->>'email') is distinct from 'matthew@matthewcawood.com' then raise exception 'forbidden'; end if;
  update piece_goals g set piece_id = p.id from pieces p where g.email = p_email and g.piece_id is null and lower(g.piece_label) = lower(p.title);
end; $fn$;

CREATE OR REPLACE FUNCTION public.toggle_feed_reaction(p_reactor text, p_event_type text, p_item_id bigint)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
begin
  if auth.jwt()->>'email' is not null and lower(auth.jwt()->>'email') is distinct from lower(p_reactor) and lower(auth.jwt()->>'email') is distinct from 'matthew@matthewcawood.com' then raise exception 'forbidden'; end if;
  if exists (select 1 from feed_reactions where reactor_email = p_reactor and event_type = p_event_type and item_id = p_item_id) then
    delete from feed_reactions where reactor_email = p_reactor and event_type = p_event_type and item_id = p_item_id;
  else
    insert into feed_reactions (reactor_email, event_type, item_id) values (p_reactor, p_event_type, p_item_id);
  end if;
end; $fn$;

CREATE OR REPLACE FUNCTION public.toggle_feedback_upvote(p_id uuid, p_email text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $fn$
declare v_upvoted_by jsonb; v_already boolean;
begin
  if auth.jwt()->>'email' is not null and lower(auth.jwt()->>'email') is distinct from lower(p_email) and lower(auth.jwt()->>'email') is distinct from 'matthew@matthewcawood.com' then raise exception 'forbidden'; end if;
  select upvoted_by into v_upvoted_by from feedback where id = p_id;
  v_already := v_upvoted_by ? p_email;
  if v_already then
    update feedback set upvoted_by = upvoted_by - p_email, upvotes = upvotes - 1, updated_at = now() where id = p_id;
    return jsonb_build_object('upvoted', false);
  else
    update feedback set upvoted_by = upvoted_by || to_jsonb(p_email), upvotes = upvotes + 1, updated_at = now() where id = p_id;
    return jsonb_build_object('upvoted', true);
  end if;
end; $fn$;

select 'pass2 write-family guarded' as status;
