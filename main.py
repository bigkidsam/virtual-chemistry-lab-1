import argparse
import os
import time
import math
from collections import deque

import cv2
import mediapipe as mp
import numpy as np
from PIL import Image

from config import (
    BASE_SIZE,
    SLOT_COUNT,
    SLOT_H,
    SLOT_SPACING,
    SLOT_W,
    SLOT_Y,
    HEAT_MULTIPLIER,
)
from lab_platform import create_slots
from objects import make_object
from reactions import blend_reaction_contents, trigger_reaction
from render.renderer import (
    render_burner_flames,
    render_particles,
    render_platform_base,
    render_slots,
    render_toolbar,
    render_world,
)
from systems.grab_system import update as grab_update
from systems.motion_system import update as motion_update
from systems.particle_systems import spawn_smoke, update as particle_update
from systems.physics_system import update as physics_update
from ui_toolbar import draw_ribbon, handle_ribbon_interaction
from utils import distance

WINDOW_NAME = "Virtual Chemistry Lab-1"


def parse_args():
    parser = argparse.ArgumentParser(description="Virtual Chemistry Lab")
    parser.add_argument(
        "--camera-index",
        type=int,
        default=-1,
        help="Camera index to use. Use -1 to auto-detect from 0..5.",
    )
    parser.add_argument(
        "--windowed",
        action="store_true",
        help="Run in windowed mode instead of fullscreen.",
    )
    return parser.parse_args()


def create_hand_tracker():
    mp_hands = mp.solutions.hands
    tracker = mp_hands.Hands(
        max_num_hands=2,
        min_detection_confidence=0.65,
        min_tracking_confidence=0.5,
    )
    return mp_hands, tracker


def open_camera(camera_index):
    if camera_index >= 0:
        cap = cv2.VideoCapture(camera_index)
        if not cap.isOpened():
            raise RuntimeError(f"Camera index {camera_index} could not be opened")
        return cap

    for i in range(6):
        cam = cv2.VideoCapture(i)
        if cam.isOpened():
            return cam

    raise RuntimeError("No camera found")


def setup_window(windowed=False):
    cv2.namedWindow(WINDOW_NAME, cv2.WINDOW_NORMAL)
    if not windowed:
        cv2.setWindowProperty(WINDOW_NAME, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)


def load_frames(folder, prefix, max_count=200):
    frames = []
    for i in range(1, max_count):
        path = os.path.join(folder, f"{prefix}_{i:02d}.png")
        if not os.path.exists(path):
            break
        frames.append(Image.open(path).convert("RGBA"))
    return frames


def ensure_burner_fields(obj, flame_frames):
    if obj.get("type") != "burner":
        return
    if "flame_frames" not in obj:
        obj["flame_frames"] = flame_frames
        obj["flame_index"] = 0
        obj["flame_timer"] = 0.0
        obj["flame_on"] = False


def compute_slot_positions(slots, width, height):
    center_x = width // 2
    base_y = int(height * SLOT_Y) if SLOT_Y < 1.0 else min(height - 150, int(SLOT_Y))
    left = center_x - ((SLOT_COUNT - 1) * SLOT_SPACING) // 2
    for i, slot in enumerate(slots):
        slot["pos"] = np.array([left + i * SLOT_SPACING, base_y], float)


def assign_objects_to_slots(world_objects, slots):
    for slot in slots:
        slot["occupied_by"] = None

    for obj in world_objects:
        if obj.get("grabbed"):
            continue

        ox, oy = obj["pos"]
        for slot in slots:
            sx, sy = slot["pos"]
            if abs(ox - sx) <= SLOT_W * 0.45 and abs(oy - sy) <= SLOT_H * 0.6:
                slot["occupied_by"] = obj
                break


def update_slot_contents(slots):
    for slot in slots:
        obj = slot.get("occupied_by")
        obj_ref = id(obj) if obj is not None else None

        if obj is None:
            slot["last_object_id"] = None
            continue

        if slot.get("last_object_id") == obj_ref:
            continue

        slot["last_object_id"] = obj_ref
        if obj.get("type") not in {"flask", "beaker", "test_tube"}:
            continue

        liquid_vol = float(obj.get("liquid_vol", 0.0))
        if liquid_vol <= 0.0:
            continue

        pour_vol = min(120.0, liquid_vol)
        obj["liquid_vol"] = max(0.0, liquid_vol - pour_vol)
        color = tuple(int(v) for v in obj.get("liquid_color", (120, 120, 255)))

        slot.setdefault("contents", []).append(
            {
                "id": obj.get("type"),
                "color": color,
                "vol": pour_vol,
            }
        )


def spawn_reaction_smoke(slots, particles):
    for slot in slots:
        reaction = slot.get("reaction")
        if not reaction:
            continue

        sx, sy = slot["pos"]
        spawn_smoke(
            particles,
            sx,
            sy - SLOT_H // 2 - 20,
            count=max(1, int(reaction.get("gas_rate", 2) // 2)),
        )


def update_slot_state(slots, world_objects, now):
    for slot in slots:
        slot["glow"] = max(0.12, slot.get("glow", 0.12) * 0.96)

        obj = slot.get("occupied_by")
        if obj is None:
            slot["heated_since"] = None
            continue

        slot["glow"] = min(1.0, slot["glow"] + 0.02)

        is_container = obj.get("type") in {"flask", "beaker", "test_tube"}
        if not is_container:
            slot["heated_since"] = None
            continue

        hot = False
        for burner in world_objects:
            if burner.get("type") != "burner" or not burner.get("flame_on"):
                continue
            bx, by = burner["pos"]
            sx, sy = slot["pos"]
            if abs(bx - sx) < SLOT_W * 0.45 and 0 < sy - by < SLOT_H * 1.2:
                hot = True
                break

        if hot:
            if slot.get("heated_since") is None:
                slot["heated_since"] = now
            heat_time = (now - slot["heated_since"]) * HEAT_MULTIPLIER
            slot["glow"] = min(1.0, slot["glow"] + 0.04)
            if heat_time > 1.8 and slot.get("reaction") is None:
                trigger_reaction(slot, now)

        if slot.get("reaction"):
            blend_reaction_contents(slot, mix_strength=0.08)
        else:
            slot["heated_since"] = None


def update_reaction_decay(slots, now):
    for slot in slots:
        reaction = slot.get("reaction")
        if not reaction:
            continue
        if now - reaction["start"] > reaction["duration"]:
            slot["reaction"] = None
            slot["reaction_result"] = None
            slot["glow"] = 0.25


def run_lab(camera_index=-1, windowed=False):
    mp_hands, hands_module = create_hand_tracker()
    setup_window(windowed=windowed)
    cap = open_camera(camera_index)

    flame_frames = load_frames("tool_images/flame_frames", "flame", 300)

    world_objects = [
        make_object("flask", 300, 220),
        make_object("flask", 600, 220),
    ]
    slot_states = create_slots()
    particles = []
    hand_buffers = {"Left": deque(maxlen=5), "Right": deque(maxlen=5)}
    prev_time = time.time()

    try:
        while True:
            now = time.time()
            dt = now - prev_time
            prev_time = now
            if dt <= 0 or dt > 0.3:
                dt = 1 / 60

            ok, frame = cap.read()
            if not ok:
                continue

            frame = cv2.flip(frame, 1)
            height, width = frame.shape[:2]
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            compute_slot_positions(slot_states, width, height)

            for obj in world_objects:
                if obj.get("type") == "burner" and obj.get("flame_on"):
                    spawn_smoke(
                        particles,
                        obj["pos"][0],
                        obj["pos"][1] - BASE_SIZE // 2 - 30,
                        count=2,
                    )

            detected_hands = {}
            results = hands_module.process(rgb)

            if results.multi_hand_landmarks:
                for lm, hd in zip(results.multi_hand_landmarks, results.multi_handedness):
                    label = hd.classification[0].label
                    wrist = lm.landmark[mp_hands.HandLandmark.WRIST]
                    index = lm.landmark[mp_hands.HandLandmark.INDEX_FINGER_TIP]
                    thumb = lm.landmark[mp_hands.HandLandmark.THUMB_TIP]
                    mcp = lm.landmark[mp_hands.HandLandmark.INDEX_FINGER_MCP]

                    wrist_px = np.array([wrist.x * width, wrist.y * height])
                    index_px = np.array([index.x * width, index.y * height])
                    thumb_px = np.array([thumb.x * width, thumb.y * height])
                    mcp_px = np.array([mcp.x * width, mcp.y * height])

                    hand_buffers[label].append(wrist_px)
                    smooth_wrist = np.mean(hand_buffers[label], axis=0)

                    detected_hands[label] = {
                        "wrist": smooth_wrist,
                        "index": index_px,
                        "pinch": distance(index_px, thumb_px) < 40,
                        "angle": math.atan2(
                            mcp_px[1] - wrist_px[1],
                            mcp_px[0] - wrist_px[0],
                        ),
                    }

            toolbar, icon_positions = draw_ribbon(width)
            handle_ribbon_interaction(detected_hands, width, height, icon_positions, world_objects)

            floor_y = height - 80
            grab_update(detected_hands, world_objects)
            physics_update(world_objects, dt, floor_y)
            motion_update(world_objects, dt, lambda obj: ensure_burner_fields(obj, flame_frames))

            for obj in world_objects:
                if obj.get("type") == "burner" and not obj.get("grabbed", False):
                    obj["flame_on"] = True

            assign_objects_to_slots(world_objects, slot_states)
            update_slot_contents(slot_states)
            update_slot_state(slot_states, world_objects, now)
            spawn_reaction_smoke(slot_states, particles)
            update_reaction_decay(slot_states, now)
            particle_update(particles, dt)

            out = render_world(frame, world_objects, BASE_SIZE)
            out = render_platform_base(out, height)
            out = render_slots(out, slot_states, SLOT_W, SLOT_H)
            out = render_toolbar(out, toolbar)
            out = render_burner_flames(out, world_objects, dt, BASE_SIZE)
            out = render_particles(out, particles)

            active = [slot.get("reaction") for slot in slot_states if slot.get("reaction")]
            cv2.putText(
                out,
                f"Active reactions: {len(active)}",
                (20, height - 20),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.65,
                (240, 240, 240),
                2,
            )
            if active:
                cv2.putText(
                    out,
                    active[0]["name"],
                    (20, height - 48),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.62,
                    (140, 220, 255),
                    2,
                )

            cv2.imshow(WINDOW_NAME, out)
            if cv2.waitKey(1) & 0xFF == 27:
                break

    finally:
        cap.release()
        cv2.destroyAllWindows()
        hands_module.close()


def main():
    args = parse_args()
    run_lab(camera_index=args.camera_index, windowed=args.windowed)


if __name__ == "__main__":
    main()
