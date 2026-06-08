// Scheduled function: emails every active member ~1 hour before each livestream.
// Runs every 5 min on the PRODUCTION deploy (Netlify scheduled functions do NOT
// run on deploy-previews / branch deploys — so this only fires once promoted to prod).
//
// Idempotent: each live_events row is stamped with reminder_sent_at after a
// successful send, so it can never double-remind even though the cron overlaps
// the time window for a couple of ticks.
//
// Env vars required (set in Netlify → Site settings → Environment variables):
//   SUPABASE_SERVICE_ROLE_KEY  (already set — billing-portal uses it)
//   RESEND_API_KEY             (your Resend key)
//   REMINDER_FROM              e.g.  The Practice Room <noreply@yourdomain.com>
//   SITE_URL                   e.g.  https://app.thepracticeroom.co  (no trailing slash)

export const config = { schedule: "*/5 * * * *" };

const SUPABASE_URL = "https://gyskfutmncprqxazgatv.supabase.co";

export default async () => {
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const RESEND = process.env.RESEND_API_KEY;
  const FROM = process.env.REMINDER_FROM || "The Practice Room <noreply@matthewcawood.com>";
  const SITE = (process.env.SITE_URL || "").replace(/\/$/, "");

  if (!SERVICE || !RESEND || !FROM) {
    console.error("event-reminders: missing env (SERVICE/RESEND/FROM)");
    return new Response("missing env", { status: 500 });
  }

  const sb = (path, opts = {}) =>
    fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...opts,
      headers: {
        apikey: SERVICE,
        Authorization: `Bearer ${SERVICE}`,
        "Content-Type": "application/json",
        ...(opts.headers || {}),
      },
    });

  // ── 1. Events whose start is ~1 hour away and not yet reminded ──────────────
  // Window 55–65 min ahead; the 5-min cron guarantees each event lands in-window.
  const loIso = new Date(Date.now() + 55 * 60000).toISOString();
  const hiIso = new Date(Date.now() + 65 * 60000).toISOString();

  const evRes = await sb(
    `live_events?select=id,title,scheduled_at,timezone` +
      `&status=eq.scheduled&reminder_sent_at=is.null&test=not.is.true` +
      `&scheduled_at=gte.${loIso}&scheduled_at=lte.${hiIso}`
  );
  if (!evRes.ok) {
    console.error("event-reminders: live_events query failed", await evRes.text());
    return new Response("db error", { status: 500 });
  }
  const events = await evRes.json();
  if (!events.length) return new Response("no events due", { status: 200 });

  // ── 2. Recipients: every opted-in member ────────────────────────────────────
  const rcptRes = await sb(
    `allowed_emails?select=email,name,unsubscribe_token&livestream_reminders_opt_out=eq.false`
  );
  if (!rcptRes.ok) {
    console.error("event-reminders: recipients query failed", await rcptRes.text());
    return new Response("db error", { status: 500 });
  }
  const recipients = (await rcptRes.json()).filter((r) => r.email);

  // ── Per-user timezone (captured when they enable push) so each person sees
  //    the event in THEIR local time, like the events page does. Latest device
  //    wins; anyone without a stored tz falls back to the event's timezone. ──
  const tzByEmail = {};
  const tzRes = await sb(
    `device_tokens?select=email,timezone,last_seen_at&timezone=not.is.null&order=last_seen_at.desc`
  );
  if (tzRes.ok) {
    for (const d of await tzRes.json()) {
      const key = (d.email || "").toLowerCase();
      if (key && d.timezone && !tzByEmail[key]) tzByEmail[key] = d.timezone;
    }
  } else {
    console.error("event-reminders: device_tokens tz query failed", await tzRes.text());
  }

  let sentEvents = 0;
  for (const ev of events) {
    const when = new Date(ev.scheduled_at);
    const eventTz = ev.timezone || "Europe/London";

    // Build one personalised email per recipient: own timezone + unsubscribe link.
    const batch = recipients.map((r) => {
      const unsub = `${SITE}/.netlify/functions/email-unsubscribe?t=${r.unsubscribe_token}`;
      const firstName = (r.name || "").trim().split(/\s+/)[0] || "there";
      const userTz = tzByEmail[r.email.toLowerCase()];
      // Known tz → their local time. Unknown → show PST · EST · GMT to self-orient.
      const timeStr = userTz ? fmtTime(when, userTz, eventTz) : fmtMultiZone(when);
      return {
        from: FROM,
        to: [r.email],
        subject: `Starts in 1 hour: ${ev.title}`,
        headers: { "List-Unsubscribe": `<${unsub}>` },
        html: emailHtml({ firstName, title: ev.title, timeStr, site: SITE, unsub }),
      };
    });

    // Resend batch endpoint: up to 100 messages per call.
    let ok = true;
    for (let i = 0; i < batch.length; i += 100) {
      const chunk = batch.slice(i, i + 100);
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      });
      if (!res.ok) {
        ok = false;
        console.error(`event-reminders: Resend failed for ${ev.id}`, await res.text());
        break;
      }
    }

    // Only stamp as reminded if the send succeeded; otherwise retry next tick.
    if (ok) {
      const mark = await sb(`live_events?id=eq.${ev.id}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ reminder_sent_at: new Date().toISOString() }),
      });
      if (!mark.ok) console.error("event-reminders: failed to stamp", ev.id, await mark.text());
      else sentEvents++;
    }
  }

  return new Response(`reminded ${sentEvents}/${events.length} event(s)`, { status: 200 });
};

// One zone, e.g. "Sun 8 Jun · 19:00 EST". Date/time in en-GB (day-month, 24h);
// the zone LABEL uses labelLocale — en-US renders US zones as PST/EST (en-GB
// would give the uglier "GMT-8"), while Europe/London is nicer in en-GB (BST).
function zoneLine(when, tz, labelLocale = "en-US") {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(when);
  const pick = (t) => (parts.find((p) => p.type === t) || {}).value || "";
  const label = new Intl.DateTimeFormat(labelLocale, { timeZone: tz, timeZoneName: "short" })
    .formatToParts(when).find((p) => p.type === "timeZoneName")?.value || "";
  return `${pick("weekday")} ${pick("day")} ${pick("month")} · ${pick("hour")}:${pick("minute")} ${label}`;
}

// A single user's own timezone, e.g. "Sun 8 Jun · 19:00 EST".
// Falls back to the event timezone if the user's stored tz string is invalid.
function fmtTime(when, tz, fallbackTz) {
  try {
    return zoneLine(when, tz);
  } catch (e) {
    if (tz !== fallbackTz) return fmtTime(when, fallbackTz, fallbackTz);
    return when.toISOString();
  }
}

// Fallback for users with no stored timezone: the time across PST · EST · GMT,
// each line carrying its OWN date so cross-midnight events stay unambiguous
// (e.g. 10pm EST is the next calendar day in GMT). Returns an array of lines:
//   ["Sun 8 Jun · 19:00 PST", "Sun 8 Jun · 22:00 EST", "Mon 9 Jun · 03:00 GMT"]
export function fmtMultiZone(when) {
  return [
    zoneLine(when, "America/Los_Angeles", "en-US"), // PST / PDT
    zoneLine(when, "America/New_York", "en-US"),    // EST / EDT
    zoneLine(when, "Europe/London", "en-GB"),       // GMT / BST
  ];
}

export function emailHtml({ firstName, title, timeStr, site, unsub }) {
  const join = site || "#";
  const logo = `${join}/icon-192.png`;
  // timeStr may be a single string (user's own tz) or an array of zone lines.
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

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}
