"""Choosers -- the policies that pick among the computed options.

A chooser is any object with ``choose(game, actor, options) -> Option``. The
engine is otherwise indifferent to *who* is deciding, which is what makes the
same simulation double as a playable adventure.
"""

from __future__ import annotations

from typing import Dict, List

from .options import Option
from .characters import Character


class AutoChooser:
    """The guest decides for themselves, in character -- deterministically.

    Scores every option and takes the best, with vice and nerve bending the
    numbers: the wrathful lunge on hopeless odds (and botch), cowards need a
    sure thing, the greedy drift after treasure. There is no randomness -- the
    same situation always yields the same choice, which is what makes the night
    a fixed, replayable adventure.

    Ties are settled by the order options were generated (strikes first, then
    arming, then moves, then waiting), so the result is always well-defined.
    """

    def choose(self, game, actor: Character, options: List[Option]) -> Option:
        others = game._in_room(actor.room, exclude=actor.name)
        threat = game._pressing_threat(actor, others)
        needed = game._needed_margin(actor)
        reckless = any(actor.has_vice(v) for v in game.RECKLESS_VICES)
        has_means = any(o.kind == "strike" for o in options)
        target = game.by_name.get(actor.target)
        target_alive = target is not None and target.alive
        knows = game._knows_passages(actor)

        best, best_score = options[0], -1e18
        for opt in options:
            score = self._score(game, actor, opt, threat=threat, needed=needed,
                                 reckless=reckless, has_means=has_means,
                                 target=target, target_alive=target_alive,
                                 knows=knows)
            if score > best_score:            # strict > keeps the first on ties
                best, best_score = opt, score
        return best

    def _score(self, game, actor, opt, *, threat, needed, reckless,
               has_means, target, target_alive, knows) -> float:
        if opt.kind == "strike":
            margin = opt.margin if opt.margin is not None else -99
            base = margin * 12
            bonus = 200 if opt.is_target else 0
            if opt.witnessed:
                # Only the reckless kill in front of an audience -- and it costs
                # them dearly in suspicion.
                if reckless and margin >= needed:
                    return 300 + base + bonus - opt.suspicion_risk * 12
                return -1e9
            if margin >= needed:
                return 1000 + base + bonus - opt.suspicion_risk * 3
            return 120 + base + bonus  # tempted, but the odds stay their hand

        if opt.kind == "arm":
            return 360 if not has_means else 110

        if opt.kind in ("move", "passage"):
            return self._score_move(game, actor, opt, threat=threat,
                                    has_means=has_means, target=target,
                                    target_alive=target_alive, knows=knows)

        if opt.kind == "wait":
            here = game._in_room(actor.room, exclude=actor.name)
            return 90 if target in here else 30
        return 0

    def _score_move(self, game, actor, opt, *, threat, has_means, target,
                    target_alive, knows) -> float:
        dest = opt.dest
        score = 140.0

        if not has_means:
            nm = game._distance_to_means(dest, actor, knows=knows)
            if nm is not None:
                score += 130 - 35 * nm
        elif target_alive:
            dt = game.mansion.bfs_distance(dest, target.room, knows_passages=knows)
            if dt is not None:
                score += 130 - 35 * dt

        if threat is not None:
            away = game.mansion.bfs_distance(dest, threat.room, knows_passages=knows)
            score += 60 * (away or 0)
            score += 25 * len(game._in_room(dest))
            if opt.kind == "passage":
                score += 120  # the host vanishing through a wall

        # A steady, deterministic pull toward temptation for the distractible.
        if any(actor.has_vice(v) for v in game.DISTRACTIBLE_VICES):
            if game.mansion.room(dest).lure is not None:
                score += 30
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
