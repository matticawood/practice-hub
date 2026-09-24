/* Can a stranger still join, and can a member still get in?
 *
 * This asks the live app the same questions a real person's browser asks, using
 * only the public key that is already in the page source. No secrets, so it is
 * safe to run anywhere, any time, and it is worth running after any change to
 * policies, grants or triggers.
 *
 *   node scripts/check-join-and-login.mjs
 */
const APP  = "https://app.matthewcawood.com";
const BASE = "https://gyskfutmncprqxazgatv.supabase.co";

const page = await fetch(`${APP}/index.html`).then(r => r.text());
const ANON = (page.match(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/) || [])[0];
if (!ANON) { console.error("could not find the public key on the page"); process.exit(1); }

let failed = 0;
const ok = (label, good, detail = "") => {
  console.log(`  ${good ? "ok     " : "BROKEN "} ${label}${detail ? "  " + detail : ""}`);
  if (!good) failed++;
};
const rpc = async (fn, body) => {
  const r = await fetch(`${BASE}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: r.status, text: (await r.text()).trim() };
};

console.log("the pages a stranger sees");
for (const p of ["/signup/", "/join.html", "/welcome.html", "/index.html"]) {
  const r = await fetch(APP + p);
  ok(`${p} loads`, r.ok, `HTTP ${r.status}`);
}

console.log("what the signup page needs");
for (const fn of ["membership-price", "community-stats"]) {
  const r = await fetch(`${BASE}/functions/v1/${fn}`, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } });
  const body = await r.text();
  ok(`${fn} answers`, r.ok && body.length > 2, `HTTP ${r.status}`);
  if (fn === "membership-price") ok("  and it offers a checkout link", body.includes("checkoutUrl"));
}

console.log("the gate that decides whether you may log in");
const member = await rpc("is_member", { p_email: "mortenjensen@me.com" });
ok("a member is recognised", member.status === 200 && member.text === "true", `HTTP ${member.status} ${member.text}`);
const stranger = await rpc("is_member", { p_email: "nobody@example.invalid" });
ok("a stranger is turned away", stranger.status === 200 && stranger.text === "false", `HTTP ${stranger.status}`);
const canon = await rpc("resolve_login_email", { p_email: "mortenjensen@me.com" });
ok("an address resolves", canon.status === 200 && canon.text.includes("@"), `HTTP ${canon.status}`);

console.log("and nothing private is readable without logging in");
for (const t of ["allowed_emails", "member_identities"]) {
  const r = await fetch(`${BASE}/rest/v1/${t}?select=email&limit=1`, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } });
  const body = await r.text();
  ok(`${t} gives a stranger nothing`, !r.ok || body.trim() === "[]", `HTTP ${r.status}`);
}

console.log(failed ? `\n${failed} BROKEN` : "\na stranger can join and a member can log in");
process.exit(failed ? 1 : 0);
