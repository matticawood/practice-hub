/* ──────────────────────────────────────────────────────────────────────────
   Lesson renderer — single source of truth for turning a lesson's `blocks`
   array into HTML, used by BOTH the member Courses page and Lesson Studio's
   live preview (so they can never drift).

   API:
     LessonRender.html(blocks)        -> HTML string
     LessonRender.init(rootEl, opts)  -> wires question interactions inside rootEl
                                         opts.onQuizScore(score, total) optional
     LessonRender.injectStyles()      -> add the base stylesheet once (auto-called)

   Block types: heading | text | callout | example | image | audio | play |
                keyboard | notation | task | divider | questions
                (play = sound notes on a piano; keyboard = interactive piano with
                 highlighted keys; notation = printed staves from ABC notation via
                 abcjs; see 20260610_lessons.sql for the stored shape)
─────────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Lazy-load the Mux player web component the first time a video block renders.
  let _muxLoading = false;
  function ensureMux() {
    if (_muxLoading || (window.customElements && customElements.get("mux-player"))) return;
    _muxLoading = true;
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@mux/mux-player@3";
    document.head.appendChild(s);
  }

  // ── Piano audio + interactive keyboard (powers the play & keyboard blocks) ──
  // Same sampled acoustic-grand soundfont as the ear-training game, lazy-loaded
  // on first use, with a synth fallback so a click is never silent.
  let _audioCtx = null, _piano = null, _pianoLoading = false;
  function audioCtx() {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (_audioCtx.state === "suspended") _audioCtx.resume();
    return _audioCtx;
  }
  function loadScriptOnce(src) {
    return new Promise((res, rej) => {
      if (document.querySelector('script[data-src="' + src + '"]')) return res();
      const s = document.createElement("script");
      s.src = src; s.dataset.src = src;
      s.onload = () => res(); s.onerror = () => rej(new Error("load " + src));
      document.head.appendChild(s);
    });
  }
  function loadPiano() {
    if (_piano || _pianoLoading) return;
    _pianoLoading = true;
    loadScriptOnce("https://unpkg.com/soundfont-player@0.12.0/dist/soundfont-player.min.js")
      .then(() => window.Soundfont.instrument(audioCtx(), "acoustic_grand_piano", { soundfont: "MusyngKite" }))
      .then(inst => { _piano = inst; })
      .catch(() => { /* synth fallback handles it */ })
      .finally(() => { _pianoLoading = false; });
  }
  // abcjs renders ABC-notation text into printed staff notation (SVG). Lazy-loaded.
  let _abcjsLoading = null;
  function loadAbcjs() {
    if (window.ABCJS) return Promise.resolve();
    if (_abcjsLoading) return _abcjsLoading;
    _abcjsLoading = loadScriptOnce("https://cdn.jsdelivr.net/npm/abcjs@6.4.4/dist/abcjs-basic-min.js");
    return _abcjsLoading;
  }
  // Post-render "counting row": abcjs cannot spread a held note's / rest's beat
  // numbers evenly across its span, so instead of annotating the ABC we overlay
  // the counts as SVG <text> after rendering. Each bar is divided into `perBar`
  // equal slots and the numbers 1..perBar are centred in those slots below the
  // staff, so a whole-rest bar reads "1 2 3 4" evenly across the whole bar and a
  // held half note gets two numbers spread across it. add_classes must be on so
  // barlines (.abcjs-bar) and notes/rests are queryable.
  function addCountRow(out, abc) {
    try {
      const svg = out.querySelector("svg");
      if (!svg) return;
      const mm = abc.match(/M:\s*(\d+)\s*\/\s*\d+/);
      const perBar = mm ? parseInt(mm[1], 10) : 4;
      if (!perBar || perBar > 12) return;
      const staves = [...svg.querySelectorAll(".abcjs-staff")];
      if (!staves.length) return;
      let staffBottom = 0;
      staves.forEach(s => { const b = s.getBBox(); staffBottom = Math.max(staffBottom, b.y + b.height); });
      // Barlines, sorted left→right, de-duped (a braced grand stave draws one bar
      // element per staff at nearly the same x).
      let bars = [...svg.querySelectorAll(".abcjs-bar")].map(e => { const b = e.getBBox(); return b.x + b.width / 2; }).sort((a, b) => a - b);
      bars = bars.filter((x, i) => i === 0 || x - bars[i - 1] > 4);
      if (!bars.length) return;
      const firstEl = svg.querySelector(".abcjs-note, .abcjs-rest");
      if (!firstEl) return;
      const fb = firstEl.getBBox();
      const firstX = fb.x + fb.width / 2;
      // Left edge of bar 0: extrapolated back from the first note so beat 1 sits
      // under it (abcjs pads the clef/key, so the staff's left edge is too far left).
      const lx0 = firstX - (bars[0] - firstX) / (2 * perBar - 1);
      const bounds = [lx0, ...bars];
      const y = staffBottom + 15;
      const NS = "http://www.w3.org/2000/svg";
      for (let m = 0; m < bounds.length - 1; m++) {
        const Lx = bounds[m], w = bounds[m + 1] - Lx;
        if (w <= 0) continue;
        for (let k = 0; k < perBar; k++) {
          const t = document.createElementNS(NS, "text");
          t.setAttribute("x", (Lx + w * (k + 0.5) / perBar).toFixed(1));
          t.setAttribute("y", y.toFixed(1));
          t.setAttribute("text-anchor", "middle");
          t.setAttribute("font-size", "12");
          t.setAttribute("font-style", "italic");
          t.setAttribute("font-family", "Georgia, Times, serif");
          t.setAttribute("fill", "#9a7b52");
          t.textContent = String(k + 1);
          svg.appendChild(t);
        }
      }
      // Grow the SVG box so the counts are not clipped.
      const need = y + 6;
      const vb = svg.getAttribute("viewBox");
      if (vb) { const p = vb.split(/\s+/).map(Number); if (need > p[1] + p[3]) { p[3] = need - p[1]; svg.setAttribute("viewBox", p.join(" ")); } }
      const h = parseFloat(svg.getAttribute("height"));
      if (h && need > h) svg.setAttribute("height", need);
    } catch (e) { /* counts are decorative; never break the stave */ }
  }
  const _PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const _BLACK = { 1: 1, 3: 1, 6: 1, 8: 1, 10: 1 };
  function noteToMidi(n) {
    if (typeof n === "number") return n;
    const m = String(n).trim().match(/^([A-Ga-g])([#b]*)(-?\d+)$/);
    if (!m) return null;
    let v = _PC[m[1].toUpperCase()];
    for (const ch of m[2]) v += ch === "#" ? 1 : -1;
    return v + (parseInt(m[3], 10) + 1) * 12;
  }
  function synthNote(ctx, midi, t0, dur, mul) {
    mul = mul || 1;   // per-note loudness multiplier (for accents / strong-weak beats)
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    osc.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.32 * mul, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.1 * mul, t0 + 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }
  // A natural metronome tick: a very short burst of white noise through a bandpass filter. No
  // tonal oscillator, so there is no electronic pitch or twang, just a clean mechanical "tick".
  // Played on each beat under a clip when opts.click is set.
  function metroClick(ctx, t0) {
    const len = Math.ceil(ctx.sampleRate * 0.04);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2100; bp.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.032);
    src.connect(bp); bp.connect(g); g.connect(ctx.destination);
    src.start(t0); src.stop(t0 + 0.05);
  }
  // Play a set of notes. opts:
  //   sequence : play one after another (vs together as a chord)
  //   beats    : array of note lengths in beats, parallel to notes (e.g. [2,2] = two
  //              half notes). A null/invalid note entry is a REST: it still advances
  //              the clock but makes no sound. When omitted, falls back to fixed lengths.
  //   bpm      : tempo for the beats (default 80 → 1 beat = 0.75s)
  function playMidis(notes, opts) {
    opts = opts || {};
    notes = notes || [];
    const ctx = audioCtx();
    loadPiano();
    const seq = !!opts.sequence;
    const gate = opts.staccato ? 0.3 : (opts.legato ? 1.1 : 0.96);   // staccato = short/detached, legato = notes overlap smoothly
    const beats = Array.isArray(opts.beats) ? opts.beats : null;
    const gains = Array.isArray(opts.gains) ? opts.gains : null;   // per-note loudness (accents)
    const spb = 60 / (opts.bpm || 80);   // seconds per beat
    let cum = 0;
    notes.forEach((nv, i) => {
      const m = (nv == null) ? null : noteToMidi(nv);
      const mul = (gains && gains[i] != null) ? gains[i] : 1;
      let when, dur;
      if (beats) {
        const bl = (beats[i] != null ? beats[i] : 1);
        when = ctx.currentTime + 0.03 + (seq ? cum * spb : 0);
        dur = Math.max(0.08, bl * spb * gate);
        if (seq) cum += bl;
      } else {
        const gap = opts.gap || 0.55;
        when = ctx.currentTime + 0.03 + (seq ? i * gap : 0);
        dur = seq ? (opts.staccato ? 0.2 : opts.legato ? 0.95 : 0.7) : 2.4;
      }
      if (m == null) return;   // rest: clock already advanced, play nothing
      if (_piano) { try { _piano.play(m, when, { gain: 2.2 * mul, duration: dur }); return; } catch (e) {} }
      synthNote(ctx, m, when, dur, mul);
    });
    // optional metronome: one tick per beat across the whole clip
    if (opts.click) {
      const total = beats ? (seq ? beats.reduce((a, b) => a + (b || 0), 0) : Math.max(...beats.map(b => b || 1)))
                          : notes.length;
      for (let bt = 0; bt < total - 1e-6; bt++) metroClick(ctx, ctx.currentTime + 0.03 + bt * spb);
    }
  }
  function pcMod(m) { return ((m % 12) + 12) % 12; }
  // Build an interactive HTML piano. opts: { highlight:[notes], from, to, playable }.
  // Keys are positioned by percentage so the whole keyboard always fits its width.
  function buildKeyboard(opts) {
    const hi = (opts.highlight || []).map(noteToMidi).filter(m => m != null);
    let lo = opts.from != null ? noteToMidi(opts.from) : null;
    let hiEnd = opts.to != null ? noteToMidi(opts.to) : null;
    if (lo == null) lo = (hi.length ? Math.min.apply(null, hi) : 60) - 2;
    if (hiEnd == null) hiEnd = (hi.length ? Math.max.apply(null, hi) : 71) + 2;
    while (_BLACK[pcMod(lo)]) lo--;              // never start on a black key
    if (!opts.full) while (pcMod(lo) !== 0) lo--; // start on a C (skipped for a full-piano diagram)
    while (_BLACK[pcMod(hiEnd)]) hiEnd++;        // end on a white key
    if (hiEnd - lo < 12) hiEnd = lo + 12;
    // Normally clamp to 2 octaves so interactive keys never get too thin. A "full"
    // keyboard (opts.full) is a non-interactive orientation diagram of the whole
    // piano (e.g. show where middle C sits), so it keeps its full range.
    if (!opts.full && hiEnd - lo > 48) hiEnd = lo + 24;
    const hiSet = {}; hi.forEach(m => { hiSet[m] = 1; });
    // Optional circled finger numbers on keys, e.g. { "C4": 1, "D4": 2 }.
    const fg = {};
    if (opts.fingers) for (const k in opts.fingers) { const mm = noteToMidi(k); if (mm != null) fg[mm] = opts.fingers[k]; }
    const whites = [];
    for (let m = lo; m <= hiEnd; m++) if (!_BLACK[pcMod(m)]) whites.push(m);
    const ww = 100 / whites.length;
    let html = "";
    whites.forEach((m, i) => {
      const badge = fg[m] != null ? `<span class="lr-key-fg">${fg[m]}</span>` : "";
      html += `<div class="lr-key lr-key-w${hiSet[m] ? " lr-key-hi" : ""}" data-midi="${m}" style="left:${(i * ww).toFixed(4)}%;width:${ww.toFixed(4)}%">${badge}</div>`;
    });
    for (let m = lo; m <= hiEnd; m++) {
      if (!_BLACK[pcMod(m)]) continue;
      const wi = whites.indexOf(m - 1);
      if (wi < 0) continue;
      const left = (wi + 1) * ww;
      html += `<div class="lr-key lr-key-b${hiSet[m] ? " lr-key-hi" : ""}" data-midi="${m}" style="left:calc(${left.toFixed(4)}% - ${(ww * 0.32).toFixed(4)}%);width:${(ww * 0.64).toFixed(4)}%"></div>`;
    }
    return `<div class="lr-kbd-keys" style="--kw:${whites.length}">${html}</div>`;
  }

  // Pre-staff notation: circled finger numbers on top, open/filled noteheads whose
  // height traces the melody up and down, a soft contour line running THROUGH the note
  // centres so rising = higher, and the note letters underneath. No stave, no baseline.
  // Returns an SVG string (responsive via viewBox + width:100%).
  function buildPrestaffSVG(spec) {
    // One or two hands. spec.lh (when present) is a second hand drawn as a stacked
    // strip below the first, so hands-together pieces show both parts at once.
    const hands = spec.lh ? [spec, spec.lh] : [spec];
    const two = hands.length > 1;
    const n = Math.max(0, ...hands.map(h => Math.max((h.fingers || []).length, (h.names || []).length, (h.levels || []).length)));
    if (!n) return "";
    const gap = 130, margin = 60, W = margin * 2 + (n - 1) * gap, step = 16;
    // Each hand's strip height ADAPTS to its pitch range: the top note always sits 30px
    // below the finger badges, and lower notes step DOWN by a constant `step` per level.
    // So a skip (2 levels) looks twice as tall as a step (1 level), and a wide range never
    // collides with the badges. Range 2 reproduces the original single-step geometry.
    const geom = h => {
      const LV = (h.levels || []).slice(0, n);
      const vals = LV.filter(v => v != null);
      const lo = vals.length ? Math.min(...vals) : 0, hi = vals.length ? Math.max(...vals) : 0;
      const range = hi - lo;
      const contourTop = 64;                 // highest note (level hi)
      const bottom = range === 0 ? 96 : contourTop + range * step;  // lowest note (level lo)
      const cy = lv => range === 0 ? 96 : bottom - ((lv || 0) - lo) * step;
      const letterY = bottom + 44;
      return { cy, letterY, stripH: letterY + 10 };
    };
    // Draw one hand's strip at a y offset, using its own adaptive geometry g.
    const strip = (h, yOff, g, label) => {
      const F = h.fingers || [], NM = h.names || [], LV = h.levels || [], BT = h.beats || [];
      const fingerY = yOff + 34;
      const pts = [];
      for (let i = 0; i < n; i++) pts.push([margin + i * gap, yOff + g.cy(LV[i])]);
      let s = "";
      if (label) s += `<text x="8" y="${yOff + 15}" font-size="13" fill="#8a7868">${esc(label)}</text>`;
      if (n > 1 && spec.line !== false) s += `<polyline points="${pts.map(p => p.join(",")).join(" ")}" fill="none" stroke="#d9cbb4" stroke-width="2.5" stroke-linejoin="round"/>`;
      for (let i = 0; i < n; i++) {
        const [cx, cy] = pts[i];
        const long = (BT[i] || 1) >= 2;
        s += long
          ? `<ellipse cx="${cx}" cy="${cy}" rx="15" ry="11" fill="none" stroke="#1a1410" stroke-width="3"/>`
          : `<ellipse cx="${cx}" cy="${cy}" rx="14" ry="10.5" fill="#1a1410"/>`;
        if (F[i] != null) s += `<circle cx="${cx}" cy="${fingerY}" r="15" fill="#f5c518"/><text x="${cx}" y="${fingerY + 6}" text-anchor="middle" font-size="18" font-weight="800" fill="#3a2c00">${esc(String(F[i]))}</text>`;
        if (NM[i] != null) s += `<text x="${cx}" y="${yOff + g.letterY}" text-anchor="middle" font-size="15" fill="#8a7868">${esc(String(NM[i]))}</text>`;
      }
      return s;
    };
    const geoms = hands.map(geom);
    const H = geoms.reduce((a, g) => a + g.stripH, 0);
    let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui" class="lr-ps-svg">`;
    let yOff = 0;
    hands.forEach((h, hi) => { s += strip(h, yOff, geoms[hi], two ? (hi === 0 ? "Right hand" : "Left hand") : null); yOff += geoms[hi].stripH; });
    return s + `</svg>`;
  }

  // Finger-number diagram: a real line-drawing of both hands (backs up, as they sit on
  // the keys) with gold circled numbers 1-5 laid over each fingertip. Both thumbs are 1,
  // meeting in the middle, counting out to 5 on each side. Badge positions are percentages
  // of the image (1536x1024), calibrated to the fingertips. Returns the wrap HTML.
  function buildHandHTML() {
    // [leftPct, topPct, number] per fingertip, left hand then right hand
    // Positions are computed from the image pixels: each finger's badge is centred on
    // the fingertip midpoint and sits just above its tip; the thumb badge caps the
    // detected thumb-tip extremity. x = % of image width, y = % of image height.
    const fn = [
      [11.8, 18.1, 5], [19.0, 6.1, 4], [26.1, 0.5, 3], [33.5, 4.5, 2], [43.3, 28.0, 1],
      [55.3, 27.8, 1], [65.1, 4.6, 2], [72.4, 0.5, 3], [79.6, 6.1, 4], [86.7, 18.1, 5]
    ];
    const dots = fn.map(([x, y, n]) => `<span class="lr-fn" style="left:${x}%;top:${y}%">${n}</span>`).join("");
    return `<div class="lr-hand-wrap"><img src="/assets/hands-fingers.png" alt="Two hands, backs up, with finger numbers 1 to 5 on each fingertip" loading="lazy">${dots}</div>`;
  }

  // ── Minimal, safe markdown → HTML (bold, italic, code, links, lists) ──
  function inline(t) {
    t = esc(t);
    t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
    t = t.replace(/_([^_]+)_/g, '<em>$1</em>');
    t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return t;
  }
  function mdToHtml(md) {
    const lines = String(md || "").replace(/\r\n/g, "\n").split("\n");
    let out = "", list = null, para = [];
    const flushPara = () => { if (para.length) { out += "<p>" + inline(para.join(" ")) + "</p>"; para = []; } };
    const flushList = () => { if (list) { out += "</" + list + ">"; list = null; } };
    const cells = r => r.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(c => c.trim());
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) { flushPara(); flushList(); continue; }
      // GFM table: a "| … |" header row, a "|---|---|" separator, then body rows.
      const next = (lines[i + 1] || "").trim();
      if (line.indexOf("|") !== -1 && /^[|\s:-]+$/.test(next) && next.indexOf("-") !== -1 && next.indexOf("|") !== -1) {
        flushPara(); flushList();
        const th = cells(line).map(c => `<th>${inline(c)}</th>`).join("");
        const body = [];
        i += 1; // skip separator
        while (i + 1 < lines.length && lines[i + 1].trim() && lines[i + 1].indexOf("|") !== -1) {
          i += 1;
          body.push(`<tr>${cells(lines[i]).map(c => `<td>${inline(c)}</td>`).join("")}</tr>`);
        }
        out += `<div class="lr-tablewrap"><table class="lr-table"><thead><tr>${th}</tr></thead><tbody>${body.join("")}</tbody></table></div>`;
        continue;
      }
      const ul = line.match(/^[-*]\s+(.*)$/);
      const ol = line.match(/^\d+\.\s+(.*)$/);
      if (ul) { flushPara(); if (list !== "ul") { flushList(); out += "<ul>"; list = "ul"; } out += "<li>" + inline(ul[1]) + "</li>"; continue; }
      if (ol) { flushPara(); if (list !== "ol") { flushList(); out += "<ol>"; list = "ol"; } out += "<li>" + inline(ol[1]) + "</li>"; continue; }
      flushList(); para.push(line);
    }
    flushPara(); flushList();
    return out;
  }

  // ── Per-block rendering ──
  const CALLOUT_LABEL = { key: "Key idea", tip: "Tip", note: "Note", watch: "Watch out" };

  function renderQuestion(q, qi, bi) {
    const id = `lr-${bi}-${qi}`;
    const accept = q.accept ? JSON.stringify(q.accept).replace(/"/g, "&quot;") : "";
    let body = "";
    if (q.kind === "mcq") {
      body = (q.options || []).map((o, i) =>
        `<button type="button" class="lr-opt" data-i="${i}">${esc(o)}</button>`).join("");
      body = `<div class="lr-opts" data-answer="${q.answer}">${body}</div>`;
    } else if (q.kind === "truefalse") {
      body = `<div class="lr-opts" data-answer="${q.answer ? 0 : 1}">
        <button type="button" class="lr-opt" data-i="0">True</button>
        <button type="button" class="lr-opt" data-i="1">False</button></div>`;
    } else if (q.kind === "short") {
      body = `<div class="lr-short"><input type="text" class="lr-input" data-accept="${accept}" placeholder="Your answer">
        <button type="button" class="lr-check">Check</button></div>`;
    } else { // reflect
      body = `<div class="lr-reflect"><textarea class="lr-input" rows="2" placeholder="Jot your thoughts (optional)"></textarea>
        <button type="button" class="lr-done">Mark done</button></div>`;
    }
    return `<div class="lr-q" id="${id}" data-kind="${esc(q.kind)}">
      <div class="lr-q-prompt">${inline(q.prompt || "")}</div>
      ${body}
      ${q.explain ? `<div class="lr-q-explain" hidden>${inline(q.explain)}</div>` : ""}
    </div>`;
  }

  function renderBlock(b, bi) {
    switch (b && b.type) {
      case "heading":
        return `<h${b.size === 3 ? 3 : 2} class="lr-heading">${inline(b.text || "")}</h${b.size === 3 ? 3 : 2}>`;
      case "text":
        return `<div class="lr-text">${mdToHtml(b.md)}</div>`;
      case "callout":
        return `<div class="lr-callout lr-callout-${esc(b.style || "note")}">
          <div class="lr-callout-label">${esc(b.label || CALLOUT_LABEL[b.style] || "Note")}</div>
          <div class="lr-text">${mdToHtml(b.md)}</div></div>`;
      case "example":
        return `<div class="lr-example">
          ${b.title ? `<div class="lr-example-title">${esc(b.title)}</div>` : ""}
          ${b.image ? `<img class="lr-img" src="${esc(b.image)}" alt="">` : ""}
          <div class="lr-text">${mdToHtml(b.md)}</div></div>`;
      case "image":
        return `<figure class="lr-figure"><img class="lr-img" src="${esc(b.url)}" alt="${esc(b.alt || "")}">
          ${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ""}</figure>`;
      case "audio":
        return `<div class="lr-audio">${b.caption ? `<div class="lr-audio-cap">${esc(b.caption)}</div>` : ""}
          <audio controls preload="none" src="${esc(b.url)}"></audio></div>`;
      case "play": {
        const notes = Array.isArray(b.notes) ? b.notes : [];
        const seq = b.style === "sequence" || b.style === "melody" || b.style === "scale";
        const beatsAttr = Array.isArray(b.beats) ? ` data-beats="${esc(JSON.stringify(b.beats))}"` : "";
        const bpmAttr = b.bpm ? ` data-bpm="${esc(String(b.bpm))}"` : "";
        const clickAttr = b.click ? ` data-click="1"` : "";
        const gainsAttr = Array.isArray(b.gains) ? ` data-gains="${esc(JSON.stringify(b.gains))}"` : "";
        const stacAttr = b.staccato ? ` data-staccato="1"` : "";
        const legAttr = b.legato ? ` data-legato="1"` : "";
        // voices: independent simultaneous lines (e.g. a held left-hand note under a
        // moving right-hand melody). Each voice is { notes, beats, bpm?, staccato? }.
        const voicesAttr = Array.isArray(b.voices) ? ` data-voices="${esc(JSON.stringify(b.voices))}"` : "";
        return `<div class="lr-play"><button type="button" class="lr-play-btn" data-notes="${esc(JSON.stringify(notes))}" data-seq="${seq ? 1 : 0}"${beatsAttr}${bpmAttr}${clickAttr}${gainsAttr}${stacAttr}${legAttr}${voicesAttr}>
          <span class="lr-play-ico">&#9654;</span><span>${esc(b.label || "Listen")}</span></button></div>`;
      }
      case "keyboard": {
        // A full-piano orientation diagram is not clickable (keys are too thin to play).
        const live = (b.playable === false || b.full) ? "" : " lr-kbd-live";
        const notesJson = esc(JSON.stringify(b.highlight || []));
        // The head Play button sounds the highlighted keys together. Hide it with
        // noplay:true where that would be a meaningless cluster (e.g. C-D-E position).
        const wantPlay = !!(b.highlight && b.highlight.length) && !b.noplay;
        const head = (b.label || wantPlay)
          ? `<div class="lr-kbd-head">${b.label ? `<span class="lr-kbd-label">${esc(b.label)}</span>` : ""}${wantPlay ? `<button type="button" class="lr-kbd-play" data-notes="${notesJson}"><span class="lr-play-ico">&#9654;</span> Play</button>` : ""}</div>`
          : "";
        return `<figure class="lr-kbd${live}">${head}${buildKeyboard(b)}${b.caption ? `<figcaption class="lr-cap">${esc(b.caption)}</figcaption>` : ""}</figure>`;
      }
      case "notation": {
        // hero: a large, framed "method-book" stave where the music is the focal
        // point (bigger notes, finger numbers via !1! decorations in the abc).
        // compact: a tiny fixed-size stave (e.g. to show a single note's length) that
        // does NOT stretch full-width, so it stays a readable size on mobile too.
        const heroCls = (b.hero || b.scale) ? " lr-notation-hero" : (b.compact ? " lr-notation-mini" : "");
        const scaleAttr = ` data-scale="${b.scale ? +b.scale : (b.hero ? 1.6 : 1)}"${b.compact ? ' data-compact="1"' : ""}${b.count ? ' data-count="1"' : ""}`;
        return `<figure class="lr-notation${heroCls}"${scaleAttr}><div class="lr-abc-src" style="display:none">${esc(b.abc || "")}</div><div class="lr-abc-out"></div>${b.caption ? `<figcaption class="lr-cap">${esc(b.caption)}</figcaption>` : ""}</figure>`;
      }
      case "prestaff": {
        // Pre-staff notation (First Steps day-one pieces): big circled finger numbers
        // with an up/down contour and note letters, NO stave. Drawn as SVG in init();
        // audio via the shared play button.
        // line !== false draws the up/down contour; set line:false for a flat demo
        // (e.g. the same note short vs long) where a connecting line would be meaningless.
        const lh = b.lh && (b.lh.notes || b.lh.names || b.lh.levels) ? b.lh : null;
        const specObj = { fingers: b.fingers || [], names: b.names || [], levels: b.levels || [], beats: b.beats || [], line: b.line };
        if (lh) specObj.lh = { fingers: lh.fingers || [], names: lh.names || [], levels: lh.levels || [], beats: lh.beats || [] };
        const spec = esc(JSON.stringify(specObj));
        const notes = b.notes || [];
        const clickAttr = b.click ? ` data-click="1"` : "";
        // Two hands: play both parts together as two voices. One hand: a single sequence.
        const playData = lh
          ? ` data-voices="${esc(JSON.stringify([{ notes, beats: b.beats || [] }, { notes: lh.notes || [], beats: lh.beats || [] }]))}" data-bpm="${b.bpm || 72}"${clickAttr}`
          : ` data-notes="${esc(JSON.stringify(notes))}" data-seq="1" data-beats="${esc(JSON.stringify(b.beats || []))}" data-bpm="${b.bpm || 72}"${clickAttr}`;
        const playBtn = (notes.length || (lh && (lh.notes || []).length))
          ? `<div class="lr-play"><button type="button" class="lr-play-btn"${playData}><span class="lr-play-ico">&#9654;</span><span>${esc(b.label || "Hear it")}</span></button></div>`
          : "";
        // Keep the play button INSIDE the figure so a prestaff block is a single
        // top-level element (the lesson-studio inline editor maps one element per block).
        return `<figure class="lr-prestaff"><div class="lr-ps-out" data-spec="${spec}"></div>${b.caption ? `<figcaption class="lr-cap">${esc(b.caption)}</figcaption>` : ""}${playBtn}</figure>`;
      }
      case "hand": {
        // Both-hands diagram with circled finger numbers 1-5 (teaches finger numbers).
        return `<figure class="lr-hand">${buildHandHTML()}${b.caption ? `<figcaption class="lr-cap">${esc(b.caption)}</figcaption>` : ""}</figure>`;
      }
      case "task":
        return `<div class="lr-task"><div class="lr-task-label">Your task</div>
          <div class="lr-text">${mdToHtml(b.md)}</div>
          ${b.share ? `<button type="button" class="lr-task-share" data-share="1">Share to community</button>` : ""}</div>`;
      case "divider":
        return `<hr class="lr-divider">`;
      case "video": {
        if (!b.playbackId) return `<div class="lr-video lr-video-poster"><div class="lr-video-badge">▶ Video</div><div class="lr-video-id">Add a Mux Playback ID</div></div>`;
        // With a signed token (store delivery) render the live player; otherwise show
        // a labelled poster so signed videos don't show a broken player in previews.
        if (b.token || b.public) {
          ensureMux();
          const tok = b.token ? ` playback-token="${esc(b.token)}"` : "";
          const tt = b.thumbToken ? ` thumbnail-token="${esc(b.thumbToken)}"` : "";
          const st = b.storyboardToken ? ` storyboard-token="${esc(b.storyboardToken)}"` : "";
          return `<div class="lr-video"><mux-player playback-id="${esc(b.playbackId)}"${tok}${tt}${st} accent-color="#f5c518" style="width:100%;aspect-ratio:16/9;border-radius:12px;overflow:hidden;display:block;--controls:flex"></mux-player>${b.caption ? `<div class="lr-cap">${esc(b.caption)}</div>` : ""}</div>`;
        }
        return `<div class="lr-video lr-video-poster"><div class="lr-video-badge">▶ Video</div><div class="lr-video-id">Mux &middot; ${esc(b.playbackId)}</div>${b.caption ? `<div class="lr-cap">${esc(b.caption)}</div>` : ""}</div>`;
      }
      case "download": {
        const href = b.url ? esc(b.url) : "#";
        const dl = b.url ? ' target="_blank" rel="noopener" download' : ' data-download-pending="1"';
        return `<div class="lr-download"><a class="lr-download-btn" href="${href}"${dl}><span class="lr-dl-ico">&#x2913;</span><span>${esc(b.label || "Download")}</span></a>${b.note ? `<div class="lr-cap">${esc(b.note)}</div>` : ""}</div>`;
      }
      case "questions": {
        const items = (b.items || []).map((q, qi) => renderQuestion(q, qi, bi)).join("");
        if (b.mode === "quiz") {
          const n = (b.items || []).length;
          return `<div class="lr-quiz" data-quiz="${bi}">
            <div class="lr-quiz-card">
              <div class="lr-quiz-title">${esc(b.title || "Quiz")}</div>
              <div class="lr-quiz-sub">${n} question${n !== 1 ? "s" : ""}</div>
              <button type="button" class="lr-quiz-start">Start quiz</button>
            </div>
            <div class="lr-quiz-body" hidden>${items}
              <button type="button" class="lr-quiz-submit">Submit answers</button>
              <div class="lr-quiz-result" hidden></div></div>
          </div>`;
        }
        return `<div class="lr-questions">${b.title ? `<div class="lr-questions-title">${esc(b.title)}</div>` : ""}${items}</div>`;
      }
      default:
        return "";
    }
  }

  // ── Interaction wiring ──
  function markQuestion(qEl) {
    const kind = qEl.dataset.kind;
    let correct = null;
    if (kind === "mcq" || kind === "truefalse") {
      const opts = qEl.querySelector(".lr-opts");
      const sel = qEl.querySelector(".lr-opt.lr-sel");
      if (!sel) return null;
      const ans = parseInt(opts.dataset.answer, 10);
      correct = parseInt(sel.dataset.i, 10) === ans;
      qEl.querySelectorAll(".lr-opt").forEach(o => {
        const i = parseInt(o.dataset.i, 10);
        if (i === ans) o.classList.add("lr-correct");
        else if (o.classList.contains("lr-sel")) o.classList.add("lr-wrong");
        o.disabled = true;
      });
    } else if (kind === "short") {
      const inp = qEl.querySelector(".lr-input");
      let accept = [];
      try { accept = JSON.parse(inp.dataset.accept || "[]"); } catch (e) {}
      const norm = s => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
      correct = accept.map(norm).includes(norm(inp.value));
      inp.classList.add(correct ? "lr-correct" : "lr-wrong");
      inp.disabled = true;
    } else { correct = null; } // reflect
    const ex = qEl.querySelector(".lr-q-explain");
    if (ex) ex.hidden = false;
    if (correct !== null) qEl.classList.add(correct ? "lr-q-correct" : "lr-q-wrong");
    return correct;
  }

  function init(root, opts) {
    opts = opts || {};
    // Option selection (mcq / truefalse)
    root.querySelectorAll(".lr-opt").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        const wrap = btn.closest(".lr-opts");
        wrap.querySelectorAll(".lr-opt").forEach(o => o.classList.remove("lr-sel"));
        btn.classList.add("lr-sel");
        // inline questions auto-mark on pick
        const q = btn.closest(".lr-q");
        if (q && !q.closest(".lr-quiz-body")) markQuestion(q);
      });
    });
    // short-answer check
    root.querySelectorAll(".lr-check").forEach(b =>
      b.addEventListener("click", () => markQuestion(b.closest(".lr-q"))));
    // reflect done
    root.querySelectorAll(".lr-done").forEach(b =>
      b.addEventListener("click", () => { const q = b.closest(".lr-q"); q.classList.add("lr-q-done"); b.disabled = true; }));
    // quiz mode
    root.querySelectorAll(".lr-quiz").forEach(quiz => {
      const start = quiz.querySelector(".lr-quiz-start");
      const body = quiz.querySelector(".lr-quiz-body");
      const card = quiz.querySelector(".lr-quiz-card");
      const submit = quiz.querySelector(".lr-quiz-submit");
      const result = quiz.querySelector(".lr-quiz-result");
      if (start) start.addEventListener("click", () => { card.hidden = true; body.hidden = false; });
      if (submit) submit.addEventListener("click", () => {
        const qs = [...body.querySelectorAll(".lr-q")];
        let score = 0, gradable = 0;
        qs.forEach(q => { const r = markQuestion(q); if (r !== null) { gradable++; if (r) score++; } });
        result.hidden = false;
        result.innerHTML = `You scored <strong>${score} / ${gradable}</strong>.`;
        submit.disabled = true;
        if (opts.onQuizScore) opts.onQuizScore(score, gradable);
      });
    });
    // task share hook (page supplies behaviour)
    root.querySelectorAll(".lr-task-share").forEach(b =>
      b.addEventListener("click", () => { if (opts.onShare) opts.onShare(b.closest(".lr-task")); }));

    // ── Audio blocks: play buttons + interactive keyboards ──
    const parseNotes = el => { try { return JSON.parse(el.dataset.notes || "[]"); } catch (e) { return []; } };
    const parseJson = (s, fb) => { try { return s ? JSON.parse(s) : fb; } catch (e) { return fb; } };
    root.querySelectorAll(".lr-play-btn").forEach(btn =>
      btn.addEventListener("click", () => {
        const voices = parseJson(btn.dataset.voices, null);
        if (Array.isArray(voices) && voices.length) {
          // Start each voice as its own sequence at (almost) the same instant, so a
          // held bass note and a moving melody sound together as two hands would.
          const bpm = btn.dataset.bpm ? parseFloat(btn.dataset.bpm) : null;
          const click = btn.dataset.click === "1";
          voices.forEach((v, vi) => playMidis(Array.isArray(v.notes) ? v.notes : [], {
            sequence: true,
            beats: Array.isArray(v.beats) ? v.beats : null,
            bpm: v.bpm || bpm,
            click: vi === 0 ? click : false,   // metronome at most once
            gains: Array.isArray(v.gains) ? v.gains : null,
            staccato: !!v.staccato,
            legato: !!v.legato
          }));
          return;
        }
        playMidis(parseNotes(btn), {
          sequence: btn.dataset.seq === "1",
          beats: parseJson(btn.dataset.beats, null),
          bpm: btn.dataset.bpm ? parseFloat(btn.dataset.bpm) : null,
          click: btn.dataset.click === "1",
          gains: parseJson(btn.dataset.gains, null),
          staccato: btn.dataset.staccato === "1",
          legato: btn.dataset.legato === "1"
        });
      }));
    root.querySelectorAll(".lr-kbd-play").forEach(btn =>
      btn.addEventListener("click", () => playMidis(parseNotes(btn), { sequence: false })));
    root.querySelectorAll(".lr-kbd-live .lr-key").forEach(key =>
      key.addEventListener("pointerdown", () => {
        const m = parseInt(key.dataset.midi, 10);
        if (isNaN(m)) return;
        playMidis([m], {});
        key.classList.add("lr-key-press");
        setTimeout(() => key.classList.remove("lr-key-press"), 160);
      }));
    // Pre-staff notation blocks: draw the finger-number/contour SVG.
    root.querySelectorAll(".lr-ps-out").forEach(out => {
      if (out.dataset.done) return;
      let spec; try { spec = JSON.parse(out.dataset.spec || "{}"); } catch (e) { spec = {}; }
      out.innerHTML = buildPrestaffSVG(spec);
      out.dataset.done = "1";
    });
    // Warm up the soundfont if this lesson has any audio so the first note is instant.
    if (root.querySelector(".lr-play-btn, .lr-kbd-play, .lr-kbd-live")) loadPiano();

    // ── Notation blocks: render the ABC into printed staves via abcjs ──
    root.querySelectorAll(".lr-notation").forEach(fig => {
      const src = fig.querySelector(".lr-abc-src"), out = fig.querySelector(".lr-abc-out");
      if (!src || !out || out.dataset.done) return;
      let abc = (src.textContent || "").trim();
      if (!abc) return;
      // Strip a spurious leading barline. The drafts sometimes prefix the music
      // body with "| " (e.g. "| G4 |]"), which abcjs draws as a stray barline
      // right after the time signature. Remove a lone leading "|" at the start of
      // each music line (keeping "|]", "||", "|:" and any [V:..] voice prefix).
      abc = abc.split("\n").map(line =>
        (/^\s*([A-Za-z]:|%%)/.test(line))
          ? line
          : line.replace(/^(\s*(?:\[V:[^\]]*\]\s*)?)\|(?![\]|:])\s*/, "$1")
      ).join("\n");
      loadAbcjs().then(() => {
        try {
          // Render each stave at the FULL column width. abcjs leaves a short or final
          // line unjustified (narrow, left-clustered), so "%%stretchlast 1" forces that
          // line to spread across the whole staffwidth — full-width staves with the notes
          // distributed and normal note size, whether the line is open-ended or closed
          // with a final bar line. staffwidth tracks the container so it stays responsive.
          const full = Math.max(260, (out.clientWidth || 660) - 4);
          const isHero = (parseFloat(fig.dataset.scale) || 1) > 1;
          const wantCount = fig.dataset.count === "1";
          if (fig.dataset.compact === "1") {
            // A tiny fixed-size figure (single note / note-value demo): fixed staffwidth,
            // no stretch/responsive, so it stays the same readable size on every screen.
            window.ABCJS.renderAbc(out, abc, { paddingtop: 3, paddingbottom: 3, staffwidth: 130, scale: 1.4 });
          } else if (isHero) {
            // Hero stave: lay the music out in a narrow staffwidth so the notes read
            // large, then let abcjs's responsive:"resize" scale the whole SVG (viewBox +
            // width:100%) to the column at ANY width. This keeps it big on desktop, scales
            // it down to fit on mobile (no clipping), and keeps the final bar line in view.
            window.ABCJS.renderAbc(out, "%%stretchlast 1\n" + abc, { paddingtop: 5, paddingbottom: 5, staffwidth: 380, responsive: "resize", add_classes: wantCount });
            if (wantCount) addCountRow(out, abc);
          } else {
            window.ABCJS.renderAbc(out, "%%stretchlast 1\n" + abc, { paddingtop: 4, paddingbottom: 4, staffwidth: full, add_classes: wantCount });
            // abcjs gives the SVG fixed width/height attributes but NO viewBox, so CSS
            // "max-width:100%" shrinks the box without scaling content and clips the right
            // edge on narrow widths. A getBBox-based viewBox makes the whole stave scale.
            const s = out.querySelector("svg");
            if (s && !s.getAttribute("viewBox")) {
              let vb = null;
              try { const bb = s.getBBox(); const p = 3; if (bb.width && bb.height) vb = (bb.x - p) + " " + (bb.y - p) + " " + (bb.width + p * 2) + " " + (bb.height + p * 2); } catch (e) {}
              if (!vb) { const w = parseFloat(s.getAttribute("width")), h = parseFloat(s.getAttribute("height")); if (w && h) vb = "0 0 " + w + " " + h; }
              if (vb) { s.setAttribute("viewBox", vb); s.setAttribute("preserveAspectRatio", "xMidYMid meet"); }
            }
            if (wantCount) addCountRow(out, abc);
          }
          out.dataset.done = "1";
        } catch (e) { out.innerHTML = '<div class="lr-abc-err">This notation could not be rendered.</div>'; }
      }).catch(() => { out.innerHTML = '<div class="lr-abc-err">The notation library failed to load.</div>'; });
    });
  }

  let _styled = false;
  function injectStyles() {
    if (_styled) return; _styled = true;
    const css = `
    /* Self-contained light tokens so the host page's theme (e.g. the dark app
       chrome) can't bleed into the lesson. Without this, --surface/--surface-2
       could resolve dark and inputs/cards render black. */
    .lr-body{--surface:#ffffff;--surface-2:#f1f1f4;--border:#e0d5c8;--text:#1a1410;--text-muted:#8a7868;--accent:#f5c518;color-scheme:light;max-width:680px;margin:0 auto;line-height:1.6;color:var(--text,#1a1410)}
    .lr-heading{font-weight:800;letter-spacing:-.01em;margin:26px 0 10px;line-height:1.25}
    h2.lr-heading{font-size:1.3rem} h3.lr-heading{font-size:1.08rem}
    .lr-text{font-size:1rem;margin:0 0 4px}
    .lr-text p{margin:0 0 12px} .lr-text ul,.lr-text ol{margin:0 0 12px;padding-left:22px}
    .lr-text li{margin:4px 0} .lr-text code{background:rgba(0,0,0,.06);border-radius:4px;padding:1px 5px;font-size:.9em}
    .lr-tablewrap{overflow-x:auto;margin:8px 0 16px}
    .lr-table{border-collapse:collapse;width:100%;font-size:.92rem}
    .lr-table th,.lr-table td{padding:9px 13px;text-align:left;vertical-align:top;border:1px solid var(--border,#e3e1e6)}
    .lr-table th{background:var(--surface-2,#f5f2ee);font-weight:700;color:var(--text,#1a1410);white-space:nowrap}
    .lr-table td strong{color:var(--accent-dark,#9a6f12)}
    .lr-callout{border-radius:12px;padding:14px 16px;margin:16px 0;border:1px solid var(--border,#e3e1e6);background:var(--surface,#fff)}
    .lr-callout-label{font-size:.62rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px;color:var(--accent-dark,#9a6f12)}
    .lr-callout-key{border-left:3px solid var(--accent,#f5c518)}
    .lr-callout-watch{border-left:3px solid #d9534f}.lr-callout-watch .lr-callout-label{color:#c0392b}
    .lr-callout-tip{border-left:3px solid #5fbf7e}.lr-callout-tip .lr-callout-label{color:#2f7d4a}
    .lr-example{border:1px solid var(--border,#e3e1e6);border-radius:12px;padding:14px 16px;margin:16px 0;background:var(--surface,#fff)}
    .lr-example-title{font-weight:700;margin-bottom:8px;font-size:.92rem}
    .lr-img{max-width:100%;height:auto;border-radius:10px;display:block;margin:4px 0}
    .lr-figure{margin:16px 0}.lr-figure figcaption{font-size:.8rem;color:var(--text-muted,#8a7868);margin-top:6px;text-align:center}
    .lr-audio{margin:16px 0}.lr-audio-cap{font-size:.85rem;color:var(--text-muted,#8a7868);margin-bottom:6px}.lr-audio audio{width:100%}
    .lr-play{margin:16px 0}
    .lr-play-btn{display:inline-flex;align-items:center;gap:9px;background:var(--surface,#fff);border:1.5px solid var(--accent,#f5c518);border-radius:10px;padding:10px 16px;font:inherit;font-weight:700;font-size:.9rem;color:var(--text,#1a1410);cursor:pointer}
    .lr-play-btn:hover{background:linear-gradient(180deg,rgba(245,197,24,.12),transparent)}
    .lr-play-btn:active{transform:translateY(1px)}
    .lr-play-ico{color:var(--accent-dark,#9a6f12);font-size:.85rem}
    .lr-kbd{margin:18px 0}
    .lr-kbd-head{display:flex;align-items:center;gap:12px;margin-bottom:8px;flex-wrap:wrap}
    .lr-kbd-label{font-weight:700;font-size:.92rem}
    .lr-kbd-play{display:inline-flex;align-items:center;gap:6px;background:var(--surface-2,#f5f2ee);border:1.5px solid var(--border,#e3e1e6);border-radius:8px;padding:5px 11px;font:inherit;font-size:.8rem;font-weight:700;color:var(--text,#1a1410);cursor:pointer}
    .lr-kbd-play:hover{border-color:var(--accent,#f5c518)}
    .lr-kbd-keys{position:relative;width:100%;aspect-ratio:var(--kw,7) / 2.6;max-height:124px;border-radius:9px;background:linear-gradient(#2a2520,#1c1813);box-shadow:inset 0 3px 7px rgba(0,0,0,.4);overflow:hidden;user-select:none;touch-action:manipulation}
    .lr-key{position:absolute;top:0;box-sizing:border-box}
    .lr-key-w{height:100%;background:linear-gradient(#fff,#ededf1);border:1px solid #cbc9cf;border-radius:0 0 5px 5px}
    .lr-key-b{height:62%;background:linear-gradient(#403930,#16120d);border:1px solid #000;border-radius:0 0 4px 4px;z-index:2;box-shadow:0 2px 3px rgba(0,0,0,.4)}
    .lr-key-w.lr-key-hi{background:linear-gradient(#ffe9a0,#f5c518)}
    .lr-key-b.lr-key-hi{background:linear-gradient(#e0aa00,#9a7400)}
    .lr-kbd-live .lr-key{cursor:pointer}
    .lr-key-press{filter:brightness(1.22)}
    .lr-notation{margin:18px 0;overflow-x:auto}
    .lr-notation-hero{margin:14px 0;padding:20px 18px 12px;background:var(--surface,#fff);border:1px solid var(--border,#ece3d6);border-radius:14px;box-shadow:0 2px 12px -7px rgba(60,40,20,.28)}
    .lr-notation-hero .lr-cap{margin-top:8px}
    .lr-notation-mini{margin:10px 0}
    .lr-notation-mini .lr-abc-out{text-align:center}
    /* Pre-staff notation (First Steps): framed card, responsive SVG. */
    .lr-prestaff{margin:14px 0 6px;padding:16px 14px 10px;background:var(--surface,#fff);border:1px solid var(--border,#ece3d6);border-radius:14px;box-shadow:0 2px 12px -7px rgba(60,40,20,.28)}
    .lr-ps-svg{display:block;width:100%;max-width:100%;height:auto}
    .lr-prestaff .lr-cap{margin-top:8px}
    /* Finger-number diagram: framed card, real hand image with number badges overlaid. */
    .lr-hand{margin:14px 0 6px;padding:16px 14px 10px;background:var(--surface,#fff);border:1px solid var(--border,#ece3d6);border-radius:14px;box-shadow:0 2px 12px -7px rgba(60,40,20,.28)}
    .lr-hand-wrap{position:relative;max-width:460px;margin:0 auto;container-type:inline-size;aspect-ratio:3/2}
    .lr-hand-wrap img{display:block;width:100%;height:auto}
    .lr-fn{position:absolute;transform:translate(-50%,-50%);width:clamp(21px,6.2cqw,29px);height:clamp(21px,6.2cqw,29px);border-radius:50%;background:var(--accent,#f5c518);color:#3a2c00;font-weight:800;font-size:clamp(12px,3.4cqw,15px);line-height:1;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(60,40,20,.35)}
    .lr-hand .lr-cap{margin-top:8px}
    /* Circled finger number on a keyboard key. */
    .lr-key-w .lr-key-fg{position:absolute;bottom:8%;left:50%;transform:translateX(-50%);width:20px;height:20px;border-radius:50%;background:var(--accent,#f5c518);color:#3a2c00;font:700 12px/20px system-ui;text-align:center;box-shadow:0 1px 2px rgba(0,0,0,.25)}
    /* Centre via text-align (block), NOT flexbox: a flex child's min-width:auto
       stops max-width:100% from shrinking a wide SVG, so on narrow widths (the
       studio preview panel, phones) the stave overflows and the right edge —
       including the final bar line — gets clipped. Inline-centring lets the SVG
       scale down to fit so the whole stave stays visible. */
    .lr-abc-out{text-align:center}
    .lr-notation svg{max-width:100%;height:auto}
    .lr-abc-err{font-size:.85rem;color:var(--text-muted,#8a7868);border:1px dashed var(--border,#e3e1e6);border-radius:8px;padding:10px}
    .lr-task{border:1px solid var(--border,#e0d5c8);border-left:4px solid var(--accent,#f5c518);border-radius:12px;padding:14px 16px;margin:18px 0;background:var(--surface,#fff)}
    .lr-task-label{font-size:.62rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px;color:var(--accent-dark,#9a6f12)}
    .lr-task-share{margin-top:10px;background:var(--accent,#f5c518);color:#3a2c00;border:none;border-radius:9px;padding:8px 14px;font-weight:700;font-size:.82rem;cursor:pointer}
    .lr-divider{border:none;border-top:1px solid var(--border,#e3e1e6);margin:24px 0}
    .lr-video{margin:18px 0}
    .lr-cap{font-size:.82rem;color:var(--text-muted,#8a7868);margin-top:7px;text-align:center}
    .lr-video-poster{aspect-ratio:16/9;border:1.5px dashed var(--border,#e3e1e6);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:var(--surface-2,#f5f2ee);color:var(--text-muted,#8a7868)}
    .lr-video-badge{font-weight:800;font-size:1.05rem;color:var(--accent-dark,#9a6f12)}
    .lr-video-id{font-size:.8rem}
    .lr-download{margin:16px 0}
    .lr-download-btn{display:inline-flex;align-items:center;gap:9px;background:var(--surface,#fff);border:1.5px solid var(--accent,#f5c518);border-radius:10px;padding:11px 16px;font-weight:700;font-size:.9rem;color:var(--text,#1a1410);text-decoration:none;cursor:pointer}
    .lr-download-btn:hover{background:linear-gradient(180deg,rgba(245,197,24,.1),transparent)}
    .lr-dl-ico{font-size:1.05rem;color:var(--accent-dark,#9a6f12)}
    .lr-questions,.lr-quiz{margin:18px 0}
    .lr-questions-title,.lr-quiz-title{font-weight:700;margin-bottom:10px}
    .lr-q{border:1px solid var(--border,#e3e1e6);border-radius:12px;padding:14px 16px;margin:10px 0;background:var(--surface,#fff)}
    .lr-q-prompt{font-weight:600;margin-bottom:10px}
    .lr-opts{display:flex;flex-direction:column;gap:8px}
    .lr-opt{text-align:left;color:var(--text,#1a1410);background:var(--surface,#fff);border:1.5px solid var(--border,#e3e1e6);border-radius:9px;padding:10px 12px;font:inherit;font-size:.92rem;cursor:pointer;transition:border-color .12s,background .12s}
    .lr-opt:hover:not(:disabled){border-color:var(--accent,#f5c518)}
    .lr-opt.lr-sel{border-color:var(--accent,#f5c518)}
    .lr-opt.lr-correct{border-color:#5fbf7e;background:#eaf6ee}
    .lr-opt.lr-wrong{border-color:#d9534f;background:#fbecea}
    .lr-short{display:flex;gap:8px}.lr-input{flex:1;color:var(--text,#1a1410);background:var(--surface-2,#f5f2ee);color-scheme:light;border:1.5px solid var(--border,#e3e1e6);border-radius:9px;padding:9px 12px;font:inherit;font-size:.92rem}
    .lr-input.lr-correct{border-color:#5fbf7e}.lr-input.lr-wrong{border-color:#d9534f}
    .lr-check,.lr-done,.lr-quiz-start,.lr-quiz-submit{background:var(--accent,#f5c518);color:#3a2c00;border:none;border-radius:9px;padding:9px 16px;font-weight:700;font-size:.85rem;cursor:pointer}
    .lr-reflect{display:flex;flex-direction:column;gap:8px;align-items:flex-start}
    .lr-q-explain{margin-top:10px;font-size:.86rem;color:var(--text-muted,#8a7868);border-top:1px dashed var(--border,#e3e1e6);padding-top:10px}
    .lr-quiz-card{border:1.5px solid var(--accent,#f5c518);border-radius:12px;padding:18px;text-align:center;background:linear-gradient(180deg,rgba(245,197,24,.06),transparent)}
    .lr-quiz-sub{font-size:.82rem;color:var(--text-muted,#8a7868);margin:4px 0 12px}
    .lr-quiz-result{margin-top:14px;font-size:1rem}
    `;
    const el = document.createElement("style");
    el.id = "lesson-render-styles";
    el.textContent = css;
    document.head.appendChild(el);
  }

  window.LessonRender = {
    html(blocks) { injectStyles(); return `<div class="lr-body">${(blocks || []).map(renderBlock).join("")}</div>`; },
    init,
    injectStyles,
    mdToHtml
  };
})();
