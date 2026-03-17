import time
import numpy as np
import cv2

from config import (
    ICON_SIZE,
    TOOL_SPACING,
    SPAWN_COOLDOWN
)
from tools import load_tool_image, TOOLS
from ui_panels import draw_rounded_rect, draw_alpha_rounded_rect

# Cooldown timer
last_spawn_time = 0

# Just a flat Tools list like the image
SECTIONS = [
    {"name": "Tools", "tools": ["beaker", "burner", "petri", "dropper"]},
]

TOOL_MAP = {t["id"]: t for t in TOOLS}

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


def draw_toolbar_bottom(out, W, H):
    """Draws the dark glossy Toolbar at the bottom, mimicking the mockup."""
    toolbar_w = 480
    toolbar_h = 100
    x = (W - toolbar_w) // 2
    y = H - toolbar_h - 20
    
    # Title "Tools" sitting right on top margin
    title = "Tools"
    (tw, th), _ = cv2.getTextSize(title, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
    cv2.putText(out, title, (x + (toolbar_w - tw)//2, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    cv2.line(out, (x, y - 15), (x + (toolbar_w - tw)//2 - 10, y - 15), (100, 100, 100), 2)
    cv2.line(out, (x + (toolbar_w + tw)//2 + 10, y - 15), (x + toolbar_w, y - 15), (100, 100, 100), 2)
    
    icon_positions = []
    
    # Calculate spacing
    sec = SECTIONS[0]
    total_tools = len(sec["tools"])
    total_icons_width = total_tools * ICON_SIZE + (total_tools - 1) * 30
    start_x = x + (toolbar_w - total_icons_width) // 2
    
    ix = start_x
    iy = y + 10
    
    for tool_id in sec["tools"]:
        tool_info = TOOL_MAP[tool_id]
        
        # Tool card
        draw_rounded_rect(out, (ix - 10, iy - 10), (ix + ICON_SIZE + 10, iy + ICON_SIZE + 35), (20, 15, 10), fill=True, radius=5)
        draw_rounded_rect(out, (ix - 10, iy - 10), (ix + ICON_SIZE + 10, iy + ICON_SIZE + 35), (80, 50, 30), thickness=1, radius=5)

        img = load_tool_image(tool_id).resize((ICON_SIZE, ICON_SIZE))
        icon_np = np.array(img)

        blend_icon(out, icon_np, ix, iy)
        
        # Label underneath
        label = tool_info["name"]
        (lw, lh), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.4, 1)
        lx = ix + (ICON_SIZE - lw) // 2
        cv2.putText(out, label, (lx, iy + ICON_SIZE + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1)

        icon_positions.append((ix - 10, iy - 10, ICON_SIZE + 20, ICON_SIZE + 45, tool_info))
        ix += ICON_SIZE + 30

    return out, icon_positions


def handle_ribbon_interaction(detected_hands, W, H, icon_positions, world_objects):
    """Check clicks for bottom toolbar."""
    from objects import make_object
    global last_spawn_time

    now = time.time()
    if now - last_spawn_time < SPAWN_COOLDOWN:
        return False

    for label, hand in detected_hands.items():
        hx, hy = int(hand["index"][0]), int(hand["index"][1])

        # Check each icon card
        for (rx, ry, rw, rh, tool_info) in icon_positions:
            if rx <= hx <= rx + rw and ry <= hy <= ry + rh:
                # Spawn tool exactly at center
                world_objects.append(
                    make_object(tool_info["id"], W // 2, int(H * 0.40))
                )
                last_spawn_time = now
                print(f"[UI] Spawned {tool_info['name']}")
                return True

    return False
