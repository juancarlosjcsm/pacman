import { Game } from "./game.js";

const canvas = document.getElementById("gameCanvas");

if (!canvas) {
  throw new Error("Canvas element #gameCanvas not found");
}

new Game(canvas);
