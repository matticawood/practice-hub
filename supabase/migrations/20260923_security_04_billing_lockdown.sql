-- Stripe identifiers out of reach of the browser.
--
-- Today `authenticated` holds column SELECT on stripe_customer_id and
-- stripe_subscription_id, and the row policy lets any member read every row, so
-- one logged-in member can read the billing identifiers of all 116 paying
-- members. No member-facing page reads either column: the only client reader is
-- admin-analytics.html, which is the owner's own page, and a server-side script
-- that uses the service key and is unaffected by grants.
--
-- Column privileges belong to the ROLE, and the owner signs in as `authenticated`
-- like everybody else, so the revoke would take his admin page with it. The page
-- gets a function instead, which checks who is asking.

create or replace function public.admin_billing_customer_map()
returns table(email text, stripe_customer_id text)
language plpgsql
stable
security definer
set search_path to 'public'
as $fn$
declare
  v_claims json;
  v_caller text;
begin
  v_claims := nullif(current_setting('request.jwt.claims', true), '')::json;
  v_caller := lower(coalesce(v_claims ->> 'email', ''));
  -- the owner only; internal callers have no end-user token and are not the
  -- audience for this one, so they are refused too rather than waved through
  if v_caller <> 'matthew@matthewcawood.com' then
    raise exception 'not authorised' using errcode = '42501';
  end if;
  return query select ae.email, ae.stripe_customer_id from allowed_emails ae;
end;
$fn$;

revoke all on function public.admin_billing_customer_map() from public, anon;
grant execute on function public.admin_billing_customer_map() to authenticated;

revoke select (stripe_customer_id, stripe_subscription_id) on public.allowed_emails from authenticated;
revoke select (stripe_customer_id, stripe_subscription_id) on public.allowed_emails from anon;
