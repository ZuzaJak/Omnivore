/**
 * Omnivore - Procedural Biological Audio Engine
 * Zero external audio assets required.
 * Generates an organic, breathing primordial abyss soundscape:
 * viscous fluid currents, rhythmic protoplasmic pulses, ambient micro-bubbles,
 * wet membrane ruptures, and parasitic osmotic suction squelches.
 */

export class SoundSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.isInitialized = false;

    // Ambient soundscape nodes
    this.ambientGain = null;
    this.ambientOsc1 = null;
    this.ambientOsc2 = null;
    this.ambientFilter = null;
    this.lfo = null;
    this.lfoGain = null;
    this.fluidNoiseSource = null;
    this.fluidNoiseFilter = null;
    this.fluidNoiseGain = null;

    // Ambient micro-bubbles timer
    this.bubbleTimer = null;
  }

  init() {
    if (this.isInitialized) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.startAbyssAmbience();
      this.isInitialized = true;
    } catch (e) {
      console.warn("AudioContext could not be initialized:", e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : 0.75;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  /**
   * Generates a 4-second pink noise buffer simulating thick viscous fluid rushing
   */
  createFluidNoiseBuffer() {
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Filtered pink noise algorithm
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.14;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  /**
   * Initializes the living biological abyss drone:
   * 1. Viscous fluid friction currents (filtered looping pink noise)
   * 2. Rhythmic protoplasmic breathing sub-drone (~0.07Hz LFO cycle)
   * 3. Ambient micro-bubbles popping sporadically in the primordial soup
   */
  startAbyssAmbience() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Master ambient bus
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.24, t);
    this.ambientGain.connect(this.masterGain);

    // --- 1. Viscous Fluid Current (Pink Noise Stream) ---
    try {
      const noiseBuffer = this.createFluidNoiseBuffer();
      this.fluidNoiseSource = this.ctx.createBufferSource();
      this.fluidNoiseSource.buffer = noiseBuffer;
      this.fluidNoiseSource.loop = true;

      this.fluidNoiseFilter = this.ctx.createBiquadFilter();
      this.fluidNoiseFilter.type = "lowpass";
      this.fluidNoiseFilter.frequency.setValueAtTime(160, t);
      this.fluidNoiseFilter.Q.setValueAtTime(2.0, t);

      this.fluidNoiseGain = this.ctx.createGain();
      this.fluidNoiseGain.gain.setValueAtTime(0.35, t);

      this.fluidNoiseSource.connect(this.fluidNoiseFilter);
      this.fluidNoiseFilter.connect(this.fluidNoiseGain);
      this.fluidNoiseGain.connect(this.ambientGain);
      this.fluidNoiseSource.start(t);
    } catch (e) {
      console.warn("Fluid noise buffer init failed:", e);
    }

    // --- 2. Living Cellular Drone & Protoplasmic Pulse ---
    this.ambientFilter = this.ctx.createBiquadFilter();
    this.ambientFilter.type = "lowpass";
    this.ambientFilter.frequency.setValueAtTime(110, t);
    this.ambientFilter.Q.setValueAtTime(3.2, t);

    // Warm sub-bass oscillators detuned to create ~0.7Hz organic acoustic beating
    this.ambientOsc1 = this.ctx.createOscillator();
    this.ambientOsc1.type = "sine";
    this.ambientOsc1.frequency.setValueAtTime(43.5, t); // Deep F1

    this.ambientOsc2 = this.ctx.createOscillator();
    this.ambientOsc2.type = "triangle";
    this.ambientOsc2.frequency.setValueAtTime(65.2, t); // C2

    // Slow LFO for organic tissue inhalation/exhalation cycle (~14s)
    this.lfo = this.ctx.createOscillator();
    this.lfo.frequency.setValueAtTime(0.07, t);
    this.lfoGain = this.ctx.createGain();
    this.lfoGain.gain.setValueAtTime(45, t);
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.ambientFilter.frequency);
    if (this.fluidNoiseFilter) {
      this.lfoGain.connect(this.fluidNoiseFilter.frequency);
    }

    const oscSubGain = this.ctx.createGain();
    oscSubGain.gain.setValueAtTime(0.65, t);

    this.ambientOsc1.connect(this.ambientFilter);
    this.ambientOsc2.connect(this.ambientFilter);
    this.ambientFilter.connect(oscSubGain);
    oscSubGain.connect(this.ambientGain);

    this.ambientOsc1.start(t);
    this.ambientOsc2.start(t);
    this.lfo.start(t);

    // --- 3. Ambient Microscopic Bubbles ---
    this.scheduleNextBubble();
  }

  /**
   * Spawns faint, sporadic fluid micro-bubbles in the background
   */
  scheduleNextBubble() {
    if (this.bubbleTimer) clearTimeout(this.bubbleTimer);

    // Random interval between 1.8s and 4.2s
    const delayMs = 1800 + Math.random() * 2400;
    this.bubbleTimer = setTimeout(() => {
      this.playAmbientBubble();
      this.scheduleNextBubble();
    }, delayMs);
  }

  playAmbientBubble() {
    if (!this.ctx || this.isMuted || this.ctx.state !== "running") return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Gentle bubble frequency chirp (upward slide typical of liquid bubbles)
    const baseFreq = 260 + Math.random() * 420;
    osc.type = "sine";
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.55, t + 0.045);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(baseFreq * 1.2, t);
    filter.Q.setValueAtTime(4.5, t);

    // Soft, delicate volume
    const bubbleVolume = 0.035 + Math.random() * 0.04;
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(bubbleVolume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.065);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.075);
  }

  /**
   * Wet, organic consumption pop & viscous fluid assimilation gulp
   * Scale pitch inversely to size: tiny plankton = crisp high pop, giant prey = deep gelatinous gulp
   */
  playEat(pitch = 1) {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;

    // Component 1: Wet membrane rupture click/snap
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    const snapFilter = this.ctx.createBiquadFilter();

    snapOsc.type = "sine";
    const startSnapFreq = Math.min(1800, 680 * pitch);
    const endSnapFreq = Math.max(90, 180 * pitch);
    snapOsc.frequency.setValueAtTime(startSnapFreq, t);
    snapOsc.frequency.exponentialRampToValueAtTime(endSnapFreq, t + 0.04);

    snapFilter.type = "bandpass";
    snapFilter.frequency.setValueAtTime(startSnapFreq * 0.9, t);
    snapFilter.Q.setValueAtTime(2.5, t);

    snapGain.gain.setValueAtTime(0.38, t);
    snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    snapOsc.connect(snapFilter);
    snapFilter.connect(snapGain);
    snapGain.connect(this.masterGain);
    snapOsc.start(t);
    snapOsc.stop(t + 0.055);

    // Component 2: Viscous fluid suction / gulp body
    const gulpOsc = this.ctx.createOscillator();
    const gulpGain = this.ctx.createGain();
    const gulpFilter = this.ctx.createBiquadFilter();

    gulpOsc.type = "triangle";
    const gulpBaseFreq = Math.max(70, 220 * pitch);
    gulpOsc.frequency.setValueAtTime(gulpBaseFreq, t + 0.01);
    gulpOsc.frequency.exponentialRampToValueAtTime(gulpBaseFreq * 0.45, t + 0.16);

    gulpFilter.type = "lowpass";
    gulpFilter.frequency.setValueAtTime(Math.min(900, 480 * pitch), t);
    gulpFilter.Q.setValueAtTime(3.0, t);

    gulpGain.gain.setValueAtTime(0.001, t);
    gulpGain.gain.linearRampToValueAtTime(0.32, t + 0.02);
    gulpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    gulpOsc.connect(gulpFilter);
    gulpFilter.connect(gulpGain);
    gulpGain.connect(this.masterGain);
    gulpOsc.start(t + 0.01);
    gulpOsc.stop(t + 0.19);
  }

  /**
   * Parasite leech attack: Viscous predatory squelch, acidic osmotic suction
   */
  playLeech() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;

    // Component 1: Wet flesh pinch / puncture chirp
    const pinchOsc = this.ctx.createOscillator();
    const pinchGain = this.ctx.createGain();
    pinchOsc.type = "sawtooth";
    pinchOsc.frequency.setValueAtTime(540, t);
    pinchOsc.frequency.exponentialRampToValueAtTime(160, t + 0.12);

    const pinchFilter = this.ctx.createBiquadFilter();
    pinchFilter.type = "bandpass";
    pinchFilter.frequency.setValueAtTime(750, t);
    pinchFilter.Q.setValueAtTime(4.0, t);

    pinchGain.gain.setValueAtTime(0.42, t);
    pinchGain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

    pinchOsc.connect(pinchFilter);
    pinchFilter.connect(pinchGain);
    pinchGain.connect(this.masterGain);
    pinchOsc.start(t);
    pinchOsc.stop(t + 0.14);

    // Component 2: Rapid wet parasite suction flutter (~28Hz tremolo)
    const suckOsc = this.ctx.createOscillator();
    const suckGain = this.ctx.createGain();
    const tremoloOsc = this.ctx.createOscillator();
    const tremoloGain = this.ctx.createGain();

    suckOsc.type = "sine";
    suckOsc.frequency.setValueAtTime(320, t + 0.02);
    suckOsc.frequency.exponentialRampToValueAtTime(95, t + 0.22);

    tremoloOsc.frequency.setValueAtTime(28, t); // 28Hz rapid flutter
    tremoloGain.gain.setValueAtTime(0.18, t);
    tremoloOsc.connect(tremoloGain);

    suckGain.gain.setValueAtTime(0.01, t);
    suckGain.gain.linearRampToValueAtTime(0.35, t + 0.04);
    suckGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    tremoloGain.connect(suckGain.gain);

    suckOsc.connect(suckGain);
    suckGain.connect(this.masterGain);

    suckOsc.start(t + 0.02);
    tremoloOsc.start(t + 0.02);
    suckOsc.stop(t + 0.23);
    tremoloOsc.stop(t + 0.23);
  }

  /**
   * Jet dash: Hydrodynamic cavitation whoosh and protoplasmic contraction
   */
  playDash() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;

    // Filtered noise burst simulating fluid cavitation jet
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.28);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(700, t);
    filter.frequency.exponentialRampToValueAtTime(140, t + 0.26);
    filter.Q.setValueAtTime(1.8, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.48, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.27);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start(t);
    whiteNoise.stop(t + 0.28);

    // Deep fluid displacement sub-thump
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(105, t);
    subOsc.frequency.exponentialRampToValueAtTime(36, t + 0.22);

    subGain.gain.setValueAtTime(0.38, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.23);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);

    subOsc.start(t);
    subOsc.stop(t + 0.24);
  }

  /**
   * Soft rubbery membrane bounce against fluid boundaries
   */
  playBounce() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.14);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(220, t);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  /**
   * Cellular lysis / Dissolution on Game Over
   */
  playDeath() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    // Initial membrane rupture burst
    this.playEat(0.5);

    // Descending bioluminescent chords dissolving in the abyss
    const chord = [65.4, 82.4, 98.0, 130.8]; // C2, E2, G2, C3

    chord.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = idx % 2 === 0 ? "triangle" : "sine";
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.65, t + 2.2);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(280, t);
      filter.frequency.exponentialRampToValueAtTime(45, t + 2.4);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + 0.05);
      osc.stop(t + 2.5);
    });
  }
}
