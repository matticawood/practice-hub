-- Paging that actually moves.
--
-- An answer from a function is capped at 1000 rows, the same as any other, and
-- the feed has to page because a busy feed references more shared items than
-- that: there are 3,023 of them today. The page's existing loop asked for the
-- next thousand with a Range header, which is what it used against the table.
-- Measured against the function, a Range header does not advance at all - rows
-- 0-999 and rows 1000-1999 came back as the same thousand - so the loop would
-- have collected the first page over and over and never reached the rest.
--
-- So the function takes the offset and the limit itself, which does advance
-- (measured: offset 0 and offset 1000 return different rows). The ordering gains
-- the row id as a tiebreak, because sort_order is not unique within a session
-- and paging over a non-deterministic order can repeat a row on one page and
-- miss it on the next.
--
-- Nothing else changes: same visibility rule, same columns, same order.

drop function if exists public.shared_practice_items(bigint[]);

create function public.shared_practice_items(
  p_session_ids bigint[],
  p_offset      integer default 0,
  p_limit       integer default 1000
)
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
  order by i.session_id, i.sort_order, i.id
  offset greatest(coalesce(p_offset, 0), 0)
  limit least(greatest(coalesce(p_limit, 1000), 1), 1000)
$$;

revoke all on function public.shared_practice_items(bigint[], integer, integer) from public, anon;
grant execute on function public.shared_practice_items(bigint[], integer, integer) to authenticated, service_role;

notify pgrst, 'reload schema';
