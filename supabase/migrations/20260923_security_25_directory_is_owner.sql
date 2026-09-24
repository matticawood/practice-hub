begin;

-- Pages that show the owner's name and picture (the content feed cards) found
-- him by looking his address up in the membership table. The directory can say
-- which entry is his without anyone needing to know where he lives.
drop function if exists public.member_directory();
create function public.member_directory()
returns table(member_key uuid, name text, avatar_url text, badge text, headline text,
              hue integer, pal integer, mentionable boolean, is_owner boolean)
language sql stable security definer set search_path to 'public'
as $function$
      select mi.member_key, mi.name, mi.avatar_url, ae.badge, ae.headline,
             public.avatar_hue(mi.email), public.avatar_palette_index(mi.email),
             (mi.is_member
              and nullif(btrim(mi.name), '') is not null
              and mi.email not in ('reviewer@matthewcawood.com',
                                   'enquiries@matthewcawood.com',
                                   'mcawoodcanada@gmail.com')) as mentionable,
             (mi.email = 'matthew@matthewcawood.com') as is_owner
      from member_identities mi
      left join allowed_emails ae on lower(ae.email) = mi.email
    $function$;

revoke all on function public.member_directory() from public, anon;
grant execute on function public.member_directory() to authenticated, service_role;

commit;
