// Redeem one lesson-package credit to book a 1-hour lesson — NO payment.
// POST { email, eventTypeId, startTime, name, timeZone, notes?, fileUrl? }
// Gate: the email must have remaining > 0. Books the Cal.com lesson, then
// decrements the oldest credit row. Emails Matt + the student.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const CAL_API_KEY  = Deno.env.get("CAL_API_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const NOTIFY_TO   = "matthew@matthewcawood.com";
const NOTIFY_FROM = "bookings@matthewcawood.com";

// ── Branded email shell (matches The Practice Room transactional style) ──
const BRAND_LOGO = "https://gyskfutmncprqxazgatv.supabase.co/storage/v1/object/public/email-assets/logo.png";
function brandedEmail(o: {
  eyebrow?: string; heading?: string; paragraphs?: string[];
  detail?: string; ctaText?: string; ctaHref?: string;
  cta2Text?: string; cta2Href?: string; footerNote?: string;
}): string {
  const P = (h: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.62;color:#42382e">${h}</p>`;
  const body = (o.paragraphs || []).map(P).join("");
  const eb = o.eyebrow ? `<tr><td style="padding:0 36px 6px;text-align:center"><span style="display:inline-block;background:#F5C518;color:#1a1410;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:6px 13px;border-radius:999px">${o.eyebrow}</span></td></tr>` : "";
  const hd = o.heading ? `<tr><td style="padding:14px 36px 2px;text-align:center"><h1 style="margin:0;font-size:22px;line-height:1.25;color:#42382e;font-weight:800;letter-spacing:-.01em">${o.heading}</h1></td></tr>` : "";
  const dt = o.detail ? `<tr><td style="padding:12px 36px 2px"><div style="background:#f7f4ef;border:1px solid #ece5db;border-radius:12px;padding:15px 17px;font-size:14px;line-height:1.65;color:#42382e">${o.detail}</div></td></tr>` : "";
  const btn = (text: string, href: string, primary: boolean) => `<a href="${href}" style="display:inline-block;box-sizing:border-box;width:240px;margin:5px;padding:13px 10px;text-align:center;background:${primary ? "#F5C518" : "#ffffff"};color:#1a1410;text-decoration:none;font-weight:700;font-size:15px;border-radius:11px;${primary ? "" : "border:1.5px solid #e2d9c9;"}">${text}</a>`;
  const cta = (o.ctaText || o.cta2Text)
    ? `<tr><td style="padding:18px 30px 28px;text-align:center">${o.ctaText ? btn(o.ctaText, o.ctaHref || "#", true) : ""}${o.cta2Text ? btn(o.cta2Text, o.cta2Href || "#", false) : ""}</td></tr>`
    : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#faf7f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1410;-webkit-font-smoothing:antialiased">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f3;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #ece5db;border-radius:18px;overflow:hidden">
<tr><td style="padding:30px 36px 14px;text-align:center"><img src="${BRAND_LOGO}" width="46" height="46" alt="" style="display:inline-block;border-radius:12px"><div style="margin-top:10px;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#a99d8c">Matthew Cawood</div></td></tr>
${eb}${hd}
<tr><td style="padding:14px 38px 2px">${body}</td></tr>
${dt}${cta}
<tr><td style="padding:20px 36px;border-top:1px solid #f0ebe3;text-align:center;font-size:12px;color:#a99d8c;line-height:1.6">${o.footerNote || "Matthew Cawood · Pianist, Producer &amp; Educator"}<br><a href="https://matthewcawood.com" style="color:#a99d8c;text-decoration:underline">matthewcawood.com</a></td></tr>
</table></td></tr></table></body></html>`;
}

// ── Email detail-row icons: hosted PNGs (render in every client, incl. Gmail) ──
const ICON_BASE = "https://gyskfutmncprqxazgatv.supabase.co/storage/v1/object/public/email-assets/icons";
const ic = (n: string) => `<img src="${ICON_BASE}/${n}.png" width="15" height="15" alt="" style="vertical-align:-2px;margin-right:9px">`;

// ── Calendar helpers (universal .ics attachment + Google Calendar link) ──
const utc = (d: Date | string | number) =>
  new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const escICS = (s: string) =>
  String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

function buildICS(o: { uid: string; start: string; end: string; summary: string; description: string; location?: string }): string {
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Matthew Cawood//Lessons//EN",
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:${o.uid}`, `DTSTAMP:${utc(Date.now())}`,
    `DTSTART:${utc(o.start)}`, `DTEND:${utc(o.end)}`,
    `SUMMARY:${escICS(o.summary)}`, `DESCRIPTION:${escICS(o.description)}`,
    o.location ? `LOCATION:${escICS(o.location)}` : "",
    "STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}
function gcalLink(o: { start: string; end: string; summary: string; description: string; location?: string }): string {
  const p = new URLSearchParams({
    action: "TEMPLATE", text: o.summary,
    dates: `${utc(o.start)}/${utc(o.end)}`,
    details: o.description, location: o.location || "",
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
// UTF-8-safe base64 (for the .ics attachment payload)
const b64 = (s: string) => btoa(unescape(encodeURIComponent(s)));

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

async function sb(path: string, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { email: rawEmail, eventTypeId, startTime, name, timeZone, notes, fileUrl } = await req.json();
    const email = String(rawEmail || "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Invalid email" }, 400);
    if (!eventTypeId || !startTime) return json({ error: "Missing slot" }, 400);

    // Credits expire 12 months after purchase. Spend the oldest still-valid one first.
    const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const cr = await sb(`lesson_credits?select=id,remaining&email=eq.${encodeURIComponent(email)}&remaining=gt.0&created_at=gt.${encodeURIComponent(yearAgo)}&order=created_at.asc&limit=1`);
    const rows = cr.ok ? await cr.json() : [];
    if (!rows.length) return json({ error: "No valid lessons remaining for this email." }, 402);
    const credit = rows[0];

    // Book the Cal.com lesson (mirrors clinic-webhook booking call)
    const bookingBody: Record<string, unknown> = {
      eventTypeId: Number(eventTypeId),
      start: startTime,
      attendee: { name: name || "Student", email, timeZone: timeZone || "Europe/London", language: "en" },
      metadata: { source: "package-credit", ...(notes ? { notes: String(notes).slice(0, 490) } : {}), ...(fileUrl ? { attachmentUrl: String(fileUrl).slice(0, 500) } : {}) },
    };
    const calRes = await fetch("https://api.cal.com/v2/bookings", {
      method: "POST",
      headers: { "Authorization": `Bearer ${CAL_API_KEY}`, "cal-api-version": "2024-08-13", "Content-Type": "application/json" },
      body: JSON.stringify(bookingBody),
    });
    const booking = await calRes.json();
    if (booking.status !== "success") {
      console.error("Cal.com booking failed:", JSON.stringify(booking));
      return json({ error: "That slot is no longer available. Please pick another." }, 409);
    }

    // Decrement the credit only after a successful booking.
    await sb(`lesson_credits?id=eq.${credit.id}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ remaining: Number(credit.remaining) - 1, updated_at: new Date().toISOString() }),
    });

    // Remaining after this redemption (only still-valid credits)
    const after = await sb(`lesson_credits?select=remaining&email=eq.${encodeURIComponent(email)}&created_at=gt.${encodeURIComponent(yearAgo)}`);
    const remaining = after.ok ? (await after.json()).reduce((s: number, r: any) => s + (Number(r.remaining) || 0), 0) : 0;

    // Emails (best-effort)
    const data = booking.data || {};
    const zoomUrl = data.meetingUrl || data.videoCallData?.url || null;
    const startISO = data.start || startTime;
    const tz = timeZone || "Europe/London";
    const dateStr = new Date(startISO).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: tz });
    const timeStr = new Date(startISO).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz });
    const send = (to: string, subject: string, html: string, attachments?: unknown[]) =>
      fetch("https://api.resend.com/emails", { method: "POST", headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: NOTIFY_FROM, to: [to], subject, html, ...(attachments ? { attachments } : {}) }) }).catch(() => {});

    // Calendar invite: end = start + 60 min; reuse Cal.com's UID so the .ics
    // merges with (rather than duplicates) Cal.com's own invite in the diary.
    const endISO = new Date(new Date(startISO).getTime() + 60 * 60 * 1000).toISOString();
    const calSummary = "Piano Lesson with Matthew Cawood";
    const calDesc = `Your 1-hour online piano lesson with Matthew Cawood.${zoomUrl ? `\n\nJoin: ${zoomUrl}` : ""}${notes ? `\n\nNotes: ${String(notes)}` : ""}`;
    const calLoc = zoomUrl || "Online (Zoom)";
    const calUid = `${data.uid || `${startISO}-${email}`}@matthewcawood.com`;
    const ics = buildICS({ uid: calUid, start: startISO, end: endISO, summary: calSummary, description: calDesc, location: calLoc });
    const gcal = gcalLink({ start: startISO, end: endISO, summary: calSummary, description: calDesc, location: calLoc });
    const icsAttachment = [{ filename: "lesson.ics", content: b64(ics), content_type: "text/calendar; method=PUBLISH" }];
    await Promise.all([
      send(NOTIFY_TO, `Package lesson booked: ${name || email} · ${dateStr}`,
        brandedEmail({
          eyebrow: "Package Lesson",
          heading: "Package lesson booked",
          paragraphs: [`<strong>${name || "n/a"}</strong> (${email}) booked a 1-hour lesson using a package credit.`].concat(
            notes ? [`<span style="color:#a99d8c;font-size:13px;text-transform:uppercase;letter-spacing:.05em;font-weight:700">Notes</span><br>${String(notes).replace(/\n/g, "<br>")}`] : []
          ),
          detail: [
            `${ic("calendar")}${dateStr}`,
            `${ic("clock")}${timeStr} (${tz})`,
            zoomUrl ? `${ic("link")}<a href="${zoomUrl}" style="color:#9a6f12;font-weight:600">Join the Zoom call</a>` : "",
            `${ic("ticket")}${remaining} credit${remaining === 1 ? "" : "s"} remaining`,
          ].filter(Boolean).join("<br>"),
          ctaText: zoomUrl ? "Join the Zoom call →" : undefined,
          ctaHref: zoomUrl || undefined,
          footerNote: "Internal notification · matthewcawood.com",
        })),
      send(email, `Your lesson is booked`,
        brandedEmail({
          eyebrow: "Lesson Confirmed",
          heading: "You're booked in",
          paragraphs: [
            zoomUrl
              ? `Your 1-hour lesson with Matthew is confirmed. The details are below, and the same link works on the day.`
              : `Your 1-hour lesson with Matthew is confirmed. You'll receive your meeting link by email shortly.`,
            `Add it to your calendar with the button below, or open the attached <strong>lesson.ics</strong> file.`,
            (data.uid
              ? `Need to change your plans? <a href="https://app.cal.com/reschedule/${data.uid}" style="color:#9a6f12;font-weight:600">Reschedule</a> or <a href="https://app.cal.com/booking/${data.uid}?cancel=true" style="color:#9a6f12;font-weight:600">cancel</a> anytime.`
              : ""),
          ].filter(Boolean),
          detail: [
            `${ic("calendar")}<strong>${dateStr}</strong>`,
            `${ic("clock")}${timeStr} (${tz})`,
            `${ic("ticket")}${remaining} lesson${remaining === 1 ? "" : "s"} remaining in your package`,
          ].join("<br>"),
          ctaText: zoomUrl ? "Join the Zoom call →" : undefined,
          ctaHref: zoomUrl || undefined,
          cta2Text: "Add to Google Calendar",
          cta2Href: gcal,
          footerNote: "Matthew Cawood · Online Piano Lessons",
        }),
        icsAttachment),
    ]);

    return json({ ok: true, remaining });
  } catch (e: any) {
    console.error("lesson-redeem error:", e.message);
    return json({ error: "Something went wrong." }, 500);
  }
});
