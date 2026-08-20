\version "2.24.0"
\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 180\mm
  score-markup-spacing.basic-distance = #14 top-margin = 10\mm }
#(set-global-staff-size 20)
\score {
  \new PianoStaff <<
    \set PianoStaff.instrumentName = \markup \bold \large ""
    \new Staff { \set fingeringOrientations = #'(up) \tempo "Larghetto" \key g \minor \time 4/4 bes'2.-3( g'16 bes'8. ees''2.-5-- c''16 bes'8. c''2.-2 ees''8 f''16 ees''16 d''2. a'8-2 d''8) bes'2.( g'16 bes'8.-2 c''2. ees''16 d''16 c''8) a'2.( d''16 c''16 d''16 bes'16 a'4 g'4 ~ g'2) \bar "|." }
    \new Dynamics { s1\p\< s1\!\> s1 s2. s8 s8\! s1\pp s1 s1 s1\mp }
    \new Staff { \clef bass \set fingeringOrientations = #'(down) \override Fingering.direction = #DOWN \override Fingering.staff-padding = #1.4 \key g \minor \time 4/4 <g,-5 d-1>1 <g, g>2 c4-3 <ees-3 g-1>4 c1 <d g>1 <g, d>1 <c f>4 <c ees>4 <c d>4 <c ees>4 <d g>1 d4-1 g,4 ~ g,2 \bar "|." }
  >>
}
