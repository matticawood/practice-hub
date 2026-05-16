const CAL_API_KEY  = Deno.env.get("CAL_API_KEY")!;
const CAL_BASE     = "https://api.cal.com/v2";

const calHeaders = () => ({
  "Authorization": `Bearer ${CAL_API_KEY}`,
  "cal-api-version": "2024-08-13",
});

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
    if (action === "slots") {
      const eventTypeId = url.searchParams.get("eventTypeId");
      const timeZone    = url.searchParams.get("timeZone") || "Europe/London";

      // Support single day OR a full date range (for month availability pre-fetch)
      const date      = url.searchParams.get("date");       // YYYY-MM-DD  (single day)
      const startDate = url.searchParams.get("startDate");  // YYYY-MM-DD  (range start)
      const endDate   = url.searchParams.get("endDate");    // YYYY-MM-DD  (range end)

      if (!eventTypeId || (!date && !startDate)) {
        return json({ error: "Missing params" }, 400);
      }

      let startTime: string, endTime: string;
      if (startDate && endDate) {
        // Full range query (e.g. whole month)
        startTime = `${startDate}T00:00:00Z`;
        const endD = new Date(endDate);
        endD.setDate(endD.getDate() + 1); // make end inclusive
        endTime = endD.toISOString().split("T")[0] + "T00:00:00Z";
      } else {
        // Single day: fetch a 2-day window to handle timezone offsets
        startTime = `${date}T00:00:00Z`;
        const end = new Date(date!);
        end.setDate(end.getDate() + 2);
        endTime = end.toISOString().split("T")[0] + "T00:00:00Z";
      }

      const slotsUrl = new URL(`${CAL_BASE}/slots/available`);
      slotsUrl.searchParams.set("eventTypeId", eventTypeId);
      slotsUrl.searchParams.set("startTime", startTime);
      slotsUrl.searchParams.set("endTime", endTime);
      slotsUrl.searchParams.set("timeZone", timeZone);

      const res  = await fetch(slotsUrl.toString(), { headers: calHeaders() });
      const data = await res.json();
      return json(data);
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e: any) {
    console.error("clinic-slots error:", e);
    return json({ error: e.message }, 500);
  }
});
