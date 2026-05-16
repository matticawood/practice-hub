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

  // Verify Supabase session
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return json({ error: "Unauthorized" }, 401);

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { "Authorization": `Bearer ${token}`, "apikey": SUPABASE_ANON }
  });
  if (!userRes.ok) return json({ error: "Unauthorized" }, 401);

  const user      = await userRes.json();
  const userEmail = user.email?.toLowerCase();

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

  // ── Action: create-room ────────────────────────────────────────────────────
  // Only admin. Creates a Daily.co room for an event.
  if (action === "create-room") {
    if (!(await isAdmin())) return json({ error: "Forbidden" }, 403);

    const { eventId } = body;
    if (!eventId) return json({ error: "eventId required" }, 400);

    // Shorten UUID to 8 chars for room name limit
    const roomName = `pr-${eventId.replace(/-/g, "").slice(0, 12)}`;

    const res = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DAILY_API_KEY}`
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          enable_chat: false,          // we use our own Supabase chat
          start_video_off: false,
          start_audio_off: false,
          enable_screenshare: true,
          enable_recording: "cloud",
          max_participants: 200,
          owner_only_broadcast: true,  // only host can have camera/mic on
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 6, // expires 6h from now
        }
      })
    });

    const data = await res.json();
    if (!res.ok) return json({ error: data }, res.status);
    return json({ roomName: data.name, roomUrl: data.url });
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
          room_name: roomName,
          user_name: displayName,
          is_owner: isOwner || false,
          start_video_off: !isOwner,
          start_audio_off: !isOwner,
          start_cloud_recording: false
        }
      })
    });

    const data = await res.json();
    if (!res.ok) return json({ error: data }, res.status);
    return json({ token: data.token });
  }

  // ── Action: setup-webhook ──────────────────────────────────────────────────
  // One-time call to register the Daily.co recording.ready webhook.
  if (action === "setup-webhook") {
    if (!(await isAdmin())) return json({ error: "Forbidden" }, 403);

    const webhookUrl = new URL(request.url).origin + "/api/daily-webhook";

    // Check if webhook already exists
    const listRes = await fetch("https://api.daily.co/v1/webhooks", {
      headers: { "Authorization": `Bearer ${DAILY_API_KEY}` }
    });
    const listData = await listRes.json();
    const existing = listData?.data?.find(w => w.url === webhookUrl);
    if (existing) return json({ message: "Webhook already exists", webhook: existing });

    const res = await fetch("https://api.daily.co/v1/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${DAILY_API_KEY}` },
      body: JSON.stringify({
        url: webhookUrl
      })
    });
    const data = await res.json();
    if (!res.ok) return json({ error: data }, res.status);
    return json({ message: "Webhook created", webhook: data });
  }

  return json({ error: "Unknown action" }, 400);
};

export const config = { path: "/api/daily" };
