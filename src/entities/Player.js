import { PLAYER_BASE_Y, GAME_WIDTH, ROCKET_COOLDOWN_MS, RESPAWN_INVULN_MS } from '../constants.js';

export class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = GAME_WIDTH / 2;
    this.y = PLAYER_BASE_Y;
    this.vx = 0;
    this.vy = 0;
    this.speed = 88;
    this.dead = false;
    this.invulnerable = false;
    this.invulnTimer = 0;
    this.variant = 'normal';
    this.gunCooldown = 0;
    this.rocketCooldown = 0;
    this.recoil = 0;
    this.width = 32;
    this.height = 28;
    this.hitbox = { x: 0, y: 0, w: 18, h: 14 };
    this.lives = 3;
  }

  updateHitbox() {
    this.hitbox.x = this.x - this.hitbox.w / 2;
    this.hitbox.y = this.y - this.hitbox.h / 2;
  }

  update(dt, input, bounds) {
    if (this.dead) return;

    if (this.invulnTimer > 0) {
      this.invulnTimer -= dt;
      if (this.invulnTimer <= 0) this.invulnerable = false;
    }

    let dx = 0;
    let dy = 0;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;

    this.vx = dx * this.speed;
    this.vy = dy * this.speed * 0.85;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const margin = 16;
    this.x = Math.max(margin, Math.min(bounds.width - margin, this.x));
    this.y = Math.max(bounds.horizonY + 30, Math.min(bounds.groundY - 8, this.y));

    if (dx < 0) this.variant = 'bankLeft';
    else if (dx > 0) this.variant = 'bankRight';
    else if (dy < 0) this.variant = 'climb';
    else if (dy > 0) this.variant = 'dive';
    else this.variant = 'normal';

    if (this.gunCooldown > 0) this.gunCooldown -= dt;
    if (this.rocketCooldown > 0) this.rocketCooldown -= dt;
    if (this.recoil > 0) this.recoil -= dt * 4;

    this.updateHitbox();
  }

  canFireGun(fireRateMs) {
    return this.gunCooldown <= 0 && !this.dead;
  }

  fireGun(fireRateMs) {
    this.gunCooldown = fireRateMs;
    this.recoil = 1;
    return {
      x: this.x,
      y: this.y - 8,
      vx: 0,
      vy: -320,
      friendly: true,
      type: 'gun',
    };
  }

  canFireRocket() {
    return this.rocketCooldown <= 0 && !this.dead;
  }

  fireRocket() {
    this.rocketCooldown = ROCKET_COOLDOWN_MS;
    return {
      x: this.x,
      y: this.y - 4,
      vx: 0,
      vy: -120,
      vz: -0.45,
      z: 0.1,
      friendly: true,
      type: 'rocket',
    };
  }

  kill() {
    this.dead = true;
  }

  respawn() {
    this.dead = false;
    this.x = GAME_WIDTH / 2;
    this.y = PLAYER_BASE_Y;
    this.invulnerable = true;
    this.invulnTimer = RESPAWN_INVULN_MS;
    this.variant = 'normal';
  }

  addLife() {
    this.lives++;
  }

  loseLife() {
    this.lives = Math.max(0, this.lives - 1);
  }
}
