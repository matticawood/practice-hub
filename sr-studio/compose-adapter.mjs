// compose-adapter.mjs — Stage 5 integration. Turns the compose-model core (compose.mjs: harmony-first plan →
// melody as ornamented harmony → bass through the same chords) into the `ex` piece object the rest of the studio
// consumes (validate, fingering, dynamics, rendering). The core owns musical correctness (clashes impossible by
// construction); this file is TRANSLATION only — frame, notation, and the `ex` contract — plus light dressing.
//
// SCOPE (first pass): simple metres only (4/4, 2/4, 3/4). Compound metres (6/8, 3/8) need the core's per-bar rhythm
// expressed in compound-beat units — a separate step — so they are deferred here, not faked.

import { dramaticPlan, harmonicPlan, composeMelody, composeBass, realizeLH, resolveOuterParallels, animateInnerVoice, reharmoniseStaticSpans, breatheLH, respondToBreaths } from './compose.mjs';
import { gradeParams } from './grade-params.mjs';
import { GRADES, resolveFingering } from './engine.mjs';

// a compact CHARACTER taxonomy (the same fabric idea as the old engine): each is a coherent feel → texture pool +
// articulation + dynamic band + tempo. The texture pool is the LH figuration set the character draws from. [P]
// CHARACTER TAXONOMY (ported/expanded from the old machine, generator.mjs L125-182). Each is a coherent fabric of real
//   traits, none a proxy off another: `move` = harmonic-movement bias (a driving march changes harmony more than a calm
//   singing line); `breath` = yield/repose tendency (cantabile yields; march carries the groove — the melBreath axis);
//   `figure` = how the tune MOVES (CHAR_FIGS): conjunct (cantabile steps), arpeggiated (march/grand outline the triad),
//   playful (scherzo/dance skip + neighbour), mixed. Articulation sets the breath LENGTH (legato full-beat lift, detached clip). [P]
const CHARACTERS = [
  // EXPRESSION params (ported from generator.mjs, ABRSM-grounded — audited: each is a character-appropriate LEAN, not a
  //   switch): `stac` = melodic staccato tendency (scherzo high, cantabile 0); `accent` = accent frequency (march/grand
  //   high); `ferm` = expressive-repose/fermata tendency (lyrical/grand higher, crisp dance rare); `hair` = how readily a
  //   phrase-arc earns a hairpin (lyrical high → shaped; march low → terraced). `move`/`breath`/`figure` as before.
  { id: 'singing',     feel: 'smooth', artic: 'legato',   figure: 'conjunct',    move: 0.48, breath: 0.9,  stac: 0.0,  accent: 0.0,  ferm: 0.15, hair: 0.85, tex: ['sustained', 'broken', 'alberti'],       metres: ['4/4', '3/4', '2/4'], dyn: ['pp', 'p', 'mp'], pace: 0.35, dot: 0.15, tempo: 'Andante cantabile' },
  { id: 'lyricalslow', feel: 'smooth', artic: 'legato',   figure: 'conjunct',    move: 0.4,  breath: 0.92, stac: 0.0,  accent: 0.05, ferm: 0.35, hair: 0.8,  tex: ['sustained', 'broken', 'sustained'],     metres: ['4/4', '3/4'],        dyn: ['pp', 'p'],       pace: 0.18, dot: 0.15, tempo: 'Adagio espressivo' },
  { id: 'flowing',     feel: 'smooth', artic: 'mixed',    figure: 'mixed',       move: 0.6,  breath: 0.75, stac: 0.2,  accent: 0.1,  ferm: 0.1,  hair: 0.6,  tex: ['broken', 'alberti', 'sustained'],       metres: ['4/4', '3/4', '2/4'], dyn: ['p', 'mp', 'mf'], pace: 0.48, dot: 0.2, tempo: 'Andante' },
  { id: 'waltz',       feel: 'lilt',   artic: 'legato',   figure: 'conjunct',    move: 0.55, breath: 0.7,  stac: 0.3,  accent: 0.1,  ferm: 0.05, hair: 0.6,  tex: ['rootfifth'],                            metres: ['3/4'],               dyn: ['p', 'mp', 'mf'], pace: 0.42, dot: 0.45, tempo: 'Tempo di Valse' },
  { id: 'minuet',      feel: 'lilt',   artic: 'mixed',    figure: 'playful',     move: 0.5,  breath: 0.72, stac: 0.6,  accent: 0.15, ferm: 0.05, hair: 0.5,  tex: ['rootfifth', 'bassline', 'rootfifth'],   metres: ['3/4'],               dyn: ['mp', 'mf'],      pace: 0.46, dot: 0.55, tempo: 'Tempo di minuetto' },
  { id: 'march',       feel: 'crisp',  artic: 'detached', figure: 'arpeggiated', move: 0.72, breath: 0.5,  stac: 0.6,  accent: 0.6,  ferm: 0.1,  hair: 0.4,  tex: ['block', 'rootfifth', 'block'],          metres: ['4/4', '2/4'],        dyn: ['mf', 'f', 'ff'], pace: 0.5, dot: 0.7, tempo: 'Alla marcia' },
  { id: 'dance',       feel: 'crisp',  artic: 'mixed',    figure: 'playful',     move: 0.68, breath: 0.65, stac: 0.6,  accent: 0.2,  ferm: 0.05, hair: 0.4,  tex: ['rootfifth', 'block', 'broken'],         metres: ['2/4', '4/4'],        dyn: ['mp', 'mf'],      pace: 0.62, dot: 0.4, tempo: 'Allegretto' },
  { id: 'scherzo',     feel: 'crisp',  artic: 'detached', figure: 'playful',     move: 0.7,  breath: 0.6,  stac: 0.85, accent: 0.3,  ferm: 0.05, hair: 0.4,  tex: ['bassline', 'rootfifth', 'block'],       metres: ['2/4', '3/4'],        dyn: ['mp', 'mf', 'f'], pace: 0.82, dot: 0.3, tempo: 'Scherzando' },
  { id: 'gentle',      feel: 'smooth', artic: 'mixed',    figure: 'mixed',       move: 0.52, breath: 0.85, stac: 0.1,  accent: 0.05, ferm: 0.15, hair: 0.6,  tex: ['alberti', 'broken', 'sustained'],       metres: ['4/4', '3/4', '2/4'], dyn: ['p', 'mp'],       pace: 0.42, dot: 0.2, tempo: 'Moderato' },
  { id: 'grand',       feel: 'smooth', artic: 'mixed',    figure: 'arpeggiated', move: 0.55, breath: 0.62, stac: 0.25, accent: 0.7,  ferm: 0.35, hair: 0.5,  tex: ['block', 'rootfifth', 'block'],          metres: ['4/4', '3/4'],        dyn: ['mf', 'f', 'ff'], pace: 0.3, dot: 0.6, tempo: 'Maestoso' },
  { id: 'lively',      feel: 'crisp',  artic: 'mixed',    figure: 'mixed',       move: 0.6,  breath: 0.6,  stac: 0.5,  accent: 0.25, ferm: 0.1,  hair: 0.5,  tex: ['bassline', 'rootfifth', 'broken', 'block'], metres: ['2/4', '4/4', '3/4'], dyn: ['mp', 'mf', 'f'], pace: 0.75, dot: 0.3, tempo: 'Allegro' },
];

const LETTER = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
// which keys carry a FLAT key signature (so accidentals print as flats). A property of the signature, NOT of the
// tonic letter — G minor (Bb, Eb) is a flat key though its tonic is a plain "G". The raised leading tone still
// prints sharp regardless (the engine's speller special-cases it).
const FLAT_MAJ = new Set(['f', 'bf', 'ef', 'af', 'df', 'gf']);
const FLAT_MIN = new Set(['d', 'g', 'c', 'f', 'bf', 'ef']);
function keyInfo(name, mode) {                               // 'C' | 'G' | 'Bf' | 'Ef' | 'Fs' → { pc, keyStr, flat }
  const l = name[0].toLowerCase(), acc = name[1];
  const pc = (((LETTER[l] + (acc === 'f' ? -1 : acc === 's' ? 1 : 0)) % 12) + 12) % 12;
  const keyStr = l + (acc ? acc.toLowerCase() : '');
  return { pc, keyStr, flat: (mode === 'maj' ? FLAT_MAJ : FLAT_MIN).has(keyStr) };
}
const ROMAN = {
  maj: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
  min: ['i', 'ii°', 'III', 'iv', 'V', 'VI', 'VII'],
};
const rnd = a => a[Math.floor(Math.random() * a.length)];

// THE FORM varies across the set [P — "every piece its own"]. A composer does not cast every piece in one mould; the same
//   8 bars come as a PERIOD (antecedent to a half cadence, consequent to the perfect close), a SENTENCE / continuous phrase
//   (no mid stop — one drive to the close), or a BINARY (the first section closes authentically before the second). The
//   final cadence is always the perfect authentic close. Grade 2's cramped 4-bar phrase keeps the plain period. The
//   harmonic planner already realises HC / IAC / continuous, so this is pure form variety, correct by construction.
function formFor(nbars, grade = 3, rnd = Math.random) {
  const center = Math.max(1, Math.ceil(nbars / 2) - 1), end = nbars - 1;
  // the mid cadence usually falls symmetrically (4+4) but a composer also writes ASYMMETRIC periods (3+5 / 5+3): a
  //   weighted lean toward the centre, shifting a bar either way, so the phrase does not breathe in the same place every
  //   piece. Clamped so each limb keeps >=3 / >=2 bars. Grade 2 / short pieces keep the plain symmetric period. [P]
  const midOpts = { [center]: 6, [center - 1]: 1.5, [center + 1]: 1.5 };   // ~2/3 symmetric (the norm), ~1/3 asymmetric (the deliberate variety)
  const validMid = Object.keys(midOpts).map(Number).filter(m => m >= 2 && m <= end - 2);
  const pickMid = () => { const tot = validMid.reduce((s, m) => s + midOpts[m], 0); let r = rnd() * tot; for (const m of validMid) if ((r -= midOpts[m]) < 0) return m; return center; };
  const mid = (grade <= 2 || nbars < 8 || !validMid.length) ? center : pickMid();
  const period = { nbars, cadences: [{ bar: mid, type: 'HC' }, { bar: end, type: 'PAC' }] };
  // A SHORT piece (grade 2, 4-6 bars) must NOT be a 2+2 period: that pins every bar (open I, mid-HC V, the PAC's V, the
  //   final I → only I and V, no free bar for a predominant). A single phrase lets the harmony JOURNEY — I - IV/ii(/vi) -
  //   V - I — a real if simple progression. The composer's simplest piece still has a predominant, not just I and V. [P]
  if (grade <= 2 || nbars < 8) return { nbars, cadences: [{ bar: end, type: 'PAC' }] };
  const w = { period: 5, sentence: 3, binary: 2 }, keys = Object.keys(w);
  let r = rnd() * keys.reduce((s, k) => s + w[k], 0), form = keys[0];
  for (const k of keys) { if ((r -= w[k]) < 0) { form = k; break; } }
  if (form === 'sentence') return { nbars, cadences: [{ bar: end, type: 'PAC' }] };                          // one continuous phrase
  if (form === 'binary') return { nbars, cadences: [{ bar: mid, type: 'IAC' }, { bar: end, type: 'PAC' }] };  // first section closes on the tonic
  return period;
}

// build ONE piece as an `ex`. opts lets a batch pin key/mode/time/character for collection spread; all optional.
export function generateCompose(grade, opts = {}) {
  const gp = gradeParams(grade);
  const G = GRADES[grade];
  // DISTINCTNESS [P — how a composer writes a SET: each piece its own statement, the collection deliberately varied]. Each
  //   identity choice (mode / key / metre / character) LEANS AWAY from what the existing bank already over-uses — every
  //   option stays reachable (a weighted lean, never a ban → not the wall-shaped reject-filter the naturalness rule forbids),
  //   but a crowded key/character is chosen less, so the set spreads across the palette instead of repeating. [opts.avoid = the bank]
  const avoid = opts.avoid || [];
  // DISTINCTNESS GRADIENT [P — Matthew: in the BOOK, the closer two exercises sit, the more distinct they must be; it EASES
  //   with distance]. Each existing piece's contribution to the "already used" counts is weighted by PROXIMITY: the immediate
  //   neighbour (last in the bank) weighs most, fading with distance so a near neighbour's key / metre / character is leaned
  //   APART hardest and a far shared vibe is fine. A weighted LEAN, never the old hard reject screen — every option stays
  //   reachable (so it can't starve the tail), the far book still contributes the set-level base of 1 (the whole-book spread).
  const nAv = avoid.length, PROX_K = 45, PROX_TAU = 4;
  const proxW = i => 1 + PROX_K * Math.exp(-(nAv - 1 - i) / PROX_TAU);   // i = index in `avoid` (bank order; last = the immediate neighbour, distance 1)
  const countBy = (sel, near = false) => { const m = {}; for (let i = 0; i < nAv; i++) { const k = sel(avoid[i]); if (k != null) m[k] = (m[k] || 0) + (near ? proxW(i) : 1); } return m; };
  const leanAway = (cands, counts) => { if (!cands.length) return null; const w = cands.map(c => 1 / (1 + (counts[c] || 0))); let r = Math.random() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < cands.length; i++) { r -= w[i]; if (r <= 0) return cands[i]; } return cands[cands.length - 1]; };
  const cMode = countBy(e => e.mode), cKey = countBy(e => e.key, true), cTime = countBy(e => e.time, true), cChar = countBy(e => e.tempo, true);   // key/metre/character lean away from NEAR neighbours (the book gradient); mode stays set-level (2 values — no rigid maj/min alternation). tempo is 1:1 with character and is what the bank stores
  const mode = opts.mode || leanAway((gp.keys.minor || []).length ? ['maj', 'maj', 'min'] : ['maj'], cMode);   // maj slightly favoured at an empty bank (2:1), then the bank counts spread it
  const keyName = opts.key || leanAway(gp.keys[mode === 'maj' ? 'major' : 'minor'] || ['C'], cKey);
  const { pc, keyStr, flat } = keyInfo(keyName, mode);
  const SIMPLE = ['4/4', '2/4', '3/4'];
  let times = gp.timeSignatures.filter(t => SIMPLE.includes(t));
  // a PINNED character fixes the metre family — a waltz / minuet is ternary by definition, so it must not be paired with a
  //   duple bar just because the metre was drawn first. (Unpinned generation already picks the character to fit the metre
  //   below, so this only guards a caller that pins the character.) A definitional constraint, not a tuned lean.
  if (opts.character) { const pinned = CHARACTERS.find(c => c.id === opts.character); if (pinned) { const t2 = times.filter(t => pinned.metres.includes(t)); if (t2.length) times = t2; } }
  const time = opts.time || leanAway(times.length ? times : ['4/4'], cTime);
  const [top, bottom] = time.split('/').map(Number);
  const barU = (top / bottom) * 4, beatLen = 1;
  const nbars = G.bars[time];
  const fixed = G.fixedPosition;

  // register: tonic near D4; each hand its own window (a five-finger box when the grade is fixed-position).
  let tonic = 60 + pc; if (tonic > 67) tonic -= 12;
  // FIVE-FINGER POSITION (fixed grades) sits on the TONIC(0), SUBDOMINANT(3) or DOMINANT(4) degree — NOT always the tonic
  //   (a hand position is not always root-position). A MINOR key LEANS to a ^7-reachable position (the subdominant and
  //   dominant positions put the leading tone under the hand) so it can close authentically ^7→^1; the tonic position (^7
  //   below the hand) stays the modal minority. Kept in a readable register (top not flying above the staff). [ported winLo]
  const SCALE_OFF = mode === 'min' ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
  const offAt = d => SCALE_OFF[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7);
  // MAJOR stays in the TONIC position — it has no leading-tone need, and the tonic position holds the richest chord tones
  //   (^1-^3-^5) so a chord-anchored melody can fill the hand. Only MINOR takes a ^7-reachable position (subdominant/
  //   dominant), where the narrower chord-tone palette is the price of a functional ^7→^1 cadence, tonic position the minority.
  // (the five-finger HAND is placed AFTER the harmony is planned — the hand goes WHERE THE CHORDS LIE; see below.)

  const form = formFor(nbars, grade, Math.random);
  // CHARACTER first — it drives the harmonic rhythm (its move-bias), the texture, tempo and dynamics.
  const charPool = CHARACTERS.filter(c => c.metres.includes(time));
  const leanedTempo = charPool.length ? leanAway(charPool.map(c => c.tempo), cChar) : null;   // pick the under-used character ONCE (leanAway is random — never call it inside a predicate)
  const chr = opts.character ? CHARACTERS.find(c => c.id === opts.character)
    : (charPool.length ? charPool.find(c => c.tempo === leanedTempo) : CHARACTERS[0]);
  // moveBias: the STRENGTH of the preference for harmonic movement — a character trait (an active march moves more than
  // a calm singing line), not a flat constant. Metrical strength / phrase intensity / stasis pressure shape it inside the plan.
  const moveBias = opts.moveBias ?? (chr.move ?? 0.5);
  // cadWeight: the character's FORMALITY — how much it wants a cadential 6/4 crowning its main cadence. A grand/military
  //   statement (high accent) or a formal Classical dance (feel 'lilt' = minuet, waltz) does; an intimate song or a light
  //   scherzo does not. chromColour: its appetite for a chromatic secondary-dominant colour — the smooth/lilt singing and
  //   dance characters reach for it, the crisp military/light ones stay diatonic. Both are read in harmonicPlan.
  const cadWeight = Math.max(chr.accent ?? 0, chr.feel === 'lilt' ? 0.6 : 0);
  // GRADE = a LEVEL OF SOPHISTICATION a composer writes AT, not just a canvas of what is allowed. `soph` (g2=0 … g4=1) is a
  //   pervasive LEAN: the higher the grade, the more a piece REACHES INTO its palette — richer harmonic colour, more
  //   sequence, a wider and more ornamented line, a busier rhythm — so a grade-4 piece reads at its level even in a gentle
  //   character, without forcing any single device. A lean layered ON the canvas bounds, never a switch. [P — grade as level]
  const soph = Math.max(0, Math.min(1, (grade - 2) / 2));
  const chromColour = (chr.feel === 'crisp' ? 0.08 : 0.25) * (0.5 + soph);      // reach for chromatic colour MORE at a higher grade
  // seqBias: the character's appetite for a SEQUENTIAL passage (roots spinning by one consistent interval — the harmony
  //   sequences and the melody sequences over it). A smooth/lyrical or formal line spins sequences (the Baroque/Classical
  //   spinning-out, the rosalia); a crisp march/dance leans on repetition instead. Grade leans it up (a spun sequence is a
  //   sophistication). [P — a style trait × the grade level]
  const character = { harmonicRhythmBars: opts.holdBars || rnd(fixed ? [1, 1, 2] : [1, 2]), moveBias, cadWeight, chromColour, soph, feel: chr.feel, accent: chr.accent, climaxLate: chr.feel === 'crisp' ? 0.7 : chr.feel === 'smooth' ? 0.35 : 0.5, seqBias: (chr.feel === 'smooth' ? 0.5 : chr.feel === 'lilt' ? 0.34 : 0.2) * (0.7 + 0.6 * soph) };
  // THE DRAMATIC PLAN first — the shared tension/climax spine that harmony, melody, bass and dynamics all read.
  const drama = dramaticPlan({ nbars, barU, beatLen, form, character, rnd: Math.random });
  const plan = harmonicPlan({ grade, mode, barU, beatLen, form, character, drama, rnd: Math.random });
  // PLACE THE HAND TO FIT THE HARMONY [composer: the little finger is NOT always on the tonic — the hand goes where the
  //   chords lie]. Score every pentachord (little finger on each scale degree) by how many of the piece's chords have BOTH
  //   root and third under it — a clean bass with a first-inversion escape (no accidental 6/4, no forced parallel). Pick a
  //   best-fitting one, register permitting, with a random tie-break so the hand VARIES piece to piece; both hands take it,
  //   an octave apart. This replaces the false "always tonic-at-the-bottom" assumption. [P — the real grade-2 model]
  let winLo = 0; const lhTonic = tonic - 12;
  if (fixed) {
    const degsUsed = (plan.chords || []).map(c => (((c.deg % 7) + 7) % 7));
    const inHand = (d, p) => ((((d - p) % 7) + 7) % 7) <= 4;
    // A composer places the five-finger hand where the CHORDS lie — FIRST so the ROOTS are playable (in two voices a
    //   reachable root is what makes each chord legible; a hand that can't reach a chord's root leaves it ambiguous), and
    //   THEN, among the hands that reach the most roots, favouring the one that also reaches the most THIRDS (a fuller
    //   hand, first-inversion colour to hand). That is an ORDERING — roots first, thirds as the tie-break — not a tuned
    //   ratio. The hand still VARIES piece to piece: positions usually tie on roots, and the choice among them is a
    //   weighted lean (a full-root hand strongly preferred; a one-root-short hand stays a reachable minority — a
    //   preference, never a wall; no single hand covers every root of every progression). [P — place the hand to fit the harmony]
    const cands = [0, 1, 2, 3, 4, 5, 6];   // the little finger may sit on ANY scale degree; register is set by octave-placing below, so no position is excluded
    const rootCov = p => degsUsed.reduce((n, d) => n + (inHand(d, p) ? 1 : 0), 0);
    const thirdCov = p => degsUsed.reduce((n, d) => n + (inHand((d + 2) % 7, p) ? 1 : 0), 0);
    const ltReach = p => inHand(6, p) ? 1 : 0;   // is the LEADING TONE (^7) under the hand — so the authentic cadence can resolve ^7->^1 (the key-confirmer), not fall back to a hollow ^2->^1
    const bestRoot = Math.max(...cands.map(rootCov));
    const w = cands.map(p => { const rc = rootCov(p); return rc < bestRoot - 1 ? 0 : (rc === bestRoot ? 3 : 1) * (1 + thirdCov(p) + 1.5 * ltReach(p)); });   // roots primary (full-root hands lead, one-short a minority); thirds + the leading tone the sub-lean (^7 weighted like an important extra tone to hold, behind the root gate)
    let r = Math.random() * w.reduce((a, b) => a + b, 0); winLo = cands[0];
    for (let i = 0; i < cands.length; i++) { r -= w[i]; if (r <= 0) { winLo = cands[i]; break; } }
  }
  // OCTAVE-PLACE the window so the melody sits in a readable treble register WHATEVER the position — a high-tonic key can
  //   still take a subdominant/dominant hand (the octave adjusts, the position choice does not get constrained away). [P]
  let melLo = tonic + offAt(winLo); while (melLo > 67) melLo -= 12; while (melLo < 60) melLo += 12;
  const melSpan = offAt(winLo + 4) - offAt(winLo);
  const melRange = fixed ? [melLo, melLo + melSpan] : [tonic - 2, tonic + 12];
  const bassRange = fixed ? [melLo - 12, melLo - 12 + melSpan] : [lhTonic - 2, lhTonic + 10];
  const breath = chr.breath;   // the character's yield/repose tendency (a real trait); articulation sets the breath LENGTH below
  // MOTIVIC AIR: a CRISP character's detachment is partly rhythmic — a weak-beat crotchet clips to a quaver + quaver-rest
  //   (note-then-air), not only a staccato dot. A smooth/legato tune has none. A lean, applied piece-wide for consistency. [P]
  const gap = chr.artic === 'detached' ? 0.55 : chr.feel === 'crisp' ? 0.4 : chr.stac >= 0.5 ? 0.28 : 0;
  const melody = composeMelody({ plan, tonic, mode, barU, beatLen, nbars, range: melRange, drama, breath, legato: chr.artic === 'legato', figure: chr.figure, pace: chr.pace, dot: chr.dot, gap, gracefulCad: chr.feel !== 'crisp', grade, soph, rnd: Math.random });   // a smooth/lilting line resolves the cadence by step/third; a crisp one may leap to a bright tonic; soph = the grade's sophistication lean
  reharmoniseStaticSpans(plan, melody, { tonic, mode, barU, beatLen });   // harmony travels under a still line (common-tone recolour) — before the bass is realised
  // GRADE-CANVAS gate: an oom-pah (rootfifth) is a LEAP — a low bass, then the chord sprung a register above it — which a
  //   fixed five-finger hand cannot make. So at grade 2 the oom-pah is not attempted at all (its "hollow fifths" were never
  //   a voicing bug, they were the wrong texture for the hand). The character keeps one of its OWN hand-fitting textures;
  //   one defined solely by the oom-pah (a waltz) takes a broken chord. Grades that leave the five-finger box keep it. [grade canvas]
  const texPool = fixed ? chr.tex.filter(t => t !== 'rootfifth') : chr.tex;
  const texture = opts.texture || (texPool.length ? rnd(texPool) : 'broken');
  // The accompaniment's SURFACE MOTION (how densely a walking/broken bass fills with passing eighths) expresses the
  // character's DRIVE — it moves a lot AND doesn't breathe (the same essence as the CONTINUE disposition). A poised
  // minuet walks mostly in crotchets with the odd passing eighth; a driving allegro runs eighths. So density is not a
  // flat constant but the character's drive, with the grade raising the ceiling on how busy it may get. [P, reasoned]
  const _drive = (chr.move ?? 0.5) * (1 - (chr.breath ?? 0.6));
  const _gscale = fixed ? 0.7 : grade >= 4 ? 1.15 : 1.0;
  const density = opts.density ?? Math.max(0.05, Math.min(0.5, _drive * 1.6 * _gscale));
  const bass = realizeLH({ plan, tonic, mode, barU, beatLen, nbars, range: bassRange, melody, texture, chordMax: gp.chordMax ?? (fixed ? 1 : 2), density, drama, rnd: Math.random });

  // ex assembly. Durations are already OKDUR + beat-aligned from the core; the renderer notates ties itself.
  const rh = melody.map(n => n.rest ? { rest: true, d: n.d } : { m: n.m, d: n.d });
  let lh = bass.map(n => n.rest ? { rest: true, d: n.d } : { m: n.m, d: n.d });
  // (elaborateHeldHarmony removed — a held chord under a slow melody is a deliberate SUSTAINED texture, not a dead span to arpeggiate; the texture choice is honoured, not overridden after the fact.)
  resolveOuterParallels(rh, lh, { plan, tonic, mode, range: bassRange, barU, beatLen });
  if ((gp.chordMax ?? (fixed ? 1 : 2)) >= 2) animateInnerVoice(lh, { plan, tonic, mode, melody, range: bassRange });   // give held chords a moving inner voice (g3/4)
  // Whether the accompaniment LIFTS its last beat before a phrase boundary is the character's YIELD tendency (its breath),
  //   NOT its note length: a march's tread is detached yet relentless (it carries straight through), a singing line yields
  //   and breathes. So scale the lift from `breath` — a driving march barely lifts, a cantabile breathes freely. [P]
  const lift = Math.max(0, ((chr.breath ?? 0.6) - 0.45)) * 1.3;   // march(0.5)→~0.07 carries the tread; cantabile(0.9)→~0.59 breathes
  breatheLH(lh, { barU, beatLen, cadBars: new Set((plan.cadences || []).map(c => c.bar)), nbars, lift, melody: rh, tonic, mode });
  // RESPOND TO THE MELODY'S BREATHS — the accompaniment's per-breath choice (continue / yield / answer), leaning by the
  //   character's ESSENCE: DRIVE continues the groove (move-bias), STILLNESS yields and breathes with the song (breath-bias,
  //   +legato), PLAY answers (playful/lilt). Runs BEFORE the accidental pass so a yield that breathes out a V is caught. [P]
  const breathDisposition = {
    continue: (chr.move ?? 0.5) * (1 - (chr.breath ?? 0.6)) * 3 + 0.1,   // GROOVE-drive = moves a lot AND doesn't yield (a march/dance's essential pulse); ~0 for a still song, so a cantabile rarely plows through its own breath. Small floor keeps it reachable.
    yield: (chr.breath ?? 0.6) * (chr.artic === 'legato' ? 1.4 : 1),     // STILLNESS = breathes WITH the song (esp. legato)
    answer: chr.figure === 'playful' ? 0.55 : chr.feel === 'lilt' ? 0.4 : chr.feel === 'crisp' ? 0.2 : 0.1,   // PLAY = converses (a minuet/dance tosses the motif)
  };
  lh = respondToBreaths(lh, { plan, tonic, mode, melody: rh, range: bassRange, beatLen, disposition: breathDisposition, legato: chr.artic === 'legato', rnd: Math.random });
  // COORDINATE THE CRISP BUTTON CLOSE — if the melody stamped the ending (final bar = short tonic + air), the bass buttons
  //   WITH it: the structural tonic stamped on the downbeat, then silence, so both hands end together, not the bass adding a
  //   lone afterthought beat. Only when the melody buttoned; a held close is untouched. [P]
  if (rh.length && rh[rh.length - 1].rest && lh.length) {
    const total = rh.reduce((s, n) => s + n.d, 0), finalStart = total - barU;
    let closePitch = null; for (let k = lh.length - 1; k >= 0; k--) if (!lh[k].rest) { closePitch = lh[k].m; break; }
    let t = 0; const kept = []; for (const n of lh) { const nt = t; t += n.d; if (nt < finalStart - 1e-9) kept.push(n); }
    const soundD = barU / 2;   // match the melody's button proportion (half the bar plays, half breathes)
    if (closePitch != null) { kept.push({ m: closePitch, d: soundD }); if (barU - soundD > 1e-9) kept.push({ rest: true, d: barU - soundD }); lh = kept; }
  }
  // (the bare-leading-tone naturalise pass is gone: breatheLH now REFUSES to lift a beat that would strand a hollow ^7,
  //  so the sharp is never left unsupported in the first place — decided at the moment of the breath, not repaired after.)
  // (the final-6/4 correction is gone: structuralBassLine now excludes the fifth at the closing tonic outright — a 6/4 is
  //  not a cadential close — so the last bass is root, or the third if the box forces it, never the fifth. Fixed at source.)
  // per-bar chord symbol (for the chord-aware harmony checks + audits). Emergent/tonicised bars use their base degree.
  const prog = plan.chords.map(c => (ROMAN[mode][((c.deg % 7) + 7) % 7] || 'I'));

  const ex = {
    grade, time, key: keyStr, mode, flat, tempo: opts.tempo || chr.tempo,
    rh, lh, _mel: 'rh', _barU: barU, partial: 0,
    _prog: prog, _prog2: prog.map(() => null),
    _char: chr.id, _texture: texture, _compose: true,
    _events: plan.events.map(e => ({ deg: e.deg, q: e.q, fn: e.fn, start: e.start, dur: e.dur, bassDeg: e.bassDeg, sec: !!e.sec, is64: !!e.is64 })),  // for the composer-likeness audit (strip before persisting)
    _cadences: (plan.cadences || []).map(c => ({ bar: c.bar, type: c.type })),
  };
  dress(ex, chr, drama);
  articulate(ex, chr, grade);
  if (gp.rhythmDevices?.anacrusis) addAnacrusis(ex, { tonic, mode, beatLen, grade, range: melRange, chrId: chr.id, rnd: Math.random });   // the pickup is a GRADE-CANVAS device (the exam introduces it at grade 4); WHETHER a character leads in is still its own lean, but only where the grade admits it. (before fingering, so the pickup is fingered too)
  const _fg = resolveFingering(ex); ex.rhFinger = _fg.rh; ex.lhFinger = _fg.lh;   // attach the resolved fingering so `ex` matches the studio contract (bank persistence reads rhFinger/lhFinger)
  return ex;
}

// rough crotchet-BPM per tempo mark, so staccato can reason about a note's REAL duration in seconds (a semiquaver is
//   crisp and playable staccato at Adagio, a blur at Allegro). [ported from generator.mjs]
const TEMPO_BPM = { 'Adagio espressivo': 56, 'Andante cantabile': 74, 'Andante': 76, 'Moderato': 96, 'Maestoso': 72,
  'Tempo di minuetto': 120, 'Alla marcia': 108, 'Allegretto': 112, 'Scherzando': 138, 'Allegro': 132, 'Tempo di Valse': 168 };

// ARTICULATION — how a composer marks the line, following the character's fundamental nature. A LEGATO character phrases
//   in SLURS (derived from the real phrase runs between breaths); a DETACHED one STACCATOS its short notes, but only
//   where the note lasts long enough to actually articulate at the true tempo (the playability gate); an ACCENTED
//   character stresses the downbeats; a FERMATA is a grade-4 expressive close. Each a lean with a musical cause. [P]
function articulate(ex, chr, grade, rnd = Math.random) {
  const bpm = TEMPO_BPM[ex.tempo] || 96, canStac = d => d * (60 / bpm) >= 0.14;
  const barU = ex._barU, legato = chr.artic === 'legato', detached = chr.artic === 'detached';
  // 1) STACCATO — leggiero is a touch on the FAST, LIGHT phrases, coherent per PHRASE (a composer detaches a passage, not a
  //    scatter of single notes). WHICH phrases get it emerges from their OWN speed — a run of quick notes invites it, a
  //    lyrical span of long notes does not — and how readily the character reaches for it scales with its DETACHMENT: a
  //    detached march re-articulates its whole tread, a lively dance leggieros its quick figures, a smooth flowing line only
  //    its very fastest runs. So a phrase is leggiero when its quick-note fraction clears the bar `1 - stac`; no per-piece
  //    coin, no blanket clip of every quick note. [P]
  if (!legato) {
    const stacDurMax = detached ? 1 : 0.5;
    // a staccato CLIPS a note to leave note-then-silence, so it fits an UNDOTTED value with room to clip. It does NOT belong
    //   on (a) a DOTTED value (the dot is a length/lilt gesture — a composer writes a plain shorter note + rest instead), or
    //   (b) the short note that COMPLETES a dotted figure (that tail is an upbeat leading INTO the next beat, not detached).
    const DOTTED = [0.375, 0.75, 1.5, 3];
    const isDotted = d => DOTTED.some(x => Math.abs(d - x) < 1e-6);
    const eligible = (seq, i) => { const n = seq[i];
      if (n.rest || i >= seq.length - 1) return false;
      if (n.d > stacDurMax || !canStac(n.d)) return false;             // within the character's staccato window + playable at tempo
      if (isDotted(n.d)) return false;                                 // (a) never clip a dotted (lilt) value
      const prev = i > 0 ? seq[i - 1] : null;
      if (prev && !prev.rest && isDotted(prev.d)) return false;        // (b) never clip the tail that completes a dotted figure
      if (seq[i + 1] && seq[i + 1].rest) return false;                 // (c) a rest already detaches the note — a dot would be redundant
      return true; };
    const speedBar = 1 - (chr.stac ?? 0);                             // detached/high-stac → a low bar (most phrases qualify); smooth/low-stac → a high bar (only the fastest runs)
    const seqs = detached ? [ex.rh, ex.lh] : [ex.rh];                 // a detached tread takes the leggiero in the LH too
    for (const seq of seqs) {
      // segment into PHRASES (runs between rests); a phrase is leggiero when its quick-note fraction clears the character's bar
      let s = -1;
      const flush = e => { if (s >= 0 && e >= s) {
        let quick = 0, tot = 0; for (let i = s; i <= e; i++) { if (seq[i].rest) continue; tot++; if (eligible(seq, i)) quick++; }
        if (detached || (tot > 0 && quick / tot >= speedBar)) for (let i = s; i <= e; i++) if (eligible(seq, i)) seq[i].art = '-.';
      } s = -1; };
      for (let i = 0; i < seq.length; i++) { if (seq[i].rest) flush(i - 1); else if (s < 0) s = i; }
      flush(seq.length - 1);
    }
  }
  // 2) ACCENTS — an accented character stresses the strong beats (restrained); never on a note already staccato.
  if (chr.accent >= 0.25) {
    let t = 0; ex.rh.forEach(n => { const strong = (((t % barU) + barU) % barU) < 1e-9; if (!n.rest && strong && !n.art && rnd() < chr.accent * 0.7) n.art = '->'; t += n.d; });
  }
  // 2b) TENUTO ('--') — a Grade-4 gentle LEAN (ABRSM introduces it): the lyrical counterpart to the accent. A legato line
  //   that does NOT accent still leans on its expressive PEAK — weight without attack. Placed on the highest SUSTAINED
  //   (>= a beat) un-marked note of the line, at most one; emergent (the melodic peak), for the smooth/legato characters
  //   that carry no accents. A line with no sustained high point gets none. [P]
  if (grade >= 4 && legato && chr.accent < 0.25) {
    let peakIdx = -1, peakM = -Infinity;
    for (let i = 0; i < ex.rh.length; i++) { const n = ex.rh[i];
      if (n.rest || n.art || n.ferm || n.d < 1 - 1e-9) continue;                    // a sustained (>= a beat), un-marked note
      const m = Array.isArray(n.m) ? Math.max(...n.m) : n.m;
      if (m > peakM) { peakM = m; peakIdx = i; } }
    if (peakIdx >= 0) ex.rh[peakIdx].art = '--';                                    // lean the expressive peak
  }
  // 3) SLURS — a legato/mixed character slurs each phrase: a run of notes between breaths (rests), skipping any run that
  //    holds a staccato. A detached character re-articulates every note, so it doesn't slur.
  if (!detached) {
    const lean = legato ? 0.95 : 0.6; let s = -1;
    const close = e => { if (s >= 0 && e - s >= 1) { let ok = true; for (let k = s; k <= e; k++) if (ex.rh[k].art === '-.') ok = false; if (ok && rnd() < lean) { ex.rh[s].slur = '('; ex.rh[e].slur = ')'; } } s = -1; };
    for (let i = 0; i < ex.rh.length; i++) { if (ex.rh[i].rest) close(i - 1); else if (s < 0) s = i; }
    close(ex.rh.length - 1);
  }
  // 4) FERMATA — grade 4 only (ABRSM), an expressive character, on the FINAL note, at most one.
  if (grade >= 4 && chr.ferm > 0) {
    const last = [...ex.rh].reverse().find(n => !n.rest);
    // WHETHER this piece holds its ending with a fermata is the character's repose as a weighted lean (both outcomes
    //   reachable) — a reposeful lyrical/grand character often holds, a driving one rarely; expressed as a weighted pick,
    //   not a bare probability compare.
    const takeFerm = (() => { const w = { hold: chr.ferm, plain: 1 - chr.ferm }; let r = Math.random() * (w.hold + w.plain); for (const k of ['hold', 'plain']) if ((r -= w[k]) < 0) return k === 'hold'; return false; })();
    if (last && takeFerm) { last.ferm = true;
      const lhLast = [...ex.lh].reverse().find(n => !n.rest); if (lhLast) lhLast.ferm = true; }   // a fermata holds BOTH hands — mark the LH's final sounding note so the held chord is notated in both staves
  }
  // 5) FLOOR — no piece is left UNPHRASED: if nothing landed above (the leans all missed), slur the longest phrase run.
  //    A composer always phrases; this is the minimum, and which articulation dominates stays character-driven above.
  if (!ex.rh.some(n => n.art || n.slur || n.ferm)) {
    let bestS = -1, bestLen = 0, s = -1;
    for (let i = 0; i <= ex.rh.length; i++) {
      if (i < ex.rh.length && !ex.rh[i].rest) { if (s < 0) s = i; }
      else { if (s >= 0 && i - s > bestLen) { bestLen = i - s; bestS = s; } s = -1; }
    }
    if (bestS >= 0 && bestLen >= 2) { ex.rh[bestS].slur = '('; ex.rh[bestS + bestLen - 1].slur = ')'; }
  }
}

// ANACRUSIS (upbeat start) — WHETHER a tune leads INTO its first downbeat or plants it is a phrase-opening choice a
//   composer makes at the outset, and it is character-borne: a march drives from an upbeat, a song lifts into its first
//   strong note, a lively/dance tune skips in; a waltz / minuet / Maestoso states beat 1 (the waltz needs its downbeat
//   "oom", the Maestoso its weight). So the tendency is per-character, not universal. The pickup is a one-beat scale
//   approach — a crotchet, or two quavers — RISING by step into the first downbeat note; the bass RESTS under it (a
//   melody-alone upbeat) and enters on the downbeat. Where the register/box leaves no room below the first note, the tune
//   states the beat instead (no pickup forced). Rendered through ex.partial, which the engine already threads. [P]
const ANAC = { march: 0.5, lively: 0.35, dance: 0.32, scherzo: 0.3, singing: 0.3, flowing: 0.3, lyricalslow: 0.25, gentle: 0.2, minuet: 0.15, waltz: 0.1, grand: 0.1 };
function addAnacrusis(ex, { tonic, mode, beatLen, grade, range, chrId, rnd = Math.random }) {
  if (ex.partial) return;
  const first = ex.rh[0]; if (!first || first.rest) return;
  if (rnd() >= (ANAC[chrId] ?? 0.2)) return;                                   // this character states the beat this time
  const [lo, hi] = range;
  const m0 = Array.isArray(first.m) ? Math.max(...first.m) : first.m;
  const scale = (mode === 'min' ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11]).map(s => (((tonic % 12) + s) % 12));
  const isScale = m => scale.includes((((m % 12) + 12) % 12));
  const stepBelow = m => { for (let p = m - 1; p >= m - 3; p--) if (isScale(p)) return p; return null; };   // nearest scale tone below (a step, or a step-and-a-half over a gap)
  const s1 = stepBelow(m0); if (s1 == null || s1 < lo) return;                 // no room below in the register / five-finger box → state the beat
  const p = beatLen;                                                          // a one-beat pickup
  let pickup;
  if (rnd() < 0.5) { const s2 = stepBelow(s1); pickup = (s2 != null && s2 >= lo) ? [{ m: s2, d: p / 2 }, { m: s1, d: p / 2 }] : [{ m: s1, d: p }]; }   // two quavers stepping up, or one crotchet
  else pickup = [{ m: s1, d: p }];
  if (first.dyn) { pickup[0].dyn = first.dyn; delete first.dyn; }             // the opening dynamic / hairpin / phrase-slur belongs ON the upbeat (the first sounding note)
  if (first.hp) { pickup[0].hp = first.hp; delete first.hp; }
  if (first.slur === '(') { pickup[0].slur = '('; delete first.slur; }
  ex.rh = [...pickup, ...ex.rh];
  ex.lh = [{ rest: true, d: p }, ...ex.lh];                                    // bass silent under the upbeat, entering on the downbeat
  ex.partial = p;
}

// ---- DYNAMICS — COHERENT by construction. Each phrase gets a LEVEL from the shared drama arc (louder toward the climax,
//   softer at the ends), so the sequence of dynamics follows one shape. A change between phrases is marked either with a
//   HAIRPIN (a lyrical/high-`hair` character — gradual) or a bare LETTER jump (a bold/low-`hair` character — terraced).
//   Crucially the hairpin DIRECTION is DERIVED from the level change (louder → cresc, softer → dim), so a diminuendo can
//   never resolve onto a louder mark. Every mark has a cause: the phrase's place in the arc. [P]
function dress(ex, chr, drama) {
  const LADDER = ['pp', 'p', 'mp', 'mf', 'f', 'ff'];
  const band = chr.dyn.map(d => LADDER.indexOf(d)).filter(i => i >= 0);
  const loI = band.length ? Math.min(...band) : 1, hiI = band.length ? Math.max(...band) : 2;
  const cl = x => Math.max(0, Math.min(1, x));
  const lvlI = ten => Math.max(0, Math.min(LADDER.length - 1, loI + Math.round((hiI - loI) * cl(ten))));   // integer level index
  const barU = drama.barU, total = drama.nbars * barU;
  let t = 0; const idx = []; ex.rh.forEach((n, i) => { if (!n.rest) idx.push({ i, t }); t += n.d; });
  if (idx.length < 2) { if (idx.length) ex.rh[idx[0].i].dyn = LADDER[lvlI(0.4)]; return; }
  // phrase segments — split at a breath (rest → non-consecutive index) OR a 2-bar group boundary.
  const segs = []; let cur = [], prevI = null, grp0 = null;
  for (const x of idx) { const grp = Math.floor(Math.floor(x.t / barU + 1e-9) / 2);
    if (prevI != null && (x.i !== prevI + 1 || grp !== grp0) && cur.length) { segs.push(cur); cur = []; }
    if (!cur.length) grp0 = grp; cur.push(x); prevI = x.i; }
  if (cur.length) segs.push(cur);
  // the ARC: open SOFT (band floor), climax LOUD (band ceiling — always louder than the ends), close SOFT. This is
  //   coherent by construction — the climax is the single loud point, so a cresc into it and a dim out of it always have
  //   the right direction. Differentiated by character: SHAPED draws it as hairpins, TERRACED as stepped letters; and the
  //   BAND itself is the character's (a march arcs mf→f→mf, a cantabile pp→p→pp). [P]
  const climaxT = (drama.climaxBar + 0.5) * barU;
  const climax = idx.reduce((b, x) => Math.abs(x.t - climaxT) < Math.abs(b.t - climaxT) ? x : b);
  const last = idx[idx.length - 1];
  // hairpin (draw the change gradually) vs terrace (stamp the new letter) is the character's genuine dynamic IDIOM, a
  //   weighted LEAN on `hair` over a two-option spread — both reachable, decided once per piece for coherence. This
  //   replaces the old hard wall `chr.hair >= 0.55`, which walled each character 100% into one mode at a hundredth and
  //   silently dropped every below-wall character's within-level swell. A within-level swell and a level-change letter are
  //   NOT leaned — they follow the material (a swell has no notation but a hairpin; a level change must be marked). [P]
  const wpick = w => { const ks = Object.keys(w); const tot = ks.reduce((s, k) => s + w[k], 0); let r = Math.random() * tot; for (const k of ks) if ((r -= w[k]) < 0) return k; return ks[ks.length - 1]; };
  const hairW = cl(chr.hair), gradual = wpick({ grad: hairW, step: 1 - hairW }) === 'grad';
  if (hiI <= loI) { ex.rh[idx[0].i].dyn = LADDER[loI]; return; }               // single-level band → nothing to shape
  // The dynamic design IS this piece's drama: the LETTER at the open, the peak and the close is the drama's own level
  //   mapped onto the character's band. The climax is the drama's OWN peak — no floor, no reserved top level; it is as
  //   loud as the drama actually reaches. A letter is placed ONLY where the level CHANGES; a rise/fall WITHIN one level
  //   is shaped by a HAIRPIN (a swell — messa di voce), never by promoting the letter to one the music never reaches. The
  //   character's `hair` chooses gradual (hairpins) over terraced (bare letters). Nothing repeats the level already
  //   sounding, so there is nothing to dedup. [P]
  const openLvl = lvlI(drama.tensionAt(idx[0].t));
  const closeLvl = lvlI(drama.tensionAt(last.t + (ex.rh[last.i].d || 0)));      // the drama's level at the END of the last note
  const climaxLvl = lvlI(drama.peak ?? 1);                                     // the climax = the drama's peak, mapped to the band
  ex.rh[idx[0].i].dyn = LADDER[openLvl];
  const midClimax = climax.i > idx[0].i && last.i > climax.i;
  if (midClimax && climaxLvl > openLvl) {                                      // a real rise to an interior climax
    if (gradual) ex.rh[idx[0].i].hp = '\\<';
    ex.rh[climax.i].dyn = LADDER[climaxLvl];
    if (closeLvl < climaxLvl) { if (gradual) ex.rh[climax.i].hp = '\\>'; ex.rh[last.i].dyn = LADDER[closeLvl]; }
  } else if (closeLvl > openLvl) {                                             // a build to a stronger close
    if (gradual) ex.rh[idx[0].i].hp = '\\<';
    ex.rh[last.i].dyn = LADDER[closeLvl];
  } else if (closeLvl < openLvl) {                                             // open engaged, settle or die away
    if (gradual) ex.rh[idx[0].i].hp = '\\>';
    ex.rh[last.i].dyn = LADDER[closeLvl];
  } else if (midClimax && (drama.peak ?? 0) > drama.tensionAt(idx[0].t) + 0.12) {   // level FLAT but the drama swells → a messa di voce is the ONLY notation (material-forced, not leaned)
    // the level never changes, yet the drama swells to a peak within it → a MESSA DI VOCE (swell to the peak, ebb back)
    ex.rh[idx[0].i].hp = '\\<'; ex.rh[climax.i].hp = '\\>'; ex.rh[last.i].hp = '\\!';
  }
  // Intermediate terrace steps (terraced characters only) ONLY where the level actually CHANGES from what is currently
  //   sounding — a composer re-marks a dynamic to change it, never to repeat the same one phrase after phrase — and only
  //   moving WITH the arc. This keeps the design to the few marks the drama earns, not a mark per segment. [P]
  if (!gradual && drama.nbars >= 12) {                                          // a STEPPED (terraced) piece marks graded interior letters; a gradual piece uses hairpins instead. A SHORT piece is shaped by its open/climax/close alone.
    let lastLvl = openLvl;
    for (const seg of segs) { const x = seg[0];
      if (ex.rh[x.i].dyn) { lastLvl = LADDER.indexOf(ex.rh[x.i].dyn); continue; }
      if (x.i === idx[0].i || x.i === climax.i || x.i === last.i) continue;
      const rising = x.t < climaxT; const lvl = lvlI(0.12 + 0.85 * drama.tensionAt(x.t));
      if (lvl === lastLvl || lvl <= loI || lvl >= hiI) continue;                 // no repeat, stay strictly inside the band
      if ((rising && lvl > lastLvl) || (!rising && lvl < lastLvl)) { ex.rh[x.i].dyn = LADDER[lvl]; lastLvl = lvl; }
    }
  }
  // A HAIRPIN MAY NOT CROSS A BOTH-HANDS REST [P — you cannot change loudness through silence]. Where a cresc/dim would
  //   span a moment when BOTH hands are silent, END it on the last sounding note before the rest (\!), and RESUME the
  //   level + hairpin on the first sounding note AFTER the rest (the mark sits after the breath, not through it). If the
  //   note after the rest already carries the target dynamic, the hairpin simply ends before the breath and that mark
  //   lands after it. Idiomatic: the phrase breathes, then the shape continues.
  const lhTL = []; { let tt = 0; for (const n of ex.lh) { lhTL.push({ t: tt, e: tt + n.d, rest: !!n.rest }); tt += n.d; } }
  const lhSilentAt = tt => !lhTL.some(x => x.t <= tt + 1e-9 && x.e > tt + 1e-9 && !x.rest);
  const rhTL = []; { let tt = 0; ex.rh.forEach((n, i) => { rhTL.push({ i, t: tt, e: tt + n.d, n }); tt += n.d; }); }
  let openDir = null, srcLvl = loI;
  for (let k = 0; k < rhTL.length; k++) {
    const e = rhTL[k], n = e.n;
    if (n.hp === '\\<') { openDir = '\\<'; srcLvl = n.dyn ? LADDER.indexOf(n.dyn) : loI; }
    else if (n.hp === '\\>') { openDir = '\\>'; srcLvl = n.dyn ? LADDER.indexOf(n.dyn) : hiI; }
    else if (n.hp === '\\!') openDir = null;
    else if (n.dyn) openDir = null;                                            // a plain dynamic closes the open hairpin
    if (!openDir || n.rest) continue;
    let j = k + 1; while (j < rhTL.length && rhTL[j].n.rest) j++;              // the next SOUNDING rh note
    if (j >= rhTL.length) continue;
    let sil = false; for (let s = k + 1; s < j; s++) { const r = rhTL[s]; if (r.n.rest && lhSilentAt((r.t + r.e) / 2)) { sil = true; break; } }
    if (!sil) continue;
    if (n.hp === openDir) n.hp = null;                                         // the hairpin STARTED here but a silence follows at once → move the start past the rest
    else n.hp = '\\!';                                                         // otherwise close the open hairpin before the silence
    const after = rhTL[j].n;
    if (!after.dyn) { after.dyn = LADDER[srcLvl]; after.hp = openDir; }        // resume after the breath: restate the level, reopen toward the pending target
    else openDir = null;                                                       // the note after the breath already carries a mark (the reached target) → leave it, stay ended
  }
}
