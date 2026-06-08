import { MapData } from '../../types';

// Seeded hash functions for deterministic generation
export function getSeededRNG(seedStr: string): () => number {
  let h1 = 1779033703, h2 = 302473479, h3 = 33624537, h4 = 50249337;
  for (let i = 0, k; i < seedStr.length; i++) {
    k = seedStr.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  
  let seed = (h1 ^ h2 ^ h3 ^ h4) >>> 0;
  
  // Mulberry32
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateBackroom(seed: string): MapData {
  const width = 64;
  const height = 64;
  const rng = getSeededRNG(seed);

  // Initialize the grid with walls (1)
  const grid: number[][] = Array(height).fill(null).map(() => Array(width).fill(1));

  // 1. Generate Rooms of diverse sizes
  const rooms: { x: number; y: number; w: number; h: number }[] = [];
  const minRoomSize = 3;
  const maxRoomSize = 9; // Raised from 6 to 9 for dramatic size variance
  const numRoomsAttempt = 95; // Raised from 70 to 95 for high map density

  for (let i = 0; i < numRoomsAttempt; i++) {
    const rx = Math.floor(rng() * (width - maxRoomSize - 4)) + 2;
    const ry = Math.floor(rng() * (height - maxRoomSize - 4)) + 2;
    const rw = Math.floor(rng() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
    const rh = Math.floor(rng() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;

    // Dig room
    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) {
        grid[y][x] = 0; // Empty walkable space
      }
    }
    rooms.push({ x: rx, y: ry, w: rw, h: rh });
  }

  // 2. Connect rooms with hallways to guarantee accessibility
  for (let i = 0; i < rooms.length - 1; i++) {
    const start = rooms[i];
    const end = rooms[i + 1];

    let cx = Math.floor(start.x + start.w / 2);
    let cy = Math.floor(start.y + start.h / 2);
    const targetX = Math.floor(end.x + end.w / 2);
    const targetY = Math.floor(end.y + end.h / 2);

    // Carve horizontal then vertical
    while (cx !== targetX) {
      grid[cy][cx] = 0;
      cx += cx < targetX ? 1 : -1;
    }
    while (cy !== targetY) {
      grid[cy][cx] = 0;
      cy += cy < targetY ? 1 : -1;
    }
  }

  // Add long endless main corridors characteristic of Backrooms Level 0
  const numCorridors = 9;
  for (let i = 0; i < numCorridors; i++) {
    // Horizontal endless corridor
    const cy = Math.floor(rng() * (height - 8)) + 4;
    for (let x = 3; x < width - 3; x++) {
      grid[cy][x] = 0;
    }
    // Vertical endless corridor
    const cx = Math.floor(rng() * (width - 8)) + 4;
    for (let y = 3; y < height - 3; y++) {
      grid[y][cx] = 0;
    }
  }

  // 3. Inject Creepy Branching Alcoves & Dead ends (凹形死胡同, 隔间)
  const numAlcoves = 18;
  for (let i = 0; i < numAlcoves; i++) {
    // Pick a random starting empty tile to branch from
    let ax = Math.floor(rng() * (width - 10)) + 5;
    let ay = Math.floor(rng() * (height - 10)) + 5;
    if (grid[ay][ax] === 0) {
      const len = Math.floor(rng() * 4) + 2; // 2 to 5 cells deep
      const dir = Math.floor(rng() * 4); // 4 cardinal directions
      let dx = 0, dy = 0;
      if (dir === 0) dy = -1;
      else if (dir === 1) dy = 1;
      else if (dir === 2) dx = -1;
      else if (dir === 3) dx = 1;

      for (let step = 1; step <= len; step++) {
        const ny = ay + dy * step;
        const nx = ax + dx * step;
        if (ny > 2 && ny < height - 3 && nx > 2 && nx < width - 3) {
          grid[ny][nx] = 0; // Dig pocket of room
        }
      }
    }
  }

  // 4. Populate with diverse Column structures and Division Walls dynamically
  // We scan the map and place columns/dividers in spacious areas to keep rendering lightweight and tidy
  const pSpacing = 3;
  for (let y = 3; y < height - 3; y++) {
    for (let x = 3; x < width - 3; x++) {
      // Check if current tile is walkable and check adjacent tiles
      if (grid[y][x] === 0 && (y % pSpacing === 0 && x % pSpacing === 0)) {
        // Can we place a column or partition here? Check immediately surrounding 3x3 area is clear of solid walls to keep movement paths fluent
        let empty3x3 = true;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (grid[y + dy][x + dx] !== 0) {
              empty3x3 = false;
              break;
            }
          }
          if (!empty3x3) break;
        }

        if (empty3x3) {
          const roll = rng();
          if (roll < 0.28) {
            // Choice A: Cruciform (cross-shaped) yellow/tan pillar (3)
            grid[y][x] = 3;
          } else if (roll < 0.65) {
            // Choice B: Standard freestanding square pillar (2)
            grid[y][x] = 2;
          } else if (roll < 0.83) {
            // Choice C: Thin wall divider/partition (4) - creates wonderful low-contrast occlusion angles
            grid[y][x] = 4;
          }
        }
      }
    }
  }

  // Ensure margins of the map are thick solid walls info
  for (let x = 0; x < width; x++) {
    grid[0][x] = 1;
    grid[height - 1][x] = 1;
  }
  for (let y = 0; y < height; y++) {
    grid[y][0] = 1;
    grid[y][width - 1] = 1;
  }

  return {
    grid,
    width,
    height,
    seed,
  };
}
