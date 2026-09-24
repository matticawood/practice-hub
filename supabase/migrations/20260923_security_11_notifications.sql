-- Notifications, third pass: a member cannot sign one with somebody else's name.
--
-- What was left: a member who had genuinely commented could, inside the ten
-- minute window, send a notification whose TITLE said anything, including
-- "Matthew Cawood: your payment failed".
--
-- Every title the client composes for a notification addressed to somebody else
-- begins with the sender's own display name. Checked, all of them:
--   `${myName || "Someone"} …`            15 sites
--   `${auth.name || "Someone"} …`         shared-comments
--   ownerNotifyTitleFn(name) => `${name} commented on …`   5 sources
--   `${posterName} posted new feedback`   posterName = displayName || email prefix
--   `${replierName} replied …`            replierName = displayName || "Someone"
-- and the one self-addressed exception, "You're 1st on the … leaderboard!",
-- which goes to the caller and is exempt below.
--
-- So: a notification to anyone else must be signed by the caller, using the same
-- three forms the client uses - their stored name, their email prefix, or the
-- literal "Someone".

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
  v_name   text;
  v_prefix text;
begin
  v_claims := nullif(current_setting('request.jwt.claims', true), '')::json;
  v_role   := coalesce(v_claims ->> 'role', '');

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

  -- to themselves: their own inbox, nothing to misrepresent
  if lower(new.email) = v_caller then
    return new;
  end if;

  -- to anybody else, including Matthew: it has to be signed by the sender
  select nullif(btrim(ae.name), '') into v_name
    from allowed_emails ae where lower(ae.email) = v_caller;
  v_prefix := split_part(v_caller, '@', 1);
  if new.title is null
     or not (new.title like coalesce(v_name, '') || '%'
             or new.title like v_prefix || '%'
             or new.title like 'Someone%') then
    raise exception 'a notification to someone else has to be signed by you'
      using errcode = '42501';
  end if;

  -- and it has to follow something the sender really did
  if lower(new.email) = 'matthew@matthewcawood.com' then
    return new;
  end if;

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
