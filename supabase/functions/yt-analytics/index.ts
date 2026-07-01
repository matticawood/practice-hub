// yt-analytics — owner-only YouTube ANALYTICS (the YouTube Studio data a plain
// API key cannot read). Returns per-video retention, watch time and subscribers
// gained, plus channel-level traffic sources, so the Idea Studio can ground
// ideation in what actually HOLDS people and GROWS the channel, not raw views.
//
// Auth: needs a refresh token minted once via scripts/yt-oauth.mjs, stored as
// the secrets YT_OAUTH_CLIENT_ID / YT_OAUTH_CLIENT_SECRET / YT_OAUTH_REFRESH_TOKEN.
// Owner-gated (Supabase JWT email == owner), same as yt-channel.
//
// GET ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD   (defaults: last ~18 months)

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://gyskfutmncprqxazgatv.supabase.co";
const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY") || "";
const OWNER_EMAIL = "matthew@matthewcawood.com";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const j = (status: number, obj: unknown) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, "content-type": "application/json", "cache-control": "private, max-age=600" } });

async function accessToken(): Promise<string> {
  const id = Deno.env.get("YT_OAUTH_CLIENT_ID");
  const secret = Deno.env.get("YT_OAUTH_CLIENT_SECRET");
  const refresh = Deno.env.get("YT_OAUTH_REFRESH_TOKEN");
  if (!id || !secret || !refresh) {
    throw new Error("YouTube OAuth not configured (set YT_OAUTH_CLIENT_ID / YT_OAUTH_CLIENT_SECRET / YT_OAUTH_REFRESH_TOKEN). Run scripts/yt-oauth.mjs once.");
  }
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: id, client_secret: secret, refresh_token: refresh, grant_type: "refresh_token" }),
  });
  const t = await r.json();
  if (!t.access_token) throw new Error("Token refresh failed: " + JSON.stringify(t).slice(0, 200));
  return t.access_token as string;
}

async function report(at: string, params: Record<string, string>) {
  const qs = new URLSearchParams({ ids: "channel==MINE", ...params }).toString();
  const r = await fetch(`https://youtubeanalytics.googleapis.com/v2/reports?${qs}`, { headers: { Authorization: `Bearer ${at}` } });
  const data = await r.json();
  if (data.error) throw new Error(data.error.message || "analytics error");
  const cols: string[] = (data.columnHeaders || []).map((c: { name: string }) => c.name);
  const idx = (n: string) => cols.indexOf(n);
  return { cols, idx, rows: (data.rows || []) as (string | number)[][] };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  // owner-gate
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return j(401, { error: "Unauthorised" });
  try {
    const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON } });
    if (!u.ok) return j(401, { error: "Unauthorised" });
    const email = (await u.json())?.email;
    if (!email || email.toLowerCase() !== OWNER_EMAIL) return j(403, { error: "Forbidden" });
  } catch { return j(401, { error: "Unauthorised" }); }

  const url = new URL(req.url);
  const endDate = url.searchParams.get("endDate") || new Date().toISOString().slice(0, 10);
  const startDate = url.searchParams.get("startDate") || (() => {
    const d = new Date(); d.setMonth(d.getMonth() - 18); return d.toISOString().slice(0, 10);
  })();

  try {
    const at = await accessToken();
    const ninetyAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 90); return d.toISOString().slice(0, 10); })();
    const detailN = Math.min(20, Math.max(1, parseInt(url.searchParams.get("detail") || "12", 10)));

    // human labels for YouTube's traffic-source codes, CALIBRATED against Studio's
    // own labels (verified by reconciling a real video to its Studio breakdown).
    // IMPORTANT: the API's "SUBSCRIBER" code is NOT "subscriptions feed" — on this
    // channel it reconciles to Studio's "YouTube Home" + "Subscriptions feed"
    // combined, and is overwhelmingly Home. So it is the home/recommendations feed.
    const SRC: Record<string, string> = {
      SUBSCRIBER: "Home + Subs feed", BROWSE_FEATURES: "Home (browse)",
      RELATED_VIDEO: "Suggested (Up next)", YT_SEARCH: "Search",
      NOTIFICATION: "Notifications", NO_LINK_OTHER: "Direct/unknown",
      NO_LINK_EMBEDDED: "Embedded", EXT_URL: "External", YT_CHANNEL: "Channel page",
      YT_OTHER_PAGE: "Other YouTube page", PLAYLIST: "Playlist", SHORTS: "Shorts feed",
      END_SCREEN: "End screen", ANNOTATION: "Card", HASHTAGS: "Hashtags", PRODUCT_PAGE: "Product",
    };
    const lbl = (s: string) => SRC[s] || s;
    const mix = (rows: (string | number)[][], idx: (n: string) => number, dim: string, label: (s: string) => string = lbl) => {
      const tot = rows.reduce((a, x) => a + Number(x[idx("views")]), 0) || 1;
      return rows.map((x) => ({ source: label(String(x[idx(dim)])), pct: Math.round(Number(x[idx("views")]) / tot * 100) })).filter((t) => t.pct > 0);
    };

    // 1) core per-video metrics (all videos, one call) — retention, watch time, growth
    const perVid = await report(at, {
      startDate, endDate,
      metrics: "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained",
      dimensions: "video", sort: "-estimatedMinutesWatched", maxResults: "200",
    });
    const videos: any[] = perVid.rows.map((row) => ({
      videoId: row[perVid.idx("video")] as string,
      views: Number(row[perVid.idx("views")]),
      minutesWatched: Number(row[perVid.idx("estimatedMinutesWatched")]),
      avgViewDuration: Number(row[perVid.idx("averageViewDuration")]),
      avgViewPct: Number(row[perVid.idx("averageViewPercentage")]),
      subsGained: Number(row[perVid.idx("subscribersGained")]),
    }));

    // 2) titles / dates / durations via the Data API (OAuth bearer, youtube.readonly)
    const allIds = videos.map((v) => v.videoId);
    const meta: Record<string, { title: string; date: string; sec: number; isShort: boolean }> = {};
    for (let i = 0; i < allIds.length; i += 50) {
      const r = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${allIds.slice(i, i + 50).join(",")}`, { headers: { Authorization: `Bearer ${at}` } });
      const d = await r.json();
      for (const it of (d.items || [])) {
        const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(it.contentDetails?.duration || "") || [];
        const sec = (+(m[1] || 0)) * 3600 + (+(m[2] || 0)) * 60 + (+(m[3] || 0));
        meta[it.id] = { title: it.snippet?.title || "", date: (it.snippet?.publishedAt || "").slice(0, 10), sec, isShort: sec > 0 && sec <= 60 };
      }
    }
    for (const v of videos) {
      const m = meta[v.videoId];
      if (m) { v.title = m.title; v.date = m.date; v.durationSec = m.sec; v.isShort = m.isShort; }
      v.subsPer1k = v.views ? +(v.subsGained / v.views * 1000).toFixed(2) : 0;
    }

    // 3) deep-analyse the most RECENT long-form videos (current direction): per-video
    //    traffic split (Home/Suggested/Search vs Subscribers) + the retention curve
    //    so we can see WHERE people drop off.
    const recent = videos.filter((v) => v.date && !v.isShort).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, detailN);
    let ri = 0;
    for (const v of recent) {
      const withCurve = ri < 3; ri++;
      try {
        const ts = await report(at, { startDate: v.date, endDate, metrics: "views", dimensions: "insightTrafficSourceType", sort: "-views", filters: `video==${v.videoId}` });
        v.traffic = mix(ts.rows, ts.idx, "insightTrafficSourceType");
        // retention curve + YouTube's relative-retention benchmark (1.0 ~ typical for this length)
        const rc = await report(at, { startDate: v.date, endDate, metrics: "audienceWatchRatio,relativeRetentionPerformance", dimensions: "elapsedVideoTimeRatio", filters: `video==${v.videoId}` });
        const ti = rc.idx("elapsedVideoTimeRatio"), wi = rc.idx("audienceWatchRatio"), li = rc.idx("relativeRetentionPerformance");
        const pts = rc.rows.map((r) => ({ r: Number(r[ti]), w: Number(r[wi]), rel: Number(r[li]) })).sort((a, b) => a.r - b.r);
        const at_ = (f: number) => { let b = pts[0]; for (const p of pts) if (Math.abs(p.r - f) < Math.abs(b.r - f)) b = p; return b ? b.w : 0; };
        let drop = { pts: 0, r: 0 };
        for (let i = 1; i < pts.length; i++) { const d = pts[i - 1].w - pts[i].w; if (d > drop.pts) drop = { pts: d, r: pts[i].r }; }
        const relAvg = (lo: number, hi: number) => { const s = pts.filter((p) => p.r >= lo && p.r <= hi); return s.length ? s.reduce((a, p) => a + p.rel, 0) / s.length : 0; };
        v.retention = {
          startPct: Math.round(at_(0) * 100), at30Pct: Math.round(at_(0.3) * 100), endPct: Math.round(at_(0.98) * 100),
          biggestDropPts: Math.round(drop.pts * 100), biggestDropAtSec: Math.round(drop.r * (v.durationSec || 0)),
          relOpening: +relAvg(0, 0.1).toFixed(2), relWhole: +relAvg(0, 1).toFixed(2), // <0.5 = below typical, >0.5 = above
        };
        if (withCurve && pts.length) {
          const N = 30, step = pts.length / N, curve: { t: number; w: number; rel: number }[] = [];
          for (let i = 0; i < N; i++) { const p = pts[Math.min(pts.length - 1, Math.floor(i * step))]; curve.push({ t: +p.r.toFixed(3), w: +p.w.toFixed(3), rel: +p.rel.toFixed(2) }); }
          v.curve = curve;
        }
      } catch (_) { /* skip detail for this video */ }
    }

    // 4) channel-level (last 90d): traffic mix, devices, age, new vs returning
    const channel: any = {};
    try { const t = await report(at, { startDate: ninetyAgo, endDate, metrics: "views", dimensions: "insightTrafficSourceType", sort: "-views" }); channel.traffic = mix(t.rows, t.idx, "insightTrafficSourceType"); } catch (_) {}
    try { const dv = await report(at, { startDate: ninetyAgo, endDate, metrics: "views", dimensions: "deviceType", sort: "-views" }); channel.devices = mix(dv.rows, dv.idx, "deviceType", (s) => s); } catch (_) {}
    try { const ag = await report(at, { startDate: ninetyAgo, endDate, metrics: "viewerPercentage", dimensions: "ageGroup", sort: "-viewerPercentage" }); channel.age = ag.rows.map((x) => ({ group: String(x[ag.idx("ageGroup")]).replace("age", ""), pct: +Number(x[ag.idx("viewerPercentage")]).toFixed(1) })); } catch (_) {}
    try { const sb = await report(at, { startDate: ninetyAgo, endDate, metrics: "views", dimensions: "subscribedStatus" }); const tot = sb.rows.reduce((a, x) => a + Number(x[sb.idx("views")]), 0) || 1; const mm: any = {}; sb.rows.forEach((x) => mm[String(x[sb.idx("subscribedStatus")])] = Number(x[sb.idx("views")])); channel.newPct = Math.round((mm.UNSUBSCRIBED || 0) / tot * 100); channel.returningPct = Math.round((mm.SUBSCRIBED || 0) / tot * 100); } catch (_) {}

    return j(200, { startDate, endDate, channel, count: videos.length, detailed: recent.map((v) => v.videoId), videos });
  } catch (e) {
    return j(502, { error: String((e as Error).message || e) });
  }
});
