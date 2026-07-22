/* Mysteryverse — flat mid-century SVG art (Clue meets Jonny Quest).
 * Parametric character portraits and room backdrops. Pure strings, no DOM.
 * Every guest and every room is a fixed, hand-tuned composition — no external
 * images, so the whole thing ships as static files with zero runtime cost.
 */
(function (root) {
  "use strict";

  // Per-guest palette + feature flags. Limited palettes, heavy ink outlines.
  const INK = "#17110f";
  const FACES = {
    "Dr. Adrian Vell": {
      bg: "#20464a", bg2: "#163134", skin: "#e6c6a4", hair: "#b7b0a2",
      coat: "#26262c", trim: "#cfc8b8", accent: "#2f8f83",
      hairStyle: "sweptGrey", glasses: true,
    },
    "Miss Isolde Frayne": {
      bg: "#6d4a1c", bg2: "#4a3213", skin: "#f0d3b2", hair: "#9c4a2a",
      coat: "#caa24a", trim: "#e7dcc4", accent: "#e6a23c",
      hairStyle: "wave", hat: "veil",
    },
    "Colonel Roderick Mace": {
      bg: "#5a231c", bg2: "#3d1712", skin: "#d7a07a", hair: "#8f897c",
      coat: "#3f4a35", trim: "#d9b23c", accent: "#c14232",
      hairStyle: "crop", mustache: "walrus", scar: true, epaulettes: true,
    },
    "Silas Crane": {
      bg: "#6a5417", bg2: "#463710", skin: "#e6c6a0", hair: "#2e2622",
      coat: "#b98a2e", trim: "#2e2622", accent: "#d9a441",
      hairStyle: "slick", mustache: "pencil", check: true,
    },
    "Lady Bianca Ashford": {
      bg: "#48233f", bg2: "#301629", skin: "#f0d6bd", hair: "#6a4a2a",
      coat: "#7a2f4f", trim: "#e7dcc4", accent: "#b8557f",
      hairStyle: "updo", jewels: true, fur: true,
    },
    "Cornelius Blackwood": {
      bg: "#3a1414", bg2: "#260d0d", skin: "#d9b48c", hair: "#201a17",
      coat: "#2a2320", trim: "#7a2018", accent: "#9c2b22",
      hairStyle: "widowsPeak", beard: "vandyke", smoking: true,
    },
    "Mother Genevieve": {
      bg: "#1f2a3a", bg2: "#141b26", skin: "#e2cbb2", hair: "#1a1a20",
      coat: "#26262c", trim: "#e7dcc4", accent: "#3f7fa0",
      hairStyle: "hidden", hat: "coif", severe: true,
    },
  };

  function portrait(name, size) {
    const f = FACES[name] || genFace(name);
    if (!f) return "";
    const s = size || 240;
    const el = [];
    el.push(`<svg viewBox="0 0 200 240" width="${s}" height="${s * 1.2}" role="img" aria-label="Portrait of ${name}">`);
    // frame + arched vignette
    el.push(`<defs>
      <radialGradient id="bg-${uid(name)}" cx="50%" cy="38%" r="75%">
        <stop offset="0%" stop-color="${f.bg}"/>
        <stop offset="100%" stop-color="${f.bg2}"/>
      </radialGradient>
      <clipPath id="arch-${uid(name)}"><path d="M12 40 Q12 12 100 12 Q188 12 188 40 L188 228 L12 228 Z"/></clipPath>
    </defs>`);
    el.push(`<g clip-path="url(#arch-${uid(name)})">`);
    el.push(`<rect x="0" y="0" width="200" height="240" fill="url(#bg-${uid(name)})"/>`);
    // shoulders / garment
    el.push(garment(f));
    // neck + head
    el.push(`<rect x="86" y="120" width="28" height="26" rx="10" fill="${f.skin}" stroke="${INK}" stroke-width="3"/>`);
    el.push(`<ellipse cx="100" cy="98" rx="34" ry="40" fill="${f.skin}" stroke="${INK}" stroke-width="3.5"/>`);
    // ears
    el.push(`<circle cx="66" cy="100" r="6" fill="${f.skin}" stroke="${INK}" stroke-width="3"/>`);
    el.push(`<circle cx="134" cy="100" r="6" fill="${f.skin}" stroke="${INK}" stroke-width="3"/>`);
    // features
    el.push(features(f));
    el.push(hair(f));
    el.push(headwear(f));
    el.push(facialHair(f));
    if (f.glasses) el.push(glasses(f));
    if (f.scar) el.push(`<path d="M120 86 l8 14" stroke="${f.accent}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`);
    el.push(`</g>`);
    // ink frame
    el.push(`<path d="M12 40 Q12 12 100 12 Q188 12 188 40 L188 228 L12 228 Z" fill="none" stroke="${INK}" stroke-width="5"/>`);
    el.push(`<path d="M12 40 Q12 12 100 12 Q188 12 188 40 L188 228 L12 228 Z" fill="none" stroke="${f.accent}" stroke-width="1.5"/>`);
    el.push(`</svg>`);
    return el.join("");
  }

  function garment(f) {
    let g = `<path d="M40 240 Q40 168 100 158 Q160 168 160 240 Z" fill="${f.coat}" stroke="${INK}" stroke-width="3.5"/>`;
    // lapels / collar
    g += `<path d="M100 158 L78 240 M100 158 L122 240" stroke="${INK}" stroke-width="3" fill="none"/>`;
    if (f.trim) g += `<path d="M100 158 L86 210 L100 200 L114 210 Z" fill="${f.trim}" stroke="${INK}" stroke-width="2"/>`;
    if (f.check) {
      g += `<g stroke="${f.trim}" stroke-width="1.5" opacity="0.5">`;
      for (let x = 46; x < 158; x += 12) g += `<line x1="${x}" y1="160" x2="${x}" y2="240"/>`;
      for (let y = 168; y < 240; y += 12) g += `<line x1="42" y1="${y}" x2="160" y2="${y}"/>`;
      g += `</g>`;
    }
    if (f.epaulettes) g += `<rect x="40" y="168" width="24" height="10" fill="${f.trim}" stroke="${INK}" stroke-width="2"/><rect x="136" y="168" width="24" height="10" fill="${f.trim}" stroke="${INK}" stroke-width="2"/>`;
    if (f.fur) g += `<path d="M62 178 Q100 150 138 178" fill="none" stroke="${f.trim}" stroke-width="10" stroke-linecap="round" opacity="0.9"/>`;
    if (f.smoking) g += `<path d="M100 158 L74 240 L92 240 L100 176 L108 240 L126 240 Z" fill="${f.trim}" stroke="${INK}" stroke-width="2"/>`;
    if (f.jewels) g += `<circle cx="100" cy="176" r="4" fill="#e7dcc4" stroke="${INK}" stroke-width="1.5"/><circle cx="88" cy="182" r="3" fill="#e7dcc4"/><circle cx="112" cy="182" r="3" fill="#e7dcc4"/>`;
    return g;
  }

  function features(f) {
    const brow = f.severe ? 78 : 82;
    let e = `<g stroke="${INK}" stroke-width="3" stroke-linecap="round">`;
    e += `<line x1="80" y1="${brow}" x2="94" y2="${brow + (f.severe ? 3 : 1)}"/>`;
    e += `<line x1="120" y1="${brow}" x2="106" y2="${brow + (f.severe ? 3 : 1)}"/>`;
    e += `</g>`;
    // eyes
    e += `<circle cx="87" cy="92" r="3.4" fill="${INK}"/><circle cx="113" cy="92" r="3.4" fill="${INK}"/>`;
    // nose hint + mouth
    e += `<path d="M100 96 l-4 12 l6 0" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;
    e += `<path d="M90 118 Q100 ${f.severe ? 118 : 124} 110 118" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    return e;
  }

  function hair(f) {
    const h = f.hair;
    switch (f.hairStyle) {
      case "sweptGrey":
        return `<path d="M64 84 Q66 50 100 52 Q136 50 136 84 Q124 66 100 66 Q78 66 64 84 Z" fill="${h}" stroke="${INK}" stroke-width="3"/>`;
      case "wave":
        return `<path d="M62 96 Q58 52 100 50 Q142 52 138 96 Q140 70 118 62 Q126 78 108 74 Q118 60 96 62 Q70 64 62 96 Z" fill="${h}" stroke="${INK}" stroke-width="3"/>`;
      case "crop":
        return `<path d="M66 82 Q68 56 100 56 Q132 56 134 82 L126 74 Q100 66 74 74 Z" fill="${h}" stroke="${INK}" stroke-width="3"/>`;
      case "slick":
        return `<path d="M64 86 Q66 52 100 54 Q134 52 136 86 Q118 70 100 72 Q100 60 90 66 Q78 66 64 86 Z" fill="${h}" stroke="${INK}" stroke-width="3"/>`;
      case "updo":
        return `<path d="M66 82 Q64 50 100 50 Q136 50 134 82 Q120 66 100 66 Q80 66 66 82 Z" fill="${h}" stroke="${INK}" stroke-width="3"/>`
          + `<ellipse cx="100" cy="44" rx="18" ry="12" fill="${h}" stroke="${INK}" stroke-width="3"/>`;
      case "widowsPeak":
        return `<path d="M64 86 Q66 52 100 54 Q134 52 136 86 Q120 70 108 68 L100 80 L92 68 Q80 70 64 86 Z" fill="${h}" stroke="${INK}" stroke-width="3"/>`;
      default:
        return "";
    }
  }

  function headwear(f) {
    if (f.hat === "veil") {
      return `<path d="M60 66 Q100 40 140 66 L140 74 Q100 56 60 74 Z" fill="${f.accent}" stroke="${INK}" stroke-width="3"/>`
        + `<path d="M62 70 Q100 96 138 70" fill="none" stroke="${f.trim}" stroke-width="1.5" opacity="0.6"/>`;
    }
    if (f.hat === "coif") {
      return `<path d="M56 100 Q54 44 100 42 Q146 44 144 100 Q140 70 100 68 Q60 70 56 100 Z" fill="${f.coat}" stroke="${INK}" stroke-width="3.5"/>`
        + `<path d="M64 96 Q62 56 100 54 Q138 56 136 96" fill="none" stroke="${f.trim}" stroke-width="4"/>`;
    }
    return "";
  }

  function facialHair(f) {
    if (f.mustache === "walrus")
      return `<path d="M80 112 Q100 122 120 112 Q112 122 100 120 Q88 122 80 112 Z" fill="${f.hair}" stroke="${INK}" stroke-width="2.5"/>`;
    if (f.mustache === "pencil")
      return `<path d="M88 112 L112 112" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    if (f.beard === "vandyke")
      // A goatee tuft below the lip plus a moustache above it — kept clear of
      // the mouth so it doesn't read as an open mouth.
      return `<path d="M90 126 Q100 133 110 126 Q108 141 100 143 Q92 141 90 126 Z" fill="${f.hair}" stroke="${INK}" stroke-width="2.5"/>`
        + `<path d="M85 111 Q100 117 115 111" fill="none" stroke="${f.hair}" stroke-width="4" stroke-linecap="round"/>`;
    return "";
  }

  function glasses(f) {
    return `<g fill="none" stroke="${INK}" stroke-width="3">
      <circle cx="87" cy="92" r="10"/><circle cx="113" cy="92" r="10"/>
      <line x1="97" y1="92" x2="103" y2="92"/><line x1="77" y1="90" x2="67" y2="94"/><line x1="123" y1="90" x2="133" y2="94"/></g>`;
  }

  // ---- rooms ------------------------------------------------------------
  const ROOM_ART = {
    "Foyer": { wall: "#3a3f47", floor: "#20242a", accent: "#9aa2ad" },
    "Grand Hall": { wall: "#43372c", floor: "#241c14", accent: "#c99a55" },
    "Library": { wall: "#3a2c22", floor: "#241a13", accent: "#c98b4a" },
    "Study": { wall: "#2c3a34", floor: "#182420", accent: "#2f8f83" },
    "Conservatory": { wall: "#20352f", floor: "#132019", accent: "#4fae7a" },
    "Dining Room": { wall: "#4a2c26", floor: "#271512", accent: "#e0a13c" },
    "Kitchen": { wall: "#3a3a34", floor: "#20201c", accent: "#b7b0a0" },
    "Cellar": { wall: "#241f26", floor: "#141018", accent: "#7a5f8f" },
    "Ballroom": { wall: "#2f2a3e", floor: "#1a1626", accent: "#c8b06a" },
    "Gallery": { wall: "#37231f", floor: "#1f1310", accent: "#b8557f" },
    "Landing": { wall: "#2b303a", floor: "#171b23", accent: "#7f97b0" },
    "Master Bedroom": { wall: "#3a2431", floor: "#20131c", accent: "#b8557f" },
    "Garden": { wall: "#26303a", floor: "#182028", accent: "#5f89a0" },
  };

  function room(name) {
    const r = ROOM_ART[name] || genRoomArt(name);
    const id = uid("r" + name);
    const el = [];
    el.push(`<svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" role="img" aria-label="The ${name}">`);
    el.push(`<defs>
      <linearGradient id="w-${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${shade(r.wall, 1.15)}"/>
        <stop offset="100%" stop-color="${r.wall}"/>
      </linearGradient>
      <radialGradient id="v-${id}" cx="50%" cy="42%" r="72%">
        <stop offset="55%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.55"/>
      </radialGradient></defs>`);
    el.push(`<rect width="400" height="184" fill="url(#w-${id})"/>`);
    el.push(`<rect y="184" width="400" height="76" fill="${r.floor}"/>`);
    el.push(`<line x1="0" y1="184" x2="400" y2="184" stroke="#000" stroke-opacity="0.3" stroke-width="2"/>`);
    el.push(motif(name, r));
    el.push(`<rect width="400" height="260" fill="url(#v-${id})"/>`);
    el.push(`</svg>`);
    return el.join("");
  }

  function motif(name, r) {
    const a = r.accent, ink = "rgba(0,0,0,0.55)";
    const sil = (d) => `<path d="${d}" fill="${ink}"/>`;
    switch (name) {
      case "Foyer": // grandfather clock + checker floor
        return sil("M186 60 h28 v120 h-28 z M182 56 h36 v10 h-36 z")
          + `<circle cx="200" cy="92" r="13" fill="${a}"/><line x1="200" y1="92" x2="200" y2="83" stroke="#000" stroke-width="2"/><line x1="200" y1="92" x2="207" y2="95" stroke="#000" stroke-width="2"/>`
          + checker(r.floor);
      case "Grand Hall": // staircase + antlers
        return sil("M40 180 L40 150 L90 150 L90 120 L140 120 L140 90 L190 90 L190 180 Z")
          + `<path d="M300 60 q-14 -26 -30 -16 M300 60 q14 -26 30 -16 M300 60 q-6 -30 0 -34 M300 60 q6 -30 0 -34" stroke="${a}" stroke-width="3" fill="none"/>`;
      case "Library": // bookshelves
        { let s = ""; for (let x = 40; x < 360; x += 40) { for (let y = 40; y < 176; y += 26) { const c = [a, r.floor, "#7a5a3a", "#4a6a5a"][(x + y) % 4]; s += `<rect x="${x}" y="${y}" width="34" height="22" fill="${c}" opacity="0.7"/>`; } } return s + sil("M36 40 h328 v6 h-328 z"); }
      case "Study": // desk + decanter
        return sil("M120 150 h160 v34 h-160 z M132 184 h12 v40 h-12 z M256 184 h12 v40 h-12 z")
          + `<rect x="300" y="128" width="16" height="22" rx="3" fill="${a}"/><rect x="150" y="132" width="40" height="18" fill="rgba(0,0,0,0.4)"/>`;
      case "Conservatory": // ferns + panes + rain
        return panes() + fern(70, r.accent) + fern(320, r.accent) + rain();
      case "Dining Room": // long table + candles
        return sil("M60 150 h280 v20 h-280 z M80 170 h10 v46 h-10 z M310 170 h10 v46 h-10 z")
          + `<g>${[120, 170, 220, 270].map((x) => `<rect x="${x}" y="128" width="5" height="22" fill="#e7dcc4"/><circle cx="${x + 2.5}" cy="126" r="5" fill="${a}"/>`).join("")}</g>`;
      case "Kitchen": // hanging pots + cleaver
        return `<line x1="120" y1="40" x2="280" y2="40" stroke="rgba(0,0,0,0.5)" stroke-width="3"/>`
          + [150, 195, 240].map((x) => `<path d="M${x - 14} 44 a14 14 0 0 0 28 0 z" fill="${ink}"/>`).join("")
          + `<rect x="300" y="60" width="10" height="60" fill="${a}"/><path d="M296 60 h34 v22 h-34 z" fill="${ink}"/>`;
      case "Cellar": // wine racks + bulb
        { let s = ""; for (let x = 60; x < 340; x += 30) for (let y = 90; y < 176; y += 22) s += `<circle cx="${x}" cy="${y}" r="7" fill="${ink}"/><circle cx="${x}" cy="${y}" r="3" fill="${a}" opacity="0.6"/>`; return s + `<line x1="200" y1="20" x2="200" y2="56" stroke="rgba(0,0,0,0.5)" stroke-width="2"/><circle cx="200" cy="62" r="8" fill="${a}"/>`; }
      case "Ballroom": // chandelier + mirror
        return `<line x1="200" y1="20" x2="200" y2="44" stroke="rgba(0,0,0,0.5)" stroke-width="2"/>`
          + `<path d="M170 44 h60 l-10 26 h-40 z" fill="${a}" opacity="0.85"/>`
          + [178, 192, 206, 220].map((x) => `<line x1="${x}" y1="70" x2="${x}" y2="86" stroke="${a}" stroke-width="2"/>`).join("")
          + sil("M300 60 h70 v110 h-70 z") + `<rect x="306" y="66" width="58" height="98" fill="${shade(r.wall, 1.3)}" opacity="0.5"/>`;
      case "Gallery": // framed portraits + empty frame
        return [60, 150, 300].map((x) => `<rect x="${x}" y="60" width="60" height="80" fill="none" stroke="${a}" stroke-width="4"/><rect x="${x + 8}" y="68" width="44" height="64" fill="${ink}"/>`).join("")
          + `<rect x="228" y="60" width="52" height="80" fill="none" stroke="${a}" stroke-width="4" stroke-dasharray="6 5"/>`;
      case "Landing": // row of doors + storm window
        return [50, 130, 270, 350].map((x) => `<rect x="${x - 22}" y="70" width="44" height="110" fill="${ink}"/><circle cx="${x + 12}" cy="128" r="3" fill="${a}"/>`).join("")
          + `<rect x="176" y="60" width="48" height="90" fill="${shade(r.wall, 0.7)}"/>` + `<path d="M186 66 l14 30 l-8 0 l12 40" stroke="${a}" stroke-width="2" fill="none"/>` + rain();
      case "Master Bedroom": // four-poster bed
        return sil("M90 80 h20 v110 h-20 z M290 80 h20 v110 h-20 z M90 80 h220 v14 h-220 z M110 140 h180 v40 h-180 z")
          + `<rect x="110" y="150" width="180" height="14" fill="${a}" opacity="0.8"/>`;
      case "Garden": // sundial + broken bridge + rain
        return `<ellipse cx="200" cy="200" rx="34" ry="12" fill="${ink}"/><path d="M200 200 l-6 -26" stroke="${a}" stroke-width="3"/>`
          + sil("M20 150 q60 -30 120 -10 M260 150 q60 20 120 -6")
          + rain();
      default:
        return "";
    }
    function checker(dark) {
      let s = "";
      for (let x = 0; x < 400; x += 40) for (let y = 184; y < 260; y += 20) if (((x / 40) + ((y - 184) / 20)) % 2 === 0) s += `<rect x="${x}" y="${y}" width="40" height="20" fill="#e7dcc4" opacity="0.16"/>`;
      return s;
    }
    function panes() { let s = ""; for (let x = 30; x < 400; x += 60) s += `<line x1="${x}" y1="20" x2="${x}" y2="184" stroke="${r.accent}" stroke-width="1.5" opacity="0.3"/>`; for (let y = 40; y < 184; y += 44) s += `<line x1="0" y1="${y}" x2="400" y2="${y}" stroke="${r.accent}" stroke-width="1.5" opacity="0.3"/>`; return s; }
    function fern(cx, col) { let s = ""; for (let i = -3; i <= 3; i++) s += `<path d="M${cx} 184 q${i * 16} -60 ${i * 22} -110" stroke="${col}" stroke-width="3" fill="none" opacity="0.8"/>`; return s; }
    function rain() { let s = `<g stroke="${r.accent}" stroke-width="1.4" opacity="0.35">`; for (let i = 0; i < 40; i++) { const x = (i * 53) % 400, y = (i * 71) % 184; s += `<line x1="${x}" y1="${y}" x2="${x - 6}" y2="${y + 14}"/>`; } return s + `</g>`; }
  }

  // Title-card manor silhouette against a storm sky.
  function manor() {
    return `<svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Ravenhollow Manor in the storm">
      <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#241b22"/><stop offset="100%" stop-color="#0e0a0d"/></linearGradient></defs>
      <rect width="800" height="300" fill="url(#sky)"/>
      <g stroke="#e6a23c" stroke-width="1.2" opacity="0.5">
        <path d="M150 0 l20 60 l-12 0 l24 80" fill="none"/><path d="M620 20 l16 44 l-10 0 l20 66" fill="none"/></g>
      <g fill="#0a0709">
        <rect x="250" y="150" width="300" height="150"/>
        <rect x="300" y="90" width="60" height="120"/><rect x="440" y="90" width="60" height="120"/>
        <path d="M300 90 l30 -34 l30 34 z"/><path d="M440 90 l30 -34 l30 34 z"/>
        <path d="M250 150 l150 -70 l150 70 z"/>
        <rect x="140" y="200" width="110" height="100"/><rect x="550" y="200" width="110" height="100"/>
      </g>
      <g fill="#e6a23c" opacity="0.9">
        <rect x="386" y="170" width="28" height="40"/><rect x="180" y="230" width="18" height="26"/><rect x="600" y="230" width="18" height="26"/></g>
      <g stroke="#000" stroke-opacity="0.5" stroke-width="3">${(() => { let s = ""; for (let x = 20; x < 800; x += 40) s += `<line x1="${x}" y1="0" x2="${x - 12}" y2="30"/>`; return s; })()}</g>
    </svg>`;
  }

  // ---- generated fallbacks for dropped-in casts / locales --------------
  const HAIRS = ["#2e2622", "#8f897c", "#9c4a2a", "#b7b0a2", "#5a3a24", "#20232a"];
  const SKINS = ["#e6c6a4", "#d7a07a", "#f0d6bd", "#c9946a", "#e2cbb2"];
  const ACCENTS = ["#2f8f83", "#e6a23c", "#c14232", "#b8557f", "#4f8fae", "#7a9c3a"];
  const BGS = ["#20464a", "#5a231c", "#48233f", "#1f2a3a", "#3a2c22", "#2c3a34", "#42372c"];
  const HAIRSTYLES = ["crop", "slick", "wave", "sweptGrey", "updo", "widowsPeak"];
  function hnum(s) { let h = 0; for (let i = 0; i < (s || "").length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff; return h; }
  function genFace(name) {
    const h = hnum(name);
    const bg = BGS[h % BGS.length];
    return {
      bg, bg2: shade(bg, 0.7), skin: SKINS[(h >> 3) % SKINS.length],
      hair: HAIRS[(h >> 5) % HAIRS.length], coat: shade(bg, 0.55),
      trim: "#e7dcc4", accent: ACCENTS[(h >> 7) % ACCENTS.length],
      hairStyle: HAIRSTYLES[(h >> 9) % HAIRSTYLES.length],
    };
  }
  function genRoomArt(name) {
    const h = hnum(name);
    const wall = BGS[(h >> 2) % BGS.length];
    return { wall, floor: shade(wall, 0.5), accent: ACCENTS[(h >> 4) % ACCENTS.length] };
  }

  // A moody moon over a misty forest — the landing-page backdrop.
  function moonScene() {
    // deterministic tree-lines (no randomness)
    const pines = (baseY, minH, maxH, step, fill, jig) => {
      let s = "";
      for (let x = -30, i = 0; x < 1640; x += step, i++) {
        const h = minH + ((i * 53 + jig) % (maxH - minH));
        const w = 14 + ((i * 29) % 20);
        s += `<path d="M${x - w} ${baseY} L${x} ${baseY - h} L${x + w} ${baseY} Z" fill="${fill}"/>`;
        s += `<rect x="${x - 2}" y="${baseY - h}" width="4" height="${h}" fill="${fill}"/>`;
      }
      return s;
    };
    const maria = [[720, 340, 70, 46], [820, 300, 40, 34], [760, 430, 55, 40], [660, 380, 34, 30], [860, 400, 30, 26]]
      .map(([cx, cy, rx, ry]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#6f6553" opacity="0.35"/>`).join("");
    return `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" role="img" aria-label="A great moon over a dark forest">
      <defs>
        <radialGradient id="ms-sky" cx="48%" cy="40%" r="70%"><stop offset="0%" stop-color="#2a231d"/><stop offset="55%" stop-color="#14100d"/><stop offset="100%" stop-color="#070605"/></radialGradient>
        <radialGradient id="ms-halo" cx="50%" cy="42%" r="50%"><stop offset="0%" stop-color="#d8cdb8" stop-opacity="0.35"/><stop offset="60%" stop-color="#d8cdb8" stop-opacity="0.05"/><stop offset="100%" stop-color="#d8cdb8" stop-opacity="0"/></radialGradient>
        <radialGradient id="ms-moon" cx="42%" cy="36%" r="66%"><stop offset="0%" stop-color="#e4d9c3"/><stop offset="62%" stop-color="#c3b79e"/><stop offset="100%" stop-color="#8f8472"/></radialGradient>
        <clipPath id="ms-disk"><circle cx="770" cy="380" r="280"/></clipPath>
        <filter id="ms-mist" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="34"/></filter>
        <radialGradient id="ms-vig" cx="50%" cy="46%" r="75%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.72"/></radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#ms-sky)"/>
      <circle cx="770" cy="380" r="470" fill="url(#ms-halo)"/>
      <circle cx="770" cy="380" r="280" fill="url(#ms-moon)"/>
      <g clip-path="url(#ms-disk)">${maria}
        <circle cx="640" cy="300" r="10" fill="#5f5545" opacity="0.4"/><circle cx="900" cy="330" r="8" fill="#5f5545" opacity="0.4"/><circle cx="700" cy="500" r="7" fill="#5f5545" opacity="0.35"/>
      </g>
      <g class="ms-fog ms-fog-a" fill="#cdbfa0" opacity="0.07" filter="url(#ms-mist)">
        <ellipse cx="420" cy="560" rx="440" ry="80"/><ellipse cx="1120" cy="600" rx="400" ry="74"/>
      </g>
      <g class="ms-fog ms-fog-b" fill="#b8ab8e" opacity="0.06" filter="url(#ms-mist)">
        <ellipse cx="820" cy="500" rx="480" ry="70"/><ellipse cx="300" cy="660" rx="360" ry="80"/><ellipse cx="1300" cy="640" rx="360" ry="70"/>
      </g>
      ${pines(760, 40, 120, 46, "#0b0a09", 7)}
      ${pines(900, 120, 300, 40, "#040404", 19)}
      <rect width="1600" height="900" fill="url(#ms-vig)"/>
    </svg>`;
  }

  // A classic white motor-yacht at sunset off a cliff coast — the Halcyon.
  function yacht() {
    const portholes = (() => { let s = ""; for (let x = 430; x < 1170; x += 66) s += `<circle cx="${x}" cy="632" r="9" fill="#14263a"/><circle cx="${x}" cy="632" r="9" fill="none" stroke="#c79a3e" stroke-width="1.5"/>`; return s; })();
    const cypress = (cx, h) => `<path d="M${cx} 540 q-14 -${h} 0 -${h + 20} q14 ${20} 0 ${h}" fill="#20361f"/><rect x="${cx - 2}" y="530" width="4" height="20" fill="#20361f"/>`;
    return `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" role="img" aria-label="A classic motor-yacht at sunset">
      <defs>
        <linearGradient id="y-sky" x1="0" y1="0" x2="1" y2="0.7"><stop offset="0%" stop-color="#26407e"/><stop offset="52%" stop-color="#7a6a94"/><stop offset="78%" stop-color="#e79a4a"/><stop offset="100%" stop-color="#f2c069"/></linearGradient>
        <radialGradient id="y-cloud" cx="40%" cy="40%" r="70%"><stop offset="0%" stop-color="#f6e6c8"/><stop offset="100%" stop-color="#e0a05e"/></radialGradient>
        <radialGradient id="y-vig" cx="50%" cy="45%" r="75%"><stop offset="60%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.5"/></radialGradient>
      </defs>
      <rect width="1600" height="700" fill="url(#y-sky)"/>
      <g fill="url(#y-cloud)" opacity="0.95"><ellipse cx="380" cy="230" rx="200" ry="90"/><ellipse cx="560" cy="270" rx="150" ry="70"/><ellipse cx="1180" cy="200" rx="230" ry="95"/><ellipse cx="1360" cy="250" rx="160" ry="70"/></g>
      <!-- cliff coast, left -->
      <path d="M0 700 L0 300 Q120 250 200 360 Q300 480 260 700 Z" fill="#b56a34"/>
      <path d="M0 700 L0 360 Q90 330 150 430 Q210 540 180 700 Z" fill="#8f4f26"/>
      ${cypress(150, 70)}${cypress(190, 90)}${cypress(230, 64)}
      <!-- sea -->
      <rect y="650" width="1600" height="250" fill="#173763"/>
      <g stroke="#3f6ea0" stroke-width="3" opacity="0.5"><line x1="0" y1="720" x2="1600" y2="712"/><line x1="0" y1="790" x2="1600" y2="800"/><line x1="0" y1="860" x2="1600" y2="852"/></g>
      <!-- the yacht (bow to the left) -->
      <g>
        <path d="M300 612 L1230 596 L1230 660 L360 692 Q320 660 300 612 Z" fill="#ece3d0"/>
        <path d="M300 612 L1230 596" fill="none" stroke="#c79a3e" stroke-width="4"/>
        <path d="M360 692 L1230 660 L1230 672 L372 700 Z" fill="#16233b"/>
        ${portholes}
        <!-- main deck cabin -->
        <rect x="520" y="524" width="700" height="86" fill="#ece3d0"/><rect x="540" y="540" width="640" height="46" fill="#0f2033"/><rect x="520" y="520" width="700" height="6" fill="#c79a3e"/>
        <!-- upper deck -->
        <rect x="610" y="452" width="540" height="74" fill="#ece3d0"/><rect x="628" y="466" width="486" height="42" fill="#0f2033"/><rect x="610" y="448" width="540" height="6" fill="#c79a3e"/>
        <!-- wheelhouse -->
        <path d="M700 452 L700 402 L980 402 L980 452 Z" fill="#ece3d0"/><rect x="716" y="412" width="250" height="34" fill="#0f2033"/>
        <!-- funnel + mast + radar -->
        <rect x="1000" y="404" width="46" height="60" rx="8" fill="#1a2740"/>
        <line x1="940" y1="402" x2="940" y2="270" stroke="#b79552" stroke-width="4"/><line x1="905" y1="300" x2="975" y2="300" stroke="#b79552" stroke-width="3"/><circle cx="940" cy="262" r="9" fill="#e7dcc4"/>
        <!-- railings -->
        <g stroke="#c79a3e" stroke-width="1.6" opacity="0.9"><line x1="360" y1="596" x2="1230" y2="584"/><line x1="620" y1="524" x2="1150" y2="516"/></g>
        <!-- wake -->
        <path d="M300 640 Q220 660 150 690 Q240 678 320 674 Z" fill="#eef4f6" opacity="0.85"/>
      </g>
      <rect width="1600" height="900" fill="url(#y-vig)"/>
    </svg>`;
  }

  // ---- small utils ------------------------------------------------------
  function uid(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffff; return h.toString(36); }
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.round(((n >> 16) & 255) * f));
    const g = Math.min(255, Math.round(((n >> 8) & 255) * f));
    const b = Math.min(255, Math.round((n & 255) * f));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  }

  root.MV = root.MV || {};
  // Per-world hero art: a title-card scene chosen by the world's `cover`.
  function cover(kind) {
    if (kind === "yacht") return yacht();
    if (kind === "moon") return moonScene();
    return manor();
  }

  root.MV.art = { portrait, room, manor, moonScene, yacht, cover, palette: (n) => FACES[n], roomPalette: (n) => ROOM_ART[n] };
})(typeof globalThis !== "undefined" ? globalThis : this);
