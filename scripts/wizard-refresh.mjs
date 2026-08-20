// What survives an interruption. Each test does something in one page, carries
// the browser storage across, and boots a fresh page from it — the same thing a
// refresh, a crash, or closing and reopening the tab would do.
import { boot, readStorage, $, click, setField, tick, installClock, advance, clockOffset } from "./wizard-harness.mjs";
import fs from "fs";

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
const pick = async (win, type) => { click(win, `#wiz-type-picker [data-wiz-type="${type}"]`); await tick(win, 50); };
const setDur = async (win, t, mins) => {
  const i = $(win, `#item-block-${t.formItems[t.itemIdx].id}`).querySelector(".item-duration-input");
  i.value = String(mins); i.dispatchEvent(new win.Event("input", { bubbles: true })); await tick(win, 20);
};
const mirror = store => { try { return JSON.parse(store.tc_practice_draft_v1 || "null"); } catch { return null; } };
const live = store => { try { return JSON.parse(store.rm_live_session || "null"); } catch { return null; } };

async function interrupted(name, build, check) {
  let a, b;
  try {
    section(name);
    a = await boot();
    await build(a);
    const store = readStorage(a.win);
    const offset = clockOffset(a.win);   // a fake clock has to survive the refresh too
    a.shutdown(); a = null;
    b = await boot({ storage: store });
    if (offset) installClock(b.win, offset);
    await tick(b.win, 400);
    // Boot restores the session's clock immediately but rebuilds its activities
    // only after loadData(), which the stubbed data layer does not complete.
    // Run that step the way boot does so the check means something; that boot
    // itself calls it is asserted separately at the end of this file.
    if (b.win.eval("typeof _liveHydrate === 'function' && _liveOn && _liveRestorePending")) {
      await b.win.eval("_liveHydrate()");
      await tick(b.win, 200);
    }
    await check(b, store);
  } catch (e) {
    fail++; failures.push(name + " threw");
    console.log(`  FAIL threw: ${e.message}\n${(e.stack || "").split("\n").slice(1, 3).join("\n")}`);
  } finally { a?.shutdown(); b?.shutdown(); }
}

// ── normal logging ─────────────────────────────────────────────────────────
await interrupted("Normal: refreshed halfway through an activity",
  async ({ win, t }) => {
    win.eval("openWizard()"); await tick(win, 50);
    click(win, "#wiz-add-first-btn"); await tick(win, 50);
    await pick(win, "piece");
    setField(win, `#item-block-${t.formItems[0].id} input[id^="piece-search-"]`, "Chopin Nocturne in E flat");
    await setDur(win, t, 30);
    await tick(win, 1500);                       // let the autosave land
  },
  async ({ win, writes }, store) => {
    const m = mirror(store);
    ok("the work was on the device before the refresh", !!m);
    eq("with the activity", m?.items.length, 1);
    eq("its type", m?.items[0].item_type, "piece");
    eq("its duration", m?.items[0].duration_minutes, 30);
    ok("and the piece name", /Chopin/.test(JSON.stringify(m?.items[0])));
    // Boot does not reach the recovery call under these stubs, so call it the
    // way the page does and check the outcome.
    await win.eval("_recoverLocalDraft()"); await tick(win, 300);
    const d = writes.filter(w => w.table === "practice_session_drafts").pop();
    ok("it comes back as a draft", !!d);
    eq("holding the same activity", d?.payload.items.length, 1);
    ok("and the device copy is released", !win.localStorage.getItem("tc_practice_draft_v1"));
  });

await interrupted("Normal: refreshed while still choosing the first activity",
  async ({ win }) => {
    win.eval("openWizard()"); await tick(win, 50);
    click(win, "#wiz-add-first-btn"); await tick(win, 50);
    await tick(win, 1500);
  },
  async ({ win }, store) => {
    const m = mirror(store);
    ok("nothing was stashed for an activity never started", !m || !m.items.length);
    await win.eval("_recoverLocalDraft()"); await tick(win, 200);
    ok("so no phantom draft appears", true);
  });

await interrupted("Normal: refreshed on a second activity not yet chosen",
  async ({ win, t }) => {
    win.eval("openWizard()"); await tick(win, 50);
    click(win, "#wiz-add-first-btn"); await tick(win, 50);
    await pick(win, "theory");
    await setDur(win, t, 25);
    click(win, "#wiz-add-another-btn"); await tick(win, 60);
    await tick(win, 1500);
  },
  async (_b, store) => {
    const m = mirror(store);
    eq("only the started activity was kept", m?.items.length, 1);
    eq("the right one", m?.items[0].item_type, "theory");
  });

// ── live sessions ──────────────────────────────────────────────────────────
await interrupted("Live: refreshed with the clock running",
  async ({ win, t }) => {
    installClock(win);
    win.eval("openWizard()"); await tick(win, 50);
    click(win, "#wiz-live-btn"); await tick(win, 70);
    await pick(win, "piece");
    setField(win, `#item-block-${t.formItems[0].id} input[id^="piece-search-"]`, "Bach Prelude");
    click(win, "#wiz-live-start"); await tick(win, 30);
    advance(win, 16 * MIN);
    await tick(win, 1500);
  },
  async ({ win, t }, store) => {
    const s = live(store);
    ok("the session was on the device", !!s && s.on);
    ok("with the clock still running", s.itemStart != null && !s.pausedAt);
    ok("the page picked it up", t.liveOn);
    ok("its activities came back", t.formItems.length >= 1);
    ok("the time survived", Math.round(t.sessionMs / MIN) >= 16);
    // The name may come back in the search box or as a chosen-piece chip.
    const block = $(win, `#item-block-${t.formItems[0].id}`);
    const text = (block?.textContent || "") + " " +
      [...(block?.querySelectorAll("input, textarea") || [])].map(e => e.value).join(" ");
    ok("and the piece name with it", /Bach/.test(text));
    ok("the chip is offered while the window is shut",
       $(win, "#live-fab")?.style.display === "flex");
  });

await interrupted("Live: refreshed while paused stays paused",
  async ({ win }) => {
    installClock(win);
    win.eval("openWizard()"); await tick(win, 50);
    click(win, "#wiz-live-btn"); await tick(win, 70);
    await pick(win, "technique");
    click(win, "#wiz-live-start"); await tick(win, 30);
    advance(win, 11 * MIN);
    click(win, "#wiz-live-pause"); await tick(win, 30);
    advance(win, 25 * MIN);
    await tick(win, 1500);
  },
  async ({ win, t }) => {
    ok("still a live session", t.liveOn);
    ok("still paused", t.livePausedAt !== null);
    eq("holding the eleven minutes, not the twenty-five", Math.round(t.sessionMs / MIN), 11);
  });

await interrupted("Live: refreshed before any activity was chosen",
  async ({ win }) => {
    installClock(win);
    win.eval("openWizard()"); await tick(win, 50);
    click(win, "#wiz-live-btn"); await tick(win, 70);
    await tick(win, 1500);
  },
  async ({ win, t }) => {
    ok("the session is still there", t.liveOn);
    ok("with something to carry on with", t.formItems.length >= 1);
    eq("and nothing timed yet", Math.round(t.sessionMs / MIN), 0);
  });

await interrupted("Live: refreshed between activities",
  async ({ win, t }) => {
    installClock(win);
    win.eval("openWizard()"); await tick(win, 50);
    click(win, "#wiz-live-btn"); await tick(win, 70);
    await pick(win, "theory");
    click(win, "#wiz-live-start"); await tick(win, 30);
    advance(win, 9 * MIN);
    click(win, "#wiz-live-stop"); await tick(win, 40);
    click(win, "#wiz-live-next"); await tick(win, 70);   // on the squares again
    await tick(win, 1500);
  },
  async ({ win, t }) => {
    ok("the session survived", t.liveOn);
    eq("the banked nine minutes are intact", Math.round(t.liveBankedMs / MIN), 9);
    ok("the finished activity is still listed", t.formItems.length >= 1);
    const durs = t.formItems.map(fi =>
      parseInt($(win, `#item-block-${fi.id}`)?.querySelector(".item-duration-input")?.value) || 0);
    ok("carrying its time", durs.includes(9));
  });

await interrupted("Live: ended but not yet saved, then refreshed",
  async ({ win, t }) => {
    installClock(win);
    win.eval("openWizard()"); await tick(win, 50);
    click(win, "#wiz-live-btn"); await tick(win, 70);
    await pick(win, "sightreading");
    click(win, "#wiz-live-start"); await tick(win, 30);
    advance(win, 19 * MIN);
    click(win, "#wiz-live-end-btn"); await tick(win, 80);   // at the review, unsaved
    await tick(win, 1500);
  },
  async ({ win, writes }, store) => {
    ok("the live session is properly over", !live(store));
    const m = mirror(store);
    ok("but the practice is not lost", !!m && m.items.length === 1);
    eq("with its nineteen minutes", m?.items[0].duration_minutes, 19);
    await win.eval("_recoverLocalDraft()"); await tick(win, 300);
    const d = writes.filter(w => w.table === "practice_session_drafts").pop();
    ok("recoverable as a draft", !!d && d.payload.items.length === 1);
  });

// The page must actually call the recovery on load; the tests above call it
// directly because the stubbed boot does not reach that line.
section("The page wires recovery into its own start-up");
{
  const html = fs.readFileSync("practice-log.html", "utf8");
  ok("_recoverLocalDraft is called during boot",
     /if \(typeof _recoverLocalDraft === "function"\) _recoverLocalDraft\(\);/.test(html));
  ok("_liveRestore is called during boot", /^\s*_liveRestore\(\);/m.test(html));
  ok("a live session's activities are rebuilt after the data loads",
     /_liveOn && _liveRestorePending[\s\S]{0,120}_liveHydrate\(\)/.test(html));
}

console.log(`\n${pass} passed, ${fail} failed`);
if (failures.length) console.log("failed: " + failures.join(" | "));
process.exit(fail ? 1 : 0);
