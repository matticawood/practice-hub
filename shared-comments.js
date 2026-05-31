/**
 * shared-comments.js — The Practice Room
 *
 * Drop-in comment/reaction/media system. Works on any page.
 *
 * USAGE
 * ─────
 * 1. Add to <head>:
 *      <script src="/shared-comments.js"></script>
 *
 * 2. After auth resolves, call once:
 *      initCommentsSystem({
 *        db,                          // supabase client
 *        auth: { email, name, avatarUrl, isAdmin },
 *        comments: {
 *          table:       'my_comments_table',
 *          parentField: 'post_id',      // FK column name
 *        },
 *        reactions: {
 *          table:       'my_likes_table',
 *          parentField: 'post_id',
 *          // emojis: ["❤️","👏","🔥","🎉","💪","😂"],  // optional
 *        },
 *        replyNotificationLinkFn: (parentId) => `/my-page.html?id=${parentId}`,
 *        // muxApiPath:    '/api/daily',             // optional
 *        // storageBucket: 'community-uploads',      // optional
 *      });
 *
 * 3. In your card/page HTML, include placeholders:
 *      <!-- comment list (filled by Comments.load) -->
 *      <div id="comments-list-${parentId}"></div>
 *      <!-- reaction button -->
 *      ${Comments.reactBtnHtml(parentId, safeKey)}
 *      <!-- comment form -->
 *      ${Comments.formHtml(parentId)}
 *
 * 4. Load comments when a section opens:
 *      await Comments.load(parentId);
 *
 * REACTION STATE
 * ─────────────
 * Pre-load reactions for a batch of parent IDs (e.g. after fetching posts):
 *      await Comments.loadReactions(arrayOfParentIds);
 * Then build the button HTML AFTER this resolves.
 */

(function () {
  'use strict';

  // ── Module config & state ────────────────────────────────────────────────────
  let _cfg = null;
  let _pollByComment = {}; // commentId → { pollId, question, opts, voteCountMap, myOptId, totalVotes }

  // Inline media composer state (keyed by toolbar key)
  const _inlineMedia    = {};
  const _inlinePollOpen = {};
  const _inlineVoiceRec = {};
  const _inlineRecTimer = {};
  const _inlineRecStart = {};
  let _inlineCamRec           = null;
  let _inlineCamKey           = null;
  let _inlineCamStream        = null;
  let _inlineCamPreviewStream = null;
  let _inlineCamPreviewKey    = null;
  let _muxUploading           = false;

  // Reaction state: _rxState[parentId][emoji] = { count, mine }
  const _rxState = {};
  // Per-comment reactions — uses activity_reactions table with the event_type
  // discriminator from config.commentReactionEventType (e.g. "focus_comment").
  // Keyed by commentId → { emoji: { count, mine } }.
  const _cmtRxState = {};
  // Maps commentId → { email, name } so reaction handlers can notify the
  // comment author. Populated each time Comments.load(parentId) runs.
  const _cmtMetaMap = {};
  let   _cmtOpenPicker = null;
  const _CMT_RX_EMOJIS = ["❤️","👏","🔥","🎉","💪","😂"];
  let _openPicker = null;
  const _cmtReactorsList = {}; // commentId → [{email, emoji}] (for "who reacted")
  const _cmtReactorInfo  = {}; // email → { name, url }
  let _cmtReactorsPopover = null;

  // Likers popover
  let _likersPopover = null;

  // Image lightbox
  const _imgGroups = {};
  let _imgCurrentGroup = null;
  let _imgCurrentIdx   = 0;

  // ── Config helpers ───────────────────────────────────────────────────────────
  function _auth()          { return _cfg?.auth || {}; }
  function _db()            { return _cfg?.db; }
  function _cTable()        { return _cfg?.comments?.table; }
  function _cParent()       { return _cfg?.comments?.parentField || 'parent_id'; }
  function _rTable()        { return _cfg?.reactions?.table; }
  function _rParent()       { return _cfg?.reactions?.parentField || 'parent_id'; }
  function _emojis()        { return _cfg?.reactions?.emojis || ["❤️","👏","🔥","🎉","💪","😂"]; }
  function _muxPath()       { return _cfg?.muxApiPath || '/api/daily'; }
  function _bucket()        { return _cfg?.storageBucket || 'community-uploads'; }
  function _notifyLink(id)  { return _cfg?.replyNotificationLinkFn?.(id) || '#'; }

  // ── Utility (module-private, but also set on window for template use) ────────
  function _escHtml(str) {
    return String(str ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }
  function _initials(name) {
    return (name||"").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) || "?";
  }
  function _avatarColour(email) {
    let h = 0;
    for (let i = 0; i < (email||"").length; i++) h = ((h<<5)-h)+email.charCodeAt(i);
    const hue = Math.abs(h) % 360;
    return { bg: `hsl(${hue},55%,72%)`, fg: `hsl(${hue},45%,22%)` };
  }
  function _avatarHtml(email, name, size=32, url=null) {
    const col = _avatarColour(email||"");
    const ini = _initials(name || (email||"").split("@")[0]);
    const r   = Math.round(size/2);
    if (url) return `<div style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;flex-shrink:0"><img src="${_escHtml(url)}" style="width:100%;height:100%;object-fit:cover;display:block" /></div>`;
    return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${col.bg};color:${col.fg};display:flex;align-items:center;justify-content:center;font-size:${Math.round(size*0.3)}px;font-weight:800;flex-shrink:0;font-family:inherit">${ini}</div>`;
  }
  function _relativeTime(ts) {
    if (!ts) return "";
    const d = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (d < 60)  return "just now";
    if (d < 3600) return `${Math.floor(d/60)}m ago`;
    if (d < 86400) return `${Math.floor(d/3600)}h ago`;
    if (d < 604800) return `${Math.floor(d/86400)}d ago`;
    return new Date(ts).toLocaleDateString("en-US", {month:"short",day:"numeric"});
  }
  function _audioMimeType(m) {
    if (m.mimeType) return m.mimeType;
    const ext = (m.name||"").split(".").pop().toLowerCase();
    return { m4a:"audio/mp4", mp4:"audio/mp4", ogg:"audio/ogg", webm:"audio/webm" }[ext] || "";
  }
  function _parseYouTubeId(url) {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&\s]+)/);
    return m ? m[1] : null;
  }
  function _parseVimeoId(url) {
    const m = url.match(/vimeo\.com\/(\d+)/);
    return m ? m[1] : null;
  }

  // ── CSS injection ────────────────────────────────────────────────────────────
  function _injectCSS() {
    if (document.getElementById('tc-comments-css')) return;
    const s = document.createElement('style');
    s.id = 'tc-comments-css';
    s.textContent = `
/* ── Comments ─────────────────────────────────────────────────────────────── */
.tc-comments-section { background:var(--surface); border:1.5px solid var(--border); border-radius:var(--radius,10px); overflow:hidden; }
.tc-comments-hdr { padding:14px 20px; border-bottom:1px solid var(--border); font-size:.78rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--text-muted); }
.tc-comment-item { display:flex; gap:10px; padding:13px 20px; border-bottom:1px solid rgba(0,0,0,.04); }
.tc-comment-item:last-of-type { border-bottom:none; }
.tc-comment-body { flex:1; min-width:0; }
.tc-comment-meta { display:flex; align-items:baseline; gap:8px; margin-bottom:3px; }
.tc-comment-name { font-size:.82rem; font-weight:700; color:var(--text); }
.tc-comment-time { font-size:.7rem; color:var(--text-muted); }
.tc-comment-text { font-size:.87rem; color:var(--text-muted); line-height:1.5; white-space:pre-wrap; word-break:break-word; }
.tc-reply-to-name { color:var(--accent); font-weight:600; margin-right:4px; }
.tc-comments-empty { padding:24px 20px; text-align:center; color:var(--text-muted); font-size:.82rem; }
.tc-comment-reply-btn { background:none; border:none; cursor:pointer; font-family:inherit; font-size:.72rem; font-weight:600; color:var(--text-muted); padding:3px 0; transition:color .15s; display:inline-block; }
.tc-comment-reply-btn:hover { color:var(--accent); }
.tc-comment-action-row { display:flex; align-items:center; gap:14px; margin-top:4px; }
.tc-cmt-react-btn { display:inline-flex; align-items:center; gap:4px; background:none; border:none; padding:2px 0; font-size:.72rem; font-weight:600; color:var(--text-muted); cursor:pointer; font-family:inherit; transition:color .15s; line-height:1; }
.tc-cmt-react-btn:hover { color:var(--text); }
.tc-cmt-react-btn.liked { color:#e879a0; }
.tc-cmt-react-btn svg { flex-shrink:0; }
.tc-comment-replies { margin-left:36px; margin-top:8px; display:flex; flex-direction:column; gap:4px; }
/* Reply composer — uses same .tc-comment-item.is-reply structure as community.html */
.tc-reply-composer { padding:13px 20px; width:100%; box-sizing:border-box; }
.tc-reply-composer-inner { display:flex; gap:10px; align-items:flex-start; width:100%; }
.tc-reply-composer-body { flex:1 1 auto; min-width:0; }
.tc-reply-composer textarea { width:100%; box-sizing:border-box; background:transparent; border:1.5px solid var(--accent); border-radius:16px; color:var(--text); font-size:.85rem; font-family:inherit; padding:7px 12px; resize:none; min-height:34px; max-height:100px; display:block; }
.tc-reply-composer textarea:focus { outline:none; }
.tc-irc-actions { display:flex; justify-content:flex-end; gap:14px; margin-top:8px; margin-bottom:6px; }
.tc-irc-send { background:none; border:none; font-family:inherit; font-size:.8rem; font-weight:700; cursor:pointer; color:var(--accent); padding:0; }
.tc-irc-cancel { background:none; border:none; font-family:inherit; font-size:.8rem; cursor:pointer; color:var(--text-muted); padding:0; }
.tc-irc-cancel:hover { color:var(--text); }
/* Main comment form */
.tc-comment-form { display:flex; gap:10px; align-items:flex-start; padding:14px 20px; border-top:1px solid var(--border); }
.tc-comment-form-body { flex:1; min-width:0; }
.tc-comment-form-top { display:flex; gap:8px; align-items:flex-end; }
.tc-comment-form-top textarea { flex:1; background:transparent; border:1.5px solid var(--border); border-radius:20px; color:var(--text); font-size:.87rem; font-family:inherit; padding:9px 14px; resize:none; min-height:38px; max-height:120px; transition:border-color .15s; box-sizing:border-box; }
.tc-comment-form-top textarea:focus { outline:none; border-color:var(--accent); }
.tc-comment-form-body .composer-toolbar { margin-top:6px; }
.tc-send-btn { background:var(--accent); color:#1a1410; border:none; border-radius:20px; padding:0 18px; height:38px; font-family:inherit; font-size:.85rem; font-weight:700; cursor:pointer; flex-shrink:0; transition:opacity .15s; }
.tc-send-btn:hover { opacity:.85; }
.tc-send-btn:disabled { opacity:.4; cursor:default; }
/* Comment media display */
.tc-comment-media img { max-width:100%; max-height:240px; border-radius:8px; margin-top:7px; object-fit:cover; cursor:zoom-in; }
.tc-comment-media video { max-width:100%; max-height:240px; border-radius:8px; margin-top:7px; }
.tc-comment-media audio { width:100%; margin-top:7px; }
/* Reaction picker */
.tc-react-picker { position:absolute; bottom:calc(100% + 8px); left:0; background:var(--surface-2); border:1.5px solid var(--border); border-radius:32px; padding:6px 8px; display:flex; align-items:center; gap:2px; box-shadow:0 8px 24px rgba(0,0,0,.5); z-index:200; white-space:nowrap; }
.tc-react-picker button { display:inline-flex; flex-direction:column; align-items:center; gap:1px; background:none; border:none; border-radius:10px; padding:5px 7px; cursor:pointer; font-size:1.3rem; line-height:1; transition:transform .12s, background .12s; }
.tc-react-picker button:hover { transform:scale(1.35); background:rgba(0,0,0,.06); }
.tc-react-picker button.picked { background:rgba(0,0,0,.07); }
.tc-react-picker button .picker-count { font-size:.62rem; color:var(--text-muted); font-family:inherit; line-height:1; }
/* Likers popover */
.tc-likers-popover { position:fixed; z-index:9999; background:var(--surface); border:1.5px solid var(--border); border-radius:10px; padding:10px 14px; box-shadow:0 8px 24px rgba(0,0,0,.45); min-width:140px; max-width:220px; }
.tc-likers-popover-title { font-size:.72rem; color:var(--text-muted); margin-bottom:8px; font-weight:600; letter-spacing:.03em; text-transform:uppercase; }
.tc-likers-popover-row { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
.tc-likers-popover-row:last-child { margin-bottom:0; }
.tc-likers-popover-avatar { width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:.6rem; font-weight:800; flex-shrink:0; overflow:hidden; }
.tc-likers-popover-name { font-size:.82rem; color:var(--text); }
/* Stacked liker avatar chips */
.tc-like-avatars { display:inline-flex; align-items:center; }
.tc-like-chip { width:22px; height:22px; border-radius:50%; border:2px solid var(--surface); margin-left:-6px; flex-shrink:0; overflow:hidden; display:flex; align-items:center; justify-content:center; font-size:.52rem; font-weight:800; }
.tc-like-chip:first-child { margin-left:0; }
.tc-like-chip img { width:100%; height:100%; object-fit:cover; border-radius:50%; display:block; }
/* ── Inline composer toolbar ──────────────────────────────────────────────── */
.composer-toolbar { display:flex; align-items:center; gap:4px; flex:1; flex-wrap:wrap; }
.toolbar-btn { width:32px; height:32px; background:none; border:1.5px solid transparent; border-radius:8px; cursor:pointer; font-size:1.05rem; display:flex; align-items:center; justify-content:center; color:var(--text-muted); transition:background .15s, border-color .15s, color .15s; position:relative; font-family:inherit; }
.toolbar-btn:hover { background:rgba(0,0,0,.05); color:var(--text); border-color:var(--border); }
.toolbar-btn.recording { color:#ef4444; border-color:#ef4444; animation:tc-pulse-red 1s ease-in-out infinite; }
.toolbar-btn[title]:hover::after { content:attr(title); position:absolute; bottom:calc(100% + 6px); left:50%; transform:translateX(-50%); background:var(--surface-2); border:1px solid var(--border); color:var(--text); font-size:.72rem; white-space:nowrap; padding:3px 8px; border-radius:5px; pointer-events:none; z-index:1000; }
@keyframes tc-pulse-red { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0)} 50%{box-shadow:0 0 0 5px rgba(239,68,68,.25)} }
/* Recording indicator */
.recording-indicator { display:flex; align-items:center; gap:8px; font-size:.8rem; color:#ef4444; font-weight:600; background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.3); border-radius:20px; padding:4px 12px; margin-top:8px; }
.recording-stop-btn { background:rgba(239,68,68,.2); border:1px solid rgba(239,68,68,.4); border-radius:12px; color:#ef4444; cursor:pointer; font-size:.75rem; font-weight:700; padding:2px 10px; margin-left:4px; }
.recording-dot { width:8px; height:8px; border-radius:50%; background:#ef4444; animation:tc-pulse-red 1s ease-in-out infinite; }
/* Video recording panel */
.video-rec-panel { background:#0d0d0d; border:1.5px solid var(--border); border-radius:12px; overflow:hidden; margin-top:10px; }
.video-rec-preview { display:block; width:100%; height:auto; background:#000; }
.video-rec-devices { display:flex; flex-wrap:wrap; gap:8px; padding:10px 12px 0; background:var(--surface); }
.video-rec-select { flex:1; min-width:0; background:var(--bg); border:1.5px solid var(--border); border-radius:8px; color:var(--text); font-size:.78rem; padding:6px 8px; font-family:inherit; outline:none; }
.video-rec-actions { display:flex; gap:8px; padding:10px 12px 12px; background:var(--surface); }
.video-rec-start-btn { flex:1; background:#ef4444; color:#fff; border:none; border-radius:8px; font-weight:700; font-size:.87rem; padding:10px; cursor:pointer; transition:opacity .15s; }
.video-rec-start-btn:hover { opacity:.85; }
.video-rec-cancel-btn { background:var(--bg); border:1.5px solid var(--border); border-radius:8px; color:var(--text-muted); cursor:pointer; font-size:.85rem; padding:10px 16px; }
.video-rec-recording-bar { display:flex; align-items:center; gap:10px; padding:10px 14px 12px; background:var(--surface); border-top:1px solid var(--border); }
/* Mux upload overlay */
.mux-upload-overlay { display:flex; align-items:center; gap:14px; background:rgba(245,197,24,.07); border:1.5px solid rgba(245,197,24,.25); border-radius:10px; padding:14px 16px; margin-bottom:10px; }
.mux-upload-overlay-icon { font-size:1.5rem; flex-shrink:0; }
.mux-upload-overlay-body { flex:1; min-width:0; }
.mux-upload-overlay-filename { font-size:.85rem; font-weight:600; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:8px; }
.mux-upload-overlay-track { width:100%; height:5px; background:rgba(0,0,0,.08); border-radius:4px; overflow:hidden; margin-bottom:6px; }
.mux-upload-overlay-bar { height:100%; background:var(--accent); border-radius:4px; transition:width .25s ease; width:0%; }
.mux-upload-overlay-status { font-size:.75rem; color:var(--text-muted); }
.mux-upload-overlay-bar.processing { background-image:repeating-linear-gradient(45deg,rgba(0,0,0,.12) 0px,rgba(0,0,0,.12) 10px,transparent 10px,transparent 20px); background-size:40px 100%; animation:tc-stripe .8s linear infinite; background-color:var(--accent); }
.mux-upload-overlay-status.processing { animation:tc-mux-pulse 1.4s ease-in-out infinite; color:var(--accent); }
@keyframes tc-stripe { 0%{background-position:0 0} 100%{background-position:40px 0} }
@keyframes tc-mux-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
/* Poll display (comment media) — mirrors community.html exactly */
.poll-card { background:transparent; border:none; border-radius:10px; padding:0; margin-top:10px; margin-bottom:8px; }
.poll-card-question { font-size:0.97rem; font-weight:700; color:var(--text,#1a1410); margin-bottom:12px; }
.poll-option-vote-btn { width:100%; text-align:left; background:rgba(0,0,0,.04); border:1.5px solid var(--border,#e0d5c8); border-radius:8px; padding:9px 14px; font-size:0.87rem; color:var(--text,#1a1410); font-family:inherit; cursor:pointer; margin-bottom:8px; transition:border-color .15s, background .15s; display:block; box-sizing:border-box; }
.poll-option-vote-btn:hover { border-color:var(--accent,#f5c518); background:rgba(245,197,24,.07); }
.poll-bar-row { margin-bottom:8px; cursor:pointer; border-radius:6px; padding:2px 4px; }
.poll-bar-row:hover .poll-bar-fill { filter:brightness(1.15); }
.poll-bar-label { display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; color:var(--text,#1a1410); margin-bottom:4px; }
.poll-bar-label span:last-child { color:var(--text-muted,#8a7868); font-size:0.78rem; }
.poll-bar-track { background:rgba(0,0,0,.06); border-radius:4px; height:6px; }
.poll-bar-fill { height:100%; border-radius:4px; background:var(--accent,#f5c518); transition:width .4s ease; }
.poll-bar-fill.mine { background:#10b981; }
.poll-footer { display:flex; align-items:center; margin-top:10px; }
.poll-total { font-size:0.75rem; color:var(--text-muted,#8a7868); }
/* Poll builder */
.poll-builder { background:var(--surface); border:1.5px solid var(--border); border-radius:10px; padding:14px; margin-top:10px; }
.poll-builder-title { font-size:.78rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--text-muted); margin-bottom:10px; }
.poll-question-input, .poll-option-input { width:100%; box-sizing:border-box; background:var(--surface); border:1.5px solid var(--border); border-radius:7px; color:var(--text); font-size:.87rem; font-family:inherit; padding:8px 12px; margin-bottom:8px; transition:border-color .15s; }
.poll-question-input:focus, .poll-option-input:focus { outline:none; border-color:var(--accent); }
.poll-options-list { display:flex; flex-direction:column; gap:6px; margin-bottom:8px; }
.poll-option-row { display:flex; align-items:center; gap:6px; }
.poll-option-row input { flex:1; margin-bottom:0; }
.poll-option-remove { background:none; border:none; cursor:pointer; color:var(--text-muted); font-size:1.1rem; line-height:1; padding:2px 4px; transition:color .15s; }
.poll-option-remove:hover { color:#ef4444; }
.poll-add-option { background:none; border:1.5px dashed var(--border); border-radius:7px; color:var(--text-muted); font-size:.82rem; font-family:inherit; padding:6px 12px; cursor:pointer; width:100%; transition:border-color .15s, color .15s; }
.poll-add-option:hover { border-color:var(--accent); color:var(--accent); }
/* Media preview */
.media-preview-area { margin-top:10px; }
.media-preview-images { display:grid; gap:6px; margin-bottom:6px; }
.media-thumb-wrap { position:relative; display:block; }
.media-thumb-wrap img { width:100%; height:auto; max-height:420px; object-fit:contain; border-radius:8px; border:1.5px solid var(--border); display:block; }
.media-thumb-remove { position:absolute; top:6px; right:6px; width:22px; height:22px; border-radius:50%; background:rgba(0,0,0,.55); border:none; color:#fff; font-size:.8rem; line-height:1; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background .15s; }
.media-thumb-remove:hover { background:#ef4444; }
.media-chip { display:inline-flex; align-items:center; gap:6px; background:var(--surface-2); border:1.5px solid var(--border); border-radius:20px; padding:5px 10px 5px 8px; font-size:.8rem; color:var(--text-muted); margin:4px 4px 4px 0; }
.media-chip-remove { background:none; border:none; cursor:pointer; color:var(--text-muted); font-size:1rem; line-height:1; padding:0 2px; transition:color .15s; }
.media-chip-remove:hover { color:#ef4444; }
/* Image lightbox */
#tc-img-modal { position:fixed; inset:0; z-index:9000; background:rgba(0,0,0,.88); display:none; align-items:center; justify-content:center; opacity:0; transition:opacity .18s ease; }
#tc-img-modal.open { display:flex; opacity:1; }
#tc-img-modal img { max-width:min(84vw,1200px); max-height:88vh; border-radius:10px; object-fit:contain; box-shadow:0 8px 48px rgba(0,0,0,.7); }
#tc-img-modal-close { position:absolute; top:16px; right:18px; background:rgba(255,255,255,.12); border:none; border-radius:50%; width:38px; height:38px; cursor:pointer; color:#fff; font-size:1.3rem; display:flex; align-items:center; justify-content:center; transition:background .15s; }
#tc-img-modal-close:hover { background:rgba(255,255,255,.22); }
.tc-img-modal-nav { position:absolute; top:50%; transform:translateY(-50%); background:rgba(255,255,255,.12); border:none; border-radius:50%; width:44px; height:44px; cursor:pointer; color:#fff; display:flex; align-items:center; justify-content:center; transition:background .15s; }
.tc-img-modal-nav:hover { background:rgba(255,255,255,.26); }
.tc-img-modal-nav:disabled { opacity:0; pointer-events:none; }
#tc-img-modal-prev { left:14px; }
#tc-img-modal-next { right:14px; }
#tc-img-modal-counter { position:absolute; bottom:18px; left:50%; transform:translateX(-50%); color:rgba(255,255,255,.6); font-size:.82rem; font-weight:600; background:rgba(0,0,0,.4); padding:3px 10px; border-radius:20px; pointer-events:none; }
`;
    document.head.appendChild(s);
  }

  // ── Image modal HTML ─────────────────────────────────────────────────────────
  function _injectModal() {
    if (document.getElementById('tc-img-modal')) return;
    const div = document.createElement('div');
    div.innerHTML = `
      <div id="tc-img-modal" onclick="if(event.target===this)_tcImgClose()">
        <button id="tc-img-modal-close" onclick="_tcImgClose()">✕</button>
        <button class="tc-img-modal-nav" id="tc-img-modal-prev" onclick="_tcImgNav(-1)">‹</button>
        <img id="tc-img-modal-img" src="" alt="" />
        <button class="tc-img-modal-nav" id="tc-img-modal-next" onclick="_tcImgNav(1)">›</button>
        <div id="tc-img-modal-counter"></div>
      </div>`;
    document.body.appendChild(div.firstElementChild);
  }

  // ── Storage ──────────────────────────────────────────────────────────────────
  async function _compressImage(file, { maxPx=1920, quality=0.82 }={}) {
    if (file.type==="image/gif") return file;
    return new Promise(resolve => {
      const img = new Image();
      const raw = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(raw);
        let { naturalWidth:w, naturalHeight:h } = img;
        if (w>maxPx||h>maxPx) { const r=Math.min(maxPx/w,maxPx/h); w=Math.round(w*r); h=Math.round(h*r); }
        const c=document.createElement("canvas"); c.width=w; c.height=h;
        c.getContext("2d").drawImage(img,0,0,w,h);
        c.toBlob(blob=>{
          if(!blob||blob.size>=file.size){resolve(file);return;}
          resolve(new File([blob], file.name.replace(/\.[^.]+$/,"")+".jpg",{type:"image/jpeg"}));
        },"image/jpeg",quality);
      };
      img.onerror=()=>{URL.revokeObjectURL(raw);resolve(file);};
      img.src=raw;
    });
  }

  async function _uploadToStorage(blob, filename) {
    const MAX_MB=500;
    if (blob.size>MAX_MB*1024*1024) throw new Error(`"${filename}" is ${(blob.size/1024/1024).toFixed(0)} MB — files must be under ${MAX_MB} MB.`);
    const email = _auth().email || 'user';
    const safe  = `${email}/${Date.now()}-${filename.replace(/[^a-z0-9._-]/gi,"_")}`;
    const { data, error } = await _db().storage.from(_bucket()).upload(safe, blob);
    if (error) {
      if (error.message?.toLowerCase().includes("size")||error.statusCode===413)
        throw new Error(`"${filename}" is too large. Try a smaller file or use a video embed instead.`);
      throw error;
    }
    return _db().storage.from(_bucket()).getPublicUrl(data.path).data.publicUrl;
  }

  // ── Mux ──────────────────────────────────────────────────────────────────────
  async function _deleteMuxAsset(assetId) {
    if (!assetId) return;
    try {
      const token=(await _db().auth.getSession()).data.session?.access_token;
      await fetch(_muxPath(),{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},body:JSON.stringify({action:"delete-mux-asset",assetId})});
    } catch(e){console.warn("[Mux] asset delete failed:",e);}
  }

  function _setMuxOverlay(key,o) {
    const bar=document.getElementById(`tc-mux-bar-${key}`);
    const st =document.getElementById(`tc-mux-status-${key}`);
    if(bar&&o.pct!==undefined)    bar.style.width=o.pct+"%";
    if(bar&&o.processing!==undefined) bar.className="mux-upload-overlay-bar"+(o.processing?" processing":"");
    if(st &&o.status!==undefined) st.textContent=o.status;
  }

  // Safely parse a JSON response from /api/daily. When the edge function crashes,
  // Netlify returns a plain-text wrapper (e.g. "edge function failed to respond")
  // and JSON.parse blows up with a useless "Unexpected token 'e'..." error.
  // We capture the raw text and surface it to the user instead.
  async function _readJsonOrThrow(res, what) {
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); }
    catch {
      const snippet = (text || "").slice(0, 200).trim() || "(empty response)";
      throw new Error(`${what} failed (HTTP ${res.status}): ${snippet}`);
    }
    if (!res.ok || data?.error) {
      const msg = (data && (data.error?.messages?.[0] || data.error?.message || data.error)) || `HTTP ${res.status}`;
      throw new Error(`${what}: ${typeof msg === "string" ? msg : JSON.stringify(msg)}`);
    }
    return data;
  }

  async function _uploadVideoToMux(file, onDone) {
    if (!file||!file.type.startsWith("video/")) { alert("Please select a video file."); return; }
    if (_muxUploading) { alert("A video upload is already in progress."); return; }
    _muxUploading=true;
    try {
      const token=(await _db().auth.getSession()).data.session?.access_token;
      if (!token) throw new Error("You appear to be signed out.");
      const res  = await fetch(_muxPath(),{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},body:JSON.stringify({action:"create-mux-upload"})});
      const data = await _readJsonOrThrow(res, "Create upload");
      const {uploadId, uploadUrl} = data;
      if (!uploadUrl) throw new Error("No upload URL returned");

      onDone?.({_progress:"Uploading… 0%"});
      await new Promise((res,rej)=>{
        const xhr=new XMLHttpRequest();
        xhr.open("PUT",uploadUrl);
        xhr.upload.onprogress=e=>{if(e.lengthComputable)onDone?.({_progress:`Uploading… ${Math.round(e.loaded/e.total*100)}%`});};
        xhr.onload=()=>xhr.status<300?res():rej(new Error("Upload to Mux failed ("+xhr.status+")"));
        xhr.onerror=()=>rej(new Error("Network error uploading to Mux"));
        xhr.send(file);
      });
      onDone?.({_progress:"Processing…"});
      let playbackId=null, assetId=null;
      for (let i=0;i<72;i++) {
        await new Promise(r=>setTimeout(r,5000));
        const sRes = await fetch(_muxPath(),{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},body:JSON.stringify({action:"get-mux-upload-status",uploadId})});
        const s    = await _readJsonOrThrow(sRes, "Status check");
        if(s.playbackId&&s.assetStatus==="ready"){playbackId=s.playbackId;assetId=s.assetId;break;}
        if(s.status==="errored"||s.assetStatus==="errored") throw new Error("Mux reported an error processing the asset");
      }
      if (!playbackId) throw new Error("Video processing timed out — try again");
      if (onDone) onDone({type:"mux",playbackId,assetId,name:file.name});
    } catch(e) {
      console.error("[Mux]",e);
      if (onDone) onDone({_error:e.message});
    } finally { _muxUploading=false; }
  }

  // ── Inline toolbar ───────────────────────────────────────────────────────────
  function _key(k) { if(!_inlineMedia[k]) _inlineMedia[k]=[]; return k; }

  function _renderPreview(key) {
    const area=document.getElementById(`inline-media-preview-${key}`);
    if (!area) return;
    const media=_inlineMedia[key]||[];
    if (!media.length){area.innerHTML="";_setSendDisabled(key,false);return;}
    const images=media.filter(m=>m.type==="image");
    const others=media.filter(m=>m.type!=="image");
    let html="";
    if (images.length) {
      const cols=Math.min(images.length,2);
      html+=`<div class="media-preview-images" style="grid-template-columns:repeat(${cols},1fr)">`+
        images.map((m,_i)=>{
          const idx=media.indexOf(m);
          return`<div class="media-thumb-wrap"><img src="${m.url}" alt="${_escHtml(m.name)}" style="${cols>1?"height:180px;object-fit:cover":""}"/><button class="media-thumb-remove" onclick="removeInlineMedia('${key}',${idx})" title="Remove">×</button></div>`;
        }).join("")+`</div>`;
    }
    const rmBtn=fn=>`<button onclick="${fn}" style="position:absolute;top:6px;right:6px;width:22px;height:22px;border-radius:50%;background:rgba(0,0,0,.55);border:none;color:#fff;font-size:.8rem;display:flex;align-items:center;justify-content:center;cursor:pointer" onmouseover="this.style.background='#ef4444'" onmouseout="this.style.background='rgba(0,0,0,.55)'">×</button>`;
    others.forEach(m=>{
      const idx=media.indexOf(m);
      const rm=`removeInlineMedia('${key}',${idx})`;
      if(m.type==="mux"){
        if(m._uploading){
          html+=`<div style="position:relative;margin-top:6px"><div class="mux-upload-overlay" style="margin-bottom:0"><div class="mux-upload-overlay-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg></div><div class="mux-upload-overlay-body"><div class="mux-upload-overlay-filename">${_escHtml(m.name)}</div><div class="mux-upload-overlay-track"><div class="mux-upload-overlay-bar processing" id="tc-mux-bar-${key}"></div></div><div class="mux-upload-overlay-status processing" id="tc-mux-status-${key}">${_escHtml(m._progress||"Uploading…")}</div></div></div>${rmBtn(rm)}</div>`;
        } else {
          html+=`<div style="position:relative;margin-top:6px"><div style="position:relative;width:100%;height:min(180px,24vh);overflow:hidden;border-radius:8px;background:var(--surface)"><mux-player playback-id="${_escHtml(m.playbackId)}" controls style="position:absolute;top:0;left:0;width:100%;height:100%"></mux-player></div>${rmBtn(rm)}</div>`;
        }
      } else if(m.type==="youtube"){
        html+=`<div style="position:relative;margin-top:6px;padding-bottom:56.25%;height:0;border-radius:8px;overflow:hidden"><iframe src="https://www.youtube.com/embed/${_escHtml(m.ytId)}" style="position:absolute;top:0;left:0;width:100%;height:100%" frameborder="0" allowfullscreen loading="lazy"></iframe>${rmBtn(rm)}</div>`;
      } else if(m.type==="vimeo"){
        html+=`<div style="position:relative;margin-top:6px;padding-bottom:56.25%;height:0;border-radius:8px;overflow:hidden"><iframe src="https://player.vimeo.com/video/${_escHtml(m.vimeoId)}" style="position:absolute;top:0;left:0;width:100%;height:100%" frameborder="0" allowfullscreen loading="lazy"></iframe>${rmBtn(rm)}</div>`;
      } else if(m.type==="audio"){
        const dur=m.duration?` · ${m.duration}s`:"";
        html+=`<div style="margin-top:6px"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px"><span style="font-size:.78rem;color:var(--text-muted)">🎙️ Voice message${_escHtml(dur)}</span><button onclick="${rm}" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:.85rem;padding:0 2px" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='var(--text-muted)'">×</button></div><audio controls preload="metadata" style="width:100%;display:block;border-radius:8px"><source src="${_escHtml(m.url)}" type="${_audioMimeType(m)}"></audio></div>`;
      } else {
        html+=`<span class="media-chip" style="margin-top:6px"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> ${_escHtml(m.name)}<button class="media-chip-remove" onclick="${rm}" title="Remove">×</button></span>`;
      }
    });
    area.innerHTML=html;
    _setSendDisabled(key, (media||[]).some(m=>m._uploading));
  }

  function _setSendDisabled(key, disabled) {
    const btn=document.getElementById(`send-btn-${key}`);
    if (btn) { btn.disabled=disabled; btn.title=disabled?"Please wait — video is processing…":""; }
  }

  function _closeExcept(key, except) {
    if(except!=="video"){const vp=document.getElementById(`inline-vid-panel-${key}`);if(vp&&vp.style.display!=="none"){vp.style.display="none";document.getElementById(`inline-vid-btn-${key}`)?.classList.remove("recording");}}
    if(except!=="poll"){const pp=document.getElementById(`inline-poll-${key}`);if(pp&&pp.style.display!=="none"){pp.style.display="none";_inlinePollOpen[key]=false;document.getElementById(`inline-poll-btn-${key}`)?.classList.remove("recording");}}
    if(except!=="cam"){if(_inlineCamPreviewKey===key)inlineCancelCamPreview(key);if(_inlineCamKey===key&&_inlineCamRec&&_inlineCamRec.state!=="inactive")_inlineCamRec.stop();}
    if(except!=="voice"){if(_inlineVoiceRec[key]&&_inlineVoiceRec[key].state!=="inactive")_inlineVoiceRec[key].stop();}
  }

  // ── Toolbar HTML generator ───────────────────────────────────────────────────
  function _toolbarHtml(key) {
    const tabBase="background:none;border:none;font-family:inherit;font-size:.78rem;cursor:pointer;padding:4px 8px;border-radius:4px;color:var(--text-muted)";
    const tabAct ="background:rgba(0,0,0,.07);border-radius:4px;font-weight:600";
    return `
      <div class="composer-toolbar" id="inline-main-toolbar-${key}" style="flex-wrap:wrap;margin-top:4px">
        <button class="toolbar-btn" title="Image" onclick="document.getElementById('tc-fi-img-${key}').click()"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></button>
        <button class="toolbar-btn" title="File" onclick="document.getElementById('tc-fi-file-${key}').click()"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg></button>
        <button class="toolbar-btn" title="Video / embed" id="inline-vid-btn-${key}" onclick="inlineToggleVideoPanel('${key}')"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="4"/><polygon points="10 8 18 12 10 16 10 8" fill="currentColor" stroke="none"/></svg></button>
        <button class="toolbar-btn" title="Record video" id="inline-camrec-btn-${key}" onclick="inlineToggleCamRec('${key}')"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg></button>
        <button class="toolbar-btn" title="Voice recording" id="inline-voice-btn-${key}" onclick="toggleInlineVoice('${key}')"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg></button>
        <button class="toolbar-btn" title="Poll" id="inline-poll-btn-${key}" onclick="toggleInlinePoll('${key}')"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></button>
        <input type="file" id="tc-fi-img-${key}" accept="image/*" multiple style="display:none" onchange="tcHandleImage(this,'${key}')">
        <input type="file" id="tc-fi-file-${key}" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.mp3,.wav,.aiff,.aif,.flac,.m4a,.ogg,.opus,.wma,.mid,.midi" style="display:none" onchange="tcHandleFile(this,'${key}')">
        <input type="file" id="tc-fi-vid-${key}" accept="video/*" style="display:none" onchange="tcHandleVideo(this,'${key}')">
      </div>
      <div id="inline-recording-${key}" style="display:none" class="recording-indicator">
        <span class="recording-dot"></span>
        <span>Recording…</span>
        <span id="inline-rec-time-${key}" style="margin-left:4px;opacity:.8">0:00</span>
        <button class="recording-stop-btn" onclick="stopInlineVoice('${key}')">■ Stop</button>
      </div>
      <div id="inline-cam-panel-${key}" style="display:none" class="video-rec-panel">
        <video id="inline-cam-preview-${key}" autoplay muted playsinline class="video-rec-preview"></video>
        <div class="video-rec-devices" id="inline-cam-devices-${key}">
          <select id="inline-cam-sel-${key}" class="video-rec-select" onchange="inlineSwitchCamDevice('${key}')"><option>Loading cameras…</option></select>
          <select id="inline-mic-sel-${key}" class="video-rec-select" onchange="inlineSwitchCamDevice('${key}')"><option>Loading mics…</option></select>
        </div>
        <div class="video-rec-actions" id="inline-cam-actions-${key}">
          <button class="video-rec-start-btn" onclick="inlineStartCamRecording('${key}')">⏺ Start Recording</button>
          <button class="video-rec-cancel-btn" onclick="inlineCancelCamPreview('${key}')">Cancel</button>
        </div>
        <div class="video-rec-recording-bar" id="inline-cam-recbar-${key}" style="display:none">
          <span class="recording-dot"></span>
          <span id="inline-cam-timer-${key}" style="font-size:.88rem;font-weight:600;color:var(--text);flex:1">0:00</span>
          <button class="video-rec-stop-btn" onclick="inlineStopCamRecording('${key}')">■ Stop & Upload</button>
        </div>
      </div>
      <div id="inline-vid-panel-${key}" style="display:none;background:var(--surface);border:1.5px solid var(--border);border-radius:8px;padding:10px 12px;margin-top:4px">
        <div style="display:flex;gap:4px;margin-bottom:8px">
          <button id="inline-vt-up-btn-${key}" style="${tabBase};${tabAct}" onclick="inlineSwitchVideoTab('upload','${key}')">Upload</button>
          <button id="inline-vt-em-btn-${key}" style="${tabBase}" onclick="inlineSwitchVideoTab('embed','${key}')">Embed URL</button>
        </div>
        <div id="inline-vt-up-${key}">
          <div onclick="document.getElementById('tc-fi-vid-${key}').click()" style="border:2px dashed var(--border);border-radius:6px;padding:14px;text-align:center;cursor:pointer;font-size:.84rem;color:var(--text-muted)">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:0 auto 6px"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
            Choose video file
          </div>
        </div>
        <div id="inline-vt-em-${key}" style="display:none">
          <input type="text" id="inline-vurl-${key}" placeholder="YouTube or Vimeo URL…" style="width:100%;box-sizing:border-box;background:var(--bg);border:1.5px solid var(--border);border-radius:6px;padding:7px 10px;color:var(--text);font-size:.88rem;font-family:inherit;margin-bottom:6px">
          <button onclick="inlineAddVideoUrl('${key}')" style="background:var(--accent);color:#000;border:none;border-radius:6px;padding:6px 14px;font-size:.84rem;font-weight:600;cursor:pointer;font-family:inherit">Add</button>
        </div>
      </div>
      <div id="inline-poll-${key}" style="display:none" class="poll-builder">
        <div class="poll-builder-title">Poll</div>
        <input class="poll-question-input" id="inline-poll-q-${key}" placeholder="Ask a question…" />
        <div class="poll-options-list" id="inline-poll-opts-${key}">
          <div class="poll-option-row"><input class="poll-option-input" placeholder="Option 1" /><button class="poll-option-remove" onclick="removeInlinePollOption(this)">×</button></div>
          <div class="poll-option-row"><input class="poll-option-input" placeholder="Option 2" /><button class="poll-option-remove" onclick="removeInlinePollOption(this)">×</button></div>
        </div>
        <button class="poll-add-option" onclick="addInlinePollOption('${key}')">+ Add option</button>
      </div>
      <div class="media-preview-area" id="inline-media-preview-${key}"></div>`;
  }

  // ── Render comment media (displayed in comment list) ─────────────────────────
  function _renderCommentMedia(c) {
    const media=Array.isArray(c.media)?c.media:[];
    if(!media.length)return"";
    let html="";
    const images=media.filter(m=>m.type==="image");
    const others=media.filter(m=>m.type!=="image");
    if(images.length){
      const cols=Math.min(images.length,2);
      const multi=cols>1;
      const gk=_imgGroupStore(images.map(m=>m.url));
      html+=`<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:6px;margin-top:6px">`+
        images.map((m,i)=>`<div style="border-radius:8px;cursor:pointer" onclick="_tcImgOpen('${gk}',${i})"><img src="${_escHtml(m.url)}" alt="${_escHtml(m.name)}" decoding="async" style="width:100%;${multi?"":"max-height:420px;object-fit:contain;"}border-radius:8px;" loading="lazy"></div>`).join("")+`</div>`;
    }
    others.forEach(m=>{
      if(m.type==="mux")          html+=`<div style="margin-top:8px;width:min(480px,70vw);aspect-ratio:16/9;border-radius:8px;overflow:hidden;background:var(--surface)"><mux-player playback-id="${_escHtml(m.playbackId||m.playback_id)}" controls style="width:100%;height:100%;display:block"></mux-player></div>`;
      else if(m.type==="audio")   html+=`<div style="margin-top:6px;min-width:240px"><audio controls preload="metadata" style="width:100%;min-width:240px;border-radius:8px"><source src="${_escHtml(m.url)}" type="${_audioMimeType(m)}"></audio></div>`;
      else if(m.type==="youtube") html+=`<div style="margin-top:8px;width:min(480px,70vw);border-radius:8px;overflow:hidden;aspect-ratio:16/9"><iframe src="https://www.youtube.com/embed/${_escHtml(m.ytId)}" style="width:100%;height:100%;border:0;display:block" allowfullscreen loading="lazy"></iframe></div>`;
      else if(m.type==="vimeo")   html+=`<div style="margin-top:8px;width:min(480px,70vw);border-radius:8px;overflow:hidden;aspect-ratio:16/9"><iframe src="https://player.vimeo.com/video/${_escHtml(m.vimeoId)}" style="width:100%;height:100%;border:0;display:block" allowfullscreen loading="lazy"></iframe></div>`;
      else if(m.type==="file")    html+=`<div style="margin-top:6px"><a href="${_escHtml(m.url)}" target="_blank" download="${_escHtml(m.name)}" style="display:inline-flex;align-items:center;gap:5px;font-size:.82rem;color:var(--text-muted);text-decoration:none;border:1px solid var(--border);border-radius:6px;padding:4px 10px"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:4px"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>${_escHtml(m.name)}</a></div>`;
    });
    return html;
  }

  // Render a poll in a comment — mirrors community.html _commentPollHtml exactly
  function _commentPollHtml(pollId, question, opts, voteCountMap, myOptId, totalVotes, authorEmail, parentId) {
    const auth=_auth();
    const hasVoted=!!myOptId||(!!authorEmail&&authorEmail===auth.email);
    const pid=_escHtml(parentId||"");
    let html=`<div class="poll-card"><div class="poll-card-question">${_escHtml(question)}</div>`;
    if(!hasVoted){
      html+=opts.map(o=>
        `<button class="poll-option-vote-btn" onclick="tcCastCommentPollVote('${_escHtml(pollId)}','${_escHtml(o.id)}','${pid}')">${_escHtml(o.label)}</button>`
      ).join("");
    } else {
      html+=opts.map(o=>{
        const count=voteCountMap[o.id]||0;
        const pct=totalVotes>0?Math.round(count/totalVotes*100):0;
        const isMine=o.id===myOptId;
        return`<div class="poll-bar-row" onclick="tcCastCommentPollVote('${_escHtml(pollId)}','${_escHtml(o.id)}','${pid}')">
          <div class="poll-bar-label">
            <span>${_escHtml(o.label)}${isMine?` <span style="color:#10b981;font-size:.7em">●</span>`:""}</span>
            <span>${pct}%</span>
          </div>
          <div class="poll-bar-track"><div class="poll-bar-fill${isMine?" mine":""}" style="width:${pct}%"></div></div>
        </div>`;
      }).join("");
      html+=`<div class="poll-footer"><span class="poll-total">${totalVotes} vote${totalVotes!==1?"s":""}</span></div>`;
    }
    return html+`</div>`;
  }

  // ── Image lightbox ───────────────────────────────────────────────────────────
  function _imgGroupStore(urls) {
    const key="tcg"+Date.now()+Math.random().toString(36).slice(2,6);
    _imgGroups[key]=urls; return key;
  }
  function _imgShow() {
    const urls=_imgGroups[_imgCurrentGroup]||[];
    const idx=_imgCurrentIdx;
    const img=document.getElementById("tc-img-modal-img");
    const prev=document.getElementById("tc-img-modal-prev");
    const next=document.getElementById("tc-img-modal-next");
    const ctr=document.getElementById("tc-img-modal-counter");
    if(!img)return;
    img.src=urls[idx]||"";
    if(prev)prev.disabled=idx===0;
    if(next)next.disabled=idx>=urls.length-1;
    if(ctr){ctr.style.display=urls.length>1?"":"none";ctr.textContent=`${idx+1} / ${urls.length}`;}
  }

  // ── Reactions ────────────────────────────────────────────────────────────────
  function _reactState(parentId) {
    if (!_rxState[parentId]) _rxState[parentId]={};
    return _rxState[parentId];
  }

  function _reactBtnHtml(parentId, safeKey) {
    const rxData=_reactState(parentId);
    let total=0, myEmoji=null;
    for(const[e,d]of Object.entries(rxData)){total+=d.count;if(d.mine)myEmoji=e;}
    const fill=myEmoji?'fill="currentColor" stroke="currentColor" stroke-width="1.5"':'fill="none" stroke="currentColor" stroke-width="2"';
    const svg=`<svg viewBox="0 0 24 24" width="15" height="15" ${fill} stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
    const emojiLabel=(myEmoji&&myEmoji!=="❤️")?` ${myEmoji}`:"";
    const countLabel=total>0?` ${total}`:"";
    const btns=_emojis().map(e=>{
      const d=rxData[e]||{count:0,mine:false};
      return`<button class="${d.mine?"picked":""}" onclick="Comments.pickReaction(event,'${safeKey}','${parentId}','${e}')">${e}${d.count>0?`<span class="picker-count">${d.count}</span>`:""}</button>`;
    }).join("");
    return `<div style="position:relative;display:inline-flex">
      <button class="tc-react-btn${myEmoji?" liked":""}" id="tc-like-btn-${safeKey}" onclick="Comments.togglePicker('${safeKey}',event)">${svg}${emojiLabel}${countLabel}</button>
      <div class="tc-react-picker" id="tc-picker-${safeKey}" style="display:none">${btns}</div>
    </div>`;
  }

  function _refreshReactBtn(parentId, safeKey) {
    const rxData=_reactState(parentId);
    let total=0, myEmoji=null;
    for(const[e,d]of Object.entries(rxData)){total+=d.count;if(d.mine)myEmoji=e;}
    const fill=myEmoji?'fill="currentColor" stroke="currentColor" stroke-width="1.5"':'fill="none" stroke="currentColor" stroke-width="2"';
    const svg=`<svg viewBox="0 0 24 24" width="15" height="15" ${fill} stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
    const emojiLabel=(myEmoji&&myEmoji!=="❤️")?` ${myEmoji}`:"";
    const countLabel=total>0?` ${total}`:"";
    const btn=document.getElementById(`tc-like-btn-${safeKey}`);
    if(btn){btn.classList.toggle("liked",!!myEmoji);btn.innerHTML=svg+emojiLabel+countLabel;}
    const picker=document.getElementById(`tc-picker-${safeKey}`);
    if(picker){
      const btns=picker.querySelectorAll("button");
      _emojis().forEach((e,i)=>{
        const d=rxData[e]||{count:0,mine:false};
        if(btns[i]){btns[i].className=d.mine?"picked":"";btns[i].innerHTML=`${e}${d.count>0?`<span class="picker-count">${d.count}</span>`:""}` ;}
      });
    }
  }

  // ── Comment HTML ─────────────────────────────────────────────────────────────
  function _commentHtml(c, isReply, avatarMap, parentId) {
    const auth=_auth();
    const dispName=_escHtml(c.name||c.email.split("@")[0]);
    const canDel=auth.isAdmin||c.email===auth.email;
    const replyPrefix=(isReply&&c.reply_to_name)?`<span class="tc-reply-to-name">@${_escHtml(c.reply_to_name)}</span> `:"";
    const media=_renderCommentMedia(c);
    const p=_pollByComment[c.id];
    const pollHtml=p?_commentPollHtml(p.pollId,p.question,p.opts,p.voteCountMap,p.myOptId,p.totalVotes,c.email,parentId):"";
    const profileLink=`/profile.html?u=${encodeURIComponent(c.email)}`;
    return `
      <div class="tc-comment-item${isReply?" is-reply":""}" id="tc-cmt-${c.id}">
        <a href="${profileLink}" style="display:contents;text-decoration:none">
          ${_avatarHtml(c.email,c.name,28,avatarMap[c.email])}
        </a>
        <div class="tc-comment-body">
          <div class="tc-comment-meta">
            <a href="${profileLink}" style="text-decoration:none"><span class="tc-comment-name" style="cursor:pointer">${dispName}</span></a>
            <span class="tc-comment-time">${_relativeTime(c.created_at)}</span>
            ${c.edited_at?`<span class="tc-comment-edited" style="font-size:.66rem;color:var(--text-muted);font-style:italic">(edited)</span>`:""}
            <span style="margin-left:auto;display:inline-flex;gap:8px;align-items:center">
              ${c.email===auth.email?`<button onclick="Comments.editComment('${c.id}','${parentId}')" style="background:none;border:none;cursor:pointer;font-size:.7rem;color:var(--text-muted);padding:0;font-family:inherit" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='var(--text-muted)'">Edit</button>`:""}
              ${canDel?`<button onclick="Comments.deleteComment('${c.id}','${parentId}')" style="background:none;border:none;cursor:pointer;font-size:.7rem;color:var(--text-muted);padding:0;font-family:inherit" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='var(--text-muted)'">Delete</button>`:""}
            </span>
          </div>
          ${c.content?`<div class="tc-comment-text">${replyPrefix}${_escHtml(c.content)}</div>`:(replyPrefix?`<div class="tc-comment-text">${replyPrefix}</div>`:"")}
          ${media?`<div class="tc-comment-media">${media}</div>`:""}
          ${pollHtml}
          <div class="tc-comment-action-row">
            ${_cmtReactBarHTML(c.id)}
            ${!isReply?`<button class="tc-comment-reply-btn" onclick="Comments.startReply('${parentId}','${c.id}','${dispName.replace(/'/g,"\\'")}','${c.email.replace(/'/g,"\\'")}')">Reply</button>`:""}
          </div>
        </div>
      </div>`;
  }

  // ── Per-comment reactions ───────────────────────────────────────────────────
  function _cmtSafeKey(commentId) {
    return `tccrx_${String(commentId).replace(/[^a-z0-9]/gi, "_")}`;
  }

  async function _loadCmtReactions(commentIds) {
    const eventType = _cfg?.commentReactionEventType;
    if (!eventType || !commentIds.length) return;
    const auth = _auth();
    const ids = commentIds.map(String);
    const { data } = await _db().from("activity_reactions")
      .select("item_id,email,emoji")
      .eq("event_type", eventType)
      .in("item_id", ids);
    ids.forEach(id => { delete _cmtRxState[id]; delete _cmtReactorsList[id]; });
    const reactorEmails = new Set();
    (data || []).forEach(r => {
      if (!_cmtRxState[r.item_id]) _cmtRxState[r.item_id] = {};
      if (!_cmtRxState[r.item_id][r.emoji]) _cmtRxState[r.item_id][r.emoji] = { count: 0, mine: false };
      _cmtRxState[r.item_id][r.emoji].count++;
      if (r.email === auth.email) _cmtRxState[r.item_id][r.emoji].mine = true;
      (_cmtReactorsList[r.item_id] = _cmtReactorsList[r.item_id] || []).push({ email: r.email, emoji: r.emoji });
      reactorEmails.add(r.email);
    });
    const need = [...reactorEmails].filter(e => !_cmtReactorInfo[e]);
    if (need.length) {
      const { data: av } = await _db().from("allowed_emails").select("email,name,avatar_url").in("email", need);
      (av || []).forEach(r => { _cmtReactorInfo[r.email] = { name: r.name || r.email.split("@")[0], url: r.avatar_url || null }; });
    }
  }

  function _cmtReactBarHTML(commentId) {
    if (!_cfg?.commentReactionEventType) return "";
    const safeKey = _cmtSafeKey(commentId);
    const data    = _cmtRxState[String(commentId)] || {};
    let myEmoji = null, total = 0;
    for (const [e, d] of Object.entries(data)) { total += d.count; if (d.mine) myEmoji = e; }
    const heartFill = myEmoji
      ? `fill="currentColor" stroke="currentColor" stroke-width="1.5"`
      : `fill="none" stroke="currentColor" stroke-width="2"`;
    const heartSvg = `<svg viewBox="0 0 24 24" width="13" height="13" ${heartFill} stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
    const emojiLabel = myEmoji && myEmoji !== "❤️" ? ` ${myEmoji}` : "";
    const countLabel = total > 0 ? ` ${total}` : "";
    const reactors = _cmtReactorsList[String(commentId)] || [];
    const chips = reactors.length ? `<span onclick="Comments.showCmtReactors(event,'${String(commentId)}')" style="display:inline-flex;align-items:center;cursor:pointer;padding-left:6px" title="See who reacted">${
      reactors.slice(0, 3).map(r => {
        const info = _cmtReactorInfo[r.email];
        const nm   = info?.name || r.email.split("@")[0];
        const col  = _avatarColour(r.email);
        return info?.url
          ? `<img src="${_escHtml(info.url)}" style="width:18px;height:18px;border-radius:50%;object-fit:cover;margin-left:-4px;border:1.5px solid var(--surface);display:block">`
          : `<span style="width:18px;height:18px;border-radius:50%;background:${col.bg};color:${col.fg};font-size:.6rem;font-weight:700;display:inline-flex;align-items:center;justify-content:center;margin-left:-4px;border:1.5px solid var(--surface)">${_escHtml(nm[0].toUpperCase())}</span>`;
      }).join("")
    }</span>` : "";
    return `
      <div style="display:inline-flex;align-items:center">
        <div style="position:relative;display:inline-flex">
          <button class="tc-cmt-react-btn${myEmoji ? " liked" : ""}" id="like-btn-${safeKey}"
            onclick="Comments.toggleCmtPicker('${safeKey}','${String(commentId)}')">
            ${heartSvg}${emojiLabel}${countLabel}
          </button>
          <div class="tc-react-picker" id="picker-${safeKey}" style="display:none">
            ${_CMT_RX_EMOJIS.map(e => {
              const d = data[e] || { count: 0, mine: false };
              return `<button class="${d.mine ? "picked" : ""}"
                onclick="Comments.pickCmtReact(event,'${safeKey}','${String(commentId)}','${e}')"
              >${e}${d.count > 0 ? `<span class="picker-count">${d.count}</span>` : ""}</button>`;
            }).join("")}
          </div>
        </div>
        ${chips}
      </div>`;
  }

  // "Who reacted" popover for a comment — self-contained inline styles so it
  // works on every page that uses this component (content feed, updates, focus).
  function _dismissCmtReactorsPopover() {
    if (_cmtReactorsPopover) { _cmtReactorsPopover.remove(); _cmtReactorsPopover = null; }
  }
  document.addEventListener("click", _dismissCmtReactorsPopover);

  function _cmtRefreshBtn(safeKey, commentId) {
    const data = _cmtRxState[commentId] || {};
    let myEmoji = null, total = 0;
    for (const [e, d] of Object.entries(data)) { total += d.count; if (d.mine) myEmoji = e; }
    const heartFill = myEmoji
      ? `fill="currentColor" stroke="currentColor" stroke-width="1.5"`
      : `fill="none" stroke="currentColor" stroke-width="2"`;
    const heartSvg = `<svg viewBox="0 0 24 24" width="13" height="13" ${heartFill} stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
    const emojiLabel = myEmoji && myEmoji !== "❤️" ? ` ${myEmoji}` : "";
    const countLabel = total > 0 ? ` ${total}` : "";
    const btn = document.getElementById(`like-btn-${safeKey}`);
    if (btn) { btn.classList.toggle("liked", !!myEmoji); btn.innerHTML = heartSvg + emojiLabel + countLabel; }
  }

  // ── Public API ───────────────────────────────────────────────────────────────
  const Comments = {

    // Pre-load reaction state for a list of parent IDs (call after auth)
    async loadReactions(parentIds) {
      if (!_rTable()||!parentIds?.length) return;
      const { data } = await _db().from(_rTable()).select(`${_rParent()},email,emoji`).in(_rParent(), parentIds);
      const auth=_auth();
      (data||[]).forEach(l=>{
        const pid=l[_rParent()];
        if(!_rxState[pid]) _rxState[pid]={};
        const em=l.emoji||"❤️";
        if(!_rxState[pid][em]) _rxState[pid][em]={count:0,mine:false};
        _rxState[pid][em].count++;
        if(l.email===auth.email) _rxState[pid][em].mine=true;
      });
    },

    // HTML for the emoji reaction button + picker (call after loadReactions)
    reactBtnHtml(parentId, safeKey) {
      return _reactBtnHtml(parentId, safeKey);
    },

    // Toggle picker open/closed
    togglePicker(safeKey, event) {
      if(event) event.stopPropagation();
      const picker=document.getElementById(`tc-picker-${safeKey}`);
      if(!picker)return;
      if(_openPicker&&_openPicker!==safeKey){
        const prev=document.getElementById(`tc-picker-${_openPicker}`);
        if(prev)prev.style.display="none";
      }
      const isOpen=picker.style.display!=="none";
      picker.style.display=isOpen?"none":"";
      _openPicker=isOpen?null:safeKey;
    },

    // Pick (or un-pick) an emoji reaction
    async pickReaction(event, safeKey, parentId, emoji) {
      event.stopPropagation();
      const picker=document.getElementById(`tc-picker-${safeKey}`);
      if(!_rxState[parentId]) _rxState[parentId]={};
      const wasPicked=event.currentTarget.classList.contains("picked");
      const existingEmoji=Object.keys(_rxState[parentId]).find(e=>_rxState[parentId][e]?.mine);
      if(picker){picker.style.display="none";} _openPicker=null;

      const auth=_auth();
      if(wasPicked){
        const d=_rxState[parentId][emoji];
        if(d){d.mine=false;d.count=Math.max(0,d.count-1);}
        _refreshReactBtn(parentId,safeKey);
        _cfg?.onReactionChange?.(parentId);
        await _db().from(_rTable()).delete().eq(_rParent(),parentId).eq("email",auth.email);
        return;
      }
      if(existingEmoji){
        const d=_rxState[parentId][existingEmoji];
        if(d){d.mine=false;d.count=Math.max(0,d.count-1);}
        await _db().from(_rTable()).delete().eq(_rParent(),parentId).eq("email",auth.email);
      }
      if(!_rxState[parentId][emoji]) _rxState[parentId][emoji]={count:0,mine:false};
      _rxState[parentId][emoji].mine=true;
      _rxState[parentId][emoji].count++;
      _refreshReactBtn(parentId,safeKey);
      _cfg?.onReactionChange?.(parentId);
      await _db().from(_rTable()).upsert({[_rParent()]:parentId,email:auth.email,emoji},{onConflict:`${_rParent()},email`});
      // Notify the owner that someone reacted (skip self).
      if (_cfg?.ownerEmail
          && auth.email
          && auth.email.toLowerCase() !== _cfg.ownerEmail.toLowerCase()) {
        const titleFn = _cfg.ownerReactionTitleFn
          || ((name, em) => `${name} reacted ${em} to your post`);
        await _db().from("notifications").insert({
          email:    _cfg.ownerEmail,
          type:     "reaction",
          title:    titleFn(auth.name || "Someone", emoji),
          body:     "",
          link_url: _notifyLink(parentId),
          metadata: { parent_id: parentId, emoji },
        }).catch(() => {});
      }
    },

    // Show likers popover for a parent ID
    async showLikers(parentId, event) {
      event.stopPropagation();
      if(_likersPopover){_likersPopover.remove();_likersPopover=null;}
      const {data:likes}=await _db().from(_rTable()).select("email,emoji").eq(_rParent(),parentId);
      if(!likes?.length)return;
      const emails=likes.map(l=>l.email);
      const {data:nameRows}=await _db().from("allowed_emails").select("email,name,avatar_url").in("email",emails);
      const infoMap={};(nameRows||[]).forEach(r=>{infoMap[r.email]=r;});
      const emojiMap={};(likes||[]).forEach(l=>{emojiMap[l.email]=l.emoji||"❤️";});
      const rows=emails.map(e=>{
        const info=infoMap[e]||{};
        const name=info.name||e.split("@")[0];
        const col=_avatarColour(e);
        const av=info.avatar_url?`<div class="tc-likers-popover-avatar"><img src="${_escHtml(info.avatar_url)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block"></div>`:`<div class="tc-likers-popover-avatar" style="background:${col.bg};color:${col.fg}">${_initials(name)}</div>`;
        return`<div class="tc-likers-popover-row">${av}<span class="tc-likers-popover-name">${_escHtml(name)}</span><span style="margin-left:auto;font-size:1rem">${emojiMap[e]||"❤️"}</span></div>`;
      }).join("");
      const pop=document.createElement("div");
      pop.className="tc-likers-popover";
      pop.innerHTML=`<div class="tc-likers-popover-title">Reacted</div>${rows}`;
      document.body.appendChild(pop);
      _likersPopover=pop;
      const {clientX:x,clientY:y}=event;
      const pw=220,ph=48+emails.length*38;
      pop.style.left=Math.min(x,window.innerWidth-pw-12)+"px";
      pop.style.top =Math.min(y+8,window.innerHeight-ph-12)+"px";
      setTimeout(()=>document.addEventListener("click",()=>{if(_likersPopover){_likersPopover.remove();_likersPopover=null;}},{once:true}),0);
    },

    // HTML for the comment input form (bottom of a comment section)
    formHtml(parentId) {
      const auth=_auth();
      const key=`${parentId}_main`;
      return `
        <div class="tc-comment-form">
          ${_avatarHtml(auth.email,auth.name,28,auth.avatarUrl)}
          <div class="tc-comment-form-body">
            <div class="tc-comment-form-top">
              <textarea id="tc-cmt-input-${parentId}" rows="1"
                placeholder="Write a comment…"
                oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px'"
                onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();Comments.submitComment('${parentId}')}"></textarea>
              <button class="tc-send-btn" id="send-btn-${key}" onclick="Comments.submitComment('${parentId}')">Send</button>
            </div>
            ${_toolbarHtml(key)}
          </div>
        </div>`;
    },

    // Load and render comments into #tc-comments-list-{parentId}
    async load(parentId) {
      const listEl=document.getElementById(`tc-comments-list-${parentId}`);
      const hdrEl =document.getElementById(`tc-comments-hdr-${parentId}`);
      if(!listEl)return;
      const {data:comments}=await _db().from(_cTable()).select("*").eq(_cParent(),parentId).order("created_at",{ascending:true});

      // Fetch polls attached to comments — mirrors community.html loadComments() pattern
      _pollByComment={};
      const commentIds=(comments||[]).map(c=>c.id);
      if(commentIds.length){
        const auth=_auth();
        const {data:cPollRows}=await _db().from("tc_comment_polls").select("id,question,comment_id").in("comment_id",commentIds);
        if(cPollRows&&cPollRows.length){
          const pollIds=cPollRows.map(p=>p.id);
          const [{data:cOpts},{data:cAllVotes},{data:cMyVotes}]=await Promise.all([
            _db().from("tc_comment_poll_options").select("id,poll_id,label,position").in("poll_id",pollIds).order("position"),
            _db().from("tc_comment_poll_votes").select("poll_id,option_id").in("poll_id",pollIds),
            _db().from("tc_comment_poll_votes").select("poll_id,option_id").eq("email",auth.email).in("poll_id",pollIds),
          ]);
          cPollRows.forEach(p=>{
            const opts=(cOpts||[]).filter(o=>o.poll_id===p.id);
            const allV=(cAllVotes||[]).filter(v=>v.poll_id===p.id);
            const myV=(cMyVotes||[]).find(v=>v.poll_id===p.id);
            const voteCountMap={};
            allV.forEach(v=>{voteCountMap[v.option_id]=(voteCountMap[v.option_id]||0)+1;});
            _pollByComment[p.comment_id]={pollId:p.id,question:p.question,opts,voteCountMap,myOptId:myV?.option_id||null,totalVotes:allV.length};
          });
        }
      }

      const count=comments?.length||0;
      if(hdrEl)hdrEl.textContent=count===0?"Comments":`${count} Comment${count!==1?"s":""}`;
      if(!count){listEl.innerHTML=`<div class="tc-comments-empty">No comments yet — be the first!</div>`;return;}
      // Pre-load per-comment reactions so the heart buttons render with correct counts.
      await _loadCmtReactions(comments.map(c => c.id));
      // Track each comment's author + parentId for notification routing on reaction.
      (comments || []).forEach(c => {
        _cmtMetaMap[String(c.id)] = {
          email:    c.email,
          name:     c.name || c.email.split("@")[0],
          parentId: parentId,
        };
      });
      const emails=[...new Set(comments.map(c=>c.email))];
      const {data:avRows}=await _db().from("allowed_emails").select("email,avatar_url").in("email",emails);
      const avatarMap={};
      (avRows||[]).forEach(r=>{if(r.avatar_url)avatarMap[r.email]=r.avatar_url;});
      const topLevel=comments.filter(c=>!c.parent_comment_id);
      const replyMap={};
      comments.filter(c=>c.parent_comment_id).forEach(c=>{(replyMap[c.parent_comment_id]=replyMap[c.parent_comment_id]||[]).push(c);});
      const auth=_auth();
      listEl.innerHTML=topLevel.map(c=>{
        const replies=(replyMap[c.id]||[]).map(r=>_commentHtml(r,true,avatarMap,parentId)).join("");
        const key=c.id;
        const replyComposer=`
          <div id="tc-reply-composer-${c.id}" class="tc-reply-composer" style="display:none">
            <div class="tc-reply-composer-inner">
            ${_avatarHtml(auth.email,auth.name,28,auth.avatarUrl)}
            <div class="tc-reply-composer-body">
              <textarea placeholder="Write a reply…" rows="1"
                oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,100)+'px'"
                onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();Comments.submitReply('${parentId}','${c.id}',this.closest('.tc-reply-composer'))}"></textarea>
              ${_toolbarHtml(key)}
              <div class="tc-irc-actions">
                <button class="tc-irc-cancel" onclick="Comments.cancelReply('${c.id}')">Cancel</button>
                <button class="tc-irc-send" id="send-btn-${key}" onclick="Comments.submitReply('${parentId}','${c.id}',this.closest('.tc-reply-composer'))">Send</button>
              </div>
            </div>
            </div>
          </div>`;
        return _commentHtml(c,false,avatarMap,parentId)+`<div class="tc-comment-replies">${replies}${replyComposer}</div>`;
      }).join("");
    },

    // Submit the main comment form for a parent
    async submitComment(parentId) {
      const key=`${parentId}_main`;
      const ta=document.getElementById(`tc-cmt-input-${parentId}`);
      const content=ta?.value.trim()||"";
      const media=_inlineMedia[key]||[];
      const poll=_inlinePollOpen[key]?_readInlinePoll(key):null;
      if(!content&&!media.length&&!poll)return;
      const btn=document.getElementById(`send-btn-${key}`);
      if(btn)btn.disabled=true;
      if(ta)ta.disabled=true;
      let uploaded=[];
      try { uploaded=await _uploadMedia(key); }
      catch(e){ alert("Failed to upload media: "+e.message); if(btn)btn.disabled=false; if(ta)ta.disabled=false; return; }
      const auth=_auth();
      const {data:row,error}=await _db().from(_cTable()).insert({[_cParent()]:parentId,email:auth.email,name:auth.name,content,media:uploaded.length?uploaded:[]}).select().single();
      if(btn)btn.disabled=false;
      if(ta)ta.disabled=false;
      if(error){alert("Couldn't post: "+error.message);return;}
      // Insert poll into relational tables — mirrors community.html submitComment()
      if(poll&&row){
        const {data:pollRow}=await _db().from("tc_comment_polls").insert({comment_id:row.id,question:poll.question}).select().single();
        if(pollRow){
          await _db().from("tc_comment_poll_options").insert(poll.options.map((label,i)=>({poll_id:pollRow.id,label,position:i})));
        }
      }
      // Notify the content owner (e.g. Matthew for weekly focus / updates /
      // content-feed posts) about new top-level comments. Skipped when the
      // commenter IS the owner. Config: ownerEmail + ownerNotifyTitleFn(name).
      if (_cfg?.ownerEmail
          && auth.email
          && auth.email.toLowerCase() !== _cfg.ownerEmail.toLowerCase()) {
        const title = (typeof _cfg.ownerNotifyTitleFn === "function")
          ? _cfg.ownerNotifyTitleFn(auth.name || "Someone")
          : `${auth.name || "Someone"} left a new comment`;
        await _db().from("notifications").insert({
          email:    _cfg.ownerEmail,
          type:     "new_comment",
          title,
          body:     (content || "Sent an attachment").slice(0, 120),
          link_url: _notifyLink(parentId),
          metadata: {},
        }).catch(() => {});
      }
      if(ta){ta.value="";ta.style.height="";}
      _clearState(key);
      await Comments.load(parentId);
      _cfg?.onCommentChange?.(parentId);
    },

    // Submit a reply
    async submitReply(parentId, commentId, composerEl) {
      const ta=composerEl?.querySelector("textarea");
      const content=ta?.value.trim()||"";
      const media=_inlineMedia[commentId]||[];
      const poll=_inlinePollOpen[commentId]?_readInlinePoll(commentId):null;
      if(!content&&!media.length&&!poll)return;
      const replyToName =composerEl?.dataset.replyToName||null;
      const replyToEmail=composerEl?.dataset.replyToEmail||null;
      if(ta)ta.disabled=true;
      let uploaded=[];
      try { uploaded=await _uploadMedia(commentId); }
      catch(e){ alert("Failed to upload media: "+e.message); if(ta)ta.disabled=false; return; }
      const auth=_auth();
      const {data:row,error}=await _db().from(_cTable()).insert({[_cParent()]:parentId,email:auth.email,name:auth.name,content,parent_comment_id:commentId,reply_to_name:replyToName,media:uploaded.length?uploaded:[]}).select().single();
      if(ta)ta.disabled=false;
      if(error){alert("Couldn't post reply: "+error.message);return;}
      // Insert poll into relational tables — mirrors community.html submitReply()
      if(poll&&row){
        const {data:pollRow}=await _db().from("tc_comment_polls").insert({comment_id:row.id,question:poll.question}).select().single();
        if(pollRow){
          await _db().from("tc_comment_poll_options").insert(poll.options.map((label,i)=>({poll_id:pollRow.id,label,position:i})));
        }
      }
      if(replyToEmail&&replyToEmail!==auth.email){
        await _db().from("notifications").insert({email:replyToEmail,type:"comment_reply",title:`${auth.name||"Someone"} replied to your comment`,body:(content||"Sent an attachment").slice(0,120),link_url:_notifyLink(parentId),metadata:{}}).catch(()=>{});
      }
      Comments.cancelReply(commentId);
      await Comments.load(parentId);
      _cfg?.onCommentChange?.(parentId);
    },

    // Delete a comment
    async deleteComment(commentId, parentId) {
      if(!confirm("Delete this comment?"))return;
      await _db().from(_cTable()).delete().eq("id",commentId);
      await Comments.load(parentId);
      _cfg?.onCommentChange?.(parentId);
    },

    // Inline-edit a comment's text (author-only; enforced by RLS too).
    async editComment(commentId, parentId) {
      const textEl = document.querySelector(`#tc-cmt-${commentId} .tc-comment-text`);
      if (!textEl) return;
      const { data } = await _db().from(_cTable()).select("content").eq("id", commentId).single();
      window.shInlineEdit(textEl, data?.content || "", async (val) => {
        const { data: upd, error } = await _db().from(_cTable())
          .update({ content: val, edited_at: new Date().toISOString() }).eq("id", commentId).select("id");
        if (error) throw error;
        if (!upd || !upd.length) throw new Error("Edit not permitted.");
        await Comments.load(parentId);
      });
    },

    // Show who reacted to a comment/reply.
    showCmtReactors(event, commentId) {
      event.stopPropagation();
      _dismissCmtReactorsPopover();
      const likers = _cmtReactorsList[String(commentId)] || [];
      if (!likers.length) return;
      const rows = likers.map(({ email, emoji }) => {
        const info = _cmtReactorInfo[email];
        const name = info?.name || email.split("@")[0];
        const col  = _avatarColour(email);
        const av   = info?.url
          ? `<img src="${_escHtml(info.url)}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;display:block">`
          : `<span style="width:28px;height:28px;border-radius:50%;background:${col.bg};color:${col.fg};font-size:.8rem;font-weight:700;display:inline-flex;align-items:center;justify-content:center">${_escHtml(name[0].toUpperCase())}</span>`;
        return `<div style="display:flex;align-items:center;gap:10px;padding:5px 0"><div style="width:28px;height:28px;flex-shrink:0">${av}</div><span style="font-size:.85rem;color:var(--text)">${_escHtml(name)}</span><span style="margin-left:auto;font-size:1rem">${emoji}</span></div>`;
      }).join("");
      const pop = document.createElement("div");
      pop.style.cssText = "position:fixed;z-index:9999;background:var(--surface);border:1px solid var(--border);border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.18);padding:10px 14px;min-width:200px;max-width:260px";
      pop.innerHTML = `<div style="font-size:.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px">Reacted</div>${rows}`;
      document.body.appendChild(pop);
      _cmtReactorsPopover = pop;
      const x = event.clientX, y = event.clientY;
      const pw = 230, ph = 44 + likers.length * 40;
      pop.style.left = Math.min(x, window.innerWidth  - pw - 12) + "px";
      pop.style.top  = Math.min(y + 8, window.innerHeight - ph - 12) + "px";
    },

    // ── Per-comment reaction picker (open/close) ──────────────────────────────
    toggleCmtPicker(safeKey, commentId) {
      const picker = document.getElementById(`picker-${safeKey}`);
      if (!picker) return;
      if (_cmtOpenPicker && _cmtOpenPicker !== safeKey) {
        const prev = document.getElementById(`picker-${_cmtOpenPicker}`);
        if (prev) prev.style.display = "none";
      }
      const opening = picker.style.display === "none";
      picker.style.display = opening ? "flex" : "none";
      _cmtOpenPicker = opening ? safeKey : null;
    },

    // ── Per-comment reaction pick / unpick ────────────────────────────────────
    async pickCmtReact(event, safeKey, commentId, emoji) {
      event.stopPropagation();
      const eventType = _cfg?.commentReactionEventType;
      if (!eventType) return;
      const picker = document.getElementById(`picker-${safeKey}`);
      if (picker) picker.style.display = "none";
      _cmtOpenPicker = null;

      const auth   = _auth();
      const idStr  = String(commentId);
      if (!_cmtRxState[idStr]) _cmtRxState[idStr] = {};
      const data   = _cmtRxState[idStr];
      const pickerBtn   = event.currentTarget;
      const wasPicked   = pickerBtn.classList.contains("picked");
      const existingEm  = Object.keys(data).find(e => data[e]?.mine);

      if (wasPicked) {
        pickerBtn.classList.remove("picked");
        if (data[emoji]) { data[emoji].mine = false; data[emoji].count = Math.max(0, data[emoji].count - 1); }
        _cmtRefreshBtn(safeKey, idStr);
        await _db().from("activity_reactions").delete()
          .eq("email", auth.email).eq("event_type", eventType).eq("item_id", idStr).eq("emoji", emoji);
        return;
      }
      if (existingEm) {
        if (data[existingEm]) { data[existingEm].mine = false; data[existingEm].count = Math.max(0, data[existingEm].count - 1); }
        await _db().from("activity_reactions").delete()
          .eq("email", auth.email).eq("event_type", eventType).eq("item_id", idStr).eq("emoji", existingEm);
      }
      pickerBtn.classList.add("picked");
      if (!data[emoji]) data[emoji] = { count: 0, mine: false };
      data[emoji].mine = true;
      data[emoji].count++;
      _cmtRefreshBtn(safeKey, idStr);
      await _db().from("activity_reactions")
        .insert({ email: auth.email, event_type: eventType, item_id: idStr, emoji });

      // Notify the comment author (skip self). Resolve the author straight from
      // the DB so a missing client-side meta entry (e.g. reacting to a reply
      // that wasn't in the rendered thread) can't silently drop the notification.
      const meta = _cmtMetaMap[idStr];
      let authorEmail = meta?.email;
      let isReply = false;
      let parentId = meta?.parentId || null;
      {
        const { data: crow } = await _db().from(_cTable())
          .select(`email,parent_comment_id,${_cParent()}`).eq("id", idStr).maybeSingle();
        if (crow) {
          if (!authorEmail) authorEmail = crow.email;
          isReply = !!crow.parent_comment_id;
          if (!parentId) parentId = crow[_cParent()];
        }
      }
      if (authorEmail && authorEmail.toLowerCase() !== auth.email.toLowerCase()) {
        const fallbackLink = (() => {
          switch (eventType) {
            case "focus_comment":  return "/focus.html";
            case "update_comment": return "/updates.html";
            case "content_comment":return "/content-feed.html";
            default: return "/";
          }
        })();
        const linkUrl = (typeof _cfg.replyNotificationLinkFn === "function" && parentId)
          ? _cfg.replyNotificationLinkFn(parentId)
          : fallbackLink;
        await _db().from("notifications").insert({
          email:    authorEmail,
          type:     "reaction",
          title:    `${auth.name || "Someone"} reacted ${emoji} to your ${isReply ? "reply" : "comment"}`,
          body:     "",
          link_url: linkUrl,
          metadata: { event_type: eventType, item_id: idStr, emoji },
        });
      }
    },

    // Show reply composer for a comment
    startReply(parentId, commentId, authorName, authorEmail) {
      document.querySelectorAll("[id^='tc-reply-composer-']").forEach(el=>{ if(el.style.display!=="none")el.style.display="none"; });
      const composer=document.getElementById(`tc-reply-composer-${commentId}`);
      if(!composer)return;
      composer.style.display="flex";
      composer.dataset.replyToName =authorName;
      composer.dataset.replyToEmail=authorEmail;
      const ta=composer.querySelector("textarea");
      if(ta){ta.value="";ta.focus();}
    },

    // Hide reply composer
    cancelReply(commentId) {
      const composer=document.getElementById(`tc-reply-composer-${commentId}`);
      if(composer){composer.style.display="none";const ta=composer.querySelector("textarea");if(ta)ta.value="";}
      _clearState(commentId);
    },

    // Upload inline media and return serialisable array (for custom submit handlers)
    uploadMedia: async (key) => _uploadMedia(key),

    // Read poll data (for custom submit handlers)
    readPoll: (key) => _readInlinePoll(key),

    // Clear inline state (for custom submit handlers)
    clearState: (key) => _clearState(key),

    // Read raw inline media array (for custom submit handlers — e.g. content-feed.html Post form)
    readMedia: (key) => (_inlineMedia[key] || []).slice(),

    // Expose reaction state for external reads (e.g. to build avatars / counts)
    getReactionState: (parentId) => ({..._reactState(parentId)}),
    setReactionState: (parentId, data) => { _rxState[parentId]=data; },
  };

  // ── Internal upload helpers ──────────────────────────────────────────────────
  async function _uploadMedia(key) {
    const media=_inlineMedia[key]||[];
    if(media.some(m=>m._uploading)) throw new Error("A video is still uploading — please wait.");
    const result=[];
    for(const m of media){
      if(m.type==="mux")          result.push({type:"mux",playbackId:m.playbackId,assetId:m.assetId,name:m.name});
      else if(m.type==="youtube") result.push({type:"youtube",ytId:m.ytId,url:m.url,name:m.name});
      else if(m.type==="vimeo")   result.push({type:"vimeo",vimeoId:m.vimeoId,url:m.url,name:m.name});
      else if(m.blob)             result.push({type:m.type,url:await _uploadToStorage(m.blob,m.name),name:m.name,...(m.duration?{duration:m.duration}:{}),...(m.mimeType?{mimeType:m.mimeType}:{})});
      else                        result.push({type:m.type,url:m.url,name:m.name});
    }
    return result;
  }

  function _clearState(key) {
    _inlineMedia[key]=[];
    _inlinePollOpen[key]=false;
    if(_inlineVoiceRec[key]&&_inlineVoiceRec[key].state!=="inactive")_inlineVoiceRec[key].stop();
    _inlineVoiceRec[key]=null;
    if(_inlineCamKey===key&&_inlineCamRec&&_inlineCamRec.state!=="inactive")_inlineCamRec.stop();
    if(_inlineCamKey===key){_inlineCamRec=null;_inlineCamKey=null;}
    clearInterval(_inlineRecTimer[key]);_inlineRecTimer[key]=null;_inlineRecStart[key]=null;
    _renderPreview(key);
    document.getElementById(`inline-recording-${key}`)?.style.setProperty("display","none");
    document.getElementById(`inline-poll-${key}`)?.style.setProperty("display","none");
    document.getElementById(`inline-vid-panel-${key}`)?.style.setProperty("display","none");
    document.getElementById(`inline-cam-panel-${key}`)?.style.setProperty("display","none");
    document.getElementById(`inline-poll-btn-${key}`)?.classList.remove("recording");
    document.getElementById(`inline-vid-btn-${key}`)?.classList.remove("recording");
    document.getElementById(`inline-voice-btn-${key}`)?.classList.remove("recording");
    document.getElementById(`inline-camrec-btn-${key}`)?.classList.remove("recording");
    if(_inlineCamPreviewKey===key)inlineCancelCamPreview(key);
    const pq=document.getElementById(`inline-poll-q-${key}`);if(pq)pq.value="";
    const po=document.getElementById(`inline-poll-opts-${key}`);
    if(po)po.innerHTML=`<div class="poll-option-row"><input class="poll-option-input" placeholder="Option 1"/><button class="poll-option-remove" onclick="removeInlinePollOption(this)">×</button></div><div class="poll-option-row"><input class="poll-option-input" placeholder="Option 2"/><button class="poll-option-remove" onclick="removeInlinePollOption(this)">×</button></div>`;
  }

  function _readInlinePoll(key) {
    const q=document.getElementById(`inline-poll-q-${key}`)?.value.trim();
    const opts=Array.from(document.querySelectorAll(`#inline-poll-opts-${key} .poll-option-input`)).map(i=>i.value.trim()).filter(Boolean);
    if(!q||opts.length<2)return null;
    return{question:q,options:opts};
  }

  // ── Global handlers (called from onclick in HTML) ────────────────────────────

  // Init
  window.initCommentsSystem = function(config) {
    _cfg = config;
    _injectCSS();
    _injectModal();
    // Close picker on any document click
    document.addEventListener("click", () => {
      if (_openPicker) {
        const prev = document.getElementById(`tc-picker-${_openPicker}`);
        if (prev) prev.style.display = "none";
        _openPicker = null;
      }
    });
    // Close per-comment reaction picker on outside click
    document.addEventListener("click", (e) => {
      if (!_cmtOpenPicker) return;
      const picker  = document.getElementById(`picker-${_cmtOpenPicker}`);
      const likeBtn = document.getElementById(`like-btn-${_cmtOpenPicker}`);
      if (picker && !picker.contains(e.target) && !likeBtn?.contains(e.target)) {
        picker.style.display = "none";
        _cmtOpenPicker = null;
      }
    });
  };

  // Comments public object
  window.Comments = Comments;

  // Image lightbox
  window._tcImgOpen = function(groupKey, index) {
    _imgCurrentGroup=groupKey; _imgCurrentIdx=index||0;
    const modal=document.getElementById("tc-img-modal");
    if(modal){modal.style.display="flex";requestAnimationFrame(()=>modal.classList.add("open"));}
    _imgShow();
    document.addEventListener("keydown",_tcImgKey);
  };
  window._tcImgClose = function() {
    const modal=document.getElementById("tc-img-modal");
    if(modal)modal.classList.remove("open");
    document.removeEventListener("keydown",_tcImgKey);
    setTimeout(()=>{const img=document.getElementById("tc-img-modal-img");if(img)img.src="";if(modal)modal.style.display="none";},200);
    _imgCurrentGroup=null;
  };
  window._tcImgNav = function(dir) {
    const urls=_imgGroups[_imgCurrentGroup]||[];
    const next=_imgCurrentIdx+dir;
    if(next<0||next>=urls.length)return;
    _imgCurrentIdx=next;_imgShow();
  };
  function _tcImgKey(e){if(e.key==="Escape")_tcImgClose();if(e.key==="ArrowRight")_tcImgNav(1);if(e.key==="ArrowLeft")_tcImgNav(-1);}

  // Media handlers
  window.tcHandleImage = async function(input, key) {
    _key(key);
    const files=Array.from(input.files||[]);input.value="";
    for(const file of files){
      if(!file.type.startsWith("image/")){alert(`"${file.name}" is not an image.`);continue;}
      const c=await _compressImage(file);
      _inlineMedia[key].push({type:"image",url:URL.createObjectURL(c),name:c.name,blob:c});
      _renderPreview(key);
    }
  };
  window.tcHandleFile = function(input, key) {
    _key(key);const file=input.files[0];if(!file)return;
    _inlineMedia[key].push({type:"file",name:file.name,blob:file});input.value="";_renderPreview(key);
  };
  window.tcHandleVideo = function(input, key) {
    const file=input.files[0];input.value="";if(!file)return;
    inlineToggleVideoPanel(key);
    if(!_inlineMedia[key])_inlineMedia[key]=[];
    const idx=_inlineMedia[key].length;
    _inlineMedia[key].push({type:"mux",name:file.name,_uploading:true,_progress:"Uploading…"});
    _renderPreview(key);
    _uploadVideoToMux(file,item=>{
      if(item._error){_inlineMedia[key][idx]={type:"mux",name:file.name,_uploading:false,_error:item._error};alert("Video upload failed: "+item._error);}
      else if(item._progress){_inlineMedia[key][idx]._progress=item._progress;}
      else{_inlineMedia[key][idx]=item;}
      _renderPreview(key);
    });
  };
  window.removeInlineMedia = function(key, idx) {
    if(_inlineMedia[key]){const m=_inlineMedia[key][idx];if(m?.type==="mux"&&m.assetId)_deleteMuxAsset(m.assetId);_inlineMedia[key].splice(idx,1);}
    _renderPreview(key);
  };

  // Video panel
  window.inlineToggleVideoPanel = function(key) {
    const panel=document.getElementById(`inline-vid-panel-${key}`);
    const btn=document.getElementById(`inline-vid-btn-${key}`);
    if(!panel)return;
    const open=panel.style.display==="none";
    if(open)_closeExcept(key,"video");
    panel.style.display=open?"":"none";
    btn?.classList.toggle("recording",open);
    if(open)inlineSwitchVideoTab("upload",key);
  };
  window.inlineSwitchVideoTab = function(tab, key) {
    const up=document.getElementById(`inline-vt-up-${key}`),em=document.getElementById(`inline-vt-em-${key}`);
    const ubtn=document.getElementById(`inline-vt-up-btn-${key}`),ebtn=document.getElementById(`inline-vt-em-btn-${key}`);
    const act="background:rgba(0,0,0,.07);border-radius:4px;font-weight:600";
    if(up)up.style.display=tab==="upload"?"":"none";
    if(em)em.style.display=tab==="embed"?"":"none";
    if(ubtn)ubtn.style.cssText=ubtn.style.cssText.replace(/font-weight:\s*600/g,"")+(tab==="upload"?act:"");
    if(ebtn)ebtn.style.cssText=ebtn.style.cssText.replace(/font-weight:\s*600/g,"")+(tab==="embed"?act:"");
  };
  window.inlineAddVideoUrl = function(key) {
    const input=document.getElementById(`inline-vurl-${key}`);const val=input?.value.trim();if(!val)return;
    if(!_inlineMedia[key])_inlineMedia[key]=[];
    const ytId=_parseYouTubeId(val),viId=_parseVimeoId(val);
    if(ytId)       _inlineMedia[key].push({type:"youtube",ytId,url:val,name:"YouTube video"});
    else if(viId)  _inlineMedia[key].push({type:"vimeo",vimeoId:viId,url:val,name:"Vimeo video"});
    else           _inlineMedia[key].push({type:"video-url",url:val,name:"Video"});
    if(input)input.value="";
    inlineToggleVideoPanel(key);_renderPreview(key);
  };

  // Voice recording
  window.toggleInlineVoice = async function(key) {
    if(_inlineVoiceRec[key]){if(_inlineVoiceRec[key].state!=="inactive")_inlineVoiceRec[key].stop();return;}
    _closeExcept(key,"voice");
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const chunks=[];const mr=new MediaRecorder(stream);_inlineVoiceRec[key]=mr;
      mr.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};
      mr.onstop=()=>{
        stream.getTracks().forEach(t=>t.stop());clearInterval(_inlineRecTimer[key]);_inlineRecTimer[key]=null;_inlineVoiceRec[key]=null;
        document.getElementById(`inline-recording-${key}`)?.style.setProperty("display","none");
        document.getElementById(`inline-voice-btn-${key}`)?.classList.remove("recording");
        const mime=mr.mimeType||"audio/webm";const blob=new Blob(chunks,{type:mime});
        const dur=_inlineRecStart[key]?Math.round((Date.now()-_inlineRecStart[key])/1000):0;
        const ext=mime.includes("mp4")||mime.includes("m4a")||mime.includes("aac")?"m4a":mime.includes("ogg")?"ogg":"webm";
        _key(key);_inlineMedia[key].push({type:"audio",url:URL.createObjectURL(blob),name:`voice-${Date.now()}.${ext}`,blob,duration:dur,mimeType:mime});_renderPreview(key);
      };
      mr.start();_inlineRecStart[key]=Date.now();
      document.getElementById(`inline-voice-btn-${key}`)?.classList.add("recording");
      const recInd=document.getElementById(`inline-recording-${key}`);if(recInd)recInd.style.display="";
      const timeEl=document.getElementById(`inline-rec-time-${key}`);
      _inlineRecTimer[key]=setInterval(()=>{const s=Math.round((Date.now()-_inlineRecStart[key])/1000);if(timeEl)timeEl.textContent=`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;},1000);
    }catch(e){alert("Microphone access denied: "+e.message);}
  };
  window.stopInlineVoice = function(key) {
    if(_inlineVoiceRec[key]&&_inlineVoiceRec[key].state!=="inactive")_inlineVoiceRec[key].stop();
  };

  // Camera recording
  window.inlineToggleCamRec = async function(key) {
    if(_inlineCamPreviewKey===key){inlineCancelCamPreview(key);return;}
    if(_inlineCamKey===key&&_inlineCamRec&&_inlineCamRec.state!=="inactive"){inlineStopCamRecording(key);return;}
    if(_inlineCamRec&&_inlineCamRec.state!=="inactive"){alert("Stop the current recording first.");return;}
    if(_inlineCamPreviewStream)inlineCancelCamPreview(_inlineCamPreviewKey);
    _closeExcept(key,"cam");
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:{aspectRatio:16/9}});
      _inlineCamPreviewStream=stream;_inlineCamPreviewKey=key;
      const preview=document.getElementById(`inline-cam-preview-${key}`);const panel=document.getElementById(`inline-cam-panel-${key}`);const btn=document.getElementById(`inline-camrec-btn-${key}`);
      if(preview)preview.srcObject=stream;if(panel)panel.style.display="";if(btn)btn.classList.add("recording");
      const devices=await navigator.mediaDevices.enumerateDevices();
      const cameras=devices.filter(d=>d.kind==="videoinput"),mics=devices.filter(d=>d.kind==="audioinput");
      const avl=stream.getVideoTracks()[0]?.label||"",aal=stream.getAudioTracks()[0]?.label||"";
      const cs=document.getElementById(`inline-cam-sel-${key}`),ms=document.getElementById(`inline-mic-sel-${key}`);
      if(cs)cs.innerHTML=cameras.map(d=>`<option value="${d.deviceId}" ${d.label===avl?"selected":""}>${d.label||"Camera "+(cameras.indexOf(d)+1)}</option>`).join("");
      if(ms)ms.innerHTML=mics.map(d=>`<option value="${d.deviceId}" ${d.label===aal?"selected":""}>${d.label||"Mic "+(mics.indexOf(d)+1)}</option>`).join("");
    }catch(e){alert("Could not access camera/mic: "+e.message);}
  };
  window.inlineSwitchCamDevice = async function(key) {
    if(!_inlineCamPreviewStream||_inlineCamPreviewKey!==key)return;
    const cs=document.getElementById(`inline-cam-sel-${key}`),ms=document.getElementById(`inline-mic-sel-${key}`);
    _inlineCamPreviewStream.getTracks().forEach(t=>t.stop());
    try{const stream=await navigator.mediaDevices.getUserMedia({video:cs?.value?{deviceId:{exact:cs.value}}:true,audio:ms?.value?{deviceId:{exact:ms.value}}:true});_inlineCamPreviewStream=stream;const preview=document.getElementById(`inline-cam-preview-${key}`);if(preview)preview.srcObject=stream;}catch(e){alert("Could not switch device: "+e.message);}
  };
  window.inlineStartCamRecording = function(key) {
    if(!_inlineCamPreviewStream)return;
    const devs=document.getElementById(`inline-cam-devices-${key}`),actions=document.getElementById(`inline-cam-actions-${key}`),recBar=document.getElementById(`inline-cam-recbar-${key}`);
    if(devs)devs.style.display="none";if(actions)actions.style.display="none";if(recBar)recBar.style.display="";
    const stream=_inlineCamPreviewStream;_inlineCamPreviewStream=null;_inlineCamStream=stream;_inlineCamKey=key;
    const chunks=[];const mr=new MediaRecorder(stream);_inlineCamRec=mr;
    mr.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};
    mr.onstop=()=>{
      stream.getTracks().forEach(t=>t.stop());const mime=mr.mimeType||"video/webm";const blob=new Blob(chunks,{type:mime});const name=`video-${Date.now()}.webm`;const file=new File([blob],name,{type:mime});
      const ck=_inlineCamKey;
      const panel=document.getElementById(`inline-cam-panel-${ck}`),preview=document.getElementById(`inline-cam-preview-${ck}`),devEl=document.getElementById(`inline-cam-devices-${ck}`),actEl=document.getElementById(`inline-cam-actions-${ck}`),barEl=document.getElementById(`inline-cam-recbar-${ck}`),btnEl=document.getElementById(`inline-camrec-btn-${ck}`);
      if(preview)preview.srcObject=null;if(panel)panel.style.display="none";if(devEl)devEl.style.display="";if(actEl)actEl.style.display="";if(barEl)barEl.style.display="none";if(btnEl)btnEl.classList.remove("recording");
      clearInterval(_inlineRecTimer[ck]);_inlineCamRec=null;_inlineCamStream=null;_inlineCamKey=null;_inlineCamPreviewKey=null;
      if(!_inlineMedia[ck])_inlineMedia[ck]=[];
      const idx=_inlineMedia[ck].length;_inlineMedia[ck].push({type:"mux",name,_uploading:true,_progress:"Uploading…"});_renderPreview(ck);
      _uploadVideoToMux(file,item=>{if(item._error){_inlineMedia[ck][idx]={type:"mux",name,_uploading:false};alert("Video upload failed: "+item._error);}else if(item._progress){_inlineMedia[ck][idx]._progress=item._progress;}else{_inlineMedia[ck][idx]=item;}_renderPreview(ck);});
    };
    mr.start();_inlineRecStart[key]=Date.now();
    _inlineRecTimer[key]=setInterval(()=>{const s=Math.round((Date.now()-_inlineRecStart[key])/1000);const el=document.getElementById(`inline-cam-timer-${key}`);if(el)el.textContent=`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;},1000);
  };
  window.inlineStopCamRecording = function(key) {
    if(_inlineCamRec&&_inlineCamKey===key&&_inlineCamRec.state!=="inactive")_inlineCamRec.stop();
  };
  window.inlineCancelCamPreview = function(key) {
    if(_inlineCamPreviewStream){_inlineCamPreviewStream.getTracks().forEach(t=>t.stop());_inlineCamPreviewStream=null;}_inlineCamPreviewKey=null;
    const preview=document.getElementById(`inline-cam-preview-${key}`),panel=document.getElementById(`inline-cam-panel-${key}`),btn=document.getElementById(`inline-camrec-btn-${key}`);
    if(preview)preview.srcObject=null;if(panel)panel.style.display="none";if(btn)btn.classList.remove("recording");
  };

  // Poll
  window.toggleInlinePoll = function(key) {
    const panel=document.getElementById(`inline-poll-${key}`);if(!panel)return;
    const open=panel.style.display==="none";
    if(open)_closeExcept(key,"poll");
    panel.style.display=open?"":"none";_inlinePollOpen[key]=open;
    document.getElementById(`inline-poll-btn-${key}`)?.classList.toggle("recording",open);
    if(open)document.getElementById(`inline-poll-q-${key}`)?.focus();
  };
  window.addInlinePollOption = function(key) {
    const list=document.getElementById(`inline-poll-opts-${key}`);if(!list)return;
    const count=list.querySelectorAll(".poll-option-input").length+1;
    const row=document.createElement("div");row.className="poll-option-row";
    row.innerHTML=`<input class="poll-option-input" placeholder="Option ${count}"/><button class="poll-option-remove" onclick="removeInlinePollOption(this)">×</button>`;
    list.appendChild(row);
  };
  window.removeInlinePollOption = function(btn) {
    const list=btn.closest(".poll-options-list");if(!list)return;
    if(list.querySelectorAll(".poll-option-row").length<=2)return;
    btn.closest(".poll-option-row").remove();
    list.querySelectorAll(".poll-option-input").forEach((inp,i)=>{if(!inp.value)inp.placeholder=`Option ${i+1}`;});
  };

  // ── Poll voting — mirrors community.html castCommentVote() exactly ───────────
  window.tcCastCommentPollVote = async function(pollId, optionId, parentId) {
    const auth=_auth();
    const {error}=await _db().from("tc_comment_poll_votes").upsert(
      {poll_id:pollId, option_id:optionId, email:auth.email},
      {onConflict:"poll_id,email"}
    );
    if(error){alert("Couldn't cast vote: "+error.message);return;}
    if(parentId) await Comments.load(parentId);
  };

  // ── Backward-compat aliases (for existing pages like focus.html) ─────────────
  // These mirror the old function names so existing onclick handlers keep working.
  window._inlineToolbarHtml = _toolbarHtml;
  window._uploadInlineMedia = _uploadMedia;
  window._clearInlineState  = _clearState;
  window._readInlinePoll    = _readInlinePoll;
  // Old image modal names still work (focus.html uses _commImgModalOpen etc.)
  window._commImgModalOpen  = window._tcImgOpen;
  window._commImgModalClose = window._tcImgClose;
  window._commImgModalNav   = window._tcImgNav;
  window._commImgGroupStore = _imgGroupStore;
  // Media renderer — used by content-feed.html to render post-card media
  window._tcRenderMedia = _renderCommentMedia;

})();
