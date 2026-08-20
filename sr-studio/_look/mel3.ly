\version "2.24.0"
\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 180\mm
  score-markup-spacing.basic-distance = #14 top-margin = 10\mm }
#(set-global-staff-size 20)
\score {
  \new PianoStaff <<
    \set PianoStaff.instrumentName = \markup \bold \large ""
    \new Staff { \set fingeringOrientations = #'(up) \tempo "Allegretto scherzando" \key bes \major \time 3/4 d''4-4( bes'2) g''8-1-> r8 bes''2-5 ees''8-2( ees''8-4 f''2 c''8 bes'8 c''4. r8 d''4 bes'2) ees''8-4 r8 <ees''-3 g''-5>2 c''8 c''8-3 d''2 c''4 bes'2 \bar "|." }
    \new Dynamics { s2.\p\< s1\mf\!\> s1 s1 s1 s2. s2\! }
    \new Staff { \clef bass \set fingeringOrientations = #'(down) \override Fingering.direction = #DOWN \override Fingering.staff-padding = #1.4 \key bes \major \time 3/4 bes,8.-5 <f-5 d'-1>16 <d'-3 f'-1>4 <d' f'>4 bes,4-1 r4 <d'-5 g'-2>4 <c-5 c'-1>4 f4-5 <a c'>4 f8.-1 <ees'-4 a'-1>16 <ees' a'>4 <ees' a'>4 <d-5 d'-1>4 r4 <bes-5 f'-1>4 ees4-5 r8 <g'-5 bes'-3>4 <g' bes'>8 f4-1 r4 <a'-3 c''-1>4 f4-1 bes,2 \bar "|." }
  >>
}
