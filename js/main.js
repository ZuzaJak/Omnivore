/**
 * Omnivore - Main Entry Point
 * Initializes DOM references and starts the game loop.
 * Safely executes whether DOM is loading or already loaded.
 */

import { Game } from "./game.js";

let isGameInitialized = false;

function init() {
  if (isGameInitialized) return;

  try {
    const canvas = document.getElementById("game-canvas");
    if (!canvas) {
      console.warn("Omnivore: #game-canvas not yet found, waiting for DOM...");
      return;
    }
    isGameInitialized = true;

    const uiElements = {
      startScreen: document.getElementById("start-screen"),
      startBtn: document.getElementById("start-btn"),
      gameOverScreen: document.getElementById("game-over-screen"),
      restartBtn: document.getElementById("restart-btn"),
      pauseModal: document.getElementById("pause-modal"),
      muteBtn: document.getElementById("mute-btn"),
      hud: document.getElementById("hud"),
      massVal: document.getElementById("hud-mass-val"),
      scoreVal: document.getElementById("hud-score-val"),
      timeVal: document.getElementById("hud-time-val"),
      dashIndicator: document.getElementById("hud-dash-indicator"),
      finalMassVal: document.getElementById("final-mass-val"),
      finalScoreVal: document.getElementById("final-score-val"),
      finalTimeVal: document.getElementById("final-time-val"),
      finalBestVal: document.getElementById("final-best-val")
    };

    const game = new Game(canvas, uiElements);

    // Start the render/update loop
    requestAnimationFrame((timestamp) => game.loop(timestamp));
    console.log("Omnivore: Core engine successfully mounted and running.");
  } catch (err) {
    console.error("Omnivore Initialization Crash:", err);
    if (typeof window.showFatalError === "function") {
      window.showFatalError(err.message, "js/main.js (init)", 0, 0, err);
    }
  }
}

// 1. Immediate attempt: if canvas already exists in parsed DOM, mount immediately
if (document.getElementById("game-canvas")) {
  init();
} else if (document.readyState === "loading") {
  // 2. Otherwise listen for DOM readiness
  document.addEventListener("DOMContentLoaded", init);
} else {
  // 3. Fallback for interactive/complete readyState
  init();
}

// 4. Ultimate fallback if dynamic script was delayed past standard events
window.addEventListener("load", () => {
  if (!isGameInitialized) init();
});

