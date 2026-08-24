/* focus-schema.mjs — the two new things Weekly Focus needs.
 *
 * 1. weekly_focus_done: which focuses a member has actually worked through.
 *    Nothing exists for this today, which is why the archive can only ever be
 *    a list rather than a set you get through.
 *
 * 2. weekly_focus.theme: the focuses have no category at all, so the catalogue
 *    has nothing to shelve them by.
 *
 * Deliberately NOT copied from reading_list. That table carries four anon
 * policies with USING (true) alongside its owner policy, and permissive
 * policies OR together, so the owner policy is defeated. This one gets a
 * single owner policy and nothing else.
 *
 * Nothing existing reads either of these, so this cannot affect a live page.
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
  if (!r.ok) { console.log("FAILED: " + t.slice(0, 500)); process.exit(1); }
  try { return JSON.parse(t); } catch { return t; }
};

/* ── 1. done ── */
await sql(`create table if not exists weekly_focus_done (
  email    text        not null,
  focus_id uuid        not null references weekly_focus(id) on delete cascade,
  done_at  timestamptz not null default now(),
  primary key (email, focus_id))`);
await sql(`create index if not exists weekly_focus_done_email_idx on weekly_focus_done (email)`);
await sql(`alter table weekly_focus_done enable row level security`);
await sql(`drop policy if exists weekly_focus_done_own on weekly_focus_done`);
await sql(`create policy weekly_focus_done_own on weekly_focus_done for all
  using      (lower(email) = lower((select auth.email())))
  with check (lower(email) = lower((select auth.email())))`);

/* ── 2. theme ── */
await sql(`alter table weekly_focus add column if not exists theme text`);

const THEME = {
  hands: ["Practice changing fingers without changing the note","Practice the geography of the piano",
          "Practice using the 3 pivot points","Practice finding the easiest fingering",
          "Practice holding one note while the others move","Practice preparing jumps before you need them",
          "Practice making your hands do different things"],
  sound: ["Practice how you release the notes","Practice the musical idea, not the notes",
          "Learn to control which note is heard","Make your scales sound musical"],
  method:["Practice starting from anywhere","Practise the transition, not the section",
          "Learn to practise mistakes without repeating them",
          "Learn to group notes instead of controlling every note individually"],
  read:  ["Practice the skeleton of the music","Learn to spot the harmony inside your music",
          "Practice the rhythm before the notes"],
};
for (const [theme, heads] of Object.entries(THEME)) {
  const list = heads.map(h => "'" + h.replace(/'/g, "''") + "'").join(",");
  await sql(`update weekly_focus set theme = '${theme}' where headline in (${list})`);
}

/* ── what we ended up with ── */
const themed = await sql(`select coalesce(theme,'(none)') theme, count(*)::int n from weekly_focus group by 1 order by n desc`);
console.log("themes:", JSON.stringify(themed));
const pol = await sql(`select policyname, roles::text, cmd from pg_policies where tablename='weekly_focus_done'`);
console.log("policies:", JSON.stringify(pol));

/* the guard: one member can only ever see their own rows */
const u = await sql(`select id, email from auth.users where lower(email)='matthew@matthewcawood.com' limit 1`);
const claims = JSON.stringify({ sub: u[0].id, email: u[0].email, role: "authenticated",
  aud: "authenticated", exp: 2000000000 }).replace(/'/g, "''");
await sql(`insert into weekly_focus_done (email, focus_id)
  select 'someone-else@example.invalid', id from weekly_focus order by published_at desc limit 1
  on conflict do nothing`);
const seen = await sql(`set local role authenticated; set local request.jwt.claims = '${claims}';
  select count(*)::int n from weekly_focus_done`);
console.log("rows another member's account can see:", seen[0].n, "(must be 0)");
await sql(`delete from weekly_focus_done where email = 'someone-else@example.invalid'`);
