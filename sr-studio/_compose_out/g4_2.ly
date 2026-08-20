\version "2.24.0"
\paper { indent = 0 ragged-right = ##f ragged-last = ##f line-width = 180\mm
  score-markup-spacing.basic-distance = #14 top-margin = 10\mm }
#(set-global-staff-size 20)
\score {
  \new PianoStaff <<
    \set PianoStaff.instrumentName = \markup \bold \large ""
    \new Staff { \set fingeringOrientations = #'(up) \tempo "Andantino, con grazia (siciliano)" \key g \major \time 6/8 b'8.-3--( d''16 c''8 b'8. a'16 g'8 a'8. b'16 c''8-1 d''4. e''8. g''16 f''8 e''8. d''16 c''8 d''4.) d''8.-5( b'16 d''8 b'8.( d''16 c''8 b'8. a'16 g'8 a'8. cis''16-3 d''8 e''4. d''8. c''16 b'8 c''8. a'16 fis'8-2 g'2.\fermata) \bar "|." }
    \new Dynamics { s2.\p s4.\< s1\! s2. s8 s2.\mf s4.\> s1\! s8 s2.\p }
    \new Staff { \clef bass \set fingeringOrientations = #'(down) \override Fingering.direction = #DOWN \override Fingering.staff-padding = #1.4 \key g \major \time 6/8 g8.-5 b16 d'8 g8. b16 d'8 e8.-5 g16 b8 d8.-5 fis16 a8 c8.-5 e16 g8-2 d8. fis16 a8 d8. fis16 a8 d4. g8.-5 b16 d'8 g8. b16 d'8 d8.-5 fis16 a8 d8. a16 cis'8-2 g8. b16 d'8 d8.-5 fis16 a8 d2.\fermata \bar "|." }
  >>
}
