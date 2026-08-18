import { GAME_TITLE, GAME_WIDTH, GAME_HEIGHT, HORIZON_Y, GROUND_Y } from '../constants.js';
import { PALETTE as COLORS } from '../data/palette.js';
import { SpriteFactory } from '../graphics/SpriteFactory.js';

export class TitleScreen {
  constructor(game) {
    this.game = game;
    this.blink = 0;
  }

  update(dt, input) {
    this.blink += dt;
    if (input.consumeStart()) {
      this.game.audio.init();
      this.game.newGame();
    }
  }

  draw(ctx) {
    // Sky
    ctx.fillStyle = COLORS.skyDay;
    ctx.fillRect(0, 0, GAME_WIDTH, HORIZON_Y);

    // Sea
    ctx.fillStyle = COLORS.seaDay;
    ctx.fillRect(0, HORIZON_Y, GAME_WIDTH, GAME_HEIGHT - HORIZON_Y);

    // Coast line
    ctx.fillStyle = COLORS.coast;
    ctx.fillRect(0, HORIZON_Y - 4, GAME_WIDTH, 6);

    // Waves
    ctx.fillStyle = COLORS.waterHighlight;
    for (let x = 0; x < GAME_WIDTH; x += 16) {
      ctx.fillRect(x, GROUND_Y - 20, 8, 1);
      ctx.fillRect(x + 8, GROUND_Y - 10, 8, 1);
    }

    // Il-2 silhouette
    const il2 = SpriteFactory.getSprite('il2', 48, 42, { variant: 'normal' });
    ctx.drawImage(il2, GAME_WIDTH / 2 - 24, GAME_HEIGHT - 80, 48, 42);

    // Title
    ctx.fillStyle = COLORS.hudShadow;
    ctx.font = 'bold 14px monospace';
    ctx.fillText(GAME_TITLE, 28, 40);
    ctx.fillStyle = COLORS.redStar;
    ctx.fillText(GAME_TITLE, 26, 38);

    // Subtitle
    ctx.fillStyle = COLORS.hudText;
    ctx.font = '8px monospace';
    ctx.fillText('1941-1945', GAME_WIDTH / 2 - 24, 56);

    // Press start blink
    if (Math.floor(this.blink * 2) % 2 === 0) {
      ctx.fillStyle = COLORS.hudText;
      ctx.font = '10px monospace';
      ctx.fillText('PRESS START', GAME_WIDTH / 2 - 36, GAME_HEIGHT - 30);
    }

    // Controls hint
    ctx.font = '7px monospace';
    ctx.fillStyle = COLORS.hudText;
    ctx.fillText('ARROWS/WASD  FIRE:Z  ROCKET:X', 36, GAME_HEIGHT - 12);
  }
}
