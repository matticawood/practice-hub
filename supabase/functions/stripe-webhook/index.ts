import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.0.0?target=deno&no-check";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Clients ────────────────────────────────────────────────────────────────────
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

// Service-role client — can bypass RLS
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const APP_URL = Deno.env.get("APP_URL") ?? "https://practicehub.app";

// ── Handler ────────────────────────────────────────────────────────────────────
serve(async (req) => {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature") ?? "";

  // Verify the webhook came from Stripe
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      Deno.env.get("STRIPE_MEMBERSHIP_WEBHOOK_SECRET")!,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log("Received Stripe event:", event.type);

  // ── New subscription created / payment succeeded ───────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email      = session.customer_details?.email ?? session.customer_email;
    const customerId = typeof session.customer === "string" ? session.customer : null;
    const subId      = typeof session.subscription === "string" ? session.subscription : null;

    if (!email) {
      console.error("No email found in session", session.id);
      return new Response("No email", { status: 400 });
    }

    console.log("New subscriber:", email);

    // Add (or re-activate) in allowed_emails
    const { error: upsertError } = await supabase
      .from("allowed_emails")
      .upsert({
        email,
        stripe_customer_id:    customerId,
        stripe_subscription_id: subId,
        subscription_status:   "active",
        onboarded:             false,   // will be set true after onboarding
      }, { onConflict: "email", ignoreDuplicates: false });

    if (upsertError) {
      console.error("DB upsert failed:", upsertError.message);
      return new Response("DB error", { status: 500 });
    }

    // Send invite / magic-link email so they can log in
    // inviteUserByEmail sends a nice "You've been invited" email with a login link
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${APP_URL}/onboarding.html`,
      data: { source: "stripe_checkout" },
    });

    if (inviteError) {
      // User may already exist — try sending a magic link instead
      console.warn("Invite failed (user may already exist), sending magic link:", inviteError.message);
      const { error: magicError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo: `${APP_URL}/onboarding.html` },
      });
      if (magicError) console.error("Magic link also failed:", magicError.message);
    }
  }

  // ── Subscription cancelled ────────────────────────────────────────────────
  if (
    event.type === "customer.subscription.deleted" ||
    event.type === "customer.subscription.updated"
  ) {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = typeof sub.customer === "string" ? sub.customer : null;

    if (!customerId) {
      return new Response("No customer id", { status: 400 });
    }

    if (sub.status === "canceled" || sub.status === "unpaid" || sub.status === "past_due") {
      console.log("Subscription ended for customer:", customerId, "status:", sub.status);

      await supabase
        .from("allowed_emails")
        .update({ subscription_status: sub.status })
        .eq("stripe_customer_id", customerId);

      // If fully cancelled, remove access
      if (sub.status === "canceled") {
        await supabase
          .from("allowed_emails")
          .delete()
          .eq("stripe_customer_id", customerId);
      }
    }

    // Re-activation (e.g. they updated payment method and subscription is active again)
    if (sub.status === "active") {
      await supabase
        .from("allowed_emails")
        .update({ subscription_status: "active" })
        .eq("stripe_customer_id", customerId);
    }
  }

  // ── Payment failed (grace period warning) ─────────────────────────────────
  if (event.type === "invoice.payment_failed") {
    const invoice    = event.data.object as Stripe.Invoice;
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
