// store-webhook — Stripe webhook for store purchases. On checkout.session.completed
// (metadata.type === "store") it records the order (idempotent) and emails the buyer
// a tokenised delivery link: a signed PDF download, or the course player.
// Deploy with --no-verify-jwt (Stripe calls it with no JWT). Needs its own Stripe
// webhook endpoint + STORE_WEBHOOK_SECRET.
import { STORE } from "../_shared/store-catalog.ts";
import { brandedEmail, ic, sendEmail } from "../_shared/branded-email.ts";

const STORE_WEBHOOK_SECRET = Deno.env.get("STORE_WEBHOOK_SECRET") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const BRAND      = "https://matthewcawood.com";
const BRAND_APP  = "https://app.matthewcawood.com";
const FROM       = "store@matthewcawood.com";
const REPLY_TO   = "enquiries@matthewcawood.com";
const NOTIFY_TO  = "matthew@matthewcawood.com";
const FN_BASE    = `${SUPABASE_URL}/functions/v1`;

// ── Stripe signature verification (HMAC-SHA256), same as the other webhooks ──
async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  if (!secret) return true; // allow unsigned in dev when no secret is set
  const parts = sigHeader.split(",");
  const ts = parts.find(p => p.startsWith("t="))?.split("=")[1];
  const v1 = parts.find(p => p.startsWith("v1="))?.split("=")[1];
  if (!ts || !v1) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${ts}.${payload}`));
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return hex === v1;
}

Deno.serve(async (req) => {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature") ?? "";
  if (!await verifyStripeSignature(body, sig, STORE_WEBHOOK_SECRET)) {
    console.error("store-webhook: invalid signature");
    return new Response("Invalid signature", { status: 400 });
  }

  let event: any;
  try { event = JSON.parse(body); } catch { return new Response("Bad JSON", { status: 400 }); }
  if (event.type !== "checkout.session.completed") return new Response("ok", { status: 200 });

  const session = event.data.object;
  const meta = session.metadata || {};
  if (meta.type !== "store") return new Response("ignored", { status: 200 });

  const email = (session.customer_details?.email || session.customer_email || "").toLowerCase();
  const slug  = meta.slug;
  const item  = STORE[slug];
  if (!email || !item) { console.error("store-webhook: missing email/item", { email, slug }); return new Response("ok", { status: 200 }); }

  // ── Record the order (idempotent on stripe_session_id) ──
  const ins = await fetch(`${SUPABASE_URL}/rest/v1/store_orders`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json", Prefer: "resolution=ignore-duplicates,return=representation",
    },
    body: JSON.stringify({
      stripe_session_id: session.id, email, slug, kind: item.type,
      amount_minor: session.amount_total ?? null, currency: session.currency ?? null,
    }),
  });
  if (!ins.ok) { console.error("store_orders insert failed:", ins.status, await ins.text()); return new Response("ok", { status: 200 }); }
  const rows = await ins.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    // Duplicate delivery of the same session — already processed, don't re-email.
    console.log("store-webhook: duplicate session, skipping", session.id);
    return new Response("ok", { status: 200 });
  }
  const order = rows[0];
  const token = order.access_token;

  // ── Deliver to the buyer ──
  const isCourse   = item.type === "course";
  const ctaHref    = isCourse ? `${BRAND}/store/learn/?t=${token}` : `${FN_BASE}/store-access?token=${token}`;
  const reviewHref = `${BRAND}/store/${slug}/#reviews`;
  const paid = `${((session.amount_total || 0) / 100).toFixed(2)} ${(session.currency || "gbp").toUpperCase()}`;
  await sendEmail({
    apiKey: RESEND_API_KEY, from: FROM, to: email, replyTo: REPLY_TO,
    subject: isCourse ? `Your course access: ${item.title}` : `Your download: ${item.title}`,
    html: brandedEmail({
      eyebrow: isCourse ? "Course Access" : "Your Download",
      heading: isCourse ? "You're in. Let's begin." : "Thanks for your order",
      paragraphs: (isCourse
        ? [`Thank you for buying <strong>${item.title}</strong>. Your access is ready, watch online anytime from any device.`,
           `Tap below to open the course. Keep this email, the link is yours to return to whenever you like.`]
        : [`Thank you for buying <strong>${item.title}</strong>. Your download is ready below.`,
           `The link is personal to you. If it ever expires, just reopen this email and tap it again for a fresh copy.`])
        .concat([`When you've had a look, a quick review really helps other pianists — <a href="${reviewHref}" style="color:#b4881a">leave one here</a>.`,
                 `And if you want to keep going, everything in these resources is taught in depth inside <strong>The Practice Room</strong> — structured practice, a pieces library, theory guides and a community.`]),
      detail: `${ic(isCourse ? "music" : "clip")}<strong>${item.title}</strong>`,
      ctaText: isCourse ? "Start the course →" : "Download your PDF →",
      ctaHref,
      cta2Text: "Explore The Practice Room →",
      cta2Href: `${BRAND_APP}/signup`,
      footerNote: "Matthew Cawood · Store",
    }),
  });

  // ── Notify Matt ──
  await sendEmail({
    apiKey: RESEND_API_KEY, from: FROM, to: NOTIFY_TO,
    subject: `Store sale: ${item.title}`,
    html: brandedEmail({
      eyebrow: "New Sale",
      heading: `${item.title}`,
      paragraphs: [`<strong>${email}</strong> bought <strong>${item.title}</strong> (${item.type}).`],
      detail: `${ic("pound")}Paid <strong>${paid}</strong>`,
      footerNote: "Internal notification · matthewcawood.com",
    }),
  });

  return new Response("ok", { status: 200 });
});
