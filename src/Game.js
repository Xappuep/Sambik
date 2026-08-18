import {
  GAME_WIDTH,
  GAME_HEIGHT,
  HORIZON_Y,
  GROUND_Y,
  GameState,
  TimePhase,
  INITIAL_LIVES,
  HIGH_SCORE_KEY,
  GAME_TITLE,
} from './constants.js';
import { Player } from './entities/Player.js';
import { Bullet, Rocket, Explosion } from './entities/Projectile.js';
import { StageDirector } from './systems/StageDirector.js';
import { SpawnSystem } from './systems/SpawnSystem.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { RenderSystem } from './systems/RenderSystem.js';
import { AudioManager } from './systems/AudioManager.js';
import { InputManager } from './systems/InputManager.js';
import { ObjectPool } from './systems/ObjectPool.js';
import { TitleScreen } from './scenes/TitleScreen.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.state = GameState.TITLE;
    this.player = new Player();
    this.director = new StageDirector();
    this.spawner = new SpawnSystem();
    this.collision = new CollisionSystem();
    this.renderer = new RenderSystem();
    this.audio = new AudioManager();
    this.input = new InputManager();

    this.bullets = new ObjectPool(() => new Bullet(), 32);
    this.rockets = new ObjectPool(() => new Rocket(), 8);
    this.explosions = new ObjectPool(() => new Explosion(), 16);
    this.enemyProjectiles = [];

    this.score = 0;
    this.highScore = Game.loadHighScore();
    this.message = '';
    this.messageTimer = 0;
    this.deathTimer = 0;
    this.scale = 1;

    this.title = new TitleScreen(this);
    this.lastTime = 0;
    this.running = false;
  }

  static loadHighScore() {
    try {
      return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
    } catch {
      return 0;
    }
  }

  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem(HIGH_SCORE_KEY, String(this.highScore));
      } catch { /* ignore */ }
    }
  }

  start() {
    this.input.bind();
    this.audio.init();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  resize() {
    const container = this.canvas.parentElement;
    const maxW = container?.clientWidth || window.innerWidth;
    const maxH = container?.clientHeight || window.innerHeight;
    this.scale = Math.max(1, Math.floor(Math.min(maxW / GAME_WIDTH, maxH / GAME_HEIGHT)));
    this.canvas.style.width = `${GAME_WIDTH * this.scale}px`;
    this.canvas.style.height = `${GAME_HEIGHT * this.scale}px`;
    this.canvas.width = GAME_WIDTH;
    this.canvas.height = GAME_HEIGHT;
  }

  newGame() {
    this.state = GameState.PLAYING;
    this.score = 0;
    this.player.reset();
    this.player.lives = INITIAL_LIVES;
    this.director.reset(1);
    this.director.restoreRapidFireForNewMission();
    this.spawner.reset();
    this.bullets.releaseAll();
    this.rockets.releaseAll();
    this.explosions.releaseAll();
    this.enemyProjectiles = [];
    this.message = '';
    this.audio.playBattleMusic();
  }

  loop(now) {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.update(dt);
    this.draw();
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    if (this.state === GameState.TITLE) {
      this.title.update(dt, this.input);
      return;
    }

    if (this.input.consumePause() && this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED;
      this.director.paused = true;
    } else if (this.input.consumePause() && this.state === GameState.PAUSED) {
      this.state = GameState.PLAYING;
      this.director.paused = false;
    }

    if (this.state === GameState.PAUSED) return;

    if (this.messageTimer > 0) {
      this.messageTimer -= dt;
      if (this.messageTimer <= 0) this.message = '';
    }

    if (this.state === GameState.PLAYER_DEAD) {
      this.deathTimer -= dt;
      if (this.deathTimer <= 0) {
        if (this.player.lives <= 0) {
          this.state = GameState.GAME_OVER;
          this.saveHighScore();
          this.audio.stopMusic();
        } else {
          this.player.respawn();
          this.state = GameState.PLAYING;
        }
      }
      return;
    }

    if (this.state === GameState.STAGE_CLEAR) {
      this.deathTimer -= dt;
      if (this.deathTimer <= 0) {
        this.state = GameState.BONUS;
        this.director.startBonusStage(5);
        this.spawner.reset();
        this.spawner.spawnBonusEnemies(this.director);
        this.message = 'BONUS STAGE';
        this.messageTimer = 2;
      }
      return;
    }

    if (this.state === GameState.BONUS) {
      this.updatePlaying(dt, true);
      if (this.director.bonusCleared) {
        this.showMessage('PERFECT!', 2);
        this.score += 5000;
        this.director.completeBonusStage();
        this.director.restoreRapidFireForNewMission();
        this.player.addLife();
        this.showMessage('САМОЛЁТ +1', 2);
        this.spawner.reset();
        this.state = GameState.PLAYING;
        this.audio.playBattleMusic();
      }
      return;
    }

    if (this.state === GameState.GAME_OVER) {
      if (this.input.consumeStart()) {
        this.state = GameState.TITLE;
        this.audio.playMenuMusic();
      }
      return;
    }

    if (this.state === GameState.PLAYING) {
      this.updatePlaying(dt, false);
    }
  }

  updatePlaying(dt, bonusOnly) {
    const input = this.input.getState();
    const bounds = { width: GAME_WIDTH, height: GAME_HEIGHT, horizonY: HORIZON_Y, groundY: GROUND_Y };

    this.player.update(dt, input, bounds);

    // Guns
    if (input.fire && this.player.canFireGun(this.director.fireRateMs)) {
      const shot = this.player.fireGun(this.director.fireRateMs);
      const b = this.bullets.acquire();
      b.init(shot);
      this.audio.playGun();
    }

    // Rockets
    if (input.rocket && this.player.canFireRocket()) {
      const shot = this.player.fireRocket();
      const r = this.rockets.acquire();
      r.init(shot);
      this.audio.playRocket();
    }

    const ctx = {
      onEnemyFire: (e) => this.enemyFire(e),
      onEnemyDestroyed: (e, dist) => this.onEnemyKilled(e, dist),
      onFw200Destroyed: (e) => this.onFw200Destroyed(e),
      onSurfaceFire: (e) => this.surfaceFire(e),
      onBossFire: (b) => this.bossFire(b),
    };

    if (!bonusOnly) {
      this.director.update(dt, this.state);
    }
    this.spawner.update(dt, this.director, this.player, this.audio);
    this.spawner.checkFormation(this.director);

    const enemies = this.spawner.getAllEnemies();
    for (const e of enemies) {
      e.update(dt, ctx);
    }

    this.bullets.updateActive(dt, bounds);
    this.rockets.forEachActive((r) => r.update(dt, this.spawner.perspective));
    this.explosions.updateActive(dt);

    // Enemy projectiles
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const p = this.enemyProjectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.ttl -= dt;
      if (p.ttl <= 0 || p.y > GAME_HEIGHT + 10) {
        this.enemyProjectiles.splice(i, 1);
      }
    }

    // Collisions
    const bulletHits = this.collision.checkBulletsVsEnemies(
      this.bullets.active,
      enemies
    );
    for (const hit of bulletHits) {
      if (hit.detail?.score) this.score += hit.detail.score;
      if (hit.detail?.engine) this.audio.playEngineDamage();
      if (hit.enemy.dead || hit.enemy.falling) {
        /* explosion handled in onEnemyKilled */
      }
    }

    const rocketHits = this.collision.checkRocketsVsEnemies(
      this.rockets.active,
      enemies
    );
    for (const hit of rocketHits) {
      let result = hit.result;
      if (!result) {
        result = hit.enemy.onRocketHit?.(hit.rocket);
      }
      if (result) {
        this.score += result.score || 0;
        this.spawnExplosion(hit.rocket.x, hit.rocket.y, result.explosion || 'medium');
        this.audio.playExplosionLarge();
        if (hit.enemy.type === 'boss') {
          this.onBossDefeated();
        }
      }
    }

    const projHit = this.collision.checkPlayerVsProjectiles(this.player, this.enemyProjectiles);
    if (projHit) this.killPlayer();

    const enemyHit = this.collision.checkPlayerVsEnemies(this.player, enemies);
    if (enemyHit) this.killPlayer();

    if (this.collision.checkPlayerGroundCollision(this.player, GROUND_Y)) {
      this.killPlayer();
    }

    // Bonus kills
    if (this.director.bonusActive) {
      const bonusAlive = enemies.filter((e) => e.dead && e.passive).length;
      /* tracked via onEnemyKilled */
    }
  }

  enemyFire(enemy) {
    const p = this.spawner.perspective.project(enemy.laneX, enemy.z);
    this.enemyProjectiles.push({
      x: p.x, y: p.y, vx: 0, vy: 120, ttl: 3, friendly: false, explosive: false,
    });
    this.audio.playEnemyGun();
  }

  surfaceFire(enemy) {
    const p = this.spawner.perspective.project(enemy.laneX, enemy.z);
    this.enemyProjectiles.push({
      x: p.x, y: p.y, vx: 0, vy: 80, ttl: 4, friendly: false, explosive: true,
    });
    this.audio.playEnemyShell();
  }

  bossFire(boss) {
    const tb = boss.getTurretHitbox();
    this.enemyProjectiles.push({
      x: tb.x + tb.w / 2, y: tb.y + tb.h,
      vx: (Math.random() - 0.5) * 40, vy: 100, ttl: 4, friendly: false, explosive: true,
    });
    this.audio.playEnemyShell();
  }

  onEnemyKilled(enemy, dist) {
    const p = this.spawner.perspective.project(enemy.laneX, enemy.z);
    this.score += enemy.score || 0;
    this.spawnExplosion(p.x, p.y, dist === 'near' ? 'medium' : 'small');
    this.audio.playExplosionSmall();

    if (this.director.bonusActive && enemy.passive) {
      this.director.onBonusKill();
    }
  }

  onFw200Destroyed(enemy) {
    const p = this.spawner.perspective.project(enemy.laneX, enemy.z);
    this.spawnExplosion(p.x, p.y, 'large');
    this.audio.playExplosionLarge();
    this.score += enemy.score;
    // Destroy all air enemies on screen
    for (const e of this.spawner.getAllEnemies()) {
      if (e.isAir && e !== enemy && !e.dead) {
        e.dead = true;
        const ep = this.spawner.perspective.project(e.laneX, e.z);
        this.spawnExplosion(ep.x, ep.y, 'small');
        this.score += e.score || 0;
      }
    }
  }

  onBossDefeated() {
    this.director.onBossDefeated();
    this.state = GameState.STAGE_CLEAR;
    this.deathTimer = 3;
    this.showMessage('MISSION COMPLETE', 2.5);
    this.player.addLife();
    this.audio.playStageClear();
    this.saveHighScore();
  }

  killPlayer() {
    if (this.player.dead || this.player.invulnerable) return;
    this.player.kill();
    this.player.loseLife();
    this.spawnExplosion(this.player.x, this.player.y, 'medium');
    this.audio.playPlayerDeath();
    this.state = GameState.PLAYER_DEAD;
    this.deathTimer = 2;
  }

  spawnExplosion(x, y, size) {
    const e = this.explosions.acquire();
    e.init(x, y, size);
  }

  showMessage(text, duration) {
    this.message = text;
    this.messageTimer = duration;
  }

  draw() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (this.state === GameState.TITLE) {
      this.title.draw(ctx);
      return;
    }

    this.renderer.drawBackground(ctx, this.director);
    this.renderer.drawEnemies(ctx, this.spawner.getAllEnemies());

    for (const p of this.enemyProjectiles) {
      this.renderer.drawProjectile(ctx, p);
    }

    this.bullets.forEachActive((b) => this.renderer.drawProjectile(ctx, b));
    this.rockets.forEachActive((r) => this.renderer.drawProjectile(ctx, r));
    this.explosions.forEachActive((e) => this.renderer.drawExplosion(ctx, e));

    this.renderer.drawPlayer(ctx, this.player);
    this.renderer.drawHUD(ctx, this);

    if (this.state === GameState.GAME_OVER) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.fillStyle = '#fcfcfc';
      ctx.font = '14px monospace';
      ctx.fillText('GAME OVER', GAME_WIDTH / 2 - 36, GAME_HEIGHT / 2 - 20);
      ctx.font = '8px monospace';
      ctx.fillText(`SCORE ${this.score}`, GAME_WIDTH / 2 - 28, GAME_HEIGHT / 2);
      ctx.fillText(`SCENE ${this.director.mission}`, GAME_WIDTH / 2 - 24, GAME_HEIGHT / 2 + 12);
      ctx.fillText(`HI ${this.highScore}`, GAME_WIDTH / 2 - 20, GAME_HEIGHT / 2 + 24);
      ctx.fillText('PRESS START', GAME_WIDTH / 2 - 32, GAME_HEIGHT / 2 + 44);
    }
  }
}

export { GAME_TITLE };
