/**
 * Hitbox collision helpers — separate from visual sizes.
 */
export function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export function circleRectOverlap(cx, cy, r, rect) {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < r * r;
}

export function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

export class CollisionSystem {
  checkPlayerVsProjectiles(player, projectiles) {
    if (player.invulnerable || player.dead) return null;
    const hb = player.hitbox;
    for (const p of projectiles) {
      if (!p.active || p.friendly) continue;
      if (p.explosive) {
        if (p.exploded && p.blastRadius) {
          if (circleRectOverlap(p.x, p.y, p.blastRadius, hb)) return p;
        }
      } else if (pointInRect(p.x, p.y, hb)) {
        return p;
      }
    }
    return null;
  }

  checkPlayerVsEnemies(player, enemies) {
    if (player.invulnerable || player.dead) return null;
    const hb = player.hitbox;
    for (const e of enemies) {
      if (e.dead || !e.isAir) continue;
      const eb = e.getHitbox?.();
      if (eb && rectsOverlap(hb, eb)) return e;
    }
    return null;
  }

  checkPlayerGroundCollision(player, groundY) {
    if (player.dead) return false;
    return player.y + player.hitbox.h / 2 >= groundY - 2;
  }

  checkBulletsVsEnemies(bullets, enemies) {
    const hits = [];
    for (const b of bullets) {
      if (!b.active || !b.friendly) continue;
      for (const e of enemies) {
        if (e.dead) continue;
        const hit = e.checkHit?.(b);
        if (hit) {
          hits.push({ bullet: b, enemy: e, detail: hit });
          b.active = false;
          break;
        }
      }
    }
    return hits;
  }

  checkRocketsVsEnemies(rockets, enemies) {
    const hits = [];
    for (const r of rockets) {
      if (!r.active || !r.friendly) continue;
      for (const e of enemies) {
        if (e.dead) continue;
        if (e.rocketVulnerable === false) continue;

        if (e.type === 'boss') {
          const result = e.checkRocketHit?.(r);
          if (result) {
            hits.push({ rocket: r, enemy: e, result });
            r.active = false;
            break;
          }
          continue;
        }

        if (e.type === 'submarine' && !e.surfaced) continue;

        const hb = e.getHitbox?.();
        if (hb && pointInRect(r.x, r.y, hb)) {
          hits.push({ rocket: r, enemy: e });
          r.active = false;
          break;
        }
      }
    }
    return hits;
  }
}
