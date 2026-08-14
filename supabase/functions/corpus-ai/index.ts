// corpus-ai — semantic retrieval + synthesis over Matthew's own corpus (owner-only).
// Given an idea/topic, embeds it (OpenAI), vector-searches corpus_chunks, and has
// Claude synthesise: what he's already said, the frameworks/language he's used, fresh
// angles, and interesting connections — all grounded ONLY in the retrieved passages.
// Needs ANTHROPIC_API_KEY + OPEN_AI. Owner-gated.

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

const SYSTEM = `You are Matthew Cawood's research partner, mining HIS OWN past teaching (video transcripts, Monday Music Tips, community replies) to help him make new videos and articles.

You are given his idea and a set of PASSAGES retrieved from his own corpus. Work ONLY from those passages — never invent facts, claims or quotes he did not say. If the passages are thin, say so.

Produce, in clear markdown:
1. **What you've already said** — the substance of his relevant prior thinking on this, in a few tight paragraphs, grounded in the passages.
2. **Your frameworks & language** — the specific concepts, terms, analogies and framings he has used that apply here (e.g. "consolidation between exposures", "the intermediate plateau"). Name them.
3. **Fresh angles** — 3-5 concrete, original angles for a video or article that BUILD ON his existing thinking rather than repeat it. Each one specific enough to act on.
4. **Interesting connections** — any places where two different passages combine into a framework or take he may not have linked before. Only include genuinely interesting ones; skip if none.

Cite the source of a point inline like [Source: <title>] using the passage titles. Be concrete, practical and honest. Do not pad. Match his grounded, non-grandiose voice.`;

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

  // owner auth
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
  const provenance = body.provenance === "generated" || body.provenance === "own" ? body.provenance : (body.provenance === null ? null : "own");
  const matchCount = Math.min(Math.max(Number(body.count) || 28, 6), 40);

  // 1. embed the idea
  let qvec: number[];
  try { qvec = await embedQuery(query, openaiKey); } catch (e) { return jsonError(502, String(e)); }

  // 2. vector search
  const rpc = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_corpus_chunks`, {
    method: "POST",
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "content-type": "application/json" },
    body: JSON.stringify({ query_embedding: "[" + qvec.join(",") + "]", match_count: matchCount, p_provenance: provenance }),
  });
  if (!rpc.ok) return jsonError(502, "search failed: " + (await rpc.text()).slice(0, 200));
  const hits: any[] = await rpc.json();
  if (!hits.length) return json({ synthesis: "Nothing relevant found in your corpus for that. Try rephrasing the idea.", sources: [] });

  // 3. synthesise with Claude
  const passages = hits.map((h, i) =>
    `[${i + 1}] (${h.source_type}${h.title ? " · " + h.title : ""})\n${h.chunk_text}`).join("\n\n");
  const userMsg = `MY IDEA:\n${query}\n\nPASSAGES FROM MY CORPUS:\n\n${passages}`;

  let synthesis = "";
  try {
    const ar = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: { "x-api-key": anthropicKey, "anthropic-version": ANTHROPIC_VERSION, "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 2000, system: SYSTEM, messages: [{ role: "user", content: userMsg }] }),
    });
    if (!ar.ok) return jsonError(502, "Claude failed: " + (await ar.text()).slice(0, 200));
    const data = await ar.json();
    synthesis = (data.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
  } catch (e) { return jsonError(502, String(e)); }

  // dedup sources by entry for the citation list
  const seen = new Set<string>();
  const sources = hits.filter(h => !seen.has(h.entry_id) && seen.add(h.entry_id))
    .map(h => ({ title: h.title, url: h.url, source_type: h.source_type, similarity: h.similarity }));

  return json({ synthesis, sources });
});
