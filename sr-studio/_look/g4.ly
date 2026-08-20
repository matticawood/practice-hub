\version "2.24.0"
\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 180\mm
  score-markup-spacing.basic-distance = #14 top-margin = 10\mm }
#(set-global-staff-size 20)
\score {
  \new PianoStaff <<
    \set PianoStaff.instrumentName = \markup \bold \large ""
    \new Staff { \set fingeringOrientations = #'(up) \tempo "Andante cantabile" \key d \minor \time 6/8 d''16-5( c''8. bes'8 a'8 a'8 g'16 a'16 bes'16 c''8. bes'8 d''8 c''8 bes'16 c''16 bes'4. d''8. c''16 bes'8 a'8. g'16 f'8-4 e'8 c'8 d'16 e'16\fermata) f'16( e'8. f'8 d'8 e'8-1 f'8 g'16 f'8. f'8 g'8 f'8 g'16 f'16) e'4.( a'4 bes'8 <f' a'>4. d'4.-1) \bar "|." }
    \new Dynamics { s2.\mp s4.\> s1 s2. s16 s16\! s4.\p s1 s1 s2 s8 }
    \new Staff { \clef bass \set fingeringOrientations = #'(down) \override Fingering.direction = #DOWN \override Fingering.staff-padding = #1.4 \key d \minor \time 6/8 r8 <f-5 a-3>8 <f a>8 d,8-1 <f a>8 <f a>8 r8 <f bes>8 <f bes>8 d,8-1 <f bes>8 <f bes>8 <g,-5 d-1>2. <a,-4 d-1>2.\fermata r8 <a-5 d'-2>8 <a d'>8 f,8-1 <a d'>8 <a d'>8 r8 <bes-3 d'-1>8 <bes d'>8 g,8-1 <bes d'>8 <bes d'>8 r8 <g cis'>8 <g cis'>8 a,8-1 <cis'-4 g'-1>8 <cis' g'>8 <f a>4. d4. \bar "|." }
  >>
}
