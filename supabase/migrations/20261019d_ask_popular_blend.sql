-- Ask "Popular answers from Matt": blended engagement signal.
--
-- No single signal is trustworthy on its own (raw views reward exposure; raw
-- likes throw up items with 9 likes / 2 viewers because likes and views are
-- captured in different places; watch-through only exists for member videos).
-- So rank by a composite that rewards BREADTH across all three, which damps
-- any one-axis outlier:
--
--   score = 0.40 * (viewers / max_viewers)       -- reach
--         + 0.35 * (likes   / max_likes)         -- explicit approval
--         + 0.25 * watch_through                 -- depth
--
-- watch_through is seconds-watched / video-length. Member-video length isn't
-- stored, so it's inferred: a member who COMPLETED a video watched its full
-- length, so max(seconds among completers) ~ the duration. YouTube embeds only
-- log an open (no watch time), so their watch_through is filled at the set
-- median rather than zeroed, letting them rank on views + likes.

drop function if exists public.ask_popular(int);

create or replace function public.ask_popular(p_limit int default 8)
returns table (
  content_type text,
  title        text,
  app_post_id  uuid,
  clinic_id    uuid,
  youtube_id   text,
  mux_pid      text,
  viewers      int,
  likes        int,
  score        numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with base as (
    select content_type, content_ref,
           count(distinct email)::int as viewers,
           count(*) filter (where completed)::int as completions,
           avg(seconds)::numeric as avg_secs,
           max(seconds) filter (where completed) as est_dur
    from content_views
    where content_type in ('video','clinic')
    group by content_type, content_ref
  ),
  res as (
    select b.*,
      case
        when b.content_type = 'video' and b.content_ref ~ '^[0-9a-f-]{36}$'
          then b.content_ref::uuid
        when b.content_type = 'video'
          then (select p.id from content_feed_posts p where p.youtube_id = b.content_ref limit 1)
        else null
      end as app_post_id,
      case
        when b.content_type = 'clinic' and b.content_ref ~ '^[0-9a-f-]{36}$'
          then b.content_ref::uuid else null
      end as clinic_id,
      case
        when b.content_type = 'video' and b.content_ref !~ '^[0-9a-f-]{36}$'
          then b.content_ref else null
      end as youtube_id
    from base b
  ),
  enr as (
    select r.*,
      coalesce(
        (select p.title from content_feed_posts p where p.id = r.app_post_id),
        (select le.title from live_events le where le.id = r.clinic_id)
      ) as title,
      case
        when r.clinic_id is not null
          then (select le.mux_playback_id from live_events le where le.id = r.clinic_id)
        when r.app_post_id is not null
          then (select m->>'playbackId'
                  from content_feed_posts p,
                       jsonb_array_elements(coalesce(p.media, '[]'::jsonb)) m
                 where p.id = r.app_post_id and m->>'type' = 'mux' limit 1)
        else null
      end as mux_pid,
      coalesce((select count(*)::int from content_feed_likes l where l.post_id = r.app_post_id), 0) as likes,
      case when r.est_dur > 0 then least(1.0, r.avg_secs / r.est_dur) else null end as wt
    from res r
  ),
  elig as (
    select * from enr
    where title is not null and (app_post_id is not null or clinic_id is not null)
  ),
  stat as (
    select nullif(max(viewers), 0)::numeric as mv,
           nullif(max(likes), 0)::numeric as ml,
           percentile_cont(0.5) within group (order by wt) as med_wt
    from elig
  ),
  scored as (
    select e.*,
      ( 0.40 * (e.viewers / coalesce(s.mv, 1))
      + 0.35 * (e.likes   / coalesce(s.ml, 1))
      + 0.25 * coalesce(e.wt, s.med_wt, 0) )::numeric as score
    from elig e, stat s
  )
  select content_type, title, app_post_id, clinic_id, youtube_id, mux_pid,
         viewers, likes, round(score, 4) as score
  from scored
  order by score desc, viewers desc
  limit greatest(1, least(coalesce(p_limit, 8), 20));
$$;

revoke all on function public.ask_popular(int) from public, anon;
grant execute on function public.ask_popular(int) to authenticated;
