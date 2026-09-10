/**
 * Omnivore - Visual Particle & Juice System
 * Handles glowing cytoplasm bursts, mass droplets, shockwave rings,
 * and floating mass indicator text.
 */

import { Vector2D, randomRange, hsla } from "./math.js";

export class Particle {
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

    ctx.globalAlpha = Math.max(0, progress);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, currentRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

export class ShockwaveRing {
  constructor(x = 0, y = 0, maxRadius = 30, color = "rgba(57, 255, 20, 0.8)", duration = 25) {
    this.pos = new Vector2D(x, y);
    this.currentRadius = 4;
    this.maxRadius = maxRadius;
    this.color = color;
    this.duration = duration;
    this.life = duration;
    this.isDead = false;
  }

  init(x, y, maxRadius, color, duration) {
    this.pos.set(x, y);
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
    this.currentRadius = 4 + (this.maxRadius - 4) * (1 - Math.pow(1 - t, 3));
  }

  render(ctx) {
    const alpha = Math.max(0, this.life / this.duration);
    ctx.strokeStyle = this.color;
    ctx.globalAlpha = alpha * 0.8;
    ctx.lineWidth = Math.max(1, 3.5 * alpha);
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.currentRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export class FloatingText {
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

  render(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = alpha;
    ctx.font = `600 ${this.fontSize}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = this.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.text, this.pos.x, this.pos.y);
  }
}

export class ParticleManager {
  constructor() {
    this.particles = [];
    this.shockwaves = [];
    this.floatingTexts = [];

    // Pre-allocated object pool to prevent GC frame drops
    this.particlePool = [];
    for (let i = 0; i < 200; i++) {
      this.particlePool.push(new Particle());
    }

    this.shockwavePool = [];
    for (let i = 0; i < 30; i++) {
      this.shockwavePool.push(new ShockwaveRing());
    }
  }

  spawnParticle(x, y, vx, vy, color, radius, life) {
    let p = this.particlePool.pop();
    if (!p) p = new Particle();
    p.init(x, y, vx, vy, color, radius, life);
    this.particles.push(p);
  }

  spawnShockwave(x, y, maxRadius, color, duration) {
    let s = this.shockwavePool.pop();
    if (!s) s = new ShockwaveRing();
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
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt);
      if (p.isDead) {
        this.particles.splice(i, 1);
        if (this.particlePool.length < 250) {
          this.particlePool.push(p);
        }
      }
    }

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

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      this.floatingTexts[i].update(dt);
      if (this.floatingTexts[i].isDead) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  render(ctx, camera) {
    // 1. Render shockwaves
    for (let i = 0; i < this.shockwaves.length; i++) {
      const s = this.shockwaves[i];
      if (camera && !camera.isVisible(s.pos.x, s.pos.y, s.maxRadius)) continue;
      s.render(ctx);
    }

    // 2. Render particles using GPU-friendly additive bioluminescence (no shadowBlur)
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (camera && !camera.isVisible(p.pos.x, p.pos.y, 16)) continue;
      p.render(ctx);
    }
    ctx.restore();

    // 3. Render floating texts
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      if (camera && !camera.isVisible(ft.pos.x, ft.pos.y, 60)) continue;
      ft.render(ctx);
    }
    ctx.globalAlpha = 1.0;
  }

  clear() {
    while (this.particles.length > 0) {
      this.particlePool.push(this.particles.pop());
    }
    while (this.shockwaves.length > 0) {
      this.shockwavePool.push(this.shockwaves.pop());
    }
    this.floatingTexts = [];
  }
}
