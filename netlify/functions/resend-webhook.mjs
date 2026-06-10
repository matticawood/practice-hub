// Resend webhook → per-recipient engagement on email_log.
//
// Resend POSTs an event whenever something happens to an email we sent
// (delivered, opened, clicked, bounced, complained). We verify the Svix
// signature, then stamp the matching email_log row (matched by resend_id).
//
// Setup (one-time, in the Resend dashboard):
//   1. Webhooks → Add endpoint:
//        https://app.matthewcawood.com/.netlify/functions/resend-webhook
//      Subscribe to: email.delivered, email.bounced, email.complained,
//      email.opened, email.clicked.
//   2. Copy the signing secret (whsec_…) → set Netlify env RESEND_WEBHOOK_SECRET.
//   3. Enable Open & Click tracking on your domain (for opened/clicked events).

import { createHmac, timingSafeEqual } from "node:crypto";

const SUPABASE_URL = "https://gyskfutmncprqxazgatv.supabase.co";

const ok  = (m = "ok") => new Response(m, { status: 200 });
const bad = (m, s = 400) => new Response(m, { status: s });

function verify(secret, headers, rawBody) {
  // Svix signature scheme (what Resend uses).
  const id = headers.get("svix-id");
  const ts = headers.get("svix-timestamp");
  const sigHeader = headers.get("svix-signature");
  if (!id || !ts || !sigHeader || !secret) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${ts}.${rawBody}`).digest("base64");
  const expBuf = Buffer.from(expected);
  // header is space-separated "v1,<sig> v1,<sig> …"
  return sigHeader.split(" ").some((part) => {
    const sig = part.split(",")[1];
    if (!sig) return false;
    const b = Buffer.from(sig);
    return b.length === expBuf.length && timingSafeEqual(b, expBuf);
  });
}

export default async (req) => {
  if (req.method !== "POST") return bad("POST only", 405);
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const SECRET  = process.env.RESEND_WEBHOOK_SECRET;
  if (!SERVICE) return bad("missing service key", 500);

  const raw = await req.text();
  if (!verify(SECRET, req.headers, raw)) return bad("bad signature", 401);

  let evt;
  try { evt = JSON.parse(raw); } catch { return bad("bad json"); }
  const type = evt.type || "";
  const emailId = evt.data?.email_id || evt.data?.id;
  const at = evt.created_at || new Date().toISOString();
  if (!emailId) return ok("no email_id");

  // Which column does this event stamp? Opens/clicks keep the FIRST one only.
  const map = {
    "email.delivered":  { set: { delivered_at: at } },
    "email.opened":     { set: { opened_at: at }, firstOnly: "opened_at" },
    "email.clicked":    { set: { clicked_at: at }, firstOnly: "clicked_at" },
    "email.bounced":    { set: { bounced_at: at, bounce_kind: evt.data?.bounce?.type || evt.data?.type || null } },
    "email.complained": { set: { complained_at: at } },
  };
  const m = map[type];
  if (!m) return ok(`ignored ${type}`);

  const sb = (p, opts = {}) => fetch(`${SUPABASE_URL}/rest/v1/${p}`, { ...opts, headers: {
    apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json", ...(opts.headers || {}) } });

  let path = `email_log?resend_id=eq.${encodeURIComponent(emailId)}`;
  if (m.firstOnly) path += `&${m.firstOnly}=is.null`;  // only set the first open/click
  const res = await sb(path, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(m.set) });
  if (!res.ok) { console.error("resend-webhook patch failed", await res.text()); return bad("db error", 500); }

  // Clicks: also log the exact link (and the campaign, looked up by resend_id).
  if (type === "email.clicked") {
    const link = evt.data?.click?.link || evt.data?.link || null;
    const email = (Array.isArray(evt.data?.to) ? evt.data.to[0] : evt.data?.to) || null;
    let campaign = null;
    const lr = await sb(`email_log?resend_id=eq.${encodeURIComponent(emailId)}&select=campaign&limit=1`);
    if (lr.ok) campaign = (await lr.json())[0]?.campaign || null;
    await sb(`email_clicks`, { method: "POST", headers: { Prefer: "return=minimal" },
      body: JSON.stringify([{ resend_id: emailId, campaign, email, link, clicked_at: at }]) }).catch(() => {});
  }
  return ok();
};
