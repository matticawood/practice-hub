\version "2.24.0"
\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 180\mm
  score-markup-spacing.basic-distance = #14 top-margin = 10\mm }
#(set-global-staff-size 20)
\score {
  \new PianoStaff <<
    \set PianoStaff.instrumentName = \markup \bold \large ""
    \new Staff { \set fingeringOrientations = #'(up) \tempo "Poco vivace" \key d \minor \time 4/4 d''4-1 a''4 f''4 a''4 d''4-2 bes'4-1 f''4 bes'4-2 g'4 d''4 bes'4 d''4 a'4 g'4 f'4-2 e'4 f'4 d''4-5 a'4 d''4 g'4 <bes' d''>4 ~ <bes' d''>2 <cis''-1 a''-5>2 d''4 <f'' a''>4 a''4 d''4 ~ d''2 \bar "|." }
    \new Dynamics { s1\p\< s1 s1 s1 s1 s1\mf\!\> s1 s1\! }
    \new Staff { \clef bass \set fingeringOrientations = #'(down) \override Fingering.direction = #DOWN \override Fingering.staff-padding = #1.4 \key d \minor \time 4/4 f2-3 d2 bes4-2-> d'4-1 bes4. r8 g2 bes4 g8 g8 a4 g4 a4.-3 r8 f2-3( d2 g4 <g-5 bes-3>4 d'2 a2 d'4 d'8-2 e8-1 d1) \bar "|." }
  >>
}
