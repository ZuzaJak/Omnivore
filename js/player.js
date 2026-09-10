/**
 * Omnivore - Player Amoeba Class
 * Subclasses Cell. Features wiggling cilia locomotion, mouse inertia swimming,
 * mass-cost dash propulsion, and glowing bioluminescent cyan-teal aesthetics.
 */

import { Cell } from "./cell.js";
import { Vector2D, clamp, lerp, hsla } from "./math.js";

export class Player extends Cell {
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
