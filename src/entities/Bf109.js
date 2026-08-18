import { AirEnemy } from './AirEnemy.js';
import { ENEMY_SCORES } from '../data/enemies.js';

export class Bf109 extends AirEnemy {
  constructor(perspective, director, opts = {}) {
    super(perspective, {
      type: 'bf109',
      score: ENEMY_SCORES.bf109,
      speed: 0.22,
      laneDrift: (Math.random() - 0.5) * 0.3,
      formation: opts.formation || false,
      bonus: opts.bonus || false,
      index: opts.index ?? 0,
      total: opts.total ?? 1,
    });
    this.director = director;
    this.passive = opts.bonus || false;
    this.fireTimer = 2 + Math.random() * 3;
    this.escaped = false;

    if (opts.formation) {
      this.z = 0.88 + opts.index * 0.02;
      this.laneX = -0.6 + (opts.index / Math.max(1, opts.total - 1)) * 1.2;
      this.passive = true;
    }
  }

  update(dt, ctx) {
    super.update(dt, ctx);

    if (this.formation && this.perspective.isPastCamera(this.z) && !this.dead) {
      this.escaped = true;
      this.dead = true;
    }

    if (this.passive || this.dead) return;

    this.fireTimer -= dt;
    const fireChance = this.director?.config?.enemyFireChance ?? 0.1;
    if (this.fireTimer <= 0 && this.z < 0.6 && Math.random() < fireChance * 0.5) {
      this.fireTimer = 1.5 + Math.random() * 2;
      ctx.onEnemyFire?.(this);
    }
  }
}
