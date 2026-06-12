// store-reviews-admin — owner-only review moderation. Verifies the caller's JWT
// belongs to OWNER_EMAIL, then lists all reviews or sets a review's status.
//   GET  ?action=list                    → { reviews:[...] }   (all statuses)
//   POST ?action=set  { id, status }     → { ok:true }         (pending|approved|hidden)
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const OWNER_EMAIL  = "matthew@matthewcawood.com";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Resolve the calling user's email from their bearer token (Supabase Auth).
async function callerEmail(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization") || "";
  if (!auth) return null;
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { Authorization: auth, apikey: SERVICE_KEY } });
  if (!r.ok) return null;
  const u = await r.json();
  return (u?.email || "").toLowerCase() || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const email = await callerEmail(req);
  if (email !== OWNER_EMAIL) return json({ error: "Admin only" }, 403);

  const url    = new URL(req.url);
  const action = url.searchParams.get("action") || "list";

  if (action === "list") {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/store_reviews?select=*&order=created_at.desc`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    if (!r.ok) return json({ error: await r.text() }, 500);
    return json({ reviews: await r.json() });
  }

  if (action === "set") {
    let b: any;
    try { b = await req.json(); } catch { return json({ error: "Bad JSON" }, 400); }
    const id     = Number(b.id);
    const status = String(b.status || "");
    if (!id || !["pending", "approved", "hidden"].includes(status)) return json({ error: "Bad input" }, 400);
    const patch: any = { status, approved_at: status === "approved" ? new Date().toISOString() : null };
    const r = await fetch(`${SUPABASE_URL}/rest/v1/store_reviews?id=eq.${id}`, {
      method: "PATCH",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(patch),
    });
    if (!r.ok) return json({ error: await r.text() }, 500);
    return json({ ok: true });
  }

  return json({ error: "Unknown action" }, 400);
});
