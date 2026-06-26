// studio-nav.js — drops two nav links into a studio's top bar: a link back to
// The Practice Room (the member app) and a link to the Studios hub. Idempotent:
// it inserts before the page's logout button and skips any link the page already
// has, so it is safe to include on every studio.
(function () {
  var LINKS = [
    ["/practice-log.html", "The Practice Room"],
    ["/studio.html", "Studios"],
  ];
  function ensureStyle() {
    if (document.getElementById("sn-style")) return;
    var s = document.createElement("style");
    s.id = "sn-style";
    s.textContent =
      ".sn-wrap{display:inline-flex;gap:8px;align-items:center;margin-right:10px}" +
      ".sn-link{font-size:.8rem;line-height:1;text-decoration:none;white-space:nowrap;" +
      "padding:7px 11px;border-radius:8px;border:1px solid rgba(255,255,255,.18);" +
      "color:#cbd5e1;background:rgba(255,255,255,.05)}" +
      ".sn-link:hover{border-color:#F5C518;color:#F5C518}";
    document.head.appendChild(s);
  }
  function inject() {
    if (document.getElementById("sn-wrap")) return;
    var btn = document.querySelector("#logout, #logout-btn, #signout");
    if (!btn || !btn.parentNode) return;
    ensureStyle();
    var wrap = document.createElement("span");
    wrap.className = "sn-wrap";
    wrap.id = "sn-wrap";
    LINKS.forEach(function (l) {
      if (document.querySelector('a[href="' + l[0] + '"]')) return; // page already links there
      var a = document.createElement("a");
      a.className = "sn-link";
      a.href = l[0];
      a.textContent = l[1];
      wrap.appendChild(a);
    });
    if (wrap.children.length) btn.parentNode.insertBefore(wrap, btn);
  }
  if (document.readyState !== "loading") inject();
  else document.addEventListener("DOMContentLoaded", inject);
  // Headers in some studios are revealed/built after auth — retry a couple of times.
  setTimeout(inject, 400);
  setTimeout(inject, 1500);
})();
