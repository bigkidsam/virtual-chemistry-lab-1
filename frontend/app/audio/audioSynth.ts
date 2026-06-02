class AudioSynth {
  private ctx: AudioContext | null = null;
  private sizzleSource: AudioBufferSourceNode | null = null;
  private sizzleGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      // AudioContext will be initialized on first user interaction
    }
  }

  private initCtx() {
    if (this.ctx) return;
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
      this.createNoiseBuffer();
    }
  }

  private createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  playBubble() {
    this.initCtx();
    if (!this.ctx) return;
    
    // Bubble popping sound: sine wave sweep rising in pitch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = "sine";
    const startFreq = 200 + Math.random() * 150;
    const endFreq = startFreq + 400 + Math.random() * 200;
    
    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + 0.12);
    
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playSizzle(intensity: number) {
    this.initCtx();
    if (!this.ctx || !this.noiseBuffer) return;

    if (this.sizzleSource) {
      // adjust gain based on intensity
      if (this.sizzleGain) {
        this.sizzleGain.gain.setValueAtTime(intensity * 0.15, this.ctx.currentTime);
      }
      return;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1600, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.0, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(intensity * 0.15, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    source.start();
    this.sizzleSource = source;
    this.sizzleGain = gain;
  }

  stopSizzle() {
    if (this.sizzleSource) {
      try {
        this.sizzleSource.stop();
      } catch {}
      this.sizzleSource = null;
      this.sizzleGain = null;
    }
  }

  playSuccess() {
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Play a beautiful C-major chord arpeggio
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      
      gain.gain.setValueAtTime(0.06, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45);
      
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.5);
    });
  }

  playExplosion() {
    this.initCtx();
    if (!this.ctx || !this.noiseBuffer) return;

    const now = this.ctx.currentTime;
    
    // Low-pass filtered noise blast
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(10, now + 0.6);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    source.start(now);
    source.stop(now + 0.85);

    // Add sub-bass rumble
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    
    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(80, now);
    subOsc.frequency.linearRampToValueAtTime(20, now + 0.5);
    
    subGain.gain.setValueAtTime(0.25, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    
    subOsc.start(now);
    subOsc.stop(now + 0.55);
  }
}

export const synth = typeof window !== "undefined" ? new AudioSynth() : null;
