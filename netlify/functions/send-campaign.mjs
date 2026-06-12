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

import { EMAIL_DEFAULTS, CAMPAIGN_META, renderEmailHTML, renderSubject, contentForCampaign, renderMMTHTML, renderMMTSubject } from "../../email-templates.mjs";
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
  const REPLY_TO = process.env.REPLY_TO || "matthew@matthewcawood.com";  // replies reach a real inbox
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
  const mode = ["preview", "test", "live"].includes(body.mode) ? body.mode : "preview";
  const requested = Array.isArray(body.recipients)
    ? [...new Set(body.recipients.map((e) => String(e || "").trim().toLowerCase()).filter(Boolean))]
    : [];
  const normEmail = (e) => { e = String(e || "").trim().toLowerCase(); return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) ? e : ""; };

  // Ad-hoc (custom) email from the Studio Compose panel: inline content + a chosen
  // audience (a list, all members, or one person) instead of a predefined campaign.
  const adhocTemplate = body.template === "mmt" ? "mmt" : "default";
  const adhoc = body.adhoc ? {
    campaign: String(body.campaignId || `adhoc-${Date.now()}`).slice(0, 80),
    template: adhocTemplate,
    brand: body.brand === "matthew" ? "matthew" : "practice-room",
    content: adhocTemplate === "mmt" ? {
      issue:        String(body.content?.issue || "").slice(0, 10),
      subject:      String(body.content?.subject || body.content?.articleTitle || "").slice(0, 200),
      articleTitle: String(body.content?.articleTitle || "").slice(0, 200),
      articleUrl:   String(body.content?.articleUrl || "").slice(0, 500),
      intro:        Array.isArray(body.content?.intro) ? body.content.intro.map((p) => String(p || "")).filter((p) => p.trim()).slice(0, 20) : [],
      quote:        String(body.content?.quote || "").slice(0, 400),
      quoteAuthor:  String(body.content?.quoteAuthor || "").slice(0, 80),
      bullets:      Array.isArray(body.content?.bullets) ? body.content.bullets.map((b) => String(b || "")).filter((b) => b.trim()).slice(0, 12) : [],
      promoHook:    String(body.content?.promoHook || "").slice(0, 400),
    } : {
      subject:   String(body.content?.subject   || "").slice(0, 200),
      preheader: String(body.content?.preheader || "").slice(0, 200),
      eyebrow:   String(body.content?.eyebrow   || "").slice(0, 60),
      paragraphs: Array.isArray(body.content?.paragraphs)
        ? body.content.paragraphs.map((p) => String(p || "")).filter((p) => p.trim()).slice(0, 60) : [],
      ctaText:   String(body.content?.ctaText   || "").slice(0, 80),
      ctaHref:   String(body.content?.ctaHref   || "").slice(0, 500),
    },
    audience: body.audience || {},
  } : null;
  if (adhoc && adhoc.template === "mmt" && (!adhoc.content.articleTitle || (!adhoc.content.intro.length && !adhoc.content.bullets.length)))
    return json(400, { error: "The Monday Music Tips email needs an article and some content." });
  if (adhoc && adhoc.template !== "mmt" && (!adhoc.content.subject || !adhoc.content.paragraphs.length))
    return json(400, { error: "A custom email needs a subject and a message." });
  let campaign = adhoc ? adhoc.campaign : String(body.campaign || "");

  const sb = (path, opts = {}) =>
    fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...opts,
      headers: {
        apikey: SERVICE, Authorization: `Bearer ${SERVICE}`,
        "Content-Type": "application/json", ...(opts.headers || {}),
      },
    });

  let content, isList = false, listSlug = null;
  let footerReason = MEMBER_FOOTER, unsubText = "Unsubscribe from emails";
  let unsubBase = `${SITE}/.netlify/functions/email-unsubscribe?t=`;
  let renderH = renderEmailHTML, renderS = renderSubject;   // swapped for the MMT template
  const eligible = [], skipped = [];

  // Already-sent (successful) for this campaign → skip (a double-send is impossible).
  const alreadySent = new Set();
  const lr = await sb(`email_log?select=email&campaign=eq.${encodeURIComponent(campaign)}&status=eq.sent`);
  if (lr.ok) for (const row of await lr.json()) alreadySent.add((row.email || "").toLowerCase());

  if (adhoc) {
    content = adhoc.content;
    if (adhoc.template === "mmt") { renderH = renderMMTHTML; renderS = renderMMTSubject; }
    const type = adhoc.audience.type;
    if (type === "list") {
      listSlug = String(adhoc.audience.listSlug || ""); isList = true;
      const nRes = await sb(`email_lists?slug=eq.${encodeURIComponent(listSlug)}&select=name`);
      const listName = (nRes.ok ? (await nRes.json())[0]?.name : null);
      if (!listName) return json(400, { error: `unknown list '${listSlug}'` });
      footerReason = `You're getting this because you signed up to ${listName}.`;
      unsubText = `Unsubscribe from ${listName}`;
      unsubBase = `${SITE}/.netlify/functions/list-unsubscribe?l=${encodeURIComponent(listSlug)}&t=`;
      const r = await sb(`email_list_subscriptions?list_slug=eq.${encodeURIComponent(listSlug)}&select=email,opted_out,email_contacts(name,unsubscribe_token,global_opt_out)`);
      if (!r.ok) return json(502, { error: "list lookup failed", detail: await r.text() });
      for (const s of await r.json()) {
        const e = (s.email || "").toLowerCase(); const c = s.email_contacts || {};
        if (!e) continue;
        if (EXCLUDED.has(e)) { skipped.push({ email: e, reason: "excluded account" }); continue; }
        if (s.opted_out || c.global_opt_out) { skipped.push({ email: e, reason: "unsubscribed" }); continue; }
        if (alreadySent.has(e)) { skipped.push({ email: e, reason: "already sent" }); continue; }
        eligible.push({ email: s.email, name: c.name, unsubscribe_token: c.unsubscribe_token });
      }
    } else if (type === "members") {
      const r = await sb(`allowed_emails?select=email,name,unsubscribe_token,email_opt_out`);
      if (!r.ok) return json(502, { error: "member lookup failed", detail: await r.text() });
      for (const m of await r.json()) {
        const e = (m.email || "").toLowerCase();
        if (!e) continue;
        if (EXCLUDED.has(e)) { skipped.push({ email: e, reason: "excluded account" }); continue; }
        if (m.email_opt_out) { skipped.push({ email: e, reason: "unsubscribed" }); continue; }
        if (alreadySent.has(e)) { skipped.push({ email: e, reason: "already sent" }); continue; }
        eligible.push({ email: m.email, name: m.name, unsubscribe_token: m.unsubscribe_token });
      }
    } else { // single person
      const e = normEmail(adhoc.audience.email);
      if (!e) return json(400, { error: "Enter a valid email address." });
      await sb(`email_contacts`, { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify({ email: e }) }).catch(() => {});
      const cRes = await sb(`email_contacts?email=eq.${encodeURIComponent(e)}&select=name,unsubscribe_token,global_opt_out`);
      const c = (cRes.ok ? (await cRes.json())[0] : null) || {};
      footerReason = "You're receiving this from Matthew Cawood.";
      unsubText = "Unsubscribe";
      unsubBase = `${SITE}/.netlify/functions/list-unsubscribe?l=all&t=`;
      if (EXCLUDED.has(e)) skipped.push({ email: e, reason: "excluded account" });
      else if (c.global_opt_out) skipped.push({ email: e, reason: "unsubscribed" });
      else if (alreadySent.has(e)) skipped.push({ email: e, reason: "already sent" });
      else eligible.push({ email: e, name: c.name, unsubscribe_token: c.unsubscribe_token });
    }
  } else {
    if (!EMAIL_DEFAULTS[campaign]) return json(400, { error: `unknown campaign '${campaign}'` });
    // A campaign either targets the Members audience (allowed_emails) or a contact
    // LIST (email_lists), declared via CAMPAIGN_META[campaign].list.
    listSlug = CAMPAIGN_META[campaign]?.list || null;
    isList = !!listSlug;

    // Editable copy: DB override (Studio) merged over defaults.
    let dbRow = null;
    const tRes = await sb(`email_templates?campaign=eq.${encodeURIComponent(campaign)}&select=*`);
    if (tRes.ok) dbRow = (await tRes.json())[0] || null;
    content = contentForCampaign(campaign, dbRow);

    if (isList) {
      const nRes = await sb(`email_lists?slug=eq.${encodeURIComponent(listSlug)}&select=name`);
      const listName = (nRes.ok ? (await nRes.json())[0]?.name : null) || "this list";
      footerReason = `You're getting this because you signed up to ${listName}.`;
      unsubText = `Unsubscribe from ${listName}`;
      unsubBase = `${SITE}/.netlify/functions/list-unsubscribe?l=${encodeURIComponent(listSlug)}&t=`;
      const r = await sb(`email_list_subscriptions?list_slug=eq.${encodeURIComponent(listSlug)}&select=email,opted_out,email_contacts(name,unsubscribe_token,global_opt_out)`);
      if (!r.ok) return json(502, { error: "list lookup failed", detail: await r.text() });
      for (const s of await r.json()) {
        const e = (s.email || "").toLowerCase(); const c = s.email_contacts || {};
        if (!e) continue;
        if (EXCLUDED.has(e)) { skipped.push({ email: e, reason: "excluded account" }); continue; }
        if (s.opted_out || c.global_opt_out) { skipped.push({ email: e, reason: "unsubscribed" }); continue; }
        if (alreadySent.has(e)) { skipped.push({ email: e, reason: "already sent" }); continue; }
        eligible.push({ email: s.email, name: c.name, unsubscribe_token: c.unsubscribe_token });
      }
    } else {
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

    // Exclude current/former members for opt-in list campaigns (e.g. waitlist).
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
  }

  // ── PREVIEW ────────────────────────────────────────────────────────────────
  if (mode === "preview") {
    return json(200, {
      campaign, mode, site: SITE, audience: isList ? listSlug : "members",
      eligibleCount: eligible.length,
      eligible: eligible.map((m) => ({ email: m.email, name: m.name || "", firstName: firstName(m.name) })),
      skipped,
      sampleSubject: renderS(content, firstName(eligible[0]?.name)),
    });
  }

  // ── TEST: owner only ──────────────────────────────────────────────────────
  if (mode === "test") {
    const unsub = `${unsubBase}00000000-0000-0000-0000-000000000000`;
    const fn = "Matt";
    const msg = {
      from: FROM, reply_to: REPLY_TO, to: [OWNER_EMAIL],
      subject: `[TEST] ${renderS(content, fn)}`,
      headers: { "List-Unsubscribe": `<${unsub}>` },
      html: renderH(content, { firstName: fn, timeIn: "about ten days", site: SITE, unsub, footerReason, unsubText, brand: adhoc?.brand }),
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
        from: FROM, reply_to: REPLY_TO, to: [m.email],
        subject: renderS(content, firstName(m.name)),
        headers: { "List-Unsubscribe": `<${unsub}>` },
        html: renderH(content, { firstName: firstName(m.name), site: SITE, unsub, footerReason, unsubText, brand: adhoc?.brand }),
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
