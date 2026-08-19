// quiz-grade — semantic safety net for free-text theory answers.
// The lesson renderer matches locally first (instant, free). This is called ONLY
// when that local match fails, so a correct-but-unusually-phrased answer is not
// marked wrong. Members only; cheap + fast model.

const MODEL = "claude-haiku-4-5-20251001";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://gyskfutmncprqxazgatv.supabase.co";
const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY") || "";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...cors, "content-type": "application/json" } });

const SYSTEM = `You mark a music-theory answer a student typed into a practice quiz.

You are given the QUESTION, the list of ACCEPTED answers the author wrote, the author's EXPLANATION, and the STUDENT ANSWER.

Mark it correct if the student's answer means the same thing as an accepted answer, however they chose to phrase it. Students type freely: extra words ("it's a perfect fifth", "the interval is a 5th"), abbreviations (P5, maj 3rd), symbols or words for accidentals (G#, G sharp), British or American note names (crotchet, quarter note), numerals or words (5, five, fifth), different word order, and typos or misspellings that are clearly the same term.

Also mark it correct when the question admits more than one defensible reading and the student answered one of them correctly. For example "D minor has one flat, name the note that is flattened": both "B" (the note being flattened) and "B flat" (what it becomes) are correct.

Mark it correct when the student SPELLS OUT the right reasoning rather than giving the bare term, as long as the substance is right: "B natural becomes B flat", "C to G is a perfect fifth", "the interval is a 5th", "it goes up five letter names".

Mark it correct when the answer is clearly the right term with a typo, misspelling or truncation ("fift", "fith", "perfct fifth", "staccatto", "quarver"). Judge what they plainly meant.

Mark it INCORRECT if it names a genuinely different thing (B vs B flat where the question clearly wants the resulting pitch, a half rest when the answer is a half note, G when the answer is G sharp, the wrong number, the wrong term), if it is empty or gibberish, or if it is a guess that does not actually answer the question.

Be fair to the student but do not let a wrong answer pass.

Return ONLY JSON: {"correct": true|false}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);

  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return json({ correct: false, error: "not configured" });

  // must be a signed-in member
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ correct: false }, 401);
  try {
    const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON } });
    if (!u.ok) return json({ correct: false }, 401);
  } catch { return json({ correct: false }, 401); }

  let body: any;
  try { body = await req.json(); } catch { return json({ correct: false }, 400); }
  const answer = String(body.answer || "").trim().slice(0, 300);
  const prompt = String(body.prompt || "").trim().slice(0, 1000);
  const accept: string[] = Array.isArray(body.accept) ? body.accept.map((a: any) => String(a).slice(0, 120)).slice(0, 40) : [];
  const explain = String(body.explain || "").trim().slice(0, 800);
  if (!answer || !prompt || !accept.length) return json({ correct: false });

  const userMsg = `QUESTION: ${prompt}\n\nACCEPTED ANSWERS: ${accept.join(" | ")}\n\nAUTHOR'S EXPLANATION: ${explain || "(none)"}\n\nSTUDENT ANSWER: ${answer}`;
  try {
    const r = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": ANTHROPIC_VERSION, "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 16, system: SYSTEM, messages: [{ role: "user", content: userMsg }] }),
    });
    if (!r.ok) return json({ correct: false });
    const d = await r.json();
    const txt = (d.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
    return json({ correct: /"correct"\s*:\s*true/i.test(txt) });
  } catch { return json({ correct: false }); }
});
