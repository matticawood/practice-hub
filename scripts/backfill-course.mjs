/* Backfill existing Shopify/Tevello course buyers into the new system so they
   keep access via the My Account hub. NO emails are sent.

   For each buyer email it inserts a store_orders row:
     kind=course, slug=the-art-of-understanding-music,
     stripe_session_id=backfill-<sanitised-email> (idempotent),
     amount_minor=null (never counts as revenue).
   It also adds them to email_contacts + the monday-music-tips/customers lists,
   mirroring store-webhook.

   Usage:
     node scripts/backfill-course.mjs path/to/buyers.csv        # real run
     node scripts/backfill-course.mjs path/to/buyers.csv --dry  # preview only

   The file can be a CSV export or a plain list; any email addresses found in it
   are used (one order per unique email). Reads SUPABASE_SERVICE_KEY from .env.local.
*/
import { readFileSync } from "node:fs";

const SUPABASE_URL = "https://gyskfutmncprqxazgatv.supabase.co";
const SLUG = "the-art-of-understanding-music";

function serviceKey() {
  const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const m = env.match(/^SUPABASE_SERVICE_KEY=(.+)$/m);
  if (!m) throw new Error("SUPABASE_SERVICE_KEY not found in .env.local");
  return m[1].trim().replace(/^["']|["']$/g, "");
}

const file = process.argv[2];
const dry  = process.argv.includes("--dry");
if (!file) { console.error("Usage: node scripts/backfill-course.mjs <buyers.csv> [--dry]"); process.exit(1); }

const OWNER = new Set(["matthew@matthewcawood.com", "enquiries@matthewcawood.com", "mondaymusictips@matthewcawood.com", "store@matthewcawood.com", "mattycawoods@hotmail.com"]);
const raw = readFileSync(file, "utf8");
const emails = [...new Set((raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []).map(e => e.toLowerCase()))].filter(e => !OWNER.has(e));
if (!emails.length) { console.error("No email addresses found in", file); process.exit(1); }

console.log(`Found ${emails.length} unique buyer email(s).${dry ? " (dry run, nothing will be written)" : ""}`);
if (dry) { emails.slice(0, 10).forEach(e => console.log("  " + e)); if (emails.length > 10) console.log(`  …and ${emails.length - 10} more`); process.exit(0); }

const SK = serviceKey();
const H = { apikey: SK, Authorization: `Bearer ${SK}`, "Content-Type": "application/json" };
const sanitize = (e) => "backfill-" + e.replace(/[^a-z0-9]+/gi, "-");

let inserted = 0, skipped = 0, failed = 0;
for (const email of emails) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/store_orders`, {
      method: "POST",
      headers: { ...H, Prefer: "resolution=ignore-duplicates,return=representation" },
      body: JSON.stringify({ stripe_session_id: sanitize(email), email, slug: SLUG, kind: "course", amount_minor: null, currency: null }),
    });
    if (!res.ok) { failed++; console.error("  FAIL", email, res.status, await res.text()); continue; }
    const rows = await res.json();
    if (Array.isArray(rows) && rows.length) inserted++; else skipped++;
    // Add to contacts + lists (mirrors store-webhook), best-effort.
    await fetch(`${SUPABASE_URL}/rest/v1/email_contacts`, { method: "POST", headers: { ...H, Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify({ email, notes: "course-backfill" }) }).catch(() => {});
    for (const list of ["monday-music-tips", "customers"]) {
      await fetch(`${SUPABASE_URL}/rest/v1/email_list_subscriptions`, { method: "POST", headers: { ...H, Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ email, list_slug: list, opted_out: false }) }).catch(() => {});
    }
  } catch (e) { failed++; console.error("  ERROR", email, e.message); }
}
console.log(`Done. inserted=${inserted} already-existed=${skipped} failed=${failed}`);
