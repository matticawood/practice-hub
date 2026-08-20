// Boots the real practice-log.html in a DOM so tests can click the actual
// buttons and run the actual handlers, rather than reasoning about extracted
// functions. Everything off-page (Supabase, the shared header, the tour) is
// stubbed; everything the wizard itself does is real.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { JSDOM, VirtualConsole } from "jsdom";

const EMAIL = "test@example.com";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// A Supabase query builder that answers everything with an empty result and is
// chainable in any order, so page code can call it however it likes. Writes are
// recorded so a test can assert what would actually have been saved.
let nextId = 1000;
let FAIL_WRITES = false;
export const setFailWrites = v => { FAIL_WRITES = !!v; };
function stubQuery(table, log, rows = []) {
  const res = { data: rows, error: null, count: rows.length };
  const oops = { message: "network error", code: "PGRST000" };
  const b = new Proxy(function () {}, {
    get(_t, prop) {
      if (prop === "then") return (ok, err) => Promise.resolve(
        FAIL_WRITES && log.some(w => w.table === table) ? { data: null, error: oops } : res
      ).then(ok, err);
      if (prop === "catch") return () => b;
      if (prop === "finally") return () => b;
      // Inserts use .single(); existence checks use .maybeSingle(). Giving the
      // first a row and the second null matches how the page uses them.
      if (prop === "single") return () => FAIL_WRITES
        ? Promise.resolve({ data: null, error: oops })
        : Promise.resolve({ data: { id: nextId++ }, error: null });
      if (prop === "maybeSingle") return () => Promise.resolve({ data: rows[0] ?? null, error: null });
      if (prop === "insert" || prop === "update" || prop === "upsert" || prop === "delete")
        return (payload) => { log.push({ table, op: prop, payload }); return b; };
      return () => b;
    },
    apply: () => b,
  });
  return b;
}

const writes = [];
const stubDb = {
  writes,
  from: (table) => stubQuery(table, writes),
  rpc: (name, args) => { writes.push({ table: null, op: "rpc", name, payload: args }); return stubQuery(name, writes); },
  channel: () => ({ on: () => ({ subscribe: () => ({}) }), subscribe: () => ({}), unsubscribe: () => {} }),
  removeChannel: () => {},
  storage: { from: () => ({ upload: async () => ({ data: null, error: null }),
                            getPublicUrl: () => ({ data: { publicUrl: "" } }) }) },
  auth: {
    getSession: async () => ({ data: { session: { user: { email: EMAIL, created_at: "2020-01-01" } } }, error: null }),
    getUser:    async () => ({ data: { user: { email: EMAIL } }, error: null }),
    signOut:    async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
  },
};

// Everything the browser would still be holding after a refresh. Pass it to
// boot() to simulate one faithfully: same device, same storage, fresh page.
export const readStorage = win => {
  const out = {};
  for (let i = 0; i < win.localStorage.length; i++) {
    const k = win.localStorage.key(i);
    out[k] = win.localStorage.getItem(k);
  }
  return out;
};

export async function boot({ quiet = true, storage = null, failWrites = false } = {}) {
  let html = fs.readFileSync(path.join(ROOT, "practice-log.html"), "utf8");

  // Inline the scripts that are part of this feature; drop the rest.
  const inline = f => `<script>${fs.readFileSync(path.join(ROOT, f), "utf8")}</script>`;
  html = html.replace(/<script src="\/live-session\.js[^"]*"><\/script>/, inline("live-session.js"));
  html = html.replace(/<script src="\/shared-practice-autolog\.js[^"]*"><\/script>/,
                      inline("shared-practice-autolog.js"));
  html = html.replace(/<script src="(https?:)?\/\/[^"]*"><\/script>/g, "");
  html = html.replace(/<script src="\/[^"]*"><\/script>/g, "");

  const vc = new VirtualConsole();
  const errors = [];
  const dialogs = [];
  vc.on("jsdomError", e => errors.push(String(e.message || e)));
  if (!quiet) vc.sendTo(console);

  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    url: "https://app.example.com/practice-log.html",
    virtualConsole: vc,
    beforeParse(win) {
      writes.length = 0;
      FAIL_WRITES = !!failWrites;
      win.supabase = { createClient: () => stubDb };
      // Stubs for the shared scripts that were dropped.
      win.initSharedHeader = () => {};
      win.checkNewAchievements = async () => [];
      win.revokeLostAchievements = async () => [];
      win.showAchievementToast = () => {};
      win.RMStreak = { recompute: async () => {} };
      win.shTour = { start: () => {} };
      win.initMemberModal = () => {};
      win.StreakCalc = { captureTimezone: () => "UTC", todayInTz: () => "2026-08-20",
                         computeStreak: () => ({ current: 0, longest: 0 }) };
      win.ROADMAP_LEVELS = [];
      win.LessonRender = { render: () => {} };
      win.matchMedia = win.matchMedia || (q => ({ matches: false, media: q,
        addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
      win.scrollTo = () => {};
      // Confetti and the little canvases draw after a save; jsdom has no canvas
      // and the drawing is not what is under test.
      win.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, {
        get: (_t, p) => (p === "canvas" ? null
          : p === "measureText" ? () => ({ width: 0 })
          : p === "createLinearGradient" || p === "createPattern"
            ? () => ({ addColorStop() {} })
          : () => {}),
        set: () => true,
      });
      win.HTMLCanvasElement.prototype.toDataURL = () => "";
      win.HTMLElement.prototype.scrollIntoView = () => {};
      win.navigator.vibrate = () => {};
      win.fetch = async () => ({ ok: true, status: 200, json: async () => ({}), text: async () => "" });
      // jsdom implements none of these; record them so a test can see what the
      // page tried to say, and so a sweep is not derailed by one.
      win.alert   = msg => dialogs.push({ kind: "alert", msg: String(msg) });
      win.confirm = msg => { dialogs.push({ kind: "confirm", msg: String(msg) }); return true; };
      win.prompt  = msg => { dialogs.push({ kind: "prompt", msg: String(msg) }); return ""; };
      // Anything a handler throws, and any promise nobody caught.
      win.addEventListener("error", e => errors.push("error: " + (e.message || e)));
      win.addEventListener("unhandledrejection",
        e => errors.push("rejection: " + ((e.reason && e.reason.message) || e.reason)));
    },
  });

  const win = dom.window;
  await new Promise(r => {
    if (win.document.readyState === "complete") return r();
    win.addEventListener("load", r);
  });
  await new Promise(r => win.setTimeout(r, 60));

  // The page's first bootApp() finds no session and bails to redirectToRoot().
  // Seed the storage a signed-in browser would have — plus anything carried over
  // from a previous page, which is what makes a refresh test a refresh — and run
  // the real boot. This is the path that restores drafts and live sessions, so a
  // test that skipped it would prove nothing about either.
  try {
    win.localStorage.setItem("practiceRoom_session", JSON.stringify({ email: EMAIL }));
    win.localStorage.setItem("sb-gyskfutmncprqxazgatv-auth-token",
      JSON.stringify({ user: { email: EMAIL } }));
    if (storage) for (const [k, v] of Object.entries(storage)) win.localStorage.setItem(k, v);
  } catch (e) {}
  try { await win.eval("bootApp()"); } catch (e) {}
  await new Promise(r => win.setTimeout(r, 250));   // let boot's promises settle

  // Sign in, in the page's own lexical scope (top-level `let` is not on window).
  const s = win.document.createElement("script");
  s.textContent = `
    if (!myEmail) { myEmail = "" + EMAIL + ""; }
    if (!viewingEmail) viewingEmail = myEmail;
    window.__t = {
      get formItems() { return formItems; },
      get screen() { return _wizScreen; },
      get itemIdx() { return _wizItemIdx; },
      get needsType() { return _wizNeedsType; },
      get liveOn() { return _liveOn; },
      get liveNeedsType() { return _liveNeedsType; },
      get liveItemStart() { return _liveItemStart; },
      get livePausedAt() { return _livePausedAt; },
      get liveBankedMs() { return _liveBankedMs; },
      get sessionMs() { return _liveSessionMs(); },
      get slotId() { return _wizSlotId; },
      get realCount() { return _wizRealItemCount(); },
      get editingId() { return editingSessionId; },
      call: (fn, ...a) => eval(fn)(...a),
    };`;
  win.document.body.appendChild(s);

  // The assertions lean on jsdom resolving the real cascade, including :not(),
  // which the wizard uses to show and hide whole screens. Older jsdom silently
  // ignores those rules and every visibility check would quietly read wrong, so
  // prove it works here rather than trusting a version number.
  const probe = win.document.createElement("style");
  probe.textContent = "#rm-probe:not(.x){display:none}";
  win.document.head.appendChild(probe);
  const el = win.document.createElement("div");
  el.id = "rm-probe";
  win.document.body.appendChild(el);
  const resolves = win.getComputedStyle(el).display === "none";
  el.remove(); probe.remove();
  if (!resolves) {
    throw new Error("This jsdom does not resolve :not() in the cascade, so visibility "
      + "checks would be meaningless. Run `npm install` in scripts/ to get jsdom 30+.");
  }

  // The page keeps timers running, so a test run would never exit on its own.
  const shutdown = () => { try { win.close(); } catch (e) {} };
  return { dom, win, errors, dialogs, writes, t: win.__t, shutdown };
}

// --- helpers the tests share ------------------------------------------------
export const $ = (win, sel) => win.document.querySelector(sel);
// jsdom resolves the real cascade, so this sees stylesheet rules and not just
// inline styles — which is what most of the wizard's showing and hiding uses.
export const visible = (win, sel) => {
  const el = $(win, sel);
  if (!el) return false;
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
    if (win.getComputedStyle(n).display === "none") return false;
    if (n.classList && n.classList.contains("wiz-screen") && !n.classList.contains("active")) return false;
  }
  return true;
};
export const click = (win, sel) => {
  const el = $(win, sel);
  if (!el) throw new Error("no such element: " + sel);
  el.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true }));
  return el;
};
export const setField = (win, sel, value) => {
  const el = $(win, sel);
  if (!el) throw new Error("no such field: " + sel);
  el.value = value;
  el.dispatchEvent(new win.Event("input", { bubbles: true }));
  el.dispatchEvent(new win.Event("change", { bubbles: true }));
  return el;
};
export const tick = (win, ms = 0) => new Promise(r => win.setTimeout(r, ms));

// A controllable clock, so a timed session can be tested without waiting out
// real minutes. The page reads Date.now() at call time, so shifting it here
// moves every clock in the page and in live-session.js together.
export const installClock = (win, offset = 0) => win.eval(`
  window.__clock = { offset: ${Number(offset) || 0} };
  const _now = Date.now;
  Date.now = () => _now() + window.__clock.offset;
`);
export const advance = (win, ms) => { win.__clock.offset += ms; };
export const clockOffset = win => (win.__clock ? win.__clock.offset : 0);
