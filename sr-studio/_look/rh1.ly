\version "2.24.0"
\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 180\mm
  score-markup-spacing.basic-distance = #14 top-margin = 10\mm }
#(set-global-staff-size 20)
\score {
  \new PianoStaff <<
    \set PianoStaff.instrumentName = \markup \bold \large ""
    \new Staff { \set fingeringOrientations = #'(up) \tempo "Allegro" \key bes \major \time 4/4 <d'-1 f'-3>4 <d' f'>4 <d' f'>8 <d' f'>8 <d' f'>4 <d' g'>4 <d' g'>4 <d' g'>8 <d' g'>8 <d' g'>4 <f' a'>4 <f' a'>4 <f' a'>8 <f' a'>8 <f' a'>4 <d' f'>4 <d' f'>4 <d' f'>8 <d' f'>8 <d' f'>4 <d' f'>4 <d' f'>4 <d' f'>8 <d' f'>8 <d' f'>4 <ees' g'>4 <ees' g'>4 <ees' g'>8 <ees' g'>8 <ees' g'>4 <f' a'>4 <f' a'>4 <f' a'>8 <f' a'>8 <f' a'>4 f''4-5 bes'4 ~ bes'2 \bar "|." }
    \new Dynamics { s1\mp s1\f s1 s1 s1\p s1 s1 s1 }
    \new Staff { \clef bass \set fingeringOrientations = #'(down) \override Fingering.direction = #DOWN \override Fingering.staff-padding = #1.4 \key bes \major \time 4/4 bes,4-5 d4 d4 bes,8-. bes,8-. g8-1( a8-3 bes4-- g4 bes8 bes8 f4-1 c4-3 ~ c4 a,8 c8 f8-1 f8-5 bes4-> f4-1 d8 bes,8) bes,4 d4 d4 bes,8-. bes,8-. ees4( g4-1 ees8 f8 ees8 d8 c4 f4 ~ f4 d8 ees8 d4 bes,4 ~ bes,2) \bar "|." }
  >>
}
