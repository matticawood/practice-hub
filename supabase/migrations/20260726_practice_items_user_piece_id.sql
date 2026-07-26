-- Link practice_items to the canonical user_pieces row by ID, not by free-text label.
-- Root cause of the "renaming a custom piece creates a duplicate I can't delete/merge and it
-- skews logged time" report: touch_custom_piece find-or-created by TITLE and the Stats "Active
-- repertoire" card aggregated by piece_label text + joined status by title, while the collection
-- side (user_collections) is already id-based. So a rename desynced historical labels -> a phantom
-- row. Storing the id on each item makes renames propagate everywhere and removes the text matching.
alter table public.practice_items
  add column if not exists user_piece_id bigint references public.user_pieces(id) on delete set null;
create index if not exists practice_items_user_piece_id_idx on public.practice_items(user_piece_id);

-- Backfill: link existing custom piece items to their user_pieces row by (email, title).
-- Run AFTER exact-title duplicate user_pieces are merged (so each title maps to one row).
update public.practice_items pi
   set user_piece_id = up.id
  from public.practice_sessions ps, public.user_pieces up
 where pi.session_id = ps.id
   and pi.item_type in ('piece','book') and pi.piece_id is null and pi.piece_label is not null
   and pi.user_piece_id is null
   and lower(ps.email) = lower(up.email)
   and lower(btrim(pi.piece_label)) = lower(btrim(up.title));

-- Surface the piece id so the Stats "Active repertoire" card can key rows/status by the canonical
-- piece (via practice_items.user_piece_id) instead of the label text, so a rename shows one row.
drop function if exists public.get_custom_piece_statuses(text);
create or replace function public.get_custom_piece_statuses(p_email text)
 returns table(user_piece_id bigint, title text, status text)
 language plpgsql security definer set search_path to 'public'
as $function$
begin
  if lower(coalesce(auth.jwt()->>'email','')) not in (lower(p_email), 'matthew@matthewcawood.com') then
    raise exception 'forbidden';
  end if;
  return query
    select up.id, up.title, uc.status
    from user_pieces up
    left join user_collections uc on uc.user_piece_id = up.id
    where lower(up.email) = lower(p_email);
end $function$;
grant execute on function public.get_custom_piece_statuses(text) to authenticated;

-- touch_custom_piece now also links the member's freshly-logged (still-unlinked) items of this title to
-- the canonical piece id, so future logs are id-linked and renames propagate without recreating duplicates.
create or replace function public.touch_custom_piece(p_email text, p_title text, p_composer text default null)
returns bigint language plpgsql security definer set search_path = public as $func$
declare v_id bigint;
begin
  if p_title is null or btrim(p_title) = '' then return null; end if;
  select id into v_id from user_pieces
   where lower(email)=lower(p_email) and lower(btrim(title))=lower(btrim(p_title)) order by id limit 1;
  if v_id is null then
    insert into user_pieces (email, title, composer)
    values (p_email, btrim(p_title), nullif(btrim(coalesce(p_composer,'')),'')) returning id into v_id;
  end if;
  update user_pieces set last_practiced_at = now() where id = v_id;
  if not exists (select 1 from user_collections where lower(email)=lower(p_email) and user_piece_id=v_id) then
    insert into user_collections (email, user_piece_id, status) values (p_email, v_id, 'learning');
  end if;
  update practice_items pi set user_piece_id = v_id
    from practice_sessions ps
   where pi.session_id = ps.id and lower(ps.email) = lower(p_email)
     and pi.item_type in ('piece','book') and pi.piece_id is null and pi.user_piece_id is null
     and lower(btrim(pi.piece_label)) = lower(btrim(p_title));
  return v_id;
end; $func$;
grant execute on function public.touch_custom_piece(text, text, text) to authenticated;
