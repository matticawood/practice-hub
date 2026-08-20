#!/bin/sh
# Every practice-log suite, plus a syntax check of the page's inline scripts.
# Run this before committing: a green run is the gate, not an afterthought.
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
  printf '%s: ' "$t"
  node "$t" | tail -1
done
