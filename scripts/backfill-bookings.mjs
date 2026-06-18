/* Backfill existing UPCOMING Cal.com bookings into the `bookings` table (with
   cal_uid / start_time / meeting_url / email) so they appear in the customer's
   My Account hub. Going forward, clinic-webhook + lesson-redeem populate these
   fields on creation; this catches bookings made before that shipped.

   Cal.com has no "list by attendee email" endpoint, so we list all upcoming
   bookings and read the real customer email from booking.metadata.customerEmail.
   Idempotent: skips a booking whose cal_uid is already recorded.

   Usage:  node scripts/backfill-bookings.mjs [--dry]
   Reads SUPABASE_SERVICE_KEY and CAL_API_KEY from .env.local.
*/
import { readFileSync } from "node:fs";

const SUPABASE_URL = "https://gyskfutmncprqxazgatv.supabase.co";

function envVal(name) {
  const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const m = env.match(new RegExp(`^${name}=(.+)$`, "m"));
  if (!m) throw new Error(`${name} not found in .env.local`);
  return m[1].trim().replace(/^["']|["']$/g, "");
}

const dry = process.argv.includes("--dry");
const SK  = envVal("SUPABASE_SERVICE_KEY");
const CAL = envVal("CAL_API_KEY");
const H   = { apikey: SK, Authorization: `Bearer ${SK}`, "Content-Type": "application/json" };

const nowISO = new Date().toISOString();
const res = await fetch(`https://api.cal.com/v2/bookings?afterStart=${encodeURIComponent(nowISO)}&status=accepted&take=100&sortStart=asc`, {
  headers: { Authorization: `Bearer ${CAL}`, "cal-api-version": "2024-08-13" },
});
if (!res.ok) { console.error("Cal.com list failed:", res.status, await res.text()); process.exit(1); }
const body = await res.json();
const bookings = body.data || [];
console.log(`Cal.com returned ${bookings.length} upcoming booking(s).${dry ? " (dry run)" : ""}`);

const kindFromDuration = (d) => (d === 20 ? "20min" : d === 30 ? "30min" : d === 60 ? "60min" : "lesson");

let added = 0, skipped = 0, noEmail = 0;
for (const b of bookings) {
  const uid = b.uid;
  const email = (b.metadata?.customerEmail || b.attendees?.[0]?.email || "").toLowerCase();
  if (!uid) continue;
  if (!email || email.includes("noreply")) { noEmail++; continue; }   // masked attendee email — skip
  const meeting = b.meetingUrl || b.videoCallData?.url || null;
  const row = {
    email, kind: kindFromDuration(Number(b.duration)), amount_minor: null, currency: null,
    cal_uid: uid, start_time: b.start || null, meeting_url: meeting,
    status: b.status || "accepted", event_type_id: String(b.eventTypeId || ""),
    attendee_timezone: b.attendees?.[0]?.timeZone || null, attendee_name: b.attendees?.[0]?.name || null,
  };
  if (dry) { console.log("  would add:", email, b.start, uid); continue; }
  // Idempotent: skip if this cal_uid is already recorded.
  const exists = await fetch(`${SUPABASE_URL}/rest/v1/bookings?cal_uid=eq.${encodeURIComponent(uid)}&select=id&limit=1`, { headers: H });
  if (exists.ok && (await exists.json()).length) { skipped++; continue; }
  const ins = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, { method: "POST", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify(row) });
  if (ins.ok) added++; else console.error("  FAIL", uid, ins.status, await ins.text());
}
console.log(`Done. added=${added} already-recorded=${skipped} skipped-no-email=${noEmail}`);
