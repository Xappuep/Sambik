export class ObjectPool {
  constructor(factory, initialSize = 16) {
    this.factory = factory;
    this.pool = [];
    this.active = [];
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  acquire() {
    const obj = this.pool.pop() || this.factory();
    this.active.push(obj);
    return obj;
  }

  release(obj) {
    const idx = this.active.indexOf(obj);
    if (idx >= 0) this.active.splice(idx, 1);
    obj.reset?.();
    this.pool.push(obj);
  }

  releaseAll() {
    while (this.active.length) {
      this.release(this.active[0]);
    }
  }

  updateActive(dt, ctx) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const obj = this.active[i];
      obj.update(dt, ctx);
      if (obj.dead) {
        this.release(obj);
      }
    }
  }

  forEachActive(fn) {
    for (const obj of this.active) fn(obj);
  }
}
