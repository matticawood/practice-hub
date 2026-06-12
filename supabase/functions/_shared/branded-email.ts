// Branded transactional email shell (cream card, gold pill/button, M-logo header)
// — the same style as the booking emails, shared by the store functions.
const BRAND_LOGO = "https://gyskfutmncprqxazgatv.supabase.co/storage/v1/object/public/email-assets/logo.png";
const ICON_BASE  = "https://gyskfutmncprqxazgatv.supabase.co/storage/v1/object/public/email-assets/icons";

export const ic = (n: string) =>
  `<img src="${ICON_BASE}/${n}.png" width="15" height="15" alt="" style="vertical-align:-2px;margin-right:9px">`;

export function brandedEmail(o: {
  eyebrow?: string; heading?: string; paragraphs?: string[];
  detail?: string; ctaText?: string; ctaHref?: string;
  cta2Text?: string; cta2Href?: string; footerNote?: string;
}): string {
  const P = (h: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.62;color:#42382e">${h}</p>`;
  const body = (o.paragraphs || []).map(P).join("");
  const eb = o.eyebrow ? `<tr><td style="padding:0 36px 6px;text-align:center"><span style="display:inline-block;background:#F5C518;color:#1a1410;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:6px 13px;border-radius:999px">${o.eyebrow}</span></td></tr>` : "";
  const hd = o.heading ? `<tr><td style="padding:14px 36px 2px;text-align:center"><h1 style="margin:0;font-size:22px;line-height:1.25;color:#42382e;font-weight:800;letter-spacing:-.01em">${o.heading}</h1></td></tr>` : "";
  const dt = o.detail ? `<tr><td style="padding:12px 36px 2px"><div style="background:#f7f4ef;border:1px solid #ece5db;border-radius:12px;padding:15px 17px;font-size:14px;line-height:1.65;color:#42382e">${o.detail}</div></td></tr>` : "";
  const btn = (text: string, href: string, primary: boolean) => `<a href="${href}" style="display:inline-block;box-sizing:border-box;width:240px;margin:5px;padding:13px 10px;text-align:center;background:${primary ? "#F5C518" : "#ffffff"};color:#1a1410;text-decoration:none;font-weight:700;font-size:15px;border-radius:11px;${primary ? "" : "border:1.5px solid #e2d9c9;"}">${text}</a>`;
  const cta = (o.ctaText || o.cta2Text)
    ? `<tr><td style="padding:18px 30px 28px;text-align:center">${o.ctaText ? btn(o.ctaText, o.ctaHref || "#", true) : ""}${o.cta2Text ? btn(o.cta2Text, o.cta2Href || "#", false) : ""}</td></tr>`
    : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#faf7f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1410;-webkit-font-smoothing:antialiased">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f3;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #ece5db;border-radius:18px;overflow:hidden">
<tr><td style="padding:30px 36px 14px;text-align:center"><img src="${BRAND_LOGO}" width="46" height="46" alt="" style="display:inline-block;border-radius:12px"><div style="margin-top:10px;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#a99d8c">Matthew Cawood</div></td></tr>
${eb}${hd}
<tr><td style="padding:14px 38px 2px">${body}</td></tr>
${dt}${cta}
<tr><td style="padding:20px 36px;border-top:1px solid #f0ebe3;text-align:center;font-size:12px;color:#a99d8c;line-height:1.6">${o.footerNote || "Matthew Cawood · Pianist, Producer &amp; Educator"}<br><a href="https://matthewcawood.com" style="color:#a99d8c;text-decoration:underline">matthewcawood.com</a></td></tr>
</table></td></tr></table></body></html>`;
}

// Fire-and-forget Resend send. Returns true on success.
export async function sendEmail(o: {
  apiKey: string; from: string; to: string; subject: string; html: string; replyTo?: string;
}): Promise<boolean> {
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${o.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: o.from, to: [o.to], subject: o.subject, html: o.html, reply_to: o.replyTo }),
    });
    if (!r.ok) console.error("Resend send failed:", r.status, await r.text());
    return r.ok;
  } catch (e: any) { console.error("Resend send error:", e.message); return false; }
}
