-- Notifications: a member can write into anybody's inbox.
--
-- That is by design and cannot simply be revoked: commenting on your post has to
-- put a notification in YOUR inbox, and 30 places in the client do exactly that.
-- So the row is policed on arrival instead, by a trigger, which means no call
-- site changes and no way around it from a console either.
--
-- Three rules, each measured against the 15,035 existing rows first:
--
--   actor stamped   there is no sender column, so who caused a notification was
--                   unknowable. Now recorded in metadata.actor.
--   link allowed    734 rows carry an absolute URL, across exactly three hosts:
--                   app.matthewcawood.com (245), play.google.com (60),
--                   apps.apple.com (56). Anything else is refused, which stops
--                   an inbox item pointing somewhere it should not.
--   rate limited    a member's real actions produce one or two at a time. The
--                   owner broadcasts to the whole room, so he is exempt, as are
--                   cron and service_role.
--
-- What this deliberately does NOT do: restrict the type. member_milestone and
-- achievement are genuinely raised by members from the tools and practice log,
-- so a type allowlist would break real behaviour. The actor stamp is what makes
-- a misleading one traceable.

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
begin
  v_claims := nullif(current_setting('request.jwt.claims', true), '')::json;
  v_role   := coalesce(v_claims ->> 'role', '');

  -- cron, service_role, psql: not an end-user call, left alone
  if v_role not in ('authenticated', 'anon') then
    return new;
  end if;

  v_caller := lower(coalesce(v_claims ->> 'email', ''));
  if v_caller = '' then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  -- who caused this, recorded whatever the title claims
  new.metadata := coalesce(new.metadata, '{}'::jsonb) || jsonb_build_object('actor', v_caller);

  -- an inbox item may only point at this app or its two store listings
  if new.link_url is not null and new.link_url ~ '^[a-zA-Z]+://' then
    v_host := lower(split_part(split_part(new.link_url, '://', 2), '/', 1));
    if v_host not in ('app.matthewcawood.com', 'matthewcawood.com', 'www.matthewcawood.com',
                      'play.google.com', 'apps.apple.com') then
      raise exception 'notification link host not allowed: %', v_host using errcode = '42501';
    end if;
  end if;

  -- the owner broadcasts to everyone; a member does not
  if v_caller <> 'matthew@matthewcawood.com' then
    select count(*) into v_recent
    from notifications
    where created_at > now() - interval '1 minute'
      and metadata ->> 'actor' = v_caller;
    if v_recent >= 25 then
      raise exception 'too many notifications at once' using errcode = '42901';
    end if;
  end if;

  return new;
end;
$fn$;

drop trigger if exists notifications_guard_trg on public.notifications;
create trigger notifications_guard_trg
  before insert on public.notifications
  for each row execute function public.notifications_guard();
