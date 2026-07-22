"""The game engine: seven schemers, one manor, a body a day.

Time runs in **days**. Through the daylight the guests move where they please,
arm themselves, stalk, and manoeuvre -- but the manor has an iron rule:

    at most one guest is murdered per day.

The first clean kill is the day's death; after it, no one else can strike until
tomorrow (the house is roused, the moment is gone). Then **night falls**, and
each surviving guest privately writes down what they did and what they saw --
which is never the whole truth, because most murders have no witness but the
murderer.

Nobody wants to be caught. Killing in front of others, or leaving a trail,
raises suspicion; let it climb too high and the household turns on its most
obvious murderer at nightfall and unmasks them -- a loss as final as a blade.

Every decision runs through a *chooser* (see ``choosers.py``): the same engine
plays itself out on its own, or hands one guest's choices to you.
"""

from __future__ import annotations

import random
from dataclasses import dataclass, field
from typing import Dict, List, Optional

from .characters import Character, build_cast
from .mansion import Mansion
from .options import Option
from .choosers import AutoChooser


# --- Tunable balance constants -------------------------------------------
WEAPON_POWER = {
    "Revolver": 4,
    "Ceremonial Dagger": 3,
    "Carving Knife": 3,
    "Candlestick": 2,
    "Garden Shears": 2,
    "Length of Rope": 2,
    "Silk Cord": 2,
    "Letter Opener": 1,
}

EXPOSE_THRESHOLD = 6      # suspicion at which the household may unmask a guest
TURNS_PER_DAY = 5         # maneuvering turns before nightfall
MAX_DAYS = 12

# The margin (attacker strength minus target strength) a guest insists on
# before they will risk a strike. Vice bends nerve up or down. A margin of 1+
# means the strike is pre-determined to succeed; 0 or less, to fail.
BASE_NEEDED_MARGIN = 1
VICE_MARGIN = {
    "wrath": -3,        # will lunge at hopeless odds (and botch)
    "fanaticism": -2,
    "pride": -1,
    "arrogance": -1,
    "cowardice": +3,    # needs a sure thing
    "greed": +1,
    "paranoia": +1,
}


def _last(name: str) -> str:
    parts = name.replace("Dr. ", "").replace("Lady ", "").replace(
        "Miss ", "").replace("Colonel ", "").replace("Mother ", "").split()
    return parts[-1]


@dataclass
class Death:
    day: int
    victim: str
    culprit: str
    room: str
    weapon: str
    method: str          # "violence" or "poison"
    witnessed: bool
    red_herring: str


@dataclass
class GameResult:
    winner: Optional[str]
    verdict: str
    deaths: List[Death]
    events: List[dict]
    memory: Dict[str, List[dict]]
    survivors: List[str]
    unmasked: List[str]
    days: int
    cast: List[Character]


class Game:
    RECKLESS_VICES = {"wrath", "fanaticism"}
    DISTRACTIBLE_VICES = {"greed", "gluttony", "drink", "vanity", "lust",
                          "morphine"}
    DULLING_VICES = {"drink", "gluttony", "morphine"}

    def __init__(self, seed: Optional[int] = None,
                 max_days: int = MAX_DAYS,
                 turns_per_day: int = TURNS_PER_DAY,
                 chooser=None,
                 nightfall_hook=None) -> None:
        self.max_days = max_days
        self.turns_per_day = turns_per_day
        # Called as nightfall_hook(game, day) after each day resolves -- the CLI
        # uses it to hand the player their end-of-day write-up.
        self.nightfall_hook = nightfall_hook
        self.mansion = Mansion()
        self.cast: List[Character] = build_cast()
        self.by_name: Dict[str, Character] = {c.name: c for c in self.cast}
        self.chooser = chooser or AutoChooser()

        # The turn order is fixed for the whole night (like initiative), so the
        # book plays out the same way every time. A seed only permutes that
        # order once, at setup -- it never touches a single outcome, which is
        # decided purely by the guests' choices and skills.
        self.initiative: List[str] = [c.name for c in self.cast]
        if seed is not None:
            random.Random(seed).shuffle(self.initiative)

        self.events: List[dict] = []
        self.deaths: List[Death] = []
        self.memory: Dict[str, List[dict]] = {c.name: [] for c in self.cast}
        self._discovered: Dict[str, set] = {c.name: set() for c in self.cast}
        self.day = 0
        self.murder_today: Optional[Death] = None
        self._scatter_guests()

    # -- setup ------------------------------------------------------------
    def _scatter_guests(self) -> None:
        for c in self.cast:
            c.room = "Foyer"
            self.mansion.room("Foyer").occupants.append(c.name)

    # -- queries ----------------------------------------------------------
    def _living(self) -> List[Character]:
        return [c for c in self.cast if c.alive and not c.caught]

    def _in_room(self, room: str, exclude: str | None = None) -> List[Character]:
        return [self.by_name[n] for n in self.mansion.room(room).occupants
                if self.by_name[n].alive and not self.by_name[n].caught
                and n != exclude]

    def _knows_passages(self, actor: Character) -> bool:
        return actor.name == "Cornelius Blackwood"

    def _methods_available(self, actor: Character, room):
        methods = []
        if room.provides_poison and actor.skill("poison") >= 3:
            methods.append(("poison", None))
        if actor.carrying is not None:
            methods.append(("violence", actor.carrying))
        return methods

    def _has_means(self, actor: Character, room) -> bool:
        return bool(self._methods_available(actor, room))

    def _distance_to_means(self, start: str, actor: Character, *, knows: bool):
        best = None
        for name, room in self.mansion.rooms.items():
            usable = room.weapon is not None or \
                (room.provides_poison and actor.skill("poison") >= 3)
            if not usable:
                continue
            d = self.mansion.bfs_distance(start, name, knows_passages=knows)
            if d is not None and (best is None or d < best):
                best = d
        return best

    def _pressing_threat(self, actor: Character, others: List[Character]):
        for h in [o for o in others if o.target == actor.name]:
            armed = h.carrying is not None or h.skill("poison") >= 3
            outmatched = h.offense() >= actor.defense()
            afraid = actor.has_vice("cowardice") or actor.has_vice("paranoia")
            if armed and (outmatched or afraid):
                return h
        return None

    # -- combat math (fully deterministic) --------------------------------
    def _attack_margin(self, attacker: Character, target: Character,
                       method: str, weapon: str | None) -> int:
        """By how much the attacker out-matches the target, as an integer.

        Positive -> the strike lands. Zero or negative -> it fails. This is a
        pure function of the situation: the same attempt in the same state
        always resolves the same way. No randomness at play-time.
        """
        offense = attacker.offense()
        if method == "violence" and weapon:
            offense += WEAPON_POWER.get(weapon, 1)
        elif method == "poison":
            offense += attacker.skill("poison") // 2

        defense = target.defense()
        room = self.mansion.room(target.room)
        if any(target.has_vice(v) for v in self.DULLING_VICES) and \
                (room.lure or room.provides_poison):
            defense -= 2
        if attacker.skill("stealth") >= 4 and target.suspicion == 0:
            offense += 1
        return offense - defense

    @staticmethod
    def _margin_label(margin: int) -> str:
        if margin >= 4:
            return "overwhelming -- a certain kill"
        if margin >= 2:
            return "strong -- the blow will land"
        if margin == 1:
            return "slight -- it will just succeed"
        if margin == 0:
            return "even -- they will get the better of you"
        return "against you -- the attempt will fail"

    def _needed_margin(self, attacker: Character) -> int:
        """The margin a guest insists on before they'll risk a strike.

        Vice bends nerve: the wrathful will lunge at hopeless odds (and botch,
        deterministically), cowards demand a sure thing."""
        need = BASE_NEEDED_MARGIN
        for v in attacker.vices:
            need += VICE_MARGIN.get(v, 0)
        return max(-3, min(5, need))

    # -- options (the choose-your-own-adventure surface) ------------------
    def _options(self, actor: Character) -> List[Option]:
        room = self.mansion.room(actor.room)
        others = self._in_room(actor.room, exclude=actor.name)
        opts: List[Option] = []

        # Strikes -- only if the day's murder hasn't happened yet.
        if self.murder_today is None:
            for method, weapon in self._methods_available(actor, room):
                for victim in others:
                    margin = self._attack_margin(actor, victim, method, weapon)
                    witnesses = [o for o in others if o is not victim]
                    risk = (5 if witnesses else 0) + (3 if method == "violence"
                                                      else 1)
                    with_what = (f"the {weapon}" if method == "violence"
                                 else "a doctored glass")
                    seen = ("unseen" if not witnesses else
                            f"{len(witnesses)} watching -- exposure is certain")
                    mark = " (your mark)" if victim.name == actor.target else ""
                    opts.append(Option(
                        key=f"strike:{method}:{victim.name}",
                        kind="strike",
                        label=f"Kill {_last(victim.name)} with {with_what}",
                        forecast=(f"The odds are {self._margin_label(margin)}"
                                  f"{mark}; {seen}."),
                        victim=victim.name, method=method, weapon=weapon,
                        margin=margin, will_succeed=(margin >= 1),
                        suspicion_risk=risk, witnessed=bool(witnesses),
                        is_target=(victim.name == actor.target)))

        # Arm yourself.
        if actor.carrying is None and room.weapon:
            opts.append(Option(
                key=f"arm:{room.weapon}", kind="arm",
                label=f"Take the {room.weapon}",
                forecast="Arm yourself; you cannot strike unarmed.",
                weapon=room.weapon))

        # Move freely through the locale.
        for dest in self.mansion.neighbors(actor.room,
                                           knows_passages=self._knows_passages(actor)):
            secret = dest not in room.exits
            opts.append(Option(
                key=f"move:{dest}", kind="passage" if secret else "move",
                label=(f"Slip through the hidden passage to the {dest}" if secret
                       else f"Go to the {dest}"),
                forecast=("Unseen. " if secret else "") +
                         self._describe_room(dest),
                dest=dest))

        # Bide your time.
        opts.append(Option(
            key="wait", kind="wait", label="Wait and watch",
            forecast=f"Hold in the {actor.room} and let the night come to you."))
        return opts

    def _describe_room(self, name: str) -> str:
        room = self.mansion.room(name)
        bits = []
        here = self._in_room(name)
        if here:
            bits.append("with " + ", ".join(_last(c.name) for c in here))
        if room.weapon:
            bits.append(f"the {room.weapon} lies here")
        if room.provides_poison:
            bits.append("glasses that could be doctored")
        if room.bodies:
            bits.append("a body")
        if room.lure:
            bits.append(room.lure)
        return ("; ".join(bits) + ".") if bits else "empty and quiet."

    # -- a single guest's turn -------------------------------------------
    def _take_turn(self, actor: Character) -> None:
        if not actor.alive or actor.caught:
            return
        options = self._options(actor)
        if not options:
            return
        choice = self.chooser.choose(self, actor, options)
        self._apply(actor, choice)

    def _apply(self, actor: Character, opt: Option) -> None:
        if opt.kind == "strike":
            victim = self.by_name[opt.victim]
            self._resolve_attempt(actor, victim, opt.method, opt.weapon,
                                  witnessed=opt.witnessed)
        elif opt.kind == "arm":
            room = self.mansion.room(actor.room)
            actor.carrying = room.weapon
            room.weapon = None
            self._log(type="arm", actor=actor.name, weapon=actor.carrying,
                      room=actor.room)
            self._remember(actor.name, 1, "own_arm", weapon=actor.carrying,
                           room=actor.room)
        elif opt.kind in ("move", "passage"):
            self._move(actor, opt.dest, secret=(opt.kind == "passage"))
        else:  # wait
            self._log(type="lurk", actor=actor.name, room=actor.room)

    # -- movement + observation ------------------------------------------
    def _move(self, actor: Character, dest: str, *, secret: bool = False) -> None:
        origin = actor.room
        # Those left behind see them go (unless they melt into a passage).
        for other in self._in_room(origin, exclude=actor.name):
            self._remember(other.name, 1, "saw_depart", who=actor.name,
                           to=(None if secret else dest))
        self.mansion.room(origin).occupants.remove(actor.name)
        actor.room = dest
        self.mansion.room(dest).occupants.append(actor.name)
        # Those already there see them arrive.
        for other in self._in_room(dest, exclude=actor.name):
            self._remember(other.name, 1, "saw_arrive", who=actor.name,
                           frm=(None if secret else origin))
        self._remember(actor.name, 1, "own_move", to=dest, secret=secret)
        self._log(type=("passage" if secret else "move"), actor=actor.name,
                  frm=origin, to=dest)
        # Stumble on the dead.
        for victim in self.mansion.room(dest).bodies:
            if victim not in self._discovered[actor.name]:
                self._discovered[actor.name].add(victim)
                self._remember(actor.name, 3, "found_body", victim=victim,
                               room=dest)
                self._log(type="discover", actor=actor.name, victim=victim,
                          room=dest)

    # -- resolving an attempt --------------------------------------------
    def _resolve_attempt(self, attacker: Character, target: Character,
                         method: str, weapon: str | None,
                         witnessed: bool) -> None:
        margin = self._attack_margin(attacker, target, method, weapon)
        room = self.mansion.room(attacker.room)
        weapon_name = weapon if method == "violence" else "a doctored glass"
        onlookers = [o for o in self._in_room(attacker.room, exclude=attacker.name)
                     if o is not target]

        if margin >= 1:
            # A kill -- the day's one death. Pre-determined by the margin.
            target.alive = False
            self.mansion.room(target.room).occupants.remove(target.name)
            room.bodies.append(target.name)
            self._discovered[attacker.name].add(target.name)
            if target.carrying:
                room.weapon = room.weapon or target.carrying
                target.carrying = None
            attacker.kills.append(target.name)

            if witnessed:
                attacker.suspicion += 5
            # Trace left behind is deterministic: violence is messy, poison is
            # quiet, and a skilled sneak leaves less of either.
            trace = 3 if method == "violence" else 1
            if attacker.skill("stealth") >= 4:
                trace -= 1
            attacker.suspicion += max(0, trace) + 1

            herring = self._red_herring(attacker, target)
            death = Death(self.day, target.name, attacker.name, attacker.room,
                          weapon_name, method, witnessed, herring)
            self.deaths.append(death)
            self.murder_today = death

            self._remember(attacker.name, 3, "own_kill", victim=target.name,
                           room=attacker.room, method=method, weapon=weapon_name)
            for o in onlookers:
                self._remember(o.name, 3, "witness_kill", culprit=attacker.name,
                               victim=target.name, room=attacker.room)
            self._log(type="kill", actor=attacker.name, victim=target.name,
                      room=attacker.room, weapon=weapon_name, method=method,
                      witnessed=witnessed,
                      avenged=(attacker.target == target.name))
        else:
            # A botch: the target lives, and now they know.
            attacker.suspicion += 5 if witnessed else 4
            self._remember(attacker.name, 3, "own_botch", victim=target.name,
                           room=attacker.room)
            self._remember(target.name, 3, "attacked", culprit=attacker.name,
                           room=attacker.room)
            for o in onlookers:
                self._remember(o.name, 3, "saw_botch", culprit=attacker.name,
                               victim=target.name, room=attacker.room)
            self._log(type="botch", actor=attacker.name, victim=target.name,
                      room=attacker.room, weapon=weapon_name, method=method,
                      witnessed=witnessed)
            self._flee(target, from_whom=attacker)

    def _flee(self, actor: Character, from_whom: Character) -> None:
        exits = self.mansion.neighbors(actor.room,
                                       knows_passages=self._knows_passages(actor))
        # Deterministic: run toward the most crowded room (safety in witnesses);
        # ties broken by room name so the same corner always plays out the same.
        dest = max(exits, key=lambda d: (len(self._in_room(d)), d))
        self._move(actor, dest, secret=False)
        self._log(type="flee", actor=actor.name, from_whom=from_whom.name,
                  to=dest)

    _HERRINGS = [
        "{patsy}'s handkerchief, dropped by the body",
        "a thread of fabric matching {patsy}'s coat",
        "{patsy} was heard quarrelling with the victim at dinner",
        "muddy footprints leading out into the drowned garden",
        "the grandfather clock stopped at the very minute of death",
    ]

    def _red_herring(self, attacker: Character, victim: Character) -> str:
        pool = [c for c in self._living() if c not in (attacker, victim)]
        if not pool:
            return "an unlatched window and the storm howling through it"
        # Deterministic pick: rotate by the day so successive murders point
        # different ways, but always the same way for the same murder.
        patsy = _last(pool[self.day % len(pool)].name)
        return self._HERRINGS[self.day % len(self._HERRINGS)].format(patsy=patsy)

    # -- night: exposure + memory ----------------------------------------
    def _resolve_exposure(self) -> None:
        living = self._living()
        if len(living) <= 2:
            return
        suspects = [c for c in living if c.suspicion >= EXPOSE_THRESHOLD]
        if not suspects:
            return
        suspects.sort(key=lambda c: (c.suspicion, len(c.kills)), reverse=True)
        culprit = suspects[0]
        culprit.caught = True
        culprit.exposed_secret = True
        if culprit.name in self.mansion.room(culprit.room).occupants:
            self.mansion.room(culprit.room).occupants.remove(culprit.name)
        for c in living:
            if c is not culprit:
                self._remember(c.name, 3, "unmasking", culprit=culprit.name)
        self._remember(culprit.name, 3, "unmasked_self")
        self._log(type="unmask", actor=culprit.name, room=culprit.room,
                  suspicion=culprit.suspicion, kills=list(culprit.kills))

    def _decay_suspicion(self) -> None:
        # Memory cools by a fixed step each night -- deterministic, so the same
        # night always reaches the same pitch of suspicion.
        for c in self._living():
            if c.suspicion > 0:
                c.suspicion -= 1

    def _remember(self, owner: str, salience: int, kind: str, **fields) -> None:
        self.memory[owner].append(dict(day=self.day, salience=salience,
                                       kind=kind, **fields))

    # -- main loop --------------------------------------------------------
    def run(self) -> GameResult:
        self._log(type="prologue")
        quiet = 0
        while self.day < self.max_days and len(self._living()) > 1:
            self.day += 1
            self.murder_today = None
            self._log(type="daybreak", day=self.day,
                      survivors=[c.name for c in self._living()])
            for _ in range(self.turns_per_day):
                # Fixed initiative order every day -> a stable, replayable night.
                living = {c.name for c in self._living()}
                order = [self.by_name[n] for n in self.initiative
                         if n in living]
                for actor in order:
                    if len(self._living()) <= 1:
                        break
                    self._take_turn(actor)
            victim = self.murder_today.victim if self.murder_today else None
            self._log(type="nightfall", day=self.day, victim=victim)
            self._resolve_exposure()
            self._decay_suspicion()
            if self.nightfall_hook is not None:
                self.nightfall_hook(self, self.day)
            quiet = 0 if self.murder_today else quiet + 1
            if quiet >= 3:
                break  # the scheming has burned out; the storm passes
        return self._finish()

    def _finish(self) -> GameResult:
        living = self._living()
        unmasked = [c.name for c in self.cast if c.caught]
        if len(living) == 1:
            w = living[0]
            avenged = any(d.culprit == w.name and d.victim == w.target
                          for d in self.deaths)
            verdict = (f"{w.name} walks out of Ravenhollow at dawn -- the sole "
                       f"guest still breathing and above suspicion"
                       + (", their business here finished." if avenged
                          else ", though their true quarry slipped their grasp."))
            self._log(type="reveal", winner=w.name)
            return self._result(w.name, verdict, [w.name], unmasked)
        if not living:
            self._log(type="reveal", winner=None)
            return self._result(None, "By the last dawn the manor is silent. No "
                                "one won Ravenhollow -- the house kept them all.",
                                [], unmasked)
        def score(c: Character):
            avenged = 1 if c.target in [d.victim for d in self.deaths
                                        if d.culprit == c.name] else 0
            # Deterministic tie-break by name so a draw always resolves the same.
            return (avenged, len(c.kills), -c.suspicion, c.name)
        best = max(living, key=score)
        names = ", ".join(c.name for c in living)
        verdict = (f"The storm breaks with {len(living)} still at large "
                   f"({names}). Of them, {best.name} leaves strongest and "
                   f"least-suspected -- the night, on balance, is theirs.")
        self._log(type="reveal", winner=best.name)
        return self._result(best.name, verdict, [c.name for c in living],
                            unmasked)

    def _result(self, winner, verdict, survivors, unmasked) -> GameResult:
        return GameResult(winner, verdict, self.deaths, self.events,
                          self.memory, survivors, unmasked, self.day, self.cast)

    def _log(self, **event) -> None:
        event["day"] = self.day
        self.events.append(event)
