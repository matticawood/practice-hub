// Drives the REAL _liveAutoPause/_liveAutoResume/livePauseToggle/closeWizard
// bodies lifted out of practice-log.html, so the window rule is tested as
// written rather than as remembered.
import fs from "fs";

const html = fs.readFileSync("practice-log.html", "utf8");
const grab = name => {
  const i = html.indexOf(`function ${name}(`);
  if (i < 0) throw new Error("not found: " + name);
  let d = 0, j = html.indexOf("{", i);
  for (let k = j; k < html.length; k++) {
    if (html[k] === "{") d++;
    else if (html[k] === "}" && --d === 0) return html.slice(i, k + 1);
  }
  throw new Error("unbalanced: " + name);
};

let NOW = 1_000_000_000_000;
const src = [
  "let _liveOn=false,_liveItemStart=null,_livePausedAt=null,_livePausedMs=0,_liveBankedMs=0,",
  "_liveAutoPaused=false,_liveItemStopped=false,_liveLastItemMs=0,_liveMsById={},_liveNeedsType=false;",
  "const persisted=[];",
  "function _livePersist(){persisted.push({pausedAt:_livePausedAt,pausedMs:_livePausedMs,autoPaused:_liveAutoPaused});}",
  "function _liveRenderBar(){}",
  grab("_liveAutoPause"), grab("_liveAutoResume"), grab("livePauseToggle"), grab("liveStartActivity"),
  "function _liveStartTick(){}",
  "function itemMs(){if(_liveItemStart==null)return 0;const e=_livePausedAt||Date.now();",
  "return Math.max(0,e-_liveItemStart-_livePausedMs);}",
  "return {get on(){return _liveOn},set on(v){_liveOn=v},",
  "get start(){return _liveItemStart},set start(v){_liveItemStart=v},",
  "get autoPaused(){return _liveAutoPaused},get pausedAt(){return _livePausedAt},",
  "itemMs,_liveAutoPause,_liveAutoResume,livePauseToggle,liveStartActivity,persisted};",
].join("\n");
const make = () => new Function("Date", "showToast", src)(
  new Proxy(Date, { construct: (T, a) => (a.length ? new T(...a) : new T(NOW)), get: (t, p) => (p === "now" ? () => NOW : t[p]) }),
  () => {}
);

let pass = 0, fail = 0;
const eq = (l, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : (fail++, console.log(`FAIL ${l}\n  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`));
  if (ok) console.log("ok   " + l);
};
const MIN = 60000;

console.log("--- minimising the window stops the clock ---");
let m = make(); m.on = true; m.liveStartActivity();
NOW += 9 * MIN;
m._liveAutoPause();                 // closeWizard()
NOW += 40 * MIN;                    // 40 min looking at the roadmap / stats
eq("clock frozen while minimised", Math.round(m.itemMs() / MIN), 9);
eq("marked automatic", m.autoPaused, true);
m._liveAutoResume();                // _wizReopen()
NOW += 6 * MIN;
eq("resumes on reopening the window", Math.round(m.itemMs() / MIN), 15);
eq("flag cleared after resuming", m.autoPaused, false);

console.log("\n--- a pause the member chose is not undone by reopening ---");
m = make(); m.on = true; m.liveStartActivity();
NOW += 4 * MIN;
m.livePauseToggle();                // they pressed Pause
eq("not automatic", m.autoPaused, false);
m._liveAutoPause();                 // then minimised: already paused, no-op
eq("minimising does not claim it", m.autoPaused, false);
NOW += 20 * MIN;
m._liveAutoResume();                // reopened
eq("still paused after reopening", m.pausedAt !== null, true);
eq("and still frozen", Math.round(m.itemMs() / MIN), 4);
m.livePauseToggle();                // they pressed Resume
NOW += 3 * MIN;
eq("their resume works", Math.round(m.itemMs() / MIN), 7);

console.log("\n--- repeated minimise / reopen ---");
m = make(); m.on = true; m.liveStartActivity();
for (let i = 0; i < 6; i++) { NOW += 2 * MIN; m._liveAutoPause(); NOW += 13 * MIN; m._liveAutoResume(); }
NOW += 2 * MIN;
eq("six round trips count only window time", Math.round(m.itemMs() / MIN), 14);

console.log("\n--- no-ops are safe ---");
m = make(); m.on = true;
m._liveAutoPause();
eq("pausing before the activity started", m.pausedAt, null);
m._liveAutoResume();
eq("resuming with nothing paused", m.itemMs(), 0);
m.liveStartActivity(); NOW += MIN;
m._liveAutoPause(); m._liveAutoPause(); m._liveAutoPause();
NOW += 10 * MIN; m._liveAutoResume(); m._liveAutoResume();
NOW += MIN;
eq("repeats lose no time", Math.round(m.itemMs() / MIN), 2);

console.log("\n--- every transition is written through ---");
eq("persisted on each change", m.persisted.length > 0, true);
eq("last write matches state", m.persisted[m.persisted.length - 1].autoPaused, false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
