/**
 * Omnivore - Main Entry Point
 * Initializes DOM references and starts the game loop.
 * Safely executes whether DOM is loading or already loaded.
 */

import { Game } from "./game.js";

function init() {
  const canvas = document.getElementById("game-canvas");
  if (!canvas) return;

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
}

// Ensure execution even if script is injected after DOMContentLoaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
