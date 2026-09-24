begin;

-- The chord and ear boards, which the tools page drew by reading the score
-- table itself. Once a member can only see their own scores, the page cannot
-- build these, so they are served here instead. The filtering, ordering and
-- 500-row limit are exactly what the page asked for, so the same rows come
-- back; only the address is gone, replaced by the key the page already draws
-- with.
create or replace function public.chord_board(p_tier integer, p_clef text, p_mode text, p_key_signature text default null)
returns table(member_key uuid, name text, score integer, attempts integer)
language sql stable security definer set search_path to 'public'
as $fn$
  select s.member_key, s.name, s.score, s.attempts
  from chord_game_scores s
  where s.tier = p_tier and s.clef = p_clef and s.mode = p_mode
    and (p_mode <> 'key' or s.key_signature = p_key_signature)
  order by s.score desc
  limit 500
$fn$;

create or replace function public.ear_board(p_answer_type text, p_chord_set text, p_key_signature text default null)
returns table(member_key uuid, name text, score integer, attempts integer)
language sql stable security definer set search_path to 'public'
as $fn$
  select s.member_key, s.name, s.score, s.attempts
  from ear_game_scores s
  where s.answer_type = p_answer_type and s.chord_set = p_chord_set
    and ((p_key_signature is not null and s.key_signature = p_key_signature)
      or (p_key_signature is null and s.key_signature is null))
  order by s.score desc
  limit 500
$fn$;

revoke all on function public.chord_board(integer, text, text, text) from public, anon;
grant execute on function public.chord_board(integer, text, text, text) to authenticated, service_role;
revoke all on function public.ear_board(text, text, text) from public, anon;
grant execute on function public.ear_board(text, text, text) to authenticated, service_role;

commit;
