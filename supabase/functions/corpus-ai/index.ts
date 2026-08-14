// corpus-ai — semantic retrieval + structured PLAN generation over Matthew's own corpus (owner-only).
// Modes: "video" / "mmt" / "short" = a boxed, fill-in PLAN in his actual structure;
//        "refine" = revise the current plan per an instruction;
//        "synthesis" = plain-text gather (legacy).
// Plan modes return a structured JSON `plan` the front-end renders as section boxes.
// Every run is saved to corpus_idea_runs. Needs ANTHROPIC_API_KEY + OPEN_AI. Owner-gated.

const MODEL = "claude-sonnet-5";  // strong + far cheaper than Opus, for cheap back-and-forth
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

const COMMON = `The PASSAGES (Matthew's own words) are the spine of the plan — never put words in his mouth or invent something he claimed, and put the passage title a point draws on in that section's "source". You MAY, sparingly, bring in a genuinely relevant concept from OUTSIDE his corpus — a named psychological phenomenon, a specific music-theory point — but ONLY when it clearly links to and strengthens the idea. Put any such outside concept in that section's "addition" field so it is shown asterisked as a suggested extra, never mixed in as his own material. Be concrete and practical; match his grounded, non-grandiose voice. This is a PLAN he will sit down and film/write from — beats and prompts, not finished prose.`;

const PLAN_SPEC = `Return ONLY a JSON object (no prose, no markdown, no code fences) of exactly this shape:
{
  "concept": "a one-line working title / the core concept of the piece",
  "hook": "the opening line he should actually say (or null)",
  "promise": "the explicit promise the opening makes to the viewer — what they will understand or be able to DO by the end. The Close must pay this exact promise off so they feel they took something real away. (or null)",
  "sections": [
    {
      "label": "short tag, e.g. 'Opening', 'Section A', 'Point 1', 'Close'",
      "heading": "the topic / point of this section",
      "framework": "the NAMED principle or model this section teaches — give it a short, memorable name he can say on camera (e.g. 'Loss vs Access', 'The Consolidation Lag'). Null only for the Opening/Close.",
      "points": ["a short beat/bullet to cover (the false belief, the mechanism, the reframe, etc.)", "another beat", "..."],
      "example": "one concrete example, analogy or demo-at-the-piano to use here (or null)",
      "action": "the ACTIONABLE takeaway — one concrete thing the viewer can DO, try, or change at the piano because of this section (not just a reframe). Null only for the Opening.",
      "source": "the passage title this section draws on (or null)",
      "addition": "an optional relevant concept from OUTSIDE his corpus that links to this section — a named psychological phenomenon or music-theory point — shown asterisked as a suggested extra. Use sparingly, only when it genuinely strengthens the idea (or null)"
    }
  ],
  "close": "the closing / payoff line (or null)"
}
Keep bullets short and scannable. 3-6 sections is typical. Every body section MUST name its "framework" and give a concrete "action". Everything must be grounded in the passages.`;

const SYSTEM: Record<string, string> = {
  video: `You turn Matthew's idea into a PLAN for one of his YouTube videos, laid out as fill-in section boxes, in HIS ACTUAL structure (learned from his own transcripts — follow it, not generic YouTube advice):
- First section, label "Opening": pick the mode that fits — a problem/advice video opens by naming the viewer's private frustration with an "If you…" line then REFRAMING it as a misdiagnosis (the real problem isn't what they think); a concept video opens with a "What if I told you…" paradox. Its "points" should include that opening line, the reframe, and his roadmap sentence ("So in today's video I'm going to…") that NUMBERS what's coming. State the PROMISE explicitly here and fill the top-level "promise" field: a clear thing they'll understand or be able to do by the end.
- Then ONE section per body point. Each is built on a BINARY DISTINCTION (his signature device: reading vs sight-reading, success vs reliability, playing vs practising) as the "heading"; name the "framework" it teaches; "points" = the common false belief, the mechanism, and the fix ("instead of asking X, ask Y"); "example" = an analogy from OUTSIDE music (golf, tennis, the alphabet) or a demo at the piano; "action" = the concrete thing to do about it; "source" = the passage.
- A final section, label "Close": pay off the PROMISE from the opening with the concrete takeaway/tool, so the viewer feels they genuinely took something away. Mention his app The Practice Room only where it genuinely fits.
${COMMON}
${PLAN_SPEC}`,

  mmt: `You turn Matthew's idea into a PLAN for a Monday Music Tips article, laid out as fill-in section boxes, in his usual THREE-part shape:
- Section 1 — lay out the point / the idea.
- Section 2 — the methods, thought processes, psychology or practice routines behind it.
- Section 3 — how to apply it in a real playing situation.
(Adapt the split if the content genuinely calls for it, but keep it around three sections.) Each section: "heading" = its framework; "points" = the beats to write; "example" = a concrete example, analogy or psychological concept; "source" = the passage.
${COMMON}
${PLAN_SPEC}`,

  short: `You turn Matthew's idea into a PLAN for a short-form video (Short / Reel), ~30-60 seconds: ONE sharp point, a scroll-stopping hook, tight delivery.
- "hook" = the first line that stops the scroll.
- Give ONE main section (label "The point") whose "heading" is the single idea, "points" = 2-4 punchy beats that deliver it, "example" = a thing to show at the piano. Add a short second section only if it truly needs a setup.
- "close" = the button line.
${COMMON}
${PLAN_SPEC}`,

  refine: `You revise the CURRENT PLAN (given as text) according to Matthew's instruction, keeping his voice and returning the SAME JSON plan shape. Apply his instruction faithfully — add, cut, restructure, change emphasis, bring in a new angle. Keep the good material he didn't ask you to change. Ground any NEW material in the passages.
${COMMON}
${PLAN_SPEC}`,

  synthesis: `You are Matthew Cawood's research partner, mining HIS OWN past teaching to help him. Work ONLY from the PASSAGES. Produce, in clear markdown: what he's already said, his frameworks & language, and 3-5 fresh angles that build on his thinking. Cite inline like [Source: <title>].`,
};

const PLAN_MODES = new Set(["video", "mmt", "short", "refine"]);

function parsePlan(txt: string): any {
  if (!txt) return null;
  let s = txt.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const a = s.indexOf("{");
  if (a < 0) return null;
  s = s.slice(a);
  try { return JSON.parse(s); } catch { /* try to repair truncation */ }
  // Walk back to the last complete object and close any open arrays/braces.
  let cut = s.length;
  while (cut > 0) {
    cut = s.lastIndexOf("}", cut - 1);
    if (cut < 0) break;
    const frag = s.slice(0, cut + 1);
    const opens = (frag.match(/{/g) || []).length, closes = (frag.match(/}/g) || []).length;
    const bo = (frag.match(/\[/g) || []).length, bc = (frag.match(/\]/g) || []).length;
    const cand = frag + "]".repeat(Math.max(0, bo - bc)) + "}".repeat(Math.max(0, opens - closes));
    try { return JSON.parse(cand); } catch { /* keep walking back */ }
  }
  return null;
}
function planToText(p: any): string {
  if (!p) return "";
  let s = p.concept ? `# ${p.concept}\n\n` : "";
  if (p.hook) s += `HOOK: ${p.hook}\n`;
  if (p.promise) s += `PROMISE: ${p.promise}\n`;
  if (p.hook || p.promise) s += `\n`;
  for (const sec of (p.sections || [])) {
    s += `${sec.label ? sec.label + " — " : ""}${sec.heading || ""}\n`;
    if (sec.framework) s += `  Framework: ${sec.framework}\n`;
    for (const pt of (sec.points || [])) s += `  • ${pt}\n`;
    if (sec.example) s += `  Example: ${sec.example}\n`;
    if (sec.action) s += `  Do this: ${sec.action}\n`;
    if (sec.addition) s += `  * Suggested extra (not from your corpus): ${sec.addition}\n`;
    if (sec.source) s += `  [Source: ${sec.source}]\n`;
    s += "\n";
  }
  if (p.close) s += `CLOSE: ${p.close}\n`;
  return s.trim();
}

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
  const mode = (body.mode === "gather" || SYSTEM[body.mode]) ? body.mode : "video";
  const context = String(body.context || "").trim();
  const instruction = String(body.instruction || "").trim();
  const provenance = body.provenance === "generated" ? "generated" : (body.provenance === null ? null : "own");
  const matchCount = Math.min(Math.max(Number(body.count) || 28, 6), 40);
  const wantPlan = PLAN_MODES.has(mode);
  // passages the caller selected (from the gather step). An empty array means "draft from the idea alone".
  const providedPassages: any[] | null = Array.isArray(body.passages) ? body.passages : null;

  async function matchChunks(text: string, count: number): Promise<any[]> {
    const qvec = await embedQuery(text, openaiKey!);
    const rpc = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_corpus_chunks`, {
      method: "POST",
      headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "content-type": "application/json" },
      body: JSON.stringify({ query_embedding: "[" + qvec.join(",") + "]", match_count: count, p_provenance: provenance }),
    });
    if (!rpc.ok) throw new Error("search failed: " + (await rpc.text()).slice(0, 200));
    return await rpc.json();
  }

  // GATHER: retrieval only (an embedding lookup, no Claude) — returns selectable passages
  if (mode === "gather") {
    let g: any[];
    try { g = await matchChunks(query, Math.min(Math.max(Number(body.count) || 20, 6), 30)); } catch (e) { return jsonError(502, String(e)); }
    const passages = g.map((h, i) => ({ idx: i, entry_id: h.entry_id, title: h.title, url: h.url, source_type: h.source_type, text: h.chunk_text, similarity: h.similarity }));
    return json({ passages, mode: "gather" });
  }

  // PLAN / REFINE / SYNTHESIS: use the passages the caller selected, else retrieve
  let hits: any[] = [];
  if (providedPassages) {
    hits = providedPassages.map((p: any, i: number) => ({ chunk_text: String(p.text || ""), title: p.title ?? null, url: p.url ?? null, source_type: p.source_type || "", entry_id: p.entry_id ?? ("prov" + i), similarity: p.similarity ?? null }));
  } else {
    const retrieveText = mode === "refine" && instruction ? `${query} ${instruction}` : query;
    try { hits = await matchChunks(retrieveText, matchCount); } catch (e) { return jsonError(502, String(e)); }
  }
  // Only bail when we had no selection to honour. An intentional empty selection drafts from the idea alone.
  if (!hits.length && !providedPassages) return json({ plan: null, synthesis: "Nothing relevant found in your corpus for that. Try rephrasing.", sources: [], run_id: null, mode });

  const passages = hits.length
    ? hits.map((h, i) => `[${i + 1}] (${h.source_type}${h.title ? " · " + h.title : ""})\n${h.chunk_text}`).join("\n\n")
    : "(No corpus passages selected. Build the plan from the idea itself; since nothing here is in his own prior words, put supporting concepts in each section's \"addition\" field so they read as suggested extras, and leave \"source\" null.)";
  const userMsg = mode === "refine"
    ? `CURRENT PLAN:\n${context}\n\nMY INSTRUCTION:\n${instruction}\n\nPASSAGES FROM MY CORPUS (for grounding any additions):\n\n${passages}`
    : `MY IDEA:\n${query}\n\nPASSAGES FROM MY CORPUS:\n\n${passages}`;

  let raw = "";
  try {
    const ar = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: { "x-api-key": anthropicKey, "anthropic-version": ANTHROPIC_VERSION, "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 8000, system: SYSTEM[mode], messages: [{ role: "user", content: userMsg }] }),
    });
    if (!ar.ok) return jsonError(502, "Claude failed: " + (await ar.text()).slice(0, 200));
    const data = await ar.json();
    raw = (data.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
  } catch (e) { return jsonError(502, String(e)); }

  let plan: any = null, synthesis = raw;
  if (wantPlan) { plan = parsePlan(raw); synthesis = plan ? planToText(plan) : raw; }

  const seen = new Set<string>();
  const sources = hits.filter(h => !seen.has(h.entry_id) && seen.add(h.entry_id))
    .map(h => ({ title: h.title, url: h.url, source_type: h.source_type, similarity: h.similarity }));

  // Adjusting an existing outline updates that saved row; a fresh draft inserts a new one.
  const priorRun = String(body.run_id || "").trim();
  let run_id: string | null = priorRun || null;
  try {
    if (priorRun) {
      await fetch(`${SUPABASE_URL}/rest/v1/corpus_idea_runs?id=eq.${priorRun}&email=eq.${encodeURIComponent(caller.toLowerCase())}`, {
        method: "PATCH",
        headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "content-type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ synthesis, sources, plan }),
      });
    } else {
      const ins = await fetch(`${SUPABASE_URL}/rest/v1/corpus_idea_runs`, {
        method: "POST",
        headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "content-type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({ email: caller.toLowerCase(), mode, query, synthesis, sources, plan }),
      });
      if (ins.ok) run_id = (await ins.json())?.[0]?.id ?? null;
    }
  } catch { /* ignore */ }

  return json({ plan, synthesis, sources, run_id, mode });
});
