import { ENEMY_SCORES } from '../data/enemies.js';

export class SurfaceEnemy {
  constructor(perspective, config) {
    this.perspective = perspective;
    this.type = config.type;
    this.isAir = false;
    this.rocketVulnerable = config.rocketVulnerable ?? true;
    this.z = perspective.spawnZ();
    this.laneX = config.laneX ?? perspective.spawnLane() * 0.7;
    this.speed = config.speed ?? 0.14;
    this.dead = false;
    this.score = config.score ?? 400;
    this.vx = config.vx ?? 0;
  }

  static createBoat(perspective) {
    const dir = Math.random() < 0.5 ? -1 : 1;
    return new SurfaceEnemy(perspective, {
      type: 'boat',
      score: ENEMY_SCORES.boat,
      speed: 0.2,
      laneX: dir < 0 ? 0.8 : -0.8,
      vx: dir * 0.5,
      rocketVulnerable: true,
    });
  }

  static createBattery(perspective) {
    return new SurfaceEnemy(perspective, {
      type: 'battery',
      score: ENEMY_SCORES.battery,
      speed: 0.08,
      rocketVulnerable: true,
    });
  }

  getHitbox() {
    const p = this.perspective.project(this.laneX, this.z);
    const w = (this.type === 'boat' ? 12 : 20) * p.scale;
    const h = (this.type === 'boat' ? 6 : 14) * p.scale;
    return { x: p.x - w / 2, y: p.y - h / 2, w, h };
  }

  checkHit() {
    return null;
  }

  update(dt, ctx) {
    if (this.dead) return;
    this.laneX += this.vx * dt;
    this.z = this.perspective.advanceZ(this.z, this.speed, dt);

    if (Math.abs(this.laneX) > 1.2) this.dead = true;
    if (this.perspective.isPastCamera(this.z)) this.dead = true;
  }

  onRocketHit() {
    this.dead = true;
    return { score: this.score, explosion: this.type === 'battery' ? 'medium' : 'small' };
  }

  draw(ctx) {
    if (this.dead) return;
    const p = this.perspective.project(this.laneX, this.z);
    const scale = p.scale;
    ctx.fillStyle = this.type === 'boat' ? '#585848' : '#686058';
    const w = this.type === 'boat' ? 12 : 20;
    const h = this.type === 'boat' ? 6 : 14;
    ctx.fillRect(p.x - (w * scale) / 2, p.y - (h * scale) / 2, w * scale, h * scale);
    if (this.type === 'battery') {
      ctx.fillStyle = '#383028';
      ctx.fillRect(p.x - 2 * scale, p.y - 6 * scale, 4 * scale, 6 * scale);
    }
  }
}
