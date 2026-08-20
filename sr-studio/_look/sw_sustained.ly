\version "2.24.0"
\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 180\mm
  score-markup-spacing.basic-distance = #14 top-margin = 10\mm }
#(set-global-staff-size 20)
\score {
  \new PianoStaff <<
    \set PianoStaff.instrumentName = \markup \bold \large ""
    \new Staff { \set fingeringOrientations = #'(up) \tempo "Allegretto" \key a \major \time 6/8 <cis'-1 e'-3>2. <cis' fis'>2. <d' fis'>2. <e' gis'>2. <cis' e'>2. <d' fis'>2. <e' gis'>2. e''4.-5 a'4. \bar "|." }
    \new Dynamics { s4.\pp s1 s1 s2 s8 s4.\mp s1 s1 s2 s8 }
    \new Staff { \clef bass \set fingeringOrientations = #'(down) \override Fingering.direction = #DOWN \override Fingering.staff-padding = #1.4 \key a \major \time 6/8 cis4.-3 a,8. b,16 cis8 fis4.-3 a8. gis16 fis8 d8( d8-2 cis8 b,16 cis16 d8 d8 e4.-- b,4 e8) cis4. a,8. b,16 cis8 d4. b,8. cis16 d8 e8 cis8 d8 cis16 b,16 cis8 b,8 a,2. \bar "|." }
  >>
}
