/* A third case: murder aboard a storm-caught yacht.
 *
 * Data only — portraits, voices, and Chronicler prose are generated from traits.
 */
(function (root) {
  "use strict";
  const MV = (root.MV = root.MV || {});
  MV.defineWorld({
    id: "halcyon",
    tagline: "A gilded motor-yacht, a storm off the cape, and a killer in her crew who knows every plate of her.",
    mode: "whodunit",
    cover: "yacht",
    coverImage: "img/halcyon.jpg",   // drop your painting here; the SVG yacht is the fallback
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
    },
    cast: [
      { name: "Mr. Ambrose Vane", title: "the Owner", hook: "The shipping magnate whose yacht this is, and whose past this voyage seems to be.",
        skills: { persuasion: 5, deduction: 4, composure: 4, combat: 2, guile: 4, poison: 2, stealth: 2 }, vices: ["arrogance", "wrath"],
        secret: "The Halcyon is not the first vessel of his to leave people in the water." },
      { name: "Mrs. Cynthia Vane", title: "the Owner's Wife", hook: "A hostess with a bright smile and a temper the whole ship has heard.",
        skills: { persuasion: 4, deduction: 3, composure: 3, guile: 3, poison: 3, combat: 2, stealth: 2 }, vices: ["envy", "vanity"],
        secret: "She knows exactly what her husband did, and has spent years being paid to forget it." },
      { name: "Mr. Otto Reinhardt", title: "the Financier", hook: "A moneyman who owes, or is owed by, nearly everyone aboard.",
        skills: { guile: 5, deduction: 4, persuasion: 3, composure: 3, combat: 2, poison: 2, stealth: 3 }, vices: ["greed", "cowardice"],
        secret: "He has already quietly insured himself against the deaths of two people on this ship." },
      { name: "Miss Dulcie Rae", title: "the Starlet", hook: "A film actress whose career could not survive what one of the guests threatened to print.",
        skills: { persuasion: 5, guile: 4, composure: 2, deduction: 3, stealth: 3, combat: 2, poison: 2 }, vices: ["vanity", "envy"],
        secret: "The scandal she is hiding is a good deal worse than the one everyone suspects." },
      { name: "Dr. Emeric Sload", title: "the Ship's Doctor", hook: "A physician with a black bag of things that stop a heart and leave no mark.",
        skills: { poison: 5, deduction: 4, composure: 4, stealth: 3, persuasion: 3, guile: 2, combat: 2 }, vices: ["morphine", "secrecy"],
        secret: "He lost his licence ashore, and this berth was the only one that would have him." },
      { name: "Mr. Silva", title: "the First Mate", hook: "The ship's officer who knows every plate and passage of her by heart.", knowsPassages: true,
        skills: { stealth: 5, combat: 4, composure: 5, deduction: 4, guile: 3, persuasion: 2, poison: 2 }, vices: ["secrecy", "wrath"],
        secret: "He signed aboard under a drowned man's name, and has been counting these passengers for years." },
    ],
    journalist: { name: "Miss Nella Frost", title: "the Correspondent", hook: "A magazine writer aboard to profile the great man's yacht, filing a rather different story now." },
    mystery: {
      killer: "Mr. Silva",
      deadline: 6,
      hotRooms: ["The Hold", "Wheelhouse", "Engine Room"],
      motiveRoom: "The Hold",
      truth: "Years ago, in fog, the Halcyon's owner ran his yacht through a fishing smack and steamed on rather than answer for it, leaving her crew to the sea. One of the drowned was First Mate Silva's brother. Silva signed aboard this voyage under a dead man's papers, drowned the radio, and set about settling every account — moving through the crew companionways no passenger even knows are there, and meaning to be the only hand left to bring the Halcyon home.",
      pillars: {
        means: "You examine the cabin where the body was found — bolted from the inside, the passage outside in plain view, and yet someone reached them. Only the crew companionways behind the panelling make that possible, and only a ship's officer carries the keys to them.",
        motive: "Down in the hold, behind the spare canvas, you find a kind of shrine: a yellowed clipping of a fishing smack run down in the fog — the Halcyon named as the ship that did not stop — and beneath it a crew list, one drowned name ringed in ink. The mate shipped aboard under that dead man's papers.",
        opportunity: "Set the accounts side by side and the gap is plain: every passenger can vouch for every other at each death — but the mate is forever 'on watch,' forever moving the ship, forever exactly where no passenger thinks to look for him.",
      },
      herrings: {
        "Mr. Ambrose Vane": { clue: "Vane made his fortune the way sharks make theirs, and more than one of the dead had something on him worth killing to bury.", alibi: "But the man cannot find his own galley without a steward, let alone the crew companionways, and was at his brandy in full company each night a body was found." },
        "Mrs. Cynthia Vane": { clue: "Mrs. Vane watched her husband's eye follow the starlet, and has a jealous temper the whole ship has heard through the bulkheads.", alibi: "Yet she is terrified of the water below decks and never once went near it; two of the maids can place her in her stateroom throughout." },
        "Mr. Otto Reinhardt": { clue: "Reinhardt owes money to half the passenger list, and would sleep easier — and richer — with one or two of them over the side.", alibi: "But the man is seasick to the point of collapse, and was strapped groaning into his bunk on each of the nights that matter." },
        "Miss Dulcie Rae": { clue: "One of the dead had threatened to print what would end Miss Rae's career, and she is not a forgiving girl.", alibi: "Yet Dulcie faints at the sight of blood and was the loud, public toast of the saloon each evening a guest was killed." },
        "Dr. Emeric Sload": { clue: "The doctor keeps a case of drugs that could still a heart and leave no mark, and a bedside manner that raises the hairs on your neck.", alibi: "But Sload was tending the seasick and the drunk in plain view each night, and has not, you judge, the nerve to use a knife." },
      },
    },
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
