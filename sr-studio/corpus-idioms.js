// ============================================================================
// STRUCTURED IDIOM CORPUS — the recombinable content of real specimen pieces.
// Unlike corpus.js (feature index + prose), this encodes the ACTUAL per-bar
// skeleton the generator can draw from and fill with its own pitches:
//   rh  = per bar: array of events. {d} = a note of duration d (quarter-beats);
//         {d,r:1} = a rest; optional a:'.'|'>'|'-' (staccato/accent/tenuto),
//         sl:'('|')' (slur start/end), ti:1 (tied into next).
//   lh  = per bar: array of accompaniment SLOTS ['b'|'c'|'r', d, art?]
//         b=bass, c=chord(3rd/5th above), r=rest.
//   harm = functional chord per bar (I, IV, V, vi, ii, i, iv, V/V, ...).
//   dyn  = markings with bar index, e.g. 'p@1','mf@3'.
// PITCHES are deliberately NOT stored — the idiom is the rhythm/rest/figure/harmony
// shape, which is what makes a piece sit at the right level and in the right style.
// Extracted piece-by-piece from Matthew's scans; only bars read with confidence
// are committed. Durations are quarter-beats (6/8 dotted-crotchet beat = 1.5; never split to 0.75).
// ============================================================================
export const IDIOMS = [

  // ---- Grade 2, #16 Waltz (3/4, G) : lyrical melody over a lifted-first-beat oom-pah ----
  { g:2, n:16, tempo:'Waltz', time:'3/4', key:'G', mode:'maj',
    rh: [ [{d:3,sl:'('}],                         // bar1: dotted-minim, slur begins
          [{d:2},{d:1}],                          // bar2: minim + crotchet
          [{d:1.5},{d:0.5},{d:1}],                // bar3: dotted-crotchet, quaver, crotchet
          [{d:2,sl:')'},{d:1,r:1}] ],             // bar4: minim (slur ends) + crotchet rest
    lh: [ [['r',1],['c',1],['c',1]],              // waltz: REST, chord, chord (lifted downbeat)
          [['r',1],['c',1],['c',1]],
          [['r',1],['c',1],['c',1]],
          [['b',1],['c',1],['r',1]] ],            // cadence bar: bass, chord, lift
    harm: ['I','V','V','I'], dyn:['p@1','mf@3'] },

  // ---- Grade 2, #10 Lullaby (3/4, Bb) : held rocking bass under a gentle dotted tune ----
  { g:2, n:10, tempo:'Lullaby', time:'3/4', key:'Bb', mode:'maj',
    rh: [ [{d:1.5,sl:'('},{d:0.5},{d:1}],         // bar1: dotted-crotchet, quaver, crotchet
          [{d:1},{d:1},{d:1,ti:1}],               // bar2: crotchets, tie into next
          [{d:3}],                                // bar3: dotted-minim held
          [{d:3,sl:')'}] ],                       // bar4: dotted-minim held, slur ends
    lh: [ [['b',3]],                              // whole-bar held bass (dotted-minim), rocking
          [['b',3]],
          [['b',1],['c',2]],                      // bass then held chord
          [['b',3]] ],
    harm: ['I','V','I','I'], dyn:['p@1','pp@4'] },

  // ---- Grade 2, #7 Dancing (2/4, F) : quaver dance tune, bass with crotchet-rest lift ----
  { g:2, n:7, tempo:'Dancing', time:'2/4', key:'F', mode:'maj',
    rh: [ [{d:0.5,sl:'('},{d:0.5},{d:1}],         // bar1: two quavers + crotchet
          [{d:1},{d:1,sl:')'}],                   // bar2: crotchets, slur ends
          [{d:2}],                                // bar3: minim
          [{d:1,r:1},{d:0.5,sl:'('},{d:0.5}],     // bar4: crotchet rest, two quavers
          [{d:0.5},{d:0.5},{d:1,sl:')'}],         // bar5: quavers + crotchet, slur ends
          [{d:2}] ],                              // bar6: minim
    lh: [ [['b',1],['b',1]],                      // walking crotchet bass
          [['b',1],['b',1]],
          [['b',1],['r',1]],                      // bass + crotchet rest
          [['b',1],['b',1]],
          [['b',1],['b',1]],
          [['b',2]] ],                            // held bass
    harm: ['I','V','I','V','I','I'], dyn:['mf@1','f@4'] },

  // ---- Grade 2, #2 March (4/4, F) : dotted march tune, plain bass ----
  { g:2, n:2, tempo:'March', time:'4/4', key:'F', mode:'maj',
    rh: [ [{d:1.5},{d:0.5},{d:1},{d:1}],          // bar1: dotted-crotchet, quaver, crotchet, crotchet
          [{d:1},{d:1},{d:2}],                    // bar2: crotchets + minim
          [{d:1,r:1},{d:1},{d:1.5},{d:0.5}],      // bar3: crotchet rest, crotchet, dotted-crotchet, quaver
          [{d:1},{d:1,ti:1},{d:2}] ],             // bar4: crotchet, crotchet(tie), minim
    lh: [ [['b',2],['b',2]],                      // minim bass tread
          [['b',1],['b',1],['b',1.5],['b',0.5]],
          [['b',4]],                              // whole-note bass
          [['b',2],['b',2]] ],
    harm: ['I','IV','V','I'], dyn:['f@1'] },

  // ---- Grade 2, #1 Minuet (3/4, C) : accented, dignified; opens with a bar rest ----
  { g:2, n:1, tempo:'Minuet', time:'3/4', key:'C', mode:'maj',
    rh: [ [{d:3,r:1}],                            // bar1: whole-bar rest (melody enters bar 2)
          [{d:0.5},{d:0.5},{d:1},{d:1}],          // bar2: two quavers + crotchets
          [{d:1,a:'>'},{d:2,a:'>'}],              // bar3: accented crotchet + accented minim
          [{d:3,a:'>'}] ],                        // bar4: accented dotted-minim
    lh: [ [['b',1],['b',1],['b',1]],              // crotchet bass
          [['b',2],['b',1]],
          [['b',1,'>'],['b',1,'>'],['b',1]],      // accented bass
          [['b',1,'>'],['r',1],['c',1,'-.']] ],
    harm: ['I','I','V','I'], dyn:['mf@1','f@3'] },
];
