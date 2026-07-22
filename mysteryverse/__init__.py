"""Mysteryverse -- a multi-agent game of intrigue at Ravenhollow Manor.

Seven guests, each with their own skills, vices, and a private reason to see
another dead, are shut in a storm-bound estate. Time runs in days; at most one
of them is murdered per day; and every night the survivors journal what they
did and saw. Play it as a self-running simulation, step into any one guest and
choose their moves, or read the night back through a single guest's eyes.
"""

from .characters import Character, build_cast
from .mansion import Mansion
from .options import Option
from .choosers import AutoChooser, InteractiveChooser, ScriptedChooser
from .engine import Game, GameResult, Death
from .chronicle import render_chronicle, render_day_entry, VOICES
from .narrator import render_story, render_dossier

__all__ = [
    "Character", "build_cast", "Mansion", "Option",
    "AutoChooser", "InteractiveChooser", "ScriptedChooser",
    "Game", "GameResult", "Death",
    "render_chronicle", "render_day_entry", "VOICES",
    "render_story", "render_dossier",
]
