-- Make custom<->library piece merges COMPLETE, and auto-absorb exact-title customs.
--
-- Reported by a member (Cécile): she free-typed a piece, then the owner added it to the
-- library and she switched to that, leaving the same piece TWICE in her collection + stats.
-- The existing merge_custom_into_library moved only the collection row, never the
-- practice_items, so the logged minutes stayed on the custom piece and the Stats
-- "Active repertoire" card kept showing the custom leftover (the merge looked half-done).
--
-- Fixes:
--  1. merge_custom_into_library re-points practice_items onto the library piece.
--  2. touch_custom_piece routes a re-logged, already-merged custom title to the library
--     piece (via linked_piece_id) instead of resurrecting the custom row.
--  3. auto_merge_exact_customs(library_piece_id) folds every member's EXACT-title custom
--     into a newly-published library piece (called from piece-studio on publish/add).

-- 1 ── complete merge: also carry the practice history ────────────────────────────────
create or replace function public.merge_custom_into_library(p_user_piece_id bigint, p_library_piece_id bigint)
returns text language plpgsql security definer set search_path to 'public' as $function$
declare v_email text; v_cust text; v_lib text; cr int; lr int; v_final text; v_created timestamptz; v_libtitle text;
begin
  if lower(coalesce(auth.jwt()->>'email','')) <> 'matthew@matthewcawood.com' then
    raise exception 'forbidden';
  end if;
  select email into v_email from user_pieces where id = p_user_piece_id;
  if v_email is null then return 'no-such-piece'; end if;
  select title into v_libtitle from pieces where id = p_library_piece_id;
  select uc.status, uc.created_at into v_cust, v_created
    from user_collections uc where uc.user_piece_id = p_user_piece_id limit 1;
  update user_pieces set linked_piece_id = p_library_piece_id where id = p_user_piece_id;
  -- Carry the practice items onto the library piece so minutes/stats follow the merge.
  update practice_items pi
     set piece_id = p_library_piece_id, user_piece_id = null,
         piece_label = coalesce(v_libtitle, pi.piece_label)
   where pi.user_piece_id = p_user_piece_id;
  -- Merge the collection row: keep the stronger status and the earlier add date.
  select status into v_lib from user_collections
    where lower(email)=lower(v_email) and piece_id = p_library_piece_id limit 1;
  cr := case v_cust when 'completed' then 3 when 'learning' then 2 when 'aspire' then 1 else 0 end;
  lr := case v_lib  when 'completed' then 3 when 'learning' then 2 when 'aspire' then 1 else 0 end;
  v_final := case when cr >= lr then coalesce(v_cust,'learning') else coalesce(v_lib,'learning') end;
  insert into user_collections (email, piece_id, status, created_at)
    values (v_email, p_library_piece_id, v_final, coalesce(v_created, now()))
    on conflict (email, piece_id) do update
      set status = excluded.status,
          created_at = least(user_collections.created_at, excluded.created_at);
  delete from user_collections where user_piece_id = p_user_piece_id and lower(email)=lower(v_email);
  return v_final;
end $function$;

-- 2 ── touch_custom_piece: keep a merged title routed to its library piece ──────────────
create or replace function public.touch_custom_piece(p_email text, p_title text, p_composer text default null)
returns bigint language plpgsql security definer set search_path to 'public' as $function$
declare v_id bigint; v_link bigint; v_libtitle text;
begin
  if p_title is null or btrim(p_title) = '' then return null; end if;
  select id, linked_piece_id into v_id, v_link from user_pieces
   where lower(email)=lower(p_email) and lower(btrim(title))=lower(btrim(p_title)) order by id limit 1;
  -- Already merged into a library piece: route this fresh log to the library piece so the
  -- merge stays merged instead of the custom row coming back to life.
  if v_id is not null and v_link is not null then
    select title into v_libtitle from pieces where id = v_link;
    insert into user_collections (email, piece_id, status)
      values (p_email, v_link, 'learning') on conflict (email, piece_id) do nothing;
    update practice_items pi set piece_id = v_link, user_piece_id = null,
           piece_label = coalesce(v_libtitle, pi.piece_label)
      from practice_sessions ps
     where pi.session_id = ps.id and lower(ps.email) = lower(p_email)
       and pi.item_type in ('piece','book') and pi.piece_id is null and pi.user_piece_id is null
       and lower(btrim(pi.piece_label)) = lower(btrim(p_title));
    return v_id;
  end if;
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
end $function$;

-- 3 ── auto-absorb exact-title customs when a library piece is added/published ──────────
create or replace function public.auto_merge_exact_customs(p_library_piece_id bigint)
returns integer language plpgsql security definer set search_path to 'public' as $function$
declare v_title text; r record; n int := 0;
begin
  if lower(coalesce(auth.jwt()->>'email','')) <> 'matthew@matthewcawood.com' then
    raise exception 'forbidden';
  end if;
  select title into v_title from pieces where id = p_library_piece_id;
  if v_title is null or btrim(v_title) = '' then return 0; end if;
  -- Exact (case/space-insensitive) title match only; fuzzy matches are left for merge-studio review.
  for r in select id from user_pieces
             where linked_piece_id is null
               and lower(btrim(title)) = lower(btrim(v_title)) loop
    perform merge_custom_into_library(r.id, p_library_piece_id);
    n := n + 1;
  end loop;
  return n;
end $function$;

grant execute on function public.merge_custom_into_library(bigint, bigint) to authenticated;
grant execute on function public.touch_custom_piece(text, text, text) to authenticated;
grant execute on function public.auto_merge_exact_customs(bigint) to authenticated;
