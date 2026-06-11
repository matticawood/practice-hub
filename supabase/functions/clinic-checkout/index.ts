const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;

// Single, slot-booked products (keyed by duration in minutes).
const CLINICS: Record<string, { amount: number; label: string }> = {
  "20": { amount: 1800, label: "20 Min Piano Clinic with Matthew Cawood" },
  "30": { amount: 3000, label: "30 Min Piano Clinic with Matthew Cawood" },
  "60": { amount: 4900, label: "1 Hour Online Piano Lesson with Matthew Cawood" },
};

// Lesson packages (bundles of 1-hour lessons, discounted). Buying one grants
// `qty` credits — no slot is chosen at purchase; lessons are booked later by
// redeeming credits.
const PACKAGES: Record<string, { amount: number; label: string; qty: number }> = {
  "3":  { amount: 14000, label: "3 × 1-Hour Online Piano Lessons with Matthew Cawood",  qty: 3 },
  "6":  { amount: 27000, label: "6 × 1-Hour Online Piano Lessons with Matthew Cawood",  qty: 6 },
  "12": { amount: 52000, label: "12 × 1-Hour Online Piano Lessons with Matthew Cawood", qty: 12 },
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const { eventTypeId, startTime, duration, name, email, timeZone, pageUrl, notes, fileUrl, pkg } = body;

    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", `${pageUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", `${pageUrl}?cancelled=true`);

    if (pkg) {
      // ── Package purchase: grant credits, no slot chosen now ──
      const p = PACKAGES[String(pkg)];
      if (!p)            return json({ error: "Invalid package" }, 400);
      if (!name?.trim()) return json({ error: "Missing name" }, 400);
      if (!email?.trim())return json({ error: "Missing email" }, 400);
      params.set("line_items[0][price_data][currency]", "gbp");
      params.set("line_items[0][price_data][unit_amount]", String(p.amount));
      params.set("line_items[0][price_data][product_data][name]", p.label);
      params.set("line_items[0][quantity]", "1");
      params.set("customer_email", email);
      params.set("metadata[type]",          "package");
      params.set("metadata[qty]",           String(p.qty));
      params.set("metadata[attendeeName]",  name);
      params.set("metadata[attendeeEmail]", email);
    } else {
      // ── Single booking (clinic / 1-hour lesson) ──
      const clinic = CLINICS[String(duration)];
      if (!clinic)       return json({ error: "Invalid duration" }, 400);
      if (!eventTypeId)  return json({ error: "Missing eventTypeId" }, 400);
      if (!startTime)    return json({ error: "Missing startTime" }, 400);
      if (!name?.trim()) return json({ error: "Missing name" }, 400);
      if (!email?.trim())return json({ error: "Missing email" }, 400);
      params.set("line_items[0][price_data][currency]", "gbp");
      params.set("line_items[0][price_data][unit_amount]", String(clinic.amount));
      params.set("line_items[0][price_data][product_data][name]", clinic.label);
      params.set("line_items[0][quantity]", "1");
      params.set("customer_email", email);
      // Metadata is passed through to the webhook to create the Cal.com booking
      params.set("metadata[eventTypeId]",        String(eventTypeId));
      params.set("metadata[startTime]",          startTime);
      params.set("metadata[attendeeName]",       name);
      params.set("metadata[attendeeEmail]",      email);
      params.set("metadata[attendeeTimeZone]",   timeZone || "Europe/London");
      params.set("metadata[duration]",           String(duration));
      // Stripe metadata values are capped at 500 chars
      if (notes)   params.set("metadata[notes]",   String(notes).slice(0, 490));
      if (fileUrl) params.set("metadata[fileUrl]", String(fileUrl).slice(0, 500));
    }

    const res     = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await res.json();
    if (session.error) return json({ error: session.error.message }, 400);

    console.log("Stripe checkout session created:", session.id);
    return json({ url: session.url });
  } catch (e: any) {
    console.error("clinic-checkout error:", e);
    return json({ error: e.message }, 500);
  }
});
