(function() {
"use strict";

/* === js/math.js === */
/**
 * Omnivore - Mathematical & Vector Utilities
 * Provides 2D vector operations, random distributions, interpolation,
 * and biological color utilities.
 */
class Vector2D {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  clone() {
    return new Vector2D(this.x, this.y);
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  mult(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  div(scalar) {
    if (scalar !== 0) {
      this.x /= scalar;
      this.y /= scalar;
    }
    return this;
  }

  magSq() {
    return this.x * this.x + this.y * this.y;
  }

  mag() {
    return Math.hypot(this.x, this.y);
  }

  heading() {
    return Math.atan2(this.y, this.x);
  }

  normalize() {
    const m = this.mag();
    if (m > 0) {
      this.div(m);
    }
    return this;
  }

  limit(max) {
    const mSq = this.magSq();
    if (mSq > max * max) {
      this.div(Math.sqrt(mSq)).mult(max);
    }
    return this;
  }

  dist(v) {
    return Math.hypot(this.x - v.x, this.y - v.y);
  }

  distSq(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return dx * dx + dy * dy;
  }

  lerp(v, t) {
    this.x += (v.x - this.x) * t;
    this.y += (v.y - this.y) * t;
    return this;
  }

  static fromAngle(angle, length = 1) {
    return new Vector2D(Math.cos(angle) * length, Math.sin(angle) * length);
  }

  static dist(v1, v2) {
    return Math.hypot(v1.x - v2.x, v1.y - v2.y);
  }

  static sub(v1, v2) {
    return new Vector2D(v1.x - v2.x, v1.y - v2.y);
  }
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}
function randomRange(min, max) {
  return min + Math.random() * (max - min);
}
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Converts HSL to hsla string with custom alpha
 */
function hsla(h, s, l, a = 1) {
  return `hsla(${h}, ${s}%, ${l}%, ${a})`;
}


/* === js/audio.js === */
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
class SoundSystem {
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


/* === js/particle.js === */
/**
 * Omnivore - Visual Particle & Juice System (Three.js 3D Microcosm)
 * Handles glowing cytoplasm bursts, dash trails, 3D shockwave rings,
 * and floating mass indicator text on the overlay canvas.
 */

function getParticleTexture() {
  const THREE = window.THREE;
  if (!THREE) return null;
  if (ParticleManager._sharedTexture) return ParticleManager._sharedTexture;

  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");

  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
  grad.addColorStop(0.3, "rgba(255, 255, 255, 0.8)");
  grad.addColorStop(0.7, "rgba(255, 255, 255, 0.2)");
  grad.addColorStop(1, "rgba(255, 255, 255, 0.0)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  ParticleManager._sharedTexture = new THREE.CanvasTexture(canvas);
  return ParticleManager._sharedTexture;
}
class Particle {
  constructor(x = 0, y = 0, vx = 0, vy = 0, color = "#fff", radius = 3, life = 30) {
    this.pos = new Vector2D(x, y);
    this.vel = new Vector2D(vx, vy);
    this.color = color;
    this.radius = radius;
    this.baseRadius = radius;
    this.maxLife = life;
    this.life = life;
    this.isDead = false;
    this.drag = 0.94;
    this.r = 1;
    this.g = 1;
    this.b = 1;
    this.parseColor(color);
  }

  parseColor(colorStr) {
    const THREE = window.THREE;
    if (THREE) {
      try {
        const c = new THREE.Color(colorStr);
        this.r = c.r;
        this.g = c.g;
        this.b = c.b;
      } catch (e) {
        this.r = 0.22;
        this.g = 1.0;
        this.b = 0.08;
      }
    }
  }

  init(x, y, vx, vy, color, radius, life) {
    this.pos.set(x, y);
    this.vel.set(vx, vy);
    this.color = color;
    this.radius = radius;
    this.baseRadius = radius;
    this.maxLife = life;
    this.life = life;
    this.isDead = false;
    this.drag = 0.94;
    this.parseColor(color);
  }

  update(dt = 1) {
    this.life -= dt;
    if (this.life <= 0) {
      this.isDead = true;
      return;
    }

    this.vel.mult(this.drag);
    this.pos.add(this.vel);
  }

  render(ctx) {
    if (!ctx) return;
    const progress = this.life / this.maxLife;
    const currentRadius = Math.max(0.2, this.baseRadius * progress);

    ctx.globalAlpha = Math.max(0, progress);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, currentRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}
class ShockwaveRing {
  constructor(x = 0, y = 0, maxRadius = 30, color = "#39ff14", duration = 25) {
    this.pos = new Vector2D(x, y);
    this.currentRadius = 4;
    this.maxRadius = maxRadius;
    this.color = color;
    this.duration = duration;
    this.life = duration;
    this.isDead = false;

    this.threeMesh = null;
    this.threeMaterial = null;
  }

  init(x, y, maxRadius, color, duration) {
    this.pos.set(x, y);
    this.currentRadius = 4;
    this.maxRadius = maxRadius;
    this.color = color;
    this.duration = duration;
    this.life = duration;
    this.isDead = false;

    if (this.threeMesh && this.threeMaterial) {
      this.threeMesh.visible = true;
      this.threeMesh.position.set(x, y, 1);
      this.threeMesh.scale.set(4, 4, 1);
      try {
        this.threeMaterial.color.set(color);
      } catch (e) {
        this.threeMaterial.color.set(0x39ff14);
      }
      this.threeMaterial.opacity = 0.8;
    }
  }

  update(dt = 1) {
    this.life -= dt;
    if (this.life <= 0) {
      this.isDead = true;
      if (this.threeMesh) this.threeMesh.visible = false;
      return;
    }

    const t = 1 - this.life / this.duration;
    this.currentRadius = 4 + (this.maxRadius - 4) * (1 - Math.pow(1 - t, 3));

    if (this.threeMesh && this.threeMaterial) {
      const alpha = Math.max(0, this.life / this.duration);
      this.threeMesh.scale.set(this.currentRadius, this.currentRadius, 1);
      this.threeMaterial.opacity = alpha * 0.85;
    }
  }

  render(ctx) {
    if (!ctx) return;
    const alpha = Math.max(0, this.life / this.duration);
    ctx.strokeStyle = this.color;
    ctx.globalAlpha = alpha * 0.8;
    ctx.lineWidth = Math.max(1, 3.5 * alpha);
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.currentRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
}
class FloatingText {
  constructor(x, y, text, color = "#86efac", fontSize = 16) {
    this.pos = new Vector2D(x, y);
    this.text = text;
    this.color = color;
    this.fontSize = fontSize;
    this.life = 40;
    this.maxLife = 40;
    this.isDead = false;
    this.vy = -1.2;
  }

  update(dt = 1) {
    this.life -= dt;
    if (this.life <= 0) {
      this.isDead = true;
      return;
    }
    this.pos.y += this.vy;
    this.vy *= 0.96;
  }

  render(ctx, camera) {
    if (!ctx) return;
    const alpha = Math.max(0, this.life / this.maxLife);
    let drawX = this.pos.x;
    let drawY = this.pos.y;

    if (camera) {
      const screenPos = camera.worldToScreen(this.pos.x, this.pos.y);
      drawX = screenPos.x;
      drawY = screenPos.y;
    }

    ctx.globalAlpha = alpha;
    ctx.font = `700 ${this.fontSize}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = this.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;
    ctx.fillText(this.text, drawX, drawY);
    ctx.shadowBlur = 0;
  }
}
class ParticleManager {
  constructor() {
    this.particles = [];
    this.shockwaves = [];
    this.floatingTexts = [];

    this.maxParticles = 300;
    this.particlePool = [];
    for (let i = 0; i < 200; i++) {
      this.particlePool.push(new Particle());
    }

    this.shockwavePool = [];
    for (let i = 0; i < 35; i++) {
      this.shockwavePool.push(new ShockwaveRing());
    }

    // Three.js 3D Particle Systems
    this.pointsMesh = null;
    this.posArray = null;
    this.colorArray = null;
    this.shockwaveGroup = null;
  }

  initThreeScene(scene) {
    const THREE = window.THREE;
    if (!THREE || !scene) return;

    // 1. Batched 3D Points Particle System (Single WebGL Draw Call)
    const maxP = this.maxParticles;
    this.posArray = new Float32Array(maxP * 3);
    this.colorArray = new Float32Array(maxP * 3);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.posArray, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(this.colorArray, 3));

    const mat = new THREE.PointsMaterial({
      size: 14,
      map: getParticleTexture(),
      transparent: true,
      opacity: 0.95,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.pointsMesh = new THREE.Points(geo, mat);
    this.pointsMesh.geometry.setDrawRange(0, 0);
    scene.add(this.pointsMesh);

    // 2. 3D Shockwave Mesh Pool
    this.shockwaveGroup = new THREE.Group();
    const ringGeo = new THREE.RingGeometry(0.92, 1.0, 36);

    for (let i = 0; i < this.shockwavePool.length; i++) {
      const sw = this.shockwavePool[i];
      const swMat = new THREE.MeshBasicMaterial({
        color: 0x39ff14,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const swMesh = new THREE.Mesh(ringGeo, swMat);
      swMesh.visible = false;
      swMesh.position.set(0, 0, 1);
      this.shockwaveGroup.add(swMesh);
      sw.threeMesh = swMesh;
      sw.threeMaterial = swMat;
    }
    scene.add(this.shockwaveGroup);
  }

  spawnParticle(x, y, vx, vy, color, radius, life) {
    if (this.particles.length >= this.maxParticles) return;
    let p = this.particlePool.pop();
    if (!p) p = new Particle();
    p.init(x, y, vx, vy, color, radius, life);
    this.particles.push(p);
  }

  spawnShockwave(x, y, maxRadius, color, duration) {
    let s = this.shockwavePool.pop();
    if (!s) {
      s = new ShockwaveRing();
      if (this.shockwaveGroup) {
        const THREE = window.THREE;
        const ringGeo = new THREE.RingGeometry(0.92, 1.0, 36);
        const swMat = new THREE.MeshBasicMaterial({
          color: 0x39ff14,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        const swMesh = new THREE.Mesh(ringGeo, swMat);
        swMesh.visible = false;
        this.shockwaveGroup.add(swMesh);
        s.threeMesh = swMesh;
        s.threeMaterial = swMat;
      }
    }
    s.init(x, y, maxRadius, color, duration);
    this.shockwaves.push(s);
  }

  createEatBurst(x, y, color, count = 16, baseRadius = 15) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randomRange(2, 5.5);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const pRadius = randomRange(1.5, Math.min(5, baseRadius * 0.22));
      const life = randomRange(20, 38);
      this.spawnParticle(x, y, vx, vy, color, pRadius, life);
    }
    this.spawnShockwave(x, y, baseRadius * 1.6, color, 18);
  }

  createDashTrail(x, y, oppositeAngle, color, radius) {
    const count = 4;
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 0.7;
      const angle = oppositeAngle + spread;
      const speed = randomRange(2.2, 5);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const pRadius = randomRange(2, Math.max(3, radius * 0.14));
      const life = randomRange(18, 30);
      this.spawnParticle(x, y, vx, vy, color, pRadius, life);
    }
    this.spawnShockwave(x, y, radius * 1.1, color, 15);
  }

  addFloatingText(x, y, text, color, fontSize) {
    this.floatingTexts.push(new FloatingText(x, y, text, color, fontSize));
  }

  update(dt = 1) {
    // 1. Update Particles & Sync to 3D Points Buffer
    const pLen = this.particles.length;
    for (let i = pLen - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt);
      if (p.isDead) {
        this.particles.splice(i, 1);
        if (this.particlePool.length < 250) {
          this.particlePool.push(p);
        }
      }
    }

    if (this.pointsMesh && this.posArray && this.colorArray) {
      const activeCount = this.particles.length;
      for (let i = 0; i < activeCount; i++) {
        const p = this.particles[i];
        const progress = p.life / p.maxLife;

        this.posArray[i * 3] = p.pos.x;
        this.posArray[i * 3 + 1] = p.pos.y;
        this.posArray[i * 3 + 2] = 2; // Floating just above Z=0 cells

        this.colorArray[i * 3] = p.r * progress;
        this.colorArray[i * 3 + 1] = p.g * progress;
        this.colorArray[i * 3 + 2] = p.b * progress;
      }

      this.pointsMesh.geometry.setDrawRange(0, activeCount);
      this.pointsMesh.geometry.attributes.position.needsUpdate = true;
      this.pointsMesh.geometry.attributes.color.needsUpdate = true;
    }

    // 2. Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.update(dt);
      if (s.isDead) {
        this.shockwaves.splice(i, 1);
        if (this.shockwavePool.length < 50) {
          this.shockwavePool.push(s);
        }
      }
    }

    // 3. Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      this.floatingTexts[i].update(dt);
      if (this.floatingTexts[i].isDead) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  renderText(ctx, camera) {
    if (!ctx) return;
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      ft.render(ctx, camera);
    }
  }

  render(ctx, camera) {
    if (!ctx) return;
    this.renderText(ctx, camera);
  }

  clear() {
    while (this.particles.length > 0) {
      this.particlePool.push(this.particles.pop());
    }
    if (this.pointsMesh) {
      this.pointsMesh.geometry.setDrawRange(0, 0);
    }
    while (this.shockwaves.length > 0) {
      const s = this.shockwaves.pop();
      if (s.threeMesh) s.threeMesh.visible = false;
      this.shockwavePool.push(s);
    }
    this.floatingTexts = [];
  }
}

ParticleManager._sharedTexture = null;


/* === js/cell.js === */
/**
 * Omnivore - Base Biological Cell Class (3D Three.js Gelatinous Organism)
 * Implements 3D physical transmission membrane, internal glowing organelles,
 * organic undulation, velocity squish/stretch, and 2D viscous fluid mechanics.
 */
class Cell {
  constructor(x, y, radius = 20, options = {}) {
    this.pos = new Vector2D(x, y);
    this.vel = new Vector2D(0, 0);
    this.acc = new Vector2D(0, 0);

    this.radius = radius;
    this.targetRadius = radius;
    this.minRadius = 10;

    // Biological colors & glow: Alien Toxic Green & Deep Purple
    this.hue = options.hue !== undefined
      ? options.hue
      : (Math.random() > 0.35 ? randomRange(95, 135) : randomRange(270, 295));
    this.saturation = options.saturation || 95;
    this.lightness = options.lightness || 54;
    this.baseColor = hsla(this.hue, this.saturation, this.lightness, 0.85);
    this.glowColor = hsla(this.hue, 100, 65, 0.9);
    this.coreColor = hsla((this.hue + 15) % 360, 100, 80, 0.95);

    // Physics parameters (Viscous fluid mechanics)
    this.drag = options.drag || 0.92;
    this.baseMaxSpeed = options.baseMaxSpeed || 3.2;

    // Organic membrane undulation settings
    this.numVertices = Math.max(20, Math.min(36, Math.floor(radius * 0.8)));
    this.membranePhase = Math.random() * Math.PI * 2;
    this.pulseSpeed = randomRange(0.025, 0.05);
    this.waveFreq1 = Math.floor(randomRange(2, 5));
    this.waveFreq2 = Math.floor(randomRange(3, 6));
    this.waveAmp1 = randomRange(0.04, 0.09);
    this.waveAmp2 = randomRange(0.02, 0.05);

    // Impact / Juicing feedback
    this.flashTimer = 0;
    this.flashColor = null;
    this.squishFactor = 1.0;
    this.stretchFactor = 1.0;
    this.elasticBounce = 0;

    // Organelle generation (Nucleus & internal structures)
    this.organelleAngle = Math.random() * Math.PI * 2;
    this.organelleRotationSpeed = randomRange(-0.012, 0.012);
    this.organelles = this.generateOrganelles();

    this.isDead = false;

    // Three.js 3D Rendering Object Group
    this.threeGroup = null;
    this.membraneMesh = null;
    this.nucleusMesh = null;
    this.organelleMeshes = [];
    this.membraneMaterial = null;
    this.nucleusMaterial = null;
    this.initThreeObject();
  }

  static getOuterGeometry() {
    const THREE = window.THREE;
    if (!Cell._outerGeo && THREE) {
      Cell._outerGeo = new THREE.SphereGeometry(1, 24, 18);
    }
    return Cell._outerGeo;
  }

  static getNucleusGeometry() {
    const THREE = window.THREE;
    if (!Cell._nucleusGeo && THREE) {
      Cell._nucleusGeo = new THREE.SphereGeometry(1, 16, 12);
    }
    return Cell._nucleusGeo;
  }

  static getOrganelleGeometry() {
    const THREE = window.THREE;
    if (!Cell._organelleGeo && THREE) {
      Cell._organelleGeo = new THREE.SphereGeometry(1, 12, 8);
    }
    return Cell._organelleGeo;
  }

  initThreeObject() {
    const THREE = window.THREE;
    if (!THREE) return;

    this.threeGroup = new THREE.Group();
    this.threeGroup.position.set(this.pos.x, this.pos.y, 0);

    const baseColorObj = new THREE.Color().setHSL(this.hue / 360, this.saturation / 100, this.lightness / 100);
    const glowColorObj = new THREE.Color().setHSL(this.hue / 360, 1.0, 0.62);
    const coreColorObj = new THREE.Color().setHSL(((this.hue + 18) % 360) / 360, 1.0, 0.72);

    this.glowColorHex = glowColorObj.getHex();

    // 1. Translucent 3D Gelatinous Outer Membrane
    // MeshPhysicalMaterial provides true physical transmission, subsurface refraction & shine
    const outerGeo = Cell.getOuterGeometry();
    if (outerGeo) {
      this.membraneMaterial = new THREE.MeshPhysicalMaterial({
        color: baseColorObj,
        emissive: glowColorObj,
        emissiveIntensity: 0.35,
        roughness: 0.12,
        metalness: 0.05,
        transmission: 0.82,
        ior: 1.33, // Organic fluid index of refraction
        transparent: true,
        opacity: 0.86,
        depthWrite: false
      });
      this.membraneMesh = new THREE.Mesh(outerGeo, this.membraneMaterial);
      this.threeGroup.add(this.membraneMesh);
    }

    // 2. Bioluminescent Inner Nucleus
    const nucleusGeo = Cell.getNucleusGeometry();
    if (nucleusGeo) {
      this.nucleusMaterial = new THREE.MeshStandardMaterial({
        color: coreColorObj,
        emissive: coreColorObj,
        emissiveIntensity: 0.85,
        roughness: 0.25,
        metalness: 0.1
      });
      this.nucleusMesh = new THREE.Mesh(nucleusGeo, this.nucleusMaterial);
      this.nucleusMesh.position.set(this.radius * 0.12, 0, 1);
      this.threeGroup.add(this.nucleusMesh);
    }

    // 3. Floating Organelles (Mitochondria / Vacuoles)
    const organelleGeo = Cell.getOrganelleGeometry();
    if (organelleGeo && this.organelles) {
      for (let i = 0; i < this.organelles.length; i++) {
        const org = this.organelles[i];
        if (org.type === "nucleus") continue;

        const orgColorObj = new THREE.Color().setHSL(((this.hue + (i * 25)) % 360) / 360, 0.95, 0.65);
        const orgMat = new THREE.MeshStandardMaterial({
          color: orgColorObj,
          emissive: orgColorObj,
          emissiveIntensity: 0.5,
          roughness: 0.3,
          transparent: true,
          opacity: 0.75,
          depthWrite: false
        });
        const orgMesh = new THREE.Mesh(organelleGeo, orgMat);
        this.organelleMeshes.push({
          mesh: orgMesh,
          material: orgMat,
          org: org
        });
        this.threeGroup.add(orgMesh);
      }
    }

    this.updateThreeMesh();
  }

  get mass() {
    return Math.PI * this.radius * this.radius;
  }

  set mass(newMass) {
    this.targetRadius = Math.max(this.minRadius, Math.sqrt(newMass / Math.PI));
  }

  get maxSpeed() {
    const refRadius = 26;
    const ratio = refRadius / Math.max(16, this.radius);
    return Math.max(1.6, this.baseMaxSpeed * Math.pow(ratio, 0.16));
  }

  generateOrganelles() {
    const list = [];
    list.push({
      type: "nucleus",
      distRatio: randomRange(0.1, 0.25),
      angleOffset: Math.random() * Math.PI * 2,
      radiusRatio: randomRange(0.32, 0.44),
      rotationSpeed: randomRange(-0.008, 0.008)
    });

    const count = Math.floor(randomRange(2, 4));
    for (let i = 0; i < count; i++) {
      list.push({
        type: Math.random() > 0.4 ? "mitochondria" : "vacuole",
        distRatio: randomRange(0.42, 0.68),
        angleOffset: (i * (Math.PI * 2 / count)) + randomRange(-0.3, 0.3),
        sizeRatio: randomRange(0.14, 0.22),
        aspect: randomRange(1.4, 2.2),
        orbitSpeed: randomRange(-0.008, 0.008)
      });
    }

    return list;
  }

  applyForce(force) {
    this.acc.add(force);
  }

  eat(otherCell) {
    const currentArea = Math.PI * this.targetRadius * this.targetRadius;
    const preyArea = Math.PI * otherCell.radius * otherCell.radius;
    const newArea = currentArea + preyArea * 0.88;
    this.targetRadius = Math.sqrt(newArea / Math.PI);

    this.flashTimer = 18;
    this.elasticBounce = 0.28;
  }

  loseMassPercent(percent) {
    const currentArea = Math.PI * this.targetRadius * this.targetRadius;
    const minArea = Math.PI * this.minRadius * this.minRadius;
    const loss = currentArea * percent;
    const newArea = Math.max(minArea, currentArea - loss);
    this.targetRadius = Math.sqrt(newArea / Math.PI);
    return loss;
  }

  update(dt = 1) {
    // 1. Viscous fluid physics integration (2D Plane)
    this.vel.add(this.acc);
    const speedCap = (this.dashGlowTimer && this.dashGlowTimer > 0)
      ? this.maxSpeed * 2.8
      : this.maxSpeed;
    this.vel.limit(speedCap);
    this.vel.mult(this.drag);
    this.pos.add(this.vel);
    this.acc.set(0, 0);

    // 2. Smooth gelatinous radius lerp + elastic bounce
    this.radius = lerp(this.radius, this.targetRadius, 0.08);
    if (this.elasticBounce > 0) {
      this.elasticBounce *= 0.88;
      if (this.elasticBounce < 0.005) this.elasticBounce = 0;
    }

    // 3. Flash decay
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) {
        this.flashColor = null;
      }
    }

    // 4. Undulation phase advancement
    const speedRatio = this.vel.mag() / (this.maxSpeed || 1);
    this.membranePhase += this.pulseSpeed + speedRatio * 0.04;
    this.organelleAngle += this.organelleRotationSpeed;

    // 5. Velocity elongation & squish
    const targetSquish = 1 - Math.min(0.25, speedRatio * 0.2);
    const targetStretch = 1 + Math.min(0.35, speedRatio * 0.25);
    this.squishFactor = lerp(this.squishFactor, targetSquish, 0.1);
    this.stretchFactor = lerp(this.stretchFactor, targetStretch, 0.1);

    // 6. Synchronize 3D Three.js Object
    this.updateThreeMesh();
  }

  updateThreeMesh() {
    if (!this.threeGroup) return;

    // Position in 3D world (Z=0 plane)
    this.threeGroup.position.set(this.pos.x, this.pos.y, 0);

    // Orientation along movement heading
    if (this.vel.magSq() > 0.01) {
      this.threeGroup.rotation.z = this.vel.heading();
    }

    // Breathing & gelatinous oscillation
    const breathing = Math.sin(this.membranePhase * 0.8) * 0.035;
    const effectiveRadius = this.radius * (1 + this.elasticBounce + breathing);

    // 3D Volume-preserving squish & stretch:
    // Stretch along X (heading), squish along Y, compensate along Z
    const scaleX = effectiveRadius * this.stretchFactor;
    const scaleY = effectiveRadius * this.squishFactor;
    const scaleZ = effectiveRadius * (1 / Math.sqrt(Math.max(0.2, this.stretchFactor * this.squishFactor)));

    if (this.membraneMesh) {
      this.membraneMesh.scale.set(scaleX, scaleY, scaleZ);

      // Flashing emissive feedback
      if (this.flashTimer > 0) {
        this.membraneMaterial.emissiveIntensity = 2.0;
        if (this.flashColor) {
          this.membraneMaterial.emissive.setStyle(this.flashColor);
        } else {
          this.membraneMaterial.emissive.setHex(0xffffff);
        }
      } else {
        this.membraneMaterial.emissiveIntensity = 0.35;
        this.membraneMaterial.emissive.setHex(this.glowColorHex || 0x39ff14);
      }
    }

    // Nucleus sizing & positioning
    if (this.nucleusMesh) {
      const nRadius = effectiveRadius * 0.36;
      this.nucleusMesh.scale.set(nRadius, nRadius, nRadius);
      this.nucleusMesh.position.set(
        Math.cos(this.organelleAngle) * (effectiveRadius * 0.12),
        Math.sin(this.organelleAngle) * (effectiveRadius * 0.12),
        1
      );
    }

    // Organelles orbiting inside cell
    for (let i = 0; i < this.organelleMeshes.length; i++) {
      const item = this.organelleMeshes[i];
      const org = item.org;
      const angle = org.angleOffset + this.organelleAngle;
      const dist = effectiveRadius * org.distRatio;
      const oRadius = effectiveRadius * org.sizeRatio;

      item.mesh.position.set(
        Math.cos(angle) * dist,
        Math.sin(angle) * dist,
        0.5
      );
      item.mesh.scale.set(
        oRadius * (org.aspect || 1.2),
        oRadius,
        oRadius
      );
    }
  }

  destroy(scene) {
    if (!this.threeGroup) return;

    if (scene) {
      scene.remove(this.threeGroup);
    }

    if (this.membraneMaterial) {
      this.membraneMaterial.dispose();
      this.membraneMaterial = null;
    }
    if (this.nucleusMaterial) {
      this.nucleusMaterial.dispose();
      this.nucleusMaterial = null;
    }
    for (let i = 0; i < this.organelleMeshes.length; i++) {
      if (this.organelleMeshes[i].material) {
        this.organelleMeshes[i].material.dispose();
      }
    }
    this.organelleMeshes = [];
    this.threeGroup = null;
    this.membraneMesh = null;
    this.nucleusMesh = null;
  }

  // Fallback 2D Canvas methods for backward compatibility
  buildMembranePath(ctx) {
    if (!ctx) return;
    const num = this.numVertices;
    const vX = Cell.vX;
    const vY = Cell.vY;
    const effectiveRadius = this.radius * (1 + this.elasticBounce);
    const heading = this.vel.magSq() > 0.01 ? this.vel.heading() : 0;
    const stretchDelta = this.stretchFactor - 1;
    const squishDelta = this.squishFactor - 1;

    for (let i = 0; i < num; i++) {
      const angle = (i / num) * (Math.PI * 2);
      const wave1 = Math.sin(angle * this.waveFreq1 + this.membranePhase) * this.waveAmp1;
      const wave2 = Math.cos(angle * this.waveFreq2 - this.membranePhase * 1.3) * this.waveAmp2;
      const breathing = Math.sin(this.membranePhase * 0.8) * 0.02;
      const relAngle = angle - heading;
      const velocitySquash = (Math.cos(relAngle) * stretchDelta) +
                             (Math.abs(Math.sin(relAngle)) * squishDelta);

      const r = effectiveRadius * (1 + wave1 + wave2 + breathing + velocitySquash);
      vX[i] = Math.cos(angle) * r;
      vY[i] = Math.sin(angle) * r;
    }

    ctx.beginPath();
    const firstMidX = (vX[0] + vX[1]) * 0.5;
    const firstMidY = (vY[0] + vY[1]) * 0.5;
    ctx.moveTo(firstMidX, firstMidY);

    for (let i = 1; i < num; i++) {
      const nextIdx = (i + 1) % num;
      const midX = (vX[i] + vX[nextIdx]) * 0.5;
      const midY = (vY[i] + vY[nextIdx]) * 0.5;
      ctx.quadraticCurveTo(vX[i], vY[i], midX, midY);
    }
    ctx.quadraticCurveTo(vX[0], vY[0], firstMidX, firstMidY);
    ctx.closePath();
  }

  render(ctx) {
    if (!ctx) return;
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    this.buildMembranePath(ctx);
    ctx.fillStyle = this.baseColor;
    ctx.fill();
    ctx.restore();
  }
}

Cell.vX = new Float32Array(64);
Cell.vY = new Float32Array(64);
Cell._outerGeo = null;
Cell._nucleusGeo = null;
Cell._organelleGeo = null;


/* === js/player.js === */
/**
 * Omnivore - Player Amoeba Class (3D Bioluminescent Apex Organism)
 * Subclasses Cell. Features attached 3D PointLight, undulating 3D cilia,
 * glowing dash aura, mouse inertia swimming, and mass-cost dash propulsion.
 */
class Player extends Cell {
  constructor(x, y, radius = 26) {
    super(x, y, radius, {
      hue: 120, // Bioluminescent Toxic Neon Green
      saturation: 100,
      lightness: 54,
      drag: 0.90, // Viscous fluid damping
      baseMaxSpeed: 3.2 // Relaxed, manageable swim speed
    });

    // Swimming & cilia locomotion state
    this.ciliaCount = 36;
    this.ciliaPhase = 0;
    this.ciliaBaseLength = 10;

    // Dash mechanic state
    this.dashCooldown = 0;
    this.dashCooldownMax = 20; // ~0.33s at 60fps
    this.dashForce = 8.6; // Responsive burst
    this.dashCostPercent = 0.035; // 3.5% mass per dash
    this.isDashing = false;
    this.dashGlowTimer = 0;

    // Target position (world coordinates from pointer)
    this.targetPos = new Vector2D(x, y);

    // World boundary default
    this.worldRadius = 3500;

    // Three.js 3D Lighting and Accessory Meshes
    this.pointLight = null;
    this.ciliaMesh = null;
    this.ciliaPosArray = null;
    this.ciliaMaterial = null;
    this.dashRingMesh = null;
    this.dashRingMaterial = null;

    this.initPlayerThreeObjects();
  }

  initPlayerThreeObjects() {
    const THREE = window.THREE;
    if (!THREE || !this.threeGroup) return;

    // 1. Attached 3D Bioluminescent PointLight (Toxic Neon Green)
    // Casts actual dynamic 3D light onto nearby organisms, fluid grid, and abyss spores
    this.pointLight = new THREE.PointLight(0x39ff14, 2.2, 750, 2);
    this.pointLight.position.set(0, 0, 25);
    this.threeGroup.add(this.pointLight);

    // 2. 3D Cilia Locomotion Hairs (Dynamic LineSegments)
    const num = this.ciliaCount;
    this.ciliaPosArray = new Float32Array(num * 2 * 3); // 2 vertices per cilium, 3 coords (x,y,z)
    const ciliaGeo = new THREE.BufferGeometry();
    ciliaGeo.setAttribute("position", new THREE.BufferAttribute(this.ciliaPosArray, 3));

    this.ciliaMaterial = new THREE.LineBasicMaterial({
      color: 0x39ff14,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    this.ciliaMesh = new THREE.LineSegments(ciliaGeo, this.ciliaMaterial);
    this.threeGroup.add(this.ciliaMesh);

    // 3. 3D Dash Aura Ring
    const ringGeo = new THREE.RingGeometry(1.0, 1.35, 36);
    this.dashRingMaterial = new THREE.MeshBasicMaterial({
      color: 0x39ff14,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.dashRingMesh = new THREE.Mesh(ringGeo, this.dashRingMaterial);
    this.dashRingMesh.position.set(0, 0, 0.5);
    this.dashRingMesh.visible = false;
    this.threeGroup.add(this.dashRingMesh);
  }

  setTarget(worldX, worldY) {
    this.targetPos.set(worldX, worldY);
  }

  canDash() {
    return this.dashCooldown <= 0 && this.radius > 13;
  }

  dash() {
    if (!this.canDash()) return null;

    // Direction toward pointer target
    const toTarget = Vector2D.sub(this.targetPos, this.pos);
    if (toTarget.magSq() < 1) {
      toTarget.set(1, 0);
    } else {
      toTarget.normalize();
    }

    // Apply sudden impulse
    this.vel.add(toTarget.clone().mult(this.dashForce));
    this.dashCooldown = this.dashCooldownMax;
    this.dashGlowTimer = 14;

    // Cost mass
    const massLost = this.loseMassPercent(this.dashCostPercent);

    // Ejecta position behind cell
    const oppositeAngle = toTarget.heading() + Math.PI;
    const ejectX = this.pos.x + Math.cos(oppositeAngle) * (this.radius * 0.9);
    const ejectY = this.pos.y + Math.sin(oppositeAngle) * (this.radius * 0.9);

    return {
      ejectX,
      ejectY,
      oppositeAngle,
      massLost
    };
  }

  update(dt = 1, worldRadius = null) {
    // 1. Swim towards cursor/touch with viscous fluid inertia
    const toTarget = Vector2D.sub(this.targetPos, this.pos);
    const distToTarget = toTarget.mag();
    const deadzone = 8;

    if (distToTarget > deadzone) {
      toTarget.normalize();
      const easeRadius = 90;
      const thrustScale = Math.min(1, (distToTarget - deadzone) / easeRadius);
      const thrust = 0.28 * thrustScale;
      this.applyForce(toTarget.mult(thrust));
    } else {
      this.vel.mult(0.85);
    }

    // 2. Dash cooldown and glow decay
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.dashGlowTimer > 0) this.dashGlowTimer -= dt;

    // 3. Cilia oscillation frequency speeds up when swimming faster
    const currentSpeed = this.vel.mag();
    this.ciliaPhase += 0.12 + (currentSpeed / this.maxSpeed) * 0.22;

    // 4. Update parent Cell physics & 3D mesh
    super.update(dt);

    // 5. Update 3D Cilia Geometry & Dash Ring
    this.updatePlayer3DEffects();

    // 6. Hard World Boundary Clamping & Elastic Bounce
    const activeRadius = worldRadius || this.worldRadius || 3500;
    const dist = this.pos.mag();
    const maxDist = Math.max(10, activeRadius - this.radius);
    if (dist > maxDist) {
      const norm = this.pos.clone().normalize();
      this.pos.set(norm.x * maxDist, norm.y * maxDist);
      const outward = this.vel.x * norm.x + this.vel.y * norm.y;
      if (outward > 0) {
        this.vel.sub(norm.mult(outward * 1.5));
        return true;
      }
    }
    return false;
  }

  updatePlayer3DEffects() {
    if (!this.threeGroup) return;

    // 1. Update Light Intensity & Reach based on player growth
    if (this.pointLight) {
      const baseDistance = 650;
      this.pointLight.distance = baseDistance + this.radius * 3.5;
      if (this.dashGlowTimer > 0) {
        this.pointLight.intensity = 3.2;
      } else {
        this.pointLight.intensity = 2.0;
      }
    }

    // 2. Animate 3D Cilia Hair Vertices in Local Coordinates
    if (this.ciliaMesh && this.ciliaPosArray) {
      const num = this.ciliaCount;
      const speed = this.vel.mag();
      const moveHeading = speed > 0.1 ? this.vel.heading() : 0;
      const positions = this.ciliaPosArray;

      let pIdx = 0;
      for (let i = 0; i < num; i++) {
        const angle = (i / num) * Math.PI * 2;

        // Base point on the membrane
        const baseR = this.radius * (1 + Math.sin(angle * this.waveFreq1 + this.membranePhase) * this.waveAmp1);
        const baseX = Math.cos(angle) * baseR;
        const baseY = Math.sin(angle) * baseR;
        const baseZ = 0;

        // Locomotion stroke dynamics
        const relAngle = angle - moveHeading;
        const isTrailing = Math.cos(relAngle) < 0;
        const strokeMultiplier = isTrailing ? 1.4 : 0.8;

        const wave = Math.sin(this.ciliaPhase * 1.5 - angle * 4) * 0.45 * strokeMultiplier;
        const ciliumLength = (this.ciliaBaseLength + Math.min(8, this.radius * 0.15)) * strokeMultiplier;

        const tipAngle = angle + wave;
        const tipX = baseX + Math.cos(tipAngle) * ciliumLength;
        const tipY = baseY + Math.sin(tipAngle) * ciliumLength;
        const tipZ = Math.sin(this.ciliaPhase + i * 0.5) * 3;

        // Vertex 1: Base
        positions[pIdx++] = baseX;
        positions[pIdx++] = baseY;
        positions[pIdx++] = baseZ;

        // Vertex 2: Tip
        positions[pIdx++] = tipX;
        positions[pIdx++] = tipY;
        positions[pIdx++] = tipZ;
      }

      this.ciliaMesh.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Update Dash Ring Aura
    if (this.dashRingMesh && this.dashRingMaterial) {
      if (this.dashGlowTimer > 0) {
        this.dashRingMesh.visible = true;
        const progress = this.dashGlowTimer / 14;
        this.dashRingMaterial.opacity = progress * 0.85;
        const ringScale = this.radius * (1.1 + (1 - progress) * 0.4);
        this.dashRingMesh.scale.set(ringScale, ringScale, ringScale);
      } else {
        this.dashRingMesh.visible = false;
      }
    }
  }

  destroy(scene) {
    if (this.pointLight && this.threeGroup) {
      this.threeGroup.remove(this.pointLight);
      this.pointLight = null;
    }
    if (this.ciliaMesh) {
      if (this.ciliaMesh.geometry) this.ciliaMesh.geometry.dispose();
      if (this.ciliaMaterial) this.ciliaMaterial.dispose();
      this.ciliaMesh = null;
    }
    if (this.dashRingMesh) {
      if (this.dashRingMesh.geometry) this.dashRingMesh.geometry.dispose();
      if (this.dashRingMaterial) this.dashRingMaterial.dispose();
      this.dashRingMesh = null;
    }
    super.destroy(scene);
  }

  // Fallback 2D Canvas methods
  render(ctx) {
    if (!ctx) return;
    this.renderCilia(ctx);
    super.render(ctx);

    if (this.dashGlowTimer > 0) {
      ctx.save();
      ctx.translate(this.pos.x, this.pos.y);
      const auraAlpha = (this.dashGlowTimer / 14) * 0.7;
      ctx.strokeStyle = `rgba(57, 255, 20, ${auraAlpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 1.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  renderCilia(ctx) {
    if (!ctx) return;
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    const speed = this.vel.mag();
    const moveHeading = speed > 0.1 ? this.vel.heading() : 0;
    const numCilia = Math.max(24, Math.min(44, Math.floor(this.radius * 1.1)));

    ctx.strokeStyle = hsla(this.hue, 100, 75, 0.8);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let i = 0; i < numCilia; i++) {
      const angle = (i / numCilia) * Math.PI * 2;
      const baseR = this.radius * (1 + Math.sin(angle * this.waveFreq1 + this.membranePhase) * this.waveAmp1);
      const baseX = Math.cos(angle) * baseR;
      const baseY = Math.sin(angle) * baseR;
      const relAngle = angle - moveHeading;
      const isTrailing = Math.cos(relAngle) < 0;
      const strokeMultiplier = isTrailing ? 1.4 : 0.8;
      const wave = Math.sin(this.ciliaPhase * 1.5 - angle * 4) * 0.45 * strokeMultiplier;
      const ciliumLength = (this.ciliaBaseLength + Math.min(8, this.radius * 0.15)) * strokeMultiplier;
      const tipAngle = angle + wave;
      const tipX = baseX + Math.cos(tipAngle) * ciliumLength;
      const tipY = baseY + Math.sin(tipAngle) * ciliumLength;
      ctx.moveTo(baseX, baseY);
      ctx.lineTo(tipX, tipY);
    }
    ctx.stroke();
    ctx.restore();
  }
}


/* === js/aiCell.js === */
/**
 * Omnivore - AI Biological Organism Class (3D Three.js Predator, Prey & Parasites)
 * Subclasses Cell. Implements sensory detection, predator hunting with purple PointLights,
 * crimson parasite swarming, prey fleeing, and ambient plankton drifting.
 */
const CELL_TYPES = {
  PLANKTON: "plankton",
  PREY: "prey",
  PREDATOR: "predator",
  PARASITE: "parasite"
};
class AICell extends Cell {
  constructor(x, y, radius, type = CELL_TYPES.PREY) {
    let hue, saturation, lightness, baseMaxSpeed;

    if (type === CELL_TYPES.PLANKTON) {
      hue = randomChoice([95, 110, 120, 135]); // Toxic neon green, chartreuse, lime
      saturation = 100;
      lightness = 60;
      baseMaxSpeed = 1.4;
    } else if (type === CELL_TYPES.PREY) {
      hue = randomChoice([115, 130, 265, 285]); // Green & violet
      saturation = 95;
      lightness = 55;
      baseMaxSpeed = 2.8;
    } else if (type === CELL_TYPES.PARASITE) {
      hue = randomChoice([345, 355, 2, 12]); // Crimson / Blood Red
      saturation = 100;
      lightness = 52;
      baseMaxSpeed = 3.6;
    } else {
      // PREDATOR: Deep glowing alien purple / violet
      hue = randomChoice([275, 280, 288, 295]);
      saturation = 100;
      lightness = 50;
      baseMaxSpeed = 2.6;
    }

    super(x, y, radius, {
      hue,
      saturation,
      lightness,
      drag: 0.91,
      baseMaxSpeed
    });

    this.type = type;
    this.sensorRadius = type === CELL_TYPES.PARASITE ? 850 : Math.max(160, radius * 4.2);

    // Wandering wander-angle for organic fluid drifting
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.wanderChangeSpeed = randomRange(0.02, 0.08);

    // AI decision tick timer to optimize CPU
    this.decisionTimer = Math.floor(Math.random() * 10);
    this.decisionInterval = 6;

    // 3D Three.js Predator Bioluminescent Light
    this.pointLight = null;
    this.initAIThreeObject();
  }

  initAIThreeObject() {
    const THREE = window.THREE;
    if (!THREE || !this.threeGroup) return;

    if (this.type === CELL_TYPES.PREDATOR) {
      // Predators emit an ominous, deep purple bioluminescent light
      this.pointLight = new THREE.PointLight(0xa855f7, 1.8, 550, 2);
      this.pointLight.position.set(0, 0, 20);
      this.threeGroup.add(this.pointLight);
    } else if (this.type === CELL_TYPES.PARASITE) {
      // Parasites pulse with aggressive blood-red emissive glow
      if (this.membraneMaterial) {
        this.membraneMaterial.emissiveIntensity = 0.65;
        this.membraneMaterial.roughness = 0.2;
      }
    }
  }

  update(dt = 1) {
    super.update(dt);

    // Dynamically adjust predator point light radius as it grows
    if (this.pointLight && this.type === CELL_TYPES.PREDATOR) {
      this.pointLight.distance = 450 + this.radius * 2.5;
    }
  }

  updateAI(neighbors, player, worldRadius = 3500) {
    this.decisionTimer++;
    if (this.decisionTimer < this.decisionInterval) return;
    this.decisionTimer = 0;

    // Culling light for distant predators to maximize 60 FPS
    if (this.pointLight && player) {
      const dx = this.pos.x - player.pos.x;
      const dy = this.pos.y - player.pos.y;
      this.pointLight.visible = (dx * dx + dy * dy < 2200 * 2200);
    }

    let steerForce = new Vector2D(0, 0);

    // 1. World boundary soft constraint
    const originDistSq = this.pos.magSq();
    const boundRadius = worldRadius * 0.85;
    if (originDistSq > boundRadius * boundRadius) {
      const originDist = Math.sqrt(originDistSq) || 1;
      this.applyForce(new Vector2D((-this.pos.x / originDist) * 0.35, (-this.pos.y / originDist) * 0.35));
      return;
    }

    // 2. Plankton just gently drifts
    if (this.type === CELL_TYPES.PLANKTON) {
      this.wanderAngle += (Math.random() - 0.5) * 0.4;
      const wander = Vector2D.fromAngle(this.wanderAngle, 0.05);
      this.applyForce(wander);
      return;
    }

    // 3. Parasite: Fast, aggressive swarm tracking the player
    if (this.type === CELL_TYPES.PARASITE) {
      if (player && !player.isDead) {
        const dx = player.pos.x - this.pos.x;
        const dy = player.pos.y - this.pos.y;
        const reach = this.sensorRadius;
        if (Math.abs(dx) <= reach && Math.abs(dy) <= reach) {
          const dSq = dx * dx + dy * dy;
          if (dSq < reach * reach) {
            const dist = Math.sqrt(dSq) || 1;
            const toPlayerX = dx / dist;
            const toPlayerY = dy / dist;
            const jitterAngle = Math.random() * Math.PI * 2;
            const jitterX = Math.cos(jitterAngle) * 0.35;
            const jitterY = Math.sin(jitterAngle) * 0.35;
            const finalX = toPlayerX + jitterX;
            const finalY = toPlayerY + jitterY;
            const finalMag = Math.hypot(finalX, finalY) || 1;
            this.applyForce(new Vector2D((finalX / finalMag) * 0.42, (finalY / finalMag) * 0.42));
            return;
          }
        }
      }
      this.wanderAngle += (Math.random() - 0.5) * 0.45;
      const wander = Vector2D.fromAngle(this.wanderAngle, 0.22);
      this.applyForce(wander);
      return;
    }

    // 4. Scan for threats & food using fast AABB early exit and squared distances
    let closestThreat = null;
    let closestThreatDistSq = Infinity;
    let closestFood = null;
    let closestFoodDistSq = Infinity;

    // Check Player
    if (player && !player.isDead) {
      const maxReach = this.sensorRadius + player.radius;
      const dx = player.pos.x - this.pos.x;
      const dy = player.pos.y - this.pos.y;
      if (Math.abs(dx) <= maxReach && Math.abs(dy) <= maxReach) {
        const dSq = dx * dx + dy * dy;
        if (dSq <= maxReach * maxReach) {
          if (player.radius > this.radius * 1.06) {
            closestThreat = player;
            closestThreatDistSq = dSq;
          } else if (this.radius > player.radius * 1.06 && this.type === CELL_TYPES.PREDATOR) {
            closestFood = player;
            closestFoodDistSq = dSq;
          }
        }
      }
    }

    // Check Neighboring AI Cells
    for (let i = 0; i < neighbors.length; i++) {
      const other = neighbors[i];
      if (other === this || other.isDead) continue;

      const maxReach = this.sensorRadius + other.radius;
      const dx = other.pos.x - this.pos.x;
      if (Math.abs(dx) > maxReach) continue;
      const dy = other.pos.y - this.pos.y;
      if (Math.abs(dy) > maxReach) continue;

      const dSq = dx * dx + dy * dy;
      if (dSq > maxReach * maxReach) continue;

      if (other.radius > this.radius * 1.06) {
        if (dSq < closestThreatDistSq) {
          closestThreat = other;
          closestThreatDistSq = dSq;
        }
      } else if (this.radius > other.radius * 1.06 && (this.type === CELL_TYPES.PREDATOR || other.type === CELL_TYPES.PLANKTON)) {
        if (dSq < closestFoodDistSq) {
          closestFood = other;
          closestFoodDistSq = dSq;
        }
      }
    }

    // 5. Behavioral execution
    if (closestThreat) {
      const fleeVec = Vector2D.sub(this.pos, closestThreat.pos).normalize();
      const closestThreatDist = Math.sqrt(closestThreatDistSq);
      const urgency = clamp(1 - (closestThreatDist / this.sensorRadius), 0.3, 1.0);
      steerForce.add(fleeVec.mult(0.36 * urgency));
    } else if (closestFood) {
      const huntVec = Vector2D.sub(closestFood.pos, this.pos).normalize();
      steerForce.add(huntVec.mult(0.24));
    } else {
      this.wanderAngle += (Math.random() - 0.5) * this.wanderChangeSpeed * 5;
      const wander = Vector2D.fromAngle(this.wanderAngle, 0.12);
      steerForce.add(wander);
    }

    this.applyForce(steerForce);
  }

  destroy(scene) {
    if (this.pointLight && this.threeGroup) {
      this.threeGroup.remove(this.pointLight);
      this.pointLight = null;
    }
    super.destroy(scene);
  }
}


/* === js/background.js === */
/**
 * Omnivore - Atmospheric 3D Parallax Background System (Three.js Microcosm)
 * Renders 3 true 3D negative-Z parallax layers (far nebula orbs, mid spores, near marine snow),
 * liquid-refracted fluid coordinate grid, and glowing world boundary barrier rings.
 */

function createCircleTexture() {
  const THREE = window.THREE;
  if (!THREE) return null;

  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");

  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
  grad.addColorStop(0.25, "rgba(255, 255, 255, 0.85)");
  grad.addColorStop(0.65, "rgba(255, 255, 255, 0.25)");
  grad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
class BackgroundSystem {
  constructor(worldRadius = 3500) {
    this.worldRadius = worldRadius;

    // Three.js Systems
    this.circleTexture = createCircleTexture();

    // 3D Parallax Layer Objects
    this.farBokehData = [];
    this.farBokehPoints = null;

    this.midSporesData = [];
    this.midSporesPoints = null;

    this.nearSnowData = [];
    this.nearSnowPoints = null;

    // 3D Fluid Coordinate Grid
    this.gridMesh = null;
    this.gridNodesMesh = null;
    this.gridSpacing = 160;

    // 3D World Boundary Barrier Rings
    this.boundaryGroup = null;
    this.innerRingMesh = null;
    this.outerRingMesh = null;

    // Lighting references
    this.ambientLight = null;
    this.dirLight = null;
  }

  initThreeScene(scene) {
    const THREE = window.THREE;
    if (!THREE || !scene) return;

    // 1. Deep Abyssal Fog & Void Background
    scene.background = new THREE.Color(0x020005);
    scene.fog = new THREE.FogExp2(0x030108, 0.00065);

    // 2. Global Microscopic Lighting
    this.ambientLight = new THREE.AmbientLight(0x180828, 0.55);
    scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xa855f7, 0.45);
    this.dirLight.position.set(300, 600, 500);
    scene.add(this.dirLight);

    // 3. Layer 1: Far Nebula Bokeh Orbs (Z: -450 to -650)
    this.initFarBokeh(scene);

    // 4. Layer 2: Mid-Depth Spores & Organelles (Z: -180 to -320)
    this.initMidSpores(scene);

    // 5. Layer 3: Near Marine Snow & Plankton Motes (Z: -30 to -120)
    this.initNearSnow(scene);

    // 6. Fluid Coordinate Grid
    this.initFluidGrid(scene);

    // 7. World Boundary Barrier Rings
    this.initBoundaryRings(scene);
  }

  initFarBokeh(scene) {
    const THREE = window.THREE;
    const count = 70;
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const x = randomRange(-this.worldRadius, this.worldRadius);
      const y = randomRange(-this.worldRadius, this.worldRadius);
      const z = randomRange(-650, -450);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const hue = Math.random() > 0.4 ? randomRange(270, 305) : randomRange(105, 135);
      const c = new THREE.Color().setHSL(hue / 360, 0.9, 0.6);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      this.farBokehData.push({
        vx: randomRange(-0.15, 0.15),
        vy: randomRange(-0.15, 0.15),
        pulseSpeed: randomRange(0.01, 0.025),
        pulsePhase: Math.random() * Math.PI * 2
      });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 130,
      map: this.circleTexture,
      transparent: true,
      opacity: 0.38,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.farBokehPoints = new THREE.Points(geo, mat);
    scene.add(this.farBokehPoints);
  }

  initMidSpores(scene) {
    const THREE = window.THREE;
    const count = 150;
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const x = randomRange(-this.worldRadius, this.worldRadius);
      const y = randomRange(-this.worldRadius, this.worldRadius);
      const z = randomRange(-320, -180);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const hue = Math.random() > 0.5 ? randomRange(110, 135) : randomRange(265, 295);
      const c = new THREE.Color().setHSL(hue / 360, 0.95, 0.65);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      this.midSporesData.push({
        vx: randomRange(-0.35, 0.35),
        vy: randomRange(-0.35, 0.35),
        pulseSpeed: randomRange(0.02, 0.04),
        pulsePhase: Math.random() * Math.PI * 2
      });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 32,
      map: this.circleTexture,
      transparent: true,
      opacity: 0.55,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.midSporesPoints = new THREE.Points(geo, mat);
    scene.add(this.midSporesPoints);
  }

  initNearSnow(scene) {
    const THREE = window.THREE;
    const count = 300;
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const x = randomRange(-this.worldRadius, this.worldRadius);
      const y = randomRange(-this.worldRadius, this.worldRadius);
      const z = randomRange(-120, -30);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const hue = Math.random() > 0.35 ? randomRange(100, 135) : randomRange(270, 295);
      const c = new THREE.Color().setHSL(hue / 360, 1.0, 0.75);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      this.nearSnowData.push({
        vx: randomRange(-0.25, 0.25),
        vy: randomRange(-0.25, 0.25),
        flickerSpeed: randomRange(0.03, 0.07),
        flickerPhase: Math.random() * Math.PI * 2
      });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 7,
      map: this.circleTexture,
      transparent: true,
      opacity: 0.7,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.nearSnowPoints = new THREE.Points(geo, mat);
    scene.add(this.nearSnowPoints);
  }

  initFluidGrid(scene) {
    const THREE = window.THREE;
    // Dynamic grid line segments centered around the viewport
    // 24 horizontal and 24 vertical lines with 12 segments each
    const linesCount = 24;
    const segsPerLine = 12;
    const totalVerts = (linesCount * 2) * (segsPerLine * 2);
    const pos = new Float32Array(totalVerts * 3);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.LineBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.gridMesh = new THREE.LineSegments(geo, mat);
    scene.add(this.gridMesh);

    // Grid coordinate intersection nodes
    const nodeCount = linesCount * linesCount;
    const nodePos = new Float32Array(nodeCount * 3);
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodePos, 3));

    const nodeMat = new THREE.PointsMaterial({
      size: 5,
      map: this.circleTexture,
      color: 0x39ff14,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.gridNodesMesh = new THREE.Points(nodeGeo, nodeMat);
    scene.add(this.gridNodesMesh);
  }

  initBoundaryRings(scene) {
    const THREE = window.THREE;
    this.boundaryGroup = new THREE.Group();

    // Inner Toxic Green Ring
    const innerGeo = new THREE.RingGeometry(this.worldRadius - 4, this.worldRadius + 4, 128);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x39ff14,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.innerRingMesh = new THREE.Mesh(innerGeo, innerMat);
    this.innerRingMesh.position.set(0, 0, 0.5);
    this.boundaryGroup.add(this.innerRingMesh);

    // Outer Alien Purple Ring
    const outerGeo = new THREE.RingGeometry(this.worldRadius + 22, this.worldRadius + 28, 128);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.52,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.outerRingMesh = new THREE.Mesh(outerGeo, outerMat);
    this.outerRingMesh.position.set(0, 0, 0.4);
    this.boundaryGroup.add(this.outerRingMesh);

    scene.add(this.boundaryGroup);
  }

  update(dt = 1, camX = 0, camY = 0) {
    const wrapRadius = 2600;

    // 1. Update Far Bokeh Points
    if (this.farBokehPoints) {
      const pos = this.farBokehPoints.geometry.attributes.position.array;
      for (let i = 0; i < this.farBokehData.length; i++) {
        const d = this.farBokehData[i];
        let x = pos[i * 3] + d.vx * dt;
        let y = pos[i * 3 + 1] + d.vy * dt;

        // Wrap around camera
        if (x - camX > wrapRadius) x -= wrapRadius * 2;
        else if (x - camX < -wrapRadius) x += wrapRadius * 2;
        if (y - camY > wrapRadius) y -= wrapRadius * 2;
        else if (y - camY < -wrapRadius) y += wrapRadius * 2;

        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        d.pulsePhase += d.pulseSpeed * dt;
      }
      this.farBokehPoints.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Update Mid Spores Points
    if (this.midSporesPoints) {
      const pos = this.midSporesPoints.geometry.attributes.position.array;
      for (let i = 0; i < this.midSporesData.length; i++) {
        const d = this.midSporesData[i];
        let x = pos[i * 3] + d.vx * dt;
        let y = pos[i * 3 + 1] + d.vy * dt;

        if (x - camX > wrapRadius) x -= wrapRadius * 2;
        else if (x - camX < -wrapRadius) x += wrapRadius * 2;
        if (y - camY > wrapRadius) y -= wrapRadius * 2;
        else if (y - camY < -wrapRadius) y += wrapRadius * 2;

        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        d.pulsePhase += d.pulseSpeed * dt;
      }
      this.midSporesPoints.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Update Near Snow Points
    if (this.nearSnowPoints) {
      const pos = this.nearSnowPoints.geometry.attributes.position.array;
      for (let i = 0; i < this.nearSnowData.length; i++) {
        const d = this.nearSnowData[i];
        let x = pos[i * 3] + d.vx * dt;
        let y = pos[i * 3 + 1] + d.vy * dt;

        if (x - camX > wrapRadius) x -= wrapRadius * 2;
        else if (x - camX < -wrapRadius) x += wrapRadius * 2;
        if (y - camY > wrapRadius) y -= wrapRadius * 2;
        else if (y - camY < -wrapRadius) y += wrapRadius * 2;

        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        d.flickerPhase += d.flickerSpeed * dt;
      }
      this.nearSnowPoints.geometry.attributes.position.needsUpdate = true;
    }

    // 4. Undulate Dynamic Fluid Coordinate Grid around camera
    if (this.gridMesh && this.gridNodesMesh) {
      this.updateFluidGrid(camX, camY);
    }

    // 5. Pulsate Boundary Barrier Rings
    if (this.innerRingMesh && this.outerRingMesh) {
      const time = performance.now() * 0.0018;
      const pulseScale = 1 + Math.sin(time * 2) * 0.003;
      this.innerRingMesh.scale.set(pulseScale, pulseScale, 1);
      this.outerRingMesh.scale.set(pulseScale, pulseScale, 1);
    }
  }

  updateFluidGrid(camX, camY) {
    const spacing = this.gridSpacing;
    const linesCount = 24;
    const segsPerLine = 12;
    const halfSpan = (linesCount * spacing) * 0.5;

    const startX = Math.floor((camX - halfSpan) / spacing) * spacing;
    const startY = Math.floor((camY - halfSpan) / spacing) * spacing;

    const linePos = this.gridMesh.geometry.attributes.position.array;
    const nodePos = this.gridNodesMesh.geometry.attributes.position.array;
    const time = performance.now() * 0.0012;

    let pIdx = 0;
    let nIdx = 0;
    const segStep = (linesCount * spacing) / segsPerLine;

    // Vertical undulating lines
    for (let c = 0; c < linesCount; c++) {
      const gx = startX + c * spacing;
      for (let s = 0; s < segsPerLine; s++) {
        const y1 = startY + s * segStep;
        const y2 = startY + (s + 1) * segStep;

        const waveX1 = gx + Math.sin(y1 * 0.007 + time * 1.3 + gx * 0.002) * 6;
        const waveX2 = gx + Math.sin(y2 * 0.007 + time * 1.3 + gx * 0.002) * 6;

        linePos[pIdx++] = waveX1;
        linePos[pIdx++] = y1;
        linePos[pIdx++] = -5;

        linePos[pIdx++] = waveX2;
        linePos[pIdx++] = y2;
        linePos[pIdx++] = -5;
      }
    }

    // Horizontal undulating lines
    for (let r = 0; r < linesCount; r++) {
      const gy = startY + r * spacing;
      for (let s = 0; s < segsPerLine; s++) {
        const x1 = startX + s * segStep;
        const x2 = startX + (s + 1) * segStep;

        const waveY1 = gy + Math.sin(x1 * 0.007 + time * 1.3 + gy * 0.002) * 6;
        const waveY2 = gy + Math.sin(x2 * 0.007 + time * 1.3 + gy * 0.002) * 6;

        linePos[pIdx++] = x1;
        linePos[pIdx++] = waveY1;
        linePos[pIdx++] = -5;

        linePos[pIdx++] = x2;
        linePos[pIdx++] = waveY2;
        linePos[pIdx++] = -5;
      }
    }

    // Grid Intersection Nodes
    for (let c = 0; c < linesCount; c++) {
      const gx = startX + c * spacing;
      for (let r = 0; r < linesCount; r++) {
        const gy = startY + r * spacing;
        const nx = gx + Math.sin(gy * 0.007 + time * 1.3 + gx * 0.002) * 6;
        const ny = gy + Math.sin(gx * 0.007 + time * 1.3 + gy * 0.002) * 6;

        nodePos[nIdx++] = nx;
        nodePos[nIdx++] = ny;
        nodePos[nIdx++] = -4.5;
      }
    }

    this.gridMesh.geometry.attributes.position.needsUpdate = true;
    this.gridNodesMesh.geometry.attributes.position.needsUpdate = true;
  }

  // Fallback 2D Canvas methods
  render(ctx, camera, viewWidth, viewHeight) {}
  renderWorldGrid(ctx, camera, viewWidth, viewHeight) {}
}


/* === js/camera.js === */
/**
 * Omnivore - Dynamic 3D Camera System (Three.js Perspective)
 * Centers the player in the viewport, applies smooth dynamic zoom-out
 * as the cell expands, converts screen pointer coordinates to the Z=0 world plane,
 * and manages fluid screen-shake impulses in 3D space.
 */
class Camera {
  constructor(viewportWidth = 800, viewportHeight = 600) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;

    this.pos = new Vector2D(0, 0);
    this.targetPos = new Vector2D(0, 0);

    this.zoom = 1.0;
    this.targetZoom = 1.0;

    // Screen shake
    this.shakeIntensity = 0;
    this.shakeDecay = 0.9;
    this.shakeOffset = new Vector2D(0, 0);

    // Three.js PerspectiveCamera calibrated for 1:1 pixel-to-world mapping at Z=0
    this.fov = 50; // Vertical field of view in degrees
    const THREE = window.THREE;
    if (THREE) {
      this.threeCamera = new THREE.PerspectiveCamera(
        this.fov,
        Math.max(1, viewportWidth) / Math.max(1, viewportHeight),
        1,
        15000
      );
      this.threeCamera.up.set(0, 1, 0);
      this.syncThreeCamera();
    } else {
      this.threeCamera = null;
    }

    // Reusable vectors to eliminate GC allocation in hot update loops
    this._scratchWorld = new Vector2D(0, 0);
    this._scratchScreen = new Vector2D(0, 0);
  }

  resize(width, height) {
    this.viewportWidth = width;
    this.viewportHeight = height;
    if (this.threeCamera) {
      this.threeCamera.aspect = Math.max(1, width) / Math.max(1, height);
      this.threeCamera.updateProjectionMatrix();
      this.syncThreeCamera();
    }
  }

  addShake(amount) {
    this.shakeIntensity = Math.min(25, this.shakeIntensity + amount);
  }

  update(player, dt = 1) {
    if (!player) return;

    // The player cell always remains centered in the viewport
    this.pos.set(player.pos.x, player.pos.y);

    // Dynamic scale: smoothly zoom out as player grows
    const baseRadius = 26;
    const ratio = baseRadius / Math.max(16, player.radius);
    this.targetZoom = clamp(Math.pow(ratio, 0.38), 0.38, 1.25);
    this.zoom = lerp(this.zoom, this.targetZoom, 0.05);

    // Screen shake processing
    if (this.shakeIntensity > 0.1) {
      const angle = Math.random() * Math.PI * 2;
      const dist = this.shakeIntensity * (Math.random() * 0.8 + 0.2);
      this.shakeOffset.set(Math.cos(angle) * dist, Math.sin(angle) * dist);
      this.shakeIntensity *= this.shakeDecay;
    } else {
      this.shakeIntensity = 0;
      this.shakeOffset.set(0, 0);
    }

    this.syncThreeCamera();
  }

  syncThreeCamera() {
    if (!this.threeCamera) {
      const THREE = window.THREE;
      if (THREE) {
        this.threeCamera = new THREE.PerspectiveCamera(
          this.fov,
          Math.max(1, this.viewportWidth) / Math.max(1, this.viewportHeight),
          1,
          15000
        );
        this.threeCamera.up.set(0, 1, 0);
      } else {
        return;
      }
    }

    // Exact distance calibration:
    // With vertical FOV = 50deg, visible height at Z=0 is H = 2 * Z * tan(FOV/2).
    // For 1 world unit to equal zoom screen pixels:
    // Z = viewportHeight / (2 * tan(FOV / 2) * zoom)
    const vFovRad = (this.fov * Math.PI) / 180;
    const halfFovTan = Math.tan(vFovRad * 0.5);
    const zDist = (this.viewportHeight / (2 * halfFovTan)) / Math.max(0.01, this.zoom);

    const camX = this.pos.x + this.shakeOffset.x;
    const camY = this.pos.y + this.shakeOffset.y;

    this.threeCamera.position.set(camX, camY, zDist);
    this.threeCamera.lookAt(camX, camY, 0);
    this.threeCamera.updateMatrixWorld();
  }

  screenToWorld(screenX, screenY) {
    // Exact perspective ray intersection onto the Z=0 gameplay plane
    const centeredX = screenX - (this.viewportWidth / 2 + this.shakeOffset.x);
    const centeredY = screenY - (this.viewportHeight / 2 + this.shakeOffset.y);

    const worldX = centeredX / this.zoom + this.pos.x;
    const worldY = centeredY / this.zoom + this.pos.y;

    return this._scratchWorld.set(worldX, worldY);
  }

  worldToScreen(worldX, worldY) {
    const centeredX = (worldX - this.pos.x) * this.zoom;
    const centeredY = (worldY - this.pos.y) * this.zoom;

    const screenX = centeredX + (this.viewportWidth / 2 + this.shakeOffset.x);
    const screenY = centeredY + (this.viewportHeight / 2 + this.shakeOffset.y);

    return this._scratchScreen.set(screenX, screenY);
  }

  isVisible(worldX, worldY, radius = 50) {
    // Frustum culling check in world space
    const halfW = (this.viewportWidth / 2) / this.zoom + radius;
    const halfH = (this.viewportHeight / 2) / this.zoom + radius;

    return (
      worldX >= this.pos.x - halfW &&
      worldX <= this.pos.x + halfW &&
      worldY >= this.pos.y - halfH &&
      worldY <= this.pos.y + halfH
    );
  }

  applyTransform(ctx) {
    if (!ctx) return;
    ctx.translate(
      this.viewportWidth / 2 + this.shakeOffset.x,
      this.viewportHeight / 2 + this.shakeOffset.y
    );
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.pos.x, -this.pos.y);
  }
}


/* === js/game.js === */
/**
 * Omnivore - Core Game Engine (Three.js 3D Microcosmic Simulation)
 * Orchestrates Three.js WebGL rendering, 2D physics plane invariance,
 * entity lifecycles, collision detection, and HUD synchronization.
 */
const GAME_STATES = {
  START: "start",
  PLAYING: "playing",
  GAME_OVER: "game_over",
  PAUSED: "paused"
};

/**
 * Safe localStorage wrappers to prevent SecurityError in sandboxed/file contexts
 */
function safeGetStorage(key, fallback = "0") {
  try {
    return localStorage.getItem(key) || fallback;
  } catch (err) {
    return fallback;
  }
}

function safeSetStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    // Storage access restricted or disabled
  }
}
class Game {
  constructor(canvas, uiElements) {
    this.canvas = canvas;
    this.ui = uiElements;

    // 2D Text Overlay Canvas for pixel-crisp HUD indicator floating text
    this.textCanvas = document.getElementById("text-canvas");
    this.textCtx = this.textCanvas ? this.textCanvas.getContext("2d") : null;

    // Simulation World Bounds & Capacity
    this.worldRadius = 3500;
    this.maxCells = 180;

    // Three.js WebGL Engine Initialization
    const THREE = window.THREE;
    if (THREE) {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: false,
        powerPreference: "high-performance"
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(window.innerWidth, window.innerHeight, false);
      this.scene = new THREE.Scene();
    } else {
      this.renderer = null;
      this.scene = null;
    }

    // Core Systems
    this.camera = new Camera(canvas.width, canvas.height);
    this.background = new BackgroundSystem(this.worldRadius);
    if (this.scene) this.background.initThreeScene(this.scene);

    this.particles = new ParticleManager();
    if (this.scene) this.particles.initThreeScene(this.scene);

    this.sound = new SoundSystem();

    // Game State
    this.state = GAME_STATES.START;
    this.player = null;
    this.aiCells = [];

    // Metrics
    this.score = 0;
    this.highScore = parseInt(safeGetStorage("omnivore_high_score", "0"), 10);
    this.cellsEaten = 0;
    this.startTime = 0;
    this.timeSurvived = 0;

    // Input Tracking & Mobile Gestures
    this.mouseScreen = new Vector2D(canvas.width / 2, canvas.height / 2);
    this.canvasRect = { left: 0, top: 0, width: canvas.width, height: canvas.height };
    this.isMouseDown = false;
    this.lastTapTime = 0;
    this.lastTapPos = new Vector2D(0, 0);

    // Loop Timing
    this.lastTimestamp = 0;

    this.bindEvents();
    this.resize();
  }

  bindEvents() {
    window.addEventListener("resize", () => this.resize());
    window.addEventListener(
      "scroll",
      () => {
        this.canvasRect = this.canvas.getBoundingClientRect();
      },
      { passive: true }
    );

    window.addEventListener("mousemove", (e) => {
      const rect = this.canvasRect || this.canvas.getBoundingClientRect();
      this.mouseScreen.set(e.clientX - rect.left, e.clientY - rect.top);
    });

    window.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        this.sound.init();
        if (this.state === GAME_STATES.PLAYING) {
          this.triggerPlayerDash();
        }
      }
    });

    window.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        if (this.state === GAME_STATES.PLAYING) {
          this.triggerPlayerDash();
        }
      } else if (e.code === "KeyP" || e.code === "Escape") {
        this.togglePause();
      } else if (e.code === "KeyM") {
        this.toggleAudio();
      }
    });

    // Mobile Touch Steering & Double-Tap Dash System
    window.addEventListener(
      "touchstart",
      (e) => {
        if (e.target && (e.target.closest("button") || e.target.closest(".screen-card"))) {
          return;
        }

        e.preventDefault();
        this.sound.init();

        if (e.touches.length > 0) {
          const rect = this.canvasRect || this.canvas.getBoundingClientRect();
          const touchX = e.touches[0].clientX - rect.left;
          const touchY = e.touches[0].clientY - rect.top;

          this.mouseScreen.set(touchX, touchY);

          // Double-tap detection for Dash
          const now = performance.now();
          const timeDiff = now - this.lastTapTime;
          const distDiff = Math.hypot(touchX - this.lastTapPos.x, touchY - this.lastTapPos.y);

          if (timeDiff < 300 && distDiff < 50) {
            if (this.state === GAME_STATES.PLAYING) {
              this.triggerPlayerDash();
            }
            this.lastTapTime = 0;
          } else {
            this.lastTapTime = now;
            this.lastTapPos.set(touchX, touchY);
          }
        }
      },
      { passive: false }
    );

    window.addEventListener(
      "touchmove",
      (e) => {
        if (e.target && (e.target.closest("button") || e.target.closest(".screen-card"))) {
          return;
        }

        e.preventDefault();

        if (e.touches.length > 0) {
          const rect = this.canvasRect || this.canvas.getBoundingClientRect();
          this.mouseScreen.set(
            e.touches[0].clientX - rect.left,
            e.touches[0].clientY - rect.top
          );
        }
      },
      { passive: false }
    );

    window.addEventListener(
      "touchend",
      (e) => {
        if (e.target && (e.target.closest("button") || e.target.closest(".screen-card"))) {
          return;
        }
        e.preventDefault();
      },
      { passive: false }
    );

    // UI Buttons: Fast-response touch and click binding
    const attachButtonHandler = (btn, action) => {
      if (!btn) return;
      let lastTrigger = 0;
      const trigger = (e) => {
        const now = performance.now();
        if (now - lastTrigger < 300) return;
        lastTrigger = now;
        action(e);
      };
      btn.addEventListener("click", trigger);
      btn.addEventListener(
        "touchend",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          trigger(e);
        },
        { passive: false }
      );
    };

    attachButtonHandler(this.ui.startBtn, () => this.start());
    attachButtonHandler(this.ui.restartBtn, () => this.start());
    attachButtonHandler(this.ui.muteBtn, () => this.toggleAudio());
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.canvas.width = w;
    this.canvas.height = h;

    if (this.textCanvas) {
      this.textCanvas.width = w;
      this.textCanvas.height = h;
    }

    this.canvasRect = this.canvas.getBoundingClientRect();
    this.camera.resize(w, h);

    if (this.renderer) {
      this.renderer.setSize(w, h, false);
    }
  }

  toggleAudio() {
    const isMuted = this.sound.toggleMute();
    if (this.ui.muteBtn) {
      this.ui.muteBtn.classList.toggle("muted", isMuted);
      this.ui.muteBtn.setAttribute("aria-label", isMuted ? "Unmute sound" : "Mute sound");
      this.ui.muteBtn.innerHTML = isMuted
        ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`
        : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
    }
  }

  togglePause() {
    if (this.state === GAME_STATES.PLAYING) {
      this.state = GAME_STATES.PAUSED;
      this.sound.pause();
      if (this.ui.pauseModal) this.ui.pauseModal.classList.remove("hidden");
    } else if (this.state === GAME_STATES.PAUSED) {
      this.state = GAME_STATES.PLAYING;
      this.sound.resume();
      if (this.ui.pauseModal) this.ui.pauseModal.classList.add("hidden");
    }
  }

  start() {
    this.sound.init();
    this.sound.resume();

    // Reset Metrics
    this.score = 0;
    this.cellsEaten = 0;
    this.startTime = performance.now();
    this.timeSurvived = 0;

    // Clean up existing cells in Three.js scene
    if (this.player) {
      this.player.destroy(this.scene);
    }
    for (let i = 0; i < this.aiCells.length; i++) {
      this.aiCells[i].destroy(this.scene);
    }
    this.aiCells = [];

    // Reset Player at origin
    this.player = new Player(0, 0, 26);
    if (this.player.threeGroup && this.scene) {
      this.scene.add(this.player.threeGroup);
    }

    this.camera.pos.set(0, 0);
    this.camera.zoom = 1.0;

    // Clear particles
    this.particles.clear();

    // Populate Initial Ecosystem
    this.populateInitialEcosystem();

    // Switch State & update UI overlays
    this.state = GAME_STATES.PLAYING;
    if (this.ui.startScreen) this.ui.startScreen.classList.add("hidden");
    if (this.ui.gameOverScreen) this.ui.gameOverScreen.classList.add("hidden");
    if (this.ui.pauseModal) this.ui.pauseModal.classList.add("hidden");
    if (this.ui.hud) this.ui.hud.classList.remove("hidden");
  }

  populateInitialEcosystem() {
    for (let i = 0; i < this.maxCells; i++) {
      this.spawnRandomCell(false);
    }
  }

  spawnRandomCell(offscreenOnly = true) {
    let pos;
    let attempts = 0;

    while (attempts < 15) {
      attempts++;
      const dist = randomRange(100, this.worldRadius * 0.95);
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;

      if (offscreenOnly && this.camera.isVisible(x, y, 80)) {
        continue;
      }
      pos = new Vector2D(x, y);
      break;
    }

    if (!pos) {
      pos = new Vector2D(randomRange(-2000, 2000), randomRange(-2000, 2000));
    }

    // Role Distribution: 50% Plankton, 24% Prey, 12% Parasite, 14% Predator
    const roll = Math.random();
    let type, radius;

    if (roll < 0.50) {
      type = CELL_TYPES.PLANKTON;
      radius = randomRange(8, 14);
    } else if (roll < 0.74) {
      type = CELL_TYPES.PREY;
      radius = randomRange(16, 36);
    } else if (roll < 0.86) {
      type = CELL_TYPES.PARASITE;
      radius = randomRange(13, 20);
    } else {
      type = CELL_TYPES.PREDATOR;
      const playerRefR = this.player ? this.player.radius : 26;
      radius = randomRange(playerRefR * 0.95, playerRefR * 2.3);
    }

    const cell = new AICell(pos.x, pos.y, radius, type);
    if (cell.threeGroup && this.scene) {
      this.scene.add(cell.threeGroup);
    }
    this.aiCells.push(cell);
  }

  triggerPlayerDash() {
    if (!this.player || this.player.isDead) return;

    const dashResult = this.player.dash();
    if (dashResult) {
      this.particles.createDashTrail(
        dashResult.ejectX,
        dashResult.ejectY,
        dashResult.oppositeAngle,
        "#39ff14",
        this.player.radius
      );

      this.sound.playDash();
      this.camera.addShake(4);

      this.particles.addFloatingText(
        this.player.pos.x,
        this.player.pos.y - this.player.radius - 12,
        "-Dash",
        "#4ade80",
        13
      );
    }
  }

  update(dt = 1) {
    if (this.state !== GAME_STATES.PLAYING) return;

    // Survival timing
    this.timeSurvived = Math.floor((performance.now() - this.startTime) / 1000);

    // 1. Raycast screen pointer to 2D world coordinates on Z=0 plane
    const worldMouse = this.camera.screenToWorld(this.mouseScreen.x, this.mouseScreen.y);
    if (this.player && !this.player.isDead) {
      this.player.setTarget(worldMouse.x, worldMouse.y);
      const hitBoundary = this.player.update(dt, this.worldRadius);
      if (hitBoundary) {
        this.camera.addShake(2.5);
      }
    }

    // 2. Update AI cells (Sensory decisions and physical motion)
    for (let i = 0; i < this.aiCells.length; i++) {
      const cell = this.aiCells[i];
      if (cell.isDead) continue;
      cell.updateAI(this.aiCells, this.player, this.worldRadius);
      cell.update(dt);
    }

    // 3. Resolve Collisions (2D physical plane)
    this.resolveCollisions();

    // 4. Clean up dead cells from scene and replenish ecosystem
    for (let i = this.aiCells.length - 1; i >= 0; i--) {
      const cell = this.aiCells[i];
      if (cell.isDead) {
        cell.destroy(this.scene);
        this.aiCells.splice(i, 1);
      }
    }

    while (this.aiCells.length < this.maxCells) {
      this.spawnRandomCell(true);
    }

    // 5. Update Camera, Particles, and Background
    this.camera.update(this.player, dt);
    this.particles.update(dt);
    this.background.update(dt, this.camera.pos.x, this.camera.pos.y);

    // 6. Sync UI HUD
    this.updateHUD();
  }

  resolveCollisions() {
    if (!this.player || this.player.isDead) return;

    const pPos = this.player.pos;
    const pR = this.player.radius;

    // Player vs AI
    for (let i = 0; i < this.aiCells.length; i++) {
      const cell = this.aiCells[i];
      if (cell.isDead) continue;

      const eatDistance = (pR + cell.radius) * 0.88;
      const dx = cell.pos.x - pPos.x;
      if (Math.abs(dx) > eatDistance) continue;
      const dy = cell.pos.y - pPos.y;
      if (Math.abs(dy) > eatDistance) continue;

      const distSq = dx * dx + dy * dy;
      if (distSq > eatDistance * eatDistance) continue;
      const dist = Math.sqrt(distSq);

      if (dist < eatDistance) {
        // Red parasite attack
        if (cell.type === CELL_TYPES.PARASITE) {
          this.player.loseMassPercent(0.08);

          this.player.flashTimer = 18;
          this.player.flashColor = "#f43f5e";

          this.sound.playLeech();
          this.camera.addShake(7);

          const knockDir = Vector2D.sub(cell.pos, pPos);
          if (knockDir.magSq() < 0.1) knockDir.set(Math.random() - 0.5, Math.random() - 0.5);
          knockDir.normalize();

          cell.vel.set(knockDir.x * 16, knockDir.y * 16);
          cell.pos.set(
            pPos.x + knockDir.x * (pR + cell.radius + 32),
            pPos.y + knockDir.y * (pR + cell.radius + 32)
          );

          const midX = (pPos.x + cell.pos.x) / 2;
          const midY = (pPos.y + cell.pos.y) / 2;
          this.particles.createEatBurst(midX, midY, "#f43f5e", 22, 14);

          this.particles.addFloatingText(
            pPos.x,
            pPos.y - pR - 16,
            "-8% Leech!",
            "#f43f5e",
            15
          );
          continue;
        }

        // Player absorbs smaller cell
        if (pR > cell.radius * 1.05) {
          const eatenMass = Math.round(cell.mass);
          this.player.eat(cell);
          cell.isDead = true;

          const pitch = Math.max(0.6, Math.min(1.8, 40 / cell.radius));
          this.sound.playEat(pitch);
          this.particles.createEatBurst(cell.pos.x, cell.pos.y, cell.glowColor, 18, cell.radius);
          this.camera.addShake(Math.min(9, cell.radius * 0.22));

          this.cellsEaten++;
          this.score += eatenMass;
          if (this.score > this.highScore) {
            this.highScore = this.score;
            safeSetStorage("omnivore_high_score", this.highScore.toString());
          }

          this.particles.addFloatingText(
            cell.pos.x,
            cell.pos.y,
            `+${eatenMass}`,
            cell.glowColor,
            Math.max(14, Math.min(24, Math.round(cell.radius * 0.55)))
          );
        }
        // Larger predator consumes player
        else if (cell.radius > pR * 1.05) {
          this.handleGameOver(cell);
          return;
        }
      }
    }

    // AI vs AI collisions
    const simRadius = 1600;
    const simRadiusSq = simRadius * simRadius;
    for (let i = 0; i < this.aiCells.length; i++) {
      const cellA = this.aiCells[i];
      if (cellA.isDead) continue;

      const pAdx = cellA.pos.x - pPos.x;
      if (Math.abs(pAdx) > simRadius) continue;
      const pAdy = cellA.pos.y - pPos.y;
      if (Math.abs(pAdy) > simRadius) continue;
      if (pAdx * pAdx + pAdy * pAdy > simRadiusSq) continue;

      for (let j = i + 1; j < this.aiCells.length; j++) {
        const cellB = this.aiCells[j];
        if (cellB.isDead) continue;

        if (cellA.type !== CELL_TYPES.PREDATOR && cellB.type !== CELL_TYPES.PREDATOR) continue;

        const pBdx = cellB.pos.x - pPos.x;
        if (Math.abs(pBdx) > simRadius) continue;
        const pBdy = cellB.pos.y - pPos.y;
        if (Math.abs(pBdy) > simRadius) continue;

        const contactDist = (cellA.radius + cellB.radius) * 0.85;
        const abDx = cellB.pos.x - cellA.pos.x;
        if (Math.abs(abDx) > contactDist) continue;
        const abDy = cellB.pos.y - cellA.pos.y;
        if (Math.abs(abDy) > contactDist) continue;

        const abDistSq = abDx * abDx + abDy * abDy;
        if (abDistSq < contactDist * contactDist) {
          if (cellA.radius > cellB.radius * 1.15 && cellA.type === CELL_TYPES.PREDATOR) {
            cellA.eat(cellB);
            cellB.isDead = true;
            this.particles.createEatBurst(cellB.pos.x, cellB.pos.y, cellB.glowColor, 10, cellB.radius);
          } else if (cellB.radius > cellA.radius * 1.15 && cellB.type === CELL_TYPES.PREDATOR) {
            cellB.eat(cellA);
            cellA.isDead = true;
            this.particles.createEatBurst(cellA.pos.x, cellA.pos.y, cellA.glowColor, 10, cellA.radius);
            break;
          }
        }
      }
    }
  }

  handleGameOver(predator) {
    this.player.isDead = true;
    this.state = GAME_STATES.GAME_OVER;

    this.sound.playDeath();
    this.camera.addShake(18);
    this.particles.createEatBurst(this.player.pos.x, this.player.pos.y, "#39ff14", 36, this.player.radius * 1.4);

    if (this.ui.gameOverScreen) {
      setTimeout(() => {
        this.ui.gameOverScreen.classList.remove("hidden");
        if (this.ui.finalMassVal) {
          this.ui.finalMassVal.textContent = Math.round(this.player.mass).toLocaleString();
        }
        if (this.ui.finalScoreVal) {
          this.ui.finalScoreVal.textContent = this.score.toLocaleString();
        }
        if (this.ui.finalTimeVal) {
          const m = Math.floor(this.timeSurvived / 60);
          const s = this.timeSurvived % 60;
          this.ui.finalTimeVal.textContent = `${m}:${s < 10 ? "0" : ""}${s}`;
        }
        if (this.ui.finalBestVal) {
          this.ui.finalBestVal.textContent = this.highScore.toLocaleString();
        }
      }, 500);
    }
  }

  updateHUD() {
    if (!this.player) return;

    if (this.ui.massVal) {
      this.ui.massVal.textContent = Math.round(this.player.mass).toLocaleString();
    }
    if (this.ui.scoreVal) {
      this.ui.scoreVal.textContent = this.score.toLocaleString();
    }
    if (this.ui.timeVal) {
      const m = Math.floor(this.timeSurvived / 60);
      const s = this.timeSurvived % 60;
      this.ui.timeVal.textContent = `${m}:${s < 10 ? "0" : ""}${s}`;
    }
    if (this.ui.dashIndicator) {
      const canDash = this.player.canDash();
      this.ui.dashIndicator.classList.toggle("ready", canDash);
      this.ui.dashIndicator.classList.toggle("recharging", !canDash);
    }
  }

  render() {
    // 1. Clear 2D Text Overlay Canvas
    if (this.textCtx) {
      this.textCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // 2. Frustum Culling for AI Cells to maintain 60 FPS
    for (let i = 0; i < this.aiCells.length; i++) {
      const cell = this.aiCells[i];
      if (cell.threeGroup) {
        cell.threeGroup.visible = !cell.isDead && this.camera.isVisible(cell.pos.x, cell.pos.y, cell.radius * 2);
      }
    }

    // 3. Render 3D Scene with Three.js WebGLRenderer
    if (this.renderer && this.scene && this.camera.threeCamera) {
      this.renderer.render(this.scene, this.camera.threeCamera);
    }

    // 4. Render 2D Floating Score and Combat Feedback Text
    if (this.textCtx) {
      this.particles.renderText(this.textCtx, this.camera);
    }
  }

  loop(timestamp) {
    try {
      if (!this.lastTimestamp) this.lastTimestamp = timestamp;
      const elapsed = timestamp - this.lastTimestamp;
      this.lastTimestamp = timestamp;

      const dt = Math.min(2.5, elapsed / 16.67);

      this.update(dt);
      this.render();

      requestAnimationFrame((t) => this.loop(t));
    } catch (err) {
      console.error("Omnivore Game Loop Exception:", err);
      if (typeof window.showFatalError === "function") {
        window.showFatalError(err.message, "js/game.js (Game.loop)", 0, 0, err);
      }
    }
  }
}


/* === js/main.js === */
/**
 * Omnivore - Main Entry Point
 * Initializes DOM references and starts the game loop.
 * Safely executes whether DOM is loading or already loaded.
 */

let isGameInitialized = false;

function init() {
  if (isGameInitialized) return;

  try {
    const canvas = document.getElementById("game-canvas");
    if (!canvas) {
      console.warn("Omnivore: #game-canvas not yet found, waiting for DOM...");
      return;
    }
    isGameInitialized = true;

    const uiElements = {
      startScreen: document.getElementById("start-screen"),
      startBtn: document.getElementById("start-btn"),
      gameOverScreen: document.getElementById("game-over-screen"),
      restartBtn: document.getElementById("restart-btn"),
      pauseModal: document.getElementById("pause-modal"),
      muteBtn: document.getElementById("mute-btn"),
      hud: document.getElementById("hud"),
      massVal: document.getElementById("hud-mass-val"),
      scoreVal: document.getElementById("hud-score-val"),
      timeVal: document.getElementById("hud-time-val"),
      dashIndicator: document.getElementById("hud-dash-indicator"),
      finalMassVal: document.getElementById("final-mass-val"),
      finalScoreVal: document.getElementById("final-score-val"),
      finalTimeVal: document.getElementById("final-time-val"),
      finalBestVal: document.getElementById("final-best-val")
    };

    const game = new Game(canvas, uiElements);

    // Start the render/update loop
    requestAnimationFrame((timestamp) => game.loop(timestamp));
    console.log("Omnivore: Core engine successfully mounted and running.");
  } catch (err) {
    console.error("Omnivore Initialization Crash:", err);
    if (typeof window.showFatalError === "function") {
      window.showFatalError(err.message, "js/main.js (init)", 0, 0, err);
    }
  }
}

// 1. Immediate attempt: if canvas already exists in parsed DOM, mount immediately
if (document.getElementById("game-canvas")) {
  init();
} else if (document.readyState === "loading") {
  // 2. Otherwise listen for DOM readiness
  document.addEventListener("DOMContentLoaded", init);
} else {
  // 3. Fallback for interactive/complete readyState
  init();
}

// 4. Ultimate fallback if dynamic script was delayed past standard events
window.addEventListener("load", () => {
  if (!isGameInitialized) init();
});



})();
