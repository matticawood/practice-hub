\version "2.24.0"
\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 180\mm
  score-markup-spacing.basic-distance = #14 top-margin = 10\mm }
#(set-global-staff-size 20)
\score {
  \new PianoStaff <<
    \set PianoStaff.instrumentName = \markup \bold \large ""
    \new Staff { \set fingeringOrientations = #'(up) \tempo "March" \key b \minor \time 2/4 r8 <d'-1 fis'-3>8 r8 <d' fis'>8 r8 <d'-1 g'-4>8 r8 <d' g'>8 r8 <e' g'>8 r8 <e' g'>8 r8 <fis' ais'>8 r8 <fis' ais'>8 r8 <d' fis'>8 r8 <d' fis'>8 r8 <e' g'>8 r8 <e' g'>8 r8 <fis' ais'>8 r8 <fis' ais'>8 fis''4-5 b'4 \bar "|." }
    \new Dynamics { s2\mp\< s1\!\> s4. s8\! s1\pp s1\mp }
    \new Staff { \clef bass \set fingeringOrientations = #'(down) \override Fingering.direction = #DOWN \override Fingering.staff-padding = #1.4 \key b \minor \time 2/4 fis8-3 r8 d4 g8 r8 b8-1 g8 e4 g8 g8-1 fis8 fis8 cis8 cis8 fis8 r8 d4 e4 g4-- cis4-4 d8 cis8 b,2 \bar "|." }
  >>
}
