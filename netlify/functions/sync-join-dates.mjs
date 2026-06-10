// Owner-only: correct allowed_emails.created_at to each member's REAL join date,
// taken from their earliest Stripe subscription. The onboarding migration had
// stamped every existing member's created_at with the migration date, so it
// wasn't a usable join date; this fixes it at the source for the whole app.
//
//   GET ?mode=preview  → { matched, wouldChange, sample:[{email, current, stripe}] }  (no writes)
//   GET ?mode=apply    → writes created_at for each matched member; returns counts
//
// Preview first: if the Stripe dates come back varied/historical, they're real
// and safe to apply; if they're all the migration date, the migration recreated
// subscriptions and Stripe won't help (we'd keep the manual backfill instead).

import { everSubscriberJoinDates } from "../../stripe-history.mjs";

const SUPABASE_URL  = "https://gyskfutmncprqxazgatv.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5c2tmdXRtbmNwcnF4YXpnYXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjIwMTYsImV4cCI6MjA5MTMzODAxNn0.ttC3plmhbA7ls_T3w25XgYT0WBt6O3MMu0G6NrEKI9g";
const OWNER_EMAIL   = "matthew@matthewcawood.com";
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Authorization, Content-Type", "Content-Type": "application/json" };
const json = (s, o) => new Response(JSON.stringify(o), { status: s, headers: CORS });

export default async (req) => {
  if (req.method === "OPTIONS") return new Response("", { status: 200, headers: CORS });

  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return json(401, { error: "Unauthorised" });
  const uRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON } });
  if (!uRes.ok) return json(401, { error: "Unauthorised" });
  const { email: caller } = await uRes.json();
  if (!caller || caller.toLowerCase() !== OWNER_EMAIL) return json(403, { error: "Forbidden" });

  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const STRIPE  = process.env.STRIPE_SECRET_KEY;
  if (!SERVICE || !STRIPE) return json(500, { error: "missing env (SERVICE/STRIPE)" });
  const mode = new URL(req.url).searchParams.get("mode") === "apply" ? "apply" : "preview";

  const sb = (path, opts = {}) => fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...opts, headers: {
    apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json", ...(opts.headers || {}) } });

  let joinMap;
  try { joinMap = await everSubscriberJoinDates(STRIPE); }
  catch (e) { return json(502, { error: String(e.message || e) }); }

  const mRes = await sb(`allowed_emails?select=email,created_at`);
  if (!mRes.ok) return json(502, { error: "member lookup failed", detail: await mRes.text() });
  const members = await mRes.json();

  // Members pre-registered before the platform launched, so their join date is
  // floored at launch: anyone with a Stripe date earlier than this becomes the
  // launch date; later signups keep their real date.
  const LAUNCH_FLOOR = "2026-04-22";

  const plan = [];  // { email, current, stripe }
  for (const m of members) {
    const e = (m.email || "").toLowerCase();
    const stripe = joinMap.get(e);
    if (!stripe) continue;
    let newDay = stripe.slice(0, 10);
    let newTs = stripe;
    if (newDay < LAUNCH_FLOOR) { newDay = LAUNCH_FLOOR; newTs = `${LAUNCH_FLOOR}T00:00:00Z`; }
    const curDay = (m.created_at || "").slice(0, 10);
    if (curDay !== newDay) plan.push({ email: m.email, current: curDay || "—", stripe: newTs });
  }

  if (mode === "preview") {
    return json(200, {
      mode, membersWithStripe: joinMap.size, wouldChange: plan.length,
      sample: plan.slice(0, 30).map((p) => ({ email: p.email, current: p.current, stripe: p.stripe.slice(0, 10) })),
    });
  }

  // apply
  let updated = 0; const failed = [];
  for (const p of plan) {
    const r = await sb(`allowed_emails?email=eq.${encodeURIComponent(p.email)}`, {
      method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ created_at: p.stripe }) });
    if (r.ok) updated++; else failed.push(p.email);
  }
  return json(200, { mode, updated, failed: failed.length, failedEmails: failed.slice(0, 20) });
};
