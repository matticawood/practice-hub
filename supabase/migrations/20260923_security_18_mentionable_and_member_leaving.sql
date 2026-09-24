begin;

-- A member leaving has to leave the directory's member flag behind too.
-- The @-mention list reads allowed_emails today, so someone removed from it
-- disappears from autocomplete at once. Once the list is served from
-- member_identities that only stays true if a delete clears the flag.
create or replace function public.unsync_member_identity()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $fn$
begin
  update member_identities
     set is_member = false, updated_at = now()
   where email = lower(old.email);
  return old;
end;
$fn$;

drop trigger if exists allowed_emails_identity_del_trg on public.allowed_emails;
create trigger allowed_emails_identity_del_trg
after delete on public.allowed_emails
for each row execute function public.unsync_member_identity();

-- `mentionable` is the @-mention list, decided on the server so the page no
-- longer needs addresses to work out who is taggable. It reproduces exactly
-- what the page does today: a current member, who has a name, excluding the
-- system and reviewer accounts.
drop function if exists public.member_directory();
create function public.member_directory()
returns table(member_key uuid, name text, avatar_url text, badge text, headline text,
              hue integer, pal integer, mentionable boolean)
language sql stable security definer set search_path to 'public'
as $function$
      select mi.member_key, mi.name, mi.avatar_url, ae.badge, ae.headline,
             public.avatar_hue(mi.email), public.avatar_palette_index(mi.email),
             (mi.is_member
              and nullif(btrim(mi.name), '') is not null
              and mi.email not in ('reviewer@matthewcawood.com',
                                   'enquiries@matthewcawood.com',
                                   'mcawoodcanada@gmail.com')) as mentionable
      from member_identities mi
      left join allowed_emails ae on lower(ae.email) = mi.email
    $function$;

revoke all on function public.member_directory() from public, anon;
grant execute on function public.member_directory() to authenticated, service_role;

commit;
