/**
 * Omnivore - Player Amoeba Class (3D Bioluminescent Apex Organism)
 * Subclasses Cell. Features attached 3D PointLight, undulating 3D cilia,
 * glowing dash aura, mouse inertia swimming, and mass-cost dash propulsion.
 */

import { Cell } from "./cell.js";
import { Vector2D, clamp, lerp, hsla } from "./math.js";

export class Player extends Cell {
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
      if (this.vel.magSq() > 0.01) {
        toTarget.set(this.vel.x, this.vel.y).normalize();
      } else {
        toTarget.set(1, 0);
      }
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
      if (this.vel.magSq() < 0.005) {
        this.vel.set(0, 0);
      }
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
