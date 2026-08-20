\version "2.24.0"
\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 180\mm
  score-markup-spacing.basic-distance = #14 top-margin = 10\mm }
#(set-global-staff-size 20)
\score {
  \new PianoStaff <<
    \set PianoStaff.instrumentName = \markup \bold \large ""
    \new Staff { \set fingeringOrientations = #'(up) \tempo "Lullaby" \key bes \major \time 4/4 \partial 8 r8 bes4-1 f'4 d'4 f'4 <bes d'>2 ees'4-1 <g' bes'>4 ees'4 bes'4-4 g'4 bes'4 f'4 c''4 a'4 c''4 d'4-1 bes'4-5 f'4 bes'4 ees'4 bes'4 g'4 bes'4 ees'4 bes'4 g'4 bes'4 f'2 bes2-2 \bar "|." }
    \new Dynamics { \partial 8 s8\pp s1\< s1\mp\!\> s1 s1 s1 s1 s1 s4 s4\! s2 }
    \new Staff { \clef bass \set fingeringOrientations = #'(down) \override Fingering.direction = #DOWN \override Fingering.staff-padding = #1.4 \key bes \major \time 4/4 \partial 8 bes,8-5 d2( bes,2 g4-1 g4 ees2 d16 ees8 f16 g4 ~ g2 f4 c4-4 c2) d2 bes,2 ees4 ees4-3 g2 ees8. d16-1 ees4-2 ~ ees2 d4 bes,4 ~ bes,2 \bar "|." }
  >>
}
