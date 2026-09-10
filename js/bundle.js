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
 * Omnivore - Procedural Web Audio Engine
 * Zero external audio assets required.
 * Generates an atmospheric abyss ambient drone, liquid consumption pops,
 * hydrodynamic dash pulses, and deep impact reverberations.
 */
class SoundSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.isInitialized = false;

    // Ambient drone nodes
    this.ambientGain = null;
    this.ambientOsc1 = null;
    this.ambientOsc2 = null;
    this.ambientFilter = null;
    this.lfo = null;
  }

  init() {
    if (this.isInitialized) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
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
      const targetGain = this.isMuted ? 0 : 0.7;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  startAbyssAmbience() {
    if (!this.ctx) return;

    // Low-pass filter for deep underwater acoustics
    this.ambientFilter = this.ctx.createBiquadFilter();
    this.ambientFilter.type = "lowpass";
    this.ambientFilter.frequency.setValueAtTime(140, this.ctx.currentTime);
    this.ambientFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

    // Deep sub-bass oscillators
    this.ambientOsc1 = this.ctx.createOscillator();
    this.ambientOsc1.type = "sine";
    this.ambientOsc1.frequency.setValueAtTime(46, this.ctx.currentTime); // F#1

    this.ambientOsc2 = this.ctx.createOscillator();
    this.ambientOsc2.type = "triangle";
    this.ambientOsc2.frequency.setValueAtTime(69, this.ctx.currentTime); // C#2

    // Slow LFO for organic filter breath
    this.lfo = this.ctx.createOscillator();
    this.lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime); // 12-second cycle
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(50, this.ctx.currentTime);
    this.lfo.connect(lfoGain);
    lfoGain.connect(this.ambientFilter.frequency);

    this.ambientOsc1.connect(this.ambientFilter);
    this.ambientOsc2.connect(this.ambientFilter);
    this.ambientFilter.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);

    this.ambientOsc1.start();
    this.ambientOsc2.start();
    this.lfo.start();
  }

  playEat(pitch = 1) {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(500 * pitch, t);
    filter.Q.setValueAtTime(3, t);

    osc.type = "sine";
    const startFreq = 220 * pitch;
    const endFreq = 480 * pitch;

    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.08);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  playDash() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;

    // Filtered noise burst simulating rapid fluid displacement
    const bufferSize = this.ctx.sampleRate * 0.25;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(180, t + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start(t);
    whiteNoise.stop(t + 0.25);

    // Deep sub thump
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(110, t);
    subOsc.frequency.exponentialRampToValueAtTime(40, t + 0.2);

    subGain.gain.setValueAtTime(0.4, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);

    subOsc.start(t);
    subOsc.stop(t + 0.22);
  }

  playDeath() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const frequencies = [82.4, 110, 123.47, 164.8]; // Deep sorrowful low chord E2, A2, B2, E3

    frequencies.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx % 2 === 0 ? "sawtooth" : "sine";
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, t + 1.6);

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(320, t);
      filter.frequency.exponentialRampToValueAtTime(60, t + 1.8);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 1.9);
    });
  }
}


/* === js/particle.js === */
/**
 * Omnivore - Visual Particle & Juice System
 * Handles glowing cytoplasm bursts, mass droplets, shockwave rings,
 * and floating mass indicator text.
 */
class Particle {
  constructor(x, y, vx, vy, color, radius, life) {
    this.pos = new Vector2D(x, y);
    this.vel = new Vector2D(vx, vy);
    this.color = color;
    this.radius = radius;
    this.baseRadius = radius;
    this.maxLife = life;
    this.life = life;
    this.isDead = false;
    this.drag = 0.94;
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
    const progress = this.life / this.maxLife;
    const currentRadius = Math.max(0.2, this.baseRadius * progress);

    ctx.save();
    ctx.globalAlpha = Math.max(0, progress);
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;

    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, currentRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
class ShockwaveRing {
  constructor(x, y, maxRadius, color = "rgba(100, 220, 255, 0.8)", duration = 25) {
    this.pos = new Vector2D(x, y);
    this.currentRadius = 4;
    this.maxRadius = maxRadius;
    this.color = color;
    this.duration = duration;
    this.life = duration;
    this.isDead = false;
  }

  update(dt = 1) {
    this.life -= dt;
    if (this.life <= 0) {
      this.isDead = true;
      return;
    }

    const t = 1 - this.life / this.duration;
    // Ease out cubic
    this.currentRadius = 4 + (this.maxRadius - 4) * (1 - Math.pow(1 - t, 3));
  }

  render(ctx) {
    const alpha = Math.max(0, this.life / this.duration);
    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.globalAlpha = alpha * 0.8;
    ctx.lineWidth = Math.max(1, 4 * alpha);
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.color;

    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.currentRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
class FloatingText {
  constructor(x, y, text, color = "#a5f3fc", fontSize = 16) {
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

  render(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `600 ${this.fontSize}px 'JetBrains Mono', 'Fira Code', monospace`;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.text, this.pos.x, this.pos.y);
    ctx.restore();
  }
}
class ParticleManager {
  constructor() {
    this.particles = [];
    this.shockwaves = [];
    this.floatingTexts = [];
  }

  createEatBurst(x, y, color, count = 18, baseRadius = 15) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randomRange(2, 6.5);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const pRadius = randomRange(1.5, Math.min(6, baseRadius * 0.25));
      const life = randomRange(25, 45);
      this.particles.push(new Particle(x, y, vx, vy, color, pRadius, life));
    }
    this.shockwaves.push(new ShockwaveRing(x, y, baseRadius * 1.8, color, 20));
  }

  createDashTrail(x, y, oppositeAngle, color, radius) {
    const count = 4;
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 0.8;
      const angle = oppositeAngle + spread;
      const speed = randomRange(2.5, 6);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const pRadius = randomRange(2, Math.max(3, radius * 0.15));
      const life = randomRange(20, 35);
      this.particles.push(new Particle(x, y, vx, vy, color, pRadius, life));
    }
    this.shockwaves.push(new ShockwaveRing(x, y, radius * 1.2, color, 16));
  }

  addFloatingText(x, y, text, color, fontSize) {
    this.floatingTexts.push(new FloatingText(x, y, text, color, fontSize));
  }

  update(dt = 1) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update(dt);
      if (this.particles[i].isDead) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      this.shockwaves[i].update(dt);
      if (this.shockwaves[i].isDead) {
        this.shockwaves.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      this.floatingTexts[i].update(dt);
      if (this.floatingTexts[i].isDead) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  render(ctx) {
    // Render shockwaves first (beneath particles)
    for (const shockwave of this.shockwaves) {
      shockwave.render(ctx);
    }
    for (const particle of this.particles) {
      particle.render(ctx);
    }
    for (const ft of this.floatingTexts) {
      ft.render(ctx);
    }
  }

  clear() {
    this.particles = [];
    this.shockwaves = [];
    this.floatingTexts = [];
  }
}


/* === js/cell.js === */
/**
 * Omnivore - Base Biological Cell Class
 * Implements organic membrane undulation, internal organelle simulation,
 * bioluminescent rendering, and viscous fluid physics.
 */
class Cell {
  constructor(x, y, radius = 20, options = {}) {
    this.pos = new Vector2D(x, y);
    this.vel = new Vector2D(0, 0);
    this.acc = new Vector2D(0, 0);

    this.radius = radius;
    this.targetRadius = radius;
    this.minRadius = 10;

    // Biological colors & glow
    this.hue = options.hue !== undefined ? options.hue : randomRange(170, 290);
    this.saturation = options.saturation || 90;
    this.lightness = options.lightness || 55;
    this.baseColor = hsla(this.hue, this.saturation, this.lightness, 0.85);
    this.glowColor = hsla(this.hue, 100, 65, 0.9);
    this.coreColor = hsla((this.hue + 20) % 360, 100, 80, 0.95);

    // Physics parameters (Viscous fluid mechanics)
    this.drag = options.drag || 0.94;
    this.baseMaxSpeed = options.baseMaxSpeed || 5.2;

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
    this.squishFactor = 1.0;
    this.stretchFactor = 1.0;
    this.elasticBounce = 0;

    // Organelle generation (Nucleus & internal structures)
    this.organelleAngle = Math.random() * Math.PI * 2;
    this.organelleRotationSpeed = randomRange(-0.012, 0.012);
    this.organelles = this.generateOrganelles();

    this.isDead = false;
  }

  get mass() {
    return Math.PI * this.radius * this.radius;
  }

  set mass(newMass) {
    this.targetRadius = Math.max(this.minRadius, Math.sqrt(newMass / Math.PI));
  }

  get maxSpeed() {
    // Mass-speed tradeoff: larger cells move slower
    // Speed scales inversely with radius: v_max = base * (r_ref / r)^0.45
    const refRadius = 24;
    const ratio = refRadius / Math.max(12, this.radius);
    return Math.max(1.1, this.baseMaxSpeed * Math.pow(ratio, 0.44));
  }

  generateOrganelles() {
    const list = [];
    // 1. Central / Eccentric Nucleus
    list.push({
      type: "nucleus",
      distRatio: randomRange(0.1, 0.25),
      angleOffset: Math.random() * Math.PI * 2,
      radiusRatio: randomRange(0.32, 0.44),
      rotationSpeed: randomRange(-0.008, 0.008),
      chromatinNodes: [
        { angle: 0.5, dist: 0.4, r: 0.25 },
        { angle: 2.2, dist: 0.5, r: 0.2 },
        { angle: 4.1, dist: 0.35, r: 0.28 }
      ]
    });

    // 2. Mitochondria & Vacuoles
    const count = Math.floor(randomRange(2, 5));
    for (let i = 0; i < count; i++) {
      list.push({
        type: Math.random() > 0.4 ? "mitochondria" : "vacuole",
        distRatio: randomRange(0.45, 0.72),
        angleOffset: (i * (Math.PI * 2 / count)) + randomRange(-0.3, 0.3),
        sizeRatio: randomRange(0.12, 0.22),
        aspect: randomRange(1.4, 2.4),
        orbitSpeed: randomRange(-0.006, 0.006),
        color: hsla((this.hue + randomRange(-35, 35) + 360) % 360, 85, 70, 0.55)
      });
    }

    return list;
  }

  applyForce(force) {
    this.acc.add(force);
  }

  eat(otherCell) {
    // Mass conservation: Add area of eaten cell with slight metabolic loss
    const currentArea = Math.PI * this.targetRadius * this.targetRadius;
    const preyArea = Math.PI * otherCell.radius * otherCell.radius;
    const newArea = currentArea + preyArea * 0.88;
    this.targetRadius = Math.sqrt(newArea / Math.PI);

    // Visual juice on consumption
    this.flashTimer = 18; // Frames of bioluminescent flash
    this.elasticBounce = 0.25; // Elastic gelatinous expansion spike
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
    // 1. Viscous fluid physics integration
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
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
  }

  getMembraneVertices() {
    const vertices = [];
    const effectiveRadius = this.radius * (1 + this.elasticBounce);
    const heading = this.vel.magSq() > 0.01 ? this.vel.heading() : 0;

    for (let i = 0; i < this.numVertices; i++) {
      const angle = (i / this.numVertices) * Math.PI * 2;

      // Multi-frequency biological wave undulation
      const wave1 = Math.sin(angle * this.waveFreq1 + this.membranePhase) * this.waveAmp1;
      const wave2 = Math.cos(angle * this.waveFreq2 - this.membranePhase * 1.3) * this.waveAmp2;
      const breathing = Math.sin(this.membranePhase * 0.8) * 0.02;

      // Velocity alignment: Stretch along movement heading, compress perpendicular
      const relAngle = angle - heading;
      const velocitySquash = (Math.cos(relAngle) * (this.stretchFactor - 1)) +
                             (Math.abs(Math.sin(relAngle)) * (this.squishFactor - 1));

      const r = effectiveRadius * (1 + wave1 + wave2 + breathing + velocitySquash);
      vertices.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
        angle: angle,
        r: r
      });
    }

    return vertices;
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);

    const vertices = this.getMembraneVertices();
    if (vertices.length < 3) {
      ctx.restore();
      return;
    }

    // 1. Bioluminescent Glow Halo
    const isFlashing = this.flashTimer > 0;
    const glowBlur = isFlashing ? 32 : Math.min(26, Math.max(12, this.radius * 0.45));
    ctx.shadowBlur = glowBlur;
    ctx.shadowColor = isFlashing ? "#ffffff" : this.glowColor;

    // 2. Build Organic Spline Membrane Path
    ctx.beginPath();
    const firstMid = {
      x: (vertices[0].x + vertices[1].x) / 2,
      y: (vertices[0].y + vertices[1].y) / 2
    };
    ctx.moveTo(firstMid.x, firstMid.y);

    for (let i = 1; i < vertices.length; i++) {
      const next = vertices[(i + 1) % vertices.length];
      const mid = {
        x: (vertices[i].x + next.x) / 2,
        y: (vertices[i].y + next.y) / 2
      };
      ctx.quadraticCurveTo(vertices[i].x, vertices[i].y, mid.x, mid.y);
    }
    // Connect back to the first midpoint
    ctx.quadraticCurveTo(vertices[0].x, vertices[0].y, firstMid.x, firstMid.y);
    ctx.closePath();

    // 3. Translucent Cytoplasm Shading with Multi-Stop Radial Gradient
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 1.1);
    if (isFlashing) {
      grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      grad.addColorStop(0.5, hsla(this.hue, 100, 85, 0.8));
      grad.addColorStop(1, hsla(this.hue, 100, 70, 0.9));
    } else {
      grad.addColorStop(0, hsla(this.hue, this.saturation, 70, 0.45));
      grad.addColorStop(0.4, hsla(this.hue, this.saturation, 55, 0.35));
      grad.addColorStop(0.85, hsla(this.hue, this.saturation, 45, 0.6));
      grad.addColorStop(1, hsla(this.hue, 100, 65, 0.85));
    }

    ctx.fillStyle = grad;
    ctx.fill();

    // 4. Outer Membrane Wall Stroke
    ctx.lineWidth = Math.max(1.8, Math.min(4.5, this.radius * 0.08));
    ctx.strokeStyle = isFlashing ? "#ffffff" : hsla(this.hue, 100, 75, 0.9);
    ctx.stroke();

    // 5. Internal Organelles (Nucleus & floating structures)
    this.renderOrganelles(ctx);

    ctx.restore();
  }

  renderOrganelles(ctx) {
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.rotate(this.organelleAngle);

    for (const org of this.organelles) {
      const dist = this.radius * org.distRatio;
      const x = Math.cos(org.angleOffset) * dist;
      const y = Math.sin(org.angleOffset) * dist;

      if (org.type === "nucleus") {
        const nRadius = this.radius * org.radiusRatio;

        // Nucleus outer aura
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = hsla((this.hue + 15) % 360, 90, 65, 0.4);
        ctx.beginPath();
        ctx.arc(0, 0, nRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = hsla((this.hue + 30) % 360, 100, 80, 0.75);
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Dense Nucleolus center
        ctx.fillStyle = hsla((this.hue + 45) % 360, 100, 90, 0.85);
        ctx.beginPath();
        ctx.arc(0, 0, nRadius * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Chromatin spots
        for (const node of org.chromatinNodes) {
          const nx = Math.cos(node.angle) * (nRadius * node.dist);
          const ny = Math.sin(node.angle) * (nRadius * node.dist);
          ctx.fillStyle = hsla(this.hue, 100, 95, 0.7);
          ctx.beginPath();
          ctx.arc(nx, ny, nRadius * node.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (org.type === "mitochondria") {
        const mSize = this.radius * org.sizeRatio;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(org.angleOffset * 1.5);
        ctx.fillStyle = org.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, mSize * org.aspect, mSize, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      } else if (org.type === "vacuole") {
        const vRadius = this.radius * org.sizeRatio;
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
        ctx.beginPath();
        ctx.arc(0, 0, vRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.restore();
  }
}


/* === js/player.js === */
/**
 * Omnivore - Player Amoeba Class
 * Subclasses Cell. Features wiggling cilia locomotion, mouse inertia swimming,
 * mass-cost dash propulsion, and glowing bioluminescent cyan-teal aesthetics.
 */
class Player extends Cell {
  constructor(x, y, radius = 26) {
    super(x, y, radius, {
      hue: 182, // Bioluminescent electric cyan / turquoise
      saturation: 95,
      lightness: 55,
      drag: 0.94,
      baseMaxSpeed: 5.6
    });

    // Swimming & cilia locomotion state
    this.ciliaCount = 36;
    this.ciliaPhase = 0;
    this.ciliaBaseLength = 9;

    // Dash mechanic state
    this.dashCooldown = 0;
    this.dashCooldownMax = 22; // ~0.35s at 60fps
    this.dashForce = 14.5;
    this.dashCostPercent = 0.035; // 3.5% of mass per dash
    this.isDashing = false;
    this.dashGlowTimer = 0;

    // Target position (world coordinates from mouse)
    this.targetPos = new Vector2D(x, y);
  }

  setTarget(worldX, worldY) {
    this.targetPos.set(worldX, worldY);
  }

  canDash() {
    return this.dashCooldown <= 0 && this.radius > 13;
  }

  dash() {
    if (!this.canDash()) return null;

    // Direction toward target
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

  update(dt = 1) {
    // 1. Swim towards cursor with viscous fluid inertia
    const toTarget = Vector2D.sub(this.targetPos, this.pos);
    const distToTarget = toTarget.mag();

    if (distToTarget > 4) {
      toTarget.normalize();
      // Distance easing: Gentle thrust when close, full thrust when far
      const thrustScale = Math.min(1, distToTarget / 70);
      const thrust = 0.42 * thrustScale;
      this.applyForce(toTarget.mult(thrust));
    }

    // 2. Dash cooldown and glow decay
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.dashGlowTimer > 0) this.dashGlowTimer -= dt;

    // 3. Cilia oscillation frequency speeds up when moving faster
    const currentSpeed = this.vel.mag();
    this.ciliaPhase += 0.12 + (currentSpeed / this.maxSpeed) * 0.22;

    // 4. Update parent Cell physics
    super.update(dt);
  }

  render(ctx) {
    // 1. Render wiggling cilia locomotion hairs around membrane
    this.renderCilia(ctx);

    // 2. Render organic cell body, glow, and organelles
    super.render(ctx);

    // 3. Render Dash Aura if actively dashing
    if (this.dashGlowTimer > 0) {
      ctx.save();
      ctx.translate(this.pos.x, this.pos.y);
      const auraAlpha = (this.dashGlowTimer / 14) * 0.6;
      ctx.strokeStyle = `rgba(130, 245, 255, ${auraAlpha})`;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 24;
      ctx.shadowColor = "#38bdf8";
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 1.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  renderCilia(ctx) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);

    const speed = this.vel.mag();
    const moveHeading = speed > 0.1 ? this.vel.heading() : 0;
    const vertices = this.getMembraneVertices();
    const numCilia = Math.max(28, Math.min(50, Math.floor(this.radius * 1.2)));

    ctx.strokeStyle = hsla(this.hue, 80, 75, 0.7);
    ctx.lineWidth = 1.3;
    ctx.lineCap = "round";

    for (let i = 0; i < numCilia; i++) {
      const angle = (i / numCilia) * Math.PI * 2;

      // Base position along undulating membrane
      const baseR = this.radius * (1 + Math.sin(angle * this.waveFreq1 + this.membranePhase) * this.waveAmp1);
      const baseX = Math.cos(angle) * baseR;
      const baseY = Math.sin(angle) * baseR;

      // Swimming stroke dynamics: Cilia pointing away from movement stroke harder
      const relAngle = angle - moveHeading;
      const isTrailing = Math.cos(relAngle) < 0; // Back side of cell
      const strokeMultiplier = isTrailing ? 1.4 : 0.8;

      // Hair wiggling wave
      const wave = Math.sin(this.ciliaPhase * 1.5 - angle * 4) * 0.45 * strokeMultiplier;
      const ciliumLength = (this.ciliaBaseLength + Math.min(8, this.radius * 0.15)) * strokeMultiplier;

      // Outer tip position
      const tipAngle = angle + wave;
      const tipX = baseX + Math.cos(tipAngle) * ciliumLength;
      const tipY = baseY + Math.sin(tipAngle) * ciliumLength;

      // Gentle curve via midpoint control
      const ctrlAngle = angle + wave * 0.5;
      const ctrlX = baseX + Math.cos(ctrlAngle) * (ciliumLength * 0.5);
      const ctrlY = baseY + Math.sin(ctrlAngle) * (ciliumLength * 0.5);

      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
      ctx.stroke();
    }

    ctx.restore();
  }
}


/* === js/aiCell.js === */
/**
 * Omnivore - AI Biological Organism Class
 * Subclasses Cell. Implements sensory detection, predator hunting,
 * prey fleeing, and ambient plankton drifting behaviors.
 */
const CELL_TYPES = {
  PLANKTON: "plankton",
  PREY: "prey",
  PREDATOR: "predator"
};
class AICell extends Cell {
  constructor(x, y, radius, type = CELL_TYPES.PREY) {
    // Generate distinct bioluminescent themes based on ecological role
    let hue, saturation, lightness, baseMaxSpeed;

    if (type === CELL_TYPES.PLANKTON) {
      hue = randomChoice([140, 165, 80, 50]); // Neon emerald, teal, lime, or amber
      saturation = 95;
      lightness = 60;
      baseMaxSpeed = 2.4;
    } else if (type === CELL_TYPES.PREY) {
      hue = randomChoice([200, 230, 270, 180]); // Sky blue, sapphire, amethyst, cyan
      saturation = 90;
      lightness = 55;
      baseMaxSpeed = 4.8;
    } else {
      // PREDATOR
      hue = randomChoice([345, 10, 280, 30]); // Crimson red, blood orange, abyssal purple, toxic amber
      saturation = 100;
      lightness = 52;
      baseMaxSpeed = 4.2;
    }

    super(x, y, radius, {
      hue,
      saturation,
      lightness,
      drag: 0.94,
      baseMaxSpeed
    });

    this.type = type;
    this.sensorRadius = Math.max(160, radius * 4.2);

    // Wandering wander-angle for organic fluid drifting
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.wanderChangeSpeed = randomRange(0.02, 0.08);

    // AI decision tick timer to optimize CPU
    this.decisionTimer = Math.floor(Math.random() * 10);
    this.decisionInterval = 6;
  }

  updateAI(neighbors, player, worldRadius = 3500) {
    this.decisionTimer++;
    if (this.decisionTimer < this.decisionInterval) return;
    this.decisionTimer = 0;

    let steerForce = new Vector2D(0, 0);

    // 1. World boundary soft constraint
    const distFromOrigin = this.pos.mag();
    if (distFromOrigin > worldRadius * 0.85) {
      const returnForce = this.pos.clone().mult(-1).normalize().mult(0.35);
      this.applyForce(returnForce);
      return;
    }

    // 2. Plankton just gently drifts
    if (this.type === CELL_TYPES.PLANKTON) {
      this.wanderAngle += (Math.random() - 0.5) * 0.4;
      const wander = Vector2D.fromAngle(this.wanderAngle, 0.08);
      this.applyForce(wander);
      return;
    }

    // 3. Scan for threats & food
    let closestThreat = null;
    let closestThreatDist = Infinity;
    let closestFood = null;
    let closestFoodDist = Infinity;

    // Check Player
    if (player && !player.isDead) {
      const d = this.pos.dist(player.pos);
      if (d < this.sensorRadius + player.radius) {
        if (player.radius > this.radius * 1.06) {
          closestThreat = player;
          closestThreatDist = d;
        } else if (this.radius > player.radius * 1.06 && this.type === CELL_TYPES.PREDATOR) {
          closestFood = player;
          closestFoodDist = d;
        }
      }
    }

    // Check Neighboring AI Cells
    for (let i = 0; i < neighbors.length; i++) {
      const other = neighbors[i];
      if (other === this || other.isDead) continue;

      const d = this.pos.dist(other.pos);
      if (d > this.sensorRadius + other.radius) continue;

      // Is other cell dangerous to us?
      if (other.radius > this.radius * 1.06) {
        if (d < closestThreatDist) {
          closestThreat = other;
          closestThreatDist = d;
        }
      }
      // Is other cell edible for us?
      else if (this.radius > other.radius * 1.06 && (this.type === CELL_TYPES.PREDATOR || other.type === CELL_TYPES.PLANKTON)) {
        if (d < closestFoodDist) {
          closestFood = other;
          closestFoodDist = d;
        }
      }
    }

    // 4. Behavioral execution
    // Priority A: Flee from predators
    if (closestThreat) {
      const fleeVec = Vector2D.sub(this.pos, closestThreat.pos).normalize();
      const urgency = clamp(1 - (closestThreatDist / this.sensorRadius), 0.3, 1.0);
      steerForce.add(fleeVec.mult(0.55 * urgency));
    }
    // Priority B: Hunt edible prey
    else if (closestFood) {
      const huntVec = Vector2D.sub(closestFood.pos, this.pos).normalize();
      steerForce.add(huntVec.mult(0.38));
    }
    // Priority C: Ambient fluid wandering
    else {
      this.wanderAngle += (Math.random() - 0.5) * this.wanderChangeSpeed * 5;
      const wander = Vector2D.fromAngle(this.wanderAngle, 0.18);
      steerForce.add(wander);
    }

    this.applyForce(steerForce);
  }
}


/* === js/background.js === */
/**
 * Omnivore - Atmospheric Parallax Background System
 * Renders multi-layered out-of-focus bokeh orbs, drifting marine snow,
 * and an organic fluid coordinate grid with deep underwater vignette.
 */
class BackgroundSystem {
  constructor(worldRadius = 3500) {
    this.worldRadius = worldRadius;

    // Layer 1: Far, massive out-of-focus bokeh orbs (speed factor ~0.15)
    this.farBokeh = this.createBokehOrbs(45, 45, 110, 0.08, 0.18);

    // Layer 2: Mid-depth marine snow & bioluminescent dust (speed factor ~0.42)
    this.midSnow = this.createMarineSnow(160, 2, 5.5, 0.25, 0.45);

    // Subtle fluid grid spacing
    this.gridSpacing = 160;
  }

  createBokehOrbs(count, minR, maxR, minAlpha, maxAlpha) {
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push({
        x: randomRange(-this.worldRadius * 0.9, this.worldRadius * 0.9),
        y: randomRange(-this.worldRadius * 0.9, this.worldRadius * 0.9),
        radius: randomRange(minR, maxR),
        alpha: randomRange(minAlpha, maxAlpha),
        hue: randomRange(170, 240), // Cyan, deep turquoise, abyssal indigo
        driftAngle: Math.random() * Math.PI * 2,
        driftSpeed: randomRange(0.08, 0.22),
        pulseSpeed: randomRange(0.008, 0.02),
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
    return list;
  }

  createMarineSnow(count, minR, maxR, minAlpha, maxAlpha) {
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push({
        x: randomRange(-this.worldRadius, this.worldRadius),
        y: randomRange(-this.worldRadius, this.worldRadius),
        radius: randomRange(minR, maxR),
        baseAlpha: randomRange(minAlpha, maxAlpha),
        hue: randomRange(160, 210),
        vx: randomRange(-0.15, 0.15),
        vy: randomRange(-0.15, 0.15),
        flickerPhase: Math.random() * Math.PI * 2,
        flickerSpeed: randomRange(0.02, 0.05)
      });
    }
    return list;
  }

  update(dt = 1) {
    // Animate bokeh orbs gently
    for (const b of this.farBokeh) {
      b.x += Math.cos(b.driftAngle) * b.driftSpeed * dt;
      b.y += Math.sin(b.driftAngle) * b.driftSpeed * dt;
      b.pulsePhase += b.pulseSpeed * dt;
    }

    // Animate marine snow
    for (const s of this.midSnow) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.flickerPhase += s.flickerSpeed * dt;
    }
  }

  render(ctx, camera, viewWidth, viewHeight) {
    // 1. Deep abyss vignette background fill
    ctx.save();
    const bgGrad = ctx.createRadialGradient(
      viewWidth / 2, viewHeight / 2, 80,
      viewWidth / 2, viewHeight / 2, Math.max(viewWidth, viewHeight) * 0.75
    );
    bgGrad.addColorStop(0, "#051329"); // Deep abyssal cyan-tinted core
    bgGrad.addColorStop(0.55, "#020714"); // Dark abyss indigo
    bgGrad.addColorStop(1, "#010308"); // Void black edge

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, viewWidth, viewHeight);
    ctx.restore();

    // 2. Render Far Bokeh Orbs (Parallax factor ~0.15)
    ctx.save();
    const farParallax = 0.15;
    ctx.translate(viewWidth / 2, viewHeight / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.pos.x * farParallax, -camera.pos.y * farParallax);

    for (const b of this.farBokeh) {
      const pulse = 1 + Math.sin(b.pulsePhase) * 0.12;
      const r = b.radius * pulse;

      const bokehGrad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
      bokehGrad.addColorStop(0, hsla(b.hue, 85, 65, b.alpha * 1.5));
      bokehGrad.addColorStop(0.6, hsla(b.hue, 80, 45, b.alpha * 0.6));
      bokehGrad.addColorStop(1, hsla(b.hue, 80, 30, 0));

      ctx.fillStyle = bokehGrad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. Render Mid-depth Marine Snow & Spores (Parallax factor ~0.45)
    ctx.save();
    const midParallax = 0.45;
    ctx.translate(viewWidth / 2, viewHeight / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.pos.x * midParallax, -camera.pos.y * midParallax);

    for (const s of this.midSnow) {
      const alpha = s.baseAlpha * (0.8 + Math.sin(s.flickerPhase) * 0.2);
      ctx.fillStyle = hsla(s.hue, 90, 75, alpha);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderWorldGrid(ctx, camera, viewWidth, viewHeight) {
    // Rendered in camera world space: subtle fluid grid coordinates
    ctx.save();

    // Calculate visible bounds in world coordinates
    const halfW = (viewWidth / 2) / camera.zoom;
    const halfH = (viewHeight / 2) / camera.zoom;
    const left = camera.pos.x - halfW;
    const right = camera.pos.x + halfW;
    const top = camera.pos.y - halfH;
    const bottom = camera.pos.y + halfH;

    const startX = Math.floor(left / this.gridSpacing) * this.gridSpacing;
    const endX = Math.ceil(right / this.gridSpacing) * this.gridSpacing;
    const startY = Math.floor(top / this.gridSpacing) * this.gridSpacing;
    const endY = Math.ceil(bottom / this.gridSpacing) * this.gridSpacing;

    // Subtle fluid coordinate grid points & faint lines
    ctx.strokeStyle = "rgba(40, 110, 160, 0.08)";
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let x = startX; x <= endX; x += this.gridSpacing) {
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
    }
    for (let y = startY; y <= endY; y += this.gridSpacing) {
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
    }
    ctx.stroke();

    // Fine glowing coordinate nodes
    ctx.fillStyle = "rgba(70, 190, 230, 0.18)";
    for (let x = startX; x <= endX; x += this.gridSpacing) {
      for (let y = startY; y <= endY; y += this.gridSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // World Boundary Membrane (Primordial bio-barrier ring)
    ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    ctx.lineWidth = 6;
    ctx.shadowBlur = 28;
    ctx.shadowColor = "#0284c7";
    ctx.beginPath();
    ctx.arc(0, 0, this.worldRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Outermost warning ring
    ctx.strokeStyle = "rgba(239, 68, 68, 0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, this.worldRadius + 20, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}


/* === js/camera.js === */
/**
 * Omnivore - Dynamic Camera System
 * Centers the player in the viewport, applies smooth dynamic zoom-out
 * as the cell expands, converts mouse screen coordinates to world space,
 * and manages fluid screen-shake impulses.
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
  }

  resize(width, height) {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  addShake(amount) {
    this.shakeIntensity = Math.min(25, this.shakeIntensity + amount);
  }

  update(player, dt = 1) {
    if (!player) return;

    // Requirement: The player cell always remains exactly in the center of the screen
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
  }

  applyTransform(ctx) {
    ctx.translate(
      this.viewportWidth / 2 + this.shakeOffset.x,
      this.viewportHeight / 2 + this.shakeOffset.y
    );
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.pos.x, -this.pos.y);
  }

  screenToWorld(screenX, screenY) {
    // Inverse transformation of applyTransform
    const centeredX = screenX - (this.viewportWidth / 2 + this.shakeOffset.x);
    const centeredY = screenY - (this.viewportHeight / 2 + this.shakeOffset.y);

    const worldX = centeredX / this.zoom + this.pos.x;
    const worldY = centeredY / this.zoom + this.pos.y;

    return new Vector2D(worldX, worldY);
  }

  worldToScreen(worldX, worldY) {
    const centeredX = (worldX - this.pos.x) * this.zoom;
    const centeredY = (worldY - this.pos.y) * this.zoom;

    const screenX = centeredX + (this.viewportWidth / 2 + this.shakeOffset.x);
    const screenY = centeredY + (this.viewportHeight / 2 + this.shakeOffset.y);

    return new Vector2D(screenX, screenY);
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
}


/* === js/game.js === */
/**
 * Omnivore - Core Game Engine
 * Orchestrates game state, entity lifecycles, collision detection,
 * spatial optimization, input processing, and HUD synchronization.
 */
const GAME_STATES = {
  START: "start",
  PLAYING: "playing",
  GAME_OVER: "game_over",
  PAUSED: "paused"
};
class Game {
  constructor(canvas, uiElements) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ui = uiElements;

    // Simulation World Bounds
    this.worldRadius = 3500;
    this.maxCells = 200;

    // Core Systems
    this.camera = new Camera(canvas.width, canvas.height);
    this.background = new BackgroundSystem(this.worldRadius);
    this.particles = new ParticleManager();
    this.sound = new SoundSystem();

    // Game State
    this.state = GAME_STATES.START;
    this.player = null;
    this.aiCells = [];

    // Metrics
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem("omnivore_high_score") || "0", 10);
    this.cellsEaten = 0;
    this.startTime = 0;
    this.timeSurvived = 0;

    // Input Tracking
    this.mouseScreen = new Vector2D(canvas.width / 2, canvas.height / 2);
    this.isMouseDown = false;

    // Loop Timing
    this.lastTimestamp = 0;

    this.bindEvents();
    this.resize();
  }

  bindEvents() {
    window.addEventListener("resize", () => this.resize());

    window.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseScreen.set(e.clientX - rect.left, e.clientY - rect.top);
    });

    window.addEventListener("mousedown", (e) => {
      if (e.button === 0) { // Left click
        this.sound.init(); // Audio context resume on first interaction
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

    // Touch Support for mobile / touchpads
    window.addEventListener("touchmove", (e) => {
      if (e.touches.length > 0) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseScreen.set(
          e.touches[0].clientX - rect.left,
          e.touches[0].clientY - rect.top
        );
      }
    }, { passive: true });

    window.addEventListener("touchstart", (e) => {
      this.sound.init();
      if (e.touches.length > 0) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseScreen.set(
          e.touches[0].clientX - rect.left,
          e.touches[0].clientY - rect.top
        );
      }
      if (this.state === GAME_STATES.PLAYING) {
        this.triggerPlayerDash();
      }
    }, { passive: true });

    // UI Buttons
    if (this.ui.startBtn) {
      this.ui.startBtn.addEventListener("click", () => this.start());
    }
    if (this.ui.restartBtn) {
      this.ui.restartBtn.addEventListener("click", () => this.start());
    }
    if (this.ui.muteBtn) {
      this.ui.muteBtn.addEventListener("click", () => this.toggleAudio());
    }
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.camera.resize(this.canvas.width, this.canvas.height);
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
      if (this.ui.pauseModal) this.ui.pauseModal.classList.remove("hidden");
    } else if (this.state === GAME_STATES.PAUSED) {
      this.state = GAME_STATES.PLAYING;
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

    // Reset Player at origin
    this.player = new Player(0, 0, 26);
    this.camera.pos.set(0, 0);
    this.camera.zoom = 1.0;

    // Clear particles
    this.particles.clear();

    // Populate Initial Ecosystem
    this.aiCells = [];
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

      // If offscreenOnly, ensure it's outside camera view
      if (offscreenOnly && this.camera.isVisible(x, y, 80)) {
        continue;
      }
      pos = new Vector2D(x, y);
      break;
    }

    if (!pos) {
      pos = new Vector2D(randomRange(-2000, 2000), randomRange(-2000, 2000));
    }

    // Role Distribution: 62% Plankton, 26% Prey, 12% Predator
    const roll = Math.random();
    let type, radius;

    if (roll < 0.62) {
      type = CELL_TYPES.PLANKTON;
      radius = randomRange(8, 14);
    } else if (roll < 0.88) {
      type = CELL_TYPES.PREY;
      radius = randomRange(16, 36);
    } else {
      type = CELL_TYPES.PREDATOR;
      // Apex predators can be significantly larger than starting player
      const playerRefR = this.player ? this.player.radius : 26;
      radius = randomRange(playerRefR * 0.95, playerRefR * 2.3);
    }

    const cell = new AICell(pos.x, pos.y, radius, type);
    this.aiCells.push(cell);
  }

  triggerPlayerDash() {
    if (!this.player || this.player.isDead) return;

    const dashResult = this.player.dash();
    if (dashResult) {
      // Eject glowing mass behind cell
      this.particles.createDashTrail(
        dashResult.ejectX,
        dashResult.ejectY,
        dashResult.oppositeAngle,
        "#38bdf8",
        this.player.radius
      );

      // Sound & Screen Shake
      this.sound.playDash();
      this.camera.addShake(4);

      // Floating text
      this.particles.addFloatingText(
        this.player.pos.x,
        this.player.pos.y - this.player.radius - 12,
        "-Dash",
        "#7dd3fc",
        13
      );
    }
  }

  update(dt) {
    // Keep ambient abyss background animated at all times
    this.background.update(dt);

    if (this.state !== GAME_STATES.PLAYING) return;

    // Update Survival Time
    this.timeSurvived = Math.floor((performance.now() - this.startTime) / 1000);

    // 1. Update Camera Mouse World Position
    const worldMouse = this.camera.screenToWorld(this.mouseScreen.x, this.mouseScreen.y);
    this.player.setTarget(worldMouse.x, worldMouse.y);

    // 2. Update Player
    this.player.update(dt);

    // 4. Update Camera tracking centered on player
    this.camera.update(this.player, dt);

    // 5. Update AI Cells & Food Web
    // Cull and maintain population
    while (this.aiCells.length < this.maxCells) {
      this.spawnRandomCell(true);
    }

    for (let i = 0; i < this.aiCells.length; i++) {
      const cell = this.aiCells[i];
      cell.updateAI(this.aiCells, this.player, this.worldRadius);
      cell.update(dt);
    }

    // 6. Collision Resolution (Player vs AI and AI vs AI)
    this.resolveCollisions();

    // 7. Cleanup Dead Cells
    for (let i = this.aiCells.length - 1; i >= 0; i--) {
      if (this.aiCells[i].isDead) {
        this.aiCells.splice(i, 1);
      }
    }

    // 8. Update Particles
    this.particles.update(dt);

    // 9. Update HUD UI
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

      const dist = pPos.dist(cell.pos);
      const eatDistance = (pR + cell.radius) * 0.88;

      if (dist < eatDistance) {
        // Player is larger: EAT!
        if (pR > cell.radius * 1.05) {
          const eatenMass = Math.round(cell.mass);
          this.player.eat(cell);
          cell.isDead = true;

          // Sound, Juice, Shake
          const pitch = Math.max(0.6, Math.min(1.8, 40 / cell.radius));
          this.sound.playEat(pitch);
          this.particles.createEatBurst(cell.pos.x, cell.pos.y, cell.glowColor, 18, cell.radius);
          this.camera.addShake(Math.min(9, cell.radius * 0.22));

          // Metrics
          this.cellsEaten++;
          this.score += eatenMass;
          if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem("omnivore_high_score", this.highScore.toString());
          }

          // Floating score text
          this.particles.addFloatingText(
            cell.pos.x,
            cell.pos.y,
            `+${eatenMass}`,
            cell.glowColor,
            Math.max(14, Math.min(24, Math.round(cell.radius * 0.55)))
          );
        }
        // Player is smaller: GAME OVER!
        else if (cell.radius > pR * 1.05) {
          this.handleGameOver(cell);
          return;
        }
      }
    }

    // AI vs AI collisions (Only for cells reasonably near the camera to save cycles)
    const simRadius = 1600;
    for (let i = 0; i < this.aiCells.length; i++) {
      const cellA = this.aiCells[i];
      if (cellA.isDead || cellA.pos.dist(pPos) > simRadius) continue;

      for (let j = i + 1; j < this.aiCells.length; j++) {
        const cellB = this.aiCells[j];
        if (cellB.isDead || cellB.pos.dist(pPos) > simRadius) continue;

        const dist = cellA.pos.dist(cellB.pos);
        const contactDist = (cellA.radius + cellB.radius) * 0.85;

        if (dist < contactDist) {
          if (cellA.radius > cellB.radius * 1.15 && cellA.type === CELL_TYPES.PREDATOR) {
            cellA.eat(cellB);
            cellB.isDead = true;
            this.particles.createEatBurst(cellB.pos.x, cellB.pos.y, cellB.glowColor, 10, cellB.radius);
          } else if (cellB.radius > cellA.radius * 1.15 && cellB.type === CELL_TYPES.PREDATOR) {
            cellB.eat(cellA);
            cellA.isDead = true;
            this.particles.createEatBurst(cellA.pos.x, cellA.pos.y, cellA.glowColor, 10, cellA.radius);
          }
        }
      }
    }
  }

  handleGameOver(predator) {
    this.player.isDead = true;
    this.state = GAME_STATES.GAME_OVER;

    // Big death impact
    this.sound.playDeath();
    this.camera.addShake(18);
    this.particles.createEatBurst(this.player.pos.x, this.player.pos.y, "#38bdf8", 36, this.player.radius * 1.4);

    // Show Game Over Modal
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
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 1. Clear & Render Parallax Abyss Background
    this.background.render(ctx, this.camera, w, h);

    // 2. World Space Rendering
    ctx.save();
    this.camera.applyTransform(ctx);

    // Render fluid coordinate grid & world boundary
    this.background.renderWorldGrid(ctx, this.camera, w, h);

    // Render Particles beneath cells (shockwaves)
    this.particles.render(ctx);

    // Render AI Cells (Frustum Culled)
    for (let i = 0; i < this.aiCells.length; i++) {
      const cell = this.aiCells[i];
      if (!cell.isDead && this.camera.isVisible(cell.pos.x, cell.pos.y, cell.radius * 2)) {
        cell.render(ctx);
      }
    }

    // Render Player
    if (this.player && !this.player.isDead) {
      this.player.render(ctx);
    }

    ctx.restore();
  }

  loop(timestamp) {
    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const elapsed = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    // Normalizing dt around 60fps (dt = 1 at 16.6ms), capped to prevent spiraling
    const dt = Math.min(2.5, elapsed / 16.67);

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }
}


/* === js/main.js === */
/**
 * Omnivore - Main Entry Point
 * Initializes DOM references and starts the game loop.
 */

window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("game-canvas");

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
});


})();
