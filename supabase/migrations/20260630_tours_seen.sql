-- Per-member "tour seen" state, so a member sees each guided tour once EVER
-- (across every device), not once per browser. Replaces localStorage-only gating;
-- the client mirrors this into localStorage on load and persists back on completion.

alter table allowed_emails
  add column if not exists tours_seen jsonb not null default '{}'::jsonb;

-- Read the caller's own seen-set (SECURITY DEFINER so it works without a broad
-- self-read policy on allowed_emails).
create or replace function get_tours_seen() returns jsonb
language sql security definer stable
set search_path = public
as $$
  select coalesce(tours_seen, '{}'::jsonb)
  from allowed_emails
  where lower(email) = lower(auth.jwt() ->> 'email')
  limit 1;
$$;

-- Mark one tour key as seen for the caller (merges into the jsonb object).
create or replace function mark_tour_seen(p_key text) returns void
language sql security definer
set search_path = public
as $$
  update allowed_emails
     set tours_seen = coalesce(tours_seen, '{}'::jsonb) || jsonb_build_object(p_key, true)
   where lower(email) = lower(auth.jwt() ->> 'email');
$$;

grant execute on function get_tours_seen() to authenticated;
grant execute on function mark_tour_seen(text) to authenticated;
