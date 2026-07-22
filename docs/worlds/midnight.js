/* An example second world — proof that the framework is data-driven.
 *
 * This file provides ONLY data: a locale (train cars) and a cast (five
 * strangers, their traits and their targets). It supplies no portraits, no
 * diary voices, no bespoke scene lines — those are all generated from each
 * agent's traits at run time. Register it, then visit the page with
 * ?world=midnight (or call MV.useWorld("midnight")).
 *
 * Copy this file, change the data, and you have a new game.
 */
(function (root) {
  "use strict";
  const MV = (root.MV = root.MV || {});
  MV.defineWorld({
    id: "midnight",
    locale: {
      name: "the Midnight Express",
      start: "Dining Car",
      weapons: { "Fire Axe": 4, "Boning Knife": 3, "Silver Candlestick": 2, "Silk Cravat": 2, "Coal Shovel": 3 },
      passages: { "Galley": "Baggage Car", "Baggage Car": "Galley" }, // the service crawlway
      rooms: [
        { name: "Rear Platform", exits: ["Observation Car"], lure: "the couplings and the roaring dark beyond the rail", description: "A cramped iron platform at the very tail of the train, the night screaming past and the rails unspooling silver into the dark behind. The door back inside never quite latches, and the cold gets into your bones within a minute." },
        { name: "Observation Car", exits: ["Rear Platform", "Salon Car"], lure: "a wall of black glass and the storm rushing past it", description: "Deep armchairs face a curved wall of glass that in daylight frames the mountains and now frames only the night and your own reflection. Brandy waits on a sideboard, and the wheels beat their endless four-four rhythm beneath the carpet." },
        { name: "Salon Car", exits: ["Observation Car", "Dining Car"], weapon: "Silver Candlestick", lure: "a card table with the evening's pot still on it", description: "A panelled lounge of green leather and cigar-smoke, a piano no one is playing, and a card table abandoned mid-hand. The lamps sway gently with the motion of the train, throwing everyone's shadow up the marquetry walls." },
        { name: "Dining Car", exits: ["Salon Car", "Galley"], weapon: "Silver Candlestick", providesPoison: true, lure: "a bottle of very old cognac, uncorked", description: "White linen and rattling silver, a long row of tables set for a dinner the storm has made very quiet. Waiters have long since retired; the wine remains, and so do the knives, and so do the five of you, watching one another over the candles." },
        { name: "Galley", exits: ["Dining Car"], weapon: "Boning Knife", providesPoison: true, description: "A narrow steel corridor of a kitchen, still warm, knives racked by the range and a low hatch in the floor that drops to the running-boards. Everything here is sharp, hot, or both, and there is no room for two people to pass without touching." },
        { name: "Baggage Car", exits: ["Observation Car"], weapon: "Fire Axe", lure: "a stack of unclaimed trunks with good locks", description: "A dim vault of stacked trunks and mailbags lashed under netting, a fire axe in a glass case on the wall, and the couplings groaning at either end. Cold seeps up through the boards, and the dark between the crates is very complete." },
      ],
    },
    cast: [
      { name: "Countess Irina Volkova", title: "the Exile", target: "Mr. Aldous Finch",
        hook: "A deposed countess travelling under a name that is not quite hers.",
        skills: { stealth: 4, persuasion: 5, deduction: 3, composure: 4, combat: 2, poison: 3, guile: 3 }, vices: ["pride", "paranoia"],
        motive: "Finch signed the order that emptied her country and her family into the snow. She has crossed a continent to hand him the bill.",
        secret: "She has done this before, in another country, to another man." },
      { name: "Mr. Aldous Finch", title: "the Diplomat", target: "Miss Vera Lang", knowsHunters: true,
        hook: "A career diplomat with a great many old signatures to account for.",
        skills: { deduction: 5, persuasion: 5, composure: 4, guile: 4, combat: 2, poison: 2, stealth: 2 }, vices: ["arrogance", "lust"],
        motive: "The Lang woman means to print what he did at the border, and print ends careers and necks alike. The story dies with the storyteller.",
        secret: "He knows exactly who on this train has come for him — he made it his business to." },
      { name: "Miss Vera Lang", title: "the Journalist", target: "Salvatore Ricci",
        hook: "A reporter with a notebook full of names and no scruples about any of them.",
        skills: { guile: 5, deduction: 4, persuasion: 4, stealth: 3, composure: 3, combat: 2, poison: 2 }, vices: ["greed", "vanity"],
        motive: "Ricci had her source thrown from a bridge for the price of a headline he didn't like. She intends to file the last word.",
        secret: "She already sold half of what she knows to Finch, and means to sell the rest." },
      { name: "Salvatore Ricci", title: "the Financier", target: "Countess Irina Volkova",
        hook: "A financier whose fortune has a great deal of blood in its foundations.",
        skills: { combat: 5, guile: 4, composure: 3, persuasion: 3, deduction: 3, poison: 1, stealth: 2 }, vices: ["wrath", "greed"],
        motive: "The Countess owes him a debt that no bank will clear, and he has never in his life let a debt walk away on two good legs.",
        secret: "He is not, and has never been, a financier — the money was someone else's, once." },
      { name: "Conductor Bede", title: "the Conductor", target: "Mr. Aldous Finch", knowsPassages: true,
        hook: "The conductor, who knows every inch of this train and every soul on it.",
        skills: { combat: 4, composure: 5, stealth: 4, deduction: 4, guile: 3, persuasion: 2, poison: 2 }, vices: ["secrecy", "wrath"],
        motive: "Years ago, on this very line, a border official named Finch had his brother taken off the train and shot in the snow. The train has come round again.",
        secret: "He has been waiting on this exact run, this exact passenger, for eleven years." },
    ],
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
