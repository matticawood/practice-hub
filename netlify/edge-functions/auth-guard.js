// Auth guard — runs at the edge before any /theory/* page is served.
// Verifies the Supabase access token stored in the ppd_auth cookie.
// If valid → serve the page. If missing or invalid → redirect to login.

const SUPABASE_URL  = "https://gyskfutmncprqxazgatv.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5c2tmdXRtbmNwcnF4YXpnYXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjIwMTYsImV4cCI6MjA5MTMzODAxNn0.ttC3plmhbA7ls_T3w25XgYT0WBt6O3MMu0G6NrEKI9g";

export default async (request, context) => {
  // Extract ppd_auth cookie
  const cookie = request.headers.get("cookie") || "";
  const match  = cookie.match(/(?:^|;\s*)ppd_auth=([^;]+)/);

  if (!match) {
    return redirectToLogin(request);
  }

  const token = decodeURIComponent(match[1]);

  // Verify token against Supabase — this is a real server-side network call
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "apikey": SUPABASE_ANON
      }
    });

    if (res.ok) {
      return context.next(); // valid session — serve the page
    }
  } catch (e) {
    // Network error — fail closed (deny access)
  }

  return redirectToLogin(request);
};

function redirectToLogin(request) {
  const loginUrl = new URL("/", request.url);
  return Response.redirect(loginUrl.toString(), 302);
}
