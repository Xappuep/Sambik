import { FW200_ENGINES, ENEMY_SCORES } from '../data/enemies.js';
import { EngineState } from '../constants.js';

export class Fw200 {
  constructor(perspective) {
    this.perspective = perspective;
    this.type = 'fw200';
    this.isAir = true;
    this.rocketVulnerable = false;
    this.z = perspective.spawnZ();
    this.laneX = 0;
    this.dead = false;
    this.speed = 0.08;
    this.score = ENEMY_SCORES.fw200;
    this.engines = {};
    for (const key of FW200_ENGINES) {
      this.engines[key] = EngineState.INTACT;
    }
    this.falling = false;
    this.fallTimer = 0;
  }

  get destroyedEngineCount() {
    return FW200_ENGINES.filter((k) => this.engines[k] === EngineState.DESTROYED).length;
  }

  get allEnginesDestroyed() {
    return this.destroyedEngineCount >= 4;
  }

  getHitbox() {
    const p = this.perspective.project(this.laneX, this.z);
    const w = 48 * p.scale;
    const h = 20 * p.scale;
    return { x: p.x - w / 2, y: p.y - h / 2, w, h };
  }

  getEngineHitboxes() {
    const p = this.perspective.project(this.laneX, this.z);
    const w = 48 * p.scale;
    const offsets = [
      ['engineLeftOuter', -0.42],
      ['engineLeftInner', -0.14],
      ['engineRightInner', 0.14],
      ['engineRightOuter', 0.42],
    ];
    return offsets.map(([key, off]) => ({
      key,
      state: this.engines[key],
      rect: {
        x: p.x + off * w - 4 * p.scale,
        y: p.y - 2 * p.scale,
        w: 8 * p.scale,
        h: 8 * p.scale,
      },
    }));
  }

  checkHit(bullet) {
    if (this.dead || this.allEnginesDestroyed) return null;
    for (const eng of this.getEngineHitboxes()) {
      if (eng.state === EngineState.DESTROYED) continue;
      const r = eng.rect;
      if (bullet.x >= r.x && bullet.x <= r.x + r.w && bullet.y >= r.y && bullet.y <= r.y + r.h) {
        this.damageEngine(eng.key);
        return { engine: eng.key, score: ENEMY_SCORES.fw200Engine };
      }
    }
    return null;
  }

  damageEngine(key) {
    const order = [EngineState.INTACT, EngineState.DAMAGED, EngineState.BURNING, EngineState.DESTROYED];
    const idx = order.indexOf(this.engines[key]);
    if (idx < order.length - 1) {
      this.engines[key] = order[idx + 1];
    }
    if (this.allEnginesDestroyed) {
      this.falling = true;
      this.fallTimer = 0;
    }
  }

  update(dt, ctx) {
    if (this.dead) return;

    if (this.falling) {
      this.fallTimer += dt;
      this.z -= 0.15 * dt;
      if (this.fallTimer > 1.5) {
        this.dead = true;
        ctx.onFw200Destroyed?.(this);
      }
      return;
    }

    this.z = this.perspective.advanceZ(this.z, this.speed, dt);

    if (this.perspective.isPastCamera(this.z)) {
      this.dead = true;
    }
  }

  draw(ctx, sprites) {
    if (this.dead) return;
    const p = this.perspective.project(this.laneX, this.z);
    const w = 48;
    const h = 24;
    const sprite = sprites.getFw200(this.engines);
    ctx.drawImage(sprite, p.x - (w * p.scale) / 2, p.y - (h * p.scale) / 2, w * p.scale, h * p.scale);
  }
}
