/**
 * Omnivore - Main Entry Point
 * Initializes DOM references and starts the game loop.
 */

import { Game } from "./game.js";

window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("game-canvas");

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
});
