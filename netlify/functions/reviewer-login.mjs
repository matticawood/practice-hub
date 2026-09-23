// Reviewer sign-in, checked on the server.
//
// Apple's reviewer signs in by typing a password, and that stays exactly as it
// was for them. What changed is where the password lives: it used to be a
// constant in index.html, which every visitor downloads, so anyone who viewed
// source could sign in as a member and see the whole room. It now lives in an
// environment variable here and never reaches the browser.
//
// The session is minted with the service key, so this function does not need
// the Supabase account's own password either. That lets the account password be
// rotated to something random without changing what the reviewer types.

const SUPABASE_URL = "https://gyskfutmncprqxazgatv.supabase.co";
const REVIEWER_EMAIL = "reviewer@matthewcawood.com";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SECRET      = process.env.REVIEWER_LOGIN_SECRET;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const ANON_KEY    = process.env.SUPABASE_ANON_KEY;
  if (!SECRET || !SERVICE_KEY || !ANON_KEY) return json({ error: "Not configured" }, 500);

  let body;
  try { body = await req.json(); } catch { return json({ error: "Invalid request" }, 400); }

  const supplied = String(body?.password ?? "");
  // constant-time-ish compare: same work whatever the input, so the response
  // time says nothing about how much of the password was right
  let mismatch = supplied.length === SECRET.length ? 0 : 1;
  for (let i = 0; i < Math.max(supplied.length, SECRET.length); i++) {
    if (supplied.charCodeAt(i) !== SECRET.charCodeAt(i)) mismatch |= 1;
  }
  if (mismatch) return json({ error: "Invalid password." }, 401);

  // mint a session for the reviewer account without needing its password
  const gen = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "magiclink", email: REVIEWER_EMAIL }),
  }).then(r => r.json()).catch(() => null);

  if (!gen?.hashed_token) return json({ error: "Could not start a session" }, 502);

  const verify = await fetch(
    `${SUPABASE_URL}/auth/v1/verify?type=magiclink&token=${encodeURIComponent(gen.hashed_token)}&redirect_to=${encodeURIComponent("https://app.matthewcawood.com/")}`,
    { redirect: "manual", headers: { apikey: ANON_KEY } }
  );
  const location = verify.headers.get("location") || "";
  const frag = new URLSearchParams((location.split("#")[1] || location.split("?")[1] || ""));
  const access_token  = frag.get("access_token");
  const refresh_token = frag.get("refresh_token");
  if (!access_token || !refresh_token) return json({ error: "Could not start a session" }, 502);

  return json({ access_token, refresh_token, email: REVIEWER_EMAIL });
};
