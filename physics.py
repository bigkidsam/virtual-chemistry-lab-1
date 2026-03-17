import numpy as np
from config import GRAVITY, GROUND_DAMPING, BASE_SIZE 





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
        
        
            
    # half_size = (BASE_SIZE * obj.get("scale",1.0))/2.0
    # if obj['pos'][1] + half_size > floor_y:
    #     obj['pos'][1] = floor_y - half_size 
    
    
    
    
    #     if abs(obj['vel'][1]) > 50:
    #         obj['vel'][1] = -obj['vel'][1] * GROUND_DAMPING
    
    #     else:
    #         obj['vel'][1] = 0.0


        # Update position
        obj['pos'] += obj['vel'] * dt

        # Floor collision detection (use object bottom)
        half_size = obj.get("_render_size", BASE_SIZE) / 2.0
        if obj['pos'][1] + half_size > floor_y:
            obj['pos'][1] = floor_y - half_size

            # Bounce with damping
            if abs(obj['vel'][1]) > 50:
                obj['vel'][1] = -obj['vel'][1] * GROUND_DAMPING
            else:
                # Stop moving after small bounces
                obj['vel'][1] = 0.0
