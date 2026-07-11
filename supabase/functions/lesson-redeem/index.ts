// Redeem one lesson-package credit to book a 1-hour lesson — NO payment.
// POST { email, eventTypeId, startTime, name, timeZone, notes?, fileUrl? }
// Gate: the email must have remaining > 0. Books the Cal.com lesson, then
// decrements the oldest credit row. Emails Matt + the student.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ANON_KEY     = Deno.env.get("SUPABASE_ANON_KEY") || "";
const UUID_RE      = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CAL_API_KEY  = Deno.env.get("CAL_API_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const NOTIFY_TO   = "matthew@matthewcawood.com";
const NOTIFY_FROM = "bookings@matthewcawood.com";
// Cal.com's standard attendee emails go here (a void) — the customer only gets ours.
const MASK_EMAIL  = "bookings-noreply@matthewcawood.com";

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

// A logged-in member's session proves ownership of their email. Returns "" for the
// anon key or any non-user token.
async function sessionEmail(req: Request): Promise<string> {
  const t = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!t || t === ANON_KEY) return "";
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: ANON_KEY, Authorization: `Bearer ${t}` } });
    if (!r.ok) return "";
    const u = await r.json();
    return String(u?.email || "").trim().toLowerCase();
  } catch { return ""; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const reqBody = await req.json();
    const { eventTypeId, name, timeZone, notes, fileUrl } = reqBody;

    // Prove ownership of the email before spending its paid credits. A redeem
    // token (from the "package is ready" email) or a logged-in session are both
    // proof; a bare typed email is only honoured transitionally until the token
    // rollout is complete (booking page + buyer emails), then removed.
    let email = "";
    const token = String(reqBody.redeem_token || "").trim();
    if (token) {
      if (!UUID_RE.test(token)) return json({ error: "That booking link is not valid." }, 403);
      const tr = await sb(`lesson_credits?select=email&redeem_token=eq.${encodeURIComponent(token)}&limit=1`);
      const trows = tr.ok ? await tr.json() : [];
      if (!trows.length) return json({ error: "That booking link is not valid." }, 403);
      email = String(trows[0].email || "").trim().toLowerCase();
    } else {
      // No token -> require an OTP-verified / signed-in session. A bare typed
      // email is no longer trusted (that was the credit-burn IDOR).
      email = await sessionEmail(req);
      if (!email) return json({ error: "Please book from the link in your package email, or sign in to continue." }, 403);
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Invalid email" }, 400);
    // Accept a list of slots (book several at once) or a single startTime (legacy).
    const rawSlots: string[] = Array.isArray(reqBody.slots) && reqBody.slots.length
      ? reqBody.slots.map((s: unknown) => String(s))
      : (reqBody.startTime ? [String(reqBody.startTime)] : []);
    if (!eventTypeId || !rawSlots.length) return json({ error: "Missing slot" }, 400);
    const slots = [...new Set(rawSlots)].sort();
    const tz = timeZone || "Europe/London";

    // Credits expire 12 months after purchase. Need at least as many valid
    // credits as slots requested; we spend the oldest first.
    const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const cr = await sb(`lesson_credits?select=id,remaining&email=eq.${encodeURIComponent(email)}&remaining=gt.0&created_at=gt.${encodeURIComponent(yearAgo)}&order=created_at.asc`);
    const creditRows: any[] = cr.ok ? await cr.json() : [];
    const totalRemaining = creditRows.reduce((s: number, r: any) => s + (Number(r.remaining) || 0), 0);
    if (totalRemaining <= 0) return json({ error: "No valid lessons remaining for this email." }, 402);
    if (slots.length > totalRemaining) return json({ error: `You have ${totalRemaining} lesson${totalRemaining === 1 ? "" : "s"} left but tried to book ${slots.length}.` }, 402);

    // Book each slot in Cal.com. Masked attendee → Cal's standard emails go to a
    // void; we email the customer ourselves. A slot that's just been taken is
    // skipped, not fatal — we book the rest and report it.
    const booked: { startISO: string; uid: string | null; zoomUrl: string | null }[] = [];
    const failed: string[] = [];
    for (const slot of slots) {
      const bookingBody: Record<string, unknown> = {
        eventTypeId: Number(eventTypeId),
        start: slot,
        attendee: { name: name || "Student", email: MASK_EMAIL, timeZone: tz, language: "en" },
        metadata: { source: "package-credit", customerEmail: email, customerName: name || "Student", ...(notes ? { notes: String(notes).slice(0, 490) } : {}), ...(fileUrl ? { attachmentUrl: String(fileUrl).slice(0, 500) } : {}) },
      };
      try {
        const calRes = await fetch("https://api.cal.com/v2/bookings", {
          method: "POST",
          headers: { "Authorization": `Bearer ${CAL_API_KEY}`, "cal-api-version": "2024-08-13", "Content-Type": "application/json" },
          body: JSON.stringify(bookingBody),
        });
        const booking = await calRes.json();
        if (booking.status !== "success") { console.error("Cal.com booking failed:", JSON.stringify(booking)); failed.push(slot); continue; }
        const data = booking.data || {};
        const zoomUrl = data.meetingUrl || data.videoCallData?.url || null;
        const startISO = data.start || slot;
        await sb("bookings", {
          method: "POST",
          headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
          body: JSON.stringify({
            email, kind: "60min", amount_minor: 0, currency: null,
            cal_uid: data.uid || null, start_time: startISO,
            meeting_url: zoomUrl, status: "accepted", event_type_id: String(eventTypeId),
            attendee_timezone: tz, attendee_name: name || "Student",
          }),
        }).catch(() => {});
        booked.push({ startISO, uid: data.uid || null, zoomUrl });
      } catch (_) { failed.push(slot); }
    }
    if (!booked.length) return json({ error: "Those times are no longer available. Please pick another." }, 409);

    // Spend one credit per successful booking, oldest credit row first.
    let toSpend = booked.length;
    for (const row of creditRows) {
      if (toSpend <= 0) break;
      const take = Math.min(toSpend, Number(row.remaining) || 0);
      if (take <= 0) continue;
      await sb(`lesson_credits?id=eq.${row.id}`, {
        method: "PATCH", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ remaining: (Number(row.remaining) || 0) - take, updated_at: new Date().toISOString() }),
      });
      toSpend -= take;
    }
    const remaining = Math.max(0, totalRemaining - booked.length);

    // ── One customer email covering every lesson just booked ──
    const fmtD = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: tz });
    const fmtT = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz });
    const multi = booked.length > 1;
    const rule = `<div style="border-top:1px solid #ece5db;margin:12px 0"></div>`;
    const attachments: unknown[] = [];
    const blocks = booked.map((b, i) => {
      const endISO = new Date(new Date(b.startISO).getTime() + 60 * 60 * 1000).toISOString();
      const calDesc = `Your 1-hour online piano lesson with Matthew Cawood.${b.zoomUrl ? `\n\nJoin: ${b.zoomUrl}` : ""}`;
      const calUid = `${b.uid || `${b.startISO}-${email}`}@matthewcawood.com`;
      const ics = buildICS({ uid: calUid, start: b.startISO, end: endISO, summary: "Piano Lesson with Matthew Cawood", description: calDesc, location: b.zoomUrl || "Online (Zoom)" });
      attachments.push({ filename: multi ? `lesson-${i + 1}.ics` : "lesson.ics", content: b64(ics), content_type: "text/calendar; method=PUBLISH" });
      const manage = b.uid ? `<br><a href="https://matthewcawood.com/manage/?uid=${b.uid}&a=reschedule" style="color:#9a6f12;font-weight:600">Reschedule</a> or <a href="https://matthewcawood.com/manage/?uid=${b.uid}&a=cancel" style="color:#9a6f12;font-weight:600">cancel</a>` : "";
      return `${ic("calendar")}<strong>${fmtD(b.startISO)}</strong><br>${ic("clock")}${fmtT(b.startISO)} (${tz})` +
        (b.zoomUrl ? `<br>${ic("link")}<a href="${b.zoomUrl}" style="color:#9a6f12;font-weight:600">Join the Zoom call</a>` : "") + manage;
    });
    const detail = blocks.join(rule) + `${rule}${ic("ticket")}${remaining} lesson${remaining === 1 ? "" : "s"} remaining in your package`;
    const firstZoom = booked[0].zoomUrl;
    const gcal0 = gcalLink({ start: booked[0].startISO, end: new Date(new Date(booked[0].startISO).getTime() + 3600000).toISOString(), summary: "Piano Lesson with Matthew Cawood", description: `Your 1-hour online piano lesson with Matthew Cawood.${firstZoom ? `\n\nJoin: ${firstZoom}` : ""}`, location: firstZoom || "Online (Zoom)" });
    const failNote = failed.length ? ` (${failed.length} time${failed.length === 1 ? "" : "s"} you picked had just been taken, so ${failed.length === 1 ? "it was" : "they were"} skipped)` : "";

    const send = (to: string, subject: string, html: string, atts?: unknown[]) =>
      fetch("https://api.resend.com/emails", { method: "POST", headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: NOTIFY_FROM, to: [to], subject, html, ...(atts ? { attachments: atts } : {}) }) }).catch(() => {});

    await Promise.all([
      send(NOTIFY_TO, `Package lesson${multi ? "s" : ""} booked: ${name || email} · ${booked.length}`,
        brandedEmail({
          eyebrow: "Package Lesson" + (multi ? "s" : ""),
          heading: multi ? `${booked.length} package lessons booked` : "Package lesson booked",
          paragraphs: [`<strong>${name || "n/a"}</strong> (${email}) booked ${booked.length} lesson${multi ? "s" : ""} using package credits.`].concat(
            notes ? [`<span style="color:#a99d8c;font-size:13px;text-transform:uppercase;letter-spacing:.05em;font-weight:700">Notes</span><br>${String(notes).replace(/\n/g, "<br>")}`] : []
          ),
          detail,
          footerNote: "Internal notification · matthewcawood.com",
        })),
      send(email, multi ? `Your ${booked.length} lessons are booked` : `Your lesson is booked`,
        brandedEmail({
          eyebrow: multi ? "Lessons Confirmed" : "Lesson Confirmed",
          heading: multi ? "You're all booked in" : "You're booked in",
          paragraphs: [
            multi
              ? `Your ${booked.length} lessons with Matthew are confirmed${failNote}. The details are below, and each link works on the day.`
              : (firstZoom ? `Your 1-hour lesson with Matthew is confirmed. The details are below, and the same link works on the day.` : `Your 1-hour lesson with Matthew is confirmed. You'll receive your meeting link by email shortly.`),
            `Add ${multi ? "them" : "it"} to your calendar with the attached <strong>.ics</strong> file${multi ? "s" : ""}, and you can manage everything anytime in your account.`,
          ],
          detail,
          ctaText: multi ? "Open my account" : (firstZoom ? "Join the Zoom call →" : undefined),
          ctaHref: multi ? "https://matthewcawood.com/account/" : (firstZoom || undefined),
          cta2Text: multi ? undefined : "Add to Google Calendar",
          cta2Href: multi ? undefined : gcal0,
          footerNote: "Matthew Cawood · Online Piano Lessons",
        }),
        attachments),
    ]);

    return json({ ok: true, booked: booked.length, failed: failed.length, remaining, uid: booked[0].uid || null });
  } catch (e: any) {
    console.error("lesson-redeem error:", e.message);
    return json({ error: "Something went wrong." }, 500);
  }
});
