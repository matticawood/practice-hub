const CAL_API_KEY = Deno.env.get("CAL_API_KEY")!;
const CAL_BASE    = "https://api.cal.com/v2";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY     = Deno.env.get("SUPABASE_ANON_KEY")!;
const OWNER_EMAIL  = "matthew@matthewcawood.com";

const cors = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// This endpoint returns customer booking PII (names, emails, times) from Cal.com,
// so it is owner-only. The Supabase anon key is itself a valid project JWT, so
// verify_jwt cannot distinguish a real user from a logged-out visitor — we must
// resolve the caller's identity and confirm it is the owner. The caller
// (admin-analytics.html) sends the owner's session access_token.
async function isOwner(req: Request): Promise<boolean> {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token || token === ANON_KEY) return false; // the anon key is not a caller identity
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return false;
    const u = await r.json();
    return String(u?.email || "").toLowerCase() === OWNER_EMAIL;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  if (!(await isOwner(req))) return json({ error: "unauthorized" }, 401);

  const url    = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (action === "upcoming") {
      const now     = new Date().toISOString();
      const future  = new Date();
      future.setDate(future.getDate() + 60);

      const params = new URLSearchParams({
        afterStart:  now,
        beforeStart: future.toISOString(),
        status:      "accepted",
        take:        "50",
      });

      const res  = await fetch(`${CAL_BASE}/bookings?${params}`, {
        headers: {
          "Authorization":    `Bearer ${CAL_API_KEY}`,
          "cal-api-version":  "2024-08-13",
        },
      });
      const data = await res.json();

      const bookings = (data.data || []).sort(
        (a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime()
      );

      return json({ bookings });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e: any) {
    console.error("clinic-admin error:", e);
    return json({ error: e.message }, 500);
  }
});
