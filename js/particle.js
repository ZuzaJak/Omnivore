/**
 * Omnivore - Visual Particle & Juice System (Three.js 3D Microcosm)
 * Handles glowing cytoplasm bursts, dash trails, 3D shockwave rings,
 * and floating mass indicator text on the overlay canvas.
 */

import { Vector2D, randomRange, hsla } from "./math.js";

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

export class ShockwaveRing {
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

export class ParticleManager {
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
