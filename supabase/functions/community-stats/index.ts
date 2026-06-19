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

  let sessions = 0, minutes = 0;
  try {
    const r = await fetch(`${url}/rest/v1/practice_sessions?select=duration_minutes`, {
      headers: { apikey: key!, Authorization: `Bearer ${key}` },
    });
    if (r.ok) {
      const rows = await r.json();
      sessions = rows.length;
      for (const row of rows) minutes += (row.duration_minutes || 0);
    }
  } catch (_) { /* fall through to zeros; the page hides the line if empty */ }

  const hours = Math.round(minutes / 60);

  return new Response(
    JSON.stringify({ sessions, hours }),
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
