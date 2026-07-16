import { readFileSync, writeFileSync } from "node:fs";
const d = JSON.parse(readFileSync(new URL("./l3-0-fixed.json", import.meta.url), "utf8"));
// Redundant blocks to remove (original indices in l3-0-fixed.json)
const REMOVE = new Set([23,24,25,33,48,49,50,51,52,57,92,93,100,101,166,167,168,169,170,171,172]);
const before = d.blocks.length;
d.blocks = d.blocks.filter((_, i) => !REMOVE.has(i));
writeFileSync(new URL("./l3-0-condensed.json", import.meta.url), JSON.stringify(d, null, 1));
const words = JSON.stringify(d.blocks.map(b=>({...b,abc:undefined}))).replace(/<[^>]+>/g," ").split(/\s+/).length;
console.log("blocks:", before, "->", d.blocks.length, "| approx words:", words);
