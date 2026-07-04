-- Let members rename their own custom "My Collection" pieces (user_pieces.title).
-- user_pieces is RLS-locked for writes beyond the owner insert used when adding a
-- custom piece; there is no UPDATE path, so an in-place rename from the client would
-- silently match zero rows (same failure mode as the piece_goals date edit). This
-- adds an owner-scoped SECURITY DEFINER rename RPC the client can call.

create or replace function public.update_user_piece_title(
  p_id    bigint,
  p_email text,
  p_title text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_title is null or btrim(p_title) = '' then
    return;
  end if;
  update user_pieces
  set    title = btrim(p_title)
  where  id = p_id
    and  lower(email) = lower(p_email);
end;
$$;

grant execute on function public.update_user_piece_title(bigint, text, text) to authenticated;
