begin;

-- The leaderboards are the easiest place to enumerate everyone, because a score
-- row carries the address of whoever set it. These five get the same key the
-- other eighteen tables already carry, filled in the same way, so the boards can
-- name a player without publishing where they live.
do $$
declare t text;
begin
  foreach t in array array['note_game_scores','interval_game_scores','ear_game_scores',
                           'chord_game_scores','practice_sessions']
  loop
    execute format('alter table public.%I add column if not exists member_key uuid', t);
    execute format('update public.%I x set member_key = mi.member_key
                      from public.member_identities mi
                     where mi.email = lower(x.email) and x.member_key is null', t);
    execute format('create index if not exists %I on public.%I (member_key)', t || '_member_key_idx', t);
    execute format('drop trigger if exists %I on public.%I', t || '_member_key_trg', t);
    execute format('create trigger %I before insert or update of email on public.%I
                    for each row execute function public.stamp_member_key()', t || '_member_key_trg', t);
  end loop;
end $$;

commit;
