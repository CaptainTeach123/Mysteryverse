/* Inline the modular docs/ site into a single self-contained HTML file.
 *
 *   node web/build.mjs [outfile]
 *
 * The multi-file version in docs/ is the source of truth (and what deploys to
 * Cloudflare Pages / GitHub Pages). This produces a one-file build for hosts
 * that want a single artifact, or for a strict-CSP embed. Same code, inlined.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const docs = resolve(here, "..", "docs");
const read = (f) => readFileSync(resolve(docs, f), "utf8");

const css = read("styles.css");
const scripts = ["config.js", "worlds/midnight.js", "engine.js", "art.js", "chronicle.js", "story.js", "content.js", "app.js"]
  .map((f) => `<script>\n${read(f)}\n</script>`).join("\n");

// Body content only — no <!doctype>/<html>/<head>/<body>, so this drops
// straight into an Artifact skeleton, and is also valid standalone.
const page = `<title>Ravenhollow Manor — A Game of Intrigue</title>
<style>
${css}
</style>
<div class="topbar">
  <span class="brand">Ravenhollow Manor</span>
  <button class="iconbtn" id="theme" type="button" aria-label="Toggle light or dark theme">Theme</button>
</div>
<main class="wrap" id="app"></main>
<footer class="wrap" style="padding-top:0">
  A fixed gamebook — every outcome is pre-determined, and it runs entirely in your browser.
</footer>
${scripts}
`;

const out = process.argv[2] || resolve(here, "..", "dist", "ravenhollow.html");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, page);
console.log("wrote", out, `(${(page.length / 1024).toFixed(0)} KB)`);
