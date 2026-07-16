# First Steps: the rethink (grounded in how real method books work)

After researching how the major beginner method books (Faber Piano Adventures, Piano Safari, Alfred's, Bastien, John Thompson, Michael Aaron) actually teach and lay out their first pages. Sources are teacher reviews, publisher unit guides, a peer-reviewed cognitive-load study, and a full scan of Thompson Book 1. Verified findings below.

## The two mistakes in what I built

1. **Pedagogically, I built the traditional "hard" approach.** My lesson reads middle C straight off the stave from the first exercise (whole notes in the grand-stave position). That is the John Thompson (1936) / Michael Aaron model, and the consensus in the research is that immediate grand-stave reading is **too much for a never-touched-a-piano beginner**. A peer-reviewed study confirms notation processing is cognitively heavy and crowds out the actual job of coordinating hands. Modern methods deliberately avoid it.

2. **Technically, I used the wrong tool.** The generic lesson-block system (text blocks + abcjs staves) cannot render the things a real first page is made of, keyboard hand-position diagrams, finger numbers in circles, off-staff "pre-reading" notation, big note-name letters. So I kept producing "a bit of text and a marooned little note on an empty stave." No amount of patching fixes that; the medium is wrong for pages 1 to ~15.

## What the research actually found (verified)

**Modern best-practice (Faber Piano Adventures Primer, the current gold standard):**
- Opens with **"Introduction to Playing": posture, hand position, finger numbers, up/down direction, black vs white keys, all BEFORE any notes.**
- Starts on the **black-key groups** (twos and threes) for keyboard geography.
- **Pre-reading comes first**: "directional reading off the staff... note movement up, down, or repeating," for roughly the **first half of the book**. No stave yet.
- Hand-position moves shown with a **circled finger number**.
- Staff reading, when it arrives, begins with **three landmark guide notes: Middle C, Treble G, Bass F**, then fills in the notes between them. Reading is by **landmark + interval (direction/steps/skips), not letter-naming**.

**Piano Safari (modern, rote-first):** beginners learn **rote pieces by imitation and pattern/contour before reading at all**; reading is later and **intervallic**. Rote-first deliberately relieves the visual/notation load.

**Traditional (Thompson, Michael Aaron):** grand-stave middle-C reading from day one, note names + finger numbers printed on big staves with cartoon illustrations. Widely criticised now as too hard for absolute beginners. (One empirical study found middle-C readers were not actually worse on most single-note tasks, so it is not worthless, just heavy as an opener.)

**Consensus principles for a true beginner:**
- **Physical setup first** (posture, hand, finger numbers), **then keyboard geography** (black-key groups), **then play**, **then gradually reading.**
- **Rote / play-by-ear / directional first** to keep cognitive load low; the stave is introduced slowly.
- **Read in patterns, not note-by-note.** Landmark + interval beats letter-naming.
- **One new idea at a time**; the music dominates the page; keep explanation minimal.

## The day-one blueprint I'd now follow

A short **pre-staff on-ramp**, then a **gentle landmark-based** move to the stave, matching Faber and aligning with your own teaching (your Theory course already teaches the **landmark system over mnemonics**, and your philosophy is reading-led but not exam-led):

1. **Get set up.** Seat height/distance (your right-angle guidance). Finger numbers. No notes.
2. **Find your way on the keys.** Black-key groups of two and three; find any C; find middle C. Play freely on the black keys (they cannot sound wrong) to get comfortable making sound.
3. **Play by finger number, off the stave.** First little pieces shown as **finger numbers + up/down direction** (and note letters), played by pattern, counting a steady pulse. This is where whole/half/quarter *feel* is built, by counting, not by reading a stave.
4. **Then the stave, gently, by landmark.** Introduce **middle C** as the anchor, then **treble G and bass F** as guide notes; read by direction and step from them. The pieces they already play by finger number now appear on the stave.
5. **Rhythm and hands** grow from there (your existing whole -> half -> quarter idea is right; it just belongs *after* the pre-staff phase, tied to counting first).

This is a real rethink of the sequence: **day one is not "read middle C on the stave." Day one is get comfortable, find the keys, and play by finger number while feeling the beat.** The stave comes once they are already playing.

## The presentation/tech rethink (the root of "it doesn't look right")

The first pages need visuals the lesson-block system does not have. Options, in the order I'd weigh them:

- **A. A small set of purpose-built "First Steps" page components** (designed HTML/SVG blocks): a big keyboard hand-position diagram with circled finger numbers; off-staff "finger-number + direction" notation; and, later, big landmark staves. Built once, reused across the ~12 pages. Most work up front, but it is the only thing that will actually look like a method book *and* stay interactive (tap to hear, etc.). This is my recommendation.
- **B. Engrave/design each page as an image** (in a proper notation/graphics tool) and embed it, with a separate play button. Looks exactly right, fastest to "book quality," but static (no per-note interactivity) and every edit is a re-export.
- **C. Keep the block system** and accept it will always read like an article with exercises. (Rejected, this is what we have.)

## The decisions I need from you

1. **Pedagogy: pre-staff-first, or straight to the stave?** The research strongly favours a pre-staff on-ramp for a true beginner. But your instinct has been reading-led. My recommendation is the **hybrid above**: a short pre-staff phase (get comfortable + play by finger number) then the stave *early* via landmark notes, so reading still starts quickly but is not the very first thing. Do you want that, or do you want to keep reading the stave from the first piece?
2. **Reading system once the stave arrives: landmark** (middle C / treble G / bass F guide notes, as your Theory course already does) — agreed, or a strict middle-C position?
3. **Presentation: A (purpose-built page components), B (designed page images), or C.** This decides whether First Steps gets its own page format or keeps using generic blocks.

Once you steer those three, I will design the actual page-by-page structure (not patch the current lesson) and only then build.
