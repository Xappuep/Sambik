export class Bullet {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.active = false;
    this.friendly = true;
    this.type = 'gun';
    this.explosive = false;
    this.exploded = false;
    this.blastRadius = 0;
    this.dead = false;
    this.ttl = 2;
  }

  init(data) {
    Object.assign(this, data, { active: true, dead: false });
    this.ttl = 2;
    this.explosive = data.explosive || false;
    this.exploded = false;
  }

  update(dt, bounds) {
    if (!this.active) {
      this.dead = true;
      return;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.ttl -= dt;

    if (this.explosive && !this.exploded && this.ttl < 1.2) {
      this.exploded = true;
      this.blastRadius = 18;
      this.vx = 0;
      this.vy = 0;
      this.ttl = 0.3;
    }

    if (this.ttl <= 0 || this.y < -10 || this.y > bounds.height + 10) {
      this.active = false;
      this.dead = true;
    }
  }
}

export class Rocket {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.vz = -0.4;
    this.z = 0.1;
    this.active = false;
    this.friendly = true;
    this.dead = false;
    this.ttl = 4;
  }

  init(data) {
    Object.assign(this, data, { active: true, dead: false });
    this.ttl = 4;
  }

  update(dt, perspective) {
    if (!this.active) {
      this.dead = true;
      return;
    }
    this.z = perspective.advanceZ(this.z, -this.vz, dt);
    const p = perspective.project(0, this.z);
    this.y = p.y - 20 * (1 - this.z);
    this.x += this.vx * dt;
    this.ttl -= dt;

    if (this.ttl <= 0 || perspective.isPastCamera(this.z + 0.1)) {
      this.active = false;
      this.dead = true;
    }
  }
}

export class Explosion {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.frame = 0;
    this.maxFrames = 6;
    this.size = 'small';
    this.active = false;
    this.dead = false;
    this.timer = 0;
    this.frameDuration = 0.08;
  }

  init(x, y, size = 'small') {
    this.x = x;
    this.y = y;
    this.size = size;
    this.frame = 0;
    this.timer = 0;
    this.maxFrames = size === 'large' ? 8 : size === 'medium' ? 6 : 4;
    this.active = true;
    this.dead = false;
  }

  update(dt) {
    if (!this.active) {
      this.dead = true;
      return;
    }
    this.timer += dt;
    if (this.timer >= this.frameDuration) {
      this.timer = 0;
      this.frame++;
      if (this.frame >= this.maxFrames) {
        this.active = false;
        this.dead = true;
      }
    }
  }
}
