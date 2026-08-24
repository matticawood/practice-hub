/* 2026-08-24-tools-audit-rls.mjs
 *
 * The Tools audit, same shape as the Learn one. Four surfaces: Practice Tools,
 * Pieces Library, Glossary, Key Explorer.
 *
 * 1. ANYONE CAN POST A SCORE UNDER SOMEONE ELSE'S NAME
 *
 *      chord_game_scores  "Authenticated users can insert chord scores"  check: true
 *      ear_game_scores    "Authenticated users can insert ear scores"    check: true
 *      note_game_scores   note_game_scores_insert                        check: true
 *      note_game_scores   note_game_scores_insert_auth                   check: true
 *
 *    Every row carries its own email and name, an INSERT policy has no USING
 *    clause, and WITH CHECK is literally true. There are no triggers on these
 *    tables and no column defaults on email or name, so nothing else fills them
 *    in. Any member can write a score of any value under any member's address,
 *    and it appears on the leaderboard under that person's name.
 *
 *    interval_game_scores already does it right:
 *      check: lower(email) = lower(auth.jwt() ->> 'email')
 *    The other three are given that same check. note_game_scores also has two
 *    identical INSERT policies and two identical SELECT policies; permissive
 *    policies OR together, so the duplicates are redundant and the _auth pair
 *    is dropped.
 *
 * 2. INTERVAL SCORES LEAK MEMBER EMAIL ADDRESSES TO ANYONE
 *
 *      interval_game_scores  interval_scores_select  roles={public} USING true
 *
 *    Confirmed against the live REST endpoint with no account: 566 rows, each
 *    carrying a member's email and real name. Its three sibling tables are
 *    scoped to authenticated and correctly return nothing; this one was missed.
 *    This is the only finding here that exposes personal data rather than
 *    content.
 *
 * 3. ANY MEMBER CAN REWRITE THE GLOSSARY
 *
 *      glossary  glossary_write  FOR ALL
 *      using: exists (select 1 from allowed_emails where email = <caller>)
 *
 *    The same bug as weekly_focus: membership, not ownership. All 1,164 entries
 *    are editable and deletable by any member. Becomes the owner check.
 *
 * 4. CONTENT READABLE WITHOUT AN ACCOUNT
 *
 *      glossary        1,164 entries
 *      pieces            426 pieces
 *      tag_categories     50 rows
 *
 *    Same class as theory_sheets and lessons, and closed the same way: scoped
 *    to the authenticated role with a membership test. Scoping the role matters
 *    as much as the predicate — the membership test reads allowed_emails, which
 *    anon holds no grant on, so a policy left open to public would fail with a
 *    400 naming that table instead of returning nothing.
 *
 *    Nothing public reads these: the brand site's build touches only
 *    mmt_articles and store_reviews.
 *
 * NOT CHANGED, and why:
 *   - note/chord/ear SELECT stay `to authenticated USING true`. Members are
 *     meant to see each other on the leaderboard, and anon already gets nothing.
 *     interval's SELECT is brought into line with those three rather than made
 *     stricter than them.
 *   - streak_tokens, user_pieces, user_collections, requests, passage_games are
 *     all correctly scoped to the caller's own row already.
 *   - note_game_leaderboard is a view with security_invoker=true, so it obeys
 *     note_game_scores' policies rather than bypassing them.
 *
 * VERIFICATION. Before and after, as anon, a real member and you: what each can
 * read, whether a member can forge a score under your address, and whether a
 * member can edit the glossary. Reverts itself and exits non-zero if a member
 * or you lose anything. The forgery probe writes a row and always removes it,
 * in a finally block, whichever way the run goes. --revert restores all nine.
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
const must = async q => { try { return await sql(q); }
  catch (e) { console.log("FAILED: " + e.message); process.exit(1); } };

const MEMBER = `exists (select 1 from allowed_emails ae
                        where lower(ae.email) = (select lower(auth.jwt() ->> 'email')))`;
const IS_OWNER = `(select lower(auth.jwt() ->> 'email')) = '${OWNER}'`;
const IS_SELF  = `lower(email) = lower(auth.jwt() ->> 'email')`;

const BEFORE = [
  `alter policy "Authenticated users can insert chord scores" on chord_game_scores with check (true)`,
  `alter policy "Authenticated users can insert ear scores" on ear_game_scores with check (true)`,
  `alter policy "note_game_scores_insert" on note_game_scores with check (true)`,
  `create policy "note_game_scores_insert_auth" on note_game_scores for insert to authenticated with check (true)`,
  `create policy "note_game_scores_select_auth" on note_game_scores for select to authenticated using (true)`,
  `alter policy "interval_scores_select" on interval_game_scores to public`,
  `alter policy "interval_scores_select" on interval_game_scores using (true)`,
  `alter policy "glossary_write" on glossary
     using (exists (select 1 from allowed_emails where allowed_emails.email = (select auth.jwt() ->> 'email')))`,
  `alter policy "glossary_read" on glossary to public`,
  `alter policy "glossary_read" on glossary using (true)`,
  `alter policy "allow read published" on pieces to public`,
  `alter policy "allow read published" on pieces using (status = 'published')`,
  `alter policy "tag_categories_read" on tag_categories to public`,
  `alter policy "tag_categories_read" on tag_categories using (true)`,
];

const AFTER = [
  `alter policy "Authenticated users can insert chord scores" on chord_game_scores with check (${IS_SELF})`,
  `alter policy "Authenticated users can insert ear scores" on ear_game_scores with check (${IS_SELF})`,
  `alter policy "note_game_scores_insert" on note_game_scores with check (${IS_SELF})`,
  `drop policy if exists "note_game_scores_insert_auth" on note_game_scores`,
  `drop policy if exists "note_game_scores_select_auth" on note_game_scores`,
  `alter policy "interval_scores_select" on interval_game_scores to authenticated`,
  `alter policy "interval_scores_select" on interval_game_scores using (true)`,
  `alter policy "glossary_write" on glossary using (${IS_OWNER})`,
  `alter policy "glossary_read" on glossary to authenticated`,
  `alter policy "glossary_read" on glossary using (${MEMBER})`,
  `alter policy "allow read published" on pieces to authenticated`,
  `alter policy "allow read published" on pieces using (status = 'published' and ${MEMBER})`,
  `alter policy "tag_categories_read" on tag_categories to authenticated`,
  `alter policy "tag_categories_read" on tag_categories using (${MEMBER})`,
];

const apply = async set => { for (const s of set) await must(s); };

if (process.argv.includes("--revert")) {
  await apply(BEFORE);
  console.log("reverted all nine policies");
  process.exit(0);
}

const member = (await must(
  `select email from allowed_emails where lower(email) <> '${OWNER}' order by email limit 1`))[0].email;

const asRole = async (who, statement) => {
  if (who === "anon") return sql(`set local role anon; ${statement}`);
  const u = await must(`select id from auth.users where lower(email) = lower('${who}') limit 1`);
  const claims = JSON.stringify({ sub: u[0] ? u[0].id : "00000000-0000-0000-0000-000000000000",
    email: who, role: "authenticated", aud: "authenticated", exp: 2000000000 }).replace(/'/g, "''");
  return sql(`set local role authenticated; set local request.jwt.claims = '${claims}'; ${statement}`);
};

/* Can `who` post a score under YOUR address? The row is removed in a finally
   block whichever way this goes, so a forged entry never outlives the probe. */
const FORGE_TAG = "__rls_probe__";
const canForge = async who => {
  try {
    await asRole(who, `insert into note_game_scores (email, name, score, clef, accidentals, attempts)
                       values ('${OWNER}', '${FORGE_TAG}', 999999, 'treble', false, 1)`);
    return "YES";
  } catch { return "no"; }
  finally { await must(`delete from note_game_scores where name = '${FORGE_TAG}'`); }
};

/* A write that changes nothing but still runs USING and WITH CHECK. */
const canEditGlossary = async who => {
  try {
    const r = await asRole(who, `with u as (update glossary set term = term
                                   where id = (select id from glossary order by id limit 1) returning 1)
                                 select count(*)::int n from u`);
    return r[0].n > 0 ? "YES" : "no";
  } catch { return "no"; }
};

const snapshot = async label => {
  const row = {};
  for (const who of ["anon", member, OWNER]) {
    const count = async t => {
      try { return (await asRole(who, `select count(*)::int n from ${t}`))[0].n; }
      catch { return "err"; }
    };
    row[who] = {
      glossary: await count("glossary"), pieces: await count("pieces"),
      tags: await count("tag_categories"), intervals: await count("interval_game_scores"),
      notes: await count("note_game_scores"),
      forge: who === "anon" ? "no" : await canForge(who),
      editGloss: await canEditGlossary(who),
    };
  }
  console.log("\n" + label);
  for (const [k, v] of Object.entries(row))
    console.log(`  ${(k === OWNER ? "you" : k).padEnd(32)} glossary ${String(v.glossary).padStart(4)}` +
      ` pieces ${String(v.pieces).padStart(3)} tags ${String(v.tags).padStart(3)}` +
      ` intervals ${String(v.intervals).padStart(3)} notes ${String(v.notes).padStart(4)}` +
      `   forge a score ${v.forge.padEnd(3)} edit glossary ${v.editGloss}`);
  return row;
};

const before = await snapshot("before:");
await apply(AFTER);
const after = await snapshot("after:");

/* Nobody may lose anything they should still have. */
const problems = [];
for (const t of ["glossary", "pieces", "tags", "intervals", "notes"]) {
  for (const who of [member, OWNER]) {
    if (after[who][t] !== before[who][t])
      problems.push(`${who === OWNER ? "you" : who} now reads ${after[who][t]} ${t}, was ${before[who][t]}`);
  }
}
if (after[OWNER].editGloss !== "YES") problems.push("you can no longer edit the glossary");
if (after[member].forge === "no" && before[member].forge === "no")
  problems.push("the forgery probe never worked, so 'no' after proves nothing");

if (problems.length) {
  await apply(BEFORE);
  console.log("\nREVERTED, nothing kept:\n  " + problems.join("\n  "));
  process.exit(1);
}

/* And it must have closed what it was for. */
const open = [];
if (after[member].forge === "YES")     open.push("a member can still post a score under your address");
if (after[member].editGloss === "YES") open.push("a member can still edit the glossary");
for (const t of ["glossary", "pieces", "tags", "intervals"]) {
  if (after.anon[t] === "err") open.push(`anon gets an error reading ${t}, not an empty result`);
  else if (after.anon[t] > 0)  open.push(`anon can still read ${t} (${after.anon[t]} rows)`);
}
if (open.length) { console.log("\nSTILL OPEN:\n  " + open.join("\n  ")); process.exit(1); }

const left = (await must(`select count(*)::int n from note_game_scores where name = '${FORGE_TAG}'`))[0].n;
console.log(`\nprobe rows left behind: ${left} (must be 0)`);
console.log(`closed: score forgery on all four leaderboards, member writes to the glossary,
        and anon reads of glossary, pieces, tag_categories and interval scores.
unchanged: what ${member} and you can read, and your ability to edit.`);
