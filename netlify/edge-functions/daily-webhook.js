// Daily.co webhook handler
// Listens for recording.ready events, uploads to Mux, updates the event record.

const SUPABASE_URL = "https://gyskfutmncprqxazgatv.supabase.co";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });

export default async (request) => {
  // Daily.co sends POST; respond 200 to anything else so retries don't pile up
  if (request.method !== "POST") return new Response("OK", { status: 200 });

  let body;
  try { body = await request.json(); } catch { return new Response("OK"); }

  const { action, recording } = body;

  // Only handle recording.ready
  if (action !== "recording.ready" || !recording) return new Response("OK");

  const { room_name, download_link } = recording;
  if (!room_name || !download_link) return new Response("OK");

  const SERVICE_KEY    = Netlify.env.get("SUPABASE_SERVICE_KEY");
  const MUX_TOKEN_ID   = Netlify.env.get("MUX_TOKEN_ID");
  const MUX_TOKEN_SECRET = Netlify.env.get("MUX_TOKEN_SECRET");

  if (!SERVICE_KEY || !MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
    console.error("Missing env vars for daily-webhook");
    return new Response("OK");
  }

  const supabaseHeaders = {
    "apikey":        SERVICE_KEY,
    "Authorization": `Bearer ${SERVICE_KEY}`,
    "Content-Type":  "application/json"
  };

  // ── Find event by room_name ────────────────────────────────────────────────
  const evRes = await fetch(
    `${SUPABASE_URL}/rest/v1/live_events?daily_room_name=eq.${encodeURIComponent(room_name)}&select=id`,
    { headers: supabaseHeaders }
  );
  const events = await evRes.json();
  if (!events?.length) {
    console.error("No event found for room", room_name);
    return new Response("OK");
  }
  const eventId = events[0].id;

  // ── Create Mux asset from recording URL ───────────────────────────────────
  const muxRes = await fetch("https://api.mux.com/video/v1/assets", {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": "Basic " + btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`)
    },
    body: JSON.stringify({
      input: [{ url: download_link }],
      playback_policy: ["public"]
    })
  });

  const muxData = await muxRes.json();
  const asset = muxData?.data;

  if (!asset) {
    console.error("Mux asset creation failed", muxData);
    return new Response("OK");
  }

  const muxAssetId   = asset.id;
  const muxPlaybackId = asset.playback_ids?.[0]?.id || null;

  // ── Update event with Mux IDs ─────────────────────────────────────────────
  await fetch(
    `${SUPABASE_URL}/rest/v1/live_events?id=eq.${eventId}`,
    {
      method: "PATCH",
      headers: supabaseHeaders,
      body: JSON.stringify({ mux_asset_id: muxAssetId, mux_playback_id: muxPlaybackId })
    }
  );

  console.log(`Recording ready for event ${eventId}: Mux asset ${muxAssetId}`);
  return new Response("OK");
};

export const config = { path: "/api/daily-webhook" };
