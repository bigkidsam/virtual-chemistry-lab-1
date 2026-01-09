import os

print("SCRIPT STARTED")
print("Current working directory:",os.getcwd())
print("Does labels exists?",os.path.exists("labels"))
print("Does labels/train exists?",os.path.exists("labels/train"))
print("Does labels/val exists", os.path.exists("labels/val"))

import shutil
import numpy as np
import math

SRC_DIR = "labels/train"
OUT_DIR = "labels_selected"

GESTURES = ["grab", "pour", "idle", "discard"]

for file in os.listdir(SRC_DIR):
    print("Found file:", file)

    if not file.endswith(".txt"):
        continue


for g in GESTURES:
    os.makedirs(os.path.join(OUT_DIR, g), exist_ok=True)


def load_keypoints(path):
    with open(path) as f:
        values = list(map(float,f.read().strip().split()))
        

    kp_values = values [5:]
    kp=[]
    for i in range(0, len(kp_values),3):
        x=kp_values[i]
        y=kp_values[i+1]
        kp.append([x.y])
        
    kp = np.array(kp)
    if kp.shape !=(21,2):
        raise ValueError(f"Expected 21 keypoints,got{kp.shape}")
    

    return kp


def dist(a, b):
    return np.linalg.norm(a - b)


def classify_pose(kp):
    wrist = kp[0]
    thumb = kp[4]
    index = kp[8]
    middle = kp[12]
    ring = kp[16]
    pinky = kp[20]

    # normalize
    scale = np.linalg.norm(kp[5] - kp[17]) + 1e-6
    kp = (kp - wrist) / scale

    def dist(a, b):
        return np.linalg.norm(a - b)

    pinch = dist(thumb, index)
    openness = (dist(index, middle) +
                dist(middle, ring) +
                dist(ring, pinky)) / 3

    angle = abs(math.degrees(
        math.atan2(middle[1] - wrist[1], middle[0] - wrist[0])
    ))

    
    print("pinch:", round(pinch, 3),
        "angle:", round(angle, 1),
        "open:", round(openness, 3))

    # ---- RULES (keep for now) ----
    if pinch < 0.75:
        return "grab"

    if angle > 20:
        return "pour"

    if openness > 0.35:
        return "idle"

    return "discard"
