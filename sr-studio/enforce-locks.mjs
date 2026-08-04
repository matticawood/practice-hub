// Run after any bank edit:  node enforce-locks.mjs [grade]
// Restores every green (reviewed) piece from its snapshot, snapshots any newly-green piece.
import { readFileSync, writeFileSync } from 'node:fs';
import { enforceLocks } from './lock.mjs';
const g = +process.argv[2] || 4;
const path = new URL(`./bank/grade${g}.json`, import.meta.url);
const bank = JSON.parse(readFileSync(path,'utf8'));
const r = enforceLocks(g, bank);
writeFileSync(path, JSON.stringify(bank,null,1));
console.log(`grade ${g}: ${r.snapped} newly locked, ${r.restored} restored from lock`);
