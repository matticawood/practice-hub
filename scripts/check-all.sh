#!/bin/sh
# Every practice-log check. Run this before committing: a green run is the gate,
# not an afterthought.
#
#   scripts/*-test.mjs   fast, no dependencies — maths, rules, structure
#   scripts/wizard-e2e   boots the real page in a DOM and clicks the real
#                        buttons; needs `npm install` inside scripts/ once
set -e
cd "$(dirname "$0")/.."

python3 - <<'PY'
import re
b = re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', open('practice-log.html').read(), re.S)
open('/tmp/pl_check.js', 'w').write('\n;\n'.join(b))
PY
node --check /tmp/pl_check.js && echo "practice-log.html inline JS: OK"
node --check live-session.js && echo "live-session.js: OK"

for t in scripts/live-session-test.mjs scripts/live-window-test.mjs scripts/wiz-step-test.mjs; do
  printf '%-34s ' "$(basename "$t")"
  node "$t" | tail -1
done

if [ -d scripts/node_modules/jsdom ]; then
  printf '%-34s ' "wizard-e2e.mjs"
  node scripts/wizard-e2e.mjs | tail -1
  printf '%-34s ' "wizard-refresh.mjs"
  node scripts/wizard-refresh.mjs | tail -1
else
  echo "wizard-e2e.mjs                     SKIPPED — run: cd scripts && npm install"
  exit 1
fi
