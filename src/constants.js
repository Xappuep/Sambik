/** @typedef {'TITLE'|'PLAYING'|'PLAYER_DEAD'|'STAGE_CLEAR'|'BONUS'|'PAUSED'|'GAME_OVER'} GameState */
/** @typedef {'DAY'|'SUNSET'|'NIGHT'|'DAWN'} TimePhase */

export const GAME_TITLE = 'ИЛ-2: НЕБЕСНЫЙ УДАР';
export const PROJECT_NAME = 'sky-destroyer';

export const GAME_WIDTH = 256;
export const GAME_HEIGHT = 240;

export const HORIZON_Y = 72;
export const GROUND_Y = 200;
export const PLAYER_BASE_Y = 192;

export const INITIAL_LIVES = 3;
export const RESPAWN_INVULN_MS = 2200;
export const ROCKET_COOLDOWN_MS = 900;

export const HIGH_SCORE_KEY = 'skyDestroyerHighScore';

export const GameState = Object.freeze({
  TITLE: 'TITLE',
  PLAYING: 'PLAYING',
  PLAYER_DEAD: 'PLAYER_DEAD',
  STAGE_CLEAR: 'STAGE_CLEAR',
  BONUS: 'BONUS',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
});

export const TimePhase = Object.freeze({
  DAY: 'DAY',
  SUNSET: 'SUNSET',
  NIGHT: 'NIGHT',
  DAWN: 'DAWN',
});

export const SubmarineState = Object.freeze({
  SUBMERGED: 'SUBMERGED',
  SURFACING: 'SURFACING',
  SURFACED: 'SURFACED',
  DIVING: 'DIVING',
});

export const EngineState = Object.freeze({
  INTACT: 'intact',
  DAMAGED: 'damaged',
  BURNING: 'burning',
  DESTROYED: 'destroyed',
});

export const FIRE_RATE = Object.freeze({
  NORMAL: 120,
  RAPID: 55,
  PENALTY: 200,
});
