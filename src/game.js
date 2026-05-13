import {
  BASE_MAP,
  DIRECTIONS,
  GAME_STATE,
  GHOST_SPECS,
  SCORE_VALUES,
  TILE,
  TILE_SIZE,
  INPUT_TO_DIRECTION
} from "./config.js";
import { Maze } from "./maze.js";
import { Player } from "./player.js";
import { Ghost } from "./ghost.js";
import { UI } from "./ui.js";
import { SoundManager } from "./soundManager.js";
import { distance } from "./utils.js";

const HIGH_SCORE_KEY = "neon-pacman-highscores";

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ui = new UI();
    this.sound = new SoundManager();

    this.maze = new Maze(BASE_MAP, TILE_SIZE);
    this.canvas.width = this.maze.pixelWidth;
    this.canvas.height = this.maze.pixelHeight;

    const playerSpawnTile = this.maze.findPlayerSpawn();
    this.player = new Player(this.maze.tileCenterToPixel(playerSpawnTile.x, playerSpawnTile.y));

    this.ghosts = this.createGhosts();

    this.state = GAME_STATE.MENU;
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.powerUntil = 0;
    this.ghostCombo = 0;
    this.transitionUntil = 0;
    this.lastTime = performance.now();

    this.ui.bind(this);
    this.ui.updateHud({ score: this.score, lives: this.lives, level: this.level });
    this.installControls();

    requestAnimationFrame(this.loop.bind(this));
  }

  createGhosts() {
    const center = this.maze.pixelToTile(this.maze.pixelWidth / 2, this.maze.pixelHeight / 2);
    const spawns = [
      { x: center.x - 1, y: center.y },
      { x: center.x + 1, y: center.y },
      { x: center.x - 1, y: center.y + 1 },
      { x: center.x + 1, y: center.y + 1 }
    ];

    return GHOST_SPECS.map((spec, index) => new Ghost(spec, spawns[index], this.maze));
  }

  installControls() {
    window.addEventListener("keydown", (event) => {
      const dir = INPUT_TO_DIRECTION[event.key];
      if (dir && this.state === GAME_STATE.PLAYING) {
        this.player.setNextDirection(dir);
      }

      if ((event.key === "p" || event.key === "P") && (this.state === GAME_STATE.PLAYING || this.state === GAME_STATE.PAUSED)) {
        this.togglePause();
      }

      if (event.key === "Enter" && this.state === GAME_STATE.GAME_OVER) {
        this.startNewRun();
      }
    });
  }

  setState(nextState) {
    this.state = nextState;
    this.ui.setPauseVisible(nextState === GAME_STATE.PAUSED);
  }

  startNewRun() {
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.ui.setPauseVisible(false);
    this.ui.setTransitionVisible(false);
    this.loadLevel(true);
    this.ui.showGame();
    this.ui.updateHud({ score: this.score, lives: this.lives, level: this.level });
    this.sound.levelStart();
    this.setState(GAME_STATE.PLAYING);
  }

  loadLevel(resetScoreState = false) {
    this.maze.reset();
    this.player.reset();
    this.player.setSpeedForLevel(this.level);

    this.powerUntil = 0;
    this.ghostCombo = 0;

    const now = performance.now();
    this.ghosts.forEach((ghost) => {
      ghost.reset(this.maze, now);
      ghost.setSpeedForLevel(this.level);
    });

    if (!resetScoreState) {
      this.ui.updateHud({ score: this.score, lives: this.lives, level: this.level });
    }
  }

  loop(now) {
    const dt = Math.min((now - this.lastTime) / 1000, 0.04);
    this.lastTime = now;

    this.update(dt, now);
    this.render(now);

    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt, now) {
    if (this.state === GAME_STATE.PAUSED || this.state === GAME_STATE.MENU || this.state === GAME_STATE.GAME_OVER) {
      return;
    }

    if (this.state === GAME_STATE.LEVEL_TRANSITION) {
      if (now > this.transitionUntil) {
        this.sound.levelStart();
        this.ui.setTransitionVisible(false);
        this.setState(GAME_STATE.PLAYING);
      }
      return;
    }

    this.player.update(dt, this.maze);

    const consumed = this.maze.consumeAtPixel(this.player.x, this.player.y);
    if (consumed === TILE.PELLET) {
      this.score += SCORE_VALUES.pellet;
      this.sound.pellet();
      this.ui.updateHud({ score: this.score, lives: this.lives, level: this.level });
    } else if (consumed === TILE.POWER) {
      this.score += SCORE_VALUES.power;
      this.activatePowerMode(now);
      this.sound.powerPellet();
      this.ui.updateHud({ score: this.score, lives: this.lives, level: this.level });
    }

    for (const ghost of this.ghosts) {
      ghost.update(dt, this.maze, this.player, this.ghosts, now);
    }

    this.handleCollisions(now);

    if (!this.maze.pelletsRemaining) {
      this.nextLevel(now);
    }
  }

  activatePowerMode(now) {
    const duration = Math.max(2800, 6500 - (this.level - 1) * 450);
    this.powerUntil = now + duration;
    this.ghostCombo = 0;
    this.ghosts.forEach((ghost) => ghost.frighten(duration, now));
  }

  handleCollisions(now) {
    for (const ghost of this.ghosts) {
      if (ghost.mode === "inHouse") {
        continue;
      }

      const hit = distance(this.player.x, this.player.y, ghost.x, ghost.y) < this.player.radius + ghost.radius - 6;
      if (!hit) {
        continue;
      }

      if (ghost.mode === "frightened") {
        ghost.setEaten();
        const ghostPoints = SCORE_VALUES.ghost * (1 + this.ghostCombo);
        this.ghostCombo += 1;
        this.score += ghostPoints;
        this.sound.eatGhost();
        this.ui.updateHud({ score: this.score, lives: this.lives, level: this.level });
        continue;
      }

      if (ghost.mode !== "eaten") {
        this.loseLife(now);
        break;
      }
    }
  }

  loseLife(now) {
    this.lives -= 1;
    this.ui.updateHud({ score: this.score, lives: this.lives, level: this.level });
    if (this.lives <= 0) {
      this.gameOver();
      return;
    }

    this.setState(GAME_STATE.PAUSED);
    this.player.reset();
    const resetNow = performance.now();
    this.ghosts.forEach((ghost) => ghost.reset(this.maze, resetNow));
    setTimeout(() => {
      if (this.state !== GAME_STATE.GAME_OVER) {
        this.lastTime = performance.now();
        this.setState(GAME_STATE.PLAYING);
      }
    }, 850);
  }

  nextLevel(now) {
    this.level += 1;
    this.loadLevel();
    this.transitionUntil = now + 1500;
    this.ui.updateHud({ score: this.score, lives: this.lives, level: this.level });
    this.ui.setTransitionVisible(true, `LEVEL ${this.level}`);
    this.setState(GAME_STATE.LEVEL_TRANSITION);
  }

  gameOver() {
    this.sound.gameOver();
    this.saveHighScore(this.score, this.level);
    this.setState(GAME_STATE.GAME_OVER);
    this.ui.showGameOver(this.score);
  }

  togglePause() {
    if (this.state === GAME_STATE.PLAYING) {
      this.setState(GAME_STATE.PAUSED);
      return;
    }

    if (this.state === GAME_STATE.PAUSED) {
      this.lastTime = performance.now();
      this.setState(GAME_STATE.PLAYING);
    }
  }

  render(now) {
    if (this.state === GAME_STATE.MENU) {
      return;
    }

    this.maze.draw(this.ctx, now);
    this.player.render(this.ctx);

    for (const ghost of this.ghosts) {
      ghost.render(this.ctx, now);
    }

    if (this.state === GAME_STATE.GAME_OVER) {
      this.ctx.save();
      this.ctx.fillStyle = "rgba(4, 5, 9, 0.55)";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();
    }
  }

  getHighScores() {
    const raw = localStorage.getItem(HIGH_SCORE_KEY);
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed;
    } catch {
      return [];
    }
  }

  saveHighScore(score, level) {
    const scores = this.getHighScores();
    scores.push({ score, level, date: Date.now() });
    scores.sort((a, b) => b.score - a.score);
    const top = scores.slice(0, 10);
    localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(top));
  }
}
