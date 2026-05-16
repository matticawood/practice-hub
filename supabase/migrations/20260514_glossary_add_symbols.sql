-- ──────────────────────────────────────────────────────────────────────────────
-- Update symbol_html for all glossary terms that have a visual symbol in scores
-- ──────────────────────────────────────────────────────────────────────────────

-- ── DYNAMICS ─────────────────────────────────────────────────────────────────
UPDATE glossary SET symbol_html = '<em style="font-family:serif;font-style:italic;font-weight:700;font-size:1.1em">ppp</em>' WHERE term = 'Pianississimo';
UPDATE glossary SET symbol_html = '<em style="font-family:serif;font-style:italic;font-weight:700;font-size:1.1em">pp</em>'  WHERE term = 'Pianissimo';
UPDATE glossary SET symbol_html = '<em style="font-family:serif;font-style:italic;font-weight:700;font-size:1.1em">p</em>'   WHERE term = 'Piano' AND category = 'Dynamics';
UPDATE glossary SET symbol_html = '<em style="font-family:serif;font-style:italic;font-weight:700;font-size:1.1em">mp</em>'  WHERE term = 'Mezzo-piano';
UPDATE glossary SET symbol_html = '<em style="font-family:serif;font-style:italic;font-weight:700;font-size:1.1em">mf</em>'  WHERE term = 'Mezzo-forte';
UPDATE glossary SET symbol_html = '<em style="font-family:serif;font-style:italic;font-weight:700;font-size:1.1em">f</em>'   WHERE term = 'Forte' AND category = 'Dynamics';
UPDATE glossary SET symbol_html = '<em style="font-family:serif;font-style:italic;font-weight:700;font-size:1.1em">ff</em>'  WHERE term = 'Fortissimo';
UPDATE glossary SET symbol_html = '<em style="font-family:serif;font-style:italic;font-weight:700;font-size:1.1em">fff</em>' WHERE term = 'Fortississimo';
UPDATE glossary SET symbol_html = '<em style="font-family:serif;font-style:italic;font-weight:700;font-size:1.1em">sfz</em>' WHERE term = 'Sforzando';
UPDATE glossary SET symbol_html = '<em style="font-family:serif;font-style:italic;font-weight:700;font-size:1.1em">fp</em>'  WHERE term = 'Forte-piano';
UPDATE glossary SET symbol_html = '<em style="font-family:serif;font-style:italic;font-weight:700;font-size:1.1em">n</em>'   WHERE term = 'Niente';

UPDATE glossary SET symbol_html = '<svg width="36" height="20" viewBox="0 0 36 20" style="vertical-align:middle"><line x1="2" y1="10" x2="34" y2="3" stroke="currentColor" stroke-width="1.5"/><line x1="2" y1="10" x2="34" y2="17" stroke="currentColor" stroke-width="1.5"/></svg>'
  WHERE term = 'Crescendo';

UPDATE glossary SET symbol_html = '<svg width="36" height="20" viewBox="0 0 36 20" style="vertical-align:middle"><line x1="2" y1="3" x2="34" y2="10" stroke="currentColor" stroke-width="1.5"/><line x1="2" y1="17" x2="34" y2="10" stroke="currentColor" stroke-width="1.5"/></svg>'
  WHERE term = 'Decrescendo';

UPDATE glossary SET symbol_html = '<svg width="36" height="20" viewBox="0 0 36 20" style="vertical-align:middle"><line x1="2" y1="3" x2="34" y2="10" stroke="currentColor" stroke-width="1.5"/><line x1="2" y1="17" x2="34" y2="10" stroke="currentColor" stroke-width="1.5"/></svg>'
  WHERE term = 'Diminuendo';

-- ── ARTICULATION ─────────────────────────────────────────────────────────────
UPDATE glossary SET symbol_html = '<svg width="38" height="14" viewBox="0 0 38 14" style="vertical-align:middle"><circle cx="6" cy="8" r="3.5" fill="currentColor"/><circle cx="19" cy="8" r="3.5" fill="currentColor"/><circle cx="32" cy="8" r="3.5" fill="currentColor"/><path d="M3,5 Q19,0 35,5" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>'
  WHERE term = 'Legato';

UPDATE glossary SET symbol_html = '<svg width="28" height="20" viewBox="0 0 28 20" style="vertical-align:middle"><circle cx="8" cy="14" r="3.5" fill="currentColor"/><circle cx="8" cy="4" r="2.5" fill="currentColor"/><circle cx="20" cy="14" r="3.5" fill="currentColor"/><circle cx="20" cy="4" r="2.5" fill="currentColor"/></svg>'
  WHERE term = 'Staccato';

UPDATE glossary SET symbol_html = '<svg width="28" height="20" viewBox="0 0 28 20" style="vertical-align:middle"><circle cx="8" cy="14" r="3.5" fill="currentColor"/><line x1="3" y1="5" x2="13" y2="5" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="14" r="3.5" fill="currentColor"/><line x1="15" y1="5" x2="25" y2="5" stroke="currentColor" stroke-width="2"/></svg>'
  WHERE term = 'Tenuto';

UPDATE glossary SET symbol_html = '<svg width="20" height="16" viewBox="0 0 20 16" style="vertical-align:middle"><line x1="2" y1="8" x2="18" y2="2" stroke="currentColor" stroke-width="1.5"/><line x1="2" y1="8" x2="18" y2="14" stroke="currentColor" stroke-width="1.5"/></svg>'
  WHERE term = 'Accent';

UPDATE glossary SET symbol_html = '<svg width="18" height="14" viewBox="0 0 18 14" style="vertical-align:middle"><line x1="2" y1="13" x2="9" y2="2" stroke="currentColor" stroke-width="1.5"/><line x1="9" y1="2" x2="16" y2="13" stroke="currentColor" stroke-width="1.5"/></svg>'
  WHERE term = 'Marcato';

UPDATE glossary SET symbol_html = '<svg width="38" height="18" viewBox="0 0 38 18" style="vertical-align:middle"><circle cx="6" cy="10" r="3.5" fill="currentColor"/><circle cx="19" cy="10" r="3.5" fill="currentColor"/><circle cx="32" cy="10" r="3.5" fill="currentColor"/><path d="M3,7 Q19,2 35,7" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="6" cy="16" r="2" fill="currentColor"/><circle cx="19" cy="16" r="2" fill="currentColor"/><circle cx="32" cy="16" r="2" fill="currentColor"/></svg>'
  WHERE term = 'Portato';

UPDATE glossary SET symbol_html = '<svg width="28" height="22" viewBox="0 0 28 22" style="vertical-align:middle"><circle cx="8" cy="16" r="3.5" fill="currentColor"/><polygon points="8,2 5,8 11,8" fill="currentColor"/><circle cx="20" cy="16" r="3.5" fill="currentColor"/><polygon points="20,2 17,8 23,8" fill="currentColor"/></svg>'
  WHERE term = 'Staccatissimo';

UPDATE glossary SET symbol_html = '<svg width="40" height="16" viewBox="0 0 40 16" style="vertical-align:middle"><circle cx="5" cy="11" r="3.5" fill="currentColor"/><circle cx="20" cy="11" r="3.5" fill="currentColor"/><circle cx="35" cy="11" r="3.5" fill="currentColor"/><path d="M3,8 Q20,0 37,8" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>'
  WHERE term = 'Slur';

UPDATE glossary SET symbol_html = '<svg width="36" height="14" viewBox="0 0 36 14" style="vertical-align:middle"><circle cx="5" cy="9" r="3.5" fill="currentColor"/><circle cx="31" cy="9" r="3.5" fill="currentColor"/><path d="M5,7 Q18,0 31,7" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>'
  WHERE term = 'Tie';

UPDATE glossary SET symbol_html = '<span style="font-size:1.6em">𝄐</span>' WHERE term = 'Fermata';

-- ── ORNAMENTS ─────────────────────────────────────────────────────────────────
UPDATE glossary SET symbol_html = '<span style="font-family:serif;font-style:italic;font-weight:bold;font-size:1.05em">tr</span><svg width="28" height="12" viewBox="0 0 28 12" style="vertical-align:middle"><path d="M0,6 Q3.5,0 7,6 Q10.5,12 14,6 Q17.5,0 21,6 Q24.5,12 28,6" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>'
  WHERE term = 'Trill';

UPDATE glossary SET symbol_html = '<svg width="28" height="16" viewBox="0 0 28 16" style="vertical-align:middle"><path d="M2,8 Q6,2 10,8 Q14,14 18,8 Q22,2 26,8" stroke="currentColor" stroke-width="1.5" fill="none"/><line x1="10" y1="1" x2="10" y2="15" stroke="currentColor" stroke-width="1.5"/></svg>'
  WHERE term = 'Mordent';

UPDATE glossary SET symbol_html = '<svg width="28" height="16" viewBox="0 0 28 16" style="vertical-align:middle"><path d="M2,8 Q6,2 10,8 Q14,14 18,8 Q22,2 26,8" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>'
  WHERE term = 'Inverted Mordent';

UPDATE glossary SET symbol_html = '<svg width="28" height="18" viewBox="0 0 28 18" style="vertical-align:middle"><path d="M4,6 Q8,1 13,5 Q18,10 22,7 Q26,4 24,12 Q22,16 18,14" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>'
  WHERE term = 'Turn';

UPDATE glossary SET symbol_html = '<svg width="30" height="26" viewBox="0 0 30 26" style="vertical-align:middle"><ellipse cx="7" cy="20" rx="5" ry="3.5" fill="currentColor" transform="rotate(-15,7,20)"/><line x1="11" y1="19" x2="11" y2="8" stroke="currentColor" stroke-width="1.2"/><ellipse cx="22" cy="20" rx="6" ry="4" fill="currentColor" transform="rotate(-15,22,20)"/><line x1="27" y1="19" x2="27" y2="4" stroke="currentColor" stroke-width="1.5"/></svg>'
  WHERE term = 'Appoggiatura';

UPDATE glossary SET symbol_html = '<svg width="30" height="26" viewBox="0 0 30 26" style="vertical-align:middle"><ellipse cx="7" cy="20" rx="5" ry="3.5" fill="currentColor" transform="rotate(-15,7,20)"/><line x1="11" y1="19" x2="11" y2="8" stroke="currentColor" stroke-width="1.2"/><line x1="5" y1="16" x2="14" y2="9" stroke="currentColor" stroke-width="1.2"/><ellipse cx="22" cy="20" rx="6" ry="4" fill="currentColor" transform="rotate(-15,22,20)"/><line x1="27" y1="19" x2="27" y2="4" stroke="currentColor" stroke-width="1.5"/></svg>'
  WHERE term = 'Acciaccatura';

UPDATE glossary SET symbol_html = '<svg width="36" height="22" viewBox="0 0 36 22" style="vertical-align:middle"><circle cx="4" cy="18" r="3.5" fill="currentColor"/><line x1="6" y1="16" x2="30" y2="5" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3,2"/><circle cx="32" cy="4" r="3.5" fill="currentColor"/></svg>'
  WHERE term = 'Glissando';

UPDATE glossary SET symbol_html = '<svg width="26" height="22" viewBox="0 0 26 22" style="vertical-align:middle"><ellipse cx="8" cy="17" rx="6" ry="4" fill="currentColor" transform="rotate(-15,8,17)"/><line x1="13" y1="15" x2="13" y2="2" stroke="currentColor" stroke-width="1.5"/><line x1="4" y1="6" x2="22" y2="2" stroke="currentColor" stroke-width="1.5"/><line x1="4" y1="10" x2="22" y2="6" stroke="currentColor" stroke-width="1.5"/><line x1="4" y1="14" x2="22" y2="10" stroke="currentColor" stroke-width="1.5"/></svg>'
  WHERE term = 'Tremolo';

UPDATE glossary SET symbol_html = '<svg width="14" height="36" viewBox="0 0 14 36" style="vertical-align:middle"><path d="M7,34 Q12,29 5,24 Q11,19 5,14 Q11,9 5,4" stroke="currentColor" stroke-width="1.5" fill="none"/><polygon points="5,2 2,8 8,8" fill="currentColor"/></svg>'
  WHERE term = 'Arpeggio';

-- ── RHYTHM ────────────────────────────────────────────────────────────────────
UPDATE glossary SET symbol_html = '<span style="display:inline-flex;flex-direction:column;align-items:center;line-height:1.1;font-weight:bold;font-size:1.2em;font-family:serif;gap:0"><span>4</span><span>4</span></span>'
  WHERE term = 'Time signature';

UPDATE glossary SET symbol_html = '<span style="font-size:1.5em">𝄴</span>' WHERE term = 'Common time';
UPDATE glossary SET symbol_html = '<span style="font-size:1.5em">𝄵</span>' WHERE term = 'Cut time';

UPDATE glossary SET symbol_html = '<svg width="38" height="20" viewBox="0 0 38 20" style="vertical-align:middle"><circle cx="6" cy="15" r="3.5" fill="currentColor"/><circle cx="19" cy="15" r="3.5" fill="currentColor"/><circle cx="32" cy="15" r="3.5" fill="currentColor"/><line x1="6" y1="11" x2="6" y2="6" stroke="currentColor" stroke-width="1.2"/><line x1="6" y1="6" x2="32" y2="6" stroke="currentColor" stroke-width="1.2"/><line x1="32" y1="6" x2="32" y2="11" stroke="currentColor" stroke-width="1.2"/><text x="19" y="5" text-anchor="middle" font-size="9" fill="currentColor" font-family="serif">3</text></svg>'
  WHERE term = 'Triplet';

UPDATE glossary SET symbol_html = '<svg width="28" height="20" viewBox="0 0 28 20" style="vertical-align:middle"><circle cx="7" cy="15" r="3.5" fill="currentColor"/><circle cx="21" cy="15" r="3.5" fill="currentColor"/><line x1="7" y1="11" x2="7" y2="6" stroke="currentColor" stroke-width="1.2"/><line x1="7" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="1.2"/><line x1="21" y1="6" x2="21" y2="11" stroke="currentColor" stroke-width="1.2"/><text x="14" y="5" text-anchor="middle" font-size="9" fill="currentColor" font-family="serif">2</text></svg>'
  WHERE term = 'Duplet';

UPDATE glossary SET symbol_html = '<span style="display:inline-flex;flex-direction:column;align-items:center;line-height:1.1;font-weight:bold;font-size:1.2em;font-family:serif;gap:0"><span>6</span><span>8</span></span>'
  WHERE term = 'Compound time';

UPDATE glossary SET symbol_html = '<span style="display:inline-flex;flex-direction:column;align-items:center;line-height:1.1;font-weight:bold;font-size:1.2em;font-family:serif;gap:0"><span>4</span><span>4</span></span>'
  WHERE term = 'Simple time';

-- ── PITCH ─────────────────────────────────────────────────────────────────────
UPDATE glossary SET symbol_html = '<span style="font-size:1.4em">♯</span>' WHERE term = 'Sharp';
UPDATE glossary SET symbol_html = '<span style="font-size:1.4em">♭</span>' WHERE term = 'Flat';
UPDATE glossary SET symbol_html = '<span style="font-size:1.4em">♮</span>' WHERE term = 'Natural';
UPDATE glossary SET symbol_html = '<span style="font-size:1.4em">𝄪</span>' WHERE term = 'Double sharp';
UPDATE glossary SET symbol_html = '<span style="font-size:1.4em">𝄫</span>' WHERE term = 'Double flat';
UPDATE glossary SET symbol_html = '<span style="font-size:1.2em">♯ ♭ ♮</span>' WHERE term = 'Accidental';

UPDATE glossary SET symbol_html = '<svg width="36" height="28" viewBox="0 0 36 28" style="vertical-align:middle"><line x1="2" y1="8" x2="34" y2="8" stroke="currentColor" stroke-width="1"/><line x1="2" y1="14" x2="34" y2="14" stroke="currentColor" stroke-width="1"/><line x1="2" y1="20" x2="34" y2="20" stroke="currentColor" stroke-width="1"/><line x1="10" y1="26" x2="26" y2="26" stroke="currentColor" stroke-width="1.5"/><ellipse cx="18" cy="26" rx="7" ry="4.5" fill="currentColor" transform="rotate(-15,18,26)"/></svg>'
  WHERE term = 'Ledger lines';

UPDATE glossary SET symbol_html = '<em style="font-style:italic;font-size:1.0em">8va ·····</em>' WHERE term = 'Ottava';
UPDATE glossary SET symbol_html = '<em style="font-style:italic;font-size:1.0em">8vb ·····</em>' WHERE term = 'Ottava bassa';

-- ── NOTATION ─────────────────────────────────────────────────────────────────
UPDATE glossary SET symbol_html = '<span style="font-size:2em;line-height:1">𝄞</span>' WHERE term = 'Treble clef';
UPDATE glossary SET symbol_html = '<span style="font-size:1.8em;line-height:1">𝄢</span>' WHERE term = 'Bass clef';

UPDATE glossary SET symbol_html = '<svg width="30" height="36" viewBox="0 0 30 36" style="vertical-align:middle"><line x1="6" y1="2" x2="6" y2="34" stroke="currentColor" stroke-width="1"/><line x1="8" y1="2" x2="8" y2="34" stroke="currentColor" stroke-width="2"/><line x1="8" y1="4" x2="28" y2="4" stroke="currentColor" stroke-width="1"/><line x1="8" y1="8" x2="28" y2="8" stroke="currentColor" stroke-width="1"/><line x1="8" y1="12" x2="28" y2="12" stroke="currentColor" stroke-width="1"/><line x1="8" y1="16" x2="28" y2="16" stroke="currentColor" stroke-width="1"/><line x1="8" y1="20" x2="28" y2="20" stroke="currentColor" stroke-width="1"/><line x1="8" y1="24" x2="28" y2="24" stroke="currentColor" stroke-width="1"/><line x1="8" y1="28" x2="28" y2="28" stroke="currentColor" stroke-width="1"/><line x1="8" y1="32" x2="28" y2="32" stroke="currentColor" stroke-width="1"/></svg>'
  WHERE term = 'Grand staff';

UPDATE glossary SET symbol_html = '<span style="font-size:1.2em;letter-spacing:-2px">♯♯♯</span>' WHERE term = 'Key signature';

UPDATE glossary SET symbol_html = '<svg width="32" height="24" viewBox="0 0 32 24" style="vertical-align:middle"><line x1="4" y1="4" x2="28" y2="4" stroke="currentColor" stroke-width="1"/><line x1="4" y1="9" x2="28" y2="9" stroke="currentColor" stroke-width="1"/><line x1="4" y1="14" x2="28" y2="14" stroke="currentColor" stroke-width="1"/><line x1="4" y1="19" x2="28" y2="19" stroke="currentColor" stroke-width="1"/><line x1="4" y1="24" x2="28" y2="24" stroke="currentColor" stroke-width="1"/><line x1="28" y1="4" x2="28" y2="24" stroke="currentColor" stroke-width="1.5"/></svg>'
  WHERE term = 'Bar';

UPDATE glossary SET symbol_html = '<svg width="16" height="20" viewBox="0 0 16 20" style="vertical-align:middle"><line x1="4" y1="2" x2="4" y2="18" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="2" x2="12" y2="18" stroke="currentColor" stroke-width="3"/></svg>'
  WHERE term = 'Double bar';

UPDATE glossary SET symbol_html = '<svg width="24" height="20" viewBox="0 0 24 20" style="vertical-align:middle"><line x1="6" y1="2" x2="6" y2="18" stroke="currentColor" stroke-width="1.5"/><line x1="10" y1="2" x2="10" y2="18" stroke="currentColor" stroke-width="3"/><circle cx="16" cy="8" r="2.2" fill="currentColor"/><circle cx="16" cy="13" r="2.2" fill="currentColor"/></svg>'
  WHERE term = 'Repeat sign';

UPDATE glossary SET symbol_html = '<svg width="44" height="20" viewBox="0 0 44 20" style="vertical-align:middle"><line x1="2" y1="14" x2="2" y2="6" stroke="currentColor" stroke-width="1.2"/><line x1="2" y1="6" x2="18" y2="6" stroke="currentColor" stroke-width="1.2"/><line x1="18" y1="6" x2="18" y2="14" stroke="currentColor" stroke-width="1.2"/><text x="6" y="13" font-size="8" fill="currentColor" font-family="serif">1.</text><line x1="24" y1="14" x2="24" y2="6" stroke="currentColor" stroke-width="1.2"/><line x1="24" y1="6" x2="42" y2="6" stroke="currentColor" stroke-width="1.2"/><text x="28" y="13" font-size="8" fill="currentColor" font-family="serif">2.</text></svg>'
  WHERE term = 'First and second time bars';

UPDATE glossary SET symbol_html = '<em style="font-style:italic;font-size:1.0em">D.C.</em>' WHERE term = 'Da capo';
UPDATE glossary SET symbol_html = '<em style="font-style:italic;font-size:1.0em">D.S.</em>' WHERE term = 'Dal segno';
UPDATE glossary SET symbol_html = '<span style="font-size:1.5em">𝄋</span>' WHERE term = 'Segno';
UPDATE glossary SET symbol_html = '<span style="font-size:1.5em">𝄌</span>' WHERE term = 'Coda sign';
UPDATE glossary SET symbol_html = '<span style="font-size:1.4em">𝄌</span>' WHERE term = 'Coda' AND category = 'Form';

UPDATE glossary SET symbol_html = '<svg width="44" height="20" viewBox="0 0 44 20" style="vertical-align:middle"><line x1="2" y1="14" x2="2" y2="6" stroke="currentColor" stroke-width="1.2"/><line x1="2" y1="6" x2="18" y2="6" stroke="currentColor" stroke-width="1.2"/><text x="6" y="13" font-size="8" fill="currentColor" font-family="serif">1.</text><line x1="24" y1="14" x2="24" y2="6" stroke="currentColor" stroke-width="1.2"/><line x1="24" y1="6" x2="42" y2="6" stroke="currentColor" stroke-width="1.2"/><text x="28" y="13" font-size="8" fill="currentColor" font-family="serif">2.</text></svg>'
  WHERE term = 'Volta bracket';

-- Note values as SVG noteheads
UPDATE glossary SET symbol_html = '<svg width="26" height="18" viewBox="0 0 26 18" style="vertical-align:middle"><ellipse cx="13" cy="10" rx="11" ry="6.5" stroke="currentColor" stroke-width="1.8" fill="none"/><ellipse cx="13" cy="10" rx="6" ry="3.5" fill="currentColor" transform="rotate(-20,13,10)"/></svg>'
  WHERE term = 'Semibreve';

UPDATE glossary SET symbol_html = '<svg width="22" height="32" viewBox="0 0 22 32" style="vertical-align:middle"><ellipse cx="9" cy="24" rx="8" ry="5" stroke="currentColor" stroke-width="1.8" fill="none" transform="rotate(-15,9,24)"/><line x1="16" y1="22" x2="16" y2="3" stroke="currentColor" stroke-width="1.8"/></svg>'
  WHERE term = 'Minim';

UPDATE glossary SET symbol_html = '<svg width="22" height="32" viewBox="0 0 22 32" style="vertical-align:middle"><ellipse cx="9" cy="24" rx="8" ry="5" fill="currentColor" transform="rotate(-15,9,24)"/><line x1="16" y1="22" x2="16" y2="3" stroke="currentColor" stroke-width="1.8"/></svg>'
  WHERE term = 'Crotchet';

UPDATE glossary SET symbol_html = '<svg width="22" height="32" viewBox="0 0 22 32" style="vertical-align:middle"><ellipse cx="9" cy="24" rx="8" ry="5" fill="currentColor" transform="rotate(-15,9,24)"/><line x1="16" y1="22" x2="16" y2="3" stroke="currentColor" stroke-width="1.8"/><path d="M16,3 Q22,8 18,14" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>'
  WHERE term = 'Quaver';

UPDATE glossary SET symbol_html = '<svg width="22" height="32" viewBox="0 0 22 32" style="vertical-align:middle"><ellipse cx="9" cy="24" rx="8" ry="5" fill="currentColor" transform="rotate(-15,9,24)"/><line x1="16" y1="22" x2="16" y2="3" stroke="currentColor" stroke-width="1.8"/><path d="M16,3 Q22,8 18,13" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M16,8 Q22,13 18,18" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>'
  WHERE term = 'Semiquaver';

UPDATE glossary SET symbol_html = '<svg width="28" height="32" viewBox="0 0 28 32" style="vertical-align:middle"><ellipse cx="9" cy="24" rx="8" ry="5" fill="currentColor" transform="rotate(-15,9,24)"/><line x1="16" y1="22" x2="16" y2="3" stroke="currentColor" stroke-width="1.8"/><circle cx="23" cy="22" r="2.5" fill="currentColor"/></svg>'
  WHERE term = 'Dotted note';

UPDATE glossary SET symbol_html = '<svg width="52" height="20" viewBox="0 0 52 20" style="vertical-align:middle"><rect x="2" y="9" width="10" height="5" fill="currentColor"/><rect x="16" y="6" width="10" height="5" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M30,4 Q33,8 31,11 Q34,10 34,14 Q31,16 29,14 Q29,11 32,10 Q30,7 31,4 Z" fill="currentColor"/><text x="44" y="15" font-size="14" fill="currentColor" font-family="serif">𝄾</text></svg>'
  WHERE term = 'Rest';

UPDATE glossary SET symbol_html = '<span style="font-family:serif;font-style:italic;font-weight:700;font-size:1.05em;letter-spacing:2px">pp p mf f ff</span>'
  WHERE term = 'Dynamics' AND category = 'Notation';

UPDATE glossary SET symbol_html = '<em style="font-style:italic;font-size:0.95em">Allegro ♩= 120</em>' WHERE term = 'Tempo marking';
UPDATE glossary SET symbol_html = '<em style="font-style:italic;font-size:0.95em">♩= 120</em>'         WHERE term = 'Metronome';
UPDATE glossary SET symbol_html = '<span style="font-size:1.6em;font-style:italic">''</span>'          WHERE term = 'Breath mark';
UPDATE glossary SET symbol_html = '<em style="font-style:italic;font-size:1.0em">8va ·····</em>'       WHERE term = '8va';
UPDATE glossary SET symbol_html = '<em style="font-style:italic;font-size:1.05em">𝒫ed.</em>'          WHERE term = 'Ped.';
