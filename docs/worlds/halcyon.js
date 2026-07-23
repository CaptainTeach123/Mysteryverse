/* The Halcyon — murder aboard a storm-caught motor-yacht.
 *
 * Data only — but this world carries its own voice throughout: every line of
 * prose is Nella Frost's, first person, filed like copy. One old collision at
 * sea connects the whole passenger list; the clues close in on the killer by
 * degrees (a key, a shrine, a log entry) instead of naming him outright.
 */
(function (root) {
  "use strict";
  const MV = (root.MV = root.MV || {});
  MV.defineWorld({
    id: "halcyon",
    tagline: "A gilded motor-yacht, a storm off the cape, and six guests who all lied about why they came.",
    mode: "whodunit",
    cover: "yacht",
    coverImage: "img/halcyon.png",   // the yacht painting; the SVG yacht is the fallback
    displayFont: "Poiret One",       // a geometric, atomic-age face for a mid-century-modern feel
    placeNoun: "ship",
    chroniclerByline: "From the notebook of Nella Frost",
    blurb: "By morning the Halcyon's radio is dead, the coast has vanished behind a storm, and every person aboard has lied about why they came. You are Nella Frost, magazine correspondent, sent to cover a glittering reunion at sea. Before the next dawn, one of your subjects will be dead — and you will have six days to name the killer, with proof enough to survive the naming.",
    dayOneNews: "No one has died yet. The radio has, and the coast is gone, and the bar is pouring with an insistence I have learned to distrust. Whatever this reunion is for, it has not started — and everyone aboard is waiting for it to.",
    assignment: {
      dear: "Dear Miss Frost,",
      body: [
        "Ambrose Vane is taking the Halcyon out for a private cruise. He has invited five people who have not willingly shared a room in years. Vane calls it a reunion. I call it a story.",
        "Take the berth. Find out what connects them. File before you reach shore.",
      ],
      sig: "— The Assignment Desk",
      arrival: "By midnight the radio is dead. By morning the storm has erased the coast. Six names wait in your notebook, and every one of them has already lied to you.",
      purpose: "You are Nella Frost, the Correspondent. One of these six is going to start killing the others, one a night, and means to leave no one at the rail when the Halcyon comes home. You have until the storm lifts to prove which of them it is — means, motive, and opportunity, all three — and live to file it.",
    },
    locale: {
      name: "the Halcyon",
      start: "Main Saloon",
      weapons: { "Flare Pistol": 4, "Fire Axe": 4, "Gaff Hook": 3, "Filleting Knife": 3, "Mooring Line": 2 },
      passages: { "Wheelhouse": "The Hold", "The Hold": "Wheelhouse", "Galley": "Cabin Passage", "Cabin Passage": "Galley" },
      rooms: [
        { name: "Aft Deck", exits: ["Main Saloon"], lure: "the dark water sliding past the varnished rail", description: "The teak afterdeck, all varnish and polished brass, where the cruise took its cocktails an hour ago as the ochre cliffs and their black cypresses slid astern. That golden coast is gone now, and the gilded sky with it, into a swell that is rising and a grey that is not. The deck lights swing on their wires with the roll of the ship." },
        { name: "Main Saloon", exits: ["Aft Deck", "Galley", "Cabin Passage", "Wheelhouse"], weapon: "Mooring Line", providesPoison: true, lure: "a mirrored bar, still fully stocked", description: "The Halcyon's grand saloon — cream leather, blond wood, tall gleaming windows that framed a postcard sunset an hour ago and frame only spray now. The mirrored bar has not stopped pouring, and everything not screwed down slides an inch and slides back with each long roll of the classic white hull." },
        { name: "Galley", exits: ["Main Saloon", "Engine Room"], weapon: "Filleting Knife", providesPoison: true, description: "A tight stainless galley below the bridge, knives magnetted to the bulkhead and a kettle sliding in its gimbals. Always warm, and never wide enough for two to pass without touching — and a low crew door in the corner leads into the ship's white-painted innards, where the guests are not meant to go." },
        { name: "Cabin Passage", exits: ["Main Saloon", "Owner's Stateroom"], description: "A close carpeted corridor of numbered staterooms, brass fittings sweating in the salt damp, the whole passage leaning and righting as the yacht begins to labour. The doors lock; the panelling is a good deal thinner than its varnish pretends." },
        { name: "Owner's Stateroom", exits: ["Cabin Passage"], lure: "a wall safe left, carelessly, ajar", description: "The owner's stateroom, the finest cabin aboard — a wide berth, a private bar, a wall safe left a hand's breadth ajar. Photographs of the great man shaking important hands crowd the panelling, and every one of them looks, in this light, faintly like a threat." },
        { name: "Wheelhouse", exits: ["Main Saloon"], weapon: "Flare Pistol", lure: "the dead radio and the charts", description: "The bridge, high and white above the decks under its raked mast and radar: green instrument glow, a wheel lashed on autopilot, and the radio dead two days with its guts, someone says, mysteriously wet. Through the streaming forward glass there is nothing now but weather, and more weather." },
        { name: "Engine Room", exits: ["Galley", "The Hold"], weapon: "Fire Axe", description: "A hammering steel cavern that smells of hot oil and diesel, catwalks running over machinery that never stops turning. Too loud in here to hear a man come up behind you; too loud for anyone on the bright decks above to hear you if you called." },
        { name: "The Hold", exits: ["Engine Room"], weapon: "Gaff Hook", lure: "crates and canvas and the ship's forgotten things", description: "Below the waterline, cold and echoing, stacked with lashed crates and spare canvas, the great classic hull a hand's breadth of steel from the open sea. Water works somewhere in the dark, and the ship groans as she takes the swell, like something alive and unhappy about it." },
      ],
      chronicler: {
        morningOpen: [
          "The {nth} morning came up the colour of gunmetal, and the Halcyon rolled to meet it.",
          "By eight on the {nth} morning the Halcyon had lost the coast, the radio, and any pretence that this was still a pleasure cruise.",
          "I woke on the {nth} day to the sea working at the hull, patient as a creditor.",
          "The {nth} dawn arrived without conviction, somewhere behind weather that had no edges.",
        ],
        storm: {
          early: [
            "Spray reached the boat deck now and then, idly, the way a cat tries a door.",
            "Rain silvered the saloon windows. China crept across the table with each roll of the hull and came back with a small, polite clink.",
            "The swell was long and oily, and the barometer kept its own counsel.",
          ],
          mid: [
            "The storm had found its full voice now, and the Halcyon groaned along her whole length, like a ship rethinking her builders.",
            "Green water came aboard forward and went hissing out the scuppers; below decks, everything not bolted down had begun a slow migration.",
            "The wind had teeth by now. It worried at the stays and shrieked in the rigging, and none of us mentioned it at table.",
          ],
          late: [
            "The storm was tiring at last, grey and spent — though the sea it left behind still ran heavy, remembering.",
            "A thin light found its way through the cloud, and the Halcyon steadied under it, as if listening for something.",
            "The rain had gentled to a whisper on the deckhead, as though even the weather had grown wary of this ship.",
          ],
        },
        house: [
          "The Halcyon held her course; no one aboard could have told you for where.",
          "Somewhere below, a door that should have been locked was heard to close. No one went to see.",
          "The bar had not stopped pouring; it had only stopped pretending it was celebration.",
          "The crew went through their white passages on crepe soles, and the guests pretended not to count them.",
          "The photographs in the saloon watched us dine with the patience of the drowned.",
        ],
        foreshadow: [
          "By nightfall the Halcyon would be one soul the lighter. I did not know it yet. The sea, I think, did.",
          "The day stretched ahead, sealed tight as a hull, and full of doors that would not stay shut.",
          "Whatever happened next would happen aboard, where there is nowhere to run but the rail.",
          "They toasted one another at luncheon, and every one of them counted the lifeboats.",
          "The sea had all the time in the world. The company, one by one, was running out of theirs.",
        ],
        firstMorning: "Six names waited in my notebook, and every one of them had lied to me before the coffee was poured. No one was dead yet. That was the last ordinary thing about the day.",
        afterDeath: "At breakfast there were {alive} of us where the evening before there had been {before}. No one looked at the empty chair. No one could quite look away from it, either.",
        noDeath: "{alive} of us still came to table, and sat a little further apart than the day before.",
        dusk: "Night came down over the water, black and total. {alive} of us still breathed aboard the Halcyon — and not one believed the sea was finished.",
        duskLast: "And then there was one. The storm broke over an empty deck, and the Halcyon steamed on, keeping her counsel, as ships do.",
      },
    },
    cast: [
      { name: "Mr. Ambrose Vane", title: "the Owner", hook: "The shipping magnate whose yacht this is, and whose past this voyage seems to be.",
        portrait: "img/portraits/ambrose-vane.png",
        skills: { persuasion: 5, deduction: 4, composure: 4, combat: 2, guile: 4, poison: 2, stealth: 2 }, vices: ["arrogance", "wrath"],
        secret: "The Halcyon is not the first vessel of his to leave people in the water." },
      { name: "Mrs. Cynthia Vane", title: "the Owner's Wife", hook: "A hostess with a bright smile, a jealous temper, and one sentence she has been rehearsing for fifteen years.",
        portrait: "img/portraits/cynthia-vane.png",
        skills: { persuasion: 4, deduction: 3, composure: 3, guile: 3, poison: 3, combat: 2, stealth: 2 }, vices: ["envy", "vanity"],
        secret: "She knows exactly what her husband did, and has spent years being paid to forget it." },
      { name: "Mr. Otto Reinhardt", title: "the Financier", hook: "A moneyman who owes, or is owed by, nearly everyone aboard.",
        portrait: "img/portraits/otto-reinhardt.png",
        skills: { guile: 5, deduction: 4, persuasion: 3, composure: 3, combat: 2, poison: 2, stealth: 3 }, vices: ["greed", "cowardice"],
        secret: "He has already quietly insured himself against the deaths of two people on this ship." },
      { name: "Miss Dulcie Rae", title: "the Starlet", hook: "A film actress with a newsreel smile, still playing a line somebody wrote for her long ago.",
        portrait: "img/portraits/dulcie-rae.png",
        skills: { persuasion: 5, guile: 4, composure: 2, deduction: 3, stealth: 3, combat: 2, poison: 2 }, vices: ["vanity", "envy"],
        secret: "The scandal she is hiding is a good deal worse than the one everyone suspects." },
      { name: "Dr. Emeric Sload", title: "the Ship's Doctor", hook: "A physician with a black bag of things that stop a heart and leave no mark.",
        portrait: "img/portraits/dr-emeric-sload.png",
        skills: { poison: 5, deduction: 4, composure: 4, stealth: 3, persuasion: 3, guile: 2, combat: 2 }, vices: ["morphine", "secrecy"],
        secret: "He lost his licence ashore, and this berth was the only one that would have him." },
      { name: "Mr. Silva", title: "the First Mate", hook: "A quiet officer who came with the ship from the yard — and keeps her secrets rather better than his own.", knowsPassages: true,
        portrait: "img/portraits/mr-silva.png",
        skills: { stealth: 5, combat: 4, composure: 5, deduction: 4, guile: 3, persuasion: 2, poison: 2 }, vices: ["secrecy", "wrath"],
        secret: "He signed aboard under a drowned man's name, and has been counting these passengers for years." },
    ],
    journalist: { name: "Miss Nella Frost", title: "the Correspondent", hook: "A magazine writer aboard to profile the great man's yacht, filing a rather different story now." },
    mystery: {
      killer: "Mr. Silva",
      deadline: 6,
      hotRooms: ["The Hold", "Wheelhouse", "Engine Room"],
      motiveRoom: "The Hold",
      // The killer stages each night where it reads true: Vane dies first, in
      // his own bolted stateroom — the scene the MEANS clue describes.
      deathRooms: ["Owner's Stateroom", "Cabin Passage", "Main Saloon", "Galley", "Aft Deck"],
      truth: "Fifteen years ago, in fog off this same cape, the Halcyon ran down the fishing boat Sant'Agnese and did not stop. Vane gave the order to steam on; Cynthia swore to an inquest he was ashore with her; Reinhardt settled the insurance quietly, with no exhibits; Dulcie told the newsreels she had seen the smack's lights burning safely; and Sload signed the certificates that closed the file. Six men drowned. One of them was the brother of the man who calls himself Silva — who shipped aboard under a drowned man's papers, drowned the radio in turn, and set about collecting the debt entire: every passenger a signatory to his brother's death, and the Halcyon to come home with no one left aboard who lied.",
      pillars: {
        means: "The first of them to die was found behind a stateroom door bolted from the inside, the portholes dogged down tight — and yet someone reached him. Behind the wardrobe I found the answer: a narrow panel opening onto the crew companionway, fresh brass filings bright beneath its lock. Three master keys open those panels — the owner's, the doctor's emergency key, and the first mate's. I have now seen two of them accounted for. The third is missing.",
        motive: "Behind the spare canvas in the hold, sealed in oilskin against the damp, I found a kind of shrine. A clipping: VANE YACHT FAILS TO STOP AFTER COLLISION — the Halcyon named as the ship that steamed on. Beneath it, the lost boat's crew list, one surname circled so hard the pen had torn the paper. And tucked behind that, a photograph of the Halcyon's present crew, with one face scratched carefully away.",
        opportunity: "I set the accounts side by side, night against night. The passengers can vouch for one another from eleven to midnight — every night, every death. The first mate can be vouched for by no one: 'on watch,' says the log, entered at 11:45 in blue ink, beneath a wheelhouse clock that stopped at 11:32. The only blue ink aboard is the pen the mate carries on his chain. The stain of it is still on his thumb.",
      },
      prose: {
        searchLabel: "Search the ship",
        searchBlurb: "Turn a compartment over for physical proof.",
        observeLabel: "Watch the company at dinner",
        observeBlurb: "Keep your notebook under the tablecloth, and your eyes up.",
        searchEmpty: "I turned {room} over while the storm turned the ship. Nothing I could print — only the growing certainty that somewhere in all this white steel, someone was keeping an account of my curiosity.",
        killerInterview: "I put my questions to Mr. Silva on the bridge, and he answered every one of them with the weather. Courteous, exact, and perfectly empty. It was only afterward, going down the ladder, that I understood the interview had been running the other way.",
        heatFar: "Twice that day I turned around on an empty companionway. There is a particular quality to a ship's quiet when someone aboard has begun to study you.",
        heatNear: "Coming up from below I found the mate waiting at the head of the companionway. He did not ask what I had been looking for. He looked at the oil on my cuff, wished me a pleasant evening, and smiled.",
        observe: "Dinner was a performance in a rolling theatre: six people toasting a reunion not one of them wanted. I kept my notebook under the tablecloth and watched who looked at whom when the ship's bell rang the watch.",
        endings: {
          win: { title: "The Story Breaks", text: "I laid the case out on the saloon table like a hand of cards: the missing key, the oilskin shrine, the log entry in blue. {killer} listened with the courtesy he had never once dropped, and when I finished he looked, for the first time, almost at rest. {truth} I filed from the first harbour with a working wire. It will run under my name for the rest of my life — and I lived to see it printed.",
          },
          unproven: { title: "Not Enough Ink", text: "I said his name without the proof to hold it, and watched it float away on the ship's own courtesy. {killer} thanked me for a fascinating theory. The company decided I was hysterical, the sea decided nothing at all, and when we made harbour there was a lawyer waiting on the quay. After that, quietly, patiently, so was he.",
          },
          wrong: { title: "The Wrong Name", text: "I named {accused}, and the appalled silence had teeth in it. Somewhere behind me, the real killer refilled a glass. I had spent the one accusation a correspondent gets, and every soul aboard knew it — and the sea keeps whatever the night hands it.",
          },
          heatDeath: { title: "Lost Overboard", text: "I had pried once too often below the waterline. They found my notebook in the morning, rain-fat and riffled, its last page torn out; they did not find me. The Halcyon made port with her account nearly settled, and one column left blank.",
          },
          empty: { title: "Two Souls Aboard", text: "By the time I could prove anything, there was no one left alive to arrest — and no one left to read it back to. The Halcyon made her harbour with two souls aboard, and only one of us was ever going to step off.",
          },
          lastDawn: { title: "The Coast Comes Back", text: "The storm lifted, the coast came back, and a pilot boat came out to meet us — and my notebook was full of suspicion and empty of proof. On the quay the company scattered into taxis and lawyers, and somewhere among them the killer went too, with my six days folded neatly in a pocket.",
          },
        },
      },
      herrings: {
        "Mr. Ambrose Vane": {
          clue: "Vane received me in the owner's stateroom like a press conference of one. 'A reunion,' he said — twice, in the tone men keep for alibis. Every photograph on that panelling has been recently rehung, and one hook stands empty. Whatever hung there, he took it down before he let a journalist aboard.",
          alibi: "But whatever Vane is burying, he was holding court at his own bar in full view of the company each night a berth went quiet — and the man cannot find his own galley without a steward. He could not navigate the crew companionways with a chart and a lamp.",
        },
        "Mrs. Cynthia Vane": {
          clue: "'My husband is a great man,' Mrs. Vane told me, before I had asked her anything at all. Her gloves stayed on through the whole interview, and her eyes went to the starlet twice. Fifteen years ago she gave an inquest one sentence about where her husband was one night in the fog — and she has been rehearsing it ever since.",
          alibi: "But Cynthia Vane will not go below the waterline — the maids swear she has never once taken the aft stair — and two of them can place her at her dressing table through every hour that matters. Her sins are of the signed and witnessed kind.",
        },
        "Mr. Otto Reinhardt": {
          clue: "Reinhardt talked to me the way he talks to auditors: charmingly, precisely, with one drawer always locked. A Mariners' Mutual claim on a lost fishing boat crossed his desk once — settled fast, sealed faster, no exhibits — and his initials are still on it. Two of the passengers on this cruise are worth more to him dead than alive, and he knows the figures by heart.",
          alibi: "But the man has been strapped green and shaking into his bunk since the first swell. The steward has carried him soup at every hour a body was found, and carried most of it away again. Whatever Reinhardt buried, he buried it with a pen.",
        },
        "Miss Dulcie Rae": {
          clue: "Miss Rae gave me her interview face, the one from the newsreels — and it was the newsreels I kept thinking of afterward. A young actress once told the cameras she had watched a fishing boat's lights burning safe and well the night everyone now knows it went down. Somebody wrote that line for her. She has been playing it for fifteen years, and she is word-perfect still.",
          alibi: "But Dulcie cannot pass the galley knives without going white, and she was the toast of the saloon — loudly, publicly, unbrokenly — through every one of the nights in question. Her talent is for saying what she is told; not for this.",
        },
        "Dr. Emeric Sload": {
          clue: "The doctor's cabin smells of iodine and morphine in unequal parts. He talks softly, watches the door, and keeps his papers locked — most of them. Among the ones I saw: a certificate from an old collision inquiry, signed in his hand, recording men as 'lost at sea, cause undetermined' who were pulled from the water with their lifebelts still on.",
          alibi: "But Sload sat up with the seasick and the frightened in the saloon each night, in view of a dozen witnesses — and his hands shake too badly now to hold a knife steady, whatever they once held steady enough to sign.",
        },
      },
    },
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
