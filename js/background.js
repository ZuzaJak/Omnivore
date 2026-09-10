/**
 * Omnivore - Atmospheric Parallax Background System
 * Renders 3 parallax layers (far nebula orbs, mid spores, near marine snow)
 * and an undulating, liquid-refracted fluid grid with deep alien violet vignette.
 */

import { Vector2D, randomRange, hsla } from "./math.js";

export class BackgroundSystem {
  constructor(worldRadius = 3500) {
    this.worldRadius = worldRadius;

    // Layer 1: Far, massive out-of-focus nebula orbs (speed factor ~0.12)
    this.farBokeh = this.createBokehOrbs(50, 50, 130, 0.08, 0.22);

    // Layer 2: Mid-depth drifting alien spores & vacuoles (speed factor ~0.35)
    this.midSpores = this.createMidSpores(90, 10, 28, 0.15, 0.35);

    // Layer 3: Near-depth marine snow & bioluminescent plankton motes (speed factor ~0.60)
    this.nearSnow = this.createMarineSnow(180, 2, 5.5, 0.25, 0.6);

    // Subtle fluid grid spacing
    this.gridSpacing = 160;

    // Cached gradient for screen background
    this.bgGrad = null;
    this.cachedW = 0;
    this.cachedH = 0;
  }

  createBokehOrbs(count, minR, maxR, minAlpha, maxAlpha) {
    const list = [];
    for (let i = 0; i < count; i++) {
      // Alien contrast: mix of deep violet/purple (270-300) and toxic neon green (105-135)
      const hue = Math.random() > 0.4 ? randomRange(270, 305) : randomRange(105, 135);
      list.push({
        x: randomRange(-this.worldRadius * 0.9, this.worldRadius * 0.9),
        y: randomRange(-this.worldRadius * 0.9, this.worldRadius * 0.9),
        radius: randomRange(minR, maxR),
        alpha: randomRange(minAlpha, maxAlpha),
        hue,
        driftAngle: Math.random() * Math.PI * 2,
        driftSpeed: randomRange(0.08, 0.22),
        pulseSpeed: randomRange(0.008, 0.02),
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
    return list;
  }

  createMidSpores(count, minR, maxR, minAlpha, maxAlpha) {
    const list = [];
    for (let i = 0; i < count; i++) {
      const hue = Math.random() > 0.5 ? randomRange(110, 135) : randomRange(265, 295);
      list.push({
        x: randomRange(-this.worldRadius, this.worldRadius),
        y: randomRange(-this.worldRadius, this.worldRadius),
        radius: randomRange(minR, maxR),
        alpha: randomRange(minAlpha, maxAlpha),
        hue,
        vx: randomRange(-0.25, 0.25),
        vy: randomRange(-0.25, 0.25),
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: randomRange(0.015, 0.035)
      });
    }
    return list;
  }

  createMarineSnow(count, minR, maxR, minAlpha, maxAlpha) {
    const list = [];
    for (let i = 0; i < count; i++) {
      const hue = Math.random() > 0.35 ? randomRange(100, 135) : randomRange(270, 295);
      list.push({
        x: randomRange(-this.worldRadius, this.worldRadius),
        y: randomRange(-this.worldRadius, this.worldRadius),
        radius: randomRange(minR, maxR),
        baseAlpha: randomRange(minAlpha, maxAlpha),
        hue,
        vx: randomRange(-0.2, 0.2),
        vy: randomRange(-0.2, 0.2),
        flickerPhase: Math.random() * Math.PI * 2,
        flickerSpeed: randomRange(0.025, 0.06)
      });
    }
    return list;
  }

  update(dt = 1) {
    // 1. Animate far nebula bokeh
    for (let i = 0; i < this.farBokeh.length; i++) {
      const b = this.farBokeh[i];
      b.x += Math.cos(b.driftAngle) * b.driftSpeed * dt;
      b.y += Math.sin(b.driftAngle) * b.driftSpeed * dt;
      b.pulsePhase += b.pulseSpeed * dt;
    }

    // 2. Animate mid-depth spores
    for (let i = 0; i < this.midSpores.length; i++) {
      const s = this.midSpores[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.pulsePhase += s.pulseSpeed * dt;
    }

    // 3. Animate near marine snow
    for (let i = 0; i < this.nearSnow.length; i++) {
      const s = this.nearSnow[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.flickerPhase += s.flickerSpeed * dt;
    }
  }

  render(ctx, camera, viewWidth, viewHeight) {
    // 1. Deep abyss vignette: Cached radial gradient
    if (this.cachedW !== viewWidth || this.cachedH !== viewHeight || !this.bgGrad) {
      this.cachedW = viewWidth;
      this.cachedH = viewHeight;
      this.bgGrad = ctx.createRadialGradient(
        viewWidth / 2, viewHeight / 2, 70,
        viewWidth / 2, viewHeight / 2, Math.max(viewWidth, viewHeight) * 0.78
      );
      this.bgGrad.addColorStop(0, "#120320"); // Murky alien abyss purple core
      this.bgGrad.addColorStop(0.55, "#080110"); // Deep void purple
      this.bgGrad.addColorStop(1, "#020005"); // Abyssal black edge
    }

    ctx.fillStyle = this.bgGrad;
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    // Viewport half-dimensions in world scale
    const halfW = (viewWidth / 2) / camera.zoom;
    const halfH = (viewHeight / 2) / camera.zoom;

    // 2. Layer 1: Far Nebula Bokeh Orbs (Parallax factor ~0.12) with frustum culling
    ctx.save();
    const farParallax = 0.12;
    ctx.translate(viewWidth / 2, viewHeight / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.pos.x * farParallax, -camera.pos.y * farParallax);

    const farCamX = camera.pos.x * farParallax;
    const farCamY = camera.pos.y * farParallax;

    for (let i = 0; i < this.farBokeh.length; i++) {
      const b = this.farBokeh[i];
      const pulse = 1 + Math.sin(b.pulsePhase) * 0.14;
      const r = b.radius * pulse;

      // Frustum culling: skip off-screen orbs
      if (Math.abs(b.x - farCamX) > halfW + r || Math.abs(b.y - farCamY) > halfH + r) {
        continue;
      }

      const bokehGrad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
      bokehGrad.addColorStop(0, hsla(b.hue, 90, 65, b.alpha * 1.5));
      bokehGrad.addColorStop(0.55, hsla(b.hue, 85, 45, b.alpha * 0.65));
      bokehGrad.addColorStop(1, hsla(b.hue, 80, 30, 0));

      ctx.fillStyle = bokehGrad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. Layer 2: Mid-Depth Spores & Vacuoles (Parallax factor ~0.35) with frustum culling
    ctx.save();
    const midParallax = 0.35;
    ctx.translate(viewWidth / 2, viewHeight / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.pos.x * midParallax, -camera.pos.y * midParallax);

    const midCamX = camera.pos.x * midParallax;
    const midCamY = camera.pos.y * midParallax;

    for (let i = 0; i < this.midSpores.length; i++) {
      const s = this.midSpores[i];
      const pulse = 1 + Math.sin(s.pulsePhase) * 0.2;
      const r = s.radius * pulse;

      // Frustum culling: skip off-screen spores
      if (Math.abs(s.x - midCamX) > halfW + r || Math.abs(s.y - midCamY) > halfH + r) {
        continue;
      }

      const sporeGrad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
      sporeGrad.addColorStop(0, hsla(s.hue, 95, 70, s.alpha * 1.3));
      sporeGrad.addColorStop(0.65, hsla(s.hue, 90, 50, s.alpha * 0.5));
      sporeGrad.addColorStop(1, hsla(s.hue, 85, 30, 0));

      ctx.fillStyle = sporeGrad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 4. Layer 3: Near-Depth Marine Snow (Parallax factor ~0.60) with frustum culling
    ctx.save();
    const nearParallax = 0.60;
    ctx.translate(viewWidth / 2, viewHeight / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.pos.x * nearParallax, -camera.pos.y * nearParallax);

    const nearCamX = camera.pos.x * nearParallax;
    const nearCamY = camera.pos.y * nearParallax;

    for (let i = 0; i < this.nearSnow.length; i++) {
      const s = this.nearSnow[i];
      if (Math.abs(s.x - nearCamX) > halfW + s.radius || Math.abs(s.y - nearCamY) > halfH + s.radius) {
        continue;
      }
      const alpha = s.baseAlpha * (0.8 + Math.sin(s.flickerPhase) * 0.25);
      ctx.fillStyle = hsla(s.hue, 95, 75, alpha);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderWorldGrid(ctx, camera, viewWidth, viewHeight) {
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

    // Time-based liquid membrane undulation
    const time = performance.now() * 0.0012;
    const step = 40; // Optimized segment density

    ctx.strokeStyle = "rgba(168, 85, 247, 0.12)"; // Ethereal alien violet grid
    ctx.lineWidth = 1.2;

    // Batch all vertical and horizontal grid lines in a single stroke call
    ctx.beginPath();
    for (let x = startX; x <= endX; x += this.gridSpacing) {
      let first = true;
      for (let y = top - step; y <= bottom + step; y += step) {
        const waveX = x + Math.sin(y * 0.007 + time * 1.3 + x * 0.002) * 8
                        + Math.cos(y * 0.016 - time * 0.8) * 3;
        if (first) {
          ctx.moveTo(waveX, y);
          first = false;
        } else {
          ctx.lineTo(waveX, y);
        }
      }
    }

    for (let y = startY; y <= endY; y += this.gridSpacing) {
      let first = true;
      for (let x = left - step; x <= right + step; x += step) {
        const waveY = y + Math.sin(x * 0.007 + time * 1.3 + y * 0.002) * 8
                        + Math.cos(x * 0.016 - time * 0.8) * 3;
        if (first) {
          ctx.moveTo(x, waveY);
          first = false;
        } else {
          ctx.lineTo(x, waveY);
        }
      }
    }
    ctx.stroke();

    // Batch all coordinate nodes into a single fill call
    ctx.fillStyle = "rgba(57, 255, 20, 0.35)"; // Toxic green nodes
    ctx.beginPath();
    for (let x = startX; x <= endX; x += this.gridSpacing) {
      for (let y = startY; y <= endY; y += this.gridSpacing) {
        const nx = x + Math.sin(y * 0.007 + time * 1.3 + x * 0.002) * 8
                     + Math.cos(y * 0.016 - time * 0.8) * 3;
        const ny = y + Math.sin(x * 0.007 + time * 1.3 + y * 0.002) * 8
                     + Math.cos(x * 0.016 - time * 0.8) * 3;
        ctx.moveTo(nx + 1.8, ny);
        ctx.arc(nx, ny, 1.8, 0, Math.PI * 2);
      }
    }
    ctx.fill();

    // World Boundary Membrane: Frustum check (only draw if near or touching viewport)
    const viewDiag = Math.hypot(halfW, halfH);
    const camDist = Math.hypot(camera.pos.x, camera.pos.y);
    const boundaryRadius = this.worldRadius;

    if (camDist + viewDiag >= boundaryRadius - 60 && camDist - viewDiag <= boundaryRadius + 60) {
      const barrierPulse = Math.sin(time * 2) * 3;

      // Inner glowing toxic green ring
      ctx.strokeStyle = "rgba(57, 255, 20, 0.45)";
      ctx.lineWidth = 4;
      ctx.shadowBlur = 12; // Streamlined from 25 to 12
      ctx.shadowColor = "#39ff14";
      ctx.beginPath();
      ctx.arc(0, 0, this.worldRadius + barrierPulse, 0, Math.PI * 2);
      ctx.stroke();

      // Outer glowing alien purple ring
      ctx.strokeStyle = "rgba(168, 85, 247, 0.5)";
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 10; // Streamlined from 20 to 10
      ctx.shadowColor = "#a855f7";
      ctx.beginPath();
      ctx.arc(0, 0, this.worldRadius + 22 + barrierPulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }
}
