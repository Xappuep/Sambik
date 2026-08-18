import { TimePhase } from '../constants.js';

/** Phase duration in milliseconds (shortened for playability; scales with mission) */
export function getPhaseDuration(phase, mission) {
  const base = {
    [TimePhase.DAY]: 28000,
    [TimePhase.SUNSET]: 22000,
    [TimePhase.NIGHT]: 24000,
    [TimePhase.DAWN]: 26000,
  };
  const scale = 1 + (mission - 1) * 0.08;
  return Math.floor((base[phase] || 20000) * scale);
}

export const PHASE_ORDER = [
  TimePhase.DAY,
  TimePhase.SUNSET,
  TimePhase.NIGHT,
  TimePhase.DAWN,
];

export function getMissionConfig(mission) {
  const m = Math.max(1, mission);
  return {
    mission: m,
    bf109Rate: 0.35 + m * 0.12,
    fw190Rate: m >= 2 ? 0.08 + m * 0.04 : 0,
    fw200Rate: m >= 2 ? 0.015 + m * 0.008 : 0.008,
    shipRate: 0.06 + m * 0.03,
    boatRate: 0.1 + m * 0.04,
    subRate: 0.04 + m * 0.02,
    aaRate: 0.05 + m * 0.025,
    enemyFireChance: 0.08 + m * 0.04,
    enemySpeed: 1 + (m - 1) * 0.12,
    maxAirEnemies: 3 + m,
  };
}
