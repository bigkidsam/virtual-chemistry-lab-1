import cv2
import numpy as np
import time

# ----------------------------------------------------
# Data Definitions
# ----------------------------------------------------
CHEMICALS = [
    {"id": "hcl",   "name": "HCl",   "color_name": "Light Blue", "bgr": (255, 200, 100), "state": "Liquid", "temp": "25°C"},
    {"id": "naoh",  "name": "NaOH",  "color_name": "White",      "bgr": (240, 240, 240), "state": "Solid",  "temp": "20°C"},
    {"id": "cuso4", "name": "CuSO4", "color_name": "Blue",       "bgr": (255, 100, 50),  "state": "Liquid", "temp": "25°C"}
]

# Global UI State
ui_state = {
    "last_interaction_time": 0,
    "active_reaction": "HCl + NaOH -> NaCl + H2O",
    "reaction_status": "Reacting...",
    "reaction_progress": 0.6,
    "temperature": "85°C"
}

# ----------------------------------------------------
# Advanced Drawing Helpers
# ----------------------------------------------------
def draw_rounded_rect(img, top_left, bottom_right, color, thickness=1, radius=10, fill=False):
    x1, y1 = top_left
    x2, y2 = bottom_right
    
    if fill:
        cv2.rectangle(img, (x1 + radius, y1), (x2 - radius, y2), color, -1)
        cv2.rectangle(img, (x1, y1 + radius), (x2, y2 - radius), color, -1)
        cv2.circle(img, (x1 + radius, y1 + radius), radius, color, -1)
        cv2.circle(img, (x2 - radius, y1 + radius), radius, color, -1)
        cv2.circle(img, (x1 + radius, y2 - radius), radius, color, -1)
        cv2.circle(img, (x2 - radius, y2 - radius), radius, color, -1)
    else:
        cv2.line(img, (x1 + radius, y1), (x2 - radius, y1), color, thickness)
        cv2.line(img, (x1 + radius, y2), (x2 - radius, y2), color, thickness)
        cv2.line(img, (x1, y1 + radius), (x1, y2 - radius), color, thickness)
        cv2.line(img, (x2, y1 + radius), (x2, y2 - radius), color, thickness)
        cv2.ellipse(img, (x1 + radius, y1 + radius), (radius, radius), 180, 0, 90, color, thickness)
        cv2.ellipse(img, (x2 - radius, y1 + radius), (radius, radius), 270, 0, 90, color, thickness)
        cv2.ellipse(img, (x1 + radius, y2 - radius), (radius, radius), 90, 0, 90, color, thickness)
        cv2.ellipse(img, (x2 - radius, y2 - radius), (radius, radius), 0, 0, 90, color, thickness)

def draw_alpha_rounded_rect(img, x, y, w, h, color, alpha, radius=10):
    overlay = img.copy()
    draw_rounded_rect(overlay, (x, y), (x + w, y + h), color, radius=radius, fill=True)
    cv2.addWeighted(overlay, alpha, img, 1 - alpha, 0, img)

def draw_gradient_v(img, x, y, w, h, top_color, bottom_color, alpha=1.0):
    """Draw vertical gradient."""
    overlay = img.copy()
    for i in range(h):
        ratio = i / float(h)
        b = int(top_color[0] * (1 - ratio) + bottom_color[0] * ratio)
        g = int(top_color[1] * (1 - ratio) + bottom_color[1] * ratio)
        r = int(top_color[2] * (1 - ratio) + bottom_color[2] * ratio)
        cv2.line(overlay, (x, y + i), (x + w, y + i), (b, g, r), 1)
    if alpha < 1.0:
        cv2.addWeighted(overlay, alpha, img, 1 - alpha, 0, img)
    else:
        img[y:y+h, x:x+w] = overlay[y:y+h, x:x+w]

# ----------------------------------------------------
# Main Layout Renderers
# ----------------------------------------------------
def render_top_bar(out, W, H):
    """Draws the Top Bar layout"""
    bar_h = 60
    # Dark blue gradient background
    draw_gradient_v(out, 0, 0, W, bar_h, (50, 25, 10), (30, 15, 5))
    cv2.line(out, (0, bar_h), (W, bar_h), (120, 80, 40), 1)

    # Title
    text = "Virtual Chemistry Lab"
    (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.9, 2)
    tx = (W - tw) // 2
    ty = (bar_h + th) // 2 - 5
    
    # Draw sleek diamonds around title
    cv2.putText(out, text, (tx, ty), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)
    
    # Draw simple right side buttons
    rx = W - 250
    draw_rounded_rect(out, (rx, 15), (rx + 80, 45), (100, 60, 20), radius=5, fill=True)
    cv2.putText(out, "Reset", (rx + 15, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    
    draw_rounded_rect(out, (rx + 90, 15), (rx + 170, 45), (40, 25, 15), radius=5, fill=True)
    draw_rounded_rect(out, (rx + 90, 15), (rx + 170, 45), (100, 60, 20), thickness=1, radius=5, fill=False)
    cv2.putText(out, "Pause", (rx + 105, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
    
    return out

def render_left_panel(out, W, H):
    """Draws the Left Chemical Cards panel."""
    # Responsive Sizing
    margin_top = 80
    panel_w = max(260, int(W * 0.22))
    panel_h = H - margin_top - 120
    x, y = 20, margin_top
    
    # Dark background tint for left panel
    draw_alpha_rounded_rect(out, x, y, panel_w, panel_h, (25, 15, 5), 0.85, radius=5)
    cv2.rectangle(out, (x, y), (x + panel_w, y + panel_h), (80, 50, 30), 1)
    
    inner_x = x + 10
    inner_y = y + 15
    inner_w = panel_w - 20
    
    # Search Bar
    draw_rounded_rect(out, (inner_x, inner_y), (inner_x + inner_w, inner_y + 35), (40, 25, 15), fill=True, radius=5)
    cv2.rectangle(out, (inner_x, inner_y), (inner_x + inner_w, inner_y + 35), (120, 80, 40), 1)
    cv2.putText(out, "Search...", (inner_x + 10, inner_y + 23), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (150, 150, 150), 1)
    
    curr_y = inner_y + 50
    chemical_buttons = []
    
    # Dynamically scale cards based on available panel height
    total_chemicals = len(CHEMICALS)
    available_h = panel_h - 60
    card_spacing = 10
    
    card_h = (available_h - (total_chemicals * card_spacing)) // total_chemicals
    if card_h > 110: card_h = 110 # Max height clamp
    if card_h < 75: card_h = 75 # Min height clamp
    
    scale_factor = card_h / 110.0
    
    # Draw chemical cards
    for chem in CHEMICALS:
        
        # Card Background gradient
        draw_gradient_v(out, inner_x, curr_y, inner_w, card_h, (60, 40, 20), (30, 20, 10))
        cv2.rectangle(out, (inner_x, curr_y), (inner_x + inner_w, curr_y + card_h), (90, 60, 35), 1)
        
        # Chem Name
        name_font = max(0.4, 0.7 * scale_factor)
        cv2.putText(out, chem["name"], (inner_x + 10, curr_y + int(30 * scale_factor)), cv2.FONT_HERSHEY_SIMPLEX, name_font, (255, 255, 255), 2)
        
        # Info text
        info_font = max(0.35, 0.45 * scale_factor)
        infox = inner_x + 10
        cv2.putText(out, f"Color: {chem['color_name']}", (infox, curr_y + int(55 * scale_factor)), cv2.FONT_HERSHEY_SIMPLEX, info_font, (200, 200, 200), 1)
        cv2.putText(out, f"State: {chem['state']}", (infox, curr_y + int(75 * scale_factor)), cv2.FONT_HERSHEY_SIMPLEX, info_font, (200, 200, 200), 1)
        cv2.putText(out, f"Temp: {chem['temp']}", (infox, curr_y + int(95 * scale_factor)), cv2.FONT_HERSHEY_SIMPLEX, info_font, (200, 200, 200), 1)
        
        # Add Button
        btn_w, btn_h = int(60 * scale_factor), int(30 * scale_factor)
        btn_rx = inner_x + inner_w - btn_w - 10
        btn_ry = curr_y + card_h - btn_h - 10
        
        draw_gradient_v(out, btn_rx, btn_ry, btn_w, btn_h, (180, 100, 40), (120, 60, 20))
        cv2.rectangle(out, (btn_rx, btn_ry), (btn_rx + btn_w, btn_ry + btn_h), (200, 150, 100), 1)
        cv2.putText(out, "Add", (btn_rx + int(20 * scale_factor)-5, btn_ry + int(20 * scale_factor)), cv2.FONT_HERSHEY_SIMPLEX, info_font, (255, 255, 255), 1)
        
        # Virtual Icon Circle placeholder
        circle_radius = int(18 * scale_factor)
        circle_x = btn_rx + (btn_w // 2)
        circle_y = btn_ry - circle_radius - 5
        cv2.circle(out, (circle_x, circle_y), circle_radius, chem["bgr"], -1)
        cv2.circle(out, (circle_x, circle_y), circle_radius, (200, 200, 200), 1)
        
        
        chemical_buttons.append({"rect": (btn_rx, btn_ry, btn_w, btn_h), "data": chem})
        
        curr_y += card_h + card_spacing
        
    return out, chemical_buttons

def render_right_panel(out, W, H):
    """Draws the Right Reactions Info panel."""
    # Responsive Sizing
    margin_top = 80
    panel_w = max(280, int(W * 0.25))
    panel_h = H - margin_top - 120
    x = W - panel_w - 20
    y = margin_top
    
    # Tint
    draw_alpha_rounded_rect(out, x, y, panel_w, panel_h, (25, 15, 5), 0.85, radius=5)
    cv2.rectangle(out, (x, y), (x + panel_w, y + panel_h), (80, 50, 30), 1)
    
    # Text bounds safety
    safe_x = x + 15
    safe_w = panel_w - 30
    
    # Title
    title = "Reactions Info"
    (tw, th), _ = cv2.getTextSize(title, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
    tx = x + (panel_w - tw) // 2
    cv2.putText(out, title, (tx, y + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    cv2.line(out, (safe_x, y + 40), (safe_x + safe_w, y + 40), (50, 100, 200), 2)  # orange accent
    
    # Active Reaction
    curr_y = y + 70
    cv2.putText(out, "Active Reaction:", (safe_x, curr_y), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)
    
    # Handle reaction string wrap 
    react_str = ui_state["active_reaction"]
    if len(react_str) > int(safe_w / 8):
         cv2.putText(out, react_str[:int(safe_w / 8.5)] + "...", (safe_x, curr_y + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
    else:
        cv2.putText(out, react_str, (safe_x, curr_y + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
    
    cv2.putText(out, f"Status: {ui_state['reaction_status']}", (safe_x, curr_y + 55), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)
    
    # Progress bar scale
    cv2.putText(out, "Progress:", (safe_x, curr_y + 85), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)
    
    p_w = int(safe_w * 0.6)
    p_x = safe_x + safe_w - p_w
    p_y = curr_y + 73
    p_h = 15
    cv2.rectangle(out, (p_x, p_y), (p_x + p_w, p_y + p_h), (40, 40, 40), -1)
    cv2.rectangle(out, (p_x, p_y), (p_x + int(p_w * ui_state["reaction_progress"]), p_y + p_h), (50, 120, 250), -1) # Orange bar
    cv2.rectangle(out, (p_x, p_y), (p_x + p_w, p_y + p_h), (100, 100, 100), 1)
    cv2.putText(out, f"{int(ui_state['reaction_progress']*100)}%", (p_x + p_w//2 - 15, p_y + 12), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
    
    cv2.putText(out, f"Temperature: {ui_state['temperature']}", (safe_x, curr_y + 115), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)
    
    # Reaction List
    list_y = curr_y + 140
    cv2.line(out, (safe_x, list_y), (safe_x + safe_w, list_y), (80, 50, 30), 1)
    cv2.putText(out, "Reaction List", (safe_x, list_y + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1)
    
    reactions = [
        "Acid + Base -> Neutralization",
        "Heating -> Evaporation",
        "Combustion -> Heat & Smoke"
    ]
    ry = list_y + 55
    for r in reactions:
        cv2.circle(out, (safe_x + 5, ry - 4), 3, (150, 150, 150), -1)
        r_str = r if len(r) < int(safe_w / 7) else r[:int(safe_w / 7.5)] + "..."
        cv2.putText(out, r_str, (safe_x + 15, ry), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (220, 220, 220), 1)
        ry += 30
    
    return out

# ----------------------------------------------------
# Interaction Logic
# ----------------------------------------------------
def point_in_rect(px, py, rx, ry, rw, rh):
    return rx <= px <= rx + rw and ry <= py <= ry + rh

def handle_panels_interaction(detected_hands, chem_buttons, world_objects, W, H):
    """Checks clicks for the Add buttons on the Chemical Cards."""
    from objects import make_object
    
    now = time.time()
    if now - ui_state["last_interaction_time"] < 0.8:
        return
        
    for label, hand in detected_hands.items():
        ix, iy = int(hand["index"][0]), int(hand["index"][1])
        
        # Check Add Buttons
        for btn in chem_buttons:
            rx, ry, rw, rh = btn["rect"]
            if point_in_rect(ix, iy, rx, ry, rw, rh):
                chem = btn["data"]
                
                # Spawn a dropper filled with chemical
                new_dropper = make_object("dropper", W // 2, int(H * 0.40))
                new_dropper["chemical"] = chem["id"]
                new_dropper["chem_color"] = chem["bgr"]
                new_dropper["chem_name"] = chem["name"]
                
                world_objects.append(new_dropper)
                ui_state["last_interaction_time"] = now
                print(f"[UI] Spawned dropper with {chem['name']}")
                return
