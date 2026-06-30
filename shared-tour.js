// shared-tour.js — generic first-run spotlight tour, reusable on any page.
//
//   window.startSpotlightTour({
//     key:     "rm_xxx_tour_v1",   // localStorage flag for "show once"; omit to never stamp
//     force:   false,              // true = ignore the flag and never stamp (for ?tour=1 preview)
//     observe: "#some-container",  // optional: re-position when this element re-renders
//     steps: [
//       { sel: "#a", title: "…", text: "…" },
//       { sel: "#b", title: "…", text: "…", primary: "Do it", onPrimary: () => foo() }, // last step
//     ],
//   });
//
// Each step targets a CSS selector, queried fresh every step so it survives the
// target's re-render. Steps whose element isn't on the page are skipped.
(function () {
  "use strict";

  function injectCSS() {
    if (document.getElementById("sp-tour-css")) return;
    var css = document.createElement("style");
    css.id = "sp-tour-css";
    css.textContent =
      ".sp-tour-mask{position:fixed;inset:0;z-index:100000}" +
      ".sp-tour-spot{position:fixed;z-index:100001;border-radius:14px;pointer-events:none;opacity:0;box-shadow:0 0 0 9999px rgba(20,16,10,.74),0 0 0 2px rgba(245,197,24,.95);transition:all .28s cubic-bezier(.4,0,.2,1)}" +
      ".sp-tour-pop{position:fixed;z-index:100002;max-width:290px;background:#fff;color:#4a443b;border-radius:14px;padding:15px 16px 13px;box-shadow:0 18px 44px -12px rgba(0,0,0,.55);opacity:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;transition:top .28s cubic-bezier(.4,0,.2,1),left .28s cubic-bezier(.4,0,.2,1),opacity .2s ease}" +
      ".sp-tour-pop h4{margin:0 0 5px;font-size:.92rem;font-weight:800;color:#1a1410;line-height:1.25}" +
      ".sp-tour-pop p{margin:0;font-size:.8rem;line-height:1.45;color:#6b6256}" +
      ".sp-tour-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:13px}" +
      ".sp-tour-dots{font-size:.66rem;font-weight:700;color:#b0a392}" +
      ".sp-tour-btns{display:flex;gap:7px}" +
      ".sp-tour-skip{background:none;border:none;font:inherit;font-size:.72rem;font-weight:700;color:#8a8275;cursor:pointer;padding:6px 4px}" +
      ".sp-tour-skip:hover{color:#2a2620}" +
      ".sp-tour-next{background:linear-gradient(135deg,#f7cb33,#f0a500);color:#2a1d00;border:none;border-radius:9px;padding:7px 14px;font:inherit;font-size:.78rem;font-weight:800;cursor:pointer}" +
      ".sp-tour-next:hover{filter:brightness(1.04)}";
    document.head.appendChild(css);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // Convenience: run once for a member (localStorage-gated) or force via ?tour=1.
  // Waits for the first step's element (and lets a #sh-welcome-backdrop close first).
  window.maybeStartSpotlightTour = function (opts) {
    opts = opts || {};
    var force = new URLSearchParams(location.search).get("tour") === "1";
    var seen = false;
    try { seen = opts.key && localStorage.getItem(opts.key) === "1"; } catch (e) {}
    if (!force && (seen || (typeof opts.when === "function" && !opts.when()))) return;
    var first = (opts.steps && opts.steps[0] && opts.steps[0].sel) || null;
    var tries = 0;
    function _vis(el) { if (!el) return false; var r = el.getBoundingClientRect(); return !!(r.width || r.height); }
    (function wait() {
      if (document.getElementById("sh-welcome-backdrop")) { setTimeout(wait, 600); return; }
      // Wait until the first target is actually visible (non-zero box), not just
      // present in the DOM — some targets (e.g. the Key Explorer SVG) exist in the
      // markup before their panel is opened and drawn.
      if (!first || _vis(document.querySelector(first))) { window.startSpotlightTour(Object.assign({}, opts, { force: force })); return; }
      if (tries++ < 40) setTimeout(wait, 250);
    })();
  };

  window.startSpotlightTour = function (opts) {
    opts = opts || {};
    if (document.getElementById("sp-tour-mask")) return;
    var STEPS = (opts.steps || []).filter(Boolean);
    if (!STEPS.length) return;
    injectCSS();
    var i = 0;
    function mk(id, cls) { var d = document.createElement("div"); d.id = id; d.className = cls; document.body.appendChild(d); return d; }
    var mask = mk("sp-tour-mask", "sp-tour-mask");
    var spot = mk("sp-tour-spot", "sp-tour-spot");
    var pop  = mk("sp-tour-pop", "sp-tour-pop");
    mask.addEventListener("click", function (e) { e.stopPropagation(); });
    function cur() { return i < STEPS.length ? document.querySelector(STEPS[i].sel) : null; }

    function place() {
      var elx = cur(); if (!elx) return;
      var r = elx.getBoundingClientRect();
      if (!r.width && !r.height) return;
      var pad = 8;
      spot.style.left = (r.left - pad) + "px"; spot.style.top = (r.top - pad) + "px";
      spot.style.width = (r.width + pad * 2) + "px"; spot.style.height = (r.height + pad * 2) + "px";
      spot.style.opacity = "1";
      var ph = pop.offsetHeight, pw = pop.offsetWidth, vh = window.innerHeight, vw = window.innerWidth;
      var top = (r.bottom + 12 + ph < vh - 8) ? r.bottom + 12 : Math.max(8, r.top - ph - 12);
      var left = Math.min(Math.max(8, r.left), vw - pw - 8);
      pop.style.top = top + "px"; pop.style.left = left + "px"; pop.style.opacity = "1";
    }
    function render() {
      // skip steps whose target is missing OR not currently visible (zero layout
      // box). Use getBoundingClientRect, not offsetWidth/Height — the latter is
      // undefined on SVG elements (e.g. the circle-of-fifths), which would wrongly
      // skip an SVG-targeted step.
      while (i < STEPS.length) {
        var e0 = document.querySelector(STEPS[i].sel);
        if (e0) { var r0 = e0.getBoundingClientRect(); if (r0.width || r0.height) break; }
        i++;
      }
      if (i >= STEPS.length) { end(); return; }
      var s = STEPS[i], last = i === STEPS.length - 1;
      pop.style.opacity = "0"; spot.style.opacity = "0";
      var nextLabel = last ? (s.primary || "Done") : "Next";
      pop.innerHTML = "<h4>" + esc(s.title) + "</h4><p>" + esc(s.text) + "</p>" +
        '<div class="sp-tour-foot"><span class="sp-tour-dots">' + (i + 1) + " / " + STEPS.length + "</span>" +
        '<div class="sp-tour-btns"><button type="button" class="sp-tour-skip">Skip</button>' +
        '<button type="button" class="sp-tour-next">' + esc(nextLabel) + "</button></div></div>";
      pop.querySelector(".sp-tour-skip").onclick = end;
      pop.querySelector(".sp-tour-next").onclick = function () {
        if (last) { var fn = s.onPrimary; end(); if (typeof fn === "function") { try { fn(); } catch (e) {} } return; }
        i++; render();
      };
      try { cur().scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) {}
      setTimeout(place, 360);
    }
    function onResize() { place(); }
    // Re-position continuously while the page scrolls (capture phase catches
    // scrolls inside nested containers too). This keeps the callout glued to its
    // target all the way through a smooth scrollIntoView, so it never gets left
    // behind off-screen if the one-shot place() fires mid-scroll.
    function onScroll() { place(); }
    var obsEl = opts.observe ? document.querySelector(opts.observe) : null;
    var obs = obsEl ? new MutationObserver(function () { place(); }) : null;
    if (obs) obs.observe(obsEl, { childList: true, subtree: true });
    function end() {
      if (obs) obs.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
      mask.remove(); spot.remove(); pop.remove();
      if (opts.key && !opts.force) { try { localStorage.setItem(opts.key, "1"); } catch (e) {} }
    }
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    render();
  };
})();
