-- SECURITY (Critical→Low, ~40 findings): revoke the default PUBLIC/anon EXECUTE
-- on every SECURITY DEFINER function. The public anon key is a valid project JWT,
-- so before this a logged-out attacker could call get_my_sessions('anyone'),
-- post_monthly_champions(), admin_broadcast_notification(...), the whole p_email
-- write family, and every leaderboard RPC that returns member emails.
--
-- is_member() stays anon-callable (it is the pre-login membership gate and returns
-- only a boolean). Everything else is authenticated + service_role only.
--
-- Applied live via the Supabase Management API on 2026-07-11 (no migration runner
-- in this repo); committed so source matches prod.
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef and p.proname <> 'is_member'
  loop
    execute format('revoke execute on function %s from public, anon;', r.sig);
    execute format('grant execute on function %s to authenticated, service_role;', r.sig);
  end loop;
end $$;
