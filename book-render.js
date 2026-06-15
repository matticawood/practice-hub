/* ============================================================================
   book-render.js — shared renderer for Book Studio
   Turns a page's block array into a print-perfect A4 page. Used by both the
   Book Studio live preview and the PDF export (window.print). Everything is
   scoped under .br-page so it never collides with the dark studio chrome.

   Public API (window.BookRender):
     ensureStyles(doc)        inject fonts + page CSS once
     pageHTML(page, book)     -> '<div class="br-page">…</div>' (with placeholders)
     hydrate(rootEl)          render abcjs staves + keyboard SVGs inside rootEl
     keyboardSVG(cfg)         standalone keyboard SVG string
     BLOCКS                   block-type registry (for the editor palette)
   ============================================================================ */
(function (global) {
  "use strict";

  var FONTS_HREF = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&display=swap";
  var ABCJS_SRC  = "https://cdn.jsdelivr.net/npm/abcjs@6.4.4/dist/abcjs-basic-min.js";

  var CSS = [
    ".br-page{--ink:#1c1b19;--muted:#6f6b63;--faint:#9a958b;--gold:#caa413;--gold-bright:#f5c518;--gold-deep:#9c7d08;--cream:#faf7f0;--cream-line:#ece4d2;--rule:#e7e2d6;--serif:'Fraunces',Georgia,serif;--sans:'Inter',-apple-system,Segoe UI,sans-serif;",
    "width:210mm;min-height:297mm;background:#fffdf9;position:relative;padding:15mm 20mm 13mm;display:flex;flex-direction:column;box-sizing:border-box;font-family:var(--sans);color:var(--ink);-webkit-print-color-adjust:exact;print-color-adjust:exact}",
    ".br-page *{box-sizing:border-box}",
    /* running header */
    ".br-page .br-rh{display:flex;align-items:center;justify-content:space-between;border-bottom:1.5px solid var(--rule);padding-bottom:9px;margin-bottom:26px}",
    ".br-page .br-rh .br-brand{display:flex;align-items:center;gap:9px}",
    ".br-page .br-rh .br-mark{width:21px;height:21px;border-radius:5px;background:var(--ink);color:var(--gold-bright);font-family:var(--serif);font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;line-height:1}",
    ".br-page .br-rh .br-bk{font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);font-weight:600}",
    ".br-page .br-rh .br-pg{font-size:10px;letter-spacing:.12em;color:var(--faint);font-weight:600}",
    /* headings */
    ".br-page .br-eyebrow{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--gold-deep);font-weight:700;margin:0 0 6px}",
    ".br-page h1.br-title{font-family:var(--serif);font-weight:600;font-size:36px;letter-spacing:-.02em;line-height:1.02;margin:0 0 4px;color:#141312}",
    ".br-page .br-title-rule{width:54px;height:4px;border-radius:3px;background:var(--gold-bright);margin:11px 0 16px}",
    ".br-page .br-subheading{font-family:var(--serif);font-weight:600;font-size:17px;color:#141312;margin:20px 0 7px}",
    /* cover */
    ".br-page .br-cover{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;min-height:255mm;padding:8mm 0}",
    ".br-page .br-cover .br-cover-clef{width:64px;color:var(--gold);margin-bottom:14mm}",
    ".br-page .br-cover .br-cover-clef svg{width:100%;height:auto;display:block}",
    ".br-page .br-cover .br-cover-eyebrow{font-size:13px;letter-spacing:.34em;text-transform:uppercase;color:var(--gold-deep);font-weight:700;margin-bottom:16px}",
    ".br-page .br-cover h1.br-cover-title{font-family:var(--serif);font-weight:600;font-size:52px;line-height:1.04;letter-spacing:-.02em;color:#141312;margin:0;max-width:15ch}",
    ".br-page .br-cover .br-cover-rule{width:76px;height:4px;background:var(--gold-bright);border-radius:3px;margin:24px 0}",
    ".br-page .br-cover .br-cover-author{font-size:15px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink);font-weight:700;margin-top:14mm}",
    ".br-page .br-cover .br-cover-tag{font-family:var(--serif);font-style:italic;font-size:13px;color:var(--muted);margin-top:8px}",
    /* paragraph */
    ".br-page p.br-p{font-size:13px;line-height:1.55;margin:0 0 11px;color:#2b2925}",
    ".br-page .br-term{font-weight:700;color:var(--gold-deep)}",
    ".br-page .br-note-name{font-weight:800;color:var(--ink)}",
    /* concept callouts */
    ".br-page .br-concepts{display:flex;gap:14px;margin:2px 0 18px}",
    ".br-page .br-concept{flex:1;background:var(--cream);border:1px solid var(--cream-line);border-radius:14px;padding:16px 18px;display:flex;align-items:center;gap:15px}",
    ".br-page .br-concept .br-glyph{font-family:var(--serif);font-size:42px;line-height:.8;color:var(--gold);width:34px;text-align:center}",
    ".br-page .br-concept .br-lbl{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-bottom:3px}",
    ".br-page .br-concept .br-desc{font-size:13px;font-weight:500;color:#2b2925;line-height:1.3}",
    ".br-page .br-concept .br-desc-key{font-size:15px;font-weight:800;color:var(--gold-deep);margin-top:3px}",
    /* worked example */
    ".br-page .br-ex{display:flex;gap:20px;align-items:center;background:#fff;border:1px solid var(--rule);border-radius:16px;padding:14px 18px;margin-bottom:13px;box-shadow:0 1px 0 rgba(0,0,0,.02)}",
    ".br-page .br-scaletable{width:100%;border:1px solid var(--rule);border-radius:12px;overflow:hidden;margin:8px 0}",
    ".br-page .br-scalerow{display:flex;gap:14px;align-items:center;padding:2px 14px;border-top:1px solid var(--cream-line)}",
    ".br-page .br-scalerow:first-child{border-top:none}",
    ".br-page .br-scalerow:nth-child(even){background:var(--cream)}",
    ".br-page .br-scale-l{flex:1.45}",
    ".br-page .br-scale-r{flex:1;font-size:9px;line-height:1.5;color:var(--muted);font-variant-numeric:tabular-nums;letter-spacing:.04em}",
    ".br-page .br-scale-name{font-weight:800;color:var(--gold-deep);font-size:11px}",
    ".br-page .br-scale-sf{color:var(--muted);font-weight:600;font-size:9.5px}",
    ".br-page .br-scale-notes{margin-top:1px;font-size:9.5px;color:var(--ink);font-weight:500;letter-spacing:.02em}",
    ".br-page .br-scale-r b{color:var(--ink);font-weight:700}",
    ".br-page .br-deflist{margin:10px 0 6px;border:1px solid var(--rule);border-radius:12px;overflow:hidden}",
    ".br-page .br-defrow{display:flex;gap:16px;align-items:baseline;padding:5px 16px;border-top:1px solid var(--cream-line)}",
    ".br-page .br-defrow:first-child{border-top:none}",
    ".br-page .br-defrow:nth-child(even){background:var(--cream)}",
    ".br-page .br-defkey{flex:0 0 54px;font-weight:800;color:var(--gold-deep);font-size:14px}",
    ".br-page .br-defcell{flex:1;font-size:13px;color:var(--ink);font-weight:500}",
    ".br-page .br-ex.br-rev{flex-direction:row-reverse}",
    ".br-page .br-ex .br-ex-text{flex:1.05}",
    ".br-page .br-ex .br-ex-tag{display:inline-block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:#fff;background:var(--ink);padding:3px 9px;border-radius:20px;margin-bottom:9px}",
    ".br-page .br-ex .br-ex-text p{font-size:13px;margin:0;line-height:1.55;color:#2b2925}",
    ".br-page .br-ex .br-ex-visual{display:flex;flex-direction:column;align-items:center;gap:8px;width:208px;flex:none}",
    ".br-page .br-staff{min-height:58px;display:flex;align-items:center;justify-content:center}",
    ".br-page .br-staff svg{overflow:visible}",
    // note-name labels above/below notes (abcjs text annotations): brand sans, bold, gold
    ".br-page .br-staff text.abcjs-annotation{font-family:var(--sans)!important;font-weight:700!important;fill:var(--gold-deep)!important}",
    /* standalone notation / keyboard blocks centre on the page */
    ".br-page .br-block-center{display:flex;flex-direction:column;align-items:center;gap:6px;margin:4px 0 12px}",
    ".br-page .br-cap{font-size:11px;color:var(--muted);font-weight:600;text-align:center}",
    /* standalone notation runs full page width */
    ".br-page .br-notation{margin:6px 0 6px}",
    ".br-page .br-staff-full{width:100%;display:block}",
    ".br-page .br-staff-full svg{width:100%}",
    /* letter / note sequence strip (e.g. the repeating musical alphabet) */
    ".br-page .br-seq{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:center;gap:7px 12px;margin:16px 0 12px}",
    ".br-page .br-seq-g{display:inline-flex;gap:9px}",
    ".br-page .br-seq-it{font-family:var(--serif);font-weight:600;font-size:27px;color:var(--gold-deep);letter-spacing:.02em}",
    ".br-page .br-seq-sep{color:var(--faint);font-size:18px;font-weight:700;align-self:center}",
    ".br-page .br-seq-dots{color:var(--faint);font-size:22px;align-self:center;letter-spacing:.08em}",
    /* keyboard */
    ".br-page .br-kb{display:block}",
    ".br-page .br-kb .wk{fill:#fff;stroke:#cfc9bb;stroke-width:1}",
    ".br-page .br-kb .bk{fill:#23211d;stroke:#23211d}",
    ".br-page .br-kb .hi-w{fill:#fde7a6;stroke:var(--gold);stroke-width:1.4}",
    ".br-page .br-kb .hi-b{fill:var(--gold-bright);stroke:var(--gold-deep);stroke-width:1.2}",
    ".br-page .br-kb .klabel{font-family:var(--sans);font-weight:800;font-size:11px;fill:#1c1b19}",
    ".br-page .br-kb .klabel-on{font-family:var(--sans);font-weight:800;font-size:8px;fill:#1c1b19}",
    ".br-page .br-kb .klabel-on-dark{font-family:var(--sans);font-weight:700;font-size:7px;fill:#fff}",
    /* image */
    ".br-page .br-img{margin:6px 0 16px;text-align:center}",
    ".br-page .br-img img{max-width:100%;border-radius:10px}",
    ".br-page .br-img .br-cap{margin-top:6px}",
    /* spacer / divider */
    ".br-page .br-divider{height:1px;background:var(--rule);margin:14px 0}",
    /* footer */
    ".br-page .br-footer{margin-top:auto;padding-top:14px;border-top:1px solid var(--rule);display:flex;justify-content:space-between;align-items:center}",
    ".br-page .br-footer .br-site{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--faint);font-weight:600}",
    ".br-page .br-footer .br-ch{font-family:var(--serif);font-style:italic;font-size:11px;color:var(--muted)}"
  ].join("\n");

  // ── helpers ────────────────────────────────────────────────────────────────
  function esc(s){ return String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
  function attr(o){ return encodeURIComponent(JSON.stringify(o)); }
  function unattr(s){ try { return JSON.parse(decodeURIComponent(s)); } catch(e){ return {}; } }

  // Light inline markup so the owner can emphasise without raw HTML:
  //   **bold**   `note name`   [[term]] (gold key term)
  function inlineMarkup(text){
    var s = esc(text);
    s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    s = s.replace(/`([^`]+)`/g, '<span class="br-note-name">$1</span>');
    s = s.replace(/\[\[([^\]]+)\]\]/g, '<span class="br-term">$1</span>');
    return s;
  }

  // ── keyboard ─────────────────────────────────────────────────────────────────
  // cfg = { octaves:1, keys:[ {name:'A', label:'A', tone:'ref'|'target'}, ... ] }
  //   name: 'C'..'B' (white) or 'C#','D#','F#','G#','A#' (black)
  function keyboardSVG(cfg){
    cfg = cfg || {};
    var octaves = Math.max(1, Math.min(6, cfg.octaves || 1));
    var keys = cfg.keys || [];
    var base = (cfg.base != null) ? cfg.base : 4;   // scientific octave of the leftmost C
    var WHITE = ['C','D','E','F','G','A','B'];
    var BLACK = {0:'C#',1:'D#',3:'F#',4:'G#',5:'A#'};
    var ww=23, wh=76, bw=15, bh=48;
    var nW = WHITE.length * octaves;
    var W = ww*nW + 2, H = wh + 2;
    // tolerant match by letter; if a key spec carries a digit ("C4") it must match
    // that exact pitch (letter + scientific octave), so only ONE C lights up.
    function norm(s){ return String(s == null ? "" : s).replace(/[0-9\s]/g, "").toUpperCase(); }
    function find(name, sci){
      for (var i=0;i<keys.length;i++){
        var kn = String(keys[i].name == null ? "" : keys[i].name);
        if (/[0-9]/.test(kn)){ if (kn.replace(/\s/g,"").toUpperCase() === (name + sci).toUpperCase()) return keys[i]; }
        else if (norm(kn) === norm(name)) return keys[i];
      }
      return null;
    }
    var svg = '<svg class="br-kb" viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block" xmlns="http://www.w3.org/2000/svg">';
    var i, o, k;
    // white keys
    for (o=0;o<octaves;o++){
      for (i=0;i<7;i++){
        var wname = WHITE[i];
        var hit = find(wname, base+o);
        var x = 1 + (o*7+i)*ww;
        var fillCls = (hit && hit.tone !== "plain") ? "hi-w" : "wk";   // tone "plain" = labelled, not filled
        svg += '<rect class="'+fillCls+'" x="'+x+'" y="1" width="'+ww+'" height="'+wh+'" rx="3"/>';
      }
    }
    // white labels
    for (o=0;o<octaves;o++){
      for (i=0;i<7;i++){
        var wn = WHITE[i]; var h = find(wn, base+o);
        if (h && h.label){ var lx = 1+(o*7+i)*ww+ww/2; svg += '<text class="klabel" x="'+lx+'" y="'+(wh-9)+'" text-anchor="middle">'+esc(h.label)+'</text>'; }
      }
    }
    // black keys
    for (o=0;o<octaves;o++){
      for (k in BLACK){
        var idx = parseInt(k,10);
        var bname = BLACK[idx];
        var bh2 = find(bname, base+o);
        var bx = 1 + (o*7+idx+1)*ww - bw/2;
        var bcls = bh2 ? (bh2.tone === "plain" ? "bk" : "hi-b") : "bk";   // "plain" labels a dark key without the gold fill
        svg += '<rect class="'+bcls+'" x="'+bx+'" y="1" width="'+bw+'" height="'+bh+'" rx="2.5"/>';
        if (bh2 && bh2.label){
          var lcls = (bcls === "hi-b") ? "klabel-on" : "klabel-on-dark", cx = bx+bw/2;
          var parts = String(bh2.label).split("/");
          if (parts.length > 1){   // dual name e.g. "C#/Db" -> two stacked lines
            svg += '<text class="'+lcls+'" x="'+cx+'" y="'+(bh-16)+'" text-anchor="middle">'+esc(parts[0])+'</text>'
                 + '<text class="'+lcls+'" x="'+cx+'" y="'+(bh-7)+'" text-anchor="middle">'+esc(parts[1])+'</text>';
          } else {
            svg += '<text class="'+lcls+'" x="'+cx+'" y="'+(bh-8)+'" text-anchor="middle">'+esc(bh2.label)+'</text>';
          }
        }
      }
    }
    svg += '</svg>';
    return svg;
  }
  function kbWidth(oct){ return Math.max(1, Math.min(6, oct || 1)) * 7 * 23 + 2; }

  // ── notes <-> ABC ────────────────────────────────────────────────────────────
  // A note is { letter:'C'..'B', oct:4 (4 = the octave starting at middle C), acc:''|'#'|'b'|'n' }
  // ABC octave: uppercase letter = octave 4 (C = middle C); lowercase = octave 5; ' adds octaves
  // above 5; , subtracts octaves below 4.
  function pitchToAbc(n){
    if (!n || !n.letter) return "";
    var acc = n.acc === "#" ? "^" : n.acc === "b" ? "_" : n.acc === "n" ? "="
            : (n.acc === "x" || n.acc === "##") ? "^^" : n.acc === "bb" ? "__" : "";
    var L = String(n.letter).toUpperCase().slice(0, 1);
    var o = parseInt(n.oct, 10); if (isNaN(o)) o = 4;
    var s = (o >= 5) ? (L.toLowerCase() + "'".repeat(o - 5)) : (o === 4 ? L : (L + ",".repeat(4 - o)));
    return acc + s;
  }
  // an "event" is one beat position: a single note, or a chord {ch:[pitch,...]},
  // optionally carrying a "label" printed under that note. Old flat {letter,oct,acc}
  // entries still work (treated as a single-note event).
  function eventToAbc(ev, above){
    if (!ev) return "";
    var pitches = (ev.ch && ev.ch.length) ? ev.ch : (ev.letter ? [ev] : []);
    if (!pitches.length) return "";
    var lab = ev.label ? '"' + (above ? "^" : "_") + ev.label + '"' : "";
    var core = pitches.length > 1 ? ("[" + pitches.map(pitchToAbc).join("") + "]") : pitchToAbc(pitches[0]);
    return lab + core;
  }
  function notesToAbc(notes, above){ var s = (notes || []).map(function(e){ return eventToAbc(e, above); }).filter(Boolean).join(""); return s || "x8"; }

  // Treble/bass clef glyph paths lifted from abcjs, with transforms pre-computed so the
  // clef's reference line lands on our staff (lines at y 3,10,17,24,31; spacing 7).
  var CLEF_TREBLE = "M 14.69 7.832000000000008c 0.09 -0.09 0.24 -0.06 0.36 0c 0.12 0.09 0.57 0.6 0.96 1.11c 1.77 2.34 3.21 5.85 3.57 8.73c 0.21 1.56 0.03 3.27 -0.45 4.86c -0.69 2.31 -1.92 4.47 -4.23 7.44c -0.3 0.39 -0.57 0.72 -0.6 0.75c -0.03 0.06 0 0.15 0.18 0.78c 0.54 1.68 1.38 4.44 1.68 5.49l 0.09 0.42l 0.39 0c 1.47 0.09 2.76 0.51 3.96 1.29c 1.83 1.23 3.06 3.21 3.39 5.52c 0.09 0.45 0.12 1.29 0.06 1.74c -0.09 1.02 -0.33 1.83 -0.75 2.73c -0.84 1.71 -2.28 3.06 -4.02 3.72l -0.33 0.12l 0.03 1.26c 0 1.74 -0.06 3.63 -0.21 4.62c -0.45 3.06 -2.19 5.49 -4.47 6.21c -0.57 0.18 -0.9 0.21 -1.59 0.21c -0.69 0 -1.02 -0.03 -1.65 -0.21c -1.14 -0.27 -2.13 -0.84 -2.94 -1.65c -0.99 -0.99 -1.56 -2.16 -1.71 -3.54c -0.09 -0.81 0.06 -1.53 0.45 -2.13c 0.63 -0.99 1.83 -1.56 3 -1.53c 1.5 0.09 2.64 1.32 2.73 2.94c 0.06 1.47 -0.93 2.7 -2.37 2.97c -0.45 0.06 -0.84 0.03 -1.29 -0.09l -0.21 -0.09l 0.09 0.12c 0.39 0.54 0.78 0.93 1.32 1.26c 1.35 0.87 3.06 1.02 4.35 0.36c 1.44 -0.72 2.52 -2.28 2.97 -4.35c 0.15 -0.66 0.24 -1.5 0.3 -3.03c 0.03 -0.84 0.03 -2.94 0 -3c -0.03 0 -0.18 0 -0.36 0.03c -0.66 0.12 -0.99 0.12 -1.83 0.12c -1.05 0 -1.71 -0.06 -2.61 -0.3c -4.02 -0.99 -7.11 -4.35 -7.8 -8.46c -0.12 -0.66 -0.12 -0.99 -0.12 -1.83c 0 -0.84 0 -1.14 0.15 -1.92c 0.36 -2.28 1.41 -4.62 3.3 -7.29l 2.79 -3.6c 0.54 -0.66 0.96 -1.2 0.96 -1.23c 0 -0.03 -0.09 -0.33 -0.18 -0.69c -0.96 -3.21 -1.41 -5.28 -1.59 -7.68c -0.12 -1.38 -0.15 -3.09 -0.06 -3.96c 0.33 -2.67 1.38 -5.07 3.12 -7.08c 0.36 -0.42 0.99 -1.05 1.17 -1.14zm 2.01 4.71c -0.15 -0.3 -0.3 -0.54 -0.3 -0.54c -0.03 0 -0.18 0.09 -0.3 0.21c -2.4 1.74 -3.87 4.2 -4.26 7.11c -0.06 0.54 -0.06 1.41 -0.03 1.89c 0.09 1.29 0.48 3.12 1.08 5.22c 0.15 0.42 0.24 0.78 0.24 0.81c 0 0.03 0.84 -1.11 1.23 -1.68c 1.89 -2.73 2.88 -5.07 3.15 -7.53c 0.09 -0.57 0.12 -1.74 0.06 -2.37c -0.09 -1.23 -0.27 -1.92 -0.87 -3.12zm -2.94 20.7c -0.21 -0.72 -0.39 -1.32 -0.42 -1.32c 0 0 -1.2 1.47 -1.86 2.37c -2.79 3.63 -4.02 6.3 -4.35 9.3c -0.03 0.21 -0.03 0.69 -0.03 1.08c 0 0.69 0 0.75 0.06 1.11c 0.12 0.54 0.27 0.99 0.51 1.47c 0.69 1.38 1.83 2.55 3.42 3.42c 0.96 0.54 2.07 0.9 3.21 1.08c 0.78 0.12 2.04 0.12 2.94 -0.03c 0.51 -0.06 0.45 -0.03 0.42 -0.3c -0.24 -3.33 -0.72 -6.33 -1.62 -10.08c -0.09 -0.39 -0.18 -0.75 -0.18 -0.78c -0.03 -0.03 -0.42 0 -0.81 0.09c -0.9 0.18 -1.65 0.57 -2.22 1.14c -0.72 0.72 -1.08 1.65 -1.05 2.64c 0.06 0.96 0.48 1.83 1.23 2.58c 0.36 0.36 0.72 0.63 1.17 0.9c 0.33 0.18 0.36 0.21 0.42 0.33c 0.18 0.42 -0.18 0.9 -0.6 0.87c -0.18 -0.03 -0.84 -0.36 -1.26 -0.63c -0.78 -0.51 -1.38 -1.11 -1.86 -1.83c -1.77 -2.7 -0.99 -6.42 1.71 -8.19c 0.3 -0.21 0.81 -0.48 1.17 -0.63c 0.3 -0.09 1.02 -0.3 1.14 -0.3c 0.06 0 0.09 0 0.09 -0.03c 0.03 -0.03 -0.51 -1.92 -1.23 -4.26zm 3.78 7.41c -0.18 -0.03 -0.36 -0.06 -0.39 -0.06c -0.03 0 0 0.21 0.18 1.02c 0.75 3.18 1.26 6.3 1.5 9.09c 0.06 0.72 0 0.69 0.51 0.42c 0.78 -0.36 1.44 -0.96 1.98 -1.77c 1.08 -1.62 1.2 -3.69 0.3 -5.55c -0.81 -1.62 -2.31 -2.79 -4.08 -3.15z";
  var CLEF_BASS = "M 11.3 7.5100000000000025c 0.36 -0.03 1.65 0 2.13 0.03c 3.6 0.42 6.03 2.1 6.93 4.86c 0.27 0.84 0.36 1.5 0.36 2.58c 0 0.9 -0.03 1.35 -0.18 2.16c -0.78 3.78 -3.54 7.08 -8.37 9.96c -1.74 1.05 -3.87 2.13 -6.18 3.12c -0.39 0.18 -0.75 0.33 -0.81 0.36c -0.06 0.03 -0.15 0.06 -0.18 0.06c -0.15 0 -0.33 -0.18 -0.33 -0.33c 0 -0.15 0.06 -0.21 0.51 -0.48c 3 -1.77 5.13 -3.21 6.84 -4.74c 0.51 -0.45 1.59 -1.5 1.95 -1.95c 1.89 -2.19 2.88 -4.32 3.15 -6.78c 0.06 -0.42 0.06 -1.77 0 -2.19c -0.24 -2.01 -0.93 -3.63 -2.04 -4.71c -0.63 -0.63 -1.29 -1.02 -2.07 -1.2c -1.62 -0.39 -3.36 0.15 -4.56 1.44c -0.54 0.6 -1.05 1.47 -1.32 2.22l -0.09 0.21l 0.24 -0.12c 0.39 -0.21 0.63 -0.24 1.11 -0.24c 0.3 0 0.45 0 0.66 0.06c 1.92 0.48 2.85 2.55 1.95 4.38c -0.45 0.99 -1.41 1.62 -2.46 1.71c -1.47 0.09 -2.91 -0.87 -3.39 -2.25c -0.18 -0.57 -0.21 -1.32 -0.03 -2.28c 0.39 -2.25 1.83 -4.2 3.81 -5.19c 0.69 -0.36 1.59 -0.6 2.37 -0.69zm 11.58 2.52c 0.84 -0.21 1.71 0.3 1.89 1.14c 0.3 1.17 -0.72 2.19 -1.89 1.89c -0.99 -0.21 -1.5 -1.32 -1.02 -2.25c 0.18 -0.39 0.6 -0.69 1.02 -0.78zm 0 7.5c 0.84 -0.21 1.71 0.3 1.89 1.14c 0.21 0.87 -0.3 1.71 -1.14 1.89c -0.87 0.21 -1.71 -0.3 -1.89 -1.14c -0.21 -0.84 0.3 -1.71 1.14 -1.89z";

  var CLEF_C = "M 5.06 8.120000000000003l 0.09 -0.06l 1.92 0l 1.92 0l 0.09 0.06l 0.06 0.09l 0 14.85l 0 14.82l -0.06 0.09l -0.09 0.06l -1.92 0l -1.92 0l -0.09 -0.06l -0.06 -0.09l 0 -14.82l 0 -14.85zm 5.37 0c 0.09 -0.06 0.09 -0.06 0.57 -0.06c 0.45 0 0.45 0 0.54 0.06l 0.06 0.09l 0 7.14l 0 7.11l 0.09 -0.06c 0.18 -0.18 0.72 -0.84 0.96 -1.2c 0.3 -0.45 0.66 -1.17 0.84 -1.65c 0.36 -0.9 0.57 -1.83 0.6 -2.79c 0.03 -0.48 0.03 -0.54 0.09 -0.63c 0.12 -0.18 0.36 -0.21 0.54 -0.12c 0.18 0.09 0.21 0.15 0.24 0.66c 0.06 0.87 0.21 1.56 0.57 2.22c 0.51 1.02 1.26 1.68 2.22 1.92c 0.21 0.06 0.33 0.06 0.78 0.06c 0.45 0 0.57 0 0.84 -0.06c 0.45 -0.12 0.81 -0.33 1.08 -0.6c 0.57 -0.57 0.87 -1.41 0.99 -2.88c 0.06 -0.54 0.06 -3 0 -3.57c -0.21 -2.58 -0.84 -3.87 -2.16 -4.5c -0.48 -0.21 -1.17 -0.36 -1.77 -0.36c -0.69 0 -1.29 0.27 -1.5 0.72c -0.06 0.15 -0.06 0.21 -0.06 0.42c 0 0.24 0 0.3 0.06 0.45c 0.12 0.24 0.24 0.39 0.63 0.66c 0.42 0.3 0.57 0.48 0.69 0.72c 0.06 0.15 0.06 0.21 0.06 0.48c 0 0.39 -0.03 0.63 -0.21 0.96c -0.3 0.6 -0.87 1.08 -1.5 1.26c -0.27 0.06 -0.87 0.06 -1.14 0c -0.78 -0.24 -1.44 -0.87 -1.65 -1.68c -0.12 -0.42 -0.09 -1.17 0.09 -1.71c 0.51 -1.65 1.98 -2.82 3.81 -3.09c 0.84 -0.09 2.46 0.03 3.51 0.27c 2.22 0.57 3.69 1.8 4.44 3.75c 0.36 0.93 0.57 2.13 0.57 3.36c 0 1.44 -0.48 2.73 -1.38 3.81c -1.26 1.5 -3.27 2.43 -5.28 2.43c -0.48 0 -0.51 0 -0.75 -0.09c -0.15 -0.03 -0.48 -0.21 -0.78 -0.36c -0.69 -0.36 -0.87 -0.42 -1.26 -0.42c -0.27 0 -0.3 0 -0.51 0.09c -0.57 0.3 -0.81 0.9 -0.81 2.1c 0 1.23 0.24 1.83 0.81 2.13c 0.21 0.09 0.24 0.09 0.51 0.09c 0.39 0 0.57 -0.06 1.26 -0.42c 0.3 -0.15 0.63 -0.33 0.78 -0.36c 0.24 -0.09 0.27 -0.09 0.75 -0.09c 2.01 0 4.02 0.93 5.28 2.4c 0.9 1.11 1.38 2.4 1.38 3.84c 0 1.5 -0.3 2.88 -0.84 3.96c -0.78 1.59 -2.19 2.64 -4.17 3.15c -1.05 0.24 -2.67 0.36 -3.51 0.27c -1.83 -0.27 -3.3 -1.44 -3.81 -3.09c -0.18 -0.54 -0.21 -1.29 -0.09 -1.74c 0.15 -0.6 0.63 -1.2 1.23 -1.47c 0.36 -0.18 0.57 -0.21 0.99 -0.21c 0.42 0 0.63 0.03 1.02 0.21c 0.42 0.21 0.84 0.63 1.05 1.05c 0.18 0.36 0.21 0.6 0.21 0.96c 0 0.3 0 0.36 -0.06 0.51c -0.12 0.24 -0.27 0.42 -0.69 0.72c -0.57 0.42 -0.69 0.63 -0.69 1.08c 0 0.24 0 0.3 0.06 0.45c 0.12 0.21 0.3 0.39 0.57 0.54c 0.42 0.18 0.87 0.21 1.53 0.15c 1.08 -0.15 1.8 -0.57 2.34 -1.32c 0.54 -0.75 0.84 -1.83 0.99 -3.51c 0.06 -0.57 0.06 -3.03 0 -3.57c -0.12 -1.47 -0.42 -2.31 -0.99 -2.88c -0.27 -0.27 -0.63 -0.48 -1.08 -0.6c -0.27 -0.06 -0.39 -0.06 -0.84 -0.06c -0.45 0 -0.57 0 -0.78 0.06c -1.14 0.27 -2.01 1.17 -2.46 2.49c -0.21 0.57 -0.3 0.99 -0.33 1.65c -0.03 0.51 -0.06 0.57 -0.24 0.66c -0.12 0.06 -0.27 0.06 -0.39 0c -0.21 -0.09 -0.21 -0.15 -0.24 -0.75c -0.09 -1.92 -0.78 -3.72 -2.01 -5.19c -0.18 -0.21 -0.36 -0.42 -0.39 -0.45l -0.09 -0.06l 0 7.11l 0 7.14l -0.06 0.09c -0.09 0.06 -0.09 0.06 -0.54 0.06c -0.48 0 -0.48 0 -0.57 -0.06l -0.06 -0.09l 0 -14.82l 0 -14.85z";
  var CLEF_TFM = { treble:"translate(1,-16.5) scale(0.903)", bass:"translate(1,-3.5) scale(0.903)", alto:"translate(1,-3.5) scale(0.903)", tenor:"translate(1,3.5) scale(0.903)" };
  var CLEF_D   = { treble:CLEF_TREBLE, bass:CLEF_BASS, alto:CLEF_C, tenor:CLEF_C };
  function clefGlyphSVG(clef, leftPct){
    if (!CLEF_D[clef]) return "";
    return '<svg viewBox="0 -11 60 55" preserveAspectRatio="xMinYMid meet" style="position:absolute;left:'+leftPct+'%;top:0;width:48px;height:100%" xmlns="http://www.w3.org/2000/svg"><path d="'+CLEF_D[clef]+'" transform="'+CLEF_TFM[clef]+'" fill="#111"/></svg>';
  }
  // Several clefs along one full-width stave (e.g. the "types of clefs" figure).
  function clefStaveSVG(clefs){
    var gap=7,n=5,pad=3,lines="";
    for (var i=0;i<n;i++){ var y=pad+gap*i; lines += '<line x1="1" y1="'+y+'" x2="599" y2="'+y+'" stroke="#111" stroke-width="1"/>'; }
    var linesSvg = '<svg viewBox="0 -11 600 55" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%" xmlns="http://www.w3.org/2000/svg">'+lines+'</svg>';
    var overlays = clefs.map(function(c,i){ var l = clefs.length===1 ? 2 : (8 + i*(78/(clefs.length-1))); return clefGlyphSVG(c, l); }).join("");
    return '<div style="position:relative;width:100%;height:63px">'+linesSvg+overlays+'</div>';
  }

  // A full-width 5-line stave drawn directly (abcjs will not stretch an empty measure).
  // Lines stretch (preserveAspectRatio=none); the clef glyph is added at natural aspect.
  function emptyStaveSVG(clef){
    if (Array.isArray(clef)) return clefStaveSVG(clef);
    var gap = 7, n = 5, pad = 3, lines = "";
    for (var i = 0; i < n; i++){ var y = pad + gap * i; lines += '<line x1="1" y1="' + y + '" x2="599" y2="' + y + '" stroke="#111" stroke-width="1"/>'; }
    lines += '<line x1="598.5" y1="' + pad + '" x2="598.5" y2="' + (pad + gap * (n - 1)) + '" stroke="#111" stroke-width="2"/>';
    var hasClef = clef === "treble" || clef === "bass";
    var top = hasClef ? -11 : 0, vh = hasClef ? 55 : (pad * 2 + gap * (n - 1));
    // The lines stretch with the SVG width; draw the clef in its own non-stretching group.
    var clefPath = "";
    if (clef === "treble") clefPath = '<path d="' + CLEF_TREBLE + '" transform="translate(1,-16.5) scale(0.903)" fill="#111"/>';
    else if (clef === "bass") clefPath = '<path d="' + CLEF_BASS + '" transform="translate(1,-3.5) scale(0.903)" fill="#111"/>';
    // clef goes in a 0..vh tall overlay (absolute) so it keeps its aspect ratio over the stretched lines
    var lineSvg = '<svg viewBox="0 ' + top + ' 600 ' + vh + '" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%" xmlns="http://www.w3.org/2000/svg">' + lines + '</svg>';
    var clefSvg = clefPath ? '<svg viewBox="0 ' + top + ' 60 ' + vh + '" preserveAspectRatio="xMinYMid meet" style="position:absolute;left:0;top:0;width:60px;height:100%" xmlns="http://www.w3.org/2000/svg">' + clefPath + '</svg>' : "";
    return '<div style="position:relative;width:100%;height:' + (vh * (hasClef ? 1.15 : 1)) + 'px">' + lineSvg + clefSvg + '</div>';
  }
  function noteToAbc(n){ return pitchToAbc(n); }   // back-compat alias

  // ── notation (abcjs) ─────────────────────────────────────────────────────────
  // cfg = { abc | notes:[...], label:'A#', clef:'treble'|'bass', scale, staffwidth }
  function renderStaff(el, cfg){
    cfg = cfg || {};
    var hasEvents = !!(cfg.notes && cfg.notes.length);
    var rawAbc = cfg.abc || "";
    // truly-empty stave with NO clef -> draw plain full-width 5 lines (abcjs will not
    // stretch an empty measure). An empty stave WITH a clef falls through to abcjs so
    // the clef is drawn (e.g. "the treble clef looks like this").
    var isEmpty = !hasEvents && rawAbc.replace(/[xXyY0-9\s|\]]/g, "") === "";
    if (!global.ABCJS){ el.innerHTML = '<div style="font:11px sans-serif;color:#9a958b">…notation…</div>'; return; }
    var abc;
    if (isEmpty) {
      // Empty staves (blank lines, a lone clef, or the multi-clef showcase) render
      // through abcjs too — invisible spacers fill the width and abcjs draws/positions
      // every clef (incl. the alto/tenor C-clefs) at the SAME size as note staves.
      function abcClef(c){ return (!c || c === "none") ? "none stafflines=5" : c; }   // treble/bass/alto/tenor pass through
      var clefs0 = Array.isArray(cfg.clef) ? cfg.clef : [cfg.clef];
      var body;
      if (clefs0.length <= 1) {
        body = "y ".repeat(11);
      } else {
        body = "";
        for (var ci = 0; ci < clefs0.length; ci++) {
          if (ci > 0) body += "[K:C clef=" + abcClef(clefs0[ci]) + "] ";
          body += "y ".repeat(4);
        }
      }
      abc = "X:1\nL:1/1\nK:C clef=" + abcClef(clefs0[0]) + "\n" + body + "|]";
    } else if (hasEvents && cfg.fill) {
      // Full-width staves: spread the notes EVENLY edge-to-edge by interspersing a
      // fixed gap of invisible spacers between each note, then padding the line out to
      // a constant slot count so sparse staves still fill the width (abcjs will not
      // stretch a short line on its own). 1 note sits left like a single landmark.
      var ev = (cfg.notes || []).map(function(e){ return eventToAbc(e, cfg.labelsAbove); }).filter(Boolean);
      var k = ev.length, SLOTS = 13, MAXGAP = 4;           // constant total symbols => constant width (no wrap)
      var lead = (cfg.clef === "none") ? "y " : "";
      var spacers = Math.max(0, SLOTS - k);
      if (k <= 1) {
        abc = lead + (ev[0] || "x8") + (" y".repeat(spacers));
      } else {
        // Even gaps between notes, but capped: with only a few notes we keep a
        // comfortable gap and push the leftover slack to a TRAILING margin, so the
        // line still fills the width without flinging the last note to the barline.
        var gaps = k - 1, perGap = Math.min(MAXGAP, Math.floor(spacers / gaps));
        var trailing = spacers - perGap * gaps;
        abc = lead + ev[0];
        for (var gi = 0; gi < gaps; gi++) abc += " " + "y ".repeat(perGap) + ev[gi + 1];
        abc += " y".repeat(trailing);
      }
    } else {
      abc = hasEvents ? notesToAbc(cfg.notes, cfg.labelsAbove) : rawAbc;
      if (cfg.clef === "none" && hasEvents) abc = "y " + abc;   // clef-less left margin
    }
    var tune;
    if (/X:\s*\d/.test(abc)) {
      tune = abc;                                  // full ABC supplied
    } else {
      var ann = (!hasEvents && cfg.label) ? '"'+(cfg.labelsAbove?"^":"_")+cfg.label+'"' : '';   // events carry their own labels
      var clef = cfg.clef === 'bass' ? 'bass' : (cfg.clef === 'none' ? 'none stafflines=5' : 'treble');
      tune = "X:1\nL:1/1\nK:C clef="+clef+"\n"+ann+abc+"|]";
    }
    global.ABCJS.renderAbc(el, tune, {
      scale: cfg.scale || 1.28, staffwidth: cfg.staffwidth || 150,
      stretchlast: 1,   // fill the staff width even when the bar is empty/under-filled
      // add_classes so the note-name annotation text gets .abcjs-annotation, which we then
      // restyle to the brand font via CSS (abcjs 6.4.4 ignores the annotationfont option).
      paddingleft:0, paddingright:0, paddingtop:0, paddingbottom:6, add_classes:true
    });
    // Make the stave shrink to fit its container (never overflow), but never
    // upscale past its natural size: give it a viewBox + width:100% + max-width.
    var svg = el.querySelector("svg");
    if (svg){
      // abcjs LEFT-anchors note-name annotations at the note onset, so they sit left of the
      // notehead. Re-center each annotation over its nearest notehead.
      try {
        var notes = [].slice.call(el.querySelectorAll(".abcjs-note")).map(function(n){ var b=n.getBBox(); return {left:b.x, cx:b.x+b.width/2}; });
        if (notes.length){
          [].slice.call(el.querySelectorAll("text.abcjs-annotation")).forEach(function(a){
            var ax = parseFloat(a.getAttribute("x")) || 0, best = notes[0], bd = 1e9;
            notes.forEach(function(n){ var d = Math.abs(n.left - ax); if (d < bd){ bd = d; best = n; } });
            a.setAttribute("x", best.cx); a.setAttribute("text-anchor", "middle");
          });
        }
      } catch(e){}
      var w = parseFloat(svg.getAttribute("width")), h = parseFloat(svg.getAttribute("height"));
      if (w && h){
        if (!svg.getAttribute("viewBox")) svg.setAttribute("viewBox", "0 0 "+w+" "+h);
        svg.removeAttribute("width"); svg.removeAttribute("height");
        svg.style.width = "100%"; svg.style.maxWidth = w+"px"; svg.style.height = "auto"; svg.style.display = "block";
      }
    }
  }

  // ── block -> HTML ────────────────────────────────────────────────────────────
  function blockHTML(b){
    b = b || {};
    switch (b.type) {
      case "heading":
        return (b.eyebrow ? '<div class="br-eyebrow">'+esc(b.eyebrow)+'</div>' : '')
             + '<h1 class="br-title">'+inlineMarkup(b.title||"Untitled")+'</h1>'
             + (b.rule === false ? '' : '<div class="br-title-rule"></div>');
      case "paragraph":
        return '<p class="br-p">'+inlineMarkup(b.text||"")+'</p>';
      case "subheading":
        return '<div class="br-subheading">'+inlineMarkup(b.text||"")+'</div>';
      case "cover": {
        var clefSvg = '<svg viewBox="4 7 22 60" xmlns="http://www.w3.org/2000/svg"><path d="'+CLEF_TREBLE+'" fill="currentColor"/></svg>';
        return '<div class="br-cover">'
          + '<div class="br-cover-clef">'+clefSvg+'</div>'
          + (b.eyebrow ? '<div class="br-cover-eyebrow">'+esc(b.eyebrow)+'</div>' : '')
          + '<h1 class="br-cover-title">'+esc(b.title||"")+'</h1>'
          + '<div class="br-cover-rule"></div>'
          + (b.author ? '<div class="br-cover-author">'+esc(b.author)+'</div>' : '')
          + (b.tagline ? '<div class="br-cover-tag">'+esc(b.tagline)+'</div>' : '')
          + '</div>';
      }
      case "concepts": {
        var items = (b.items||[]).map(function(it){
          return '<div class="br-concept">'
               + '<div class="br-glyph">'+esc(it.glyph||"")+'</div>'
               + '<div><div class="br-lbl">'+esc(it.label||"")+'</div>'
               + '<div class="br-desc">'+inlineMarkup(it.desc||"")+'</div>'
               + (it.key ? '<div class="br-desc-key">'+esc(it.key)+'</div>' : '')
               + '</div></div>';
        }).join("");
        return '<div class="br-concepts">'+items+'</div>';
      }
      case "sequence": {
        var seqItems = b.items || [];
        var rep = Math.max(1, parseInt(b.repeat, 10) || 1);
        var dots = (b.ellipsis === false) ? "" : '<span class="br-seq-dots">…</span>';
        var groups = [];
        for (var r = 0; r < rep; r++)
          groups.push('<span class="br-seq-g">' + seqItems.map(function (it) { return '<span class="br-seq-it">' + esc(it) + '</span>'; }).join("") + '</span>');
        var inner = dots + groups.join('<span class="br-seq-sep">' + esc(b.sep || "·") + '</span>') + dots;
        return '<div class="br-seq">' + inner + '</div>' + (b.caption ? '<div class="br-cap">' + esc(b.caption) + '</div>' : "");
      }
      case "example": {
        var visual = "";
        if (b.notation && (b.notation.abc || b.notation.label || (b.notation.notes && b.notation.notes.length)))
          visual += '<div class="br-staff" data-br-staff="'+attr(b.notation)+'"></div>';
        if (b.keyboard && (b.keyboard.keys||[]).length)
          visual += '<div data-br-kb="'+attr(b.keyboard)+'" style="width:'+kbWidth(b.keyboard.octaves)+'px;max-width:100%"></div>';
        var rev = b.flip ? ' br-rev' : '';
        return '<div class="br-ex'+rev+'">'
             + '<div class="br-ex-text">'
             + (b.tag ? '<div class="br-ex-tag">'+esc(b.tag)+'</div>' : '')
             + '<p>'+inlineMarkup(b.text||"")+'</p></div>'
             + (visual ? '<div class="br-ex-visual">'+visual+'</div>' : '')
             + '</div>';
      }
      case "deflist":
        return '<div class="br-deflist">' + (b.rows||[]).map(function(r){
          return '<div class="br-defrow">' + r.map(function(c,i){
            return '<div class="' + (i===0 ? 'br-defkey' : 'br-defcell') + '">' + inlineMarkup(c) + '</div>';
          }).join("") + '</div>';
        }).join("") + '</div>';
      case "scaletable":
        return '<div class="br-scaletable">' + (b.rows||[]).map(function(r){
          return '<div class="br-scalerow">'
            + '<div class="br-scale-l"><span class="br-scale-name">'+esc(r.name)+'</span> <span class="br-scale-sf">'+esc(r.sf)+'</span>'
            + '<div class="br-scale-notes">'+esc(r.notes)+'</div></div>'
            + '<div class="br-scale-r"><b>RH</b> '+esc(r.rh)+'<br><b>LH</b> '+esc(r.lh)+'</div>'
            + '</div>';
        }).join("") + '</div>';
      case "notation":
        // standalone staves are full page width
        return '<div class="br-notation"><div class="br-staff br-staff-full" data-br-staff="'+attr({abc:b.abc,notes:b.notes,label:b.label,labelsAbove:b.labelsAbove,clef:b.clef,scale:b.scale||1.4,staffwidth:b.staffwidth||640,fill:true})+'"></div>'
             + (b.caption ? '<div class="br-cap">'+esc(b.caption)+'</div>' : '') + '</div>';
      case "keyboard":
        return '<div class="br-block-center"><div data-br-kb="'+attr({octaves:b.octaves||1,base:b.base,keys:b.keys||[]})+'" style="width:100%;max-width:'+kbWidth(b.octaves)+'px"></div>'
             + (b.caption ? '<div class="br-cap">'+esc(b.caption)+'</div>' : '') + '</div>';
      case "image":
        return '<div class="br-img">'+(b.src?'<img src="'+esc(b.src)+'" alt="'+esc(b.alt||"")+'">':'')
             + (b.caption ? '<div class="br-cap">'+esc(b.caption)+'</div>' : '') + '</div>';
      case "spacer":
        return '<div style="height:'+(parseInt(b.size,10)||16)+'px"></div>';
      case "divider":
        return '<div class="br-divider"></div>';
      default:
        return "";
    }
  }

  // ── page -> HTML ─────────────────────────────────────────────────────────────
  function pageHTML(page, book){
    page = page || {}; book = book || {};
    var meta = page.meta || {};
    var blocks = page.blocks || [];
    var head = (meta.showHeader === false) ? "" :
      '<div class="br-rh"><div class="br-brand"><div class="br-mark">'+esc(book.mark || "M")+'</div>'
      + '<div class="br-bk">'+esc(book.subtitle || book.title || "")+'</div></div>'
      + '<div class="br-pg">'+esc(meta.pageNumber || "")+'</div></div>';
    var foot = (meta.showFooter === false) ? "" :
      '<div class="br-footer"><div class="br-site">'+esc(meta.footerLeft || "matthewcawood.com")+'</div>'
      + '<div class="br-ch">'+esc(meta.footerRight || book.subtitle || "")+'</div></div>';
    var body = blocks.map(blockHTML).join("\n");
    return '<div class="br-page">'+head+body+foot+'</div>';
  }

  // ── hydrate placeholders (run after inserting pageHTML into the DOM) ──────────
  function hydrate(root){
    if (!root) return;
    root.querySelectorAll('[data-br-staff]').forEach(function(el){
      renderStaff(el, unattr(el.getAttribute('data-br-staff')));
    });
    root.querySelectorAll('[data-br-kb]').forEach(function(el){
      el.innerHTML = keyboardSVG(unattr(el.getAttribute('data-br-kb')));
    });
  }

  // ── one-time asset injection ─────────────────────────────────────────────────
  function ensureStyles(doc){
    doc = doc || document;
    if (!doc.getElementById('br-fonts')){
      var l = doc.createElement('link'); l.id='br-fonts'; l.rel='stylesheet'; l.href=FONTS_HREF; doc.head.appendChild(l);
    }
    if (!doc.getElementById('br-css')){
      var s = doc.createElement('style'); s.id='br-css'; s.textContent = CSS; doc.head.appendChild(s);
    }
    if (!global.ABCJS && !doc.getElementById('br-abcjs')){
      var sc = doc.createElement('script'); sc.id='br-abcjs'; sc.src=ABCJS_SRC; doc.head.appendChild(sc);
    }
  }

  // block registry for the editor palette (label + factory for a blank block)
  var BLOCKS = [
    { type:"heading",   label:"Heading",       make:function(){ return { type:"heading", eyebrow:"", title:"New heading" }; } },
    { type:"subheading",label:"Sub-heading",   make:function(){ return { type:"subheading", text:"Sub-heading" }; } },
    { type:"paragraph", label:"Paragraph",     make:function(){ return { type:"paragraph", text:"" }; } },
    { type:"cover",     label:"Cover",         make:function(){ return { type:"cover", eyebrow:"", title:"Book Title", author:"Matthew Cawood", tagline:"" }; } },
    { type:"concepts",  label:"Concept cards", make:function(){ return { type:"concepts", items:[{glyph:"#",label:"A Sharp",desc:"looks like a hashtag",key:"1 note up"}] }; } },
    { type:"example",   label:"Worked example",make:function(){ return { type:"example", tag:"Example", text:"", notation:{abc:"^C",label:"C#"}, keyboard:{octaves:1,keys:[{name:"C",label:"C",tone:"ref"},{name:"C#",label:"C#",tone:"target"}]} }; } },
    { type:"notation",  label:"Notation",      make:function(){ return { type:"notation", notes:[{letter:"C",oct:4,acc:""}], clef:"treble", label:"", caption:"" }; } },
    { type:"sequence",  label:"Letter sequence",make:function(){ return { type:"sequence", items:["A","B","C","D","E","F","G"], repeat:3, sep:"·", caption:"" }; } },
    { type:"keyboard",  label:"Keyboard",      make:function(){ return { type:"keyboard", octaves:1, keys:[{name:"C",label:"C",tone:"ref"}], caption:"" }; } },
    { type:"image",     label:"Image",         make:function(){ return { type:"image", src:"", caption:"" }; } },
    { type:"spacer",    label:"Spacer",        make:function(){ return { type:"spacer", size:16 }; } },
    { type:"divider",   label:"Divider",       make:function(){ return { type:"divider" }; } }
  ];

  global.BookRender = {
    FONTS_HREF: FONTS_HREF, CSS: CSS, BLOCKS: BLOCKS,
    ensureStyles: ensureStyles, pageHTML: pageHTML, blockHTML: blockHTML,
    hydrate: hydrate, keyboardSVG: keyboardSVG, inlineMarkup: inlineMarkup, esc: esc,
    notesToAbc: notesToAbc, noteToAbc: noteToAbc, pitchToAbc: pitchToAbc
  };
})(typeof window !== "undefined" ? window : this);
