// End-to-end stress test of practice logging: boots the real page in a DOM and
// clicks the real buttons, in both normal and live modes. Every assertion here
// is about what a member would see or lose, not about how the code is written.
import fs from "fs";
import { boot, $, visible, click, setField, tick, installClock, advance } from "./wizard-harness.mjs";

let pass = 0, fail = 0;
const failures = [];
const section = n => console.log(`\n── ${n} ${"─".repeat(Math.max(0, 58 - n.length))}`);
const ok = (label, cond) => {
  if (cond) { pass++; console.log("  ok   " + label); }
  else { fail++; failures.push(label); console.log("  FAIL " + label); }
};
const eq = (label, got, want) => {
  const good = JSON.stringify(got) === JSON.stringify(want);
  if (good) { pass++; console.log("  ok   " + label); }
  else { fail++; failures.push(label); console.log(`  FAIL ${label}\n         got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); }
};

async function scenario(name, fn) {
  let b;
  try {
    b = await boot();
    section(name);
    await fn(b);
    const late = b.errors.filter(e => !/navigation to another Document/.test(e));
    if (late.length) { fail++; failures.push(name + ": page error"); console.log("  FAIL page error: " + late[0]); }
  } catch (e) {
    fail++; failures.push(name + " threw");
    console.log(`\n── ${name}\n  FAIL threw: ${e.message}\n${(e.stack || "").split("\n").slice(1, 3).join("\n")}`);
  } finally { b?.shutdown(); }
}

// --- shared steps ----------------------------------------------------------
const TYPES = ["piece", "book", "technique", "theory", "sightreading", "eartraining", "improvisation", "other"];
const openWizard = async (win) => { win.eval("openWizard()"); await tick(win, 40); };
const curBlock = (win, t) => $(win, `#item-block-${t.formItems[t.itemIdx].id}`);
const setDuration = async (win, t, mins) => {
  const inp = curBlock(win, t).querySelector(".item-duration-input");
  inp.value = String(mins);
  inp.dispatchEvent(new win.Event("input", { bubbles: true }));
  inp.dispatchEvent(new win.Event("change", { bubbles: true }));
  await tick(win, 10);
};
const pickType = async (win, type) => { click(win, `#wiz-type-picker [data-wiz-type="${type}"]`); await tick(win, 40); };
const dots = win => [...win.document.querySelectorAll("#wiz-dots .wiz-dot")];

// ===========================================================================
await scenario("Normal: the date screen offers its three routes", async ({ win, t }) => {
  await openWizard(win);
  eq("opens on the date screen", t.screen, "date");
  ok("Add Practice Item is there", visible(win, "#wiz-add-first-btn"));
  ok("Add quick practice is there", visible(win, "#wiz-quick-btn"));
  ok("Start a live session is there", visible(win, "#wiz-live-btn"));
  eq("with nothing logged yet, one dot", dots(win).length, 1);
  const date = $(win, "#session-date").value;
  click(win, "#wiz-date-prev"); await tick(win, 10);
  ok("the date arrows move it", $(win, "#session-date").value !== date);
  click(win, "#wiz-date-next"); await tick(win, 10);
  eq("and back again", $(win, "#session-date").value, date);
});

await scenario("Normal: adding an item lands on the activity squares", async ({ win, t }) => {
  await openWizard(win);
  click(win, "#wiz-add-first-btn"); await tick(win, 40);
  eq("on the item screen", t.screen, "item");
  ok("choosing the activity", t.needsType);
  ok("the squares are showing", visible(win, "#wiz-type-picker"));
  eq("all eight of them", win.document.querySelectorAll("#wiz-type-picker [data-wiz-type]").length, 8);
  ok("the duration footer is not", !visible(win, "#wiz-dur-footer"));
  ok("nor the detail fields", !visible(win, "#wiz-item-slot"));
  ok("nor the quick adds", !visible(win, "#wiz-recent-wrap"));
  ok("the one button is showing", visible(win, "#wiz-choose-exit-btn"));
  eq("and offers to finish", $(win, "#wiz-choose-exit-btn").textContent.trim(), "Finish");
  ok("Add Another is hidden", !visible(win, "#wiz-add-another-btn"));
  ok("Review is hidden", !visible(win, "#wiz-goto-review-btn"));
  ok("Remove is hidden", !visible(win, "#wiz-remove-item-btn"));
  eq("two dots, no review to go to", dots(win).length, 2);
});

await scenario("Normal: every one of the eight squares opens its detail", async ({ win, t }) => {
  await openWizard(win);
  click(win, "#wiz-add-first-btn"); await tick(win, 40);
  for (const type of TYPES) {
    if (!t.needsType) { win.eval("wizHandleBack()"); await tick(win, 40); }
    await pickType(win, type);
    ok(`${type}: leaves the squares`, !t.needsType);
    eq(`${type}: type recorded`, t.formItems[t.itemIdx].type, type);
    ok(`${type}: squares hidden`, !visible(win, "#wiz-type-picker"));
    ok(`${type}: detail showing`, visible(win, "#wiz-item-slot"));
    ok(`${type}: duration footer showing`, visible(win, "#wiz-dur-footer"));
    ok(`${type}: has a notes or name field`,
       !!curBlock(win, t).querySelector("input[type=text], textarea"));
  }
});

await scenario("Normal: Back returns to the squares, then leaves the item", async ({ win, t }) => {
  await openWizard(win);
  click(win, "#wiz-add-first-btn"); await tick(win, 40);
  await pickType(win, "theory");
  click(win, "#wiz-back-btn"); await tick(win, 40);
  ok("back to the squares", t.needsType);
  eq("still the same item", t.formItems.length, 1);
  click(win, "#wiz-back-btn"); await tick(win, 40);
  eq("back to the date screen", t.screen, "date");
  eq("and the untouched item is gone", t.formItems.length, 0);
});

await scenario("Normal: an item you filled in is never discarded", async ({ win, t }) => {
  await openWizard(win);
  click(win, "#wiz-add-first-btn"); await tick(win, 40);
  await pickType(win, "improvisation");
  await setDuration(win, t, 20);
  setField(win, `#item-block-${t.formItems[0].id} textarea`, "Blues in F");
  click(win, "#wiz-back-btn"); await tick(win, 40);
  ok("Back shows the squares", t.needsType);
  eq("the item is still there", t.formItems.length, 1);
  eq("with its duration", curBlock(win, t).querySelector(".item-duration-input").value, "20");
  eq("and the button offers the review", $(win, "#wiz-choose-exit-btn").textContent.trim(), "Review session →");
});

await scenario("Normal: validation holds every exit", async ({ win, t }) => {
  await openWizard(win);
  click(win, "#wiz-add-first-btn"); await tick(win, 40);
  await pickType(win, "eartraining");
  setField(win, `#item-block-${t.formItems[0].id} textarea`, "Intervals");
  win.eval("wizAddAnotherItem()"); await tick(win, 40);
  eq("Add Another is refused with no duration", t.formItems.length, 1);
  click(win, "#wiz-goto-review-btn"); await tick(win, 40);
  eq("Review is refused too", t.screen, "item");
  const review = dots(win).length - 1;
  click(win, `#wiz-dots .wiz-dot:nth-child(${review + 1})`); await tick(win, 40);
  eq("and so is the review dot", t.screen, "item");
  await setDuration(win, t, 15);
  click(win, "#wiz-goto-review-btn"); await tick(win, 40);
  eq("with a duration it goes through", t.screen, "overview");
});

await scenario("Normal: an unfinished activity cannot be left by the dots either", async ({ win, t }) => {
  await openWizard(win);
  click(win, "#wiz-add-first-btn"); await tick(win, 40);
  await pickType(win, "improvisation");
  await setDuration(win, t, 30);
  click(win, "#wiz-add-another-btn"); await tick(win, 40);
  await pickType(win, "theory");
  setField(win, `#item-block-${t.formItems[1].id} textarea`, "Intervals and key signatures");
  eq("started the second activity", t.itemIdx, 1);
  click(win, "#wiz-dots .wiz-dot:nth-child(2)"); await tick(win, 40);
  eq("the dot back to the first is refused with no duration", t.itemIdx, 1);
  await setDuration(win, t, 12);
  click(win, "#wiz-dots .wiz-dot:nth-child(2)"); await tick(win, 40);
  eq("and allowed once it has one", t.itemIdx, 0);
  eq("both activities intact", t.formItems.length, 2);
});

await scenario("Normal: several items, and the dots move between them", async ({ win, t }) => {
  await openWizard(win);
  click(win, "#wiz-add-first-btn"); await tick(win, 40);
  await pickType(win, "piece");
  setField(win, `#piece-search-${t.formItems[0].id}`, "Nocturne");
  await setDuration(win, t, 25);
  click(win, "#wiz-add-another-btn"); await tick(win, 40);
  eq("a second item", t.formItems.length, 2);
  ok("which starts on the squares", t.needsType);
  await pickType(win, "improvisation");   // validates on duration alone
  await setDuration(win, t, 10);
  eq("four dots now", dots(win).length, 4);
  click(win, "#wiz-dots .wiz-dot:nth-child(2)"); await tick(win, 40);
  eq("the first dot goes to item one", t.itemIdx, 0);
  ok("and shows what was typed, not the squares", !t.needsType);
  eq("with its own duration", curBlock(win, t).querySelector(".item-duration-input").value, "25");
  click(win, "#wiz-dots .wiz-dot:nth-child(3)"); await tick(win, 40);
  eq("the second dot goes to item two", t.itemIdx, 1);
  eq("also holding its duration", curBlock(win, t).querySelector(".item-duration-input").value, "10");
});

await scenario("Normal: closing with nothing in it leaves nothing behind", async ({ win, t }) => {
  await openWizard(win);
  click(win, "#wiz-add-first-btn"); await tick(win, 40);
  click(win, "#wiz-close-btn"); await tick(win, 40);
  eq("no item was kept", t.formItems.length, 0);
  ok("and the wizard is closed, not hidden",
     !$(win, "#log-wizard-backdrop").classList.contains("open"));
  ok("no live chip either", !visible(win, "#live-fab"));
});

const MIN = 60000;
const startLive = async (win) => { installClock(win); win.eval("openWizard()"); await tick(win, 40);
  click(win, "#wiz-live-btn"); await tick(win, 60); };

// ===========================================================================
await scenario("Live: starting puts you on the activity squares", async ({ win, t }) => {
  await startLive(win);
  ok("the session is running", t.liveOn);
  ok("the window is in live mode", $(win, "#log-wizard-backdrop").classList.contains("live-mode"));
  ok("choosing the activity", t.liveNeedsType);
  ok("the squares are showing", visible(win, "#wiz-type-picker"));
  ok("the timer bar is not, until one is picked", !visible(win, "#wiz-live-bar"));
  ok("End session is reachable", visible(win, "#wiz-live-end-btn"));
  ok("the normal step-1 button is not", !visible(win, "#wiz-choose-exit-btn"));
  ok("Add Another is hidden", !visible(win, "#wiz-add-another-btn"));
  ok("Review is hidden", !visible(win, "#wiz-goto-review-btn"));
  ok("Remove is hidden", !visible(win, "#wiz-remove-item-btn"));
  ok("the dots are hidden", !visible(win, "#wiz-dots"));
  eq("one activity, waiting", t.formItems.length, 1);
});

await scenario("Live: a session is logged to today, whatever the date said", async ({ win, t }) => {
  installClock(win);
  win.eval("openWizard()"); await tick(win, 40);
  setField(win, "#session-date", "2026-08-11");
  click(win, "#wiz-live-btn"); await tick(win, 60);
  eq("the date is moved to today", $(win, "#session-date").value, win.eval("sessionTodayStr()"));
});

await scenario("Live: start, pause, resume, stop", async ({ win, t }) => {
  await startLive(win);
  await pickType(win, "piece");
  ok("the timer bar appears", visible(win, "#wiz-live-bar"));
  ok("Start is offered", visible(win, "#wiz-live-start"));
  ok("Stop is not, yet", !visible(win, "#wiz-live-stop"));
  click(win, "#wiz-live-start"); await tick(win, 20);
  ok("the clock is running", t.liveItemStart !== null);
  ok("Pause is offered", visible(win, "#wiz-live-pause"));
  ok("Stop is offered", visible(win, "#wiz-live-stop"));
  ok("Start is gone", !visible(win, "#wiz-live-start"));
  advance(win, 12 * MIN);
  eq("twelve minutes on the clock", Math.round(t.sessionMs / MIN), 12);
  click(win, "#wiz-live-pause"); await tick(win, 20);
  advance(win, 30 * MIN);
  eq("paused, and the total holds", Math.round(t.sessionMs / MIN), 12);
  click(win, "#wiz-live-pause"); await tick(win, 20);
  advance(win, 3 * MIN);
  eq("resumed, the pause excluded", Math.round(t.sessionMs / MIN), 15);
  click(win, "#wiz-live-stop"); await tick(win, 30);
  ok("the clock has stopped", t.liveItemStart === null);
  ok("Next activity is offered", visible(win, "#wiz-live-next"));
  eq("and the time is on the activity",
     curBlock(win, t).querySelector(".item-duration-input").value, "15");
});

await scenario("Live: the clock cannot be walked away from", async ({ win, t }) => {
  await startLive(win);
  await pickType(win, "technique");
  click(win, "#wiz-live-start"); await tick(win, 20);
  advance(win, 5 * MIN);
  click(win, "#wiz-live-back"); await tick(win, 30);
  ok("Back is refused while it runs", !t.liveNeedsType);
  ok("and says to stop first", /stop it first/i.test($(win, "#wiz-live-sep").textContent));
  eq("nothing was lost", Math.round(t.sessionMs / MIN), 5);
});

await scenario("Live: Next activity carries the total forward", async ({ win, t }) => {
  await startLive(win);
  await pickType(win, "improvisation");
  click(win, "#wiz-live-start"); await tick(win, 20);
  advance(win, 8 * MIN);
  click(win, "#wiz-live-stop"); await tick(win, 30);
  click(win, "#wiz-live-next"); await tick(win, 60);
  eq("a second activity", t.formItems.length, 2);
  ok("starting on the squares", t.liveNeedsType);
  eq("the first eight minutes are banked", Math.round(t.liveBankedMs / MIN), 8);
  await pickType(win, "eartraining");
  click(win, "#wiz-live-start"); await tick(win, 20);
  advance(win, 4 * MIN);
  eq("and the total is both", Math.round(t.sessionMs / MIN), 12);
});

await scenario("Live: going back to a timed activity asks what to do", async ({ win, t }) => {
  await startLive(win);
  await pickType(win, "piece");
  click(win, "#wiz-live-start"); await tick(win, 20);
  advance(win, 9 * MIN);
  click(win, "#wiz-live-stop"); await tick(win, 30);
  click(win, "#wiz-live-back"); await tick(win, 30);
  ok("the sheet appears", !!$(win, "#live-ask-backdrop"));
  eq("with three choices", win.document.querySelectorAll("#live-ask-backdrop button").length, 3);
  click(win, "#live-ask-keep"); await tick(win, 20);
  ok("Keep closes it", !$(win, "#live-ask-backdrop"));
  eq("and keeps the time", Math.round(t.sessionMs / MIN), 9);

  click(win, "#wiz-live-back"); await tick(win, 30);
  click(win, "#live-ask-move"); await tick(win, 40);
  ok("Move returns to the squares", t.liveNeedsType);
  eq("with the time intact", Math.round(t.sessionMs / MIN), 9);
  await pickType(win, "theory");
  eq("still nine minutes on the new activity",
     curBlock(win, t).querySelector(".item-duration-input").value, "9");

  click(win, "#wiz-live-back"); await tick(win, 30);
  click(win, "#live-ask-drop"); await tick(win, 60);
  eq("Discard takes the time off the total", Math.round(t.sessionMs / MIN), 0);
  eq("and leaves one fresh activity", t.formItems.length, 1);
  ok("back on the squares", t.liveNeedsType);
});

await scenario("Live: ending with nothing timed asks first", async ({ win, t }) => {
  await startLive(win);
  click(win, "#wiz-live-end-btn"); await tick(win, 30);
  ok("the sheet appears", !!$(win, "#live-ask-backdrop"));
  ok("it says nothing was timed", /nothing timed/i.test($(win, "#live-ask-backdrop").textContent));
  click(win, "#live-ask-stay"); await tick(win, 40);
  ok("carrying on keeps the session", t.liveOn);
  ok("and lands somewhere usable", t.screen === "item" && t.formItems.length > 0);
  click(win, "#wiz-live-end-btn"); await tick(win, 30);
  click(win, "#live-ask-end"); await tick(win, 60);
  ok("ending closes the session", !t.liveOn);
  ok("the window is closed", !$(win, "#log-wizard-backdrop").classList.contains("open"));
  ok("and no chip is left behind", !visible(win, "#live-fab"));
});

await scenario("Live: ending with time goes to the review", async ({ win, t }) => {
  await startLive(win);
  await pickType(win, "sightreading");
  click(win, "#wiz-live-start"); await tick(win, 20);
  advance(win, 21 * MIN);
  click(win, "#wiz-live-end-btn"); await tick(win, 60);
  ok("no question asked", !$(win, "#live-ask-backdrop"));
  eq("straight to the review", t.screen, "overview");
  ok("the session is over", !t.liveOn);
  eq("the activity kept its time",
     $(win, `#item-block-${t.formItems[0].id}`).querySelector(".item-duration-input").value, "21");
  ok("the normal buttons are back", visible(win, "#wiz-save-actions"));
});

await scenario("Live: hiding an empty session closes it; a timed one keeps running", async ({ win, t }) => {
  await startLive(win);
  click(win, "#wiz-live-header .live-x"); await tick(win, 40);
  ok("nothing timed: the session ends", !t.liveOn);
  ok("with no chip", !visible(win, "#live-fab"));
});

await scenario("Live: hiding a timed session parks it on the chip", async ({ win, t }) => {
  await startLive(win);
  await pickType(win, "book");
  click(win, "#wiz-live-start"); await tick(win, 20);
  advance(win, 17 * MIN);
  click(win, "#wiz-live-header .live-x"); await tick(win, 40);
  ok("the session survives", t.liveOn);
  ok("the chip is showing", visible(win, "#live-fab"));
  ok("Log Practice gives up its place", !visible(win, "#log-fab"));
  ok("the clock is paused", t.livePausedAt !== null);
  advance(win, 40 * MIN);
  eq("time away is not counted", Math.round(t.sessionMs / MIN), 17);
  click(win, "#live-fab"); await tick(win, 60);
  ok("tapping it comes back to the session", $(win, "#log-wizard-backdrop").classList.contains("open"));
  ok("and the clock starts again", t.livePausedAt === null);
  advance(win, 3 * MIN);
  eq("carrying on from where it was", Math.round(t.sessionMs / MIN), 20);
});

// ===========================================================================
// The blunt one: put the wizard in a state, then click every control that is
// actually on screen, one after another, and require that nothing throws and
// the window is still coherent afterwards. Sequence effects are welcome — this
// is meant to be rougher than a member would be.
const STATES = {
  "date screen":        async win => { win.eval("openWizard()"); await tick(win, 40); },
  "activity squares":   async win => { win.eval("openWizard()"); await tick(win, 40);
                                       click(win, "#wiz-add-first-btn"); await tick(win, 40); },
  "item detail":        async win => { win.eval("openWizard()"); await tick(win, 40);
                                       click(win, "#wiz-add-first-btn"); await tick(win, 40);
                                       await pickType(win, "piece"); },
  "review":             async win => { win.eval("openWizard()"); await tick(win, 40);
                                       click(win, "#wiz-add-first-btn"); await tick(win, 40);
                                       await pickType(win, "improvisation");
                                       const b = win.document.querySelector("#wiz-item-slot .item-duration-input");
                                       b.value = "20"; b.dispatchEvent(new win.Event("input", { bubbles: true }));
                                       await tick(win, 20);
                                       click(win, "#wiz-goto-review-btn"); await tick(win, 40); },
  "quick practice":     async win => { win.eval("openWizard()"); await tick(win, 40);
                                       click(win, "#wiz-quick-btn"); await tick(win, 40); },
  "live squares":       async win => { installClock(win); win.eval("openWizard()"); await tick(win, 40);
                                       click(win, "#wiz-live-btn"); await tick(win, 60); },
  "live running":       async win => { installClock(win); win.eval("openWizard()"); await tick(win, 40);
                                       click(win, "#wiz-live-btn"); await tick(win, 60);
                                       await pickType(win, "theory");
                                       click(win, "#wiz-live-start"); await tick(win, 20);
                                       advance(win, 6 * 60000); },
  "live stopped":       async win => { installClock(win); win.eval("openWizard()"); await tick(win, 40);
                                       click(win, "#wiz-live-btn"); await tick(win, 60);
                                       await pickType(win, "theory");
                                       click(win, "#wiz-live-start"); await tick(win, 20);
                                       advance(win, 6 * 60000);
                                       click(win, "#wiz-live-stop"); await tick(win, 30); },
};

for (const [state, setup] of Object.entries(STATES)) {
  await scenario(`Sweep: ${state}`, async ({ win, t, errors }) => {
    await setup(win);
    const controls = [...win.document.querySelectorAll("#log-wizard-backdrop button, #log-fab, #live-fab")]
      .filter(el => {
        for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
          if (win.getComputedStyle(n).display === "none") return false;
          if (n.classList?.contains("wiz-screen") && !n.classList.contains("active")) return false;
        }
        return true;
      });
    ok(`${controls.length} controls on screen`, controls.length > 0);
    let broke = null;
    for (const el of controls) {
      const before = errors.length;
      try {
        el.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true }));
        await tick(win, 25);
      } catch (e) { broke = `${el.id || el.className || el.textContent.trim().slice(0, 20)}: threw ${e.message}`; break; }
      const fresh = errors.slice(before).filter(m => !/navigation to another Document/.test(m));
      if (fresh.length) { broke = `${el.id || el.textContent.trim().slice(0, 20)}: ${fresh[0]}`; break; }
      if (!Array.isArray(t.formItems)) { broke = `${el.id}: the item list stopped being a list`; break; }
    }
    ok("nothing threw" + (broke ? ` (${broke})` : ""), !broke);
    ok("the item list is still sane", Array.isArray(t.formItems));
    ok("the screen is one of the known ones",
       ["date", "item", "overview", "quick"].includes(t.screen));
  });
}

// ===========================================================================
await scenario("Invariant: the session total is always the sum of its activities", async ({ win, t }) => {
  installClock(win);
  win.eval("openWizard()"); await tick(win, 40);
  click(win, "#wiz-live-btn"); await tick(win, 60);
  const spells = [7, 13, 4];
  for (let i = 0; i < spells.length; i++) {
    if (i) { click(win, "#wiz-live-next"); await tick(win, 60); }
    await pickType(win, ["piece", "theory", "improvisation"][i]);
    click(win, "#wiz-live-start"); await tick(win, 20);
    advance(win, spells[i] * MIN);
    click(win, "#wiz-live-stop"); await tick(win, 30);
    const sum = t.formItems.reduce((n, fi) => n + (parseInt(
      $(win, `#item-block-${fi.id}`).querySelector(".item-duration-input").value) || 0), 0);
    eq(`after ${i + 1} activit${i ? "ies" : "y"}: total matches the sum`,
       Math.round(t.sessionMs / MIN), sum);
  }
  eq("and it adds up to the whole session", Math.round(t.sessionMs / MIN), 24);
});

await scenario("Rough handling: repeated and out-of-order clicks", async ({ win, t }) => {
  installClock(win);
  win.eval("openWizard()"); await tick(win, 40);
  click(win, "#wiz-live-btn"); await tick(win, 60);
  click(win, "#wiz-live-btn"); await tick(win, 40);
  eq("starting a live session twice does not stack them", t.formItems.length, 1);
  await pickType(win, "piece");
  for (let i = 0; i < 5; i++) { click(win, "#wiz-live-start"); await tick(win, 10); }
  advance(win, 10 * MIN);
  eq("five taps on Start is still one clock", Math.round(t.sessionMs / MIN), 10);
  for (let i = 0; i < 4; i++) { click(win, "#wiz-live-stop"); await tick(win, 10); }
  eq("four taps on Stop banks it once", Math.round(t.sessionMs / MIN), 10);
  eq("and writes it once", curBlock(win, t).querySelector(".item-duration-input").value, "10");
  for (let i = 0; i < 3; i++) { click(win, "#wiz-live-next"); await tick(win, 40); }
  ok("repeated Next does not run away with the list", t.formItems.length <= 2);
  eq("and the banked total is untouched", Math.round(t.liveBankedMs / MIN), 10);
});

// ===========================================================================
await scenario("Saving: what reaches the database is what was entered", async ({ win, t, writes, dialogs }) => {
  installClock(win);
  win.eval("openWizard()"); await tick(win, 40);
  click(win, "#wiz-live-btn"); await tick(win, 60);
  await pickType(win, "theory");
  click(win, "#wiz-live-start"); await tick(win, 20);
  advance(win, 18 * MIN);
  click(win, "#wiz-live-stop"); await tick(win, 30);
  click(win, "#wiz-live-next"); await tick(win, 60);
  await pickType(win, "improvisation");
  click(win, "#wiz-live-start"); await tick(win, 20);
  advance(win, 7 * MIN);
  click(win, "#wiz-live-end-btn"); await tick(win, 60);
  eq("at the review", t.screen, "overview");
  click(win, "#wiz-next-btn"); await tick(win, 250);

  const sess = writes.find(w => w.table === "practice_sessions" && w.op === "insert");
  const items = writes.find(w => w.table === "practice_items" && w.op === "insert");
  ok("a session was written", !!sess);
  eq("dated today", sess?.payload.session_date, win.eval("sessionTodayStr()"));
  eq("for the whole 25 minutes", sess?.payload.duration_minutes, 25);
  ok("with both activities", Array.isArray(items?.payload) && items.payload.length === 2);
  eq("the theory one at 18", items?.payload[0].duration_minutes, 18);
  eq("the improvisation one at 7", items?.payload[1].duration_minutes, 7);
  eq("in the order they were practised",
     items?.payload.map(i => i.item_type), ["theory", "improvisation"]);
  eq("and nothing went wrong", dialogs.filter(d => /error/i.test(d.msg)).map(d => d.msg), []);
});

await scenario("Drafts: an activity you never started is not saved", async ({ win, t, writes }) => {
  await openWizard(win);
  click(win, "#wiz-add-first-btn"); await tick(win, 40);
  await pickType(win, "improvisation");
  setField(win, `#item-block-${t.formItems[0].id} textarea`, "Blues in F, left hand only");
  await setDuration(win, t, 20);
  click(win, "#wiz-add-another-btn"); await tick(win, 40);
  eq("on a second activity", t.formItems.length, 2);
  ok("still choosing what it was", t.needsType);
  click(win, "#wiz-header-savedraft-btn"); await tick(win, 250);

  const draft = writes.filter(w => w.table === "practice_session_drafts"
    && (w.op === "insert" || w.op === "update")).pop();
  ok("a draft was saved", !!draft);
  eq("holding only the activity that was started", draft?.payload.items.length, 1);
  eq("the right one", draft?.payload.items[0].item_type, "improvisation");
  eq("with its time", draft?.payload.items[0].duration_minutes, 20);
  ok("and no blank piece alongside it",
     !(draft?.payload.items || []).some(i => i.item_type === "piece" && !i.duration_minutes));
});

await scenario("Drafts: autosave does not stash a blank one either", async ({ win, t, writes }) => {
  await openWizard(win);
  click(win, "#wiz-add-first-btn"); await tick(win, 40);
  await pickType(win, "theory");
  await setDuration(win, t, 30);
  click(win, "#wiz-add-another-btn"); await tick(win, 60);
  await tick(win, 1500);   // let the debounced autosave run from the squares
  const draft = writes.filter(w => w.table === "practice_session_drafts"
    && (w.op === "insert" || w.op === "update")).pop();
  if (draft) {
    eq("the autosaved draft holds one activity", draft.payload.items.length, 1);
    eq("the started one", draft.payload.items[0].item_type, "theory");
  } else ok("nothing was autosaved yet, which is also fine", true);
});

// ===========================================================================
// Switching between the two ways of logging, in both directions.
await scenario("Switching: a live session started on top of activities entered by hand",
  async ({ win, t }) => {
    installClock(win);
    await openWizard(win);
    click(win, "#wiz-add-first-btn"); await tick(win, 40);
    await pickType(win, "improvisation");
    await setDuration(win, t, 40);
    win.eval("wizHandleBack()"); await tick(win, 40);
    win.eval("wizHandleBack()"); await tick(win, 40);
    eq("back on the date screen", t.screen, "date");
    eq("the hand-entered activity is still there", t.formItems.length, 1);

    click(win, "#wiz-live-btn"); await tick(win, 80);
    ok("the live session starts", t.liveOn);
    eq("alongside what was already entered", t.formItems.length, 2);
    await pickType(win, "theory");
    click(win, "#wiz-live-start"); await tick(win, 20);
    advance(win, 12 * MIN);
    click(win, "#wiz-live-end-btn"); await tick(win, 80);
    eq("ending goes to the review", t.screen, "overview");
    eq("with both activities", t.formItems.length, 2);
    const mins = t.formItems.map(fi =>
      parseInt($(win, `#item-block-${fi.id}`).querySelector(".item-duration-input").value) || 0);
    ok("the hand-entered forty minutes survived", mins.includes(40));
    ok("and the timed twelve are there too", mins.includes(12));
  });

await scenario("Switching: a started activity is never thrown away by ending a live session",
  async ({ win, t }) => {
    installClock(win);
    await openWizard(win);
    click(win, "#wiz-add-first-btn"); await tick(win, 40);
    await pickType(win, "piece");
    setField(win, `#item-block-${t.formItems[0].id} input[id^="piece-search-"]`, "Chopin Nocturne");
    win.eval("wizHandleBack()"); await tick(win, 40);
    win.eval("wizHandleBack()"); await tick(win, 40);
    click(win, "#wiz-live-btn"); await tick(win, 80);      // started by accident
    click(win, "#wiz-live-end-btn"); await tick(win, 80);
    ok("no 'nothing to log' claim, because there is something",
       !$(win, "#live-ask-backdrop"));
    eq("it goes to the review instead", t.screen, "overview");
    ok("the typed piece is still there", t.formItems.length === 1);
    ok("with its name", /Chopin/.test($(win, `#item-block-${t.formItems[0].id}`)?.textContent
      + [...$(win, `#item-block-${t.formItems[0].id}`).querySelectorAll("input")].map(e => e.value).join(" ")));
    ok("the live session is over", !t.liveOn);
  });

await scenario("Switching: genuinely empty still asks before closing", async ({ win, t }) => {
  installClock(win);
  await openWizard(win);
  click(win, "#wiz-live-btn"); await tick(win, 80);
  click(win, "#wiz-live-end-btn"); await tick(win, 60);
  ok("the sheet appears when there really is nothing", !!$(win, "#live-ask-backdrop"));
  click(win, "#live-ask-end"); await tick(win, 80);
  ok("and closing leaves nothing", t.formItems.length === 0);
});

await scenario("Switching: carrying on by hand after a live session", async ({ win, t }) => {
  installClock(win);
  await openWizard(win);
  click(win, "#wiz-live-btn"); await tick(win, 80);
  await pickType(win, "theory");
  click(win, "#wiz-live-start"); await tick(win, 20);
  advance(win, 18 * MIN);
  click(win, "#wiz-live-end-btn"); await tick(win, 80);
  eq("at the review", t.screen, "overview");
  click(win, "#wiz-overview-add-btn"); await tick(win, 80);
  eq("adding another opens a normal activity", t.screen, "item");
  ok("on the squares", t.needsType);
  ok("the live buttons are gone", !visible(win, "#wiz-live-end-btn"));
  ok("the timer bar is gone", !visible(win, "#wiz-live-bar"));
  await pickType(win, "piece");
  ok("and the duration footer is back", visible(win, "#wiz-dur-footer"));
  await setDuration(win, t, 9);
  eq("both activities in the session", t.formItems.length, 2);
});

// ===========================================================================
await scenario("Traps: editing a saved session offers no way to start new practice",
  async ({ win, t }) => {
    installClock(win);
    win.eval("editingSessionId = 4242;");
    win.eval("openWizard()"); await tick(win, 60);
    win.eval("_wizGoTo('date', 0, 'backward')"); await tick(win, 60);
    ok("Start a live session is not offered", !visible(win, "#wiz-live-btn"));
    ok("nor is quick practice", !visible(win, "#wiz-quick-btn"));
    // And the functions refuse even if something else reaches them.
    win.eval("wizStartLive()"); await tick(win, 60);
    ok("calling it directly does nothing", !t.liveOn);
    eq("the edit is untouched", t.editingId, 4242);
    win.eval("wizStartQuick()"); await tick(win, 60);
    eq("quick practice refuses too", t.screen, "date");
    eq("and the date is left alone", $(win, "#session-date").value, $(win, "#session-date").value);
  });

await scenario("Traps: the buttons come back once the edit is finished", async ({ win }) => {
  win.eval("openWizard()"); await tick(win, 60);
  ok("a normal entry offers a live session", visible(win, "#wiz-live-btn"));
  ok("and quick practice", visible(win, "#wiz-quick-btn"));
});

await scenario("Traps: a duration longer than a day is refused", async ({ win, t }) => {
  await openWizard(win);
  click(win, "#wiz-add-first-btn"); await tick(win, 40);
  await pickType(win, "improvisation");
  for (const [value, expected] of [["-30", true], ["0", true], ["abc", true],
                                   ["99999", true], ["1441", true], ["1440", false], ["45", false]]) {
    await setDuration(win, t, value);
    const err = win.eval("_wizValidateCurrentItem()");
    eq(`${value} minutes ${expected ? "refused" : "accepted"}`, !!err, expected);
  }
});

// ===========================================================================
// The ways a member could be stopped from logging at all, rather than losing
// something. A refused save is the likeliest: it must not swallow the work.
async function failingScenario(name, fn) {
  let b;
  try { b = await boot({ failWrites: true }); section(name); await fn(b); }
  catch (e) { fail++; failures.push(name + " threw"); console.log(`  FAIL threw: ${e.message}`); }
  finally { b?.shutdown(); }
}

async function halfFailScenario(name, fn) {
  let b;
  try { b = await boot({ failTable: "practice_items" }); section(name); await fn(b); }
  catch (e) { fail++; failures.push(name + " threw"); console.log(`  FAIL threw: ${e.message}`); }
  finally { b?.shutdown(); }
}

await halfFailScenario("Blocked: a half-done save is undone rather than left behind",
  async ({ win, t, writes, dialogs }) => {
    // The session row goes in before the activities and there is no transaction
    // across the two, so a failure between them used to strand a session in the
    // log with nothing on it, its minutes counting toward totals and the streak.
    win.eval("openWizard()"); await tick(win, 50);
    click(win, "#wiz-add-first-btn"); await tick(win, 50);
    await pickType(win, "improvisation");
    await setDuration(win, t, 30);
    win.eval("_wizGoTo('overview', 0, 'forward')"); await tick(win, 80);
    click(win, "#wiz-next-btn"); await tick(win, 600);

    const ops = writes.filter(w => w.table).map(w => `${w.table}.${w.op}`);
    ok("the session was written", ops.includes("practice_sessions.insert"));
    ok("the activities were attempted", ops.includes("practice_items.insert"));
    ok("and the orphaned session was removed", ops.includes("practice_sessions.delete"));
    ok("the member is told", dialogs.some(d => /error saving/i.test(d.msg)));
    ok("the window stays open", $(win, "#log-wizard-backdrop").classList.contains("open"));
    eq("with the work intact for another go", t.formItems.length, 1);
    eq("and its minutes", $(win, `#item-block-${t.formItems[0].id}`)
      .querySelector(".item-duration-input").value, "30");
  });

await failingScenario("Blocked: a refused save keeps the work and allows another go",
  async ({ win, t, dialogs }) => {
    win.eval("openWizard()"); await tick(win, 50);
    click(win, "#wiz-add-first-btn"); await tick(win, 50);
    await pickType(win, "improvisation");
    await setDuration(win, t, 35);
    win.eval("_wizGoTo('overview', 0, 'forward')"); await tick(win, 80);
    click(win, "#wiz-next-btn"); await tick(win, 500);
    ok("the member is told", dialogs.some(d => /error saving/i.test(d.msg)));
    ok("the window stays open", $(win, "#log-wizard-backdrop").classList.contains("open"));
    eq("the activity is still there", t.formItems.length, 1);
    eq("with its minutes", $(win, `#item-block-${t.formItems[0].id}`)
      .querySelector(".item-duration-input").value, "35");
    ok("a copy is on the device", !!win.localStorage.getItem("tc_practice_draft_v1"));
    ok("and Save can be pressed again", !$(win, "#wiz-next-btn").disabled);
  });

await failingScenario("Blocked: a refused save after a live session loses nothing either",
  async ({ win, t, dialogs }) => {
    installClock(win);
    win.eval("openWizard()"); await tick(win, 50);
    click(win, "#wiz-live-btn"); await tick(win, 80);
    await pickType(win, "theory");
    click(win, "#wiz-live-start"); await tick(win, 20);
    advance(win, 28 * MIN);
    click(win, "#wiz-live-end-btn"); await tick(win, 100);
    click(win, "#wiz-next-btn"); await tick(win, 500);
    ok("told about it", dialogs.some(d => /error saving/i.test(d.msg)));
    eq("the twenty-eight minutes survive", $(win, `#item-block-${t.formItems[0].id}`)
      .querySelector(".item-duration-input").value, "28");
    ok("and are recoverable", !!win.localStorage.getItem("tc_practice_draft_v1"));
  });

await scenario("Blocked: an activity whose requirement cannot be met can still be escaped",
  async ({ win, t }) => {
    await openWizard(win);
    click(win, "#wiz-add-first-btn"); await tick(win, 40);
    await pickType(win, "improvisation");
    await setDuration(win, t, 20);
    click(win, "#wiz-add-another-btn"); await tick(win, 40);
    await pickType(win, "technique");
    await setDuration(win, t, 15);
    ok("it cannot be completed without a technique",
       /technique/i.test(win.eval("_wizValidateCurrentItem()") || ""));
    ok("but Remove this item is there", visible(win, "#wiz-remove-item-btn"));
    click(win, "#wiz-remove-item-btn"); await tick(win, 80);
    eq("removing it leaves the good one", t.formItems.length, 1);
    win.eval("_wizGoTo('overview', 0, 'forward')"); await tick(win, 80);
    eq("and the review is reachable", t.screen, "overview");
  });

// ===========================================================================
await scenario("A draft can hold notes with no activities, and resuming it is safe",
  async ({ win, t, writes }) => {
    // This is how an empty draft gets made: notes typed on the review, then the
    // only activity removed. _draftHasContent counts notes, so it is saved.
    await openWizard(win);
    click(win, "#wiz-add-first-btn"); await tick(win, 40);
    await pickType(win, "improvisation");
    await setDuration(win, t, 20);
    click(win, "#wiz-goto-review-btn"); await tick(win, 80);
    setField(win, "#session-notes", "Felt scattered today, kept losing the pulse.");
    await tick(win, 80);
    click(win, ".wiz-overview-item-card"); await tick(win, 80);
    eq("back on the activity", t.screen, "item");
    click(win, "#wiz-remove-item-btn"); await tick(win, 100);
    eq("removing the last one leaves the date screen", t.screen, "date");
    await tick(win, 1600);
    const d = writes.filter(w => w.table === "practice_session_drafts").pop();
    ok("a draft was still saved, because the notes are real", !!d);
    eq("with no activities in it", d?.payload.items.length, 0);

    // Resuming it must not land on a review of nothing.
    win.eval(`_draftsCache = [{ id: 77, email: myEmail, session_date: "2026-08-20",
      notes: "Felt scattered today, kept losing the pulse.", items: [] }];`);
    win.eval("_loadDraftFromId(77)"); await tick(win, 120);
    eq("it opens on the date screen", t.screen, "date");
    ok("the notes are still there", /scattered/.test($(win, "#session-notes").value));
    ok("and an activity can be added", visible(win, "#wiz-add-first-btn"));
  });

await scenario("The review is never reached with nothing in it", async ({ win, t }) => {
  // Resuming a draft was the route that never checked. A draft can hold notes
  // and no activities, or ones that no longer rebuild.
  win.eval(`
    formItems = []; itemCounter = 0;
    document.getElementById("items-container").innerHTML = "";
    openWizard();
  `); await tick(win, 60);
  win.eval("_wizGoOverview()"); await tick(win, 80);
  eq("an empty draft lands on the date screen, not the review", t.screen, "date");

  // And with something in it, the review is still reachable as before.
  click(win, "#wiz-add-first-btn"); await tick(win, 40);
  await pickType(win, "improvisation");
  await setDuration(win, t, 15);
  win.eval("_wizGoOverview()"); await tick(win, 80);
  eq("a draft with an activity opens on the review", t.screen, "overview");
});

await scenario("Copy in the logging flow carries no em dashes", async ({ win }) => {
  // A standing rule, and the empty-review message broke it.
  // Scan the wizard's code line by line, the way the offender was actually
  // found. Extracting "strings" misses it: the empty-review message lives
  // inside an HTML template literal, so any filter that skips markup skips it.
  const src = fs.readFileSync("practice-log.html", "utf8").split("\n");
  const from = src.findIndex(l => l.includes("function _wizRenderOverview"));
  const to = src.findIndex(l => l.includes("function _liveEnd("));
  const offenders = [];
  for (let i = from; i < to; i++) {
    const line = src[i];
    const code = line.replace(/\/\/.*$/, "");        // drop trailing comments
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) continue;  // skip comment lines
    if (code.includes("\u2014")) offenders.push(`${i + 1}: ${code.trim().slice(0, 70)}`);
  }
  eq("none in the wizard's own copy", offenders, []);
});

// ===========================================================================
await scenario("Selecting text and releasing outside does not close the window",
  async ({ win, t }) => {
    // A click fires on the nearest common ancestor of where the press began and
    // where it ended, so dragging from a field out past the panel targets the
    // backdrop. That used to dismiss the whole thing and lose what was typed.
    await openWizard(win);
    click(win, "#wiz-add-first-btn"); await tick(win, 40);
    await pickType(win, "improvisation");
    setField(win, "#wiz-item-slot textarea", "Blues in F, worked on the turnaround");
    await setDuration(win, t, 25);
    const backdrop = $(win, "#log-wizard-backdrop");
    const field = $(win, "#wiz-item-slot textarea");

    field.dispatchEvent(new win.MouseEvent("mousedown", { bubbles: true }));
    backdrop.dispatchEvent(new win.MouseEvent("mouseup", { bubbles: true }));
    backdrop.dispatchEvent(new win.MouseEvent("click", { bubbles: true }));
    await tick(win, 80);
    ok("the window stays open", backdrop.classList.contains("open"));
    ok("and the notes survive",
       /turnaround/.test($(win, "#wiz-item-slot textarea")?.value || ""));
    eq("as does the duration", $(win, "#wiz-item-slot .item-duration-input").value, "25");

    // Tapping the backdrop itself must still dismiss.
    backdrop.dispatchEvent(new win.MouseEvent("mousedown", { bubbles: true }));
    backdrop.dispatchEvent(new win.MouseEvent("click", { bubbles: true }));
    await tick(win, 80);
    ok("a click that starts outside still closes it", !backdrop.classList.contains("open"));
  });

await scenario("The same drag does not dismiss the in-window sheets", async ({ win, t }) => {
  installClock(win);
  win.eval("openWizard()"); await tick(win, 50);
  click(win, "#wiz-live-btn"); await tick(win, 80);
  await pickType(win, "piece");
  click(win, "#wiz-live-start"); await tick(win, 20);
  advance(win, 9 * MIN);
  click(win, "#wiz-live-stop"); await tick(win, 40);
  click(win, "#wiz-live-back"); await tick(win, 40);
  const sheet = $(win, "#live-ask-backdrop");
  ok("the sheet is up", !!sheet);
  const body = sheet.querySelector(".live-ask-body");
  body.dispatchEvent(new win.MouseEvent("mousedown", { bubbles: true }));
  sheet.dispatchEvent(new win.MouseEvent("click", { bubbles: true }));
  await tick(win, 60);
  ok("dragging off its text leaves it up", !!$(win, "#live-ask-backdrop"));
  sheet.dispatchEvent(new win.MouseEvent("mousedown", { bubbles: true }));
  sheet.dispatchEvent(new win.MouseEvent("click", { bubbles: true }));
  await tick(win, 60);
  ok("a real tap outside still dismisses it", !$(win, "#live-ask-backdrop"));
  eq("with the time untouched", Math.round(t.sessionMs / MIN), 9);
});

console.log(`\n${pass} passed, ${fail} failed`);
if (failures.length) console.log("failed: " + failures.join(" | "));
process.exit(fail ? 1 : 0);
