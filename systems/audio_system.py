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
    def __init__(
        self,
        threshold=0.10,
        timeout=0.6,
        debounce=0.35,
        warmup=1.0,
        spike_multiplier=3.0,
        noise_alpha=0.02,
    ):
        self.threshold = threshold  # absolute RMS threshold
        self.timeout = timeout  # max time to wait for a 2nd snap
        self.debounce = debounce
        self.warmup = warmup
        self.spike_multiplier = spike_multiplier
        self.noise_alpha = noise_alpha
        self.running = False
        self.stream = None
        
        self.snap_times = []
        self.events = [] # stores "SINGLE_SNAP" or "DOUBLE_SNAP"
        self.started_at = 0.0
        self.noise_floor = threshold * 0.25
        
        self.lock = threading.Lock()
        
    def audio_callback(self, indata, frames, time_info, status):
        # Calculate RMS
        rms = float(np.sqrt(np.mean(indata**2)))
        now = time.time()

        with self.lock:
            # Track the ambient noise floor so fans / room hum do not look like snaps.
            self.noise_floor = (
                (1.0 - self.noise_alpha) * self.noise_floor
                + self.noise_alpha * rms
            )

            # Ignore startup noise while the mic level settles.
            if now - self.started_at < self.warmup:
                return

            dynamic_threshold = max(self.threshold, self.noise_floor * self.spike_multiplier)
            if rms <= dynamic_threshold:
                return

            # Debounce repeated peaks caused by echo/reverb.
            if not self.snap_times or (now - self.snap_times[-1]) > self.debounce:
                self.snap_times.append(now)

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
            self.started_at = time.time()
            self.noise_floor = self.threshold * 0.25
            
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
                        print("[AUDIO] SINGLE SNAP")
                        self.snap_times.clear()
                elif len(self.snap_times) >= 2:
                    # Double snap detected!
                    self.events.append("DOUBLE_SNAP")
                    print("[AUDIO] DOUBLE SNAP")
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
detector = AudioSnapDetector(
    threshold=0.10,
    timeout=0.6,
    debounce=0.35,
    warmup=1.0,
    spike_multiplier=3.0,
)
