## PREMISE-CHALLENGE
- What is a composer doing when they write in 6/8? Choosing a compound-time GENRE: a barcarolle or pastoral (a slow, lilting
  6/8 — a singing/gentle line), or a jig/gigue (a fast, bouncing 6/8 — a lively/dance line). The metre is not neutral; it
  belongs to characters whose feel is a compound lilt.
- Should this be built, or is there a case against / a different approach? The compound rhythm now works, but every 6/8
  piece comes out "singing" because NO character declares 6/8, so the selector silently falls back to the first character
  (CHARACTERS[0] = singing). Case for a different approach: maybe leave it as one character — but that fails "every piece
  different" outright (all 6/8 identical in character) and is just the silent-fallback bug, not a choice. So the fix is to
  give 6/8 to the characters whose feel it actually is: the lilting-smooth ones (a barcarolle / pastoral) and the lilting-
  crisp ones (a jig). NOT the duple march, nor the waltz/minuet (those ARE 3/4 ternary, a different lilt from compound), nor
  the stately grand.
- Why this wins: it makes the metre carry its real genres and gives 6/8 the same character spread simple metres have, so a
  6/8 piece can be a gentle barcarolle OR a lively jig, not always one thing. What it MISSES, honestly: (1) it does not add
  compound-specific melodic FIGURES (a jig's dotted bounce vs a barcarolle's rocking) beyond what the shared rhythm/pace/dot
  leans already give — a later refinement; (2) 3/8 (one compound beat a bar) is left to a later pass; (3) the FREQUENCY of
  compound vs simple at grade 4 is not yet tuned (measured next) — if compound is over-represented that is a separate weight.
- Verdict: EMERGENT — a character declares the metres its feel inhabits; 6/8 is added exactly to the characters whose nature
  is a compound lilt (barcarolle/pastoral/jig), read from what each character IS, not stamped on arbitrarily.

## COMPOSER-CHECK
- The decision: which characters may be written in 6/8.
- How a composer actually reasons it: 6/8 is a lilting compound metre — its genres are the barcarolle/pastoral (a slow
  singing lilt) and the jig/gigue (a quick bouncing one). So the singing/gentle/flowing characters and the lively/dance
  characters can inhabit it; the march (duple), the waltz/minuet (3/4 ternary), and the stately grand do not.
- Refute it: is this an arbitrary assignment? No — each character's `metres` already lists the metres its feel fits (a waltz
  is 3/4-only because it IS a waltz); adding 6/8 to the lilting characters is the same principle, matching the metre to the
  characters whose nature is compound. What it drops: a 6/8 MARCH (a real quickstep) and a 6/8 scherzo are plausible and
  not added here — a deliberate narrowing to the clearest compound genres for now.
  On the CODE construct (the `metres` array reads as a list of labels): it is NOT a template menu / discrete archetype a
  value is stamped from — it is the character's declared metre-FIT, the same enumeration every character already carries.
  The metre is DRAWN from the grade's own spec, and the character is then FILTERED by whether its metres list includes that
  drawn metre; the array is a fit-predicate on the character's nature, not a value picked from a menu.
- Verdict: EMERGENT — the metre is placed with the characters whose feel it is, the same way every other metre already sits
  with its characters.

## EMERGENCE
Each character's metre list expresses the metres its feel inhabits. 6/8 is added to the characters whose nature is a
compound lilt — the barcarolle/pastoral (singing, flowing, gentle) and the jig (lively, dance) — and withheld from the ones
it is not (march, waltz, minuet, grand). The selector then matches a drawn 6/8 to one of these by the same character-fit
logic it already uses for every metre.

## PREFERENCE
6/8 is added only to the compound-lilt characters, a spread (slow barcarolles AND fast jigs) so no single character owns it.
The character is still drawn by the existing metre-fit + under-use lean. March/waltz/minuet/grand keep their metres; nothing
forces a compound piece where the character is not one of these.
