# Virtual Chemistry Lab 1

A hand-tracked virtual chemistry lab prototype built with OpenCV + MediaPipe.

## Phase 1 status (stabilization)
This phase focuses on runtime reliability and cleaner control flow.

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

## Controls
- Pinch with one hand near a tool to grab it.
- Release pinch to drop it.
- Press `Esc` to exit.

## Notes
- A webcam is required.
- The app starts in fullscreen mode.
