/* ──────────────────────────────────────────────────────────────────────────
   insights — Claude-backed plain-English readout for Admin Analytics.

   The admin page computes all the metrics client-side and POSTs them here as a
   compact JSON object (aggregates only, no raw PII). Claude turns them into a
   short, specific readout: what's working, what's not, the biggest opportunity,
   and a couple of concrete next actions. Button-triggered (cost control).

   Owner-gated (verifies the caller's Supabase JWT). Requires ANTHROPIC_API_KEY
   in the Netlify site env.
─────────────────────────────────────────────────────────────────────────── */

const MODEL = "claude-opus-4-8";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

const SUPABASE_URL  = "https://gyskfutmncprqxazgatv.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5c2tmdXRtbmNwcnF4YXpnYXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjIwMTYsImV4cCI6MjA5MTMzODAxNn0.ttC3plmhbA7ls_T3w25XgYT0WBt6O3MMu0G6NrEKI9g";
const OWNER_EMAIL   = "matthew@matthewcawood.com";

const SYSTEM = [
  "You are a sharp, practical growth analyst for Matthew Cawood, a concert pianist who runs an online piano business:",
  "a brand site, a Stripe store (PDF books, guides, and a course), one-to-one lessons + clinics booked through the site,",
  "a weekly email called Monday Music Tips, and a membership app called The Practice Room.",
  "",
  "You will be given a JSON object of aggregated analytics covering the WHOLE business: site traffic, the store",
  "funnel, the lesson/booking funnel, email performance, the /signup acquisition funnel, and membership health",
  "(member count, active members, community activity). Write a concise readout for the owner that joins these up,",
  "for example, traffic that is not converting to store sales, or members who sign up but do not stay active.",
  "",
  "Structure your answer in short labelled sections with these headings exactly:",
  "What's working, What's underperforming, Biggest opportunity, Do next.",
  "Under 'Do next', give 2 to 4 specific, concrete actions tied to the numbers (not generic advice).",
  "",
  "Hard rules:",
  "- Be specific and quote the actual numbers from the data. No vague filler.",
  "- If the data is too thin to judge something, say so plainly rather than inventing a trend.",
  "- Plain English. No jargon. No hype.",
  "- NEVER use em dashes. Use commas, full stops, or 'and'.",
  "- No emojis.",
  "- Keep it tight despite the breadth: roughly 220 to 420 words. Prioritise the few things that matter most.",
].join("\n");

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
}

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response("", { status: 204 });
  if (req.method !== "POST") return jsonResponse({ error: "Use POST." }, 405);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return jsonResponse({ error: "ANTHROPIC_API_KEY is not set on the server." }, 500);

  // ── Owner-only: this endpoint spends Claude tokens, so verify the caller ──
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return jsonResponse({ error: "Unauthorised" }, 401);
  let caller;
  try {
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON },
    });
    if (!userRes.ok) return jsonResponse({ error: "Unauthorised" }, 401);
    ({ email: caller } = await userRes.json());
  } catch { return jsonResponse({ error: "Unauthorised" }, 401); }
  if (!caller || caller.toLowerCase() !== OWNER_EMAIL) return jsonResponse({ error: "Forbidden" }, 403);

  let body;
  try { body = await req.json(); } catch { return jsonResponse({ error: "Invalid JSON body." }, 400); }
  const metrics = body && body.metrics;
  if (!metrics) return jsonResponse({ error: "Missing metrics." }, 400);

  const windowLabel = (body.window || "the selected period").toString().slice(0, 60);
  const userText = [
    `Time window: ${windowLabel}.`,
    "Here is the aggregated analytics JSON:",
    "```json",
    JSON.stringify(metrics).slice(0, 24000),
    "```",
    "Write the readout now.",
  ].join("\n");

  let upstream;
  try {
    upstream = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": ANTHROPIC_VERSION, "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 3000,
        thinking: { type: "adaptive" },
        system: SYSTEM,
        messages: [{ role: "user", content: userText }],
      }),
    });
  } catch (e) {
    return jsonResponse({ error: "Could not reach the Claude API: " + (e?.message || e) }, 502);
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    return jsonResponse({ error: "Claude API error: " + detail.slice(0, 400) }, upstream.status || 502);
  }

  let data;
  try { data = await upstream.json(); } catch { return jsonResponse({ error: "Bad response from Claude." }, 502); }
  const text = Array.isArray(data.content)
    ? data.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim()
    : "";
  if (!text) return jsonResponse({ error: "No insight produced." }, 502);

  return jsonResponse({ text });
}
