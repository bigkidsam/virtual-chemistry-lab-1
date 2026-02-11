from collections import deque

class LabState:
    def __init__(self):
        # World
        self.world_objects = []
        self.slot_states = []
        self.particles = []
        self.droplets = []

        # Hand tracking
        self.hand_buffers = {
            "Left": deque(maxlen=5),
            "Right": deque(maxlen=5),
        }

        self.pinch_prev = {
            "Left": False,
            "Right": False,
        }

        # Time
        self.time = 0.0

        # UI
        self.toolbar = None
        self.icon_positions = []
