// Batch generator for the grade banks. Appends pieces up to a target count, with three neighbour-variety screens
// (all reject-and-reroll only — none removes anything from the generator's vocabulary, so nothing narrows):
//   1. KEY spread    — no back-to-back same key+mode; nudge off any key already at 4+ in the bank.
//   2. FIGURE spread — no adjacent same metre+accompaniment-figure (ex._figSig).
//   3. RHYTHM spread — no adjacent same metre+dominant melodic bar-rhythm (Matthew: same rhythm across exercises).
// Usage:  node gen-batch.mjs [grade] [targetCount]
import { generate } from './generator.mjs';
import { validate } from './engine.mjs';
import * as H from './harmony-checks.mjs';
import fs from 'fs';
// A candidate must also be VALIDATE-clean, not only harmony-clean. generate() returns its best-scoring try, which can be
// a piece that still carries a validate error (e.g. an out-of-grade LH span) when no fully-clean layout turned up in its
// tries - especially once the bank is populated and the distinctness/diversity constraints tighten. Screening harmony
// alone let those into the bank (measured: 8/20 grade-2 pieces with LH span > 7). Rejecting them here re-rolls to a clean
// one; it removes a flawed PIECE, never a capability, so nothing narrows.
const validClean = e => { try { return validate(e).errors.length === 0; } catch { return false; } };
// Reject-and-reroll any piece that trips a harmony check (beatDissonance et al). This removes a flawed PIECE, never a
// capability, so it does not narrow the generator - it just holds the BANK to the harmony standard Matthew expects.
const _hchecks = Object.keys(H).filter(k => typeof H[k] === 'function' && k !== 'validate');
const harmonyClean = e => _hchecks.every(k => { try { const r = H[k](e); return !((Array.isArray(r) && r.length) || (r && r.problems && r.problems.length)); } catch { return true; } });
// ENDING check (Matthew's exercise-2 catch): the MELODY must resolve ON a beat, held at least a full beat - never a short
// off-beat quaver close. Reads the melody STAFF (lh when swapped) and is ANACRUSIS-aware (offset by e.partial). Reject-and-
// reroll removes a flawed PIECE, never a capability.
const endsClean = e => { const mel = (e._swap==='swap'||e._mel==='lh') ? e.lh : e.rh; if(!mel||!mel.length) return true;
  const [tn,bn]=e.time.split('/').map(Number), barU=(tn/bn)*4, beatLen=(bn===8&&tn%3===0)?1.5:1, partial=e.partial||0;
  let t=0,last=null,lp=0; for(const n of mel){ if(!n.rest){ last=n; lp=(((t-partial)%barU)+barU)%barU; } t+=n.d; }
  if(!last) return true; const onBeat=Math.abs((lp/beatLen)-Math.round(lp/beatLen))<1e-9;
  return !(last.d < beatLen-1e-9 || !onBeat); };
// PITCH-VARIETY curation (Matthew's exercise-4 catch, "loads of Es"): a five-finger tune squeezed into five notes will
// naturally lean on its tonic - a third of the notes on one pitch is musical - but a MELODY that spends nearly every other
// note on a single pitch reads as hammering, an axis the line orbits instead of a line that travels. This is a WHOLE-PIECE
// property (no single note is wrong; the fault is the pervasive combination), so it belongs in curation, not as a generator
// gate - the generator can still WRITE an axis tune (sometimes valid); the BOOK just doesn't PRINT the ones that hammer, the
// way an editor discards a monotonous draft. Reads the melody STAFF (lh when swapped). Threshold 46% of the melody's pitched
// notes on one pitch; only applied once the tune has enough notes for the ratio to mean anything.
const melodyVaried = e => { const mel = (e._swap==='swap'||e._mel==='lh') ? e.lh : e.rh; if(!mel) return true;
  const P = mel.filter(n=>!n.rest && n.m!=null).map(n=>Array.isArray(n.m)?n.m[0]:n.m); if(P.length<8) return true;
  const cnt={}; for(const p of P) cnt[p]=(cnt[p]||0)+1;
  return Math.max(...Object.values(cnt))/P.length < 0.46; };
// NOTE (2026-08-09, deliberately NOT screened): Matthew's exercise-3 "stray E on the end" is a bass note hanging under the
// melodic breath at the antecedent seam. Investigated thoroughly: the genuinely-muddy case (a NON-chord bass tone alone over
// the breath) occurs in ~0-1% of current output, and every attempt to screen it mechanically also rejected VALID cadences -
// dominant/subdominant 7ths (a V7 half cadence), passing tones in a CONTINUOUS antecedent (no cadence there at all), and
// chord-extension colour. The stray tone is usually diatonic and a chord tone of a neighbouring function, so "foreign" can't
// be drawn cleanly without the exact fragile rule-gate that narrows valid music. Screening it therefore costs more (lost V7 /
// continuous / coloured cadences) than it saves. The correct fix is in the ACCOMPANIMENT - during a real antecedent breath
// the bass should sustain the cadence chord or rest rather than walk to a new note - a positive generator change, deferred as
// real work, not a curation gate. See memory sr-melody-harmony-negotiation / the no-narrowing method.
const grade = +(process.argv[2] || 4);
const bankPath = new URL(`./bank/grade${grade}.json`, import.meta.url);
const snapDir  = new URL('./bank/.snapshots/', import.meta.url);
const bank = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
const target = +(process.argv[3] || bank.length + 5);
// AVOID_BANK (optional): a bank the new pieces must be DISTINCT from - a full regeneration must not reproduce the pieces it
// replaces. Its pieces are fed into generate()'s avoid-set (structural distance) AND its note-signatures block any identical
// exercise. It is NOT added to the output bank; it only pushes generation away from what already exists.
const avoidBank = process.env.AVOID_BANK ? JSON.parse(fs.readFileSync(new URL(process.env.AVOID_BANK, import.meta.url), 'utf8')) : [];
if (avoidBank.length) console.log(`avoiding ${avoidBank.length} existing pieces (must be genuinely new, not recycled)`);
// NO HAMMER: reject a piece with 3+ identical struck notes in a row on either staff (a dead repeated note - the accompaniment
// should hold or move, not re-strike). Reject-and-reroll removes a flawed PIECE, never a capability.
const noHammer = e => { const [tn,bn]=e.time.split('/').map(Number), barU=(tn/bn)*4;
  for(const st of [e.rh,e.lh]){ let p=0; const bb={}; for(const n of st){ const b=Math.floor((p+1e-9)/barU); (bb[b]=bb[b]||[]).push(n); p+=n.d; }
    for(const k in bb){ const ns=bb[k].filter(n=>!n.rest); let run=1; for(let j=1;j<ns.length;j++){ const a=Array.isArray(ns[j-1].m)?null:ns[j-1].m, c=Array.isArray(ns[j].m)?null:ns[j].m; if(a!=null&&a===c&&!ns[j].ti){ run++; if(run>=3) return false; } else run=1; } } }
  return true; };
// DISTINCT TUNE: never reproduce a MELODY that's in the bank being replaced (note-identical is caught by tooSimilar; this
// also blocks the same tune under a different accompaniment - a full regen must be genuinely new).
const _melSig = e => { const mel=(e._swap==='swap'||e._mel==='lh')?e.lh:e.rh; return JSON.stringify(mel.map(n=>[Array.isArray(n.m)?n.m[0]:n.m,n.d,n.rest?1:0])); };
const _avoidMel = new Set(avoidBank.map(_melSig));
const distinctTune = e => !_avoidMel.has(_melSig(e));
// LIVE ACCOMPANIMENT: reject a rhythmically DEAD accompaniment - one that is mostly whole-bar notes with no sub-bar movement
// (the swap "held whole notes the entire piece"). A composer gives the accompaniment some rhythmic life; the book shouldn't
// print a static one. Reads the ACCOMPANIMENT staff (rh when the melody is in lh/swap). Reject-and-reroll; removes a flawed piece.
const liveAccomp = e => { const acc = (e._swap==='swap'||e._mel==='lh') ? e.rh : e.lh;
  const [tn,bn]=e.time.split('/').map(Number), barU=(tn/bn)*4;
  const an = acc.filter(n=>!n.rest && n.m!=null); if(an.length<3) return true;
  const wholeBar = an.filter(n=>n.d>=barU-1e-9).length;
  return wholeBar/an.length < 0.6; };

const km = p => p.key + ' ' + p.mode;
const clean = e => { const o={grade:e.grade,key:e.key,mode:e.mode,flat:e.flat,time:e.time,tempo:e.tempo,rhFinger:e.rhFinger,lhFinger:e.lhFinger,rh:e.rh,lh:e.lh}; if(e.partial)o.partial=e.partial; return o; };
const figSig = e => `${e.time}|${e._figSig}`;
function domRhythm(e){                                   // metre + most-common melody bar-rhythm
  const mel = e._mel==='lh' ? e.lh : e.rh;
  const [t,b]=e.time.split('/').map(Number); const barU=(t/b)*4;
  const bars=[]; let pos=e.partial?(barU-e.partial):0, cur=[];
  for(const n of mel){ if((pos%barU)<1e-6 && cur.length){ bars.push(cur.join(',')); cur=[]; } cur.push(+n.d.toFixed(3)); pos+=n.d; }
  if(cur.length) bars.push(cur.join(','));
  const c={}; bars.forEach(s=>c[s]=(c[s]||0)+1);
  let best='',bc=0; for(const [s,n] of Object.entries(c)) if(n>bc){bc=n;best=s;}
  return `${e.time}|${best}`;
}

let prevFig=null, prevRhy=null;
// COLLECTION-DIVERSITY histograms of each piece's variety choices across the bank-so-far, fed back into generate() so
// pieces 2..N pick the least-used option (diversity = the reason, not a die). Seeded from any pieces already in the bank.
const hist = { figBias:{}, tex:{}, pahSpacing:{}, scheme:{}, fig:{}, winLo:{}, mode:{}, time:{}, finalCad:{}, char:{}, key:{}, restate:{}, midType:{}, chordMove:{}, dyn:{}, secDom:{}, anac:{}, dbl:{}, brShape:{}, rhFig:{}, dblRun:{}, aug:{}, swap:{}, seedOpen:{} };
const HKEYS = [['figBias','_figBias'],['tex','_tex'],['pahSpacing','_pahSpacing'],['scheme','_scheme'],['fig','_figFig'],['winLo','_winLo'],['mode','mode'],['time','time'],['finalCad','_fc'],['char','_char'],['restate','_restate'],['midType','_mid'],['dyn','_dyn0'],['secDom','_secDom'],['anac','_anac'],['dbl','_dbl'],['brShape','_brShape'],['rhFig','_rhFig'],['dblRun','_dblRun'],['aug','_aug'],['swap','_swap'],['seedOpen','_seedOpen']];
const bumpHist = e => { for(const [h,f] of HKEYS){ if(e[f]!=null) hist[h][e[f]]=(hist[h][e[f]]||0)+1; }
  if(e.key!=null) { const kk=e.key+'|'+e.mode; hist.key[kk]=(hist.key[kk]||0)+1; }   // spread by key AND mode (must match generate()'s k[0]+'|'+mode lookup) so a letter's major and minor don't share one budget
  if(e._prog) for(let i=1;i<e._prog.length;i++){ const k=e._prog[i-1]+'>'+e._prog[i]; hist.chordMove[k]=(hist.chordMove[k]||0)+1; } };   // chord-transition histogram for the moveChord tie-break
for(const p of bank) bumpHist(p);   // seed from any pieces already in the bank
// DISTINCTNESS GRADIENT (Matthew): the closer two exercises sit in the book, the more distinct they must be. Immediate
// neighbours differ maximally; the requirement EASES with distance, down to just "not identical" far apart. Similarity is
// read on 4 axes - key+mode, metre, figure, dominant rhythm. Never a global cap, so it can't starve the tail (the old
// "avoid any key common book-wide" screen did). A note-signature check forbids an IDENTICAL exercise anywhere in the book.
const _attrs = p => ({ km: km(p), time: p.time, fig: figSig(p), rhy: domRhythm(p) });
const _noteSig = p => JSON.stringify([p.rh.map(n=>[n.m,n.d,n.rest?1:0]), p.lh.map(n=>[n.m,n.d,n.rest?1:0])]);
function tooSimilar(c, bank, bankSigs){
  if(bankSigs.has(_noteSig(c))) return true;                     // never an identical exercise, anywhere in the book
  const a=_attrs(c), N=Math.min(bank.length, 25);
  // GRADIENT by COMBINATION-uniqueness (cheap, so it can't stall): grade 2 has only a handful of keys and 4 metres, so an
  // axis-COUNT rule ("differ on >=2 axes") is expensive to satisfy and starves. Instead the closer two pieces sit, the
  // larger the combination that must be unique: neighbours differ in key AND metre; nothing within 8 shares key+metre;
  // nothing within 25 shares key+metre+figure. Past 25 only the identical-notes guard applies - a far shared vibe is fine.
  for(let d=1; d<=N; d++){ const b=_attrs(bank[bank.length-d]);
    if(d===1){ if(a.km===b.km || a.time===b.time) return true; }                       // immediate neighbour: a different KEY and a different METRE
    else if(d<=8){ if(a.km===b.km && a.time===b.time) return true; }                   // near (within ~8): never the same key+metre
    else if(a.km===b.km && a.time===b.time && a.fig===b.fig) return true;              // out to 25: never the same key+metre+figure
  }
  return false;
}
while (bank.length < target) {
  const slot = bank.length + 1;
  const bankSigs = new Set([...bank, ...avoidBank].map(_noteSig));   // note-signatures so far AND the bank being replaced, for the identical-exercise guard
  // TEXTURE DIVERSITY (validity-affecting, so done here not in buildCandidate): PREFER a texture that has not come to
  // dominate the book (>45%), so the collection isn't all one figure - but this is a PREFERENCE, never a wall. A composer
  // leans toward variety, yet if the piece's own character wants the fitting texture, they use it regardless of how often
  // it has appeared - a percentage must not override musical appropriateness (Matthew). So we keep the first valid, spread-
  // clean candidate of an over-used texture as a fallback and TAKE it if no less-used texture turns up, capping the search
  // so it can never deadlock re-rolling the fitting texture forever (the generation cliff was exactly that hard reject).
  const texN=Object.values(hist.tex).reduce((s,x)=>s+x,0);
  const texHeavy=new Set(Object.entries(hist.tex).filter(([,c])=>texN>=8 && c>texN*0.45).map(([k])=>k));
  let ex=null, texAlt=null, texMiss=0;
  for (let t=0;t<600;t++){ const c=generate(grade,2500,bank.concat(avoidBank),hist);
    if(!c) continue;
    const cc=clean(c);                                    // screen the CLEANED form - it's what gets SAVED, and a couple of harmony checks (parallelPerfects/sixFours) read differently once the helper fields are stripped
    if(!validClean(cc)) continue;                         // in-grade (validate) AND ...
    if(!harmonyClean(cc)) continue;                       // ... harmony-clean AND ...
    if(!endsClean(c)) continue;                           // ... resolves cleanly at the cadence
    if(!melodyVaried(c)) continue;                         // ... its melody travels, not an orbited axis (the "loads of Es" curation)
    if(!noHammer(c)) continue;                             // ... no 3+ dead repeated note
    if(!distinctTune(c)) continue;                         // ... a genuinely new tune, not one from the bank being replaced
    if(!liveAccomp(c)) continue;                          // ... a rhythmically live accompaniment, not dead whole notes
    if(tooSimilar(c, bank, bankSigs)) continue;           // DISTINCTNESS GRADIENT: distinct enough for its proximity in the book (key/metre/figure/rhythm axes)
    if(texHeavy.has(c._tex)){ if(!texAlt) texAlt=c; if(++texMiss>=40) break; continue; }   // prefer less-used; hold the fitting one
    ex=c; break; }
  if(!ex && texAlt) ex=texAlt;                            // no less-used texture appeared -> take the fitting one, never a stall
  // fallback: only forbid the IMMEDIATE last key (soft spread), never the whole heavy set - with few keys and a large
  // target every key MUST exceed the heavy threshold, so hard-avoiding all heavy keys would stall a full rebuild.
  if(!ex) for(let t=0;t<400;t++){ const c=generate(grade,2500,bank.concat(avoidBank),hist); if(c && validClean(clean(c)) && harmonyClean(clean(c)) && melodyVaried(c) && noHammer(c) && distinctTune(c) && liveAccomp(c) && (!bank.length || km(c)!==km(bank[bank.length-1]))){ ex=c; break; } }
  // LAST RESORT: drop even the key-spread AND the diversity histogram, so generate() is free to draw an EASY key instead of
  // being forced onto the least-used one - a single hard key (e.g. a low minor that crosses more) can then never abort the
  // whole batch. Still distinct (avoid-set) and clean; only the variety preference is relaxed for that one unlucky slot.
  if(!ex) for(let t=0;t<600;t++){ const c=generate(grade,2500,bank.concat(avoidBank),null); if(c && validClean(clean(c)) && harmonyClean(clean(c)) && noHammer(c) && distinctTune(c) && liveAccomp(c) && melodyVaried(c) && endsClean(c)){ ex=c; break; } }   // QUALITY screens (melody travels, ends cleanly) apply even in the last resort - only the DIVERSITY preferences (key-spread/tooSimilar) are relaxed, so a monotonous tune can't slip in on a hard slot
  if(!ex){ console.error('could not generate slot', slot); break; }
  bumpHist(ex);                          // record this piece's diversity choices so the next piece avoids repeating them
  const c=clean(ex); bank.push(c);
  fs.writeFileSync(new URL(`slot${slot}.gen.json`, snapDir), JSON.stringify(c,null,1));
  prevFig=figSig(ex); prevRhy=domRhythm(ex);
  console.log(`slot ${slot}: ${c.key} ${c.mode}  ${c.time} "${c.tempo}"  swap=${ex._mel==='lh'}  fig=${ex._tex}  RH${c.rh.length}/LH${c.lh.length}`);
}
fs.writeFileSync(bankPath, JSON.stringify(bank,null,1));
console.log('bank now', bank.length, 'pieces. saved. (run: node enforce-locks.mjs '+grade+')');
