"""The chroniclers only know what they could have seen."""

import unittest

from mysteryverse.engine import Game
from mysteryverse.chronicle import render_chronicle, render_day_entry, VOICES


SEEDS = list(range(30))


class TestPointOfView(unittest.TestCase):

    def test_every_guest_has_a_voice(self):
        game = Game(seed=1)
        self.assertEqual(set(VOICES), {c.name for c in game.cast})

    def test_only_the_killer_records_a_secret_kill(self):
        """An unwitnessed murder appears in the culprit's memory as their own
        deed, and in no one else's as a witnessed killing."""
        for seed in SEEDS:
            result = Game(seed=seed).run()
            for d in result.deaths:
                if d.witnessed:
                    continue
                # Culprit owns it.
                own = [m for m in result.memory[d.culprit]
                       if m["kind"] == "own_kill" and m["victim"] == d.victim]
                self.assertTrue(own, f"seed {seed}: culprit lacks own_kill")
                # Nobody else claims to have witnessed it.
                for name, mem in result.memory.items():
                    if name == d.culprit:
                        continue
                    witnessed = [m for m in mem if m["kind"] == "witness_kill"
                                 and m["victim"] == d.victim]
                    self.assertFalse(
                        witnessed,
                        f"seed {seed}: {name} 'witnessed' a secret murder")

    def test_witnessed_kill_is_known_to_onlookers(self):
        for seed in SEEDS:
            result = Game(seed=seed).run()
            for d in result.deaths:
                if not d.witnessed:
                    continue
                seen_by = [name for name, mem in result.memory.items()
                           if any(m["kind"] == "witness_kill"
                                  and m["victim"] == d.victim for m in mem)]
                self.assertTrue(
                    seen_by, f"seed {seed}: witnessed kill seen by no one")

    def test_a_guest_never_records_a_room_they_were_not_in(self):
        """Body discoveries only happen where the guest actually stood."""
        for seed in SEEDS[:10]:
            result = Game(seed=seed).run()
            deaths_by_victim = {d.victim: d for d in result.deaths}
            for name, mem in result.memory.items():
                for m in mem:
                    if m["kind"] == "found_body":
                        d = deaths_by_victim.get(m["victim"])
                        self.assertIsNotNone(d)
                        # The body is found in the room the murder happened in.
                        self.assertEqual(m["room"], d.room)


class TestRendering(unittest.TestCase):

    def test_all_chronicles_render(self):
        for seed in (0, 7, 19):
            result = Game(seed=seed).run()
            for name in VOICES:
                text = render_chronicle(name, result)
                self.assertIn(name.upper(), text)
                self.assertTrue(len(text.splitlines()) >= 4)

    def test_day_entry_renders_for_a_living_player(self):
        result = Game(seed=7).run()
        # Rendering any single day for any guest should not raise.
        for name in VOICES:
            for day in range(1, result.days + 1):
                render_day_entry(name, result.memory[name], day, result.cast)

    def test_epilogue_tag_only_on_final_entry(self):
        result = Game(seed=7).run()
        # A guest who died should carry the death tag on exactly one day.
        for name in VOICES:
            tags = 0
            days = sorted({m["day"] for m in result.memory[name]
                           if m["day"] >= 1})
            for day in days:
                entry = render_day_entry(name, result.memory[name], day,
                                         result.cast)
                if "last thing they ever wrote" in entry or \
                        "ends mid-sentence" in entry:
                    tags += 1
            self.assertLessEqual(tags, 1, f"{name} tagged on multiple days")


if __name__ == "__main__":
    unittest.main()
