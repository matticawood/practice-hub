-- SECURITY (Critical): close the anonymous read leak on allowed_emails.
--
-- Ground truth from pg_policies (this table's real config never lived in a
-- migration): RLS *is* enabled, but a policy
--     "allow login check"   FOR SELECT   TO public   USING (true)
-- let ANY visitor - including a logged-out anon request with the public anon key -
-- read the entire member roster (email, name, bio, location, stripe_customer_id,
-- stripe_subscription_id, subscription_status, unsubscribe_token). Confirmed live:
-- anon GET /rest/v1/allowed_emails returned all 70 rows.
--
-- That policy existed only so the pre-login membership check (a direct anon SELECT
-- on allowed_emails) could work. We replace that check with a boolean-only
-- SECURITY DEFINER function and then drop the over-broad policy. Member self-read,
-- member self-update (email = auth.email()), and the owner-manage policy are all
-- left intact, so login, profile writes, community name/avatar reads, and the
-- admin tools keep working.
--
-- Applied to production via the Supabase Management API on 2026-07-11 (this repo
-- has no migration runner); committed here so source matches prod.

create or replace function public.is_member(p_email text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from allowed_emails where lower(email) = lower(p_email));
$$;

revoke all on function public.is_member(text) from public;
grant execute on function public.is_member(text) to anon, authenticated;

-- Frontend login gates (index.html, practice-log.html, practice-tools.html) now
-- call rpc('is_member', { p_email }) instead of selecting allowed_emails directly.
drop policy if exists "allow login check" on public.allowed_emails;
