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

## Play in the browser (zero-cost website)

There's a full graphical version in [`docs/`](docs/): the deterministic engine
ported to JavaScript, flat mid-century SVG art for every guest and room, and the
whole choose-your-own-adventure — pick a guest, choose their day from a menu of
options with forecast outcomes, and get an illustrated end-of-day write-up in
their voice.

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
