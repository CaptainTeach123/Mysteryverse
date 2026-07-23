/* Mysteryverse — the whodunit.
 *
 * You are the journalist, invited to cover the gathering. One of the guests is
 * a killer with a deep reason to see everyone dead, and takes a life each night.
 * You investigate — examine the scenes, search the house, interview the living —
 * building a case file toward three pillars against the true culprit: MEANS,
 * MOTIVE, and OPPORTUNITY. Assemble all three and name them, and you break the
 * story. Get it wrong, run out of days, let the killer empty the house, or draw
 * too much of their attention, and you don't file at all.
 *
 * Deterministic: the same investigations in the same order reveal the same clues.
 */
(function (root) {
  "use strict";
  const MV = root.MV;
  const last = MV.last;

  const HEAT_LETHAL = 6;        // draw this much of the killer's attention and you're next

  function create() {
    const world = MV.world;
    const mystery = world.mystery;
    if (!mystery) throw new Error("this world has no mystery — set world.mystery");
    const killer = mystery.killer;
    const journalist = world.journalist;
    // Per-world prose: any string in mystery.prose replaces the stock line.
    // Supported placeholders: {room}, {killer}, {accused}, {truth}.
    const prose = mystery.prose || {};
    const order = world.cast.map((c) => c.name);
    const guests = order.filter((n) => n !== killer);   // the ones who die
    const byName = {}; world.cast.forEach((c) => (byName[c.name] = c));

    // Where the killer stages each night's murder (cycled for scene-flavour).
    const roomNames = world.locale.rooms.map((r) => r.name);

    const g = {
      world, mystery, killer, journalist, order, guests, byName,
      day: 0,
      alive: new Set(order),                 // suspects still breathing (incl. killer)
      deaths: [],                            // { day, victim, room }
      caseFile: {},                          // name -> { pillars:Set, herring, alibi }
      interviewed: new Set(),                // innocents interviewed (for opportunity)
      heat: 0,
      status: "playing",
      result: null,
      log: [],
    };
    order.forEach((n) => (g.caseFile[n] = { pillars: new Set(), herring: null, alibi: false }));

    // --- adapter so the Chronicler (story.js) can narrate this game ---------
    g.living = () => [journalist.name, ...[...g.alive]].filter(Boolean)
      .map((n) => ({ name: n }));   // count = alive suspects + you
    g.mansion = MV.buildMansion ? MV.buildMansion() : null;

    // --- queries -----------------------------------------------------------
    g.livingGuests = () => guests.filter((n) => g.alive.has(n));
    g.livingSuspects = () => order.filter((n) => g.alive.has(n));
    g.pillars = () => g.caseFile[killer].pillars;
    g.hasCase = () => g.pillars().size >= 3;
    g.latestDeath = () => g.deaths[g.deaths.length - 1] || null;
    g.deadline = () => mystery.deadline || guests.length + 1;

    // --- the day's three approaches ---------------------------------------
    g.approaches = () => {
      const a = [];
      if (g.deaths.length) a.push({ key: "examine", label: "Examine a scene", blurb: prose.examineBlurb || "Read the room where a body was found." });
      a.push({ key: "search", label: prose.searchLabel || "Search the house", blurb: prose.searchBlurb || "Turn a room over for physical proof." });
      a.push({ key: "interview", label: "Interview a guest", blurb: prose.interviewBlurb || "Press the living for what they know — and what they hide." });
      if (a.length < 3) a.push({ key: "observe", label: prose.observeLabel || "Take the measure of the room", blurb: prose.observeBlurb || "Watch the guests, and let them talk." });
      return a.slice(0, 3);
    };

    // targets for a chosen approach (three)
    g.targets = (approach) => {
      if (approach === "examine") {
        return g.deaths.slice(-3).reverse().map((d) => ({ id: d.victim, label: `Where ${last(d.victim)} died — ${roomRef(d.room)}` }));
      }
      if (approach === "search") {
        const rooms = [mystery.motiveRoom, ...roomNames.filter((r) => r !== mystery.motiveRoom)];
        const seen = new Set();
        const three = [];
        for (const r of rooms) { if (!seen.has(r)) { seen.add(r); three.push(r); } if (three.length === 3) break; }
        return three.map((r) => ({ id: r, label: `Search ${roomRef(r)}` }));
      }
      if (approach === "interview") {
        // living suspects, the ones with the least attention on them first
        return g.livingSuspects().slice(0, 3).map((n) => ({ id: n, label: `Interview ${shortName(byName[n])}` }));
      }
      return [{ id: "guests", label: prose.observeLabel || "Watch the company at dinner" }];
    };

    // --- carry out an investigation → clue(s) -----------------------------
    g.investigate = (approach, id) => {
      const lines = [];
      if (approach === "examine") {
        const death = g.deaths.find((d) => d.victim === id) || g.latestDeath();
        g.caseFile[killer].pillars.add("means");
        lines.push({ pillar: "means", text: mystery.pillars.means });
      } else if (approach === "search") {
        const room = id;
        if (room === mystery.motiveRoom) {
          g.caseFile[killer].pillars.add("motive");
          lines.push({ pillar: "motive", text: mystery.pillars.motive });
        } else {
          const t = prose.searchEmpty || `You turn {room} over from end to end, and the storm turns it over with you. There is nothing here you could carry into print — only the sense, growing daily, that you are being watched as you look.`;
          lines.push({ text: t.replace("{room}", roomRef(room)) });
        }
        if ((mystery.hotRooms || []).includes(room)) { g.heat += 2; lines.push({ heat: true, text: heatLine(g) }); }
      } else if (approach === "interview") {
        const name = id;
        if (name === killer) {
          g.heat += 2;
          const t = prose.killerInterview || `${shortName(byName[name])} pours you a drink and answers every question with three of their own. You leave the room knowing rather less than when you entered — and marked, you are quite sure, as someone worth watching.`;
          lines.push({ text: t });
          lines.push({ heat: true, text: heatLine(g) });
        } else {
          const h = mystery.herrings[name] || { clue: `${shortName(byName[name])} has secrets, as they all do — but nothing that fits the shape of these killings.`, alibi: `${shortName(byName[name])}, pressed, can account for themselves well enough.` };
          if (!g.caseFile[name].herring) { g.caseFile[name].herring = h.clue; lines.push({ suspect: name, text: h.clue }); }
          else if (!g.caseFile[name].alibi) { g.caseFile[name].alibi = true; lines.push({ suspect: name, cleared: true, text: h.alibi }); }
          else lines.push({ text: `${shortName(byName[name])} has nothing new to give you, and grows wary of the asking.` });
          g.interviewed.add(name);
          if (g.interviewed.size >= 2 && !g.caseFile[killer].pillars.has("opportunity")) {
            g.caseFile[killer].pillars.add("opportunity");
            lines.push({ pillar: "opportunity", text: mystery.pillars.opportunity });
          }
        }
      } else {
        // Observing costs the day, so it pays in kind: the table gives up the
        // first thing worth writing down about one of the company.
        lines.push({ text: prose.observe || "You take a chair by the fire and watch. Much is said; little is meant. But you learn the shape of the company, and where its silences fall." });
        const subject = g.livingGuests().find((n) => !g.caseFile[n].herring);
        if (subject) {
          const h = mystery.herrings[subject] || { clue: `${shortName(byName[subject])} has secrets, as they all do — but nothing yet that fits the shape of what is coming.` };
          g.caseFile[subject].herring = h.clue;
          lines.push({ suspect: subject, text: h.clue });
        }
      }
      g.log.push({ day: g.day, approach, id });
      return lines;
    };

    // A world may restyle any ending: mystery.prose.endings[key] is either the
    // replacement text or { title, text }. Placeholders are filled here.
    const fill = (t, accused) => t
      .replace("{killer}", shortName(byName[killer]))
      .replace("{accused}", accused ? shortName(byName[accused]) : "")
      .replace("{truth}", mystery.truth || "");
    const ending = (key, defTitle, defText, accused) => {
      const o = (prose.endings || {})[key];
      const title = (o && o.title) || defTitle;
      const text = (o && (o.text || (typeof o === "string" ? o : null))) || defText;
      return { title, text: fill(text, accused) };
    };

    // --- nightfall: the killer takes a life (or comes for you) ------------
    g.nightfall = () => {
      if (g.heat >= HEAT_LETHAL) {
        g.status = "lost";
        const e = ending("heatDeath", "Filed Under Unsolved",
          `You had drawn too much of the killer's attention, and in a house like this attention is fatal. They came for you before the dawn — one more body the storm will keep, and the story with it.`);
        g.result = lose(e.title, e.text);
        return;
      }
      const pool = g.livingGuests();
      if (!pool.length) {
        g.status = "lost";
        const e = ending("empty", "Too Late",
          `By the time you had your proof, there was no one left to prove it to. The killer had emptied the house down to the two of you — and you were never going to be the one who walked out.`);
        g.result = lose(e.title, e.text);
        return;
      }
      const victim = pool[0];              // deterministic: next in initiative order
      g.alive.delete(victim);
      // A world may stage its murders (mystery.deathRooms, in order); otherwise
      // the rooms are cycled for scene-flavour.
      const room = (mystery.deathRooms && mystery.deathRooms[g.deaths.length])
        || roomNames[g.deaths.length % roomNames.length];
      g.deaths.push({ day: g.day, victim, room });
      g.day += 1;
      if (g.day > g.deadline()) {
        g.status = "lost";
        const e = ending("lastDawn", "The Last Dawn",
          `The storm blew itself out and the first boat crossed at dawn, and you had a notebook full of suspicion and not one thing you could prove. Whatever you knew, you knew it a day too late to matter.`);
        g.result = lose(e.title, e.text);
      }
    };

    g.beginDay = () => { g.day += 1; };

    // --- the accusation ----------------------------------------------------
    g.accuse = (name) => {
      if (name === killer && g.hasCase()) {
        g.status = "won";
        const e = ending("win", "The Story Breaks",
          `You lay it out plain, all three pillars of it, and watch {killer} understand that this time the charm will not carry them. Means, motive, and opportunity — and a witness, at last, who can prove all three. {truth} You file before the boat has finished tying up. It is the story of your life, and you lived to write it.`);
        g.result = win(e.title, e.text);
      } else if (name === killer) {
        g.status = "lost";
        const e = ending("unproven", "Not Enough Ink",
          `You name them — and you are right, and it does you no good at all. Without every pillar of the case nailed down, {killer}'s lawyers and their easy smile will bury the story, and then, at leisure, bury you. Suspicion is not proof, and you had only suspicion.`);
        g.result = lose(e.title, e.text);
      } else {
        g.status = "lost";
        const e = ending("wrong", "The Wrong Name",
          `You name {accused} to the room — and in the appalled silence that follows, you feel the real killer relax. You have handed them your certainty and your throat both. The next name the house learns will be yours.`, name);
        g.result = lose(e.title, e.text);
      }
    };

    return g;
  }

  function shortName(c) {
    if (!c) return "someone";
    // "Dr. Adrian Vell" -> "Dr. Vell"; "Miss Isolde Frayne" -> "Miss Frayne"
    const m = c.name.match(/^((?:Dr|Lady|Miss|Mrs|Mr|Sir|Lord|Colonel|Mother|Sister|Father|Captain|Countess|Count|Conductor)\.?)\s+\S+\s+(\S+)$/);
    if (m) return `${m[1]} ${m[2]}`;
    return last(c.name);
  }
  // "Study" -> "the Study", but "The Hold" stays "The Hold".
  function roomRef(name) { return /^the\s/i.test(name) ? name : `the ${name}`; }
  function heatLine(g) {
    const prose = (g.mystery && g.mystery.prose) || {};
    const near = HEAT_LETHAL - g.heat;
    if (near <= 2) return prose.heatNear || "You have the distinct, cold sense that the killer now knows exactly what you are doing — and that you are running out of nights.";
    return prose.heatFar || "Somewhere in the house, you feel a particular attention settle on you — and it does not lift.";
  }
  function win(title, text) { return { tier: "triumph", title, text }; }
  function lose(title, text) { return { tier: "defeat", title, text }; }

  MV.whodunit = { create, shortName, HEAT_LETHAL };
})(typeof globalThis !== "undefined" ? globalThis : this);
