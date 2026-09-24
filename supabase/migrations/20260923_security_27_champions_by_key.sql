
begin;
-- The champions card names three people. It handed over their addresses too.
-- The body is untouched: renamed, and wrapped so each row carries the member's
-- key instead of where they live.
alter function public.get_champions_preview() rename to _sec_champ_25191;

create function public.get_champions_preview()
returns jsonb
language sql stable security definer set search_path to 'public'
as $wrap$
  with src as (select public._sec_champ_25191() as j)
  select case when (src.j ? 'sections') then
    jsonb_set(src.j, '{sections}', (
      select coalesce(jsonb_agg(
        jsonb_set(sec, '{rows}', (
          select coalesce(jsonb_agg((r - 'email') || jsonb_build_object('member_key', mi.member_key)), '[]'::jsonb)
          from jsonb_array_elements(coalesce(sec->'rows', '[]'::jsonb)) r
          left join member_identities mi on mi.email = lower(r->>'email')
        )) order by ord
      ), '[]'::jsonb)
      from jsonb_array_elements(src.j->'sections') with ordinality as t(sec, ord)
    ))
  else src.j end
  from src
$wrap$;

revoke all on function public._sec_champ_25191() from public, anon, authenticated;
grant execute on function public._sec_champ_25191() to service_role;
revoke all on function public.get_champions_preview() from public, anon;
grant execute on function public.get_champions_preview() to authenticated, service_role;
commit;