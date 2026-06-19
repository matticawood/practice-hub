// ── Payment links per currency (monthly) ───────────────────────────────────
const LINKS: Record<string, string> = {
  GBP: "https://buy.stripe.com/28EeV61nA9Z0fxJaAB5EY00",
  USD: "https://buy.stripe.com/eVq8wI4zMefg85haAB5EY01",
  CAD: "https://buy.stripe.com/bJe4gseam8UWbht8st5EY02",
  EUR: "https://buy.stripe.com/bJe28k0jw7QSbhtcIJ5EY03",
  AUD: "https://buy.stripe.com/28E5kw6HU0oqadpaAB5EY04",
  SEK: "https://buy.stripe.com/14A5kw7LY7QSfxJ2455EY05",
  NOK: "https://buy.stripe.com/9B65kw3vIc78bhtaAB5EY06",
  DKK: "https://buy.stripe.com/28E28keam7QS5X91015EY07",
  SGD: "https://buy.stripe.com/6oU8wIgiub341GT8st5EY09",
  NZD: "https://buy.stripe.com/00w00c0jw9Z099laAB5EY0a",
};

// ── Payment links per currency (annual = monthly x10, "2 months free") ──────
const LINKS_ANNUAL: Record<string, string> = {
  GBP: "https://buy.stripe.com/aFa7sEeam7QS71d3895EY0b",
  USD: "https://buy.stripe.com/14AcMYc2e6MOadp2455EY0c",
  CAD: "https://buy.stripe.com/3cI14g4zMgno99lcIJ5EY0d",
  EUR: "https://buy.stripe.com/fZuaEQd6ignoadp4cd5EY0e",
  AUD: "https://buy.stripe.com/7sY6oA8Q21suetF8st5EY0f",
  SEK: "https://buy.stripe.com/eVq9AM5DQb343P12455EY0g",
  NOK: "https://buy.stripe.com/28EfZa4zMfjk99lfUV5EY0h",
  DKK: "https://buy.stripe.com/cNi9AMc2e3ACetFeQR5EY0i",
  SGD: "https://buy.stripe.com/14A28keam6MObhtcIJ5EY0j",
  NZD: "https://buy.stripe.com/8x2eV68Q28UW85hdMN5EY0k",
};

// ── Country → currency ─────────────────────────────────────────────────────
const COUNTRY_CURRENCY: Record<string, string> = {
  // GBP
  GB: "GBP", JE: "GBP", GG: "GBP", IM: "GBP",
  // EUR — Eurozone
  DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR",
  PT: "EUR", BE: "EUR", AT: "EUR", IE: "EUR", FI: "EUR",
  GR: "EUR", LU: "EUR", SK: "EUR", SI: "EUR", EE: "EUR",
  LV: "EUR", LT: "EUR", CY: "EUR", MT: "EUR", HR: "EUR",
  // EUR — non-Eurozone European countries (best available option)
  CH: "EUR", IS: "EUR", LI: "EUR", PL: "EUR",
  CZ: "EUR", HU: "EUR", RO: "EUR", BG: "EUR",
  // USD
  US: "USD",
  // CAD
  CA: "CAD",
  // AUD
  AU: "AUD",
  // NZD
  NZ: "NZD",
  // SEK
  SE: "SEK",
  // NOK
  NO: "NOK",
  // DKK
  DK: "DKK",
  // SGD
  SG: "SGD",
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  let country: string | null = null;

  // 1. Cloudflare provides this header automatically on Supabase Edge Functions
  country = req.headers.get("cf-ipcountry");

  // 2. Fallback: look up the IP via a free geolocation API
  if (!country || country === "XX") {
    try {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        req.headers.get("x-real-ip");

      if (ip) {
        const geo = await fetch(`https://ipapi.co/${ip}/country/`, {
          headers: { "User-Agent": "practicehub-redirect/1.0" },
        });
        if (geo.ok) country = (await geo.text()).trim();
      }
    } catch (e) {
      console.warn("IP geolocation failed:", e);
    }
  }

  const currency = (country && COUNTRY_CURRENCY[country]) ? COUNTRY_CURRENCY[country] : "GBP";

  // plan=annual routes to the yearly link; anything else (incl. absent) stays monthly.
  const plan = new URL(req.url).searchParams.get("plan") === "annual" ? "annual" : "monthly";
  const table = plan === "annual" ? LINKS_ANNUAL : LINKS;
  let url = table[currency] ?? table["GBP"];

  // Thread the landing-page visitor id through to Stripe. Payment Links accept a
  // client_reference_id query param, which surfaces in the checkout.session.completed
  // webhook so we can attribute the conversion back to the exact /signup visit.
  const vidRaw = new URL(req.url).searchParams.get("vid");
  const vid = vidRaw ? vidRaw.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64) : "";
  if (vid) url += (url.includes("?") ? "&" : "?") + "client_reference_id=" + encodeURIComponent(vid);

  console.log(`country=${country} → currency=${currency} plan=${plan}${vid ? ` vid=${vid}` : ""}`);

  return new Response(null, {
    status: 302,
    headers: {
      ...cors,
      "Location": url,
    },
  });
});
