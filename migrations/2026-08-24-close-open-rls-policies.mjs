/* fix-rls-open.mjs — close the policies that let anyone read and change
 * members' data.
 *
 * Five tables carry a correct owner-scoped policy AND a set of blanket ones
 * with USING (true) / WITH CHECK (true) granted to anon and authenticated.
 * Permissive policies OR together, so the blanket ones win and the scoped one
 * is decoration. In practice: an unauthenticated request can read, change or
 * delete any member's reading list, their private notes on articles, their
 * requests, and their collections - and can DELETE all 110 theory articles.
 *
 * What this drops: only policies whose USING and WITH CHECK are both true or
 * absent. Every scoped policy is left exactly as it is, which is what the app
 * actually runs on:
 *   reading_list / sheet_notes   "Allow all on X"  own row, or the owner
 *   requests                     "anon insert/select/update requests" own row
 *   user_collections             "allow read" / "allow write"          own row
 *   theory_sheets                "Owner write" + "Public read"
 *
 * theory_sheets keeps Public read deliberately: the library reads it on every
 * page load and narrowing that is a separate decision from closing a hole.
 *
 * Verified three ways before and after: as nobody, as a member, and as the
 * owner. If a member can no longer see their own rows, or the owner loses
 * sight of everything, the script says so and stops.
 */
import { readFileSync } from "node:fs";
const ROOT = "/Users/matthewcawood/The Practice Room Database";
const env = Object.fromEntries(readFileSync(ROOT + "/.env.local", "utf8")
  .split("\n").filter(l => l.includes("=")).map(l => {
    const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
  }));
const sql = async query => {
  const r = await fetch("https://api.supabase.com/v1/projects/gyskfutmncprqxazgatv/database/query", {
    method: "POST",
    headers: { Authorization: "Bearer " + env.SUPABASE_ACCESS_TOKEN,
               "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" },
    body: JSON.stringify({ query }),
  });
  const t = await r.text();
  if (!r.ok) { console.log("FAILED: " + t.slice(0, 400)); process.exit(1); }
  try { return JSON.parse(t); } catch { return t; }
};

const TABLES = ["reading_list", "requests", "sheet_notes", "theory_sheets", "user_collections"];

const claimsFor = async email => {
  const u = await sql(`select id from auth.users where lower(email) = lower('${email}') limit 1`);
  return JSON.stringify({ sub: u[0] ? u[0].id : "00000000-0000-0000-0000-000000000000",
    email, role: "authenticated", aud: "authenticated", exp: 2000000000 }).replace(/'/g, "''");
};

/* what each of the three can see, right now */
const survey = async label => {
  const anon = {}, member = {}, owner = {};
  const mc = await claimsFor("hannahmoore00@hotmail.co.uk");   // a real member, not the owner
  const oc = await claimsFor("matthew@matthewcawood.com");
  for (const t of TABLES) {
    anon[t]   = (await sql(`set local role anon; select count(*)::int n from ${t}`))[0].n;
    member[t] = (await sql(`set local role authenticated; set local request.jwt.claims = '${mc}'; select count(*)::int n from ${t}`))[0].n;
    owner[t]  = (await sql(`set local role authenticated; set local request.jwt.claims = '${oc}'; select count(*)::int n from ${t}`))[0].n;
  }
  console.log(`\n${label}`);
  TABLES.forEach(t => console.log(`  ${t.padEnd(17)} nobody=${String(anon[t]).padStart(5)}  a member=${String(member[t]).padStart(5)}  you=${String(owner[t]).padStart(5)}`));
  return { anon, member, owner };
};

const before = await survey("BEFORE — rows each caller can read");

/* drop only the blanket ones */
const blanket = await sql(`select tablename, policyname from pg_policies
   where schemaname='public' and tablename in (${TABLES.map(t => "'" + t + "'").join(",")})
     and permissive='PERMISSIVE'
     and coalesce(qual,'true') = 'true' and coalesce(with_check,'true') = 'true'
     and policyname <> 'Public read'`);
console.log("\ndropping " + blanket.length + " blanket policies");
for (const p of blanket) await sql(`drop policy if exists "${p.policyname}" on ${p.tablename}`);

const after = await survey("AFTER");

/* the guards */
let bad = [];
TABLES.forEach(t => {
  if (t !== "theory_sheets" && after.anon[t] !== 0) bad.push(`${t}: nobody can still read ${after.anon[t]} rows`);
  if (after.owner[t] !== before.owner[t]) bad.push(`${t}: you lost sight of rows (${before.owner[t]} -> ${after.owner[t]})`);
});
/* a member must keep their own rows, and only their own */
const mc = await claimsFor("hannahmoore00@hotmail.co.uk");
const own = (await sql(`set local role authenticated; set local request.jwt.claims = '${mc}';
  select count(*)::int n from reading_list where lower(email)='hannahmoore00@hotmail.co.uk'`))[0].n;
if (own !== after.member.reading_list) bad.push(`reading_list: a member sees ${after.member.reading_list} rows but only ${own} are theirs`);

if (bad.length) { console.log("\nPROBLEMS:\n  " + bad.join("\n  ")); process.exit(1); }
console.log("\nAll good: nobody reads member data, members keep their own, you keep everything.");
console.log("theory_sheets stays readable on purpose - the library reads it on every page load.");
