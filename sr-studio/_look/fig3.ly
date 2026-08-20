\version "2.24.0"
\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 180\mm
  score-markup-spacing.basic-distance = #14 top-margin = 10\mm }
#(set-global-staff-size 20)
\score {
  \new PianoStaff <<
    \set PianoStaff.instrumentName = \markup \bold \large ""
    \new Staff { \set fingeringOrientations = #'(up) \tempo "Allegro giocoso" \key ees \major \time 3/4 g'8-3 r8 ees'8-2-. f'8-. g'4-1 c''8-4( r8 ees''8-5 d''8 c''8 bes'8 aes'4 aes'4-3 f'8 aes'8 bes'8 r8 f'8 g'8 bes'8 bes'8) g'8 r8 ees'8-2-. f'8-1-. g'4 aes'4( c''8 bes'8 aes'4 aes'4 c''4 aes'8 aes'8-5 g'4 ees'2) \bar "|." }
    \new Dynamics { s1\mp s1 s1 s1\f s2 s1\mp s2 }
    \new Staff { \clef bass \set fingeringOrientations = #'(down) \override Fingering.direction = #DOWN \override Fingering.staff-padding = #1.4 \key ees \major \time 3/4 ees4-5 r4 <g bes>4 ees4 r4 <g-4 c'-1>4 <aes c'>4 f4 <aes c'>4 bes,4-3 r4 <d-3 f-1>4 g,4-5 r4 <bes, ees>4 aes4-3 r4 <c' ees'>4 aes4 r4 <c' ees'>4 bes4-1 ees2 \bar "|." }
  >>
}
