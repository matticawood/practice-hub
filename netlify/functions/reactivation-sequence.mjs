// Evergreen reactivation: a one-time win-back to members who go 14+ days silent
// — but only those who drift FROM NOW ON, never the launch backlog (they get the
// one-time Relaunch email instead).
//
// The gate: a member is eligible only if their last activity was AFTER
// REACTIVATION_FLOOR (= activation date − 14 days). Anyone already 14+ days
// silent at activation has older last-activity and is excluded; everyone who
// goes quiet later is caught when they cross 14 days. One email per member ever
// (email_log dedup).
//
// SAFETY: a scheduled (unauthenticated) run only sends when REACTIVATION_LIVE
// === 'true'. Owner can ?mode=preview (no send) or ?mode=run any time.
//
// Env: SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, REMINDER_FROM, SITE_URL,
//      REACTIVATION_LIVE

import { EMAIL_DEFAULTS, renderEmailHTML, renderSubject, contentForCampaign } from "../../email-templates.mjs";

export const config = { schedule: "0 10 * * *" };  // once a day (prod only)

const SUPABASE_URL  = "https://gyskfutmncprqxazgatv.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5c2tmdXRtbmNwcnF4YXpnYXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjIwMTYsImV4cCI6MjA5MTMzODAxNn0.ttC3plmhbA7ls_T3w25XgYT0WBt6O3MMu0G6NrEKI9g";
const OWNER_EMAIL   = "matthew@matthewcawood.com";

// Activation date − 14 days. Members active on/before this were already silent
// 14+ days at activation (the Relaunch cohort) → excluded from reactivation.
const REACTIVATION_FLOOR = "2026-05-27";
const SILENT_DAYS = 14;

const EXCLUDED = new Set([
  "matthew@matthewcawood.com", "mcawoodcanada@gmail.com",
  "reviewer@matthewcawood.com", "enquiries@matthewcawood.com",
  "system@thepracticeroom.app",
]);

const json = (s, o) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } });
const firstName = (name) => { const r = String(name || "").trim().split(/\s+/)[0]; return r ? r.charAt(0).toUpperCase() + r.slice(1) : "there"; };

export default async (req) => {
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const RESEND  = process.env.RESEND_API_KEY;
  const FROM    = process.env.REMINDER_FROM || "The Practice Room <noreply@matthewcawood.com>";
  const SITE    = (process.env.SITE_URL || "https://app.matthewcawood.com").replace(/\/$/, "");
  if (!SERVICE || !RESEND) return json(500, { error: "missing env (SERVICE/RESEND)" });

  const url = new URL(req.url);
  const auth = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  let mode;
  if (auth) {
    const uRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { Authorization: `Bearer ${auth}`, apikey: SUPABASE_ANON } });
    if (!uRes.ok) return json(401, { error: "Unauthorised" });
    const { email } = await uRes.json();
    if (!email || email.toLowerCase() !== OWNER_EMAIL) return json(403, { error: "Forbidden" });
    mode = url.searchParams.get("mode") === "run" ? "run" : "preview";
  } else {
    mode = process.env.REACTIVATION_LIVE === "true" ? "run" : "noop";
  }

  const sb = (path, opts = {}) => fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...opts, headers: {
    apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json", ...(opts.headers || {}) } });

  // Dormant cohort (silent > 14d), gated to recent-then-silent members only.
  const dRes = await sb(`rpc/dormant_members`, { method: "POST", body: JSON.stringify({ days: SILENT_DAYS }) });
  if (!dRes.ok) return json(502, { error: "dormant lookup failed", detail: await dRes.text() });
  const dormant = (await dRes.json()).filter((r) => r.last_active_date && r.last_active_date > REACTIVATION_FLOOR);

  if (mode === "noop") return json(200, { mode, note: "Dormant — set REACTIVATION_LIVE=true to enable sending." });

  // Already-sent reactivation (one per member ever).
  const lRes = await sb(`email_log?select=email&campaign=eq.reactivation&status=eq.sent`);
  const sent = new Set(lRes.ok ? (await lRes.json()).map((r) => (r.email || "").toLowerCase()) : []);

  // Member rows (name, token, opt-out) for the eligible emails.
  const emails = dormant.map((d) => (d.member_email || "").toLowerCase()).filter((e) => !EXCLUDED.has(e) && !sent.has(e));
  let members = [];
  if (emails.length) {
    const inList = emails.map((e) => `"${e.replace(/"/g, "")}"`).join(",");
    const r = await sb(`allowed_emails?select=email,name,unsubscribe_token,email_opt_out&email=in.(${inList})`);
    if (r.ok) members = await r.json();
  }
  const eligible = members.filter((m) => !m.email_opt_out);

  if (mode === "preview") {
    return json(200, {
      mode, liveEnabled: process.env.REACTIVATION_LIVE === "true", floor: REACTIVATION_FLOOR,
      dormantTotal: dormant.length, due: eligible.length,
      sample: eligible.slice(0, 20).map((m) => ({ email: m.email, greeting: `Hi ${firstName(m.name)},` })),
      note: "Preview only — nothing sent.",
    });
  }

  // RUN
  if (!eligible.length) return json(200, { mode, sent: 0, note: "no eligible recipients" });
  const content = contentForCampaign("reactivation", (await (await sb(`email_templates?campaign=eq.reactivation&select=*`)).json())[0] || null);
  let sentCount = 0;
  for (let i = 0; i < eligible.length; i += 100) {
    const chunk = eligible.slice(i, i + 100);
    const batch = chunk.map((m) => {
      const fn = firstName(m.name);
      const unsub = `${SITE}/.netlify/functions/email-unsubscribe?t=${m.unsubscribe_token}&c=reactivation`;
      return { from: FROM, to: [m.email], subject: renderSubject(content, fn),
        headers: { "List-Unsubscribe": `<${unsub}>` },
        html: renderEmailHTML(content, { firstName: fn, site: SITE, unsub }) };
    });
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST", headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" }, body: JSON.stringify(batch) });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) {
      await sb(`email_log`, { method: "POST", headers: { Prefer: "return=minimal" },
        body: JSON.stringify(chunk.map((m) => ({ email: m.email, campaign: "reactivation", status: "failed",
          error: (out?.message || "resend error").slice(0, 500) }))) }).catch(() => {});
      continue;
    }
    const ids = Array.isArray(out.data) ? out.data : [];
    await sb(`email_log`, { method: "POST", headers: { Prefer: "return=minimal" },
      body: JSON.stringify(chunk.map((m, j) => ({ email: m.email, campaign: "reactivation", status: "sent", resend_id: ids[j]?.id || null }))) }).catch(() => {});
    sentCount += chunk.length;
  }
  return json(200, { mode, sent: sentCount });
};
