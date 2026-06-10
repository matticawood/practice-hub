// One-click unsubscribe target for livestream-reminder emails.
// The reminder email links here with ?t=<allowed_emails.unsubscribe_token>.
// Sets email_opt_out=true for that token. No login required (token is the proof).

const SUPABASE_URL = "https://gyskfutmncprqxazgatv.supabase.co";

const page = (title, body) =>
  new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#faf7f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1410">
  <div style="max-width:420px;background:#fff;border:1px solid #ece5db;border-radius:18px;padding:36px 32px;text-align:center">
    <div style="font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#a99d8c;margin-bottom:16px">The Practice Room</div>
    ${body}
  </div>
</body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );

export default async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("t");
  const campaign = url.searchParams.get("c");  // which email drove the unsubscribe
  // UUID shape only — avoids passing junk into the query.
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
    return page("Invalid link", `<p style="font-size:15px;color:#516170;line-height:1.5">This unsubscribe link looks invalid or incomplete.</p>`);
  }

  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SERVICE) return page("Error", `<p style="font-size:15px;color:#516170">Something went wrong. Please try again later.</p>`);

  const sb = (p, opts = {}) => fetch(`${SUPABASE_URL}/rest/v1/${p}`, { ...opts, headers: {
    apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json", ...(opts.headers || {}) } });

  const res = await sb(`allowed_emails?unsubscribe_token=eq.${token}`, {
    method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ email_opt_out: true }),
  });

  if (!res.ok) {
    console.error("email-unsubscribe: patch failed", await res.text());
    return page("Error", `<p style="font-size:15px;color:#516170">Couldn't update your preferences. Please try again later.</p>`);
  }

  // Attribute the unsubscribe to the email that drove it (Studio analytics).
  const email = (await res.json().catch(() => []))[0]?.email;
  if (email && campaign && /^[a-z0-9_]+$/i.test(campaign)) {
    await sb(`email_log?email=eq.${encodeURIComponent(email)}&campaign=eq.${encodeURIComponent(campaign)}&status=eq.sent`, {
      method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ unsubscribed_at: new Date().toISOString() }),
    }).catch(() => {});
  }

  return page(
    "Unsubscribed",
    `<p style="font-size:16px;line-height:1.5;margin:0 0 6px">You've been unsubscribed from emails from The Practice Room.</p>
     <p style="font-size:13px;color:#90a0ad;margin:10px 0 0">You'll still see everything inside the app. Changed your mind? Just let us know and we'll turn emails back on.</p>`
  );
};
