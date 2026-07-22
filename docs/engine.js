/* Mysteryverse — deterministic engine, ported faithfully from the Python
 * reference. Pure logic, no DOM. Attaches to globalThis.MV so both the browser
 * app and the Node parity tests can use the exact same code.
 *
 * The night is a fixed gamebook: no randomness at play-time. A strike lands iff
 * the attacker's margin over the victim is positive. The same choice in the
 * same state always resolves the same way.
 */
(function (root) {
  "use strict";

  // ---- constants --------------------------------------------------------
  const WEAPON_POWER = {
    "Revolver": 4, "Ceremonial Dagger": 3, "Carving Knife": 3,
    "Candlestick": 2, "Garden Shears": 2, "Length of Rope": 2,
    "Silk Cord": 2, "Letter Opener": 1,
  };
  const EXPOSE_THRESHOLD = 6;
  const TURNS_PER_DAY = 5;
  const MAX_DAYS = 12;
  const BASE_NEEDED_MARGIN = 1;
  const VICE_MARGIN = {
    wrath: -3, fanaticism: -2, pride: -1, arrogance: -1,
    cowardice: 3, greed: 1, paranoia: 1,
  };
  const RECKLESS_VICES = new Set(["wrath", "fanaticism"]);
  const DISTRACTIBLE_VICES = new Set(
    ["greed", "gluttony", "drink", "vanity", "lust", "morphine"]);
  const DULLING_VICES = new Set(["drink", "gluttony", "morphine"]);

  function last(name) {
    const parts = name
      .replace("Dr. ", "").replace("Lady ", "").replace("Miss ", "")
      .replace("Colonel ", "").replace("Mother ", "").trim().split(/\s+/);
    return parts[parts.length - 1];
  }

  // ---- the seven guests -------------------------------------------------
  function buildCast() {
    const mk = (o) => Object.assign({
      room: "Foyer", alive: true, caught: false, suspicion: 0,
      carrying: null, kills: [], exposedSecret: false,
    }, o);
    return [
      mk({
        name: "Dr. Adrian Vell", title: "the Physician",
        skills: { stealth: 3, combat: 2, poison: 5, deduction: 4, persuasion: 3, guile: 2, composure: 4 },
        vices: ["pride", "morphine"],
        motive: "A patient he let die had been bleeding him dry. The blackmail dies when the blackmailer does.",
        target: "Cornelius Blackwood",
        secret: "The 'lost patient' was no accident — it was practice.",
      }),
      mk({
        name: "Miss Isolde Frayne", title: "the Ingenue",
        skills: { stealth: 4, combat: 2, poison: 3, deduction: 3, persuasion: 5, guile: 4, composure: 3 },
        vices: ["envy", "vanity"],
        motive: "Her sister was ruined and discarded by Lady Ashford. A debt of shame paid in kind.",
        target: "Lady Bianca Ashford",
        secret: "The demure accent is invented; she grew up a pickpocket.",
      }),
      mk({
        name: "Colonel Roderick Mace", title: "the Soldier",
        skills: { stealth: 2, combat: 5, poison: 1, deduction: 3, persuasion: 2, guile: 2, composure: 4 },
        vices: ["wrath", "drink"],
        motive: "A witness to what he ordered on the ridge is in this house. Witnesses can be retired.",
        target: "Silas Crane",
        secret: "Crane isn't the only witness — but he's the one still talking.",
      }),
      mk({
        name: "Silas Crane", title: "the Confidence Man",
        skills: { stealth: 3, combat: 2, poison: 2, deduction: 3, persuasion: 4, guile: 5, composure: 2 },
        vices: ["greed", "cowardice"],
        motive: "He owes the Colonel a debt no ledger can settle. Better the creditor never leaves the manor.",
        target: "Colonel Roderick Mace",
        secret: "He already sold everyone's secrets to the host — once.",
      }),
      mk({
        name: "Lady Bianca Ashford", title: "the Heiress",
        skills: { stealth: 2, combat: 2, poison: 3, deduction: 4, persuasion: 5, guile: 3, composure: 4 },
        vices: ["arrogance", "gluttony"],
        motive: "Only Dr. Vell stands between her and the whole Ashford estate. Physicians, after all, sign the certificates.",
        target: "Dr. Adrian Vell",
        secret: "She has poisoned before, and signed nothing.",
      }),
      mk({
        name: "Cornelius Blackwood", title: "the Host",
        skills: { stealth: 4, combat: 3, poison: 3, deduction: 5, persuasion: 4, guile: 4, composure: 5 },
        vices: ["paranoia", "lust"],
        motive: "He gathered every person who ever wronged him under one roof. He does not intend for all of them to leave.",
        target: "Miss Isolde Frayne",
        secret: "He knows the manor's hidden passages — and used them to read every guest's mail before they arrived.",
      }),
      mk({
        name: "Mother Genevieve", title: "the Occultist",
        skills: { stealth: 3, combat: 2, poison: 4, deduction: 4, persuasion: 3, guile: 3, composure: 5 },
        vices: ["fanaticism", "secrecy"],
        motive: "She has read the Colonel's soul and found it past saving. Some mercies can only be delivered with hemlock.",
        target: "Colonel Roderick Mace",
        secret: "Her 'visions' are cover — she has followed Mace for years.",
      }),
    ];
  }

  const skill = (c, n) => (c.skills[n] === undefined ? 1 : c.skills[n]);
  const hasVice = (c, v) => c.vices.includes(v);
  const offense = (c) => Math.max(skill(c, "combat"), skill(c, "poison")) + skill(c, "stealth");
  const defense = (c) => skill(c, "combat") + skill(c, "deduction");

  // ---- the manor --------------------------------------------------------
  const ROOM_DEFS = [
    ["Foyer", "Black-and-white marble, a dead grandfather clock, coats still damp.", ["Grand Hall", "Library"], null, false, null],
    ["Grand Hall", "A sweep of staircase under antlers and older portraits.", ["Foyer", "Dining Room", "Ballroom", "Landing"], null, false, null],
    ["Library", "Ladders, locked cases, the smell of vellum and pipe-smoke.", ["Foyer", "Study", "Conservatory"], "Letter Opener", false, "a shelf of first editions worth a fortune"],
    ["Study", "The host's desk, a cold hearth, a decanter of something amber.", ["Library", "Landing"], "Revolver", true, "an unlocked drawer of bearer bonds"],
    ["Conservatory", "Glass and rain and the black shapes of overgrown ferns.", ["Library", "Garden"], "Garden Shears", true, null],
    ["Dining Room", "Twelve chairs, seven places set, candlelight guttering.", ["Grand Hall", "Kitchen", "Ballroom"], "Candlestick", true, "a decanter of very good port"],
    ["Kitchen", "Copper, cleavers, a range still warm, a door to the dark cellar.", ["Dining Room", "Cellar"], "Carving Knife", true, null],
    ["Cellar", "Cobwebbed bottles and one bare bulb that flickers.", ["Kitchen"], "Length of Rope", false, "a rack of pre-war vintages"],
    ["Ballroom", "A parquet floor, a shrouded chandelier, no music at all.", ["Grand Hall", "Dining Room", "Gallery"], null, false, "one's own reflection in a wall of mirrors"],
    ["Gallery", "Ancestors in oils, and one empty frame where a painting was cut out.", ["Ballroom", "Landing"], "Ceremonial Dagger", false, "a display case of Blackwood jewels"],
    ["Landing", "A gallery of doors above the hall; the storm loud against the glass.", ["Grand Hall", "Study", "Gallery", "Master Bedroom"], null, false, null],
    ["Master Bedroom", "The host's own room; a four-poster, a locked wardrobe, a view of the drowned garden.", ["Landing"], "Silk Cord", false, "a jewelry box left carelessly open"],
    ["Garden", "Sodden lawns, a broken sundial, the bridge that is no longer there.", ["Conservatory"], null, false, "the gate to a freedom the storm has cancelled"],
  ];
  const SECRET_PASSAGES = {
    "Study": "Master Bedroom", "Master Bedroom": "Study",
    "Library": "Gallery", "Gallery": "Library",
  };

  function buildMansion() {
    const rooms = {};
    for (const [name, description, exits, weapon, providesPoison, lure] of ROOM_DEFS) {
      rooms[name] = {
        name, description, exits: exits.slice(), weapon,
        providesPoison, lure, occupants: [], bodies: [],
      };
    }
    return {
      rooms,
      neighbors(name, knows) {
        const ex = rooms[name].exits.slice();
        if (knows && SECRET_PASSAGES[name]) ex.push(SECRET_PASSAGES[name]);
        return ex;
      },
      bfsDistance(start, goal, knows) {
        if (start === goal) return 0;
        const seen = new Set([start]);
        let frontier = [[start, 0]];
        while (frontier.length) {
          const [cur, d] = frontier.shift();
          for (const nx of this.neighbors(cur, knows)) {
            if (nx === goal) return d + 1;
            if (!seen.has(nx)) { seen.add(nx); frontier.push([nx, d + 1]); }
          }
        }
        return null;
      },
    };
  }

  // ---- the game ---------------------------------------------------------
  class Game {
    constructor(opts) {
      opts = opts || {};
      this.maxDays = opts.maxDays || MAX_DAYS;
      this.turnsPerDay = opts.turnsPerDay || TURNS_PER_DAY;
      this.mansion = buildMansion();
      this.cast = buildCast();
      this.byName = {};
      for (const c of this.cast) this.byName[c.name] = c;
      this.initiative = this.cast.map((c) => c.name);
      // (A seed could permute initiative here; the app uses the canonical order.)
      this.events = [];
      this.deaths = [];
      this.memory = {};
      this._discovered = {};
      for (const c of this.cast) { this.memory[c.name] = []; this._discovered[c.name] = new Set(); }
      this.day = 0;
      this.murderToday = null;
      for (const c of this.cast) this.mansion.rooms["Foyer"].occupants.push(c.name);
    }

    living() { return this.cast.filter((c) => c.alive && !c.caught); }

    inRoom(room, exclude) {
      return this.mansion.rooms[room].occupants
        .map((n) => this.byName[n])
        .filter((c) => c.alive && !c.caught && c.name !== exclude);
    }

    knowsPassages(actor) { return actor.name === "Cornelius Blackwood"; }

    methodsAvailable(actor, room) {
      const m = [];
      if (room.providesPoison && skill(actor, "poison") >= 3) m.push(["poison", null]);
      if (actor.carrying !== null) m.push(["violence", actor.carrying]);
      return m;
    }

    hasMeans(actor, room) { return this.methodsAvailable(actor, room).length > 0; }

    distanceToMeans(start, actor, knows) {
      let best = null;
      for (const name of Object.keys(this.mansion.rooms)) {
        const room = this.mansion.rooms[name];
        const usable = room.weapon !== null || (room.providesPoison && skill(actor, "poison") >= 3);
        if (!usable) continue;
        const d = this.mansion.bfsDistance(start, name, knows);
        if (d !== null && (best === null || d < best)) best = d;
      }
      return best;
    }

    pressingThreat(actor, others) {
      for (const h of others.filter((o) => o.target === actor.name)) {
        const armed = h.carrying !== null || skill(h, "poison") >= 3;
        const outmatched = offense(h) >= defense(actor);
        const afraid = hasVice(actor, "cowardice") || hasVice(actor, "paranoia");
        if (armed && (outmatched || afraid)) return h;
      }
      return null;
    }

    attackMargin(attacker, target, method, weapon) {
      let off = offense(attacker);
      if (method === "violence" && weapon) off += (WEAPON_POWER[weapon] || 1);
      else if (method === "poison") off += Math.floor(skill(attacker, "poison") / 2);
      let def = defense(target);
      const room = this.mansion.rooms[target.room];
      const dulled = target.vices.some((v) => DULLING_VICES.has(v));
      if (dulled && (room.lure || room.providesPoison)) def -= 2;
      if (skill(attacker, "stealth") >= 4 && target.suspicion === 0) off += 1;
      return off - def;
    }

    static marginLabel(m) {
      if (m >= 4) return "overwhelming — a certain kill";
      if (m >= 2) return "strong — the blow will land";
      if (m === 1) return "slight — it will just succeed";
      if (m === 0) return "even — they will get the better of you";
      return "against you — the attempt will fail";
    }

    neededMargin(actor) {
      let need = BASE_NEEDED_MARGIN;
      for (const v of actor.vices) need += (VICE_MARGIN[v] || 0);
      return Math.max(-3, Math.min(5, need));
    }

    describeRoom(name) {
      const room = this.mansion.rooms[name];
      const bits = [];
      const here = this.inRoom(name);
      if (here.length) bits.push("with " + here.map((c) => last(c.name)).join(", "));
      if (room.weapon) bits.push(`the ${room.weapon} lies here`);
      if (room.providesPoison) bits.push("glasses that could be doctored");
      if (room.bodies.length) bits.push("a body");
      if (room.lure) bits.push(room.lure);
      return bits.length ? bits.join("; ") + "." : "empty and quiet.";
    }

    options(actor) {
      const room = this.mansion.rooms[actor.room];
      const others = this.inRoom(actor.room, actor.name);
      const opts = [];
      if (this.murderToday === null) {
        for (const [method, weapon] of this.methodsAvailable(actor, room)) {
          for (const victim of others) {
            const margin = this.attackMargin(actor, victim, method, weapon);
            const witnesses = others.filter((o) => o !== victim);
            const risk = (witnesses.length ? 5 : 0) + (method === "violence" ? 3 : 1);
            const withWhat = method === "violence" ? `the ${weapon}` : "a doctored glass";
            const seen = witnesses.length
              ? `${witnesses.length} watching — exposure is certain` : "unseen";
            const mark = victim.name === actor.target ? " (your mark)" : "";
            opts.push({
              key: `strike:${method}:${victim.name}`, kind: "strike",
              label: `Kill ${last(victim.name)} with ${withWhat}`,
              forecast: `The odds are ${Game.marginLabel(margin)}${mark}; ${seen}.`,
              victim: victim.name, method, weapon,
              margin, willSucceed: margin >= 1, suspicionRisk: risk,
              witnessed: witnesses.length > 0, isTarget: victim.name === actor.target,
            });
          }
        }
      }
      if (actor.carrying === null && room.weapon) {
        opts.push({
          key: `arm:${room.weapon}`, kind: "arm",
          label: `Take the ${room.weapon}`,
          forecast: "Arm yourself; you cannot strike unarmed.",
          weapon: room.weapon,
        });
      }
      for (const dest of this.mansion.neighbors(actor.room, this.knowsPassages(actor))) {
        const secret = !room.exits.includes(dest);
        opts.push({
          key: `move:${dest}`, kind: secret ? "passage" : "move",
          label: secret ? `Slip through the hidden passage to the ${dest}` : `Go to the ${dest}`,
          forecast: (secret ? "Unseen. " : "") + this.describeRoom(dest),
          dest,
        });
      }
      opts.push({
        key: "wait", kind: "wait", label: "Wait and watch",
        forecast: `Hold in the ${actor.room} and let the night come to you.`,
      });
      return opts;
    }

    apply(actor, opt) {
      if (opt.kind === "strike") {
        this.resolveAttempt(actor, this.byName[opt.victim], opt.method, opt.weapon, opt.witnessed);
      } else if (opt.kind === "arm") {
        const room = this.mansion.rooms[actor.room];
        actor.carrying = room.weapon; room.weapon = null;
        this.log({ type: "arm", actor: actor.name, weapon: actor.carrying, room: actor.room });
        this.remember(actor.name, 1, "own_arm", { weapon: actor.carrying, room: actor.room });
      } else if (opt.kind === "move" || opt.kind === "passage") {
        this.move(actor, opt.dest, opt.kind === "passage");
      } else {
        this.log({ type: "lurk", actor: actor.name, room: actor.room });
      }
    }

    move(actor, dest, secret) {
      const origin = actor.room;
      for (const other of this.inRoom(origin, actor.name))
        this.remember(other.name, 1, "saw_depart", { who: actor.name, to: secret ? null : dest });
      const occ = this.mansion.rooms[origin].occupants;
      occ.splice(occ.indexOf(actor.name), 1);
      actor.room = dest;
      this.mansion.rooms[dest].occupants.push(actor.name);
      for (const other of this.inRoom(dest, actor.name))
        this.remember(other.name, 1, "saw_arrive", { who: actor.name, frm: secret ? null : origin });
      this.remember(actor.name, 1, "own_move", { to: dest, secret });
      this.log({ type: secret ? "passage" : "move", actor: actor.name, frm: origin, to: dest });
      for (const victim of this.mansion.rooms[dest].bodies) {
        if (!this._discovered[actor.name].has(victim)) {
          this._discovered[actor.name].add(victim);
          this.remember(actor.name, 3, "found_body", { victim, room: dest });
          this.log({ type: "discover", actor: actor.name, victim, room: dest });
        }
      }
    }

    resolveAttempt(attacker, target, method, weapon, witnessed) {
      const margin = this.attackMargin(attacker, target, method, weapon);
      const room = this.mansion.rooms[attacker.room];
      const weaponName = method === "violence" ? weapon : "a doctored glass";
      const onlookers = this.inRoom(attacker.room, attacker.name).filter((o) => o !== target);

      if (margin >= 1) {
        target.alive = false;
        const occ = this.mansion.rooms[target.room].occupants;
        occ.splice(occ.indexOf(target.name), 1);
        room.bodies.push(target.name);
        this._discovered[attacker.name].add(target.name);
        if (target.carrying) { room.weapon = room.weapon || target.carrying; target.carrying = null; }
        attacker.kills.push(target.name);
        if (witnessed) attacker.suspicion += 5;
        let trace = method === "violence" ? 3 : 1;
        if (skill(attacker, "stealth") >= 4) trace -= 1;
        attacker.suspicion += Math.max(0, trace) + 1;
        const herring = this.redHerring(attacker, target);
        const death = {
          day: this.day, victim: target.name, culprit: attacker.name,
          room: attacker.room, weapon: weaponName, method, witnessed, redHerring: herring,
        };
        this.deaths.push(death);
        this.murderToday = death;
        this.remember(attacker.name, 3, "own_kill", { victim: target.name, room: attacker.room, method, weapon: weaponName });
        for (const o of onlookers)
          this.remember(o.name, 3, "witness_kill", { culprit: attacker.name, victim: target.name, room: attacker.room });
        this.log({ type: "kill", actor: attacker.name, victim: target.name, room: attacker.room, weapon: weaponName, method, witnessed, avenged: attacker.target === target.name });
      } else {
        attacker.suspicion += witnessed ? 5 : 4;
        this.remember(attacker.name, 3, "own_botch", { victim: target.name, room: attacker.room });
        this.remember(target.name, 3, "attacked", { culprit: attacker.name, room: attacker.room });
        for (const o of onlookers)
          this.remember(o.name, 3, "saw_botch", { culprit: attacker.name, victim: target.name, room: attacker.room });
        this.log({ type: "botch", actor: attacker.name, victim: target.name, room: attacker.room, weapon: weaponName, method, witnessed });
        this.flee(target, attacker);
      }
    }

    flee(actor, fromWhom) {
      const exits = this.mansion.neighbors(actor.room, this.knowsPassages(actor));
      let dest = exits[0], bestKey = null;
      for (const d of exits) {
        const key = [this.inRoom(d).length, d];
        if (bestKey === null || key[0] > bestKey[0] || (key[0] === bestKey[0] && key[1] > bestKey[1])) {
          bestKey = key; dest = d;
        }
      }
      this.move(actor, dest, false);
      this.log({ type: "flee", actor: actor.name, from_whom: fromWhom.name, to: dest });
    }

    redHerring(attacker, victim) {
      const pool = this.living().filter((c) => c !== attacker && c !== victim);
      if (!pool.length) return "an unlatched window and the storm howling through it";
      const patsy = last(pool[this.day % pool.length].name);
      const herrings = [
        `${patsy}'s handkerchief, dropped by the body`,
        `a thread of fabric matching ${patsy}'s coat`,
        `${patsy} was heard quarrelling with the victim at dinner`,
        "muddy footprints leading out into the drowned garden",
        "the grandfather clock stopped at the very minute of death",
      ];
      return herrings[this.day % herrings.length];
    }

    resolveExposure() {
      const living = this.living();
      if (living.length <= 2) return;
      const suspects = living.filter((c) => c.suspicion >= EXPOSE_THRESHOLD);
      if (!suspects.length) return;
      suspects.sort((a, b) => (b.suspicion - a.suspicion) || (b.kills.length - a.kills.length));
      const culprit = suspects[0];
      culprit.caught = true; culprit.exposedSecret = true;
      const occ = this.mansion.rooms[culprit.room].occupants;
      if (occ.includes(culprit.name)) occ.splice(occ.indexOf(culprit.name), 1);
      for (const c of living) if (c !== culprit) this.remember(c.name, 3, "unmasking", { culprit: culprit.name });
      this.remember(culprit.name, 3, "unmasked_self", {});
      this.log({ type: "unmask", actor: culprit.name, room: culprit.room, suspicion: culprit.suspicion, kills: culprit.kills.slice() });
    }

    decaySuspicion() { for (const c of this.living()) if (c.suspicion > 0) c.suspicion -= 1; }

    remember(owner, salience, kind, fields) {
      this.memory[owner].push(Object.assign({ day: this.day, salience, kind }, fields));
    }

    log(ev) { ev.day = this.day; this.events.push(ev); }

    orderedLiving() {
      const alive = new Set(this.living().map((c) => c.name));
      return this.initiative.filter((n) => alive.has(n)).map((n) => this.byName[n]);
    }

    // Async so an interactive player can take their time. chooseFor(actor,
    // options) may return a Promise; onDayEnd(day) is awaited each nightfall.
    async run(chooseFor, onDayEnd) {
      this.log({ type: "prologue" });
      let quiet = 0;
      while (this.day < this.maxDays && this.living().length > 1) {
        this.day += 1;
        this.murderToday = null;
        this.log({ type: "daybreak", day: this.day, survivors: this.living().map((c) => c.name) });
        for (let t = 0; t < this.turnsPerDay; t++) {
          for (const actor of this.orderedLiving()) {
            if (this.living().length <= 1) break;
            if (!actor.alive || actor.caught) continue;
            const options = this.options(actor);
            if (!options.length) continue;
            const choice = await chooseFor(actor, options);
            this.apply(actor, choice);
          }
        }
        const victim = this.murderToday ? this.murderToday.victim : null;
        this.log({ type: "nightfall", day: this.day, victim });
        this.resolveExposure();
        this.decaySuspicion();
        if (onDayEnd) await onDayEnd(this.day);
        quiet = this.murderToday ? 0 : quiet + 1;
        if (quiet >= 3) break;   // the scheming has burned out; the storm passes
      }
      return this.finish();
    }

    finish() {
      const living = this.living();
      const unmasked = this.cast.filter((c) => c.caught).map((c) => c.name);
      const mkResult = (winner, verdict, survivors) => ({
        winner, verdict, deaths: this.deaths, events: this.events,
        memory: this.memory, survivors, unmasked, days: this.day, cast: this.cast,
      });
      if (living.length === 1) {
        const w = living[0];
        const avenged = this.deaths.some((d) => d.culprit === w.name && d.victim === w.target);
        const verdict = `${w.name} walks out of Ravenhollow at dawn — the sole guest still breathing and above suspicion`
          + (avenged ? ", their business here finished." : ", though their true quarry slipped their grasp.");
        this.log({ type: "reveal", winner: w.name });
        return mkResult(w.name, verdict, [w.name]);
      }
      if (!living.length) {
        this.log({ type: "reveal", winner: null });
        return mkResult(null, "By the last dawn the manor is silent. No one won Ravenhollow — the house kept them all.", []);
      }
      const score = (c) => {
        const avenged = this.deaths.some((d) => d.culprit === c.name && d.victim === c.target) ? 1 : 0;
        return [avenged, c.kills.length, -c.suspicion, c.name];
      };
      let best = living[0], bestKey = score(best);
      for (const c of living) {
        const k = score(c);
        if (k[0] > bestKey[0] || (k[0] === bestKey[0] && (k[1] > bestKey[1]
          || (k[1] === bestKey[1] && (k[2] > bestKey[2]
            || (k[2] === bestKey[2] && k[3] > bestKey[3])))))) { best = c; bestKey = k; }
      }
      const names = living.map((c) => c.name).join(", ");
      const verdict = `The storm breaks with ${living.length} still at large (${names}). Of them, ${best.name} leaves strongest and least-suspected — the night, on balance, is theirs.`;
      this.log({ type: "reveal", winner: best.name });
      return mkResult(best.name, verdict, living.map((c) => c.name));
    }
  }

  // ---- the deterministic auto-chooser -----------------------------------
  function autoChoose(game, actor, options) {
    const others = game.inRoom(actor.room, actor.name);
    const threat = game.pressingThreat(actor, others);
    const needed = game.neededMargin(actor);
    const reckless = actor.vices.some((v) => RECKLESS_VICES.has(v));
    const hasMeans = options.some((o) => o.kind === "strike");
    const target = game.byName[actor.target];
    const targetAlive = target && target.alive;
    const knows = game.knowsPassages(actor);

    const scoreMove = (opt) => {
      let score = 140;
      if (!hasMeans) {
        const nm = game.distanceToMeans(opt.dest, actor, knows);
        if (nm !== null) score += 130 - 35 * nm;
      } else if (targetAlive) {
        const dt = game.mansion.bfsDistance(opt.dest, target.room, knows);
        if (dt !== null) score += 130 - 35 * dt;
      }
      if (threat) {
        const away = game.mansion.bfsDistance(opt.dest, threat.room, knows);
        score += 60 * (away || 0);
        score += 25 * game.inRoom(opt.dest).length;
        if (opt.kind === "passage") score += 120;
      }
      if (actor.vices.some((v) => DISTRACTIBLE_VICES.has(v)) && game.mansion.rooms[opt.dest].lure) score += 30;
      return score;
    };
    const scoreOne = (opt) => {
      if (opt.kind === "strike") {
        const margin = opt.margin == null ? -99 : opt.margin;
        const base = margin * 12;
        const bonus = opt.isTarget ? 200 : 0;
        if (opt.witnessed) {
          if (reckless && margin >= needed) return 300 + base + bonus - opt.suspicionRisk * 12;
          return -1e9;
        }
        if (margin >= needed) return 1000 + base + bonus - opt.suspicionRisk * 3;
        return 120 + base + bonus;
      }
      if (opt.kind === "arm") return hasMeans ? 110 : 360;
      if (opt.kind === "move" || opt.kind === "passage") return scoreMove(opt);
      if (opt.kind === "wait") return others.includes(target) ? 90 : 30;
      return 0;
    };

    let best = options[0], bestScore = -1e18;
    for (const opt of options) {
      const s = scoreOne(opt);
      if (s > bestScore) { best = opt; bestScore = s; }
    }
    return best;
  }

  root.MV = root.MV || {};
  Object.assign(root.MV, {
    Game, buildCast, buildMansion, autoChoose, last,
    helpers: { skill, hasVice, offense, defense },
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
