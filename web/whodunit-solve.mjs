/* Whodunit winnability: the journalist must have a deterministic path to a
 * proven conviction — in time, alive, on the right suspect — and the failure
 * paths must actually fail. Runs an ideal-investigator strategy per world.
 *
 *   node web/whodunit-solve.mjs [worldId]
 */
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const docs = resolve(here, "..", "docs");
const ctx = { console }; ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of ["config.js", "worlds/midnight.js", "worlds/halcyon.js", "engine.js", "whodunit.js"])
  vm.runInContext(readFileSync(resolve(docs, f), "utf8"), ctx);
const MV = ctx.MV;

// Ideal investigator: motive first (search), then means (examine a scene), then
// opportunity (interview two innocents), then accuse the killer.
function solve(G) {
  const mystery = G.mystery, killer = G.killer;
  let guard = 0;
  while (G.status === "playing" && guard++ < 50) {
    if (G.hasCase()) { G.accuse(killer); break; }
    const P = G.pillars();
    if (!P.has("motive")) G.investigate("search", mystery.motiveRoom);
    else if (!P.has("means") && G.deaths.length) G.investigate("examine", G.latestDeath().victim);
    else {
      // opportunity: interview a living innocent not yet interviewed
      const innocents = G.livingGuests().filter((n) => !G.interviewed.has(n));
      const who = innocents[0] || G.livingGuests()[0];
      if (who) G.investigate("interview", who);
    }
    if (G.hasCase()) { G.accuse(killer); break; }
    G.nightfall();
  }
  return { status: G.status, tier: G.result && G.result.tier, title: G.result && G.result.title, day: G.day, heat: G.heat };
}

function run(worldId) {
  MV.useWorld(worldId);
  const win = solve(MV.whodunit.create());

  // Failure paths must fail: wrong name, and the right name unproven.
  const g2 = MV.whodunit.create();
  const someoneElse = g2.order.find((n) => n !== g2.killer);
  g2.accuse(someoneElse);
  const g3 = MV.whodunit.create();
  g3.accuse(g3.killer);   // no evidence yet

  return {
    world: MV.world.locale.name, win,
    wrongName: g2.status === "lost",
    unproven: g3.status === "lost",
  };
}

const worlds = process.argv[2] ? [process.argv[2]] : Object.keys(MV.WORLDS);
let ok = true;
for (const id of worlds) {
  const r = run(id);
  const solved = r.win.status === "won";
  ok = ok && solved && r.wrongName && r.unproven;
  console.log(`${r.world}`);
  console.log(`  solve: ${r.win.status === "won" ? "WON" : "FAILED (" + r.win.title + ")"} on day ${r.win.day}, killer's-eye ${r.win.heat}/${MV.whodunit.HEAT_LETHAL}`);
  console.log(`  wrong accusation loses: ${r.wrongName ? "yes" : "NO"}   unproven accusation loses: ${r.unproven ? "yes" : "NO"}`);
}
console.log(ok ? "\nALL WORLDS SOLVABLE & FAILURE PATHS FAIL ✓" : "\nPROBLEM ✗");
process.exit(ok ? 0 : 1);
