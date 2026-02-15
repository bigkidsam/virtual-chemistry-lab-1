import os
import cv2
import numpy as np
from PIL import Image


class AssetManager:
    """
    Loads and caches all assets.
    """

    def __init__(self):
        self.tool_images = {}
        self.flame_frames = []
        self.desk_image = None

    def load_tool_images(self, folder="tool_images"):
        for filename in os.listdir(folder):
            if not filename.endswith(".png"):
                continue

            tool_id = filename.replace(".png", "")
            path = os.path.join(folder, filename)

            img = Image.open(path).convert("RGBA")
            self.tool_images[tool_id] = np.array(img)

    def load_flame_frames(self, folder="tool_images/flame_frames"):
        frames = []
        for filename in sorted(os.listdir(folder)):
            if filename.endswith(".png"):
                path = os.path.join(folder, filename)
                img = Image.open(path).convert("RGBA")
                frames.append(np.array(img))
        self.flame_frames = frames

    def load_desk(self, path="tools_images/lab_table.png"):
        img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
        self.desk_image = img

    def get_tool(self, tool_id):
        return self.tool_images.get(tool_id)

    def get_flame_frames(self):
        return self.flame_frames

    def get_desk(self):
        return self.desk_image
