import {
  TimePhase,
  FIRE_RATE,
  GameState,
} from '../constants.js';
import {
  PHASE_ORDER,
  getPhaseDuration,
  getMissionConfig,
} from '../data/stages.js';

/**
 * Manages mission flow: time phases, spawning cadence, transitions, boss, bonus.
 */
export class StageDirector {
  constructor() {
    this.reset(1);
  }

  reset(mission = 1) {
    this.mission = mission;
    this.config = getMissionConfig(mission);
    this.phaseIndex = 0;
    this.phase = TimePhase.DAY;
    this.phaseElapsed = 0;
    this.rapidFire = false;
    this.rapidFireRestored = true;
    this.transitionFormationActive = false;
    this.transitionFormationCleared = false;
    this.bossActive = false;
    this.bossDefeated = false;
    this.bonusActive = false;
    this.bonusCleared = false;
    this.bonusEnemiesTotal = 0;
    this.bonusEnemiesKilled = 0;
    this.spawnTimer = 0;
    this.fw200Spawned = false;
    this.paused = false;
  }

  get fireRateMs() {
    if (this.rapidFire) return FIRE_RATE.RAPID;
    if (!this.rapidFireRestored) return FIRE_RATE.PENALTY;
    return FIRE_RATE.NORMAL;
  }

  get currentPhase() {
    return this.phase;
  }

  get phaseProgress() {
    const dur = getPhaseDuration(this.phase, this.mission);
    return Math.min(1, this.phaseElapsed / dur);
  }

  /** Blend factor 0..1 between two phases for sky palette */
  getPhaseBlend() {
    return this.phaseProgress;
  }

  update(dt, gameState) {
    if (this.paused || gameState !== GameState.PLAYING) return;

    if (this.bonusActive) return;

    if (this.bossActive && !this.bossDefeated) return;

    if (this.transitionFormationActive) return;

    this.phaseElapsed += dt;
    const duration = getPhaseDuration(this.phase, this.mission);

    if (this.phase === TimePhase.DAWN && this.phaseElapsed >= duration * 0.55 && !this.bossActive) {
      this.bossActive = true;
      return;
    }

    if (this.phaseElapsed >= duration) {
      this.startPhaseTransition();
    }
  }

  startPhaseTransition() {
    if (this.phaseIndex >= PHASE_ORDER.length - 1) return;
    this.transitionFormationActive = true;
    this.transitionFormationCleared = false;
  }

  /** Called when all formation planes destroyed */
  onFormationCleared() {
    this.transitionFormationCleared = true;
    this.rapidFire = true;
    this.rapidFireRestored = true;
    this.advancePhase();
  }

  /** Called when formation partially escaped */
  onFormationFailed() {
    this.transitionFormationCleared = false;
    this.rapidFire = false;
    this.rapidFireRestored = false;
    this.advancePhase();
  }

  advancePhase() {
    this.transitionFormationActive = false;
    this.phaseIndex++;
    if (this.phaseIndex < PHASE_ORDER.length) {
      this.phase = PHASE_ORDER[this.phaseIndex];
      this.phaseElapsed = 0;
    }
  }

  onBossDefeated() {
    this.bossDefeated = true;
    this.bossActive = false;
    this.startBonusStage(5);
  }

  startBonusStage(count) {
    this.bonusActive = true;
    this.bonusCleared = false;
    this.bonusEnemiesTotal = count;
    this.bonusEnemiesKilled = 0;
  }

  onBonusKill() {
    this.bonusEnemiesKilled++;
    if (this.bonusEnemiesKilled >= this.bonusEnemiesTotal) {
      this.bonusCleared = true;
    }
  }

  completeBonusStage() {
    this.bonusActive = false;
    this.mission++;
    this.config = getMissionConfig(this.mission);
    this.phaseIndex = 0;
    this.phase = TimePhase.DAY;
    this.phaseElapsed = 0;
    this.bossDefeated = false;
    this.bossActive = false;
    this.fw200Spawned = false;
    this.rapidFire = false;
    this.rapidFireRestored = true;
  }

  shouldSpawnAir() {
    if (this.bossActive || this.bonusActive || this.transitionFormationActive) return false;
    return true;
  }

  getDifficultyMultiplier() {
    let mult = this.config.enemySpeed;
    if (this.phase === TimePhase.SUNSET) mult *= 1.1;
    if (this.phase === TimePhase.NIGHT) mult *= 1.2;
    if (this.phase === TimePhase.DAWN) mult *= 1.15;
    return mult;
  }

  restoreRapidFireForNewMission() {
    this.rapidFireRestored = true;
    this.rapidFire = false;
  }
}
