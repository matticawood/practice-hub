import { fingerHandDP } from './fingering.mjs';   // to negotiate NOTES against the HAND: a composer writes a playable line
// compose.mjs — the composer-model generation core. See COMPOSER-MODEL.md for the reasoning this implements.
//
// Direction of composition (the inversion): HARMONY first → melody as its ornamentation → bass through the SAME
// chords. Built in stages; the old generator.mjs stays live until this is proven and swapped.
//
//   STAGE 1 (this file, so far): the HARMONIC FRAME — a functional plan drawn from the grade-gated palette, with
//   its own harmonic rhythm and cadence goals. Structural backbone only; embellishing chords + tonicisation are
//   Stage 4. Everything here is a weighted PREFERENCE except [T] definitional theory and [C] grade-canvas limits.
//
// A weighted pick — the weights ARE the reasoning; nothing is zero-forbidden unless it's [T]/[C]. (A near-never
// move is a tiny weight, not an omission, so it stays reachable — a composer can do anything, some things never.)
export function pick(weights, rnd = Math.random) {
  const es = Object.entries(weights).filter(([, w]) => w > 0);
  const tot = es.reduce((a, [, w]) => a + w, 0);
  if (!tot) return null;
  let r = rnd() * tot;
  for (const [k, w] of es) { r -= w; if (r <= 0) return k; }
  return es[es.length - 1][0];
}

// ---- pitch/chord helpers (used by the plan, the melody and the bass — one source of truth for what a chord IS).
const SCALE = { maj: [0, 2, 4, 5, 7, 9, 11], min: [0, 2, 3, 5, 7, 8, 10] };   // natural scales (minor's raised ^7 lives in the V chord's tones)
const CHORD_IV = { maj: [0, 4, 7], min: [0, 3, 7], dim: [0, 3, 6], aug: [0, 4, 8] };
const scalePitch = (tonic, mode, d) => { const o = Math.floor(d / 7), i = ((d % 7) + 7) % 7; return tonic + o * 12 + SCALE[mode][i]; };
// chord-tone pitch-classes of a chord. An ABSOLUTE triad on a diatonic root — so a secondary dominant's chromatic
// third (a raised leading tone of its target) falls out correctly, and a minor V's raised ^7 too (reads the quality).
function chordPCs(tonic, mode, chord) {
  const rootPitch = scalePitch(tonic, mode, chord.deg);
  return (CHORD_IV[chord.q] || CHORD_IV.maj).map(iv => (((rootPitch + iv) % 12) + 12) % 12);
}
const isChordTone = (p, pcs) => pcs.includes(((p % 12) + 12) % 12);
const nearestPC = (pcs, ref, lo, hi) => {   // nearest pitch in [lo,hi] whose pc is in pcs, to ref
  let best = null, bd = 1e9;
  for (let p = lo; p <= hi; p++) if (isChordTone(p, pcs) && Math.abs(p - ref) < bd) { bd = Math.abs(p - ref); best = p; }
  return best;
};

// ================= the DRAMATIC PLAN — the top-down spine every layer reads =================
// A composer first fixes the phrase's shape: where it builds, its ONE climax, where it resolves. That intent then
// GOVERNS harmony (rate + aim), the melodic registral peak, the inversions, the texture and the dynamics — so the
// piece is dramatically COHERENT, not a pile of locally-correct layers. The shape is a preference [P]; the cadence
// goals are the fixed points. tensionAt(t) ∈ [0,1] is the single curve all layers consult.
export function dramaticPlan({ nbars, barU, beatLen = 1, form, character = {}, rnd = Math.random }) {
  const total = nbars * barU;
  const cadences = form.cadences || [];
  const finalCad = cadences.length ? Math.max(...cadences.map(c => c.bar)) : nbars - 1;
  // ONE climax, deliberately PLACED (never a fixed golden fraction): in the second half, before the final cadence;
  //   a driving character peaks later, a gentle one earlier — but the exact bar varies piece to piece. [P]
  const lo = Math.max(1, Math.round(nbars * 0.4)), hi = Math.max(lo, finalCad - 1);
  // The DRAMATIC ARC is the CHARACTER'S TEMPERAMENT laid over the FORM — not a stamped archetype. Each shaping quantity
  //   emerges from a real trait; a genuine per-piece expressive spread (the composer's freedom for THIS piece) keeps two
  //   same-character pieces distinct. [P]
  const c01 = x => Math.max(0, Math.min(1, x));
  const acc = character.accent ?? 0, mv = character.moveBias ?? 0.5, late = character.climaxLate ?? 0.5;
  const vary = s => (rnd() - 0.5) * 2 * s;                                        // symmetric expressive spread, half-width s
  // PEAK — how intense the high point: the character's own intensity (its weight and its drive) sets the CENTRE; the exact
  //   height is the composer's expressive choice for THIS piece, so a bold character writes both a moderate and a blazing
  //   climax. A wide spread — not a fixed height.
  const peak0 = c01(0.60 + 0.32 * c01(0.5 * acc + 0.5 * mv) + vary(0.18));
  // OPEN — largely the composer's expressive choice for THIS piece (a march may open soft and build, or state with
  //   weight), leaning only mildly toward more weight for an emphatic character. A WIDE spread, not a lock.
  const openT = c01(0.10 + 0.12 * acc + vary(0.28));
  // CLOSE — a driving temperament (movement + weight) leans toward a strong close, a still one settles or dies away; but
  //   a wide expressive spread, so one march may settle where another drives to a triumphant close.
  const closeT = c01(0.15 + 0.50 * c01(0.5 * mv + 0.5 * acc) + vary(0.28));
  // keep the peak the clear high point (a discernible climax the whole machine reads), just above both ends.
  const peak = c01(Math.max(peak0, openT + 0.12, closeT + 0.08));
  // CLIMAX BAR — from the FORM: in the second half, before the final cadence; a driving character presses it later.
  const climaxBias = c01(0.30 + 0.45 * late + vary(0.22));
  const climaxBar = Math.min(hi, Math.max(lo, lo + Math.round((hi - lo) * climaxBias)));
  const cx = (climaxBar + 0.55) * barU / total;
  // the arc: open at openT, rise to `peak` at the climax, fall to closeT — a shaped curve with one clear peak. [P]
  const tensionAt = t => { const x = Math.max(0, Math.min(1, t / total));
    const v = x <= cx ? openT + (peak - openT) * (x / Math.max(1e-6, cx))
                      : peak  - (peak - closeT) * ((x - cx) / Math.max(1e-6, 1 - cx));
    return Math.max(0, Math.min(1, v)); };
  return { climaxBar, cx, tensionAt, peak, openT, closeT, cadences, finalCad, nbars, barU };
}

// ---- DIATONIC palette: scale-degree (0..6) → { quality, function }. [T] the functional grammar of tonal harmony;
// [P] the ambiguous assignments (iii/vi as AWAY vs tonic-substitute) are a modelling choice, softened by the grammar.
// function: T tonic (home) · AWAY departure · PD predominant (build) · D dominant (tension, resolves).
const DIATONIC = {
  maj: [
    { deg: 0, q: 'maj', fn: 'T'    },  // I
    { deg: 1, q: 'min', fn: 'PD'   },  // ii
    { deg: 2, q: 'min', fn: 'AWAY' },  // iii
    { deg: 3, q: 'maj', fn: 'PD'   },  // IV
    { deg: 4, q: 'maj', fn: 'D'    },  // V   (its leading tone is diatonic in major)
    { deg: 5, q: 'min', fn: 'AWAY' },  // vi
    { deg: 6, q: 'dim', fn: 'D'    },  // vii°
  ],
  // minor: the DOMINANT is major (harmonic-minor raised leading tone) — [T] that's what makes a minor cadence
  // authentic (see sr-minor-three-types). III is the relative major (the one diatonic tonicisation target).
  min: [
    { deg: 0, q: 'min', fn: 'T'    },  // i
    { deg: 1, q: 'dim', fn: 'PD'   },  // ii°
    { deg: 2, q: 'maj', fn: 'AWAY' },  // III (relative major)
    { deg: 3, q: 'min', fn: 'PD'   },  // iv
    { deg: 4, q: 'maj', fn: 'D'    },  // V  (raised ^7)
    { deg: 5, q: 'maj', fn: 'AWAY' },  // VI
    { deg: 6, q: 'maj', fn: 'AWAY' },  // VII (subtonic; the ♭VII→III relative-major move)
  ],
};

// FUNCTIONAL SYNTAX as weighted successors ([P] — a strong idiom, ~90%, NOT a hard rule). The journey is
// T → (AWAY) → PD → D → resolve. The dominant RESOLVES [T near-definitional]: to T (authentic) or AWAY/vi
// (deceptive) — never drifting nowhere, and retrogression (D→PD) is a heavy lean against, not a wall.
const NEXT_FN = {
  T:    { AWAY: 3, PD: 3, D: 2, T: 1 },   // leave home: depart, or build, or straight to tension; occasionally prolong
  AWAY: { PD: 4, D: 2, AWAY: 1, T: 1 },   // a departure heads toward the build
  PD:   { D: 5, PD: 2, T: 1 },            // predominant strongly wants the dominant
  D:    { T: 5, AWAY: 1 },                // dominant resolves: authentic to T, or deceptive to a submediant (AWAY)
};

// pick a specific chord to realise a target function, weighted; grade prunes the palette elsewhere.
function chordForFunction(mode, fn, rnd, opts = {}) {
  const pool = DIATONIC[mode].filter(c => c.fn === fn);
  if (!pool.length) return DIATONIC[mode][0];
  // [P] within a function, lean to the primary members: PD → IV/ii over ii°; D → V over vii°; AWAY → vi over iii.
  //   plus a mild TRAVEL lean toward a chord not yet used, for harmonic interest off the I-IV-V rut — never a wall
  //   (the tonic is revisited freely; this only breaks ties toward variety). [P]
  const visited = opts.visited;
  const wt = c => {
    let w = 1;
    if (fn === 'PD') w = c.deg === 3 ? 3 : c.deg === 1 ? 2 : 1;         // IV, ii, (ii°)
    else if (fn === 'D')  w = c.deg === 4 ? 4 : 1;                      // V over vii°
    else if (fn === 'AWAY') w = c.deg === 5 ? 3 : c.deg === 2 ? 2 : 1;  // vi, III/iii, VI/VII
    if (visited && !visited.has(((c.deg % 7) + 7) % 7)) w *= 1.7;       // travel toward an unused colour (interest)
    return w;
  };
  const w = {}; pool.forEach((c, i) => { w[i] = wt(c); });
  return pool[+pick(w, rnd)];
}

// ---- the harmonic PLAN: structural functional chords over a phrase, with an INDEPENDENT harmonic rhythm and
// cadence goals. [P] harmonic rhythm is a style choice, decoupled from any melody (§3 of the model).
//
// form: { nbars, cadences: [{ bar, type }] } where type ∈ 'HC' (half, ends on D) | 'PAC'|'IAC' (authentic, D→T)
//       | 'DC' (deceptive, D→AWAY) | 'continuous' (no stop). bar is the LAST bar of that phrase.
// Harmonic RHYTHM is not a flat "hold N bars" constant — it emerges from the journey's `pace` (character moveBias × drama
//   tension): a chord holds one or more strong-beat slots, quicker into cadences, slower at repose (see `pace` below). [P]
export function harmonicPlan({ grade, mode, barU, beatLen = 1, form, character = {}, drama = null, rnd = Math.random }) {
  const nbars = form.nbars;
  const diat = DIATONIC[mode];
  const tonic = diat[0], dom = diat.find(c => c.fn === 'D' && c.deg === 4) || diat[4];

  // 1. cadence goals pin specific bars: the LAST bar of a cadenced phrase carries the arrival chord, the bar
  //    before it carries the dominant that leads to it.
  const pinned = {};   // bar -> chord (structural pillar the plan must hit)
  for (const cad of form.cadences || []) {
    const b = cad.bar;
    if (cad.type === 'HC') { pinned[b] = dom; }                                   // half cadence: arrive ON the dominant
    else if (cad.type === 'DC') { pinned[b] = chordForFunction(mode, 'AWAY', rnd); if (b - 1 >= 0) pinned[b - 1] = dom; }
    else if (cad.type === 'PAC' || cad.type === 'IAC') { pinned[b] = tonic; if (b - 1 >= 0) pinned[b - 1] = dom; }
    // 'continuous' pins nothing — the phrase flows through.
  }
  pinned[0] = pinned[0] || tonic;   // [T] state the key at the open (a tonic pillar)

  // 2. THE PHRASE JOURNEY [P — how a composer plans harmony]. Not a chord-to-chord walk: each PHRASE (bounded by its
  //    cadence bar) is a shape — HOME (the tonic) → DEPART (a predominant, or a colour: vi/III) → build to the DOMINANT
  //    → the cadence. The DEPARTURE is where the interest lives, and the consequent departs DIFFERENTLY from the
  //    antecedent (a period contrasts its two limbs). Every option stays reachable (weighted), so a plain tonic-dominant
  //    phrase can still surface — but the default is a real journey, and a I-V seesaw is structurally impossible.
  const cadBars = new Set((form.cadences || []).map(c => c.bar));   // phrase-END bars
  const chords = new Array(nbars);
  const visited = new Set();
  for (let b = 0; b < nbars; b++) if (pinned[b]) { chords[b] = pinned[b]; visited.add(((pinned[b].deg % 7) + 7) % 7); }
  const cadSorted = [...cadBars].sort((a, b) => a - b);
  const phrases = []; { let s = 0; for (const cb of cadSorted) { if (cb >= s) phrases.push({ s, e: cb }); s = cb + 1; } if (s < nbars) phrases.push({ s, e: nbars - 1 }); }
  // a DEPARTURE chord: a predominant (the classic build) or a colour (vi/III), the real seat of harmonic interest.
  //   Leaning toward a FRESH colour (one not yet visited) is what contrasts a period's two limbs on its own: once the
  //   antecedent has departed to (say) IV, IV is "visited", so the consequent leans toward a chord it has NOT used — a
  //   contrasting departure. That is a preference, not a rule: a parallel period (the consequent restating the same
  //   departure, only the cadence differing) still surfaces, as a composer writes both. No separate contrast penalty. [P]
  // ESTABLISH-THEN-COLOUR: a key is not a fact until a PRIMARY triad has stated it. Until a IV or V has grounded the tonic,
  //   a departure to the mediant (iii = the relative's dominant) or submediant (vi = the relative's tonic) hands the ear the
  //   relative minor's own furniture and the written key stays ambiguous. So while UNESTABLISHED the departure leans to the
  //   key-defining subdominant and away from iii/vi; the lean lifts itself the instant a primary triad has sounded, after
  //   which the full colour palette is free (that is where a composer actually reaches for the colours). Read from the
  //   progression's own state (visited), a weighting not a gate — iii/vi keep non-zero weight, a deceptive opening survives. [P]
  const established = () => visited.has(3) || visited.has(4);                   // a primary triad (IV or V) has grounded the key
  const departure = () => {
    const cands = DIATONIC[mode].filter(c => c.fn === 'PD' || c.fn === 'AWAY');
    const raw = !established();
    const wt = c => { let w = c.fn === 'PD' ? 3 : 2; if (c.deg === 3) w *= 1.4; else if (c.deg === 5) w *= 1.3;   // IV / vi the primary departures
      if (!visited.has(((c.deg % 7) + 7) % 7)) w *= 1.7;                       // a fresh colour = interest (and, for the consequent, the contrast with the antecedent's already-visited departure)
      if (raw) { if (c.deg === 3) w *= 1.6; else if (c.deg === 2) w *= 0.2; else if (c.deg === 5) w *= 0.35; }   // establish before colour: while the key is raw, lean to IV, hold back iii (rel. dominant) and vi (rel. tonic)
      return w; };
    const w = {}; cands.forEach((c, i) => w[i] = wt(c)); return cands[+pick(w, rnd)];
  };
  // one STEP of the journey: from the current chord, MOVE to a fresh chord that keeps travelling toward the dominant —
  //   never repeat the chord just heard, save the tonic/dominant for the cadence, prefer descending-fifth root motion (the
  //   strongest progression) and an unvisited colour. The bar right before the dominant is a predominant that prepares it.
  //   This is what keeps a LONG phrase moving (a period's short limbs hid it; a sentence's 8-bar span exposed a stalled PD). [P]
  const journeyStep = (prevCh, prevPrevCh, isLast) => {
    const pd = ((prevCh.deg % 7) + 7) % 7, pp = prevPrevCh != null ? ((prevPrevCh.deg % 7) + 7) % 7 : -1;
    const cands = DIATONIC[mode].filter(c => { const d = ((c.deg % 7) + 7) % 7;
      if (d === pd || d === 0 || d === 4) return false;                       // move; save home + the dominant for the cadence
      return isLast ? c.fn === 'PD' : (c.fn === 'PD' || c.fn === 'AWAY'); }); // the last free bar prepares the dominant
    if (!cands.length) return chordForFunction(mode, 'PD', rnd, { visited });
    const wt = c => { let w = c.fn === 'PD' ? 2 : 1.3;
      const step = (((c.deg - prevCh.deg) % 7) + 7) % 7;
      if (step === 3) w *= 2.0; else if (step === 6 || step === 1) w *= 1.2;  // descending fifth strongest; step motion next
      if (!visited.has(((c.deg % 7) + 7) % 7)) w *= 1.8;                      // a fresh chord = interest
      if (!established()) { const dd = ((c.deg % 7) + 7) % 7; if (dd === 3) w *= 1.5; else if (dd === 2) w *= 0.3; else if (dd === 5) w *= 0.45; }   // still establishing: keep leaning to IV, hold back iii/vi until a primary triad grounds the key
      if (((c.deg % 7) + 7) % 7 === pp) w *= 0.15;                            // DON'T SEESAW [P]: a journey MOVES FORWARD — it doesn't return to the chord two ago (IV-ii-IV-ii treads water in the predominant instead of building). A strong lean, so it still surfaces where the palette is genuinely exhausted.
      return w; };
    const w = {}; cands.forEach((c, i) => w[i] = wt(c)); return cands[+pick(w, rnd)];
  };
  // ===== the JOURNEY laid as a TIMED sequence — the harmonic RHYTHM is intrinsic to it, not a one-per-bar grid =====
  const nbeats = Math.max(1, Math.round(barU / beatLen));
  const total = nbars * barU;
  const moveBias = character.moveBias ?? 0.55;                                  // the character's harmonic PACE
  const intensityAt = drama ? (t => drama.tensionAt(t)) : (t => t / total);     // the shared tension — quicker where the drama builds
  const ckey = c => `${c.deg}|${c.q}|${c.sec ? 's' + c.of : ''}`;
  // Harmony turns over on strong-beat SLOTS: every bar downbeat + the half-bar in a DUPLE metre (4/4 beat 3, 2/4 beat 2).
  //   A 3/4 bar holds ONE harmony (the waltz/minuet idiom — one chord a bar there IS how a composer writes it). Each chord
  //   HOLDS for one or more slots by the harmonic PACE (grade × character × drama — quicker into cadences, slower at
  //   repose), so a chord lasts a beat / half-bar / bar / two bars. The functional grammar and the cadence pins are the
  //   same; only the RATE is now variable, the way a composer's harmonic rhythm actually is. [P — the harmonic rhythm is the journey's own]
  // MID-BAR chords appear at EVERY grade (real specimens change harmony more than once a bar throughout) — harmonic density
  //   is NOT a grade-difficulty marker, the RHYTHM is. So a half-bar slot exists in every DUPLE metre at every grade; how
  //   OFTEN a bar turns over is the CHARACTER's harmonic pace, not the grade. (3/4 stays per-bar — the waltz/minuet idiom.)
  const halfBar = (nbeats % 2 === 0) ? (nbeats / 2) * beatLen : null;
  const slotT = []; for (let b = 0; b < nbars; b++) { slotT.push(b * barU); if (halfBar != null) slotT.push(b * barU + halfBar); }
  const nSlot = slotT.length, barOfT = t => Math.floor(t / barU + 1e-9), downAt = t => Math.abs(((t % barU) + barU) % barU) < 1e-9;
  const slotOfBarDown = {}; slotT.forEach((t, i) => { if (downAt(t)) slotOfBarDown[barOfT(t)] = i; });
  const pace = t => Math.min(0.9, moveBias * (0.5 + 0.6 * intensityAt(t)));   // how often a bar turns over = the CHARACTER's harmonic pace × the drama (quicker into the build/cadence) — a weighted lean, the same reasoning at every grade [P]
  const sc = new Array(nSlot).fill(null);                                       // the chord sounding at each slot
  for (const b in pinned) { const si = slotOfBarDown[+b]; if (si != null) sc[si] = pinned[b]; }   // pin the structural arrivals
  for (const ph of phrases) {
    const openSlot = slotOfBarDown[ph.s];
    if (sc[openSlot] == null) sc[openSlot] = tonic;                            // OPEN on home
    let firstPin = nSlot; for (let i = openSlot + 1; i < nSlot; i++) { if (sc[i] != null || barOfT(slotT[i]) > ph.e) { firstPin = i; break; } }
    const free = []; for (let i = openSlot + 1; i < firstPin; i++) free.push(i);
    if (!free.length) continue;                                               // a cramped phrase (grade 2): open → cadence
    let cur = departure(), pp = tonic; sc[free[0]] = cur; visited.add(((cur.deg % 7) + 7) % 7);   // DEPART on the first free slot (the interest)
    if (free.length >= 3 && rnd() < (character.seqBias ?? 0.3)) {
      // SEQUENTIAL PASSAGE [P — a composer SPINS the idea: the roots move by ONE consistent interval, so the harmony
      //   sequences and the melody sequences over it. Descending fifths the workhorse. A directed, denser run of chords.]
      const rootStep = +pick({ 3: 3, 5: 1.3, 1: 1 }, rnd);
      for (let k = 1; k < free.length; k++) { const i = free[k], isLast = k === free.length - 1;
        if (isLast) { const nx = journeyStep(cur, pp, true); pp = cur; cur = nx; }
        else { const ndeg = ((((cur.deg % 7) + 7) % 7) + rootStep) % 7; const ch = DIATONIC[mode].find(c => ((c.deg % 7) + 7) % 7 === ndeg); pp = cur; cur = ch || journeyStep(cur, pp, false); }
        sc[i] = cur; visited.add(((cur.deg % 7) + 7) % 7); }
    } else for (let k = 1; k < free.length; k++) {                             // walk: MOVE at the character's pace, else HOLD; the last free slot PREPARES the dominant
      const i = free[k], isLast = k === free.length - 1;
      if (isLast || rnd() < pace(slotT[i])) { const nx = journeyStep(cur, pp, isLast); pp = cur; cur = nx; visited.add(((cur.deg % 7) + 7) % 7); }
      sc[i] = cur;                                                            // HOLD keeps cur (a chord lasting >1 slot)
    }
  }
  for (let i = 0; i < nSlot; i++) if (sc[i] == null) sc[i] = i > 0 ? sc[i - 1] : tonic;   // a held chord fills its later slots
  for (let b = 0; b < nbars; b++) chords[b] = sc[slotOfBarDown[b]] || tonic;   // per-bar view (downbeat chord) for the downstream + emergence (chords[] declared at the top)

  // 2b. GRADE-4 TONICISATION [C grade-gated + P colour]: recolour ONE approach as a secondary dominant V/x of the
  //     chord that FOLLOWS — the D→resolve grammar applied one level down (a real dominant of a diatonic target).
  //     Grades 2-3 stay inside one diatonic space (no secondary dominants). This is a colour, not a default: gather
  //     the legitimate sites, then a lean takes at most one. V/x = an absolute major triad a fifth above x, so its
  //     third is x's leading tone — chordPCs builds it, and both hands read the SAME chord, so consonance holds.
  if (grade >= 4) {
    const diatPCs = new Set(SCALE[mode]);
    const sites = [];
    for (let bb = 1; bb < nbars - 1; bb++) {
      if (pinned[bb]) continue;                                   // never overwrite a structural pillar
      const tgt = chords[bb + 1];
      if (!tgt || tgt.deg % 7 === 0 || tgt.q === 'dim') continue; // tonicising the tonic is redundant; skip diminished targets
      if (chords[bb].fn === 'D') continue;                        // don't stack two dominants
      const sec = { deg: tgt.deg + 4, q: 'maj', fn: 'D', sec: true, of: ((tgt.deg % 7) + 7) % 7 };
      const rootPitch = scalePitch(0, mode, sec.deg);
      const pcs = [0, 4, 7].map(iv => (((rootPitch + iv) % 12) + 12) % 12);
      if (pcs.every(pc => diatPCs.has(pc))) continue;             // no chromatic tone (e.g. V/IV triad = I) → not a true tonicisation
      sites.push({ bb, sec });
    }
    // WHERE it strengthens the journey most, not a random site: tonicising the structural DOMINANT (V/V, target = the
    //   dominant degree 4) is the strongest — it intensifies the approach to the cadence; otherwise the LATEST site,
    //   nearest the climax, where a chromatic colour tells most. WHETHER a piece takes one is the character's appetite for
    //   colour (chromColour), not a flat rate: the smooth/lilt singing & dance characters reach for it, the crisp
    //   military/light ones stay diatonic. At most one, and only grade 4. [P site by musical value + P character appetite]
    const appetite = character.chromColour ?? 0.15;
    if (sites.length && pick({ take: appetite, skip: 1 - appetite }, rnd) === 'take') {
      sites.sort((a, b2) => ((b2.sec.of === 4) - (a.sec.of === 4)) || (b2.bb - a.bb));
      const s = sites[0];
      chords[s.bb] = s.sec;                                       // the bass + melody both read this recoloured chord downstream
      for (let i = 0; i < nSlot; i++) if (barOfT(slotT[i]) === s.bb) sc[i] = s.sec;   // …and EVERY slot of its bar (not just the downbeat) so no mid-bar chord intervenes — the applied dominant fills its bar and resolves DIRECTLY to the next bar's target
    }
  }

  // CADENTIAL 6/4 [C1 — cadence importance × character formality, a LEAN]: the I-6/4 over the dominant bass, resolving to
  //   V within the penult bar, crowns the FINAL authentic cadence. How OFTEN = the character's formality (cadWeight) — a
  //   grand/military statement often, an intimate song rarely, a bare cantabile never. Grade 2 is too spare to carry it. [P]
  const mid = Math.floor(nbeats / 2);
  const authCads = (form.cadences || []).filter(c => c.type === 'PAC' || c.type === 'IAC').map(c => c.bar);
  const cad64 = new Set();
  if (grade >= 3 && authCads.length && nbeats >= 2 && rnd() < (character.cadWeight ?? 0)) {
    const finalCad = Math.max(...authCads); if (finalCad - 1 >= 1) cad64.add(finalCad - 1);
  }
  // EVENTS from the slot chords: each slot spans to the next; adjacent equal chords merge, so a held chord (over several
  //   slots) emerges as one long event and a fast passage as a run of short ones — the harmonic rhythm the journey set.
  const events = [];
  for (let i = 0; i < nSlot; i++) {
    const start = slotT[i], end = i + 1 < nSlot ? slotT[i + 1] : total, chord = sc[i] || tonic;
    const last = events[events.length - 1];
    if (last && ckey(last) === ckey(chord)) last.dur = end - last.start;
    else events.push({ ...chord, structural: true, start, startBar: barOfT(start), dur: end - start });
  }
  // the cadential 6/4 splits its penult bar into I-6/4 | V (a within-bar move, even in 3/4), overriding whatever sat there.
  for (const b of cad64) {
    const i64 = { ...diat[0], bassDeg: 4, is64: true, fn: 'D' }, V = chords[b], bs = b * barU, splitT = bs + mid * beatLen, be = bs + barU;
    for (let k = events.length - 1; k >= 0; k--) { const e = events[k];
      if (e.start >= be - 1e-9 || e.start + e.dur <= bs + 1e-9) continue;                              // outside the bar
      if (e.start < bs - 1e-9) e.dur = bs - e.start; else events.splice(k, 1); }                        // trim a chord flowing in; drop chords starting inside the bar
    events.push({ ...i64, structural: true, start: bs, startBar: b, dur: splitT - bs });
    events.push({ ...V, structural: true, start: splitT, startBar: b, dur: be - splitT });
  }
  events.sort((a, b2) => a.start - b2.start);
  for (const e of events) e.bars = e.dur / barU;
  const splitBars = new Set();                                          // bars that carry more than one chord (emergence must skip these)
  for (let b = 0; b < nbars; b++) if (events.filter(e => e.start < (b + 1) * barU - 1e-9 && e.start + e.dur > b * barU + 1e-9).length > 1) splitBars.add(b);
  return { events, chords, cadences: form.cadences || [], pins: new Set(Object.keys(pinned).map(Number)), splitBars };
}

// reharmonise ONE bar in place (the emergence device): swap its structural chord and split the covering harmonic-
// rhythm event so the bar carries its own chord. The melody (calling this) and the bass (composed after) then both
// read the new chord, so the vertical stays coherent BY CONSTRUCTION even under reharmonisation.
function reharmoniseBar(plan, b, newChord, barU) {
  plan.chords[b] = newChord;
  const ev = plan.events; let idx = -1;
  for (let i = 0; i < ev.length; i++) if (ev[i].startBar <= b && b < ev[i].startBar + ev[i].bars) { idx = i; break; }
  if (idx < 0) return;
  const e = ev[idx], out = [];
  if (b > e.startBar) out.push({ ...e, bars: b - e.startBar, dur: (b - e.startBar) * barU });
  out.push({ ...newChord, structural: true, startBar: b, bars: 1, start: b * barU, dur: barU, emergent: true });
  const after = e.startBar + e.bars - (b + 1);
  if (after > 0) out.push({ ...e, startBar: b + 1, bars: after, start: (b + 1) * barU, dur: after * barU });
  ev.splice(idx, 1, ...out);
}

// ================= STAGE 2: the forward NOTE-LOOP — melody as ornamented harmony =================
// At each onset: a felt-stress note is a CHORD TONE of the harmony in force (the skeleton); a weak note is a
// DECORATION (passing / neighbour / arpeggiation) connecting the structural tones. So the tune is consonant with
// its harmony BY CONSTRUCTION. Melodic rhythm is decoupled from harmonic rhythm — from style [P]. Roles are [T].

// a character-flavoured melodic rhythm per bar, GENERATED beat-by-beat so it is beat-aligned + notatable BY CONSTRUCTION
//   (a sub-beat note never crosses a beat; every value is an OKDUR). At each beat the composer weighs the two axes that
//   define rhythmic character — PACE (broad long notes <-> quick short notes) and DOT (even <-> dotted snap): a scherzo
//   trips in quavers, an adagio breathes in minims, a march leans on the dotted tread — a weighted LEAN, so any option
//   can still surface for any character (never a partition). Grade FLOORS the shortest value (the real gate): g2 =
//   quaver, g3/4 = semiquaver. [P + grade gate]
const _pickW = (opts, rnd) => { let tot = 0; for (const o of opts) tot += o.w; let r = rnd() * tot;
  for (const o of opts) { r -= o.w; if (r <= 0) return o.dur; } return opts[opts.length - 1].dur; };
// the longest stretch of consecutive semiquavers in a subdivision — a stretch of two or more is a scurrying RUN (as opposed
//   to a lone ornamental semiquaver in a dotted figure or a turn), the thing a smooth/broad character resists. [P]
const maxRun16 = s => { let run = 0, mx = 0; for (const v of s) { if (v < 0.5 - 1e-9) { run++; if (run > mx) mx = run; } else run = 0; } return mx; };
function barRhythm(nbeats, rnd, pace = 0.45, dot = 0.25, grade = 3, beatLen = 1, runReady = 1) {
  const gmin = grade <= 2 ? 0.5 : 0.25;
  const compound = beatLen > 1 + 1e-9;                              // a DOTTED-crotchet beat (1.5): 6/8, 3/8
  // in-beat subdivisions that SUM TO THE BEAT and never cross it. Simple beat (1) -> the crotchet family; compound beat
  //   (1.5) -> the dotted-crotchet family (the whole dotted crotchet; crotchet-quaver lilt and its reverse; three quavers;
  //   the semiquaver fills). Same idea, expressed for the beat's real length. [P]
  const SUB = (compound
    ? [[1.5], [1, 0.5], [0.5, 1], [0.5, 0.5, 0.5], [1, 0.25, 0.25], [0.25, 0.25, 1], [0.5, 0.5, 0.25, 0.25], [0.25, 0.25, 0.5, 0.5], [0.5, 0.25, 0.25, 0.5]]
    : [[1], [0.5, 0.5], [0.75, 0.25], [0.25, 0.75], [0.5, 0.25, 0.25], [0.25, 0.25, 0.5], [0.25, 0.25, 0.25, 0.25]])
    .filter(c => Math.min(...c) >= gmin - 1e-9);
  const cell = [];
  for (let b = 0; b < nbeats - 1e-9;) {
    const left = nbeats - b, opts = [];
    for (let k = 2; k <= Math.min(left, 4); k++)                    // a LONG note spanning k whole beats (minim / dotted-minim; in compound a k-beat = k dotted crotchets)
      opts.push({ dur: [k * beatLen], w: (1 - pace) * (k === 2 ? 1.6 : k === 3 ? 0.5 : 0.3) });
    if (!compound && left >= 2 && gmin <= 0.5 + 1e-9)              // a simple-metre DOTTED tread (dotted crotchet + quaver spanning two crotchet beats)
      opts.push({ dur: [1.5, 0.5], w: (0.15 + 1.5 * dot) * (0.5 + 0.6 * pace) });
    for (const s of SUB) {                                          // fill this ONE beat
      if (s.length === 1) { opts.push({ dur: s.slice(), w: 0.55 + 0.5 * (1 - pace) }); continue; }   // the plain beat (crotchet, or a held dotted crotchet)
      // a busier subdivision — each SEMIQUAVER it packs COMPOUNDS the pace demand (pace^(1+#16ths)), so a plain quaver
      //   run is cheap but 16ths need a genuinely quick character. [P]
      const n16 = s.filter(v => v < 0.5 - 1e-9).length;
      let w = 1.6 * Math.pow(pace, 1 + n16);
      if (s.some(v => Math.abs(v - 0.75) < 1e-9)) w *= 0.4 + 1.6 * dot;
      if (compound && s.length === 2) w *= 0.5 + 1.4 * dot;         // the compound long-short (crotchet-quaver) lilt — the 6/8 signature — follows the DOT lean
      if (n16 > 0 && grade < 4) w *= 0.3;                           // GRADE dial: semiquavers damped below g4 (g2<g3<g4 in density)
      if (maxRun16(s) >= 2) w *= runReady;                          // a SCURRYING run belongs to a crisp character; a smooth/broad line resists it (feel-borne lean, single ornamental 16th untouched) [P]
      opts.push({ dur: s, w });
    }
    const d = _pickW(opts, rnd); cell.push(...d); b += d.reduce((a, x) => a + x, 0) / beatLen;   // advance by the number of BEATS this cell consumed
  }
  return cell;
}
// draw ONE beat's subdivision (the SUB axis of barRhythm), optionally leaning AWAY from `avoid` — the unit of rhythmic
//   DEVELOPMENT: re-voicing a single beat varies the motif while keeping its frame (works on dense/dotted cells too,
//   which the old whole-note-only variant could not touch). [P]
function drawBeat(rnd, pace, dot, gmin, avoid = null, beatLen = 1, runReady = 1) {
  const compound = beatLen > 1 + 1e-9;
  const SUB = (compound
    ? [[1.5], [1, 0.5], [0.5, 1], [0.5, 0.5, 0.5], [1, 0.25, 0.25], [0.25, 0.25, 1], [0.5, 0.5, 0.25, 0.25], [0.25, 0.25, 0.5, 0.5], [0.5, 0.25, 0.25, 0.5]]
    : [[1], [0.5, 0.5], [0.75, 0.25], [0.25, 0.75], [0.5, 0.25, 0.25], [0.25, 0.25, 0.5], [0.25, 0.25, 0.25, 0.25]]).filter(c => Math.min(...c) >= gmin - 1e-9);
  const opts = [];
  for (const s of SUB) {
    if (s.length === 1) { opts.push({ dur: s.slice(), w: 0.55 + 0.5 * (1 - pace) }); continue; }
    const n16 = s.filter(v => v < 0.5 - 1e-9).length; let w = 1.6 * Math.pow(pace, 1 + n16);
    if (s.some(v => Math.abs(v - 0.75) < 1e-9)) w *= 0.4 + 1.6 * dot;
    if (compound && s.length === 2) w *= 0.5 + 1.4 * dot;          // the compound long-short lilt follows the DOT lean
    if (maxRun16(s) >= 2) w *= runReady;                            // same feel-borne run lean when a beat is re-voiced in development [P]
    if (avoid && s.join(',') === avoid) w *= 0.12;                  // lean away from repeating this exact beat (variety, not a ban)
    opts.push({ dur: s, w });
  }
  return _pickW(opts, rnd);
}
// split a flat cell into per-beat segments (a note >=1 beat is its own segment) — so development can target ONE beat. Beats
//   fall at multiples of the beat length (1 in simple metre, 1.5 in compound), so segment on THAT grid, not integers.
const beatSegs = (cell, beatLen = 1) => { const segs = []; let cur = [], acc = 0; for (const d of cell) { cur.push(d); acc += d; if (Math.abs(acc / beatLen - Math.round(acc / beatLen)) < 1e-9) { segs.push(cur); cur = []; acc = 0; } } if (cur.length) segs.push(cur); return segs; };

// compose the melody over a harmonic plan. Returns [{ m, d }] (pitch, duration in quarter-beats).
// FIGURATION FROM CHARACTER [ported generator.mjs CHAR_FIGS]: a composer's tune moves the way its character sings — a
// cantabile is CONJUNCT (steps + turns, no bare arpeggios), a march/grand OUTLINES THE TRIAD (chord-tone leaps), a
// scherzo/dance PLAYS (skips + neighbours), a flowing piece MIXES. A lean on the step/leap axis, not a forcing.
const FIG = {
  conjunct:    { step: 2.2, leap: -0.6, wide: 1.2, recover: 1.7 },   // a sung line steps; leaps are the exception
  arpeggiated: { step: 0.3, leap: 1.7,  wide: 0.4, recover: 0.4 },   // a triad-outlining line leaps between chord tones
  playful:     { step: 1.4, leap: 1.0,  wide: 0.8, recover: 0.9 },   // witty skips + neighbour motion
  mixed:       { step: 1.2, leap: 0.4,  wide: 0.7, recover: 1.3 },   // balanced (the old default)
};
// the same figuration at the DECORATION level: which weak-note role a character fills a gap with — a conjunct line
// runs by PASSING step, an arpeggiated one skips through a CHORD tone, a playful one turns via a NEIGHBOUR. [ported]
const FIGDEC = {
  conjunct:    { passing: 2.0, neighbour: 1.6, arp: 0.3 },
  arpeggiated: { passing: 0.4, neighbour: 0.5, arp: 2.0 },
  playful:     { passing: 1.2, neighbour: 2.0, arp: 0.8 },
  mixed:       { passing: 1.0, neighbour: 1.0, arp: 1.0 },
};
export function composeMelody({ plan, tonic, mode, barU, beatLen, nbars, range, drama = null, breath = 0.72, legato = false, figure = 'mixed', pace = 0.45, dot = 0.25, gap = 0, gracefulCad = false, grade = 3, soph = 0.5, runReady = 1, rnd = Math.random }) {
  const fw = FIG[figure] || FIG.mixed;
  // GRADE SOPHISTICATION LEAN [P]: a composer writes the line at the grade's LEVEL — a higher grade leans toward a busier,
  //   more subdivided rhythm (more inside each beat). The note-value FLOOR still caps what is reachable (grade 2 never
  //   subdivides past a quaver); this only leans HOW OFTEN it reaches into that floor. A lean, not a device. [grade as level]
  pace = pace * (0.8 + 0.4 * soph);
  const [lo, hi] = range;                                            // register window (grade-gated) in MIDI
  const chordAt = t => { for (let i = plan.events.length - 1; i >= 0; i--) if (plan.events[i].start <= t + 1e-9) return plan.events[i]; return plan.events[0]; };
  const nbeats = Math.round(barU / beatLen);
  const cadEndBars = new Set((plan.cadences || []).map(c => c.bar));   // phrase-END bars (broaden into the breath)

  // 1. RHYTHMIC MOTIF [P, unity ~60-75%]: one germ cell for the piece, restated most bars (a variant or a fresh
  //    cell for contrast), broadened at phrase ends. Rhythm is still decoupled from harmony (§3) — this is style.
  const gmin = grade <= 2 ? 0.5 : 0.25;
  // the germ is the piece's BASIC IDEA, so it must be an IDEA — a rhythmic SHAPE (>=2 events). A single undifferentiated
  //   whole-bar note is a drone, not a motif; redraw until the germ has profile, and fall back to a plain per-beat tread. [composer: a motif has a shape]
  let germCell = barRhythm(nbeats, rnd, pace, dot, grade, beatLen, runReady);
  for (let t = 0; t < 8 && germCell.length < 2; t++) germCell = barRhythm(nbeats, rnd, pace, dot, grade, beatLen, runReady);
  // a motif also wants rhythmic PROFILE — a shape, not a FLAT RUN of identical durations (four even quavers restated every
  //   bar reads as a note-spinner, not a composed idea; the same principle as ">=2 events, not a drone", one level finer).
  //   Seek a germ with some duration contrast, BOUNDED — if the character's rhythm space is genuinely flat (a fast moto-
  //   perpetuo), a flat germ still surfaces. A lean toward a characterful motif, never a wall. [composer: a motif has profile]
  const flatRun = c => c.length >= 3 && new Set(c).size === 1;
  for (let t = 0; t < 3 && flatRun(germCell); t++) { const g2 = barRhythm(nbeats, rnd, pace, dot, grade, beatLen, runReady); if (g2.length >= 2 && !flatRun(g2)) { germCell = g2; break; } }
  if (germCell.length < 2) germCell = Array(Math.max(2, nbeats)).fill(1);
  // DEVELOP the germ [P — motivic variation]: split a long note (diminution), OR re-voice ONE beat to a DIFFERENT
  //   subdivision (works on a dense/dotted cell, which the old whole-note-only variant returned unchanged — the root of
  //   the "same cell every bar" monotony). The frame stays; one beat moves — a real variation, not a fresh cell.
  const variant = (cell, drive = 0.5) => {
    const segs = beatSegs(cell, beatLen);
    const longs = [], beats = [];
    segs.forEach((s, i) => { const sum = s.reduce((a, x) => a + x, 0); if (sum >= 2) longs.push(i); else if (Math.abs(sum - 1) < 1e-9) beats.push(i); });
    // develop by DIMINUTION (add motion — DRIVE) or by RE-VOICING a beat (gentle variation), leaning by the bar's `drive`
    //   (the shared drama tension): build with motion where it's tense, vary gently where it's calm. Both reachable.
    if (longs.length && (!beats.length || pick({ diminish: drive, revoice: 1 - drive }, rnd) === 'diminish')) { const i = longs[Math.floor(rnd() * longs.length)]; const k = segs[i].reduce((a, x) => a + x, 0);   // diminish a long note into k beats of motion (KEEP the beat count); always take it when there is no beat to re-voice (development must MOVE)
      const rep = []; for (let j = 0; j < k; j++) rep.push(1);                          // k plain crotchets...
      if (rnd() < 0.6) { const j = Math.floor(rnd() * k); rep.splice(j, 1, ...drawBeat(rnd, pace, dot, gmin, null, beatLen, runReady)); }   // ...one subdivided for motion
      segs[i] = rep; return segs.flat(); }
    if (beats.length) { const i = beats[Math.floor(rnd() * beats.length)], avoid = segs[i].join(',');   // re-voice one beat, biased to change
      let nd = segs[i]; for (let t = 0; t < 5; t++) { const d = drawBeat(rnd, pace, dot, gmin, avoid, beatLen, runReady); if (d.join(',') !== avoid) { nd = d; break; } }
      segs[i] = nd; return segs.flat(); }
    return cell.slice();
  };
  // A composer PLACES the motif by PHRASE FUNCTION, not by a per-bar dice roll (which the anti-repeat patch then had to
  //   police). Sentence form: the PRESENTATION states the basic idea and REPEATS it — a repetition or a sequence keeps the
  //   rhythm, and that recurrence IS unity, not monotony (so the germ landing at both phrase openings is a parallel period,
  //   exactly right). The CONTINUATION develops the idea (variation / fragmentation) and drives to the cadence, which
  //   BROADENS into a breath. So each bar's rhythmic role follows its position within its phrase (bounded by the cadence
  //   bars), stated as a LEAN — and two identical bars in a row are welcome where the idea calls for it (a sequence). [P]
  const cadArr = [...cadEndBars].sort((a, b) => a - b);
  const phraseStart = b => { let s = 0; for (const c of cadArr) { if (c < b) s = c + 1; else break; } return s; };
  const phraseEnd = b => { for (const c of cadArr) if (c >= b) return c; return nbars - 1; };
  const barCell = b => {
    if (cadEndBars.has(b)) return (b === nbars - 1) ? [barU] : (nbeats >= 4 ? [barU / 2, barU / 2] : [barU]);   // a phrase end broadens (a breath) — bar-filling long note(s) in QUARTER units (barU), correct in compound too (6/8: one dotted minim, not a 2-beat minim). The FINAL bar is one held tonic — held-vs-buttoned decided below from momentum
    const pos = b - phraseStart(b), toCad = phraseEnd(b) - b;        // position after the phrase opening / distance to its cadence
    // A ONE-BEAT-bar metre (3/8, felt in one) has no within-bar structure for a repeated germ to articulate, so unity cannot
    //   come from restating it — the phrase's rhythm must VARY bar to bar (the germ opens the idea, then the beat is varied).
    //   Multi-beat metres keep sentence form's germ-repetition (each bar has shape). [P — the sentence-form logic under a one-beat bar]
    const w = nbeats === 1
      ? (pos === 0 ? { germ: 5, variant: 3, fresh: 1 }               // one-beat: state the idea, but already open to variation
         : { variant: 5, fresh: 3, germ: 2 })                        //   then the interest is bar-to-bar variation of the single beat
      : pos === 0 ? { germ: 8, variant: 2 }                          // STATE the basic idea
      : pos === 1 ? { germ: 6, variant: 4 }                          // REPEAT / sequence it — the rhythm rides along (unity)
      : toCad <= 1 ? { variant: 7, germ: 2 }                         // drive to the cadence: a developed (fragmented) unit
      : { germ: 3, variant: 6, fresh: 1 };                           // continuation: mostly develop, a rare contrasting idea
    const kind = pick(w, rnd);
    return kind === 'germ' ? germCell.slice() : kind === 'variant' ? variant(germCell, drama ? drama.tensionAt((b + 0.5) * barU) : 0.5) : barRhythm(nbeats, rnd, pace, dot, grade, beatLen, runReady);
  };
  const notes = [];
  for (let b = 0; b < nbars; b++) {
    const cell = barCell(b);
    let off = 0;
    for (const d of cell) { const t = b * barU + off; notes.push({ t, d, strong: Math.abs((t % beatLen)) < 1e-9, bar: b }); off += d; }
  }

  // 1b. ARTICULATE the harmony where it MUST: if a note straddles a chord change AND the two chords share no common
  //     tone (so the held note would clash), split it so the melody re-attacks ON the change and states the new chord.
  //     Where a common tone EXISTS, the note is left to hold it (a suspension/pedal) — a composer only re-articulates
  //     when the line can't belong to both chords. This is what keeps the richer harmonic rhythm clean by construction.
  const evAt = t => { let e = plan.events[0]; for (const x of plan.events) if (x.start <= t + 1e-9) e = x; return e; };
  const changeTimes = [...new Set(plan.events.map(e => e.start))].filter(t => t > 1e-9 && t < nbars * barU - 1e-9);
  for (const c of changeTimes) {
    const pcsA = chordPCs(tonic, mode, evAt(c - 1e-6)), pcsB = chordPCs(tonic, mode, evAt(c));
    let common = false; for (let p = lo; p <= hi; p++) if (isChordTone(p, pcsA) && isChordTone(p, pcsB)) { common = true; break; }
    if (common) continue;                                                    // a common tone exists → the line may hold it (no split)
    for (let i = 0; i < notes.length; i++) { const n = notes[i];
      if (n.t < c - 1e-9 && n.t + n.d > c + 1e-9) {                          // this note straddles the change → split at c
        const d2 = n.t + n.d - c; n.d = c - n.t;
        notes.splice(i + 1, 0, { t: c, d: d2, strong: Math.abs((c % beatLen)) < 1e-9, bar: Math.floor(c / barU) });
        break;
      }
    }
  }
  notes.sort((a, b) => a.t - b.t);

  // 2. PASS A — the skeleton as an ORNAMENTED, DEVELOPED motif. The germ's interval shape (from bar 0's strong
  //    notes) is restated as a rolling motif: exact sequence / inversion / fragmentation, or a free arch note for
  //    contrast [P, unity emergent not forced]. Each wanted pitch is NEGOTIATED to the harmony — cheapest budget:
  //    if the motif's wanted pitch is a chord tone, keep it (free); else BEND THE LINE to the nearest chord tone
  //    (a light distortion of the shape). (Bending the HARMONY — emergence — is the next tier, added in 4b.)
  const strong = notes.filter(n => n.strong);
  // a note that SUSTAINS across a harmony change is struck as a chord tone of its ONSET chord (consonant at the attack).
  //   Over the new chord it is EITHER a common tone (a consonant HOLD / pedal) OR a SUSPENSION (momentarily dissonant),
  //   and a suspension RESOLVES by step onto a chord tone of the very next note. [P: hold-vs-suspend is the situational
  //   lean the LINE decides; the resolution is the ONE genuine theory gate — an unresolved suspension is a real error, so
  //   a suspension is only OFFERED where it can resolve, and once taken the next note is REQUIRED to resolve it.] This is
  //   how a composer holds a note over moving harmony; the old common-tones-only rule forbade the suspension outright and,
  //   in a tight hand, often left a SINGLE legal pitch — forcing a drone. onsetPCs = the candidate vocabulary; isHold(q) =
  //   q is consonant with EVERY chord the note spans (a pure hold, no suspension).
  const spanEvents = (t, d) => plan.events.filter(e => e.start < t + d - 1e-9 && e.start + e.dur > t + 1e-9);
  const onsetPCs = t => chordPCs(tonic, mode, chordAt(t));
  const isHold = (q, t, d) => spanEvents(t, d).every(e => isChordTone(q, chordPCs(tonic, mode, e)));
  // a per-piece CONTOUR PLAN so the line is a SHAPED gesture, not a fixed arch: rise to an apex whose position VARIES
  //   piece to piece, then fall to a settled close. [P — diversity + a composer's phrase shape, not the same curve.]
  const total = nbars * barU;
  // the melody's registral peak is PLACED at the shared dramatic climax (not a private per-melody guess), so the tune
  //   summits where the harmony is most tense and the dynamics swell — one coherent high point.
  const climaxPos = drama ? (drama.climaxBar + 0.55) * barU / total : 0.42 + rnd() * 0.36;
  // USE THE ROOM YOU HAVE — how fully the contour reaches its range's extremes scales CONTINUOUSLY with that range, not a
  //   threshold that flips the shape. A five-finger box (a fifth) is used WHOLE (valley→lo, peak→hi, all five fingers); a WIDE
  //   grade-3/4 compass is shaped WITHIN it (peak just below the top, start/end off the edges). `fill` = 1 at a fifth, easing
  //   to 0 as the range widens; it interpolates the same peak/start/end bands, so no two near-equal ranges shape differently. [P]
  const fill = Math.max(0, Math.min(1, (15 - (hi - lo)) / 7));
  const peakF = 0.94 + 0.06 * fill;                                                        // reach the top fully in a small box; just below it in a wide range
  const startLo = 0.12 * (1 - fill), endLo = 0.08 * (1 - fill);                            // valley/start band floor (0 in a small box → off the edge in a wide one)
  const startF = startLo + rnd() * ((0.12 + 0.22 * (1 - fill)) - startLo);                 // per-piece spread within a fill-scaled band
  const endF = endLo + rnd() * ((0.14 + 0.19 * (1 - fill)) - endLo);
  const contourAt = tt => { const x = tt / total; const f = x <= climaxPos ? startF + (peakF - startF) * (x / climaxPos) : peakF - (peakF - endF) * ((x - climaxPos) / Math.max(1e-6, 1 - climaxPos)); return lo + (hi - lo) * f; };
  let germ = null, gi = 0, inv = 1;                                  // the motif's interval pattern + a rolling pointer + inversion sign
  let prev = null, prev2 = null, prevMove = 0; const recent = [];
  let resolveFrom = null;                                            // if the previous note SUSPENDED, the pitch THIS note must resolve by step
  // SEQUENCE-AWARE DEVELOPMENT [P — a real sequence is a harmonic-melodic gesture]: where the HARMONY spins a sequence (its
  //   roots move by one consistent scale-step for >=3 bars), the melody RESTATES its figure CHORD-RELATIVELY on each step —
  //   the same intervals above each (moving) root — so the tune sequences WITH the harmony and every note is a chord tone by
  //   construction. This is the melodic half, sound BECAUSE the harmony cooperates (a melody-only shift over static harmony
  //   was reverted). Detected from the plan, so it fires ONLY on a genuine sequential passage.
  const barDegree = b => { const e = chordAt(b * barU); return ((e.deg % 7) + 7) % 7; };
  const barRootPc = b => { const e = chordAt(b * barU); return (((scalePitch(tonic, mode, e.deg)) % 12) + 12) % 12; };
  const seqModel = {};                                               // restate bar -> the previous bar in the run (its model)
  { const stepAt = b => (((barDegree(b) - barDegree(b - 1)) % 7) + 7) % 7;
    for (let b = 2; b < nbars; b++) { const s1 = stepAt(b), s0 = stepAt(b - 1);
      if (s1 !== 0 && s1 === s0) { seqModel[b] = b - 1; if (seqModel[b - 1] == null) seqModel[b - 1] = b - 2; } } }
  const barStrong = {}, barRootPitch = {};                           // per bar: the placed strong pitches + the root pitch in the melody register
  let seqBarI = 0, seqCur = -1, prevRootPc = null;
  for (let si = 0; si < strong.length; si++) {
    const n = strong[si];
    if (n.bar !== seqCur) { seqCur = n.bar; seqBarI = 0; }            // a new bar resets the within-bar index
    const pcs = onsetPCs(n.t);
    const curRootPc = (((scalePitch(tonic, mode, chordAt(n.t).deg)) % 12) + 12) % 12;   // the root the LH bass now STATES (foundation) — the tune must not parallel it
    const held = spanEvents(n.t, n.d).length > 1;
    const jn = notes.indexOf(n), nextNote = jn >= 0 ? notes[jn + 1] : null;    // the IMMEDIATELY next note (a suspension resolves onto it)
    const nextStrong = !!(nextNote && nextNote.strong), nextPcs = nextNote ? onsetPCs(nextNote.t) : null;
    // candidates = chord tones of the onset chord in the hand. A held note that clashes with a later spanned chord is a
    //   SUSPENSION — kept only where its resolution is a STRONG next note that can step to a consonance (so it is placed
    //   and enforced in this same pass); otherwise the note must be a pure hold.
    let cands = [];
    for (let q = lo; q <= hi; q++) {
      if (!isChordTone(q, pcs)) continue;
      if (!held || isHold(q, n.t, n.d)) { cands.push(q); continue; }
      if (nextStrong && nextPcs && [q - 1, q - 2, q + 1, q + 2].some(r => r >= lo && r <= hi && isChordTone(r, nextPcs))) cands.push(q);
    }
    // RESOLUTION (theory gate): if the previous note suspended, THIS note must take the stepwise resolution to a consonance.
    if (resolveFrom != null) { const res = [resolveFrom - 1, resolveFrom - 2, resolveFrom + 1, resolveFrom + 2].filter(r => r >= lo && r <= hi && isChordTone(r, pcs)); if (res.length) cands = res; }
    if (!cands.length) { n.m = prev != null ? prev : Math.round((lo + hi) / 2); recent.push(n.m); prevMove = 0; prev2 = prev; prev = n.m; resolveFrom = null; prevRootPc = curRootPc; (barStrong[n.bar] = barStrong[n.bar] || []).push(n.m); seqBarI++; continue; }
    const target = contourAt(n.t);
    if (seqBarI === 0) barRootPitch[n.bar] = nearestPC([barRootPc(n.bar)], prev != null ? prev : Math.round((lo + hi) / 2), lo, hi) ?? Math.round((lo + hi) / 2);
    // on a SEQUENCED bar, the figure's k-th note keeps the same interval above the (moving) chord root as it had in the model bar
    let seqTarget = null;
    { const model = seqModel[n.bar];
      if (model != null && barStrong[model] && seqBarI < barStrong[model].length && barRootPitch[model] != null)
        seqTarget = barRootPitch[n.bar] + (barStrong[model][seqBarI] - barRootPitch[model]); }
    const gwant = (germ && germ.length && prev != null) ? prev + inv * germ[gi % germ.length] : null;   // the motif's next note
    // REASON THE LINE: follow the (varied) contour toward its apex; MOVE — a repeated note is a deliberate device, not
    //   a default, so it loses heavily; step by nature, leap with purpose then recover; continue the motif as a lean;
    //   avoid recently-used pitches (variety). The winner is the chord tone that best serves the LINE, in context.
    // THE LINE COMES HOME [P]: after the climax a composer brings the line DOWN to rest — BY STEP, a shaped fall, not a
    //   plunge. So past the summit we lean toward DESCENDING MOTION (growing toward the close); with the stepwise lean
    //   that yields a scalar descent home, and lands the cadence approach low (the final tonic is a step away, no leap up).
    //   A lean on MOTION, not a pull to a position (that made the line LEAP down to hit a low target) — a higher close still surfaces.
    const homeLean = Math.max(0, (n.t / total) - climaxPos) / Math.max(1e-6, 1 - climaxPos);
    const score = q => {
      // a sequenced bar is DRIVEN by the chord-relative restatement (dominant pull); the contour is a gentle secondary shaping.
      let s = seqTarget != null ? -Math.abs(q - seqTarget) * 2.0 - Math.abs(q - target) * 0.1 : -Math.abs(q - target) * 0.4;
      // WRITE THE TUNE AGAINST THE BASS [P — a composer hears the bass while writing the melody]: the bass now STATES the root,
      //   so the tune must not run a parallel octave / fifth WITH that root — move in contrary / oblique motion instead. This
      //   is the melody's half of "no accidental 6/4, no parallel": the bass keeps its root, the tune steps around it. [P]
      if (prev != null && prevRootPc != null) {   // a composer avoids parallel 8ve/5th with the bass in EVERY piece — not only a narrow-range one (the narrowBox gate here was a false precondition; range is irrelevant to a parallel being wrong)
        const md = Math.sign(q - prev), sd = x => (((x % 12) + 18) % 12) - 6, rd = Math.sign(sd(curRootPc - prevRootPc));
        if (md !== 0 && md === rd) { const above = (p, r) => (((p - r) % 12) + 12) % 12;
          if (above(q, curRootPc) === 0 && above(prev, prevRootPc) === 0) s -= 4;   // parallel octave with the root bass
          else if (above(q, curRootPc) === 7 && above(prev, prevRootPc) === 7) s -= 4; }   // parallel fifth with the root bass
      }
      // come home: a growing preference to descend after the climax — BUT a leading tone (raised ^7) does not come home by
      //   descending, it RESOLVES UP to the tonic; so the descent reward is withheld when the previous note is the leading
      //   tone, letting the line rise ^7→^1 (and never fall ^7→^6, the augmented 2nd). [P]
      const prevIsLT = mode === 'min' && prev != null && (((prev - tonic) % 12) + 12) % 12 === 11;
      if (homeLean > 0 && prev != null && q < prev && !prevIsLT) s += 1.4 * homeLean;   // come home: descend after the climax
      if (prevIsLT && (((q - tonic) % 12) + 12) % 12 === 0 && q > prev && q - prev <= 2) s += 1.6;   // the leading tone resolves UP to ^1
      if (prev != null) { const mv = q - prev, a = Math.abs(mv);
        if (a === 0) s -= 6;                                          // [P] no droning: a static repeat is near-never the best line
        else if (a <= 2) s += fw.step;                                // stepwise — the natural default, strong for a conjunct character
        else if (a <= 5) s += fw.leap;                                // a chord-tone leap — the idiom for an arpeggiated character (triad outline)
        else s -= (a - 5) * fw.wide;                                  // an over-wide leap is dispreferred
        if (Math.abs(prevMove) > 2 && mv !== 0 && Math.sign(mv) === Math.sign(prevMove)) s -= fw.recover;   // recover after a leap (less so for a triadic line that arpeggiates on)
        // a melodic AUGMENTED 2ND (natural ^6 ↔ raised ^7, the harmonic-minor gap) is not a leap a composer writes in this
        //   idiom — the ^6 wants to FALL to ^5 (itself a chord tone of V), the smoother line. Undo the leap reward and lean
        //   firmly away (about as strongly as a drone is shunned), so even a contour climb reaches the leading tone by a
        //   smoother route; it still surfaces if nothing else will serve. Only the specific chromatic pair, never a m3. [P]
        if (mode === 'min' && a === 3) { const pa = (((prev - tonic) % 12) + 12) % 12, pq = (((q - tonic) % 12) + 12) % 12;
          if ((pa === 8 && pq === 11) || (pa === 11 && pq === 8)) s -= fw.leap + 6; }
      }
      if (gwant != null && q === gwant) s += 1.4;                     // motivic unity — a lean, not a forcing
      s -= recent.slice(-4).filter(x => x === q).length * 1.3;        // don't circle the same few pitches
      // DON'T TREAD WATER [P — a composer STATES a turn then DEVELOPS it (sequences to fresh pitches); it does not wobble
      //   A-B-A-B in place]. Penalise returning to the pitch two ago (the retread that turns a [±3] turn-germ into an
      //   oscillation): the line then prefers a FRESH pitch — a turn E-G-E becomes an arpeggio E-G-B that goes somewhere.
      //   A lean, not a wall (a genuine motivic return / cadence still surfaces); withheld at the come-home descent, where
      //   revisiting a pitch on the way down is natural.
      if (prev2 != null && q === prev2 && !(homeLean > 0 && prev != null && q < prev)) s -= 2.2;
      if (resolveFrom != null && q < resolveFrom) s += 0.6;           // a suspension resolves DOWN by preference (4-3, 7-6); a retardation up stays possible
      return s;
    };
    let p = cands[0], bs = -1e9; for (const q of cands) { const sc = score(q); if (sc > bs) { bs = sc; p = q; } }
    // did we choose to SUSPEND? (a held note that clashes with a chord it spans) → the next note must resolve it.
    resolveFrom = (held && !isHold(p, n.t, n.d)) ? p : null;
    // (harmonic recolouring — the "same note, fresh chord" device — is NOT done here per-downbeat. It lives at plan
    //  time in reharmoniseStaticSpans, which recolours only where a PROLONGED harmony sits under a static/held melody:
    //  that is the one place a composer reaches for it. A per-note dice here would just muddy Job A's planned journey.)
    n.m = p; recent.push(p); prevMove = prev == null ? 0 : p - prev; prev2 = prev; prev = p; prevRootPc = curRootPc; if (gwant != null) gi++;
    (barStrong[n.bar] = barStrong[n.bar] || []).push(p); seqBarI++;   // record the bar's strong pitches (the model for a later sequenced bar)
    // the germ is born once bar 0's strong notes are placed: their successive intervals ARE the motif.
    if (germ == null && si + 1 < strong.length && strong[si + 1].bar > 0) {
      const b0 = strong.filter(s => s.bar === 0 && s.m != null);
      germ = []; for (let k = 1; k < b0.length; k++) germ.push(b0[k].m - b0[k - 1].m);
      if (!germ.length) germ = [2, -2];                              // a one-note bar 0: a tiny default neighbour germ
      gi = 0; inv = 1;
    }
  }

  // 3. PASS B — decorations: fill each weak note between two skeleton notes by ROLE (passing / neighbour / arpeggio).
  // A decoration is a step in the scale THE HARMONY IS SOUNDING. Over an applied (secondary-dominant) chord the melody
  //   has leaned into the TONICISED key, so its connecting step comes from THAT key's scale (which carries the applied
  //   chord's chromatic tones) — a home-key step there contradicts the chord (a C natural against an F#-major chord).
  //   Over a diatonic chord the prevailing scale IS the home scale, unchanged. [composer: relate the note to the harmony NOW]
  const homeScalePcs = scalePCsOf(mode, tonic);
  const tonicisedScalePcs = ev => { const of = ((ev.of % 7) + 7) % 7, xRootPc = (((scalePitch(tonic, mode, of)) % 12) + 12) % 12, xMode = DIATONIC[mode][of].q === 'maj' ? 'maj' : 'min'; return SCALE[xMode].map(s => (xRootPc + s) % 12); };
  for (let i = 0; i < notes.length; i++) {
    const n = notes[i]; if (n.strong) continue;
    let a = null; for (let k = i - 1; k >= 0; k--) if (notes[k].m != null) { a = notes[k].m; break; }
    let c = null; for (let k = i + 1; k < notes.length; k++) if (notes[k].m != null) { c = notes[k].m; break; }
    const ev = chordAt(n.t), pcs = chordPCs(tonic, mode, ev);
    const applied = !!(ev.sec && ev.of != null);   // an applied dominant: the harmony has tonicised another key
    if (a == null) { n.m = nearestPC(pcs, Math.round(contourAt(n.t)), lo, hi); continue; }   // a leading weak note follows the SAME contour as the rest of the line (not a separate fixed arch)
    if (c == null) c = a;
    const gap = c - a;
    const scalePcs = applied ? tonicisedScalePcs(ev) : homeScalePcs;   // the prevailing scale, read from the chord in force
    const diatStep = dir => { for (let d = 1; d <= 2; d++) { const q = a + dir * d; if (scalePcs.includes((((q) % 12) + 12) % 12)) return q; } return null; };  // nearest step IN THE PREVAILING SCALE
    let choices = {};
    const dw = FIGDEC[figure] || FIGDEC.mixed;   // the character's decoration bias (conjunct steps, arpeggiated skips, playful neighbours)
    // over an applied chord the melody OUTLINES the brief chromatic colour — a lean toward chord-tone (arp) decorations,
    //   the scale connector still reachable but drawn from the tonicised scale so it too belongs. [P — outline the colour]
    const wStep = applied ? 0.5 : 1, wArp = applied ? 2.2 : 1;
    // PASSING [T]: gap is a 3rd → the step between fills it, in the PREVAILING scale (E→G through F; over F# major, A#→C# through B).
    if (Math.abs(gap) === 3 || Math.abs(gap) === 4) { const mid = nearestPC(scalePcs, (a + c) / 2, Math.min(a, c), Math.max(a, c)); if (mid != null && mid !== a && mid !== c) choices[mid] = (choices[mid] || 0) + 4 * dw.passing * wStep; }
    // NEIGHBOUR [T]: a repeated skeleton tone → step away and back, on a step of the PREVAILING scale (upper or lower).
    if (gap === 0) { const up = diatStep(1), dn = diatStep(-1); if (up != null) choices[up] = (choices[up] || 0) + 2 * dw.neighbour * wStep; if (dn != null) choices[dn] = (choices[dn] || 0) + 2 * dw.neighbour * wStep; }
    // ARPEGGIO [P]: otherwise move through a chord tone toward c (a leap decorated as a chord skip) — the outline of the harmony in force.
    { const ct = nearestPC(pcs, (a + c) / 2, Math.min(a, c), Math.max(a, c)); if (ct != null && ct !== a && ct !== c) choices[ct] = (choices[ct] || 0) + 3 * dw.arp * wArp; }
    // a decoration must stay inside the register window (the grade's hand) — drop any choice out of [lo,hi].
    for (const k of Object.keys(choices)) if (+k < lo || +k > hi) delete choices[k];
    delete choices[a]; if (c !== a) delete choices[c];             // a decoration MOVES — it is a connecting note, so it never restates EITHER the note it comes from OR the note it goes to (landing on the successor is the pre-echo stutter that made higher-grade lines read static)
    // fallback: a connecting STEP that is NEITHER end-point — toward the goal if that is a distinct note, else a neighbour away from it, always in-key + in-window. [P]
    if (!Object.keys(choices).length) {
      const distinct = q => q != null && q >= lo && q <= hi && q !== a && q !== c;
      let q = diatStep(c > a ? 1 : c < a ? -1 : 1);
      if (!distinct(q)) q = diatStep(c > a ? -1 : 1);
      if (!distinct(q)) { const ct = nearestPC(pcs, Math.round((a + c) / 2), lo, hi); q = distinct(ct) ? ct : null; }
      if (!distinct(q)) { for (let d = 1; d <= 2 && !distinct(q); d++) for (const dir of [1, -1]) { const cnd = a + dir * d; if (distinct(cnd) && scalePcs.includes(((cnd % 12) + 12) % 12)) q = cnd; } }
      choices[distinct(q) ? q : a] = 1;                            // genuine last resort (a tiny range boxing in both ends): the old behaviour, rare
    }
    n.m = +pick(Object.fromEntries(Object.entries(choices).map(([k, v]) => [k, v])), rnd);
  }

  // FINAL RESOLUTION [T] — a piece RESOLVES: the last melody note lands on the tonic (^1), never trails onto a
  //   non-chord tone. (The harmony already holds the tonic through the final bar; the line must arrive on it.)
  { const placed = notes.filter(n => n.m != null); if (placed.length) { const lastN = placed[placed.length - 1];
// resolve to the tonic NEAREST THE PENULTIMATE note, so the line arrives by a step / small leap — a leading tone rises to
//   ^1, a ^2 falls to it — never plunges a 7th to a distant low tonic just because the pre-resolution note sat there. [T]
const approachFrom = placed.length >= 2 ? placed[placed.length - 2].m : lastN.m;
const tp = nearestPC([(((tonic % 12) + 12) % 12)], approachFrom, lo, hi); if (tp != null) lastN.m = tp;
      // A GRACEFUL cadence STEPS (or falls a third) to the close — a smooth or lilting line does not LEAP a 4th/5th to its
      //   final tonic. Where the penult would leap, pull it to a chord tone of ITS OWN harmony a step/third from the tonic
      //   (^7 or ^2 over V → a stepwise ^7-^1 / ^2-^1; ^3 over I → a graceful third). Consonant by construction (still a
      //   chord tone). Left alone only for a CRISP / energetic character, where a leap to a bright tonic is a real flourish. [P]
      if (gracefulCad && placed.length >= 2 && Math.abs(placed[placed.length - 2].m - lastN.m) >= 5) {
        const penN = placed[placed.length - 2], penPcs = chordPCs(tonic, mode, chordAt(penN.t));
        let best = null, bd = 1e9;
        for (let q = lo; q <= hi; q++) { if (!isChordTone(q, penPcs)) continue; const toT = Math.abs(q - lastN.m); if (toT < 1 || toT > 4) continue; const cost = toT + Math.abs(q - penN.m) * 0.3; if (cost < bd) { bd = cost; best = q; } }
        if (best != null) penN.m = best;
      }
      // THE FINAL AUTHENTIC CADENCE resolves through its LEADING TONE (both modes) [T — the cadence's own function, the
      //   form pins this bar as PAC]. ^7 rising to ^1 over V→I is the gesture that CONFIRMS the key: the relative key
      //   shares every diatonic chord but has a different leading tone, so this is what tells the ear which note is the
      //   tonic. When the pre-tonic note is a DOMINANT chord tone within a third of the leading tone (the semitone under
      //   ^1), pull it there so the close sounds ^7→^1 (in minor that IS the raised ^7). In a thin two-voice texture the
      //   descending ^2→^1 is a hollow, leading-tone-less close, so here the leading-tone resolution is the strong default;
      //   a genuine far-leap approach (>a third from the leading tone) keeps its own colour, and half/deceptive cadences
      //   are untouched. Grounded in the harmony already there — the leading tone is the dominant's own third.
      if (placed.length >= 2) { const penN = placed[placed.length - 2], penPcs = chordPCs(tonic, mode, chordAt(penN.t));
        const lt = nearestPC([(((tonic - 1) % 12) + 12) % 12], lastN.m, lo, hi);
        if (lt != null && lt < lastN.m && lastN.m - lt <= 2 && Math.abs(penN.m - lt) <= 4 && isChordTone(lt, penPcs)) penN.m = lt; } } }

  // MINOR ^6/^7 by PURPOSE [P — the governing logic, not patched rules]. Every ^6/^7 is either HARMONIC (a chord tone —
  //   its accidental is whatever the CHORD needs: the DOMINANT takes harmonic minor's sharp ^7; III/VII take the natural
  //   7th; VI/iv/ii° take the natural ^6) or MELODIC (a non-chord passing/neighbour tone — melodic minor: sharpen ^6 & ^7
  //   ASCENDING, naturalise DESCENDING). So an augmented 2nd between two CHORD tones is fine (both harmonically justified
  //   — a harmonic idea); only a MELODIC line is smoothed. Decided by chord-membership + direction, per note.
  if (mode === 'min') {
    const nat6 = 8, rai6 = 9, nat7 = 10, rai7 = 11, tpc = (((tonic % 12) + 12) % 12), pcOf = m => (((m - tpc) % 12) + 12) % 12;   // pc RELATIVE to the tonic (so ^6=8/9, ^7=10/11)
    const setPc = (n, deg) => { const cur = pcOf(n.m); if (cur !== deg) n.m += ((deg - cur + 18) % 12) - 6; };   // shift to the nearest accidental of that degree
    const placed = notes.filter(n => n.m != null);
    const raised7 = new Set();
    for (let i = 0; i < placed.length; i++) {                            // ^7 — chord tone follows the chord; non-chord tone follows the melodic line
      const n = placed[i], pc = pcOf(n.m); if (pc !== nat7 && pc !== rai7) continue;
      const cp = chordPCs(tonic, mode, chordAt(n.t)).map(x => (((x - tpc) % 12) + 12) % 12);
      let deg;
      if (cp.includes(rai7)) deg = rai7;                                 // HARMONIC: the chord carries the sharp 7 (V, vii°)
      else if (cp.includes(nat7)) deg = nat7;                            // HARMONIC: the chord carries the natural 7 (III, VII)
      else {                                                             // MELODIC: raise ONLY as a true leading tone stepping UP to the TONIC (^7→^1)
        const nx = placed[i + 1], pv = placed[i - 1];
        deg = (nx && pcOf(nx.m) === 0 && nx.m > n.m && nx.m - n.m <= 2) ? rai7 : nat7;
        // …but AVOID the melodic AUGMENTED 2ND: if the note just below is a ^6 the chord PINS natural (a chord tone, so it
        //   cannot rise to melodic ^6 to match), a raised ^7 would leap an augmented 2nd up from it (nat^6→raised^7). A
        //   composer keeps the line smooth — ^7 stays natural (a modal ^7→^1), the leading tone reserved for the cadence,
        //   where it comes from the dominant chord or the penultimate-note logic, not this mid-phrase branch. [P]
        if (deg === rai7 && pv && pcOf(pv.m) === nat6 && pv.m < n.m && n.m - pv.m <= 3 &&
            chordPCs(tonic, mode, chordAt(pv.t)).map(x => (((x - tpc) % 12) + 12) % 12).includes(nat6)) deg = nat7;
      }
      setPc(n, deg); if (pcOf(n.m) === rai7) raised7.add(i);
    }
    for (let i = 0; i < placed.length; i++) {                            // ^6 — chord tone follows the chord; else melodic (raised only ascending into a raised ^7)
      const n = placed[i], pc = pcOf(n.m); if (pc !== nat6 && pc !== rai6) continue;
      const cp = chordPCs(tonic, mode, chordAt(n.t)).map(x => (((x - tpc) % 12) + 12) % 12);
      let deg;
      if (cp.includes(nat6)) deg = nat6;                                 // HARMONIC: the chord carries the natural ^6 (VI, iv, ii°) → natural
      else if (cp.includes(rai6)) deg = rai6;                            // HARMONIC: the chord carries the RAISED ^6 — an applied dominant leaning into another key (F# in V/V=B major) → the chord's own spelling wins, symmetric with the ^7 branch above (a chord tone follows the harmony in force, home or tonicised)
      else { const nx = placed[i + 1]; deg = (nx && raised7.has(i + 1) && nx.m > n.m) ? rai6 : nat6; }   // MELODIC: melodic-minor ascending (raise ^6 into a raised ^7). A DESCENDING ^7→^6→^5 stays NATURAL — that is the harmonic-minor scale, idiomatic; raising it to #^6 both mis-smooths an idiomatic figure AND cross-relates with the bass's natural ^6.
      setPc(n, deg);
    }
  }

  // 3b. PLAYABILITY NEGOTIATION [P — a composer writes a PLAYABLE line; where intent and the HAND conflict at a note,
  //     bend whichever is cheaper to bend AT THAT MOMENT]. Finger the line; at each residual same-finger SLIDE/SKIP
  //     (a spot the hand cannot join cleanly), IF the offending note is an adaptable DECORATION — a weak-beat NON-chord
  //     passing/neighbour tone, NEVER a chord tone / a beat-strong note / the climax / a cadence-bar note — nudge it to
  //     the diatonic neighbour that stays a smooth decoration (a step from its neighbours, same contour) AND clears the
  //     blemish when re-fingered. A STRUCTURAL note is left as written and its fingering accepted. So a good line is
  //     untouched by construction — only an adaptable decoration in a genuinely awkward spot ever bends. [situational]
  {
    const scalePcs = scalePCsOf(mode, tonic);
    const isBlk = m => [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);
    const single = i => notes[i] && notes[i].m != null && !Array.isArray(notes[i].m);
    const findBlemishes = () => {                                        // later index of each same-finger connected slide/skip
      const { fings } = fingerHandDP(notes, 'rh', scalePcs);
      const S = []; notes.forEach((n, i) => { if (single(i)) S.push(i); });
      const spots = [];
      for (let k = 1; k < S.length; k++) { const a = S[k - 1], b = S[k]; if (b !== a + 1) continue;   // a rest/lift between → free
        if (fings[a] == null || fings[a] !== fings[b]) continue;
        const dp = Math.abs(notes[b].m - notes[a].m); if (dp < 1 || dp > 7) continue;                 // a connected slide (step) or same-finger skip (3rd+)
        if (isBlk(notes[a].m) && !isBlk(notes[b].m) && dp <= 2) continue;                             // black→white edge slide is idiomatic
        spots.push(b); }
      return spots;
    };
    const maxPitch = Math.max(...notes.filter((n, i) => single(i)).map(n => n.m));
    let blem = findBlemishes();
    for (let pass = 0; pass < 2 && blem.length; pass++) {
      let changed = false;
      for (const i of blem) {
        if (!single(i)) continue; const n = notes[i];
        const cp = chordPCs(tonic, mode, chordAt(n.t));
        if (n.strong || isChordTone(n.m, cp) || n.m === maxPitch || cadEndBars.has(n.bar)) continue;  // STRUCTURAL → never bent
        let pi = i - 1; while (pi >= 0 && !single(pi)) pi--;
        let ni = i + 1; while (ni < notes.length && !single(ni)) ni++;
        const prev = pi >= 0 ? notes[pi].m : null, next = ni < notes.length ? notes[ni].m : null;
        const cands = []; for (const dir of [1, -1]) for (let d = 1; d <= 2; d++) { const q = n.m + dir * d; if (q < lo || q > hi) break; if (scalePcs.includes(((q % 12) + 12) % 12)) { cands.push(q); break; } }
        let bestC = null, bestCount = blem.length;
        for (const c of cands) {
          if (prev != null && Math.abs(c - prev) > 2) continue;                     // stay a step from the neighbours (a decoration, not a leap)
          if (next != null && Math.abs(c - next) > 2) continue;
          if (prev != null && Math.sign(n.m - prev) !== 0 && Math.sign(c - prev) !== Math.sign(n.m - prev)) continue;   // preserve contour INTO the note
          if (next != null && Math.sign(next - n.m) !== 0 && Math.sign(next - c) !== Math.sign(next - n.m)) continue;   // and OUT of it
          const save = n.m; n.m = c; const cnt = findBlemishes().length; n.m = save;
          if (cnt < bestCount) { bestCount = cnt; bestC = c; }
        }
        if (bestC != null) { n.m = bestC; changed = true; }
      }
      if (!changed) break;
      blem = findBlemishes();
    }
  }

  // 3b. MOTIVIC AIR [P — a crisp character's detachment is RHYTHMIC, not only a staccato dot]: a plain crotchet on a WEAK
  //     beat clips to a quaver + a quaver-rest — the "note then air" gap. Decided ONCE for the piece (a consistent lean,
  //     so it reads as the tune's character, not random holes) and applied to every qualifying beat. NEVER on a metrically
  //     strong beat — not the downbeat, and not the 4/4 mid-bar (beat 3 is secondary-strong: ONE-two-THREE-four); a composer
  //     SUSTAINS the strong beats and clips the weak ones. Never in a cadence bar (the phrase breath owns the ends). This is
  //     exactly the short-note-plus-rest a composer writes instead of dotting-and-detaching a longer value. Reuses the below.
  if (gap > 0 && rnd() < gap) {
    const midStrong = Math.floor(nbeats / 2) * beatLen;   // the 4/4 secondary-strong beat (no such beat in 2/4 or 3/4)
    for (const n of notes) {
      if (n.m == null || n._breathRest) continue;
      const inBar = (((n.t % barU) + barU) % barU);
      const strongBeat = inBar < 1e-9 || (nbeats >= 4 && Math.abs(inBar - midStrong) < 1e-9);
      if (Math.abs(n.d - 1) < 1e-9 && !strongBeat && Math.abs(inBar % beatLen) < 1e-9 && !cadEndBars.has(n.bar)) { n.d = 0.5; n._breathRest = 0.5; }
    }
  }

  // 4. BREATHE at phrase ends [P] — a composer lifts the line to articulate a phrase (matched to articulation later).
  //    At a mid/interior cadence bar, with a lean, carve a rest off the last note so the line breathes before the next
  //    phrase. Never at the final bar (the piece resolves on a note, it doesn't trail into a rest).
  // breath tendency is the CHARACTER's (legato/lyrical breathe clearly; crisp/running clip or run on), and the breath
  //   LENGTH matches articulation — a legato line lifts a full beat (note ending on a beat), a detached one clips. [P]
  // a STRUCTURAL cadence (the antecedent phrase ending) near-always breathes — the line lifts because the phrase closed,
  //   whatever the character. Character governs the OPTIONAL sub-phrase breaths and the breath LENGTH, not this one. [P]
  const breathLean = b => cadEndBars.has(b) ? Math.max(90, Math.round(breath * 95)) : ((b + 1) % 2 === 0 && b >= 1 ? Math.round(breath * 48) : 0);
  const READ = new Set([0.5, 1, 1.5, 2, 3, 4]);   // the notatable durations the core produces; carving must stay inside it
  for (let cb = 0; cb < nbars - 1; cb++) {
    const lean = breathLean(cb); if (!lean) continue;
    const inBar = notes.filter(n => n.t >= cb * barU - 1e-9 && n.t < (cb + 1) * barU - 1e-9 && n.m != null);
    if (!inBar.length) continue;
    const last = inBar[inBar.length - 1];
    if (last._breathRest) continue;                                            // the motivic-air pass already gave this note its rest — don't carve twice
    if (Math.abs((last.t + last.d) % beatLen) > 1e-9) continue;                 // only breathe where the note ends on a beat (rest stays aligned)
    // the breath carves a rest measured in the metre's own BEAT: a crotchet in simple, a DOTTED crotchet (beatLen=1.5) in
    //   compound — so the shortened note still ends ON a beat and the rest is beat-aligned (carving a quarter in 6/8 left the
    //   note hanging mid-beat-2). Simple metre keeps its character-dependent crotchet/quaver lift. [P]
    const want = beatLen > 1 + 1e-9
      ? (last.d >= 2 * beatLen - 1e-9 ? beatLen : 0)                                              // compound: lift a full dotted-crotchet beat, only if a beat still remains
      : (legato ? (last.d >= 2 ? 1 : last.d >= 1 ? 0.5 : 0) : (last.d >= 1.5 ? 0.5 : 0));         // simple (unchanged): legato lifts a full beat, detached clips
    // keep BOTH the shortened note and the rest notatable; if the wanted carve wouldn't, fall back to a clean full-beat lift.
    let restD = 0;
    if (want > 0 && READ.has(last.d - want) && READ.has(want)) restD = want;
    else if (beatLen <= 1 + 1e-9 && last.d - 1 >= 0.5 && READ.has(last.d - 1)) restD = 1;         // simple-metre fallback only (a compound quarter-carve would mis-align the beat)
    if (restD > 0 && pick({ breathe: lean, hold: 100 - lean }, rnd) === 'breathe') { last.d -= restD; last._breathRest = restD; }
  }
  // 4b. THE ENDING follows the final phrase's own MOMENTUM [P], read from the APPROACH itself — NOT from the character's
  //     label. A phrase that DRIVES into the close on short, detached notes stamps the tonic short and lets the bar breathe
  //     out (a button); a phrase that BROADENS into the close on long notes lets the tonic ring (a hold). A lyrical line
  //     holds not because it is "lyrical" but because its approach IS long notes — the momentum measure already sees that,
  //     so the character's intent is read from the notes its temperament shaped, not gated on its name. The tonic still
  //     arrives on the downbeat and resolves the cadence — only its length changes. The bass is clipped to match in the adapter.
  {
    const appr = notes.filter(n => n.m != null && n.bar === nbars - 2);   // the phrase's approach bar
    const apprTot = appr.reduce((s, n) => s + n.d, 0);
    const shortFrac = apprTot > 0 ? appr.reduce((s, n) => s + (n.d < beatLen - 1e-9 ? n.d : 0), 0) / apprTot : 0;
    if (shortFrac >= 0.5) {                                        // the approach is mostly short notes → the phrase drives IN → stamp
      const fb = notes.filter(n => n.bar === nbars - 1 && n.m != null);
      const fl = fb[fb.length - 1];
      const soundD = barU / 2;   // the button fits the bar — half plays, half breathes (2/4 crotchet, 3/4 dotted-crotchet, 4/4 minim)
      if (fl && !fl._breathRest && fl.d > soundD && READ.has(soundD) && READ.has(fl.d - soundD)) { fl._breathRest = fl.d - soundD; fl.d = soundD; }
    }
  }
  const out = [];
  for (const n of notes) { out.push({ m: n.m, d: n.d }); if (n._breathRest) out.push({ rest: true, d: n._breathRest }); }
  return out;
}

// ================= STAGE 3: the BASS / counter-line — a MOVING line, harmony emerging from it =================
// The bass is not one root per bar; it MOVES. Over each structural pillar it outlines the chord (arpeggiation) and
// passes between chord tones, so the harmony at every instant is WHAT THE TWO VOICES MAKE — a stable pillar on the
// felt stresses, embellishing (passing / neighbour) harmony emerging on the weaker subdivisions, down to the eighth.
// Metrically WEIGHTED, never quantised: a chord tone leans to a beat; a passing/neighbour tone leans to the off-beat;
// the surface RATE grows toward the cadence (intensity). Everything is a preference; every note has a role. On the
// felt stresses both voices are chord tones of the one pillar, so the vertical is coherent BY CONSTRUCTION.
const nearestOfPc = (pc, ref, lo, hi) => { let best = null, bd = 1e9; for (let p = lo; p <= hi; p++) if ((((p % 12) + 12) % 12) === pc && Math.abs(p - ref) < bd) { bd = Math.abs(p - ref); best = p; } return best; };
const scalePCsOf = (mode, tonic) => { const tpc = (((tonic % 12) + 12) % 12); return SCALE[mode].map(s => ((tpc + s) % 12)); };   // the key's scale, transposed to its tonic

// ================= the STRUCTURAL BASS LINE — inversions chosen as a VOICE-LED PATH =================
// One bass note (the INVERSION) per harmonic event, chosen across the phrase as a weighted path (Viterbi). The four
// drivers, all preference: (1) VOICE LEADING — minimal motion / common tone held (the transition Δ), tendency-tone
// resolution (a leading tone in the bass rises to the tonic), no outer parallels with the tune, contrary motion;
// (2) COMPLETENESS — freed by what the MELODY covers over the event's span (tune states root+third → bass free to
// invert for line; else lean to supply the root), grade-scaled; (3) ANCHORING — root at the arrivals (open /
// cadential V / final); (4) IDIOMS — a diminished chord takes first inversion (third in bass); a planned inversion
// (bassDeg, e.g. the cadential 6/4) is honoured. Nothing forbidden — a composer can write the rare exception.
function structuralBassLine({ plan, tonic, mode, lo, hi, melody, grade }) {
  const events = plan.events;
  const rootPcOf = ev => (((scalePitch(tonic, mode, ev.deg)) % 12) + 12) % 12;
  const thirdPcOf = (ev, pcs) => { const r = rootPcOf(ev); return pcs.find(p => [3, 4].includes((((p - r) % 12) + 12) % 12)); };
  const leadingPc = ((((tonic % 12) + 11) % 12) + 12) % 12;               // raised ^7 (a semitone below the tonic)
  const perfect = iv => { const s = (((iv % 12) + 12) % 12); return s === 7 || s === 0; };
  let a = 0; const mtl = []; for (const n of (melody || [])) { mtl.push({ t0: a, t1: a + n.d, m: n.m }); a += n.d; }
  const melOnset = ev => { for (const n of mtl) if (n.t0 <= ev.start + 1e-9 && n.t1 > ev.start + 1e-9) return n.m; return null; };
  // weighted coverage of an event by the melody over its SPAN — a note ON the onset, longer, counts more.
  const coverage = ev => {
    const pcs = chordPCs(tonic, mode, ev), rootPc = rootPcOf(ev), thirdPc = thirdPcOf(ev, pcs);
    let root = 0, third = 0, tot = 0;
    for (const n of mtl) { const s = Math.max(n.t0, ev.start), e = Math.min(n.t1, ev.start + ev.dur); if (e <= s + 1e-9) continue;
      const w = (e - s) * (Math.abs(n.t0 - ev.start) < 1e-9 ? 2 : 1); tot += w; const pc = (((n.m % 12) + 12) % 12);
      if (pc === rootPc) root += w; if (pc === thirdPc) third += w; }
    return { root: tot ? root / tot : 0, third: tot ? third / tot : 0, rootPc, thirdPc, pcs };
  };
  // THE STRUCTURAL BASS IS A LINE WHOSE NOTE IS THE HARMONY'S FOUNDATION. A composer's structural bass is the ROOT (it
  //   states the chord, its foundation) or — for the sake of the LINE (a smoother, lighter bass; a step, not a leap; relief
  //   from a run of root positions) — the THIRD (first inversion). The FIFTH is NOT offered as a structural bass note: a
  //   second inversion is a deliberate DEVICE (a cadential 6/4, a pedal), invoked on purpose via bassDeg, never a landing an
  //   optimiser drifts onto. The fifth enters the bass ONLY later, as a PASSING or ARPEGGIATED tone while the surface line
  //   is moving (see bassSkeleton's weak beats). So an accidental 6/4 cannot be CHOSEN here — not because it is penalised,
  //   but because the fifth is never a candidate for the foundation. This is why the bass needs NO 6/4 penalty anywhere.
  //   [composer: the bass states the foundation — root, or third for the line; the fifth is a device, not a default]
  const cands = events.map(ev => {
    const pcs = chordPCs(tonic, mode, ev), rpc = rootPcOf(ev), tpc = thirdPcOf(ev, pcs);
    const want = new Set([rpc, tpc]);
    if (ev.bassDeg != null) want.add((((scalePitch(tonic, mode, ev.bassDeg)) % 12) + 12) % 12);   // a planned inversion (incl. a cadential 6/4) is a deliberate device — honoured
    const arr = []; for (let p = lo; p <= hi; p++) if (want.has((((p % 12) + 12) % 12))) arr.push(p);
    if (arr.length) return arr;
    const any = []; for (let p = lo; p <= hi; p++) if (isChordTone(p, pcs)) any.push(p);            // LAST resort only: a narrow box holds neither root nor third — accept whatever chord tone fits (not a preference, a constraint)
    return any.length ? any : [Math.round((lo + hi) / 2)];
  });
  const N = events.length;
  const nodeCost = (i, b) => {
    const ev = events[i], pc = (((b % 12) + 12) % 12), rootPc = rootPcOf(ev), cov = coverage(ev);
    if (ev.bassDeg != null) { const bd = (((scalePitch(tonic, mode, ev.bassDeg)) % 12) + 12) % 12; return pc === bd ? -3 : 20; }  // a planned inversion is honoured
    let c = 0;
    const rootNeed = 1 - cov.root;                                        // 0 = the tune already sang the root (the bass is free to take the third for its line) … 1 = the tune never states it (the bass should)
    if (pc === rootPc) c -= 1.5 * rootNeed + 0.5;                         // ROOT = the foundation, home; strongest when the tune left the root unstated (so the harmony is clear), plus a mild standing lean to root position
    else c -= 0.5 * (1 - rootNeed);                                       // THIRD (first inversion) = the line's choice, freed when the tune already covers the root; the transCost below is what actually reaches for it (a smoother, contrary line)
    if (ev.q === 'dim') { if (pc === rootPc) c += 3; if (pc === cov.thirdPc) c -= 2; }  // a diminished chord wants FIRST INVERSION (vii°6) — root position is harsh; a composer voices the third in the bass
    if (i === 0 && pc === rootPc) c -= 8;                                 // the OPENING plants the tonic — a root-position pillar (a strong lean, not a wall)
    if (i === N - 1 && pc === rootPc) c -= 9;                             // the CLOSE is a root-position tonic — a conclusive cadence (a strong lean; the third survives only where the box denies the root). The fifth was never a candidate, so a 6/4 close simply cannot occur — nothing to forbid.
    if (ev.fn === 'D' && i + 1 < N && events[i + 1].fn === 'T' && i + 1 === N - 1 && pc === rootPc) c -= 2;  // the cadential dominant roots
    return c;
  };
  const transCost = (i, bp, b) => {
    let c = Math.abs(b - bp) * 0.4;                                       // minimal motion / hold a common tone (Δ=0 best)
    if ((((bp % 12) + 12) % 12) === leadingPc && !(b > bp && b - bp <= 2)) c += 3;   // a leading tone in the bass must rise a step to the tonic
    // TWO-PART COUNTERPOINT against the tune [T — how a composer writes the second voice]: prefer CONTRARY motion (the
    //   counter-line's default), allow OBLIQUE (a held tone); a parallel 5th/8ve is forbidden and a DIRECT (hidden) 5th/8ve
    //   — similar motion INTO a perfect interval — is avoided too. So the second voice is a real line, and parallels do not
    //   arise by construction (no post-hoc repair, no 6/4 escape).
    const m0 = melOnset(events[i - 1]), m1 = melOnset(events[i]);
    if (m0 != null && m1 != null) { const bM = b - bp, mM = m1 - m0;
      if (bM && mM) {
        if (Math.sign(bM) === Math.sign(mM)) {                                              // similar motion
          if (perfect(m1 - b)) { c += 5; if (perfect(m0 - bp) && ((m1 - b) % 12 + 12) % 12 === ((m0 - bp) % 12 + 12) % 12) c += 18; }   // direct 5th/8ve; a PARALLEL perfect is far worse
          else c += 0.5;
        } else c -= 0.7;                                                                    // CONTRARY motion — reward the counter-line
      }
    }
    return c;
  };
  const dp = cands.map(() => []);
  cands[0].forEach((b, bi) => dp[0][bi] = { cost: nodeCost(0, b), prev: -1 });
  for (let i = 1; i < N; i++) cands[i].forEach((b, bi) => { let best = 1e9, bp = -1;
    cands[i - 1].forEach((pb, pj) => { const c = dp[i - 1][pj].cost + transCost(i, pb, b); if (c < best) { best = c; bp = pj; } });
    dp[i][bi] = { cost: best + nodeCost(i, b), prev: bp }; });
  let bi = 0, bc = 1e9; dp[N - 1].forEach((s, j) => { if (s.cost < bc) { bc = s.cost; bi = j; } });
  const path = new Array(N); for (let i = N - 1; i >= 0; i--) { path[i] = cands[i][bi]; bi = dp[i][bi].prev < 0 ? 0 : dp[i][bi].prev; }
  return path;
}

// the per-beat BASS SKELETON: anchors each event's STRONG beats to the structural (voice-led) bass note, and
// arpeggiates AROUND it on the weak beats — so the inversion is the reasoned path, the surface just figures it.
function bassSkeleton({ plan, tonic, mode, barU, nbars, range, melody, beatLen, grade, drama = null }) {
  const [lo, hi] = range;
  const total = nbars * barU;
  const scalePcs = scalePCsOf(mode, tonic);
  const chordAt = t => { for (let i = plan.events.length - 1; i >= 0; i--) if (plan.events[i].start <= t + 1e-9) return plan.events[i]; return plan.events[0]; };
  const build = melody ? (() => { let a = 0, arr = []; for (const n of melody) { arr.push({ t: a, m: n.m }); a += n.d; } return arr; })() : [];
  const melAt = t => { let r = null; for (const n of build) { if (n.t <= t + 1e-9) r = n.m; else break; } return r; };
  const melBefore = t => { let r = null; for (const n of build) { if (n.t < t - 1e-9) r = n.m; else break; } return r; };   // the tune ENTERING this beat (its last onset before t)
  const perfect = iv => { const s = (((iv % 12) + 12) % 12); return s === 7 || s === 0; };
  const nbeats = Math.max(1, Math.round(barU / beatLen));
  const inBar = t => (((t % barU) + barU) % barU);
  const strength = t => { const w = inBar(t); if (w < 1e-9) return 3; if (Math.abs(w - Math.floor(nbeats / 2) * beatLen) < 1e-9) return 2; if (Math.abs(w % beatLen) < 1e-9) return 1; return 0; };
  // accompaniment ACTIVITY follows the shared dramatic tension — sparser when calm, busier driving to the climax,
  //   relaxing after. A [P] lean (a calm passage can stay calm), not a rule; every added note serves the build.
  const intensityAt = drama ? (t => 0.35 + 1.1 * drama.tensionAt(t)) : (t => 0.6 + 0.8 * (t / total));
  const eventBass = structuralBassLine({ plan, tonic, mode, lo, hi, melody, grade });   // the voice-led inversion path
  const eventIdxAt = t => { for (let i = plan.events.length - 1; i >= 0; i--) if (plan.events[i].start <= t + 1e-9) return i; return 0; };
  const beats = []; for (let t = 0; t < total - 1e-9; t += beatLen) beats.push(t);
  let prev = null;
  const skel = beats.map(t => {
    const ei = eventIdxAt(t), ev = plan.events[ei], pcs = chordPCs(tonic, mode, ev);
    const anchor = eventBass[ei];                                         // this event's structural bass note (its inversion)
    const fifthPc = ev.bassDeg != null || ev.q === 'dim' ? -1 : ((((scalePitch(tonic, mode, ev.deg)) + 7) % 12) + 12) % 12;
    const st = strength(t), mel = melAt(t), melPre = melBefore(t);
    const isOnset = Math.abs(t - ev.start) < 1e-9;
    const isFinalBeat = t >= total - beatLen - 1e-9;                                    // the piece's very last beat = the cadential ARRIVAL
    const cands = []; for (let p = lo; p <= hi; p++) if (isChordTone(p, pcs)) cands.push(p);
    const isStrong = isOnset || st >= 2 || isFinalBeat;
    // WHERE the bass may go depends on the beat, the way a composer voices a bass: on a STRONG beat (or the close) the bass
    //   sounds the harmony's FOUNDATION — the structural note, a root or a third (the anchor is already one of those). On a
    //   WEAK beat the bass MOVES — it may arpeggiate up through the chord or step, and THAT is the only place the fifth
    //   appears, as a passing / arpeggiated tone in a moving line. So the fifth is never STATED on a strong beat, not by a
    //   penalty but because a strong beat is the foundation and the fifth is not the foundation. [composer: state the
    //   foundation on the beat; move through the rest]
    const rPc = (((scalePitch(tonic, mode, ev.deg)) % 12) + 12) % 12;
    const tPc = (() => { const th = pcs.find(p => [3, 4].includes((((p - rPc) % 12) + 12) % 12)); return th == null ? -1 : (((th % 12) + 12) % 12); })();
    const foundationPc = new Set([rPc, tPc]);
    if (ev.bassDeg != null) foundationPc.add((((scalePitch(tonic, mode, ev.bassDeg)) % 12) + 12) % 12);
    let beatCands = cands;
    if (isStrong) { const f = cands.filter(p => foundationPc.has((((p % 12) + 12) % 12))); if (f.length) beatCands = f; }   // a strong beat offers only the foundation (root/third); the fifth is simply not among them
    const score = p => {
      let s = 0;
      // TWO-PART COUNTERPOINT against the tune, on EVERY beat [T — the second voice is a real line, not a chord that
      //   happens to sit under the melody]: prefer CONTRARY motion, allow OBLIQUE, and AVOID a parallel or direct (hidden)
      //   perfect 5th/8ve. This is where the parallels are actually kept out — at the source, by choosing the inversion
      //   (the third) that keeps the lines independent, not by a later repair.
      if (mel != null && melPre != null && prev != null) { const mM = mel - melPre, bM = p - prev;
        if (mM && bM) {
          if (Math.sign(mM) === Math.sign(bM)) {                                        // similar motion
            if (perfect(mel - p)) { s -= 6; if (perfect(melPre - prev) && (((mel - p) % 12) + 12) % 12 === (((melPre - prev) % 12) + 12) % 12) s -= 14; }   // direct 5th/8ve; a PARALLEL perfect is worse
            else s -= 0.4;
          } else s += 0.7;                                                              // contrary — the counter-line's default
        }
      }
      if (isStrong) s += p === anchor ? 4 : -Math.abs(p - anchor) * 0.25;              // lean to the structural bass (root/third); counterpoint may pull it to the other foundation tone. [P]
      else if (p !== anchor) s += 1.2;                                                 // weak beat: arpeggiate AWAY (movement) — the fifth lives here, passing
      if (prev != null) s -= Math.abs(p - prev) * 0.3;                                 // [P] smooth line
      return s;
    };
    let best = beatCands[0], bs = -1e9;
    for (const p of beatCands) { const s = score(p); if (s > bs) { bs = s; best = p; } }
    prev = best;
    return { t, pcs, m: best, ev, st };
  });
  return { skel, lo, hi, scalePcs, chordAt, melAt, perfect, nbeats, inBar, strength, intensityAt, total };
}

// the BROKEN (arpeggiated) / BASSLINE (walking) left-hand — two distinct moving-bass idioms over the structural skeleton.
export function composeBass({ plan, tonic, mode, barU, nbars, range, melody = null, beatLen = 1, density = 0.35, drama = null, texture = 'broken', rnd = Math.random }) {
  const { skel, lo, hi, scalePcs, melAt, perfect, intensityAt } = bassSkeleton({ plan, tonic, mode, barU, nbars, range, melody, beatLen, drama });
  // the two hands must AGREE on the scale's inflection: a composer never sounds a natural ^6/^7 in the bass against the
  //   melody's RAISED ^6/^7 (melodic-minor), a chromatic cross-relation between one's own hands. When the melody sings the
  //   raised form, the bass passing tone must not be the conflicting natural — hold the beat instead. [P — the bass follows
  //   the melody's inflection; the melody stays composer-correct (melodic-minor ascending), the accompaniment agrees.]
  const tpcB = (((tonic % 12) + 12) % 12), relPc = m => (((m - tpcB) % 12) + 12) % 12;
  const clashPc = (b, r) => (b === 8 && r === 9) || (b === 9 && r === 8) || (b === 10 && r === 11) || (b === 11 && r === 10);
  const crossRelMel = (bassM, t) => {                                    // the bass note sounds across [t, t+½beat]; check the tune at BOTH ends (a fast tune can change mid-note)
    if (mode !== 'min') return false; const b = relPc(bassM);
    for (const tt of [t, t + beatLen / 2 - 1e-6]) { const mm = melAt(tt); if (mm != null && clashPc(b, relPc(mm))) return true; }
    return false;
  };
  const parallelsMel = (b0, b1, t0, t1) => {
    const m0 = melAt(t0), m1 = melAt(t1); if (m0 == null || m1 == null) return false;
    const bM = b1 - b0, mM = m1 - m0; if (!bM || !mM || Math.sign(bM) !== Math.sign(mM)) return false;
    return perfect(m0 - b0) && perfect(m1 - b1) && (((m1 - b1) % 12) + 12) % 12 === (((m0 - b0) % 12) + 12) % 12;
  };
  const out = [];
  // the broken / walking bass moves at a COHERENT surface rate shaped by the drama [P — a LEAN, decided once PER BAR so the
  //   bar stays coherent, not a per-beat scatter]. Whether a bar walks (its beats break into connecting eighths) is drawn
  //   with probability drive × tension: near zero at a calm opening, rising into the climax — so the bass thickens toward
  //   the build the way a composer intensifies an accompaniment, and every bar can, in proportion to the build. A calm
  //   character (low drive) rarely walks and keeps its tread; a driving one walks most of the way. The whole-bar decision
  //   keeps a walking bar a clean stream and a calm bar a clean tread (no stutter).
  const walkBar = {}, barOf = t => Math.floor(t / barU + 1e-9);
  const shouldWalk = bi => { if (!(bi in walkBar)) walkBar[bi] = rnd() < Math.min(1, density * intensityAt((bi + 0.5) * barU)); return walkBar[bi]; };
  const nbeats = Math.max(1, Math.round(barU / beatLen));
  let prevBass = null, curAnchor = skel[0] ? skel[0].m : lo, arpPos = 0;
  // a broken bass is a CONSISTENT FIGURE — a broken chord ASCENDING from the bar's bass, the same shape every bar, the way a
  //   composer writes an arpeggiated accompaniment (not a per-beat anti-repeat, not a passing-tone walk). The bass is stated
  //   on an anchor beat (downbeat / mid-bar downbeat in 4/4 / harmony change); each following beat climbs to the NEXT chord
  //   tone above it, cycling — a line the ear can follow. Where the build is strong the figure thickens to an eighth
  //   arpeggio (the next chord tone up filling the beat), the way a composer intensifies it. Where only the bass is reachable
  //   it holds (a genuine range constraint, never a repeated drone). [P — how a composer writes a broken chord]
  const upFrom = (floor, pcs) => { const u = []; for (let p = floor + 1; p <= hi; p++) if (isChordTone(p, pcs)) u.push(p); return u; };
  const fifthPcOf = ev => { const r = (((scalePitch(tonic, mode, ev.deg)) % 12) + 12) % 12; return ev.q === 'dim' ? -1 : (r + 7) % 12; };
  // the bass = the lowest chord tone (so the figure has room above), but PREFER a non-fifth tone (root/third): a moving
  //   bass whose foundation is the fifth reads as a 6/4 on a short chord. Fall back to the fifth only if nothing else fits.
  const chordLowest = (pcs, skipPc = -1) => { let fb = null; for (let p = lo; p <= hi; p++) if (isChordTone(p, pcs)) { if ((((p % 12) + 12) % 12) !== skipPc) return p; if (fb == null) fb = p; } return fb; };
  // a broken chord is the harmony ARPEGGIATED from its FOUNDATION. The anchor is the lowest root/third (the same
  //   foundation the structural bass states — the fifth is not a foundation); from there the figure climbs THROUGH the
  //   chord's tones. The fifth is sounded here, as an arpeggio tone in the rising figure — which is exactly what a
  //   passing/arpeggiated fifth in the bass IS, never a stated 6/4. Where the foundation sits high in the hand with no
  //   room above, the arpeggio descends instead (a composer arpeggiates the chord in whatever direction the register
  //   allows) — so it always MOVES, no stall. [composer: arpeggiate the chord up from its foundation]
  const downFrom = (ceil, pcs) => { const d = []; for (let p = ceil - 1; p >= lo; p--) if (isChordTone(p, pcs)) d.push(p); return d; };
  const arpAnchor = (pcs, ev) => chordLowest(pcs, fifthPcOf(ev));                // the lowest root/third (the fifth only if the hand holds nothing else — chordLowest's fallback)
  // the figure arpeggiates from the foundation the PLAN chose: the skeleton's voice-led bass note (root by default, the third
  //   for the line / a chosen inversion, leaning to the root where the melody left it unstated), taken at its LOWEST octave so
  //   the figure has room to climb — so a structural chord sounds the plan's foundation, never a rootless voicing it didn't
  //   choose. Where that pitch-class isn't reachable low, the old lowest-root/third anchor stands. [P — realise the plan]
  const planAnchor = (a) => { const apc = (((a.m % 12) + 12) % 12);
    for (let p = lo; p <= hi; p++) if ((((p % 12) + 12) % 12) === apc && isChordTone(p, a.pcs)) return p;
    return arpAnchor(a.pcs, a.ev); };
  const arpNote = (a, isAnchor) => {
    if (isAnchor) { curAnchor = planAnchor(a) ?? a.m; arpPos = 0; return curAnchor; }
    const up = upFrom(curAnchor, a.pcs); if (up.length) { arpPos++; return up[(arpPos - 1) % up.length]; }   // climb the chord
    const dn = downFrom(curAnchor, a.pcs); if (dn.length) { arpPos++; return dn[(arpPos - 1) % dn.length]; }  // foundation high in the hand → arpeggiate down
    return curAnchor;                                                            // only one chord tone fits the hand (rare)
  };

  // a BASSLINE is a different idea from a broken chord: a WALKING bass, a conjunct LINE. It states the chord's bass on the
  //   downbeat, then walks by scale step (diatonic passing tones) TOWARD the next bar's bass — directed, horizontal motion,
  //   the way a composer writes a minuet/scherzo tread. Not arpeggiated (that is the broken texture); not a repeated drone.
  //   Where the next root sits above, the line climbs to approach it; where it repeats, the line walks down and steps back
  //   up onto the restated root. The two hands still agree on the scale's inflection (no natural ^6/^7 against a raised tune).
  //   [P — how a composer voices a walking bass, distinct from a broken chord]
  if (texture === 'bassline') {
    // a scale-degree LADDER (every diatonic pitch in range) lets the line step by scale degree cleanly.
    const ladder = []; for (let p = lo; p <= hi; p++) if (scalePcs.includes((((p % 12) + 12) % 12))) ladder.push(p);
    if (!ladder.length) ladder.push(lo);
    const idxOf = m => { let best = 0, bd = 1e9; for (let j = 0; j < ladder.length; j++) { const d = Math.abs(ladder[j] - m); if (d < bd) { bd = d; best = j; } } return best; };
    // the tune's onsets (relative pcs), so the walking bass can check for a ^6/^7 cross-relation across a whole beat span —
    //   a fast tune passes through its raised ^6/^7 mid-beat, which the two-sample crossRelMel would miss.
    const melTL = []; if (melody) { let a = 0; for (const n of melody) { if (!n.rest) melTL.push({ t: a, pcs: (Array.isArray(n.m) ? n.m : [n.m]).map(relPc) }); a += n.d; } }
    const clashesOver = (bassM, t0, dur) => { if (mode !== 'min') return false; const b = relPc(bassM); for (const o of melTL) { if (o.t >= t0 - 1e-9 && o.t < t0 + dur - 1e-9) for (const rp of o.pcs) if (clashPc(b, rp)) return true; } return false; };
    const barLow = {}, barPcs = {};
    for (const a of skel) { const b = barOf(a.t); if (!(b in barLow)) { barLow[b] = chordLowest(a.pcs, fifthPcOf(a.ev)) ?? a.m; barPcs[b] = a.pcs; } }
    // each bar is a scalar RUN: the root on the downbeat, then a diatonic walk that HEADS toward the next bar's root (the
    //   next root does not sound until the next downbeat, so the line keeps moving all bar and the downbeat leaps onto it).
    //   Turns only at the range edge. A repeated root walks down and the downbeat steps back up. This is continuous motion,
    //   never a drone — the essence of a walking bass.
    // A walking bass is a COUNTER-LINE, not a blind scale: each beat steps TOWARD the next structural root (the line's
    //   goal, the pull growing as the downbeat nears so the walk arrives in time), and among the diatonic steps that
    //   serve that direction it takes the one that SINGS AGAINST THE TUNE — consonant on the beat (a m2/M7/tritone
    //   against the melody is the harshness a composer voices around), and moving CONTRARY / oblique to the tune so the
    //   two outer voices stay independent. This is the same two-part counterpoint the structural bass already uses,
    //   brought INTO the walk. Each step is a weighted choice among the reachable neighbours — a clash is scored low but
    //   never zero (a genuinely boxed walk still moves), contrary motion is a lean not a law. Boxed at the ladder edge,
    //   the only available neighbour is taken (the roomy way falls out — no wobble). [P — how a composer voices a walk]
    const buildWalk = (cur, nextRoot, bt) => {
      let idx = idxOf(cur); const line = [cur];   // beat 0 = the TRUE chord bass — may be chromatic (a minor V's raised ^7); never snapped to the ladder
      const goalIdx = idxOf(nextRoot);
      for (let k = 1; k < nbeats; k++) {
        const t = bt + k * beatLen, mel = melAt(t), melPrev = melAt(t - beatLen);
        const cands = []; for (const d of [-1, 1]) { const ni = idx + d; if (ni >= 0 && ni < ladder.length) cands.push(ni); }
        if (!cands.length) cands.push(idx);
        const toward = Math.sign(goalIdx - idx);
        const wt = ni => {
          let w = 1;
          if (toward !== 0) w *= (Math.sign(ni - idx) === toward) ? (1 + 1.4 * (k / nbeats)) : (1 - 0.5 * (k / nbeats));   // head to the root, pull growing toward the downbeat
          const p = ladder[ni];
          if (mel != null) {
            const iv = (((mel - p) % 12) + 12) % 12;
            // consonant on the beat (3rds/6ths/5th/octave) sings; a m2/M7/tritone is the harsh clash a composer voices
            //   AROUND even at the cost of the goal (scored so low the goal-pull cannot buy it, yet never zero — a walk
            //   boxed to only-clashing steps still moves); a M2/m7/P4 is a milder weak-beat passing dissonance, dispreferred
            //   but idiomatic in a walk, so only lightly damped.
            w *= (iv === 1 || iv === 11 || iv === 6) ? 0.04 : (iv === 2 || iv === 10 || iv === 5) ? 0.55 : 1.3;
            if (melPrev != null) { const mM = Math.sign(mel - melPrev), bM = Math.sign(p - ladder[idx]); if (mM && bM) w *= (mM !== bM) ? 1.4 : 0.7; }   // contrary/oblique, not parallel
          }
          return Math.max(0.02, w);   // never zero — the only reachable step is still taken
        };
        const wmap = {}; cands.forEach((ni, i) => { wmap[i] = wt(ni); });
        idx = cands[+pick(wmap, rnd)]; line.push(ladder[idx]);
      }
      return line;
    };
    // an ARPEGGIATED walk: a SKIP-based line up through the bar's chord tones — a walking bass mixes steps and skips, so
    //   this is the natural OTHER way to walk a bar the scalar run has already used. [P]
    const buildArp = (cur, pcs) => {
      const line = [cur]; let p = cur;
      for (let k = 1; k < nbeats; k++) { let nx = null; for (let q = p + 1; q <= hi; q++) if (isChordTone(q, pcs)) { nx = q; break; }
        if (nx == null) for (let q = p - 1; q >= lo; q--) if (isChordTone(q, pcs)) { nx = q; break; }
        p = nx != null ? nx : p; line.push(p); }
      return line;
    };
    const barLine = {}, recent = [];
    for (const bStr in barLow) {
      const b = +bStr, cur = barLow[b], nxt = (b + 1) in barLow ? barLow[b + 1] : cur;
      let line = buildWalk(cur, nxt, b * barU);
      // a walking bass DEVELOPS — it never restates a recent bar verbatim. If this bar's walk would byte-duplicate a
      //   recent bar, vary the PATH: a fresh weighted walk toward the same goal (the counter-line reasoning is stochastic,
      //   so it differs), else arpeggiate the chord (a skip-based walk) — a composer walks a prolonged harmony differently
      //   each time. [P]
      if (recent.includes(line.join(','))) {
        const alt = buildWalk(cur, nxt, b * barU);
        if (!recent.includes(alt.join(','))) line = alt;
        else { const arp = buildArp(cur, barPcs[b]); if (!recent.includes(arp.join(','))) line = arp; }
      }
      barLine[b] = line; recent.push(line.join(',')); if (recent.length > 3) recent.shift();
    }
    const wb = [];
    for (const a of skel) {
      const b = barOf(a.t), inBar = ((a.t % barU) + barU) % barU, beatIdx = Math.min(nbeats - 1, Math.round(inBar / beatLen));
      let note = (barLine[b] && barLine[b][beatIdx] != null) ? barLine[b][beatIdx] : (barLow[b] ?? a.m);
      if (beatIdx > 0 && clashesOver(note, a.t, beatLen)) {
        // a walking bass is a melodic LINE, so in minor it inflects ^6/^7 like the tune (melodic minor). Where a natural
        //   passing ^6/^7 cross-relates with the tune's RAISED form (checked across the whole beat, since a fast tune
        //   passes through its raised ^6/^7 mid-beat), RAISE the bass to match — both hands melodic-minor ascending —
        //   unless the chord pins the natural form (a chord tone), in which case sidestep to a consonant neighbour.
        //   [P — hands agree on the inflection, by matching not by dodging.]
        const raised = note + 1;
        if (!isChordTone(note, a.pcs) && raised <= hi && !clashesOver(raised, a.t, beatLen)) note = raised;
        else { const cand = [note - 1, note + 2, note - 2].find(q => q >= lo && q <= hi && scalePcs.includes((((q % 12) + 12) % 12)) && !clashesOver(q, a.t, beatLen)); if (cand != null) note = cand; }
      }
      wb.push({ m: note, d: beatLen });
    }
    if (wb.length && skel.length) wb[wb.length - 1] = { ...wb[wb.length - 1], m: skel[skel.length - 1].m };
    return wb;
  }

  for (let i = 0; i < skel.length; i++) {
    const a = skel[i], next = skel[i + 1];
    const inBar = ((a.t % barU) + barU) % barU;
    const isAnchor = inBar < 1e-9 || (nbeats === 4 && Math.abs(inBar - 2 * beatLen) < 1e-9) || Math.abs(a.t - a.ev.start) < 1e-9;
    const note = arpNote(a, isAnchor);
    if (!(next && shouldWalk(barOf(a.t)))) { out.push({ m: note, d: beatLen }); prevBass = note; continue; }
    const td = a.t + beatLen / 2, up2 = upFrom(note, a.pcs)[0];   // thicken: climb one more chord tone within the beat
    const dec = (up2 != null && up2 !== note && !parallelsMel(note, up2, a.t, td) && !crossRelMel(up2, td)) ? up2 : null;
    if (dec == null) { out.push({ m: note, d: beatLen }); prevBass = note; continue; }
    if (beatLen > 1 + 1e-9) {                                     // COMPOUND: ripple the beat in THREE quavers (ascending chord tones), not a dotted-quaver pair — the beat's own division
      const ups = upFrom(note, a.pcs); const u1 = ups[0] ?? dec, u2 = ups[1] ?? u1;
      out.push({ m: note, d: beatLen / 3 }, { m: u1, d: beatLen / 3 }, { m: u2, d: beatLen / 3 }); prevBass = u2;
    } else { out.push({ m: note, d: beatLen / 2 }, { m: dec, d: beatLen / 2 }); prevBass = dec; }
  }
  if (out.length && skel.length) out[out.length - 1] = { ...out[out.length - 1], m: skel[skel.length - 1].m };   // the final note resolves to the structural close (a passing tone shouldn't end the piece)
  return out;
}


// INNER COUNTER-LINE — animate a held chord: where a 2-note chord is sustained/repeated over one harmony, walk its
// UPPER (inner) voice through the chord's tones as a small moving line rather than a dead repeat, staying UNDER the
// tune. Only the middle voice moves (the bass stays), so the outer-voice coherence is untouched; every tone is a
// chord tone (consonant), so no clash. A composer animates a held chord this way; here only where genuinely held. [P]
export function animateInnerVoice(lh, { plan, tonic, mode, melody, range }) {
  if (!melody) return lh;
  const [lo, hi] = range;
  const chordAt = t => { for (let i = plan.events.length - 1; i >= 0; i--) if (plan.events[i].start <= t + 1e-9) return plan.events[i]; return plan.events[0]; };
  let a = 0; const mtl = []; for (const n of melody) { mtl.push({ t: a, m: n.rest ? null : (Array.isArray(n.m) ? Math.min(...n.m) : n.m) }); a += n.d; }
  const melBot = t => { let r = null; for (const n of mtl) { if (n.t <= t + 1e-9) r = n.m; else break; } return r; };
  let t = 0; const tl = lh.map(n => { const tt = t; t += n.d; return { n, t: tt }; });
  for (let i = 0; i < tl.length; i++) {
    if (!(Array.isArray(tl[i].n.m) && tl[i].n.m.length === 2)) continue;
    const ev = chordAt(tl[i].t);
    let j = i; while (j + 1 < tl.length && Array.isArray(tl[j + 1].n.m) && tl[j + 1].n.m.length === 2 && chordAt(tl[j + 1].t) === ev) j++;
    if (j - i < 2) { i = j; continue; }                                  // need a genuinely held chord (>=3 beats) to animate
    const pcs = chordPCs(tonic, mode, ev);
    let prevUp = Math.max(...tl[i].n.m);                                 // keep the first as-is (start on its chord tone)
    for (let k = i + 1; k <= j; k++) {
      const bass = Math.min(...tl[k].n.m), mel = melBot(tl[k].t), ceil = mel != null ? mel - 1 : hi;
      let best = null, bd = 1e9;                                         // nearest DIFFERENT chord tone above the bass, under the tune (the inner voice moves, not repeats)
      for (let p = bass + 2; p <= Math.min(ceil, hi); p++) { if (!isChordTone(p, pcs) || p === prevUp) continue; const d = Math.abs(p - prevUp); if (d <= 5 && d < bd) { bd = d; best = p; } }
      if (best != null) { tl[k].n.m = [bass, best].sort((x, y) => x - y); prevUp = best; }
    }
    i = j;
  }
  return lh;
}

// RESPOND TO THE MELODY'S BREATHS [P — the accompaniment is a PARTNER to the melody's phrasing; how a composer writes]. At
// each phrase-breath (an RH rest of >= a beat, at a phrase end, never the closing one) the accompaniment makes ONE reasoned
// choice, leaning by the character's ESSENCE:
//   CONTINUE — the groove carries across the seam (a march's tread, a driving dance: the pulse IS the point; the breath
//              floats over the ongoing motion). [do nothing]
//   YIELD    — the accompaniment breathes WITH the melody: its motion settles onto a HELD bass (the harmony rings, a legato
//              repose) or LIFTS to a rest (a detached tread), so both hands share the breath (a still cantabile/adagio — a
//              relentless bass under a breathing song is mechanical). [the surfaced cantabile defect]
//   ANSWER   — the accompaniment fills the breath with the just-heard motif's contour in the LH's TENOR register (a clear
//              voice above the bass, in the vacated space — distinct BY CONSTRUCTION so it isn't swallowed) — a conversation.
// disposition = {continue, yield, answer} weights (a lean; every option reachable), derived from real character traits. Only
// where the accompaniment aligns cleanly to the breath; answer needs an octave of register room, else it yields instead.
export function respondToBreaths(lh, { plan, tonic, mode, melody, range, beatLen = 1, disposition = {}, legato = false, rnd = Math.random }) {
  if (!melody) return lh;
  const [lo, hi] = range;
  const wC = Math.max(0, disposition.continue || 0), wY = Math.max(0, disposition.yield || 0), wA = Math.max(0, disposition.answer || 0);
  const wsum = wC + wY + wA; if (wsum <= 0) return lh;
  const chordAt = t => { for (let i = plan.events.length - 1; i >= 0; i--) if (plan.events[i].start <= t + 1e-9) return plan.events[i]; return plan.events[0]; };
  const mt = []; { let a = 0; for (const n of melody) { mt.push({ n, t: a, end: a + n.d }); a += n.d; } }
  const total = mt.length ? mt[mt.length - 1].end : 0;
  const roomToAnswer = hi - lo >= 12;
  const windows = [];
  for (let k = 1; k < mt.length; k++) {
    const r = mt[k]; if (!r.n.rest || r.n.d < beatLen - 1e-9) continue;                 // a real breath (>= a beat)
    if (r.end > total - beatLen + 1e-9) continue;                                       // never the closing breath
    // the breath's ROLE drives the response; the character is the lean [P — situational weights, not the same roll every
    //   time]. A breath approaching the close (late) YIELDS — the accompaniment settles so the ending can breathe, it never
    //   chatters an answer into the cadence. A breath at the phrase seam mid-piece is a CALL — the accompaniment ANSWERS it
    //   (the conversation). Early / other breaths keep the character's own disposition. The multipliers are leans; every
    //   option stays reachable through the character weights.
    const f = total > 0 ? r.t / total : 0;
    let aC = wC, aY = wY, aA = wA;
    if (f > 0.68) { aY *= 3; aA *= 0.3; }                                               // late: settle into the close
    else if (f >= 0.4 && f <= 0.62) { aA *= 2.5; aC *= 0.6; }                           // the mid seam: a call to answer
    const asum = aC + aY + aA; if (asum <= 0) continue;
    let choice; { let x = rnd() * asum; choice = x < aC ? 'continue' : x < aC + aY ? 'yield' : 'answer'; }
    if (choice === 'continue') continue;                                               // the groove carries — leave the LH as it is
    if (choice === 'answer' && (!roomToAnswer || r.n.d / 2 < 0.25 - 1e-9)) choice = 'yield';   // no register room / too short to answer → breathe instead
    const pcs = chordPCs(tonic, mode, chordAt(r.t)), cts = []; for (let p = lo; p <= hi; p++) if (isChordTone(p, pcs)) cts.push(p);
    if (!cts.length) continue;
    let notes;
    if (choice === 'yield') {
      notes = legato ? [{ m: cts[0], d: r.n.d }]                                        // legato: settle onto a held bass — the harmony rings through the breath
                     : [{ rest: true, d: r.n.d }];                                      // detached: lift — a clean shared breath
    } else {                                                                            // ANSWER — the motif-echo in the tenor
      let a1 = null, a2 = null; for (let j = k - 1; j >= 0; j--) { const m = mt[j].n; if (m.rest || Array.isArray(m.m)) continue; if (a1 == null) a1 = m.m; else { a2 = m.m; break; } }
      if (a1 == null) continue; const iv = a2 != null ? a1 - a2 : 2;
      const tenorFloor = hi - Math.max(5, Math.round((hi - lo) * 0.3));                 // the top ~fifth of the LH reach = a clear tenor voice above the bass
      const tcts = cts.filter(p => p >= tenorFloor); if (tcts.length < 1) continue;
      const start = tcts.reduce((b, p) => Math.abs(p - hi) < Math.abs(b - hi) ? p : b, tcts[0]);
      const dir = Math.sign(iv) || 1; let nxt = null, bd = 1e9;
      for (const p of tcts) { if (p === start || Math.sign(p - start) !== dir) continue; const d = Math.abs(Math.abs(p - start) - Math.abs(iv)); if (d < bd) { bd = d; nxt = p; } }
      if (nxt == null) for (const p of tcts) { if (p === start) continue; const d = Math.abs(p - start); if (d < bd) { bd = d; nxt = p; } }
      if (nxt == null) continue;
      notes = [{ m: start, d: r.n.d / 2 }, { m: nxt, d: r.n.d / 2 }];
    }
    windows.push({ t: r.t, end: r.end, notes });
  }
  if (!windows.length) return lh;
  const out = []; let t = 0; const done = new Set();
  for (const n of lh) {
    const nt = t, ne = t + n.d; t = ne;
    if (windows.some(w => (nt < w.t - 1e-9 && ne > w.t + 1e-9) || (nt < w.end - 1e-9 && ne > w.end + 1e-9))) { out.push(n); continue; }   // a bass note spans the breath boundary → leave it whole, skip this window
    const w = windows.find(w => nt >= w.t - 1e-9 && ne <= w.end + 1e-9);
    if (w) { if (!done.has(w.t)) { out.push(...w.notes); done.add(w.t); } continue; }   // the window becomes the response (continue never reaches here)
    out.push(n);
  }
  return out;
}

// REHARMONISE A STILL LINE — ported from the old machine's leadership rule [Matthew]: when the melody HOLDS a note over a
// prolonged harmony, a composer moves the harmony BENEATH it — the held note becomes a common tone of a CHANGING
// progression (the reharmonised pedal/sustain), and the interest comes from the harmony travelling under a still line.
// Runs AFTER the melody exists, BEFORE the bass is realised, so the bass voice-leads through the MOVED harmony. Situational
// [P]: fires only where a harmony is prolonged AND the tune is static over it; a genuine repose still holds (the first bar
// keeps the original chord). The replacement MUST contain the held note (common tone → clean by construction) and prefers a
// QUALITY shift (maj↔min) to re-light the feeling — a same-quality swap barely changes it. [ported from generator.mjs]
export function reharmoniseStaticSpans(plan, melody, { tonic, mode, barU, beatLen = 1, minHold = 1.6 }) {
  if (!melody || !plan.events.length) return plan;
  const diat = DIATONIC[mode], scalePcs = scalePCsOf(mode, tonic);
  const degOfPc = pc => scalePcs.indexOf(((pc % 12) + 12) % 12);
  let a = 0; const mtl = []; for (const n of melody) { mtl.push({ t0: a, t1: a + n.d, m: n.rest ? null : (Array.isArray(n.m) ? n.m[0] : n.m) }); a += n.d; }
  const melPcsIn = (s, en) => { const c = {}; for (const n of mtl) { if (n.m == null) continue; const s2 = Math.max(n.t0, s), e2 = Math.min(n.t1, en); if (e2 <= s2 + 1e-9) continue; const pc = ((n.m % 12) + 12) % 12; c[pc] = (c[pc] || 0) + (e2 - s2); } return c; };
  const out = [], lastIdx = plan.events.length - 1;
  for (let ei = 0; ei < plan.events.length; ei++) {
    const e = plan.events[ei];
    const span = e.dur, nbarsSpan = Math.round(span / barU), startBar = Math.round(e.start / barU);
    // never touch the CLOSING harmony — the final tonic is the resolution, a structural pillar, not a pedal to recolour.
    if (ei === lastIdx || span < minHold * barU || nbarsSpan < 2 || e.bassDeg != null || e.is64) { out.push(e); continue; }
    const cnt = melPcsIn(e.start, e.start + span), pcs = Object.keys(cnt).map(Number);
    if (pcs.length === 0 || pcs.length > 2) { out.push(e); continue; }                        // the tune must be STATIC over it
    const heldPc = pcs.sort((x, y) => cnt[y] - cnt[x])[0], heldDeg = degOfPc(heldPc);
    if (heldDeg < 0) { out.push(e); continue; }
    const roots = [heldDeg, (heldDeg - 2 + 7) % 7, (heldDeg - 4 + 7) % 7];                     // triads that contain the held degree (its root / 3rd / 5th)
    let prevDeg = ((e.deg % 7) + 7) % 7, prevQ = e.q;
    for (let b = 0; b < nbarsSpan; b++) {
      const segStart = e.start + b * barU, segEnd = segStart + barU;
      if (b === 0) { out.push({ ...e, start: segStart, dur: barU, bars: 1, startBar }); continue; }   // keep the first bar as the real onset
      // the recoloured chord must keep EVERY STRONG melody note in THIS bar consonant — on-beat, ≥1-beat, or sustained in
      //   from before — not just the span's most-held pc; else it strands a strong note as a non-chord tone. Quick off-beat
      //   passing tones may be non-chord. [P — a common-tone recolour keeps the whole line consonant, not one pitch]
      const strongPcs = new Set();
      for (const n of mtl) { if (n.m == null || n.t1 <= segStart + 1e-9 || n.t0 >= segEnd - 1e-9) continue;
        const strong = (n.t0 < segStart - 1e-9) || (Math.abs(n.t0 % beatLen) < 1e-6) || (n.t1 - n.t0 >= beatLen - 1e-9);
        if (strong) strongPcs.add(((n.m % 12) + 12) % 12); }
      let pick = null;
      for (const r of roots) { const d = diat[r], dpcs = chordPCs(tonic, mode, d);
        if (d.deg === prevDeg || d.q === 'dim' || !dpcs.includes(heldPc)) continue;   // must keep the held note as a common tone
        if (![...strongPcs].every(pc => dpcs.includes(pc))) continue;                 // …and every OTHER strong note in the bar, too
        const qShift = d.q !== prevQ ? 1 : 0, rootStep = Math.min((r - prevDeg + 7) % 7, (prevDeg - r + 7) % 7);
        const sc = qShift * 2 - rootStep * 0.3;
        if (!pick || sc > pick.sc) pick = { d, sc, r }; }
      if (!pick) { out.push({ ...e, start: segStart, dur: barU, bars: 1, startBar: startBar + b }); continue; }
      out.push({ ...diat[pick.r], structural: true, start: segStart, dur: barU, bars: 1, startBar: startBar + b });
      prevDeg = pick.d.deg; prevQ = pick.d.q;
    }
  }
  plan.events = out.sort((x, y) => x.start - y.start);
  return plan;
}


// ================= the LEFT HAND as a character-chosen TEXTURE (a figuration of the SAME harmony) =================
// The texture decides HOW the harmony is voiced/animated, never which harmony — every note is a chord tone of the
// event in force, so coherence holds by construction. chordMax gates the voicing (g2 single line; g3/4 up to 2).
// An upper chord tone above the bass, forming a 3rd/6th (NOT a bare 5th/octave — that breeds parallel perfects).
function upperTone(bassM, pcs, hi) {
  for (let p = bassM + 3; p <= Math.min(hi, bassM + 10); p++) { const iv = (((p - bassM) % 12) + 12) % 12; if (isChordTone(p, pcs) && [3, 4, 8, 9].includes(iv)) return p; }
  return null;
}

// ACCOMPANIMENT BREATH — at a phrase end a composer's accompaniment either LIFTS (a rest before the next phrase, the
// hands breathing together) or SUSTAINS through the melody's breath. Which one is the CHARACTER's: a detached tread lifts
// readily; a legato accompaniment holds. So lift the LAST tread-beat of an interior phrase-end bar as a character-driven
// LEAN (never the final bar — the piece resolves sounding), only on a discrete tread beat (a held/sustained chord already
// breathes by ringing). Coherent with the melody, which breathes at the same phrase ends. Adds only a rest — harmony
// untouched. This is what stops the accompaniment being a wall; it does NOT force density-thinning on a steady tread
// (a march is meant to be steady — the shaping lives in the dynamics + articulation). [P — a situational lean]
export function breatheLH(lh, { barU, beatLen = 1, cadBars, nbars, lift = 0.4, melody = null, tonic = 0, mode = 'maj', rnd = Math.random }) {
  // the leading-tone GUARD [P — decide it right here, don't repair it later]. A minor melody's raised ^7 is justified by a
  //   SOUNDING dominant (or by resolving ^7→^1 / self-spelling the dominant). Lifting the tread-beat that IS that dominant
  //   would strand a hollow sharp, so this is the moment NOT to breathe: a beat whose lift would leave a bare, unresolved,
  //   un-self-spelled ^7 sounding over it is kept. (This makes the adapter's after-the-fact naturalise pass unnecessary.)
  const mt = []; if (melody && mode === 'min') { let a = 0; for (const n of melody) { mt.push({ n, t: a, end: a + n.d }); a += n.d; } }
  const tpc = ((tonic % 12) + 12) % 12, rai7 = (tpc + 11) % 12, domNbr = new Set([(tpc + 7) % 12, (tpc + 2) % 12]);
  const mel = mt.filter(x => !x.n.rest && !Array.isArray(x.n.m));
  const strandsLT = (t0, t1) => {                                          // would lifting the LH over [t0,t1) bare a leading tone?
    for (let j = 0; j < mel.length; j++) { const x = mel[j];
      if (!(x.t < t1 - 1e-6 && x.end > t0 + 1e-6)) continue;              // the note sounds during this beat
      if ((((x.n.m % 12) + 12) % 12) !== rai7) continue;                  // it is the raised ^7
      const nx = j < mel.length - 1 ? mel[j + 1].n.m : null, pv = j > 0 ? mel[j - 1].n.m : null;
      if (nx != null && (((nx % 12) + 12) % 12) === tpc && nx > x.n.m && nx - x.n.m <= 2) continue;   // it resolves ^7→^1 — justified
      if ((pv != null && domNbr.has(((pv % 12) + 12) % 12)) || (nx != null && domNbr.has(((nx % 12) + 12) % 12))) continue;   // the line self-spells the dominant
      return true;                                                        // truly dependent on the sounding dominant → don't lift it
    }
    return false;
  };
  let t = 0; const seq = lh.map(n => { const o = { n, t }; t += n.d; return o; });
  for (const x of seq) {
    if (x.n.rest || x.n.m == null) continue;
    const bar = Math.floor(x.t / barU + 1e-9);
    if (bar >= nbars - 1) continue;                                        // never the final bar
    const isCad = cadBars.has(bar), isSub = (bar + 1) % 2 === 0 && bar >= 1;   // a phrase cadence, or a 2-bar sub-phrase end
    if (!isCad && !isSub) continue;
    const endsBar = Math.abs((x.t + x.n.d) - (bar + 1) * barU) < 1e-9, onBeat = Math.abs(x.t % beatLen) < 1e-9;
    if (!(endsBar && onBeat && x.n.d <= beatLen + 1e-9)) continue;          // only a discrete last tread-beat
    if (strandsLT(x.t, x.t + x.n.d)) continue;                             // lifting here would bare a leading tone — keep the dominant sounding
    if (rnd() < (isCad ? lift : lift * 0.5)) { delete x.n.m; x.n.rest = true; }   // lift → a breath before the next phrase
  }
  return lh;
}

// resolve the accompaniment's FINAL note to the structural close. The textures that end on an upper tone (the oom-pah's
// "pah", the alberti's high note) would otherwise close on the third/fifth in the bass; a cadence RESOLVES to the
// structural bass — which the chooser has already decided (root ~90% via the final-arrival lean, a rare inversion the
// situational minority). Situational: the LAST note only; the mid-piece pattern is untouched. The root-vs-inversion
// judgement is not made here — it lives in structuralBassLine, per the moment. [preference, not a wall]
function resolveFinalToClose(out, skel, voice) {
  if (!out.length || !skel.length) return out;
  out[out.length - 1] = { ...out[out.length - 1], m: voice(skel[skel.length - 1]) };
  return out;
}

export function realizeLH({ plan, tonic, mode, barU, beatLen = 1, nbars, range, melody = null, texture = 'broken', chordMax = 1, density = 0.35, drama = null, rnd = Math.random }) {
  if (texture === 'broken' || texture === 'bassline') return composeBass({ plan, tonic, mode, barU, nbars, range, melody, beatLen, density, drama, texture, rnd });
  const { skel, lo, hi, nbeats } = bassSkeleton({ plan, tonic, mode, barU, nbars, range, melody, beatLen, drama });
  const fix = out => fixLHParallels(out, { plan, tonic, mode, lo, hi, melody });
  // 2-note voicing that STATES the harmony: where the bass is an INVERSION (not the root), put the ROOT above, so the
  //   chord is unambiguous ([third, root] = a clear first inversion, not a rootless [third, fifth] that could be three
  //   chords); where the bass IS the root the harmony is already stated, so colour it with a 3rd/6th. Situational — the
  //   choice is reasoned from the bass position at that moment. [preference: state the harmony]
  const rootPcOf = ev => (((scalePitch(tonic, mode, ev.deg)) % 12) + 12) % 12;
  const voice = a => {
    if (chordMax < 2) return a.m;
    const rpc = rootPcOf(a.ev), bpc = (((a.m % 12) + 12) % 12);
    if (bpc !== rpc) { for (let p = a.m + 1; p <= hi; p++) if ((((p % 12) + 12) % 12) === rpc) return [a.m, p]; }   // inversion → state the root above
    const u = upperTone(a.m, a.pcs, hi); if (u != null) return [a.m, u];                                          // root position → colour with an upper chord tone
    const fpc = (rpc + 7) % 12;                                                                                   // a.m sits high, no room above → voice a chord tone BELOW so the harmony is still a CHORD (not a bare note) —
    for (let p = a.m - 1; p >= lo; p--) if (isChordTone(p, a.pcs) && (((p % 12) + 12) % 12) !== fpc) return [p, a.m];  //   but NEVER the fifth below the root: that states a non-idiomatic 6/4. Prefer the root (octave) or third below.
    return a.m;                                                                                                   // only the fifth fits below (rare) → a single root note, better than a stated 6/4
  };
  const out = [];
  if (texture === 'sustained') {
    // hold the chord across each event, re-struck at each bar so it re-sounds; a calm, singing accompaniment.
    let i = 0;
    while (i < skel.length) {
      const a = skel[i]; let j = i + 1; while (j < skel.length && skel[j].ev === a.ev && Math.floor(skel[j].t / barU) === Math.floor(a.t / barU)) j++;
      out.push({ m: voice(a), d: (skel[j] ? skel[j].t : nbars * barU) - a.t }); i = j;
    }
    return fix(out);
  }
  if (texture === 'block') {
    if (chordMax >= 2) { for (const a of skel) out.push({ m: voice(a), d: beatLen }); return fix(out); }   // TWO voices: a real chord struck on every beat
    // ONE voice (grade 2): a firm march tread FIGURES the harmony. On a metric strong beat — and when a new chord arrives —
    //   the bass sounds the FOUNDATION (the skeleton already set it there: the root, or the third if the box denies the
    //   root). Between, on the off-beats, it OUTLINES the chord UPWARD (the next chord tone above), so the tread moves and
    //   states the triad — a boom-chick / arpeggiated march bass. The fifth appears only here, as an arpeggio tone in the
    //   moving figure, never as a stated foundation; and because the off-beat always steps UP, the line never repeats a
    //   pitch. This is the texture's real work — voicing the structural bass as a march — not a 6/4 or drone guard.
    //   [composer: state the foundation on the beat, outline the chord between]
    let prev = -1, prevDeg = null;
    for (const a of skel) {
      const pos = (((a.t % barU) + barU) % barU);
      const harmonyChange = a.ev.deg !== prevDeg; prevDeg = a.ev.deg;
      const strong = pos < 1e-9 || (nbeats === 4 && Math.abs(pos - 2 * beatLen) < 1e-9) || harmonyChange;
      let pitch;
      if (strong) pitch = a.m;                                                     // the foundation the skeleton placed (root / third)
      else { let step = null; for (let p = prev + 1; p <= hi; p++) if (isChordTone(p, a.pcs)) { step = p; break; }   // outline the chord UPWARD (the boom-chick lifts)
             if (step == null) for (let p = prev - 1; p >= lo; p--) if (isChordTone(p, a.pcs)) { step = p; break; }   // no room above (the foundation sits high in the hand) → outline DOWNWARD instead
             pitch = step != null ? step : a.m; }                                  // only one chord tone fits the hand (rare) → the foundation holds
      out.push({ m: pitch, d: beatLen }); prev = pitch;
    }
    return fix(resolveFinalToClose(out, skel, voice));
  }
  if (texture === 'rootfifth') {   // OOM-PAH: the LOW bass alone on the metric downbeat ("oom"), the CHORD lifted ABOVE it
    //   on the off-beats ("pah"). The oom falls on beat 1 (and the mid-bar downbeat in 4/4); every other beat is a pah.
    //   The pah is chord tones ABOVE the bass (not the bass re-sounded), so oom and pah contrast in register — a real
    //   waltz (3/4: bass-chord-chord) / duple tread (4/4: bass-chord-bass-chord). Derived from the metre, not a.st (which
    //   wrongly marks beat 2 of a 3/4 bar "strong" and produced bass-bass-chord — no oom-pah). [reasoned idiom]
    // register: a real oom-pah is a low bass with the chord ABOVE it. The oom is the LOWEST chord tone in the hand's range
    //   (the most room for the pah); the pah is the chord voiced above it. Where the grade's span cannot seat a genuine pah
    //   above the bass, a composer does NOT compress it or re-sound the bass — they leave the beat: the "pah" is silent, the
    //   oom rings alone. So an unfittable pah becomes a REST, never a squeezed chord or a bass-repeat. [reasoned idiom]
    // the OOM states the harmony's FOUNDATION — the ROOT, else the THIRD (first inversion), never the fifth while a root or
    //   third is under the hand (that sounds an accidental 6/4). [composer: the oom is the root]
    const pcOf = p => (((p % 12) + 12) % 12);
    const chordToneLowest = (pcs, ev) => {
      if (ev) { const rpc = rootPcOf(ev), thpc = (rpc + (ev.q === 'min' || ev.q === 'dim' ? 3 : 4)) % 12;
        for (let p = lo; p <= hi; p++) if (pcOf(p) === rpc) return p;
        for (let p = lo; p <= hi; p++) if (pcOf(p) === thpc) return p; }
      for (let p = lo; p <= hi; p++) if (isChordTone(p, pcs)) return p; return null;
    };
    const pahAbove = (oomPitch, pcs, preferPc = -1) => { const ts = []; for (let p = oomPitch + 2; p <= hi && ts.length < (chordMax >= 2 ? 2 : 1); p++) if (isChordTone(p, pcs)) ts.push(p);
      if (ts.length && chordMax < 2 && preferPc >= 0 && pcOf(ts[0]) !== preferPc)     // a SINGLE pah states the chord's quality — its THIRD — not a hollow fifth
        for (let p = oomPitch + 2; p <= hi; p++) if (pcOf(p) === preferPc) { ts[0] = p; break; }
      return ts.length ? (ts.length === 1 ? ts[0] : ts) : null; };   // a genuine pah, or null = it does not fit the hand
    // place the OOM so a PAH can sound ABOVE it AND the bar STATES THE THIRD (the chord's quality). Prefer the root; but a
    //   root oom whose only reachable pah is the fifth leaves a hollow bar, so prefer a root placement that sounds the third,
    //   else FIRST INVERSION (the third in the bass) — idiomatic, states the quality — before accepting a bare-fifth root or
    //   a lone high root. Root-stating-third > first inversion > root-with-room > any-with-room. [composer: the third carries the chord]
    const oomPlace = (pcs, ev) => {
      const roomAbove = p => pahAbove(p, pcs) != null;
      const byPc = pc => { const a = []; for (let p = lo; p <= hi; p++) if (pcOf(p) === pc) a.push(p); return a; };
      if (ev) { const rpc = rootPcOf(ev), thpc = (rpc + (ev.q === 'min' || ev.q === 'dim' ? 3 : 4)) % 12;
        const soundsThird = p => { if (pcOf(p) === thpc) return true; const pa = pahAbove(p, pcs, thpc); if (pa == null) return false; return (Array.isArray(pa) ? pa : [pa]).some(x => pcOf(x) === thpc); };
        const r3 = byPc(rpc).find(p => roomAbove(p) && soundsThird(p)); if (r3 != null) return r3;   // root position that states the third
        const th = byPc(thpc).find(roomAbove); if (th != null) return th;             // else first inversion (the third under the chord)
        const r = byPc(rpc).find(roomAbove); if (r != null) return r; }               // else the root, even if the pah is only the fifth (hollow, but rooted)
      for (let p = lo; p <= hi; p++) if (isChordTone(p, pcs) && roomAbove(p)) return p; // else the lowest chord tone that leaves room
      return chordToneLowest(pcs, ev) ?? lo;                                           // genuinely no room (tiny range) → the old lowest-foundation, octave/repeat fallback handles the pah
    };
    let oomBass = oomPlace(chordPCs(tonic, mode, skel[0] ? skel[0].ev : plan.events[0]), skel[0] ? skel[0].ev : plan.events[0]) ?? (skel[0] ? skel[0].m : lo);
    for (const a of skel) {
      const pos = (((a.t % barU) + barU) % barU);
      // an OOM sounds the bass on the metric downbeat AND at every HARMONY CHANGE — a composer states the new chord's
      //   foundation when it arrives, even mid-bar; without this, a chord that changes over a "pah" is heard through its
      //   upper tones alone (a rootless / apparent-6/4 moment until the next downbeat). [reasoned idiom]
      const oom = pos < 1e-9 || (nbeats === 4 && Math.abs(pos - 2 * beatLen) < 1e-9) || Math.abs(a.t - a.ev.start) < 1e-9;
      if (oom) { oomBass = oomPlace(a.pcs, a.ev) ?? a.m; out.push({ m: oomBass, d: beatLen }); }
      else { let p = pahAbove(oomBass, a.pcs, (rootPcOf(a.ev) + (a.ev.q === 'min' || a.ev.q === 'dim' ? 3 : 4)) % 12);   // a single pah states the THIRD (the chord's quality)
        // the accompaniment ALWAYS voices the beat: a composer never falls silent because a chord will not fit the hand.
        //   When the fuller pah does not sit above the bass, restate the foundation (its octave above where that fits — a
        //   higher "chick" — else the bass note itself). A rest here would be a voicing accident; a MUSICAL rest is the
        //   phrase breathing, added later in the breath pass, not decided by the hand. [P — always voice, never a hole]
        if (p == null) p = (oomBass + 12 <= hi) ? oomBass + 12 : oomBass;
        out.push({ m: p, d: beatLen }); }
    }
    return fix(resolveFinalToClose(out, skel, voice));
  }
  if (texture === 'alberti') {                                      // ALBERTI: a low–high–mid–high broken-chord MURMUR in eighths (single notes)
    // anchor the figure on the foundation the PLAN chose — the skeleton's voice-led bass note (root by default, a chosen
    //   inversion / the third otherwise), taken at its LOWEST octave so the murmur has room to build above it (which is why
    //   the skeleton note itself, possibly high, is not used directly). So the murmur states the plan's foundation, not the
    //   lowest chord tone blind (which could be the fifth — a rootless 6/4 murmur). Where the pitch-class isn't reachable low,
    //   the lowest chord tone stands. [P — realise the plan]
    const chordLo = pcs => { for (let p = lo; p <= hi; p++) if (isChordTone(p, pcs)) return p; return null; };
    const planLow = a => { const apc = (((a.m % 12) + 12) % 12); for (let p = lo; p <= hi; p++) if ((((p % 12) + 12) % 12) === apc && isChordTone(p, a.pcs)) return p; return null; };
    const compound = beatLen > 1 + 1e-9;                             // a dotted-crotchet beat divides into THREE quavers, not two
    const per = compound ? beatLen / 3 : beatLen / 2;               // the beat's OWN division: 2 quavers a crotchet beat, 3 a compound beat
    for (const a of skel) {
      const base = planLow(a) ?? chordLo(a.pcs) ?? a.m;
      const tones = []; for (let p = base; p <= hi && tones.length < 3; p++) if (isChordTone(p, a.pcs)) tones.push(p);
      const beatIdx = Math.round((((a.t % barU) + barU) % barU) / beatLen);
      if (compound) {                                                // COMPOUND: a three-quaver ripple per beat (the 6/8 broken-chord murmur), low-mid-high
        if (tones.length >= 3) out.push({ m: tones[0], d: per }, { m: tones[1], d: per }, { m: tones[2], d: per });
        else if (tones.length === 2) out.push({ m: tones[0], d: per }, { m: tones[1], d: per }, { m: tones[0], d: per });   // only two tones: low-high-low ripple
        else out.push({ m: base, d: beatLen });                      // one chord tone fits (rare): a held beat, not a fake murmur
      } else if (tones.length >= 3) {                                // classic Alberti: the low note alternates root / third under a steady top (root-top-third-top across a beat pair = C-G-E-G)
        out.push({ m: beatIdx % 2 === 0 ? tones[0] : tones[1], d: per }, { m: tones[2], d: per });
      } else if (tones.length === 2) {                               // a narrow chord only gives two tones — still a low-high murmur, never a drone
        out.push({ m: tones[0], d: per }, { m: tones[1], d: per });
      } else out.push({ m: base, d: beatLen });                      // genuinely only one chord tone fits the range (rare) — a single note, not a fake murmur
    }
    return fix(resolveFinalToClose(out, skel, voice));
  }
  return composeBass({ plan, tonic, mode, barU, nbars, range, melody, beatLen, density, rnd });
}

// JOINT OUTER-VOICE resolution — the reasoned way a composer breaks consecutive fifths/octaves: invert the bass to
// FIRST INVERSION (the third), which dodges both the parallel and a 6/4. Walks the melody-top vs bass-bottom at the
// real merged-onset resolution (as the check does), re-voicing only where a parallel is actually written, choosing
// the escape by context (prefer the third, never the fifth, never re-parallel, stay a chord tone → still consonant).
export function resolveOuterParallels(rh, lh, { plan, tonic, mode, range, barU = 0, beatLen = 1 }) {
  const [lo, hi] = range;
  const onDownbeat = t => barU > 0 && Math.abs(((t % barU) + barU) % barU) < 1e-9;   // a re-voice onto the FIFTH is a passing LINE on a weak beat, but a stated 6/4 on a downbeat — never there
  const top = n => n.rest ? null : (Array.isArray(n.m) ? Math.max(...n.m) : n.m);
  const bot = n => n.rest ? null : (Array.isArray(n.m) ? Math.min(...n.m) : n.m);
  const setBot = (n, p) => { if (Array.isArray(n.m)) { const b = Math.min(...n.m), o = n.m.filter(x => x !== b && x !== p); n.m = o.length ? [p, ...o].sort((x, y) => x - y) : p; } else n.m = p; };   // dedup: never a unison chord
  const perfect = iv => { const s = (((iv % 12) + 12) % 12); return s === 7 || s === 0; };
  const chordAtT = t => { for (let i = plan.events.length - 1; i >= 0; i--) if (plan.events[i].start <= t + 1e-9) return plan.events[i]; return plan.events[0]; };
  const tl = seq => { let t = 0, o = []; for (const n of seq) { o.push({ n, t }); t += n.d; } return o; };
  for (let pass = 0; pass < 3; pass++) {
    const RH = tl(rh), LH = tl(lh);
    const soundTop = t => { let c = null; for (const x of RH) { if (x.t <= t + 1e-9) c = x; else break; } return c && !c.n.rest ? top(c.n) : null; };
    const lhCover = t => { let c = null; for (const x of LH) { if (x.t <= t + 1e-9) c = x; else break; } return c; };
    const onsets = [...new Set([...RH, ...LH].map(x => x.t))].sort((a, b) => a - b);
    const lastOnset = onsets[onsets.length - 1];
    let changed = false, p = null;
    for (const t of onsets) {
      if (t === lastOnset) continue;   // never re-voice the FINAL close to break a parallel — the cadence's root-position outweighs a parallel into it
      const a = soundTop(t), lc = lhCover(t), b = lc && !lc.n.rest ? bot(lc.n) : null;
      if (a == null || b == null) { p = null; continue; }
      const s = (((a - b) % 12) + 12) % 12;
      if (p) { const ps = (((p.a - p.b) % 12) + 12) % 12;
        if (a !== p.a && b !== p.b && Math.sign(a - p.a) === Math.sign(b - p.b) && perfect(a - b) && s === ps) {
          const ev = chordAtT(t), pcs = chordPCs(tonic, mode, ev);
          const rootpc = (((scalePitch(tonic, mode, ev.deg)) % 12) + 12) % 12, fifthpc = ev.q === 'dim' ? -1 : (rootpc + 7) % 12;
          let best = null, bd = 1e9;
          for (let q = lo; q <= hi; q++) { const qpc = (((q % 12) + 12) % 12);
            if (!isChordTone(q, pcs) || q === b || qpc === fifthpc) continue;               // never the fifth (a 6/4 is not how a composer breaks a parallel)
            if (perfect(a - q) && Math.sign(q - p.b) === Math.sign(a - p.a)) continue;       // don't just re-parallel
            if (q === p.b && lc.n.d <= beatLen + 1e-9) continue;                             // don't resolve a discrete tread beat onto the previous pitch — that breaks the parallel by minting a repeat (a drone)
            const isThird = [3, 4].includes((((qpc - rootpc) % 12) + 12) % 12);
            const cost = Math.abs(q - b) - (isThird ? 4 : 0); if (cost < bd) { bd = cost; best = q; }   // FIRST INVERSION (the third) is the real resolution
          }
          // OBLIQUE fallback — hold the common tone — is genuine oblique motion only where the current note SUSTAINS
          //   (a held chord ringing through the parallel). On a discrete tread beat it re-articulates p.b = a repeated
          //   pitch (a drone, worse than the offbeat parallel). So take it only for a sustained note. [reasoned]
          if (best == null && lc.n.d > beatLen + 1e-9 && p.b !== b && isChordTone(p.b, pcs) && (((p.b % 12) + 12) % 12) !== fifthpc) best = p.b;
          if (best != null) { setBot(lc.n, best); changed = true; p = { a, b: best }; continue; }
        }
      }
      p = { a, b };
    }
    if (!changed) break;
  }
  return lh;
}

// re-voice any LH-BOTTOM note that parallels the tune into a nearby chord tone that breaks it (still a chord tone —
// a preference realisation, applied to whatever the texture actually sounded; catches sustained/alberti parallels).
function fixLHParallels(out, { plan, tonic, mode, lo, hi, melody }) {
  if (!melody) return out;
  let a = 0; const mtl = []; for (const n of melody) { mtl.push({ t: a, m: n.m }); a += n.d; }
  const melAt = t => { let r = null; for (const n of mtl) { if (n.t <= t + 1e-9) r = n.m; else break; } return r; };
  const chordAt = t => { for (let i = plan.events.length - 1; i >= 0; i--) if (plan.events[i].start <= t + 1e-9) return plan.events[i]; return plan.events[0]; };
  const perfect = iv => { const s = (((iv % 12) + 12) % 12); return s === 7 || s === 0; };
  const bott = n => Array.isArray(n.m) ? Math.min(...n.m) : n.m;
  const setBott = (n, p) => { if (Array.isArray(n.m)) { const others = n.m.filter(x => x !== bott(n) && x !== p); n.m = others.length ? [p, ...others].sort((x, y) => x - y) : p; } else n.m = p; };   // dedup: never a unison chord
  let t = 0; const times = out.map(n => { const tt = t; t += n.d; return tt; });
  const beatish = Math.min(...out.map(n => n.d));   // the tread's beat unit (shortest attack)
  for (let i = 1; i < out.length; i++) {
    if (i === out.length - 1) continue;   // never re-voice the FINAL close to break a parallel — the cadence's root-position is the stronger preference
    const b0 = bott(out[i - 1]), b1 = bott(out[i]), m0 = melAt(times[i - 1]), m1 = melAt(times[i]);
    if (m0 == null || m1 == null) continue;
    const bM = b1 - b0, mM = m1 - m0; if (!bM || !mM || Math.sign(bM) !== Math.sign(mM)) continue;
    if (!(perfect(m0 - b0) && perfect(m1 - b1) && (((m1 - b1) % 12 + 12) % 12) === (((m0 - b0) % 12 + 12) % 12))) continue;
    // break the parallel the idiomatic way — FIRST INVERSION (the third), NEVER by dropping onto the fifth (that mints a
    //   non-idiomatic 6/4). Mirrors resolveOuterParallels; parallels are only ever escaped through the third here. [reasoned]
    const ev = chordAt(times[i]), pcs = chordPCs(tonic, mode, ev);
    const rootpc = (((scalePitch(tonic, mode, ev.deg)) % 12) + 12) % 12, fifthpc = ev.q === 'dim' ? -1 : (rootpc + 7) % 12;
    const prevSustains = out[i - 1].d > beatish + 1e-9;   // is the previous attack a genuinely held note (oblique-hold legitimate) or a discrete tread beat (holding = a repeat)?
    let best = null, bd = 1e9;
    for (let p = lo; p <= hi; p++) { const ppc = (((p % 12) + 12) % 12);
      if (!isChordTone(p, pcs) || p === b1 || ppc === fifthpc) continue;                 // never the fifth
      if (perfect(m1 - p) && Math.sign(p - b0) === Math.sign(mM)) continue;               // don't just re-parallel
      if (p === b0 && !prevSustains) continue;                                            // and don't resolve onto the previous pitch on a discrete beat — that breaks the parallel by minting a repeat
      const isThird = [3, 4].includes((((ppc - rootpc) % 12) + 12) % 12);
      const cost = Math.abs(p - b1) - (isThird ? 4 : 0); if (cost < bd) { bd = cost; best = p; }
    }
    // OBLIQUE fallback — hold the common tone — is genuine oblique motion only when the previous note is SUSTAINED
    //   (held through the parallel). On a discrete tread beat it would merely RE-ARTICULATE b0 = a repeated pitch (a
    //   drone), which is worse than the offbeat parallel it breaks (a composer judges parallels between the STRUCTURAL
    //   outer voices, not between the melody and the accompaniment's offbeat inner filler). So take it only where the
    //   previous attack genuinely sustains; otherwise leave the note and accept the milder reading. [reasoned]
    if (best == null && prevSustains && isChordTone(b0, pcs) && b0 !== b1) best = b0;
    if (best != null) setBott(out[i], best);
  }
  return out;
}
