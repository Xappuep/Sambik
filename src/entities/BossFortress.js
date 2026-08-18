import { ENEMY_SCORES } from '../data/enemies.js';
import { GAME_WIDTH } from '../constants.js';

export class BossFortress {
  constructor(perspective) {
    this.perspective = perspective;
    this.type = 'boss';
    this.isAir = false;
    this.rocketVulnerable = true;
    this.z = 0.75;
    this.laneX = 0;
    this.dead = false;
    this.score = ENEMY_SCORES.boss;
    this.turretX = 0;
    this.turretDir = 1;
    this.turretSpeed = 0.35;
    this.fireTimer = 1.5;
    this.width = 80;
  }

  getHitbox() {
    return null;
  }

  getTurretHitbox() {
    const p = this.perspective.project(this.laneX, this.z);
    const tx = p.x + this.turretX * 30 * p.scale;
    return {
      x: tx - 8 * p.scale,
      y: p.y - 4 * p.scale,
      w: 16 * p.scale,
      h: 12 * p.scale,
    };
  }

  checkHit() {
    return null;
  }

  checkRocketHit(rocket) {
    const tb = this.getTurretHitbox();
    if (
      rocket.x >= tb.x && rocket.x <= tb.x + tb.w &&
      rocket.y >= tb.y && rocket.y <= tb.y + tb.h
    ) {
      this.dead = true;
      return { score: this.score, explosion: 'large' };
    }
    return null;
  }

  update(dt, ctx) {
    if (this.dead) return;

    this.turretX += this.turretDir * this.turretSpeed * dt;
    if (this.turretX > 1) { this.turretX = 1; this.turretDir = -1; }
    if (this.turretX < -1) { this.turretX = -1; this.turretDir = 1; }

    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.fireTimer = 1.2 + Math.random() * 0.8;
      ctx.onBossFire?.(this);
    }
  }

  onRocketHit(rocket) {
    return this.checkRocketHit(rocket);
  }

  draw(ctx) {
    if (this.dead) return;
    const p = this.perspective.project(this.laneX, this.z);
    const scale = p.scale;

    // Fortress structure
    ctx.fillStyle = '#585048';
    ctx.fillRect(p.x - 40 * scale, p.y - 10 * scale, 80 * scale, 20 * scale);
    ctx.fillStyle = '#484038';
    ctx.fillRect(p.x - 30 * scale, p.y - 18 * scale, 60 * scale, 10 * scale);

    // Turret
    const tx = p.x + this.turretX * 30 * scale;
    ctx.fillStyle = '#383028';
    ctx.fillRect(tx - 6 * scale, p.y - 14 * scale, 12 * scale, 8 * scale);
    ctx.fillStyle = '#282018';
    ctx.fillRect(tx - 2 * scale, p.y - 18 * scale, 4 * scale, 6 * scale);
  }
}
