// GROWFIG — grows the generator's banks with vetted new patterns, BOTH hands, ALL grades.
//   node growfig.mjs <grade> lh <time>   -> new LH accompaniment figures (FIGBANK) for that metre
//   node growfig.mjs <grade> rh <feel>   -> new RH melodic-rhythm cells (QFEEL) for that feel
// It reads what's already there, asks Claude for genuinely new, distinct, idiomatic patterns, vets each
// mechanically (fills exactly / sums right, grade-legal durations, not a duplicate) and writes the
// survivors into generator.mjs. Idiomatic-by-construction is what keeps rhythms from turning jerky.

import fs from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FIGBANK, QFEEL } from "./generator.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const grade = parseInt(process.argv[2] || "4", 10);
const hand = process.argv[3] || "lh";
const slot = process.argv[4] || (hand==="lh" ? "6/8" : "crisp");
const want = parseInt(process.argv[5] || "12", 10);
const KEY = (() => { try { return (fs.readFileSync(join(HERE,"..",".env.local"),"utf8").match(/^ANTHROPIC_API_KEY=(.+)$/m)||[])[1]?.trim(); } catch { return null; } })();
if (!KEY) { console.error("No ANTHROPIC_API_KEY"); process.exit(1); }

const LEGAL_DUR = grade===2 ? new Set([0.5,0.75,1,1.5,2,3,4]) : new Set([0.25,0.5,0.75,1,1.5,2,3,4]);
const GEN = join(HERE, "generator.mjs");

async function askClaude(schemaProps, prompt) {
  const r = await fetch("https://api.anthropic.com/v1/messages", { method:"POST",
    headers:{ "x-api-key":KEY, "anthropic-version":"2023-06-01", "content-type":"application/json" },
    body: JSON.stringify({ model:"claude-opus-4-8", max_tokens:2000,
      tools:[{ name:"report", description:"Report the proposed patterns.", input_schema:{ type:"object", properties:schemaProps, required:Object.keys(schemaProps) } }],
      tool_choice:{ type:"tool", name:"report" }, messages:[{ role:"user", content:prompt }] }) });
  const j = await r.json(); const tu=(j.content||[]).find(c=>c.type==="tool_use");
  if (!tu) { console.error("no tool_use:", JSON.stringify(j).slice(0,300)); process.exit(1); } return tu.input;
}

function insertIntoArray(src, afterMarker, lines) {   // append `lines` before the first "];" after afterMarker
  const arr = src.split("\n"); const start = arr.findIndex(l=>l.includes(afterMarker));
  let close=-1; for(let i=start+1;i<arr.length;i++){ if(arr[i].trim()==="];"){ close=i; break; } }
  if(close<0) return null; arr.splice(close,0,...lines); return arr.join("\n");
}

// ============================ LEFT HAND (FIGBANK) ============================
if (hand === "lh") {
  const time = slot; const barU = (()=>{ const[n,d]=time.split("/").map(Number); return n*(4/d); })();
  const artOut=a=>a==="-."?".":a==="->"?">":"";
  const figToShape=f=>f.s.map(c=>c[0]==="t3"?"t3":c[0]+c[1]+artOut(c[2])).join(" ");
  const figFinger=f=>f.s.map(c=>(c[0]==="t3"?"t":c[0])+c[1]).join(",");
  const existing = FIGBANK.filter(f=>f.t.includes(time));
  const TOK=/^([bcr])(\d+(?:\.\d+)?)([.>]?)$/;
  const parse = str => { const s=[]; let sum=0; for(const tk of String(str).trim().split(/\s+/)){ const m=TOK.exec(tk); if(!m) return {ok:false}; const dur=parseFloat(m[2]); if(!LEGAL_DUR.has(dur)) return {ok:false}; const art=m[3]==="."?"-.":m[3]===">"?"->":null; s.push(art?[m[1],dur,art]:[m[1],dur]); sum+=dur; } if(Math.abs(sum-barU)>1e-6) return {ok:false}; if(!s.some(c=>c[0]==="b")) return {ok:false}; return {ok:true,s,finger:s.map(c=>c[0]+c[1]).join(",")}; };
  const prompt = `You are a pianist cataloguing REAL left-hand accompaniment figures for Grade ${grade} sight-reading in ${time} (a bar is ${barU} quarter-beats). Already in the bank for ${time} (do not repeat or trivially vary):\n${existing.map(figToShape).map(s=>"  "+s).join("\n")}\nPropose ${want} NEW, genuinely distinct, idiomatic one-bar LH figures for ${time} — different grooves and rest placements from real piano writing. Fill exactly one bar (durations sum to ${barU}); roles b=bass c=chord r=rest; durations in quarter-beats (${grade===2?"no semiquavers":"0.25=semiquaver"} allowed); at least one bass; optional . staccato or > accent. Return shape strings like "b1 c1 c1".`;
  const proposed = (await askClaude({ figures:{ type:"array", items:{ type:"object", properties:{ shape:{type:"string"}, feels:{type:"array",items:{type:"string",enum:["lilt","crisp","smooth"]}}, style:{type:"string"} }, required:["shape","feels","style"] } } }, prompt)).figures||[];
  const seen=new Set(existing.map(figFinger)); const kept=[];
  for(const p of proposed){ const v=parse(p.shape); if(!v.ok||seen.has(v.finger)) continue; seen.add(v.finger);
    const sStr="["+v.s.map(c=>"["+c.map(x=>typeof x==="string"?`'${x}'`:x).join(",")+"]").join(",")+"]";
    kept.push(`  { t:['${time}'], g:[${grade}], f:[${(p.feels.length?p.feels:["lilt","crisp"]).map(x=>`'${x}'`).join(",")}], s:${sStr} },  // ${p.style} (grown)`); }
  console.log(`LH ${time} G${grade}: proposed ${proposed.length}, ${kept.length} passed vetting.`);
  if(kept.length){ const out=insertIntoArray(fs.readFileSync(GEN,"utf8"), "export const FIGBANK = [", [`  // grown LH ${time}`, ...kept]);
    if(out){ fs.writeFileSync(GEN,out); console.log(`+${kept.length} figures written.`); } }
}

// ============================ RIGHT HAND (QFEEL crotchet cells) ============================
else {
  const feel = ["smooth","lilt","crisp"].includes(slot) ? slot : "crisp";
  const cellStr = c => c.join(" ");
  const existing = QFEEL[feel] || [];
  const parse = str => { const ds=String(str).trim().split(/\s+/).map(parseFloat); if(ds.some(isNaN)) return {ok:false}; if(ds.some(d=>!LEGAL_DUR.has(d))) return {ok:false}; if(Math.abs(ds.reduce((a,b)=>a+b,0)-1)>1e-6) return {ok:false}; return {ok:true,ds,finger:ds.join(",")}; };
  const prompt = `You are a pianist cataloguing idiomatic RIGHT-HAND (melody) rhythmic subdivisions of ONE crotchet beat for a ${feel} character at Grade ${grade}. Each pattern is the note-durations within a single crotchet (they sum to exactly 1 quarter-beat). Already used for ${feel}:\n${existing.map(cellStr).map(s=>"  "+s).join("\n")}\nPropose ${want} NEW, distinct, idiomatic ${feel} crotchet subdivisions a melody would sing — smooth and singable for smooth, dotted-lilting for lilt, brisk for crisp — never angular or stuttery. Durations in quarter-beats (${grade===2?"quavers at smallest, so 0.5 or 1":"0.25=semiquaver, 0.5=quaver, 0.75=dotted quaver"}); each must sum to 1. Return duration strings like "0.5 0.25 0.25" or "0.75 0.25".`;
  const proposed = (await askClaude({ cells:{ type:"array", items:{ type:"object", properties:{ shape:{type:"string"}, note:{type:"string"} }, required:["shape"] } } }, prompt)).cells||[];
  const seen=new Set(existing.map(c=>c.join(","))); const kept=[];
  for(const p of proposed){ const v=parse(p.shape); if(!v.ok||seen.has(v.finger)) continue; seen.add(v.finger); kept.push(`[${v.ds.join(",")}]`); }
  console.log(`RH ${feel} G${grade}: proposed ${proposed.length}, ${kept.length} passed vetting: ${kept.join(" ")}`);
  if(kept.length){ const src=fs.readFileSync(GEN,"utf8").split("\n");
    const qi=src.findIndex(l=>l.includes("export const QFEEL")); let fi=-1;
    for(let i=qi;i<src.length && i<qi+8;i++){ if(new RegExp(`^\\s*${feel}\\s*:`).test(src[i])){ fi=i; break; } }
    if(fi>=0){ const li=src[fi].lastIndexOf("]"); src[fi]=src[fi].slice(0,li)+","+kept.join(",")+src[fi].slice(li); fs.writeFileSync(GEN,src.join("\n")); console.log(`+${kept.length} RH cells written into QFEEL.${feel}.`); } }
}
