import { ENEMY_SCORES } from '../data/enemies.js';

export class AirEnemy {
  constructor(perspective, config) {
    this.perspective = perspective;
    this.type = config.type;
    this.isAir = true;
    this.rocketVulnerable = false;
    this.z = perspective.spawnZ();
    this.laneX = config.laneDrift !== undefined
      ? config.laneDrift
      : perspective.spawnLane();
    this.laneDrift = config.laneDrift ?? (Math.random() - 0.5) * 0.2;
    this.speed = config.speed ?? 0.25;
    this.score = config.score ?? 500;
    this.dead = false;
    this.formation = config.formation || false;
    this.falling = false;
    this.fallTimer = 0;
    this.fallSpin = 0;
    this.passive = false;
    this.escaped = false;
    this.hp = 1;
  }

  getHitbox() {
    const p = this.perspective.project(this.laneX, this.z);
    const size = this.type === 'fw190' ? 14 : 12;
    const s = size * p.scale;
    return { x: p.x - s / 2, y: p.y - s / 2, w: s, h: s };
  }

  checkHit(bullet) {
    if (this.dead || this.falling) return null;
    const hb = this.getHitbox();
    if (bullet.x >= hb.x && bullet.x <= hb.x + hb.w && bullet.y >= hb.y && bullet.y <= hb.y + hb.h) {
      this.startFall();
      return { killed: true, score: this.score };
    }
    return null;
  }

  startFall() {
    this.falling = true;
    this.fallTimer = 0;
    this.fallSpin = (Math.random() - 0.5) * 4;
  }

  update(dt, ctx) {
    if (this.dead) return;

    if (this.falling) {
      this.fallTimer += dt;
      this.z -= 0.2 * dt;
      this.laneX += this.fallSpin * dt * 0.1;
      if (this.fallTimer > 2 || this.z < -0.1) {
        this.dead = true;
        ctx.onEnemyDestroyed?.(this, this.fallTimer < 0.5 ? 'near' : 'far');
      }
      return;
    }

    this.laneX += this.laneDrift * dt * 0.15;
    this.z = this.perspective.advanceZ(this.z, this.speed, dt);

    if (this.perspective.isPastCamera(this.z)) {
      this.dead = true;
    }
  }

  draw(ctx, sprites) {
    if (this.dead) return;
    const p = this.perspective.project(this.laneX, this.z);
    const w = this.type === 'fw190' ? 16 : 14;
    const h = 14;
    const sprite = this.type === 'fw190'
      ? sprites.getFw190()
      : sprites.getBf109(this.formation);
    ctx.drawImage(sprite, p.x - (w * p.scale) / 2, p.y - (h * p.scale) / 2, w * p.scale, h * p.scale);
  }
}
