\version "2.24.0"
\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 180\mm
  score-markup-spacing.basic-distance = #14 top-margin = 10\mm }
#(set-global-staff-size 20)
\score {
  \new PianoStaff <<
    \set PianoStaff.instrumentName = \markup \bold \large ""
    \new Staff { \set fingeringOrientations = #'(up) \tempo "Scherzando" \key g \major \time 3/4 \partial 4 a'4-1 b'8 r8 g'4-1 b'8 b'8-2 e''8 r8 e''8-3 fis''8 g''8 g''8 c''8-> c''8-3 d''2 a'8 a'8 d''8 d''8 a'8 a'8 d''8-4( r8 g''4-5 d''8 d''8-4 c''8 d''8 e''8 c''8 g'8-1 c''8 d''8 c''8 d''4. r8 <g'-2 c''-5>4 <g'-1 b'-3>4 g'4) \bar "|." }
    \new Dynamics { \partial 4 s1\mp s1\mf s1 s4 s1\p s1 s4 s2.\mf }
    \new Staff { \clef bass \set fingeringOrientations = #'(down) \override Fingering.direction = #DOWN \override Fingering.staff-padding = #1.4 \key g \major \time 3/4 \partial 4 r4 g,4-5-. r4 <b-3 d'-1>4-. g,4-1-. r4 <b-5 e'-2>4-. <a,-5 e-1>4 d4 <fis-3 a-1>4 d4 <fis a>2 b,4-5-. r4 <d'-4 g'-1>4-. <e-5 c'-1>4 a,4-1 <e-5 cis'-1>4 <d a>4 g,4-1 <d-5 b-1>4 d4-1 g,2 \bar "|." }
  >>
}
