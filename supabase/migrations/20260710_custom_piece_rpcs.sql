-- RPCs for making custom pieces first-class toward roadmap piece objectives.
-- user_pieces is RLS write-locked (owner insert only), so every mutation goes
-- through an owner-scoped SECURITY DEFINER function, matching update_user_piece_title.
-- Status is kept on user_collections (via user_piece_id), consistent with resources.html.

-- Called on session save for each custom (non-library) piece item.
-- Find-or-create the user_pieces row by title, stamp last_practiced_at, and make
-- sure it has a "learning" collection row (never downgrades a completed one).
create or replace function public.touch_custom_piece(
  p_email    text,
  p_title    text,
  p_composer text default null
) returns bigint
language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
  if p_title is null or btrim(p_title) = '' then return null; end if;

  select id into v_id from user_pieces
   where lower(email) = lower(p_email)
     and lower(btrim(title)) = lower(btrim(p_title))
   order by id limit 1;

  if v_id is null then
    insert into user_pieces (email, title, composer)
    values (p_email, btrim(p_title), nullif(btrim(coalesce(p_composer, '')), ''))
    returning id into v_id;
  end if;

  update user_pieces set last_practiced_at = now() where id = v_id;

  if not exists (
    select 1 from user_collections
     where lower(email) = lower(p_email) and user_piece_id = v_id
  ) then
    insert into user_collections (email, user_piece_id, status)
    values (p_email, v_id, 'learning');
  end if;

  return v_id;
end; $$;
grant execute on function public.touch_custom_piece(text, text, text) to authenticated;

-- "Finished it" + difficulty rating: store the tier and mark the collection row completed.
create or replace function public.complete_custom_piece(
  p_email         text,
  p_user_piece_id bigint,
  p_difficulty    smallint
) returns void
language plpgsql security definer set search_path = public as $$
begin
  update user_pieces
     set difficulty = p_difficulty, dormancy_acked_at = now()
   where id = p_user_piece_id and lower(email) = lower(p_email);
  if not found then return; end if;

  if exists (
    select 1 from user_collections
     where lower(email) = lower(p_email) and user_piece_id = p_user_piece_id
  ) then
    update user_collections set status = 'completed'
     where lower(email) = lower(p_email) and user_piece_id = p_user_piece_id;
  else
    insert into user_collections (email, user_piece_id, status)
    values (p_email, p_user_piece_id, 'completed');
  end if;
end; $$;
grant execute on function public.complete_custom_piece(text, bigint, smallint) to authenticated;

-- "Still learning" / card dismissed: acknowledge this dormancy so it goes quiet
-- until the piece is practised again (which moves last_practiced_at past the ack).
create or replace function public.ack_custom_piece(
  p_email text, p_user_piece_id bigint
) returns void
language plpgsql security definer set search_path = public as $$
begin
  update user_pieces set dormancy_acked_at = now()
   where id = p_user_piece_id and lower(email) = lower(p_email);
end; $$;
grant execute on function public.ack_custom_piece(text, bigint) to authenticated;

-- "Not for me": remove it from the collection (and ack so it can't reappear).
create or replace function public.drop_custom_piece(
  p_email text, p_user_piece_id bigint
) returns void
language plpgsql security definer set search_path = public as $$
begin
  update user_pieces set dormancy_acked_at = now()
   where id = p_user_piece_id and lower(email) = lower(p_email);
  delete from user_collections
   where lower(email) = lower(p_email) and user_piece_id = p_user_piece_id;
end; $$;
grant execute on function public.drop_custom_piece(text, bigint) to authenticated;
