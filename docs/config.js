/* Mysteryverse — worlds as data.
 *
 * A "world" is a locale plus a cast. Define one with plain data and the engine,
 * the Chronicler, the portraits, and the narration all build themselves from
 * it. Anything you leave out (a guest's voice, a portrait palette, a room's
 * colours) is generated from their traits, so a minimal world still plays,
 * reads, and looks like a whole game. Ravenhollow is the built-in default and
 * also the worked example of the schema.
 *
 *   MV.defineWorld({ id, locale, cast })   // register a world
 *   MV.useWorld("your-id")                  // make it the active one
 *
 * SCHEMA
 *   locale: {
 *     name: string,                 // the place, named by the Chronicler
 *     start: string,                // room everyone begins in
 *     weapons: { [name]: power },   // power 1..4, feeds the odds
 *     rooms: [ { name, description, exits:[string],
 *                weapon?:string, providesPoison?:bool, lure?:string,
 *                art?:{wall,floor,accent,motif} } ],
 *     passages?: { [roomA]: roomB },// one-step secret links (host only)
 *     chronicler?: {…}              // optional prose pools (see story.js)
 *   }
 *   cast: [ {
 *     name, title, skills:{stealth,combat,poison,deduction,persuasion,guile,composure},
 *     vices:[string], motive, target, secret,
 *     hook?: string,                // spoiler-free teaser for the guest list
 *     knowsHunters?: bool,          // starts knowing who hunts them
 *     art?, voice?, narrative?      // optional; generated from traits if absent
 *   } ]
 */
(function (root) {
  "use strict";
  const MV = (root.MV = root.MV || {});
  MV.WORLDS = MV.WORLDS || {};

  MV.defineWorld = function (world) {
    if (!world || !world.id) throw new Error("world needs an id");
    MV.WORLDS[world.id] = world;
    if (!MV.world) MV.useWorld(world.id);
    return world;
  };
  MV.useWorld = function (id) {
    const w = MV.WORLDS[id];
    if (!w) throw new Error("no such world: " + id);
    MV.world = w;
    return w;
  };

  // ---- the built-in world: Ravenhollow Manor ---------------------------
  MV.defineWorld({
    id: "ravenhollow",
    locale: {
      name: "Ravenhollow Manor",
      start: "Foyer",
      weapons: {
        "Revolver": 4, "Ceremonial Dagger": 3, "Carving Knife": 3,
        "Candlestick": 2, "Garden Shears": 2, "Length of Rope": 2,
        "Silk Cord": 2, "Letter Opener": 1,
      },
      passages: {
        "Study": "Master Bedroom", "Master Bedroom": "Study",
        "Library": "Gallery", "Gallery": "Library",
      },
      rooms: [
        { name: "Foyer", exits: ["Grand Hall", "Library"], description: "Black-and-white marble stretches away to a staircase that climbs into shadow. A grandfather clock stands dead against the wall, its hands stopped at some forgotten hour, and the guests' coats still drip by the door where the storm followed them in." },
        { name: "Grand Hall", exits: ["Foyer", "Dining Room", "Ballroom", "Landing"], description: "A vaulting hall hung with antlers and the portraits of Blackwoods long dead, their painted eyes following the living from every wall. The great staircase sweeps up into a darkness the lamps never quite reach, and the rain is a constant hush against the high windows." },
        { name: "Library", exits: ["Foyer", "Study", "Conservatory"], weapon: "Letter Opener", lure: "a shelf of first editions worth a small fortune", description: "Floor-to-ceiling cases of cracked leather and gold leaf, ladders on brass rails, the air thick with vellum and cold pipe-smoke. A single reading-lamp throws long shadows between the stacks, and at the black windows the rain seems to read along over your shoulder." },
        { name: "Study", exits: ["Library", "Landing"], weapon: "Revolver", providesPoison: true, lure: "an unlocked drawer of bearer bonds", description: "The host's private study: a broad leather-topped desk, a hearth gone cold, a cut-glass decanter of something amber catching what little light there is. Not all the drawers lock, and the room holds the breath-held stillness of a place accustomed to keeping secrets." },
        { name: "Conservatory", exits: ["Library", "Garden"], weapon: "Garden Shears", providesPoison: true, description: "Glass on every side, streaming and blind with rain, and beyond it nothing but the drowned dark of the garden. Overgrown ferns crowd the tiled paths like listeners leaning in, and the whole room breathes wet earth and green decay." },
        { name: "Dining Room", exits: ["Grand Hall", "Kitchen", "Ballroom"], weapon: "Candlestick", providesPoison: true, lure: "a decanter of very good port", description: "A long table set for a dinner that thins by the day — twelve chairs, seven places, the candles guttering in a draught no one can find. Silver gleams, the port decanter sweats, and overhead the chandelier ticks faintly as the old house settles around it." },
        { name: "Kitchen", exits: ["Dining Room", "Cellar"], weapon: "Carving Knife", providesPoison: true, description: "Copper pans hang in gleaming ranks above a range still warm from a supper nobody finished. Cleavers and carving knives wait in their block, catching the light, and a low door in the corner breathes cold up from the cellar below." },
        { name: "Cellar", exits: ["Kitchen"], weapon: "Length of Rope", lure: "a rack of pre-war vintages", description: "Stone and cobweb and racks of pre-war bottles furred grey with dust, all of it lit by one bare bulb that flickers whenever the storm leans on the house. Sound comes strangely down here — close at your ear one moment, swallowed whole the next." },
        { name: "Ballroom", exits: ["Grand Hall", "Dining Room", "Gallery"], lure: "your own reflection, doubled and doubled again in the mirrors", description: "A parquet floor wide as a courtyard, a chandelier shrouded in dust-sheets, and a long wall of speckled mirrors that doubles every shadow that crosses it. No music has sounded here in years, and the silence has a weight you can feel in your chest." },
        { name: "Gallery", exits: ["Ballroom", "Landing"], weapon: "Ceremonial Dagger", lure: "a display case of Blackwood jewels", description: "Ancestral portraits in heavy gilt frames march the length of the room, and among them hangs one frame gone empty, its canvas cut clean out. A display case of Blackwood jewels glitters coldly under the lamps, and the old parquet remembers every footstep laid on it." },
        { name: "Landing", exits: ["Grand Hall", "Study", "Gallery", "Master Bedroom"], description: "A long gallery of shut doors above the hall, the storm loud against a tall arched window at its end. From here one can see who comes and goes below in the lamplight — and be seen in turn, by anyone careless enough to be caught in it." },
        { name: "Master Bedroom", exits: ["Landing"], weapon: "Silk Cord", lure: "a jewellery box left open on the dresser", description: "The host's own room, dominated by a great curtained four-poster and a wardrobe that locks with an iron key. A window gives onto the drowned garden, and a jewellery box sits open and careless upon the dresser, as though set there to test the guests." },
        { name: "Garden", exits: ["Conservatory"], lure: "the gate to a freedom the storm has cancelled", description: "Sodden lawns dissolve into rain and dark, a broken sundial keeping no hour at all. Where the bridge once crossed the swollen race there is now only black water, loud in the night, and the memory of a way out that the storm has cancelled." },
      ],
    },
    cast: [
      { name: "Dr. Adrian Vell", title: "the Physician", hook: "A physician with a steady hand and a secret worth killing to keep.", target: "Cornelius Blackwood",
        skills: { stealth: 3, combat: 2, poison: 5, deduction: 4, persuasion: 3, guile: 2, composure: 4 }, vices: ["pride", "morphine"],
        motive: "A patient he let die had been bleeding him dry. The blackmail dies when the blackmailer does.",
        secret: "The 'lost patient' was no accident — it was practice." },
      { name: "Miss Isolde Frayne", title: "the Ingenue", hook: "A demure débutante whose smile never quite reaches her eyes.", target: "Lady Bianca Ashford",
        skills: { stealth: 4, combat: 2, poison: 3, deduction: 3, persuasion: 5, guile: 4, composure: 3 }, vices: ["envy", "vanity"],
        motive: "Her sister was ruined and discarded by Lady Ashford. A debt of shame paid in kind.",
        secret: "The demure accent is invented; she grew up a pickpocket." },
      { name: "Colonel Roderick Mace", title: "the Soldier", hook: "A decorated colonel who does not care to discuss the ridge.", target: "Silas Crane",
        skills: { stealth: 2, combat: 5, poison: 1, deduction: 3, persuasion: 2, guile: 2, composure: 4 }, vices: ["wrath", "drink"],
        motive: "A witness to what he ordered on the ridge is in this house. Witnesses can be retired.",
        secret: "Crane isn't the only witness — but he's the one still talking." },
      { name: "Silas Crane", title: "the Confidence Man", hook: "A silver-tongued confidence man who owes the wrong person.", target: "Colonel Roderick Mace",
        skills: { stealth: 3, combat: 2, poison: 2, deduction: 3, persuasion: 4, guile: 5, composure: 2 }, vices: ["greed", "cowardice"],
        motive: "He owes the Colonel a debt no ledger can settle. Better the creditor never leaves the manor.",
        secret: "He already sold everyone's secrets to the host — once." },
      { name: "Lady Bianca Ashford", title: "the Heiress", hook: "An heiress for whom an inheritance is worth any inconvenience.", target: "Dr. Adrian Vell",
        skills: { stealth: 2, combat: 2, poison: 3, deduction: 4, persuasion: 5, guile: 3, composure: 4 }, vices: ["arrogance", "gluttony"],
        motive: "Only Dr. Vell stands between her and the whole Ashford estate. Physicians, after all, sign the certificates.",
        secret: "She has poisoned before, and signed nothing." },
      { name: "Cornelius Blackwood", title: "the Host", hook: "The host — who has invited every one of his enemies under a single roof.", target: "Miss Isolde Frayne", knowsHunters: true, knowsPassages: true,
        skills: { stealth: 4, combat: 3, poison: 3, deduction: 5, persuasion: 4, guile: 4, composure: 5 }, vices: ["paranoia", "lust"],
        motive: "He gathered every person who ever wronged him under one roof. He does not intend for all of them to leave.",
        secret: "He knows the manor's hidden passages — and used them to read every guest's mail before they arrived." },
      { name: "Mother Genevieve", title: "the Occultist", hook: "A nun whose visions all seem to concern other people's sins.", target: "Colonel Roderick Mace",
        skills: { stealth: 3, combat: 2, poison: 4, deduction: 4, persuasion: 3, guile: 3, composure: 5 }, vices: ["fanaticism", "secrecy"],
        motive: "She has read the Colonel's soul and found it past saving. Some mercies can only be delivered with hemlock.",
        secret: "Her 'visions' are cover — she has followed Mace for years." },
    ],
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
