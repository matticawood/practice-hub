// JSON API behind the brand-site /manage page. Everything is native — the
// customer never leaves matthewcawood.com.
// Policy:
//   • Reschedule free up to 24h before  → native slot-picker → Cal API reschedule.
//   • Within 24h: cancel only.
//   • Cancelling NEVER returns a package credit (just messaged).
// GET   ?uid=..                                   → booking info (+ eventTypeId, timeZone)
// GET   ?action=slots&eventTypeId=..&startDate=..&endDate=..&timeZone=..  → availability
// GET   ?action=slots&eventTypeId=..&date=..&timeZone=..                  → one day
// POST  { uid, action:"cancel" }                  → cancel via Cal API
// POST  { uid, action:"reschedule", start }       → reschedule via Cal API
// PUBLIC (called cross-origin from the brand site, no JWT).
const CAL_API_KEY = Deno.env.get("CAL_API_KEY")!;
const CAL_BASE = "https://api.cal.com/v2";
const CAL_V = "2024-08-13";
const RESCHEDULE_CUTOFF_MS = 24 * 60 * 60 * 1000;
const calHeaders = () => ({ "Authorization": `Bearer ${CAL_API_KEY}`, "cal-api-version": CAL_V });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

async function getBooking(uid: string): Promise<any | null> {
  try {
    const r = await fetch(`${CAL_BASE}/bookings/${encodeURIComponent(uid)}`, { headers: calHeaders() });
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
    eventTypeId: b.eventTypeId ?? b.eventType?.id ?? null,
    timeZone: tz,
    dateStr: new Date(start).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: tz }),
    timeStr: new Date(start).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz }),
    withinCutoff: (new Date(start).getTime() - Date.now()) < RESCHEDULE_CUTOFF_MS,
  };
}

async function fetchSlots(url: URL) {
  const eventTypeId = url.searchParams.get("eventTypeId");
  const timeZone = url.searchParams.get("timeZone") || "Europe/London";
  const date = url.searchParams.get("date");
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  if (!eventTypeId || (!date && !startDate)) return json({ error: "Missing params" }, 400);

  let startTime: string, endTime: string;
  if (startDate && endDate) {
    startTime = `${startDate}T00:00:00Z`;
    const endD = new Date(endDate); endD.setDate(endD.getDate() + 1);
    endTime = endD.toISOString().split("T")[0] + "T00:00:00Z";
  } else {
    startTime = `${date}T00:00:00Z`;
    const end = new Date(date!); end.setDate(end.getDate() + 2);
    endTime = end.toISOString().split("T")[0] + "T00:00:00Z";
  }
  const s = new URL(`${CAL_BASE}/slots/available`);
  s.searchParams.set("eventTypeId", eventTypeId);
  s.searchParams.set("startTime", startTime);
  s.searchParams.set("endTime", endTime);
  s.searchParams.set("timeZone", timeZone);
  const res = await fetch(s.toString(), { headers: calHeaders() });
  return json(await res.json());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = new URL(req.url);

  if (req.method === "POST") {
    let body: any = {};
    try { body = await req.json(); } catch { /* ignore */ }
    const uid = body.uid || "";
    if (!uid) return json({ ok: false, error: "Bad request" }, 400);

    if (body.action === "cancel") {
      try {
        const r = await fetch(`${CAL_BASE}/bookings/${encodeURIComponent(uid)}/cancel`, {
          method: "POST", headers: { ...calHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ cancellationReason: "Cancelled by attendee" }),
        });
        if (!r.ok) { console.error("cancel failed", r.status, await r.text()); return json({ ok: false, error: "cancel_failed" }, 502); }
        return json({ ok: true });   // Cal fires BOOKING_CANCELLED → branded email
      } catch (e: any) { console.error("cancel error", e.message); return json({ ok: false, error: "error" }, 500); }
    }

    if (body.action === "reschedule") {
      const start = body.start;
      if (!start) return json({ ok: false, error: "Missing start" }, 400);
      // Re-check the 24h cutoff server-side against the CURRENT booking.
      const b = await getBooking(uid);
      if (!b) return json({ ok: false, error: "not_found" }, 404);
      if ((new Date(b.start || b.startTime).getTime() - Date.now()) < RESCHEDULE_CUTOFF_MS) {
        return json({ ok: false, error: "cutoff" }, 409);
      }
      try {
        const r = await fetch(`${CAL_BASE}/bookings/${encodeURIComponent(uid)}/reschedule`, {
          method: "POST", headers: { ...calHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ start, reschedulingReason: "Rescheduled by attendee" }),
        });
        if (!r.ok) { console.error("reschedule failed", r.status, await r.text()); return json({ ok: false, error: "reschedule_failed" }, 502); }
        const nu = (await r.json()).data?.uid || null;
        return json({ ok: true, uid: nu });   // Cal fires BOOKING_RESCHEDULED → branded email
      } catch (e: any) { console.error("reschedule error", e.message); return json({ ok: false, error: "error" }, 500); }
    }

    return json({ ok: false, error: "Unknown action" }, 400);
  }

  // GET
  if (url.searchParams.get("action") === "slots") return fetchSlots(url);

  const uid = url.searchParams.get("uid") || "";
  if (!uid) return json({ found: false }, 400);
  const b = await getBooking(uid);
  if (!b) return json({ found: false });
  return json(describe(b));
});
