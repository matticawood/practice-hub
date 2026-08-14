// corpus-ai — semantic retrieval + synthesis over Matthew's own corpus (owner-only).
// Modes: "synthesis" (default) = what he's said + frameworks + angles + connections;
//        "video" = reshape into a section-by-section VIDEO PLAN;
//        "mmt"   = reshape into a 3-section MONDAY MUSIC TIPS PLAN.
// Every run is saved to corpus_idea_runs. Needs ANTHROPIC_API_KEY + OPEN_AI. Owner-gated.

const MODEL = "claude-opus-4-8";
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

  video: `You turn Matthew's idea into a PLAN (NOT a script, NOT prose) for one of his YouTube videos.
His videos progress SECTION BY SECTION, each section REVEALING something new so the viewer stays watching — even non-listicles narrate as a sequence of reveals ("now here's another thing to consider…", "but there's a catch…", "the four things that…").
${COMMON}
Output in markdown:
- **Hook** — the opening beat that makes someone stop (tie it to the idea/title).
- **Sections** — an ordered list. For each: a one-line REVEAL (the new thing this section uncovers) as the heading, then a few bullet beats (content, examples, things to demo at the piano), with [Source: <title>] for material drawn from his corpus.
- **Close** — the payoff; what the viewer leaves understanding.
Keep it a tight PLAN in bullets. Do NOT write the script.`,

  mmt: `You turn Matthew's idea into a PLAN (NOT written prose) for a Monday Music Tips article, in his usual THREE-section shape:
- **Section 1** — lay out the point / the idea.
- **Section 2** — the methods, thought processes, psychology or practice routines behind it.
- **Section 3** — how to apply it in a real playing situation.
(MMT varies, so adapt the three-part split if the content genuinely calls for it, but keep it three sections.)
${COMMON}
For each section: a heading + bullet beats of what it covers, drawing on his passages [Source: <title>]. Keep it a PLAN in bullets, not the finished article.`,
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
  const provenance = body.provenance === "generated" ? "generated" : (body.provenance === null ? null : "own");
  const matchCount = Math.min(Math.max(Number(body.count) || 28, 6), 40);

  let qvec: number[];
  try { qvec = await embedQuery(query, openaiKey); } catch (e) { return jsonError(502, String(e)); }

  const rpc = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_corpus_chunks`, {
    method: "POST",
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "content-type": "application/json" },
    body: JSON.stringify({ query_embedding: "[" + qvec.join(",") + "]", match_count: matchCount, p_provenance: provenance }),
  });
  if (!rpc.ok) return jsonError(502, "search failed: " + (await rpc.text()).slice(0, 200));
  const hits: any[] = await rpc.json();
  if (!hits.length) return json({ synthesis: "Nothing relevant found in your corpus for that. Try rephrasing.", sources: [], run_id: null });

  const passages = hits.map((h, i) => `[${i + 1}] (${h.source_type}${h.title ? " · " + h.title : ""})\n${h.chunk_text}`).join("\n\n");
  const userMsg = `MY IDEA:\n${query}\n${context ? `\nMY EARLIER SYNTHESIS (build on this):\n${context}\n` : ""}\nPASSAGES FROM MY CORPUS:\n\n${passages}`;

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
