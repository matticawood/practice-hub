// One-click unsubscribe for any email LIST (waiting list, Monday Music Tips, ...).
// Links here as ?t=<email_contacts.unsubscribe_token>&l=<list slug>.
// Sets email_list_subscriptions.opted_out=true for that contact on that list, so
// leaving one list never affects the others. Separate from member unsubscribe.

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

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export default async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("t");
  const slug = url.searchParams.get("l");
  if (!token || !/^[0-9a-f-]{36}$/i.test(token) || !slug || !/^[a-z0-9-]{1,64}$/i.test(slug)) {
    return page("Invalid link", `<p style="font-size:15px;color:#516170;line-height:1.5">This unsubscribe link looks invalid or incomplete.</p>`);
  }

  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SERVICE) return page("Error", `<p style="font-size:15px;color:#516170">Something went wrong. Please try again later.</p>`);

  const sb = (path, opts = {}) =>
    fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...opts,
      headers: {
        apikey: SERVICE, Authorization: `Bearer ${SERVICE}`,
        "Content-Type": "application/json", ...(opts.headers || {}),
      },
    });

  // Resolve the contact by token.
  const cRes = await sb(`email_contacts?unsubscribe_token=eq.${token}&select=email`);
  const contact = cRes.ok ? (await cRes.json())[0] : null;
  if (!contact) return page("Invalid link", `<p style="font-size:15px;color:#516170">This unsubscribe link looks invalid or has expired.</p>`);

  // Friendly list name for the confirmation.
  const lRes = await sb(`email_lists?slug=eq.${encodeURIComponent(slug)}&select=name`);
  const listName = (lRes.ok ? (await lRes.json())[0]?.name : null) || "this list";

  // Flip the per-list opt-out for this contact.
  const upd = await sb(
    `email_list_subscriptions?email=eq.${encodeURIComponent(contact.email)}&list_slug=eq.${encodeURIComponent(slug)}`,
    { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ opted_out: true }) }
  );
  if (!upd.ok) {
    console.error("list-unsubscribe: patch failed", await upd.text());
    return page("Error", `<p style="font-size:15px;color:#516170">Couldn't update your preferences. Please try again later.</p>`);
  }

  // Attribute the unsubscribe to the email that drove it (Studio analytics).
  const campaign = url.searchParams.get("c");
  if (campaign && /^[a-z0-9_]+$/i.test(campaign)) {
    await sb(`email_log?email=eq.${encodeURIComponent(contact.email)}&campaign=eq.${encodeURIComponent(campaign)}&status=eq.sent`, {
      method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ unsubscribed_at: new Date().toISOString() }),
    }).catch(() => {});
  }

  return page(
    "Unsubscribed",
    `<p style="font-size:16px;line-height:1.5;margin:0 0 6px">You've been unsubscribed from ${esc(listName)}.</p>
     <p style="font-size:13px;color:#90a0ad;margin:10px 0 0">You won't hear from us about it again. Changed your mind? Just let us know.</p>`
  );
};
