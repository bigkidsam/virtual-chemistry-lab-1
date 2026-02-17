import cv2
import math
import numpy as np
from PIL import Image





def overlay_image_alpha(bg, fg, x, y, alpha_mult=1.0):
    """Overlay RGBA fg onto BGR bg."""
    h, w = bg.shape[:2]
    fh, fw = fg.shape[:2]

    y1, y2 = max(0, y), min(h, y + fh)
    x1, x2 = max(0, x), min(w, x + fw)
    if y1 >= y2 or x1 >= x2:
        return bg

    fg_y1 = y1 - y
    fg_y2 = fg_y1 + (y2 - y1)
    fg_x1 = x1 - x
    fg_x2 = fg_x1 + (x2 - x1)

    fg_crop = fg[fg_y1:fg_y2, fg_x1:fg_x2]
    alpha = (fg_crop[:, :, 3] / 255.0) * alpha_mult
    alpha = alpha[..., None]

    bg_patch = bg[y1:y2, x1:x2].astype(np.float32)
    fg_rgb = fg_crop[:, :, :3].astype(np.float32)

    blended = alpha * fg_rgb + (1 - alpha) * bg_patch
    bg[y1:y2, x1:x2] = blended.astype(np.uint8)
    return bg


def render_world(frame, world_objects, BASE_SIZE):
    
    """
    Optimized wworld renderer wwith caching.
    """
    out = frame
    
    

    for obj in world_objects:
        
        if not obj.get("active", True):
            continue
        
        if "img" not in obj or obj["img"] is None:
            continue
        
        
        
            if "_cached_img" not in obj:
                obj["_cached_img"] = None
                obj["_cached_scale"] = None
            obj["_cached_angle"] = None
            
        scale=obj.get("scale",1.0)
        angle =obj.get("current_angle",0.0)
        size=int(BASE_SIZE*scale)
        
        if(
        
        
            obj["_cached_img"] is None
            or obj["_cached_scale"] != size
            or obj["_cached_angle"] != angle
        ):
            
            base_img=obj["img"]
            
            if isinstance(base_img,np.ndarray):
                img=Image.fromarray(base_img)
            else:
                img=base_img
            img=img.resize((size,size),Image.Resampling.LANCZOS)
            
            if angle !=0:
                img = img.rotate(
                    math.degrees(angle),
                    expand=True,
                    resampling=Image.Resampling.BILINEAR,
                )
                
                obj["_cached_img"]=np.array(img)
                obj["_cached_img"]= size
                obj["_cached_img"]= angle
                

        img_np = obj["_cached_img"]
        
        if img_np is None:
            continue

        h, w = img_np.shape[:2]
        x = int(obj["pos"][0] - w // 2)
        y = int(obj["pos"][1] - h // 2)

        out = overlay_image_alpha(out, img_np, x, y, obj.get("alpha", 1.0))

        # highlight grabbed
        if obj.get("grabbed", False):
            cv2.circle(
                out,
                (int(obj["pos"][0]), int(obj["pos"][1])),
                max(6, size // 6),
                (255, 255, 255),
                2,
            )

    return out

#  render_slots

def render_slots(out, slot_states, SLOT_W, SLOT_H):
    """
    Draw slots, glow, and liquid contents
    """
    for s in slot_states:
        sx, sy = int(s["pos"][0]), int(s["pos"][1])

        x1 = sx - SLOT_W // 2
        y1 = sy - SLOT_H // 2
        x2 = sx + SLOT_W // 2
        y2 = sy + SLOT_H // 2

        # slot outline
        cv2.rectangle(out, (x1, y1), (x2, y2), (55, 55, 55), -1)
        cv2.rectangle(out, (x1, y1), (x2, y2), (200, 200, 200), 2)
        
        cv2.rectangle(out,(x1+4,y1+4),(x2+4,y2+4),(30,30,30),-1)
        
        # glow
        glow = s.get("glow", 0.0)
        if glow > 0.01:
            alpha = min(1.0, glow)
            glow_color = (
                int(180 * alpha + 60),
                int(160 * alpha + 60),
                int(80 * alpha + 60),
            )
            cv2.rectangle(out, (x1, y1), (x2, y2), glow_color, 2)

        # liquid contents
        total_vol = sum(c["vol"] for c in s.get("contents", []))
        if total_vol > 0.001:
            r = sum(c["color"][0] * c["vol"] for c in s["contents"]) / total_vol
            g = sum(c["color"][1] * c["vol"] for c in s["contents"]) / total_vol
            b = sum(c["color"][2] * c["vol"] for c in s["contents"]) / total_vol

            fill_h = int((SLOT_H - 10) * min(total_vol / 600.0, 1.0))

            cv2.rectangle(
                out,
                (x1 + 6, y2 - 6 - fill_h),
                (x2 - 6, y2 - 6),
                (int(b), int(g), int(r)),
                -1,
            )
            cv2.rectangle(
                out,
                (x1 + 6, y2 - 6 - fill_h),
                (x2 - 6, y2 - 6),
                (30, 30, 30),
                1,
            )

    return out

#lab_table

def render_platform_base(frame,desk_img,H):
    out = frame.copy()
    if desk_img is None:
        return out
    
    dh,dw=desk_img.shape[:2]
    
    target_h=int(H*0.30)
    
    scale = target_h/dh
    new_w = int(dw*scale)
    new_h = target_h
    
    desk=cv2.resize(desk_img, (new_w, new_h))
    y =H-new_h
    
    x=(out.shape[1]-new_w)//2
    
    if desk.shape[2]==4:
        out=overlay_image_alpha(out,desk,x,y)
    else:
        out[y:y+new_h, x:x+new_w]=desk
    
    return out

# render_toolbar 
def render_toolbar(out, toolbar_img, y=0):
    """
    Draws the toolbar image at the top of the screen.
    """
    if toolbar_img is None:
        return out

    h, w = toolbar_img.shape[:2]
    out[y:y+h, 0:w] = toolbar_img
    return out


#render_burner_flames

def render_burner_flames(out, world_objects, dt, BASE_SIZE):
    """
    Draw animated burner flames correctly positioned above burners.
    """
    for obj in world_objects:
        if obj.get("type") != "burner":
            continue
        if not obj.get("flame_on", False):
            continue

        frames = obj.get("flame_frames")
        if not frames:
            continue

        # Animate flame
        obj["flame_timer"] += dt
        if obj["flame_timer"] > 0.04:  # ~25 FPS
            obj["flame_timer"] = 0.0
            obj["flame_index"] = (obj["flame_index"] + 1) % len(frames)

        flame_img = frames[obj["flame_index"]]

        # --- SCALE FLAME RELATIVE TO BURNER ---
        burner_size = int(BASE_SIZE * obj.get("scale", 1.0))
        flame_width = int(burner_size * 0.6)
        flame_height = int(burner_size * 0.9)

        flame_img = flame_img.resize(
            (flame_width, flame_height),
            Image.Resampling.LANCZOS,
        )

        flame_np = np.array(flame_img)

        # --- POSITION FLAME ABOVE BURNER ---
        x = int(obj["pos"][0] - flame_width // 2)

        # Burner top = center - half size
        burner_top_y = obj["pos"][1] - burner_size // 2

        # Place flame slightly above burner top
        y = int(burner_top_y - flame_height + 10)

        out = overlay_image_alpha(out, flame_np, x, y, 1.0)

    return out


# render_particle


def render_particles(out, particles):
    """
    Draw smoke and droplet particles.
    """
    for p in particles:
        x, y = int(p["pos"][0]), int(p["pos"][1])

        if p["type"] == "smoke":
            alpha = max(0.0, min(1.0, p["life"] / 2.0))
            radius = int(p["size"] * alpha)
            if radius > 1:
                overlay = out.copy()
                cv2.circle(
                    overlay,
                    (x, y),
                    radius,
                    p["color"],
                    -1,
                )
                out = cv2.addWeighted(overlay, alpha * 0.6, out, 1 - alpha * 0.6, 0)

        elif p["type"] == "droplet":
            cv2.circle(
                out,
                (x, y),
                p["size"],
                p["color"],
                -1,
            )

    return out
