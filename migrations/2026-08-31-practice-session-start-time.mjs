/* 2026-08-31-practice-session-start-time.mjs
 *
 * WHEN A SESSION HAPPENED, as opposed to when it was written up.
 *
 * A session row has carried only session_date (a date, no time), so the one
 * chart about time of day was built from created_at — the moment the row was
 * written. For a member who writes the day up afterwards that is the hour they
 * typed, not the hour they played. Reported by a member whose chart claimed she
 * practised at midnight: 78 of her 88 typed sessions were saved on the calendar
 * day AFTER the practice they describe, at about 00:30 her time.
 *
 * A plain `time`, not a timestamptz, on purpose. The member types a wall-clock
 * time and means the clock on their own wall; storing an instant would make it
 * a timezone question, which is the very thing that produced the wrong answer.
 * Nullable, and it stays null unless somebody says otherwise: nothing is
 * invented on their behalf, and the chart simply leaves those sessions out.
 */
import { readFileSync } from "node:fs";

const ROOT = "/Users/matthewcawood/The Practice Room Database";
const env = Object.fromEntries(readFileSync(ROOT + "/.env.local", "utf8")
  .split("\n").filter(l => l.includes("=")).map(l => {
    const i = l.indexOf("=");
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
  }));
const REF = "gyskfutmncprqxazgatv";

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

console.log(await sql(`
  alter table public.practice_sessions
    add column if not exists start_time time;

  comment on column public.practice_sessions.start_time is
    'Wall-clock time the practice started, as the member reports it or as the live timer recorded it. No timezone: it means the clock where they are. Null means unknown, and unknown is never guessed.';
`));

console.log(await sql(`
  select column_name, data_type, is_nullable
    from information_schema.columns
   where table_schema = 'public' and table_name = 'practice_sessions'
     and column_name = 'start_time';
`));

/* The sessions the app reads come from get_my_sessions, which returns json
 * rather than a typed row, so a new key reaches every reader without changing
 * the shape anything else depends on. Without this the edit form would open
 * with the time blank and save that blank back over a time already recorded. */
console.log(await sql(`
CREATE OR REPLACE FUNCTION public.get_my_sessions(p_email text)
 RETURNS json
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', ps.id,
      'email', ps.email,
      'session_date', ps.session_date,
      'start_time', ps.start_time,
      'source', ps.source,
      'duration_minutes', ps.duration_minutes,
      'timing_mode', ps.timing_mode,
      'notes', ps.notes,
      'created_at', ps.created_at,
      'practice_items', COALESCE((
        SELECT json_agg(row_to_json(pi) ORDER BY pi.sort_order)
        FROM practice_items pi
        WHERE pi.session_id = ps.id
      ), '[]'::json)
    )
    ORDER BY ps.session_date DESC, ps.created_at DESC
  ), '[]'::json)
  FROM practice_sessions ps
  WHERE ps.email = p_email
    AND EXISTS (SELECT 1 FROM allowed_emails ae WHERE ae.email = p_email);
$function$;
`));
console.log(await sql(`select (get_my_sessions('matthew@matthewcawood.com')::jsonb -> 0) ? 'start_time' as has_start_time,
                              (get_my_sessions('matthew@matthewcawood.com')::jsonb -> 0) ? 'source' as has_source`));
