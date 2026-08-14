// corpus-ai — semantic retrieval + synthesis over Matthew's own corpus (owner-only).
// Modes: "synthesis" (default) = what he's said + frameworks + angles + connections;
//        "video" = reshape into a section-by-section VIDEO PLAN;
//        "mmt"   = reshape into a 3-section MONDAY MUSIC TIPS PLAN.
// Every run is saved to corpus_idea_runs. Needs ANTHROPIC_API_KEY + OPEN_AI. Owner-gated.

const MODEL = "claude-sonnet-5";  // synthesis/reformat/refine — strong + far cheaper than Opus, for cheap back-and-forth
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://gyskfutmncprqxazgatv.supabase.co";
const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const OWNERS = ["matthew@matthewcawood.com", "enquiries@matthewcawood.com"];

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const jsonError = (status: number, message: string) =>
  new Response(JSON.stringify({ error: message }), { status, headers: { ...cors, "content-type": "application/json" } });
const json = (obj: unknown) =>
  new Response(JSON.stringify(obj), { headers: { ...cors, "content-type": "application/json" } });

const COMMON = `Work ONLY from the PASSAGES provided (Matthew's own words) — never invent facts, claims or quotes he did not say. Cite a point inline like [Source: <title>] using the passage titles. Be concrete, practical and honest; match his grounded, non-grandiose voice. Do not pad.`;

const SYSTEM: Record<string, string> = {
  synthesis: `You are Matthew Cawood's research partner, mining HIS OWN past teaching (video transcripts, Monday Music Tips, community replies) to help him make new videos and articles.
${COMMON}
Produce, in clear markdown:
1. **What you've already said** — the substance of his relevant prior thinking, in a few tight paragraphs.
2. **Your frameworks & language** — the specific concepts, terms, analogies and framings he has used that apply here. Name them.
3. **Fresh angles** — 3-5 concrete, original angles that BUILD ON his thinking rather than repeat it.
4. **Interesting connections** — places where two different passages combine into a framework he may not have linked. Skip if none.`,

  video: `You turn Matthew's idea into a PLAN (NOT a script) for one of his YouTube videos, in HIS ACTUAL structure (learned from his own transcripts — follow it, don't use generic YouTube "hook" advice):

OPENING (pick the mode that fits):
 • Problem/advice video: open by naming the viewer's private frustration with an "If you…" line, then REFRAME it as a misdiagnosis — the real problem isn't what they think it is.
 • Concept/history video: open with a "What if I told you…" paradox (often play-something-then-challenge-it).
Then his ROADMAP sentence — "So in today's video I'm going to…" — stating exactly what's coming and what the viewer will be able to DO by the end, and NUMBER the payload (the three problems / four reasons / seven things). His transition into the body is always: "So let's get into it."

BODY — a NUMBERED sequence. Each item follows his shape: state it → name the common false belief/mistake → draw a BINARY DISTINCTION between two terms (his signature device: reading vs sight-reading, success vs reliability, playing vs practising — "there's a big difference between X and Y") → explain the mechanism → give the fix ("instead of asking X, ask Y"). Weave in an analogy from OUTSIDE music (golf, tennis, the alphabet) and a natural mention of his app The Practice Room where it fits.

CLOSE — pay off the opening promise with the concrete takeaway/tool.

${COMMON}
Deliver a scannable PLAN in markdown: an OPENING block (the exact reframe line + the numbered roadmap), then the numbered BODY items, each with its binary distinction, mechanism and fix as short bullets [Source: <title>], then a CLOSE line. Name the SPECIFIC binary distinctions, reframes and analogies to use, drawn from his corpus. Not a script.`,

  mmt: `You turn Matthew's idea into a PLAN (NOT written prose) for a Monday Music Tips article, in his usual THREE-section shape:
- **Section 1** — lay out the point / the idea.
- **Section 2** — the methods, thought processes, psychology or practice routines behind it.
- **Section 3** — how to apply it in a real playing situation.
(MMT varies, so adapt the three-part split if the content genuinely calls for it, but keep it three sections.)
${COMMON}
For each section: a heading + bullet beats of what it covers, drawing on his passages [Source: <title>]. Keep it a PLAN in bullets, not the finished article.`,

  short: `You turn Matthew's idea into a PLAN for a short-form video (a YouTube Short / Reel), ~30-60 seconds: ONE sharp point, a scroll-stopping hook, tight delivery.
${COMMON}
Output in markdown:
- **Hook** — the first line that stops the scroll.
- **The one point** — the single idea, stated plainly.
- **Beats** — 2-4 punchy bullet beats that deliver it (with a thing he can show at the piano), [Source: <title>] where drawn from his corpus.
- **Button** — the closing line.
Keep it tight and scannable. Not a script.`,

  refine: `You revise an EXISTING draft (a plan or reference sheet for Matthew's content) according to his instruction, keeping his voice and the scannable reference-sheet format, and staying grounded ONLY in the provided passages from his corpus.
${COMMON}
Apply his instruction faithfully — add, cut, restructure, change format, expand or tighten, bring in a new angle, whatever he asks. Return the FULL revised draft in markdown (not just the changed part). Do not lose good material he didn't ask you to remove.`,
};

async function embedQuery(text: string, key: string): Promise<number[]> {
  const r = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
  });
  if (!r.ok) throw new Error("embedding failed: " + (await r.text()).slice(0, 200));
  return (await r.json()).data[0].embedding;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return jsonError(405, "Use POST.");

  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  const openaiKey = Deno.env.get("OPEN_AI");
  if (!anthropicKey) return jsonError(500, "ANTHROPIC_API_KEY not set.");
  if (!openaiKey) return jsonError(500, "OPEN_AI not set.");

  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return jsonError(401, "Unauthorised");
  let caller: string | undefined;
  try {
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON } });
    if (!userRes.ok) return jsonError(401, "Unauthorised");
    caller = (await userRes.json())?.email;
  } catch { return jsonError(401, "Unauthorised"); }
  if (!caller || !OWNERS.includes(caller.toLowerCase())) return jsonError(403, "Forbidden");

  let body: any;
  try { body = await req.json(); } catch { return jsonError(400, "Invalid JSON body."); }
  const query = String(body.query || "").trim();
  if (!query) return jsonError(400, "query is required.");
  const mode = SYSTEM[body.mode] ? body.mode : "synthesis";
  const context = String(body.context || "").trim();
  const instruction = String(body.instruction || "").trim();
  const provenance = body.provenance === "generated" ? "generated" : (body.provenance === null ? null : "own");
  const matchCount = Math.min(Math.max(Number(body.count) || 28, 6), 40);

  const retrieveText = mode === "refine" && instruction ? `${query} ${instruction}` : query;
  let qvec: number[];
  try { qvec = await embedQuery(retrieveText, openaiKey); } catch (e) { return jsonError(502, String(e)); }

  const rpc = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_corpus_chunks`, {
    method: "POST",
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "content-type": "application/json" },
    body: JSON.stringify({ query_embedding: "[" + qvec.join(",") + "]", match_count: matchCount, p_provenance: provenance }),
  });
  if (!rpc.ok) return jsonError(502, "search failed: " + (await rpc.text()).slice(0, 200));
  const hits: any[] = await rpc.json();
  if (!hits.length) return json({ synthesis: "Nothing relevant found in your corpus for that. Try rephrasing.", sources: [], run_id: null });

  const passages = hits.map((h, i) => `[${i + 1}] (${h.source_type}${h.title ? " · " + h.title : ""})\n${h.chunk_text}`).join("\n\n");
  const userMsg = mode === "refine"
    ? `CURRENT DRAFT:\n${context}\n\nMY INSTRUCTION:\n${instruction}\n\nPASSAGES FROM MY CORPUS (for grounding any additions):\n\n${passages}`
    : `MY IDEA:\n${query}\n${context ? `\nMY EARLIER SYNTHESIS (build on this):\n${context}\n` : ""}\nPASSAGES FROM MY CORPUS:\n\n${passages}`;

  let synthesis = "";
  try {
    const ar = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: { "x-api-key": anthropicKey, "anthropic-version": ANTHROPIC_VERSION, "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 4000, system: SYSTEM[mode], messages: [{ role: "user", content: userMsg }] }),
    });
    if (!ar.ok) return jsonError(502, "Claude failed: " + (await ar.text()).slice(0, 200));
    const data = await ar.json();
    synthesis = (data.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
  } catch (e) { return jsonError(502, String(e)); }

  const seen = new Set<string>();
  const sources = hits.filter(h => !seen.has(h.entry_id) && seen.add(h.entry_id))
    .map(h => ({ title: h.title, url: h.url, source_type: h.source_type, similarity: h.similarity }));

  // save the run (best-effort)
  let run_id: string | null = null;
  try {
    const ins = await fetch(`${SUPABASE_URL}/rest/v1/corpus_idea_runs`, {
      method: "POST",
      headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "content-type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ email: caller.toLowerCase(), mode, query, synthesis, sources }),
    });
    if (ins.ok) run_id = (await ins.json())?.[0]?.id ?? null;
  } catch { /* ignore */ }

  return json({ synthesis, sources, run_id, mode });
});
