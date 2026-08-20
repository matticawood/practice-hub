\version "2.24.0"
\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 180\mm
  score-markup-spacing.basic-distance = #14 top-margin = 10\mm }
#(set-global-staff-size 20)
\score {
  \new PianoStaff <<
    \set PianoStaff.instrumentName = \markup \bold \large ""
    \new Staff { \set fingeringOrientations = #'(up) \tempo "Scherzando" \key a \major \time 6/8 <cis'-3 e'-5>4 <cis' e'>8 <cis' e'>4 <cis' e'>8 r8 <cis'-2 fis'-5>8-. <cis' fis'>8-. r8 <cis' fis'>8-. <cis' fis'>8-. <d'-1 fis'-3>4 <d' fis'>8 <d' fis'>4 <d' fis'>8 <e' gis'>4 <e' gis'>8 <e' gis'>4 <e' gis'>8 <cis' e'>4 <cis' e'>8 <cis' e'>4 <cis' e'>8 <d' fis'>4 <d' fis'>8 <d' fis'>4 <d' fis'>8 <e' gis'>4 <e' gis'>8 <e' gis'>4 <e' gis'>8 e''4.-5 a'4. \bar "|." }
    \new Dynamics { s4.\f s1 s1 s2 s8 s4.\ff s1 s1 s2 s8 }
    \new Staff { \clef bass \set fingeringOrientations = #'(down) \override Fingering.direction = #DOWN \override Fingering.staff-padding = #1.4 \key a \major \time 6/8 a4.-1 e4.-3 fis4.-- d4. fis4. d4-3 cis8 b,4. b,4 cis8 a4.-1 e4. d4. fis4. e4. e4-1 b,8 a,2. \bar "|." }
  >>
}
