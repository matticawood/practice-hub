const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;

// ── Multi-currency price table (amounts in the currency's MINOR unit, e.g. pence) ──
// Hand-set round prices per market (kept at/below a fair conversion). Keys:
//   c20/c30 = clinics · l60 = 1-hour lesson · pkg3/6/12 = lesson packages.
type Prices = { c20: number; c30: number; l60: number; pkg3: number; pkg6: number; pkg12: number };
const PRICES: Record<string, Prices> = {
  GBP: { c20: 1800,  c30: 3000,  l60: 4900,  pkg3: 14000,  pkg6: 27000,  pkg12: 52000  },
  USD: { c20: 2400,  c30: 4000,  l60: 6500,  pkg3: 18500,  pkg6: 36000,  pkg12: 69500  },
  EUR: { c20: 2100,  c30: 3500,  l60: 5700,  pkg3: 16000,  pkg6: 31500,  pkg12: 60500  },
  CAD: { c20: 3400,  c30: 5600,  l60: 9000,  pkg3: 26000,  pkg6: 50500,  pkg12: 97000  },
  AUD: { c20: 3400,  c30: 5700,  l60: 9500,  pkg3: 26500,  pkg6: 51500,  pkg12: 99500  },
  NZD: { c20: 4100,  c30: 7000,  l60: 11500, pkg3: 32500,  pkg6: 62000,  pkg12: 120000 },
  SEK: { c20: 23000, c30: 38000, l60: 62500, pkg3: 178000, pkg6: 343000, pkg12: 661000 },
  NOK: { c20: 23000, c30: 38000, l60: 62000, pkg3: 177000, pkg6: 342000, pkg12: 659000 },
  DKK: { c20: 15500, c30: 26000, l60: 42500, pkg3: 121000, pkg6: 234000, pkg12: 450000 },
  SGD: { c20: 3100,  c30: 5200,  l60: 8500,  pkg3: 24000,  pkg6: 46500,  pkg12: 89500  },
};
const SYMBOLS: Record<string, string> = {
  GBP: "£", USD: "$", EUR: "€", CAD: "$", AUD: "$", NZD: "$", SEK: "kr", NOK: "kr", DKK: "kr", SGD: "$",
};
const LABELS: Record<string, string> = {
  c20: "20 Min Piano Clinic with Matthew Cawood",
  c30: "30 Min Piano Clinic with Matthew Cawood",
  l60: "1 Hour Online Piano Lesson with Matthew Cawood",
  pkg3: "3 × 1-Hour Online Piano Lessons with Matthew Cawood",
  pkg6: "6 × 1-Hour Online Piano Lessons with Matthew Cawood",
  pkg12: "12 × 1-Hour Online Piano Lessons with Matthew Cawood",
};
const DURATION_KEY: Record<string, keyof Prices> = { "20": "c20", "30": "c30", "60": "l60" };

// Country → currency (reused verbatim from membership-redirect), GBP fallback.
const COUNTRY_CURRENCY: Record<string, string> = {
  GB: "GBP", JE: "GBP", GG: "GBP", IM: "GBP",
  DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR",
  PT: "EUR", BE: "EUR", AT: "EUR", IE: "EUR", FI: "EUR",
  GR: "EUR", LU: "EUR", SK: "EUR", SI: "EUR", EE: "EUR",
  LV: "EUR", LT: "EUR", CY: "EUR", MT: "EUR", HR: "EUR",
  CH: "EUR", IS: "EUR", LI: "EUR", PL: "EUR",
  CZ: "EUR", HU: "EUR", RO: "EUR", BG: "EUR",
  US: "USD", CA: "CAD", AU: "AUD", NZ: "NZD",
  SE: "SEK", NO: "NOK", DK: "DKK", SG: "SGD",
};

async function resolveCurrency(req: Request, explicit?: string): Promise<string> {
  if (explicit && PRICES[explicit.toUpperCase()]) return explicit.toUpperCase();
  // 1. Cloudflare header (often present, but can be empty on edge functions)
  let country = (req.headers.get("cf-ipcountry") || "").toUpperCase();
  // 2. Fallback: IP geolocation (mirrors membership-redirect) when the header is empty
  if (!country || country === "XX") {
    try {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip");
      if (ip) {
        const geo = await fetch(`https://ipapi.co/${ip}/country/`, { headers: { "User-Agent": "practicehub-lessons/1.0" } });
        if (geo.ok) country = (await geo.text()).trim().toUpperCase();
      }
    } catch (_) { /* ignore — fall through to GBP */ }
  }
  return (country && COUNTRY_CURRENCY[country]) ? COUNTRY_CURRENCY[country] : "GBP";
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = new URL(req.url);

  // ── GET: return the buyer's currency + local prices (major units) for display ──
  if (req.method === "GET" || url.searchParams.get("action") === "prices") {
    const currency = await resolveCurrency(req, url.searchParams.get("currency") || undefined);
    const p = PRICES[currency];
    const major = Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v / 100]));
    return json({ currency, symbol: SYMBOLS[currency], prices: major });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const { eventTypeId, startTime, duration, name, email, timeZone, pageUrl, notes, fileUrl, pkg, currency: reqCur, vid } = body;
    const currency = await resolveCurrency(req, reqCur);
    const table = PRICES[currency];
    const cur = currency.toLowerCase();

    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", `${pageUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", `${pageUrl}?cancelled=true`);
    if (vid) params.set("client_reference_id", String(vid).slice(0, 200));

    if (pkg) {
      // ── Package purchase: grant credits, no slot chosen now ──
      const key = `pkg${pkg}` as keyof Prices;
      const amount = table[key];
      if (!amount)        return json({ error: "Invalid package" }, 400);
      if (!name?.trim())  return json({ error: "Missing name" }, 400);
      if (!email?.trim()) return json({ error: "Missing email" }, 400);
      params.set("line_items[0][price_data][currency]", cur);
      params.set("line_items[0][price_data][unit_amount]", String(amount));
      params.set("line_items[0][price_data][product_data][name]", LABELS[key]);
      params.set("line_items[0][quantity]", "1");
      params.set("customer_email", email);
      params.set("metadata[type]",          "package");
      params.set("metadata[qty]",           String(pkg));
      params.set("metadata[attendeeName]",  name);
      params.set("metadata[attendeeEmail]", email);
    } else {
      // ── Single booking (clinic / 1-hour lesson) ──
      const key = DURATION_KEY[String(duration)];
      const amount = key ? table[key] : 0;
      if (!key || !amount) return json({ error: "Invalid duration" }, 400);
      if (!eventTypeId)    return json({ error: "Missing eventTypeId" }, 400);
      if (!startTime)      return json({ error: "Missing startTime" }, 400);
      if (!name?.trim())   return json({ error: "Missing name" }, 400);
      if (!email?.trim())  return json({ error: "Missing email" }, 400);
      params.set("line_items[0][price_data][currency]", cur);
      params.set("line_items[0][price_data][unit_amount]", String(amount));
      params.set("line_items[0][price_data][product_data][name]", LABELS[key]);
      params.set("line_items[0][quantity]", "1");
      params.set("customer_email", email);
      params.set("metadata[eventTypeId]",        String(eventTypeId));
      params.set("metadata[startTime]",          startTime);
      params.set("metadata[attendeeName]",       name);
      params.set("metadata[attendeeEmail]",      email);
      params.set("metadata[attendeeTimeZone]",   timeZone || "Europe/London");
      params.set("metadata[duration]",           String(duration));
      if (notes)   params.set("metadata[notes]",   String(notes).slice(0, 490));
      if (fileUrl) params.set("metadata[fileUrl]", String(fileUrl).slice(0, 500));
    }

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const session = await res.json();
    if (session.error) return json({ error: session.error.message }, 400);
    console.log("Stripe checkout session created:", session.id, currency);
    return json({ url: session.url });
  } catch (e: any) {
    console.error("clinic-checkout error:", e);
    return json({ error: e.message }, 500);
  }
});
