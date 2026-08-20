\version "2.24.0"
\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 180\mm
  score-markup-spacing.basic-distance = #14 top-margin = 10\mm }
#(set-global-staff-size 20)
\score {
  \new PianoStaff <<
    \set PianoStaff.instrumentName = \markup \bold \large ""
    \new Staff { \set fingeringOrientations = #'(up) \tempo "Allegro giocoso" \key c \major \time 6/8 c''8-1 r4 <e'' g''>8-. r4 c''8 r4 <e''-2 a''-5>8-. r4 f'8-1 r4 <a' c''>8-. r4 g'8-. r4 <b' d''>8-. r4 e'8-1 r4 <g'-2 c''-5>8-. r4 f'8 r4 <a' c''>8-. r4 f'8 r4 <a' c''>8-. r4 g''4.-5 c''4.\fermata \bar "|." }
    \new Dynamics { s4.\mf s1 s8 s4.\f s1 s8 s4.\mp s1 s1 s2 s8 }
    \new Staff { \clef bass \set fingeringOrientations = #'(down) \override Fingering.direction = #DOWN \override Fingering.staff-padding = #1.4 \key c \major \time 6/8 e8.-1 d16 e8 c8. d16 e16 f16-5 a16 c'8. b8 c'8. b16 a16-1 g16 f8. g16 f16 g16 a4 a8-2 g8.-1 f16 e8 d8. c8 d16 e8. d16 e8 c8. d16 e16 f16 a8.-1 g16 a8 f8. g16 f16 g16 f8. g16 a16 g16 f4 a8 <e-3 g-1>4. c4.\fermata \bar "|." }
  >>
}
