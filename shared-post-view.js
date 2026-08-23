/* shared-post-view.js — the inside of a content-feed post, without a shell.
 *
 * Renders the media, title, body and poll for a feed post. It deliberately does
 * NOT own the surrounding chrome: content-feed.html wraps this in its card and
 * detail view, learn.html wraps it in a lightbox. One implementation of the
 * content, one per-page implementation of the frame.
 *
 * The host registers a post resolver on init, so this file never reaches into
 * a page's own state.
 *
 * Depends on: shared-header.js (renderUserContent), shared-comments.js
 * (_tcRenderMedia) — both optional, with plain-text fallbacks.
 */
window.PostView = (function () {
  "use strict";

  const SVG_YT   = `<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" style="display:inline;vertical-align:-2px;margin-right:5px"><polygon points="4,2 14,8 4,14"/></svg>`;
  const SVG_BLOG = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;margin-right:5px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
  const SVG_POST = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:-2px;margin-right:5px"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 9.5-9.5z"/></svg>`;

  const POLL_COLOURS = ["#8b5cf6","#f59e0b","#3b82f6","#ec4899","#10b981","#f97316","#06b6d4","#ef4444"];

  let getPost = () => null;
  let isAdmin = false;
  let adminMenu = () => "";
  let castVote = null;
  const embedded = new Set();          // post ids whose YouTube iframe is live

  const esc = s => String(s == null ? "" : s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");

  function init(opts) {
    opts = opts || {};
    if (opts.getPost)   getPost   = opts.getPost;
    if (opts.adminMenu) adminMenu = opts.adminMenu;
    if (opts.castVote)  castVote  = opts.castVote;
    isAdmin = !!opts.isAdmin;
  }

  /* ── media bodies ─────────────────────────────────────────────────────── */

  function ytBody(p) {
    const ytId  = esc(p.youtube_id || "");
    const title = esc(p.title || "");
    if (embedded.has(p.id)) {
      return `<div class="cf-yt-embed"><iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1" allowfullscreen loading="lazy"></iframe></div><div class="cf-card-title">${title}</div>`;
    }
    return `
    <div class="cf-yt-thumb" onclick="event.stopPropagation();PostView.embedYt('${p.id}', this)">
      <img src="https://img.youtube.com/vi/${ytId}/hqdefault.jpg" alt="${title}" loading="lazy" />
      <div class="cf-yt-play"><div class="cf-yt-play-btn"><div class="cf-yt-play-icon"></div></div></div>
    </div>
    <div class="cf-card-title">${title}</div>`;
  }

  function blogBody(p) {
    const url = esc(p.url || "#");
    const bulletData = (Array.isArray(p.media) ? p.media : []).find(m => m.type === "bullets");
    const bulletsHtml = bulletData && bulletData.items && bulletData.items.length
      ? `<p class="cf-blog-intro">In this week's article:</p>
         <ul class="cf-blog-bullets">${bulletData.items.map((item, i) =>
          `<li class="cf-blog-bullet">
            <span class="cf-blog-bullet-num">${i + 1}</span>
            <span class="cf-blog-bullet-text">${esc(item)}</span>
          </li>`).join("")}</ul>`
      : "";
    // An article lives on the marketing site, so the click-out is the only view
    // we can ever record for it.
    return `
      <div class="cf-card-title">${esc(p.title || "")}</div>
      ${bulletsHtml}
      <a href="${url}" target="_blank" rel="noopener" class="cf-blog-link"
         onclick="PostView.recordView('mmt','${esc(p.mmt_id || p.id)}',0,true)">Read post &#8599;</a>`;
  }

  function postBody(p) {
    const title = p.title ? `<div class="cf-card-title">${esc(p.title)}</div>` : "";
    const body  = p.body  ? `<div class="cf-post-body">${(window.renderUserContent ? window.renderUserContent(p.body) : esc(p.body))}</div>` : "";
    const media = (Array.isArray(p.media) && p.media.length && window._tcRenderMedia)
      ? `<div class="cf-post-media">${window._tcRenderMedia({ media: p.media })}</div>`
      : "";
    return `${title}${body}${media}`;
  }

  /* Lifted verbatim from content-feed.html so polls render identically; only the
     vote handler is indirected through the host. */
  function pollHtml(p) {
    const poll = p.poll;
    if (!poll || !poll.options || !poll.options.length) return "";
    const hasVoted = !!poll.myVote || isAdmin;      // the owner (author) always sees results
    const COLORS = POLL_COLOURS;
    let html = `<div class="cf-poll" onclick="event.stopPropagation()"><div class="cf-poll-q">${esc(poll.question)}</div>`;
    if (!hasVoted) {
      html += poll.options.map((o, i) =>
        `<button class="cf-poll-btn" style="border-left-color:${COLORS[i % COLORS.length]}" onclick="PostView.vote(event,'${esc(poll.id)}','${esc(o.id)}','${p.id}')">${esc(o.label)}</button>`
      ).join("");
    } else {
      html += poll.options.map((o, i) => {
        const c      = COLORS[i % COLORS.length];
        const count  = (poll.voteCounts && poll.voteCounts[o.id]) || 0;
        const pct    = poll.totalVotes > 0 ? Math.round(count / poll.totalVotes * 100) : 0;
        const isMine = o.id === poll.myVote;
        const voters = (isAdmin && poll.voters && poll.voters[o.id]) ? poll.voters[o.id] : null;
        const votersHtml = (voters && voters.length) ? `<div class="cf-poll-voters">${voters.map(n => esc(n)).join(", ")}</div>` : "";
        return `<div class="cf-poll-bar-row${isMine ? " mine" : ""}" style="border-left-color:${c}" onclick="PostView.vote(event,'${esc(poll.id)}','${esc(o.id)}','${p.id}')">
          <div class="cf-poll-bar-track"><div class="cf-poll-bar-fill" style="width:${pct}%;background:${c}"></div></div>
          <div class="cf-poll-bar-meta"><span>${esc(o.label)}${isMine ? " <span class='cf-poll-mine'>\u25cf you</span>" : ""}</span><span class="cf-poll-pct">${pct}%</span></div>
          ${votersHtml}
        </div>`;
      }).join("");
      const clearBtn = poll.myVote
        ? `<button class="cf-poll-clear" onclick="PostView.vote(event,'${esc(poll.id)}','${esc(poll.myVote)}','${p.id}')">Clear my vote</button>`
        : "";
      html += `<div class="cf-poll-footer">${clearBtn}<span class="cf-poll-total">${poll.totalVotes} vote${poll.totalVotes !== 1 ? "s" : ""}</span></div>`;
    }
    return html + `</div>`;
  }

  function bodyHtml(p) {
    let body;
    if (p.type === "youtube")   body = ytBody(p);
    else if (p.type === "blog") body = blogBody(p);
    else                        body = postBody(p);
    return body + pollHtml(p);
  }

  function typeBadge(type) {
    if (type === "youtube") return `${SVG_YT}YouTube`;
    if (type === "blog")    return `${SVG_BLOG}Monday Music Tips`;
    return `${SVG_POST}Post`;
  }

  /* ── playback ─────────────────────────────────────────────────────────── */

  function embedYt(postId, thumbEl) {
    embedded.add(postId);
    const p = getPost(postId);
    if (!p) return;
    // Embed where the thumbnail was actually tapped, so this works in a feed
    // card and in a detail view alike.
    const body = (thumbEl && thumbEl.parentElement) || document.getElementById(`cf-body-${postId}`);
    if (body) body.innerHTML = bodyHtml(p);
    recordView("video", p.youtube_id || postId, 0, false);
  }

  /* Stop anything playing inside `sel`. A feed card reverts to its thumbnail so
     it does not silently re-autoplay; a detail iframe is simply removed. */
  function pauseVideosIn(sel, detailPid) {
    document.querySelectorAll(`${sel} mux-player, ${sel} video`).forEach(v => { try { v.pause(); } catch (e) {} });
    document.querySelectorAll(`${sel} iframe`).forEach(f => {
      try {
        const body = f.closest('[id^="cf-body-"]');
        if (body) {
          const pid = body.id.slice("cf-body-".length);
          embedded.delete(pid);
          const p = getPost(pid);
          body.innerHTML = p ? bodyHtml(p) : "";
        } else {
          f.remove();
          if (detailPid) embedded.delete(detailPid);
        }
      } catch (e) {}
    });
  }

  function vote(ev, pollId, optionId, postId) {
    if (typeof castVote === "function") return castVote(ev, pollId, optionId, postId);
  }

  /* ── view tracking ────────────────────────────────────────────────────── */

  /* Fire-and-forget: a failure here must never interrupt playback. `db` is the
     host page's Supabase client. */
  function recordView(contentType, contentRef, seconds, done) {
    try {
      const client = window.db || window.supabaseClient;
      if (!client || !contentRef) return;
      client.rpc("record_view", {
        ct: contentType, cr: String(contentRef),
        secs: Math.max(0, Math.round(seconds || 0)), done: !!done,
      }).then(null, () => {});
    } catch (e) { /* never block the player */ }
  }

  /* Attach progress tracking to a mux-player or <video> inside `root`. */
  function trackMedia(root, contentType, contentRef) {
    if (!root) return;
    root.querySelectorAll("mux-player, video").forEach(el => {
      if (el._pvTracked) return;
      el._pvTracked = true;
      let last = 0;
      el.addEventListener("timeupdate", () => {
        const t = el.currentTime || 0;
        if (t - last < 15) return;                       // report every 15s, not every frame
        recordView(contentType, contentRef, t - last, false);
        last = t;
      });
      el.addEventListener("ended", () => recordView(contentType, contentRef, 0, true));
    });
  }

  return { init, bodyHtml, typeBadge, embedYt, pauseVideosIn, vote,
           recordView, trackMedia, embedded, esc };
})();
