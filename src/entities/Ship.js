import { ENEMY_SCORES } from '../data/enemies.js';

export class Ship {
  constructor(perspective) {
    this.perspective = perspective;
    this.type = 'ship';
    this.isAir = false;
    this.rocketVulnerable = true;
    this.z = perspective.spawnZ();
    this.laneX = perspective.spawnLane() * 0.6;
    this.speed = 0.12;
    this.dead = false;
    this.score = ENEMY_SCORES.ship;
    this.fireTimer = 3 + Math.random() * 4;
    this.shoots = Math.random() < 0.4;
  }

  getHitbox() {
    const p = this.perspective.project(this.laneX, this.z);
    const w = 28 * p.scale;
    const h = 16 * p.scale;
    return { x: p.x - w / 2, y: p.y - h / 2, w, h };
  }

  checkHit(bullet) {
    return null;
  }

  checkRocket() {
    return true;
  }

  update(dt, ctx) {
    if (this.dead) return;
    this.z = this.perspective.advanceZ(this.z, this.speed, dt);

    if (this.shoots && this.z < 0.5) {
      this.fireTimer -= dt;
      if (this.fireTimer <= 0) {
        this.fireTimer = 2 + Math.random() * 2;
        ctx.onSurfaceFire?.(this);
      }
    }

    if (this.perspective.isPastCamera(this.z)) this.dead = true;
  }

  onRocketHit() {
    this.dead = true;
    return { score: this.score, explosion: 'medium' };
  }

  draw(ctx, sprites) {
    if (this.dead) return;
    const p = this.perspective.project(this.laneX, this.z);
    const w = 28;
    const h = 16;
    ctx.drawImage(sprites.getShip(), p.x - (w * p.scale) / 2, p.y - (h * p.scale) / 2, w * p.scale, h * p.scale);
  }
}
