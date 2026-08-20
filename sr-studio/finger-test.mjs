// Canonical fingering regression test for the forward reasoner (fingering.mjs fingerHand).
// Run: node finger-test.mjs   — objective pedagogical truth (scales/arpeggios/skip-scale/reserve/octave, both hands).
import { fingerHand } from './fingering.mjs';
const CMAJ=[0,2,4,5,7,9,11], GMAJ=[7,9,11,0,2,4,6], DMAJ=[2,4,6,7,9,11,1];
const FMAJ=[5,7,9,10,0,2,4], BFMAJ=[10,0,2,3,5,7,9], EFMAJ=[3,5,7,8,10,0,2];
const mk = arr => arr.map(m=>({m,d:1}));
const cases = [
  ['RH C maj scale asc',  'rh', CMAJ, [60,62,64,65,67,69,71,72], [1,2,3,1,2,3,4,5]],
  ['RH C maj scale desc', 'rh', CMAJ, [72,71,69,67,65,64,62,60], [5,4,3,2,1,3,2,1]],
  ['RH broken triad asc', 'rh', CMAJ, [60,64,67], [1,3,5]],
  ['RH broken triad desc','rh', CMAJ, [67,64,60], [5,3,1]],
  ['RH octave asc',       'rh', CMAJ, [60,72], [1,5]],
  ['RH 5-finger asc',     'rh', CMAJ, [60,62,64,65,67], [1,2,3,4,5]],
  ['RH skip-scale desc',  'rh', GMAJ, [79,74,72,71,69,67], [5,2,1,3,2,1]],
  ['RH arp-reserve up',   'rh', DMAJ, [71,74,78,79], [1,2,4,5]],
  ['LH C maj scale asc',  'lh', CMAJ, [48,50,52,53,55,57,59,60], [5,4,3,2,1,3,2,1]],
  ['LH C maj scale desc', 'lh', CMAJ, [60,59,57,55,53,52,50,48], [1,2,3,1,2,3,4,5]],
  ['LH broken triad asc', 'lh', CMAJ, [48,52,55], [5,3,1]],
  ['LH broken triad desc','lh', CMAJ, [55,52,48], [1,3,5]],
  ['RH D-1stinv arp F#AD','rh', DMAJ, [66,69,74], [1,3,5]],        // thumb ON the black F# (its anchor) - contextual, conventional
  ['RH F maj scale asc',  'rh', FMAJ,  [65,67,69,70,72,74,76,77], [1,2,3,4,1,2,3,4]],
  ['RH Bb maj scale asc', 'rh', BFMAJ, [70,72,74,75,77,79,81,82], [4,1,2,3,1,2,3,4]],
  ['RH Eb maj scale asc', 'rh', EFMAJ, [63,65,67,68,70,72,74,75], [3,1,2,3,4,1,2,3]],
  ['RH D-to-A fragment',  'rh', DMAJ,  [62,64,66,67,69], [1,2,3,4,5]],  // a 5th run = thumb-to-pinky, not scale fingering
  // COMPOSER-CHOICE (not just jam-free): two-octave scales must CONTINUE by thumb-cross into the conventional groups,
  // pinky only on the final note - a fingering can be jam-free yet not what an editor writes.
  ['RH C 2-oct asc',      'rh', CMAJ, [60,62,64,65,67,69,71,72,74,76,77,79,81,83,84], [1,2,3,1,2,3,4,1,2,3,1,2,3,4,5]],
  ['RH G 2-oct asc',      'rh', GMAJ, [67,69,71,72,74,76,78,79,81,83,84,86,88,90,91], [1,2,3,1,2,3,4,1,2,3,1,2,3,4,5]],
  ['RH F 2-oct asc',      'rh', FMAJ, [65,67,69,70,72,74,76,77,79,81,82,84,86,88,89], [1,2,3,4,1,2,3,1,2,3,4,1,2,3,4]],
  ['LH C 2-oct asc',      'lh', CMAJ, [36,38,40,41,43,45,47,48,50,52,53,55,57,59,60], [5,4,3,2,1,3,2,1,4,3,2,1,3,2,1]],
  ['RH C arp 1-oct',      'rh', CMAJ, [60,64,67,72], [1,2,3,5]],   // one-octave triad arp = 1-2-3-5 (the case that actually occurs)
];
// thumb-on-black is CONTEXTUAL: assert only that F# takes the thumb in the arp-then-scale run (Matthew's example)
{ const run=[66,69,74,73,71,69,67].map(m=>({m,d:1}));            // F#-A-D then a D-major scale down
  const got=fingerHand(run,'rh',DMAJ).fings;
  console.log((got[0]===1?'PASS':'FAIL'), 'RH F#AD-then-scale-down: thumb on F#? got F#='+got[0]); }
let pass=0;
for(const [name,hand,sc,pitches,exp] of cases){
  const got = fingerHand(mk(pitches), hand, sc).fings.filter(x=>x!=null);
  const ok = got.length===exp.length && got.every((x,i)=>x===exp[i]);
  console.log((ok?'PASS':'FAIL').padEnd(5), name.padEnd(22), 'got', JSON.stringify(got), ok?'':'exp '+JSON.stringify(exp));
  if(ok) pass++;
}
console.log('\n'+pass+'/'+cases.length+' canonical cases pass');
