// course-progress — records how far a buyer gets through a store course.
//   POST { token, lessonId, lessonIndex?, lessonTitle?, status }
//     token   = the buyer's store_orders.access_token (the course access link)
//     status  = "viewed" | "completed"
// The access_token is the gate: we resolve the buyer's email + course slug from
// it (service role), then upsert one row per (email, slug, lesson). "completed"
// never downgrades to "viewed". Read by the owner in admin analytics.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

async function lookupOrder(token: string): Promise<{ slug: string; kind: string; email: string } | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/store_orders?access_token=eq.${encodeURIComponent(token)}&select=slug,kind,email&limit=1`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } });
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ ok: false, error: "Bad JSON" }, 400); }

  const token   = String(body?.token || "");
  const lessonId = String(body?.lessonId || "");
  const status  = body?.status === "completed" ? "completed" : "viewed";
  const lessonIndex = Number.isInteger(body?.lessonIndex) ? body.lessonIndex : null;
  const lessonTitle = body?.lessonTitle ? String(body.lessonTitle).slice(0, 300) : null;

  if (!token || !lessonId) return json({ ok: false, error: "Missing token or lessonId" }, 400);

  const order = await lookupOrder(token);
  if (!order || order.kind !== "course") return json({ ok: false, error: "Invalid access link" }, 403);

  const email = order.email.toLowerCase();
  const now   = new Date().toISOString();

  // Has this buyer already got a row for this lesson? (so we never downgrade
  // completed -> viewed, and keep the first_viewed_at).
  const existRes = await fetch(
    `${SUPABASE_URL}/rest/v1/course_progress?email=eq.${encodeURIComponent(email)}` +
    `&slug=eq.${encodeURIComponent(order.slug)}&lesson_id=eq.${encodeURIComponent(lessonId)}&select=status&limit=1`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } });
  const existing = existRes.ok ? (await existRes.json())[0] : null;
  const newStatus = existing?.status === "completed" ? "completed" : status;

  // Upsert on (email, slug, lesson_id). merge-duplicates keeps first_viewed_at.
  const up = await fetch(`${SUPABASE_URL}/rest/v1/course_progress?on_conflict=email,slug,lesson_id`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      email, slug: order.slug, lesson_id: lessonId,
      lesson_index: lessonIndex, lesson_title: lessonTitle,
      status: newStatus, updated_at: now,
    }),
  });
  if (!up.ok) return json({ ok: false, error: "Save failed" }, 500);

  return json({ ok: true });
});
