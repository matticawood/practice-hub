\version "2.24.0"
\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 180\mm
  score-markup-spacing.basic-distance = #14 top-margin = 10\mm }
#(set-global-staff-size 20)
\score {
  \new PianoStaff <<
    \set PianoStaff.instrumentName = \markup \bold \large ""
    \new Staff { \set fingeringOrientations = #'(up) \tempo "Marziale" \key d \minor \time 2/4 <f'-1 a'-3>4. <f' a'>8 <f' bes'>4. <f' bes'>8 <g'-1 bes'-3>4. <g' bes'>8 <a' cis''>4. <a' cis''>8\fermata <f' a'>8-. r8 <f' a'>8-. <f' a'>8-. <g' bes'>8-. r8 <g' bes'>8-. <g' bes'>8-. <a' cis''>4 <a' cis''>4 a'4-5 d'4 \bar "|." }
    \new Dynamics { s1\f s1 s1\mp s1 }
    \new Staff { \clef bass \set fingeringOrientations = #'(down) \override Fingering.direction = #DOWN \override Fingering.staff-padding = #1.4 \key d \minor \time 2/4 f8.-3 e16-. d16-. f8. bes8.-2( c'16 bes8. a16-1) g8( f8 g4 a16 g16 f8 e4\fermata) f8. e16-. d16-. f8. g8.( a16 bes16-2 r8 bes16) a8 g8 f8. bes16 <f-3 a-1>4 d4 \bar "|." }
  >>
}
