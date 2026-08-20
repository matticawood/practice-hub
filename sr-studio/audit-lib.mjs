// AUDIT-LIB — reusable LLM musicality judgement for one exercise. Renders the piece to an engraved
// PNG and asks Claude to judge it as a Grade-N sight-reading piece, focused on the things a human
// would fix by hand: jerky/angular rhythm, awkward melody, incoherence, and grade-fit. Returns a
// structured verdict. Used as the keep/kill gate on grown patterns AND as the single-generate selector.

import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { lilyWithMap } from "./engine.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const KEY = (() => { try { return (fs.readFileSync(join(HERE,"..",".env.local"),"utf8").match(/^ANTHROPIC_API_KEY=(.+)$/m)||[])[1]?.trim(); } catch { return null; } })();

const GRADE_PROSE = {
  2: "Grade 2: hands together, fixed 5-finger position, simple time, up to 2 accidentals, no semiquavers, no chords, no chromatics.",
  3: "Grade 3: out of position, 2-note chords and semiquavers, adds 3/8, up to 3 accidentals, diatonic.",
  4: "Grade 4: adds 6/8, anacrusis, one chromatic/secondary-dominant moment, fermata, tenuto, ties, suspensions.",
};
const SHARP=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"], FLAT=["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
const noteName=(m,flat)=>(flat?FLAT:SHARP)[((m%12)+12)%12]+(Math.floor(m/12)-1);
const DUR={0.25:"ss",0.5:"q",0.75:"q.",1:"c",1.5:"c.",2:"m",3:"m.",4:"sb"}, durLbl=d=>DUR[d]||`${d}`;
const barUnits=ex=>{const[n,d]=ex.time.split("/").map(Number);return n*(4/d);};
function handText(ex,hand){ const bu=barUnits(ex),bars={}; let t=0;
  for(const n of ex[hand]){ const bi=Math.floor(t/bu+1e-9); (bars[bi]??=[]);
    let tok = n.rest?`rest/${durLbl(n.d)}`:(Array.isArray(n.m)?n.m:[n.m]).map(m=>noteName(m,ex.flat)).join("+")+`/${durLbl(n.d)}`;
    bars[bi].push(tok); t+=n.d; }
  return Object.keys(bars).map(Number).sort((a,b)=>a-b).map(bi=>`  bar ${bi+1}: ${bars[bi].join(" ")}`).join("\n"); }
const readable=ex=>`Key ${ex.key.toUpperCase()} ${ex.mode}, ${ex.time}, "${ex.tempo}"\nRH:\n${handText(ex,"rh")}\nLH:\n${handText(ex,"lh")}`;

function renderPng(ex){ const id=`al_${process.pid}_${Math.floor(performance.now())}`; const ly=join(tmpdir(),id+".ly");
  fs.writeFileSync(ly, lilyWithMap({...ex,n:ex.n||""},20).ly);
  execFileSync("lilypond",["-dcrop","--png","-dresolution=150","-o",join(tmpdir(),id),ly],{stdio:"ignore"});
  const b=fs.readFileSync(join(tmpdir(),id+".cropped.png")).toString("base64"); try{fs.unlinkSync(ly);}catch{} return b; }

const SCHEMA={type:"object",properties:{
  grade_fit:{type:"string",enum:["too_easy","right","too_hard"]},
  jerky_rhythm:{type:"boolean",description:"true ONLY if the notation fights the musical intention (e.g. a detached feel written as short-note-plus-rest instead of staccato, or a lyrical feel written detached) or the rhythm is genuinely angular/stuttery — NOT merely because a passage is detached or busy"},
  awkward_melody:{type:"boolean",description:"true if the melody leaps around aimlessly or is otherwise unmusical"},
  musicality:{type:"string",enum:["strong","acceptable","weak"]},
  reason:{type:"string"},
  verdict:{type:"string",enum:["keep","revise","bin"]},
},required:["grade_fit","jerky_rhythm","awkward_melody","musicality","reason","verdict"]};

// Audit one exercise. Returns the structured verdict, or null on failure.
export async function auditPiece(ex, grade) {
  if (!KEY) throw new Error("no ANTHROPIC_API_KEY");
  let png; try { png = renderPng(ex); } catch (e) { return null; }
  const prompt = `You are a strict ABRSM examiner judging a Grade ${grade} SIGHT-READING exercise a student reads at first sight. ${GRADE_PROSE[grade]||""}
Judge it the way a piano teacher would. The CORE test of coherence is whether WHAT IS WRITTEN MATCHES THE MUSICAL INTENTION: a light or detached feel should be written STACCATO on full-length notes, not as short notes with rests between them; a singing feel should be legato and held; a rest should mean an intended silence, never a lazy way to write "short". Detached, busy or rest-using writing is NOT jerky in itself — only flag jerky_rhythm when the notation genuinely fights the intention, or the rhythm is truly angular or stuttery. Also judge: is the difficulty right for the grade, is the melody musical (not aimlessly leaping), does it hang together. Data below, engraved image attached.
${readable(ex)}
Call report_audit.`;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", { method:"POST",
      headers:{ "x-api-key":KEY, "anthropic-version":"2023-06-01", "content-type":"application/json" },
      body: JSON.stringify({ model:"claude-opus-4-8", max_tokens:900,
        tools:[{ name:"report_audit", description:"Report the audit.", input_schema:SCHEMA }],
        tool_choice:{ type:"tool", name:"report_audit" },
        messages:[{ role:"user", content:[ {type:"text",text:prompt}, {type:"image",source:{type:"base64",media_type:"image/png",data:png}} ] }] }) });
    const j = await r.json();
    const tu = (j.content||[]).find(c=>c.type==="tool_use");
    return tu ? tu.input : null;
  } catch (e) { return null; }
}

// A single 0..1 goodness score from a verdict (for ranking / gating).
export const auditScore = v => v ? ((v.verdict==="keep"?1:v.verdict==="revise"?0.5:0)
  * (v.musicality==="strong"?1:v.musicality==="acceptable"?0.8:0.4)
  * (v.jerky_rhythm?0.3:1) * (v.awkward_melody?0.4:1) * (v.grade_fit==="right"?1:0.5)) : 0;
