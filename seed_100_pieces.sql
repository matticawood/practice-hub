-- 96 additional pieces (4 already exist: Clair de lune, Für Elise, BWV 846 Prelude, Moonlight Sonata 1st mvt)
INSERT INTO pieces (title, composer, year, background, challenges, difficulty, tags) VALUES

-- ── BEGINNER ─────────────────────────────────────────────────────────────────

('Minuet in G major (BWV Anh. 114)', 'Christian Petzold', 1725,
'Long attributed to J.S. Bach but now believed to be by Christian Petzold, this minuet appears in the Notebook for Anna Magdalena Bach and is one of the most-taught pieces in piano education worldwide. It offers a gentle introduction to Baroque phrasing and binary form. For the pianist, the melody should sing with a gentle, lifted touch while the left hand provides a quiet, steady bass — think of it as a polite conversation between two voices.',
'This is a true beginner piece with straightforward notes and a simple rhythm throughout. The main challenge is making the melody sound musical rather than mechanical — try to lift your wrist slightly at the end of each phrase as if the music is taking a breath. Keeping a steady, unhurried tempo is what separates a nice performance from a merely correct one.',
1, ARRAY['Phrasing', 'Baroque style', 'Steady tempo', 'Legato melody']),

('Ode to Joy (simplified)', 'Ludwig van Beethoven', 1824,
'The famous melody from the final movement of Beethoven''s Ninth Symphony is one of the most recognised tunes in the world. In its simplified piano arrangement it sits entirely in the five-finger position, making it ideal for very early learners. The goal is a warm, singing tone — imagine a choir singing the melody and try to match that quality with your fingers.',
'This piece is ideal for complete beginners because it uses just five notes and no hand position changes. The challenge is not the notes but the tone — pressing too hard makes it sound harsh, pressing too lightly makes it disappear. Focus on producing an even, gentle sound on every note and counting carefully so the rhythm feels natural.',
1, ARRAY['Five-finger position', 'Tone control', 'Steady rhythm', 'Singable melody']),

('Sonatina in C major (Op. 36, No. 1) — 1st movement', 'Muzio Clementi', 1797,
'Clementi''s Op. 36 sonatinas are among the most enduring teaching pieces in the piano repertoire, written specifically to introduce students to classical sonata style. The first sonatina''s opening movement establishes the key conventions of the Classical era — clear phrases, balanced structure, and a tidy distinction between loud and soft. For the pianist, crisp articulation and clean two-note slurs in the right hand are the stylistic priority.',
'This is a beginner-to-early-intermediate piece that introduces the two-note slur — a short gesture of down then up on the wrist that is fundamental to Classical style. The left hand alternates between single bass notes and chords, which requires a little independence to keep even. Practise hands separately until both feel comfortable, then put them together slowly.',
1, ARRAY['Two-note slurs', 'Classical articulation', 'Hand independence', 'Dynamic contrast']),

('The Happy Farmer (Op. 68, No. 10)', 'Robert Schumann', 1848,
'From Schumann''s Album for the Young, a collection written for his daughter Marie, The Happy Farmer is a cheerful, energetic character piece that has been a staple of early piano teaching for over 150 years. Its straightforward melody and bouncy rhythm make it immediately appealing to young pianists. The right hand carries a bright melody while the left provides rhythmic chordal support — both hands have a clear role.',
'This piece is a good beginner challenge because the hands do different things: the right hand plays a melody while the left plays chords on the beat. Keeping the left hand chords shorter and lighter than the right hand melody is the key musical goal. Watch out for the tendency to rush — the piece has a lot of energy but needs a steady pulse underneath it.',
1, ARRAY['Melody vs accompaniment', 'Rhythmic chords', 'Articulation', 'Character']),

('For Children — No. 1 in C major', 'Béla Bartók', 1909,
'Bartók''s For Children is a collection of 85 short pieces based on Hungarian and Slovak folk melodies, arranged as progressive piano studies. The opening piece in C major is among the simplest, presenting a folk tune in a straightforward five-finger setting. Bartók''s writing, even at this level, has a distinctive modal flavour that sets it apart from conventional Classical exercises.',
'This is one of the easiest pieces in the collection and a perfect beginner study. The folk-like melody should be played with a natural, unforced tone — avoid over-pedalling as the clean, dry sound is part of the character. The slight modal quality of the melody (it does not sound like a conventional major scale) is intentional and worth noticing and enjoying.',
1, ARRAY['Folk style', 'Five-finger position', 'Modal melody', 'Clean tone']),

('Sonatina Op. 55, No. 1 — 1st movement', 'Friedrich Kuhlau', 1823,
'Kuhlau''s sonatinas occupy a similar teaching position to Clementi''s Op. 36 set — elegant, well-crafted Classical pieces that introduce students to sonata form without overwhelming technical demand. The Op. 55 No. 1 is particularly friendly, with a singing right-hand melody and a simple Alberti bass in the left. Kuhlau was sometimes called the ''Beethoven of the flute'' and his piano writing shares Beethoven''s clarity and good humour.',
'This sonatina introduces the Alberti bass — a broken chord pattern (low-high-middle-high) that underpins much Classical piano writing. Keeping the Alberti bass even and quiet while the right hand sings the melody is the central challenge. Practise the left hand alone until the pattern feels automatic, then add the melody on top.',
1, ARRAY['Alberti bass', 'Melody and accompaniment', 'Classical style', 'Hand independence']),

('Minuet in F major (K. 2)', 'Wolfgang Amadeus Mozart', 1762,
'Written by Mozart at the age of six, this minuet is one of the earliest surviving compositions of the prodigy. It is a delightful, perfectly shaped little piece that introduces Baroque and early Classical style with minimal technical demand. The right hand plays a graceful melody while the left provides a simple bass line — the challenge is purely musical: making something simple sound elegant.',
'This is a genuine beginner piece — the notes and rhythms are very straightforward. The challenge is in the style: Mozart''s music should sound light, poised, and elegant, never heavy or plodding. Use a gentle touch, observe the dynamic markings carefully, and try to feel the dance-like lilt of the minuet rhythm (three beats per bar, with the first beat slightly weighted).',
1, ARRAY['Classical style', 'Light touch', 'Phrasing', 'Dance rhythm']),

('Arabesque (Op. 100, No. 2)', 'Friedrich Burgmüller', 1835,
'Burgmüller''s 25 Progressive Studies Op. 100 are among the most widely used teaching pieces in the piano repertoire. The Arabesque is the collection''s most famous piece — a sparkling, flowing study in right-hand sixteenth notes over a simple left-hand accompaniment. It introduces the concept of musical contrast, moving from a hushed, mysterious opening to a louder, more assertive middle section and back.',
'This is a beginner-to-lower-intermediate piece that introduces running sixteenth-note passages in the right hand. The key is keeping those runs smooth and even — every note the same volume, no accidental bumps. The left hand needs to stay quieter than the right throughout. The dynamic contrasts (piano and forte sections) should be clear and committed.',
1, ARRAY['Running passages', 'Evenness', 'Dynamic contrast', 'Coordination']),

-- ── LOWER INTERMEDIATE ────────────────────────────────────────────────────────

('Invention No. 1 in C major (BWV 772)', 'J.S. Bach', 1723,
'Bach wrote his Two-Part Inventions as teaching pieces to develop independent hand technique and introduce students to contrapuntal thinking. The first invention, in C major, presents a short subject that is immediately imitated between the hands in a continuous dialogue. It is one of the most important pedagogical pieces in the piano repertoire, teaching the ears and fingers to follow two independent melodic lines simultaneously.',
'The central challenge of this invention is true hand independence — both hands play equally important melodic lines that must each sing clearly without either dominating. Many players unconsciously emphasise the right hand and let the left become background noise. Practise hands separately with full attention to tone, then put them together, actively listening to the left hand as the ''answer'' to the right.',
2, ARRAY['Counterpoint', 'Hand independence', 'Two-part texture', 'Articulation', 'Imitation']),

('Invention No. 4 in D minor (BWV 775)', 'J.S. Bach', 1723,
'The fourth invention in D minor has a more serious, searching character than the C major opening of the set. Its subject begins with an expressive leap and features more chromaticism than earlier inventions, giving it a distinctly emotional quality. For the pianist, the D minor key and the chromatic passing notes demand slightly more expressive shaping — this is not a neutral exercise but a small drama.',
'This is one of the more challenging inventions in the set, partly because of its chromatic harmony and partly because the subject is more complex. The hands must remain genuinely independent and equally expressive. Watch for the chromatic notes — they often carry extra harmonic tension and deserve a little extra weight. Slow, patient hands-separate practice is essential before combining.',
2, ARRAY['Counterpoint', 'Chromaticism', 'Hand independence', 'Expressive shaping']),

('Invention No. 8 in F major (BWV 779)', 'J.S. Bach', 1723,
'The F major invention has a flowing, cheerful character and is notable for the way it passes a continuous sixteenth-note motion back and forth between the hands. While one hand runs, the other provides a steadier countermelody — the challenge is making both lines sound intentional and musical. It is a favourite in teaching for developing smooth, even fingerwork alongside contrapuntal awareness.',
'The constant sixteenth-note movement in this invention moves between hands mid-phrase, requiring seamless hand-offs — the listener should not hear a join when the running figure transfers. Each hand must be equally smooth and even. Practise the transition points very slowly until the handover feels natural, then gradually increase the tempo.',
2, ARRAY['Counterpoint', 'Smooth handovers', 'Evenness', 'Running passages']),

('Gymnopédie No. 1', 'Erik Satie', 1888,
'Satie''s three Gymnopédies are among the most distinctive pieces in the piano repertoire — slow, melancholic, and utterly unlike anything written before them. The first, marked Lent et douloureux (slow and doleful), presents a gentle waltz accompaniment in the left hand beneath a sparse, wandering melody in the right. The piece has no strong harmonic direction and seems to exist outside of time, which is part of its enduring appeal.',
'The Gymnopédie looks deceptively simple — the notes are not difficult. The real challenge is the left-hand accompaniment: a low bass note followed by two mid-register chords that must float, not thud. Many players over-pedal or make the accompaniment too heavy, which destroys the piece''s dreamlike quality. The melody should emerge naturally above it, shaped gently with subtle rubato.',
2, ARRAY['Left hand balance', 'Rubato', 'Pedalling', 'Atmospheric tone', 'Voicing']),

('Gnossienne No. 1', 'Erik Satie', 1893,
'The Gnossiennes are Satie''s most mysterious pieces — slow, hypnotic, and written without bar lines or time signature, which is unusual even for avant-garde music of the period. The first Gnossienne has a modal, eastern-influenced quality and is marked with Satie''s famously cryptic instructions such as ''with astonishment'' and ''open your head.'' For the pianist, the absence of barlines means the music must flow from phrase shape rather than a counted pulse.',
'Without barlines, this piece cannot be learnt by counting mechanically — the pianist must feel the phrase shapes and allow them to breathe naturally. The left hand plays a simple, repetitive accompaniment that should tick along quietly beneath an expressive right-hand melody. Modal harmony means some notes may feel unexpected — lean into that strangeness rather than trying to correct it.',
2, ARRAY['Rubato', 'Modal harmony', 'Atmospheric playing', 'Phrasing', 'Left hand balance']),

('Waltz in A minor (B. 150, posth.)', 'Frédéric Chopin', 1843,
'This posthumously published waltz in A minor is one of Chopin''s most beloved shorter works, combining a wistful, singing melody with a simple waltz accompaniment. It was not published during Chopin''s lifetime and exists in several versions, but the most commonly played version is tender and approachable. For the pianist, it is a wonderful introduction to Chopin''s style — the phrasing should feel natural and vocal, as if the melody is being sung rather than played.',
'This waltz sits at Lower Intermediate because the notes are manageable but the style demands real musical sensitivity. The left-hand waltz pattern (bass note, chord, chord) needs to stay light and dance-like, never heavy. Chopin''s melody must shape naturally with small swells and releases — avoid playing it too mechanically or too sentimentally. A little rubato goes a long way.',
2, ARRAY['Waltz accompaniment', 'Rubato', 'Singing melody', 'Chopin style', 'Phrasing']),

('Prelude Op. 28, No. 20 in C minor', 'Frédéric Chopin', 1839,
'At just 13 bars, this prelude is one of the shortest in Chopin''s Op. 28 set, yet it is one of the most harmonically rich and emotionally weighty. A series of solemn, march-like chords move through a dramatic harmonic progression before resolving quietly. For the pianist, the challenge is purely one of weight, timing, and voicing — making these simple chords speak with gravity and depth.',
'This short piece is accessible in terms of notes but demanding in terms of musical control. The chords must sound full and weighted, not banged. The top note of each chord carries the melody and should project slightly above the inner voices. The decrescendo at the end — from forte to pianissimo over just a few bars — requires very fine dynamic control.',
2, ARRAY['Chord voicing', 'Dynamic control', 'Weight', 'Harmonic awareness']),

('Moment Musical No. 3 in F minor (Op. 94)', 'Franz Schubert', 1828,
'Schubert''s six Moments Musicaux are intimate character pieces published in the last year of his life. The third, in F minor, is the most famous — a quietly insistent piece built on a simple repeated rhythmic pattern that creates an almost hypnotic effect. Its chromatic harmony gives it a restless, searching quality that is quintessentially Schubertian.',
'The rhythmic pattern (a short-short-long figure) must stay absolutely steady throughout without becoming mechanical. The challenge is maintaining that pulse while still shaping the music expressively — it needs to breathe and grow without losing its underlying steadiness. The middle section in A flat major provides contrast and requires a subtle change in touch and tone.',
2, ARRAY['Rhythmic steadiness', 'Chromatic harmony', 'Dynamic shaping', 'Contrasting sections']),

('Sarabande in D minor (HWV 437)', 'George Frideric Handel', 1733,
'This grave, stately dance from Handel''s Suite in D minor became widely known through Stanley Kubrick''s use of it in the film Barry Lyndon. A sarabande is a slow triple-time dance — typically solemn and ceremonial — and Handel''s version is a model of dignified simplicity. For the pianist, the ornamented repeat of each section is an opportunity for expressive elaboration.',
'This is a piece where tone and weight do the heavy lifting — the notes are not difficult, but producing a genuinely noble, sustained sound at a slow tempo is harder than it looks. Avoid rushing the long notes. The ornaments (trills and turns) in the repeat should feel like natural decorations, not obstacles — learn them separately until they are automatic.',
2, ARRAY['Sustained tone', 'Ornamentation', 'Baroque style', 'Weight', 'Slow tempo control']),

('Song Without Words — Spring Song (Op. 62, No. 6)', 'Felix Mendelssohn', 1844,
'Mendelssohn''s Songs Without Words are 48 short character pieces for solo piano, each a self-contained lyrical miniature. The Spring Song is the most popular of the set — a light, dancing piece with a skipping left-hand accompaniment and a bright, singing right-hand melody. Its cheerful character and moderate difficulty have made it a favourite in the intermediate repertoire.',
'The flowing left-hand accompaniment figure (broken chords in a triplet feel) needs to be kept light and rhythmically even — it is the engine of the piece and must not drag. The right-hand melody should float above it with a clear, singing tone. The main challenge is balancing these two layers so the accompaniment supports without overpowering.',
2, ARRAY['Accompaniment balance', 'Triplet flow', 'Singing melody', 'Light touch']),

('Träumerei (Op. 15, No. 7)', 'Robert Schumann', 1838,
'Träumerei (''Dreaming'') is the seventh piece from Schumann''s Kinderszenen (Scenes from Childhood), a set of 13 short pieces reflecting on childhood from an adult perspective. It is one of the most tender and intimate pieces in all of piano music — slow, harmonically rich, and deeply expressive. For the pianist, it requires a warm, singing tone and a capacity to sustain long melodic lines across complex harmonies.',
'Träumerei looks simple but is genuinely difficult to play well. The melody moves slowly through a dense, warm harmonic texture and must sing above the inner voices without the pianist consciously pressing harder. Voicing these inner parts correctly — letting some notes recede and others emerge — is the central technical challenge. Rubato should feel natural, not imposed.',
2, ARRAY['Voicing', 'Singing tone', 'Rubato', 'Harmonic texture', 'Slow control']),

('Sonatina in G major (Anh. 5, No. 1)', 'Ludwig van Beethoven', 1790,
'Though its attribution to Beethoven is debated, this charming sonatina in G major is one of the most widely taught pieces in the intermediate repertoire. Its two movements — a bright Moderato and a flowing Romanze — encapsulate the elegance and clarity of the Classical style. For the pianist, crisp articulation, clean ornaments, and a well-shaped melody are the priorities.',
'This sonatina is rated Lower Intermediate because the technical demands are modest but the stylistic ones are real. Classical ornaments (the turns and trills) need to be learnt carefully and placed rhythmically. The Romanze second movement asks for a more sustained, cantabile touch — a good contrast with the lighter first movement.',
2, ARRAY['Classical style', 'Ornamentation', 'Cantabile', 'Articulation']),

('Sonata in C major (K. 545) — 1st movement', 'Wolfgang Amadeus Mozart', 1788,
'Mozart described this sonata as ''for beginners'' — though that description undersells the musical sensitivity it requires. The first movement presents one of Mozart''s most elegant melodic ideas over an Alberti bass accompaniment, moving through a textbook Classical exposition, development, and recapitulation. It is among the most studied sonata movements in piano education.',
'The Alberti bass in the left hand (broken chord pattern) must be kept even, light, and entirely subservient to the right-hand melody — many players let it become too prominent. The right hand should phrase the melody like a singer, with natural peaks and releases. Mozart''s markings are sparse; decisions about touch and phrasing must come from understanding the style.',
2, ARRAY['Alberti bass', 'Classical style', 'Melody and accompaniment', 'Phrasing', 'Mozart style']),

('To Spring (Op. 43, No. 6)', 'Edvard Grieg', 1886,
'One of Grieg''s most beloved Lyric Pieces, To Spring captures the energy and freshness of the Norwegian spring with a surging left-hand accompaniment and a soaring right-hand melody. It builds from a gentle opening to a full, passionate climax before subsiding to a quiet, reflective close. The piece is a wonderful introduction to Romantic character pieces and Grieg''s distinctive harmonic language.',
'The left-hand accompaniment — a rolling, arpeggiated figure — must stay fluid and even throughout while the right hand builds to a climax. Managing the crescendo convincingly without forcing or losing control at the top is the key challenge. The quiet ending requires a sudden and complete change of touch and character.',
2, ARRAY['Rolling accompaniment', 'Dynamic build', 'Climax control', 'Character contrast']),

('River Flows in You', 'Yiruma', 2001,
'Written by Korean pianist and composer Yiruma (Lee Ru-ma), River Flows in You became one of the most streamed piano pieces of the 21st century, widely shared on social media and used in film and television. Its simple, repetitive structure and immediately beautiful sound have made it enormously popular with self-teaching pianists. The piece flows in a steady eighth-note pattern throughout with a gentle, reflective melody.',
'This piece is rated Lower Intermediate because the notes and patterns are simple, but producing the characteristic floating, peaceful quality requires genuine touch control. The right-hand melody must sing clearly above the left-hand accompaniment without effort or tension. Avoid the common tendency to rush — the piece works best at a slow, unhurried tempo with generous use of the sustain pedal.',
2, ARRAY['Flowing accompaniment', 'Singing melody', 'Pedalling', 'Touch control', 'Steady tempo']),

-- ── UPPER INTERMEDIATE ────────────────────────────────────────────────────────

('Invention No. 13 in A minor (BWV 784)', 'J.S. Bach', 1723,
'The A minor invention is one of the most intense and searching in the set, with a chromatic, restless subject that winds through several related minor keys before reaching a resolution. It demands more expressive range than the earlier inventions and requires both hands to navigate more complex counterpoint. For the pianist, the emotional darkness of A minor should colour the touch throughout.',
'This is one of the harder inventions and sits firmly at Upper Intermediate. The chromaticism makes it more harmonically complex to understand and memorise. Both hands must be genuinely independent and expressive — this is not a neutral technical exercise but a deeply felt musical statement. The subject should be played with a slightly weighted, intense tone, not mechanically.',
3, ARRAY['Counterpoint', 'Chromaticism', 'Hand independence', 'Expressive depth', 'Minor key character']),

('Harmonious Blacksmith (Air and Variations)', 'George Frideric Handel', 1720,
'The nickname ''Harmonious Blacksmith'' was applied after Handel''s death to the Air and Variations from his Suite No. 5 in E major. The Air is a stately, ornamented melody followed by five variations of increasing brilliance. It is one of the great variation sets of the Baroque repertoire and a wonderful piece for developing both stylistic understanding and finger technique.',
'Each variation presents a different technical challenge — the second introduces steady eighth notes, the third sixteenth notes in one hand, the fourth sixteenth notes in both, and the fifth brilliant runs throughout. The player must maintain a singing tone even in the fastest variations. Ornaments in the Air must be learnt carefully and placed rhythmically without disrupting the melodic line.',
3, ARRAY['Variation form', 'Ornamentation', 'Baroque style', 'Progressive technique', 'Running passages']),

('Rondo alla Turca (Sonata K. 331, 3rd movement)', 'Wolfgang Amadeus Mozart', 1783,
'The famous Turkish March — officially the third movement of Mozart''s Sonata K. 331 — imitates the sound of Turkish Janissary bands that were fashionable in 18th-century Europe. Its crisp, rhythmic writing and bright character have made it one of the most recognisable piano pieces ever written. The first two movements of the sonata (a theme and variations and a minuet) are equally rewarding.',
'The Turkish March requires crisp, precise articulation — every note in the rapid passages must be equal and clear. The ornaments (grace notes and turns) must land on the beat without disturbing the rhythmic drive. The piece is often played too fast, which causes passages to blur; a slightly more restrained tempo with absolute clarity is far more effective.',
3, ARRAY['Crisp articulation', 'Ornamentation', 'Rhythmic precision', 'Classical style', 'Running passages']),

('Nocturne Op. 9, No. 2 in E flat major', 'Frédéric Chopin', 1832,
'The most famous of Chopin''s nocturnes, Op. 9 No. 2 has become a defining example of the Romantic piano lyric. Its long-breathed melody — elaborated with increasing ornamentation on each return — floats above a gently rocking left-hand accompaniment. Chopin''s nocturnes were inspired by the Irish composer John Field, but Chopin transformed the form into something far more expressive and harmonically adventurous.',
'The right-hand melody must sing with a genuine vocal quality — Chopin admired singers and wanted pianists to imitate them. The ornamental passages on the melody''s returns must sound spontaneous and improvisatory, not practised, which paradoxically requires a great deal of careful practice. The left hand must stay absolutely even and quiet beneath. Rubato should feel free but anchored.',
3, ARRAY['Singing melody', 'Ornamentation', 'Rubato', 'Left hand evenness', 'Romantic style', 'Voicing']),

('Prelude Op. 28, No. 4 in E minor', 'Frédéric Chopin', 1839,
'One of the most emotionally concentrated pieces in the piano repertoire, this prelude consists of a single sustained melody in the right hand over a slowly shifting inner-voice accompaniment — no more than one note moving at a time. It is utterly simple in construction yet devastating in effect when played with genuine feeling. Chopin is said to have considered it among his favourites.',
'The melody sits in the right hand''s thumb and must be voiced above the inner accompanying notes, which is technically subtle — the same hand plays both. The inner voice must move smoothly and quietly while the melody carries all the expression. Resist the urge to add excessive rubato; the piece''s power comes from restraint and simplicity.',
3, ARRAY['Voicing', 'Inner voice control', 'Restraint', 'Legato', 'Expressive depth']),

('Prelude Op. 28, No. 15 in D flat major (Raindrop)', 'Frédéric Chopin', 1839,
'The longest prelude in the Op. 28 set, the so-called ''Raindrop'' prelude takes its nickname from the repeated A flat (G sharp) that pulses throughout the entire piece like a single drop of rain. The opening is serene and song-like; the dark, ominous middle section in C sharp minor transforms the same note into a tolling funeral bell before the calm returns. It is a miniature tone poem of extraordinary imagination.',
'The persistent repeated note — always present, always the same pitch — must be calibrated carefully. In the opening it should be barely audible; in the middle section it becomes a pounding, inexorable pulse. Managing this gradation across the whole piece requires advanced pedalling and touch control. The middle section demands a weighted, dark tone quite different from the opening.',
3, ARRAY['Repeated note control', 'Pedalling', 'Tonal contrast', 'Atmospheric playing', 'Dynamic range']),

('Waltz Op. 64, No. 2 in C sharp minor', 'Frédéric Chopin', 1847,
'Among the most poignant of Chopin''s waltzes, Op. 64 No. 2 has a melancholy, wistful quality — it opens with a long-breathed melody that seems to circle back on itself, longing but never arriving. The contrasting middle section is faster and more urgent, providing dramatic relief before the opening material returns. This was one of the last waltzes Chopin completed before his death.',
'The opening melody must sustain over several bars and requires careful breathing and phrasing — think of it as a long vocal phrase, not a series of short gestures. The waltz accompaniment must dance lightly beneath it. The faster middle section presents a real tempo contrast and its own running passages. Bringing it all together convincingly requires mature musical judgement.',
3, ARRAY['Singing melody', 'Waltz style', 'Tempo contrast', 'Phrasing', 'Rubato']),

('Waltz Op. 69, No. 1 in A flat major (Farewell)', 'Frédéric Chopin', 1835,
'Chopin wrote this waltz as a parting gift for Maria Wodzińska, with whom he had a brief romantic relationship. It was published posthumously and carries its nickname ''Farewell'' from this context. The piece opens with a tender, nostalgic melody before moving through contrasting sections of warmth and wistfulness. It is one of the most directly emotional of all Chopin''s waltzes.',
'The melody needs a warm, personal tone — this is intimate music, not concert showpiece. The ornaments and grace notes must sound natural and unforced. The waltz bass must dance without heaviness. One specific challenge is the chromatic inner voices in certain passages, which require careful fingering to keep smooth. A personal, singing quality in the right hand is everything.',
3, ARRAY['Singing melody', 'Ornamentation', 'Waltz style', 'Rubato', 'Intimate character']),

('Arabeske (Op. 18)', 'Robert Schumann', 1839,
'Schumann''s Arabeske is one of his most refined and lyrical piano pieces — a flowing, graceful work in C major that moves between a gentle main theme and more turbulent contrasting episodes. The title refers to an ornamental style of decoration, suggesting the way the music winds and curves. Schumann described it as ''delicate'' and intended it for a sensitive, responsive audience.',
'The flowing right-hand melody must sing above a gentle left-hand accompaniment across a wide range of dynamics. The middle episodes are more intense and require a fuller tone before returning to the delicate main theme. Achieving a genuinely beautiful, poised sound — not saccharine but truly refined — is the goal and the challenge.',
3, ARRAY['Lyrical playing', 'Singing melody', 'Dynamic contrast', 'Tonal refinement', 'Phrasing']),

('Consolation No. 3 in D flat major', 'Franz Liszt', 1850,
'The six Consolations are among Liszt''s most intimate and serene works, a deliberate contrast to the virtuosic fireworks of his concert paraphrases. The third, in D flat major, is the most famous — a simple, hymn-like melody over a sustained accompaniment that creates a warm, spacious sound. Liszt was deeply religious and these pieces reflect a meditative, inward-looking side of his character that is often overlooked.',
'This piece is rated Upper Intermediate because its demands are musical rather than technical — the notes are not difficult, but achieving the warm, full sound Liszt requires is challenging. The right hand plays a melody while also sustaining harmony notes; the left plays a rich accompaniment that should bloom, not thud. The sustain pedal is essential but must be changed carefully to keep the harmony clean.',
3, ARRAY['Voicing', 'Sustained tone', 'Pedalling', 'Lyrical playing', 'Harmonic warmth']),

('Pavane pour une infante défunte', 'Maurice Ravel', 1899,
'Written when Ravel was a student at the Paris Conservatoire, the Pavane for a Dead Princess is one of his most beloved works. Its title refers not to any specific princess but to a general image of a stately court dance from centuries past. The piece has a gentle, elegiac quality — a long, floating melody over a simple accompaniment — and became so popular that Ravel later orchestrated it.',
'The melody must maintain an extremely long line — it is essentially one continuous phrase over many bars and must not be chopped into small units. The accompaniment should be light and transparent, never heavy. Ravel was critical of overly sentimental interpretations: the music should be poised and elegant, not weepy. Pedalling must keep the texture clear without muddiness.',
3, ARRAY['Long melodic line', 'Elegant style', 'Pedalling', 'Accompaniment balance', 'Tonal control']),

('Arabesque No. 1 in E major', 'Claude Debussy', 1891,
'Written in his mid-twenties, Debussy''s first Arabesque is an early example of his impressionistic approach — a flowing, gently arpeggiated texture that shimmers and shifts like light on water. The title refers to an ornamental decorative style and the music has a corresponding sense of graceful ornamentation and fluid movement. It is one of Debussy''s most accessible pieces while still capturing his distinctive sound world.',
'The arpeggiated texture must flow without bumps or accents — every note in the pattern should be equal in volume, creating a smooth wash of sound. The melody emerges from within this texture and must be gently voiced above it. Debussy''s dynamic range is subtle; the piece rarely exceeds a moderate dynamic level. The sustain pedal is essential and must be changed delicately.',
3, ARRAY['Arpeggiated texture', 'Voicing', 'Pedalling', 'Impressionism', 'Tonal colour']),

('Fantasie in D minor (K. 397)', 'Wolfgang Amadeus Mozart', 1782,
'This haunting fantasy begins with a dramatic, improvisatory introduction before settling into a more structured Andante. It has a searching, unsettled quality unusual for Mozart and may have been left incomplete at his death — the final section was completed by another hand. For the pianist, the improvisatory opening demands real freedom and drama, while the later sections ask for Mozart''s characteristic elegance.',
'The opening section should feel genuinely improvised — free in tempo, dramatic in gesture, with sudden changes of mood and dynamic. This requires a very different approach from Mozart''s more formal works and demands musical confidence. The transition to the more structured Andante requires a complete change of character. Holding the whole thing together as a coherent narrative is the challenge.',
3, ARRAY['Improvisatory style', 'Dramatic contrast', 'Character changes', 'Tempo freedom', 'Mozart style']),

('Romanian Folk Dances (Sz. 56)', 'Béla Bartók', 1915,
'Bartók collected thousands of folk melodies across Romania, Hungary, and the Balkans, and the Romanian Folk Dances are among the most successful arrangements he made for piano. Six dances of contrasting character — some gentle and lyrical, others energetic and percussive — are presented in a suite that lasts about six minutes in total. The piece is a wonderful introduction to Bartók''s mature style and to the folk music traditions that inspired him.',
'The dances vary considerably in difficulty within the set — the opening ''Stick Dance'' is simpler, while later dances require faster fingers and more complex rhythmic feel. The folk character should inform the touch: some dances need a dry, clipped sound; others a more open, singing quality. Bartók''s rhythmic patterns, influenced by Bulgarian and Romanian metres, can feel unfamiliar and deserve careful counting.',
3, ARRAY['Folk style', 'Contrasting characters', 'Rhythmic precision', 'Tonal variety', 'Bartók style']),

('Intermezzo Op. 117, No. 1 in E flat major', 'Johannes Brahms', 1892,
'Brahms wrote his late piano pieces — the Opp. 116-119 collections — in the last years of his life, describing them as ''the lullabies of my sorrows.'' The first intermezzo of Op. 117 is headed with a Scottish folk poem about a mother singing her child to sleep, and its rocking, cradle-like motion reflects this. It is music of extraordinary warmth and introspection.',
'The rocking left-hand accompaniment must be absolutely even — like a lullaby, it cannot lurch or rush. The right-hand melody must sing above it with warmth but without effort. Brahms''s thick harmonic texture makes voicing the top melody note above the inner parts a real technical challenge for the fingers. This is music that requires patience and genuine musical maturity.',
3, ARRAY['Voicing', 'Even accompaniment', 'Singing melody', 'Brahms style', 'Inner voices']),

('Nuvole Bianche', 'Ludovico Einaudi', 2004,
'From Einaudi''s album Una Mattina, Nuvole Bianche (''White Clouds'') is one of the Italian composer''s most popular pieces and one of the most widely played contemporary piano works in the world. Its simple, meditative structure — a gently flowing left-hand accompaniment beneath an improvisatory right-hand melody — makes it immediately accessible while still rewarding careful musical attention.',
'The left-hand pattern must flow without interruption or accent, creating a constant, calm foundation. The right-hand melody should feel free and improvisatory above it — Einaudi''s music rewards a personal, expressive approach. The piece is long and requires sustained concentration to maintain its atmospheric quality from beginning to end. Good pedalling is essential.',
3, ARRAY['Flowing accompaniment', 'Atmospheric playing', 'Pedalling', 'Contemporary style', 'Expressive freedom']),

('Vocalise (Op. 34, No. 14) — piano arrangement', 'Sergei Rachmaninoff', 1915,
'Originally written for voice and piano, Rachmaninoff''s Vocalise — a wordless melody — has been arranged for numerous instruments. In its piano arrangement it presents a long, arching melody of extraordinary beauty over a gentle accompaniment. The piece encapsulates Rachmaninoff''s gift for long-breathed melodic writing and his deeply Romantic harmonic language.',
'The challenge is sustaining a convincing long melodic line on the piano — an instrument whose notes naturally decay — across many bars. The melody must seem to breathe and grow naturally. The accompaniment must support without intruding. This is a wonderful study in cantabile playing and in shaping a sustained line over a slow harmonic rhythm.',
3, ARRAY['Cantabile', 'Long melodic line', 'Sustained tone', 'Accompaniment balance', 'Romantic style']),

('Schumann — Of Foreign Lands and Peoples (Op. 15, No. 1)', 'Robert Schumann', 1838,
'The opening piece of Kinderszenen, ''Of Foreign Lands and Peoples'' sets the scene for the whole collection with a gentle, dreaming quality — as if a child is imagining distant, exotic places. It is short, simple, and utterly beautiful. For the pianist, the inner voices of the texture must be carefully managed, and the melody — which moves between the top of the right hand and the inner voice — must always be heard clearly.',
'The melody in this piece passes between different fingers and registers, which makes voicing it consistently a genuine challenge. The pianist must actively listen to ensure the melody always projects above the accompaniment. The piece should feel unhurried and dreamlike, with a gentle, transparent tone throughout. Less is more here — resist the urge to add too much expression.',
3, ARRAY['Voicing', 'Inner voices', 'Transparent tone', 'Character', 'Schumann style']),

('Una Mattina', 'Ludovico Einaudi', 2004,
'The title piece of Einaudi''s 2004 album, Una Mattina (''One Morning'') is a quietly contemplative work that unfolds slowly and simply. Like much of Einaudi''s music, it uses repetition and gradual development to build an atmosphere rather than following conventional harmonic or formal structures. It has become one of the most recognised contemporary piano pieces.',
'The repeating left-hand pattern must be absolutely even and hypnotic — any unevenness immediately draws attention. The right hand''s melodic material grows gradually from simple to more complex and must feel like a natural development rather than a series of disconnected ideas. Sustain pedal management is crucial for keeping the harmony clear.',
3, ARRAY['Ostinato', 'Atmospheric playing', 'Pedalling', 'Contemporary style', 'Even accompaniment']),

-- ── ADVANCED ─────────────────────────────────────────────────────────────────

('Pathétique Sonata — 1st movement (Op. 13)', 'Ludwig van Beethoven', 1799,
'The Pathétique is one of Beethoven''s most ambitious early works — an emotionally charged sonata that opens with a dramatic, slow introduction before launching into a turbulent Allegro. The nickname (approved by Beethoven himself) refers to the piece''s passionate, stormy character. The first movement alone spans an enormous emotional range, from grave dignity to fierce urgency to lyrical tenderness.',
'This movement requires considerable physical and technical command. The opening grave demands a weighty, authoritative tone; the Allegro requires fast, reliable scales and arpeggios under pressure; the lyrical second theme asks for a complete change of character and touch. Managing all of this within a single movement — and making the dramatic structure convincing — is what places this in the Advanced category.',
4, ARRAY['Dramatic range', 'Fast scales', 'Arpeggios', 'Character contrast', 'Physical stamina']),

('Pathétique Sonata — 2nd movement (Op. 13)', 'Ludwig van Beethoven', 1799,
'The slow movement of the Pathétique is one of Beethoven''s most beautiful cantilena movements — a long, singing theme in A flat major that floats over a gentle accompaniment. It is music of profound tenderness and restraint, a world away from the turbulence of the first movement. The theme is developed through two variations before the original melody returns.',
'The melody must sustain over long phrases with a genuinely vocal quality — Beethoven marked it cantabile (singing). The accompaniment triplets must stay even and quiet. The inner voices of the texture must not poke through accidentally. This movement rewards pianists with a beautiful, natural tone and the patience to let the music breathe at a slow tempo.',
4, ARRAY['Cantabile', 'Voicing', 'Triplet accompaniment', 'Sustained tone', 'Expressive depth']),

('Moonlight Sonata — 3rd movement (Op. 27, No. 2)', 'Ludwig van Beethoven', 1801,
'The finale of the Moonlight Sonata is a violent, breathless movement that stands in shocking contrast to the famous first movement. Marked Presto agitato, it unleashes rapid arpeggios, stormy octaves, and turbulent scales in a movement that pushed the technical boundaries of Beethoven''s era. It is one of the most emotionally raw and technically demanding of all Beethoven''s sonata finales.',
'This movement is genuinely difficult — rapid arpeggios in the right hand must be fast and even, while the left provides powerful bass lines and rhythmic drive. The octave passages require a firm, reliable wrist mechanism that can sustain at speed without tension. Stamina across the whole movement is a real factor. The emotional delivery must match the technical demands.',
4, ARRAY['Fast arpeggios', 'Octaves', 'Physical stamina', 'Dramatic intensity', 'Presto control']),

('Nocturne Op. 9, No. 1 in B flat minor', 'Frédéric Chopin', 1832,
'The first nocturne of Op. 9 is darker and more complex than the famous second, with a brooding B flat minor opening and a more passionate, turbulent character. The left hand plays long, sweeping arpeggios that span a wide range of the keyboard, while the right hand sustains a deeply expressive melody. It is longer and more harmonically adventurous than Op. 9 No. 2.',
'The wide left-hand arpeggios — some spanning a tenth or more — require a relaxed arm and wrist with no tension; grabbing or pressing will cause injury and uneven tone. The right-hand melody must sustain above these large gestures with complete independence. The ability to voice the melody clearly while the left arm is making large, sweeping movements is an advanced coordination challenge.',
4, ARRAY['Wide arpeggios', 'Left hand span', 'Voicing', 'Coordination', 'Expressive depth']),

('Fantaisie Impromptu (Op. 66)', 'Frédéric Chopin', 1835,
'Perhaps Chopin''s most technically challenging piece to become genuinely popular, the Fantaisie Impromptu features a continuous polyrhythm of three against four — the right hand playing four sixteenth notes to every three in the left. Chopin himself reportedly did not want this piece published, feeling it was too derivative of a work by Ignaz Moscheles. Fortunately it was published posthumously and has been captivating audiences ever since.',
'The three-against-four polyrhythm is the defining challenge — the right hand plays four notes for every three in the left, and they must not align into a simplified pattern. Achieving this genuinely requires practising each hand perfectly alone before very slowly combining them. The lyrical middle section provides contrast but then the difficult polyrhythm must resume, often harder after a rest.',
4, ARRAY['Polyrhythm', 'Three against four', 'Technical demand', 'Fast passages', 'Contrasting sections']),

('Étude Op. 10, No. 3 in E major (Tristesse)', 'Frédéric Chopin', 1833,
'Chopin reportedly said of this étude ''in all my life I have never again been able to find such a beautiful melody'' — high praise from the composer himself. The opening section is one of the most sublime slow melodies in all piano music, requiring an exquisite singing tone. The middle section erupts into a demanding passage of double thirds and sixths that forms a fierce technical contrast.',
'The opening melody must be played with the most beautiful, natural singing tone the pianist can produce — this is the piece''s whole reason for existing. The middle section''s double thirds and sixths are genuinely hard, requiring well-developed finger independence and evenness. Returning to the tender opening character after that technical battle is itself a musical challenge.',
4, ARRAY['Singing melody', 'Double thirds', 'Double sixths', 'Tonal beauty', 'Character contrast']),

('Ballade No. 1 in G minor (Op. 23)', 'Frédéric Chopin', 1835,
'The first of Chopin''s four ballades is one of the greatest works in the entire piano repertoire — a sweeping, narrative work that builds from a mysterious opening through lyrical themes and dramatic development to one of the most terrifying codas in all piano music. It is said to have been inspired by the poems of Adam Mickiewicz. The piece spans an enormous emotional range and requires both technical command and storytelling ability.',
'The Ballade demands almost everything from a pianist: a beautiful singing tone for the lyrical themes, reliable arpeggios and scales in the development, controlled rubato, and the stamina to execute the devastating coda — which includes rapid octaves, fast scale runs, and ferocious chordal passages — convincingly at the end of an already demanding piece. Structural understanding of the whole narrative arc is essential.',
4, ARRAY['Lyrical playing', 'Fast arpeggios', 'Octaves', 'Stamina', 'Narrative structure', 'Dramatic coda']),

('Liebestraum No. 3 in A flat major', 'Franz Liszt', 1850,
'The most famous of Liszt''s three Liebesträume (Love Dreams), this piece was originally a setting of a poem by Ferdinand Freiligrath about transcendent love. In its piano version it presents a warmly singing melody over a continuous arpeggiated accompaniment, building to a passionate climax before subsiding to a quiet, tender close. It is one of Liszt''s most approachable yet genuinely demanding works.',
'The left hand''s continuous wide arpeggios — often spanning an octave or more — must flow smoothly and quietly beneath the right-hand melody at all times. Managing these large left-hand gestures without tension or accent is a significant technical challenge. The climax requires a broad, powerful tone, and the ability to then retreat to a whisper for the ending tests dynamic control at its finest.',
4, ARRAY['Wide arpeggios', 'Voicing', 'Dynamic range', 'Climax control', 'Romantic style']),

('Hungarian Rhapsody No. 2 in C sharp minor', 'Franz Liszt', 1847,
'The most famous of Liszt''s 19 Hungarian Rhapsodies, the second has been used in countless films, cartoons, and advertisements, making its themes instantly recognisable. It is structured in two sections — the slow, brooding lassan and the fast, exhilarating friska — drawing on Hungarian-Romani musical idioms. It remains one of the most spectacular showpieces in the piano repertoire.',
'This is a genuine showpiece that requires fast, reliable octave technique, brilliant scale passages, and the ability to control extreme dynamic contrast. The slow opening section demands improvisatory freedom and a rich, dark tone; the fast finale demands speed, accuracy, and physical stamina. The cadenza-like passages require the kind of technical security that only comes from sustained, focussed practice.',
4, ARRAY['Octave technique', 'Virtuosity', 'Dynamic range', 'Improvisation', 'Physical stamina', 'Showpiece']),

('Intermezzo Op. 118, No. 2 in A major', 'Johannes Brahms', 1893,
'Perhaps the most beloved of all Brahms''s late piano pieces, the A major Intermezzo of Op. 118 opens with a warmly singing melody that seems to emerge from deep in the middle of the piano''s range. Brahms''s rich harmonic language and dense inner voices make this a piece of great depth. The contrasting middle section moves to A minor with a more restless, passionate character before the opening material returns.',
'The opening melody sits in the middle of the texture and must project above the surrounding inner voices — a significant voicing challenge, especially because those inner voices are played by the same hand. Brahms''s harmonic language is complex and the player must understand the harmony deeply to voice it convincingly. The passionate middle section requires real tonal weight and forward momentum.',
4, ARRAY['Voicing', 'Inner voices', 'Brahms style', 'Harmonic depth', 'Character contrast']),

('Rhapsody in B minor (Op. 79, No. 1)', 'Johannes Brahms', 1879,
'The two Op. 79 Rhapsodies are among Brahms''s most passionate and overtly virtuosic piano works, written in his mid-forties at the height of his powers. The B minor Rhapsody opens with tremendous energy — massive chords, driving octaves — and maintains a high level of intensity throughout. It is music of rugged, uncompromising strength.',
'This is a physically demanding piece — the powerful chordal writing and fast octave passages require a strong, reliable wrist and arm technique. The challenge is maintaining the fierce, relentless character without becoming tense or losing musical shape. Brahms''s music must always breathe, even when it is at its most forceful. Stamina and tonal power are the primary requirements.',
4, ARRAY['Octaves', 'Chordal technique', 'Physical stamina', 'Tonal power', 'Brahms style']),

('Impromptu Op. 90, No. 2 in E flat major', 'Franz Schubert', 1827,
'The second of Schubert''s four Impromptus Op. 90 is a sparkling, perpetual-motion piece in which the right hand plays continuous triplet sixteenth notes from beginning to end. It moves through several contrasting keys and moods — from the bright, flowing opening to a darker central section in G flat major — before returning to the home key with renewed energy.',
'The continuous right-hand triplets must be absolutely even — any unevenness in the running sixteenth notes is immediately obvious. The arm and wrist must remain relaxed throughout to avoid fatigue. The left hand provides chordal accompaniment that must be kept subordinate. This is essentially a study in maintaining a fast, even finger technique across a long piece while also shaping the music expressively.',
4, ARRAY['Continuous triplets', 'Evenness', 'Relaxed technique', 'Stamina', 'Dynamic shaping']),

('Impromptu Op. 142, No. 3 in B flat major', 'Franz Schubert', 1827,
'This impromptu is a theme and variations — Schubert''s tender main theme is followed by a set of variations of increasing complexity and contrast, including a delicate pianissimo variation, a powerful fortissimo variation, and a gentle final variation that returns to the theme''s original spirit. It is one of Schubert''s most perfectly constructed piano works.',
'Each variation presents different technical demands: evenness of touch, clarity in rapid ornamental passages, power in the forte variation, and tonal delicacy in the quiet ones. The challenge is maintaining stylistic consistency while adapting to each variation''s character. The theme itself must be played with a simple, song-like beauty that makes all the variations worthwhile.',
4, ARRAY['Variation form', 'Technical variety', 'Tonal range', 'Stylistic consistency', 'Schubert style']),

('La cathédrale engloutie (Préludes Book I, No. 10)', 'Claude Debussy', 1910,
'Inspired by the Breton legend of the submerged cathedral of Ys, which rises from the sea on certain mornings, this prelude is one of Debussy''s most dramatic and atmospheric works. It moves from hushed, mysterious parallel chords suggesting the cathedral emerging from the waves, through a great bell-like climax, to a quiet disappearance back beneath the surface. The whole keyboard is used, and the dynamic range is enormous.',
'The parallel chord passages — which move in blocks of sound rather than individual voices — must flow smoothly without the joins showing. The climax requires a genuinely powerful, organ-like sound that the piano can achieve only with great physical weight and excellent pedalling. The pianissimo passages at the beginning and end demand an almost inaudible touch. This is a physically and musically demanding piece.',
4, ARRAY['Parallel chords', 'Pedalling', 'Dynamic extremes', 'Atmospheric playing', 'Physical power', 'Impressionism']),

('Arabesque No. 2 in G major', 'Claude Debussy', 1891,
'Debussy''s second Arabesque has a more playful, quicksilver character than the first — its main theme is brighter and more rhythmically active. It alternates between flowing sections and a more scherzando central episode before returning to the main theme. Like the first Arabesque, it showcases Debussy''s early move away from conventional harmony toward the impressionistic language that would define his mature style.',
'The light, dancing character requires a nimble, precise touch — the faster passages must sparkle without heaviness. Balance between the hands must be carefully maintained, with the melody always projecting clearly. The contrasting sections require a complete change of character and touch, and the transitions between them must feel natural.',
4, ARRAY['Nimble technique', 'Tonal sparkle', 'Character contrast', 'Hand balance', 'Impressionism']),

('Prelude in C sharp minor (Op. 3, No. 2)', 'Sergei Rachmaninoff', 1892,
'Written when Rachmaninoff was just nineteen, this short prelude became so popular that audiences demanded he play it at every concert — a burden he reportedly found tiresome. Its opening three-note motto (dot-dot-BANG) is one of the most recognisable gestures in all piano music. The piece builds from this tolling figure through a passionate central section to a thunderous climax before subsiding.',
'The opening chords must sound absolutely massive and inexorable — like a great bell tolling. This requires excellent chord technique and full arm weight. The central section''s rapid passages demand reliable fingerwork under pressure. The climax at fortissimo must be controlled rather than just loud — power without chaos. The quiet ending after such a climax requires a complete psychological shift.',
4, ARRAY['Chord technique', 'Physical power', 'Fast passages', 'Dynamic control', 'Climax management']),

('Prelude in G minor (Op. 23, No. 5)', 'Sergei Rachmaninoff', 1901,
'One of Rachmaninoff''s most popular individual pieces, this march-like prelude has an irresistible drive and energy. The main theme, marked alla marcia, has a military swagger; the contrasting middle section is more lyrical and flowing before the march returns with even greater force. It is a piece of considerable physical demand and showmanship.',
'The march theme requires powerful, crisp chordal playing with a clear rhythmic pulse. The rapid left-hand runs in the development section demand fast, reliable fingerwork. Stamina across the whole piece is a real consideration — the forte passages are relentless. The ability to maintain a clear musical structure while meeting the considerable physical demands places this firmly in Advanced territory.',
4, ARRAY['Chordal technique', 'March style', 'Fast runs', 'Physical stamina', 'Rhythmic precision']),

('Rondo Capriccioso (Op. 14)', 'Felix Mendelssohn', 1830,
'This brilliant showpiece combines a slow, expressive Andante introduction with a sparkling, fast Presto finale that showcases Mendelssohn''s gift for light, rapid fingerwork. The Presto is one of the most effervescent pieces in the repertoire — light, witty, and technically demanding in its requirement for fast, even sixteenth notes and swift hand position changes.',
'The Andante introduction requires a singing, expressive tone; the Presto demands something entirely different — fast, featherlight, perfectly even sixteenth notes that seem to cascade effortlessly. The rapid passages must be genuinely fast without tension or heaviness. Maintaining this lightness while also projecting the melody above the texture is the central technical challenge.',
4, ARRAY['Fast passages', 'Light touch', 'Evenness', 'Character contrast', 'Brilliant technique']),

('Maple Leaf Rag', 'Scott Joplin', 1899,
'Scott Joplin''s Maple Leaf Rag was the first piece of sheet music to sell over one million copies and helped launch the ragtime era. Its characteristic ''ragged'' syncopated rhythms set against a steady bass create an irresistible rhythmic feel that influenced jazz and popular music for decades. Joplin''s marking — ''Notice: do not play this piece fast — it is never right to play Ragtime fast'' — is frequently ignored but should be heeded.',
'Ragtime''s defining challenge is the syncopated right hand against a steady, non-syncopated left — the two rhythms must coexist without the right hand pulling the left off the beat, or the left making the right hand square. This independence is harder to achieve than it sounds. Following Joplin''s own instruction and keeping the tempo moderate (not fast) allows the syncopations to land clearly and the rhythmic interplay to be fully heard.',
4, ARRAY['Syncopation', 'Rhythmic independence', 'Ragtime style', 'Steady bass', 'Coordination']),

('Seasons — October (Op. 37a)', 'Pyotr Ilyich Tchaikovsky', 1876,
'Tchaikovsky wrote one piece for each month of the year for a St Petersburg music magazine — The Seasons is the result. October, subtitled ''Autumn Song,'' is the most famous and most melancholy of the twelve — a deeply nostalgic piece in E minor with a long, wistful melody that seems to speak of fading light and the end of something beautiful.',
'The extended melody must be shaped over long phrases with a natural ebb and flow — it is essentially a song without words and should be treated as such. The accompaniment must support without intruding. Tchaikovsky''s harmonic language is rich and the inner voices of the texture deserve careful attention. The challenge is sustaining the melancholy atmosphere across the whole piece without becoming sentimental.',
4, ARRAY['Singing melody', 'Phrasing', 'Harmonic richness', 'Atmospheric playing', 'Sustained tone']),

('Experience', 'Ludovico Einaudi', 2013,
'One of Einaudi''s most widely heard pieces, Experience became globally recognised through its use in the film The Intouchables. The piano part layers a flowing arpeggiated accompaniment against a simple but deeply affecting melody, building gradually in intensity. In its full arrangement, string orchestra joins the piano — the solo piano version distils the essence of the piece into the keyboard alone.',
'Maintaining the arpeggiated accompaniment pattern evenly and continuously while shaping the melody requires real independence between the hands. The piece builds over a long arc and requires the pianist to manage a gradual crescendo convincingly without peaking too early. Sustain pedal must keep the texture clear despite the flowing, overlapping notes.',
4, ARRAY['Arpeggiated accompaniment', 'Hand independence', 'Dynamic build', 'Pedalling', 'Contemporary style']),

-- ── EXPERT ───────────────────────────────────────────────────────────────────

('Appassionata Sonata — 1st movement (Op. 57)', 'Ludwig van Beethoven', 1807,
'The Appassionata is one of Beethoven''s most dramatic and technically demanding sonatas, written at the height of his middle period. The first movement opens with a brooding, hushed theme that erupts into violent storms of arpeggios and thunderous fortissimo passages. Beethoven pushed the piano to its absolute limits — contemporary instruments could barely sustain the force he demanded.',
'This movement demands power, speed, and musical intelligence simultaneously. The opening theme must whisper with menace before exploding. Fast, accurate arpeggios across the full keyboard, relentless octave passages, and the ability to control extreme dynamics — all while maintaining the music''s fierce logic — make this one of the most demanding first movements in the sonata repertoire.',
5, ARRAY['Virtuosity', 'Fast arpeggios', 'Octaves', 'Physical power', 'Dramatic intensity', 'Stamina']),

('Waldstein Sonata — 1st movement (Op. 53)', 'Ludwig van Beethoven', 1804,
'Beethoven''s Waldstein Sonata represents a quantum leap in pianistic writing — wider keyboard range, faster tempos, and a new kind of brilliant, percussive technique that anticipates Liszt. The first movement''s opening — a rapid, pulsing C major theme — immediately establishes a world of energy and brilliance. The second theme, by contrast, is one of Beethoven''s most luminous and serene melodies.',
'The repeated-chord opening requires a fast, controlled wrist staccato that can sustain at speed without fatigue. The brilliant running passages demand fast, clean fingerwork. The lyrical second theme must be played with a warm, singing tone completely at odds with the surrounding energy — achieving this contrast is a major musical challenge. The sheer speed of the movement is a significant physical demand.',
5, ARRAY['Wrist staccato', 'Fast passages', 'Character contrast', 'Physical demand', 'Virtuosity', 'Speed']),

('Étude Op. 10, No. 1 in C major', 'Frédéric Chopin', 1833,
'The opening étude of Op. 10 immediately announces that this is no conventional teaching exercise — it launches into a continuous stream of wide right-hand arpeggios spanning the full range of the keyboard, demanding a technique that was essentially new in 1833. Liszt called the études ''transcendental'' and this one in particular demands a completely new approach to the arm and hand.',
'The wide arpeggios must be played with a completely relaxed arm and wrist — any tension will cause injury. The hand must open and close smoothly across large intervals without grabbing. This is a study in what Chopin called the ''natural'' hand position and arm weight technique. It cannot be mastered by force or practice of the wrong kind — it requires careful, patient technical understanding.',
5, ARRAY['Wide arpeggios', 'Arm technique', 'Relaxed wrist', 'Span', 'Advanced technique', 'Physical demand']),

('Étude Op. 10, No. 4 in C sharp minor', 'Frédéric Chopin', 1833,
'One of the most ferocious études in the entire Op. 10 set, the C sharp minor étude is relentlessly fast and intense from the first bar to the last. Both hands engage in rapid, interlocking chromatic passages that create a breathless, driven energy. There is no lyrical relief — the piece is pure technical storm from beginning to end.',
'This étude demands fast, reliable fingerwork in both hands simultaneously — there is no ''easy'' hand. The chromatic passages must be equally even in both hands, and the speed demanded is extreme. Stamina, accuracy, and the ability to maintain musical direction and dynamic shaping while executing very fast passage work are the core challenges. Few pieces test overall technical command more stringently.',
5, ARRAY['Fast passages', 'Both hands', 'Chromatic runs', 'Stamina', 'Speed', 'Technical demand']),

('Étude Op. 25, No. 9 in G flat major (Butterfly)', 'Frédéric Chopin', 1837,
'The shortest of all Chopin''s études, the ''Butterfly'' étude is a study in double thirds — a succession of two notes played simultaneously by one hand in thirds, requiring each pair to be perfectly even and each finger independently controlled. Despite its brevity, it is technically challenging out of all proportion to its length. The light, dancing character and the butterfly nickname suit it perfectly.',
'Double thirds are one of the hardest technical demands in piano playing — each finger of the same hand must control its own note independently, and every pair must sound perfectly simultaneous and even. The passage must be fast and light — like a butterfly''s wings — never heavy or laboured. Slow, careful practice on the double-third passages alone is essential before approaching tempo.',
5, ARRAY['Double thirds', 'Finger independence', 'Evenness', 'Light touch', 'Technical demand']),

('Polonaise in A flat major (Op. 53, Heroic)', 'Frédéric Chopin', 1843,
'The most famous of Chopin''s polonaises, the ''Heroic'' is a piece of tremendous grandeur and physical power. Its opening theme — massive, striding chords — immediately establishes a monumental character. The famous middle section, with its left-hand octaves pounding out a repeated bass figure while the right hand carries a soaring melody, is one of the most physically demanding passages in the standard repertoire.',
'The left-hand octave section in the trio is the piece''s central technical challenge — repeated bass octaves at moderate speed for an extended period, requiring a completely relaxed arm technique to avoid fatigue and injury. If played with any tension, this passage cannot be sustained. The overall piece demands physical power, stamina, and a commanding stage presence. This is genuinely music for the concert hall.',
5, ARRAY['Octave technique', 'Physical stamina', 'Power', 'Arm relaxation', 'Concert repertoire', 'Heroic character']),

('La Campanella (Grandes Études de Paganini, No. 3)', 'Franz Liszt', 1851,
'Liszt transcribed Paganini''s violin caprices for piano, and La Campanella — based on the finale of Paganini''s Violin Concerto No. 2 — became the most famous and most feared of these transcriptions. Its rapid, high right-hand passages, wide leaps, and repeated notes at speed pushed the 19th-century piano to its limits and remain among the most extreme technical demands in the repertoire today.',
'La Campanella is genuinely one of the hardest pieces in the standard repertoire. The rapid repeated notes at the top of the keyboard require a specialised wrist technique to sustain at speed. The wide leaps across the keyboard must be accurate. The combination of these elements simultaneously — while also playing the melody and maintaining musical shape — defines the outer limit of what most pianists can achieve.',
5, ARRAY['Repeated notes', 'Wide leaps', 'Wrist technique', 'Virtuosity', 'Speed', 'Advanced coordination']),

('Gaspard de la Nuit — Ondine', 'Maurice Ravel', 1908,
'Ravel''s Gaspard de la Nuit, based on poems by Aloysius Bertrand, is widely considered one of the most difficult pieces in the standard piano repertoire. The first movement, Ondine, depicts a water sprite attempting to lure a human lover — a shimmering, iridescent wash of arpeggios and trills surrounds a fragile melody. The technical demands are extraordinary even before approaching the harder movements.',
'Ondine requires the pianist to maintain a continuous shimmer of soft, rapid figurations while projecting a melody from within the texture — a feat of voicing and independence that is among the most technically advanced demands in piano writing. The trills must be completely even and pianissimo. This is a piece that requires years of preparation at an advanced level before it can be attempted convincingly.',
5, ARRAY['Advanced voicing', 'Continuous figurations', 'Tonal shimmer', 'Extreme difficulty', 'Impressionism', 'Virtuosity']),

('Toccata (Op. 11)', 'Sergei Prokofiev', 1912,
'Prokofiev''s Toccata is one of the most percussive and relentlessly driven pieces in the piano repertoire — a single-movement tour de force of mechanical, piston-like energy from the first note to the last. It was written when Prokofiev was twenty-one and deliberately avoids all sentimentality, treating the piano as a rhythmic instrument above all else. It sounds like a machine that has come to life.',
'The Toccata demands absolute rhythmic precision at high speed for its entire duration — there is no relief, no lyrical section, no slowing down. The fingers must be able to sustain fast, even repeated notes and rapid passages without fatigue. The greatest challenge is maintaining the machine-like precision while also giving the piece musical direction and avoiding mere mechanical banging.',
5, ARRAY['Rhythmic precision', 'Stamina', 'Fast technique', 'Mechanical character', 'Speed', 'Percussive touch']),

('Ballade No. 4 in F minor (Op. 52)', 'Frédéric Chopin', 1843,
'Considered by many pianists and scholars to be Chopin''s greatest single work, the fourth Ballade is a masterpiece of sustained emotional intensity and technical complexity. It opens with a deceptively simple, questioning theme that gradually gathers weight and darkness before an overwhelming final section that is arguably the most terrifying music Chopin ever wrote.',
'This is one of the most demanding pieces in the entire piano repertoire — not because of any single passage but because of the sustained level of musical and technical command required across the whole work. The lyrical sections demand the finest possible singing tone; the development section requires complete technical reliability under extreme musical pressure; the coda demands everything a pianist can give. It is the culmination of Chopin''s art.',
5, ARRAY['Sustained intensity', 'Lyrical depth', 'Technical range', 'Stamina', 'Coda', 'Musical maturity']),

('Sonata No. 2 in B flat minor (Op. 35) — 3rd movement (Funeral March)', 'Frédéric Chopin', 1840,
'The third movement of Chopin''s Op. 35 Sonata is one of the most famous funeral marches ever written — its tolling left-hand bass and solemn tread are instantly recognisable. It is framed by the mysterious, whispered final movement. The March itself alternates between its grave, processional main theme and a tender, consoling middle section of extraordinary beauty.',
'The funeral march must have genuine weight and inevitability — the tempo must not waver and the heavy chords must toll with authority. The lyrical middle section requires a complete transformation of touch and character — warm, consoling, gentle. The mysterious final movement (a continuous murmur in both hands) requires the lightest possible touch and an absolutely even, pianissimo tone.',
5, ARRAY['Chordal weight', 'Dramatic contrast', 'Tonal control', 'Rhythmic inevitability', 'Character transformation']),

('Rhapsody in Blue (solo piano version)', 'George Gershwin', 1924,
'Originally composed for jazz band and orchestra, Gershwin''s Rhapsody in Blue exists in a solo piano version that captures the work''s improvisatory, jazz-influenced spirit. Its famous opening glissando, bluesy harmonies, and mixture of jazz rhythms and classical structure make it one of the most distinctive works in the American piano repertoire. The solo piano version demands that one player conjure an entire orchestral world.',
'The famous opening glissando is just the beginning of the challenges — the piece demands jazz-inflected rhythmic freedom, classical tonal control, and the ability to suggest a full orchestra through the piano alone. The rhythmically complex passages require a secure feel for jazz syncopation. The lyrical sections need a warm, singing tone. Holding together the improvisatory spirit with the structural demands of the whole work is the ultimate challenge.',
5, ARRAY['Glissando', 'Jazz style', 'Syncopation', 'Orchestral suggestion', 'Tonal range', 'Virtuosity']),

('Piano Sonata No. 14 in C sharp minor — complete (Op. 27, No. 2)', 'Ludwig van Beethoven', 1801,
'The complete Moonlight Sonata — all three movements — presents a journey from the nocturnal stillness of the first movement through the gentle, dance-like grace of the second to the volcanic fury of the third. Performing all three movements in sequence requires the ability to sustain three completely different worlds of sound, touch, and character while maintaining the underlying dramatic logic of the whole.',
'Performing the complete sonata adds the challenge of structural pacing — knowing how much to hold back in the first movement so that the second feels like a natural release, and then how to unleash the third''s fury convincingly. The third movement''s demands (fast arpeggios, octaves, stamina) placed after the concentration required by the first make this a test of physical and mental endurance as much as technique.',
5, ARRAY['Complete sonata', 'Structural pacing', 'Character range', 'Stamina', 'Physical demand', 'Musical architecture']),

('Mephisto Waltz No. 1', 'Franz Liszt', 1862,
'Based on a scene from Lenau''s Faust in which Mephistopheles seizes a fiddle and plays a wild, diabolical dance, the first Mephisto Waltz is Liszt at his most theatrically extreme. The piece is saturated with devilish energy — rapid repeated notes, massive chords, ferocious octaves, and passages of sudden, eerie stillness that make the return of the frenzy even more shocking.',
'The Mephisto Waltz makes extreme demands in virtually every area of piano technique simultaneously. The rapid repeated notes require a highly developed wrist mechanism; the octave passages demand power and stamina; the leaps across the keyboard require spatial accuracy at high speed. The theatrical character demands a performer who can project a genuinely demonic energy beyond the merely technical.',
5, ARRAY['Repeated notes', 'Octave technique', 'Physical power', 'Wide leaps', 'Theatrical character', 'Virtuosity']),

('Goldberg Variations (BWV 988) — selected variations', 'J.S. Bach', 1741,
'Bach''s Goldberg Variations — 30 variations on a ground bass, framed by an opening and closing Aria — represent one of the supreme achievements of Western music. The variations range from lyrical two-part inventions to demanding two-keyboard toccatas (here requiring hand crossings on one keyboard), from chromatic fantasias to simple canons. Playing a substantial selection, or the complete work, is a project of a lifetime.',
'The crossing-hands variations — written for two manuals on harpsichord — require the pianist to cross one hand repeatedly over the other at speed, demanding spatial accuracy and relaxed coordination under pressure. The canons require perfect voice independence. The entire work, at the right tempo, lasts around 70–80 minutes, making it one of the greatest tests of sustained concentration and interpretive depth in the repertoire.',
5, ARRAY['Hand crossings', 'Counterpoint', 'Variation form', 'Sustained concentration', 'Stylistic breadth', 'Voice independence']),

('Scherzo No. 2 in B flat minor (Op. 31)', 'Frédéric Chopin', 1837,
'The most famous of Chopin''s four scherzos, Op. 31 opens with a startling, questioning gesture — two hushed chords that seem to ask a question — before launching into a turbulent, mercurial main section. A warmly lyrical middle section in D flat major provides contrast before the stormy opening material returns. The piece combines Chopin''s most powerful and most tender voices.',
'The piece demands both physical power and extreme delicacy — sometimes within the same phrase. The opening questioning gesture must be perfectly controlled and genuinely mysterious. The turbulent passages require fast, reliable octaves and rapid hand-position changes. The lyrical section must be genuinely singing and warm. Holding together these extremes convincingly is the defining interpretive challenge.',
5, ARRAY['Dynamic extremes', 'Octave technique', 'Singing tone', 'Character contrast', 'Physical power', 'Structural control']),

('Sonata in D minor (K. 141)', 'Domenico Scarlatti', 1749,
'This spectacular Scarlatti sonata is a study in rapid repeated notes — the right hand sustains a continuous stream of single-note repetitions at high speed while the left provides harmonic support. It was likely written to demonstrate a specific technique on the harpsichord, but on the modern piano it requires a completely different and sophisticated approach to the wrist and arm.',
'The repeated-note technique required here is one of the most specialised in the repertoire — using a rapid wrist rotation to sustain the notes rather than individual finger strokes. This technique must be specifically developed through careful, slow practice. Playing this with individual finger strokes will result in fatigue and unevenness. Once the technique is established, the piece becomes a thrilling display of skill.',
5, ARRAY['Repeated notes', 'Wrist rotation', 'Specialised technique', 'Speed', 'Scarlatti style']),

('Étude in C minor (Op. 10, No. 12, Revolutionary)', 'Frédéric Chopin', 1833,
'Chopin is said to have written this étude in despair on hearing of the fall of Warsaw to Russian forces in 1831, though this story is disputed. Regardless of its origin, the étude is one of his most passionate — the left hand storms through continuous rapid scale passages while the right plays a sequence of powerful, defiant chords. It is a piece of tremendous emotional force and technical demand.',
'The left hand''s continuous fast scales are the technical core — they must be absolutely even and reliable under the pressure of the forte dynamic and the right hand''s chordal writing. The right hand''s chords must sound powerful and defiant, not merely loud. Coordinating a forceful, complex right hand against a fast, even left hand simultaneously is an advanced coordination challenge.',
5, ARRAY['Left hand scale passages', 'Chordal right hand', 'Coordination', 'Physical power', 'Stamina', 'Technical demand']);
