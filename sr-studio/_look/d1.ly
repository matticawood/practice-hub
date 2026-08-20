\version "2.24.0"
\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 180\mm
  score-markup-spacing.basic-distance = #14 top-margin = 10\mm }
#(set-global-staff-size 20)
\score {
  \new PianoStaff <<
    \set PianoStaff.instrumentName = \markup \bold \large ""
    \new Staff { \set fingeringOrientations = #'(up) \tempo "Giocoso" \key d \major \time 4/4 \partial 4 fis'4-3 d'2. fis'4 b'2.-3 d''8-. b'8-. e'8-1-> fis'8 e'4 ~ e'4 b'4-- a'2.-5 e'8-. a'8-.\fermata d'2. fis'4-2 g'2. b'8-. a'8-. g'8 fis'8 g'4 ~ g'4 a'4-5 g'4 fis'4 d'2 \bar "|." }
    \new Dynamics { \partial 4 s4\p s1\< s1\mf\!\> s1 s1 s1 s1 s1 s2 s2\! }
    \new Staff { \clef bass \set fingeringOrientations = #'(down) \override Fingering.direction = #DOWN \override Fingering.staff-padding = #1.4 \key d \major \time 4/4 \partial 4 r4 d,4-1 <fis-3 a-1>8 <fis a>8 <fis a>8 <fis a>8 <fis a>4 d,4-1 r4 <fis-4 b-1>8 <fis b>8 <fis b>4 <e-5 b-1>2 e4 <gis b>4 a,4-1 <cis'-3 e'-1>4 <cis' e'>4 <e-5 cis'-1>4\fermata fis,4-1 r4 <d-5 a-1>8 <d a>8 <a-4 d'-1>4 g,4-1 r4 <b-3 d'-1>8 <b d'>8 <b d'>4 <g b>2 d4 <fis a>4 a4 d4 ~ d2 \bar "|." }
  >>
}
