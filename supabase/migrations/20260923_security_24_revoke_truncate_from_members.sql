begin;

-- TRUNCATE is not filtered by row security. It was granted to anon and to
-- authenticated on almost every table, which meant the only thing standing
-- between a member and an emptied table was that PostgREST has no verb for it.
-- Nothing in the app truncates anything, so this takes the landmine away
-- without changing any behaviour. REFERENCES and TRIGGER go too, for the same
-- reason: nothing uses them and they let a caller attach things to a table.
do $$
declare r record;
begin
  for r in
    select c.oid::regclass as t
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
  loop
    execute format('revoke truncate, references, trigger on table %s from anon, authenticated', r.t);
  end loop;
end $$;

commit;
