import numpy as np
from config import GRAVITY, GROUND_DAMPING


def apply_gravity(obj, dt, floor_y):
    """
    Applies simple physics to any world object:
    - gravity when not grabbed
    - bounce when hitting the floor
    - damping to reduce infinite bouncing

    Parameters:
        obj      → object dictionary (pos, vel, grabbed, etc.)
        dt       → delta time
        floor_y  → Y coordinate of the ground level
    """

    # Only apply gravity if not being held by hand
    if not obj['grabbed']:
        # Apply downward velocity
        obj['vel'][1] += GRAVITY * dt

        # Update position
        obj['pos'] += obj['vel'] * dt

        # Floor collision detection
        if obj['pos'][1] > floor_y:
            obj['pos'][1] = floor_y

            # Bounce with damping
            if abs(obj['vel'][1]) > 50:
                obj['vel'][1] = -obj['vel'][1] * GROUND_DAMPING
            else:
                # Stop moving after small bounces
                obj['vel'][1] = 0.0
