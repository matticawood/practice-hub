const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const CAL_API_KEY           = Deno.env.get("CAL_API_KEY")!;
const RESEND_API_KEY        = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL          = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY           = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// ── Package purchase → grant lesson credits + email the buyer ──
async function grantPackageCredits(meta: Record<string, string>, session: any) {
  const email = (meta.attendeeEmail || session.customer_details?.email || "").toLowerCase();
  const qty   = Number(meta.qty) || 0;
  if (!email || qty <= 0) { console.error("package: missing email/qty", meta); return; }

  // Idempotent on stripe_session_id (unique index); retries are ignored.
  const ins = await fetch(`${SUPABASE_URL}/rest/v1/lesson_credits`, {
    method: "POST",
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify({ email, package: String(qty), total: qty, remaining: qty, stripe_session_id: session.id }),
  });
  if (!ins.ok && ins.status !== 409) console.error("credit insert failed:", ins.status, await ins.text());

  // Buyer email: how to book their lessons
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: NOTIFY_FROM,
        to: [email],
        subject: `Your ${qty}-lesson package is ready 🎹`,
        html: `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1a1410">
          <h2 style="color:#42382e">You've got ${qty} lessons.</h2>
          <p style="line-height:1.7">Thanks for booking a package of <strong>${qty} one-hour lessons</strong> with Matthew. You can schedule each one whenever suits you — no need to pay again.</p>
          <p style="line-height:1.7">To book a lesson, head to the booking page, choose <strong>"Use my lesson package"</strong> and enter this email address (<strong>${email}</strong>):</p>
          <p><a href="https://matthewcawood.com/book-a-lesson/" style="display:inline-block;background:#f5c518;color:#3a2f12;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:9px">Book a lesson →</a></p>
          <p style="font-size:.85rem;color:#8a7868;margin-top:20px">Lessons remaining: ${qty}. They never expire.</p>
        </div>`,
      }),
    });
  } catch (e: any) { console.error("package buyer email failed:", e.message); }

  // Notify Matt
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: NOTIFY_FROM, to: [NOTIFY_TO],
        subject: `New package: ${qty} lessons — ${meta.attendeeName || email}`,
        html: `<div style="font-family:system-ui,sans-serif"><p><strong>${meta.attendeeName || "—"}</strong> (${email}) bought a <strong>${qty}-lesson package</strong>.</p><p>Paid £${((session.amount_total||0)/100).toFixed(2)}. They'll book each lesson via the redeem flow.</p></div>`,
      }),
    });
  } catch (_) { /* best-effort */ }
}

const NOTIFY_TO   = "matthew@matthewcawood.com";
const NOTIFY_FROM = "bookings@matthewcawood.com";

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
    const duration  = meta.duration ? `${meta.duration} Min` : "";
    const fileUrl   = meta.fileUrl || null;

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#111">
        <h2 style="margin-bottom:4px">New Clinic Booking 🎹</h2>
        <p style="color:#666;margin-top:0">${duration} Clinic · ${dateStr} at ${timeStr}</p>

        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #eee;color:#888;width:120px">Student</td>
            <td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600">${meta.attendeeName || "—"}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #eee;color:#888">Email</td>
            <td style="padding:8px 0;border-bottom:1px solid #eee">
              <a href="mailto:${meta.attendeeEmail}" style="color:#2563eb">${meta.attendeeEmail}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #eee;color:#888">Timezone</td>
            <td style="padding:8px 0;border-bottom:1px solid #eee">${meta.attendeeTimeZone || "—"}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #eee;color:#888">Paid</td>
            <td style="padding:8px 0;border-bottom:1px solid #eee">${meta.paid || "—"}</td>
          </tr>
          ${zoomUrl ? `
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #eee;color:#888">Zoom</td>
            <td style="padding:8px 0;border-bottom:1px solid #eee">
              <a href="${zoomUrl}" style="color:#2563eb">Join meeting →</a>
            </td>
          </tr>` : ""}
        </table>

        ${notes ? `
        <div style="background:#f9f9f9;border-left:3px solid #2563eb;padding:12px 16px;border-radius:0 6px 6px 0;margin-bottom:16px">
          <p style="margin:0 0 4px;font-size:.8rem;color:#888;text-transform:uppercase;letter-spacing:.05em">What they want to work on</p>
          <p style="margin:0;line-height:1.6">${notes.replace(/\n/g, "<br>")}</p>
        </div>` : ""}

        ${fileUrl ? `
        <div style="margin-bottom:16px">
          <p style="margin:0 0 8px;font-size:.8rem;color:#888;text-transform:uppercase;letter-spacing:.05em">Attachments</p>
          ${fileUrl.split(", ").map((url: string, i: number) => `
            <a href="${url}" style="display:inline-block;background:#2563eb;color:#fff;padding:7px 14px;border-radius:6px;text-decoration:none;font-size:.85rem;margin-right:6px;margin-bottom:6px">
              View file ${fileUrl.split(", ").length > 1 ? i + 1 : ""} →
            </a>`).join("")}
        </div>` : ""}

        <p style="font-size:.75rem;color:#aaa;margin-top:24px;border-top:1px solid #eee;padding-top:12px">
          Stripe session: ${meta.stripeSessionId || "—"}
        </p>
      </div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:    NOTIFY_FROM,
        to:      [NOTIFY_TO],
        subject: `New Booking: ${meta.attendeeName || "Student"} — ${duration} Clinic · ${dateStr}`,
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
    meta.paid            = `£${((session.amount_total || 0) / 100).toFixed(2)}`;
    meta.stripeSessionId = session.id;

    const noteParts: string[] = [];
    if (meta.notes) noteParts.push(meta.notes);
    const combinedNotes = noteParts.join("\n\n") || undefined;

    const bookingBody: Record<string, unknown> = {
      eventTypeId: Number(meta.eventTypeId),
      start: meta.startTime,
      attendee: {
        name:     meta.attendeeName || "Student",
        email:    meta.attendeeEmail,
        timeZone: meta.attendeeTimeZone || "Europe/London",
        language: "en",
      },
      metadata: {
        stripeSessionId: session.id,
        paid: `£${((session.amount_total || 0) / 100).toFixed(2)}`,
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
      await sendNotificationEmail(booking.data, meta, combinedNotes);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
