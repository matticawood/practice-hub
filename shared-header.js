/**
 * shared-header.js
 * Injects the full Practice Hub header, desktop tab bar, notification panel,
 * mobile bottom tab bar, and mobile scrollable pill subnav into any page.
 *
 * Usage in HTML:
 *   <header id="app-header" style="display:none"></header>
 *   <script src="/shared-header.js"></script>
 *
 * After auth, call:
 *   initSharedHeader({ db, myEmail, myName, isAdmin, activePage: "events" });
 *
 * activePage values: "hub" | "resources" | "tools" | "studio" | "community" | "events" | "chat"
 */

// ── Sub-nav data ──────────────────────────────────────────────────────────────
const SH_SUBNAV = {
  hub: [
    { label: "Dashboard", href: "/practice-log.html" },
    { label: "Stats", href: "/practice-log.html?goto=stats" },
    { label: "Goals", href: "/practice-log.html?goto=goals" },
    { label: "History", href: "/practice-log.html?goto=history" },
    { label: "Leaderboard", href: "/practice-log.html?goto=leaderboard" },
  ],
  community: [
    { label: "Feed", href: "/community.html" },
    { label: "Progress", href: "/community.html?filter=progress" },
    { label: "Feedback", href: "/community.html?filter=feedback" },
    { label: "Questions", href: "/community.html?filter=question" },
    { label: "Just Post", href: "/community.html?filter=post" },
    { label: "Practice Logs", href: "/community.html?tab=practice-log" },
  ],
  resources: [
    { label: "Pieces Library", href: "/practice-log.html#library" },
    { label: "Piano Practice Daily", href: "/practice-log.html#theory" },
    { label: "Glossary", href: "/practice-log.html?goto=glossary" },
    { label: "Key Explorer", href: "/practice-log.html?goto=key" },
  ],
  tools: [
    { label: "Passage Fixer", href: "/practice-log.html?goto=game" },
    { label: "Metronome", href: "/practice-log.html?goto=metro" },
    { label: "Note Recognition", href: "/practice-log.html?goto=note" },
  ],
  studio: [
    { label: "Weekly Focus", href: "/focus.html" },
    { label: "Content Feed", href: "/content-feed.html" },
    { label: "Live Clinics", href: "/events.html" },
    { label: "One-to-One", href: "/clinic-booking.html" },
    { label: "Updates", href: "/updates.html" },
  ],
};

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

    /* ── Bell / Chat button ── */
    .btn-bell { position: relative; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; }
    /* Pin header ghost-buttons so page-level CSS variable overrides and browser a:link defaults don't bleed in */
    #app-header .btn-ghost { border-color: #2e2e2e; color: #888; }
    #app-header .btn-ghost:hover { border-color: var(--accent, #f5c518); color: var(--accent, #f5c518); }
    /* Directly pin SVG stroke so neither element type nor inheritance differences affect icon colour */
    #header-chat-btn svg, #notif-bell-btn svg { stroke: #888; }
    #header-chat-btn:hover svg, #notif-bell-btn:hover svg { stroke: var(--accent, #f5c518); }
    #header-chat-btn.active svg { stroke: #1a1410; }
    #header-chat-btn.active { background: var(--accent, #f5c518); color: #1a1410; border-radius: 8px; border-color: var(--accent, #f5c518); }
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
    /* ── Hamburger: always hidden ── */
    #sh-hamburger-btn { display: none !important; }
    @media (max-width: 768px) {
      .sh-tab-bar { display: none; }
    }

    /* ── Mobile bottom tab bar ── */
    #sh-mob-bottom-bar {
      display: none;
    }
    @media (max-width: 768px) {
      #sh-mob-bottom-bar {
        display: flex;
        position: fixed;
        bottom: 0; left: 0; right: 0;
        background: #141414;
        border-top: 1px solid #1e1e1e;
        padding-bottom: env(safe-area-inset-bottom, 0px);
        z-index: 500;
      }
      .sh-mob-tab {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 8px 2px 6px;
        color: var(--text-muted, #666);
        text-decoration: none;
        font-size: 0.58rem;
        font-weight: 700;
        letter-spacing: .04em;
        text-transform: uppercase;
        gap: 4px;
        -webkit-tap-highlight-color: transparent;
        transition: color .15s;
      }
      .sh-mob-tab svg { flex-shrink: 0; stroke: currentColor; fill: none; }
      .sh-mob-tab.active { color: var(--accent, #f5c518); }
      /* push content above bottom bar */
      body { padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px)); }
    }

    /* ── Mobile pill subnav — sticky at top of content, below header ── */
    #sh-mob-subnav {
      display: none;
    }
    @media (max-width: 768px) {
      #sh-mob-subnav {
        display: block;
        position: sticky;
        top: 0;
        left: 0; right: 0;
        height: 44px;
        background: #141414;
        border-bottom: 1px solid #1e1e1e;
        z-index: 200;
      }
      .sh-mob-subnav-scroll {
        display: flex;
        align-items: center;
        height: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        padding: 0 12px;
        gap: 6px;
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
      }
      .sh-mob-subnav-scroll::-webkit-scrollbar { display: none; }
      .sh-mob-pill {
        display: inline-flex;
        align-items: center;
        flex-shrink: 0;
        padding: 5px 13px;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 600;
        color: #888;
        background: #1e1e1e;
        text-decoration: none;
        white-space: nowrap;
        transition: background .15s, color .15s;
        -webkit-tap-highlight-color: transparent;
      }
      .sh-mob-pill.active {
        background: #f5c518;
        color: #1a1410;
        font-weight: 800;
      }
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
        <a class="btn btn-ghost btn-sm btn-bell" id="header-chat-btn"
          href="/chat.html" title="Chat" aria-label="Chat" style="display:none;text-decoration:none">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span class="notif-badge" id="chat-unread-badge" style="display:none"></span>
        </a>
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
            <a class="sh-user-menu-item" href="/billing.html">Billing</a>
            <a class="sh-user-menu-item" href="/feedback.html">Report Bug / Request Feature</a>
            <button class="sh-user-menu-item" id="sh-logout-btn">Log out</button>
          </div>
        </div>
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
        <a href="/community.html?tab=practice-log">Practice Logs</a>
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
        <a href="/focus.html">Weekly Practice Focus</a>
        <a href="/content-feed.html">Content Feed</a>
        <a href="/events.html">Live Practice Clinics</a>
        <a href="/clinic-booking.html">One-to-One Clinics</a>
        <a href="/updates.html">Practice Room Updates</a>
      </div>
    </div>
  `;

  // Mobile pill subnav
  const subNav = document.createElement("div");
  subNav.id = "sh-mob-subnav";

  // Insert desktop tab bar after the header
  if (header && header.parentNode) {
    header.parentNode.insertBefore(tabBar, header.nextSibling);
    // Insert mobile subnav right after the desktop tab bar (hidden on desktop, sticky on mobile)
    header.parentNode.insertBefore(subNav, tabBar.nextSibling);
  } else {
    document.body.insertBefore(subNav, document.body.firstChild);
  }

  // Mobile bottom tab bar
  const bottomBar = document.createElement("nav");
  bottomBar.id = "sh-mob-bottom-bar";
  bottomBar.innerHTML = `
    <a class="sh-mob-tab" data-page="hub" href="/practice-log.html">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
      <span>Hub</span>
    </a>
    <a class="sh-mob-tab" data-page="community" href="/community.html">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      <span>Community</span>
    </a>
    <a class="sh-mob-tab" data-page="resources" href="/practice-log.html#library">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
      <span>Resources</span>
    </a>
    <a class="sh-mob-tab" data-page="tools" href="/practice-log.html?goto=game">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <line x1="4" y1="21" x2="4" y2="14"/>
        <line x1="4" y1="10" x2="4" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12" y2="3"/>
        <line x1="20" y1="21" x2="20" y2="16"/>
        <line x1="20" y1="12" x2="20" y2="3"/>
        <line x1="1" y1="14" x2="7" y2="14"/>
        <line x1="9" y1="8" x2="15" y2="8"/>
        <line x1="17" y1="16" x2="23" y2="16"/>
      </svg>
      <span>Tools</span>
    </a>
    <a class="sh-mob-tab" data-page="studio" href="/events.html">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="23 7 16 12 23 17 23 7"/>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
      <span>Studio</span>
    </a>
  `;
  document.body.appendChild(bottomBar);

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
      <button class="notif-close-btn" onclick="window._shCloseNotif()">&#x2715;</button>
    </div>
    <div class="notif-list" id="notif-list"><div class="notif-empty">Loading&#8230;</div></div>
    <div class="notif-admin-wrap" id="notif-admin-wrap" style="display:none">
      <h4>Send App Update</h4>
      <input id="notif-admin-title" placeholder="Title (e.g. New feature: ...)" />
      <textarea id="notif-admin-body" placeholder="More detail (optional)"></textarea>
      <div style="display:flex;gap:8px">
        <button class="btn btn-sm btn-ghost" onclick="window._shSendUpdate(false)" style="flex:1;font-size:0.8rem">Send to me</button>
        <button class="btn btn-sm" onclick="window._shSendUpdate(true)" style="flex:1;font-size:0.8rem">Broadcast to all</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);
}); // end DOMContentLoaded

// ── Sheet helpers (kept as no-ops for backward compat) ────────────────────────
window._shOpenSheet  = function() {};
window._shCloseSheet = function() {};
window.openMobSheet  = window._shOpenSheet;
window.closeMobSheet = window._shCloseSheet;

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

  // basePage is what the page declared; _resolveSection re-detects for pages
  // where multiple sections share the same URL (practice-log.html).
  const basePage = activePage;
  function _resolveSection() {
    if (basePage === "hub") {
      const goto = new URLSearchParams(location.search).get("goto") || "";
      const hash = location.hash.replace("#", "");
      if (["glossary", "key", "library", "theory"].includes(goto) || ["library", "theory"].includes(hash)) {
        return "resources";
      }
      if (["game", "metro", "note"].includes(goto)) {
        return "tools";
      }
    }
    return basePage;
  }
  activePage = _resolveSection();

  // Show header
  const header = document.getElementById("app-header");
  if (header) header.style.display = "";

  // Populate user
  const emailEl = document.getElementById("header-email");
  if (emailEl) emailEl.textContent = myName || myEmail;

  // Show chat button
  const chatBtn = document.getElementById("header-chat-btn");
  if (chatBtn) {
    chatBtn.style.display = "";
    chatBtn.classList.toggle("active", activePage === "chat");
  }

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

  // Logout — user menu button (desktop only; mobile sheet removed)
  const logoutHandler = async () => {
    try { await db.auth.signOut(); } catch(e) {}
    // Clear the custom session key that practice-log stores separately from Supabase auth
    localStorage.removeItem("practiceRoom_session");
    window.location.href = "/practice-log.html";
  };
  document.getElementById("sh-logout-btn")?.addEventListener("click", logoutHandler);

  // Clear any previously active states (initSharedHeader can be called more than
  // once per page if auth state changes fire bootApp again — without this clear,
  // active classes accumulate across calls).
  document.querySelectorAll(".sh-tab-drop a.active").forEach(a => a.classList.remove("active"));

  // URL match helper — shared by _updateNav and desktop dropdown highlighting
  function _pillIsActive(href) {
    try {
      const u = new URL(href, location.origin);
      if (u.pathname !== location.pathname) return false;
      const p = new URLSearchParams(location.search);
      return u.searchParams.get("goto")   === (p.get("goto")   || "") &&
             u.searchParams.get("filter") === (p.get("filter") || "") &&
             u.searchParams.get("tab")    === (p.get("tab")    || "") &&
             u.hash === location.hash;
    } catch(e) { return false; }
  }

  // Update nav active states and pill row — called at init and on hashchange
  function _updateNav(section) {
    // Desktop tabs
    document.querySelectorAll(".sh-tab[data-page]").forEach(t =>
      t.classList.toggle("active", t.dataset.page === section)
    );
    // Mobile bottom tabs
    document.querySelectorAll(".sh-mob-tab[data-page]").forEach(t =>
      t.classList.toggle("active", t.dataset.page === section)
    );
    // Pill subnav
    const subNav = document.getElementById("sh-mob-subnav");
    if (!subNav) return;
    const pills = SH_SUBNAV[section] || [];
    subNav.innerHTML = `<div class="sh-mob-subnav-scroll">${pills.map(p => {
      const active = _pillIsActive(p.href) ? " active" : "";
      return `<a class="sh-mob-pill${active}" href="${p.href}">${p.label}</a>`;
    }).join("")}</div>`;
  }

  _updateNav(activePage);

  // Re-detect section when hash changes (e.g. tapping Resources from Hub)
  window.addEventListener("hashchange", () => _updateNav(_resolveSection()));

  // Mark active desktop dropdown links using same URL matching logic
  document.querySelectorAll(".sh-tab-drop a").forEach(a => {
    a.classList.toggle("active", _pillIsActive(a.getAttribute("href") || ""));
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

  // ── Chat unread badge (live on all pages) ────────────────────────────────────
  let _shChatUnread = 0;
  let _shMyRoomIds  = new Set();
  let _shChatReads  = {};   // chat_id → last_read_at

  // Exposed so chat.html can set the exact count when it has the full picture
  window._shSetChatBadge = function(n) {
    _shChatUnread = Math.max(0, n);
    const badge = document.getElementById("chat-unread-badge");
    if (!badge) return;
    if (_shChatUnread > 0) {
      badge.textContent = _shChatUnread > 99 ? "99+" : String(_shChatUnread);
      badge.style.display = "";
    } else {
      badge.style.display = "none";
    }
  };

  async function _shLoadChatBadge() {
    if (!myEmail || !db) return;

    // Rooms this user belongs to
    const { data: rooms } = await db.from("community_chat_participants")
      .select("room_id").eq("email", myEmail);
    _shMyRoomIds = new Set((rooms || []).map(r => r.room_id));

    // Read timestamps
    const { data: reads } = await db.from("community_chat_reads")
      .select("chat_id, last_read_at").eq("email", myEmail);
    _shChatReads = {};
    (reads || []).forEach(r => { _shChatReads[r.chat_id] = r.last_read_at; });

    // Recent messages not from me — count those newer than last read per chat
    const { data: msgs } = await db.from("community_messages")
      .select("chat_id, email, created_at")
      .neq("email", myEmail)
      .order("created_at", { ascending: false })
      .limit(400);

    let count = 0;
    for (const msg of (msgs || [])) {
      const cid = msg.chat_id;
      const isDM   = cid.includes("|") && cid.includes(myEmail);
      const isRoom = _shMyRoomIds.has(cid);
      if (cid !== "group" && !isDM && !isRoom) continue;
      const lastRead = _shChatReads[cid];
      if (!lastRead || msg.created_at > lastRead) count++;
    }
    window._shSetChatBadge(count);
  }

  // Realtime: increment badge when a new message arrives in any of my chats.
  // If chat.html is active it manages the badge itself via _shSetChatBadge —
  // we skip here to avoid double-counting.
  db.channel("sh-chat-badge-" + myEmail)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_messages" },
      payload => {
        const msg = payload.new;
        if (!msg || msg.email === myEmail) return;
        // Let chat.html own the badge when it's the active page
        if (window._chatPageActive) return;
        const cid  = msg.chat_id;
        const isDM   = cid.includes("|") && cid.includes(myEmail);
        const isRoom = _shMyRoomIds.has(cid);
        if (cid !== "group" && !isDM && !isRoom) return;
        const lastRead = _shChatReads[cid];
        if (lastRead && msg.created_at <= lastRead) return;
        window._shSetChatBadge(_shChatUnread + 1);
      })
    .subscribe();

  _shLoadChatBadge();
};
