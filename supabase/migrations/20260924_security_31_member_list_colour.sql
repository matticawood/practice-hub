begin;

-- The chat picker draws the same initials circle the rest of the app does, and
-- its colour comes from hashing the address. The list carries no addresses, so
-- it carries the index the server computed with the page's own hash instead.
drop function if exists public.member_list();
create function public.member_list()
returns table(member_key uuid, name text, headline text, location text, instrument text,
              avatar_url text, badge text, bio text, website text,
              instagram text, twitter text, youtube text, pal integer, hue integer)
language sql stable security definer set search_path to 'public'
as $fn$
  select mi.member_key, ae.name, ae.headline, ae.location, ae.instrument,
         ae.avatar_url, ae.badge, ae.bio, ae.website,
         ae.instagram, ae.twitter, ae.youtube,
         public.avatar_palette_index(mi.email), public.avatar_hue(mi.email)
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
