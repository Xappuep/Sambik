export class InputManager {
  constructor() {
    this.keys = {};
    this.touch = {
      up: false,
      down: false,
      left: false,
      right: false,
      fire: false,
      rocket: false,
    };
    this.pausePressed = false;
    this.startPressed = false;
    this._bound = false;
  }

  bind() {
    if (this._bound || typeof window === 'undefined') return;
    this._bound = true;

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    const touchEls = document.querySelectorAll('[data-touch]');
    touchEls.forEach((el) => {
      const action = el.dataset.touch;
      const on = () => { this.touch[action] = true; };
      const off = () => { this.touch[action] = false; };
      el.addEventListener('touchstart', (e) => { e.preventDefault(); on(); });
      el.addEventListener('touchend', (e) => { e.preventDefault(); off(); });
      el.addEventListener('mousedown', on);
      el.addEventListener('mouseup', off);
      el.addEventListener('mouseleave', off);
    });
  }

  getState() {
    const k = this.keys;
    return {
      up: k.ArrowUp || k.KeyW || k.w || k.Up || this.touch.up,
      down: k.ArrowDown || k.KeyS || k.s || k.Down || this.touch.down,
      left: k.ArrowLeft || k.KeyA || k.a || k.Left || this.touch.left,
      right: k.ArrowRight || k.KeyD || k.d || k.Right || this.touch.right,
      fire: k.Space || k.KeyZ || k.z || this.touch.fire,
      rocket: k.KeyX || k.ControlLeft || k.ControlRight || this.touch.rocket,
      pause: k.KeyP || k.Escape,
      start: k.Enter || k.Space || k.KeyZ,
    };
  }

  consumeStart() {
    const s = this.getState().start;
    if (s && !this._lastStart) {
      this._lastStart = true;
      return true;
    }
    if (!s) this._lastStart = false;
    return false;
  }

  consumePause() {
    const p = this.getState().pause;
    if (p && !this._lastPause) {
      this._lastPause = true;
      return true;
    }
    if (!p) this._lastPause = false;
    return false;
  }
}
