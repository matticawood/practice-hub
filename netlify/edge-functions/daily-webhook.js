// Daily.co webhook handler
// Listens for recording.ready events, uploads to Mux, updates the event record.

const SUPABASE_URL = "https://gyskfutmncprqxazgatv.supabase.co";

export default async (request) => {
  if (request.method !== "POST") return new Response("OK", { status: 200 });

  let body;
  try { body = await request.json(); } catch { return new Response("OK"); }

  // Daily.co sends either v1 {action, recording} or v2 {type, payload}
  console.log("daily-webhook received:", JSON.stringify(body));

  const eventType    = body.type    || body.action;
  const recordingData = body.payload || body.recording;

  if (eventType !== "recording.ready" || !recordingData) {
    console.log("Ignoring event:", eventType);
    return new Response("OK");
  }

  const DAILY_API_KEY    = Netlify.env.get("DAILY_API_KEY");
  const SERVICE_KEY      = Netlify.env.get("SUPABASE_SERVICE_KEY");
  const MUX_TOKEN_ID     = Netlify.env.get("MUX_TOKEN_ID");
  const MUX_TOKEN_SECRET = Netlify.env.get("MUX_TOKEN_SECRET");

  if (!SERVICE_KEY || !MUX_TOKEN_ID || !MUX_TOKEN_SECRET || !DAILY_API_KEY) {
    console.error("Missing env vars");
    return new Response("OK");
  }

  let { room_name, download_link, recording_id, start_ts } = recordingData;

  console.log("Recording data:", { room_name, recording_id, has_download_link: !!download_link });

  // Fetch the recording details from Daily.co whenever the download_link OR the
  // recording start time is missing (the start time is VOD t=0 for Q&A sync).
  if ((!download_link || !start_ts) && recording_id) {
    console.log("Fetching recording details from Daily.co for:", recording_id);
    const recRes = await fetch(`https://api.daily.co/v1/recordings/${recording_id}`, {
      headers: { "Authorization": `Bearer ${DAILY_API_KEY}` }
    });
    const recData = await recRes.json();
    console.log("Daily.co recording fetch:", JSON.stringify(recData));
    if (!download_link) download_link = recData?.download_link;
    if (!room_name)     room_name     = recData?.room_name;
    if (!start_ts)      start_ts      = recData?.start_ts;
  }

  if (!room_name || !download_link) {
    console.error("Still missing room_name or download_link after fetch:", { room_name, download_link });
    return new Response("OK");
  }

  const supabaseHeaders = {
    "apikey":        SERVICE_KEY,
    "Authorization": `Bearer ${SERVICE_KEY}`,
    "Content-Type":  "application/json"
  };

  // ── Find event by room_name ────────────────────────────────────────────────
  const evRes = await fetch(
    `${SUPABASE_URL}/rest/v1/live_events?daily_room_name=eq.${encodeURIComponent(room_name)}&select=id,stream_started_at`,
    { headers: supabaseHeaders }
  );
  const events = await evRes.json();
  if (!events?.length) {
    console.error("No event found for room:", room_name);
    return new Response("OK");
  }
  const eventId = events[0].id;

  // ── Create Mux asset ──────────────────────────────────────────────────────
  console.log("Creating Mux asset from:", download_link);
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
  console.log("Mux response:", JSON.stringify(muxData));
  const asset = muxData?.data;

  if (!asset) {
    console.error("Mux asset creation failed:", muxData);
    return new Response("OK");
  }

  const muxAssetId    = asset.id;
  const muxPlaybackId = asset.playback_ids?.[0]?.id || null;

  // ── Update event ──────────────────────────────────────────────────────────
  const patch = { mux_asset_id: muxAssetId, mux_playback_id: muxPlaybackId };
  // Backfill VOD t=0 from the Daily recording's start time when it wasn't
  // captured live (e.g. a stream that never started Mux RTMP, like test events).
  // This is the exact recording the Mux asset is built from, so it's the true
  // t=0 for Q&A timestamp sync. Never overwrite an existing value. start_ts is
  // Daily's recording start in epoch seconds.
  if (!events[0].stream_started_at && start_ts) {
    patch.stream_started_at = new Date(start_ts * 1000).toISOString();
    console.log("Backfilling stream_started_at from recording start_ts:", patch.stream_started_at);
  }
  const patchRes = await fetch(
    `${SUPABASE_URL}/rest/v1/live_events?id=eq.${eventId}`,
    {
      method: "PATCH",
      headers: supabaseHeaders,
      body: JSON.stringify(patch)
    }
  );
  console.log("Supabase patch status:", patchRes.status);
  console.log(`Done — event ${eventId}, Mux asset ${muxAssetId}, playback ${muxPlaybackId}`);

  return new Response("OK");
};

export const config = { path: "/api/daily-webhook" };
