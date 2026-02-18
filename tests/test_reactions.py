import unittest

from reactions import blend_reaction_contents, select_recipe, trigger_reaction


class ReactionsTest(unittest.TestCase):
    def test_select_recipe_requires_two_reagents(self):
        recipe = select_recipe([{"id": "flask", "color": (0, 0, 0), "vol": 10.0}])
        self.assertIsNone(recipe)

    def test_select_recipe_returns_named_recipe(self):
        recipe = select_recipe(
            [
                {"id": "flask", "color": (0, 0, 0), "vol": 10.0},
                {"id": "beaker", "color": (0, 0, 0), "vol": 10.0},
            ]
        )
        self.assertIsNotNone(recipe)
        self.assertEqual(recipe["name"], "Neutralization")

    def test_trigger_reaction_writes_metadata(self):
        slot = {
            "contents": [
                {"id": "flask", "color": (50, 60, 70), "vol": 60.0},
                {"id": "beaker", "color": (60, 70, 80), "vol": 60.0},
            ],
            "glow": 0.2,
        }
        triggered = trigger_reaction(slot, now=10.0)
        self.assertTrue(triggered)
        self.assertIn("reaction", slot)
        self.assertEqual(slot["reaction"]["name"], "Neutralization")

    def test_blend_reaction_contents_moves_color(self):
        slot = {
            "reaction": {"result_color": (200, 220, 240)},
            "contents": [{"id": "flask", "color": (100, 100, 100), "vol": 100.0}],
        }
        blend_reaction_contents(slot, mix_strength=0.5)
        self.assertEqual(slot["contents"][0]["color"], (150, 160, 170))


if __name__ == "__main__":
    unittest.main()
