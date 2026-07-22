"""The seven chroniclers -- one per guest -- who journal each night.

Every surviving guest keeps a diary. At nightfall they set down what they *did*
and what they *saw that day* -- no more. Because a clean murder has no witness
but the murderer, most journals record only a body found and no idea whose hand
did it. Each is written in that guest's own voice, colored by their vices: the
drinkers lose hours, the zealot reads omens, the host trusts no one.

Pick a guest and read their chronicle and you get the night entirely through
their eyes -- partial, biased, and exactly as much as they could know.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Dict, List, Optional

from .characters import Character


def _last(name: str) -> str:
    parts = name.replace("Dr. ", "").replace("Lady ", "").replace(
        "Miss ", "").replace("Colonel ", "").replace("Mother ", "").split()
    return parts[-1]


_ORDINALS = ["zeroth", "first", "second", "third", "fourth", "fifth", "sixth",
             "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"]


def _ordinal(n: int) -> str:
    return _ORDINALS[n] if 0 <= n < len(_ORDINALS) else f"{n}th"


@dataclass
class VoiceProfile:
    name: str
    header: str                       # how they title a night's entry
    opener: str                       # first breath of the entry
    hazy: bool                        # drink/opiate -> lost hours
    kill: Callable[[dict], str]       # how they own a murder
    body: Callable[[dict], str]       # how they record finding the dead
    attacked: Callable[[dict], str]   # surviving an attempt on their life


# ---- the seven voices ---------------------------------------------------
VOICES: Dict[str, VoiceProfile] = {
    "Dr. Adrian Vell": VoiceProfile(
        name="Dr. Adrian Vell",
        header="From the case-notes of A. Vell",
        opener="I record the day's particulars, as is my habit.",
        hazy=True,  # the morphine takes its hours
        kill=lambda e: (f"I saw to it that {_last(e['victim'])} would trouble no "
                        f"one further -- a measured dose in the {e['room']}, no "
                        f"mess, no struggle. One does what the case requires."),
        body=lambda e: (f"I examined {_last(e['victim'])}'s body in the "
                        f"{e['room']}. Cause of death plain enough; the hand "
                        f"behind it is not my concern."),
        attacked=lambda e: (f"{_last(e['culprit'])} made an attempt on me in the "
                            f"{e['room']}. Clumsy. I shall be watching them now."),
    ),
    "Miss Isolde Frayne": VoiceProfile(
        name="Miss Isolde Frayne",
        header="Isolde's diary",
        opener="Dearest diary -- another day of smiles I did not mean.",
        hazy=False,
        kill=lambda e: (f"I did for {_last(e['victim'])} in the {e['room']}. For "
                        f"my sister. My hands did not so much as tremble, and my "
                        f"face gave nothing away."),
        body=lambda e: (f"I found {_last(e['victim'])} dead in the {e['room']}. I "
                        f"arranged my expression into horror before anyone "
                        f"looked. I have no notion who did it."),
        attacked=lambda e: (f"{_last(e['culprit'])} tried to kill me in the "
                            f"{e['room']} -- and ruined my composure, the brute. "
                            f"I know their face now."),
    ),
    "Colonel Roderick Mace": VoiceProfile(
        name="Colonel Roderick Mace",
        header="Mace. Field notes",
        opener="Keeping a record. Old habit from the service.",
        hazy=True,  # the drink takes its hours
        kill=lambda e: (f"Cornered {_last(e['victim'])} in the {e['room']} and "
                        f"finished it. Soldier's work. Did not linger."),
        body=lambda e: (f"Found {_last(e['victim'])} dead in the {e['room']}. "
                        f"Someone got there ahead of me. Good luck to them."),
        attacked=lambda e: (f"{_last(e['culprit'])} came at me in the {e['room']}. "
                            f"They will not get a second chance. Damn them."),
    ),
    "Silas Crane": VoiceProfile(
        name="Silas Crane",
        header="S.C. -- private",
        opener="Writing this with the door bolted. My hands won't keep still.",
        hazy=False,
        kill=lambda e: (f"God forgive me, I killed {_last(e['victim'])} in the "
                        f"{e['room']}. It was them or me. I only want to leave "
                        f"this cursed house alive."),
        body=lambda e: (f"I found {_last(e['victim'])} dead in the {e['room']} "
                        f"and near cried out. Who is doing this? I want to go "
                        f"home."),
        attacked=lambda e: (f"{_last(e['culprit'])} tried to do me in the "
                            f"{e['room']}. I nearly died. I have to get them "
                            f"first now, God help me."),
    ),
    "Lady Bianca Ashford": VoiceProfile(
        name="Lady Bianca Ashford",
        header="Lady Ashford's journal",
        opener="One keeps a journal so that history has the correct account.",
        hazy=False,
        kill=lambda e: (f"{_last(e['victim'])} has been dealt with in the "
                        f"{e['room']}. Distasteful work, but the estate does not "
                        f"inherit itself, and physicians do talk."),
        body=lambda e: (f"I discovered {_last(e['victim'])} quite dead in the "
                        f"{e['room']}. How very inconsiderate of someone. I "
                        f"summoned no one; why should I?"),
        attacked=lambda e: (f"That creature {_last(e['culprit'])} dared raise a "
                            f"hand to me in the {e['room']}. They will regret "
                            f"living long enough to try."),
    ),
    "Cornelius Blackwood": VoiceProfile(
        name="Cornelius Blackwood",
        header="The host's ledger",
        opener="My house. My night. I note who moves, and how.",
        hazy=False,
        kill=lambda e: (f"{_last(e['victim'])} joined the manor's older ghosts "
                        f"today, in the {e['room']}. They should not have "
                        f"accepted my invitation."),
        body=lambda e: (f"{_last(e['victim'])} lies dead in the {e['room']}. One "
                        f"fewer beneath my roof. I trust none of those who "
                        f"remain."),
        attacked=lambda e: (f"{_last(e['culprit'])} moved against me in the "
                            f"{e['room']}. In my own house. I know the passages "
                            f"they do not; that was their only mistake, and their "
                            f"last free one."),
    ),
    "Mother Genevieve": VoiceProfile(
        name="Mother Genevieve",
        header="Night office of G.",
        opener="I set down the day before prayers, that nothing be forgotten.",
        hazy=False,
        kill=lambda e: (f"The Lord's mercy is sometimes hemlock. I delivered "
                        f"{_last(e['victim'])} from a life past saving, in the "
                        f"{e['room']}, and I do not repent it."),
        body=lambda e: (f"I found {_last(e['victim'])} gone from this world in "
                        f"the {e['room']}. I crossed myself, and I said nothing "
                        f"to the others. Judgment is coming to this house."),
        attacked=lambda e: (f"{_last(e['culprit'])} raised a hand against me in "
                            f"the {e['room']}. So even the wolves sense the "
                            f"shepherd. I am not afraid."),
    ),
}


def _movement_summary(entries: List[dict]) -> Optional[str]:
    """Fold the day's comings and goings into one voiced-neutral line."""
    seen = []
    for e in entries:
        if e["kind"] == "saw_arrive":
            seen.append(f"{_last(e['who'])} appeared" +
                        (f" from the {e['frm']}" if e.get("frm") else
                         " from nowhere I could see"))
        elif e["kind"] == "saw_depart":
            seen.append(f"{_last(e['who'])} slipped off" +
                        (f" toward the {e['to']}" if e.get("to") else
                         " and simply vanished"))
    if not seen:
        return None
    # De-dup while preserving order, keep it short.
    uniq = list(dict.fromkeys(seen))[:4]
    return "Comings and goings: " + "; ".join(uniq) + "."


def _entry_line(profile: VoiceProfile, e: dict) -> Optional[str]:
    kind = e["kind"]
    if kind == "own_kill":
        return profile.kill(e)
    if kind == "found_body":
        return profile.body(e)
    if kind == "attacked":
        return profile.attacked(e)
    if kind == "witness_kill":
        return (f"I saw it done with my own eyes: {_last(e['culprit'])} killed "
                f"{_last(e['victim'])} in the {e['room']}. I will not forget the "
                f"sight, whatever I say aloud.")
    if kind == "saw_botch":
        return (f"I watched {_last(e['culprit'])} lunge at {_last(e['victim'])} "
                f"in the {e['room']} and fail. Their mask is off, to me at "
                f"least.")
    if kind == "own_botch":
        return (f"I moved on {_last(e['victim'])} in the {e['room']} and it went "
                f"wrong. They live, and worse, they saw me. I must be quicker "
                f"and cleverer than that.")
    if kind == "unmasking":
        return (f"Tonight the household turned on {_last(e['culprit'])}. Too much "
                f"blood pointed their way. They are seized and locked away.")
    if kind == "unmasked_self":
        return ("They have turned on me. They believe they know. My part in "
                "this night is finished, behind a bolted door.")
    return None


def render_day_entry(name: str, memory: List[dict], day: int,
                     cast: List[Character]) -> str:
    """One guest's journal for a single day (their end-of-day write-up)."""
    profile = VOICES[name]
    todays = [e for e in memory if e["day"] == day]
    by = {c.name: c for c in cast}
    me = by[name]

    lines = [f"  {profile.header} -- night of the {_ordinal(day)} day",
             f"    {profile.opener}"]

    highs = [e for e in todays if e["salience"] >= 3]
    body = [_entry_line(profile, e) for e in highs]
    body = [b for b in body if b]

    if body:
        for b in body:
            lines.append("    " + b)
    else:
        # Nothing they'd call momentous.
        if profile.hazy and len([e for e in todays if e["kind"].startswith("saw")]) >= 3:
            lines.append("    Much of today is a fog to me -- I had been "
                         "indulging, and the hours ran together.")
        else:
            lines.append("    A quiet day, for this house. I kept my counsel and "
                         "my distance.")

    move = _movement_summary(todays)
    if move and (body or not profile.hazy):
        lines.append("    " + move)

    # The epilogue tag belongs only on their very last entry.
    recorded_days = [e["day"] for e in memory if e["day"] >= 1]
    is_final_entry = bool(recorded_days) and day == max(recorded_days)
    if is_final_entry:
        if not me.alive:
            lines.append("    [This is the last thing they ever wrote.]")
        elif me.caught:
            lines.append("    [The entry ends mid-sentence.]")
    return "\n".join(lines)


def render_chronicle(name: str, result) -> str:
    """A guest's full chronicle across every night they lived to write."""
    if name not in VOICES:
        raise KeyError(f"No such guest: {name!r}")
    by = {c.name: c for c in result.cast}
    me = by[name]
    memory = result.memory[name]
    days = sorted({e["day"] for e in memory if e["day"] >= 1})

    out = ["=" * 70,
           f"  THE CHRONICLE OF {name.upper()}",
           f"  ({me.title}) -- the night at Ravenhollow, in their own words",
           "=" * 70]
    if not days:
        out.append("  (They wrote nothing worth keeping.)")
    for d in days:
        out.append("")
        out.append(render_day_entry(name, memory, d, result.cast))

    # A closing note on their fate, from outside the diary.
    out.append("")
    out.append("-" * 70)
    if me.name == result.winner:
        out.append(f"  {_last(name)} walked out of Ravenhollow alive. Whether "
                   f"the diary tells the whole truth is another matter.")
    elif not me.alive:
        killer = next((d.culprit for d in result.deaths if d.victim == name),
                      None)
        out.append(f"  {_last(name)}'s diary ends because {_last(name)} died. "
                   + (f"The hand was {_last(killer)}'s -- a thing "
                      f"{_last(name)} never knew." if killer else ""))
    elif me.caught:
        out.append(f"  {_last(name)} was unmasked and undone. The diary was "
                   f"found in their room.")
    else:
        out.append(f"  {_last(name)} survived the night, one of several left "
                   f"standing when the storm broke.")
    return "\n".join(out)
