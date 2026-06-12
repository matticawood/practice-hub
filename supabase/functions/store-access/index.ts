// store-access — validates an order's access_token, then either:
//   GET ?token=<uuid>               → 302 to a fresh signed PDF (paid download link)
//   GET ?token=<uuid>&format=json   → course payload for the player: lessons + Mux
//                                     signed playback tokens
// Public (deploy --no-verify-jwt) because the PDF link is opened directly from an
// email. The access_token (unguessable uuid) is the gate.
import { STORE } from "../_shared/store-catalog.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const MUX_KEY_ID   = Deno.env.get("MUX_SIGNING_KEY_ID") || "";
const MUX_KEY_B64  = Deno.env.get("MUX_SIGNING_PRIVATE_KEY") || ""; // base64 of the PEM
const BRAND        = "https://matthewcawood.com";
const PDF_TTL      = 60;            // short-lived: minted fresh on every click
const MUX_TTL      = 6 * 60 * 60;   // 6h playback token

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};
const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

async function lookupOrder(token: string): Promise<{ slug: string; kind: string; email: string } | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/store_orders?access_token=eq.${encodeURIComponent(token)}&select=slug,kind,email&limit=1`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } });
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function signPdf(slug: string): Promise<string | null> {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/store-files/${slug}.pdf`, {
    method: "POST",
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: PDF_TTL }),
  });
  if (!res.ok) { console.error("signPdf failed:", res.status, await res.text()); return null; }
  const { signedURL } = await res.json();
  return signedURL ? `${SUPABASE_URL}/storage/v1${signedURL}` : null;
}

// ── Mux signed playback JWT (RS256) ──
const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64urlStr = (s: string) => b64url(new TextEncoder().encode(s));

let _muxKey: CryptoKey | null = null;
async function muxKey(): Promise<CryptoKey | null> {
  if (_muxKey) return _muxKey;
  if (!MUX_KEY_ID || !MUX_KEY_B64) return null;
  try {
    const pem = atob(MUX_KEY_B64);                              // base64 → PEM text
    const body = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
    const der = Uint8Array.from(atob(body), c => c.charCodeAt(0));
    _muxKey = await crypto.subtle.importKey("pkcs8", der.buffer,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
    return _muxKey;
  } catch (e: any) { console.error("mux key import failed:", e.message); return null; }
}
async function muxToken(playbackId: string, key: CryptoKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header  = b64urlStr(JSON.stringify({ alg: "RS256", typ: "JWT", kid: MUX_KEY_ID }));
  const payload = b64urlStr(JSON.stringify({ sub: playbackId, aud: "v", exp: now + MUX_TTL, kid: MUX_KEY_ID }));
  const input = `${header}.${payload}`;
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(input));
  return `${input}.${b64url(new Uint8Array(sig))}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const wantJson = url.searchParams.get("format") === "json";
  if (!token) return wantJson ? json({ ok: false, error: "Missing token" }, 400)
                              : Response.redirect(`${BRAND}/store/?error=missing-token`, 302);

  const order = await lookupOrder(token);
  if (!order) return wantJson ? json({ ok: false, error: "Invalid or expired link" }, 404)
                              : Response.redirect(`${BRAND}/store/?error=invalid-token`, 302);

  const item = STORE[order.slug];
  const title = item?.title || order.slug;

  // ── PDF: redirect straight to a fresh signed download ──
  if (order.kind === "pdf") {
    const signed = await signPdf(order.slug);
    if (wantJson) return json({ ok: true, kind: "pdf", title, url: signed });
    if (!signed)  return Response.redirect(`${BRAND}/store/?error=download-unavailable`, 302);
    return Response.redirect(signed, 302);
  }

  // ── Course: the player page fetches JSON; a bare hit bounces to the player ──
  if (!wantJson) return Response.redirect(`${BRAND}/store/learn/?t=${token}`, 302);

  const lessonsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/store_lessons?product_slug=eq.${encodeURIComponent(order.slug)}&order=sort.asc&select=id,chapter,chapter_title,title,mux_playback_id,duration_sec,free_preview`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } });
  const rawLessons = lessonsRes.ok ? await lessonsRes.json() : [];
  const key = await muxKey();

  const lessons = [];
  for (const l of (Array.isArray(rawLessons) ? rawLessons : [])) {
    let playback: string | null = null;
    if (l.mux_playback_id && key) {
      try { playback = await muxToken(l.mux_playback_id, key); } catch (_) { playback = null; }
    }
    lessons.push({
      id: l.id, chapter: l.chapter, chapterTitle: l.chapter_title, title: l.title,
      durationSec: l.duration_sec, freePreview: !!l.free_preview,
      playbackId: l.mux_playback_id || null, token: playback,
    });
  }

  return json({ ok: true, kind: "course", title, slug: order.slug, muxConfigured: !!key, lessons });
});
