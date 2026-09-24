-- One identity per person who has ever appeared in the room.
--
-- allowed_emails is the MEMBERSHIP list: people leave it when they cancel. But
-- their posts, comments and reactions stay, and the app still has to draw a name
-- against them. Today it falls back to the email prefix, which is both a worse
-- label and the very thing being taken off the wire, so the identity table
-- covers current and former members alike.
--
-- Current members keep the member_key they already have, so nothing already
-- stamped has to change. Former members get one, with the last name they used
-- in the room, recovered from their own posts, comments or chat messages.
--
-- email lives here for joining inside the database. It is never exposed: the
-- directory function selects the key, the name and the avatar only.

create table if not exists public.member_identities (
  member_key uuid primary key,
  email      text not null unique,
  name       text,
  avatar_url text,
  is_member  boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.member_identities enable row level security;
revoke all on public.member_identities from anon, authenticated;

-- current members, reusing the keys already stamped onto reactions
insert into public.member_identities (member_key, email, name, avatar_url, is_member)
select ae.member_key, lower(ae.email), ae.name, ae.avatar_url, true
from public.allowed_emails ae
on conflict (email) do update
  set name = excluded.name, avatar_url = excluded.avatar_url,
      is_member = true, updated_at = now();

-- everyone else who has ever authored anything, with their last used name
with authors as (
  select lower(email) as email, name, created_at from public.community_posts        where email is not null
  union all
  select lower(email), name, created_at from public.community_post_comments         where email is not null
  union all
  select lower(email), name, created_at from public.community_messages              where email is not null
  union all
  select lower(email), name, created_at from public.activity_comments               where email is not null
  union all
  select lower(email), name, created_at from public.event_comments                  where email is not null
  union all
  select lower(email), name, created_at from public.content_feed_comments           where email is not null
  union all
  select lower(email), name, created_at from public.weekly_focus_comments           where email is not null
  union all
  select lower(email), name, created_at from public.practice_room_update_comments   where email is not null
  union all
  select lower(email), name, created_at from public.event_chat                      where email is not null
  union all
  select lower(email), name, created_at from public.event_qa                        where email is not null
),
ranked as (
  select email, name,
         row_number() over (partition by email order by (name is null), created_at desc) as rn
  from authors
)
insert into public.member_identities (member_key, email, name, avatar_url, is_member)
select gen_random_uuid(), r.email,
       -- the email prefix is what the UI shows for these people today, so it is
       -- the fallback when no name was ever recorded: nothing changes on screen
       coalesce(nullif(btrim(r.name), ''), split_part(r.email, '@', 1)),
       null, false
from ranked r
where r.rn = 1
  and not exists (select 1 from public.member_identities mi where mi.email = r.email)
on conflict (email) do nothing;

-- keep it current as members join, rename or change their avatar
create or replace function public.sync_member_identity()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $fn$
begin
  insert into member_identities (member_key, email, name, avatar_url, is_member)
  values (new.member_key, lower(new.email), new.name, new.avatar_url, true)
  on conflict (email) do update
    set name = excluded.name, avatar_url = excluded.avatar_url,
        is_member = true, updated_at = now();
  return new;
end;
$fn$;

drop trigger if exists allowed_emails_identity_trg on public.allowed_emails;
create trigger allowed_emails_identity_trg
  after insert or update of name, avatar_url, member_key on public.allowed_emails
  for each row execute function public.sync_member_identity();

-- the key stamper now resolves anybody, member or not
create or replace function public.stamp_member_key()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $fn$
begin
  if new.member_key is null and new.email is not null then
    select mi.member_key into new.member_key
      from member_identities mi where mi.email = lower(new.email);
  end if;
  return new;
end;
$fn$;

-- and the directory answers for everyone who can appear on screen
create or replace function public.member_directory()
returns table(member_key uuid, name text, avatar_url text, badge text, headline text)
language sql
stable
security definer
set search_path to 'public'
as $fn$
  select mi.member_key, mi.name, mi.avatar_url, ae.badge, ae.headline
  from member_identities mi
  left join allowed_emails ae on lower(ae.email) = mi.email;
$fn$;

revoke all on function public.member_directory() from public, anon;
grant execute on function public.member_directory() to authenticated;
