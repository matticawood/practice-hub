// community-stats — public, read-only aggregate for social proof on /signup.
// Returns the total practice sessions + hours logged by members (no PII, just
// counts). Cached so it doesn't hammer the DB. Aggregates are disabled on this
// project's PostgREST, so we pull the (small) duration column and sum in-function.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  // Rolling 30-day window reads as live momentum (a young platform's lifetime
  // total sounds small; "in the last 30 days" sounds active). Lifetime is also
  // returned so the page can switch to it later once it's a bigger flex.
  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  let sessions = 0, minutes = 0, recentSessions = 0, recentMinutes = 0;
  try {
    const r = await fetch(`${url}/rest/v1/practice_sessions?select=duration_minutes,session_date`, {
      headers: { apikey: key!, Authorization: `Bearer ${key}` },
    });
    if (r.ok) {
      const rows = await r.json();
      for (const row of rows) {
        const m = row.duration_minutes || 0;
        sessions += 1; minutes += m;
        if (row.session_date && row.session_date >= cutoff) { recentSessions += 1; recentMinutes += m; }
      }
    }
  } catch (_) { /* fall through to zeros; the page hides the line if empty */ }

  // Distinct pieces worked on in the window (breadth-of-repertoire proof).
  let recentPieces = 0;
  try {
    const ri = await fetch(
      `${url}/rest/v1/practice_items?select=piece_label,practice_sessions!inner(session_date)&practice_sessions.session_date=gte.${cutoff}&limit=10000`,
      { headers: { apikey: key!, Authorization: `Bearer ${key}` } },
    );
    if (ri.ok) {
      const items = await ri.json();
      const seen = new Set<string>();
      for (const it of items) if (it.piece_label) seen.add(it.piece_label);
      recentPieces = seen.size;
    }
  } catch (_) { /* leave 0 */ }

  // Breadth-of-app activity in the window (the app is more than practice logging):
  // skill games, achievements earned, community posts + messages.
  async function count(path: string): Promise<number> {
    try {
      const r = await fetch(`${url}/rest/v1/${path}`, {
        headers: { apikey: key!, Authorization: `Bearer ${key}`, Prefer: "count=exact", Range: "0-0" },
      });
      const total = (r.headers.get("content-range") || "").split("/")[1];
      return total ? parseInt(total, 10) : 0;
    } catch { return 0; }
  }

  const [note, chord, ear, passage, achievements, posts, messages] = await Promise.all([
    count(`note_game_scores?select=id&created_at=gte.${cutoff}`),
    count(`chord_game_scores?select=id&created_at=gte.${cutoff}`),
    count(`ear_game_scores?select=id&created_at=gte.${cutoff}`),
    count(`passage_games?select=id&created_at=gte.${cutoff}`),
    count(`achievement_events?select=id&earned_at=gte.${cutoff}`),
    count(`community_posts?select=id&created_at=gte.${cutoff}`),
    count(`community_messages?select=id&created_at=gte.${cutoff}`),
  ]);
  const recentGames = note + chord + ear + passage;
  const recentAchievements = achievements;
  const recentCommunity = posts + messages;

  return new Response(
    JSON.stringify({
      sessions, hours: Math.round(minutes / 60),
      recentSessions, recentHours: Math.round(recentMinutes / 60), recentPieces,
      recentGames, recentAchievements, recentCommunity, windowDays: 30,
    }),
    {
      headers: {
        ...cors,
        "Content-Type": "application/json",
        // Cache at the edge for an hour; the number only needs to be roughly live.
        "Cache-Control": "public, max-age=600, s-maxage=3600",
      },
    },
  );
});
