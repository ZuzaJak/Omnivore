/**
 * Omnivore - AI Biological Organism Class (3D Three.js Predator, Prey & Parasites)
 * Subclasses Cell. Implements sensory detection, predator hunting with purple PointLights,
 * crimson parasite swarming, prey fleeing, and ambient plankton drifting.
 */

import { Cell } from "./cell.js";
import { Vector2D, clamp, randomRange, randomChoice, hsla } from "./math.js";

export const CELL_TYPES = {
  PLANKTON: "plankton",
  PREY: "prey",
  PREDATOR: "predator",
  PARASITE: "parasite"
};

export class AICell extends Cell {
  constructor(x, y, radius, type = CELL_TYPES.PREY) {
    let hue, saturation, lightness, baseMaxSpeed;

    if (type === CELL_TYPES.PLANKTON) {
      hue = randomChoice([95, 110, 120, 135]); // Toxic neon green, chartreuse, lime
      saturation = 100;
      lightness = 60;
      baseMaxSpeed = 1.4;
    } else if (type === CELL_TYPES.PREY) {
      hue = randomChoice([115, 130, 265, 285]); // Green & violet
      saturation = 95;
      lightness = 55;
      baseMaxSpeed = 2.8;
    } else if (type === CELL_TYPES.PARASITE) {
      hue = randomChoice([345, 355, 2, 12]); // Crimson / Blood Red
      saturation = 100;
      lightness = 52;
      baseMaxSpeed = 3.6;
    } else {
      // PREDATOR: Deep glowing alien purple / violet
      hue = randomChoice([275, 280, 288, 295]);
      saturation = 100;
      lightness = 50;
      baseMaxSpeed = 2.6;
    }

    super(x, y, radius, {
      hue,
      saturation,
      lightness,
      drag: 0.91,
      baseMaxSpeed
    });

    this.type = type;
    this.sensorRadius = type === CELL_TYPES.PARASITE ? 850 : Math.max(160, radius * 4.2);

    // Wandering wander-angle for organic fluid drifting
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.wanderChangeSpeed = randomRange(0.02, 0.08);

    // AI decision tick timer to optimize CPU
    this.decisionTimer = Math.floor(Math.random() * 10);
    this.decisionInterval = 6;

    // 3D Three.js Predator Bioluminescent Light
    this.pointLight = null;
    this.initAIThreeObject();
  }

  initAIThreeObject() {
    const THREE = window.THREE;
    if (!THREE || !this.threeGroup) return;

    if (this.type === CELL_TYPES.PREDATOR) {
      // Predators emit an ominous, deep purple bioluminescent light
      this.pointLight = new THREE.PointLight(0xa855f7, 1.8, 550, 2);
      this.pointLight.position.set(0, 0, 20);
      this.threeGroup.add(this.pointLight);
    } else if (this.type === CELL_TYPES.PARASITE) {
      // Parasites pulse with aggressive blood-red emissive glow
      if (this.membraneMaterial) {
        this.membraneMaterial.emissiveIntensity = 0.65;
        this.membraneMaterial.roughness = 0.2;
      }
    }
  }

  update(dt = 1) {
    super.update(dt);

    // Dynamically adjust predator point light radius as it grows
    if (this.pointLight && this.type === CELL_TYPES.PREDATOR) {
      this.pointLight.distance = 450 + this.radius * 2.5;
    }
  }

  updateAI(neighbors, player, worldRadius = 3500) {
    this.decisionTimer++;
    if (this.decisionTimer < this.decisionInterval) return;
    this.decisionTimer = 0;

    // Culling light for distant predators to maximize 60 FPS
    if (this.pointLight && player) {
      const dx = this.pos.x - player.pos.x;
      const dy = this.pos.y - player.pos.y;
      this.pointLight.visible = (dx * dx + dy * dy < 2200 * 2200);
    }

    let steerForce = new Vector2D(0, 0);

    // 1. World boundary soft constraint
    const originDistSq = this.pos.magSq();
    const boundRadius = worldRadius * 0.85;
    if (originDistSq > boundRadius * boundRadius) {
      const originDist = Math.sqrt(originDistSq) || 1;
      this.applyForce(new Vector2D((-this.pos.x / originDist) * 0.35, (-this.pos.y / originDist) * 0.35));
      return;
    }

    // 2. Plankton just gently drifts
    if (this.type === CELL_TYPES.PLANKTON) {
      this.wanderAngle += (Math.random() - 0.5) * 0.4;
      const wander = Vector2D.fromAngle(this.wanderAngle, 0.05);
      this.applyForce(wander);
      return;
    }

    // 3. Parasite: Fast, aggressive swarm tracking the player
    if (this.type === CELL_TYPES.PARASITE) {
      if (player && !player.isDead) {
        const dx = player.pos.x - this.pos.x;
        const dy = player.pos.y - this.pos.y;
        const reach = this.sensorRadius;
        if (Math.abs(dx) <= reach && Math.abs(dy) <= reach) {
          const dSq = dx * dx + dy * dy;
          if (dSq < reach * reach) {
            const dist = Math.sqrt(dSq) || 1;
            const toPlayerX = dx / dist;
            const toPlayerY = dy / dist;
            const jitterAngle = Math.random() * Math.PI * 2;
            const jitterX = Math.cos(jitterAngle) * 0.35;
            const jitterY = Math.sin(jitterAngle) * 0.35;
            const finalX = toPlayerX + jitterX;
            const finalY = toPlayerY + jitterY;
            const finalMag = Math.hypot(finalX, finalY) || 1;
            this.applyForce(new Vector2D((finalX / finalMag) * 0.42, (finalY / finalMag) * 0.42));
            return;
          }
        }
      }
      this.wanderAngle += (Math.random() - 0.5) * 0.45;
      const wander = Vector2D.fromAngle(this.wanderAngle, 0.22);
      this.applyForce(wander);
      return;
    }

    // 4. Scan for threats & food using fast AABB early exit and squared distances
    let closestThreat = null;
    let closestThreatDistSq = Infinity;
    let closestFood = null;
    let closestFoodDistSq = Infinity;

    // Check Player
    if (player && !player.isDead) {
      const maxReach = this.sensorRadius + player.radius;
      const dx = player.pos.x - this.pos.x;
      const dy = player.pos.y - this.pos.y;
      if (Math.abs(dx) <= maxReach && Math.abs(dy) <= maxReach) {
        const dSq = dx * dx + dy * dy;
        if (dSq <= maxReach * maxReach) {
          if (player.radius > this.radius * 1.06) {
            closestThreat = player;
            closestThreatDistSq = dSq;
          } else if (this.radius > player.radius * 1.06 && this.type === CELL_TYPES.PREDATOR) {
            closestFood = player;
            closestFoodDistSq = dSq;
          }
        }
      }
    }

    // Check Neighboring AI Cells
    for (let i = 0; i < neighbors.length; i++) {
      const other = neighbors[i];
      if (other === this || other.isDead) continue;

      const maxReach = this.sensorRadius + other.radius;
      const dx = other.pos.x - this.pos.x;
      if (Math.abs(dx) > maxReach) continue;
      const dy = other.pos.y - this.pos.y;
      if (Math.abs(dy) > maxReach) continue;

      const dSq = dx * dx + dy * dy;
      if (dSq > maxReach * maxReach) continue;

      if (other.radius > this.radius * 1.06) {
        if (dSq < closestThreatDistSq) {
          closestThreat = other;
          closestThreatDistSq = dSq;
        }
      } else if (this.radius > other.radius * 1.06 && (this.type === CELL_TYPES.PREDATOR || other.type === CELL_TYPES.PLANKTON)) {
        if (dSq < closestFoodDistSq) {
          closestFood = other;
          closestFoodDistSq = dSq;
        }
      }
    }

    // 5. Behavioral execution
    if (closestThreat) {
      const fleeVec = Vector2D.sub(this.pos, closestThreat.pos).normalize();
      const closestThreatDist = Math.sqrt(closestThreatDistSq);
      const urgency = clamp(1 - (closestThreatDist / this.sensorRadius), 0.3, 1.0);
      steerForce.add(fleeVec.mult(0.36 * urgency));
    } else if (closestFood) {
      const huntVec = Vector2D.sub(closestFood.pos, this.pos).normalize();
      steerForce.add(huntVec.mult(0.24));
    } else {
      this.wanderAngle += (Math.random() - 0.5) * this.wanderChangeSpeed * 5;
      const wander = Vector2D.fromAngle(this.wanderAngle, 0.12);
      steerForce.add(wander);
    }

    this.applyForce(steerForce);
  }

  destroy(scene) {
    if (this.pointLight && this.threeGroup) {
      this.threeGroup.remove(this.pointLight);
      this.pointLight = null;
    }
    super.destroy(scene);
  }
}
