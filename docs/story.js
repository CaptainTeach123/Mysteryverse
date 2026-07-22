/* Mysteryverse — the procedural narrative engine.
 *
 * Two things live here:
 *   1. The Chronicler — an eighth "agent" who is no one in the story. She sets
 *      each day in the classic closed-circle manner: the weather, the house,
 *      the dwindling company, the dread. She never acts; she only describes.
 *   2. The experience layer — each guest's day is read out of what they
 *      actually did, saw, and survived, turned into an emotional state, and
 *      composed into flowing prose coloured by their nature. No two nights read
 *      the same, and none of it is random.
 */
(function (root) {
  "use strict";
  const MV = root.MV;
  const last = MV.last;
  const pick = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];

  // =====================================================================
  //  THE CHRONICLER  (the eighth agent — the voice of the house itself)
  // =====================================================================
  const STORM = {
    early: [
      "Rain walked the length of every window in the night and had not stopped by morning.",
      "The storm had settled over the old house like a broad hand laid flat upon the roof.",
      "All night the rain came down in ropes, and the swollen race where the bridge had stood roared on in the dark.",
    ],
    mid: [
      "The storm had found its full voice now, and the old house groaned beneath it like a ship ill at anchor.",
      "Thunder had moved in over the moor, and each peal set the chandeliers trembling on their chains.",
      "The wind had teeth by now; it worried at the eaves and found every gap the century had left it.",
    ],
    late: [
      "The storm was tiring at last, spent and grey — though it had taken its toll, and meant to take more before it went.",
      "A thin light bled through the cloud at last, the storm loosening its grip on a house it had already changed.",
      "The rain had gentled to a whisper, as if even the weather had grown wary of what went on beneath the roof.",
    ],
  };
  const HOUSE = [
    "The great house held its breath.",
    "Somewhere along the passages a shutter had worked loose, and it knocked, and knocked, and no one went to still it.",
    "The lamps guttered low; the generator, like everything at Ravenhollow, was not a thing to be relied upon.",
    "Dust-sheets stirred in rooms no one used, though there was no draught anyone could name.",
    "The portraits watched from the walls with the patience of the long dead, who have seen it all before.",
  ];
  const FORESHADOW = [
    "By nightfall, Ravenhollow would be one guest the lighter. None of them yet knew which.",
    "The day stretched ahead, long and shuttered, and full of doors that would not stay closed.",
    "Whatever was going to happen would happen indoors, where there was nowhere left to run to.",
    "Each of them smiled at the others over the coffee, and each of them counted the exits.",
    "The house had all the time in the world. Its guests, one by one, were running out of theirs.",
  ];
  const ORD = ["", "first", "second", "third", "fourth", "fifth", "sixth",
    "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"];
  const MORNING_OPEN = [
    "The {nth} morning came grey and grudging to Ravenhollow.",
    "Dawn found Ravenhollow on the {nth} day of its siege by the storm.",
    "The {nth} day broke over the manor, if that wan light could be called breaking.",
    "Morning the {nth} arrived without conviction, the sun no more than a rumour behind the cloud.",
  ];

  function stormStage(game) {
    const alive = game.living().length;
    if (game.day <= 1 || alive >= 6) return "early";
    if (alive >= 3) return "mid";
    return "late";
  }

  function chroniclerMorning(game) {
    const alive = game.living().length;
    const nth = ORD[game.day] || `${game.day}th`;
    const parts = [];
    parts.push(pick(MORNING_OPEN, game.day).replace("{nth}", nth));
    parts.push(pick(STORM[stormStage(game)], game.day));
    parts.push(pick(HOUSE, game.day + 1));
    if (game.day === 1) {
      parts.push("Seven guests had crossed the bridge before the water rose and took it. Seven came down to breakfast that first cold morning — and every one of them was lying about why they had come.");
    } else {
      const yest = game.deaths.filter((d) => d.day === game.day - 1);
      if (yest.length) {
        parts.push(`At breakfast there were ${alive} where the evening before there had been ${alive + 1}. No one looked at the empty chair; no one could quite look away from it, either.`);
      } else {
        parts.push(`${alive} of them still came down to breakfast, and sat a little further apart than the day before.`);
      }
    }
    parts.push(pick(FORESHADOW, game.day));
    return parts.join(" ");
  }

  function chroniclerClose(game) {
    const alive = game.living().length;
    if (alive <= 1) return "And then there was one. The storm broke over an empty house, and Ravenhollow kept its counsel, as great houses do.";
    return `Night came down black and total. ${alive} still drew breath under that roof — and not one of them believed they would be the one to fall.`;
  }

  // =====================================================================
  //  EXPERIENCE  →  EMOTION
  // =====================================================================
  // Read a guest's day out of their own memory and turn it into a mood.
  function mood(agent, game, day) {
    const mem = game.memory[agent.name].filter((e) => e.day === day);
    const ax = { fear: 0, guilt: 0, resolve: 0, dread: 0, paranoia: 0, triumph: 0 };
    for (const e of mem) {
      if (e.kind === "attacked") ax.fear += 3;
      else if (e.kind === "own_kill") { ax.guilt += 2; ax.triumph += 2; ax.resolve += 1; }
      else if (e.kind === "own_botch") ax.fear += 2;
      else if (e.kind === "found_body") ax.dread += 2;
      else if (e.kind === "witness_kill") ax.dread += 3;
      else if (e.kind === "unmasking") ax.paranoia += 1;
    }
    ax.paranoia += Math.min(3, agent.suspicion);
    if (agent.carrying) ax.resolve += 1;
    const mark = game.byName[agent.target];
    if (!mark.alive) ax.triumph += 2;
    // Nature bends feeling: the coward magnifies fear, the wrathful burns it to
    // resolve, the zealot feels no guilt, the proud will not admit to dread.
    const v = agent.vices;
    if (v.includes("cowardice")) ax.fear *= 1.7;
    if (v.includes("wrath")) { ax.resolve += ax.fear * 0.6; ax.fear *= 0.4; }
    if (v.includes("paranoia")) ax.paranoia += 2;
    if (v.includes("pride") || v.includes("arrogance")) { ax.guilt *= 0.4; ax.fear *= 0.6; ax.dread *= 0.6; }
    if (v.includes("fanaticism")) { ax.guilt *= 0.15; ax.resolve += 2; }
    if (v.includes("secrecy")) ax.paranoia += 1;
    let dom = "steady", max = 0.6;
    for (const k of Object.keys(ax)) if (ax[k] > max) { max = ax[k]; dom = k; }
    return { ax, dom };
  }

  const OPEN = {
    fear: ["You spent the day listening for a footstep behind your own.", "Something had gone cold and watchful in you, and it did not thaw.", "You caught yourself counting the others, and counting the doors."],
    guilt: ["There was a thing you had done, and it kept step with you all day, just at your shoulder.", "You had crossed a line in the night, and the morning did not let you forget where.", "Your hands looked no different. That was the strange part."],
    resolve: ["You woke with your purpose ground to a single bright point.", "Whatever softness you had brought into this house, the day had worn it away.", "You had stopped hoping to leave clean. Now you only meant to leave."],
    dread: ["Death had been in the house, and you had breathed the air it left behind.", "You could not shake the sense of the walls leaning in a fraction closer.", "A cold had got into you that no fire in this house could reach."],
    paranoia: ["You trusted no one at breakfast, and rather less than no one by dusk.", "Every kindness offered you today, you turned over looking for the blade in it.", "You had begun to read murder in the way people passed the salt."],
    triumph: ["Something in you had settled at last; a debt, long carried, sat lighter on the shoulders.", "You had come here to do one thing, and the doing of it had changed the taste of the air.", "There was a stillness in you now that the others mistook for grief."],
    steady: ["You kept your head down and your eyes open, which is all one can do in a house like this.", "You moved through the day carefully, giving nothing away.", "You played your part, and watched the others play theirs."],
  };
  const CLOSE = {
    fear: (a) => `Tonight you bolt the door and sit with your back to the wall. ${a} others still breathe in this house — and you mean to be counted among them come morning.`,
    guilt: (a) => `Tonight you lie awake, and the house lies awake with you. ${a} of you are left, and the arithmetic of it does not comfort you at all.`,
    resolve: (a) => `Tonight you sharpen your intent along with everything else. ${a} remain. You do not intend to be the one they carry out.`,
    dread: (a) => `Tonight the storm does most of the talking. ${a} still living, and every one of them wondering, as you are, who will not wake.`,
    paranoia: (a) => `Tonight you trust the lock and nothing else. Of the ${a} left, you are certain of only one thing: at least one means you dead.`,
    triumph: (a) => `Tonight you sleep, or something near it. ${a} remain, and the night is not finished with any of you.`,
    steady: (a) => `Tonight you take your rest in pieces, one ear open. ${a} of you left. One fewer, most likely, by the time the grey comes back.`,
  };
  const TRANSITIONS = ["Later,", "By afternoon,", "After that,", "Some hours on,", "Then,", "Before the light went,"];

  // Compose one guest's night from the day they actually had.
  function reflect(agent, game, day, beats, deathLines) {
    const m = mood(agent, game, day);
    const header = (MV.text.VOICES[agent.name] || {}).header || `${last(agent.name)}'s account`;
    const lines = [{ dh: `${header} — night of the ${ORD[day] || day + "th"} day` }];
    lines.push({ op: pick(OPEN[m.dom], day) });
    (beats || []).forEach((b, i) => {
      lines.push({ p: (i > 0 ? pick(TRANSITIONS, day + i) + " " : "") + b });
    });
    (deathLines || []).forEach((d) => lines.push({ death: d }));
    lines.push({ p: (CLOSE[m.dom] || CLOSE.steady)(Math.max(0, game.living().length)) });
    return lines;
  }

  // =====================================================================
  //  PLACE  — a reactive line of atmosphere on top of the room's own prose
  // =====================================================================
  // A reactive line of atmosphere the room's own description can't carry — the
  // scene handles who is present, so this speaks only to what has happened here.
  function place(roomName, game, viewer) {
    const room = game.mansion.rooms[roomName];
    if (room.bodies.length) {
      return "And there, where the shadows pool, a shape on the floor that had been a guest only this morning. The room has not finished being a place where that happened.";
    }
    return "";
  }

  MV.story = {
    chronicler: { name: "The Chronicler of Ravenhollow", epithet: "the voice of the house" },
    morning: chroniclerMorning, dusk: chroniclerClose,
    mood, reflect, place,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
