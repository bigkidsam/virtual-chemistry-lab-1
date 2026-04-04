import json
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import cv2


_HOST = "127.0.0.1"
_PORT = 8765

_state_lock = threading.Lock()
_state = {
    "hands": [],
    "audioEvent": None,
    "paused": False,
    "timestamp": 0.0,
    "frameTimestamp": 0.0,
}
_frame_bytes = None

_server = None
_thread = None


def publish_bridge_state(hands, audio_event=None, paused=False):
    snapshot = {
        "hands": hands,
        "audioEvent": audio_event,
        "paused": paused,
        "timestamp": time.time(),
    }
    with _state_lock:
        _state.update(snapshot)


def publish_bridge_frame(frame_bgr, quality=70):
    global _frame_bytes

    ok, encoded = cv2.imencode(
        ".jpg",
        frame_bgr,
        [int(cv2.IMWRITE_JPEG_QUALITY), int(quality)],
    )
    if not ok:
        return

    with _state_lock:
        _frame_bytes = encoded.tobytes()
        _state["frameTimestamp"] = time.time()


class _BridgeHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        route = self.path.split("?", 1)[0]
        if route == "/health":
            self._write_json(200, {"ok": True})
            return

        if route == "/state":
            with _state_lock:
                snapshot = dict(_state)
            self._write_json(200, snapshot)
            return

        if route == "/frame.jpg":
            with _state_lock:
                frame_bytes = _frame_bytes

            if frame_bytes is None:
                self._write_json(404, {"error": "No frame available"})
                return

            self._write_bytes(200, frame_bytes, "image/jpeg")
            return

        self._write_json(404, {"error": "Not found"})

    def log_message(self, format, *args):
        return

    def _write_json(self, status_code, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _write_bytes(self, status_code, body, content_type):
        self.send_response(status_code)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def start_bridge_server(host=_HOST, port=_PORT):
    global _server, _thread

    if _server is not None:
        return True

    try:
        _server = ThreadingHTTPServer((host, port), _BridgeHandler)
    except OSError as exc:
        print(f"[Bridge] Failed to start on http://{host}:{port}: {exc}")
        _server = None
        return False

    _thread = threading.Thread(target=_server.serve_forever, daemon=True)
    _thread.start()
    print(f"[Bridge] Streaming gesture state on http://{host}:{port}/state")
    return True


def stop_bridge_server():
    global _server, _thread

    if _server is None:
        return

    _server.shutdown()
    _server.server_close()
    if _thread is not None:
        _thread.join(timeout=1.0)

    _server = None
    _thread = None
