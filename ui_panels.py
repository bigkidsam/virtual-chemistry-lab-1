import cv2
import numpy as np
import time

# ----------------------------------------------------
# Data Definitions
# ----------------------------------------------------
CHEMICALS = [
    {"id": "water", "name": "H2O (Water)", "color": (255, 100, 100)},  # BGR
    {"id": "hcl",   "name": "HCl (Acid)",  "color": (200, 200, 50)},
    {"id": "naoh",  "name": "NaOH (Base)", "color": (50, 200, 200)},
    {"id": "phino", "name": "Phenolphth.", "color": (200, 50, 200)},
]

PRACTICALS = [
    {
        "id": "titration",
        "name": "Acid-Base Titration",
        "info": "Mix HCl with NaOH.\nUse Phenolphthalein\nas indicator."
    },
    {
        "id": "dilution",
        "name": "Simple Dilution",
        "info": "Add Water to Acid.\nObserve volume\nchanges safely."
    },
    {
        "id": "free_play",
        "name": "Free Play",
        "info": "Mix whatever you want.\nObserve the reactions!"
    }
]

# Global UI State
ui_state = {
    "active_practical": PRACTICALS[0],
    "last_interaction_time": 0
}

# ----------------------------------------------------
# Drawing Functions
# ----------------------------------------------------
def draw_alpha_rect(img, x, y, w, h, color, alpha):
    """Draw a rectangle with alpha transparency."""
    overlay = img.copy()
    cv2.rectangle(overlay, (x, y), (x + w, y + h), color, -1)
    cv2.addWeighted(overlay, alpha, img, 1 - alpha, 0, img)

def render_left_panel(out, W, H):
    """Draws the Practicals and Information Section."""
    panel_w = 260
    panel_h = 450
    x, y = 10, 120
    
    # Background
    draw_alpha_rect(out, x, y, panel_w, panel_h, (30, 30, 30), 0.75)
    cv2.rectangle(out, (x, y), (x + panel_w, y + panel_h), (120, 120, 120), 2)
    
    # Title - Practicals
    cv2.putText(out, "PRACTICALS", (x + 15, y + 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 200, 200), 2)
    cv2.line(out, (x + 10, y + 40), (x + panel_w - 10, y + 40), (100, 100, 100), 1)
    
    practical_buttons = []
    curr_y = y + 60
    
    for pract in PRACTICALS:
        is_active = (ui_state["active_practical"]["id"] == pract["id"])
        bg_color = (80, 120, 80) if is_active else (60, 60, 60)
        
        cv2.rectangle(out, (x + 15, curr_y), (x + panel_w - 15, curr_y + 40), bg_color, -1)
        cv2.rectangle(out, (x + 15, curr_y), (x + panel_w - 15, curr_y + 40), (150, 150, 150), 1)
        
        cv2.putText(out, pract["name"], (x + 25, curr_y + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        practical_buttons.append({"rect": (x + 15, curr_y, panel_w - 30, 40), "data": pract})
        curr_y += 50
    
    # Title - Information
    info_y = curr_y + 20
    cv2.putText(out, "INFORMATION", (x + 15, info_y), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 255, 200), 2)
    cv2.line(out, (x + 10, info_y + 10), (x + panel_w - 10, info_y + 10), (100, 100, 100), 1)
    
    info_lines = ui_state["active_practical"]["info"].split('\n')
    text_y = info_y + 35
    for line in info_lines:
        cv2.putText(out, line, (x + 15, text_y), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (220, 220, 220), 1)
        text_y += 20
        
    return out, practical_buttons

def render_right_panel(out, W, H):
    """Draws the Chemicals Selection Section."""
    panel_w = 220
    panel_h = 350
    x, y = W - panel_w - 10, 120
    
    # Background
    draw_alpha_rect(out, x, y, panel_w, panel_h, (30, 30, 30), 0.75)
    cv2.rectangle(out, (x, y), (x + panel_w, y + panel_h), (120, 120, 120), 2)
    
    # Title
    cv2.putText(out, "CHEMICALS", (x + 15, y + 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 255), 2)
    cv2.line(out, (x + 10, y + 40), (x + panel_w - 10, y + 40), (100, 100, 100), 1)
    
    chemical_buttons = []
    curr_y = y + 60
    
    for chem in CHEMICALS:
        cv2.rectangle(out, (x + 15, curr_y), (x + panel_w - 15, curr_y + 40), (50, 50, 50), -1)
        cv2.rectangle(out, (x + 15, curr_y), (x + panel_w - 15, curr_y + 40), (150, 150, 150), 1)
        
        # Color indicator
        cv2.circle(out, (x + 35, curr_y + 20), 10, chem["color"], -1)
        cv2.circle(out, (x + 35, curr_y + 20), 10, (200, 200, 200), 1)
        
        cv2.putText(out, chem["name"], (x + 55, curr_y + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        chemical_buttons.append({"rect": (x + 15, curr_y, panel_w - 30, 40), "data": chem})
        curr_y += 50
        
    return out, chemical_buttons

# ----------------------------------------------------
# Interaction Logic
# ----------------------------------------------------
def point_in_rect(px, py, rx, ry, rw, rh):
    return rx <= px <= rx + rw and ry <= py <= ry + rh

def handle_panels_interaction(detected_hands, pract_buttons, chem_buttons, world_objects, W, H):
    """
    Checks if a hand pinches over a practical button or chemical button.
    Spawns a chemical dropper if a chemical is clicked.
    Updates info section if practical is clicked.
    """
    from objects import make_object
    
    now = time.time()
    if now - ui_state["last_interaction_time"] < 0.8:
        return # Cooldown
        
    for label, hand in detected_hands.items():
        if hand.get("pinch"):
            ix, iy = int(hand["index"][0]), int(hand["index"][1])
            
            # Check Practicals
            for btn in pract_buttons:
                rx, ry, rw, rh = btn["rect"]
                if point_in_rect(ix, iy, rx, ry, rw, rh):
                    ui_state["active_practical"] = btn["data"]
                    ui_state["last_interaction_time"] = now
                    print(f"[UI] Selected Practical: {btn['data']['name']}")
                    return
                    
            # Check Chemicals
            for btn in chem_buttons:
                rx, ry, rw, rh = btn["rect"]
                if point_in_rect(ix, iy, rx, ry, rw, rh):
                    chem = btn["data"]
                    
                    # Spawn a dropper filled with this chemical
                    new_dropper = make_object("dropper", W // 2, int(H * 0.40))
                    # Inject chemical details directly into the dropper
                    new_dropper["chemical"] = chem["id"]
                    new_dropper["chem_color"] = chem["color"]
                    new_dropper["chem_name"] = chem["name"]
                    
                    world_objects.append(new_dropper)
                    
                    ui_state["last_interaction_time"] = now
                    print(f"[UI] Spawned dropper with {chem['name']}")
                    return
