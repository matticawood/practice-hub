\version "2.24.0"
\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 180\mm
  score-markup-spacing.basic-distance = #14 top-margin = 10\mm }
#(set-global-staff-size 20)
\score {
  \new PianoStaff <<
    \set PianoStaff.instrumentName = \markup \bold \large ""
    \new Staff { \set fingeringOrientations = #'(up) \tempo "Tenderly" \key d \major \time 6/8 <fis'-1 a'-3>4. <fis' a'>4. <fis' b'>4. <fis' b'>4. <g' b'>4. <g' b'>4. <a' cis''>4. <a' cis''>4.\fermata <fis' a'>4. <fis' a'>4. <g' b'>4. <g' b'>4. <a' cis''>4. <a' cis''>4. a''4.-5 d''4. \bar "|." }
    \new Dynamics { s2.\p\< s4.\!\> s1 s1 s1 s1 s8 s2.\! }
    \new Staff { \clef bass \set fingeringOrientations = #'(down) \override Fingering.direction = #DOWN \override Fingering.staff-padding = #1.4 \key d \major \time 6/8 fis4.-3( d8. e16 fis8 b4.-3 d'8. cis'16 b8-1 g4-2 fis16 g16 e8. fis16 g8 <e a>4. a8. g16 a8\fermata fis4. d8. e16 fis8 g4. b8.-1 a16 g8 e4 fis16-3 g16 a4-- e8 d2.) \bar "|." }
  >>
}
