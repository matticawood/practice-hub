// Owner-only: returns the emails (and Stripe customer ids) of members with a
// CURRENTLY-ACTIVE subscription, so the admin analytics page can treat only real
// subscribers as members and flag the rest as churned.
// Accessible at /.netlify/functions/active-subscribers (GET).

const SUPABASE_URL  = "https://gyskfutmncprqxazgatv.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5c2tmdXRtbmNwcnF4YXpnYXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjIwMTYsImV4cCI6MjA5MTMzODAxNn0.ttC3plmhbA7ls_T3w25XgYT0WBt6O3MMu0G6NrEKI9g";
const OWNER_EMAIL   = "matthew@matthewcawood.com";

// Stripe statuses that mean "currently has access".
const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

  // ── Owner-only: verify caller via Supabase JWT ──
  const token = (event.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorised" }) };
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON },
  });
  if (!userRes.ok) return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorised" }) };
  const { email: callerEmail } = await userRes.json();
  if (!callerEmail || callerEmail.toLowerCase() !== OWNER_EMAIL.toLowerCase()) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: "Forbidden" }) };
  }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "STRIPE_SECRET_KEY not set" }) };
  }

  // ── Page through subscriptions, collect active subscribers ──
  const emails = new Set(), customerIds = new Set();
  let startingAfter = null, guard = 0;
  try {
    do {
      const qs = new URLSearchParams({ limit: "100", "expand[]": "data.customer" });
      if (startingAfter) qs.set("starting_after", startingAfter);
      const res = await fetch(`https://api.stripe.com/v1/subscriptions?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
      });
      const page = await res.json();
      if (!res.ok) {
        console.error("Stripe error:", page);
        return { statusCode: 502, headers, body: JSON.stringify({ error: page.error?.message || "Stripe error" }) };
      }
      for (const sub of (page.data || [])) {
        if (!ACTIVE_STATUSES.has(sub.status)) continue;
        const cust = sub.customer; // expanded object (or id string if not expanded)
        if (cust && typeof cust === "object") {
          if (cust.email) emails.add(cust.email.toLowerCase());
          if (cust.id) customerIds.add(cust.id);
        } else if (typeof cust === "string") {
          customerIds.add(cust);
        }
      }
      startingAfter = (page.has_more && page.data.length) ? page.data[page.data.length - 1].id : null;
    } while (startingAfter && ++guard < 50);
  } catch (e) {
    console.error("active-subscribers failed:", e);
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(e.message || e) }) };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ emails: [...emails], customerIds: [...customerIds], count: emails.size }),
  };
};
