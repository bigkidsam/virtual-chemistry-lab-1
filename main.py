"""
Updated main.py for Virtual Chemistry Lab
- Physics extracted to physics_system
- Indentation and logic fixed
- Behavior unchanged
"""

import os
import time
import math
from collections import deque
import numpy as np

import cv2
from PIL import Image, ImageDraw
import mediapipe as mp
import core.asset_manager
print(core.asset_manager.__file__)


from config import (
    BASE_SIZE,
    SLOT_COUNT,
    SLOT_H,
    SLOT_SPACING,
    SLOT_W,
    SLOT_Y,
)

from core.asset_manager import AssetManager
from lab_platform import create_slots
from objects import make_object
from render.renderer import(
    render_burner_flames,
    render_particles,
    render_platform_base,
    render_slots,
    render_toolbar,
    render_world,
    render_dashboard,
)

from systems.grab_system import update as grab_update
from systems.motion_system import update as motion_update
from systems.particle_systems import spawn_smoke, update as particle_update
from systems.physics_system import update as physics_update
from ui_toolbar import draw_ribbon, handle_ribbon_interaction      
from utils import distance  



assets = AssetManager()
assets.load_tool_images()
assets.load_flame_frames()
assets.load_desk()





# -------------------------------------------------
# Global state
# -------------------------------------------------



# -------------------------------------------------
# MediaPipe
# -------------------------------------------------
mp_hands = mp.solutions.hands
hands_module = mp_hands.Hands(
    max_num_hands=2,
    min_detection_confidence=0.65,
    min_tracking_confidence=0.5,
)


# -------------------------------------------------
# Window + Camera
# -------------------------------------------------
WINDOW_NAME = "Virtual Chemistry Lab-1"
cv2.namedWindow(WINDOW_NAME, cv2.WND_PROP_FULLSCREEN)
cv2.setWindowProperty(WINDOW_NAME, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)


def load_frames(folder,prefix, max_count=200):
    frames=[]
    for i in range(1,max_count):
        path = os.path.join(folder,f"{prefix}_{i:02d}.png")
        if not os.path.exists(path):
            break
        frames.append(Image.open(path).convert("RGBA"))
    return frames
        
        
FLAME_FRAMES =assets.get_flame_frames()
if not FLAME_FRAMES:
    FLAME_FRAMES = load_frames("tool_images/flame_frames","flame",300)
    
    #world_objects = [
    #     make_objects("flask",300,220),
    #     make_objects("flask",600,220),
    # ]
    
    # slot_states = create_slots()
    # particles =[]
    
    # hand_buffers = {"Left": deque(maxlen=5), "Right": deque(maxlen=5)}
    # prev_time= time.time
    
    
    
    # def ensure_burner_fields(obj):
    #     if obj.get("type") != "burner":
    #         return                                
            
    #     if "flame_frames" not in obj:
    #         obj["flame_frames"]=FLAME_FRAMES
    #         obj["flame_index"]=0
    #         obj["flame_timer"]=0.0
    #         obj["flame_on"]=False
            
    # def compute_slot_positions(W,H):
    #     center_x=W//2
    #     base_y=  




cap = None
for i in range(6):
    cam = cv2.VideoCapture(i)
    if cam.isOpened():
        cap = cam
        break
if cap is None:
    raise RuntimeError("No camera found")


# -------------------------------------------------
# Assets
# -------------------------------------------------
# def load_frames(folder, prefix, max_count=200):
    # frames = []
    # for i in range(1, max_count):
        # path = os.path.join(folder, f"{prefix}_{i:02d}.png")
        # if not os.path.exists(path):
            # break
        # frames.append(Image.open(path).convert("RGBA"))
    # return frames


FLAME_FRAMES = load_frames("tool_images/flame_frames", "flame", 300)
DROPLET_FRAMES = load_frames("tool_images/droplet_frames", "drop", 200)


# -------------------------------------------------
# World state
# -------------------------------------------------
world_objects = []
    #make_object("flask", 300, 220),
    #make_object("flask", 600, 220),


slot_states = create_slots()
droplets = []

particles=[]

hand_buffers = {"Left": deque(maxlen=5), "Right": deque(maxlen=5)}
pinch_prev = {"Left": False, "Right": False}

prev_time = time.time()  





# -------------------------------------------------
# Helpers
# -------------------------------------------------
def ensure_burner_fields(obj):
    if obj.get("type") != "burner":
        return
    if "flame_frames" not in obj:
        obj["flame_frames"] = FLAME_FRAMES
        obj["flame_index"] = 0
        obj["flame_timer"] = 0.0
        obj["flame_on"] = False     


def compute_slot_positions(W, H):
    center_x = W // 2
    base_y = int(H * SLOT_Y) if SLOT_Y < 1.0 else min(H - 150, int(SLOT_Y))
    left = center_x - ((SLOT_COUNT - 1) * SLOT_SPACING) // 2
    for i, s in enumerate(slot_states):
        s["pos"] = np.array([left + i * SLOT_SPACING, base_y], float)


# -------------------------------------------------
# Main loop
# -------------------------------------------------
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
        H, W = frame.shape[:2]
        out = render_world(frame, world_objects, BASE_SIZE)
        if out is None:
            raise RuntimeError("render_world returned None")
        out , table_top_y = render_platform_base(out, assets.get_desk(), H)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        
        
        # - - - - - - - - - - - - - - - - - - - - - - - -
        
        for obj in world_objects:
            if obj.get("type") == "burner" and obj.get("flame_on"):
                spawn_smoke(
                particles,
                obj["pos"][0],
                obj["pos"][1] - BASE_SIZE // 2 - 30,
                count=2,
            )


        # -------------------------
        # Hand detection
        # -------------------------
        detected_hands = {}
        results = hands_module.process(rgb)

        if results.multi_hand_landmarks:
            for lm, hd in zip(results.multi_hand_landmarks, results.multi_handedness):
                label = hd.classification[0].label
                wrist = lm.landmark[mp_hands.HandLandmark.WRIST]
                index = lm.landmark[mp_hands.HandLandmark.INDEX_FINGER_TIP]
                thumb = lm.landmark[mp_hands.HandLandmark.THUMB_TIP]
                mcp = lm.landmark[mp_hands.HandLandmark.INDEX_FINGER_MCP]

                wrist_px = np.array([wrist.x * W, wrist.y * H])
                index_px = np.array([index.x * W, index.y * H])
                thumb_px = np.array([thumb.x * W, thumb.y * H])
                mcp_px = np.array([mcp.x * W, mcp.y * H])

                buf = hand_buffers[label]
                buf.append(wrist_px)
                smooth_wrist = np.mean(buf, axis=0)

                detected_hands[label] = {
                    "wrist": smooth_wrist,
                    "index": index_px,
                    "pinch": distance(index_px, thumb_px) < 40,
                    "angle": math.atan2(mcp_px[1]-wrist_px[1], mcp_px[0]-wrist_px[0]),
                }
                
                


        # -------------------------
        # Toolbar
        # -------------------------
        toolbar, icon_positions = draw_ribbon(W)
        handle_ribbon_interaction(detected_hands, W, H, icon_positions, world_objects)

        for obj in world_objects:
            if obj.get("type")=="burner":
                obj["flame_on"] = True
        # -------------------------
        # Physics (gravity only)
        # -------------------------
        floor_y = table_top_y if table_top_y is not None else (H - 80)
        grab_update(detected_hands,world_objects)
        physics_update(world_objects, dt, floor_y)
        motion_update(world_objects,dt,ensure_burner_fields)
        particle_update(particles, dt)
        
        
        compute_slot_positions(W,H)

        # -------------------------
        # Rotation & damping
        # -------------------------
        

        # -------------------------
        # Render (temporary inline)
        # -------------------------
        # out = render_world(frame,world_objects,BASE_SIZE)
        # if out is None:
        #     raise RuntimeError("render_world returned None")
        # out, table_top_y = render_platform_base(out,assets.get_desk(),H)
        #out = render_slots(out,slot_states,SLOT_W,SLOT_H)
        out = render_toolbar(out,toolbar)
        out = render_burner_flames(out,world_objects, dt,BASE_SIZE)
        out = render_particles(out,particles)
        
        # -------------------------
        # Dashboard HUD
        # -------------------------
        fps = 1 / dt if dt > 0 else 0
        
        hands_count = len(detected_hands)
        left_hand_str = "None"
        if "Left" in detected_hands:
            left_hand_str = "Pinching" if detected_hands["Left"]["pinch"] else "Open"
            
        right_hand_str = "None"
        if "Right" in detected_hands:
            right_hand_str = "Pinching" if detected_hands["Right"]["pinch"] else "Open"
            
        total_vol = sum(sum(c.get("vol", 0) for c in s.get("contents", [])) for s in slot_states)
        burner_active = any(obj.get("type") == "burner" and obj.get("flame_on", False) for obj in world_objects)
        
        metrics = {
            "fps": fps,
            "active_tools": len(world_objects),
            "burner_active": burner_active,
            "total_volume": total_vol,
            "hands_count": hands_count,
            "left_hand": left_hand_str,
            "right_hand": right_hand_str,
        }
        out = render_dashboard(out, metrics, W, H)
        
        cv2.imshow(WINDOW_NAME,out)
        

        # -------------------------
        # Exit
        # -------------------------
        if cv2.waitKey(1) & 0xFF == 27:
            break

finally:
    cap.release()
    cv2.destroyAllWindows()
    hands_module.close()
