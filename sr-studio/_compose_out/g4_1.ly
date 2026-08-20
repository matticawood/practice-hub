\version "2.24.0"
\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 180\mm
  score-markup-spacing.basic-distance = #14 top-margin = 10\mm }
#(set-global-staff-size 20)
\score {
  \new PianoStaff <<
    \set PianoStaff.instrumentName = \markup \bold \large ""
    \new Staff { \set fingeringOrientations = #'(up) \tempo "Andante grazioso, quasi siciliano" \key g \major \time 6/8 d''8.-3( c''16 d''8 dis''8. d''16 c''8 c''8.-3 b'16 c''8 d''8. c''16 b'8 a'8. b'16 cis''8 d''4. d''8.) cis''16 d''8 a'4. g''8.-5( f''16 g''8 fis''8. f''16 d''8-3 e''8. d''16 c''8 d''8. c''16 b'8 d''8. c''16 b'8 a'8.-4 b'16 fis'8 g'2.--\fermata) \bar "|." }
    \new Dynamics { s4.\p s1 s2 s2.\< s4.\! s2.\mf s2.\> s4.\p s1 s8 }
    \new Staff { \clef bass \set fingeringOrientations = #'(down) \override Fingering.direction = #DOWN \override Fingering.staff-padding = #1.4 \key g \major \time 6/8 g,8.-5 d16 b,8 g,8. d16 b,8 a,8. d16 c8 g,8. d16 b,8 a,8. cis16 e8 d4.-1 d,4.-5 a,4. c,8.-5 g,16-2 e,8 d,8. a,16-2 fis,8 e,8. b,16 g,8 g,8.-5 d16 b,8 d,8.-5 a,16 fis,8 d,8. c16-1 a,8 g,2.\fermata \bar "|." }
  >>
}
