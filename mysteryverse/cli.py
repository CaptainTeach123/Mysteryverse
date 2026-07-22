"""Command-line entry point for a night at Ravenhollow Manor.

    python -m mysteryverse                       # watch a night play itself out
    python -m mysteryverse --seed 7              # a reproducible night
    python -m mysteryverse --chronicle Vell      # read it through one guest's eyes
    python -m mysteryverse --chronicles          # all seven journals
    python -m mysteryverse --play Frayne         # you decide Frayne's every move
    python -m mysteryverse --list                # who's who

Names are matched loosely: "vell", "Dr. Vell", "Adrian Vell" all find the doctor.
"""

from __future__ import annotations

import argparse

from .engine import Game
from .choosers import InteractiveChooser
from .narrator import render_dossier, render_story
from .chronicle import render_chronicle, render_day_entry, VOICES


def _resolve_name(fragment: str) -> str:
    frag = fragment.strip().lower()
    matches = [n for n in VOICES if frag in n.lower()]
    if len(matches) == 1:
        return matches[0]
    if not matches:
        raise SystemExit(f"No guest matches {fragment!r}. Try one of:\n  " +
                         "\n  ".join(VOICES))
    raise SystemExit(f"{fragment!r} is ambiguous ({', '.join(matches)}). "
                     f"Be more specific.")


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(
        prog="mysteryverse",
        description="Seven schemers, one storm-bound manor, a body a day.")
    p.add_argument("--seed", type=int, default=None,
                   help="seed the night for a reproducible run")
    p.add_argument("--days", type=int, default=12,
                   help="maximum days before the storm breaks (default 12)")
    p.add_argument("--list", action="store_true",
                   help="print the guest list and exit")
    p.add_argument("--chronicle", metavar="GUEST",
                   help="after the night, print this guest's journal")
    p.add_argument("--chronicles", action="store_true",
                   help="after the night, print all seven journals")
    p.add_argument("--play", metavar="GUEST",
                   help="take control of this guest and choose their moves")
    p.add_argument("--no-story", action="store_true",
                   help="skip the god's-eye day-by-day account")
    args = p.parse_args(argv)

    if args.list:
        game = Game(seed=args.seed)
        print(render_dossier(game.cast))
        return 0

    if args.play:
        return _play(args)

    game = Game(seed=args.seed, max_days=args.days)
    print(render_dossier(game.cast))
    result = game.run()
    if not args.no_story:
        print(render_story(result))
    if args.chronicles:
        for name in VOICES:
            print("\n" + render_chronicle(name, result))
    elif args.chronicle:
        print("\n" + render_chronicle(_resolve_name(args.chronicle), result))
    return 0


def _play(args) -> int:
    """Interactive mode: you drive one guest and get a write-up each night."""
    who = _resolve_name(args.play)

    def nightfall(game, day):
        print("\n" + "=" * 70)
        print(f"  END OF THE DAY {day} -- your write-up")
        print("=" * 70)
        print(render_day_entry(who, game.memory[who], day, game.cast))
        input("\n  (press enter for the next day) ")

    game = Game(seed=args.seed, max_days=args.days, nightfall_hook=nightfall)
    # Only the chosen guest is played by hand; everyone else acts on their own.
    from .choosers import AutoChooser
    auto = AutoChooser()
    manual = InteractiveChooser()

    class _Router:
        def choose(self, g, actor, options):
            return (manual if actor.name == who else auto).choose(g, actor, options)

    game.chooser = _Router()

    print(render_dossier(game.cast))
    print(f"\n  You are {who}. Choose their moves; the other six scheme on "
          f"their own.\n")
    result = game.run()
    print("\n" + render_story(result))
    print("\n" + render_chronicle(who, result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
