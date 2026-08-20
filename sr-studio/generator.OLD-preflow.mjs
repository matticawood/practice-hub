// Sight Reading Studio — per-grade exercise generator.
// Strategy: chord-led composition + rejection sampling. Build a candidate within the
// grade's parameters, run engine.validate(); keep the first CLEAN one (or least-bad).
import { validate, POS } from './engine.mjs';
import { leapClashes, sixFours, parallelPerfects, lhParallels, beatClash, handCrossing, melodicAug2nd } from './harmony-checks.mjs';   // the genuine-fault checks (not beatDissonance, which flags desirable suspensions)
import { skeleton, contour } from './variety.mjs';              // surface signatures, for keeping bank pieces distinct
import { gradeParams } from './grade-params.mjs';               // GRADE PARAMETER TABLE — the rule engine reads its grade-variable limits from here (grade-agnostic; grade is only a lens)

// ---- bank-level uniqueness: how DIFFERENT two finished pieces are (higher = more distinct) ----
const _profOf = t => { t=(t||'').toLowerCase();
  return /cantabile|sostenuto|espress|dolce|tranquillo|semplice|adagio|larghetto|lento/.test(t)?'legato'
       : /grazioso/.test(t)?'graceful'
       : /scherz|giocoso|leggiero|vivace|comodo|risoluto|brio/.test(t)?'light':'plain'; };
const _lhBass = ex => { const [tp,bt]=ex.time.split('/').map(Number); const bU=(tp/bt)*4;
  let t=0,out=[]; for(const n of ex.lh){ const b=Math.floor((t+(ex.partial||0))/bU+1e-9);
    if(!n.rest && out[b]==null){ const m=Array.isArray(n.m)?Math.min(...n.m):n.m; out[b]=((m%12)+12)%12; } t+=n.d; }
  return out.join(','); };
const pieceSig = ex => ({ key:ex.key+ex.mode, time:ex.time, prof:_profOf(ex.tempo),
  contour:contour(ex), skel:skeleton(ex), bass:_lhBass(ex) });
const sigDistance = (a,b) => {                                   // 0 (twins) .. ~11.5 (nothing in common)
  let d=0;
  if(a.key!==b.key) d+=3;                                        // different key/mode is the biggest distinguisher
  if(a.time!==b.time) d+=2;
  if(a.prof!==b.prof) d+=1.5;                                    // different character
  if(a.contour!==b.contour) d+=1.5;                              // different melodic shape
  if(a.skel!==b.skel) d+=1.5;                                    // different rhythm skeleton
  if(a.bass!==b.bass) d+=2;                                      // different harmonic/bass skeleton
  return d; };

const rnd=a=>a[Math.floor(Math.random()*a.length)], chance=p=>Math.random()<p;
// COLLECTION DIVERSITY: choose the option LEAST represented in the collection so far, so the book stays varied - the
// diversity IS the reason (Matthew), not a die. `counts` is the histogram of this choice across the bank-so-far. With no
// counts (a standalone/first piece - the one legitimately-free seed) the choice is free. Ties break by canonical order
// (deterministic, no die) which round-robins the options as the bank grows.
const pickLeastUsed = (options, counts) => {
  if(!counts) return rnd(options);
  let bc=Infinity; for(const o of options){ const c=counts[o]||0; if(c<bc) bc=c; }
  for(const o of options){ if((counts[o]||0)===bc) return o; }
  return options[0];
};
const clamp=(i,hi)=>Math.max(0,Math.min(hi,i));
// Rough crotchet-BPM for a tempo marking, so articulation can reason about a note's REAL duration in seconds
// (a semiquaver is crisp and playable staccato at Adagio, a blur at Allegro). Checked slowest-first.
const bpmOf = t => { t=(t||'').toLowerCase();
  if(/grave|largo|lento|adagio/.test(t)) return 56;
  if(/larghetto|adagietto/.test(t)) return 66;
  if(/andante|sostenuto|cantabile|espress|tranquillo|dolce|mesto|sadly|lullaby/.test(t)) return 82;
  if(/andantino|moderato|comodo|semplice|minuet|gently/.test(t)) return 100;
  if(/allegretto/.test(t)) return 116;
  if(/vivace|presto|leggiero|brio|con moto/.test(t)) return 150;
  if(/allegro|marcia|march|ritmico|rhythm|giocoso|risoluto|lively|vivo|scherz|dancing|happily/.test(t)) return 132;
  return 100;
};
// a note is cleanly playable staccato only if it lasts long enough to articulate (roughly >=140ms)
const staccatable = (d, bpm) => d * (60/bpm) >= 0.14;

// key -> {ly, mode, flat, rhTonic midi}   (RH tonic in 60..71, LH = -12)
const KEYS = {
  maj:[['c',60,false],['g',67,false],['d',62,false],['f',65,true]],
  min:[['a',69,false],['d',62,true],['e',64,false],['g',67,true]],
};
const KEYS3 = { maj:[...KEYS.maj,['a',69,false],['bf',70,true],['ef',63,true]], min:[...KEYS.min,['b',71,false]] };
// MASTER key table keyed by the grade-param key NAME ([ly, tonic-midi, flat]). The grade's gp.keys.major/minor list
// selects from this, so the TABLE governs which keys a grade uses (grades 1-8), not hardcoded KEYS/KEYS3.
const KEYINFO = {
  maj:{ C:['c',60,false], G:['g',67,false], F:['f',65,true], D:['d',62,false], A:['a',69,false], Bf:['bf',70,true],
        Ef:['ef',63,true], E:['e',64,false], Af:['af',68,true], B:['b',71,false], Df:['df',61,true] },
  min:{ A:['a',69,false], D:['d',62,true], E:['e',64,false], G:['g',67,true], B:['b',71,false], Fs:['fs',66,false],
        C:['c',60,true], Cs:['cs',61,false], F:['f',65,true] },
};
const TEMPI = {
  2:['Andante','Andantino','Adagio','Moderato','Allegretto','Allegro','Andante cantabile','Andante espressivo','Andante tranquillo','Moderato grazioso','Moderato semplice','Allegretto grazioso','Allegretto giocoso','Andante dolce','Allegro moderato'],
  3:['Andante','Andantino','Adagio','Larghetto','Moderato','Allegretto','Allegro','Vivace','Andante con moto','Andante sostenuto','Andante espressivo','Moderato cantabile','Allegretto scherzando','Allegretto leggiero','Allegro grazioso','Comodo'],
  4:['Adagio','Larghetto','Lento','Andante','Andante sostenuto','Andante con espressione','Moderato','Moderato e cantabile','Allegretto','Allegretto con moto','Allegro','Allegro moderato','Allegro grazioso','Allegro giocoso','Allegro risoluto','Vivace','Con moto'],
};
// ---- CHARACTER TAXONOMY. Each character is a COMPLETE COHERENT FABRIC: which markings print, which metres
// fit, the rhythm feel, the LH GROOVE POOL (rests intrinsic to the groove), melodic articulation, and biases
// for the expressive devices (accent/staccato/fermata) + dynamics. Chosen up front; governs everything
// downstream so the two hands can't diverge (no detached melody over a held chord). Grounded in the ABRSM
// specimen books (G2 AB3395 / G3 AB3396 / G4 AB3397). `feel` maps to barRhythm; grade scales the complexity.
// PARAMETRIC, not fixed grooves (Matthew: named grooves pigeonhole + don't grade-scale). Each character
// carries a base texture pool (ordinary textures, no rests) + PARAMETERS: `detach` = how much the accompaniment
// LIFTS its struck notes (a lifted bassline IS a skip; a lifted oom-pah is a march; 0 = legato/held), `drop` =
// tendency to leave a hand SILENT for a bar (textural space), `melBreath` = tendency for a melodic breath/gap,
// `stac` = melodic staccato, `accent`/`ferm`/`hair`/`dyn` = expressive biases. detach is a FRACTION of the beat,
// so it grade-scales itself (coarse quaver-lift at G2, finer at G4) and varies per piece. Nothing is a template.
const CHARACTERS = [
  { id:'singing', feel:'smooth', artic:'legato', tex:['sustained','broken','alberti','sustained','broken'],
    metres:['4/4','3/4','6/8','2/4'], detach:0.0, drop:0.1, melBreath:0.1, stac:0.0, accent:0.0, ferm:0.15, hair:0.85, dyn:['pp','p','mp'],
    marks:['Cantabile','Andante cantabile','Andante espressivo','Espressivo','Expressively','Smoothly','Sweetly','Andante sostenuto','Adagio espressivo','Moderato cantabile','Andante dolce','Moderato espressivo','Con espressione','Moderato e cantabile'] },
  { id:'lyricalslow', feel:'smooth', artic:'legato', tex:['sustained','broken','sustained','alberti'],
    metres:['4/4','3/4','6/8','2/4'], detach:0.0, drop:0.25, melBreath:0.2, stac:0.0, accent:0.05, ferm:0.35, hair:0.8, dyn:['pp','p','mp'],
    marks:['Adagio','Lento','Larghetto','Slowly','Sadly','Mesto','Rather sadly','Wistfully','Lullaby','Tenderly','Gently','Calmly','Peacefully'] },
  { id:'flowing', feel:'smooth', artic:'mixed', tex:['broken','alberti','sustained','rootfifth','broken'],
    metres:['4/4','3/4','6/8','2/4'], detach:0.15, drop:0.15, melBreath:0.15, stac:0.2, accent:0.1, ferm:0.1, hair:0.6, dyn:['p','mp','mf'],
    marks:['Flowing','Moderato','Molto moderato','Andante','Andantino','Andante tranquillo','Andante grazioso','Steadily','Gently rocking','With movement','Andante con moto'] },
  { id:'dance68', feel:'lilt', artic:'mixed', tex:['rootfifth','bassline','rootfifth','broken'],
    metres:['6/8','3/8'], detach:0.55, drop:0.1, melBreath:0.25, stac:0.5, accent:0.15, ferm:0.05, hair:0.5, dyn:['p','mp','mf'],
    marks:['Poco vivace','Vivace','Allegretto','Leggiero','Grazioso','Giocoso','Playfully','Dancing','Lilting','Delicately','Gracefully','Allegretto leggiero','Allegretto grazioso','Allegro giocoso','Allegretto capriccioso'] },
  { id:'dance24', feel:'crisp', artic:'mixed', tex:['bassline','rootfifth','block','bassline'],
    metres:['2/4','4/4'], detach:0.6, drop:0.1, melBreath:0.25, stac:0.6, accent:0.2, ferm:0.05, hair:0.4, dyn:['mp','mf','f'],
    marks:['Poco vivace','Vivace','Allegro','Allegretto','Giocoso','Poco allegretto','Allegro giocoso','Happily','Cheerfully','Merrily','Comodo'] },
  { id:'scherzo', feel:'crisp', artic:'detached', tex:['bassline','rootfifth','block','bassline'],
    metres:['6/8','3/8','2/4','3/4'], detach:0.7, drop:0.15, melBreath:0.35, stac:0.85, accent:0.3, ferm:0.05, hair:0.4, dyn:['mp','mf','f'],
    marks:['Scherzando','Allegretto scherzando','Allegro giocoso','Jauntily'] },
  { id:'waltz', feel:'lilt', artic:'legato', tex:['rootfifth','rootfifth','broken'],
    metres:['3/4'], detach:0.35, drop:0.05, melBreath:0.1, stac:0.3, accent:0.1, ferm:0.05, hair:0.6, dyn:['p','mp','mf'],
    marks:['Waltz','Valse','Valse lente','Tempo di valse'] },
  { id:'minuet', feel:'lilt', artic:'mixed', tex:['rootfifth','bassline','rootfifth'],
    metres:['3/4'], detach:0.45, drop:0.1, melBreath:0.2, stac:0.6, accent:0.15, ferm:0.05, hair:0.5, dyn:['mp','mf'],
    marks:['Tempo di minuetto','Minuet'] },
  { id:'march', feel:'crisp', artic:'detached', tex:['bassline','block','bassline'],
    metres:['4/4','2/4'], detach:0.5, drop:0.1, melBreath:0.2, stac:0.6, accent:0.6, ferm:0.1, hair:0.4, dyn:['mf','f','f'],
    marks:['Alla marcia','March','Tempo di marcia','Marziale','Fanfare','Boldly','Proudly'] },
  { id:'rhythmic', feel:'crisp', artic:'detached', tex:['bassline','block','bassline'],
    metres:['2/4','4/4','3/4'], detach:0.55, drop:0.1, melBreath:0.3, stac:0.7, accent:0.4, ferm:0.05, hair:0.4, dyn:['mf','f'],
    marks:['Rhythmically','Allegretto ritmico','Steadily','Con moto','Allegro moderato'] },
  { id:'grand', feel:'smooth', artic:'mixed', tex:['block','rootfifth','block'],
    metres:['4/4','2/4','3/4'], detach:0.4, drop:0.35, melBreath:0.15, stac:0.25, accent:0.7, ferm:0.35, hair:0.5, dyn:['f','f','mf'],
    marks:['Maestoso','Grandioso','Grandly','Lively and strong','Boldly','Broadly','Proudly','Con brio','Allegro risoluto'] },
  { id:'lively', feel:'crisp', artic:'mixed', tex:['bassline','rootfifth','broken','block'],
    metres:['2/4','4/4','3/4'], detach:0.4, drop:0.1, melBreath:0.2, stac:0.5, accent:0.25, ferm:0.1, hair:0.5, dyn:['mp','mf','f'],
    marks:['Lively','Allegro','Vivace','Con moto','Allegro moderato','Brioso','Brightly','Energetically'] },
];
// GRADE-SKEWED MARK REGISTER. Real specimens lean on plain-English words and single basic Italian at the lower
// grades, and only bring in the richer/compound Italian (con espressione, sostenuto, Allegretto scherzando…) as
// the grade climbs. Classify a mark into a register 0=plain (English word / basic single Italian) · 1=mid (single
// rich Italian, or a two-word English direction) · 2=compound Italian phrase — then weight the draw by grade.
const _BASIC_IT=/^(Andante|Andantino|Moderato|Molto moderato|Allegretto|Allegro|Allegro moderato|Adagio|Vivace|Lento|Larghetto|Comodo)$/;
const _IT_TOKEN=/^(andante|andantino|moderato|allegretto|allegro|adagio|vivace|lento|larghetto|molto|poco|con|moto|brio|brioso|espress\w*|sostenuto|cantabile|dolce|tranquill\w*|grazioso|giocoso|scherz\w*|leggiero|risoluto|capriccioso|maestoso|grandioso|marcia|marziale|ritmic\w*|comodo|valse|lente|minuetto|semplice|mesto)$/i;
function markRegister(mark){
  const w=mark.trim().split(/\s+/);
  const it=w.filter(x=>_IT_TOKEN.test(x)).length;
  if(it>=2) return 2;                          // compound Italian phrase (richest)
  if(it===1) return _BASIC_IT.test(mark)?0:1;  // single Italian: basic vs rich
  return w.length>=2 ? 1 : 0;                  // English: two-word=mid, single word=plain
}
const _REG_W={ 2:[3.0,1.0,0.22], 3:[2.0,2.0,1.0], 4:[1.2,2.0,2.6], 5:[1.0,1.8,2.8] };
function pickMark(pool, grade){
  if(!pool || !pool.length) return pool && pool[0];
  const w=_REG_W[grade]||_REG_W[4]; const wts=pool.map(m=>w[markRegister(m)]);
  let tot=wts.reduce((a,b)=>a+b,0), r=Math.random()*tot;
  for(let i=0;i<pool.length;i++){ r-=wts[i]; if(r<=0) return pool[i]; }
  return pool[pool.length-1];
}
// chords as scale-step indices (0=tonic..). bass = LH root index. CH = five-finger-safe (Grade 2).
// Five-finger-voiceable chords (Grade 2): every chord whose ROOT sits inside the five-finger box (degrees 0-4),
// so I ii iii IV V (major) / i III iv v (minor). Only vi/vii (root degree 5/6, above the box) are the genuine
// grade-2 limit. IV was missing for no reason (minor already had iv); the functional grammar below now runs at
// ALL grades and is simply filtered to whatever CHm contains, so grade is a parameter, not a separate code path.
const CH = {
  maj:{ I:{t:[0,2,4],b:0}, ii:{t:[1,3],b:1}, iii:{t:[2,4],b:2}, IV:{t:[3,0],b:3}, V:{t:[4,1],b:4} },
  min:{ i:{t:[0,2,4],b:0}, III:{t:[2,4],b:2}, iv:{t:[3,0],b:3}, v:{t:[4,1],b:4} },
};
// extra chords for Grade 3+ (out of the five-finger box) — richer harmony, root kept lowest
const CH_EXTRA = {
  maj:{ IV:{t:[3,5,7],b:3}, vi:{t:[5,7],b:5} },
  min:{ iv:{t:[3,5,7],b:3}, III:{t:[2,4,6],b:2}, VI:{t:[5,7],b:5} },
};
// the key's full scale (degree -> semitone) and each chord's members BY SCALE DEGREE (0=tonic).
// used so the melody's five-finger position can sit on any degree of the key, not just the tonic.
const KEYSCALE = { maj:[0,2,4,5,7,9,11,12,14,16], min:[0,2,3,5,7,8,10,12,14,16] };
const CHORD_DEG = {
  maj:{ I:[0,2,4], ii:[1,3,5], iii:[2,4,6], IV:[3,5,0], V:[4,6,1], vi:[5,0,2] },
  min:{ i:[0,2,4], iv:[3,5,0], v:[4,6,1], III:[2,4,6], VI:[5,0,2] },
};
const PROG = {
  maj:{4:[['I','V','I','I'],['I','ii','V','I'],['I','iii','V','I'],['I','V','ii','I']],
       6:[['I','V','I','ii','V','I'],['I','iii','ii','V','I','I'],['I','V','ii','V','I','I']],
       8:[['I','ii','V','V','I','ii','V','I'],['I','V','I','iii','ii','V','V','I'],['I','iii','ii','V','I','ii','V','I']]},
  min:{4:[['i','v','i','i'],['i','iv','v','i'],['i','v','iv','i']],
       6:[['i','v','i','iv','v','i'],['i','iv','i','v','i','i'],['i','v','iv','v','i','i']],
       8:[['i','iv','v','v','i','iv','v','i'],['i','v','i','iv','i','v','v','i']]},
};
// rhythm patterns per bar (quarter-beat units) keyed by bar length
const RHY = {
  4:[[2,2],[2,1,1],[1,1,2],[1,1,1,1],[1.5,0.5,2],[2,1.5,0.5],[1,1,1.5,0.5]],
  3:[[2,1],[1,2],[1,1,1],[1.5,0.5,1],[1,1.5,0.5]],
  2:[[2],[1,1],[1.5,0.5],[1,0.5,0.5]],
  1.5:[[1.5],[1,0.5],[0.5,1]],          // 3/8
};
const RHY_COMPOUND=[[1.5,1.5],[1,0.5,1.5],[1.5,1,0.5],[1,0.5,1,0.5],[1.5,0.5,0.5,0.5]]; // 6/8: dotted-crotchet beats
// 3/8 is a ONE-beat bar (a single dotted crotchet = 1.5 quarter-beats), not a small 6/8.
// Feeding it the 6/8 cells overfilled every bar, which made every 3/8 candidate illegal
// and is why the bank contains none.
const RHY_38=[[1.5],[1,0.5],[0.5,1],[0.5,0.5,0.5]];   // NO [0.75,0.75]: that halves the beat (dotted-quaver duplet) against the 3-quaver compound feel
// ---- CANONICAL BEAT VOCABULARY (Matthew's taxonomy) ----
// Every rhythmic cell is a subdivision of ONE crotchet beat (sums to 1 quarter-beat): the crotchet whole, its
// three 2-note divisions, and its 3-/4-note divisions. This is the atomic vocabulary the melody is built from.
const QDIV = [
  [1],                    // undivided crotchet
  [0.5,0.5],              // two quavers
  [0.75,0.25],            // dotted quaver + semiquaver
  [0.25,0.75],            // semiquaver + dotted quaver
  [0.5,0.25,0.25],        // quaver + two semiquavers
  [0.25,0.5,0.25],        // semiquaver, quaver, semiquaver
  [0.25,0.25,0.5],        // two semiquavers + quaver
  [0.25,0.25,0.25,0.25],  // four semiquavers
];
// A COMPOUND beat is a dotted crotchet = a crotchet's worth PLUS a quaver's worth. So every crotchet subdivision
// above, with an extra quaver (0.5) OR that quaver split into two semiquavers (0.25,0.25) tacked on, is a valid
// dotted-crotchet cell — one rule generates the whole idiomatic compound vocabulary. Plus the undivided beat.
const CBEATS = [ [1.5], ...QDIV.flatMap(q => [ [...q,0.5], [...q,0.25,0.25] ]) ];
const _semis = c => c.filter(d=>d<0.5).length;   // number of semiquavers in a cell -> its busyness
// In 6/8 the beat IS the dotted crotchet; every cell is built on that beat. Occasionally a bar takes a whole-bar
// held note (dotted minim) or a note tied ACROSS the mid-bar — the latter is a legitimate syncopation and notate()
// splits it at pos 1.5 (dotted-crotchet + quaver) so the beat stays legible. Kept OCCASIONAL, not every bar: the
// earlier fault was the motif stamping one crossing cell into nearly every bar, not the crossing itself.
function compoundBar(barU,feel,calmMel){
  const calm = feel==='smooth'||feel==='lilt';
  if(Math.abs(barU-3)<1e-9){
    if(chance(calm?0.12:0.06)) return [3];                    // occasional whole-bar held note (dotted minim)
    if(chance(0.08)) return rnd([[2,1],[1,2]]);               // occasional syncopation tied across the mid-bar (notate splits it)
  }
  const core = CBEATS.filter(c=>_semis(c)<=1);     // lilting quaver/crotchet cells + the one-semiquaver figures
  const mid  = CBEATS.filter(c=>_semis(c)===2);
  const busy = CBEATS.filter(c=>_semis(c)>=3);      // semiquaver runs
  // DENSITY BUDGET (Matthew's slot-11 rule): one hand carries the motion, not both. When the accompaniment is
  // a busy running figure at a FAST tempo (calmMel), the melody stays in quavers — no semiquavers at all — so it
  // sings over the Alberti instead of scrambling against it. Only fires in that both-busy-at-speed case; a busy
  // melody over a sparse accompaniment is untouched.
  const calmPool = core.filter(c=>_semis(c)===0);
  const pool = (calmMel && calmPool.length) ? calmPool
             : calm ? [...core,...core,...core, ...mid]         // gentle: mostly lilting, a touch of semiquaver colour
                    : [...core,...core, ...mid,...mid, ...busy]; // brisk: fuller, runs available as seasoning
  const nbeats = Math.max(1, Math.round(barU/1.5));   // 3/8 -> 1 beat, 6/8 -> 2 beats
  const out=[]; let busyUsed=false;
  for(let i=0;i<nbeats;i++){ let c=rnd(pool);
    if(_semis(c)>=3 && busyUsed) c=rnd(core);        // at most ONE semiquaver-run beat per bar (keeps it playable)
    if(_semis(c)>=3) busyUsed=true;
    out.push(...c); }
  return out;
}
// ---- FIGURE BANK: real LH accompaniment rest-usages mined from the ABRSM specimen books. Each figure is ONE bar
// as fillable slots: [role, d, art?] where role 'b'=bass, 'c'=chord(3rd/5th above), 'r'=rest; d in quarter-beats.
// Tagged t=metres, g=grades, f=character feels that may use it. This is a growable BANK (not a closed groove set):
// the generator draws a figure per bar that fits the piece, fills it with the harmony, and varies bar to bar. Add
// entries as more real usages are catalogued — the more entries, the freer and less formulaic, each one musical
// because it is taken from real music. NOTE: compound (6/8) beats are 3 quavers = 1.5; never split them to 0.75.
const FIGBANK = [
  // ===== 6/8 (Grade 4 only — 6/8 is introduced at G4) =====
  { t:['6/8'], g:[4], f:['lilt','crisp'], s:[['b',0.5,'-.'],['r',1],['c',0.5,'-.'],['r',1]] },        // skip: bass-rest, chord-rest
  { t:['6/8'], g:[4], f:['lilt','crisp'], s:[['b',0.5,'-.'],['r',1],['b',0.5,'-.'],['r',1]] },        // skip: bass-rest twice
  { t:['6/8'], g:[4], f:['lilt','crisp'], s:[['b',0.5,'-.'],['r',0.5],['c',0.5,'-.'],['c',1.5]] },    // bass, rest, chord, held
  { t:['6/8'], g:[4], f:['lilt','smooth'], s:[['b',1.5],['c',1.5]] },                                 // gentle lilt (held)
  { t:['6/8'], g:[4], f:['lilt','crisp'], s:[['b',1],['c',0.5,'-.'],['c',1.5]] },                     // dotted lilt into a held chord
  { t:['6/8'], g:[4], f:['lilt','smooth'], s:[['b',0.5],['c',0.5],['c',0.5],['b',0.5],['c',0.5],['c',0.5]] }, // rocking lullaby (running, no rest)
  { t:['6/8'], g:[4], f:['lilt','crisp'], s:[['b',1.5,'-.'],['c',0.5,'-.'],['r',1]] },                // bass held, chord, lift
  { t:['6/8'], g:[4], f:['crisp'],        s:[['b',0.5,'->'],['r',1],['c',0.5,'-.'],['r',1]] },        // accented skip (scherzando)
  // ===== 3/8 (Grade 3+ — 3/8 introduced at G3) =====
  { t:['3/8'], g:[3,4], f:['lilt','crisp'], s:[['b',0.5,'-.'],['r',1]] },                             // bass then lift
  { t:['3/8'], g:[3,4], f:['lilt','crisp'], s:[['b',0.5,'-.'],['c',0.5,'-.'],['r',0.5]] },            // bass, chord, lift
  { t:['3/8'], g:[3,4], f:['lilt','smooth'], s:[['b',1.5]] },                                          // held
  { t:['3/8'], g:[3,4], f:['lilt'],         s:[['b',0.5],['c',1]] },                                   // bass then held chord
  { t:['3/8'], g:[3,4], f:['lilt','crisp'], s:[['b',0.5],['c',0.5],['c',0.5]] },                      // running (no rest)
  // ===== 2/4 =====
  { t:['2/4'], g:[2,3,4], f:['crisp','lilt'], s:[['b',1,'->'],['c',1]] },                             // march tread: accented bass, chord
  { t:['2/4'], g:[2,3,4], f:['crisp','lilt'], s:[['b',1],['c',1]] },                                  // plain oom-pah
  { t:['2/4'], g:[2,3,4], f:['crisp'],        s:[['b',1],['r',1]] },                                  // bass + crotchet rest (simple bounce)
  { t:['2/4'], g:[2,3,4], f:['smooth','crisp'], s:[['c',1,'->'],['r',1]] },                           // struck chord + rest (weight)
  { t:['2/4'], g:[3,4],   f:['crisp','lilt'], s:[['b',0.5,'-.'],['r',0.5],['c',0.5,'-.'],['r',0.5]] },// bounce: bass-rest chord-rest
  { t:['2/4'], g:[3,4],   f:['crisp','lilt'], s:[['b',1],['c',0.5,'-.'],['r',0.5]] },                 // bass, chord, quaver lift
  { t:['2/4'], g:[3,4],   f:['crisp'],        s:[['b',0.5,'-.'],['r',0.5],['b',0.5,'-.'],['r',0.5]] },// bass-rest twice (light)
  { t:['2/4'], g:[3,4],   f:['crisp'],        s:[['b',1.5,'->'],['c',0.5,'-.']] },                    // dotted march (dotted-crotchet bass)
  { t:['2/4'], g:[3,4],   f:['lilt','smooth'], s:[['b',0.5],['c',0.5],['c',0.5],['c',0.5]] },         // broken/alberti-ish (running)
  // ===== 3/4 =====
  { t:['3/4'], g:[2,3,4], f:['lilt'],         s:[['b',1],['c',1],['c',1]] },                          // waltz oom-pah-pah
  { t:['3/4'], g:[2,3,4], f:['lilt'],         s:[['r',1],['c',1],['c',1]] },                          // waltz, lifted first beat
  { t:['3/4'], g:[2,3,4], f:['lilt'],         s:[['b',1],['c',1],['r',1]] },                          // waltz, lift on beat 3
  { t:['3/4'], g:[2,3,4], f:['lilt','crisp'], s:[['b',1,'-.'],['c',1,'-.'],['c',1,'-.']] },           // minuet: dignified detached
  { t:['3/4'], g:[2,3,4], f:['lilt','crisp'], s:[['b',1,'-.'],['c',1,'-.'],['r',1]] },                // minuet: detached, lift on 3
  { t:['3/4'], g:[3,4],   f:['lilt','crisp'], s:[['b',1,'-.'],['r',1],['c',1,'-.']] },                // minuet: bass, lift, chord
  { t:['3/4'], g:[2,3,4], f:['smooth','crisp'], s:[['b',1],['c',2]] },                                // bass then held chord
  { t:['3/4'], g:[2,3,4], f:['smooth','crisp'], s:[['c',1,'->'],['r',1],['c',1,'->']] },              // grand: struck chords, silence between
  { t:['3/4'], g:[2,3,4], f:['smooth'],       s:[['c',3,'->']] },                                     // grand: one weighty held chord
  { t:['3/4'], g:[3,4],   f:['lilt'],         s:[['b',1.5],['c',0.5,'-.'],['c',1]] },                 // dotted waltz lilt
  // ===== 4/4 =====
  { t:['4/4'], g:[2,3,4], f:['crisp'],        s:[['b',1,'->'],['c',1],['b',1],['c',1]] },             // march: bass chord bass chord
  { t:['4/4'], g:[2,3,4], f:['crisp'],        s:[['b',1,'->'],['c',1],['r',1],['c',1]] },             // march with a lift on 3
  { t:['4/4'], g:[2,3,4], f:['smooth','crisp'], s:[['c',1,'->'],['r',1],['c',1,'->'],['r',1]] },      // maestoso: chords split by silence
  { t:['4/4'], g:[2,3,4], f:['smooth'],       s:[['c',2,'->'],['r',2]] },                             // maestoso: weighty chord then silence
  { t:['4/4'], g:[2,3,4], f:['smooth','crisp'], s:[['b',1],['c',3]] },                                // bass then held chord
  { t:['4/4'], g:[2,3,4], f:['crisp','lilt'], s:[['b',1],['c',1],['r',1],['c',1]] },                  // oom-pah with a lift on beat 3
  { t:['4/4'], g:[3,4],   f:['crisp'],        s:[['b',0.5,'->'],['r',0.5],['c',0.5,'-.'],['r',0.5],['b',0.5,'-.'],['r',0.5],['c',0.5,'-.'],['r',0.5]] }, // crisp detached march
  { t:['4/4'], g:[3,4],   f:['lilt','smooth'], s:[['b',0.5],['c',0.5],['c',0.5],['c',0.5],['b',0.5],['c',0.5],['c',0.5],['c',0.5]] }, // alberti/broken (running)
  // ===== SYNCOPATED / off-beat cells (crisp & lilt only — an off-beat attack held across the next strong beat) =====
  { t:['2/4'], g:[3,4], f:['crisp','lilt'], s:[['b',0.5,'-.'],['c',1],['r',0.5]] },                  // bass, off-beat chord held over beat 2, lift
  { t:['2/4'], g:[3,4], f:['crisp'],        s:[['b',0.5,'-.'],['c',0.5,'->'],['c',0.5],['r',0.5]] }, // bass, accented off-beat chord, chord, lift
  { t:['3/4'], g:[3,4], f:['crisp','lilt'], s:[['b',1],['r',0.5],['c',1,'->'],['c',0.5]] },          // accented chord syncopated across beat 3
  { t:['3/4'], g:[3,4], f:['lilt'],         s:[['b',0.5],['c',1],['c',0.5],['c',1]] },               // lilting off-beat waltz
  { t:['4/4'], g:[3,4], f:['crisp','lilt'], s:[['b',1],['c',0.5,'->'],['c',1.5],['c',1]] },          // Charleston-ish: chord on the & of 1 held over beat 2
  { t:['4/4'], g:[3,4], f:['crisp'],        s:[['b',1,'->'],['r',0.5],['c',0.5,'-.'],['c',1],['c',1]] }, // off-beat entry then steady
  // ===== reviewed batch 1: dances / marches / syncopations / 6/8 lilts (grade-tagged; 6/8 is G4-only) =====
  { t:['2/4'], g:[3,4],   f:['crisp'],         s:[['b',0.5,'-.'],['c',0.5,'-.'],['b',0.5,'-.'],['c',0.5,'-.']] }, // polka bounce
  { t:['2/4'], g:[3,4],   f:['crisp'],         s:[['b',0.5,'-.'],['r',0.5],['c',0.5,'-.'],['c',0.5,'-.']] },      // galop
  { t:['2/4'], g:[4],     f:['crisp'],         s:[['r',0.5],['c',0.5,'->'],['b',1]] },                            // pushed / syncopated
  { t:['2/4'], g:[3,4],   f:['crisp','lilt'],  s:[['b',0.5],['c',0.5],['r',0.5],['c',0.5]] },                     // off-beat chords
  { t:['2/4'], g:[3,4],   f:['crisp','lilt'],  s:[['b',1.5,'->'],['c',0.5]] },                                    // habanera (dotted bass)
  { t:['3/4'], g:[2,3,4], f:['lilt','crisp'],  s:[['b',1],['c',1,'->'],['c',1]] },                               // mazurka (accent on 2)
  { t:['3/4'], g:[3,4],   f:['lilt'],          s:[['b',1],['c',0.5],['c',1],['c',0.5]] },                        // syncopated waltz
  { t:['3/4'], g:[3,4],   f:['lilt'],          s:[['b',1],['c',0.5],['c',0.5],['c',0.5],['c',0.5]] },            // broken waltz (running)
  { t:['3/4'], g:[3,4],   f:['lilt','crisp'],  s:[['b',1],['c',1],['b',0.5],['c',0.5]] },                        // waltz w/ upbeat lead-in
  { t:['3/4'], g:[2,3,4], f:['lilt','smooth'], s:[['b',1,'->'],['c',1],['c',1]] },                               // ländler (accent 1)
  { t:['4/4'], g:[2,3,4], f:['crisp'],         s:[['b',1],['c',1],['b',1],['c',1]] },                            // stride
  { t:['4/4'], g:[3,4],   f:['crisp'],         s:[['b',1],['c',1,'->'],['b',1],['c',1,'->']] },                  // backbeat (2 & 4)
  { t:['4/4'], g:[3,4],   f:['crisp','lilt'],  s:[['b',1.5],['b',0.5],['c',1],['c',1]] },                        // habanera cell
  { t:['4/4'], g:[4],     f:['crisp'],         s:[['b',1],['r',0.5],['c',1,'->'],['c',0.5],['c',1]] },           // tango (syncopated, tied mid-bar)
  { t:['4/4'], g:[2,3,4], f:['smooth','crisp'],s:[['b',2],['c',1,'->'],['c',1]] },                              // half-bar swell
  { t:['6/8'], g:[4],     f:['lilt','smooth'], s:[['b',1.5],['c',1],['c',0.5]] },                               // siciliano (dotted lilt)
  { t:['6/8'], g:[4],     f:['crisp','lilt'],  s:[['b',0.5],['c',0.5],['c',0.5],['c',0.5],['c',0.5],['c',0.5]] },// tarantella (running)
  { t:['6/8'], g:[4],     f:['lilt','smooth'], s:[['b',1],['c',0.5],['b',1],['c',0.5]] },                        // barcarolle (rocking)
  { t:['6/8'], g:[4],     f:['crisp','lilt'],  s:[['b',1.5,'->'],['c',0.5,'-.'],['r',0.5],['c',0.5,'-.']] },     // march-lilt
  // ===== batch 2: more quarter/eighth patterns (dances, marches, syncopations, rests) =====
  { t:['2/4'], g:[2,3,4], f:['crisp','lilt'],  s:[['b',1],['c',0.5],['c',0.5]] },                               // oom-pah, chord as two eighths
  { t:['2/4'], g:[3,4],   f:['crisp','lilt'],  s:[['b',0.5],['r',0.5],['c',1]] },                               // bass, lift, held chord (sync)
  { t:['2/4'], g:[3,4],   f:['crisp'],         s:[['b',0.5],['c',0.5],['b',0.5],['c',0.5]] },                   // running b-c-b-c
  { t:['2/4'], g:[3,4],   f:['crisp','lilt'],  s:[['r',0.5],['b',0.5],['c',0.5],['c',0.5]] },                   // upbeat rest-start
  { t:['2/4'], g:[3,4],   f:['crisp'],         s:[['b',0.5],['b',0.5],['c',1]] },                               // two bass eighths + chord
  { t:['2/4'], g:[4],     f:['crisp'],         s:[['c',0.5],['c',0.5],['c',0.5],['c',0.5]] },                   // agitato four chord eighths
  { t:['2/4'], g:[3,4],   f:['crisp'],         s:[['b',1],['c',0.5,'-.'],['r',0.5]] },                          // bass, staccato chord, lift
  { t:['3/4'], g:[3,4],   f:['lilt','crisp'],  s:[['b',1],['r',1],['c',1]] },                                  // bass, lift, chord
  { t:['3/4'], g:[3,4],   f:['lilt'],          s:[['r',1],['b',1],['c',1]] },                                  // rest, bass, chord
  { t:['3/4'], g:[3,4],   f:['lilt'],          s:[['b',1],['c',0.5],['c',0.5],['c',1]] },                      // oom, broken pair, chord
  { t:['3/4'], g:[3,4],   f:['lilt','crisp'],  s:[['b',0.5],['b',0.5],['c',1],['c',1]] },                      // walking bass into oom-pah
  { t:['3/4'], g:[3,4],   f:['lilt'],          s:[['b',1],['c',0.5],['r',0.5],['c',1]] },                      // waltz with a lift
  { t:['3/4'], g:[4],     f:['lilt'],          s:[['b',0.5],['c',0.5],['c',0.5],['c',0.5],['c',0.5],['c',0.5]] }, // running-eighths waltz
  { t:['3/4'], g:[2,3,4], f:['smooth','lilt'], s:[['b',2],['c',1]] },                                          // held bass then chord
  { t:['3/4'], g:[4],     f:['smooth','lilt'], s:[['b',1],['c',2,'->']] },                                     // sarabande — accent held 2-3
  { t:['4/4'], g:[2,3,4], f:['crisp','lilt'],  s:[['b',1],['c',1],['c',1],['c',1]] },                          // bass then three chords
  { t:['4/4'], g:[2,3,4], f:['smooth'],        s:[['b',2],['c',2]] },                                          // half bass, half chord
  { t:['4/4'], g:[3,4],   f:['crisp'],         s:[['b',1],['r',1],['c',1],['r',1]] },                          // bass & chord split by rests
  { t:['4/4'], g:[3,4],   f:['crisp','lilt'],  s:[['b',1],['c',0.5],['c',0.5],['c',1],['c',1]] },              // bass, chord pair, chords
  { t:['4/4'], g:[3,4],   f:['crisp'],         s:[['b',1.5],['c',0.5],['c',1],['c',1]] },                      // dotted bass then chords
  { t:['4/4'], g:[3,4],   f:['smooth','crisp'],s:[['b',1],['c',2],['r',1]] },                                  // bass, held chord 2-3, lift
  { t:['4/4'], g:[4],     f:['crisp'],         s:[['c',1.5,'->'],['c',0.5],['r',2]] },                         // charleston
  { t:['4/4'], g:[4],     f:['crisp','lilt'],  s:[['b',1],['c',0.5],['c',0.5],['c',0.5],['c',0.5],['c',1]] },  // running chord eighths mid-bar
  { t:['6/8'], g:[4],     f:['lilt','crisp'],  s:[['b',1.5],['c',0.5],['c',0.5],['c',0.5]] },                  // dotted bass + three chord eighths
  { t:['6/8'], g:[4],     f:['lilt'],          s:[['b',0.5],['c',1],['b',0.5],['c',1]] },                      // bass-chord-bass-chord lilt
  { t:['6/8'], g:[4],     f:['smooth'],        s:[['c',1.5,'->'],['c',1.5]] },                                 // grand — two struck dotted chords
  { t:['6/8'], g:[4],     f:['lilt','smooth'], s:[['b',0.5],['c',0.5],['c',0.5],['c',1.5]] },                  // bass, chord, held tail
  { t:['6/8'], g:[4],     f:['crisp'],         s:[['b',0.5,'->'],['r',1],['c',0.5,'-.'],['r',0.5]] },          // accented skip
  { t:['3/8'], g:[3,4],   f:['lilt','crisp'],  s:[['b',0.5],['r',0.5],['c',0.5]] },                            // 3/8 bass, lift, chord
  { t:['3/8'], g:[4],     f:['crisp'],         s:[['c',0.5],['c',0.5],['c',0.5]] },                            // 3/8 three chord eighths
  // ===== batch 3: richer note values — dotted-eighth-sixteenth, scotch snaps, sixteenths, dotted syncopation =====
  { t:['2/4'], g:[4], f:['crisp'],        s:[['b',0.75,'->'],['c',0.25],['c',1]] },                            // dotted-eighth-sixteenth march
  { t:['2/4'], g:[4], f:['crisp'],        s:[['b',0.25],['b',0.75,'->'],['c',1]] },                            // scotch snap bass
  { t:['2/4'], g:[4], f:['crisp','lilt'], s:[['b',0.5],['c',0.25],['c',0.25],['c',0.25],['c',0.25],['c',0.5]] },// sixteenth broken flurry
  { t:['3/4'], g:[4], f:['lilt','crisp'], s:[['b',0.75,'->'],['c',0.25],['c',1],['c',1]] },                    // dotted-eighth-sixteenth waltz
  { t:['3/4'], g:[4], f:['lilt'],         s:[['b',1],['c',0.75],['c',0.25],['c',1]] },                         // sixteenth pickup waltz
  { t:['4/4'], g:[4], f:['crisp'],        s:[['b',0.75,'->'],['c',0.25],['b',0.75],['c',0.25],['c',1],['c',1]] },// dotted-eighth-sixteenth march
  { t:['4/4'], g:[4], f:['crisp'],        s:[['b',0.25],['b',0.75,'->'],['c',1],['c',1],['c',1]] },            // snap-dotted bass then chords
  { t:['4/4'], g:[4], f:['lilt','crisp'], s:[['b',0.25],['c',0.25],['c',0.25],['c',0.25],['b',0.25],['c',0.25],['c',0.25],['c',0.25],['c',1],['c',1]] }, // sixteenth alberti half-bar
  { t:['4/4'], g:[4], f:['crisp'],        s:[['b',1.5],['c',0.5],['c',1.5],['c',0.5]] },                       // dotted syncopation (tied)
  { t:['6/8'], g:[4], f:['lilt'],         s:[['b',1],['c',0.5],['c',0.5],['c',0.5],['c',0.25],['c',0.25]] },   // dotted then sixteenths (flowing)
  { t:['6/8'], g:[4], f:['crisp','lilt'], s:[['b',0.25],['b',0.25],['c',1],['c',0.5],['c',1]] },              // snap into lilt
  { t:['3/4'], g:[3,4], f:['lilt'],       s:[['b',1.5],['c',0.5],['c',1]] },                                   // dotted-quarter-eighth lilt
  // ===== more COMPOUND cells: movement + chords so 3/8 isn't bare single notes and 6/8 isn't wall-to-wall dotted-crotchets =====
  { t:['3/8'], g:[3,4], f:['smooth','lilt'], s:[['b',0.5],['c',0.5],['c',0.5]] },                              // 3/8 running chords (gentle feels too)
  { t:['3/8'], g:[4],   f:['lilt','crisp'],  s:[['b',0.5],['c',0.5],['b',0.5]] },                              // 3/8 bass-chord-bass
  { t:['3/8'], g:[3,4], f:['crisp','lilt'],  s:[['b',0.5],['c',0.5],['c',0.5]] },                              // 3/8 running (crisp)
  { t:['6/8'], g:[4], f:['lilt','smooth'], s:[['b',0.5],['c',1],['c',0.5],['c',1]] },                          // 6/8 flowing (chords, not two dotted-crotchets)
  { t:['6/8'], g:[4], f:['crisp','lilt'], s:[['b',0.5],['c',0.5],['r',0.5],['b',0.5],['c',0.5],['r',0.5]] },   // 6/8 bounce (b-c-lift twice)
  { t:['6/8'], g:[4], f:['lilt'],         s:[['b',1],['c',0.5],['c',0.5],['c',0.5],['c',0.5]] },               // 6/8 bass then running chords
  { t:['6/8'], g:[4], f:['lilt','smooth'], s:[['b',0.5],['c',0.5],['c',0.5],['c',0.5],['c',1]] },              // 6/8 running into a held chord
  { t:['6/8'], g:[4], f:['crisp'],        s:[['b',0.5,'-.'],['c',0.5,'-.'],['c',0.5,'-.'],['b',0.5,'-.'],['c',0.5,'-.'],['c',0.5,'-.']] }, // 6/8 detached running
  // ===== TRIPLET cells (eighth-triplets; SIMPLE metres only — grade 3+) =====
  { t:['2/4'], g:[3,4], f:['lilt','crisp'],  s:[['b',1],['t3',['c','c','c']]] },                                         // bass + triplet chords
  { t:['3/4'], g:[3,4], f:['lilt'],          s:[['b',1],['t3',['c','c','c']],['t3',['c','c','c']]] },                    // triplet waltz
  { t:['3/4'], g:[4],   f:['lilt','smooth'], s:[['t3',['b','c','c']],['t3',['b','c','c']],['t3',['b','c','c']]] },       // triplet arpeggio waltz
  { t:['4/4'], g:[3,4], f:['crisp','lilt'],  s:[['b',1],['t3',['c','c','c']],['b',1],['t3',['c','c','c']]] },            // triplet oom-pah
  { t:['4/4'], g:[4],   f:['lilt','smooth'], s:[['t3',['b','c','c']],['t3',['b','c','c']],['t3',['b','c','c']],['t3',['b','c','c']]] }, // triplet arpeggio (flowing)
  // ---- grown for 6/8 (2026-08-04) ----
  { t:['6/8'], g:[4], f:['lilt','smooth'], s:[['b',1],['c',0.5],['c',1],['c',0.5]] },  // barcarolle (grown)
  { t:['6/8'], g:[4], f:['crisp','lilt'], s:[['b',0.5],['r',0.5],['c',0.5],['b',0.5],['r',0.5],['c',0.5]] },  // tarantella (grown)
  { t:['6/8'], g:[4], f:['crisp','smooth'], s:[['b',0.5],['c',0.5],['c',0.5],['r',0.5],['c',0.5],['c',0.5]] },  // gigue (grown)
  { t:['6/8'], g:[4], f:['crisp'], s:[['b',0.75],['b',0.75],['c',1.5]] },  // hornpipe (grown)
  { t:['6/8'], g:[4], f:['lilt','crisp'], s:[['b',1],['c',0.5],['r',1],['c',0.5]] },  // boat song (grown)
  { t:['6/8'], g:[4], f:['lilt','smooth'], s:[['r',0.5],['c',0.5],['c',0.5],['b',0.5],['c',0.5],['c',0.5]] },  // waltz-swing (grown)
  { t:['6/8'], g:[4], f:['smooth','lilt'], s:[['b',1.5,'-.'],['r',0.5],['c',0.5],['c',0.5]] },  // lullaby (grown)
  { t:['6/8'], g:[4], f:['crisp','lilt'], s:[['b',0.5],['c',0.5],['b',0.5],['c',0.5],['b',0.5],['c',0.5]] },  // jig (grown)
  { t:['6/8'], g:[4], f:['crisp','smooth'], s:[['b',0.25],['b',0.25],['b',0.5],['c',1],['c',1]] },  // folk-dance (grown)
  // grown LH 4/4
  { t:['4/4'], g:[3], f:['smooth'], s:[['b',1],['c',1],['c',2]] },  // bass then chord with a sustained half-note pad closing the bar (grown)
  { t:['4/4'], g:[3], f:['smooth'], s:[['b',3],['c',1]] },  // long dotted-half bass pedal answered by a single chord upbeat (grown)
  { t:['4/4'], g:[3], f:['crisp'], s:[['r',1],['b',1],['c',1],['c',1]] },  // rest on the downbeat, delayed bass entry then two chord stabs (grown)
  { t:['4/4'], g:[3], f:['lilt'], s:[['b',0.5],['c',0.5],['b',0.5],['c',0.5],['c',2]] },  // bouncing bass-chord alternation resolving into a held chord (grown)
  { t:['4/4'], g:[3], f:['smooth'], s:[['b',2],['c',0.5],['c',0.5],['c',1]] },  // half-note bass with a quick chord pair and a closing chord (grown)
  { t:['4/4'], g:[3], f:['crisp'], s:[['b',1],['r',1],['c',0.5],['c',0.5],['c',1]] },  // bass, breath rest, then syncopated chord group filling beats three and four (grown)
  { t:['4/4'], g:[3], f:['lilt'], s:[['c',1],['b',1],['c',1],['b',1]] },  // chord-first inversion of the oom-pah, bass on the offbeats (grown)
  { t:['4/4'], g:[3], f:['lilt'], s:[['b',1.5],['c',0.5],['b',1.5],['c',0.5]] },  // dotted swing with dotted bass and clipped chord answer, twice (grown)
  { t:['4/4'], g:[3], f:['smooth'], s:[['b',0.5],['c',1],['c',1],['c',0.5],['c',1]] },  // pickup bass into a flowing chain of chords across the bar (grown)
  { t:['4/4'], g:[3], f:['crisp'], s:[['b',1],['c',0.5,'->'],['r',0.5],['c',0.5,'->'],['r',0.5],['c',1]] },  // bass then accented offbeat chord jabs with rests, closing chord (grown)
  { t:['4/4'], g:[3], f:['crisp'], s:[['b',2,'->'],['c',1,'-.'],['r',0.5],['c',0.5]] },  // strong sustained bass then a staccato chord, rest, and a final short chord kick (grown)
];
// ============================ RIGHT-HAND ACCOMPANIMENT BANK (SWAP: melody in the LH) ============================
// The real conventions of how a right hand accompanies a tune BELOW it — repeated chords, afterbeats, broken/arpeggio
// figures, murmuring pedals, dotted and syncopated chordal rhythms, chord+arpeggio mixes. These are BAR figures; a
// swap piece draws a PRIMARY one and VARIES among compatible neighbours across the bars (not one pattern throughout),
// exactly as the left hand uses FIGBANK. Filled with the bar's VOICE-LED chord tones (never a bass Alberti).
// Slots: ['c',d,art?]=chord · ['r',d]=rest · ['a',d]=next arpeggio tone (low→high, cycles) · ['p',d]=top-note repeat ·
//        ['i',d]=inner (middle) tone. Grade tag g = MINIMUM grade. Grow this bank — more real figures = more diverse.
const RHBANK = [
  // ---- 4/4 ----
  { t:['4/4'], g:[3], f:['smooth'],        s:[['c',4]] },                                                              // sustained
  { t:['4/4'], g:[3], f:['smooth','lilt'], s:[['c',2],['c',2]] },                                                     // half-bar chords
  { t:['4/4'], g:[3], f:['crisp','lilt'],  s:[['c',1],['c',1],['c',1],['c',1]] },                                     // repeated chords
  { t:['4/4'], g:[3], f:['crisp'],         s:[['r',0.5],['c',0.5,'-.'],['r',0.5],['c',0.5,'-.'],['r',0.5],['c',0.5,'-.'],['r',0.5],['c',0.5,'-.']] }, // afterbeats
  { t:['4/4'], g:[3], f:['smooth','lilt'], s:[['a',0.5],['a',0.5],['a',0.5],['a',0.5],['a',0.5],['a',0.5],['a',0.5],['a',0.5]] }, // broken arpeggio
  { t:['4/4'], g:[4], f:['smooth'],        s:[['c',1],['a',0.5],['a',0.5],['c',1],['a',0.5],['a',0.5]] },              // chord + arpeggio
  { t:['4/4'], g:[3], f:['crisp','lilt'],  s:[['c',1.5],['c',0.5],['c',1.5],['c',0.5]] },                             // dotted chordal
  { t:['4/4'], g:[4], f:['lilt','crisp'],  s:[['c',1],['c',1],['c',0.5],['c',0.5],['c',1]] },                         // broken-up rhythm
  { t:['4/4'], g:[3], f:['smooth'],        s:[['p',0.5],['i',0.5],['p',0.5],['i',0.5],['p',0.5],['i',0.5],['p',0.5],['i',0.5]] }, // murmur (top/inner)
  { t:['4/4'], g:[4], f:['smooth','lilt'], s:[['c',2],['a',0.5],['a',0.5],['c',1]] },                                 // held then move
  { t:['4/4'], g:[4], f:['crisp'],         s:[['c',1,'->'],['r',1],['c',1,'->'],['r',1]] },                           // struck + lift (weighty)
  // ---- 3/4 ----
  { t:['3/4'], g:[3], f:['smooth'],        s:[['c',3]] },
  { t:['3/4'], g:[3], f:['smooth','lilt'], s:[['c',2],['c',1]] },
  { t:['3/4'], g:[3], f:['crisp','lilt'],  s:[['c',1],['c',1],['c',1]] },
  { t:['3/4'], g:[3], f:['lilt'],          s:[['r',0.5],['c',0.5,'-.'],['r',0.5],['c',0.5,'-.'],['r',0.5],['c',0.5,'-.']] }, // afterbeats
  { t:['3/4'], g:[3], f:['smooth','lilt'], s:[['a',0.5],['a',0.5],['a',0.5],['a',0.5],['a',0.5],['a',0.5]] },          // broken waltz
  { t:['3/4'], g:[4], f:['lilt','crisp'],  s:[['c',1.5],['c',0.5],['c',1]] },
  { t:['3/4'], g:[4], f:['smooth'],        s:[['c',1],['a',0.5],['a',0.5],['c',1]] },
  { t:['3/4'], g:[3], f:['crisp'],         s:[['c',1,'->'],['r',1],['c',1]] },                                        // accented + lift
  // ---- 2/4 ----
  { t:['2/4'], g:[3], f:['smooth'],        s:[['c',2]] },
  { t:['2/4'], g:[3], f:['crisp','lilt'],  s:[['c',1],['c',1]] },
  { t:['2/4'], g:[3], f:['crisp'],         s:[['r',0.5],['c',0.5,'-.'],['r',0.5],['c',0.5,'-.']] },
  { t:['2/4'], g:[3], f:['smooth','lilt'], s:[['a',0.5],['a',0.5],['a',0.5],['a',0.5]] },
  { t:['2/4'], g:[4], f:['lilt','crisp'],  s:[['c',1.5],['c',0.5]] },
  { t:['2/4'], g:[4], f:['crisp'],         s:[['c',0.5,'-.'],['r',0.5],['c',0.5,'-.'],['c',0.5,'-.']] },
  // ---- 6/8 (compound, dotted-crotchet beat) ----
  { t:['6/8'], g:[4], f:['smooth'],        s:[['c',3]] },
  { t:['6/8'], g:[4], f:['smooth','lilt'], s:[['c',1.5],['c',1.5]] },
  { t:['6/8'], g:[4], f:['smooth','lilt'], s:[['a',0.5],['a',0.5],['a',0.5],['a',0.5],['a',0.5],['a',0.5]] },          // rocking broken
  { t:['6/8'], g:[4], f:['crisp','lilt'],  s:[['c',1],['c',0.5],['c',1],['c',0.5]] },                                 // long-short
  { t:['6/8'], g:[4], f:['crisp'],         s:[['r',0.5],['c',0.5,'-.'],['c',0.5,'-.'],['r',0.5],['c',0.5,'-.'],['c',0.5,'-.']] }, // afterbeats
  { t:['6/8'], g:[4], f:['lilt'],          s:[['c',1.5],['a',0.5],['a',0.5],['a',0.5]] },
  // ---- 3/8 ----
  { t:['3/8'], g:[3], f:['smooth'],        s:[['c',1.5]] },
  { t:['3/8'], g:[3], f:['crisp','lilt'],  s:[['c',0.5,'-.'],['c',0.5,'-.'],['c',0.5,'-.']] },
  { t:['3/8'], g:[3], f:['smooth','lilt'], s:[['a',0.5],['a',0.5],['a',0.5]] },
  { t:['3/8'], g:[4], f:['crisp'],         s:[['c',1],['c',0.5]] },
];
// melodic shapes: a target box-degree (0=tonic..4=fifth) per bar -> the melody must travel, not sit
const CONTOURS={
  4:[[1,3,4,0],[4,2,3,0],[2,4,1,0],[0,3,4,0],[3,4,2,0],[4,1,3,0]],
  6:[[1,3,4,2,4,0],[2,4,1,3,4,0],[0,2,4,3,1,0],[3,1,4,2,4,0],[4,2,0,3,1,0]],
  8:[[1,3,4,2,0,2,4,0],[0,2,4,3,1,3,4,0],[2,4,1,3,0,2,4,0],[1,4,2,3,1,4,2,0],[3,1,4,2,0,3,4,0]],
};
// slur patterns as bar-ranges — deliberately varied (incl. NONE, one long, uneven, single short)
const SLURSETS={
  4:[ [], [], [[0,3]], [[0,1],[2,3]], [[0,2]], [[1,3]], [[0,1]], [[2,3]], [[0,3]] ],
  6:[ [], [], [[0,5]], [[0,2],[3,5]], [[0,3],[4,5]], [[0,1],[2,3],[4,5]], [[0,2]], [[3,5]], [[0,3]] ],
  8:[ [], [[0,3],[4,7]], [[0,7]], [[0,1],[2,3],[4,5],[6,7]], [[0,3]], [[4,7]], [[0,3],[4,5],[6,7]], [[0,1],[2,5]] ],
};
const near=(arr,p)=>arr.reduce((a,b)=>Math.abs(b-p)<Math.abs(a-p)?b:a);
// Grade 3+ leaves the five-finger position: a full scale (octave+) the melody can range over
const SCALE={maj:[0,2,4,5,7,9,11,12,14], min:[0,2,3,5,7,8,10,12,14]};
// MELODIC CONTOUR SHAPES (grown vocabulary): the target box-degree per bar. Real melodies take many shapes, not just
// an arch — a late or early climax, a central valley (high ends, low middle), a stepped/terraced ascent, a double
// arch, an arch that plateaus at the top, and gap-fill (a rise then a gradual stepwise descent). `bias` forces one
// (style idiom, e.g. a lament falls). Weighted toward the arch (the most natural) but with real diversity.
function genContour(nbars,span,bias,apexFrac){
  // apexFrac (the harmonic-climax position, 0..1) WEIGHTS the shape choice toward shapes whose apex falls near it, so
  // the melodic high point tends to coincide with the point of greatest harmonic tension - WITHOUT excluding any shape
  // (a wave or terraced contour stays possible; it is just less likely when the harmony peaks elsewhere). No narrowing.
  const _APEX={arch:0.5,archlate:0.7,archearly:0.3,wave:0.5,rise:1,fall:0,valley:0.5,terraced:0.9,double:0.75,plateau:0.5,gapfill:0.2};
  let shape;
  if(bias) shape=bias;
  else { const base=['arch','arch','archlate','archearly','wave','rise','fall','valley','terraced','double','plateau','gapfill'];
    if(apexFrac!=null){ const w=base.slice(); for(const s of Object.keys(_APEX)) if(Math.abs(_APEX[s]-apexFrac)<=0.2) w.push(s,s); shape=rnd(w); }
    else shape=rnd(base); }
  const S=span, tri=(t,peak)=> t<=peak ? (peak>1e-9?t/peak:0) : (1-t)/Math.max(1e-9,1-peak);   // triangle peaking at `peak`
  const out=[];
  for(let b=0;b<nbars;b++){ const t=nbars>1?b/(nbars-1):0; let v;
    if(shape==='arch') v=S*tri(t,0.5);
    else if(shape==='archlate') v=S*tri(t,0.7);                        // climax late
    else if(shape==='archearly') v=S*tri(t,0.3);                      // climax early, long fall
    else if(shape==='wave') v=S*(0.5-0.5*Math.cos(t*2*Math.PI));
    else if(shape==='rise') v=S*t;
    else if(shape==='fall') v=S*(1-t);
    else if(shape==='valley') v=S*Math.abs(2*t-1);                    // high at the ends, low in the middle
    else if(shape==='terraced') v=S*(Math.floor(t*3.999)/3);         // stepped ascent
    else if(shape==='double') v=S*tri((2*t)%1,0.5);                   // two arches
    else if(shape==='plateau') v=S*(t<0.3?t/0.3 : t>0.7?(1-t)/0.3 : 1); // arch that holds at the top
    else if(shape==='gapfill') v=S*(t<0.2?t/0.2 : 1-(t-0.2)/0.8);     // quick rise then a gradual stepwise descent
    else v=S*tri(t,0.5);
    out.push(Math.max(0,Math.min(S,Math.round(v)))); }
  return out;
}
// per-beat rhythm cells incl. semiquavers (Grade 3+); each cell fills exactly one beat (beat-aligned)
// simple-time beat vocabulary = the crotchet subdivisions (QDIV), weighted so the crotchet/quaver cells stay
// common and the dotted-quaver-semiquaver + semiquaver-run cells are colour. [1.5,0.5] spans two beats (handled below).
const BEATCELLS=[[1],[1],[1],[0.5,0.5],[0.5,0.5],[0.75,0.25],[0.25,0.75],[0.5,0.25,0.25],[0.25,0.5,0.25],[0.25,0.25,0.5],[0.25,0.25,0.25,0.25],[1.5,0.5]];
// CHARACTER-FLAVOURED rhythm: the character biases WHICH cells are likely — legato sings in longer
// notes, a graceful waltz lilts on dotted figures, a light march/scherzo is crisp and brisk — but each
// bar is still drawn independently from a POOL of options, so the feel is idiomatic without any bar being
// a stamped copy of another. `feel` is null for the neutral (plain) character.
const FEELCELLS = {
  smooth:[[1],[1],[1],[0.5,0.5],[1.5,0.5],[0.5,0.5]],                                    // legato: flowing, no semiquaver runs
  lilt:  [[1],[1.5,0.5],[1.5,0.5],[0.5,0.5],[0.75,0.25],[1]],                            // graceful/waltz: dotted lilt
  crisp: [[1],[0.5,0.5],[1.5,0.5],[0.75,0.25],[0.5,0.25,0.25],[0.25,0.5,0.25],[0.25,0.25,0.5],[0.5,0.5]], // light: brisk, dotted + semiquavers
};
// beat-level subdivisions weighted by feel (each fills exactly one crotchet) — the leaves of the rhythm tree
const QFEEL = {
  smooth: [[1],[1],[1],[0.5,0.5],[0.75,0.25],[0.25,0.75],[0.5,0.25,0.25],[0.25,0.25,0.5],[0.25,0.5,0.25],[0.25,0.25,0.25,0.25]], // legato: mostly held, occasional quavers
  lilt:   [[1],[1],[0.5,0.5],[0.75,0.25]],                                                      // graceful: dotted lilt
  crisp:  [[1],[0.5,0.5],[0.75,0.25],[0.5,0.25,0.25],[0.25,0.5,0.25],[0.25,0.25,0.5],[0.25,0.25,0.25,0.25],[0.25,0.75]], // brisk: dotted + semiquavers
  _def:   [[1],[1],[0.5,0.5],[0.5,0.25,0.25],[0.25,0.25,0.5]],
};
// MACRO partitions of a whole bar into note-spans (a bar divides by 2/3/4, the parts can be LONG notes). notate()
// ties any span across the 4/4 midpoint, so [1,3]/[1,2,1] come out correctly. Long notes are what let the RH breathe.
const MACRO = {
  4:{ smooth:[[4],[2,2],[2,2],[1,3],[3,1],[2,1,1],[1,1,2]],
      busy:  [[2,2],[2,1,1],[1,1,2],[1,2,1],[1,1,1,1],[1,1,1,1],[3,1],[1,3],[2,2]] },
  3:{ smooth:[[3],[2,1],[1,2],[1,1,1]],
      busy:  [[2,1],[1,2],[1,1,1],[1,1,1]] },
  2:{ smooth:[[2],[1,1],[1,1]],
      busy:  [[1,1],[1,1],[1,1]] },
};
function wideBar(barU,feel,spd,march,calmMel,minDur=0.25){
  // STYLE IDIOM (COMPOSITION-SPEC §13): a MARCH leans on the dotted long-short figure. Upweight the dotted-quaver-
  // semiquaver cell (and the plain crotchet tread) for march pieces - a bias, not a stamp, so the melody still varies.
  let qpool = march ? [...(QFEEL[feel]||QFEEL._def), [0.75,0.25],[0.75,0.25],[1]] : (QFEEL[feel] || QFEEL._def);
  // GRADE NOTE-VALUE FLOOR (single rhythm engine, gated by the parameter): grade 2 = quaver (0.5), so its
  // subdivisions drop the semiquaver cells; grades 3+ keep them. This is what lets ONE engine serve every grade.
  qpool = qpool.filter(c=>c.every(d=>d>=minDur-1e-9)); if(!qpool.length) qpool=[[1]];
  const mset = MACRO[barU] || MACRO[2];
  const macro = rnd(feel==='smooth' ? mset.smooth : mset.busy);
  // RHYTHM COMPLEXITY is a style feature tied to TEMPO (COMPOSITION-SPEC §12): at a FAST tempo, stacking several
  // semiquaver beats in a bar turns frantic and un-idiomatic (a fast 3/4 with ten semiquavers). Cap how many beats
  // in a bar may carry semiquavers - quaver movement stays completely free, so the piece is still lively - while a
  // moderate/slow tempo leaves them free (semiquavers are playable and expressive there). Mirrors compoundBar's cap.
  const semiCap = calmMel ? 0 : (spd==='fast' ? 1 : 99);   // busy accomp at speed -> melody keeps to quavers (density budget)
  const hasSemi = c => c.some(d=>d<0.5-1e-9);
  let semiUsed=0;
  const drawBeat = () => { let c=rnd(qpool);
    if(hasSemi(c) && semiUsed>=semiCap){ const plain=qpool.filter(x=>!hasSemi(x)); c = plain.length?rnd(plain):[0.5,0.5]; }
    if(hasSemi(c)) semiUsed++; return c; };
  const out=[];
  for(const span of macro){
    if(span>=2){                                         // a long note (minim / dotted minim)...
      if(feel==='smooth' || chance(0.6)) out.push(span); // ...usually kept whole (the melody breathes)
      else { let s=span; while(s>0.5+1e-9){ out.push(...drawBeat()); s-=1; } }   // ...sometimes subdivided into beats (incl. x4)
    } else out.push(...drawBeat());                       // a beat: a beat-level subdivision
  }
  // A melody of only plain crotchets arpeggiates: a chord tone lands on every beat with no off-beat slot for a
  // passing/auxiliary note, so it leaps through the triad instead of stepping. Ensure at least one beat subdivides
  // so the line can SING. (A single held long note is fine - that's a breath, not an arpeggio.)
  if(out.length>=2 && out.every(d=>Math.abs(d-1)<1e-9)){
    const subs=qpool.filter(c=>c.length>1 && (!calmMel || !c.some(d=>d<0.5-1e-9)));   // respect the density budget: no semiquaver splice when calm
    if(subs.length){ const i=Math.floor(Math.random()*out.length); out.splice(i,1,...rnd(subs)); }
  }
  return out;
}
function barRhythm(barU,wide,compound,feel,spd,march,calmMel,minDur=0.25){
  if(compound){ return compoundBar(barU,feel,calmMel); }   // composable dotted-crotchet beats (already caps semiquaver runs at 1/bar)
  // ONE rhythm engine for EVERY grade (was: grade 2 used a separate flat RHY-cell list with no long notes and no
  // anti-arpeggio guard — the "everything is a quarter note" fault). wideBar's note-value floor (minDur) is the gate.
  return wideBar(barU,feel,spd,march,calmMel,minDur);
}

function offsets(mode){ return POS[mode]; }         // semitone offsets of the box

// ---- expression helpers ----
const noteBarsOf=(seq,barU)=>{ let t=0; return seq.map(n=>{ const b=Math.floor(t/barU+1e-9); t+=n.d; return b; }); };
function pickStaccatoBar(rh,barU,nbars){           // a mid bar where the RH moves in short notes (staccato the melody; LH follows if also short)
  const rb=noteBarsOf(rh,barU), cands=[];
  for(let b=1;b<nbars-1;b++){ const inb=rh.filter((n,i)=>rb[i]===b); if(inb.length && inb.some(n=>!n.rest&&n.d<=0.5) && inb.every(n=>!n.rest&&n.d<=1.5)) cands.push(b); }  // a bar with quaver movement to staccato
  return cands.length? cands[Math.floor(Math.random()*cands.length)] : -1;
}
// a POOL of cadential figures (melody close + LH) so endings vary instead of one fixed formula
// In 3/8 the whole bar IS one beat, so "one beat then the rest of the bar" leaves a
// zero-length note. Split such a bar in half instead.
// split a span into [on-beat, rest]. When the span IS one compound beat (a dotted crotchet = 1.5), halving
// it gives 0.75 — a dotted-quaver polyrhythm against the 6/8 pulse — so use a quaver + the remaining crotchet
// (both on the quaver grid) instead. Simple-time spans are unaffected.
const barSplit = (barU, beatLen) => (barU - beatLen > 1e-9) ? [beatLen, barU - beatLen]
  : (Math.abs(barU-1.5)<1e-9 ? [0.5, 1.0] : [barU/2, barU/2]);
function cadenceFigure(barU, beatLen, compound){
  const [hd,tl]=barSplit(barU,beatLen);
  const lhPool=[ [[4,hd],[0,tl]] ];                                // V -> I, varied rhythm
  if(barU%2===0 && !compound) lhPool.push([[4,barU/2],[0,barU/2]]);
  const melPool=[ [[0,barU]],                                       // held tonic (suspension over the V)
                  [[1,hd],[0,tl]],                                  // 2 -> 1
                  [[4,hd],[0,tl]] ];                                // 5 -> 1 (falling)
  if(!compound && barU>=3){ melPool.push([[2,1],[1,1],[0,barU-2]],  // 3 -> 2 -> 1 descent
                                         [[2,hd],[0,tl]]); }        // 3 -> 1
  if(!compound) melPool.push([[1,0.5],[0,barU-0.5]]);               // quaver appoggiatura -> 1
  return { lh: rnd(lhPool), mel: rnd(melPool) };
}

function phraseRanges(nbars, stacBar, style){       // slur phrase bar-ranges, split around any staccato bar
  let bounds;
  if(style==='whole') bounds=[[0,nbars-1]];
  else if(style==='sub'){ bounds=[]; for(let b=0;b<nbars;b+=2) bounds.push([b,Math.min(b+1,nbars-1)]); }
  else { const h=Math.ceil(nbars/2); bounds=[[0,h-1],[h,nbars-1]]; }
  if(stacBar<0) return bounds;
  const out=[]; for(const [lo,hi] of bounds){ if(stacBar<lo||stacBar>hi){out.push([lo,hi]);continue;} if(stacBar>lo)out.push([lo,stacBar-1]); if(stacBar<hi)out.push([stacBar+1,hi]); }
  return out;
}

function buildCandidate(grade, opts={}){
  const gp = gradeParams(grade);   // this grade's parameters (features + limits); rules read from here, not from `grade===N`
  const isMin=chance(0.28) && (gp.keys.minor||[]).length>0;   // minor availability ← grade params (minor key list)
  const mode=isMin?'min':'maj';
  const keyset=(gp.keys[mode==='maj'?'major':'minor']||[]).map(nm=>KEYINFO[mode][nm]).filter(Boolean);   // key set ← grade params (the table governs which keys)
  const [ly,rhTonic,flat]=rnd(keyset);
  const times = gp.timeSignatures;                            // metre list ← grade params (the table governs which metres)
  const time=opts.time||rnd(times);
  const [top,bottom]=time.split('/').map(Number); const barU=(top/bottom)*4;
  const compound=(bottom===8 && top%3===0); const beatLen=compound?1.5:1; const nbeats=Math.round(barU/beatLen);
  const nbars = gp.bars[time] ?? (grade===2 ? (time==='2/4'?6:4) : 8);   // bar count ← grade params (fallback keeps any unlisted metre safe)
  const wide = !gp.range.fixedPosition;                   // out-of-position ← grade params (fixedPosition=false at G3+)
  const off = wide ? SCALE[mode] : POS[mode];
  const span = wide ? 7 : 4;                              // melody index range 0..span (octave for G3+)
  const swap = opts.swap ?? chance(0.2);                  // ~1 in 5 pieces: the LEFT hand carries the melody
  // ---- REGISTER: normalize the tonic to a CONSISTENT octave (target ~D4) so every key prints in the same band.
  // The keyset spreads tonics across an octave (C4..B4), so high-tonic keys (A/B) otherwise sit an octave higher
  // and pile onto ledger lines. Snap the tonic to the octave nearest the target; the melody then reaches ~tonic+13.
  let rhT = rhTonic; const TARGET = 62;                    // D4
  while(rhT-12 >= 54 && Math.abs((rhT-12)-TARGET) <= Math.abs(rhT-TARGET)) rhT -= 12;
  while(rhT+12 <= 69 && Math.abs((rhT+12)-TARGET) <  Math.abs(rhT-TARGET)) rhT += 12;
  const lhTonic=rhT-12;
  // HAND SEPARATION. The close (1-octave) spread packs the melody right on top of the accompaniment, so the LH
  // "pah" can never open past a cramped close 3rd (the melody sits exactly where a wider voicing would go). Most
  // non-swap pieces therefore take a WIDE 2-octave spread (Matthew's slot-28): melody in a comfortable treble
  // register, accompaniment ~2 octaves below, leaving room for the LH to open into 6ths/4ths. We KEEP ~1 in 3
  // at the close spread (a low-centred tune with correct close-3rd voicing) so the low register stays a live
  // option, not cut off. Swap pieces keep the original mapping (their melody is the LH).
  const snapNear = (m,t,lo)=>{ let p=m; while(p-12>=lo && Math.abs((p-12)-t)<=Math.abs(p-t)) p-=12;
                               while(Math.abs((p+12)-t)<Math.abs(p-t)) p+=12; return p; };
  let melReg, accReg;
  // Grade 2: BOTH hands must sit near their clef (max ~one ledger line). The treble hand centres in the treble
  // staff, the bass hand on the bass staff. accReg+24 (2-octave gap) sat the LH below the bass staff, and the close
  // spread + swap melody climbed above middle C — both fixed by pinning each hand to a consistent clef register.
  if(swap){
    melReg = snapNear(rhTonic-12, 47, 43);                 // SWAP: melody in the LH (bass clef) — bass-staff register ~B2..C3
    accReg = rhT;                                          // accompaniment in the RH (treble)
  } else {
    melReg = rhT;                                          // melody in the RH (treble), peak capped by winLo below
    accReg = snapNear(rhTonic, 45, 43);                    // accompaniment in the LH — consistent bass-staff register
  }
  // ---- HARMONY as a PERIOD: half cadence (V) at the midpoint, perfect cadence (V->I) at the close ----
  // CHARACTER is chosen BEFORE the harmony so the CADENCE choice can be REASONED from it (Matthew), not a die.
  // Everything else the character drives is still set up later from this same object.
  const charPool = CHARACTERS.filter(c=>c.metres.includes(time));
  const character = charPool.length ? rnd(charPool) : CHARACTERS[0];
  const half = Math.ceil(nbars/2);
  const restate = nbars>=6 && chance(0.55);   // sometimes a PARALLEL period (restate), sometimes a CONTRASTING one
  const cad = cadenceFigure(barU, beatLen, compound);   // this piece's cadence, drawn from the pool
  // the MIDPOINT is pooled, not fixed: half cadence (V) / imperfect cadence (I) / continuous (no midpoint stop)
  // Interrupted (deceptive) cadence, available when the grade lists it AND vi/VI is voiceable: the antecedent's V
  // resolves deceptively to vi across the midpoint, evading the tonic and driving the consequent onward to a real PAC.
  const _interruptOK = ((gp.harmony && gp.harmony.cadences) || []).includes('interrupted') && wide;   // wide => the vi/VI-bearing chord set is active (grade 3+); interrupted listed from grade 4
  // MIDPOINT cadence READS the character: a smooth/lilting line flows through the midpoint (more 'continuous', gentler
  // stops); a crisp/detached character makes a clear phrase stop (HC/IAC, rarely flowing on). The interrupted cadence,
  // where available, is the dramatic evasion. So WHICH midpoint cadence appears is a reasoned consequence of the character.
  const _flowing = character.feel==='smooth' || character.feel==='lilt';
  let midType = rnd(_flowing ? (_interruptOK ? ['HC','HC','IAC','continuous','continuous','DC'] : ['HC','HC','IAC','continuous','continuous'])
                             : (_interruptOK ? ['HC','HC','HC','IAC','DC'] : ['HC','HC','HC','IAC']));
  // A PARALLEL period (the consequent restates the opening idea) sets the ear up to hear the antecedent as a
  // question the restate answers — so its midpoint MUST cadence. A 'continuous' midpoint under a restate drifts
  // tonic-to-tonic and the repeat then feels unmotivated (Matthew: bar 4 was I approached from a rootless bar, so
  // it didn't read as a cadence even though the idea came back). Force a real cadence there, biased to the
  // textbook half cadence (antecedent ends open on V; the consequent then answers with the closing perfect cadence).
  if(restate) midType = chance(0.8) ? 'HC' : 'IAC';
  const CHm = wide ? {...CH[mode], ...CH_EXTRA[mode]} : CH[mode];   // richer chord set for Grade 3+
  const Tn = mode==='maj' ? {I:'I',V:'V'} : {I:'i',V:'v'};
  // inner bars MOVE through non-tonic harmony (no clumps of I) — the tonic frames the piece, it doesn't fill it
  const moves = mode==='maj' ? (wide?['ii','iii','IV','V','vi']:['ii','iii','IV','V']) : (wide?['iv','v','III','VI']:['III','iv','v']);
  // FUNCTIONAL GRAMMAR (Grade 3+): at each chord, choose from its idiomatic SUCCESSORS, weighted (a repeat
  // in the list = a heavier weight). Tonic frames, pre-dominant (ii/IV) leads to dominant (V), dominant
  // resolves to I or deceptively to vi. This is what breaks the "I-IV-V root triad in every bar" formula:
  // the CHOICE at each node varies piece to piece, but every move stays functional. Weighted AWAY from a
  // bare I->IV->V spine (I favours vi/ii; IV often goes to ii, not straight to V).
  const GRAMMAR = mode==='maj' ? {
    I:  ['vi','vi','IV','ii','V','V'],   // iii removed as a DIRECT tonic-successor (functionally weak there); it still appears in its idiomatic context via vi->iii below
    ii: ['V','V','vi'],
    iii:['vi','IV','ii'],
    IV: ['ii','V','I','ii'],
    V:  ['I','vi','I'],
    vi: ['ii','IV','iii','V'],
  } : {
    i:  ['VI','VI','iv','III','v'],
    iv: ['v','v','III'],
    III:['VI','iv','v'],
    v:  ['i','VI','i'],
    VI: ['iv','III','v'],
  };
  // Choose the next chord for a REASON, not a flat die. Among the idiomatic successors (GRAMMAR list, whose
  // repeats already weight the idiomatic ones), prefer (a) that idiomatic weight, (b) strong functional ROOT
  // MOTION (a descending fifth is the strongest tonal pull; a descending third or ascending step is smooth),
  // and (c) a transition NOT already used in this piece (so the progression varies within the piece). Freedom
  // survives: when several successors score equally well they are all valid, and we choose among THOSE.
  const ROOTDEG = {I:0,i:0,ii:1,'ii°':1,iii:2,III:2,IV:3,iv:3,V:4,v:4,vi:5,VI:5,vii:6,VII:6};
  const rootMotion = (a,c) => { const d=((ROOTDEG[c]-ROOTDEG[a])%7+7)%7; return d===3?3 : d===5?2 : d===1?1 : 0; }; // desc-5th / desc-3rd / asc-step
  const usedMoves = new Set();
  const moveChord = prev => {
    let opts = GRAMMAR[prev] ? GRAMMAR[prev] : moves;   // universal functional grammar at ALL grades (was gated to grade 3+)
    // H1 (all grades): the dominant RESOLVES — to I, or deceptively to the submediant — and never retrogresses to a
    // predominant. The wide GRAMMAR already encodes this; this makes it hold for the flat grade-2 `moves` list too.
    if(prev===Tn.V){ const res=[Tn.I, mode==='maj'?'vi':'VI'].filter(c=>CHm[c]); if(res.length) opts=res; }
    const cand = [...new Set(opts)].filter(c=>c!==prev && CHm[c]);   // GRADE FILTER: only chords voiceable at this grade (grade 2 = five-finger set), so one grammar serves every grade
    if(!cand.length) return prev;
    const weight = c => opts.filter(x=>x===c).length;               // idiomatic weight from the GRAMMAR list
    const score  = c => weight(c) + rootMotion(prev,c)*0.5 - (usedMoves.has(prev+'>'+c)?2:0);
    const best   = Math.max(...cand.map(score));
    const top    = cand.filter(c=>score(c)>=best-1e-9);             // equally-good functional options: real freedom among them
    const pick   = rnd(top);
    usedMoves.add(prev+'>'+pick);
    return pick;
  };
  // FINAL CADENCE, deliberately chosen (Matthew: perfect + plagal endings are the two to use): the
  // penultimate bar is set to the dominant (V-I perfect) or, sometimes, the subdominant (IV-I plagal),
  // rather than whatever chord incidentally preceded the tonic.
  // FINAL cadence READS the character: the plagal 'amen' close belongs to a gentle, legato character (hymn/pastoral);
  // a crisp march or scherzo never gets a bare IV-I. Otherwise the perfect authentic cadence is the structural default.
  const finalCad = (character.feel==='smooth' && character.artic==='legato' && chance(0.4)) ? 'plagal' : 'perfect';
  const plagalCh = mode==='maj'?'IV':'iv';
  const preTonic = (finalCad==='plagal' && CHm[plagalCh]) ? plagalCh : Tn.V;
  const prog=[];
  for(let b=0;b<nbars;b++){
    if(b===0) prog.push(Tn.I);
    else if(restate && b===half) prog.push(Tn.I);                    // consequent restates over the tonic
    else if(midType==='DC' && b===half) prog.push(mode==='maj'?'vi':'VI');   // interrupted cadence: the V deceptively resolves to vi
    else if(b===half-1) prog.push((midType==='HC'||midType==='DC')?Tn.V : midType==='IAC'?Tn.I : moveChord(prog[b-1]));
    else if(b===half-2 && b>=1 && midType!=='continuous'){          // APPROACH the midpoint cadence so it's a real one,
      if(midType==='IAC') prog.push(Tn.V);                          //   IAC: the dominant into the tonic (a true V-I),
      else { const pd=(mode==='maj'?['ii','IV']:['iv']).filter(c=>CHm[c]&&c!==prog[b-1]);   //   HC: a pre-dominant into V
        prog.push(pd.length?rnd(pd):moveChord(prog[b-1])); }        //   (never a rootless drift into the half cadence)
    }
    else if(b===nbars-1) prog.push(Tn.I);                            // final bar = the cadence figure
    else if(b===nbars-2 && b>half) prog.push(preTonic);             // penultimate = the cadential pre-tonic
    // HARMONIC RHYTHM is a REGULAR property of the character, not a per-bar coin: a crisp/martial piece changes chords
    // more slowly (holds every 2nd interior bar), a flowing one changes almost every bar (holds rarely). The hold stays
    // POSSIBLE for every character (no narrowing) but falls on a character-set PERIOD - a real, legible harmonic rhythm.
    else if(wide && b>1 && b<nbars-2 && prog[b-1]!==Tn.I && prog[b-1]!==Tn.V && (b % (character.feel==='crisp'?2:character.feel==='smooth'?4:3) === 0))
      prog.push(prog[b-1]);                                          // HOLD: same chord two bars, on the character's harmonic-rhythm period
    else prog.push(moveChord(prog[b-1]));                            // genuinely moving inner harmony
  }
  // HARMONIC RHYTHM varies: besides the holds above (a chord held across two bars), some inner bars SPLIT
  // — a second chord enters in the latter part of the bar, most often approaching a cadence. The split
  // chord is usually the NEXT downbeat's chord arriving early (so it is guaranteed functional) or a passing
  // successor. The melody RE-ANCHORS to a chord tone of the new chord at the split point (threaded into the
  // melody loop below), so a mid-bar change never clashes. This is what makes the chords "change in
  // different places" instead of exactly once per downbeat.
  const prog2 = new Array(nbars).fill(null);
  const changePos = new Array(nbars).fill(0);
  const nbeatsBar = Math.round(barU/beatLen);
  let secDom=false;
  if(grade===4 && nbeatsBar>=2){                                    // mid-bar change is a G4 richness
    for(let b=1;b<nbars-1;b++){
      if(b===half || b===half-1) continue;                          // keep the mid-cadence downbeats clean
      // SECONDARY DOMINANT (major, non-swap, ONCE per piece — the single chromatic-harmony moment G4 allows):
      // if the NEXT bar is the dominant, tonicise it — the latter part of THIS bar becomes V/V (e.g. D-F#-A in
      // C), resolving to V on the downbeat. The raised 4th lives ONLY in the LH; the melody anchors to V/V's
      // diatonic tones. NOT in SWAP pieces: there the accompaniment sits on TOP, so its moving chromatic line
      // grabs the ear over a quieter (often common-tone) low melody, inverting the roles (Matthew's catch).
      // the secondary dominant is a chromatic COLOUR - a richer harmonic language a composer reaches for in an expressive
      // (smooth/legato) character, not a die. Still once per piece, major, non-swap, only where a bar precedes the V, so
      // it stays an occasional special moment; a crisp/plain character keeps the diatonic approach.
      if(mode==='maj' && !swap && !secDom && prog[b+1]===Tn.V && (character.feel==='smooth' || character.artic==='legato')){
        prog2[b]='V/V'; secDom=true;
        changePos[b] = compound ? beatLen*Math.round(nbeatsBar*2/3) : beatLen*Math.floor(nbeatsBar/2);
        continue;
      }
      const preCad = (b===nbars-2);
      if(!chance(preCad?0.55:0.20)) continue;
      // the second chord ANTICIPATES the next bar's chord when it differs (the split leads straight into the coming
      // harmony - the functional reason), and only takes a passing successor when the next bar repeats this chord (then
      // there is nothing to anticipate, so a passing chord adds the motion). Reasoned from the harmony, not a die.
      let two = (b+1<nbars && prog[b+1]!==prog[b]) ? prog[b+1] : moveChord(prog[b]);
      if(!two || two===prog[b] || !CHm[two]) continue;
      // MINOR: only split to chords with NO subtonic/leading-tone member (iv, VI, i) — never the dominant
      // or III (relative major). That sidesteps the harmonic-minor raised-7th interaction entirely, so a
      // minor split needs no special leading-tone spelling and can't cross-relate against the melody.
      if(mode==='min' && !['iv','VI','i'].includes(two)) continue;
      prog2[b]=two;
      changePos[b] = compound ? beatLen*Math.round(nbeatsBar*2/3) : beatLen*Math.floor(nbeatsBar/2);
    }
  }
  // SECONDARY DOMINANT -> confirm the return to the home key. A V/V raises the 4th degree; unless the NATURAL
  // 4th is heard again, the ear can keep leaning toward the tonicised key. So when a V/V is present, close on a
  // cadence whose MELODY states the natural 4th (the 7th of V) and resolves it down to the 3rd/tonic over V->I
  // — the plain version of the altered note, sounded at the close, plants us firmly back home. (Matthew's rule:
  // whenever there is a secondary dominant, cancel the alteration to reconfirm the key.)
  if(secDom){
    const [chd,ctl]=barSplit(barU,beatLen);
    cad.lh = [[4,chd],[0,ctl]];                                   // V (short) -> I, so the natural-4th melody lands right
    cad.mel = compound ? [[3,chd],[0,ctl]]                        // ^4 -> ^1  (no compound-beat subdivision)
            : barU>=3   ? [[3,1],[2,1],[0,barU-2]]                // ^4 -> ^3 -> ^1
            :             [[3,1],[2,0.5],[0,0.5]];                // 2/4: ^4 -> ^3 -> ^1
  }

  // GRADE-2 WITHIN-BAR HARMONY. A within-bar harmonic change is a NATURAL musical event that the grade-2 parameters do
  // not forbid, so it must not be cut off as a possibility (it was, by the grade===4 gate on the split loop above). The
  // REASON it appears here is not a probability knob: a PERFECT AUTHENTIC CADENCE is normatively approached by a
  // predominant (ii/IV -> V -> I), and in a self-contained 4-bar phrase - which has no free interior bar, every bar being
  // the tonic opening, a mid-cadence, or the final - that predominant naturally shares the pre-cadence bar with the
  // dominant. So it happens exactly when the piece ENDS in a perfect cadence, and does NOT when the ending is plagal
  // (already IV->I, no dominant to prepare) or when the consequent is a restatement (its melody was written over the
  // tonic and is copied, not re-anchored). Those are real musical reasons, not a die - the variety across the book falls
  // out of the mix of cadence types and structures, not out of a random gate. IV vs ii is decided by voice-leading below.
  if(grade===2 && !restate && finalCad==='perfect' && nbeatsBar>=2 && nbars>=4){
    const b = nbars-2;                                              // the bar that approaches the final cadence
    const alreadyPrepared = ['ii','IV','iv'].includes(prog[b-1]);   // a predominant already sits before the dominant (its own bar) - preparing it once is enough
    if(b>=1 && b!==half-1 && CHm[Tn.V] && !alreadyPrepared){
      const PD = (mode==='maj'?['IV','ii']:['iv']).filter(c=>CHm[c] && c!==prog[b-1] && c!==Tn.V);
      if(PD.length){
        // WHICH predominant: ii and IV are both valid predominants of the dominant, functionally interchangeable here, so
        // the deciding reason is VOICE-LEADING - never a coin-flip. Choose the one that makes the smoothest line: the
        // least bass motion across [prev chord -> predominant -> dominant] and the most tones held in common with the
        // dominant it prepares. When two options genuinely tie in function, the voice-led one is always the better one,
        // so there is still a reason. (Minor has only iv, so no choice arises.)
        const bassOf = ch => accReg + off[CHm[ch].b];
        const vTones = new Set(CHm[Tn.V].t);
        const pB = bassOf(prog[b-1]), vB = bassOf(Tn.V);
        const vlScore = c => { const cb=bassOf(c);
          const bassMotion = Math.abs(cb-pB) + Math.abs(vB-cb);           // a smoother bass line = smaller
          const shared = [...new Set(CHm[c].t)].filter(t=>vTones.has(t)).length;   // common tones with V = smoother inner voices
          return shared*0.5 - bassMotion*0.25; };
        prog[b]  = PD.reduce((bp,c)=> vlScore(c)>vlScore(bp) ? c : bp);   // downbeat = the predominant that voice-leads best
        prog2[b] = Tn.V;                                           // second half of the bar = the dominant it prepares
        changePos[b] = compound ? beatLen*Math.round(nbeatsBar*2/3) : beatLen*Math.floor(nbeatsBar/2);
      }
    }
  }

  // accompaniment texture. when the melody is in the LH, the other hand plays chords above it.
  // ALL of these stay possible at Grade 3 (held/sustained notes included) — we don't rule any out.
  // The fix is elsewhere: voice real triads so chords like V can't collapse to a doubled root,
  // and ADD richer figures (Alberti, fuller chords) so the range of accompaniments is wider.
  // ---- CHARACTER (chosen UP FRONT): the tempo/title IS the character. It drives dynamics + articulation
  // (expression engine below) AND, here, the LH's idiomatic figure pool. Picking it first is what stops
  // texture and rhythm from defaulting to one generic figure. ----
  // Pick the CHARACTER whose fabric fits this metre, then draw its marking, feel, LH groove pool, articulation
  // and device biases from it (taxonomy above). The character carries the rests (in its groove) and keeps the
  // two hands coherent. A POOL of grooves, varied per bar below (TPAL), so two same-character pieces differ.
  // (character + charPool chosen earlier, before the harmony, so the cadence choice could read from it)
  // STYLE IDIOM (COMPOSITION-SPEC §13): the overtly-sad marks (Sadly/Mesto/Lament) belong to a MINOR key - a
  // "Mesto" in a bright major reads wrong. In major, drop them from the mark pool (the character keeps its other,
  // non-sad marks). Minor keeps the full pool. Never empties the pool.
  const SADMARK=/sadly|mesto|lament|dolente|piangevole|elegy|elegia|wistful/i;
  const HAPPYMARK=/happily|cheerfully|merrily|brightly/i;   // overtly bright words read wrong in a MINOR key (the mirror of SADMARK in major)
  const markPool = character.marks.filter(m => mode==='maj' ? !SADMARK.test(m) : !HAPPYMARK.test(m));
  const tempo = pickMark(markPool.length ? markPool : character.marks, grade);
  // TEMPO-AWARE DENSITY: the character's coarse feel isn't enough - one character spans slow to fast marks (e.g.
  // 'grand' holds Maestoso AND Con brio), so density was mismatched (a Con brio came out sparse/static). Classify
  // the ACTUAL mark's speed and let it drive note density + accompaniment activity: a fast mark is busy/active, a
  // slow one sparse/held. Order matters (slow, then moderate, then fast) so 'Allegro moderato'/'Allegretto' read as
  // moderate while 'Allegro' reads as fast.
  const spd = (m=>{ m=(m||'').toLowerCase();
    if(/adagio|lento|larg|grave|maestoso|lullaby|sadly|mesto|wistful|slowly|sostenuto|tranquillo|cantabile|espress|expressively|tenderly|gently|calmly|peacefully|sweetly|smoothly|broadly|dolce/.test(m)) return 'slow';
    if(/moderato|andant|allegretto|grazioso|gracefully|delicately|comodo|minuet|valse|waltz|con moto|with movement|flowing|steadily/.test(m)) return 'mod';
    if(/vivace|presto|allegro|brio|risoluto|giocoso|scherz|jauntily|marcia|march|fanfare|boldly|proudly|ritmic|lively|brightly|cheerfully|merrily|energetically|leggiero|dancing|playful|vivo/.test(m)) return 'fast';
    return 'mod'; })(tempo);
  const march = /march|marcia|marziale/i.test(tempo);   // style idiom flag: dotted long-short melodic tread
  const prof = character.artic==='legato' ? 'legato' : character.feel==='crisp' ? 'light' : character.feel==='lilt' ? 'graceful' : 'plain';
  // ---- REST FABRIC: the committed rhythmic INTENT (the "what does this sentiment call for" layer that sits
  // ABOVE the note-by-note grid, so a rest can never appear out of character). Derived PARAMETRICALLY from the
  // character's own fields (never a named groove): `restIntent` = how much silence the sentiment wants, and
  // `restMoves` = the SET of rest FUNCTIONS it opens. The realisation pass (after both hands exist) may only use
  // these functions, and only where the phrase/harmony plan calls for them — exactly like the harmony grammar
  // exposes only functional chord successors. A lyrical piece opens only `breath`; a scherzo opens `offbeat`; a
  // march opens `lift`; a dance opens `displace`. Antecedent vs consequent can differ (contrast), realised below.
  const restMoves = new Set();
  if(character.artic!=='detached' || character.melBreath>=0.25) restMoves.add('breath');    // a phrase-boundary breath
  if(character.stac>=0.5 && character.detach>=0.45) restMoves.add('offbeat');               // pointillist gaps (needs a detached LH)
  if(character.accent>=0.55) restMoves.add('lift');                                         // weighty silence, both hands lift together
  if(character.detach>=0.4 && (character.feel==='lilt'||character.feel==='crisp') && character.accent<0.55) restMoves.add('displace'); // syncopation over a steady tread
  const restIntent = Math.min(0.85, 0.4*character.melBreath + 0.35*character.detach + 0.25*character.stac);
  const three = (top===3);
  // G2 (five-finger box) keeps its simpler texture set for now; Grade 3+ uses the character's base texture pool.
  const texPool = !wide ? ['broken','bassline','rootfifth','broken','sustained'] : character.tex.slice();
  // FIGURE BANK: the real rest-usages that fit this piece (metre + grade + feel), and a PRIMARY one it mostly
  // uses. `detach` = how strongly this character reaches for the bank (0 for legato -> ordinary textures only).
  // TRIPLETS are a grade-6 syllabus feature (ABRSM), so exclude t3 (eighth-triplet) figures unless the grade's
  // params allow triplets — the FIGBANK grade tags predate the table and put them at grade 3-4.
  const tripletOK = gp.noteValues.triplets;
  const figCands = FIGBANK.filter(f=>f.t.includes(time)&&grade>=Math.min(...f.g)&&f.f.includes(character.feel)
                          && (tripletOK || !f.s.some(slot=>slot[0]==='t3'))
                          && f.s.every(slot=>slot[0]==='r' || slot[1]>=gp.noteValues.min-1e-9));   // ONE figure bank for every grade (was gated to grade 3+ despite 26 grade-2 figures existing); note-floor gate keeps grade-2 figures quaver-clean. CUMULATIVE: a cell's grade tag is its MINIMUM.
  const primaryFig = figCands.length ? rnd(figCands) : null;
  const useFig = figCands.length>0 && (compound ? chance(0.5) : (character.detach>0 && chance(Math.min(0.72, 0.25+character.detach))));  // figures common in compound, but broken/Alberti now flow there too, so not forced. ENABLED for swap too (Matthew): a RH accompaniment over a LH melody deserves the same rhythmic figures — accReg is the treble register for swap, so figures voice above the tune.
  // in COMPOUND metre the beat is a dotted crotchet, so held/oom-pah/bassline textures collapse to static dotted
  // crotchets — the primary must be one that FLOWS (figure / broken / Alberti). Static textures still appear, but
  // only as occasional per-bar variety (below), not as the base. Simple metres keep the full character pool.
  // STYLE IDIOM (COMPOSITION-SPEC §13): a LULLABY / barcarolle rocks - the LH sways low-high-(back) in a gentle 6/8
  // cradle. Force the broken texture (so it arpeggiates, not blocks) with a rocking shape (bass up to the top, settle
  // back), rather than leaving it to chance between broken/alberti.
  const lullaby = compound && /lullaby|lilting|berceuse|cradle|rocking|barcarol/i.test(tempo);
  // SWAP (melody in the LH): the RH is the ACCOMPANIMENT and must be voice-led CHORDS, not a bass-oriented figure.
  // An oom-pah 'fig' (or rootfifth) puts the harmony's ROOT as a single note in the treble, and that root line jumps
  // around over the tune — Matthew's "random quick notes over the top". Chordal/arpeggiated textures voice-lead
  // smoothly and stay out of the bass role. (This reverses the earlier "figures in swap too" choice, which caused it.)
  // texture: NOTE - texture affects VALIDITY, so making it deterministic-per-generate-call (pickLeastUsed) starves the
  // best-of of clean non-fig options and skews to 'fig'. Texture diversity must be done at the gen-batch level (bias the
  // reject-and-reroll toward the least-used texture) NOT here. Left as the free/character choice for now. [TODO texture-diversity]
  const texture = swap ? rnd(['block','sustained','broken','alberti','broken'])
    : (lullaby ? 'broken' : (useFig ? 'fig' : (compound ? rnd(['broken','alberti']) : rnd(texPool))));
  // DENSITY BUDGET (slot-11 rule): is the accompaniment a busy RUNNING figure (continuous short notes, no rests)?
  // If so at a FAST tempo, the melody must stay simple — calmMel makes it keep to quavers so the two hands aren't
  // both scrambling at speed. A busy melody over a SPARSE accompaniment stays fully available (calmMel stays false).
  const busyAcc = texture==='alberti' || texture==='broken' || texture==='bassline'
    || (texture==='fig' && primaryFig && Array.isArray(primaryFig.s) && !primaryFig.s.some(c=>c[0]==='r') && primaryFig.s.every(c=>c[1]<=0.5+1e-9));
  // HANDS AWARE OF EACH OTHER (Matthew's #5): a DETACHED/gapped accompaniment (rests in its figure) at the quaver
  // level. If the melody is also going to be pointillist/detached over it, keep the melody at the SAME granularity
  // (quavers, no semiquavers) so the two hands' detachment LOCKS together instead of clashing (RH semiquaver-gaps
  // over LH quaver-staccato was the fault). A flowing melody over it is fine; a finer-grained fragmented one is not.
  const detachedAcc = texture==='fig' && primaryFig && Array.isArray(primaryFig.s) && primaryFig.s.some(c=>c[0]==='r');
  const calmMel = (spd==='fast' && busyAcc)
    || (detachedAcc && (restMoves.has('offbeat') || restMoves.has('displace')));
  // broken-chord figures, incl. Alberti (root-top-middle-top) and its inversion, for real movement
  const brokenShape = lullaby ? rnd([[0,2,1],[0,1,2,1],[0,2,1,2]])   // rocking cradle shapes (bass -> high -> settle)
    : rnd([[0,1,2],[0,2,1],[0,2,1,2],[0,1,2,1],[2,1,0,1]]);
  // SWAP (melody in the LH) — the RH accompaniment is CHORDAL and voice-led, NOT a bass Alberti (that is a left-hand
  // idiom). Its own rhythm vocabulary: sustained (held), on-the-beat repeated chords, or off-beat "afterbeat" chords.
  // Voice-leading (prevSwapTop) keeps successive chords in the nearest position instead of jumping to root position.
  let prevSwapTop = null;
  // SWAP: the RH draws from the RIGHT-HAND ACCOMPANIMENT BANK (RHBANK) — a primary figure plus compatible neighbours,
  // varying across the bars and filled with voice-led chords. Real vocabulary, not one whole-bar pattern throughout.
  const rhFigCands = swap ? RHBANK.filter(f=>f.t.includes(time) && f.f.includes(character.feel) && grade>=Math.min(...f.g)) : [];
  const primaryRHFig = rhFigCands.length ? rnd(rhFigCands) : null;

  // ---- MELODY: a PARALLEL PERIOD in a five-finger position that may sit on ANY degree of the key ----
  const KS = KEYSCALE[mode];
  // Grade 2 hand position: tonic / sub-dominant / dominant. CAP the choice so the window TOP stays on the staff
  // (<= A5, at most one ledger line) — a high-tonic key + dominant position otherwise piled the tune onto ledgers.
  const melCeil = swap ? 60 : 81;                    // bass-clef swap melody stays <= middle C; treble melody <= A5
  const winLo = wide ? 0 : (()=>{ const c=[0,0,0,3,4].filter(w=>melReg+KS[w+4]<=melCeil); return rnd(c.length?c:[0]); })();
  const W = wide ? span : 4;                         // top window index
  const mnote = i => melReg + (wide ? off[clamp(i,span)] : KS[winLo+clamp(i,4)]);   // window index -> pitch
  const wIdx = dg => { dg=((dg%7)+7)%7; for(let i=0;i<=4;i++) if((winLo+i)%7===dg) return i; return 0; }; // tonic-relative degree -> window index
  const cadW = i => wide ? i : wIdx(i);              // map a cadence figure's degree into this window
  const ctones = c => { if(c==='V/V') return [1,5].concat([1,5].map(x=>x+7).filter(x=>x<=span));  // V/V melody anchors: supertonic + its 5th (diatonic; the raised 4th stays in the LH)
    if(wide) return [...CHm[c].t, ...CHm[c].t.map(x=>x+7).filter(x=>x<=span)];
    const degs=CHORD_DEG[mode][c]||CHm[c].t; const out=[]; for(let i=0;i<=4;i++) if(degs.includes((winLo+i)%7)) out.push(i); return out.length?out:[0]; };
  // STYLE IDIOM (COMPOSITION-SPEC §13): a LAMENT sinks - a falling melodic contour, not a bright arch. Bias only the
  // overtly sad marks (not every gentle/slow one), so a Lullaby or Tenderly keeps its own varied shape.
  const contourBias = /sadly|mesto|lament|dolente|piangevole|elegy|elegia/i.test(tempo) ? 'fall' : null;
  // Harmonic-climax position (0..1): the inner bar of greatest harmonic tension. Passed to genContour so the melodic
  // APEX tends to coincide with it (the climax is one event: melody-height and harmonic-tension peak together).
  const _HT={I:0,i:0,vi:0.6,VI:0.6,iii:0.6,III:0.6,IV:1,iv:1,ii:1.2,V:2,v:1.6,'V/V':2.4,vii:2,VII:2,'vii°':2};
  let _tp=0; for(let b=1;b<nbars-1;b++) if((_HT[prog[b]]??1)>(_HT[prog[_tp]]??1)) _tp=b;
  const _apexFrac = nbars>1 ? _tp/(nbars-1) : 0.5;
  const contour = genContour(nbars,span,contourBias,_apexFrac);   // ONE contour generator; apex weighted toward the harmonic climax without excluding any shape
  const strong = prog.map((c,b)=> near(ctones(c), contour[b]));
  const degOf = m => wide ? off.indexOf(m-melReg) : (KS.indexOf(m-melReg)-winLo);
  const stepTo=(from,to,ct)=>{ const dir=Math.sign(to-from)||(Math.sign(Math.round(W/2)-from)||1); let idx=clamp(from+dir*(chance(.75)?1:2),W); if(chance(.35))idx=near(ct,idx); if(idx===from)idx=clamp(from+(Math.sign(to-from)||1),W); return idx; };   // dir toward target; already there -> toward register centre (no die). TODO melody-fill batch: step-size (1 vs 2 = distance to target) and snap-to-chord-tone must be reasoned, not chance
  const rh=[]; let prev=strong[0], prevLeap=0, suspend=null, lineDir=0;   // lineDir = the melodic direction INTO the barline, so the next downbeat is a consequence of the line, not arbitrary
  // pick the next melody note:
  //  - beat 1 = the harmonic anchor (a chord tone), UNLESS we hold the previous note as a
  //    SUSPENSION: it's a step above a chord tone of the new harmony, so it's a prepared dissonance
  //    that then resolves DOWN by step (what gives a melody expressive tension against the LH).
  //  - after a LEAP, resolve by a step the opposite way (so the line sounds intentional).
  //  - otherwise step toward the target.
  // anchor / chordSym default to the bar's downbeat harmony; at a MID-BAR chord change they are passed
  // explicitly (with j===0 semantics) so the note re-anchors to a chord tone of the NEW chord — OR, per
  // Matthew, forms a prepared 4-3/6-5 SUSPENSION over the new chord that then resolves down.
  const nextMel = (j, b, nextS, ct, forceEnd, patLen, anchor, chordSym) => {
    anchor = anchor ?? strong[b]; chordSym = chordSym ?? prog[b];
    let idx;
    if(forceEnd!=null) idx=forceEnd;
    else if(suspend!=null){ idx=suspend; suspend=null; }                         // resolve the suspension down
    else if(j===0){
      // SUSPENSION, but only the kind that stays CONSONANT against the bass: a 4-3 or 6-5 (the held
      // note is a 4th or 6th over the chord root, resolving down to the 3rd or 5th). A 7-6 or 9-8
      // grinds a 7th/2nd straight against a bare bass note, which sounds wrong in this thin texture.
      const rootDeg = (CHORD_DEG[mode][chordSym]||[0])[0];
      const bassPC = (((melReg+off[clamp(rootDeg,span)])%12)+12)%12;
      const suspIv = ((((mnote(prev)%12)-bassPC)%12)+12)%12;                     // held note above the bass, mod octave
      if(b>0 && patLen>1 && ct.includes(prev-1) && !ct.includes(prev)
         && (suspIv===5||suspIv===8||suspIv===9) && chance(grade===4?0.30:grade===3?0.12:0)){  // G4 unlocks; G3 sparing; G2 none
        idx=prev; suspend=prev-1;                                                // prepared 4-3 / 6-5 suspension
      } else idx=anchor;
    }
    else if(prevLeap) idx=clamp(prev + Math.sign(prevLeap), W);
    else idx=stepTo(prev,nextS,ct);
    prevLeap = (forceEnd==null && suspend==null) && Math.abs(idx-prev)>=2 ? -(idx-prev) : 0;
    return idx;
  };
  // rhythm's character feel, from the piece's character (prof): legato sings, graceful lilts, light is crisp
  const rhythmFeel = character.feel;   // note DENSITY follows the character; the fast-piece problem is angularity, not note-count (fixed at the melodic level, not by thinning the rhythm)
  // antecedent close: inconclusive (a non-tonic chord tone), the tonic (IAC), or flow on (continuous)
  const endDeg = (midType==='HC'||midType==='DC') ? rnd(ctones(Tn.V).filter(i=>((winLo+i)%7)!==0).concat([wIdx(1)])) : midType==='IAC' ? wIdx(0) : null;
  // ============================ MELODIC ENGINE (skeleton + fill) ============================
  // A melody is a chord-tone SKELETON on the beats, connected by the non-chord tone each gap calls for:
  //   PASSING (a 3rd filled stepwise), AUXILIARY (a neighbour decorating a would-be repeat), a step INTO a leap,
  //   and true SUSPENSIONS (a chord tone tied OVER the beat/bar that resolves down by step). This replaces the old
  //   note-by-note "step toward the target", which drifted and repeated. (Matthew's melodic-logic redesign.)
  let skelRun = 1;
  let suspBudget = wide ? 1 : 0;   // at most ONE suspension per piece, and only if it arises NATURALLY (never forced) - so most pieces have none
  const ctPick = (c, tgt, not) => { let o=c; if(not!=null && c.length>1) o=c.filter(i=>i!==not); return near(o.length?o:c, clamp(tgt,W)); };
  // A piece FAVOURS one figure type, so its melodic gestures RECUR like a motif (a run-piece, a turn-piece), not scattered.
  const figBias = pickLeastUsed(['run','turn','arp','neighbour','mix'], opts.hist && opts.hist.figBias);   // the piece's favoured figure = the least-used across the book (diversity), not a die
  const connect = (A,B) => {                                  // the connective note between skeleton A (before) and B (after)
    const steps=B-A, dist=Math.abs(steps), dir=Math.sign(steps);   // dir is only read when dist>0 (sign is +/-1 there); the old ||coin was dead
    if(dist===0){                                            // AUXILIARY (neighbour decorating a repeated skeleton pitch)
      const auxDir = Math.sign(Math.round(W/2)-A) || -1;     // decorate TOWARD the register centre so the neighbour stays in tessitura (lower when the line sits high, upper when it sits low; the lower neighbour at centre - the commoner auxiliary). Reasoned from the established register, not a die.
      const aux=clamp(A+auxDir,W); return aux!==A?aux:clamp(A-auxDir,W); }
    if(dist===2) return clamp(A+dir,W);                       // PASSING note through a 3rd
    if(dist===1) return chance(.5)? clamp(A-dir,W) : A;       // adjacent chord tones: a small changing/return figure  [TODO melody-fill batch: needs caller line/motif context to reason - changing-tone vs repeat depends on whether the repeat is motivic]
    return clamp(A+dir,W);                                    // a leap: step toward B, the leap lands on the next skeleton note
  };
  // RHYTHMIC MOTIFS (character-driven): the character picks a small set of bar-rhythms and the piece REUSES them
  // as motifs rather than re-randomising every bar. Bar 0's rhythm recurs; a contrast motif marks the mid-phrase
  // bar; odd bars get a light variation. This is what makes the rhythm read as composed. Cadence/restate bars
  // still override below. (Same subdivision vocabulary drives melody rhythm AND is how the piece is constructed.)
  // The MAIN melodic motif must carry an actual figure — a lone whole-bar note reused every bar is a drone, not a
  // tune. Regenerate motifA until it has >=2 notes. Held whole-bar notes stay available as an occasional breath
  // (motifB, varied bars, cadence), so nothing is ruled out — only the empty-melody case is avoided.
  let motifA = barRhythm(barU,wide,compound,rhythmFeel,spd,march,calmMel,gp.noteValues.min);
  for(let _a=0; _a<8 && motifA.length<2; _a++) motifA = barRhythm(barU,wide,compound,rhythmFeel,spd,march,calmMel,gp.noteValues.min);
  // The CONTRAST motif must actually contrast: a statement answered by an identical "contrast" is no development.
  // Regenerate until motifB genuinely differs from motifA (bounded, so a piece with a tiny vocabulary still resolves).
  let motifB = barRhythm(barU,wide,compound,rhythmFeel,spd,march,calmMel,gp.noteValues.min);
  for(let _b=0; _b<12 && (motifB.length<2 || motifB.join(',')===motifA.join(',')); _b++) motifB = barRhythm(barU,wide,compound,rhythmFeel,spd,march,calmMel,gp.noteValues.min);
  // DEVELOP the motif, do not just copy it: re-subdivide ONE beat to a different valid cell of the same length, so
  // the bar keeps the motif's shape but is never an identical stamp. This is the fix for "varyRhythm did nothing on a
  // cell with no long note" (the seven-identical-bars march). Beat-aligned (a cell fills exactly one beat) so it stays
  // readable; the density budget (calmMel) still forbids introducing semiquavers. Falls back to splitting a long note,
  // then to the original, only if the character offers no legal alternative for any beat.
  const varyRhythm = m => {
    if(m.length<2) return m.slice();
    const groups=[]; let cur=[], acc=0;                            // group the flat durations into whole beats
    for(const d of m){ cur.push(d); acc+=d; if(acc>=beatLen-1e-9){ groups.push(cur); cur=[]; acc=0; } }
    if(cur.length) groups.push(cur);
    let cells=(QFEEL[rhythmFeel]||QFEEL._def).filter(c=>Math.abs(c.reduce((s,x)=>s+x,0)-beatLen)<1e-9);   // one-beat cells in this feel
    if(calmMel) cells=cells.filter(c=>!c.some(d=>d<0.5-1e-9));      // respect the fast-piece density budget
    cells=cells.filter(c=>c.every(d=>d>=gp.noteValues.min-1e-9));   // GRADE note-value floor: grade 2 = quaver, so no semiquavers/dotted-eighths (they arrive at grade 3)
    for(const gi of [...groups.keys()].sort(()=>chance(.5)?1:-1)){  // try beats in a varied order
      const g=groups[gi]; if(Math.abs(g.reduce((s,x)=>s+x,0)-beatLen)>1e-9) continue;   // only vary a single-beat group; leave long-note breaths
      const alt=cells.filter(c=>c.join(',')!==g.join(','));
      if(alt.length){ groups[gi]=rnd(alt); const out=groups.flat(); if(out.join(',')!==m.join(',')) return out; }
    }
    const out=m.slice(); const i=out.findIndex(d=>d>=2); if(i>=0){ out.splice(i,1,out[i]-1,1); } return out;   // fallback: split a long note
  };
  const phraseLen = Math.max(1, half);
  // PHRASE FUNCTION per bar — the REASON each bar exists in the phrase, so held notes and rhythmic density land for a
  // reason instead of i.i.d. (Matthew's standard). cadence=the close · apex=the melodic high point · drive=the approach
  // into a cadence · open=the phrase statement · flow=the neutral middle. This SIGNAL informs the generation below.
  const apexBar = contour.reduce((bi,v,b,arr)=>v>arr[bi]?b:bi, 0);
  const phraseFunc = Array.from({length:nbars},(_,b)=>{
    if(b===nbars-1) return 'cadence';
    if(b===half-1 && (midType==='HC'||midType==='IAC'||midType==='DC')) return 'cadence';
    if(b===0 || (restate && b===half)) return 'open';
    if(b===apexBar) return 'apex';
    if(b===half-2 || b===nbars-2) return 'drive';
    return 'flow';
  });
  const longIn = r => r.some(d=>d>=barU*0.75-1e-9);            // a near-whole-bar held note dominates the bar
  const rhythmByBar = [];
  for(let b=0;b<nbars;b++){ const pos=b%phraseLen;
    let r = pos===2 ? motifB : (pos%2===1 ? varyRhythm(motifA) : motifA);
    const f = phraseFunc[b];
    // A held/long note is legitimate only where it has a reason — a cadence broadening, the apex held as an agogic
    // accent, or a repose breath. On a DRIVE or OPENING bar the line must keep moving, so a held-note-dominated bar
    // there is recast in motion (this is what stops a long note landing mid-ascent or on the approach to a cadence).
    if((f==='drive'||f==='open') && longIn(r)){
      for(let t=0;t<6;t++){ const alt=barRhythm(barU,wide,compound,rhythmFeel,spd,march,calmMel,gp.noteValues.min);
        if(alt.length>=2 && !longIn(alt)){ r=alt; break; } } }
    // DENSITY follows phrase-function: a DRIVE bar pushes motion into the cadence (take the busier subdivision when the
    // grade allows it); a CADENCE bar settles (never busier than the motif). Motion lands for a reason, not i.i.d.
    if(f==='drive'){ const busier=varyRhythm(r); if(busier.length>r.length && !longIn(busier)) r=busier; }
    rhythmByBar.push(r); }
  const buildBar = (b, endIdx) => {
    const pat=rhythmByBar[b] || barRhythm(barU,wide,compound,rhythmFeel,spd,march,calmMel,gp.noteValues.min);
    const posArr=[]; { let p=0; for(const d of pat){ posArr.push(p); p+=d; } }
    const hasChg=!!prog2[b], chg=hasChg?changePos[b]:Infinity;
    const ctA=ctones(prog[b]), ctB=hasChg?ctones(prog2[b]):ctA;
    const ctAt=p => (p>=chg-1e-9)?ctB:ctA;
    // ON-BEAT = a metrical beat, measured in this metre's BEAT length (1 in simple time, 1.5 in compound 6/8/3/8).
    // Using integer positions here wrongly treated 6/8's second beat (position 1.5) as off-beat, so a passing note
    // could land on a strong beat and read as a chord tone (Matthew's bar-2 A over a Bb chord).
    const onBeat=j => { const r=posArr[j]/beatLen; return Math.abs(r-Math.round(r))<1e-9 || (hasChg && Math.abs(posArr[j]-chg)<1e-9); };
    const idxs=new Array(pat.length).fill(null);
    // SUSPENSION (natural only, never forced): if the previous note ALREADY sits a 2nd above a chord tone here and
    // it lies within the range (not at an extreme), tie it OVER the barline - a dissonance on the strong beat - and
    // resolve it DOWN by step. We do not rewrite the melody to manufacture one; it happens when the line lands there.
    let susResolve=null;
    if(b>0 && b!==half && b!==nbars-1 && pat.length>=2 && !hasChg && wide && endIdx==null && suspBudget>0){
      const lastN=rh[rh.length-1];
      if(lastN && !lastN.rest && !Array.isArray(lastN.m)){
        const p=degOf(lastN.m);
        if(p>=2 && p<=W-2 && ctA.includes(p-1) && !ctA.includes(p) && chance(0.3)){   // in range, a real 2nd above a chord tone here; take only some
          lastN.ti=1; idxs[0]=p; susResolve=clamp(p-1,W); suspBudget--;
        }
      }
    }
    // SKELETON: a chord tone on every on-beat slot. Move SMOOTHLY toward the bar's contour target - mostly by
    // step, sometimes a 3rd, rarely a bigger leap - and RECOVER a leap by stepping back the other way (so the
    // line arcs instead of zig-zagging in 5ths and 7ths). Beat-to-beat motion is capped at a 5th.
    let lastIdx=prev, lastMove=0;
    for(let j=0;j<pat.length;j++){
      if(idxs[j]!=null){ lastIdx=idxs[j]; continue; }          // suspension downbeat already placed
      if(susResolve!=null){ idxs[j]=susResolve; susResolve=null; lastMove=idxs[j]-lastIdx; lastIdx=idxs[j]; continue; }
      if(!onBeat(j)) continue;
      const c=ctAt(posArr[j]), ctr=strong[b];
      let tgt;
      if(Math.abs(lastMove)>=3) tgt = lastIdx - Math.sign(lastMove);        // recover the last leap: step back
      else if(j===0){                                                      // downbeat: a CONSEQUENCE of the line's momentum, not an arbitrary chord tone
        const toC = ctr - lastIdx;                                         // where the phrase contour pulls
        // a stepwise ASCENT into the barline wants to keep rising to its goal (a rising leading tone resolves UP to
        // the tonic); a DESCENT wants to keep falling. Continue that direction to the next chord tone UNLESS the
        // contour genuinely calls for the turn (pulls >=2 the other way) - so the arch still shapes the phrase.
        if(lineDir>0 && toC>-2) tgt = lastIdx + 2;
        else if(lineDir<0 && toC<2) tgt = lastIdx - 2;
        else tgt = lastIdx + Math.max(-3,Math.min(3, toC));                // otherwise step toward the contour, at most a 3rd
      }
      else { const toward = Math.sign(ctr-lastIdx) || lineDir || (Math.sign(Math.round(W/2)-lastIdx)||1);   // toward the contour; already AT it -> keep the line's momentum, else head to the register centre (from the notes before, not a coin)
             tgt = lastIdx + (chance(.62)?toward : chance(.65)?toward*2 : 0); } // TODO melody-fill batch: step-vs-3rd-vs-hold magnitude must be reasoned from contour DISTANCE + motif, not chance
      let idx=ctPick(c,tgt,null);
      if(Math.abs(idx-lastIdx)>4){ const nr=c.filter(i=>Math.abs(i-lastIdx)<=4); if(nr.length) idx=near(nr,tgt); }  // cap the leap at a 5th (larger leaps are NOT reliably recovered by the engine — widening this admits awkward jumps; see RULES M4)
      // A skeleton that keeps landing on the SAME chord tone reads as static/dead (Matthew: bar-after-bar D-D, F#-F#).
      // Prefer MOTION to a neighbouring chord tone on a repeat - but keep an occasional repeat possible (never banned).
      if(idx===lastIdx && (skelRun>=2 || chance(0.7))) idx=ctPick(c,lastIdx+(chance(.5)?2:-2),lastIdx);
      idxs[j]=idx; skelRun=(idx===lastIdx)?skelRun+1:1; lastMove=idx-lastIdx; lastIdx=idx;
    }
    if(endIdx!=null) idxs[pat.length-1]=clamp(endIdx,W);       // antecedent close / forced cadence tone
    // FILL: connect skeleton notes. A run of 2+ connective slots between A..B is realised as a characteristic melodic
    // FIGURE (scale run, turn, neighbour group, or arpeggiated flourish) instead of independent passing notes — this is
    // the figurative vocabulary that makes the line read as composed, not skeleton-and-fill. A single gap stays a plain
    // connective note.
    const figureFill = (A,B,len,ct) => {
      const dir=Math.sign(B-A)||(chance(.5)?1:-1), dist=Math.abs(B-A), out=[];
      let type;                                                                     // prefer the piece's favoured gesture when the context allows (motivic recurrence)
      if(figBias==='run' && dist>=len) type='run';
      else if(figBias==='arp' && dist>=2) type='arp';
      else if((figBias==='turn'||figBias==='neighbour') && dist<=2) type=figBias;
      else type = dist>=len ? 'run' : dist<=1 ? (chance(.5)?'turn':'neighbour') : (chance(.5)?'arp':'run');
      if(type==='run'){ for(let k=1;k<=len;k++) out.push(clamp(A+dir*k,W)); }                    // stepwise scale run toward B
      else if(type==='turn'){ const p=[1,0,-1,0]; for(let k=0;k<len;k++) out.push(clamp(A+p[k%4],W)); }   // turn: upper-note-lower-note
      else if(type==='neighbour'){ const p=[1,-1,0,0]; for(let k=0;k<len;k++) out.push(clamp(A+p[k%4],W)); } // neighbour group
      else { const tones=(ct||[]).slice().sort((x,y)=>x-y); let cur=A;                            // arpeggiated flourish over chord tones toward B
        for(let k=0;k<len;k++){ const nxt=tones.filter(t=> dir>0? t>cur : t<cur).sort((x,y)=>dir>0?x-y:y-x)[0];
          cur = nxt!=null ? nxt : clamp(cur+dir,W); out.push(clamp(cur,W)); } }
      return out;
    };
    for(let j=0;j<pat.length;){
      if(idxs[j]!=null){ j++; continue; }
      let hi=j; while(hi+1<pat.length && idxs[hi+1]==null) hi++;                                   // the run j..hi
      let a=j-1; while(a>=0 && idxs[a]==null) a--;
      let bb=hi+1; while(bb<pat.length && idxs[bb]==null) bb++;
      const A=a>=0?idxs[a]:prev;
      const B=bb<pat.length?idxs[bb]:(endIdx!=null?clamp(endIdx,W):(strong[Math.min(b+1,nbars-1)]??A));
      const len=hi-j+1;
      if(len>=2 && chance(0.6)){ const fig=figureFill(A,B,len,ctAt(posArr[j])); for(let k=0;k<len;k++) idxs[j+k]=fig[k]; }
      else { let AA=A; for(let k=j;k<=hi;k++){ idxs[k]=connect(AA,B); AA=idxs[k]; } }
      j=hi+1;
    }
    prev=idxs[idxs.length-1]; prevLeap=0;
    if(idxs.length>=2) lineDir=Math.sign(idxs[idxs.length-1]-idxs[idxs.length-2]);   // remember the direction into the next barline
    return pat.map((d,j)=>({m:mnote(idxs[j]),d,bar:b}));
  };

  for(let b=0;b<half;b++){                                    // phrase A (antecedent)
    buildBar(b, (b===half-1)?(endDeg??null):null).forEach(n=>rh.push(n));
  }
  const idea = rh.filter(n=>n.bar===0).map(n=>({m:n.m,d:n.d}));   // the "basic idea" to restate (no carried tie: a suspension out of bar 0 must not become a dangling tie in the restate)
  for(let b=half;b<nbars;b++){                                // phrase B (consequent)
    if(restate && b===half){ idea.forEach(n=>rh.push({...n,bar:b})); prev=degOf(idea.at(-1).m); prevLeap=0; continue; } // restate opening
    if(b===nbars-1){ cad.mel.forEach(([idx,d])=>rh.push({m:mnote(cadW(idx)), d, bar:b})); prev=wIdx(0); prevLeap=0; continue; } // cadence figure
    // The bar BEFORE the cadence should LEAD INTO it: end a step above the cadence's first note so the line steps
    // down into the close, instead of leaping up to a stray note right at the cadence (Matthew's catch here).
    const approach = (b===nbars-2) ? clamp(cadW(cad.mel[0][0])+1, W) : null;
    buildBar(b, approach).forEach(n=>rh.push(n));
  }
  // MINOR -> HARMONIC MINOR at the dominant/cadence: raise the natural 7th to the leading tone (resolves up to i)
  if(mode==='min'){
    const sc = wide?off:KS;
    for(let i=0;i<rh.length;i++){ const n=rh[i]; if(n.rest||Array.isArray(n.m))continue;
      const deg=sc.indexOf(n.m-melReg); if(deg<0 || deg%7!==6) continue;   // only the natural 7th (subtonic)
      const cdeg = CHORD_DEG[mode][prog[n.bar]] || [];
      const isDom = cdeg[0]===4;                                       // dominant: the leading tone belongs here
      const nat7Chord = !isDom && cdeg.some(dg=>(((dg%7)+7)%7)===6);   // III (relative major) keeps the NATURAL 7th
      const nxt = rh[i+1]; const up = nxt && !nxt.rest && !Array.isArray(nxt.m) && (sc.indexOf(nxt.m-melReg)%7===0);
      if((isDom || up) && !nat7Chord){ n.m += 1; n.alt='#'; }         // raise to the leading tone, spell sharp
    }
  }
  // REPEATED-NOTE REASONING (Matthew's C-C / B-B example): a repeated pitch is KEPT only when it earns it — it belongs
  // to a recurring repeated-note figure (MOTIVIC: two runs sharing a bar-onset = a real tattoo), OR the harmony changes
  // under it (FUNCTIONAL: same pitch, new chord), OR it sits at the apex/cadence (a peak or settle). Otherwise the
  // reason is VARIETY: on a moving bar an unmotivated static repeat steps to a neighbouring chord tone so the line
  // turns instead of sitting. Replaces the old "break any 3-in-a-row by count", which dismantled real tattoos and kept
  // meaningless repeats alike.
  {
    const runs=[]; let s0=0;
    for(let i=1;i<=rh.length;i++){ const cont = i<rh.length && !rh[i].rest && !rh[i-1].rest && !Array.isArray(rh[i].m) && !Array.isArray(rh[i-1].m) && rh[i].m===rh[i-1].m;
      if(!cont){ if(i-s0>=2 && !rh[s0].rest && !Array.isArray(rh[s0].m)) runs.push([s0,i-1]); s0=i; } }
    const onsetOf = idx => { let t=0; for(let k=0;k<idx;k++) t+=rh[k].d; return +((t%barU).toFixed(3)); };
    const onsets = runs.map(([a])=>onsetOf(a));
    const motivic = runs.length>=2 && new Set(onsets).size < runs.length;   // >=2 runs share a bar-onset -> a recurring repeated-note figure
    const harmChg = (a,b)=>{ const b0=rh[a].bar, b1=rh[b].bar; return prog[b0]!==prog[b1] || (typeof changePos!=='undefined' && changePos && changePos[b0]!=null); };
    for(const [a,b] of runs){
      if(motivic) continue;
      if(harmChg(a,b)) continue;
      const f=phraseFunc[rh[b].bar]; if(f==='cadence'||f==='apex') continue;
      for(let i=a+1;i<=b;i++){ const mid=rh[i], d=degOf(mid.m); if(d<0) continue; const ref=rh[i-1].m;
        const ctP=ctones(prog[mid.bar]).map(ix=>mnote(ix)).filter(p=>p!==ref);
        let cand=ctP.filter(p=>Math.abs(p-ref)<=4).sort((x,y)=>Math.abs(x-ref)-Math.abs(y-ref))[0];
        if(cand==null) cand=[d-1,d+1].map(x=>mnote(clamp(x,span))).find(p=>p!==ref);
        if(cand!=null) mid.m=cand;
      }
    }
  }
  // MELODIC SEQUENCE: state a bar's melodic figure, then REPEAT its interval shape on the next bar, transposed so its
  // notes track that bar's chord (a tonal sequence — a real developmental device, not a copy). Applied occasionally to
  // a run of moving inner bars, never over a cadence; the figure AND its rhythm recur, the pitch level follows the harmony.
  if(nbars>=4 && chance(0.32)){
    const byBar={}; { let t=0; for(let i=0;i<rh.length;i++){ const b=Math.floor(t/barU+1e-9); (byBar[b]=byBar[b]||[]).push(i); t+=rh[i].d; } }
    const cadB=new Set([nbars-1, half-1]); if(restate) cadB.add(half);   // protect the cadences and (if a parallel period) the restated opening
    const cands=[];
    for(let b=1;b<nbars-2;b++){ if(cadB.has(b)||cadB.has(b+1)) continue;
      const A=byBar[b]||[], B=byBar[b+1]||[]; if(A.length<2||!B.length) continue;
      if(A.some(i=>rh[i].rest||Array.isArray(rh[i].m)) || B.some(i=>rh[i].rest||Array.isArray(rh[i].m))) continue;
      if(prog[b]===prog[b+1]) continue;                                // need a harmony change for the sequence to track
      const dA=A.map(i=>degOf(rh[i].m)); if(dA.some(d=>d<0)) continue;
      cands.push({b,A,dA});
    }
    if(cands.length){
      const {b,A,dA}=rnd(cands); let shape0=dA.map(d=>d-dA[0]);        // interval shape from the figure's first note
      if(chance(0.30) && shape0.length>=3){ const h=Math.ceil(shape0.length/2); shape0=shape0.map((_,k)=>shape0[k%h]); }  // FRAGMENTATION: develop the figure's HEAD, repeated to fill the bar
      const shape = chance(0.35) ? shape0.map(s=>-s) : shape0;         // MOTIF DEVELOPMENT: sequence / inversion / fragmentation — a real developed answer, not a copy
      const ct=ctones(prog[b+1]);                                      // window indices that are chord tones of the next bar's chord
      const start=ct.map(ix=>({ix,dist:Math.abs(ix-dA[0])})).sort((x,y)=>x.dist-y.dist)[0];   // start on the nearest chord tone
      if(start){
        const seq=shape.map((s,k)=>({ m: mnote(clamp(start.ix+s, W)), d: rh[A[k]].d, bar: b+1 }));   // same rhythm, shifted pitches
        const B=byBar[b+1]; rh.splice(B[0], B.length, ...seq);         // duration-safe: source bar's rhythm sums to a full bar
      }
    }
  }
  // APPOGGIATURA (accented non-chord tone, grade 4+ where it is idiomatic): occasionally an on-beat chord tone is
  // leaned on from a step ABOVE — the upper note struck ON the beat as an accented dissonance, resolving DOWN by step
  // to the chord tone. Splits the note (both halves grade-legal); never at a cadence or the opening. beatClash already
  // permits a dissonance that resolves down by step, so a real appoggiatura is legal by construction.
  if(grade>=4 && chance(0.30)){
    const spots=[]; { let t=0; for(let i=0;i<rh.length;i++){ const pos=(t%barU), b=Math.floor(t/barU+1e-9);
      if(Math.abs(pos)<1e-9 && !rh[i].rest && !Array.isArray(rh[i].m) && rh[i].d>=1-1e-9 && b>0 && b<nbars-1){
        const dg=degOf(rh[i].m); const ct=ctones(prog[b]);
        if(dg>=0 && dg+1<=W && ct.includes(dg) && !ct.includes(dg+1)) spots.push({i, d:rh[i].d, dg, b}); }
      t+=rh[i].d; } }
    if(spots.length){ const s=rnd(spots); const above=mnote(clamp(s.dg+1, W)); const chord=rh[s.i].m;
      const appD=Math.min(1, s.d-0.5);                                    // the leaning note takes up to a beat; the chord tone keeps the rest
      if(above>chord && appD>=0.5-1e-9) rh.splice(s.i, 1, {m:above, d:appD, bar:s.b}, {m:chord, d:s.d-appD, bar:s.b}); }
  }
  // ANTICIPATION (grade 3+): occasionally the weak note just before a strong-beat chord tone ANTICIPATES it — the
  // coming chord tone arrives early on the preceding weak position (a consonant weak-beat NCT). Never at the opening.
  if(grade>=3 && chance(0.22)){
    const on=[]; { let t=0; for(const n of rh){ on.push(t); t+=n.d; } }
    const spots=[];
    for(let i=1;i<rh.length;i++){ const bi=Math.floor(on[i]/barU+1e-9), pos=on[i]-bi*barU;
      if(Math.abs(pos)>1e-9 || bi<1 || bi>=nbars) continue;               // note i must land on a downbeat (past the opening)
      const a=rh[i-1], c=rh[i];
      if(a.rest||c.rest||Array.isArray(a.m)||Array.isArray(c.m) || a.d>1+1e-9 || a.m===c.m) continue;
      const dg=degOf(c.m); if(dg>=0 && ctones(prog[bi]).includes(dg)) spots.push(i-1);
    }
    if(spots.length){ const j=rnd(spots); rh[j].m=rh[j+1].m; }             // the weak note anticipates the coming chord tone
  }
  // ESCAPE TONE / échappée (grade 3+): a weak connective note steps AWAY from its chord tone and the line then LEAPS
  // the other way to the next chord tone. Applied to a lone weak note between two chord tones that currently just repeats
  // or sits — turning it into the step-away-then-leap figure. Rare.
  if(grade>=3 && chance(0.18)){
    const on=[]; { let t=0; for(const n of rh){ on.push(t); t+=n.d; } }
    const spots=[];
    for(let i=1;i<rh.length-1;i++){ const bi=Math.floor(on[i]/barU+1e-9), pos=on[i]-bi*barU;
      if(Math.abs(pos)<1e-9) continue;                                    // weak position only
      const p=rh[i-1], c=rh[i], n=rh[i+1];
      if([p,c,n].some(x=>x.rest||Array.isArray(x.m))) continue;
      const dP=degOf(p.m), dN=degOf(n.m); if(dP<0||dN<0) continue;
      if(!ctones(prog[bi]).includes(dP)) continue;                        // must step away FROM a chord tone
      if(Math.abs(dN-dP)>=2) spots.push({i,dP,dN});                       // the coming move is a leap (the escape leaps the other way)
    }
    if(spots.length){ const {i,dP,dN}=rnd(spots); const dir=Math.sign(dN-dP)||1; const away=clamp(dP - dir, W);   // ONE escape: step opposite the coming leap
      if(away!==dP) rh[i].m = mnote(away); }
  }
  // Grade 3+: occasional 2-note chords (a diatonic 3rd under a strong melody note)
  if(wide && chance(.5)){
    const cand=rh.map((n,i)=>i).filter(i=>!Array.isArray(rh[i].m)&&!rh[i].rest&&rh[i].d>=1 && i>0 && i<rh.length-1 && degOf(rh[i].m)>=2);
    for(let t=0,k=cand.length>4?2:1; t<k && cand.length; t++){ const i=rnd(cand);
      // The lower note of the double-stop must be a CHORD TONE of this bar's harmony (a 3rd..6th below), so it
      // can't imply a different chord or clash with the LH (Matthew's bar-5 Ab under C over a Cm chord).
      const cts=ctones(prog[rh[i].bar]).map(ix=>mnote(ix));
      const below=cts.filter(p=>p<rh[i].m && rh[i].m-p>=3 && rh[i].m-p<=9).sort((a,b)=>b-a)[0];
      if(below!=null) rh[i].m=[below, rh[i].m];
      cand.splice(cand.indexOf(i),1); }
  }
  // (Rests are realised AFTER both hands are built — see the REST REALISATION pass below, which
  // needs the LH in hand to place every rest relationally. Nothing is inserted here.)
  // ---- ACCOMPANIMENT (written in accReg; beat-aligned values only) ----
  const lh=[];
  // VOICE-LEADING for struck triads (block / sustained chord): never stamp the same root-position
  // triad bar after bar — that parallel-blocks look is the machine-made giveaway. Voice each chord as
  // the close-position inversion whose three voices move LEAST from the previous chord, anchored to a
  // register band so it neither drifts nor sits in root position every time.
  const VLANCHOR = accReg + 7;
  let prevVoice = null;
  const voiceLead = rootPosTones => {
    const t = rootPosTones.slice().sort((a,b)=>a-b).slice(0,3);
    if(t.length<3) return rootPosTones;                                  // dyads etc: leave as-is
    const invs = [[t[0],t[1],t[2]], [t[1],t[2],t[0]+12], [t[2],t[0]+12,t[1]+12]]; // root / 1st / 2nd inv, all ascending
    const invPenalty = [0, 0.6, 8];                                     // 2nd inversion (5th in bass) is weak -> keep it occasional
    let best=null, bestScore=1e9;
    for(let ii=0; ii<invs.length; ii++) for(const oct of [-12,0,12]){
      const v=invs[ii].map(p=>p+oct); const avg=(v[0]+v[1]+v[2])/3;
      let score=Math.abs(avg-VLANCHOR) + invPenalty[ii];                // keep the band stable, prefer root/1st
      if(prevVoice) score += 0.7*(Math.abs(v[0]-prevVoice[0])+Math.abs(v[1]-prevVoice[1])+Math.abs(v[2]-prevVoice[2]));
      if(score<bestScore){ bestScore=score; best=v; }
    }
    prevVoice=best; return best;
  };
  // Grade 3+: let the accompaniment figure VARY across the piece — coherent phrases with the odd
  // natural change (a bar that walks stepwise, a held bar, an arpeggiated bar, a repeated note) —
  // rather than stamping one texture on every bar. That uniformity is what reads as machine-made.
  // No figure is forced; the piece's primary texture just leads, and inner bars sometimes deviate.
  // in-piece variation: the character's pool PLUS the moving textures (broken/bassline), so even a chordal
  // character gets real accompaniment variety across the piece (a walking bar, an arpeggiated bar) — not wall-to-wall chords.
  const TPAL = compound ? ['broken','alberti','broken','alberti','sustained']   // compound: mostly the flowing textures, a held bar now and then (never bassline/oom-pah, which collapse)
                        : [...new Set([...texPool, 'broken', 'bassline'])];
  let curTex = texture; let prevBassP = null; let prevOB = null, prevOT = null;   // previous struck chord's outer voices, to avoid parallel perfect 5ths/8ves
  let prevUpper = null, prevStruckBass = null;   // previous struck 2-note chord's UPPER + bass note, for voice-leading + parallel-perfect avoidance
  let prevStruckUpper = null;                    // previous struck chord's UPPER voices (1-2) as an ordered line, for inner-voice leading
  let prevStruckIv = null;                        // previous struck chord's bass-to-top interval class, to avoid repeating the same interval (3rd, 3rd, 3rd...)
  // The pah/upper-chord keeps a CONSISTENT DENSITY per piece (its identity), but the exact notes VOICE-LEAD on each
  // chord change — the nearest inversion/interval to the previous chord (least motion), which is what sounds right.
  const pahDensity = rnd([2,2,2,3]);   // mostly 2-note, occasionally a fuller 3-note pah
  // PER-PIECE pah SPACING identity: a real composer voices the "pah" close (a 3rd) OR open (a 6th/10th). Fixing it
  // per piece keeps the voice leading consistent WITHIN a piece while spreading the interval palette ACROSS the book
  // (the close 3rd+5th was 66% of dyads because every figure shared one close voicing). Open lifts the lowest upper
  // voice an octave when it stays under the tune.
  const pahSpacing = swap ? 'close' : pickLeastUsed(['close','open'], opts.hist && opts.hist.pahSpacing);   // diversity across the book, not a die (swap forces close - a real voicing constraint)
  const melLo = (()=>{ const ms=rh.filter(n=>!n.rest).map(n=>Array.isArray(n.m)?Math.min(...n.m):n.m); return ms.length?Math.min(...ms):72; })();
  let prevPah = null;                  // previous pah pitches, for voice-leading
  let prevUpperVoices = null;          // previous UPPER voices as ordered lines (part-to-part voice leading)
  const combos = (arr,k) => { const r=[]; const rec=(st,acc)=>{ if(acc.length===k){r.push(acc.slice());return;} for(let i=st;i<arr.length;i++){acc.push(arr[i]);rec(i+1,acc);acc.pop();} }; rec(0,[]); return r.length?r:[arr.slice(0,k)]; };
  const perms = arr => arr.length<=1 ? [arr.slice()] : arr.flatMap((x,i)=> perms([...arr.slice(0,i),...arr.slice(i+1)]).map(p=>[x,...p]));
  const dom7Bars = new Set();          // bars voiced with an added dominant 7th (for the V7 -> I resolution guard)
  let prevHold=null;                   // previous bar's held whole-bar bass pitch (grade-2 sustained/block), to avoid a DEAD repeated pedal
  // Break a held bar into a moving arpeggio of the SAME chord (same harmony, grade-legal) so a repeated bass note
  // stops reading as a static pedal (Matthew: bars 2-3 both a held dominant). Reuses the 'broken' idiom.
  const brokenOf = (ch,root) => { const tones=[root, ch.t[1]??root, ch.t[2]??ch.t[1]??root];   // do NOT force tones above the root: a chord whose in-box tones sit BELOW the root (IV, V) must arpeggiate down to them, not collapse to a repeated root
    const shape = nbeats>=4?[0,1,2,1]:nbeats===3?[0,1,2]:[0,2]; const seq=[];
    for(let i=0;i<nbeats;i++){ let t=clamp(tones[shape[i%shape.length]],span); if(i>0&&t===seq[i-1]){ const alt=tones.map(x=>clamp(x,span)).find(x=>x!==t); if(alt!=null)t=alt; } seq.push(t); }
    return seq.map(t=>({m:accReg+off[t], d:beatLen})); };
  prog.forEach((c,b)=>{
    const ch=CHm[c], root=ch.b;
    if(b===nbars-1){ cad.lh.forEach(([idx,d])=>lh.push({m:accReg+off[idx], d})); return; } // cadence figure from the pool
    if(wide){
      // The groove is a MOTIF: hold the primary texture through the piece so the accompaniment has one identity,
      // rather than switching texture bar to bar (which scatters one-off patterns and reads as random). Purposeful
      // variation happens at PHRASE boundaries + rarely mid-phrase, and even then only to a related texture.
      if(b===0 || b===half) curTex = texture;
      else if(chance(0.12)) curTex = rnd(TPAL);
    }
    const tex = wide ? curTex : texture;

    if(!wide){
      // ----- Grade 2: original five-finger-box accompaniment (unchanged) -----
      // PHRASE-RESPONSIVE RHYTHM: at the mid-phrase cadence (the antecedent's real HC/IAC/DC close, where the melody
      // itself settles) the accompaniment BREATHES - it settles onto the cadential bass for the bar instead of driving
      // its pulse through the repose. This is a reasoned response to phrase-function, not a blanket rule: a crisp or
      // driving character (a march, a rhythmic study) deliberately keeps its motor running THROUGH the half cadence,
      // so it drives on. The reason (mark the phrase close) either applies here or it doesn't.
      const antecedentClose = half>0 && half<nbars && b===half-1 && (midType==='HC'||midType==='IAC'||midType==='DC');
      const driveThrough = character.id==='rhythmic' || character.feel==='crisp';
      if(antecedentClose && !driveThrough){ lh.push({m:accReg+off[root], d:barU}); prevHold=null; return; }
      // WITHIN-BAR HARMONIC CHANGE: this bar carries two chords (a predominant into the dominant), so the LH states
      // each chord's bass in its half of the bar - two readable bass notes, the five-finger way to voice a chord change
      // mid-bar. The melody has already re-anchored to the second chord at the split point (shared melody loop).
      if(prog2[b] && CHm[prog2[b]]){
        const d1=changePos[b], d2=barU-changePos[b];
        lh.push({m:accReg+off[root], d:d1}, {m:accReg+off[CHm[prog2[b]].b], d:d2}); prevHold=null; return;
      }
      // FIGURE accompaniment at grade 2 (Matthew: the engine must NOT be grade-dependent - grade is only a parameter).
      // Render the SAME shared, grade-tagged FIGBANK rhythms the higher grades use (the figure's own grade tag already
      // gated selection), filled with the five-finger voicing (bass + one upper chord tone). This is what finally brings
      // rest-bearing RHYTHMIC VARIETY to the grade-2 left hand instead of every piece collapsing to one oom-pah pattern.
      if(texture==='fig' && primaryFig && !primaryFig.s.some(s=>s[0]==='t3')){
        const rootP = accReg+off[root];
        const upDeg = [...new Set(ch.t)].find(dg=>dg!==root);
        const pah = upDeg!=null ? accReg+off[upDeg] : rootP;
        for(const slot of primaryFig.s){ const [role,d,art]=slot;
          if(role==='r'){ lh.push({rest:true,d}); continue; }
          const o={m: role==='b'?rootP:pah, d}; if(art==='-.') o.art=art; lh.push(o); }   // keep staccato detachment; drop accent/tenuto (grade-2 clean)
        prevHold=null; return;
      }
      if(texture==='sustained'){ const p=accReg+off[root];
        if(p===prevHold){ brokenOf(ch,root).forEach(o=>lh.push(o)); prevHold=null; return; }   // repeated held pitch -> give it motion
        lh.push({m:p, d:barU}); prevHold=p; return; }
      if(texture==='block'){ const up=ch.t[1]; const bassP=accReg+off[root];
        if(bassP===prevHold){ brokenOf(ch,root).forEach(o=>lh.push(o)); prevHold=null; return; }
        const dyad=(up!=null&&up>root)?[accReg+off[root],accReg+off[up]]:accReg+off[root]; lh.push({m:dyad, d:barU}); prevHold=bassP; return; }
      if(texture==='bassline'){               // a MOVING stepwise bass (root, then step toward the next chord's root)
        prevHold=null;
        const nextR = b<nbars-1 ? CHm[prog[b+1]].b : 0; let cur=root;
        let lastDir = Math.sign(nextR-root) || 1;   // the direction the bass is walking; a walk with no ground to cover embellishes DOWNWARD (a bass neighbour is idiomatically the lower one)
        for(let i=0;i<nbeats;i++){ lh.push({m:accReg+off[clamp(cur,span)], d:beatLen});
          if(i<nbeats-1){ let step=Math.sign(nextR-cur);
            if(step===0) step=-lastDir; else lastDir=step;   // ARRIVED at the next root early -> turn back to the neighbour and return, direction derived from the approach (never a coin)
            cur = clamp(cur+step, span); } }
        return;
      }
      if(texture==='broken'){ prevHold=null;
        const tones=[root, ch.t[1]??root, ch.t[2]??ch.t[1]??root];   // do NOT force tones above the root: a chord whose in-box tones sit BELOW the root (IV, V) must arpeggiate down to them, not collapse to a repeated root
        const seq=[]; for(let i=0;i<nbeats;i++){ let t=clamp(tones[brokenShape[i%brokenShape.length]],span);
          if(i>0 && t===seq[i-1]){ const alt=tones.map(x=>clamp(x,span)).find(x=>x!==t); if(alt!=null) t=alt; } seq.push(t); }
        seq.forEach(t=>lh.push({m:accReg+off[t], d:beatLen}));
        return;
      }
      // CHOOSE the second bass note by SCORING every candidate chord tone against the reasons that apply at THIS spot,
      // and taking the best - the same way the harmony grammar chooses a chord. A repeated root is just one candidate;
      // it wins only when its reasons (a driving, accented character wanting a pulse) actually outscore a moving tone's
      // (a living line, leaning toward the coming root, differing from the last bar). No predetermined branch.
      const rootP = accReg+off[root];
      const prevBass = lh.length ? (Array.isArray(lh[lh.length-1].m)?lh[lh.length-1].m[0]:lh[lh.length-1].m) : rootP;
      const nextRootP = accReg + off[(b<nbars-1 && CHm[prog[b+1]]) ? CHm[prog[b+1]].b : root];
      // The REASON a repeated-root bass exists is a specific PERCUSSIVE / MARTIAL idiom (a march, a driving ostinato) -
      // NOT loudness or grandeur. So the pulse wins only there; everywhere else the bass MOVES to serve the harmony and
      // the line. The rarity of the repeat falls out of the reason being uncommon, not out of any percentage clamp.
      const drivingPulse = character.id==='rhythmic' || /marcia|march|marziale|fanfare|ritmic/i.test(tempo);
      const scoreBass = p => {
        let s = (p!==rootP) ? 1 : 0;                                       // default: a living, moving bass
        if(p===rootP) s += drivingPulse ? 1.4 : -1.2;                      // the repeat wins ONLY in a percussive/martial idiom
        s -= Math.abs(p-nextRootP)*0.12;                                   // lean toward where the bass is heading
        s -= Math.abs(p-prevBass)*0.05;                                    // stay reasonably conjunct
        if(p===prevBass) s -= 0.5;                                         // diversity from last bar's second note
        return s;
      };
      const cands=[...new Set(ch.t)].map(dg=>accReg+off[dg]);
      const second = cands.reduce((bp,p)=>scoreBass(p)>scoreBass(bp)?p:bp);
      const [bh,bt]=barSplit(barU,beatLen);
      lh.push({m:rootP, d:bh}, {m:second, d:bt});
      return;
    }

    // ----- Grade 3+: voice the REAL triad (root-3rd-5th), upper tones lifted ABOVE the bass so the
    // dominant never collapses to a doubled root. In MINOR, the dominant takes the harmonic-minor
    // LEADING TONE (its 7th raised a semitone) so it agrees with the melody's raised 7th instead of
    // clashing a natural 7th against it. -----
    let degs = (CHORD_DEG[mode][c] || [root]).slice();
    const isDomMin = mode==='min' && degs[0]===4;          // minor dominant -> use the leading tone
    // COLOUR: a DOMINANT 7th. On a dominant that resolves to the tonic, sometimes add the chord 7th (the subdominant
    // degree, a 3rd above the 5th) as an upper colour tone. It is voiced ABOVE the bass (never in it) and resolves
    // DOWN by step to the tonic's 3rd on the next chord via the least-motion leading - the textbook V7 -> I. Kept as
    // an UPPER tone so no texture puts it in the bass; chance-gated so plain triads still dominate.
    const seventhDeg = (degs[2]!=null) ? ((degs[2]+2)%7) : null;
    // H6 widened: a V7 resolves its 7th down to scale-degree 3, which is present in the submediant too, so V7->vi
    // (deceptive) is as valid as V7->I. Admit both; the 7th's resolution target (^3) is unchanged.
    // the dominant 7th intensifies the pull to resolution; a composer reaches for that fuller sound in an EXPRESSIVE
    // (legato/cantabile) character and leaves the bare triad in a crisp/light one - a reason from the character, not a
    // die. It varies across the book because the character does; it can't narrow (the 7th only ADDS on resolving Vs).
    const add7 = (c===Tn.V) && seventhDeg!=null && b<nbars-1 && (prog[b+1]===Tn.I || prog[b+1]===(mode==='maj'?'vi':'VI')) && (character.feel==='smooth' || character.artic==='legato');
    if(add7){ degs.push(seventhDeg); dom7Bars.add(b); }
    const degPitch = dg => { let p=accReg+off[clamp(dg,span)]; if(isDomMin && (((dg%7)+7)%7)===6) p+=1; return p; };
    // INVERSION decision: sometimes put the 3rd in the bass (first inversion) so the bass LINE moves by
    // step instead of leaping root-to-root — this is what makes the LH sing instead of stamping root
    // triads. Keep the structural bars (opening, midpoint, mid-cadence) in root position for clarity, and
    // only actually invert when the 3rd-in-bass genuinely moves by step where the root would have leapt.
    // Never the 5th in the bass on a downbeat (that is a weak 6/4, which harmony-checks flags).
    let bassDeg = degs[0];
    const structural = (b===0 || b===half || b===half-1);
    if(prevBassP!=null){
      // Choose the bass tone that keeps the BASS LINE moving smoothly — the singing, varied bass of real writing
      // rather than a stamped root every bar. Root stays the default (a small bias); a first inversion (3rd in
      // bass) wins when it genuinely moves less; the 6/4 (5th in bass) is weak, so it is heavily penalised and rare.
      // FIRST INVERSION (3rd in the bass) is the downward path to a 6th (root a 6th ABOVE the 3rd-bass, no melody
      // collision), it keeps the chord's 3rd so the upper voicing can open without going hollow, and it steps the
      // bass. Open it up - BUT only where the root is actually sounding that bar (in the melody), so the exposed
      // 3rd-in-bass can't imply the wrong chord (the bar-3 fault). Rootless bar -> stay conservative (root position).
      const rootPCbar = ((degPitch(degs[0])%12)+12)%12;
      const melHasRootBar = rh.some(n=>!n.rest && n.bar===b && (Array.isArray(n.m)?n.m:[n.m]).some(m=>(((m%12)+12)%12)===rootPCbar));
      // A STRUCTURAL bar stays in root position for clarity UNLESS the root would leap a 5th+ AND the first
      // inversion is unambiguous (the root sounds in the melody this bar): then it may CONNECT the bass line
      // instead of stamping a jumpy root (Matthew's slot-15 spiky bass). Non-structural bars are unchanged.
      // The 5th (a weak 6/4) is never taken on a structural bar.
      const canInvert = !structural || (Math.abs(degPitch(degs[0])-prevBassP)>=5 && melHasRootBar);
      const opts=[{dg:degs[0],pen:0}];
      if(degs.length>=2 && canInvert) opts.push({dg:degs[1],pen: melHasRootBar ? 0.4 : 1.2});
      if(degs.length>=3 && !structural) opts.push({dg:degs[2],pen:5});
      let best=opts[0], bs=1e9;
      // Least-motion is the default, but pure minimisation lazily STAYS on the same pitch whenever the chord
      // repeats (Matthew's bar 4-5: Eb, Eb, Eb). Add a small nudge AWAY from repeating the exact previous bass
      // note, so a repeated chord tends to invert / move rather than stamp the same note. A bias, not a block.
      for(const o of opts){ let sc=Math.abs(degPitch(o.dg)-prevBassP)+o.pen; if(degPitch(o.dg)===prevBassP) sc+=1.5; if(sc<bs){ bs=sc; best=o; } }
      bassDeg=best.dg;
    }
    const bassP = degPitch(bassDeg);
    prevBassP = bassP;
    let upperPs = degs.filter(d=>d!==bassDeg).map(dg=>{ let p=degPitch(dg); while(p<=bassP) p+=12; return p; }).sort((a,b)=>a-b);
    if(!upperPs.length) upperPs=[bassP+12];
    const pool=[bassP, ...upperPs];
    const ltPC = isDomMin ? (((accReg+off[clamp(6,span)]+1)%12)+12)%12 : -1;   // leading-tone pitch class
    const addN = (m,d,tup) => { const arr=Array.isArray(m)?m:[m]; const o={m,d};   // spell ONLY the leading tone sharp
      if(tup) o.tup=tup; if(arr.some(p=>(((p%12)+12)%12)===ltPC)) o.alt='#'; lh.push(o); };
    // ===== SWAP: RIGHT-HAND accompaniment above the LH melody — a figure from the RH BANK, voice-led, varied across bars.
    if(swap){
      let tones = [...new Set(degs.map(degPitch))].sort((a,b)=>a-b);   // this bar's chord tones in the treble
      if(prevSwapTop!=null){ let top=Math.max(...tones);              // voice-lead the whole chord to the nearest position to the previous bar
        while(top-prevSwapTop>7){ tones=tones.map(t=>t-12); top-=12; }
        while(prevSwapTop-top>7){ tones=tones.map(t=>t+12); top+=12; } }
      prevSwapTop=Math.max(...tones);
      const chordC = tones.slice(-Math.min(gp.chordMax, tones.length)); // block chord (top chordMax tones)
      const arp = tones.slice(0, Math.min(3, tones.length));           // arpeggio tones (low->high)
      const topT = arp[arp.length-1], innerT = arp.length>=2 ? arp[Math.floor((arp.length-1)/2)] : arp[0];
      // this bar's figure: mostly the PRIMARY, ~1 bar in 3 a compatible NEIGHBOUR — real within-piece variety, not one stamp.
      const fig = (rhFigCands.length>1 && chance(0.34)) ? rnd(rhFigCands) : (primaryRHFig || {s:Array.from({length:nbeats},()=>['c',beatLen])});
      let ai=0;
      for(const slot of fig.s){ const role=slot[0], d=slot[1], art=slot[2];
        if(role==='r'){ lh.push({rest:true,d}); continue; }
        let m = role==='a' ? arp[(ai++)%arp.length] : role==='p' ? topT : role==='i' ? innerT : chordC;
        const arr = Array.isArray(m)?m:[m];
        const o = { m: Array.isArray(m)?m.slice():m, d }; if(art) o.art=art;
        if(arr.some(p=>(((p%12)+12)%12)===ltPC)) o.alt='#';
        lh.push(o);
      }
      return;
    }
    // struck 2-note LH chord that DEFINES the harmony (bass + 3rd) — EXCEPT below C3, where a close 3rd sounds
    // muddy/clustered: there, open the interval to a 5th (the melody supplies the 3rd). Low-register voicings
    // must spread out (Matthew's rule: G2+B2 is mud; use a 5th or a single note down there).
    const LOWSPREAD = 48;   // C3 — below here even the oom-pah "pah" chord is lifted an octave out of the mud
    // VOICE-LEAD the upper note of a struck 2-note chord (the case of consecutive CHANGING chords — oom-pah and
    // arpeggio patterns set their own notes, so this only applies to block/sustained struck chords). Among the
    // chord tones a 3rd..6th above the bass, take the one CLOSEST to the previous chord's upper note (least hand
    // movement); the INTERVAL (3rd / 5th / 6th) then falls out of what is most convenient — equal opportunity, no
    // fixed norm — with only a muddy LOW close-3rd nudged wider.
    // STRUCK chord: bass + 1-2 UPPER voices, voice-led from the previous struck chord. Mostly a full 3-note triad
    // (bass + a led 3rd + a led 5th) so the bass-to-top interval isn't forever a bare 3rd, sometimes a leaner open
    // 2-voice spacing (a 6th, an octave, an open 10th). The inner voice(s) hold a common tone or move by the
    // smallest step; interval variety then EMERGES from the density + spacing rather than a random pick. Every old
    // guard kept: no muddy low close-cluster, no low close 3rd, no parallel perfect 5th/8ve on the top voice.
    const struck2 = () => {
      const base=[...new Set(upperPs)].filter(p=>p>bassP);
      const pool=[...new Set([...base, ...base.map(p=>p+12), bassP+12])].filter(p=>p-bassP>=3 && p-bassP<=17).sort((a,b)=>a-b);
      if(!pool.length){ prevStruckUpper=[bassP+12]; prevUpper=bassP+12; prevStruckBass=bassP; return [bassP, bassP+12]; }
      const lowReg = bassP<52;                                        // below D3: keep it thin/open (mud guard)
      let dens = lowReg ? 1 : (chance(0.62)?2:1);                     // mid-register mostly a full triad; low or occasional = 2-voice
      dens = Math.min(dens, pool.length);
      const prev = (prevStruckUpper && prevStruckUpper.length) ? prevStruckUpper.slice().sort((a,b)=>a-b) : null;
      const cand = dens===1 ? pool.map(p=>[p]) : combos(pool,2);
      let best=cand[0], bs=1e9;
      for(const cRaw of cand){ const v=cRaw.slice().sort((a,b)=>a-b);
        if(v.length===2 && v[1]-v[0]<3) continue;                     // no clustered upper 2nd
        let score=0;
        if(prev){ const m=Math.min(prev.length,v.length); for(let i=0;i<m;i++) score+=Math.abs(v[i]-prev[i]);
          if(v.length!==prev.length) score+=1.5; }                    // slight cost to changing density -> some consistency
        if(lowReg && v.length>1 && v[v.length-1]-v[0]<=4) score+=6;   // low close cluster = mud
        if(bassP<56 && v[0]-bassP<=4) score+=3;                       // muddy low close 3rd
        // per-piece OPEN identity: reach for a wider bass-to-top interval (a 6th / octave / 10th) instead of the
        // nearest 3rd, consistently across the piece. This is what actually breaks the thirds dominance in the
        // figure textures (where struck2 does most of the work); close pieces keep their thirds.
        if(pahSpacing==='open') score -= 0.5*Math.min(v[v.length-1]-bassP, 12);
        // ANTI-MONOTONY (Matthew's rule: a 3rd is never forced - the same two notes invert to a 6th, or become a
        // root+5th). Penalise REPEATING the previous bass-to-top interval class, so the voicing cycles 3rd -> 6th ->
        // 5th -> ... instead of stamping thirds. A nudge, not a ban: a 3rd can still recur, just not relentlessly.
        if(prevStruckIv!=null && (((v[v.length-1]-bassP)%12)+12)%12===prevStruckIv) score+=1.3;
        if(prevStruckBass!=null && prev && bassP!==prevStruckBass){   // anti-parallel perfect 5th/8ve on the top voice
          const topN=v[v.length-1], ptop=prev[prev.length-1];
          const iv=(((topN-bassP)%12)+12)%12, piv=(((ptop-prevStruckBass)%12)+12)%12;
          if((iv===7||iv===0) && iv===piv && Math.sign(bassP-prevStruckBass)===Math.sign(topN-ptop)) score+=6;
        }
        if(score<bs){ bs=score; best=v; } }
      prevStruckUpper=best.slice(); prevUpper=best[best.length-1]; prevStruckBass=bassP;
      prevStruckIv=(((best[best.length-1]-bassP)%12)+12)%12;
      return [bassP, ...best]; };

    // HELD voicing (block / sustained — a chord that RINGS). A held 2-note 3rd sounds like a squashed triad and,
    // low down, muddies. So: root ALWAYS in the bass (a held chord states its own root), and either an OPEN voicing
    // (root+5th) low where a close 3rd/full triad would clog, or a full clear TRIAD mid-register. Never a bare
    // held 3rd; never the 3rd+5th shape that spells the relative major. Thirds stay free in the rhythmic figures.
    // HELD chord voicing — DETERMINISTIC by register (consistent within a piece): open 5th low (no mud), full triad mid.
    const heldVoice = () => {
      const rP=degPitch(degs[0]);
      const lift = dg => { let p=degPitch(dg); while(p<=rP) p+=12; return p; };
      const third = lift(degs[0]+2), fifth = lift(degs[0]+4);
      return rP<52 ? [rP,fifth] : [rP,third,fifth].sort((a,b)=>a-b);
    };
    // The "pah"/upper chord above the bass: a fixed DENSITY (pahDensity), with the actual tones chosen to VOICE-LEAD
    // from the previous chord (least total motion). A held/repeated chord therefore keeps the same pah; a chord change
    // slides to the nearest inversion (e.g. root+6th -> root+5th) — coherent and musical, not a random shape per chord.
    // PART-TO-PART voice leading. The bass is its OWN part (placed by the inversion logic above, free to leap
    // root-to-root). The UPPER voices are continuous inner lines: each holds a common tone or moves by the smallest
    // step to an upper chord tone of the new chord. Crucially the essential 3rd is voiced as an UPPER part and is
    // NEVER dropped in favour of a root-double just because the root sits closer (Matthew's Am->Dm: the inner C
    // must go to F, the 3rd, not slide onto D, the bass). Voices never cross and never land on the bass's own note.
    const chordVoiceUpper = () => {
      const bassPC=((bassP%12)+12)%12;
      const pcOf = dg => ((degPitch(dg)%12)+12)%12;
      const roles=[];                                                   // upper tones by priority: (7th colour), 3rd, 5th, then doubled root
      if(degs.length>3 && pcOf(degs[3])!==bassPC) roles.push(pcOf(degs[3]));   // the dominant 7th - a guide tone, voiced first so it sounds + resolves
      if(degs.length>1 && pcOf(degs[1])!==bassPC) roles.push(pcOf(degs[1]));
      if(degs.length>2 && pcOf(degs[2])!==bassPC && !roles.includes(pcOf(degs[2]))) roles.push(pcOf(degs[2]));
      if(!roles.includes(pcOf(degs[0]))) roles.push(pcOf(degs[0]));   // the root, as an octave-doubled upper voice, so a fuller-density pah can be a full 3-note triad rather than a bare 3rd
      if(!roles.length) roles.push((bassPC+7)%12);
      const dens=Math.max(1, Math.min(pahDensity, roles.length));
      const need=roles.slice(0,dens);                                   // pitch-classes the upper voices sound this chord
      const realize=(pc,ref)=>{ let p=bassP + ((((pc-bassPC)%12)+12)%12); if(p<=bassP) p+=12;   // nearest pitch of pc above bass
        while(Math.abs((p+12)-ref)<Math.abs(p-ref)) p+=12;
        while(p-12>bassP && Math.abs((p-12)-ref)<Math.abs(p-ref)) p-=12; return p; };
      const prev=(prevUpperVoices&&prevUpperVoices.length===dens)?prevUpperVoices.slice().sort((a,b)=>a-b):null;
      let voices;
      if(prev){                                                         // assign need-PCs to prior voices, least motion, no crossing
        let best=null,bs=1e9;
        for(const perm of perms(need)){ const vs=perm.map((pc,i)=>realize(pc,prev[i]));
          let sc=vs.reduce((a,v,i)=>a+Math.abs(v-prev[i]),0);
          if(!vs.every((v,i)=>i===0||v>vs[i-1])) sc+=100;               // penalize voice crossing
          if(sc<bs){bs=sc;best=vs;} }
        voices=best;
      } else voices=need.map((pc,i)=>realize(pc, bassP+8+i*3));
      voices=voices.slice().sort((a,b)=>a-b);
      for(let i=1;i<voices.length;i++) if(voices[i]<=voices[i-1]) voices[i]+=12;   // de-cross safeguard
      if(voices.length>=2){ const lo=voices[0],hi=voices[voices.length-1]; if(lo<LOWSPREAD && hi-lo<=4){ voices[voices.length-1]+=12; voices.sort((a,b)=>a-b); } }  // muddy low close-3rd: open it
      // INVERT to break repeated thirds (Matthew's rule: a 3rd can always be its 6th inversion). Lift the lowest
      // upper voice an octave (close 3rd -> open 6th/10th) when the piece is 'open', OR whenever this pah would be a
      // 3rd right after the previous pah was also a 3rd (anti-monotony) - but only when the opened top stays a step
      // under the tune, so it never climbs into the melody. Register-blocked thirds stay (a low tune leaves no room,
      // and a close 3rd under a low melody is correct voicing).
      if(voices.length>=2){ const lo=voices[0];
        const thisIs3 = voices[voices.length-1]-lo<=4;
        const prevWas3 = prevPah && prevPah.length>=2 && (prevPah[prevPah.length-1]-prevPah[0]<=4);
        if((pahSpacing==='open' || (thisIs3 && prevWas3)) && lo+12 < melLo-1 && lo+12 > voices[voices.length-1])
          voices=[...voices.slice(1), lo+12].sort((a,b)=>a-b); }
      prevUpperVoices=voices.slice();
      prevPah=voices.slice();
      return voices.length>1?voices:voices[0];
    };

    if(prog2[b]){                                       // MID-BAR HARMONIC CHANGE: two chords in this bar
      const d1=changePos[b], d2=barU-changePos[b];
      const above = ps => ps.length>1?ps:ps[0];
      const [b1,b2]=barSplit(d2,beatLen);
      // GROUND THE DOWNBEAT: strike the first chord ON beat 1 and hold it for its whole span, rather than
      // scurrying bass-then-chord off the beat. A mid-bar change (especially a LIFTING secondary dominant)
      // must not let the felt downbeat slide onto beat 2 — the harmonic change happens later, on the weaker
      // beat, over a firmly established downbeat. (Matthew's diagnosis of #2's bars 2 & 7.)
      addN(struck2(), d1);                              // struck, held on the downbeat (spread-aware voicing)
      if(prog2[b]==='V/V'){                              // SECONDARY DOMINANT (e.g. G-B-D in F): supertonic - raised-4th - fifth
        const supert=accReg+off[clamp(1,span)], raised=accReg+off[clamp(3,span)]+1, sixth=accReg+off[clamp(5,span)];
        // GROUND IT (Matthew's slot-12: the raised 4th left alone in the bass reads as rootless/unmoored — "no root
        // to guide it"). ALWAYS root position: the root (supertonic) struck on the beat in the bass, the raised 4th
        // + 5th voiced ABOVE it. Drops the old first-inversion branch that exposed the chromatic note in the bass.
        let up=[raised,sixth].map(p=>{ while(p<=supert) p+=12; return p; }).sort((x,y)=>x-y);
        lh.push({m:supert, d:b1});
        lh.push({m:above(up), d:b2, alt:'#'});               // '#' spells the raised note right in any key
        return;
      }
      const dp2 = dg => accReg+off[clamp(dg,span)];      // plain spelling: split targets are LT-free (major any; minor iv/VI/i)
      const degs2 = CHORD_DEG[mode][prog2[b]] || [degs[0]];
      const bass2 = dp2(degs2[0]);
      let up2 = degs2.slice(1).map(dg=>{ let p=dp2(dg); while(p<=bass2) p+=12; return p; }).sort((a,b)=>a-b);
      if(!up2.length) up2=[bass2+12];
      addN(bass2,b1); addN(above(up2),b2);              // second chord (the new harmony, latter part)
      return;
    }
    if(tex==='sustained'){
      // A single note held for the whole bar is FINE — as long as SOMETHING defines the chord. It is only
      // hollow when nothing states the 3rd (Matthew's bar 2: lone bass + a melody of only D-E-D). So hold a
      // lone bass only when the MELODY already spells this chord's 3rd that bar; otherwise hold the 2-note
      // chord. This pinpoints the empty-harmony case without ruling out valid single held notes.
      const t3=upperPs.find(p=>{ const iv=(((p-bassP)%12)+12)%12; return iv===3||iv===4; });
      const thirdPC=t3!=null?(((t3%12)+12)%12):null;
      const melHasThird = thirdPC!=null && rh.some(n=>n.bar===b && !n.rest && (Array.isArray(n.m)?n.m:[n.m]).some(m=>(((m%12)+12)%12)===thirdPC));
      addN((melHasThird && chance(.5)) ? bassP : heldVoice(), barU); return;
    }
    if(tex==='alberti'){                      // Alberti bass: low, top, middle, top — classic moving harmony
      const nsub = compound ? Math.round(barU/0.5) : nbeats, sublen = compound ? 0.5 : beatLen;   // COMPOUND: subdivide into eighths so it FLOWS, not one note per dotted-crotchet beat
      const lo=pool[0], hi=pool[pool.length-1], mid=pool[1]??hi, pat=[lo,hi,mid,hi];
      const seq=[]; for(let i=0;i<nsub;i++){ let p=pat[i%pat.length];
        if(i>0 && p===seq[i-1]){ const a=pool.find(x=>x!==p); if(a!=null) p=a; } seq.push(p); }
      seq.forEach(p=>addN(p, sublen));
      return;
    }
    if(tex==="block"){ addN(heldVoice(), barU); return; }                                     // struck HELD chord: open low / full triad mid, never a bare 3rd
    if(tex==='bassline'){                      // moving stepwise bass toward the next chord's root
      const nextR = b<nbars-1 ? CHm[prog[b+1]].b : 0; let cur=degs[0];
      let lastDir = Math.sign(nextR-degs[0]) || 1;   // same reasoning as the grade-2 bassline (one engine): approach direction drives the neighbour on early arrival, lower neighbour when there is no ground to cover
      for(let i=0;i<nbeats;i++){ addN(degPitch(cur), beatLen);
        if(i<nbeats-1){ let step=Math.sign(nextR-cur);
          if(step===0) step=-lastDir; else lastDir=step;
          cur = clamp(cur+step, span); } }
      return;
    }
    if(tex==='broken'){                        // half arpeggio (leaps), half a STEPWISE scale fragment (passing tones)
      const nsub = compound ? Math.round(barU/0.5) : nbeats, sublen = compound ? 0.5 : beatLen;   // COMPOUND: eighths, so the broken chord rocks instead of collapsing to dotted crotchets
      const root0 = ((degs[0]%7)+7)%7;
      if(chance(.25)){                         // stepwise scale run: kept the MINORITY — a scalar bass reads as a
                                               // melody and competes with the tune; an accompaniment should mostly
                                               // arpeggiate chord tones (leaps within the chord), so it stays supportive
        // The scalar bass RUN is a connective motion, so it LEADS toward the next chord's root - the direction a composer
        // writes a passing bass, not a flip. If the next root shares this chord's pitch-class (no functional pull), take
        // the lower neighbour: bass embellishments descend. (Reflected back inside the ±4 window below, so it stays local.)
        const nextRoot0 = (b<nbars-1 && CHORD_DEG[mode][prog[b+1]]) ? ((CHORD_DEG[mode][prog[b+1]][0]%7)+7)%7 : root0;
        const upSteps = ((nextRoot0-root0)%7+7)%7;
        let cur=clamp(root0,span), dir = (upSteps>=1 && upSteps<=3) ? 1 : -1; const seq=[];
        for(let i=0;i<nsub;i++){ seq.push(cur);
          let nxt=cur+dir; if(nxt<0 || nxt>span || Math.abs(nxt-root0)>4){ dir=-dir; nxt=cur+dir; } cur=clamp(nxt,span); }
        seq.forEach(dg=>addN(degPitch(dg), sublen));
      } else {                                 // arpeggio over the chord tones (leaps), no immediate repeats
        const seq=[]; for(let i=0;i<nsub;i++){ let p=pool[brokenShape[i%brokenShape.length] % pool.length] ?? bassP;
          if(i>0 && p===seq[i-1]){ const a=pool.find(x=>x!==p); if(a!=null) p=a; } seq.push(p); }
        seq.forEach(p=>addN(p, sublen));
      }
      return;
    }
    // ---- CHARACTER GROOVES whose rests are INTRINSIC (not inserted): a struck bass/chord that LIFTS to
    // silence. This is where the dance bounce, the march crispness and the maestoso weight live. Grounded in
    // the ABRSM specimen books (the detached LH dance bass is the single commonest rest-source across them). ----
    const strikeN = (m,d,art,tup) => { const arr=Array.isArray(m)?m:[m]; const o={m,d}; if(tup) o.tup=tup; if(arr.some(p=>(((p%12)+12)%12)===ltPC)) o.alt='#'; if(art) o.art=art; lh.push(o); };
    const lift = d => { if(d>1e-9) lh.push({rest:true,d}); };
    const pahChord = () => chordVoiceUpper();   // the "pah" now draws from the voicing bank (varied + voice-led) instead of a fixed 2-note upper
    if(tex==='fig'){                 // draw a real rest-usage figure from the BANK and fill it with this bar's harmony.
      // Mostly the piece's primary figure (a groove stays a groove); ~1 bar in 5 a compatible neighbour for variety.
      const f = (figCands.length>1 && chance(0.22)) ? rnd(figCands) : (primaryFig || figCands[0]);
      // the groove keeps its own staccato detachment, but ACCENTS are NOT stamped on every bar's downbeat
      // (that makes an accent meaningless); they are placed centrally, sparingly, on notes that stand out.
      // A 'c' chord in an oom-pah is the "pah" (upper tones only — the 'b' slot already carries the root). A
      // bass-less STRUCK chord (maestoso/grand) has no such bass, so it CAN read rootless. But a 3rd+5th (sixth)
      // voicing is fine when the ROOT is somewhere — so only force the root into the left hand at the OPENING (to
      // establish the key) or when the MELODY doesn't already carry the root this bar; otherwise keep the sixth
      // voicing for variety.
      if(f){ const figHasBass = f.s.some(s=>s[0]==='b');
        const rootPC = (((accReg+off[clamp(degs[0],span)])%12)+12)%12;
        const melHasRoot = rh.some(n=>n.bar===b && !n.rest && (Array.isArray(n.m)?n.m:[n.m]).some(m=>(((m%12)+12)%12)===rootPC));
        const needRoot = b===0 || !melHasRoot;
        const fillRole = role => role==='b' ? bassP : (figHasBass ? pahChord() : (needRoot ? struck2() : pahChord()));
        for(const slot of f.s){
          if(slot[0]==='t3'){                               // eighth-triplet slot: ['t3', [r1,r2,r3], art?] — one beat as a \tuplet 3/2
            const roles=slot[1], art=slot[2];
            roles.forEach((role,ti)=>{ if(role==='r'){ lh.push({rest:true,d:1/3,tup:1}); return; }
              strikeN(fillRole(role), 1/3, (ti===0&&art&&art!=='->')?art:undefined, 1); });
            continue;
          }
          const [role,d,art]=slot; if(role==='r'){ lift(d); continue; }
          strikeN(fillRole(role), d, art==='->'?undefined:art); } return; }
      // (no figure fits this bar — fall through to the oom-pah default below)
    }
    // oom-pah (rootfifth / default): bass on the beat, the CHORD (from the voicing bank) above for the rest of the bar
    const [oh,ot]=barSplit(barU,beatLen);
    const upV = chordVoiceUpper(); let up = Array.isArray(upV)?upV:[upV];
    if(up.length && up[0] < LOWSPREAD) up = up.map(p=>p+12);   // low-register spread: lift the "pah" chord out of the mud so it isn't a clustered low 3rd over the bass
    let topN = up[up.length-1];
    // Avoid PARALLEL PERFECT 5ths/8ves between the outer voices of two consecutive chords (the classic V->vi
    // trap: bass and chord-top both step up keeping a 5th). Only this one parallel is a real fault — parallel
    // 3rds/6ths are fine and untouched. When it would happen, drop the 5th so the 3rd sits on top instead.
    if(prevOB!=null && bassP!==prevOB){
      const iv=(((topN-bassP)%12)+12)%12, piv=(((prevOT-prevOB)%12)+12)%12;
      if((iv===7||iv===0) && iv===piv && Math.sign(bassP-prevOB)===Math.sign(topN-prevOT)){
        const third = upperPs.find(p=>{ const q=(((p-bassP)%12)+12)%12; return q===3||q===4; });
        if(third!=null){ up=[third]; topN=third; }
      }
    }
    addN(bassP, oh); addN(up.length>1?up:up[0], ot);
    prevOB=bassP; prevOT=topN;
  });

  // ANTI-STATIC PEDAL (grade 2, non-swap): catch ANY texture that left the SAME held bass pitch on consecutive
  // whole bars — a dead repeated pedal (Matthew: bars 2-3 both a held dominant reads as a copied pattern). Break
  // each REPEAT into a same-chord arpeggio (same harmony, grade-legal). One held bar on its own is fine and stays.
  if(!wide && !swap){
    const rebar = () => { const bi=[]; let t=0,cur=[]; for(let i=0;i<lh.length;i++){ cur.push(i); t+=lh[i].d; if(t>=barU-1e-6){ bi.push(cur); cur=[]; t=0; } } if(cur.length)bi.push(cur); return bi; };
    const wholePitch = idxs => { if(idxs.length!==1) return null; const n=lh[idxs[0]]; return (!n.rest && !Array.isArray(n.m) && Math.abs(n.d-barU)<1e-6) ? n.m : null; };
    let barsIdx=rebar(), prevP=null;
    for(let b=0;b<barsIdx.length;b++){ const p=wholePitch(barsIdx[b]);
      if(p!=null && p===prevP && b<nbars-1 && prog[b] && CHm[prog[b]]){      // never the cadence bar
        lh.splice(barsIdx[b][0], 1, ...brokenOf(CHm[prog[b]], CHm[prog[b]].b));
        barsIdx=rebar(); prevP=null; continue;
      }
      prevP=p;
    }
  }

  // Grade 3 LH keeps its natural VARIED range; we only CAP THE TOP so it never climbs above the
  // grade. Cap PER BAR as a unit (not per note) so the whole figure shifts together and the bass
  // stays the lowest note — capping notes independently can drop the chord below its own root,
  // which inverts the voicing and throws the metric weight onto the wrong beat.
  if(wide && !swap){
    const hiOf = n => Array.isArray(n.m) ? Math.max(...n.m) : n.m;
    const loOf = n => Array.isArray(n.m) ? Math.min(...n.m) : n.m;
    // The ceiling must track WHERE THE MELODY SITS IN THIS BAR — not the global melody minimum. Using the global
    // low note lets ONE low cadence note (a D4) drag the LH ceiling down across the whole piece, which then shoves
    // bars where the tune is actually HIGH down an octave into the mud (Matthew's bar 6: a D3+B3 sixth becoming a
    // D2+B2, a C#4+E4 third becoming C#3+E3). Per-bar ceiling + a hard FLOOR keep the LH in a healthy register.
    const FLOOR = 43;                                              // G2 — the LH never sits below this (low 3rds/6ths are mud)
    const globalRhMin = Math.min(...rh.filter(n=>!n.rest).map(loOf));
    const capBar = (bar, bi) => { const sounded = bar.filter(n=>!n.rest); if(!sounded.length) return;
      const barMel = rh.filter(n=>!n.rest && n.bar===bi).map(loOf);
      const rhMin = barMel.length ? Math.min(...barMel) : globalRhMin;
      const ceil = Math.min(rhMin - 2, 64);                        // below THIS bar's tune floor, never above ~E4
      let sh=0; while(Math.max(...sounded.map(hiOf)) - sh*12 > ceil) sh++;        // shift DOWN until it clears the tune
      while(sh>0 && Math.min(...sounded.map(loOf)) - sh*12 < FLOOR) sh--;         // but never push it below the mud floor
      if(sh) for(const n of bar){ if(!n.rest) n.m = Array.isArray(n.m) ? n.m.map(x=>x-12*sh) : n.m-12*sh; }
      let up=0; while(Math.min(...bar.filter(n=>!n.rest).map(loOf)) + up*12 < FLOOR
                   && Math.max(...bar.filter(n=>!n.rest).map(hiOf)) + (up+1)*12 <= ceil) up++;  // lift out of the mud if headroom allows
      if(up) for(const n of bar){ if(!n.rest) n.m = Array.isArray(n.m) ? n.m.map(x=>x+12*up) : n.m+12*up; }
      // A close 3rd sitting low is muddy even ABOVE the absolute floor (Matthew: A2+C#3 in the penultimate bar).
      // Open any low 3rd to a 6th by lifting its LOWER note an octave, as long as the new top clears the melody.
      const TFLOOR = 50;                                           // D3 — below this a struck 3rd reads as mud
      for(const n of bar){ if(n.rest || !Array.isArray(n.m) || n.m.length!==2) continue;
        const lo2=Math.min(...n.m), hi2=Math.max(...n.m);
        if((hi2-lo2===3 || hi2-lo2===4) && lo2 < TFLOOR && (lo2+12) <= ceil) n.m = [hi2, lo2+12].sort((a,b)=>a-b); }
    };
    let cur=[], t=0, bi=0;
    for(const n of lh){ cur.push(n); t+=n.d; if(Math.abs(t % barU) < 1e-6){ capBar(cur, bi); cur=[]; bi++; } }
    if(cur.length) capBar(cur, bi);
  }
  if(wide && swap){                                               // LH-melody pieces: the accomp is on TOP -> FLOOR it above the tune
    const hiOf = n => Array.isArray(n.m) ? Math.max(...n.m) : n.m;
    const loOf = n => Array.isArray(n.m) ? Math.min(...n.m) : n.m;
    const melMax = Math.max(...rh.filter(n=>!n.rest).map(hiOf));   // rh = melody (sits on the bass staff when swapped)
    const floor = melMax + 2;                                      // accomp bottom stays a tone above the melody top
    let cur=[], t=0;
    const floorBar = bar => { const sounded = bar.filter(n=>!n.rest); if(!sounded.length) return;
      let sh=0; while(Math.min(...sounded.map(loOf)) + sh*12 < floor) sh++;
      if(sh) for(const n of bar){ if(!n.rest) n.m = Array.isArray(n.m) ? n.m.map(x=>x+12*sh) : n.m+12*sh; }
    };
    for(const n of lh){ cur.push(n); t+=n.d; if(Math.abs(t % barU) < 1e-6){ floorBar(cur); cur=[]; } }
    if(cur.length) floorBar(cur);
  }

  // V7 -> I RESOLUTION GUARD: the added dominant 7th (the subdominant degree) must step DOWN to the tonic's 3rd.
  // If the tonic bar's opening chord doesn't already carry that 3rd just below the 7th (some voicings state only
  // root+5th), drop it in - replacing the nearest non-bass voice - so the 7th resolves down instead of dangling up
  // (the "7th resolving up" fault). Runs on final pitches, after the register caps.
  if(dom7Bars.size && !swap){
    const tpc=((rhTonic%12)+12)%12; const third3=(tpc + (mode==='min'?3:4))%12; const sub7=(tpc+5)%12;
    for(const b of dom7Bars){
      let t=0, lastB=-1, firstN=-1;
      for(let i=0;i<lh.length;i++){ const bi=Math.floor(t/barU+1e-9); if(bi===b && !lh[i].rest) lastB=i; if(bi===b+1 && firstN<0 && !lh[i].rest) firstN=i; t+=lh[i].d; }
      if(lastB<0||firstN<0) continue;
      const sevArr=(Array.isArray(lh[lastB].m)?lh[lastB].m:[lh[lastB].m]).filter(p=>((p%12)+12)%12===sub7);
      if(!sevArr.length) continue; const sev=Math.max(...sevArr);
      let tgt=null; for(let s=1;s<=2;s++){ if((((sev-s)%12)+12)%12===third3){ tgt=sev-s; break; } }  // the tonic 3rd a step below the 7th
      if(tgt==null) continue;
      const ev=lh[firstN]; const arr=Array.isArray(ev.m)?ev.m.slice():[ev.m];
      if(arr.some(p=>(((p%12)+12)%12)===third3 && Math.abs(p-sev)<=2)) continue;   // already resolves down to a nearby 3rd
      const bassp=Math.min(...arr); let repl=-1,rd=99;
      for(let i=0;i<arr.length;i++){ if(arr[i]===bassp) continue; if(Math.abs(arr[i]-tgt)<rd){ rd=Math.abs(arr[i]-tgt); repl=i; } }
      if(repl>=0) arr[repl]=tgt; else arr.push(tgt);
      ev.m = arr.length>1 ? [...new Set(arr)].sort((a,b)=>a-b) : arr[0];
    }
  }

  // INNER COUNTER-LINE: a chord left RINGING for a long span (>=2 beats) in a non-structural bar reads as dead - it
  // is where the static third, the missing inner voice and the "samey harmony" all live. Animate it: hold the lower
  // voice(s) as the harmonic anchor and move the TOP voice across the span, biased CONTRARY to the melody, between
  // CHORD TONES (an inner arpeggio) with the odd diatonic neighbour, resolving to a chord tone. Real two-part
  // writing rather than a held block. Diatonic + resolving so it can't fault; the sampler rejects any tune clash.
  // Post-pass so it catches every texture (figure, oom-pah, sustained), not just one code path. Chance-gated, and
  // a plain held chord still happens (stillness is right for some characters/bars).
  if(wide && !swap && !compound && !globalThis.__NOCTR){
    const stpc=((rhTonic%12)+12)%12;
    const scaleSet=new Set(KEYSCALE[mode].map(d=>(((stpc+d)%12)+12)%12));
    const chordPCs=b=>{ const c=CHm[prog[b]]; if(!c) return new Set(); const r=(((c.b)%7)+7)%7;
      return new Set([r,(r+2)%7,(r+4)%7].map(dg=>(((stpc+KEYSCALE[mode][dg])%12)+12)%12)); };
    const nbr=(p,dir)=>{ for(let s=1;s<=2;s++){ const c=p+dir*s; if(scaleSet.has(((c%12)+12)%12)) return c; } return null; };
    const ctToward=(p,dir,cPC,floorP,ceilP)=>{ for(let s=1;s<=5;s++){ const c=p+dir*s; if(c>floorP && c<=ceilP && cPC.has(((c%12)+12)%12)) return c; } return null; };
    // melody top per bar (for a contrary bias + a register ceiling so the inner line stays under the tune)
    const melByBar={}; { let t=0; for(const n of rh){ if(!n.rest){ const b=Math.floor(t/barU+1e-9); (melByBar[b]??=[]).push(Array.isArray(n.m)?Math.max(...n.m):n.m); } t+=n.d; } }
    // A CONTINUOUS inner voice, not a per-bar neighbour: track where the line left off (innerPrev) and, each held
    // span, WALK it stepwise toward a TARGET chord tone chosen CONTRARY to the melody - through diatonic passing tones,
    // staying between the anchor and the tune. Start and end land on chord tones (consonant); the passing tones in
    // between are approached+left by step. This traces a real countermelody bar-to-bar. A non-animated bar breaks the
    // line (innerPrev reset), so it re-starts cleanly. Diatonic + stepwise so it can't fault; the sampler rejects clashes.
    const out=[]; let t=0; let innerPrev=null;
    for(const n of lh){ const b=Math.floor(t/barU+1e-9);
      const structural=(b===0||b===half||b===nbars-1);
      const nb=Math.round(n.d/beatLen);
      if(!structural && Array.isArray(n.m) && n.m.length>=2 && nb>=3 && chance(0.6)){
        const anchor=n.m.slice(0,-1).sort((a,b)=>a-b); const anchorTop=anchor.length?anchor[anchor.length-1]:Math.min(...n.m); const topN=Math.max(...n.m);
        const mel=melByBar[b]||[]; const melDir=mel.length>=2?Math.sign(mel[mel.length-1]-mel[0]):0;
        const cPC=chordPCs(b); const floor=anchorTop+2, ceil=(mel.length?Math.min(...mel):topN+7)-1;
        if(ceil<floor){ out.push(n); t+=n.d; innerPrev=null; continue; }   // no room under the tune -> stay held
        let start = (innerPrev!=null && innerPrev>=floor && innerPrev<=ceil && cPC.has(((innerPrev%12)+12)%12)) ? innerPrev : Math.max(floor,Math.min(ceil,topN));
        // contrary motion to the tune; when the tune is FLAT over the bar (no direction to oppose) the inner line drifts
        // toward the centre of its own band, staying in range - reasoned from where the line sits, never a coin
        const cDir = -melDir || (Math.sign(Math.round((floor+ceil)/2) - start) || -1);
        let target = ctToward(start, cDir, cPC, floor-1, ceil) ?? ctToward(start, -cDir, cPC, floor-1, ceil) ?? start;
        const line=[]; let cur=start;
        for(let i=0;i<nb;i++){
          if(i===nb-1){ line.push(target); break; }
          const dir=Math.sign(target-cur);
          let nx = dir!==0 ? (nbr(cur,dir) ?? cur) : (nbr(cur,cDir) ?? cur);   // step toward the target; if arrived, drift contrary
          if(nx<floor||nx>ceil) nx=cur;
          if((dir>0&&nx>target)||(dir<0&&nx<target)) nx=target;
          cur=nx; line.push(cur);
        }
        if(line.every(v=>v===start) && start===topN){ out.push(n); t+=n.d; innerPrev=topN; continue; }   // nothing moved -> leave held
        for(let i=0;i<nb;i++){ out.push({m:[...anchor,line[i]].sort((a,b)=>a-b), d:beatLen, ...(n.art?{art:n.art}:{})}); }
        innerPrev=target; t+=n.d; continue;
      }
      innerPrev=null;
      out.push(n); t+=n.d;
    }
    lh.length=0; lh.push(...out);
  }

  // WALKING / PASSING BASS: stop the bass from only stamping chord roots. Where it would LEAP a 3rd..5th into the
  // next bar's downbeat, step a diatonic pickup into that downbeat, using the space already at the end of the bar
  // (a trailing groove rest, or the tail of a whole-bar sustained bass). Diatonic and brief, so it walks the bass
  // LINE into the chord rather than jumping to it - a real connector, nothing that changes the harmony. Capped per
  // piece and chance-gated so it stays a tasteful touch, not a mechanical every-bar tic; the sampler's harmony
  // checks reject any that would clash. Grade 3+ block/oom-pah/sustained textures (not swap, not the figure bank's
  // own running basses, which already move).
  if(wide && !swap && !globalThis.__NOWALK){
    const tpc=((rhTonic%12)+12)%12;
    const scalePCs=KEYSCALE[mode].map(d=>(((tpc+d)%12)+12)%12);
    const inScale=m=>scalePCs.includes(((m%12)+12)%12);
    const low=n=>Array.isArray(n.m)?Math.min(...n.m):n.m;
    const pd=0.5;                                                   // a quaver pickup
    let budget=Math.max(1, Math.round(nbars/3));                    // a few per piece, never wall-to-wall
    for(let b=0;b<nbars-1 && budget>0;b++){
      let t=0, downB=-1, lastB=-1, firstN=-1;
      for(let i=0;i<lh.length;i++){ const bi=Math.floor(t/barU+1e-9);
        if(bi===b){ if(downB<0 && !lh[i].rest) downB=i; lastB=i; }
        if(bi===b+1 && firstN<0 && !lh[i].rest) firstN=i;
        t+=lh[i].d; }
      if(downB<0||lastB<0||firstN<0) continue;
      const toBass=low(lh[firstN]), curDown=low(lh[downB]);
      const gap=toBass-curDown; if(Math.abs(gap)<3 || Math.abs(gap)>7) continue;   // only bridge a real leap
      if(!chance(0.5)) continue;
      const dir=Math.sign(gap);
      let pt=null; for(let s=1;s<=2;s++){ const c=toBass-dir*s; if(c>=43 && c<58 && inScale(c)){ pt=c; break; } }  // diatonic step into the target, in the bass register
      if(pt==null) continue;
      const last=lh[lastB];
      if(last.rest && last.d>=pd-1e-9){                             // fill a trailing groove rest with the pickup
        if(Math.abs(last.d-pd)<1e-9) lh[lastB]={m:pt,d:pd};
        else { last.d-=pd; lh.splice(lastB+1,0,{m:pt,d:pd}); }
        budget--;
      } else if(!last.rest && !Array.isArray(last.m) && last.d>=pd*2-1e-9 && low(last)===curDown){  // split a whole-bar sustained bass tail
        last.d-=pd; lh.splice(lastB+1,0,{m:pt,d:pd});
        budget--;
      }
    }
  }

  // ============================ REST REALISATION ============================
  // Realise the committed rest intent (restMoves / restIntent) now that BOTH hands exist, so every rest is
  // placed RELATIONALLY — the reason a stray rest can't appear out of character. Each move is coherent BY
  // CONSTRUCTION, its guard rejecting the incoherent cases (a voice must keep sounding unless the fabric lifts
  // both hands together; no stranded sub-beat below a quaver; never silence a bar's only harmony statement).
  // Moves fire only where the phrase/harmony plan calls for them, capped by the intent, so a rest is never a
  // per-beat accident. Applied to the melody (rh); the LH already carries its groove rests. Anything that still
  // slips through is caught by validate() in the outer sampler.
  if(restMoves.size && restIntent>0.02){
    const EPS=1e-6;
    const lhBars=[]; { let t=0; for(const n of lh){ const bi=Math.floor(t/barU+EPS); (lhBars[bi]??=[]).push({pos:t-bi*barU,d:n.d,rest:!!n.rest}); t+=n.d; } }
    const lhSounds=(bar,a,b2)=>(lhBars[bar]||[]).some(e=>!e.rest && e.pos<b2-EPS && e.pos+e.d>a+EPS);   // a voice continues under the RH rest
    const lhOnset =(bar,pos)=>(lhBars[bar]||[]).some(e=>!e.rest && Math.abs(e.pos-pos)<EPS);            // LH strikes this beat (syncopation reference)
    const lhRestOf=(bar)=>(lhBars[bar]||[]).find(e=>e.rest && e.d>=0.5);                                // an LH lift to align to
    const lhGapped=(bar)=>(lhBars[bar]||[]).some(e=>e.rest);                                            // LH is detached this bar
    const barsRH=[]; for(const n of rh){ (barsRH[n.bar]??=[]).push(n); }
    const posList = arr => { let p=0; return arr.map(n=>{ const o={n,pos:p}; p+=n.d; return o; }); };
    const single=n=>!n.rest && !Array.isArray(n.m);
    let applied=0; const MAXR=Math.max(1, Math.round(nbars*restIntent));
    for(let b=0;b<nbars-1 && applied<MAXR;b++){                       // never touch the final cadence bar
      const notes=barsRH[b]; if(!notes||!notes.length) continue;
      if(!chance(Math.min(0.85, restIntent+0.15))) continue;         // restraint: not every eligible bar
      const boundary = (b===half-1) || (b===nbars-2);
      let did=false;
      // 1) BREATH at a phrase boundary — the melody lifts early into the next phrase; the LH keeps sounding.
      if(restMoves.has('breath') && boundary){
        const last=[...notes].reverse().find(n=>single(n)&&!n.slur);
        // A quaver breath, taken ONLY off a note long enough to spare it - the note it leaves must still be at
        // least a full beat. Otherwise a plain crotchet gets chopped into a quaver + rest, which reads as an
        // incoherent hole in a lyrical line rather than a breath (Matthew: bar-4 Eb over a sounding LH).
        if(last){ const beat=compound?1.5:1; const br=0.5;
          if(last.d-br>=beat && lhSounds(b, barU-br, barU)){ last.d-=br; notes.splice(notes.indexOf(last)+1,0,{rest:true,d:br,bar:b}); did=true; } }
      }
      // 2) LIFT — both hands go silent together on a weak part of the bar (weighty). Align the RH to the LH rest.
      if(!did && restMoves.has('lift') && b>0){
        const lr=lhRestOf(b);
        if(lr && lr.pos>=beatLen-EPS){ const pl=posList(notes);
          const hit=pl.find(o=>single(o.n)&&o.pos<=lr.pos+EPS && o.pos+o.n.d>=lr.pos+lr.d-EPS);
          if(hit){ const lead=lr.pos-hit.pos, tail=(hit.pos+hit.n.d)-(lr.pos+lr.d);
            if((lead<=EPS||lead>=0.5) && (tail<=EPS||tail>=0.5)){
              const repl=[]; if(lead>0.5-EPS) repl.push({...hit.n,d:lead});
              repl.push({rest:true,d:lr.d,bar:b});
              if(tail>0.5-EPS) repl.push({m:hit.n.m,d:tail,bar:b});
              notes.splice(notes.indexOf(hit.n),1,...repl); did=true; } } }
      }
      // 3) OFFBEAT (pointillist) — a quaver lifts to a rest, giving the RH the same bounce as the detached LH.
      // The lifted note must itself be OFF the beat: silencing a note that sits ON a beat (especially the mid-bar
      // beat) punches a hole in the pulse rather than adding an off-beat bounce (Matthew's Con moto bar-3 r16).
      if(!did && restMoves.has('offbeat') && lhGapped(b)){
        const pl=posList(notes);
        // R1: off the beat only (a beat onset must not be hidden). R2: a sub-quaver rest needs an established
        // sixteenth grid — allow silencing a sixteenth only when the bar actually runs sixteenths (>=3), else its
        // granularity is foreign to the piece.
        const barSixteenths = notes.filter(x=>!x.rest&&x.d<0.5-EPS).length;
        const cand=pl.filter(o=>single(o.n)&&o.n.d<=0.5&&o.pos>EPS&&o.pos+o.n.d<barU-EPS && Math.abs(o.pos%beatLen)>EPS
                              && (o.n.d>=0.5-EPS || barSixteenths>=3) && lhSounds(b,o.pos,o.pos+o.n.d));
        if(cand.length){ const o=rnd(cand); notes.splice(notes.indexOf(o.n),1,{rest:true,d:o.n.d,bar:b}); did=true; }
      }
      // 4) DISPLACE (syncopation, G4 only) — delay an inner-beat note so it enters OFF the beat over the LH strike.
      if(!did && restMoves.has('displace') && gp.rhythmDevices.syncopation){   // syncopation ← grade params (ABRSM: grade 5+, not grade 4)
        const pl=posList(notes);
        // R3: an on-beat rest is syncopation only if the displaced weight is FELT — the note must carry across the
        // NEXT strong beat (longer than a beat) and stay inside the bar (crosses the next beat, not the barline).
        // A note contained in its own beat would be a dropped note, not a syncopation. (Recurrence branch: TODO.)
        const cand=pl.filter(o=>single(o.n)&&o.n.d>beatLen+EPS&&o.pos+o.n.d<=barU+EPS&&Math.abs(o.pos%beatLen)<EPS&&o.pos>EPS&&lhOnset(b,o.pos));   // ON an inner beat of THIS metre (beat = beatLen, not integer)
        if(cand.length && chance(0.5)){ const o=rnd(cand); const keep=o.n.d-0.5;
          notes.splice(notes.indexOf(o.n),1,{rest:true,d:0.5,bar:b},{m:o.n.m,d:keep,bar:b,...(o.n.slur?{slur:o.n.slur}:{})}); did=true; }
      }
      if(did) applied++;
    }
    rh.length=0; for(let b=0;b<nbars;b++){ if(barsRH[b]) rh.push(...barsRH[b]); }
  }

  // CHROMATIC passing note — gated by the grade's chromatic BUDGET (gp.chromatic.budget), not grade===4. Inserted
  // BEFORE the expression engine so the phrase-aware dynamics can SEE it. An off-beat passing semitone between two
  // notes a tone apart; a quaver taken off the first note, spelled by direction (ascending sharp, descending flat).
  if(gp.chromatic.budget>0 && chance(0.5)){
    // The note the chromatic DEPARTS FROM must sit on a STRONG beat, so the ear feels stability before the
    // chromatic slips by on the following weaker beat. Inserting it off a weak beat (e.g. beat 2 of a 3/4)
    // leaves the figure with no metric floor and reads as an odd placement (Matthew's catch on #2 bar 7).
    const strongBeats = compound ? [0,1.5] : (Math.abs(barU-4)<1e-9 ? [0,2] : [0]);
    const onStrong = pos => strongBeats.some(s=>Math.abs((((pos%barU)+barU)%barU)-s)<1e-9);
    // the chromatic note must not CLASH with the LH: a semitone or tritone against a sounding LH note makes a
    // diminished/dissonant vertical (Matthew's bar-5 catch, the chromatic against the LH's G+Bb). Check the LH
    // pitches actually sounding at the chromatic note's position.
    const lhAt = time => { const out=[]; let tt=0; for(const n of lh){ if(!n.rest && tt<=time+1e-9 && tt+n.d>time+1e-9) (Array.isArray(n.m)?n.m:[n.m]).forEach(m=>out.push(m)); tt+=n.d; } return out; };
    const chromClashes = (pitch,at) => lhAt(at).some(m=>{ const ic=(((pitch-m)%12)+12)%12, s=Math.min(ic,12-ic); return s===1||s===6; });
    // A chromatic passing tone connects TWO chord tones — it is the only dissonance, framed by consonances on
    // BOTH sides. So both the note it departs from AND the note it resolves to must be chord tones of the harmony
    // under each. Checking against the TRIAD (root/3rd/5th) also excludes tendency tones (a 7th/4th): ascending
    // away from the dominant's 7th fights its downward pull and reads as forced (Matthew's D->D#->E over E).
    const chordTri = ch => { const c=CHm[ch]; if(!c) return null; const r=(((c.b)%7)+7)%7; return new Set([r,(r+2)%7,(r+4)%7]); };
    const chordAtPos = (ba,posInBar) => (prog2[ba] && posInBar >= changePos[ba]-1e-9) ? prog2[ba] : prog[ba];
    const isChordToneAt = (m,ba,posInBar) => { const d=degOf(m); if(d<0) return false; const s=chordTri(chordAtPos(ba,posInBar)); return !!s && s.has(((d%7)+7)%7); };
    const spots=[]; let t=0;
    for(let i=0;i<rh.length-1;i++){ const a=rh[i], b2=rh[i+1]; const pos=t; t+=a.d;
      if(a.rest||b2.rest||Array.isArray(a.m)||Array.isArray(b2.m)) continue;
      const ba=Math.floor(pos/barU+1e-9), bpos=pos+a.d, bb=Math.floor(bpos/barU+1e-9);
      if(Math.abs(b2.m-a.m)===2 && a.d>=1 && onStrong(pos)
         && isChordToneAt(a.m, ba, pos-ba*barU) && isChordToneAt(b2.m, bb, bpos-bb*barU)   // both endpoints chord tones
         && !chromClashes(a.m+Math.sign(b2.m-a.m), pos+a.d-0.5)) spots.push(i); }
    if(spots.length){ const i=spots[Math.floor(Math.random()*spots.length)], a=rh[i], b2=rh[i+1];
      const dir=Math.sign(b2.m-a.m); const chromDur=0.5, firstDur=a.d-chromDur;
      if(firstDur>=0.5){ a.d=firstDur; rh.splice(i+1,0,{ m:a.m+dir, d:chromDur, alt: dir>0?'#':'b' }); } }
  }

  // FAITHFUL RESTATEMENT: a parallel period restates the opening idea, then diverges only at the cadence. The
  // decoration passes above hit the antecedent and its restated copy INDEPENDENTLY and drift them apart, hiding
  // the motif. Re-sync the restated bar to bar 0's FINAL form — but only when bar 0 is a real basic idea (>=2
  // sung notes), never a lone held opening note. Removes no device: held notes and decorations both remain.
  if(restate){
    const idxOfBar = k => { const out=[]; let tt=0; for(let i=0;i<rh.length;i++){ const bi=Math.floor(tt/barU+1e-9); if(bi===k) out.push(i); tt+=rh[i].d; } return out; };
    const b0=idxOfBar(0), bH=idxOfBar(half);
    if(bH.length && b0.filter(i=>!rh[i].rest).length>=2){
      const copy=b0.map(i=>({...rh[i], bar:half}));   // bar 0's final notes (pitches+durs+decorations), re-tagged
      rh.splice(bH[0], bH.length, ...copy);
    }
  }

  // REPAIR — enforce "a leap lands on a chord tone" (Matthew's rule). Reads the melody the way the EAR (and the
  // theory critic) does: on the SUNG line, skipping rests, and only where an accompaniment is actually sounding —
  // so a dissonance judged "resolved" or a hammered run is decided by the next SOUNDING note, not the raw array
  // neighbour (a rest between two identical pitches still sounds hammered; a non-chord tone that resolves by step
  // ACROSS a rest is still resolved). Valid appoggiaturas (leap in, step out), passing/neighbour tones, suspensions
  // and 1-2 note repeats are all left untouched, and an UNACCOMPANIED note (no harmony under it) is never a wrong
  // note — so this removes only the actual error and narrows nothing.
  { const tpc=((rhTonic%12)+12)%12;
    const barPC = b => { const tri=ch=>{ const c=CHm[ch]; if(!c) return []; const r=(((c.b)%7)+7)%7;
        return [r,(r+2)%7,(r+4)%7].map(dg=>((((tpc+KEYSCALE[mode][dg])%12)+12)%12)); };
      const s=new Set(tri(prog[b])); if(prog2[b]) tri(prog2[b]).forEach(p=>s.add(p)); return s; };
    let tt=0; const barOf=[], posOf=[]; for(const n of rh){ const b=Math.floor(tt/barU+1e-9); barOf.push(b); posOf.push(tt-b*barU); tt+=n.d; }
    const top=x=>Array.isArray(x.m)?Math.max(...x.m):x.m;
    // strong-beat positions in the bar (same set the critic uses): leaping ONTO a strong-beat dissonance is one of
    // Matthew's genuine faults, so an anticipation doesn't excuse it.
    const strongPos = time==='4/4'?[0,2] : time==='6/8'?[0,1.5]
      : (()=>{ const bl=(time==='6/8'||time==='3/8')?1.5:1, o=[]; for(let p=0;p<barU-1e-9;p+=bl) o.push(p); return o; })();
    const onStrong = pos => strongPos.some(sp=>Math.abs(pos-sp)<1e-9);
    // accompaniment sounding-spans (the LH) -> which melody notes actually have harmony beneath them
    const spans=[]; { let a=0; for(const n of lh){ if(!n.rest) spans.push([a,a+n.d]); a+=n.d; } }
    let ta=0; const accAt=rh.map(n=>{ const on=spans.some(([s,e])=>ta>=s-1e-9 && ta<e-1e-9); ta+=n.d; return on; });
    const sung=[]; for(let i=0;i<rh.length;i++) if(!rh[i].rest) sung.push(i);   // indices of sounding melody notes
    // write a repaired pitch back onto a note, preserving a double-stop's lower CHORD tone when the new top still
    // sits a 3rd or more above it, otherwise collapsing the dyad to the single repaired note (so a snap can never
    // leave a harsh 2nd). A double-stop's MELODIC voice is its top note, so faults are judged and fixed there.
    const setTop=(n,val)=>{ if(Array.isArray(n.m)){ const lo=Math.min(...n.m); n.m = (val-lo>=3)?[lo,val]:val; } else n.m=val; };
    // (a) a NON-CHORD TONE that a chord is sounding under and that does NOT resolve by step (left by a LEAP or
    //     dangling into a rest) is a wrong note; snap to the nearest chord tone. Resolution is measured to the next
    //     SUNG note (rests skipped), and anticipations (repeat into a chord tone) are kept.
    //     Iterate to a FIXPOINT: snapping a note to a chord tone changes the interval INTO it, which can turn the
    //     previous note (that used to resolve by step into the old pitch) into a fresh escape tone. A single left-to-
    //     right pass leaves those; repeat until nothing more needs snapping. Each note only ever moves non-chord ->
    //     chord (chord tones are never re-flagged), so this converges in a few passes and narrows nothing.
    for(let guard=0; guard<8; guard++){ let changed=false;
      for(let s=0;s<sung.length;s++){ const i=sung[s], n=rh[i]; const cur=top(n);       // the melodic (top) voice, dyad or not
        if(!accAt[i]) continue;                                                         // unaccompanied -> nothing to clash with
        const ct=barPC(barOf[i]); if(ct.has(((cur%12)+12)%12)) continue;                // a chord tone -> fine
        const j=sung[s+1]; const nx=j!=null?top(rh[j]):null; const iv=nx!=null?Math.abs(nx-cur):99;
        const pj=sung[s-1]; const pv=pj!=null?top(rh[pj]):null; const leapIn=pv!=null && Math.abs(cur-pv)>2;
        const slammed = leapIn && onStrong(posOf[i]);                                   // leapt ONTO a strong-beat dissonance
        if(iv>=1 && iv<=2) continue;                                                    // resolves by step -> passing/neighbour/APPOGGIATURA (leap-in step-out is fine), kept
        if(iv===0 && j!=null && barPC(barOf[j]).has(((nx%12)+12)%12) && !slammed) continue;  // anticipation into a chord tone, but NOT when slammed onto a strong beat by leap
        let best=null,bd=99; for(let cand=cur-3;cand<=cur+3;cand++){ if(ct.has(((cand%12)+12)%12) && Math.abs(cand-cur)<bd){ bd=Math.abs(cand-cur); best=cand; } }
        if(best!=null && best!==cur){ setTop(n,best); changed=true; }
      }
      if(!changed) break;
    }
    // (b) break a HAMMERED run (>=3 identical SUNG pitches, rests skipped) — stylistically dead even though legal.
    //     Move the MIDDLE note of the run to a diatonic NEIGHBOUR so the three become V-N-V: that always resolves
    //     (N leaves by step back to V) and, unlike nudging the last note, never dangles. Prefer a chord tone within
    //     reach; otherwise the nearest step-away SCALE tone (a plain neighbour) — so a valid target ALWAYS exists,
    //     even when the repeated pitch is a chord root whose other chord tones are a 4th+ away. A single/double
    //     repeat is untouched, so the device is kept; only the dead hammering is removed.
    const scalePC=new Set(KEYSCALE[mode].map(d=>(((tpc+d)%12)+12)%12));
    const breakNote=(p,ct)=>{ for(const d of [-2,2,-1,1,-3,3]) if(ct.has((((p+d)%12)+12)%12)) return p+d;
      for(const d of [-1,1,-2,2]) if(scalePC.has((((p+d)%12)+12)%12)) return p+d; return null; };
    for(let s=2;s<sung.length;s++){ const mid=sung[s-1];
      const a=top(rh[sung[s-2]]), b=top(rh[mid]), c=top(rh[sung[s]]);
      if(a===b && b===c){ const nn=breakNote(b, barPC(barOf[mid])); if(nn!=null) setTop(rh[mid], nn); }
    }
    // (c) AGOGIC ALIGNMENT (COMPOSITION-SPEC §12): the LONG note should be a chord tone, not a non-chord connector.
    //     If a non-chord tone OFF the beat is LONGER than the chord tone immediately before it, the ear hears the
    //     long non-chord as the harmony and the short chord tone as an appoggiatura leaning in - a clash. Swap their
    //     durations so the chord tone carries the weight and the connector is quick. ON-beat non-chord tones
    //     (appoggiaturas) are left alone - a long lean on the beat is a desirable device.
    for(let s=1;s<sung.length;s++){ const i=sung[s-1], j=sung[s];
      if(j!==i+1) continue;                                                  // must be adjacent (no rest between)
      const a=rh[i], b=rh[j]; if(Array.isArray(a.m)||Array.isArray(b.m)) continue;
      if(!accAt[j]) continue;                                                // unaccompanied non-chord tone can't clash
      const aCT = barPC(barOf[i]).has(((top(a)%12)+12)%12);
      const bCT = barPC(barOf[j]).has(((top(b)%12)+12)%12);
      if(aCT && !bCT && b.d > a.d + 1e-9 && !onStrong(posOf[j])){ const d=a.d; a.d=b.d; b.d=d; }   // swap: chord tone gets the long value
    }
  }

  // UNEVEN REPEAT (COMPOSITION-SPEC §12): a repeated pitch across an UNEVEN pair - a semiquaver into a LONGER note of
  // the SAME pitch - reads as a rhythmic stutter (a short connecting note should MOVE, not repeat). Merge such a pair
  // into one clean note, keeping the earlier note's markings, so the pitch sits on an even value and the line moves on.
  // EQUAL-value repeats (two quavers, two crotchets) are untouched - a gentle repeat is fine.
  {
    const tpc=((rhTonic%12)+12)%12;
    const scaleSet=new Set(KEYSCALE[mode].map(d=>(((tpc+d)%12)+12)%12));
    const chordPCs=b=>{ const c=CHm[prog[b]]; if(!c) return new Set(); const r=(((c.b)%7)+7)%7;
      return new Set([r,(r+2)%7,(r+4)%7].map(dg=>(((tpc+KEYSCALE[mode][dg])%12)+12)%12)); };
    const pcOf=m=>((m%12)+12)%12;
    if(time==='3/8'){
      // 3/8: merging a stutter makes a dotted-eighth that pairs into a DUPLE against the triple metre, so instead
      // MOVE the semiquaver to a diatonic CHORD-tone step (differing from both neighbours) - metre-safe and, being a
      // chord tone, can't become an unresolved non-chord. Skip mid-bar-change bars; leave the rare unmovable one.
      let tt=0; const barAt=[], posAt=[]; for(const n of rh){ const b=Math.floor(tt/barU+1e-9); barAt.push(b); posAt.push(tt-b*barU); tt+=n.d; }
      for(let i=0;i<rh.length-1;i++){ const a=rh[i], b=rh[i+1];
        if(a.rest||b.rest||Array.isArray(a.m)||Array.isArray(b.m)||a.m!==b.m) continue;
        const shortI=(a.d<=b.d)?i:i+1; if(rh[shortI].d>0.25+1e-9 || prog2[barAt[shortI]]) continue;
        const p=rh[shortI].m;
        let lo=shortI-1; while(lo>=0 && (rh[lo].rest||Array.isArray(rh[lo].m))) lo--;
        let hi=shortI+1; while(hi<rh.length && (rh[hi].rest||Array.isArray(rh[hi].m))) hi++;
        const before=lo>=0?rh[lo].m:null, after=hi<rh.length?rh[hi].m:null;
        const cPC=chordPCs(barAt[shortI]);
        // move to a diatonic CHORD-tone step differing from both neighbours - safe at any position (a chord tone is
        // never an unresolved dissonance). If none is within reach, leave the (rare) stutter rather than risk a fault.
        for(const d of [2,-2,1,-1]){ const cc=p+d;
          if(scaleSet.has(pcOf(cc)) && cc!==before && cc!==after && cPC.has(pcOf(cc))){ rh[shortI].m=cc; break; } }
      }
    } else {
      // other metres: MERGE the adjacent semiquaver same-pitch pair into one clean note (proven faultless + tidy).
      const out=[]; for(const n of rh){ const prev=out[out.length-1];
        if(prev && !prev.rest && !n.rest && !Array.isArray(prev.m) && !Array.isArray(n.m) && prev.m===n.m && (prev.d<=0.25||n.d<=0.25)){ prev.d+=n.d; continue; }
        out.push(n); }
      rh.length=0; rh.push(...out);
    }
  }

  // ---- EXPRESSION ENGINE: character-matched (tempo/prof chosen up front), contour-aware, varied ----
  // dynamic level matched to character (soft for cantabile, fuller for lively)
  // Dynamic ladder is GRADE-SCALED to the syllabus (gp.expression.dynamics): grades 2-4 span pp..f; ff is a
  // grade-5 addition. Building DL from the grade is what keeps ff (and any future higher mark) OUT of the lower
  // grades — every +step in the scheme below clamps to DL's ceiling, so no crescendo can overshoot the grade.
  const FULLDL=['pp','p','mp','mf','f','ff'];
  const DL = FULLDL.filter(d => ((gp.expression && gp.expression.dynamics) || FULLDL).includes(d));
  const _rankDL=d=>FULLDL.indexOf(d);
  const clampToDL=d=>{ if(!d||DL.includes(d)) return d; const r=_rankDL(d); let best=DL[0]; for(const x of DL) if(Math.abs(_rankDL(x)-r)<Math.abs(_rankDL(best)-r)) best=x; return best; };
  // Opening level from the CHARACTER's own authored dynamic band (character.dyn) - a Maestoso opens full, a Cantabile
  // soft - not a coarse 4-way profile bucket (that field was authored but never read). clampToDL keeps it in the grade range.
  rh[0].dyn = clampToDL(rnd((character.dyn && character.dyn.length) ? character.dyn : (prof==='legato'?['pp','p','mp'] : prof==='light'?['mp','mf','f'] : ['pp','p','mp','mf'])));

  const nb = noteBarsOf(rh, barU);
  const idxInBars=(lo,hi)=>rh.map((_,i)=>i).filter(i=>nb[i]>=lo&&nb[i]<=hi);

  // DYNAMIC SCHEME — chosen per piece from several genuinely different shapes, so dynamics stop collapsing to the
  // same "a level at bar 1, a level at the phrase-2 turn, hairpins for everything else" every time (Matthew's
  // catch). The change POINTS vary with the scheme (a peak, a random inner bar, a sudden event, the cadence run),
  // not fixed to bars 1 and 5. Character biases which schemes are likely: a legato piece breathes in long arcs;
  // a bright/bold one terraces or drops a subito surprise.
  const dstep=(d,s)=>{ const i=DL.indexOf(d); return i<0?d:DL[Math.max(0,Math.min(DL.length-1,i+s))]; };
  const stepDyn=(d,s)=>{ let n=dstep(d,s); if(n!==d) return n; n=dstep(d,-s); return n!==d?n:d; };   // guaranteed a DIFFERENT level: flips direction at the floor/ceiling so a contrast never collapses to the same mark (Matthew: three pp in a row)
  const firstOf=b=>idxInBars(b,b)[0];
  const lastOf =b=>{ const a=idxInBars(b,b); return a[a.length-1]; };
  const setDyn=(b,d)=>{ const i=firstOf(b); if(i!=null && d) rh[i].dyn=d; };
  // GESTURE: dynamics follow how OPEN the texture is per bar - the vertical span from the top melody note down to
  // the lowest bass note. The sound swells as the hands SPREAD and eases as they CLOSE IN, so a crescendo aims at
  // the widest, fullest bar and never lands where the hands converge (Matthew: right hand descending + left hand
  // ascending should get quieter, not louder). The span uses the top melody note, so a high melody still reads as
  // energy - this generalises the old pitch-peak logic instead of replacing what it got right.
  const rhHi=new Array(nbars).fill(null), lhLo=new Array(nbars).fill(null);
  { let t=0; for(const n of rh){ const b=Math.floor(t/barU+1e-9); if(b<nbars&&!n.rest){ const h=Array.isArray(n.m)?Math.max(...n.m):n.m; if(rhHi[b]==null||h>rhHi[b])rhHi[b]=h; } t+=n.d; } }
  { let t=0; for(const n of lh){ const b=Math.floor(t/barU+1e-9); if(b<nbars&&!n.rest){ const l=Array.isArray(n.m)?Math.min(...n.m):n.m; if(lhLo[b]==null||l<lhLo[b])lhLo[b]=l; } t+=n.d; } }
  // Dynamics FOLLOW THE INTENSITY CURVE (Matthew: full holistic reasoning, not a blanket contour rule). Intensity per
  // bar = melodic HEIGHT + harmonic TENSION (the tonic is rest; predominants lean; the dominant is the point of
  // greatest pull). A crescendo aims at the CLIMAX where these coincide; a diminuendo follows the release into the
  // cadence. So a falling line CAN still crescendo when the harmony tightens toward V - the harmony is the reason -
  // instead of being ruled out by a "rise=louder" blanket. Tension weighted ~3 semitones/unit so neither dominates.
  const HTEN = { I:0,i:0, vi:0.6,VI:0.6, iii:0.6,III:0.6, IV:1,iv:1, ii:1.2, V:2,v:1.6, 'V/V':2.4, 'ii°':1.6, vii:2,VII:2, 'vii°':2 };
  const energy = b => (rhHi[b]??72) + (HTEN[prog[b]] ?? 1)*3;
  let peakBar=0; for(let b=0;b<nbars;b++) if(energy(b)>energy(peakBar)) peakBar=b;
  const shapePhrase = (lo,hi) => {                        // cresc into the phrase's most OPEN bar, dim out (peak at an edge -> one-way)
    if(hi<=lo) return;
    let pk=lo; for(let b=lo;b<=hi;b++) if(energy(b)>energy(pk)) pk=b;
    const first=idxInBars(lo,lo)[0], pkN=idxInBars(pk,pk)[0], lastA=idxInBars(hi,hi), last=lastA[lastA.length-1];
    if(first==null||last==null||first===last) return;
    if(pk>lo && pk<hi){ rh[first].hp='\\<'; if(pkN!=null&&pkN!==first&&pkN!==last) rh[pkN].hp='\\!\\>'; rh[last].hp='\\!'; }
    else if(pk===lo){ const nx=idxInBars(Math.min(pk+1,hi),Math.min(pk+1,hi))[0] ?? first; rh[nx].hp='\\>'; rh[last].hp='\\!'; }
    else { rh[first].hp='\\<'; rh[last].hp='\\!'; }
  };
  const pool = prof==='legato' ? ['peaks','arc','arc','echo','sparse']
             : prof==='light'  ? ['terraced','subito','peaks','arc','terraced']
             :                    ['arc','terraced','peaks','subito'];
  // The dynamic SHAPE must be ENTAILED by the piece, not drawn from a profile lottery: echo needs a real restatement
  // to echo, subito a real seam/energy discontinuity, arc a single INTERIOR climax, terraced >=2 energy plateaus.
  // peaks/sparse always fit. The profile pool still sets the stylistic preference; entailment removes the unsupported.
  const eVals = Array.from({length:nbars},(_,b)=>energy(b));
  const interiorClimax = peakBar>0 && peakBar<nbars-1;
  const eJump = eVals.slice(1).some((v,i)=>Math.abs(v-eVals[i])>=5);
  const plateaus = new Set(eVals.map(v=>Math.round(v/4))).size;
  const schemeOK = s => s==='peaks' || s==='sparse'
    || (s==='echo' && restate)
    || (s==='subito' && (restate || eJump))
    || (s==='arc' && interiorClimax)
    || (s==='terraced' && plateaus>=2);
  const cand = pool.filter(schemeOK);
  // the dynamic SHAPE is a diversity choice across the book (dynamics don't affect note validity, so least-used is safe
  // here): among the shapes this piece can actually support (entailment above), take the one least-used in the collection.
  const scheme = pickLeastUsed(cand.length?cand:['peaks'], opts.hist && opts.hist.scheme);
  // a phrase earns an internal hairpin only when it has a real ARC to shape - an interior bar that opens wider than its
  // edges (energy rises then falls); an energy-flat phrase is left plain. Replaces the "sometimes shape" dice.
  const phraseArc = (lo,hi) => { if(hi<=lo) return false; let mx=lo; for(let b=lo;b<=hi;b++) if(energy(b)>energy(mx)) mx=b; return energy(mx) - Math.min(energy(lo),energy(hi)) >= 3; };

  if(scheme==='peaks'){                                   // the original phrase-peak shaping, now just ONE option
    shapePhrase(0, half-1);
    if(half<nbars){
      const firstB=idxInBars(half,half)[0];
      if(firstB!=null){ const echo = peakBar>=0 && peakBar < half;   // phrase 2 RECEDES (a softer echo) when the piece's climax sat in phrase 1; it BUILDS when the energy still rises into phrase 2. Reasoned from the intensity curve, not a die.
        let d2 = echo ? dstep(rh[0].dyn,-1) : dstep(rh[0].dyn,+1);
        if(d2===rh[0].dyn) d2 = dstep(rh[0].dyn, echo?1:-1);
        rh[firstB].dyn = d2; }
      const tensionInB = seq => { let t=0; return seq.some(n=>{ const b=Math.floor(t/barU+1e-9); t+=n.d; return b>=half && n.alt; }); };
      if(mode==='maj' && (tensionInB(rh) || tensionInB(lh))){                // chromatic tension in the consequent -> build to the cadence
        const c1=idxInBars(Math.min(half+1,nbars-1),Math.min(half+1,nbars-1))[0] ?? firstB;
        const lastA=idxInBars(nbars-1,nbars-1); const last=lastA[lastA.length-1], lb0=lastA[0];
        if(c1!=null && last!=null && c1!==last){ rh[c1].hp='\\<'; if(lb0!=null&&lb0!==c1) rh[lb0].hp='\\!\\>'; rh[last].hp='\\!'; }
      } else { shapePhrase(half, nbars-1); }
    }
  }
  else if(scheme==='arc'){                                // ONE long span: crescendo to the piece's peak, diminuendo out
    rh[0].dyn = dstep(rh[0].dyn, -1);                     // start a touch softer so the arc has room to grow
    const iPk=firstOf(peakBar), last=lastOf(nbars-1);
    if(iPk!=null && iPk!==0 && last!=null){ rh[0].hp='\\<'; rh[iPk].hp='\\!\\>'; if(last!==iPk) rh[last].hp='\\!'; setDyn(peakBar, dstep(rh[0].dyn,2)); }
    else if(last!=null){ rh[0].hp='\\>'; rh[last].hp='\\!'; }               // peak already at the start -> a long ebb
  }
  else if(scheme==='terraced'){                           // stepped LEVELS; louder where the hands are OPEN, softer where they close
    let b1=1; for(let b=1;b<Math.max(2,half);b++) if(energy(b)>energy(b1)) b1=b;   // raise the level on the most OPEN bar of phrase 1
    setDyn(b1, stepDyn(rh[0].dyn, energy(b1)-energy(0) >= 5 ? 2 : 1));   // a BIGGER dynamic step where the bar opens much wider than the start; a small step where it barely opens - reasoned from the energy jump, not a die
    if(half<nbars) setDyn(half, stepDyn(rh[0].dyn, energy(half)<energy(b1) ? -1 : 1));   // phrase 2: softer if it opens more closed
    // a distinct CLOSING plateau only when the ending's energy actually shifts from the phrase-2 level (else it stays on
    // that plateau); louder if the close opens out, softer if it closes in. Both the whether and the direction are reasoned.
    if(half<nbars && Math.abs(energy(nbars-1)-energy(half)) >= 3) setDyn(nbars-1, stepDyn(rh[0].dyn, energy(nbars-1) >= energy(half) ? 1 : -1));
  }
  else if(scheme==='subito'){                             // a SUDDEN contrast at a dramatic inner bar, sometimes returning
    // a sudden contrast marks a real point, not a random bar: the START of the consequent (a formal seam the ear
    // hears) or, failing that, the dramatic energy peak. Reasoned placement, not a die.
    const bx = (half>1 && half<nbars-1) ? half : Math.max(2, Math.min(nbars-2, peakBar));
    const louder = energy(bx) >= energy(peakBar)-3;       // a subito LOUD only where the texture is open; a closing-in bar gets a subito SOFT
    setDyn(bx, stepDyn(rh[0].dyn, louder?2:-2));
    if(bx+2 <= nbars-1) setDyn(Math.min(bx+2,nbars-1), rh[0].dyn);   // a MOMENTARY contrast returns to the level when there is room after it to resume (structural, not a die)
    if(phraseArc(0, Math.min(bx-1, half-1))) shapePhrase(0, Math.min(bx-1, half-1));   // pre-shape phrase 1 only if it actually arcs up to the subito point
  }
  else if(scheme==='echo'){                               // state, then a softer echo of the restatement
    if(phraseArc(0, half-1)) shapePhrase(0, half-1);      // shape the first statement only if it arcs
    if(half<nbars) setDyn(half, stepDyn(rh[0].dyn, -1));
    if(half<nbars && energy(nbars-1) > energy(half)) setDyn(nbars-1, stepDyn(rh[0].dyn, 1));   // the echo lifts at the close only if the ending actually opens back out
  }
  else {                                                  // sparse: one gentle shape (if the span arcs) OR a single level change following the energy
    if(phraseArc(0, nbars-1)) shapePhrase(0, nbars-1);
    else if(half<nbars) setDyn(half, stepDyn(rh[0].dyn, energy(half) >= energy(0) ? 1 : -1));   // level follows whether phrase 2 opens more or less than the start
  }
  // The hairpins are placed by the scheme following the INTENSITY curve (energy = melody height + harmonic tension),
  // so their direction is already reasoned - toward the climax, released into the cadence - and free to run against
  // the melodic contour when the harmony is the reason. Here we only DROP a level mark that would contradict the
  // hairpin leading into it (a crescendo must not resolve to a softer mark, nor a diminuendo to a louder one).
  { const rank=d=>DL.indexOf(d); let curL=rank(rh[0].dyn), openHp=null;
    for(let i=0;i<rh.length;i++){ if(rh[i].hp==='\\<'||rh[i].hp==='\\>') openHp=rh[i].hp;
      if(rh[i].dyn){ const nl=rank(rh[i].dyn);
        if(openHp==='\\<' && nl<curL){ delete rh[i].dyn; }
        else if(openHp==='\\>' && nl>curL){ delete rh[i].dyn; }
        else { curL=nl; openHp=null; } } } }
  // Drop any dynamic mark that just repeats the level already sounding (belt-and-suspenders against a redundant
  // "same dynamic twice/thrice" - a mark should only appear where the level actually changes).
  { let cur=null; for(const n of rh){ if(n.dyn){ n.dyn=clampToDL(n.dyn); if(n.dyn===cur) delete n.dyn; else cur=n.dyn; } } }

  // ---- ARTICULATION. Two rules Matthew insists on: (1) a recurring rhythmic FIGURE is articulated the SAME way
  // every time it appears — staccato on one lone instance of a repeated pattern reads as accidental (so the
  // OPENING bar counts too, not just inner bars); (2) staccato only lands on notes that are actually PLAYABLE
  // detached AT THIS TEMPO — a semiquaver is crisp at Adagio and a blur at Allegro, judged by real duration in
  // seconds, not a blanket ban. Legato pieces get phrase slurs instead. ----
  const bpm = bpmOf(tempo);
  const sigOf = b => rh.filter((n,i)=>nb[i]===b).map(n=>(n.rest?'r':'')+n.d).join(',');   // a bar's rhythm signature
  const stacShort = d => d<=0.5 && staccatable(d,bpm);                                     // short + playably-detached here
  const stacBars = new Set();
  if(prof!=='legato' && nbars>=4 && chance(prof==='light'?0.85:0.5)){
    // group the bars (opening included) that carry a staccato-able short run, by exact rhythm; dot the figure
    // that RECURS most, the SAME run every time it comes round (bar 1 AND bar 5, never a lone bar or a mismatch).
    const groups=new Map();
    for(let b=0;b<nbars-1;b++){ const inb=rh.filter((n,i)=>nb[i]===b);
      if(inb.some(n=>!n.rest&&stacShort(n.d))){ const s=sigOf(b); if(!groups.has(s)) groups.set(s,[]); groups.get(s).push(b); } }
    if(groups.size){
      const pick=[...groups.values()].sort((a,b)=>b.length-a.length || a[0]-b[0])[0];
      pick.forEach(b=>stacBars.add(b));
      // staccato a CONTIGUOUS RUN (>=2) of those short notes — a detached group (e.g. the quaver pair on beat 3) —
      // never a lone note; identical run in every bar of the figure.
      for(const b of pick){ const idxs=[]; rh.forEach((n,i)=>{ if(nb[i]===b) idxs.push(i); });
        let run=[]; const flush=()=>{ if(run.length>=2) run.forEach(k=>rh[k].art='-.'); run=[]; };
        for(const i of idxs){ if(!rh[i].rest && stacShort(rh[i].d)) run.push(i); else flush(); } flush(); }
    }
  }
  const slurRange=(a,b)=>{ const idxs=idxInBars(a,b).filter(i=>!rh[i].rest); if(idxs.length>1){ rh[idxs[0]].slur='('; rh[idxs.at(-1)].slur=')'; } };
  if(contourBias==='fall'){   // LAMENT (COMPOSITION-SPEC §13): sighing two-note DESCENDING slurs (a step-down pair,
    // slurred, like a sigh) instead of long legato phrases - the melancholy gesture. A bias, not on every pair.
    for(let i=0;i<rh.length-1;i++){ const a=rh[i], b=rh[i+1];
      if(a.rest||b.rest||Array.isArray(a.m)||Array.isArray(b.m)||a.slur||b.slur) continue;
      const step=a.m-b.m; if(step>=1 && step<=2 && chance(0.6)){ a.slur='('; b.slur=')'; i++; } }   // a descending step -> a sigh
  } else {
    // Slur the actual PHRASE units (antecedent / consequent) instead of a bar-count template — the seam at `half` is a
    // real boundary a slur must not straddle, and a slur marks a real phrase, not a template. Each range is then broken
    // at staccato bars / rests by the loop below.
    const phrases = half<nbars ? [[0,half-1],[half,nbars-1]] : [[0,nbars-1]];
    let chosen;
    if(prof==='legato') chosen = phrases;                                       // legato: sing each phrase as one line
    else if(prof==='light') chosen = chance(.45) ? [] : [rnd(phrases)];         // light: at most one phrase, often none
    else chosen = chance(.5) ? phrases : [];                                    // plain: sometimes phrase slurs
    for(const [lo,hi] of chosen){                                      // slur each run of bars, never across a staccato bar
      let a=null;
      for(let b=lo;b<=hi+1;b++){ if(b<=hi && !stacBars.has(b)){ if(a==null) a=b; } else { if(a!=null) slurRange(a,b-1); a=null; } }
    }
  }
  // ACCENTS mark notes that genuinely STAND OUT. Not every downbeat (that makes the accent meaningless), and not
  // merely the highest note. Score each melody note by how SURPRISING / emphatic it is — a leap into it, a long
  // note landing OFF the beat (syncopation to point up), a chromatic colour note, a long note emerging from quick
  // ones (agogic), the phrase peak — then accent only the few strongest, one per bar, and only for characters
  // that lean accented. Sparse and meaningful, never mechanical.
  if(gp.expression.accent && character.accent>=0.2){   // accents ← grade params (ABRSM: from grade 1); character sets how often
    const pos=(()=>{ let t=0; return rh.map(n=>{ const p=((t%barU)+barU)%barU; t+=n.d; return p; }); })();
    const onBeat=p=>Math.abs(p%beatLen)<1e-6;
    const sounded=rh.filter(n=>!n.rest&&!Array.isArray(n.m)); const hiM=sounded.length?Math.max(...sounded.map(n=>n.m)):Infinity;
    // the metre's strong beats (where the ear expects weight): downbeat, the mid-bar beat in 4/4, both beats in 6/8
    const strongOf = time==='4/4' ? [0,2] : compound ? Array.from({length:Math.round(barU/1.5)},(_,k)=>k*1.5) : [0];
    // TRUE syncopation: a note that enters OFF the beat immediately after a strong beat was SUSTAINED OVER (the
    // previous note held through it, so that strong beat had no attack) — the displaced weight lands on this note.
    const syncEntry = i => { if(i<=0) return false; const prev=rh[i-1]; if(prev.rest||Array.isArray(prev.m)) return false;
      const p=pos[i], pp=pos[i-1]; if(pp>=p) return false;                       // same bar, prev sits before this note
      if(Math.abs((pp+prev.d)-p)>1e-6) return false;                             // contiguous — no rest in between
      if(Math.abs(p%beatLen)<1e-6) return false;                                 // and this note is itself OFF the beat
      return strongOf.some(sb=> sb>pp+1e-6 && sb<p-1e-6); };                     // prev held across a strong beat
    const score=(n,i)=>{ if(n.rest||Array.isArray(n.m)) return 0;
      const prev=i>0&&!rh[i-1].rest&&!Array.isArray(rh[i-1].m)?rh[i-1]:null;
      let ni=i+1; while(ni<rh.length && (rh[ni].rest||Array.isArray(rh[ni].m))) ni++;
      const next = ni<rh.length ? rh[ni] : null;
      // A PASSING note inside a moving line — short, stepwise in and out, continuing the same direction — belongs
      // to the flow of the line; accenting it just makes one note bump out. Never a candidate, even when chromatic.
      if(n.d<=0.5 && prev && next){ const im=n.m-prev.m, om=next.m-n.m;
        if(im!==0 && Math.abs(im)<=2 && Math.abs(om)<=2 && Math.sign(im)===Math.sign(om)) return 0; }
      let s=0;
      if(prev){ const lp=Math.abs(n.m-prev.m); if(lp>=7)s+=3; else if(lp>=5)s+=1.8; }   // a surprising leap up to the note
      if(syncEntry(i)) s+=2.8;                                                          // enters off the beat after a strong beat was sustained over = syncopation
      else if(!onBeat(pos[i]) && n.d>=1) s+=2.2;                                        // otherwise a long note landing off the beat
      if(n.alt) s+=2.4;                                                                 // a chromatic colour note (only when it is NOT a passing note)
      if(prev && prev.d<=0.5 && n.d>=2) s+=1.4;                                         // a long note emerging from quick ones (agogic)
      if(n.m===hiM) s+=1.2;                                                             // the melodic peak
      return s; };
    // a phrase-OPENING downbeat is an expected landing, not a surprise (and accenting the consequent's opening
    // but not the antecedent's is the very inconsistency we avoid on a restated period) — exclude both openings.
    const phraseOpen = new Set([rh.findIndex((n,i)=>nb[i]===0), rh.findIndex((n,i)=>nb[i]===half)].filter(i=>i>=0));
    const cand=rh.map((n,i)=>({i,s:score(n,i)})).filter(x=>x.s>=2.4 && !rh[x.i].art && !rh[x.i].slur && !phraseOpen.has(x.i));
    cand.sort((a,b)=>b.s-a.s);
    const cap = character.accent>=0.55?3 : character.accent>=0.35?2 : 1;
    const placed=[];
    for(const c of cand){ if(placed.length>=cap) break; if(placed.some(pi=>nb[pi]===nb[c.i])) continue;   // one per bar, spread out
      rh[c.i].art='->'; placed.push(c.i); }
  }

  // ── Grade 4 additions (the chromatic passing note is handled earlier, before the dynamics) ──────────────
  // Tenuto + fermata: gated by the grade PARAMETERS (gp.expression), not by grade===4, so any grade whose params
  // enable them gets them. (ABRSM introduces both at grade 4; the table encodes that.)
  if(gp.expression.tenuto || gp.expression.fermata){
    // TENUTO — hold a note its FULL length with slight weight. Admit EVERY recognised reason a note takes one (the
    // UNION, so nothing valid is excluded); rule it out ONLY on a note that has none of them (one of many equal,
    // flowing notes). Any character. Recognised reasons:
    //   PEAK (melodic high point) · SUSPENSION/appoggiatura (a leaning dissonance) · CADENTIAL broadening ·
    //   AGOGIC (a longer note emerging from shorter ones) · FULL-LENGTH hold among STACCATOS (hold, don't clip).
    if(gp.expression.tenuto){
      const sounded=rh.map((n,i)=>({n,i})).filter(o=>!o.n.rest && !Array.isArray(o.n.m));
      const at=i=>sounded.findIndex(o=>o.i===i);
      const free=i=> i>0 && i<rh.length-1 && !rh[i].rest && !Array.isArray(rh[i].m) && !rh[i].art && !rh[i].slur && rh[i].d>=1;
      const isPeak=i=>{ const p=at(i); return p>0 && p<sounded.length-1 && rh[i].m>sounded[p-1].n.m && rh[i].m>sounded[p+1].n.m; };
      const agogic=i=>{ const p=at(i); return p>0 && rh[i].d>sounded[p-1].n.d+1e-9; };   // a longer note emerging from shorter
      const afterStac=i=> !!(rh[i-1] && rh[i-1].art==='-.');                              // held full-length among detachment
      const cadential=i=> i>=rh.length-3;                                                // broadening into the close
      const suspension=i=> !!rh[i].ti;                                                    // a prepared suspension the engine tied
      const reason=i=> isPeak(i)||agogic(i)||afterStac(i)||cadential(i)||suspension(i);
      const elig=rh.map((n,i)=>i).filter(i=> free(i) && reason(i));
      if(elig.length && chance(0.4)){
        const pref=elig.find(i=>isPeak(i)||suspension(i)) ?? elig.find(cadential) ?? elig[0];
        rh[pref].art='--';
      }
    }
    // FERMATA — a structural PAUSE. Usually the final chord; occasionally a caesura at the end of the ANTECEDENT
    // phrase (the half-cadence). NOT restricted to the final note (Matthew). Anywhere mid-phrase would break the flow.
    if(gp.expression.fermata && chance(character.ferm!=null ? Math.max(0.15, character.ferm) : 0.2)){   // frequency from the CHARACTER (a grand/grave pauses more than a scherzo) - the authored `ferm` field, previously unread
      if(half>0 && half<nbars && (midType==='HC'||midType==='IAC') && chance(0.3)){    // caesura ONLY where the antecedent actually CLOSES a phrase (a real half/imperfect cadence) - never over a `continuous` seam the piece was written to flow through
        const lastInBar=hand=>{ let t=0,idx=-1; for(let i=0;i<hand.length;i++){ const b=Math.floor(t/barU+1e-9); if(b===half-1 && !hand[i].rest) idx=i; t+=hand[i].d; } return idx; };   // anacrusis not applied yet here, so plain bar numbering
        const ri=lastInBar(rh), li=lastInBar(lh);
        if(ri>=0) rh[ri].ferm=true; if(li>=0) lh[li].ferm=true;
      } else {
        const lastR=[...rh].reverse().find(n=>!n.rest), lastL=[...lh].reverse().find(n=>!n.rest);
        if(lastR) lastR.ferm=true; if(lastL) lastL.ferm=true;
      }
    }
  }

  // ── Guidance fingering at position changes (Grades 3-4) ──────────────────
  // The hand leaves the five-finger position at these grades, so mark the finger
  // wherever the position must move, exactly as ABRSM's own tests do. A position is
  // five consecutive notes of the key; while the line stays inside it no mark is
  // needed, and a mark is printed on the first note of each new position.
  if(grade>=3){
    const scalePCs = [...new Set(KEYSCALE[mode].map(x=>(((melReg+x)%12)+12)%12))];
    const degIdx = m => { // index of a pitch on the key's ladder (semitone fallback if chromatic)
      const pc=(((m)%12)+12)%12; const i=scalePCs.indexOf(pc);
      return i<0 ? null : Math.round((m - melReg)/12)*7 + i;
    };
    // Sparse, like the real tests: a mark only where the hand genuinely relocates
    // (a note well outside the current position), at most one per bar, and no more
    // than four in an exercise. Small excursions are left for the player to solve.
    const MAX_MARKS = 2;   // guidance, not a fingered edition
    const markHand = (seq, isRH) => {
      let lowDeg=null, marked=0, lastBar=-1, t=0;
      seq.forEach(n=>{
        const bar=Math.floor(t/barU+1e-9); t+=n.d;
        if(n.rest || Array.isArray(n.m)) return;
        const d=degIdx(n.m); if(d==null) return;              // chromatic note: never the anchor
        if(lowDeg===null){ lowDeg=d-(isRH?0:4); return; }     // first note establishes the position
        const out = d<lowDeg ? lowDeg-d : d>lowDeg+4 ? d-(lowDeg+4) : 0;
        if(!out) return;                                      // still under the hand
        const newLow = d > lowDeg+4 ? d-4 : d;
        const real = out>=2 && marked<MAX_MARKS && bar!==lastBar;   // a genuine move, not a neighbour
        lowDeg = newLow;
        if(real){ n.fing = isRH ? (d-lowDeg)+1 : 5-(d-lowDeg); marked++; lastBar=bar; }
      });
      return marked;
    };
    // markHand is DISABLED: it hand-set n.fing, and any manual fingering overrides the engine's DP in
    // engine.voice() — so this cruder position-frame heuristic (no black-key/stretch/crossing awareness)
    // was silently replacing the principled fingerHand display for out-of-position G3/G4 lines. The
    // improved fingerHand (crossover-aware, specimen-calibrated, black-key/jammed-5-4 tuned) is now the
    // SINGLE fingering authority. Left defined for reference; not invoked.
    void markHand;
  }

  rh.forEach(n=>delete n.bar);   // strip internal phrase marker

  // ANACRUSIS (Grade 4, simple time): an upbeat leads into bar 1. The engine fully supports ex.partial
  // (validate measures each hand as sum-minus-partial; toLily emits \partial). The accompaniment RESTS on
  // the upbeat, so the unaccompanied pickup carries any diatonic lead-in with no harmony to clash against.
  let partial = 0;
  if(grade===4 && !compound && !Array.isArray(rh[0].m) && chance(0.26)){
    const P = chance(0.5) ? 1 : 0.5;                          // a crotchet or a quaver upbeat
    const downIdx = degOf(rh[0].m);                           // window index of the bar-1 downbeat (melody)
    if(downIdx!=null && downIdx>=0){
      let upIdx = clamp(downIdx>=2 ? downIdx-rnd([1,2]) : downIdx+rnd([1,2]), span);   // lean by step/3rd into the downbeat
      if(upIdx!==downIdx){
        rh.unshift({ m:mnote(upIdx), d:P });
        lh.unshift({ m:accReg+off[0], d:P, rest:true });      // accomp rests through the upbeat
        if(rh[1] && rh[1].dyn){ rh[0].dyn=rh[1].dyn; delete rh[1].dyn; }   // move the opening dynamic onto the upbeat
        partial = P;
      }
    }
  }
  // ── STATIC-MELODY REPAIR ─────────────────────────────────────────────────────────────
  // A whole melody bar sitting on ONE repeated pitch (>=2 same-pitch sounding notes, nothing else) is dead
  // (Matthew's slot-14 bar 2: Ab3 · Ab3). Give it motion the way he did: turn the LAST repeated note into a
  // step — split a long one into [same note, then a passing quaver] aimed at the next bar, or move a short
  // one to a diatonic neighbour. A single HELD note (a breath) is left alone; a lively repeat that already
  // moves within the bar (slot-10 bar 7 E-E-D) is left alone. Diatonic only; validate/harmony/theory re-check.
  {
    const tpc=((rhTonic%12)+12)%12;
    const scale=new Set(KEYSCALE[mode].slice(0,7).map(k=>((tpc+k)%12+12)%12));
    const step=(p,dir)=>{ let q=p+dir; for(let i=0;i<12;i++){ if(scale.has(((q%12)+12)%12)) return q; q+=dir; } return p+dir; };
    const barsM=[]; { let t=0,cur=[]; for(let k=0;k<rh.length;k++){ cur.push(k); t+=rh[k].d; if(t>=barU-1e-9){ barsM.push(cur); cur=[]; t=0; } } if(cur.length) barsM.push(cur); }
    for(let bi=barsM.length-1; bi>=0; bi--){                        // reverse so a splice can't shift earlier bars' indices
      const idxs=barsM[bi].filter(k=>!rh[k].rest && !Array.isArray(rh[k].m));
      if(idxs.length<2) continue;                                   // single held note / empty -> a breath, leave it
      const pitch=rh[idxs[0]].m;
      if(!idxs.every(k=>rh[k].m===pitch)) continue;                 // bar has other pitches -> it moves, leave it
      let nextM=null; for(let k=barsM[bi][barsM[bi].length-1]+1; k<rh.length; k++){ if(!rh[k].rest && !Array.isArray(rh[k].m)){ nextM=rh[k].m; break; } }
      const dir = (nextM!=null && nextM!==pitch) ? Math.sign(nextM-pitch) : -1;   // toward the next note, else a lower neighbour
      const last=idxs[idxs.length-1], ev=rh[last], target=step(pitch,dir);
      if(ev.d>=1.0){ ev.d-=0.5; rh.splice(last+1,0,{m:target,d:0.5}); }   // long: keep the chord tone + a passing quaver
      else { ev.m=target; }                                              // short: move it to the neighbour
      if(ev.alt) delete ev.alt;
    }
  }
  // ── DOTTED CROTCHET ON THE BEAT ──────────────────────────────────────────────────────
  // In simple time a dotted crotchet (1.5 beats) that STARTS on a weak off-beat swallows the next beat's
  // downbeat and blurs the metre (Matthew's slot-14 minuet, bar 3). Relocate it to start ON a beat: a
  // preceding half-beat REST moves to AFTER it; a preceding half-beat NOTE swaps durations (the on-beat note
  // takes the dotted length). The dotted crotchet survives as a device — it just never lands off the beat.
  if(!compound){
    let changed=true, safety=0;
    while(changed && safety++<60){
      changed=false; let t=0;
      for(let k=0;k<rh.length;k++){
        if(k>0 && !rh[k].rest && Math.abs(rh[k].d-1.5)<1e-9 && Math.abs((t%1)-0.5)<1e-9){
          const prev=rh[k-1];
          if(Math.abs(prev.d-0.5)<1e-9){
            if(prev.rest){ rh.splice(k-1,1); rh.splice(k,0,prev); }   // rest -> after the dotted crotchet
            else { prev.d=1.5; rh[k].d=0.5; }                          // note -> takes the dotted length on the beat
            changed=true; break;
          }
        }
        t+=rh[k].d;
      }
    }
  }
  // ── 6/8 OOM-PAH-PAH ──────────────────────────────────────────────────────────────────
  // In a compound-metre oom-pah accompaniment BOTH dotted-crotchet beats need the bass; the generator often put
  // the bass only on beat 1 and left beat 2 as another chord, so the bar SAGS in the middle (Matthew's slot-20
  // Vivace; ~38% of oom-pah bars). Give beat 2 the bass too: where beat 1 is a lone bass note and a CHORD onsets
  // on beat 2 (position 1.5), swap that chord for the beat-1 bass (root). The off-beat chords still carry the harmony.
  if(!swap && compound){
    let t=0, cur=[], B=[];
    for(const nt of lh){ cur.push({ev:nt,pos:t}); t+=nt.d; if(t>=barU-1e-9){ B.push(cur); cur=[]; t=0; } } if(cur.length) B.push(cur);
    for(const bar of B){
      const first=bar.find(x=>!x.ev.rest); if(!first || Array.isArray(first.ev.m)) continue;
      const at15=bar.find(x=>Math.abs(x.pos-1.5)<1e-9);
      if(at15 && !at15.ev.rest && Array.isArray(at15.ev.m)) at15.ev.m = first.ev.m;   // beat 2 -> the bass (root)
    }
  }
  // ── SWAP ACCOMPANIMENT CEILING ────────────────────────────────────────────────────────
  // In swap pieces the accompaniment sits in the treble; its figure voicing could stack up to C6 (Matthew's
  // slot-27) — squeaky, well above a low LH melody. Cap it on/near the staff: octave-shift any accompaniment note
  // above A5 down. The melody is low in swap so this stays clear of it (collision repair backstops anyway).
  if(swap){ for(const nt of lh){ if(nt.rest) continue;
    const arr=(Array.isArray(nt.m)?nt.m:[nt.m]).map(m=>{ let g=0; while(m>81 && g++<3) m-=12; return m; });
    nt.m = Array.isArray(nt.m) ? [...new Set(arr)].sort((a,b)=>a-b) : arr[0]; } }
  // ── REACH CAP ────────────────────────────────────────────────────────────────────────
  // No simultaneous chord (either hand) may span more than an OCTAVE — a tenth is unreachable for many
  // players, especially students (Matthew's slot-12 [A2+C4], a minor 10th). Octave-shift the outer note
  // INWARD (raise a low bass, else drop a high top) so pitch classes/harmony are untouched, only the reach.
  for(const hand of [rh, lh]) for(const nt of hand){
    if(nt.rest || !Array.isArray(nt.m)) continue;
    let arr=[...new Set(nt.m)].sort((a,b)=>a-b); let guard=0;
    while(arr[arr.length-1]-arr[0] > 12 && guard++<4){
      if(arr[0] < 52) arr[0]+=12; else arr[arr.length-1]-=12;
      arr=[...new Set(arr)].sort((a,b)=>a-b);
    }
    nt.m = arr.length>1 ? arr : arr[0];
  }
  // ── HAND-COLLISION REPAIR ────────────────────────────────────────────────────────────
  // The melody must clear the accompaniment (Matthew's slot-11 C#: the two hands were on the same
  // key). REJECTING colliding pieces disproportionately kills chromatic writing (tighter spacings
  // collide) — it tripped the census (piecesWithChromatic 244->176). So re-voice the ACCOMPANIMENT
  // note by an OCTAVE out of the melody's way instead: octave shift preserves pitch class, so the
  // harmony and every chromatic tone survive untouched, and no piece is thrown away. The melody is
  // never altered. Non-swap: accomp (lh) sits below -> shift a colliding note DOWN; swap: accomp
  // sits above the melody -> shift it UP. Anything left is still caught by validate/harmony-checks.
  {
    const lo1=m=>Array.isArray(m)?Math.min(...m):m, hi1=m=>Array.isArray(m)?Math.max(...m):m, EPSh=1e-9;
    const melT=[]; { let t=0; for(const n of rh){ if(!n.rest && n.m!=null) melT.push({t0:t,t1:t+n.d,lo:lo1(n.m),hi:hi1(n.m)}); t+=n.d; } }
    let at=0;
    for(const a of lh){
      const t0=at, t1=at+a.d; at=t1;
      if(a.rest || a.m==null) continue;
      let mMin=Infinity, mMax=-Infinity;
      for(const e of melT){ if(e.t0<t1-EPSh && e.t1>t0+EPSh){ if(e.lo<mMin) mMin=e.lo; if(e.hi>mMax) mMax=e.hi; } }
      if(mMin===Infinity) continue;                             // melody resting here -> can't collide
      const arr = Array.isArray(a.m) ? a.m.slice() : [a.m]; let changed=false;
      for(let k=0;k<arr.length;k++){
        if(!swap){ while(arr[k] >= mMin && arr[k]-12 >= 24){ arr[k]-=12; changed=true; } }   // accomp below -> drop under the tune
        else     { while(arr[k] <= mMax && arr[k]+12 <= 96){ arr[k]+=12; changed=true; } }    // accomp above -> lift over the tune
      }
      if(changed){ const dd=[...new Set(arr)].sort((x,y)=>x-y);   // an octave shift can land on an existing member -> unison; collapse it
        a.m = dd.length>1 ? dd : dd[0]; }
    }
  }
  // starting fingers, computed from the actual hand positions (the melody's window + the accomp's tonic box)
  const mStart=clamp(strong[0],4);
  const melodyFing = swap ? 5-mStart : mStart+1;       // RH melody: thumb on the bottom; LH melody: pinky on the bottom
  const accompFing = swap ? 1 : 5;                     // accomp opens on the I-chord root (bottom of its box)
  // assign to staves: treble = the higher-register part, bass = the lower. when swapped, the melody (rh) sits low.
  const ex={ grade, key:ly, mode, flat, time, tempo, rh: swap?lh:rh, lh: swap?rh:lh,
             rhFinger: swap?accompFing:melodyFing, lhFinger: swap?melodyFing:accompFing };
  if(partial) ex.partial = partial;
  // Non-render batch-variety hooks (stripped before saving): the accompaniment texture + primary figure, so a batch
  // can avoid placing the SAME accompaniment groove on adjacent same-metre pieces (Matthew's slot-34/35 sameness).
  ex._tex = texture;
  ex._figBias = figBias;         // stored so the collection can diversity-reason these choices (histogram of the bank-so-far) - see the keystone plan; nothing reads them yet
  ex._pahSpacing = pahSpacing;
  ex._figSig = (texture==='fig' && primaryFig && Array.isArray(primaryFig.s)) ? 'fig:'+JSON.stringify(primaryFig.s) : texture;
  // DEBUG/critic hooks (non-render): the TRUE per-bar chord-tone pitch-classes and which staff holds the melody,
  // so the musicality critic measures against real harmony instead of guessing from an incomplete LH voicing.
  const _tpc=((rhTonic%12)+12)%12;
  const _triPCs=c=>{ const ch=CHm[c]; if(!ch) return []; const r=(((ch.b)%7)+7)%7;
    return [r,(r+2)%7,(r+4)%7].map(dg=>(((_tpc+KEYSCALE[mode][dg])%12)+12)%12); };
  ex._ct=[]; for(let b=0;b<nbars;b++){ const s=new Set(_triPCs(prog[b])); if(prog2[b]) _triPCs(prog2[b]).forEach(p=>s.add(p)); ex._ct.push([...s]); }
  // ── BASS-ARRIVAL GUARD ──────────────────────────────────────────────────────────────
  // A chord-change downbeat wants a FRESH bass note. The fault (Matthew's bar 4-5): the last
  // LH note of a bar is the SAME pitch as the bass that lands on the next bar's downbeat, so
  // the new chord (ii -> V) arrives with no bass movement at all — a dead repeat across the
  // barline, worsened when the melody leaps to double it. Fix it at the PRE-downbeat note:
  // re-voice it to another tone of ITS OWN chord so the bass genuinely MOVES into the downbeat.
  // ONLY on a real harmony change (pedals / held bass stay legal), and ONLY to a chord tone (no
  // wrong-chord risk). If no clean chord tone is free, octave-displace so the literal repeat is
  // at least broken. Common tones stay legal — they just get APPROACHED, not repeated.
  // generate()'s validate + harmony-checks re-run on the result, so any disturbance is redrawn.
  if(!swap){
    const A = ex.lh, EPSg = 1e-9, pOff = ex.partial ? 1 : 0;
    const soundG = ev => ev && !ev.rest && ev.m!=null;
    const lowG = ev => Array.isArray(ev.m)?Math.min(...ev.m):ev.m;
    const pcG = m => (((m%12)+12)%12);
    const perf = iv => iv===0 || iv===7;                          // P8/unison or P5
    let _tt=0; const tAbs=A.map(ev=>{ const x=_tt; _tt+=ev.d; return x; });   // absolute onset per LH index
    const RHt=[]; { let t=0; for(const n of ex.rh){ RHt.push({t, m:n.rest?null:(Array.isArray(n.m)?Math.max(...n.m):n.m)}); t+=n.d; } }
    const melTop = tt => { let c=null; for(const n of RHt){ if(n.t<=tt+EPSg) c=n; else break; } return c?c.m:null; };
    const barsG=[]; { let t = ex.partial ? (barU-ex.partial) : 0, cur=[];
      for(let k=0;k<A.length;k++){ cur.push(k); t+=A[k].d; if(t>=barU-EPSg){ barsG.push(cur); cur=[]; t=0; } } if(cur.length) barsG.push(cur); }
    for(let bi=0; bi<barsG.length-1; bi++){
      const ci = bi-pOff, cj = bi+1-pOff;                          // prog indices of the two bars
      if(ci<0 || cj>nbars-1) continue;
      let lastK=-1; for(let z=barsG[bi].length-1; z>=0; z--){ if(soundG(A[barsG[bi][z]])){ lastK=barsG[bi][z]; break; } }
      let firstK=-1; for(const z of barsG[bi+1]){ if(soundG(A[z])){ firstK=z; break; } }
      if(lastK<0||firstK<0) continue;
      const lastEv=A[lastK];
      if(Array.isArray(lastEv.m)) continue;                       // a struck chord isn't a bare repeat
      const nextBass = lowG(A[firstK]);
      if(lastEv.m!==nextBass) continue;                           // no dead repeat here
      const endC = (prog2[ci]!=null)?prog2[ci]:prog[ci], startC = prog[cj];
      if(endC===startC) continue;                                 // harmony continues -> pedal, leave it
      const tones = _triPCs(endC);                                // chord-tone pitch classes of the ending chord
      if(!tones.length) continue;
      // MELODY-AWARE choice: re-voice to the nearest chord tone that (a) actually MOVES off the next bass,
      // (b) does NOT octave-double the melody on this beat, and (c) does NOT run parallel/direct P8/P5 with
      // the melody INTO the downbeat (the fault the Eb3 fix first introduced). Stay in the bass register
      // (at/below the note being replaced), so the bass never leaps up near the tune.
      const melPre = melTop(tAbs[lastK]), melDown = melTop(tAbs[firstK]);
      const ivDown = melDown!=null ? (((melDown-nextBass)%12)+12)%12 : -1;
      let best=null, bd=1e9;
      for(let cand=lastEv.m-12; cand<=lastEv.m+2; cand++){
        if(cand===lastEv.m || !tones.includes(pcG(cand)) || pcG(cand)===pcG(nextBass)) continue;
        if(melPre!=null && (((melPre-cand)%12)+12)%12===0) continue;             // no bare octave with the melody here
        if(melPre!=null && melDown!=null){                                       // no parallel/direct perfect into the downbeat
          const ivPre=(((melPre-cand)%12)+12)%12, topMove=melDown-melPre, botMove=nextBass-cand;
          if(perf(ivDown) && ivPre===ivDown && topMove!==0 && botMove!==0 && Math.sign(topMove)===Math.sign(botMove)) continue;
        }
        const d=Math.abs(cand-lastEv.m); if(d<bd){ bd=d; best=cand; }
      }
      if(best==null){ const dn=lastEv.m-12; best = dn>=36 ? dn : lastEv.m+12; }   // fallback: at least break the literal repeat
      if(best!==lastEv.m){ lastEv.m=best; if(lastEv.alt) delete lastEv.alt; }
    }
  }
  // A MOVING accompaniment bar (3+ sounding notes — an arpeggio or a walking figure) has MOTION as its reason, so an
  // adjacent same-pitch repeat there is a defect against the texture's own intent (the pattern ran out of distinct
  // tones). Choose a different in-register chord tone for it, honouring the motion. (2-note pulse bars are decided by
  // the scored bass choice above; this is not a blanket "no repeats" rule — a repeated PULSE bar has only 2 notes.)
  {
    const acc = swap ? rh : lh, reg = swap ? melReg : accReg;
    const groups=[]; { let c=[],t=0; for(let i=0;i<acc.length;i++){ c.push(i); t+=acc[i].d; if(t>=barU-1e-6){ groups.push(c); c=[]; t=0; } } if(c.length)groups.push(c); }
    groups.forEach((idxs,bi)=>{ const bar=Math.min(bi, prog.length-1); const ch=CHm[prog[bar]]; if(!ch) return;
      const sounding=idxs.filter(i=>!acc[i].rest && !Array.isArray(acc[i].m));
      if(sounding.length<3) return;                                    // only MOVING bars
      const tones=[...new Set(ch.t)].map(dg=>reg+(off[dg]??off[dg%off.length]));
      for(let j=1;j<sounding.length;j++){ const a=acc[sounding[j-1]], c=acc[sounding[j]]; if(a.m!==c.m) continue;
        const nextM = j+1<sounding.length ? acc[sounding[j+1]].m : null;
        const alt=tones.filter(p=>p!==a.m && p!==nextM).sort((x,y)=>Math.abs(x-a.m)-Math.abs(y-a.m))[0];
        if(alt!=null) c.m=alt;                                         // move to a different chord tone
      }
    });
  }
  // TWO-HAND DOUBLING (grade 3+, occasional): the accompaniment DOUBLES the melody a diatonic 10th below — a genuine
  // two-part parallel-tenths texture (a real two-hand RELATIONSHIP, not melody + chords). Applied only when the WHOLE
  // doubled line fits the bass clef; otherwise the piece keeps its chordal accompaniment. Parallel 10ths are parallel
  // 3rds an octave apart — consonant, never parallel perfects. This is the first of the two-hand relationships.
  if(opts.doubling && !swap){
    const tpc=((melReg%12)+12)%12; const sc=new Set(KEYSCALE[mode].map(d=>(((tpc+d)%12)+12)%12));
    const down=p=>{ let q=p-1,g=0; while(!sc.has(((q%12)+12)%12)&&g<13){ q--; g++; } return q; };
    const tenth=p=>down(down(p))-12;                                     // a diatonic 3rd below, an octave down = a 10th
    const dbl=[]; let ok=true;
    for(const n of rh){ if(n.rest){ dbl.push({rest:true,d:n.d}); continue; }
      const m=Array.isArray(n.m)?Math.max(...n.m):n.m; const t=tenth(m);
      if(t<40||t>60){ ok=false; break; } dbl.push({m:t,d:n.d,bar:n.bar}); }   // whole line must fit E2..C4
    if(ok && dbl.length) { lh.length=0; lh.push(...dbl); }
  }
  ex._mel = swap ? 'lh' : 'rh';
  ex._restate = restate;
  ex._scheme = scheme;              // dynamic-shape choice, for collection-diversity in gen-batch
  ex._prog = prog.slice();          // the chord progression, for the harmonic-variety preference in generate()
  return ex;
}

// MELODIC MONOTONY (Matthew: exercise #2 "just a load of Gs and Ds"). A tune that outlines the triad with heavy
// repetition is not a melody. Reads the ACTUAL melody hand (ex._mel, reliable — not a heuristic). Flags: only the
// triad (<=3 distinct pitches), too few pitches for its length, one note dominating, or a note stuttered 3+ times.
function melodyMonotony(ex){
  const mel=(ex._mel==='lh'?ex.lh:ex.rh).filter(n=>!n.rest);
  const ps=mel.map(n=>Array.isArray(n.m)?n.m[0]:n.m); if(ps.length<4) return false;
  const distinct=new Set(ps).size; const cnt={}; ps.forEach(p=>cnt[p]=(cnt[p]||0)+1);
  const maxFrac=Math.max(...Object.values(cnt))/ps.length;
  let run=1,maxRun=1; for(let i=1;i<ps.length;i++){ if(ps[i]===ps[i-1]){run++; if(run>maxRun)maxRun=run;} else run=1; }
  if(distinct<=3) return true;                       // only the triad
  if(ps.length>=8 && distinct<=4) return true;       // too few pitches for a real tune
  if(maxFrac>0.42) return true;                      // one note dominates
  if(maxRun>=3) return true;                          // 3+ of the same note in a row
  return false;
}
// A DEAD accompaniment: the hand OPPOSITE the melody just holds two notes (a bare tonic-dominant pedal over a
// two-chord progression — Matthew: "the left hand is just two notes"). Fixed by richer harmony OR an arpeggiated
// texture, both of which raise the accompaniment's distinct-pitch count.
function thinAccompaniment(ex){
  const acc=(ex._mel==='lh'?ex.rh:ex.lh).filter(n=>!n.rest);
  const ps=acc.flatMap(n=>Array.isArray(n.m)?n.m:[n.m]);
  return new Set(ps).size < 3;
}
// A two-chord piece (I-V-I-V) is thin harmony. Prefer 3+ distinct chords so the diversification actually shows —
// achievable in 4 bars via a predominant (I-IV-V-I, I-ii-V-I) instead of restating I-V.
function thinHarmony(ex){ return ex._prog ? new Set(ex._prog).size < 3 : false; }

// 8-bar grades have far more surface to keep clean, so they need a deeper search:
// at 3000 tries only ~1 in 3 comes out faultless, at 15000 roughly half, for ~1s.
// Beyond that it stops paying, and the human pass handles the remainder.
export function generate(grade, tries, avoid, hist){
  if(tries==null) tries = grade===2 ? 3000 : 15000;
  // Commit to the metre AND to swap-or-not for the whole run. Re-rolling the metre each
  // try lets the search drift to whichever metre most easily scores zero, which quietly
  // destroys the spread of time signatures across the book.
  const TIMES = gradeParams(grade).timeSignatures;            // metre list ← grade params (single source of truth)
  // SWAP (melody in the LH) needs a RIGHT-HAND accompaniment figure bank; RHBANK has no grade-2 material yet, so at
  // grade 2 swap falls back to flat repeated chords (Matthew's exercise 105). Gate swap to grades that have the
  // material until grade-2 RH-accompaniment figures are built — a parameter gate, not a separate engine.
  const opts = { swap: grade>=3 && Math.random()<0.2, doubling: grade>=3 && Math.random()<0.15, time: TIMES[Math.floor(Math.random()*TIMES.length)], hist };   // doubling committed per RUN so best-of can't over-select it; hist = collection histogram for diversity choices (absent => free seed)
  // BANK UNIQUENESS: when the existing bank is passed, prefer a faultless candidate that is DISTINCT from
  // every piece already in it (different key/character/contour/harmonic skeleton). A candidate clearly
  // unlike the whole bank is taken at once; otherwise we keep the most-distinct of a small bounded pool
  // (faultless candidates are ~1s apart, so the pool is capped to stay responsive).
  const avoidSigs = (avoid && avoid.length) ? avoid.map(pieceSig) : null;
  const DISTINCT = 6;                                          // key differs + shape/harmony differ -> plainly a new piece
  let best=null, bestScore=1e9; const pool=[];
  for(let i=0;i<tries;i++){
    const ex=buildCandidate(grade, opts);
    const v=validate(ex);
    // reject the two GENUINE harmony faults (leap into an on-beat dissonance; 6/4 on a downbeat) like errors,
    // but NOT on-beat dissonance in general — suspensions stay. This filters clunkers without narrowing chords.
    const hc = leapClashes(ex).length + sixFours(ex).length + parallelPerfects(ex).length + lhParallels(ex).length + beatClash(ex).length + melodicAug2nd(ex).length;   // hand collisions are REPAIRED at source (octave-shift), not rejected — see collision repair in buildCandidate
    // COMPLEXITY FLOOR (Matthew's slot-26 "just slow triads"): a grade-4 melody with NO rhythmic subdivision (all
    // crotchets or longer) AND almost no stepwise motion (mostly chord-tone leaps) is a plain arpeggio, below the
    // grade. Reject it. Neither plain rhythm nor leaping alone is penalised — only the two together.
    let plain=0;
    if(grade>=4){ const mel=(ex._mel==='lh'?ex.lh:ex.rh).filter(x=>!x.rest);
      if(mel.length>=4){ const minDur=Math.min(...mel.map(x=>x.d));
        const pcs=mel.filter(x=>!Array.isArray(x.m)).map(x=>x.m); let st=0,lp=0;
        for(let k=1;k<pcs.length;k++){ const d=Math.abs(pcs[k]-pcs[k-1]); if(d===0)continue; if(d<=2)st++; else lp++; }
        const sr=(st+lp)?st/(st+lp):1;
        if(minDur>=1-1e-9 && sr<0.30) plain=1; } }
    const mono = melodyMonotony(ex) ? 1 : 0;
    const thinAcc = thinAccompaniment(ex) ? 1 : 0;
    const thinHarm = thinHarmony(ex) ? 1 : 0;
    const score=v.errors.length*1000 + hc*1000 + plain*1000 + mono*1000 + thinAcc*1000 + thinHarm*500 + v.warnings.length;   // faults/monotony/dead-accompaniment reject; thin harmony is a strong preference
    if(score===0){
      if(!avoidSigs) return ex;
      const sig=pieceSig(ex); let mind=Infinity;
      for(const s of avoidSigs){ const d=sigDistance(sig,s); if(d<mind) mind=d; }
      if(mind>=DISTINCT) return ex;                            // plainly unlike everything already in the bank
      pool.push({ex,mind});
      if(pool.length>=4) break;                               // enough clean options; take the most distinct
    }
    else if(score<bestScore){ best=ex; bestScore=score; }
  }
  if(pool.length){ pool.sort((a,b)=>b.mind-a.mind); return pool[0].ex; }   // most distinct clean candidate found
  return best;   // best available (UI shows any remaining errors/warnings)
}
