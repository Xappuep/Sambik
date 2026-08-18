import { PerspectiveSystem } from './PerspectiveSystem.js';
import { ENEMY_TYPES } from '../data/enemies.js';
import { TimePhase } from '../constants.js';
import { Bf109 } from '../entities/Bf109.js';
import { Fw190 } from '../entities/Fw190.js';
import { Fw200 } from '../entities/Fw200.js';
import { Ship } from '../entities/Ship.js';
import { Submarine } from '../entities/Submarine.js';
import { SurfaceEnemy } from '../entities/SurfaceEnemy.js';
import { BossFortress } from '../entities/BossFortress.js';

export class SpawnSystem {
  constructor() {
    this.perspective = new PerspectiveSystem();
    this.enemies = [];
    this.boss = null;
    this.formationEnemies = [];
  }

  reset() {
    this.enemies = [];
    this.boss = null;
    this.formationEnemies = [];
  }

  update(dt, director, player, audio) {
    this.enemies = this.enemies.filter((e) => !e.dead);

    if (director.bossActive && !this.boss) {
      this.boss = new BossFortress(this.perspective);
      this.enemies.push(this.boss);
    }

    if (director.transitionFormationActive && this.formationEnemies.length === 0) {
      this.spawnFormation(director);
    }

    if (!director.shouldSpawnAir()) return;

    director.spawnTimer += dt;
    const interval = Math.max(800, 2200 / director.getDifficultyMultiplier());

    if (director.spawnTimer >= interval) {
      director.spawnTimer = 0;
      this.trySpawn(director, player, audio);
    }
  }

  trySpawn(director, player, audio) {
    const airCount = this.enemies.filter((e) => e.isAir).length;
    if (airCount >= director.config.maxAirEnemies) return;

    const roll = Math.random();
    const cfg = director.config;

    if (!director.fw200Spawned && roll < cfg.fw200Rate) {
      const fw = new Fw200(this.perspective);
      this.enemies.push(fw);
      director.fw200Spawned = true;
      audio?.playFw200Engine?.();
      return;
    }

    if (roll < cfg.bf109Rate * 0.3) {
      if (Math.random() < cfg.shipRate) {
        this.enemies.push(new Ship(this.perspective));
        return;
      }
      if (Math.random() < cfg.boatRate) {
        this.enemies.push(SurfaceEnemy.createBoat(this.perspective));
        return;
      }
      if (Math.random() < cfg.subRate) {
        this.enemies.push(new Submarine(this.perspective));
        return;
      }
    }

    if (cfg.fw190Rate > 0 && roll < cfg.fw190Rate) {
      this.enemies.push(new Fw190(this.perspective, director));
      return;
    }

    if (roll < cfg.bf109Rate) {
      this.enemies.push(new Bf109(this.perspective, director));
    } else if (Math.random() < cfg.aaRate && director.phase !== TimePhase.DAY) {
      this.enemies.push(SurfaceEnemy.createBattery(this.perspective));
    }
  }

  spawnFormation(director) {
    const count = 5;
    for (let i = 0; i < count; i++) {
      const e = new Bf109(this.perspective, director, { formation: true, index: i, total: count });
      this.formationEnemies.push(e);
      this.enemies.push(e);
    }
  }

  checkFormation(director) {
    if (!director.transitionFormationActive) return;
    const alive = this.formationEnemies.filter((e) => !e.dead && !e.escaped);
    const escaped = this.formationEnemies.filter((e) => e.escaped);
    if (alive.length === 0 && escaped.length === 0) {
      director.onFormationCleared();
      this.formationEnemies = [];
    } else if (escaped.length > 0 && alive.length === 0) {
      director.onFormationFailed();
      this.formationEnemies = [];
    }
  }

  spawnBonusEnemies(director) {
    this.formationEnemies = [];
    for (let i = 0; i < director.bonusEnemiesTotal; i++) {
      const e = new Bf109(this.perspective, director, { bonus: true, index: i, total: director.bonusEnemiesTotal });
      e.passive = true;
      e.z = 0.7 + i * 0.05;
      e.laneX = -0.5 + (i / Math.max(1, director.bonusEnemiesTotal - 1)) * 1;
      e.speed = 0.15;
      this.formationEnemies.push(e);
      this.enemies.push(e);
    }
  }

  getAllEnemies() {
    return this.enemies;
  }
}
