## PREMISE-CHALLENGE
- What is a player doing when the line travels beyond one hand? They read it as a SEQUENCE OF GESTURES and finger each by
  what it IS: a scale by its conventional key fingering (thumb on the tonic/subdominant degrees, off the black keys, the
  thumb passing under onto white); an arpeggio by its chord shape (1-3-5, thumb under at the octave, reserve the outer
  finger); a positional stretch by the placed hand (read the finger off it); a leap by lifting and re-placing. The hand is
  carried across, moving only at a comfortable moment. Nothing is optimised — a player KNOWS a scale's fingering, they don't
  search for it.
- Should the travelling hand be fingered by a cost-DP at all? The strongest case against: a scale is not a cost, it is a
  known gesture, and the DP reconstructs "scale/arpeggio/reposition" from travel numbers — which it gets wrong about HALF the
  time on real scales (observed: F major came out 1-3-1-2-3-4-5 not 1-2-3-4-1-2-3; Eb wobbled 4-3-4; an F-major run slid
  2-2 on a step). The gesture reasoner (fingerHand) fingers those SAME scales conventionally (1-2-3-4-1-2-3, thumb off black,
  no slide) and passes all 22 canonical scale/arpeggio cases. So for the travelling hand the DP is the proxy that holes; the
  gesture reasoner fingers by the idiom, which is how a player actually reads it.
- Why this wins over keeping the DP: it removes the guess for the gesture that the DP most often botches (scales), and it
  fingers arpeggios/leaps by their idiom too. The positional stretches WITHIN a travelling line already have the clean
  placement core (this same change's earlier step routes any one-hand-span line there). So the whole fingerer becomes
  gesture/placement-based, no cost-guess anywhere.

## COMPOSER-CHECK
- The decision: how to finger a hand whose line reaches beyond one five-finger position.
- How a player reasons it: segment into gestures (scale / arpeggio / positional / leap), finger each by its idiom, carry the
  hand; the move between gestures happens at a comfortable moment and by the gesture's mechanism (thumb-under in a scale, a
  reposition on a leap).
- Refute it: is routing to the gesture reasoner just swapping one black box for another? No — the gesture reasoner fingers by
  the NAMED idiom of each gesture (verified: conventional on all 22 canonical scales/arpeggios, and on the real scales the DP
  botched), where the DP fingers by a travel-cost proxy for those idioms. The one weak part of the gesture reasoner was its
  POSITIONAL fingering; the span-based routing sends one-hand-span lines to the placement core instead, so the travelling
  path is left fingering the gestures it does get right. Open: its opening finger on an isolated scale fragment can sit high
  (pinky not 3) — in a real line the carried hand sets it; watch for it in the renders.
- Verdict: EMERGENT — each gesture is fingered by its own musical nature, not a cost stamped on the side.

## EMERGENCE
Derives from the gesture each stretch of the line actually is (its interval pattern: steps → scale, skips → arpeggio, a fit
under one hand → positional, a big leap → reposition), read from the notes; the fingering is that gesture's conventional
idiom, carried across the hand.

## PREFERENCE
The conventional scale/arpeggio fingerings are the [T]/idiom a player knows (thumb-off-black in a scale is near-absolute);
the placement within a positional stretch is the by-construction read-off. The weighted leans live in the gesture choices
the composer already made (where a scale/arpeggio/leap sits). A hand that fits one position never reaches this path (it goes
to the placement core); only a genuinely travelling hand does.
