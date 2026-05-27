import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const RETURN_URL = Deno.env.get("APP_URL") ?? "https://app.matthewcawood.com";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  // ── Authenticate the caller via their Supabase JWT ──────────────────────
  const authHeader = req.headers.get("authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) {
    return new Response(JSON.stringify({ error: "Unauthorised" }), {
      status: 401, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const { data: { user }, error: authErr } = await supabase.auth.getUser(jwt);
  if (authErr || !user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorised" }), {
      status: 401, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // ── Look up their Stripe customer ID ────────────────────────────────────
  const { data: row, error: dbErr } = await supabase
    .from("allowed_emails")
    .select("stripe_customer_id")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  if (dbErr || !row?.stripe_customer_id) {
    return new Response(
      JSON.stringify({ error: "No billing account found for this email." }),
      { status: 404, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  // ── Create a Stripe Customer Portal session ──────────────────────────────
  const params = new URLSearchParams({
    customer:   row.stripe_customer_id,
    return_url: `${RETURN_URL}/practice-log.html`,
  });

  const stripeRes = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const session = await stripeRes.json();

  if (!stripeRes.ok || !session.url) {
    console.error("Stripe portal error:", session);
    return new Response(
      JSON.stringify({ error: session.error?.message ?? "Failed to create billing session." }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ url: session.url }), {
    status: 200,
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
