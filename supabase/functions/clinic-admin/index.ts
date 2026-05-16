const CAL_API_KEY = Deno.env.get("CAL_API_KEY")!;
const CAL_BASE    = "https://api.cal.com/v2";

const cors = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const url    = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    if (action === "upcoming") {
      const now     = new Date().toISOString();
      const future  = new Date();
      future.setDate(future.getDate() + 60);

      const params = new URLSearchParams({
        afterStart:  now,
        beforeStart: future.toISOString(),
        status:      "accepted",
        take:        "50",
      });

      const res  = await fetch(`${CAL_BASE}/bookings?${params}`, {
        headers: {
          "Authorization":    `Bearer ${CAL_API_KEY}`,
          "cal-api-version":  "2024-08-13",
        },
      });
      const data = await res.json();

      const bookings = (data.data || []).sort(
        (a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime()
      );

      return json({ bookings });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e: any) {
    console.error("clinic-admin error:", e);
    return json({ error: e.message }, 500);
  }
});
