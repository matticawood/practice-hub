\version "2.24.0"
\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 180\mm
  score-markup-spacing.basic-distance = #14 top-margin = 10\mm }
#(set-global-staff-size 20)
\score {
  \new PianoStaff <<
    \set PianoStaff.instrumentName = \markup \bold \large ""
    \new Staff { \set fingeringOrientations = #'(up) \tempo "Andante dolce" \key g \major \time 6/8 b'16-3( g'8. a'8 g'4. e''16-3 g''8. fis''8 g''4.-- c''4. e''8. fis''16 e''8 d''8. c''16 b'8-3 a'4.) b'16 g'8. a'8 g'4. c''8. d''16 c''8 e''4. a'4.-2 fis'8.-1 a'16-2 d''8 b'4. g'4. \bar "|." }
    \new Dynamics { s4.\pp\< s1 s1 s1 s4. s4.\mp\!\> s1 s2 s4.\! }
    \new Staff { \clef bass \set fingeringOrientations = #'(down) \override Fingering.direction = #DOWN \override Fingering.staff-padding = #1.4 \key g \major \time 6/8 g8-5 <b d'>8 <b d'>8 r8 <b d'>8 <b d'>8 g8 <b e'>8 <b e'>8 r8 <b e'>8 <b e'>8 <a-5 c'-3>4. a8 <cis' e'>4 d8-1 <fis-3 a-1>8 <fis a>8 d4.-3 b,8 <d g>8 <d g>8 b,4. c8-5 <e g>8 <e g>8 c4. d8 <fis a>8 <fis a>8 d4. d'4.-1 g4. \bar "|." }
  >>
}
