import { SpriteFactory } from '../graphics/SpriteFactory.js';

export class SpriteCache {
  constructor() {
    this.cache = new Map();
  }

  get(key, w, h, drawFn) {
    const id = `${key}_${w}x${h}`;
    if (!this.cache.has(id)) {
      this.cache.set(id, drawFn());
    }
    return this.cache.get(id);
  }

  getIl2(variant = 'normal') {
    return this.get(`il2_${variant}`, 32, 28, () => SpriteFactory.getSprite('il2', 32, 28, { variant }));
  }

  getBf109(formation = false) {
    return this.get(`bf109_${formation}`, 14, 14, () => SpriteFactory.getSprite('bf109', 14, 14, { formation }));
  }

  getFw190() {
    return this.get('fw190', 16, 14, () => SpriteFactory.getSprite('fw190', 16, 14));
  }

  getFw200(engineStates) {
    const key = JSON.stringify(engineStates);
    return this.get(`fw200_${key}`, 48, 24, () => SpriteFactory.getSprite('fw200', 48, 24, { engineStates }));
  }

  getShip() {
    return this.get('ship', 28, 16, () => SpriteFactory.getSprite('ship', 28, 16));
  }

  getSub(surfaced) {
    return this.get(`sub_${surfaced}`, 20, 10, () => SpriteFactory.getSprite('sub', 20, 10, { surfaced }));
  }

  getExplosion(frame, size) {
    const w = size === 'large' ? 32 : size === 'medium' ? 24 : 16;
    return this.get(`exp_${size}_${frame}`, w, w, () => {
      const c = SpriteFactory.createCanvas(w, w);
      const ctx = c.getContext('2d');
      SpriteFactory.drawExplosionFrame(ctx, w, w, frame, size);
      return c;
    });
  }
}
