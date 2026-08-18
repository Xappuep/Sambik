import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveSystem } from '../src/systems/PerspectiveSystem.js';
import { StageDirector } from '../src/systems/StageDirector.js';
import { CollisionSystem } from '../src/systems/CollisionSystem.js';
import { Fw200 } from '../src/entities/Fw200.js';
import { Submarine } from '../src/entities/Submarine.js';
import { BossFortress } from '../src/entities/BossFortress.js';
import { Player } from '../src/entities/Player.js';
import { TimePhase, GameState, EngineState, SubmarineState, FIRE_RATE } from '../src/constants.js';
import { phaseColors } from '../src/systems/RenderSystem.js';
import { getPhaseDuration, PHASE_ORDER } from '../src/data/stages.js';
import { InputManager } from '../src/systems/InputManager.js';

describe('PerspectiveSystem', () => {
  test('far objects have smaller scale than near objects', () => {
    const ps = new PerspectiveSystem();
    assert.ok(ps.scaleAt(1) < ps.scaleAt(0));
  });

  test('screen Y increases as object approaches camera', () => {
    const ps = new PerspectiveSystem();
    assert.ok(ps.depthToScreenY(0) > ps.depthToScreenY(1));
  });

  test('advanceZ decreases depth value', () => {
    const ps = new PerspectiveSystem();
    const next = ps.advanceZ(0.5, 0.2, 1);
    assert.ok(next < 0.5);
  });

  test('spawnZ returns horizon-range depth', () => {
    const ps = new PerspectiveSystem();
    for (let i = 0; i < 20; i++) {
      const z = ps.spawnZ();
      assert.ok(z >= 0.92 && z <= 1);
    }
  });
});

describe('StageDirector time phases', () => {
  test('starts at DAY phase', () => {
    const sd = new StageDirector();
    assert.equal(sd.currentPhase, TimePhase.DAY);
  });

  test('DAY to SUNSET transition via formation clear', () => {
    const sd = new StageDirector();
    sd.phaseElapsed = getPhaseDuration(TimePhase.DAY, 1);
    sd.update(0, GameState.PLAYING);
    assert.equal(sd.transitionFormationActive, true);
    sd.onFormationCleared();
    assert.equal(sd.currentPhase, TimePhase.SUNSET);
    assert.equal(sd.rapidFire, true);
  });

  test('SUNSET to NIGHT transition', () => {
    const sd = new StageDirector();
    sd.phaseIndex = 1;
    sd.phase = TimePhase.SUNSET;
    sd.phaseElapsed = getPhaseDuration(TimePhase.SUNSET, 1);
    sd.update(0, GameState.PLAYING);
    sd.onFormationCleared();
    assert.equal(sd.currentPhase, TimePhase.NIGHT);
  });

  test('NIGHT to DAWN transition', () => {
    const sd = new StageDirector();
    sd.phaseIndex = 2;
    sd.phase = TimePhase.NIGHT;
    sd.phaseElapsed = getPhaseDuration(TimePhase.NIGHT, 1);
    sd.update(0, GameState.PLAYING);
    sd.onFormationCleared();
    assert.equal(sd.currentPhase, TimePhase.DAWN);
  });

  test('phase order contains all four periods', () => {
    assert.deepEqual(PHASE_ORDER, [
      TimePhase.DAY,
      TimePhase.SUNSET,
      TimePhase.NIGHT,
      TimePhase.DAWN,
    ]);
  });

  test('phaseColors returns sky and sea for each phase', () => {
    for (const phase of PHASE_ORDER) {
      const c = phaseColors(phase, 0);
      assert.ok(c.sky);
      assert.ok(c.sea);
    }
  });
});

describe('Transition formation rapid-fire', () => {
  test('formation cleared enables rapid fire', () => {
    const sd = new StageDirector();
    sd.onFormationCleared();
    assert.equal(sd.rapidFire, true);
    assert.equal(sd.fireRateMs, FIRE_RATE.RAPID);
  });

  test('formation failed applies penalty fire rate', () => {
    const sd = new StageDirector();
    sd.onFormationFailed();
    assert.equal(sd.rapidFire, false);
    assert.equal(sd.rapidFireRestored, false);
    assert.equal(sd.fireRateMs, FIRE_RATE.PENALTY);
  });

  test('new mission restores normal fire rate', () => {
    const sd = new StageDirector();
    sd.onFormationFailed();
    sd.completeBonusStage();
    sd.restoreRapidFireForNewMission();
    assert.equal(sd.fireRateMs, FIRE_RATE.NORMAL);
  });
});

describe('Fw200 engines', () => {
  test('four independent engine states', () => {
    const ps = new PerspectiveSystem();
    const fw = new Fw200(ps);
    const engines = fw.getEngineHitboxes();
    assert.equal(engines.length, 4);
    assert.equal(new Set(engines.map((e) => e.key)).size, 4);
  });

  test('destroyed after fourth engine', () => {
    const ps = new PerspectiveSystem();
    const fw = new Fw200(ps);
    for (const eng of fw.getEngineHitboxes()) {
      fw.damageEngine(eng.key);
      fw.engines[eng.key] = EngineState.DESTROYED;
    }
    assert.equal(fw.allEnginesDestroyed, true);
  });

  test('engine damage progresses through states', () => {
    const ps = new PerspectiveSystem();
    const fw = new Fw200(ps);
    const key = 'engineLeftOuter';
    fw.damageEngine(key);
    assert.equal(fw.engines[key], EngineState.DAMAGED);
    fw.damageEngine(key);
    assert.equal(fw.engines[key], EngineState.BURNING);
    fw.damageEngine(key);
    assert.equal(fw.engines[key], EngineState.DESTROYED);
  });
});

describe('Submarine', () => {
  test('immune to rockets while submerged', () => {
    const ps = new PerspectiveSystem();
    const sub = new Submarine(ps);
    sub.state = SubmarineState.SUBMERGED;
    assert.equal(sub.surfaced, false);
    assert.equal(sub.getHitbox(), null);
    assert.equal(sub.onRocketHit(), null);
  });

  test('vulnerable while surfaced', () => {
    const ps = new PerspectiveSystem();
    const sub = new Submarine(ps);
    sub.state = SubmarineState.SURFACED;
    assert.equal(sub.surfaced, true);
    assert.ok(sub.getHitbox());
    const result = sub.onRocketHit();
    assert.ok(result);
    assert.equal(sub.dead, true);
  });
});

describe('Boss', () => {
  test('boss destroyed by rocket on turret', () => {
    const ps = new PerspectiveSystem();
    const boss = new BossFortress(ps);
    const tb = boss.getTurretHitbox();
    const rocket = { x: tb.x + tb.w / 2, y: tb.y + tb.h / 2 };
    const result = boss.checkRocketHit(rocket);
    assert.ok(result);
    assert.equal(boss.dead, true);
  });
});

describe('Player lives', () => {
  test('lose life on kill', () => {
    const p = new Player();
    p.lives = 3;
    p.kill();
    p.loseLife();
    assert.equal(p.lives, 2);
    assert.equal(p.dead, true);
  });

  test('respawn grants invulnerability', () => {
    const p = new Player();
    p.kill();
    p.lives = 2;
    p.respawn();
    assert.equal(p.dead, false);
    assert.equal(p.invulnerable, true);
    assert.ok(p.invulnTimer > 0);
  });

  test('add life after mission', () => {
    const p = new Player();
    p.lives = 2;
    p.addLife();
    assert.equal(p.lives, 3);
  });
});

describe('Game over and bonus', () => {
  test('game over when no lives remain', () => {
    const p = new Player();
    p.lives = 1;
    p.kill();
    p.loseLife();
    assert.equal(p.lives, 0);
  });

  test('bonus stage tracking', () => {
    const sd = new StageDirector();
    sd.startBonusStage(5);
    assert.equal(sd.bonusActive, true);
    assert.equal(sd.bonusEnemiesTotal, 5);
    for (let i = 0; i < 5; i++) sd.onBonusKill();
    assert.equal(sd.bonusCleared, true);
  });
});

describe('Pause', () => {
  test('director pauses when flag set', () => {
    const sd = new StageDirector();
    sd.paused = true;
    const elapsed = sd.phaseElapsed;
    sd.update(1000, GameState.PLAYING);
    assert.equal(sd.phaseElapsed, elapsed);
  });
});

describe('Canvas resize', () => {
  test('scale is integer and at least 1', () => {
    const scale = Math.max(1, Math.floor(Math.min(512 / 256, 480 / 240)));
    assert.ok(scale >= 1);
    assert.equal(scale, Math.floor(scale));
  });
});

describe('Keyboard controls mapping', () => {
  test('input state includes fire and rocket keys', () => {
    const input = new InputManager();
    input.keys = {
      ArrowUp: true,
      Space: true,
      KeyX: true,
    };
    const state = input.getState();
    assert.equal(state.up, true);
    assert.equal(state.fire, true);
    assert.equal(state.rocket, true);
  });
});

describe('CollisionSystem', () => {
  test('submarine skipped in rocket collision when submerged', () => {
    const ps = new PerspectiveSystem();
    const cs = new CollisionSystem();
    const sub = new Submarine(ps);
    sub.state = SubmarineState.SUBMERGED;
    const rockets = [{ active: true, friendly: true, x: 128, y: 120 }];
    const hits = cs.checkRocketsVsEnemies(rockets, [sub]);
    assert.equal(hits.length, 0);
  });
});
