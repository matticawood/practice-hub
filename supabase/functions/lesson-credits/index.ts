// Returns how many lesson-package credits belong to a redeem token (or, during
// rollout, an email). Reads with the service role (lesson_credits is owner-read
// RLS) and returns only a count + the (masked-by-caller) email.
//
//   GET ?token=<redeem_token>   ->  { email, remaining }   (preferred)
//   GET ?email=<email>          ->  { email, remaining }   (legacy, being retired)
//
// The redeem token ships in the buyer's "package is ready" email; possessing it
// proves ownership, so it replaces the old open ?email= lookup (which let anyone
// enumerate whether an address held credits).
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const sb = (path: string) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A logged-in customer's session (OTP-verified) proves ownership of their email.
async function sessionEmail(req: Request): Promise<string> {
  const t = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!t || t === ANON_KEY) return "";
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: ANON_KEY, Authorization: `Bearer ${t}` } });
    if (!r.ok) return "";
    const u = await r.json();
    return String(u?.email || "").trim().toLowerCase();
  } catch { return ""; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const url   = new URL(req.url);
  const token = (url.searchParams.get("token") || "").trim();
  const emailParam = (url.searchParams.get("email") || "").trim().toLowerCase();

  let email = "";
  try {
    if (token) {
      if (!UUID_RE.test(token)) return json({ remaining: 0 });
      const tr = await sb(`lesson_credits?select=email&redeem_token=eq.${encodeURIComponent(token)}&limit=1`);
      const trows = tr.ok ? await tr.json() : [];
      if (!trows.length) return json({ remaining: 0 });
      email = String(trows[0].email || "").toLowerCase();
    } else {
      // Prefer a logged-in session (proves ownership). Fall back to the ?email=
      // lookup transitionally (still used by the app's clinic-booking.html); this
      // is removed once that page is on sessions, to close the enumeration oracle.
      const authed = await sessionEmail(req);
      if (authed) email = authed;
      else if (emailParam && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailParam)) email = emailParam;
      else return json({ remaining: 0 });
    }

    // Credits are valid for 12 months from purchase — exclude anything older.
    const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const res = await sb(`lesson_credits?select=remaining&email=eq.${encodeURIComponent(email)}&created_at=gt.${encodeURIComponent(yearAgo)}`);
    if (!res.ok) { console.error("credits read failed", res.status, await res.text()); return json({ remaining: 0 }); }
    const rows = await res.json();
    const remaining = (rows || []).reduce((s: number, r: any) => s + (Number(r.remaining) || 0), 0);
    return json({ email, remaining });
  } catch (e: any) {
    console.error("lesson-credits error:", e.message);
    return json({ remaining: 0 });
  }
});
