# Mysteryverse — a night at Ravenhollow Manor

Seven guests are invited to a storm-bound estate. The bridge is gone, the
telephone line is dead, and each of them came with a private reason to see one
of the others in the ground. They move freely through the house and scheme as
they like — but **no one wants to be caught**, and the manor keeps one iron
rule:

> **At most one guest is murdered per day.**

Each day the guests manoeuvre — arming themselves, stalking, cornering a mark.
The first clean kill is the day's death; after it, the house is roused and no
one else can strike until tomorrow. Then **night falls**, and every surviving
guest privately writes down what they did and what they saw. Because a clean
murder has no witness but the murderer, most journals record only a body found
and no idea whose hand did it.

It is *Clue* turned inside out: you don't solve the murder, you *are* one of the
suspects, and the truth lives in seven contradictory diaries.

## The seven guests

Each has their own **skills** (what makes them dangerous), **vices** (what makes
them careless), a secret **motive**, and a **target**. The targets form a web,
not a line — at least one pair hunts each other.

| Guest | Role | Strong at | Vices | Wants dead |
|-------|------|-----------|-------|------------|
| Dr. Adrian Vell | the Physician | poison, deduction | pride, morphine | Blackwood |
| Miss Isolde Frayne | the Ingénue | persuasion, stealth | envy, vanity | Ashford |
| Colonel Roderick Mace | the Soldier | combat, composure | wrath, drink | Crane |
| Silas Crane | the Confidence Man | guile, persuasion | greed, cowardice | Mace |
| Lady Bianca Ashford | the Heiress | persuasion, deduction | arrogance, gluttony | Vell |
| Cornelius Blackwood | the Host | deduction, composure | paranoia, lust | Frayne |
| Mother Genevieve | the Occultist | composure, poison | fanaticism, secrecy | Mace |

Mace is hunted twice (by Crane and Genevieve), and Mace and Crane hunt each
other — that mutual pull is where the first blood usually falls. Only Blackwood,
the host, knows the manor's hidden passages.

## Play in the browser: the whodunit (zero-cost website)

The browser game in [`docs/`](docs/) is a **closed-circle murder mystery**. A
storm cuts the house off; one of the guests is a killer with a deep reason to
see everyone dead, and takes a life every night. **You are the journalist**,
sent to cover the gathering, and you have until the last dawn to prove who did
it — before the house empties, or the killer notices you.

- An envelope opens with your assignment; then you meet **the suspects**.
- Each day you make **one move** — **examine** a scene, **search** a room, or
  **interview** a guest — building a **case file** toward three pillars against
  the culprit: **means**, **motive**, and **opportunity**.
- When you have all three, you **name the killer**. Get it right, with the whole
  case behind you, and you break the story of your life.
- You **lose** four ways: name the wrong person, name the right person without
  proof, let the killer empty the house, or pry so close the killer comes for
  *you*. Prying into the killer's private rooms or questioning them directly
  raises their attention — the meter in the sidebar — so gather what you can
  from the scenes and the innocents.
- The **Chronicler** (a narrating presence, no one in the story) sets each day
  in classic closed-circle prose. Everything is deterministic and findable:
  `web/whodunit-solve.mjs` verifies the case is always solvable in time, and
  that both false and unproven accusations lose.

*(The Python package in `mysteryverse/` is the project's original engine — a
multi-killer intrigue **simulation** with a CLI; the browser game is the
journalist whodunit built on the same deterministic ideas.)*

### Define your own world (drop in a new cast + locale)

The browser game is **data-driven**. A *world* is a locale plus a cast, declared
as plain data; the engine, the Chronicler, the portraits, and the narration all
build themselves from it. Anything you leave out — a guest's diary voice, a
portrait's palette, a room's colours, their scene lines — is **generated from
their traits**, so a world that is nothing but stats and targets still plays,
reads, and looks like a whole game.

- The built-in world and the worked example of the schema:
  [`docs/config.js`](docs/config.js) (Ravenhollow).
- A second world that ships **only data** — no bespoke art or voice, everything
  generated: [`docs/worlds/midnight.js`](docs/worlds/midnight.js) (the Midnight
  Express, a train). Open the page with `?world=midnight` to play it.

A whodunit world is a locale, a cast of suspects, a journalist, and the case:

```js
MV.defineWorld({
  id: "my-world",
  mode: "whodunit",
  locale: {
    name: "The Something-or-Other",
    start: "Great Hall",
    weapons: { "Poker": 3, "Cord": 2 },
    rooms: [
      { name: "Great Hall", exits: ["Study"], description: "…" },
      { name: "Study", exits: ["Great Hall"], description: "…" },
    ],
  },
  cast: [   // the suspects — one is the killer; the rest die one a night
    { name: "Ada Vane", title: "the Widow", skills: { poison: 5 },
      vices: ["pride"], hook: "A widow with a chemist's steady hand." },
    // … more suspects. Missing art/voice is generated from their traits.
  ],
  journalist: { name: "Cole Rourke", title: "the Stringer",
                hook: "A reporter with nothing to lose but the deadline." },
  mystery: {
    killer: "Ada Vane",              // one of the cast
    deadline: 7,                     // last dawn
    motiveRoom: "Study",             // searching here reveals MOTIVE
    hotRooms: ["Study"],             // prying here draws the killer's eye
    truth: "Why they did it — revealed at the end.",
    pillars: {                       // the three true clues, in the journalist's voice
      means: "Examining a scene, you realise…",
      motive: "The study gives up its secret…",
      opportunity: "Cross-referencing the alibis…",
    },
    herrings: {                      // each innocent looks guilty, then is cleared
      "Boyd Kerr": { clue: "Kerr had every reason…", alibi: "…but Kerr was in plain view when it happened." },
    },
  },
});
```

Drop that in a `<script>` after `config.js`, load the page with
`?world=my-world`, and it just runs — one killer, a body a night, the case
always solvable in time, portraits and Chronicler prose generated for anyone you
didn't hand-author. It also appears automatically on the landing page (a "cabinet
of cases"), and each mystery lives on its own URL (`?world=id`).

Optional world fields for presentation:
- `tagline` — the one-liner on the landing card.
- `cover` — the title-card scene: `"manor"` (default), `"yacht"`, or `"moon"`.
- `coverImage` — a URL/path to your own hero image (e.g. `"img/halcyon.jpg"`);
  drop the file next to the page and it's used instead of the generated scene.

It is **pure static files** — no server, no build step, **no AI calls at
run-time** — so it runs entirely in the visitor's browser and costs nothing to
host, however many people play. Serve `docs/` on Cloudflare Pages, GitHub Pages,
or any static host:

```bash
# local preview
cd docs && python3 -m http.server 8000    # then open http://localhost:8000
```

For a single self-contained file (one `.html` with everything inlined — handy
for a strict-CSP embed):

```bash
node web/build.mjs dist/ravenhollow.html
```

The JavaScript engine is a faithful port of the Python: it reproduces the
canonical night death-for-death (verified in `web/`), so the site and the CLI
tell the same story.

## Three ways to play (command line)

```bash
python -m mysteryverse                  # watch a night play itself out
python -m mysteryverse --seed 7         # a reproducible night
python -m mysteryverse --list           # the full guest dossier
```

**Read it through one guest's eyes** — pick a character and get the whole night
as *they* witnessed it, in their own voice (biased, partial, and exactly as much
as they could know):

```bash
python -m mysteryverse --seed 7 --chronicle genevieve
python -m mysteryverse --seed 7 --chronicles          # all seven journals
```

**Play a guest yourself** — take control of one character, choose their every
move from a menu of options (each with its forecast outcome), and get an
end-of-day write-up in their voice:

```bash
python -m mysteryverse --play frayne
```

A turn looks like this:

```
  -- Miss Isolde Frayne, Day 1, in the Foyer --
  [0] Go to the Grand Hall
        -> empty and quiet.
  [1] Go to the Library
        -> with Mace, Genevieve; the Letter Opener lies here; a shelf of first editions worth a fortune.
  [2] Wait and watch
        -> Hold in the Foyer and let the night come to you.
  choose >
```

Names are matched loosely — `vell`, `Dr. Vell`, and `Adrian Vell` all find the
doctor.

## Everything is pre-determined

The night is a **fixed gamebook, not a live simulation**. There is no randomness
at play-time: whether a strike lands is decided purely by the attacker's margin
over their victim (skills + weapon + circumstance), so the *same choice in the
same situation always resolves the same way*. Run the canonical night twice and
you get an identical story, down to the event log.

The practical upshot: **the whole game is plain rules with no model calls.** It
can run entirely in a browser with zero server and zero AI cost, no matter how
many people play. A `--seed` only permutes the guests' turn order once at setup
(pick a different fixed "book"); it never touches a single outcome.

## How the agents think (the choose-your-own-adventure core)

On any guest's turn the engine computes **every option open to them** and a
**forecast** for each: the odds of a clean kill, the risk of being seen, where a
step would put them and who they'd walk in on. A *chooser* then picks one:

- **`AutoChooser`** — the guest decides in character. Vices bend the numbers:
  the wrathful lunge on poor odds, cowards need a sure thing, the greedy wander
  off after treasure.
- **`InteractiveChooser`** — *you* decide, at a prompt, reading the forecasts.
- **`ScriptedChooser`** — a fixed script, for tests and replays.

Because the engine is indifferent to *who* is choosing, the same simulation
doubles as a playable adventure. Swapping the chooser is the only change.

```python
from mysteryverse import Game, render_chronicle, render_story

result = Game(seed=7).run()
print(render_story(result))                       # the god's-eye truth
print(render_chronicle("Mother Genevieve", result))  # one guest's biased account
```

## Being caught

Killing in front of a witness, or leaving a trail, raises a guest's suspicion.
Let it climb too high and at nightfall the household turns on its most obvious
murderer and unmasks them — a loss as final as a blade. This is why nearly every
murder happens when the killer and victim are *alone*: the whole game bends
around not being seen.

## Project layout

```
mysteryverse/
  characters.py   # the seven guests: skills, vices, motives, targets
  mansion.py      # the rooms, weapons, lures, and the host's secret passages
  options.py      # the Option model — one move and its forecast outcome
  choosers.py     # decision policies: Auto / Interactive / Scripted
  engine.py       # day/night loop, one-murder-per-day, resolution, memory
  chronicle.py    # the seven chroniclers — nightly journals, one voice each
  narrator.py     # the omniscient day-by-day account
  cli.py          # the command line
tests/            # invariants: one murder/day, point-of-view correctness
```

## Running the tests

```bash
python -m unittest discover -s tests
```

The suite pins the rules that matter: no day ever sees two murders, the game
always terminates with a coherent verdict, runs are reproducible from a seed,
and — the heart of the mystery — a secret murder appears **only** in the
killer's own journal, never in a bystander's.

## Requirements

Python 3.11+. Standard library only; nothing to install.
