import os
import cv2
from PIL import Image


class AssetManager:
    def __init__(self):
        self.tool_images = {}
        self.flame_frames = []
        self.desk_image = None

    def load_tool_images(self, folder="tool_images"):
        if not os.path.exists(folder):
            print(f"[AssetManager] Folder not found: {folder}")
            return

        for filename in os.listdir(folder):
            if not filename.lower().endswith(".png"):
                continue
            tool_id = filename.replace(".png", "")
            path = os.path.join(folder, filename)
            try:
                img = Image.open(path).convert("RGBA")
                self.tool_images[tool_id] = img
            except Exception as e:
                print(f"[AssetManager] Failed loading {filename}: {e}")

        print(f"[AssetManager] Loaded {len(self.tool_images)} tool images.")

    def load_flame_frames(self, folder="tool_images/flame_frames"):
        if not os.path.exists(folder):
            print(f"[AssetManager] Flame folder not found: {folder}")
            return

        frames = []
        for filename in sorted(os.listdir(folder)):
            if filename.lower().endswith(".png"):
                path = os.path.join(folder, filename)
                try:
                    img = Image.open(path).convert("RGBA")
                    frames.append(img)
                except Exception as e:
                    print(f"[AssetManager] Failed loading flame frame {filename}: {e}")

        self.flame_frames = frames
        print(f"[AssetManager] Loaded {len(frames)} flame frames.")

    def load_desk(self, path="tool_images/lab_table.png"):
        if not os.path.exists(path):
            print(f"[AssetManager] Desk image not found: {path}")
            return

        try:
            img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
            if img is not None:
                self.desk_image = img
                print("[AssetManager] Desk image loaded.")
        except Exception as e:
            print(f"[AssetManager] Failed loading desk image: {e}")

    def get_tool(self, tool_id):
        return self.tool_images.get(tool_id)

    def get_flame_frames(self):
        return self.flame_frames

    def get_desk(self):
        return self.desk_image
