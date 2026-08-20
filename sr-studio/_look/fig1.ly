\version "2.24.0"
\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 180\mm
  score-markup-spacing.basic-distance = #14 top-margin = 10\mm }
#(set-global-staff-size 20)
\score {
  \new PianoStaff <<
    \set PianoStaff.instrumentName = \markup \bold \large ""
    \new Staff { \set fingeringOrientations = #'(up) \tempo "Allegro giocoso" \key f \major \time 3/8 f'4-1 g'8 d''4-5-> c''8 g'8 a'8 bes'8 c''4 g'8 f'4-2 g'8-1 bes'4 c''8 d''8( c''8 a'8 g'8 f'4-2) \bar "|." }
    \new Dynamics { s1\mp s8 s4.\mf s1\p s2 }
    \new Staff { \clef bass \set fingeringOrientations = #'(down) \override Fingering.direction = #DOWN \override Fingering.staff-padding = #1.4 \key f \major \time 3/8 f8-5 r8 <a c'>8 f8 r8 <a-4 d'-1>8 g8 r8 <bes d'>8 c8-1-. <e-3 g-1>8-. bes,8-3 a,8 r8 <c-4 f-1>8 <d f>8 <d f>8 <d f>8 bes,8 r8 <d f>8 c'8-1 f4 \bar "|." }
  >>
}
