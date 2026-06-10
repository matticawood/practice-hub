// Owner-only: everyone who is, or has ever been, a paying member (any Stripe
// subscription status, including cancelled). Reusable audience-hygiene tool.
//
//   GET                       → { count, emails: [...] }
//   POST { emails: [...] }     → { count, checked, overlap: [...] }  (just the matches)
//
// Use the POST form to check a marketing list against ever-members without
// pulling the whole history to the client.

import { everSubscriberEmails } from "../../stripe-history.mjs";

const SUPABASE_URL  = "https://gyskfutmncprqxazgatv.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5c2tmdXRtbmNwcnF4YXpnYXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjIwMTYsImV4cCI6MjA5MTMzODAxNn0.ttC3plmhbA7ls_T3w25XgYT0WBt6O3MMu0G6NrEKI9g";
const OWNER_EMAIL   = "matthew@matthewcawood.com";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Content-Type": "application/json",
};
const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: CORS });

export default async (req) => {
  if (req.method === "OPTIONS") return new Response("", { status: 200, headers: CORS });

  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return json(401, { error: "Unauthorised" });
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON },
  });
  if (!userRes.ok) return json(401, { error: "Unauthorised" });
  const { email: caller } = await userRes.json();
  if (!caller || caller.toLowerCase() !== OWNER_EMAIL) return json(403, { error: "Forbidden" });

  const STRIPE = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE) return json(500, { error: "STRIPE_SECRET_KEY not set" });

  let emails;
  try { emails = await everSubscriberEmails(STRIPE); }
  catch (e) { return json(502, { error: String(e.message || e) }); }

  if (req.method === "POST") {
    let check = [];
    try { const b = await req.json(); if (Array.isArray(b.emails)) check = b.emails.map((x) => String(x || "").trim().toLowerCase()).filter(Boolean); } catch { /* */ }
    const overlap = [...new Set(check)].filter((e) => emails.has(e));
    return json(200, { count: emails.size, checked: check.length, overlap });
  }

  return json(200, { count: emails.size, emails: [...emails] });
};
