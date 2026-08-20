#!/usr/bin/env node
// PreToolUse gate for ANY edit to the sr-studio generator. It does NOT ask Claude to justify the change — justifying is
// advocacy, and advocacy is how a literalization slips through wearing composer-phrased clothes. It forces the
// ADVERSARIAL test Matthew applies by hand every turn: "is this how a composer actually thinks, or a rule / flag /
// threshold / probability / fixed constant standing in for the reasoning? Does the decision EMERGE from the material, or
// is it STAMPED on the side?" A stamped decision is deferred structural debt — it looks fine until a later feature has
// to reason about the same thing for real and collides with the fake reasoning underneath. So: land honestly on
// EMERGENT, or you do not get to edit.
//
// Requires a fresh .audit/change.md with:
//   ## COMPOSER-CHECK  — the decision; how a composer actually reasons it (the cases they weigh); a real attempt to
//                        REFUTE the change as a rule-in-disguise (what does it MISS?); and a verdict: EMERGENT or STAMPED.
//   ## EMERGENCE       — what in the MATERIAL the decision derives from (form / harmony / melody / the character's
//                        genuine musical nature), not an independent stamped value.
//   ## PREFERENCE      — why it is a weighted lean, not a wall, and the possibility it must still allow.
// Block = exit 2 (stderr shown to Claude).
import { readFileSync, statSync } from 'fs';
import { basename } from 'path';

const FRESH_MIN = 30;
const CHANGE = decodeURIComponent(new URL('../../.audit/change.md', import.meta.url).pathname);

const allow = () => process.exit(0);
const block = msg => { process.stderr.write('\n[change-gate] EDIT BLOCKED\n' + msg + '\n'); process.exit(2); };

let input; try { input = JSON.parse(readFileSync(0, 'utf8')); } catch { allow(); }
if (!/^(Edit|Write|MultiEdit)$/.test(input.tool_name || '')) allow();
const fp = input.tool_input?.file_path || '';
const gated = fp.includes('/sr-studio/') && fp.endsWith('.mjs')
  && !basename(fp).startsWith('_')
  && !fp.includes('/.claude/') && !fp.includes('/scratchpad/') && !fp.includes('/.audit/');
if (!gated) allow();

const ageMin = p => { try { return (Date.now() - statSync(p).mtimeMs) / 60000; } catch { return Infinity; } };

const TEMPLATE = `Write ${CHANGE} FIRST — and do NOT justify the change. Run the test Matthew runs by hand:

## PREMISE-CHALLENGE   (do THIS before anything — it is the question you keep skipping)
- What is a composer ACTUALLY trying to do at this point in the music? (Not "how do I fix the symptom" — what is the goal.)
- Should this thing even EXIST here? State the STRONGEST case for REMOVING it, or for RECONCEIVING the whole approach —
  argue it as if you believed it. Name concretely what removal / a different approach would BE (e.g. "drop this texture at
  this grade", "this isn't a voicing problem, it's the wrong element"). A patch on a thing that shouldn't be here is a
  double error — the oom-pah-at-grade-2 mistake.
- Why the change WINS over removal / reconception anyway — or, if it does not, STOP and remove / reconceive instead.

## COMPOSER-CHECK
- The decision: <the one compositional decision this edit encodes or changes>
- How a composer actually reasons it: <the real thinking — the cases a composer weighs at this exact decision point>
- Refute it: is this a rule / flag / threshold / probability / fixed constant standing in for that reasoning? Name what
  a composer handles here that this DOES NOT. (If you write "nothing", you have not looked — every model drops a case.)
- Verdict: EMERGENT or STAMPED. If STAMPED, rework it until it emerges from the material; do not edit yet.

## EMERGENCE
What in the MATERIAL the decision derives from — the form, the harmonic tension, the melodic shape, the character's
genuine musical nature — rather than an independent value stamped on the side.

## PREFERENCE
Why it is a weighted lean, not a wall, and the legitimate possibility it must still allow.`;

if (ageMin(CHANGE) > FRESH_MIN)
  block(`No fresh .audit/change.md (needs to be < ${FRESH_MIN} min old).\n\n${TEMPLATE}`);

const md = readFileSync(CHANGE, 'utf8');
const section = name => { const m = md.match(new RegExp('^##\\s+' + name + '\\s*$([\\s\\S]*?)(?=^##\\s|$(?![\\s\\S]))', 'mi')); return m ? m[1].trim() : null; };

for (const [s, min] of [['PREMISE-CHALLENGE', 220], ['COMPOSER-CHECK', 220], ['EMERGENCE', 80], ['PREFERENCE', 50]]) {
  const body = section(s);
  if (!body) block(`.audit/change.md is missing the "## ${s}" section.\n\n${TEMPLATE}`);
  if (body.length < min) block(`The "## ${s}" section is too thin (${body.length} chars, need ${min}). Do the thinking; don't stub it.\n\n${TEMPLATE}`);
}

// The PREMISE-CHALLENGE must GENUINELY engage removal / reconception — the question skipped on the oom-pah. It is not enough
//   to have the header; the section has to actually consider not-doing-this / doing-it-differently, or it is a rubber stamp.
const premise = section('PREMISE-CHALLENGE').toLowerCase();
// stem alternatives (remov/delet/drop/reconceiv) are prefixes — NO trailing \b, so they match removal/removed/deleting/etc.
const engagesAlt = /\b(remov|delet|dropp?|get rid|without it|shouldn'?t (exist|be here)|does(n'?t| not) belong|not attempt|reconceiv|different approach|different way|wrong (element|texture|thing|frame|question|approach)|rethink)/.test(premise);
if (!engagesAlt)
  block(`## PREMISE-CHALLENGE never actually considers REMOVING this or doing it a DIFFERENT way — so it is a rubber stamp,\n`
      + `not the question. Before patching, state the real case that this thing should not exist here (or that the whole\n`
      + `approach is wrong), name concretely what that alternative would be, and only then why the change beats it. This is\n`
      + `the exact step skipped on the oom-pah-at-grade-2 patch.`);

const check = section('COMPOSER-CHECK').toLowerCase();

// The verdict must be EMERGENT. If it is STAMPED (or no verdict is stated), you don't get to edit — rework it first.
if (!/\bemergent\b/.test(check))
  block(`## COMPOSER-CHECK does not land on the verdict EMERGENT. If the decision is STAMPED (a rule/flag/threshold/`
      + `probability standing in for composer reasoning), rework it until it emerges from the material, then edit.\n\n${TEMPLATE}`);
if (/verdict:\s*stamped/.test(check))
  block(`## COMPOSER-CHECK's verdict is STAMPED. A stamped decision is structural debt — rework it to emerge from the\n`
      + `material (form / harmony / melody / the character's genuine nature) before editing.`);

// The refutation must be real: claiming the change misses nothing is the tell that you advocated instead of testing.
if (/(miss(es)?|drop(s)?|handle[sd]?)\s+(nothing|none|no\s+(case|use))/.test(check) || /\bnothing\s+(is\s+)?miss/.test(check))
  block(`## COMPOSER-CHECK claims the change misses nothing. That is advocacy, not a test — every model drops a case.\n`
      + `Name the boundary a composer would weigh here that this does not, and say why dropping it is acceptable for now.`);

// crit 2 — never justify from the OUTCOME.
const justif = (section('COMPOSER-CHECK') + '\n' + section('EMERGENCE') + '\n' + section('PREFERENCE')).toLowerCase();
const OUTCOME = [
  'sounds better', 'sounds right', 'sounds good', 'sounds more', 'sounds like', 'sounds nicer',
  'looks better', 'looks right', 'looks good', 'looks composer', 'looks more', 'looks like a composer',
  'the result', 'the output', 'ends up', 'turns out', 'turned out', 'resulting', 'the rendered',
  'reads better', 'reads well', 'makes it sound', 'makes it look', 'so it sounds', 'so it looks',
  'the piece sounds', 'comes out', 'the outcome', 'now it sounds', 'now it looks',
];
const hit = OUTCOME.find(p => justif.includes(p));
if (hit)
  block(`The reasoning justifies from the OUTCOME ("${hit}") — forbidden. Reason from HOW A COMPOSER THINKS while\n`
      + `writing (why the note/chord/figure IS what it is), never from what the result sounds or looks like.`);

// ===== ADVERSARIAL REVIEWER — independent of the change.md PROSE. The earlier checks read my JUSTIFICATION, which is
//   exactly what I can rationalize (author + judge). These two passes read OBJECTIVE signals a justification cannot
//   launder: the actual CODE this edit inserts, and the grammatical shape of the decision sentence. A literalization
//   dressed in composer prose still trips them, because they do not read the prose's argument — they read the construct.
//   Neither is a hard ban; each is escapable ONLY by CONFRONTING the flagged thing head-on in the change.md. =====
const insertedRaw = input.tool_name === 'Write' ? (input.tool_input?.content || '')
  : input.tool_name === 'MultiEdit' ? (input.tool_input?.edits || []).map(e => e.new_string || '').join('\n')
  : (input.tool_input?.new_string || '');
const code = insertedRaw.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');   // lint CODE, not comment prose
const mentions = kw => md.toLowerCase().includes(kw);

// PASS A — the DECISION as a UNIVERSAL. "every / always / at each / for all / whenever X" is the linguistic fingerprint
//   of a literalization (the "thicken EVERY pillar" tell — a composer-thought flattened into a blanket rule). It can be
//   legitimate (a real grade-canvas constant), but it must be CONFRONTED, not asserted: the change.md has to bound it.
const decisionLine = (md.match(/the decision:\s*([^\n]*)/i) || [])[1] || '';
const UNIV = /\b(every|always|at each|for (all|every)|whenever|any time|each (bar|beat|chord|note|piece|pillar|cadence|phrase)|must always|all (bars|chords|notes|pieces|cadences))\b/i;
const um = decisionLine.match(UNIV);
if (um && !/\b(lean|weighted|bounded|preference|reachable|still (allow|surface)|not a (wall|rule|gate)|situational|grade[- ]canvas|by construction)\b/i.test(check))
  block(`ADVERSARIAL: the decision is phrased as a UNIVERSAL ("${um[0]}") and the COMPOSER-CHECK never bounds it — the\n`
      + `fingerprint of a literalization (the "thicken every pillar" tell). Either it is a genuine grade-canvas / by-\n`
      + `construction invariant (say which, in the check), or rework it as a situational LEAN and name the case it must\n`
      + `still allow.`);

// PASS B — CODE stamp-SIGNATURES in the inserted code. The two least-ambiguous forms the memory names ("a probability /
//   dice roll", "a discrete archetype"). These pick BEHAVIOUR from a constant instead of deriving it from the material.
//   Weighted leans (w *= k, pick(w, rnd)) are NOT flagged — only a raw dice that GATES behaviour, or an archetype SET.
const tells = [];
if (/\b(Math\.random|rnd)\s*\(\s*\)\s*[<>]=?/.test(code))
  tells.push(['a behaviour-picking DICE — `rnd() < …` chooses a branch from a bare probability instead of weighting a reachable spread', ['\\bdice\\b', '\\bcoin[- ]?flip', 'probabil', 'bare (probability|random)', 'grade[- ]canvas']]);
if (/\[\s*(['"][a-z0-9_]{2,}['"]\s*,\s*){2,}['"][a-z0-9_]{2,}['"]\s*,?\s*\]/i.test(code))
  tells.push(['a discrete ARCHETYPE set — an array of >=3 string labels a value is chosen from (a template menu, not derived material)', ['archetype', 'discrete (set|menu)', 'enumerat', 'template menu', 'grade[- ]canvas', 'by construction']]);
for (const [desc, kws] of tells) {
  if (!kws.some(k => new RegExp(k, 'i').test(check)))
    block(`ADVERSARIAL: the inserted CODE contains ${desc}. That is a STAMP signature, and the COMPOSER-CHECK never\n`
        + `confronts it. The prose cannot stand in for the code — the construct is right there. Name it in the check and\n`
        + `prove the value FALLS OUT of the form / harmony / melody / character (not picked), or remove it.`);
}

allow();
