-- Fix: editing a piece/reading goal's target date (or hours) never persisted.
-- Root cause: piece_goals is locked down by RLS, and create/read/delete all go
-- through SECURITY DEFINER RPCs (upsert_piece_goal / get_piece_goals /
-- delete_piece_goal), but the inline EDIT wrote directly to the table
-- (db.from("piece_goals").update(...)). With no UPDATE policy that write matched
-- zero rows and returned no error, so the change showed in-session (local cache)
-- but reverted on reload. This adds the missing owner-scoped update RPC, mirroring
-- delete_piece_goal's (p_id, p_email) shape so it also works for admin edits.

create or replace function public.update_piece_goal(
  p_id           bigint,
  p_email        text,
  p_target_date  date    default null,
  p_target_hours numeric default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update piece_goals
  set    target_date  = coalesce(p_target_date,  target_date),
         target_hours = coalesce(p_target_hours, target_hours)
  where  id = p_id
    and  lower(email) = lower(p_email);
end;
$$;

grant execute on function public.update_piece_goal(bigint, text, date, numeric) to authenticated;
