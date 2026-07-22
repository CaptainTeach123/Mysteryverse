/* Winnability check: every one of the seven guests must have a DETERMINISTIC
 * path to Triumph (their mark dies by their hand, and they are the sole
 * survivor, uncaught). This replays a headless "play to win" strategy for each
 * protagonist and reports the outcome. If any guest can't reach Triumph, the
 * mechanics need tuning — this is the guardrail for that promise.
 *
 *   node web/winnability.mjs
 */
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const docs = resolve(here, "..", "docs");
const ctx = { console };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ["config.js", "worlds/midnight.js", "engine.js", "content.js"]) vm.runInContext(readFileSync(resolve(docs, f), "utf8"), ctx);
const MV = ctx.MV, last = MV.last;
// node web/winnability.mjs [worldId]  — defaults to the built-in Ravenhollow.
if (process.argv[2]) MV.useWorld(process.argv[2]);

// A deterministic strategy that tries to win as the given guest.
function strategyChoose(g, me, known) {
  return {
    // Day intent: hunt the mark while alive (get to them and finish it);
    // otherwise arm up if empty-handed; otherwise lie low and let the house thin.
    intent() {
      const mark = g.byName[me.target];
      if (mark.alive && !mark.caught) return "hunt";
      if (me.carrying === null && !canPoisonAnywhere(g, me)) return "arm";
      // If only the mark's killer-work is done, hunt the last rival to end it.
      const others = g.living().filter((c) => c.name !== me.name);
      return others.length <= 1 ? "hunt" : "lielow";
    },
  };
}
function canPoisonAnywhere(g, me) { return MV.helpers.skill(me, "poison") >= 3; }

// Play one full game as `name` with the winning strategy; return the outcome.
async function play(name) {
  const mark = MV.buildCast().find((c) => c.name === name).target;
  const g = new MV.Game({ playerName: name, reservedMark: mark });
  const me = g.byName[name];
  const known = MV.content.initialKnownHunters(g, name);
  const knows = name === "Cornelius Blackwood";
  g.log({ type: "prologue" });

  let finale = false;
  while (g.living().length > 1 && g.day < g.maxDays) {
    g.day += 1; g.murderToday = null;
    g.log({ type: "daybreak", day: g.day });

    // ---- intent -> destination
    // Winning line: lie low (safe) until only you and your mark remain, then
    // hunt them down and take the reckoning that is yours to give.
    const intents = MV.content.dayIntents(g, me);
    const onlyMarkLeft = g.living().length <= 2;
    const want = onlyMarkLeft ? "hunt" : "lielow";
    g.playerHidden = want === "lielow";
    const chosen = intents.find((i) => i.key === want) || intents[0];
    const goal = resolveGoal(g, me, chosen.goal, knows);
    if (goal) stepToward(g, me, goal, 5, knows);

    // ---- encounter -> action
    const subject = pickSubject(g, me, known);
    const opts = MV.content.sceneOptions(g, me, subject, known);
    const pick = pickAction(g, me, subject, opts);
    applyAction(g, me, pick, subject, known);

    // ---- world moves; a body falls
    advanceNpcs(g, me);
    absorb(g, me, known);
    if (!g.murderToday && g.living().length > 1) g.forceMurder();
    g.resolveExposure(); g.decaySuspicion();
    absorb(g, me, known);
    const alive = g.living().length;
    if (alive <= 1) break;
    if (alive === 2) { if (finale) break; else finale = true; }
  }
  const result = g.finish();
  const oc = MV.content.outcome(result, name);
  return { tier: oc.tier, winner: result.winner, days: g.day, deaths: result.deaths.length, me };
}

// Strategy: at the scene, strike the mark if it will succeed and is unseen;
// else lull the mark to set up a clean kill; else strike any rival you can kill
// cleanly and unseen (to be the day's murderer and stay safe); else arm; else
// withdraw / lie low.
function pickAction(g, me, subject, opts) {
  const isMark = subject && subject.name === me.target;
  const strike = opts.find((o) => o.kind === "strike");
  // Take the guaranteed reckoning against the mark the instant it's offered.
  if (isMark && strike && strike.willSucceed && !strike.witnessed) return strike;
  // Otherwise stay safe: withdraw.
  return opts.find((o) => o.kind === "withdraw") || opts[opts.length - 1];
}

// ---- helpers mirrored from the app -----------------------------------
function resolveGoal(g, me, kind, knows) {
  if (kind === "mark") { const m = g.byName[me.target]; if (m.alive && !m.caught) return m.room; kind = "rival"; }
  if (kind === "rival") { let b = null, bd = 1e9; for (const o of g.living()) { if (o.name === me.name) continue; const d = g.mansion.bfsDistance(me.room, o.room, knows); if (d !== null && d < bd) { bd = d; b = o.room; } } return b; }
  if (kind === "arm") { let b = null, bd = 1e9; for (const [n, r] of Object.entries(g.mansion.rooms)) { const u = r.weapon !== null || (r.providesPoison && MV.helpers.skill(me, "poison") >= 3); if (!u) continue; const d = g.mansion.bfsDistance(me.room, n, knows); if (d !== null && d < bd) { bd = d; b = n; } } return b; }
  // safe
  const hunters = g.living().filter((c) => c.target === me.name);
  let best = me.room, bestKey = null;
  for (const [n, r] of Object.entries(g.mansion.rooms)) {
    if (g.mansion.bfsDistance(me.room, n, knows) === null) continue;
    let minH = 99; for (const h of hunters) { const d = g.mansion.bfsDistance(n, h.room, knows); if (d !== null) minH = Math.min(minH, d); }
    const key = [minH, r.lure ? 1 : 0, -g.inRoom(n).length, n];
    if (bestKey === null || cmp(key, bestKey) > 0) { bestKey = key; best = n; }
  }
  return best;
}
const cmp = (a, b) => { for (let i = 0; i < a.length; i++) { if (a[i] < b[i]) return -1; if (a[i] > b[i]) return 1; } return 0; };
function stepToward(g, me, goal, steps, knows) { for (let i = 0; i < steps && me.room !== goal; i++) { const s = g.mansion.firstStep(me.room, goal, knows); if (!s) break; g.move(me, s, false); } }
function pickSubject(g, me, known) { const here = g.inRoom(me.room, me.name); const mark = g.byName[me.target]; if (here.includes(mark)) return mark; const kh = here.find((c) => known.has(c.name)); if (kh) return kh; return here.length ? here[0] : null; }
function applyAction(g, me, opt, subject, known) {
  if (!opt) return;
  if (opt.kind === "strike") { if (opt.guaranteed) g._commitKill(me, subject, opt.method, opt.weapon, false); else g.resolveAttempt(me, subject, opt.method, opt.weapon, opt.witnessed); }
  else if (opt.kind === "lull") { subject._lulledBy = me.name; me.suspicion = Math.max(0, me.suspicion - 1); }
  else if (opt.kind === "deflect") me.suspicion = Math.max(0, me.suspicion - 1);
  else if (opt.kind === "arm") { const r = g.mansion.rooms[me.room]; if (r.weapon) g.apply(me, { kind: "arm" }); }
  else if (opt.kind === "withdraw") { const ex = g.mansion.neighbors(me.room, me.name === "Cornelius Blackwood"); if (ex.length) g.move(me, ex[0], false); }
}
function advanceNpcs(g, me) {
  const cap = g.turnsPerDay; const settle = g.murderToday ? 1 : cap;
  for (let t = 0; t < settle; t++) { let acted = false;
    for (const actor of g.orderedLiving()) { if (actor.name === me.name || !actor.alive || actor.caught) continue; const o = g.options(actor); if (!o.length) continue; g.apply(actor, MV.autoChoose(g, actor, o)); acted = true; if (g.murderToday) break; }
    if (g.murderToday || !acted) break; }
}
function absorb(g, me, known) { for (const m of g.memory[me.name]) if (m.kind === "attacked") known.add(m.culprit); }

// ---- run for all seven ------------------------------------------------
const names = MV.buildCast().map((c) => c.name);
let allWin = true;
for (const name of names) {
  const r = await play(name);
  const ok = r.tier === "triumph";
  allWin = allWin && ok;
  console.log(`${ok ? "TRIUMPH " : r.tier.toUpperCase().padEnd(8)} ${last(name).padEnd(10)}  winner=${r.winner ? last(r.winner) : "none"}  days=${r.days} deaths=${r.deaths}`);
}
console.log(allWin ? "\nALL SEVEN CAN WIN ✓" : "\nNOT ALL CAN WIN ✗");
process.exit(allWin ? 0 : 1);
