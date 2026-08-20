// Two tabs at once. Both windows share one localStorage and a write in either
// fires a storage event in the other, which is how real tabs on one origin
// behave. The second tab loads a REAL other page, not the log page in disguise,
// and both run on the same wall clock — get either of those wrong and the
// results are fiction.
import { boot, createTabGroup, clockOffset, installClock, advance, $, tick } from "./wizard-harness.mjs";

let pass = 0, fail = 0;
const failures = [];
const section = n => console.log(`\n── ${n} ${"─".repeat(Math.max(0, 56 - n.length))}`);
const ok = (l, c) => { c ? (pass++, console.log("  ok   " + l))
  : (fail++, failures.push(l), console.log("  FAIL " + l)); };
const eq = (l, g, w) => {
  const good = JSON.stringify(g) === JSON.stringify(w);
  good ? (pass++, console.log("  ok   " + l))
    : (fail++, failures.push(l), console.log(`  FAIL ${l}\n         got ${JSON.stringify(g)} want ${JSON.stringify(w)}`));
};

const MIN = 60000;
const click = (w, sel) => { const e = w.document.querySelector(sel);
  if (!e) throw new Error("no such element: " + sel);
  e.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true })); };
const running = w => w.eval("_liveOn && _liveItemStart !== null && !_livePausedAt");
// document.hidden is read-only, so fake the browser marking the tab visible.
const becomeVisible = w => {
  Object.defineProperty(w.document, "hidden", { configurable: true, get: () => false });
  Object.defineProperty(w.document, "visibilityState", { configurable: true, get: () => "visible" });
  w.document.dispatchEvent(new w.Event("visibilitychange"));
};
const total = w => Math.round(w.eval("_liveSessionMs()") / MIN);

// A log tab with a live session already timing.
async function logTabWithSession(tabs, minutes, type = "piece") {
  const t = await boot({ tabs });
  installClock(t.win);
  t.win.eval("openWizard()"); await tick(t.win, 60);
  click(t.win, "#wiz-live-btn"); await tick(t.win, 90);
  click(t.win, `#wiz-type-picker [data-wiz-type="${type}"]`); await tick(t.win, 60);
  click(t.win, "#wiz-live-start"); await tick(t.win, 40);
  advance(t.win, minutes * MIN);
  return t;
}
const otherTab = (tabs, offset, page = "community.html") =>
  boot({ tabs, page, url: `https://app.example.com/${page}`, clockOffset: offset });

async function scenario(name, fn) {
  const shut = [];
  try { section(name); await fn(shut); }
  catch (e) { fail++; failures.push(name + " threw"); console.log(`  FAIL threw: ${e.message}`); }
  finally { shut.forEach(t => t?.shutdown()); }
}

await scenario("Opening another page in a second tab stops the clock in the first", async (shut) => {
  const tabs = createTabGroup();
  const A = await logTabWithSession(tabs, 10); shut.push(A);
  eq("ten minutes timed", total(A.win), 10);
  ok("and running", running(A.win));

  const B = await otherTab(tabs, clockOffset(A.win)); shut.push(B);
  await tick(B.win, 250); await tick(A.win, 120);
  ok("the other tab shows the session", $(B.win, "#rm-live-chip")?.style.display === "flex");
  ok("reading as paused", /paused/.test($(B.win, "#rm-live-chip")?.textContent || ""));
  ok("carrying the right total", /10:00/.test($(B.win, "#rm-live-chip")?.textContent || ""));

  ok("the log tab stops its clock too", !running(A.win));
  eq("holding the ten minutes", total(A.win), 10);
  advance(A.win, 5 * MIN); B.win.__clock.offset += 5 * MIN;
  eq("and not counting the time spent in the other tab", total(A.win), 10);
  click(A.win, "#wiz-live-stop"); await tick(A.win, 120);
  eq("so ten minutes is what gets saved",
     $(A.win, "#wiz-item-slot .item-duration-input")?.value, "10");
});

await scenario("Coming back to the log tab starts it again", async (shut) => {
  const tabs = createTabGroup();
  const A = await logTabWithSession(tabs, 8); shut.push(A);
  const B = await otherTab(tabs, clockOffset(A.win)); shut.push(B);
  await tick(B.win, 250); await tick(A.win, 120);
  ok("paused while the other tab is in front", !running(A.win));
  // Returning to the tab: the browser marks it visible again.
  becomeVisible(A.win);
  await tick(A.win, 120);
  ok("the clock starts again", running(A.win));
  advance(A.win, 4 * MIN);
  eq("carrying on from where it stopped", total(A.win), 12);
});

await scenario("A pause the member chose is not undone by tab switching", async (shut) => {
  const tabs = createTabGroup();
  const A = await logTabWithSession(tabs, 6); shut.push(A);
  click(A.win, "#wiz-live-pause"); await tick(A.win, 80);      // their own pause
  ok("paused deliberately", !running(A.win));
  const B = await otherTab(tabs, clockOffset(A.win)); shut.push(B);
  await tick(B.win, 250);
  becomeVisible(A.win);
  await tick(A.win, 120);
  ok("still paused after coming back", !running(A.win));
  eq("and still holding six minutes", total(A.win), 6);
});

await scenario("Ending the session in one tab ends it in the other", async (shut) => {
  const tabs = createTabGroup();
  const A = await logTabWithSession(tabs, 7, "theory"); shut.push(A);
  const B = await otherTab(tabs, clockOffset(A.win)); shut.push(B);
  await tick(B.win, 250);
  ok("the other tab is showing it", $(B.win, "#rm-live-chip")?.style.display === "flex");
  B.win.localStorage.removeItem("rm_live_session");   // e.g. ended from elsewhere
  await tick(A.win, 150);
  ok("the log tab lets it go", A.win.eval("_liveOn") === false);
  ok("and drops its chip", $(A.win, "#live-fab")?.style.display !== "flex");
});

await scenario("Two log tabs both find the same session", async (shut) => {
  const tabs = createTabGroup();
  const A = await logTabWithSession(tabs, 14); shut.push(A);
  const B = await boot({ tabs, clockOffset: clockOffset(A.win) }); shut.push(B);
  await tick(B.win, 300);
  ok("the second log tab picks the session up", B.win.eval("_liveOn") === true);
  eq("with the same total", total(B.win), 14);
  ok("without starting a second one", B.win.eval("formItems.length") <= 1);
});

console.log(`\n${pass} passed, ${fail} failed`);
if (failures.length) console.log("failed: " + failures.join(" | "));
process.exit(fail ? 1 : 0);
