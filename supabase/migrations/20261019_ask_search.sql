-- Ask page: member-facing full-text search over Matt's teaching corpus.
-- corpus_entries has RLS (owner-only), so members reach it through this
-- SECURITY DEFINER function, which only ever exposes published teaching
-- content (no community posts, no member replies) and only safe columns.
-- Lexical FTS + ts_headline returns the relevant passage. No API cost.

create or replace function public.ask_search(p_q text, p_limit int default 12)
returns table (
  corpus_id    uuid,
  source_type  text,
  title        text,
  snippet      text,
  rank         real,
  youtube_id   text,
  app_post_id  uuid,
  clinic_id    uuid,
  mux_pid      text,
  url          text,
  published_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with q as (
    select websearch_to_tsquery('english', coalesce(p_q, '')) as tsq
  ),
  hits as (
    -- ts_rank_cd with normalization 0 (cover density, no document-length
    -- penalty): rewards the query words appearing close together, so a long
    -- video/clinic with a tight passage on the topic surfaces rather than
    -- being buried under a short article that mentions the words once.
    select c.id, c.source_type, c.title, c.body, c.url, c.source_ref,
           c.published_at, ts_rank_cd(c.search, q.tsq, 0) as rank
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
      clinic_id, mux_pid, url, published_at
    from keyed
    order by dkey, rank desc
  ),
  ranked as (
    -- drop the long tail of incidental single-word matches: keep rows within
    -- a band of the top result (relative, so it adapts per query).
    select d.*, max(d.rank) over () as top_rank
    from deduped d
  )
  select
    d.id as corpus_id,
    d.source_type,
    d.title,
    ts_headline('english', d.body, (select tsq from q),
      'MaxFragments=1,MaxWords=28,MinWords=14,StartSel=«,StopSel=»,FragmentDelimiter= … ') as snippet,
    d.rank,
    d.youtube_id,
    d.app_post_id,
    d.clinic_id,
    d.mux_pid,
    d.url,
    d.published_at
  from ranked d
  where d.rank >= d.top_rank * 0.03
  order by d.rank desc
  limit greatest(1, least(coalesce(p_limit, 12), 30));
$$;

revoke all on function public.ask_search(text, int) from public, anon;
grant execute on function public.ask_search(text, int) to authenticated;
