import os
import numpy as np
from PIL import Image
from tools import load_tool_image


# ============================================================
#  LOAD FLAME ANIMATION FRAMES
# ============================================================

def load_flame_frames():
    frames = []
    folder = os.path.join("tool_images", "flame_frames")

    if not os.path.exists(folder):
        print("[objects.py] WARNING: flame_frames folder missing!")
        return frames

    for filename in sorted(os.listdir(folder)):
        if filename.lower().endswith(".png"):
            path = os.path.join(folder, filename)
            try:
                img = Image.open(path).convert("RGBA")
                frames.append(img)
            except Exception as e:
                print(f"[objects.py] WARNING: Failed loading {filename}: {e}")

    print(f"[objects.py] Loaded {len(frames)} flame frames.")
    return frames


FLAME_FRAMES = load_flame_frames()


# ============================================================
#  BASE OBJECT (COMMON FIELDS FOR ALL TOOLS)
# ============================================================

def base_object(tool_id: str, x: float, y: float, img: Image.Image):
    """
    Create a base object with all fields that main.py expects.
    """

    return {
        "tool_id": tool_id,
        "type": tool_id,

        # Physics / transform
        "pos": np.array([float(x), float(y)], dtype=float),
        "vel": np.array([0.0, 0.0], dtype=float),
        "grab_offset": np.array([0.0, 0.0], dtype=float),

        # Interaction
        "grabbed": False,
        "grabbed_by_hand": None,

        # Rotation
        "current_angle": 0.0,
        "angular_vel": 0.0,

        # Rendering
        "scale": 1.0,
        "alpha": 1.0,
        "img": img,
        "active": True,
        
        "_cache_img":None,
        "_cache_scale":None,
        "_cache_angle":None,

        # Liquids (used for flasks, can be 0 for others)
        "liquid_color": None,
        "liquid_vol": 0.0,
    }


# ============================================================
#  FLASK
# ============================================================

def make_flask(x, y,assets):
    img = assets.get_tool("flask")      # flask.png in tool_images
    obj = base_object("flask", x, y, img)

    # default liquid
    obj["liquid_color"] = (0, 120, 255)
    obj["liquid_vol"] = 300.0

    return obj


# ============================================================
# OTHER TOOLS (BEAKER, TEST_TUBE, CYLINDER, PETRI, ROD, SPATULA)
# ============================================================

def make_beaker(x, y):
    img = load_tool_image("beaker")
    return base_object("beaker", x, y, img)


def make_test_tube(x, y):
    img = load_tool_image("test_tube")
    return base_object("test_tube", x, y, img)


def make_cylinder(x, y):
    img = load_tool_image("cylinder")
    return base_object("cylinder", x, y, img)


def make_petri(x, y):
    img = load_tool_image("petri")
    return base_object("petri", x, y, img)


def make_rod(x, y):
    img = load_tool_image("rod")
    return base_object("rod", x, y, img)


def make_spatula(x, y):
    img = load_tool_image("spatula")
    return base_object("spatula", x, y, img)


def make_dropper(x, y):
    img = load_tool_image("dropper")
    return base_object("dropper", x, y, img)


# ============================================================
#  BURNER (WITH FLAME STATE)
# ================================Rewrite renderer with caching properly============================

def make_burner(x, y):
    img = load_tool_image("burner")
    obj = base_object("burner", x, y, img)

    # flame animation fields
    obj["flame_frames"] = FLAME_FRAMES
    obj["flame_index"] = 0
    obj["flame_timer"] = 0.0
    obj["flame_on"] = False

    return obj


# ============================================================
# MAIN FACTORY USED BY main.py
# ============================================================

def make_object(tool_id="flask", x=300, y=200, assets=None):
    """
    Tool dispatcher used by main.py and toolbar.
    """

    if tool_id == "flask":
        return make_flask(x, y,assets)
    if tool_id == "beaker":
        return make_beaker(x, y)
    if tool_id == "test_tube":
        return make_test_tube(x, y)
    if tool_id == "cylinder":
        return make_cylinder(x, y)
    if tool_id == "petri":
        return make_petri(x, y)
    if tool_id == "rod":
        return make_rod(x, y)
    if tool_id == "spatula":
        return make_spatula(x, y)
    if tool_id == "dropper":
        return make_dropper(x, y)
    if tool_id == "burner":
        return make_burner(x, y)

    # fallback for unknown ids
    print(f"[objects.py] WARNING: Unknown tool '{tool_id}', using generic base object.")
    img = load_tool_image(tool_id)
    return base_object(tool_id, x, y, img)
