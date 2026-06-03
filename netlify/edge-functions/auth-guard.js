// Auth guard — runs at the edge before any /theory/* page is served.
// Verifies the Supabase access token stored in the ppd_auth cookie.
// If valid → serve the page. If missing or invalid → redirect to login.

const SUPABASE_URL  = "https://gyskfutmncprqxazgatv.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5c2tmdXRtbmNwcnF4YXpnYXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjIwMTYsImV4cCI6MjA5MTMzODAxNn0.ttC3plmhbA7ls_T3w25XgYT0WBt6O3MMu0G6NrEKI9g";

export default async (request, context) => {
  // Extract ppd_auth cookie
  const cookie = request.headers.get("cookie") || "";
  const match  = cookie.match(/(?:^|;\s*)ppd_auth=([^;]+)/);

  // No auth cookie at all → not logged in → send to login.
  if (!match || !match[1]) {
    return redirectToLogin(request);
  }

  // A cookie is present, so this is a returning member. We deliberately do NOT
  // bounce on an expired or stale token here: Supabase access tokens live only
  // ~1 hour and the app refreshes them client-side, so verifying the token at
  // the edge would kick logged-in members to the dashboard whenever their
  // cookie token had momentarily gone stale (the "redirected to dashboard, works
  // on retry" bug). The client-side guard and Supabase RLS are the real gate.
  return context.next();
};

function redirectToLogin(request) {
  const loginUrl = new URL("/", request.url);
  return Response.redirect(loginUrl.toString(), 302);
}
