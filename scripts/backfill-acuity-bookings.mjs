/* Import the upcoming Acuity-booked lessons into the bookings table so they show
   on each student's My Account → Lessons (with the working direct Zoom link, in
   their own timezone). The original Acuity join links break when Acuity is
   cancelled; these are the replacement Zoom meetings (already in Matthew's Zoom
   account). cal_uid is left null on purpose: these aren't Cal.com bookings, so no
   "Manage" link should show. Idempotent via the unique stripe_session_id.

   Times are BST (UTC+1) converted to UTC ISO. Run after the credits already exist.

   Usage:
     node scripts/backfill-acuity-bookings.mjs        # insert
     node scripts/backfill-acuity-bookings.mjs --dry  # preview only

   Reads SUPABASE_SERVICE_KEY, SUPABASE_URL from .env.local.
*/
import { readFileSync } from "node:fs";

function envVal(name) {
  const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const m = env.match(new RegExp("^" + name + "=(.+)$", "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
}
const SUPABASE_URL = envVal("SUPABASE_URL") || "https://gyskfutmncprqxazgatv.supabase.co";
const SK = envVal("SUPABASE_SERVICE_KEY");
if (!SK) { console.error("SUPABASE_SERVICE_KEY missing from .env.local"); process.exit(1); }
const dry = process.argv.includes("--dry");

// start = UTC ISO (BST -1h). meeting_url = the new direct Zoom link.
const ROWS = [
  { email: "david@pugh.fun",         name: "David Pugh",   start: "2026-06-18T13:00:00Z", url: "https://us06web.zoom.us/j/89263083122?pwd=XfCtEOqX9y1gHyQtULPTamMuwFztoH.1", sid: "acuity-booking-david-18jun" },
  { email: "david@pugh.fun",         name: "David Pugh",   start: "2026-06-25T11:00:00Z", url: "https://us06web.zoom.us/j/84445526659?pwd=tVvYIgCY9JaDtO7dXrPBSODlkxelWQ.1", sid: "acuity-booking-david-25jun" },
  { email: "pink.3@btinternet.com",  name: "Liam Moore",   start: "2026-06-25T12:00:00Z", url: "https://us06web.zoom.us/j/87177344827?pwd=Q7xPBVCTqSN87QQW8PSx2qVb6wXDTa.1", sid: "acuity-booking-liam-25jun" },
  { email: "charlesfuad24@gmail.com", name: "Charles Fuad", start: "2026-06-25T13:00:00Z", url: "https://us06web.zoom.us/j/85807013387?pwd=QyOZIqFackcDtedoUcpwG5CWgTKIzU.1", sid: "acuity-booking-charles-25jun" },
];

console.log(`${ROWS.length} booking(s):`);
ROWS.forEach(r => console.log(`  ${r.email}  ${r.start}  (${r.name})`));
if (dry) { console.log("\nDry run, nothing written."); process.exit(0); }

const H = { apikey: SK, Authorization: `Bearer ${SK}`, "Content-Type": "application/json" };
let made = 0, existed = 0, failed = 0;
for (const r of ROWS) {
  const row = {
    email: r.email, kind: "1-hour lesson", start_time: r.start, meeting_url: r.url,
    status: "accepted", attendee_name: r.name, attendee_timezone: "Europe/London",
    stripe_session_id: r.sid,
  };
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
      method: "POST",
      headers: { ...H, Prefer: "resolution=ignore-duplicates,return=representation" },
      body: JSON.stringify(row),
    });
    if (!res.ok) { failed++; console.error("  FAIL", r.email, res.status, await res.text()); continue; }
    const out = await res.json();
    if (Array.isArray(out) && out.length) made++; else existed++;
  } catch (e) { failed++; console.error("  ERROR", r.email, e.message); }
}
console.log(`Done. inserted=${made} already-existed=${existed} failed=${failed}`);
