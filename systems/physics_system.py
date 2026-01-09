from physics import apply_gravity

def update(world_objects, dt, floor_y):
    for obj in world_objects:
        if not obj.get("active", True):
            continue
        apply_gravity(obj, dt, floor_y)
