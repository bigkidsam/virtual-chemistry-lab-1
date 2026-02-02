import os
from config import ICON_SIZE

# Try to import Pillow (PIL). If it's missing, raise a clear error with install instruction.
try:
    from PIL import Image
except ImportError as e:
    raise ImportError(
        "Pillow library is required for image handling. Install with: pip install pillow"
    ) from e

# folder containing tool images
TOOL_IMAGE_FOLDER = "tool_images"


# ------------------------------------------------------------
# LOAD TOOL PNG IMAGE
# ------------------------------------------------------------
def load_tool_image(tool_id):
    """
    Load an image from tool_images/<tool_id>.png
    If missing, generates a placeholder.
    """
    path = os.path.join(TOOL_IMAGE_FOLDER, f"{tool_id}.png")

    try:
        img = Image.open(path).convert("RGBA")
        return img
    except:
        # fallback placeholder
        print(f"[tools.py] WARNING: Missing image for {tool_id}, using placeholder.")
        from PIL import ImageDraw
        img = Image.new("RGBA", (ICON_SIZE, ICON_SIZE), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        draw.text((5, 5), tool_id[:2].upper(), fill=(255, 255, 255))
        return img


# ------------------------------------------------------------
# LOAD FLAME ANIMATION FRAMES (BURNER)
# ------------------------------------------------------------
def load_flame_frames():
    """
    Loads flame sprite frames from:
        tool_images/flame_frames/flame_01.png
        flame_02.png
        flame_03.png
        ...

    Returns a list of PIL RGBA images.
    """
    frames = []
    folder = os.path.join(TOOL_IMAGE_FOLDER, "flame_frames")

    # Load frames in order: flame_01, flame_02, ...
    for i in range(1, 200):  # support up to flame_199.png
        filename = f"flame_{i:02d}.png"
        path = os.path.join(folder, filename)
        if not os.path.exists(path):
            break
        frames.append(Image.open(path).convert("RGBA"))

    if not frames:
        print("[ERROR] No flame frames found in tool_images/flame_frames")

    return frames


# ------------------------------------------------------------
# TOOL LIST
# ------------------------------------------------------------
TOOLS = [
    {"id": "flask",     "name": "Flask"},
    {"id": "beaker",    "name": "Beaker"},
    {"id": "test_tube", "name": "Test Tube"},
    {"id": "burner",    "name": "Burner"},
    {"id": "dropper",   "name": "Dropper"},
    {"id": "cylinder",  "name": "Cylinder"},
    {"id": "petri",     "name": "Petri Dish"},
    {"id": "rod",       "name": "Glass Rod"},
    {"id": "spatula",   "name": "Spatula"},
]
