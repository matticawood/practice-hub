// store-free — free-PDF email capture. Records the lead, adds the email to the
// newsletter list, then returns (and emails) a signed download link.
//   POST { slug, email } → { url }
import { STORE } from "../_shared/store-catalog.ts";
import { brandedEmail, ic, sendEmail } from "../_shared/branded-email.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const FROM     = "store@matthewcawood.com";
const REPLY_TO = "enquiries@matthewcawood.com";
const SIGN_TTL = 7 * 24 * 60 * 60; // 7 days

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

async function signedUrl(slug: string): Promise<string | null> {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/store-files/${slug}.pdf`, {
    method: "POST",
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: SIGN_TTL }),
  });
  if (!res.ok) { console.error("sign failed:", res.status, await res.text()); return null; }
  const { signedURL } = await res.json();
  return signedURL ? `${SUPABASE_URL}/storage/v1${signedURL}` : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { slug, email } = await req.json();
    const item = slug ? STORE[slug] : undefined;
    if (!item)                 return json({ error: "Unknown product" }, 400);
    if (item.price !== 0)      return json({ error: "This product is not free" }, 400);
    const em = String(email || "").trim().toLowerCase();
    if (!/.+@.+\..+/.test(em)) return json({ error: "Please enter a valid email." }, 400);

    // Record the lead (best-effort).
    await fetch(`${SUPABASE_URL}/rest/v1/store_leads`, {
      method: "POST",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ email: em, slug }),
    }).catch(() => {});

    // Add to the newsletter list (idempotent on email PK).
    await fetch(`${SUPABASE_URL}/rest/v1/newsletter_subscribers`, {
      method: "POST",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify({ email: em, source: `store:${slug}` }),
    }).catch(() => {});

    const url = await signedUrl(slug);
    if (!url) return json({ error: "Sorry, that download isn't available right now." }, 500);

    // Email a copy of the link too.
    await sendEmail({
      apiKey: RESEND_API_KEY, from: FROM, to: em, replyTo: REPLY_TO,
      subject: `Your free download: ${item.title}`,
      html: brandedEmail({
        eyebrow: "Free Download",
        heading: "Here's your PDF",
        paragraphs: [
          `Thanks for grabbing <strong>${item.title}</strong>. Tap below to download it, the link works for 7 days.`,
          `You're now on Monday Music Tips too, one short, useful idea about playing every Monday. Unsubscribe anytime.`,
          `If you'd like to go further, <strong>The Practice Room</strong> turns ideas like these into a structured way to practise — tracking, a pieces library, theory guides and a community.`,
        ],
        detail: `${ic("clip")}<strong>${item.title}</strong>`,
        ctaText: "Download your PDF →",
        ctaHref: url,
        cta2Text: "Explore The Practice Room →",
        cta2Href: "https://app.matthewcawood.com/signup",
        footerNote: "Matthew Cawood · Store",
      }),
    });

    return json({ url });
  } catch (e: any) {
    console.error("store-free error:", e);
    return json({ error: e.message }, 500);
  }
});
