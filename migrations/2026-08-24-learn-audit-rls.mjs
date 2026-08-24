/* 2026-08-24-learn-audit-rls.mjs
 *
 * Five policies found by the Learn-tab audit. Two let any member write content
 * that is meant to be yours alone; two hand the article library and the theory
 * course to anyone holding the anon key, which ships in the page source.
 *
 * WRITE ACCESS — gated on membership, not on being you
 *
 *   weekly_focus  focus_admin_write         FOR ALL
 *   live_events   live_events_admin_write   INSERT
 *   live_events   live_events_admin_update  UPDATE
 *
 * All three read `exists (select 1 from allowed_emails where email = <caller>)`,
 * which is true for every member. So any member could delete all 18 weekly
 * focuses, or schedule a clinic, or edit a real clinic's Zoom link. The buttons
 * are hidden behind isAdmin in JS, but that is decoration: the database accepts
 * the write from anyone. live_events DELETE was already owner-only, which is
 * what makes the other two look like an oversight rather than a decision.
 *
 * Each becomes the same owner check DELETE already uses.
 *
 * READ ACCESS — open to the world
 *
 *   theory_sheets  Public read   SELECT roles=public USING true
 *   lessons        lessons_read  SELECT roles=public
 *
 * Verified against the live REST endpoint with no account at all: 110 articles
 * with full body content, and 103 theory lessons with their blocks. The
 * theory_sheets policy dates from 20260509_fix_theory_sheets_rls.sql, whose
 * comment reads "anyone can view sheets (they're published articles)". That was
 * true when they were public articles. Library is a member surface now.
 *
 * Both become membership-gated. The published/draft split on lessons is kept
 * exactly as it is, and you still see drafts.
 *
 * NOT TOUCHED, deliberately: mmt_articles stays anon-readable. The brand site's
 * build reads it with the anon key at build/generate.mjs:765 to generate the
 * public Monday Music Tips pages. It is a public newsletter archive by design,
 * and closing it would break matthewcawood.com.
 *
 * NOTHING IN THE APP READS THESE LOGGED OUT. theory/sheets/view.html redirects
 * to / without a session; the store course player reads lessons through
 * store-access with the service role key, which bypasses RLS entirely.
 *
 * VERIFICATION. Before and after, as three callers — anon, a real member, you —
 * this counts the rows each can read and attempts a no-op write. If a member
 * loses read access to anything, or you lose write access, it reverts itself
 * and exits non-zero. Run with --revert to put all five back by hand.
 */
import { readFileSync } from "node:fs";

const ROOT = "/Users/matthewcawood/The Practice Room Database";
const env = Object.fromEntries(readFileSync(ROOT + "/.env.local", "utf8")
  .split("\n").filter(l => l.includes("=")).map(l => {
    const i = l.indexOf("=");
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
  }));
const REF = "gyskfutmncprqxazgatv";
const OWNER = "matthew@matthewcawood.com";

const sql = async query => {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: { Authorization: "Bearer " + env.SUPABASE_ACCESS_TOKEN,
               "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" },
    body: JSON.stringify({ query }),
  });
  const t = await r.text();
  if (!r.ok) { const e = new Error(t.slice(0, 300)); e.http = r.status; throw e; }
  try { return JSON.parse(t); } catch { return t; }
};
const must = async query => { try { return await sql(query); }
  catch (e) { console.log("FAILED: " + e.message); process.exit(1); } };

/* The membership test used by content_feed_posts, with the JWT read once per
   statement rather than once per row. */
const MEMBER = `exists (select 1 from allowed_emails ae
                        where lower(ae.email) = (select lower(auth.jwt() ->> 'email')))`;
const IS_OWNER = `(select lower(auth.jwt() ->> 'email')) = '${OWNER}'`;

const BEFORE = [
  `alter policy "focus_admin_write" on weekly_focus
     using (exists (select 1 from allowed_emails where allowed_emails.email = (select auth.jwt() ->> 'email')))
     with check (exists (select 1 from allowed_emails where allowed_emails.email = (auth.jwt() ->> 'email')))`,
  `alter policy "live_events_admin_write" on live_events
     with check (exists (select 1 from allowed_emails where allowed_emails.email = (auth.jwt() ->> 'email')))`,
  `alter policy "live_events_admin_update" on live_events
     using (exists (select 1 from allowed_emails where allowed_emails.email = (select auth.jwt() ->> 'email')))
     with check (exists (select 1 from allowed_emails where allowed_emails.email = (auth.jwt() ->> 'email')))`,
  `alter policy "Public read" on theory_sheets using (true)`,
  `alter policy "lessons_read" on lessons
     using ((status = 'published') or ((select lower(auth.jwt() ->> 'email')) = '${OWNER}'))`,
];

const AFTER = [
  `alter policy "focus_admin_write" on weekly_focus
     using (${IS_OWNER}) with check (${IS_OWNER})`,
  `alter policy "live_events_admin_write" on live_events
     with check (${IS_OWNER})`,
  `alter policy "live_events_admin_update" on live_events
     using (${IS_OWNER}) with check (${IS_OWNER})`,
  `alter policy "Public read" on theory_sheets using (${MEMBER})`,
  `alter policy "lessons_read" on lessons
     using ((status = 'published' and ${MEMBER}) or ${IS_OWNER})`,
];

const apply = async set => { for (const s of set) await must(s); };

if (process.argv.includes("--revert")) {
  await apply(BEFORE);
  console.log("reverted all five policies");
  process.exit(0);
}

/* ── who we test as ─────────────────────────────────────────────────────────
   A real member who is not you, so the check is against someone the app
   actually serves. */
const member = (await must(
  `select email from allowed_emails where lower(email) <> '${OWNER}' order by email limit 1`))[0].email;

const asRole = async (who, statement) => {
  if (who === "anon") return sql(`set local role anon; ${statement}`);
  const u = await must(`select id from auth.users where lower(email) = lower('${who}') limit 1`);
  const claims = JSON.stringify({ sub: u[0] ? u[0].id : "00000000-0000-0000-0000-000000000000",
    email: who, role: "authenticated", aud: "authenticated", exp: 2000000000 }).replace(/'/g, "''");
  return sql(`set local role authenticated; set local request.jwt.claims = '${claims}'; ${statement}`);
};

/* A write that changes nothing but still runs USING and WITH CHECK. */
const NOOP = {
  focus: `with u as (update weekly_focus set headline = headline
                     where id = (select id from weekly_focus order by id limit 1) returning 1)
          select count(*)::int n from u`,
  event: `with u as (update live_events set title = title
                     where id = (select id from live_events order by id limit 1) returning 1)
          select count(*)::int n from u`,
};

const snapshot = async label => {
  const row = {};
  for (const who of ["anon", member, OWNER]) {
    const r = await must(`select 0`).then(() => asRole(who, `select
      (select count(*)::int from theory_sheets) sheets,
      (select count(*)::int from lessons) lessons,
      (select count(*)::int from weekly_focus) focuses`));
    const write = async k => {
      try { return (await asRole(who, NOOP[k]))[0].n > 0 ? "YES" : "no"; }
      catch { return "no"; }
    };
    row[who] = { ...r[0], focus: await write("focus"), event: await write("event") };
  }
  console.log("\n" + label);
  for (const [k, v] of Object.entries(row))
    console.log(`  ${(k === OWNER ? "you" : k).padEnd(32)} reads: sheets ${String(v.sheets).padStart(3)}` +
                ` lessons ${String(v.lessons).padStart(3)} focuses ${String(v.focuses).padStart(3)}` +
                `   writes: focus ${v.focus.padEnd(3)} clinic ${v.event}`);
  return row;
};

const before = await snapshot("before:");
await apply(AFTER);
const after = await snapshot("after:");

/* ── the change must cost nobody anything they should still have ─────────── */
const problems = [];
for (const t of ["sheets", "lessons", "focuses"]) {
  if (after[member][t] !== before[member][t])
    problems.push(`${member} now reads ${after[member][t]} ${t}, was ${before[member][t]}`);
  if (after[OWNER][t] !== before[OWNER][t])
    problems.push(`you now read ${after[OWNER][t]} ${t}, was ${before[OWNER][t]}`);
}
if (after[OWNER].focus !== "YES") problems.push("you can no longer edit a weekly focus");
if (after[OWNER].event !== "YES") problems.push("you can no longer edit a clinic");

if (problems.length) {
  await apply(BEFORE);
  console.log("\nREVERTED, nothing kept:\n  " + problems.join("\n  "));
  process.exit(1);
}

/* ── and it must actually have closed what it was for ────────────────────── */
const open = [];
if (after[member].focus === "YES") open.push("a member can still write weekly_focus");
if (after[member].event === "YES") open.push("a member can still write live_events");
if (after.anon.sheets  > 0) open.push("anon can still read theory_sheets");
if (after.anon.lessons > 0) open.push("anon can still read lessons");
if (open.length) { console.log("\nSTILL OPEN:\n  " + open.join("\n  ")); process.exit(1); }

console.log(`\nclosed: member writes to weekly_focus and live_events, anon reads of theory_sheets and lessons.
unchanged: what ${member} and you can read, and your ability to publish.
mmt_articles left anon-readable on purpose — the brand site builds from it.`);
