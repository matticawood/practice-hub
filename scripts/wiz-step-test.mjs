// Drives the real _wizItemIsBlank and _wizDotBlocked bodies out of
// practice-log.html against a stub DOM, so the two-step routing is tested as
// written. An item shows the activity squares only while it is untouched.
import fs from "fs";
const html = fs.readFileSync("practice-log.html", "utf8");
const grab = name => {
  const i = html.indexOf(`function ${name}(`);
  if (i < 0) throw new Error("not found: " + name);
  let d = 0;
  for (let k = html.indexOf("{", i); k < html.length; k++) {
    if (html[k] === "{") d++;
    else if (html[k] === "}" && --d === 0) return html.slice(i, k + 1);
  }
  throw new Error("unbalanced: " + name);
};

// Minimal stand-ins for the bits of an item block the function actually reads.
const mkBlock = ({ dur = "", fields = [] } = {}) => {
  const durEl = { value: dur, classList: { contains: c => c === "item-duration-input" } };
  const others = fields.map(v => ({ value: v, classList: { contains: () => false } }));
  return {
    querySelector: sel => (sel === ".item-duration-input" ? durEl : null),
    querySelectorAll: () => [durEl, ...others],
  };
};
const run = (fi, block) => new Function("document", grab("_wizItemIsBlank") + "; return _wizItemIsBlank(arguments[1]);")
  ({ getElementById: () => block }, fi);

let pass = 0, fail = 0;
const eq = (l, got, want) => {
  const ok = got === want;
  ok ? pass++ : (fail++, console.log(`FAIL ${l}\n  got ${got} want ${want}`));
  if (ok) console.log("ok   " + l);
};

console.log("--- a brand new item goes to the squares ---");
eq("empty block is blank", run({ id: 1 }, mkBlock()), true);
eq("no block at all is blank", run({ id: 1 }, null), true);
eq("no item at all is blank", run(null, mkBlock()), true);

console.log("\n--- anything you have entered sends you to the detail ---");
eq("a duration counts", run({ id: 1 }, mkBlock({ dur: "20" })), false);
eq("a zero duration does not", run({ id: 1 }, mkBlock({ dur: "0" })), true);
eq("typed text counts", run({ id: 1 }, mkBlock({ fields: ["Chopin"] })), false);
eq("whitespace does not", run({ id: 1 }, mkBlock({ fields: ["   "] })), true);
eq("a chosen piece counts", run({ id: 1, selectedPiece: { title: "Nocturne" } }, mkBlock()), false);
eq("an empty piece object does not", run({ id: 1, selectedPiece: {} }, mkBlock()), true);
eq("a technique counts", run({ id: 1, selectedTechniques: [{ name: "scales" }] }, mkBlock()), false);
eq("a theory sheet counts", run({ id: 1, selectedTheorySheets: [{ id: 3 }] }, mkBlock()), false);
eq("empty arrays do not", run({ id: 1, selectedTechniques: [], selectedTheorySheets: [] }, mkBlock()), true);

console.log("\n--- restoring a draft or editing opens on the detail ---");
// Both build their blocks with the saved values already in them.
eq("a restored item is not blank", run({ id: 9, selectedPiece: { title: "Fur Elise" } }, mkBlock({ dur: "30" })), false);

console.log("\n--- the dots hold you to the same standard as the buttons ---");
const body = grab("_wizDotBlocked");
eq("blank items are not blocked", /_wizItemIsBlank\([^)]*\)\)\s*return false/.test(body), true);
eq("started items are validated", /_wizValidateCurrentItem\s*\(/.test(body), true);
eq("only on the item screen", /_wizScreen\s*!==\s*'item'/.test(body), true);
const dots = html.slice(html.indexOf('document.getElementById("wiz-dots").addEventListener'));
const handler = dots.slice(0, dots.indexOf("\n});"));
eq("guards the jump to another item", /idx !== _wizItemIdx && _wizDotBlocked\(\)/.test(handler), true);
eq("guards the jump to review", /if \(_wizDotBlocked\(\)\) return;/.test(handler), true);

console.log("\n--- the routing reads the item, not a stored flag ---");
eq("no typeChosen flag survives", !/typeChosen/.test(html), true);
eq("_wizGoTo derives it", /_wizNeedsType = _wizItemIsBlank\(formItems\[newItemIdx\]\)/.test(html), true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
