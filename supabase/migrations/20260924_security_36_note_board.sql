-- The note-reading board, without handing out addresses.
--
-- tools.html read the note_game_leaderboard view directly. That view is
-- security_invoker, so once note_game_scores was restricted to a member's own
-- rows the board went empty for everyone. This puts the board back exactly as
-- it was, as a function that answers the same question and returns the member's
-- key in place of their address.
--
-- The body reproduces the view: the best row per player per board variant
-- (range, clef, accidentals, key signature), ordered by score, capped at 500 -
-- the same cap the page already applied. Deduplicating by member_key rather
-- than lower(email) is the same grouping: all 5157 rows carry a key and the
-- 102 distinct addresses are 102 distinct keys.

create or replace function public.note_board(
  p_range         text,
  p_key_signature text    default null,
  p_clef          text    default null,
  p_accidentals   boolean default null
)
returns table (
  member_key    uuid,
  name          text,
  score         integer,
  clef          text,
  accidentals   boolean,
  key_signature text,
  range         text,
  attempts      integer,
  created_at    timestamptz
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select b.member_key, b.name, b.score, b.clef, b.accidentals,
         b.key_signature, b.range, b.attempts, b.created_at
  from (
    select distinct on (s.member_key, s.clef, s.accidentals, s.key_signature, s.range)
           s.member_key, s.name, s.score, s.clef, s.accidentals,
           s.key_signature, s.range, s.attempts, s.created_at
    from note_game_scores s
    where s.range = p_range
      and (case when p_key_signature is null
                then s.key_signature is null
                else s.key_signature = p_key_signature end)
      and (p_clef        is null or s.clef        = p_clef)
      and (p_accidentals is null or s.accidentals = p_accidentals)
    order by s.member_key, s.clef, s.accidentals, s.key_signature, s.range,
             s.score desc, s.created_at desc
  ) b
  order by b.score desc
  limit 500
$$;

revoke all on function public.note_board(text, text, text, boolean) from public, anon;
grant execute on function public.note_board(text, text, text, boolean) to authenticated, service_role;

notify pgrst, 'reload schema';
