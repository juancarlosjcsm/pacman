import { BASE_MAP, TILE, TILE_SIZE } from "./config.js";

export class Maze {
  constructor(baseMap = BASE_MAP, tileSize = TILE_SIZE) {
    this.baseMap = baseMap;
    this.tileSize = tileSize;
    this.reset();
  }

  reset() {
    this.grid = this.baseMap.map((row) => row.split(""));
    this.height = this.grid.length;
    this.width = this.grid[0].length;
    this.pelletsRemaining = 0;

    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const tile = this.grid[y][x];
        if (tile === TILE.PELLET || tile === TILE.POWER) {
          this.pelletsRemaining += 1;
        }
      }
    }
  }

  get pixelWidth() {
    return this.width * this.tileSize;
  }

  get pixelHeight() {
    return this.height * this.tileSize;
  }

  tileAt(x, y) {
    if (y < 0 || y >= this.height) {
      return TILE.WALL;
    }

    // Tunnels: outside left/right limits on the tunnel row behave as empty space.
    if (x < 0 || x >= this.width) {
      return TILE.EMPTY;
    }

    return this.grid[y][x];
  }

  setTile(x, y, value) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return;
    }
    this.grid[y][x] = value;
  }

  isWall(x, y) {
    return this.tileAt(x, y) === TILE.WALL;
  }

  isWalkable(x, y) {
    return this.tileAt(x, y) !== TILE.WALL;
  }

  tileCenterToPixel(x, y) {
    return {
      x: x * this.tileSize + this.tileSize / 2,
      y: y * this.tileSize + this.tileSize / 2
    };
  }

  pixelToTile(px, py) {
    return {
      x: Math.floor(px / this.tileSize),
      y: Math.floor(py / this.tileSize)
    };
  }

  isWallAtPixel(px, py) {
    const tile = this.pixelToTile(px, py);
    return this.isWall(tile.x, tile.y);
  }

  consumeAtPixel(px, py) {
    const { x, y } = this.pixelToTile(px, py);
    const tile = this.tileAt(x, y);
    if (tile === TILE.PELLET || tile === TILE.POWER) {
      this.setTile(x, y, TILE.EMPTY);
      this.pelletsRemaining -= 1;
      return tile;
    }
    return null;
  }

  findPlayerSpawn() {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        if (this.grid[y][x] === TILE.SPAWN) {
          return { x, y };
        }
      }
    }
    return { x: 9, y: 5 };
  }

  draw(ctx, time) {
    const { tileSize } = this;

    ctx.save();
    ctx.fillStyle = "#04070f";
    ctx.fillRect(0, 0, this.pixelWidth, this.pixelHeight);

    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const tile = this.grid[y][x];
        const px = x * tileSize;
        const py = y * tileSize;

        if (tile === TILE.WALL) {
          const pulse = 0.45 + 0.2 * Math.sin(time * 0.002 + x * 0.4 + y * 0.35);
          ctx.fillStyle = `rgba(35, 211, 255, ${pulse})`;
          ctx.strokeStyle = "rgba(123, 243, 255, 0.9)";
          ctx.lineWidth = 1.6;
          this.drawRoundedRect(ctx, px + 2, py + 2, tileSize - 4, tileSize - 4, 5);
          ctx.fill();
          ctx.stroke();
        }

        if (tile === TILE.PELLET || tile === TILE.POWER) {
          const isPower = tile === TILE.POWER;
          const radius = isPower ? tileSize * 0.2 : tileSize * 0.08;
          const blink = isPower ? 0.6 + 0.4 * Math.sin(time * 0.01) : 1;
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 229, 71, ${blink})`;
          ctx.arc(px + tileSize / 2, py + tileSize / 2, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }

  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}
