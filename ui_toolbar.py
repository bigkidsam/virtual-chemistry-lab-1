import time
import numpy as np
import cv2

from config import (
    RIBBON_H,
    ICON_SIZE,
    TOOL_SPACING,
    SPAWN_COOLDOWN
)
from tools import load_tool_image, TOOLS
from objects import make_object

# Cooldown timer
last_spawn_time = 0

# Ribbon sections
SECTIONS = [
    {"name": "Tools",      "tools": ["flask", "beaker", "test_tube", "dropper"]},
    {"name": "Containers", "tools": [ "cylinder", "petri"]},
    {"name": "Heating",    "tools": ["burner"]},
    {"name": "Mixing",     "tools": ["rod", "spatula"]},
]

TOOL_MAP = {t["id"]: t for t in TOOLS}


# -----------------------------------------
#   Alpha Blending (RGBA over BGR)
# -----------------------------------------
def blend_icon(base, icon, x, y):
    h, w = icon.shape[:2]

    if x + w <= 0 or y + h <= 0 or x >= base.shape[1] or y >= base.shape[0]:
        return

    y1, y2 = max(0, y), min(base.shape[0], y + h)
    x1, x2 = max(0, x), min(base.shape[1], x + w)

    iy1 = y1 - y
    ix1 = x1 - x
    iy2 = iy1 + (y2 - y1)
    ix2 = ix1 + (x2 - x1)

    icon_crop = icon[iy1:iy2, ix1:ix2]
    alpha = icon_crop[:, :, 3] / 255.0
    alpha = alpha[:, :, None]

    base_region = base[y1:y2, x1:x2].astype(np.float32)

    blended = (1 - alpha) * base_region + alpha * icon_crop[:, :, :3]
    base[y1:y2, x1:x2] = blended.astype(np.uint8)


# -----------------------------------------
#   Draw Ribbon (MS Paint Style)
# -----------------------------------------
def draw_ribbon(W):
    ribbon = np.zeros((RIBBON_H, W, 3), dtype=np.uint8)
    ribbon[:] = (35, 35, 35)

    # Bottom shadow line
    cv2.line(ribbon, (0, RIBBON_H - 2), (W, RIBBON_H - 2), (70, 70, 70), 2)

    # 1️⃣ Compute total width of all groups
    section_blocks = []
    for sec in SECTIONS:
        icons_width = len(sec["tools"]) * (ICON_SIZE + TOOL_SPACING)
        block_width = 4 + icons_width + 15
        section_blocks.append((sec, block_width))

    total_width = sum(w for (_, w) in section_blocks)

    # Center ribbon
    x = (W - total_width) // 2
    y_icon = 22

    icon_positions = []

    # 2️⃣ Draw Groups
    for sec, block_width in section_blocks:

        # Group Name
        cv2.putText(ribbon, sec["name"], (x, 15),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (230,230,230), 1)

        x2 = x + 10  # offset for icons

        # Icons
        for tool_id in sec["tools"]:
            tool_info = TOOL_MAP[tool_id]

            img = load_tool_image(tool_id).resize((ICON_SIZE, ICON_SIZE))
            icon_np = np.array(img)

            blend_icon(ribbon, icon_np, x2, y_icon)

            cv2.rectangle(
                ribbon,
                (x2, y_icon),
                (x2 + ICON_SIZE, y_icon + ICON_SIZE),
                (200, 200, 200),
                1
            )

            icon_positions.append((x2, y_icon, tool_info))
            x2 += ICON_SIZE + TOOL_SPACING

        # Move to next section
        x += block_width

    return ribbon, icon_positions


# -----------------------------------------
#   Interaction
# -----------------------------------------
def handle_ribbon_interaction(detected_hands, W, H, icon_positions, world_objects):
    global last_spawn_time

    now = time.time()
    if now - last_spawn_time < SPAWN_COOLDOWN:
        return False

    for label, hand in detected_hands.items():
        ix, iy = int(hand["index"][0]), int(hand["index"][1])

        # Must be touching ribbon area
        if iy > RIBBON_H:
            continue

        # Check each icon
        for (x, y, tool_info) in icon_positions:
            if x <= ix <= x + ICON_SIZE and y <= iy <= y + ICON_SIZE:

                # Spawn tool exactly at center
                world_objects.append(
                    make_object(tool_info["id"], W // 2, int(H * 0.40))
                )

                last_spawn_time = now
                print(f"[SPAWN] {tool_info['name']}")
                return True

    return False
