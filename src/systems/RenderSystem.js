import { PALETTE } from '../data/palette.js';
import { TimePhase, GAME_WIDTH, GAME_HEIGHT, HORIZON_Y, GROUND_Y } from '../constants.js';
import { SpriteCache } from '../graphics/SpriteCache.js';

function lerpColor(a, b, t) {
  const parse = (hex) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const ca = parse(a);
  const cb = parse(b);
  const r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
  const g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
  const bl = Math.round(ca[2] + (cb[2] - ca[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

function phaseColors(phase, blend) {
  const pairs = {
    [TimePhase.DAY]: [PALETTE.skyDay, PALETTE.seaDay],
    [TimePhase.SUNSET]: [PALETTE.skySunset, PALETTE.seaSunset],
    [TimePhase.NIGHT]: [PALETTE.skyNight, PALETTE.seaNight],
    [TimePhase.DAWN]: [PALETTE.skyDawn, PALETTE.seaDawn],
  };
  const order = [TimePhase.DAY, TimePhase.SUNSET, TimePhase.NIGHT, TimePhase.DAWN];
  const idx = order.indexOf(phase);
  const next = order[(idx + 1) % order.length];
  const [skyA, seaA] = pairs[phase];
  const [skyB, seaB] = pairs[next];
  return {
    sky: lerpColor(skyA, skyB, blend * 0.3),
    sea: lerpColor(seaA, seaB, blend * 0.3),
    night: phase === TimePhase.NIGHT,
  };
}

export class RenderSystem {
  constructor() {
    this.sprites = new SpriteCache();
    this.clouds = Array.from({ length: 4 }, (_, i) => ({
      x: Math.random() * GAME_WIDTH,
      z: 0.3 + Math.random() * 0.5,
      w: 20 + Math.random() * 16,
    }));
    this.wavePhase = 0;
  }

  drawBackground(ctx, director) {
    const blend = director?.phaseProgress ?? 0;
    const phase = director?.currentPhase ?? TimePhase.DAY;
    const colors = phaseColors(phase, blend);

    ctx.fillStyle = colors.sky;
    ctx.fillRect(0, 0, GAME_WIDTH, HORIZON_Y);

    // Distant coast
    ctx.fillStyle = colors.night ? PALETTE.coastDark : PALETTE.coast;
    ctx.fillRect(0, HORIZON_Y - 8, GAME_WIDTH, 10);

    // Sea with perspective waves
    ctx.fillStyle = colors.sea;
    ctx.fillRect(0, HORIZON_Y, GAME_WIDTH, GAME_HEIGHT - HORIZON_Y);

    this.wavePhase += 0.02;
    for (let z = 1; z >= 0; z -= 0.08) {
      const t = 1 - z;
      const y = HORIZON_Y + (GROUND_Y - HORIZON_Y) * t * t;
      const spacing = 2 + t * 12;
      if (Math.sin(this.wavePhase + z * 10) > 0.3) {
        ctx.fillStyle = colors.night ? PALETTE.waterShadow : PALETTE.waterHighlight;
        ctx.fillRect(0, Math.floor(y), GAME_WIDTH, 1);
      }
    }

    // Night spotlights on coast
    if (colors.night) {
      ctx.fillStyle = COLORS.spotlight;
      for (let i = 0; i < 3; i++) {
        const sx = 40 + i * 80;
        ctx.globalAlpha = 0.15;
        ctx.beginPath();
        ctx.moveTo(sx, HORIZON_Y);
        ctx.lineTo(sx - 20, HORIZON_Y + 40);
        ctx.lineTo(sx + 20, HORIZON_Y + 40);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // Stars at night
    if (colors.night) {
      ctx.fillStyle = '#e8e8f0';
      for (let i = 0; i < 12; i++) {
        const sx = (i * 37 + 13) % GAME_WIDTH;
        const sy = (i * 19 + 7) % (HORIZON_Y - 10);
        ctx.fillRect(sx, sy, 1, 1);
      }
    }

    // Clouds
    for (const c of this.clouds) {
      c.z -= 0.0003;
      if (c.z < 0.05) c.z = 0.9;
      const t = 1 - c.z;
      const cy = HORIZON_Y - 20 + t * 40;
      const cx = c.x;
      const cw = c.w * (0.3 + t * 0.7);
      ctx.fillStyle = colors.night ? '#384060' : PALETTE.cloud;
      ctx.fillRect(cx, cy, cw, 4);
      ctx.fillRect(cx + 4, cy - 2, cw - 8, 3);
    }
  }

  drawPlayer(ctx, player) {
    if (player.dead) return;
    if (player.invulnerable && Math.floor(performance.now() / 100) % 2) return;
    const sprite = this.sprites.getIl2(player.variant);
    ctx.drawImage(sprite, player.x - 16, player.y - 14, 32, 28);

    if (player.recoil > 0) {
      ctx.fillStyle = PALETTE.tracer;
      ctx.fillRect(player.x - 10, player.y - 6, 3, 2);
      ctx.fillRect(player.x + 7, player.y - 6, 3, 2);
    }
  }

  drawProjectile(ctx, p) {
    if (!p.active) return;
    if (p.explosive && p.exploded) {
      ctx.fillStyle = PALETTE.explosionOrange;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.blastRadius, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    if (p.type === 'rocket') {
      ctx.fillStyle = '#c04830';
      ctx.fillRect(p.x - 2, p.y - 2, 4, 8);
      ctx.fillStyle = PALETTE.explosionOrange;
      ctx.fillRect(p.x - 1, p.y + 4, 2, 3);
    } else {
      ctx.fillStyle = p.friendly ? PALETTE.tracer : PALETTE.bullet;
      ctx.fillRect(p.x - 1, p.y - 2, 2, 4);
    }
  }

  drawExplosion(ctx, exp) {
    if (!exp.active) return;
    const sprite = this.sprites.getExplosion(exp.frame, exp.size);
    const s = exp.size === 'large' ? 32 : exp.size === 'medium' ? 24 : 16;
    ctx.drawImage(sprite, exp.x - s / 2, exp.y - s / 2, s, s);
  }

  drawHUD(ctx, game) {
    ctx.fillStyle = PALETTE.hudText;
    ctx.font = '8px monospace';
    ctx.fillText('1UP', 8, 10);
    ctx.fillText(String(game.score).padStart(6, '0'), 8, 20);
    ctx.fillText(`SCENE ${game.director.mission}`, GAME_WIDTH / 2 - 24, 10);

    // Lives as Il-2 silhouettes
    for (let i = 0; i < game.player.lives; i++) {
      ctx.fillStyle = PALETTE.il2Green;
      ctx.fillRect(GAME_WIDTH - 40 + i * 10, 6, 8, 6);
    }

    if (game.message) {
      ctx.fillStyle = PALETTE.hudText;
      ctx.font = '10px monospace';
      ctx.fillText(game.message, GAME_WIDTH / 2 - game.message.length * 3, GAME_HEIGHT / 2);
    }

    if (game.state === 'PAUSED') {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.fillStyle = PALETTE.hudText;
      ctx.font = '12px monospace';
      ctx.fillText('PAUSE', GAME_WIDTH / 2 - 20, GAME_HEIGHT / 2);
    }
  }

  drawEnemies(ctx, enemies) {
    for (const e of enemies) {
      e.draw?.(ctx, this.sprites);
    }
  }
}

export { phaseColors, lerpColor };
