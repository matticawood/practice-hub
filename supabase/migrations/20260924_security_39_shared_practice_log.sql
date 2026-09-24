-- A shared practice log, without the sharer's address.
--
-- When somebody shares a practice log to the community, the feed card shows
-- what they practised. Two policies made that work by letting any member read
-- the underlying practice_sessions row and its practice_items - and a session
-- row carries an address, so a member could ask for the addresses of everyone
-- who has ever shared a log. That is 21 of them.
--
-- The card needs the date, the minutes, the notes, the rating and the items. It
-- has never needed the address. These two functions answer exactly that, so the
-- two permissive policies can go and the table goes back to what it should be:
-- your own rows, and Matthew's.
--
-- The visibility rule inside each function is the union of the three policies as
-- they stand today - your own, the owner's, and any session a practice_log post
-- points at - so what a caller can see through them is unchanged, row for row.
-- The item ordering and column list match the page's own query exactly, and the
-- page keeps its paging: a busy feed references more items than one page holds.

create or replace function public.shared_practice_log(p_session_ids bigint[])
returns table (
  id               bigint,
  session_date     date,
  duration_minutes integer,
  notes            text,
  focus_rating     smallint
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select s.id, s.session_date, s.duration_minutes, s.notes, s.focus_rating
  from practice_sessions s
  where s.id = any(p_session_ids)
    and (
      s.email = (select auth.email())
      or (select auth.email()) = 'matthew@matthewcawood.com'
      or exists (select 1 from community_posts p
                 where p.session_id = s.id and p.type = 'practice_log')
    )
$$;

create or replace function public.shared_practice_items(p_session_ids bigint[])
returns table (
  id               bigint,
  session_id       bigint,
  item_type        text,
  piece_label      text,
  label            text,
  duration_minutes integer,
  notes            text,
  sort_order       integer,
  piece_request    boolean,
  theory_slug      text
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select i.id, i.session_id, i.item_type, i.piece_label, i.label,
         i.duration_minutes, i.notes, i.sort_order, i.piece_request, i.theory_slug
  from practice_items i
  join practice_sessions s on s.id = i.session_id
  where i.session_id = any(p_session_ids)
    and (
      s.email = (select auth.email())
      or (select auth.email()) = 'matthew@matthewcawood.com'
      or exists (select 1 from community_posts p
                 where p.session_id = i.session_id and p.type = 'practice_log')
    )
  order by i.session_id, i.sort_order
$$;

revoke all on function public.shared_practice_log(bigint[]) from public, anon;
revoke all on function public.shared_practice_items(bigint[]) from public, anon;
grant execute on function public.shared_practice_log(bigint[]) to authenticated, service_role;
grant execute on function public.shared_practice_items(bigint[]) to authenticated, service_role;

notify pgrst, 'reload schema';
