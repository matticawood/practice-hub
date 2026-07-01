/* One-time YouTube OAuth: mints a long-lived refresh token for the channel owner
   so the Idea Studio can read YouTube ANALYTICS (retention, watch time, traffic,
   subscribers gained per video). A plain API key cannot access that API
   (it returns 401 "API keys are not supported by this API").

   Prereqs, all in the SAME Google Cloud project as YOUTUBE_API_KEY_NEW:
     1. APIs & Services > Library > enable "YouTube Analytics API".
        (The "YouTube Data API v3" should already be enabled.)
     2. APIs & Services > OAuth consent screen:
          - User type: External
          - App name + your email
          - Add scope:  https://www.googleapis.com/auth/yt-analytics.readonly
          - PUBLISH the app (set Publishing status to "In production").
            This matters: a refresh token from an app left in "Testing" mode
            EXPIRES after 7 days. Published = it persists.
     3. APIs & Services > Credentials > Create credentials > OAuth client ID:
          - Application type: Desktop app
          - Copy the Client ID and Client secret into .env.local as:
              YT_OAUTH_CLIENT_ID=...
              YT_OAUTH_CLIENT_SECRET=...

   Then run:   node scripts/yt-oauth.mjs
   It opens a Google consent page. If you see an "unverified app" warning, click
   Advanced > Go to <app> (it is your own app). Approve, and it writes
   YT_OAUTH_REFRESH_TOKEN back into .env.local.
*/
import { readFileSync, writeFileSync } from "node:fs";
import http from "node:http";
import { exec } from "node:child_process";

const ENV = new URL("../.env.local", import.meta.url);
const env = readFileSync(ENV, "utf8");
const g = (k) => (env.match(new RegExp("^" + k + "=(.+)$", "m")) || [])[1]?.trim();

const CLIENT_ID = g("YT_OAUTH_CLIENT_ID");
const CLIENT_SECRET = g("YT_OAUTH_CLIENT_SECRET");
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing YT_OAUTH_CLIENT_ID / YT_OAUTH_CLIENT_SECRET in .env.local.\nCreate a Desktop OAuth client in Google Cloud Console first (see the header of this file).");
  process.exit(1);
}

const PORT = 8754;
const REDIRECT = `http://localhost:${PORT}`;
const SCOPE = [
  "https://www.googleapis.com/auth/yt-analytics.readonly",
  "https://www.googleapis.com/auth/youtube.readonly",
].join(" ");

const authUrl = "https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT,
  response_type: "code",
  scope: SCOPE,
  access_type: "offline",
  prompt: "consent",
});

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, REDIRECT);
  const code = u.searchParams.get("code");
  const err = u.searchParams.get("error");
  if (err) { res.end("Consent error: " + err + ". You can close this tab and re-run."); server.close(); return; }
  if (!code) { res.statusCode = 204; res.end(); return; }
  try {
    const tr = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT, grant_type: "authorization_code",
      }),
    });
    const tok = await tr.json();
    if (!tok.refresh_token) {
      res.end("No refresh_token returned. Revoke prior access at myaccount.google.com/permissions, then re-run.");
      console.error("\nNo refresh_token. Response:", tok);
      server.close();
      return;
    }
    let e = readFileSync(ENV, "utf8");
    if (/^YT_OAUTH_REFRESH_TOKEN=/m.test(e)) e = e.replace(/^YT_OAUTH_REFRESH_TOKEN=.*$/m, `YT_OAUTH_REFRESH_TOKEN=${tok.refresh_token}`);
    else e = e.replace(/\s*$/, "") + `\nYT_OAUTH_REFRESH_TOKEN=${tok.refresh_token}\n`;
    writeFileSync(ENV, e);
    res.end("Done. Refresh token saved to .env.local. You can close this tab.");
    console.log("\n✓ Saved YT_OAUTH_REFRESH_TOKEN to .env.local");
    console.log("  (starts:", tok.refresh_token.slice(0, 14) + "...)");
    console.log("\nNext: set the three secrets on Supabase and deploy yt-analytics (the assistant will do this).");
    server.close();
  } catch (e2) {
    res.end("Error exchanging code: " + e2.message);
    console.error(e2);
    server.close();
  }
});

server.listen(PORT, () => {
  console.log("\nOpening Google consent in your browser. If it does not open, paste this URL:\n\n" + authUrl + "\n");
  console.log("If warned the app is unverified: Advanced > Go to <app> (it is your own app).\n");
  exec(`open "${authUrl}"`);
});
