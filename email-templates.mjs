// Single source of truth for every automated email.
//
// Both the SENDER (netlify/functions/send-campaign.mjs) and the EMAIL STUDIO
// page (email-studio.html) import this module, so what you see in the Studio is
// byte-for-byte what goes out. Content can be overridden per-campaign in the
// `email_templates` DB table (edited from the Studio); these are the fallbacks.
//
// A campaign's editable content is plain structured data — no HTML — so editing
// is safe (you change words, never markup) and the fixed shell guarantees the
// layout always looks right:
//   { subject, preheader, eyebrow, paragraphs:[...], signature, ctaText, ctaHref }
// Use {firstName} anywhere in the subject or a paragraph; it's filled per person.

export const OWNER_EMAIL = "matthew@matthewcawood.com";

// Order + context shown in the Studio. `status`: 'ready' = wired to send now,
// 'draft' = visible/editable but not yet hooked up to a send trigger.
export const CAMPAIGN_META = {
  relaunch: {
    title: "Relaunch (migration win-back)",
    group: "Win-back",
    audience: "The ~26 members who lived through the migration and have been silent 14+ days",
    trigger: "Manual — one-time, from the Automations panel",
    status: "ready",
    oneShot: true,
  },
  reactivation: {
    title: "Reactivation (evergreen)",
    group: "Win-back",
    audience: "Any member who goes 14+ days silent, on an ongoing basis",
    trigger: "Auto — 14 days after a member goes quiet (trigger not yet wired)",
    status: "draft",
  },
  welcome_d0: {
    title: "Welcome · Day 0",
    group: "New-member sequence",
    audience: "A new member, on their first login",
    trigger: "Auto — Day 0, when someone joins",
    status: "live",
  },
  welcome_d2: {
    title: "Day 2 · The roadmap",
    group: "New-member sequence",
    audience: "New member finding their feet",
    trigger: "Auto — 2 days after joining",
    status: "live",
  },
  welcome_d5: {
    title: "Day 5 · Clinics & library",
    group: "New-member sequence",
    audience: "New member, settling in",
    trigger: "Auto — 5 days after joining",
    status: "live",
  },
  welcome_d10: {
    title: "Day 10 · Community & check-in",
    group: "New-member sequence",
    audience: "New member, first 10 days",
    trigger: "Auto — 10 days after joining",
    status: "live",
  },
  waitlist: {
    title: "Waitlist launch",
    group: "Acquisition",
    audience: "≈200 waitlist sign-ups who never joined",
    trigger: "Manual — one-time launch announcement",
    status: "ready",
    list: "waitlist",      // sends to the 'waitlist' email list (contacts), not members
    excludeMembers: true,  // skip anyone who is or has ever been a member (current + cancelled)
  },
  livestream_reminder: {
    title: "Live clinic reminder",
    group: "Live clinics",
    audience: "Every member with reminders on, ~1 hour before each clinic",
    trigger: "Automatic — sent by the scheduler before each scheduled clinic",
    status: "live",
    readOnly: true,   // dynamic content (clinic title + each member's local time)
  },
};

export const EMAIL_DEFAULTS = {
  // One-time migration win-back to the ~26. References the move from the old
  // community, so it only makes sense to people who were there for it.
  relaunch: {
    subject: "A lot has changed since you last visited",
    preheader: "It's all in one place now, and I'd love to show you around.",
    eyebrow: "A note from Matt",
    paragraphs: [
      "Hi {firstName},",
      "Over the last couple of weeks I've finished moving everything across from the old community and building out The Practice Room in its new home as a cohesive experience. There's a fair bit that has changed there since you last looked.",
      "There's the skill roadmap that maps out what you can expect at each stage of learning the piano, more integrated practice logging that keeps everything you work on in one place and helps guide your progress with statistics and insights, the livestreams and replays, and an ever-growing library of materials to help you along the way.",
      "The one thing that makes the biggest difference is simply logging practice. Data shows that those who track progress and measure success are significantly more likely to succeed.",
      "Come and have a look when you get a chance. I'd love to see you back in there.",
    ],
    signature: "Matt",
    ctaText: "Open The Practice Room",
    ctaHref: "",
  },

  // Evergreen win-back for anyone who drifts 14+ days silent — no migration
  // references, so it reads right for a member who joins long after the move.
  reactivation: {
    subject: "How's your playing going?",
    preheader: "Whenever you're ready, it's all still here.",
    eyebrow: "Checking in",
    paragraphs: [
      "Hi {firstName},",
      "I noticed it's been a little while since you were last in The Practice Room, so I thought I'd check in.",
      "Whenever you're ready to pick things back up, it's all here waiting for you: the skill roadmap, your practice log, the livestreams and replays, and a growing library of materials to help you along the way.",
      "The one thing that makes the biggest difference is simply logging practice. Data shows that those who track progress and measure success are significantly more likely to succeed.",
      "No pressure at all. Come back whenever suits you, I'd love to see you in there.",
    ],
    signature: "Matt",
    ctaText: "Open The Practice Room",
    ctaHref: "",
  },

  // ── Drafts: visible in the Studio, not yet wired to a trigger ──────────────
  welcome_d0: {
    subject: "Welcome to The Practice Room, {firstName}",
    preheader: "Here's everything waiting for you inside.",
    eyebrow: "Welcome",
    paragraphs: [
      "Hi {firstName},",
      "Welcome in, and thank you for joining. I'm really glad to have you here.",
      "When you signed in you'll have seen my note about logging your practice. That's the one habit worth starting with, but there's a whole lot more to explore.",
      "You've got a skill roadmap to guide your learning, live clinics and replays, a growing library of materials, and a community to share it all with. Over the next week or so I'll point you to each of them.",
      "For now, have a look around and get a feel for the place. I'm in here most days, so do say hello.",
    ],
    signature: "Matt",
    ctaText: "Take a look around",
    ctaHref: "",
  },
  welcome_d2: {
    subject: "Where are you heading?",
    preheader: "The roadmap shows you what to focus on next.",
    eyebrow: "Your roadmap",
    paragraphs: [
      "Hi {firstName},",
      "If you've not come across it yet, the skill roadmap is a good place to start. It lays out learning the piano in stages, so you can see what to focus on now and what's further down the line.",
      "It's there to take the guesswork out of practising. Rather than wondering what to work on, you can follow the path and watch your skills build up over time.",
      "Have a look and see where you land.",
    ],
    signature: "Matt",
    ctaText: "Explore the roadmap",
    ctaHref: "/practice-log.html?goto=roadmap",
  },
  welcome_d5: {
    subject: "Come and join a live clinic",
    preheader: "Plus a library of materials to dig into.",
    eyebrow: "Live clinics",
    paragraphs: [
      "Hi {firstName},",
      "One of the best parts of The Practice Room is the live clinics. They're a chance to learn together, ask questions, and pick up things you wouldn't on your own. If you can't make one live, the replays are all there to watch whenever suits.",
      "Alongside those, there's a growing library of materials covering technique, theory, and repertoire, so there's always something to dig into.",
      "Take a look at what's on and what's coming up.",
    ],
    signature: "Matt",
    ctaText: "See the live clinics",
    ctaHref: "/events.html",
  },
  welcome_d10: {
    subject: "How's it going, {firstName}?",
    preheader: "Come and say hello.",
    eyebrow: "Come say hello",
    paragraphs: [
      "Hi {firstName},",
      "You're {timeIn} in, so I wanted to check in and see how you're getting on.",
      "If there's one part of The Practice Room worth diving into, it's the community. It can really help drive your motivation and make your learning feel more personal to you.",
      "If you have a question, or you'd like some personalised feedback, I'm in there to help. And you can simply share your progress too, however big or small, without any fear of judgement. Everyone here started somewhere.",
      "Come and say hello whenever you're ready.",
    ],
    signature: "Matt",
    ctaText: "Say hello in the community",
    ctaHref: "/community.html",
  },
  waitlist: {
    subject: "The Practice Room has grown a lot",
    preheader: "Since you signed up, it's become something much fuller.",
    eyebrow: "Since you signed up",
    paragraphs: [
      "Hi {firstName},",
      "A while ago you put your name down to hear more about The Practice Room. I really appreciate the early interest, and I wanted to let you know how much it has grown since then.",
      "There's now a skill roadmap that guides your learning stage by stage, regular live clinics and replays, a growing library of materials, practice logging that keeps everything in one place, and a friendly community to share it all with.",
      "If the idea appealed to you back then, there's a good chance it's an even better fit for you now. I'd love for you to come and take a look.",
      "Any questions at all, just reply and I'll be glad to help.",
    ],
    signature: "Matt",
    ctaText: "Take a look",
    ctaHref: "",
  },
};

// ── Rendering ────────────────────────────────────────────────────────────────

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Replace {firstName}, {timeIn}, ... from a tokens map. Escape first (DB content
// is plain text), then drop already-escaped values in.
function fill(text, tokens) {
  let out = esc(text);
  for (const [k, v] of Object.entries(tokens || {})) out = out.replaceAll("{" + k + "}", esc(v ?? ""));
  return out;
}

export function renderSubject(content, firstName, timeIn) {
  return String(content?.subject || "")
    .replaceAll("{firstName}", firstName || "there")
    .replaceAll("{timeIn}", timeIn || "a little while");
}

// Friendly, rounded membership-age phrase for the Day-10 check-in ({timeIn}), so
// a member who hits it on schedule reads "about ten days" and a backfilled
// two-week joiner reads "a couple of weeks" — never a robotic "11 days".
export function friendlyAge(days) {
  const d = Math.max(0, Math.round(Number(days) || 0));
  if (d <= 2) return "a couple of days";
  if (d <= 5) return "a few days";
  if (d <= 8) return "about a week";
  if (d <= 11) return "about ten days";
  if (d <= 18) return "a couple of weeks";
  if (d <= 25) return "about three weeks";
  if (d <= 45) return "about a month";
  if (d <= 75) return "a couple of months";
  return "a while";
}

// Returns the full HTML email. `ctx`: { firstName, site, unsub }.
export function renderEmailHTML(content, ctx = {}) {
  const c = content || {};
  const site = (ctx.site || "https://app.matthewcawood.com").replace(/\/$/, "");
  const tokens = { firstName: ctx.firstName || "there", timeIn: ctx.timeIn || "a little while" };
  const unsub = ctx.unsub || `${site}/.netlify/functions/email-unsubscribe?t=`;
  // Footer text varies by audience: members vs the separate waiting list.
  const footerReason = ctx.footerReason || "You're getting this because you're a member of The Practice Room.";
  const unsubText = ctx.unsubText || "Unsubscribe from emails";
  const logo = `${site}/icon-192.png`;

  const P = (html) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.62;color:#42382e">${html}</p>`;
  const bodyRows =
    (Array.isArray(c.paragraphs) ? c.paragraphs : []).map((p) => P(fill(p, tokens))).join("") +
    (c.signature ? `<p style="margin:18px 0 2px;font-size:15px;line-height:1.5;color:#42382e;font-weight:700">${fill(c.signature, tokens)}</p>` : "");

  // A relative ctaHref (e.g. "/practice-log.html") is resolved against the site.
  let ctaHref = c.ctaHref || site;
  if (ctaHref.startsWith("/")) ctaHref = site + ctaHref;

  const eyebrow = c.eyebrow
    ? `<tr><td style="padding:0 36px 4px;text-align:center">
        <span style="display:inline-block;background:#F5C518;color:#1a1410;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:6px 13px;border-radius:999px">${esc(c.eyebrow)}</span>
      </td></tr>` : "";
  const cta = c.ctaText
    ? `<tr><td style="padding:6px 36px 30px;text-align:center">
        <a href="${esc(ctaHref)}" style="display:inline-block;background:#F5C518;color:#1a1410;text-decoration:none;font-weight:700;font-size:15px;padding:14px 34px;border-radius:11px">${esc(c.ctaText)}</a>
      </td></tr>` : "";

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#faf7f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1410;-webkit-font-smoothing:antialiased">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(c.preheader || "")}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f3;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #ece5db;border-radius:18px;overflow:hidden">
        <tr><td style="padding:30px 36px 18px;text-align:center">
          <img src="${esc(logo)}" width="46" height="46" alt="" style="display:inline-block;border-radius:12px">
          <div style="margin-top:10px;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#a99d8c">The Practice Room</div>
        </td></tr>
        ${eyebrow}
        <tr><td style="padding:18px 38px 4px">
          ${bodyRows}
        </td></tr>
        ${cta}
        <tr><td style="padding:18px 36px;border-top:1px solid #f0ebe3;text-align:center;font-size:12px;color:#a99d8c;line-height:1.6">
          ${esc(footerReason)}<br>
          <a href="${esc(unsub)}" style="color:#a99d8c;text-decoration:underline">${esc(unsubText)}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// ── Livestream reminder (sent by the event-reminders scheduled function) ─────
// Its content is dynamic (clinic title + each member's local time), so it isn't
// edited through the structured fields above — but it lives here so the function
// and the Studio render from ONE source. `timeStr` may be a string or an array
// of zone lines. This is byte-identical to the original event-reminders template.
export function renderLivestreamReminderHTML({ firstName, title, timeStr, site, unsub }) {
  const join = site || "#";
  const logo = `${join}/icon-192.png`;
  const timeHtml = (Array.isArray(timeStr) ? timeStr : [timeStr]).map(esc).join("<br>");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#faf7f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1410;-webkit-font-smoothing:antialiased">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(title)} is going live in about an hour.</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f3;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;background:#ffffff;border:1px solid #ece5db;border-radius:18px;overflow:hidden">

        <tr><td style="padding:30px 36px 22px;text-align:center">
          <img src="${esc(logo)}" width="46" height="46" alt="" style="display:inline-block;border-radius:12px">
          <div style="margin-top:10px;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#a99d8c">The Practice Room</div>
        </td></tr>

        <tr><td style="padding:0 36px;text-align:center">
          <span style="display:inline-block;background:#F5C518;color:#1a1410;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:6px 13px;border-radius:999px">● Live in 1 hour</span>
        </td></tr>

        <tr><td style="padding:18px 36px 4px;text-align:center">
          <h1 style="margin:0;font-size:22px;line-height:1.3;font-weight:800;color:#1a1410;word-break:break-word">${esc(title)}</h1>
        </td></tr>

        <tr><td style="padding:10px 36px 0;text-align:center">
          <div style="display:inline-block;background:#faf7f3;border:1px solid #ece5db;border-radius:10px;padding:10px 16px;font-size:15px;font-weight:600;line-height:1.6;color:#5c5247">${timeHtml}</div>
        </td></tr>

        <tr><td style="padding:20px 40px 4px;text-align:center">
          <p style="margin:0;font-size:15px;line-height:1.6;color:#6b6155">Hi ${esc(firstName)}, Matthew will be live in about an hour. Settle in and come join the session.</p>
        </td></tr>

        <tr><td style="padding:24px 36px 32px;text-align:center">
          <a href="${esc(join)}" style="display:inline-block;background:#F5C518;color:#1a1410;text-decoration:none;font-weight:700;font-size:15px;padding:14px 34px;border-radius:11px">Join the livestream</a>
        </td></tr>

        <tr><td style="padding:18px 36px;border-top:1px solid #f0ebe3;text-align:center;font-size:12px;color:#a99d8c;line-height:1.6">
          You're getting this because you're a member of The Practice Room.<br>
          <a href="${esc(unsub)}" style="color:#a99d8c;text-decoration:underline">Turn off livestream reminders</a>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

// Sample data so the Studio can render a faithful preview of the livestream email.
// Members with a saved timezone get a single line in their own zone; everyone else
// gets these three common zones (this fallback is what the sample shows).
export const LIVESTREAM_SAMPLE = {
  firstName: "Alex",
  title: "Sunday Practice Clinic",
  timeStr: ["Sun 8 Jun · 11:00 PST", "Sun 8 Jun · 14:00 EST", "Sun 8 Jun · 19:00 GMT"],
};

// Merge a DB override row (snake_case columns) over the code default.
export function contentForCampaign(campaign, dbRow) {
  const base = EMAIL_DEFAULTS[campaign];
  if (!base) return null;
  if (!dbRow) return { ...base };
  return {
    subject:   dbRow.subject   ?? base.subject,
    preheader: dbRow.preheader ?? base.preheader,
    eyebrow:   dbRow.eyebrow   ?? base.eyebrow,
    paragraphs: Array.isArray(dbRow.paragraphs) && dbRow.paragraphs.length ? dbRow.paragraphs : base.paragraphs,
    signature: dbRow.signature ?? base.signature,
    ctaText:   dbRow.cta_text  ?? base.ctaText,
    ctaHref:   dbRow.cta_href  ?? base.ctaHref,
  };
}
