// compose-audit.mjs — the COMPOSER-CRITERIA battery. Every output is asked the five questions, PER PIECE, PER
// DIMENSION: (1) possible? (2) idiomatic? (3) how a composer would think? (4) diversity + preference? (5) fully
// reasoned? A defect is a REASONING HOLE — a fully-reasoned generator could not produce it. Thresholds are a
// composer's, not a validator's. Legality is only question 1.
import { generateCompose } from './compose-adapter.mjs';
import { validate } from './engine.mjs';

const LET = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
const SCALE = { maj: [0, 2, 4, 5, 7, 9, 11], min: [0, 2, 3, 5, 7, 8, 10] };
const bott = m => Array.isArray(m) ? Math.min(...m) : m;
const pc = m => (((m % 12) + 12) % 12);

export function auditPiece(ex) {
  const D = [];   // defect list (reasoning holes)
  const barU = ex._barU, ev = ex._events || [];
  const P = ex.partial || 0;   // an anacrusis offsets note-time by the pickup; the harmonic PLAN's events are body-time (the
  //   first downbeat = 0), so every note-time walk that is compared to an event start begins at -P to realign the grids.
  const tpc = pc(LET[ex.key[0]] + (ex.key[1] === 'f' ? -1 : ex.key[1] === 's' ? 1 : 0));

  // ===== MELODY (pitch) =====
  const mel = ex.rh.filter(n => !n.rest).map(n => Array.isArray(n.m) ? n.m[0] : n.m);
  const restN = ex.rh.filter(n => n.rest).length;
  let rep = 0, step = 0, leap = 0, maxRun = 1, run = 1;
  for (let i = 1; i < mel.length; i++) { const d = Math.abs(mel[i] - mel[i - 1]);
    if (d === 0) { rep++; run++; maxRun = Math.max(maxRun, run); } else { run = 1; if (d <= 2) step++; else leap++; } }
  const moves = step + leap + rep || 1;
  const cnt = {}; mel.forEach(p => cnt[p] = (cnt[p] || 0) + 1);
  const dominance = Math.max(...Object.values(cnt)) / mel.length;
  const apexPos = mel.indexOf(Math.max(...mel)) / mel.length;
  // grade-scaled: a five-finger grade-2 tune has a tiny palette, so its natural dominance floor is higher (~12 notes
  //   over 5 pitches). These are the ABRSM-canvas thresholds (cf. the old machine's gp.richness), not a fault relax.
  const domCap = ex.grade <= 2 ? 0.42 : 0.33;
  // an AXIS tone the line RETURNS to (spread between gestures) is a real device, not a fault; only a CLUSTERED dominance
  //   (consecutive repeats — the line STUCK on the note) is a fixation. Flag high dominance only when clustered, or extreme.
  const domPitch = +Object.keys(cnt).reduce((a, b) => cnt[b] > cnt[a] ? b : a);
  let domConsec = 0; for (let i = 1; i < mel.length; i++) if (mel[i] === domPitch && mel[i - 1] === domPitch) domConsec++;
  const clustered = cnt[domPitch] > 1 && domConsec / cnt[domPitch] >= 0.4;
  if (rep / moves > 0.30) D.push(`MEL repetitive (${(100 * rep / moves).toFixed(0)}% repeated notes)`);
  if (maxRun >= 4) D.push(`MEL ${maxRun} same notes in a row`);
  if (dominance > 0.55 || (dominance > domCap && clustered)) D.push(`MEL one pitch is ${(100 * dominance).toFixed(0)}% of the line${clustered ? ' (fixation)' : ''}`);
  if (leap / moves < 0.04) D.push(`MEL no leaps (${(100 * leap / moves).toFixed(0)}%)`);
  // NARROW = too few DISTINCT pitches for the line's length — how a composer hears monotony ("it only uses three notes"),
  //   NOT the interval SPAN. Raw range<7 mis-measures a five-finger grade: the box is a fixed fifth of discrete scale
  //   tones, so a four-tone line reads range 5 yet is a fine melody (verified by rendering); the real fault is a full
  //   tune drawing on <=3 pitches (a 2-bar cell repeated, or a ^1-^5-^7 oscillation). Gated on length so a genuinely
  //   short tune isn't blamed for a small palette. Grades 3/4 (wider range, ~8 distinct) never fall this low, so the
  //   same measure self-scales — no per-grade constant needed.
  const distinctN = new Set(mel).size;
  if (mel.length >= 8 && distinctN <= 3) D.push(`MEL narrow — only ${distinctN} distinct pitches over ${mel.length} notes`);
  // breathing = repose, and repose is a REST *or* a long note — a minim+ rings, which is a breath (old machine: "a single
  //   held long note is fine — that's a breath"). Only a line that is relentless (neither) genuinely fails to breathe.
  const reposeNote = ex.rh.some(n => !n.rest && n.d >= 2);
  if (restN === 0 && !reposeNote) D.push('MEL no breathing (no rest, no long-note repose)');
  // RHYTHMIC MONOTONY — the machine tell my eye caught that the old audit was blind to: ONE rhythm cell filling half the
  //   bars, or the SAME bar restated 3+ times running. A composer restates the motif but DEVELOPS it (a beat varies, a
  //   contrast bar); the identical cell every bar reads as a pattern generator. (Motivic UNITY is fine — this only fires
  //   on saturation.) [P — measures the real defect: cell distribution, not mere repetition]
  // MONOTONY is the rhythm never DEVELOPING — too few DISTINCT cells over the phrase — NOT a motif recurring. A germ
  //   restated at both phrase openings is a parallel period; a scherzo's signature figure driving most bars is unity, not
  //   a machine tell (verified by rendering: the pitch develops under the recurring rhythm). A composer works the basic
  //   idea into at least a variant plus a cadential broadening, so a developed piece has >=3 distinct cells over 8 bars;
  //   <=2 means the idea was stated and never worked. Length-scaled (a short phrase develops less). [P — measures development, not recurrence]
  { let t = 0; const bars = {}; for (const n of ex.rh) { const b = Math.floor(t / barU + 1e-6); (bars[b] = bars[b] || []).push((n.rest ? 'R' : '') + n.d); t += n.d; }
    const cells = Object.values(bars).map(c => c.join(',')); if (cells.length >= 4) {
      const distinct = new Set(cells).size, minDistinct = cells.length >= 6 ? 3 : 2;
      if (distinct < minDistinct) D.push(`MEL rhythm undeveloped — only ${distinct} distinct cell(s) over ${cells.length} bars`); } }

  // ===== HARMONY =====
  // bass note at each event onset
  let t = -P; const lh = []; for (const n of ex.lh) { if (!n.rest) lh.push({ t, m: bott(n.m) }); t += n.d; }
  const bassAt = T => { let r = null; for (const n of lh) { if (n.t <= T + 1e-9) r = n.m; else break; } return r; };
  const degs = new Set(ev.map(e => ((e.deg % 7) + 7) % 7));
  // full LH + melody timelines, for the SURFACE-activity test (a prolonged harmony is only a fault when nothing moves
  //   over it — an ELABORATED long harmony, arpeggiated bass or active tune, is idiomatic, not a fault).
  let tl = -P; const lhAll = []; for (const n of ex.lh) { if (!n.rest) lhAll.push({ t: tl, bot: bott(n.m), all: Array.isArray(n.m) ? n.m : [n.m] }); tl += n.d; }
  let tr = -P; const melTl = []; for (const n of ex.rh) { if (!n.rest) melTl.push({ t: tr, m: Array.isArray(n.m) ? n.m[0] : n.m }); tr += n.d; }
  const spanStatic = (s, en) => {
    const lhIn = lhAll.filter(n => n.t >= s - 1e-9 && n.t < en - 1e-9), melIn = melTl.filter(n => n.t >= s - 1e-9 && n.t < en - 1e-9);
    const lhStatic = new Set(lhIn.map(n => n.bot)).size <= 1 && new Set(lhIn.flatMap(n => n.all)).size <= 2;
    return lhStatic && new Set(melIn.map(n => n.m)).size <= 2;   // dead in BOTH hands
  };
  // grade-scaled by the ABRSM canvas: a 4-bar five-finger grade-2 piece legitimately holds a chord longer, uses I-V,
  //   and moves less than an 8-bar grade-3/4 piece — those are grade-appropriate, not faults.
  // harmonic RICHNESS = enough DISTINCT harmonies for the length. A I-V seesaw over 8 bars is thin even at 2 chords/bar,
  //   while a 4-chord functional progression at ~1 chord/bar is fine (verified by rendering) — so the fault is few
  //   distinct harmonies, NOT a low chords-per-bar rate (which mis-flagged the fine slow pieces). A longer grade-3/4
  //   piece should draw on >=4 harmonies; a short grade-2 phrase on >=2. [P, grade/length gate]
  const vocMin = ex.grade <= 2 ? 2 : 4, holdMax = ex.grade <= 2 ? 2.2 : 1.5;   // grade-scaled: a simple grade-2 phrase on I-V is fine; a grade-3/4 piece should draw on >=4 harmonies
  const deadHold = ev.find(e => e.dur / barU > holdMax && spanStatic(e.start, e.start + e.dur));
  if (deadHold) D.push(`HARM a chord held ${(deadHold.dur / barU).toFixed(1)} bars, un-elaborated`);
  if (degs.size < vocMin) D.push(`HARM thin — only ${degs.size} distinct harmonies over ${ex._prog.length} bars`);

  // ===== 6/4 legitimacy: every second inversion must be cadential / passing / pedal / arpeggiated =====
  for (let i = 0; i < ev.length; i++) { const e = ev[i];
    const deg = ((e.deg % 7) + 7) % 7, rootpc = (tpc + SCALE[ex.mode][deg]) % 12, fifthpc = (rootpc + 7) % 12;
    const b = bassAt(e.start); if (b == null || pc(b) !== fifthpc) continue;   // only second inversions
    if (e.is64) continue;                                                       // the planned cadential 6/4 is legitimate
    // a 6/4 is a STATED second inversion — the bass SITS on the fifth. A MOVING bass (broken / walking / oom-pah /
    //   arpeggiated) that PASSES THROUGH the fifth is a LINE, not an inversion; the ear hears the line, not a 6/4 chord.
    //   So a 6/4 only exists where the bass is STATIC across the chord. [composer: a line is not an inversion — verified
    //   by rendering broken / sustained / oom-pah "6/4" flags: every one reads as a fine bass line, not a stated 6/4]
    const spanBass = new Set(lh.filter(x => x.t >= e.start - 1e-9 && x.t < e.start + e.dur - 1e-9).map(x => x.m));
    if (spanBass.size >= 2) continue;                                           // the bass moves during the chord = a line, not a stated inversion
    const bPrev = i > 0 ? bassAt(ev[i - 1].start) : null, bNext = i < ev.length - 1 ? bassAt(ev[i + 1].start) : null;
    const stepIn = bPrev != null && Math.abs(b - bPrev) <= 2, stepOut = bNext != null && Math.abs(b - bNext) <= 2;
    const pedal = bPrev != null && b === bPrev;
    const arp = (i > 0 && ((ev[i - 1].deg % 7) + 7) % 7 === deg) || (i < ev.length - 1 && ((ev[i + 1].deg % 7) + 7) % 7 === deg);
    if (!(pedal || (stepIn && stepOut) || arp)) { D.push(`6/4 not idiomatic (${['I','ii','iii','IV','V','vi','vii°'][deg]} 2nd-inv, bass leapt)`); break; }
  }

  // ===== MELODIC CLIMAX: the tune should ARC to a single high point, not peak at the very edge (no shape). =====
  if (mel.length >= 6) { const mx = Math.max(...mel), apexPos = mel.indexOf(mx) / mel.length;
    // SHAPE is not only an arch. A peak at the END that is the TONIC is a bright HIGH RESOLUTION (verified 100% of end-
    //   peaks); a peak at the START is a valid DESCENDING / falling opening (verified by rendering grand/dance/flowing —
    //   a majestic descent, an accented high attack, a meander from the top — all real composer shapes). The one genuine
    //   defect is a NON-tonic NEW HIGH at the very end that never resolves — which the come-home lean now makes ~0%. So
    //   flag only that. [measure the REAL defect, not "the peak isn't in the middle"]
    if (apexPos > 0.92 && pc(mx) !== tpc) D.push('MEL new high at the final note (unresolved)'); }

  // ===== HARMONIC RHYTHM: NO uniform-RATE check. A uniform one-chord-per-bar rate is NOT a defect — verified by
  //   rendering across every grade and character: calm lyrical music, steady dances (minuet/march tread), grade-2
  //   (whose simple I-V-I harmony is one chord per bar by the grade constraint) and even a driving Allegro with a
  //   varied five-chord progression all read as composer-correct at a steady rate. The interest is in the LINE and the
  //   progression, not in accelerating the chord rate. The real harmonic defect is STALENESS — too few DISTINCT chords —
  //   which the "HARM thin" check below already measures. (An earlier uniform-rate flag only ever fired on well-formed
  //   music; removed rather than gated, so the net measures the real defect, not "the rate isn't varied".)

  // ===== CADENCE: the piece must RESOLVE — final chord the tonic, final melody note a chord tone of it. =====
  const lastEv = ev[ev.length - 1];
  if (lastEv && ((lastEv.deg % 7) + 7) % 7 !== 0) D.push(`CADENCE final chord is not the tonic (${['I','ii','iii','IV','V','vi','vii°'][((lastEv.deg % 7) + 7) % 7]})`);
  if (mel.length) { const fpc = pc(mel[mel.length - 1]), tonicChord = [0, ex.mode === 'min' ? 3 : 4, 7].map(iv => (tpc + iv) % 12); if (!tonicChord.includes(fpc)) D.push('CADENCE melody does not resolve to a tonic-chord tone'); }

  // ===== VOICE LEADING (bass) =====
  const bl = lh.map(n => n.m);
  let brep = 0; for (let i = 1; i < bl.length; i++) if (bl[i] === bl[i - 1]) brep++;
  // a genuine drone = heavily repeated AND few distinct pitches; a 5-pitch bass that repeats its root (oom-pah/block)
  // is an idiomatic line, not static — flagging that was the over-strict wall the interrogation caught.
  if (bl.length && brep / bl.length > 0.55 && new Set(bl).size <= 3) D.push(`BASS drone (${(100 * brep / bl.length).toFixed(0)}% repeated, ${new Set(bl).size} pitches)`);

  // ===== EXPRESSIVE LAYER — the dimensions the battery was BLIND to (articulation, dynamics, cadential weight, harmonic
  //   clarity). A composer marks all of these; their ABSENCE is a real fault, not decoration. =====
  // ARTICULATION: a piece with no slur / staccato / accent / fermata anywhere is unphrased (was 0% of pieces — a total gap).
  if (!ex.rh.concat(ex.lh).some(n => n.art || n.slur || n.ferm)) D.push('ART no articulation (no slur / staccato / accent)');
  // DYNAMICS: every piece needs at least an opening dynamic (so the reader knows how to begin). Beyond that, an EVEN piece
  //   — one steady dynamic held throughout — is a real composer choice, not an omission; only the TOTAL absence of a
  //   dynamic is a fault. (Shaped characters swell a flat arc with a hairpin, so a surviving one-mark piece is genuinely
  //   even.)
  { const dm = ex.rh.filter(n => n.dyn || n.hp).length; if (dm < 1) D.push(`DYN missing (no dynamic at all)`); }
  // DYNAMICS COHERENCE: a crescendo must not resolve to a SOFTER dynamic, nor a diminuendo to a LOUDER one — but a hairpin
  //   resolving to the SAME level is a messa di voce (a swell that ebbs back), which is coherent. Only a contradiction is a
  //   fault. (LAD includes ff so a fortissimo ranks correctly.)
  { const LAD = ['pp', 'p', 'mp', 'mf', 'f', 'ff'], seq = ex.rh.filter(n => !n.rest); let cur = null;
    for (let k = 0; k < seq.length; k++) { const n = seq[k]; if (n.dyn) cur = LAD.indexOf(n.dyn);
      if ((n.hp === '\\<' || n.hp === '\\>') && cur != null) { let nx = null; for (let j = k + 1; j < seq.length; j++) { if (seq[j].hp === '\\!') break; if (seq[j].dyn) { nx = LAD.indexOf(seq[j].dyn); break; } }   // a \! CLOSES the hairpin (cut off at a breath) — coherent regardless of a later mark
        if (nx != null && ((n.hp === '\\<' && nx < cur) || (n.hp === '\\>' && nx > cur))) { D.push('DYN incoherent hairpin (cresc/dim contradicts the levels)'); break; } } } }
  // CADENCE weight: closing on the FIFTH in the bass is a weak 6/4 ending (the genuinely-wrong close — a root or a rare
  //   first-inversion tonic are both fine, so only the fifth is flagged, not the natural inverted minority).
  { const lastLH = [...ex.lh].reverse().find(n => !n.rest); if (lastLH && pc(bott(lastLH.m)) === (tpc + 7) % 12) D.push('CADENCE closes on the fifth in the bass (6/4 ending)'); }
  // HARMONIC CLARITY: the root should sound (either hand) during a harmony; a piece where many events state no root is
  //   ambiguous (can't tell V from iii). Flag only a piece that is broadly ambiguous, not the odd first-inversion.
  { let tr = -P; const rhTL = ex.rh.map(n => { const o = { t: tr, e: tr + n.d, pcs: n.rest ? [] : (Array.isArray(n.m) ? n.m : [n.m]).map(pc) }; tr += n.d; return o; });   // -P: realign the note grid to the harmonic plan's body-time (a pickup offsets it; the check forgot this)
    let tl2 = -P; const lhTL = ex.lh.map(n => { const o = { t: tl2, e: tl2 + n.d, pcs: n.rest ? [] : (Array.isArray(n.m) ? n.m : [n.m]).map(pc) }; tl2 += n.d; return o; });
    const SC = SCALE[ex.mode]; let amb = 0;
    for (const e of ev) { const rp = (tpc + SC[((e.deg % 7) + 7) % 7]) % 12, s = e.start, en = e.start + e.dur;
      const sounds = a => a.some(n => n.t < en - 1e-9 && n.e > s + 1e-9 && n.pcs.includes(rp));
      if (!sounds(rhTL) && !sounds(lhTL)) amb++; }
    if (ev.length && amb / ev.length > 0.4) D.push(`HARM ambiguous — root stated in neither hand for ${(100 * amb / ev.length).toFixed(0)}% of chords`); }

  // ===== MINOR ^6/^7 ACCIDENTALS — harmonic vs melodic PURPOSE (not legality) =====
  //   A chord tone takes the chord's version (V/vii° → sharp ^7; III/VII → natural 7; VI/iv/ii° → natural ^6); a
  //   non-chord tone follows melodic minor by direction. So a genuine fault is only: a ^6/^7 that CLASHES its own chord
  //   (a natural 7 over V, a sharp 7 over III), or a chromatic cross-relation (C♮↔C♯) WITHIN one chord. A B♭→C♯ aug 2nd
  //   ACROSS a chord change, both chord tones, is a harmonic idea — correct, never flagged.
  if (ex.mode === 'min' && ev.length) {
    const chordAt = t => { let e = ev[0]; for (const x of ev) if (x.start <= t + 1e-9) e = x; return e; };
    const triad = e => { const root = pc(tpc + SCALE.min[((e.deg % 7) + 7) % 7]); const iv = e.q === 'dim' ? [0, 3, 6] : e.q === 'aug' ? [0, 4, 8] : e.q === 'maj' ? [0, 4, 7] : [0, 3, 7]; return iv.map(x => pc(root + x)); };
    const nat6 = pc(tpc + 8), rai6 = pc(tpc + 9), nat7 = pc(tpc + 10), rai7 = pc(tpc + 11);
    let t = -P; const mtl = []; for (const n of ex.rh) { if (!n.rest) mtl.push({ t, m0: (Array.isArray(n.m) ? n.m[0] : n.m), p: pc(Array.isArray(n.m) ? n.m[0] : n.m), ch: null }); t += n.d; }
    mtl.forEach(o => o.ch = chordAt(o.t));
    // a CLASH is a real vertical event: the melody's ^6/^7 sounds AGAINST the opposite version ACTUALLY SOUNDED in the LH.
    //   Checking the melody vs the planned TRIAD alone over-flags ~9:1 (the opposing tone is usually not sounded — the bass
    //   breathes, or the chord is voiced incomplete — so a melodic-minor natural ^7 passing over an un-sounded V's D# is no
    //   clash at all). So gate the clash on the LH truly sounding the opposing pitch-class at that instant. [measure the real defect]
    let lt = -P; const lhtl = []; for (const n of ex.lh) { lhtl.push({ t: lt, e: lt + n.d, pcs: n.rest ? [] : (Array.isArray(n.m) ? n.m : [n.m]).map(pc) }); lt += n.d; }
    const lhSounds = (tt, pcT) => lhtl.some(x => x.t <= tt + 1e-9 && x.e > tt + 1e-9 && x.pcs.includes(pcT));
    let clash = 0, xrel = 0, naked = 0;
    for (let i = 0; i < mtl.length; i++) { const p = mtl[i].p, cps = triad(mtl[i].ch);
      if (p === nat7 && cps.includes(rai7) && lhSounds(mtl[i].t, rai7)) clash++; else if (p === rai7 && cps.includes(nat7) && lhSounds(mtl[i].t, nat7)) clash++;   // ^7 sounds against the chord's opposite ^7
      else if (p === rai6 && cps.includes(nat6) && lhSounds(mtl[i].t, nat6)) clash++;                       // a sharp ^6 sounding against ^6 natural in the bass
      // UNJUSTIFIED raised ^7: a sharp leading tone over a NON-dominant chord (its triad has no raised ^7) that also does
      //   NOT resolve UP by step to the tonic. Neither harmonic (chord tone) nor melodic (^7→^1) — it should be natural.
      if (p === rai7 && !cps.includes(rai7)) { const nx = mtl[i + 1];
        const resolvesUp = nx && nx.p === pc(tpc) && nx.m0 > mtl[i].m0 && nx.m0 - mtl[i].m0 <= 2;
        if (!resolvesUp) naked++; }
      if (i > 0 && mtl[i - 1].ch === mtl[i].ch) { const q = mtl[i - 1].p;                                   // adjacent chromatic pair, SAME chord = a melodic cross-relation
        if ((p === nat7 && q === rai7) || (p === rai7 && q === nat7) || (p === nat6 && q === rai6) || (p === rai6 && q === nat6)) xrel++; }
    }
    if (clash) D.push(`MIN ^6/^7 clashes its chord (${clash})`);
    if (naked) D.push(`MIN raised ^7 unjustified — non-dominant chord, no ^7→^1 resolution (${naked})`);
    if (xrel) D.push(`MIN chromatic cross-relation within one chord (${xrel})`);
  }

  // ===== EVERY ACCIDENTAL JUSTIFIED (both hands, all chromatics — generalises the ^6/^7 check) =====
  //   A composer justifies EVERY chromatic tone: it is a CHORD TONE of its harmony (harmonic — incl. a secondary
  //   dominant's raised third, which the ^6/^7-only check above never sees) or it RESOLVES BY STEP (melodic — a passing
  //   / neighbour / leading tone). A chromatic that is neither, in either hand, is a stray — a reasoning hole. Verified
  //   0 across ~4600 chromatics in the current generator (chromatics are chord tones or step-resolve by construction),
  //   so this stands as a completeness guard over BOTH hands and ALL chromatic tones, major and minor. [P]
  if (ev.length) {
    const scPc = ex.mode === 'min' ? SCALE.min : SCALE.maj;
    const chAt = t => { let e = ev[0]; for (const x of ev) if (x.start <= t + 1e-9) e = x; return e; };
    const triOf = e => { const root = pc(tpc + scPc[((e.deg % 7) + 7) % 7]); const iv = e.q === 'dim' ? [0, 3, 6] : e.q === 'aug' ? [0, 4, 8] : e.q === 'maj' ? [0, 4, 7] : [0, 3, 7]; return iv.map(x => pc(root + x)); };
    let stray = 0;
    for (const seq of [ex.rh, ex.lh]) { let t = -P; const tl = [];
      for (const n of seq) { if (!n.rest) (Array.isArray(n.m) ? n.m : [n.m]).forEach(m => tl.push({ t, m, p: pc(m) })); t += n.d; }
      for (let i = 0; i < tl.length; i++) { const o = tl[i]; if (scPc.includes(pc(o.m - tpc))) continue;  // diatonic
        if (triOf(chAt(o.t)).includes(o.p)) continue;                                                     // chord tone (harmonic)
        const nx = tl.find(x => x.t > o.t + 1e-9); if (nx && Math.abs(nx.m - o.m) <= 2 && nx.m !== o.m) continue;  // resolves by step (melodic)
        stray++; } }
    if (stray) D.push(`ACC stray chromatic — neither chord tone nor resolving (${stray})`);
  }

  return { defects: D, apexPos, valid: validate(ex).ok };
}

function run() {
  for (const g of [2, 3, 4]) {
    const N = 400, tally = {}, apexes = [];
    let clean = 0, invalid = 0;
    for (let i = 0; i < N; i++) { const ex = generateCompose(g); const a = auditPiece(ex);
      if (!a.valid) invalid++;
      apexes.push(a.apexPos);
      if (a.defects.length === 0) clean++;
      for (const d of a.defects) { const k = d.replace(/\d+(\.\d+)?/g, '#'); tally[k] = (tally[k] || 0) + 1; }
    }
    // structural diversity: variance of apex position (formulaic if all the same)
    const mean = apexes.reduce((x, y) => x + y, 0) / N, sd = Math.sqrt(apexes.reduce((x, y) => x + (y - mean) ** 2, 0) / N);
    console.log(`GRADE ${g}: clean ${(100 * clean / N).toFixed(0)}%  invalid ${(100 * invalid / N).toFixed(0)}%  apex spread sd=${sd.toFixed(2)} (formulaic if <0.15)`);
    Object.entries(tally).sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(`   ${(100 * n / N).toFixed(0).padStart(3)}%  ${k}`));
  }
}
import { fileURLToPath } from 'url';
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) run();   // run the batch only when invoked directly, not on import (fileURLToPath decodes %20 in paths with spaces)
