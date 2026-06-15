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
    group: "Retired",
    audience: "The ~26 members who lived through the migration and have been silent 14+ days",
    trigger: "Manual, one-time, from the Automations panel",
    status: "ready",
    oneShot: true,
    readOnlyNote: "One-time win-back sent (or planned) around the migration. Kept here for reference; it isn't sent from this page.",
  },
  reactivation: {
    title: "Reactivation (evergreen)",
    group: "Win-back",
    audience: "Any member who goes 14+ days silent, on an ongoing basis",
    trigger: "Automatic, runs daily; emails a member once when they've been 14+ days silent",
    status: "live",
  },
  welcome_d0: {
    title: "Welcome · Day 0",
    group: "New-member sequence",
    audience: "A new member, on their first login",
    trigger: "Auto, Day 0, when someone joins",
    status: "live",
  },
  welcome_d2: {
    title: "Day 2 · The roadmap",
    group: "New-member sequence",
    audience: "New member finding their feet",
    trigger: "Auto, 2 days after joining",
    status: "live",
  },
  welcome_d5: {
    title: "Day 5 · Clinics & library",
    group: "New-member sequence",
    audience: "New member, settling in",
    trigger: "Auto, 5 days after joining",
    status: "live",
  },
  welcome_d10: {
    title: "Day 10 · Community & check-in",
    group: "New-member sequence",
    audience: "New member, first 10 days",
    trigger: "Auto, 10 days after joining",
    status: "live",
  },
  waitlist: {
    title: "Waitlist launch",
    group: "Retired",
    audience: "≈200 waitlist sign-ups who never joined",
    trigger: "Manual, one-time launch announcement",
    status: "ready",
    list: "waitlist",      // sends to the 'waitlist' email list (contacts), not members
    excludeMembers: true,  // skip anyone who is or has ever been a member (current + cancelled)
    readOnlyNote: "One-time launch announcement to the waiting list. Kept here for reference; it isn't sent from this page.",
  },
  livestream_reminder: {
    title: "Live clinic reminder",
    group: "Live clinics",
    audience: "Every member with reminders on, ~1 hour before each clinic",
    trigger: "Automatic, sent by the scheduler before each scheduled clinic",
    status: "live",
    readOnly: true, livestream: true,   // dynamic content (clinic title + each member's local time)
  },

  // ── Booking / lesson emails (transactional, sent by the clinic-webhook and
  //    lesson-redeem edge functions). Preview-only here: copy lives in the
  //    functions, shown with sample details. ──
  booking_package_buyer: {
    title: "Package purchased",
    group: "Booking emails",
    audience: "The customer, right after they buy a lesson package",
    trigger: "Automatic, on a successful package purchase",
    status: "live",
    readOnly: true, booking: "package_buyer",
    readOnlyNote: "Subject: “Your 6-lesson package is ready”. Sent automatically by the booking system when someone buys a lesson package, tells them how to book each lesson. Shown with sample details; copy lives in the clinic-webhook function.",
  },
  booking_lesson_confirmed: {
    title: "Lessons booked (customer)",
    group: "Booking emails",
    audience: "The student, after they redeem package credits for one or more lessons",
    trigger: "Automatic, when one or more package lessons are booked",
    status: "live",
    readOnly: true, booking: "lesson_confirmed",
    readOnlyNote: "Subject: “Your lesson is booked”, or “Your N lessons are booked” when several are booked at once. Booking multiple lessons in one go produces ONE combined email listing every lesson, each with its join link, reschedule/cancel, and its own .ics attachment (shown here with 3 sample lessons). A single booking uses the same format with one lesson. Sent automatically when package credits are redeemed; copy lives in the lesson-redeem function.",
  },
  booking_single_confirmation: {
    title: "Booking confirmed (customer)",
    group: "Booking emails",
    audience: "The customer, after a single paid booking, a clinic or a pay-per 1-hour lesson",
    trigger: "Automatic, when a single paid booking is made",
    status: "live",
    readOnly: true, booking: "single_confirmation",
    readOnlyNote: "Subject: “Your clinic is booked” / “Your lesson is booked”. Sent automatically to the customer after any single paid booking (a Practice Room clinic, or a pay-per 1-hour lesson). Carries a calendar (.ics) attachment + the two buttons. Shown with sample details; copy lives in the clinic-webhook function.",
  },
  booking_cancelled: {
    title: "Booking cancelled (customer)",
    group: "Booking emails",
    audience: "The customer, when they cancel a booking",
    trigger: "Automatic, Cal.com webhook (BOOKING_CANCELLED)",
    status: "live",
    readOnly: true, booking: "cancelled",
    readOnlyNote: "Subject: “Your clinic/lesson has been cancelled”. Sent by the cal-webhook function when a booking is cancelled, with a link to rebook. Shown with sample details.",
  },
  booking_rescheduled: {
    title: "Booking moved (customer)",
    group: "Booking emails",
    audience: "The customer, when they reschedule a booking",
    trigger: "Automatic, Cal.com webhook (BOOKING_RESCHEDULED)",
    status: "live",
    readOnly: true, booking: "rescheduled",
    readOnlyNote: "Subject: “Your clinic/lesson has been moved”. Sent by the cal-webhook function when a booking is rescheduled, with the new time, a fresh .ics + calendar button, and change links. Shown with sample details.",
  },
  booking_lesson_reminder: {
    title: "Lesson reminder (1 hour before)",
    group: "Booking emails",
    audience: "The student, about an hour before each booked lesson",
    trigger: "Automatic, the lesson-reminders job sends it ~1 hour before the lesson",
    status: "live",
    readOnly: true, booking: "lesson_reminder",
    readOnlyNote: "Subject: “Your lesson with Matthew starts in about an hour”. Sent automatically about an hour before each booked lesson, with the Zoom join link, the time in the student's timezone, and reschedule/cancel. Shown here with sample details; copy lives in email-templates.mjs.",
  },
  booking_lesson_link_migration: {
    title: "Lesson moved, new link (one-time)",
    group: "Retired",
    audience: "Students whose existing lessons were moved from Acuity into the new booking system",
    trigger: "Manual, one-time migration send (scripts/email-acuity-lesson-links.mjs)",
    status: "live",
    readOnly: true, booking: "lesson_link_migration",
    readOnlyNote: "Subject: “Your upcoming piano lesson(s), and your new Zoom link”. Sent once to each student whose booked lesson(s) moved across, giving them the new Cal.com Zoom link and the time, and pointing them to My Account to manage it. A student with two lessons gets both in one email. Personalised per recipient; shown here with sample details.",
  },
  booking_new_booking_notif: {
    title: "New booking (your copy)",
    group: "Booking emails",
    audience: "You, an internal heads-up for every paid booking",
    trigger: "Automatic, on every paid clinic / lesson booking",
    status: "live",
    readOnly: true, booking: "new_booking",
    readOnlyNote: "Your internal notification for each paid booking (clinic or 1-hour lesson), with what the student wants to work on. Shown with sample details; copy lives in the clinic-webhook function.",
  },
  booking_package_notif: {
    title: "Package sold (your copy)",
    group: "Booking emails",
    audience: "You, an internal heads-up when a package sells",
    trigger: "Automatic, on a successful package purchase",
    status: "live",
    readOnly: true, booking: "package_notif",
    readOnlyNote: "Your internal notification when a lesson package sells. Shown with sample details; copy lives in the clinic-webhook function.",
  },

  // ── Store delivery emails (preview-only; copy lives in the store-webhook /
  //    store-free functions, shown with sample details). ──
  store_course_access: {
    title: "Course access",
    group: "Store emails",
    audience: "The customer, right after they buy a video course",
    trigger: "Automatic, on a successful course purchase",
    status: "live",
    readOnly: true, store: "course_access",
    readOnlyNote: "Subject: “Your course access: …”. Sent automatically when someone buys a course. Carries the magic link to the course player, a review request, and a Practice Room invite. Shown with sample details; copy lives in the store-webhook function.",
  },
  store_pdf_download: {
    title: "PDF download (paid)",
    group: "Store emails",
    audience: "The customer, right after they buy a paid PDF",
    trigger: "Automatic, on a successful PDF purchase",
    status: "live",
    readOnly: true, store: "pdf_download",
    readOnlyNote: "Subject: “Your download: …”. Sent automatically when someone buys a paid PDF. The button re-signs a fresh download link each time, plus a review request and a Practice Room invite. Shown with sample details; copy lives in the store-webhook function.",
  },
  store_free_pdf: {
    title: "Free PDF",
    group: "Store emails",
    audience: "Anyone who grabs a free PDF from the store",
    trigger: "Automatic, on a free-PDF email capture",
    status: "live",
    readOnly: true, store: "free_pdf",
    readOnlyNote: "Subject: “Your free download: …”. Sent when someone enters their email for a free PDF; also adds them to Monday Music Tips and invites them to The Practice Room. Shown with sample details; copy lives in the store-free function.",
  },
  store_sale_notif: {
    title: "Store sale (internal)",
    group: "Store emails",
    audience: "You",
    trigger: "Automatic, on any store sale",
    status: "live",
    readOnly: true, store: "store_sale",
    readOnlyNote: "Your internal notification for each store sale. Shown with sample details; copy lives in the store-webhook function.",
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

// Ready-made starting points for the Compose tool. Picking one fills in the
// subject / eyebrow / body / button (and which logo sits at the top); you then
// choose who it goes to and can edit every word before sending. `body` is plain
// text, one paragraph per blank line, and {firstName} is filled per recipient.
export const COMPOSE_TEMPLATES = [
  {
    id: "lesson_package_migration",
    label: "Lessons moved to your account (Acuity students)",
    brand: "matthew",
    subject: "Your piano lessons are now in your account",
    eyebrow: "Your Lessons",
    body: [
      "Hi {firstName}, I've moved my lessons over to a new system, and everything is now in one place in your account.",
      "Sign in with the email address this was sent to and you'll see any lessons you've already booked, each with its join link and the time shown in your own timezone, plus any lessons you still have left to book.",
      "It's a quick passwordless sign-in: enter your email, I'll send you a short code, and you're in.",
      "If anything looks off, just reply to this email and I'll sort it out for you.",
    ].join("\n\n"),
    ctaText: "Open my account",
    ctaHref: "https://matthewcawood.com/account/",
  },
];

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
  const brandMatthew = ctx.brand === "matthew";
  const logo = brandMatthew ? "https://gyskfutmncprqxazgatv.supabase.co/storage/v1/object/public/email-assets/logo.png" : `${site}/icon-192.png`;
  const brandLabel = brandMatthew ? "Matthew Cawood" : "The Practice Room";

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
          <div style="margin-top:10px;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#a99d8c">${esc(brandLabel)}</div>
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

// ── Booking / lesson emails (transactional) ──────────────────────────────────
// A faithful JS port of the brandedEmail() shell used by the clinic-webhook and
// lesson-redeem edge functions, so the Studio previews exactly what gets sent.
// Copy lives in those functions; this renders preview-only samples.
const BOOKING_LOGO  = "https://gyskfutmncprqxazgatv.supabase.co/storage/v1/object/public/email-assets/logo.png";
const BOOKING_ICONS = "https://gyskfutmncprqxazgatv.supabase.co/storage/v1/object/public/email-assets/icons";
const bIc = (n) => `<img src="${BOOKING_ICONS}/${n}.png" width="15" height="15" alt="" style="vertical-align:-2px;margin-right:9px">`;

export function renderBookingEmail(o = {}) {
  const P = (h) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.62;color:#42382e">${h}</p>`;
  const body = (o.paragraphs || []).map(P).join("");
  const eb = o.eyebrow ? `<tr><td style="padding:0 36px 6px;text-align:center"><span style="display:inline-block;background:#F5C518;color:#1a1410;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:6px 13px;border-radius:999px">${o.eyebrow}</span></td></tr>` : "";
  const hd = o.heading ? `<tr><td style="padding:14px 36px 2px;text-align:center"><h1 style="margin:0;font-size:22px;line-height:1.25;color:#42382e;font-weight:800;letter-spacing:-.01em">${o.heading}</h1></td></tr>` : "";
  const dt = o.detail ? `<tr><td style="padding:12px 36px 2px"><div style="background:#f7f4ef;border:1px solid #ece5db;border-radius:12px;padding:15px 17px;font-size:14px;line-height:1.65;color:#42382e">${o.detail}</div></td></tr>` : "";
  const btn = (text, href, primary) => `<a href="${href}" style="display:inline-block;box-sizing:border-box;width:240px;margin:5px;padding:13px 10px;text-align:center;background:${primary ? "#F5C518" : "#ffffff"};color:#1a1410;text-decoration:none;font-weight:700;font-size:15px;border-radius:11px;${primary ? "" : "border:1.5px solid #e2d9c9;"}">${text}</a>`;
  const cta = (o.ctaText || o.cta2Text)
    ? `<tr><td style="padding:18px 30px 28px;text-align:center">${o.ctaText ? btn(o.ctaText, o.ctaHref || "#", true) : ""}${o.cta2Text ? btn(o.cta2Text, o.cta2Href || "#", false) : ""}</td></tr>`
    : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#faf7f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1410;-webkit-font-smoothing:antialiased">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f3;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #ece5db;border-radius:18px;overflow:hidden">
<tr><td style="padding:30px 36px 14px;text-align:center"><img src="${BOOKING_LOGO}" width="46" height="46" alt="" style="display:inline-block;border-radius:12px"><div style="margin-top:10px;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#a99d8c">Matthew Cawood</div></td></tr>
${eb}${hd}
<tr><td style="padding:14px 38px 2px">${body}</td></tr>
${dt}${cta}
<tr><td style="padding:20px 36px;border-top:1px solid #f0ebe3;text-align:center;font-size:12px;color:#a99d8c;line-height:1.6">${o.footerNote || "Matthew Cawood · Pianist, Producer &amp; Educator"}<br><a href="https://matthewcawood.com" style="color:#a99d8c;text-decoration:underline">matthewcawood.com</a></td></tr>
</table></td></tr></table></body></html>`;
}

// Lesson-link migration email. The Studio preview AND the real send
// (scripts/email-acuity-lesson-links.mjs) both render through here, so what you
// preview is what goes out. `lessons` is an array of { whenLabel, link } where
// whenLabel is already formatted (e.g. "Thursday 18 June at 2:00pm (UK time)").
// A student with two lessons gets both. Returns { subject, html }.
export function renderLessonLinkEmail({ firstName, lessons } = {}) {
  const fn = esc(firstName || "there");
  const ls = Array.isArray(lessons) ? lessons : [];
  const multi = ls.length > 1;
  const detail = ls.map((l) => {
    const cal = l.gcal
      ? `<a href="${esc(l.gcal)}" style="color:#9a6f12;font-weight:600;text-decoration:none;white-space:nowrap"><img src="${BOOKING_ICONS}/calendar.png" width="14" height="14" alt="" style="vertical-align:-2px;margin-right:5px">Add to calendar</a>`
      : "";
    const manage = l.calUid
      ? `<tr><td colspan="2" style="padding-top:7px;font-size:13px;color:#9a8f7e"><a href="https://matthewcawood.com/manage/?uid=${encodeURIComponent(l.calUid)}&a=reschedule" style="color:#9a6f12;font-weight:600;text-decoration:none">Reschedule</a> or <a href="https://matthewcawood.com/manage/?uid=${encodeURIComponent(l.calUid)}&a=cancel" style="color:#9a6f12;font-weight:600;text-decoration:none">cancel</a></td></tr>`
      : "";
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#42382e">`
      + `<tr><td colspan="2" style="padding-bottom:5px"><strong>${esc(l.whenLabel)}</strong></td></tr>`
      + `<tr><td align="left" style="vertical-align:top"><a href="${esc(l.link)}" style="color:#9a6f12;font-weight:700;text-decoration:none">Join your lesson on Zoom &rarr;</a></td>`
      + `<td align="right" style="vertical-align:top">${cal}</td></tr>`
      + manage
      + `</table>`;
  }).join(`<div style="border-top:1px solid #ece5db;margin:14px 0"></div>`);
  const html = renderBookingEmail({
    eyebrow: "Your Lessons",
    heading: multi ? "Your lessons have a new link" : "Your lesson has a new link",
    paragraphs: [
      `Hi ${fn}, I've just moved my lesson booking over to a new system. ${multi ? "Your lessons are" : "Your lesson is"} still booked for the same time, but the Zoom link has changed, so please use ${multi ? "these new links" : "this new link"} on the day as your previous ${multi ? "links" : "link"} will stop working.`,
      `You'll also always find ${multi ? "your lessons" : "your lesson"} and join ${multi ? "links" : "link"} in your account, shown in your own timezone.`,
      `If you need to move or cancel, you can do so below or reply to this email and I'll happily help.`,
    ],
    detail,
    ctaText: "Open my account",
    ctaHref: "https://matthewcawood.com/account/",
    footerNote: "Matthew Cawood · Online Piano Lessons",
  });
  const subject = multi ? "Your upcoming piano lessons, and your new Zoom links" : "Your upcoming piano lesson, and your new Zoom link";
  return { subject, html };
}

// 1-hour-before lesson reminder. Rendered by the lesson-reminders scheduled
// function AND the Studio preview. `o`: { firstName, dateStr, timeStr, tz, zoom, calUid }.
export function renderLessonReminderEmail(o = {}) {
  const manage = o.calUid
    ? `<br><a href="https://matthewcawood.com/manage/?uid=${encodeURIComponent(o.calUid)}&a=reschedule" style="color:#9a6f12;font-weight:600;text-decoration:none">Reschedule</a> or <a href="https://matthewcawood.com/manage/?uid=${encodeURIComponent(o.calUid)}&a=cancel" style="color:#9a6f12;font-weight:600;text-decoration:none">cancel</a>`
    : "";
  return renderBookingEmail({
    eyebrow: "Starting Soon",
    heading: "Your lesson is in about an hour",
    paragraphs: [
      `Hi ${esc(o.firstName || "there")}, this is a quick reminder that your 1-hour lesson with Matthew starts in about an hour.`,
      `Use the button below to join when it's time. See you soon.`,
    ],
    detail: `${bIc("calendar")}<strong>${esc(o.dateStr)}</strong><br>${bIc("clock")}${esc(o.timeStr)} (${esc(o.tz)})`
      + (o.zoom ? `<br>${bIc("link")}<a href="${esc(o.zoom)}" style="color:#9a6f12;font-weight:600">Join the Zoom call</a>` : "") + manage,
    ctaText: o.zoom ? "Join the Zoom call →" : undefined,
    ctaHref: o.zoom || undefined,
    footerNote: "Matthew Cawood · Online Piano Lessons",
  });
}

// Preview-only sample renders for the four booking emails, keyed by CAMPAIGN_META.booking.
export function renderBookingHTML(key) {
  if (key === "lesson_reminder") return renderLessonReminderEmail({ firstName: "Alex", dateStr: "Thursday, 18 June 2026", timeStr: "14:00", tz: "Europe/London", zoom: "https://us06web.zoom.us/j/0000000000?pwd=sample", calUid: "sample-uid" });
  if (key === "lesson_link_migration") return renderLessonLinkEmail({
    firstName: "David",
    lessons: [
      { whenLabel: "Thursday 18 June at 2:00pm (UK time)", link: "https://us06web.zoom.us/j/00000000000?pwd=sample", calUid: "sample-uid-1", gcal: "https://calendar.google.com/calendar/render?action=TEMPLATE" },
      { whenLabel: "Thursday 25 June at 12:00pm (UK time)", link: "https://us06web.zoom.us/j/11111111111?pwd=sample", calUid: "sample-uid-2", gcal: "https://calendar.google.com/calendar/render?action=TEMPLATE" },
    ],
  }).html;
  const ZOOM = "https://zoom.us/j/9876543210";
  const gcal = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Piano+Lesson+with+Matthew+Cawood&dates=20260616T140000Z/20260616T150000Z&location=" + encodeURIComponent(ZOOM);
  if (key === "package_buyer") return renderBookingEmail({
    eyebrow: "Lesson Package", heading: "You've got 6 lessons",
    paragraphs: [
      "Thank you for booking a package of <strong>6 one-hour lessons</strong> with Matthew. Schedule each one whenever suits you.",
      "When you're ready, head to the booking page, choose <strong>&ldquo;Use my lesson package&rdquo;</strong>, and enter the email on this order: <strong>alex@example.com</strong>.",
    ],
    detail: `${bIc("ticket")}<strong>6 lessons remaining</strong> &nbsp;·&nbsp; Valid until 11 June 2027`,
    ctaText: "Book your first lesson →", ctaHref: "https://matthewcawood.com/book-a-lesson/",
    footerNote: "Matthew Cawood · Online Piano Lessons",
  });
  if (key === "lesson_confirmed") {
    const rule = `<div style="border-top:1px solid #ece5db;margin:12px 0"></div>`;
    const GATE = "https://matthewcawood.com/manage/?uid=sample-uid";
    const block = (d, t, tz) => `${bIc("calendar")}<strong>${d}</strong><br>${bIc("clock")}${t} (${tz})<br>${bIc("link")}<a href="${ZOOM}" style="color:#9a6f12;font-weight:600">Join the Zoom call</a><br><a href="${GATE}&a=reschedule" style="color:#9a6f12;font-weight:600">Reschedule</a> or <a href="${GATE}&a=cancel" style="color:#9a6f12;font-weight:600">cancel</a>`;
    const detail = [
      block("Monday, 16 June 2026", "10:00", "Europe/London"),
      block("Monday, 23 June 2026", "10:00", "Europe/London"),
      block("Monday, 30 June 2026", "10:00", "Europe/London"),
    ].join(rule) + `${rule}${bIc("ticket")}3 lessons remaining in your package`;
    return renderBookingEmail({
      eyebrow: "Lessons Confirmed",
      heading: "You're all booked in",
      paragraphs: [
        "Your 3 lessons with Matthew are confirmed. The details are below, and each link works on the day.",
        "Add them to your calendar with the attached <strong>.ics</strong> files, and you can manage everything anytime in your account.",
      ],
      detail,
      ctaText: "Open my account",
      ctaHref: "https://matthewcawood.com/account/",
      footerNote: "Matthew Cawood · Online Piano Lessons",
    });
  }
  if (key === "single_confirmation") return renderBookingEmail({
    eyebrow: "Booking Confirmed", heading: "You're booked in",
    paragraphs: [
      "Your 30-minute clinic with Matthew is confirmed. The details are below, and the same link works on the day.",
      "Add it to your calendar with the button below, or open the attached <strong>booking.ics</strong> file.",
    ],
    detail: `${bIc("calendar")}<strong>Wednesday, 18 June 2026</strong><br>${bIc("clock")}18:00 (Europe/London)`,
    ctaText: "Join the Zoom call →", ctaHref: ZOOM,
    cta2Text: "Add to Google Calendar", cta2Href: gcal,
    footerNote: "Matthew Cawood · Online Lessons & Clinics",
  });
  if (key === "cancelled") return renderBookingEmail({
    eyebrow: "Booking Cancelled", heading: "Your booking is cancelled",
    paragraphs: [
      "Your 30-minute clinic with Matthew on <strong>Wednesday, 18 June 2026</strong> has been cancelled.",
      "Whenever you're ready, you can book another time below.",
    ],
    detail: `${bIc("calendar")}<s>Wednesday, 18 June 2026</s><br>${bIc("clock")}<s>18:00 (Europe/London)</s>`,
    ctaText: "Book another time →", ctaHref: "https://matthewcawood.com/book-a-lesson/",
    footerNote: "Matthew Cawood · Online Lessons & Clinics",
  });
  if (key === "rescheduled") return renderBookingEmail({
    eyebrow: "Booking Moved", heading: "Your booking has moved",
    paragraphs: [
      "Your 30-minute clinic with Matthew has been rescheduled. Here are the new details:",
      "Add the new time to your calendar below, or open the attached <strong>booking.ics</strong> file.",
      `Need to change again? <a href="${ZOOM}" style="color:#9a6f12;font-weight:600">Reschedule</a> or <a href="${ZOOM}" style="color:#9a6f12;font-weight:600">cancel</a>.`,
    ],
    detail: `${bIc("calendar")}<strong>Thursday, 19 June 2026</strong><br>${bIc("clock")}18:00 (Europe/London)`,
    ctaText: "Join the Zoom call →", ctaHref: ZOOM,
    cta2Text: "Add to Google Calendar", cta2Href: gcal,
    footerNote: "Matthew Cawood · Online Lessons & Clinics",
  });
  if (key === "new_booking") return renderBookingEmail({
    eyebrow: "New Booking", heading: "1-Hour Lesson booked",
    paragraphs: [`<span style="color:#a99d8c;font-size:13px;text-transform:uppercase;letter-spacing:.05em;font-weight:700">What they want to work on</span><br>Chopin Nocturne Op.9 No.2, struggling with the left-hand rubato.`],
    detail: [
      `${bIc("music")}<strong>1-Hour Lesson</strong>`,
      `${bIc("calendar")}Monday, 16 June 2026 at 10:00`,
      `${bIc("user")}Alex Taylor &nbsp;·&nbsp; <a href="mailto:alex@example.com" style="color:#9a6f12">alex@example.com</a>`,
      `${bIc("globe")}America/Toronto`,
      `${bIc("pound")}Paid 90.00 CAD`,
      `${bIc("link")}<a href="${ZOOM}" style="color:#9a6f12;font-weight:600">Join the Zoom call</a>`,
    ].join("<br>"),
    ctaText: "Join the Zoom call →", ctaHref: ZOOM,
    footerNote: "Internal notification · Stripe cs_test_abc123",
  });
  if (key === "package_notif") return renderBookingEmail({
    eyebrow: "New Package", heading: "6-lesson package sold",
    paragraphs: [`<strong>Alex Taylor</strong> (alex@example.com) bought a <strong>6-lesson package</strong>.`],
    detail: `${bIc("pound")}Paid <strong>505.00 CAD</strong> &nbsp;·&nbsp; 6 credits granted. They'll book each lesson via the redeem flow.`,
    footerNote: "Internal notification · matthewcawood.com",
  });
  return "<p style='font-family:sans-serif;padding:24px'>Unknown booking email.</p>";
}

// Preview-only sample renders for the store delivery emails, keyed by CAMPAIGN_META.store.
// Real content is generated per-order in the store-webhook / store-free functions.
export function renderStoreHTML(key) {
  if (key === "course_access") return renderBookingEmail({
    eyebrow: "Course Access", heading: "You're in. Let's begin.",
    paragraphs: [
      "Thank you for buying <strong>The Art of Understanding Music</strong>. Your access is ready, watch online anytime from any device.",
      "Tap below to open the course. Keep this email, the link is yours to return to whenever you like.",
      "When you've had a look, a quick review really helps other pianists. You can <a href=\"https://matthewcawood.com/store/the-art-of-understanding-music/#reviews\" style=\"color:#b4881a\">leave one here</a>.",
      "And if you want to keep going, everything in these resources is taught in depth inside <strong>The Practice Room</strong>: a clear roadmap from beginner to advanced so you always know what to work on next, a growing library of pieces, live clinics with me every two weeks, and a community of pianists to learn alongside.",
    ],
    detail: `${bIc("music")}<strong>The Art of Understanding Music</strong>`,
    ctaText: "Start the course →", ctaHref: "https://matthewcawood.com/store/learn/",
    cta2Text: "Explore The Practice Room →", cta2Href: "https://app.matthewcawood.com/signup",
    footerNote: "Matthew Cawood · Store",
  });
  if (key === "pdf_download") return renderBookingEmail({
    eyebrow: "Your Download", heading: "Thanks for your order",
    paragraphs: [
      "Thank you for buying <strong>Beginner Sight Reading Exercises Book</strong>. Your download is ready below.",
      "The link is personal to you. If it ever expires, just reopen this email and tap it again for a fresh copy.",
      "When you've had a look, a quick review really helps other pianists. You can <a href=\"https://matthewcawood.com/store/beginner-sight-reading-book/#reviews\" style=\"color:#b4881a\">leave one here</a>.",
      "And if you want to keep going, everything in these resources is taught in depth inside <strong>The Practice Room</strong>: a clear roadmap from beginner to advanced so you always know what to work on next, a growing library of pieces, live clinics with me every two weeks, and a community of pianists to learn alongside.",
    ],
    detail: `${bIc("clip")}<strong>Beginner Sight Reading Exercises Book</strong>`,
    ctaText: "Download your PDF →", ctaHref: "#",
    cta2Text: "Explore The Practice Room →", cta2Href: "https://app.matthewcawood.com/signup",
    footerNote: "Matthew Cawood · Store",
  });
  if (key === "free_pdf") return renderBookingEmail({
    eyebrow: "Free Download", heading: "Here's your PDF",
    paragraphs: [
      "Thanks for grabbing <strong>Practice Planner Template</strong>. Tap below to download it, the link works for 7 days.",
      "You're now on Monday Music Tips too, one short, useful idea about playing every Monday. Unsubscribe anytime.",
      "If you'd like to go further, <strong>The Practice Room</strong> takes ideas like these much deeper: a clear roadmap from beginner to advanced so you always know what to work on next, practice tracking, a growing library of pieces, and a community of pianists to learn alongside.",
    ],
    detail: `${bIc("clip")}<strong>Practice Planner Template</strong>`,
    ctaText: "Download your PDF →", ctaHref: "#",
    cta2Text: "Explore The Practice Room →", cta2Href: "https://app.matthewcawood.com/signup",
    footerNote: "Matthew Cawood · Store",
  });
  if (key === "store_sale") return renderBookingEmail({
    eyebrow: "New Sale", heading: "The Art of Understanding Music",
    paragraphs: ["<strong>alex@example.com</strong> bought <strong>The Art of Understanding Music</strong> (course)."],
    detail: `${bIc("pound")}Paid <strong>91.99 CAD</strong>`,
    footerNote: "Internal notification · matthewcawood.com",
  });
  return "<p style='font-family:sans-serif;padding:24px'>Unknown store email.</p>";
}

// ── Monday Music Tips weekly email ──────────────────────────────────────────
// From Matthew (M logo + "Monday Music Tips"), NOT The Practice Room. Cream/gold
// shell coherent with the store emails. content: { issue, subject?, intro:[..],
// quote, quoteAuthor, articleTitle, bullets:[..], articleUrl, suggestUrl? }.
const MC_LOGO = "https://gyskfutmncprqxazgatv.supabase.co/storage/v1/object/public/email-assets/logo.png";
export function renderMMTSubject(content, firstName) {
  const s = content?.subject || content?.articleTitle || "This week's Monday Music Tip";
  return fill(s, { firstName: firstName || "there" });
}
export function renderMMTHTML(content, ctx = {}) {
  const c = content || {};
  const BRAND = "https://matthewcawood.com", APP = "https://app.matthewcawood.com";
  const PR_AD = "https://gyskfutmncprqxazgatv.supabase.co/storage/v1/object/public/email-assets/practice-room-ad.jpg";
  const hook = (c.promoHook && c.promoHook.trim()) ||
    "Monday Music Tips gives you one good idea each week. The Practice Room is the whole system around it: a clear path to follow, the tools to practise well, and the structure to keep improving.";
  const fn = ctx.firstName || "there";
  const unsub = ctx.unsub || "#";
  const unsubText = ctx.unsubText || "Unsubscribe";
  const tokens = { firstName: fn };
  const articleUrl = c.articleUrl || `${BRAND}/monday-music-tips/`;
  const suggestUrl = c.suggestUrl || "https://matthewcawood.com/suggest/";
  const intro = (Array.isArray(c.intro) ? c.intro : (c.intro ? [c.intro] : [])).filter(Boolean);
  const bullets = (Array.isArray(c.bullets) ? c.bullets : []).filter(Boolean);

  const P = (h) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.62;color:#42382e">${fill(h, tokens)}</p>`;
  const rule = `<tr><td style="padding:6px 40px"><div style="height:1px;background:#ece5db"></div></td></tr>`;
  const gbtn = (text, href) => `<a href="${esc(href)}" style="display:inline-block;background:#F5C518;color:#1a1410;text-decoration:none;font-weight:800;font-size:14px;letter-spacing:.02em;padding:14px 32px;border-radius:11px">${esc(text)}</a>`;

  const quoteBlock = c.quote ? `
    <tr><td style="padding:16px 40px 4px;text-align:center">
      <div style="font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#b89b3a;margin-bottom:8px">Quote of the week</div>
      <p style="margin:0;font-size:16px;line-height:1.5;color:#42382e;font-style:italic">"${esc(c.quote)}"</p>
      ${c.quoteAuthor ? `<p style="margin:7px 0 0;font-size:14px;color:#8a7d6b;font-weight:700">${esc(c.quoteAuthor)}</p>` : ""}
    </td></tr>` : "";

  const bulletsHtml = bullets.length ? `
    <tr><td style="padding:6px 40px 0">
      <ul style="margin:6px 0 0;padding-left:20px;color:#42382e">
        ${bullets.map((b) => `<li style="font-size:15px;line-height:1.55;margin-bottom:7px">${esc(b)}</li>`).join("")}
      </ul>
    </td></tr>` : "";

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#faf7f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1410;-webkit-font-smoothing:antialiased">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(intro[0] || c.articleTitle || "This week's Monday Music Tip")}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f3;padding:32px 16px"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #ece5db;border-radius:18px;overflow:hidden">

      <tr><td style="padding:30px 40px 4px;text-align:center">
        <img src="${MC_LOGO}" width="46" height="46" alt="" style="display:inline-block;border-radius:12px">
      </td></tr>
      <tr><td style="padding:12px 40px 2px;text-align:center">
        <span style="display:inline-block;background:#F5C518;color:#1a1410;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:6px 14px;border-radius:999px">Monday Music Tips</span>
        ${c.issue ? `<div style="margin-top:10px;font-size:12px;font-weight:600;letter-spacing:.05em;color:#a99d8c;text-transform:uppercase">Issue ${esc(c.issue)}</div>` : ""}
      </td></tr>

      <tr><td style="padding:18px 40px 2px">
        ${P((fn && fn.toLowerCase() !== "there") ? `Happy Monday, ${esc(fn)}.` : "Happy Monday.")}
        ${intro.map(P).join("")}
      </td></tr>

      ${quoteBlock ? rule + quoteBlock + rule : ""}

      <tr><td style="padding:14px 40px 0">
        ${c.articleTitle ? `<p style="margin:0 0 10px;font-size:15px;color:#42382e">This week's tip: <strong>${esc(c.articleTitle)}</strong></p>` : ""}
        <p style="margin:0;font-size:15px;color:#42382e">In this issue I explore:</p>
      </td></tr>
      ${bulletsHtml}
      <tr><td style="padding:20px 40px 6px;text-align:center">${gbtn("Read the full article →", articleUrl)}</td></tr>

      ${rule}

      <tr><td style="padding:12px 40px 0">
        <a href="${APP}/signup" style="text-decoration:none"><img src="${PR_AD}" alt="The Practice Room" style="display:block;width:100%;height:auto;border-radius:14px;border:1px solid #ece5db"></a>
      </td></tr>
      <tr><td style="padding:16px 40px 0">
        ${P(hook)}
        <p style="margin:2px 0 6px;font-size:14px;color:#42382e;font-weight:700">Inside, you get:</p>
        <ul style="margin:4px 0 0;padding-left:20px;color:#42382e">
          <li style="font-size:14px;line-height:1.55;margin-bottom:7px">A clear roadmap from beginner to advanced, with personalised guidance on exactly what to work on next</li>
          <li style="font-size:14px;line-height:1.55;margin-bottom:7px">Practice tracking that turns your hours, streaks and sessions into visible progress</li>
          <li style="font-size:14px;line-height:1.55;margin-bottom:7px">Live practice clinics with me every two weeks, all recorded, and a community of pianists to learn with</li>
        </ul>
      </td></tr>
      <tr><td style="padding:18px 40px 2px;text-align:center">${gbtn("Explore The Practice Room →", `${APP}/signup`)}</td></tr>
      <tr><td style="padding:5px 40px 0;text-align:center"><span style="font-size:12px;color:#a99d8c">Cancel anytime.</span></td></tr>
      <tr><td style="padding:10px 40px 0;text-align:center"><p style="margin:0;font-size:13px;color:#8a7d6b;line-height:1.5">Monday Music Tips stays free, every Monday. No pressure either way, and I will see you next week.</p></td></tr>

      ${rule}

      <tr><td style="padding:10px 40px 22px;text-align:center">
        <p style="margin:0;font-size:14px;color:#8a7d6b">Have a suggestion for a future Monday Music Tip? <a href="${esc(suggestUrl)}" style="color:#b4881a;font-weight:600">Let me know</a>.</p>
      </td></tr>

      <tr><td style="padding:22px 40px 26px;border-top:1px solid #f0ebe3;text-align:center">
        <div style="font-size:13px;font-weight:800;color:#42382e;margin-bottom:8px">Monday Music Tips</div>
        <div style="font-size:12px;line-height:1.7;color:#a99d8c">
          Matthew Cawood, BMus (Hons) ATCL<br>
          <a href="mailto:enquiries@matthewcawood.com" style="color:#a99d8c;text-decoration:none">enquiries@matthewcawood.com</a> ·
          <a href="${BRAND}" style="color:#a99d8c;text-decoration:none">matthewcawood.com</a> ·
          <a href="https://www.instagram.com/matticawood" style="color:#a99d8c;text-decoration:none">@matticawood</a>
        </div>
        <div style="margin-top:12px"><a href="${esc(unsub)}" style="color:#bcb2a2;text-decoration:underline;font-size:12px">${esc(unsubText)}</a></div>
      </td></tr>

    </table>
  </td></tr></table>
</body></html>`;
}
