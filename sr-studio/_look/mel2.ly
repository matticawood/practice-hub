\version "2.24.0"
\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 180\mm
  score-markup-spacing.basic-distance = #14 top-margin = 10\mm }
#(set-global-staff-size 20)
\score {
  \new PianoStaff <<
    \set PianoStaff.instrumentName = \markup \bold \large ""
    \new Staff { \set fingeringOrientations = #'(up) \tempo "Grandly" \key c \major \time 2/4 <e'-1 g'-3>2 <e' a'>2 <g' b'>2 <e' g'>2\fermata <f' a'>2 <f' a'>2 <f' a'>2 g''4-5 c''4 \bar "|." }
    \new Dynamics { s2\pp\< s1\mp\!\> s1 s1 s2\! }
    \new Staff { \clef bass \set fingeringOrientations = #'(down) \override Fingering.direction = #DOWN \override Fingering.staff-padding = #1.4 \key c \major \time 2/4 e16-3( c8 d16 c4-- a4-2-> c'4-1) g8-. f16-1-. e16-. d16-. e16-. f16-. g16-5-. c'4( g8.-1 c16->\fermata f8. e16 f8. e16 d8 c8 d8. e16) f8-. e16-. d16-. c16-. d16-. c16-. d16-. c2 \bar "|." }
  >>
}
