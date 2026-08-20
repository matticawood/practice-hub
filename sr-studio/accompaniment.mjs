// ============================================================================
// ACCOMPANIMENT AS INTENTIONS  —  the other hand adopts an INTENTION for a stretch
// (a pedal, a walking bass, held chords, a broken figure, an off-beat pulse, doubling
// the tune, a countermelody, an echo) and realises it. The note-logic lives INSIDE each
// intention, so what would be a "rule" globally (no repeated notes, stay quieter than the
// tune) is only true for SOME intentions: a pedal wants the repeat, a countermelody wants
// to be the busier hand. Nothing is forbidden outright; the weird just isn't chosen because
// no sensible intention asks for it. Intentions are chosen and SWAPPED for effect/contrast,
// LEANING like a composer (weighted by character, by what the tune's doing, by register),
// which is where the variety and the musicianship come from. (Matthew's model.)
// ============================================================================

import { isConsonant, chordsContaining, scaleOf } from './two-voice.mjs';

// ---- HARMONY THAT MOVES THROUGH THE BAR ----------------------------------------------------------
// The chord is NOT one-per-bar. At each beat the tune sits on some note, and the harmony is the chord
// that best (a) contains that note, (b) continues from the last chord, and (c) leans toward the bar's
// structural chord. So as the tune moves, the chord turns over WITHIN the bar — and the intentions
// then express that moving harmony instead of arpeggiating a single stamped chord. (Matthew's point.)
const FUNC_NEXT = {  // a light lean so the harmony progresses rather than wanders (T->PD->D->T), never a gate
  maj:{0:[3,1,4,5],1:[4,6],2:[3,5],3:[4,1],4:[0,5],5:[3,1,4]},
  min:{0:[3,1,4,5],1:[4],2:[3,5],3:[4,1],4:[0,5],5:[3,1,4]},
};
const FORD = { 0:0, 5:0, 2:0, 3:1, 1:1, 4:2, 6:2 };   // function ORDER: tonic-area 0, pre-dominant 1, dominant 2
const containsDeg = (root, deg) => new Set([((root%7)+7)%7,((root+2)%7+7)%7,((root+4)%7+7)%7]).has(((deg%7)+7)%7);
// returns a per-beat chord-root array for one bar, given the tune-note degree AT each beat and the bar's
// structural root (and the previous beat's root, threaded across bars for continuity).
export function beatHarmony(beatMelDegs, structRoot, prevRoot, mode, cadence = false, opening = false) {
  const roots = [];
  let prev = prevRoot;
  for (let k = 0; k < beatMelDegs.length; k++) {
    const mel = beatMelDegs[k];
    const last = k === beatMelDegs.length - 1;
    // candidate chords: any diatonic triad containing the tune's note here
    let cands = [0,1,2,3,4,5,6].filter(r => mel==null || containsDeg(r, mel));
    if (!cands.length) cands = [structRoot];
    let best = cands[0], bs = -1e9;
    for (const r of cands) {
      let s = 0;
      // LEAN TO MOVE, not to sit: reharmonise the tune's notes into a changing progression (Matthew's C-G-Am-F). But a CADENCE
      // SETTLES - it shouldn't keep churning to new chords (that's the final-bar i-VI-i wobble); so the change-pull nearly
      // vanishes there and the strong structRoot pull below keeps the bar on its cadence chord (a real V->I still passes
      // because the tune's leading tone leaves V the only option on that beat).
      if (prev != null && r !== prev) s += cadence ? 0.25 : 1.2;      // prefer a NEW chord — except at a cadence, which settles
      if (prev != null && (FUNC_NEXT[mode][((prev%7)+7)%7]||[]).includes(r)) s += cadence ? 0 : 1.4;   // ...but a FUNCTIONAL move (goes somewhere) - NOT rewarded at a cadence, where a functional detour (i->VI) is the very wobble to avoid
      if (prev != null) {                                              // lean AGAINST retrogression (D slipping back to PD, PD back to T) so it aims forward
        const pf = FORD[((prev%7)+7)%7], cf = FORD[((r%7)+7)%7];
        if (cf < pf && !(pf === 2 && cf === 0)) s -= 0.9;              // going backward through the function cycle — rare, not banned; D->T resolution exempt
      }
      if (prev != null) { const rm = Math.min(((r-prev)%7+7)%7, ((prev-r)%7+7)%7); s += rm===1?0.6 : rm===2?0.9 : rm===3?0.5 : 0; }  // smooth root motion (a step/3rd), not a lurch
      if (r === structRoot) s += 0.5;                                 // a MILD pull to the bar's structural chord, not a clamp
      if (k === 0) s += (r === structRoot ? 0.8 : 0) + (prev!=null && r===prev ? 0.4 : 0);  // ground the downbeat a little
      if (r === 0) s += 0.2;                                          // faint home lean
      // CADENCE RESOLVES: at a cadence the key is confirmed, so the harmony strongly prefers to LAND on the bar's structural
      // chord (the tonic at the final bar, the dominant at a half-cadence) rather than reharmonise off it — strongest on the
      // last beat, the point of arrival. A strong preference, so it still bends for the tune, but the cadence comes home.
      if (cadence && r === structRoot) s += last ? 3.2 : 1.4;
      if (s > bs) { bs = s; best = r; }
    }
    roots.push(best); prev = best;
  }
  return roots;
}

const TRIAD = r => [((r%7)+7)%7, ((r+2)%7+7)%7, ((r+4)%7+7)%7];
// the chord's tones as absolute degrees inside the hand's box [lo,hi] (all octave placements)
function tonesInBox(root, lo, hi) {
  const pcs = new Set(TRIAD(root)); const out = [];
  for (let d = lo; d <= hi; d++) if (pcs.has(((d%7)+7)%7)) out.push(d);
  if (!out.length) { const r = TRIAD(root)[0]; let d = lo; while (((d%7)+7)%7 !== r && d < hi) d++; out.push(d); }
  return out.sort((a,b)=>a-b);
}
const nearestTo = (arr, x) => arr.reduce((a,b)=>Math.abs(b-x)<Math.abs(a-x)?b:a, arr[0]);
const isChordTone = (deg, root) => new Set(TRIAD(root)).has(((deg%7)+7)%7);
const semisOf = (deg, scale) => scale[((deg%7)+7)%7] + 12*Math.floor(deg/7);   // scale-degree -> semitones (scale = the mode's interval array)

// pick a supporting tone for the tune-note `mel`, from the chord, in the box, near `prev`,
// consonant with the tune. Used by several intentions. Never forbids — falls back to nearest.
function support(mel, root, prev, lo, hi, scale) {
  const tones = tonesInBox(root, lo, hi).filter(d => isConsonant(mel, d, scale));
  const pool = tones.length ? tones : tonesInBox(root, lo, hi);
  return prev == null ? pool[Math.floor(pool.length/2)] : nearestTo(pool, prev);
}

// The HARMONIC SPANS of a bar: consecutive beats sharing a root collapse into ONE sustained span. This is where the
// accompaniment's rhythm comes from — it holds while the harmony holds and moves when the harmony moves. Nothing invents
// rhythm; it emerges from the harmony (beatHarmony) which itself emerged from the tune.
function harmonicSpans(beatRoots, beatLen) {
  const spans = [];
  for (let k = 0; k < beatRoots.length; k++) {
    const r = beatRoots[k], last = spans[spans.length-1];
    if (last && last.root === r) last.dur += beatLen;
    else spans.push({ root: r, off: k*beatLen, dur: beatLen });
  }
  return spans;
}

// ONE note choice for the accompaniment, made ENTIRELY by preference — nothing here forces or forbids a note, every clause is
// a weight, and the most-preferred candidate wins (decided by the music, not a die and not a rule). The same chooser makes
// every accompaniment note; a texture is just a BIAS handed in (arpeggiate / bass-on-the-beat / shadow the tune), which tilts
// the weights so that figure TENDS to emerge — but only where the chord and the line actually favour it. Preferences leaned:
// a chord tone consonant with the tune; a real line (stepwise, keep-going not bounce-back, don't re-strike, don't return to
// the note just left); contrary to the tune; grounded on the root at a bottom-voice downbeat; the richer 3rd/6th with the tune.
// `strong` = a metrically strong beat; `bias` tilts the shape. Returns a degree; falls back to the nearest tone only if the
// pool is somehow empty (never a snap into a mould — the caller hands real chord tones).
function chooseNote(root, ctx, prev, prev2, prevMel, { downbeat = false, strong = false, bias = 'step', melNow, melFloor, melCeil, lastInBar = false, spanMels = null } = {}) {
  // at the structural pillars (opening / cadence) the bottom voice reaches DOWN into the bass for the tonic root - a player
  // drops the left hand to STATE and to RESOLVE the key - so it isn't trapped in a box that only holds the 3rd/5th up near the tune.
  // GRADE CANVAS FIRST: the bass reaches DOWN for a deep root at a cadence/opening - but only WITHIN the grade's hand. A
  // fixed-position (grade-2) hand does NOT leave its five-finger box (reaching an octave down was generating out-of-position
  // material that rejection then threw away - the wall we are removing). A wider grade may drop a little (a third), never the
  // full octave that blew past the grade's span. So the grounding is thought WITHIN the canvas, not corrected against it.
  const loReach = (ctx.fixedPosition) ? ctx.lo
                : ((ctx.cadence || ctx.opening) && ctx.dir < 0) ? ctx.lo - 2 : ctx.lo;
  const chordTones = tonesInBox(root, loReach, ctx.hi);
  const chordSet = new Set(chordTones.map(d => ((d%7)+7)%7));
  if (melNow === undefined) melNow = null;
  // POOL = EVERY tone in the hand's reach, chord tone or not. A composer's inner voice passes THROUGH the scale between the
  // chord tones; nothing is struck from the pool. Whether a non-chord (passing / neighbour) tone, or a momentary clash with
  // the tune, is acceptable is decided BELOW by preference: allowed as a stepwise, off-the-beat connective, and strongly out
  // of preference on a strong beat or when leapt to. So a passing tone surfaces only exactly where a composer would pass one.
  const pool = []; for (let d = loReach; d <= ctx.hi; d++) pool.push(d);
  const melMove = (prevMel == null || melNow == null) ? 0 : melNow - prevMel;
  const lastDir = (prev != null && prev2 != null) ? Math.sign(prev - prev2) : 0;      // the direction the voice was just travelling
  const rootPc = ((root%7)+7)%7, fifthPc = ((root+4)%7+7)%7;
  const mid = (ctx.lo + ctx.hi) / 2;
  let best = null, bs = -Infinity;
  for (const d of pool) {
    let s = 0;
    if (prev != null) {
      const mv = Math.abs(d - prev), thisDir = Math.sign(d - prev);
      if (bias === 'arp') s += mv === 0 ? -2.5 : mv <= 3 ? 0.9 : 0.2;                 // arpeggio: move THROUGH the chord, never re-strike - a passing step now exists as an out, so a repeat is a last resort
      else s += mv === 0 ? 0.2 : mv === 1 ? 1.2 : mv === 2 ? 0.7 : -0.3 * (mv - 2);   // a line: leans stepwise, a repeat is the weakest move
      if (melMove !== 0 && thisDir === -Math.sign(melMove)) s += 0.9;                  // contrary to the tune keeps the voices apart
      if (lastDir !== 0) {                                                             // keep going rather than bounce straight back (C->D->E, not C->D->C)
        if (thisDir === lastDir) s += 0.6;                                            // continue the line
        else if (thisDir === -lastDir) s -= 0.7;                                      // a straight reversal is dull
        if (prev2 != null && d === prev2) s -= 0.6;                                   // returning to the very note just left, most of all
      }
    }
    const pc = ((d%7)+7)%7;
    const isCT = chordSet.has(pc);
    const stepFromPrev = prev != null && Math.abs(d - prev) === 1;
    // PREFER A CHORD TONE; a non-chord (passing / neighbour) tone is allowed only as a stepwise, off-the-beat connective
    // approached by step - a composer passes THROUGH it, never lands ON it at a strong beat. Not banned, just far out of
    // preference except where it genuinely joins two chord tones. So a moving figure can STEP rather than repeat a tone.
    if (!isCT) s -= (strong || downbeat) ? 6.0 : (stepFromPrev ? 1.2 : 4.0);
    // A REAL CHORD WITH THE TUNE (consonance) is strongly preferred; a clash is tolerable only as the same fleeting off-beat
    // passing dissonance, and strongly avoided on a strong beat. A lean, never a filter - a suspension/passing note stays possible.
    if (melNow != null && !isConsonant(melNow, d, ctx.scale)) s -= (strong || downbeat) ? 7.0 : (stepFromPrev ? 1.5 : 5.0);
    // WRITTEN TOGETHER, ACROSS THE HELD SPAN: a bass note is held while the tune keeps moving, so it must fit not only its own
    // onset but the tune's later ON-BEAT notes too - otherwise the tune LEAPS onto a beat-dissonance over the held bass (the
    // leap-clash the per-onset check flags, which a bass judged only at its attack never sees). Since the melody is already
    // written, the bass CAN look ahead: lean against a bass that clashes with any on-beat tune note across its own duration.
    // A strong lean, not a wall - it stays in the pool; the reason it almost never lands there is that a fitting bass outscores it.
    if (spanMels && spanMels.length) { for (const mm of spanMels) { if (mm != null && !isConsonant(mm, d, ctx.scale)) { s -= 5.0; break; } } }
    if (dir_down(ctx) && downbeat) { if (pc === rootPc) s += 1.1; else if (pc === fifthPc) s -= 1.0; }   // bottom voice grounds the bar on the root, not a 6/4
    // CADENCE GROUNDING: at a cadence the bass strongly prefers the chord ROOT — it's the point of arrival, so it comes to
    // rest on the root (the tonic at the final bar) rather than drifting to a 3rd/6th and leaving the key ambiguous.
    if (ctx.cadence && dir_down(ctx)) { if (pc === rootPc) s += (ctx.lastBar ? 3.0 : 1.6); else s -= 0.8; }
    // OPENING GROUNDING (the mirror of the cadence): at the very start the bass strongly prefers the tonic ROOT, so the piece
    // STATES its home chord unambiguously (bass on C in C major, not the 3rd/5th which read as iii/vi). A strong lean, not forced.
    if (ctx.opening && downbeat && dir_down(ctx)) { if (pc === rootPc) s += 3.0; else s -= 0.8; }
    // FINAL-BAR SETTLE: a voice may roam the chord tones on its way home (G-B-G-E, arriving on E), but ONCE it has reached the
    // TONIC ROOT in the last bar, a composer rests there — leaving it again, OR re-striking it, feels restless. So this fires only
    // AFTER arrival (prev is already the tonic root): it then leans to STAY on the tonic (the repeat-into-hold merge SUSTAINS it,
    // rather than re-articulating) and away from the other chord tones. Travel toward the tonic is untouched. A lean, never a rule.
    if (ctx.lastBar && prev != null && ((prev%7)+7)%7 === 0) { if (pc === 0) s += 3.0; else s -= 2.5; }
    // THE PIECE RESOLVES: the very LAST accompaniment note lands the bass on the TONIC ROOT - a final cadence comes home. This is
    // about as near a hard rule as tonal writing has (a perfect cadence resolves to the tonic), so it's a big lean - near-decisive
    // but still a preference, letting the final bar keep its texture (a tonic arpeggio, a tenths line resolving) rather than a forced held chord.
    if (ctx.lastBar && lastInBar && dir_down(ctx)) { if (pc === 0) s += 4.0; else s -= 2.0; }
    if (bias === 'bass') s += (strong ? -1 : 1) * (d - mid) * 0.12;                   // oom-pah feel: lower on the strong beat, higher off it
    if (melNow != null) { const iv = Math.abs(semisOf(melNow, ctx.scale) - semisOf(d, ctx.scale)) % 12; if ([3,4,8,9].includes(iv)) s += 0.5; }   // a 3rd/6th with the tune is richer than a bare 5th/8ve
    // PARALLEL PERFECTS: two outer voices a P5 or P8 apart, moving the SAME direction into another P5/P8, FUSE into one voice -
    // the composer's most-avoided voice-leading. A near-never (Tier A), so score it far down - but it STAYS in the pool, so a
    // genuinely cornered piece could still take it. Not a filter, not rejection: the reason the parallel almost never appears
    // is that everything else outscores it, exactly as in a composer's mind. Matches the fault-check (both perfect, same
    // interval class, both voices actually move, similar motion), so it removes the fault at the SOURCE, not by discard.
    if (prev != null && prevMel != null && melNow != null) {
      const curIv = (((semisOf(melNow, ctx.scale) - semisOf(d, ctx.scale)) % 12) + 12) % 12;
      const prevIv = (((semisOf(prevMel, ctx.scale) - semisOf(prev, ctx.scale)) % 12) + 12) % 12;
      const perf = x => x === 7 || x === 0;                                            // P5 or P8/unison
      const botMove = d - prev, topMove = melNow - prevMel;
      if (perf(curIv) && curIv === prevIv && botMove !== 0 && topMove !== 0 && Math.sign(botMove) === Math.sign(topMove)) s -= 8.0;
    }
    // STAY ON YOUR SIDE of the tune — at this level the hands don't cross. Compare against the tune's extreme over THIS note's
    // whole duration (melFloor/melCeil), not just its onset, so a held note can't end up over a later, lower tune note. A strong
    // lean that GROWS the further it would cross, so crossing survives only when the tune has genuinely dived into the box and
    // nothing lower/higher is playable — a preference, never a wall.
    const floor = melFloor != null ? melFloor : melNow, ceil = melCeil != null ? melCeil : melNow;
    if (dir_down(ctx) && floor != null && d >= floor) s -= 8.0 + 2.0 * (d - floor);   // clearly prefer a note that clears below the tune - a clearing note always exists (an octave of range), so this decides it; the crossing note stays available (in the box), just never preferred
    else if (!dir_down(ctx) && ceil != null && d <= ceil) s -= 8.0 + 2.0 * (ceil - d);
    if (s > bs) { bs = s; best = d; }
  }
  return best != null ? best : (chordTones[0] ?? pool[0]);
}
const dir_down = ctx => ctx.dir < 0;
// the supporting voice for a span (used by held and by figures where their shape isn't afforded): choose one tone by preference.
function voiceTone(root, melNow, prevMel, prev, lo, hi, scale, dir, downbeat, prev2 = null) {
  return chooseNote(root, { lo, hi, scale, dir }, prev, prev2, prevMel, { downbeat, melNow });
}

// ---- REALISERS. Each returns the accompaniment notes for ONE bar: [{deg, dur, ti?} | {rest, dur}].  ctx = per-bar context.
// A FIGURE (broken, oompah, …) is taken up where the chord affords it: it reads REAL chord tones (tonesInBox), and where
// there aren't enough distinct ones to voice the figure honestly, the figure is dropped for that span and the SUPPORTING
// VOICE steps instead (voiceSpan) — a composer's preference for a fitting move over a forced one, not a snapped mould.
// A LINE (held, walk, counter, echo, double) leans AWAY from re-striking a static pitch (voiceTone scores that low), so a
// repeat surfaces only when nothing else is preferable, and reads as a held note. ctx.rootAt(off) = the chord at that offset.

// the SUPPORTING VOICE for a span: a chord tone reached by voice-leading (leaning stepwise, contrary to the tune). Always fits.
function voiceSpan(sp, ctx, prev, prevMel, prev2, lastInBar = false) {
  const melNow = ctx.melLocal(sp.off);
  const r = ctx.melRange(sp.off, sp.dur);                                                          // the tune's extent across the WHOLE held span, so the voice clears a later dip
  const spanMels = [];                                                                             // the tune's ON-BEAT notes across this held span, so the bass fits them all (no leap-clash under a held bass)
  { const bl = ctx.beatLen, start = Math.ceil((sp.off - 1e-9) / bl) * bl;
    for (let o = start; o < sp.off + sp.dur - 1e-9; o += bl) { const md = ctx.melLocal(o); if (md != null) spanMels.push(md); } }
  const t = chooseNote(sp.root, ctx, prev, prev2, prevMel, { downbeat: sp.off === 0, melNow, melFloor: r && r.min, melCeil: r && r.max, lastInBar, spanMels });
  let voices = t;
  if (ctx.chordMax > 1) {
    const box = tonesInBox(sp.root, ctx.lo, ctx.hi);
    // voice the chord in ROOT POSITION on the CHOSEN bass tone t (t at the bottom, chord tones stacked ABOVE it) rather than
    // centred on t - so the note the grounding chose (the tonic root at the opening/cadence) is the actual BASS, and the whole
    // chord stays below the tune (no crossing). Below the tune: keep tones in [t, tuneFloor); above (swap): [tuneCeil, t].
    if (ctx.dir < 0) { const floor = r && r.min != null ? r.min : Infinity; voices = box.filter(d => d >= t && d < floor).slice(0, ctx.chordMax); }
    else             { const ceil  = r && r.max != null ? r.max : -Infinity; voices = box.filter(d => d <= t && d > ceil).slice(-ctx.chordMax); }
    if (!voices.length) voices = [t];
    if (voices.length === 1) voices = voices[0];
  }
  return { note: { deg: voices, dur: sp.dur }, tone: t, melNow };
}
// run a figure across the bar on a rhythmic grid, choosing EVERY note by preference (chooseNote) with the texture's bias.
// The bias tilts toward the figure's shape; where the chord/line don't favour it, a fitting note wins instead — so the
// figure only appears where it belongs, and forced repeats/bounces can't arise from a stamped pattern.
function runFigure(ctx, unit, bias) {
  const out = []; let prev = ctx.prev, prev2 = ctx.prev2, prevMel = ctx.prevMel, off = 0;
  while (off < ctx.barU - 1e-9) {
    const beatPos = off / ctx.beatLen, onBeat = Math.abs(beatPos - Math.round(beatPos)) < 1e-9;
    const strong = onBeat && (Math.round(beatPos) % 2 === 0);
    const melNow = ctx.melLocal(off);
    const dur = Math.min(unit, ctx.barU - off);
    const r = ctx.melRange(off, dur);
    const d = chooseNote(ctx.rootAt(off), ctx, prev, prev2, prevMel, { downbeat: off < 1e-9, strong, bias, melNow, melFloor: r && r.min, melCeil: r && r.max, lastInBar: off + unit >= ctx.barU - 1e-9 });
    const last = out[out.length - 1];
    if (last && last.deg === d) last.dur += dur;                      // nowhere better to go than the note already sounding -> it's held, not re-struck (the figure thins to a sustain here)
    else { out.push({ deg: d, dur }); prev2 = prev; prev = d; }
    prevMel = melNow; off += unit;
  }
  return out;
}

const INTENTIONS = {
  held(ctx) {                                                        // the supporting voice, sustaining each harmonic span (moves iff the harmony moves)
    const out = []; let prev = ctx.prev, prev2 = ctx.prev2, prevMel = ctx.prevMel;
    for (let si = 0; si < ctx.spans.length; si++) { const sp = ctx.spans[si];
      const v = voiceSpan(sp, ctx, prev, prevMel, prev2, si === ctx.spans.length - 1);   // the LAST span ends at the barline - its bass should move into the next downbeat
      out.push(v.note); prev2 = prev; prev = v.tone; prevMel = v.melNow; }
    return out;
  },
  pedal(ctx) {                                                       // a drone — handled as a multi-bar tie in accompany; here just the tone held for the bar
    const tone = nearestTo(tonesInBox(ctx.rootAt(0), ctx.lo, ctx.hi), ctx.prev ?? (ctx.lo+ctx.hi)/2);
    return [{ deg: tone, dur: ctx.barU }];
  },
  broken(ctx)  { return runFigure(ctx, ctx.beatLen / (ctx.subdiv || 1), 'arp'); },    // lean toward moving through the chord tones — an arpeggio emerges where the chord affords one
  oompah(ctx)  { return runFigure(ctx, ctx.beatLen, 'bass'); },                       // lean toward low-on-the-beat, higher off it — an oom-pah feel emerges
  walk(ctx)    { return runFigure(ctx, ctx.beatLen, 'step'); },                       // a plain stepping line
  counter(ctx) { return runFigure(ctx, ctx.beatLen / (ctx.subdiv || 1), 'step'); },   // a freer stepping line at the finer grid
  double(ctx) {                                                      // a 3rd/6th under/over the tune, on the chord active at that moment (moves with the tune)
    if (ctx.cadence) return INTENTIONS.held(ctx);                     // a cadence RESOLVES (through the grounded voice) - it doesn't end shadowing the tune a 3rd below the tonic
    const out = []; let off = 0, prev = null, prevTune = null;
    for (const n of ctx.tune) { const box = tonesInBox(ctx.rootAt(off), ctx.lo, ctx.hi);
      const cands = box.filter(d => ctx.dir<0 ? d<n.deg : d>n.deg);
      const pool = cands.length ? cands : box;                       // stay on a real CHORD tone even if none sits on the ideal side (never a raw non-chord offset)
      let pick = nearestTo(pool, n.deg - 2*ctx.dir);
      // MOVE WITH THE TUNE: where the tune STEPS to a new note, the shadow should move too - two different tune notes mustn't collapse
      // onto the same shadow tone (a dead repeat the tune doesn't have). So if the tune moved but the nearest shadow tone repeats,
      // take the next-nearest instead. Where the tune REPEATS, the shadow faithfully repeats with it (that's real doubling).
      if (prev != null && pick === prev && prevTune != null && n.deg !== prevTune) { const alt = pool.filter(d => d !== prev); if (alt.length) pick = nearestTo(alt, n.deg - 2*ctx.dir); }
      out.push({ deg: pick, dur: n.dur }); prev = pick; prevTune = n.deg; off += n.dur; }
    return out.length ? out : [{ deg: tonesInBox(ctx.rootAt(0), ctx.lo, ctx.hi)[0], dur: ctx.barU }];
  },
  answer(ctx) {                                                      // DIALOGUE: quote the tune's OWN opening motif while it leaves room (imitation)
    // FAITHFUL or SKIP: keep the motif's exact scale-step contour + rhythm, transposed to start on a chord tone where the WHOLE
    // shape fits the box AND clears the tune; if it can't be quoted intact here, don't answer (fall back to the supporting voice).
    // A composer restates the idea whole or not at all - never squashed. Chosen by preference (aimWeights, scaled by room).
    const motif = ctx.motif;
    if (!motif || motif.length < 2) return INTENTIONS.held(ctx);
    const offs = motif.map(n => n.deg - motif[0].deg);                // the motif's contour, as scale-degree offsets
    const mn = Math.min(...offs), mx = Math.max(...offs);
    const root = ctx.rootAt(0);
    let tuneLo = Infinity, tuneHi = -Infinity;                        // the tune's extent THIS bar, so the answer clears it (a rested bar has little/none)
    for (const n of (ctx.tune || [])) { if (n.deg < tuneLo) tuneLo = n.deg; if (n.deg > tuneHi) tuneHi = n.deg; }
    const fits = s => s + mn >= ctx.lo && s + mx <= ctx.hi
               && (ctx.dir < 0 ? (tuneLo === Infinity || s + mx < tuneLo) : (tuneHi === -Infinity || s + mn > tuneHi));
    let starts = tonesInBox(root, ctx.lo, ctx.hi).filter(fits);       // open the answer on a CHORD tone where the whole motif fits + clears
    if (!starts.length) { starts = []; for (let s = ctx.lo; s <= ctx.hi; s++) if (fits(s)) starts.push(s); }
    if (!starts.length) return INTENTIONS.held(ctx);                  // the motif can't be quoted intact here -> skip, don't squash it
    const anchor = ctx.prev != null ? ctx.prev : (ctx.lo + ctx.hi) / 2;
    const start = starts.reduce((a,b)=> Math.abs(b-anchor) < Math.abs(a-anchor) ? b : a, starts[0]);
    const notes = offs.map((o,i) => ({ deg: start + o, dur: motif[i].dur }));
    let sum = notes.reduce((a,n)=>a+n.dur,0);                         // fit the motif's rhythm to the bar (trim overflow, hold the last to the barline)
    while (notes.length > 1 && sum > ctx.barU + 1e-9) { sum -= notes[notes.length-1].dur; notes.pop(); }
    if (notes.length && sum < ctx.barU - 1e-9) notes[notes.length-1].dur += ctx.barU - sum;
    return notes;
  },
  echo(ctx) {                                                        // a line at the tune's own rhythm (answers it), chosen by preference
    const notes = ctx.tune.length ? ctx.tune : [{ dur: ctx.barU }];
    const out = []; let prev = ctx.prev, prev2 = ctx.prev2, prevMel = ctx.prevMel, off = 0;
    for (let ni = 0; ni < notes.length; ni++) {
      const nn = notes[ni];
      const melNow = ctx.melLocal(off);
      const r = ctx.melRange(off, nn.dur);
      const d = chooseNote(ctx.rootAt(off), ctx, prev, prev2, prevMel, { downbeat: off < 1e-9, melNow, melFloor: r && r.min, melCeil: r && r.max, lastInBar: ni === notes.length - 1 });
      const last = out[out.length - 1];
      if (last && last.deg === d) last.dur += nn.dur;
      else { out.push({ deg: d, dur: nn.dur }); prev2 = prev; prev = d; }
      prevMel = melNow; off += nn.dur;
    }
    return out;
  },
  tenth(ctx) {                                                       // DOUBLE the tune a diatonic 10th below (a 3rd + an octave): a two-part parallel-tenths texture
    // Consonant by nature (parallel 3rds an octave down, never parallel perfects). The BASS voice only (dir < 0), and only where
    // the WHOLE doubled line fits the hand - otherwise the hand can't reach it here, so fall back to the supporting voice.
    // The tenths line is the TUNE a 10th below - it lives in its OWN register (a 10th under the tune), NOT the supporting-voice box,
    // so it is NOT clamped to [lo,hi] (that box sits just under the tune; a 10th below falls beneath it). Only offered where it will
    // survive to the page: the WIDER grades (a five-finger grade folds every note back into its box, which would collapse the tenths),
    // gated in phraseWeights by canTenth. A 10th below a bounded tune is playable by construction and clears the tune (no crossing).
    if (ctx.dir > 0 || !(ctx.tune && ctx.tune.length)) return INTENTIONS.held(ctx);
    const notes = ctx.tune.map(n => ({ deg: n.deg - 9, dur: n.dur }));   // -9 scale-degrees = a diatonic 10th below
    // at the FINAL cadence the tenths BREAK onto the tonic root (a 10th below the tonic is the submediant, off-key) - real
    // tenths-writing breaks the parallel at the close so the bass resolves to the tonic nearest the line.
    if (ctx.lastBar) { let d = notes[notes.length-1].deg; while (((d%7)+7)%7 !== 0) d++; notes[notes.length-1].deg = d; }
    return notes;
  },
};

// realise a bar under an intention, tracking the previous note for voice-leading.
export function realiseBar(name, ctx) {
  const fn = INTENTIONS[name] || INTENTIONS.held;
  return fn(ctx);
}

export const INTENTION_NAMES = Object.keys(INTENTIONS);

// Each intention's inherent nature: how ACTIVE/prominent it is (how much it pulls the ear) and how much
// harmonic MOVEMENT it makes. The choosing doesn't read hard weight tables — it scores each candidate
// against a composer's AIMS in the moment, and the behaviour (subordinate swap, moving harmony, contrast)
// EMERGES. Nothing is forced or forbidden.
const NATURE = {
  //          activity: how much it pulls the ear   movement: how much harmony it makes   relates: how much it takes up the TUNE's own material
  //          needsChord: how much the intention DEPENDS on being able to sound a real chord (>=2 voices) to be itself — a
  held:   { activity: 0.10, movement: 0.25, relates: 0.00 },   // sustain the supporting voice through each harmonic span
  pedal:  { activity: 0.15, movement: 0.35, relates: 0.00 },   // a drone across bars
  walk:   { activity: 0.60, movement: 0.90, relates: 0.00 },   // the voice steps through the changing chords
  broken: { activity: 0.70, movement: 0.60, relates: 0.00 },   // the voice's chord spread as an arpeggio
  oompah: { activity: 0.50, movement: 0.60, relates: 0.00 },   // the voice as a bass-then-chord pulse
  double: { activity: 0.90, movement: 0.45, relates: 0.55 },   // shadows the tune a 3rd/6th away
  counter: { activity: 0.85, movement: 0.95, relates: 0.20 },  // the voice moving more freely against the tune
  echo:    { activity: 0.75, movement: 0.55, relates: 0.90 },  // the voice taking up the tune's shape
  answer:  { activity: 0.90, movement: 0.60, relates: 1.00 },  // RESTATE the tune's own opening motif as a dialogue, where the tune leaves room (imitation)
  tenth:   { activity: 0.90, movement: 0.45, relates: 1.00 },  // DOUBLE the tune a diatonic 10th below - a true two-part parallel-tenths texture (where the hand can reach it)
};
// Score each DRESS against the aims and return leaning weights. These choose only HOW the supporting voice is articulated
// (held / arpeggiated / pulsed / walking …) — NOT whether it moves; the voice already moves with the harmony. So this is
// pure taste: interest (movement + a CHANGING dress + relating the hands), settling at cadences, fitting the character.
// Nothing is position-suppressed: the accompaniment doesn't compete because it's a SUPPORTING VOICE (see voiceTone), above
// or below, not because any dress was removed here.
// Score each prevailing DRESS for a whole PHRASE (a musical unit), not a bar. A composer sets an approach and holds it across the
// phrase - the harmony moving under it - changing dress at the NEXT phrase or for a reason, not every bar. Pure taste: interest
// (movement + relating the hands), a colour that CONTRASTS the previous phrase, fitting the character. `answer` is NOT here: it is
// a phrase-scale RESPONSE, placed where the tune's gesture leaves a space (below), never a prevailing texture.
const PREVAILING = ['held','pedal','walk','broken','oompah','double','counter','echo','tenth'];
function phraseWeights({ busy, prevApproach, active, canTenth = true }) {
  const w = {};
  for (const name of PREVAILING) {
    if (name === 'tenth' && !canTenth) continue;   // a five-finger grade folds every note into its box, which would collapse the tenths - so it isn't offered there (it can't render, not a taste ban)
    const n = NATURE[name];
    let interest = n.movement * (busy ? 0.7 : 1)
                 + (prevApproach && prevApproach !== name ? 0.4 : 0)   // CONTRAST the previous PHRASE's dress (a new span, a new colour) - phrase scale, not per bar
                 + n.relates * 0.5 * (busy ? 0.5 : 1);                 // relating the hands, stepping back under a busy tune
    const character = active ? 0.5 + n.movement * 0.6 : 0.8 + (1 - n.activity) * 0.5;
    w[name] = Math.max(0.05, (0.4 + interest) * character);
  }
  // parallel TENTHS is a distinctive, committed two-part texture - a composer reaches for it occasionally, not as a default dress,
  // so across a book it stays a colour, not the norm. A damp (still a preference, never zero), so it surfaces now and then.
  if (w.tenth != null) w.tenth *= 0.3;
  return w;
}

// a weighted (leaned) pick — the weights are the reasoning, nothing is zero-forbidden unless it truly is.
function lean(weights, rnd) {
  const es = Object.entries(weights).filter(([,w]) => w > 0);
  const tot = es.reduce((a,[,w]) => a+w, 0); if (!tot) return 'held';
  let r = rnd() * tot; for (const [k,w] of es) { r -= w; if (r <= 0) return k; } return es[es.length-1][0];
}

// plan + realise the whole accompaniment. Intentions are LEANED per bar and SWAPPED for contrast.
// Callbacks give the harmony/tune per bar in scale-degrees; box is the hand in absolute degrees.
export function accompany({ nbars, barU, beatLen, mode, dir, lo, hi, chordMax,
                            structRootOf, nextRootOf, melAt, tuneOf, busyOf, active, cadenceOf, mel = null, fixedPosition = false, rnd = Math.random }) {
  const scale = scaleOf(mode);
  const nbeats = Math.max(1, Math.round(barU / beatLen));
  const out = []; let prevDeg = null, prevDeg2 = null, prevRoot = null, prevMel = null, pedalTone = null;
  const motif = tuneOf(0);   // the tune's OWN opening idea, so the accompaniment can ANSWER it (imitation) where the tune leaves a space
  // how much the tune BREATHES in bar b (its rest-fraction) - a coherent open bar is a SPACE the accompaniment can answer into.
  const roomAt = b => { if (!mel) return 0; const b0 = b*barU, b1 = (b+1)*barU; let r = 0; for (const e of mel) if (e.rest) { const a = Math.max(e.t, b0), z = Math.min(e.end, b1); if (z > a) r += z - a; } return Math.min(1, r/barU); };
  // ---- PHRASE PLAN: choose the accompaniment's approach in MUSICAL UNITS (phrases), not per bar. A composer sets one dress for a
  // phrase and holds it (the harmony still moving under it), changing at the next phrase or for a reason; and answers the tune where
  // its gesture leaves a coherent SPACE. Segment at the phrase boundaries the piece already carries - its cadence bars.
  const plan = new Array(nbars);
  { const cadBars = []; for (let b = 0; b < nbars; b++) if (cadenceOf(b)) cadBars.push(b);
    const phrases = []; let s = 0; for (const cb of cadBars) { phrases.push({ s, e: cb }); s = cb+1; } if (s <= nbars-1) phrases.push({ s, e: nbars-1 });
    let prevApproach = null;
    for (const ph of phrases) {
      let bc = 0; for (let b = ph.s; b <= ph.e; b++) if (busyOf(b)) bc++;
      const approach = lean(phraseWeights({ busy: bc > (ph.e-ph.s+1)/2, prevApproach, active, canTenth: !fixedPosition }), rnd);
      for (let b = ph.s; b <= ph.e; b++) plan[b] = approach;
      // the FINAL cadence settles to a resolved tonic chord. This is the SAME grade-purpose near-hard-rule as opening/closing on the
      // tonic (see B): a graded READING exercise must resolve clearly - construction measured only ~73-83% tonic endings without it,
      // too weak for the book. It applies ONLY to the very last bar (not a texture-force elsewhere); mid-phrase cadences keep their dress.
      if (ph.e === nbars-1) plan[ph.e] = 'held';
      // RESPONSE: where the tune's gesture opens a coherent SPACE inside the phrase (a bar of rest arriving after activity), the
      // accompaniment ANSWERS there with the motif - one gesture spanning the space, not a per-bar fill. Rare, because real space is.
      if (motif.length >= 2) for (let b = Math.max(ph.s, 1); b < ph.e; b++) { if (roomAt(b) >= 0.6 && roomAt(b-1) < 0.6) { plan[b] = 'answer'; break; } }
      prevApproach = approach;
    }
  }
  for (let b = 0; b < nbars; b++) {
    const busy = busyOf(b), cadence = cadenceOf(b);
    // the harmony that MOVES through this bar, derived per beat from the tune (genuinely continuous - this grain IS finer than the bar)
    const beatMel = []; for (let k = 0; k < nbeats; k++) beatMel.push(melAt(b*barU + k*beatLen));
    // at a cadence the tune often RESOLVES on a short off-beat note (a leading-tone then a quick tonic); sample the note actually
    // sounding at the end of the bar so the harmony sees the resolution and comes home, instead of holding the dominant.
    if (cadence) { const endMel = melAt(b*barU + barU - 1e-6); if (endMel != null) beatMel[beatMel.length-1] = endMel; }
    const beatRoots = beatHarmony(beatMel, structRootOf(b), prevRoot, mode, cadence, b === 0);
    prevRoot = beatRoots[beatRoots.length-1];
    const rootAt = off => beatRoots[Math.max(0, Math.min(nbeats-1, Math.floor((off + 1e-9)/beatLen)))];
    const spans = harmonicSpans(beatRoots, beatLen);                  // the harmony's own rhythm — the accompaniment holds/moves with it
    const melLocal = off => melAt(b*barU + off);
    const _tuneSeg = (() => { let t = 0; return tuneOf(b).map(n => { const s = { o: t, e: t + n.dur, deg: n.deg }; t += n.dur; return s; }); })();
    const melRange = (o, d) => { let mn = Infinity, mx = -Infinity; for (const s of _tuneSeg) if (s.e > o + 1e-9 && s.o < o + d - 1e-9) { if (s.deg < mn) mn = s.deg; if (s.deg > mx) mx = s.deg; } return mn === Infinity ? null : { min: mn, max: mx }; };
    const name = plan[b];
    if (name === 'pedal') {                                            // a PEDAL PHRASE: ONE tone held (tied) across the phrase, the harmony moving under it - the pedal is itself a musical unit
      if (pedalTone == null) { const tonic = tonesInBox(0, lo, hi); pedalTone = tonic.length ? nearestTo(tonic, prevDeg ?? (lo+hi)/2) : tonesInBox(rootAt(0), lo, hi)[0]; }
      const cont = b+1 < nbars && plan[b+1] === 'pedal' && !cadence;
      out.push({ deg: pedalTone, dur: barU, ti: cont ? 1 : undefined, intent: 'pedal', bar: b, _root: rootAt(0) });
      prevDeg = pedalTone; if (!cont) pedalTone = null;
      continue;
    }
    const ctx = { rootAt, spans, melLocal, melRange, nextRoot: nextRootOf(b), lo, hi, barU, beatLen, nbeats,
                  dir, scale, mode, prev: prevDeg, prev2: prevDeg2, prevMel, chordMax, tune: tuneOf(b), motif, subdiv: busy ? 1 : 2, cadence, lastBar: b === nbars-1, opening: b === 0, fixedPosition };
    const notes = realiseBar(name, ctx);
    // CONSTRUCTION INVARIANT (grade canvas): a bar sums to the metre - a bar that does not add up is the beats-off fault, and
    // that is a BUG, not a preference (a composer's bar always fills its metre). Realisers occasionally return a short bar (a
    // merged span that didn't tile) or an overflowing one; the per-realiser pad missed some. So normalise EVERY bar here: hold
    // the last note to the barline if short, trim from the end if long. Clean by construction, not by rejection.
    { let _sum = 0; for (const n of notes) _sum += n.dur;
      if (_sum < barU - 1e-9 && notes.length) notes[notes.length-1].dur += barU - _sum;
      else if (_sum > barU + 1e-9) { let over = _sum - barU; while (over > 1e-9 && notes.length) { const l = notes[notes.length-1]; if (l.dur > over + 1e-9) { l.dur -= over; over = 0; } else { over -= l.dur; notes.pop(); } } } }
    let _bo = 0;
    for (const n of notes) { if (n.deg != null) { const d = Array.isArray(n.deg) ? n.deg[n.deg.length-1] : n.deg; prevDeg2 = prevDeg; prevDeg = d; } out.push({ ...n, intent: name, bar: b, _root: rootAt(_bo) }); _bo += n.dur; }
    prevMel = beatMel[beatMel.length-1] ?? prevMel;
  }
  // BASS ARRIVES FRESH (a lookahead the same reasoner makes once the bars exist): a genuine harmony change wants the bass to
  // MOVE into the new downbeat. Where a bar's last single bass note repeats the next bar's first bass ACROSS a real change of
  // root, re-pick it BY PREFERENCE - the chord tone of its own root, in the box, that moves off the coming bass and sits
  // nearest the line it was continuing. This is a composer glancing back at the barline and freeing a stuck bass, not an
  // external repair: the note is still chosen by the reasoner's own voice-leading, and a legitimate common-tone hold (same
  // root either side) is left untouched. Bass voice only (dir < 0); a swap accompaniment isn't the bass.
  if (dir < 0) {
    const G = {}; for (const n of out) (G[n.bar] = G[n.bar] || []).push(n);
    const bs = Object.keys(G).map(Number).sort((a,b)=>a-b);
    for (let i = 0; i < bs.length-1; i++) {
      const cur = G[bs[i]], nxt = G[bs[i+1]];
      if (cur.filter(n => !n.rest && n.deg != null && !Array.isArray(n.deg)).length >= 3) continue;   // a MOVING figure - its last note is a figural note, not the bass; internal motion is the arp lean's concern, not bass-arrival
      let L = null; for (let z = cur.length-1; z >= 0; z--) { const n = cur[z]; if (!n.rest && n.deg != null && !Array.isArray(n.deg)) { L = n; break; } }
      let F = null; for (const n of nxt) { if (!n.rest && n.deg != null) { F = n; break; } }
      if (!L || !F || L._root == null || F._root == null) continue;
      const fBass = Array.isArray(F.deg) ? Math.min(...F.deg) : F.deg;
      if (L.deg !== fBass) continue;                                  // no dead bass across this barline
      if (((L._root%7)+7)%7 === ((F._root%7)+7)%7) continue;          // same root either side - a common-tone hold / pedal, leave it
      const fRootPc = ((F._root%7)+7)%7;
      const li = out.indexOf(L); let before = null;
      for (let z = li-1; z >= 0; z--) { const n = out[z]; if (!n.rest && n.deg != null) { before = Array.isArray(n.deg) ? n.deg[n.deg.length-1] : n.deg; break; } }
      const anchor = before != null ? before : L.deg;
      // RE-CHOOSE BY PREFERENCE, not a forced move: a chord tone of L's own root nearest the line it was travelling, STRONGLY
      // dispreferring the dead outcome (holding the coming bass) and, more mildly, pre-stating the coming root - but forbidding
      // NOTHING. A composer moves the bass into a change most of the time and holds a common tone now and then; both stay open,
      // so the dead-bass rate settles at what real music does rather than being driven to zero by a rule.
      const cand = tonesInBox(L._root, lo, hi);
      let bestD = null, bestS = -Infinity;
      for (const d of cand) { let s = -Math.abs(d - anchor);
        if (d === fBass) s -= 4.0;                                    // the dead repeat across the change - strongly out of preference
        else if (((d%7)+7)%7 === fRootPc) s -= 1.5;                   // pre-stating the coming root - milder
        if (before != null && d === before) s -= 3.0;                 // trading a cross-bar repeat for an in-bar one
        if (s > bestS) { bestS = s; bestD = d; } }
      if (bestD != null) L.deg = bestD;
    }
  }
  // HANDS BREATHE TOGETHER: the two hands are one gesture, so where the TUNE breathes (a note, then a rest) and an accompaniment
  // note began flush WITH that tune note but would sustain straight through the breath, the accompaniment breathes too - shortened
  // to the tune note's length, resting for the rest. Only on an ALIGNED onset (a genuinely parallel moment); an independent figure
  // or a sustained/pedal tone, which never starts flush with a breathing tune note, is left to play on. Melody-aware, in the engine.
  if (mel) {
    const noteAt = tt => mel.find(e => Math.abs(e.t - tt) < 1e-9 && !e.rest);
    const restAt = tt => mel.find(e => Math.abs(e.t - tt) < 1e-9 && e.rest);
    const res = []; let at = 0;
    for (const n of out) { const t = at; at += n.dur;
      // a DELIBERATE sustain (a tie / pedal / drone) is the hands being independent - a held bass ringing through the tune's
      // breath is real music, so it is left to play on. Only an incidental long note that happens to plow the breath is breathed.
      if (n.rest || n.deg == null || n.ti || n.intent === 'pedal') { res.push(n); continue; }
      const mn = noteAt(t);
      if (mn) { const md = mn.end - mn.t, br = restAt(mn.end);
        if (md < n.dur - 1e-9 && br && (t + n.dur) <= br.end + 1e-9) { res.push({ ...n, dur: md }); res.push({ rest: true, dur: n.dur - md }); continue; } }
      res.push(n);
    }
    out.length = 0; out.push(...res);
  }
  return out;
}
