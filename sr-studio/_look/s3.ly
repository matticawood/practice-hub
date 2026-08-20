\version "2.24.0"
\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 180\mm
  score-markup-spacing.basic-distance = #14 top-margin = 10\mm }
#(set-global-staff-size 20)
\score {
  \new PianoStaff <<
    \set PianoStaff.instrumentName = \markup \bold \large ""
    \new Staff { \set fingeringOrientations = #'(up) \tempo "Scherzando" \key f \major \time 2/4 f''4-4 c''4 d''4 c''4 c''4 g''4 a'4-1 f''4-5 f''4 c''4 bes'4 f''4 bes'4 f''4 c''4 f''4\fermata \bar "|." }
    \new Dynamics { s1\f s2 s2\ff s1\mf s1 }
    \new Staff { \clef bass \set fingeringOrientations = #'(down) \override Fingering.direction = #DOWN \override Fingering.staff-padding = #1.4 \key f \major \time 2/4 a4-3 f8-. f8-. d'8-1( e'8-2 f'8 f'8) c'8( bes8 c'4 f'4-> f4-5) a4 f8-. f8-. bes4( bes8-3) c'8 d'8 bes8 g4-1 f2\fermata \bar "|." }
  >>
}
