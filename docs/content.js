/* Mysteryverse — the narrative layer. All authored, all deterministic: the
 * words a guest thinks and says, the shape of each day's two decisions, and the
 * dispatches on the dead. No randomness, no model calls — pick the same guest
 * and make the same choices and you read the same story every time.
 */
(function (root) {
  "use strict";
  const MV = root.MV;
  // Accept either a name string or a character object.
  const last = (x) => MV.last(typeof x === "string" ? x : x.name);
  const the = (r) => `the ${r}`;

  // Per-guest narrative voice. Each has three day-intents and a set of lines
  // for the scenes those intents lead into.
  const NARR = {
    "Dr. Adrian Vell": {
      hunt: { title: "Attend to Blackwood", mono: "The blackmail letters will not stop coming while he breathes. I am a physician; I know precisely how a man is made to stop. Today I find Cornelius, and I take his pulse one last time." },
      prepare: { title: "Prepare a dose", mono: "One does not improvise. I need the right room, the right glass, the right quiet. Let me lay my instruments in order before I use them." },
      lielow: { title: "Keep a steady face", mono: "The morphine steadies the hand but blurs the hours. Better to withdraw, observe, and let the amateurs draw the eye while I keep mine clear." },
      strike: (v) => `A measured dose. ${last(v)} will feel only a little tired, then nothing at all. I have done this before; the trick is not to hurry.`,
      lull: (v) => `"You look unwell, ${last(v)} — let me pour you something for the nerves. No, no, I insist. A physician's orders." Trust is the finest anaesthetic.`,
      deflect: (h) => `I keep my voice level, the way I do at a deathbed. "You seem agitated, ${last(h)}. Sit. Breathe." Let them think me harmless.`,
      converse: (o) => `I ask after ${last(o)}'s health and watch their hands, their pupils, the little tells. People confess so much to a doctor without meaning to.`,
      withdraw: () => "I excuse myself, unhurried. A physician is never seen to flee — only to be needed elsewhere.",
      solo: () => "Alone at last. I check my supplies and my sleeve, and I let the drug take the edge off the noise in my head.",
      onDeath: (v) => `Another body. I could tell them the cause of death to the hour, but I find I would rather not be asked.`,
    },
    "Miss Isolde Frayne": {
      hunt: { title: "Find Lady Ashford", mono: "She ruined my sister the way one snaps a fan — carelessly, and then forgot. I have practised this smile in a hundred mirrors. Today Bianca sees it up close." },
      prepare: { title: "Slip something useful into a sleeve", mono: "A girl learns to lift what she needs and be three rooms away before it's missed. Let me arm myself the quiet way, and no one the wiser." },
      lielow: { title: "Play the frightened ingénue", mono: "Nobody suspects the trembling débutante. Let me be seen being afraid in the right company while the wolves eat each other." },
      strike: (v) => `For Cecily. My hand is perfectly steady — I made sure of that. ${last(v)} never learned my real name, and now she never will.`,
      lull: (v) => `"Oh, Lady Ashford, they're all so cruel to me — you at least understand." Flatter the vain and they lean right into the knife.`,
      deflect: (h) => `I let my eyes fill — it takes nothing — and I make ${last(h)} feel like a brute for frightening a girl like me.`,
      converse: (o) => `I giggle and confide and ask ${last(o)} a hundred nothings, and somewhere in the answers is the one thing I actually wanted.`,
      withdraw: () => "I dab my eyes, murmur an apology to no one, and drift out like a girl too delicate for all this.",
      solo: () => "Alone, I let the accent drop and my face go flat and cold. This is the only room where I get to be myself.",
      onDeath: (v) => `${last(v)} is dead. I arrange my features into the correct amount of horror. It is, honestly, my best work.`,
    },
    "Colonel Roderick Mace": {
      hunt: { title: "Run down Crane", mono: "The little worm saw what happened on the ridge and he has a mouth. Mouths get men hanged. I have buried better than Silas Crane in worse weather than this." },
      prepare: { title: "Secure a weapon", mono: "Never go into a room you might have to leave through a man. Get iron in my fist first; the rest is drill." },
      lielow: { title: "Hold the line and drink", mono: "Damn all of them. I'll take a position with a good sightline and a bottle, and let the cowards make the first mistake." },
      strike: (v) => `Quick and done, the way you're taught. ${last(v)} opens his mouth — to beg or to talk, doesn't matter now — and I make certain it's the last thing it does.`,
      lull: (v) => `I clap ${last(v)} on the shoulder like an old comrade. "No hard feelings, eh? Have a drink with me." Get him close, get him easy.`,
      deflect: (h) => `I square up and let ${last(h)} see the size of the mistake they'd be making. Some threats you answer by simply being larger than the room.`,
      converse: (o) => `I stand ${last(o)} a drink and steer the talk to the ridge, to who saw what. I want to know how many mouths I have left to close.`,
      withdraw: () => "I fall back in good order — not a retreat, a redeployment — and find the next bottle.",
      solo: () => "Alone with the storm and the drink. The ridge comes back when it's quiet. I pour another to drown it.",
      onDeath: (v) => `${last(v)} down. One less problem, or one more, depending. I check my flank and keep my back to a wall.`,
    },
    "Silas Crane": {
      hunt: { title: "Get to the Colonel first", mono: "He means to bury me over that ridge business. So it's simple arithmetic, isn't it — the creditor can't collect a debt if the creditor's cold. I just have to be braver than I've ever been, once." },
      prepare: { title: "Palm something sharp", mono: "I'm no fighter, God knows. But I've light fingers, and a light finger on the right blade evens a lot of odds. Let me lift what I need." },
      lielow: { title: "Make myself scarce", mono: "Every instinct I've got says hide, and my instincts have kept me alive this long. Let the big dogs bite each other; I'll be under the table." },
      strike: (v) => `My hands are shaking so badly I can barely — no. No, do it, do it now, before you lose your nerve. It's ${last(v)} or you, Silas. It was always going to be one of you.`,
      lull: (v) => `I give ${last(v)} my very best smile, the one that's sold worthless shares to bishops. "Between us? I think we want the same thing here." Keep them talking, keep them still.`,
      deflect: (h) => `I babble — apologies, jokes, anything — and back toward a door the whole time. A coward who keeps talking is a coward who's still breathing.`,
      converse: (o) => `I flatter ${last(o)} and trade a little secret to get a bigger one. Information's the only currency that still spends in this house.`,
      withdraw: () => "I'm gone before the sentence is finished — out the door, down the hall, heart going like a hammer.",
      solo: () => "Bolt the door. Catch my breath. Count the exits. I just have to outlive them, that's all. Just outlive them.",
      onDeath: (v) => `${last(v)}'s dead and I nearly bring up my dinner. Who's next, who's next — please God don't let it be me.`,
    },
    "Lady Bianca Ashford": {
      hunt: { title: "Settle accounts with Vell", mono: "The physician is the last signature between me and everything the Ashfords own. Doctors sign the certificates, after all — and doctors, it turns out, can be prescribed to." },
      prepare: { title: "Arrange the particulars", mono: "One does not do these things oneself, as a rule. But the storm has dismissed the staff, so one adapts — with taste, and with gloves." },
      lielow: { title: "Hold court and observe", mono: "Let the grasping little people scurry. I shall take the best chair, the best light, and watch to see which of them proves useful and which merely inconvenient." },
      strike: (v) => `A pity, in its way. But ${last(v)} stood between an Ashford and her inheritance, and that is a very foolish place to stand. I have done this before, and signed nothing.`,
      lull: (v) => `I bestow upon ${last(v)} the warmth I usually reserve for people who matter. "You've been so terribly misjudged. Come, sit with me." They are always so grateful to be noticed.`,
      deflect: (h) => `I look ${last(h)} up and down as though pricing a chair, and let my silence remind them precisely who they are addressing.`,
      converse: (o) => `I permit ${last(o)} the honour of my conversation and extract, between pleasantries, exactly what they know and exactly what they want.`,
      withdraw: () => "I take my leave as though the room has bored me — which, frankly, it has.",
      solo: () => "Alone, I permit myself a small glass and a larger satisfaction. It is all going rather to plan.",
      onDeath: (v) => `${last(v)}, dead. How dreadfully untidy. One does hope someone competent disposes of the — well. Not my concern.`,
    },
    "Cornelius Blackwood": {
      hunt: { title: "Hunt Frayne through my house", mono: "She thinks the demure little act fools me. I read her letters before she ever crossed my threshold. This is my house, and I know every passage in it that she does not. Tonight I close one behind her." },
      prepare: { title: "Move through the passages", mono: "Let the others blunder down corridors. I have doors they've never seen. Let me position myself where I can arrive from nowhere and leave the same way." },
      lielow: { title: "Watch from the walls", mono: "Paranoia is only foresight that has been proven right. I'll withdraw to where I can see them all and be seen by none, and I will trust not one of them." },
      strike: (v) => `In my own house, at the hour of my choosing. ${last(v)} came here to wrong me and will leave here not at all. The manor has swallowed better guests.`,
      lull: (v) => `I play the gracious host to the last. "You must be cold — come, there's a fire only I know how to find." They follow the master of the house. They always follow.`,
      deflect: (h) => `I smile the smile that has unsettled cleverer people than ${last(h)}, and let them wonder how much I already know.`,
      converse: (o) => `I ask ${last(o)} a soft question I already know the answer to, simply to watch them decide whether to lie to me under my own roof.`,
      withdraw: () => "I step through a panel that isn't a panel and am, to the room, simply no longer there.",
      solo: () => "Alone in the bones of my house, I listen to it breathe. Every creak is a guest, and every guest is a debt owed to me.",
      onDeath: (v) => `${last(v)} has joined the older ghosts. My house keeps a long ledger, and tonight it collects. I trust none of those still standing.`,
    },
    "Mother Genevieve": {
      hunt: { title: "Seek out the Colonel", mono: "I have followed his soul across years and found no light left in it. What I bring is not murder but mercy, and mercy sometimes wears the face of hemlock. The Lord will know His own." },
      prepare: { title: "Prepare the sacrament", mono: "The herbs must be measured with a steady, prayerful hand. Let me find the quiet and the leaf, and make ready the cup that delivers judgment." },
      lielow: { title: "Keep the vigil", mono: "I am patient as scripture. Let me withdraw and pray and watch, and let the wicked reveal themselves, as the wicked always do." },
      strike: (v) => `Be at peace, ${last(v)}. This is not vengeance; it is the closing of a wound that would not heal. I deliver you, and I do not repent it.`,
      lull: (v) => `I take ${last(v)}'s hands in mine and speak of forgiveness until the fear goes out of them. "Let me pray with you." The lamb comes quietest when it is comforted.`,
      deflect: (h) => `I meet ${last(h)}'s anger with a stillness that unnerves the guilty. "I will pray for you," I tell them, and mean it, and watch them flinch.`,
      converse: (o) => `I invite ${last(o)}'s confession without seeming to, and they unburden more than they intend. Even sinners long to be heard.`,
      withdraw: () => "I bow my head, murmur a blessing, and withdraw into the shadows of the house like a candle carried away.",
      solo: () => "Alone, I kneel and pray, and the storm sounds very like a congregation that has not yet learned to be afraid.",
      onDeath: (v) => `${last(v)} has gone to be judged. I cross myself and say nothing to the others. This house is being weighed, and found wanting.`,
    },
  };

  // Relationship AS THE PLAYER KNOWS IT. Your mark you always know. A hunter
  // reads as a hunter only once you've discovered they mean you harm — until
  // then they are just another guest, which is exactly how the trap is sprung.
  const REL = (game, player, subject, known) => {
    if (!subject) return "none";
    if (subject.name === player.target) return "mark";
    if (known && known.has && known.has(subject.name)) return "hunter";
    return "neutral";
  };

  // Spoiler-free teasers for the guest list — no targets, no motives named.
  const HOOKS = {
    "Dr. Adrian Vell": "A physician with a steady hand and a secret worth killing to keep.",
    "Miss Isolde Frayne": "A demure débutante whose smile never quite reaches her eyes.",
    "Colonel Roderick Mace": "A decorated colonel who does not care to discuss the ridge.",
    "Silas Crane": "A silver-tongued confidence man who owes the wrong person.",
    "Lady Bianca Ashford": "An heiress for whom an inheritance is worth any inconvenience.",
    "Cornelius Blackwood": "The host — who has invited every one of his enemies under a single roof.",
    "Mother Genevieve": "A nun whose visions all seem to concern other people's sins.",
  };

  // Some guests simply know who hunts them. The host read everyone's mail
  // before they arrived; the rest must find out the hard way.
  function initialKnownHunters(game, playerName) {
    const known = new Set();
    if (playerName === "Cornelius Blackwood") {
      for (const c of game.cast) if (c.target === playerName) known.add(c.name);
    }
    return known;
  }

  // ---- the three day-intents -------------------------------------------
  function dayIntents(game, player) {
    const n = NARR[player.name];
    const markAlive = game.byName[player.target].alive && !game.byName[player.target].caught;
    const hunt = markAlive
      ? { key: "hunt", title: n.hunt.title, mono: n.hunt.mono, goal: "mark" }
      : { key: "hunt", title: "Finish what's left", mono: "My mark is cold already. Now there is only the small matter of being the one who walks out. I go looking for whoever stands between me and the door.", goal: "rival" };
    return [
      hunt,
      { key: "prepare", title: n.prepare.title, mono: n.prepare.mono, goal: "arm" },
      { key: "lielow", title: n.lielow.title, mono: n.lielow.mono, goal: "safe" },
    ];
  }

  // ---- the arrival scene -----------------------------------------------
  function sceneProse(game, player, subject, known) {
    const room = game.mansion.rooms[player.room];
    const here = game.inRoom(player.room, player.name);
    const lines = [];
    lines.push(`${cap(the(player.room))}. ${room.description}`);
    const atmo = MV.story && MV.story.place(player.room, game, player);
    if (atmo) lines.push(atmo);
    if (!subject) {
      if (here.length) lines.push(`Only ${orList(here.map((c) => last(c.name)))} drift at the edges of the room, intent on their own business.`);
      else lines.push("The room is empty, and for a moment the storm is the only company you have.");
      lines.push(NARR[player.name].solo());
      return lines;
    }
    const rel = REL(game, player, subject, known);
    const others = here.filter((c) => c !== subject);
    lines.push(`And there — ${subject.name}, ${subject.title}, ${manner(subject)}.` +
      (others.length ? ` ${cap(orList(others.map((c) => last(c.name))))} ${others.length > 1 ? "are" : "is"} here too, which changes what a careful person can risk.` : " You are, for the moment, alone together."));
    if (rel === "mark") lines.push(NARR[player.name].readMark ? NARR[player.name].readMark(subject) : `Your mark. Everything you came to this house to do ends with them.`);
    else if (rel === "hunter") lines.push(`This one hunts you — you have seen it in how ${last(subject.name)} watches the doors. Careful now.`);
    else lines.push(`No quarrel between you and ${last(subject.name)} — not yet. But everyone here is worth reading.`);
    return lines;
  }

  const MANNER = {
    "Dr. Adrian Vell": "turning a small brown bottle over in pale fingers",
    "Miss Isolde Frayne": "all wide eyes and a smile that doesn't reach them",
    "Colonel Roderick Mace": "big and still and smelling of the cellar's best",
    "Silas Crane": "sweating, eyes flicking to every exit",
    "Lady Bianca Ashford": "seated as though the chair were a throne",
    "Cornelius Blackwood": "watching you the way a house watches a thief",
    "Mother Genevieve": "hands folded, lips barely moving in prayer",
  };
  const manner = (c) => MANNER[c.name] || "waiting";

  // ---- the three in-scene actions --------------------------------------
  function sceneOptions(game, player, subject, known) {
    const n = NARR[player.name];
    const room = game.mansion.rooms[player.room];
    const canPoison = room.providesPoison && MV.helpers.skill(player, "poison") >= 3;
    const canStrike = player.carrying !== null || canPoison;
    const method = canPoison ? "poison" : "violence";
    const weapon = canPoison ? null : player.carrying;
    const opts = [];

    if (subject) {
      const rel = REL(game, player, subject, known);
      const isMark = subject.name === player.target;
      const witnesses = game.inRoom(player.room, player.name).filter((c) => c !== subject);

      if (isMark && witnesses.length === 0) {
        // Alone with your mark: the reckoning you came for. It always lands —
        // the whole night bends toward this one death, and it is yours to give.
        const meth = canPoison ? "poison" : "violence";
        const wpn = canPoison ? null : (player.carrying || "bare hands");
        opts.push({
          key: "strike", kind: "strike", subject: subject.name, method: meth, weapon: wpn,
          guaranteed: true, willSucceed: true, witnessed: false,
          label: `Finish it with ${last(subject.name)}`, line: n.strike(subject),
          note: "No one is watching, and this is the reason you came. It will be done.",
        });
        opts.push({ key: "lull", kind: "lull", subject: subject.name, label: `Draw ${last(subject.name)} closer still`, line: n.lull(subject), note: "Savour it a moment longer; they will keep." });
        opts.push({ key: "withdraw", kind: "withdraw", label: "Stay your hand — not yet", line: n.withdraw(), note: "Withdraw; the reckoning waits for a night of your choosing." });
      } else {
        const margin = canStrike ? game.attackMargin(player, subject, method, weapon) : null;
        if (canStrike) {
          opts.push({
            key: "strike", kind: "strike", subject: subject.name, method, weapon,
            label: isMark ? `Make your move on ${last(subject.name)}` : `Kill ${last(subject.name)} while you can`,
            line: n.strike(subject), note: outcomeNote(margin, witnesses.length),
            willSucceed: margin >= 1, witnessed: witnesses.length > 0,
          });
        }
        if (isMark) opts.push({ key: "lull", kind: "lull", subject: subject.name, label: `Draw ${last(subject.name)} in`, line: n.lull(subject), note: "They lower their guard — the next blow against them cannot miss." });
        else if (rel === "hunter") opts.push({ key: "deflect", kind: "deflect", subject: subject.name, label: `Turn ${last(subject.name)}'s suspicion aside`, line: n.deflect(subject), note: "Buys you room to breathe; they let you be, for now." });
        else opts.push({ key: "converse", kind: "converse", subject: subject.name, label: `Draw ${last(subject.name)} out`, line: n.converse(subject), note: "You may learn something worth knowing — perhaps who means you harm." });
        if (!canStrike && room.weapon) opts.push({ key: "arm", kind: "arm", label: `Take up the ${room.weapon}`, line: `First, the ${room.weapon}. One is never sorry to be armed.`, note: "Arm yourself for what's coming." });
        else opts.push({ key: "withdraw", kind: "withdraw", label: "Withdraw", line: n.withdraw(), note: "Slip away; live to choose a better moment." });
      }
    } else {
      if (player.carrying === null && room.weapon) {
        opts.push({ key: "arm", kind: "arm", label: `Take up the ${room.weapon}`, line: `The ${room.weapon}. Yes. One is never sorry to be armed in a house like this.`, note: "Arm yourself." });
      } else {
        opts.push({ key: "search", kind: "wait", label: "Search the room", line: n.solo(), note: "Nothing here but you and your thoughts." });
      }
      opts.push({ key: "wait", kind: "wait", label: "Lie in wait", line: "I hold still, and I let the house come to me.", note: "Hold position." });
      opts.push({ key: "withdraw", kind: "withdraw", label: "Move on", line: n.withdraw(), note: "Go elsewhere." });
    }
    while (opts.length < 3) opts.push({ key: "wait" + opts.length, kind: "wait", label: "Wait and watch", line: "I bide my time.", note: "Hold position." });
    return opts.slice(0, 3);
  }

  function outcomeNote(margin, witnesses) {
    if (margin === null) return "";
    const odds = MV.Game.marginLabel(margin);
    const seen = witnesses ? ` But ${witnesses} pair of eyes ${witnesses > 1 ? "are" : "is"} watching — you would surely be seen.` : " No one is watching.";
    return `The odds: ${odds}.${seen}`;
  }

  // ---- dispatches on the dead ------------------------------------------
  const POISON_SCENES = [
    (d) => `${last(d.victim)} was found in ${the(d.room)}, a glass fallen from one hand and the face gone strangely peaceful. Poison, someone whispered — poison and a patient, pouring hand.`,
    (d) => `They came upon ${last(d.victim)} slumped in ${the(d.room)}, no mark on them, no struggle — only a faint almond bitterness in the air and a cup rolled under the chair.`,
    (d) => `${last(d.victim)} never rose from their seat in ${the(d.room)}. Whatever was in the glass worked slowly and kindly, which somehow made it worse.`,
  ];
  const VIOLENCE_SCENES = [
    (d) => `They found ${last(d.victim)} in ${the(d.room)}, and it had not been gentle. No one who saw it will sleep easily.${d.weapon === "bare hands" || d.weapon === "a doctored glass" ? "" : ` The ${d.weapon} lay where it was dropped.`}`,
    (d) => `${last(d.victim)} was discovered in ${the(d.room)} in a spreading dark, the storm loud enough to have swallowed any cry.${d.weapon === "bare hands" || d.weapon === "a doctored glass" ? "" : ` The ${d.weapon} had done its work.`}`,
    (d) => `Whoever reached ${last(d.victim)} first in ${the(d.room)} was in no mood for mercy.${d.weapon === "bare hands" || d.weapon === "a doctored glass" ? "" : ` The ${d.weapon} told the rest of the tale.`}`,
  ];

  // A dispatch the whole house would know: a body found, a rumour, a false
  // trail — but not, unless witnessed, the hand behind it.
  function deathDispatch(death, opts) {
    opts = opts || {};
    const pool = death.method === "poison" ? POISON_SCENES : VIOLENCE_SCENES;
    const scene = pool[death.day % pool.length](death);
    const parts = [scene];
    if (opts.known) {
      parts.push(`You know what the others do not: it was ${death.culprit === opts.viewer ? "your own doing" : last(death.culprit)}${death.witnessed ? ", and done where eyes could see" : ", and done clean"}.`);
    } else {
      parts.push(`The house mutters and points: they have settled on ${death.redHerring}. They are wrong, of course. They usually are.`);
    }
    return parts.join(" ");
  }

  // The full truth, for the reckoning at the end.
  function deathTruth(death) {
    return `Day ${death.day}: ${death.victim} — ${death.method === "poison" ? "poisoned" : "killed"} in ${the(death.room)}. ` +
      `The house blamed ${death.redHerring}. The truth: ${death.culprit} did it${death.witnessed ? ", in front of witnesses" : ", and no one saw"}.`;
  }

  // A little life in the walls: two other guests, sharing a room, seen at odds.
  function vignette(game, player) {
    const rooms = {};
    for (const c of game.living()) {
      if (c.name === player.name) continue;
      (rooms[c.room] = rooms[c.room] || []).push(c);
    }
    for (const name of game.initiative) {
      const room = Object.keys(rooms).find((r) => rooms[r].some((c) => c.name === name) && rooms[r].length >= 2);
      if (room) {
        const pair = rooms[room].slice(0, 2);
        return pairBeat(pair[0], pair[1], room);
      }
    }
    return null;
  }

  function pairBeat(a, b, room) {
    const av = last(a.name), bv = last(b.name);
    const hostile = a.target === b.name || b.target === a.name;
    if (hostile) return `Word reaches you that ${av} and ${bv} were in ${the(room)} together, circling like duellists who have not yet chosen the hour.`;
    return `Somewhere in the house, ${av} and ${bv} keep an uneasy company in ${the(room)}, each certain the other is the one to watch.`;
  }

  // Varied "I lay low" beats so a careful run never reads the same line twice.
  const LIELOW = [
    "I spend the day being seen in the wrong places and doing precisely nothing — which, in a house like this, is the safest work there is.",
    "I keep to the edges of rooms and the edges of conversations, and let the others wear themselves down against each other.",
    "A quiet day, and quite deliberately so. Let the bolder fools thin their own number.",
  ];
  function lieLow(player, day) {
    const n = NARR[player.name];
    const beats = [n.withdraw(), n.solo(), LIELOW[day % LIELOW.length]];
    return beats[day % beats.length];
  }

  // ---- endings ----------------------------------------------------------
  function outcome(result, playerName) {
    const me = result.cast.find((c) => c.name === playerName);
    const markDeadByMe = result.deaths.some((d) => d.culprit === playerName && d.victim === me.target);
    const markDead = result.deaths.some((d) => d.victim === me.target);
    const aliveFree = me.alive && !me.caught;
    const sole = aliveFree && result.survivors.length === 1;
    if (sole && markDeadByMe)
      return { tier: "triumph", title: "Triumph", text: `You are the last soul breathing in Ravenhollow, and your mark fell by your hand and no other. The vendetta that brought you here is finished, the storm is spent, and at dawn you walk out the only one who does. The house keeps everyone's secrets now — including yours.` };
    if (aliveFree)
      return { tier: "bittersweet", title: "A Hollow Dawn", text: `You walk out of Ravenhollow alive when the storm breaks — but not as the last, and ${markDeadByMe ? "though your mark fell by your hand, others still draw breath who should not" : markDead ? "your quarry was taken by another's hand before you could" : "your quarry slipped the noose you meant for them and walks free"}. The one thing you came to finish, you did not. It follows you out into the rain.` };
    if (me.caught)
      return { tier: "defeat", title: "Unmasked", text: `The household turned on you before the night was through. Whatever you accomplished, you finish it behind a bolted door while the storm — and someone else — has the last word.${markDeadByMe ? " You did get your mark first, at least." : ""}` };
    return { tier: "defeat", title: "Among the Dead", text: `Your story ends the way most stories in this house end: badly, and in a room you should never have entered.${markDeadByMe ? " You did get your mark first, for whatever that is worth where you have gone now." : ""}` };
  }

  // ---- small utils ------------------------------------------------------
  function orList(a) { return a.length <= 1 ? (a[0] || "") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]; }
  function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

  MV.content = { NARR, HOOKS, initialKnownHunters, dayIntents, sceneProse, sceneOptions, deathDispatch, deathTruth, vignette, outcome, lieLow, rel: REL };
})(typeof globalThis !== "undefined" ? globalThis : this);
