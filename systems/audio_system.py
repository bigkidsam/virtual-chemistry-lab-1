import numpy as np
import time
import threading

try:
    import sounddevice as sd
except ImportError:
    print("[audio_system.py] WARNING: sounddevice not found. Audio snap detection disabled.")
    sd = None

# Detect loud, sharp noises
# A simple RMS approach over short blocks
SAMPLERATE = 44100
BLOCKSIZE = 1024

class AudioSnapDetector:
    def __init__(self, threshold=0.03, timeout=1.0):
        self.threshold = threshold # RMS threshold
        self.timeout = timeout # max time to wait for a 2nd snap
        self.running = False
        self.stream = None
        
        self.snap_times = []
        self.events = [] # stores "SINGLE_SNAP" or "DOUBLE_SNAP"
        
        self.lock = threading.Lock()
        
    def audio_callback(self, indata, frames, time_info, status):
        # Calculate RMS
        rms = np.sqrt(np.mean(indata**2))
        if rms > self.threshold:
            now = time.time()
            with self.lock:
                # Debounce: if very close to last snap, ignore (echo/reverb)
                if not self.snap_times or (now - self.snap_times[-1]) > 0.15:
                    self.snap_times.append(now)
                    print(f"[AUDIO] SNAP DETECTED! rms={rms:.3f}")

    def start(self):
        if sd is None:
            return
            
        try:
            self.stream = sd.InputStream(
                channels=1,
                samplerate=SAMPLERATE,
                blocksize=BLOCKSIZE,
                callback=self.audio_callback
            )
            self.stream.start()
            self.running = True
            
            # Start background processor thread
            threading.Thread(target=self._process_snaps, daemon=True).start()
            print("[AUDIO] Snap detection started.")
        except Exception as e:
            print(f"[AUDIO] Failed to start audio stream: {e}")
            
    def _process_snaps(self):
        while self.running:
            time.sleep(0.05)
            now = time.time()
            with self.lock:
                if len(self.snap_times) == 1:
                    # Waiting to see if a second snap comes
                    if now - self.snap_times[0] > self.timeout:
                        # Timer expired, it's a single snap
                        self.events.append("SINGLE_SNAP")
                        self.snap_times.clear()
                elif len(self.snap_times) >= 2:
                    # Double snap detected!
                    self.events.append("DOUBLE_SNAP")
                    self.snap_times.clear()

    def get_latest_event(self):
        with self.lock:
            if self.events:
                return self.events.pop(0)
            return None
            
    def stop(self):
        self.running = False
        if self.stream:
            self.stream.stop()
            self.stream.close()

# Global instance for easy import
detector = AudioSnapDetector(threshold=0.03, timeout=1.5) # 1.5s window for double snap
