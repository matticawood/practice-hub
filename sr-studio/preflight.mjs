// PREFLIGHT GATE — every exercise must pass this before it is presented. Consolidates
// every error made by hand this session into one automated check, so the mechanical
// faults (harmony, spacing, missing/illogical dynamics, wrong fingering, cumulative
// features) can never reach review again. What it CANNOT judge is musicality/interest;
// that stays a human-ear step. Batch check also flags texture sameness across a set.
import { validate } from './engine.mjs';
import { leapClashes, sixFours, beatDissonance, handCrossing } from './harmony-checks.mjs';

const LV={p:1,mp:2,mf:3,f:4,ff:5};
const barUof=e=>{const[a,b]=e.time.split('/').map(Number);return (a/b)*4;};

// ---- individual exercise ----
export function preflight(e, grade){
  const fails=[], warns=[];
  const v=validate(e);
  if(!v.ok) fails.push('ILLEGAL: '+v.errors.join('; '));
  if(beatDissonance(e).length) warns.push('on-beat dissonance x'+beatDissonance(e).length+' (check: suspensions/appoggiaturas are fine)');
  if(sixFours(e).length)       fails.push('6/4 on a downbeat x'+sixFours(e).length);
  if(leapClashes(e).filter(c=>c.verdict.startsWith('FAULT')).length) fails.push('leap into on-beat dissonance');
  if(handCrossing(e).length)   fails.push('hand crossing x'+handCrossing(e).length);
  { const lt=leadingToneResolution(e); if(lt.length) fails.push(...lt); }

  const all=[...e.rh,...e.lh];
  // cumulative features: a start dynamic + at least one cresc/dim (present from Grade 2 up)
  if(!all.some(n=>n.dyn)) fails.push('no dynamic marking');
  if(!all.some(n=>n.hp))  fails.push('no crescendo/diminuendo (required from Grade 2)');
  // rests: generator makes none, phrases should breathe (warn, not every exercise must)
  if(!all.some(n=>n.rest)) warns.push('no rests (does it need a breath?)');

  // dynamic logic: every crescendo must rise, every diminuendo must fall
  { let cur=null,pend=null,t=0,barU=barUof(e);
    for(const n of e.rh){ const bar=Math.floor(t/barU+1e-9)+1;
      if(n.dyn){ if(pend){const a=LV[pend.from]||0,b=LV[n.dyn]||0;
        if(pend.dir==='cresc'&&b<=a) fails.push('b'+bar+' crescendo not louder ('+pend.from+'->'+n.dyn+')');
        if(pend.dir==='dim'&&b>=a)   fails.push('b'+bar+' diminuendo not quieter ('+pend.from+'->'+n.dyn+')');
        pend=null;} cur=n.dyn; }
      if(n.hp==='\\<'||n.hp==='\\>') pend={dir:n.hp==='\\<'?'cresc':'dim',from:cur};
      t+=n.d; } }

  // fingering sanity: lhFinger 5 is only right if the LH opens on its lowest note
  if(e.lhFinger===5){
    const lp=e.lh.flatMap(n=>Array.isArray(n.m)?n.m:(n.rest?[]:[n.m]));
    const first=Array.isArray(e.lh[0].m)?Math.min(...e.lh[0].m):e.lh[0].m;
    if(first!==Math.min(...lp)) fails.push('lhFinger 5 but LH does not open on its lowest note');
  }
  return { pass:fails.length===0, fails, warns };
}

// Leading tone at the FINAL cadence must rise a semitone to the tonic, never fall away from it.
// Only fires when a hand's penultimate note is the leading tone and its last note is the tonic,
// i.e. an actual leading-tone->tonic resolution — so it enforces the direction without touching
// ordinary lines. (A root-position V-I bass moves by root, never triggers this.)
const _LT={c:0,d:2,e:4,f:5,g:7,a:9,b:11};
export function leadingToneResolution(e){
  const tonic=((_LT[e.key[0]]+(e.key[1]==='f'?-1:e.key[1]==='s'?1:0))%12+12)%12;
  const leading=(tonic+11)%12;
  const bad=[];
  for(const [hand,tl] of [['RH',e.rh],['LH',e.lh]]){
    const ns=tl.filter(n=>!n.rest); if(ns.length<2) continue;
    const last=ns[ns.length-1], pen=ns[ns.length-2];
    const penTop=Array.isArray(pen.m)?Math.max(...pen.m):pen.m;      // the voice that carries the leading tone
    const lastM=Array.isArray(last.m)?last.m:[last.m];
    const penPc=((penTop%12)+12)%12;
    if(penPc===leading && lastM.some(x=>((x%12)+12)%12===tonic)){
      if(!lastM.includes(penTop+1))
        bad.push(hand+' leading tone falls at the cadence (should rise a semitone to the tonic)');
    }
  }
  return bad;
}

// ---- signature of an exercise's accompaniment, to detect sameness across a batch ----
export function textureSig(e){
  // Fingerprint = overall LH character (single-line / chordal / mixed) + bar-1 rhythm.
  // The character prefix stops a two-part line and a chordal accompaniment colliding
  // just because bar 1 shares a rhythm.
  const anyChord=e.lh.some(n=>Array.isArray(n.m)), allChordOrRest=e.lh.every(n=>Array.isArray(n.m)||n.rest);
  const kind = !anyChord ? 'LINE' : allChordOrRest ? 'CHORD' : 'BROKEN';
  const barU=barUof(e); let t=0, bar1=[];
  for(const n of e.lh){ if(t>=barU-1e-9) break; bar1.push(n.d); t+=n.d; }
  return kind+':'+bar1.join(',');
}
// Harmonic fingerprint: the LH downbeat bass note per bar, as a scale degree of the key.
// Two exercises with the same degree sequence are running the same chord progression,
// which is the harmonic-sameness the ear catches even when textures differ.
const LET={c:0,d:2,e:4,f:5,g:7,a:9,b:11};
export function harmonicSig(e){
  const tonic=((LET[e.key[0]]+(e.key[1]==='f'?-1:e.key[1]==='s'?1:0))%12+12)%12;
  const barU=barUof(e); const bars=Math.round((e.lh.reduce((s,n)=>s+n.d,0))/barU);
  const degAt=t=>{ let a=0,cur=null; for(const n of e.lh){ if(a<=t+1e-9) cur=n; else break; a+=n.d; }
    if(!cur||cur.rest) return '-'; const pc=(((Array.isArray(cur.m)?Math.min(...cur.m):cur.m)%12)+12)%12;
    return (((pc-tonic)%12+12)%12); };
  const seq=[]; for(let b=0;b<bars;b++) seq.push(degAt(b*barU));
  return seq.join('-');
}
// Cadence type from the bass roots: the final two bars, and the bar-4 mid-point.
export function cadenceType(e){
  const sig=harmonicSig(e).split('-'); const n=sig.length;
  const last=sig[n-1], pen=sig[n-2], mid=sig[Math.floor(n/2)-1];
  let end='other';
  if(last==='0'){ end = pen==='7'?'perfect(V-I)' : pen==='5'?'plagal(IV-I)' : pen==='2'?'ii-I' : 'to-I'; }
  else if(last==='9'&&pen==='7') end='deceptive(V-vi)';
  const half = mid==='7'?'half(V)' : mid==='5'?'IV' : mid==='0'?'I' : mid;
  return { end, mid:half };
}
export function batchPreflight(list){
  const rows=list.map((e,i)=>({i, ...preflight(e), sig:textureSig(e), harm:harmonicSig(e)}));
  const tsig={}, hsig={};
  rows.forEach(r=>{ (tsig[r.sig]=tsig[r.sig]||[]).push(r.i+1); (hsig[r.harm]=hsig[r.harm]||[]).push(r.i+1); });
  const textureDupes=Object.entries(tsig).filter(([,v])=>v.length>1).map(([s,v])=>'#'+v.join('/#')+' same LH type '+s);
  const harmonyDupes=Object.entries(hsig).filter(([,v])=>v.length>1).map(([s,v])=>'#'+v.join('/#')+' same bass progression ['+s+']');
  return { rows, textureDupes, harmonyDupes };
}
