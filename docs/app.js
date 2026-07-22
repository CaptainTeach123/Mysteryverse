/* Mysteryverse — the whodunit controller.
 *
 * You are the journalist. One guest is a killer; a body falls each night. You
 * investigate — examine, search, interview — to assemble the three pillars of a
 * case (means, motive, opportunity) and name the culprit before the storm lifts,
 * the house empties, or the killer notices you first. Deterministic; no network.
 */
(function () {
  "use strict";
  const MV = window.MV, A = MV.art, S = MV.story, W = MV.whodunit, esc = escapeHtml;
  const app = document.getElementById("app");
  const shortName = W.shortName;
  let G = null;

  // ---- theme ------------------------------------------------------------
  const root = document.documentElement;
  const saved = localStorage.getItem("mv-theme");
  if (saved) root.setAttribute("data-theme", saved);
  document.getElementById("theme").addEventListener("click", () => {
    const cur = root.getAttribute("data-theme")
      || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("mv-theme", next);
  });

  const show = (html) => { app.innerHTML = html; window.scrollTo({ top: 0 }); };
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
  const localeName = () => MV.world.locale.name;
  const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };

  // =====================================================================
  //  TITLE
  // =====================================================================
  function hero() {
    document.querySelector(".brand").textContent = localeName();
    const suspects = MV.world.cast.length;
    show(`
      <section class="hero">
        <div class="art">${A.manor()}</div>
        <div class="hero-copy">
          <div class="kicker">A Whodunit</div>
          <h1>${esc(cap(localeName()))}</h1>
          <p class="tag">A storm has cut the house off from the world, and one of the
            guests is quietly murdering the rest. You are the reporter who came to cover
            the gathering — and now has until the last dawn to prove who did it, before
            the story files itself under your own name.</p>
          <div class="btnrow">
            <button class="btn" id="begin" type="button">Take the assignment</button>
          </div>
        </div>
      </section>
      ${worldbar()}
      <div class="section-head"><h2>How the investigation works</h2></div>
      <p style="max-width:64ch">Each day you make one move — <b>examine</b> a scene, <b>search</b>
        a room, or <b>interview</b> a guest — and add what you find to your case file. You are
        building toward three pillars against the killer: <b>means</b>, <b>motive</b>, and
        <b>opportunity</b>. Assemble all three and name them, and you break the story. But every
        night the killer claims another life; pry too close and it will be yours; and a name
        cried out without proof is the last mistake you'll make. Nothing here is random —
        the truth is fixed, and findable, if you're quick and careful enough.</p>`);
    on("begin", invitation);
    const sel = document.getElementById("worldpick");
    if (sel) sel.onchange = () => {
      MV.useWorld(sel.value);
      try { history.replaceState(null, "", location.pathname + "?world=" + encodeURIComponent(sel.value)); } catch (e) { /* file:// */ }
      hero();
    };
  }

  function worldbar() {
    const worlds = Object.values(MV.WORLDS);
    if (worlds.length < 2) return "";
    const opts = worlds.map((w) =>
      `<option value="${esc(w.id)}" ${w.id === MV.world.id ? "selected" : ""}>${esc(cap(w.locale.name))}</option>`).join("");
    return `<div class="worldbar">
      <label for="worldpick">Choose your mystery</label>
      <select id="worldpick" aria-label="Choose your mystery">${opts}</select>
      <span class="worldcount">${worlds.length} cases and counting</span>
    </div>`;
  }

  // =====================================================================
  //  INVITATION (the journalist's letter)
  // =====================================================================
  function invitation() {
    const j = MV.world.journalist;
    const place = cap(localeName());
    const given = j.name.replace(/^(Dr|Lady|Miss|Colonel|Mother|Mr|Mrs|Sir|Lord|Countess|Count|Conductor|Sister|Father|Captain)\.?\s+/, "");
    show(`
      <div class="env-stage">
        <div class="envelope" id="env">
          <div class="letter">
            <div class="letterhead">${esc(place)}</div>
            <p class="dear">Dear ${esc(given)},</p>
            <p>Your editor has done you a great favour, or a terrible one. You are to travel to
              ${esc(place)} and file a colour piece on the gathering there — a reunion of sorts,
              of people who all, it is said, share a certain history.</p>
            <p class="sig">— the assignment desk</p>
            <hr/>
            <p><i>You arrive to find the bridge gone and the telephone dead. And on the first
              night, a guest does not come down to breakfast — not that morning, nor any morning
              after.</i></p>
            <p class="purpose">You are ${esc(j.name)}, ${esc(j.title)}. One of these people is
              killing the others, one a night, and means to leave no one alive to tell it. You have
              until the storm lifts to prove which of them it is — with means, motive, and
              opportunity all three — and live to print it.</p>
            <div class="btnrow" style="margin-top:18px"><button class="btn" id="enter" type="button">Take out your notebook</button></div>
          </div>
          <div class="env-pocket"></div>
          <div class="env-flap"></div>
          <div class="wax">✦</div>
        </div>
      </div>`);
    const env = document.getElementById("env");
    on("enter", personae);
    if (reduced()) env.classList.add("open");
    else requestAnimationFrame(() => setTimeout(() => env.classList.add("open"), 120));
  }

  // =====================================================================
  //  DRAMATIS PERSONAE (your suspects)
  // =====================================================================
  function personae() {
    const cards = MV.world.cast.map((c) => {
      const top = Object.entries(c.skills || {}).sort((a, b) => b[1] - a[1]).slice(0, 2);
      return `<article class="card">
        <div class="pic">${A.portrait(c.name, 240)}</div>
        <div class="body">
          <div><h3>${esc(c.name)}</h3><div class="title">${esc(c.title)}</div></div>
          <div class="chips">${top.map(([k, v]) => `<span class="chip skill">${k} ${v}</span>`).join("")}</div>
          <p class="motive">${esc(MV.content && MV.content.hook ? MV.content.hook(c) : (c.hook || ""))}</p>
        </div>
      </article>`;
    }).join("");
    show(`
      <div class="section-head"><h2>The Guests</h2>
        <button class="iconbtn" id="back" type="button">Back</button></div>
      <p style="max-width:64ch;margin-top:-6px">Every one of them has a reason to be nervous, and
        a secret worth hiding. One of them is a murderer. Your job is to find out which — before
        the house runs out of guests, or you run out of nights.</p>
      <div class="gallery">${cards}</div>
      <div class="btnrow" style="margin-top:20px"><button class="btn" id="start" type="button">Begin the first day</button></div>`);
    on("back", hero);
    on("start", startGame);
  }

  // =====================================================================
  //  THE INVESTIGATION LOOP
  // =====================================================================
  function startGame() { G = W.create(); G.beginDay(); renderDay(); }

  function hud() {
    const pillars = G.pillars();
    const P = (k, label) => `<div class="pill ${pillars.has(k) ? "got" : ""}">${label}</div>`;
    const heatPct = Math.min(100, Math.round((G.heat / W.HEAT_LETHAL) * 100));
    return `<aside class="side">
      <div class="who">${A.portrait(G.journalist.name, 46)}
        <div><div class="nm">${esc(G.journalist.name)}</div><div class="ti">${esc(G.journalist.title)}</div></div></div>
      <div class="stat"><span class="k">The day</span><span class="v">${G.day} of ${G.deadline()}</span></div>
      <div class="stat"><span class="k">Suspects left</span><span class="v">${G.livingSuspects().length}</span></div>
      <div class="stat"><span class="k">Killer's eye on you</span><span class="v"><span class="susp"><i style="width:${heatPct}%"></i></span></span></div>
      <h4 style="margin-top:14px">The case</h4>
      <div class="pillars">${P("means", "Means")}${P("motive", "Motive")}${P("opportunity", "Opportunity")}</div>
      <div class="btnrow" style="margin-top:14px;flex-direction:column;gap:8px">
        <button class="btn ghost" id="casebtn" type="button">Open the case file</button>
        <button class="btn" id="accusebtn" type="button" ${G.hasCase() ? "" : ""}>Name the killer</button>
      </div>
    </aside>`;
  }

  function renderDay() {
    if (G.status !== "playing") return renderEnd();
    const news = G.latestDeath()
      ? `<p class="daymono"><b>${esc(shortName(G.byName[G.latestDeath().victim]))} is dead</b> — found in the ${esc(G.latestDeath().room)}. The company is one fewer, and no one meets anyone's eye.</p>`
      : `<p class="daymono">No one has died yet. But the bridge is gone, the doors are locked against the storm, and something in the house has already decided how the week will end.</p>`;
    const approaches = G.approaches().map((a) =>
      `<button class="choice intent" data-k="${a.key}" type="button">
        <span class="lab">${esc(a.label)}</span><span class="fc">${esc(a.blurb)}</span></button>`).join("");
    show(`
      <div class="stage">
        <div>
          <div class="section-head"><h2>Day ${G.day}</h2></div>
          <div class="chronicler"><div class="byline">The Chronicler</div><p>${esc(S.morning(G))}</p></div>
          ${news}
          <div class="choices"><div class="prompt">How do you spend the day?</div>${approaches}</div>
        </div>
        ${hud()}
      </div>`);
    app.querySelectorAll(".choice").forEach((b) => b.addEventListener("click", () => renderTargets(b.getAttribute("data-k"))));
    on("casebtn", renderCaseFile);
    on("accusebtn", renderAccuse);
  }

  function renderTargets(approach) {
    const targets = G.targets(approach);
    const opts = targets.map((t) =>
      `<button class="choice" data-id="${esc(t.id)}" type="button"><span class="lab">${esc(t.label)}</span></button>`).join("");
    const heads = { examine: "Which scene?", search: "Which room?", interview: "Whom will you press?", observe: "Where?" };
    show(`
      <div class="stage">
        <div>
          <div class="section-head"><h2>Day ${G.day}</h2></div>
          <div class="choices"><div class="prompt">${esc(heads[approach] || "Where?")}</div>${opts}
            <button class="choice" id="backday" type="button" style="border-left-color:var(--border)"><span class="lab">Reconsider</span></button>
          </div>
        </div>
        ${hud()}
      </div>`);
    app.querySelectorAll("[data-id]").forEach((b) =>
      b.addEventListener("click", () => renderReveal(approach, b.getAttribute("data-id"))));
    on("backday", renderDay);
    on("casebtn", renderCaseFile);
    on("accusebtn", renderAccuse);
  }

  function renderReveal(approach, id) {
    const lines = G.investigate(approach, id);
    const body = lines.map((l) => {
      if (l.pillar) return `<p class="evidence pillar-${l.pillar}"><span class="etag">${cap(l.pillar)}</span>${esc(l.text)}</p>`;
      if (l.cleared) return `<p class="evidence cleared">${esc(l.text)}</p>`;
      if (l.heat) return `<p class="mv">${esc(l.text)}</p>`;
      return `<p>${esc(l.text)}</p>`;
    }).join("");
    const gotCase = G.hasCase();
    show(`
      <div class="stage">
        <div>
          <div class="section-head"><h2>Day ${G.day} — what you found</h2></div>
          <div class="diary">${body}
            ${gotCase ? `<p class="tag">[ You have all three pillars now. You can name the killer — if you're sure who they point to. ]</p>` : ""}</div>
          <div class="btnrow" style="margin-top:18px;justify-content:flex-start">
            <button class="btn" id="accusebtn2" type="button">Name the killer</button>
            <button class="btn ghost" id="night" type="button">Let the night fall</button>
            <button class="btn ghost" id="casebtn2" type="button">Case file</button>
          </div>
        </div>
        ${hud()}
      </div>`);
    on("night", letNightFall);
    on("accusebtn2", renderAccuse);
    on("accusebtn", renderAccuse);
    on("casebtn2", renderCaseFile);
    on("casebtn", renderCaseFile);
  }

  function letNightFall() {
    G.nightfall();
    if (G.status !== "playing") return renderEnd();
    renderDay();
  }

  // ---- the case file ----------------------------------------------------
  function renderCaseFile() {
    const pill = (k, label) => {
      const got = G.pillars().has(k);
      const text = got ? G.mystery.pillars[k] : "— not yet established —";
      return `<div class="dead-rec"><div class="d1">${label} ${got ? "✓" : ""}</div><div class="d2">${esc(text)}</div></div>`;
    };
    const suspects = G.order.map((n) => {
      const c = G.byName[n], f = G.caseFile[n];
      const dead = !G.alive.has(n);
      const bits = [];
      if (f.herring) bits.push(`<div class="d2">${esc(f.herring)}</div>`);
      if (f.alibi) bits.push(`<div class="d2 cleared">${esc((G.mystery.herrings[n] || {}).alibi || "Cleared.")}</div>`);
      if (!bits.length) bits.push(`<div class="d2" style="opacity:.6">You have nothing on them yet.</div>`);
      return `<div class="dead-rec"><div class="d1">${dead ? "† " : ""}${esc(shortName(c))} — ${esc(c.title)}${f.alibi ? " · cleared" : ""}</div>${bits.join("")}</div>`;
    }).join("");
    show(`
      <div class="section-head"><h2>The Case File</h2>
        <button class="iconbtn" id="back" type="button">Back to the day</button></div>
      <h3 class="label" style="margin-top:6px">The three pillars</h3>
      <div class="reveal-truth">${pill("means", "Means")}${pill("motive", "Motive")}${pill("opportunity", "Opportunity")}</div>
      <h3 class="label" style="margin-top:20px">The suspects</h3>
      <div class="reveal-truth">${suspects}</div>
      <div class="btnrow" style="margin-top:20px"><button class="btn" id="accuse" type="button">Name the killer</button></div>`);
    on("back", renderDay);
    on("accuse", renderAccuse);
  }

  // ---- the accusation ---------------------------------------------------
  function renderAccuse() {
    const cards = G.order.map((n) => {
      const c = G.byName[n], dead = !G.alive.has(n);
      return `<button class="choice ${dead ? "" : "kill"}" data-name="${esc(n)}" type="button">
        <span class="lab">${dead ? "† " : ""}Accuse ${esc(shortName(c))}</span>
        <span class="fc">${esc(c.title)}${dead ? " — already dead" : ""}</span></button>`;
    }).join("");
    const have = G.pillars().size;
    const warn = have >= 3
      ? `<div class="accuse-note ok"><b>You have all three pillars</b> — means, motive, and opportunity. Name the right person now and the case will hold. But name the <i>wrong</i> one and the real killer walks free, and knows you were close.</div>`
      : `<div class="accuse-note danger"><b>⚠ You have only ${have} of 3 pillars.</b> Accuse now and — <b>even if you are right</b> — you cannot prove it: the killer will <b>walk free</b>, forewarned that you are onto them, and you will not get a second chance. Suspicion is not evidence.</div>`;
    show(`
      <div class="section-head"><h2>Name the Killer</h2>
        <button class="iconbtn" id="back" type="button">Not yet</button></div>
      ${warn}
      <p style="max-width:64ch">This is the one move you cannot take back. Choose.</p>
      <div class="choices">${cards}</div>`);
    on("back", renderDay);
    app.querySelectorAll("[data-name]").forEach((b) =>
      b.addEventListener("click", () => { G.accuse(b.getAttribute("data-name")); renderEnd(); }));
  }

  // ---- the ending -------------------------------------------------------
  function renderEnd() {
    const r = G.result || { tier: "defeat", title: "The End", text: "" };
    const dead = G.deaths.map((d) => `<div class="dead-rec"><div class="d1">† ${esc(shortName(G.byName[d.victim]))}</div><div class="d2">Killed in the ${esc(d.room)}, night ${d.day}.</div></div>`).join("");
    show(`
      <div class="section-head"><h2>${esc(r.title)}</h2>
        <button class="iconbtn" id="again" type="button">New assignment</button></div>
      <p class="verdict outcome-${r.tier}">${esc(r.text)}</p>
      <div class="section-head"><h2>The Killer Was</h2></div>
      <div class="reveal-truth">
        <div class="dead-rec"><div class="d1">${esc(G.byName[G.killer].name)} — ${esc(G.byName[G.killer].title)}</div>
          <div class="d2">${esc(G.mystery.truth)}</div></div>
        ${dead ? `<h3 class="label" style="margin-top:14px">The dead</h3>${dead}` : ""}
      </div>
      <div class="btnrow" style="margin-top:22px"><button class="btn" id="again2" type="button">Take a new assignment</button></div>`);
    on("again", personae);
    on("again2", personae);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  // Choose a world by URL (?world=id); default is the built-in one.
  try {
    const wanted = new URLSearchParams(location.search).get("world");
    if (wanted && MV.WORLDS[wanted]) MV.useWorld(wanted);
  } catch (e) { /* no query string */ }

  hero();
})();
