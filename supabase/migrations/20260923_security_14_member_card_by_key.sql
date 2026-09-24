-- Everything the member card shows, addressed by key instead of by email.
--
-- The card is opened by clicking any avatar in the app, and today that avatar
-- carries the person's email in a data attribute. Until the card can be opened
-- by key, no surface can stop emitting the address.
--
-- These return exactly the fields the card already renders, and nothing else.
-- No email is returned by any of them. What a member can see through these is
-- what the card has always shown them.

-- the profile block: name, avatar, badge, headline, location, instrument, bio, links
create or replace function public.member_profile(p_member_key uuid)
returns table(
  member_key uuid, name text, avatar_url text, badge text, headline text,
  location text, instrument text, bio text, website text,
  instagram text, twitter text, youtube text
)
language sql stable security definer set search_path to 'public'
as $fn$
  select mi.member_key, mi.name, mi.avatar_url, ae.badge, ae.headline,
         ae.location, ae.instrument, ae.bio, ae.website,
         ae.instagram, ae.twitter, ae.youtube
  from member_identities mi
  left join allowed_emails ae on lower(ae.email) = mi.email
  where mi.member_key = p_member_key;
$fn$;

-- the three numbers on the card, computed server side so no per-member table
-- reads are needed from the browser
create or replace function public.member_card_stats(p_member_key uuid)
returns table(total_minutes bigint, pieces_count bigint, achievements_count bigint)
language sql stable security definer set search_path to 'public'
as $fn$
  with who as (select email from member_identities where member_key = p_member_key)
  select
    (select coalesce(sum(ps.duration_minutes), 0)::bigint
       from practice_sessions ps, who where lower(ps.email) = who.email),
    (select (
        (select count(*) from user_collections uc, who
          where lower(uc.email) = who.email and uc.status in ('learning','completed') and uc.user_piece_id is null)
      + (select count(*) from user_pieces up, who where lower(up.email) = who.email)
     )::bigint),
    (select count(*)::bigint from achievement_events ae, who where lower(ae.email) = who.email);
$fn$;

-- the per-day minutes behind the streak, and the recent activity list
create or replace function public.member_card_days(p_member_key uuid)
returns table(session_date date, duration_minutes integer)
language sql stable security definer set search_path to 'public'
as $fn$
  select ps.session_date, ps.duration_minutes
  from practice_sessions ps
  join member_identities mi on mi.member_key = p_member_key
  where lower(ps.email) = mi.email;
$fn$;

create or replace function public.member_card_recent(p_member_key uuid, p_offset integer, p_limit integer)
returns table(id bigint, session_date date, duration_minutes integer)
language sql stable security definer set search_path to 'public'
as $fn$
  select ps.id, ps.session_date, ps.duration_minutes
  from practice_sessions ps
  join member_identities mi on mi.member_key = p_member_key
  where lower(ps.email) = mi.email
  order by ps.session_date desc
  offset greatest(p_offset, 0)
  limit least(greatest(p_limit, 0), 200);
$fn$;

-- the streak, same numbers the card shows today
create or replace function public.member_card_streak(p_member_key uuid)
returns table(current_streak integer, best_streak integer)
language sql stable security definer set search_path to 'public'
as $fn$
  select s.current_streak, s.best_streak
  from member_identities mi
  cross join lateral public.get_member_streak(mi.email) s
  where mi.member_key = p_member_key;
$fn$;

-- the "now learning" preview
create or replace function public.member_card_learning(p_member_key uuid)
returns table(created_at timestamptz, title text, composer text)
language sql stable security definer set search_path to 'public'
as $fn$
  select uc.created_at,
         coalesce(p.title, up.title)       as title,
         coalesce(p.composer, up.composer) as composer
  from user_collections uc
  join member_identities mi on mi.member_key = p_member_key
  left join pieces p       on p.id = uc.piece_id
  left join user_pieces up on up.id = uc.user_piece_id
  where lower(uc.email) = mi.email and uc.status = 'learning'
  order by uc.created_at desc
  limit 4;
$fn$;

do $$
declare f text;
begin
  foreach f in array array[
    'member_profile(uuid)', 'member_card_stats(uuid)', 'member_card_days(uuid)',
    'member_card_recent(uuid, integer, integer)', 'member_card_streak(uuid)',
    'member_card_learning(uuid)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
