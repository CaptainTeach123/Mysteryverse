"""Choosers -- the policies that pick among the computed options.

A chooser is any object with ``choose(game, actor, options) -> Option``. The
engine is otherwise indifferent to *who* is deciding, which is what makes the
same simulation double as a playable adventure.
"""

from __future__ import annotations

import random
from typing import Dict, List, Optional

from .options import Option
from .characters import Character


class AutoChooser:
    """The guest decides for themselves, in character.

    Scores every option and takes the best, with vice and nerve bending the
    numbers: the wrathful lunge on poor odds, cowards need a sure thing, the
    greedy wander off after treasure.
    """

    def __init__(self, rng: random.Random) -> None:
        self.rng = rng

    def choose(self, game, actor: Character, options: List[Option]) -> Option:
        others = game._in_room(actor.room, exclude=actor.name)
        threat = game._pressing_threat(actor, others)
        needed = game._strike_confidence_needed(actor)
        reckless = any(actor.has_vice(v) for v in game.RECKLESS_VICES)
        has_means = any(o.kind == "strike" for o in options)
        target = game.by_name.get(actor.target)
        target_alive = target is not None and target.alive
        knows = game._knows_passages(actor)

        best, best_score = None, -1e18
        for opt in options:
            score = self._score(game, actor, opt, threat=threat, needed=needed,
                                 reckless=reckless, has_means=has_means,
                                 target=target, target_alive=target_alive,
                                 knows=knows)
            score += self.rng.random() * 3  # break ties unpredictably
            if score > best_score:
                best, best_score = opt, score
        return best

    def _score(self, game, actor, opt, *, threat, needed, reckless,
               has_means, target, target_alive, knows) -> float:
        if opt.kind == "strike":
            chance = opt.success_chance or 0.0
            base = chance * 100
            bonus = 200 if opt.is_target else 0
            if opt.witnessed:
                if reckless and chance >= needed + 0.1:
                    return 300 + base + bonus - opt.suspicion_risk * 12
                return -1e9  # nobody sane kills in front of an audience
            if chance >= needed:
                return 1000 + base + bonus - opt.suspicion_risk * 3
            return 150 + base + bonus  # tempted, but the odds give them pause

        if opt.kind == "arm":
            return 360 if not has_means else 110

        if opt.kind in ("move", "passage"):
            return self._score_move(game, actor, opt, threat=threat,
                                    has_means=has_means, target=target,
                                    target_alive=target_alive, knows=knows)

        if opt.kind == "wait":
            # Lying in wait is worth something only if the target is already here
            # and privacy might yet come; otherwise it's the last resort.
            here = game._in_room(actor.room, exclude=actor.name)
            if target in here:
                return 90
            return 30
        return 0

    def _score_move(self, game, actor, opt, *, threat, has_means, target,
                    target_alive, knows) -> float:
        dest = opt.dest
        score = 140.0

        if not has_means:
            # First order of business: get a means of murder in hand.
            nm = game._distance_to_means(dest, actor, knows=knows)
            if nm is not None:
                score += 130 - 35 * nm
        elif target_alive:
            dt = game.mansion.bfs_distance(dest, target.room, knows_passages=knows)
            if dt is not None:
                score += 130 - 35 * dt

        if threat is not None:
            # Put distance between themselves and the hunter; crowds are safer.
            away = game.mansion.bfs_distance(dest, threat.room, knows_passages=knows)
            score += 60 * (away or 0)
            score += 25 * len(game._in_room(dest))
            if opt.kind == "passage":
                score += 120  # the host vanishing through a wall

        if any(actor.has_vice(v) for v in game.DISTRACTIBLE_VICES):
            lure_here = game.mansion.room(dest).lure is not None
            if lure_here:
                score += self.rng.random() * 90
        return score


class InteractiveChooser:
    """You play one guest; the forecasts are laid out and you pick."""

    def __init__(self, input_fn=input, output_fn=print) -> None:
        self.input = input_fn
        self.output = output_fn

    def choose(self, game, actor: Character, options: List[Option]) -> Option:
        self.output(f"\n  -- {actor.name}, Day {game.day}, in the "
                    f"{actor.room} --")
        here = game._in_room(actor.room, exclude=actor.name)
        if here:
            self.output("     also here: " +
                        ", ".join(c.name for c in here))
        if actor.carrying:
            self.output(f"     you are holding: {actor.carrying}")
        for i, opt in enumerate(options):
            self.output(opt.menu_line(i))
        while True:
            raw = self.input("  choose > ").strip()
            if raw.isdigit() and 0 <= int(raw) < len(options):
                return options[int(raw)]
            self.output("     (enter one of the listed numbers)")


class ScriptedChooser:
    """Follow a fixed script keyed by (day, actor) -> option key or kind.

    Falls back to a wrapped chooser (default AutoChooser) whenever the script
    has nothing to say, so tests can pin one decision and let the rest run.
    """

    def __init__(self, script: Dict, fallback) -> None:
        self.script = script
        self.fallback = fallback

    def choose(self, game, actor: Character, options: List[Option]) -> Option:
        want = self.script.get((game.day, actor.name)) or \
            self.script.get(actor.name)
        if want is not None:
            for opt in options:
                if opt.key == want or opt.kind == want:
                    return opt
        return self.fallback.choose(game, actor, options)
