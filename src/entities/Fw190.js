import { AirEnemy } from './AirEnemy.js';
import { ENEMY_SCORES } from '../data/enemies.js';

export class Fw190 extends AirEnemy {
  constructor(perspective, director) {
    super(perspective, {
      type: 'fw190',
      score: ENEMY_SCORES.fw190,
      speed: 0.32,
      laneDrift: (Math.random() - 0.5) * 0.55,
    });
    this.director = director;
    this.fireTimer = 1 + Math.random() * 2;
    this.arcPhase = Math.random() * Math.PI * 2;
  }

  update(dt, ctx) {
    this.arcPhase += dt * 2;
    this.laneX += Math.sin(this.arcPhase) * 0.4 * dt;
    super.update(dt, ctx);

    if (this.dead) return;

    this.fireTimer -= dt;
    const fireChance = (this.director?.config?.enemyFireChance ?? 0.1) * 1.5;
    if (this.fireTimer <= 0 && this.z < 0.55) {
      this.fireTimer = 0.8 + Math.random() * 1.2;
      if (Math.random() < fireChance) ctx.onEnemyFire?.(this);
    }
  }
}
