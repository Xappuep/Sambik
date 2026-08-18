import { SubmarineState } from '../constants.js';
import { ENEMY_SCORES } from '../data/enemies.js';

export class Submarine {
  constructor(perspective) {
    this.perspective = perspective;
    this.type = 'submarine';
    this.isAir = false;
    this.rocketVulnerable = true;
    this.z = perspective.spawnZ();
    this.laneX = perspective.spawnLane() * 0.5;
    this.speed = 0.1;
    this.dead = false;
    this.score = ENEMY_SCORES.submarine;
    this.state = SubmarineState.SUBMERGED;
    this.stateTimer = 2 + Math.random() * 2;
  }

  get surfaced() {
    return this.state === SubmarineState.SURFACED || this.state === SubmarineState.SURFACING;
  }

  getHitbox() {
    if (!this.surfaced) return null;
    const p = this.perspective.project(this.laneX, this.z);
    const w = 20 * p.scale;
    const h = 8 * p.scale;
    return { x: p.x - w / 2, y: p.y - h / 2, w, h };
  }

  checkHit() {
    return null;
  }

  update(dt) {
    if (this.dead) return;
    this.z = this.perspective.advanceZ(this.z, this.speed, dt);
    this.stateTimer -= dt;

    if (this.stateTimer <= 0) {
      this.advanceState();
    }

    if (this.perspective.isPastCamera(this.z)) this.dead = true;
  }

  advanceState() {
    switch (this.state) {
      case SubmarineState.SUBMERGED:
        this.state = SubmarineState.SURFACING;
        this.stateTimer = 1.2;
        break;
      case SubmarineState.SURFACING:
        this.state = SubmarineState.SURFACED;
        this.stateTimer = 2.5 + Math.random() * 2;
        break;
      case SubmarineState.SURFACED:
        this.state = SubmarineState.DIVING;
        this.stateTimer = 1;
        break;
      case SubmarineState.DIVING:
        this.state = SubmarineState.SUBMERGED;
        this.stateTimer = 3 + Math.random() * 3;
        break;
      default:
        break;
    }
  }

  onRocketHit() {
    if (!this.surfaced) return null;
    this.dead = true;
    return { score: this.score, explosion: 'medium', splash: true };
  }

  draw(ctx, sprites) {
    if (this.dead) return;
    const p = this.perspective.project(this.laneX, this.z);
    const w = 20;
    const h = 10;
    ctx.drawImage(
      sprites.getSub(this.surfaced),
      p.x - (w * p.scale) / 2,
      p.y - (h * p.scale) / 2,
      w * p.scale,
      h * p.scale
    );
  }
}
