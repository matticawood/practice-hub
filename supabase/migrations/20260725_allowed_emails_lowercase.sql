-- BUGFIX (login lockout): normalise allowed_emails.email to lowercase.
--
-- The whole app lowercases emails at capture and queries membership with a
-- case-sensitive `.eq("email", <lowercased>)` gate (index.html, practice-log.html).
-- The Stripe webhook, however, stored `session.customer_details.email` verbatim,
-- so any member whose Stripe email carried a capital letter was written with that
-- capital and then NEVER matched the lowercased gate: they could request + verify
-- an OTP, but the membership check found no row and bounced them back to login in
-- a loop. Confirmed live: two active members (ordernj@iCloud.com,
-- Mathijs.Schuurmans@gmail.com) were locked out this way; every all-lowercase
-- member was unaffected.
--
-- The RLS self-read policy is already case-insensitive (lower(email)=lower(auth.email())),
-- so the fix is purely to make STORAGE always lowercase. A BEFORE INSERT/UPDATE trigger
-- guarantees that regardless of which path writes the row (webhook, manual add, a future
-- script), so the case-sensitive `.eq` gate is always correct without touching client code.
-- The stripe-webhook function was also updated to lowercase on write (belt-and-suspenders).
--
-- Applied to production via the Supabase Management API on 2026-07-25 (this repo has no
-- migration runner); committed here so source matches prod.

create or replace function public.lowercase_allowed_email()
returns trigger
language plpgsql
as $$
begin
  new.email := lower(new.email);
  return new;
end
$$;

drop trigger if exists trg_lowercase_allowed_email on public.allowed_emails;
create trigger trg_lowercase_allowed_email
  before insert or update of email on public.allowed_emails
  for each row execute function public.lowercase_allowed_email();

-- One-off backfill of the rows already stored with capitals.
update allowed_emails set email = lower(email) where email <> lower(email);
