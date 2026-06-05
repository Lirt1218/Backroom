export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
}

export interface GameSettings {
  soundEnabled: boolean;
  cameraBobbing: boolean;
  vhsEffects: boolean;
  mouseSensitivity: number;
  fov: number;
  language?: 'zh' | 'en';
}

export interface MapData {
  grid: number[][]; // 2D array representing the map (0 = empty, 1 = wall, 2 = column, 3 = light/start)
  width: number;
  height: number;
  seed: string;
}
