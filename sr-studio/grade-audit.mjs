import { readFileSync } from 'fs';
// Accidental count per key (major/minor)
const ACC = {
  'major': {c:0,g:1,d:2,a:3,e:4,b:5,'f#':6,f:1,bf:2,ef:3,af:4,df:5},
  'minor': {a:0,e:1,b:2,'f#':3,'c#':4,'g#':5,d:1,g:2,c:3,f:4,bf:5}
};
const SET = {
  2: {major:new Set(['c','g','f','d']),                minor:new Set(['a','d','e','g'])},
  3: {major:new Set(['c','g','d','a','f','bf','ef']),  minor:new Set(['a','e','b','d','g'])},
  4: {major:new Set(['c','g','d','a','f','bf','ef']),  minor:new Set(['a','e','b','d','g'])},
};
const TIME = { 2:new Set(['4/4','2/4','3/4']), 3:new Set(['4/4','2/4','3/4','3/8']), 4:new Set(['4/4','2/4','3/4','3/8','6/8']) };
const ACCMAX = {2:2,3:3,4:3};

function beatsPerBar(t){const[a,b]=t.split('/').map(Number);return a*4/b;}
function audit(ex, grade){
  const v=[];
  const key=(ex.key||'').toLowerCase(); const mode=(ex.mode||'maj').startsWith('min')?'minor':'major';
  const acc = ACC[mode]?.[key];
  if(!SET[grade][mode]?.has(key)) v.push(`key ${key} ${mode} not in G${grade} set`);
  else if(acc>ACCMAX[grade]) v.push(`${acc} accidentals > G${grade} max ${ACCMAX[grade]}`);
  if(!TIME[grade].has(ex.time)) v.push(`time ${ex.time} not allowed at G${grade}`);
  // bars
  const bpb=beatsPerBar(ex.time); const tot=ex.rh.reduce((s,n)=>s+n.d,0); const bars=Math.round(tot/bpb);
  if(grade===2 && !(bars===4||bars===6)) v.push(`${bars} bars (G2 wants 4 or 6)`);
  if(grade===3 && bars>8) v.push(`${bars} bars (G3 max ~8)`);
  if(grade===4 && (bars<7||bars>9)) v.push(`${bars} bars (G4 ~8)`);
  // rhythm: semiquavers, triplets
  const durs=[...ex.rh,...ex.lh].filter(n=>!n.rest).map(n=>n.d);
  const semiq = durs.some(d=>d<0.5-1e-9);
  if(grade===2 && semiq) v.push('semiquavers (G3+)');
  const trip = durs.some(d=>{const r=(d/ (1/3))%1; return Math.abs(d%0.25)>1e-6 && (Math.abs(d-1/3)<1e-2||Math.abs(d-2/3)<1e-2);});
  if(trip) v.push('triplet-like durations (G6)');
  // chords
  const chordSizes=[...ex.rh,...ex.lh].filter(n=>Array.isArray(n.m)).map(n=>n.m.length);
  if(grade===2 && chordSizes.length) v.push(`${chordSizes.length} chords (G2 = single notes)`);
  if(chordSizes.some(s=>s>2)) v.push(`${chordSizes.filter(s=>s>2).length} chords >2 notes (G5)`);
  // dynamics
  const dyns=[...ex.rh,...ex.lh].map(n=>n.dyn).filter(Boolean);
  if(dyns.includes('ff')) v.push('ff (G5)');
  if(grade<4){const artok=[...ex.rh,...ex.lh].some(n=>n.ferm); if(artok) v.push('fermata (G4+)');}
  // G2 fixed 5-finger: each hand span <= a 5th-ish (9 semis leeway for black keys)
  if(grade===2){
    for(const [h,seq] of [['RH',ex.rh],['LH',ex.lh]]){
      const ms=seq.filter(n=>!n.rest&&!Array.isArray(n.m)).map(n=>n.m);
      if(ms.length){const span=Math.max(...ms)-Math.min(...ms); if(span>9) v.push(`${h} span ${span} semis (>5-finger, likely a shift)`);}
    }
  }
  return {key:`${key} ${mode}`, time:ex.time, bars, tempo:ex.tempo, v};
}
for(const g of [2,3,4]){
  const bank=JSON.parse(readFileSync(`./bank/grade${g}.json`,'utf8'));
  let bad=0;
  console.log(`\n===== GRADE ${g}: ${bank.length} pieces =====`);
  bank.forEach((ex,i)=>{const r=audit(ex,g); if(r.v.length){bad++; console.log(`  #${i+1} ${r.key} ${r.time} ${r.bars}bar "${r.tempo||''}": ${r.v.join(' | ')}`);}});
  console.log(`  -> ${bad}/${bank.length} off-spec, ${bank.length-bad} clean on the mechanical checks`);
}
