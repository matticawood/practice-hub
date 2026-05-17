import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Supabase client (service role) ─────────────────────────────────────────
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const APP_URL = Deno.env.get("APP_URL") ?? "https://practicehub.matthewcawood.com";
const WEBHOOK_SECRET = Deno.env.get("STRIPE_MEMBERSHIP_WEBHOOK_SECRET") ?? "";

// ── Stripe signature verification (HMAC-SHA256) ───────────────────────────
async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  if (!secret) return true;
  const parts     = sigHeader.split(",");
  const timestamp = parts.find(p => p.startsWith("t="))?.split("=")[1];
  const v1        = parts.find(p => p.startsWith("v1="))?.split("=")[1];
  if (!timestamp || !v1) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`)
  );
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return hex === v1;
}

// ── Handler ────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature") ?? "";

  const valid = await verifyStripeSignature(body, sig, WEBHOOK_SECRET);
  if (!valid) {
    console.error("Invalid Stripe webhook signature");
    return new Response("Invalid signature", { status: 400 });
  }

  let event: any;
  try { event = JSON.parse(body); }
  catch { return new Response("Bad JSON", { status: 400 }); }

  console.log("Received Stripe event:", event.type);

  // ── New subscription / payment ────────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session    = event.data.object;
    const email      = session.customer_details?.email ?? session.customer_email;
    const customerId = typeof session.customer === "string" ? session.customer : null;
    const subId      = typeof session.subscription === "string" ? session.subscription : null;

    if (!email) {
      console.error("No email found in session", session.id);
      return new Response("No email", { status: 400 });
    }

    console.log("New subscriber:", email);

    const { error: upsertError } = await supabase
      .from("allowed_emails")
      .upsert({
        email,
        stripe_customer_id:     customerId,
        stripe_subscription_id: subId,
        subscription_status:    "active",
        onboarded:              false,
      }, { onConflict: "email", ignoreDuplicates: false });

    if (upsertError) {
      console.error("DB upsert failed:", upsertError.message);
      return new Response("DB error", { status: 500 });
    }

    // Send invite email
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${APP_URL}/onboarding.html`,
      data: { source: "stripe_checkout" },
    });

    if (inviteError) {
      console.warn("Invite failed, sending magic link:", inviteError.message);
      const { error: magicError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo: `${APP_URL}/onboarding.html` },
      });
      if (magicError) console.error("Magic link also failed:", magicError.message);
      else console.log("Magic link sent to:", email);
    } else {
      console.log("Invite email sent to:", email);
    }
  }

  // ── Subscription cancelled / updated ─────────────────────────────────────
  if (
    event.type === "customer.subscription.deleted" ||
    event.type === "customer.subscription.updated"
  ) {
    const sub        = event.data.object;
    const customerId = typeof sub.customer === "string" ? sub.customer : null;
    if (!customerId) return new Response("No customer id", { status: 400 });

    if (sub.status === "canceled" || sub.status === "unpaid" || sub.status === "past_due") {
      await supabase
        .from("allowed_emails")
        .update({ subscription_status: sub.status })
        .eq("stripe_customer_id", customerId);

      if (sub.status === "canceled") {
        await supabase
          .from("allowed_emails")
          .delete()
          .eq("stripe_customer_id", customerId);
      }
    }

    if (sub.status === "active") {
      await supabase
        .from("allowed_emails")
        .update({ subscription_status: "active" })
        .eq("stripe_customer_id", customerId);
    }
  }

  // ── Payment failed ────────────────────────────────────────────────────────
  if (event.type === "invoice.payment_failed") {
    const invoice    = event.data.object;
    const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
    if (customerId) {
      await supabase
        .from("allowed_emails")
        .update({ subscription_status: "past_due" })
        .eq("stripe_customer_id", customerId);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
