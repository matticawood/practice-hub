// Sends each student a reminder ~1 hour before their booked lesson, with the
// Zoom join link, the time in their own timezone, and reschedule/cancel links.
//
// Runs every 5 min on the PRODUCTION deploy (Netlify scheduled functions only
// run on prod, never on branch deploys). Idempotent: each bookings row is
// stamped with reminder_sent_at after a successful send, so it can't double-fire
// even though a booking sits in the 55-65 min window for a couple of ticks.
//
// Env (already set for the other mailers): SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY.
import { renderLessonReminderEmail } from "../../email-templates.mjs";

export const config = { schedule: "*/5 * * * *" };

const SUPABASE_URL = "https://gyskfutmncprqxazgatv.supabase.co";

export default async () => {
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const RESEND = process.env.RESEND_API_KEY;
  const FROM = process.env.BOOKINGS_FROM || "Matthew Cawood <bookings@matthewcawood.com>";
  const REPLY_TO = process.env.REPLY_TO || "matthew@matthewcawood.com";
  if (!SERVICE || !RESEND) { console.error("lesson-reminders: missing env (SERVICE/RESEND)"); return new Response("missing env", { status: 500 }); }

  const sb = (path, opts = {}) =>
    fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...opts, headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json", ...(opts.headers || {}) } });

  // Lessons starting ~1 hour out, not yet reminded. The 5-min cron guarantees
  // each booking lands in this 10-min window at least once.
  const loIso = new Date(Date.now() + 55 * 60000).toISOString();
  const hiIso = new Date(Date.now() + 65 * 60000).toISOString();

  const res = await sb(
    `bookings?select=id,email,attendee_name,attendee_timezone,start_time,meeting_url,cal_uid,status` +
      `&reminder_sent_at=is.null&start_time=gte.${loIso}&start_time=lte.${hiIso}`
  );
  if (!res.ok) { console.error("lesson-reminders: query failed", await res.text()); return new Response("db error", { status: 500 }); }
  const due = (await res.json()).filter((b) => b.email && (b.status || "").toLowerCase() !== "cancelled");
  if (!due.length) return new Response("no lessons due", { status: 200 });

  const firstName = (name) => { const r = String(name || "").trim().split(/\s+/)[0]; return r ? r[0].toUpperCase() + r.slice(1) : "there"; };

  let sent = 0;
  for (const b of due) {
    const tz = b.attendee_timezone || "Europe/London";
    const dateStr = new Date(b.start_time).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: tz });
    const timeStr = new Date(b.start_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz });
    const html = renderLessonReminderEmail({ firstName: firstName(b.attendee_name), dateStr, timeStr, tz, zoom: b.meeting_url, calUid: b.cal_uid });

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, reply_to: REPLY_TO, to: [b.email], subject: "Your lesson with Matthew starts in about an hour", html }),
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok) { console.error("lesson-reminders: send failed", b.id, out?.message || r.status); continue; }

    await sb(`email_log`, { method: "POST", headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ email: b.email, campaign: "lesson_reminder", status: "sent", resend_id: out.id || null, meta: { booking_id: b.id } }) }).catch(() => {});
    // Stamp only after a successful send; a failure retries next tick.
    const mark = await sb(`bookings?id=eq.${b.id}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ reminder_sent_at: new Date().toISOString() }) });
    if (!mark.ok) console.error("lesson-reminders: stamp failed", b.id, await mark.text());
    else sent++;
  }
  return new Response(`reminded ${sent}`, { status: 200 });
};
