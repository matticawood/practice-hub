\version "2.24.0"
\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 180\mm
  score-markup-spacing.basic-distance = #14 top-margin = 10\mm }
#(set-global-staff-size 20)
\score {
  \new PianoStaff <<
    \set PianoStaff.instrumentName = \markup \bold \large ""
    \new Staff { \set fingeringOrientations = #'(up) \tempo "Scherzando" \key ees \major \time 3/8 bes'4-4 g'8 c''4-> bes'8 aes'8 g'8 aes'8 <f' bes'>4 f'8 ees'4-2 f'8-1 aes'4-- g'8 aes'8 aes'8 g'8 f'8 ees'4-2 \bar "|." }
    \new Dynamics { s1\f s8 s4.\ff s1\mf s2 }
    \new Staff { \clef bass \set fingeringOrientations = #'(down) \override Fingering.direction = #DOWN \override Fingering.staff-padding = #1.4 \key ees \major \time 3/8 ees8-5 <g bes>8 bes,8-5 ees8-. r8 g8-5 aes8-5 <c' ees'>8 aes8-1 bes,8-5 <d aes>8 bes,8-3 g,8 r8 <ees-5 bes-1>8 aes8 c'8 ees'8 aes8 c'8 ees'8-2 bes8-1 ees4 \bar "|." }
  >>
}
