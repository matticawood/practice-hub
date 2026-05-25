// Stripe Customer Portal session creator — keeps secret key server-side.
// Authenticates via Supabase JWT, looks up stripe_customer_id, returns portal URL.

const SUPABASE_URL  = "https://gyskfutmncprqxazgatv.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5c2tmdXRtbmNwcnF4YXpnYXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjIwMTYsImV4cCI6MjA5MTMzODAxNn0.ttC3plmhbA7ls_T3w25XgYT0WBt6O3MMu0G6NrEKI9g";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });

export default async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: cors });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // ── Verify caller via Supabase JWT ──────────────────────────────────────
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Unauthorised" }, 401);

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON },
  });
  if (!userRes.ok) return json({ error: "Unauthorised" }, 401);
  const { email } = await userRes.json();
  if (!email) return json({ error: "Unauthorised" }, 401);

  // ── Look up Stripe customer ID ───────────────────────────────────────────
  const SERVICE_ROLE_KEY = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const dbRes = await fetch(
    `${SUPABASE_URL}/rest/v1/allowed_emails?select=stripe_customer_id&email=eq.${encodeURIComponent(email.toLowerCase())}&limit=1`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Accept: "application/json",
      },
    }
  );
  const rows = await dbRes.json();
  const customerId = rows?.[0]?.stripe_customer_id;
  if (!customerId) return json({ error: "No billing account found for this email." }, 404);

  // ── Create Stripe Customer Portal session ────────────────────────────────
  const STRIPE_SECRET_KEY = Netlify.env.get("STRIPE_SECRET_KEY");
  const returnUrl = new URL(request.url).origin + "/practice-log.html";

  const stripeRes = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ customer: customerId, return_url: returnUrl }).toString(),
  });

  const session = await stripeRes.json();
  if (!stripeRes.ok || !session.url) {
    console.error("Stripe error:", session);
    return json({ error: session.error?.message ?? "Failed to create billing session." }, 500);
  }

  return json({ url: session.url });
};
