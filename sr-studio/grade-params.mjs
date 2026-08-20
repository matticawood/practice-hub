// GRADE PARAMETER TABLE
// ---------------------------------------------------------------------------------------------------
// The single source that turns the grade-AGNOSTIC music rules (RULES.md + the generator) into a SPECIFIC
// grade. Grade is only a lens; the rule engine reads its limits from here. Never omit a real rule because a
// grade "does not need it" (see RULES.md).
//
// [P] values are TRANSCRIBED from the official ABRSM Piano Practical Grades Qualification Specification,
//     "Sight-reading parameters" table (p.16). These are AUTHORITATIVE. Cumulative: once introduced, applies
//     to all later grades (progressing in difficulty).
// [I] values are INFERRED musical rules NOT in the ABRSM table (harmonic vocabulary, non-chord-tone types,
//     texture set, leap ceiling) — my derivations, open to correction.
//
// CUMULATIVE MERGE: gradeParams(g) folds initial..g. Objects merge one level deep (partial deltas ok);
// ARRAYS are REPLACED, so any array that changes at a grade is written as its FULL cumulative list there.
// ---------------------------------------------------------------------------------------------------

export const GRADE_DELTAS = {
  // ===== INITIAL =====  [P] 4/4 & 2/4; C major, D minor; each hand separately, 5-finger (tonic-dominant)
  initial: {
    timeSignatures: ['4/4','2/4'],                     // [P]
    bars: { '4/4':4, '2/4':6 },                        // [P]
    noteValues: { min: 0.5, dotted: [], ties: false, triplets: false }, // [P] crotchet/minim/quaver
    keys: { major: ['C'], minor: ['D'] },              // [P]
    range: { span: 7, fixedPosition: true, handsTogether: false }, // [P] separate hands, 5-finger tonic-dominant
    chordMax: 1,                                       // [P]
    // RICHNESS FLOOR [P]: at grade 2 SIMPLICITY is the point - a three-note tune (do-mi-sol) over a two-chord I-V-I with a
    // two-note oom-pah is ideal sight-reading, not "too thin". So the too-simple REJECTION rules use a lower floor here;
    // only genuine deadness (1-2 pitches, one chord, one LH note, a note repeated 5+ times) is rejected. Higher grades have
    // no `richness` field and keep the stricter defaults in the monotony/thin checks. (Matthew: don't cut out possibilities.)
    richness: { melDistinct: 3, maxFrac: 0.55, maxRun: 5, chords: 2, accomp: 2 },
    chromatic: { budget: 0 },                          // [P] (accidentals only within minor keys, from G1)
    articulation: ['legato','staccato'],               // [P] legato phrases, staccato
    expression: { tenuto:false, fermata:false, accent:false, hairpins:false, dynamics:['p','f'] }, // [P] f and p
    rhythmDevices: { anacrusis:false, syncopation:false }, // [P]
    ornaments: [],                                     // [P]
    // chord VOCABULARY is not a wired param - it emerges from the five-finger box (generator CH = I ii iii IV V,
    // filtered by the functional grammar) and expands only once the hand leaves fixed position (CH_EXTRA adds vi at
    // grade 3+, a genuine physical precondition since vi's root sits above the box). The mediant is in the box but the
    // grammar routes to it only via vi->iii, so it is ~0% at grade 2 and 1-5% at grade 3-4 - exactly its rarity in tonal
    // music. secondary/sevenths/cadences below ARE wired (read as gp.harmony.*).
    harmony: { secondary:[], sevenths:false, cadences:['perfect','plagal'], midBarChord:'none' }, // [I] (midBarChord: what mid-bar chord activity the grade admits - see grade 2/3/4)
    nonChordTones: ['passing','neighbour'],            // [I]
    // (leapCeiling removed: it was dead, and the max leap is correctly bounded by RANGE.span - a 5th within the
    //  five-finger grades, up to an octave once out of position - which matches real graded melodies. No separate ceiling.)
  },
  // ===== GRADE 1 =====  [P] +3/4; +G,F major, A minor; any 5-finger; dotted rhythms, rests, slurs, ACCENTS, mf/mp, cresc/dim
  1: {
    timeSignatures: ['4/4','2/4','3/4'],               // [P]
    keys: { major:['C','G','F'], minor:['A','D'] },    // [P] (D minor carried from Initial)
    range: { span: 7, fixedPosition: true, handsTogether: false }, // [P] any 5-finger position
    noteValues: { min: 0.5, dotted:[1.5,3], ties:false, triplets:false }, // [P] +dotted rhythms (dotted crotchet/minim; NO dotted quaver — needs a semiquaver, which is grade 3)
    articulation: ['legato','staccato','slur'],        // [P] +slurs
    expression: { tenuto:false, fermata:false, accent:true, hairpins:true, dynamics:['p','mp','mf','f'] }, // [P] +accents, +mf/mp, +cresc./dim.
    harmony: { secondary:[], sevenths:false, cadences:['perfect','plagal','half'] }, // [I] (chord vocab emerges from the box, not wired - see initial)
  },
  // ===== GRADE 2 =====  [P] +D major, E,G minors; PLAYING TOGETHER; semibreve, dotted-crotchet-quaver, TIED notes, pp
  2: {
    keys: { major:['C','G','F','D'], minor:['A','D','E','G'] }, // [P]
    range: { span: 7, fixedPosition: true, handsTogether: true }, // [P] playing together
    noteValues: { min:0.5, dotted:[1.5,3], ties:true, triplets:false }, // [P] +tied notes (still no dotted quaver until grade 3)
    expression: { dynamics:['pp','p','mp','mf','f'] }, // [P] +pp
    // [I] mid-bar chord activity = 'cadential': a 4-bar phrase (2/4 = 6) has NO free interior bar for the predominant (every
    // bar is the opening tonic / mid-cadence / pre-cadence / final), so the predominant SHARES the pre-cadence bar with the
    // dominant it prepares. This is a compensation for the cramped phrase, not general enrichment. See generator ~L895.
    harmony: { midBarChord:'cadential' },
  },
  // ===== GRADE 3 =====  [P] up to 8 bars; +3/8; +A,Bb,Eb major, B minor; OUTSIDE 5-finger; 2-note chords, simple semiquavers, rests
  3: {
    timeSignatures: ['4/4','2/4','3/4','3/8'],          // [P]
    bars: { '4/4':8, '3/4':8, '2/4':8, '3/8':8 },       // [P] up to 8
    keys: { major:['C','G','F','D','A','Bf','Ef'], minor:['A','D','E','G','B'] }, // [P]
    range: { span: 15, fixedPosition: false },          // [P] outside 5-finger position
    chordMax: 2,                                        // [P] 2-note chords in either hand
    noteValues: { min:0.25, dotted:[0.75,1.5,3], ties:true, triplets:false }, // [P] +simple semiquavers
    nonChordTones: ['passing','neighbour','suspension','anticipation','escape'], // [I] +suspension, anticipation, échappée (escape): early-intermediate NCTs, apt once the line leaves five-finger position
    // [I] mid-bar chord activity back to 'none': the 8-bar phrase now HAS free interior bars, so the predominant sits in its
    // own bar (no cadential SHARE needed), and grade 3 has no chromatic vocabulary to enrich a bar mid-way. One chord per bar.
    harmony: { midBarChord:'none' },
  },
  // ===== GRADE 4 =====  [P] c.8 bars; +6/8; ANACRUSIS, CHROMATIC notes, PAUSE (fermata), TENUTO
  4: {
    timeSignatures: ['4/4','2/4','3/4','3/8','6/8'],     // [P]
    bars: { '4/4':8, '3/4':8, '2/4':8, '3/8':8, '6/8':8 }, // [P]
    chromatic: { budget: 1 },                           // [P] chromatic notes
    nonChordTones: ['passing','neighbour','suspension','anticipation','escape','appoggiatura'], // [I] +appoggiatura (accented dissonance) - more prominent than the others, so it arrives a grade later
    rhythmDevices: { anacrusis:true, syncopation:false }, // [P] +anacrusis (syncopation NOT until G5)
    articulation: ['legato','staccato','slur','tenuto'], // [P] +tenuto
    expression: { tenuto:true, fermata:true },          // [P] +tenuto, +pause signs
    harmony: { secondary:['V/V'], sevenths:true, cadences:['perfect','plagal','half','interrupted'], midBarChord:'enrich' }, // [I] (chord vocab emerges from the box, not wired - see initial). midBarChord:'enrich' = the roomy phrase now takes mid-bar chord CHANGES (V/V secondary-dominant tonicisation + a second chord to relieve a static bar or intensify the pre-cadence), the harmonic-rhythm richness grade 4 admits. See generator ~L833.
    // [I] a bare plain arpeggio (ALL crotchets-or-longer AND almost no stepwise motion) is below grade 4's expected melodic
    // interest - by grade 4 the tune should show rhythmic subdivision OR conjunct motion, not just slow chord-tone leaps. So
    // the candidate scorer rejects that combination from grade 4 up (cumulative). Acceptable below grade 4. See generator ~L3041.
    melody: { rejectPlainArpeggio: true },
  },
  // ===== GRADE 5 =====  [P] c.8-12; +E,Ab major, F#,C minor; 4-part chords (2 max/hand), SIMPLE SYNCOPATION, rit. at end, ff
  5: {
    bars: { '4/4':10, '3/4':10, '2/4':10, '3/8':10, '6/8':10 }, // [P] c.8-12 (approx)
    keys: { major:['C','G','F','D','A','Bf','Ef','E','Af'], minor:['A','D','E','G','B','Fs','C'] }, // [P]
    chordMax: 2,                                        // [P] 2 notes max in either hand
    rhythmDevices: { anacrusis:true, syncopation:true }, // [P] +simple syncopation
    expression: { dynamics:['pp','p','mp','mf','f','ff'], ritEnd:true }, // [P] +ff, slowing of tempo at end
  },
  // ===== GRADE 6 =====  [P] c.12-16; +9/8,5/8,5/4; +C#,F minor; TRIPLET rhythms, clef changes, right pedal
  6: {
    timeSignatures: ['4/4','2/4','3/4','3/8','6/8','9/8','5/8','5/4'], // [P]
    keys: { major:['C','G','F','D','A','Bf','Ef','E','Af'], minor:['A','D','E','G','B','Fs','C','Cs','F'] }, // [P]
    noteValues: { min:0.25, dotted:[0.75,1.5,3], ties:true, triplets:true }, // [P] +triplet rhythms
    clefChanges: true, pedal: true,                     // [P]
  },
  // ===== GRADE 7 =====  [P] c.16-20; +7/8,7/4; tempo changes, 8va sign, una corda
  7: {
    timeSignatures: ['4/4','2/4','3/4','3/8','6/8','9/8','5/8','5/4','7/8','7/4'], // [P]
    tempoChanges: true, ottava: true, unaCorda: true,   // [P]
  },
  // ===== GRADE 8 =====  [P] c.1 page; +12/8; +B,Db major; 3-part chords, spread chords, simple ORNAMENTS, accel.
  8: {
    timeSignatures: ['4/4','2/4','3/4','3/8','6/8','9/8','5/8','5/4','7/8','7/4','12/8'], // [P]
    keys: { major:['C','G','F','D','A','Bf','Ef','E','Af','B','Df'], minor:['A','D','E','G','B','Fs','C','Cs','F'] }, // [P]
    chordMax: 3,                                        // [P] 3-part chords in either hand
    ornaments: ['grace','trill','turn'],                // [P] simple ornaments
    spreadChords: true, accel: true,                    // [P]
  },
};

// Fold initial..g into one resolved parameter set (objects merge one level deep; arrays are replaced).
export function gradeParams(g){
  const order = ['initial']; for(let i=1;i<=g;i++) order.push(i);
  const out = {};
  for(const key of order){
    const d = GRADE_DELTAS[key]; if(!d) continue;
    for(const k of Object.keys(d)){
      out[k] = (d[k] && typeof d[k]==='object' && !Array.isArray(d[k])) ? { ...(out[k]||{}), ...d[k] } : d[k];
    }
  }
  return out;
}
