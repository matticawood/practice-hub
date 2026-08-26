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
 * activePage values: "hub" | "learn" | "tools" | "community" | "live"
 *
 * Adding a section means touching FIVE places in this file, all hand-maintained:
 *   1. SH_SUBNAV[key]      — the sub-nav links
 *   2. _sbSections         — desktop sidebar entry
 *   3. _sbIcons[key]       — desktop sidebar icon (missing renders "undefined")
 *   4. .sh-tab markup      — desktop top tab
 *   5. .sh-mob-tab markup  — mobile bottom bar
 * and if the sub-nav links vary by a new query param, add it to SUBNAV_PARAMS
 * in _pillIsActive or the whole pill row highlights at once.
 */

// ── Sub-nav data ──────────────────────────────────────────────────────────────
const SH_SUBNAV = {
  /* "hub" is the internal key and stays one, because it is written into page
     declarations, analytics and saved URLs. What the member reads is Practice:
     a hub is a container, and every product has one; Practice is the thing they
     came to do, and it is the room's own word. */
  hub: [
    { label: "Dashboard", href: "/practice-log.html" },
    /* The whole library, not just the collection. Choosing what to play next is
       practice - which is why it sits here rather than in Tools, where it read
       as a utility, or in Learn, where it would have claimed to be something
       Matthew wrote. Its own three tabs - All Pieces, Books, My Collection -
       are inside the page, so this costs the menu nothing: it is the slot "My
       Pieces" already had. */
    { label: "Pieces", href: "/resources.html" },
    { label: "Goals", href: "/practice-log.html?goto=goals" },
    { label: "Roadmap", href: "/practice-log.html?goto=roadmap" },
    /* Stats, History, Ranks and Achievements answer one question - how is it
       going - and they held four of this menu's eight slots between them, which
       flattened the two that are opened daily. They are one destination now,
       and a tab bar on the page moves between them. Nothing was removed: every
       one of them is still a click away, and every other route in still works. */
    { label: "Progress", href: "/practice-log.html?goto=stats" },
  ],
  learn: [
    { label: "Library", href: "/learn.html" },
    /* The courses page, not a filter on the library: course lessons sit in a
       sequence and are not browsable on their own, so type=course matched
       nothing and the item led to an empty library. */
    { label: "Courses", href: "/courses.html" },
    { label: "Videos", href: "/learn.html?type=video" },
    { label: "Clinic replays", href: "/learn.html?type=clinic" },
    /* The real Piano Practice Daily page, not a filter on the library: the
       library view has none of its functionality - the categories, the search,
       the progress, surprise me. Same reasoning as Courses above. */
    { label: "Piano Practice Daily", href: "/resources.html?section=ppd" },
    { label: "Weekly Focus", href: "/focus.html" },
  ],
  /* What is left is what the word actually means: things you operate. The six
     tools, and the two lookups you reach for mid-practice. "All Tools" rather
     than "Practice Tools", which was a label doing no work once the section
     next door is called Practice - and rather than "Tools Library", because
     this app already has a Pieces Library and a Learn library, and a library is
     a catalogue you search, not six things you can see at once. */
  tools: [
    { label: "All Tools", href: "/tools.html" },
    { label: "Glossary", href: "/resources.html?section=glossary" },
    { label: "Key Explorer", href: "/resources.html?section=key" },
  ],

  community: [
    { label: "Feed", href: "/community.html" },
    { label: "Progress", href: "/community.html?filter=progress" },
    { label: "Feedback", href: "/community.html?filter=feedback" },
    { label: "Questions", href: "/community.html?filter=question" },
    { label: "Just Post", href: "/community.html?filter=post" },
    { label: "Practice Logs", href: "/community.html?tab=practice-log" },
    { label: "Chat", href: "/chat.html" },
  ],
  live: [
    { label: "Clinics", href: "/events.html" },
    { label: "One-to-one lessons", href: "/clinic-booking.html" },
  ],
};

// ── CSS ───────────────────────────────────────────────────────────────────────
(function() {
  const s = document.createElement("style");
  s.textContent = `
    /* ── Header background token (matches per-page header colour) ── */
    :root                        { --sh-hdr: #000000; }
    body.hub-mode, body.theory-mode { --sh-hdr: #1a1410; }
    body.tools-mode              { --sh-hdr: #06080f; }

    /* ── Header ── */
    #app-header { position: relative; z-index: 300; background: #141414; border-bottom: 1px solid var(--accent, #f5c518); padding: 0 !important; }
    /* Header content shares the same centered container width as page content,
       so the logo lines up with the content's left edge and the account cluster
       with its right edge. */
    .sh-hdr-inner {
      max-width: 1400px; width: 100%; margin: 0 auto; box-sizing: border-box;
      display: flex; align-items: center; gap: 16px;
      padding: 13px 20px;
      padding-left: max(20px, env(safe-area-inset-left, 0px));
      padding-right: max(20px, env(safe-area-inset-right, 0px));
    }
    #app-header h1 { margin: 0; color: #f5f0e8; white-space: nowrap; flex-shrink: 0; }
    #app-header p { color: #8e8e8e; }
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
    #app-header .btn-ghost, #app-header #header-email { border-color: rgba(255,255,255,.14); color: #9a9a9a; }
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

    /* ── Primary nav (top-bar inline): used on mobile/tablet; replaced by the
       sidebar on desktop. Account cluster pushed right. ── */
    .sh-hdr-left { display: flex; align-items: center; flex: 0 0 auto; min-width: 0; }
    .sh-primary-nav { display: flex; align-items: center; gap: 2px; margin-left: 6px; }
    .header-user { margin-left: auto; }

    /* ── Desktop left sidebar (professional dashboard layout) ── */
    #sh-sidebar { display: none; }
    /* Published as a variable so a page can bleed something out under the
       sidebar - the content rails do - without hardcoding 244 in three
       stylesheets and without having to repeat this breakpoint. It is 0 wherever
       the sidebar is not shown, so the same expression works on a phone. */
    body { --sh-sb-w: 0px; }
    @media (min-width: 1025px), (orientation: landscape) and (min-width: 769px) {
      body { padding-left: 244px; --sh-sb-w: 244px; }
      #sh-sidebar {
        display: flex; flex-direction: column;
        position: fixed; top: 0; left: 0; bottom: 0; width: 244px; z-index: 320;
        background: #141414; border-right: 1px solid rgba(255,255,255,.08);
      }
      .sh-sb-brand {
        display: flex; align-items: center; height: 59px; flex-shrink: 0;
        padding: 0 22px; border-bottom: 1px solid rgba(255,255,255,.06);
      }
      .sh-sb-brand h1 { margin: 0; color: #f5f0e8; font-size: 1.12rem; font-weight: 700; letter-spacing: -.01em; white-space: nowrap; }
      .sh-sb-nav { display: flex; flex-direction: column; gap: 3px; padding: 14px 12px; overflow-y: auto; }
      .sh-sb-item {
        display: flex; align-items: center; gap: 12px;
        padding: 9px 13px; border-radius: 9px;
        color: #9a948a; font-size: 0.9rem; font-weight: 600;
        text-decoration: none; white-space: nowrap;
        transition: background .15s, color .15s;
      }
      .sh-sb-item svg { width: 18px; height: 18px; flex-shrink: 0; }
      .sh-sb-item:hover:not(.active) { background: rgba(255,255,255,.06); color: #f2ede2; }
      .sh-sb-item.active { background: rgba(245,197,24,.16); color: var(--accent, #f5c518); font-weight: 700; }
      .sh-sb-item:focus-visible, .sh-sb-subitem:focus-visible { outline: 2px solid var(--accent, #f5c518); outline-offset: 2px; }
      /* Accordion: the active section's sub-pages expand beneath it.
         Sub-items use a vertical rail (lighter than the parent's filled pill);
         the active item's rail segment + text turn gold, with no fill — so the
         hierarchy reads clearly (section = pill, page = rail item). */
      .sh-sb-group { display: flex; flex-direction: column; }
      .sh-sb-sub { display: none; flex-direction: column; margin: 3px 0 7px 22px; }
      .sh-sb-item.active + .sh-sb-sub { display: flex; }
      .sh-sb-subitem {
        display: block; padding: 6px 12px 6px 18px;
        border-left: 2px solid rgba(255,255,255,.10);
        color: #8a847a; font-size: 0.85rem; font-weight: 500;
        text-decoration: none; white-space: nowrap;
        transition: color .15s, border-color .15s;
      }
      .sh-sb-subitem:hover:not(.active) { color: #e9e4da; border-left-color: rgba(255,255,255,.28); }
      .sh-sb-subitem.active { color: var(--accent, #f5c518); font-weight: 600; border-left-color: var(--accent, #f5c518); }
      /* Sub-pages now live in the sidebar accordion; hide the horizontal sub-nav on desktop. */
      #sh-mob-subnav { display: none !important; }
      /* Top bar becomes a slim utility bar over the content area (sidebar holds nav). */
      #app-header h1, .sh-primary-nav { display: none; }
      /* Consistent 28px gutter from the sidebar across top bar, sub-nav and content. */
      .sh-hdr-inner { padding-left: 28px; padding-right: 28px; }
      main { padding-left: 28px; padding-right: 28px; }
    }
    @media (max-width: 768px), (orientation: portrait) and (max-width: 1024px) {
      #sh-sidebar { display: none; }
    }
    .sh-tab {
      flex: 0 0 auto; background: transparent; border: none;
      color: #9a948a; font-size: 0.85rem; font-weight: 600; letter-spacing: .01em;
      padding: 7px 12px; border-radius: 8px; cursor: pointer;
      transition: background .15s, color .15s; white-space: nowrap;
      text-decoration: none; display: inline-flex; align-items: center; font-family: inherit;
    }
    .sh-tab svg:first-child { width: 16px; height: 16px; margin-right: 6px; flex-shrink: 0; }
    .sh-tab:hover:not(.active) { color: #f2ede2; background: rgba(255,255,255,.06); }
    .sh-tab.active { background: rgba(245,197,24,.16); color: var(--accent, #f5c518); font-weight: 700; }
    /* ── Keyboard-only focus rings (a11y) ── */
    .sh-tab:focus-visible, .sh-mob-pill:focus-visible, .sh-mob-tab:focus-visible { outline: 2px solid var(--accent, #f5c518); outline-offset: 2px; }
    /* ── Hamburger: always hidden ── */
    #sh-hamburger-btn { display: none !important; }
    /* Below the desktop breakpoint the bottom bar takes over: hide inline nav. */
    @media (max-width: 768px), (orientation: portrait) and (max-width: 1024px) {
      .sh-primary-nav { display: none; }
      .sh-hdr-left { flex: 1; gap: 0; }
    }
    /* Squeeze zone: hide the wordmark on smaller laptops so the nav always fits
       (search label also collapses to an icon at <=1100px below). */
    @media (min-width: 769px) and (max-width: 991px) {
      #app-header h1 { display: none; }
    }

    /* ── Mobile bottom tab bar ── */
    #sh-mob-bottom-bar {
      display: none;
    }
    @media (max-width: 768px), (orientation: portrait) and (max-width: 1024px) {
      #sh-mob-bottom-bar {
        display: flex;
        position: fixed;
        bottom: 0; left: 0; right: 0;
        background: #141414;            /* solid neutral dark — uniform on every page */
        border-top: 1px solid rgba(255,255,255,.08);
        box-shadow: 0 -6px 20px -12px rgba(0,0,0,.5);
        padding-bottom: env(safe-area-inset-bottom, 0px);
        z-index: 500;
      }
      /* Hide the bottom nav while the on-screen keyboard is up — otherwise the
         fixed bar floats above the keyboard with a visible gap when you scroll. */
      html.sh-kb-open #sh-mob-bottom-bar { display: none !important; }
      .sh-mob-tab {
        position: relative;
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 9px 2px 7px;
        color: #8a8178;
        text-decoration: none;
        font-size: 0.58rem;
        font-weight: 700;
        letter-spacing: .04em;
        text-transform: uppercase;
        gap: 4px;
        -webkit-tap-highlight-color: transparent;
        transition: color .18s;
      }
      .sh-mob-tab svg {
        flex-shrink: 0; stroke: currentColor; fill: none; width: 23px; height: 23px;
        transition: transform .2s cubic-bezier(.34,1.4,.64,1), filter .2s;
      }
      .sh-mob-tab:active svg { transform: scale(.9); }
      .sh-mob-tab.active { color: var(--accent, #f5c518); }
      .sh-mob-tab.active svg { transform: translateY(-1px) scale(1.08); filter: drop-shadow(0 3px 7px rgba(245,197,24,.5)); }
      /* selection indicator — soft gold bar at the top of the active tab */
      .sh-mob-tab.active::before {
        content: ""; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
        width: 24px; height: 3px; border-radius: 0 0 3px 3px;
        background: var(--accent, #f5c518); box-shadow: 0 0 10px rgba(245,197,24,.6);
      }
      /* push content above bottom bar */
      body { padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px)); }
    }

    /* ── Mobile pill subnav — sticky at top of content, below header ── */
    #sh-mob-subnav {
      display: none;
    }
    /* ── Desktop: secondary nav as light underlined page tabs (GitHub/Stripe style).
       Built from the page's own theme variables so it adapts to light AND dark pages. ── */
    @media (min-width: 1025px), (orientation: landscape) and (min-width: 769px) {
      #sh-mob-subnav {
        display: block;
        background: transparent;
        margin: 0;
      }
      #sh-mob-subnav:empty { display: none; }
      .sh-mob-subnav-scroll {
        display: flex; flex-wrap: wrap; align-items: stretch;
        gap: 26px;
        max-width: 1400px; margin: 0 auto; padding: 0 28px;
        border-bottom: 1px solid var(--border, #e3e1e6);
      }
      .sh-mob-pill {
        display: inline-flex; align-items: center;
        padding: 13px 1px; margin-bottom: -1px;
        border-radius: 0; border: none;
        border-bottom: 2px solid transparent;
        font-size: 0.86rem; font-weight: 600; letter-spacing: 0;
        color: var(--text-muted, #8a7868); background: transparent;
        text-decoration: none; white-space: nowrap;
        transition: color .15s, border-color .15s;
      }
      .sh-mob-pill:hover:not(.active) { color: var(--text, #1a1410); }
      .sh-mob-pill.active {
        color: var(--text, #1a1410); font-weight: 700;
        border-bottom-color: var(--accent, #f5c518);
      }
    }
    @media (max-width: 768px), (orientation: portrait) and (max-width: 1024px) {
      #sh-mob-subnav {
        display: block;
        position: sticky;
        top: 0;
        left: 0; right: 0;
        height: 54px;
        background: #141414;
        border-bottom: 1px solid #2a2a2a;
        z-index: 200;
      }
      .sh-mob-subnav-scroll {
        display: flex;
        align-items: center;
        height: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        padding: 0 14px;
        gap: 8px;
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
      }
      /* The fade says "there is more this way", so it belongs on whichever
         side that is true of, and on neither at rest. Set from JS, which is the
         only thing that can measure it. */
      .sh-mob-subnav-scroll.sh-fade-r {
        -webkit-mask-image: linear-gradient(to right, #000 0, #000 calc(100% - 26px), transparent 100%);
        mask-image: linear-gradient(to right, #000 0, #000 calc(100% - 26px), transparent 100%);
      }
      .sh-mob-subnav-scroll.sh-fade-l {
        -webkit-mask-image: linear-gradient(to right, transparent 0, #000 26px, #000 100%);
        mask-image: linear-gradient(to right, transparent 0, #000 26px, #000 100%);
      }
      .sh-mob-subnav-scroll.sh-fade-l.sh-fade-r {
        -webkit-mask-image: linear-gradient(to right, transparent 0, #000 26px, #000 calc(100% - 26px), transparent 100%);
        mask-image: linear-gradient(to right, transparent 0, #000 26px, #000 calc(100% - 26px), transparent 100%);
      }
      /* Left-aligned by default. A row that scrolls and a row that fills both
         start at the same margin and reach the same edge, so moving between
         sections does not change where the nav begins. Centring is added back
         only above 720px - see the block after this one. */
      .sh-mob-subnav-scroll { justify-content: flex-start; }
      /* Material's two tab modes. FIXED is the default above: equal widths,
         filling the bar. SCROLLING tabs are sized by their label instead, and
         the switch between them is a floor on how narrow an equal tab may get -
         96px in the spec, which is also roughly Apple's "don't force equal
         widths onto labels of very different lengths". Set from JS, which is
         the only thing that can divide the bar by the number of pills. */
      .sh-mob-subnav-scroll.sh-labelwidth .sh-mob-pill { flex: 0 0 auto; }
      .sh-mob-subnav-scroll::-webkit-scrollbar { display: none; }
      .sh-mob-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        /* Basis zero, not auto. Growing from auto adds the SAME number of px to
           every pill, so they keep their natural differences and the row reads
           as five different-sized buttons. From zero they SHARE the row, so
           they come out equal - which is what the cap was accidentally doing on
           iPad, where every pill hits 156 and they all match.
           min-width:max-content still holds the floor, so a label too long for
           its equal share keeps its own width instead of being squeezed, and a
           row that cannot fit still refuses to shrink and scrolls. */
        flex: 1 1 0;
        min-width: max-content;
        padding: 10px 15px;
        border-radius: 10px;
        font-size: 0.78rem;
        font-weight: 600;
        color: #aaa;
        background: #252525;
        text-decoration: none;
        white-space: nowrap;
        transition: background .15s, color .15s, transform .12s;
        -webkit-tap-highlight-color: transparent;
        min-height: 44px;
      }
      /* On a phone the rows are tight enough that a few px of padding decides
         whether five pills fit the screen or hang a third of one off the edge.
         Practice measures 463px wide at the roomier setting and 425 here, which
         is the difference between overflowing a large phone by a hair - the
         worst of both, clipped but barely draggable - and simply fitting. */
      @media (max-width: 560px) {
        .sh-mob-subnav-scroll { padding: 0 12px; gap: 7px; }
        .sh-mob-pill { padding: 10px 12px; }
      }
      .sh-mob-subnav-scroll.sh-has-right .sh-mob-pill { flex: 0 0 auto; max-width: none; }
      .sh-mob-subnav-scroll.sh-has-right { justify-content: flex-start; }
      .sh-mob-pill:active { transform: scale(.96); }
      .sh-mob-pill.active {
        background: #f5c518;
        color: #1a1410;
        font-weight: 800;
      }
    }

    /* ── Tablet portrait: nothing ever scrolls, so everything can centre ────
       The widest row in the whole app is Learn at 670px. Above 720 every
       section fits, which means the centred state is the ONLY state at these
       widths - no section centres while its neighbour scrolls. Below 720 some
       rows fit and some do not, so there they all stay left-aligned and the two
       states read the same.

       The cap belongs here for the same reason: it only bites where there is
       slack. 156px is the longest label in the nav ("One-to-one lessons"), so
       no pill is ever wider than the widest thing the nav has to say - which is
       what stops the two-item Live row becoming two slabs with a five-letter
       word floating in each. min-width:max-content still wins over it, so a
       longer label is never squeezed. ── */
    @media (min-width: 720px) and (max-width: 768px),
           (orientation: portrait) and (min-width: 720px) and (max-width: 1024px) {
      .sh-mob-pill { max-width: 156px; }
      .sh-mob-subnav-scroll:not(.sh-scrollable) { justify-content: center; }
      .sh-mob-subnav-scroll.sh-has-right { justify-content: flex-start; }
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
    .notif-empty { padding: 32px 18px; text-align: center; color: #8a8378; font-size: 0.82rem; line-height: 1.6; }
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
    .notif-item-badge { flex-shrink: 0; display: flex; align-items: center; }
    .notif-item-badge svg { display: block; }
    /* Achievement badge → glowing medallion disc, tuned for the dark notification panel. */
    .notif-ach-medal { position: relative; overflow: hidden; width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: radial-gradient(circle at 50% 34%, rgba(255,255,255,.14), var(--g0, rgba(245,158,11,.18)) 70%, rgba(0,0,0,.35));
      box-shadow: 0 0 0 1.5px var(--g1, rgba(245,158,11,.45)), 0 0 16px -2px var(--g2, #f59e0b), inset 0 1px 1px rgba(255,255,255,.16); }
    .notif-ach-medal > svg { width: 30px; height: 30px; display: block; }
    .notif-ach-medal::after { content: ""; position: absolute; top: -40%; left: -60%; width: 45%; height: 180%; background: linear-gradient(90deg, transparent, rgba(255,255,255,.6), transparent); transform: rotate(20deg); pointer-events: none; animation: notifAchSheen 4.5s ease-in-out infinite; }
    @keyframes notifAchSheen { 0% { left: -60%; } 18% { left: 130%; } 100% { left: 130%; } }
    @media (prefers-reduced-motion: reduce) { .notif-ach-medal::after { display: none; } }
    .notif-item-title { font-size: 0.82rem; font-weight: 600; color: #e0e0e0; margin-bottom: 2px; line-height: 1.35; }
    /* The body and timestamp were #5a5a5a and #3a3a3a on a near-black panel,
       about 2.6:1 and 1.5:1 against it, so the actual message was the hardest
       thing in the panel to read. These are warm greys from the same family the
       app uses elsewhere on dark, at roughly 7.7:1 and 5:1. */
    .notif-item-desc { font-size: 0.75rem; color: #a8a196; line-height: 1.4; }
    .notif-item-time { font-size: 0.68rem; color: #8a8378; margin-top: 4px; }
    .notif-admin-wrap { border-top: 1px solid #1e1e1e; padding: 12px 14px; flex-shrink: 0; background: #0d0d0d; }
    .notif-admin-wrap h4 { font-size: 0.7rem; color: var(--accent, #f5c518); margin: 0 0 8px; text-transform: uppercase; letter-spacing: .08em; }
    .notif-admin-wrap input, .notif-admin-wrap textarea {
      width: 100%; box-sizing: border-box; background: #1a1a1a; border: 1px solid #2a2a2a;
      border-radius: 6px; color: #e5e5e5; padding: 6px 9px; font-size: 0.79rem;
      font-family: inherit; margin-bottom: 7px;
    }
    .notif-admin-wrap textarea { resize: none; height: 50px; }

    /* ── Admin presence indicator + panel ──────────────────────────────────── */
    #presence-btn {
      display: none; align-items: center; gap: 5px;
      background: transparent; border: 1.5px solid rgba(255,255,255,.14);
      color: rgba(255,255,255,.75);
      padding: 6px 12px; border-radius: var(--radius); line-height: 20px;
      font-family: inherit; font-size: 0.8rem; font-weight: 700;
      cursor: pointer; transition: border-color .12s, color .12s;
    }
    #presence-btn:hover { border-color: #22c55e; color: #22c55e; }
    #presence-btn .presence-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,.7);
      flex-shrink: 0;
    }
    #presence-btn .presence-count { line-height: 20px; }
    .presence-panel {
      position: fixed; top: 72px; right: 10px;
      width: min(340px, calc(100vw - 20px));
      max-height: calc(100vh - 100px);
      background: #141414; border: 1px solid #2a2a2a; border-radius: 12px;
      z-index: 1100; display: flex; flex-direction: column;
      box-shadow: 0 10px 40px rgba(0,0,0,.7);
      opacity: 0; transform: translateY(-6px) scale(.97); pointer-events: none;
      transition: opacity .17s ease, transform .17s ease; overflow: hidden;
    }
    .presence-panel.open { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }
    .presence-panel-head {
      display: flex; align-items: center; gap: 6px;
      padding: 12px 14px 10px; border-bottom: 1px solid #1e1e1e; flex-shrink: 0;
    }
    .presence-panel-head h3 { flex: 1; margin: 0; font-size: 0.92rem; color: #fff; }
    .presence-close-btn {
      background: none; border: none; cursor: pointer;
      color: #555; font-size: 1rem; padding: 3px 7px; border-radius: 5px;
      transition: color .12s; line-height: 1;
    }
    .presence-close-btn:hover { color: #fff; }
    .presence-list { overflow-y: auto; padding: 4px 0; }
    .presence-section-label {
      font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .08em; color: #5a5a5a;
      padding: 12px 14px 6px;
    }
    .presence-section-label .count { color: #22c55e; margin-left: 4px; }
    .presence-row {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 14px; transition: background .12s;
    }
    .presence-row:hover { background: #1a1a1a; }
    .presence-row .pres-avatar {
      width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
      background: #1a1a1a; overflow: hidden;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.65rem; font-weight: 800; color: rgba(255,255,255,.7);
    }
    .presence-row .pres-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .presence-row .pres-body { flex: 1; min-width: 0; }
    .presence-row .pres-name {
      font-size: 0.84rem; font-weight: 600; color: #e0e0e0;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .presence-row .pres-meta {
      font-size: 0.72rem; color: #6a6a6a; line-height: 1.4;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .presence-row.online .pres-name::after {
      content: ""; display: inline-block;
      width: 6px; height: 6px; border-radius: 50%;
      background: #22c55e; margin-left: 6px; vertical-align: middle;
    }
    .presence-empty {
      padding: 18px 16px; text-align: center; color: #555; font-size: 0.78rem;
    }

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
      display: flex; flex-direction: column; overflow: hidden;
      text-align: left;
      opacity: 0; visibility: hidden; transform: translateY(-6px) scale(.98);
      transform-origin: top right;
      transition: opacity .14s ease, transform .14s ease, visibility .14s;
    }
    .sh-user-menu.open { opacity: 1; visibility: visible; transform: translateY(0) scale(1); }
    /* Skip-to-content link: off-screen until keyboard-focused, then pinned top-left. */
    .sh-skip {
      position: absolute; left: 10px; top: 8px; z-index: 1200;
      background: var(--accent, #f5c518); color: #1a1410;
      font-weight: 800; font-size: 0.82rem; text-decoration: none;
      padding: 9px 14px; border-radius: 9px;
      box-shadow: 0 6px 18px -6px rgba(0,0,0,.5);
      transform: translateY(-150%); opacity: 0; pointer-events: none;
      transition: transform .16s ease, opacity .16s ease;
    }
    .sh-skip:focus, .sh-skip:focus-visible {
      transform: translateY(0); opacity: 1; pointer-events: auto;
      outline: 2px solid #1a1410; outline-offset: 2px;
    }
    @media (prefers-reduced-motion: reduce) {
      .sh-tab, .sh-tab-caret, .sh-tab-drop, .sh-mob-pill, .sh-mob-tab,
      .sh-mob-tab svg, .sh-user-menu, #presence-btn {
        transition: none !important; animation: none !important;
      }
      .sh-tab:active, .sh-mob-pill:active, .sh-mob-tab:active svg { transform: none !important; }
    }
    .sh-user-menu-item {
      display: block; width: 100%; padding: 11px 16px;
      background: none; border: none; border-bottom: 1px solid #1e1e1e;
      font-size: 0.85rem; color: #e0e0e0; text-align: left;
      cursor: pointer; text-decoration: none; font-family: inherit;
      transition: background .12s;
    }
    .sh-user-menu-item:last-child { border-bottom: none; }
    .sh-user-menu-item:hover { background: #1e1e1e; }

    /* ── Auto-linkified URLs inside user content (posts / comments / replies) ── */
    a.linkified {
      color: var(--accent, #2563eb);
      text-decoration: underline;
      text-underline-offset: 2px;
      word-break: break-word;
      overflow-wrap: anywhere;
    }
    a.linkified:hover { opacity: .82; }

    /* ── @mention tag (rendered inside posts / comments / replies) ── */
    a.mention-tag {
      color: var(--accent, #2563eb);
      font-weight: 600;
      text-decoration: none;
      background: color-mix(in srgb, var(--accent, #2563eb) 12%, transparent);
      border-radius: 5px;
      padding: 0 3px;
    }
    a.mention-tag:hover { text-decoration: underline; }

    /* ── @mention autocomplete dropdown (shared across all composers) ── */
    #mention-drop {
      position: fixed; z-index: 99999; min-width: 200px; max-width: 280px;
      max-height: 248px; overflow-y: auto;
      background: var(--surface, #1a1410); border: 1px solid var(--border, #333);
      border-radius: 12px; padding: 5px; box-shadow: 0 10px 30px rgba(0,0,0,.28);
    }
    #mention-drop .mention-opt {
      display: flex; align-items: center; gap: 9px; padding: 7px 9px;
      border-radius: 8px; cursor: pointer; font-size: .85rem; color: var(--text, #eee);
    }
    #mention-drop .mention-opt.is-active,
    #mention-drop .mention-opt:hover { background: var(--surface-2, rgba(255,255,255,.07)); }
    #mention-drop .mention-opt-av {
      width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0; object-fit: cover;
      display: flex; align-items: center; justify-content: center;
      font-size: .66rem; font-weight: 700; color: #fff; background: #6b6253;
    }
    #mention-drop .mention-opt-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* ── Save / bookmark button on standalone post pages ── */
    .sp-save-btn {
      display: inline-flex; align-items: center; gap: 6px;
      background: none; border: 1px solid var(--border, #333); border-radius: 8px;
      color: var(--text-muted, #888); font-family: inherit; font-size: .8rem; font-weight: 600;
      padding: 6px 12px; cursor: pointer; transition: color .15s, border-color .15s, background .15s;
    }
    .sp-save-btn:hover { color: var(--text, #eee); border-color: var(--accent, #f5c518); }
    .sp-save-btn.is-saved { color: var(--accent, #f5c518); border-color: var(--accent, #f5c518); }
    .sp-save-btn svg { flex-shrink: 0; }
    /* Ghost variant for feed-card footers (icon only, matches sibling buttons) */
    .sp-save-ghost {
      display: inline-flex; align-items: center; gap: 5px;
      background: none; border: none; cursor: pointer; font-family: inherit;
      font-size: .8rem; font-weight: 600; color: var(--text-muted, #888);
      padding: 4px 6px; border-radius: 6px; transition: color .15s, background .15s;
    }
    .sp-save-ghost:hover { color: var(--text, #eee); background: rgba(0,0,0,.05); }
    .sp-save-ghost.is-saved { color: var(--accent, #f5c518); }
    .sp-save-ghost svg { flex-shrink: 0; }

    /* ── Header search button (opens command palette) ── */
    #sh-search-btn {
      display: inline-flex; align-items: center; gap: 7px;
      background: rgba(255,255,255,.05); border: 1.5px solid rgba(255,255,255,.12);
      color: #9a9a9a; cursor: pointer; font-family: inherit;
      padding: 6px 10px; border-radius: var(--radius, 9px); line-height: 20px;
      transition: background .15s, color .15s, border-color .15s;
    }
    #sh-search-btn:hover { background: rgba(255,255,255,.09); color: #e8e3da; border-color: rgba(255,255,255,.2); }
    #sh-search-btn svg { flex-shrink: 0; }
    .sh-search-label { font-size: .82rem; font-weight: 600; }
    .sh-search-kbd {
      font-family: inherit; font-size: .68rem; font-weight: 700; color: #c9c4ba;
      background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12);
      border-radius: 5px; padding: 1px 5px; line-height: 1.4;
    }
    #sh-search-btn:focus-visible { outline: 2px solid var(--accent, #f5c518); outline-offset: 2px; }
    @media (max-width: 1100px) {
      .sh-search-label, .sh-search-kbd { display: none; }
      #sh-search-btn { padding: 7px; }
    }

    /* ── Command palette ── */
    #sh-palette-backdrop {
      position: fixed; inset: 0; z-index: 2000;
      background: rgba(8,8,8,.62); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);
      opacity: 0; visibility: hidden; transition: opacity .16s ease, visibility .16s;
      display: flex; align-items: flex-start; justify-content: center;
      padding: clamp(40px, 12vh, 140px) 16px 16px;
    }
    #sh-palette-backdrop.open { opacity: 1; visibility: visible; }
    #sh-palette {
      width: min(620px, 100%); max-height: min(70vh, 560px);
      background: #16161a; border: 1px solid #2c2c32; border-radius: 14px;
      box-shadow: 0 24px 70px -18px rgba(0,0,0,.8);
      display: flex; flex-direction: column; overflow: hidden;
      transform: translateY(-10px) scale(.985); transition: transform .16s ease;
    }
    #sh-palette-backdrop.open #sh-palette { transform: translateY(0) scale(1); }
    .sh-pal-inputrow { display: flex; align-items: center; gap: 11px; padding: 15px 18px; border-bottom: 1px solid #26262c; }
    .sh-pal-inputrow svg { flex-shrink: 0; color: #6b6b73; }
    #sh-palette-input {
      flex: 1; background: none; border: none; outline: none;
      color: #f3efe7; font-family: inherit; font-size: 1.02rem; font-weight: 500;
    }
    #sh-palette-input::placeholder { color: #6b6b73; }
    .sh-pal-esc {
      font-size: .66rem; font-weight: 700; color: #8a8a93;
      background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1);
      border-radius: 5px; padding: 2px 6px; flex-shrink: 0;
    }
    .sh-pal-results { overflow-y: auto; padding: 7px; flex: 1; }
    .sh-pal-group-label {
      font-size: .67rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase;
      color: #6b6b73; padding: 10px 11px 5px;
    }
    .sh-pal-item {
      display: flex; align-items: center; gap: 12px;
      padding: 9px 11px; border-radius: 9px; cursor: pointer;
      text-decoration: none; color: #d7d2c8; scroll-margin: 8px;
    }
    .sh-pal-item:hover, .sh-pal-item.sh-pal-active { background: rgba(255,255,255,.06); }
    .sh-pal-item.sh-pal-active { box-shadow: inset 0 0 0 1px rgba(245,197,24,.4); }
    .sh-pal-ico {
      flex-shrink: 0; width: 30px; height: 30px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,.06); color: #b6b0a4;
    }
    .sh-pal-ico svg { width: 16px; height: 16px; }
    .sh-pal-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
    .sh-pal-title { display: block; font-size: .9rem; font-weight: 650; color: #ece7dd; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sh-pal-sub { display: block; font-size: .76rem; color: #84808a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sh-pal-tag { flex-shrink: 0; font-size: .68rem; font-weight: 700; color: #8a8a93; }
    .sh-pal-active .sh-pal-tag { color: var(--accent, #f5c518); }
    .sh-pal-empty { padding: 34px 16px; text-align: center; color: #6b6b73; font-size: .88rem; }
    .sh-pal-hint-row {
      display: flex; gap: 14px; flex-wrap: wrap; justify-content: center;
      padding: 9px 14px; border-top: 1px solid #26262c; font-size: .72rem; color: #6b6b73;
    }
    .sh-pal-hint-row kbd {
      font-family: inherit; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1);
      border-radius: 4px; padding: 0 5px; font-size: .68rem; color: #a8a3aa; margin: 0 2px;
    }
    @media (max-width: 640px) { .sh-pal-hint-row { display: none; } }
    @media (prefers-reduced-motion: reduce) {
      #sh-palette-backdrop, #sh-palette { transition: none !important; }
      #sh-palette { transform: none !important; }
    }
  `;
  document.head.appendChild(s);
})();

// ── Auto-linkify URLs in user-generated text ────────────────────────────────
// Single source of truth for turning raw post/comment/reply text into safe HTML
// with clickable links. ALWAYS HTML-escapes first (XSS-safe), then converts bare
// http(s):// and www. URLs into anchors that open in a new tab / the system
// browser on the app. Links call stopPropagation so tapping one inside a
// clickable post card doesn't also open the card.
window.linkifyText = function(raw) {
  const s = String(raw == null ? "" : raw);
  const esc = s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  return esc.replace(/(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi, (match) => {
    let url = match, trail = "";
    // Peel trailing sentence punctuation, but keep a ')' that balances a '(' in
    // the URL itself (e.g. /wiki/Sonata_(music)).
    while (url.length) {
      const last = url[url.length - 1];
      if (".,!?]".indexOf(last) !== -1) { trail = last + trail; url = url.slice(0, -1); }
      else if (last === ")") {
        const opens  = (url.match(/\(/g) || []).length;
        const closes = (url.match(/\)/g) || []).length;
        if (closes > opens) { trail = last + trail; url = url.slice(0, -1); }
        else break;
      } else break;
    }
    if (!url) return match;
    const href = /^https?:\/\//i.test(url) ? url : "https://" + url;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="linkified" onclick="event.stopPropagation()">${url}</a>${trail}`;
  });
};

// ── @mention engine ─────────────────────────────────────────────────────────
// One shared module powering @-autocomplete in every composer, plus mention
// extraction (for notifications) and rendering (clickable tags). Pages opt a
// textarea in by giving it the attribute `data-mention`. Members are loaded
// once from allowed_emails. initSharedHeader() wires in the db + current user.
window.Mentions = (function() {
  const NAME_FRAG = /@([\w\sÀ-ÿ\-.']{0,40})$/;      // the @word being typed before the caret
  // System / burner / reviewer accounts — never surfaced as taggable people.
  const HIDDEN = new Set([
    "reviewer@matthewcawood.com",
    "enquiries@matthewcawood.com",
    "mcawoodcanada@gmail.com",
  ]);
  let _db = null, _me = "", _members = [], _loaded = false;
  let _rawMap = {};      // raw name  → member (for extract)
  let _escMap = {};      // escaped name → member (for render)
  let _ta = null, _idx = -1, _matches = [], _open = false;

  function _esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function _reEsc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  async function _ensure() {
    if (_loaded || !_db) return;
    _loaded = true;
    try {
      const { data } = await _db.from("allowed_emails").select("email,name,avatar_url");
      _members = (data || []).filter(m =>
        m.name && m.name.trim() && !HIDDEN.has((m.email || "").toLowerCase()));
      _rawMap = {}; _escMap = {};
      _members.forEach(m => { _rawMap[m.name] = m; _escMap[_esc(m.name)] = m; });
    } catch (e) { _members = []; }
  }

  function _drop() {
    let d = document.getElementById("mention-drop");
    if (!d) { d = document.createElement("div"); d.id = "mention-drop"; d.style.display = "none"; document.body.appendChild(d); }
    return d;
  }
  function _close() { const d = document.getElementById("mention-drop"); if (d) d.style.display = "none"; _open = false; _idx = -1; _matches = []; _ta = null; }

  function _position(ta) {
    const d = _drop(), r = ta.getBoundingClientRect();
    d.style.visibility = "hidden"; d.style.display = "block";
    const dh = d.offsetHeight, dw = d.offsetWidth;
    let top = r.bottom + 4;
    if (top + dh > window.innerHeight - 8) top = Math.max(8, r.top - dh - 4); // flip above
    let left = Math.min(r.left, window.innerWidth - dw - 8);
    d.style.top = top + "px"; d.style.left = Math.max(8, left) + "px";
    d.style.visibility = "visible";
  }

  function _render() {
    const d = _drop();
    d.innerHTML = _matches.map((m, i) => {
      const ini = (m.name || "?").split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
      const av = m.avatar_url
        ? `<img class="mention-opt-av" src="${_esc(m.avatar_url)}" alt="">`
        : `<span class="mention-opt-av">${ini}</span>`;
      return `<div class="mention-opt${i === _idx ? " is-active" : ""}" data-i="${i}">${av}<span class="mention-opt-name">${_esc(m.name)}</span></div>`;
    }).join("");
    d.querySelectorAll(".mention-opt").forEach(el => {
      el.addEventListener("mousedown", ev => { ev.preventDefault(); _pick(+el.dataset.i); });
    });
    d.style.display = "block";
  }

  function _onInput(ta) {
    _ensure();
    const pos = ta.selectionStart;
    const before = (ta.value || "").slice(0, pos);
    const m = before.match(NAME_FRAG);
    if (!m) { _close(); return; }
    const q = m[1].toLowerCase().trim();
    _matches = _members.filter(mem => mem.name.toLowerCase().includes(q)).slice(0, 8);
    if (!_matches.length) { _close(); return; }
    _ta = ta; _idx = 0; _open = true;
    _render(); _position(ta);
  }

  function _move(delta) {
    if (!_matches.length) return;
    _idx = (_idx + delta + _matches.length) % _matches.length;
    const d = _drop();
    d.querySelectorAll(".mention-opt").forEach((el, i) => el.classList.toggle("is-active", i === _idx));
  }

  function _pick(i) {
    const mem = _matches[i]; const ta = _ta;
    if (!mem || !ta) { _close(); return; }
    const pos = ta.selectionStart;
    const before = (ta.value || "").slice(0, pos);
    const after = (ta.value || "").slice(pos);
    const replaced = before.replace(NAME_FRAG, "@" + mem.name + " ");
    ta.value = replaced + after;
    const np = replaced.length;
    ta.setSelectionRange(np, np);
    ta.focus();
    try { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 160) + "px"; } catch (e) {}
    _close();
  }

  function _onKeydown(e) {
    if (!_open) return;
    if (e.key === "ArrowDown")      { e.preventDefault(); e.stopPropagation(); _move(1); }
    else if (e.key === "ArrowUp")   { e.preventDefault(); e.stopPropagation(); _move(-1); }
    else if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); e.stopPropagation(); _pick(_idx); }
    else if (e.key === "Escape")    { e.preventDefault(); e.stopPropagation(); _close(); }
  }

  // Global delegation — works for composers rendered after page load.
  document.addEventListener("input", e => {
    const t = e.target;
    if (t && t.matches && t.matches("textarea[data-mention]")) _onInput(t);
  });
  document.addEventListener("keydown", _onKeydown, true); // capture: beat inline Enter-to-send
  document.addEventListener("click", e => {
    if (!e.target.closest("#mention-drop") && !(e.target.matches && e.target.matches("textarea[data-mention]"))) _close();
  });

  return {
    _init(db, myEmail) { _db = db; _me = (myEmail || "").toLowerCase(); _ensure(); },
    members() { return _members; },

    // Members explicitly @-named in the text → array of {email,name,avatar_url}.
    extract(text) {
      if (!text || !_members.length) return [];
      const names = _members.map(m => m.name).sort((a, b) => b.length - a.length);
      const re = new RegExp("@(" + names.map(_reEsc).join("|") + ")(?![\\w])", "g");
      const found = new Map(); let m;
      while ((m = re.exec(text))) { const mem = _rawMap[m[1]]; if (mem) found.set(mem.email, mem); }
      return [...found.values()];
    },

    // Wrap @Name occurrences in clickable profile links. Input must already be
    // HTML-escaped (we match on escaped names). Single pass — no nested tags.
    render(escapedHtml) {
      if (!escapedHtml || !_members.length) return escapedHtml;
      const names = Object.keys(_escMap).sort((a, b) => b.length - a.length);
      if (!names.length) return escapedHtml;
      const re = new RegExp("@(" + names.map(_reEsc).join("|") + ")(?![\\w])", "g");
      return escapedHtml.replace(re, (mm, p1) => {
        const mem = _escMap[p1];
        if (!mem) return mm;
        return `<a href="/profile.html?u=${encodeURIComponent(mem.email)}" class="mention-tag" onclick="event.stopPropagation()">@${p1}</a>`;
      });
    },

    // Extract mentions from `text` and insert "mention" notifications (skips the
    // author and any emails in `exclude`). Best-effort, never throws.
    async notify(text, { fromName, body, linkUrl, exclude } = {}) {
      try {
        if (!_db) return;
        const mems = this.extract(text);
        if (!mems.length) return;
        const ex = new Set([_me, ...((exclude || []).map(e => (e || "").toLowerCase()))]);
        const rows = mems
          .filter(m => m.email && !ex.has(m.email.toLowerCase()))
          .map(m => ({
            email: m.email, type: "mention",
            title: `${fromName || "Someone"} mentioned you`,
            body: (body || "").slice(0, 120),
            link_url: linkUrl || "",
            metadata: {},
          }));
        if (rows.length) await _db.from("notifications").insert(rows);
      } catch (e) { /* best-effort */ }
    },
  };
})();

// Full user-content renderer: escape + linkify URLs + clickable @mentions.
// Use this for any post / comment / reply body.
window.renderUserContent = function(raw) {
  const linked = window.linkifyText ? window.linkifyText(raw) : String(raw == null ? "" : raw);
  return window.Mentions ? window.Mentions.render(linked) : linked;
};

// ── Saved / bookmarked posts (shared across standalone post pages) ───────────
// Mirrors community.html's save logic against the same `saved_posts` table, so a
// post saved on content-feed/updates/focus shows up in the community Saved tab
// and vice-versa. initSharedHeader() wires in the db + current user.
window.SavedPosts = (function() {
  let _db = null, _me = "", _set = new Set(), _loaded = false;

  function _icon(saved) {
    return `<svg viewBox="0 0 24 24" width="16" height="16" fill="${saved ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
  }
  function _apply(btn, saved) {
    btn.classList.toggle("is-saved", saved);
    btn.title = saved ? "Saved — tap to remove" : "Save post";
    const labelled = btn.hasAttribute("data-save-labelled");
    btn.innerHTML = _icon(saved) + (labelled ? `<span>${saved ? "Saved" : "Save"}</span>` : "");
  }
  function _sync(key, saved) {
    document.querySelectorAll(`[data-save-key="${key}"]`).forEach(b => _apply(b, saved));
  }
  function _resyncAll() {
    document.querySelectorAll("[data-save-key]").forEach(b => _apply(b, _set.has(b.getAttribute("data-save-key"))));
  }
  async function _load() {
    if (!_db || !_me) return;
    try {
      const { data } = await _db.from("saved_posts").select("post_type,post_id").eq("email", _me);
      _set = new Set((data || []).map(r => r.post_type + ":" + r.post_id));
      _loaded = true;
      _resyncAll();
    } catch (e) { /* table missing / offline — degrade */ }
  }

  return {
    _init(db, myEmail) { _db = db; _me = myEmail || ""; _load(); },
    isSaved(type, id) { return _set.has(type + ":" + id); },

    // Markup for a save button. Options:
    //   className: "sp-save-btn" (bordered pill, default) | "sp-save-ghost" (icon)
    //   labelled:  show "Save"/"Saved" text (defaults true for the pill)
    // State auto-syncs once the saved set loads, even if rendered beforehand.
    buttonHTML(type, id, opts) {
      opts = opts || {};
      const cls = opts.className || "sp-save-btn";
      const labelled = opts.labelled !== undefined ? opts.labelled : (cls === "sp-save-btn");
      const saved = _set.has(type + ":" + id);
      return `<button class="${cls}${saved ? " is-saved" : ""}" data-save-key="${type}:${id}"${labelled ? " data-save-labelled" : ""} title="${saved ? "Saved — tap to remove" : "Save post"}" onclick="SavedPosts.toggle(event,'${type}','${id}',this)">${_icon(saved)}${labelled ? `<span>${saved ? "Saved" : "Save"}</span>` : ""}</button>`;
    },

    async toggle(event, type, id, btn) {
      if (event) event.stopPropagation();
      if (!_db || !_me) return;
      const key = type + ":" + id;
      const saving = !_set.has(key);
      if (saving) _set.add(key); else _set.delete(key);
      _sync(key, saving);
      try {
        if (saving) {
          await _db.from("saved_posts").upsert(
            { email: _me, post_type: type, post_id: id }, { onConflict: "email,post_type,post_id" });
        } else {
          await _db.from("saved_posts").delete()
            .eq("email", _me).eq("post_type", type).eq("post_id", id);
        }
      } catch (e) {
        if (saving) _set.delete(key); else _set.add(key);
        _sync(key, !saving);
      }
    },
  };
})();

// ── Apple Smart App Banner ───────────────────────────────────────────────────
// Drops Apple's native "Get the App" banner at the top of Safari iOS pages.
// Skipped when we're already inside the native PWAShell wrapper so we don't
// nag users who already have the app installed.
(function _shAppleAppBanner() {
  try {
    if (/PWAShell/i.test(navigator.userAgent || "")) return;
    const meta = document.createElement("meta");
    meta.name    = "apple-itunes-app";
    meta.content = "app-id=6773475130";
    document.head.appendChild(meta);
  } catch (e) { /* silent */ }
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
// Builds all the shared chrome (header, sub-nav, sidebar, bottom bar, notif +
// presence panels). Idempotent: safe to call multiple times — only the first
// call does the work. Runs from whichever fires first, DOMContentLoaded or
// initSharedHeader (auth can resolve from cache *before* DOMContentLoaded, which
// previously left the header revealed-but-unbuilt, hiding the bell/search/nav
// until a manual refresh).
// "Take the tour again" replays THIS page's tour (dashboard, community, resources each
// have their own), not always the dashboard's — reload the current page with ?tour=1,
// which every page's tour code treats as a force. Preserves other params (e.g. ?u=).
window._shTakeTourAgain = function (e) {
  if (e && e.preventDefault) e.preventDefault();
  try { var u = new URL(location.href); u.searchParams.set("tour", "1"); location.href = u.toString(); }
  catch (_) { location.href = "/practice-log.html?tour=1"; }
  return false;
};
function _shBuildChrome() {
  if (window.__shChromeBuilt) return;
  if (!document.body) return; // body not parsed yet — wait for DOMContentLoaded
  // The #app-header element must be parsed before we commit. initSharedHeader can fire
  // before DOMContentLoaded (auth resolves from cache), so if this runs that early, bail
  // WITHOUT marking built — a later call (DOMContentLoaded / initSharedHeader) then builds
  // it. Marking built with header==null left the flag stuck true and the header forever
  // unpopulated: no bell/search/nav, and the owner "Viewing" bar fell back to a stray
  // banner until a manual refresh.
  const header = document.getElementById("app-header");
  if (!header) return;
  window.__shChromeBuilt = true;
  // Populate the header element
  {
    header.innerHTML = `
      <a class="sh-skip" href="#" onclick="return window._shSkipToMain(event)">Skip to content</a>
      <div class="sh-hdr-inner">
      <div class="sh-hdr-left">
        <h1>The Practice Room</h1>
      </div>
      <nav class="sh-primary-nav" aria-label="Primary">
          <a class="sh-tab" data-page="hub" href="/practice-log.html"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>Practice</a>
          <a class="sh-tab" data-page="learn" href="/learn.html"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.2 2.7 2.5 6 2.5s6-1.3 6-2.5v-5"/></svg>Learn</a>
          <a class="sh-tab" data-page="tools" href="/tools.html"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>Tools</a>
          <a class="sh-tab" data-page="community" href="/community.html"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>Community</a>
          <a class="sh-tab" data-page="live" href="/events.html"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.24a6 6 0 0 1 0-8.49M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14"/></svg>Live</a>
      </nav>
      <div class="header-user">
        <span id="header-email" style="display:none"></span>
        <button id="sh-search-btn" onclick="window._shOpenPalette()" title="Search (⌘K / Ctrl-K)" aria-label="Search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span class="sh-search-label">Search</span>
          <kbd class="sh-search-kbd">⌘K</kbd>
        </button>
        <button id="presence-btn" onclick="window._shTogglePresence()" title="Online members" aria-label="Online members">
          <span class="presence-dot"></span>
          <span class="presence-count">0</span>
        </button>
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
          <button class="sh-avatar-btn" id="sh-avatar-btn" aria-haspopup="menu" aria-expanded="false" aria-label="Account menu" onclick="window._shToggleUserMenu()">
            <div class="sh-avatar" id="sh-avatar-el"></div>
          </button>
          <div class="sh-user-menu" id="sh-user-menu">
            <a class="sh-user-menu-item" href="/profile.html">Edit Profile</a>
            <a class="sh-user-menu-item" href="/practice-log.html?tour=1" onclick="return window._shTakeTourAgain(event)">Take the tour again</a>
            <a class="sh-user-menu-item" href="/updates.html">What's New</a>
            <a class="sh-user-menu-item" href="/billing.html">Billing</a>
            <a class="sh-user-menu-item" href="/feedback.html">Report Bug / Request Feature</a>
            <a class="sh-user-menu-item" href="/privacy.html">Privacy Policy</a>
            <button class="sh-user-menu-item" id="sh-logout-btn">Log out</button>
          </div>
        </div>
      </div>
      </div>
    `;
    // Reveal the top bar as soon as its markup is built — same moment the sidebar
    // appears. Previously it stayed display:none until initSharedHeader ran after
    // auth, so on desktop the sidebar was instant but the top bar flashed in a
    // beat later. The avatar fills in from cache / the background profile fetch.
    header.style.display = "";
  }

  // Secondary nav: desktop = light underlined page tabs (themed via page CSS vars),
  // mobile = sticky dark pill bar. Rendered into this one element by _updateNav.
  const subNav = document.createElement("div");
  subNav.id = "sh-mob-subnav";

  // Insert the secondary nav right after the header.
  if (header && header.parentNode) {
    header.parentNode.insertBefore(subNav, header.nextSibling);
  } else {
    document.body.insertBefore(subNav, document.body.firstChild);
  }

  // ── Desktop left sidebar (primary nav). Hidden <=768px (bottom bar takes over). ──
  const sidebar = document.createElement("aside");
  sidebar.id = "sh-sidebar";
  sidebar.setAttribute("aria-label", "Primary");
  const _sbIcons = {
    hub: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    learn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.2 2.7 2.5 6 2.5s6-1.3 6-2.5v-5"/></svg>',
    tools: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>',
    community: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    live: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.24a6 6 0 0 1 0-8.49M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14"/></svg>',
  };
;
  const _sbSections = [
    { key: "hub", label: "Practice", href: "/practice-log.html" },
    { key: "learn", label: "Learn", href: "/learn.html" },
    { key: "tools", label: "Tools", href: "/tools.html" },
    { key: "community", label: "Community", href: "/community.html" },
    { key: "live", label: "Live", href: "/events.html" },
  ];
  sidebar.innerHTML =
    '<div class="sh-sb-brand"><h1>The Practice Room</h1></div>' +
    '<nav class="sh-sb-nav">' +
    _sbSections.map(function(s) {
      const subs = (SH_SUBNAV[s.key] || []).map(function(p) {
        return '<a class="sh-sb-subitem" href="' + p.href + '">' + p.label + "</a>";
      }).join("");
      return '<div class="sh-sb-group">' +
        '<a class="sh-sb-item" data-page="' + s.key + '" href="' + s.href + '">' +
          _sbIcons[s.key] + "<span>" + s.label + "</span></a>" +
        (subs ? '<div class="sh-sb-sub">' + subs + "</div>" : "") +
      "</div>";
    }).join("") +
    "</nav>";
  document.body.insertBefore(sidebar, document.body.firstChild);

  // Mobile bottom tab bar
  const bottomBar = document.createElement("nav");
  bottomBar.id = "sh-mob-bottom-bar";
  bottomBar.innerHTML = `
    <a class="sh-mob-tab" data-page="hub" href="/practice-log.html">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      <span>Practice</span>
    </a>
    <a class="sh-mob-tab" data-page="learn" href="/learn.html">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.2 2.7 2.5 6 2.5s6-1.3 6-2.5v-5"/></svg>
      <span>Learn</span>
    </a>
    <a class="sh-mob-tab" data-page="tools" href="/tools.html">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
      <span>Tools</span>
    </a>
    <a class="sh-mob-tab" data-page="community" href="/community.html">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      <span>Community</span>
    </a>
    <a class="sh-mob-tab" data-page="live" href="/events.html">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.24a6 6 0 0 1 0-8.49M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14"/></svg>
      <span>Live</span>
    </a>
  `;
  document.body.appendChild(bottomBar);

  // Hide the bottom tab bar while the on-screen keyboard is open. The fixed bar
  // is anchored to the layout viewport, so when the keyboard pushes the visual
  // viewport up it floats with a visible gap below it as you scroll. We detect
  // the keyboard via VisualViewport (height shrinks by the keyboard's height)
  // and toggle html.sh-kb-open, which the CSS hides the bar on.
  {
    const FOCUS_SEL = 'input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]), textarea, [contenteditable=""], [contenteditable=true]';
    const setKb = (on) => document.documentElement.classList.toggle("sh-kb-open", !!on);
    const vv = window.visualViewport;

    if (vv) {
      // Track the tallest viewport we've seen as the "no keyboard" baseline, so
      // we compare against the real full height rather than window.innerHeight
      // (which Android shrinks with the keyboard too).
      let baseH = vv.height;
      const evalKb = () => {
        baseH = Math.max(baseH, vv.height);
        setKb((baseH - vv.height) > 120);
      };
      const onVV = () => {
        evalKb();
        // iOS fires resize *during* the close animation, so the last event can
        // still read a half-open keyboard and leave the bar hidden. Re-check
        // once the animation has settled.
        setTimeout(evalKb, 350);
      };
      vv.addEventListener("resize", onVV);
      vv.addEventListener("scroll", onVV);
    }

    // Safety net: whenever focus leaves all text fields, the keyboard is going
    // away — guarantee the bar comes back even if a viewport event is missed.
    document.addEventListener("focusout", () => {
      setTimeout(() => {
        const a = document.activeElement;
        if (!a || !a.closest(FOCUS_SEL)) setKb(false);
      }, 100);
    });
  }

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
      <input id="notif-admin-link" placeholder="Link URL (optional)" />
      <div style="display:flex;gap:8px">
        <button class="btn btn-sm btn-ghost" onclick="window._shSendUpdate(false)" style="flex:1;font-size:0.8rem">Send to me</button>
        <button class="btn btn-sm" onclick="window._shSendUpdate(true)" style="flex:1;font-size:0.8rem">Broadcast to all</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  // Admin presence panel
  const presencePanel = document.createElement("aside");
  presencePanel.className = "presence-panel";
  presencePanel.id = "presence-panel";
  presencePanel.setAttribute("role", "dialog");
  presencePanel.setAttribute("aria-label", "Online members");
  presencePanel.innerHTML = `
    <div class="presence-panel-head">
      <h3>Members</h3>
      <button class="presence-close-btn" onclick="window._shClosePresence()" aria-label="Close">&#x2715;</button>
    </div>
    <div class="presence-list" id="presence-list">
      <div class="presence-empty">Loading&#8230;</div>
    </div>
  `;
  document.body.appendChild(presencePanel);
} // end _shBuildChrome

window._shBuildChrome = _shBuildChrome;
// Run as soon as the DOM is ready (or immediately if it already is — a plain
// sync script that the SW serves late can execute after DOMContentLoaded fired,
// in which case the old addEventListener never ran and the header never built).
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", _shBuildChrome);
} else {
  _shBuildChrome();
}

// ── Sheet helpers (kept as no-ops for backward compat) ────────────────────────
window._shOpenSheet  = function() {};
window._shCloseSheet = function() {};
window.openMobSheet  = window._shOpenSheet;
window.closeMobSheet = window._shCloseSheet;

// ── User menu helpers ─────────────────────────────────────────────────────────
// Skip-to-content: focus + scroll the page's main content region.
window._shSkipToMain = function(e) {
  if (e) e.preventDefault();
  const main =
    document.querySelector("main, #app-main, [role='main'], #main-content") ||
    document.querySelector("h1, h2");
  if (main) {
    if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
    main.focus({ preventScroll: false });
    main.scrollIntoView({ block: "start" });
  }
  return false;
};
window._shToggleUserMenu = function() {
  const menu = document.getElementById("sh-user-menu");
  const open = menu?.classList.toggle("open");
  document.getElementById("sh-avatar-btn")?.setAttribute("aria-expanded", open ? "true" : "false");
};
// Same-page nav: if a sidebar/sub-nav link points at the page we're already on
// (e.g. Community → Progress is /community.html?filter=progress), let the page
// handle it client-side instead of doing a full reload. Pages opt in by defining
// window.__shSamePageRoute(pathAndSearch); pages that don't are unaffected.
document.addEventListener("click", function(e) {
  const a = e.target.closest("a.sh-sb-subitem, a.sh-item, .sh-tab-drop a");
  if (!a || !a.getAttribute("href")) return;
  if (typeof window.__shSamePageRoute !== "function") return;
  let url;
  try { url = new URL(a.href, location.origin); } catch (_) { return; }
  if (url.pathname !== location.pathname) return; // different page → normal nav
  e.preventDefault();
  window.__shSamePageRoute(url.pathname + url.search);
});
// Close user menu on outside click
document.addEventListener("click", function(e) {
  if (!e.target.closest(".sh-avatar-wrap")) {
    document.getElementById("sh-user-menu")?.classList.remove("open");
    document.getElementById("sh-avatar-btn")?.setAttribute("aria-expanded", "false");
  }
});
// Close user menu on Escape
document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") {
    const m = document.getElementById("sh-user-menu");
    if (m?.classList.contains("open")) {
      m.classList.remove("open");
      const b = document.getElementById("sh-avatar-btn");
      b?.setAttribute("aria-expanded", "false");
      b?.focus();
    }
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
  // Load + render (with the "new" highlights), THEN mark everything seen so the
  // app-icon badge clears. Opening the bell is the member saying "I've looked",
  // which is what stops the badge sticking at a mystery number.
  window._shLoadNotifs?.().then(() => { window._shRenderNotifs?.(); window._shMarkSeen?.(); });
  if (window._shIsAdmin) document.getElementById("notif-admin-wrap").style.display = "block";
};
// Alias used by practice-log.html
window.toggleNotifPanel = window._shToggleNotif;
window.closeNotifPanel  = window._shCloseNotif;

// ── Admin presence (online members) helpers ───────────────────────────────────
// _shStartPresence(db, email) starts the heartbeat for the signed-in member.
// _shEnableAdminPresence() shows the dropdown button when isAdmin.
// Panel renders Online now (≤2 min) + Recently seen (everyone with any record,
// sorted by last_seen DESC). Auto-refreshes every 30s while open.
const _SH_PAGE_LABELS = {
  "/":                    "Home",
  "/practice-log.html":   "Practice",
  "/community.html":      "Community",
  "/chat.html":           "Chat",
  "/learn.html":          "Learn",
  "/courses.html":        "Courses",
  "/resources.html":      "Resources",
  "/tools.html":          "All Tools",
  "/focus.html":          "Weekly Focus",
  "/content-feed.html":   "Content Feed",
  "/events.html":         "Live Clinics",
  "/clinic-booking.html": "Book a Lesson",
  "/updates.html":        "Updates",
  "/profile.html":        "Profile",
  "/billing.html":        "Billing",
  "/feedback.html":       "Feedback",
  "/privacy.html":        "Privacy",
  "/support.html":        "Support",
  "/admin-analytics.html":"Admin",
};
// Friendly labels for the Hub's internal sub-views (reported via window._shPageDetail
// as a #fragment, since they switch without changing the URL).
const _SH_HUB_LABELS = {
  dashboard: "Practice · Dashboard", stats: "Practice · Stats", goals: "Practice · Goals",
  roadmap: "Practice · Roadmap", history: "Practice · History", leaderboard: "Practice · Leaderboard",
  achievements: "Practice · Achievements", community: "Practice · Community", log: "Practice · Practice Log",
  library: "Library", theory: "Theory", tools: "All Tools", feedback: "Feedback",
};
function _shPageLabel(path) {
  if (!path) return "";
  const clean = path.split("?")[0].split("#")[0];
  const hi = path.indexOf("#");
  const detail = hi >= 0 ? path.slice(hi + 1) : "";
  if (detail) {
    // The Hub reports short tokens (resolved via the map); other pages report a
    // ready-made label (e.g. "Community · Members"), used directly.
    return _SH_HUB_LABELS[detail] || detail;
  }
  return _SH_PAGE_LABELS[clean] || clean.replace(/\.html$/, "").replace(/^\//, "") || "Home";
}
function _shRelTime(ts) {
  if (!ts) return "";
  const d = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (d < 60)     return "just now";
  if (d < 3600)   return `${Math.floor(d/60)}m ago`;
  if (d < 86400)  return `${Math.floor(d/3600)}h ago`;
  if (d < 604800) return `${Math.floor(d/86400)}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function _shInitials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

let _shPresenceDb = null;
let _shPresenceEmail = null;
let _shHeartbeatTimer = null;
let _shLastBeatAt = 0;   // ms timestamp of the last presence write (for interaction throttling)
async function _shHeartbeat(force) {
  if (!_shPresenceDb || !_shPresenceEmail) return;
  // The background timer respects visibility (don't beat for hidden tabs). But a
  // `force` beat comes from a real interaction or an explicit save/ping — proof the
  // user is present — so it writes even if a webview misreports visibility as hidden.
  if (!force && typeof document !== "undefined" && document.visibilityState === "hidden") return;
  _shLastBeatAt = Date.now();
  try {
    // Pages may expose `window._shPageDetail` (e.g. the Hub's current sub-tab) so
    // presence can show exactly where someone is, not just the file. Appended as a
    // #fragment that _shPageLabel resolves to a friendly label.
    const detail = (typeof window !== "undefined" && window._shPageDetail) ? ("#" + window._shPageDetail) : "";
    const { error } = await _shPresenceDb.from("user_presence").upsert({
      email: _shPresenceEmail,
      last_seen_at: new Date().toISOString(),
      page: location.pathname + (location.search || "") + detail,
    }, { onConflict: "email" });
    // Expose last error on window so we can spot RLS / schema issues from devtools.
    window._shPresenceLastError = error || null;
    if (error) console.warn("[presence] upsert failed:", error.message);
  } catch (e) {
    window._shPresenceLastError = e;
  }
  // Feature-usage time tracking: bank time on the current view, flush ~minutely.
  _shAccrueUsage();
  if (Date.now() - _shLastFlush > 55_000) _shFlushUsage();
}

// ── Feature-usage time tracking ───────────────────────────────────────────────
// Accrues seconds spent on each resolved view label and flushes them to the
// feature_usage table (via the add_feature_usage RPC) so the admin page can show
// what's actually used. Only counts visible/active time; idle gaps are dropped.
let _shUsageLabel = null, _shUsageSince = 0, _shUsageBuf = {}, _shLastFlush = 0;
function _shCurrentViewLabel() {
  const detail = (typeof window !== "undefined" && window._shPageDetail) ? ("#" + window._shPageDetail) : "";
  return _shPageLabel(location.pathname + (location.search || "") + detail);
}
function _shAccrueUsage() {
  const now = Date.now();
  const visible = (typeof document === "undefined") || document.visibilityState === "visible";
  if (_shUsageLabel && _shUsageSince && visible) {
    const secs = (now - _shUsageSince) / 1000;
    if (secs >= 1 && secs < 1800) _shUsageBuf[_shUsageLabel] = (_shUsageBuf[_shUsageLabel] || 0) + secs;
  }
  _shUsageLabel = _shCurrentViewLabel();
  _shUsageSince = now;
}
// Which surface is this: iOS app (PWAShell), Android app (TWA, detected from the
// android-app:// launch referrer), installed PWA (standalone), or mobile/desktop
// web. Cached per session because the TWA referrer is only present on the launch
// page, not on internal navigations.
function _shPlatform() {
  try {
    const cached = sessionStorage.getItem("_shPlatform");
    if (cached) return cached;
    const ua = navigator.userAgent || "";
    const ref = document.referrer || "";
    let p;
    if (/PWAShell/i.test(ua)) p = "ios-app";
    else if (ref.indexOf("android-app://") === 0) p = "android-app";
    else {
      const standalone = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
      const mobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua) || (window.innerWidth > 0 && window.innerWidth < 768);
      if (standalone) p = "installed-pwa";
      else p = mobile ? "mobile-web" : "desktop-web";
    }
    sessionStorage.setItem("_shPlatform", p);
    return p;
  } catch (e) { return "unknown"; }
}
async function _shFlushUsage() {
  _shAccrueUsage();
  const entries = Object.entries(_shUsageBuf).filter(([, s]) => s >= 1);
  if (!entries.length || !_shPresenceDb) return;
  _shUsageBuf = {};
  _shLastFlush = Date.now();
  const platform = _shPlatform();
  for (const [view, secs] of entries) {
    try {
      const { error } = await _shPresenceDb.rpc("add_feature_usage", { p_view: view, p_seconds: Math.round(secs), p_platform: platform });
      if (error) throw error;
    } catch (e) { _shUsageBuf[view] = (_shUsageBuf[view] || 0) + secs; } // re-buffer on failure
  }
}
// Pages call this after changing `window._shPageDetail` to push the new view
// immediately, instead of waiting up to 60s for the next heartbeat.
window._shPing = function() { _shHeartbeat(true); };
window._shStartPresence = function(db, email) {
  if (!db || !email) return;
  _shPresenceDb = db;
  _shPresenceEmail = email.toLowerCase();
  // Seed usage tracking at the current view.
  _shUsageLabel = _shCurrentViewLabel();
  _shUsageSince = Date.now();
  _shLastFlush = Date.now();
  if (_shHeartbeatTimer) clearInterval(_shHeartbeatTimer);
  _shHeartbeat();
  _shHeartbeatTimer = setInterval(_shHeartbeat, 60_000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") { _shUsageSince = Date.now(); _shHeartbeat(); }
    else { _shFlushUsage(); }  // leaving/backgrounding — bank + flush time so far
  });
  // Best-effort flush when the tab is closed/navigated away.
  window.addEventListener("pagehide", () => { _shFlushUsage(); });
  // Interaction-driven heartbeat: mobile/PWA webviews throttle or freeze the
  // setInterval while backgrounded, so an actively-used app (e.g. someone logging
  // a practice) could still read as "last seen hours ago". Any real interaction
  // refreshes presence, throttled to at most once per ~50s to avoid write spam.
  const _shOnInteract = () => { if (Date.now() - _shLastBeatAt > 50_000) _shHeartbeat(true); };
  ["pointerdown", "keydown", "touchstart"].forEach(ev =>
    document.addEventListener(ev, _shOnInteract, { passive: true, capture: true }));
};

let _shPresenceRefreshTimer = null;
window._shEnableAdminPresence = function() {
  const btn = document.getElementById("presence-btn");
  if (!btn) return;
  btn.style.display = "inline-flex";
  // Initial count fetch so the badge isn't always 0 before first open
  _shRefreshOnlineCount();
};

async function _shRefreshOnlineCount() {
  if (!_shPresenceDb) return;
  try {
    const twoMin = new Date(Date.now() - 2 * 60_000).toISOString();
    const { count } = await _shPresenceDb.from("user_presence")
      .select("email", { count: "exact", head: true })
      .gte("last_seen_at", twoMin);
    const el = document.querySelector("#presence-btn .presence-count");
    if (el) el.textContent = String(count ?? 0);
  } catch (e) { /* silent */ }
}

window._shClosePresence = function() {
  document.getElementById("presence-panel")?.classList.remove("open");
  if (_shPresenceRefreshTimer) { clearInterval(_shPresenceRefreshTimer); _shPresenceRefreshTimer = null; }
};
window._shTogglePresence = function() {
  const panel = document.getElementById("presence-panel");
  if (!panel) return;
  if (panel.classList.contains("open")) { window._shClosePresence(); return; }
  // Position under the button
  const btn = document.getElementById("presence-btn");
  if (btn) {
    const r = btn.getBoundingClientRect();
    const w = Math.min(340, window.innerWidth - 20);
    panel.style.top   = (r.bottom + 6) + "px";
    panel.style.right = Math.max(10, Math.min(window.innerWidth - r.right, window.innerWidth - w - 10)) + "px";
    panel.style.width = w + "px";
  }
  panel.classList.add("open");
  _shRenderPresence();
  _shPresenceRefreshTimer = setInterval(_shRenderPresence, 30_000);
};
// Close presence panel on click outside
document.addEventListener("click", function(e) {
  if (e.target.closest("#presence-panel") || e.target.closest("#presence-btn")) return;
  window._shClosePresence?.();
});

async function _shRenderPresence() {
  if (!_shPresenceDb) return;
  const listEl = document.getElementById("presence-list");
  if (!listEl) return;
  try {
    const { data: rows, error } = await _shPresenceDb.from("user_presence")
      .select("email, last_seen_at, page")
      .order("last_seen_at", { ascending: false });
    if (error) throw error;
    const all = rows || [];
    // Hydrate names + avatars
    const emails = all.map(r => r.email);
    let profiles = [];
    if (emails.length) {
      const { data: p } = await _shPresenceDb.from("allowed_emails")
        .select("email, name, avatar_url")
        .in("email", emails);
      profiles = p || [];
    }
    const pmap = {};
    profiles.forEach(p => { pmap[(p.email||"").toLowerCase()] = p; });

    const now = Date.now();
    const TWO_MIN = 2 * 60_000;
    const online = [];
    const seen = [];
    all.forEach(r => {
      const lower = (r.email||"").toLowerCase();
      const prof = pmap[lower] || {};
      const item = {
        email: r.email,
        name: prof.name || r.email,
        avatar: prof.avatar_url || null,
        last_seen_at: r.last_seen_at,
        page: r.page || "",
      };
      if (now - new Date(r.last_seen_at).getTime() < TWO_MIN) online.push(item);
      else seen.push(item);
    });

    // Update header count
    const countEl = document.querySelector("#presence-btn .presence-count");
    if (countEl) countEl.textContent = String(online.length);

    function rowHtml(it, isOnline) {
      const initials = _shInitials(it.name);
      const avatar = it.avatar
        ? `<div class="pres-avatar"><img src="${it.avatar}" alt=""/></div>`
        : `<div class="pres-avatar">${initials}</div>`;
      const meta = isOnline
        ? `Viewing ${_shPageLabel(it.page)}`
        : `Last seen ${_shRelTime(it.last_seen_at)}`;
      const safeName = String(it.name||"").replace(/</g, "&lt;");
      return `
        <div class="presence-row${isOnline ? " online" : ""}">
          ${avatar}
          <div class="pres-body">
            <div class="pres-name">${safeName}</div>
            <div class="pres-meta">${meta}</div>
          </div>
        </div>`;
    }
    listEl.innerHTML = `
      <div class="presence-section-label">Online now<span class="count">${online.length}</span></div>
      ${online.length ? online.map(it => rowHtml(it, true)).join("") : `<div class="presence-empty">Nobody online right now.</div>`}
      <div class="presence-section-label">Recently seen<span class="count">${seen.length}</span></div>
      ${seen.length ? seen.map(it => rowHtml(it, false)).join("") : `<div class="presence-empty">No previous activity yet.</div>`}
    `;
  } catch (e) {
    listEl.innerHTML = `<div class="presence-empty">Couldn't load: ${String(e.message || e)}</div>`;
  }
}

// ── iOS push (inside the native PWAShell wrapper only) ───────────────────────
// Bridges Firebase Cloud Messaging tokens from the native shell into Supabase
// so an edge function can send pushes targeted at the signed-in member.
// The native side exposes four message handlers and dispatches four window
// events (see PushNotifications.swift + WebView.swift in the iOS project):
//   handlers:  push-permission-request, push-permission-state, push-token,
//              push-subscribe
//   events:    push-permission-state, push-permission-request, push-token,
//              push-notification, push-notification-click
let _shPushDb = null;
let _shPushEmail = null;
let _shPushToken = null;

function _shPostBridge(name, payload) {
  try {
    window.webkit?.messageHandlers?.[name]?.postMessage(payload || "");
  } catch (e) { /* not in app shell, ignore */ }
}

async function _shSavePushToken(token) {
  if (!_shPushDb || !_shPushEmail || !token) return;
  try {
    // Capture the device's IANA timezone so scheduled reminders (e.g. goal
    // due/overdue) can be delivered at a sensible local hour rather than UTC.
    let _tz = null;
    try { _tz = Intl.DateTimeFormat().resolvedOptions().timeZone || null; } catch (e) { /* keep null */ }
    await _shPushDb.from("device_tokens").upsert({
      email:    _shPushEmail.toLowerCase(),
      platform: "ios",
      token,
      timezone: _tz,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: "token" });
  } catch (e) { console.warn("[push] token upsert failed:", e); }
}

window._shInitIOSPush = function(db, email) {
  _shPushDb    = db;
  _shPushEmail = email;

  // Native dispatches `push-token` with detail = the FCM token string.
  window.addEventListener("push-token", (e) => {
    const raw = e.detail;
    // The Swift side wraps the token in quotes; strip them if present.
    const token = typeof raw === "string"
      ? raw.replace(/^['"]|['"]$/g, "")
      : (raw && raw.toString && raw.toString());
    if (!token || token === "ERROR GET TOKEN") return;
    _shPushToken = token;
    _shSavePushToken(token);
  }, { once: false });

  // Native dispatches `push-permission-request` with detail "granted"/"denied".
  window.addEventListener("push-permission-request", (e) => {
    if (e.detail === "granted") {
      // After permission granted, ask for the token explicitly.
      _shPostBridge("push-token");
    }
  });

  // Native dispatches `push-notification-click` when user taps a notification
  // while the app is backgrounded. Payload may carry a link_url to navigate to.
  window.addEventListener("push-notification-click", (e) => {
    try {
      const payload = typeof e.detail === "string" ? JSON.parse(e.detail) : e.detail;
      const dest = payload?.link_url || payload?.data?.link_url;
      if (dest) window.location.href = dest;
    } catch (err) { /* ignore */ }
  });

  // Foreground pushes — refresh the notification bell so the new item appears
  // immediately without waiting for a reload.
  window.addEventListener("push-notification", () => {
    window._shLoadNotifs?.().then(() => window._shRenderNotifs?.());
  });

  // Kick off: first check the current permission state, then request if needed.
  _shPostBridge("push-permission-state");
  window.addEventListener("push-permission-state", (e) => {
    const state = e.detail;
    if (state === "notDetermined") {
      _shPostBridge("push-permission-request");
    } else if (state === "authorized" || state === "ephemeral" || state === "provisional") {
      // Already authorised — just fetch the token.
      _shPostBridge("push-token");
    }
    // "denied" → nothing to do.
  }, { once: true });
};

// ── Android / web push (Firebase Cloud Messaging, browser/TWA path) ──────────
// Used everywhere the iOS native shell is NOT (Android TWA, installed PWAs).
// Registers a dedicated FCM service worker, requests notification permission
// (mirroring the iOS auto-prompt), gets an FCM web token, and stores it in
// device_tokens (platform "web"). The existing send-push function already
// delivers to these tokens — no per-platform branching needed.
const _SH_FB_CONFIG = {
  apiKey: "AIzaSyAjLspvkbQtiHo7yEg-B6Tg6AYJ30Sh_Hg",
  authDomain: "the-practice-room.firebaseapp.com",
  projectId: "the-practice-room",
  storageBucket: "the-practice-room.firebasestorage.app",
  messagingSenderId: "149724607479",
  appId: "1:149724607479:web:1ec7e02d20d97b15eaf4f2",
};
const _SH_VAPID = "BMlPRLV6yjENZBV4hWrd_9rzaEM4yIhi8pYv8FWnVta3ZdCY1e38mJa343Qe_tIb4zm1d4AFNG56X6IuR6Z-5ok";
let _shWebPushStarted = false;

function _shLoadFirebaseMessaging() {
  if (self.firebase && self.firebase.messaging) return Promise.resolve();
  const load = (src) => new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
  return load("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js")
    .then(() => load("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"))
    .then(() => { if (!self.firebase.apps.length) self.firebase.initializeApp(_SH_FB_CONFIG); });
}

async function _shSaveWebPushToken(db, email, token) {
  if (!db || !email || !token) return;
  let tz = null;
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || null; } catch (e) {}
  try {
    await db.from("device_tokens").upsert({
      email: email.toLowerCase(),
      platform: "web",
      token,
      timezone: tz,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: "token" });
  } catch (e) { console.warn("[webpush] token upsert failed:", e); }
}

window._shInitWebPush = async function(db, email) {
  if (_shWebPushStarted) return;
  // Run only where web push is actually available, and never inside the iOS shell.
  const supported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
  const isIOSShell = /PWAShell/i.test(navigator.userAgent || "") ||
    !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers["push-permission-state"]);
  if (!supported || isIOSShell) return;
  _shWebPushStarted = true;
  try {
    // Dedicated scope so this coexists with sw.js (scope "/") rather than replacing it.
    const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/firebase-cloud-messaging-push-scope" });
    let perm = Notification.permission;
    if (perm === "default") perm = await Notification.requestPermission();
    if (perm !== "granted") return;
    await _shLoadFirebaseMessaging();
    const messaging = self.firebase.messaging();
    const token = await messaging.getToken({ vapidKey: _SH_VAPID, serviceWorkerRegistration: reg });
    if (!token) return;
    await _shSaveWebPushToken(db, email, token);
    // Foreground messages — refresh the bell so the new item shows immediately.
    // Foreground messages: FCM does NOT auto-display these, so show a banner
    // ourselves (iOS parity), then refresh the bell + app badge.
    messaging.onMessage((payload) => {
      try {
        const n = (payload && payload.notification) || {};
        const data = (payload && payload.data) || {};
        if ((n.title || n.body) && Notification.permission === "granted") {
          reg.showNotification(n.title || "The Practice Room", {
            body: n.body || "",
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            data: { link_url: data.link_url || "/" },
          });
        }
      } catch (e) {}
      window._shLoadNotifs?.().then(() => window._shRenderNotifs?.());
    });
  } catch (e) { console.warn("[webpush] init failed:", e); }
};

// ── Main init ─────────────────────────────────────────────────────────────────
// ── Command palette (global Ctrl/⌘-K search) ─────────────────────────────────
let _shPalDb = null, _shPalBuilt = false, _shPalItems = [], _shPalIdx = 0, _shPalTimer = null, _shPalSeq = 0;

function _shGlossSlug(str) {
  return String(str).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function _shPalEsc(str) {
  return String(str == null ? "" : str).replace(/[&<>"]/g, function(c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}

const _SH_SECTION_META = {
  hub:       { label: "Practice Hub",   href: "/practice-log.html" },
  community: { label: "Community",      href: "/community.html" },
  resources: { label: "Resources",      href: "/resources.html" },
  tools:     { label: "Practice Tools", href: "/tools.html" },
  studio:    { label: "Matt's Studio",  href: "/focus.html" },
};
function _shNavTargets() {
  const out = [];
  Object.keys(_SH_SECTION_META).forEach(function(key) {
    const sec = _SH_SECTION_META[key];
    out.push({ title: sec.label, sub: "Section", href: sec.href, kind: "nav" });
    (SH_SUBNAV[key] || []).forEach(function(p) {
      out.push({ title: p.label, sub: sec.label, href: p.href, kind: "nav" });
    });
  });
  out.push({ title: "What's New", sub: "Updates", href: "/updates.html", kind: "nav" });
  out.push({ title: "Edit Profile", sub: "Account", href: "/profile.html", kind: "nav" });
  out.push({ title: "Billing", sub: "Account", href: "/billing.html", kind: "nav" });
  return out;
}

const _SH_PAL_ICONS = {
  nav: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
  piece: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  glossary: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  article: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>',
  video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
};
_SH_PAL_ICONS.content = _SH_PAL_ICONS.article;

function _shInitPalette(db) {
  _shPalDb = db || _shPalDb;
  if (_shPalBuilt) return;
  _shPalBuilt = true;
  const bd = document.createElement("div");
  bd.id = "sh-palette-backdrop";
  bd.innerHTML =
    '<div id="sh-palette" role="dialog" aria-modal="true" aria-label="Search">' +
      '<div class="sh-pal-inputrow">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
        '<input id="sh-palette-input" type="text" autocomplete="off" spellcheck="false" placeholder="Search pages, pieces, articles, glossary…" aria-label="Search">' +
        '<span class="sh-pal-esc">ESC</span>' +
      '</div>' +
      '<div class="sh-pal-results" id="sh-pal-results"></div>' +
      '<div class="sh-pal-hint-row"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span></div>' +
    '</div>';
  document.body.appendChild(bd);
  bd.addEventListener("click", function(e) { if (e.target === bd) window._shClosePalette(); });
  const input = document.getElementById("sh-palette-input");
  input.addEventListener("input", function() { _shPalScheduleSearch(input.value); });
  input.addEventListener("keydown", _shPalKeydown);
}

window._shOpenPalette = function() {
  if (!_shPalBuilt) { try { _shInitPalette(_shPalDb); } catch (e) { return; } }
  const bd = document.getElementById("sh-palette-backdrop");
  if (!bd) return;
  bd.classList.add("open");
  const input = document.getElementById("sh-palette-input");
  if (input) { input.value = ""; setTimeout(function() { input.focus(); }, 30); }
  _shPalRender(_shNavTargets());
};
window._shClosePalette = function() {
  const bd = document.getElementById("sh-palette-backdrop");
  if (bd) bd.classList.remove("open");
};
function _shPalIsOpen() {
  const bd = document.getElementById("sh-palette-backdrop");
  return !!(bd && bd.classList.contains("open"));
}

function _shPalScheduleSearch(q) {
  clearTimeout(_shPalTimer);
  const query = (q || "").trim();
  if (!query) { _shPalRender(_shNavTargets()); return; }
  const lower = query.toLowerCase();
  const navHits = _shNavTargets().filter(function(t) {
    return (t.title + " " + t.sub).toLowerCase().indexOf(lower) !== -1;
  }).slice(0, 6);
  _shPalRender(navHits, true);
  _shPalTimer = setTimeout(function() { _shPalRemoteSearch(query, navHits); }, 180);
}

/* Where a content_feed_posts row actually belongs. The feed page was the
   destination for every type, so a video found in search opened as a feed post
   instead of playing in the lightbox the way it does everywhere else. A written
   post is the only type that still calls the feed page home. */
function _shPalContentHref(a) {
  if (a.type === "youtube") return "/learn.html?post=" + encodeURIComponent(a.id);
  return "/content-feed.html?post=" + a.id;
}

async function _shPalRemoteSearch(query, navHits) {
  const seq = ++_shPalSeq;
  const esc = query.replace(/[%,()]/g, " ").trim();
  let pieces = [], ppd = [], content = [], gloss = [], mmt = [];
  if (_shPalDb && esc) {
    try {
      const r = await _shPalDb.from("pieces").select("id,title,composer")
        .or("title.ilike.%" + esc + "%,composer.ilike.%" + esc + "%").limit(6);
      pieces = r.data || [];
    } catch (e) {}
    try {
      const r = await _shPalDb.from("theory_sheets").select("title,slug,category")
        .ilike("title", "%" + esc + "%").limit(6);
      ppd = r.data || [];
    } catch (e) {}
    try {
      // Clinics carry a post row only so their comments share one table; the
      // clinic itself is found through Live, not through this palette.
      const r = await _shPalDb.from("content_feed_posts").select("id,title,type")
        .not("type", "in", '("clinic","blog")')
        .ilike("title", "%" + esc + "%").order("published_at", { ascending: false }).limit(6);
      content = r.data || [];
    } catch (e) {}
    try {
      /* Monday Music Tips come from mmt_articles, not from the blog posts that
         announce them. 11 of those 25 announcements carry no url at all, so a
         slug cannot be read off them; and the article is the thing being looked
         for in any case. Learn skips type=blog for the same reason. */
      const r = await _shPalDb.from("mmt_articles").select("slug,title")
        .eq("status", "published")
        .ilike("title", "%" + esc + "%").order("published_at", { ascending: false }).limit(6);
      mmt = r.data || [];
    } catch (e) {}
    try {
      const r = await _shPalDb.from("glossary").select("term").ilike("term", "%" + esc + "%").limit(6);
      gloss = r.data || [];
    } catch (e) {}
  }
  if (seq !== _shPalSeq) return; // superseded by a newer keystroke
  const items = navHits.slice();
  pieces.forEach(function(p) {
    items.push({ title: p.title, sub: p.composer || "Piece", href: "/resources.html?piece=" + p.id, kind: "piece" });
  });
  ppd.forEach(function(a) {
    items.push({
      title: a.title || "Untitled",
      sub: a.category || "Piano Practice Daily",
      href: "/theory/sheets/view.html?slug=" + encodeURIComponent(a.slug || ""),
      kind: "article",
    });
  });
  const _CF_TYPE = { youtube: "Video", blog: "Article", post: "Post" };
  content.forEach(function(a) {
    const sub = _CF_TYPE[a.type] || (a.type ? a.type.charAt(0).toUpperCase() + a.type.slice(1) : "Content");
    items.push({
      title: a.title || "Untitled",
      sub: sub,
      href: _shPalContentHref(a),
      kind: "content",
      icon: a.type === "youtube" ? _SH_PAL_ICONS.video : _SH_PAL_ICONS.article,
    });
  });
  mmt.forEach(function(a) {
    items.push({
      title: a.title || "Untitled",
      sub: "Monday Music Tips",
      href: "/theory/sheets/view.html?mmt=" + encodeURIComponent(a.slug || ""),
      kind: "content",
      icon: _SH_PAL_ICONS.article,
    });
  });
  gloss.forEach(function(g) {
    items.push({ title: g.term, sub: "Glossary term", href: "/resources.html#g-" + _shGlossSlug(g.term), kind: "glossary" });
  });
  _shPalRender(items);
}

function _shPalRender(items, partial) {
  _shPalItems = items || [];
  _shPalIdx = 0;
  const box = document.getElementById("sh-pal-results");
  if (!box) return;
  if (!_shPalItems.length) {
    box.innerHTML = '<div class="sh-pal-empty">' + (partial ? "Searching…" : "No matches") + "</div>";
    return;
  }
  const kindLabel = { nav: "Navigate", piece: "Pieces", article: "Articles", content: "Content", glossary: "Glossary" };
  let html = "", lastKind = null;
  _shPalItems.forEach(function(it, i) {
    if (it.kind !== lastKind) {
      html += '<div class="sh-pal-group-label">' + (kindLabel[it.kind] || "") + "</div>";
      lastKind = it.kind;
    }
    html += '<a class="sh-pal-item' + (i === 0 ? " sh-pal-active" : "") + '" data-i="' + i + '" href="' + it.href + '">' +
      '<span class="sh-pal-ico">' + (it.icon || _SH_PAL_ICONS[it.kind] || "") + "</span>" +
      '<span class="sh-pal-txt"><span class="sh-pal-title">' + _shPalEsc(it.title) + "</span>" +
      '<span class="sh-pal-sub">' + _shPalEsc(it.sub || "") + "</span></span>" +
      '<span class="sh-pal-tag">↵</span></a>';
  });
  box.innerHTML = html;
  box.querySelectorAll(".sh-pal-item").forEach(function(el) {
    el.addEventListener("mousemove", function() { _shPalSetActive(parseInt(el.dataset.i, 10)); });
    el.addEventListener("click", function(e) { e.preventDefault(); _shPalGo(parseInt(el.dataset.i, 10)); });
  });
}

function _shPalSetActive(i) {
  _shPalIdx = i;
  const box = document.getElementById("sh-pal-results");
  if (!box) return;
  box.querySelectorAll(".sh-pal-item").forEach(function(el) {
    el.classList.toggle("sh-pal-active", parseInt(el.dataset.i, 10) === i);
  });
}

function _shPalKeydown(e) {
  if (e.key === "ArrowDown") { e.preventDefault(); _shPalMove(1); }
  else if (e.key === "ArrowUp") { e.preventDefault(); _shPalMove(-1); }
  else if (e.key === "Enter") { e.preventDefault(); _shPalGo(_shPalIdx); }
  else if (e.key === "Escape") { e.preventDefault(); window._shClosePalette(); }
}

function _shPalMove(d) {
  if (!_shPalItems.length) return;
  let i = _shPalIdx + d;
  if (i < 0) i = _shPalItems.length - 1;
  if (i >= _shPalItems.length) i = 0;
  _shPalSetActive(i);
  const el = document.querySelector('.sh-pal-item[data-i="' + i + '"]');
  if (el) el.scrollIntoView({ block: "nearest" });
}

function _shPalGo(i) {
  const it = _shPalItems[i];
  if (!it) return;
  window._shClosePalette();
  window.location.href = it.href;
}

document.addEventListener("keydown", function(e) {
  if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
    e.preventDefault();
    if (_shPalIsOpen()) window._shClosePalette(); else window._shOpenPalette();
  }
});

// First-login welcome modal: shows once per member (gated on allowed_emails.welcome_seen_at),
// then stamps the flag so it never reappears. Copy is intentionally evidence-led and warm.
window._shMaybeShowOnboarding = async function(db, myEmail) {
  if (!db || !myEmail) return;
  // ?welcome=preview / ?info=preview force a variant and never stamp (for the owner to iterate).
  const qp = new URLSearchParams(location.search);
  const forceWelcome = qp.get("welcome") === "preview", forceInfo = qp.get("info") === "preview";
  const preview = forceWelcome || forceInfo;
  let variant;
  if (forceWelcome) variant = "welcome";
  else if (forceInfo) variant = "info";
  else {
    try {
      const data = await window.shMyRow(db, myEmail);
      if (!data) return;
      if (!data.welcome_seen_at) variant = "welcome";     // new member → welcome
      else if (!data.info_seen_at) variant = "info";      // existing member → one-off info
      else return;                                        // already seen what they needed
    } catch (e) { return; }
  }
  if (document.getElementById("sh-welcome-backdrop")) return;
  const V = {
    welcome: {
      h: "Welcome, I'm glad you made the decision to join The Practice Room.",
      intro: "Have a look around: the roadmap, the clinics, the community, the practice tools. But if you do one thing first, make it this:",
      key: "Log your practice.",
      evidence: "It's the single most evidence-backed habit you can build. Across 138 trials, simply tracking your progress made people more likely to reach their goals, and it works even better when you record it.",
      fbBullet: "Real, <b>more accurate and personalised feedback</b> when you need it",
      habit: "It's all built to help you stick with it and become the player you want to be. Don't worry if it doesn't click straight away. Research found it takes around 66 days to form a habit, so if you can keep practicing and logging, even a quick note, you are greatly increasing your chances of success.",
      breadth: "But logging is just the start. I aim to keep building learning materials to help you along the way, and there's already plenty more to do here: live clinics, practice tools, an ever-growing amount of content, and the community.",
      close: "So... welcome, and if you need anything, I'm here to help.",
      primary: "Log my first practice →", secondary: "Look around first",
    },
    info: {
      h: "Getting the most out of The Practice Room",
      intro: "Now that the new platform has been up and running for a few weeks, here's the one thing worth doing if you haven't already:",
      key: "Did you know:",
      evidence: "Logging your practice is the single most evidence-backed habit you can build. Across 138 trials, simply tracking your progress made people more likely to reach their goals, and it works even better when you record it.",
      fbBullet: "Real, <b>more accurate and personalised feedback</b> when you need it",
      habit: "It's all built to help you stick with it and become the player you want to be. Don't worry if logging doesn't click straight away. Research found it takes around 66 days to form a habit, so if you can keep practicing and logging, even a quick note, you are greatly increasing your chances of success.",
      breadth: "But logging is just the start. I aim to keep building learning materials to help you along the way, and there's already plenty more to do here: live clinics, practice tools, an ever-growing amount of content, and the community.",
      close: "If you need anything, I'm here to help.",
      primary: "Log a practice →", secondary: "Maybe later",
    },
  }[variant];

  if (!document.getElementById("sh-welcome-css")) {
    const css = document.createElement("style");
    css.id = "sh-welcome-css";
    css.textContent = `
      #sh-welcome-backdrop { position: fixed; inset: 0; z-index: 100000; display: flex; align-items: center; justify-content: center; background: rgba(20,16,10,.55); -webkit-backdrop-filter: blur(3px); backdrop-filter: blur(3px); padding: 20px; opacity: 0; transition: opacity .2s ease; }
      #sh-welcome-backdrop.open { opacity: 1; }
      .sh-welcome-card { background: #fff; color: #4a443b; max-width: 600px; width: 100%; max-height: 88vh; overflow-y: auto; border-radius: 18px; box-shadow: 0 24px 60px -12px rgba(0,0,0,.5); padding: 32px 34px 26px; font-family: inherit; line-height: 1.5; transform: translateY(10px) scale(.98); transition: transform .24s cubic-bezier(.2,.7,.3,1); }
      #sh-welcome-backdrop.open .sh-welcome-card { transform: none; }
      .sh-welcome-card h2 { font-size: 1.22rem; font-weight: 800; margin: 0 0 13px; color: #1a1410; line-height: 1.32; }
      .sh-welcome-card p { margin: 0 0 11px; font-size: .88rem; }
      .sh-w-key { font-size: 1.08rem; font-weight: 800; color: #b07400; margin: 3px 0 15px !important; }
      .sh-w-list { list-style: none; margin: 0 0 12px; padding: 0; }
      .sh-w-list li { position: relative; padding-left: 19px; margin-bottom: 6px; font-size: .88rem; }
      .sh-w-list li::before { content: ""; position: absolute; left: 3px; top: .62em; width: 6px; height: 6px; border-radius: 50%; background: #f0a500; }
      .sh-w-list li b { color: #2a2620; }
      .sh-welcome-card .sh-w-close { font-weight: 700; color: #2a2620; margin-bottom: 6px; }
      .sh-welcome-card .sh-w-sign { font-size: .88rem; font-weight: 700; color: #1a1410; margin: 0; }
      .sh-w-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 22px; }
      .sh-w-primary { background: linear-gradient(135deg,#f7cb33,#f0a500); color: #2a1d00; border: none; border-radius: 11px; padding: 12px 18px; font: inherit; font-weight: 800; cursor: pointer; }
      .sh-w-secondary { background: transparent; color: #6b6256; border: 1.5px solid #d8d2c6; border-radius: 11px; padding: 12px 18px; font: inherit; font-weight: 700; cursor: pointer; }
      .sh-w-primary:hover { filter: brightness(1.04); }
      .sh-w-secondary:hover { border-color: #b9b1a2; color: #2a2620; }
      .sh-welcome-card details { margin-top: 16px; font-size: .8rem; color: #8a8275; }
      .sh-welcome-card summary { cursor: pointer; font-weight: 600; }`;
    document.head.appendChild(css);
  }

  const bd = document.createElement("div");
  bd.id = "sh-welcome-backdrop";
  bd.innerHTML = `<div class="sh-welcome-card" role="dialog" aria-modal="true" aria-label="${V.h}">
    <h2>${V.h}</h2>
    <p>${V.intro}</p>
    ${V.key ? `<p class="sh-w-key">${V.key}</p>` : ""}
    <p>${V.evidence}</p>
    <p>It's also the key that unlocks many of the most useful features here:</p>
    <ul class="sh-w-list">
      <li>Your <b>roadmap</b>, so you know what to expect at your level</li>
      <li>Your <b>stats and insights</b>, so you know what to work on next</li>
      <li>${V.fbBullet}</li>
      <li>The ability to share your progress with a <b>community</b> for motivation and encouragement</li>
    </ul>
    <p>${V.habit}</p>
    <p>${V.breadth}</p>
    <p class="sh-w-close">${V.close}</p>
    <p class="sh-w-sign">Matt</p>
    <div class="sh-w-actions">
      <button class="sh-w-primary" id="sh-w-log">${V.primary}</button>
      <button class="sh-w-secondary" id="sh-w-look">${V.secondary}</button>
    </div>
    <details><summary>The science</summary><p style="margin-top:8px">Tracking progress: Harkin et al. 2016, Psychological Bulletin (138 RCTs). Specific goals: Locke &amp; Latham 2002. Knowing your next step: Gollwitzer &amp; Sheeran 2006. How long habits take: on average about 66 days (Lally et al., 2010). Each is independently evidenced; the effects don't multiply and nothing's guaranteed, but the odds are genuinely in your favour.</p></details>
  </div>`;
  document.body.appendChild(bd);
  requestAnimationFrame(() => bd.classList.add("open"));

  const stamp = () => { if (preview) return; const now = new Date().toISOString(); const patch = variant === "welcome" ? { welcome_seen_at: now, info_seen_at: now } : { info_seen_at: now }; try { db.from("allowed_emails").update(patch).eq("email", myEmail).then(() => {}, () => {}); } catch (e) {} };
  const close = () => { stamp(); bd.classList.remove("open"); setTimeout(() => bd.remove(), 240); };
  bd.querySelector("#sh-w-look").addEventListener("click", close);
  bd.addEventListener("click", (e) => { if (e.target === bd) close(); });
  bd.querySelector("#sh-w-log").addEventListener("click", () => { stamp(); window.location.href = "/practice-log.html?log=1"; });
};

/* The member's own row was being fetched three times on every page load - the
   page boot wanting name and avatar, the header wanting the seen-at stamps, and
   the achievements module wanting the avatar again. Same row, three round
   trips, and each one holds a PostgREST pool slot while the page is trying to
   draw. One fetch of the union, shared and memoised per email. */
window.shMyRow = function(db, email) {
  if (!db || !email) return Promise.resolve(null);
  const key = String(email).toLowerCase();
  window.__shMyRow = window.__shMyRow || {};
  if (!window.__shMyRow[key]) {
    window.__shMyRow[key] = db.from("allowed_emails")
      .select("email,name,avatar_url,welcome_seen_at,info_seen_at")
      .ilike("email", email).maybeSingle()
      .then(r => (r && r.data) || null, () => null);
  }
  return window.__shMyRow[key];
};

window.initSharedHeader = function({ db, myEmail, myName, isAdmin, activePage = "", avatarUrl = null }) {
  // Ensure the chrome exists before we try to reveal/wire it. If auth resolved
  // from cache before DOMContentLoaded, the build hasn't run yet — build it now
  // so the bell/search/nav are present to reveal (fixes intermittent missing
  // header that previously needed a refresh).
  try { _shBuildChrome(); } catch (e) {}
  // _shBuildChrome bails WITHOUT building if #app-header has not been parsed yet
  // (auth can resolve from cache before DOMContentLoaded). If that happened, the
  // reveal code below would find no chat button, bell or avatar to unhide, and
  // nothing would re-run it once the chrome finally built — leaving a header with
  // only Search until a manual refresh. Defer the whole init until the DOM is ready.
  if (!window.__shChromeBuilt) {
    var _shPendingArgs = arguments[0];
    document.addEventListener("DOMContentLoaded", function () {
      try { window.initSharedHeader(_shPendingArgs); } catch (e) {}
    }, { once: true });
    return;
  }
  window._shIsAdmin = isAdmin;
  // Wire the shared @mention engine (autocomplete + notifications) on every page.
  try { window.Mentions && window.Mentions._init(db, myEmail); } catch (e) {}
  // Wire the shared saved/bookmark store (used by standalone post pages).
  try { window.SavedPosts && window.SavedPosts._init(db, myEmail); } catch (e) {}
  // Wire the command palette (global ⌘K / "/" search).
  try { _shInitPalette(db); } catch (e) {}

  // ── Guided-tour state (cross-device, per member) ──────────────────────────
  // Decide new-vs-existing from the account's JOIN DATE against a fixed cutoff
  // (not a rolling age): members who joined on/after the cutoff, plus all future
  // joiners, are treated as new and get the full section tour. And mirror each
  // member's "seen" tours between the DB and localStorage, so a tour shows once
  // EVER per member rather than once per browser. Degrades to localStorage-only
  // if the migration/RPCs aren't present yet.
  (function _shTourState() {
    var CUTOFF = Date.parse("2026-06-23T00:00:00Z");  // owner: bump to ~7 days before launch
    window._rmTourReady = false;
    var doneA = false, doneB = false;
    function check() { if (doneA && doneB) window._rmTourReady = true; }
    setTimeout(function () { window._rmTourReady = true; }, 4000);  // never block tours forever
    try {
      db.auth.getSession().then(function (res) {
        var c = res && res.data && res.data.session && res.data.session.user && res.data.session.user.created_at;
        window._rmIsNewMember = c ? (Date.parse(c) >= CUTOFF) : false;
        window._rmJoinedAt = c ? Date.parse(c) : null;   // for tours gated to recent joiners
        doneA = true; check();
      }, function () { window._rmIsNewMember = false; doneA = true; check(); });
    } catch (e) { window._rmIsNewMember = false; doneA = true; check(); }
    try {
      db.rpc("get_tours_seen").then(function (res) {
        var seen = (res && res.data) || {};
        // DB -> localStorage: suppress tours already seen on another device.
        try { Object.keys(seen).forEach(function (k) { if (seen[k]) localStorage.setItem(k, "1"); }); } catch (e) {}
        // localStorage -> DB: remember this browser's history everywhere too.
        try {
          for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (k && /_tour_/.test(k) && localStorage.getItem(k) === "1" && !seen[k]) {
              try { db.rpc("mark_tour_seen", { p_key: k }).then(function () {}, function () {}); } catch (e) {}
            }
          }
        } catch (e) {}
        doneB = true; check();
      }, function () { doneB = true; check(); });
    } catch (e) { doneB = true; check(); }
    // Persist one tour key as seen for this member (called by shared-tour.js).
    window._rmTourPersist = function (key) { try { db.rpc("mark_tour_seen", { p_key: key }).then(function () {}, function () {}); } catch (e) {} };
  })();

  // basePage is what the page declared; _resolveSection re-detects for pages
  // where multiple sections share the same URL (practice-log.html).
  const basePage = activePage;
  /* Which section owns this URL, answered by the menus themselves: if a
     sub-nav item points exactly here - same path, same params - then this page
     belongs to that section, whatever file happens to serve it.

     resources.html is the case that needs it. Four menu items across THREE
     sections are served by that one file: Pieces Library and Glossary and Key
     Explorer under Tools, Piano Practice Daily under Learn, My Pieces under
     Hub. The page could only declare one of them, so every other route into it
     announced itself as Tools - the sidebar jumped sections, and since nothing
     in the Tools submenu matched the URL the highlight fell back to that
     submenu's first item, Practice Tools. Which is exactly what you get today
     following Hub > My Pieces.

     There was already a hand-written exception for Piano Practice Daily. This
     is that exception made general, so the next item served by a shared file
     does not need a third one. The params are compared exactly, which is what
     keeps ?lib=collection off the plain /resources.html item. */
  function _sectionOwningUrl() {
    const keys = Object.keys(SH_SUBNAV);
    for (let i = 0; i < keys.length; i++) {
      const items = SH_SUBNAV[keys[i]] || [];
      for (let j = 0; j < items.length; j++) {
        if (_pillIsActive(items[j].href)) return keys[i];
      }
    }
    return null;
  }

  function _resolveSection() {
    const owner = _sectionOwningUrl();
    if (owner) return owner;
    if (basePage === "hub") {
      const goto = new URLSearchParams(location.search).get("goto") || "";
      const hash = location.hash.replace("#", "");
      /* Old Hub URLs that point at something which has since moved out of the
         Hub. The glossary, the key explorer and the drills are Tools.

         "library" is NOT in this list any more: the pieces library moved INTO
         Practice, so a Hub URL asking for it is already in the right section
         and saying "tools" would send it back out again. It falls through to
         hub, which is what it now is. */
      if (["glossary", "key", "theory", "game", "metro", "note"].includes(goto)
          || hash === "theory") {
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
    chatBtn.classList.toggle("active", _normPath(location.pathname) === "/chat");
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

  // ── Online presence ──
  // Start the heartbeat for every signed-in member. The admin gets the
  // visible "X online" button + dropdown panel.
  if (myEmail && db) {
    window._shStartPresence?.(db, myEmail);
    if (isAdmin) window._shEnableAdminPresence?.();
  }

  // Admin-only: add a single "Studios" link to the avatar dropdown (above Log out).
  // The Studios hub (/studio.html) links out to every authoring + admin tool
  // (Admin Analytics, Email Studio, Lesson Studio, etc.).
  if (isAdmin) {
    const _menu = document.getElementById("sh-user-menu");
    const _logout = document.getElementById("sh-logout-btn");
    if (_menu && _logout && !document.getElementById("sh-studios-link")) {
      const a = document.createElement("a");
      a.className = "sh-user-menu-item";
      a.id = "sh-studios-link";
      a.href = "/studio.html";
      a.textContent = "Studios";
      _menu.insertBefore(a, _logout);
    }
  }

  // First-login onboarding modal (welcome for new members, one-off info for existing).
  if (myEmail && db) window._shMaybeShowOnboarding?.(db, myEmail);

  // ── iOS push notifications (only inside the native PWA shell) ──
  if (myEmail && db && /PWAShell/i.test(navigator.userAgent || "")) {
    window._shInitIOSPush?.(db, myEmail);
  } else if (myEmail && db) {
    // Android (TWA) / installed-PWA web push. Only prompts when running as an
    // installed app (standalone display mode), so casual browser tabs are not
    // nagged. The function itself also no-ops inside the iOS shell.
    const _installed = navigator.standalone === true ||
      ["standalone", "fullscreen", "minimal-ui"].some(m =>
        window.matchMedia && window.matchMedia(`(display-mode: ${m})`).matches);
    // `?testpush=1` forces registration in a normal browser tab so push can be
    // verified without installing the PWA first (test aid; harmless in prod).
    const _forceTest = /[?&]testpush=1\b/.test(location.search);
    if (_installed || _forceTest) window._shInitWebPush?.(db, myEmail);
  }

  // Clear any previously active states (initSharedHeader can be called more than
  // once per page if auth state changes fire bootApp again — without this clear,
  // active classes accumulate across calls).
  document.querySelectorAll(".sh-tab-drop a.active").forEach(a => a.classList.remove("active"));

  // Normalise a pathname so /foo and /foo.html both compare equal
  function _normPath(p) { return p.replace(/\.html$/, "").replace(/\/$/, "") || "/"; }

  // URL match helper — shared by _updateNav and desktop dropdown highlighting
  function _pillIsActive(href) {
    try {
      const u = new URL(href, location.origin);
      if (_normPath(u.pathname) !== _normPath(location.pathname)) return false;
      const p = new URLSearchParams(location.search);
      // Normalise null to "" on BOTH sides so links without a param match
      // pages that also lack that param (null === "" is false without the cast).
      // Every param a sub-nav link can vary by must be compared here. A link that
      // varies by an uncompared param matches every sibling, which lights the
      // whole row up at once.
      /* `lib` is deliberately NOT here. It used to be, because Hub's old "My
         Pieces" item pointed at ?lib=collection and had to be told apart from
         the plain library link next to it. Nothing in the menus varies by it
         now, and comparing it would mean /resources.html?lib=collection - the
         library's own Collection tab - matched no menu item at all and fell
         through to whichever section the FILE declares. Which is the bug this
         whole thread started with. */
      const SUBNAV_PARAMS = ["goto", "filter", "tab", "section", "type", "topic", "q"];
      /* One menu item can stand for several views of one page. Progress points
         at ?goto=stats, but History, Ranks and Achievements are the same
         destination reached through its tab bar - so without this, opening
         History would match no item at all and the highlight would fall to the
         section's FIRST item, lighting Dashboard while you are looking at
         History. Declared once here rather than discovered later. */
      const GROUPS = { goto: { stats: ["stats", "history", "leaderboard", "achievements"] } };
      return SUBNAV_PARAMS.every(function (k) {
        const want = u.searchParams.get(k) || "";
        const got  = p.get(k) || "";
        if (want === got) return true;
        const group = GROUPS[k] && GROUPS[k][want];
        return !!group && group.indexOf(got) > -1;
      }) && (u.hash || "") === (location.hash || "");
    } catch(e) { return false; }
  }

  // Update nav active states and pill row — called at init and on hashchange
  function _updateNav(section) {
    // Desktop tabs
    document.querySelectorAll(".sh-tab[data-page]").forEach(t => {
      const on = t.dataset.page === section;
      t.classList.toggle("active", on);
      if (on) t.setAttribute("aria-current", "page");
      else t.removeAttribute("aria-current");
    });
    // Mobile bottom tabs
    document.querySelectorAll(".sh-mob-tab[data-page]").forEach(t => {
      const on = t.dataset.page === section;
      t.classList.toggle("active", on);
      if (on) t.setAttribute("aria-current", "page");
      else t.removeAttribute("aria-current");
    });
    // Desktop sidebar primary items
    document.querySelectorAll(".sh-sb-item[data-page]").forEach(t => {
      const on = t.dataset.page === section;
      t.classList.toggle("active", on);
      if (on) t.setAttribute("aria-current", "page");
      else t.removeAttribute("aria-current");
    });
    // Desktop sidebar accordion sub-items (mark active within the open section)
    document.querySelectorAll(".sh-sb-subitem").forEach(a => {
      a.classList.remove("active");
      a.removeAttribute("aria-current");
    });
    const _activeGroup = document.querySelector(".sh-sb-item.active");
    const _activeSub = _activeGroup && _activeGroup.nextElementSibling;
    if (_activeSub && _activeSub.classList.contains("sh-sb-sub")) {
      const links = Array.prototype.slice.call(_activeSub.querySelectorAll(".sh-sb-subitem"));
      let matched = false;
      links.forEach(a => {
        if (_pillIsActive(a.getAttribute("href"))) { a.classList.add("active"); a.setAttribute("aria-current", "page"); matched = true; }
      });
      if (!matched && links[0]) { links[0].classList.add("active"); links[0].setAttribute("aria-current", "page"); }
    }
    // Pill subnav
    const subNav = document.getElementById("sh-mob-subnav");
    if (!subNav) return;
    const pills = SH_SUBNAV[section] || [];
    // Hide the sticky sub-nav bar entirely on sections with no sub-pages
    // (profile, billing, etc.) so we never show an empty 54px strip.
    subNav.style.display = pills.length ? "" : "none";
    if (!pills.length) { subNav.innerHTML = ""; return; }
    const anyActive = pills.some(p => _pillIsActive(p.href));
    subNav.innerHTML = `<div class="sh-mob-subnav-scroll">${pills.map((p, i) => {
      const isActive = _pillIsActive(p.href) || (!anyActive && i === 0);
      const active = isActive ? " active" : "";
      const cur = isActive ? ' aria-current="page"' : "";
      return `<a class="sh-mob-pill${active}"${cur} href="${p.href}">${p.label}</a>`;
    }).join("")}</div>`;
    // Re-attach any page-registered right-slot control (e.g. admin "Viewing as"),
    // since innerHTML above wiped it. The node lives on across re-renders.
    const scForExtra = subNav.querySelector(".sh-mob-subnav-scroll");
    if (window._shSubnavRightNode && scForExtra) {
      window._shSubnavRightNode.style.marginLeft = "auto";
      window._shSubnavRightNode.style.alignSelf = "center";
      scForExtra.appendChild(window._shSubnavRightNode);
      scForExtra.classList.add("sh-has-right");
    }
    // Auto-scroll the active pill into view within the horizontal scroller
    // (manual scrollLeft, not scrollIntoView — that can scroll the whole page).
    const act = subNav.querySelector(".sh-mob-pill.active");
    const sc = subNav.querySelector(".sh-mob-subnav-scroll");
    if (act && sc) sc.scrollLeft = act.offsetLeft - (sc.clientWidth / 2) + (act.offsetWidth / 2);
    _shSyncSubnavFade();
  }

  /* Whether the row actually overflows is the one thing CSS cannot ask, and
     both the edge fade and the pills' willingness to grow hang off the answer.
     Re-asked on resize and rotation, and once more after web fonts land, since
     they change every pill's width. */
  /* Material Design gives tabs two modes and one number to choose between them.
     FIXED tabs are equal width - the bar divided by the count - and are for a
     small, settled set. SCROLLING tabs are sized by the length of their own
     label, for a longer or variable set. The rule for which: never let an equal
     tab fall below 96px; under that, go scrolling. Apple says the same thing
     from the other side - segments are equal width, at most five on an iPhone,
     and equal widths look wrong when the labels are very different lengths,
     which is exactly what a too-small equal share means.

     So: divide the bar by the number of pills. At 96 or more they share it
     equally and fill it. Below that they take their labels' widths and the row
     scrolls, which on a phone is Practice, Community and Learn - five and six
     items are past what fits - while Tools and Live, with three and two, stay
     equal. On iPad every share clears 96, so every row is equal there.

     The fade stays tied to real overflow, which is a separate question: a row
     can be label-width and still fit. */
  var SH_FIXED_TAB_MIN = 96;
  function _shSyncSubnavFade() {
    const sc = document.querySelector("#sh-mob-subnav .sh-mob-subnav-scroll");
    if (!sc) return;
    const pills = sc.querySelectorAll(".sh-mob-pill");
    const cs = getComputedStyle(sc);
    const gap = parseFloat(cs.columnGap || cs.gap) || 0;
    const room = sc.clientWidth
      - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      - gap * Math.max(0, pills.length - 1);
    const share = pills.length ? room / pills.length : Infinity;
    sc.classList.toggle("sh-labelwidth", share < SH_FIXED_TAB_MIN);
    sc.classList.toggle("sh-scrollable", sc.scrollWidth - sc.clientWidth > 2);
    _shSyncSubnavEdges(sc);
    if (!sc._shEdgeBound) {
      sc._shEdgeBound = true;
      sc.addEventListener("scroll", function () {
        if (sc._shEdgeTick) return;
        sc._shEdgeTick = requestAnimationFrame(function () {
          sc._shEdgeTick = 0; _shSyncSubnavEdges(sc);
        });
      }, { passive: true });
    }
  }

  function _shSyncSubnavEdges(sc) {
    const left  = sc.scrollLeft > 2;
    const right = sc.scrollLeft + sc.clientWidth < sc.scrollWidth - 2;
    sc.classList.toggle("sh-fade-l", left);
    sc.classList.toggle("sh-fade-r", right);
  }
  window._shSyncSubnavFade = _shSyncSubnavFade;
  (function () {
    let t;
    const again = function () { clearTimeout(t); t = setTimeout(_shSyncSubnavFade, 120); };
    window.addEventListener("resize", again);
    window.addEventListener("orientationchange", again);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(_shSyncSubnavFade);
  })();

  _updateNav(activePage);

  // Wire the accordion toggle directly onto each sidebar section item so that
  // clicking the section heading while already on that page collapses/expands
  // its sub-menu without navigating. Done here (after _updateNav sets .active)
  // and using onclick assignment so it can't be shadowed by event delegation.
  document.querySelectorAll(".sh-sb-item[data-page]").forEach(function(item) {
    var sub = item.nextElementSibling;
    if (!sub || !sub.classList.contains("sh-sb-sub")) return;
    item.addEventListener("click", function(e) {
      // Only intercept when this is the current-page item (active).
      if (!item.classList.contains("active")) return;
      e.preventDefault();
      e.stopPropagation();
      var isOpen = getComputedStyle(sub).display !== "none";
      sub.style.display = isOpen ? "none" : "flex";
    });
  });

  // Re-detect section when hash changes (e.g. tapping Resources from Hub)
  window.addEventListener("hashchange", () => _updateNav(_resolveSection()));

  // Mark active desktop dropdown links using same URL matching logic
  function _markDropActive() {
    document.querySelectorAll(".sh-tab-drop a").forEach(a => {
      const on = _pillIsActive(a.getAttribute("href") || "");
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }
  _markDropActive();

  // Expose so individual pages can refresh nav after SPA pushState
  window._shUpdateNav = function(section) {
    _updateNav(section);
    _markDropActive();
  };

  // Let a page mount a small control (e.g. admin "Viewing as") on the right of
  // the secondary nav row. Persists across sub-nav re-renders via _updateNav.
  window._shMountSubnavRight = function(node) {
    window._shSubnavRightNode = node || null;
    const sc = document.querySelector("#sh-mob-subnav .sh-mob-subnav-scroll");
    if (sc && node) {
      node.style.marginLeft = "auto";
      node.style.alignSelf = "center";
      sc.appendChild(node);
    }
  };

  // Mount a small control into the top bar's utility cluster (left of search).
  // Used on desktop for the admin "Viewing as" dropdown.
  window._shMountTopbarRight = function(node) {
    const hu = document.querySelector("#app-header .header-user");
    if (hu && node) { hu.insertBefore(node, hu.firstChild); }
  };

  // ── Notifications ──────────────────────────────────────────────────────────
  let _notifs = [];
  // Bell list pagination — load newest first, grow the window on "Load older".
  let _notifLimit = 30;
  let _notifHasMore = false;
  // "Seen" watermark (per member). The OS app-icon badge counts notifications
  // NEWER than this — i.e. arrived since the bell was last opened — which is
  // separate from per-notification `read` state (the in-app bold highlight).
  // Mirrored in localStorage for an instant web-PWA badge; the authoritative
  // copy lives in allowed_emails.notif_seen_at (read on load, used by send-push
  // for the iOS badge).
  const _SEEN_KEY = "sh_notif_seen_at:" + (myEmail || "");
  let _seenAt = (() => { try { return localStorage.getItem(_SEEN_KEY) || ""; } catch { return ""; } })();
  function _unseen() {
    if (!_seenAt) return _notifs.length; // never opened the bell → all are new
    const t = new Date(_seenAt).getTime();
    return _notifs.filter(n => new Date(n.created_at).getTime() > t).length;
  }

  // Gold trophy icon for Monthly Champions notifications (matches the feed card badge).
  const _NOTIF_CHAMP_ICON = `<div class="notif-item-badge"><span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#ffe27a,#f0a500);color:#fff;box-shadow:0 2px 6px rgba(240,165,0,.35)"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg></span></div>`;

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
    // In-app bell dot = UNREAD count (bold items still to tap through).
    const u = _notifs.filter(n => !n.read).length;
    // OS app-icon badge = UNSEEN count (arrived since the bell was last opened).
    // These are deliberately different: opening the bell clears the app-icon
    // badge while leaving unread items bold in the list. iOS sets the app-icon
    // badge server-side via APNs (send-push, from allowed_emails.notif_seen_at);
    // web/Android PWA set it here from the local watermark for instant feedback.
    // (Android launchers may render it as a dot rather than the exact number.)
    const seen = _unseen();
    try {
      if ("setAppBadge" in navigator) {
        if (seen > 0) navigator.setAppBadge(seen); else navigator.clearAppBadge();
      }
    } catch (e) {}
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
    list.innerHTML = _notifs.map(n => {
      // Achievement notifications carry a pre-rendered badge SVG in metadata
      // so the bell panel can show the same coloured badge as the activity
      // feed / toast (no need to duplicate the SVG generator in this file).
      // Achievement badge. Regenerate it LIVE from the achievement id rather than
      // trusting the SVG stored at insert time: the stored SVG has a stale glyph
      // (pre-icon-map fix) and, worse, its gradient ids (g1/s1…) collide with the
      // current page's freshly-rendered badges because _bdgUID resets per page load
      // — that collision is what re-colours the hexagons. Live regen gives the right
      // glyph + category colour and fresh, page-unique gradient ids. Fallback (pages
      // without the achievements module, e.g. the dashboard): uniquify the stored
      // SVG's gradient ids so stacked notification badges can't share a paint server.
      let badgeSvg = null;
      if (n.type === "achievement") {
        const achId = n.metadata?.achievement_id;
        const ach = (achId && typeof ACHIEVEMENTS !== "undefined") ? ACHIEVEMENTS.find(a => a.id === achId) : null;
        if (ach && typeof achBadgeSVG === "function") {
          badgeSvg = achBadgeSVG(ach, true, 40);
        } else if (n.metadata?.badge_svg) {
          badgeSvg = String(n.metadata.badge_svg).replace(/(id="|url\(#)(g\d+|s\d+)/g, `$1$2_n${n.id}`);
        }
      }
      // Monthly Champions notifications get the same gold trophy as the card.
      const isChamp = (n.type === "monthly_champions" || n.type === "champion_placed");
      // Achievement badges render in the same glowing medallion disc as Stats / the feed.
      // The glow is derived from the badge's OWN gradient colour (not any stored
      // metadata) so it always matches the exact medallion being displayed.
      let g0 = "rgba(245,158,11,.15)", g1 = "rgba(245,158,11,.45)", g2 = "#f59e0b";
      if (badgeSvg) {
        const stops = badgeSvg.match(/stop-color="(#[0-9a-fA-F]{6})"/g);
        if (stops && stops.length) {
          const c = stops[stops.length - 1].match(/#[0-9a-fA-F]{6}/)[0];
          g0 = c + "26"; g1 = c + "73"; g2 = c;
        }
      }
      const iconHTML = badgeSvg
        ? `<div class="notif-item-badge"><span class="notif-ach-medal" style="--g0:${g0};--g1:${g1};--g2:${g2}">${badgeSvg}</span></div>`
        : (isChamp ? _NOTIF_CHAMP_ICON : "");
      return `
      <div class="notif-item ${n.read ? "" : "unread"}" data-id="${n.id}" onclick="window._shNotifClick(this)">
        <div class="notif-dot ${n.read ? "read" : ""}"></div>
        ${iconHTML}
        <div class="notif-item-body">
          <div class="notif-item-title">${_esc(n.title)}</div>
          ${n.body ? `<div class="notif-item-desc">${_esc(n.body)}</div>` : ""}
          <div class="notif-item-time">${_ago(n.created_at)}</div>
        </div>
      </div>`;
    }).join("") + (_notifHasMore
      ? `<button class="notif-load-more" onclick="window._shLoadMoreNotifs()" style="display:block;width:100%;padding:11px;border:none;border-top:1px solid rgba(0,0,0,.06);background:none;font-family:inherit;font-size:.82rem;font-weight:600;color:var(--accent,#7c3aed);cursor:pointer">Load older</button>`
      : "");
  };

  window._shLoadNotifs = async function() {
    if (!myEmail || !db) return;
    // Sync the seen-watermark from the server (authoritative) the first time, so
    // the OS badge on a fresh device reflects the real "unseen" count rather than
    // treating every notification as new. Best-effort — falls back to localStorage.
    if (!_seenAt) {
      try {
        const { data: me } = await db.from("allowed_emails")
          .select("notif_seen_at").ilike("email", myEmail).maybeSingle();
        if (me?.notif_seen_at) {
          _seenAt = me.notif_seen_at;
          try { localStorage.setItem(_SEEN_KEY, _seenAt); } catch {}
        }
      } catch {}
    }
    // Fetch one page past the current window to detect whether "Load older" is needed.
    const { data } = await db.from("notifications").select("*")
      .eq("email", myEmail).order("created_at", { ascending: false })
      .limit(_notifLimit + 1);
    const rows = data || [];
    _notifHasMore = rows.length > _notifLimit;
    _notifs = _notifHasMore ? rows.slice(0, _notifLimit) : rows;
    _badge();
  };

  // "Load older" — grow the window and re-render.
  window._shLoadMoreNotifs = async function() {
    _notifLimit += 30;
    await window._shLoadNotifs();
    window._shRenderNotifs();
  };

  window._shNotifClick = async function(el) {
    const id = el.dataset.id;
    const n = _notifs.find(n => n.id === id);
    if (n && !n.read) {
      // Tapping an item clears its bold/unread highlight in the list. The OS
      // app-icon badge is "seen"-based (already cleared when the bell opened), so
      // we don't touch it here — only the in-app list state.
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

  // Advance the local seen-watermark to now and drop the OS app-icon badge to 0
  // immediately (web Badging API). Shared by "open bell" and "mark all read".
  function _stampSeenLocal() {
    _seenAt = new Date().toISOString();
    try { localStorage.setItem(_SEEN_KEY, _seenAt); } catch {}
    try { navigator.clearAppBadge?.(); } catch {}
  }

  window._shMarkAllRead = async function() {
    // Clear both signals: mark every item read (in-app bold) AND seen (icon badge).
    _notifs.forEach(n => n.read = true);
    _stampSeenLocal();
    _badge(); window._shRenderNotifs();
    // Mark ALL unread rows read for this user — not just the loaded window, and
    // case-insensitively so it matches send-push (which lowercases the email).
    await db.from("notifications").update({ read: true })
      .ilike("email", myEmail).eq("read", false);
    // Advance the server watermark + push the iOS badge to 0.
    await _shSyncAppBadge("seen");
  };
  window.markAllNotifsRead = window._shMarkAllRead;

  // Opening the bell counts as SEEING everything currently there: it clears the
  // OS app-icon badge but leaves unread items bold in the list to tap through.
  // This is the real fix for the "mystery" badge — informational notifications
  // (achievements, app updates, feed) no longer pile the icon badge up, because
  // the badge tracks "unseen since last open", not "unread forever". We do NOT
  // mark anything read here, so the unread highlights survive.
  window._shMarkSeen = async function() {
    if (!myEmail || !db) return;
    _stampSeenLocal();
    const el = document.getElementById("notif-badge");
    if (el && !_notifs.some(n => !n.read)) el.style.display = "none"; // no unread → hide dot too
    // Advance the server watermark + push the native iOS badge to 0.
    await _shSyncAppBadge("seen");
  };

  // Update the native iOS app-icon badge via a silent push from send-push.
  //   action "seen"  → advance the server seen-watermark, badge → 0 (bell opened).
  //   action true    → force badge to 0 without moving the watermark (legacy clear).
  //   action omitted → recompute badge = current unseen count.
  // No-op outside the app shell / for users with no devices.
  async function _shSyncAppBadge(action) {
    if (!myEmail || !db) return;
    try {
      const { data: { session } } = await db.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      const SUPA_URL = db?.supabaseUrl
        || (db?.rest?.url ? db.rest.url.replace(/\/rest\/v1$/, "") : null)
        || "https://gyskfutmncprqxazgatv.supabase.co";
      const payload = action === "seen"
        ? { mark_seen: true, email: myEmail }
        : action
          ? { clear_badge: true, email: myEmail }
          : { sync_badge: true, email: myEmail };
      await fetch(`${SUPA_URL}/functions/v1/send-push`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        // keepalive lets this request finish even if the page navigates away
        // immediately afterwards — e.g. tapping a bell notification marks it read
        // then navigates to the linked content. Without it the browser aborts the
        // in-flight request on unload and the badge never updates.
        keepalive: true,
      });
    } catch (e) { /* silent — badge sync is best-effort */ }
  }
  window._shSyncAppBadge = _shSyncAppBadge;
  window._shClearAppBadge = _shSyncAppBadge; // back-compat alias

  // ── Generic inline comment editor ───────────────────────────────────────────
  // Swaps a comment's text element for a textarea + Save/Cancel. Used by every
  // comment system (community, activity, content feed, updates, focus, events)
  // so the edit UX is identical everywhere. `currentText` is the raw (unescaped)
  // comment body; `onSave(newText)` must persist it and resolve — the caller
  // typically reloads its list afterwards, which replaces this DOM.
  window.shInlineEdit = function(textEl, currentText, onSave) {
    if (!textEl || textEl.dataset.shEditing === "1") return;
    textEl.dataset.shEditing = "1";
    const original = textEl.innerHTML;
    const wrap = document.createElement("div");
    wrap.innerHTML =
      '<textarea class="sh-edit-ta" rows="2" style="width:100%;box-sizing:border-box;resize:none;border:1.5px solid var(--accent);border-radius:8px;padding:8px 10px;font-family:inherit;font-size:.87rem;line-height:1.45;background:var(--surface);color:var(--text);outline:none"></textarea>' +
      '<div style="display:flex;justify-content:flex-end;gap:14px;margin-top:6px">' +
      '<button type="button" class="sh-edit-cancel" style="background:none;border:none;font-family:inherit;font-size:.8rem;cursor:pointer;color:var(--text-muted);padding:0">Cancel</button>' +
      '<button type="button" class="sh-edit-save" style="background:none;border:none;font-family:inherit;font-size:.8rem;font-weight:700;cursor:pointer;color:var(--accent);padding:0">Save</button>' +
      '</div>';
    textEl.innerHTML = "";
    textEl.appendChild(wrap);
    const ta = wrap.querySelector(".sh-edit-ta");
    ta.value = currentText || "";
    const grow = () => { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 200) + "px"; };
    ta.oninput = grow; grow();
    ta.focus();
    try { ta.setSelectionRange(ta.value.length, ta.value.length); } catch {}
    const restore = () => { textEl.innerHTML = original; textEl.dataset.shEditing = ""; };
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.preventDefault(); restore(); }
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); wrap.querySelector(".sh-edit-save").click(); }
    });
    wrap.querySelector(".sh-edit-cancel").onclick = restore;
    wrap.querySelector(".sh-edit-save").onclick = async () => {
      const val = ta.value.trim();
      if (!val) return;
      const btn = wrap.querySelector(".sh-edit-save");
      btn.disabled = true; btn.textContent = "Saving…";
      try { await onSave(val); }
      catch (err) {
        alert("Couldn't save the edit: " + (err?.message || err));
        btn.disabled = false; btn.textContent = "Save";
        return;
      }
      textEl.dataset.shEditing = ""; // caller reloads & replaces the DOM
    };
  };

  window._shSendUpdate = async function(broadcast) {
    const title    = document.getElementById("notif-admin-title")?.value.trim();
    const body     = document.getElementById("notif-admin-body")?.value.trim();
    const linkUrl  = document.getElementById("notif-admin-link")?.value.trim() || null;
    if (!title) { alert("Title is required"); return; }
    const baseRow  = { type: "app_update", title, body: body || null, link_url: linkUrl };
    if (broadcast) {
      const { data: members } = await db.from("allowed_emails").select("email");
      for (const m of (members || [])) {
        await db.from("notifications").insert({ ...baseRow, email: m.email });
      }
    } else {
      await db.from("notifications").insert({ ...baseRow, email: myEmail });
    }
    document.getElementById("notif-admin-title").value = "";
    document.getElementById("notif-admin-body").value  = "";
    const linkEl = document.getElementById("notif-admin-link");
    if (linkEl) linkEl.value = "";
    alert(broadcast ? "Sent to all members!" : "Sent to you!");
    await window._shLoadNotifs(); window._shRenderNotifs();
  };

  // Load on init
  window._shLoadNotifs().then(() => window._shRenderNotifs());

  /* Released when the page goes away. Every navigation opened two channels on
     fixed topic names and nothing ever closed them, so the server held each
     stale subscription until it timed out on its own. Navigate between the
     library and its filter tabs a few times and they stack up, which is the
     one thing here that only ever accumulates - and Realtime rate-limits joins,
     so past a point new ones are refused rather than merely slow.

     pagehide rather than beforeunload: beforeunload does not fire reliably on
     mobile, and pagehide also covers the page being frozen into the
     back/forward cache. */
  if (!window.__shChannelCleanup) {
    window.__shChannelCleanup = true;
    window.addEventListener("pagehide", () => {
      try { db.removeAllChannels(); } catch (e) { /* going away regardless */ }
    });
  }

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
