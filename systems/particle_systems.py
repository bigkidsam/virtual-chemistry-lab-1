import numpy as np
import random


def update(particles, dt):
    """
    Update and decay particles.
    """
    alive = []

    for p in particles:
        p["life"] -= dt
        if p["life"] <= 0:
            continue

        # Move
        p["pos"] += p["vel"] * dt

        # Smoke slowly rises & spreads
        if p["type"] == "smoke":
            p["vel"][0] *= 0.98
            p["vel"][1] *= 0.97

        alive.append(p)

    particles[:] = alive


def spawn_smoke(particles, x, y, count=3):
    """
    Spawn smoke particles at position.
    """
    for _ in range(count):
        particles.append({
            "pos": np.array([x, y], float),
            "vel": np.array([
                random.uniform(-10, 10),
                random.uniform(-40, -20),
            ], float),
            "life": random.uniform(1.0, 2.0),
            "type": "smoke",
            "size": random.randint(10, 18),
            "color": (200, 200, 200),
        })


def spawn_droplet(particles, x, y, color):
    """
    Spawn a liquid droplet.
    """
    particles.append({
        "pos": np.array([x, y], float),
        "vel": np.array([
            random.uniform(-10, 10),
            random.uniform(60, 120),
        ], float),
        "life": 1.5,
        "type": "droplet",
        "size": 6,
        "color": color,
    })
