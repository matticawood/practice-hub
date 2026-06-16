// Sight Reading Studio — shared engine: note model, validator, LilyPond emit.
// An EXERCISE: { grade, key, mode:'maj'|'min', flat:bool, time, tempo, partial?, rh:[note], lh:[note] }
// A NOTE: { m:int|int[], d:float(quarter-beats), fing?, dyn?, hp?('\\<'|'\\>'|'\\!'|'\\!\\>'), slur?('('|')'), art?('-.'|'--'|'->'), rest?:true }

export const POS = { maj:[0,2,4,5,7], min:[0,2,3,5,7] };

const PC_SHARP=['c','cis','d','dis','e','f','fis','g','gis','a','ais','b'];
const PC_FLAT =['c','des','d','ees','e','f','ges','g','aes','a','bes','b'];
const LETTER={C:0,D:2,E:4,F:5,G:7,A:9,B:11};

export function nameToMidi(s){            // "E4","F#4","Bb3" -> midi
  const m=/^([A-Ga-g])([#b]?)(-?\d)$/.exec(s.trim()); if(!m) return null;
  let v=LETTER[m[1].toUpperCase()]+(m[2]==='#'?1:m[2]==='b'?-1:0);
  return v+(+m[3]+1)*12;
}
export function midiToName(m,flat){        // midi -> "E4"
  const pc=((m%12)+12)%12, oct=Math.floor(m/12)-1;
  const tbl=flat?['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']:['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  return tbl[pc]+oct;
}
export function midiToLy(m,flat){
  const pc=((m%12)+12)%12, oct=Math.floor(m/12)-1, t=oct-3;
  return (flat?PC_FLAT:PC_SHARP)[pc]+(t>=0?"'".repeat(t):",".repeat(-t));
}
const durLy=d=>({4:'1',3:'2.',2:'2',1.5:'4.',1:'4',0.75:'8.',0.5:'8',0.25:'16'})[d]||String(d);

// ---- grade parameters ----
export const GRADES = {
  2:{ bars:{'4/4':4,'3/4':4,'2/4':6}, fixedPosition:true, maxSpan:7 },
  3:{ bars:{'4/4':8,'3/4':8,'2/4':8,'3/8':8}, fixedPosition:false, maxSpan:12 },
  4:{ bars:{'4/4':8,'3/4':8,'2/4':8,'6/8':8}, fixedPosition:false, maxSpan:14 },
};

// ---- validator ----
export function validate(ex){
  const g=GRADES[ex.grade]; const probs=[], warns=[];   // probs=hard errors (block), warns=stylistic (inform)
  const [top,bottom]=ex.time.split('/').map(Number);
  const barUnits=(top/bottom)*4;            // bar length in quarter-beats (4/4=4, 6/8=3, 3/8=1.5)
  const expBars=g.bars[ex.time];
  const tl=seq=>{let t=0,o=[];for(const n of seq){o.push({...n,t});t+=n.d;}return o;};
  const RH=tl(ex.rh), LH=tl(ex.lh);
  const lo=n=>Array.isArray(n.m)?Math.min(...n.m):n.m, hi=n=>Array.isArray(n.m)?Math.max(...n.m):n.m;
  const sound=(a,t)=>{let c=null;for(const n of a){if(n.t<=t+1e-9)c=n;else break;}return c;};
  const onsets=[...new Set([...RH,...LH].map(n=>n.t))].sort((a,b)=>a-b);
  const bb=t=>`b${Math.floor((t+ (ex.partial||0))/barUnits)+1}.${+(((t+(ex.partial||0))%barUnits)/(barUnits/top)+1).toFixed(2)}`;
  // bar count + bar fill
  const partial=ex.partial||0;
  const tot=RH.at(-1).t+RH.at(-1).d - partial;
  if(Math.round(tot/barUnits*100)/100!==expBars) probs.push(`length ${(tot/barUnits).toFixed(2)} bars, Grade ${ex.grade} ${ex.time} wants ${expBars}`);
  for(const [s,nm] of [[ex.rh,'RH'],[ex.lh,'LH']]){let a=0;s.forEach(n=>a+=n.d);if(Math.round((a-partial)/barUnits*100)/100!==expBars)probs.push(`${nm} total beats off`);}
  // rhythm must be readable: clean durations, and sub-beat notes may not cross a beat boundary
  const beatLen=(bottom===8 && top%3===0)?1.5:1;        // compound beat = dotted-crotchet
  const OKDUR=new Set([0.25,0.5,0.75,1,1.5,2,3,4,6]);
  for(const [seq,nm] of [[ex.rh,'RH'],[ex.lh,'LH']]){ let t=partial?barUnits-partial:0;
    for(const n of seq){ if(!OKDUR.has(n.d)) probs.push(`${nm}: unreadable note value (${n.d})`);
      const w=((t%barUnits)+barUnits)%barUnits, end=w+n.d;
      if(n.d<beatLen-1e-9 && Math.floor(w/beatLen+1e-9)!==Math.floor((end-1e-9)/beatLen))
        probs.push(`${nm}: rhythm crosses a beat (note ${n.d} starting ${w.toFixed(2)} into the bar)`);
      t+=n.d; }
  }
  // range / fingering
  function fingerOf(hand,tl,nm){
    const mins=tl.map(lo), maxs=tl.map(hi); const lowest=Math.min(...mins), highest=Math.max(...maxs);
    if(highest-lowest>g.maxSpan) probs.push(`${nm}: range ${highest-lowest} semis > ${g.maxSpan} (too wide for the grade)`);
    const first=tl[0]; const fnote=hand==='rh'?lo(first):lo(first);
    if(g.fixedPosition){
      // strict five-finger: anchor finger on the lowest note; finger from scale-step
      if(hand==='lh' && lo(first)!==lowest) probs.push(`LH: marked finger note is not the lowest (finger 5 cannot reach below it)`);
      if(hand==='rh' && lo(first)!==lowest && false){} // RH first need not be lowest
      const pos=POS[ex.mode], idx=pos.indexOf(fnote-lowest);
      if(idx<0){ probs.push(`${nm}: opening note off the five-finger position`); return 3; }
      return hand==='rh'?idx+1:5-idx;
    } else {
      // grade 3/4: only a plausible STARTING finger (passage may shift)
      const span=fnote-lowest;
      if(hand==='rh') return Math.min(5,Math.max(1,Math.round(span/2)+1));
      return Math.min(5,Math.max(1,5-Math.round((fnote-lowest)/2)));
    }
  }
  const rhF=fingerOf('rh',RH,'RH'), lhF=fingerOf('lh',LH,'LH');
  // parallels + clashes (outer voices: RH top vs LH bottom)
  let p=null;
  for(const t of onsets){ const rn=sound(RH,t), ln=sound(LH,t); if(!rn||!ln||rn.rest||ln.rest){p=null;continue;}
    const a=hi(rn), b=lo(ln), s=((a-b)%12+12)%12;
    if(p){const mv=(a!==p.a)&&(b!==p.b), sd=Math.sign(a-p.a)===Math.sign(b-p.b);
      if(mv&&sd&&s===p.s&&(s===7||s===0)) warns.push(`parallel ${s===7?'5th':'8ve'} ${bb(p.t)}->${bb(t)} (stylistic, not an ABRSM rule)`);}
    if(s===1||s===2||s===11) warns.push(`clash (${['','m2','M2/9th','','','','','','','','','M7'][s]}) at ${bb(t)}`);
    p={t,a,b,s};
  }
  // articulation must match between hands when they share a beat AND a duration
  const rmap=new Map(RH.map(n=>[n.t,n])), lmap=new Map(LH.map(n=>[n.t,n]));
  for(const t of onsets){ const r=rmap.get(t), l=lmap.get(t); if(r&&l&&r.d===l.d){
    const ra=r.art||'', la=l.art||''; if(ra!==la && (ra==='-.'||la==='-.')) warns.push(`articulation mismatch at ${bb(t)} (staccato on one hand only)`); } }
  // staccato only on short notes (hard: contradictory notation)
  for(const [s,nm] of [[ex.rh,'RH'],[ex.lh,'LH']]) s.forEach((n,i)=>{ if(n.art==='-.'&&n.d>1) probs.push(`${nm} note ${i+1}: staccato on a long note`); });
  if(![...ex.rh,...ex.lh].some(n=>n.dyn)) warns.push('no dynamic marking');
  // melody should genuinely move (not hover on two notes) — stylistic
  const rhP=ex.rh.filter(n=>!n.rest).map(n=>Array.isArray(n.m)?n.m[0]:n.m);
  const distinct=new Set(rhP).size, mrange=Math.max(...rhP)-Math.min(...rhP);
  if(distinct<4) warns.push(`melody static (${distinct} distinct pitches)`);
  if(mrange<5) warns.push(`melody range narrow (${mrange} semis < a 4th)`);
  const lhP=ex.lh.filter(n=>!n.rest).map(n=>Array.isArray(n.m)?n.m[0]:n.m);
  if(new Set(lhP).size<3) warns.push(`left hand static (${new Set(lhP).size} distinct pitches)`);
  return { ok:probs.length===0, errors:probs, warnings:warns, problems:[...probs,...warns], rhF, lhF };
}

// ---- LilyPond ----
export function toLily(ex, withNumber=true){
  const v=validate(ex);
  const mode=ex.mode==='maj'?'major':'minor';
  const key=ex.key.length>1 ? ex.key[0]+(ex.key[1]==='f'?'es':ex.key[1]==='s'?'is':ex.key[1]) : ex.key; // bf->bes, ef->ees
  const noteLy=n=>{
    if(n.rest) return 'r'+durLy(n.d);
    const pitch=Array.isArray(n.m)? '<'+n.m.map(x=>midiToLy(x,ex.flat)).join(' ')+'>' : midiToLy(n.m,ex.flat);
    return pitch+durLy(n.d);
  };
  const voice=(tl,fing)=>tl.map((n,i)=>{ let s=noteLy(n);
    if(i===0&&!n.rest) s+='-'+fing; if(n.art)s+=n.art; if(n.dyn)s+='\\'+n.dyn; if(n.hp)s+=n.hp; if(n.slur)s+=n.slur; return s; }).join(' ');
  const partial = ex.partial? `\\partial ${durLy(ex.partial)} ` : '';
  const name = withNumber? `\\set PianoStaff.instrumentName = \\markup \\bold \\large "${ex.n||''}"` : '';
  return `\\score {
  \\new PianoStaff <<
    ${name}
    \\new Staff { \\set fingeringOrientations = #'(up) \\tempo "${ex.tempo}" \\key ${key} \\${mode} \\time ${ex.time} ${partial}${voice(ex.rh,v.rhF)} \\bar "|." }
    \\new Staff { \\clef bass \\set fingeringOrientations = #'(down) \\override Fingering.direction = #DOWN \\override Fingering.staff-padding = #1.4 \\key ${key} \\${mode} \\time ${ex.time} ${partial}${voice(ex.lh,v.lhF)} \\bar "|." }
  >>
}`;
}

// ---- editable text format ----
// token: PITCH[:DUR][marks]   PITCH: E4 | F#4 | Bb3 | C4+E4 (chord) | R (rest)
// marks: . staccato  _ tenuto  ^ accent  ( slur-start  ) slur-end
//        < cresc-start  > dim-start  ! hairpin-end  !> end+dim  {mp} dynamic
export function serializeHand(notes, flat, barUnits){
  let out=[], t=0;
  for(const n of notes){
    let tok;
    if(n.rest) tok='R';
    else tok = Array.isArray(n.m)? n.m.map(x=>midiToName(x,flat)).join('+') : midiToName(n.m,flat);
    if(n.d!==1) tok+=':'+n.d;
    if(n.dyn) tok+='{'+n.dyn+'}';
    if(n.art) tok+=({'-.':'.', '--':'_', '->':'^'})[n.art]||'';
    if(n.hp) tok+=({'\\<':'<','\\>':'>','\\!':'!','\\!\\>':'!>'})[n.hp]||'';
    if(n.slur) tok+=n.slur;
    out.push(tok);
    t+=n.d; if(barUnits && Math.abs(t%barUnits)<1e-9) out.push('|');
  }
  return out.join(' ').replace(/\s*\|\s*$/,'');
}
export function parseHand(text){
  const toks=text.replace(/\|/g,' ').split(/\s+/).filter(Boolean), notes=[];
  for(const tok of toks){
    const n={};
    // pitch (read first so its digits/accidentals aren't mistaken for marks)
    const pm=/^(R|r|[A-Ga-g][#b]?-?\d(?:\+[A-Ga-g][#b]?-?\d)*)/.exec(tok);
    if(!pm) throw new Error('bad token: '+tok);
    const pitch=pm[1]; let rest=tok.slice(pm[0].length);
    // duration (consume the decimal so its '.' is not a staccato mark)
    let dur=1;
    if(rest[0]===':'){ const dm=/^:([0-9]*\.?[0-9]+)/.exec(rest); if(!dm) throw new Error('bad duration in: '+tok); dur=parseFloat(dm[1]); rest=rest.slice(dm[0].length); }
    n.d=dur;
    if(pitch==='R'||pitch==='r') n.rest=true;
    else { const ms=pitch.split('+').map(p=>nameToMidi(p)); if(ms.some(x=>x==null)) throw new Error('bad pitch: '+pitch); n.m=ms.length>1?ms:ms[0]; }
    // marks (what remains after pitch+duration)
    const dyn=/\{([a-z]+)\}/.exec(rest); if(dyn){ n.dyn=dyn[1]; rest=rest.replace(dyn[0],''); }
    if(rest.includes('!>')){ n.hp='\\!\\>'; }
    else if(rest.includes('!')) n.hp='\\!';
    else if(rest.includes('<')) n.hp='\\<';
    else if(rest.includes('>')) n.hp='\\>';
    if(rest.includes('.')) n.art='-.'; else if(rest.includes('_')) n.art='--'; else if(rest.includes('^')) n.art='->';
    if(rest.includes('(')) n.slur='('; else if(rest.includes(')')) n.slur=')';
    notes.push(n);
  }
  return notes;
}

export function lilyDoc(scores, staffSize=18){
  return `\\version "2.24.0"
\\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 180\\mm
  score-markup-spacing.basic-distance = #14 top-margin = 10\\mm }
#(set-global-staff-size ${staffSize})
${[].concat(scores).join('\n\\markup \\vspace #1.5\n')}
`;
}
