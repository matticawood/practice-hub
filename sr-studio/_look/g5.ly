\version "2.24.0"
\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 180\mm
  score-markup-spacing.basic-distance = #14 top-margin = 10\mm }
#(set-global-staff-size 20)
\score {
  \new PianoStaff <<
    \set PianoStaff.instrumentName = \markup \bold \large ""
    \new Staff { \set fingeringOrientations = #'(up) \tempo "Allegro giocoso" \key e \minor \time 3/8 g'16-1 r8 b'16-4 a'8 c''16( r8 c''8 b'16) a'4( g'16 a'16) b'16 r8 dis''16-3-> b'8 e''16-4 r8 c''16-5 b'8 a'16 r8 a'16-5 g'8 fis'4-- e'16 g'16 fis'8 e'4 \bar "|." }
    \new Dynamics { s1\mf\< s2 s1\ff\!\> s4 s4\! }
    \new Staff { \clef bass \set fingeringOrientations = #'(down) \override Fingering.direction = #DOWN \override Fingering.staff-padding = #1.4 \key e \minor \time 3/8 b,8-5-. r4 e8-. r8 gis8-2 a8-. r4 b8-1-. r4 g8-2-. r4 a8-. r4 d8-. r4 b8-1 e4 \bar "|." }
  >>
}
