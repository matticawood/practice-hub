-- Batch 1: the definer functions whose every call site already passes the
-- caller's own address. A check that it must be theirs cannot change what a
-- real user sees; it only closes the door on passing somebody else's.
--
-- Three callers have to keep working, and the guard distinguishes them:
--   an end user        - token carries an email; it must be theirs, or Matthew's
--   an internal caller - cron and service_role carry no end-user email; allowed
--   nobody at all      - anon has a token with no email; refused for private data
--
-- The existing guard inside complete_custom_piece is the house pattern, and it
-- has a gap: `auth.jwt()->>'email' is not null` lets anon straight through,
-- because anon has no email either. This helper closes that.

create or replace function public.assert_self_or_owner(p_email text)
returns void
language plpgsql
stable
security definer
set search_path to 'public'
as $fn$
declare
  v_claims json;
  v_role   text;
  v_caller text;
begin
  v_claims := nullif(current_setting('request.jwt.claims', true), '')::json;
  v_role   := coalesce(v_claims ->> 'role', '');

  -- Not an end-user call: pg_cron, service_role, psql. Leave these alone, or the
  -- nightly streak jobs stop running.
  if v_role not in ('authenticated', 'anon') then
    return;
  end if;

  v_caller := lower(coalesce(v_claims ->> 'email', ''));
  if v_caller <> ''
     and (v_caller = lower(coalesce(p_email, ''))
          or v_caller = 'matthew@matthewcawood.com') then
    return;
  end if;

  raise exception 'not authorised' using errcode = '42501';
end;
$fn$;

revoke all on function public.assert_self_or_owner(text) from public, anon, authenticated;

-- ---------------------------------------------------------------- reads ----

create or replace function public.get_roadmap_minutes(p_email text)
returns numeric
language plpgsql
security definer
set search_path to 'public'
as $fn$
begin
  perform public.assert_self_or_owner(p_email);
  return (
    SELECT COALESCE((
        SELECT SUM(pi.duration_minutes)
        FROM practice_items pi
        JOIN practice_sessions ps ON ps.id = pi.session_id
        WHERE ps.email = p_email
      ), 0)
    + COALESCE((SELECT pb.total_minutes FROM practice_baseline pb WHERE pb.email = p_email), 0)
  );
end;
$fn$;

create or replace function public.get_my_leaderboard_ranks(p_email text)
returns table(board text, user_rank bigint, total_users bigint)
language plpgsql
security definer
as $fn$
begin
  perform public.assert_self_or_owner(p_email);
  return query
  WITH monthly AS (
    SELECT email, COALESCE(SUM(duration_minutes), 0) AS val
    FROM practice_sessions
    WHERE session_date >= DATE_TRUNC('month', CURRENT_DATE)
      AND session_date <  DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    GROUP BY email
  ),
  monthly_ranked AS (
    SELECT email,
      RANK() OVER (ORDER BY val DESC) AS rnk,
      COUNT(*) OVER ()                AS total
    FROM monthly WHERE val > 0
  ),
  alltime AS (
    SELECT email, COALESCE(SUM(duration_minutes), 0) AS val
    FROM practice_sessions GROUP BY email
  ),
  alltime_ranked AS (
    SELECT email,
      RANK() OVER (ORDER BY val DESC) AS rnk,
      COUNT(*) OVER ()                AS total
    FROM alltime WHERE val > 0
  ),
  daily AS (
    SELECT DISTINCT email, session_date::date AS day FROM practice_sessions
  ),
  grouped AS (
    SELECT email, day,
      day - (ROW_NUMBER() OVER (PARTITION BY email ORDER BY day) || ' days')::interval AS grp
    FROM daily
  ),
  latest_grp AS (
    SELECT email, grp, MAX(day) AS last_day, COUNT(*) AS streak_len
    FROM grouped GROUP BY email, grp
  ),
  current_streak AS (
    SELECT DISTINCT ON (email) email, streak_len AS val
    FROM latest_grp
    WHERE last_day >= CURRENT_DATE - 1
    ORDER BY email, last_day DESC
  ),
  streak_ranked AS (
    SELECT email,
      RANK() OVER (ORDER BY val DESC) AS rnk,
      COUNT(*) OVER ()                AS total
    FROM current_streak WHERE val > 0
  ),
  badge_counts AS (
    SELECT email, COUNT(*) AS val FROM achievement_events GROUP BY email
  ),
  badge_ranked AS (
    SELECT email,
      RANK() OVER (ORDER BY val DESC) AS rnk,
      COUNT(*) OVER ()                AS total
    FROM badge_counts WHERE val > 0
  )
  SELECT 'monthly' AS board,
    (SELECT rnk   FROM monthly_ranked WHERE email = p_email) AS user_rank,
    (SELECT total FROM monthly_ranked LIMIT 1)               AS total_users
  UNION ALL
  SELECT 'alltime',
    (SELECT rnk   FROM alltime_ranked WHERE email = p_email),
    (SELECT total FROM alltime_ranked LIMIT 1)
  UNION ALL
  SELECT 'streak',
    (SELECT rnk   FROM streak_ranked WHERE email = p_email),
    (SELECT total FROM streak_ranked LIMIT 1)
  UNION ALL
  SELECT 'badges',
    (SELECT rnk   FROM badge_ranked WHERE email = p_email),
    (SELECT total FROM badge_ranked LIMIT 1);
end;
$fn$;

-- --------------------------------------------------------------- writes ----

create or replace function public.record_achievements(p_email text, achievement_ids text[])
returns void
language plpgsql
security definer
set search_path to 'public'
as $fn$
begin
  perform public.assert_self_or_owner(p_email);
  INSERT INTO achievement_events (email, achievement_id)
  SELECT p_email, unnest(achievement_ids)
  ON CONFLICT (email, achievement_id) DO NOTHING;
end;
$fn$;

create or replace function public.update_piece_goal(p_id bigint, p_email text, p_target_date date default null::date, p_target_hours numeric default null::numeric)
returns void
language plpgsql
security definer
set search_path to 'public'
as $fn$
begin
  perform public.assert_self_or_owner(p_email);
  update piece_goals
  set    target_date  = coalesce(p_target_date,  target_date),
         target_hours = coalesce(p_target_hours, target_hours)
  where  id = p_id
    and  lower(email) = lower(p_email);
end;
$fn$;

create or replace function public.update_user_piece_title(p_id bigint, p_email text, p_title text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $fn$
begin
  perform public.assert_self_or_owner(p_email);
  if p_title is null or btrim(p_title) = '' then
    return;
  end if;
  update user_pieces
  set    title = btrim(p_title)
  where  id = p_id
    and  lower(email) = lower(p_email);
end;
$fn$;

create or replace function public.touch_custom_piece(p_email text, p_title text, p_composer text default null::text)
returns bigint
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare v_id bigint; v_link bigint; v_libtitle text;
begin
  perform public.assert_self_or_owner(p_email);
  if p_title is null or btrim(p_title) = '' then return null; end if;
  select id, linked_piece_id into v_id, v_link from user_pieces
   where lower(email)=lower(p_email) and lower(btrim(title))=lower(btrim(p_title)) order by id limit 1;
  -- Already merged into a library piece: route this fresh log to the library piece so the
  -- merge stays merged instead of the custom row coming back to life.
  if v_id is not null and v_link is not null then
    select title into v_libtitle from pieces where id = v_link;
    insert into user_collections (email, piece_id, status)
      values (p_email, v_link, 'learning') on conflict (email, piece_id) do nothing;
    update practice_items pi set piece_id = v_link, user_piece_id = null,
           piece_label = coalesce(v_libtitle, pi.piece_label)
      from practice_sessions ps
     where pi.session_id = ps.id and lower(ps.email) = lower(p_email)
       and pi.item_type in ('piece','book') and pi.piece_id is null and pi.user_piece_id is null
       and lower(btrim(pi.piece_label)) = lower(btrim(p_title));
    return v_id;
  end if;
  if v_id is null then
    insert into user_pieces (email, title, composer)
    values (p_email, btrim(p_title), nullif(btrim(coalesce(p_composer,'')),'')) returning id into v_id;
  end if;
  update user_pieces set last_practiced_at = now() where id = v_id;
  if not exists (select 1 from user_collections where lower(email)=lower(p_email) and user_piece_id=v_id) then
    insert into user_collections (email, user_piece_id, status) values (p_email, v_id, 'learning');
  end if;
  update practice_items pi set user_piece_id = v_id
    from practice_sessions ps
   where pi.session_id = ps.id and lower(ps.email) = lower(p_email)
     and pi.item_type in ('piece','book') and pi.piece_id is null and pi.user_piece_id is null
     and lower(btrim(pi.piece_label)) = lower(btrim(p_title));
  return v_id;
end;
$fn$;

create or replace function public.complete_custom_piece(p_email text, p_user_piece_id bigint, p_rating text)
returns smallint
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare v_min numeric := 0; v_hours numeric; v_tier int; v_diff int;
begin
  perform public.assert_self_or_owner(p_email);
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
end;
$fn$;

-- The reply is signed by the token, not by the browser. Today the caller states
-- their own address, their display name and whether they are the owner, so a
-- member can post as "Matthew Cawood" with the owner badge on the public board.
-- Every derived value below reproduces exactly what the two call sites already
-- send for a real user: myEmail, allowed_emails.name with the email-prefix
-- fallback, and isOwner() which is only ever "am I Matthew".
create or replace function public.add_feedback_reply(p_feedback_id uuid, p_email text, p_display_name text, p_body text, p_is_owner boolean)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare
  v_reply  jsonb;
  v_claims json;
  v_role   text;
  v_caller text;
  v_email  text;
  v_name   text;
  v_owner  boolean;
begin
  v_claims := nullif(current_setting('request.jwt.claims', true), '')::json;
  v_role   := coalesce(v_claims ->> 'role', '');

  if v_role in ('authenticated', 'anon') then
    v_caller := lower(coalesce(v_claims ->> 'email', ''));
    if v_caller = '' then
      raise exception 'not authorised' using errcode = '42501';
    end if;
    v_email := v_caller;
    v_owner := (v_caller = 'matthew@matthewcawood.com');
    select nullif(btrim(ae.name), '') into v_name
      from allowed_emails ae where lower(ae.email) = v_caller;
    v_name := coalesce(v_name, split_part(v_caller, '@', 1));
  else
    -- internal caller: nothing to impersonate, keep the arguments
    v_email := p_email;
    v_name  := p_display_name;
    v_owner := coalesce(p_is_owner, false);
  end if;

  v_reply := jsonb_build_object(
    'id',           gen_random_uuid()::text,
    'email',        v_email,
    'display_name', v_name,
    'body',         p_body,
    'is_owner',     v_owner,
    'created_at',   now()::text
  );
  UPDATE feedback
  SET replies = COALESCE(replies,'[]'::jsonb) || jsonb_build_array(v_reply)
  WHERE id = p_feedback_id;
  RETURN v_reply;
end;
$fn$;
