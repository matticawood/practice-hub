begin;

-- The members grid, as the page actually draws it: a picture, a name, a badge,
-- a headline, a location, an instrument and the links people chose to publish.
-- No address, because the grid never shows one.
--
-- The filtering that the page did for itself moves here, unchanged: current and
-- onboarded, has a name, not the reviewer badge, and not the three system
-- accounts.
create or replace function public.member_list()
returns table(member_key uuid, name text, headline text, location text, instrument text,
              avatar_url text, badge text, bio text, website text,
              instagram text, twitter text, youtube text)
language sql stable security definer set search_path to 'public'
as $fn$
  select mi.member_key, ae.name, ae.headline, ae.location, ae.instrument,
         ae.avatar_url, ae.badge, ae.bio, ae.website,
         ae.instagram, ae.twitter, ae.youtube
  from allowed_emails ae
  join member_identities mi on mi.email = lower(ae.email)
  where ae.subscription_status = 'active'
    and ae.onboarded = true
    and nullif(btrim(ae.name), '') is not null
    and lower(btrim(coalesce(ae.badge, ''))) <> 'reviewer'
    and lower(ae.email) not in ('mcawoodcanada@gmail.com',
                                'reviewer@matthewcawood.com',
                                'enquiries@matthewcawood.com')
  order by ae.name asc
$fn$;

revoke all on function public.member_list() from public, anon;
grant execute on function public.member_list() to authenticated, service_role;

commit;
