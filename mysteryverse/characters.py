"""The seven guests of Ravenhollow Manor.

Each agent is a self-contained schemer: a bundle of *skills* that make them
dangerous, *vices* that make them careless, a secret *motive*, and a *target*
they were quietly invited here to destroy. The targets form a web rather than a
line -- at least one pair hunts each other -- so no plan survives contact with
the others.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List


# Skills are rated 1 (dabbler) .. 5 (peerless). The engine reads these to
# resolve attempts, sniff out lies, and decide who notices what.
SKILL_NAMES = (
    "stealth",       # moving unseen, striking unheard
    "combat",        # settling things with force
    "poison",        # chemistry, herbs, a doctored glass
    "deduction",     # reading a room, spotting the tell
    "persuasion",    # charm, bluff, misdirection
    "guile",         # locks, sleight of hand, forged alibis
    "composure",     # nerve under suspicion; a steady face
)


@dataclass
class Character:
    """One guest, and everything the engine needs to play them."""

    name: str
    title: str
    skills: Dict[str, int]
    vices: List[str]
    motive: str
    target: str
    secret: str

    # Mutable game state -------------------------------------------------
    room: str = "Foyer"
    alive: bool = True
    caught: bool = False
    suspicion: int = 0            # how much the others distrust them
    carrying: str | None = None   # a weapon, if they picked one up
    kills: List[str] = field(default_factory=list)
    exposed_secret: bool = False

    def skill(self, name: str) -> int:
        return self.skills.get(name, 1)

    def has_vice(self, name: str) -> bool:
        return name in self.vices

    @property
    def status(self) -> str:
        if self.caught:
            return "unmasked"
        if not self.alive:
            return "dead"
        return "at large"

    def offense(self) -> int:
        """Raw lethality of an attempt, before circumstance."""
        base = max(self.skill("combat"), self.skill("poison"))
        return base + self.skill("stealth")

    def defense(self) -> int:
        """How hard this guest is to kill and to fool."""
        return self.skill("combat") + self.skill("deduction")

    def perception(self) -> int:
        """How likely they are to notice a scheme aimed at them or nearby."""
        return self.skill("deduction") + self.skill("composure")


def build_cast() -> List[Character]:
    """The full guest list of Ravenhollow Manor.

    The murder web:
        Vell        -> Blackwood   (silence the blackmailer)
        Frayne      -> Ashford     (avenge a ruined sister)
        Mace        -> Crane       (bury a witness)
        Crane       -> Mace        (the creditor who will collect in blood)
        Ashford     -> Vell        (the rival for an inheritance)
        Blackwood   -> Frayne      (the host's own old grudge)
        Genevieve   -> Mace        (zeal: a soul she deems beyond mercy)

    Note Mace is hunted twice (Crane and Genevieve), and Mace/Crane hunt each
    other -- that mutual pull is where the first blood usually falls.
    """
    cast = [
        Character(
            name="Dr. Adrian Vell",
            title="the Physician",
            skills=dict(stealth=3, combat=2, poison=5, deduction=4,
                        persuasion=3, guile=2, composure=4),
            vices=["pride", "morphine"],
            motive="A patient he let die had been bleeding him dry. The "
                   "blackmail dies when the blackmailer does.",
            target="Cornelius Blackwood",
            secret="The 'lost patient' was no accident -- it was practice.",
        ),
        Character(
            name="Miss Isolde Frayne",
            title="the Ingenue",
            skills=dict(stealth=4, combat=2, poison=3, deduction=3,
                        persuasion=5, guile=4, composure=3),
            vices=["envy", "vanity"],
            motive="Her sister was ruined and discarded by Lady Ashford. A "
                   "debt of shame paid in kind.",
            target="Lady Bianca Ashford",
            secret="The demure accent is invented; she grew up a pickpocket.",
        ),
        Character(
            name="Colonel Roderick Mace",
            title="the Soldier",
            skills=dict(stealth=2, combat=5, poison=1, deduction=3,
                        persuasion=2, guile=2, composure=4),
            vices=["wrath", "drink"],
            motive="A witness to what he ordered on the ridge is in this "
                   "house. Witnesses can be retired.",
            target="Silas Crane",
            secret="Crane isn't the only witness -- but he's the one still "
                   "talking.",
        ),
        Character(
            name="Silas Crane",
            title="the Confidence Man",
            skills=dict(stealth=3, combat=2, poison=2, deduction=3,
                        persuasion=4, guile=5, composure=2),
            vices=["greed", "cowardice"],
            motive="He owes the Colonel a debt no ledger can settle. Better "
                   "the creditor never leaves the manor.",
            target="Colonel Roderick Mace",
            secret="He already sold everyone's secrets to the host -- once.",
        ),
        Character(
            name="Lady Bianca Ashford",
            title="the Heiress",
            skills=dict(stealth=2, combat=2, poison=3, deduction=4,
                        persuasion=5, guile=3, composure=4),
            vices=["arrogance", "gluttony"],
            motive="Only Dr. Vell stands between her and the whole Ashford "
                   "estate. Physicians, after all, sign the certificates.",
            target="Dr. Adrian Vell",
            secret="She has poisoned before, and signed nothing.",
        ),
        Character(
            name="Cornelius Blackwood",
            title="the Host",
            skills=dict(stealth=4, combat=3, poison=3, deduction=5,
                        persuasion=4, guile=4, composure=5),
            vices=["paranoia", "lust"],
            motive="He gathered every person who ever wronged him under one "
                   "roof. He does not intend for all of them to leave.",
            target="Miss Isolde Frayne",
            secret="He knows the manor's hidden passages -- and used them to "
                   "read every guest's mail before they arrived.",
        ),
        Character(
            name="Mother Genevieve",
            title="the Occultist",
            skills=dict(stealth=3, combat=2, poison=4, deduction=4,
                        persuasion=3, guile=3, composure=5),
            vices=["fanaticism", "secrecy"],
            motive="She has read the Colonel's soul and found it past saving. "
                   "Some mercies can only be delivered with hemlock.",
            target="Colonel Roderick Mace",
            secret="Her 'visions' are cover -- she has followed Mace for years.",
        ),
    ]
    return cast
