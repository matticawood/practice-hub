// checkout-login ────────────────────────────────────────────────────────────
// Called by /welcome.html right after a successful Stripe Payment Link checkout,
// with ?session_id={CHECKOUT_SESSION_ID}. It verifies the session is genuinely
// paid, makes sure the member is provisioned (idempotent — removes any race with
// the stripe-webhook), and returns a one-time magic link so the browser can log
// them straight into the app.
//
// SAFETY: this is purely additive. The stripe-webhook still provisions + emails
// exactly as before, and the login screen still works. If anything here fails,
// it returns { ok:false } and welcome.html falls back to the normal login.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const APP_URL = Deno.env.get("APP_URL") ?? "https://app.matthewcawood.com";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });

async function magicLink(email: string): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${APP_URL}/onboarding.html` },
  });
  if (!error && data?.properties?.action_link) return data.properties.action_link;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const sessionId = new URL(req.url).searchParams.get("session_id") ?? "";
    if (!sessionId.startsWith("cs_")) return json({ ok: false, reason: "no_session" });

    // 1) Retrieve + verify the checkout session straight from Stripe (so we trust
    //    Stripe, never the URL). Only a genuinely paid subscription checkout counts.
    const sres = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
    });
    if (!sres.ok) return json({ ok: false, reason: "session_lookup_failed" });
    const session = await sres.json();

    const paid  = session.payment_status === "paid" || session.status === "complete";
    const email = session.customer_details?.email ?? session.customer_email ?? null;
    const isSub = session.mode === "subscription" || !!session.subscription;
    if (!paid || !email || !isSub) return json({ ok: false, reason: "not_eligible" });

    // 2) Make sure they're provisioned. Idempotent upsert keyed on email, only the
    //    membership columns — never resets `onboarded`, `name`, etc. Mirrors the
    //    webhook so welcome.html works even if the webhook hasn't landed yet.
    const customerId = typeof session.customer === "string" ? session.customer : null;
    const subId      = typeof session.subscription === "string" ? session.subscription : null;
    const { error: upErr } = await supabase
      .from("allowed_emails")
      .upsert(
        { email, stripe_customer_id: customerId, stripe_subscription_id: subId, subscription_status: "active" },
        { onConflict: "email", ignoreDuplicates: false },
      );
    if (upErr) console.warn("checkout-login upsert warn:", upErr.message);

    // 3) Mint a one-time magic link. If the auth user does not exist yet (brand-new
    //    member who beat the webhook's invite), create them first, then retry.
    let link = await magicLink(email);
    if (!link) {
      try { await supabase.auth.admin.createUser({ email, email_confirm: true }); }
      catch (e) { console.warn("createUser warn:", String(e)); } // already-exists is fine
      link = await magicLink(email);
    }
    if (!link) return json({ ok: false, reason: "link_failed" });

    return json({ ok: true, action_link: link });
  } catch (e) {
    console.error("checkout-login error:", String(e));
    return json({ ok: false, reason: "error" });
  }
});
