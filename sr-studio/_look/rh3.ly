\version "2.24.0"
\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 180\mm
  score-markup-spacing.basic-distance = #14 top-margin = 10\mm }
#(set-global-staff-size 20)
\score {
  \new PianoStaff <<
    \set PianoStaff.instrumentName = \markup \bold \large ""
    \new Staff { \set fingeringOrientations = #'(up) \tempo "Con brio" \key f \major \time 2/4 \partial 8 r8 <a'-1 c''-3>2 <a' d''>2 <bes' d''>2 <c'' e''>2 <a' c''>2 <bes' d''>2 <c'' e''>2 c''4-1 f''4\fermata \bar "|." }
    \new Dynamics { \partial 8 s8\p s2\< s1\mf\!\> s1 s1 s2\! }
    \new Staff { \clef bass \set fingeringOrientations = #'(down) \override Fingering.direction = #DOWN \override Fingering.staff-padding = #1.4 \key f \major \time 2/4 \partial 8 g8-4 a8-. g8-. f4 d'4-2( f'4-1) bes4-3( g8 bes8 c'4 c'8-1) bes8 a8-. g8-. f4 bes4-3( d'4) g4-4( a8 g8 f2\fermata) \bar "|." }
  >>
}
