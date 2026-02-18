import numpy as np
from utils import distance_sq

GRAB_RADIUS = 140 * 140  # bigger = easier grabbing


def try_grab(obj, hand, label):
    """
    Start grabbing an object.
    """
    obj["grabbed"] = True
    obj["grabbed_by"] = label
    obj["grabbed_by_hand"] = label
    obj["grab_offset"] = obj["pos"] - hand["wrist"]
    obj["grab_angle"] = obj["current_angle"] - hand["angle"]


def release(obj):
    """
    Release a grabbed object.
    """
    obj["grabbed"] = False
    obj["grabbed_by"] = None
    obj["grabbed_by_hand"] = None
    obj["grab_offset"] = np.array([0.0, 0.0], dtype=float)
    obj["grab_angle"] = 0.0


def update(hands, world_objects):
    """
    Main grab system update.
    """
    if not hands:
        return

    for label, hand in hands.items():
        pinch = hand["pinch"]

        # ---------- TRY GRAB ----------
        if pinch:
            for obj in world_objects:
                if obj.get("grabbed"):
                    continue

                if distance_sq(obj["pos"], hand["wrist"]) < GRAB_RADIUS:
                    try_grab(obj, hand, label)
                    break

        # ---------- UPDATE / RELEASE ----------
        for obj in world_objects:
            if not obj.get("grabbed"):
                continue
            if obj["grabbed_by"] != label:
                continue

            if not pinch:
                release(obj)
                continue

            # Smooth position follow
            target_pos = hand["wrist"] + obj["grab_offset"]
            obj["pos"] += (target_pos - obj["pos"]) * 0.35

            # Smooth rotation
            target_angle = hand["angle"] + obj["grab_angle"]
            obj["current_angle"] += (target_angle - obj["current_angle"]) * 0.25
