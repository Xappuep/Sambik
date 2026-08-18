import { PALETTE } from '../data/palette.js';

/** Programmatic 8-bit sprite generation */
export class SpriteFactory {
  static createCanvas(w, h) {
    // Always use HTMLCanvasElement in browser — OffscreenCanvas
    // can break drawImage when opened from file:// or older engines.
    if (typeof document !== 'undefined') {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      return c;
    }
    if (typeof OffscreenCanvas !== 'undefined') {
      return new OffscreenCanvas(w, h);
    }
    return null;
  }

  static pixel(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  }

  static drawIl2(ctx, w, h, variant = 'normal') {
    const g = PALETTE.il2Green;
    const b = PALETTE.il2Brown;
    const d = PALETTE.il2Dark;
    const r = PALETTE.redStar;

    ctx.clearRect(0, 0, w, h);
    const bank = variant === 'bankLeft' ? -2 : variant === 'bankRight' ? 2 : 0;
    const pitch = variant === 'climb' ? -2 : variant === 'dive' ? 2 : 0;

    // Fuselage
    for (let y = 4; y < h - 6; y++) {
      const t = (y - 4) / (h - 10);
      const half = Math.floor(3 + t * 5);
      for (let x = w / 2 - half; x <= w / 2 + half; x++) {
        this.pixel(ctx, Math.floor(x) + bank, y + pitch, y < h / 2 ? g : b);
      }
    }
    // Wings
    for (let x = 2; x < w - 2; x++) {
      this.pixel(ctx, x + bank, Math.floor(h * 0.55) + pitch, g);
      this.pixel(ctx, x + bank, Math.floor(h * 0.55) + 1 + pitch, d);
    }
    // Tail
    for (let y = 2; y < 10; y++) {
      this.pixel(ctx, Math.floor(w / 2) + bank, y + pitch, d);
    }
    // Propeller blur
    this.pixel(ctx, Math.floor(w / 2) - 1 + bank, h - 3 + pitch, '#888');
    this.pixel(ctx, Math.floor(w / 2) + bank, h - 3 + pitch, '#ccc');
    this.pixel(ctx, Math.floor(w / 2) + 1 + bank, h - 3 + pitch, '#888');
    // Stars
    this.pixel(ctx, Math.floor(w * 0.35) + bank, Math.floor(h * 0.45) + pitch, r);
    this.pixel(ctx, Math.floor(w * 0.65) + bank, Math.floor(h * 0.45) + pitch, r);
    // Cockpit
    this.pixel(ctx, Math.floor(w / 2) + bank, Math.floor(h * 0.35) + pitch, '#284848');
  }

  static drawBf109(ctx, w, h, formation = false) {
    const c = formation ? PALETTE.yellowNose : PALETTE.germanGrey;
    ctx.clearRect(0, 0, w, h);
    for (let y = 0; y < h; y++) {
      const half = Math.max(1, Math.floor((h - y) * 0.25));
      for (let x = Math.floor(w / 2) - half; x <= Math.floor(w / 2) + half; x++) {
        this.pixel(ctx, x, y, y < 2 ? c : PALETTE.germanGreen);
      }
    }
    // Cross
    this.pixel(ctx, Math.floor(w / 2), Math.floor(h * 0.4), PALETTE.crossWhite);
    this.pixel(ctx, Math.floor(w / 2) - 1, Math.floor(h * 0.4), PALETTE.crossBlack);
    this.pixel(ctx, Math.floor(w / 2) + 1, Math.floor(h * 0.4), PALETTE.crossBlack);
  }

  static drawFw190(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    for (let y = 0; y < h; y++) {
      const half = Math.max(1, Math.floor((h - y) * 0.3));
      for (let x = Math.floor(w / 2) - half; x <= Math.floor(w / 2) + half; x++) {
        this.pixel(ctx, x, y, PALETTE.germanGrey);
      }
    }
    this.pixel(ctx, 1, Math.floor(h * 0.3), PALETTE.yellowNose);
  }

  static drawFw200(ctx, w, h, engineStates = {}) {
    ctx.clearRect(0, 0, w, h);
    // Body
    for (let x = 4; x < w - 4; x++) {
      for (let y = Math.floor(h * 0.35); y < Math.floor(h * 0.55); y++) {
        this.pixel(ctx, x, y, PALETTE.germanGrey);
      }
    }
    // Wings
    for (let x = 0; x < w; x++) {
      this.pixel(ctx, x, Math.floor(h * 0.45), PALETTE.germanGreen);
    }
    // Tail
    for (let y = 0; y < Math.floor(h * 0.35); y++) {
      this.pixel(ctx, Math.floor(w / 2), y, PALETTE.germanGrey);
    }
    const engines = [
      ['engineLeftOuter', 4],
      ['engineLeftInner', Math.floor(w * 0.28)],
      ['engineRightInner', Math.floor(w * 0.72)],
      ['engineRightOuter', w - 5],
    ];
    for (const [key, ex] of engines) {
      const st = engineStates[key] || 'intact';
      const color = st === 'destroyed' ? PALETTE.explosionDark
        : st === 'burning' ? PALETTE.explosionOrange
        : st === 'damaged' ? PALETTE.smoke
        : PALETTE.il2Dark;
      for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          this.pixel(ctx, ex + dx, Math.floor(h * 0.5) + dy, color);
        }
      }
    }
  }

  static drawShip(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    for (let x = 0; x < w; x++) {
      const y = Math.floor(h * 0.5 + Math.abs(x - w / 2) * 0.15);
      for (let yy = y; yy < h; yy++) {
        this.pixel(ctx, x, yy, PALETTE.germanGrey);
      }
    }
    this.pixel(ctx, Math.floor(w / 2), Math.floor(h * 0.35), PALETTE.crossWhite);
  }

  static drawSubmarine(ctx, w, h, surfaced) {
    ctx.clearRect(0, 0, w, h);
    if (!surfaced) return;
    for (let x = 2; x < w - 2; x++) {
      this.pixel(ctx, x, Math.floor(h * 0.6), PALETTE.germanGrey);
      this.pixel(ctx, x, Math.floor(h * 0.6) + 1, PALETTE.germanGrey);
    }
    this.pixel(ctx, Math.floor(w / 2), Math.floor(h * 0.45), PALETTE.germanGrey);
  }

  static drawExplosionFrame(ctx, w, h, frame, size = 'small') {
    ctx.clearRect(0, 0, w, h);
    const colors = [
      PALETTE.explosionWhite,
      PALETTE.explosionYellow,
      PALETTE.explosionOrange,
      PALETTE.explosionRed,
      PALETTE.explosionDark,
      PALETTE.smoke,
      PALETTE.smoke,
      PALETTE.explosionDark,
    ];
    const color = colors[frame % colors.length];
    const radius = size === 'large' ? 6 + frame : size === 'medium' ? 4 + frame : 2 + frame;
    const cx = w / 2;
    const cy = h / 2;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= radius * radius) {
          this.pixel(ctx, x, y, color);
        }
      }
    }
  }

  static getSprite(name, w, h, opts = {}) {
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');
    switch (name) {
      case 'il2': this.drawIl2(ctx, w, h, opts.variant); break;
      case 'bf109': this.drawBf109(ctx, w, h, opts.formation); break;
      case 'fw190': this.drawFw190(ctx, w, h); break;
      case 'fw200': this.drawFw200(ctx, w, h, opts.engineStates); break;
      case 'ship': this.drawShip(ctx, w, h); break;
      case 'sub': this.drawSubmarine(ctx, w, h, opts.surfaced); break;
      default: break;
    }
    return canvas;
  }
}
