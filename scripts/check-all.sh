#!/bin/sh
# Every practice-log check. Run this before committing: a green run is the gate,
# not an afterthought.
#
#   scripts/*-test.mjs   fast, no dependencies — maths, rules, structure
#   scripts/wizard-e2e   boots the real page in a DOM and clicks the real
#                        buttons; needs `npm install` inside scripts/ once
set -e
cd "$(dirname "$0")/.."

# A suite's exit code has to survive the pipe to tail, or a failing suite still
# reports success and whatever runs after the gate goes ahead anyway.
run_suite() {
  printf '%-34s ' "$(basename "$1")"
  if out=$(node "$1" 2>&1); then
    printf '%s\n' "$out" | tail -1
  else
    printf '%s\n' "$out" | tail -3
    echo "GATE FAILED: $1"
    exit 1
  fi
}

python3 - <<'PY'
import re
b = re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', open('practice-log.html').read(), re.S)
open('/tmp/pl_check.js', 'w').write('\n;\n'.join(b))
PY
node --check /tmp/pl_check.js && echo "practice-log.html inline JS: OK"
node --check live-session.js && echo "live-session.js: OK"

for t in scripts/live-session-test.mjs scripts/live-window-test.mjs scripts/wiz-step-test.mjs; do
  run_suite "$t"
done

if [ -d scripts/node_modules/jsdom ]; then
  run_suite scripts/wizard-e2e.mjs
  run_suite scripts/wizard-refresh.mjs
  run_suite scripts/wizard-tabs.mjs
else
  echo "wizard-e2e.mjs                     SKIPPED — run: cd scripts && npm install"
  exit 1
fi
