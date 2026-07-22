/* Mysteryverse — the browser controller (storybook edition).
 *
 * You take one guest. Each day you make two choices — an intent, then an action
 * in the scene it leads to — and read the consequences in that guest's own
 * voice. The other six scheme on their own. Everything is deterministic: same
 * guest, same choices, same story. No network, no model calls.
 */
(function () {
  "use strict";
  const MV = window.MV, A = MV.art, T = MV.text, C = MV.content, esc = escapeHtml;
  const app = document.getElementById("app");
  const last = MV.last;

  let game = null, me = null, playerName = null, known = null;
  let daylog = [], pending = null;

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
  const wait = () => new Promise((res) => { pending = () => { pending = null; res(); }; });
  const choose = () => new Promise((res) => { pending = (v) => { pending = null; res(v); }; });

  // ---- hero -------------------------------------------------------------
  function hero() {
    show(`
      <section class="hero">
        <div class="art">${A.manor()}</div>
        <div class="hero-copy">
          <div class="kicker">A Game of Intrigue</div>
          <h1>Ravenhollow<br/>Manor</h1>
          <p class="tag">The storm has taken the bridge. Seven guests were invited,
            each with a private reason to see another dead. A body falls every day
            until one alone remains. Will it be you — and will your quarry fall by
            your hand first?</p>
          <div class="btnrow">
            <button class="btn" id="toGallery" type="button">Choose your guest</button>
            <button class="btn ghost" id="toWatch" type="button">Watch the night unfold</button>
          </div>
        </div>
      </section>
      <div class="section-head"><h2>How the night works</h2></div>
      <p style="max-width:64ch">Each day you choose one of <b>three intents</b>, then face one
        scene with <b>three actions</b> — spoken aloud or thought to yourself. You always know
        the one guest you came to kill; <b>your mark can die by no hand but yours</b>. Who has
        come for <i>you</i>, though, you must find out — from an attempt on your life, a
        confession, or a page of someone's diary. To win: outlive them all, and be the one who
        strikes your mark down. Nothing here is random.</p>`);
    document.getElementById("toGallery").onclick = gallery;
    document.getElementById("toWatch").onclick = () => watch();
  }

  // ---- gallery (spoiler-free) ------------------------------------------
  function gallery() {
    const cards = MV.buildCast().map((c) => {
      const top = Object.entries(c.skills).sort((a, b) => b[1] - a[1]).slice(0, 2);
      return `<article class="card">
        <div class="pic">${A.portrait(c.name, 240)}</div>
        <div class="body">
          <div><h3>${esc(c.name)}</h3><div class="title">${esc(c.title)}</div></div>
          <div class="chips">
            ${top.map(([k, v]) => `<span class="chip skill">${k} ${v}</span>`).join("")}
            ${c.vices.map((v) => `<span class="chip vice">${v}</span>`).join("")}
          </div>
          <p class="motive">${esc(C.HOOKS[c.name])}</p>
          <button class="btn" data-play="${esc(c.name)}" type="button">Play as ${esc(last(c.name))}</button>
        </div>
      </article>`;
    }).join("");
    show(`
      <div class="section-head"><h2>The Guest List</h2>
        <button class="iconbtn" id="back" type="button">Back</button></div>
      <p style="max-width:62ch;margin-top:-6px">Seven strangers, snowed in together. Choose the
        one whose eyes you'll see the night through. What they want — and who wants them — is
        theirs to know, and yours to discover.</p>
      <div class="gallery">${cards}</div>`);
    document.getElementById("back").onclick = hero;
    app.querySelectorAll("[data-play]").forEach((b) =>
      b.addEventListener("click", () => invitation(b.getAttribute("data-play"))));
  }

  // ---- the invitation (opening letter animation) -----------------------
  function invitation(name) {
    const c = MV.buildCast().find((x) => x.name === name);
    const isHost = name === "Cornelius Blackwood";
    const markFull = c.target;
    const body = isHost
      ? `<p>In your own hand, the guest list for the weekend — every soul who ever wronged the
          master of Ravenhollow, gathered at last beneath his roof.</p>
         <p class="purpose">${esc(c.motive)}</p>
         <p>Your quarry before the storm blows out: <b>${esc(markFull)}</b>. And you know precisely
          which of them has come for you — you read their letters before they ever crossed your
          bridge.</p>`
      : `<p>You are most cordially invited to pass the coming nights at Ravenhollow Manor, that we
          might settle at last the small matter still outstanding between us. The bridge grows
          treacherous in a storm; once across it, think nothing of leaving before morning.</p>
         <p class="sig">— C. Blackwood, at the Manor</p>
         <hr/>
         <p><i>But you did not cross that bridge for the host's claret.</i></p>
         <p class="purpose">${esc(c.motive)}</p>
         <p>Your quarry, before this storm blows out: <b>${esc(markFull)}</b>. Whether anyone in
          this house has come for <i>you</i>, you do not yet know.</p>`;
    show(`
      <div class="env-stage">
        <div class="envelope" id="env">
          <div class="letter">
            <div class="letterhead">Ravenhollow Manor</div>
            <p class="dear">${isHost ? "The Host's Ledger" : "Dear " + esc(name.replace(/^(Dr\.|Lady|Miss|Colonel|Mother) /, "")) + ","}</p>
            ${body}
            <div class="btnrow" style="margin-top:18px"><button class="btn" id="enter" type="button">Enter the manor</button></div>
          </div>
          <div class="env-pocket"></div>
          <div class="env-flap"></div>
          <div class="wax">✦</div>
        </div>
      </div>`);
    const env = document.getElementById("env");
    document.getElementById("enter").onclick = () => beginPlay(name);
    if (reduced()) env.classList.add("open");
    else requestAnimationFrame(() => setTimeout(() => env.classList.add("open"), 120));
  }

  // ---- play: setup ------------------------------------------------------
  async function beginPlay(name) {
    playerName = name;
    const mark = MV.buildCast().find((c) => c.name === name).target;
    game = new MV.Game({ playerName: name, reservedMark: mark });
    me = game.byName[name];
    known = C.initialKnownHunters(game, name);
    daylog = [];
    game.log({ type: "prologue" });
    await runDays();
    endingUI(game.finish());
  }

  async function runDays() {
    let finale = false;
    while (game.living().length > 1 && game.day < game.maxDays) {
      game.day += 1;
      game.murderToday = null;
      game.log({ type: "daybreak", day: game.day, survivors: game.living().map((c) => c.name) });

      // 1) Intent — three options.
      game.playerHidden = false;
      const intent = await intentUI(C.dayIntents(game, me));
      game.playerHidden = intent.key === "lielow";   // lying low keeps you unreachable
      const goal = resolveGoal(intent.goal);
      if (goal) stepToward(goal, 5);

      // 2) Encounter — three actions.
      const subject = pickSubject();
      const recap = [];
      const chosen = await encounterUI(subject);
      applyAction(chosen, subject, recap);

      // 3) The world moves; a body falls.
      advanceNpcs();
      absorbReveals(recap);
      if (!game.murderToday && game.living().length > 1) game.forceMurder();

      // 4) Nightfall — the day's writing.
      game.log({ type: "nightfall", day: game.day, victim: game.murderToday ? game.murderToday.victim : null });
      game.resolveExposure();
      game.decaySuspicion();
      absorbReveals(recap);
      const lines = composeNight(intent, chosen, subject, recap);
      daylog.push({ day: game.day, html: lines });
      const alive = game.living().length;
      if (alive > 1 && me.alive && !me.caught) await nightUI(lines);
      if (alive <= 1) break;
      // Once it's just you and your mark, the night has one day left in it:
      // the confrontation. It does not drag on into empty mornings.
      if (alive === 2) { if (finale) break; else finale = true; }
    }
  }

  // ---- goal + movement --------------------------------------------------
  function resolveGoal(kind) {
    const knows = playerName === "Cornelius Blackwood";
    if (kind === "mark") {
      const m = game.byName[me.target];
      if (m.alive && !m.caught) return m.room;
      kind = "rival";
    }
    if (kind === "rival") {
      const others = game.living().filter((c) => c.name !== playerName);
      let best = null, bd = 1e9;
      for (const o of others) {
        const d = game.mansion.bfsDistance(me.room, o.room, knows);
        if (d !== null && d < bd) { bd = d; best = o.room; }
      }
      return best;
    }
    if (kind === "arm") return nearestMeans();
    return safeRoom();
  }

  function nearestMeans() {
    const knows = playerName === "Cornelius Blackwood";
    let best = null, bd = 1e9;
    for (const [n, r] of Object.entries(game.mansion.rooms)) {
      const usable = r.weapon !== null || (r.providesPoison && MV.helpers.skill(me, "poison") >= 3);
      if (!usable) continue;
      const d = game.mansion.bfsDistance(me.room, n, knows);
      if (d !== null && d < bd) { bd = d; best = n; }
    }
    return best;
  }

  function safeRoom() {
    const knows = playerName === "Cornelius Blackwood";
    const hunters = game.living().filter((c) => c.target === playerName);
    let best = me.room, bestKey = null;
    for (const [n, r] of Object.entries(game.mansion.rooms)) {
      if (game.mansion.bfsDistance(me.room, n, knows) === null) continue;
      let minH = 99;
      for (const h of hunters) { const d = game.mansion.bfsDistance(n, h.room, knows); if (d !== null) minH = Math.min(minH, d); }
      const key = [minH, r.lure ? 1 : 0, -game.inRoom(n).length, n];
      if (bestKey === null || cmp(key, bestKey) > 0) { bestKey = key; best = n; }
    }
    return best;
  }
  const cmp = (a, b) => { for (let i = 0; i < a.length; i++) { if (a[i] < b[i]) return -1; if (a[i] > b[i]) return 1; } return 0; };

  function stepToward(goal, steps) {
    const knows = playerName === "Cornelius Blackwood";
    for (let i = 0; i < steps && me.room !== goal; i++) {
      const s = game.mansion.firstStep(me.room, goal, knows);
      if (!s) break;
      game.move(me, s, false);
    }
  }

  function pickSubject() {
    const here = game.inRoom(me.room, me.name);
    const mark = game.byName[me.target];
    if (here.includes(mark)) return mark;
    const knownHunter = here.find((c) => known.has(c.name));
    if (knownHunter) return knownHunter;
    return here.length ? here[0] : null;
  }

  // ---- applying the scene action ---------------------------------------
  function applyAction(opt, subject, recap) {
    if (!opt) return;
    if (opt.kind === "strike") {
      const killed = opt.guaranteed
        ? (game._commitKill(me, subject, opt.method, opt.weapon, false), true)
        : game.resolveAttempt(me, subject, opt.method, opt.weapon, opt.witnessed);
      recap.push(opt.line);
      recap.push(killed
        ? (subject.name === me.target ? `And it is done. ${last(subject.name)} — your reason for being here — is dead by your hand.` : `${last(subject.name)} will trouble no one again.`)
        : `It goes wrong. ${last(subject.name)} lives, wide-eyed and certain now of what you are.`);
    } else if (opt.kind === "lull") {
      subject._lulledBy = me.name;
      me.suspicion = Math.max(0, me.suspicion - 1);
      recap.push(opt.line);
      recap.push(`${last(subject.name)} softens, unguarded now. When you choose to strike, they will not see it coming.`);
    } else if (opt.kind === "deflect") {
      me.suspicion = Math.max(0, me.suspicion - 1);
      recap.push(opt.line);
    } else if (opt.kind === "converse") {
      recap.push(opt.line);
      if (subject.target === me.name && !known.has(subject.name)) {
        known.add(subject.name);
        recap.push(`Something in how ${last(subject.name)} answers turns you cold: this one has come for you.`);
      } else if (subject.target) {
        recap.push(`You gather, between the lies, that ${last(subject.name)} has no love for ${last(subject.target)}.`);
      }
    } else if (opt.kind === "arm") {
      const r = game.mansion.rooms[me.room];
      if (r.weapon) { game.apply(me, { kind: "arm" }); recap.push(opt.line); }
      else recap.push("But there is nothing here worth taking up.");
    } else if (opt.kind === "withdraw") {
      recap.push(C.lieLow(me, game.day));
      const exits = game.mansion.neighbors(me.room, playerName === "Cornelius Blackwood");
      if (exits.length) game.move(me, exits[0], false);
    } else {
      recap.push(C.lieLow(me, game.day));
    }
  }

  function advanceNpcs() {
    const cap = game.turnsPerDay;
    const settle = game.murderToday ? 1 : cap;   // if you already killed, just let them drift once
    for (let t = 0; t < settle; t++) {
      let acted = false;
      for (const actor of game.orderedLiving()) {
        if (actor.name === playerName || !actor.alive || actor.caught) continue;
        const options = game.options(actor);
        if (!options.length) continue;
        game.apply(actor, MV.autoChoose(game, actor, options));
        acted = true;
        if (game.murderToday) break;
      }
      if (game.murderToday || !acted) break;
    }
  }

  function absorbReveals(recap) {
    for (const m of game.memory[playerName]) {
      if (m.kind === "attacked" && !known.has(m.culprit)) {
        known.add(m.culprit);
        recap.push(`You survive an attempt on your life — and now you know the face of it: ${last(m.culprit)} means to see you dead.`);
      }
    }
  }

  // ---- composing the night's page --------------------------------------
  function deathKnown(d) {
    if (d.culprit === playerName) return true;
    return game.memory[playerName].some((m) => m.kind === "witness_kill" && m.victim === d.victim);
  }

  function composeNight(intent, chosen, subject, recap) {
    const n = C.NARR[playerName];
    const out = [];
    out.push({ dh: `${T.VOICES[playerName].header} — night of the ${T.ordinal(game.day)} day` });
    out.push({ op: T.VOICES[playerName].opener });
    // the day's scene, in the player's voice
    recap.forEach((r) => out.push({ p: r }));
    // dispatches on today's dead
    const today = game.deaths.filter((d) => d.day === game.day && d.victim !== (subject && chosen && chosen.kind === "strike" ? subject.name : null));
    const allToday = game.deaths.filter((d) => d.day === game.day);
    allToday.forEach((d) => {
      if (chosen && chosen.kind === "strike" && d.culprit === playerName && d.victim === subject.name) return; // already narrated in recap
      out.push({ death: C.deathDispatch(d, { known: deathKnown(d), viewer: playerName }) });
    });
    // life in the walls
    const vig = C.vignette(game, me);
    if (vig) out.push({ mv: vig });
    return out;
  }

  function nightLines(lines) {
    return lines.map((l) => {
      if (l.dh) return `<div class="dh">${esc(l.dh)}</div>`;
      if (l.op) return `<p class="op">${esc(l.op)}</p>`;
      if (l.death) return `<p class="death-dispatch">${esc(l.death)}</p>`;
      if (l.mv) return `<p class="mv">${esc(l.mv)}</p>`;
      if (l.p) return `<p>${esc(l.p)}</p>`;
      return "";
    }).join("");
  }

  // ---- UI screens -------------------------------------------------------
  function intentUI(intents) {
    const dead = deadDossier();
    show(`
      <div class="stage">
        <div>
          <div class="section-head"><h2>Day ${game.day}</h2></div>
          <p class="daymono">${esc(dayOpener())}</p>
          <div class="choices"><div class="prompt">How do you spend the day?</div>
            ${intents.map((it, i) => `<button class="choice intent" data-i="${i}" type="button">
              <span class="lab">${esc(it.title)}</span>
              <span class="fc">${esc(it.mono)}</span></button>`).join("")}
          </div>
        </div>
        ${sidebar()}
      </div>`);
    app.querySelectorAll(".choice").forEach((b) =>
      b.addEventListener("click", () => pending && pending(intents[+b.getAttribute("data-i")])));
    return choose();
  }

  function encounterUI(subject) {
    const scene = C.sceneProse(game, me, subject, known);
    const opts = C.sceneOptions(game, me, subject, known);
    const tokens = game.inRoom(me.room, me.name).map((c) => {
      let cls = "", label = last(c.name);
      if (c.name === me.target) { cls = "prey"; label += " · your mark"; }
      else if (known.has(c.name)) { cls = "foe"; label += " · hunts you"; }
      return `<div class="tokenc ${cls}">${A.portrait(c.name, 54)}<span class="nm">${esc(label)}</span></div>`;
    }).join("");
    show(`
      <div class="stage">
        <div>
          <div class="scene">
            <div class="backdrop">${A.room(me.room)}
              <div class="roomtag"><div class="name">${esc(me.room)}</div></div></div>
            <div class="present">${tokens}</div>
          </div>
          <div class="scene-prose">${scene.map((s) => `<p>${esc(s)}</p>`).join("")}</div>
          <div class="choices"><div class="prompt">What do you do?</div>
            ${opts.map((o, i) => {
              let cls = "choice";
              if (o.kind === "strike") cls += o.willSucceed ? " kill sure" : " kill";
              if (o.kind === "lull" || o.kind === "converse") cls += " talk";
              return `<button class="${cls}" data-i="${i}" type="button">
                <span class="lab">${esc(o.label)}</span>
                <span class="say">${esc(o.line)}</span>
                <span class="fc">${esc(o.note || "")}</span></button>`;
            }).join("")}
          </div>
        </div>
        ${sidebar()}
      </div>`);
    app.querySelectorAll(".choice").forEach((b) =>
      b.addEventListener("click", () => pending && pending(opts[+b.getAttribute("data-i")])));
    return choose();
  }

  function nightUI(lines) {
    show(`
      <div class="section-head"><h2>Night of the ${esc(T.ordinal(game.day))} day</h2></div>
      <div class="diary">${nightLines(lines)}</div>
      ${deadDossier(true)}
      <div class="btnrow" style="justify-content:flex-start;margin-top:20px">
        <button class="btn" id="next" type="button">Begin the next day</button></div>`);
    document.getElementById("next").onclick = () => pending && pending();
    return wait();
  }

  function dayOpener() {
    const alive = game.living().length;
    const mark = game.byName[me.target];
    if (alive === 2 && mark.alive && !mark.caught)
      return `Only you and ${last(mark.name)} are left breathing in Ravenhollow. This is the last morning — and the last chance to make the night yours.`;
    if (game.day === 1) return "The first grey morning. Seven of you at breakfast, and the storm at every window. No one says what everyone is thinking.";
    return `Morning, and ${alive} of you still sit down to a cold breakfast. The empty chairs are not discussed.`;
  }

  function sidebar() {
    const mark = game.byName[me.target];
    const susp = Math.min(100, Math.round((me.suspicion / 6) * 100));
    const huntersKnown = [...known].filter((h) => game.byName[h].alive && !game.byName[h].caught);
    return `<aside class="side">
      <div class="who">${A.portrait(me.name, 46)}
        <div><div class="nm">${esc(me.name)}</div><div class="ti">${esc(me.title)}</div></div></div>
      <div class="stat"><span class="k">Your mark</span><span class="v">${mark.alive && !mark.caught ? esc(last(mark.name)) : "— slain —"}</span></div>
      <div class="stat"><span class="k">In hand</span><span class="v">${me.carrying ? esc(me.carrying) : "empty-handed"}</span></div>
      <div class="stat"><span class="k">Suspicion</span><span class="v"><span class="susp"><i style="width:${susp}%"></i></span></span></div>
      <div class="stat"><span class="k">Hunts you</span><span class="v">${huntersKnown.length ? huntersKnown.map((h) => esc(last(h))).join(", ") : "unknown"}</span></div>
    </aside>`;
  }

  function deadDossier(full) {
    if (!game.deaths.length) return full ? "" : "";
    const items = game.deaths.map((d) => {
      const known = deathKnown(d);
      return `<div class="dead-rec"><div class="d1">† ${esc(d.victim)}</div>
        <div class="d2">${esc(C.deathDispatch(d, { known, viewer: playerName }))}</div></div>`;
    }).join("");
    return `<div class="section-head" style="margin-top:26px"><h2>The Dead</h2></div><div class="reveal-truth">${items}</div>`;
  }

  // ---- ending -----------------------------------------------------------
  function endingUI(result) {
    const oc = C.outcome(result, playerName);
    const truth = result.deaths.map((d) => `<div class="death-rec">
      <div class="d1">${esc(C.deathTruth(d))}</div></div>`).join("");
    const chron = daylog.map((d) => `<div class="diary" style="margin-bottom:14px">${nightLines(d.html)}</div>`).join("");
    show(`
      <div class="section-head"><h2>${esc(oc.title)}</h2>
        <button class="iconbtn" id="again" type="button">Play again</button></div>
      <p class="verdict outcome-${oc.tier}">${esc(oc.text)}</p>

      <div class="section-head"><h2>The Truth, Entire</h2></div>
      <div class="reveal-truth">${truth}
        ${result.unmasked.length ? `<p class="label" style="margin-top:12px">Unmasked</p>${result.unmasked.map((n) => `<div class="truth" style="color:var(--accent-2)">${esc(n)}</div>`).join("")}` : ""}
      </div>

      <div class="section-head"><h2>Your Chronicle</h2></div>
      <p style="margin-top:-6px;color:var(--text-dim);font-style:italic">The night, night by night, as ${esc(last(playerName))} lived it.</p>
      ${chron}
      <div class="btnrow" style="margin-top:22px">
        <button class="btn" id="again2" type="button">Play another guest</button>
        <button class="btn ghost" id="watch2" type="button">See the god's-eye story</button>
      </div>`);
    document.getElementById("again").onclick = gallery;
    document.getElementById("again2").onclick = gallery;
    document.getElementById("watch2").onclick = () => watch(result);
  }

  // ---- watch (god's-eye) ------------------------------------------------
  async function watch(pre) {
    let result = pre && pre.events ? pre : null;
    if (!result) {
      const g = new MV.Game();
      result = await g.run((a, o) => MV.autoChoose(g, a, o), null);
    }
    const story = T.storyLines(result).map((s) => {
      if (s.head) return `<div class="head-h">${esc(s.head)}</div><div class="night">${esc(s.sub)}</div>`;
      if (s.day) return `<div class="day-h">${esc(s.day)}</div>`;
      if (s.night) return `<div class="night">${esc(s.night)}</div>`;
      return `<div class="ev ${s.kind}">${esc(s.line)}</div>`;
    }).join("");
    const tabs = result.cast.map((c, i) =>
      `<button class="subtab" role="tab" data-name="${esc(c.name)}" aria-selected="${i === 0}">${esc(last(c.name))}</button>`).join("");
    show(`
      <div class="section-head"><h2>The Night, As It Happened</h2>
        <button class="iconbtn" id="back" type="button">Back</button></div>
      <p class="verdict">${esc(result.verdict)}</p>
      <div class="story">${story}</div>
      <div class="section-head"><h2>Read a Chronicle</h2></div>
      <div class="subtabs" role="tablist">${tabs}</div>
      <div id="chronOut"></div>`);
    document.getElementById("back").onclick = hero;
    const out = document.getElementById("chronOut");
    const renderChron = (name) => {
      out.innerHTML = T.chronicleDays(name, result).map((d) =>
        `<div class="diary" style="margin-bottom:14px">${d.lines.map((l) =>
          l.h ? `<div class="dh">${esc(l.h)}</div>` : l.o ? `<p class="op">${esc(l.o)}</p>`
            : l.p ? `<p>${esc(l.p)}</p>` : l.m ? `<p class="mv">${esc(l.m)}</p>`
              : l.tag ? `<p class="tag">[ ${esc(l.tag)} ]</p>` : "").join("")}</div>`).join("");
    };
    app.querySelectorAll(".subtab").forEach((t) => t.addEventListener("click", () => {
      app.querySelectorAll(".subtab").forEach((x) => x.setAttribute("aria-selected", "false"));
      t.setAttribute("aria-selected", "true");
      renderChron(t.getAttribute("data-name"));
    }));
    renderChron(result.cast[0].name);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  hero();
})();
