-- Ask search v2: live (as-you-type) prefix matching + timeline data columns.
--
-- 1) ask_tsquery: builds a tsquery where completed words match as whole
--    lexemes and the LAST (possibly in-progress) word matches as a prefix,
--    so "peda", "pedal", "pedall" all narrow toward pedalling while typing.
-- 2) ask_search v2: same corpus FTS, now returns duration_s / start_seconds /
--    end_seconds so a result card can draw a timeline with the matched moment
--    highlighted. start/end are null until per-line timing is backfilled; the
--    UI shows the text passage meanwhile and lights up the bar when they exist.

create or replace function public.ask_tsquery(p_q text)
returns tsquery
language plpgsql
immutable
as $$
declare
  v_words text[];
  v_last  text;
  v_head  text;
  v_main  tsquery := null;
  v_pref  tsquery := null;
begin
  v_words := array_remove(
    regexp_split_to_array(
      btrim(lower(regexp_replace(coalesce(p_q, ''), '[^a-z0-9 ]', ' ', 'gi'))),
      '\s+'),
    '');
  if array_length(v_words, 1) is null then
    return null;
  end if;

  v_last := v_words[array_length(v_words, 1)];

  if array_length(v_words, 1) > 1 then
    v_head := array_to_string(v_words[1:array_length(v_words, 1) - 1], ' ');
    v_main := plainto_tsquery('english', v_head);
  end if;

  if length(v_last) >= 2 then
    begin
      v_pref := to_tsquery('english', v_last || ':*');
    exception when others then
      v_pref := null;
    end;
  end if;
  if v_pref is null or numnode(v_pref) = 0 then
    v_pref := plainto_tsquery('english', v_last);   -- stopword / single short word
  end if;

  if v_main is null or numnode(v_main) = 0 then
    return v_pref;
  elsif v_pref is null or numnode(v_pref) = 0 then
    return v_main;
  else
    return v_main && v_pref;
  end if;
end;
$$;

drop function if exists public.ask_search(text, int);

create or replace function public.ask_search(p_q text, p_limit int default 12)
returns table (
  corpus_id     uuid,
  source_type   text,
  title         text,
  snippet       text,
  rank          real,
  youtube_id    text,
  app_post_id   uuid,
  clinic_id     uuid,
  mux_pid       text,
  url           text,
  duration_s    numeric,
  start_seconds numeric,
  end_seconds   numeric,
  published_at  timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with q as (
    select public.ask_tsquery(p_q) as tsq
  ),
  hits as (
    -- ts_rank_cd normalization 0 (cover density, no length penalty): a long
    -- video/clinic with a tight passage on the topic surfaces rather than
    -- being buried under a short article that mentions the words once.
    select c.id, c.source_type, c.title, c.body, c.url, c.source_ref,
           c.published_at, c.extra, ts_rank_cd(c.search, q.tsq, 0) as rank
    from corpus_entries c, q
    where q.tsq is not null
      and numnode(q.tsq) > 0
      and c.search @@ q.tsq
      and c.source_type in ('video','muxvideo','clinic','post','mmt','theory_sheet')
  ),
  resolved as (
    select h.*,
      case
        when h.source_type = 'video'
          then (select p.id from content_feed_posts p where p.youtube_id = h.source_ref limit 1)
        when h.source_type in ('muxvideo','post')
          then (case when h.source_ref ~ '^[0-9a-f-]{36}$' then h.source_ref::uuid else null end)
        else null
      end as app_post_id,
      case
        when h.source_type = 'clinic' and h.source_ref ~ '^[0-9a-f-]{36}$'
          then h.source_ref::uuid else null
      end as clinic_id,
      case when h.source_type = 'video' then h.source_ref else null end as youtube_id
    from hits h
  ),
  withpid as (
    select r.*,
      case
        when r.clinic_id is not null
          then (select le.mux_playback_id from live_events le where le.id = r.clinic_id)
        when r.app_post_id is not null
          then (select m->>'playbackId'
                  from content_feed_posts p,
                       jsonb_array_elements(coalesce(p.media, '[]'::jsonb)) m
                 where p.id = r.app_post_id and m->>'type' = 'mux' limit 1)
        else null
      end as mux_pid
    from resolved r
  ),
  keyed as (
    select w.*, coalesce(w.mux_pid, w.youtube_id, w.id::text) as dkey
    from withpid w
  ),
  deduped as (
    select distinct on (dkey)
      id, source_type, title, body, rank, youtube_id, app_post_id,
      clinic_id, mux_pid, url, extra, published_at
    from keyed
    order by dkey, rank desc
  ),
  ranked as (
    select d.*, max(d.rank) over () as top_rank
    from deduped d
  )
  select
    d.id as corpus_id,
    d.source_type,
    d.title,
    ts_headline('english', d.body, (select tsq from q),
      'MaxFragments=1,MaxWords=30,MinWords=15,StartSel=«,StopSel=»,FragmentDelimiter= … ') as snippet,
    d.rank,
    d.youtube_id,
    d.app_post_id,
    d.clinic_id,
    d.mux_pid,
    d.url,
    nullif((d.extra->>'duration'), '')::numeric as duration_s,
    null::numeric as start_seconds,   -- filled once per-line timing is backfilled
    null::numeric as end_seconds,
    d.published_at
  from ranked d
  where d.rank >= d.top_rank * 0.03
  order by d.rank desc
  limit greatest(1, least(coalesce(p_limit, 12), 30));
$$;

revoke all on function public.ask_search(text, int) from public, anon;
grant execute on function public.ask_search(text, int) to authenticated;
revoke all on function public.ask_tsquery(text) from public, anon;
grant execute on function public.ask_tsquery(text) to authenticated;
