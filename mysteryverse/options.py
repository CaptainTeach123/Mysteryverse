"""Options and outcomes -- the choose-your-own-adventure layer.

On any guest's turn the engine computes *every* move open to them and, for each,
a forecast of its outcome: the odds of a kill, the risk of being seen, where a
step would put them and who they'd be walking in on. A *chooser* then picks one.

Swap the chooser and the same machinery becomes a different game:

* ``AutoChooser``       -- the guest decides in character (the default sim).
* ``InteractiveChooser`` -- you decide, at a prompt, reading the forecasts.
* ``ScriptedChooser``    -- a fixed script, for tests and replays.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass
class Option:
    """One thing a guest could do this turn, with its forecast outcome."""

    key: str                       # stable id, e.g. "strike:poison:Silas Crane"
    kind: str                      # strike | arm | move | passage | wait
    label: str                     # short imperative, for menus
    forecast: str                  # what the guest can expect if they choose it

    # execution payload -------------------------------------------------
    victim: Optional[str] = None
    method: Optional[str] = None   # "violence" | "poison"
    weapon: Optional[str] = None
    dest: Optional[str] = None

    # decision inputs, surfaced for the CYOA menu -----------------------
    # The outcome is PRE-DETERMINED: a strike with a positive margin always
    # succeeds, one at zero or below always fails. No dice at play-time.
    margin: Optional[int] = None
    will_succeed: bool = False
    suspicion_risk: int = 0
    witnessed: bool = False
    is_target: bool = False

    def menu_line(self, index: int) -> str:
        return f"  [{index}] {self.label}\n        -> {self.forecast}"
