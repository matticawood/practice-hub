import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Supabase client (service role) ─────────────────────────────────────────
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const APP_URL = Deno.env.get("APP_URL") ?? "https://app.matthewcawood.com";
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
      // User already exists in Auth — generate a magic link and send via Resend
      console.warn("Invite failed (user exists), sending magic link via Resend:", inviteError.message);
      const { data: linkData, error: magicError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo: `${APP_URL}/onboarding.html` },
      });

      if (magicError) {
        console.error("Magic link generation failed:", magicError.message);
      } else {
        const magicUrl = linkData?.properties?.action_link;
        const resendKey = Deno.env.get("RESEND_API_KEY")!;
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "The Practice Room <noreply@matthewcawood.com>",
            to: [email],
            subject: "Welcome back to The Practice Room 🎹",
            html: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td style="padding-bottom:32px;text-align:center;">
          <p style="margin:0;font-size:13px;letter-spacing:0.15em;text-transform:uppercase;color:#888;">The Practice Room</p>
        </td></tr>
        <tr><td style="background:#1a1a1a;border-radius:12px;padding:40px 36px;">
          <h1 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#ffffff;line-height:1.3;">Welcome back 🎹</h1>
          <p style="margin:0 0 16px;font-size:15px;color:#aaaaaa;line-height:1.7;">Thank you for rejoining The Practice Room. We're glad to have you back.</p>
          <p style="margin:0 0 32px;font-size:15px;color:#aaaaaa;line-height:1.7;">Click the button below to access your account.</p>
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
            <tr><td style="background:#ffffff;border-radius:8px;padding:14px 32px;text-align:center;">
              <a href="${magicUrl}" style="color:#0f0f0f;font-size:15px;font-weight:600;text-decoration:none;">Access your account →</a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:13px;color:#555555;line-height:1.6;text-align:center;">
            If the button doesn't work, copy and paste this link:<br>
            <a href="${magicUrl}" style="color:#888;word-break:break-all;">${magicUrl}</a>
          </p>
        </td></tr>
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#444444;">The Practice Room · <a href="https://app.matthewcawood.com" style="color:#444;text-decoration:none;">app.matthewcawood.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
          }),
        });
        const result = await res.json();
        console.log("Resend magic link email result:", JSON.stringify(result));
      }
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
