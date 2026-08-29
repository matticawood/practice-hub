/* The journey badges are not recorded the way the others are.
 *
 * get_achievement_rarity() counts achievement_events, which is written when the
 * app notices an unlock. The roadmap statues (First Steps, Beginner, and the
 * rest) are derived from a member's total minutes INCLUDING the hours they had
 * before joining, so a member can plainly hold one without an event ever having
 * been written, and the cabinet was telling them "nobody has it yet" about a
 * badge half the room is wearing.
 *
 * Those badges are thresholds on one number, so the honest count is the number
 * of members over the threshold. This returns that number for every member, and
 * the client counts against the thresholds the badges themselves define, so the
 * thresholds stay in one place.
 *
 * Replaces get_achievement_rarity in place: same name, same two keys, one more.
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
create or replace function public.get_achievement_rarity()
returns jsonb
language sql
security definer
set search_path = public
as $fn$
  WITH logged AS (
    SELECT ps.email, SUM(pi.duration_minutes) AS mins
    FROM practice_items pi
    JOIN practice_sessions ps ON ps.id = pi.session_id
    GROUP BY ps.email
  ),
  totals AS (
    SELECT ae.email,
           COALESCE((SELECT mins FROM logged l WHERE l.email = ae.email), 0)
         + COALESCE((SELECT pb.total_minutes FROM practice_baseline pb WHERE pb.email = ae.email), 0) AS total
    FROM allowed_emails ae
  ),
  active AS (
    -- one denominator for the whole cabinet: a member counts as here if they
    -- have practised at all or have any badge recorded
    SELECT email FROM totals WHERE total > 0
    UNION
    SELECT evt.email FROM achievement_events evt JOIN allowed_emails m ON m.email = evt.email
  ),
  held AS (
    SELECT evt.achievement_id AS id, COUNT(DISTINCT evt.email) AS n
    FROM achievement_events evt
    JOIN allowed_emails m ON m.email = evt.email
    WHERE evt.achievement_id IS NOT NULL
    GROUP BY evt.achievement_id
  )
  SELECT jsonb_build_object(
    'members', (SELECT COUNT(*) FROM active),
    'counts',  COALESCE((SELECT jsonb_object_agg(id, n) FROM held), '{}'::jsonb),
    'totals',  COALESCE((SELECT jsonb_agg(ROUND(total)) FROM totals WHERE total > 0), '[]'::jsonb)
  );
$fn$;`);

await sql(`revoke all on function public.get_achievement_rarity() from public`);
await sql(`grant execute on function public.get_achievement_rarity() to authenticated, service_role`);

const r = await sql(`select public.get_achievement_rarity() -> 'members' as members,
  jsonb_array_length(public.get_achievement_rarity() -> 'totals') as with_practice`);
console.log("rarity:", JSON.stringify(r));
