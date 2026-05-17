/**
 * shared-header.js
 * Injects the Practice Hub header, notification panel, and mobile sheet
 * into any page that calls initSharedHeader().
 *
 * Usage:
 *   <script src="/shared-header.js"></script>
 *   // then after auth:
 *   initSharedHeader({ db, myEmail, myName, isAdmin, activePage: "events" });
 *
 * activePage values: "hub" | "library" | "events" | "tools" | "feedback"
 */

// ── Inject CSS ────────────────────────────────────────────────────────────────
(function injectCSS() {
  const style = document.createElement("style");
  style.textContent = `
    /* ── Shared header ── */
    #app-header {
      position: sticky; top: 0; z-index: 150;
      background: #000;
      border-bottom: 2px solid var(--accent, #f5c518);
      padding: 20px 32px;
      display: flex; align-items: center; gap: 16px;
    }
    #app-header > div:first-child { flex: 1; }
    #app-header h1 {
      font-size: 1.4rem; font-weight: 700;
      color: #fff; letter-spacing: -0.3px; margin: 0;
    }
    .header-user {
      display: flex; align-items: center; gap: 8px; flex-shrink: 0;
    }
    .header-user .btn-sm {
      display: inline-flex; align-items: center; justify-content: center;
      gap: 5px; height: 30px; padding-top: 0; padding-bottom: 0;
      line-height: 1; white-space: nowrap; box-sizing: border-box;
    }
    #header-email { font-size: 0.82rem; color: var(--text-muted, #888); }

    /* ── Main tab bar ── */
    .main-tab-bar {
      display: flex; gap: 0;
      background: var(--surface, #141414);
      border: 1px solid var(--border, #2a2a2a);
      border-radius: 10px; padding: 3px;
      margin-bottom: 20px; overflow: visible;
    }
    .main-tab {
      width: 100%; min-width: fit-content;
      background: transparent; border: none;
      color: var(--text-muted, #888);
      font-size: 0.82rem; font-weight: 700;
      padding: 8px 12px; border-radius: 8px; cursor: pointer;
      transition: background .15s, color .15s; white-space: nowrap;
      text-decoration: none;
      display: inline-flex; align-items: center; justify-content: center;
      font-family: inherit;
    }
    .main-tab.active { background: var(--accent, #f5c518); color: #1a1410; }
    .main-tab:hover:not(.active) {
      color: var(--text, #e5e5e5);
      background: var(--surface-2, #1e1e1e);
    }
    .main-tab-wrap { position: relative; display: flex; flex: 1; }
    .tab-dropdown {
      display: none; position: absolute; top: 100%; left: 0;
      background: var(--surface, #141414);
      border: 1.5px solid var(--border, #2a2a2a);
      border-top: none; border-radius: 0 0 10px 10px;
      min-width: 190px; z-index: 300;
      box-shadow: 0 8px 28px rgba(0,0,0,.18); padding: 4px 4px 6px;
    }
    .main-tab-wrap:hover .tab-dropdown { display: block; }
    .tab-dd-item {
      display: block; width: 100%; padding: 8px 14px;
      background: none; border: none; border-radius: 6px;
      font-size: .84rem; font-weight: 600;
      color: var(--text-muted, #888);
      cursor: pointer; text-align: left;
      transition: background .12s, color .12s; white-space: nowrap;
      text-decoration: none; font-family: inherit;
    }
    .tab-dd-item:hover {
      background: var(--surface-2, #1e1e1e);
      color: var(--text, #e5e5e5);
    }

    @media (max-width: 600px) {
      #app-header { padding: 14px 16px; }
      #app-header h1 { font-size: 1.1rem; }
      .main-tab { padding: 9px 10px; font-size: 0.78rem; }
      #header-email { display: none; }
    }

    /* ── Bell button ── */
    .btn-bell { position: relative; flex-shrink: 0; }
    .notif-badge {
      position: absolute; top: -5px; right: -5px;
      background: #ef4444; color: #fff;
      font-size: 0.6rem; font-weight: 700;
      min-width: 16px; height: 16px; border-radius: 99px;
      display: flex; align-items: center; justify-content: center;
      padding: 0 3px; line-height: 1; pointer-events: none;
    }

    /* ── Notification overlay + panel ── */
    .notif-overlay {
      position: fixed; inset: 0; z-index: 1099;
      background: transparent; opacity: 0; pointer-events: none;
    }
    .notif-overlay.visible { opacity: 1; pointer-events: all; }
    .notif-panel {
      position: fixed; top: 72px; right: 10px;
      width: min(320px, calc(100vw - 20px));
      background: #141414; border: 1px solid #2a2a2a;
      border-radius: 12px; z-index: 1100;
      display: flex; flex-direction: column;
      box-shadow: 0 10px 40px rgba(0,0,0,.7);
      opacity: 0; transform: translateY(-6px) scale(.97);
      pointer-events: none;
      transition: opacity .17s ease, transform .17s ease; overflow: hidden;
    }
    .notif-panel.open {
      opacity: 1; transform: translateY(0) scale(1); pointer-events: all;
    }
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
    .notif-empty {
      padding: 32px 18px; text-align: center;
      color: #444; font-size: 0.82rem; line-height: 1.6;
    }
    .notif-item {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 11px 14px; border-bottom: 1px solid #1a1a1a;
      cursor: pointer; transition: background .12s;
    }
    .notif-item:last-child { border-bottom: none; }
    .notif-item:hover { background: #1a1a1a; }
    .notif-item.unread { background: #131108; }
    .notif-item.unread:hover { background: #1b190a; }
    .notif-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: var(--accent, #f5c518); flex-shrink: 0; margin-top: 5px;
    }
    .notif-dot.read { background: transparent; }
    .notif-item-body { flex: 1; min-width: 0; }
    .notif-item-title {
      font-size: 0.82rem; font-weight: 600;
      color: #e0e0e0; margin-bottom: 2px; line-height: 1.35;
    }
    .notif-item-desc { font-size: 0.75rem; color: #5a5a5a; line-height: 1.4; }
    .notif-item-time { font-size: 0.68rem; color: #3a3a3a; margin-top: 4px; }
    .notif-admin-wrap {
      border-top: 1px solid #1e1e1e; padding: 12px 14px;
      flex-shrink: 0; background: #0d0d0d;
    }
    .notif-admin-wrap h4 {
      font-size: 0.7rem; color: var(--accent, #f5c518);
      margin: 0 0 8px; text-transform: uppercase; letter-spacing: .08em;
    }
    .notif-admin-wrap input,
    .notif-admin-wrap textarea {
      width: 100%; box-sizing: border-box;
      background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 6px;
      color: #e5e5e5; padding: 6px 9px; font-size: 0.79rem;
      font-family: inherit; margin-bottom: 7px;
    }
    .notif-admin-wrap textarea { resize: none; height: 50px; }

    /* ── Mobile sheet backdrop ── */
    #mob-sheet-backdrop {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,.55); z-index: 180;
      opacity: 0; pointer-events: none; transition: opacity .3s ease;
    }
    #mob-sheet-backdrop.open { opacity: 1; pointer-events: auto; }

    /* ── Mobile sheet ── */
    #mob-sheet {
      position: fixed; bottom: 0; left: 0; right: 0;
      background: #1a1410; border-radius: 18px 18px 0 0;
      z-index: 9999;
      padding-bottom: max(20px, env(safe-area-inset-bottom, 20px));
      max-height: 80vh; overflow-y: auto;
      transform: translateY(100%);
      transition: transform .38s cubic-bezier(0.32, 0.72, 0, 1);
      will-change: transform;
    }
    #mob-sheet.open { transform: translateY(0); }
    .mob-sheet-handle {
      width: 38px; height: 4px; background: rgba(255,255,255,.18);
      border-radius: 2px; margin: 12px auto 2px;
    }
    .mob-sheet-group-toggle {
      display: flex; width: 100%; background: none; border: none;
      border-top: 1px solid rgba(255,255,255,.08);
      padding: 16px 20px; font-size: .68rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: .1em;
      color: rgba(200,180,155,.6); text-align: left;
      cursor: pointer; align-items: center; justify-content: space-between;
      -webkit-tap-highlight-color: transparent; font-family: inherit;
    }
    .mob-sheet-group.open .mob-sheet-group-toggle { color: rgba(240,220,190,.9); }
    .mob-sheet-chevron {
      width: 15px; height: 15px; flex-shrink: 0;
      stroke: currentColor; transition: transform .28s ease;
    }
    .mob-sheet-group.open .mob-sheet-chevron { transform: rotate(180deg); }
    .mob-sheet-group-items {
      overflow: hidden; max-height: 0; transition: max-height .32s ease;
    }
    .mob-sheet-group.open .mob-sheet-group-items { max-height: 600px; }
    .mob-sheet-item {
      display: flex; align-items: center; justify-content: space-between;
      width: 100%; background: none; border: none;
      border-top: 1px solid rgba(255,255,255,.08);
      padding: 14px 20px 14px 32px; font-size: .9rem; color: #e8e0d4;
      text-align: left; cursor: pointer; text-decoration: none;
      -webkit-tap-highlight-color: transparent; font-family: inherit;
    }
    .mob-sheet-item.active { color: var(--accent, #f5c518); font-weight: 700; }
    .mob-sheet-section-btn {
      display: flex; align-items: center; justify-content: space-between;
      width: 100%; background: none; border: none;
      border-top: 1px solid rgba(255,255,255,.08);
      padding: 16px 20px; font-size: .9rem; font-weight: 700;
      color: #e8e0d4; text-align: left; cursor: pointer;
      -webkit-tap-highlight-color: transparent; font-family: inherit;
    }
    .mob-sheet-section-btn.active { color: var(--accent, #f5c518); }
  `;
  document.head.appendChild(style);
})();

// ── Inject HTML ───────────────────────────────────────────────────────────────
(function injectHTML() {
  // Mobile sheet backdrop
  const backdrop = document.createElement("div");
  backdrop.id = "mob-sheet-backdrop";
  backdrop.onclick = () => {
    document.getElementById("mob-sheet")?.classList.remove("open");
    backdrop.classList.remove("open");
  };
  document.body.appendChild(backdrop);

  // Mobile sheet
  const sheet = document.createElement("div");
  sheet.id = "mob-sheet";
  sheet.innerHTML = `
    <div class="mob-sheet-handle"></div>

    <div class="mob-sheet-group">
      <button class="mob-sheet-group-toggle" onclick="window._shToggleGroup(this)">
        Practice Hub
        <svg class="mob-sheet-chevron" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="mob-sheet-group-items">
        <a class="mob-sheet-item" href="/practice-log.html">Dashboard</a>
        <a class="mob-sheet-item" href="/practice-log.html#stats">Stats</a>
        <a class="mob-sheet-item" href="/practice-log.html#goals">Goals</a>
        <a class="mob-sheet-item" href="/practice-log.html#history">History</a>
        <a class="mob-sheet-item" href="/practice-log.html#leaderboard">Leaderboard</a>
        <a class="mob-sheet-item" href="/practice-log.html#community">Community Feed</a>
      </div>
    </div>

    <div class="mob-sheet-group">
      <button class="mob-sheet-group-toggle" onclick="window._shToggleGroup(this)">
        Pieces Library
        <svg class="mob-sheet-chevron" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="mob-sheet-group-items">
        <a class="mob-sheet-item" href="/index.html">All Pieces</a>
        <a class="mob-sheet-item" href="/index.html#books">Books</a>
        <a class="mob-sheet-item" href="/index.html#collection">My Collection</a>
      </div>
    </div>

    <div class="mob-sheet-group">
      <button class="mob-sheet-group-toggle" onclick="window._shToggleGroup(this)">
        Theory
        <svg class="mob-sheet-chevron" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="mob-sheet-group-items">
        <a class="mob-sheet-item" href="/practice-log.html#ppd">Piano Practice Daily</a>
        <a class="mob-sheet-item" href="/practice-log.html#glossary">Glossary</a>
        <a class="mob-sheet-item" href="/practice-log.html#key">Key Explorer</a>
      </div>
    </div>

    <div class="mob-sheet-group">
      <button class="mob-sheet-group-toggle" onclick="window._shToggleGroup(this)">
        Practice Tools
        <svg class="mob-sheet-chevron" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="mob-sheet-group-items">
        <a class="mob-sheet-item" href="/practice-tools.html">Passage Fixer</a>
        <a class="mob-sheet-item" href="/practice-tools.html#metro">Metronome</a>
        <a class="mob-sheet-item" href="/practice-tools.html#note">Note Recognition</a>
      </div>
    </div>

    <a class="mob-sheet-section-btn" href="/feedback.html">Feedback</a>
    <a class="mob-sheet-section-btn" href="/events.html">Events &amp; Replays</a>
  `;
  document.body.appendChild(sheet);

  // Notification overlay + panel
  const overlay = document.createElement("div");
  overlay.className = "notif-overlay";
  overlay.id = "notif-overlay";
  overlay.onclick = () => window._shCloseNotifPanel?.();
  document.body.appendChild(overlay);

  const panel = document.createElement("aside");
  panel.className = "notif-panel";
  panel.id = "notif-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Notifications");
  panel.innerHTML = `
    <div class="notif-panel-head">
      <h3>Notifications</h3>
      <button class="notif-mark-all" onclick="window._shMarkAllRead?.()">Mark all read</button>
      <button class="notif-close-btn" onclick="window._shCloseNotifPanel?.()">✕</button>
    </div>
    <div class="notif-list" id="notif-list">
      <div class="notif-empty">Loading…</div>
    </div>
    <div class="notif-admin-wrap" id="notif-admin-wrap" style="display:none">
      <h4>Send App Update</h4>
      <input id="notif-admin-title" placeholder="Title (e.g. New feature: …)" />
      <textarea id="notif-admin-body" placeholder="More detail (optional)"></textarea>
      <div style="display:flex;gap:8px">
        <button class="btn btn-sm btn-ghost" onclick="window._shSendUpdate?.(false)" style="flex:1;font-size:0.8rem">Send to me</button>
        <button class="btn btn-sm" onclick="window._shSendUpdate?.(true)" style="flex:1;font-size:0.8rem">Broadcast to all</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  // Drag-to-dismiss on mobile sheet
  (function setupDrag() {
    var startY = 0, dragging = false, cancelled = false;
    sheet.addEventListener("touchstart", e => {
      dragging = cancelled = false;
      startY = e.touches[0].clientY;
    }, { passive: true });
    sheet.addEventListener("touchmove", e => {
      var dy = e.touches[0].clientY - startY;
      if (!dragging && sheet.scrollTop > 0) { cancelled = true; }
      if (cancelled) return;
      if (!dragging && dy <= 4) return;
      dragging = true;
      var offset = Math.max(0, dy);
      e.preventDefault();
      sheet.style.transition = "none";
      sheet.style.transform = "translateY(" + offset + "px)";
      backdrop.style.opacity = Math.max(0, 1 - offset / (sheet.offsetHeight * 0.6));
    }, { passive: false });
    sheet.addEventListener("touchend", e => {
      if (!dragging) return;
      dragging = false;
      var dy = e.changedTouches[0].clientY - startY;
      sheet.style.transition = "";
      if (dy > 120 || dy > sheet.offsetHeight * 0.28) {
        sheet.style.transform = "translateY(100%)";
        backdrop.style.opacity = "";
        setTimeout(() => {
          sheet.classList.remove("open");
          backdrop.classList.remove("open");
          sheet.style.transform = "";
          backdrop.style.opacity = "";
        }, 400);
      } else {
        sheet.style.transform = "";
        backdrop.style.opacity = "";
      }
    }, { passive: true });
  })();
})();

// ── Global helpers ─────────────────────────────────────────────────────────────
window._shToggleGroup = function(btn) {
  btn.closest(".mob-sheet-group").classList.toggle("open");
};

window.openMobSheet = function() {
  document.getElementById("mob-sheet")?.classList.add("open");
  document.getElementById("mob-sheet-backdrop")?.classList.add("open");
};

window.closeMobSheet = function() {
  document.getElementById("mob-sheet")?.classList.remove("open");
  document.getElementById("mob-sheet-backdrop")?.classList.remove("open");
};

// ── Main init function ────────────────────────────────────────────────────────
window.initSharedHeader = function({ db, myEmail, myName, isAdmin, activePage = "" }) {
  // Populate header
  const header = document.getElementById("app-header");
  if (header) {
    header.style.display = "";

    // Populate user name / email
    const emailEl = document.getElementById("header-email");
    if (emailEl) emailEl.textContent = myName || myEmail;

    // Show admin link
    const adminLink = document.getElementById("admin-link");
    if (adminLink && isAdmin) adminLink.style.display = "inline-flex";

    // Bell: always visible once logged in
    const bell = document.getElementById("notif-bell-btn");
    if (bell) bell.style.display = "";
  }

  // Show main (in case it was hidden)
  const mainEl = document.getElementById("events-main");
  if (mainEl) mainEl.style.display = "";

  // Mark active tab in the main-tab-bar
  document.querySelectorAll(".main-tab[data-page]").forEach(t => {
    t.classList.toggle("active", t.dataset.page === activePage);
  });

  // Mark active items in the mob sheet
  document.querySelectorAll(".mob-sheet-item[data-page], .mob-sheet-section-btn[data-page]").forEach(t => {
    t.classList.toggle("active", t.dataset.page === activePage);
  });

  // ── Notification state ──────────────────────────────────────────────────────
  let _notifData = [];

  function _esc(str) {
    return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  function _timeAgo(ts) {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  function updateBadge() {
    const unread = _notifData.filter(n => !n.read).length;
    const badge = document.getElementById("notif-badge");
    if (!badge) return;
    if (unread > 0) {
      badge.textContent = unread > 9 ? "9+" : String(unread);
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }
  }

  function renderList() {
    const listEl = document.getElementById("notif-list");
    if (!listEl) return;
    if (!_notifData.length) {
      listEl.innerHTML = `<div class="notif-empty">No notifications yet.<br><span style="color:#333">App updates and activity will appear here.</span></div>`;
      return;
    }
    listEl.innerHTML = _notifData.map(n => `
      <div class="notif-item ${n.read ? "" : "unread"}" data-id="${n.id}" onclick="window._shHandleNotifClick(this)">
        <div class="notif-dot ${n.read ? "read" : ""}"></div>
        <div class="notif-item-body">
          <div class="notif-item-title">${_esc(n.title)}</div>
          ${n.body ? `<div class="notif-item-desc">${_esc(n.body)}</div>` : ""}
          <div class="notif-item-time">${_timeAgo(n.created_at)}</div>
        </div>
      </div>`).join("");
  }

  async function loadNotifs() {
    if (!myEmail || !db) return;
    const { data } = await db.from("notifications")
      .select("*").eq("email", myEmail)
      .order("created_at", { ascending: false }).limit(60);
    _notifData = data || [];
    updateBadge();
  }

  window._shHandleNotifClick = async function(el) {
    const id = el.dataset.id;
    const notif = _notifData.find(n => n.id === id);
    if (notif && !notif.read) {
      notif.read = true;
      updateBadge();
      renderList();
      await db.from("notifications").update({ read: true }).eq("id", id).eq("email", myEmail);
    }
  };

  window._shMarkAllRead = async function() {
    const unreadIds = _notifData.filter(n => !n.read).map(n => n.id);
    if (!unreadIds.length) return;
    _notifData.forEach(n => { n.read = true; });
    updateBadge();
    renderList();
    await db.from("notifications").update({ read: true }).in("id", unreadIds).eq("email", myEmail);
  };

  window._shCloseNotifPanel = function() {
    document.getElementById("notif-panel")?.classList.remove("open");
    document.getElementById("notif-overlay")?.classList.remove("visible");
  };

  window.toggleNotifPanel = function() {
    const panel = document.getElementById("notif-panel");
    if (panel?.classList.contains("open")) {
      window._shCloseNotifPanel();
    } else {
      const bell = document.getElementById("notif-bell-btn");
      if (bell) {
        const rect = bell.getBoundingClientRect();
        const panelW = Math.min(320, window.innerWidth - 20);
        const rightOf = window.innerWidth - rect.right;
        const maxRight = window.innerWidth - panelW - 10;
        panel.style.top = (rect.bottom + 6) + "px";
        panel.style.right = Math.max(10, Math.min(rightOf, maxRight)) + "px";
        panel.style.width = panelW + "px";
      }
      loadNotifs().then(() => renderList());
      panel?.classList.add("open");
      document.getElementById("notif-overlay")?.classList.add("visible");
      // Show admin broadcast section
      if (isAdmin) {
        const adminWrap = document.getElementById("notif-admin-wrap");
        if (adminWrap) adminWrap.style.display = "block";
      }
    }
  };

  window._shSendUpdate = async function(broadcast) {
    const title = document.getElementById("notif-admin-title")?.value.trim();
    const body  = document.getElementById("notif-admin-body")?.value.trim();
    if (!title) { alert("Title is required"); return; }
    if (broadcast) {
      const { data: members } = await db.from("allowed_emails").select("email");
      if (members) {
        for (const m of members) {
          await db.from("notifications").insert({
            email: m.email, type: "app_update", title, body: body || null
          });
        }
      }
    } else {
      await db.from("notifications").insert({
        email: myEmail, type: "app_update", title, body: body || null
      });
    }
    if (document.getElementById("notif-admin-title")) document.getElementById("notif-admin-title").value = "";
    if (document.getElementById("notif-admin-body"))  document.getElementById("notif-admin-body").value  = "";
    alert(broadcast ? "Sent to all members!" : "Sent to you!");
    loadNotifs().then(() => renderList());
  };

  // Load notifications on init
  loadNotifs();

  // Realtime: new notification arrives → update badge
  db.channel("shared-header-notifs")
    .on("postgres_changes", {
      event: "INSERT", schema: "public", table: "notifications",
      filter: `email=eq.${myEmail}`
    }, payload => {
      _notifData.unshift(payload.new);
      updateBadge();
    })
    .subscribe();
};
