/**
 * Omnivore - Dynamic Camera System
 * Centers the player in the viewport, applies smooth dynamic zoom-out
 * as the cell expands, converts mouse screen coordinates to world space,
 * and manages fluid screen-shake impulses.
 */

import { Vector2D, clamp, lerp } from "./math.js";

export class Camera {
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

    // Reusable vectors to eliminate GC allocation in hot update loops
    this._scratchWorld = new Vector2D(0, 0);
    this._scratchScreen = new Vector2D(0, 0);
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
}
