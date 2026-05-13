import { DIRECTIONS, TILE_SIZE } from "./config.js";
import { createSvgImage, distance, randomItem } from "./utils.js";

const DIRECTION_NAMES = Object.keys(DIRECTIONS);
const HOUSE_RELEASE_DELAY = {
  blinky: 0,
  pinky: 1500,
  inky: 3400,
  clyde: 5200
};
const EATEN_RESPAWN_DELAY = 1200;

export class Ghost {
  constructor(spec, spawnTile, maze) {
    this.name = spec.name;
    this.baseColor = spec.color;
    this.scatterTarget = spec.scatterTarget;
    this.spawnTile = spawnTile;
    this.radius = TILE_SIZE * 0.42;
    this.baseSpeed = 95;
    this.speed = this.baseSpeed;
    this.mode = "chase";
    this.directionName = "left";
    this.frightenedUntil = 0;
    this.releaseAt = 0;
    this.spriteCache = new Map();
    this.floatSeed = Math.random() * Math.PI * 2;
    this.reset(maze);
  }

  reset(maze, now = performance.now()) {
    const spawn = maze.tileCenterToPixel(this.spawnTile.x, this.spawnTile.y);
    this.x = spawn.x;
    this.y = spawn.y;
    this.mode = this.name === "blinky" ? "chase" : "inHouse";
    this.releaseAt = now + (HOUSE_RELEASE_DELAY[this.name] ?? 0);
    this.frightenedUntil = 0;
    this.directionName = "left";
  }

  setSpeedForLevel(level) {
    this.speed = this.baseSpeed + (level - 1) * 6;
  }

  frighten(durationMs, now) {
    if (this.mode === "eaten" || this.mode === "inHouse") {
      return;
    }
    this.mode = "frightened";
    this.frightenedUntil = now + durationMs;
  }

  setEaten() {
    this.mode = "eaten";
    this.frightenedUntil = 0;
  }

  isAlignedToGrid(maze, threshold = 2.5) {
    const centerX = ((Math.floor(this.x / maze.tileSize) + 0.5) * maze.tileSize);
    const centerY = ((Math.floor(this.y / maze.tileSize) + 0.5) * maze.tileSize);
    return Math.abs(this.x - centerX) < threshold && Math.abs(this.y - centerY) < threshold;
  }

  canMove(directionName, maze) {
    const dir = DIRECTIONS[directionName];
    if (!dir) {
      return false;
    }
    const probe = this.radius + 2;
    const targetX = this.x + dir.x * probe;
    const targetY = this.y + dir.y * probe;
    return !maze.isWallAtPixel(targetX, targetY);
  }

  chooseDirection(maze, player, ghosts) {
    const opposites = {
      left: "right",
      right: "left",
      up: "down",
      down: "up"
    };

    const options = DIRECTION_NAMES.filter((name) => this.canMove(name, maze));
    if (!options.length) {
      return this.directionName;
    }

    const filtered = options.filter((name) => name !== opposites[this.directionName]);
    const legal = filtered.length ? filtered : options;

    if (this.mode === "frightened") {
      return randomItem(legal);
    }

    let target;
    if (this.mode === "eaten") {
      target = this.spawnTile;
    } else {
      target = this.getChaseTarget(player, ghosts, maze);
    }

    let best = legal[0];
    let bestScore = Number.POSITIVE_INFINITY;

    for (const option of legal) {
      const d = DIRECTIONS[option];
      const nextX = this.x + d.x * maze.tileSize;
      const nextY = this.y + d.y * maze.tileSize;
      const nextTile = maze.pixelToTile(nextX, nextY);
      const score = distance(nextTile.x, nextTile.y, target.x, target.y);
      if (score < bestScore) {
        bestScore = score;
        best = option;
      }
    }

    return best;
  }

  getChaseTarget(player, ghosts, maze) {
    const playerTile = maze.pixelToTile(player.x, player.y);
    const playerDir = DIRECTIONS[player.directionName];

    if (this.name === "blinky") {
      return playerTile;
    }

    if (this.name === "pinky") {
      return {
        x: playerTile.x + playerDir.x * 4,
        y: playerTile.y + playerDir.y * 4
      };
    }

    if (this.name === "inky") {
      const blinky = ghosts.find((ghost) => ghost.name === "blinky") || this;
      const blinkyTile = maze.pixelToTile(blinky.x, blinky.y);
      const ahead = {
        x: playerTile.x + playerDir.x * 2,
        y: playerTile.y + playerDir.y * 2
      };
      return {
        x: ahead.x + (ahead.x - blinkyTile.x),
        y: ahead.y + (ahead.y - blinkyTile.y)
      };
    }

    const selfTile = maze.pixelToTile(this.x, this.y);
    const distToPlayer = distance(selfTile.x, selfTile.y, playerTile.x, playerTile.y);
    if (distToPlayer < 6) {
      return this.scatterTarget;
    }
    return playerTile;
  }

  update(dt, maze, player, ghosts, now) {
    if (this.mode === "inHouse") {
      const home = maze.tileCenterToPixel(this.spawnTile.x, this.spawnTile.y);
      this.x = home.x;
      this.y = home.y + Math.sin(now * 0.007 + this.floatSeed) * 2.5;
      if (now >= this.releaseAt) {
        this.x = home.x;
        this.y = home.y;
        this.mode = "chase";
        this.directionName = "left";
      }
      return;
    }

    if (this.mode === "frightened" && now > this.frightenedUntil) {
      this.mode = "chase";
    }

    if (this.isAlignedToGrid(maze)) {
      this.directionName = this.chooseDirection(maze, player, ghosts);
    }

    const speedFactor = this.mode === "frightened" ? 0.72 : this.mode === "eaten" ? 1.25 : 1;
    const dir = DIRECTIONS[this.directionName];
    this.x += dir.x * this.speed * speedFactor * dt;
    this.y += dir.y * this.speed * speedFactor * dt;

    if (this.x < -this.radius) {
      this.x = maze.pixelWidth + this.radius;
    } else if (this.x > maze.pixelWidth + this.radius) {
      this.x = -this.radius;
    }

    if (this.mode === "eaten") {
      const spawnCenter = maze.tileCenterToPixel(this.spawnTile.x, this.spawnTile.y);
      const atSpawn = distance(this.x, this.y, spawnCenter.x, spawnCenter.y) < 8;
      if (atSpawn) {
        this.mode = "inHouse";
        this.releaseAt = now + EATEN_RESPAWN_DELAY;
        this.x = spawnCenter.x;
        this.y = spawnCenter.y;
      }
    }
  }

  getSprite(size, now) {
    const look = DIRECTIONS[this.directionName] ?? DIRECTIONS.left;
    const blinkPhase = this.mode === "frightened" && this.frightenedUntil - now < 1800 && Math.floor(now / 130) % 2 === 0;
    const color = this.mode === "frightened" ? (blinkPhase ? "#e5ecff" : "#2b5bff") : this.mode === "eaten" ? "#102040" : this.baseColor;
    const key = `${color}:${look.x}:${look.y}:${this.mode}`;

    if (this.spriteCache.has(key)) {
      return this.spriteCache.get(key);
    }

    const eyeOffsetX = look.x * 5;
    const eyeOffsetY = look.y * 4;
    const bodyOpacity = this.mode === "eaten" ? 0 : 1;

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
        <g>
          <path d="M10 58 C10 25, 25 12, 50 12 C75 12, 90 25, 90 58 L90 84 L80 76 L70 84 L60 76 L50 84 L40 76 L30 84 L20 76 L10 84 Z"
                fill="${color}" fill-opacity="${bodyOpacity}" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
          <circle cx="37" cy="48" r="11" fill="#ffffff"/>
          <circle cx="63" cy="48" r="11" fill="#ffffff"/>
          <circle cx="${37 + eyeOffsetX}" cy="${48 + eyeOffsetY}" r="5" fill="#041528"/>
          <circle cx="${63 + eyeOffsetX}" cy="${48 + eyeOffsetY}" r="5" fill="#041528"/>
        </g>
      </svg>
    `;

    const img = createSvgImage(svg);
    this.spriteCache.set(key, img);
    return img;
  }

  render(ctx, now) {
    const floatY = Math.sin(now * 0.004 + this.floatSeed) * 1.8;
    const size = this.radius * 2.6;
    const img = this.getSprite(Math.ceil(size), now);
    ctx.drawImage(img, this.x - size / 2, this.y - size / 2 + floatY, size, size);
  }
}
