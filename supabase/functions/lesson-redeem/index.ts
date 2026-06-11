// Redeem one lesson-package credit to book a 1-hour lesson — NO payment.
// POST { email, eventTypeId, startTime, name, timeZone, notes?, fileUrl? }
// Gate: the email must have remaining > 0. Books the Cal.com lesson, then
// decrements the oldest credit row. Emails Matt + the student.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const CAL_API_KEY  = Deno.env.get("CAL_API_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const NOTIFY_TO   = "matthew@matthewcawood.com";
const NOTIFY_FROM = "bookings@matthewcawood.com";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

async function sb(path: string, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { email: rawEmail, eventTypeId, startTime, name, timeZone, notes, fileUrl } = await req.json();
    const email = String(rawEmail || "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Invalid email" }, 400);
    if (!eventTypeId || !startTime) return json({ error: "Missing slot" }, 400);

    // oldest credit row with remaining > 0
    const cr = await sb(`lesson_credits?select=id,remaining&email=eq.${encodeURIComponent(email)}&remaining=gt.0&order=created_at.asc&limit=1`);
    const rows = cr.ok ? await cr.json() : [];
    if (!rows.length) return json({ error: "No lessons remaining for this email." }, 402);
    const credit = rows[0];

    // Book the Cal.com lesson (mirrors clinic-webhook booking call)
    const bookingBody: Record<string, unknown> = {
      eventTypeId: Number(eventTypeId),
      start: startTime,
      attendee: { name: name || "Student", email, timeZone: timeZone || "Europe/London", language: "en" },
      metadata: { source: "package-credit", ...(notes ? { notes: String(notes).slice(0, 490) } : {}), ...(fileUrl ? { attachmentUrl: String(fileUrl).slice(0, 500) } : {}) },
    };
    const calRes = await fetch("https://api.cal.com/v2/bookings", {
      method: "POST",
      headers: { "Authorization": `Bearer ${CAL_API_KEY}`, "cal-api-version": "2024-08-13", "Content-Type": "application/json" },
      body: JSON.stringify(bookingBody),
    });
    const booking = await calRes.json();
    if (booking.status !== "success") {
      console.error("Cal.com booking failed:", JSON.stringify(booking));
      return json({ error: "That slot is no longer available — please pick another." }, 409);
    }

    // Decrement the credit only after a successful booking.
    await sb(`lesson_credits?id=eq.${credit.id}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ remaining: Number(credit.remaining) - 1, updated_at: new Date().toISOString() }),
    });

    // Remaining after this redemption (across all rows)
    const after = await sb(`lesson_credits?select=remaining&email=eq.${encodeURIComponent(email)}`);
    const remaining = after.ok ? (await after.json()).reduce((s: number, r: any) => s + (Number(r.remaining) || 0), 0) : 0;

    // Emails (best-effort)
    const data = booking.data || {};
    const zoomUrl = data.meetingUrl || data.videoCallData?.url || null;
    const startISO = data.start || startTime;
    const tz = timeZone || "Europe/London";
    const dateStr = new Date(startISO).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: tz });
    const timeStr = new Date(startISO).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz });
    const send = (to: string, subject: string, html: string) =>
      fetch("https://api.resend.com/emails", { method: "POST", headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: NOTIFY_FROM, to: [to], subject, html }) }).catch(() => {});
    await Promise.all([
      send(NOTIFY_TO, `Package lesson booked: ${name || email} · ${dateStr}`,
        `<div style="font-family:system-ui,sans-serif"><h2>Package lesson booked 🎹</h2><p><strong>${name || "—"}</strong> (${email}) · 1-hour lesson<br>${dateStr} at ${timeStr} (${tz})</p>${zoomUrl ? `<p><a href="${zoomUrl}">Join Zoom →</a></p>` : ""}${notes ? `<p style="background:#f9f9f9;padding:10px;border-radius:6px">${String(notes).replace(/\n/g, "<br>")}</p>` : ""}<p style="color:#888;font-size:.8rem">Credits remaining: ${remaining}</p></div>`),
      send(email, `Your lesson is booked 🎹`,
        `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1a1410"><h2 style="color:#42382e">You're booked in.</h2><p style="line-height:1.7">Your 1-hour lesson with Matthew is confirmed for <strong>${dateStr} at ${timeStr}</strong> (${tz}).</p>${zoomUrl ? `<p><a href="${zoomUrl}" style="display:inline-block;background:#f5c518;color:#3a2f12;font-weight:700;text-decoration:none;padding:11px 20px;border-radius:9px">Join the Zoom call →</a></p>` : "<p style='line-height:1.7'>You'll receive your meeting link by email.</p>"}<p style="font-size:.85rem;color:#8a7868;margin-top:18px">Lessons remaining in your package: <strong>${remaining}</strong>.</p></div>`),
    ]);

    return json({ ok: true, remaining });
  } catch (e: any) {
    console.error("lesson-redeem error:", e.message);
    return json({ error: "Something went wrong." }, 500);
  }
});
