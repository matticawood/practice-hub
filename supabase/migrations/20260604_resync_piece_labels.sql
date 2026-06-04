-- ================================================================
-- resync_piece_labels()  — Generated 2026-06-04
--
-- After the library Enrich job (or a single-piece title/composer edit)
-- changes a piece's title or composer, the denormalized title snapshots
-- cached elsewhere go stale. The underlying links are by piece_id and are
-- unaffected; this only refreshes the cached *display text* so historical
-- practice logs and goals show the corrected title.
--
-- Caches refreshed:
--   * practice_items.label  -> canonical "Title — Composer" (or "Title")
--       (matches 20260522_fix_piece_item_labels.sql exactly; the app parses
--        this label by ' — ', so the em-dash separator MUST be preserved)
--   * piece_goals.piece_label -> canonical "Title"
--
-- SECURITY DEFINER so the owner can refresh every user's cached labels;
-- guarded so only the owner can execute it. Idempotent (IS DISTINCT FROM).
-- ================================================================

create or replace function public.resync_piece_labels()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_items integer := 0;
  v_goals integer := 0;
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'matthew@matthewcawood.com' then
    raise exception 'not authorised';
  end if;

  update practice_items pi
  set    label = case
                   when p.composer is not null and p.composer <> ''
                     then p.title || ' — ' || p.composer
                   else p.title
                 end
  from   pieces p
  where  pi.piece_id  = p.id
    and  pi.item_type = 'piece'
    and  pi.label is distinct from (
           case
             when p.composer is not null and p.composer <> ''
               then p.title || ' — ' || p.composer
             else p.title
           end
         );
  get diagnostics v_items = row_count;

  update piece_goals g
  set    piece_label = p.title
  from   pieces p
  where  g.piece_id = p.id
    and  g.piece_label is distinct from p.title;
  get diagnostics v_goals = row_count;

  return v_items + v_goals;
end;
$$;

grant execute on function public.resync_piece_labels() to authenticated;
