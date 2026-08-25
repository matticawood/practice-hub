/* build-mock.mjs — writes mock-note.html into the repo for the dev alias.
   A mock only: no game logic, no data, nothing wired to the real tool. */
import { readFileSync, writeFileSync } from "node:fs";

const DIR = "/private/tmp/claude-501/-Users-matthewcawood-Piano-Practice-Daily/0e598060-a03f-4468-bf26-d021661a7bf9/scratchpad/ly";
const N = JSON.parse(readFileSync(DIR + "/notes.json", "utf8"));

/* Four octaves in the markup. How many of them are SHOWN depends on how much
   room there is — a wider screen reveals more of the keyboard rather than
   stretching the keys, which is how a real piano behaves and the only way to
   fill the width without the proportions moving. */
const OCTAVE = [
  { n: "C", b: true }, { n: "D", b: true }, { n: "E", b: false },
  { n: "F", b: true }, { n: "G", b: true }, { n: "A", b: true }, { n: "B", b: false },
];
const KEYS = [1, 2, 3, 4].flatMap(o => OCTAVE.map(k => ({ ...k, o })));

/* The octave a key sits in, so a phone can show one and a desktop two without
   the markup changing. */
const piano = KEYS.map(k =>
  `<button class="k" data-oct="${k.o}"><span>${k.n}</span>${k.b ? '<i class="kb"></i>' : ""}</button>`
).join("");

const html = `<!-- MOCK. Not wired to anything: no game logic, no data, no routing.
     Deployed to the dev alias only so the layout can be judged on a real screen
     and a real phone before the tool itself is touched. -->
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Note Recognition — layout mock</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap">
<style>
  :root { --tc:#10b981; --ground:#08080a; --ink:#f3f3f5; --dim:#9a9aa4; --line:#26262e;
          --paper:#f7f3e7; --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
          --mono:ui-monospace,SFMono-Regular,Menlo,monospace; }
  * { box-sizing:border-box; }
  html,body { margin:0; padding:0; background:var(--ground); color:var(--ink); font-family:var(--sans); }
  body { min-height:100vh; display:flex; flex-direction:column; overflow-x:hidden; }
  body::before { content:""; position:fixed; inset:0; z-index:-1;
    background:
      radial-gradient(70% 50% at 15% -8%, color-mix(in srgb, var(--tc) 26%, transparent), transparent 62%),
      radial-gradient(60% 46% at 92% 4%, color-mix(in srgb, var(--tc) 13%, transparent), transparent 60%),
      var(--ground); }

  /* the mock's own switcher, not part of the design */
  .mockbar { position:fixed; z-index:99; left:50%; transform:translateX(-50%); top:12px;
    display:flex; gap:4px; padding:4px; border-radius:999px;
    background:rgba(14,14,20,.9); border:1px solid var(--line); backdrop-filter:blur(8px); }
  .mockbar button { background:none; border:0; border-radius:999px; padding:8px 15px; cursor:pointer;
    font:600 .76rem/1 var(--sans); color:var(--dim); }
  .mockbar button.on { background:var(--tc); color:#06231a; }
  .screen { display:none; flex:1; flex-direction:column; }
  .screen.on { display:flex; }
  /* The playing screen is a fixed frame, not a document: the manuscript takes
     whatever is left between the HUD and the keys, and the keys sit on the
     bottom edge of the screen. dvh rather than vh so a phone's collapsing
     address bar does not leave a strip of ground under the keyboard. */
  #s-play.on { height:100dvh; overflow:hidden; }
  @supports not (height:100dvh) { #s-play.on { height:100vh; } }

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  .hud { display:flex; align-items:center; justify-content:space-between; gap:20px;
    padding:18px clamp(16px,3vw,40px) 14px; }
  .hud-l { display:flex; align-items:baseline; gap:14px; }
  .clock { font:700 clamp(2.4rem,6vw,3.6rem)/1 var(--mono); letter-spacing:-.04em;
    color:var(--tc); font-variant-numeric:tabular-nums;
    text-shadow:0 0 40px color-mix(in srgb, var(--tc) 45%, transparent); }
  .hud-k { font:650 .64rem/1 var(--mono); letter-spacing:.18em; text-transform:uppercase; color:var(--dim); }
  .hud-r { text-align:right; display:flex; align-items:baseline; gap:12px; }
  .score { font:700 clamp(2.4rem,6vw,3.6rem)/1 var(--mono); letter-spacing:-.04em; color:#fff;
    font-variant-numeric:tabular-nums; }
  .hud-quit { border:1px solid var(--line); background:rgba(255,255,255,.03); color:var(--dim);
    border-radius:999px; padding:9px 16px; font:600 .78rem/1 var(--sans); cursor:pointer; }
  .hud-quit:hover { color:#fff; border-color:#fff; }
  .bar { height:3px; background:rgba(255,255,255,.07); }
  .bar i { display:block; height:100%; width:62%; background:var(--tc);
    box-shadow:0 0 18px -2px var(--tc); }

  /* ── the manuscript ────────────────────────────────────────────────────── */
  .paper { flex:1 1 auto; min-height:0; position:relative; display:grid; place-items:center;
    padding:clamp(18px,4vw,46px) clamp(16px,4vw,60px);
    background:
      radial-gradient(120% 80% at 50% 0%, #fffdf6, var(--paper) 70%);
    box-shadow:inset 0 14px 34px -22px rgba(0,0,0,.5), 0 -1px 0 rgba(255,255,255,.06); }
  .paper svg { width:min(100%, 34rem); max-height:100%; height:auto; color:#14110c; }
  .paper .askk { position:absolute; top:clamp(12px,2vw,20px); left:clamp(16px,4vw,60px);
    font:650 .66rem/1 var(--mono); letter-spacing:.18em; text-transform:uppercase; color:#8a8577; }
  .paper .streak { position:absolute; top:clamp(12px,2vw,20px); right:clamp(16px,4vw,60px);
    display:flex; gap:5px; align-items:center;
    font:650 .66rem/1 var(--mono); letter-spacing:.16em; text-transform:uppercase; color:#8a8577; }
  .paper .streak b { color:#1d7d5c; font-size:.8rem; }

  /* ── the keyboard ──────────────────────────────────────────────────────────
     A piano, not a row of buttons. Every dimension comes from ONE number: the
     width of a white key. Before, the whites were flex:1 and stretched with the
     screen while the blacks stayed a fixed 26px, so the proportions drifted
     apart the wider it got and it stopped reading as a keyboard.

     The real instrument: a white key is 23.5mm wide and a black one 13.7mm,
     which is 58% of it; a black key is about 62% of a white one's length. Those
     two ratios are held here whatever the size, and the keyboard takes its
     HEIGHT from its width through aspect-ratio, so it grows and shrinks as one
     object rather than stretching sideways.

     --n is how many white keys are showing. It is the only thing that changes
     between a phone and a desktop. */
  .keys { --n:14; --white-len:92;
    position:relative; display:flex; width:100%;
    aspect-ratio: calc(var(--n) * 23.5) / var(--white-len);
    background:#0c0c10; }
  /* On --white-len: the two ratios that make it read as a piano are held
     exactly - a black key is 58% of a white one's width and 62% of its length -
     but the keys themselves are deliberately shorter than a real 23.5:150. A
     true-length keyboard here would be 400px tall and eat the manuscript. This
     is a shortening, chosen once, and it scales with everything else rather
     than being clamped later: a max-height on top of an explicit width would
     break the ratio, which is the bug this is replacing. */
  .keys-bed { width:100%; background:#0c0c10;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.06); }

  /* How much keyboard is showing. The keys never change shape between these —
     only how many of them there are — so the piano stays a piano and still
     reaches both edges. Chosen to keep a white key between about 55 and 80px
     wide, which is comfortable to hit at either end. */
  .k[data-oct="3"], .k[data-oct="4"] { display:none; }
  @media (min-width:1100px) {
    .keys { --n:21; }
    .k[data-oct="3"] { display:flex; }
  }
  @media (min-width:1550px) {
    .keys { --n:28; }
    .k[data-oct="4"] { display:flex; }
  }

  .k { position:relative; flex:0 0 calc(100% / var(--n)); min-width:0; border:0; cursor:pointer;
    background:linear-gradient(180deg,#fdfdfb,#e6e4dd);
    border-right:1px solid #b9b6ad; display:flex; align-items:flex-end; justify-content:center;
    padding-bottom:4%; font:650 clamp(.6rem,1.1vw,.8rem)/1 var(--sans); color:#6d6a61; }
  .k:last-child { border-right:0; }
  .k:active, .k.hit { background:linear-gradient(180deg,#d8f5e8,#a9e6cd); color:#0d5d43; }
  /* Sized off the white key it sits between, so the two never drift: 58% of a
     white key wide, and half of that overhanging each side of the join. */
  .kb { position:absolute; top:0; z-index:2;
    width:58%; right:-29%; height:62%;
    border-radius:0 0 4px 4px; background:linear-gradient(180deg,#2a2a30,#101014);
    box-shadow:0 4px 8px rgba(0,0,0,.5); }
  .kb:hover { background:linear-gradient(180deg,#3a3a44,#16161c); }

  /* ── setup ─────────────────────────────────────────────────────────────── */
  .wrap { width:100%; padding:clamp(22px,4vw,54px) clamp(16px,3vw,40px) 90px; }
  .eyebrow { font:800 .68rem/1 var(--mono); letter-spacing:.22em; text-transform:uppercase; color:var(--tc); }
  h1 { margin:14px 0 0; font:700 clamp(2rem,4.6vw,3.1rem)/1.02 Fraunces,Georgia,serif;
    letter-spacing:-.03em; color:#fff; }
  .lede { margin:12px 0 0; font-size:1.02rem; color:var(--dim); max-width:44ch; }
  .fieldset { margin-top:34px; }
  .legend { font:650 .68rem/1 var(--mono); letter-spacing:.18em; text-transform:uppercase;
    color:var(--dim); margin-bottom:12px; }
  .opts { display:grid; gap:12px; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); }
  .opt { position:relative; overflow:hidden; text-align:left; cursor:pointer; font:inherit;
    padding:18px; border-radius:16px; color:var(--ink);
    border:1px solid var(--line); background:linear-gradient(150deg,#16161b,#101014); }
  .opt:hover { border-color:color-mix(in srgb,var(--tc) 45%,var(--line)); }
  .opt.on { border-color:var(--tc);
    background:linear-gradient(150deg,color-mix(in srgb,var(--tc) 17%,#16161b),#101014);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.07), 0 0 26px -12px var(--tc); }
  .opt-t { font:700 1.05rem/1.2 Fraunces,Georgia,serif; color:#fff; }
  .opt-d { margin-top:5px; font-size:.84rem; color:var(--dim); }
  .go { margin-top:32px; display:inline-flex; align-items:center; gap:9px; border:0; cursor:pointer;
    border-radius:999px; padding:16px 30px; background:#fff; color:#0f0f13;
    font:650 1rem/1 var(--sans); }
  .go:hover { background:var(--tc); }

  /* ── results ───────────────────────────────────────────────────────────── */
  .res { text-align:center; padding-top:clamp(30px,6vh,70px); }
  .res .big { font:700 clamp(5rem,16vw,10rem)/.86 var(--mono); letter-spacing:-.05em; color:var(--tc);
    font-variant-numeric:tabular-nums; text-shadow:0 0 70px color-mix(in srgb,var(--tc) 45%,transparent); }
  .res .cap { margin-top:10px; font:650 .72rem/1 var(--mono); letter-spacing:.2em;
    text-transform:uppercase; color:var(--dim); }
  .res h2 { margin:22px 0 0; font:700 clamp(1.5rem,3.4vw,2.2rem)/1.1 Fraunces,Georgia,serif; color:#fff; }
  .pbs { margin:26px auto 0; display:flex; gap:0; max-width:44rem; border-top:1px solid var(--line);
    border-bottom:1px solid var(--line); }
  .pb { flex:1; padding:16px 12px; border-left:1px solid var(--line); }
  .pb:first-child { border-left:0; }
  .pb-v { font:700 1.6rem/1 var(--mono); color:var(--tc); font-variant-numeric:tabular-nums; }
  .pb-k { margin-top:5px; font:650 .6rem/1.3 var(--mono); letter-spacing:.13em;
    text-transform:uppercase; color:var(--dim); }
  .acts { margin-top:30px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }
  .ghost { border:1px solid rgba(255,255,255,.35); background:rgba(255,255,255,.06); color:#fff;
    border-radius:999px; padding:15px 26px; font:650 .95rem/1 var(--sans); cursor:pointer; }
  .ghost:hover { border-color:#fff; background:rgba(255,255,255,.14); }

  @media (max-width:640px) {
    .hud { padding:14px 16px 10px; }
    .hud-quit { display:none; }
    .paper svg { width:100%; }
    /* One octave on a phone. Fourteen keys across 390px is 28px each, which is
       under half a thumb; seven is 56px. The keyboard keeps its proportions
       either way because everything is derived from --n. */
    .keys { --n:7; width:100%; }
    .k[data-oct="2"] { display:none; }
    /* 3 and 4 are already hidden above; kept explicit so the phone rule reads
       on its own. */
    .k[data-oct="3"], .k[data-oct="4"] { display:none; }
    .k span { font-size:.72rem; }
  }
</style>

<div class="screen on" id="s-play">
  <div class="hud">
    <div class="hud-l"><span class="clock">0:47</span><span class="hud-k">left</span></div>
    <div class="hud-r">
      <button class="hud-quit">End</button>
      <span class="score">12</span><span class="hud-k">correct</span>
    </div>
  </div>
  <div class="bar"><i></i></div>
  <div class="paper">
    <span class="askk">Treble &middot; sharps and flats</span>
    <span class="streak"><b>&#9679;&#9679;&#9679;</b> 3 in a row</span>
    ${N["treble-fs5"]}
  </div>
  <div class="keys-bed"><div class="keys">${piano}</div></div>
</div>

<div class="screen" id="s-set">
  <div class="wrap">
    <span class="eyebrow">Practice tools</span>
    <h1>Note Recognition</h1>
    <p class="lede">Name the note on the stave, against the clock. One minute, as many as you can.</p>

    <div class="fieldset">
      <div class="legend">Which clef</div>
      <div class="opts">
        <button class="opt on"><span class="opt-t">Treble</span><span class="opt-d">The right hand's stave.</span></button>
        <button class="opt"><span class="opt-t">Bass</span><span class="opt-d">The left hand's stave.</span></button>
        <button class="opt"><span class="opt-t">Both</span><span class="opt-d">Alternating, at random.</span></button>
      </div>
    </div>

    <div class="fieldset">
      <div class="legend">How hard</div>
      <div class="opts">
        <button class="opt on"><span class="opt-t">Naturals only</span><span class="opt-d">White notes, no accidentals.</span></button>
        <button class="opt"><span class="opt-t">Sharps and flats</span><span class="opt-d">The black notes too.</span></button>
        <button class="opt"><span class="opt-t">In a key</span><span class="opt-d">Read within one key signature.</span></button>
      </div>
    </div>

    <button class="go">Start &nbsp;&rarr;</button>
  </div>
</div>

<div class="screen" id="s-res">
  <div class="wrap res">
    <div class="big">17</div>
    <div class="cap">correct in one minute</div>
    <h2>Your best yet</h2>
    <div class="pbs">
      <div class="pb"><div class="pb-v">17</div><div class="pb-k">this run</div></div>
      <div class="pb"><div class="pb-v">50</div><div class="pb-k">your best</div></div>
      <div class="pb"><div class="pb-v">94%</div><div class="pb-k">accuracy</div></div>
      <div class="pb"><div class="pb-v">3.4s</div><div class="pb-k">average</div></div>
    </div>
    <div class="acts">
      <button class="go" style="margin-top:0">Go again</button>
      <button class="ghost">Change the settings</button>
    </div>
  </div>
</div>

<div class="mockbar">
  <button class="on" data-s="s-play">Playing</button>
  <button data-s="s-set">Setup</button>
  <button data-s="s-res">Results</button>
</div>

<script>
  document.querySelectorAll(".mockbar button").forEach(function(b){
    b.onclick = function(){
      document.querySelectorAll(".mockbar button").forEach(function(x){ x.classList.toggle("on", x===b); });
      document.querySelectorAll(".screen").forEach(function(s){ s.classList.toggle("on", s.id===b.dataset.s); });
    };
  });
  document.querySelectorAll(".opt").forEach(function(o){
    o.onclick = function(){
      [...o.parentElement.children].forEach(function(x){ x.classList.toggle("on", x===o); });
    };
  });
  document.querySelectorAll(".k").forEach(function(k){
    k.onclick = function(){ k.classList.add("hit"); setTimeout(function(){ k.classList.remove("hit"); }, 180); };
  });
</script>
`;

writeFileSync("/Users/matthewcawood/The Practice Room Database/mock-note.html", html);
console.log("wrote mock-note.html", (html.length / 1024).toFixed(1) + "kB");
