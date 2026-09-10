/**
 * Omnivore - Atmospheric Parallax Background System
 * Renders multi-layered out-of-focus bokeh orbs, drifting marine snow,
 * and an organic fluid coordinate grid with deep underwater vignette.
 */

import { Vector2D, randomRange, hsla } from "./math.js";

export class BackgroundSystem {
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
        hue: randomRange(95, 145), // Toxic neon green, biohazard lime, emerald spores
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
        hue: randomRange(90, 140),
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
    bgGrad.addColorStop(0, "#041c0e"); // Deep murky toxic green core
    bgGrad.addColorStop(0.55, "#020f06"); // Dark abyss swamp green
    bgGrad.addColorStop(1, "#010602"); // Void bio-black edge

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
    ctx.strokeStyle = "rgba(34, 197, 94, 0.08)";
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
    ctx.fillStyle = "rgba(57, 255, 20, 0.25)";
    for (let x = startX; x <= endX; x += this.gridSpacing) {
      for (let y = startY; y <= endY; y += this.gridSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // World Boundary Membrane (Primordial bio-barrier ring)
    ctx.strokeStyle = "rgba(57, 255, 20, 0.45)";
    ctx.lineWidth = 6;
    ctx.shadowBlur = 28;
    ctx.shadowColor = "#22c55e";
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
