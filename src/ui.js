import { GAME_STATE } from "./config.js";

export class UI {
  constructor() {
    this.screens = {
      menu: document.getElementById("menuScreen"),
      game: document.getElementById("gameScreen"),
      instructions: document.getElementById("instructionsScreen"),
      scores: document.getElementById("highScoresScreen"),
      gameOver: document.getElementById("gameOverScreen")
    };

    this.elements = {
      score: document.getElementById("scoreValue"),
      lives: document.getElementById("livesValue"),
      level: document.getElementById("levelValue"),
      pause: document.getElementById("pauseMessage"),
      transition: document.getElementById("transitionMessage"),
      finalScore: document.getElementById("finalScore"),
      highScoresList: document.getElementById("highScoresList")
    };

    this.buttons = {
      play: document.getElementById("playBtn"),
      instructions: document.getElementById("instructionsBtn"),
      highScores: document.getElementById("highScoresBtn"),
      backFromInstructions: document.getElementById("backFromInstructions"),
      backFromScores: document.getElementById("backFromScores"),
      restart: document.getElementById("restartBtn"),
      backToMenu: document.getElementById("backToMenuBtn")
    };

    this.showScreen("menu");
  }

  bind(game) {
    this.buttons.play.addEventListener("click", () => game.startNewRun());
    this.buttons.instructions.addEventListener("click", () => this.showScreen("instructions"));
    this.buttons.highScores.addEventListener("click", () => {
      this.renderHighScores(game.getHighScores());
      this.showScreen("scores");
    });
    this.buttons.backFromInstructions.addEventListener("click", () => this.showScreen("menu"));
    this.buttons.backFromScores.addEventListener("click", () => this.showScreen("menu"));
    this.buttons.restart.addEventListener("click", () => game.startNewRun());
    this.buttons.backToMenu.addEventListener("click", () => {
      game.setState(GAME_STATE.MENU);
      this.showScreen("menu");
    });
  }

  showScreen(name) {
    Object.entries(this.screens).forEach(([key, section]) => {
      section.classList.toggle("hidden", key !== name);
    });
  }

  updateHud({ score, lives, level }) {
    this.elements.score.textContent = score;
    this.elements.lives.textContent = lives;
    this.elements.level.textContent = level;
  }

  setPauseVisible(visible) {
    this.elements.pause.classList.toggle("hidden", !visible);
  }

  setTransitionVisible(visible, text = "LEVEL UP") {
    this.elements.transition.textContent = text;
    this.elements.transition.classList.toggle("hidden", !visible);
  }

  showGame() {
    this.showScreen("game");
  }

  showGameOver(score) {
    this.elements.finalScore.textContent = score;
    this.showScreen("gameOver");
  }

  renderHighScores(scores) {
    this.elements.highScoresList.innerHTML = "";
    if (!scores.length) {
      const li = document.createElement("li");
      li.textContent = "No scores yet";
      this.elements.highScoresList.appendChild(li);
      return;
    }

    scores.forEach((entry, index) => {
      const li = document.createElement("li");
      const date = new Date(entry.date).toLocaleDateString();
      li.textContent = `${index + 1}. ${entry.score} pts - Lv.${entry.level} (${date})`;
      this.elements.highScoresList.appendChild(li);
    });
  }
}
