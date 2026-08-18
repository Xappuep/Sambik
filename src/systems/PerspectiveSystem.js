import { GAME_WIDTH, GAME_HEIGHT, HORIZON_Y, GROUND_Y } from '../constants.js';

/**
 * Pseudo-3D perspective projection.
 * z: 1 = horizon (far), 0 = near camera
 */
export class PerspectiveSystem {
  constructor(options = {}) {
    this.horizonY = options.horizonY ?? HORIZON_Y;
    this.groundY = options.groundY ?? GROUND_Y;
    this.width = options.width ?? GAME_WIDTH;
    this.height = options.height ?? GAME_HEIGHT;
    this.vanishX = this.width / 2;
  }

  /** Screen Y for a given depth (0=near, 1=far) */
  depthToScreenY(z) {
    const t = 1 - clamp(z, 0, 1);
    return this.horizonY + (this.groundY - this.horizonY) * t * t;
  }

  /** Scale factor at depth */
  scaleAt(z) {
    const t = 1 - clamp(z, 0, 1);
    return 0.08 + t * 0.92;
  }

  /** Horizontal perspective offset from center lane */
  perspectiveX(xOffset, z) {
    const t = 1 - clamp(z, 0, 1);
    return this.vanishX + xOffset * t;
  }

  /** Full projection: world lane x (-1..1), depth z -> screen coords */
  project(laneX, z) {
    const scale = this.scaleAt(z);
    const screenY = this.depthToScreenY(z);
    const screenX = this.perspectiveX(laneX * (this.width * 0.45), z);
    return { x: screenX, y: screenY, scale, z };
  }

  /** Advance depth toward camera (decrease z) */
  advanceZ(z, speed, dt) {
    return z - speed * dt;
  }

  /** Wave line spacing for sea perspective */
  waveSpacing(z) {
    const t = 1 - clamp(z, 0, 1);
    return 2 + t * 14;
  }

  /** Is object past camera (should despawn) */
  isPastCamera(z) {
    return z < -0.05;
  }

  /** Is object still at horizon spawn zone */
  isAtHorizon(z) {
    return z >= 0.92;
  }

  /** Safe spawn depth near horizon */
  spawnZ() {
    return 0.95 + Math.random() * 0.04;
  }

  /** Lane X for spawn (-1 to 1) */
  spawnLane() {
    return (Math.random() - 0.5) * 1.6;
  }
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export { clamp };
