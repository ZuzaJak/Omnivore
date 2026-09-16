/**
 * Omnivore - Base Biological Cell Class (3D Three.js Gelatinous Organism)
 * Implements 3D physical transmission membrane, internal glowing organelles,
 * organic undulation, velocity squish/stretch, and 2D viscous fluid mechanics.
 */

import { Vector2D, clamp, lerp, randomRange, hsla } from "./math.js";

export class Cell {
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
