export const TILE_SIZE = 24;

export const BASE_MAP = [
  "###################",
  "#o.......#.......o#",
  "#.###.##.#.##.###.#",
  "#.................#",
  "#.###.#.###.#.###.#",
  "#.....#..P..#.....#",
  "#.###.#.###.#.###.#",
  "#.....#.....#.....#",
  "###.#.#####.#.#.###",
  "###.#...#...#.#.###",
  ".....###...###.....",
  "###.#.#####.#.#.###",
  "###.#.......#.#.###",
  "#.....#.###.#.....#",
  "#.###.#.###.#.###.#",
  "#o..#.........#..o#",
  "###.#.#.###.#.#.###",
  "#.....#..#..#.....#",
  "#.######.#.######.#",
  "#.................#",
  "###################"
];

export const GHOST_SPECS = [
  { name: "blinky", color: "#ff2f47", scatterTarget: { x: 17, y: 0 } },
  { name: "pinky", color: "#ff75d5", scatterTarget: { x: 1, y: 0 } },
  { name: "inky", color: "#21d9ff", scatterTarget: { x: 17, y: 20 } },
  { name: "clyde", color: "#ffad3b", scatterTarget: { x: 1, y: 20 } }
];

export const DIRECTIONS = {
  left: { x: -1, y: 0, angle: Math.PI },
  right: { x: 1, y: 0, angle: 0 },
  up: { x: 0, y: -1, angle: -Math.PI / 2 },
  down: { x: 0, y: 1, angle: Math.PI / 2 }
};

export const INPUT_TO_DIRECTION = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  a: "left",
  A: "left",
  d: "right",
  D: "right",
  w: "up",
  W: "up",
  s: "down",
  S: "down"
};

export const GAME_STATE = {
  MENU: "menu",
  PLAYING: "playing",
  PAUSED: "paused",
  GAME_OVER: "game_over",
  LEVEL_TRANSITION: "level_transition"
};

export const TILE = {
  WALL: "#",
  PELLET: ".",
  POWER: "o",
  EMPTY: " ",
  SPAWN: "P"
};

export const SCORE_VALUES = {
  pellet: 10,
  power: 50,
  ghost: 200
};
