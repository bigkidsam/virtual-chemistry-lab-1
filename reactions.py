from config import REACTION_DURATION


def clamp(value, low, high):
    return max(low, min(high, value))


REACTION_RECIPES = {
    frozenset({"flask", "beaker"}): {
        "name": "Neutralization",
        "result_color": (120, 220, 120),
        "gas_rate": 5,
    },
    frozenset({"flask", "test_tube"}): {
        "name": "Precipitation",
        "result_color": (245, 210, 90),
        "gas_rate": 3,
    },
    frozenset({"beaker", "test_tube"}): {
        "name": "Complex Formation",
        "result_color": (185, 110, 235),
        "gas_rate": 4,
    },
}


def select_recipe(contents):
    """Choose a recipe based on which container sources have contributed liquid."""
    reagent_ids = {c.get("id") for c in contents if c.get("vol", 0.0) > 0}
    if len(reagent_ids) < 2:
        return None

    for reagent_pair, recipe in REACTION_RECIPES.items():
        if reagent_pair.issubset(reagent_ids):
            return recipe

    return {
        "name": "Generic Heated Mix",
        "result_color": (180, 180, 255),
        "gas_rate": 2,
    }


def trigger_reaction(slot, now):
    """Start a timed slot reaction when enough reagents exist."""
    recipe = select_recipe(slot.get("contents", []))
    if recipe is None:
        return False

    slot["reaction"] = {
        "start": now,
        "duration": REACTION_DURATION,
        "name": recipe["name"],
        "result_color": recipe["result_color"],
        "gas_rate": recipe["gas_rate"],
    }
    slot["reaction_start"] = now
    slot["reaction_result"] = recipe
    slot["glow"] = clamp(slot.get("glow", 0.0) + 0.35, 0.0, 1.0)
    print(f"[REACTION] {recipe['name']} triggered")
    return True


def blend_reaction_contents(slot, mix_strength=0.18):
    """Blend slot contents toward reaction color while reaction is active."""
    reaction = slot.get("reaction")
    contents = slot.get("contents", [])
    if not reaction or not contents:
        return

    rr, rg, rb = reaction["result_color"]
    for content in contents:
        cr, cg, cb = content["color"]
        content["color"] = (
            int(cr + (rr - cr) * mix_strength),
            int(cg + (rg - cg) * mix_strength),
            int(cb + (rb - cb) * mix_strength),
        )
