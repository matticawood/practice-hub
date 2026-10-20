-- Ask page: real "Popular answers from Matt" from member view data.
-- content_views logs one row per member per content (email, content_type,
-- content_ref, seconds, completed). It has RLS, so members reach the
-- aggregate through this SECURITY DEFINER function, which returns only
-- counts + resolved titles/links, never any per-member data.
--
-- Popularity = distinct viewers (works across Mux member videos, which log
-- watch-time + completion, and YouTube uploads, which log an open), tie-broken
-- by completions then recency. 'video' content_ref is either a post UUID
-- (Mux member video) or an 11-char YouTube id; both resolve to an in-app post.

create or replace function public.ask_popular(p_limit int default 8)
returns table (
  content_type text,
  title        text,
  app_post_id  uuid,
  clinic_id    uuid,
  youtube_id   text,
  mux_pid      text,
  viewers      int,
  completions  int,
  last_seen    timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with agg as (
    select content_type, content_ref,
           count(distinct email)::int as viewers,
           count(*) filter (where completed)::int as completions,
           max(last_seen) as last_seen
    from content_views
    where content_type in ('video','clinic')
    group by content_type, content_ref
  ),
  res as (
    select a.*,
      case
        when a.content_type = 'video' and a.content_ref ~ '^[0-9a-f-]{36}$'
          then a.content_ref::uuid
        when a.content_type = 'video'
          then (select p.id from content_feed_posts p where p.youtube_id = a.content_ref limit 1)
        else null
      end as app_post_id,
      case
        when a.content_type = 'clinic' and a.content_ref ~ '^[0-9a-f-]{36}$'
          then a.content_ref::uuid else null
      end as clinic_id,
      case
        when a.content_type = 'video' and a.content_ref !~ '^[0-9a-f-]{36}$'
          then a.content_ref else null
      end as youtube_id
    from agg a
  ),
  titled as (
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
      end as mux_pid
    from res r
  )
  select t.content_type, t.title, t.app_post_id, t.clinic_id, t.youtube_id,
         t.mux_pid, t.viewers, t.completions, t.last_seen
  from titled t
  where t.title is not null
    and (t.app_post_id is not null or t.clinic_id is not null)
  -- Engagement score, not raw views: a member who finished counts full, one
  -- who only opened/partly watched counts half. Rewards content people
  -- actually watch through over content that merely gets clicked. (YouTube
  -- uploads can't report completion, so they rank on opens — half weight.)
  order by (t.completions + 0.5 * (t.viewers - t.completions)) desc,
           t.completions desc, t.last_seen desc nulls last
  limit greatest(1, least(coalesce(p_limit, 8), 20));
$$;

revoke all on function public.ask_popular(int) from public, anon;
grant execute on function public.ask_popular(int) to authenticated;
