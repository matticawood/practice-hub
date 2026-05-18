/**
 * shared-header.js
 * Injects the full Practice Hub header, desktop tab bar, notification panel,
 * and mobile hamburger sheet into any page.
 *
 * Usage in HTML:
 *   <header id="app-header" style="display:none"></header>
 *   <script src="/shared-header.js"></script>
 *
 * After auth, call:
 *   initSharedHeader({ db, myEmail, myName, isAdmin, activePage: "events" });
 *
 * activePage values: "hub" | "resources" | "tools" | "studio" | "community" | "events"
 */

// ── CSS ───────────────────────────────────────────────────────────────────────
(function() {
  const s = document.createElement("style");
  s.textContent = `
    /* ── Header ── */
    #app-header h1 { margin: 0; }
    /* Mobile: override style.css so user row has no border-top and stays auto-width
       (matches practice-log.html behaviour exactly) */
    @media (max-width: 640px) {
      #app-header { flex-wrap: wrap; row-gap: 8px; align-items: center; }
      #app-header > div:first-child { order: 1; width: 100%; flex: none; }
      #app-header .header-user {
        order: 2; width: auto !important; flex: 1; margin-left: 0;
        border-top: none !important; padding-top: 0 !important; justify-content: flex-end;
      }
    }

    /* ── Bell ── */
    .btn-bell { position: relative; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; }
    .notif-badge {
      position: absolute; top: -5px; right: -5px;
      background: #ef4444; color: #fff; font-size: 0.6rem; font-weight: 700;
      min-width: 16px; height: 16px; border-radius: 99px;
      display: flex; align-items: center; justify-content: center;
      padding: 0 3px; line-height: 1; pointer-events: none;
    }

    /* ── Desktop tab bar ── */
    .sh-tab-bar {
      display: flex; gap: 0;
      background: var(--surface, #141414); border: 1px solid var(--border, #2a2a2a);
      border-radius: 10px; padding: 3px; overflow: visible;
      margin-bottom: 20px;
    }
    .sh-tab-wrap { position: relative; display: flex; flex: 1; }
    .sh-tab {
      width: 100%; min-width: fit-content; background: transparent; border: none;
      color: var(--text-muted, #888); font-size: 0.82rem; font-weight: 700;
      padding: 8px 12px; border-radius: 8px; cursor: pointer;
      transition: background .15s, color .15s; white-space: nowrap;
      text-decoration: none; display: inline-flex; align-items: center;
      justify-content: center; font-family: inherit;
    }
    .sh-tab.active { background: var(--accent, #f5c518); color: #1a1410; }
    .sh-tab:hover:not(.active) { color: var(--text, #e5e5e5); background: var(--surface-2, #1e1e1e); }
    .sh-tab-drop {
      display: none; position: absolute; top: 100%; left: 0;
      background: var(--surface, #141414); border: 1.5px solid var(--border, #2a2a2a);
      border-top: none; border-radius: 0 0 10px 10px;
      min-width: 190px; z-index: 300;
      box-shadow: 0 8px 28px rgba(0,0,0,.18); padding: 4px 4px 6px;
    }
    .sh-tab-wrap:hover .sh-tab-drop { display: block; }
    .sh-tab-drop a {
      display: block; width: 100%; padding: 8px 14px; background: none;
      border: none; border-radius: 6px; font-size: .84rem; font-weight: 600;
      color: var(--text-muted, #888); cursor: pointer; text-align: left;
      transition: background .12s, color .12s; white-space: nowrap;
      text-decoration: none; font-family: inherit; box-sizing: border-box;
    }
    .sh-tab-drop a:hover { background: var(--surface-2, #1e1e1e); color: var(--text, #e5e5e5); }
    .sh-tab-drop a.active { background: rgba(245,197,24,.12); color: var(--accent, #f5c518); }
    /* ── Hamburger: desktop hidden, mobile visible ── */
    #sh-hamburger-btn { display: none; }
    @media (max-width: 768px) {
      .sh-tab-bar { display: none; }
      #sh-hamburger-btn { display: inline-flex; align-items: center; }
    }

    /* ── Notif overlay + panel ── */
    .sh-notif-overlay {
      position: fixed; inset: 0; z-index: 1099;
      background: transparent; opacity: 0; pointer-events: none;
    }
    .sh-notif-overlay.visible { opacity: 1; pointer-events: all; }
    .notif-panel {
      position: fixed; top: 72px; right: 10px;
      width: min(320px, calc(100vw - 20px));
      background: #141414; border: 1px solid #2a2a2a; border-radius: 12px;
      z-index: 1100; display: flex; flex-direction: column;
      box-shadow: 0 10px 40px rgba(0,0,0,.7);
      opacity: 0; transform: translateY(-6px) scale(.97); pointer-events: none;
      transition: opacity .17s ease, transform .17s ease; overflow: hidden;
    }
    .notif-panel.open { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }
    .notif-panel-head {
      display: flex; align-items: center; gap: 6px;
      padding: 12px 14px 10px; border-bottom: 1px solid #1e1e1e; flex-shrink: 0;
    }
    .notif-panel-head h3 { flex: 1; margin: 0; font-size: 0.92rem; color: #fff; }
    .notif-mark-all {
      font-size: 0.72rem; color: #555; background: none; border: none;
      cursor: pointer; padding: 3px 7px; border-radius: 5px;
      transition: color .12s; white-space: nowrap; font-family: inherit;
    }
    .notif-mark-all:hover { color: var(--accent, #f5c518); }
    .notif-close-btn {
      background: none; border: none; cursor: pointer;
      color: #555; font-size: 1rem; padding: 3px 7px;
      border-radius: 5px; transition: color .12s; line-height: 1;
    }
    .notif-close-btn:hover { color: #fff; }
    .notif-list { overflow-y: auto; max-height: 360px; }
    .notif-empty { padding: 32px 18px; text-align: center; color: #444; font-size: 0.82rem; line-height: 1.6; }
    .notif-item {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 11px 14px; border-bottom: 1px solid #1a1a1a;
      cursor: pointer; transition: background .12s;
    }
    .notif-item:last-child { border-bottom: none; }
    .notif-item:hover { background: #1a1a1a; }
    .notif-item.unread { background: #131108; }
    .notif-item.unread:hover { background: #1b190a; }
    .notif-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent, #f5c518); flex-shrink: 0; margin-top: 5px; }
    .notif-dot.read { background: transparent; }
    .notif-item-body { flex: 1; min-width: 0; }
    .notif-item-title { font-size: 0.82rem; font-weight: 600; color: #e0e0e0; margin-bottom: 2px; line-height: 1.35; }
    .notif-item-desc { font-size: 0.75rem; color: #5a5a5a; line-height: 1.4; }
    .notif-item-time { font-size: 0.68rem; color: #3a3a3a; margin-top: 4px; }
    .notif-admin-wrap { border-top: 1px solid #1e1e1e; padding: 12px 14px; flex-shrink: 0; background: #0d0d0d; }
    .notif-admin-wrap h4 { font-size: 0.7rem; color: var(--accent, #f5c518); margin: 0 0 8px; text-transform: uppercase; letter-spacing: .08em; }
    .notif-admin-wrap input, .notif-admin-wrap textarea {
      width: 100%; box-sizing: border-box; background: #1a1a1a; border: 1px solid #2a2a2a;
      border-radius: 6px; color: #e5e5e5; padding: 6px 9px; font-size: 0.79rem;
      font-family: inherit; margin-bottom: 7px;
    }
    .notif-admin-wrap textarea { resize: none; height: 50px; }

    /* ── Mobile sheet ── */
    #sh-mob-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 180;
      opacity: 0; pointer-events: none; transition: opacity .3s ease;
    }
    #sh-mob-backdrop.open { opacity: 1; pointer-events: auto; }
    #sh-mob-sheet {
      position: fixed; bottom: 0; left: 0; right: 0;
      background: #1a1410; border-radius: 18px 18px 0 0; z-index: 9999;
      padding-bottom: max(20px, env(safe-area-inset-bottom, 20px));
      max-height: 80vh; overflow-y: auto;
      transform: translateY(100%);
      transition: transform .38s cubic-bezier(0.32,0.72,0,1);
      will-change: transform;
    }
    #sh-mob-sheet.open { transform: translateY(0); }
    .sh-handle { width: 38px; height: 4px; background: rgba(255,255,255,.18); border-radius: 2px; margin: 12px auto 2px; }
    .sh-group-toggle {
      display: flex; width: 100%; background: none; border: none;
      border-top: 1px solid rgba(255,255,255,.08); padding: 16px 20px;
      font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .1em;
      color: rgba(200,180,155,.6); text-align: left; cursor: pointer;
      align-items: center; justify-content: space-between;
      -webkit-tap-highlight-color: transparent; font-family: inherit;
    }
    .sh-group.open .sh-group-toggle { color: rgba(240,220,190,.9); }
    .sh-chevron { width: 15px; height: 15px; flex-shrink: 0; stroke: currentColor; transition: transform .28s ease; }
    .sh-group.open .sh-chevron { transform: rotate(180deg); }
    .sh-group-items { overflow: hidden; max-height: 0; transition: max-height .32s ease; }
    .sh-group.open .sh-group-items { max-height: 600px; }
    .sh-item {
      display: flex; align-items: center; width: 100%; background: none; border: none;
      border-top: 1px solid rgba(255,255,255,.08); padding: 14px 20px 14px 32px;
      font-size: .9rem; color: #e8e0d4; text-align: left; cursor: pointer;
      text-decoration: none; -webkit-tap-highlight-color: transparent; font-family: inherit;
    }
    .sh-item.active { color: var(--accent, #f5c518); font-weight: 700; }
    .sh-group-toggle.active { color: var(--accent, #f5c518); }
    .sh-section-btn {
      display: flex; align-items: center; width: 100%; background: none; border: none;
      border-top: 1px solid rgba(255,255,255,.08); padding: 16px 20px;
      font-size: .9rem; font-weight: 700; color: #e8e0d4; text-align: left; cursor: pointer;
      text-decoration: none; -webkit-tap-highlight-color: transparent; font-family: inherit;
    }
    .sh-section-btn.active { color: var(--accent, #f5c518); }

    /* ── Bell button: force visible on dark header ── */
    #notif-bell-btn.btn-ghost {
      border-color: rgba(255,255,255,.18);
      color: rgba(255,255,255,.75);
    }
    #notif-bell-btn.btn-ghost:hover {
      border-color: #f5c518;
      color: #f5c518;
    }

    /* ── User avatar button ── */
    .sh-avatar-wrap { position: relative; flex-shrink: 0; display: inline-flex; align-items: center; }
    .sh-avatar-btn {
      background: none; border: none; cursor: pointer; padding: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .sh-avatar {
      width: 30px; height: 30px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.7rem; font-weight: 700; color: #fff; font-family: inherit;
    }
    .sh-user-menu {
      position: absolute; top: calc(100% + 6px); right: 0;
      background: #141414; border: 1px solid #2a2a2a; border-radius: 10px;
      min-width: 190px; z-index: 1100;
      box-shadow: 0 8px 28px rgba(0,0,0,.4);
      display: none; flex-direction: column; overflow: hidden;
      text-align: left;
    }
    .sh-user-menu.open { display: flex; }
    .sh-user-menu-item {
      display: block; width: 100%; padding: 11px 16px;
      background: none; border: none; border-bottom: 1px solid #1e1e1e;
      font-size: 0.85rem; color: #e0e0e0; text-align: left;
      cursor: pointer; text-decoration: none; font-family: inherit;
      transition: background .12s;
    }
    .sh-user-menu-item:last-child { border-bottom: none; }
    .sh-user-menu-item:hover { background: #1e1e1e; }
  `;
  document.head.appendChild(s);
})();

// ── Early avatar paint (synchronous, before any async call) ──────────────────
// Reads the Supabase session from localStorage and applies cached avatar
// colours immediately so the avatar never flickers on back navigation.
(function _shEarlyAvatar() {
  try {
    const SB_KEY = "sb-gyskfutmncprqxazgatv-auth-token";
    const raw = localStorage.getItem(SB_KEY);
    if (!raw) return;
    const session = JSON.parse(raw);
    const email = session?.user?.email || session?.[0]?.user?.email;
    if (!email) return;

    const cached = JSON.parse(sessionStorage.getItem("sh_avatar_" + email) || "null");
    if (!cached) return; // nothing in cache yet — wait for initSharedHeader

    // Inline helpers (identical to the ones inside initSharedHeader)
    const P = [
      {bg:"rgba(59,130,246,.2)", fg:"#93c5fd"},{bg:"rgba(245,158,11,.18)",fg:"#fcd34d"},
      {bg:"rgba(16,185,129,.18)",fg:"#6ee7b7"},{bg:"rgba(139,92,246,.2)", fg:"#c4b5fd"},
      {bg:"rgba(249,115,22,.18)",fg:"#fdba74"},{bg:"rgba(236,72,153,.18)",fg:"#f9a8d4"},
      {bg:"rgba(6,182,212,.18)", fg:"#67e8f9"},{bg:"rgba(132,204,22,.18)",fg:"#bef264"},
    ];
    function _colour(e) {
      let h = 0;
      for (const c of (e||"")) h = (h*31 + c.charCodeAt(0)) & 0xffffffff;
      return P[Math.abs(h) % P.length];
    }
    function _ini(name) {
      if (!name) return "?";
      return name.trim().split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2);
    }

    // Apply as soon as the DOM is ready
    function _paint() {
      const header = document.getElementById("app-header");
      const avatarEl = document.getElementById("sh-avatar-el");
      if (!avatarEl) return;
      if (header) header.style.display = "";

      if (cached.avatarUrl) {
        avatarEl.innerHTML = `<img src="${cached.avatarUrl}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        avatarEl.style.background = "none";
        avatarEl.style.color = "inherit";
      } else {
        const colour = _colour(email);
        avatarEl.textContent = _ini(cached.myName || email.split("@")[0]);
        avatarEl.style.background = colour.bg;
        avatarEl.style.color = colour.fg;
      }
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", _paint);
    } else {
      _paint();
    }
  } catch (e) { /* silent — early paint is best-effort */ }
})();

// ── Inject static HTML (after DOM is ready) ───────────────────────────────────
document.addEventListener("DOMContentLoaded", function() {
  // Populate the header element
  const header = document.getElementById("app-header");
  if (header) {
    header.innerHTML = `
      <div style="flex:1"><h1>Practice Hub</h1></div>
      <div class="header-user">
        <span id="header-email" style="display:none"></span>
        <button class="btn btn-ghost btn-sm btn-bell" id="notif-bell-btn"
          onclick="window._shToggleNotif()" title="Notifications" aria-label="Notifications" style="display:none">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span class="notif-badge" id="notif-badge" style="display:none"></span>
        </button>
        <div class="sh-avatar-wrap">
          <button class="sh-avatar-btn" id="sh-avatar-btn" onclick="window._shToggleUserMenu()">
            <div class="sh-avatar" id="sh-avatar-el"></div>
          </button>
          <div class="sh-user-menu" id="sh-user-menu">
            <a class="sh-user-menu-item" href="/profile.html">Edit Profile</a>
            <a class="sh-user-menu-item" href="/feedback.html">Report Bug / Request Feature</a>
            <button class="sh-user-menu-item" id="sh-logout-btn">Log out</button>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" id="sh-hamburger-btn" onclick="window._shOpenSheet()"
          aria-label="Open menu" style="padding:6px 8px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
            stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>
    `;
  }

  // Inject desktop tab bar right after the header (before <main>)
  const tabBar = document.createElement("div");
  tabBar.className = "sh-tab-bar";
  tabBar.id = "sh-tab-bar";
  tabBar.innerHTML = `
    <div class="sh-tab-wrap">
      <a class="sh-tab" data-page="hub" href="/practice-log.html">Practice Hub</a>
      <div class="sh-tab-drop">
        <a href="/practice-log.html">Dashboard</a>
        <a href="/practice-log.html?goto=stats">Stats</a>
        <a href="/practice-log.html?goto=goals">Goals</a>
        <a href="/practice-log.html?goto=history">History</a>
        <a href="/practice-log.html?goto=leaderboard">Leaderboard</a>
      </div>
    </div>
    <div class="sh-tab-wrap">
      <a class="sh-tab" data-page="community" href="/community.html">Community</a>
      <div class="sh-tab-drop">
        <a href="/community.html">Feed</a>
        <a href="/community.html?filter=progress">Share Your Progress</a>
        <a href="/community.html?filter=feedback">Get Feedback</a>
        <a href="/community.html?filter=question">Ask a Question</a>
        <a href="/community.html?filter=post">Just Post</a>
      </div>
    </div>
    <div class="sh-tab-wrap">
      <a class="sh-tab" data-page="resources" href="/practice-log.html#library">Resources</a>
      <div class="sh-tab-drop">
        <a href="/practice-log.html#library">Pieces Library</a>
        <a href="/practice-log.html#theory">Piano Practice Daily</a>
        <a href="/practice-log.html?goto=glossary">Glossary</a>
        <a href="/practice-log.html?goto=key">Key Explorer</a>
      </div>
    </div>
    <div class="sh-tab-wrap">
      <a class="sh-tab" data-page="tools" href="/practice-log.html#tools">Practice Tools</a>
      <div class="sh-tab-drop">
        <a href="/practice-log.html?goto=game">Passage Fixer</a>
        <a href="/practice-log.html?goto=metro">Metronome</a>
        <a href="/practice-log.html?goto=note">Note Recognition</a>
      </div>
    </div>
    <div class="sh-tab-wrap">
      <a class="sh-tab" data-page="studio" href="/events.html">Matt's Studio</a>
      <div class="sh-tab-drop">
        <a href="#">Weekly Practice Focus</a>
        <a href="#">Content Feed</a>
        <a href="/events.html">Live Practice Clinics</a>
        <a href="/clinic-booking.html">One-to-One Clinics</a>
        <a href="#">Practice Room Updates</a>
      </div>
    </div>
  `;
  // Insert after header, before main
  const main = document.querySelector("main") || header?.nextElementSibling;
  if (main) main.prepend(tabBar);

  // Mobile sheet backdrop
  const bd = document.createElement("div");
  bd.id = "sh-mob-backdrop";
  bd.onclick = () => window._shCloseSheet();
  document.body.appendChild(bd);

  // Mobile sheet
  const sheet = document.createElement("div");
  sheet.id = "sh-mob-sheet";
  sheet.innerHTML = `
    <div class="sh-handle"></div>

    <div class="sh-group open">
      <button class="sh-group-toggle" onclick="window._shToggleGroup(this)">
        Practice Hub
        <svg class="sh-chevron" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="sh-group-items">
        <a class="sh-item" data-page="hub" href="/practice-log.html">Dashboard</a>
        <a class="sh-item" data-page="hub" href="/practice-log.html?goto=stats">Stats</a>
        <a class="sh-item" data-page="hub" href="/practice-log.html?goto=goals">Goals</a>
        <a class="sh-item" data-page="hub" href="/practice-log.html?goto=history">History</a>
        <a class="sh-item" data-page="hub" href="/practice-log.html?goto=leaderboard">Leaderboard</a>
      </div>
    </div>

    <div class="sh-group">
      <button class="sh-group-toggle" onclick="window._shToggleGroup(this)">
        Community
        <svg class="sh-chevron" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="sh-group-items">
        <a class="sh-item" data-page="community" href="/community.html">Feed</a>
        <a class="sh-item" data-page="community" href="/community.html?filter=progress">Share Your Progress</a>
        <a class="sh-item" data-page="community" href="/community.html?filter=feedback">Get Feedback</a>
        <a class="sh-item" data-page="community" href="/community.html?filter=question">Ask a Question</a>
        <a class="sh-item" data-page="community" href="/community.html?filter=post">Just Post</a>
      </div>
    </div>

    <div class="sh-group">
      <button class="sh-group-toggle" onclick="window._shToggleGroup(this)">
        Resources

        <svg class="sh-chevron" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="sh-group-items">
        <a class="sh-item" data-page="resources" href="/practice-log.html#library">Pieces Library</a>
        <a class="sh-item" data-page="resources" href="/practice-log.html#theory">Piano Practice Daily</a>
        <a class="sh-item" data-page="resources" href="/practice-log.html?goto=glossary">Glossary</a>
        <a class="sh-item" data-page="resources" href="/practice-log.html?goto=key">Key Explorer</a>
      </div>
    </div>

    <div class="sh-group">
      <button class="sh-group-toggle" onclick="window._shToggleGroup(this)">
        Practice Tools
        <svg class="sh-chevron" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="sh-group-items">
        <a class="sh-item" data-page="tools" href="/practice-log.html?goto=game">Passage Fixer</a>
        <a class="sh-item" data-page="tools" href="/practice-log.html?goto=metro">Metronome</a>
        <a class="sh-item" data-page="tools" href="/practice-log.html?goto=note">Note Recognition</a>
      </div>
    </div>

    <div class="sh-group">
      <button class="sh-group-toggle" onclick="window._shToggleGroup(this)">
        Matt's Studio
        <svg class="sh-chevron" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="sh-group-items">
        <a class="sh-item" data-page="studio" href="#">Weekly Practice Focus</a>
        <a class="sh-item" data-page="studio" href="#">Content Feed</a>
        <a class="sh-item" data-page="studio" href="/events.html">Live Practice Clinics</a>
        <a class="sh-item" data-page="studio" href="/clinic-booking.html">One-to-One Clinics</a>
        <a class="sh-item" data-page="studio" href="#">Practice Room Updates</a>
      </div>
    </div>

    <hr style="border:none;border-top:1px solid rgba(255,255,255,.1);margin:8px 20px;">
    <a class="sh-section-btn" href="/profile.html">Edit Profile</a>
    <a class="sh-section-btn" href="/feedback.html">Report Bug / Request Feature</a>
    <button class="sh-section-btn" id="sh-mob-logout-btn">Log out</button>
  `;
  document.body.appendChild(sheet);

  // Drag-to-dismiss
  let startY = 0, dragging = false, cancelled = false;
  sheet.addEventListener("touchstart", e => {
    dragging = cancelled = false; startY = e.touches[0].clientY;
  }, { passive: true });
  sheet.addEventListener("touchmove", e => {
    const dy = e.touches[0].clientY - startY;
    if (!dragging && sheet.scrollTop > 0) { cancelled = true; }
    if (cancelled) return;
    if (!dragging && dy <= 4) return;
    dragging = true;
    e.preventDefault();
    sheet.style.transition = "none";
    sheet.style.transform = `translateY(${Math.max(0, dy)}px)`;
    bd.style.opacity = Math.max(0, 1 - Math.max(0, dy) / (sheet.offsetHeight * 0.6));
  }, { passive: false });
  sheet.addEventListener("touchend", e => {
    if (!dragging) return; dragging = false;
    const dy = e.changedTouches[0].clientY - startY;
    sheet.style.transition = "";
    if (dy > 120 || dy > sheet.offsetHeight * 0.28) {
      sheet.style.transform = "translateY(100%)";
      bd.style.opacity = "";
      setTimeout(() => { sheet.classList.remove("open"); bd.classList.remove("open"); sheet.style.transform = ""; bd.style.opacity = ""; }, 400);
    } else { sheet.style.transform = ""; bd.style.opacity = ""; }
  }, { passive: true });

  // Notification overlay + panel
  const overlay = document.createElement("div");
  overlay.className = "sh-notif-overlay";
  overlay.id = "sh-notif-overlay";
  overlay.onclick = () => window._shCloseNotif();
  document.body.appendChild(overlay);

  const panel = document.createElement("aside");
  panel.className = "notif-panel";
  panel.id = "notif-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Notifications");
  panel.innerHTML = `
    <div class="notif-panel-head">
      <h3>Notifications</h3>
      <button class="notif-mark-all" onclick="window._shMarkAllRead()">Mark all read</button>
      <button class="notif-close-btn" onclick="window._shCloseNotif()">✕</button>
    </div>
    <div class="notif-list" id="notif-list"><div class="notif-empty">Loading…</div></div>
    <div class="notif-admin-wrap" id="notif-admin-wrap" style="display:none">
      <h4>Send App Update</h4>
      <input id="notif-admin-title" placeholder="Title (e.g. New feature: …)" />
      <textarea id="notif-admin-body" placeholder="More detail (optional)"></textarea>
      <div style="display:flex;gap:8px">
        <button class="btn btn-sm btn-ghost" onclick="window._shSendUpdate(false)" style="flex:1;font-size:0.8rem">Send to me</button>
        <button class="btn btn-sm" onclick="window._shSendUpdate(true)" style="flex:1;font-size:0.8rem">Broadcast to all</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);
}); // end DOMContentLoaded

// ── Sheet helpers ─────────────────────────────────────────────────────────────
window._shOpenSheet  = () => { document.getElementById("sh-mob-sheet")?.classList.add("open"); document.getElementById("sh-mob-backdrop")?.classList.add("open"); };
window._shCloseSheet = () => { document.getElementById("sh-mob-sheet")?.classList.remove("open"); document.getElementById("sh-mob-backdrop")?.classList.remove("open"); };
window.openMobSheet  = window._shOpenSheet;
window.closeMobSheet = window._shCloseSheet;
window._shToggleGroup = function(btn) {
  const group = btn.closest(".sh-group");
  const isOpen = group.classList.contains("open");
  // Accordion: close all groups, then open this one if it was closed
  document.querySelectorAll(".sh-group").forEach(g => g.classList.remove("open"));
  if (!isOpen) group.classList.add("open");
};

// ── User menu helpers ─────────────────────────────────────────────────────────
window._shToggleUserMenu = function() {
  const menu = document.getElementById("sh-user-menu");
  menu?.classList.toggle("open");
};
// Close user menu on outside click
document.addEventListener("click", function(e) {
  if (!e.target.closest(".sh-avatar-wrap")) {
    document.getElementById("sh-user-menu")?.classList.remove("open");
  }
});

// ── Notif helpers ─────────────────────────────────────────────────────────────
window._shCloseNotif = () => {
  document.getElementById("notif-panel")?.classList.remove("open");
  document.getElementById("sh-notif-overlay")?.classList.remove("visible");
};
window._shToggleNotif = () => {
  const panel = document.getElementById("notif-panel");
  if (panel?.classList.contains("open")) { window._shCloseNotif(); return; }
  const bell = document.getElementById("notif-bell-btn");
  if (bell) {
    const r = bell.getBoundingClientRect();
    const w = Math.min(320, window.innerWidth - 20);
    panel.style.top   = (r.bottom + 6) + "px";
    panel.style.right = Math.max(10, Math.min(window.innerWidth - r.right, window.innerWidth - w - 10)) + "px";
    panel.style.width = w + "px";
  }
  panel?.classList.add("open");
  document.getElementById("sh-notif-overlay")?.classList.add("visible");
  window._shLoadNotifs?.().then(() => window._shRenderNotifs?.());
  if (window._shIsAdmin) document.getElementById("notif-admin-wrap").style.display = "block";
};
// Alias used by practice-log.html
window.toggleNotifPanel = window._shToggleNotif;
window.closeNotifPanel  = window._shCloseNotif;

// ── Main init ─────────────────────────────────────────────────────────────────
window.initSharedHeader = function({ db, myEmail, myName, isAdmin, activePage = "", avatarUrl = null }) {
  window._shIsAdmin = isAdmin;

  // Show header
  const header = document.getElementById("app-header");
  if (header) header.style.display = "";

  // Populate user
  const emailEl = document.getElementById("header-email");
  if (emailEl) emailEl.textContent = myName || myEmail;

  // Show bell
  const bell = document.getElementById("notif-bell-btn");
  if (bell) bell.style.display = "";

  // Generate initials avatar
  function _getInitials(name) {
    if (!name) return "?";
    return name.trim().split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2);
  }
  function _avatarColour(email) {
    const P = [
      {bg:"rgba(59,130,246,.2)", fg:"#93c5fd"},{bg:"rgba(245,158,11,.18)",fg:"#fcd34d"},
      {bg:"rgba(16,185,129,.18)",fg:"#6ee7b7"},{bg:"rgba(139,92,246,.2)", fg:"#c4b5fd"},
      {bg:"rgba(249,115,22,.18)",fg:"#fdba74"},{bg:"rgba(236,72,153,.18)",fg:"#f9a8d4"},
      {bg:"rgba(6,182,212,.18)", fg:"#67e8f9"},{bg:"rgba(132,204,22,.18)",fg:"#bef264"},
    ];
    let h = 0;
    for (const c of (email||"")) h = (h*31 + c.charCodeAt(0)) & 0xffffffff;
    return P[Math.abs(h) % P.length];
  }
  // Cache avatar state so back-navigation is instant.
  // Read existing cache first so we never overwrite a valid photo URL with null
  // just because this page didn't fetch avatar_url.
  const _cacheKey = "sh_avatar_" + (myEmail || "");
  const _existing = JSON.parse(sessionStorage.getItem(_cacheKey) || "null");
  const _effectiveUrl  = avatarUrl ?? _existing?.avatarUrl ?? null;
  const _effectiveName = myName   || _existing?.myName || myEmail?.split("@")[0];
  // Write back — always store the best available url + name
  sessionStorage.setItem(_cacheKey, JSON.stringify({ avatarUrl: _effectiveUrl, myName: _effectiveName }));

  const avatarEl = document.getElementById("sh-avatar-el");
  if (avatarEl) {
    if (_effectiveUrl) {
      avatarEl.innerHTML = `<img src="${_effectiveUrl}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
      avatarEl.style.background = "none";
      avatarEl.style.color = "inherit";
    } else {
      const initials = _getInitials(_effectiveName);
      const colour = _avatarColour(myEmail || "");
      avatarEl.textContent = initials;
      avatarEl.style.background = colour.bg;
      avatarEl.style.color = colour.fg;
    }
  }

  // Logout — user menu button (desktop) and mobile sheet button
  const logoutHandler = async () => {
    try { await db.auth.signOut(); } catch(e) {}
    // Clear the custom session key that practice-log stores separately from Supabase auth
    localStorage.removeItem("practiceRoom_session");
    window.location.href = "/practice-log.html";
  };
  document.getElementById("sh-logout-btn")?.addEventListener("click", logoutHandler);
  document.getElementById("sh-mob-logout-btn")?.addEventListener("click", logoutHandler);

  // Clear any previously active states (initSharedHeader can be called more than
  // once per page if auth state changes fire bootApp again — without this clear,
  // active classes accumulate across calls).
  document.querySelectorAll(".sh-item.active").forEach(i => i.classList.remove("active"));
  document.querySelectorAll(".sh-tab-drop a.active").forEach(a => a.classList.remove("active"));

  // Mark active tab (desktop)
  document.querySelectorAll(".sh-tab[data-page]").forEach(t =>
    t.classList.toggle("active", t.dataset.page === activePage)
  );
  // Mark active section button (top-level items like Community)
  document.querySelectorAll(".sh-section-btn[data-page]").forEach(t =>
    t.classList.toggle("active", t.dataset.page === activePage)
  );
  // For grouped sub-items, only highlight the group toggle — not every sub-item
  document.querySelectorAll(".sh-group-toggle").forEach(toggle => {
    const items = toggle.closest(".sh-group")?.querySelectorAll(".sh-item[data-page]");
    const groupPage = items?.[0]?.dataset?.page;
    toggle.classList.toggle("active", groupPage === activePage);
  });

  // Auto-highlight the exact sh-item whose href matches the current page,
  // and auto-open its parent group (accordion: close all others).
  // We match the full href (pathname + ?goto + #hash) so that pages like
  // practice-log.html — where many items share the same pathname — only
  // highlight the one item that actually corresponds to the current URL.
  const _currPath   = window.location.pathname;
  const _currGoto   = new URLSearchParams(window.location.search).get("goto") || "";
  const _currHash   = window.location.hash; // e.g. "#library"
  let activeGroup = null;

  document.querySelectorAll(".sh-item").forEach(item => {
    try {
      const raw  = item.getAttribute("href") || "";
      const iUrl = new URL(raw, window.location.origin);
      if (iUrl.pathname !== _currPath) return;           // different page → skip

      const iGoto = iUrl.searchParams.get("goto") || "";
      const iHash = iUrl.hash;                            // e.g. "#library"

      // Require exact goto match (empty matches empty)
      if (iGoto !== _currGoto) return;
      // Require exact hash match (empty matches empty)
      if (iHash !== _currHash) return;

      item.classList.add("active");
      activeGroup = item.closest(".sh-group");
    } catch(e) {}
  });

  // If no URL match (e.g. community.html, or a hash-only tab on practice-log),
  // fall back to opening the group whose items belong to activePage.
  if (!activeGroup && activePage) {
    document.querySelectorAll(".sh-group").forEach(g => {
      const firstItem = g.querySelector(".sh-item[data-page]");
      if (firstItem?.dataset?.page === activePage) activeGroup = g;
    });
  }
  // Apply accordion: only the matched group is open
  document.querySelectorAll(".sh-group").forEach(g => {
    g.classList.toggle("open", g === activeGroup);
  });

  // ── Notifications ──────────────────────────────────────────────────────────
  let _notifs = [];

  function _esc(s) { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  function _ago(ts) {
    const m = Math.floor((Date.now() - new Date(ts)) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  function _badge() {
    const u = _notifs.filter(n => !n.read).length;
    const el = document.getElementById("notif-badge");
    if (!el) return;
    if (u > 0) { el.textContent = u > 9 ? "9+" : String(u); el.style.display = "flex"; }
    else el.style.display = "none";
  }

  window._shRenderNotifs = function() {
    const list = document.getElementById("notif-list");
    if (!list) return;
    if (!_notifs.length) {
      list.innerHTML = `<div class="notif-empty">No notifications yet.<br><span style="color:#333">App updates and activity will appear here.</span></div>`;
      return;
    }
    list.innerHTML = _notifs.map(n => `
      <div class="notif-item ${n.read ? "" : "unread"}" data-id="${n.id}" onclick="window._shNotifClick(this)">
        <div class="notif-dot ${n.read ? "read" : ""}"></div>
        <div class="notif-item-body">
          <div class="notif-item-title">${_esc(n.title)}</div>
          ${n.body ? `<div class="notif-item-desc">${_esc(n.body)}</div>` : ""}
          <div class="notif-item-time">${_ago(n.created_at)}</div>
        </div>
      </div>`).join("");
  };

  window._shLoadNotifs = async function() {
    if (!myEmail || !db) return;
    const { data } = await db.from("notifications").select("*")
      .eq("email", myEmail).order("created_at", { ascending: false }).limit(60);
    _notifs = data || [];
    _badge();
  };

  window._shNotifClick = async function(el) {
    const id = el.dataset.id;
    const n = _notifs.find(n => n.id === id);
    if (n && !n.read) {
      n.read = true; _badge(); window._shRenderNotifs();
      await db.from("notifications").update({ read: true }).eq("id", id).eq("email", myEmail);
    }
    // Navigate to the linked content
    // Derive a destination: prefer stored link_url, fall back to community page for comment notifications
    const dest = n?.link_url ||
      (n?.type === "comment_reply" || n?.type === "new_comment" ? "/community.html" : null);

    if (dest) {
      window._shCloseNotif?.();
      const url = new URL(dest, window.location.origin);
      const isSamePage = url.pathname === window.location.pathname;
      if (isSamePage) {
        // community.html: deep-link to a post
        const postId = url.searchParams.get("post");
        if (postId && typeof window.showDetail === "function") { window.showDetail(postId); return; }
        // practice-log.html: navigate to a section via ?goto=
        const gotoVal = url.searchParams.get("goto");
        if (gotoVal && typeof window.ddTab === "function") {
          const gotoMap = {
            stats:"log",goals:"log",history:"log",leaderboard:"log",achievements:"log",
            glossary:"theory",key:"theory",ppd:"theory",
            collection:"library",books:"library",
          };
          if (gotoMap[gotoVal]) { window.ddTab(gotoMap[gotoVal], gotoVal); return; }
        }
        // practice-log.html: switch main tab via hash
        const hash = url.hash.replace("#","").trim();
        if (hash) {
          const tabBtn = document.querySelector(`.main-tab[data-main-tab="${hash}"]`);
          if (tabBtn) { tabBtn.click(); return; }
        }
      }
      window.location.href = dest;
    }
  };

  window._shMarkAllRead = async function() {
    const ids = _notifs.filter(n => !n.read).map(n => n.id);
    if (!ids.length) return;
    _notifs.forEach(n => n.read = true);
    _badge(); window._shRenderNotifs();
    await db.from("notifications").update({ read: true }).in("id", ids).eq("email", myEmail);
  };
  window.markAllNotifsRead = window._shMarkAllRead;

  window._shSendUpdate = async function(broadcast) {
    const title = document.getElementById("notif-admin-title")?.value.trim();
    const body  = document.getElementById("notif-admin-body")?.value.trim();
    if (!title) { alert("Title is required"); return; }
    if (broadcast) {
      const { data: members } = await db.from("allowed_emails").select("email");
      for (const m of (members || [])) {
        await db.from("notifications").insert({ email: m.email, type: "app_update", title, body: body || null });
      }
    } else {
      await db.from("notifications").insert({ email: myEmail, type: "app_update", title, body: body || null });
    }
    document.getElementById("notif-admin-title").value = "";
    document.getElementById("notif-admin-body").value  = "";
    alert(broadcast ? "Sent to all members!" : "Sent to you!");
    await window._shLoadNotifs(); window._shRenderNotifs();
  };

  // Load on init
  window._shLoadNotifs().then(() => window._shRenderNotifs());

  // Realtime new notification
  db.channel("sh-notifs-" + myEmail)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `email=eq.${myEmail}` },
      payload => { _notifs.unshift(payload.new); _badge(); })
    .subscribe();
};
