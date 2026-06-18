// One-time script: sync Stripe customer IDs into allowed_emails
// Run with:
//   STRIPE_SECRET_KEY=sk_live_... SUPABASE_SERVICE_ROLE_KEY=... node scripts/sync-stripe-customers.js

const STRIPE_SECRET_KEY       = process.env.STRIPE_SECRET_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL            = "https://gyskfutmncprqxazgatv.supabase.co";

if (!STRIPE_SECRET_KEY)         { console.error("Missing STRIPE_SECRET_KEY");         process.exit(1); }
if (!SUPABASE_SERVICE_ROLE_KEY) { console.error("Missing SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }

// ── Fetch all Stripe customers (handles pagination) ──────────────────────────
async function fetchAllStripeCustomers() {
  const customers = [];
  let startingAfter = null;

  while (true) {
    const params = new URLSearchParams({ limit: "100" });
    if (startingAfter) params.set("starting_after", startingAfter);

    const res = await fetch(`https://api.stripe.com/v1/customers?${params}`, {
      headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
    });
    const data = await res.json();
    if (!res.ok) { console.error("Stripe error:", data); process.exit(1); }

    customers.push(...data.data);
    if (!data.has_more) break;
    startingAfter = data.data[data.data.length - 1].id;
  }

  return customers;
}

// ── Fetch all rows from allowed_emails ──────────────────────────────────────
async function fetchAllowedEmails() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/allowed_emails?select=email,stripe_customer_id`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  const data = await res.json();
  if (!res.ok) { console.error("Supabase error:", data); process.exit(1); }
  return data;
}

// ── Update stripe_customer_id for a given email ──────────────────────────────
async function updateCustomerId(email, customerId) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/allowed_emails?email=eq.${encodeURIComponent(email)}`,
    {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ stripe_customer_id: customerId }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    console.error(`  Failed to update ${email}:`, err);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log("Fetching Stripe customers…");
  const customers = await fetchAllStripeCustomers();
  console.log(`Found ${customers.length} Stripe customers`);

  console.log("Fetching allowed_emails…");
  const rows = await fetchAllowedEmails();
  const allowedSet = new Map(rows.map(r => [r.email.toLowerCase(), r.stripe_customer_id]));
  console.log(`Found ${rows.length} allowed emails\n`);

  // Build email → most-recent customer map (some emails may have duplicates)
  const stripeByEmail = new Map();
  for (const c of customers) {
    if (!c.email) continue;
    const key = c.email.toLowerCase();
    // Keep the most recently created customer for this email
    if (!stripeByEmail.has(key) || c.created > stripeByEmail.get(key).created) {
      stripeByEmail.set(key, c);
    }
  }

  let updated = 0, skipped = 0, notFound = 0;

  for (const [email, existing] of allowedSet) {
    const customer = stripeByEmail.get(email);
    if (!customer) {
      console.log(`  No Stripe customer: ${email}`);
      notFound++;
      continue;
    }
    if (existing === customer.id) {
      skipped++;
      continue;
    }
    console.log(`  Updating ${email} → ${customer.id}`);
    await updateCustomerId(email, customer.id);
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}, Already set: ${skipped}, No Stripe match: ${notFound}`);
})();
