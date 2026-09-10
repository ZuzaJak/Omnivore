/**
 * Omnivore - Base Biological Cell Class
 * Implements organic membrane undulation, internal organelle simulation,
 * bioluminescent rendering, and viscous fluid physics.
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

    // Biological colors & glow
    this.hue = options.hue !== undefined ? options.hue : randomRange(90, 145);
    this.saturation = options.saturation || 95;
    this.lightness = options.lightness || 54;
    this.baseColor = hsla(this.hue, this.saturation, this.lightness, 0.85);
    this.glowColor = hsla(this.hue, 100, 65, 0.9);
    this.coreColor = hsla((this.hue + 15) % 360, 100, 80, 0.95);

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
        color: hsla((this.hue + randomRange(-15, 15) + 360) % 360, 85, 70, 0.55)
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
