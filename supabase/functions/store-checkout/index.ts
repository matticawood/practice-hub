// store-checkout — creates a Stripe Checkout Session for a paid store product
// (PDF or course), priced in the buyer's local currency. Mirrors clinic-checkout.
//   GET  ?action=prices          → { currency, symbol, prices:{ slug: majorAmount } }
//   POST { slug, pageUrl, currency? } → { url }   (Stripe-hosted checkout)
// Stripe collects the buyer's email; store-webhook then delivers the product.
import { STORE, SYMBOLS, priceIn, currencies } from "../_shared/store-catalog.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;

// Country → currency (same table as the booking engine), GBP fallback.
const COUNTRY_CURRENCY: Record<string, string> = {
  GB: "GBP", JE: "GBP", GG: "GBP", IM: "GBP",
  DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR", PT: "EUR", BE: "EUR", AT: "EUR",
  IE: "EUR", FI: "EUR", GR: "EUR", LU: "EUR", SK: "EUR", SI: "EUR", EE: "EUR", LV: "EUR",
  LT: "EUR", CY: "EUR", MT: "EUR", HR: "EUR", CH: "EUR", IS: "EUR", LI: "EUR", PL: "EUR",
  CZ: "EUR", HU: "EUR", RO: "EUR", BG: "EUR",
  US: "USD", CA: "CAD", AU: "AUD", NZ: "NZD",
  SE: "SEK", NO: "NOK", DK: "DKK", SG: "SGD",
};

async function resolveCurrency(req: Request, explicit?: string): Promise<string> {
  const valid = new Set(currencies());
  if (explicit && valid.has(explicit.toUpperCase())) return explicit.toUpperCase();
  let country = (req.headers.get("cf-ipcountry") || "").toUpperCase();
  if (!country || country === "XX") {
    try {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip");
      if (ip) {
        const geo = await fetch(`https://ipapi.co/${ip}/country/`, { headers: { "User-Agent": "store-checkout/1.0" } });
        if (geo.ok) country = (await geo.text()).trim().toUpperCase();
      }
    } catch (_) { /* fall through to GBP */ }
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

  // ── GET: localized prices for display ──
  if (req.method === "GET" || url.searchParams.get("action") === "prices") {
    const currency = await resolveCurrency(req, url.searchParams.get("currency") || undefined);
    const prices: Record<string, number> = {};
    for (const [slug, item] of Object.entries(STORE)) {
      prices[slug] = priceIn(item.price, currency) / 100; // major units (0 for free)
    }
    return json({ currency, symbol: SYMBOLS[currency], prices });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { slug, pageUrl, currency: reqCur } = await req.json();
    const item = slug ? STORE[slug] : undefined;
    if (!item)          return json({ error: "Unknown product" }, 400);
    if (item.price <= 0) return json({ error: "This product is free" }, 400);
    if (!pageUrl)       return json({ error: "Missing pageUrl" }, 400);

    const currency = await resolveCurrency(req, reqCur);
    const amount   = priceIn(item.price, currency);
    const cur      = currency.toLowerCase();

    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", `${pageUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url",  `${pageUrl}?cancelled=true`);
    params.set("line_items[0][price_data][currency]", cur);
    params.set("line_items[0][price_data][unit_amount]", String(amount));
    params.set("line_items[0][price_data][product_data][name]", item.title);
    params.set("line_items[0][quantity]", "1");
    // Collect the buyer's email at Stripe so delivery can reach them.
    params.set("customer_creation", "always");
    params.set("metadata[type]",  "store");
    params.set("metadata[slug]",  slug);
    params.set("metadata[kind]",  item.type);
    params.set("metadata[title]", item.title);

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const session = await res.json();
    if (session.error) return json({ error: session.error.message }, 400);
    console.log("store checkout session:", session.id, slug, currency);
    return json({ url: session.url });
  } catch (e: any) {
    console.error("store-checkout error:", e);
    return json({ error: e.message }, 500);
  }
});
