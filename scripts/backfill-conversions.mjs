/* Backfill a signup_conversions row for every existing member, so the conversion
   count reflects everyone who has actually signed up (not just the 1 whose visitor
   id round-tripped through Stripe). vid/source stay null for these (source unknown,
   pre-attribution). The one already-attributed row is left untouched.

   Run AFTER applying supabase/migrations/20260626_conversions_count_all.sql.

     node scripts/backfill-conversions.mjs --dry   # preview
     node scripts/backfill-conversions.mjs         # real run

   Reads SUPABASE_SERVICE_KEY + SUPABASE_URL from .env.local.
*/
import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const g = (k) => (env.match(new RegExp("^" + k + "=(.+)$", "m")) || [])[1]?.trim();
const URL_ = g("SUPABASE_URL"), KEY = g("SUPABASE_SERVICE_KEY");
const DRY = process.argv.includes("--dry");
const h = { apikey: KEY, Authorization: `Bearer ${KEY}`, "content-type": "application/json" };

const members = await (await fetch(`${URL_}/rest/v1/allowed_emails?select=email,created_at`, { headers: h })).json();
const existing = await (await fetch(`${URL_}/rest/v1/signup_conversions?select=email`, { headers: h })).json();
const have = new Set((existing || []).map((r) => (r.email || "").toLowerCase()));

const toAdd = (members || [])
  .filter((m) => m.email && !have.has(m.email.toLowerCase()))
  .map((m) => ({ email: m.email, vid: null, source: null, ts: m.created_at || null }));

console.log(`members: ${members.length} | already in conversions: ${have.size} | to backfill: ${toAdd.length}`);
if (DRY) { console.log("DRY RUN — nothing written. Sample:", JSON.stringify(toAdd.slice(0, 3), null, 2)); process.exit(0); }
if (!toAdd.length) { console.log("Nothing to backfill."); process.exit(0); }

// insert in chunks; ignore-duplicates so re-runs are safe
let done = 0;
for (let i = 0; i < toAdd.length; i += 100) {
  const chunk = toAdd.slice(i, i + 100);
  const r = await fetch(`${URL_}/rest/v1/signup_conversions`, {
    method: "POST",
    headers: { ...h, Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify(chunk),
  });
  if (!r.ok) { console.error("insert failed:", r.status, (await r.text()).slice(0, 200)); process.exit(1); }
  done += chunk.length;
}
console.log(`Backfilled ${done} conversion rows.`);
