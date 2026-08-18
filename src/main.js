import { Game } from './Game.js';

function showBootError(message) {
  const overlay = document.getElementById('boot-error');
  const text = document.getElementById('boot-error-text');
  if (overlay && text) {
    text.textContent = message;
    overlay.classList.remove('hidden');
  }
  const canvas = document.getElementById('game');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#081830';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fcfcfc';
      ctx.font = '8px monospace';
      ctx.fillText('LOAD ERROR', 88, 110);
      ctx.fillText('See message below', 72, 126);
    }
  }
}

try {
  const canvas = document.getElementById('game');
  if (!canvas) {
    throw new Error('Canvas #game not found');
  }

  const game = new Game(canvas);
  game.start();
  game.audio.playMenuMusic();
} catch (err) {
  console.error(err);
  showBootError(`Ошибка запуска: ${err.message}`);
}
