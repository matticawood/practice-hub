// JSON API behind the brand-site /manage page (Supabase can't serve rendered
// HTML on its own domain, so the UI lives on matthewcawood.com and calls this).
// Enforces the policy:
//   • Reschedule free up to 24h before  → page redirects to Cal.com.
//   • Within 24h: cancel only.
//   • Cancelling NEVER returns a package credit (we just message it).
// GET  ?uid=..   → { found, cancelled, label, dateStr, timeStr, isPackage, withinCutoff, rescheduleUrl }
// POST  { uid, action:"cancel" } → { ok } (cancels via Cal API)
// PUBLIC (called cross-origin from the brand site, no JWT).
const CAL_API_KEY = Deno.env.get("CAL_API_KEY")!;
const CAL_V = "2024-08-13";
const RESCHEDULE_CUTOFF_MS = 24 * 60 * 60 * 1000;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

async function getBooking(uid: string): Promise<any | null> {
  try {
    const r = await fetch(`https://api.cal.com/v2/bookings/${encodeURIComponent(uid)}`, {
      headers: { "Authorization": `Bearer ${CAL_API_KEY}`, "cal-api-version": CAL_V },
    });
    if (!r.ok) return null;
    return (await r.json()).data || null;
  } catch { return null; }
}

function describe(b: any) {
  const start = b.start || b.startTime;
  const tz = b.attendees?.[0]?.timeZone || "Europe/London";
  const durationMin = Number(b.duration) || (b.end ? Math.round((new Date(b.end).getTime() - new Date(start).getTime()) / 60000) : 60);
  const isLesson = durationMin === 60;
  return {
    found: true,
    cancelled: (b.status || "").toLowerCase() === "cancelled",
    label: isLesson ? "1-hour lesson" : `${durationMin}-minute clinic`,
    isPackage: (b.metadata?.source || "") === "package-credit",
    dateStr: new Date(start).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: tz }),
    timeStr: new Date(start).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz }),
    withinCutoff: (new Date(start).getTime() - Date.now()) < RESCHEDULE_CUTOFF_MS,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = new URL(req.url);

  if (req.method === "POST") {
    let body: any = {};
    try { body = await req.json(); } catch { /* ignore */ }
    const uid = body.uid || "";
    if (body.action !== "cancel" || !uid) return json({ ok: false, error: "Bad request" }, 400);
    try {
      const r = await fetch(`https://api.cal.com/v2/bookings/${encodeURIComponent(uid)}/cancel`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${CAL_API_KEY}`, "cal-api-version": CAL_V, "Content-Type": "application/json" },
        body: JSON.stringify({ cancellationReason: "Cancelled by attendee" }),
      });
      if (!r.ok) { console.error("cancel failed", r.status, await r.text()); return json({ ok: false, error: "cancel_failed" }, 502); }
      // Cal.com fires BOOKING_CANCELLED → cal-webhook sends the branded email.
      return json({ ok: true });
    } catch (e: any) { console.error("cancel error", e.message); return json({ ok: false, error: "error" }, 500); }
  }

  // GET → booking info
  const uid = url.searchParams.get("uid") || "";
  if (!uid) return json({ found: false }, 400);
  const b = await getBooking(uid);
  if (!b) return json({ found: false });
  return json({ ...describe(b), rescheduleUrl: `https://app.cal.com/reschedule/${encodeURIComponent(uid)}` });
});
