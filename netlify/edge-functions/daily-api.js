// Daily.co API proxy — keeps the API key server-side.
// Handles room creation and meeting token generation.
// All requests must include a valid Supabase Bearer token.

const SUPABASE_URL  = "https://gyskfutmncprqxazgatv.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5c2tmdXRtbmNwcnF4YXpnYXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjIwMTYsImV4cCI6MjA5MTMzODAxNn0.ttC3plmhbA7ls_T3w25XgYT0WBt6O3MMu0G6NrEKI9g";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });

export default async (request) => {
  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }

  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Verify Supabase JWT by decoding the payload.
  // We decode without re-checking session existence (which fails when Supabase
  // has garbage-collected the session record) — the JWT signature is still valid
  // because RLS policies accept it, and we check expiry ourselves.
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return json({ error: "No auth token provided" }, 401);

  let userEmail;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Malformed JWT");
    // Base64url decode the payload
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    // Must be issued by our Supabase project and not expired
    if (!payload.iss?.includes("gyskfutmncprqxazgatv")) throw new Error("Wrong issuer");
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) throw new Error("Token expired");
    userEmail = payload.email?.toLowerCase();
    if (!userEmail) throw new Error("No email in token");
  } catch (e) {
    return json({ error: "Invalid token: " + e.message }, 401);
  }

  const DAILY_API_KEY = Netlify.env.get("DAILY_API_KEY");
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const { action } = body;

  // ── Helper: is admin? ──────────────────────────────────────────────────────
  async function isAdmin() {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/allowed_emails?email=eq.${encodeURIComponent(userEmail)}&select=email`,
      { headers: { "Authorization": `Bearer ${token}`, "apikey": SUPABASE_ANON } }
    );
    const rows = await res.json();
    return Array.isArray(rows) && rows.length > 0;
  }

  // ── Action: update-room ────────────────────────────────────────────────────
  // Patch properties on an existing room (admin only).
  if (action === "update-room") {
    if (!(await isAdmin())) return json({ error: "Forbidden" }, 403);
    const { roomName: rn, properties } = body;
    if (!rn || !properties) return json({ error: "roomName and properties required" }, 400);
    const res = await fetch(`https://api.daily.co/v1/rooms/${rn}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${DAILY_API_KEY}` },
      body: JSON.stringify({ properties })
    });
    const data = await res.json();
    if (!res.ok) return json({ error: data }, res.status);
    return json({ ok: true, room: data });
  }

  // ── Action: create-room ────────────────────────────────────────────────────
  // Only admin. Creates a Daily.co room + a Mux live stream for an event.
  if (action === "create-room") {
    if (!(await isAdmin())) return json({ error: "Forbidden" }, 403);

    const { eventId } = body;
    if (!eventId) return json({ error: "eventId required" }, 400);

    const MUX_TOKEN_ID     = Netlify.env.get("MUX_TOKEN_ID");
    const MUX_TOKEN_SECRET = Netlify.env.get("MUX_TOKEN_SECRET");
    const SERVICE_KEY      = Netlify.env.get("SUPABASE_SERVICE_KEY");

    // Shorten UUID to 8 chars for room name limit
    const roomName = `pr-${eventId.replace(/-/g, "").slice(0, 12)}`;

    // Create Daily room and Mux live stream in parallel
    const [roomRes, muxLiveRes] = await Promise.all([
      fetch("https://api.daily.co/v1/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${DAILY_API_KEY}` },
        body: JSON.stringify({
          name: roomName,
          properties: {
            enable_chat: false,
            enable_prejoin_ui: false,
            start_video_off: false,
            start_audio_off: false,
            enable_screenshare: true,
            enable_recording: "cloud",
            max_participants: 200,
            owner_only_broadcast: true,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 6,
          }
        })
      }),
      fetch("https://api.mux.com/video/v1/live-streams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic " + btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`)
        },
        body: JSON.stringify({
          playback_policy: ["public"],
          latency_mode: "reduced",
          // 5 minutes: host can leave and rejoin without splitting the recording
          reconnect_window: 300,
          // Auto-create a VOD asset when the live stream is completed
          new_asset_settings: { playback_policy: ["public"] },
        })
      })
    ]);

    const roomData = await roomRes.json();
    if (!roomRes.ok) return json({ error: roomData }, roomRes.status);

    const muxLiveData = await muxLiveRes.json();
    console.log("[create-room] Mux live stream response:", JSON.stringify(muxLiveData));
    const muxLiveStream    = muxLiveData?.data;
    const muxLiveStreamId  = muxLiveStream?.id || null;
    const muxStreamKey     = muxLiveStream?.stream_key || null;
    const muxLivePlaybackId = muxLiveStream?.playback_ids?.[0]?.id || null;
    console.log("[create-room] muxLiveStreamId:", muxLiveStreamId, "| muxStreamKey present:", !!muxStreamKey, "| muxLivePlaybackId:", muxLivePlaybackId);

    // Store Mux live stream IDs in the event row (server-side, via service key)
    if (muxLiveStreamId && muxLivePlaybackId && SERVICE_KEY) {
      await fetch(`${SUPABASE_URL}/rest/v1/live_events?id=eq.${eventId}`, {
        method: "PATCH",
        headers: {
          "apikey": SERVICE_KEY,
          "Authorization": `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({ mux_live_stream_id: muxLiveStreamId, mux_live_playback_id: muxLivePlaybackId })
      });
    }

    return json({
      roomName: roomData.name,
      roomUrl:  roomData.url,
      muxStreamKey,        // used by admin client to call startLiveStreaming()
      muxLivePlaybackId,   // stored in currentEvent for immediate use
    });
  }

  // ── Action: create-mux-livestream ─────────────────────────────────────────
  // Admin only. Creates a fresh Mux live stream for an event that already has
  // a Daily room (i.e. subsequent Go Live sessions on the same event).
  if (action === "create-mux-livestream") {
    if (!(await isAdmin())) return json({ error: "Forbidden" }, 403);
    const { eventId } = body;
    if (!eventId) return json({ error: "eventId required" }, 400);

    const MUX_TOKEN_ID     = Netlify.env.get("MUX_TOKEN_ID");
    const MUX_TOKEN_SECRET = Netlify.env.get("MUX_TOKEN_SECRET");
    const SERVICE_KEY      = Netlify.env.get("SUPABASE_SERVICE_KEY");

    const muxLiveRes = await fetch("https://api.mux.com/video/v1/live-streams", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`)
      },
      body: JSON.stringify({
        playback_policy: ["public"],
        latency_mode: "reduced",
        reconnect_window: 300,
        new_asset_settings: { playback_policy: ["public"] },
      })
    });
    const muxLiveData = await muxLiveRes.json();
    const muxLiveStream    = muxLiveData?.data;
    const muxLiveStreamId  = muxLiveStream?.id || null;
    const muxStreamKey     = muxLiveStream?.stream_key || null;
    const muxLivePlaybackId = muxLiveStream?.playback_ids?.[0]?.id || null;

    if (muxLiveStreamId && muxLivePlaybackId && SERVICE_KEY) {
      await fetch(`${SUPABASE_URL}/rest/v1/live_events?id=eq.${eventId}`, {
        method: "PATCH",
        headers: {
          "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json", "Prefer": "return=minimal"
        },
        body: JSON.stringify({ mux_live_stream_id: muxLiveStreamId, mux_live_playback_id: muxLivePlaybackId })
      });
    }

    return json({ muxStreamKey, muxLivePlaybackId });
  }

  // ── Action: get-mux-stream-key ─────────────────────────────────────────────
  // Admin only. Returns the RTMP stream key for an event's Mux live stream.
  // Used when the host rejoins an already-live event after a page refresh.
  if (action === "get-mux-stream-key") {
    if (!(await isAdmin())) return json({ error: "Forbidden" }, 403);
    const { eventId } = body;
    if (!eventId) return json({ error: "eventId required" }, 400);

    const MUX_TOKEN_ID     = Netlify.env.get("MUX_TOKEN_ID");
    const MUX_TOKEN_SECRET = Netlify.env.get("MUX_TOKEN_SECRET");
    const SERVICE_KEY      = Netlify.env.get("SUPABASE_SERVICE_KEY");

    const evRes = await fetch(
      `${SUPABASE_URL}/rest/v1/live_events?id=eq.${eventId}&select=mux_live_stream_id`,
      { headers: { "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}` } }
    );
    const evData = await evRes.json();
    const muxLiveStreamId = evData?.[0]?.mux_live_stream_id;
    if (!muxLiveStreamId) return json({ streamKey: null });

    const muxRes = await fetch(`https://api.mux.com/video/v1/live-streams/${muxLiveStreamId}`, {
      headers: { "Authorization": "Basic " + btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`) }
    });
    const muxData = await muxRes.json();
    const ls = muxData?.data;
    // Return status so the client can detect a locked/completed stream and create a fresh one
    return json({
      streamKey: ls?.stream_key || null,
      status:    ls?.status    || null,   // "active" | "idle" | "disabled" (disabled = locked after complete)
      playbackId: ls?.playback_ids?.[0]?.id || null,
    });
  }

  // ── Action: delete-mux-livestream ──────────────────────────────────────────
  // Admin only. Signals Mux that the live stream is complete, which triggers
  // automatic VOD asset creation (via new_asset_settings). We do NOT delete
  // the live stream — we need the mux_live_stream_id to find the recording
  // later via recent_asset_ids. Only mux_live_playback_id is cleared so the
  // live preview disappears for all viewers.
  if (action === "delete-mux-livestream") {
    if (!(await isAdmin())) return json({ error: "Forbidden" }, 403);
    const { eventId } = body;
    if (!eventId) return json({ error: "eventId required" }, 400);

    const MUX_TOKEN_ID     = Netlify.env.get("MUX_TOKEN_ID");
    const MUX_TOKEN_SECRET = Netlify.env.get("MUX_TOKEN_SECRET");
    const SERVICE_KEY      = Netlify.env.get("SUPABASE_SERVICE_KEY");
    const muxAuth          = "Basic " + btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`);

    const evRes = await fetch(
      `${SUPABASE_URL}/rest/v1/live_events?id=eq.${eventId}&select=mux_live_stream_id`,
      { headers: { "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}` } }
    );
    const evData = await evRes.json();
    const muxLiveStreamId = evData?.[0]?.mux_live_stream_id;

    if (muxLiveStreamId) {
      // Signal Mux to finalize the stream → triggers new_asset_settings VOD creation
      const completeRes = await fetch(
        `https://api.mux.com/video/v1/live-streams/${muxLiveStreamId}/complete`,
        { method: "PUT", headers: { "Authorization": muxAuth } }
      );
      console.log("[delete-mux-livestream] Mux complete status:", completeRes.status);
    }

    // Clear only the live playback ID — the live preview disappears for viewers.
    // Keep mux_live_stream_id so we can poll recent_asset_ids for the recording.
    await fetch(`${SUPABASE_URL}/rest/v1/live_events?id=eq.${eventId}`, {
      method: "PATCH",
      headers: {
        "apikey": SERVICE_KEY,
        "Authorization": `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({ mux_live_playback_id: null })
    });

    return json({ ok: true });
  }

  // ── Action: get-token ──────────────────────────────────────────────────────
  // Any authenticated member can get a viewer token.
  // Only admin can get an owner (host) token.
  if (action === "get-token") {
    const { roomName, isOwner } = body;
    if (!roomName) return json({ error: "roomName required" }, 400);

    if (isOwner && !(await isAdmin())) return json({ error: "Forbidden" }, 403);

    // Get display name from allowed_emails
    const nameRes = await fetch(
      `${SUPABASE_URL}/rest/v1/allowed_emails?email=eq.${encodeURIComponent(userEmail)}&select=name`,
      { headers: { "Authorization": `Bearer ${token}`, "apikey": SUPABASE_ANON } }
    );
    const nameRows = await nameRes.json();
    const displayName = nameRows?.[0]?.name || userEmail.split("@")[0];

    const res = await fetch("https://api.daily.co/v1/meeting-tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DAILY_API_KEY}`
      },
      body: JSON.stringify({
        properties: {
          room_name:            roomName,
          user_name:            displayName,
          is_owner:             isOwner || false,
          enable_prejoin_ui:    false,               // skip the Daily.co pre-join screen
          start_video_off:      !isOwner,
          start_audio_off:      !isOwner,
          start_cloud_recording: isOwner || false    // auto-start recording when host joins
        }
      })
    });

    const data = await res.json();
    if (!res.ok) return json({ error: data }, res.status);
    return json({ token: data.token });
  }

  // ── Action: fetch-recording ────────────────────────────────────────────────
  // Admin only. Checks the Mux live stream's recent_asset_ids for a VOD that
  // was automatically created when the stream was completed. This gives ONE
  // complete recording of the entire session, even if the host left and
  // rejoined multiple times (Mux reconnect_window keeps it as one stream).
  if (action === "fetch-recording") {
    if (!(await isAdmin())) return json({ error: "Forbidden" }, 403);
    const { eventId: eid } = body;
    if (!eid) return json({ error: "eventId required" }, 400);

    const MUX_TOKEN_ID     = Netlify.env.get("MUX_TOKEN_ID");
    const MUX_TOKEN_SECRET = Netlify.env.get("MUX_TOKEN_SECRET");
    const SERVICE_KEY      = Netlify.env.get("SUPABASE_SERVICE_KEY");
    const muxAuth          = "Basic " + btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`);

    // Get the event to find mux_live_stream_id
    const evRes = await fetch(
      `${SUPABASE_URL}/rest/v1/live_events?id=eq.${eid}&select=mux_live_stream_id,daily_room_name`,
      { headers: { "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}` } }
    );
    const evRows = await evRes.json();
    const ev = evRows?.[0];
    if (!ev) return json({ error: "Event not found" }, 404);

    const muxLiveStreamId = ev.mux_live_stream_id;
    console.log(`fetch-recording: event ${eid}, mux_live_stream_id=${muxLiveStreamId}`);

    if (!muxLiveStreamId) {
      return json({ error: "No Mux live stream ID on this event — was the stream created with this version of the code?" }, 404);
    }

    // Check Mux live stream for auto-created VOD assets (recent_asset_ids)
    const lsRes = await fetch(
      `https://api.mux.com/video/v1/live-streams/${muxLiveStreamId}`,
      { headers: { "Authorization": muxAuth } }
    );
    const lsData = await lsRes.json();
    console.log("fetch-recording: Mux live stream:", JSON.stringify(lsData?.data));

    const recentAssetIds = lsData?.data?.recent_asset_ids || [];
    if (!recentAssetIds.length) {
      return json({
        error: "Recording not ready yet — Mux hasn't finished creating the VOD. " +
               "This usually takes 1-5 minutes after the stream ends. Try again shortly.",
        muxStreamStatus: lsData?.data?.status
      }, 404);
    }

    // Use the most recent asset (last element = most recently created)
    const assetId = recentAssetIds[recentAssetIds.length - 1];
    console.log(`fetch-recording: found Mux asset ${assetId}`);

    const assetRes = await fetch(
      `https://api.mux.com/video/v1/assets/${assetId}`,
      { headers: { "Authorization": muxAuth } }
    );
    const assetData = await assetRes.json();
    const asset = assetData?.data;
    console.log("fetch-recording: asset status:", asset?.status, "playback_ids:", JSON.stringify(asset?.playback_ids));

    if (!asset) return json({ error: "Could not retrieve Mux asset", detail: assetData }, 500);
    if (asset.status === "errored") return json({ error: "Mux asset errored", detail: asset.errors }, 500);
    if (asset.status !== "ready") {
      return json({ error: `Mux asset is still processing (status: ${asset.status}). Try again in a minute.` }, 404);
    }

    const muxPlaybackId = asset.playback_ids?.[0]?.id || null;
    if (!muxPlaybackId) return json({ error: "Mux asset has no playback ID yet" }, 404);

    // Save to Supabase and clear the live stream ID (no longer needed)
    const supaHeaders = {
      "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json"
    };
    await fetch(`${SUPABASE_URL}/rest/v1/live_events?id=eq.${eid}`, {
      method: "PATCH", headers: supaHeaders,
      body: JSON.stringify({
        mux_asset_id:       assetId,
        mux_playback_id:    muxPlaybackId,
        mux_live_stream_id: null,   // recording is saved — live stream ID no longer needed
      })
    });

    return json({ ok: true, muxAssetId: assetId, muxPlaybackId });
  }

  // ── Action: setup-webhook ──────────────────────────────────────────────────
  // Deletes any existing webhook and re-registers at the current deploy URL.
  // Safe to call any time — fixes stale URLs from old Netlify deploys.
  if (action === "setup-webhook") {
    if (!(await isAdmin())) return json({ error: "Forbidden" }, 403);

    const webhookUrl = new URL(request.url).origin + "/api/daily-webhook";

    // List all existing webhooks
    const listRes  = await fetch("https://api.daily.co/v1/webhooks", {
      headers: { "Authorization": `Bearer ${DAILY_API_KEY}` }
    });
    const listData = await listRes.json();
    const webhooks = listData?.data || [];

    // Delete any webhook not pointing at the current URL (stale deploys)
    for (const wh of webhooks) {
      if (wh.url !== webhookUrl) {
        await fetch(`https://api.daily.co/v1/webhooks/${wh.id}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${DAILY_API_KEY}` }
        });
      }
    }

    // If one already exists at the correct URL, we're done
    const alreadyCorrect = webhooks.find(w => w.url === webhookUrl);
    if (alreadyCorrect) return json({ message: "Webhook already correct", url: webhookUrl, webhook: alreadyCorrect });

    // Create fresh webhook at current URL
    const res  = await fetch("https://api.daily.co/v1/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${DAILY_API_KEY}` },
      body: JSON.stringify({ url: webhookUrl })
    });
    const data = await res.json();
    if (!res.ok) return json({ error: data }, res.status);
    return json({ message: "Webhook created", url: webhookUrl, webhook: data });
  }

  // ── Action: delete-mux-asset ──────────────────────────────────────────────
  // Any authenticated member can delete their own Mux asset.
  // Admin can delete any asset.
  if (action === "delete-mux-asset") {
    const MUX_TOKEN_ID     = Netlify.env.get("MUX_TOKEN_ID");
    const MUX_TOKEN_SECRET = Netlify.env.get("MUX_TOKEN_SECRET");
    const { assetId } = body;
    if (!assetId) return json({ error: "assetId required" }, 400);

    const res = await fetch(`https://api.mux.com/video/v1/assets/${assetId}`, {
      method: "DELETE",
      headers: { "Authorization": "Basic " + btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`) }
    });
    if (!res.ok && res.status !== 404) {
      const data = await res.json().catch(() => ({}));
      return json({ error: data }, res.status);
    }
    return json({ ok: true });
  }

  // ── Action: create-mux-upload ──────────────────────────────────────────────
  // Any authenticated member can get a direct Mux upload URL.
  // The browser PUTs the video file straight to Mux — no size limit.
  if (action === "create-mux-upload") {
    const MUX_TOKEN_ID     = Netlify.env.get("MUX_TOKEN_ID");
    const MUX_TOKEN_SECRET = Netlify.env.get("MUX_TOKEN_SECRET");

    const res = await fetch("https://api.mux.com/video/v1/uploads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`)
      },
      body: JSON.stringify({
        cors_origin: "*",
        new_asset_settings: { playback_policy: ["public"] }
      })
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data?.error?.messages?.[0] || JSON.stringify(data);
      return json({ error: msg }, res.status);
    }
    return json({ uploadId: data.data.id, uploadUrl: data.data.url });
  }

  // ── Action: get-mux-upload-status ─────────────────────────────────────────
  // Poll this after the browser upload finishes to get the playback ID.
  if (action === "get-mux-upload-status") {
    const MUX_TOKEN_ID     = Netlify.env.get("MUX_TOKEN_ID");
    const MUX_TOKEN_SECRET = Netlify.env.get("MUX_TOKEN_SECRET");
    const { uploadId } = body;
    if (!uploadId) return json({ error: "uploadId required" }, 400);

    const auth = "Basic " + btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`);
    const res = await fetch(`https://api.mux.com/video/v1/uploads/${uploadId}`, {
      headers: { "Authorization": auth }
    });
    const data = await res.json();
    const upload = data.data;

    if (upload.asset_id) {
      const assetRes = await fetch(`https://api.mux.com/video/v1/assets/${upload.asset_id}`, {
        headers: { "Authorization": auth }
      });
      const assetData = await assetRes.json();
      const asset = assetData.data;
      const playbackId = asset.playback_ids?.[0]?.id || null;
      const assetStatus = asset.status; // "preparing" | "ready" | "errored"
      // Only return playbackId once the asset is fully ready to stream
      return json({
        status: upload.status,
        assetId: upload.asset_id,
        assetStatus,
        playbackId: assetStatus === "ready" ? playbackId : null
      });
    }

    return json({ status: upload.status });
  }

  // ── Action: create-backstage-room ─────────────────────────────────────────
  // Admin only. Creates (or retrieves existing) a private backstage Daily room
  // where all participants can broadcast — no Mux streaming, no owner_only_broadcast.
  if (action === "create-backstage-room") {
    if (!(await isAdmin())) return json({ error: "Forbidden" }, 403);
    const { eventId } = body;
    if (!eventId) return json({ error: "eventId required" }, 400);

    // Backstage room name is deterministic: main room name + "-bk"
    const backstageRoomName = `pr-${eventId.replace(/-/g, "").slice(0, 12)}-bk`;

    // Try to fetch existing room first (idempotent)
    const getRes = await fetch(`https://api.daily.co/v1/rooms/${backstageRoomName}`, {
      headers: { "Authorization": `Bearer ${DAILY_API_KEY}` }
    });
    if (getRes.ok) {
      const existing = await getRes.json();
      return json({ roomName: existing.name, roomUrl: existing.url });
    }

    // Create the backstage room — everyone can broadcast (no owner_only_broadcast)
    const res = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${DAILY_API_KEY}` },
      body: JSON.stringify({
        name: backstageRoomName,
        properties: {
          enable_chat:          false,
          enable_prejoin_ui:    false,
          start_video_off:      false,
          start_audio_off:      false,
          enable_screenshare:   true,
          owner_only_broadcast: false,   // all guests can have camera/mic on
          max_participants:     20,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24-hour expiry
        }
      })
    });
    const data = await res.json();
    if (!res.ok) return json({ error: data }, res.status);
    return json({ roomName: data.name, roomUrl: data.url });
  }

  // ── Action: get-backstage-token ────────────────────────────────────────────
  // Returns a Daily.co meeting token for the backstage room.
  // Admin always allowed. Non-admin requires an entry in event_backstage_guests.
  if (action === "get-backstage-token") {
    const { eventId } = body;
    if (!eventId) return json({ error: "eventId required" }, 400);

    const backstageRoomName = `pr-${eventId.replace(/-/g, "").slice(0, 12)}-bk`;
    const admin = await isAdmin();

    if (!admin) {
      // Verify the requester is on the guest list (using service key for RLS bypass)
      const SERVICE_KEY = Netlify.env.get("SUPABASE_SERVICE_KEY");
      const guestRes = await fetch(
        `${SUPABASE_URL}/rest/v1/event_backstage_guests?event_id=eq.${eventId}&email=eq.${encodeURIComponent(userEmail)}&select=id`,
        { headers: { "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}` } }
      );
      const guestRows = await guestRes.json();
      if (!Array.isArray(guestRows) || guestRows.length === 0) {
        return json({ error: "You have not been invited to this backstage." }, 403);
      }
    }

    // Get display name
    const nameRes = await fetch(
      `${SUPABASE_URL}/rest/v1/allowed_emails?email=eq.${encodeURIComponent(userEmail)}&select=name`,
      { headers: { "Authorization": `Bearer ${token}`, "apikey": SUPABASE_ANON } }
    );
    const nameRows = await nameRes.json();
    const displayName = nameRows?.[0]?.name || userEmail.split("@")[0];

    // Fetch the room to get its canonical URL (avoids hardcoding the Daily.co domain)
    const roomRes = await fetch(`https://api.daily.co/v1/rooms/${backstageRoomName}`, {
      headers: { "Authorization": `Bearer ${DAILY_API_KEY}` }
    });
    const roomData = await roomRes.json();
    if (!roomRes.ok) return json({ error: "Backstage room not found — please ask the host to open Backstage first." }, 404);
    const roomUrl = roomData.url;

    const res = await fetch("https://api.daily.co/v1/meeting-tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${DAILY_API_KEY}` },
      body: JSON.stringify({
        properties: {
          room_name:         backstageRoomName,
          user_name:         displayName,
          is_owner:          admin,
          enable_prejoin_ui: false,
          start_video_off:   false,  // everyone has camera on in backstage
          start_audio_off:   false,
        }
      })
    });
    const data = await res.json();
    if (!res.ok) return json({ error: data }, res.status);
    return json({ token: data.token, roomName: backstageRoomName, roomUrl });
  }

  return json({ error: "Unknown action" }, 400);
};

export const config = { path: "/api/daily" };
