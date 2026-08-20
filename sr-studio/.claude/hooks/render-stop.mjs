#!/usr/bin/env node
// Stop hook — enforces Matthew's rule 4: whenever a piece has been RENDERED, it must be FULLY audited (note by note,
// both hands, every symbol) before the turn can end. If a render is pending and no full audit newer than it exists,
// the stop is blocked. Writing .audit/full-audit.md (a real, per-symbol audit referencing the rendered .png) satisfies
// it. Block = exit 2 (stderr shown to Claude, who then keeps working).
import { readFileSync, statSync } from 'fs';
const base = decodeURIComponent(new URL('../../.audit/', import.meta.url).pathname);
const PENDING = base + 'render-pending';
const AUDIT = base + 'full-audit.md';

const allow = () => process.exit(0);
const mtime = p => { try { return statSync(p).mtimeMs; } catch { return null; } };

const pend = mtime(PENDING);
if (pend == null) allow();                                    // nothing rendered since last audit
if ((Date.now() - pend) / 60000 > 60) allow();               // a STALE marker (from an earlier session) never blocks unrelated later work — generator-scoped

// Only the session that DID the render has to audit it. Without this, a render in
// one session blocked every other concurrent session from finishing — including
// sessions doing unrelated work, which cannot honestly audit a piece they never made.
let hookIn = {}; try { hookIn = JSON.parse(readFileSync(0, 'utf8')); } catch {}
const me = String(hookIn.session_id || '');
let marker = ''; try { marker = readFileSync(PENDING, 'utf8'); } catch {}
const owner = (marker.match(/^session:([0-9a-fA-F-]{36})$/m)
            || marker.match(/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/) || [])[1];
if (owner && me && owner.toLowerCase() !== me.toLowerCase()) allow();   // someone else's render

const aud = mtime(AUDIT);
const fail = m => { process.stderr.write('\n[render-stop] CANNOT FINISH YET\n' + m + '\n'); process.exit(2); };

if (aud == null || aud < pend)
  fail(`You rendered a piece but have not fully audited it. Do the FULL note-by-note audit now — write it to\n`
     + `.audit/full-audit.md: bar by bar, BOTH hands, every note / finger / dynamic / accidental / slur, each marked\n`
     + `right / wrong / legitimately-fine with the reason. Reference the rendered .png. Then you may finish.`);

// The audit exists and is newer than the render — check it is actually substantial and points at a rendered image.
let md = ''; try { md = readFileSync(AUDIT, 'utf8'); } catch {}
const audSec = (md.match(/^##\s+AUDIT\s*$([\s\S]*?)(?=^##\s|$(?![\s\S]))/mi) || [])[1] || '';
if (audSec.trim().length < 300 || !/\.png/.test(md))
  fail(`.audit/full-audit.md is too thin or does not reference the rendered .png. A full audit enumerates every symbol\n`
     + `in both hands, bar by bar — don't summarise. Complete it, then finish.`);

allow();
