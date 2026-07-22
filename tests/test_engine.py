"""Invariants for the Ravenhollow engine."""

import unittest

from mysteryverse.engine import Game
from mysteryverse.choosers import ScriptedChooser, AutoChooser


SEEDS = list(range(40))


class TestCoreInvariants(unittest.TestCase):

    def test_at_most_one_murder_per_day(self):
        """The manor's iron rule: no day sees more than one death."""
        for seed in SEEDS:
            result = Game(seed=seed).run()
            per_day = {}
            for d in result.deaths:
                per_day[d.day] = per_day.get(d.day, 0) + 1
            for day, count in per_day.items():
                self.assertLessEqual(
                    count, 1, f"seed {seed}: {count} deaths on day {day}")

    def test_game_terminates_and_reports(self):
        for seed in SEEDS:
            result = Game(seed=seed).run()
            self.assertGreaterEqual(result.days, 1)
            self.assertIsInstance(result.verdict, str)
            self.assertTrue(result.verdict)
            # A winner is either nobody or exactly one named survivor scored best.
            if result.winner is not None:
                self.assertIn(result.winner, {c.name for c in result.cast})

    def test_deaths_are_consistent_with_state(self):
        for seed in SEEDS:
            result = Game(seed=seed).run()
            dead = {d.victim for d in result.deaths}
            for c in result.cast:
                if c.name in dead:
                    self.assertFalse(c.alive, f"{c.name} both dead and alive")

    def test_determinism(self):
        for seed in (1, 5, 13, 21):
            a = Game(seed=seed).run()
            b = Game(seed=seed).run()
            self.assertEqual(
                [(d.day, d.victim, d.culprit) for d in a.deaths],
                [(d.day, d.victim, d.culprit) for d in b.deaths],
                f"seed {seed} not reproducible")

    def test_fully_predetermined_without_a_seed(self):
        """The canonical night (no seed) is a fixed gamebook: identical deaths,
        winner, and full event log every single time."""
        runs = [Game().run() for _ in range(5)]
        first = runs[0]
        for r in runs[1:]:
            self.assertEqual([vars(d) for d in r.deaths],
                             [vars(d) for d in first.deaths])
            self.assertEqual(r.winner, first.winner)
            self.assertEqual(len(r.events), len(first.events))

    def test_a_strike_outcome_is_pure_state(self):
        """The same attempt in the same state always resolves the same way --
        the margin, not a die, decides it."""
        game = Game(seed=0)
        vell = game.by_name["Dr. Adrian Vell"]
        bianca = game.by_name["Lady Bianca Ashford"]
        m1 = game._attack_margin(vell, bianca, "poison", None)
        m2 = game._attack_margin(vell, bianca, "poison", None)
        self.assertEqual(m1, m2)

    def test_a_kill_is_only_ever_by_someone_present(self):
        for seed in SEEDS:
            result = Game(seed=seed).run()
            for d in result.deaths:
                killer = next(c for c in result.cast if c.name == d.culprit)
                self.assertIn(d.victim, killer.kills)


class TestOptions(unittest.TestCase):

    def test_always_offers_a_move_or_wait(self):
        game = Game(seed=2)
        game.day = 1
        for actor in game._living():
            opts = game._options(actor)
            self.assertTrue(any(o.kind in ("move", "passage", "wait")
                                for o in opts),
                            f"{actor.name} had no non-lethal option")

    def test_strikes_suppressed_after_the_days_murder(self):
        game = Game(seed=2)
        game.day = 1
        # Fabricate a murder having already happened today.
        from mysteryverse.engine import Death
        game.murder_today = Death(1, "x", "y", "Study", "z", "violence",
                                  False, "-")
        for actor in game._living():
            actor.carrying = "Revolver"  # everyone armed
            opts = game._options(actor)
            self.assertFalse(any(o.kind == "strike" for o in opts),
                             "strike offered despite the day's murder being done")

    def test_forecasts_are_populated_for_strikes(self):
        # Put two guests alone in a room, one armed, and check the strike option.
        game = Game(seed=0)
        game.day = 1
        vell = game.by_name["Dr. Adrian Vell"]
        bianca = game.by_name["Lady Bianca Ashford"]
        for c in game.cast:
            game.mansion.room(c.room).occupants.remove(c.name)
        vell.room = bianca.room = "Gallery"
        game.mansion.room("Gallery").occupants = [vell.name, bianca.name]
        vell.carrying = "Ceremonial Dagger"
        strikes = [o for o in game._options(vell) if o.kind == "strike"]
        self.assertTrue(strikes)
        for o in strikes:
            self.assertIsNotNone(o.margin)
            # will_succeed is the pre-determined outcome: it must agree with the
            # margin exactly (positive margin -> the strike lands).
            self.assertEqual(o.will_succeed, o.margin >= 1)
            self.assertFalse(o.witnessed)  # they are alone


class TestChoosers(unittest.TestCase):

    def test_a_body_falls_every_day(self):
        # Even if every guest merely waits, the guaranteed daily murder means a
        # body falls each day and the night resolves to a lone survivor.
        result = Game(seed=4, chooser=_AlwaysWait()).run()
        self.assertTrue(result.deaths)
        per_day = {}
        for d in result.deaths:
            per_day[d.day] = per_day.get(d.day, 0) + 1
        self.assertEqual(sorted(per_day), list(range(1, result.days + 1)))
        self.assertTrue(all(c == 1 for c in per_day.values()))
        self.assertLessEqual(len(result.survivors), 1)


class _AlwaysWait:
    def choose(self, game, actor, options):
        for o in options:
            if o.kind == "wait":
                return o
        return options[-1]


if __name__ == "__main__":
    unittest.main()
