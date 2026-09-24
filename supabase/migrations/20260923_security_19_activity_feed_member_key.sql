begin;

-- The activity feed has to be able to say WHO an item belongs to without
-- handing the page an address. The body is long and branchy, so rather than
-- edit every UNION arm it is renamed untouched and wrapped: the wrapper adds
-- the member's opaque key by looking the address up in the directory.
-- Existing callers read by column name and are unaffected.
alter function public.get_activity_feed_v2() rename to _sec_activity_feed_v2_29541;

create function public.get_activity_feed_v2()
returns table(email text, name text, created_at timestamptz, event_type text, item_id text,
              achievement_id text, duration_minutes integer, post_id text, post_type text,
              parent_post_id text, piece_title text, piece_composer text, piece_status text,
              game_score integer, game_clef text, game_kind text, member_key uuid)
language sql stable security definer set search_path to 'public'
as $function$
  select f.*, mi.member_key
  from public._sec_activity_feed_v2_29541() f
  left join member_identities mi on mi.email = lower(f.email)
$function$;

-- the inner function is an implementation detail from here on
revoke all on function public._sec_activity_feed_v2_29541() from public, anon, authenticated;
grant execute on function public._sec_activity_feed_v2_29541() to service_role;

revoke all on function public.get_activity_feed_v2() from public, anon;
grant execute on function public.get_activity_feed_v2() to authenticated, service_role;

commit;
