// Stripe Customer Portal session creator
// Accessible at /.netlify/functions/billing-portal

const SUPABASE_URL  = "https://gyskfutmncprqxazgatv.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5c2tmdXRtbmNwcnF4YXpnYXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjIwMTYsImV4cCI6MjA5MTMzODAxNn0.ttC3plmhbA7ls_T3w25XgYT0WBt6O3MMu0G6NrEKI9g";
const OWNER_EMAIL   = "matthew@matthewcawood.com";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  // ── Verify caller via Supabase JWT ──────────────────────────────────────
  const token = (event.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorised" }) };

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON },
  });
  if (!userRes.ok) return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorised" }) };
  const { email: callerEmail } = await userRes.json();
  if (!callerEmail) return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorised" }) };

  // ── Resolve which email to look up billing for ───────────────────────────
  let email = callerEmail;
  if (callerEmail.toLowerCase() === OWNER_EMAIL.toLowerCase() && event.body) {
    try {
      const body = JSON.parse(event.body);
      if (body.targetEmail) email = body.targetEmail;
    } catch (_) { /* ignore malformed body */ }
  }

  // ── Look up Stripe customer ID ───────────────────────────────────────────
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dbRes = await fetch(
    `${SUPABASE_URL}/rest/v1/allowed_emails?select=stripe_customer_id&email=eq.${encodeURIComponent(email.toLowerCase())}&limit=1`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  const rows = await dbRes.json();
  const customerId = rows?.[0]?.stripe_customer_id;
  if (!customerId) {
    return { statusCode: 404, headers, body: JSON.stringify({ error: "No billing account found for this email." }) };
  }

  // ── Create Stripe Customer Portal session ────────────────────────────────
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "STRIPE_SECRET_KEY not set in environment" }) };
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "SUPABASE_SERVICE_ROLE_KEY not set in environment" }) };
  }
  const returnUrl = event.headers.referer
    ? new URL("/practice-log.html", event.headers.referer).href
    : "https://thepracticeroom.matthewcawood.com/practice-log.html";

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
    return { statusCode: 500, headers, body: JSON.stringify({ error: session.error?.message ?? "Failed to create billing session." }) };
  }

  return { statusCode: 200, headers, body: JSON.stringify({ url: session.url }) };
};
