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
const ANON_KEY        = Deno.env.get("SUPABASE_ANON_KEY")!;
const OWNER_EMAIL     = "matthew@matthewcawood.com";

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
  badge: number;
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
        // Web/Android: the service worker reads this to set the app-icon badge
        // (the iOS equivalent of the aps.badge below). Ignored by iOS.
        badge: String(input.badge),
      },
      apns: {
        payload: {
          aps: { sound: "default", badge: input.badge },
        },
      },
      // Web/Android (FCM web tokens): make the notification click open the
      // right page. fcm_options.link must be absolute. Ignored for iOS tokens.
      ...(input.linkUrl ? {
        webpush: {
          fcm_options: {
            link: input.linkUrl.startsWith("http")
              ? input.linkUrl
              : `https://app.matthewcawood.com${input.linkUrl.startsWith("/") ? "" : "/"}${input.linkUrl}`,
          },
        },
      } : {}),
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

// ── Unseen-notification count ────────────────────────────────────────────────
// The app-icon badge counts notifications the member has not yet LOOKED AT —
// i.e. created after their `notif_seen_at` watermark (set when they open the
// bell). This is deliberately separate from per-notification `read` state: a
// member can open the bell (badge clears) yet still have unread items sitting
// bold in the list to tap through one by one. A member with no watermark (never
// opened the bell) counts every notification as unseen.
async function unseenCount(emailLc: string): Promise<number> {
  let seenAt = "";
  try {
    const rows = await supaSelect(
      `allowed_emails?email=eq.${encodeURIComponent(emailLc)}&select=notif_seen_at`,
    );
    seenAt = rows?.[0]?.notif_seen_at || "";
  } catch { /* treat as never-seen */ }
  let q = `notifications?email=eq.${encodeURIComponent(emailLc)}&select=id`;
  if (seenAt) q += `&created_at=gt.${encodeURIComponent(seenAt)}`;
  try {
    const cnt = await fetch(`${SUPA_URL}/rest/v1/${q}`, {
      headers: { "apikey": SUPA_SERVICE, "Authorization": `Bearer ${SUPA_SERVICE}`, "Prefer": "count=exact", "Range": "0-0" },
    });
    const cr = cnt.headers.get("content-range");
    const total = cr && cr.includes("/") ? parseInt(cr.split("/")[1], 10) : NaN;
    return isNaN(total) ? 0 : total;
  } catch { return 0; }
}

// Stamp the member's seen-watermark to now, so every current notification
// counts as looked-at and the icon badge drops to 0.
async function markSeen(emailLc: string) {
  await fetch(`${SUPA_URL}/rest/v1/allowed_emails?email=eq.${encodeURIComponent(emailLc)}`, {
    method: "PATCH",
    headers: {
      "apikey": SUPA_SERVICE, "Authorization": `Bearer ${SUPA_SERVICE}`,
      "Content-Type": "application/json", "Prefer": "return=minimal",
    },
    body: JSON.stringify({ notif_seen_at: new Date().toISOString() }),
  });
}

// ── Caller identity ──────────────────────────────────────────────────────────
// The anon key is a valid project JWT, so verify_jwt cannot tell a logged-out
// visitor from a member. Resolve the real user behind the bearer token; returns
// null for the anon key or any non-user token. Used to stop a logged-out (or
// impersonating) caller forging pushes to other members.
async function callerEmail(req: Request): Promise<string | null> {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token || token === ANON_KEY) return null;
  try {
    const r = await fetch(`${SUPA_URL}/auth/v1/user`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    const u = await r.json();
    return String(u?.email || "").toLowerCase() || null;
  } catch {
    return null;
  }
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

  // ── Chat / DM push path ──────────────────────────────────────────────────────
  // Direct push for a new chat message. Deliberately does NOT insert a
  // notifications row (so it never shows in the bell) and omits the badge key
  // (so the app-icon badge — which tracks bell notifications — is left
  // untouched; chat unread is handled by the in-app chat badge).
  if (body.chat_push && body.email) {
    // Only a participant of this conversation may fire its "new message" push.
    const _caller = await callerEmail(req);
    if (!_caller) return json({ error: "unauthorized" }, 401);
    const _parts = String(body.chat_id || "").toLowerCase().split("|");
    if (_parts.length === 2 && !_parts.includes(_caller)) return json({ error: "forbidden" }, 403);
    const devices = await supaSelect(
      `device_tokens?email=eq.${encodeURIComponent(String(body.email).toLowerCase())}&select=token`,
    );
    if (!devices.length) return json({ sent: 0, reason: "no devices" });
    const accessToken = await getFirebaseAccessToken();
    const sender  = String(body.sender || "Someone");
    const preview = String(body.preview || "Sent a message");
    const chatId  = body.chat_id ? String(body.chat_id) : "";
    let sent = 0;
    const invalid: string[] = [];
    await Promise.all(devices.map(async (d: any) => {
      const msg = {
        message: {
          token: d.token,
          notification: { title: "New message", body: `${sender}: ${preview}` },
          data: chatId ? { link_url: `/chat.html?chat=${chatId}` } : {},
          apns: { payload: { aps: { sound: "default" } } }, // no badge key
        },
      };
      const res = await fetch(
        `https://fcm.googleapis.com/v1/projects/${FB_PROJECT_ID}/messages:send`,
        { method: "POST", headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(msg) },
      );
      if (res.ok) sent++;
      else {
        const errBody = await res.text();
        if (/UNREGISTERED|INVALID_ARGUMENT|NOT_FOUND/i.test(errBody)) invalid.push(d.token);
      }
    }));
    if (invalid.length) await supaDeleteTokens(invalid);
    return json({ sent, total: devices.length });
  }

  // ── Badge sync path ─────────────────────────────────────────────────────────
  // Called from the web app to update the OS app-icon badge via a silent
  // (content-available, no alert) push. The badge reflects the member's UNSEEN
  // count — notifications created since they last opened the bell — NOT the
  // unread count. Three intents:
  //   mark_seen  → stamp the seen-watermark to now (badge → 0). Fired when the
  //                bell is opened: the badge clears but items stay unread in the
  //                list to tap through.
  //   clear_badge→ force badge to 0 without moving the watermark (legacy alias).
  //   sync_badge → recompute badge = current unseen count.
  if ((body.sync_badge || body.clear_badge || body.mark_seen) && body.email) {
    const emailLc = String(body.email).toLowerCase();
    // You can only sync your OWN app-icon badge.
    const _caller = await callerEmail(req);
    if (!_caller || _caller !== emailLc) return json({ error: "forbidden" }, 403);

    // Opening the bell = seeing everything current: advance the watermark first,
    // so the unseen count below resolves to 0.
    if (body.mark_seen) await markSeen(emailLc);

    const devices = await supaSelect(
      `device_tokens?email=eq.${encodeURIComponent(emailLc)}&select=token`,
    );
    if (!devices.length) return json({ synced: 0, reason: "no devices" });

    // mark_seen / clear_badge both mean 0; sync recomputes unseen.
    const unread = (body.clear_badge || body.mark_seen) ? 0 : await unseenCount(emailLc);

    const accessToken = await getFirebaseAccessToken();
    let synced = 0;
    const invalid: string[] = [];
    await Promise.all(devices.map(async (d: any) => {
      const msg = {
        message: {
          token: d.token,
          apns: {
            headers: { "apns-priority": "5" },
            payload: { aps: { "content-available": 1, badge: unread } },
          },
        },
      };
      const res = await fetch(
        `https://fcm.googleapis.com/v1/projects/${FB_PROJECT_ID}/messages:send`,
        { method: "POST", headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(msg) },
      );
      if (res.ok) synced++;
      else {
        const errBody = await res.text();
        if (/UNREGISTERED|INVALID_ARGUMENT|NOT_FOUND/i.test(errBody)) invalid.push(d.token);
      }
    }));
    if (invalid.length) await supaDeleteTokens(invalid);
    return json({ synced, badge: unread, total: devices.length });
  }

  // Either resolve notification by id (DB webhook path) or take an explicit
  // payload (manual broadcast / future custom callers).
  let email: string, title: string, content: string, linkUrl: string | null, metadata: any, ntype = "";
  if (body.notification_id) {
    const rows = await supaSelect(
      `notifications?id=eq.${encodeURIComponent(body.notification_id)}&select=email,title,body,link_url,metadata,type,read`,
    );
    if (!rows.length) return json({ error: "notification not found" }, 404);
    // Rows inserted as already-read are silent seeds/backfills (e.g. the
    // one-time historical-achievement seed). They must NOT trigger a push —
    // otherwise opening the app fires a burst of pushes for old events.
    if (rows[0].read === true) return json({ sent: 0, reason: "row already read (silent seed)" });
    email    = rows[0].email;
    title    = rows[0].title;
    content  = rows[0].body || "";
    linkUrl  = rows[0].link_url || null;
    metadata = rows[0].metadata || {};
    ntype    = rows[0].type || "";
  } else if (body.email && body.title) {
    // Arbitrary push to an arbitrary address with arbitrary content = owner-only
    // (broadcasts to members go through the notifications table, not this path).
    const _caller = await callerEmail(req);
    if (_caller !== OWNER_EMAIL) return json({ error: "forbidden" }, 403);
    email    = body.email;
    title    = body.title;
    content  = body.body || "";
    linkUrl  = body.link_url || null;
    metadata = body.metadata || {};
    ntype    = body.type || "";
  } else {
    return json({ error: "either notification_id or {email,title} required" }, 400);
  }

  // ── Reformat for push: short headline as title, full detail as body ─────────
  // The DB title is a full sentence (good for the in-app bell) but makes an
  // ugly truncated push title. Map the notification type to a concise headline
  // and move the original sentence (+ any detail) into the push body.
  const PUSH_HEADLINE: Record<string, string> = {
    reaction:             "New reaction",
    comment_reply:        "New reply",
    new_comment:          "New comment",
    member_milestone:     "Member milestone",
    achievement:          "Achievement unlocked",
    event_rsvp:           "Event RSVP",
    event_reminder:       "Event reminder",
    goal_reminder:        "Goal reminder",
    weekly_focus:         "New weekly focus",
    practice_room_update: "Practice Room update",
    content_feed:         "New content",
    app_update:           "The Practice Room",
  };
  const pushTitle = PUSH_HEADLINE[ntype] || "The Practice Room";
  // Join the sentence + detail with natural punctuation rather than an em dash
  // (which reads a bit "auto-generated"). If the title already ends in
  // sentence punctuation, just add a space; otherwise a full stop.
  const pushBody = (() => {
    if (!content) return title;
    const t = title.trim();
    return /[.!?…:]$/.test(t) ? `${t} ${content}` : `${t}. ${content}`;
  })();

  // Look up devices for this email.
  const devices = await supaSelect(
    `device_tokens?email=eq.${encodeURIComponent(email.toLowerCase())}&select=token,platform`,
  );
  if (!devices.length) return json({ sent: 0, failed: 0, total: 0, reason: "no devices" });

  const accessToken = await getFirebaseAccessToken();

  // Badge = the recipient's UNSEEN count (notifications since they last opened
  // the bell) so the icon badge reflects "new to look at", not a pile of old
  // unread informational notifications. The row we're pushing for is itself
  // unseen, so this is always >= 1.
  let badge = 1;
  try {
    badge = Math.max(1, await unseenCount(email.toLowerCase()));
  } catch { /* fall back to 1 */ }

  // Coerce all metadata values to strings — FCM data payloads are string-only.
  const data: Record<string, string> = {};
  for (const [k, v] of Object.entries(metadata || {})) {
    if (v == null) continue;
    data[k] = typeof v === "string" ? v : JSON.stringify(v);
  }

  let sent = 0, failed = 0;
  const invalidTokens: string[] = [];
  await Promise.all(devices.map(async (d: any) => {
    const r = await sendOnePush({ token: d.token, title: pushTitle, body: pushBody, linkUrl, data, badge }, accessToken);
    if (r.ok) { sent++; }
    else      { failed++; if (r.invalid) invalidTokens.push(d.token); }
  }));

  // Clean up tokens FCM told us are dead so we don't keep retrying them.
  if (invalidTokens.length) await supaDeleteTokens(invalidTokens);

  return json({ sent, failed, total: devices.length, pruned: invalidTokens.length });
});
