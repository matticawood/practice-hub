/* Make the imported Acuity lessons manageable: recreate each as a real Cal.com
   booking (so the in-house /manage reschedule + cancel works on them), WITHOUT
   notifying the customer and WITHOUT spinning up a new Zoom meeting.

   For each bookings row with stripe_session_id like 'acuity-booking-%' and no
   cal_uid yet, it:
     - POSTs a Cal.com v2 booking on the 1-hour lesson event type at the same
       start time, with the attendee email MASKED (bookings-noreply@) so Cal.com
       sends the customer nothing, the real email in metadata.customerEmail (so
       our own cal-webhook still emails them on any later reschedule/cancel), and
       the EXISTING Zoom link pinned as the booking location (so Cal.com reuses it
       instead of generating a new meeting, and reschedules keep the same link).
     - PATCHes the bookings row with the returned cal_uid + event_type_id, so the
       My Account "Manage" button appears and routes to the in-house /manage page.

   Idempotent: a row that already has cal_uid is skipped, so re-running is safe.

   Usage:
     node scripts/link-acuity-bookings-to-calcom.mjs --limit 1   # probe: do the first only, print the full Cal.com response
     node scripts/link-acuity-bookings-to-calcom.mjs             # do all remaining
     node scripts/link-acuity-bookings-to-calcom.mjs --dry       # show what would be done, call nothing

   Reads CAL_API_KEY, SUPABASE_SERVICE_KEY, SUPABASE_URL from .env.local.
   (CAL_API_KEY is normally only a Supabase secret — add it to .env.local to run this.)
*/
import { readFileSync } from "node:fs";

function envVal(name) {
  const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const m = env.match(new RegExp("^" + name + "=(.+)$", "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
}
const SUPABASE_URL = envVal("SUPABASE_URL") || "https://gyskfutmncprqxazgatv.supabase.co";
const SK = envVal("SUPABASE_SERVICE_KEY");
const CAL_API_KEY = envVal("CAL_API_KEY");

const dry = process.argv.includes("--dry");
const li = process.argv.indexOf("--limit");
const limit = li > -1 ? parseInt(process.argv[li + 1], 10) || 0 : 0;

const EVENT_1HR = 5982378;                              // "1-hour lesson" Cal.com event type
const MASK_EMAIL = "bookings-noreply@matthewcawood.com"; // void inbox; mirrors lesson-redeem
const CAL_V = "2024-08-13";

if (!SK) { console.error("SUPABASE_SERVICE_KEY missing from .env.local"); process.exit(1); }
if (!dry && !CAL_API_KEY) { console.error("CAL_API_KEY missing from .env.local (it's normally only a Supabase secret — add it to run this)."); process.exit(1); }

const H = { apikey: SK, Authorization: `Bearer ${SK}`, "Content-Type": "application/json" };

// Pull the imported Acuity bookings that aren't linked to Cal.com yet.
const r = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=id,email,start_time,meeting_url,attendee_name,attendee_timezone,cal_uid,stripe_session_id&stripe_session_id=like.acuity-booking-*&cal_uid=is.null&order=start_time.asc`, { headers: H });
let rows = await r.json();
if (!Array.isArray(rows)) { console.error("Read failed:", JSON.stringify(rows)); process.exit(1); }
if (limit > 0) rows = rows.slice(0, limit);

console.log(`${rows.length} booking(s) to link${dry ? " (dry run)" : ""}:`);
rows.forEach(b => console.log(`  ${b.attendee_name} (${b.email}) | ${b.start_time}`));
if (!rows.length) { console.log("Nothing to do (all already linked)."); process.exit(0); }
if (dry) process.exit(0);

let linked = 0, failed = 0;
for (const b of rows) {
  // The 1-hour event type only allows its Zoom integration as the location, so we
  // let Cal.com generate its own Zoom meeting and use that fresh link. We then
  // email each student the new link directly (their old Acuity link is in their
  // inbox/calendar and dies with Acuity, so a fresh link in hand is the safe path).
  const body = {
    eventTypeId: EVENT_1HR,
    start: b.start_time,
    attendee: { name: b.attendee_name || "Student", email: MASK_EMAIL, timeZone: b.attendee_timezone || "Europe/London", language: "en" },
    metadata: { source: "acuity-migration", customerEmail: b.email, customerName: b.attendee_name || "Student" },
  };
  try {
    const res = await fetch("https://api.cal.com/v2/bookings", {
      method: "POST",
      headers: { Authorization: `Bearer ${CAL_API_KEY}`, "cal-api-version": CAL_V, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const out = await res.json();
    if (out.status !== "success" || !out.data?.uid) {
      failed++; console.error("  Cal.com FAIL", b.email, JSON.stringify(out).slice(0, 500)); continue;
    }
    const d = out.data;
    const newZoom = d.meetingUrl || d.videoCallData?.url || null;
    console.log(`\n  ✓ ${b.email}: uid=${d.uid}`);
    console.log(`    old Acuity link (now unused): ${b.meeting_url}`);
    console.log(`    new Cal.com Zoom link:        ${newZoom || "(NONE — Zoom integration not generating a link!)"}`);
    if (!newZoom) { failed++; console.error("    STOP: Cal.com returned no Zoom link. Check the event type's Zoom integration before continuing."); continue; }
    // Link the row for Manage + reschedule, and store the new Cal.com Zoom link.
    const pr = await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${b.id}`, {
      method: "PATCH", headers: { ...H, Prefer: "return=minimal" },
      body: JSON.stringify({ cal_uid: d.uid, event_type_id: String(EVENT_1HR), meeting_url: newZoom }),
    });
    if (!pr.ok) { failed++; console.error("    row PATCH failed:", await pr.text()); continue; }
    linked++;
  } catch (e) { failed++; console.error("  ERROR", b.email, e.message); }
}
console.log(`\nDone. linked=${linked} failed=${failed}`);
console.log("If this was a probe (--limit 1): check the customer was NOT emailed, the Zoom link matches, then re-run with no --limit for the rest.");
