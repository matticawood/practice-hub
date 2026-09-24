-- Notifications, second pass: a member cannot write one out of thin air.
--
-- The first pass stamped the sender, restricted the link and capped the rate,
-- but still let a console put an arbitrary item in anyone's inbox. This closes
-- that by requiring the notification to correspond to something the caller
-- actually did.
--
-- Read every one of the 35 inserts in the client first. Members only ever
-- notify three kinds of recipient:
--   themselves          achievements, milestones they earned
--   Matthew             milestone alerts, RSVPs, feedback
--   the author of the thing they just acted on
--                       every one of these follows the comment, reply,
--                       reaction or RSVP by seconds, in the same function
--
-- So a notification to a third party has to be backed by a real interaction by
-- that caller, in the last ten minutes. The app always has one. A console with
-- nothing behind it does not, and is refused.
--
-- Deliberately generous at ten minutes: the point is to require that the action
-- HAPPENED, not to race the member's own network.

create or replace function public.notifications_guard()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $fn$
declare
  v_claims json;
  v_role   text;
  v_caller text;
  v_host   text;
  v_recent int;
  v_since  timestamptz := now() - interval '10 minutes';
  v_acted  boolean;
begin
  v_claims := nullif(current_setting('request.jwt.claims', true), '')::json;
  v_role   := coalesce(v_claims ->> 'role', '');

  -- cron, service_role, psql: not an end-user call
  if v_role not in ('authenticated', 'anon') then
    return new;
  end if;

  v_caller := lower(coalesce(v_claims ->> 'email', ''));
  if v_caller = '' then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  new.metadata := coalesce(new.metadata, '{}'::jsonb) || jsonb_build_object('actor', v_caller);

  if new.link_url is not null and new.link_url ~ '^[a-zA-Z]+://' then
    v_host := lower(split_part(split_part(new.link_url, '://', 2), '/', 1));
    if v_host not in ('app.matthewcawood.com', 'matthewcawood.com', 'www.matthewcawood.com',
                      'play.google.com', 'apps.apple.com') then
      raise exception 'notification link host not allowed: %', v_host using errcode = '42501';
    end if;
  end if;

  -- the owner may write to anyone: he broadcasts to the whole room
  if v_caller = 'matthew@matthewcawood.com' then
    return new;
  end if;

  select count(*) into v_recent
  from notifications
  where created_at > now() - interval '1 minute'
    and metadata ->> 'actor' = v_caller;
  if v_recent >= 25 then
    raise exception 'too many notifications at once' using errcode = '42901';
  end if;

  -- to themselves, or to Matthew: always allowed
  if lower(new.email) = v_caller or lower(new.email) = 'matthew@matthewcawood.com' then
    return new;
  end if;

  -- to anybody else: only off the back of something they really did
  select exists (
    select 1 from community_post_comments        where lower(email) = v_caller and created_at > v_since
    union all
    select 1 from content_feed_comments          where lower(email) = v_caller and created_at > v_since
    union all
    select 1 from event_comments                 where lower(email) = v_caller and created_at > v_since
    union all
    select 1 from activity_comments              where lower(email) = v_caller and created_at > v_since
    union all
    select 1 from weekly_focus_comments          where lower(email) = v_caller and created_at > v_since
    union all
    select 1 from practice_room_update_comments  where lower(email) = v_caller and created_at > v_since
    union all
    select 1 from activity_reactions             where lower(email) = v_caller and created_at > v_since
    union all
    select 1 from community_post_likes           where lower(email) = v_caller and created_at > v_since
    union all
    select 1 from event_rsvps                    where lower(email) = v_caller and created_at > v_since
    union all
    select 1 from feedback                       where lower(email) = v_caller and created_at > v_since
    union all
    select 1 from community_messages             where lower(email) = v_caller and created_at > v_since
    union all
    select 1 from event_chat                     where lower(email) = v_caller and created_at > v_since
    union all
    select 1 from event_qa                       where lower(email) = v_caller and created_at > v_since
  ) into v_acted;

  if not v_acted then
    raise exception 'a notification to another member has to follow something you did'
      using errcode = '42501';
  end if;

  return new;
end;
$fn$;
