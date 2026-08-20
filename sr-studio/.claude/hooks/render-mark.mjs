#!/usr/bin/env node
// PostToolUse (Bash) — records when a GENERATOR piece was RENDERED to notation, so the Stop hook can require a full
// note-by-note audit of it (Matthew's rule 4: "when you render, you audit it fully"). SCOPED TO THE GENERATOR: only
// fires when the work is in the sr-studio folder (the session cwd is inside it, or the command names it), so lilypond
// or rendering done anywhere else is never touched. Always exits 0 (never blocks a render).
import { readFileSync, writeFileSync } from 'fs';
const PENDING = decodeURIComponent(new URL('../../.audit/render-pending', import.meta.url).pathname);
let input; try { input = JSON.parse(readFileSync(0, 'utf8')); } catch { process.exit(0); }
const cmd = input.tool_input?.command || '';
const cwd = input.cwd || '';
const inGenerator = /sr-studio/.test(cwd) || /sr-studio/.test(cmd);
const isRender = /lilypond|--png|-dcrop|lilyWithMap|renderScore/.test(cmd);
if (inGenerator && isRender) {
  // Record WHICH session rendered, so the Stop hook only blocks that session
  // (a render in one session must not block an unrelated session from finishing).
  const sid = input.session_id || '';
  try { writeFileSync(PENDING, String(Date.now()) + '\nsession:' + sid + '\n' + cmd.slice(0, 300) + '\n'); } catch {}
}
process.exit(0);
