import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { deriveStreakState } = require("../shared-streak.js");

function range(startISO, n){ const out=[]; let d=new Date(startISO+"T12:00:00"); for(let i=0;i<n;i++){ out.push(d.toISOString().slice(0,10)); d.setDate(d.getDate()+1);} return out; }
let fails=0;
function chk(label, res, exp){
  const okS = res.saved_dates.length===exp.saves, okStk = exp.streak===undefined||res.current_streak===exp.streak;
  const ok = okS && okStk; if(!ok) fails++;
  console.log(`${ok?"PASS":"**FAIL**"}  ${label}`);
  console.log(`        saves=${res.saved_dates.length}/${exp.saves}  streak=${res.current_streak}${exp.streak!==undefined?"/"+exp.streak:""}  bal=${res.balance} earned=${res.total_earned}${res.saved_dates.length?"  "+JSON.stringify(res.saved_dates):""}`);
}

console.log("=== REGRESSION: normal members unchanged ===");
chk("20 days straight (correct tz)", deriveStreakState(range("2026-06-13",20),"America/Los_Angeles",new Date("2026-07-02T18:00:00Z")), {saves:0,streak:20});
chk("100 days straight, cap overflow", deriveStreakState(range("2026-03-01",100),"America/Los_Angeles",new Date("2026-06-09T20:00:00Z")), {saves:0,streak:100});
// 2 real missed days beyond grace (10 days -> 2 tokens; miss 06-11,06-12; 06-13 grace; today 06-14)
chk("2 missed days beyond grace -> 2 real saves", deriveStreakState(range("2026-06-01",10),"America/Los_Angeles",new Date("2026-06-14T18:00:00Z")), {saves:2,streak:12});
// long gap > balance: 2 tokens, then break
chk("long gap exhausts saves then breaks", deriveStreakState(range("2026-06-01",10),"America/Los_Angeles",new Date("2026-06-25T18:00:00Z")), {saves:2,streak:0});

console.log("\n=== GRACE: yesterday is still open (more forgiving, no early burn) ===");
chk("missed only yesterday -> 0 saves, streak alive", deriveStreakState(range("2026-06-01",10),"America/Los_Angeles",new Date("2026-06-12T18:00:00Z")), {saves:0,streak:10});

console.log("\n=== HOLE #1 FIXED: wrong/null tz can no longer phantom-burn ===");
{ const dates=range("2026-06-20",12); const nowEveningLA=new Date("2026-07-03T03:00:00Z"); // LA 07-02 20:00
  chk("null/UTC tz, western evening (was 1, must be 0)", deriveStreakState(dates,"UTC",nowEveningLA), {saves:0});
  chk("  ...correct LA tz, same instant", deriveStreakState(dates,"America/Los_Angeles",nowEveningLA), {saves:0}); }

console.log("\n=== HOLE #2: date-line skip (write-time fix: consistent-tz dating) ===");
{ const nowNZ=new Date("2026-07-05T00:00:00Z"); // Auckland 12:00 07-05 -> today 07-05, grace 07-04
  const buggy=[...range("2026-06-26",5),...range("2026-07-02",3)]; // 06-26..06-30 (banks a token), 07-02..07-04 (07-01 skipped)
  chk("device-tz dating skips a day -> phantom save (needs write-time fix)", deriveStreakState(buggy,"Pacific/Auckland",nowNZ), {saves:1});
  const fixed=range("2026-06-27",8); // same 8 sessions dated in ONE consistent tz -> 06-27..07-04 consecutive
  chk("FIX: dates anchored to one tz -> no gap -> 0 saves", deriveStreakState(fixed,"Pacific/Auckland",nowNZ), {saves:0}); }

console.log(`\n${fails===0?"ALL PASS":fails+" FAILURES"}`);
