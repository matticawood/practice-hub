// Returns how many lesson-package credits an email has remaining.
// GET ?email=<email>  ->  { email, remaining }
// Reads with the service role (lesson_credits is owner-read RLS), returns only a count.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const email = (new URL(req.url).searchParams.get("email") || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ remaining: 0 });

  // Credits are valid for 12 months from purchase — exclude anything older.
  const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/lesson_credits?select=remaining&email=eq.${encodeURIComponent(email)}&created_at=gt.${encodeURIComponent(yearAgo)}`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
    );
    if (!res.ok) { console.error("credits read failed", res.status, await res.text()); return json({ remaining: 0 }); }
    const rows = await res.json();
    const remaining = (rows || []).reduce((s: number, r: any) => s + (Number(r.remaining) || 0), 0);
    return json({ email, remaining });
  } catch (e: any) {
    console.error("lesson-credits error:", e.message);
    return json({ remaining: 0 });
  }
});
