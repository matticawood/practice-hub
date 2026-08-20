// Freezes the real wizard at each step of a journey: drives the actual page in
// a DOM, then writes the resulting markup out as a static page. Real markup,
// real stylesheet, real state — just with the scripts stripped so it renders as
// a still. Lets the screens be looked at rather than reasoned about.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { boot, $, click, tick, installClock, advance } from "./wizard-harness.mjs";

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "_shots");
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const MIN = 60000;
const shots = [];
// Animations have to finish first. The review total counts up from zero over
// ~700ms, and an early frame froze it mid-count, which reads as a wrong total.
const snap = async (win, name) => {
  await tick(win, 900);
  // The theme class and the external stylesheet are what make this the real
  // thing rather than the dark defaults in a fallback serif: hub-mode is added
  // during boot, and style.css is a relative link that would miss from _shots/.
  win.document.body.classList.add("hub-mode");
  const doc = win.document.cloneNode(true);
  doc.querySelectorAll("script").forEach(s => s.remove());
  const base = doc.createElement("base");
  base.setAttribute("href", "/");
  doc.querySelector("head").prepend(base);
  // The dashboard behind the wizard is not what is being looked at.
  doc.querySelectorAll("#app-main > *:not(#log-wizard-backdrop)").forEach(el => el.remove());
  const file = `${String(shots.length + 1).padStart(2, "0")}-${name.replace(/\W+/g, "-")}.html`;
  fs.writeFileSync(path.join(OUT, file), "<!doctype html>" + doc.documentElement.outerHTML);
  shots.push({ file, name });
  console.log("  " + file);
};

const pick = async (win, type) => { click(win, `#wiz-type-picker [data-wiz-type="${type}"]`); await tick(win, 50); };
const dur = async (win, t, mins) => {
  const i = $(win, `#item-block-${t.formItems[t.itemIdx].id}`).querySelector(".item-duration-input");
  i.value = String(mins); i.dispatchEvent(new win.Event("input", { bubbles: true })); await tick(win, 20);
};
const type = (win, sel, v) => { const e = $(win, sel); if (e) { e.value = v; e.dispatchEvent(new win.Event("input", { bubbles: true })); } };

console.log("normal logging:");
{
  const b = await boot(); const { win, t } = b;
  win.eval("openWizard()"); await tick(win, 60);
  await snap(win, "date screen");
  click(win, "#wiz-add-first-btn"); await tick(win, 60);
  await snap(win, "activity squares nothing added");
  win.eval("_wizChooseExit()"); await tick(win, 40);
  await snap(win, "nothing added sheet");
  $(win, "#live-ask-backdrop")?.remove();
  await pick(win, "piece");
  type(win, `#piece-search-${t.formItems[0].id}`, "Chopin Nocturne in E flat");
  await dur(win, t, 25); await tick(win, 30);
  await snap(win, "detail piece");
  win.eval("wizHandleBack()"); await tick(win, 50);
  await snap(win, "activity squares with an item added");
  b.shutdown();
}
{
  const b = await boot(); const { win, t } = b;
  win.eval("openWizard()"); await tick(win, 60);
  click(win, "#wiz-add-first-btn"); await tick(win, 60);
  await pick(win, "eartraining");
  type(win, `#item-block-${t.formItems[0].id} textarea`, "Perfect fourths and fifths, both directions. Getting the fourth wrong when it is high.");
  await dur(win, t, 15); await tick(win, 30);
  await snap(win, "detail notes only");
  win.eval("_wizGoTo('overview',0,'forward')"); await tick(win, 60);
  await snap(win, "review");
  b.shutdown();
}
{
  const b = await boot(); const { win } = b;
  win.eval("openWizard()"); await tick(win, 60);
  click(win, "#wiz-quick-btn"); await tick(win, 60);
  await snap(win, "quick practice");
  b.shutdown();
}

console.log("live session:");
{
  const b = await boot(); const { win, t } = b;
  installClock(win);
  win.eval("openWizard()"); await tick(win, 60);
  click(win, "#wiz-live-btn"); await tick(win, 80);
  await snap(win, "live activity squares");
  await pick(win, "piece");
  type(win, `#piece-search-${t.formItems[0].id}`, "Bach Prelude in C");
  await tick(win, 30);
  await snap(win, "live detail before starting");
  click(win, "#wiz-live-start"); await tick(win, 30);
  advance(win, 14 * MIN + 22000);
  win.eval("_liveRenderBar()"); await tick(win, 30);
  await snap(win, "live running");
  click(win, "#wiz-live-stop"); await tick(win, 40);
  await snap(win, "live stopped");
  click(win, "#wiz-live-back"); await tick(win, 40);
  await snap(win, "live going back sheet");
  $(win, "#live-ask-backdrop")?.remove();
  b.shutdown();
}
{
  const b = await boot(); const { win } = b;
  installClock(win);
  win.eval("openWizard()"); await tick(win, 60);
  click(win, "#wiz-live-btn"); await tick(win, 80);
  await pick(win, "theory");
  click(win, "#wiz-live-end-btn"); await tick(win, 40);
  await snap(win, "live nothing timed sheet");
  b.shutdown();
}

// A contact sheet so every screen can be seen side by side.
fs.writeFileSync(path.join(OUT, "index.html"),
`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>practice logging screens</title>
<style>body{margin:0;padding:20px;background:#e9e4dc;font:13px Inter,-apple-system,sans-serif}
.grid{display:flex;flex-wrap:wrap;gap:18px}
figure{margin:0}figcaption{font-weight:700;margin-bottom:6px;font-size:11px;color:#5a5048}
iframe{width:390px;height:780px;border:0;border-radius:16px;background:#fff;box-shadow:0 6px 24px rgba(0,0,0,.18)}</style>
<div class="grid">${shots.map(s =>
  `<figure><figcaption>${s.name}</figcaption><iframe src="${s.file}"></iframe></figure>`).join("")}</div>`);
console.log(`\n${shots.length} screens -> _shots/index.html`);
process.exit(0);
