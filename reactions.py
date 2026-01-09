import numpy as np
from utils import clamp
from config import REACTION_DURATION, SMOKE_PARTICLES


def trigger_reaction(slot, now):
    """
    Starts a reaction inside a slot if multiple chemicals have been poured.

    This function:
    - Marks the slot as 'reaction active'
    - Stores reaction start time
    - Enables smoke, glow, and other effects (handled in main loop)
    """

    slot['reaction'] = {
        'start': now,
        'duration': REACTION_DURATION
    }

    slot['reaction_start'] = now

    # Reaction glow boost
    slot['glow'] = clamp(slot['glow'] + 0.3, 0.0, 1.0)

    print("[REACTION] Reaction triggered in slot!")
