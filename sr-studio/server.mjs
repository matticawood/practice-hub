// Sight Reading Studio — local server. Run:  node server.mjs   then open http://localhost:7700
import http from 'node:http';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, createReadStream } from 'node:fs';
import { execFile } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateCompose } from './compose-adapter.mjs';   // the composer-model machine (harmony-first plan → melody → counter-line bass); replaces the old generator.mjs
import { validate, toLily, lilyDoc, lilyWithMap, fingerHand, resolveFingering, serializeHand, parseHand } from './engine.mjs';
import { enforceLocks, reindexAfterDelete } from './lock.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const BANK = join(DIR,'bank');
if(!existsSync(BANK)) mkdirSync(BANK,{recursive:true});
const bankFile = g => join(BANK,`grade${g}.json`);
const loadBank = g => existsSync(bankFile(g))? JSON.parse(readFileSync(bankFile(g),'utf8')) : [];
const saveBank = (g,a) => { enforceLocks(g,a); writeFileSync(bankFile(g), JSON.stringify(a,null,1)); };  // green pieces are restored from their snapshot before every write

const barUnitsOf = t => { const [a,b]=t.split('/').map(Number); return (a/b)*4; };

// Rewrite each LilyPond point-and-click <a href="textedit://..:line:c0:c1"> into a data-tagged <g> that ties the
// glyph back to the exact data note (hand/index/member), and STRIP the file path so no local path leaks to the UI.
function tagSvg(svg, notemap){
  const find=(line,c0)=>notemap.find(e=>e.line===line && c0>=e.c0 && c0<e.c1);
  svg = svg.replace(/<a\b[^>]*xlink:href="textedit:[^"]*?:(\d+):(\d+):(\d+)"[^>]*>/g,(m,L,C0)=>{
    const e=find(+L,+C0); if(!e) return '<g>';
    let member='';
    if(e.members){ const mm=e.members.find(x=>+C0>=x.c0 && +C0<x.c1) || e.members.reduce((a,b)=>Math.abs(b.c0-+C0)<Math.abs(a.c0-+C0)?b:a); if(mm) member=` data-member="${mm.member}"`; }
    const hand = e.kind==='dyn' ? e.dynHand : e.hand;
    return `<g class="ntgt" data-hand="${hand}" data-index="${e.index}" data-kind="${e.kind}"${member}${e.kind==='dyn'?' data-dyn="1"':''}>`;
  });
  svg = svg.replace(/<a\b[^>]*>/g,'<g>').replace(/<\/a>/g,'</g>');   // neutralise any stragglers
  return svg;
}
function render(ex){               // ex -> { svg, notemap, validation }
  return new Promise(res=>{
    const v=validate(ex);
    const id='sr'+Math.random().toString(36).slice(2,9);
    const ly=join(tmpdir(),id+'.ly'), svg=join(tmpdir(),id+'.svg'), cropped=join(tmpdir(),id+'.cropped.svg');
    let notemap=[]; try{ const r=lilyWithMap({...ex,n:ex.n||''},20); writeFileSync(ly, r.ly); notemap=r.notemap; }
    catch(e){ writeFileSync(ly, lilyDoc(toLily({...ex,n:ex.n||''}),20)); }
    execFile('lilypond',['-dcrop','--svg','-o',join(tmpdir(),id),ly],(err)=>{   // point-and-click ON (default) so noteheads carry source cols
      let s=''; try{ s=readFileSync(cropped,'utf8'); }catch{ try{ s=readFileSync(svg,'utf8'); }catch{ s='<p style="color:#b00">render error</p>'; } }
      if(s && notemap.length) s=tagSvg(s, notemap);
      res({ svg:s, notemap, validation:{ok:v.ok,errors:v.errors,warnings:v.warnings,rhF:v.rhF,lhF:v.lhF} });
    });
  });
}

// ---- direct note editing (click-to-edit) ----
const _LET={c:0,d:2,e:4,f:5,g:7,a:9,b:11};
const tonicPc = ex => ((_LET[ex.key[0]] + (ex.key[1]==='f'?-1:ex.key[1]==='s'?1:0))%12+12)%12;
const scaleOf = ex => (ex.mode==='min'?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11]).map(x=>(tonicPc(ex)+x)%12);
const inScale = (m,sc)=>sc.includes(((m%12)+12)%12);
const snapDir = (m,sc,dir)=>{ for(let k=1;k<=12;k++){ const q=m+dir*k; if(inScale(q,sc)) return q; } return m+dir; };
// If a hand is drawn from the solver's sparse fingering, bake those printed fingers onto the notes BEFORE the first
// manual edit — so adding one finger doesn't make every other (solver) finger vanish. WYSIWYG editing.
function bakeFingering(ex, hn){ const hand=ex[hn]; if(hand.some(n=>n.fing!=null)) return;
  const res=resolveFingering(ex)[hn];                          // freeze EXACTLY what's shown: chords as per-member arrays
  hand.forEach((n,i)=>{ const rf=res[i]; if(rf!=null) n.fing = Array.isArray(rf)? rf.slice() : rf; }); }
function applyPatch(ex, P){
  const hand=ex[P.hand]; if(!hand) return; const n=hand[P.index]; if(!n && P.op!=='insertAfter') return;
  const sc=scaleOf(ex);
  const mapM=fn=>{ if(Array.isArray(n.m)){ n.m = (P.member!=null? n.m.map((m,j)=>j===P.member?fn(m):m) : n.m.map(fn)); }
    else if(n.m!=null) n.m=fn(n.m); };
  switch(P.op){
    case 'transpose':{ const s=P.semitones||0;
      if(P.snap) mapM(m=>snapDir(m,sc,s>0?1:-1));
      else { mapM(m=>m+s);
        if(Math.abs(s)===1){ const alt = s>0?'#':'b';   // accidental spelling follows the chromatic direction
          if(Array.isArray(n.m) && P.member!=null){      // a chord member: spell ONLY that note, leave the others
            const arr = Array.isArray(n.alt) ? n.alt.slice() : n.m.map(()=>null); arr[P.member]=alt; n.alt=arr;
          } else n.alt=alt; } }
      break; }
    case 'setPitch':{ if(n.rest) break; const tgt=P.midi;   // exact pitch from a drag (already snapped client-side)
      if(Array.isArray(n.m)){ if(P.member!=null){ n.m=n.m.map((m,j)=>j===P.member?tgt:m);
          if(Array.isArray(n.alt)){ n.alt[P.member]=null; if(n.alt.every(x=>x==null)) delete n.alt; } else delete n.alt; } }
      else { n.m=tgt; delete n.alt; } break; }
    case 'setDur': n.d=P.d; break;
    case 'toggleRest':
      if(n.rest){ n.rest=false; n.m = n._m ?? (()=>{ const prev=hand.slice(0,P.index).reverse().find(x=>!x.rest); return prev? (Array.isArray(prev.m)?prev.m[0]:prev.m) : (60+tonicPc(ex)); })(); delete n._m; }
      else { n._m=n.m; n.rest=true; delete n.m; delete n.fing; delete n.art; delete n.slur; }
      break;
    case 'setArtic': if(P.art) n.art=P.art; else delete n.art; break;
    case 'setSlur': if(P.slur) n.slur=P.slur; else delete n.slur; break;
    case 'setFing':{ bakeFingering(ex,P.hand);
      if(Array.isArray(n.m)){
        // seed the per-member array from what's ACTUALLY SHOWN (so changing one note never shifts the other)
        let arr;
        if(Array.isArray(n.fing)) arr=n.fing.slice();
        else { const rf=resolveFingering(ex)[P.hand][P.index]; arr = Array.isArray(rf)? rf.slice() : n.m.map(()=> rf!=null?rf:null); }
        arr[P.member??0]=P.fing; if(arr.every(x=>x==null)) delete n.fing; else n.fing=arr;
      } else { if(P.fing==null) delete n.fing; else n.fing=P.fing; }
      break; }
    case 'setDyn': if(P.dyn) n.dyn=P.dyn; else delete n.dyn; break;
    case 'setHairpin': if(P.hp) n.hp=P.hp; else delete n.hp; break;
    case 'delete':
      if(Array.isArray(n.m) && P.member!=null && n.m.length>1){    // a chord member -> drop just that note, keep the duration
        const keep=(_,j)=>j!==P.member;
        if(Array.isArray(n.fing)) n.fing=n.fing.filter(keep);
        if(Array.isArray(n.alt)) n.alt=n.alt.filter(keep);
        n.m=n.m.filter(keep);
        if(n.m.length===1){ n.m=n.m[0];
          if(Array.isArray(n.fing)){ const f=n.fing.find(x=>x!=null); if(f!=null) n.fing=f; else delete n.fing; }
          if(Array.isArray(n.alt)){ const a=n.alt.find(x=>x!=null); if(a!=null) n.alt=a; else delete n.alt; } }
        else { if(Array.isArray(n.fing) && n.fing.every(x=>x==null)) delete n.fing;
               if(Array.isArray(n.alt) && n.alt.every(x=>x==null)) delete n.alt; }
      } else if(hand.length>1){ hand.splice(P.index,1); }          // a single note -> remove the event
      break;
    case 'insertAfter':{ const src=hand[P.index]; const nn = (src&&!src.rest)? {m:(Array.isArray(src.m)?src.m[0]:src.m), d:0.5} : {rest:true, d:0.5}; hand.splice(P.index+1,0,nn); break; }
    case 'chordAdd':{ if(n.rest) break;                         // stack a note onto this event -> a chord
      const oldArr = Array.isArray(n.m)? n.m.slice() : [n.m];
      const oldFing = Array.isArray(n.fing)? n.fing.slice() : (n.fing!=null? oldArr.map(()=>n.fing) : null);
      const oldAlt = Array.isArray(n.alt)? n.alt.slice() : (n.alt!=null? oldArr.map(()=>n.alt) : null);
      let step;                                                  // default = a diatonic third above the top note
      if(P.midi!=null) step=P.midi;
      else { const top=Math.max(...oldArr); step=snapDir(snapDir(top,sc,1),sc,1); }
      if(oldArr.includes(step)) break;                           // already present
      const paired = oldArr.map((m,i)=>({m, f: oldFing?oldFing[i]:undefined, a: oldAlt?oldAlt[i]:null}));
      paired.push({m:step, f:null, a:null});
      paired.sort((a,b)=>a.m-b.m);                               // keep noteheads low->high, fingering + accidental aligned
      n.m = paired.map(p=>p.m);
      if(oldFing) n.fing = paired.map(p=>p.f??null);
      if(oldAlt && paired.some(p=>p.a!=null)) n.alt = paired.map(p=>p.a??null); else delete n.alt;
      break; }
  }
}
function withText(ex){             // attach editable text + the RESOLVED fingering (what each note actually shows) for the UI
  const bu=barUnitsOf(ex.time);
  return {...ex, rhText:serializeHand(ex.rh,ex.flat,bu), lhText:serializeHand(ex.lh,ex.flat,bu), fingers:resolveFingering(ex)};
}
const body = req => new Promise(r=>{let d='';req.on('data',c=>d+=c);req.on('end',()=>r(d?JSON.parse(d):{}));});
const json = (res,o)=>{res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify(o));};

const server = http.createServer(async (req,res)=>{
  const u=new URL(req.url,'http://x'); const p=u.pathname;
  try{
    if(p==='/'){ res.writeHead(200,{'content-type':'text/html'}); return res.end(readFileSync(join(DIR,'index.html'))); }
    if(p==='/api/counts'){ return json(res,{2:loadBank(2).length,3:loadBank(3).length,4:loadBank(4).length}); }
    if(p==='/api/generate'){ const g=+u.searchParams.get('grade')||2; const existing=loadBank(g); const ex=generateCompose(g, {avoid: existing}); ex.n=existing.length+1;
      const r=await render(ex); return json(res,{ex:withText(ex),...r}); }
    if(p==='/api/render' && req.method==='POST'){ const d=await body(req);
      try{ const ex = d.rh ? {...d.meta, rh:d.rh, lh:d.lh} : {...d.meta, rh:parseHand(d.rhText), lh:parseHand(d.lhText)};
        const r=await render(ex); return json(res,{ex:withText(ex),...r}); }
      catch(e){ return json(res,{error:String(e.message||e)}); } }
    // Direct click-to-edit: apply one patch to the piece, re-render. If it's a bank slot, persist it (editing a
    // green/approved piece un-approves it so the change sticks; you re-approve when happy).
    if(p==='/api/edit' && req.method==='POST'){ const d=await body(req);
      try{ const ex={...d.ex, rh:d.ex.rh.map(o=>({...o})), lh:d.ex.lh.map(o=>({...o}))};
        applyPatch(ex, d.patch);
        let unlocked=false;
        if(d.i!=null && d.i!==''){ const g=ex.grade; const bank=loadBank(g); if(bank[+d.i]){
          const wasGreen=!!bank[+d.i].reviewed; if(wasGreen) unlocked=true;
          const clean={grade:g,key:ex.key,mode:ex.mode,flat:ex.flat,time:ex.time,tempo:ex.tempo,partial:ex.partial,rhFinger:ex.rhFinger,lhFinger:ex.lhFinger,rh:ex.rh,lh:ex.lh};
          clean.reviewed=false;                         // any edit un-approves (drops the lock so the edit persists)
          bank[+d.i]=clean; saveBank(g,bank); } }
        const r=await render(ex); return json(res,{ex:withText(ex),unlocked,...r}); }
      catch(e){ return json(res,{error:String(e.message||e)}); } }
    if(p==='/api/approve' && req.method==='POST'){ const d=await body(req); const ex=d.ex; const g=ex.grade;
      const v=validate(ex); if(!v.ok) return json(res,{error:'not clean: '+v.problems.join('; ')});
      const bank=loadBank(g); const clean={grade:g,key:ex.key,mode:ex.mode,flat:ex.flat,time:ex.time,tempo:ex.tempo,partial:ex.partial,rhFinger:ex.rhFinger,lhFinger:ex.lhFinger,rh:ex.rh,lh:ex.lh};
      bank.push(clean); saveBank(g,bank); return json(res,{count:bank.length}); }
    if(p==='/api/bank'){ const g=+u.searchParams.get('grade')||2; return json(res,{bank:loadBank(g).map((e,i)=>({i,key:e.key,mode:e.mode,time:e.time,tempo:e.tempo,revised:!!e.revised,reviewed:!!e.reviewed}))}); }
    if(p==='/api/delete' && req.method==='POST'){ const d=await body(req); const bank=loadBank(d.grade); bank.splice(d.i,1); reindexAfterDelete(d.grade,d.i); saveBank(d.grade,bank); return json(res,{count:bank.length}); }
    // Owner marks an exercise as reviewed/listened-to (separate from my `revised` flag).
    if(p==='/api/reviewed' && req.method==='POST'){ const d=await body(req); const bank=loadBank(d.grade); if(bank[d.i]) bank[d.i].reviewed=!!d.reviewed; saveBank(d.grade,bank); return json(res,{ok:true}); }
    if(p==='/api/view'){ const g=+u.searchParams.get('grade'), i=+u.searchParams.get('i'); const ex={...loadBank(g)[i],n:i+1};
      const r=await render(ex); return json(res,{ex:withText(ex),...r}); }

    // Standalone LilyPond snippet renderer used by the cards page below.
    if(p==='/api/snippet' && req.method==='POST'){
      const d = await body(req);
      const id = 'sn'+Math.random().toString(36).slice(2,9);
      const ly = join(tmpdir(), id+'.ly');
      const cropped = join(tmpdir(), id+'.cropped.svg');
      const plain = join(tmpdir(), id+'.svg');
      writeFileSync(ly, String(d.lilypond || ''));
      await new Promise(done => execFile('lilypond', ['-dcrop','--svg','-o',join(tmpdir(),id), ly], () => done()));
      let s = '';
      try { s = readFileSync(cropped, 'utf8'); }
      catch { try { s = readFileSync(plain, 'utf8'); } catch {} }
      res.writeHead(200, {
        'content-type':'image/svg+xml',
        'access-control-allow-origin':'*',
        'cache-control':'no-store',
      });
      return res.end(s);
    }

    // Native-ffmpeg encoder for the cards page. Streams PNG frames into a per-session temp
    // dir, then runs `ffmpeg` once when render is called. Much faster and more reliable than
    // ffmpeg.wasm; the user already has ffmpeg installed for sr-studio.
    if(p==='/api/encode/start' && req.method==='POST'){
      const session = 'enc'+Math.random().toString(36).slice(2,9);
      const dir = join(tmpdir(), session);
      mkdirSync(dir, { recursive: true });
      return json(res, { session });
    }
    if(p==='/api/encode/frame' && req.method==='POST'){
      const session = u.searchParams.get('session');
      const index = +u.searchParams.get('index');
      if(!session || Number.isNaN(index)){ res.writeHead(400); return res.end('bad request'); }
      const dir = join(tmpdir(), session);
      if(!existsSync(dir)){ res.writeHead(404); return res.end('no session'); }
      const chunks = [];
      req.on('data', c => chunks.push(c));
      await new Promise(done => req.on('end', done));
      writeFileSync(join(dir, `f_${String(index).padStart(6,'0')}.png`), Buffer.concat(chunks));
      res.writeHead(200, { 'access-control-allow-origin':'*' });
      return res.end('ok');
    }
    if(p==='/api/encode/render' && req.method==='POST'){
      const session = u.searchParams.get('session');
      const fps = +u.searchParams.get('fps') || 25;
      const dir = join(tmpdir(), session);
      if(!existsSync(dir)){ res.writeHead(404); return res.end('no session'); }
      const output = join(dir, 'out.mov');
      try {
        await new Promise((done, fail) => {
          execFile('ffmpeg', [
            '-y',
            '-framerate', String(fps),
            '-i', join(dir, 'f_%06d.png'),
            '-c:v', 'prores_ks',
            '-profile:v', '4',
            '-pix_fmt', 'yuva444p10le',
            '-vendor', 'apl0',
            output,
          ], (err, stdout, stderr) => {
            if(err){ console.error('ffmpeg', String(stderr||'').slice(0, 1000)); fail(err); return; }
            done();
          });
        });
      } catch(e) {
        execFile('rm', ['-rf', dir], () => {});   // don't leave ~6 GB of orphaned PNG frames behind on a failed encode
        res.writeHead(500); return res.end('ffmpeg failed: '+e.message);
      }
      // Stream the file rather than readFileSync — a 4K ProRes card can exceed
      // 2 GiB, which is past Node's single-Buffer limit (ERR_FS_FILE_TOO_LARGE).
      const { size } = statSync(output);
      res.writeHead(200, {
        'content-type':'video/quicktime',
        'access-control-allow-origin':'*',
        'content-length': size,
      });
      const stream = createReadStream(output);
      stream.pipe(res);
      stream.on('close', () => execFile('rm', ['-rf', dir], () => {}));
      stream.on('error', () => { try { res.destroy(); } catch {} });
      return;
    }

    // /cards → the new player. /cards/* → static files under Piano Practice Daily/cards/
    // Same origin as the API, so fetch calls (manifest, fragments, snippet) don't hit CORS.
    if(p==='/cards' || p==='/cards/' || p==='/cards.html'){
      const playerPath = '/Users/matthewcawood/Piano Practice Daily/cards/player.html';
      try {
        const html = readFileSync(playerPath);
        res.writeHead(200, { 'content-type':'text/html; charset=utf-8', 'cache-control':'no-store' });
        return res.end(html);
      } catch {
        res.writeHead(404); return res.end('player.html not found');
      }
    }
    if(p.startsWith('/cards/') && !p.includes('..')){
      const relPath = p.slice('/cards/'.length);
      const filePath = join('/Users/matthewcawood/Piano Practice Daily/cards', relPath);
      const ext = filePath.slice(filePath.lastIndexOf('.') + 1).toLowerCase();
      const mime = ({
        html:'text/html; charset=utf-8',
        json:'application/json; charset=utf-8',
        css:'text/css; charset=utf-8',
        js:'application/javascript; charset=utf-8',
        svg:'image/svg+xml',
        png:'image/png',
        jpg:'image/jpeg',
        jpeg:'image/jpeg',
        txt:'text/plain; charset=utf-8',
      })[ext] || 'application/octet-stream';
      try {
        const body = readFileSync(filePath);
        res.writeHead(200, { 'content-type': mime, 'cache-control':'no-store' });
        return res.end(body);
      } catch {
        res.writeHead(404); return res.end('not found: ' + relPath);
      }
    }

    res.writeHead(404); res.end('not found');
  }catch(e){ res.writeHead(500); res.end(String(e.stack||e)); }
});
const PORT=process.env.PORT||7700;
server.listen(PORT,()=>console.log(`Sight Reading Studio -> http://localhost:${PORT}`));
