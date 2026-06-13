/* Email the migrated lesson students their NEW Zoom link(s) + time, because their
   old Acuity link dies when Acuity closes. Reads the bookings we just created in
   Cal.com (stripe_session_id like 'acuity-booking-%'), groups by student (David
   has two), and sends one personalised email each. Logs to email_log and skips
   anyone already sent, so re-runs never double-send.

   Usage:
     node scripts/email-acuity-lesson-links.mjs            # dry run: writes previews to /tmp, sends nothing
     node scripts/email-acuity-lesson-links.mjs --send     # actually send

   Reads SUPABASE_SERVICE_KEY, SUPABASE_URL, RESEND_API from .env.local.
*/
import { readFileSync, writeFileSync } from "node:fs";
import { renderLessonLinkEmail } from "../email-templates.mjs";

const CAMPAIGN = "lesson-link-migration";
const FROM = "Matthew Cawood <noreply@matthewcawood.com>";
const REPLY_TO = "matthew@matthewcawood.com";
const ACCOUNT = "https://matthewcawood.com/account/";
const TZ = "Europe/London";

function envVal(name) {
  const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const m = env.match(new RegExp("^" + name + "=(.+)$", "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
}
const SUPABASE_URL = envVal("SUPABASE_URL") || "https://gyskfutmncprqxazgatv.supabase.co";
const SK = envVal("SUPABASE_SERVICE_KEY");
const RESEND = envVal("RESEND_API");
const send = process.argv.includes("--send");
if (!SK) { console.error("SUPABASE_SERVICE_KEY missing"); process.exit(1); }
if (send && !RESEND) { console.error("RESEND_API missing"); process.exit(1); }

const firstName = (n) => { const r = String(n || "").trim().split(/\s+/)[0]; return r ? r[0].toUpperCase() + r.slice(1) : "there"; };
const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });
const fmtTime = (iso) => new Date(iso).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ }).replace(" ", "").toLowerCase();
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ── Calendar helpers (mirror the booking edge functions) ──
const SUMMARY = "Piano Lesson with Matthew Cawood";
const utc = (d) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const escICS = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const lessonDesc = (zoom) => `Your 1-hour online piano lesson with Matthew Cawood.${zoom ? `\n\nJoin: ${zoom}` : ""}`;
function buildICS(uid, start, end, zoom) {
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Matthew Cawood//Lessons//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:${uid}`, `DTSTAMP:${utc(Date.now())}`, `DTSTART:${utc(start)}`, `DTEND:${utc(end)}`,
    `SUMMARY:${escICS(SUMMARY)}`, `DESCRIPTION:${escICS(lessonDesc(zoom))}`, zoom ? `LOCATION:${escICS(zoom)}` : "",
    "STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR"].filter(Boolean).join("\r\n");
}
function gcalLink(start, end, zoom) {
  const p = new URLSearchParams({ action: "TEMPLATE", text: SUMMARY, dates: `${utc(start)}/${utc(end)}`, details: lessonDesc(zoom), location: zoom || "" });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

const H = { apikey: SK, Authorization: `Bearer ${SK}`, "Content-Type": "application/json" };

// Pull the 4 migrated lessons, group by student email.
const r = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=email,attendee_name,start_time,meeting_url,cal_uid&stripe_session_id=like.acuity-booking-*&order=start_time.asc`, { headers: H });
const rows = await r.json();
if (!Array.isArray(rows) || !rows.length) { console.error("No migrated lessons found."); process.exit(1); }
const byEmail = {};
for (const b of rows) (byEmail[b.email] = byEmail[b.email] || { name: b.attendee_name, lessons: [] }).lessons.push(b);

// Who already got this email? Never double-send.
const already = new Set();
try {
  const lr = await fetch(`${SUPABASE_URL}/rest/v1/email_log?select=email&campaign=eq.${encodeURIComponent(CAMPAIGN)}&status=eq.sent`, { headers: H });
  if (lr.ok) for (const x of await lr.json()) already.add(String(x.email).toLowerCase());
} catch {}

function buildEmail(name, lessons) {
  const multi = lessons.length > 1;
  const attachments = [];
  const items = lessons.map((l, i) => {
    const endISO = new Date(new Date(l.start_time).getTime() + 60 * 60 * 1000).toISOString();
    const uid = `${l.cal_uid || `${l.start_time}-${l.email || ""}`}@matthewcawood.com`;
    attachments.push({ filename: multi ? `lesson-${i + 1}.ics` : "lesson.ics", content: Buffer.from(buildICS(uid, l.start_time, endISO, l.meeting_url), "utf8").toString("base64"), content_type: "text/calendar; method=PUBLISH" });
    return { whenLabel: `${fmtDate(l.start_time)} at ${fmtTime(l.start_time)} (UK time)`, link: l.meeting_url, calUid: l.cal_uid, gcal: gcalLink(l.start_time, endISO, l.meeting_url) };
  });
  const { subject, html } = renderLessonLinkEmail({ firstName: firstName(name), lessons: items });
  return { subject, html, attachments };
}

let n = 0;
for (const [email, { name, lessons }] of Object.entries(byEmail)) {
  const { subject, html, attachments } = buildEmail(name, lessons);
  const tag = email.replace(/[^a-z0-9]+/gi, "-");
  if (!send) {
    const path = `/tmp/lesson-link-${tag}.html`;
    writeFileSync(path, html);
    console.log(`${email}: "${subject}" — ${lessons.length} lesson(s), ${attachments.length} .ics — preview: ${path}`);
    lessons.forEach((l) => console.log(`    ${fmtDate(l.start_time)} ${fmtTime(l.start_time)}  ${l.meeting_url.slice(0, 40)}...`));
    continue;
  }
  if (already.has(email.toLowerCase())) { console.log(`skip (already sent): ${email}`); continue; }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, reply_to: REPLY_TO, to: [email], subject, html, attachments }),
  });
  const out = await res.json().catch(() => ({}));
  const ok = res.ok && out.id;
  await fetch(`${SUPABASE_URL}/rest/v1/email_log`, { method: "POST", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify({ email, campaign: CAMPAIGN, status: ok ? "sent" : "failed", resend_id: out.id || null, ...(ok ? {} : { error: String(out.message || res.status).slice(0, 300) }) }) }).catch(() => {});
  console.log(ok ? `sent: ${email}` : `FAIL: ${email} ${out.message || res.status}`);
  n++;
}
if (!send) console.log("\nDry run. Re-run with --send to email the students.");
