\version "2.24.0"
\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 180\mm
  score-markup-spacing.basic-distance = #14 top-margin = 10\mm }
#(set-global-staff-size 20)
\score {
  \new PianoStaff <<
    \set PianoStaff.instrumentName = \markup \bold \large ""
    \new Staff { \set fingeringOrientations = #'(up) \tempo "Allegro giocoso" \key a \minor \time 6/8 <c'-1 e'-3>4. <c' e'>4. <c' f'>4. <c' f'>4. <d'-1 f'-3>4. <d' f'>4. <e' gis'>4. <e' gis'>4. <c' e'>4. <c' e'>4. <d' f'>4. <d' f'>4. <e' gis'>4. <e' gis'>4. e''4.-5 a'4.\fermata \bar "|." }
    \new Dynamics { s4.\p s1 s1 s2 s8 s4.\pp s1 s1 s2 s8 }
    \new Staff { \clef bass \set fingeringOrientations = #'(down) \override Fingering.direction = #DOWN \override Fingering.staff-padding = #1.4 \key a \minor \time 6/8 e4.-3( c4. f4.-3 a4.) f4. d4 d8-2 e4.( b,4. a,4. a,4 b,8 d4. f4.-1) b,4.-4 e4 b,8 a,2.\fermata \bar "|." }
  >>
}
