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
    `${SUPABASE_URL}/rest/v1/live_events?daily_room_name=eq.${encodeURIComponent(room_name)}&select=id,stream_started_at,title,scheduled_at,duration_mins,feed_post_id`,
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

  // ── The replay's post ───────────────────────────────────────────────────
  // Learn opens a clinic replay in its own viewer, in the page, rather than
  // sending someone off to the event page: it does that by following
  // live_events.feed_post_id to a content_feed_posts row carrying the same Mux
  // video and the discussion under it. Nothing used to create that row or that
  // link, so every replay fell through to the fallback and navigated away.
  // The post is made here, where the video first exists, so a clinic is
  // watchable in Learn the moment its recording lands.
  //
  // Titled "Live Practice Clinic: ..." like the rest, which is also what keeps
  // it out of the Learn feed's own list: the event is the card, and this is
  // what the card opens.
  if (muxPlaybackId && !events[0].feed_post_id) {
    try {
      const ev = events[0];
      const postBody = {
        type: "post",
        title: ev.title || "Live Practice Clinic",
        body: "",
        media: [{ type: "mux", playbackId: muxPlaybackId, assetId: muxAssetId }],
        published_at: ev.scheduled_at || new Date().toISOString(),
        duration_seconds: ev.duration_mins ? ev.duration_mins * 60 : null
      };
      const postRes = await fetch(`${SUPABASE_URL}/rest/v1/content_feed_posts`, {
        method: "POST",
        headers: { ...supabaseHeaders, Prefer: "return=representation" },
        body: JSON.stringify([postBody])
      });
      const postRows = await postRes.json();
      const postId = Array.isArray(postRows) && postRows[0] && postRows[0].id;
      if (postId) {
        const linkRes = await fetch(
          `${SUPABASE_URL}/rest/v1/live_events?id=eq.${eventId}`,
          { method: "PATCH", headers: supabaseHeaders, body: JSON.stringify({ feed_post_id: postId }) }
        );
        console.log("Replay post created:", postId, "link status:", linkRes.status);
      } else {
        console.error("Replay post not created:", postRes.status, JSON.stringify(postRows).slice(0, 300));
      }
    } catch (e) {
      // The replay itself is already saved and playable; the post is what makes
      // it open in place. A failure here must never fail the webhook.
      console.error("Replay post step failed:", e && e.message);
    }
  }

  console.log(`Done — event ${eventId}, Mux asset ${muxAssetId}, playback ${muxPlaybackId}`);

  return new Response("OK");
};

export const config = { path: "/api/daily-webhook" };
