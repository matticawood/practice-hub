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

console.log("\n--- backing out of an activity you never started leaves nothing behind ---");
{
  // The real block lifted out of _wizGoTo, so the index maths is tested as
  // written. Items are {id, blank}; the stub reports blankness from the item.
  const src = html.slice(html.indexOf("  // An item is created up front"), html.indexOf("  const getEl = s =>"));
  const run = (items, screen, curIdx, toScreen, toIdx) => {
    let formItems = items.map(i => ({ ...i }));
    const discarded = [];
    const fn = new Function("state", `
      let formItems = state.formItems, _wizScreen = state.screen, _wizItemIdx = state.curIdx;
      let newScreen = state.toScreen, newItemIdx = state.toIdx;
      const _wizItemIsBlank = fi => !!(fi && fi.blank);
      const _wizDiscardItem = id => { state.discarded.push(id);
        formItems = formItems.filter(i => i.id !== id); };
      ${src}
      return { newScreen, newItemIdx, ids: formItems.map(i => i.id) };`);
    return fn({ formItems, screen, curIdx, toScreen, toIdx, discarded });
  };
  const A = { id: 10, blank: false }, B = { id: 11, blank: false };
  const blank = id => ({ id, blank: true });

  let r = run([A, blank(11)], "item", 1, "date", 0);
  eq("back to the date screen drops it", JSON.stringify(r.ids), JSON.stringify([10]));

  r = run([A, blank(11)], "item", 1, "item", 0);
  eq("back to the previous activity drops it", JSON.stringify(r.ids), JSON.stringify([10]));
  eq("and lands on that activity", r.newItemIdx, 0);

  r = run([blank(9), A, B], "item", 0, "item", 2);
  eq("jumping forward past it drops it", JSON.stringify(r.ids), JSON.stringify([10, 11]));
  // Four items, so the answer is not the same as simply clamping to the end.
  r = run([blank(9), A, B, { id: 12 }], "item", 0, "item", 2);
  eq("target index follows the shift", r.newItemIdx, 1);
  eq("landing on the activity you asked for", r.ids[r.newItemIdx], 11);

  r = run([blank(10)], "item", 0, "item", 0);
  eq("staying on the same activity keeps it", JSON.stringify(r.ids), JSON.stringify([10]));

  r = run([blank(10)], "item", 0, "date", 0);
  eq("the only activity, dropped", JSON.stringify(r.ids), JSON.stringify([]));

  r = run([blank(10)], "item", 0, "item", 0 + 0);
  eq("same-item navigation is not a departure", r.newScreen, "item");

  r = run([A, blank(11)], "item", 1, "overview", 0);
  eq("going to review drops it", JSON.stringify(r.ids), JSON.stringify([10]));

  r = run([A, B], "item", 1, "date", 0);
  eq("a started activity is never dropped", JSON.stringify(r.ids), JSON.stringify([10, 11]));

  r = run([blank(10), blank(11)], "item", 0, "item", 1);
  eq("only the one you are leaving is dropped", JSON.stringify(r.ids), JSON.stringify([11]));
  eq("and it becomes the only index", r.newItemIdx, 0);

  r = run([blank(10)], "date", 0, "item", 0);
  eq("arriving from elsewhere drops nothing", JSON.stringify(r.ids), JSON.stringify([10]));
}

console.log("\n--- the discard does not navigate ---");
{
  const body = grab("_wizDiscardItem");
  eq("no _wizGoTo inside it", /_wizGoTo\s*\(/.test(body), false);
  eq("takes live minutes back off the total", /_liveForgetItem/.test(body), true);
  eq("frees the slot first", /_wizReturnSlotToStore/.test(body), true);
}

console.log("\n--- adding an item always opens the one you just added ---");
{
  // wizAddFirstItem appended at the end but navigated to index 0, so adding
  // from the date screen with items already there dropped you on the first one.
  const open = grab("wizAddItemAndOpen");
  eq("the shared one opens the last item", /_wizGoTo\('item', formItems\.length - 1, 'forward'\)/.test(open), true);
  for (const fn of ["wizAddFirstItem", "wizAddItemFromOverview"]) {
    const body = grab(fn);
    eq(fn + " delegates", /wizAddItemAndOpen\s*\(/.test(body), true);
    eq(fn + " navigates nowhere itself", /_wizGoTo\s*\(/.test(body), false);
  }
  const another = grab("wizAddAnotherItem");
  eq("wizAddAnotherItem delegates too", /wizAddItemAndOpen/.test(another), true);
  eq("nothing still hardcodes item 0 when adding",
     !/addItem\(\);\s*\n?\s*_wizGoTo\('item', 0/.test(html), true);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
