// GREEN = IMMUTABLE. A piece marked reviewed (green) is snapshotted, and on every bank save its snapshot is
// restored over whatever is being written — so nothing (the studio, a regeneration, a stray edit) can alter a
// green piece's notes, fingering, or dynamics. To change a green piece you must un-green it first (which releases
// the lock). Snapshots are keyed by slot index; deletes reindex them.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const LOCKDIR = join(DIR, 'bank', '.locked');
const lf = g => join(LOCKDIR, `grade${g}.json`);
const clone = x => JSON.parse(JSON.stringify(x));

export const loadLocked = g => existsSync(lf(g)) ? JSON.parse(readFileSync(lf(g),'utf8')) : {};
export const saveLocked = (g,o) => { if(!existsSync(LOCKDIR)) mkdirSync(LOCKDIR,{recursive:true}); writeFileSync(lf(g), JSON.stringify(o,null,1)); };

// Restore every green piece from its snapshot (immutable), snapshot a newly-green one, release an un-greened one.
// Mutates `bank` in place. Returns counts for logging.
export function enforceLocks(g, bank){
  const locked = loadLocked(g); let restored=0, snapped=0;
  for(let i=0;i<bank.length;i++){ const ex=bank[i]; if(!ex) continue;
    if(ex.reviewed){
      if(locked[i]!==undefined){ bank[i]=clone(locked[i]); restored++; }   // green -> force back to the locked copy
      else { locked[i]=clone(ex); snapped++; }                             // first time green -> snapshot it
    } else if(locked[i]!==undefined){ delete locked[i]; }                  // un-greened -> release the lock
  }
  saveLocked(g, locked);
  return { restored, snapped };
}

// After a slot is deleted, shift snapshots so they keep tracking the right pieces.
export function reindexAfterDelete(g, delIdx){
  const locked = loadLocked(g); const out={};
  for(const k of Object.keys(locked)){ const i=+k; if(i<delIdx) out[i]=locked[k]; else if(i>delIdx) out[i-1]=locked[k]; }
  saveLocked(g, out);
}
