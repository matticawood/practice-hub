# Audit loop — Cycle 19 (spelling / range / slurs — CLEAN; loop converged, holding)

## RENDERED
- G3 B minor: scratchpad/c19bm.cropped.png — B minor, 3/4, Tempo di Valse, waltz, rootfifth (renders the raised ^6/^7 spelling).

## MEASURED (the engine's LilyPond spelling, in-process)
KEYS — grade-appropriate: <= 3 accidentals only (C/G/D/A/F/Bb/Eb major; A/E/B/D/G minor).
SPELLING — 0 double accidentals across 3001 pieces; 0/976 minor pieces missing their raised leading tone, correctly spelled
per key (gis Am, dis Em, ais Bm, cis Dm, fis Gm).
G2 RANGE — stays in the five-finger window: max span 7 semitones (a fifth), 0/1000 over a sixth.
SLURS — 0/1200 g3/g4 pieces have a slur crossing a rest.

## AUDIT
The B-minor render (c19bm.cropped.png) confirms the measured spelling in notation, note by note:
RH b1 B3(dotted-crotchet) C#4(quaver) D4 — i outline, C# = ^2 (diatonic, key sig). b2 C#4 D4 E4 — stepwise. b3 G4 F#4 E4
F#4 — G natural = ^6 (natural, descending). b4 F#4 A#4 G4 F#4 — the A#4 is the RAISED ^7 (leading tone), spelled as a
SHARP (not Bb), correct. b5 B4(minim) rest — phrase arrival on the tonic. b6 F#4 G4 B4. b7 F#4 G#4 A#4 — an ASCENDING
melodic-minor approach F#-G#-A#(-B): the G#4 is the raised ^6 (sharp) and A#4 the raised ^7 (sharp), both correctly spelled
for the ascent. b8 B4(dotted-minim) — final tonic.
LH (waltz oom-pah): b1 B2 / D3+F#3 / D3+F#3 = i (B-D-F#, full triad). b4 A#2 / C#3+F#3 / C#3+F#3 = V (F#-A#-C#, F# major
with the A# leading tone, correctly a SHARP). b5-b6 i. b7 B2 / A#2 / C#3+F#3 — the A#2 (leading tone) in the bass, a sharp.
b8 i. Every accidental is a SHARP (A#, G#, C#, F#), never a flat — correct for B minor's raised ^6/^7 and its V chord. No
double accidentals. Dynamics p -> mf -> mp; waltz lilt; clear i-V-i. Clean.

## VERDICT
Cycle 19: CLEAN. Keys, enharmonic/accidental spelling, minor leading-tone spelling (measured + confirmed in the B-minor
render), g2 range window, and slur-over-rest all check out. No change made, no fix manufactured.

The loop has CONVERGED. The remaining work is FEATURE BUILDS, not loop-fixable violations, awaiting Matthew's greenlight:
  1. Compound metre (6/8, 9/8) — a whole ABRSM metrical class absent. Biggest, high effort.
  2. More chromatic colour — only V/V exists; could add V/vi, V/ii, borrowed chords. Best value-for-effort.
  3. 16-bar forms — g3/4 always 8 bars. Minor; 8 is standard for these grades.
