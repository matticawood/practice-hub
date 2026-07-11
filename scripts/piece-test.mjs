// Test helper for the custom-piece objective feature.
//   node scripts/piece-test.mjs seed   <email> "<title>" [daysAgo=20]   -> create a dormant custom learning piece
//   node scripts/piece-test.mjs active <email> "<title>"                -> create an ACTIVE custom piece (practised today; should NOT show on the card)
//   node scripts/piece-test.mjs status <email>                          -> list the member's custom pieces + completed-tier counts
//   node scripts/piece-test.mjs clean  <email> "<titlePrefix>"          -> delete test pieces whose title starts with the prefix
import { readFileSync } from "node:fs";
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = k => (env.match(new RegExp("^" + k + "=(.*)$", "m")) || [])[1];
const URL_ = get("SUPABASE_URL"), KEY = get("SUPABASE_SERVICE_KEY") || get("SUPABASE_SERVICE_ROLE_KEY");
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const api = (path, opts = {}) => fetch(URL_ + "/rest/v1/" + path, { ...opts, headers: { ...H, ...(opts.headers || {}) } });

const [, , cmd, email, arg, arg2] = process.argv;
if (!cmd || !email) { console.error("need: <cmd> <email> ..."); process.exit(1); }

async function findPiece(title) {
  const r = await api(`user_pieces?email=eq.${encodeURIComponent(email)}&title=eq.${encodeURIComponent(title)}&select=id`);
  return (await r.json())[0];
}
async function seed(title, daysAgo) {
  let p = await findPiece(title);
  if (!p) {
    const ins = await api("user_pieces", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ email, title }) });
    p = (await ins.json())[0];
  }
  const iso = new Date(Date.now() - daysAgo * 86400000).toISOString();
  await api(`user_pieces?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({ last_practiced_at: iso, dormancy_acked_at: null, difficulty: null }) });
  // ensure a learning collection row
  const cr = await api(`user_collections?email=eq.${encodeURIComponent(email)}&user_piece_id=eq.${p.id}&select=status`);
  if (!(await cr.json()).length) await api("user_collections", { method: "POST", body: JSON.stringify({ email, user_piece_id: p.id, status: "learning" }) });
  else await api(`user_collections?email=eq.${encodeURIComponent(email)}&user_piece_id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({ status: "learning" }) });
  console.log(`seeded "${title}" (id ${p.id}) last_practiced ${daysAgo}d ago -> ${daysAgo >= 14 ? "DORMANT (should show on card)" : "ACTIVE (should NOT show)"}`);
}

if (cmd === "seed")   await seed(arg, arg2 ? Number(arg2) : 20);
else if (cmd === "active") await seed(arg, 0);
else if (cmd === "status") {
  const up = await (await api(`user_pieces?email=eq.${encodeURIComponent(email)}&select=id,title,difficulty,last_practiced_at,dormancy_acked_at`)).json();
  const uc = await (await api(`user_collections?email=eq.${encodeURIComponent(email)}&select=status,piece_id,pieces(difficulty),user_piece_id,user_pieces(title,difficulty)`)).json();
  const days = d => d ? Math.round((Date.now() - new Date(d).getTime()) / 86400000) + "d ago" : "never";
  console.log("Custom pieces:");
  up.forEach(p => {
    const col = uc.find(c => c.user_piece_id === p.id);
    console.log(`  [${p.id}] "${p.title}"  status:${col ? col.status : "(none)"}  difficulty:${p.difficulty == null ? "-" : p.difficulty}  practised:${days(p.last_practiced_at)}  acked:${days(p.dormancy_acked_at)}`);
  });
  const tiers = uc.filter(c => c.status === "completed").map(c => c.pieces?.difficulty ?? c.user_pieces?.difficulty).filter(d => d != null).sort();
  console.log("Completed-piece tiers (feed the goals):", JSON.stringify(tiers));
}
else if (cmd === "clean") {
  const up = await (await api(`user_pieces?email=eq.${encodeURIComponent(email)}&title=like.${encodeURIComponent(arg + "%")}&select=id,title`)).json();
  for (const p of up) {
    await api(`user_collections?email=eq.${encodeURIComponent(email)}&user_piece_id=eq.${p.id}`, { method: "DELETE" });
    await api(`user_pieces?id=eq.${p.id}`, { method: "DELETE" });
    console.log(`deleted "${p.title}" (id ${p.id})`);
  }
  if (!up.length) console.log("nothing matched prefix", JSON.stringify(arg));
}
else console.error("unknown cmd", cmd);
