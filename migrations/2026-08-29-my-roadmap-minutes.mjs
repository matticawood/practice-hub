/* The Pieces Library needs to know which level a member is at, so the hero can
 * show them Matt's picks for that level rather than always opening on the
 * easiest ones. The number behind a roadmap level is the same one the roadmap
 * itself uses: every minute they have logged, plus the hours they had before
 * they joined. practice-log computes it client-side from a full session load,
 * which this page has no reason to do, so this returns the one number.
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
  if (!r.ok) { console.log("FAILED: " + t.slice(0, 600)); process.exit(1); }
  try { return JSON.parse(t); } catch { return t; }
};

await sql(`
create or replace function public.get_roadmap_minutes(p_email text)
returns numeric
language sql
security definer
set search_path = public
as $fn$
  SELECT COALESCE((
      SELECT SUM(pi.duration_minutes)
      FROM practice_items pi
      JOIN practice_sessions ps ON ps.id = pi.session_id
      WHERE ps.email = p_email
    ), 0)
  + COALESCE((SELECT pb.total_minutes FROM practice_baseline pb WHERE pb.email = p_email), 0);
$fn$;`);

await sql(`revoke all on function public.get_roadmap_minutes(text) from public`);
await sql(`grant execute on function public.get_roadmap_minutes(text) to authenticated, service_role`);
console.log("owner:", JSON.stringify(await sql(`select public.get_roadmap_minutes('matthew@matthewcawood.com') as mins`)));
console.log("a member:", JSON.stringify(await sql(`select public.get_roadmap_minutes('cecile.dautriat@gmail.com') as mins`)));
