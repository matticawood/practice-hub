// Typeset a grade's banked exercises into a print-quality PDF.
//   node export-book.mjs 2      ->  book-grade2.pdf
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toLily, validate } from './engine.mjs';

const DIR=dirname(fileURLToPath(import.meta.url));
const grade=+process.argv[2]||2;
const file=join(DIR,'bank',`grade${grade}.json`);
if(!existsSync(file)){ console.error('no bank for grade',grade); process.exit(1); }
const bank=JSON.parse(readFileSync(file,'utf8'));
if(!bank.length){ console.error('bank is empty'); process.exit(1); }

const bad=bank.map((e,i)=>({i,v:validate(e)})).filter(x=>!x.v.ok);
if(bad.length) console.warn(`WARNING: ${bad.length} banked exercise(s) no longer validate:`, bad.map(b=>b.i+1).join(', '));

const scores=bank.map((e,i)=>toLily({...e,n:i+1}));
const TITLE={2:'Grade 2',3:'Grade 3',4:'Grade 4'}[grade];
const doc=`\\version "2.24.0"
\\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 175\\mm
  top-margin = 16\\mm bottom-margin = 16\\mm left-margin = 18\\mm
  score-markup-spacing.basic-distance = #15 markup-system-spacing.basic-distance = #13
  print-page-number = ##t }
#(set-global-staff-size 17)
\\markup \\fill-line { \\column { \\vspace #1 \\center-column { \\fontsize #6 \\bold "Sight Reading" \\fontsize #3 "${TITLE}" } \\vspace #2 } }
${scores.join('\n\\markup \\vspace #1.4\n')}
`;
const ly=join(DIR,`book-grade${grade}.ly`);
writeFileSync(ly,doc);
execFile('lilypond',['-o',join(DIR,`book-grade${grade}`),ly],(err,so,se)=>{
  if(err){ console.error(se||err); process.exit(1); }
  console.log(`wrote book-grade${grade}.pdf  (${bank.length} exercises)`);
});
