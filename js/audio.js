/**
 * Omnivore - Action-Driven Natural Audio Engine
 * Purely procedural sound effects via HTML5 Web Audio API.
 * 
 * Design Principles:
 * - Zero Background Music: Total silence during idle navigation. No continuous loops,
 *   no streaming audio, and no background drones.
 * - Nature & Liquid Sound Effects Only: Short, crisp, organic procedural audio cues
 *   triggered strictly on specific player actions:
 *   - Soft water splashes / hydrodynamic pushes (Dash)
 *   - Liquid consumption drops / pops (Eat)
 *   - Gentle fluid friction / membrane bounce (Bounce)
 *   - Subtle organic ripples (Parasite interaction)
 *   - Gentle, brief cellular dissolution (Game Over)
 * - Ultra-Clean & Lightweight: Zero ongoing CPU usage or memory leaks; all Web Audio
 *   nodes are transient and terminate cleanly immediately after playback.
 */

export class SoundSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.isInitialized = false;
    this.isPaused = false;
  }

  init() {
    if (this.isInitialized) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
      this.isInitialized = true;
    } catch (e) {
      console.warn("Omnivore: AudioContext could not be initialized:", e);
    }
  }

  resume() {
    this.isPaused = false;
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  pause() {
    this.isPaused = true;
    if (this.ctx && this.ctx.state === "running") {
      this.ctx.suspend().catch(() => {});
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
   * Action: Organic Swallowing / Liquid Gulping & Glugging Sound
   * Synthesizes a natural, wet, visceral swallow / gulp when absorbing a cell:
   * 1. Wet liquid suction chirp (intake slurp)
   * 2. Resonant throat cavity "glug" (downward formant scoop)
   * 3. Wet fluid friction slosh (viscous membrane friction)
   * 4. Deep sub-throat displacement thump & settling closing bubble
   * Total silence immediately following the ~220ms decay.
   */
  playEat(pitch = 1) {
    if (!this.ctx || this.isMuted || this.isPaused) return;
    this.resume();

    const t = this.ctx.currentTime;
    const p = Math.max(0.45, Math.min(2.2, pitch));

    // --- Layer 1: Wet Liquid Suction Slurp (Transient intake) ---
    const slurpOsc = this.ctx.createOscillator();
    const slurpGain = this.ctx.createGain();

    slurpOsc.type = "sine";
    const slurpStart = Math.min(1400, 680 * p);
    const slurpEnd = Math.max(80, 240 * p);
    slurpOsc.frequency.setValueAtTime(slurpStart, t);
    slurpOsc.frequency.exponentialRampToValueAtTime(slurpEnd, t + 0.038);

    slurpGain.gain.setValueAtTime(0.001, t);
    slurpGain.gain.linearRampToValueAtTime(0.30, t + 0.006);
    slurpGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);

    slurpOsc.connect(slurpGain);
    slurpGain.connect(this.masterGain);
    slurpOsc.start(t);
    slurpOsc.stop(t + 0.05);

    // --- Layer 2: Resonant Fluid Cavity "Glug" (Deep swallowing body) ---
    const gulpOsc = this.ctx.createOscillator();
    const gulpGain = this.ctx.createGain();
    const gulpFilter = this.ctx.createBiquadFilter();

    gulpOsc.type = "triangle";
    const gulpStart = Math.min(600, 260 * p);
    const gulpMid = Math.max(65, 130 * p);
    const gulpEnd = Math.max(40, 75 * p);

    gulpOsc.frequency.setValueAtTime(gulpStart, t + 0.01);
    gulpOsc.frequency.exponentialRampToValueAtTime(gulpMid, t + 0.08);
    gulpOsc.frequency.exponentialRampToValueAtTime(gulpEnd, t + 0.19);

    gulpFilter.type = "lowpass";
    gulpFilter.frequency.setValueAtTime(Math.min(1100, 480 * p), t + 0.01);
    gulpFilter.frequency.exponentialRampToValueAtTime(Math.max(100, 160 * p), t + 0.18);
    gulpFilter.Q.setValueAtTime(3.6, t);

    gulpGain.gain.setValueAtTime(0.001, t + 0.01);
    gulpGain.gain.linearRampToValueAtTime(0.48, t + 0.035);
    gulpGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.20);

    gulpOsc.connect(gulpFilter);
    gulpFilter.connect(gulpGain);
    gulpGain.connect(this.masterGain);
    gulpOsc.start(t + 0.01);
    gulpOsc.stop(t + 0.21);

    // --- Layer 3: Wet Fluid Friction / Slosh (Cellular membrane intake) ---
    const noiseLen = Math.floor(this.ctx.sampleRate * 0.08);
    const noiseBuffer = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }

    const sloshNoise = this.ctx.createBufferSource();
    sloshNoise.buffer = noiseBuffer;

    const sloshFilter = this.ctx.createBiquadFilter();
    sloshFilter.type = "bandpass";
    sloshFilter.frequency.setValueAtTime(Math.min(1800, 740 * p), t + 0.01);
    sloshFilter.frequency.exponentialRampToValueAtTime(Math.max(120, 260 * p), t + 0.075);
    sloshFilter.Q.setValueAtTime(2.8, t);

    const sloshGain = this.ctx.createGain();
    sloshGain.gain.setValueAtTime(0.001, t + 0.01);
    sloshGain.gain.linearRampToValueAtTime(0.20, t + 0.022);
    sloshGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

    sloshNoise.connect(sloshFilter);
    sloshFilter.connect(sloshGain);
    sloshGain.connect(this.masterGain);
    sloshNoise.start(t + 0.01);
    sloshNoise.stop(t + 0.085);

    // --- Layer 4: Deep Sub-Throat Displacement Thump ---
    const thumpOsc = this.ctx.createOscillator();
    const thumpGain = this.ctx.createGain();

    thumpOsc.type = "sine";
    const thumpStart = Math.min(220, 115 * p);
    const thumpEnd = Math.max(32, 48 * p);
    thumpOsc.frequency.setValueAtTime(thumpStart, t + 0.03);
    thumpOsc.frequency.exponentialRampToValueAtTime(thumpEnd, t + 0.21);

    thumpGain.gain.setValueAtTime(0.001, t + 0.03);
    thumpGain.gain.linearRampToValueAtTime(0.40, t + 0.06);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

    thumpOsc.connect(thumpGain);
    thumpGain.connect(this.masterGain);
    thumpOsc.start(t + 0.03);
    thumpOsc.stop(t + 0.23);

    // --- Layer 5: Settling Fluid Gloop Bubble (Crisp swallow release) ---
    const bubbleOsc = this.ctx.createOscillator();
    const bubbleGain = this.ctx.createGain();

    bubbleOsc.type = "sine";
    const bStart = Math.min(450, 160 * p);
    const bEnd = Math.min(800, 270 * p);
    bubbleOsc.frequency.setValueAtTime(bStart, t + 0.07);
    bubbleOsc.frequency.exponentialRampToValueAtTime(bEnd, t + 0.12);

    bubbleGain.gain.setValueAtTime(0.001, t + 0.07);
    bubbleGain.gain.linearRampToValueAtTime(0.18, t + 0.085);
    bubbleGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.135);

    bubbleOsc.connect(bubbleGain);
    bubbleGain.connect(this.masterGain);
    bubbleOsc.start(t + 0.07);
    bubbleOsc.stop(t + 0.14);
  }

  /**
   * Action: Soft Water Splash / Hydrodynamic Push
   * Short, gentle fluid displacement whoosh when executing a dash.
   */
  playDash() {
    if (!this.ctx || this.isMuted || this.isPaused) return;
    this.resume();

    const t = this.ctx.currentTime;

    // Soft water splash noise burst (160ms)
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.18);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(500, t);
    filter.frequency.exponentialRampToValueAtTime(140, t + 0.16);
    filter.Q.setValueAtTime(2.2, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.32, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.17);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noiseSource.start(t);
    noiseSource.stop(t + 0.18);

    // Subtle fluid momentum sine pulse
    const pushOsc = this.ctx.createOscillator();
    const pushGain = this.ctx.createGain();

    pushOsc.type = "sine";
    pushOsc.frequency.setValueAtTime(130, t);
    pushOsc.frequency.exponentialRampToValueAtTime(65, t + 0.16);

    pushGain.gain.setValueAtTime(0.001, t);
    pushGain.gain.linearRampToValueAtTime(0.26, t + 0.015);
    pushGain.gain.exponentialRampToValueAtTime(0.001, t + 0.17);

    pushOsc.connect(pushGain);
    pushGain.connect(this.masterGain);

    pushOsc.start(t);
    pushOsc.stop(t + 0.18);
  }

  /**
   * Action: Gentle Fluid Friction / Membrane Deflection
   * Soft, organic singing droplet when deflecting off arena bounds.
   */
  playBounce() {
    if (!this.ctx || this.isMuted || this.isPaused) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.12);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(260, t);
    filter.Q.setValueAtTime(1.5, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  /**
   * Action: Subtle Parasite Fluid Perturbation
   * A delicate, organic surface tension ripple when grazed by a parasite.
   */
  playLeech() {
    if (!this.ctx || this.isMuted || this.isPaused) return;
    this.resume();

    const t = this.ctx.currentTime;

    // Dual soft liquid droplets (440Hz + 520Hz)
    const freqs = [440, 520];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.82, t + 0.12);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + idx * 0.015);
      osc.stop(t + 0.16);
    });
  }

  /**
   * Action: Gentle Cellular Dissolution (Game Over)
   * A brief, soft liquid fade (three descending droplet tones over 650ms).
   */
  playDeath() {
    if (!this.ctx || this.isMuted || this.isPaused) return;
    this.resume();

    const t = this.ctx.currentTime;
    const chord = [240, 190, 140];

    chord.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.75, t + idx * 0.08 + 0.28);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.20, t + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.08 + 0.32);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.35);
    });
  }
}
