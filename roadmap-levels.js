/* Practice Roadmap level content (Phase 1: in code; Phase 2 moves to an
   admin-editable DB table). Source of truth mirrors practice-roadmap-content.md.
   Hours are cumulative thresholds to ENTER each stage. tier = pieces-library
   difficulty (0 Absolute Beginner .. 5 Expert) for "browse these pieces" links;
   null where a track has no library mapping. */
(function () {
  const STAGES = ["First Steps", "Beginner", "Foundations", "Intermediate", "Confident", "Advanced", "Performer", "Artist"];
  const TIER_LABELS = ["Absolute Beginner", "Beginner", "Lower Intermediate", "Upper Intermediate", "Advanced", "Expert"];

  // Per-track: hours[], grade[] (total/repertoire only), tier[], canDo[], focus[]
  const T = {
    total: {
      hours: [0, 50, 150, 350, 700, 1200, 2000, 3500],
      grade: ["Before Grade 1", "Around Grade 1 to 2", "Around Grade 3 to 4", "Around Grade 5", "Around Grade 6 to 7", "Around Grade 8 standard", "Around ARSM to LRSM diploma", "Around LRSM to FRSM"],
      tier:  [0, 1, 1, 2, 3, 4, 4, 5],
      canDo: [
        "At this stage you are getting comfortable at the instrument for the first time. You will begin to be able to find your way around the keys, name the white notes without searching, and play simple pieces. You might be sight reading hands separately, but you are also beginning to use both hands together on very easy material, keeping a slow, steady beat, and you can read basic notes around middle C and will start to get comfortable expanding your note recognition. You are also starting to hear when something sounds right or wrong, even if you cannot yet say why, and short familiar tunes are within reach. In the library, the pieces you will be comfortable learning are those rated Absolute Beginner.",
        "Simple pieces with both hands are coming together. You keep a steady pulse, read fluently in the most common keys (although this might be trickier at times), and coordinate your hands in straightforward textures such as a melody over a simple accompaniment. You might be able to begin playing music you recognise, and you are beginning to understand a little of what you are playing, hearing the difference between major and minor chords and noticing where a phrase rises and falls. You can usually tell which hand or which bar is causing a problem. In the library, you will be comfortable learning Beginner rated pieces.",
        "Your hands are becoming genuinely controlled, so the two parts work together with growing ease. You are comfortable in more keys, you handle dynamics and articulation such as legato and staccato, and you can play pieces with real character across a wider range of moods. You are starting to understand how a piece is put together, recognising its key and some of its chords, and you are noticing that the same kinds of difficulties, such as awkward fingerings or hand crossings, come up again and again. In the library, you are comfortable with Beginner pieces and starting to reach into Lower Intermediate.",
        "You are a genuine intermediate player who is starting to understand the music, not just read it. You can shape a phrase with intention, manage trickier rhythms and fuller textures, and follow the structure of a piece, recognising its key, its chords, and where the music builds tension and resolves it. Because you now understand a fair amount of theory, around Grade 5 standard, you can begin to see why a piece works the way it does, and you are building a personal toolkit of fixes for the recurring problems you meet. In the library, Lower Intermediate pieces are comfortable to learn.",
        "You play with real expression and control, and harder repertoire is genuinely within reach. Your technique supports your musical ideas rather than holding them back, so you can manage faster passages, larger leaps and more complex textures. You understand the music well enough to interpret with a clear sense of style and shape, and you recognise familiar patterns and problems quickly, so you waste far less time working out how to practise something. In the library, you can expect to be comfortable with Upper Intermediate pieces.",
        "You are heading towards Grade 8 standard, and you have the maturity to interpret rather than simply play, because you genuinely understand the music in front of you. You can analyse a score, hear its harmony and structure, and grasp enough of the composer's intentions to form your own informed view of how a piece should sound. Your technique is fluent to the extent that you know how to deal with any technical challenges, and your experience means you diagnose and solve most problems almost as soon as they appear. In the library, Advanced rated pieces are within comfortable reach.",
        "You are in performer territory. You can prepare and deliver a polished programme or set, sustaining technical control and musical focus across a full run of demanding works. This is the level of an entry performance diploma such as ARSM, with the next tier in view. You understand the music deeply enough to bring a developing personal voice to it, and your problem solving is fast and reliable, so you can learn advanced repertoire to a high standard within a good timeframe. In the library, you can take on Advanced pieces and begin reaching into Expert.",
        "You have a wealth of music knowledge accessible in your hands. This is where you are heading towards advanced diploma artistry, where the instrument serves whatever you want to say. You command a deep and wide repertoire, your technique is essentially transparent, and your understanding of music lets you interpret, communicate and, if you wish, teach and create at a high level. Problems are rare and quickly solved, because experience has given you the patterns and the answers. In the library, Expert rated pieces are within your reach."
      ],
      focus: [
        "The priority at this stage is consistency and comfort, not difficulty. Aim to play most days, even for ten or fifteen minutes, so the movements start to feel natural. A habit is formed by repeatedly doing something for 90+ days, and this is the main focus at this stage. Concentrate on staying relaxed with a loose wrist, and on keeping a steady pulse rather than rushing. When something goes wrong, get into the habit of stopping, finding the exact note or beat that tripped you, and trying that small part again slowly. The daily habit and that simple stop-and-fix instinct matter far more now than anything hard.",
        "Build a reliable reading foundation so you are not memorising everything by ear. When a passage trips you, identify exactly where it goes wrong, practise that hand or that bar on its own slowly, then put it back together only once it is secure. This habit of isolating the problem is one of the most valuable things you can learn now. Focus on the structure of your practice, including some scales, sight reading and maybe some improvisation and ear training if it interests you. Try to regularly count out loud to keep time, and start shaping phrases with simple louder and softer contrasts so your playing already carries a little meaning.",
        "Consolidate technique with regular scales and arpeggios across more keys, as this underpins almost everything ahead. Practise in small sections rather than always from the top, and when a spot keeps failing, slow down and work out why, because more often than not the fix is better fingering, or more isolated and slow practice. Start connecting what you see on the page to what you hear, so dynamics and phrasing become choices rather than accidents. Targeted music theory will make a big impact on your playing now, and keep choosing pieces you love so the work stays enjoyable.",
        "This is where comprehension becomes the engine of your playing. As you learn a piece, ask what is happening in the music: what key you are in, what the chords are doing, where each phrase is heading and where its high point falls, then use those answers to decide on your dynamics, phrasing and voicing. When something will not come together, diagnose the real cause, whether it is coordination, fingering, rhythm or tension, and choose the practice method that targets it. Keep isolating hard passages with slow, metronome led practice, and make theory, sight reading and aural work regular habits, because they let you understand more of the music more quickly.",
        "Refine the details that separate competent from convincing playing: tone, dynamic range, careful pedalling, and the subtle timing that makes phrasing feel natural. Let your understanding of harmony and structure guide these choices, so your interpretation is informed rather than instinctive. Lean on the practice strategies you have built for recurring difficulties, and keep adding to that toolkit. Practise performing, not just learning, by playing for others and recording yourself to hear what an audience hears, then use what you notice to decide what to fix next.",
        "Let interpretation grow out of understanding. Study scores closely, trace the harmony, map the structure, and find the moments that carry the meaning, then make deliberate choices about phrasing, balance, pedalling and rubato that serve what you have understood. Refine your technique so the hardest passages are secure under pressure, build stamina for full programmes, and keep sharpening your self-diagnosis so practice stays efficient. Test your interpretations by performing and recording, and aim for playing that says something because you know what the music is saying.",
        "The priorities are programme building, performance craft and consistency. Assemble balanced programmes and rehearse them as wholes, work on stage presence and managing nerves, and learn to recover seamlessly when something slips. Deepen your stylistic understanding so whatever you play, whether that is Bach, a jazz standard or a film score, sounds idiomatic, letting style and genre inform your decisions. Keep raising your technical ceiling so the music is never limited by mechanics, and use your well honed practice strategies to prepare efficiently. Regular performing and feedback from advanced teachers or peers are what move you forward here.",
        "Progress here is self directed and driven by artistry rather than levels. Pursue the repertoire and projects that genuinely move you, refine your interpretive voice, and keep your technique, understanding and musicianship in peak condition through ongoing focused work. Many players at this stage give back by teaching, accompanying, composing, arranging or performing. There is no real ceiling from here, so the focus is simply continuing to grow into the musician you want to be."
      ]
    },
    repertoire: {
      hours: [0, 25, 70, 160, 320, 550, 900, 1600],
      tier:  [0, 1, 1, 2, 3, 4, 4, 5],
      canDo: [
        "You are working on your first complete little pieces, simple melodies with one hand and very easy two hand material at a gentle tempo. You are learning what it feels like to take a short piece from unfamiliar to playable, and to hear when a note is wrong. In the library, the pieces you will be comfortable learning are those rated Absolute Beginner.",
        "You have a small repertoire of easy pieces you can play through and enjoy, with both hands in simple textures. You are starting to notice the shape of a melody and where a piece feels like it is going. In the library, you can expect to be comfortable learning pieces rated Beginner.",
        "You can play early intermediate pieces with more notes, more keys and real musical character. You can recognise the key of a piece and some of its chords, and you are beginning to see why a passage is built the way it is. In the library, you are comfortable with Beginner pieces and starting to reach into Lower Intermediate.",
        "You can play solid intermediate repertoire such as easier sonatinas, popular classics and pieces with fuller textures. You understand enough about how a piece is constructed to make real interpretive decisions, and you recognise the recurring difficulties that come up across different pieces. In the library, Lower Intermediate pieces are now comfortable to learn.",
        "You can carry substantial pieces with expression, contrast and a clear sense of style, holding a longer work together from beginning to end. You understand the music well enough that your interpretations feel intentional, and you solve familiar problems quickly because you have met them before. In the library, you can expect to be comfortable learning Upper Intermediate pieces.",
        "You can take on demanding repertoire at roughly Grade 8 standard across classical, jazz or contemporary styles. You can analyse a piece, understand the composer's intentions, and form your own informed interpretation, and your experience lets you solve most problems almost as they appear. In the library, Advanced rated pieces are within comfortable reach.",
        "You can prepare full performance programmes and perform them end to end, sustaining technical and musical focus across a complete run. You bring a developing personal voice to advanced repertoire, informed by deep understanding of the music. In the library, you can take on Advanced pieces and begin reaching into Expert.",
        "You command a deep and wide repertoire and can take on almost anything you set your mind to, making it your own. Your understanding of music and your transparent technique let the pieces speak through you. In the library, even Expert rated pieces are within your reach."
      ],
      focus: [
        "Choose very easy pieces you enjoy and scan the music beforehand. Then try to play it through, even slowly. When you hit a wrong note or a stumble, stop, find the exact spot, and repeat just that bar until it is comfortable. Getting used to finishing a piece, and fixing the small things along the way, is the whole job at this stage.",
        "Build a habit of learning a handful of pieces over several weeks and noticing how what was difficult becomes easier. Focus on identifying any bars that are causing trouble and isolating them. Begin focussing more on dynamics and expression so each piece carries a little meaning rather than being just the right notes in time.",
        "Learn pieces a little faster by spotting their patterns, the repeated phrases, sequences and familiar chord shapes, so you are not reading every note as if it were new. Bring out the melody over the accompaniment, add dynamics and articulation as deliberate choices, and write in fingering wherever a spot keeps tripping you.",
        "As you learn a piece, work out its structure and harmony, then decide how you want it to sound and shape your dynamics, phrasing and voicing to match. Practise difficult passages by diagnosing the actual cause and applying the right method, slow practice, separate hands if the problem is specific to one hand, rhythm variations, rather than just playing them again. Start memorising sections where it helps and is not a detriment to your reading ability, and building stamina by playing longer pieces from start to finish.",
        "Choose repertoire that stretches you in specific ways, and use your understanding of harmony, structure and style to shape genuinely musical performances. Refine tone, balance and pedalling, and keep a mental practice toolkit ready for the recurring technical and musical challenges you encounter. Perform your pieces for others and record them, then let what you hear decide what you polish next.",
        "Build a varied repertoire across periods and styles, and let close study of each score drive your interpretive decisions about phrasing, colour and rubato. Secure the hardest passages so they hold up under pressure, and keep your self-diagnosis sharp so learning stays efficient. Aim for performances that communicate a clear musical idea, not just accurate notes.",
        "Assemble and rehearse balanced programmes as wholes, work on the craft of performing them convincingly, and ensure each style sounds idiomatic. Keep raising your technical ceiling and use efficient, well honed practice strategies to learn demanding works to a high standard within sensible timeframes.",
        "Follow the repertoire that genuinely moves you, refine your interpretive voice, and keep your playing in peak condition. Consider sharing your repertoire through performing, accompanying or teaching. From here the journey is yours to direct."
      ]
    },
    technique: {
      hours: [0, 15, 40, 90, 175, 300, 500, 875],
      tier:  [null, null, null, null, null, null, null, null],
      canDo: [
        "You can play five finger patterns and simple scales and are building familiarity with the keys. Your hands are learning to move evenly and stay relaxed. You are starting to feel the difference between a tense hand and a free one.",
        "You can play major scales and basic arpeggios in common keys, hands separately and together. You can tell when your playing is uneven or rushed and are working on improving your quality of sound.",
        "You can play scales and arpeggios in more keys with steadier evenness and control, and your hands are becoming more easily controlled. You are noticing the same technical problems, such as uneven fingers or awkward turns, recurring across different exercises.",
        "You can play scales and arpeggios across most keys at a comfortable tempo with cleaner coordination. You understand how a scale or chord shape relates to the keys and pieces you are working on, and you have reliable ways to fix common technical problems.",
        "You can play in all keys, faster and more even, with technique that genuinely supports musical phrasing. You recognise technical challenges quickly and know which practice method will solve them.",
        "You have fluent technique with the speed, stamina and hand independence to handle demanding passages. You understand the technical demands of advanced repertoire and diagnose and solve problems almost as they appear.",
        "You have reliable, near virtuoso control that holds up under performance pressure. Your technique is at the service of your musical understanding, and you solve technical problems efficiently and almost automatically.",
        "Your technique is essentially transparent, entirely at the service of the music. Whatever you understand and want to express, your hands can deliver."
      ],
      focus: [
        "Keep technique gentle and regular. Focus on a relaxed hand and an even sound, and notice when tension creeps in so you can release it. A few minutes of careful five finger work and simple scales each day builds the foundation everything else rests on.",
        "Build evenness and a steady pulse with a metronome. When a scale is bumpy, find the exact finger crossing that causes it and work on just that movement. Understanding that smoothness comes from the thumb passing under cleanly will fix most early scale problems.",
        "Widen your key coverage and keep the sound even and relaxed at a comfortable tempo. Diagnose recurring weaknesses, perhaps a weaker fourth and fifth finger or an uneven left hand, and give them targeted attention, perhaps with dedicated exercises. Connect technique to the music you are playing, so the skills you drill show up in your pieces.",
        "Push tempo gradually while keeping evenness and a relaxed hand, using rhythms and accents to iron out unevenness. Connect your technical work to comprehension, knowing why a passage uses a particular scale or arpeggio helps you learn it faster. Keep building the practice methods that solve recurring issues so they become second nature.",
        "Add more demanding work such as double notes, octaves and trickier coordination, always prioritising a free, relaxed hand. Use your understanding of the music to decide how technique should serve it, for example shaping a fast passage rather than just playing it cleanly. Keep refining the patterns and fixes you rely on so practice stays efficient.",
        "Maintain and extend your technique so the hardest writing is secure under pressure, and target the specific demands of the pieces you are learning. Let musical intention guide technical work, so control, tone and evenness all serve interpretation. Keep your self-diagnosis sharp so technical obstacles rarely slow you down.",
        "Keep your technique in peak condition with focused maintenance, and prepare the specific challenges of performance repertoire well ahead of time. Ensure your technical choices support idiomatic, stylish playing, and rely on your refined practice strategies to stay efficient.",
        "Maintain your technique through ongoing focused work, and direct it toward the music and projects that matter to you. At this level technique is a tool you command rather than a goal you chase."
      ]
    },
    sight_reading: {
      hours: [0, 5, 15, 35, 70, 120, 200, 350],
      tier:  [null, null, null, null, null, null, null, null],
      canDo: [
        "You can name notes and find them on the keys without hunting, and you are starting to connect the dots on the stave to the right keys.",
        "You can read very simple one hand lines at a slow, steady pace, recognising basic note and rhythm patterns. You can tell when you have misread something.",
        "You can read simple two hand pieces hands together with early fluency, and you understand basic key signatures and time signatures well enough to expect what is coming.",
        "You can confidently sight read easy pieces first time through, recognising chords and common progressions as you go. You notice the kinds of passages that tend to trip you.",
        "You can read intermediate music fluently, keeping going and grasping the shape of the music as you play. You understand enough to anticipate harmony and phrasing while reading.",
        "You can sight read fairly difficult repertoire at tempo, taking in harmony, texture and phrasing at a glance. You quickly recognise and handle the patterns that used to slow you down.",
        "You can read advanced scores quickly and musically, grasping the music almost as fast as you see it. Reading is now a practical, reliable skill you can use in performance and collaboration.",
        "You can read almost anything at sight, accompanying and collaborating with ease, taking in and shaping unfamiliar music in real time."
      ],
      focus: [
        "Practise naming and finding notes quickly and regularly. Read very simple lines slowly, keeping your eyes on the page rather than your hands, and do not worry about speed yet.",
        "Read a little new, easy music most days, always keeping a steady beat and resisting the urge to stop and correct. Start to recognise common patterns such as steps, skips and simple rhythms, since spotting patterns is what makes reading faster.",
        "Keep going without stopping, even over small mistakes, as fluency matters more than perfection when reading. Seeing larger patterns will enable you to look ahead of where you are playing, scan a new piece first for its key, time signature and obvious patterns, and use that understanding to read more confidently.",
        "Read regularly at a level slightly below your playing standard, always keeping the pulse. Use your growing theory to read in chunks, seeing a chord or a scale shape rather than individual notes, and identify your recurring reading weaknesses, perhaps rhythm or ledger lines, so you can target them.",
        "Stretch to slightly harder material and keep reading new pieces often. Train your eyes to look further ahead for structurally important features, and lean on your understanding of harmony and structure to predict what comes next, which is the real engine of fluent reading.",
        "Read a wide range of styles and textures, including accompaniments and ensemble parts. Keep prioritising flow and musical sense over note perfect accuracy, and use your deep familiarity with patterns to read larger groups at once.",
        "Read demanding repertoire and accompaniments regularly to keep the skill sharp, and practise reading under realistic conditions such as accompanying or playing with others.",
        "Use and maintain the skill through regular reading, accompanying and collaboration, keeping it fluent across every style you meet."
      ]
    },
    musicianship: {
      hours: [0, 10, 30, 70, 140, 240, 400, 700],
      tier:  [null, null, null, null, null, null, null, null],
      canDo: [
        "You know the musical alphabet, basic note values and where sounds live on the keys. You can hear when a tune goes up or down and tell two very different sounds apart.",
        "You can read rhythm and pitch confidently, understand simple time signatures, and recognise a few intervals and the difference between major and minor by ear.",
        "You understand keys, scales and basic chords, you can hear major versus minor reliably, and you recognise simple chord progressions. You can pick out a simple tune by ear with some effort.",
        "You understand theory to around Grade 5 standard, recognise common chords and progressions, and are able to use this to improvise simple ideas. You can use this understanding to make real musical decisions in your playing.",
        "You understand harmony and can analyse the music you play, you have a reliable ear for intervals and chords, and you are comfortable improvising over basic changes. You hear and understand patterns that recur across many pieces.",
        "You have advanced theory and aural skills, you can analyse complex music, and you improvise and harmonise with real freedom. Your understanding lets you grasp a composer's intentions and form your own interpretation.",
        "You have a deep musical understanding that lets you analyse, arrange and improvise fluently, and an ear that supports high level performance and collaboration.",
        "You have a complete musician's ear and mind, which you apply to anything you play or create. Understanding, listening and creativity work together as one."
      ],
      focus: [
        "Learn the basics of how music is written and counted, and start really listening as you play, noticing pitch direction and simple rhythm. Connecting what you hear to what you see is the foundation of everything that follows.",
        "Build the link between sound and symbol, clapping rhythms and singing or humming simple intervals. Notice the major or minor feel of the pieces you play, and start to connect the theory you learn to the music under your hands rather than treating it as separate.",
        "Learn how scales and chords are built and how they appear in your repertoire, so theory becomes a way of understanding what you play. Practise recognising common intervals and chords by ear, and try working out simple melodies, since this trains both your ear and your understanding together.",
        "Apply theory directly to interpretation, using your knowledge of key, harmony and structure to decide how a piece should be shaped. Strengthen your ear with regular interval and chord recognition, and begin improvising over simple chord progressions to connect theory, ear and creativity.",
        "Deepen your harmonic understanding so analysis routinely informs your interpretive choices. Keep training your ear toward quicker, more accurate recognition, and develop your improvisation so you can express simple ideas freely. Look for the recurring harmonic and structural patterns that make new pieces faster to understand.",
        "Use detailed analysis to drive your performances, and keep your ear sharp enough to hear structure and harmony as you listen and play. Extend your improvisation and harmonisation, and apply your understanding to solve musical problems and make confident interpretive decisions.",
        "Bring your full musicianship to bear on performance, letting analysis, ear and stylistic knowledge shape every decision. Keep developing your creative skills through improvisation, arranging or composing as suits your goals.",
        "Direct your musicianship toward the music and projects that matter to you, and keep it sharp through ongoing listening, analysis and creative work. At this level your understanding is a lifelong instrument in its own right."
      ]
    }
  };

  // ── Per-stage objectives ("by the end of this level, you can…") ──────────────
  // PLACEHOLDER CONTENT (2026-06-30) — see practice-roadmap-objectives.md. Drives the
  // dashboard "Your Path" card. Each goal: { icon, label, type, ...params }.
  //  type 'days'  → distinct practice days >= target
  //  type 'note'|'chord'|'ear' → best game score >= target
  //  type 'piece' → completed pieces at difficulty tier >= count
  //  type 'theory'→ theory course level: mode 'begin' (>=1 lesson) or 'complete' (all)
  //  type 'self'  → member self-checks it (persisted; placeholder localStorage for now)
  const GOALS = [
    [ // 1 First Steps
      { icon: "days",   group: "days",   label: "Reach your first 50 days of practice", type: "days", target: 50 },
      { icon: "scales", group: "scales", label: "C and G major scales, hands together, two octaves", type: "self", key: "s1-scales" },
      { icon: "note",   group: "note",   label: "Score 10 in Note Recognition in both C and G major", type: "note", target: 10, match: { keys: ["C", "G"] } },
      { icon: "theory", group: "theory", label: "Begin Theory Level 1", type: "theory", level: 1, mode: "begin" },
      { icon: "sightread", group: "sightread", label: "Sight-read very simple single lines, read once: 500 minutes (10 minutes a day for 50 days)", type: "hours", category: "sightreading", targetMin: 500 },
      { icon: "piece",  group: "piece",  label: "Learn your first Absolute Beginner piece", type: "piece", tier: 0, count: 1 }
    ],
    [ // 2 Beginner
      { icon: "days",   group: "days",   label: "Practice on another 100 days this level", type: "days", target: 100 },
      { icon: "scales", group: "scales", label: "C, G, D and F major scales, hands together, two octaves", type: "self", key: "s2-scales" },
      { icon: "scales", group: "arps",   label: "C, G, D and F major arpeggios", type: "self", key: "s2-arps" },
      { icon: "note",   group: "note",   label: "Score 18 in Note Recognition in each of C, G, D and F major", type: "note", target: 18, match: { keys: ["C", "G", "D", "F"] } },
      { icon: "chord",  group: "chord",  label: "Score 10 in Chord Recognition in each of C, G, D and F (triads in the key)", type: "chord", target: 10, match: { keys: ["C", "G", "D", "F"], tier: 1 } },
      { icon: "ear",    group: "ear",    label: "Score 12 in the Ear Training tool in each of C, G, D and F (major versus minor)", type: "ear", target: 12, match: { keys: ["C", "G", "D", "F"], set: "major_minor" } },
      { icon: "improv", group: "improv", label: "Spend 3 hours improvising, starting with simple triads and a melody", type: "hours", category: "improvisation", target: 3 },
      { icon: "theory", group: "theory", label: "Complete Theory Level 1", type: "theory", level: 1, mode: "complete" },
      { icon: "sightread", group: "sightread", label: "Sight-read easy hands-together pieces, read once: 1,000 minutes (10 minutes a day for 100 days)", type: "hours", category: "sightreading", targetMin: 1000 },
      { icon: "piece",  group: "piece",  label: "Learn 4 Beginner pieces", type: "piece", tier: 1, count: 4 }
    ],
    [ // 3 Foundations
      { icon: "days",   group: "days",   label: "Practice on another 200 days this level", type: "days", target: 200 },
      { icon: "scales", group: "scales", label: "A, B♭ and E♭ major scales", type: "self", key: "s3-scales" },
      { icon: "scales", group: "arps",   label: "A, B♭ and E♭ major arpeggios", type: "self", key: "s3-arps" },
      { icon: "scales", group: "minors", label: "Natural, harmonic and melodic minor scales in A, E and D", type: "self", key: "s3-minors" },
      { icon: "note",   group: "note",   label: "Score 18 in Note Recognition in each of A, B♭ and E♭ major", type: "note", target: 18, match: { keys: ["A", "Bb", "Eb"] } },
      { icon: "chord",  group: "chord",  label: "Score 10 in Chord Recognition (triads in any key, with no key to lean on)", type: "chord", target: 10, match: { tier: 1, mode: "free" } },
      { icon: "ear",    group: "ear",    label: "Score 16 in the Ear Training tool (triads: major, minor, diminished, augmented)", type: "ear", target: 16, match: { set: "triads" } },
      { icon: "theory", group: "theory", label: "Complete Theory Level 2", type: "theory", level: 2, mode: "complete" },
      { icon: "piece",  group: "piece",  label: "Learn 1 to 2 Lower Intermediate pieces", type: "piece", tier: 2, count: 2 },
      { icon: "sightread", group: "sightread", label: "Sight-read Beginner-level pieces, read once: 2,000 minutes (10 minutes a day for 200 days)", type: "hours", category: "sightreading", targetMin: 2000 }
    ],
    [ // 4 Intermediate
      { icon: "scales", group: "scales", label: "All major scales secure, hands together, two octaves", type: "self", key: "s4-scales" },
      { icon: "scales", group: "arps",   label: "All major arpeggios secure", type: "self", key: "s4-arps" },
      { icon: "scales", group: "minors", label: "Natural, harmonic and melodic minor scales in B, G and C", type: "self", key: "s4-minors" },
      { icon: "note",   group: "note",   label: "Score 34 in Note Recognition (mixed clef, sharps and flats)", type: "note", target: 34, match: { clef: "mixed", acc: true } },
      { icon: "chord",  group: "chord",  label: "Score 9 in Chord Recognition (triads and inversions, any key)", type: "chord", target: 9, match: { tier: 2, mode: "free" } },
      { icon: "ear",    group: "ear",    label: "Score 12 in the Ear Training tool (sevenths)", type: "ear", target: 12, match: { set: "sevenths" } },
      { icon: "improv", group: "improv", label: "Spend another 5 hours improvising over simple chord progressions", type: "hours", category: "improvisation", target: 5 },
      { icon: "sightread", group: "sightread", label: "Sight-read Lower Intermediate pieces, read once: 3,500 minutes (10 minutes a day for 350 days)", type: "hours", category: "sightreading", targetMin: 3500 },
      { icon: "piece",  group: "piece",  label: "Learn 2 to 3 Lower Intermediate pieces", type: "piece", tier: 2, count: 3 }
    ],
    [ // 5 Confident
      { icon: "scales", group: "scales", label: "All major and minor scales, in every key, faster and musical", type: "self", key: "s5-scales" },
      { icon: "scales", group: "arps",   label: "All major and minor arpeggios, in every key", type: "self", key: "s5-arps" },
      { icon: "note",   group: "note",   label: "Hold Note Recognition near the top: score 40 (mixed clef, sharps and flats)", type: "note", target: 40, match: { clef: "mixed", acc: true } },
      { icon: "ear",    group: "ear",    label: "Hold the Ear Training tool steady: score 14 (sevenths)", type: "ear", target: 14, match: { set: "sevenths" } },
      { icon: "chord",  group: "chord",  label: "Hold Chord Recognition steady: score 7 (sevenths, any key)", type: "chord", target: 7, match: { tier: 3, mode: "free" } },
      { icon: "sightread", group: "sightread", label: "Sight-read Upper Intermediate pieces, read once: 5,000 minutes (10 minutes a day for 500 days)", type: "hours", category: "sightreading", targetMin: 5000 },
      { icon: "piece",  group: "piece",  label: "Learn 1 Upper Intermediate piece", type: "piece", tier: 3, count: 1 }
    ],
    [ // 6 Advanced
      { icon: "scales", group: "scales", label: "All scales fluent in every key", type: "self", key: "s6-scales" },
      { icon: "scales", group: "arps",   label: "All arpeggios fluent in every key", type: "self", key: "s6-arps" },
      { icon: "sightread", group: "sightread", label: "Sight-read Advanced pieces, read once: 8,000 minutes (10 minutes a day for 800 days)", type: "hours", category: "sightreading", targetMin: 8000 },
      { icon: "piece",  group: "piece",  label: "Learn 1 Advanced piece", type: "piece", tier: 4, count: 1 }
    ],
    [ // 7 Performer
      { icon: "sightread", group: "sightread", label: "Sight-read advanced pieces across styles, read once: 15,000 minutes (10 minutes a day for 1,500 days)", type: "hours", category: "sightreading", targetMin: 15000 },
      { icon: "perform", group: "perform", label: "Prepare and perform a balanced Advanced programme", type: "self", key: "s7-prog" },
      { icon: "piece",   group: "piece",   label: "Add an Expert piece into your learning", type: "piece", tier: 5, count: 1, mode: "added" }
    ],
    [ // 8 Artist
      { icon: "sightread", group: "sightread", label: "Keep sight-reading any style, 10 minutes a day, including accompaniments", type: "self", key: "s8-sr" },
      { icon: "expert", group: "piece", label: "Learn an Expert work and make it your own", type: "self", key: "s8-expert" }
    ]
  ];

  // Matt's picks — an ORDERED hierarchy of recommended pieces per level (by
  // pieces.id). The card shows the first 3 the member hasn't added to their
  // collection yet; as they add one, the next in line surfaces. 6 per level so
  // there's always a fresh one to reveal. Owner: reorder / swap IDs freely.
  // (Draft set — matched to each level's difficulty tier, easiest/most motivating first.)
  const PICKS = [
    [134, 132, 5, 11, 7, 135],    // 1 First Steps   (2 absolute-beginner books + Petzold show first)
    [7, 12, 86, 94, 67, 3, 32],   // 2 Beginner      (Clementi first; crosses over into tier 2/3 aspirational picks)
    [3, 2, 17, 46, 10, 27],       // 3 Foundations   (River Flows in You demoted to last)
    [32, 43, 13, 19, 18, 21, 20, 17], // 4 Intermediate (Chopin Prelude in Em leads; Handel before Schubert; +Gnossienne)
    [4, 16, 31, 23, 25, 34],      // 5 Confident     (Moonlight 1st mvt leads — a crowd-pleaser)
    [1, 51, 106, 54, 52, 234],        // 6 Advanced   (bridge pieces; +Nightingale, Rach Prelude up to Performer)
    [47, 73, 69, 55, 75, 62, 57],     // 7 Performer  (Pathetique mvt 1 opener; +Rach Prelude, +Brahms Rhapsody in Bm; Winter Wind & Op.10/1 up to Artist)
    [122, 124, 79, 81, 125, 123, 235, 70] // 8 Artist (the monsters; +Winter Wind, +Op.10/1)
  ];

  // Track metadata: which logged item types feed each track.
  const TRACKS = [
    { key: "total",         label: "Total Practice", itemTypes: null /* everything */ },
    { key: "repertoire",    label: "Repertoire",     itemTypes: ["piece", "book"] },
    { key: "technique",     label: "Technique",      itemTypes: ["technique"] },
    { key: "sight_reading", label: "Sight-reading",  itemTypes: ["sightreading"] },
    { key: "musicianship",  label: "Musicianship",   itemTypes: ["theory", "eartraining", "improvisation"] }
  ];

  // Build the level objects.
  const levels = {};
  for (const key of Object.keys(T)) {
    const t = T[key];
    levels[key] = t.hours.map((h, i) => ({
      level: i + 1,
      name: STAGES[i],
      hours: h,
      grade: t.grade ? t.grade[i] : null,
      tier: t.tier[i],
      tierLabel: (t.tier[i] != null) ? TIER_LABELS[t.tier[i]] : null,
      canDo: t.canDo[i],
      focus: t.focus[i],
      goals: (key === "total") ? GOALS[i] : null
    }));
  }

  window.ROADMAP = {
    stages: STAGES,
    tierLabels: TIER_LABELS,
    tracks: TRACKS,
    levels: levels,
    picks: PICKS,
    note: "A guide, not a finish line. Everyone's journey is different, and hours are only part of the story."
  };
})();
