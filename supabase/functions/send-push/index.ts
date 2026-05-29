// send-push edge function
//
// Sends an iOS push notification via Firebase Cloud Messaging (FCM) HTTP v1.
// Called by a database trigger (or directly) whenever a row is inserted into
// the `notifications` table. Looks up all device_tokens for the recipient
// email and fires one push per device.
//
// Required environment variables (set in Supabase Dashboard → Edge Functions):
//   FIREBASE_PROJECT_ID            — the Firebase project ID
//   FIREBASE_CLIENT_EMAIL          — service account email
//   FIREBASE_PRIVATE_KEY           — service account private key (raw PEM,
//                                    newlines as \n)
//   SUPABASE_URL                   — auto-populated by Supabase
//   SUPABASE_SERVICE_ROLE_KEY      — auto-populated by Supabase
//
// Request body (JSON):
//   { notification_id: uuid }      OR
//   { email, title, body, link_url, metadata }
//
// Returns: { sent, failed, total }

import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

const FB_PROJECT_ID  = Deno.env.get("FIREBASE_PROJECT_ID")!;
const FB_CLIENT_EMAIL = Deno.env.get("FIREBASE_CLIENT_EMAIL")!;
const FB_PRIVATE_KEY  = (Deno.env.get("FIREBASE_PRIVATE_KEY") || "").replace(/\\n/g, "\n");
const SUPA_URL        = Deno.env.get("SUPABASE_URL")!;
const SUPA_SERVICE    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cors = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ── Firebase OAuth2 (cached for ~50min) ──────────────────────────────────────
let _cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getFirebaseAccessToken(): Promise<string> {
  if (_cachedAccessToken && _cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return _cachedAccessToken.token;
  }

  // Build a service account JWT, exchange for an OAuth token.
  const now = getNumericDate(0);
  const payload = {
    iss: FB_CLIENT_EMAIL,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: getNumericDate(60 * 55),
  };

  // Import the PEM key
  const pemBody = FB_PRIVATE_KEY
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const bin = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8", bin,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false, ["sign"]
  );

  const jwt = await create(
    { alg: "RS256", typ: "JWT" },
    payload,
    cryptoKey,
  );

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok || !tokenJson.access_token) {
    throw new Error(`Firebase auth failed: ${JSON.stringify(tokenJson)}`);
  }

  _cachedAccessToken = {
    token: tokenJson.access_token,
    expiresAt: Date.now() + (tokenJson.expires_in * 1000),
  };
  return _cachedAccessToken.token;
}

// ── FCM send ─────────────────────────────────────────────────────────────────
interface PushInput {
  token: string;
  title: string;
  body: string;
  linkUrl: string | null;
  data: Record<string, string>;
}

async function sendOnePush(input: PushInput, accessToken: string): Promise<{ ok: boolean; error?: string; invalid?: boolean }> {
  const msg = {
    message: {
      token: input.token,
      notification: {
        title: input.title,
        body:  input.body || "",
      },
      data: {
        ...input.data,
        ...(input.linkUrl ? { link_url: input.linkUrl } : {}),
      },
      apns: {
        payload: {
          aps: { sound: "default", badge: 1 },
        },
      },
    },
  };

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${FB_PROJECT_ID}/messages:send`,
    {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify(msg),
    },
  );

  if (res.ok) return { ok: true };

  const errBody = await res.text();
  const invalid = /UNREGISTERED|INVALID_ARGUMENT|NOT_FOUND/i.test(errBody);
  return { ok: false, error: errBody, invalid };
}

// ── Supabase helper ──────────────────────────────────────────────────────────
async function supaSelect(path: string): Promise<any[]> {
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
    headers: {
      "apikey":        SUPA_SERVICE,
      "Authorization": `Bearer ${SUPA_SERVICE}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase query failed: ${await res.text()}`);
  return res.json();
}

async function supaDeleteTokens(tokens: string[]) {
  if (!tokens.length) return;
  const q = `token=in.(${tokens.map(t => `"${t}"`).join(",")})`;
  await fetch(`${SUPA_URL}/rest/v1/device_tokens?${q}`, {
    method:  "DELETE",
    headers: {
      "apikey":        SUPA_SERVICE,
      "Authorization": `Bearer ${SUPA_SERVICE}`,
    },
  });
}

// ── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST")    return json({ error: "POST only" }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "invalid json" }, 400); }

  // Supabase Database Webhooks send `{ type, table, record, schema, old_record }`.
  // Normalise that into a notification_id so the rest of the handler is uniform.
  if (body.type === "INSERT" && body.record?.id && body.table === "notifications") {
    body = { notification_id: body.record.id };
  }

  // Either resolve notification by id (DB webhook path) or take an explicit
  // payload (manual broadcast / future custom callers).
  let email: string, title: string, content: string, linkUrl: string | null, metadata: any;
  if (body.notification_id) {
    const rows = await supaSelect(
      `notifications?id=eq.${encodeURIComponent(body.notification_id)}&select=email,title,body,link_url,metadata`,
    );
    if (!rows.length) return json({ error: "notification not found" }, 404);
    email    = rows[0].email;
    title    = rows[0].title;
    content  = rows[0].body || "";
    linkUrl  = rows[0].link_url || null;
    metadata = rows[0].metadata || {};
  } else if (body.email && body.title) {
    email    = body.email;
    title    = body.title;
    content  = body.body || "";
    linkUrl  = body.link_url || null;
    metadata = body.metadata || {};
  } else {
    return json({ error: "either notification_id or {email,title} required" }, 400);
  }

  // Look up devices for this email.
  const devices = await supaSelect(
    `device_tokens?email=eq.${encodeURIComponent(email.toLowerCase())}&select=token,platform`,
  );
  if (!devices.length) return json({ sent: 0, failed: 0, total: 0, reason: "no devices" });

  const accessToken = await getFirebaseAccessToken();

  // Coerce all metadata values to strings — FCM data payloads are string-only.
  const data: Record<string, string> = {};
  for (const [k, v] of Object.entries(metadata || {})) {
    if (v == null) continue;
    data[k] = typeof v === "string" ? v : JSON.stringify(v);
  }

  let sent = 0, failed = 0;
  const invalidTokens: string[] = [];
  await Promise.all(devices.map(async (d: any) => {
    const r = await sendOnePush({ token: d.token, title, body: content, linkUrl, data }, accessToken);
    if (r.ok) { sent++; }
    else      { failed++; if (r.invalid) invalidTokens.push(d.token); }
  }));

  // Clean up tokens FCM told us are dead so we don't keep retrying them.
  if (invalidTokens.length) await supaDeleteTokens(invalidTokens);

  return json({ sent, failed, total: devices.length, pruned: invalidTokens.length });
});
