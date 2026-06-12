// store-review — public endpoint to submit a product review (saved as 'pending').
// Called from the brand store product page with the anon bearer. Validates input,
// inserts via service role, and notifies Matt to approve. No moderation here.
//   POST { slug, name, rating, body, email? } → { ok:true }
import { STORE } from "../_shared/store-catalog.ts";
import { brandedEmail, ic, sendEmail } from "../_shared/branded-email.ts";

const SUPABASE_URL   = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const NOTIFY_TO      = "matthew@matthewcawood.com";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let b: any;
  try { b = await req.json(); } catch { return json({ error: "Bad JSON" }, 400); }

  const slug   = String(b.slug || "").trim();
  const name   = String(b.name || "").trim().slice(0, 80);
  const body   = String(b.body || "").trim().slice(0, 1200);
  const email  = (String(b.email || "").trim().toLowerCase().slice(0, 160)) || null;
  const rating = Math.round(Number(b.rating));

  if (!STORE[slug])                     return json({ error: "Unknown product" }, 400);
  if (!name)                            return json({ error: "Please add your name." }, 400);
  if (!(rating >= 1 && rating <= 5))    return json({ error: "Please choose a star rating." }, 400);
  if (body.length < 4)                  return json({ error: "Please write a little more." }, 400);

  const ins = await fetch(`${SUPABASE_URL}/rest/v1/store_reviews`, {
    method: "POST",
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ slug, name, rating, body, email, status: "pending" }),
  });
  if (!ins.ok) { console.error("store_reviews insert failed:", ins.status, await ins.text()); return json({ error: "Could not save your review, please try again." }, 500); }

  if (RESEND_API_KEY) {
    await sendEmail({
      apiKey: RESEND_API_KEY, from: "store@matthewcawood.com", to: NOTIFY_TO,
      subject: `New review (${rating}★) — ${STORE[slug].title}`,
      html: brandedEmail({
        eyebrow: "Review to approve",
        heading: `${rating}★ — ${STORE[slug].title}`,
        paragraphs: [`<strong>${name}</strong>${email ? ` (${email})` : ""} wrote:`, `“${body}”`],
        detail: `${ic("clip")}Pending approval in your reviews admin.`,
        footerNote: "Internal notification · matthewcawood.com",
      }),
    }).catch(() => {});
  }

  return json({ ok: true });
});
