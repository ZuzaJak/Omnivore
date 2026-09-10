/**
 * Omnivore - Core Game Engine
 * Orchestrates game state, entity lifecycles, collision detection,
 * spatial optimization, input processing, and HUD synchronization.
 */

import { Player } from "./player.js";
import { AICell, CELL_TYPES } from "./aiCell.js";
import { Camera } from "./camera.js";
import { BackgroundSystem } from "./background.js";
import { ParticleManager } from "./particle.js";
import { SoundSystem } from "./audio.js";
import { Vector2D, randomRange, randomChoice, lerp } from "./math.js";

export const GAME_STATES = {
  START: "start",
  PLAYING: "playing",
  GAME_OVER: "game_over",
  PAUSED: "paused"
};

/**
 * Safe localStorage wrappers to prevent SecurityError in sandboxed/file contexts
 */
function safeGetStorage(key, fallback = "0") {
  try {
    return localStorage.getItem(key) || fallback;
  } catch (err) {
    return fallback;
  }
}

function safeSetStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    // Storage access restricted or disabled
  }
}

export class Game {
  constructor(canvas, uiElements) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ui = uiElements;

    // Simulation World Bounds
    this.worldRadius = 3500;
    this.maxCells = 200;

    // Core Systems
    this.camera = new Camera(canvas.width, canvas.height);
    this.background = new BackgroundSystem(this.worldRadius);
    this.particles = new ParticleManager();
    this.sound = new SoundSystem();

    // Game State
    this.state = GAME_STATES.START;
    this.player = null;
    this.aiCells = [];

    // Metrics
    this.score = 0;
    this.highScore = parseInt(safeGetStorage("omnivore_high_score", "0"), 10);
    this.cellsEaten = 0;
    this.startTime = 0;
    this.timeSurvived = 0;

    // Input Tracking & Mobile Gestures
    this.mouseScreen = new Vector2D(canvas.width / 2, canvas.height / 2);
    this.isMouseDown = false;
    this.lastTapTime = 0;
    this.lastTapPos = new Vector2D(0, 0);

    // Loop Timing
    this.lastTimestamp = 0;

    this.bindEvents();
    this.resize();
  }

  bindEvents() {
    window.addEventListener("resize", () => this.resize());

    window.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseScreen.set(e.clientX - rect.left, e.clientY - rect.top);
    });

    window.addEventListener("mousedown", (e) => {
      if (e.button === 0) { // Left click
        this.sound.init(); // Audio context resume on first interaction
        if (this.state === GAME_STATES.PLAYING) {
          this.triggerPlayerDash();
        }
      }
    });

    window.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        if (this.state === GAME_STATES.PLAYING) {
          this.triggerPlayerDash();
        }
      } else if (e.code === "KeyP" || e.code === "Escape") {
        this.togglePause();
      } else if (e.code === "KeyM") {
        this.toggleAudio();
      }
    });

    // Mobile Touch Steering & Double-Tap Dash System
    window.addEventListener(
      "touchstart",
      (e) => {
        // Do not block interaction with UI buttons and modals
        if (e.target && (e.target.closest("button") || e.target.closest(".screen-card"))) {
          return;
        }

        // Prevent mobile browser zooming and pull-down reload
        e.preventDefault();
        this.sound.init();

        if (e.touches.length > 0) {
          const rect = this.canvas.getBoundingClientRect();
          const touchX = e.touches[0].clientX - rect.left;
          const touchY = e.touches[0].clientY - rect.top;

          // Touch and drag ONLY steers the cell
          this.mouseScreen.set(touchX, touchY);

          // Double-tap detection for Dash
          const now = performance.now();
          const timeDiff = now - this.lastTapTime;
          const distDiff = Math.hypot(touchX - this.lastTapPos.x, touchY - this.lastTapPos.y);

          if (timeDiff < 300 && distDiff < 50) {
            // Double-tap confirmed: execute dash!
            if (this.state === GAME_STATES.PLAYING) {
              this.triggerPlayerDash();
            }
            this.lastTapTime = 0;
          } else {
            this.lastTapTime = now;
            this.lastTapPos.set(touchX, touchY);
          }
        }
      },
      { passive: false }
    );

    window.addEventListener(
      "touchmove",
      (e) => {
        if (e.target && (e.target.closest("button") || e.target.closest(".screen-card"))) {
          return;
        }

        // Prevent default mobile gesture scrolling
        e.preventDefault();

        if (e.touches.length > 0) {
          const rect = this.canvas.getBoundingClientRect();
          this.mouseScreen.set(
            e.touches[0].clientX - rect.left,
            e.touches[0].clientY - rect.top
          );
        }
      },
      { passive: false }
    );

    window.addEventListener(
      "touchend",
      (e) => {
        if (e.target && (e.target.closest("button") || e.target.closest(".screen-card"))) {
          return;
        }
        e.preventDefault();
      },
      { passive: false }
    );

    // UI Buttons: Fast-response touch and click binding
    const attachButtonHandler = (btn, action) => {
      if (!btn) return;
      let lastTrigger = 0;
      const trigger = (e) => {
        const now = performance.now();
        if (now - lastTrigger < 300) return;
        lastTrigger = now;
        action(e);
      };
      btn.addEventListener("click", trigger);
      btn.addEventListener(
        "touchend",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          trigger(e);
        },
        { passive: false }
      );
    };

    attachButtonHandler(this.ui.startBtn, () => this.start());
    attachButtonHandler(this.ui.restartBtn, () => this.start());
    attachButtonHandler(this.ui.muteBtn, () => this.toggleAudio());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.camera.resize(this.canvas.width, this.canvas.height);
  }

  toggleAudio() {
    const isMuted = this.sound.toggleMute();
    if (this.ui.muteBtn) {
      this.ui.muteBtn.classList.toggle("muted", isMuted);
      this.ui.muteBtn.setAttribute("aria-label", isMuted ? "Unmute sound" : "Mute sound");
      this.ui.muteBtn.innerHTML = isMuted
        ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`
        : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
    }
  }

  togglePause() {
    if (this.state === GAME_STATES.PLAYING) {
      this.state = GAME_STATES.PAUSED;
      if (this.ui.pauseModal) this.ui.pauseModal.classList.remove("hidden");
    } else if (this.state === GAME_STATES.PAUSED) {
      this.state = GAME_STATES.PLAYING;
      if (this.ui.pauseModal) this.ui.pauseModal.classList.add("hidden");
    }
  }

  start() {
    this.sound.init();
    this.sound.resume();

    // Reset Metrics
    this.score = 0;
    this.cellsEaten = 0;
    this.startTime = performance.now();
    this.timeSurvived = 0;

    // Reset Player at origin
    this.player = new Player(0, 0, 26);
    this.camera.pos.set(0, 0);
    this.camera.zoom = 1.0;

    // Clear particles
    this.particles.clear();

    // Populate Initial Ecosystem
    this.aiCells = [];
    this.populateInitialEcosystem();

    // Switch State & update UI overlays
    this.state = GAME_STATES.PLAYING;
    if (this.ui.startScreen) this.ui.startScreen.classList.add("hidden");
    if (this.ui.gameOverScreen) this.ui.gameOverScreen.classList.add("hidden");
    if (this.ui.pauseModal) this.ui.pauseModal.classList.add("hidden");
    if (this.ui.hud) this.ui.hud.classList.remove("hidden");
  }

  populateInitialEcosystem() {
    for (let i = 0; i < this.maxCells; i++) {
      this.spawnRandomCell(false);
    }
  }

  spawnRandomCell(offscreenOnly = true) {
    let pos;
    let attempts = 0;

    while (attempts < 15) {
      attempts++;
      const dist = randomRange(100, this.worldRadius * 0.95);
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;

      // If offscreenOnly, ensure it's outside camera view
      if (offscreenOnly && this.camera.isVisible(x, y, 80)) {
        continue;
      }
      pos = new Vector2D(x, y);
      break;
    }

    if (!pos) {
      pos = new Vector2D(randomRange(-2000, 2000), randomRange(-2000, 2000));
    }

    // Role Distribution: 50% Plankton, 24% Prey, 12% Parasite, 14% Predator
    const roll = Math.random();
    let type, radius;

    if (roll < 0.50) {
      type = CELL_TYPES.PLANKTON;
      radius = randomRange(8, 14);
    } else if (roll < 0.74) {
      type = CELL_TYPES.PREY;
      radius = randomRange(16, 36);
    } else if (roll < 0.86) {
      type = CELL_TYPES.PARASITE;
      radius = randomRange(13, 20);
    } else {
      type = CELL_TYPES.PREDATOR;
      // Apex predators can be significantly larger than starting player
      const playerRefR = this.player ? this.player.radius : 26;
      radius = randomRange(playerRefR * 0.95, playerRefR * 2.3);
    }

    const cell = new AICell(pos.x, pos.y, radius, type);
    this.aiCells.push(cell);
  }

  triggerPlayerDash() {
    if (!this.player || this.player.isDead) return;

    const dashResult = this.player.dash();
    if (dashResult) {
      // Eject glowing mass behind cell
      this.particles.createDashTrail(
        dashResult.ejectX,
        dashResult.ejectY,
        dashResult.oppositeAngle,
        "#39ff14",
        this.player.radius
      );

      // Sound & Screen Shake
      this.sound.playDash();
      this.camera.addShake(4);

      // Floating text
      this.particles.addFloatingText(
        this.player.pos.x,
        this.player.pos.y - this.player.radius - 12,
        "-Dash",
        "#4ade80",
        13
      );
    }
  }

  update(dt) {
    // Keep ambient abyss background animated at all times
    this.background.update(dt);

    if (this.state !== GAME_STATES.PLAYING) return;

    // Update Survival Time
    this.timeSurvived = Math.floor((performance.now() - this.startTime) / 1000);

    // 1. Update Camera Mouse World Position
    const worldMouse = this.camera.screenToWorld(this.mouseScreen.x, this.mouseScreen.y);
    this.player.setTarget(worldMouse.x, worldMouse.y);

    // 2. Dynamic Arena Growth: As player grows, smoothly expand world pool
    const baseWorldRadius = 3500;
    const targetWorldRadius = baseWorldRadius + Math.max(0, (this.player.targetRadius - 26) * 45);
    this.worldRadius = lerp(this.worldRadius, targetWorldRadius, 0.03);
    this.background.worldRadius = this.worldRadius;

    // 3. Update Player & Enforce Hard Boundary Clamping
    const hitBoundary = this.player.update(dt, this.worldRadius);
    if (hitBoundary) {
      this.sound.playBounce();
      this.camera.addShake(4);
      this.particles.createDashTrail(
        this.player.pos.x,
        this.player.pos.y,
        this.player.pos.heading() + Math.PI,
        "#39ff14",
        this.player.radius * 0.7
      );
    }

    // 4. Update Camera tracking centered on player
    this.camera.update(this.player, dt);

    // 5. Update AI Cells & Food Web
    // Cull and maintain population
    while (this.aiCells.length < this.maxCells) {
      this.spawnRandomCell(true);
    }

    for (let i = 0; i < this.aiCells.length; i++) {
      const cell = this.aiCells[i];
      cell.updateAI(this.aiCells, this.player, this.worldRadius);
      cell.update(dt);
    }

    // 6. Collision Resolution (Player vs AI and AI vs AI)
    this.resolveCollisions();

    // 7. Cleanup Dead Cells
    for (let i = this.aiCells.length - 1; i >= 0; i--) {
      if (this.aiCells[i].isDead) {
        this.aiCells.splice(i, 1);
      }
    }

    // 8. Update Particles
    this.particles.update(dt);

    // 9. Update HUD UI
    this.updateHUD();
  }

  resolveCollisions() {
    if (!this.player || this.player.isDead) return;

    const pPos = this.player.pos;
    const pR = this.player.radius;

    // Player vs AI
    for (let i = 0; i < this.aiCells.length; i++) {
      const cell = this.aiCells[i];
      if (cell.isDead) continue;

      const dist = pPos.dist(cell.pos);
      const eatDistance = (pR + cell.radius) * 0.88;

      if (dist < eatDistance) {
        // Special Case: RED PARASITE leech attack!
        if (cell.type === CELL_TYPES.PARASITE) {
          // Drain 8% of player's mass (does NOT trigger Game Over)
          this.player.loseMassPercent(0.08);

          // Flash player in toxic blood red
          this.player.flashTimer = 18;
          this.player.flashColor = "#f43f5e";

          // Sound, Screen Shake
          this.sound.playLeech();
          this.camera.addShake(7);

          // Forcefully bounce parasite away to prevent continuous frame leeching
          const knockDir = Vector2D.sub(cell.pos, pPos);
          if (knockDir.magSq() < 0.1) knockDir.set(Math.random() - 0.5, Math.random() - 0.5);
          knockDir.normalize();

          cell.vel.set(knockDir.x * 16, knockDir.y * 16);
          cell.pos.set(
            pPos.x + knockDir.x * (pR + cell.radius + 32),
            pPos.y + knockDir.y * (pR + cell.radius + 32)
          );

          // Blood red juice particles at contact point
          const midX = (pPos.x + cell.pos.x) / 2;
          const midY = (pPos.y + cell.pos.y) / 2;
          this.particles.createEatBurst(midX, midY, "#f43f5e", 22, 14);

          // Floating indicator text
          this.particles.addFloatingText(
            pPos.x,
            pPos.y - pR - 16,
            "-8% Leech!",
            "#f43f5e",
            15
          );
          continue;
        }

        // Player is larger: EAT!
        if (pR > cell.radius * 1.05) {
          const eatenMass = Math.round(cell.mass);
          this.player.eat(cell);
          cell.isDead = true;

          // Sound, Juice, Shake
          const pitch = Math.max(0.6, Math.min(1.8, 40 / cell.radius));
          this.sound.playEat(pitch);
          this.particles.createEatBurst(cell.pos.x, cell.pos.y, cell.glowColor, 18, cell.radius);
          this.camera.addShake(Math.min(9, cell.radius * 0.22));

          // Metrics
          this.cellsEaten++;
          this.score += eatenMass;
          if (this.score > this.highScore) {
            this.highScore = this.score;
            safeSetStorage("omnivore_high_score", this.highScore.toString());
          }

          // Floating score text
          this.particles.addFloatingText(
            cell.pos.x,
            cell.pos.y,
            `+${eatenMass}`,
            cell.glowColor,
            Math.max(14, Math.min(24, Math.round(cell.radius * 0.55)))
          );
        }
        // Player is smaller: GAME OVER!
        else if (cell.radius > pR * 1.05) {
          this.handleGameOver(cell);
          return;
        }
      }
    }

    // AI vs AI collisions (Only for cells reasonably near the camera to save cycles)
    const simRadius = 1600;
    for (let i = 0; i < this.aiCells.length; i++) {
      const cellA = this.aiCells[i];
      if (cellA.isDead || cellA.pos.dist(pPos) > simRadius) continue;

      for (let j = i + 1; j < this.aiCells.length; j++) {
        const cellB = this.aiCells[j];
        if (cellB.isDead || cellB.pos.dist(pPos) > simRadius) continue;

        const dist = cellA.pos.dist(cellB.pos);
        const contactDist = (cellA.radius + cellB.radius) * 0.85;

        if (dist < contactDist) {
          if (cellA.radius > cellB.radius * 1.15 && cellA.type === CELL_TYPES.PREDATOR) {
            cellA.eat(cellB);
            cellB.isDead = true;
            this.particles.createEatBurst(cellB.pos.x, cellB.pos.y, cellB.glowColor, 10, cellB.radius);
          } else if (cellB.radius > cellA.radius * 1.15 && cellB.type === CELL_TYPES.PREDATOR) {
            cellB.eat(cellA);
            cellA.isDead = true;
            this.particles.createEatBurst(cellA.pos.x, cellA.pos.y, cellA.glowColor, 10, cellA.radius);
          }
        }
      }
    }
  }

  handleGameOver(predator) {
    this.player.isDead = true;
    this.state = GAME_STATES.GAME_OVER;

    // Big death impact
    this.sound.playDeath();
    this.camera.addShake(18);
    this.particles.createEatBurst(this.player.pos.x, this.player.pos.y, "#39ff14", 36, this.player.radius * 1.4);

    // Show Game Over Modal
    if (this.ui.gameOverScreen) {
      setTimeout(() => {
        this.ui.gameOverScreen.classList.remove("hidden");
        if (this.ui.finalMassVal) {
          this.ui.finalMassVal.textContent = Math.round(this.player.mass).toLocaleString();
        }
        if (this.ui.finalScoreVal) {
          this.ui.finalScoreVal.textContent = this.score.toLocaleString();
        }
        if (this.ui.finalTimeVal) {
          const m = Math.floor(this.timeSurvived / 60);
          const s = this.timeSurvived % 60;
          this.ui.finalTimeVal.textContent = `${m}:${s < 10 ? "0" : ""}${s}`;
        }
        if (this.ui.finalBestVal) {
          this.ui.finalBestVal.textContent = this.highScore.toLocaleString();
        }
      }, 500);
    }
  }

  updateHUD() {
    if (!this.player) return;

    if (this.ui.massVal) {
      this.ui.massVal.textContent = Math.round(this.player.mass).toLocaleString();
    }
    if (this.ui.scoreVal) {
      this.ui.scoreVal.textContent = this.score.toLocaleString();
    }
    if (this.ui.timeVal) {
      const m = Math.floor(this.timeSurvived / 60);
      const s = this.timeSurvived % 60;
      this.ui.timeVal.textContent = `${m}:${s < 10 ? "0" : ""}${s}`;
    }
    if (this.ui.dashIndicator) {
      const canDash = this.player.canDash();
      this.ui.dashIndicator.classList.toggle("ready", canDash);
      this.ui.dashIndicator.classList.toggle("recharging", !canDash);
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 1. Clear & Render Parallax Abyss Background
    this.background.render(ctx, this.camera, w, h);

    // 2. World Space Rendering
    ctx.save();
    this.camera.applyTransform(ctx);

    // Render fluid coordinate grid & world boundary
    this.background.renderWorldGrid(ctx, this.camera, w, h);

    // Render Particles beneath cells (shockwaves)
    this.particles.render(ctx);

    // Render AI Cells (Frustum Culled)
    for (let i = 0; i < this.aiCells.length; i++) {
      const cell = this.aiCells[i];
      if (!cell.isDead && this.camera.isVisible(cell.pos.x, cell.pos.y, cell.radius * 2)) {
        cell.render(ctx);
      }
    }

    // Render Player
    if (this.player && !this.player.isDead) {
      this.player.render(ctx);
    }

    ctx.restore();
  }

  loop(timestamp) {
    try {
      if (!this.lastTimestamp) this.lastTimestamp = timestamp;
      const elapsed = timestamp - this.lastTimestamp;
      this.lastTimestamp = timestamp;

      // Normalizing dt around 60fps (dt = 1 at 16.6ms), capped to prevent spiraling
      const dt = Math.min(2.5, elapsed / 16.67);

      this.update(dt);
      this.render();

      requestAnimationFrame((t) => this.loop(t));
    } catch (err) {
      console.error("Omnivore Game Loop Exception:", err);
      if (typeof window.showFatalError === "function") {
        window.showFatalError(err.message, "js/game.js (Game.loop)", 0, 0, err);
      }
    }
  }
}
