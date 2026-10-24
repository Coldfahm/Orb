/**
 * Synthesizes subtle haptic clicks, bites, ambient music, and zen soundscapes via Web Audio API.
 * Uses zero external audio files for 100% offline reliability and <1ms latency.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private musicInterval: NodeJS.Timeout | null = null;
  private isMusicPlaying: boolean = false;
  private musicStep: number = 0;
  private masterGain: GainNode | null = null;
  public volume: number = 0.8; // 0.0 to 1.0

  // Zen Ambient nodes
  private ambientSource: AudioNode | null = null;
  private ambientGain: GainNode | null = null;
  public activeAmbiance: 'rain' | 'waves' | 'campfire' | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMasterVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    this.initCtx();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  private getDestination(): AudioNode {
    this.initCtx();
    return this.masterGain || this.ctx!.destination;
  }

  playTick() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.getDestination());

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Pitch-scaled tick when scrolling volume
   */
  playVolumeTick(volumePercent: number) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Pitch ascends from 200Hz to 600Hz as volume increases
      const baseFreq = 200 + (volumePercent / 100) * 400;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, this.ctx.currentTime + 0.03);

      gain.gain.setValueAtTime(0.06 * (volumePercent / 100), this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(this.getDestination());

      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    } catch {
      // ignore
    }
  }

  playBite() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(320, now);
      osc1.frequency.exponentialRampToValueAtTime(140, now + 0.08);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(480, now + 0.03);
      osc2.frequency.exponentialRampToValueAtTime(220, now + 0.12);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.getDestination());

      osc1.start(now);
      osc1.stop(now + 0.08);
      osc2.start(now + 0.03);
      osc2.stop(now + 0.14);
    } catch {
      // ignore
    }
  }

  playChime() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.5];

      freqs.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);

        gain.gain.setValueAtTime(0.08, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.6);

        osc.connect(gain);
        gain.connect(this.getDestination());

        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.6);
      });
    } catch {
      // ignore
    }
  }

  playPop() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.05);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.getDestination());

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // ignore
    }
  }

  startMusic() {
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.initCtx();

    const melody = [311.13, 392.0, 466.16, 523.25, 349.23, 392.0, 466.16, 311.13];
    const bass = [130.81, 130.81, 155.56, 174.61];

    this.musicInterval = setInterval(() => {
      if (!this.enabled || !this.isMusicPlaying || !this.ctx || this.volume <= 0) return;
      try {
        const now = this.ctx.currentTime;
        const noteIdx = this.musicStep % melody.length;
        const bassIdx = Math.floor(this.musicStep / 2) % bass.length;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(melody[noteIdx], now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        osc.connect(gain);
        gain.connect(this.getDestination());
        osc.start(now);
        osc.stop(now + 0.35);

        if (this.musicStep % 2 === 0) {
          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();
          bassOsc.type = 'triangle';
          bassOsc.frequency.setValueAtTime(bass[bassIdx], now);
          bassGain.gain.setValueAtTime(0.05, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          bassOsc.connect(bassGain);
          bassGain.connect(this.getDestination());
          bassOsc.start(now);
          bassOsc.stop(now + 0.5);
        }

        this.musicStep++;
      } catch {
        // ignore
      }
    }, 450);
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  stopAmbiance() {
    if (this.ambientGain && this.ctx) {
      try {
        this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.3);
      } catch {
        // ignore
      }
    }
    this.activeAmbiance = null;
  }

  startRain() {
    this.stopAmbiance();
    this.initCtx();
    if (!this.ctx) return;
    this.activeAmbiance = 'rain';

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.getDestination());

    whiteNoise.start();
    this.ambientSource = whiteNoise;
    this.ambientGain = gain;
  }

  startOcean() {
    this.stopAmbiance();
    this.initCtx();
    if (!this.ctx) return;
    this.activeAmbiance = 'waves';

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(0.14, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.getDestination());

    noise.start();
    this.ambientSource = noise;
    this.ambientGain = gain;
  }

  startCampfire() {
    this.stopAmbiance();
    this.initCtx();
    if (!this.ctx) return;
    this.activeAmbiance = 'campfire';

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const isPop = Math.random() < 0.002;
      data[i] = isPop ? (Math.random() * 2 - 1) * 0.8 : (Math.random() * 2 - 1) * 0.08;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.07, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.getDestination());

    noise.start();
    this.ambientSource = noise;
    this.ambientGain = gain;
  }
}

export const sound = new SoundEngine();
