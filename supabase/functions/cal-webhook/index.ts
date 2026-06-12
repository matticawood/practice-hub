// Cal.com webhook → branded cancellation / reschedule emails.
// Subscribe in Cal.com to BOOKING_CANCELLED and BOOKING_RESCHEDULED only
// (creation is already confirmed by clinic-webhook / lesson-redeem).
// PUBLIC: Cal.com calls this with an X-Cal-Signature-256 header, no JWT.
const RESEND_API_KEY    = Deno.env.get("RESEND_API_KEY")!;
const CAL_WEBHOOK_SECRET = Deno.env.get("CAL_WEBHOOK_SECRET") || "";
const NOTIFY_TO   = "matthew@matthewcawood.com";
const NOTIFY_FROM = "bookings@matthewcawood.com";
const BOOK_URL    = "https://matthewcawood.com/book-a-lesson/";

// ── Branded email shell (cream card, gold pill, M-logo header, gold CTA) ──
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
<tr><td style="padding:20px 36px;border-top:1px solid #f0ebe3;text-align:center;font-size:12px;color:#a99d8c;line-height:1.6">${o.footerNote || "Matthew Cawood · Online Lessons &amp; Clinics"}<br><a href="https://matthewcawood.com" style="color:#a99d8c;text-decoration:underline">matthewcawood.com</a></td></tr>
</table></td></tr></table></body></html>`;
}

const ICON_BASE = "https://gyskfutmncprqxazgatv.supabase.co/storage/v1/object/public/email-assets/icons";
const ic = (n: string) => `<img src="${ICON_BASE}/${n}.png" width="15" height="15" alt="" style="vertical-align:-2px;margin-right:9px">`;

// ── Calendar helpers (for the rescheduled .ics + Google Calendar link) ──
const utc = (d: Date | string | number) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const escICS = (s: string) => String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
function buildICS(o: { uid: string; start: string; end: string; summary: string; description: string; location?: string }): string {
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Matthew Cawood//Bookings//EN",
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:${o.uid}`, `DTSTAMP:${utc(Date.now())}`, `DTSTART:${utc(o.start)}`, `DTEND:${utc(o.end)}`,
    `SUMMARY:${escICS(o.summary)}`, `DESCRIPTION:${escICS(o.description)}`,
    o.location ? `LOCATION:${escICS(o.location)}` : "", "STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}
function gcalLink(o: { start: string; end: string; summary: string; description: string; location?: string }): string {
  const p = new URLSearchParams({ action: "TEMPLATE", text: o.summary, dates: `${utc(o.start)}/${utc(o.end)}`, details: o.description, location: o.location || "" });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
const b64 = (s: string) => btoa(unescape(encodeURIComponent(s)));

// Cal.com signs the raw body with HMAC-SHA256 (hex) in X-Cal-Signature-256.
async function verifyCalSignature(payload: string, header: string): Promise<boolean> {
  if (!CAL_WEBHOOK_SECRET) return true;          // not configured yet → accept
  if (!header) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(CAL_WEBHOOK_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return hex === header.toLowerCase();
}

const send = (to: string, subject: string, html: string, attachments?: unknown[]) =>
  fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: NOTIFY_FROM, to: [to], subject, html, ...(attachments ? { attachments } : {}) }),
  }).catch((e) => console.error("send failed:", e.message));

function labelFor(lengthMin: number): string {
  return lengthMin === 60 ? "1-hour lesson" : `${lengthMin}-minute clinic`;
}
function fmtDate(iso: string, tz: string) {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: tz });
}
function fmtTime(iso: string, tz: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const raw = await req.text();
  const ok = await verifyCalSignature(raw, req.headers.get("x-cal-signature-256") || "");
  if (!ok) { console.error("Invalid Cal.com signature"); return new Response("Invalid signature", { status: 400 }); }

  let event: any;
  try { event = JSON.parse(raw); } catch { return new Response("Bad JSON", { status: 400 }); }
  const trigger = event.triggerEvent;
  const p = event.payload || {};
  console.log("Cal webhook:", trigger, p.uid);

  const attendee = (p.attendees && p.attendees[0]) || {};
  // Attendee email is masked (noreply@) — the real customer email lives in metadata.
  const to   = p.metadata?.customerEmail || attendee.email;
  const name = p.metadata?.customerName || attendee.name || "there";
  const tz   = attendee.timeZone || p.organizer?.timeZone || "Europe/London";
  const lengthMin = Number(p.length) || Math.round((new Date(p.endTime).getTime() - new Date(p.startTime).getTime()) / 60000) || 60;
  const label = labelFor(lengthMin);
  const isLesson = lengthMin === 60;

  try {
    if (trigger === "BOOKING_CANCELLED") {
      const dateStr = fmtDate(p.startTime, tz);
      const timeStr = fmtTime(p.startTime, tz);
      const reason  = p.cancellationReason ? `<br><span style="color:#a99d8c">Reason: ${p.cancellationReason}</span>` : "";
      if (to) await send(to, isLesson ? "Your lesson has been cancelled" : "Your clinic has been cancelled",
        brandedEmail({
          eyebrow: "Booking Cancelled",
          heading: "Your booking is cancelled",
          paragraphs: [
            `Your ${label} with Matthew on <strong>${dateStr}</strong> has been cancelled.`,
            `Whenever you're ready, you can book another time below.`,
          ],
          detail: `${ic("calendar")}<s>${dateStr}</s><br>${ic("clock")}<s>${timeStr} (${tz})</s>${reason}`,
          ctaText: "Book another time →", ctaHref: BOOK_URL,
          footerNote: "Matthew Cawood · Online Lessons & Clinics",
        }));
      await send(NOTIFY_TO, `Cancelled: ${name} — ${label} · ${dateStr}`,
        brandedEmail({
          eyebrow: "Booking Cancelled", heading: `${label} cancelled`,
          paragraphs: [`<strong>${name}</strong> (${to || "n/a"}) cancelled their ${label}.`],
          detail: `${ic("calendar")}${dateStr} at ${timeStr} (${tz})${reason}`,
          footerNote: "Internal notification · matthewcawood.com",
        }));
      return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
    }

    if (trigger === "BOOKING_RESCHEDULED") {
      // payload.startTime/endTime carry the NEW time; uid is the new booking.
      const startISO = p.startTime, endISO = p.endTime || new Date(new Date(startISO).getTime() + lengthMin * 60000).toISOString();
      const dateStr = fmtDate(startISO, tz);
      const timeStr = fmtTime(startISO, tz);
      const uid = p.uid || "";
      const zoomUrl = (typeof p.location === "string" && p.location.startsWith("http") ? p.location : null)
        || p.metadata?.videoCallUrl || p.videoCallData?.url || null;
      const calSummary = isLesson ? "Piano Lesson with Matthew Cawood" : "Piano Clinic with Matthew Cawood";
      const calDesc = `Your ${label} with Matthew Cawood.${zoomUrl ? `\n\nJoin: ${zoomUrl}` : ""}`;
      const calLoc  = zoomUrl || "Online (Zoom)";
      const ics  = buildICS({ uid: `${uid || startISO}@matthewcawood.com`, start: startISO, end: endISO, summary: calSummary, description: calDesc, location: calLoc });
      const gcal = gcalLink({ start: startISO, end: endISO, summary: calSummary, description: calDesc, location: calLoc });
      const GATE = "https://matthewcawood.com/manage/";
      const changeLine = uid
        ? `Need to change again? <a href="${GATE}?uid=${uid}&a=reschedule" style="color:#9a6f12;font-weight:600">Reschedule</a> (free up to 24h before) or <a href="${GATE}?uid=${uid}&a=cancel" style="color:#9a6f12;font-weight:600">cancel</a>.`
        : "";

      if (to) await send(to, isLesson ? "Your lesson has been moved" : "Your clinic has been moved",
        brandedEmail({
          eyebrow: "Booking Moved",
          heading: "Your booking has moved",
          paragraphs: [
            `Your ${label} with Matthew has been rescheduled. Here are the new details:`,
            `Add the new time to your calendar below, or open the attached <strong>booking.ics</strong> file.`,
            changeLine,
          ].filter(Boolean),
          detail: [`${ic("calendar")}<strong>${dateStr}</strong>`, `${ic("clock")}${timeStr} (${tz})`].join("<br>"),
          ctaText: zoomUrl ? "Join the Zoom call →" : undefined, ctaHref: zoomUrl || undefined,
          cta2Text: "Add to Google Calendar", cta2Href: gcal,
          footerNote: "Matthew Cawood · Online Lessons & Clinics",
        }),
        [{ filename: "booking.ics", content: b64(ics), content_type: "text/calendar; method=PUBLISH" }]);
      await send(NOTIFY_TO, `Rescheduled: ${name} — ${label} · ${dateStr}`,
        brandedEmail({
          eyebrow: "Booking Moved", heading: `${label} rescheduled`,
          paragraphs: [`<strong>${name}</strong> (${to || "n/a"}) moved their ${label}.`],
          detail: `${ic("calendar")}New: ${dateStr} at ${timeStr} (${tz})`,
          footerNote: "Internal notification · matthewcawood.com",
        }));
      return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
    }

    // Other triggers (e.g. BOOKING_CREATED) are handled elsewhere — ignore.
    return new Response(JSON.stringify({ received: true, ignored: trigger }), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("cal-webhook error:", e.message);
    // Always 200 so Cal.com doesn't hammer retries on a mail hiccup.
    return new Response(JSON.stringify({ received: true, error: e.message }), { headers: { "Content-Type": "application/json" } });
  }
});
