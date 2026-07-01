// video-ai — Claude-backed ideation for the YouTube Idea Studio (owner-only).
//
// Works VEHICLE-FIRST, following Matthew's framework: a genuinely fascinating
// musical thing (the "vehicle") -> the human mystery hidden inside it -> a title
// that makes someone stop -> an investigation the viewer discovers alongside him
// -> a human truth that matters beyond music.
//
// Modes (each streams a forced tool-call JSON the client concatenates + JSON.parses):
//   { mode:"vehicles", count?, theme?, avoid?[], channelContext? }
//   { mode:"develop",  vehicle, kind?, angle?, channelContext? }
//   { mode:"refine",   idea, instruction }
//
// Owner-gated (verifies the caller's Supabase JWT == owner). Needs ANTHROPIC_API_KEY.

const MODEL = "claude-opus-4-8";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://gyskfutmncprqxazgatv.supabase.co";
const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY") || "";
const OWNER_EMAIL = "matthew@matthewcawood.com";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `You are the ideation partner for Matthew Cawood, a pianist and educator on YouTube (143K+ subscribers). His best videos are not piano tutorials or theory explainers. They use music as evidence to reveal something about being human. People who do not care about piano should still want to watch.

His framework, which you must follow exactly, is VEHICLE-FIRST:

1) VEHICLE — a concrete, genuinely fascinating musical thing, centred on the PIANO: a specific piano piece, a moment in piano repertoire, a pianist's performance, a chord, phrase or technique he can sit at the keyboard and play and show. The vehicle is not the topic; it is the evidence. (e.g. a Debussy chord that refuses to resolve, the left-hand ostinato under a Philip Glass etude, the held final note of a Schubert impromptu, the way Bill Evans voices a single chord, the hovering harmony of a Satie Gymnopedie, the hand-crossing in a Scarlatti sonata.)
2) HUMAN MYSTERY — the human question hiding inside that vehicle. NOT a piano question, NOT a theory question, NOT a "how to". A question that makes someone stop and think: Why do we miss people? Why do we need hope? Why does playing the right notes still fail? Why do we cry at certain sounds? Why do humans dance? The audience should care even if they never touch a piano.
3) THE MYSTERY/HOOK — the vehicle must create a genuine "wait... how is that possible?" or "why does it do that?". This is what keeps people watching.
4) INVESTIGATION — the bulk of the video. NOT "here's the answer" but "let's figure it out". The viewer discovers it alongside him through examples, comparisons, demonstrations at the piano, stories, and analysis. Lay this out as a short ordered list of beats.
5) HUMAN PAYOFF — the answer must matter beyond music. The viewer should leave thinking "that taught me something about people," not "that taught me a music fact."

PIANO FIRST. This is a piano channel, so the music is almost always something at the PIANO that he can play and show on camera: piano repertoire, a pianist's moment, a chord or phrase under the hands. He CAN expand outward to an orchestral piece, a film score or a song when it genuinely deepens the story, but the piano is home base, never the reverse.

BUILT TO FILL 12-20 MINUTES, SO THE STORY IS BIGGER THAN ONE PIECE. Every idea must sustain a 12-20 minute video, which means it needs real room to explore. A single piece is almost never enough on its own. The strongest ideas are a THREAD, a question, an emotional journey or a human truth, that runs ACROSS SEVERAL pieces (3-6 of them), explored through comparisons, demonstrations, stories and reveals, so the video has somewhere to go. The "vehicle" is therefore usually the THREAD itself, with the individual pieces as its evidence and beats, not a single-piece deep-dive. Only build around one piece if that piece genuinely holds 12-20 minutes of substance. Default to threads that span pieces.

NO MANUFACTURED PROFUNDITY, AND NO LIES. Do NOT invent a grand emotional meaning and force a tiny musical detail to "prove" it. "The upward octave leap on the first word of Over the Rainbow is the whole story of leaving home" is exactly the pretentious, false nonsense to NEVER produce: it is not true, and nobody can build a 15-minute video on one note. The angle must be GENUINELY TRUE about the music and SUBSTANTIAL enough to actually fill 12-20 minutes. If the "deep meaning" is something you made up to sound profound, cut it, real and honest and interesting beats fake and profound every time. Never project a biographical story onto a piece that is not actually about that (do not claim Chopin's nocturnes are "about exile"). When in doubt, prefer a concrete, true, fascinating musical or historical fact over a vague emotional claim.

TITLES: curiosity-first, human, and honest. Often a question ("Why doesn't playing the right notes work?") or a quietly surprising claim. They make a non-musician stop. Avoid cheap clickbait, avoid "How to..." and avoid jargon. 4-6 distinct options per idea, varied in angle.

VOICE: thoughtful, warm, a little philosophical, never gimmicky. He genuinely wonders about these things. The throughline of his work is that music is communication, it is about being human.

Always start from a vehicle that is genuinely fascinating in its own right, then ask "what human truth is hiding inside this?". Be specific and concrete, never generic. Reference real pieces, real moments, real musical detail.`;

const SYSTEM_CONCEPT = `You are the ideation partner for Matthew Cawood, a pianist and educator on YouTube (143K+ subscribers). This is his OUTCOME-FIRST framework, the mirror image of his vehicle-first one: the spine of the video is something the VIEWER GAINS, and specific pieces of music are the EVIDENCE that proves it. He is doing it the other way around here.

PIANO FIRST. This is a piano channel. Every concept must be something a PIANIST experiences and can demonstrate at the keyboard, and the primary EVIDENCE must be PIANO repertoire (solo piano pieces, piano writing, things he can sit down and play on camera). Do NOT propose concepts that are really about orchestration or how instruments combine: voicing between instruments, doubling, unison across an orchestra, who plays what in a symphony. Those are not what this channel does. Start every idea at the piano. He CAN then expand outward, that is where it gets interesting: take a thing the viewer first feels under their own hands at the piano, then reveal it living in a bigger work (an orchestral piece, a film score, a song). But the piano is always home base and the main evidence, and the expansion comes second, never first.

EMOTIONAL WEIGHT IS NON-NEGOTIABLE. A theory concept on its own is dry and nobody cares. Every idea here must MEAN something: the concept is the HOW behind a feeling the listener already knows. Start from the feeling or the human truth, then reveal the theory or technique that creates it, then make it reusable at the piano. Never pitch "what a suspension is"; pitch "the chord that sounds like aching, and the one small thing in the theory that makes it ache, which you can play yourself". The emotion is the hook and the reason to watch, the theory is the satisfying mechanism underneath, and the piano is where they get to feel it under their own hands. If a concept does not connect to a real emotion or a human truth, reject it. This is the SAME DNA as his vehicle-first work (music as evidence for something human), just entered from the concept side.

BIG ENOUGH FOR A WHOLE VIDEO. The concept must be an OVERARCHING idea with a thesis and several beats, NOT a single device. A Picardy third, a Neapolitan sixth, a deceptive cadence, quartal harmony on their own are not videos, each is at most ONE example inside a bigger idea, and nobody can make a full video from one chord. Always ZOOM OUT: ask what larger question, pattern, emotional journey or human truth this device (and several others like it) all belong to, and pitch THAT as the concept. The specific devices and pieces then become the evidence and the beats. RIGHT altitude: "how composers turn grief into hope in the final bars", "the musical sleights of hand that make you feel homesick", "why the saddest chords are not the minor ones", "how music fakes the feeling of a memory", "the different ways a piece can lie to you about where it is going". WRONG altitude (too small, reject these as standalone concepts): "the Picardy third", "the Neapolitan sixth", "quartal harmony", "the deceptive cadence". If your concept could be fully explained in two minutes, it is too small, zoom out until it is a thesis with several pieces of evidence under it.

UNDERSTANDABLE BY ANYONE. Assume the viewer knows NOTHING about theory: not scales, not keys, not chords. The way in is always the SOUND and the FEELING first ("the music has been sad the whole way, then one note brightens at the very end and it feels like hope"), which anyone can hear. Only THEN name the theory, and build it from zero in plain words the moment it is needed, never assuming prior knowledge. A complete beginner should be able to follow the whole thing on feeling alone, while a more experienced player still gets the satisfying mechanism underneath. If an idea can only land for someone who already knows the jargon (for example explaining a Picardy third to someone who does not know what a key is), it is framed wrong, find the version that starts from what everyone can hear and feel. Personal and emotional beats prior knowledge every time, that is what lets one video reach an absolute beginner and a serious player at once.

1) THE CONCEPT, a feeling explained - the spine is one concrete musical thing the viewer will hear, understand and be able to play, and it MUST carry feeling. Draw from the two main wells, MUSIC THEORY MADE PRACTICAL and PIANO TECHNIQUE (theory at least as much as technique, this channel does a lot of theory), but always tied to what it does to us. THEORY: the chord, progression, interval, scale or modal colour, voice leading within two hands, modulation, cadence, dissonance or resolution behind a SPECIFIC emotion (longing, coming home, dread, hope, nostalgia, heartbreak, the moment tension finally breaks). TECHNIQUE: rubato, voicing, pedalling, phrasing, dynamics, hand independence, and the human reason each one moves us. The strongest pattern: take an impactful, emotional moment in a real piece, break it down to the small piece of theory underneath, and hand the viewer that reusable thing to play and feel for themselves. Never dry, never vague like "musicality", never an orchestration topic.
2) THE PROMISE - an emotional payoff stated so even a non-musician aches to know it. "Why this one chord breaks your heart." "The two notes that sound like coming home." "The theory trick that makes music sound like a memory." Not "understand secondary dominants".
3) EVIDENCE - the concrete PIANO pieces and moments that PROVE the concept and let him demonstrate at the keyboard. Lead with solo piano repertoire he can play. Bring in an orchestral, film or song example only as a later expansion ("and here is where it gets even bigger"), never as the core evidence. Choose vivid, varied, specific examples, not the same handful every time.
4) INVESTIGATION - build the case at the piano first, then expand: show the concept under the hands, compare, demonstrate, reveal the mechanism, and only then widen out. A short ordered list of beats the viewer follows.
5) HUMAN PAYOFF - why it matters beyond technique: it changes how they hear or feel music, or connects to something human.

TITLES: outcome and curiosity first, honest, no clickbait, no jargon, no "How to...". 4-6 varied options. ("Why great pianists play fewer notes", "The one note that makes everything sad", "What a key change really does to you".)
VOICE: thoughtful, warm, a little philosophical. Music is communication; this strand is about helping people HEAR and DO at the piano. Be specific and concrete, and reach for varied piano evidence, never the usual warhorses.`;

const SYSTEM_PACKAGE = `You are the ideation engine for Matthew Cawood, a pianist and educator on YouTube (143K+ subscribers) who also runs a membership app, The Practice Room.

HIS MODEL, follow it exactly: every video TEACHES something (a piece of musicianship, theory, technique, history or insight) THROUGH a VEHICLE (a famous, recognisable piece or musical thing). The teaching is the constant. What makes a video win or die is the PACKAGING: the overarching idea, the title and the thumbnail. Your job is to wrap real teaching in packaging that is genuinely interesting.

YOU ARE GROUNDED IN HIS LIVE DATA. You will be given his real recent performance: which videos held attention, where viewers drop off, where the traffic comes from (Home, Suggested, Search), what gained subscribers, and where known what drove signups to his app. DERIVE the packaging patterns that are working for HIM RIGHT NOW from that data. Do NOT use a fixed formula list. Read what is actually winning in the numbers you are given and lean into it. As his data changes, your patterns change.

EACH IDEA HAS THREE PARTS:
1) IDEA - the actual thing the video teaches or explores. It must be TRUE, substantial enough to sustain 12-20 minutes, and relevant to people learning the piano (his growth audience and his app audience). Never manufactured profundity, never a forced or false reading of a piece.
2) VEHICLE - the famous, recognisable piece or musical thing it is built around. Something a normal person knows or has heard, that he can sit at the piano and play. The means through which the lesson is delivered. Not obscure.
3) PACKAGING - the title options and the thumbnail concept. This must work three ways AT ONCE: EVERGREEN and searchable (keeps earning views for years), enticing on the HOME and SUGGESTED feeds (so YouTube pushes it to NEW people, which is where his growth comes from), and worth the click for existing subscribers. Thumbnails must punch at small mobile size (most of his audience watches on phones).

TWO GOALS, held together: grow REACH (packaging that escapes into Home/Suggested), and attract ASPIRING PIANISTS who would join The Practice Room (favour teaching a learner actually needs). Where the data shows what converts to the app, weight toward it.

RULES: vehicles must be genuinely famous and recognisable. Everything must be TRUE. Vary the packaging shape across the batch so no two feel like the same video. This is a PIANO channel; the vehicle is something he can play and show. No emojis, no em dashes, no "How to" titles, no jargon.`;

const IDEAS_TOOL = {
  name: "emit_ideas",
  description: "Return video ideas, each as idea + vehicle + packaging (title options + thumbnail concept), grounded in the channel's live performance data.",
  input_schema: {
    type: "object",
    properties: {
      ideas: {
        type: "array",
        items: {
          type: "object",
          properties: {
            idea: { type: "string", description: "the actual thing the video teaches or explores - true, substantial enough for 12-20 minutes, relevant to piano learners" },
            vehicle: { type: "string", description: "the famous, recognisable piece or musical thing it is built around (something he can play on camera, not obscure)" },
            titles: { type: "array", items: { type: "string" }, description: "3-5 packaged title options: evergreen and searchable AND enticing on Home/Suggested. No 'How to', no jargon." },
            thumbnail: { type: "string", description: "the thumbnail concept: subject/foreground, short on-image text, facial expression if any, colour/mood, and what makes it punch at small mobile size" },
            pattern: { type: "string", description: "the packaging shape this uses, named from what is working in his LIVE data (do not invent a fixed taxonomy; describe the pattern you saw winning)" },
            basedOn: { type: "string", description: "which of his real recent winners or which data signal this idea's packaging is modelled on" },
            why: { type: "string", description: "one line: why this travels on Home/Suggested AND serves the learner / app-signup funnel" },
          },
          required: ["idea", "vehicle", "titles", "thumbnail", "pattern", "why"],
        },
      },
    },
    required: ["ideas"],
  },
};

const VEHICLES_TOOL = {
  name: "emit_vehicles",
  description: "Return a list of fascinating musical vehicles, each with the human mystery it could hide.",
  input_schema: {
    type: "object",
    properties: {
      vehicles: {
        type: "array",
        items: {
          type: "object",
          properties: {
            vehicle: { type: "string", description: "the CONCEPT: the interesting, story-driven idea the video is about, in a sentence. This is the spine, not a piece." },
            hero: { type: "string", description: "the HERO piece at the heart of the video: ONE specific piece people actually KNOW and recognise (famous and beloved, something a normal person could hum or has heard), that anchors everything. Not obscure." },
            shape: { type: "string", description: "the STORY SHAPE this idea takes: Mystery, Origin, Rule-break, Head-to-head, Single moment, Myth-bust, Human question, Hidden mechanism, or Transformation. Vary these across the batch so no two feel like the same video." },
            pieces: { type: "array", items: { type: "string" }, description: "2-4 SUPPORTING pieces that extend, contrast with or prove the concept alongside the hero. The hero plus these give enough to fill 12-20 minutes." },
            fascination: { type: "string", description: "the angle, story or surprising read that makes this concept genuinely compelling" },
            mysteryHint: { type: "string", description: "the human question or truth at its heart (not a piano/theory question)" },
          },
          required: ["vehicle", "hero", "shape", "pieces", "fascination", "mysteryHint"],
        },
      },
    },
    required: ["vehicles"],
  },
};

const IDEA_TOOL = {
  name: "emit_idea",
  description: "Return a fully developed video idea built from a vehicle, following the framework.",
  input_schema: {
    type: "object",
    properties: {
      vehicle: { type: "string" },
      kind: { type: "string" },
      question: { type: "string", description: "the human question (not about piano/theory)" },
      mystery: { type: "string", description: "the 'wait, how is that possible?' the vehicle creates" },
      titles: { type: "array", items: { type: "string" }, description: "4-6 distinct title options in his voice" },
      outline: { type: "array", items: { type: "string" }, description: "the investigation beats, in order, that the viewer discovers alongside him" },
      payoff: { type: "string", description: "the human truth it lands on, that matters beyond music" },
    },
    required: ["question", "mystery", "titles", "outline", "payoff"],
  },
};

const CONCEPTS_TOOL = {
  name: "emit_concepts",
  description: "Return a list of outcome-first video concepts: a technique/theory/skill the viewer gains, with specific pieces as the evidence.",
  input_schema: {
    type: "object",
    properties: {
      concepts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            concept: { type: "string", description: "the OVERARCHING idea that is the spine of a FULL video (an emotional thread, question or transformation), big enough to sustain 8-15 minutes. NOT a single chord or device, which would only be one beat." },
            kind: { type: "string", enum: ["technique", "theory", "skill", "insight"] },
            promise: { type: "string", description: "the emotional payoff: what the viewer feels and can do, phrased so even a non-musician aches to know it" },
            evidence: { type: "array", items: { type: "string" }, description: "3-5 specific theory devices AND pieces that fall under this idea and become the video's beats (e.g. for turning grief to hope: a Picardy third, a modal-mixture reprise, a late shift to the major)" },
            hook: { type: "string", description: "the opening curiosity that makes someone stop, led by the feeling" },
          },
          required: ["concept", "kind", "promise", "evidence", "hook"],
        },
      },
    },
    required: ["concepts"],
  },
};

const FILM_OUTLINE_TOOL = {
  name: "emit_film_outline",
  description: "A practical bullet-point shooting outline Matthew reads off while filming to camera.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "the single title to film toward (pick the strongest)" },
      hook: { type: "string", description: "the exact opening line(s) to say in the first ~5 seconds, in his voice" },
      sections: {
        type: "array",
        description: "the body in filming order: each section is a beat of the investigation",
        items: {
          type: "object",
          properties: {
            heading: { type: "string", description: "short label for this beat" },
            bullets: { type: "array", items: { type: "string" }, description: "short, speakable talking points in order; prefix a bullet with [PLAY] where he should demonstrate at the piano, and [FACT] where he should state a verified fact" },
          },
          required: ["heading", "bullets"],
        },
      },
      closing: { type: "string", description: "how to land the human payoff, plus a soft non-salesy nod to The Practice Room only if it fits naturally" },
    },
    required: ["title", "hook", "sections", "closing"],
  },
};

const DISCUSS_TOOL = {
  name: "emit_discussion",
  description: "Reply conversationally in the brainstorm, and replace the idea on the table only when the direction actually changes.",
  input_schema: {
    type: "object",
    properties: {
      reply: { type: "string", description: "your spoken reply to Matthew: conversational, concise, a few sentences, never an essay" },
      changed: { type: "boolean", description: "true ONLY when this turn changes, replaces or newly creates the concrete idea" },
      idea: { type: "object", description: "the FULL updated idea object in the standard shape, included ONLY when changed is true", properties: IDEA_TOOL.input_schema.properties },
    },
    required: ["reply", "changed"],
  },
};

const INSIGHTS_SYSTEM = `You are a sharp, honest YouTube channel strategist for Matthew Cawood (pianist/educator). You understand his creative DNA: his strongest work uses music as evidence to reveal a human truth, vehicle-first.

He has TWO GOALS. Weigh every recommendation against both, and be explicit about which goal each move serves:
- GOAL 1 (REACH / GROWTH): grow the channel to a broader, more interesting audience so it stays alive and healthy.
- GOAL 2 (CONVERSION): attract aspiring pianists, people actively learning, who are likely to join his membership "The Practice Room", done in an interesting, non-salesy way.
These can pull in opposite directions (broad viral appeal vs niche learner depth). Name where they align and where they conflict, and recommend a balance/portfolio, not a fantasy that one move does everything.

Analyse SHORTS and LONG-FORM SEPARATELY (the data flags each video as short or long, with duration). They do different jobs: shorts tend to drive reach/discovery; long-form drives depth, trust and conversion. Say what each format is actually doing for him, with evidence.

Be specific and evidence-based: quote real titles and view counts, separate genuine overperformers from flops, spot the title structures that win, note how the channel is evolving over time. No flattery, tell him what to do more of, less of, and what to try next.`;

const INSIGHTS_TOOL = {
  name: "emit_insights",
  description: "Goal-anchored, format-aware strategic analysis of the channel.",
  input_schema: {
    type: "object",
    properties: {
      headline: { type: "string", description: "one or two sentences: the core read, tied to his two goals" },
      formatRead: { type: "object", properties: {
        shorts: { type: "string", description: "what Shorts are actually doing for him (reach? subs? dead end?), with evidence" },
        longForm: { type: "string", description: "what long-form is doing (depth, conversion, the real hits), with evidence" },
      }, required: ["shorts", "longForm"] },
      whatWorks: { type: "array", items: { type: "object", properties: {
        pattern: { type: "string" }, why: { type: "string" },
        examples: { type: "array", items: { type: "string" }, description: "real titles (with views) that prove it" },
        serves: { type: "string", enum: ["growth", "conversion", "both"], description: "which goal this serves" },
      }, required: ["pattern", "why"] } },
      whatFlops: { type: "array", items: { type: "object", properties: {
        pattern: { type: "string" }, why: { type: "string" },
      }, required: ["pattern", "why"] } },
      titlePatterns: { type: "array", items: { type: "string" }, description: "title styles/structures that correlate with high views" },
      growthMoves: { type: "array", items: { type: "string" }, description: "concrete moves for GOAL 1 (reach / a broader audience)" },
      conversionMoves: { type: "array", items: { type: "string" }, description: "concrete moves for GOAL 2 (attract aspiring pianists likely to join The Practice Room, done interestingly)" },
      tensions: { type: "array", items: { type: "string" }, description: "where the two goals conflict, and how to balance them" },
      directions: { type: "array", items: { type: "string" }, description: "3-6 synthesised top priorities, in order" },
    },
    required: ["headline", "formatRead", "whatWorks", "growthMoves", "conversionMoves", "directions"],
  },
};

// Anthropic-hosted web search tool (live internet) for the fact-check pass.
const WEB_SEARCH_TOOL = { type: "web_search_20250305", name: "web_search", max_uses: 6 };

const FACTCHECK_SYSTEM = `You are a meticulous music fact-checker. You verify CONCRETE FACTUAL claims using web search before judging them: historical events and dates, who composed/wrote/premiered what, attributions, "first to do X", biographical facts, and specific verifiable musical-theory assertions. You IGNORE subjective, interpretive, or artistic statements (e.g. "the saddest piece", "it feels like grief") because those are not facts to check. Popular myths repeated as fact must be flagged. Always search before judging; never rely on memory for a specific claim.`;

const THUMB_SYSTEM = `You are a YouTube thumbnail strategist for Matthew Cawood (pianist, 143k subs). The thumbnail decides the click. You are shown his REAL thumbnails as images. Analyse what actually works for him and design concepts grounded in that, balanced against his two goals: GOAL 1 broad reach/growth, GOAL 2 attracting aspiring pianists who'd join his membership "The Practice Room". Be concrete and visual: focal point, face and expression, text (short and legible), colour and contrast, composition. No generic advice; reference what you actually see in his thumbnails.`;

const THUMB_PATTERNS_TOOL = {
  name: "emit_thumb_patterns",
  description: "What recurring visual patterns make this creator's thumbnails work, from the images shown.",
  input_schema: {
    type: "object",
    properties: {
      summary: { type: "string", description: "one or two sentences: his thumbnail formula at a glance" },
      patterns: { type: "array", items: { type: "object", properties: {
        pattern: { type: "string" }, why: { type: "string", description: "why it drives clicks, referencing what you see" },
      }, required: ["pattern", "why"] } },
      avoid: { type: "array", items: { type: "string" }, description: "what tends to weaken his thumbnails" },
    },
    required: ["summary", "patterns"],
  },
};

const THUMB_CONCEPTS_TOOL = {
  name: "emit_thumb_concepts",
  description: "Concrete thumbnail concepts for a specific video, grounded in his proven style.",
  input_schema: {
    type: "object",
    properties: {
      concepts: { type: "array", items: { type: "object", properties: {
        headline: { type: "string", description: "one line describing the thumbnail at a glance" },
        subject: { type: "string", description: "the main visual / foreground" },
        textOverlay: { type: "string", description: "short punchy on-image text (or 'none')" },
        expression: { type: "string", description: "facial expression / emotion if a face is used" },
        colour: { type: "string", description: "colour + mood + contrast" },
        composition: { type: "string", description: "layout / where the eye goes" },
        why: { type: "string", description: "why it earns the click and which goal it serves" },
      }, required: ["headline", "subject", "why"] } },
    },
    required: ["concepts"],
  },
};

// Build a multimodal message: the creator's thumbnails as images + framing text.
function thumbContent(thumbs: any[], lead: string, trail?: string) {
  const content: any[] = [{ type: "text", text: lead }];
  (thumbs || []).slice(0, 12).forEach((t, i) => {
    content.push({ type: "text", text: `Thumbnail ${i + 1}: "${t.title}" — ${t.views} views` });
    if (t.url) content.push({ type: "image", source: { type: "url", url: t.url } });
  });
  if (trail) content.push({ type: "text", text: trail });
  return content;
}

function ctxBlock(channelContext?: string, avoid?: string[]) {
  let s = "";
  if (channelContext) s += `\n\nGROUNDING - his RECENT videos on this PIANO channel, showing where the channel is now (title, views, likes, comments, date):\n${channelContext}\n\nUse these ONLY as a signal of what his audience responds to: which pieces, emotions and topics land, and what a learning-pianist audience values (read the engagement, likes and comments relative to views, not just raw views). Do NOT copy their FORMAT. He is deliberately moving toward original, story-led CONCEPT videos, so generate those, even though many of his past videos were reactions or covers; never pitch a reaction, a cover or a "watch me play" video. The aim is to attract piano learners likely to join his membership, The Practice Room. Do not repeat topics he has already covered.`;
  if (avoid && avoid.length) s += `\n\nALREADY SEEN or in the backlog (do NOT repeat or lightly reword any of these): ${avoid.join("; ")}`;
  return s;
}

// Forces variety so brainstorms stop returning the same warhorses every time.
function diversityBlock(lens?: string) {
  let s = `\n\nWHERE FRESHNESS COMES FROM, AND WHERE IT DOES NOT. Use pieces people ACTUALLY KNOW and love. A famous, beloved piece (the Moonlight Sonata, Clair de Lune, a Chopin nocturne, Nuvole Bianche, a film theme everyone has heard) usually does BETTER than an obscure one, because the audience already has feelings about it and you give them a surprising new ANGLE, STORY or READ on it. The originality lives in the ANGLE, never in the piece being rare. So do NOT chase obscure or "weird" pieces to seem original, do NOT reach for unusual instruments or strange genres, and do NOT do the "a composer you have never heard of" move. Stay on PIANO music for most ideas (an occasional non-piano example is fine, just not the norm). The ONLY things to avoid repeating are the same angle or the same specific pieces twice in a session, and the tired AI go-tos like Messiaen's Quartet for the End of Time or 4'33". Get your variety from different FEELINGS (grief, joy, fear, love, memory, defiance, awe) and different story shapes, not from digging up rarer music.`;
  if (lens) s += `\n\nFor THIS batch, lean into the emotional territory of: ${lens}.`;
  return s;
}

// Pick the right framework for an existing idea (concept-led ideas carry approach:"concept").
function sysFor(idea: any) { return (idea && idea.approach === "concept") ? SYSTEM_CONCEPT : SYSTEM; }

function buildRequest(body: any) {
  const mode = body?.mode;
  if (mode === "ideas") {
    const count = Math.min(Math.max(parseInt(body.count) || 6, 3), 12);
    const teach = body.teach ? `\n\nHE WANTS TO TEACH THIS in the next video, so build the ideas around delivering exactly this through famous vehicles with great packaging: "${body.teach}".` : "";
    const theme = body.theme ? `\n\nLean toward this theme or feeling if it stays genuinely interesting: "${body.theme}".` : "";
    const user = `Generate ${count} video ideas in his three-part shape (idea + vehicle + packaging).

FIRST, from the live performance data below, work out which PACKAGING is currently winning for HIM: what holds attention through the body (not just the open), what is getting pushed to Home and Suggested, what gains subscribers, and where known what drives app signups. Lean into those shapes; name the pattern you saw.

THEN for each idea give: the IDEA (a true, substantial thing to teach or explore, relevant to piano learners), the VEHICLE (a genuinely famous, recognisable piece), 3-5 packaged TITLE options (evergreen and searchable yet enticing on Home/Suggested), and a THUMBNAIL concept that punches at mobile size. Vary the packaging shape across the batch. Every vehicle must be famous, every claim must be true.${teach}${theme}${diversityBlock(body.lens)}${ctxBlock(body.channelContext, body.avoid)}`;
    return { model: MODEL, max_tokens: 6000, stream: true, system: SYSTEM_PACKAGE,
      tools: [IDEAS_TOOL], tool_choice: { type: "tool", name: "emit_ideas" },
      messages: [{ role: "user", content: user }] };
  }
  if (mode === "vehicles") {
    const count = Math.min(Math.max(parseInt(body.count) || 8, 3), 14);
    const theme = body.theme ? `\n\nLean toward this theme/feeling if you can, but only if it stays genuinely fascinating: "${body.theme}".` : "";
    const user = `Brainstorm ${count} story-led video ideas. Build EACH one like this, with a clear anchor:
- CONCEPT (the "vehicle" field): an interesting, story-driven idea, in a sentence. The spine of the video.
- HERO piece (the "hero" field): ONE famous piece people actually know and recognise, sitting at the heart of the video and anchoring it. It must be genuinely recognisable, something a normal person has heard, NOT obscure.
- SUPPORTING pieces (the "pieces" field): just 2-4 others that extend or prove the concept alongside the hero. Together the hero and these fill a 12-20 minute video.
Do NOT give a vague list of many pieces with no clear anchor, and do NOT make the hero an obscure piece. Each idea is one concept, one well-known hero, a few supporters. The concept itself must be interesting and story-driven, never a dry topic.
Across the batch, the most important thing is to VARY THE SHAPE so no two feel like the same video. Use a DIFFERENT story shape for each idea wherever you can, spread across these:
- THE MYSTERY: the vehicle creates a real "wait, how is that even possible?"
- THE ORIGIN: the human story behind how a piece or moment came to exist
- THE RULE-BREAK: a piece that breaks a "rule" and works anyway, and why
- THE HEAD-TO-HEAD: two pieces, versions or performances side by side that reveal something
- THE SINGLE MOMENT: one chord, bar or note, gone deep
- THE MYTH-BUST: a thing "everyone knows" about music that is actually wrong
- THE HUMAN QUESTION: a "why do we..." question with music as the evidence
- THE HIDDEN MECHANISM: reveal the reusable theory or technique secretly behind a feeling, told as a story with a payoff the viewer can play (this is how theory lives here, never as a dry explainer)
- THE TRANSFORMATION: how one small thing (a key change, a tempo, a single note) changes everything
Also vary the EMOTION widely, NOT just grief and longing: joy, fear, obsession, memory, defiance, awe, mischief, tenderness, dread, the relief of release. Each idea must still create a genuine pull and hide a human truth the wider audience would care about.${theme}${diversityBlock(body.lens)}${ctxBlock(body.channelContext, body.avoid)}`;
    return { model: MODEL, max_tokens: 4500, stream: true, system: SYSTEM,
      tools: [VEHICLES_TOOL], tool_choice: { type: "tool", name: "emit_vehicles" },
      messages: [{ role: "user", content: user }] };
  }
  if (mode === "concepts") {
    const count = Math.min(Math.max(parseInt(body.count) || 8, 3), 14);
    const theme = body.theme ? `\n\nLean toward this theme or skill area if you can: "${body.theme}".` : "";
    const user = `Brainstorm ${count} OUTCOME-FIRST video concepts. Each must be an OVERARCHING idea big enough to carry a FULL video (never a single chord or device on its own), it must carry real emotional weight, and it must have several specific theory devices and pieces as the evidence/beats underneath. Zoom out to the bigger emotional thread, question or human truth, then the devices become the evidence. For each give the overarching concept, its kind, the emotional promise, 3-5 specific evidence devices/pieces (the beats), and a hook.${theme}${diversityBlock(body.lens)}${ctxBlock(body.channelContext, body.avoid)}`;
    return { model: MODEL, max_tokens: 6000, stream: true, system: SYSTEM_CONCEPT,
      tools: [CONCEPTS_TOOL], tool_choice: { type: "tool", name: "emit_concepts" },
      messages: [{ role: "user", content: user }] };
  }
  if (mode === "develop") {
    if (!body.vehicle) return null;
    const concept = body.approach === "concept";
    const angle = body.angle ? `\n\nPreferred ${concept ? "viewer promise / angle" : "angle / human question"} to explore (use it if it's strong, otherwise find a better one): "${body.angle}".` : "";
    const user = concept
      ? `Develop this CONCEPT into a full outcome-first video idea, following the framework end to end.\n\nConcept: ${body.vehicle}${body.kind ? ` (${body.kind})` : ""}.${angle}${ctxBlock(body.channelContext)}\n\nReturn the idea in the standard shape, used this way: put the concept itself in "vehicle"; put the viewer promise (what they gain) in "question"; put the hook in "mystery"; give 4-6 title options; the investigation "outline" as ordered beats that build the case using specific pieces as EVIDENCE; and the human payoff. Set "kind" to the concept's kind.`
      : `Develop this into a full 12-20 minute video idea, following the framework end to end.\n\nConcept: ${body.vehicle}.${body.hero ? `\nHero piece (the well-known piece at the centre that anchors the video): ${body.hero}.` : ""}${Array.isArray(body.pieces) && body.pieces.length ? `\nSupporting pieces: ${body.pieces.join("; ")} (use, drop or swap if a stronger one fits).` : ""}${angle}${ctxBlock(body.channelContext)}\n\nReturn the human question, the mystery/hook, 4-6 title options, and the investigation outline as ordered beats that START from the hero piece and bring in the supporting pieces (enough to fill 12-20 minutes), and the human payoff.`;
    return { model: MODEL, max_tokens: 4000, stream: true, system: concept ? SYSTEM_CONCEPT : SYSTEM,
      tools: [IDEA_TOOL], tool_choice: { type: "tool", name: "emit_idea" },
      messages: [{ role: "user", content: user }] };
  }
  if (mode === "refine") {
    if (!body.idea || !body.instruction) return null;
    const user = `Here is a current video idea (JSON):\n${JSON.stringify(body.idea)}\n\nRefine it per this instruction: "${body.instruction}". Keep what works. Return the full idea again in the same shape.`;
    return { model: MODEL, max_tokens: 4000, stream: true, system: sysFor(body.idea),
      tools: [IDEA_TOOL], tool_choice: { type: "tool", name: "emit_idea" },
      messages: [{ role: "user", content: user }] };
  }
  if (mode === "discuss") {
    const turns = Array.isArray(body.messages) ? body.messages : [];
    const conversation = turns
      .map((m: any) => ({ role: m?.role === "assistant" ? "assistant" : "user", content: String(m?.content || "").slice(0, 6000) }))
      .filter((m: any) => m.content);
    if (!conversation.length) conversation.push({ role: "user", content: "Let's brainstorm a video idea." });
    if (conversation[conversation.length - 1].role !== "user") conversation.push({ role: "user", content: "Continue." });
    const ideaCtx = body.idea
      ? `\n\nThe idea currently on the table (JSON):\n${JSON.stringify(body.idea)}`
      : `\n\nThere is no developed idea on the table yet, you are brainstorming from scratch.`;
    const sys = sysFor(body.idea) + `\n\nYou are in DISCUSSION mode: a real back-and-forth with Matthew. Talk like a sharp creative partner, not a generator. Push back on weak angles, ask a pointed question when it helps, and offer genuinely DIFFERENT alternatives rather than piling more onto the same idea. When he wants a new direction, commit to it and REPLACE the idea, do not just accrete. Keep replies short and conversational. No emojis, no em dashes.\n\nEvery turn you MUST call emit_discussion. Put your spoken reply in "reply". Set "changed" true and include the FULL "idea" object ONLY when this turn actually changes, replaces or newly creates the concrete idea (new vehicle, new angle, reworked titles, outline or payoff). If you are only talking it through and the idea on the table is unchanged, set "changed" false and omit "idea".${ctxBlock(body.channelContext)}${ideaCtx}`;
    return { model: MODEL, max_tokens: 3500, stream: true, system: sys,
      tools: [DISCUSS_TOOL], tool_choice: { type: "tool", name: "emit_discussion" },
      messages: conversation };
  }

  if (mode === "revise_facts") {
    if (!body.idea || !body.facts) return null;
    const user = `Here is a developed video idea (JSON):\n${JSON.stringify(body.idea)}\n\nA fact-check was run against it. Here are the verdicts (JSON):\n${typeof body.facts === "string" ? body.facts : JSON.stringify(body.facts)}\n\nRevise the idea so it stands entirely on TRUE ground:\n- If a core premise, mystery, title, beat or payoff relied on a claim judged FALSE or MISLEADING, do NOT keep the myth. Find the truthful version of the story (it is usually MORE fascinating than the myth) and pivot the angle to it.\n- Correct any factual detail across the question, mystery, titles, outline and payoff to match the verified facts.\n- Keep everything that checked out; stay in his voice, vehicle-first.\n\nReturn the full revised idea in the same shape.`;
    return { model: MODEL, max_tokens: 4000, stream: true, system: sysFor(body.idea),
      tools: [IDEA_TOOL], tool_choice: { type: "tool", name: "emit_idea" },
      messages: [{ role: "user", content: user }] };
  }
  if (mode === "film_outline") {
    if (!body.idea) return null;
    const ideaStr = typeof body.idea === "string" ? body.idea : JSON.stringify(body.idea);
    const facts = body.facts
      ? `\n\nVERIFIED FACTS to weave in. State the CORRECTED version; never repeat a debunked myth as true:\n${typeof body.facts === "string" ? body.facts : JSON.stringify(body.facts)}`
      : "";
    const notes = body.notes ? `\n\nMatthew's own directions/additions to honour:\n${body.notes}` : "";
    const user = `Turn this developed video idea into a practical BULLET-POINT FILMING OUTLINE that Matthew reads off while filming to camera.\n\nIdea (JSON):\n${ideaStr}${facts}${notes}\n\nShoot order: a punchy hook for the first ~5 seconds, then ordered sections (the investigation beats), then land the human payoff. Keep every bullet short and speakable, in his voice. Mark [PLAY] where he should demonstrate at the piano and [FACT] where he states a verified fact. No emojis, no em dashes.`;
    return { model: MODEL, max_tokens: 3500, stream: true, system: sysFor(body.idea),
      tools: [FILM_OUTLINE_TOOL], tool_choice: { type: "tool", name: "emit_film_outline" },
      messages: [{ role: "user", content: user }] };
  }
  if (mode === "insights") {
    if (!body.channelData) return null;
    const meta = body.meta ? `${body.meta}\n\n` : "";
    const user = `${meta}Here is the channel's full catalogue. Each row is: title | views | date | duration(seconds) | SHORT or LONG.\n\n${body.channelData}\n\nAnalyse honestly and specifically against his two goals (reach/growth AND attracting aspiring pianists who'd join The Practice Room). Treat SHORTS and LONG-FORM separately. What genuinely overperforms vs underperforms in each format? Which title structures win? How is the channel evolving? Then give goal-anchored moves: what grows reach, what attracts learner-prospects, and where those two goals conflict and how to balance them. Use real titles and view counts as evidence throughout.`;
    return { model: MODEL, max_tokens: 7000, stream: true, system: INSIGHTS_SYSTEM,
      tools: [INSIGHTS_TOOL], tool_choice: { type: "tool", name: "emit_insights" },
      messages: [{ role: "user", content: user }] };
  }
  if (mode === "thumb_patterns") {
    if (!Array.isArray(body.thumbs) || !body.thumbs.length) return null;
    const content = thumbContent(body.thumbs,
      "These are Matthew Cawood's best-performing video thumbnails (title and views given before each image). Study them as images and identify the recurring visual formula that earns clicks for HIM specifically, and what weakens a thumbnail. Be concrete about what you actually see.");
    return { model: MODEL, max_tokens: 2500, stream: true, system: THUMB_SYSTEM,
      tools: [THUMB_PATTERNS_TOOL], tool_choice: { type: "tool", name: "emit_thumb_patterns" },
      messages: [{ role: "user", content }] };
  }
  if (mode === "thumb_concept") {
    if (!body.idea) return null;
    const ideaStr = typeof body.idea === "string" ? body.idea : JSON.stringify(body.idea);
    const content = thumbContent(body.thumbs || [],
      "These reference images are Matthew Cawood's best-performing thumbnails (study his style).",
      `Now propose 3 distinct thumbnail concepts for this NEW video, grounded in what works for him above:\n\n${ideaStr}\n\nFor each concept give the headline, subject/foreground, short on-image text, facial expression if any, colour/mood, composition, and why it earns the click (and which goal it serves: reach or attracting aspiring pianists).`);
    return { model: MODEL, max_tokens: 3500, stream: true, system: THUMB_SYSTEM,
      tools: [THUMB_CONCEPTS_TOOL], tool_choice: { type: "tool", name: "emit_thumb_concepts" },
      messages: [{ role: "user", content }] };
  }
  if (mode === "factcheck") {
    if (!body.idea) return null;
    const user = `Fact-check the concrete factual claims in this music video idea. Use web search to verify each one before judging; do not rely on memory.\n\nIdea (JSON):\n${JSON.stringify(body.idea)}\n\nFind every verifiable factual claim (ignore subjective/artistic statements). For each, give: the claim, a verdict (one of: verified, false, misleading, unverified), a short note (the correction or nuance), and a source URL you actually used.\n\nWhen done, end your reply with ONLY this JSON inside a \`\`\`json fenced code block:\n{ "claims": [ { "claim": "...", "verdict": "verified|false|misleading|unverified", "note": "...", "source": "https://..." } ], "summary": "one short overall line" }`;
    // Web search needs the agentic loop, so NO forced tool here; the model searches
    // then writes a text answer ending in the JSON block (the client extracts it).
    return { model: MODEL, max_tokens: 4000, stream: true, system: FACTCHECK_SYSTEM,
      tools: [WEB_SEARCH_TOOL], messages: [{ role: "user", content: user }] };
  }
  return null;
}

const jsonError = (status: number, message: string) =>
  new Response(JSON.stringify({ error: message }), { status, headers: { ...cors, "content-type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return jsonError(405, "Use POST.");

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return jsonError(500, "ANTHROPIC_API_KEY is not set on the server.");

  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return jsonError(401, "Unauthorised");
  let caller: string | undefined;
  try {
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON },
    });
    if (!userRes.ok) return jsonError(401, "Unauthorised");
    caller = (await userRes.json())?.email;
  } catch { return jsonError(401, "Unauthorised"); }
  if (!caller || caller.toLowerCase() !== OWNER_EMAIL) return jsonError(403, "Forbidden");

  let body: any;
  try { body = await req.json(); } catch { return jsonError(400, "Invalid JSON body."); }

  const payload = buildRequest(body);
  if (!payload) return jsonError(400, "mode must be one of: vehicles, concepts, develop, discuss, refine (with required fields).");

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const fail = (msg: string) => controller.enqueue(encoder.encode("\n__ERROR__" + msg));
      try {
        let upstream: Response;
        try {
          upstream = await fetch(ANTHROPIC_URL, {
            method: "POST",
            headers: { "x-api-key": apiKey, "anthropic-version": ANTHROPIC_VERSION, "content-type": "application/json" },
            body: JSON.stringify(payload),
          });
        } catch (e: any) { fail("Could not reach the Claude API: " + (e?.message || e)); return; }

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          fail("Claude API error (" + (upstream.status || "?") + "): " + detail.slice(0, 300));
          return;
        }

        const reader = upstream.body.getReader();
        let buf = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let sep: number;
          while ((sep = buf.indexOf("\n\n")) !== -1) {
            const rawEvent = buf.slice(0, sep);
            buf = buf.slice(sep + 2);
            for (const line of rawEvent.split("\n")) {
              if (!line.startsWith("data:")) continue;
              const data = line.slice(5).trim();
              if (!data || data === "[DONE]") continue;
              let evt: any;
              try { evt = JSON.parse(data); } catch { continue; }
              if (evt.type === "content_block_delta") {
                // structured modes stream forced-tool JSON; factcheck (web search) streams text
                if (evt.delta?.type === "input_json_delta" && evt.delta.partial_json) {
                  controller.enqueue(encoder.encode(evt.delta.partial_json));
                } else if (evt.delta?.type === "text_delta" && evt.delta.text) {
                  controller.enqueue(encoder.encode(evt.delta.text));
                }
              } else if (evt.type === "error") {
                fail(evt.error?.message || "generation error");
              }
            }
          }
        }
      } catch (e: any) {
        fail(e?.message || "stream error");
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { ...cors, "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
});
