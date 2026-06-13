/* ──────────────────────────────────────────────────────────────────────────
   insights — Claude-backed structured readout for Admin Analytics.

   The admin page computes all metrics client-side and POSTs them here as a
   compact JSON object (aggregates only, no raw PII). Each metric is labelled,
   and email campaigns carry a "what" description so the model knows what each
   send was and who it went to. Claude returns STRUCTURED insights (headline +
   grouped sections + concrete actions), forced through a tool call.

   Owner-gated (verifies the caller's Supabase JWT). Requires ANTHROPIC_API_KEY.
─────────────────────────────────────────────────────────────────────────── */

const MODEL = "claude-opus-4-8";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

const SUPABASE_URL  = "https://gyskfutmncprqxazgatv.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5c2tmdXRtbmNwcnF4YXpnYXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjIwMTYsImV4cCI6MjA5MTMzODAxNn0.ttC3plmhbA7ls_T3w25XgYT0WBt6O3MMu0G6NrEKI9g";
const OWNER_EMAIL   = "matthew@matthewcawood.com";

const SYSTEM = [
  "You are a sharp, sceptical analyst for Matthew Cawood, a concert pianist running an online piano business:",
  "a brand site, a Stripe store (PDF books/guides + a course), one-to-one lessons and clinics booked on the site,",
  "a weekly email (Monday Music Tips), a pre-launch waitlist, and a membership app (The Practice Room).",
  "",
  "You receive a labelled JSON object of aggregated metrics. Produce INSIGHTS, not a description of the numbers.",
  "",
  "WHAT AN INSIGHT IS: an interpretation that tells Matthew something he could act on. Every point must say what a",
  "number MEANS or what to DO about it. Never simply restate a figure. 'Waitlist had 56% open' is not an insight;",
  "'the waitlist is warm, so it is the right audience to push the next paid launch to' is.",
  "",
  "HARD RULES ON STATISTICS (this matters most):",
  "- Treat any rate (open %, click %, conversion %, active %) computed from FEWER THAN 30 people as statistically",
  "  meaningless. Do NOT analyse it, do NOT call it 'above/below typical', do NOT infer a trend or a problem from it.",
  "  At most, note the raw count exists. A 0% or 100% on 2 to 4 people is noise, say nothing about it.",
  "- Only the waitlist-sized sends (dozens to hundreds) are worth rate analysis. Onboarding/transactional sends with",
  "  a handful of recipients are not.",
  "",
  "USE THE LABELS, DO NOT INVENT DATA:",
  "- Each email campaign includes a 'what' field describing what it is and who it went to. Use it. Do not guess.",
  "- The membership 'active' figures come from the app heartbeat (last_seen while signed in) plus other activity,",
  "  and active-time figures from tracked usage seconds. A member with no heartbeat for weeks genuinely has not",
  "  opened the app, so this IS a usable engagement signal: you may flag low active counts as a real retention",
  "  concern and suggest action. Avoid absolute claims like 'paying for nothing' (you cannot see billing here).",
  "- If a figure is not in the data, do not assert it. Say it is not measured.",
  "- The site funnels (traffic, store views, booking steps) only started recording very recently, so low counts there",
  "  mean 'not enough data yet', not 'poor performance'.",
  "",
  "Return ONLY by calling emit_insights. Keep each point to 1 to 2 sentences. Plain English. No em dashes. No emojis.",
].join("\n");

const TOOL = {
  name: "emit_insights",
  description: "Return the structured business readout.",
  input_schema: {
    type: "object",
    properties: {
      headline: { type: "string", description: "One sentence: the single most important, well-supported takeaway right now. If data is too thin overall, say so here." },
      sections: {
        type: "array",
        description: "2 to 5 grouped insights, ordered by importance. Skip any area where the data is too thin to judge rather than padding.",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "Short label, e.g. 'Strength: email to warm lists', 'Watch: membership activity', 'Too early to tell: store funnel'." },
            points: { type: "array", items: { type: "string" }, description: "1 to 3 interpretive points. Each says what it means or what to do." },
          },
          required: ["title", "points"],
        },
      },
      actions: {
        type: "array",
        description: "2 to 4 concrete next actions tied to the actual numbers. Only suggest actions the data supports.",
        items: {
          type: "object",
          properties: { action: { type: "string" }, why: { type: "string", description: "The number/insight that motivates it." } },
          required: ["action", "why"],
        },
      },
      caveats: { type: "array", items: { type: "string" }, description: "Data that is too thin to judge, or metrics that should not be over-read. Be explicit here rather than guessing in the sections." },
    },
    required: ["headline", "sections", "actions"],
  },
};

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
}

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response("", { status: 204 });
  if (req.method !== "POST") return jsonResponse({ error: "Use POST." }, 405);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return jsonResponse({ error: "ANTHROPIC_API_KEY is not set on the server." }, 500);

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

  const userText = [
    `Time window: ${(body.window || "all time").toString().slice(0, 60)}.`,
    "Labelled aggregated metrics (read the labels; do not analyse rates on samples under 30):",
    "```json",
    JSON.stringify(metrics).slice(0, 24000),
    "```",
    "Now call emit_insights with real insights, respecting the statistical rules.",
  ].join("\n");

  let upstream;
  try {
    upstream = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": ANTHROPIC_VERSION, "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4000,
        thinking: { type: "adaptive" },
        system: SYSTEM,
        tools: [TOOL],
        tool_choice: { type: "tool", name: "emit_insights" },
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
  const tool = Array.isArray(data.content) ? data.content.find((b) => b.type === "tool_use" && b.name === "emit_insights") : null;
  if (!tool || !tool.input) return jsonResponse({ error: "No insight produced." }, 502);

  return jsonResponse({ insights: tool.input });
}
