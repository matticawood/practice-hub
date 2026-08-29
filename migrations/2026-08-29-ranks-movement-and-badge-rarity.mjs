/* Two read-only functions the Progress page needs and the database did not have.
 *
 * 1. get_last_month_leaderboard_full()
 *    get_last_month_leaderboard() ends in LIMIT 3, because it was written to
 *    feed the "last month's champions" card. The Ranks board also used it to
 *    work out who had moved up or down, so the previous-rank map only ever held
 *    three people and every other member was stamped NEW on no evidence. Same
 *    query, same shape, without the limit. The old one is left exactly as it is.
 *
 * 2. get_achievement_rarity()
 *    "76 of 80 have it" needs a count of how many current members hold each
 *    badge. achievement_events already records every unlock; this counts them,
 *    gated to current members the same way get_achievement_leaderboard is, and
 *    returns one JSON object so the client makes a single call and is not
 *    subject to the 1000-row collection cap.
 *
 * Both are additive: nothing existing calls either name.
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
create or replace function public.get_last_month_leaderboard_full()
returns table(email text, name text, total_minutes numeric)
language sql
security definer
set search_path = public
as $fn$
  SELECT
    ae.email,
    ae.name,
    COALESCE(SUM(ps.duration_minutes), 0) AS total_minutes
  FROM allowed_emails ae
  LEFT JOIN practice_sessions ps
    ON ps.email = ae.email
    AND ps.session_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    AND ps.session_date <  DATE_TRUNC('month', CURRENT_DATE)
  WHERE COALESCE(ae.leaderboard_opt_out, false) = false
  GROUP BY ae.email, ae.name
  HAVING COALESCE(SUM(ps.duration_minutes), 0) > 0
  ORDER BY total_minutes DESC;
$fn$;`);

await sql(`
create or replace function public.get_achievement_rarity()
returns jsonb
language sql
security definer
set search_path = public
as $fn$
  WITH held AS (
    SELECT evt.achievement_id AS id, COUNT(DISTINCT evt.email) AS n
    FROM achievement_events evt
    JOIN allowed_emails m ON m.email = evt.email
    WHERE evt.achievement_id IS NOT NULL
    GROUP BY evt.achievement_id
  ),
  base AS (
    SELECT COUNT(DISTINCT evt.email) AS members
    FROM achievement_events evt
    JOIN allowed_emails m ON m.email = evt.email
  )
  SELECT jsonb_build_object(
    'members', (SELECT members FROM base),
    'counts',  COALESCE((SELECT jsonb_object_agg(id, n) FROM held), '{}'::jsonb)
  );
$fn$;`);

for (const fn of ["public.get_last_month_leaderboard_full()", "public.get_achievement_rarity()"]) {
  await sql(`revoke all on function ${fn} from public`);
  await sql(`grant execute on function ${fn} to authenticated, service_role`);
}

const a = await sql(`select count(*) as rows from public.get_last_month_leaderboard_full()`);
const b = await sql(`select public.get_achievement_rarity() -> 'members' as members,
                            jsonb_object_keys_count from (select 1) x,
                            lateral (select count(*) as jsonb_object_keys_count
                                     from jsonb_object_keys(public.get_achievement_rarity() -> 'counts')) y`);
console.log("last month, full:", JSON.stringify(a));
console.log("rarity:", JSON.stringify(b));
