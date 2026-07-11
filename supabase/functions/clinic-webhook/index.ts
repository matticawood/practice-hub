const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const CAL_API_KEY           = Deno.env.get("CAL_API_KEY")!;
const RESEND_API_KEY        = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL          = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY           = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// ── Branded email shell (matches The Practice Room transactional style:
//    cream card, gold pill eyebrow, logo header, gold CTA) ──────────────
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

// ── Analytics: record the paid booking, and log the confirmation email so the
//    resend-webhook can attach delivery/open/click engagement (by resend_id). ──
async function recordBooking(o: { vid: string | null; email: string | null; kind: string; amount_minor: number | null; currency: string | null; sessionId: string }) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
      method: "POST",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify({ vid: o.vid, email: o.email, kind: o.kind, amount_minor: o.amount_minor, currency: o.currency, stripe_session_id: o.sessionId }),
    });
  } catch (_) { /* best-effort */ }
}
async function logEmailRow(email: string, campaign: string, resendId: string | null, meta?: unknown) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/email_log`, {
      method: "POST",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify({ email, campaign, status: "sent", resend_id: resendId, meta: meta ?? null }),
    });
  } catch (_) { /* best-effort */ }
}

// ── Branded confirmation to the CUSTOMER for a single paid booking ──
async function sendCustomerConfirmation(bookingData: any, meta: Record<string, string>, notes: string | undefined) {
  try {
    const to = meta.attendeeEmail;
    if (!to) return null;
    const tz       = meta.attendeeTimeZone || "Europe/London";
    const zoomUrl  = bookingData?.meetingUrl || bookingData?.videoCallData?.url || null;
    const startISO = bookingData?.start || meta.startTime;
    const durMin   = Number(meta.duration) || 60;
    const endISO   = new Date(new Date(startISO).getTime() + durMin * 60 * 1000).toISOString();
    const isLesson = meta.duration === "60";
    const label    = isLesson ? "1-hour lesson" : `${meta.duration}-minute clinic`;
    const dateStr  = new Date(startISO).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: tz });
    const timeStr  = new Date(startISO).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz });

    const calSummary = isLesson ? "Piano Lesson with Matthew Cawood" : "Piano Clinic with Matthew Cawood";
    const calDesc = `Your ${label} with Matthew Cawood.${zoomUrl ? `\n\nJoin: ${zoomUrl}` : ""}${notes ? `\n\nNotes: ${notes}` : ""}`;
    const calLoc  = zoomUrl || "Online (Zoom)";
    const bUid    = bookingData?.uid || "";
    const calUid  = `${bUid || `${startISO}-${to}`}@matthewcawood.com`;
    const ics = buildICS({ uid: calUid, start: startISO, end: endISO, summary: calSummary, description: calDesc, location: calLoc });
    const gcal = gcalLink({ start: startISO, end: endISO, summary: calSummary, description: calDesc, location: calLoc });
    const GATE = "https://matthewcawood.com/manage/";
    const changeLine = bUid
      ? `Need to change your plans? <a href="${GATE}?uid=${bUid}&a=reschedule" style="color:#9a6f12;font-weight:600">Reschedule</a> (free up to 24h before) or <a href="${GATE}?uid=${bUid}&a=cancel" style="color:#9a6f12;font-weight:600">cancel</a>.`
      : "";

    const html = brandedEmail({
      eyebrow: "Booking Confirmed",
      heading: "You're booked in",
      paragraphs: [
        zoomUrl
          ? `Your ${label} with Matthew is confirmed. The details are below, and the same link works on the day.`
          : `Your ${label} with Matthew is confirmed. You'll receive your meeting link by email shortly.`,
        `Add it to your calendar with the button below, or open the attached <strong>booking.ics</strong> file.`,
        changeLine,
      ].filter(Boolean),
      detail: [`${ic("calendar")}<strong>${dateStr}</strong>`, `${ic("clock")}${timeStr} (${tz})`].join("<br>"),
      ctaText: zoomUrl ? "Join the Zoom call →" : undefined,
      ctaHref: zoomUrl || undefined,
      cta2Text: "Add to Google Calendar",
      cta2Href: gcal,
      footerNote: "Matthew Cawood · Online Lessons & Clinics",
    });

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: NOTIFY_FROM, to: [to],
        subject: isLesson ? "Your lesson is booked" : "Your clinic is booked",
        html,
        attachments: [{ filename: "booking.ics", content: b64(ics), content_type: "text/calendar; method=PUBLISH" }],
      }),
    });
    const d = await r.json().catch(() => null);
    return (d && d.id) ? String(d.id) : null;
  } catch (e: any) { console.error("customer confirmation failed:", e.message); return null; }
}

// ── Package purchase → grant lesson credits + email the buyer ──
async function grantPackageCredits(meta: Record<string, string>, session: any) {
  const email = (meta.attendeeEmail || session.customer_details?.email || "").toLowerCase();
  const qty   = Number(meta.qty) || 0;
  if (!email || qty <= 0) { console.error("package: missing email/qty", meta); return; }

  // Idempotent on stripe_session_id (unique index); retries are ignored.
  const ins = await fetch(`${SUPABASE_URL}/rest/v1/lesson_credits`, {
    method: "POST",
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "resolution=ignore-duplicates,return=representation" },
    body: JSON.stringify({ email, package: String(qty), total: qty, remaining: qty, stripe_session_id: session.id }),
  });
  if (!ins.ok && ins.status !== 409) console.error("credit insert failed:", ins.status, await ins.text());

  // The per-purchase redeem token proves ownership of the email, so the buyer can
  // book via /book-a-lesson/?redeem=<token> with nothing to type and no login.
  let redeemToken = "";
  try {
    const insRows = ins.ok ? await ins.json().catch(() => []) : [];
    if (Array.isArray(insRows) && insRows[0]?.redeem_token) redeemToken = String(insRows[0].redeem_token);
  } catch (_) { /* fall through to lookup */ }
  if (!redeemToken) {
    // idempotent retry (row already existed, none returned) — look up its token
    const look = await fetch(`${SUPABASE_URL}/rest/v1/lesson_credits?select=redeem_token&stripe_session_id=eq.${encodeURIComponent(session.id)}&limit=1`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    const lrows = look.ok ? await look.json().catch(() => []) : [];
    if (Array.isArray(lrows) && lrows[0]?.redeem_token) redeemToken = String(lrows[0].redeem_token);
  }
  const bookingUrl = redeemToken
    ? `https://matthewcawood.com/book-a-lesson/?redeem=${redeemToken}`
    : "https://matthewcawood.com/book-a-lesson/";

  await recordBooking({ vid: session.client_reference_id ?? null, email, kind: "package", amount_minor: session.amount_total ?? null, currency: session.currency ?? null, sessionId: session.id });

  // Buyer email: how to book their lessons
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: NOTIFY_FROM,
        to: [email],
        subject: `Your ${qty}-lesson package is ready`,
        html: brandedEmail({
          eyebrow: "Lesson Package",
          heading: `You've got ${qty} lessons`,
          paragraphs: [
            `Thank you for booking a package of <strong>${qty} one-hour lessons</strong> with Matthew. Schedule each one whenever suits you.`,
            `When you're ready, just tap the button below. It opens your personal booking page, already set up for your lessons, so there's nothing to type. <strong>Keep this email</strong> and use the same button to book your remaining lessons anytime.`,
          ],
          detail: `${ic("ticket")}<strong>${qty} lesson${qty === 1 ? "" : "s"} remaining</strong> &nbsp;·&nbsp; Valid until ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
          ctaText: "Book your lessons →",
          ctaHref: bookingUrl,
          footerNote: "Matthew Cawood · Online Piano Lessons",
        }),
      }),
    });
    const d = await r.json().catch(() => null);
    await logEmailRow(email, "booking-confirm", (d && d.id) ? String(d.id) : null, { qty });
  } catch (e: any) { console.error("package buyer email failed:", e.message); }

  // Notify Matt
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: NOTIFY_FROM, to: [NOTIFY_TO],
        subject: `New package: ${qty} lessons — ${meta.attendeeName || email}`,
        html: brandedEmail({
          eyebrow: "New Package",
          heading: `${qty}-lesson package sold`,
          paragraphs: [`<strong>${meta.attendeeName || "n/a"}</strong> (${email}) bought a <strong>${qty}-lesson package</strong>.`],
          detail: `${ic("pound")}Paid <strong>${((session.amount_total||0)/100).toFixed(2)} ${(session.currency||"gbp").toUpperCase()}</strong> &nbsp;·&nbsp; ${qty} credit${qty === 1 ? "" : "s"} granted. They'll book each lesson via the redeem flow.`,
          footerNote: "Internal notification · matthewcawood.com",
        }),
      }),
    });
  } catch (_) { /* best-effort */ }
}

const NOTIFY_TO   = "matthew@matthewcawood.com";
const NOTIFY_FROM = "Matthew Cawood <bookings@matthewcawood.com>";
// Cal.com's standard attendee emails are sent here (a void) so the customer only
// ever gets our branded emails. We send the customer their email ourselves.
const MASK_EMAIL  = "bookings-noreply@matthewcawood.com";

// ── Stripe signature verification (HMAC-SHA256) ───────────────
async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  if (!secret) return true; // Skip verification if secret not yet configured
  const parts     = sigHeader.split(",");
  const timestamp = parts.find(p => p.startsWith("t="))?.split("=")[1];
  const v1        = parts.find(p => p.startsWith("v1="))?.split("=")[1];
  if (!timestamp || !v1) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`)
  );
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return hex === v1;
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

async function sendNotificationEmail(
  bookingData: any,
  meta: Record<string, string>,
  notes: string | undefined
) {
  try {
    const zoomUrl   = bookingData?.meetingUrl || bookingData?.videoCallData?.url || null;
    const startISO  = bookingData?.start || meta.startTime;
    const dateStr   = new Date(startISO).toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
      timeZone: meta.attendeeTimeZone || "Europe/London",
    });
    const timeStr   = new Date(startISO).toLocaleTimeString("en-GB", {
      hour: "2-digit", minute: "2-digit",
      timeZone: meta.attendeeTimeZone || "Europe/London",
    });
    const sessionLabel = meta.duration === "60" ? "1-Hour Lesson" : `${meta.duration || ""} Min Clinic`;
    const fileUrl   = meta.fileUrl || null;

    const fileLinks = fileUrl
      ? fileUrl.split(", ").map((url: string, i: number) =>
          `<a href="${url}" style="color:#9a6f12;font-weight:600">View file${fileUrl.split(", ").length > 1 ? " " + (i + 1) : ""} →</a>`).join("&nbsp;&nbsp;")
      : "";
    const detail = [
      `${ic("music")}<strong>${sessionLabel}</strong>`,
      `${ic("calendar")}${dateStr} at ${timeStr}`,
      `${ic("user")}${meta.attendeeName || "n/a"} &nbsp;·&nbsp; <a href="mailto:${meta.attendeeEmail}" style="color:#9a6f12">${meta.attendeeEmail || "n/a"}</a>`,
      `${ic("globe")}${meta.attendeeTimeZone || "n/a"}`,
      `${ic("pound")}Paid ${meta.paid || "n/a"}`,
      zoomUrl ? `${ic("link")}<a href="${zoomUrl}" style="color:#9a6f12;font-weight:600">Join the Zoom call</a>` : "",
      fileLinks ? `${ic("clip")}${fileLinks}` : "",
    ].filter(Boolean).join("<br>");

    const html = brandedEmail({
      eyebrow: "New Booking",
      heading: `${sessionLabel} booked`,
      paragraphs: notes
        ? [`<span style="color:#a99d8c;font-size:13px;text-transform:uppercase;letter-spacing:.05em;font-weight:700">What they want to work on</span><br>${notes.replace(/\n/g, "<br>")}`]
        : [],
      detail,
      ctaText: zoomUrl ? "Join the Zoom call →" : undefined,
      ctaHref: zoomUrl || undefined,
      footerNote: `Internal notification · Stripe ${meta.stripeSessionId || "—"}`,
    });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:    NOTIFY_FROM,
        to:      [NOTIFY_TO],
        subject: `New Booking: ${meta.attendeeName || "Student"} — ${sessionLabel} · ${dateStr}`,
        html,
      }),
    });

    const result = await res.json();
    console.log("Notification email sent:", JSON.stringify(result));
  } catch (e: any) {
    console.error("Failed to send notification email:", e.message);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature") || "";

  const valid = await verifyStripeSignature(body, sig, STRIPE_WEBHOOK_SECRET);
  if (!valid) {
    console.error("Invalid Stripe webhook signature");
    return new Response("Invalid signature", { status: 400 });
  }

  let event: any;
  try { event = JSON.parse(body); }
  catch { return new Response("Bad JSON", { status: 400 }); }

  console.log("Webhook received:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const meta    = session.metadata || {};

    console.log("Session metadata:", JSON.stringify(meta));

    // Membership subscriptions (stripe-webhook) and store sales (store-webhook) also
    // arrive here via Stripe's fan-out. Ignore them with a 200 (not a 400) so Stripe
    // doesn't keep retrying a "failed" delivery on this endpoint.
    if (session.mode === "subscription" || meta.type === "store") {
      return new Response(JSON.stringify({ ignored: session.mode === "subscription" ? "subscription" : "store" }), { headers: { "Content-Type": "application/json" } });
    }

    // Only act once the payment has actually cleared. Cards complete as "paid"; this
    // guards delayed/async methods that can complete a session while still unpaid, so a
    // failed/pending payment never books a lesson or grants credits.
    if (session.payment_status && session.payment_status !== "paid") {
      console.log("clinic-webhook: not paid yet, skipping", session.id, session.payment_status);
      return new Response(JSON.stringify({ ignored: "unpaid" }), { headers: { "Content-Type": "application/json" } });
    }

    // Package purchase → grant credits, no Cal.com booking yet.
    if (meta.type === "package") {
      await grantPackageCredits(meta, session);
      return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
    }

    if (!meta.eventTypeId || !meta.startTime || !meta.attendeeEmail) {
      console.error("Missing required metadata — cannot create booking");
      return new Response("Missing metadata", { status: 400 });
    }

    // Build notes string — student's own text, plus file link if provided
    // Enrich meta with payment info so the email function can access it
    const paidStr        = `${((session.amount_total || 0) / 100).toFixed(2)} ${(session.currency || "gbp").toUpperCase()}`;
    meta.paid            = paidStr;
    meta.stripeSessionId = session.id;
    // Record the paid booking for revenue + funnel analytics (even if Cal.com fails below).
    const _kindMap: Record<string, string> = { "20": "20min", "30": "30min", "60": "60min" };
    await recordBooking({
      vid: session.client_reference_id ?? null, email: meta.attendeeEmail,
      kind: _kindMap[String(meta.duration)] || "clinic",
      amount_minor: session.amount_total ?? null, currency: session.currency ?? null, sessionId: session.id,
    });

    const noteParts: string[] = [];
    if (meta.notes) noteParts.push(meta.notes);
    const combinedNotes = noteParts.join("\n\n") || undefined;

    // Mask the attendee email so Cal.com's standard emails go to a void inbox —
    // the customer only ever receives OUR branded emails. Real email is kept in
    // metadata (read back by cal-webhook for cancellations / reschedules).
    const bookingBody: Record<string, unknown> = {
      eventTypeId: Number(meta.eventTypeId),
      start: meta.startTime,
      attendee: {
        name:     meta.attendeeName || "Student",
        email:    MASK_EMAIL,
        timeZone: meta.attendeeTimeZone || "Europe/London",
        language: "en",
      },
      metadata: {
        stripeSessionId: session.id,
        paid: paidStr,
        customerEmail: meta.attendeeEmail,
        customerName: meta.attendeeName || "Student",
        ...(combinedNotes ? { notes: combinedNotes }  : {}),
        ...(meta.fileUrl  ? { attachmentUrl: meta.fileUrl } : {}),
      },
    };

    console.log("Creating Cal.com booking:", JSON.stringify(bookingBody));

    const calRes = await fetch("https://api.cal.com/v2/bookings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CAL_API_KEY}`,
        "cal-api-version": "2024-08-13",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingBody),
    });

    const booking = await calRes.json();
    console.log("Cal.com booking response:", JSON.stringify(booking));

    if (booking.status !== "success") {
      // Payment was already taken — log the error but don't reject the webhook
      // (Stripe would retry and double-book). Handle manually if needed.
      console.error("Cal.com booking failed:", JSON.stringify(booking));
    } else {
      console.log("Booking created successfully:", booking.data?.uid);
      await sendNotificationEmail(booking.data, meta, combinedNotes);     // → Matt
      const _confirmId = await sendCustomerConfirmation(booking.data, meta, combinedNotes);  // → customer (branded, +calendar)
      await logEmailRow(meta.attendeeEmail, "booking-confirm", _confirmId, { kind: meta.duration });
      // Enrich the booking row with Cal.com detail so it shows in the customer's My Account hub.
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/bookings?stripe_session_id=eq.${encodeURIComponent(session.id)}`, {
          method: "PATCH",
          headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({
            cal_uid: booking.data?.uid || null,
            start_time: booking.data?.start || meta.startTime || null,
            meeting_url: booking.data?.meetingUrl || booking.data?.videoCallData?.url || null,
            status: "accepted",
            event_type_id: String(meta.eventTypeId || ""),
            attendee_timezone: meta.attendeeTimeZone || null,
            attendee_name: meta.attendeeName || null,
          }),
        });
      } catch (_) { /* best-effort */ }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
