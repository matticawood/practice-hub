// Ingest for landing-page (/signup) analytics beacons.
// The public signup page sends small cookieless events here via navigator.sendBeacon:
//   view | scroll | video_play | cta_click | leave
// We validate, cap lengths, stamp coarse geo country (no IP stored), and insert one
// row into signup_events using the Supabase service-role key (bypasses RLS).
// Accessible at /.netlify/functions/track (POST). Always returns fast; never throws
// to the client.

const SUPABASE_URL = "https://gyskfutmncprqxazgatv.supabase.co";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const EVENTS = new Set(["view", "scroll", "video_play", "cta_click", "leave"]);

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Trim a value to a string of at most n chars, or null.
const s = (v, n) => {
  if (v === undefined || v === null) return null;
  const str = String(v).trim();
  return str ? str.slice(0, n) : null;
};
// Clamp to a non-negative integer within [0, max], or null.
const int = (v, max) => {
  const n = parseInt(v, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.min(n, max);
};

function geoCountry(evt) {
  // Netlify sets x-nf-geo (base64 JSON) and often x-country.
  try {
    const raw = evt.headers["x-nf-geo"] || evt.headers["X-Nf-Geo"];
    if (raw) {
      const geo = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
      const c = geo && geo.country && geo.country.code;
      if (c) return String(c).slice(0, 2).toUpperCase();
    }
  } catch (_) { /* ignore */ }
  const xc = evt.headers["x-country"] || evt.headers["X-Country"];
  return xc ? String(xc).slice(0, 2).toUpperCase() : null;
}

exports.handler = async (evt) => {
  if (evt.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  if (evt.httpMethod !== "POST") return { statusCode: 405, headers, body: "" };

  try {
    if (!SERVICE) return { statusCode: 204, headers, body: "" }; // misconfigured; fail silent
    const b = JSON.parse(evt.body || "{}");

    const vid = s(b.vid, 64);
    const event = s(b.event, 20);
    if (!vid || !event || !EVENTS.has(event)) {
      return { statusCode: 204, headers, body: "" }; // drop junk quietly
    }

    const row = {
      vid,
      event,
      path: s(b.path, 200),
      referrer: s(b.referrer, 300),
      utm_source: s(b.utm_source, 100),
      utm_medium: s(b.utm_medium, 100),
      utm_campaign: s(b.utm_campaign, 100),
      utm_content: s(b.utm_content, 100),
      utm_term: s(b.utm_term, 100),
      device: s(b.device, 16),
      screen_w: int(b.screen_w, 20000),
      scroll_pct: int(b.scroll_pct, 100),
      cta: s(b.cta, 60),
      dur_ms: int(b.dur_ms, 86400000), // cap at 24h
      country: geoCountry(evt),
      ua: s(evt.headers["user-agent"] || evt.headers["User-Agent"], 300),
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/signup_events`, {
      method: "POST",
      headers: {
        apikey: SERVICE,
        Authorization: `Bearer ${SERVICE}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    });
    if (!res.ok) console.error("track insert failed:", res.status, await res.text());
  } catch (e) {
    console.error("track error:", e && e.message ? e.message : e);
  }
  // Beacons don't read the body; always 204.
  return { statusCode: 204, headers, body: "" };
};
