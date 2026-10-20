#!/usr/bin/env node
/* upload-course-videos.mjs — put a folder of lesson videos into Mux.
 *
 * Settings are copied from the existing course assets rather than chosen:
 * basic video quality, 1080p ceiling, public playback, no mp4 renditions.
 *
 * Resumable by design. Every finished upload is written to the map file the
 * moment its playback id exists, and a re-run skips anything already there, so
 * a dropped connection costs one file rather than the whole set.
 *
 *   node upload-course-videos.mjs "<folder>" [--map out.json] [--dry]
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ENV_FILE = "/Users/matthewcawood/The Practice Room Database/.env.local";
const env = Object.fromEntries(readFileSync(ENV_FILE, "utf8").split("\n")
  .filter(l => l.includes("=")).map(l => {
    const i = l.indexOf("=");
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
  }));
const AUTH = "Basic " + Buffer.from(
  (env.MUX_TOKEN_ID || env.MUX_KEY_ID) + ":" + (env.MUX_TOKEN_SECRET || env.MUX_SECRET_KEY)
).toString("base64");

const args = process.argv.slice(2);
const DIR = args.find(a => !a.startsWith("--"));
const MAP = (args.includes("--map") ? args[args.indexOf("--map") + 1] : null)
  || join(DIR || ".", "mux-map.json");
const DRY = args.includes("--dry");
if (!DIR) { console.error("usage: node upload-course-videos.mjs <folder>"); process.exit(1); }

const sleep = ms => new Promise(r => setTimeout(r, ms));
const mux = async (path, init) => {
  const r = await fetch("https://api.mux.com/video/v1" + path, {
    ...init, headers: { Authorization: AUTH, "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(path + " -> " + r.status + " " + JSON.stringify(j).slice(0, 200));
  return j.data;
};

/* "Lesson 9 - Spotting Diffficult Sections.mp4" -> { n:9, title:"Spotting Difficult Sections" } */
function parse(name) {
  const m = name.match(/^Lesson\s+(\d+)\s*[-–]\s*(.+)\.(mp4|mov|m4v)$/i);
  if (!m) return null;
  return { n: Number(m[1]), title: m[2].trim(), file: name };
}

const files = readdirSync(DIR).map(parse).filter(Boolean).sort((a, b) => a.n - b.n);
const map = existsSync(MAP) ? JSON.parse(readFileSync(MAP, "utf8")) : {};
console.log(`${files.length} lessons found, ${Object.keys(map).length} already uploaded`);
if (DRY) { files.forEach(f => console.log(`  ${String(f.n).padStart(2)}  ${f.title}${map[f.file] ? "  [done]" : ""}`)); process.exit(0); }

for (const f of files) {
  if (map[f.file]?.playbackId) { console.log(`  ${String(f.n).padStart(2)}  skip (done)  ${f.title}`); continue; }
  const path = join(DIR, f.file);
  const mb = Math.round(statSync(path).size / 1048576);
  process.stdout.write(`  ${String(f.n).padStart(2)}  ${f.title} (${mb}MB) … `);
  try {
    const up = await mux("/uploads", {
      method: "POST",
      body: JSON.stringify({
        cors_origin: "*",
        new_asset_settings: {
          playback_policy: ["public"],
          video_quality: "basic",
          max_resolution_tier: "1080p",
        },
      }),
    });
    // curl rather than fetch: these are up to 2GB and curl streams from disk
    // without holding the file in memory, and reports a real exit code.
    execFileSync("curl", ["-sS", "-f", "-X", "PUT", "-H", "Content-Type: video/mp4",
      "--upload-file", path, up.url], { stdio: ["ignore", "ignore", "pipe"], timeout: 3 * 3600 * 1000 });
    process.stdout.write("uploaded, encoding ");

    let assetId = null;
    for (let i = 0; i < 240 && !assetId; i++) {
      await sleep(5000);
      const u = await mux("/uploads/" + up.id);
      if (u.asset_id) assetId = u.asset_id;
      else if (u.status === "errored") throw new Error("upload errored: " + JSON.stringify(u.error || {}));
    }
    if (!assetId) throw new Error("no asset after 20 minutes");

    let asset = null;
    for (let i = 0; i < 360; i++) {
      asset = await mux("/assets/" + assetId);
      if (asset.status === "ready") break;
      if (asset.status === "errored") throw new Error("asset errored: " + JSON.stringify(asset.errors || {}));
      await sleep(5000);
      if (i % 12 === 0) process.stdout.write(".");
    }
    if (asset.status !== "ready") throw new Error("asset not ready after 30 minutes");

    const playbackId = (asset.playback_ids || [])[0]?.id;
    map[f.file] = { n: f.n, title: f.title, assetId, playbackId,
                    duration: Math.round(asset.duration || 0) };
    writeFileSync(MAP, JSON.stringify(map, null, 1));     // written per file, so a crash loses one
    console.log(` ready  ${playbackId}  ${Math.round(asset.duration || 0)}s`);
  } catch (e) {
    console.log(` FAILED  ${String(e.message).slice(0, 160)}`);
  }
}
const done = Object.keys(map).length;
console.log(`\n${done}/${files.length} uploaded. Map: ${MAP}`);
