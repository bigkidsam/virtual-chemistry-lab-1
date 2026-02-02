def update(world_objects, dt, ensure_burner_fields):
    """
    Handles non-gravity motion:
    - angular damping
    - rotation update
    - grabbed-object damping
    - burner field initialization
    """

    for obj in world_objects:
        if not obj.get("active", True):
            continue

        # Ensure burner animation fields exist
        ensure_burner_fields(obj)

        # If grabbed, stop linear velocity and damp rotation
        if obj.get("grabbed", False):
            obj["vel"] *= 0.0
            obj["angular_vel"] *= 0.94

        # Global angular damping
        obj["angular_vel"] *= 0.96

        # Apply rotation
        obj["current_angle"] += obj["angular_vel"] * dt * 60.0
