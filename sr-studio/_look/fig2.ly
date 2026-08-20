\version "2.24.0"
\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 180\mm
  score-markup-spacing.basic-distance = #14 top-margin = 10\mm }
#(set-global-staff-size 20)
\score {
  \new PianoStaff <<
    \set PianoStaff.instrumentName = \markup \bold \large ""
    \new Staff { \set fingeringOrientations = #'(up) \tempo "Maestoso" \key f \major \time 3/4 a'2-3 f'4 d''2-3-> f''4-- bes'8-. a'16-2-. bes'16-. d''2 c''2 g'8 g'8-2 c''2( <f' a'>4 d''2-5 bes'8 a'16 bes'16) c''8-. bes'16-. a'16-. g'2 f'2.-2 \bar "|." }
    \new Dynamics { s1\p\< s2 s1\!\> s4. s8\! s2.\mp\< s1\!\> s2 s2.\! }
    \new Staff { \clef bass \set fingeringOrientations = #'(down) \override Fingering.direction = #DOWN \override Fingering.staff-padding = #1.4 \key f \major \time 3/4 <f-5 c'-1>4 r4 <f c'>4 <d-3 f-1>2. <bes, f>2. <c-4 f-1>2. a,4 <c f>4 <c f>4 bes,4-5 <d f>2 c4 <e bes>2 <a-3 c'-1>4 f2 \bar "|." }
  >>
}
