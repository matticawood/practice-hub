-- Monthly Champions: the Pieces and Scales podiums ranked (email, item) rows and
-- took the top 3 WITHOUT deduping by member, so one person could occupy the whole
-- podium. June 2026: Tulika swept the SCALES podium because she lists ~14 scales
-- in a single comma-separated technique item every session, so every scale she
-- named got the same 27-session count and filled all three slots.
--
-- Two fixes, applied to both the post (get_champions_preview) and the winners
-- notifications (get_champions_winners):
--   * Pieces  — dedupe to each member's BEST piece (most hours), then rank members.
--   * Scales  — rank members by DISTINCT sessions in which they practised any scale
--               (immune to how many scales they list in one item; a session counts
--               once), showing their most-practised scale as the highlight.
-- Practice is unchanged (already grouped by member). Both podiums are now always
-- three DISTINCT people, matching the corrected June post.

-- ── Winners (drives the "Nth in <board>" champion_placed notifications) ──────
create or replace function public.get_champions_winners()
 returns table(email text, congrats text)
 language sql
 security definer
as $function$
  with all_w as (
    -- Most Practice: already one row per member
    select email, 1 as bord, 'Most Practice' as board, rn from (
      select ps.email,
             row_number() over (order by sum(ps.duration_minutes) desc, count(distinct ps.session_date) desc, max(ps.session_date) asc, ps.email) rn
      from practice_sessions ps
      where ps.session_date::date >= (date_trunc('month', current_date) - interval '1 month')::date
        and ps.session_date::date <  date_trunc('month', current_date)::date
        and lower(ps.email) not in ('matthew@matthewcawood.com','mcawoodcanada@gmail.com','reviewer@matthewcawood.com','enquiries@matthewcawood.com','system@thepracticeroom.app')
      group by ps.email having sum(ps.duration_minutes) > 0
    ) x where rn <= 3
    union all
    -- Top Pieces: dedupe to each member's best piece, then rank members
    select email, 2, 'Top Pieces', rn from (
      with sic as (select session_id, count(*) cnt from practice_items group by session_id),
      per as (
        select ps.email,
               round(sum(case when ps.timing_mode='per_item' then coalesce(pi.duration_minutes,0)
                              else coalesce(ps.duration_minutes,0)::numeric/nullif(sic.cnt,0) end)) m,
               count(distinct ps.session_date) dsd, max(ps.session_date) msd,
               coalesce(lp.title, pi.piece_label, pi.label, 'Untitled') piece
        from practice_sessions ps join practice_items pi on pi.session_id=ps.id join sic on sic.session_id=ps.id
        left join pieces lp on lp.id=pi.piece_id
        where pi.item_type='piece'
          and ps.session_date::date >= (date_trunc('month', current_date) - interval '1 month')::date
          and ps.session_date::date <  date_trunc('month', current_date)::date
          and lower(ps.email) not in ('matthew@matthewcawood.com','mcawoodcanada@gmail.com','reviewer@matthewcawood.com','enquiries@matthewcawood.com','system@thepracticeroom.app')
        group by ps.email, coalesce(lp.title, pi.piece_label, pi.label, 'Untitled')
        having round(sum(case when ps.timing_mode='per_item' then coalesce(pi.duration_minutes,0)
                              else coalesce(ps.duration_minutes,0)::numeric/nullif(sic.cnt,0) end)) > 0
      ),
      best as (select *, row_number() over (partition by email order by m desc, dsd desc, msd asc, piece) prn from per)
      select email, row_number() over (order by m desc, dsd desc, msd asc, email, piece) rn
      from best where prn = 1
    ) x where rn <= 3
    union all
    -- Top Scales & Technique: rank members by distinct sessions with any scale
    select email, 3, 'Top Scales & Technique', rn from (
      with tech_sessions as (
        select distinct ps.email, ps.id sid, ps.session_date sd
        from practice_sessions ps join practice_items pi on pi.session_id=ps.id
        where pi.item_type='technique' and pi.label is not null and trim(pi.label) <> ''
          and ps.session_date::date >= (date_trunc('month', current_date) - interval '1 month')::date
          and ps.session_date::date <  date_trunc('month', current_date)::date
          and lower(ps.email) not in ('matthew@matthewcawood.com','mcawoodcanada@gmail.com','reviewer@matthewcawood.com','enquiries@matthewcawood.com','system@thepracticeroom.app')
      )
      select email, row_number() over (order by count(distinct sid) desc, max(sd) asc, email) rn
      from tech_sessions group by email
    ) x where rn <= 3
  ),
  best as (select email, bord, max(board) board, min(rn) rn from all_w group by email, bord)
  select email,
         string_agg((case rn when 1 then '1st' when 2 then '2nd' else '3rd' end)||' in '||board, ' · ' order by bord) as congrats
  from best group by email;
$function$;

-- ── Preview (drives the community post's podium rows) ────────────────────────
create or replace function public.get_champions_preview()
 returns jsonb
 language sql
 security definer
as $function$
  select jsonb_build_object(
    'type', 'champions',
    'month', trim(to_char((date_trunc('month', current_date) - interval '1 month'), 'FMMonth YYYY')),
    'summary', (
      select 'The community logged '
             || to_char(round(sum(ps.duration_minutes)/60.0)::int, 'FM999,999')
             || ' hours of practice in '
             || trim(to_char((date_trunc('month', current_date) - interval '1 month'), 'FMMonth')) || '.'
      from practice_sessions ps
      where ps.session_date::date >= (date_trunc('month', current_date) - interval '1 month')::date
        and ps.session_date::date <  date_trunc('month', current_date)::date
        and lower(ps.email) not in ('matthew@matthewcawood.com','mcawoodcanada@gmail.com','reviewer@matthewcawood.com','enquiries@matthewcawood.com','system@thepracticeroom.app')
    ),
    'sections',
         (case when o.j  is not null then jsonb_build_array(jsonb_build_object('key','practice','label','Most Practice','rows',o.j)) else '[]'::jsonb end)
      || (case when pc.j is not null then jsonb_build_array(jsonb_build_object('key','pieces','label','Top Pieces','rows',pc.j)) else '[]'::jsonb end)
      || (case when s.j  is not null then jsonb_build_array(jsonb_build_object('key','scales','label','Top Scales & Technique','rows',s.j)) else '[]'::jsonb end)
  )
  from
    -- Most Practice (unchanged: one row per member)
    (select jsonb_agg(jsonb_build_object('name', nm, 'avatar', av, 'email', em, 'value', (mins/60)||'h '||lpad((mins%60)::text,2,'0')||'m') order by rn) j
     from (
       select coalesce(ae.name, split_part(ps.email,'@',1)) nm, ae.avatar_url av, ps.email em, sum(ps.duration_minutes)::int mins,
              row_number() over (order by sum(ps.duration_minutes) desc, count(distinct ps.session_date) desc, max(ps.session_date) asc, ps.email) rn
       from practice_sessions ps
       left join allowed_emails ae on ae.email = ps.email
       where ps.session_date::date >= (date_trunc('month', current_date) - interval '1 month')::date
         and ps.session_date::date <  date_trunc('month', current_date)::date
         and lower(ps.email) not in ('matthew@matthewcawood.com','mcawoodcanada@gmail.com','reviewer@matthewcawood.com','enquiries@matthewcawood.com','system@thepracticeroom.app')
       group by ae.name, ae.avatar_url, ps.email having sum(ps.duration_minutes) > 0
     ) q where rn <= 3) o,
    -- Top Pieces: dedupe to each member's best piece, then rank members
    (select jsonb_agg(jsonb_build_object('name', nm, 'avatar', av, 'email', em, 'sub', piece, 'value', (mins/60)||'h '||lpad((mins%60)::text,2,'0')||'m') order by rn) j
     from (
       with sic as (select session_id, count(*) cnt from practice_items group by session_id),
       per as (
         select coalesce(ae.name, split_part(ps.email,'@',1)) nm, ae.avatar_url av, ps.email em,
                coalesce(lp.title, pi.piece_label, pi.label, 'Untitled') piece,
                round(sum(case when ps.timing_mode='per_item' then coalesce(pi.duration_minutes,0)
                               else coalesce(ps.duration_minutes,0)::numeric/nullif(sic.cnt,0) end))::int mins,
                count(distinct ps.session_date) dsd, max(ps.session_date) msd
         from practice_sessions ps
         join practice_items pi on pi.session_id = ps.id
         join sic on sic.session_id = ps.id
         left join pieces lp on lp.id = pi.piece_id
         left join allowed_emails ae on ae.email = ps.email
         where pi.item_type='piece'
           and ps.session_date::date >= (date_trunc('month', current_date) - interval '1 month')::date
           and ps.session_date::date <  date_trunc('month', current_date)::date
           and lower(ps.email) not in ('matthew@matthewcawood.com','mcawoodcanada@gmail.com','reviewer@matthewcawood.com','enquiries@matthewcawood.com','system@thepracticeroom.app')
         group by ae.name, ae.avatar_url, ps.email, coalesce(lp.title, pi.piece_label, pi.label, 'Untitled')
       ),
       best as (select *, row_number() over (partition by em order by mins desc, dsd desc, msd asc, piece) prn from per)
       select nm, av, em, piece, mins,
              row_number() over (order by mins desc, dsd desc, msd asc, em, piece) rn
       from best where prn = 1 and mins > 0
     ) q where rn <= 3) pc,
    -- Top Scales & Technique: rank members by distinct sessions with any scale,
    -- highlight their most-practised scale.
    (select jsonb_agg(jsonb_build_object('name', nm, 'avatar', av, 'email', em, 'sub', tech, 'value', cnt||' session'||case when cnt=1 then '' else 's' end) order by rn) j
     from (
       with exploded as (
         select ps.email, ps.id sid, ps.session_date sd, trim(t.tech) tech
         from practice_sessions ps
         join practice_items pi on pi.session_id = ps.id
         cross join lateral unnest(string_to_array(pi.label, ',')) as t(tech)
         where pi.item_type='technique' and pi.label is not null and trim(t.tech) <> ''
           and ps.session_date::date >= (date_trunc('month', current_date) - interval '1 month')::date
           and ps.session_date::date <  date_trunc('month', current_date)::date
           and lower(ps.email) not in ('matthew@matthewcawood.com','mcawoodcanada@gmail.com','reviewer@matthewcawood.com','enquiries@matthewcawood.com','system@thepracticeroom.app')
       ),
       dd as (select distinct email, sid, sd, tech from exploded),
       member_sessions as (select email, count(distinct sid) cnt, max(sd) msd from dd group by email),
       tech_counts as (select email, tech, count(distinct sid) c, max(sd) tmsd from dd group by email, tech),
       top_tech as (
         select email, tech from (
           select email, tech, row_number() over (partition by email order by c desc, tmsd asc, tech) tr from tech_counts
         ) z where tr = 1
       )
       select coalesce(ae.name, split_part(ms.email,'@',1)) nm, ae.avatar_url av, ms.email em, tt.tech tech, ms.cnt::int cnt,
              row_number() over (order by ms.cnt desc, ms.msd asc, ms.email) rn
       from member_sessions ms
       left join top_tech tt on tt.email = ms.email
       left join allowed_emails ae on ae.email = ms.email
     ) q where rn <= 3) s;
$function$;
