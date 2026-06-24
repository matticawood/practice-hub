// Sight Reading Studio — local server. Run:  node server.mjs   then open http://localhost:7700
import http from 'node:http';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate } from './generator.mjs';
import { validate, toLily, lilyDoc, serializeHand, parseHand } from './engine.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const BANK = join(DIR,'bank');
if(!existsSync(BANK)) mkdirSync(BANK,{recursive:true});
const bankFile = g => join(BANK,`grade${g}.json`);
const loadBank = g => existsSync(bankFile(g))? JSON.parse(readFileSync(bankFile(g),'utf8')) : [];
const saveBank = (g,a) => writeFileSync(bankFile(g), JSON.stringify(a,null,1));

const barUnitsOf = t => { const [a,b]=t.split('/').map(Number); return (a/b)*4; };

function render(ex){               // ex -> { svg, validation }
  return new Promise(res=>{
    const v=validate(ex);
    const id='sr'+Math.random().toString(36).slice(2,9);
    const ly=join(tmpdir(),id+'.ly'), svg=join(tmpdir(),id+'.svg'), cropped=join(tmpdir(),id+'.cropped.svg');
    writeFileSync(ly, lilyDoc(toLily({...ex,n:ex.n||''}),20));
    execFile('lilypond',['-dcrop','--svg','-dno-point-and-click','-o',join(tmpdir(),id),ly],(err)=>{
      let s=''; try{ s=readFileSync(cropped,'utf8'); }catch{ try{ s=readFileSync(svg,'utf8'); }catch{ s='<p style="color:#b00">render error</p>'; } }
      res({ svg:s, validation:{ok:v.ok,errors:v.errors,warnings:v.warnings,rhF:v.rhF,lhF:v.lhF} });
    });
  });
}
function withText(ex){             // attach editable text for the UI
  const bu=barUnitsOf(ex.time);
  return {...ex, rhText:serializeHand(ex.rh,ex.flat,bu), lhText:serializeHand(ex.lh,ex.flat,bu)};
}
const body = req => new Promise(r=>{let d='';req.on('data',c=>d+=c);req.on('end',()=>r(d?JSON.parse(d):{}));});
const json = (res,o)=>{res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify(o));};

const server = http.createServer(async (req,res)=>{
  const u=new URL(req.url,'http://x'); const p=u.pathname;
  try{
    if(p==='/'){ res.writeHead(200,{'content-type':'text/html'}); return res.end(readFileSync(join(DIR,'index.html'))); }
    if(p==='/api/counts'){ return json(res,{2:loadBank(2).length,3:loadBank(3).length,4:loadBank(4).length}); }
    if(p==='/api/generate'){ const g=+u.searchParams.get('grade')||2; const ex=generate(g); ex.n=loadBank(g).length+1;
      const r=await render(ex); return json(res,{ex:withText(ex),...r}); }
    if(p==='/api/render' && req.method==='POST'){ const d=await body(req);
      try{ const ex = d.rh ? {...d.meta, rh:d.rh, lh:d.lh} : {...d.meta, rh:parseHand(d.rhText), lh:parseHand(d.lhText)};
        const r=await render(ex); return json(res,{ex:withText(ex),...r}); }
      catch(e){ return json(res,{error:String(e.message||e)}); } }
    if(p==='/api/approve' && req.method==='POST'){ const d=await body(req); const ex=d.ex; const g=ex.grade;
      const v=validate(ex); if(!v.ok) return json(res,{error:'not clean: '+v.problems.join('; ')});
      const bank=loadBank(g); const clean={grade:g,key:ex.key,mode:ex.mode,flat:ex.flat,time:ex.time,tempo:ex.tempo,partial:ex.partial,rhFinger:ex.rhFinger,lhFinger:ex.lhFinger,rh:ex.rh,lh:ex.lh};
      bank.push(clean); saveBank(g,bank); return json(res,{count:bank.length}); }
    if(p==='/api/bank'){ const g=+u.searchParams.get('grade')||2; return json(res,{bank:loadBank(g).map((e,i)=>({i,key:e.key,mode:e.mode,time:e.time,tempo:e.tempo}))}); }
    if(p==='/api/delete' && req.method==='POST'){ const d=await body(req); const bank=loadBank(d.grade); bank.splice(d.i,1); saveBank(d.grade,bank); return json(res,{count:bank.length}); }
    if(p==='/api/view'){ const g=+u.searchParams.get('grade'), i=+u.searchParams.get('i'); const ex={...loadBank(g)[i],n:i+1};
      const r=await render(ex); return json(res,{ex:withText(ex),...r}); }
    res.writeHead(404); res.end('not found');
  }catch(e){ res.writeHead(500); res.end(String(e.stack||e)); }
});
const PORT=process.env.PORT||7700;
server.listen(PORT,()=>console.log(`Sight Reading Studio -> http://localhost:${PORT}`));
