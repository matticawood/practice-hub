// Sight Reading Studio — per-grade exercise generator.
// Strategy: chord-led composition + rejection sampling. Build a candidate within the
// grade's parameters, run engine.validate(); keep the first CLEAN one (or least-bad).
import { validate } from './engine.mjs';
import { leapClashes, sixFours, parallelPerfects, lhParallels, beatClash, handCrossing, melodicAug2nd } from './harmony-checks.mjs';   // the genuine-fault checks (not beatDissonance, which flags desirable suspensions)
import { skeleton, contour } from './variety.mjs';              // surface signatures, for keeping bank pieces distinct
import { accompany, beatHarmony } from './accompaniment.mjs';   // NEW accompaniment-as-intentions (flagged, standalone)
import { gradeParams } from './grade-params.mjs';               // GRADE PARAMETER TABLE — the rule engine reads its grade-variable limits from here (grade-agnostic; grade is only a lens)

// ---- bank-level uniqueness: how DIFFERENT two finished pieces are (higher = more distinct) ----
// A coarse articulation profile for the bank-uniqueness DISTANCE metric only (not generation). It reads `tempo` on
// purpose: pieceSig runs on stored bank pieces too, and clean() strips `_char`, so tempo is the only character signal
// available symmetrically on both the candidate and the pieces it is compared against. (Not a generation hack.)
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
// Collection-diversity picker: spread a choice across the book toward the POOL RATIO (an option listed N times is meant
// to occur N-in-total). Score each distinct value by its actual count PER target slot and take the lowest, so a 1-in-5
// pool ['x','y','y','y','y'] converges to 20% x, not 50%. (The old version compared raw counts, ignoring multiplicity,
// so every minority pool balanced to ~50% in a real book - doubling/double-stop fired 50% instead of their 20%/33%.)
// Equal-multiplicity pools (each value once) are unchanged: score = count, same least-used pick and tie-break.
const pickLeastUsed = (options, counts) => {
  if(!counts) return rnd(options);
  const mult = {}; for(const o of options) mult[o] = (mult[o]||0) + 1;
  let best=null, bs=Infinity;
  for(const o of options){ if(o in mult){ const s=(counts[o]||0)/mult[o]; if(s<bs){ bs=s; best=o; } delete mult[o]; } }  // each distinct value once, in pool order (tie-break)
  return best!=null ? best : options[0];
};
const clamp=(i,hi)=>Math.max(0,Math.min(hi,i));
// motif-persistence (0..1): how strongly a character CARRIES its groove vs YIELDS - drive (detach+accent) minus yield
// (drop+melBreath+ferm), centred at 0.5. One home for the formula so the rhythm engine and the accompaniment deployment
// reason motion-vs-repose from the SAME axis (the breath, the fill, texture-variation, and now the melodic long-note).
const motifPersistOf = c => clamp(0.5 + (c.detach + c.accent) - (c.drop + c.melBreath + c.ferm), 1);
// Rough crotchet-BPM for a tempo marking, so articulation can reason about a note's REAL duration in seconds
// (a semiquaver is crisp and playable staccato at Adagio, a blur at Allegro). Checked slowest-first.
// TEMPO is a real NUMBER, not something reverse-engineered from the printed word by regex. Each marking carries its
// conventional crotchet BPM; the printed mark is picked from the character's own vocabulary (its marks are all in the
// character's tempo band), and BOTH the playability tempo (bpmOf) AND the speed class (spd, below) read this number -
// no text matching. (Buckets align with the old slow<88 / mod 88-119 / fast>=120 split so note density is unchanged.)
const MARK_BPM = {
  // --- slow (<88) ---
  'Lento':54,'Adagio':56,'Adagio espressivo':56,'Slowly':58,'Rather sadly':58,'Sadly':60,'Mesto':60,'Wistfully':63,
  'Lullaby':63,'Broadly':63,'Larghetto':66,'Maestoso':66,'Tenderly':66,'Peacefully':66,'Calmly':69,'Grandioso':69,
  'Grandly':69,'Sweetly':72,'Gently':72,'Gently rocking':72,'Andante sostenuto':72,'Andante dolce':74,
  'Andante tranquillo':74,'Andante':88,'Andante cantabile':76,'Andante espressivo':76,'Cantabile':76,'Smoothly':76,
  'Con espressione':78,'Espressivo':78,'Expressively':78,'Andante grazioso':90,'Moderato cantabile':84,
  'Moderato e cantabile':84,'Moderato espressivo':84,'Andantino':88,'Andante con moto':92,
  // --- moderate (88-119) ---
  'Molto moderato':90,'Valse lente':92,'Moderato':96,'Comodo':96,'Flowing':96,'Steadily':100,'With movement':100,
  'Poco allegretto':104,'Delicately':104,'Con moto':104,'Grazioso':108,'Gracefully':108,'Lilting':108,
  'Allegro moderato':108,'Minuet':112,'Tempo di minuetto':112,'Allegretto':112,'Allegretto grazioso':112,
  'Allegretto ritmico':112,'Allegretto capriccioso':116,'Allegretto leggiero':116,'Allegretto scherzando':116,
  'Waltz':116,'Valse':116,'Tempo di valse':116,
  // --- fast (>=120) ---
  'March':120,'Alla marcia':120,'Tempo di marcia':120,'Marziale':120,'Boldly':120,'Proudly':120,'Rhythmically':112,
  'Poco vivace':126,'Leggiero':126,'Fanfare':126,'Jauntily':128,'Playfully':128,'Dancing':128,'Happily':130,
  'Allegro':132,'Allegro risoluto':132,'Lively':132,'Lively and strong':132,'Brightly':132,'Cheerfully':132,
  'Giocoso':132,'Scherzando':132,'Merrily':138,'Allegro giocoso':138,'Con brio':138,'Brioso':138,'Energetically':138,
  'Vivace':152,
};
const bpmOf = mark => MARK_BPM[mark] ?? 100;   // real per-mark tempo; 100 = a safe moderate default for any unlisted mark
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
// carries a base texture pool (ordinary textures, no rests) + PARAMETERS, each described by what the code ACTUALLY does:
//   detach   = accompaniment lift - selects a rest-bearing/lifted accompaniment figure (useFig; a lifted oom-pah is a
//              march tread, 0 = legato/held), and a DRIVE term in motif-persistence.
//   drop     = tendency to YIELD the groove / leave textural space - a YIELD term in motif-persistence (raises how
//              readily the accompaniment breathes). [TODO deployment reasoner: also drive a literal hand-drops-out bar.]
//   melBreath= tendency toward a melodic breath/gap - a YIELD term in motif-persistence. [TODO: also drive literal
//              melodic breaths in the melody.]
//   stac     = melodic staccato (dotting of a recurring short-note figure).
//   accent   = accent frequency, and a DRIVE term in motif-persistence.
//   ferm     = expressive-repose tendency -> fermata frequency (and a yield term in persistence).
//   hair     = expressive tendency -> how readily a phrase-arc earns a hairpin.
//   dyn      = the opening dynamic band.
// Nothing is a template; every value varies per piece. (Legend corrected 2026-08-06 to match behaviour after the audit.)
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
// MELODIC FIGURATION emerges from CHARACTER (positive, not a book-diversity coin): a composer's tune moves the way its
// character sings. A cantabile/lyrical line is CONJUNCT (scale motion + expressive turns), never bare arpeggios; a
// march/fanfare/grand statement OUTLINES THE TRIAD (arpeggio - this is where a leaping melody legitimately emerges); a
// scherzo/dance PLAYS (turns + neighbour groups + witty skips); a flowing/moderate piece MIXES. So the figure pool is the
// character's, and the least-used-in-pool tie-break only spreads variety WITHIN what that character would idiomatically do.
// (run=scale/steps · turn=turn ornament · neighbour=neighbour group · arp=arpeggio/leaps · mix=gap-driven mixed motion.)
const CHAR_FIGS = {
  singing:    ['run','mix','turn'],       // Cantabile: a sung line is conjunct + lyrical turns; no leaping arpeggios
  lyricalslow:['run','turn','mix'],       // Adagio/lament: expressive stepwise, sighing turns
  flowing:    ['mix','run','turn'],       // Moderato: moderate mixed motion
  dance68:    ['turn','neighbour','mix'], // lilting 6/8 dance: decorative
  dance24:    ['mix','arp','run'],        // cheerful 2/4: bright, some triadic bounce
  scherzo:    ['neighbour','turn','arp'], // Scherzando: witty skips + turns
  waltz:      ['run','mix','turn'],       // flowing waltz line
  minuet:     ['turn','mix'],             // courtly ornaments
  march:      ['arp','mix'],              // Alla marcia / Fanfare / Boldly: outlines the triad (LEAPS)
  rhythmic:   ['mix','arp','run'],        // driving, motoric
  grand:      ['arp','mix'],              // Maestoso / Grandioso: broad arpeggiated gestures
  lively:     ['mix','run','arp'],        // Allegro: energetic mixed
};
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
// ================= VOICE-IMPLIED HARMONY ENGINE (additive; wired in behind a flag) =================
// Matthew's model: harmony is what the two moving VOICES imply. The melody is a shaped line; the bass is a
// real voice-led line (mostly stepwise, contrary/oblique to the melody); each beat the two outer notes imply
// the diatonic chord that holds both structural notes, functionally sane from the previous, aimed at the next
// anchor. Change-rate is whatever the lines make it (every beat or held), decoupled from the bar AND the grade.
// The PULL that stops it going random = the voice-leading itself. Proven in _voiceharm-proto.mjs (99.7% chord-
// tone fit, 96.3% functional, 92.8% contrary bass at grade 2). Ported here verbatim in logic for the wire-in.
const VH_GRAM = {
  maj:{ I:['ii','iii','IV','V','vi','I'], ii:['V','vii','ii'], iii:['IV','vi','ii','iii'], IV:['V','ii','I','IV'], V:['I','vi','V'], vi:['ii','IV','V','vi'] },
  min:{ i:['iv','v','V','III','VI','i'], iv:['V','v','i','iv'], v:['i','VI','v'], V:['i','VI','V'], III:['iv','VI','III'], VI:['iv','V','VI'] },
};
const vhHas = (ch,mode,deg) => (CHORD_DEG[mode][ch]||[]).includes(((deg%7)+7)%7);
const vhRoot = (ch,mode) => (CHORD_DEG[mode][ch]||[0])[0];
// FUNCTIONAL PLAN: the three harmonic FUNCTIONS and the diatonic chords that serve each. A phrase's harmony is a journey
// through these (tonic area -> pre-dominant -> dominant -> resolve), giving it INTENTION - each chord is there for its role
// in the arc, not just because it fits the note under it (Matthew: it must read as reasoned, not chords that vaguely work).
// A phrase is a JOURNEY through these functions (not a stay at home): HOME (tonic) -> AWAY (leave it) -> PRE-DOMINANT
// (build) -> DOMINANT (tension) -> resolve. The AWAY function is what actually gets the harmony to LEAVE the tonic, so the
// phrase travels instead of sitting on I - which is why the bass moves and it reads as composed (Matthew).
const VH_FUNC = {
  maj:{ T:['I'], AWAY:['vi','iii','IV'], PD:['ii','IV'], D:['V'] },
  min:{ T:['i'], AWAY:['VI','III','iv'], PD:['iio','iv'], D:['V','v'] },
};
const _FORDER = { T:0, AWAY:1, PD:2, D:3 };
const vhFuncOf = (ch,mode) => { for(const f of ['T','AWAY','PD','D']) if((VH_FUNC[mode][f]||[]).includes(ch)) return f; return 'T'; };
// melodyDegs: array (one per structural beat) of scale-degree 0..6 the melody sits on. anchors: array of
// {pin} (a chord string to force, e.g. tonic at the open/close, V at a half cadence) or null. Returns
// {chords:[], bass:[](scale-degree with octave offset so a line can be read)}.
function vhDerive(melodyDegs, mode, anchors, funcs, legal, mustRe){
  const chs = (legal && legal.length ? Object.keys(CHORD_DEG[mode]).filter(c=>legal.includes(c)) : Object.keys(CHORD_DEG[mode]));
  const chords=[], bass=[];
  const tonic = mode==='maj'?'I':'i';
  let prevCh=tonic, prevBass=0, prevMel=melodyDegs[0]??0;
  for(let i=0;i<melodyDegs.length;i++){
    const m=((melodyDegs[i]%7)+7)%7, isFirst=i===0, isLast=i===melodyDegs.length-1;
    const pinned = anchors&&anchors[i]&&anchors[i].pin;
    // The candidate set is EVERY diatonic chord; the planned function is a SOFT lean in the scoring, not a filter - so the
    // harmony is free to change WITHIN a bar to harmonise a moving melody (a passing step gets its own chord, voice-led),
    // which is the richer harmonic rhythm that makes it interesting. A hard per-bar function forced one chord a bar.
    let cand = pinned ? [anchors[i].pin] : isFirst||isLast ? [tonic] : chs.slice();
    const wantFunc = (!pinned && !isFirst && !isLast && funcs && funcs[i]) ? funcs[i] : null;
    const melDir=Math.sign(m-prevMel);
    let best=null, bestScore=1e9, bestBass=prevBass;
    for(const ch of cand){
      const chordTone=vhHas(ch,mode,m), tones=CHORD_DEG[mode][ch];
      let bBass=null, bBs=1e9;
      for(const td of tones) for(let oct=-1;oct<=1;oct++){ const bd=td+oct*7, move=bd-prevBass, ad=Math.abs(move);
        const bDir=Math.sign(move);
        // a bass is a LINE: a STEP is the cheapest move, holding a common tone through a chord change costs more, and a bigger
        // leap costs most (ad*1.2) -> the low voice WALKS rather than leaping. A leap past a 5th isn't BANNED, just expensive
        // enough that it only wins when no nearer chord tone will do - a preference, not a wall (a composer's bass can leap an octave).
        let s = ad===1 ? 0.0 : ad===0 ? (ch!==prevCh?1.4:0.3) : ad*1.2;
        if(bDir!==0 && melDir!==0 && bDir===melDir) s+=2.0;        // prefer CONTRARY/oblique to the melody
        if(td!==vhRoot(ch,mode)) s+=0.35;                          // prefer root in the bass; a stepwise inversion still beats a held root
        if(s<bBs){bBs=s;bBass=bd;}
      }
      if(bBass==null) continue;
      let score=bBs;
      if(!chordTone) score+=3.0;                                   // structural melody note off the chord = likely the wrong chord
      if(!isFirst && !(VH_GRAM[mode][prevCh]||[]).includes(ch)) score+=2.5;   // functional continuation from the previous chord
      // FUNCTIONAL PROGRESSION (intention): the harmony moves FORWARD through the plan (tonic-area -> pre-dominant ->
      // dominant), and dominant RESOLVES to tonic. It does not backslide - no D->PD, no PD falling back to T mid-phrase.
      if(!isFirst){ const pf=vhFuncOf(prevCh,mode), cf=vhFuncOf(ch,mode);
        if(_FORDER[cf]<_FORDER[pf] && !(pf==='D'&&cf==='T')) score+=2.0; }
      if(wantFunc && !(VH_FUNC[mode][wantFunc]||[]).includes(ch)) score+=2.0;   // lean toward the planned function (leaving home when the plan says AWAY); strong enough to actually travel, still soft (the line can override to hold a note)
      // MELODY LEADS when it MOVES: when the melody STEPS to a new note, harmonise it with a NEW chord that voice-leads - a
      // stepwise line gets a chord per beat, the bass stepping between them. The line is driving and the harmony follows it.
      if(Math.abs(m-prevMel)===1 && ch!==prevCh) score-=0.9;
      // HARMONY LEADS when the melody is STATIC (Matthew): a held or repeated structural note is exactly where a composer
      // moves the harmony BENEATH it - the held note becomes a common tone of a changing progression, and the interest comes
      // from the harmony travelling under a still line (the reharmonised pedal/sustain). So when the melody repeats its note,
      // prefer a DIFFERENT chord that still CONTAINS it (a voice-led common-tone move) over sitting on the same chord. This is
      // leadership shifting to the harmony in the one situation that calls for it. A lean, not a force - a genuine repose can
      // still hold - and the functional-continuation + bass voice-leading terms above still decide WHICH chord, so the move
      // stays idiomatic and clean by construction. (Was the passive "holding is fine": a composer does not let both voices sit.)
      if(m===prevMel && ch!==prevCh && chordTone) score-=1.1;
      if(ch===prevCh) score+=0.8;                                  // mild lean to CHANGE, never forced
      // The same principle one level UP: a repeated two-note CELL (this note AND the one before it both recur two beats back,
      // e.g. C-Bb C-Bb) is the melody treading, not moving - so lean the harmony to be the event under it too, re-lighting the
      // repeated cell rather than leaving it dead over one held chord. A lean (a cell-repeat is looser than a deliberate hold).
      if(i>=3 && m===melodyDegs[i-2] && melodyDegs[i-1]===melodyDegs[i-3] && ch===prevCh) score+=1.3;
      // COORDINATED HOLD + RECOLOUR: the melody chose to HOLD this note precisely so the harmony would shift the feeling under
      // it. So here the change is not a lean but a REQUIREMENT - keeping the same chord is heavily penalised, forcing a genuine
      // recolour (always possible: the melody only holds where the note sits in more than one chord). The two voices act as one.
      if(mustRe && mustRe[i] && ch===prevCh) score+=6;
      // and the recolour should change the FEELING, not just the chord: prefer a shift of QUALITY (major <-> minor) under the
      // held note - E over C major (bright) becoming E over A minor (dark) is the sentiment; a same-quality swap barely re-lights it.
      if(mustRe && mustRe[i] && ch!==prevCh && (/^[a-z]/.test(ch)?'min':'maj')!==(/^[a-z]/.test(prevCh)?'min':'maj')) score-=1.2;
      if(score<bestScore){bestScore=score;best=ch;bestBass=bBass;}
    }
    if(!best){best=prevCh;bestBass=prevBass;}
    chords.push(best); bass.push(bestBass);
    prevCh=best; prevBass=bestBass; prevMel=m;
  }
  return {chords, bass};
}
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
  for(let i=0;i<nbeats;i++){ let c=rnd(pool);   // exploratory compound beat-cell (rhythmic invention); diversity is enforced by gen-batch's rhythm-spread selection, not a per-beat constraint
    if(_semis(c)>=3 && busyUsed) c=rnd(core);   // at most ONE semiquaver-run beat per bar (keeps it playable)
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
  { t:['2/4'], g:[2,3,4], f:['smooth'],       s:[['b',2]] },                                          // held whole-bar bass (calm/sustained; broken up if repeated)
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
  { t:['3/4'], g:[2,3,4], f:['smooth','crisp'], s:[['b',2],['c',1]] },                                // bass held two beats, chord on 3
  { t:['3/4'], g:[2,3,4], f:['crisp','lilt'], s:[['b',1],['r',1],['c',1]] },                          // bass, lift, chord on 3
  { t:['3/4'], g:[2,3,4], f:['smooth'],       s:[['c',1,'->'],['r',2]] },                             // struck chord then silence
  // ===== 4/4 =====
  { t:['4/4'], g:[2,3,4], f:['crisp'],        s:[['b',1,'->'],['c',1],['b',1],['c',1]] },             // march: bass chord bass chord
  { t:['4/4'], g:[2,3,4], f:['crisp'],        s:[['b',1,'->'],['c',1],['r',1],['c',1]] },             // march with a lift on 3
  { t:['4/4'], g:[2,3,4], f:['smooth','crisp'], s:[['c',1,'->'],['r',1],['c',1,'->'],['r',1]] },      // maestoso: chords split by silence
  { t:['4/4'], g:[2,3,4], f:['smooth'],       s:[['c',2,'->'],['r',2]] },                             // maestoso: weighty chord then silence
  { t:['4/4'], g:[2,3,4], f:['smooth','crisp'], s:[['b',1],['c',3]] },                                // bass then held chord
  { t:['4/4'], g:[2,3,4], f:['crisp','lilt'], s:[['b',1],['c',1],['r',1],['c',1]] },                  // oom-pah with a lift on beat 3
  { t:['4/4'], g:[3,4],   f:['crisp'],        s:[['b',0.5,'->'],['r',0.5],['c',0.5,'-.'],['r',0.5],['b',0.5,'-.'],['r',0.5],['c',0.5,'-.'],['r',0.5]] }, // crisp detached march
  { t:['4/4'], g:[3,4],   f:['lilt','smooth'], s:[['b',0.5],['c',0.5],['c',0.5],['c',0.5],['b',0.5],['c',0.5],['c',0.5],['c',0.5]] }, // alberti/broken (running)
  { t:['4/4'], g:[2,3,4], f:['smooth','crisp'], s:[['b',2],['c',2]] },                                // bass half, chord half
  { t:['4/4'], g:[2,3,4], f:['smooth','crisp'], s:[['b',2],['c',1],['c',1]] },                        // bass half, then two chords
  { t:['4/4'], g:[2,3,4], f:['smooth'],       s:[['b',1],['c',2],['c',1]] },                          // bass, held chord, chord
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
  // ---- GRADE 2 (swap = melody in the LH; RH accompanies) ----
  // At grade 2 chordMax=1, so a block chord ('c') collapses to ONE repeated top note (dead). The grade-2 accompaniment
  // therefore MOVES via broken-chord arpeggios ('a' cycles the chord tones low->high as single notes) or breathes via
  // rests - never a static repeated chord. Kept simple (crotchet/quaver, five-finger reachable) for a beginner RH.
  { t:['4/4'], g:[2,3,4], f:['smooth','lilt'], s:[['a',1],['a',1],['a',1],['a',1]] },                                 // broken chord, walking crotchets
  { t:['4/4'], g:[2,3,4], f:['smooth','lilt'], s:[['a',0.5],['a',0.5],['a',1],['a',0.5],['a',0.5],['a',1]] },         // broken, quaver-pair into a crotchet
  { t:['4/4'], g:[2,3,4], f:['crisp','lilt'],  s:[['a',1],['r',1],['a',1],['r',1]] },                                 // note + rest bounce (light)
  { t:['4/4'], g:[2,3,4], f:['smooth'],        s:[['a',2],['a',2]] },                                                 // gentle half-bar sway (two tones)
  { t:['3/4'], g:[2,3,4], f:['smooth','lilt'], s:[['a',1],['a',1],['a',1]] },                                        // broken waltz, crotchets
  { t:['3/4'], g:[2,3,4], f:['crisp','lilt'],  s:[['a',1],['a',0.5],['a',0.5],['a',1]] },                            // broken waltz with a quaver pair
  { t:['3/4'], g:[2,3,4], f:['smooth'],        s:[['a',1.5],['a',1.5]] },                                            // slow sway (two tones)
  { t:['2/4'], g:[2,3,4], f:['smooth','lilt'], s:[['a',1],['a',1]] },                                                // broken, two notes
  { t:['2/4'], g:[2,3,4], f:['crisp','lilt'],  s:[['a',1],['r',1]] },                                                // note + rest
  { t:['2/4'], g:[2,3,4], f:['smooth'],        s:[['a',0.5],['a',0.5],['a',0.5],['a',0.5]] },                        // flowing broken (quavers)
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
function genContour(nbars,span,bias,tensionByBar){
  // The melody's ARC FOLLOWS the harmony's own tension: the line rises toward the harmonic climax and falls to resolution.
  // The SHAPE EMERGES from the progression - a different harmonic journey gives a different contour - so diversity is REAL
  // (it comes from the music being different, not a die), there is no collapse to one archetype, and the melodic peak lands
  // where the tension genuinely peaks. Smoothed into a melodic line (a tune arcs, it does not jump chord-to-chord). A LAMENT
  // (bias==='fall') sinks against the lift - the sad affect overrides. Returns a target scale-degree height per bar in [0,span].
  const S=span;
  const T=(tensionByBar && tensionByBar.length===nbars) ? tensionByBar : Array.from({length:nbars},()=>1);
  const sm=T.map((_,b)=>{ let s=0,w=0; for(let k=-1;k<=1;k++){ const j=b+k; if(j>=0&&j<nbars){ const wk=k===0?2:1; s+=(T[j]??1)*wk; w+=wk; } } return s/w; });  // 3-point smooth: a line, not a chord-by-chord jump
  const lo=Math.min(...sm),hi=Math.max(...sm),rng=hi-lo;
  let out;
  if(rng<0.5){
    // the harmony gives no tension gradient (a static progression) - so the line takes its OWN plain arch, peaking ~two-thirds
    // through and resolving. A default only where the harmony itself is flat, never a stamp over a harmony that has a shape.
    out=Array.from({length:nbars},(_,b)=>{ const t=nbars>1?b/(nbars-1):0; return Math.round(S*(t<=0.62? t/0.62 : (1-t)/0.38)); });
  } else {
    out=sm.map(v=>Math.round(((v-lo)/rng)*S));                        // height tracks the smoothed harmonic tension
  }
  if(bias==='fall') out=out.map(v=>S-v);                              // a lament descends where the harmony would lift it
  return out.map(v=>Math.max(0,Math.min(S,v)));
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
  lilt:   [[1],[1],[0.5,0.5],[0.75,0.25],[0.5,0.25,0.25]],                                      // graceful: dotted lilt, with an occasional gentle semiquaver figure (a graceful piece CAN run - the semiquaver was cut before)
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
function wideBar(barU,feel,spd,march,calmMel,minDur=0.25,motif=0.5,fig='mix'){
  // STYLE IDIOM (COMPOSITION-SPEC §13): a MARCH leans on the dotted long-short figure. Upweight the dotted-quaver-
  // semiquaver cell (and the plain crotchet tread) for march pieces - a bias, not a stamp, so the melody still varies.
  let qpool = march ? [...(QFEEL[feel]||QFEEL._def), [0.75,0.25],[0.75,0.25],[1]] : (QFEEL[feel] || QFEEL._def);
  // GRADE NOTE-VALUE FLOOR (single rhythm engine, gated by the parameter): grade 2 = quaver (0.5), so its
  // subdivisions drop the semiquaver cells; grades 3+ keep them. This is what lets ONE engine serve every grade.
  qpool = qpool.filter(c=>c.every(d=>d>=minDur-1e-9)); if(!qpool.length) qpool=[[1]];
  const mset = MACRO[barU] || MACRO[2];
  // the bar's beat-pattern is the piece's free RHYTHMIC INVENTION (its motif material) - exploratory here so the
  // rejection sampler can search; the collection's rhythm diversity is enforced by SELECTION (gen-batch's domRhythm
  // spread screen rejects a piece whose dominant bar-rhythm repeats its neighbour), which is the real diversity reason.
  const macro = rnd(feel==='smooth' ? mset.smooth : mset.busy);
  // RHYTHM COMPLEXITY is a style feature tied to TEMPO (COMPOSITION-SPEC §12): at a FAST tempo, stacking several
  // semiquaver beats in a bar turns frantic and un-idiomatic (a fast 3/4 with ten semiquavers). Cap how many beats
  // in a bar may carry semiquavers - quaver movement stays completely free, so the piece is still lively - while a
  // moderate/slow tempo leaves them free (semiquavers are playable and expressive there). Mirrors compoundBar's cap.
  const semiCap = calmMel ? 0 : 99;   // busy accomp at speed -> melody keeps to quavers (the calmMel density budget, a real constraint). The old fast->1 cap FORBADE brilliant fast writing (a toccata/moto perpetuo) - a cut; the grade note-value floor governs playability and the pool's own mix keeps density varied, so no tempo cap
  const hasSemi = c => c.some(d=>d<0.5-1e-9);
  let semiUsed=0;
  const drawBeat = () => { let c=rnd(qpool);   // exploratory beat subdivision (rhythmic invention); book-wide rhythm diversity is a SELECTION screen in gen-batch, not a per-beat constraint (that starves the rejection sampler)
    if(hasSemi(c) && semiUsed>=semiCap){ const plain=qpool.filter(x=>!hasSemi(x)); c = plain.length?rnd(plain):[0.5,0.5]; }
    if(hasSemi(c)) semiUsed++; return c; };
  const out=[];
  for(const span of macro){
    if(span>=2){                                         // a long note (minim / dotted minim)...
      // KEEP IT WHOLE (the melody breathes) or SUBDIVIDE it into motion - the same motion-vs-repose fork the accompaniment
      // deployment uses, reasoned from the character not a flat coin: a long note RINGS by default and the character's
      // DRIVE is what fills it, so keep-whole leans with YIELD (1-motif). A cantabile (yield high) essentially always
      // holds it; a driving character fills it more often; the 0.25 baseline means even a driver leaves it whole sometimes
      // (rules nothing out). (Was `feel==='smooth' || chance(0.6)` - smooth-always + a flat coin for the rest.)
      if(chance(clamp(0.25 + (1-motif), 1))) out.push(span); // ...kept whole
      else { let s=span; while(s>0.5+1e-9){ out.push(...drawBeat()); s-=1; } }   // ...subdivided into beats (incl. x4)
    } else out.push(...drawBeat());                       // a beat: a beat-level subdivision
  }
  // A melody of only plain crotchets arpeggiates: a chord tone lands on every beat with no off-beat slot for a
  // passing/auxiliary note, so it leaps through the triad instead of stepping. Ensure at least one beat subdivides
  // so the line can SING. (A single held long note is fine - that's a breath, not an arpeggio.) BUT the SEED-FIRST
  // binding: a LEAPING (arp) figure WANTS to arpeggiate through the beats - that IS its gesture - so for an arp figure
  // the all-crotchet rhythm is left alone; a stepping (run/turn/neighbour) figure keeps the subdivision so it can step.
  // This is pitch and rhythm as one gesture: the rhythm's subdivision follows whether the line leaps or steps (Matthew).
  if(fig!=='arp' && out.length>=2 && out.every(d=>Math.abs(d-1)<1e-9)){
    const subs=qpool.filter(c=>c.length>1 && (!calmMel || !c.some(d=>d<0.5-1e-9)));   // respect the density budget: no semiquaver splice when calm
    if(subs.length){ const i=Math.floor(Math.random()*out.length); out.splice(i,1,...rnd(subs)); }
  }
  return out;
}
function barRhythm(barU,wide,compound,feel,spd,march,calmMel,minDur=0.25,motif=0.5,fig='mix'){
  if(compound){ return compoundBar(barU,feel,calmMel); }   // composable dotted-crotchet beats (already caps semiquaver runs at 1/bar)
  // ONE rhythm engine for EVERY grade (was: grade 2 used a separate flat RHY-cell list with no long notes and no
  // anti-arpeggio guard — the "everything is a quarter note" fault). wideBar's note-value floor (minDur) is the gate.
  return wideBar(barU,feel,spd,march,calmMel,minDur,motif,fig);   // fig = the melodic figure family, so the rhythm binds to whether the line leaps or steps
}


// ---- expression helpers ----
const noteBarsOf=(seq,barU)=>{ let t=0; return seq.map(n=>{ const b=Math.floor(t/barU+1e-9); t+=n.d; return b; }); };
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
                  [[6,hd],[0,tl]],                                  // 7 -> 1 (leading tone rising into the tonic; ^7 is raised in minor by the harmonic-minor pass). Reachability-guarded at the application site: dropped to ^2->^1 when the fixed window has no leading tone below the tonic.
                  [[4,hd],[0,tl]] ];                                // 5 -> 1 (falling)
  if(!compound && barU>=3){ melPool.push([[2,1],[1,1],[0,barU-2]],  // 3 -> 2 -> 1 descent
                                         [[2,hd],[0,tl]]); }        // 3 -> 1
  if(!compound) melPool.push([[1,0.5],[0,barU-0.5]]);               // quaver appoggiatura -> 1
  const mel = rnd(melPool);
  // PAIR the bass to the melody. The ^5->^1 bass under a melody that ALREADY sits on the tonic at the downbeat makes a weak
  // I6/4 - the tune is a 4th above the dominant bass and the bass then just falls to the root, never resolving through V (a
  // real cadential 6/4 keeps the bass on ^5 into a V). So a tonic-on-the-downbeat close takes a ROOT-position bass (a clean
  // tonic, both hands on ^1); only a melody that moves ^2/^7/^3/^5 -> ^1 forms a genuine V over the ^5 bass. 6/4 never built.
  const melTonicDownbeat = (((mel[0][0]%7)+7)%7)===0;
  const lh = melTonicDownbeat ? [[0,barU]] : rnd(lhPool);
  // ENDING RESOLUTION: the final note (the tonic) must land ON a beat and be held at least a full beat - never a short
  // off-beat quaver close, which reads as an odd, unfinished rhythm (Matthew's exercise-2 ending). If the pattern's last
  // note is shorter than a beat, give it the last whole beat by borrowing from the note before it.
  if(mel.length>=2){ const li=mel.length-1; if(mel[li][1] < beatLen-1e-9){ const need=beatLen-mel[li][1];
    mel[li-1][1]-=need; mel[li][1]=beatLen; if(mel[li-1][1]<=1e-9) mel.splice(li-1,1); } }
  return { lh, mel };
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
  // MAJOR/MINOR spreads across the book by collection-diversity (the least-used so far) - a varied book uses both; minor
  // only where the grade lists minor keys. Not a die: the reason is the collection's balance. (Standalone/first piece free.)
  const _modeOpts = (gp.keys.minor||[]).length>0 ? ['maj','min'] : ['maj'];
  const mode = pickLeastUsed(_modeOpts, opts.hist && opts.hist.mode);
  const isMin = mode==='min';
  const keyset=(gp.keys[mode==='maj'?'major':'minor']||[]).map(nm=>KEYINFO[mode][nm]).filter(Boolean);   // key set ← grade params (the table governs which keys)
  // KEY spreads across the book (least-used so far) so the collection covers the grade's keys evenly; standalone/first piece free.
  const [ly,rhTonic,flat]=(opts.hist && opts.hist.key) ? keyset.reduce((b,k)=>(opts.hist.key[k[0]+'|'+mode]||0)<(opts.hist.key[b[0]+'|'+mode]||0)?k:b) : rnd(keyset);   // spread by key AND mode (D major and D minor share the letter 'd'; counting the letter alone starved one of them)
  const times = gp.timeSignatures;                            // metre list ← grade params (the table governs which metres)
  const time=opts.time||pickLeastUsed(times, opts.hist && opts.hist.time);   // metre spreads across the book (least-used), not a die
  const [top,bottom]=time.split('/').map(Number); const barU=(top/bottom)*4;
  const compound=(bottom===8 && top%3===0); const beatLen=compound?1.5:1; const nbeats=Math.round(barU/beatLen);
  const nbars = gp.bars[time] ?? (grade===2 ? (time==='2/4'?6:4) : 8);   // bar count ← grade params (fallback keeps any unlisted metre safe)
  const wide = !gp.range.fixedPosition;                   // out-of-position ← grade params (fixedPosition=false at G3+)
  // ONE scale array for all grades. The grade-2 five-finger "box" (POS = [0,2,4,5,7]) is just SCALE's first five
  // degrees, and a fixed-position grade only ever indexes this via clamp(_, span=4), so SCALE serves every grade -
  // the position window is expressed by (winLo, span) below, not by a separate array.
  const off = SCALE[mode];
  const span = wide ? 7 : 4;                              // melody index range 0..span (octave for G3+)
  const swap = opts.swap ?? (pickLeastUsed(['swap','normal','normal','normal','normal'], opts.hist && opts.hist.swap)==='swap');   // ~1 in 5 pieces: the LEFT hand carries the melody (collection-diversity, not a raw coin)
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
  // CHARACTER is the ONE free seed for a standalone/first piece; across the BOOK it spreads by collection-diversity (the
  // least-used character so far) so the exercises don't all share one feeling. Free only when there's no collection (opts.hist).
  const character = charPool.length ? ((opts.hist && opts.hist.char) ? charPool.reduce((b,c)=>(opts.hist.char[c.id]||0)<(opts.hist.char[b.id]||0)?c:b) : rnd(charPool)) : CHARACTERS[0];
  const half = Math.ceil(nbars/2);
  // PARALLEL period (consequent restates the opening) vs CONTRASTING - spread across the book by diversity, not a die (needs
  // room, nbars>=6). Which one a piece is comes from the collection's balance, so the book teaches both period types.
  const restate = nbars>=6 && pickLeastUsed(['contrast','restate'], opts.hist && opts.hist.restate)==='restate';
  const cad = cadenceFigure(barU, beatLen, compound);   // this piece's cadence, drawn from the pool
  // the MIDPOINT is pooled, not fixed: half cadence (V) / imperfect cadence (I) / continuous (no midpoint stop)
  // Interrupted (deceptive) cadence, available when the grade lists it AND vi/VI is voiceable: the antecedent's V
  // resolves deceptively to vi across the midpoint, evading the tonic and driving the consequent onward to a real PAC.
  const _interruptOK = ((gp.harmony && gp.harmony.cadences) || []).includes('interrupted') && wide;   // wide => the vi/VI-bearing chord set is active (grade 3+); interrupted listed from grade 4
  // MID-CADENCE type spreads across the book by diversity, gated only by what THIS piece can HARMONICALLY support. Whether a
  // period ARTICULATES its midpoint (a half cadence / imperfect cadence stop) or runs CONTINUOUSLY through the seam (no
  // mid-stop) is a STRUCTURAL choice open to ANY character - a crisp 8-bar sentence runs on just as a singing line does, so
  // it is not a feel: the old feel gate wrongly barred every crisp/detached piece from a continuous seam. The one genuine
  // precondition is harmonic - the interrupted/deceptive (DC) needs the grade's vi-bearing set (_interruptOK). And a
  // parallel restate still forces HC just below (the restated answer needs an open question), so 'continuous' only ever
  // lands on a CONTRASTING period, where running through the midpoint is always valid. Least-used so the book covers all.
  const _midOpts = ['HC','IAC','continuous'].concat(_interruptOK ? ['DC'] : []);
  let midType = pickLeastUsed(_midOpts, opts.hist && opts.hist.midType);
  // A PARALLEL period (the consequent restates the opening idea) sets the ear up to hear the antecedent as a
  // question the restate answers — so its midpoint MUST cadence. A 'continuous' midpoint under a restate drifts
  // tonic-to-tonic and the repeat then feels unmotivated (Matthew: bar 4 was I approached from a rootless bar, so
  // it didn't read as a cadence even though the idea came back). Force a real cadence there, biased to the
  // textbook half cadence (antecedent ends open on V; the consequent then answers with the closing perfect cadence).
  // a PARALLEL period restates the opening idea, so its antecedent must end OPEN (on the dominant) for the restated
  // consequent to answer and close - that is a half cadence by function. Not a die: the restatement structure requires it.
  if(restate) midType = 'HC';
  // ONE chord vocabulary for every grade: a composer reaches for any diatonic chord and VOICES it to fit the hand
  // (an inversion when the root would fall outside the five-finger position) - they don't keep a permitted-list and cross
  // vi/VI off it. The grade decides the VOICING (root position when it fits, an inversion otherwise - handled by the bass
  // logic + the chordMax clamp), NOT which chords exist. (Was `wide ? full : CH` - a grade-2 vocabulary fork that dropped
  // vi/VI purely because their ROOT sits above the box, though they sit perfectly in the hand in first inversion.)
  const CHm = {...CH[mode], ...CH_EXTRA[mode]};
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
  const _collHist = opts && opts.hist;   // buildCandidate opts captured here (moveChord shadows the name), for collection-diversity of chord transitions across the book
  const moveChord = prev => {
    let opts = GRAMMAR[prev] ? GRAMMAR[prev] : moves;   // universal functional grammar at ALL grades (was gated to grade 3+)
    // H1 (all grades): the dominant RESOLVES — to I, or deceptively to the submediant — and never retrogresses to a
    // predominant. The wide GRAMMAR already encodes this; this makes it hold for the flat grade-2 `moves` list too.
    if(prev===Tn.V){ const res=[Tn.I, mode==='maj'?'vi':'VI'].filter(c=>CHm[c]); if(res.length) opts=res; }
    const cand = [...new Set(opts)].filter(c=>c!==prev && CHm[c]);   // GRADE FILTER: only chords voiceable at this grade (grade 2 = five-finger set), so one grammar serves every grade
    if(!cand.length) return prev;
    const weight = c => opts.filter(x=>x===c).length;               // idiomatic weight from the GRAMMAR list
    // HARMONIC JOURNEY (Matthew): a phrase TRAVELS - it visits the AWAY / pre-dominant area, it doesn't just oscillate tonic
    // and dominant. Minor especially collapsed to i-v-i-v (30% of minor pieces on <=2 chords) because its grammar leans i<->v
    // and the harmonic-rhythm hold repeats. So once the piece is under way, LEAN toward a chord it has NOT visited yet - the
    // line goes somewhere new - scaled up for a longer piece (more room to travel). A preference, not a wall: a return/repeat
    // stays available (the tonic pedal, the restate), so a genuinely 2-chord phrase is still reachable where the music wants it.
    const _visited = c => typeof prog !== 'undefined' && prog.includes(c);
    const _spread  = c => (typeof prog !== 'undefined' && prog.length>=3 && !_visited(c)) ? (nbars>=8 ? 1.3 : 0.6) : 0;
    const score  = c => weight(c) + rootMotion(prev,c)*0.5 - (usedMoves.has(prev+'>'+c)?2:0) + _spread(c);
    const best   = Math.max(...cand.map(score));
    const top    = cand.filter(c=>score(c)>=best-1.05);            // ALL functionally-valid successors within reach of the best, not just the single top-scorer: every option here is already an idiomatic GRAMMAR successor, so admitting the near-best ones gives REAL harmonic variety across the book (was near-deterministic -> the same ~13 progressions). Genuine freedom among idiomatic choices, not a wider die.
    // among the equally-valid successors, take the one whose transition (prev->c) is LEAST-USED across the book, so the
    // collection's progressions genuinely spread instead of leaning on the same few. This is the deep reason for the
    // choice - the chords here are all functionally interchangeable, so variety across the collection decides. Free for a
    // standalone/first piece (no collection yet).
    const pick   = (_collHist && _collHist.chordMove)
      ? top.reduce((b,c)=>(_collHist.chordMove[prev+'>'+c]||0) < (_collHist.chordMove[prev+'>'+b]||0) ? c : b)
      : rnd(top);
    usedMoves.add(prev+'>'+pick);
    return pick;
  };
  // FINAL CADENCE, deliberately chosen (Matthew: perfect + plagal endings are the two to use): the
  // penultimate bar is set to the dominant (V-I perfect) or, sometimes, the subdominant (IV-I plagal),
  // rather than whatever chord incidentally preceded the tonic.
  // FINAL cadence chosen for VARIETY ACROSS THE BOOK, not locked to one character: a real exercise book teaches the
  // perfect authentic AND the plagal close, so which one this piece takes is the LEAST-USED so far (perfect the default,
  // plagal where a IV is voiceable). A gentle character still leans plagal (it reads as a hymn/pastoral 'amen'), so it
  // biases the pick, but never gates it. The reason is the collection + character, not the old narrow smooth-legato die.
  const plagalCh = mode==='maj'?'IV':'iv';
  // The plagal close (IV-I, the 'amen') has a GENTLE, hymn/pastoral quality, so it LEANS to a gentle lyrical character
  // (smooth feel + soft dynamic weight); a strong or grand or crisp piece signs off with the decisive PERFECT cadence (V-I).
  // A lean, never a gate - both remain possible for every character (diversity within the lean covers the book). This
  // implements the character bias the note already described but the flat coin never applied.
  const _plagalLean = (character.feel==='smooth' && character.accent < 0.2);   // gentle/lyrical, not the grand smooth
  // A MINOR key leans hard to the AUTHENTIC close: the raised leading tone resolving V->i is what fixes the key, so the
  // plagal iv-i is a rarer, deliberately modal/pastoral device there (an occasional colour, not half the book). In major
  // both closes are common. So minor keeps plagal reachable but a clear minority even for a gentle character - preserving
  // the ~15% leading-tone-free minor close while letting the authentic cadence, and its leading tone, be the norm.
  const _fcOpts = !CHm[plagalCh] ? ['perfect']
                : mode==='min' ? (_plagalLean ? ['perfect','perfect','perfect','plagal'] : ['perfect','perfect','perfect','perfect','perfect','plagal'])
                : _plagalLean ? ['perfect','plagal','plagal'] : ['perfect','perfect','plagal'];
  const finalCad = pickLeastUsed(_fcOpts, opts.hist && opts.hist.finalCad);
  const preTonic = (finalCad==='plagal' && CHm[plagalCh]) ? plagalCh : Tn.V;
  const prog=[];
  // ANCHOR vs MID-PHRASE (for the situational harmony below): the structurally-fixed bars - opening tonic, the mid-phrase
  // cadence and its approach, the penultimate pre-tonic, the final close, a restate/deceptive midpoint - are ANCHORS where
  // the HARMONY leads (the melody spells the arrival). The "genuinely moving inner harmony" bars (moveChord) are the
  // MID-PHRASE spans where the LINE may lead and the chord is derived to follow it. Marked here, used after the contour.
  const anchor = new Array(nbars).fill(true);
  for(let b=0;b<nbars;b++){
    if(b===0) prog.push(Tn.I);
    else if(restate && b===half) prog.push(Tn.I);                    // consequent restates over the tonic
    else if(midType==='DC' && b===half) prog.push(mode==='maj'?'vi':'VI');   // interrupted cadence: the V deceptively resolves to vi
    else if(b===half-1) prog.push((midType==='HC'||midType==='DC')?Tn.V : midType==='IAC'?Tn.I : moveChord(prog[b-1]));
    else if(b===half-2 && b>=1 && midType!=='continuous'){          // APPROACH the midpoint cadence so it's a real one,
      if(midType==='IAC') prog.push(Tn.V);                          //   IAC: the dominant into the tonic (a true V-I),
      else { const pd=(mode==='maj'?['ii','IV']:['iv']).filter(c=>CHm[c]&&c!==prog[b-1]);   //   HC: a pre-dominant into V
        // ii and IV are equally-valid pre-dominants into V - a genuine tie. Break it by collection-diversity: take the
        // one whose pre-dominant->V transition the book has used LEAST (reusing the chordMove histogram), so ii-V and
        // IV-V spread across the collection. Free for a standalone piece; a rootless bar falls back to the grammar.
        prog.push(pd.length
          ? ((opts.hist && opts.hist.chordMove) ? pd.reduce((a,c)=> (opts.hist.chordMove[c+'>'+Tn.V]||0) < (opts.hist.chordMove[a+'>'+Tn.V]||0) ? c : a) : rnd(pd))
          : moveChord(prog[b-1])); }        //   (never a rootless drift into the half cadence)
    }
    else if(b===nbars-1) prog.push(Tn.I);                            // final bar = the cadence figure
    else if(b===nbars-2 && b>half) prog.push(preTonic);             // penultimate = the cadential pre-tonic
    // HARMONIC RHYTHM is a REGULAR property of the character, not a per-bar coin: a crisp/martial piece changes chords
    // more slowly (holds every 2nd interior bar), a flowing one changes almost every bar (holds rarely). The hold stays
    // POSSIBLE for every character (no narrowing) but falls on a character-set PERIOD - a real, legible harmonic rhythm.
    else if(wide && b>1 && b<nbars-2 && (b % (character.feel==='crisp'?2:character.feel==='smooth'?4:3) === 0))   // HOLD any chord on the character's harmonic-rhythm period, INCLUDING I and V (a tonic pedal / a dominant prolongation are valid - the I/V exclusion was a cut the comment itself denied)
      prog.push(prog[b-1]);                                          // HOLD: same chord two bars, on the character's harmonic-rhythm period
    else { prog.push(moveChord(prog[b-1])); anchor[b]=false; }       // genuinely moving inner harmony = a MID-PHRASE span (the line may lead here)
  }
  // ANCHORS ARE ONLY THE STRUCTURAL PILLARS: the opening tonic, the mid-phrase cadence, a restate/deceptive midpoint, the
  // penultimate pre-tonic and the final close. EVERY OTHER BAR is line-derived under the functional plan (tonic-area / pre-
  // dominant), so the harmony is genuinely reasoned across the whole phrase and colours with the line - not pinned to the
  // grammar grid on most bars (which kept it lingering on I-IV-V, and kept the grammar's own V->IV retrogressions). (Matthew.)
  for(let b=0;b<nbars;b++){
    const pillar = b===0 || b===nbars-1 || b===nbars-2 || b===half-1
                   || (restate && b===half) || (midType==='DC' && b===half);
    anchor[b] = pillar;
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
  // WHETHER a piece reaches for the V/V chromatic colour is an OPTIONAL harmonic choice - a composer decides if THIS
  // piece has that one chromatic moment. Making it fire on every eligible cadence would be deterministic (every such
  // piece identical); a die is not reasoned. So it is a COLLECTION-DIVERSITY choice: spread across the book (least-used),
  // ~a third of pieces, so the chromatic colour recurs but stays a minority. Standalone/first piece = free.
  const wantSecDom = pickLeastUsed(['V/V','plain'], opts.hist && opts.hist.secDom) === 'V/V';   // half of the ELIGIBLE (major, non-swap, tonicisable inner V) pieces carry the colour - a genuine but minority chromatic touch across the book
  if(gp.harmony.midBarChord==='enrich' && nbeatsBar>=2){           // mid-bar chord change is a harmonic-rhythm richness the grade layer admits (gp.harmony.midBarChord: 'enrich' from grade 4 up - read from grade-params, NOT an inline `grade>=4`). The V/V inside additionally reads gp.harmony.secondary; the bar-SPLIT is generator harmonic-rhythm, not a syllabus device
    for(let b=1;b<nbars-1;b++){
      if(b===half || b===half-1) continue;                          // keep the mid-cadence downbeats clean
      // SECONDARY DOMINANT (major, non-swap, ONCE per piece — the single chromatic-harmony moment G4 allows):
      // if the NEXT bar is the dominant, tonicise it — the latter part of THIS bar becomes V/V (e.g. D-F#-A in
      // C), resolving to V on the downbeat. The raised 4th lives ONLY in the LH; the melody anchors to V/V's
      // diatonic tones. NOT in SWAP pieces: there the accompaniment sits on TOP, so its moving chromatic line
      // grabs the ear over a quieter (often common-tone) low melody, inverting the roles (Matthew's catch).
      // TRUE SCOPE: a secondary dominant (V/V tonicising the dominant) is standard functional harmony in ANY style - a
      // march or a dance uses V/V just as a cantabile does; the character must NOT gate it out. The genuine constraints
      // are functional/voice-leading, kept: MAJOR (this implementation spells the raised 4th in the major context), the
      // next bar IS the dominant (so V/V resolves to it), NON-SWAP (in swap the chromatic accompaniment line wrongly
      // grabs the ear - Matthew's catch), and ONCE per piece (the single chromatic moment G4 admits - a density cap, not
      // a mood gate). Whether a piece reaches for it is a free harmonic choice available to every character.
      if(mode==='maj' && !swap && !secDom && prog[b+1]===Tn.V && (gp.harmony && gp.harmony.secondary && gp.harmony.secondary.includes('V/V')) && wantSecDom){
        prog2[b]='V/V'; secDom=true;
        changePos[b] = compound ? beatLen*Math.round(nbeatsBar*2/3) : beatLen*Math.floor(nbeatsBar/2);
        continue;
      }
      const preCad = (b===nbars-2);
      // NEVER split the pre-cadential DOMINANT. Anticipating the coming tonic here (the split takes prog[b+1]) would
      // resolve the cadential V->I a beat EARLY, inside the bar, so the dominant no longer rings whole into the close and
      // its own downbeat is left to whatever lingered from the previous bar (measured: the LH states V only on beat 2,
      // the downbeat a bare non-chord tone) - the blurred-cadence fault Check B caught. A pre-cadential split intensifies
      // a PREDOMINANT approach (IV/ii -> V); when the bar already IS the dominant there is nothing to intensify, so it
      // stays whole. (Only the pre-cad case is guarded; a predominant pre-cad bar still splits, and static-harmony
      // splits elsewhere are untouched - nothing legitimate is ruled out.)
      if(preCad && prog[b]===Tn.V) continue;
      // split a bar into two chords only where it does functional work: the harmony is otherwise STATIC here (this bar
      // repeats a neighbour) so a second chord supplies the missing motion, or it's the pre-cadential bar where the
      // approach to the close naturally intensifies. Where the harmony already moves bar-to-bar there is nothing to
      // relieve, so no split - a mid-bar change would only muddy an already-moving line. Reasoned from the surrounding
      // harmony, not a die.
      const staticHarm = (b>0 && prog[b-1]===prog[b]) || (b+1<nbars && prog[b+1]===prog[b]);
      if(!preCad && !staticHarm) continue;
      // the second chord ANTICIPATES the next bar's chord when it differs (the split leads straight into the coming
      // harmony - the functional reason), and only takes a passing successor when the next bar repeats this chord (then
      // there is nothing to anticipate, so a passing chord adds the motion). Reasoned from the harmony, not a die.
      // AT THE PRE-CADENCE bar the "next bar" (the final bar) is labelled the TONIC but actually RENDERS its cadence as
      // preTonic->I (a V->I / IV->I figure), so anticipating prog[b+1]=I would lead into a chord the cadence bar does not
      // begin on - the label/notes split Check B caught. So the pre-cad bar anticipates the cadence's real approach chord
      // (preTonic, the dominant of a perfect cadence), giving a genuine predominant->dominant intensification into the close.
      let two = preCad ? preTonic : ((b+1<nbars && prog[b+1]!==prog[b]) ? prog[b+1] : moveChord(prog[b]));
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
  if(gp.harmony.midBarChord==='cadential' && !restate && finalCad==='perfect' && nbeatsBar>=2 && nbars>=4){   // the cramped-phrase cadential predominant-share (gp.harmony.midBarChord: 'cadential' at grade 2 - read from grade-params, NOT an inline `grade===2`)
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
  // speed class DERIVED FROM THE BPM NUMBER (bpmOf), not from matching the mark text. Same boundaries as before.
  const spd = (b => b < 88 ? 'slow' : b < 120 ? 'mod' : 'fast')(bpmOf(tempo));
  const march = character.id==='march';   // the dotted long-short tread is the MARCH character's style idiom - keyed on the character's identity, not on matching the printed word (which missed a march marked "Boldly"/"Fanfare")
  const prof = character.artic==='legato' ? 'legato' : character.feel==='crisp' ? 'light' : character.feel==='lilt' ? 'graceful' : 'plain';
  // ---- REST FABRIC. Every rest FUNCTION is available to every piece; NONE is mood-gated. Each occurs ONLY where its
  // real MUSICAL/STRUCTURAL cause is present, checked at placement (realisation pass, after both hands exist): a BREATH
  // at a phrase boundary where the line sustains through it; an OFFBEAT rest where the LH is actually gapped (the silence
  // after a short note); a LIFT (caesura) where the LH already rests; a DISPLACE (syncopation) where the LH strikes the
  // beat and the grade admits it. The rests EMERGE from the music, not from the character; a detached piece's extra
  // bounce lives in its STACCATO articulation, not in explicit rests. Restrained UNIVERSALLY (~one per phrase).
  // Each rest FUNCTION exists for a MUSICAL/STRUCTURAL reason, not a character mood, and occurs ONLY where that reason is
  // actually present (checked at placement in the rest engine below), so no character decides WHICH - the music does:
  //   BREATH   - the pause at a PHRASE BOUNDARY, inserted only where the line SUSTAINS through it (a continuous line
  //              needs the breath; a detached line already breathes through its own gaps -> lhSounds gate carries this).
  //   OFFBEAT  - the silence after a SHORT note, occurring only where the LH is actually gapped/detached (lhGapped).
  //   LIFT     - a CAESURA, both hands falling silent together, only where the LH already rests (lhRestOf).
  //   DISPLACE - SYNCOPATION, rhythmic tension off the beat, only where the LH strikes the beat and the grade admits it.
  // A consistent texture self-limits to one coherent rest-identity (offbeat=lhGapped and breath=lhSounds are mutually
  // exclusive per bar); the MAXR cap keeps the count restrained. The functions emerge; they are not mood-gated.
  const restMoves = new Set(['breath','offbeat','lift','displace']);
  const three = (top===3);
  // G2 (five-finger box) keeps its simpler texture set for now; Grade 3+ uses the character's base texture pool.
  // The LEFT-HAND RENDERER is now ONE engine for all grades (the old grade-2 fork is gone). What remains grade-split is
  // only the texture POOL a grade draws from, and for a MEASURED reason, not an arbitrary one: at grade 2 the eligible
  // characters' own .tex skews hard to `sustained` (~49%) + `fig` (~42%), and a sustained hold is a static whole-bar
  // rhythm - drawing straight from character.tex there collapses LH-rhythm variety (measured 66-70% one pattern per
  // metre vs 37-49% with this curated set). So grade 2 draws from a rhythmically-ACTIVE set (broken/bassline/rootfifth +
  // some sustained) that gives a beginner piece a moving, legible LH pulse. This is a grade-appropriate texture
  // constraint; the proper future unify is upstream (enrich grade-2 characters' .tex, or diversify texture selection so
  // sustained can't dominate), after which this can become character.tex for all grades. Do not remove without matching
  // variety (tested: raw character.tex regresses it).
  // TEXTURE EMERGES from the character's own idiom (its tex pool) - the accompaniment analogue of CHAR_FIGS. A Maestoso is
  // weighty BLOCK chords, a march/dance is a tread, a lyrical line is sustained/broken. The old fixed grade-2 pool + a
  // fig-for-every-character default manufactured LH-rhythm variety by forcing an oom-pah everywhere - which is exactly why
  // 'fig' became ~60% of the book and locked the batch generator. The real variety comes from the varied CHARACTERS across
  // the book and from the melody, not from an oom-pah imposed on a grand. So: draw the texture from character.tex.
  const texPool = character.tex.slice();
  // FIGURE BANK: the real rest-usages that fit this piece (metre + grade + feel), and a PRIMARY one it mostly
  // uses. `detach` = how strongly this character reaches for the bank (0 for legato -> ordinary textures only).
  // TRIPLETS are a grade-6 syllabus feature (ABRSM), so exclude t3 (eighth-triplet) figures unless the grade's
  // params allow triplets — the FIGBANK grade tags predate the table and put them at grade 3-4.
  const tripletOK = gp.noteValues.triplets;
  const _figLegal = f => f.t.includes(time) && grade>=Math.min(...f.g) && (tripletOK || !f.s.some(s=>s[0]==='t3')) && f.s.every(s=>s[0]==='r' || s[1]>=gp.noteValues.min-1e-9);   // ONE figure bank for every grade; note-floor keeps grade-2 quaver-clean. CUMULATIVE: a cell's grade tag is its MINIMUM.
  let figCands = FIGBANK.filter(f=>_figLegal(f) && f.f.includes(character.feel));
  if(!figCands.length) figCands = FIGBANK.filter(_figLegal);   // FEEL FALLBACK: never leave the rhythm-variety source empty - a character with no feel-matched figure still gets the metre/grade-legal figures (feel not checked by the validators; keeps the LH from collapsing to plain quarter textures)
  // the piece's accompaniment FIGURE is a collection-diversity choice: take the least-used figure (by its rhythm
  // signature) across the book so the left-hand RHYTHM genuinely varies piece to piece, instead of the same figure
  // recurring. Standalone/first piece = free. (Matthew: the LH rhythm was the same in every exercise.)
  const _figSigOf = f => f.s.map(s=>s.join(':')).join('|');
  const primaryFig = figCands.length
    ? ((opts.hist && opts.hist.fig)
        ? figCands.reduce((best,f)=> ((opts.hist.fig[_figSigOf(f)]||0) < (opts.hist.fig[_figSigOf(best)]||0)) ? f : best)
        : rnd(figCands))
    : null;
  // On the UNIFY path the FIGBANK figure IS the primary rhythm source (that's what gives the shared renderer its variety),
  // so useFig runs high there; the shipping fork keeps its known-good detach-gated rate (broadening it over-figged 2/4).
  // whether the accompaniment is a rest-bearing FIGURE (skip-bass / oom-pah with rests) or a plain sustained/broken
  // texture follows the ONE genuine cause: the character's ACCOMPANIMENT LIFT (detach>0). detach is the accompaniment's
  // own property - a lifted bass wants the rest-bearing figure; a fully-connected one (detach 0) sustains/rolls. This is
  // independent of the MELODIC artic/feel, so compound uses the SAME test as simple (the old compound feel-proxy wrongly
  // barred a FLOWING 6/8, detach 0.15 - a genuine light skip-bass - just for being smooth). No legato char has detach>0,
  // so detach>0 already excludes the sustaining characters without a redundant artic guard. When it is false, compound
  // still FLOWS via the broken/alberti fallback below (a static held texture would collapse to dotted crotchets there).
  // the oom-pah FIGURE (a detached bass-with-rests tread) is the accompaniment IDIOM of the DANCE and MARCH characters -
  // it is NOT how a weighty Maestoso (block chords), a flowing line (broken/alberti) or a singing line (sustained)
  // accompanies. So it emerges only for the tread characters, the LH analogue of CHAR_FIGS - ending the fig-for-every-
  // non-legato default that made fig ~60% of the book and deadlocked the batch generator on a grand-is-always-fig lock.
  const useFig = figCands.length>0 && character.detach>0;   // the lifted (rest-bearing oom-pah/skip-bass) accompaniment is available to ANY character that wants a LIFTED accompaniment (detach>0) - that's the real signal; the old dance/march WHITELIST on top was a cut (a lyrical piece over a lifted skip-bass is valid)
  // in COMPOUND metre the beat is a dotted crotchet, so held/oom-pah/bassline textures collapse to static dotted
  // crotchets — the primary must be one that FLOWS (figure / broken / Alberti). Static textures still appear, but
  // only as occasional per-bar variety (below), not as the base. Simple metres keep the full character pool.
  // STYLE IDIOM (COMPOSITION-SPEC §13): a LULLABY / barcarolle rocks - the LH sways low-high-(back) in a gentle 6/8
  // cradle. Force the broken texture (so it arpeggiates, not blocks) with a rocking shape (bass up to the top, settle
  // back), rather than leaving it to chance between broken/alberti.
  const lullaby = compound && (tempo==='Lullaby' || tempo==='Gently rocking');   // the rocking cradle is a genuine mark INSTRUCTION (the composer wrote it), matched EXACTLY - not a fuzzy regex that also caught 'Lilting' (a light dance, not a cradle)
  // SWAP (melody in the LH): the RH is the ACCOMPANIMENT and must be voice-led CHORDS, not a bass-oriented figure.
  // An oom-pah 'fig' (or rootfifth) puts the harmony's ROOT as a single note in the treble, and that root line jumps
  // around over the tune — Matthew's "random quick notes over the top". Chordal/arpeggiated textures voice-lead
  // smoothly and stay out of the bass role. (This reverses the earlier "figures in swap too" choice, which caused it.)
  // texture: NOTE - texture affects VALIDITY, so making it deterministic-per-generate-call (pickLeastUsed) starves the
  // best-of of clean non-fig options and skews to 'fig'. Texture diversity must be done at the gen-batch level (bias the
  // reject-and-reroll toward the least-used texture) NOT here. Left as the free/character choice for now. [TODO texture-diversity]
  const texture = swap ? rnd(['block','sustained','broken','alberti','broken'])
    : (lullaby ? rnd(['broken','broken','sustained','alberti']) : (useFig ? rnd(['fig','fig','broken','alberti']) : (compound ? rnd(['broken','alberti']) : rnd([...texPool, 'motif']))));   // 'motif' = the accompaniment carries the tune's own rhythmic cell (Beethoven-5); one option among the character's textures, chosen at random per try (texture affects validity, so NOT pickLeastUsed)   // a LIFTED character CHOOSES among the lifted textures (fig leaned, broken/alberti available) - forcing 'fig' made it dominate the book (66%); fig stays available to any lifted character, it's just no longer the only option   // a cradle LEANS to a broken/rocking texture but a sustained cradle or an Alberti rock are equally valid (was forced to broken = a cut)
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
  // the arpeggiation SHAPE is the piece's broken-chord figure identity - spread across the book by collection-diversity
  // (least-used), like the LH primaryFig, not a die. The lullaby set stays its reasoned rocking shapes; only the pick is diversified.
  const brokenShape = lullaby ? pickLeastUsed([[0,2,1],[0,1,2,1],[0,2,1,2]], opts.hist && opts.hist.brShape)
    : pickLeastUsed([[0,1,2],[0,2,1],[0,2,1,2],[0,1,2,1],[2,1,0,1]], opts.hist && opts.hist.brShape);
  // SWAP (melody in the LH) — the RH accompaniment is CHORDAL and voice-led, NOT a bass Alberti (that is a left-hand
  // idiom). Its own rhythm vocabulary: sustained (held), on-the-beat repeated chords, or off-beat "afterbeat" chords.
  // Voice-leading (prevSwapTop) keeps successive chords in the nearest position instead of jumping to root position.
  let prevSwapTop = null;
  // SWAP: the RH draws from the RIGHT-HAND ACCOMPANIMENT BANK (RHBANK) — a primary figure plus compatible neighbours,
  // varying across the bars and filled with voice-led chords. Real vocabulary, not one whole-bar pattern throughout.
  const rhFigCands = swap ? RHBANK.filter(f=>f.t.includes(time) && f.f.includes(character.feel) && grade>=Math.min(...f.g)) : [];
  const primaryRHFig = rhFigCands.length
    ? ((opts.hist && opts.hist.rhFig)                          // spread the swap RH figure across the book (least-used), exactly like the non-swap primaryFig sibling - not a die
        ? rhFigCands.reduce((best,f)=> ((opts.hist.rhFig[_figSigOf(f)]||0) < (opts.hist.rhFig[_figSigOf(best)]||0)) ? f : best)
        : rnd(rhFigCands))
    : null;

  // ---- MELODY: a PARALLEL PERIOD in a five-finger position that may sit on ANY degree of the key ----
  // Grade 2 hand position: tonic / sub-dominant / dominant. CAP the choice so the window TOP stays on the staff
  // (<= A5, at most one ledger line) — a high-tonic key + dominant position otherwise piled the tune onto ledgers.
  // SWAP register separation: the melody (LH, bass clef) and accompaniment (RH, box bottom = accReg) both sit near middle C,
  // so cap the melody window a whole tone BELOW the accompaniment's box bottom - then the two five-finger positions never
  // overlap and the tune can't land on the accompaniment ("hands on the same note"). Keyed off accReg (not a fixed middle C)
  // so a higher-seated accompaniment still allows a higher melody position; both hands keep their box. Treble melody <= A5.
  const melCeil = swap ? accReg - 2 : 81;

  // FIVE-FINGER POSITION (grade 2): which five notes the hand sits in - tonic (0), subdominant (3) or dominant (5=winLo4)
  // position. This was weighted 60% to the tonic, so most pieces used the SAME five notes (the pitch-vocabulary sameness).
  // Make it a collection-diversity choice so the positions spread across the book, exactly as a method book varies them.
  // GRADE-2 five-finger position: the thumb (the position's low note, scale degree winLo) must land on a WHITE key - a
  // beginner's five-finger position never puts the thumb on a black note (Matthew's F-major catch: the subdominant
  // position put the thumb on Bb). So filter to positions whose thumb is white; only fall back to a black-thumb position
  // (the tonic) if the key leaves no white option at all (a black-tonic key like Bb) - unavoidable there.
  const _thumbBlack = w => [1,3,6,8,10].includes((((melReg+off[w])%12)+12)%12);
  const winLo = wide ? 0 : (()=>{ let c=[0,3,4].filter(w=>melReg+off[w+4]<=melCeil);
    const white=c.filter(w=>!_thumbBlack(w)); if(white.length) c=white; let o=c.length?c:[0];
    // A MINOR five-finger piece wants its LEADING TONE under the hand so it can close authentically (^7->^8). The tonic
    // position (winLo 0) has ^1 at the bottom, so ^7 falls below the thumb and is out of reach - only the subdominant (3)
    // and dominant (4) positions hold ^7. So for a minor key LEAN to a ^7-reachable position (a composer places the hand
    // where the cadence lives), 3:1 over the tonic position - which stays reachable as a minority (its close is then the
    // honest modal ^2->^1, the five-finger limit), and is forced where it is the only playable option. Playability (white
    // thumb, ceiling) already decided `o`, so this only reorders within the playable set; major keys are untouched.
    if(mode==='min'){ const reach=o.filter(w=>w===3||w===4); if(reach.length) o=[...reach,...reach,...reach,...o]; }
    return pickLeastUsed(o, opts.hist && opts.hist.winLo); })();
  const W = span;                                    // window top index (== span; kept as a name used by the fill helpers)
  // ONE melody pitch-space mapping for every grade: a note index i maps to scale degree (winLo + i), clamped to the
  // grade's window. (winLo, span) ARE the grade parameters - grade 2 sits in a five-finger window (winLo = tonic/
  // subdominant/dominant, span 4), grade 3+ opens to the full range from the tonic (winLo 0, span 7). No forked mapping.
  const mnote = i => melReg + off[winLo + clamp(i, span)];   // window index -> pitch (winLo=0 & span=7 for wide)
  const wIdx = dg => { dg=((dg%7)+7)%7; for(let i=0;i<=4;i++) if((winLo+i)%7===dg) return i; return 0; }; // tonic-relative degree -> window index
  const cadW = i => wide ? i : wIdx(i);              // map a cadence figure's degree into this window
  const ctones = c => { if(c==='V/V') return [1,5].concat([1,5].map(x=>x+7).filter(x=>x<=span));  // V/V melody anchors: supertonic + its 5th (diatonic; the raised 4th stays in the LH)
    if(wide) return [...CHm[c].t, ...CHm[c].t.map(x=>x+7).filter(x=>x<=span)];
    const degs=CHORD_DEG[mode][c]||CHm[c].t; const out=[]; for(let i=0;i<=4;i++) if(degs.includes((winLo+i)%7)) out.push(i); return out.length?out:[0]; };
  // STYLE IDIOM (COMPOSITION-SPEC §13): a LAMENT sinks - a falling melodic contour, not a bright arch. Bias only the
  // overtly sad marks (not every gentle/slow one), so a Lullaby or Tenderly keeps its own varied shape.
  const contourBias = (mode==='min' && SADMARK.test(tempo)) ? 'fall' : null;   // a LAMENT sinks: reasoned from MINOR mode + a genuinely-sad marking (reusing the one SADMARK affect classifier), not a separate fuzzy regex
  // Harmonic-climax position (0..1): the inner bar of greatest harmonic tension. Passed to genContour so the melodic
  // APEX tends to coincide with it (the climax is one event: melody-height and harmonic-tension peak together).
  const _HT={I:0,i:0,vi:0.6,VI:0.6,iii:0.6,III:0.6,IV:1,iv:1,ii:1.2,V:2,v:1.6,'V/V':2.4,vii:2,VII:2,'vii°':2};
  // the melody's arc = the harmony's COLOUR (per-chord tension) laid over the phrase's structural BUILD: a phrase intensifies
  // toward its climax (approaching the final cadence, the pre-cadential region) and resolves. Without the build, the raw
  // per-chord tension spikes on any early passing V and the peak lands too early; the build is how a composer shapes the
  // phrase toward its close (a real structural norm, like the cadence itself). Both together -> the contour emerges, diverse.
  const _climax = nbars>1 ? (nbars-2)/(nbars-1) : 0.66;                     // the pre-cadential region: where a phrase peaks before it resolves
  const _tension = Array.from({length:nbars},(_,b)=>{
    const raw = _HT[prog[b]] ?? 1;
    const t = nbars>1 ? b/(nbars-1) : 0;
    const build = t<=_climax ? t/Math.max(1e-9,_climax) : Math.max(0,(1-t)/Math.max(1e-9,1-_climax));   // rise to the climax, resolve after
    return raw + build*1.6;
  });
  const contour = genContour(nbars,span,contourBias,_tension);
  // A SHORT FIVE-FINGER TUNE'S LINE TRAVELS: in the narrow grade-2 window a smooth contour rounds to few distinct values and
  // the structural line SITS on one (the tonic) - a melody is a journey, so each interior bar should reach a NEW place, the
  // tonic reserved for the opening/cadence. Where an interior bar repeats the previous bar's target, step it on in the arch's
  // direction so the line keeps moving. (Grade 3+ has the full range and doesn't collapse, so this is only the narrow window.)
  if(!wide) for(let b=1;b<nbars-1;b++) if(contour[b]===contour[b-1]){
    const dir = b<=Math.floor(nbars/2) ? 1 : -1; let v = contour[b]+dir; if(v<0||v>span) v = contour[b]-dir;
    contour[b] = Math.max(0, Math.min(span, v)); }
  // SITUATIONAL HARMONY: at ANCHOR bars the harmony leads (the downbeat is the chord tone nearest the contour - it spells
  // the arrival). At MID-PHRASE spans the LINE leads: the structural downbeat follows the contour to its ideal SCALE tone
  // (free of the pre-set chord), and the chord is DERIVED to CONTAIN that note - a diatonic chord holding it, functionally
  // valid from the previous chord, aiming at the next, with the smoothest root motion. So the harmony changes colour to
  // follow the melody to a good note, instead of imprisoning the note in a fixed chord (Matthew's core fix). Left-to-right
  // so each derivation sees the revised previous chord. Only the STRUCTURAL note drives it; the fill stays ornamental over
  // the derived chord. Bars with a mid-bar change (prog2) keep their chord (that harmony is already voice-reasoned).
  const _degChords = {}; for(const [ch,ds] of Object.entries(CHORD_DEG[mode])) for(const d of ds) (_degChords[d]=_degChords[d]||[]).push(ch);
  const _rootOf = c => (((CHm[c].b)%7)+7)%7;
  const strong = new Array(nbars);
  for(let b=0;b<nbars;b++){
    const canDerive = !anchor[b] && prog2[b]==null && b>0 && b<nbars-1;
    if(!canDerive){ strong[b] = near(ctones(prog[b]), contour[b]); continue; }
    const idealIdx = clamp(Math.round(contour[b]), span);
    const deg = (((winLo+idealIdx)%7)+7)%7;
    const cands = (_degChords[deg]||[]).filter(c => CHm[c] && c!==prog[b-1]);
    if(!cands.length){ strong[b] = near(ctones(prog[b]), contour[b]); continue; }
    const prevRoot=_rootOf(prog[b-1]), nextCh=prog[b+1];
    const gramOK = c => GRAMMAR[prog[b-1]] ? GRAMMAR[prog[b-1]].includes(c) : true;   // functional continuation from the previous chord
    const aimOK  = c => !nextCh || nextCh===c || (GRAMMAR[c] ? GRAMMAR[c].includes(nextCh) : true);   // leads toward the next chord
    const stepR  = c => { const d=Math.abs(_rootOf(c)-prevRoot); return Math.min(d,7-d); };            // smoothest root motion
    const score  = c => (gramOK(c)?0:2) + (aimOK(c)?0:1) + stepR(c)*0.25;
    prog[b] = cands.reduce((a,c)=> score(c)<score(a) ? c : a);
    strong[b] = idealIdx;
  }
  const degOf = m => off.indexOf(m-melReg) - winLo;   // pitch -> note index (inverse of mnote; winLo=0 for wide)
  const rh=[]; let prev=strong[0], prevLeap=0, lineDir=0;   // lineDir = the melodic direction INTO the barline, so the next downbeat is a consequence of the line, not arbitrary
  // rhythm's character feel, from the piece's character (prof): legato sings, graceful lilts, light is crisp
  const rhythmFeel = character.feel;   // note DENSITY follows the character; the fast-piece problem is angularity, not note-count (fixed at the melodic level, not by thinning the rhythm)
  // antecedent close: inconclusive (a non-tonic chord tone), the tonic (IAC), or flow on (continuous)
  // ANTECEDENT CLOSE (half cadence): the line rests on a chord tone of V (or ^2). WHICH one is not a die - it is the V-tone
  // the melodic CONTOUR is already heading to at that bar, so the close matches the piece's own melodic shape (and ^2, the
  // classic restful half-cadence close a step above the tonic, is included). Reasoned from the contour, varies per piece.
  const endDeg = (midType==='HC'||midType==='DC') ? near(ctones(Tn.V).filter(i=>((winLo+i)%7)!==0).concat([wIdx(1)]), contour[half-1]) : midType==='IAC' ? wIdx(0) : null;
  // ============================ MELODIC ENGINE (skeleton + fill) ============================
  // A melody is a chord-tone SKELETON on the beats, connected by the non-chord tone each gap calls for:
  //   PASSING (a 3rd filled stepwise), AUXILIARY (a neighbour decorating a would-be repeat), a step INTO a leap,
  //   and true SUSPENSIONS (a chord tone tied OVER the beat/bar that resolves down by step). This replaces the old
  //   note-by-note "step toward the target", which drifted and repeated. (Matthew's melodic-logic redesign.)
  let skelRun = 1;
  let suspBudget = gp.nonChordTones.includes('suspension') ? 1 : 0;   // at most ONE suspension per piece, and only if it arises NATURALLY (never forced) - so most pieces have none. Grade gate = a syllabus NCT admitted from grade 3 (read from gp, not five-finger)
  const ctPick = (c, tgt, not) => { let o=c; if(not!=null && c.length>1) o=c.filter(i=>i!==not); return near(o.length?o:c, clamp(tgt,W)); };
  // A piece FAVOURS one figure type, so its melodic gestures RECUR like a motif (a run-piece, a turn-piece), not scattered.
  // the piece's favoured melodic figure EMERGES from its CHARACTER (a cantabile runs, a fanfare arpeggiates, a scherzo
  // plays with turns); the least-used-in-pool tie-break spreads variety WITHIN that character's idiom, not across all types.
  const figBias = pickLeastUsed(CHAR_FIGS[character.id] || ['run','turn','arp','neighbour','mix'], opts.hist && opts.hist.figBias);
  // AUGMENTATION option: some pieces broaden the germ at the APEX - the idea restated in long note values at the peak, a
  // grand arrival. WHERE = the apex (situational); WHETHER this piece does it = collection-diversity (a minority, spread
  // across the book), never forced onto every piece and never a die. Applied in buildBar only where the metre gives a
  // genuinely broad half-bar value (4/4 -> minims, 3/4 & 6/8 -> dotted crotchets; 2/4 & 3/8 are too short to broaden).
  // AUGMENTATION at the apex (the germ broadened into long notes = a grand arrival) EMERGES from character: it is a
  // LYRICAL / GRAND gesture (a broad expressive peak), so only smooth-feel characters take it - a crisp scherzo or march
  // broadening into a held note at its climax would kill its own momentum. Among the eligible (smooth) pieces, diversity
  // spreads it. (Positive: broadening happens where it belongs, not on a third of every piece regardless of character.)
  const wantAug = pickLeastUsed(['aug','plain','plain'], opts.hist && opts.hist.aug) === 'aug';   // AUGMENTATION (broaden the motif at the climax) is a universal development device - available in ANY character (was gated to smooth = a cut), chosen occasionally across the book
  const connect = (A,B) => {                                  // the single connective note between skeleton A and B - always MOVES
    const dist=Math.abs(B-A), dir=Math.sign(B-A) || (Math.sign(Math.round(W/2)-A)||1);
    if(dist>=2){ const p=clamp(A+dir,W); if(p!==A) return p; }           // PASSING note stepping toward B (through a 3rd+)
    // adjacent or same skeleton pitch: a DECORATING neighbour that moves AND is not the coming anchor B, so the connective
    // never dead-repeats A and never spells A-B-B. A genuinely motivic repeat lives in the skeleton/germ, not the fill.
    for(const d of [-1,1,-2,2]){ const x=clamp(A+d,W); if(x!==A && x!==B) return x; }
    return clamp(A + (A<W?1:-1), W);                                     // window-edge last resort: still move
  };
  // RHYTHMIC MOTIFS (character-driven): the character picks a small set of bar-rhythms and the piece REUSES them
  // as motifs rather than re-randomising every bar. Bar 0's rhythm recurs; a contrast motif marks the mid-phrase
  // bar; odd bars get a light variation. This is what makes the rhythm read as composed. Cadence/restate bars
  // still override below. (Same subdivision vocabulary drives melody rhythm AND is how the piece is constructed.)
  // motif-persistence (drive vs yield), computed HERE so the melodic rhythm reasons long-note-vs-motion from the same axis
  // as the accompaniment deployment below (the breath/fill/texture-variation). (Was recomputed later; single home now.)
  const motifPersist = motifPersistOf(character);
  // The MAIN melodic motif must carry an actual figure — a lone whole-bar note reused every bar is a drone, not a
  // tune. Regenerate motifA until it has >=2 notes. Held whole-bar notes stay available as an occasional breath
  // (motifB, varied bars, cadence), so nothing is ruled out — only the empty-melody case is avoided.
  let motifA = barRhythm(barU,wide,compound,rhythmFeel,spd,march,calmMel,gp.noteValues.min,motifPersist,figBias);
  for(let _a=0; _a<8 && motifA.length<2; _a++) motifA = barRhythm(barU,wide,compound,rhythmFeel,spd,march,calmMel,gp.noteValues.min,motifPersist,figBias);
  // The CONTRAST motif must actually contrast: a statement answered by an identical "contrast" is no development.
  // Regenerate until motifB genuinely differs from motifA (bounded, so a piece with a tiny vocabulary still resolves).
  let motifB = barRhythm(barU,wide,compound,rhythmFeel,spd,march,calmMel,gp.noteValues.min,motifPersist,figBias);
  for(let _b=0; _b<12 && (motifB.length<2 || motifB.join(',')===motifA.join(',')); _b++) motifB = barRhythm(barU,wide,compound,rhythmFeel,spd,march,calmMel,gp.noteValues.min,motifPersist,figBias);
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
    for(const gi of [...groups.keys()]){                            // develop the bar from its start (temporal order, not a shuffled die)
      const g=groups[gi]; if(Math.abs(g.reduce((s,x)=>s+x,0)-beatLen)>1e-9) continue;   // only vary a single-beat group; leave long-note breaths
      const alt=cells.filter(c=>c.join(',')!==g.join(','));
      if(alt.length){ const pick=alt.reduce((b,c)=>Math.abs(c.length-g.length)>Math.abs(b.length-g.length)?c:b);   // the cell whose subdivision CONTRASTS most with this beat - a real rhythmic development, not a random alternative
        groups[gi]=pick; const out=groups.flat(); if(out.join(',')!==m.join(',')) return out; }
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
    if(f==='drive' && longIn(r)){   // recast a held-note bar into motion only on the DRIVE into a cadence (which must keep moving); a held OPENING is a valid broad/maestoso gesture, no longer forbidden
      for(let t=0;t<6;t++){ const alt=barRhythm(barU,wide,compound,rhythmFeel,spd,march,calmMel,gp.noteValues.min,motifPersist,figBias);
        if(alt.length>=2 && !longIn(alt)){ r=alt; break; } } }
    // DENSITY follows phrase-function: a DRIVE bar pushes motion into the cadence (take the busier subdivision when the
    // grade allows it); a CADENCE bar settles (never busier than the motif). Motion lands for a reason, not i.i.d.
    if(f==='drive'){ const busier=varyRhythm(r); if(busier.length>r.length && !longIn(busier)) r=busier; }
    // A phrase CLOSE settles and BREATHES: reason a broad note that ends on a beat, so the line comes to rest and the rest
    // pass has room to lift a breath before the next phrase - the space a composer leaves that lets the other hand answer.
    // Broad for a calm character (the whole bar rings), a resolution beat for a driving one. A strong lean toward repose at
    // the close (only where the motif didn't already settle) - the cadence-settle norm, like the final tonic; a genuinely
    // busy cadence stays reachable where the music wants it, it is just far out of preference here.
    if(f==='cadence' && !longIn(r)){
      // Settle broad at the close - the whole bar rings for a calm character, a resolution beat for a firmer one. A strong
      // lean toward repose, not a wall: a genuinely driving character (motifPersist well above the 0.5 midpoint) carrying an
      // already-active motif may take its motion through the cadence, an uncommon but real choice, so only that case keeps
      // the motif rhythm. The active-cadence rate then emerges from the character spread rather than being forced to zero.
      if(!(motifPersist>=0.68 && r.length>=3)) r = motifPersist>=0.55 ? [Math.max(beatLen, barU-beatLen), beatLen] : [barU];
    }
    rhythmByBar.push(r); }
  // MOTIVIC GERM: the on-beat interval-shape of the opening idea (bar 0). A composer states an idea then DEVELOPS it -
  // most often as a diatonic SEQUENCE (the same shape restarted at a new pitch level, its intervals adjusting to stay in
  // key). We capture bar 0's shape here and impose it on the development bars below, so the tune GROWS from one idea rather
  // than being freshly contour-filled every bar. Set after bar 0 is built (closure over `let`); null until then.
  let germShape = null;
  const _holdSet = new Set();   // (bar*100+beat) junctures where the melody chose to HOLD, so the derivation MUST recolour there (they work together)
  let _seedOpen=null;   // which tonic-chord tone the opening starts on (exposed for book-level distinctness); direction/shape now emerge from the contour + melodic line, not a forced seed walk
  const _og = { appog:0, antic:0, esc:0 };   // ornament + development placement counters, stored on ex for honest verification (declared here so the melody engine's germ counters can use it)
  const buildBar = (b, endIdx) => {
    // AUGMENT the germ at the apex (broaden the idea into long notes at the peak) - only when this piece took the augment
    // option AND the bar is the apex AND it is a real development bar (not bar 0 / restate / cadence / contrast / forced
    // close) AND the metre's half-bar is a genuinely broad value (>=a dotted crotchet). Then the bar states the germ's HEAD
    // interval as two long notes. All those conditions are the SITUATION; nothing is forced onto a piece that did not take it.
    const augHere = wantAug && b===apexBar && germShape && germShape.length>0 && b!==0 && !(restate && b===half)
                    && phraseFunc[b]!=='cadence' && endIdx==null && barU/2 >= 1.5-1e-9;   // the apex's PEAK role overrides the contrast-position exclusion (as the cadence approach does for fragmentation) - a composer broadens wherever the peak lands
    const pat = augHere ? [barU/2, barU/2] : (rhythmByBar[b] || barRhythm(barU,wide,compound,rhythmFeel,spd,march,calmMel,gp.noteValues.min,motifPersist,figBias));
    if(augHere) _og.aug=(_og.aug||0)+1;
    const posArr=[]; { let p=0; for(const d of pat){ posArr.push(p); p+=d; } }
    // DEVELOP THE GERM on this bar? Yes for a true development bar - not the germ statement (bar 0), not the parallel
    // RESTATE (copies bar 0), not the mid-phrase CONTRAST bar (pos 2 = motifB, the designed departure), not a full CADENCE
    // bar. A forced-close bar normally keeps its cadential line, EXCEPT the drive APPROACH into a cadence, where the motif
    // LIQUIDATES (fragments) into the close - so that bar develops the germ too. Every other bar sequences it. So the
    // phrase reads statement -> sequence -> contrast -> (fragment ->) cadence, as a composer builds it.
    const isApproach = germShape && germShape.length>=2 && endIdx!=null && phraseFunc[b]==='drive' && b!==0;   // the drive approach into a cadence - its cadential ROLE overrides both the forced-close and the contrast-position exclusions, because liquidating the motif into the close is exactly a composer's move here
    // The motif carries through the WHOLE phrase: a composer develops the idea on every bar (sequence, and on the contrast bar
    // an INVERSION or variation - the invert logic below reads the situation), not drop it on the contrast/drive bars to wander.
    // Only bar 0 (the statement), the parallel restate (copies bar 0) and a full cadence bar are exempt; the drive approach
    // fragments it. (Was excluded on the contrast position b%phraseLen===2, which left those bars idea-less and aimless.)
    const useGerm = germShape && germShape.length>0 && b!==0 && !(restate && b===half) && phraseFunc[b]!=='cadence'
                    && ( endIdx==null || isApproach || augHere );
    // WHICH development the germ takes is READ FROM THE SITUATION, never forced - an emergent option taken only where the
    // music calls for it, else the plain sequence:
    //  - INVERT when the phrase ARCH here slopes AGAINST the germ's OPENING gesture: mirroring the motif makes it open WITH
    //    the arch (the answering gesture - a rising idea falls as the line descends past its peak). Arch agrees -> no invert.
    //  - FRAGMENT on the cadence APPROACH: the motif liquidates to its head interval, tightening into the close. Only there.
    const germDir = useGerm ? Math.sign(germShape[0]) : 0;                         // the germ's OPENING gesture (its characteristic first move) - NOT the net sum, which is 0 for a balanced up-then-back idea and would disable inversion
    const arcDir  = useGerm ? Math.sign(contour[b]-contour[b-1]) : 0;
    const invertGerm = useGerm && germDir!==0 && arcDir!==0 && arcDir!==germDir;   // the arch turns against the germ's opening -> invert so the motif opens WITH the arch
    const fragGerm   = useGerm && isApproach;                                      // liquidate the motif to its head interval into the cadence
    if(invertGerm) _og.inv=(_og.inv||0)+1;                                         // honest-verification counters (bars that took each development)
    if(fragGerm) _og.frag=(_og.frag||0)+1; else if(useGerm) _og.seq=(_og.seq||0)+1;
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
        if(p>=2 && p<=W-2 && ctA.includes(p-1) && !ctA.includes(p) && character.artic!=='detached'){   // TRUE SCOPE: a cross-barline tie suspension needs only that the note can be HELD over the barline - so only a fully-DETACHED character (re-articulates every note) is excluded; legato AND mixed-articulation characters carry it. Arises naturally (the line already sits a 2nd above a chord tone) within the one-per-piece budget. Not gated by mood
          lastN.ti=1; idxs[0]=p; susResolve=clamp(p-1,W); suspBudget--;
        }
      }
    }
    // SKELETON: a chord tone on every on-beat slot. Move SMOOTHLY toward the bar's contour target - mostly by
    // step, sometimes a 3rd, rarely a bigger leap - and RECOVER a leap by stepping back the other way (so the
    // line arcs instead of zig-zagging in 5ths and 7ths). Beat-to-beat motion is capped at a 5th.
    // on-beat ORDINAL of each slot (0 = the downbeat), so the germ's shape maps slot-for-slot; a suspension bar keeps its
    // own dissonance logic (not sequenced), so the germ is suppressed there.
    const obOrd={}; { let k=0; for(let j=0;j<pat.length;j++){ if(onBeat(j)){ obOrd[j]=k; k++; } } }
    const suspThisBar = idxs[0]!=null;
    // THE OPENING FRAMES HOME by a POSITIVE reason, nothing more: bar 0 STARTS on a tone FROM THE TONIC CHORD (any member -
    // root, 3rd or 5th - which one is spread low/mid/high across the book for distinctness), so the first strong beat spells I
    // over the pinned tonic harmony. That START is the only thing the opening needs. The REST of bar 0 is the ordinary melodic
    // line - it moves toward the phrase contour, stepping by default and leaping only where it reaches for a goal, the same
    // positive melodic reasoning every bar uses - so the idea is genuinely melodic and its shape is open, never prescribed. The
    // germ is captured from that real line. (The old seed WALKED THE TONIC CHORD TONES, which are a 3rd apart, forcing the germ
    // - and so the whole piece - into leaps: that arpeggiate-to-establish-the-tonic reasoning was the wrong root, now removed.)
    if(b===0 && !suspThisBar){
      const obP=[]; for(let j=0;j<pat.length;j++) if(onBeat(j)) obP.push(j);
      const T=[...new Set(ctones(prog[0]))].sort((a,b)=>a-b);   // the tonic chord tones IN the window - the frame the opening STARTS on
      if(obP.length && T.length){
        _seedOpen = pickLeastUsed(['low','mid','high'], opts.hist && opts.hist.seedOpen);
        idxs[obP[0]] = _seedOpen==='low'?T[0] : _seedOpen==='high'?T[T.length-1] : T[(T.length-1)>>1];   // start on ANY tonic-chord tone (root/3rd/5th, spread across the book); the melodic idea takes it from here - grounded by the root beneath, an opening on the tonic is the start of a tune, not a monotony
      }
    }
    let lastIdx=prev, lastMove=0;
    for(let j=0;j<pat.length;j++){
      if(idxs[j]!=null){ lastIdx=idxs[j]; continue; }          // suspension downbeat already placed
      if(susResolve!=null){ idxs[j]=susResolve; susResolve=null; lastMove=idxs[j]-lastIdx; lastIdx=idxs[j]; continue; }
      if(!onBeat(j)) continue;
      const c=ctAt(posArr[j]), ctr=strong[b];
      let tgt, germIv=null;   // germIv = this slot's germ interval when the motif drives it; 0 means the MOTIF itself repeats (legitimate)
      // MOTIVIC SEQUENCE: on a development bar, each on-beat after the first CONTINUES the germ's interval-shape from where
      // the line now sits (the downbeat still follows the contour, so the germ restarts at a new pitch level along the arch
      // = a diatonic sequence). The target is then snapped to a chord tone (ctPick) + leap-capped below, so the germ gives
      // the SHAPE while the harmony keeps it in tune. The germ cycles if the bar has more on-beats than the germ (a longer
      // bar continues the same shape). This is the tune growing from its idea, not a fresh contour-fill.
      if(useGerm && !suspThisBar && obOrd[j]>=1 && germShape.length){
        const gi = fragGerm ? 0 : (obOrd[j]-1) % germShape.length;   // FRAGMENT -> the head interval each step; else walk the whole germ shape
        germIv = invertGerm ? -germShape[gi] : germShape[gi];        // the motif's interval here; 0 = the motif itself repeats a note (legitimate)
        // A NET-ZERO (symmetric) germ - down then back up by the same step - just ROCKS when cycled (B-A-B-A), because its
        // CLOSING interval undoes its opening one and returns it home every cycle. Let only that closing step OVERSHOOT by one,
        // in the phrase's direction, so the figure WALKS to a new level each time (a real sequence up/down the arch) instead of
        // oscillating in place. Only the closing step is touched, so the germ's shape and identity are kept; bar 0 (no germ) is untouched.
        if(germShape.reduce((a,b)=>a+b,0)===0 && gi===germShape.length-1) germIv += (Math.sign(ctr-lastIdx) || (b<=apexBar?1:-1));
        tgt = lastIdx + germIv;   // INVERT -> mirror the motif's contour to follow a descending arch
      }
      else if(Math.abs(lastMove)>=3) tgt = lastIdx - Math.sign(lastMove);        // recover the last leap: step back
      else if(j===0){                                                     // downbeat: a CONSEQUENCE of the line's momentum, not an arbitrary chord tone
        const toC = ctr - lastIdx;                                         // where the phrase contour pulls
        // a stepwise ASCENT into the barline wants to keep rising to its goal (a rising leading tone resolves UP to
        // the tonic); a DESCENT wants to keep falling. Continue that direction to the next chord tone UNLESS the
        // contour genuinely calls for the turn (pulls >=2 the other way) - so the arch still shapes the phrase.
        if(lineDir>0 && toC>-2) tgt = lastIdx + 2;
        else if(lineDir<0 && toC<2) tgt = lastIdx - 2;
        else tgt = lastIdx + Math.max(-3,Math.min(3, toC));                // otherwise step toward the contour, at most a 3rd
      }
      else { const toward = Math.sign(ctr-lastIdx) || lineDir || (Math.sign(Math.round(W/2)-lastIdx)||1);   // toward the contour; already AT it -> keep the line's momentum, else head to the register centre (from the notes before, not a coin)
             const gap = Math.abs(ctr-lastIdx);                              // how far the contour target sits from here
             // A LINE GOES SOMEWHERE: step toward the contour by the distance (a 3rd when far, a step when near) - but when
             // ALREADY AT the target, do NOT hold (that stalls, and the anti-repeat then bounces it back = the do-sol-do
             // oscillation). Keep the GESTURE moving one step in its established direction, so the within-bar line reads as
             // a directed idea (a run, an arpeggiation) rather than filling two chord tones. The contour reins it back next bar.
             tgt = lastIdx + toward * Math.max(1, Math.min(2, gap)); }
      // SITUATIONAL NEGOTIATION AT THE MOMENT, NOT THE BAR (Matthew: don't conflate bars with chords - a bar is many harmonic
      // moments, not one block). The harmony is in charge only at the genuine functional MOMENTS - the structural downbeats
      // whose chord is PINNED (the harmonic pillars vhDerive pins: the opening tonic, the mid-phrase cadence, the penult pre-
      // tonic) and the cadential arrival (pinned separately by endIdx / the cadence figure). At THOSE beats the melody catches
      // the chord tone the harmony is asserting. EVERY OTHER beat - including the approach beats INSIDE a cadence bar - the
      // melody leads: the on-beat follows the LINE and the harmony is DERIVED to contain it, so passing and auxiliary tones
      // fall out. So priority flip-flops moment to moment, not a whole bar handed to one side. (Was `phraseFunc[b]`, bar-granular.)
      const _pinnedMoment = anchor[b] && posArr[j] < 1e-9;    // this on-beat sits on a pinned-harmony structural downbeat
      const _free = !process.env.NOVHARM && !_pinnedMoment;
      // LEAPS LAND ON CHORD TONES: a composer leaps to a consonance and approaches a dissonance by STEP. So a FREE ON-BEAT
      // reached by a LEAP snaps to the nearest chord tone (ctPick) instead of the raw contour target - which is exactly what
      // stops the melody leaping onto a beat-dissonance against the harmony (the leap-clash fault) at the SOURCE, rather than
      // generating it and discarding. A stepwise or off-beat move stays free, so passing/auxiliary non-chord tones still fall
      // out where a composer would step to them; the line's intention is kept (ctPick takes the chord tone nearest tgt).
      const _onBeat = Math.abs((((posArr[j])%beatLen)+beatLen)%beatLen) < 1e-9;
      const _leapOnBeat = _free && _onBeat && Math.abs(Math.round(tgt)-lastIdx) > 2;
      let idx = (_free && !_leapOnBeat) ? clamp(Math.round(tgt), W) : ctPick(c,tgt,null);
      if(Math.abs(idx-lastIdx)>4){                                          // cap the leap at a 5th (larger leaps aren't reliably recovered)
        if(_free) idx = clamp(lastIdx + Math.sign(idx-lastIdx)*4, W);
        else { const nr=c.filter(i=>Math.abs(i-lastIdx)<=4); if(nr.length) idx=near(nr,tgt); } }
      // A skeleton that keeps landing on the SAME chord tone reads as static/dead (Matthew: bar-after-bar D-D, F#-F#).
      // Prefer MOTION to a neighbouring chord tone on a repeat - but keep an occasional repeat possible (never banned).
      // on a repeated chord tone, MOVE in the direction the contour is heading (tgt) so the line turns instead of sitting;
      // keep the repeat only when the contour genuinely wants the same pitch AND it is not already a run. Both the whether
      // and the direction come from the line, not a die.
      // EXACT REPEAT RULE: a skeleton note repeats the previous pitch ONLY when the MOTIF itself repeats (germIv===0 - a
      // genuine repeated-note idea, e.g. a fanfare); a repeat with any other cause is the passive dead default (the contour
      // momentarily flat, the same chord tone nearest) and a composer would never write it - the line MOVES to the
      // neighbouring chord tone instead (a flat contour wants the line to STAY IN THE REGION by oscillating, not to sit).
      // Direction from the contour, else the line's momentum, else toward the register centre - never a die. Motif repeats
      // are untouched, so the repeated-note possibility is kept, only the dead one is removed.
      if(idx===lastIdx){
        // A repeated structural note - whether a dead default (contour flat, nearest chord tone) OR a genuine motif repeat
        // (germIv===0, a fanfare-like idea) - must NOT sit over a static chord: a held note is only alive when the FEELING
        // underneath shifts (HOLD + RECOLOUR, the narrator holds, the colour moves). So for EITHER kind of repeat, if the
        // harmony can recolour here (the note sits in more than one diatonic chord), hold and REQUIRE the recolour (below).
        // Only when no recolour is possible do we split: a dead default MOVES on; a real motif repeat with nowhere to recolour
        // is kept (rare, intended). This closes the bug where a motif repeat held over an UNCHANGED chord = the dead oscillation.
        const _dg = (((winLo+lastIdx)%7)+7)%7;
        const _recolour = !anchor[b] && !process.env.NOVHARM   // available in ANY style: the REASON is the repose juncture + a recolour being available; character leans how often a piece reaches a repose, not whether the move exists
                          && Object.keys(CHm).filter(c=>(CHORD_DEG[mode][c]||(CHm[c]&&CHm[c].t)||[]).includes(_dg)).length>=2;
        if(_recolour) _holdSet.add(b*100 + Math.round(posArr[j]/beatLen));   // HOLD: leave idx===lastIdx and REQUIRE the derivation to recolour this beat, so the held note's feeling underneath genuinely shifts
        else if(germIv!==0){ const rd=Math.sign(tgt-lastIdx)||lineDir||(Math.sign(Math.round(W/2)-lastIdx)||1); idx = _free ? clamp(lastIdx+rd*2, W) : ctPick(c, lastIdx+rd*2, lastIdx); }   // no recolour AND not a motif = the dead default: move on
      }
      idxs[j]=idx; skelRun=(idx===lastIdx)?skelRun+1:1; lastMove=idx-lastIdx; lastIdx=idx;
    }
    if(endIdx!=null) idxs[pat.length-1]=clamp(endIdx,W);       // antecedent close / forced cadence tone
    // FILL: connect skeleton notes. A run of 2+ connective slots between A..B is realised as a characteristic melodic
    // FIGURE (scale run, turn, neighbour group, or arpeggiated flourish) instead of independent passing notes — this is
    // the figurative vocabulary that makes the line read as composed, not skeleton-and-fill. A single gap stays a plain
    // connective note.
    // The fill IS part of the bar's GESTURE and always MOVES - it never sits on a pitch (that sitting was the collapse that
    // produced sol-sol-sol). It is a shaped figure realised as continuous motion across the gap, FOLDING at the window edge
    // or on reaching B rather than clamping onto a repeated pitch. Family = the piece's favoured figure where the gap allows,
    // else from the gap size. Every emitted note differs from the one before it by construction (Matthew: the decoration moves;
    // a repeated note is a stated idea in the skeleton/germ, never fill debris).
    const figureFill = (A,B,len,ct) => {
      const tones=(ct||[]).slice().sort((x,y)=>x-y), dist=Math.abs(B-A);
      let type;
      if(figBias==='run' && dist>=len) type='run';
      else if(figBias==='arp' && dist>=2) type='arp';
      else if((figBias==='turn'||figBias==='neighbour') && dist<=2) type='wiggle';
      else type = dist>=len ? 'run' : dist<=1 ? 'wiggle' : 'run';
      if(type==='wiggle' && len<=3){                                // SHORT flat-region fill = a real neighbour/turn figure that
        // has shape and RESOLVES, not an endless two-note rock. A turn cell (upper neighbour, principal, lower neighbour) -
        // three distinct pitches tracing up-through-down, a recognisable ornament, not the dead A+1/A-1 alternation that made
        // the E-F-E-F wobble. (The old "never landing back on A" comment banned the resolution and forced the rock.)
        const turn=[clamp(A+1,W), A, clamp(A-1,W)];
        return Array.from({length:len},(_,k)=>turn[k%turn.length]);
      }
      if(type==='wiggle') type='run';                               // a LONGER held-register fill arcs (the run folds up-and-back below), the way a composer keeps a register alive without rocking on two notes
      let dir = Math.sign(B-A) || (Math.sign(Math.round(W/2)-A)||1);
      const out=[]; let cur=A;
      const stepFold = () => { let n=cur+dir; if(n<0||n>W){ dir=-dir; n=cur+dir; } return clamp(n,W); };   // one scale step, FOLD at the edge
      const arpFold  = () => { let pool=tones.filter(t=> dir>0? t>cur : t<cur);                            // next chord tone in dir, fold at the ends
        if(!pool.length){ dir=-dir; pool=tones.filter(t=> dir>0? t>cur : t<cur); }
        return pool.length ? pool.sort((x,y)=>dir>0?x-y:y-x)[0] : stepFold(); };
      for(let k=0;k<len;k++){
        if(type==='run' && dist>0 && ((dir>0&&cur>=B)||(dir<0&&cur<=B))) dir=-dir;   // reached B with notes still to place -> arch back
        let n = type==='arp' ? arpFold() : stepFold();
        if(n===cur){ dir=-dir; n = type==='arp' ? arpFold() : stepFold(); }          // guarantee motion: never sit
        if(n===cur) n = clamp(cur + (cur<W?1:-1), W);                                // final boundary safety
        cur=n; out.push(cur);
      }
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
      // A fill of 2+ notes IS part of the bar's gesture and must MOVE - shape it as a figure (a neighbour group, turn, run
      // or arpeggiation). Only a SINGLE connective note stays a plain passing tone. The old gate let a 2-note fill across a
      // small gap fall to plain connective motion, which in a busy one-beat bar (3/8) collapsed the whole bar onto the
      // skeleton pitch (sol sol sol). The sub-beats are the gesture, not padding, so they move even across a step. (Matthew.)
      if(len>=2){ const fig=figureFill(A,B,len,ctAt(posArr[j])); for(let k=0;k<len;k++) idxs[j+k]=fig[k]; }
      else { let AA=A; for(let k=j;k<=hi;k++){ idxs[k]=connect(AA,B); AA=idxs[k]; } }
      j=hi+1;
    }
    prev=idxs[idxs.length-1]; prevLeap=0;
    if(idxs.length>=2) lineDir=Math.sign(idxs[idxs.length-1]-idxs[idxs.length-2]);   // remember the direction into the next barline
    // CAPTURE THE GERM from the opening bar: the successive intervals between its ON-BEAT skeleton tones = the idea's shape
    // that the development bars sequence. Taken once, from bar 0's freely-built line (its statement), never overwritten.
    if(b===0){ const obs=[]; for(let j=0;j<pat.length;j++){ if(onBeat(j) && idxs[j]!=null) obs.push(idxs[j]); }
      germShape = obs.slice(1).map((d,i)=>d-obs[i]);
      // The on-beat germ is EMPTY when bar 0 has one on-beat (every compound metre, any sparse bar 0), and it collapses to
      // all-ZEROS when the opening idea is a neighbour/turn (C-D-C -> on-beats C..C -> interval 0), throwing the motion away
      // and propagating a static repeat (the C-C, F-F clumps). In both cases the real motif is the opening FIGURE, so take the
      // shape of bar 0's whole note-sequence (its first few intervals) - never empty, never a dead repeat, and it carries the
      // actual neighbour/turn motion to be sequenced/inverted below.
      if(germShape.length===0 || germShape.every(x=>x===0)){ const seq=idxs.filter(x=>x!=null); germShape = seq.slice(1).map((d,i)=>d-seq[i]).slice(0,3); } }
    return pat.map((d,j)=>({m:mnote(idxs[j]),d,bar:b}));
  };

  for(let b=0;b<half;b++){                                    // phrase A (antecedent)
    buildBar(b, (b===half-1)?(endDeg??null):null).forEach(n=>rh.push(n));
  }
  const idea = rh.filter(n=>n.bar===0).map(n=>({m:n.m,d:n.d}));   // the "basic idea" to restate (no carried tie: a suspension out of bar 0 must not become a dangling tie in the restate)
  // MINOR AUTHENTIC-CLOSE leading tone (shared by the approach bar and the final bar, so hoisted out of the loop):
  const ltReach = wide || ((winLo + wIdx(6))%7)===6;             // an octave window (grade 3+) always holds ^7 below its upper tonic; a grade-2 five-finger position may not
  const _finalSingleBeat = (barU <= beatLen + 1e-9);            // a single-beat final bar (compound 3/8) can't split ^7->^1 within itself; the leading tone then goes in the APPROACH bar
  const _minLT = mode==='min' && finalCad==='perfect' && ltReach;
  for(let b=half;b<nbars;b++){                                // phrase B (consequent)
    if(restate && b===half){ idea.forEach(n=>rh.push({...n,bar:b})); prev=degOf(idea.at(-1).m); prevLeap=0; continue; } // restate opening
    if(b===nbars-1){                                                 // cadence figure
      // A ^7->^1 leading-tone close only works when the fixed window actually holds the leading tone BELOW the tonic
      // (subdominant/dominant five-finger positions do; the tonic position does not - ^7 would fall back onto the tonic
      // and the figure would collapse to tonic->tonic). Where it is out of reach, fall back to the plain ^2->^1 step.
      // FUNCTIONAL MINOR CLOSE: the leading tone resolving UP to the tonic is what makes a minor cadence AUTHENTIC, and in a
      // two-voice close the MELODY carries it (Matthew's three-minors frame; the accompaniment grounds the dominant on its
      // root, so the third/leading tone lives in the tune). A perfect authentic cadence HAS its leading tone by definition -
      // that is not a wall but what the cadence IS - so the modal, leading-tone-free minority is expressed by CHOOSING the
      // plagal (or a genuinely modal) close upstream, not by omitting a perfect cadence's defining note. So for a minor
      // perfect close, resolve the tonic THROUGH its leading tone: ^7 rising a semitone into ^1. In an octave window that ^1
      // is the UPPER tonic (index 7), ^7 (index 6) a step below it (resolving to the LOWER tonic would drop the subtonic a
      // 7th - the bug that left closes bare). A single-beat final bar (3/8) can't hold the split, so it holds the upper tonic
      // and the leading tone rises into it from the APPROACH bar (handled below). The pass further down sharpens the ^7.
      let melCad = cad.mel;
      if(_minLT){
        const tl=cad.mel[cad.mel.length-1][1]; const hd=barU-tl;                          // the tonic keeps its own value; ^7 takes the rest of the bar (never overflow)
        if(hd >= beatLen - 1e-9) melCad = wide ? [[6,hd],[7,tl]] : [[6,hd],[0,tl]];        // room in the final bar: ^7 rises into ^1 (wide -> the UPPER tonic)
        else if(wide) melCad = [[7,barU]];                                                // 3/8-type: hold the upper tonic; the leading tone rises in from the approach bar
      }
      melCad.forEach(([idx,d])=>{ const useIdx = (idx===6 && !ltReach) ? 1 : idx; rh.push({m:mnote(cadW(useIdx)), d, bar:b}); });
      prev=wIdx(0); prevLeap=0; continue; }
    // The bar BEFORE the cadence should LEAD INTO it: end a step above the cadence's first note so the line steps
    // down into the close, instead of leaping up to a stray note right at the cadence (Matthew's catch here). EXCEPT the
    // minor single-beat-final-bar close (3/8): there the final bar holds the upper tonic and the LEADING TONE must rise into
    // it from here, so the approach ends on ^7 (index 6) - the penult is the dominant bar, so the pass below sharpens it.
    const approach = (b===nbars-2) ? ((_minLT && _finalSingleBeat && wide) ? 6 : clamp(cadW(cad.mel[0][0])+1, W)) : null;
    buildBar(b, approach).forEach(n=>rh.push(n));
  }
  // MINOR -> HARMONIC MINOR at the dominant/cadence: raise the natural 7th to the leading tone (resolves up to i)
  if(mode==='min'){
    // ── THREE MINORS, reasoned as a composer does (Matthew's frame: HARMONIC when ^7 is a CHORDAL idea, MELODIC when
    // ^6/^7 are a MELODIC idea; they interact) ─────────────────────────────────────────────────────────────────────
    //   • HARMONIC minor: ^7 that functions as the dominant's 3rd (the leading tone) is RAISED so the chord pulls to i.
    //   • MELODIC minor: a line CLIMBING to the tonic (^5-^6-^7-^8) raises BOTH ^6 and ^7 (to lead up and to close the
    //     augmented-2nd gap); a line DESCENDING from the tonic keeps both NATURAL (natural minor).
    //   • INTERACTION: over a dominant, a ^7 that is a passing tone stepping DOWN to ^6 stays natural (the melodic
    //     descent wins) so raised-^7-against-natural-^6 never sounds; natural ^6 is never left adjacent to a raised ^7.
    // Works in PITCH-CLASS relative to the tonic so it fires in every octave (the old off.indexOf only matched the base
    // octave, which is why most melodic ^7s were never raised). ^6 = tonic+8, ^7 = tonic+10; both raise by one semitone.
    const tonicPitch = melReg + off[0];                                // ^1 in the melody register (off[0]===0)
    const rel = m => (((m - tonicPitch)%12)+12)%12;
    const isNote = k => rh[k] && !rh[k].rest && !Array.isArray(rh[k].m);
    const prevNote = k => { let p=k-1; while(p>=0 && !isNote(p)) p--; return p; };
    const nextNote = k => { let q=k+1; while(q<rh.length && !isNote(q)) q++; return q<rh.length?q:-1; };
    const raise = new Array(rh.length).fill(false);
    for(let i=0;i<rh.length;i++){ if(!isNote(i)) continue; const r=rel(rh[i].m);
      if(r!==8 && r!==10) continue;                                    // only ^6 (submediant) and ^7 (subtonic)
      const p=prevNote(i), q=nextNote(i);
      const pr=p>=0?rel(rh[p].m):null, nr=q>=0?rel(rh[q].m):null;
      const cdeg = CHORD_DEG[mode][prog[rh[i].bar]] || [];
      const isDom = cdeg[0]===4;                                       // dominant-function bar (the leading tone belongs)
      const nat7Chord = !isDom && cdeg.some(dg=>(((dg%7)+7)%7)===6);   // III/VI (relative major) keep the NATURAL ^7
      if(r===10){                                                      // ^7 (subtonic)
        const ascendToTonic = nr===0;                                 // ^7 -> ^8, a melodic climb resolving up
        const stepsDownToSix = nr===8;                                // ^7 -> ^6, a melodic DESCENT (keep natural, no aug-2nd)
        // A LEADING TONE IS A TENDENCY TONE: in the BODY it must be a quick step that RESOLVES up to the tonic, never idly
        // DWELT ON. Sitting on a raised ^7 over a TONIC bar (Matthew's exercise-2 opening: G# held a whole beat) implies it's
        // a chord tone - only right over an A-major(7), wrong in a minor key - so a lingered tonic-area ^7 stays NATURAL (the
        // stable subtonic a natural/Aeolian minor may dwell on). BUT AT A CADENCE the resolving ^7 IS the cadential leading
        // tone, over the cadence's dominant, and MUST be raised even when held - that is the V->i the whole piece drives to
        // (Matthew's exercise-2 FINAL bar). The final bar is labelled I (the V is rendered by the cadence figure, so isDom
        // reads false there), and a mid-phrase IAC bar likewise - so recognise the cadence bars explicitly, not via isDom.
        const lingered = rh[i].d >= beatLen - 1e-9;
        const atCadence = rh[i].bar===nbars-1 || rh[i].bar===half-1;
        if(!nat7Chord && !stepsDownToSix && (isDom || (ascendToTonic && (!lingered || atCadence)))) raise[i]=true;
      }
      // ^6 is decided in a second pass, once we know which ^7s are raised (it only follows a raised leading tone up).
    }
    for(let i=0;i<rh.length;i++){ if(!isNote(i) || rel(rh[i].m)!==8) continue;   // ^6 (submediant)
      const p=prevNote(i), q=nextNote(i);
      const pr=p>=0?rel(rh[p].m):null;
      // raise ^6 ONLY as an ascending melodic-minor passing tone: it is reached from below (^5 or lower) and steps UP to a
      // ^7 that is itself being raised. That is the ^5-^6-^7-^8 climb; anywhere else (a neighbour, a descent, a chordal ^6
      // of iv/VI) ^6 stays natural. This is exactly what stops a natural ^6 sitting a step under a raised leading tone.
      if(q>=0 && rel(rh[q].m)===10 && raise[q] && pr!=null && pr<=7) raise[i]=true;
    }
    for(let i=0;i<rh.length;i++){ if(raise[i]){ rh[i].m += 1; rh[i].alt='#'; } }
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
    // Repeated notes are motivic (kept) only when they are the piece's stated IDEA - i.e. the opening bar (the germ, the
    // statement) is itself a repeated-note gesture. A composer states a theme then develops it; if the theme repeats notes,
    // repetition is thematic and belongs throughout. If bar 0 is a MOVING idea and repeats appear later, they are not the
    // theme - they are the line collapsing (a rest on a gesture's moving note, or one pitch padding out several slots) - and
    // the line should move. (Was "any repeated-note figure that recurs at the same bar-onset", which read a plain rising line
    // padded to sol-sol-sol / la-la-la as an intentional tattoo and preserved the dullness.)
    const germRepeat = (()=>{ const b0=rh.filter(n=>!n.rest && !Array.isArray(n.m) && n.bar===0).map(n=>n.m);
      for(let i=1;i<b0.length;i++) if(b0[i]===b0[i-1]) return true; return false; })();
    const motivic = germRepeat;
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
  if(nbars>=4){
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
    // a tonal sequence develops the melody wherever a repeatable figure meets a HARMONY CHANGE (exactly the cands above);
    // it is applied where that developmental opportunity exists, not by a die. Among the opportunities, sequence the pair
    // with the STRONGEST harmonic move (a tonal sequence tracks the harmony, so it speaks most over a descending-5th/3rd);
    // earliest breaks ties.
    if(cands.length){
      const {b,A,dA}=cands.reduce((best,c)=> rootMotion(prog[c.b],prog[c.b+1]) > rootMotion(prog[best.b],prog[best.b+1]) ? c : best);
      let shape0=dA.map(d=>d-dA[0]);        // interval shape from the figure's first note
      // FRAGMENTATION: a LONG figure (>=4 notes) carries a clear HEAD sub-motif worth isolating and repeating to fill the
      // bar (a tighter development); a shorter figure states its whole shape. From the figure's length, not a die.
      if(shape0.length>=4){ const h=Math.ceil(shape0.length/2); shape0=shape0.map((_,k)=>shape0[k%h]); }
      const ct=ctones(prog[b+1]);                                      // window indices that are chord tones of the next bar's chord
      const start=ct.map(ix=>({ix,dist:Math.abs(ix-dA[0])})).sort((x,y)=>x.dist-y.dist)[0];   // start on the nearest chord tone
      if(start){
        // INVERSION: mirror the shape when repeating it as-is would drive the line OUT of the singable window - the mirror
        // keeps the sequence in range (a real voice-leading reason). Otherwise keep the original rising/falling contour.
        const hiS=Math.max(...shape0), loS=Math.min(...shape0);
        const shape = (start.ix+hiS>W || start.ix+loS<0) ? shape0.map(s=>-s) : shape0;
        const seq=shape.map((s,k)=>({ m: mnote(clamp(start.ix+s, W)), d: rh[A[k]].d, bar: b+1 }));   // same rhythm, shifted pitches
        const B=byBar[b+1]; rh.splice(B[0], B.length, ...seq);         // duration-safe: source bar's rhythm sums to a full bar
      }
    }
  }
  // APPOGGIATURA (accented non-chord tone, grade 4+ where it is idiomatic): occasionally an on-beat chord tone is
  // leaned on from a step ABOVE — the upper note struck ON the beat as an accented dissonance, resolving DOWN by step
  // to the chord tone. Splits the note (both halves grade-legal); never at a cadence or the opening. beatClash already
  // permits a dissonance that resolves down by step, so a real appoggiatura is legal by construction.
  // APPOGGIATURA - reasoned from the LOCAL SITUATION at the note, never from character or a die (a composer does not add one
  // because "this piece is lyrical"; they lean on a PARTICULAR note the line arrives at). It belongs where the melody
  // ASCENDS into a structural GOAL - a melodic apex or the pre-cadential arrival - because striking a step ABOVE on the
  // beat and resolving DOWN completes that upward arrival with an expressive lean. Every condition below is local: the
  // note is an on-beat chord tone that the line rose into, at an apex/drive bar, with a step above that is dissonant. It
  // emerges wherever the line genuinely wants it (occasional by nature); no coin. (Grade unlock via gp.nonChordTones.)
  // _og now declared above the melody engine (the germ counters need it); this line kept as a no-op anchor for readers.
  // APPOGGIATURA - reasoned COMPLETELY from the local line: an accented non-chord tone on a STRONG position resolving BY
  // STEP to a chord tone, with EVERY genuine form covered and nothing legitimate ruled out:
  //  - BOTH directions: UPPER (a step above, resolves down) AND LOWER (a step below, resolves up) - beatClash now permits
  //    either resolution, so the lower form is legal, not silently excluded.
  //  - ANY approach: leapt into (the classic - the leap is answered by the step resolution), stepped into, or unprepared;
  //    the approach does NOT gate it (the RESOLUTION does), so no legitimate approach is excluded.
  //  - long enough to split (dissonance + resolution both grade-legal), on a genuine chord tone whose step-neighbour is a
  //    real non-chord tone.
  // Selectivity is not an artificial gate: every eligible spot is SCORED by expressive weight - metrical strength (a
  // downbeat leans hardest), a structural arrival (apex/cadence/drive), a LEAP approach the lean resolves, and room to
  // sound - and the lean lands on the strongest opportunities (up to two, never adjacent), skipping a piece whose best is
  // weak. So it appears exactly where a composer would most want it, as often as the piece genuinely offers - no die.
  if(gp.nonChordTones.includes('appoggiatura')){
    const cand=[]; { let t=0; for(let i=0;i<rh.length;i++){ const pos=t%barU, b=Math.floor(t/barU+1e-9), beat=pos/beatLen;
      const onBeat = Math.abs(beat-Math.round(beat))<1e-9;
      if(onBeat && !rh[i].rest && !Array.isArray(rh[i].m) && rh[i].d>=1-1e-9 && i>0 && b<nbars){
        const dg=degOf(rh[i].m), ct=ctones(prog[b]);
        if(dg>=0 && ct.includes(dg)){
          const prevMel=(!rh[i-1].rest && !Array.isArray(rh[i-1].m))?degOf(rh[i-1].m):null;
          for(const ndg of [dg+1, dg-1]){                                  // BOTH the upper and lower step-neighbour
            if(ndg<0 || ndg>W || ct.includes(ndg) || prevMel==null) continue;   // a genuine dissonance, in range, with a real approach
            // THE DEFINING GESTURE: the line LEAPS into the dissonance AGAINST its step resolution - up into an UPPER
            // appoggiatura (then steps down), or down into a LOWER one (then steps up). A note merely STEPPED into is an
            // accented passing tone, a DIFFERENT device - so requiring the contrary leap is the appoggiatura's definition,
            // not a narrowing, and it is exactly what makes the ornament genuinely sparing (only where the line leaps in).
            // the DRAMATIC lean: the line LEAPS a real interval (a 4th or more) into the dissonance against its step
            // resolution. A mere 3rd-skip into an on-beat dissonance is ambiguous with ordinary melodic motion; the
            // deliberate appoggiatura a composer WRITES is the bold leap that the stepwise resolution then answers.
            const leapOpp = (ndg>dg && prevMel <= dg-2) || (ndg<dg && prevMel >= dg+2);
            if(!leapOpp) continue;
            // and expression concentrates at a true ARRIVAL - a melodic apex or a cadence (NOT a 'drive' bar, which only
            // BUILDS toward the arrival). A leapt-into dissonance in a plain flow/drive bar is melodic motion, not a lean.
            const arr = phraseFunc[b]==='apex' || phraseFunc[b]==='cadence';
            if(!arr) continue;
            const weight = (pos<1e-9?2:1) + (phraseFunc[b]==='apex'?2:1) + Math.min(2, rh[i].d);
            cand.push({ i, ndg, d:rh[i].d, b, weight });
          } }
      }
      t+=rh[i].d; } }
    // place ONE appoggiatura - the single strongest expressive-arrival opportunity in the piece; a piece that offers none
    // simply gets none. This is the composer's one deliberate lean at the peak, not a scatter of them.
    cand.sort((a,c)=>c.weight-a.weight);
    const chosen = cand.slice(0,1);
    for(const s of chosen.sort((a,c)=>c.i-a.i)){                          // splice back-to-front so earlier indices stay valid
      const lean=mnote(clamp(s.ndg,W)), chord=rh[s.i].m, appD=Math.min(1, s.d-0.5);
      if(appD>=0.5-1e-9 && lean!==chord){ rh.splice(s.i,1,{m:lean,d:appD,bar:s.b},{m:chord,d:s.d-appD,bar:s.b}); _og.appog++; if(lean>chord)_og.appogUp=(_og.appogUp||0)+1; else _og.appogDn=(_og.appogDn||0)+1; } }
  }
  // ANTICIPATION: the weak note just before a strong-beat chord tone ANTICIPATES it — the coming chord tone arrives early
  // on the preceding weak position (a consonant weak-beat NCT). Never at the opening. Grade gate = it is a syllabus
  // non-chord tone admitted from grade 3 (read from gp, not an inline grade number).
  // ANTICIPATION - reasoned from the SITUATION: a weak note pre-echoes the chord tone of a strong ARRIVAL it is about to
  // reach. It is idiomatic exactly at a structural arrival (a cadence, or the apex) - the coming note sounded a beat early
  // to smooth the landing - not on any random weak note and not by a die. So it fires where the weak note before a
  // cadential/apex downbeat can voice that downbeat's chord tone early; among those the LAST (most final) arrival takes it.
  // ANTICIPATION - THE genuine cadential pre-echo: at a CADENCE, the weak note just before the arrival sounds the arrival's
  // chord tone EARLY (a ^2->^1 / ^7->^1 close where the goal lands a beat sooner). It requires that weak note to be a STEP
  // from the coming chord tone - only then is early-sounding a smooth pre-echo rather than a leap-repeat. A deliberate
  // cadential gesture, reasoned from the cadence and the line, not any weak note and not a die; the final close takes it.
  if(gp.nonChordTones.includes('anticipation')){
    const on=[]; { let t=0; for(const n of rh){ on.push(t); t+=n.d; } }
    let done=false;
    for(let i=rh.length-1;i>=1 && !done;i--){ const bi=Math.floor(on[i]/barU+1e-9), pos=on[i]-bi*barU;
      if(Math.abs(pos)>1e-9 || phraseFunc[bi]!=='cadence') continue;      // a genuine cadence downbeat (final or a real mid-phrase HC/IAC/DC)
      const a=rh[i-1], c=rh[i];
      if(a.rest||c.rest||Array.isArray(a.m)||Array.isArray(c.m) || a.d>1+1e-9 || a.m===c.m) continue;
      const dgA=degOf(a.m), dgC=degOf(c.m);
      if(dgA>=0 && dgC>=0 && Math.abs(dgA-dgC)===1 && ctones(prog[bi]).includes(dgC)){   // the weak note is a STEP from the coming chord tone
        rh[i-1].m=c.m; _og.antic++; done=true; }                         // sound the arrival early - the cadential anticipation (latest cadence, once)
    }
  }
  // ESCAPE TONE / échappée: a weak connective note steps AWAY from its chord tone and the line then LEAPS the other way to
  // the next chord tone. Applied to a lone weak note between two chord tones that currently just repeats or sits — turning
  // it into the step-away-then-leap figure. Rare. Grade gate = a syllabus non-chord tone admitted from grade 3 (via gp).
  // ESCAPE TONE - reasoned from the SITUATION: the line is about to LEAP, and a lone weak note first steps the OTHER way
  // (the échappée flourish that makes the leap sing). It exists only where that local shape is present - a weak note
  // between two chord tones with a coming leap - so it emerges from the line itself, not a die. The CLEAREST gesture (the
  // largest coming leap) takes it.
  if(gp.nonChordTones.includes('escape')){
    const on=[]; { let t=0; for(const n of rh){ on.push(t); t+=n.d; } }
    const spots=[];
    for(let i=1;i<rh.length-1;i++){ const bi=Math.floor(on[i]/barU+1e-9), pos=on[i]-bi*barU;
      if(Math.abs(pos)<1e-9) continue;                                    // weak position only
      const p=rh[i-1], c=rh[i], n=rh[i+1];
      if([p,c,n].some(x=>x.rest||Array.isArray(x.m))) continue;
      if(c.d>0.5+1e-9) continue;                                          // an escape is a QUICK FLICK - a quaver-length step away, not a long structural note; this is its defining trait and what makes it genuinely rare
      const dP=degOf(p.m), dN=degOf(n.m); if(dP<0||dN<0) continue;
      if(!ctones(prog[bi]).includes(dP)) continue;                        // p is a chord tone
      if(degOf(c.m)!==dP) continue;                                       // and the flick note currently just REPEATS it - a DEAD repeat before the leap. The escape replaces that redundancy with a step-away flick: a genuine improvement (WHY it belongs), and rare (only where the line has that dead repeat to fix)
      if(Math.abs(dN-dP)>=3) spots.push({i,dP,dN});                       // a real LEAP (a 4th or more) - only a substantial leap is worth the échappée flourish; a mere 3rd is not
    }
    // one per piece, decorating the CLEAREST (largest) leap - a composer's occasional flourish, not every small skip
    if(spots.length){ const {i,dP,dN}=spots.reduce((b,x)=>Math.abs(x.dN-x.dP)>Math.abs(b.dN-b.dP)?x:b); const dir=Math.sign(dN-dP)||1; const away=clamp(dP - dir, W);   // the clearest (largest-leap) escape steps opposite the coming leap
      if(away!==dP) rh[i].m = mnote(away); _og.esc++; }
  }
  // Doubling the melody in diatonic 3rds/6ths is a TEXTURE - a per-piece thickening of the tune, like choosing an
  // accompaniment pattern, and genuinely optional (most melodies are single-line). Its real PRECONDITIONS are all below:
  // grade 3+ two-note chords (wide), a note long enough to place the hand and let both pitches sound (d>=1), and a
  // diatonic chord tone a 3rd..6th below (clean harmony). Those are the whole cause of WHERE it can go - character mood
  // does not gate it (a long note is playable in any style). WHETHER a piece takes the thirds texture is an optional
  // per-piece TEXTURE identity - a composer decides if THIS piece is a doubled-thirds piece - so it is a COLLECTION-
  // DIVERSITY choice (spread across the book, least-used), not a die. It lands on the longest, most structural notes.
  // WHETHER a piece takes the thirds/sixths texture EMERGES from its articulation: doubling thickens the tune into a warm,
  // sustained, blending sonority - it belongs to a LEGATO / singing line where the two pitches fuse, and BLURS a detached
  // one (a scherzo or march wants its articulation crisp and its line clear). So a detached character stays single; among
  // the legato/mixed pieces diversity spreads the doubled-thirds identity. (Was "character does not gate it" - it does.)
  const wantDouble = pickLeastUsed(['double','plain','plain'], opts.hist && opts.hist.dbl) === 'double';   // DOUBLED THIRDS available in ANY articulation (was gated to non-detached = a cut; staccato parallel thirds are idiomatic). Character shapes HOW they're voiced, not WHETHER, chosen occasionally across the book
  if(wide && wantDouble){
    const cand=rh.map((n,i)=>i).filter(i=>!Array.isArray(rh[i].m)&&!rh[i].rest&&rh[i].d>=1 && i>0 && i<rh.length-1 && degOf(rh[i].m)>=2);
    // place the double-stops on the LONGEST notes - the ones with room for both pitches to sound (thickening a passing
    // quaver is muddy); earliest breaks ties. No die.
    const ord=[...cand].sort((a,b)=>(rh[b].d-rh[a].d)||(a-b));
    for(let t=0,k=cand.length>4?2:1; t<k && t<ord.length; t++){ const i=ord[t];
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
  // LH FIVE-FINGER HAND POSITION (fixed-position grades only): like the melody's winLo, the accompaniment picks the
  // five-finger position that best COVERS the bass notes it must play (the chord ROOTS), instead of always sitting
  // thumb-on-tonic. A i-VI-III piece (roots la/do/mi) does not fit a tonic box but fits the submediant box (thumb NOT on
  // the tonic); with the box placed there, vi/VI can even sit in ROOT position (root under the hand). This CONSTRUCTS the
  // LH inside five fingers instead of folding foreign roots away after the fact. Wide grades keep _accLo=0 and the box
  // math is identity, and every LH pitch site stays on its original expression unless gp.range.fixedPosition. (Matthew:
  // "start your hand somewhere that isn't thumb-on-tonic"; "chord 6 in root position when it's under the hand".)
  const offAt = k => { k=Math.round(k); const base=off[((k%7)+7)%7]; return base + 12*Math.floor(k/7); };
  // SWAP pieces put the accompaniment in the TREBLE (its own register system) - the bass-anchored box below would place it
  // wrong and cross the hands, so swap keeps accLo=0 (its original voicing). The box position choice is a NON-swap fix.
  const _accLo = (()=>{ if(!gp.range.fixedPosition || swap) return 0;
    const rf={}; for(const c of prog){ const r=(((CHm[c].b)%7)+7)%7; rf[r]=(rf[r]||0)+1; }
    let best=0, bs=-1;
    // preference order puts the SIMPLEST positions first (tonic, then subdominant/dominant, then submediant/mediant), so
    // ties resolve to thumb-on-tonic and the box only moves when a foreign root actually needs covering.
    for(const lo of [0,3,4,5,2,1,6]){
      const lowPC=(((accReg+offAt(lo))%12)+12)%12; if(![0,2,4,5,7,9,11].includes(lowPC)) continue;   // thumb on a WHITE key (grade-2 five-finger convention)
      let cov=0; for(const r in rf){ if((((+r-lo)%7)+7)%7 <= span) cov += rf[r]; }
      if(cov>bs){ bs=cov; best=lo; }   // first (simplest) position wins ties
    }
    return best; })();
  // keep the box BOTTOM in the bass register near the tonic bass, so a non-tonic position never lifts the hand up into the
  // melody (the hand-crossing the naive placement caused). Anchored at/just below accReg, so every box top stays <= the
  // original tonic-box top - the accompaniment is always below the tune.
  let _accBase = accReg + offAt(_accLo);
  while(_accBase > accReg + 3) _accBase -= 12;
  while(_accBase < accReg - 8) _accBase += 12;
  // map a scale degree to its pitch UNDER THE HAND: fit the degree into the box [_accLo, _accLo+span]; a degree the box
  // does not reach (genuinely foreign to this position) clamps to the nearest box edge (the in-box filter removes these first).
  const boxPitch = dg => { const d0=(((dg%7)+7)%7); let rel=(((d0-_accLo)%7)+7)%7; if(rel>span) rel=span; return _accBase + (offAt(_accLo+rel)-offAt(_accLo)); };
  const inBox = dg => ((((((dg%7)+7)%7)-_accLo)%7)+7)%7 <= span;   // is this degree reachable in the chosen position?
  let curTex = texture; let prevBassP = null; let prevOB = null, prevOT = null;   // previous struck chord's outer voices, to avoid parallel perfect 5ths/8ves
  let prevUpper = null, prevStruckBass = null;   // previous struck 2-note chord's UPPER + bass note, for voice-leading + parallel-perfect avoidance
  let prevStruckUpper = null;                    // previous struck chord's UPPER voices (1-2) as an ordered line, for inner-voice leading
  let prevStruckIv = null;                        // previous struck chord's bass-to-top interval class, to avoid repeating the same interval (3rd, 3rd, 3rd...)
  // The pah/upper-chord keeps a CONSISTENT DENSITY per piece (its identity), but the exact notes VOICE-LEAD on each
  // chord change — the nearest inversion/interval to the previous chord (least motion), which is what sounds right.
  // the pah voices the chord ABOVE the bass to the size the GRADE permits: the 3rd and 5th that complete the triad the
  // bass began, plus a doubled root at the fuller grades (root-doubling is the standard tonal fullness). Density is the
  // harmony stated at this grade's chord size - not a character weight; a light character plays this pah softly and
  // detached (its lightness is dynamics + articulation, applied elsewhere). Grade-emergent, no character.
  const pahDensity = gp.chordMax;
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
    return seq.map(t=>({m: gp.range.fixedPosition ? boxPitch(t) : accReg+off[t], d:beatLen})); };
  // MOTIF PERSISTENCE (0..1): how strongly THIS piece carries its accompaniment groove vs yields - the NET of the
  // character's own DRIVE against its YIELD, from its real continuous properties (no keyword/name match):
  //   drive  = detach (how much the accompaniment lifts its struck notes - a lifted oom-pah IS a march tread) + accent
  //   yield  = drop (tendency to leave a hand silent a bar - textural space) + melBreath (melodic breath/gap) + ferm (pauses)
  // Centred at 0.5 so drive raises and yield lowers it. This wires in drop/melBreath/ferm, which were DEAD - the very
  // "breathing" parameters whose silence made the accompaniment a flat stamp. A DIAL, never on/off; it never rules the
  // breath out (see the phrase-end breath, where even a motoric piece breathes when the melody opens up).
  // motifPersist is computed once up in the melody section (motifPersistOf) and reused here for the accompaniment deployment.
  // A "RELATED" texture keeps the piece's MOTION character while re-colouring the figure - a HELD idiom arpeggiates
  // (block/sustained -> broken/alberti), one FLOWING idiom moves to its neighbour (broken<->alberti, +bassline), a
  // BASS-DRIVEN idiom to another (fig<->bassline) - never a random jump to an unrelated texture (that reads as random,
  // the same reason a groove doesn't rotate). Constrained to the piece's grade-legal palette (TPAL) and spread across the
  // book by collection-diversity (pickLeastUsed), the accepted honest mechanism for an optional colour - never a die.
  const _RELATED = { block:['broken','alberti'], sustained:['broken','alberti'], broken:['alberti','bassline'],
    alberti:['broken'], bassline:['broken','fig'], fig:['bassline','broken'], rootfifth:['broken','alberti'] };
  const relatedTex = t => { const cands=(_RELATED[t]||['broken']).filter(x=>TPAL.includes(x)&&x!==t);
    return cands.length ? pickLeastUsed(cands, opts.hist && opts.hist.texVary) : t; };
  // VOICE-IMPLIED HARMONY (flagged, default OFF): re-derive each MID-PHRASE bar's chord from what the finished
  // melody line implies, via the proven voice-led engine (vhDerive) - anchors kept chord-led, so cadences are
  // untouched. This is increment 2 of the wire-in: the derivation now FEEDS the renderer (per bar for now; per
  // beat next). Only overrides a bar when the implied chord is grade-legal (in CHm) and differs; the melody's
  // structural note is a chord tone of it by construction, so nothing clashes. Off by default -> zero risk to the bank.
  let _vhBass=null, _vhBeat=null;                                   // derived per-bar bass line + per-BEAT harmony {chord,bassDeg}, read by the renderer under the flag
  if(!process.env.NOVHARM){
    const _tpc=((rhTonic%12)+12)%12;
    const _deg = pc => { let bd=99,bi=0; for(let d=0;d<7;d++){ const s=((off[d]%12)+12)%12; const diff=Math.min(((pc-s)%12+12)%12,((s-pc)%12+12)%12); if(diff<bd){bd=diff;bi=d;} } return bi; };
    const _nbeatsBar = Math.max(1, Math.round(barU/beatLen));
    // MELODY DEGREE AT EACH BEAT: the note SOUNDING at beat k's onset is the structural note that beat's harmony must hold.
    const _melAt = (b,tw) => { let t=0; for(const n of rh){ if(n.bar!==b) continue; if(tw>=t-1e-9 && tw<t+n.d-1e-9) return n; t+=n.d; } return null; };
    // FUNCTIONAL PLAN per bar (the harmony's INTENTION): tonic AREA through the body of each phrase, a PRE-DOMINANT on the
    // drive into a cadence, the DOMINANT at the cadence itself (the anchors already pin that). So the harmony has a
    // destination and each chord serves the arc - not a series of locally-valid chords (Matthew). Anchors keep null (pinned).
    // FUNCTIONAL JOURNEY per bar: the harmony LEAVES home and travels. A non-anchor bar right before a cadence is the
    // pre-dominant that builds into it; a bar in the middle of a run is AWAY from the tonic (the departure); only the
    // opening establishes home. So the phrase reads home -> away -> pre-dominant -> (dominant cadence) -> resolve, instead
    // of sitting on I through the middle. vhDerive then realises each function with the chord that best fits the line.
    // NO journey template (Matthew): a fixed home->away->pre-dominant->dominant arc stamped on every piece is exactly the
    // prescription we are building AGAINST - it made every piece take the same harmonic route (dominant in the middle,
    // tonic at the ends). The only near-fixed points are the anchors themselves (open on I, the cadences, the close); every
    // other bar's harmony is derived SITUATIONALLY from the melodic line by vhDerive, with no forced function. Variety
    // between pieces then falls out of each piece's different line, not out of a template. So no bar carries a wanted-func.
    const _harmFunc = Array.from({length:nbars},()=>null);
    const _legal = Object.keys(CHm);                               // grade-legal chords, so the plan stays in the grade's harmonic vocabulary
    const _seq=[], _anchSeq=[], _funcSeq=[], _idx=[], _mustRe=[];  // flattened per-beat sequence + anchors + functions + must-recolour flags, with a (bar,beat) index back
    for(let b=0;b<nbars;b++){ for(let k=0;k<_nbeatsBar;k++){ const n=_melAt(b, k*beatLen);
      _seq.push(n && !n.rest && n.m!=null ? _deg(((((Array.isArray(n.m)?n.m[0]:n.m)-_tpc)%12)+12)%12) : (_seq.length?_seq[_seq.length-1]:0));
      // pin the DOWNBEAT of every anchor bar to its cadence chord; open/close pinned to tonic inside vhDerive
      _anchSeq.push((k===0 && anchor[b]) ? {pin:prog[b]} : null);
      _funcSeq.push(_harmFunc[b]);
      _mustRe.push(_holdSet.has(b*100+k));    // the melody HELD this beat expecting a recolour - the derivation must change chord here
      _idx.push([b,k]); } }
    const _vh = vhDerive(_seq, mode, _anchSeq, _funcSeq, _legal, _mustRe);
    _vhBeat = Array.from({length:nbars},()=>new Array(_nbeatsBar).fill(null));
    for(let i=0;i<_idx.length;i++){ const [b,k]=_idx[i]; _vhBeat[b][k]={chord:_vh.chords[i], bass:_vh.bass[i]}; }
    // per-BAR chord (downbeat) still drives the texture branches + add7 for bars the harmony holds
    for(let b=0;b<nbars;b++){ const c0=_vhBeat[b][0].chord; if(!anchor[b] && CHm[c0]) prog[b]=c0; }
    _vhBass = _vhBeat.map(bar=>bar[0].bass);
    if(process.env.VHDEBUG){ globalThis.__vh=globalThis.__vh||{bars:0,derivedMove:0,struck:0,gatedCad:0,gatedProg2:0,gatedMotif:0,swapBars:0,swapMove:0};
      for(let b=0;b<nbars;b++){ globalThis.__vh.bars++; const mv=new Set(_vhBeat[b].map(x=>x.chord)).size>1; if(mv) globalThis.__vh.derivedMove++; if(swap){ globalThis.__vh.swapBars++; if(mv) globalThis.__vh.swapMove++; } } }
  }
  prog.forEach((c,b)=>{
    const ch=CHm[c], root=ch.b;
    if(b===nbars-1){                                                 // cadence figure from the pool
      // MINOR PERFECT CADENCE: give the dominant its LEADING TONE in the LH (the raised ^7, a major 3rd above the ^5
      // bass). At grade 2 the melody sits in a five-finger box that often can't reach ^7 (tonic position: ^7 is below
      // the thumb), so without this the perfect cadence has NO leading tone anywhere and sounds modal - the exact gap
      // Matthew heard. Guarded: skip when the melody holds the TONIC over the dominant (a semitone clash against the
      // leading tone) or already sings the leading tone itself (doubling). idx===4 is the ^5 dominant bass of the pool.
      const melFirst = cad.mel[0] ? (((cad.mel[0][0]%7)+7)%7) : null;
      const addLead = mode==='min' && finalCad==='perfect' && melFirst!==0 && melFirst!==6;
      const leadPitch = (gp.range.fixedPosition ? boxPitch(6) : accReg+off[6])+1;   // natural ^7 raised a semitone = the leading tone
      cad.lh.forEach(([idx,d])=>{ const bass= gp.range.fixedPosition ? boxPitch(idx) : accReg+off[idx];
        lh.push({m:(idx===4 && addLead) ? [bass, leadPitch] : bass, d}); });
      return; }
    // PHRASE-END BREATH (all grades, reasoned to cover every case and rule none out): at a REAL antecedent cadence the
    // accompaniment may lift to a sustained bass - the composer's breath that lets the phrase close register. TWO causes
    // ADD, so either alone can earn it: (1) the character's yieldingness (1 - motifPersist) - a cantabile breathes
    // readily; (2) the ROOM the melody itself leaves in this bar (its sustained/rest fraction) - a held or resting
    // cadential gesture invites the bass to sustain WITH it. Their sum >= 1 is "one whole reason to breathe". So a
    // lyrical piece breathes even under an active close, AND a motoric march breathes when its melody holds the cadence
    // note - nothing is ruled out; where neither reason is present the groove simply plays on (equally reasoned).
    const antecedentClose = half>0 && half<nbars && b===half-1 && (midType==='HC'||midType==='IAC'||midType==='DC');
    if(antecedentClose){
      const barMel = rh.filter(n=>n.bar===b);
      const melRoom = barMel.length ? barMel.filter(n=>n.rest || n.d>=beatLen).reduce((s,n)=>s+n.d,0)/barU : 0;
      if((1-motifPersist) + melRoom >= 1){ lh.push({m: gp.range.fixedPosition ? boxPitch(root) : accReg+off[root], d:barU}); prevHold=null; return; }
    }
    if(wide){
      // PER-PHRASE TEXTURE DEPLOYMENT (deployment reasoner): the primary texture is the piece's groove-MOTIF, STATED in
      // the opening phrase; a LATER phrase may re-colour to a RELATED texture - the composer's judgment of "how much to
      // carry the motif vs vary it" (Matthew's original brief for this layer). WHO varies = the character's YIELD, the
      // exact complement of the DRIVE the apex-fill expresses: a driving groove CARRIES its texture (holding IS the
      // drive), a yielding one re-colours across phrases. A literal RESTATE adds a reason - a repeated melody under an
      // unchanged accompaniment is mechanical, and the accompaniment is what freshens the repeat - so it nudges even a
      // mid-drive piece to vary, without dragging a relentless march in. Additive, rules nothing out (a strong contrast
      // or a very yielding character can also earn it), verified by MEASURED COHERENCE not ear:
      //   vary  <=>  (1 - motifPersist) + (restate ? 0.15 : 0)  >=  0.5
      // Phrase boundaries are bar 0 (states the motif) and bar `half` (the consequent - the only bar that may vary).
      if(b===0){ curTex = texture; _og.mp = motifPersist; }           // the opening always states the primary motif (mp exposed for the coherence check)
      else if(b===half){
        // WHETHER the consequent re-colours is an optional per-piece IDENTITY (like V/V / anacrusis), not a per-character
        // SWITCH - a lyrical piece may still hold ONE texture, a driver may still re-colour under a strong reason. The
        // character's YIELD (+ a restate nudge) sets how far the disposition LEANS toward varying; realised as a leaned
        // choice so the rate GRADES with yield (drivers rarely, yielders often) instead of snapping to 0/100 and
        // collapsing variety. WHICH related texture is then spread across the book by collection-diversity.
        const _lean = clamp((1-motifPersist) + (restate?0.15:0), 1);   // 0..1 disposition to re-colour: yield + restate nudge
        const _n = Math.round(_lean*4);                                // 0..4 'vary' slots out of 4
        const _vary = _n>0 && rnd([...Array(_n).fill(1), ...Array(4-_n).fill(0)])===1;
        curTex = _vary ? relatedTex(texture) : texture;
        if(curTex!==texture) _og.texVary=(_og.texVary||0)+1;
      }
    }
    let tex = wide ? curTex : texture;
    // DRIVE / APEX FILL (deployment reasoner, increment 2): toward the climax - a 'drive' bar (approach to a cadence) or the
    // 'apex' (phrase peak) - a HELD accompaniment activates into MOTION to push the phrase forward, the composer's fill under
    // a held peak note. Earned by THREE situational facts, none a mood or a die: (1) phraseFunc[b] is drive/apex (the same
    // structure the melody already intensifies on); (2) the base texture is HELD - block/sustained, a static whole-bar chord
    // that actually HAS room to move (a texture already in motion needs no fill and gets none); (3) the MELODY leaves that
    // room this bar (its sustained/rest fraction >= half the bar), so the two hands don't both scramble. Rendered as BROKEN
    // (the held harmony arpeggiated - a RELATED texture, purposeful variation, not a random jump). Rate falls out of the situation.
    // (The mirror-image 'thin under a running melody' - increment 3 - was BUILT and MEASURED here, then REMOVED: genuine
    //  independent both-hands scramble is ~0% [g3 0.00% / g4 0.21%] because calmMel already keeps the melody calm under a
    //  busy accompaniment and independent-fast-both-hands rarely co-occurs; the raw 'double-run' bars were INTENTIONAL
    //  parallel-tenths DOUBLING [identical hand rhythms, by design]. A thin gated on the melody running fired mostly on
    //  crotchet broken/alberti that were NOT scrambling, REMOVING legitimate motion - a fix removing a possibility. So it
    //  stays out. See [[sr-generation-method-locked]].)
    { const _bm = rh.filter(n=>n.bar===b);
      const _melRoom = _bm.length ? _bm.filter(n=>n.rest || n.d>=beatLen).reduce((s,n)=>s+n.d,0)/barU : 0;
      const _pf = phraseFunc[b];
      // The room is only PERMISSION (the melody left space so the two hands won't scramble). The DECISION - motion vs
      // weight - is the character's, from the SITUATION not a die: a DRIVE bar (the approach INTO the cadence) leads
      // forward, so it takes motion regardless of character; but the APEX (the peak itself) is the real fork - a driving
      // character fills under the held peak (motion), a YIELDING/lyrical one holds the grand sustained weight and must NOT
      // be broken into busyness. motifPersist (drive minus yield, centred at 0.5) is exactly that fork: >=0.5 = drive wins.
      const _wantsMotion = _pf==='drive' || (_pf==='apex' && motifPersist>=0.5);
      if(_wantsMotion && (tex==='block' || tex==='sustained') && _melRoom >= 0.5){
        tex = 'broken'; _og.fill=(_og.fill||0)+1;
      }
    }


    // ----- ALL GRADES (one shared LH renderer): voice the REAL triad (root-3rd-5th), upper tones lifted
    // ABOVE the bass so the dominant never collapses to a doubled root. For a FIXED-POSITION grade (grade 2,
    // !wide) the upper tones fold back INTO the five-finger box (the `if(wide)` lifts are skipped) and the
    // chordMax post-pass clamps to the grade's voice count, so grade 2 is this same engine gated down - not a
    // separate renderer. In MINOR, the dominant takes the harmonic-minor LEADING TONE (its 7th raised a
    // semitone) so it agrees with the melody's raised 7th instead of clashing a natural 7th against it. -----
    let degs = (CHORD_DEG[mode][c] || [root]).slice();
    // FIVE-FINGER VOICING: at a fixed-position grade the LH voices a chord from the tones that fall INSIDE the hand's
    // five-finger box (degree <= span); a chord tone whose degree is outside it (vi/VI's root, V's leading-tone 3rd) is
    // not played by the LH - the in-box tones voice the chord in INVERSION and the melody carries the rest. This is how a
    // composer keeps the hand in position while using any chord; it also stops degPitch from CLAMPING an out-of-box root
    // to a wrong note (vi's A -> G), which was producing rootless/wrong-note harmony (and dragging the score-0 rate down).
    if(gp.range.fixedPosition){ const ib=degs.filter(inBox); if(ib.length) degs=ib; }
    const isDomMin = mode==='min' && degs[0]===4;          // minor dominant -> use the leading tone
    // COLOUR: a DOMINANT 7th. On a dominant that resolves to the tonic, sometimes add the chord 7th (the subdominant
    // degree, a 3rd above the 5th) as an upper colour tone. It is voiced ABOVE the bass (never in it) and resolves
    // DOWN by step to the tonic's 3rd on the next chord via the least-motion leading - the textbook V7 -> I. Kept as
    // an UPPER tone so no texture puts it in the bass; chance-gated so plain triads still dominate.
    const seventhDeg = (degs[2]!=null) ? ((degs[2]+2)%7) : null;
    // H6 widened: a V7 resolves its 7th down to scale-degree 3, which is present in the submediant too, so V7->vi
    // (deceptive) is as valid as V7->I. Admit both; the 7th's resolution target (^3) is unchanged.
    // A dominant 7th may appear on ANY resolving dominant (V->I or the deceptive V->vi) in ANY style - a march's V7-I is
    // as textbook as a cantabile's, so CHARACTER never gates it. The real constraints: functional - it is the dominant,
    // its 7th resolves (next chord is I or vi), not the half-cadence V (a 7th there would hang unresolved); and the GRADE
    // - the syllabus admits sevenths from grade 4 (gp.harmony.sevenths), which is the ONLY legitimate gate and lives in
    // the grade layer, not an inline grade number. WHETHER a resolving V takes its 7th is reasoned from the harmony, not a
    // die, by TWO conditions that must both hold: (1) the 7th is PREPARED - the previous chord (a predominant ii / IV)
    // already contains ^4, so the 7th is a common tone held into the dominant (no sprung dissonance); (2) the dominant is
    // CADENTIAL - it resolves to a cadence, where the fuller V7 strengthens the close. A prepared V mid-phrase stays a
    // plainer triad; the voiced seventh is the cadential ii/IV-V7-I gesture. Both conditions are situational; the rate falls
    // out (only prepared cadential dominants). ("prepared" alone was nearly always true, so it wasn't the real selector.)
    const prevDegs = b>0 ? (CHORD_DEG[mode][prog[b-1]] || []) : [];
    const preparedSeventh = seventhDeg!=null && prevDegs.includes(seventhDeg);
    const cadentialDom = phraseFunc[b+1]==='cadence';                     // the dominant resolves onto a cadential arrival
    const add7 = (c===Tn.V) && b<nbars-1 && (prog[b+1]===Tn.I || prog[b+1]===(mode==='maj'?'vi':'VI')) && (gp.harmony && gp.harmony.sevenths) && preparedSeventh && cadentialDom;
    if(add7){ degs.push(seventhDeg); dom7Bars.add(b); _og.v7=(_og.v7||0)+1; }
    const degPitch = dg => { let p= gp.range.fixedPosition ? boxPitch(dg) : accReg+off[clamp(dg,span)]; if(isDomMin && (((dg%7)+7)%7)===6) p+=1; return p; };
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
      // PENALTY BY CHORD FUNCTION, not array position. After the in-box filter drops an out-of-box 3rd (e.g. iv's 3rd sits
      // outside the five-finger box), the 5th slides into the degs[1] slot and the positional scorer voiced it as a cheap
      // "first inversion" - which is actually a weak, exposed 6/4. So classify each candidate by whether it IS the chord's
      // root / 3rd / 5th and penalise the 5th as the 6/4 it is, wherever it landed in the array.
      const chDegs = CHORD_DEG[mode][c] || [degs[0]];
      const rootDg=(((chDegs[0]%7)+7)%7), thirdDg=chDegs[1]!=null?(((chDegs[1]%7)+7)%7):-1, fifthDg=chDegs[2]!=null?(((chDegs[2]%7)+7)%7):-1;
      // the 5th in the bass is a 6/4: fine as a PASSING/pedal chord (bass arrives by STEP) but weak when EXPOSED (LEAPT onto),
      // which is the fault harmony-checks flags. So penalise the 5th by its approach - a heavy penalty when taking it would
      // leap (root/3rd win even over a large jump), a mild one when it is a smooth step (a passing 6/4 stays available).
      const penOf = dg => { const d=((dg%7)+7)%7; if(d===rootDg) return 0; if(d===thirdDg) return melHasRootBar?0.4:1.2;
        if(d===fifthDg){ const leapt = prevBassP!=null && Math.abs(degPitch(dg)-prevBassP)>2; return leapt?40:4; }
        return 3; };
      const opts=[];
      for(const dg of degs){ const d=((dg%7)+7)%7;
        if(d===rootDg){ opts.push({dg,pen:0}); continue; }
        if(!canInvert) continue;                       // structural bar, no leap -> root position only
        if(d===fifthDg && structural) continue;        // never a 6/4 on a structural bar
        opts.push({dg,pen:penOf(dg)}); }
      if(!opts.length) opts.push({dg:degs[0],pen:0});
      let best=opts[0], bs=1e9;
      // CONSTRUCTIVE (clamp, not filter): the bass looks at the MELODY above it and will NOT pick an inversion that makes
      // PARALLEL octaves/5ths with the tune (the two outer voices moving the same direction into the same perfect
      // interval - they collapse into one bare line). It picks a different chord tone instead. So the fault is avoided by
      // construction rather than produced and re-rolled away. (The melody is already fixed when the bass is voiced.)
      const melDown = bar2 => { const n=rh.find(x=>!x.rest && x.bar===bar2); return n?(Array.isArray(n.m)?Math.max(...n.m):n.m):null; };
      const thisMel=melDown(b), prevMel=melDown(b-1);
      const perfect=x=>x===0||x===7;
      const makesParallel = cb => (prevMel!=null && thisMel!=null && prevBassP!=null) &&
        (()=>{ const iT=(((thisMel-cb)%12)+12)%12, iP=(((prevMel-prevBassP)%12)+12)%12;
          return perfect(iT) && iT===iP && (thisMel-prevMel)!==0 && (cb-prevBassP)!==0 && Math.sign(thisMel-prevMel)===Math.sign(cb-prevBassP); })();
      // Least-motion is the default, but pure minimisation lazily STAYS on the same pitch whenever the chord
      // repeats (Matthew's bar 4-5: Eb, Eb, Eb). Add a small nudge AWAY from repeating the exact previous bass
      // note, so a repeated chord tends to invert / move rather than stamp the same note. A bias, not a block.
      for(const o of opts){ const bp=degPitch(o.dg); let sc=Math.abs(bp-prevBassP)+o.pen; if(bp===prevBassP) sc+=1.5; if(makesParallel(bp)) sc+=5; if(sc<bs){ bs=sc; best=o; } }
      bassDeg=best.dg;
    }
    let bassP = degPitch(bassDeg);
    // VOICE-IMPLIED WALKING BASS (flagged): on a mid-phrase bar at a wide grade, render the bass as the derived
    // voice-led LINE - the chord tone the low voice walked to - instead of the per-bar inversion scorer's pick. Each
    // degree is placed at the octave NEAREST the previous bass note, so the stepwise derived degrees (0->6->5->4...)
    // come out as an actual walking line in register. Anchors and grade-2's fixed box keep the existing bass.
    if(!process.env.NOVHARM && _vhBass && !anchor[b] && !gp.range.fixedPosition){
      const deg=(((_vhBass[b]%7)+7)%7);
      if((CHORD_DEG[mode][c]||[]).map(d=>((d%7)+7)%7).includes(deg)){   // only if it is a chord tone of this bar's chord
        let p=accReg+off[deg];
        if(prevBassP!=null){ while(p-prevBassP>6) p-=12; while(prevBassP-p>6) p+=12; }
        bassDeg=deg; bassP=p;
      }
    }
    prevBassP = bassP;
    // upper voices sit ABOVE the bass at grade 3+ (full range); at a FIXED-POSITION grade (five-finger) they must stay
    // INSIDE the box, so lift only enough to clear the bass by NOT leaving the hand span - grade is a param, one renderer.
    // upper voices clear the bass by an octave at grades that leave five-finger position (fixedPosition=false), and stay
    // inside the grade's HAND SPAN otherwise - BOTH read from grade-params (gp.range.fixedPosition / gp.range.span), so the
    // grade-breaking limit lives in the grade filter, not hard-coded here. One renderer, grade only a parameter.
    let upperPs = degs.filter(d=>d!==bassDeg).map(dg=>{ let p=degPitch(dg); if(!gp.range.fixedPosition){ while(p<=bassP) p+=12; } return p; })
                      .filter(p=> !gp.range.fixedPosition || Math.abs(p-bassP)<=gp.range.span).sort((a,b)=>a-b);
    if(!upperPs.length) upperPs=[bassP+12];
    const pool=[bassP, ...upperPs];
    const ltPC = isDomMin ? ((((gp.range.fixedPosition?boxPitch(6):accReg+off[clamp(6,span)])+1)%12)+12)%12 : -1;   // leading-tone pitch class
    // FINGERING HINT: the generator KNOWS what figure it is building, so it tags each LH note with its figure-ROLE (bass /
    // chord / arp / held / alberti / walk). The fingerer then RECOGNISES the figure from the tag and applies its conventional
    // fingering (like an editor), instead of reverse-engineering it from raw pitches. `_lhRole` is set per texture branch.
    let _lhRole='';
    const addN = (m,d,tup) => { const arr=Array.isArray(m)?m:[m]; const o={m,d};   // spell ONLY the leading tone sharp
      if(tup) o.tup=tup; if(arr.some(p=>(((p%12)+12)%12)===ltPC)) o.alt='#'; if(_lhRole) o._role=_lhRole; lh.push(o); };
    // PER-BEAT voice-implied chord tones: the chord the two moving voices imply on THIS beat (vhDerive), so a figure
    // ARPEGGIATES THE MOVING HARMONY rather than one static bar-chord. This is what lets the accompaniment change chord
    // mid-bar UNDER the groove instead of outlining a single triad all bar. Falls back to the bar chord when the harmony
    // holds. (Matthew: stepwise motion changes the chord mid-bar; a real accompaniment rarely sits on one chord a whole bar.)
    const _nbb = Math.max(1, Math.round(barU/beatLen));
    const _beatChord = tw => { const k=Math.max(0,Math.min(_nbb-1,Math.floor((tw+1e-9)/beatLen)));
      const bd = (!process.env.NOVHARM && _vhBeat && _vhBeat[b] && _vhBeat[b][k]) ? _vhBeat[b][k] : null;
      return (bd && CHORD_DEG[mode][bd.chord]) ? bd.chord : c; };
    const _chDegSet = ch => new Set((CHORD_DEG[mode][ch] || degs).map(d=>((d%7)+7)%7));
    const _beatTones = tw => { const ch=_beatChord(tw);
      let ds = (CHORD_DEG[mode][ch] || degs).slice(); if(gp.range.fixedPosition){ const ib=ds.filter(inBox); if(ib.length) ds=ib; }
      return [...new Set(ds.map(degPitch))].sort((a,b)=>a-b); };
    // pick the accompaniment note for a beat: when the chord CHANGED from the previous beat, prefer a DISTINGUISHING tone of
    // the new chord (a degree the previous chord did NOT contain) so the change is actually SPELLED and audible - not a common
    // tone held over (holding the common tone is exactly what makes a mid-bar change inaudible). Ties break to voice-leading.
    const _distinguish = (cand, prevCh, curCh, prevP) => { if(!cand.length) return cand[0];
      if(prevCh && curCh && prevCh!==curCh){ const prevDeg=_chDegSet(prevCh);
        const news = cand.filter(p=>!prevDeg.has(((_pcToDeg(p))%7+7)%7)); if(news.length) cand=news; }
      if(prevP!=null) return cand.slice().sort((a,b)=>Math.abs(a-prevP)-Math.abs(b-prevP))[0];
      return cand[0]; };
    const _pcToDeg = p => { const pc=((p%12)+12)%12; for(let d=0;d<7;d++){ if(((degPitch(d)%12)+12)%12===pc) return d; } return 0; };
    // ===== SWAP: RIGHT-HAND accompaniment above the LH melody.
    if(swap){
      const _moves = !process.env.NOVHARM && _vhBeat && _vhBeat[b] && new Set(_vhBeat[b].map(x=>x&&x.chord).filter(Boolean)).size>1;
      // DEFAULT TO MOVEMENT (Matthew): a bar whose harmony CHANGES articulates each beat's chord with a DISTINGUISHING tone,
      // so the accompaniment audibly turns the harmony over under the tune instead of arpeggiating one chord + resting. A bar
      // whose harmony HOLDS keeps the sparse groove figure - repose is a possibility, not the default. WHICH chords and where
      // they change come from THIS piece's derived line, so no two pieces move the same way (no catch-all rule).
      if(_moves){
        let prevCh=null, prevP=(prevSwapTop!=null?prevSwapTop:null);
        for(let k=0;k<_nbb;k++){ const tw=k*beatLen, ch=_beatChord(tw); let tones=_beatTones(tw);
          if(prevP!=null){ let top=Math.max(...tones); while(top-prevP>7){tones=tones.map(t=>t-12);top-=12;} while(prevP-top>7){tones=tones.map(t=>t+12);top+=12;} }
          const pick = (k>0 && ch!==prevCh) ? _distinguish(tones, prevCh, ch, prevP)          // sound the NEW chord's own tone on the turn
                     : (prevP!=null ? tones.slice().sort((a,b)=>Math.abs(a-prevP)-Math.abs(b-prevP))[0] : tones[Math.min(1,tones.length-1)]);
          const o={m:pick,d:beatLen}; if((((pick%12)+12)%12)===ltPC)o.alt='#'; lh.push(o);
          prevP=pick; prevCh=ch; }
        prevSwapTop=prevP; return;
      }
      // HOLDING bar: the piece's consistent groove figure (its pitches still track the bar's held chord).
      const fig = primaryRHFig || {s:Array.from({length:nbeats},()=>['c',beatLen])};
      let ai=0, tw=0;
      for(const slot of fig.s){ const role=slot[0], d=slot[1], art=slot[2];
        if(role==='r'){ lh.push({rest:true,d}); tw+=d; continue; }
        let tones = _beatTones(tw);
        if(prevSwapTop!=null){ let top=Math.max(...tones);
          while(top-prevSwapTop>7){ tones=tones.map(t=>t-12); top-=12; }
          while(prevSwapTop-top>7){ tones=tones.map(t=>t+12); top+=12; } }
        const chordC = tones.slice(-Math.min(gp.chordMax, tones.length));
        const arp = tones.slice(0, Math.min(3, tones.length));
        const topT = arp[arp.length-1], innerT = arp.length>=2 ? arp[Math.floor((arp.length-1)/2)] : arp[0];
        let m = role==='a' ? arp[(ai++)%arp.length] : role==='p' ? topT : role==='i' ? innerT : chordC;
        prevSwapTop = Math.max(...(Array.isArray(m)?m:[m]));
        const arr = Array.isArray(m)?m:[m];
        const o = { m: Array.isArray(m)?m.slice():m, d }; if(art) o.art=art;
        if(arr.some(p=>(((p%12)+12)%12)===ltPC)) o.alt='#';
        lh.push(o); tw+=d;
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
      // A struck chord STATES the harmony as fully as the register allows cleanly - the full triad (two upper voices),
      // reducing to one open voice only in the LOW register where a close two-voice would be mud. Density is harmonic
      // completeness, not a character trait: a LIGHT character does not play a THIN chord, it plays a full one softly and
      // detached (its lightness is its articulation + dynamics, applied elsewhere), so nothing here reads the character.
      // The grade's chordMax caps the size HERE, keeping the bass (chord = bass + dens upper, so dens <= chordMax-1) -
      // not via a later top-slice that would drop the root. Register + grade, emergent; no character.
      let dens = Math.max(1, Math.min(lowReg ? 1 : 2, gp.chordMax - 1));
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
      if(gp.range.fixedPosition){
        // FIVE-FINGER LH: voice the chord's IN-POSITION tones at their position pitch (accReg + off[degree], the degree
        // inside the box), ABOVE the bass where possible, so the whole hand stays in ONE five-finger position (span <= a
        // 5th). A chord tone whose degree sits OUTSIDE the box (vi/VI's root, V's leading-tone 3rd) is simply not sounded
        // by the LH - the chord's in-box tones voice it (in inversion) and the melody carries the rest. This is the
        // composer's five-finger LH BY CONSTRUCTION. (Was `realize(pc, bassP+8)` - a voice a 6th-7th ABOVE the bass, out
        // of the position: the octave-scatter that broke the grade span and forced generation to re-roll past it.)
        const box=[...new Set(degs.filter(inBox).map(dg=> gp.range.fixedPosition ? boxPitch(dg) : accReg+off[(((dg%7)+7)%7)]))];
        const others=box.filter(p=>p!==bassP);
        const above=others.filter(p=>p>bassP).sort((a,b)=>a-b);
        const dens=Math.max(1, Math.min(pahDensity, gp.chordMax));
        const pick = above.length ? above.slice(0,dens) : (others.length ? [others[others.length-1]] : [bassP]);
        prevUpperVoices=pick.slice(); prevPah=pick.slice();
        return pick.length>1?pick:pick[0];
      }
      const bassPC=((bassP%12)+12)%12;
      const pcOf = dg => ((degPitch(dg)%12)+12)%12;
      const roles=[];                                                   // upper tones by priority: (7th colour), 3rd, 5th, then doubled root
      if(degs.length>3 && pcOf(degs[3])!==bassPC) roles.push(pcOf(degs[3]));   // the dominant 7th - a guide tone, voiced first so it sounds + resolves
      if(degs.length>1 && pcOf(degs[1])!==bassPC) roles.push(pcOf(degs[1]));
      if(degs.length>2 && pcOf(degs[2])!==bassPC && !roles.includes(pcOf(degs[2]))) roles.push(pcOf(degs[2]));
      if(!roles.includes(pcOf(degs[0]))) roles.push(pcOf(degs[0]));   // the root, as an octave-doubled upper voice, so a fuller-density pah can be a full 3-note triad rather than a bare 3rd
      if(!roles.length) roles.push((bassPC+7)%12);
      const dens=Math.max(1, Math.min(pahDensity, roles.length, gp.chordMax));   // the pah chord never exceeds the grade's CHORD SIZE (gp.chordMax) - at grade 2 (chordMax 1) it is a single upper voice, so the figure renders inside five-finger; grade only a parameter
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

    // ===== VOICE-IMPLIED PER-BEAT HARMONY (flagged): a MID-PHRASE bar whose derived harmony CHANGES within the
    // bar is struck beat-by-beat - the walking bass on each beat with the chord's tones voiced above it - which is
    // the natural texture for fast harmonic rhythm (Matthew's contrary-motion crotchets). A bar whose harmony HOLDS
    // falls through to its character figure. So the change-rate, not the grade, decides where the texture strikes.
    // The intra-bar cooperation renders on ANY bar whose derived harmony moves within it - NOT only non-pillar bars. The old
    // `!anchor[b]` gate discarded the within-bar changes the derivation had already written on every pillar bar (and a short
    // grade-2 phrase is ALL pillars, so it lost them entirely). The only bars that must keep a clean, un-moved harmony are the
    // genuine cadential ARRIVALS - the final close, the penultimate pre-tonic that sets it up, and a real mid-phrase cadence -
    // where the ear needs the chord to land whole. Everywhere else (the opening tonic included) the harmony is free to move
    // within the bar, which is exactly the intra-bar flexibility a composer has. (Matthew: stop deleting the movement.)
    // ONLY the genuine cadential ARRIVALS keep a clean, un-moved harmony: the final close, and a real mid-phrase cadence
    // whose downbeat lands the antecedent's V/I. The PENULTIMATE is NOT an arrival - it is the pre-cadential DRIVE, exactly
    // where a composer's harmony moves most (a predominant stepping into the dominant, contrary motion into the close), so it
    // was wrong to freeze it. Where the penult already carries a prog2 cadential split or a secondary dominant, that split is
    // kept (the !prog2 guard below), so nothing cadential is lost; the penult only moves intra-bar when it otherwise wouldn't.
    const _cadBar = (b===nbars-1) || (b===half-1 && (midType==='HC'||midType==='IAC'||midType==='DC'));
    if(process.env.VHDEBUG && globalThis.__vh){ globalThis.__vh.reached=(globalThis.__vh.reached||0)+1; if(_vhBeat && new Set(_vhBeat[b].map(x=>x.chord)).size>1){ globalThis.__vh.reachedMove=(globalThis.__vh.reachedMove||0)+1; if(_cadBar)globalThis.__vh.gatedCad++; else if(prog2[b])globalThis.__vh.gatedProg2++; else if(tex==='motif')globalThis.__vh.gatedMotif++; else globalThis.__vh.struck++; } }
    if(!process.env.NOVHARM && _vhBeat && !_cadBar && !prog2[b] && tex!=='motif'){   // the motif-as-accompaniment texture stays its OWN consistent figure (the tune's rhythmic cell), not replaced by a beat-by-beat voiced line
      const beats=_vhBeat[b], distinct=new Set(beats.map(x=>x.chord)).size;
      if(distinct>1){
        // POSITIVE VOICE-LEADING (Matthew: reason it as a composer, not filter parallels away). Strike the changing harmony
        // beat by beat and voice each part by proper part-writing: the BASS steps CONTRARY to the melody to the nearest chord
        // tone (the stable root/3rd preferred, the 5th only when it's a passing step); the UPPER voices move by the SMALLEST
        // step to a tone of the new chord, holding common tones. Stepwise contrary interest EMERGES from this, and parallels
        // and exposed 6/4s never arise, because good voice-leading doesn't produce them. All within the hand's five-finger box.
        const _melAtBeat = k => { let t=0; for(const n of rh){ if(n.bar!==b) continue; if(k*beatLen>=t-1e-9 && k*beatLen<t+n.d-1e-9) return Array.isArray(n.m)?Math.max(...n.m):n.m; t+=n.d; } return null; };
        let pBass=prevBassP, pUp=null, lastTop=null, pMel=_melAtBeat(0), pChDegs=null;
        for(let k=0;k<beats.length;k++){
          const ck=beats[k].chord; const chDegs=(CHORD_DEG[mode][ck]||[degs[0]]).map(d=>((d%7)+7)%7);
          const rootD=chDegs[0], thirdD=chDegs[1], fifthD=chDegs[2];
          const changed = pChDegs && ck!==(beats[k-1]&&beats[k-1].chord);   // the harmony turned over on this beat
          const melNow=_melAtBeat(k); const mDir=(melNow!=null && pMel!=null)?Math.sign(melNow-pMel):0;
          // BASS: choose the chord tone that steps CONTRARY to the melody, nearest the previous bass, root/3rd preferred.
          let bass=null, bScore=1e9;
          for(const d of chDegs){ let p = gp.range.fixedPosition ? boxPitch(d) : accReg+off[d];
            if(!gp.range.fixedPosition && pBass!=null){ while(p-pBass>7) p-=12; while(pBass-p>7) p+=12; }
            const dir = pBass!=null?Math.sign(p-pBass):0; let s = pBass!=null?Math.abs(p-pBass):0;
            if(mDir!==0 && dir===-mDir) s-=3;                 // reward moving CONTRARY to the melody (the interest)
            else if(dir===0) s+=1.2;                          // reward motion over sitting still
            if(d===fifthD) s += (pBass!=null && Math.abs(p-pBass)<=2) ? 2 : 5;   // the 5th in the bass is a 6/4 - strongly disfavour it, allow only as a smooth passing step (never leapt onto or exposed)
            if(d===rootD || d===thirdD) s-=0.5;               // the root/3rd are the grounded bass tones - a lean, so the bass rests on them and only passes through the 5th
            // SPELL THE CHANGE (Matthew): when the chord turns over, a single-note bass must sound a tone the PREVIOUS chord did
            // NOT contain - else it holds the common tone and the change is inaudible. Prefer a distinguishing tone on the turn.
            if(changed && !pChDegs.includes(d)) s-=2.6;
            if(s<bScore){ bScore=s; bass=p; }
          }
          if(bass==null) bass = gp.range.fixedPosition ? boxPitch(rootD) : accReg+off[rootD];
          // UPPER VOICES: the chord tones above the bass, voice-led by SMALLEST step from the previous voicing.
          let ups=[];
          if(gp.chordMax>1){
            const tones=[...new Set(chDegs)].map(d=>{ let p= gp.range.fixedPosition ? boxPitch(d) : accReg+off[d]; while(p<=bass) p+=12; return p; })
              .filter(p=> !gp.range.fixedPosition || p-bass<=gp.range.span).sort((a,b)=>a-b);
            const dens=Math.max(0, Math.min(gp.chordMax-1, tones.length));
            if(pUp && pUp.length){ ups=tones.slice().sort((a,b)=> Math.abs(a-(pUp[0]??a))-Math.abs(b-(pUp[0]??b))).slice(0,dens).sort((a,b)=>a-b); }
            else ups=tones.slice(0,dens);
          }
          const notes=[bass,...ups]; _lhRole = k===0?'bass':'chord'; addN(notes.length>1?notes:notes[0], beatLen);
          pBass=bass; pUp=ups.length?ups:[bass]; lastTop=notes[notes.length-1]; if(melNow!=null) pMel=melNow; pChDegs=chDegs;
        }
        prevBassP=pBass; prevOB=pBass; prevOT=lastTop!=null?lastTop:pBass;
        return;
      }
    }
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
        const supert= gp.range.fixedPosition?boxPitch(1):accReg+off[clamp(1,span)], raised=(gp.range.fixedPosition?boxPitch(3):accReg+off[clamp(3,span)])+1, sixth= gp.range.fixedPosition?boxPitch(5):accReg+off[clamp(5,span)];
        // GROUND IT (Matthew's slot-12: the raised 4th left alone in the bass reads as rootless/unmoored — "no root
        // to guide it"). ALWAYS root position: the root (supertonic) struck on the beat in the bass, the raised 4th
        // + 5th voiced ABOVE it. Drops the old first-inversion branch that exposed the chromatic note in the bass.
        let up=[raised,sixth].map(p=>{ while(p<=supert) p+=12; return p; }).sort((x,y)=>x-y);
        lh.push({m:supert, d:b1});
        lh.push({m:above(up), d:b2, alt:'#'});               // '#' spells the raised note right in any key
        return;
      }
      const dp2 = dg => gp.range.fixedPosition ? boxPitch(dg) : accReg+off[clamp(dg,span)];      // plain spelling: split targets are LT-free (major any; minor iv/VI/i)
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
      // when the melody already spells the 3rd, the LH is free to be spare - and WHETHER it holds a lone open bass or the
      // fuller 2-note chord is decided by REGISTER, not a die: below C3 (48) a held bass+3rd muddies, so hold the lone
      // open bass (the melody carries the 3rd); at/above C3 the 2-note chord rings clean and adds harmonic body. When the
      // melody does NOT spell the 3rd, always hold the chord so something states it.
      _lhRole='held'; addN(melHasThird ? (bassP<48 ? bassP : heldVoice()) : heldVoice(), barU); return;
    }
    if(tex==='alberti'){ _lhRole='alberti';   // Alberti bass: low, top, middle, top — classic moving harmony
      const nsub = compound ? Math.round(barU/0.5) : nbeats, sublen = compound ? 0.5 : beatLen;   // COMPOUND: subdivide into eighths so it FLOWS, not one note per dotted-crotchet beat
      // PER-BEAT harmony: each Alberti note draws from the chord implied ON ITS BEAT, so the figure changes chord mid-bar
      // (the classic Alberti role - it IS the moving harmony) instead of arpeggiating one static triad the whole bar.
      const seq=[]; for(let i=0;i<nsub;i++){ const pl=_beatTones(i*sublen); const lo=pl[0], hi=pl[pl.length-1], mid=pl[1]??hi, pat=[lo,hi,mid,hi];
        let p=pat[i%pat.length];
        if(i>0 && p===seq[i-1]){ const a=pl.find(x=>x!==p); if(a!=null) p=a; } seq.push(p); }
      seq.forEach(p=>addN(p, sublen));
      return;
    }
    if(tex==='motif'){ _lhRole='motif';   // MOTIF-AS-ACCOMPANIMENT (Beethoven-5): the accompaniment carries the TUNE'S OWN
      // rhythmic cell - chord tones arpeggiated in the melody's motif rhythm - so one idea is woven into BOTH hands instead of
      // a tune over an unrelated figure. Pitches are chord tones (no clash); only the RHYTHM is borrowed from the motif. A
      // recognizable, consistent figure (kept out of the vh-strike so it stays one idiom, not a beat-by-beat voiced line).
      const cells0 = (typeof motifA!=='undefined' && motifA && motifA.length>=2) ? motifA.slice() : [beatLen, beatLen];
      const csum=cells0.reduce((a,b)=>a+b,0); const cells = csum>1e-9 ? cells0.map(d=>d*barU/csum) : cells0;   // scale the cell to fill exactly one bar
      const seq=[]; for(let i=0;i<cells.length;i++){ let p=pool[i%pool.length]; if(i>0 && p===seq[i-1]){ const a=pool.find(x=>x!==p); if(a!=null) p=a; } seq.push(p); }
      cells.forEach((d,i)=>addN(seq[i], d)); return;
    }
    if(tex==="block"){ _lhRole='held'; addN(heldVoice(), barU); return; }                     // struck HELD chord: open low / full triad mid, never a bare 3rd
    if(tex==='bassline'){ _lhRole='walk';      // moving stepwise bass toward the next chord's root
      const nextR = b<nbars-1 ? CHm[prog[b+1]].b : 0; let cur=degs[0];
      let lastDir = Math.sign(nextR-degs[0]) || 1;   // same reasoning as the grade-2 bassline (one engine): approach direction drives the neighbour on early arrival, lower neighbour when there is no ground to cover
      for(let i=0;i<nbeats;i++){ addN(degPitch(cur), beatLen);
        if(i<nbeats-1){ let step=Math.sign(nextR-cur);
          if(step===0) step=-lastDir; else lastDir=step;
          cur = clamp(cur+step, span); } }
      return;
    }
    if(tex==='broken'){ _lhRole='arp';         // half arpeggio (leaps), half a STEPWISE scale fragment (passing tones)
      const nsub = compound ? Math.round(barU/0.5) : nbeats, sublen = compound ? 0.5 : beatLen;   // COMPOUND: eighths, so the broken chord rocks instead of collapsing to dotted crotchets
      const root0 = ((degs[0]%7)+7)%7;
      // A scalar (passing) bass genuinely CONNECTS a stepwise root-motion - the next chord's root a 2nd or 3rd away, so a
      // walking bass leads there - and belongs only where the TUNE leaves room: a busy melody + a walking bass compete (a
      // scalar bass reads as a second tune). So it emerges where the harmony walks AND the melody is calm; elsewhere the
      // bass arpeggiates its chord tones (leaps), staying supportive. Reasoned from harmony + melody, not a minority die.
      const nextRoot0 = (b<nbars-1 && CHORD_DEG[mode][prog[b+1]]) ? ((CHORD_DEG[mode][prog[b+1]][0]%7)+7)%7 : root0;
      const upSteps = ((nextRoot0-root0)%7+7)%7;
      const walkable = upSteps===1 || upSteps===2 || upSteps===5 || upSteps===6;   // a 2nd/3rd apart (either way); not the same root (0) nor a 4th/5th (3,4), which a step-run cannot cleanly span
      const melBusy = rh.filter(n=>n.bar===b && !n.rest).length >= 3;              // a busy tune here -> the bass stays out of the way
      if(walkable && !melBusy){                // scalar passing bass: connects a stepwise root-motion where the tune leaves room; the run then LEADS toward the next root
        let cur=clamp(root0,span), dir = (upSteps>=1 && upSteps<=3) ? 1 : -1; const seq=[];
        for(let i=0;i<nsub;i++){ seq.push(cur);
          let nxt=cur+dir; if(nxt<0 || nxt>span || Math.abs(nxt-root0)>4){ dir=-dir; nxt=cur+dir; } cur=clamp(nxt,span); }
        seq.forEach(dg=>addN(degPitch(dg), sublen));
      } else {                                 // arpeggio over the chord tones (leaps), no immediate repeats
        // PER-BEAT harmony: each arpeggio note draws from the chord implied ON ITS BEAT, so a broken-chord figure moves the
        // harmony mid-bar instead of leaping around one static triad all bar.
        const seq=[]; for(let i=0;i<nsub;i++){ const pl=_beatTones(i*sublen); let p=pl[brokenShape[i%brokenShape.length] % pl.length] ?? pl[0];
          if(i>0 && p===seq[i-1]){ const a=pl.find(x=>x!==p); if(a!=null) p=a; } seq.push(p); }
        seq.forEach(p=>addN(p, sublen));
      }
      return;
    }
    // ---- CHARACTER GROOVES whose rests are INTRINSIC (not inserted): a struck bass/chord that LIFTS to
    // silence. This is where the dance bounce, the march crispness and the maestoso weight live. Grounded in
    // the ABRSM specimen books (the detached LH dance bass is the single commonest rest-source across them). ----
    const strikeN = (m,d,art,tup) => { let arr=Array.isArray(m)?m:[m];
      if(arr.length>gp.chordMax) arr=[...arr].sort((a,b)=>a-b).slice(-gp.chordMax);   // never exceed the grade's CHORD SIZE (gp.chordMax) - grade 2 = a single LH note, so figures render five-finger-legal. One renderer, grade a parameter.
      const mm = arr.length===1 ? arr[0] : arr; const o={m:mm,d}; if(tup) o.tup=tup; if(arr.some(p=>(((p%12)+12)%12)===ltPC)) o.alt='#'; if(art) o.art=art; if(_lhRole) o._role=_lhRole; lh.push(o); };
    const lift = d => { if(d>1e-9) lh.push({rest:true,d}); };
    const pahChord = () => chordVoiceUpper();   // the "pah" now draws from the voicing bank (varied + voice-led) instead of a fixed 2-note upper
    if(tex==='fig'){                 // draw a real rest-usage figure from the BANK and fill it with this bar's harmony.
      // the groove is CONSISTENT within a piece (a groove stays a groove) - the primary figure throughout. Figure variety
      // lives ACROSS the book (different pieces draw different primary figures), not from an arbitrary mid-piece change.
      const f = primaryFig || figCands[0];
      // the groove keeps its own staccato detachment, but ACCENTS are NOT stamped on every bar's downbeat
      // (that makes an accent meaningless); they are placed centrally, sparingly, on notes that stand out.
      // A 'c' chord in an oom-pah is the "pah" (upper tones only — the 'b' slot already carries the root). A
      // bass-less STRUCK chord (maestoso/grand) has no such bass, so it CAN read rootless. But a 3rd+5th (sixth)
      // voicing is fine when the ROOT is somewhere — so only force the root into the left hand at the OPENING (to
      // establish the key) or when the MELODY doesn't already carry the root this bar; otherwise keep the sixth
      // voicing for variety.
      if(f){ const figHasBass = f.s.some(s=>s[0]==='b');
        const rootPC = ((((gp.range.fixedPosition?boxPitch(degs[0]):accReg+off[clamp(degs[0],span)]))%12)+12)%12;
        const melHasRoot = rh.some(n=>n.bar===b && !n.rest && (Array.isArray(n.m)?n.m:[n.m]).some(m=>(((m%12)+12)%12)===rootPC));
        const needRoot = b===0 || !melHasRoot;
        // ALTERNATING BASS (the composer's oom-pah): a bar with MORE THAN ONE bass hit does not dead-repeat the root - the
        // primary bass states the root, the secondary hit steps to the FIFTH (boom-chick-chick), giving the LH motion. The
        // fifth on a WEAK secondary beat is a passing/alternating bass, not an exposed 6/4 (the check flags the downbeat).
        // In-box, so the five-finger hand is unaffected; if the fifth is out of the hand it stays on the root (no motion, but
        // never a wrong note). This is what stops the tonic pedal reading as a dead-repeated bass across static bars.
        const _bassHits = f.s.filter(s=>s[0]==='b').length;
        const chDegs = CHORD_DEG[mode][c] || [degs[0]];
        const _fifthDeg = chDegs[2]!=null ? (((chDegs[2]%7)+7)%7) : null;
        const _altBass = (_bassHits>=2 && _fifthDeg!=null && (!gp.range.fixedPosition || inBox(_fifthDeg)))
          ? (gp.range.fixedPosition ? boxPitch(_fifthDeg) : degPitch(_fifthDeg)) : null;
        let _bi = 0;
        // At a FIXED-POSITION grade the LH stays in ONE five-finger position, so every slot draws from the IN-POSITION
        // voicing (pahChord) - never struck2, which octave-spreads a struck chord for the TRAVELLING (grade 3+) hand and
        // was the octave-scatter here. A bassless slot that must state the root plays the in-position bass note itself.
        const fillRole = role => role==='b' ? (()=>{ const p = (_bi++ % 2 === 1 && _altBass!=null && _altBass!==bassP) ? _altBass : bassP; return p; })()
          : gp.range.fixedPosition ? ((figHasBass || !needRoot) ? pahChord() : bassP)
          : (figHasBass ? pahChord() : (needRoot ? struck2() : pahChord()));
        const roleTag = r => r==='b' ? 'bass' : r==='a' ? 'arp' : 'chord';   // the figure's own slot role -> a fingering-role tag
        for(const slot of f.s){
          if(slot[0]==='t3'){                               // eighth-triplet slot: ['t3', [r1,r2,r3], art?] — one beat as a \tuplet 3/2
            const roles=slot[1], art=slot[2];
            roles.forEach((role,ti)=>{ if(role==='r'){ lh.push({rest:true,d:1/3,tup:1}); return; }
              _lhRole=roleTag(role); strikeN(fillRole(role), 1/3, (ti===0&&art&&art!=='->')?art:undefined, 1); });
            continue;
          }
          const [role,d,art]=slot; if(role==='r'){ lift(d); continue; }
          _lhRole=roleTag(role); strikeN(fillRole(role), d, art==='->'?undefined:art); } return; }
      // (no figure fits this bar — fall through to the oom-pah default below)
    }
    // oom-pah (rootfifth / default): bass on the beat, the CHORD (from the voicing bank) above for the rest of the bar
    const [oh,ot]=barSplit(barU,beatLen);
    const upV = chordVoiceUpper(); let up = Array.isArray(upV)?upV:[upV];
    if(!gp.range.fixedPosition && up.length && up[0] < LOWSPREAD) up = up.map(p=>p+12);   // low-register spread: lift the "pah" chord out of the mud so it isn't a clustered low 3rd over the bass. NOT at a fixed-position grade: the five-finger LH stays in ONE position, so lifting the pah an octave would leave the hand (the octave-scatter that broke the span); a low close voicing is the correct five-finger sound there.
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
    _lhRole='bass'; addN(bassP, oh); _lhRole='chord'; addN(up.length>1?up:up[0], ot);
    prevOB=bassP; prevOT=topN;
  });

  // ANTI-STATIC PEDAL (grade 2, non-swap): catch ANY texture that left the SAME held bass pitch on consecutive
  // whole bars — a dead repeated pedal (Matthew: bars 2-3 both a held dominant reads as a copied pattern). Break
  // each REPEAT into a same-chord arpeggio (same harmony, grade-legal). One held bar on its own is fine and stays.
  if(!wide && !swap && process.env.NOVHARM){   // OLD one-chord-per-bar band-aid: reverted a repeated pedal to a bar-chord arpeggio. Off when the per-beat harmony drives (movement is the default, so dead pedals don't arise to break).
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
  if(wide && !swap && !globalThis.__NOCTR){   // inner counter-line available in compound metre too (the `!compound` exclusion had no musical reason - a 6/8 held chord carries an inner contrary line as well as simple time; diatonic+resolving, the sampler rejects any clash)
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
      // walk a held inner chord into a moving COUNTERMELODY - an inner contrapuntal line. Its genuine preconditions are all
      // present and are the whole cause: a real chord (>=2 notes), HELD long enough to move (nb>=3 beats), with register
      // ROOM under the tune (the ceil<floor guard below). A crisp/detached character rarely holds a chord that long (its
      // chords are short), so it self-limits WITHOUT a mood gate; but a grand or sustained piece, whatever its feel, can
      // carry an inner line when it genuinely holds a chord with room. So feel does not gate it - nothing legitimate is ruled out.
      if(!structural && Array.isArray(n.m) && n.m.length>=2 && nb>=3){
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
      // bridge the leap wherever one occurs, up to the per-piece BUDGET above (a few, never wall-to-wall) - the leap IS
      // the reason for a passing note; the budget is the restraint. No extra die on top of the cap.
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
  // Realise the rest functions (restMoves) now that BOTH hands exist, so every rest is
  // placed RELATIONALLY — the reason a stray rest can't appear out of character. Each move is coherent BY
  // CONSTRUCTION, its guard rejecting the incoherent cases (a voice must keep sounding unless the fabric lifts
  // both hands together; no stranded sub-beat below a quaver; never silence a bar's only harmony statement).
  // Moves fire only where the phrase/harmony plan calls for them, capped by the intent, so a rest is never a
  // per-beat accident. Applied to the melody (rh); the LH already carries its groove rests. Anything that still
  // slips through is caught by validate() in the outer sampler.
  if(restMoves.size){
    const EPS=1e-6;
    const lhBars=[]; { let t=0; for(const n of lh){ const bi=Math.floor(t/barU+EPS); (lhBars[bi]??=[]).push({pos:t-bi*barU,d:n.d,rest:!!n.rest}); t+=n.d; } }
    const lhSounds=(bar,a,b2)=>(lhBars[bar]||[]).some(e=>!e.rest && e.pos<b2-EPS && e.pos+e.d>a+EPS);   // a voice continues under the RH rest
    const lhOnset =(bar,pos)=>(lhBars[bar]||[]).some(e=>!e.rest && Math.abs(e.pos-pos)<EPS);            // LH strikes this beat (syncopation reference)
    const lhRestOf=(bar)=>(lhBars[bar]||[]).find(e=>e.rest && e.d>=0.5);                                // an LH lift to align to
    const lhGapped=(bar)=>(lhBars[bar]||[]).some(e=>e.rest);                                            // LH is detached this bar
    const barsRH=[]; for(const n of rh){ (barsRH[n.bar]??=[]).push(n); }
    const posList = arr => { let p=0; return arr.map(n=>{ const o={n,pos:p}; p+=n.d; return o; }); };
    const single=n=>!n.rest && !Array.isArray(n.m);
    // rests are RESTRAINED and PURPOSEFUL - roughly one per PHRASE (a breath at a phrase end, an occasional caesura). The
    // count is UNIVERSAL, not character-scaled: a detached piece's extra bounce lives in its STACCATO articulation (short
    // notes), NOT in explicit rests, so the quantity is the same restrained handful for every style (Matthew's rest-
    // principle: style dictates the FUNCTION of rests, not the quantity). A phrase is ~4 bars.
    let applied=0; const MAXR=Math.max(1, Math.round(nbars/4));
    for(let b=0;b<nbars-1 && applied<MAXR;b++){                       // never touch the final cadence bar
      const notes=barsRH[b]; if(!notes||!notes.length) continue;
      // restraint is carried by MAXR (the intent-derived CAP on total rests) plus each move's own structural condition
      // (a breath only at a phrase boundary; a lift/offbeat only where the LH is gapped); a rest lands where the phrase
      // plan calls for it, up to the cap. No extra per-bar die on top of the cap.
      const boundary = (b===half-1) || (b===nbars-2);
      let did=false;
      // 1) BREATH at a phrase boundary — the melody lifts early into the next phrase; the LH keeps sounding.
      if(restMoves.has('breath') && boundary){
        const last=[...notes].reverse().find(n=>single(n)&&!n.slur);
        // A quaver breath, taken ONLY off a note long enough to spare it - the note it leaves must still be at
        // least a full beat. Otherwise a plain crotchet gets chopped into a quaver + rest, which reads as an
        // incoherent hole in a lyrical line rather than a breath (Matthew: bar-4 Eb over a sounding LH).
        // THE BREATH LENGTH MATCHES THE ARTICULATION (Matthew): a LEGATO/singing line breathes with a proper FULL-BEAT lift
        // that ends the note ON a beat (a real phrase breath); a stubby quaver rest there reads as an out-of-place DETACHMENT,
        // not a taper. A light/DETACHED line takes the quick quaver lift, which is idiomatic to its bounce. Where a legato line
        // has no note long enough to spare a whole beat, it simply doesn't breathe here - it FLOWS to the barline (no clip).
        if(last){ const beat=compound?1.5:1; const br = character.detach < 0.2 ? beat : 0.5;
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
      // 3) OFFBEAT (pointillist) is NOT applied here anymore — see the OFFBEAT TEXTURE pass after this loop. Placing it
      //    inside the MAXR breath budget capped it to ~1, which produced a LONE off-beat clip (a note chopped by a stray
      //    rest that never recurs) — Matthew's ex12, and a contradiction of the rest-principle two comments up (melodic
      //    detachment lives in STACCATO/a recurring figure, not one stray rest). It is a TEXTURE, so it is decided per
      //    piece and applied to EVERY eligible bar or none, below.
      // 4) DISPLACE (syncopation, G4 only) — delay an inner-beat note so it enters OFF the beat over the LH strike.
      if(!did && restMoves.has('displace') && gp.rhythmDevices.syncopation){   // syncopation ← grade params (ABRSM: grade 5+, not grade 4)
        const pl=posList(notes);
        // R3: an on-beat rest is syncopation only if the displaced weight is FELT — the note must carry across the
        // NEXT strong beat (longer than a beat) and stay inside the bar (crosses the next beat, not the barline).
        // A note contained in its own beat would be a dropped note, not a syncopation. (Recurrence branch: TODO.)
        const cand=pl.filter(o=>single(o.n)&&o.n.d>beatLen+EPS&&o.pos+o.n.d<=barU+EPS&&Math.abs(o.pos%beatLen)<EPS&&o.pos>EPS&&lhOnset(b,o.pos));   // ON an inner beat of THIS metre (beat = beatLen, not integer)
        // a syncopation is applied where its spot exists (already gated by the restMoves plan, the MAXR cap and the grade
        // param) - the chance on top was a redundant suppressor. Displace the LONGEST eligible note: the one whose delayed
        // weight is most FELT across the next beat. Not a die.
        if(cand.length){ const o=cand.reduce((a,c)=> c.n.d>a.n.d ? c : a); const keep=o.n.d-0.5;
          notes.splice(notes.indexOf(o.n),1,{rest:true,d:0.5,bar:b},{m:o.n.m,d:keep,bar:b,...(o.n.slur?{slur:o.n.slur}:{})}); did=true; }
      }
      if(did) applied++;
    }
    // OFFBEAT TEXTURE (pointillist bounce) — mirror a CONSISTENTLY-detached LH with an off-beat melody rest, but as a
    // RECURRING figure, never a lone clip. A single off-beat rest reads as a mistake (Matthew's ex12) and violates the
    // rest-principle (melodic detachment = staccato / a recurring gesture, not a stray rest). So this fires only when the
    // LH groove genuinely gaps in >=2 bars (a real detached groove to echo) and then in ALL of them — a consistent
    // texture, quantity following FUNCTION (Matthew's rule), not the one-per-phrase breath budget. A single-gap LH gives
    // NO melody clip; any detachment there is carried by staccato articulation. Runs AFTER breaths/lifts (recomputes each
    // bar's notes, so a note already lifted is no longer eligible); each clip keeps every original per-bar guard (off the
    // beat, LH still sounding under it, no foreign sub-quaver granularity).
    if(restMoves.has('offbeat')){
      const eligible=[];
      for(let b=0;b<nbars-1;b++){ if(!lhGapped(b)) continue; const notes=barsRH[b]; if(!notes||!notes.length) continue;
        const pl=posList(notes); const barSixteenths=notes.filter(x=>!x.rest&&x.d<0.5-EPS).length;
        const cand=pl.filter(o=>single(o.n)&&o.n.d<=0.5&&o.pos>EPS&&o.pos+o.n.d<barU-EPS&&Math.abs(o.pos%beatLen)>EPS
                              &&(o.n.d>=0.5-EPS||barSixteenths>=3)&&lhSounds(b,o.pos,o.pos+o.n.d));
        if(cand.length) eligible.push({b, n: cand.reduce((a,c)=> c.pos>a.pos ? c : a).n});   // the latest off-beat note in the bar
      }
      if(eligible.length>=2){ for(const {b,n} of eligible){ const notes=barsRH[b]; const idx=notes.indexOf(n); if(idx>=0) notes.splice(idx,1,{rest:true,d:n.d,bar:b}); } }
    }
    rh.length=0; for(let b=0;b<nbars;b++){ if(barsRH[b]) rh.push(...barsRH[b]); }
  }

  // CHROMATIC passing note — gated by the grade's chromatic BUDGET (gp.chromatic.budget), not grade===4. Inserted
  // BEFORE the expression engine so the phrase-aware dynamics can SEE it. An off-beat passing semitone between two
  // notes a tone apart; a quaver taken off the first note, spelled by direction (ascending sharp, descending flat).
  if(gp.chromatic.budget>0){
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
    // a chromatic passing note is used wherever the melody OFFERS the opportunity (the restrictive spot above - two chord
    // tones a whole tone apart on a strong beat, no LH clash), within the grade's chromatic BUDGET. Place it on the spot
    // whose departing note is LONGEST: the most room for the passing semitone and the most stable note to slip from.
    // Earliest breaks ties. Not a die.
    if(spots.length){ const i=spots.reduce((x,y)=> rh[y].d > rh[x].d ? y : x), a=rh[i], b2=rh[i+1];
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
        let best=null,bd=99;
        if(gp.range.fixedPosition){
          // FIXED FIVE-FINGER HAND: the repaired chord tone must stay UNDER THE HAND (inside the position window), not
          // the globally-nearest one - snapping the window's bottom finger down to the tonic's 3rd below would move the
          // hand out of position (the escape this pass otherwise creates). Search the window's own degrees for the
          // nearest chord tone; one almost always exists (a triad supplies ~2-3 of any 5 consecutive scale degrees).
          for(let wi=0; wi<=span; wi++){ const cand=mnote(wi); if(ct.has(((cand%12)+12)%12) && Math.abs(cand-cur)<bd){ bd=Math.abs(cand-cur); best=cand; } }
        } else {
          for(let cand=cur-3;cand<=cur+3;cand++){ if(ct.has(((cand%12)+12)%12) && Math.abs(cand-cur)<bd){ bd=Math.abs(cand-cur); best=cand; } }
        }
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
    // In a fixed five-finger position the neighbour must stay UNDER THE HAND (inside the window), else breaking the
    // hammered run would shove the hand out of position; toward the window centre is chosen naturally. Wide grades: free.
    const inWin=v=>{ const d=off.indexOf(v-melReg); return d>=winLo && d<=winLo+span; };
    const okB=v=>!gp.range.fixedPosition || inWin(v);
    const breakNote=(p,ct)=>{ for(const d of [-2,2,-1,1,-3,3]) if(ct.has((((p+d)%12)+12)%12) && okB(p+d)) return p+d;
      for(const d of [-1,1,-2,2]) if(scalePC.has((((p+d)%12)+12)%12) && okB(p+d)) return p+d; return null; };
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
  // within that band, the opening level is the one the COLLECTION has opened on LEAST (diversity spreads the book's
  // opening dynamics instead of a die); free for a standalone piece. Dynamics don't affect validity, so this is safe at
  // buildCandidate level. clampToDL keeps it in the grade range.
  const _dynBand = (character.dyn && character.dyn.length) ? character.dyn : (prof==='legato'?['pp','p','mp'] : prof==='light'?['mp','mf','f'] : ['pp','p','mp','mf']);
  rh[0].dyn = clampToDL(pickLeastUsed(_dynBand, opts.hist && opts.hist.dyn));

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
  // INTENSITY = melodic height + TEXTURE OPENNESS (the vertical span from the top melody note down to the lowest bass) +
  // harmonic tension. The span is what actually brings the LEFT HAND in: the sound swells as the hands SPREAD and eases as
  // they CLOSE IN, so a bar where the RH descends AND the LH rises (span shrinking) gets quieter, not louder (Matthew's
  // exact catch - the LH was computed but never used). Height alone was the old melody-only reading; the span generalises it.
  const energy = b => { const hi=rhHi[b]??72, lo=(lhLo[b]!=null?lhLo[b]:hi-12); return hi + (hi-lo)*0.35 + (HTEN[prog[b]] ?? 1)*3; };
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
  // edges (energy rises then falls); an energy-flat phrase is left plain. HOW MUCH arc is needed scales with the
  // character's expressive tendency (character.hair - its only consumer, wiring in a param that was DEAD): an expressive
  // character shapes even a gentle arc, a plain one only a pronounced one. A strong arc always clears the bar for ANY
  // character, so nothing is ruled out - hair sets sensitivity, never a veto.
  const arcNeed = 2 + (1 - character.hair) * 3;   // ~2.45 (expressive, hair 0.85) .. ~3.8 (plain, hair 0.4)
  const phraseArc = (lo,hi) => { if(hi<=lo) return false; let mx=lo; for(let b=lo;b<=hi;b++) if(energy(b)>energy(mx)) mx=b; return energy(mx) - Math.min(energy(lo),energy(hi)) >= arcNeed; };

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
  // staccato marks the character's recurring, playably-detachable short-note figure. Its genuine precondition is the
  // character's ARTICULATION: a DETACHED or MIXED character points the figure up staccato; a LEGATO character (a waltz, a
  // cantabile) plays its line legato and does not. The recurring-figure test below (groups) is the other real precondition
  // - a piece with no such run has nothing to dot. So the device fires for any non-legato character that HAS a crisp
  // recurring run - a brisk scherzo, but equally a MIXED flowing/grand/minuet/dance that points up a short figure. Only a
  // genuinely LEGATO line is excluded. (The old character.stac>=0.5 floor wrongly silenced the MIXED flowing/grand/minuet.)
  if(nbars>=4 && prof!=='legato'){   // a LEGATO character (cantabile/singing/lyrical/waltz) sings its line - it does NOT dot a recurring figure staccato, it slurs (below). The earlier "self-limiting" assumption was FALSE: a legato line DOES have staccatable quaver pairs, so without this guard ~half of all cantabile pieces got portato that contradicts their character (Matthew's audit). A MIXED character (flowing/grand/minuet/dance) still points its figure - the loop breaks its slurs at the staccato bars so the two never contradict. Only the pure-legato line is excluded, matching the character a composer set
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
    let _st=0; const _posOf=rh.map(n=>{ const p=((_st%barU)+barU)%barU; _st+=n.d; return p; });   // each note's position within the bar
    const _onBeat=p=>Math.abs(p%beatLen)<1e-6;
    for(let i=0;i<rh.length-1;i++){ const a=rh[i], b=rh[i+1];
      if(a.rest||b.rest||Array.isArray(a.m)||Array.isArray(b.m)||a.slur||b.slur||a.art||b.art) continue;   // never slur a STACCATO note - a slurred staccato is a contradictory articulation (Matthew's ex2 A-G#)
      const step=a.m-b.m;
      // a sigh is an appoggiatura-like LEAN: the first note carries the weight and resolves DOWN a step onto a weaker
      // note. It reads as a sigh when that first note actually bears the stress - it lands ON a beat and resolves OFF it,
      // or it is agogically LONGER than its resolution. A step off a weak note onto a strong one is not a sigh. Read from
      // the notes' metre and duration, not a die.
      const lean = (_onBeat(_posOf[i]) && !_onBeat(_posOf[i+1])) || a.d > b.d;
      if(step>=1 && step<=2 && lean){ a.slur='('; b.slur=')'; i++; } }   // a stressed descending step -> a sigh
  } else {
    // Slur the actual PHRASE units (antecedent / consequent) instead of a bar-count template — the seam at `half` is a
    // real boundary a slur must not straddle, and a slur marks a real phrase, not a template. Each range is then broken
    // at staccato bars / rests by the loop below.
    const phrases = half<nbars ? [[0,half-1],[half,nbars-1]] : [[0,nbars-1]];
    // a phrase SINGS when its melody is predominantly conjunct (stepwise, steps <=2 semitones) - the essence of a legato
    // line that a slur marks; a disjunct, leapy phrase is not a legato gesture.
    const singing = ([a,b]) => { const idxs=idxInBars(a,b).filter(i=>!rh[i].rest && !Array.isArray(rh[i].m)); if(idxs.length<2) return false; let steps=0; for(let k=1;k<idxs.length;k++) if(Math.abs(rh[idxs[k]].m-rh[idxs[k-1]].m)<=2) steps++; return steps/(idxs.length-1) >= 0.6; };
    let chosen;
    if(prof==='legato') chosen = phrases;                                       // legato: sing each phrase as one line
    else chosen = phrases.filter(singing);                                      // plain AND light: slur only the phrases that actually SING (predominantly stepwise). A detached/light character is not slur-FREE - it too has stepwise legato gestures amid its crisp material, and those sing; the loop below then BREAKS every slur at the staccato bars, so a slur never contradicts the detached articulation - it only marks the genuine conjunct stretches between them. Blanket-emptying ruled out a real gesture.
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
  if(gp.expression.accent){   // accents ← grade params (ABRSM: from grade 1). Character sets HOW OFTEN + how strong a standout is needed - never a binary floor: even a cantabile can lean on ONE genuine standout (a big leap, a syncopation, a chromatic).
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
    // how STRONG a standout is required scales with the character: an accented character marks any genuine standout (>=2.4),
    // a low-accent/lyrical one only its clearest, strongest one (>=3.2 - a big leap+, a syncopation+, a chromatic+). So a
    // cantabile still CAN accent, but only its single most emphatic moment - frequency+strength scale, nothing is ruled out.
    const need = character.accent>=0.35 ? 2.4 : 3.2;
    const cand=rh.map((n,i)=>({i,s:score(n,i)})).filter(x=>x.s>=need && !rh[x.i].art && !rh[x.i].slur && !phraseOpen.has(x.i));
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
      // A tenuto = hold the note its FULL value - the OPPOSITE of a staccato. Its clearest, most necessary cause is a
      // full-length note among/after STACCATO: the mark that says "this one is not short". Those EMERGE wherever staccato
      // precedes a full note (self-limiting to detached passages - a legato line is already full-length, so the mark is
      // redundant there), and are marked where they occur. A note ALSO takes a tenuto for agogic STRESS - a peak, the
      // cadential broadening, a suspension's lean - which is the composer's occasional emphasis. Both emerge from the
      // actual notes + articulation, never a character mood (indeed the length use lives in the DETACHED styles).
      const lengthTen = elig.filter(afterStac);
      if(lengthTen.length){ lengthTen.forEach(i => rh[i].art='--'); }         // length clarification after staccato - marked where it occurs (all of them; a real, reasoned use)
      else {
        // otherwise the only note that genuinely DEMANDS an agogic tenuto is a SUSPENSION - the prepared dissonance is
        // leaned on and held its full value, and the tenuto names that lean. A bare peak or a generic cadential note does
        // not demand the mark (the cadence's length is already carried by its note values / the fermata), so it is not
        // forced - no die. Where a suspension exists it is marked; the rate falls out of how often a suspension occurs.
        const susp = elig.find(suspension);
        if(susp!=null) rh[susp].art='--';
      }
    }
    // FERMATA — a structural PAUSE. Usually the final chord; occasionally a caesura at the end of the ANTECEDENT
    // phrase (the half-cadence). NOT restricted to the final note (Matthew). Anywhere mid-phrase would break the flow.
    // FERMATA - crowns an ending that genuinely DWELLS, reasoned from the ACTUAL closing gesture, not a die. A fermata is
    // warranted when the final note is BROAD (holds much of its bar) at an unhurried tempo: a sustained close invites the
    // hold; a brisk tail does not. The character's expressive-repose tendency (character.ferm - its consumer here) sets
    // HOW broad the close must be to earn it - an expressive character crowns even a moderately-broad close, a plain one
    // needs a near-whole-bar hold. A whole-bar close always clears the bar for ANY character, so nothing is ruled out.
    // (spd!=='fast' is the hard tempo precondition - a fast piece ends in tempo.) Reads the real ending; varies per piece.
    const _finalMel = [...rh].reverse().find(n=>!n.rest);
    const _closeBroad = _finalMel ? _finalMel.d / barU : 0;                 // fraction of its bar the final note holds
    if(gp.expression.fermata && _closeBroad >= 0.75 - character.ferm + (spd==='fast'?0.15:0)){   // a fast piece CAN crown a held final chord with a fermata (was vetoed = a cut); tempo just RAISES the broadness needed (a lean), it doesn't forbid it - the broad final note is the real precondition
      // WHERE it lands is structural: at the antecedent's half-cadence seam when the piece has one (a real breath before
      // the answer), otherwise capping the final note (the closing repose). Both are legitimate fermata places.
      if(half>0 && half<nbars && (midType==='HC'||midType==='IAC') && character.ferm>=0.15 && spd!=='fast'){    // caesura at a genuine phrase seam that CLOSES (a real half/imperfect cadence) - never over a `continuous` seam the piece flows through. A mid-piece PAUSE is an EXPRESSIVE-REPOSE gesture (character.ferm: singing/lyricalslow/grand) at an unhurried tempo - a composer breathes before the answer in a cantabile, NOT in a light dance/scherzo/march (ferm<=0.1) or a driving fast piece, which carry momentum through to the end. Those take only the final-note fermata (the else)
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
  // needed, and a mark is printed on the first note of each new position. Fingering marks are needed once the piece
  // leaves five-finger position - i.e. `wide` (gp.range.fixedPosition), the grade constraint, not an inline grade number.
  if(wide){
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

  // CONSTRUCTION INVARIANT (grade canvas): each MELODY bar sums to the metre. A development (sequence/appoggiatura/breath)
  // can occasionally leave a bar short or long - the beats-off fault, a BUG not a preference (a composer's bar always fills its
  // metre). Hold the last note to the barline if short; trim from the end if long. Uses n.bar, still present here (pre-strip).
  { const byBar={}; rh.forEach((n,i)=>{ (byBar[n.bar]=byBar[n.bar]||[]).push(i); });
    for(const k of Object.keys(byBar)){ const idxs=byBar[k]; let sum=0; for(const i of idxs) sum+=rh[i].d;
      if(sum < barU-1e-9){ rh[idxs[idxs.length-1]].d += barU-sum; }
      else if(sum > barU+1e-9){ let over=sum-barU;
        for(let j=idxs.length-1;j>=0 && over>1e-9;j--){ const nn=rh[idxs[j]]; if(nn.d>over+1e-9){ nn.d-=over; over=0; } else { over-=nn.d; nn._del=true; } } } }
    for(let i=rh.length-1;i>=0;i--) if(rh[i]._del) rh.splice(i,1);
  }
  rh.forEach(n=>delete n.bar);   // strip internal phrase marker

  // ANACRUSIS (simple time): an upbeat leads into bar 1. The engine fully supports ex.partial (validate measures each
  // hand as sum-minus-partial; toLily emits \partial). The accompaniment RESTS on the upbeat, so the unaccompanied pickup
  // carries any diatonic lead-in with no harmony to clash against. Grade gate = the syllabus admits an anacrusis from
  // grade 4 (gp.rhythmDevices.anacrusis, a [P] value), read from the grade layer - not an inline grade number.
  let partial = 0;
  // WHETHER a phrase begins with an upbeat is a per-piece RHYTHMIC-SHAPE identity - a composer conceives the phrase as
  // starting on the downbeat or leading in - not something the later notes decide and not a die. So it is a COLLECTION-
  // DIVERSITY choice: about a third of the book leads in with an anacrusis, spread evenly (least-used); standalone = free.
  // WHETHER a phrase leads in with an upbeat: the anacrusis is a LIFT into the downbeat, and that lift IS the defining
  // gesture of a lilting DANCE (a waltz/minuet/6-8 dance steps up into beat 1). So a lilt character leans toward it; every
  // other character can still lead in (many phrases do), just less habitually - so nothing is excluded, the lilt's lift
  // simply emerges from its own character while diversity spreads the rest. (Was a flat book-diversity coin for all.)
  const anacPool = (character.feel==='lilt') ? ['anacrusis','anacrusis','downbeat'] : ['anacrusis','downbeat','downbeat'];
  const wantAnac = pickLeastUsed(anacPool, opts.hist && opts.hist.anac) === 'anacrusis';
  if((gp.rhythmDevices && gp.rhythmDevices.anacrusis) && !compound && !Array.isArray(rh[0].m) && wantAnac){
    const P = rh[0].d < 1-1e-9 ? 0.5 : 1;                     // the upbeat matches the opening SURFACE: a quaver pickup for a quaver-paced start, else a one-beat (crotchet) upbeat
    const downIdx = degOf(rh[0].m);                           // window index of the bar-1 downbeat (melody)
    if(downIdx!=null && downIdx>=0){
      let upIdx = clamp(downIdx>=2 ? downIdx-1 : downIdx+1, span);   // the smoothest lead-in: a STEP into the downbeat (toward the centre of the window), the most idiomatic anacrusis - not a random step-or-3rd
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
  // ── GRADE HAND-RANGE CLAMP ────────────────────────────────────────────────────────────
  // Cap the accompaniment's TOTAL tessitura to the grade's hand span (gp.range.span). Only the per-chord REACH (an octave)
  // and hand collisions were bounded above - nothing held the whole LH within the grade's range, so a bar of moving voice-
  // implied harmony that steps its bass up, then the next plain bar dropping back to the root, can leave the lowest and
  // highest LH notes more than the grade's span apart (Matthew's "step, jump, step, and it falls out of the 15"). The motion
  // itself is fine; it just needs reining into range. Fold whichever extreme note sits farthest from the centre inward by an
  // octave until the hand fits - octave folds keep every pitch class, so the harmony is untouched, only the register narrows.
  // Fixed-position grades are already boxed into five fingers, so this is a wide-grade (G3+) clamp.
  if(!gp.range.fixedPosition){
    let guard=0;
    while(guard++<24){
      const all=lh.filter(n=>!n.rest&&n.m!=null).flatMap(n=>Array.isArray(n.m)?n.m:[n.m]);
      if(all.length<2) break;
      const lo=Math.min(...all), hi=Math.max(...all); if(hi-lo <= gp.range.span) break;
      const mid=(lo+hi)/2, foldHi=(hi-mid)>=(mid-lo);                 // fold the farther extreme inward
      for(const n of lh){ if(n.rest||n.m==null) continue;
        const arr=Array.isArray(n.m)?n.m:[n.m]; let ch=false;
        for(let k=0;k<arr.length;k++){ if(foldHi && arr[k]===hi){ arr[k]-=12; ch=true; } else if(!foldHi && arr[k]===lo){ arr[k]+=12; ch=true; } }
        if(ch){ const dd=[...new Set(arr)].sort((a,b)=>a-b); n.m=dd.length>1?dd:dd[0]; } }
    }
  }
  // EXACT BASS REPEAT RULE (the melody's rule, mirrored for the bass): the bass never DEAD-REPEATS a single pitch 3+ times.
  // Two identical attacks (an oom-pah pulse / brief pedal) are fine; a THIRD is the passive default a composer would not
  // write, so it MOVES to another in-box chord tone of the bar - the alternating-bass instinct - avoiding an exposed 6/4
  // (never the 5th on a downbeat). Struck chords and genuine repeated-note figures are not bare single-note runs, so they
  // stay untouched; the moved note is always a real chord tone, so no possibility is cut - only the dead hammer is broken.
  if(gp.range.fixedPosition && process.env.NOVHARM){   // OLD bar-chord repeat-breaker: moved a repeated note to a prog[bar] tone, reverting per-beat movement. Off under the per-beat engine.
    let _at=0; const _evT=lh.map(n=>{ const t=_at; _at+=n.d; return t; });
    // walk the SOUNDING bass notes (rests skipped - a skip-bass "do rest do rest do" is three consecutive dos, not broken
    // by the rests between them); a run of 3+ identical single notes gets its 3rd+ moved to another in-box chord tone.
    let _prevM=null, _run=1;
    for(let i=0;i<lh.length;i++){ const a=lh[i];
      if(a.rest || a.m==null || Array.isArray(a.m)){ _prevM=Array.isArray(a.m)?null:_prevM; if(Array.isArray(a.m))_prevM=null; continue; }
      if(a.m===_prevM) _run++; else { _run=1; _prevM=a.m; continue; }
      if(_run<3){ _prevM=a.m; continue; }
      const bar=Math.min(Math.floor(_evT[i]/barU+1e-9), prog.length-1); const cd=CHORD_DEG[mode][prog[bar]];
      if(!cd){ _prevM=a.m; continue; }
      const onDown=Math.abs(_evT[i]-bar*barU)<1e-9, fifthDg=cd[2]!=null?(((cd[2]%7)+7)%7):-1;
      const cands=[...new Set(cd.map(d=>(((d%7)+7)%7)).filter(inBox))].map(d=>({d,pit:boxPitch(d)}))
        .filter(o=>o.pit!==a.m && !(onDown && o.d===fifthDg));
      if(cands.length){ cands.sort((x,y)=>Math.abs(x.pit-a.m)-Math.abs(y.pit-a.m)); a.m=cands[0].pit; _run=1; _prevM=a.m; }
      else _prevM=a.m;
    }
  }
  // HARMONIC CLAMP - voice the accompaniment AGAINST the melody so a fault is never CONSTRUCTED (no re-roll). Parallel
  // 5ths/8ves are not "illegal"; a composer avoids them because they COLLAPSE the independence of two voices - the bass
  // stops being its own line and becomes a doubling of the tune. So this only applies where the LH is an INDEPENDENT
  // support (a fixed-position grade has no doubling texture), and where a real IN-POSITION CHORD TONE can break the
  // parallel while staying below the tune; if none can, we leave it - a composer takes an occasional parallel over a
  // wrong note. A DELIBERATE doubling texture (grade 3+ tenths/octaves) WANTS the parallel motion and is untouched.
  if(!swap && gp.range.fixedPosition && process.env.NOVHARM){   // OLD bar-chord harmonic clamp: broke parallels by re-voicing to prog[bar] tones, which REVERTED a mid-bar chord change (strike's IV tone shoved back to a I tone). Off under the per-beat engine; parallels get handled per-beat instead.
    const lo1=m=>Array.isArray(m)?Math.min(...m):m, hi1=m=>Array.isArray(m)?Math.max(...m):m, PF=x=>x===0||x===7;
    const chordTonesFor=bar=>{ const c=prog[bar]; if(!c||!CHORD_DEG[mode][c])return null; const dg=[...new Set(CHORD_DEG[mode][c].map(d=>((d%7)+7)%7).filter(inBox))]; return dg.map(d=> gp.range.fixedPosition ? boxPitch(d) : accReg+off[d]); };
    // ONSET-EXACT, mirroring the parallelPerfects check: the outer voices are the melody-TOP and bass-BOTTOM sounding at
    // each onset across BOTH hands (a per-LH-note pass with the bar's HIGHEST melody note saw the wrong interval and missed
    // most parallels). Re-voice ONLY where the LH has its own attack at the onset - a held LH note is shared with the prior
    // onset, so changing it would just move the parallel. Break it with the nearest in-box chord tone that isn't the same
    // perfect; if none, leave it (a composer takes an occasional parallel over a wrong note).
    const RHt=[]; { let t=0; for(const n of rh){ RHt.push({t, top:n.rest?null:hi1(n.m)}); t+=n.d; } }
    const LHt=[]; { let t=0; for(const n of lh){ LHt.push({n, t0:+t.toFixed(6)}); t+=n.d; } }
    const topAt=t=>{ let c=null; for(const e of RHt){ if(e.t<=t+1e-9) c=e; else break; } return c?c.top:null; };
    const lhAt=t=>{ let c=null; for(const e of LHt){ if(e.t0<=t+1e-9) c=e; else break; } return c; };
    const times=[...new Set([...RHt.map(e=>e.t), ...LHt.map(e=>e.t0)].map(x=>+x.toFixed(6)))].sort((a,b)=>a-b);
    // Iterate to a FIXPOINT: re-voicing a bass to break one parallel can form a fresh one with the NEXT onset. A few
    // forward passes settle it; each move is only non-chord -> chord-tone-that-breaks-a-parallel, so it converges.
    for(let pass=0; pass<3; pass++){ let moved=false;
      let pTop=null, pBot=null;
      for(const t of times){
        const top=topAt(t), le=lhAt(t);
        if(top==null || !le || le.n.rest || le.n.m==null){ pTop=null; pBot=null; continue; }
        let bot=lo1(le.n.m);
        if(pTop!=null && pBot!=null){
          const iC=(((top-bot)%12)+12)%12, iP=(((pTop-pBot)%12)+12)%12;
          if(PF(iC)&&iC===iP&&(top-pTop)!==0&&(bot-pBot)!==0&&Math.sign(top-pTop)===Math.sign(bot-pBot)
             && Math.abs(le.t0-t)<1e-6){                                          // only where THIS LH note attacks at the onset
            const cts=chordTonesFor(Math.floor(t/barU+1e-9));
            if(cts){ const alt=cts.filter(p=>p<top&&p!==bot).map(p=>({p,i:(((top-p)%12)+12)%12,d:Math.abs(p-bot)}))
                          .filter(o=>!(PF(o.i)&&o.i===iP)).sort((x,y)=>x.d-y.d)[0];
              if(alt){ const a=le.n; if(Array.isArray(a.m)){ const oth=a.m.filter(x=>x!==bot); a.m=[...new Set([alt.p,...oth])].sort((x,y)=>x-y); if(a.m.length===1)a.m=a.m[0]; } else a.m=alt.p; bot=lo1(a.m); moved=true; } }
          }
        }
        pTop=top; pBot=bot;
      }
      if(!moved) break;
    }
  }
  // SWAP sibling of the harmonic clamp: the accompaniment is ABOVE the tune (it becomes ex.rh, the melody ex.lh), so the
  // outer voices are the accomp-TOP (lh) and melody-BOTTOM (rh) - the mirror of the non-swap clamp. Break an outer parallel
  // by re-voicing the accomp's TOP note to the nearest IN-BOX chord tone ABOVE the melody that isn't the same perfect;
  // only where the accomp attacks; iterate to a fixpoint. Now that the boxes are register-separated, an in-box tone is
  // always clear of the tune, so this never re-introduces a collision.
  if(swap && gp.range.fixedPosition && process.env.NOVHARM){   // OLD bar-chord harmonic clamp (swap sibling): same bar-chord reversion. Off under the per-beat engine.
    const lo1=m=>Array.isArray(m)?Math.min(...m):m, hi1=m=>Array.isArray(m)?Math.max(...m):m, PF=x=>x===0||x===7;
    const chordTonesFor=bar=>{ const c=prog[bar]; if(!c||!CHORD_DEG[mode][c])return null; const dg=[...new Set(CHORD_DEG[mode][c].map(d=>((d%7)+7)%7).filter(inBox))]; return dg.map(d=>boxPitch(d)); };
    const MELt=[]; { let t=0; for(const n of rh){ MELt.push({t, bot:n.rest?null:lo1(n.m)}); t+=n.d; } }
    const ACCt=[]; { let t=0; for(const n of lh){ ACCt.push({n, t0:+t.toFixed(6)}); t+=n.d; } }
    const botAt=t=>{ let c=null; for(const e of MELt){ if(e.t<=t+1e-9) c=e; else break; } return c?c.bot:null; };
    const accAt=t=>{ let c=null; for(const e of ACCt){ if(e.t0<=t+1e-9) c=e; else break; } return c; };
    const times=[...new Set([...MELt.map(e=>e.t), ...ACCt.map(e=>e.t0)].map(x=>+x.toFixed(6)))].sort((a,b)=>a-b);
    for(let pass=0; pass<3; pass++){ let moved=false;
      let pTop=null, pBot=null;
      for(const t of times){
        const bot=botAt(t), ae=accAt(t);
        if(bot==null || !ae || ae.n.rest || ae.n.m==null){ pTop=null; pBot=null; continue; }
        let top=hi1(ae.n.m);
        if(pTop!=null && pBot!=null){
          const iC=(((top-bot)%12)+12)%12, iP=(((pTop-pBot)%12)+12)%12;
          if(PF(iC)&&iC===iP&&(top-pTop)!==0&&(bot-pBot)!==0&&Math.sign(top-pTop)===Math.sign(bot-pBot)
             && Math.abs(ae.t0-t)<1e-6){
            const cts=chordTonesFor(Math.floor(t/barU+1e-9));
            if(cts){ const alt=cts.filter(p=>p>bot&&p!==top).map(p=>({p,i:(((p-bot)%12)+12)%12,d:Math.abs(p-top)}))
                          .filter(o=>!(PF(o.i)&&o.i===iP)).sort((x,y)=>x.d-y.d)[0];
              if(alt){ const a=ae.n; if(Array.isArray(a.m)){ const oth=a.m.filter(x=>x!==top); a.m=[...new Set([...oth,alt.p])].sort((x,y)=>x-y); if(a.m.length===1)a.m=a.m[0]; } else a.m=alt.p; top=hi1(a.m); moved=true; } }
          }
        }
        pTop=top; pBot=bot;
      }
      if(!moved) break;
    }
  }
  // FINAL accompaniment repeated-note breaker — runs AFTER both voice-leading clamps, because a clamp that re-voices a note
  // to break a parallel can re-collapse it onto its neighbour and re-create a dead repeat the earlier rule already fixed
  // (Matthew's exercise-6: three Es in the swap accompaniment survived because the swap clamp ran after the repeat rule).
  // ON TOP (swap) a re-attacked note competes with the tune, so this matters most there. A THIRD identical attack moves to
  // another in-box chord tone of the bar (root/3rd preferred, never a 6/4 on the downbeat) — a real chord tone, so nothing
  // is cut, only the dead hammer broken. Two attacks (an oom pulse / brief pedal) stay. Applies to the accompaniment (`lh`
  // internally, for swap too); the melody keeps its own repeated-note reasoning.
  if(gp.range.fixedPosition && process.env.NOVHARM){   // OLD final bar-chord repeated-note breaker: moved a 3rd repeat to a prog[bar] tone, reverting movement. Off under the per-beat engine.
    let _rt=0; const _rTs=lh.map(n=>{ const t=_rt; _rt+=n.d; return t; });
    let _pm=null, _rn=1;
    for(let i=0;i<lh.length;i++){ const a=lh[i];
      if(a.rest || a.m==null || Array.isArray(a.m)){ _pm=null; _rn=1; continue; }
      if(a.m===_pm) _rn++; else { _rn=1; _pm=a.m; continue; }
      if(_rn<3){ _pm=a.m; continue; }
      const bar=Math.min(Math.floor(_rTs[i]/barU+1e-9), prog.length-1); const cd=CHORD_DEG[mode][prog[bar]];
      if(!cd){ _pm=a.m; continue; }
      const onDown=Math.abs(_rTs[i]-bar*barU)<1e-9, fifthDg=cd[2]!=null?(((cd[2]%7)+7)%7):-1;
      const cands=[...new Set(cd.map(d=>(((d%7)+7)%7)).filter(inBox))].map(d=>({d,pit:boxPitch(d)}))
        .filter(o=>o.pit!==a.m && !(onDown && o.d===fifthDg));
      if(cands.length){ cands.sort((x,y)=>Math.abs(x.pit-a.m)-Math.abs(y.pit-a.m)); a.m=cands[0].pit; _rn=1; _pm=a.m; }
      else _pm=a.m;
    }
  }
  // ===== TWO-VOICE HARMONY (flagged, standalone): rebuild the LH as a second voice written AGAINST
  // the finished tune — emergent + placed harmony toward the structural progression (prog). Nothing
  // from the old accompaniment survives (lh is replaced here, after every old pass). Reuses the
  // existing melody; grade sets the box (accReg/_accLo/span). See two-voice.mjs / sr-harmony-model-COMPLETE.
  if(!process.env.NOTWOVOICE){   // the accompaniment-as-intentions engine (accompaniment.mjs) is now the DEFAULT path; set NOTWOVOICE=1 to fall back to the old in-generator accompaniment
    const offD = k => { k=Math.round(k); return off[((k%7)+7)%7] + 12*Math.floor(k/7); };
    const p2d = p => { let s=p-rhTonic, oct=Math.floor(s/12), w=s-12*oct;
      let d=off.indexOf(w); if(d<0) d=off.reduce((bi,v,i)=>Math.abs(off[i]-w)<Math.abs(off[bi]-w)?i:bi,0); return d+7*oct; };
    const d2p = d => rhTonic + offD(d);
    const structRootOf=b=>CHm[prog[b]]?((CHm[prog[b]].b%7)+7)%7:0;
    const nextRootOf=b=> b+1<nbars ? structRootOf(b+1) : structRootOf(b);
    // the accompaniment's pitch RANGE, in degrees. FIXED-POSITION grades (grade 2) use the five-finger boxPitch mapping. WIDER
    // grades (3+, incl. all swap) are NOT confined to one hand position - so use the real register span (an octave), NOT
    // boxPitch, whose mod-7 fold makes _accLo+span (an octave) wrap back to _accLo and collapse the box to a single note
    // (the swap "falls onto Cs" pedal - the accompaniment literally had one pitch to play). Give it the whole octave to work in.
    const bTop = gp.range.fixedPosition ? p2d(boxPitch(_accLo+span)) : p2d(accReg + offAt(span));
    const bBot = gp.range.fixedPosition ? p2d(boxPitch(_accLo))      : p2d(accReg + offAt(0));
    let lo=Math.min(bBot,bTop), hi=Math.max(bBot,bTop);
    // PLACE the accompaniment's register on its own side of the tune (left hand under right - a keyboard-layout choice, not a
    // note clamp): shift the whole octave box by OCTAVES until it CLEARS the tune entirely - the whole box ABOVE the tune's
    // highest note (swap) / BELOW its lowest (normal). The hands then occupy separate registers, so the accompaniment has its
    // full octave to move in AND cannot cross - a texture choice, not a note-level ban (the chooser still forbids nothing).
    { const md=rh.filter(n=>!(n.rest||n.m==null)).map(n=>p2d(Array.isArray(n.m)?n.m[0]:n.m));
      if(md.length){ const mn=Math.min(...md), mx=Math.max(...md);
        // SWAP places the accompaniment ABOVE the low melody. Clearing the melody's ABSOLUTE peak bumps the whole octave box
        // up a full octave whenever ONE melody note pokes into its base register - which lands the accompaniment an octave too
        // high (up near C6) with a hollow empty middle. A composer sits the accompaniment just above the melody's BODY and
        // lets the occasional melodic peak interlock with its low end (a close melody-in-the-bass texture). So clear the tune's
        // 90th-percentile note, not its single highest - the box stays as low as the tune's main range allows, filling the
        // middle. The chooser still forbids no note; handCrossing stays a checked fault, so genuine collisions still show.
        const sorted=[...md].sort((a,b)=>a-b); const bodyTop=sorted[Math.floor(sorted.length*0.9)];
        // SWAP: sit the accompaniment box a third ABOVE the tune's body (its 90th-percentile note), with its own octave of
        // room above - a CLOSE melody-in-the-bass texture that fills the middle, not the octave-granular jump that stranded it
        // up near C6 over a hollow gap. Placed directly (the box only sets the register window; the chooser voices chord tones
        // within it), so it tracks just above the tune instead of leaping a whole octave. The tune's rare peak (top 10%) may
        // interlock with the box's low end - which is how a composer writes it - and a genuine collision is still a checked fault.
        if(swap){ lo = bodyTop + 3; hi = lo + 7; }
        else    { let g=0; while(hi>=mn && g<6){ lo-=7; hi-=7; g++; } } } }   // non-swap (working, unchanged): the LH clears BELOW the tune's lowest note by octaves
    const nbeatsBarLoc=Math.max(1,Math.round(barU/beatLen));
    const melAt = tw => { let t=0; for(const n of rh){ if(!(n.rest||n.m==null) && tw>=t-1e-9 && tw<t+n.d-1e-9) return p2d(Array.isArray(n.m)?n.m[0]:n.m); t+=n.d; } return null; };
    // BY TIME, not n.bar: the melody notes don't carry a bar field here, so key the bar off cumulative onset time (matching melAt).
    // (Keying on n.bar returned EMPTY for every bar, silently starving tuneOf/busyOf - which killed the tune-quoting textures and
    // made `busy` always false. Onset time is the same timeline melAt uses, so this is consistent with the rest of accompany.)
    const tuneOf=b=>{ const o=[]; let t=0; for(const n of rh){ if(!(n.rest||n.m==null) && Math.floor((t+1e-9)/barU)===b) o.push({deg:p2d(Array.isArray(n.m)?n.m[0]:n.m),dur:n.d}); t+=n.d; } return o; };
    const busyOf=b=>{ let c=0,t=0; for(const n of rh){ if(!(n.rest||n.m==null) && Math.floor((t+1e-9)/barU)===b) c++; t+=n.d; } return c > nbeatsBarLoc; };
    const cadenceOf=b=> b===half-1 || b===nbars-1;
    // the accompaniment as a sequence of leaned, shifting INTENTIONS (accompaniment.mjs), over a harmony that
    // MOVES through each bar (derived from the tune). The palette + weighting decide what each bar is TRYING to do.
    const _melTL=[]; { let _t=0; for(const n of rh){ _melTL.push({ t:_t, end:_t+n.d, rest:!!n.rest }); _t+=n.d; } }   // the tune's note/rest timeline, so the accompaniment can BREATHE with it (hands written together)
    const acc=accompany({ nbars, barU, beatLen, mode, dir: swap?1:-1, lo, hi, chordMax: Math.max(1, gp.chordMax),
                          structRootOf, nextRootOf, melAt, tuneOf, busyOf, active: motifPersist>=0.55, cadenceOf, mel:_melTL,
                          fixedPosition: gp.range.fixedPosition, rnd:()=>Math.random() });
    lh.length=0;
    for(const n of acc){ if(n.rest){ lh.push({rest:true,d:n.dur}); continue; }
      const m = Array.isArray(n.deg) ? [...new Set(n.deg.map(d2p))].sort((a,b)=>a-b) : d2p(n.deg);
      const o={ m: Array.isArray(m)&&m.length===1?m[0]:m, d:n.dur }; if(n.ti) o.ti=1; lh.push(o); }
  }
  // starting fingers, computed from the actual hand positions (the melody's window + the accomp's tonic box). The finger on
  // the first note is that note's POSITION within the five-finger window (index 0 = thumb). It MUST read the ACTUAL first
  // melody note, not strong[0] (bar 0's contour target): the SEED now sets bar 0's opening note independently (low/mid/high
  // of the triad), so anchoring the finger to strong[0] mislabels it (the exercise-9 "finger 1 on a note that's finger 4").
  const _fm = rh.find(n=>!n.rest && n.m!=null);
  const _fmi = _fm ? degOf(Array.isArray(_fm.m)?Math.min(..._fm.m):_fm.m) : strong[0];
  const mStart=clamp(Number.isFinite(_fmi) && _fmi>=0 ? _fmi : strong[0], 4);
  const melodyFing = swap ? 5-mStart : mStart+1;       // RH melody: thumb on the bottom; LH melody: pinky on the bottom
  const accompFing = swap ? 1 : 5;                     // accomp opens on the I-chord root (bottom of its box)
  // CHORD-SIZE clamp (grade param, enforced ONCE for the one renderer): no note may exceed gp.chordMax voices. At a
  // FIXED-POSITION grade keep the LOWEST voices (the bass line stays, five-finger-legal); otherwise keep the top. This
  // lets the shared figures/voicings render legally at every grade - the grade-breaking chord-size limit lives in
  // grade-params, applied here rather than forked per grade. (grade 2 chordMax 1 -> single notes; grade 3+ mostly no-op.)
  const _clampChord = arr => { for(const n of arr){ if(!n.rest && Array.isArray(n.m) && n.m.length>gp.chordMax){
    const s=[...n.m].sort((a,b)=>a-b); n.m = gp.range.fixedPosition ? s.slice(0,gp.chordMax) : s.slice(-gp.chordMax);
    if(n.m.length===1) n.m=n.m[0]; } } };
  _clampChord(rh); _clampChord(lh);
  // CAPABILITY CLAMP for a FIXED-POSITION grade: each hand is INCAPABLE of leaving its five-finger position. (Matthew: a
  // grade PARAMETER must CLAMP capability, not FILTER after the fact - grade 2 must be UNABLE to exceed five fingers, not
  // produce wide hands that validate throws away, which was both the slowness and the leak.) Measured in the position's
  // own unit - SCALE-DEGREES: fold each note by octaves (=7 degrees) so its degree sits inside the hand's 5-degree window
  // [loDeg, loDeg+span]. An octave-displaced tone (a struck voice lifted an octave, etc.) returns to the hand; a note
  // whose BASE degree simply isn't one of the five (a genuinely foreign note for that position) can't be folded in and is
  // left for the harmony checks. The MELODY hand's window is winLo (mnote); the ACCOMPANIMENT hand's is the tonic position [0].
  // Fold an octave-displaced ACCOMPANIMENT tone back onto its position pitch (by pitch-class), so a struck/figure voice
  // lifted an octave returns to the hand. The accompaniment sits in the tonic five-finger position (accReg + off[0..span]).
  // A note whose pitch-class is not one of the five position tones (a genuinely foreign note) is left for the harmony checks.
  // The ACCOMPANIMENT is always built into `lh` at accReg (even for a swap piece - the swap only re-assigns lh->treble
  // staff at the end), so the fold applies uniformly. The MELODY (`rh`) is window-clamped by mnote. (My earlier swap
  // attempt folded `rh` = the melody, which is why it regressed.)
  if(gp.range.fixedPosition){
    const posByPC={}; for(let i=0; i<=span; i++){ const q=boxPitch(_accLo+i), pc=((q%12)+12)%12; if(posByPC[pc]==null) posByPC[pc]=q; }
    const fold = p => { const pc=(((p%12)+12)%12); return posByPC[pc]!=null ? posByPC[pc] : p; };
    for(const n of lh){ if(n.rest) continue;
      if(Array.isArray(n.m)){ const u=[...new Set(n.m.map(fold))].sort((a,b)=>a-b); n.m = u.length===1?u[0]:u; }
      else n.m = fold(n.m); }
  }
  // (Hand-coordination breath removed: folded into accompany() - the accompaniment engine is handed the tune's note/rest
  // timeline and breathes WITH it there, so the reasoned output already coordinates the hands. No post-hoc edit of lh.)
  // OPENING GROUNDING (bar 0, non-swap): a composer STATES the tonic at the very start - but in at LEAST ONE voice, not
  // necessarily the bass. So this is a PREFERENCE, not a wall: if the MELODY already opens on the tonic root, the key is
  // heard and the bass is free to sit on the 3rd/5th (a fuller, non-doubled opening a composer often writes) - the inversion
  // opening survives there. Only when NEITHER voice states the root is the opening genuinely ambiguous (reads iii/vi); THEN
  // ground the bass - drop bar 0's first (lowest) note to the nearest tonic root at/below it, so at least one voice names the
  // home chord. The mirror of the final resolution, reasoned per piece from whether the tune already grounds the key.
  if(!swap && /^[iI]$/.test(prog[0]||'')){
    const tpc=(((rhT%12)+12)%12);
    const mf=rh.find(x=>!x.rest && x.m!=null);
    const melGroundsKey = mf && (((((Array.isArray(mf.m)?mf.m[0]:mf.m))%12)+12)%12)===tpc;   // the tune opens on the tonic -> key already stated
    if(!melGroundsKey){
      const ground = p => { const pc=(((p%12)+12)%12); return pc===tpc ? p : p - (((pc-tpc)+12)%12); };   // the tonic pitch at or below p
      const fi=lh.findIndex(n=>!n.rest && n.m!=null);
      if(fi>=0){ const n=lh[fi];
        if(Array.isArray(n.m)){ const s=[...n.m].sort((a,b)=>a-b); const g=ground(s[0]); if(g!==s[0]){ const u=[...new Set([g,...s.slice(1)])].sort((a,b)=>a-b); n.m=u.length===1?u[0]:u; } }
        else n.m=ground(n.m);
      }
    }
  }
  // HARMONIC MINOR IN THE COUNTER-LINE: a minor key borrows the leading tone for its DOMINANT - that raised ^7 is what makes
  // an authentic close in minor, and it belongs in the HARMONY (the dominant's third), not only the tune. The melodic pass
  // above raises ^7 in the melody; this mirrors it in the accompaniment so the rendered v sounds as the real V it is doing
  // the work of. A composer's reason, held as a strong LEAN, not a wall: only DOMINANT-function bars raise (a III/VI ^7 is a
  // natural chord tone and stays; a plagal iv-i close carries no dominant, so it stays modal - that IS the minority of
  // leading-tone-free minor closes a real book still teaches). Pitch-class based (fires in every octave); only the subtonic
  // ^7 in a dominant bar moves, by one semitone. The dominant triad holds no ^6, so no augmented 2nd is created.
  if(mode==='min'){
    const tonicPc=(((rhT%12)+12)%12);
    const raiseP = p => ((((p-tonicPc)%12)+12)%12===10) ? p+1 : p;
    const isDomBar = b => { const c=prog[b]; return !!c && ROOTDEG[c]===4; };   // v / V (root degree 4) = dominant function
    let _t=0;
    for(const n of lh){ const b=Math.floor((_t+1e-9)/barU); _t+=n.d; if(n.rest) continue;
      if(!isDomBar(b)) continue;
      if(Array.isArray(n.m)){ const u=[...new Set(n.m.map(raiseP))].sort((a,b)=>a-b); n.m=u.length===1?u[0]:u; }
      else n.m=raiseP(n.m); }
  }
  // AUGMENTED 2ND (minor): a natural ^6 adjacent to a RAISED ^7 spans an augmented 2nd - an awkward melodic interval a composer
  // essentially never writes at these grades (Tier A: near-never). It survives where the two hands' per-line harmonic-minor
  // spellings meet. Resolve by the three-minors rule: an ASCENDING ^6->^7 pair raises the ^6 to melodic minor (the gap closes
  // up to a M2); a DESCENDING ^7->^6 pair lowers the ^7 to natural (the leading tone was not resolving up, so it is a plain
  // subtonic here). Applied to BOTH hands, so no augmented 2nd remains - correct minor spelling, not a wall.
  if(mode==='min'){
    const tpc=(((rhT%12)+12)%12), _b6=(tpc+8)%12, _lt=(tpc+11)%12, _pc=x=>((x%12)+12)%12;
    for(const seq of [rh, lh]){
      for(let i=0;i+1<seq.length;i++){ const a=seq[i], bn=seq[i+1];
        if(a.rest||bn.rest||Array.isArray(a.m)||Array.isArray(bn.m)) continue;
        if(Math.abs(a.m-bn.m)!==3) continue;
        const pa=_pc(a.m), pb=_pc(bn.m);
        if(pa===_b6 && pb===_lt){ a.m+=1; a.alt='#'; }          // ascending ^6 -> ^7#: raise ^6 (melodic minor)
        else if(pa===_lt && pb===_b6){ a.m-=1; delete a.alt; }  // descending ^7# -> ^6: lower ^7 to natural
      }
    }
  }
  // TWO HANDS RECONCILED (leap-clash): the melody lands its leaps on chord tones of its own STRUCTURAL chord, but the bass
  // plays the DERIVED per-beat harmony - so each voice can be consonant with ITS OWN chord yet clash with the other on a beat.
  // Both hands now exist, so a composer revises: bend the LEAPT-TO melody note a diatonic STEP onto a tone that fits the bass
  // actually sounding. Only a leap ONTO a beat-dissonance is touched (a stepwise/off-beat non-chord tone is legitimate
  // figuration and left alone), and only the melody note that JUST attacked (safe to nudge). The line's leap survives, it just
  // lands a step over - the note-level negotiation the harmony model calls for, a revision, not a wall.
  {
    const TL=s=>{ let t=0,o=[]; for(const n of s){ o.push({m:n.m,rest:n.rest,t}); t+=n.d; } return o; };
    const RH=TL(rh), LHt=TL(lh);
    const sAt=(a,t)=>{ let ci=-1; for(let k=0;k<a.length;k++){ if(a[k].t<=t+1e-9) ci=k; else break; } return ci; };
    const hiOf=x=>Array.isArray(x)?Math.max(...x):x, loOf=x=>Array.isArray(x)?Math.min(...x):x;
    const dissPc=iv=>[1,2,11].includes((((iv)%12)+12)%12);
    const onsets=[...new Set([...RH,...LHt].map(n=>+n.t.toFixed(6)))].sort((a,b)=>a-b);
    for(const t of onsets){
      if(Math.abs(((t%beatLen)+beatLen)%beatLen)>1e-9) continue;                    // on a beat only
      const ri=sAt(RH,t), li=sAt(LHt,t); if(ri<0||li<0) continue;
      const rn=RH[ri], ln=LHt[li];
      if(rn.rest||ln.rest||rn.m==null||ln.m==null||Array.isArray(rn.m)) continue;    // melody is a single note
      if(rn.t!==t) continue;                                                         // only a melody note that JUST attacked (safe to revise)
      const mp=rn.m, ap=swap?hiOf(ln.m):loOf(ln.m);
      if(!dissPc(mp-ap)) continue;
      if(!(ri>0 && !RH[ri-1].rest && RH[ri-1].m!=null && Math.abs(mp-hiOf(RH[ri-1].m))>2)) continue;   // leapt in
      const oi=degOf(mp); if(oi<0) continue;
      let best=null,bd=99;
      for(const step of [1,-1,2,-2]){ const cand=mnote(clamp(oi+step,W)); if(cand!==mp && !dissPc(cand-ap) && Math.abs(step)<bd){ bd=Math.abs(step); best=cand; } }
      if(best!=null) rh[ri].m=best;
    }
  }
  // GRADE CANVAS - CLEAN NOTATION BY CONSTRUCTION: a note's duration must be a real, readable value and a sub-beat note may
  // not straddle a beat (the grade/notation boundary - the canvas). Upstream merges/bar-fills can fuse clean values into an
  // un-notatable one (1.0+0.25 -> a single 1.25 note), which the sampler then discarded - a wall. Instead SPLIT any such note
  // into the clean TIED notes a composer actually writes (a crotchet tied to a semiquaver), so the rhythm is legible by
  // construction, not by rejection. Same-pitch ties only; onset markings stay on the first sub-note, close markings on the last.
  {
    const OKD=[4,3,2,1.5,1,0.75,0.5,0.25], inOK=d=>OKD.some(x=>Math.abs(x-d)<1e-9);
    const wpos=t=>((t%barU)+barU)%barU;
    const needsSplit=(t,d)=>{ if(!inOK(d)) return true; if(d<beatLen-1e-9){ const w=wpos(t); if(Math.floor(w/beatLen+1e-9)!==Math.floor((w+d-1e-9)/beatLen)) return true; } return false; };
    const cleanSplit=(t,d)=>{ const out=[]; let p=wpos(t), len=d, guard=0;
      while(len>1e-9 && guard++<64){ let v=null;
        for(const x of OKD){ if(x>len+1e-9) continue; if(x<beatLen-1e-9){ const nb=(Math.floor(p/beatLen+1e-9)+1)*beatLen; if(p+x>nb+1e-9) continue; } v=x; break; }
        if(v==null){ const nb=(Math.floor(p/beatLen+1e-9)+1)*beatLen; const room=Math.min(nb-p,len); v=OKD.find(x=>x<=room+1e-9) ?? 0.25; }
        out.push(v); p=wpos(p+v); len-=v; }
      return out;
    };
    for(const seq of [rh, lh]){
      let t = partial ? barU-partial : 0; const out=[];
      for(const n of seq){
        if(n.tup || !needsSplit(t, n.d)){ out.push(n); t+=n.d; continue; }
        const parts=cleanSplit(t, n.d);
        if(parts.length<=1){ out.push(n); t+=n.d; continue; }
        parts.forEach((d,i)=>{ const first=i===0, last=i===parts.length-1; const s={...n, d};
          if(n.rest){ delete s.ti; out.push(s); return; }
          if(!first){ delete s.dyn; delete s.hp; delete s.fing; delete s.art; if(s.slur==='(') delete s.slur; }
          if(!last){ delete s.ferm; if(s.slur===')') delete s.slur; s.ti=1; }
          else if(!n.ti) delete s.ti;
          out.push(s);
        });
        t+=n.d;
      }
      seq.length=0; seq.push(...out);
    }
  }
  // A TIE holds the SAME pitch across a beat/bar (a suspension, a pedal/held tone). A "tie" to a DIFFERENT pitch is not a
  // tie at all - it is invalid notation (LilyPond draws a broken curve). It arises when a held span carries a `ti` but a
  // downstream step (chord clamp, octave fold, the harmonic-minor raise above) re-voices the note to a new harmony tone, so
  // the held pitch and its continuation no longer match. That is the voice RE-ARTICULATING, not tying - so drop the tie
  // wherever the next note in the hand does not share the pitch. A genuine same-pitch hold keeps its tie; legato across a
  // moving voice is the phrase slur's job, never a tie. (A tie being same-pitch is definitional, so this is a correctness
  // guard, not a preference.)
  for(const seq of [rh, lh]){
    for(let i=0;i<seq.length;i++){ const n=seq[i]; if(!n.ti) continue;
      let k=i+1; while(k<seq.length && seq[k].rest) k++;
      const nx=k<seq.length?seq[k]:null;
      const share = nx && nx.m!=null && (Array.isArray(n.m)?n.m:[n.m]).some(x=>(Array.isArray(nx.m)?nx.m:[nx.m]).includes(x));
      if(!share) delete n.ti;
    }
  }
  // assign to staves: treble = the higher-register part, bass = the lower. when swapped, the melody (rh) sits low.
  const ex={ grade, key:ly, mode, flat, time, tempo, rh: swap?lh:rh, lh: swap?rh:lh,
             rhFinger: swap?accompFing:melodyFing, lhFinger: swap?melodyFing:accompFing };
  if(partial) ex.partial = partial;
  if(process.env.VHDEBUG){ ex._vhBeat = _vhBeat; ex._swapDbg = swap;   // expose derived per-beat harmony for honest measurement
    ex._accBoxDegs = Array.from({length:span+1},(_,i)=>(( _accLo+i)%7+7)%7);   // scale-degrees reachable in the accompaniment five-finger box
    ex._prog2Bars = prog2.map(x=>!!x); ex._texture = texture; }
  // Non-render batch-variety hooks (stripped before saving): the accompaniment texture + primary figure, so a batch
  // can avoid placing the SAME accompaniment groove on adjacent same-metre pieces (Matthew's slot-34/35 sameness).
  ex._tex = texture;
  ex._figBias = figBias;         // stored so the collection can diversity-reason these choices (histogram of the bank-so-far) - see the keystone plan; nothing reads them yet
  ex._figFig = primaryFig ? _figSigOf(primaryFig) : null;   // the accompaniment figure's rhythm signature, for collection-diversity of the LH rhythm
  ex._winLo = winLo;             // five-finger position, for collection-diversity of the pitch vocabulary
  ex._motifPersist = motifPersist;   // how strongly the accompaniment carries its groove (reasoned from character)
  ex._og = _og;             // ornament counts {appog,antic,esc} for verification
  ex._secDom = secDom ? 'V/V' : 'plain';   // for collection-diversity of the chromatic V/V colour
  ex._anac = partial>0 ? 'anacrusis' : 'downbeat';   // collection-diversity of the upbeat-start phrase shape
  ex._dbl = (wide && wantDouble) ? 'double' : 'plain';   // collection-diversity of the doubled-thirds texture
  ex._brShape = brokenShape.join(',');   // diversity of the broken-chord arpeggiation shape
  ex._rhFig = primaryRHFig ? _figSigOf(primaryRHFig) : null;   // diversity of the swap RH figure
  ex._dblRun = opts.doubling ? 'double' : 'plain';   // diversity of the LH-tenths doubling texture
  ex._aug = wantAug ? 'aug' : 'plain';               // diversity of the apex-augmentation option across the book
  ex._fc = finalCad;             // final-cadence type, for collection-diversity (perfect/plagal spread across the book)
  ex._char = character.id; ex._restate = restate?'restate':'contrast';   // seed choices, for collection-diversity across the book
  ex._seedOpen = _seedOpen;                       // which tonic-chord tone the opening starts on, spread across the book
  ex._mid = midType;             // mid-cadence type, for collection-diversity across the book
  ex._dyn0 = rh[0].dyn;          // opening dynamic level, for collection-diversity across the book
  ex._pahSpacing = pahSpacing;
  ex._figSig = (texture==='fig' && primaryFig && Array.isArray(primaryFig.s)) ? 'fig:'+JSON.stringify(primaryFig.s) : texture;
  // DEBUG/critic hooks (non-render): the TRUE per-bar chord-tone pitch-classes and which staff holds the melody,
  // so the musicality critic measures against real harmony instead of guessing from an incomplete LH voicing.
  const _tpc=((rhTonic%12)+12)%12;
  const _triPCs=c=>{ const ch=CHm[c]; if(!ch) return []; const r=(((ch.b)%7)+7)%7;
    // MINOR DOMINANT = HARMONIC MINOR: the dominant chord's 3rd is scale-degree 7, which the harmonic-minor convention
    // RAISES to the leading tone so the chord pulls to i. The chord table spells degrees off the natural-minor scale, so
    // WITHOUT this the harmonic INTENT (_ct) declares a modal ^7 - the melody then targets the flat 7 and the leading tone
    // never sounds (measured: grade-2 minor pieces essentially never raised ^7). Raise degree 7 for the dominant only;
    // III/VI/iv keep the natural 7 (they are not dominant-function). This mirrors the LH degPitch + the melody raise pass.
    const domMin = mode==='min' && (c==='v' || c==='V');
    return [r,(r+2)%7,(r+4)%7].map(dg=>{ let s=KEYSCALE[mode][dg]; if(domMin && (((dg%7)+7)%7)===6) s+=1; return (((_tpc+s)%12)+12)%12; }); };
  ex._ct=[]; for(let b=0;b<nbars;b++){ const s=new Set(_triPCs(prog[b])); if(prog2[b]) _triPCs(prog2[b]).forEach(p=>s.add(p)); ex._ct.push([...s]); }
  // (Bass-arrival guard removed: folded into the accompaniment reasoner as a lookahead re-pick. Where a bar's last bass note
  // repeats the next bar's first bass ACROSS a real beat-level harmony change, accompany() re-chooses it by voice-leading
  // preference - the moving chord tone nearest the line it was travelling - so the bass arrives fresh. A held common tone over
  // a continuing chord is left alone. Measured 0.18% residual dead-bass on the reasoner's own output.)
  // (Moving-bar repeat-breaker removed: folded into the accompaniment chooser. A moving figure now leans hard against
  // re-striking (arp mv===0) and can STEP through a passing/neighbour tone instead of repeating, so the reasoner itself
  // produces a non-repeating figure - measured 0.52% residual repeats, where a repeat is genuinely the best available.)
  // (Two-hand tenths-doubling removed: folded into accompany() as the reasoned `tenth` texture - the accompaniment can double the
  // tune a diatonic 10th below as one phrase-level dress, chosen by preference where the hand reaches it, never a forced splice.)
  ex._mel = swap ? 'lh' : 'rh';
  ex._swap = swap ? 'swap' : 'normal';    // collection-diversity key (spread swap evenly across the book)
  ex._restate = restate;
  ex._scheme = scheme;              // dynamic-shape choice, for collection-diversity in gen-batch
  ex._prog = prog.slice();          // the chord progression, for the harmonic-variety preference in generate()
  ex._prog2 = prog2.slice();        // per-bar SECOND chord (mid-bar harmonic change), null where the bar holds one chord
  ex._changePos = changePos.slice();// per-bar offset (in quarter-beats) where the second chord takes over
  ex._barU = barU;                  // this piece's bar length in quarter-beats, so audits can locate the operative chord by time
  // (Antiphonal echo AND motivic answer removed: call-and-response is now a reasoned event inside accompany() (the `answer` dress),
  // which fires only where the tune leaves a GENUINE space. With these near-continuous tunes that space is rare, so what's dropped
  // here is exactly the FORCED dialogue the tunes never invited - real call-and-response now depends on the melody breathing.)
  if(process.env.VHSTATS) ex._vhBeat = (typeof _vhBeat!=='undefined' && _vhBeat) ? _vhBeat.map(bar=>bar.map(x=>x?x.chord:null)) : null;   // per-BEAT derived harmony (the real intra-bar chords), for honest measurement only (env-gated so it never bloats the bank)
  return ex;
}

// MELODIC MONOTONY (Matthew: exercise #2 "just a load of Gs and Ds"). A tune that outlines the triad with heavy
// repetition is not a melody. Reads the ACTUAL melody hand (ex._mel, reliable — not a heuristic). Flags: only the
// triad (<=3 distinct pitches), too few pitches for its length, one note dominating, or a note stuttered 3+ times.
function melodyMonotony(ex, gp){
  const mel=(ex._mel==='lh'?ex.lh:ex.rh).filter(n=>!n.rest);
  const ps=mel.map(n=>Array.isArray(n.m)?n.m[0]:n.m); if(ps.length<4) return false;
  const distinct=new Set(ps).size; const cnt={}; ps.forEach(p=>cnt[p]=(cnt[p]||0)+1);
  const maxFrac=Math.max(...Object.values(cnt))/ps.length;
  let run=1,maxRun=1; for(let i=1;i<ps.length;i++){ if(ps[i]===ps[i-1]){run++; if(run>maxRun)maxRun=run;} else run=1; }
  const R = gp && gp.richness;
  if(R){                                              // GRADE-2 (simplicity is grade-appropriate): reject only genuine deadness
    return distinct < R.melDistinct || maxFrac > R.maxFrac || maxRun >= R.maxRun;
  }
  if(distinct<=3) return true;                       // only the triad
  if(ps.length>=8 && distinct<=4) return true;       // too few pitches for a real tune
  if(maxFrac>0.42) return true;                      // one note dominates
  if(maxRun>=3) return true;                          // 3+ of the same note in a row
  return false;
}
// A DEAD accompaniment: the hand OPPOSITE the melody just holds two notes (a bare tonic-dominant pedal over a
// two-chord progression — Matthew: "the left hand is just two notes"). Fixed by richer harmony OR an arpeggiated
// texture, both of which raise the accompaniment's distinct-pitch count.
function thinAccompaniment(ex, gp){
  const acc=(ex._mel==='lh'?ex.rh:ex.lh).filter(n=>!n.rest);
  const ps=acc.flatMap(n=>Array.isArray(n.m)?n.m:[n.m]);
  const min = (gp && gp.richness && gp.richness.accomp) || 3;   // grade 2: a two-note oom-pah is fine (min 2); default 3
  return new Set(ps).size < min;
}
// A two-chord piece (I-V-I-V) is thin harmony. Prefer 3+ distinct chords so the diversification actually shows —
// achievable in 4 bars via a predominant (I-IV-V-I, I-ii-V-I) instead of restating I-V.
function thinHarmony(ex, gp){ const min=(gp && gp.richness && gp.richness.chords) || 3; return ex._prog ? new Set(ex._prog).size < min : false; }   // grade 2: I-V-I (2 chords) is a valid grade-2 progression (min 2); default 3

// 8-bar grades have far more surface to keep clean, so they need a deeper search:
// at 3000 tries only ~1 in 3 comes out faultless, at 15000 roughly half, for ~1s.
// Beyond that it stops paying, and the human pass handles the remainder.
export function generate(grade, tries, avoid, hist){
  if(tries==null) tries = grade===2 ? 3000 : 15000;
  // Commit to the metre AND to swap-or-not for the whole run. Re-rolling the metre each
  // try lets the search drift to whichever metre most easily scores zero, which quietly
  // destroys the spread of time signatures across the book.
  const gpG = gradeParams(grade);                             // this grade's params (single source) - drives metre, doubling, complexity floor here without inline grade numbers
  const TIMES = gpG.timeSignatures;                           // metre list ← grade params (single source of truth)
  // SWAP (melody in the LH) draws its RIGHT-HAND accompaniment from RHBANK, which now HAS grade-2 material (broken-chord
  // 'a' figures that move as single notes, so a grade-2 chordMax=1 RH never collapses to the flat repeated chords of
  // Matthew's exercise 105). Swap is therefore available at every grade; the grade only parameterises the figures/voicing.
  // METRE is committed for the whole run (so best-of can't drift to the easiest metre), chosen EXPLORATORILY. It cannot
  // be a deterministic least-used pick: metres differ in DIFFICULTY, so committing the least-used one creates a perverse
  // feedback (the hardest metre, being least represented among successes, gets committed the most and skews the book) -
  // measured: grades 3/4 collapsed to one metre. Uniform exploration gives the EVEN spread the book wants, without that
  // feedback; metre is thus a per-run SEED (like character's free seed / the rhythm cells), its spread emergent.
  // doubling (the LH-in-tenths texture) is an OPTIONAL per-piece texture identity, so it is a COLLECTION-DIVERSITY choice
  // (spread across the book, least-used ~1/5), NOT a die - still committed per RUN so best-of can't over-select it.
  // swap and time stay per-run free SEEDS (metre deliberately uniform, see below); hist = collection histogram (absent => free).
  const opts = { swap: pickLeastUsed(['swap','normal','normal','normal','normal'], hist && hist.swap)==='swap', doubling: !gpG.range.fixedPosition && pickLeastUsed(['double','plain','plain','plain','plain'], hist && hist.dblRun)==='double', time: TIMES[Math.floor(Math.random()*TIMES.length)], hist };   // swap (LH carries the melody) is now a collection-diversity identity like doubling (~1 in 5, spread across the book), not a raw coin   // doubling = the LH-in-TENTHS texture, whose 10th span needs the hand OUT of five-finger position (gp.range.fixedPosition=false, grade 3+) - read from grade-params, NOT an inline `grade>=3`
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
    if(gpG.melody && gpG.melody.rejectPlainArpeggio){ const mel=(ex._mel==='lh'?ex.lh:ex.rh).filter(x=>!x.rest);   // reject a plain all-crotchet arpeggio (gp.melody.rejectPlainArpeggio, grade 4+) - read from grade-params, NOT an inline `grade>=4`
      if(mel.length>=4){ const minDur=Math.min(...mel.map(x=>x.d));
        const pcs=mel.filter(x=>!Array.isArray(x.m)).map(x=>x.m); let st=0,lp=0;
        for(let k=1;k<pcs.length;k++){ const d=Math.abs(pcs[k]-pcs[k-1]); if(d===0)continue; if(d<=2)st++; else lp++; }
        const sr=(st+lp)?st/(st+lp):1;
        if(minDur>=1-1e-9 && sr<0.30) plain=1; } }
    const mono = melodyMonotony(ex, gpG) ? 1 : 0;
    const thinAcc = thinAccompaniment(ex, gpG) ? 1 : 0;
    const thinHarm = thinHarmony(ex, gpG) ? 1 : 0;
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





