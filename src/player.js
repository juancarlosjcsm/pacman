import { DIRECTIONS, TILE_SIZE } from "./config.js";
import { createSvgImage } from "./utils.js";

export class Player {
  constructor(spawnPixel) {
    this.spawnPixel = spawnPixel;
    this.radius = TILE_SIZE * 0.42;
    this.baseSpeed = 120;
    this.speed = this.baseSpeed;
    this.directionName = "left";
    this.nextDirectionName = "left";
    this.mouthAnim = 0;
    this.spriteCache = new Map();
    this.reset();
  }

  getMouthAngle() {
    const mouthFactor = (Math.sin(this.mouthAnim * Math.PI) + 1) * 0.5;
    const rawAngle = 14 + mouthFactor * 32;
    const step = 5;
    return Math.round(rawAngle / step) * step;
  }

  reset() {
    this.x = this.spawnPixel.x;
    this.y = this.spawnPixel.y;
    this.directionName = "left";
    this.nextDirectionName = "left";
    this.mouthAnim = 0;
  }

  setSpeedForLevel(level) {
    this.speed = this.baseSpeed + (level - 1) * 4;
  }

  setNextDirection(directionName) {
    if (DIRECTIONS[directionName]) {
      this.nextDirectionName = directionName;
    }
  }

  isAlignedToGrid(maze, threshold = 2.2) {
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

  update(dt, maze) {
    this.mouthAnim += dt * 8;

    if (this.isAlignedToGrid(maze) && this.canMove(this.nextDirectionName, maze)) {
      this.directionName = this.nextDirectionName;
    }

    if (this.canMove(this.directionName, maze)) {
      const dir = DIRECTIONS[this.directionName];
      this.x += dir.x * this.speed * dt;
      this.y += dir.y * this.speed * dt;
    }

    // Tunnel wrap around.
    if (this.x < -this.radius) {
      this.x = maze.pixelWidth + this.radius;
    } else if (this.x > maze.pixelWidth + this.radius) {
      this.x = -this.radius;
    }
  }

  getSprite(size, mouthAngle) {
    const key = `${this.directionName}:${mouthAngle}`;
    if (this.spriteCache.has(key)) {
      return this.spriteCache.get(key);
    }

    const rotate = (DIRECTIONS[this.directionName]?.angle ?? 0) * (180 / Math.PI);
    const mouthHalf = (mouthAngle * Math.PI) / 360;
    const p1x = 50 + 45 * Math.cos(-mouthHalf);
    const p1y = 50 + 45 * Math.sin(-mouthHalf);
    const p2x = 50 + 45 * Math.cos(mouthHalf);
    const p2y = 50 + 45 * Math.sin(mouthHalf);
    const maskId = `pacMask-${this.directionName}-${mouthAngle}`;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
        <defs>
          <mask id="${maskId}">
            <rect width="100" height="100" fill="white" />
            <polygon points="50,50 ${p1x},${p1y} ${p2x},${p2y}" fill="black" />
          </mask>
        </defs>
        <g transform="translate(50 50) rotate(${rotate}) translate(-50 -50)">
          <circle cx="50" cy="50" r="45" fill="#ffe547" stroke="#ffd800" stroke-width="3" mask="url(#${maskId})" />
        </g>
      </svg>
    `;

    const img = createSvgImage(svg);
    this.spriteCache.set(key, img);
    return img;
  }

  drawFallback(ctx, size, mouthAngle) {
    const radius = size * 0.4;
    const centerX = this.x;
    const centerY = this.y;
    const baseAngle = DIRECTIONS[this.directionName]?.angle ?? 0;
    const half = (mouthAngle * Math.PI) / 360;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, baseAngle + half, baseAngle - half + Math.PI * 2, false);
    ctx.closePath();
    ctx.fillStyle = "#ffe547";
    ctx.fill();
    ctx.strokeStyle = "#ffd800";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  render(ctx) {
    const size = this.radius * 2.5;
    const mouthAngle = this.getMouthAngle();
    const img = this.getSprite(Math.ceil(size), mouthAngle);

    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, this.x - size / 2, this.y - size / 2, size, size);
      return;
    }

    this.drawFallback(ctx, size, mouthAngle);
  }
}
