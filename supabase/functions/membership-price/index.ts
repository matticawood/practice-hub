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

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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
  return new Response(
    JSON.stringify({ currency, display: p.display, minor: p.minor, period: "month" }),
    { headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "public, max-age=300" } },
  );
});
