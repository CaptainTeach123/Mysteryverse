"""The god's-eye story: the whole night, day by day, as it truly happened.

This is the omniscient account -- unlike the guests' chronicles, it hides
nothing. Use it to see how the schemes actually collided.
"""

from __future__ import annotations

from typing import List

from .engine import GameResult
from .characters import Character


def _last(name: str) -> str:
    parts = name.replace("Dr. ", "").replace("Lady ", "").replace(
        "Miss ", "").replace("Colonel ", "").replace("Mother ", "").split()
    return parts[-1]


def render_dossier(cast: List[Character]) -> str:
    lines = ["=" * 70,
             "  RAVENHOLLOW MANOR -- THE GUEST LIST",
             "=" * 70,
             "",
             "  A storm has taken the bridge and the telephone line. The seven",
             "  who accepted the invitation will not all see the last morning.",
             "  Each came with a reason, and a rule they all understand:",
             "  no more than one of them dies on any given day.",
             ""]
    for c in cast:
        top = sorted(c.skills.items(), key=lambda kv: kv[1], reverse=True)[:2]
        skills = ", ".join(f"{k} {v}" for k, v in top)
        lines += [
            f"  {c.name} -- {c.title}",
            f"      skills : {skills}",
            f"      vices  : {', '.join(c.vices)}",
            f"      wants  : {_last(c.target)} dead",
            f"      why    : {c.motive}",
            "",
        ]
    return "\n".join(lines)


_ORD = ["", "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh",
        "Eighth", "Ninth", "Tenth", "Eleventh", "Twelfth"]


def render_story(result: GameResult) -> str:
    out: List[str] = []
    for ev in result.events:
        t = ev["type"]
        if t == "prologue":
            out.append("\n" + "-" * 70)
            out.append("  DUSK, THE FIRST EVENING. The guests gather in the "
                       "Foyer; the lamps are lit.")
            out.append("-" * 70)
        elif t == "daybreak":
            d = ev["day"]
            label = _ORD[d] if d < len(_ORD) else f"{d}th"
            out.append(f"\n  === The {label} Day ===")
        elif t == "nightfall":
            if ev.get("victim"):
                out.append(f"    Night falls. {_last(ev['victim'])} will not see "
                           f"morning.")
            else:
                out.append("    Night falls, and for once no one has died.")
        else:
            line = _render_event(ev)
            if line:
                out.append("    " + line)

    out.append("\n" + "=" * 70)
    out.append("  BY THE LAST MORNING")
    out.append("=" * 70)
    out.append("  " + result.verdict)

    if result.deaths:
        out.append("")
        out.append("  The dead, and who truly did it:")
        for d in result.deaths:
            how = "poisoned" if d.method == "poison" else "struck down"
            out.append(f"    - Day {d.day}: {d.victim}, {how} in the {d.room}.")
            out.append(f"        the house blamed: {d.red_herring}")
            out.append(f"        the truth: {d.culprit} did it"
                       + (" -- in front of witnesses." if d.witnessed else
                          ", and no one saw."))
    if result.unmasked:
        out.append("")
        out.append("  Unmasked and undone (to be caught is its own kind of "
                   "death):")
        for name in result.unmasked:
            out.append(f"    - {name}")
    return "\n".join(out)


def _render_event(ev: dict) -> str:
    t = ev["type"]
    if t == "arm":
        return f"{_last(ev['actor'])} palms the {ev['weapon']} in the {ev['room']}."
    if t == "flee":
        return (f"{_last(ev['actor'])}, sensing {_last(ev['from_whom'])} at their "
                f"back, breaks for the {ev['to']}.")
    if t == "passage":
        return (f"{_last(ev['actor'])} steps into a panel in the {ev['frm']} and "
                f"out into the {ev['to']} -- a way only the host knows.")
    if t == "discover":
        return (f"{_last(ev['actor'])} enters the {ev['room']} and finds "
                f"{_last(ev['victim'])}'s body.")
    if t == "kill":
        how = ("presses a doctored glass on them" if ev["method"] == "poison"
               else f"uses the {ev['weapon']}")
        tail = ""
        if ev.get("witnessed"):
            tail = " -- and others see it done"
        elif ev.get("avenged"):
            tail = " -- the debt, at last, paid"
        return (f"** In the {ev['room']}, {_last(ev['actor'])} catches "
                f"{_last(ev['victim'])} alone and {how}. {_last(ev['victim'])} "
                f"does not rise{tail}.")
    if t == "botch":
        seen = " in full view" if ev.get("witnessed") else ""
        return (f"!! {_last(ev['actor'])} lunges at {_last(ev['victim'])} in the "
                f"{ev['room']} and fails{seen}. Now {_last(ev['victim'])} knows.")
    if t == "unmask":
        return (f">> The household turns on {_last(ev['actor'])} -- too much "
                f"blood, too many coincidences. They are seized and locked away.")
    return ""
