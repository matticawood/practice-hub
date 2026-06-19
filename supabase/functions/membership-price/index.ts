// membership-price — read-only. Returns the membership price in the visitor's
// local currency (by IP geo), so the /signup page can show "$17.99" to a US
// visitor instead of a £ headline. Display only; it never creates a checkout or
// touches membership-redirect. Mirrors membership-redirect's geo + currency map.

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

// Current/active membership prices (minor units) + display string, pulled from
// Stripe. Keep in sync with the Payment Links in membership-redirect.
const PRICES: Record<string, { minor: number; display: string }> = {
  GBP: { minor: 1299,  display: "£12.99" },
  USD: { minor: 1799,  display: "$17.99" },
  EUR: { minor: 1499,  display: "€14.99" },
  CAD: { minor: 2399,  display: "CA$23.99" },
  AUD: { minor: 2499,  display: "A$24.99" },
  SEK: { minor: 16900, display: "169 kr" },
  NOK: { minor: 17900, display: "179 kr" },
  DKK: { minor: 11400, display: "114 kr" },
  SGD: { minor: 2299,  display: "S$22.99" },
  NZD: { minor: 2999,  display: "NZ$29.99" },
};

// Annual = monthly x10 ("2 months free"). `equiv` is the annual price / 12, the
// per-month figure we show under the annual option. Hardcoded so the currency
// formatting matches PRICES exactly (no fragile client-side number formatting).
const ANNUAL: Record<string, { display: string; equiv: string }> = {
  GBP: { display: "£129.90",  equiv: "£10.83" },
  USD: { display: "$179.90",  equiv: "$14.99" },
  EUR: { display: "€149.90",  equiv: "€12.49" },
  CAD: { display: "CA$239.90", equiv: "CA$19.99" },
  AUD: { display: "A$249.90", equiv: "A$20.83" },
  SEK: { display: "1690 kr",  equiv: "141 kr" },
  NOK: { display: "1790 kr",  equiv: "149 kr" },
  DKK: { display: "1140 kr",  equiv: "95 kr" },
  SGD: { display: "S$229.90", equiv: "S$19.16" },
  NZD: { display: "NZ$299.90", equiv: "NZ$24.99" },
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// Stripe Payment Links per currency (must match membership-redirect). Used to
// return a DIRECT checkout URL so the app can window.open() it into Safari
// (mirroring the billing portal flow), instead of relying on a same-origin
// link that the app webview traps.
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  let country: string | null = req.headers.get("cf-ipcountry");
  if (!country || country === "XX") {
    try {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip");
      if (ip) {
        const geo = await fetch(`https://ipapi.co/${ip}/country/`, { headers: { "User-Agent": "practicehub-price/1.0" } });
        if (geo.ok) country = (await geo.text()).trim();
      }
    } catch (_) { /* fall back to GBP */ }
  }

  const currency = (country && COUNTRY_CURRENCY[country]) ? COUNTRY_CURRENCY[country] : "GBP";
  const p = PRICES[currency] || PRICES["GBP"];

  // Direct checkout URL (Payment Link) for this currency, with the visitor id
  // threaded as client_reference_id for /signup attribution.
  const vidRaw = new URL(req.url).searchParams.get("vid");
  const vid = vidRaw ? vidRaw.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64) : "";
  let checkoutUrl = LINKS[currency] || LINKS["GBP"];
  if (vid) checkoutUrl += (checkoutUrl.includes("?") ? "&" : "?") + "client_reference_id=" + encodeURIComponent(vid);

  const a = ANNUAL[currency] || ANNUAL["GBP"];

  return new Response(
    JSON.stringify({
      currency, display: p.display, minor: p.minor, period: "month", checkoutUrl,
      annualDisplay: a.display, annualEquivDisplay: a.equiv, annualSaving: "2 months free",
    }),
    { headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } },
  );
});
