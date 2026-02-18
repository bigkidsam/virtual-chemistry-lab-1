import numpy as np
from config import SLOT_COUNT, SLOT_W, SLOT_H


def create_slots():
    """
    Creates the reaction platform slot system.

    Each slot stores:
    - position on screen (updated dynamically in main.py)
    - reference to object placed inside (flask/tool)
    - chemical contents (list of poured liquids)
    - tool placed (burner, rack, rod, etc.)
    - glow intensity for highlighting when hand is near
    - smoke particles for reaction effects
    - reaction state + reaction start time

    Returns:
        List of SLOT_COUNT slot dictionaries.
    """

    slots = []

    for _ in range(SLOT_COUNT):
        slots.append({
            'pos': np.array([0.0, 0.0]),     # (x,y) set every frame in main.py
            'occupied_by': None,             # world object placed in the slot
            'contents': [],                  # [{'color': (r,g,b), 'vol': float}]
            'tool': None,                    # tool ID like "burner", "rack", etc.
            'reaction': None,                # reaction dict or None
            'reaction_start': 0.0,           # timestamp of reaction start
            'reaction_result': None,         # recipe output metadata
            'heated_since': None,            # when slot became actively heated
            'last_object_id': None,          # for detecting new pours into slot
            'glow': 0.9,                     # for highlighting
            'smoke_particles': [],           # smoke & vapor effects
        })

    return slots
