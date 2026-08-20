# Composer-discipline hooks (generator-scoped)

Three guardrails that keep the sr-studio generator work honest. They ONLY affect the generator, everything else you do
is untouched.

- **change-gate** (before an edit to an `sr-studio/*.mjs` file): refuses the edit unless a fresh `sr-studio/.audit/change.md`
  passes the ADVERSARIAL composer test — it does not accept a justification. Required sections:
  `## COMPOSER-CHECK` (the decision; how a composer actually reasons it; a real attempt to REFUTE the change as a
  rule/flag/threshold/probability standing in for reasoning, naming what it MISSES; and a verdict, EMERGENT or STAMPED),
  `## EMERGENCE` (what in the MATERIAL the decision derives from), and `## PREFERENCE` (a lean, not a wall). It blocks if
  the verdict is STAMPED, if the refutation claims the change misses nothing, or if any reasoning is outcome-justified.
  The point: a stamped decision is deferred structural debt, so the gate makes you land on emergent or not edit. Edits to
  ANY other file (anywhere in Piano Practice Daily, or a non-`.mjs` file) pass straight through.
- **render-mark / render-stop** (after an sr-studio render, before finishing): won't let the turn end until a full
  note-by-note audit exists at `sr-studio/.audit/full-audit.md`. Only triggers for renders done in the sr-studio folder;
  a stale marker older than an hour never blocks unrelated later work.

## Where the pieces live

- **Settings (the wiring):** `Piano Practice Daily/.claude/settings.json` — because that is the folder you open. It
  points at the scripts below by absolute path.
- **Scripts (the logic):** `The Practice Room Database/sr-studio/.claude/hooks/*.mjs` — they stay here with the generator.
- **Working notes:** `sr-studio/.audit/change.md` and `sr-studio/.audit/full-audit.md`.

## Turning them on (Mac desktop app)

There is no `/hooks` menu in the desktop app. Hooks are enabled by **trusting the project folder**:

1. Open the **Piano Practice Daily** folder in the desktop app (the folder you normally work from).
2. If it asks **"Do you trust this project?"**, click **Accept**. That is the on-switch.
   (If it does not re-ask because you trusted it long ago, reopening the folder makes the app pick up the new settings.)

## Checking it worked

Ask Claude to make a trivial edit to a generator file (e.g. `sr-studio/compose.mjs`) **without** writing a reasoning
note. It should be refused with `[change-gate] EDIT BLOCKED`. An edit to a non-generator file should NOT be blocked.

## Turning them off or changing them

- Off: delete the `"hooks"` block from `Piano Practice Daily/.claude/settings.json`.
- Read exactly what they check: the short, commented scripts in `sr-studio/.claude/hooks/`.
- Tune: freshness window `FRESH_MIN` and the banned "outcome" phrases (`OUTCOME` array) are at the top of
  `change-gate.mjs`.
