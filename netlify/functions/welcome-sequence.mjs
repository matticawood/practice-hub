// New-member welcome sequence: Day 0 → 2 → 5 → 10 after joining.
//
// Runs on a schedule (prod only). Each run, for every enrolled member it sends
// the EARLIEST step they're due-and-unsent — at most one email per member per run
// — so a brand-new member gets one per cadence day, and a backfilled recent
// joiner catches up a step at a time instead of being blasted. email_log (with a
// DB-level unique index) guarantees each member gets each step exactly once.
//
// Enrollment is gated to recent joiners (created_at >= SEQUENCE_START) so the
// whole established membership is never swept in. The Day-10 email's {timeIn}
// reflects each member's real age, so it always reads naturally.
//
// SAFETY: a scheduled (unauthenticated) run only sends when WELCOME_SEQUENCE_LIVE
// === 'true'. Until you set that env var, the schedule is a no-op. The owner can
// always ?mode=preview (no send) or ?mode=run (manual send) with their token.
//
// Env: SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, REMINDER_FROM, SITE_URL,
//      WELCOME_SEQUENCE_LIVE

import { EMAIL_DEFAULTS, renderEmailHTML, renderSubject, contentForCampaign, friendlyAge } from "../../email-templates.mjs";

export const config = { schedule: "0 8,14,20 * * *" };  // 3x/day (prod only)

const SUPABASE_URL  = "https://gyskfutmncprqxazgatv.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5c2tmdXRtbmNwcnF4YXpnYXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjIwMTYsImV4cCI6MjA5MTMzODAxNn0.ttC3plmhbA7ls_T3w25XgYT0WBt6O3MMu0G6NrEKI9g";
const OWNER_EMAIL   = "matthew@matthewcawood.com";

// Only members who joined on/after this date are in the sequence. Join dates are
// now real (synced from Stripe, pre-launch registrations floored at 2026-04-22),
// so this is a genuine "last ~9 days" window: it backfills recent joiners and
// enrols every future signup, while the established membership stays out.
const SEQUENCE_START = "2026-06-01";

const STEPS = [
  { campaign: "welcome_d0",  day: 0 },
  { campaign: "welcome_d2",  day: 2 },
  { campaign: "welcome_d5",  day: 5 },
  { campaign: "welcome_d10", day: 10 },
];

const EXCLUDED = new Set([
  "matthew@matthewcawood.com", "mcawoodcanada@gmail.com",
  "reviewer@matthewcawood.com", "enquiries@matthewcawood.com",
  "system@thepracticeroom.app",
]);

const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
const firstName = (name) => { const r = String(name || "").trim().split(/\s+/)[0]; return r ? r.charAt(0).toUpperCase() + r.slice(1) : "there"; };

export default async (req) => {
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const RESEND  = process.env.RESEND_API_KEY;
  const FROM    = process.env.REMINDER_FROM || "The Practice Room <noreply@matthewcawood.com>";
  const SITE    = (process.env.SITE_URL || "https://app.matthewcawood.com").replace(/\/$/, "");
  if (!SERVICE || !RESEND) return json(500, { error: "missing env (SERVICE/RESEND)" });

  // ── Determine mode ─────────────────────────────────────────────────────────
  // Owner HTTP (token present): mode from ?mode= (preview default, or run).
  // No token: treat as the scheduler — live only if WELCOME_SEQUENCE_LIVE=true.
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
    mode = process.env.WELCOME_SEQUENCE_LIVE === "true" ? "run" : "noop";
  }

  const sb = (path, opts = {}) =>
    fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...opts, headers: {
      apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json", ...(opts.headers || {}) } });

  // ── Enrolled members + what they've already been sent ──────────────────────
  // 1) Genuine new signups: created_at on/after the cutoff (accurate for inserts
  //    made after the onboarding migration).
  const mRes = await sb(`allowed_emails?select=email,name,created_at,email_opt_out,unsubscribe_token&created_at=gte.${SEQUENCE_START}`);
  if (!mRes.ok) return json(502, { error: "member lookup failed", detail: await mRes.text() });
  const members = await mRes.json();

  // 2) Manual backfill: specific members enrolled by hand, using started_at as
  //    their join date (their created_at can't be trusted post-migration).
  const bfRes = await sb(`welcome_backfill?select=email,started_at`);
  if (bfRes.ok) {
    const bf = await bfRes.json();
    if (bf.length) {
      const startBy = {}; for (const b of bf) startBy[(b.email || "").toLowerCase()] = b.started_at;
      const have = new Set(members.map((m) => (m.email || "").toLowerCase()));
      const need = Object.keys(startBy).filter((e) => !have.has(e));
      if (need.length) {
        const inList = need.map((e) => `"${e.replace(/"/g, "")}"`).join(",");
        const aeRes = await sb(`allowed_emails?select=email,name,email_opt_out,unsubscribe_token&email=in.(${inList})`);
        if (aeRes.ok) for (const r of await aeRes.json()) {
          members.push({ ...r, created_at: `${startBy[(r.email || "").toLowerCase()]}T00:00:00Z` });
        }
      }
    }
  }

  const stepCampaigns = STEPS.map((s) => s.campaign);
  const sRes = await sb(`email_log?select=email,campaign&status=eq.sent&campaign=in.(${stepCampaigns.join(",")})`);
  const sent = new Set();
  if (sRes.ok) for (const r of await sRes.json()) sent.add(`${(r.email || "").toLowerCase()}|${r.campaign}`);

  // ── Plan: one earliest-due-unsent step per member ──────────────────────────
  const now = Date.now(), DAY = 86400000;
  const plan = [];  // { email, name, unsubscribe_token, campaign, age }
  for (const m of members) {
    const e = (m.email || "").toLowerCase();
    if (!e || EXCLUDED.has(e) || m.email_opt_out) continue;
    if (!m.created_at) continue;
    const age = Math.floor((now - new Date(m.created_at).getTime()) / DAY);
    const due = STEPS.find((s) => age >= s.day && !sent.has(`${e}|${s.campaign}`));
    if (due) plan.push({ email: m.email, name: m.name, unsubscribe_token: m.unsubscribe_token, campaign: due.campaign, age });
  }

  // Per-step counts for the response.
  const counts = {}; for (const p of plan) counts[p.campaign] = (counts[p.campaign] || 0) + 1;

  // Dormant scheduled run (no owner auth): never expose member data to an
  // anonymous caller — just acknowledge it's a no-op.
  if (mode === "noop") {
    return json(200, { mode, note: "Scheduled run is dormant — set WELCOME_SEQUENCE_LIVE=true to enable sending." });
  }
  // Owner preview: full plan with sample (owner-authenticated above).
  if (mode === "preview") {
    return json(200, {
      mode, liveEnabled: process.env.WELCOME_SEQUENCE_LIVE === "true",
      sequenceStart: SEQUENCE_START, enrolledMembers: members.length, due: plan.length, counts,
      sample: plan.slice(0, 20).map((p) => ({ email: p.email, step: p.campaign, age: p.age,
        greeting: `Hi ${firstName(p.name)},`, timeIn: p.campaign === "welcome_d10" ? friendlyAge(p.age) : undefined })),
      note: "Preview only — nothing sent.",
    });
  }

  // ── RUN: render + send, grouped by step, logged individually ───────────────
  // Load any Studio copy overrides once.
  const tplOverrides = {};
  const tRes = await sb(`email_templates?select=*&campaign=in.(${stepCampaigns.join(",")})`);
  if (tRes.ok) for (const row of await tRes.json()) tplOverrides[row.campaign] = row;

  let sentCount = 0; const failures = [];
  for (const step of STEPS) {
    const recips = plan.filter((p) => p.campaign === step.campaign);
    if (!recips.length) continue;
    const content = contentForCampaign(step.campaign, tplOverrides[step.campaign]);
    for (let i = 0; i < recips.length; i += 100) {
      const chunk = recips.slice(i, i + 100);
      const batch = chunk.map((p) => {
        const fn = firstName(p.name);
        const timeIn = friendlyAge(p.age);
        const unsub = `${SITE}/.netlify/functions/email-unsubscribe?t=${p.unsubscribe_token}`;
        return { from: FROM, to: [p.email], subject: renderSubject(content, fn, timeIn),
          headers: { "List-Unsubscribe": `<${unsub}>` },
          html: renderEmailHTML(content, { firstName: fn, timeIn, site: SITE, unsub }) };
      });
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST", headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" }, body: JSON.stringify(batch) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) {
        for (const p of chunk) failures.push({ email: p.email, campaign: step.campaign });
        await sb(`email_log`, { method: "POST", headers: { Prefer: "return=minimal" },
          body: JSON.stringify(chunk.map((p) => ({ email: p.email, campaign: step.campaign, status: "failed",
            error: (out?.message || "resend batch error").slice(0, 500) }))) }).catch(() => {});
        continue;
      }
      const ids = Array.isArray(out.data) ? out.data : [];
      await sb(`email_log`, { method: "POST", headers: { Prefer: "return=minimal" },
        body: JSON.stringify(chunk.map((p, j) => ({ email: p.email, campaign: step.campaign, status: "sent",
          resend_id: ids[j]?.id || null, meta: { age: p.age } }))) }).catch(() => {});
      sentCount += chunk.length;
    }
  }

  return json(200, { mode, sequenceStart: SEQUENCE_START, sent: sentCount, failed: failures.length, counts });
};
