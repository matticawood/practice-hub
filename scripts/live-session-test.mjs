// Exercises live-session.js's time maths against a controllable clock.
import fs from "fs";
import vm from "vm";

const src = fs.readFileSync("live-session.js", "utf8");

let NOW = 1_000_000_000_000;
const store = new Map();
const sandbox = {
  window: {}, console, location: { pathname: "/practice-log.html" },
  localStorage: {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k),
  },
  // Only the state half is evaluated; the page half needs a DOM.
  document: undefined,
};
sandbox.Date = new Proxy(Date, { construct: (T, a) => (a.length ? new T(...a) : new T(NOW)) });
sandbox.Date.now = () => NOW;
vm.createContext(sandbox);
vm.runInContext(src.slice(0, src.indexOf("/* ---------- what happens on every page")), sandbox);
const L = sandbox.window.RMLive;

let pass = 0, fail = 0;
const eq = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : (fail++, console.log(`FAIL ${label}\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(want)}`));
  if (ok) console.log(`ok   ${label}`);
};
const MIN = 60000;
const AUTH = "sb-gyskfutmncprqxazgatv-auth-token";
const fresh = o => { const a = store.get(AUTH); store.clear(); if (a) store.set(AUTH, a); L.write({ on: true, email: "m@x.com", itemStart: null, pausedAt: null, pausedMs: 0, bankedMs: 0, ...o }); return L.read(); };

console.log("--- time maths ---");
let s = fresh({ itemStart: NOW });
NOW += 5 * MIN;
eq("5 min running", L.itemMs(L.read()), 5 * MIN);
eq("session = item when nothing banked", L.sessionMs(L.read()), 5 * MIN);

console.log("\n--- the whole point: time accrues while the page is gone ---");
s = fresh({ itemStart: NOW });
NOW += 22 * MIN;                       // member reads an article for 22 minutes
eq("22 min away still counted", L.itemMs(L.read()), 22 * MIN);

console.log("\n--- pause ---");
s = fresh({ itemStart: NOW });
NOW += 10 * MIN; L.pause();
NOW += 45 * MIN;                       // paused for three quarters of an hour
eq("paused clock frozen", L.itemMs(L.read()), 10 * MIN);
eq("isPaused", L.isPaused(L.read()), true);
eq("isRunning while paused", L.isRunning(L.read()), false);
L.resume();
NOW += 3 * MIN;
eq("resume excludes the pause", L.itemMs(L.read()), 13 * MIN);

console.log("\n--- repeated pauses accumulate ---");
s = fresh({ itemStart: NOW });
NOW += 2 * MIN; L.pause(); NOW += 7 * MIN; L.resume();
NOW += 2 * MIN; L.pause(); NOW += 9 * MIN; L.resume();
NOW += 1 * MIN;
eq("only real time counted", L.itemMs(L.read()), 5 * MIN);

console.log("\n--- banked time survives ---");
s = fresh({ itemStart: NOW, bankedMs: 30 * MIN });
NOW += 4 * MIN;
eq("banked + current", L.sessionMs(L.read()), 34 * MIN);
eq("pausing freezes the TOTAL too", (L.pause(), L.sessionMs(L.read())), 34 * MIN);
NOW += 60 * MIN;
eq("total still frozen an hour later", L.sessionMs(L.read()), 34 * MIN);

console.log("\n--- forgotten clock ---");
s = fresh({ itemStart: NOW });
NOW += 2 * 60 * MIN;
eq("2h is not an overrun", L.isOverrun(L.read()), false);
NOW += 2 * 60 * MIN;
eq("4h is an overrun", L.isOverrun(L.read()), true);
s = fresh({ itemStart: NOW }); L.pause(); NOW += 9 * 60 * MIN;
eq("paused overnight is NOT an overrun", L.isOverrun(L.read()), false);

console.log("\n--- storage hygiene ---");
store.clear();
eq("nothing stored reads null", L.read(), null);
store.set("rm_live_session", "{not json");
eq("corrupt reads null", L.read(), null);
eq("corrupt is cleaned up", store.has("rm_live_session"), false);
store.set("rm_live_session", JSON.stringify({ v: 1, on: true }));
eq("old version ignored", L.read(), null);
fresh({ itemStart: NOW }); L.clear();
eq("clear removes", L.read(), null);
fresh({ itemStart: NOW }); L.write({ on: false });
eq("write(off) removes", L.read(), null);

console.log("\n--- formatting ---");
eq("0:00", L.fmt(0), "0:00");
eq("2 seconds", L.fmt(2000), "0:02");
eq("9:05", L.fmt(9 * MIN + 5000), "9:05");
eq("59:59", L.fmt(59 * MIN + 59000), "59:59");
eq("rolls to hours", L.fmt(60 * MIN), "1:00:00");
eq("1:05:03", L.fmt(65 * MIN + 3000), "1:05:03");

console.log("\n--- shared device ---");
store.set(AUTH, JSON.stringify({ user: { email: "M@X.com" } }));
fresh({ itemStart: NOW, email: "m@x.com" });
eq("own session is not foreign", L.isForeign(L.read()), false);
fresh({ itemStart: NOW, email: "someone@else.com" });
eq("another member's session is foreign", L.isForeign(L.read()), true);
store.delete(AUTH);
eq("unknown login is not treated as foreign", L.isForeign(L.read()), false);


console.log("\n--- leaving the app's other pages must not double count ---");
s = fresh({ itemStart: NOW });
NOW += 12 * MIN;                       // 12 min at the piano
L.autoPause();                         // taps through to a course lesson
NOW += 25 * MIN;                       // works through it; the lesson auto-logs itself
eq("clock stopped while away", L.itemMs(L.read()), 12 * MIN);
eq("marked as an automatic pause", L.read().autoPaused, true);
L.autoResume();                        // back on the practice log
NOW += 8 * MIN;
eq("resumes on return, away time excluded", L.itemMs(L.read()), 20 * MIN);

console.log("\n--- a pause the member chose is theirs ---");
s = fresh({ itemStart: NOW });
NOW += 5 * MIN;
L.pause();                             // deliberate: they stopped for a cup of tea
eq("not marked automatic", !!L.read().autoPaused, false);
L.autoResume();                        // returning must NOT undo it
eq("deliberate pause survives a return", L.isPaused(L.read()), true);
NOW += 30 * MIN;
eq("and stays frozen", L.itemMs(L.read()), 5 * MIN);
L.resume();
NOW += 2 * MIN;
eq("manual resume works", L.itemMs(L.read()), 7 * MIN);

console.log("\n--- repeated navigation ---");
s = fresh({ itemStart: NOW });
for (let i = 0; i < 5; i++) { NOW += 3 * MIN; L.autoPause(); NOW += 11 * MIN; L.autoResume(); }
NOW += 3 * MIN;
eq("five round trips count only log-page time", L.itemMs(L.read()), 18 * MIN);

console.log("\n--- auto-pause is idempotent and safe ---");
s = fresh({ itemStart: NOW });
NOW += 4 * MIN;
L.autoPause(); NOW += 6 * MIN; L.autoPause(); NOW += 6 * MIN; L.autoPause();
L.autoResume();
NOW += 1 * MIN;
eq("repeated autoPause does not lose time", L.itemMs(L.read()), 5 * MIN);
s = fresh({ itemStart: null });
eq("autoPause on a not-yet-started activity is a no-op", (L.autoPause(), L.isPaused(L.read())), false);
eq("autoResume with nothing paused is a no-op", (L.autoResume(), L.itemMs(L.read())), 0);

console.log("\n--- page detection (Netlify serves these without .html) ---");
const paths = [["/practice-log", true], ["/practice-log.html", true], ["/practice-log/", true],
               ["/PRACTICE-LOG.html", true], ["/community", false], ["/courses.html", false],
               ["/", false], ["/resources", false]];
for (const [p, want] of paths) { sandbox.location = { pathname: p }; eq("isLogPage " + p, L.isLogPage(), want); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
