// COMPOSE-LIB — a real musical intelligence composes each sight-reading piece to a DELIBERATE PLAN
// (phrase structure, functional harmony, a developed motif, articulation and dynamics that mean
// something), then the existing engine validates it for grade-legality. This replaces the procedural
// "biased dice over pattern banks" generation, whose interpretation never cohered by construction.
// The engine is demoted to grader + engraver + fingering; the composition is the model's.

import fs from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { validate } from "./engine.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const KEY = (() => { try { return (fs.readFileSync(join(HERE,"..",".env.local"),"utf8").match(/^ANTHROPIC_API_KEY=(.+)$/m)||[])[1]?.trim(); } catch { return null; } })();

// Exact grade legality, mirrored from engine.GRADES + validate(), so the model composes legal on the first pass.
const GRADE_RULES = {
  2: `GRADE 2. Single melodic line in each hand (NO chords: every "m" is a single integer). Both hands stay in a FIXED five-finger position (each hand's notes span at most 7 semitones). Simple time only: 4/4 or 3/4 = 4 bars, 2/4 = 6 bars. Note values: whole/dotted-half/half/dotted-quarter/quarter/eighth (d of 4,3,2,1.5,1,0.5). NO semiquavers, NO chords, NO chromatics. Up to 2 sharps or 2 flats in the key. Diatonic throughout.`,
  3: `GRADE 3. Melody may leave the five-finger position (hand travels; span up to 15 semitones). May use 2-note chords ("m" may be a 2-element array) and SEMIQUAVERS (d 0.25). Adds 3/8. All metres = 8 bars (2/4,3/4,4/4,3/8). Diatonic (no chromatics). Up to 3 sharps/flats.`,
  4: `GRADE 4. Span up to 17 semitones. 2-note chords and semiquavers allowed. Adds 6/8 (compound, dotted-crotchet beat) and may open with an ANACRUSIS (set "partial" to the up-beat length in quarter-beats). All metres = 8 bars (2/4,3/4,4/4,3/8,6/8). Grade 4 introduces, use them DELIBERATELY and sparingly: exactly ONE chromatic / secondary-dominant colour moment, the fermata ("ferm":true, typically the final note), tenuto ("art":"--"), and ties/suspensions. Up to 4 sharps/flats.`,
};

const SCHEMA = { type:"object", properties:{
  grade:{type:"integer"},
  key:{type:"string", description:"tonic letter lowercase, e.g. \"d\", \"bf\" for B-flat, \"fs\" for F-sharp"},
  mode:{type:"string", enum:["maj","min"]},
  flat:{type:"boolean", description:"true if the key signature uses flats (spell accidentals with flats)"},
  time:{type:"string"},
  tempo:{type:"string", description:"an Italian tempo/character mark that matches what you actually wrote"},
  partial:{type:"number", description:"anacrusis length in quarter-beats; 0 if the piece starts on the downbeat"},
  plan:{type:"string", description:"one or two sentences: the deliberate compositional plan — character, phrase structure, the motif and how it develops, the harmonic route and cadences, the dynamic arc. This is your intention stated."},
  rh:{type:"array", items:{type:"object", properties:{
    m:{description:"MIDI note number (int), or an array of 2 for a chord (G3/4 only), or omit for a rest"},
    d:{type:"number", description:"duration in quarter-beats: 0.25,0.5,0.75,1,1.5,2,3,4,6"},
    rest:{type:"boolean"},
    art:{type:"string", enum:["-.","--","->"], description:"staccato / tenuto / accent — apply consistently across a gesture, never one stray note"},
    dyn:{type:"string", description:"dynamic e.g. p, mp, mf, f — only at a phrase start or peak"},
    hp:{type:"string", enum:["\\<","\\>","\\!"], description:"hairpin start-cresc / start-dim / end — over a REAL arc"},
    slur:{type:"string", enum:["(",")"], description:"phrase slur open/close — around a real phrase"},
    ferm:{type:"boolean"},
    fing:{description:"optional fingering int"},
    alt:{description:"accidental for a chromatic note: -1 flat, 1 sharp, 0 natural"},
  }, required:["d"]}},
  lh:{type:"array", items:{type:"object", properties:{
    m:{}, d:{type:"number"}, rest:{type:"boolean"}, art:{type:"string"}, dyn:{type:"string"}, hp:{type:"string"}, slur:{type:"string"}, ferm:{type:"boolean"}, fing:{}, alt:{},
  }, required:["d"]}},
}, required:["grade","key","mode","flat","time","tempo","partial","plan","rh","lh"] };

const BRIEF = (grade) => `You are an experienced piano composer writing ONE short Grade ${grade} sight-reading exercise for the ABRSM tradition. It will be engraved and given to a student to read at first sight, so it must be genuinely musical: it should read as a piece made with DELIBERATE CHOICES, not assembled at random.

Compose to a plan, in this order, and state it in "plan":
1. CHARACTER: pick a clear character (a lilting waltz, a crisp march, a singing cantabile, a playful scherzando, a gentle siciliano...). Choose key, metre and tempo that serve it.
2. PHRASE STRUCTURE: build a real period. An antecedent phrase that opens and reaches a half-close (on V), then a consequent phrase that answers it and closes with a perfect cadence (V-I). Group into 2- and 4-bar units that breathe. Do NOT stamp one identical bar over and over, and do NOT make every bar unrelated.
3. MOTIF + DEVELOPMENT: state a small rhythmic/melodic motif in the opening bar, then DEVELOP it, sequence, transpose, invert, vary the rhythm, so the piece has unity AND variety. Variety of rhythm across bars is essential; a single cell repeated every bar is the main thing to avoid.
4. FUNCTIONAL HARMONY: a real progression underneath, with clear cadences. The left hand is an idiomatic accompaniment for the character (an oom-pah, a broken-chord, a walking bass, a sustained chord) that is CONSISTENT and thins or settles at cadences. Consonant on the beat; never leap into a dissonance; no 6/4 on a downbeat.
5. ARTICULATION + DYNAMICS as meaning, not garnish: articulation follows the character and is applied consistently across whole gestures (a detached march is staccato throughout, a cantabile is legato). Dynamics shape the phrase arc, a couple of marks at phrase starts and the peak, hairpins over real crescendo/diminuendo arcs. NEVER a lone staccato, accent, tenuto, hairpin or dynamic on one stray note for no reason. If a marking cannot be justified by the music, leave it out.

Hard grade rules (the piece is rejected if any is broken):
${GRADE_RULES[grade]}
- Durations in quarter-beats; a sub-beat note may NOT cross a beat boundary (simple-time beat = 1 quarter-beat; compound 6/8 beat = 1.5). Each hand must fill exactly the required number of bars (counting any anacrusis).
- "m" is MIDI (middle C = 60). RH sits roughly C4-C6, LH roughly C2-C4; keep each hand within its grade span.

Think it through, then call report_piece with the finished piece. Make it something a good teacher would be glad to hand a student.`;

// One composition attempt, with up to `maxTries` legality-revision rounds.
export async function composePiece(grade, { maxTries = 4 } = {}) {
  if (!KEY) throw new Error("no ANTHROPIC_API_KEY");
  const messages = [{ role:"user", content: BRIEF(grade) }];
  let last = null;
  for (let attempt = 0; attempt < maxTries; attempt++) {
    let j;
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", { method:"POST",
        headers:{ "x-api-key":KEY, "anthropic-version":"2023-06-01", "content-type":"application/json" },
        body: JSON.stringify({ model:"claude-opus-4-8", max_tokens:6000,
          tools:[{ name:"report_piece", description:"Return the finished composed piece.", input_schema:SCHEMA }],
          tool_choice:{ type:"tool", name:"report_piece" },
          messages }) });
      j = await r.json();
    } catch (e) { return { ex:null, error:String(e) }; }
    const tu = (j.content||[]).find(c=>c.type==="tool_use");
    if (!tu) return { ex:last, error:"no tool_use", raw:j };
    const ex = { ...tu.input }; ex.grade = grade; last = ex;
    const v = validate(ex);
    if (v.ok) return { ex, validation:v, tries:attempt+1 };   // no HARD errors -> accept (warnings are stylistic)
    const faults = v.errors || [];
    // feed the exact faults back for a targeted fix
    messages.push({ role:"assistant", content: j.content });
    messages.push({ role:"user", content:[{ type:"tool_result", tool_use_id: tu.id,
      content:`The piece breaks these grade rules and is REJECTED. Fix ONLY these, keep the music otherwise intact, and call report_piece again:\n- ${faults.join("\n- ")}` }] });
    last = ex;
  }
  const v = last ? validate(last) : null;
  return { ex:last, validation:v, tries:maxTries, unresolved:(v?.errors||[]) };
}
