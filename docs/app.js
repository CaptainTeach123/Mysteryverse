/* Mysteryverse — the browser controller. Drives the deterministic engine with
 * an interactive chooser for the guest you play; the other six decide for
 * themselves. No network, no model calls — the whole night is computed here. */
(function () {
  "use strict";
  const MV = window.MV, A = MV.art, T = MV.text, esc = escapeHtml;
  const app = document.getElementById("app");

  let game = null, playerName = null, pendingChoice = null, pendingNext = null;

  // ---- theme ------------------------------------------------------------
  const root = document.documentElement;
  const savedTheme = localStorage.getItem("mv-theme");
  if (savedTheme) root.setAttribute("data-theme", savedTheme);
  document.getElementById("theme").addEventListener("click", () => {
    const cur = root.getAttribute("data-theme")
      || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("mv-theme", next);
  });

  const show = (html) => { app.innerHTML = html; window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" }); };
  const byName = (n) => game.byName[n];
  const castList = () => MV.buildCast();

  // ---- hero -------------------------------------------------------------
  function hero() {
    show(`
      <section class="hero">
        <div class="art">${A.manor()}</div>
        <div class="hero-copy">
          <div class="kicker">A Game of Intrigue</div>
          <h1>Ravenhollow<br/>Manor</h1>
          <p class="tag">The storm has taken the bridge. Seven guests were invited,
            each with a private reason to see another dead — and a rule they all
            understand: no more than one of them dies a day.</p>
          <div class="btnrow">
            <button class="btn" id="toGallery" type="button">Choose your guest</button>
            <button class="btn ghost" id="toWatch" type="button">Watch the night unfold</button>
          </div>
        </div>
      </section>
      <div class="section-head"><h2>The House Rules</h2></div>
      <p style="max-width:64ch">You take one guest and choose their every move; the other six
        scheme on their own. Move freely through the manor, arm yourself, and corner your mark —
        but <b>no one wants to be caught</b>. Kill in front of a witness and suspicion mounts;
        let it rise too far and the household unmasks you at nightfall. Each night you get your
        write-up: the day as <i>you</i> witnessed it, in your own voice. Nothing is random —
        the same choice always leads the same way.</p>`);
    document.getElementById("toGallery").onclick = gallery;
    document.getElementById("toWatch").onclick = watch;
  }

  // ---- gallery ----------------------------------------------------------
  function gallery() {
    const cast = castList();
    const cards = cast.map((c) => {
      const topSkills = Object.entries(c.skills).sort((a, b) => b[1] - a[1]).slice(0, 2);
      return `<article class="card">
        <div class="pic">${A.portrait(c.name, 240)}</div>
        <div class="body">
          <div>
            <h3>${esc(c.name)}</h3>
            <div class="title">${esc(c.title)}</div>
          </div>
          <div class="chips">
            ${topSkills.map(([k, v]) => `<span class="chip skill">${k} ${v}</span>`).join("")}
            ${c.vices.map((v) => `<span class="chip vice">${v}</span>`).join("")}
          </div>
          <div class="wants">Wants <b>${esc(MV.last(c.target))}</b> dead</div>
          <p class="motive">${esc(c.motive)}</p>
          <button class="btn" data-play="${esc(c.name)}" type="button">Play as ${esc(MV.last(c.name))}</button>
        </div>
      </article>`;
    }).join("");
    show(`
      <div class="section-head"><h2>The Guest List</h2>
        <button class="iconbtn" id="back" type="button">Back</button></div>
      <p style="max-width:62ch;margin-top:-6px">Pick the schemer you'll play. Each has their own
        skills, vices, and a single soul they came here to destroy.</p>
      <div class="gallery">${cards}</div>`);
    document.getElementById("back").onclick = hero;
    app.querySelectorAll("[data-play]").forEach((b) =>
      b.addEventListener("click", () => startPlay(b.getAttribute("data-play"))));
  }

  // ---- play -------------------------------------------------------------
  async function startPlay(name) {
    playerName = name;
    game = new MV.Game();
    const result = await game.run(chooseFor, onDayEnd);
    ending(result);
  }

  function chooseFor(actor, options) {
    if (actor.name !== playerName) return MV.autoChoose(game, actor, options);
    renderStage(actor, options);
    return new Promise((resolve) => {
      pendingChoice = (opt) => { pendingChoice = null; resolve(opt); };
    });
  }

  function token(c, roleClass, label) {
    return `<div class="tokenc ${roleClass}">${A.portrait(c.name, 54)}<span class="nm">${esc(label)}</span></div>`;
  }

  function renderStage(actor, options) {
    const room = game.mansion.rooms[actor.room];
    const here = game.inRoom(actor.room, actor.name);
    const tokens = here.map((c) => {
      let cls = "", lab = MV.last(c.name);
      if (c.name === actor.target) { cls = "prey"; lab = MV.last(c.name) + " · mark"; }
      else if (c.target === actor.name) { cls = "foe"; lab = MV.last(c.name) + " · hunts you"; }
      return token(c, cls, lab);
    }).join("");

    const choices = options.map((o, i) => {
      let cls = "choice";
      if (o.kind === "strike") cls += o.willSucceed ? " kill sure" : " kill";
      if (o.kind === "passage") cls += " passage";
      return `<button class="${cls}" data-i="${i}" type="button">
        <span class="lab">${esc(o.label)}</span>
        <span class="fc">${esc(o.forecast)}</span></button>`;
    }).join("");

    show(`
      <div class="stage">
        <div>
          <div class="scene">
            <div class="backdrop">${A.room(actor.room)}
              <div class="roomtag"><div class="name">${esc(actor.room)}</div>
                <div class="desc">${esc(room.description)}</div></div>
            </div>
            <div class="present">${tokens}</div>
          </div>
          <div class="choices">
            <div class="prompt">Day ${game.day} — what do you do?</div>
            ${choices}
          </div>
        </div>
        ${sidebar(actor)}
      </div>`);
    app.querySelectorAll(".choice").forEach((b) =>
      b.addEventListener("click", () => pendingChoice && pendingChoice(options[+b.getAttribute("data-i")])));
  }

  function sidebar(actor) {
    const target = byName(actor.target);
    const susp = Math.min(100, Math.round((actor.suspicion / 6) * 100));
    const dead = game.deaths.map((d) => `<li>${esc(MV.last(d.victim))} — ${d.method === "poison" ? "poisoned" : "slain"}, day ${d.day}</li>`).join("")
      || `<li style="color:var(--text-dim);list-style:none">—</li>`;
    return `<aside class="side">
      <div class="who">${A.portrait(actor.name, 46)}
        <div><div class="nm">${esc(actor.name)}</div><div class="ti">${esc(actor.title)}</div></div></div>
      <div class="stat"><span class="k">Your mark</span><span class="v">${target && target.alive ? esc(MV.last(target.name)) : "— done —"}</span></div>
      <div class="stat"><span class="k">In hand</span><span class="v">${actor.carrying ? esc(actor.carrying) : "empty-handed"}</span></div>
      <div class="stat"><span class="k">Suspicion</span><span class="v"><span class="susp"><i style="width:${susp}%"></i></span></span></div>
      <h4 style="margin-top:14px">The Dead</h4>
      <ul class="deadlist">${dead}</ul>
    </aside>`;
  }

  function onDayEnd(day) {
    const me = byName(playerName);
    // Once you're dead or unmasked, you write no more — let the night finish.
    if (!me.alive || me.caught) {
      if (me.caught && !me._notedCaught) { me._notedCaught = true; return pauseCaught(day); }
      return Promise.resolve();
    }
    show(`<div class="section-head"><h2>Night of the ${T.ordinal(day)} day</h2></div>
      ${diaryHTML(day)}
      <div class="btnrow" style="justify-content:flex-start;margin-top:20px">
        <button class="btn" id="nextDay" type="button">Begin the next day</button></div>`);
    document.getElementById("nextDay").onclick = () => pendingNext && pendingNext();
    return new Promise((resolve) => { pendingNext = () => { pendingNext = null; resolve(); }; });
  }

  function pauseCaught(day) {
    show(`<div class="section-head"><h2>Unmasked</h2></div>
      ${diaryHTML(day)}
      <p class="verdict">The household has turned on you. Your night ends behind a bolted door —
        but the manor's is not over.</p>
      <div class="btnrow" style="justify-content:flex-start"><button class="btn" id="nextDay" type="button">See how it ends</button></div>`);
    document.getElementById("nextDay").onclick = () => pendingNext && pendingNext();
    return new Promise((resolve) => { pendingNext = () => { pendingNext = null; resolve(); }; });
  }

  function diaryHTML(day) {
    const lines = T.chronicleDay(playerName, game.memory[playerName], day, game.cast);
    return `<div class="diary">${lines.map(renderDiaryLine).join("")}</div>`;
  }
  // Full chronicle, with runs of uneventful nights collapsed to one line so a
  // stalemate never becomes a wall of "a quiet day".
  function chronicleHTML(name, items) {
    if (!items.length) return `<div class="diary"><p>They wrote nothing worth keeping.</p></div>`;
    const out = [];
    let run = [];
    const flush = () => {
      if (!run.length) return;
      if (run.length === 1) {
        out.push(`<div class="diary" style="margin-bottom:14px">${run[0].lines.map(renderDiaryLine).join("")}</div>`);
      } else {
        const a = T.ordinal(run[0].day), b = T.ordinal(run[run.length - 1].day);
        out.push(`<div class="diary" style="margin-bottom:14px"><p class="op" style="padding-left:0">The nights of the ${esc(a)} through the ${esc(b)} day passed without incident — nothing ${esc(MV.last(name))} thought worth setting down.</p></div>`);
      }
      run = [];
    };
    for (const it of items) {
      if (it.quiet) { run.push(it); }
      else { flush(); out.push(`<div class="diary" style="margin-bottom:14px">${it.lines.map(renderDiaryLine).join("")}</div>`); }
    }
    flush();
    return out.join("");
  }

  function renderDiaryLine(l) {
    if (l.h) return `<div class="dh">${esc(l.h)}</div>`;
    if (l.o) return `<p class="op">${esc(l.o)}</p>`;
    if (l.p) return `<p>${esc(l.p)}</p>`;
    if (l.m) return `<p class="mv">${esc(l.m)}</p>`;
    if (l.tag) return `<p class="tag">[ ${esc(l.tag)} ]</p>`;
    return "";
  }

  // ---- ending -----------------------------------------------------------
  function ending(result) {
    const me = result.cast.find((c) => c.name === playerName);
    const fate = me.name === result.winner
      ? "You walked out of Ravenhollow alive." : !me.alive
        ? "Your diary ends because you did." : me.caught
          ? "You were unmasked and undone." : "You survived the night, one of several left standing.";
    const truth = result.deaths.map((d) => `
      <div class="death-rec">
        <div class="d1">Day ${d.day}: ${esc(d.victim)} — ${d.method === "poison" ? "poisoned" : "struck down"} in the ${esc(d.room)}</div>
        <div class="blame">the house blamed: ${esc(d.redHerring)}</div>
        <div class="truth">the truth: ${esc(d.culprit)} did it${d.witnessed ? " — in front of witnesses" : ", and no one saw"}.</div>
      </div>`).join("");
    const chron = chronicleHTML(playerName, T.chronicleDays(playerName, result));

    show(`
      <div class="section-head"><h2>By the Last Morning</h2>
        <button class="iconbtn" id="again" type="button">Play again</button></div>
      <p class="verdict">${esc(result.verdict)}</p>
      <p class="label" style="margin-top:6px">Your fate</p>
      <p style="margin-top:2px">${esc(fate)}</p>

      <div class="section-head"><h2>The Truth</h2></div>
      <div class="reveal-truth">${truth || "<p>No one died. The storm simply passed.</p>"}
        ${result.unmasked.length ? `<p style="margin-top:12px" class="label">Unmasked</p>${result.unmasked.map((n) => `<div class="truth" style="color:var(--accent-2)">${esc(n)}</div>`).join("")}` : ""}
      </div>

      <div class="section-head"><h2>Your Chronicle</h2></div>
      <p style="margin-top:-6px;color:var(--text-dim);font-style:italic">The whole night as ${esc(MV.last(playerName))} recorded it — partial, biased, and exactly as much as they could know.</p>
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
      game = new MV.Game();
      result = await game.run((a, o) => MV.autoChoose(game, a, o), null);
    }
    const story = T.storyLines(result).map((s) => {
      if (s.head) return `<div class="head-h">${esc(s.head)}</div><div class="night">${esc(s.sub)}</div>`;
      if (s.day) return `<div class="day-h">${esc(s.day)}</div>`;
      if (s.night) return `<div class="night">${esc(s.night)}</div>`;
      return `<div class="ev ${s.kind}">${esc(s.line)}</div>`;
    }).join("");

    const cast = result.cast;
    const tabs = cast.map((c, i) =>
      `<button class="subtab" role="tab" data-name="${esc(c.name)}" aria-selected="${i === 0}">${esc(MV.last(c.name))}</button>`).join("");

    show(`
      <div class="section-head"><h2>The Night, As It Happened</h2>
        <button class="iconbtn" id="back" type="button">Back</button></div>
      <p class="verdict">${esc(result.verdict)}</p>
      <div class="story">${story}</div>

      <div class="section-head"><h2>Read a Chronicle</h2></div>
      <p style="margin-top:-6px;color:var(--text-dim);font-style:italic">The same night through one guest's eyes.</p>
      <div class="subtabs" role="tablist">${tabs}</div>
      <div id="chronOut"></div>`);
    document.getElementById("back").onclick = hero;

    const out = document.getElementById("chronOut");
    const renderChron = (name) => {
      out.innerHTML = chronicleHTML(name, T.chronicleDays(name, result));
    };
    app.querySelectorAll(".subtab").forEach((t) => t.addEventListener("click", () => {
      app.querySelectorAll(".subtab").forEach((x) => x.setAttribute("aria-selected", "false"));
      t.setAttribute("aria-selected", "true");
      renderChron(t.getAttribute("data-name"));
    }));
    renderChron(cast[0].name);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  hero();
})();
