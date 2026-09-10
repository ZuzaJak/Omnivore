/**
 * Omnivore - AI Biological Organism Class
 * Subclasses Cell. Implements sensory detection, predator hunting,
 * prey fleeing, and ambient plankton drifting behaviors.
 */

import { Cell } from "./cell.js";
import { Vector2D, clamp, randomRange, randomChoice, hsla } from "./math.js";

export const CELL_TYPES = {
  PLANKTON: "plankton",
  PREY: "prey",
  PREDATOR: "predator"
};

export class AICell extends Cell {
  constructor(x, y, radius, type = CELL_TYPES.PREY) {
    // Generate distinct bioluminescent themes based on ecological role
    let hue, saturation, lightness, baseMaxSpeed;

    if (type === CELL_TYPES.PLANKTON) {
      hue = randomChoice([140, 165, 80, 50]); // Neon emerald, teal, lime, or amber
      saturation = 95;
      lightness = 60;
      baseMaxSpeed = 2.4;
    } else if (type === CELL_TYPES.PREY) {
      hue = randomChoice([200, 230, 270, 180]); // Sky blue, sapphire, amethyst, cyan
      saturation = 90;
      lightness = 55;
      baseMaxSpeed = 4.8;
    } else {
      // PREDATOR
      hue = randomChoice([345, 10, 280, 30]); // Crimson red, blood orange, abyssal purple, toxic amber
      saturation = 100;
      lightness = 52;
      baseMaxSpeed = 4.2;
    }

    super(x, y, radius, {
      hue,
      saturation,
      lightness,
      drag: 0.94,
      baseMaxSpeed
    });

    this.type = type;
    this.sensorRadius = Math.max(160, radius * 4.2);

    // Wandering wander-angle for organic fluid drifting
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.wanderChangeSpeed = randomRange(0.02, 0.08);

    // AI decision tick timer to optimize CPU
    this.decisionTimer = Math.floor(Math.random() * 10);
    this.decisionInterval = 6;
  }

  updateAI(neighbors, player, worldRadius = 3500) {
    this.decisionTimer++;
    if (this.decisionTimer < this.decisionInterval) return;
    this.decisionTimer = 0;

    let steerForce = new Vector2D(0, 0);

    // 1. World boundary soft constraint
    const distFromOrigin = this.pos.mag();
    if (distFromOrigin > worldRadius * 0.85) {
      const returnForce = this.pos.clone().mult(-1).normalize().mult(0.35);
      this.applyForce(returnForce);
      return;
    }

    // 2. Plankton just gently drifts
    if (this.type === CELL_TYPES.PLANKTON) {
      this.wanderAngle += (Math.random() - 0.5) * 0.4;
      const wander = Vector2D.fromAngle(this.wanderAngle, 0.08);
      this.applyForce(wander);
      return;
    }

    // 3. Scan for threats & food
    let closestThreat = null;
    let closestThreatDist = Infinity;
    let closestFood = null;
    let closestFoodDist = Infinity;

    // Check Player
    if (player && !player.isDead) {
      const d = this.pos.dist(player.pos);
      if (d < this.sensorRadius + player.radius) {
        if (player.radius > this.radius * 1.06) {
          closestThreat = player;
          closestThreatDist = d;
        } else if (this.radius > player.radius * 1.06 && this.type === CELL_TYPES.PREDATOR) {
          closestFood = player;
          closestFoodDist = d;
        }
      }
    }

    // Check Neighboring AI Cells
    for (let i = 0; i < neighbors.length; i++) {
      const other = neighbors[i];
      if (other === this || other.isDead) continue;

      const d = this.pos.dist(other.pos);
      if (d > this.sensorRadius + other.radius) continue;

      // Is other cell dangerous to us?
      if (other.radius > this.radius * 1.06) {
        if (d < closestThreatDist) {
          closestThreat = other;
          closestThreatDist = d;
        }
      }
      // Is other cell edible for us?
      else if (this.radius > other.radius * 1.06 && (this.type === CELL_TYPES.PREDATOR || other.type === CELL_TYPES.PLANKTON)) {
        if (d < closestFoodDist) {
          closestFood = other;
          closestFoodDist = d;
        }
      }
    }

    // 4. Behavioral execution
    // Priority A: Flee from predators
    if (closestThreat) {
      const fleeVec = Vector2D.sub(this.pos, closestThreat.pos).normalize();
      const urgency = clamp(1 - (closestThreatDist / this.sensorRadius), 0.3, 1.0);
      steerForce.add(fleeVec.mult(0.55 * urgency));
    }
    // Priority B: Hunt edible prey
    else if (closestFood) {
      const huntVec = Vector2D.sub(closestFood.pos, this.pos).normalize();
      steerForce.add(huntVec.mult(0.38));
    }
    // Priority C: Ambient fluid wandering
    else {
      this.wanderAngle += (Math.random() - 0.5) * this.wanderChangeSpeed * 5;
      const wander = Vector2D.fromAngle(this.wanderAngle, 0.18);
      steerForce.add(wander);
    }

    this.applyForce(steerForce);
  }
}
