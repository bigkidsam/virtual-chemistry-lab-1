import numpy as np
import math


# ------------------------------------------------------------
# CLAMP A VALUE BETWEEN MIN/MAX
# ------------------------------------------------------------
def clamp(value, min_val, max_val):
    """
    Ensures 'value' stays between min_val and max_val.
    """
    return max(min_val, min(value, max_val))


# ------------------------------------------------------------
# 2D DISTANCE BETWEEN TWO POINTS
# ------------------------------------------------------------
def distance(p1, p2):
    """
    Returns Euclidean distance between two points (x1,y1) and (x2,y2)
    """
    return math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)


# ------------------------------------------------------------
# LINEAR INTERPOLATION (LERP)
# ------------------------------------------------------------
def lerp(a, b, t):
    """
    Smooth blending between values.
    t = 0 → returns a
    t = 1 → returns b
    """
    return a + (b - a) * t


# ------------------------------------------------------------
# COLOR BLENDING FUNCTION
# ------------------------------------------------------------
def blend_color(c1, c2, factor=0.5):
    """
    Blends two RGB colors.
    factor = 0.0 → 100% c1
    factor = 1.0 → 100% c2
    """
    r = int(c1[0] * (1 - factor) + c2[0] * factor)
    g = int(c1[1] * (1 - factor) + c2[1] * factor)
    b = int(c1[2] * (1 - factor) + c2[2] * factor)
    return (r, g, b)


# ------------------------------------------------------------
# CHECK IF A POINT IS INSIDE A RECTANGLE
# ------------------------------------------------------------
def point_in_rect(px, py, rx, ry, rw, rh):
    """
    Returns True if point (px,py) is inside rectangle (rx,ry,rw,rh)
    """
    return (rx <= px <= rx + rw) and (ry <= py <= ry + rh)


# ------------------------------------------------------------
# SMOOTH STEPPING FUNCTION (OPTIONAL)
# ------------------------------------------------------------
def smoothstep(edge0, edge1, x):
    """
    Smooth curve between 0 and 1.
    Useful for visual effects.
    """
    x = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0)
    return x * x * (3 - 2 * x)



import numpy as np

def distance_sq(a, b):
    """
    Squared distance between two points (numpy arrays).
    Faster than sqrt distance.
    """
    d = a - b
    return d[0] * d[0] + d[1] * d[1]
