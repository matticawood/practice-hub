// video-ai — Claude-backed ideation for the YouTube Idea Studio (owner-only).
//
// Works VEHICLE-FIRST, following Matthew's framework: a genuinely fascinating
// musical thing (the "vehicle") -> the human mystery hidden inside it -> a title
// that makes someone stop -> an investigation the viewer discovers alongside him
// -> a human truth that matters beyond music.
//
// Modes (each streams a forced tool-call JSON the client concatenates + JSON.parses):
//   { mode:"vehicles", count?, theme?, avoid?[], channelContext? }
//   { mode:"develop",  vehicle, kind?, angle?, channelContext? }
//   { mode:"refine",   idea, instruction }
//
// Owner-gated (verifies the caller's Supabase JWT == owner). Needs ANTHROPIC_API_KEY.

const MODEL = "claude-opus-4-8";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://gyskfutmncprqxazgatv.supabase.co";
const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY") || "";
const OWNER_EMAIL = "matthew@matthewcawood.com";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `You are the ideation partner for Matthew Cawood, a pianist and educator on YouTube (143K+ subscribers). His best videos are not piano tutorials or theory explainers. They use music as evidence to reveal something about being human. People who do not care about piano should still want to watch.

His framework, which you must follow exactly, is VEHICLE-FIRST:

1) VEHICLE — a concrete, genuinely fascinating musical thing: a specific piece, a performance, a composer, a rhythm, a musical phenomenon, a single moment. The vehicle is not the topic; it is the evidence. (e.g. Elgar's Nimrod, a Bartok Bulgarian rhythm, Chopin's Prelude in E minor, the James Bond chord, the Avengers theme, Rachmaninoff.)
2) HUMAN MYSTERY — the human question hiding inside that vehicle. NOT a piano question, NOT a theory question, NOT a "how to". A question that makes someone stop and think: Why do we miss people? Why do we need hope? Why does playing the right notes still fail? Why do we cry at certain sounds? Why do humans dance? The audience should care even if they never touch a piano.
3) THE MYSTERY/HOOK — the vehicle must create a genuine "wait... how is that possible?" or "why does it do that?". This is what keeps people watching.
4) INVESTIGATION — the bulk of the video. NOT "here's the answer" but "let's figure it out". The viewer discovers it alongside him through examples, comparisons, demonstrations at the piano, stories, and analysis. Lay this out as a short ordered list of beats.
5) HUMAN PAYOFF — the answer must matter beyond music. The viewer should leave thinking "that taught me something about people," not "that taught me a music fact."

TITLES: curiosity-first, human, and honest. Often a question ("Why doesn't playing the right notes work?") or a quietly surprising claim. They make a non-musician stop. Avoid cheap clickbait, avoid "How to..." and avoid jargon. 4-6 distinct options per idea, varied in angle.

VOICE: thoughtful, warm, a little philosophical, never gimmicky. He genuinely wonders about these things. The throughline of his work is that music is communication, it is about being human.

Always start from a vehicle that is genuinely fascinating in its own right, then ask "what human truth is hiding inside this?". Be specific and concrete, never generic. Reference real pieces, real moments, real musical detail.`;

const VEHICLES_TOOL = {
  name: "emit_vehicles",
  description: "Return a list of fascinating musical vehicles, each with the human mystery it could hide.",
  input_schema: {
    type: "object",
    properties: {
      vehicles: {
        type: "array",
        items: {
          type: "object",
          properties: {
            vehicle: { type: "string", description: "the concrete musical thing (piece/performance/composer/rhythm/phenomenon/moment)" },
            kind: { type: "string", enum: ["piece", "rhythm", "performance", "composer", "phenomenon", "moment"] },
            fascination: { type: "string", description: "one or two sentences on why this is genuinely fascinating / creates a 'how is that possible?'" },
            mysteryHint: { type: "string", description: "the human question hiding inside it (not a piano/theory question)" },
          },
          required: ["vehicle", "kind", "fascination", "mysteryHint"],
        },
      },
    },
    required: ["vehicles"],
  },
};

const IDEA_TOOL = {
  name: "emit_idea",
  description: "Return a fully developed video idea built from a vehicle, following the framework.",
  input_schema: {
    type: "object",
    properties: {
      vehicle: { type: "string" },
      kind: { type: "string" },
      question: { type: "string", description: "the human question (not about piano/theory)" },
      mystery: { type: "string", description: "the 'wait, how is that possible?' the vehicle creates" },
      titles: { type: "array", items: { type: "string" }, description: "4-6 distinct title options in his voice" },
      outline: { type: "array", items: { type: "string" }, description: "the investigation beats, in order, that the viewer discovers alongside him" },
      payoff: { type: "string", description: "the human truth it lands on, that matters beyond music" },
    },
    required: ["question", "mystery", "titles", "outline", "payoff"],
  },
};

const INSIGHTS_SYSTEM = `You are a sharp, honest YouTube channel strategist for Matthew Cawood (pianist/educator). You also understand his creative DNA: his strongest work uses music as evidence to reveal a human truth, vehicle-first. Analyse his real video data (titles + view counts + dates). Be specific and evidence-based: quote actual titles and view counts, separate what genuinely overperforms from what flops, spot the title structures that win, notice how the channel is evolving over time, and give concrete, opinionated direction, not vague encouragement. Where a strong direction fits his "human truth inside the music" approach, say so. Do not flatter; tell him what to do more of, less of, and what to try next.`;

const INSIGHTS_TOOL = {
  name: "emit_insights",
  description: "Evidence-based strategic analysis of the channel with concrete direction.",
  input_schema: {
    type: "object",
    properties: {
      headline: { type: "string", description: "one or two sentences: where the channel is strongest and where it should head" },
      whatWorks: { type: "array", items: { type: "object", properties: {
        pattern: { type: "string" }, why: { type: "string" },
        examples: { type: "array", items: { type: "string" }, description: "real titles (with views) that prove it" },
      }, required: ["pattern", "why"] } },
      whatFlops: { type: "array", items: { type: "object", properties: {
        pattern: { type: "string" }, why: { type: "string" },
      }, required: ["pattern", "why"] } },
      titlePatterns: { type: "array", items: { type: "string" }, description: "title styles/structures that correlate with high views" },
      opportunities: { type: "array", items: { type: "object", properties: {
        idea: { type: "string" }, why: { type: "string" },
      }, required: ["idea", "why"] } },
      directions: { type: "array", items: { type: "string" }, description: "3-6 concrete strategic moves / where to go next" },
    },
    required: ["headline", "whatWorks", "directions"],
  },
};

// Anthropic-hosted web search tool (live internet) for the fact-check pass.
const WEB_SEARCH_TOOL = { type: "web_search_20250305", name: "web_search", max_uses: 6 };

const FACTCHECK_SYSTEM = `You are a meticulous music fact-checker. You verify CONCRETE FACTUAL claims using web search before judging them: historical events and dates, who composed/wrote/premiered what, attributions, "first to do X", biographical facts, and specific verifiable musical-theory assertions. You IGNORE subjective, interpretive, or artistic statements (e.g. "the saddest piece", "it feels like grief") because those are not facts to check. Popular myths repeated as fact must be flagged. Always search before judging; never rely on memory for a specific claim.`;

function ctxBlock(channelContext?: string, avoid?: string[]) {
  let s = "";
  if (channelContext) s += `\n\nFor grounding, here is what this channel's audience already responds to (recent/top videos with view counts). Match this appetite, and do NOT repeat topics already covered:\n${channelContext}`;
  if (avoid && avoid.length) s += `\n\nAlready in the backlog (do not repeat these vehicles): ${avoid.join("; ")}`;
  return s;
}

function buildRequest(body: any) {
  const mode = body?.mode;
  if (mode === "vehicles") {
    const count = Math.min(Math.max(parseInt(body.count) || 8, 3), 14);
    const theme = body.theme ? `\n\nLean toward this theme/feeling if you can, but only if it stays genuinely fascinating: "${body.theme}".` : "";
    const user = `Brainstorm ${count} fascinating musical VEHICLES for new videos. Each must be concrete and specific, must create a genuine "how is that possible?", and must hide a human mystery the wider audience would care about.${theme}${ctxBlock(body.channelContext, body.avoid)}`;
    return { model: MODEL, max_tokens: 3200, stream: true, system: SYSTEM,
      tools: [VEHICLES_TOOL], tool_choice: { type: "tool", name: "emit_vehicles" },
      messages: [{ role: "user", content: user }] };
  }
  if (mode === "develop") {
    if (!body.vehicle) return null;
    const angle = body.angle ? `\n\nPreferred angle / human question to explore (use it if it's strong, otherwise find a better one): "${body.angle}".` : "";
    const user = `Develop this vehicle into a full video idea, following the framework end to end.\n\nVehicle: ${body.vehicle}${body.kind ? ` (${body.kind})` : ""}.${angle}${ctxBlock(body.channelContext)}\n\nReturn the human question, the mystery/hook, 4-6 title options, the investigation outline (ordered beats the viewer discovers with him), and the human payoff.`;
    return { model: MODEL, max_tokens: 3000, stream: true, system: SYSTEM,
      tools: [IDEA_TOOL], tool_choice: { type: "tool", name: "emit_idea" },
      messages: [{ role: "user", content: user }] };
  }
  if (mode === "refine") {
    if (!body.idea || !body.instruction) return null;
    const user = `Here is a current video idea (JSON):\n${JSON.stringify(body.idea)}\n\nRefine it per this instruction: "${body.instruction}". Keep what works. Return the full idea again in the same shape.`;
    return { model: MODEL, max_tokens: 3000, stream: true, system: SYSTEM,
      tools: [IDEA_TOOL], tool_choice: { type: "tool", name: "emit_idea" },
      messages: [{ role: "user", content: user }] };
  }
  if (mode === "insights") {
    if (!body.channelData) return null;
    const meta = body.meta ? `${body.meta}\n\n` : "";
    const user = `${meta}Here is the channel's full catalogue (title | views | date):\n\n${body.channelData}\n\nAnalyse it honestly and specifically. What genuinely overperforms vs underperforms? Which title structures win? How is the channel evolving over time? Where should it go next, especially in service of the vehicle-first "human truth inside the music" approach? Use real titles and view counts as evidence throughout.`;
    return { model: MODEL, max_tokens: 6500, stream: true, system: INSIGHTS_SYSTEM,
      tools: [INSIGHTS_TOOL], tool_choice: { type: "tool", name: "emit_insights" },
      messages: [{ role: "user", content: user }] };
  }
  if (mode === "factcheck") {
    if (!body.idea) return null;
    const user = `Fact-check the concrete factual claims in this music video idea. Use web search to verify each one before judging; do not rely on memory.\n\nIdea (JSON):\n${JSON.stringify(body.idea)}\n\nFind every verifiable factual claim (ignore subjective/artistic statements). For each, give: the claim, a verdict (one of: verified, false, misleading, unverified), a short note (the correction or nuance), and a source URL you actually used.\n\nWhen done, end your reply with ONLY this JSON inside a \`\`\`json fenced code block:\n{ "claims": [ { "claim": "...", "verdict": "verified|false|misleading|unverified", "note": "...", "source": "https://..." } ], "summary": "one short overall line" }`;
    // Web search needs the agentic loop, so NO forced tool here; the model searches
    // then writes a text answer ending in the JSON block (the client extracts it).
    return { model: MODEL, max_tokens: 4000, stream: true, system: FACTCHECK_SYSTEM,
      tools: [WEB_SEARCH_TOOL], messages: [{ role: "user", content: user }] };
  }
  return null;
}

const jsonError = (status: number, message: string) =>
  new Response(JSON.stringify({ error: message }), { status, headers: { ...cors, "content-type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return jsonError(405, "Use POST.");

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return jsonError(500, "ANTHROPIC_API_KEY is not set on the server.");

  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return jsonError(401, "Unauthorised");
  let caller: string | undefined;
  try {
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON },
    });
    if (!userRes.ok) return jsonError(401, "Unauthorised");
    caller = (await userRes.json())?.email;
  } catch { return jsonError(401, "Unauthorised"); }
  if (!caller || caller.toLowerCase() !== OWNER_EMAIL) return jsonError(403, "Forbidden");

  let body: any;
  try { body = await req.json(); } catch { return jsonError(400, "Invalid JSON body."); }

  const payload = buildRequest(body);
  if (!payload) return jsonError(400, "mode must be one of: vehicles, develop, refine (with required fields).");

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const fail = (msg: string) => controller.enqueue(encoder.encode("\n__ERROR__" + msg));
      try {
        let upstream: Response;
        try {
          upstream = await fetch(ANTHROPIC_URL, {
            method: "POST",
            headers: { "x-api-key": apiKey, "anthropic-version": ANTHROPIC_VERSION, "content-type": "application/json" },
            body: JSON.stringify(payload),
          });
        } catch (e: any) { fail("Could not reach the Claude API: " + (e?.message || e)); return; }

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          fail("Claude API error (" + (upstream.status || "?") + "): " + detail.slice(0, 300));
          return;
        }

        const reader = upstream.body.getReader();
        let buf = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let sep: number;
          while ((sep = buf.indexOf("\n\n")) !== -1) {
            const rawEvent = buf.slice(0, sep);
            buf = buf.slice(sep + 2);
            for (const line of rawEvent.split("\n")) {
              if (!line.startsWith("data:")) continue;
              const data = line.slice(5).trim();
              if (!data || data === "[DONE]") continue;
              let evt: any;
              try { evt = JSON.parse(data); } catch { continue; }
              if (evt.type === "content_block_delta") {
                // structured modes stream forced-tool JSON; factcheck (web search) streams text
                if (evt.delta?.type === "input_json_delta" && evt.delta.partial_json) {
                  controller.enqueue(encoder.encode(evt.delta.partial_json));
                } else if (evt.delta?.type === "text_delta" && evt.delta.text) {
                  controller.enqueue(encoder.encode(evt.delta.text));
                }
              } else if (evt.type === "error") {
                fail(evt.error?.message || "generation error");
              }
            }
          }
        }
      } catch (e: any) {
        fail(e?.message || "stream error");
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { ...cors, "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
});
