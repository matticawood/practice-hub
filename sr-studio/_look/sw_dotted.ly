\version "2.24.0"
\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 180\mm
  score-markup-spacing.basic-distance = #14 top-margin = 10\mm }
#(set-global-staff-size 20)
\score {
  \new PianoStaff <<
    \set PianoStaff.instrumentName = \markup \bold \large ""
    \new Staff { \set fingeringOrientations = #'(up) \tempo "Adagio espressivo" \key c \major \time 4/4 <e'-1 g'-3>4. <e' g'>8 <e' g'>4. <e' g'>8 <e' a'>4. <e' a'>8 <e' a'>4. <e' a'>8 <f' a'>4. <f' a'>8 <f' a'>4. <f' a'>8 <g' b'>4. <g' b'>8 <g' b'>4. <g' b'>8 <e' g'>4. <e' g'>8 <e' g'>4. <e' g'>8 <f' a'>4. <f' a'>8 <f' a'>4. <f' a'>8 <g' b'>4. <g' b'>8 <g' b'>4. <g' b'>8 g''2-5 c''2 \bar "|." }
    \new Dynamics { s1\pp\< s1\!\> s1 s2. s8 s8\! s1\p\< s1\!\> s1 s1\! }
    \new Staff { \clef bass \set fingeringOrientations = #'(down) \override Fingering.direction = #DOWN \override Fingering.staff-padding = #1.4 \key c \major \time 4/4 e2-3 c2 a4-1 c'4-2 a2-1 f2. d16 f8. g4 g4 d4. r8 e2-3( c2 f4 f4-3 a2 d2.-4 e16 d8. c1) \bar "|." }
  >>
}
