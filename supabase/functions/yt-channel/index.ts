// yt-channel — owner-only read of the channel's own videos for the Idea Studio.
// Used to ground ideation in what the audience already responds to (titles + views),
// and to avoid repeating covered topics. Uses the cheap quota path (uploads playlist
// + videos.list, ~2-4 units) rather than search.list (100 units).
//
// GET ?handle=matthewcawood  or  ?channelId=UC...   (handle resolved via forHandle)
// Needs the YOUTUBE_API_KEY secret. Owner-gated (verifies Supabase JWT == owner).

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://gyskfutmncprqxazgatv.supabase.co";
const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY") || "";
const OWNER_EMAIL = "matthew@matthewcawood.com";
const YT = "https://www.googleapis.com/youtube/v3";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const jsonRes = (status: number, obj: unknown) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, "content-type": "application/json", "cache-control": "public, max-age=300, s-maxage=3600" } });

async function ytGet(path: string, params: Record<string, string>, key: string) {
  const qs = new URLSearchParams({ ...params, key }).toString();
  const r = await fetch(`${YT}/${path}?${qs}`);
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error?.message || `YouTube ${path} ${r.status}`);
  return j;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const key = Deno.env.get("YOUTUBE_API_KEY");
  if (!key) return jsonRes(500, { error: "YOUTUBE_API_KEY is not set on the server." });

  // owner-gate (protects API quota)
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return jsonRes(401, { error: "Unauthorised" });
  try {
    const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON } });
    if (!u.ok) return jsonRes(401, { error: "Unauthorised" });
    const email = (await u.json())?.email;
    if (!email || email.toLowerCase() !== OWNER_EMAIL) return jsonRes(403, { error: "Forbidden" });
  } catch { return jsonRes(401, { error: "Unauthorised" }); }

  const url = new URL(req.url);
  const handle = (url.searchParams.get("handle") || "matticawood").replace(/^@/, "");
  let channelId = url.searchParams.get("channelId") || "";

  try {
    // 1. resolve channel -> uploads playlist + stats
    const chParams = channelId
      ? { part: "snippet,contentDetails,statistics", id: channelId }
      : { part: "snippet,contentDetails,statistics", forHandle: "@" + handle };
    const ch = await ytGet("channels", chParams, key);
    const c = ch.items?.[0];
    if (!c) return jsonRes(404, { error: `Channel not found (handle @${handle}). Pass ?channelId=UC... or ?handle=...` });
    channelId = c.id;
    const uploads = c.contentDetails?.relatedPlaylists?.uploads;

    // 2. ALL uploads -> video ids (paginate fully so insights see all-time hits)
    const ids: string[] = [];
    let pageToken = "";
    for (let p = 0; p < 20 && uploads; p++) {
      const pl = await ytGet("playlistItems", { part: "contentDetails", playlistId: uploads, maxResults: "50", ...(pageToken ? { pageToken } : {}) }, key);
      for (const it of pl.items || []) { const vid = it.contentDetails?.videoId; if (vid) ids.push(vid); }
      pageToken = pl.nextPageToken || "";
      if (!pageToken) break;
    }

    // 3. stats for those videos (50 per call)
    const vids: any[] = [];
    for (let i = 0; i < ids.length; i += 50) {
      const v = await ytGet("videos", { part: "snippet,statistics", id: ids.slice(i, i + 50).join(",") }, key);
      for (const it of v.items || []) {
        vids.push({
          videoId: it.id,
          title: it.snippet?.title || "",
          publishedAt: it.snippet?.publishedAt || "",
          views: parseInt(it.statistics?.viewCount || "0", 10),
        });
      }
    }
    vids.sort((a, b) => b.views - a.views);

    return jsonRes(200, {
      channelId,
      channelTitle: c.snippet?.title || "",
      subscribers: parseInt(c.statistics?.subscriberCount || "0", 10),
      videoCount: parseInt(c.statistics?.videoCount || "0", 10),
      top: vids.slice(0, 30),     // best performers (grounding)
      recent: vids.slice().sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1)).slice(0, 20),
      all: vids.map(v => ({ title: v.title, views: v.views, date: (v.publishedAt || "").slice(0, 10) })), // full catalogue for insights
    });
  } catch (e) {
    return jsonRes(502, { error: String((e as Error).message || e) });
  }
});
