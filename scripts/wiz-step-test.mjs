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

console.log("\n--- a live session is always logged to today ---");
{
  // Start sits on the date screen, so a date chosen on the way in would follow
  // the session in. Nothing in the live window shows a date to reveal it.
  const run = picked => {
    const dateEl = { value: picked };
    const toasts = [];
    new Function("document", "sessionTodayStr", "showToast", "viewingEmail", "myEmail",
      "formItems", "_liveOn", "_wizScreen", "_wizItemIdx", "_liveRenderBar", "_liveStartTick",
      "_livePersist", "wizAddFirstItem", "_wizRenderDateDisplay", "_wizGoTo", "_liveEnd",
      "editingSessionId",
      grab("wizStartLive") + "; wizStartLive();")
      ({ getElementById: () => dateEl }, () => "2026-08-20", (m) => toasts.push(m),
       "a@b.com", "a@b.com", [], false, "date", 0,
       () => {}, () => {}, () => {}, () => {}, () => {}, () => {}, () => {}, null);
    return { date: dateEl.value, toasts };
  };
  let r = run("2026-08-11");             // they had picked a day last week
  eq("a past date is moved to today", r.date, "2026-08-20");
  eq("and they are told", r.toasts.length, 1);
  eq("the message says so", /logged to today/.test(r.toasts[0] || ""), true);

  r = run("2026-08-20");                 // already today
  eq("today stays today", r.date, "2026-08-20");
  eq("with no needless message", r.toasts.length, 0);

  r = run("");                           // nothing set yet
  eq("an empty date is filled in", r.date, "2026-08-20");
  eq("silently, since nothing was overridden", r.toasts.length, 0);
}

console.log("\n--- the one button on the squares ---");
{
  const count = grab("_wizRealItemCount");
  const runCount = (items, idx, blankIdx, screen = "item") =>
    new Function("formItems", "_wizItemIdx", "_wizScreen", "_wizItemIsBlank",
      count + "; return _wizRealItemCount();")(items, idx, screen, fi => items.indexOf(fi) === blankIdx);
  const three = [{ id: 1 }, { id: 2 }, { id: 3 }];
  eq("the untouched one is not counted", runCount(three, 2, 2), 2);
  eq("a filled current one is counted", runCount(three, 2, -1), 3);
  eq("first and only, untouched", runCount([{ id: 1 }], 0, 0), 0);
  eq("a stale index on the date screen counts nothing out",
     runCount(three, 2, 2, "date"), 3);
  eq("nor on the review screen", runCount(three, 2, 2, "overview"), 3);

  const exit = grab("_wizChooseExit");
  eq("validates a filled activity before leaving", /_wizValidateCurrentItem\s*\(/.test(exit), true);
  eq("reviews when something real exists", /_wizGoTo\('overview'/.test(exit), true);
  eq("warns when nothing was added", /_wizAskNothingAdded\s*\(/.test(exit), true);

  const ask = grab("_wizAskNothingAdded");
  eq("closing drops the untouched activity", /_wizDiscardItem/.test(ask), true);
  eq("and finishes without saving", /_wizFinalize\s*\(/.test(ask), true);
  eq("offers a way back", /wiz-ask-stay/.test(ask), true);

  const footer = grab("_wizRenderFooter");
  eq("label follows the real count", /_wizRealItemCount\(\) > 0 \? "Review session/.test(footer), true);
  eq("otherwise it reads Finish", /: "Finish"/.test(footer), true);
}

console.log("\n--- the sheet is readable in the light window too ---");
{
  const css = html.slice(html.indexOf("<style"), html.lastIndexOf("</style>"));
  for (const sel of [".live-ask {", ".live-ask-title {", ".live-ask-body,"]) {
    const light = css.includes("#log-wizard-backdrop:not(.live-mode) " + sel);
    eq("light override for " + sel.replace(/[{,]/g, "").trim(), light, true);
  }
}

console.log("\n--- the dots only offer a review when there is one ---");
{
  const dots = grab("_wizRenderDots");
  const run = (items, screen, idx, realCount) => {
    let out = "";
    new Function("document", "formItems", "_wizScreen", "_wizItemIdx", "_wizRealItemCount",
      dots + "; _wizRenderDots();")
      ({ getElementById: () => ({ set innerHTML(v) { out = v; } }) },
       items, screen, idx, () => realCount);
    // data-wiz-dot contains the same substring, so count the buttons themselves.
    return (out.match(/class="wiz-dot/g) || []).length;
  };
  eq("first item, nothing chosen yet: date + that item", run([{ id: 1 }], "item", 0, 0), 2);
  eq("first item, filled in: and a review", run([{ id: 1 }], "item", 0, 1), 3);
  eq("second item being chosen: date, two items, review",
     run([{ id: 1 }, { id: 2 }], "item", 1, 1), 4);
  eq("date screen with nothing at all: one dot", run([], "date", 0, 0), 1);

  const handler = html.slice(html.indexOf('document.getElementById("wiz-dots").addEventListener'));
  eq("the review dot is guarded by the real count",
     /_wizRealItemCount\(\) <= 0\) return;/.test(handler.slice(0, handler.indexOf("\n});"))), true);
}

console.log("\n--- black belongs to the live session alone ---");
{
  const css = html.slice(html.indexOf("<style"), html.lastIndexOf("</style>"));
  const blackRule = css.split("\n").find(l => /#wiz-live-end-btn\s*[,{]/.test(l));
  eq("End session is still the black one", /#wiz-live-end-btn/.test(blackRule || ""), true);
  eq("the squares button is not", !/#wiz-choose-exit-btn/.test(blackRule || ""), true);
  const yellow = css.split("\n").find(l => /#wiz-add-another-btn, #wiz-choose-exit-btn/.test(l));
  eq("it shares the yellow primary instead", !!yellow, true);
}

console.log("\n--- hiding a wizard with nothing in it closes it instead ---");
{
  const body = grab("closeWizard");
  const run = ({ live = false, sessionMs = 0, realCount = 0, blank = true }) => {
    const calls = [];
    const cls = { add: () => {}, remove: () => {} };
    new Function("editingSessionId", "formItems", "_liveOn", "_liveSessionMs",
      "_wizRealItemCount", "_wizItemIdx", "_wizItemIsBlank", "_wizDiscardItem",
      "_wizFinalize", "_liveAutoPause", "document", "_shRestoreAfterWizard",
      "_liveRenderBar",
      body + "; closeWizard();")
      (null, [{ id: 1 }], live, () => sessionMs, () => realCount, 0,
       () => blank, id => calls.push("discard" + id), () => calls.push("finalize"),
       () => calls.push("autopause"),
       { getElementById: () => ({ classList: cls, style: {} }), body: { style: {} } },
       () => calls.push("restore"), () => calls.push("renderbar"));
    return calls;
  };
  let c = run({ live: true });
  eq("live, nothing timed or entered: closed", c.includes("finalize"), true);
  eq("and the empty activity dropped", c.includes("discard1"), true);
  eq("not merely paused", c.includes("autopause"), false);

  c = run({ live: true, sessionMs: 90000 });
  eq("live with time on it: hidden, not closed", c.includes("finalize"), false);
  eq("and the clock stops", c.includes("autopause"), true);

  c = run({ live: true, realCount: 1, blank: false });
  eq("live with an activity entered: hidden", c.includes("finalize"), false);

  c = run({ live: false });
  eq("normal, only an untouched activity: closed", c.includes("finalize"), true);
  eq("no stray activity left behind", c.includes("discard1"), true);

  c = run({ live: false, realCount: 1, blank: false });
  eq("normal with something entered: hidden", c.includes("finalize"), false);
}

console.log("\n--- the wizard header cannot squash its own buttons ---");
{
  // Geometry is beyond these tests - jsdom has no layout - so pin the rule that
  // caused it. Sides sized as 1fr shrink below their contents (the side carries
  // min-width:0), and the right one then overflows leftwards onto the title.
  const css = html.slice(html.indexOf("<style"), html.lastIndexOf("</style>"));
  const header = css.slice(css.indexOf("#wiz-header {"), css.indexOf("#wiz-header {") + 700);
  const cols = (header.match(/grid-template-columns:\s*([^;]+);/) || [])[1] || "";
  // Equal sides keep the title centred. That only works while both sides hold
  // one icon button, which is why Save draft lives in the footer now.
  eq("the sides are equal so the title sits centred",
     /^1fr\s+minmax\(0,\s*auto\)\s+1fr$/.test(cols.trim()), true);
  eq("nothing but icon buttons is left in the header",
     !/id="wiz-header-savedraft-btn"[\s\S]{0,200}<\/div>\s*<div id="wiz-header-center"/.test(html), true);
  eq("and the title truncates rather than overlapping",
     /#wiz-title[^}]*text-overflow:\s*ellipsis/.test(css), true);
  eq("Save draft sits with Review session instead",
     /<div id="wiz-item-secondary">[\s\S]{0,220}wiz-header-savedraft-btn/.test(html), true);
  eq("and follows what has been typed, not just screen changes",
     /function _scheduleDraftSave\(\)[\s\S]{0,320}_updateDraftControls\(\)/.test(html), true);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
