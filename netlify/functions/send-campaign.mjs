// Owner-only campaign sender (Resend). Powers the Automations panel + Email Studio.
//
// One thin, safe sender for every automated email. Before sending anything it
// RE-CHECKS server-side that each recipient is allowed, not opted out, and not
// already sent this campaign (email_log + a DB-level unique index makes a
// double-send physically impossible). It renders via the SHARED template module
// (so the email is identical to the Studio preview), then logs every outcome.
//
// TWO audience types (declared per campaign via CAMPAIGN_META[campaign].list):
//   • Member campaigns (relaunch, reactivation, welcome_*) → recipients come from
//     the panel's explicit list, validated against allowed_emails + email_opt_out,
//     footer + unsubscribe scoped to members.
//   • List campaigns (waitlist, future lists like Monday Music Tips) → recipients
//     come from email_list_subscriptions for that list (NOT members), validated
//     against per-list opt-out + global opt-out, with a list-specific footer and
//     the shared list-unsubscribe link (per-list).
//
// POST body: { campaign, recipients?: ["a@b.com", ...], mode }
//   mode 'preview' → no send; returns exactly who WOULD receive it (after filters)
//   mode 'test'    → sends ONLY to the owner (logged 'test')
//   mode 'live'    → sends to the eligible recipients; logs 'sent' / 'failed'

import { EMAIL_DEFAULTS, CAMPAIGN_META, renderEmailHTML, renderSubject, contentForCampaign } from "../../email-templates.mjs";
import { everSubscriberEmails } from "../../stripe-history.mjs";

const SUPABASE_URL  = "https://gyskfutmncprqxazgatv.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5c2tmdXRtbmNwcnF4YXpnYXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjIwMTYsImV4cCI6MjA5MTMzODAxNn0.ttC3plmhbA7ls_T3w25XgYT0WBt6O3MMu0G6NrEKI9g";
const OWNER_EMAIL   = "matthew@matthewcawood.com";

const EXCLUDED = new Set([
  "matthew@matthewcawood.com",
  "mcawoodcanada@gmail.com",
  "reviewer@matthewcawood.com",
  "enquiries@matthewcawood.com",
  "system@thepracticeroom.app",
]);

const MEMBER_FOOTER = "You're getting this because you're a member of The Practice Room.";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Content-Type": "application/json",
};
const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: CORS });
const firstName = (name) => {
  const raw = String(name || "").trim().split(/\s+/)[0];
  if (!raw) return "there";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};

export default async (req) => {
  if (req.method === "OPTIONS") return new Response("", { status: 200, headers: CORS });
  if (req.method !== "POST") return json(405, { error: "POST only" });

  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const RESEND  = process.env.RESEND_API_KEY;
  const FROM    = process.env.REMINDER_FROM || "The Practice Room <noreply@matthewcawood.com>";
  const SITE    = (process.env.SITE_URL || "https://app.matthewcawood.com").replace(/\/$/, "");
  if (!SERVICE || !RESEND) return json(500, { error: "missing env (SERVICE/RESEND)" });

  // ── Owner-only ───────────────────────────────────────────────────────────
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return json(401, { error: "Unauthorised" });
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON },
  });
  if (!userRes.ok) return json(401, { error: "Unauthorised" });
  const { email: caller } = await userRes.json();
  if (!caller || caller.toLowerCase() !== OWNER_EMAIL) return json(403, { error: "Forbidden" });

  // ── Inputs ───────────────────────────────────────────────────────────────
  let body = {};
  try { body = await req.json(); } catch { /* empty */ }
  const campaign = String(body.campaign || "");
  const mode = ["preview", "test", "live"].includes(body.mode) ? body.mode : "preview";
  const requested = Array.isArray(body.recipients)
    ? [...new Set(body.recipients.map((e) => String(e || "").trim().toLowerCase()).filter(Boolean))]
    : [];

  if (!EMAIL_DEFAULTS[campaign]) return json(400, { error: `unknown campaign '${campaign}'` });
  // A campaign either targets the Members audience (allowed_emails) or a contact
  // LIST (email_lists), declared via CAMPAIGN_META[campaign].list.
  const listSlug = CAMPAIGN_META[campaign]?.list || null;
  const isList = !!listSlug;

  const sb = (path, opts = {}) =>
    fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...opts,
      headers: {
        apikey: SERVICE, Authorization: `Bearer ${SERVICE}`,
        "Content-Type": "application/json", ...(opts.headers || {}),
      },
    });

  // Editable copy: DB override (Studio) merged over defaults.
  let dbRow = null;
  const tRes = await sb(`email_templates?campaign=eq.${encodeURIComponent(campaign)}&select=*`);
  if (tRes.ok) dbRow = (await tRes.json())[0] || null;
  const content = contentForCampaign(campaign, dbRow);

  // Audience-specific footer + unsubscribe routing. For a list, name it from
  // email_lists so the footer reads "...signed up to <List Name>".
  let footerReason = MEMBER_FOOTER;
  let unsubText = "Unsubscribe from emails";
  let unsubBase = `${SITE}/.netlify/functions/email-unsubscribe?t=`;
  if (isList) {
    const nRes = await sb(`email_lists?slug=eq.${encodeURIComponent(listSlug)}&select=name`);
    const listName = (nRes.ok ? (await nRes.json())[0]?.name : null) || "this list";
    footerReason = `You're getting this because you signed up to ${listName}.`;
    unsubText = `Unsubscribe from ${listName}`;
    unsubBase = `${SITE}/.netlify/functions/list-unsubscribe?l=${encodeURIComponent(listSlug)}&t=`;
  }

  // Already-sent (successful) for this campaign → skip.
  const alreadySent = new Set();
  const lr = await sb(`email_log?select=email&campaign=eq.${encodeURIComponent(campaign)}&status=eq.sent`);
  if (lr.ok) for (const row of await lr.json()) alreadySent.add((row.email || "").toLowerCase());

  // ── Resolve recipients ─────────────────────────────────────────────────────
  const eligible = [], skipped = [];

  if (isList) {
    // Whole list, minus per-list opt-outs, global opt-outs, and already-sent.
    // Ignores `requested`. Embeds the contact for name + unsubscribe token.
    const r = await sb(`email_list_subscriptions?list_slug=eq.${encodeURIComponent(listSlug)}&select=email,opted_out,email_contacts(name,unsubscribe_token,global_opt_out)`);
    if (!r.ok) return json(502, { error: "list lookup failed", detail: await r.text() });
    for (const s of await r.json()) {
      const e = (s.email || "").toLowerCase();
      const c = s.email_contacts || {};
      if (!e) continue;
      if (EXCLUDED.has(e)) { skipped.push({ email: e, reason: "excluded account" }); continue; }
      if (s.opted_out || c.global_opt_out) { skipped.push({ email: e, reason: "unsubscribed" }); continue; }
      if (alreadySent.has(e)) { skipped.push({ email: e, reason: "already sent" }); continue; }
      eligible.push({ email: s.email, name: c.name, unsubscribe_token: c.unsubscribe_token });
    }
  } else {
    // Member campaigns: validate the panel's explicit list against the roster.
    const wanted = requested.filter((e) => !EXCLUDED.has(e));
    let members = [];
    if (wanted.length) {
      const inList = wanted.map((e) => `"${e.replace(/"/g, "")}"`).join(",");
      let r = await sb(`allowed_emails?select=email,name,unsubscribe_token,email_opt_out&email=in.(${inList})`);
      if (!r.ok) {
        r = await sb(`allowed_emails?select=email,name,unsubscribe_token&email=in.(${inList})`);
        if (!r.ok) return json(502, { error: "member lookup failed", detail: await r.text() });
      }
      members = await r.json();
    }
    const byEmail = {};
    for (const m of members) byEmail[(m.email || "").toLowerCase()] = m;
    for (const e of requested) {
      if (EXCLUDED.has(e)) { skipped.push({ email: e, reason: "excluded account" }); continue; }
      const m = byEmail[e];
      if (!m) { skipped.push({ email: e, reason: "not a current member" }); continue; }
      if (m.email_opt_out) { skipped.push({ email: e, reason: "unsubscribed" }); continue; }
      if (alreadySent.has(e)) { skipped.push({ email: e, reason: "already sent" }); continue; }
      eligible.push({ email: m.email, name: m.name, unsubscribe_token: m.unsubscribe_token });
    }
  }

  // ── Exclude anyone who is or was a member (list campaigns that opt in) ──────
  // e.g. the waitlist: a "come and join" email shouldn't reach current or former
  // members. Checks both the live roster (allowed_emails) and full Stripe history
  // (everSubscriberEmails — any status, incl. cancelled).
  if (isList && CAMPAIGN_META[campaign]?.excludeMembers && eligible.length) {
    const memberSet = new Set();
    const mr = await sb(`allowed_emails?select=email`);
    if (mr.ok) for (const r of await mr.json()) memberSet.add((r.email || "").toLowerCase());
    let everSet = new Set();
    const STRIPE = process.env.STRIPE_SECRET_KEY;
    if (STRIPE) {
      try { everSet = await everSubscriberEmails(STRIPE); }
      catch (e) { console.error("send-campaign: ever-member check failed", e.message); }
    }
    const kept = [];
    for (const m of eligible) {
      const e = m.email.toLowerCase();
      if (memberSet.has(e) || everSet.has(e)) skipped.push({ email: e, reason: "is or was a member" });
      else kept.push(m);
    }
    eligible.length = 0; eligible.push(...kept);
  }

  // ── PREVIEW ────────────────────────────────────────────────────────────────
  if (mode === "preview") {
    return json(200, {
      campaign, mode, site: SITE, audience: isList ? listSlug : "members",
      eligibleCount: eligible.length,
      eligible: eligible.map((m) => ({ email: m.email, name: m.name || "", firstName: firstName(m.name) })),
      skipped,
      sampleSubject: renderSubject(content, firstName(eligible[0]?.name)),
    });
  }

  // ── TEST: owner only ──────────────────────────────────────────────────────
  if (mode === "test") {
    const unsub = `${unsubBase}00000000-0000-0000-0000-000000000000`;
    const fn = "Matt";
    const msg = {
      from: FROM, to: [OWNER_EMAIL],
      subject: `[TEST] ${renderSubject(content, fn)}`,
      headers: { "List-Unsubscribe": `<${unsub}>` },
      html: renderEmailHTML(content, { firstName: fn, timeIn: "about ten days", site: SITE, unsub, footerReason, unsubText }),
    };
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
      body: JSON.stringify(msg),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) return json(502, { error: "Resend test failed", detail: out });
    await sb(`email_log`, { method: "POST", headers: { Prefer: "return=minimal" },
      body: JSON.stringify([{ email: OWNER_EMAIL, campaign, status: "test", resend_id: out.id || null,
        meta: { mode: "test" } }]) });
    return json(200, { campaign, mode, sentTestTo: OWNER_EMAIL, resend_id: out.id || null });
  }

  // ── LIVE ───────────────────────────────────────────────────────────────────
  if (!eligible.length) return json(200, { campaign, mode, sent: 0, skipped, note: "no eligible recipients" });

  if (skipped.length) {
    await sb(`email_log`, { method: "POST", headers: { Prefer: "return=minimal" },
      body: JSON.stringify(skipped.map((s) => ({ email: s.email, campaign, status: "skipped",
        meta: { reason: s.reason } }))) }).catch(() => {});
  }

  let sent = 0; const failures = [];
  for (let i = 0; i < eligible.length; i += 100) {
    const chunk = eligible.slice(i, i + 100);
    const batch = chunk.map((m) => {
      const unsub = `${unsubBase}${m.unsubscribe_token}&c=${campaign}`;
      return {
        from: FROM, to: [m.email],
        subject: renderSubject(content, firstName(m.name)),
        headers: { "List-Unsubscribe": `<${unsub}>` },
        html: renderEmailHTML(content, { firstName: firstName(m.name), site: SITE, unsub, footerReason, unsubText }),
      };
    });
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
      body: JSON.stringify(batch),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) {
      for (const m of chunk) failures.push({ email: m.email, error: out?.message || "resend batch error" });
      await sb(`email_log`, { method: "POST", headers: { Prefer: "return=minimal" },
        body: JSON.stringify(chunk.map((m) => ({ email: m.email, campaign, status: "failed",
          error: (out?.message || "resend batch error").slice(0, 500) }))) }).catch(() => {});
      continue;
    }
    const ids = Array.isArray(out.data) ? out.data : [];
    const rows = chunk.map((m, j) => ({ email: m.email, campaign, status: "sent", resend_id: ids[j]?.id || null }));
    const logRes = await sb(`email_log`, { method: "POST", headers: { Prefer: "return=minimal" },
      body: JSON.stringify(rows) });
    if (!logRes.ok) console.error("send-campaign: email_log insert failed", await logRes.text());
    sent += chunk.length;
  }

  return json(200, { campaign, mode, sent, failed: failures.length, failures, skipped: skipped.length });
};
