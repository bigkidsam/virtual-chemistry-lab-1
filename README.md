# Virtual Chemistry Lab 1

A hand-tracked virtual chemistry lab prototype built with OpenCV + MediaPipe.

## Current status (Phase 1 → Phase 4)
- Phase 1 focused on runtime reliability and cleaner control flow.
- Phase 2 added slot-aware interactions and burner heat behavior.
- Phase 3 added recipe-based reactions, incremental slot mixing, and reaction feedback.
- Phase 4 adds runtime packaging improvements: CLI startup options and basic unit tests.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

## Run

```bash
python main.py
```

Optional runtime flags:

```bash
python main.py --windowed
python main.py --camera-index 0
```

## Controls
- Pinch with one hand near a tool to grab it.
- Release pinch to drop it.
- Place different containers into the same slot to pour/mix liquids incrementally.
- Heat mixed slots with a burner below them to trigger recipe-based reactions.
- Press `Esc` to exit.

## Notes
- A webcam is required.
- The app starts in fullscreen mode.


## Tests

```bash
python -m unittest discover -s tests -p "test_*.py"
```
