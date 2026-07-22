"""Ravenhollow Manor -- the secluded locale.

A storm has taken the bridge and the telephone line. No one is leaving until
morning. The guests may move freely: from any room to any room it connects to,
one step a round. Weapons lie where a careless household left them, and the
host alone knows the passages that don't appear on any floor plan.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List


@dataclass
class Room:
    name: str
    description: str
    exits: List[str]
    weapon: str | None = None            # a weapon resting here, if any
    provides_poison: bool = False        # food/drink to be doctored
    lure: str | None = None              # what a vice-ridden guest is drawn to
    occupants: List[str] = field(default_factory=list)
    bodies: List[str] = field(default_factory=list)   # the dead, left to be found


# The graph is deliberately looped so that no room is a dead end -- everyone can
# always run, and everyone can always be cornered.
_ROOMS = [
    Room("Foyer",
         "Black-and-white marble, a dead grandfather clock, coats still damp.",
         ["Grand Hall", "Library"]),
    Room("Grand Hall",
         "A sweep of staircase under antlers and older portraits.",
         ["Foyer", "Dining Room", "Ballroom", "Landing"]),
    Room("Library",
         "Ladders, locked cases, the smell of vellum and pipe-smoke.",
         ["Foyer", "Study", "Conservatory"],
         weapon="Letter Opener",
         lure="a shelf of first editions worth a fortune"),
    Room("Study",
         "The host's desk, a cold hearth, a decanter of something amber.",
         ["Library", "Landing"],
         weapon="Revolver",
         provides_poison=True,
         lure="an unlocked drawer of bearer bonds"),
    Room("Conservatory",
         "Glass and rain and the black shapes of overgrown ferns.",
         ["Library", "Garden"],
         weapon="Garden Shears",
         provides_poison=True),
    Room("Dining Room",
         "Twelve chairs, seven places set, candlelight guttering.",
         ["Grand Hall", "Kitchen", "Ballroom"],
         weapon="Candlestick",
         provides_poison=True,
         lure="a decanter of very good port"),
    Room("Kitchen",
         "Copper, cleavers, a range still warm, a door to the dark cellar.",
         ["Dining Room", "Cellar"],
         weapon="Carving Knife",
         provides_poison=True),
    Room("Cellar",
         "Cobwebbed bottles and one bare bulb that flickers.",
         ["Kitchen"],
         weapon="Length of Rope",
         lure="a rack of pre-war vintages"),
    Room("Ballroom",
         "A parquet floor, a shrouded chandelier, no music at all.",
         ["Grand Hall", "Dining Room", "Gallery"],
         lure="one's own reflection in a wall of mirrors"),
    Room("Gallery",
         "Ancestors in oils, and one empty frame where a painting was cut out.",
         ["Ballroom", "Landing"],
         weapon="Ceremonial Dagger",
         lure="a display case of Blackwood jewels"),
    Room("Landing",
         "A gallery of doors above the hall; the storm loud against the glass.",
         ["Grand Hall", "Study", "Gallery", "Master Bedroom"]),
    Room("Master Bedroom",
         "The host's own room; a four-poster, a locked wardrobe, a view of the "
         "drowned garden.",
         ["Landing"],
         weapon="Silk Cord",
         lure="a jewelry box left carelessly open"),
    Room("Garden",
         "Sodden lawns, a broken sundial, the bridge that is no longer there.",
         ["Conservatory"],
         lure="the gate to a freedom the storm has cancelled"),
]

# Passages only the host knows. They let a guest slip between two distant rooms
# in a single, silent step -- and vanish from where a witness last saw them.
SECRET_PASSAGES = {
    "Study": "Master Bedroom",
    "Master Bedroom": "Study",
    "Library": "Gallery",
    "Gallery": "Library",
}


class Mansion:
    def __init__(self) -> None:
        self.rooms: Dict[str, Room] = {r.name: r for r in _build_rooms()}

    def room(self, name: str) -> Room:
        return self.rooms[name]

    def neighbors(self, name: str, *, knows_passages: bool = False) -> List[str]:
        exits = list(self.rooms[name].exits)
        if knows_passages and name in SECRET_PASSAGES:
            exits.append(SECRET_PASSAGES[name])
        return exits

    def shortest_step(self, start: str, goal: str, *,
                      knows_passages: bool = False) -> str | None:
        """One step from ``start`` along the shortest path toward ``goal``.

        Returns the neighbouring room to move into, or None if already there or
        unreachable.
        """
        if start == goal:
            return None
        # Breadth-first search, recording the first step taken from start.
        frontier: List[tuple[str, str]] = []
        seen = {start}
        for nxt in self.neighbors(start, knows_passages=knows_passages):
            frontier.append((nxt, nxt))
            seen.add(nxt)
        while frontier:
            current, first = frontier.pop(0)
            if current == goal:
                return first
            for nxt in self.neighbors(current, knows_passages=knows_passages):
                if nxt not in seen:
                    seen.add(nxt)
                    frontier.append((nxt, first))
        return None

    def bfs_distance(self, start: str, goal: str, *,
                     knows_passages: bool = False) -> int | None:
        """Number of steps from ``start`` to ``goal`` (0 if equal)."""
        if start == goal:
            return 0
        seen = {start}
        frontier = [(start, 0)]
        while frontier:
            current, dist = frontier.pop(0)
            for nxt in self.neighbors(current, knows_passages=knows_passages):
                if nxt == goal:
                    return dist + 1
                if nxt not in seen:
                    seen.add(nxt)
                    frontier.append((nxt, dist + 1))
        return None

    def all_room_names(self) -> List[str]:
        return list(self.rooms)


def _build_rooms() -> List[Room]:
    # Fresh Room objects each game so occupancy/weapon state never leaks
    # between simulations.
    return [
        Room(r.name, r.description, list(r.exits), r.weapon,
             r.provides_poison, r.lure)
        for r in _ROOMS
    ]
