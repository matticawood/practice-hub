begin;

-- Append the palette index to the two directory functions. A page that hashes
-- the address into a palette of eight can now get the same index from the
-- server, so its avatars keep exactly the colours they have always had.
-- Existing columns and their order are unchanged, so every current caller,
-- which reads by name, is unaffected.

drop function if exists public.member_directory();
create function public.member_directory()
returns table(member_key uuid, name text, avatar_url text, badge text, headline text, hue integer, pal integer)
language sql stable security definer set search_path to 'public'
as $function$
      select mi.member_key, mi.name, mi.avatar_url, ae.badge, ae.headline,
             public.avatar_hue(mi.email), public.avatar_palette_index(mi.email)
      from member_identities mi
      left join allowed_emails ae on lower(ae.email) = mi.email
    $function$;

drop function if exists public.member_profile(uuid);
create function public.member_profile(p_member_key uuid)
returns table(member_key uuid, name text, avatar_url text, badge text, headline text,
              location text, instrument text, bio text, website text,
              instagram text, twitter text, youtube text, hue integer, pal integer)
language sql stable security definer set search_path to 'public'
as $function$
      select mi.member_key, mi.name, mi.avatar_url, ae.badge, ae.headline,
             ae.location, ae.instrument, ae.bio, ae.website,
             ae.instagram, ae.twitter, ae.youtube,
             public.avatar_hue(mi.email), public.avatar_palette_index(mi.email)
      from member_identities mi
      left join allowed_emails ae on lower(ae.email) = mi.email
      where mi.member_key = p_member_key;
    $function$;

-- the same grants the originals had: no PUBLIC, no anon
revoke all on function public.member_directory() from public, anon;
revoke all on function public.member_profile(uuid) from public, anon;
grant execute on function public.member_directory() to authenticated, service_role;
grant execute on function public.member_profile(uuid) to authenticated, service_role;

-- avatar_palette_index is read through those functions only
revoke all on function public.avatar_palette_index(text) from public, anon;
grant execute on function public.avatar_palette_index(text) to authenticated, service_role;

commit;
