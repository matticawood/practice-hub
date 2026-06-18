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
    ".br-page .br-level{margin:2px 0 6px}",
    ".br-page .br-level-ey{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--gold-deep);font-weight:700;margin-bottom:4px}",
    ".br-page .br-level-d{font-size:13.5px;line-height:1.45;color:#4f4a42;font-weight:500}",
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
    ".br-page .br-concept{flex:1;min-width:0;background:var(--cream);border:1px solid var(--cream-line);border-radius:14px;padding:16px 16px;display:flex;align-items:center;gap:13px}",
    ".br-page .br-concept .br-glyph{font-family:var(--serif);font-size:42px;line-height:.8;color:var(--gold);width:34px;text-align:center}",
    ".br-page .br-concept .br-lbl{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-weight:700;margin-bottom:3px}",
    ".br-page .br-concept .br-desc{font-size:13px;font-weight:500;color:#2b2925;line-height:1.3}",
    ".br-page .br-concept .br-desc-key{font-size:15px;font-weight:800;color:var(--gold-deep);margin-top:3px}",
    /* vertical variant (glyph stacked above the text) — for many narrow cards where a side-by-side
       label would overflow. Text gets the full card width. */
    ".br-page .br-concepts-v .br-concept{flex-direction:column;align-items:center;text-align:center;gap:4px;padding:13px 8px}",
    ".br-page .br-concepts-v .br-glyph{width:auto;margin-bottom:2px}",
    ".br-page .br-concepts-v .br-lbl{font-size:9.5px;letter-spacing:.06em;margin-bottom:1px}",
    ".br-page .br-concepts-v .br-desc{font-size:12px}",
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
    // NOT every annotation is a note label. Octave markings (8va/8vb) read as proper italic
    // music symbols; descriptive asides (e.g. "(sounds like)") read as a quiet italic note.
    // Classified by content in renderStaff -> extra class wins over the bold-gold base rule.
    ".br-page .br-staff text.abcjs-annotation.br-ann-oct{font-family:var(--serif)!important;font-weight:500!important;font-style:italic!important;fill:var(--ink)!important}",
    ".br-page .br-staff text.abcjs-annotation.br-ann-desc{font-family:var(--sans)!important;font-weight:400!important;font-style:italic!important;fill:var(--muted)!important}",
    // dynamic-direction words (cresc./dim./decresc.) read as proper italic music text; combined
    // dynamics like fp/sf that abcjs can't render as a decoration get the italic-bold dynamics look.
    ".br-page .br-staff text.abcjs-annotation.br-ann-dynword{font-family:var(--serif)!important;font-weight:500!important;font-style:italic!important;fill:var(--ink)!important}",
    ".br-page .br-staff text.abcjs-annotation.br-ann-dyn{font-family:var(--serif)!important;font-weight:700!important;font-style:italic!important;fill:var(--ink)!important}",
    // count-overlay numbers: match abcjs ^-annotations (same font + 16px + gold, no stroke)
    ".br-page .br-staff text.br-count{font-family:var(--sans);font-weight:700;fill:var(--gold-deep);stroke:none}",
    // glissando label: quiet italic serif, riding the gliss line
    ".br-page .br-staff text.br-gliss-lab{font-family:var(--serif)!important;font-style:italic!important;fill:var(--ink)!important;stroke:none}",
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
    /* kbgrid: worksheet grid of small keyboards + a prompt/answer per cell */
    ".br-page .br-kbg-grid{display:grid;gap:5px 7px;margin:8px 0 3px}",
    ".br-page .br-kbg-cell{border:1px solid var(--rule);border-radius:8px;padding:6px 9px 9px;background:#fff;display:flex;flex-direction:column;gap:11px}",
    ".br-page .br-kbg-kb{width:100%;max-width:236px;margin:0 auto}",
    ".br-page .br-kbg-foot{display:flex;align-items:flex-end;gap:7px}",
    ".br-page .br-kbg-tag{font-size:10.5px;color:var(--muted);line-height:1.2;white-space:nowrap}",
    ".br-page .br-kbg-line{flex:1;height:15px;border-bottom:1.5px solid var(--cream-line)}",
    ".br-page .br-kbg-ans{font-family:var(--serif);font-weight:700;font-size:19px;color:var(--gold-deep);line-height:1}",
    /* ordered list (intro steps) */
    ".br-page .br-ol{list-style:none;margin:12px 0 14px;padding:0;display:flex;flex-direction:column;gap:9px}",
    ".br-page .br-ol-li{display:flex;align-items:flex-start;gap:13px}",
    ".br-page .br-ol-n{flex:none;width:25px;height:25px;border-radius:50%;background:var(--cream);border:1.5px solid var(--gold);color:var(--gold-deep);font-family:var(--serif);font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center}",
    ".br-page .br-ol-t{font-size:13.5px;line-height:1.5;color:#2b2925;padding-top:3px}",
    /* part divider (full page, vertically centred) */
    ".br-page .br-partdiv{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;min-height:250mm}",
    ".br-page .br-partdiv .br-pd-ey{font-size:13px;letter-spacing:.34em;text-transform:uppercase;color:var(--gold-deep);font-weight:700}",
    ".br-page .br-partdiv .br-pd-rule{width:76px;height:4px;background:var(--gold-bright);border-radius:3px;margin:22px 0}",
    ".br-page .br-partdiv h1.br-pd-title{font-family:var(--serif);font-weight:600;font-size:48px;line-height:1.04;letter-spacing:-.02em;color:#141312;margin:0}",
    ".br-page .br-partdiv .br-pd-sub{font-size:14px;line-height:1.6;color:var(--muted);margin-top:16px;max-width:42ch}",
    /* scale fill-in worksheet: root _ _ _ _ _ _ | root */
    ".br-page .br-sf-grid{display:grid;gap:9px;margin:10px 0 4px}",
    ".br-page .br-sf-cell{border:1px solid var(--rule);border-radius:10px;background:#fff;padding:13px 16px;display:flex;align-items:center;flex-wrap:nowrap;gap:9px}",
    ".br-page .br-sf-root{font-family:var(--serif);font-weight:700;font-size:22px;color:var(--ink);line-height:1;flex:none}",
    ".br-page .br-sf-bl{flex:1;min-width:13px;height:0;border-bottom:1.5px solid var(--cream-line);align-self:flex-end;margin-bottom:5px}",
    ".br-page .br-sf-a{font-family:var(--serif);font-weight:700;font-size:20px;color:var(--gold-deep);line-height:1;flex:1;text-align:center}",
    ".br-page .br-sf-bar{color:var(--faint);font-weight:600;font-size:20px;flex:none}",
    /* reference / fill-in table: bordered grid, header + rows */
    ".br-page .br-rt{display:grid;border:1px solid var(--rule);border-radius:12px;overflow:hidden;margin:8px 0;font-variant-numeric:tabular-nums}",
    ".br-page .br-rt-h{background:var(--cream);font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-weight:700;padding:6px 13px;border-bottom:1px solid var(--rule)}",
    ".br-page .br-rt-c{padding:5px 13px;border-bottom:1px solid var(--cream-line);display:flex;align-items:center;gap:7px;min-height:24px}",
    ".br-page .br-rt-alt{background:var(--cream)}",
    ".br-page .br-rt-name{font-family:var(--serif);font-weight:700;font-size:17px;color:var(--gold-deep);line-height:1.05}",
    ".br-page .br-rt-notes{font-weight:600;font-size:12.5px;color:var(--ink);letter-spacing:.05em}",
    ".br-page .br-rt-blank{flex:1;min-width:13px;height:0;border-bottom:1.5px solid var(--cream-line);align-self:flex-end;margin-bottom:6px}",
    ".br-page .br-rt-ansv{font-family:var(--serif);font-weight:700;font-size:15px;color:var(--gold-deep)}",
    ".br-page .br-rtsf{display:flex;align-items:center;gap:5px;flex:1}",
    ".br-page .br-rtsf-r{font-family:var(--serif);font-weight:700;font-size:15px;color:var(--ink);flex:none}",
    ".br-page .br-rtsf .br-sf-bl{margin-bottom:4px}",
    ".br-page .br-rtsf .br-sf-a{font-size:12.5px;font-weight:700}",
    /* draw-a-line matching */
    ".br-page .br-match{margin:16px 0 4px}",
    ".br-page .br-match-row{display:flex;align-items:center;justify-content:space-between;margin:0 0 15px}",
    ".br-page .br-match-l,.br-page .br-match-r{display:flex;align-items:center;gap:12px;font-family:var(--serif);font-weight:700;font-size:17px;color:var(--ink)}",
    ".br-page .br-match-r{flex-direction:row-reverse}",
    ".br-page .br-match-dot{width:9px;height:9px;border-radius:50%;border:1.5px solid var(--gold-deep);background:var(--cream);flex:none}",
    /* circle-the-answer exercise */
    ".br-page .br-cp{border:1px solid var(--rule);border-radius:12px;overflow:hidden;margin:8px 0}",
    ".br-page .br-cp-row{display:flex;gap:14px;align-items:center;padding:7px 15px;border-top:1px solid var(--cream-line)}",
    ".br-page .br-cp-row:first-child{border-top:none}",
    ".br-page .br-cp-row:nth-child(even){background:var(--cream)}",
    ".br-page .br-cp-notes{flex:0 0 32%;font-family:var(--serif);font-weight:700;font-size:23px;color:var(--ink);letter-spacing:.02em}",
    ".br-page .br-cp-prose{flex:0 0 46%;font-size:12px;line-height:1.4;color:#2b2925}",
    ".br-page .br-cp-opts{flex:1;display:grid;gap:4px 13px}",
    ".br-page .br-cp-opt{font-size:11.5px;color:var(--ink);font-weight:600;padding:2px 8px;border-radius:20px;justify-self:start}",
    ".br-page .br-cp-opt.br-cp-on{color:var(--gold-deep);font-weight:800;box-shadow:0 0 0 1.6px var(--gold) inset;background:#fff}",
    /* keyboard quiz (semitones page) */
    ".br-page .br-kbq{display:grid;gap:6px;margin:8px 0 3px}",
    ".br-page .br-kbq-cell{border:1px solid var(--rule);border-radius:10px;background:#fff;padding:6px 12px;display:flex;gap:14px;align-items:center}",
    ".br-page .br-kbq-kb{flex:0 0 148px;max-width:148px}",
    ".br-page .br-kbq-qs{flex:1;display:flex;flex-direction:column;gap:4px}",
    ".br-page .br-kbq-q{font-size:10.5px;color:var(--muted);line-height:1.25;display:flex;align-items:baseline;gap:8px}",
    ".br-page .br-kbq-q .br-kbq-line{flex:0 0 64px;border-bottom:1.5px solid var(--cream-line);height:13px}",
    ".br-page .br-kbq-q .br-kbq-a{font-family:var(--serif);font-weight:700;color:var(--gold-deep);font-size:14px}",
    /* playing-by-ear callout (tie a concept back to ear-playing) */
    ".br-page .br-callout{background:var(--cream);border:1px solid var(--cream-line);border-left:4px solid var(--gold);border-radius:12px;padding:13px 16px 14px;margin:16px 0 4px}",
    ".br-page .br-callout-lbl{font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold-deep);font-weight:700;margin-bottom:5px}",
    ".br-page .br-callout-txt{font-size:13px;line-height:1.55;color:#2b2925}",
    ".br-page .br-callout-txt p{margin:0 0 7px}",
    ".br-page .br-callout-txt p:last-child{margin:0}",
    /* image */
    ".br-page .br-img{margin:6px 0 16px;text-align:center}",
    ".br-page .br-img img{max-width:100%;border-radius:10px}",
    ".br-page .br-img-full{margin:0;text-align:center}",
    ".br-page .br-img-full img{width:100%;max-width:100%;border-radius:0}",
    /* distribute the exercise images evenly down the leftover vertical space */
    ".br-page .br-musicspread{flex:1 1 auto;display:flex;flex-direction:column;justify-content:space-between;align-items:stretch;width:100%}",
    ".br-page .br-musicspread .br-img-full{margin:0;width:100%}",
    /* exercise row: house-style number in the left margin, pinned to the staff (brace) centre */
    ".br-page .br-exrow{position:relative;padding-left:40px;width:100%}",
    ".br-page .br-exrow .br-exnum{position:absolute;left:0;top:50%;width:30px;text-align:right;transform:translateY(-50%);font-family:var(--serif);font-weight:600;font-size:21px;line-height:1;color:var(--gold-deep);font-variant-numeric:tabular-nums}",
    ".br-page .br-exrow .br-img-full{width:100%}",
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
    // A slur or phrase mark ( ... ) bows well above or below the notes; reserve vertical headroom
    // so the arc stays INSIDE the SVG box (which is overflow:visible) instead of spilling out and
    // colliding with the paragraph below. Done natively via abcjs padding so the box itself grows —
    // browser-independent, unlike measuring slur geometry after render (getBBox/getBoundingClientRect
    // disagree across browsers for curved slur paths).
    var hasArc = /\(/.test(tune);
    global.ABCJS.renderAbc(el, tune, {
      scale: cfg.scale || 1.28, staffwidth: cfg.staffwidth || 150,
      stretchlast: 1,   // fill the staff width even when the bar is empty/under-filled
      // add_classes so the note-name annotation text gets .abcjs-annotation, which we then
      // restyle to the brand font via CSS (abcjs 6.4.4 ignores the annotationfont option).
      // count rows sit above the staff (30); slur/phrase staves get headroom both sides.
      paddingleft:0, paddingright:0,
      paddingtop:(cfg.navArrows && cfg.navArrows.length ? 68 : (cfg.count && cfg.count.length ? 30 : (hasArc ? 20 : (cfg.rolls && cfg.rolls.length ? 12 : 0)))),
      paddingbottom:(cfg.navArrows && cfg.navArrows.length ? 34 : (hasArc ? 24 : (cfg.rolls && cfg.rolls.length ? 14 : 6))),
      add_classes:true
    });
    // Make the stave shrink to fit its container (never overflow), but never
    // upscale past its natural size: give it a viewBox + width:100% + max-width.
    var svg = el.querySelector("svg");
    if (svg){
      // abcjs left-anchors note-name annotations at the note onset, so they sit ~half a
      // notehead left of centre. Setting the <text> x does NOT move them (abcjs puts the
      // glyph in a child <tspan> with its own x), and notehead/annotation live in different
      // local coordinate spaces. So measure both centres in SCREEN pixels (honours every
      // transform), match each label to its nearest notehead, and shift it with a translate
      // in USER units (dx scales with the stave, so it survives the later viewBox resize).
      try {
        var heads = [].slice.call(el.querySelectorAll(".abcjs-notehead")).map(function(n){ var r=n.getBoundingClientRect(); return r.left+r.width/2; });
        if (heads.length){
          [].slice.call(el.querySelectorAll("text.abcjs-annotation")).forEach(function(a){
            // only re-center short note-name / count labels; words like cresc./dim./8va or phrases
            // are left-anchored at their beat by abcjs and must stay put (centering them on the
            // nearest notehead drags a wide word sideways).
            var tb=(a.textContent||"").trim().replace(/\s+/g,"");
            if (!(/^[A-Ga-g](##|#|bb|b|x|n)?\d*$/.test(tb) || /^([0-9]+|&)$/.test(tb))) return;
            var ar=a.getBoundingClientRect(), ac=ar.left+ar.width/2;
            var best=heads[0], bd=1e9; heads.forEach(function(h){ var d=Math.abs(h-ac); if(d<bd){ bd=d; best=h; } });
            var ctm=a.getScreenCTM(); if(!ctm||!ctm.a) return;
            var dx=(best-ac)/ctm.a;
            a.setAttribute("transform", (a.getAttribute("transform")||"")+" translate("+dx+",0)");
          });
        }
      } catch(e){}
      // Classify annotations so non-labels don't get the bold-gold note-label style:
      // octave markings (8va/8vb/15ma/15mb) -> italic music symbol; anything with a space
      // or parentheses (e.g. "(sounds like)") -> quiet italic aside. Plain note names stay.
      try {
        [].slice.call(el.querySelectorAll("text.abcjs-annotation")).forEach(function(a){
          var t = (a.textContent||"").trim(), bare = t.replace(/\s+/g,"");
          if (/^(8va|8vb|15ma|15mb|8|15)$/i.test(bare)) a.classList.add("br-ann-oct");
          else if (/^(cresc|dim|decresc|decres|rit|ritard|rall|accel|poco)\.?$/i.test(bare)) a.classList.add("br-ann-dynword");
          else if (/^(fp|sf|sfp|fz|rf|rfz|pf)$/i.test(bare)) a.classList.add("br-ann-dyn");
          else if (/^fine$/i.test(bare) || /\s/.test(t) || /[()]/.test(t)) a.classList.add("br-ann-desc");
        });
      } catch(e){}
      // a hairpin (.abcjs-dynamics, drawn well below the staff) reads as part of the same
      // crescendo/diminuendo as the cresc./dim. word, so lift it up in line with that text.
      try {
        var hps = el.querySelectorAll(".abcjs-dynamics");
        var wordEl = el.querySelector("text.abcjs-annotation.br-ann-dynword");
        if (hps.length && wordEl){
          var wb2 = wordEl.getBBox(), wc = wb2.y + wb2.height/2;
          [].slice.call(hps).forEach(function(h){
            var hb = h.getBBox(), hc = hb.y + hb.height/2;
            h.setAttribute("transform", (h.getAttribute("transform")||"") + " translate(0," + (wc - hc) + ")");
          });
        }
      } catch(e){}
      // abcjs can't draw a combined dynamic like "fp" (only single f/p/etc.). Writing !f!!p! stacks
      // the two glyphs on the same x, so spread the official glyphs side by side into "fp".
      try {
        var glyphs = [].slice.call(el.querySelectorAll(".abcjs-dynamics")).filter(function(d){ try{var b=d.getBBox(); return b.width<30 && b.height>8;}catch(e){return false;} });
        for (var gi=0; gi<glyphs.length-1; gi++){
          var ga=glyphs[gi].getBBox(), gb=glyphs[gi+1].getBBox();
          if (Math.abs((ga.x+ga.width/2)-(gb.x+gb.width/2)) < 12){
            var ctr = ((ga.x+ga.width/2)+(gb.x+gb.width/2))/2, tot = ga.width+gb.width-7;
            var axn = ctr - tot/2, bxn = axn + ga.width - 7;
            glyphs[gi].setAttribute("transform", (glyphs[gi].getAttribute("transform")||"") + " translate("+(axn-ga.x)+",0)");
            glyphs[gi+1].setAttribute("transform", (glyphs[gi+1].getAttribute("transform")||"") + " translate("+(bxn-gb.x)+",0)");
            gi++;
          }
        }
      } catch(e){}
      // thinDoubleBar: a volta (2nd-time ending) can only be CLOSED in abcjs by a double bar
      // (||), which then prints two lines. When the music just continues afterwards we want a
      // plain single barline there, so drop one line of any thin-thin double bar (leaves the
      // final |] thin+thick and repeat bars untouched — those have a thick line or dots).
      if (cfg.thinDoubleBar){
        try {
          [].slice.call(el.querySelectorAll(".abcjs-bar")).forEach(function(b){
            var paths=[].slice.call(b.querySelectorAll("path"));
            if (paths.length===2){
              var w0=paths[0].getBoundingClientRect().width, w1=paths[1].getBoundingClientRect().width;
              if (w0<2 && w1<2) paths[1].parentNode.removeChild(paths[1]);   // thin-thin -> single
            }
          });
        } catch(e){}
      }
      // codaWords: abcjs stacks "^" text annotations (D.C. al Coda / D.S. al Coda / To Coda)
      // high above the staff, well above the segno/coda glyphs (which sit just above the top
      // line). Pull those words down to sit at the same height as the symbols.
      if (cfg.codaWords){
        try {
          var cwctm = svg.getScreenCTM();
          if (cwctm && cwctm.d){
            var thinH = [].slice.call(svg.querySelectorAll("path")).map(function(p){ var r=p.getBoundingClientRect(); return {top:r.top, w:r.width/cwctm.a, h:r.height/cwctm.d}; }).filter(function(o){ return o.h<3 && o.w>40; });
            if (thinH.length){
              var topLineScreen = Math.min.apply(null, thinH.map(function(o){ return o.top; }));
              var gapScreen = 9 * cwctm.d;   // sit ~9 staff-units above the top line (segno/coda height)
              [].slice.call(el.querySelectorAll("text.abcjs-annotation")).forEach(function(a){
                if (!/coda|fine|d\.c\.|d\.s\./i.test(a.textContent||"")) return;
                var actm=a.getScreenCTM(); if(!actm||!actm.d) return;
                var r=a.getBoundingClientRect();
                var dyScreen = (topLineScreen - gapScreen) - r.bottom;
                a.setAttribute("transform",(a.getAttribute("transform")||"")+" translate(0,"+(dyScreen/actm.d).toFixed(1)+")");
              });
            }
          }
        } catch(e){}
      }
      // symbolsOverBarline: segno/coda glyphs are conventionally centred ON a barline, but abcjs
      // attaches them to a note (just right of the barline). Shift each above-staff decoration
      // glyph left so it sits over the barline immediately before it.
      if (cfg.symbolsOverBarline){
        try {
          var sob = svg.getScreenCTM();
          if (sob && sob.d){
            var barXs = [].slice.call(el.querySelectorAll(".abcjs-bar")).map(function(b){ var r=b.getBoundingClientRect(); return r.left+r.width/2; });
            var sLines = [].slice.call(svg.querySelectorAll("path")).map(function(p){ var r=p.getBoundingClientRect(); return {top:r.top, w:r.width/sob.a, h:r.height/sob.d}; }).filter(function(o){ return o.h<3 && o.w>40; });
            var topY = sLines.length ? Math.min.apply(null, sLines.map(function(o){ return o.top; })) : 0;
            [].slice.call(el.querySelectorAll(".abcjs-note path")).forEach(function(p){
              if (p.getAttribute("class")) return;                    // notehead/stem are classed
              var r=p.getBoundingClientRect(), w=r.width/sob.a, h=r.height/sob.d;
              if (w<8 || w>30 || h<14 || h>40) return;                // size of a segno/coda glyph
              if (r.bottom > topY) return;                            // must sit above the staff
              var cx=r.left+r.width/2, target=null;
              barXs.forEach(function(bx){ if (bx < cx && (target===null || bx>target)) target=bx; });
              if (target===null) return;
              var pctm=p.getScreenCTM(); if(!pctm||!pctm.a) return;
              p.setAttribute("transform",(p.getAttribute("transform")||"")+" translate("+((target-cx)/pctm.a).toFixed(1)+",0)");
            });
            // also centre the To Coda / D.S. al Coda / D.C. al Coda WORDS over the barline at the
            // start of their bar (like the symbols). Match only "...Coda" text (leaves al Fine alone).
            [].slice.call(el.querySelectorAll("text.abcjs-annotation")).forEach(function(a){
              var atxt=(a.textContent||"");                     // centre coda words + the lone "Fine" (not "al Fine")
              if (!(/coda/i.test(atxt) || /^fine$/i.test(atxt.replace(/\s+/g,"")))) return;
              var r=a.getBoundingClientRect(), cx=r.left+r.width/2, target=null;
              barXs.forEach(function(bx){ if (bx < r.left && (target===null || bx>target)) target=bx; });
              if (target===null) return;
              var actm=a.getScreenCTM(); if(!actm||!actm.a) return;
              a.setAttribute("transform",(a.getAttribute("transform")||"")+" translate("+((target-cx)/actm.a).toFixed(1)+",0)");
            });
            // "D.C. al Fine" / "D.S. al Fine" belong at the very END of the piece: right-align them
            // to just inside the final barline so they don't overflow off the right edge.
            var lastBar = barXs.length ? Math.max.apply(null, barXs) : null;
            if (lastBar!==null){
              [].slice.call(el.querySelectorAll("text.abcjs-annotation")).forEach(function(a){
                if (!/al\s*fine/i.test(a.textContent||"")) return;
                var r=a.getBoundingClientRect(), actm=a.getScreenCTM(); if(!actm||!actm.a) return;
                a.setAttribute("transform",(a.getAttribute("transform")||"")+" translate("+(((lastBar-12)-r.right)/actm.a).toFixed(1)+",0)");
              });
            }
          }
        } catch(e){}
      }
      // navArrows: numbered directional arrows over/under the staff showing play-order (e.g. the
      // path through a D.S. al Coda). cfg.navArrows = [{num, from, to, level, color}]
      //   from/to = barline index (0-based, left->right) or "start"/"end"; arrowhead at `to`.
      //   level   = vertical row: >0 above the staff (1,2,..), <0 below (-1). number sits at the tail.
      if (cfg.navArrows && cfg.navArrows.length){
        try {
          var navc = svg.getScreenCTM();
          if (navc && navc.a){
            var navInv = navc.inverse();
            var nUx = function(px){ var pt=svg.createSVGPoint(); pt.x=px; pt.y=0; return pt.matrixTransform(navInv).x; };
            var nUy = function(py){ var pt=svg.createSVGPoint(); pt.x=0; pt.y=py; return pt.matrixTransform(navInv).y; };
            var navBars = [].slice.call(el.querySelectorAll(".abcjs-bar")).map(function(b){ var r=b.getBoundingClientRect(); return nUx(r.left+r.width/2); }).sort(function(a,b){return a-b;});
            var navLines = [].slice.call(svg.querySelectorAll("path")).map(function(p){ var r=p.getBoundingClientRect(); return {top:nUy(r.top), bot:nUy(r.bottom), w:r.width/navc.a, h:r.height/navc.d}; }).filter(function(o){ return o.h<3 && o.w>40; });
            if (navLines.length){
              var navTop = Math.min.apply(null, navLines.map(function(o){return o.top;}));
              var navBot = Math.max.apply(null, navLines.map(function(o){return o.bot;}));
              var navHead0 = el.querySelector(".abcjs-notehead");
              var navStart = navHead0 ? nUx(navHead0.getBoundingClientRect().left)-3 : navBars[0];
              var NAVNS="http://www.w3.org/2000/svg";
              var navAnchor = function(a){ return a==="start" ? navStart : (a==="end" ? navBars[navBars.length-1] : navBars[a]); };
              cfg.navArrows.forEach(function(A){
                var x0=navAnchor(A.from), x1=navAnchor(A.to);
                if (x0==null || x1==null) return;
                var L=A.level||1;
                var y = L>0 ? navTop-(22+L*15) : navBot+(16+(-L)*12);
                var col=A.color||"#9c7d08", dir=(x1>x0?1:-1), headLen=5.5, headW=3;
                var eff=x1-dir*(A.toShort||0);                 // pull the head back (avoid running into the next arrow)
                var lineEnd=eff-dir*headLen, lineStart=x0;
                var ln=svg.ownerDocument.createElementNS(NAVNS,"path");
                ln.setAttribute("d","M "+lineStart.toFixed(1)+" "+y.toFixed(1)+" L "+lineEnd.toFixed(1)+" "+y.toFixed(1));
                ln.setAttribute("stroke",col); ln.setAttribute("stroke-width","1.8"); ln.setAttribute("fill","none"); ln.setAttribute("stroke-linecap","round"); ln.setAttribute("class","br-navarr");
                svg.appendChild(ln);
                var ah=svg.ownerDocument.createElementNS(NAVNS,"path");
                ah.setAttribute("d","M "+eff.toFixed(1)+" "+y.toFixed(1)+" L "+lineEnd.toFixed(1)+" "+(y-headW).toFixed(1)+" L "+lineEnd.toFixed(1)+" "+(y+headW).toFixed(1)+" Z");
                ah.setAttribute("fill",col); ah.setAttribute("stroke","none"); ah.setAttribute("class","br-navarr");
                svg.appendChild(ah);
                var lab=svg.ownerDocument.createElementNS(NAVNS,"text");
                lab.setAttribute("x",(x0-dir*8).toFixed(1)); lab.setAttribute("y",(y+3.6).toFixed(1));
                lab.setAttribute("text-anchor","middle"); lab.setAttribute("font-size","12"); lab.setAttribute("font-weight","700");
                lab.setAttribute("fill",col); lab.setAttribute("stroke","none"); lab.setAttribute("class","br-navnum"); lab.textContent=A.num;
                svg.appendChild(lab);
              });
            }
          }
        } catch(e){}
      }
      // endHighlight: tint the final (bold double) barline gold so it stands out when the
      // text is calling it out. abcjs tags every barline .abcjs-bar; the last one is the end.
      if (cfg.endHighlight){
        try {
          var bars = el.querySelectorAll(".abcjs-bar");
          if (bars.length){
            var endBar = bars[bars.length-1];
            [endBar].concat([].slice.call(endBar.querySelectorAll("*"))).forEach(function(n){
              n.setAttribute("fill", "#caa413"); n.style.fill = "#caa413"; n.style.stroke = "#caa413";
            });
          }
        } catch(e){}
      }
      // tenuto nudge: a !tenuto! stroke is a short flat horizontal line abcjs places just outside
      // the notehead. On a note sitting on the top/bottom staff line the stroke lands ON that line
      // and blends in. abcjs 6.4.4 gives it no class, so find it by shape (much shorter than a staff
      // line, very flat) and, when it sits on a line, push it clear into the adjacent gap.
      try {
        var tctm = svg.getScreenCTM();
        if (tctm && tctm.d){
          var Ut = function(r){ return { y:(r.top - tctm.f)/tctm.d, w:r.width/tctm.a, h:r.height/tctm.d }; };
          var thin = [].slice.call(svg.querySelectorAll("path")).map(function(p){ return { p:p, u:Ut(p.getBoundingClientRect()) }; })
                       .filter(function(o){ return o.u.h < 3 && o.u.w > 3; });
          if (thin.length){
            var staffW = Math.max.apply(null, thin.map(function(o){ return o.u.w; }));
            var lineYs = thin.filter(function(o){ return o.u.w > staffW*0.5; }).map(function(o){ return o.u.y + o.u.h/2; });
            if (lineYs.length >= 2){
              var midY = (Math.min.apply(null, lineYs) + Math.max.apply(null, lineYs)) / 2;
              thin.forEach(function(o){
                var u = o.u;
                if (u.h > 0 && u.w/u.h > 4 && u.w < staffW*0.2){   // short flat stroke = tenuto
                  var cy = u.y + u.h/2, nd = 1e9;
                  lineYs.forEach(function(ly){ nd = Math.min(nd, Math.abs(cy - ly)); });
                  if (nd < 2){                                       // sitting on a staff line
                    var cm = o.p.getCTM();
                    if (cm && cm.d){
                      var t = (cy < midY ? -3 : 3) / cm.d;          // push away from the staff centre
                      o.p.setAttribute("transform", (o.p.getAttribute("transform")||"") + " translate(0,"+t+")");
                    }
                  }
                }
              });
            }
          }
        }
      } catch(e){}
      // spread chords (rolled chords): draw the OFFICIAL wavy vertical line + optional
      // arrowhead. abcjs 6.4.4 has no arrowed arpeggio and no cross-staff roll, so draw both.
      //   cfg.rolls = [{type:'roll'|'cross', staff:'t'|'b', i:onsetIndex, dir:'up'|'down'|'none'}]
      //     'roll'  = roll ONE chord in one staff (staff t/b). 'cross' = one wavy line through
      //               BOTH staves' chord i (lowest bass note up to highest treble note).
      //     i       = chord onset index (0-based, left-to-right) within that staff.
      //     dir     = 'up' arrowhead on top, 'down' on bottom, 'none' = plain wavy line.
      if (cfg.rolls && cfg.rolls.length){
        try {
          var rctm = svg.getScreenCTM();
          if (rctm && rctm.a){
            var rinv = rctm.inverse();
            var toU = function(px,py){ var pt=svg.createSVGPoint(); pt.x=px; pt.y=py; var u=pt.matrixTransform(rinv); return {x:u.x,y:u.y}; };
            var nhs = [].slice.call(el.querySelectorAll(".abcjs-notehead")).map(function(n){
              var r=n.getBoundingClientRect(); var a=toU(r.left,r.top), b=toU(r.right,r.bottom);
              return { x0:a.x, x1:b.x, y0:a.y, y1:b.y, cx:(a.x+b.x)/2, cy:(a.y+b.y)/2, el:n };
            });
            if (nhs.length){
              // split treble / bass at the largest vertical gap between notehead centres
              var byY = nhs.slice().sort(function(a,b){return a.cy-b.cy;}), vgap=0, splitY=1e9;
              for (var gi2=0; gi2<byY.length-1; gi2++){ var dd=byY[gi2+1].cy-byY[gi2].cy; if (dd>vgap){ vgap=dd; splitY=(byY[gi2].cy+byY[gi2+1].cy)/2; } }
              var twoStaves = vgap > 18;
              var staffOf = function(n){ return (twoStaves && n.cy > splitY) ? 'b' : 't'; };
              var chordsFor = function(st){
                var ns = nhs.filter(function(n){ return staffOf(n)===st; }).sort(function(a,b){return a.cx-b.cx;});
                var gs=[], cur=null;
                // 12u threshold: abcjs offsets chord seconds sideways by ~one notehead (~7u),
                // so they must stay ONE chord; distinct onsets are far wider apart.
                ns.forEach(function(n){
                  if (!cur || n.cx-cur.cx > 12){ cur={ cx:n.cx, x0:n.x0, y0:n.y0, y1:n.y1 }; gs.push(cur); }
                  else { cur.x0=Math.min(cur.x0,n.x0); cur.y0=Math.min(cur.y0,n.y0); cur.y1=Math.max(cur.y1,n.y1); }
                });
                return gs;
              };
              var TCH = chordsFor('t'), BCH = chordsFor('b');
              var roFill = "#111"; try { roFill = getComputedStyle(nhs[0].el).fill || "#111"; } catch(e){}
              var RNS="http://www.w3.org/2000/svg";
              var wavy = function(x, yTop, yBot){
                var amp=2.3, step=5.0, d="M "+x.toFixed(1)+" "+yTop.toFixed(1), y=yTop, side=1;
                while (y < yBot - 0.5){ var ny=Math.min(y+step, yBot); d += " Q "+(x+side*amp).toFixed(1)+" "+((y+ny)/2).toFixed(1)+" "+x.toFixed(1)+" "+ny.toFixed(1); y=ny; side=-side; }
                var p=svg.ownerDocument.createElementNS(RNS,"path");
                p.setAttribute("d",d); p.setAttribute("fill","none"); p.setAttribute("stroke",roFill);
                p.setAttribute("stroke-width","1.5"); p.setAttribute("stroke-linecap","round"); p.setAttribute("class","br-roll");
                svg.appendChild(p);
              };
              var arrow = function(x, y, dir){
                var w=2.8, h=5.4, ay = dir==='up' ? y-h : y+h;
                var p=svg.ownerDocument.createElementNS(RNS,"path");
                p.setAttribute("d","M "+(x-w).toFixed(1)+" "+y.toFixed(1)+" L "+(x+w).toFixed(1)+" "+y.toFixed(1)+" L "+x.toFixed(1)+" "+ay.toFixed(1)+" Z");
                p.setAttribute("fill",roFill); p.setAttribute("stroke","none"); p.setAttribute("class","br-roll");
                svg.appendChild(p);
              };
              cfg.rolls.forEach(function(R){
                var pad=3.2, lineGap=4.5;
                if (R.type==='cross'){
                  var tc=TCH[R.i], bc=BCH[R.i]; if(!tc||!bc) return;
                  var cx=Math.min(tc.x0,bc.x0)-lineGap, cyTop=tc.y0-pad, cyBot=bc.y1+pad;
                  wavy(cx,cyTop,cyBot);
                  if (R.dir==='up') arrow(cx,cyTop,'up'); else if (R.dir==='down') arrow(cx,cyBot,'down');
                } else {
                  var ch=(R.staff==='b'?BCH:TCH)[R.i]; if(!ch) return;
                  var rx=ch.x0-lineGap, ryT=ch.y0-pad, ryB=ch.y1+pad;
                  wavy(rx,ryT,ryB);
                  if (R.dir==='up') arrow(rx,ryT,'up'); else if (R.dir==='down') arrow(rx,ryB,'down');
                }
              });
            }
          }
        } catch(e){}
      }
      // glissando: a wavy diagonal line between two notes with a "gliss." label. abcjs has no
      // glissando line, so draw it. cfg.gliss = [{from:{staff:'t'|'b', i}, to:{staff, i}, label}]
      //   from/to name the two notes by staff + chord onset index (0-based, left-to-right).
      if (cfg.gliss && cfg.gliss.length){
        try {
          var gctm = svg.getScreenCTM();
          if (gctm && gctm.a){
            var ginv = gctm.inverse();
            var gU = function(px,py){ var pt=svg.createSVGPoint(); pt.x=px; pt.y=py; var u=pt.matrixTransform(ginv); return {x:u.x,y:u.y}; };
            var gnh = [].slice.call(el.querySelectorAll(".abcjs-notehead")).map(function(n){
              var r=n.getBoundingClientRect(); var a=gU(r.left,r.top), b=gU(r.right,r.bottom);
              return { x0:a.x, x1:b.x, y0:a.y, y1:b.y, cx:(a.x+b.x)/2, cy:(a.y+b.y)/2 };
            });
            if (gnh.length){
              var gY = gnh.slice().sort(function(a,b){return a.cy-b.cy;}), gv=0, gsplit=1e9;
              for (var gk=0; gk<gY.length-1; gk++){ var gdd=gY[gk+1].cy-gY[gk].cy; if(gdd>gv){gv=gdd; gsplit=(gY[gk].cy+gY[gk+1].cy)/2;} }
              var gTwo = gv>18;
              var gSt = function(n){ return (gTwo && n.cy>gsplit) ? 'b' : 't'; };
              var gCh = function(st){
                var ns=gnh.filter(function(n){return gSt(n)===st;}).sort(function(a,b){return a.cx-b.cx;}), gs=[], cur=null;
                ns.forEach(function(n){ if(!cur||n.cx-cur.cx>12){cur={cx:n.cx,x0:n.x0,x1:n.x1,y0:n.y0,y1:n.y1,cy:n.cy};gs.push(cur);} else {cur.x0=Math.min(cur.x0,n.x0);cur.x1=Math.max(cur.x1,n.x1);cur.y0=Math.min(cur.y0,n.y0);cur.y1=Math.max(cur.y1,n.y1);} });
                return gs;
              };
              var gT=gCh('t'), gB=gCh('b'), GNS="http://www.w3.org/2000/svg";
              var gFill="#111"; try{ gFill=getComputedStyle(el.querySelector(".abcjs-notehead")).fill||"#111"; }catch(e){}
              cfg.gliss.forEach(function(G){
                var fa=(G.from.staff==='b'?gB:gT)[G.from.i], ta=(G.to.staff==='b'?gB:gT)[G.to.i];
                if(!fa||!ta) return;
                var x0=fa.x1+2, y0=fa.cy, x1=ta.x0-2, y1=ta.cy;
                var dx=x1-x0, dy=y1-y0, len=Math.sqrt(dx*dx+dy*dy)||1, ux=dx/len, uy=dy/len, ppx=-uy, ppy=ux;
                var amp=1.7, step=4.2, d="M "+x0.toFixed(1)+" "+y0.toFixed(1), t=0, side=1;
                while(t<len-0.5){ var nt=Math.min(t+step,len); var mx=x0+ux*((t+nt)/2)+ppx*side*amp, my=y0+uy*((t+nt)/2)+ppy*side*amp, ex=x0+ux*nt, ey=y0+uy*nt; d+=" Q "+mx.toFixed(1)+" "+my.toFixed(1)+" "+ex.toFixed(1)+" "+ey.toFixed(1); t=nt; side=-side; }
                var lp=svg.ownerDocument.createElementNS(GNS,"path");
                lp.setAttribute("d",d); lp.setAttribute("fill","none"); lp.setAttribute("stroke",gFill); lp.setAttribute("stroke-width","1.3"); lp.setAttribute("stroke-linecap","round"); lp.setAttribute("class","br-gliss");
                svg.appendChild(lp);
                var midx=(x0+x1)/2, midy=(y0+y1)/2, ang=Math.atan2(dy,dx)*180/Math.PI;
                var tx=svg.ownerDocument.createElementNS(GNS,"text");
                tx.setAttribute("x",midx.toFixed(1)); tx.setAttribute("y",(midy-3).toFixed(1));
                tx.setAttribute("text-anchor","middle"); tx.setAttribute("class","br-gliss-lab"); tx.setAttribute("font-size","11");
                tx.setAttribute("transform","rotate("+ang.toFixed(1)+" "+midx.toFixed(1)+" "+midy.toFixed(1)+")");
                tx.textContent = (G.label || "gliss.");
                svg.appendChild(tx);
              });
            }
          }
        } catch(e){}
      }
      // inverted turn: abcjs renders !turn! but NOT !invertedturn!. So the author writes !turn!
      // and we flip that glyph vertically (a vertically-mirrored turn IS an inverted turn) — keeps
      // it identical in weight/style to a real turn. cfg.flipturn = [{staff:'t'|'b', i:onsetIndex}]
      if (cfg.flipturn && cfg.flipturn.length){
        try {
          var fnh = [].slice.call(el.querySelectorAll(".abcjs-notehead")).map(function(n){ var r=n.getBoundingClientRect(); return {el:n, cx:r.left+r.width/2, cy:r.top+r.height/2, top:r.top}; });
          if (fnh.length){
            var fY=fnh.slice().sort(function(a,b){return a.cy-b.cy;}), fv=0, fsplit=1e9;
            for (var fk=0; fk<fY.length-1; fk++){ var fdd=fY[fk+1].cy-fY[fk].cy; if(fdd>fv){fv=fdd; fsplit=(fY[fk].cy+fY[fk+1].cy)/2;} }
            var fTwo=fv>30;
            var fStOf=function(n){ return (fTwo && n.cy>fsplit) ? 'b' : 't'; };
            var fChOf=function(st){
              var ns=fnh.filter(function(n){return fStOf(n)===st;}).sort(function(a,b){return a.cx-b.cx;}), gs=[], cur=null;
              ns.forEach(function(n){ if(!cur||n.cx-cur.cx>16){cur=n;gs.push(cur);} });
              return gs;
            };
            var fT=fChOf('t'), fB=fChOf('b');
            cfg.flipturn.forEach(function(F){
              var ch=(F.staff==='b'?fB:fT)[F.i]; if(!ch || !ch.el.closest) return;
              var grp=ch.el.closest(".abcjs-note"); if(!grp) return;
              [].slice.call(grp.querySelectorAll("path")).forEach(function(p){
                if (p.getAttribute("class")) return;            // skip notehead/stem (they are classed)
                var r=p.getBoundingClientRect();
                if (r.bottom < ch.top+2 && r.width>4){           // the decoration glyph sits above the note
                  var bb=p.getBBox(), cy=bb.y+bb.height/2;
                  p.setAttribute("transform",(p.getAttribute("transform")?p.getAttribute("transform")+" ":"")+"translate(0,"+(2*cy).toFixed(2)+") scale(1,-1)");
                }
              });
            });
          }
        } catch(e){}
      }
      // count overlay: place beat numbers above the staff, anchored to the ACTUAL note positions
      // so they land exactly over the right beat (and over empty held beats too). This keeps held
      // notes (minim/semibreve) solid while the count still shows. Per bar:
      //   cfg.count[bi] = { lab:[[text,frac],...], on:[frac,...] }
      //   lab = each count's beat position as a fraction of the bar (0..1)
      //   on  = the fraction where each NOTE onset falls, in order (maps 1:1 to the bar's noteheads)
      // Onset beats anchor to their notehead; held beats interpolate piecewise between anchors and
      // the barline. Measured in screen px (abcjs nests in transformed groups) -> SVG user units.
      if (cfg.count && cfg.count.length){
        try {
          var ctm = svg.getScreenCTM();
          if (ctm && ctm.a){
            var sxf = function(px){ return (px - ctm.e) / ctm.a; };
            var syf = function(py){ return (py - ctm.f) / ctm.d; };
            var barC = [].slice.call(el.querySelectorAll(".abcjs-bar")).map(function(b){ var r=b.getBoundingClientRect(); return sxf(r.left + r.width/2); }).sort(function(a,b){return a-b;});
            var headEls = [].slice.call(el.querySelectorAll(".abcjs-notehead"));
            var headC = headEls.map(function(n){ var r=n.getBoundingClientRect(); return sxf(r.left + r.width/2); }).sort(function(a,b){return a-b;});
            // count baseline above the staff: notes here sit on the middle line, so the top of the
            // highest notehead minus a fixed gap lands the row at abcjs ^-annotation height.
            var headTops = headEls.map(function(n){ return syf(n.getBoundingClientRect().top); });
            var baseY = (headTops.length ? Math.min.apply(null, headTops) : 18) - 37;  // abcjs ^-annotation height above the notes
            var ns = "http://www.w3.org/2000/svg", hi = 0;
            cfg.count.forEach(function(bar, bi){
              if (!bar || bi >= barC.length) return;
              var lab = bar.lab || [], on = bar.on || [];
              var left = (bi === 0) ? -1 : barC[bi-1], right = barC[bi];
              var bh = [];
              while (hi < headC.length && headC[hi] < right){ if (headC[hi] > left) bh.push(headC[hi]); hi++; }
              var anc = [];
              if (on.length <= 1){
                // a held-dominated bar (semibreve / dotted minim): anchor beat 1 to its note so the
                // "1" sits over it, and spread the held beats out to the barline (these bars are
                // padded wide so the rest don't cram).
                anc.push([0, bh.length ? bh[0] : (bi === 0 ? 0 : barC[bi-1])]);
                anc.push([1, right]);
              } else {
                for (var j=0; j<on.length && j<bh.length; j++) anc.push([on[j], bh[j]]);
                if (anc[0][0] > 0) anc.unshift([0, anc[0][1]]);
                anc.push([1, right]);
              }
              var xat = function(f){
                for (var a=0; a<anc.length-1; a++){
                  if (f <= anc[a+1][0]){ var span=anc[a+1][0]-anc[a][0], tt=span>0?(f-anc[a][0])/span:0; return anc[a][1]+(anc[a+1][1]-anc[a][1])*tt; }
                }
                return anc[anc.length-1][1];
              };
              lab.forEach(function(L){
                if (L[0]==="" || L[0]==null) return;
                var t = svg.ownerDocument.createElementNS(ns, "text");
                t.setAttribute("x", xat(L[1])); t.setAttribute("y", baseY);
                t.setAttribute("text-anchor", "middle"); t.setAttribute("class", "br-count");
                t.setAttribute("font-size", "16"); t.setAttribute("fill", "#9c7d08"); t.setAttribute("stroke", "none");
                t.textContent = L[0];
                svg.appendChild(t);
              });
            });
          }
        } catch(e){}
      }
      var w = parseFloat(svg.getAttribute("width")), h = parseFloat(svg.getAttribute("height"));
      if (w && h){
        // abcjs's padding (set above for slur/phrase staves) is already baked into w/h, so the
        // box reserves the headroom the arcs need; a straight 0 0 w h viewBox keeps everything in.
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
      case "level":   // gold label (e.g. "Level 2") + a light supporting description line
        return '<div class="br-level"><div class="br-level-ey">'+esc(b.label||"")+'</div>'
             + '<div class="br-level-d">'+inlineMarkup(b.text||"")+'</div></div>';
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
        return '<div class="br-concepts'+(b.vertical?' br-concepts-v':'')+'">'+items+'</div>';
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
        // b.notations (array) renders several INDEPENDENT staves stacked (no joining system
        // barline, unlike a multi-voice abc); b.notation stays the single-staff shorthand.
        var notas = (b.notations && b.notations.length) ? b.notations
                  : ((b.notation && (b.notation.abc || b.notation.label || (b.notation.notes && b.notation.notes.length))) ? [b.notation] : []);
        notas.forEach(function(nt){ visual += '<div class="br-staff" data-br-staff="'+attr(nt)+'"></div>'; });
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
        return '<div class="br-notation"><div class="br-staff br-staff-full" data-br-staff="'+attr({abc:b.abc,notes:b.notes,label:b.label,labelsAbove:b.labelsAbove,clef:b.clef,scale:b.scale||1.4,staffwidth:b.staffwidth||640,fill:true,endHighlight:b.endHighlight,count:b.count,rolls:b.rolls,gliss:b.gliss,flipturn:b.flipturn,thinDoubleBar:b.thinDoubleBar,codaWords:b.codaWords,symbolsOverBarline:b.symbolsOverBarline,navArrows:b.navArrows})+'"></div>'
             + (b.caption ? '<div class="br-cap">'+esc(b.caption)+'</div>' : '') + '</div>';
      case "keyboard":
        return '<div class="br-block-center"><div data-br-kb="'+attr({octaves:b.octaves||1,base:b.base,keys:b.keys||[]})+'" style="width:100%;max-width:'+kbWidth(b.octaves)+'px"></div>'
             + (b.caption ? '<div class="br-cap">'+esc(b.caption)+'</div>' : '') + '</div>';
      case "kbgrid": {
        // worksheet grid of small keyboards. items[i] = { key (highlit pitch, e.g. "D4"; omit for a
        // blank keyboard), octaves, base, prompt (text before the answer), answer (shown gold; omit =
        // a blank line to write on). cols = grid columns.
        var kgItems = (b.items || []).map(function(it){
          var keys = it.key ? [{name:it.key, tone:"target"}] : [];
          var kb = '<div class="br-kbg-kb" data-br-kb="'+attr({octaves:it.octaves||2, base:(it.base!=null?it.base:3), keys:keys})+'"></div>';
          var foot = (it.answer!=null && it.answer!=="")
            ? '<div class="br-kbg-foot"><span class="br-kbg-tag">'+esc(it.prompt||"")+'</span><span class="br-kbg-ans">'+esc(it.answer)+'</span></div>'
            : '<div class="br-kbg-foot"><span class="br-kbg-tag">'+esc(it.prompt||"")+'</span><span class="br-kbg-line"></span></div>';
          return '<div class="br-kbg-cell">'+kb+foot+'</div>';
        }).join("");
        return (b.title ? '<div class="br-subheading">'+inlineMarkup(b.title)+'</div>' : '')
          + (b.instruction ? '<p class="br-p">'+inlineMarkup(b.instruction)+'</p>' : '')
          + '<div class="br-kbg-grid" style="grid-template-columns:repeat('+(b.cols||2)+',minmax(0,1fr))">'+kgItems+'</div>';
      }
      case "olist":
        return '<ol class="br-ol">' + (b.items||[]).map(function(it,i){
          return '<li class="br-ol-li"><span class="br-ol-n">'+(i+1)+'</span><span class="br-ol-t">'+inlineMarkup(it)+'</span></li>';
        }).join("") + '</ol>';
      case "partdivider":
        return '<div class="br-partdiv">'
          + (b.eyebrow ? '<div class="br-pd-ey">'+esc(b.eyebrow)+'</div>' : '')
          + '<div class="br-pd-rule"></div>'
          + '<h1 class="br-pd-title">'+inlineMarkup(b.title||"")+'</h1>'
          + (b.subtitle ? '<div class="br-pd-sub">'+inlineMarkup(b.subtitle)+'</div>' : '')
          + '</div>';
      case "callout": {
        // tinted box tying a concept back to playing by ear. text = string, or paras = [..] for
        // multiple paragraphs. label defaults to "Playing by ear".
        var coTxt = (b.paras && b.paras.length)
          ? b.paras.map(function(p){ return '<p>'+inlineMarkup(p)+'</p>'; }).join("")
          : inlineMarkup(b.text||"");
        return '<div class="br-callout">'
          + '<div class="br-callout-lbl">'+esc(b.label||"Playing by ear")+'</div>'
          + '<div class="br-callout-txt">'+coTxt+'</div></div>';
      }
      case "scalefill": {
        // worksheet of "root _ _ _ _ _ _ | root" cells. items[i] = { root, blanks (default 6),
        // answer (array of note names -> fills the blanks gold, for the answer book) }.
        var sfCells = (b.items||[]).map(function(it){
          var root = esc(it.root||"");
          var mid;
          if (it.answer && it.answer.length){
            mid = it.answer.map(function(a){ return '<span class="br-sf-a">'+esc(a)+'</span>'; }).join("");
          } else {
            var bl = "", n = it.blanks||6;
            for (var i=0;i<n;i++) bl += '<span class="br-sf-bl"></span>';
            mid = bl;
          }
          return '<div class="br-sf-cell"><span class="br-sf-root">'+root+'</span>'+mid
               + '<span class="br-sf-bar">|</span><span class="br-sf-root">'+root+'</span></div>';
        }).join("");
        return (b.title ? '<div class="br-subheading">'+inlineMarkup(b.title)+'</div>' : '')
          + (b.instruction ? '<p class="br-p">'+inlineMarkup(b.instruction)+'</p>' : '')
          + '<div class="br-sf-grid" style="grid-template-columns:repeat('+(b.cols||2)+',minmax(0,1fr))">'+sfCells+'</div>';
      }
      case "reftable": {
        // flexible bordered table. cols[i] = { head, type:'name'|'notes'|'fill'|'text', w (grid track,
        // default 1fr), blanks (for fill) }. rows = array of arrays; a fill cell with a string value
        // shows it gold (answer book), else draws blanks.
        var rtCols = b.cols||[];
        var tmpl = b.template || rtCols.map(function(c){ return c.w||"1fr"; }).join(" ");
        var rtHtml = rtCols.map(function(c){ return '<div class="br-rt-h">'+esc(c.head||"")+'</div>'; }).join("");
        (b.rows||[]).forEach(function(r,ri){
          var alt = (ri%2===1) ? ' br-rt-alt' : '';
          rtCols.forEach(function(c,ci){
            var v = r[ci], inner;
            if (c.type==='name')       inner = '<span class="br-rt-name">'+esc(v||"")+'</span>';
            else if (c.type==='notes') inner = '<span class="br-rt-notes">'+esc(v||"")+'</span>';
            else if (c.type==='fillword'){
              // a single short blank (or gold answer) followed by a fixed word, e.g. "____ Minor"
              var fw = (v!=null && v!=="") ? '<span class="br-sf-a" style="flex:none;font-size:16px">'+esc(v)+'</span>'
                                           : '<span class="br-rt-blank" style="flex:none;width:48px;margin-bottom:5px"></span>';
              inner = fw + '<span class="br-rt-name" style="font-size:15px">'+esc(c.word||"")+'</span>';
            }
            else if (c.type==='fill'){
              if (v!=null && v!=="") inner = '<span class="br-rt-notes" style="color:var(--gold-deep)">'+esc(v)+'</span>';
              else { var bl="", n=c.blanks||8; for (var i=0;i<n;i++) bl+='<span class="br-rt-blank"></span>'; inner='<div style="display:flex;gap:8px;flex:1">'+bl+'</div>'; }
            }
            else if (c.type==='answer'){
              // single short written answer (gold if provided, else one writing line)
              inner = (v!=null && v!=="") ? '<span class="br-rt-ansv">'+esc(v)+'</span>'
                                          : '<span class="br-rt-blank" style="margin-bottom:5px"></span>';
            }
            else if (c.type==='scalefill'){
              // inline "root _ _ _ _ _ _ root". cell = { root } or { root, answer:[...] }
              var sfr = (v && v.root!=null) ? v.root : (v||"");
              var sfMid;
              if (v && v.answer && v.answer.length) sfMid = v.answer.map(function(a){ return '<span class="br-sf-a">'+esc(a)+'</span>'; }).join("");
              else { var sb="", sn=(c.blanks||6); for (var i=0;i<sn;i++) sb+='<span class="br-sf-bl"></span>'; sfMid=sb; }
              inner = '<div class="br-rtsf"><span class="br-rtsf-r">'+esc(sfr)+'</span>'+sfMid+'<span class="br-rtsf-r">'+esc(sfr)+'</span></div>';
            }
            else inner = inlineMarkup(v||"");
            rtHtml += '<div class="br-rt-c'+alt+'">'+inner+'</div>';
          });
        });
        return (b.title ? '<div class="br-subheading">'+inlineMarkup(b.title)+'</div>' : '')
          + (b.instruction ? '<p class="br-p">'+inlineMarkup(b.instruction)+'</p>' : '')
          + '<div class="br-rt" style="grid-template-columns:'+tmpl+'">'+rtHtml+'</div>';
      }
      case "match": {
        // two columns of labels with dot anchors to draw connecting lines between. left[i]/right[i].
        var mL = b.left||[], mR = b.right||[], mRows = Math.max(mL.length, mR.length), mHtml = "";
        for (var mi=0; mi<mRows; mi++){
          mHtml += '<div class="br-match-row">'
            + '<div class="br-match-l">' + (mL[mi]!=null ? '<span>'+esc(mL[mi])+'</span><span class="br-match-dot"></span>' : '') + '</div>'
            + '<div class="br-match-r">' + (mR[mi]!=null ? '<span>'+esc(mR[mi])+'</span><span class="br-match-dot"></span>' : '') + '</div>'
            + '</div>';
        }
        return (b.title ? '<div class="br-subheading">'+inlineMarkup(b.title)+'</div>' : '')
          + (b.instruction ? '<p class="br-p">'+inlineMarkup(b.instruction)+'</p>' : '')
          + '<div class="br-match">'+mHtml+'</div>';
      }
      case "circlepick": {
        // left = the given notes (big), right = options to circle. items[i] = { notes, answer:[...] }.
        // options come from item.options or the block-level b.options. optCols = option grid columns.
        var cpHtml = (b.items||[]).map(function(it){
          var opts = (it.options||b.options||[]).map(function(o){
            var on = (it.answer && it.answer.indexOf(o)>=0) ? ' br-cp-on' : '';
            return '<span class="br-cp-opt'+on+'">'+esc(o)+'</span>';
          }).join("");
          var lcls = b.prose ? "br-cp-prose" : "br-cp-notes";
          return '<div class="br-cp-row"><div class="'+lcls+'">'+inlineMarkup(it.notes||"")+'</div>'
            + '<div class="br-cp-opts" style="grid-template-columns:repeat('+(b.optCols||2)+',auto)">'+opts+'</div></div>';
        }).join("");
        return (b.title ? '<div class="br-subheading">'+inlineMarkup(b.title)+'</div>' : '')
          + (b.instruction ? '<p class="br-p">'+inlineMarkup(b.instruction)+'</p>' : '')
          + '<div class="br-cp">'+cpHtml+'</div>';
      }
      case "kbquiz": {
        // a highlighted keyboard + a few short fill-in questions per row. items[i] =
        // { key (highlit pitch), octaves, base, questions:[{q, a}] }.
        var kqHtml = (b.items||[]).map(function(it){
          var keys = it.key ? [{name:it.key, tone:"target"}] : [];
          var kb = '<div class="br-kbq-kb" data-br-kb="'+attr({octaves:it.octaves||2, base:(it.base!=null?it.base:3), keys:keys})+'"></div>';
          var qs = (it.questions||[]).map(function(q){
            var ans = (q.a!=null && q.a!=="") ? '<span class="br-kbq-a">'+esc(q.a)+'</span>' : '<span class="br-kbq-line"></span>';
            return '<div class="br-kbq-q"><span>'+inlineMarkup(q.q||"")+'</span>'+ans+'</div>';
          }).join("");
          return '<div class="br-kbq-cell">'+kb+'<div class="br-kbq-qs">'+qs+'</div></div>';
        }).join("");
        return (b.title ? '<div class="br-subheading">'+inlineMarkup(b.title)+'</div>' : '')
          + (b.instruction ? '<p class="br-p">'+inlineMarkup(b.instruction)+'</p>' : '')
          + '<div class="br-kbq" style="grid-template-columns:repeat('+(b.cols||1)+',minmax(0,1fr))">'+kqHtml+'</div>';
      }
      case "image": {
        // src = public URL (used as-is). path = private 'book-sources' object, left
        // unresolved here (no Supabase client in the renderer); Book Studio signs the
        // data-br-img placeholder to a short-lived URL after hydrate / before export.
        var img = b.src ? '<img src="'+esc(b.src)+'" alt="'+esc(b.alt||"")+'">'
                : b.path ? '<img data-br-img="'+esc(b.path)+'" alt="'+esc(b.alt||"")+'">'
                : '';
        var cls = b.full ? 'br-img br-img-full' : 'br-img';   // full = no card rounding, fill width (sheet music)
        var inner = '<div class="'+cls+'">'+img
             + (b.caption ? '<div class="br-cap">'+esc(b.caption)+'</div>' : '') + '</div>';
        // a margin number (e.g. exercise number) sits to the left, pinned to the staff centre;
        // b.numY (percent) is the brace/staff centre within this image (default 50%).
        if (b.num != null && b.num !== ""){
          var ny = (b.numY != null) ? ' style="top:'+b.numY+'%"' : '';
          return '<div class="br-exrow"><div class="br-exnum"'+ny+'>'+esc(b.num)+'</div>'+inner+'</div>';
        }
        return inner;
      }
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
    // Spread the music: any heading/sub-heading stays at the top, then the run of
    // full-width sheet-music images (one per exercise) is distributed evenly down the
    // leftover space (space-between), so every page fills like the printed original —
    // a header just tightens the gaps; staves keep the same size on every page.
    var spreadMusic = meta.spreadMusic || (book.theme && book.theme.spreadMusic);
    var firstFull = -1;
    for (var bi = 0; bi < blocks.length; bi++){ if (blocks[bi] && blocks[bi].type === "image" && blocks[bi].full){ firstFull = bi; break; } }
    // Full-bleed page (e.g. the cover): one image fills the whole A4, no margins/furniture.
    if (meta.fullBleed && firstFull >= 0){
      var cb = blocks[firstFull];
      var cattr = cb.src ? 'src="'+esc(cb.src)+'"' : cb.path ? 'data-br-img="'+esc(cb.path)+'"' : '';
      return '<div class="br-page" style="padding:0;height:297mm;display:block;overflow:hidden">'
           + '<img '+cattr+' alt="" style="width:100%;height:100%;object-fit:cover;display:block"></div>';
    }
    var body;
    if (spreadMusic && firstFull >= 0){
      var pre  = blocks.slice(0, firstFull).map(blockHTML).join("\n");
      var imgs = blocks.slice(firstFull).filter(function(b){ return b && b.type === "image" && b.full; }).map(blockHTML).join("\n");
      body = pre + '<div class="br-musicspread">' + imgs + '</div>';
    } else {
      body = blocks.map(blockHTML).join("\n");
    }
    var pad = (book.theme && book.theme.pagePad);
    var pageAttr = pad ? ' style="padding:'+esc(pad)+'"' : '';
    return '<div class="br-page"'+pageAttr+'>'+head+body+foot+'</div>';
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
    { type:"level",     label:"Level intro",   make:function(){ return { type:"level", label:"Level 1", text:"" }; } },
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
