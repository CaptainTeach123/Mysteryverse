/* Mysteryverse — the seven chroniclers and the god's-eye narrator, ported from
 * the Python. Each guest journals only what they could witness, in their own
 * voice. Pure text, no DOM. */
(function (root) {
  "use strict";
  const MV = root.MV;
  const last = MV.last;

  const ORD = ["zeroth", "first", "second", "third", "fourth", "fifth", "sixth",
    "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"];
  const ordinal = (n) => ORD[n] || `${n}th`;

  const VOICES = {
    "Dr. Adrian Vell": {
      header: "From the case-notes of A. Vell",
      opener: "I record the day's particulars, as is my habit.", hazy: true,
      kill: (e) => `I saw to it that ${last(e.victim)} would trouble no one further — a measured dose in the ${e.room}, no mess, no struggle. One does what the case requires.`,
      body: (e) => `I examined ${last(e.victim)}'s body in the ${e.room}. Cause of death plain enough; the hand behind it is not my concern.`,
      attacked: (e) => `${last(e.culprit)} made an attempt on me in the ${e.room}. Clumsy. I shall be watching them now.`,
    },
    "Miss Isolde Frayne": {
      header: "Isolde's diary",
      opener: "Dearest diary — another day of smiles I did not mean.", hazy: false,
      kill: (e) => `I did for ${last(e.victim)} in the ${e.room}. For my sister. My hands did not so much as tremble, and my face gave nothing away.`,
      body: (e) => `I found ${last(e.victim)} dead in the ${e.room}. I arranged my expression into horror before anyone looked. I have no notion who did it.`,
      attacked: (e) => `${last(e.culprit)} tried to kill me in the ${e.room} — and ruined my composure, the brute. I know their face now.`,
    },
    "Colonel Roderick Mace": {
      header: "Mace. Field notes",
      opener: "Keeping a record. Old habit from the service.", hazy: true,
      kill: (e) => `Cornered ${last(e.victim)} in the ${e.room} and finished it. Soldier's work. Did not linger.`,
      body: (e) => `Found ${last(e.victim)} dead in the ${e.room}. Someone got there ahead of me. Good luck to them.`,
      attacked: (e) => `${last(e.culprit)} came at me in the ${e.room}. They will not get a second chance. Damn them.`,
    },
    "Silas Crane": {
      header: "S.C. — private",
      opener: "Writing this with the door bolted. My hands won't keep still.", hazy: false,
      kill: (e) => `God forgive me, I killed ${last(e.victim)} in the ${e.room}. It was them or me. I only want to leave this cursed house alive.`,
      body: (e) => `I found ${last(e.victim)} dead in the ${e.room} and near cried out. Who is doing this? I want to go home.`,
      attacked: (e) => `${last(e.culprit)} tried to do me in the ${e.room}. I nearly died. I have to get them first now, God help me.`,
    },
    "Lady Bianca Ashford": {
      header: "Lady Ashford's journal",
      opener: "One keeps a journal so that history has the correct account.", hazy: false,
      kill: (e) => `${last(e.victim)} has been dealt with in the ${e.room}. Distasteful work, but the estate does not inherit itself, and physicians do talk.`,
      body: (e) => `I discovered ${last(e.victim)} quite dead in the ${e.room}. How very inconsiderate of someone. I summoned no one; why should I?`,
      attacked: (e) => `That creature ${last(e.culprit)} dared raise a hand to me in the ${e.room}. They will regret living long enough to try.`,
    },
    "Cornelius Blackwood": {
      header: "The host's ledger",
      opener: "My house. My night. I note who moves, and how.", hazy: false,
      kill: (e) => `${last(e.victim)} joined the manor's older ghosts today, in the ${e.room}. They should not have accepted my invitation.`,
      body: (e) => `${last(e.victim)} lies dead in the ${e.room}. One fewer beneath my roof. I trust none of those who remain.`,
      attacked: (e) => `${last(e.culprit)} moved against me in the ${e.room}. In my own house. I know the passages they do not; that was their only mistake, and their last free one.`,
    },
    "Mother Genevieve": {
      header: "Night office of G.",
      opener: "I set down the day before prayers, that nothing be forgotten.", hazy: false,
      kill: (e) => `The Lord's mercy is sometimes hemlock. I delivered ${last(e.victim)} from a life past saving, in the ${e.room}, and I do not repent it.`,
      body: (e) => `I found ${last(e.victim)} gone from this world in the ${e.room}. I crossed myself, and I said nothing to the others. Judgment is coming to this house.`,
      attacked: (e) => `${last(e.culprit)} raised a hand against me in the ${e.room}. So even the wolves sense the shepherd. I am not afraid.`,
    },
  };

  function movementSummary(entries) {
    const seen = [];
    for (const e of entries) {
      if (e.kind === "saw_arrive") seen.push(`${last(e.who)} appeared` + (e.frm ? ` from the ${e.frm}` : " from nowhere I could see"));
      else if (e.kind === "saw_depart") seen.push(`${last(e.who)} slipped off` + (e.to ? ` toward the ${e.to}` : " and simply vanished"));
    }
    if (!seen.length) return null;
    const uniq = [...new Set(seen)].slice(0, 4);
    return "Comings and goings: " + uniq.join("; ") + ".";
  }

  function entryLine(profile, e) {
    switch (e.kind) {
      case "own_kill": return profile.kill(e);
      case "found_body": return profile.body(e);
      case "attacked": return profile.attacked(e);
      case "witness_kill": return `I saw it done with my own eyes: ${last(e.culprit)} killed ${last(e.victim)} in the ${e.room}. I will not forget the sight, whatever I say aloud.`;
      case "saw_botch": return `I watched ${last(e.culprit)} lunge at ${last(e.victim)} in the ${e.room} and fail. Their mask is off, to me at least.`;
      case "own_botch": return `I moved on ${last(e.victim)} in the ${e.room} and it went wrong. They live, and worse, they saw me. I must be quicker and cleverer than that.`;
      case "unmasking": return `Tonight the household turned on ${last(e.culprit)}. Too much blood pointed their way. They are seized and locked away.`;
      case "unmasked_self": return "They have turned on me. They believe they know. My part in this night is finished, behind a bolted door.";
      default: return null;
    }
  }

  function chronicleDay(name, memory, day, cast) {
    const profile = VOICES[name];
    const todays = memory.filter((e) => e.day === day);
    const me = cast.find((c) => c.name === name);
    const lines = [];
    lines.push({ h: `${profile.header} — night of the ${ordinal(day)} day` });
    lines.push({ o: profile.opener });
    const highs = todays.filter((e) => e.salience >= 3);
    const body = highs.map((e) => entryLine(profile, e)).filter(Boolean);
    if (body.length) body.forEach((b) => lines.push({ p: b }));
    else if (profile.hazy && todays.filter((e) => e.kind.startsWith("saw")).length >= 3)
      lines.push({ p: "Much of today is a fog to me — I had been indulging, and the hours ran together." });
    else lines.push({ p: "A quiet day, for this house. I kept my counsel and my distance." });
    const move = movementSummary(todays);
    if (move && (body.length || !profile.hazy)) lines.push({ m: move });
    const recorded = memory.filter((e) => e.day >= 1).map((e) => e.day);
    const finalDay = recorded.length && day === Math.max(...recorded);
    if (finalDay) {
      if (!me.alive) lines.push({ tag: "This is the last thing they ever wrote." });
      else if (me.caught) lines.push({ tag: "The entry ends mid-sentence." });
    }
    return lines;
  }

  function chronicleDays(name, result) {
    const mem = result.memory[name];
    const days = [...new Set(mem.filter((e) => e.day >= 1).map((e) => e.day))].sort((a, b) => a - b);
    return days.map((d) => {
      const quiet = mem.filter((e) => e.day === d && e.salience >= 3).length === 0;
      return { day: d, quiet, lines: chronicleDay(name, mem, d, result.cast) };
    });
  }

  // ---- god's-eye story --------------------------------------------------
  const ORD_CAP = ["", "First", "Second", "Third", "Fourth", "Fifth", "Sixth",
    "Seventh", "Eighth", "Ninth", "Tenth", "Eleventh", "Twelfth"];

  function storyLines(result) {
    const out = [];
    for (const ev of result.events) {
      const t = ev.type;
      if (t === "prologue") out.push({ head: "Dusk, the first evening", sub: "The guests gather in the Foyer; the lamps are lit." });
      else if (t === "daybreak") out.push({ day: `The ${ORD_CAP[ev.day] || ev.day + "th"} Day` });
      else if (t === "nightfall") out.push({ night: ev.victim ? `Night falls. ${last(ev.victim)} will not see morning.` : "Night falls, and for once no one has died." });
      else { const l = eventLine(ev); if (l) out.push({ line: l, kind: t }); }
    }
    return out;
  }

  function eventLine(ev) {
    switch (ev.type) {
      case "arm": return `${last(ev.actor)} palms the ${ev.weapon} in the ${ev.room}.`;
      case "flee": return `${last(ev.actor)}, sensing ${last(ev.from_whom)} at their back, breaks for the ${ev.to}.`;
      case "passage": return `${last(ev.actor)} steps into a panel in the ${ev.frm} and out into the ${ev.to} — a way only the host knows.`;
      case "discover": return `${last(ev.actor)} enters the ${ev.room} and finds ${last(ev.victim)}'s body.`;
      case "kill": {
        const how = ev.method === "poison" ? "presses a doctored glass on them" : `uses the ${ev.weapon}`;
        const tail = ev.witnessed ? " — and others see it done" : (ev.avenged ? " — the debt, at last, paid" : "");
        return `In the ${ev.room}, ${last(ev.actor)} catches ${last(ev.victim)} alone and ${how}. ${last(ev.victim)} does not rise${tail}.`;
      }
      case "botch": return `${last(ev.actor)} lunges at ${last(ev.victim)} in the ${ev.room} and fails${ev.witnessed ? " in full view" : ""}. Now ${last(ev.victim)} knows.`;
      case "unmask": return `The household turns on ${last(ev.actor)} — too much blood, too many coincidences. They are seized and locked away.`;
      default: return null;
    }
  }

  MV.text = { VOICES, chronicleDay, chronicleDays, storyLines, ordinal };
})(typeof globalThis !== "undefined" ? globalThis : this);
