// membership-checkout-url — returns the membership Stripe Payment Link for the
// visitor's currency (Netlify geo), with the visitor id threaded as
// client_reference_id. SAME-ORIGIN with /signup so the iOS app webview can fetch
// it (cross-origin Supabase fetches get blocked in the app). The page then
// window.open()s the returned URL into the Safari sheet — exactly how the
// billing portal works in-app.

const COUNTRY_CURRENCY = {
  GB: "GBP", JE: "GBP", GG: "GBP", IM: "GBP",
  DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR", PT: "EUR", BE: "EUR",
  AT: "EUR", IE: "EUR", FI: "EUR", GR: "EUR", LU: "EUR", SK: "EUR", SI: "EUR",
  EE: "EUR", LV: "EUR", LT: "EUR", CY: "EUR", MT: "EUR", HR: "EUR",
  CH: "EUR", IS: "EUR", LI: "EUR", PL: "EUR", CZ: "EUR", HU: "EUR", RO: "EUR", BG: "EUR",
  US: "USD", CA: "CAD", AU: "AUD", NZ: "NZD", SE: "SEK", NO: "NOK", DK: "DKK", SG: "SGD",
};

const LINKS = {
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

function geoCountry(evt) {
  try {
    const raw = evt.headers["x-nf-geo"] || evt.headers["X-Nf-Geo"];
    if (raw) {
      const geo = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
      const c = geo && geo.country && geo.country.code;
      if (c) return String(c).slice(0, 2).toUpperCase();
    }
  } catch (_) { /* ignore */ }
  const xc = evt.headers["x-country"] || evt.headers["X-Country"];
  return xc ? String(xc).slice(0, 2).toUpperCase() : null;
}

exports.handler = async (event) => {
  const country = geoCountry(event);
  const currency = (country && COUNTRY_CURRENCY[country]) ? COUNTRY_CURRENCY[country] : "GBP";
  let url = LINKS[currency] || LINKS["GBP"];

  const vidRaw = (event.queryStringParameters && event.queryStringParameters.vid) || "";
  const vid = String(vidRaw).replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64);
  if (vid) url += (url.includes("?") ? "&" : "?") + "client_reference_id=" + encodeURIComponent(vid);

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify({ url, currency }),
  };
};
