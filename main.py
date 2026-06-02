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
from systems.particle_systems import spawn_smoke, spawn_droplet, update as particle_update
from systems.physics_system import update as physics_update
from ui_toolbar import draw_toolbar_bottom, handle_ribbon_interaction   
from ui_panels import render_top_bar, render_left_panel, render_right_panel, handle_panels_interaction, draw_rounded_rect   
from utils import distance  
from systems.audio_system import detector
from bridge_server import (
    publish_bridge_frame,
    publish_bridge_state,
    start_bridge_server,
    stop_bridge_server,
)

BRIDGE_ONLY = os.environ.get("BRIDGE_ONLY", "1") == "1"

detector.start()
bridge_running = start_bridge_server()

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
if not BRIDGE_ONLY:
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
global_paused = False





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
        
        # Upscale frame to 720p HD so our advanced layout has room to breathe on small webcams!
        frame = cv2.resize(frame, (1280, 720))
        
        H, W = frame.shape[:2]
        publish_bridge_frame(frame)
        _, table_top_y = render_platform_base(frame, assets.get_desk(), H)
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

                pinch_threshold = int(W * 0.06)  # ~76px
                detected_hands[label] = {
                    "wrist": smooth_wrist,
                    "index": index_px,
                    "thumb": thumb_px,
                    "pinch": distance(index_px, thumb_px) < pinch_threshold,
                    "angle": math.atan2(mcp_px[1]-wrist_px[1], mcp_px[0]-wrist_px[0]),
                }
                
        # -------------------------
        # Two-Hand Interaction Logic
        # -------------------------
        grabbed_dropper = None
        grabbed_burner = None
        for obj in world_objects:
            if obj.get("type") == "dropper" and obj.get("grabbed"):
                grabbed_dropper = obj
            elif obj.get("type") == "burner" and obj.get("grabbed"):
                grabbed_burner = obj
                
        if grabbed_dropper:
            grabber_label = grabbed_dropper["grabbed_by"]
            for label, hand in detected_hands.items():
                if label != grabber_label and hand["pinch"] and not pinch_prev.get(label, False):
                    color = grabbed_dropper.get("chem_color", (200, 200, 200))
                    angle = grabbed_dropper.get("current_angle", 0)
                    size = grabbed_dropper.get("_render_size", BASE_SIZE)
                    
                    # Compute tip of the dropper
                    dx = math.sin(-angle) * (size // 2 - 10)
                    dy = math.cos(-angle) * (size // 2 - 10)
                    
                    drop_x = grabbed_dropper["pos"][0] + dx
                    drop_y = grabbed_dropper["pos"][1] + dy
                    
                    # spawn droplet
                    spawn_droplet(particles, drop_x, drop_y, color)
                    print(f"[ACTION] Spawned droplet from {label} hand pinch")
                    break

        if grabbed_burner:
            grabber_label = grabbed_burner["grabbed_by"]
            for label, hand in detected_hands.items():
                if label != grabber_label and hand["pinch"] and not pinch_prev.get(label, False):
                    grabbed_burner["flame_on"] = not grabbed_burner.get("flame_on", False)
                    state = "ON" if grabbed_burner["flame_on"] else "OFF"
                    print(f"[ACTION] Toggled burner flame {state} from {label} hand pinch")
                    break

        # Update pinch_prev
        for label, hand in detected_hands.items():
            pinch_prev[label] = hand["pinch"]
                
        # -------------------------
        # Audio Snap Handling
        # -------------------------
        audio_event = detector.get_latest_event()
        if audio_event:
            for obj in world_objects:
                if obj.get("type") == "burner":
                    if audio_event == "SINGLE_SNAP":
                        obj["flame_on"] = True
                        print("[ACTION] Burner ON via single audio snap")
                    elif audio_event == "DOUBLE_SNAP":
                        obj["flame_on"] = False
                        print("[ACTION] Burner OFF via double audio snap")

        if bridge_running:
            bridge_hands = []
            for label, hand in detected_hands.items():
                wrist = hand["wrist"]
                index_tip = hand["index"]
                thumb_tip = hand["thumb"]
                bridge_hands.append({
                    "label": label,
                    "wrist": {
                        "x": float(wrist[0] / W),
                        "y": float(wrist[1] / H),
                    },
                    "indexTip": {
                        "x": float(index_tip[0] / W),
                        "y": float(index_tip[1] / H),
                    },
                    "thumbTip": {
                        "x": float(thumb_tip[0] / W),
                        "y": float(thumb_tip[1] / H),
                    },
                    "pinching": bool(hand["pinch"]),
                    "landmarks": [],
                })
            publish_bridge_state(bridge_hands, audio_event=audio_event, paused=global_paused)

        if BRIDGE_ONLY:
            time.sleep(0.001)
            continue
        # -------------------------
        # Physics (gravity only)
        # -------------------------
        floor_y = table_top_y if table_top_y is not None else (H - 80)
        grab_update(detected_hands,world_objects)
        
        if not global_paused:
            physics_update(world_objects, dt, floor_y)
            motion_update(world_objects,dt,ensure_burner_fields)
            particle_update(particles, dt)                      
        
        
        compute_slot_positions(W,H)

        # -------------------------
        # Rotation & damping
        # -------------------------
        

        # -------------------------
        # Render
        # -------------------------
        # Dynamically map simulation box to avoid Left and Right panel spaces
        left_panel_w = max(260, int(W * 0.22))
        right_panel_w = max(280, int(W * 0.25))
        
        sim_x = 20 + left_panel_w + 30
        sim_w = W - 20 - right_panel_w - sim_x - 30
        sim_y = 80
        sim_h = H - 200
        
        # World and effects are rendered after physics so the displayed frame
        # matches the latest simulation state.
        out = render_world(frame, world_objects, BASE_SIZE)
        if out is None:
            raise RuntimeError("render_world returned None")
        out, _ = render_platform_base(out, assets.get_desk(), H)
        out = render_burner_flames(out, world_objects, dt, BASE_SIZE)
        out = render_particles(out, particles)

        draw_rounded_rect(out, (sim_x, sim_y), (sim_x + sim_w, sim_y + sim_h), (180, 140, 80), thickness=2, radius=10, fill=False)
        cv2.putText(out, "Lab Simulation", (sim_x + (sim_w - 150)//2, sim_y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        # UI overlays
        out, top_bar_buttons = render_top_bar(out, W, H)
        out, chem_buttons = render_left_panel(out, W, H)
        out = render_right_panel(out, W, H)
        out, icon_positions = draw_toolbar_bottom(out, W, H)
        if global_paused:
            cv2.putText(out, "PAUSED", (W//2 - 60, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (50, 50, 255), 3)
            
        handle_ribbon_interaction(detected_hands, W, H, icon_positions, world_objects)
        toggled = handle_panels_interaction(detected_hands, chem_buttons, top_bar_buttons, world_objects, W, H, slot_states, particles)
        if toggled:
            global_paused = not global_paused
        
        cv2.imshow(WINDOW_NAME, out)
        

        # -------------------------
        # Exit
        # -------------------------
        if cv2.waitKey(1) & 0xFF == 27:
            break

finally:
    stop_bridge_server()
    detector.stop()
    cap.release()
    if not BRIDGE_ONLY:
        cv2.destroyAllWindows()
    hands_module.close()
