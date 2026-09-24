-- Let a notification be addressed by member_key instead of by email address.
--
-- Commenting on someone's post notifies them, and the browser does that by
-- putting their EMAIL in the row. So as long as notifications need an address,
-- every post in the feed has to carry one, and none of the rest can be hidden.
--
-- The recipient column stays `email`, because everything that reads an inbox
-- reads it that way. What changes is that the browser may supply a key instead
-- and the server resolves it, so the address never has to reach the page.
--
-- Resolution happens INSIDE the existing guard rather than in a second trigger,
-- so there is no question about which fires first: the guard's own rules about
-- who may be written to, and whose name may be on it, then run against the
-- resolved address exactly as before.

alter table public.notifications add column if not exists to_member_key uuid;

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
  -- addressed by key: resolve it before anything else looks at the recipient
  if new.to_member_key is not null and coalesce(new.email, '') = '' then
    select mi.email into new.email
      from member_identities mi where mi.member_key = new.to_member_key;
    if new.email is null then
      raise exception 'unknown recipient' using errcode = '42501';
    end if;
  end if;

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

  if lower(new.email) = v_caller then
    return new;
  end if;

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

-- the insert policy checks the recipient column, which is still `email`
notify pgrst, 'reload schema';
