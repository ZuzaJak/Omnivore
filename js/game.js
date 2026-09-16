/**
 * Omnivore - Core Game Engine (Three.js 3D Microcosmic Simulation)
 * Orchestrates Three.js WebGL rendering, 2D physics plane invariance,
 * entity lifecycles, collision detection, and HUD synchronization.
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
    this.ui = uiElements;

    // 2D Text Overlay Canvas for pixel-crisp HUD indicator floating text
    this.textCanvas = document.getElementById("text-canvas");
    this.textCtx = this.textCanvas ? this.textCanvas.getContext("2d") : null;

    // Simulation World Bounds & Capacity
    this.worldRadius = 3500;
    this.maxCells = 180;

    // Three.js WebGL Engine Initialization
    const THREE = window.THREE;
    if (THREE) {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: false,
        powerPreference: "high-performance"
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(window.innerWidth, window.innerHeight, false);
      this.scene = new THREE.Scene();
    } else {
      this.renderer = null;
      this.scene = null;
    }

    // Core Systems
    this.camera = new Camera(canvas.width, canvas.height);
    this.background = new BackgroundSystem(this.worldRadius);
    if (this.scene) this.background.initThreeScene(this.scene);

    this.particles = new ParticleManager();
    if (this.scene) this.particles.initThreeScene(this.scene);

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
    this.canvasRect = { left: 0, top: 0, width: canvas.width, height: canvas.height };
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
    window.addEventListener(
      "scroll",
      () => {
        this.canvasRect = this.canvas.getBoundingClientRect();
      },
      { passive: true }
    );

    window.addEventListener("mousemove", (e) => {
      const rect = this.canvasRect || this.canvas.getBoundingClientRect();
      this.mouseScreen.set(e.clientX - rect.left, e.clientY - rect.top);
    });

    window.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        this.sound.init();
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
        if (e.target && (e.target.closest("button") || e.target.closest(".screen-card"))) {
          return;
        }

        e.preventDefault();
        this.sound.init();

        if (e.touches.length > 0) {
          const rect = this.canvasRect || this.canvas.getBoundingClientRect();
          const touchX = e.touches[0].clientX - rect.left;
          const touchY = e.touches[0].clientY - rect.top;

          this.mouseScreen.set(touchX, touchY);

          // Double-tap detection for Dash
          const now = performance.now();
          const timeDiff = now - this.lastTapTime;
          const distDiff = Math.hypot(touchX - this.lastTapPos.x, touchY - this.lastTapPos.y);

          if (timeDiff < 300 && distDiff < 50) {
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

        e.preventDefault();

        if (e.touches.length > 0) {
          const rect = this.canvasRect || this.canvas.getBoundingClientRect();
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
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.canvas.width = w;
    this.canvas.height = h;

    if (this.textCanvas) {
      this.textCanvas.width = w;
      this.textCanvas.height = h;
    }

    this.canvasRect = this.canvas.getBoundingClientRect();
    this.camera.resize(w, h);

    if (this.renderer) {
      this.renderer.setSize(w, h, false);
    }
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
      this.sound.pause();
      if (this.ui.pauseModal) this.ui.pauseModal.classList.remove("hidden");
    } else if (this.state === GAME_STATES.PAUSED) {
      this.state = GAME_STATES.PLAYING;
      this.sound.resume();
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

    // Clean up existing cells in Three.js scene
    if (this.player) {
      this.player.destroy(this.scene);
    }
    for (let i = 0; i < this.aiCells.length; i++) {
      this.aiCells[i].destroy(this.scene);
    }
    this.aiCells = [];

    // Reset Player at origin
    this.player = new Player(0, 0, 26);
    if (this.player.threeGroup && this.scene) {
      this.scene.add(this.player.threeGroup);
    }

    this.camera.pos.set(0, 0);
    this.camera.zoom = 1.0;

    // Clear particles
    this.particles.clear();

    // Populate Initial Ecosystem
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
      const playerRefR = this.player ? this.player.radius : 26;
      radius = randomRange(playerRefR * 0.95, playerRefR * 2.3);
    }

    const cell = new AICell(pos.x, pos.y, radius, type);
    if (cell.threeGroup && this.scene) {
      this.scene.add(cell.threeGroup);
    }
    this.aiCells.push(cell);
  }

  triggerPlayerDash() {
    if (!this.player || this.player.isDead) return;

    const dashResult = this.player.dash();
    if (dashResult) {
      this.particles.createDashTrail(
        dashResult.ejectX,
        dashResult.ejectY,
        dashResult.oppositeAngle,
        "#39ff14",
        this.player.radius
      );

      this.sound.playDash();
      this.camera.addShake(4);

      this.particles.addFloatingText(
        this.player.pos.x,
        this.player.pos.y - this.player.radius - 12,
        "-Dash",
        "#4ade80",
        13
      );
    }
  }

  update(dt = 1) {
    if (this.state !== GAME_STATES.PLAYING) return;

    // Survival timing
    this.timeSurvived = Math.floor((performance.now() - this.startTime) / 1000);

    // 1. Raycast screen pointer to 2D world coordinates on Z=0 plane
    const worldMouse = this.camera.screenToWorld(this.mouseScreen.x, this.mouseScreen.y);
    if (this.player && !this.player.isDead) {
      this.player.setTarget(worldMouse.x, worldMouse.y);
      const hitBoundary = this.player.update(dt, this.worldRadius);
      if (hitBoundary) {
        this.camera.addShake(2.5);
      }
    }

    // 2. Update AI cells (Sensory decisions and physical motion)
    for (let i = 0; i < this.aiCells.length; i++) {
      const cell = this.aiCells[i];
      if (cell.isDead) continue;
      cell.updateAI(this.aiCells, this.player, this.worldRadius);
      cell.update(dt);
    }

    // 3. Resolve Collisions (2D physical plane)
    this.resolveCollisions();

    // 4. Clean up dead cells from scene and replenish ecosystem
    for (let i = this.aiCells.length - 1; i >= 0; i--) {
      const cell = this.aiCells[i];
      if (cell.isDead) {
        cell.destroy(this.scene);
        this.aiCells.splice(i, 1);
      }
    }

    while (this.aiCells.length < this.maxCells) {
      this.spawnRandomCell(true);
    }

    // 5. Update Camera, Particles, and Background
    this.camera.update(this.player, dt);
    this.particles.update(dt);
    this.background.update(dt, this.camera.pos.x, this.camera.pos.y);

    // 6. Sync UI HUD
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

      const eatDistance = (pR + cell.radius) * 0.88;
      const dx = cell.pos.x - pPos.x;
      if (Math.abs(dx) > eatDistance) continue;
      const dy = cell.pos.y - pPos.y;
      if (Math.abs(dy) > eatDistance) continue;

      const distSq = dx * dx + dy * dy;
      if (distSq > eatDistance * eatDistance) continue;
      const dist = Math.sqrt(distSq);

      if (dist < eatDistance) {
        // Red parasite attack
        if (cell.type === CELL_TYPES.PARASITE) {
          this.player.loseMassPercent(0.08);

          this.player.flashTimer = 18;
          this.player.flashColor = "#f43f5e";

          this.sound.playLeech();
          this.camera.addShake(7);

          const knockDir = Vector2D.sub(cell.pos, pPos);
          if (knockDir.magSq() < 0.1) knockDir.set(Math.random() - 0.5, Math.random() - 0.5);
          knockDir.normalize();

          cell.vel.set(knockDir.x * 16, knockDir.y * 16);
          cell.pos.set(
            pPos.x + knockDir.x * (pR + cell.radius + 32),
            pPos.y + knockDir.y * (pR + cell.radius + 32)
          );

          const midX = (pPos.x + cell.pos.x) / 2;
          const midY = (pPos.y + cell.pos.y) / 2;
          this.particles.createEatBurst(midX, midY, "#f43f5e", 22, 14);

          this.particles.addFloatingText(
            pPos.x,
            pPos.y - pR - 16,
            "-8% Leech!",
            "#f43f5e",
            15
          );
          continue;
        }

        // Player absorbs smaller cell
        if (pR > cell.radius * 1.05) {
          const eatenMass = Math.round(cell.mass);
          this.player.eat(cell);
          cell.isDead = true;

          const pitch = Math.max(0.6, Math.min(1.8, 40 / cell.radius));
          this.sound.playEat(pitch);
          this.particles.createEatBurst(cell.pos.x, cell.pos.y, cell.glowColor, 18, cell.radius);
          this.camera.addShake(Math.min(9, cell.radius * 0.22));

          this.cellsEaten++;
          this.score += eatenMass;
          if (this.score > this.highScore) {
            this.highScore = this.score;
            safeSetStorage("omnivore_high_score", this.highScore.toString());
          }

          this.particles.addFloatingText(
            cell.pos.x,
            cell.pos.y,
            `+${eatenMass}`,
            cell.glowColor,
            Math.max(14, Math.min(24, Math.round(cell.radius * 0.55)))
          );
        }
        // Larger predator consumes player
        else if (cell.radius > pR * 1.05) {
          this.handleGameOver(cell);
          return;
        }
      }
    }

    // AI vs AI collisions
    const simRadius = 1600;
    const simRadiusSq = simRadius * simRadius;
    for (let i = 0; i < this.aiCells.length; i++) {
      const cellA = this.aiCells[i];
      if (cellA.isDead) continue;

      const pAdx = cellA.pos.x - pPos.x;
      if (Math.abs(pAdx) > simRadius) continue;
      const pAdy = cellA.pos.y - pPos.y;
      if (Math.abs(pAdy) > simRadius) continue;
      if (pAdx * pAdx + pAdy * pAdy > simRadiusSq) continue;

      for (let j = i + 1; j < this.aiCells.length; j++) {
        const cellB = this.aiCells[j];
        if (cellB.isDead) continue;

        if (cellA.type !== CELL_TYPES.PREDATOR && cellB.type !== CELL_TYPES.PREDATOR) continue;

        const pBdx = cellB.pos.x - pPos.x;
        if (Math.abs(pBdx) > simRadius) continue;
        const pBdy = cellB.pos.y - pPos.y;
        if (Math.abs(pBdy) > simRadius) continue;

        const contactDist = (cellA.radius + cellB.radius) * 0.85;
        const abDx = cellB.pos.x - cellA.pos.x;
        if (Math.abs(abDx) > contactDist) continue;
        const abDy = cellB.pos.y - cellA.pos.y;
        if (Math.abs(abDy) > contactDist) continue;

        const abDistSq = abDx * abDx + abDy * abDy;
        if (abDistSq < contactDist * contactDist) {
          if (cellA.radius > cellB.radius * 1.15 && cellA.type === CELL_TYPES.PREDATOR) {
            cellA.eat(cellB);
            cellB.isDead = true;
            this.particles.createEatBurst(cellB.pos.x, cellB.pos.y, cellB.glowColor, 10, cellB.radius);
          } else if (cellB.radius > cellA.radius * 1.15 && cellB.type === CELL_TYPES.PREDATOR) {
            cellB.eat(cellA);
            cellA.isDead = true;
            this.particles.createEatBurst(cellA.pos.x, cellA.pos.y, cellA.glowColor, 10, cellA.radius);
            break;
          }
        }
      }
    }
  }

  handleGameOver(predator) {
    this.player.isDead = true;
    this.state = GAME_STATES.GAME_OVER;

    this.sound.playDeath();
    this.camera.addShake(18);
    this.particles.createEatBurst(this.player.pos.x, this.player.pos.y, "#39ff14", 36, this.player.radius * 1.4);

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
    // 1. Clear 2D Text Overlay Canvas
    if (this.textCtx) {
      this.textCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // 2. Frustum Culling for AI Cells to maintain 60 FPS
    for (let i = 0; i < this.aiCells.length; i++) {
      const cell = this.aiCells[i];
      if (cell.threeGroup) {
        cell.threeGroup.visible = !cell.isDead && this.camera.isVisible(cell.pos.x, cell.pos.y, cell.radius * 2);
      }
    }

    // 3. Render 3D Scene with Three.js WebGLRenderer
    if (this.renderer && this.scene && this.camera.threeCamera) {
      this.renderer.render(this.scene, this.camera.threeCamera);
    }

    // 4. Render 2D Floating Score and Combat Feedback Text
    if (this.textCtx) {
      this.particles.renderText(this.textCtx, this.camera);
    }
  }

  loop(timestamp) {
    try {
      if (!this.lastTimestamp) this.lastTimestamp = timestamp;
      const elapsed = timestamp - this.lastTimestamp;
      this.lastTimestamp = timestamp;

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
