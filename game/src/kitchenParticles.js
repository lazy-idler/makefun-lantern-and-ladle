// Lightweight particle pool and floating callouts for steam, wok flames,
// knife chop confetti, burn smoke, and score popups.

export function createParticleSystem() {
  const particles = [];
  const callouts = [];

  function spawnParticle(opts) {
    if (particles.length >= 260) particles.shift();
    particles.push({
      kind: opts.kind ?? 'steam',
      x: opts.x,
      y: opts.y,
      vx: opts.vx ?? 0,
      vy: opts.vy ?? -20,
      size: opts.size ?? 8,
      grow: opts.grow ?? 0,
      alpha: opts.alpha ?? 0.7,
      life: opts.life ?? 0.8,
      maxLife: opts.life ?? 0.8,
      color: opts.color ?? '#ffffff',
      gravity: opts.gravity ?? 0,
    });
  }

  function spawnCallout(text, x, y, color = '#ffd773', scale = 1) {
    if (callouts.length >= 24) callouts.shift();
    const clampedX = Math.min(1140, Math.max(130, x));
    let adjustedY = y;
    for (const existing of callouts) {
      if (Math.abs(existing.x - clampedX) < 150 && Math.abs(existing.y - adjustedY) < 22) {
        adjustedY -= 24;
      }
    }
    callouts.push({
      text,
      x: clampedX,
      y: adjustedY,
      vy: -34,
      life: 1.25,
      maxLife: 1.25,
      color,
      scale,
    });
  }

  function emitSteam(x, y, random, tint = 'rgba(255, 249, 238, 0.52)') {
    spawnParticle({
      kind: 'steam',
      x: x + (random() - 0.5) * 34,
      y: y + (random() - 0.5) * 6,
      vx: (random() - 0.5) * 14,
      vy: -28 - random() * 22,
      size: 7 + random() * 7,
      grow: 12,
      alpha: 0.45,
      life: 1.1 + random() * 0.45,
      color: tint,
    });
  }

  function emitSmoke(x, y, random) {
    spawnParticle({
      kind: 'steam',
      x: x + (random() - 0.5) * 28,
      y,
      vx: (random() - 0.5) * 20,
      vy: -36 - random() * 20,
      size: 10 + random() * 8,
      grow: 16,
      alpha: 0.65,
      life: 0.95 + random() * 0.35,
      color: 'rgba(42, 38, 36, 0.72)',
    });
  }

  function emitChopBurst(x, y, color, random) {
    for (let i = 0; i < 9; i += 1) {
      const angle = -Math.PI + random() * Math.PI;
      const speed = 55 + random() * 115;
      spawnParticle({
        kind: 'confetti',
        x: x + (random() - 0.5) * 22,
        y: y + (random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        size: 3 + random() * 4,
        alpha: 0.95,
        life: 0.42 + random() * 0.25,
        color,
        gravity: 340,
      });
    }
  }

  function emitWokFlare(x, y, random, count = 14) {
    const colors = ['#fff3a8', '#ff9f43', '#ff5e36', '#ffd166'];
    for (let i = 0; i < count; i += 1) {
      spawnParticle({
        kind: 'spark',
        x: x + (random() - 0.5) * 52,
        y: y + (random() - 0.5) * 10,
        vx: (random() - 0.5) * 90,
        vy: -70 - random() * 110,
        size: 3 + random() * 5,
        grow: -4,
        alpha: 0.95,
        life: 0.32 + random() * 0.25,
        color: colors[Math.floor(random() * colors.length)],
        gravity: 90,
      });
    }
  }

  function emitServeBurst(x, y, random) {
    const colors = ['#ffd773', '#4cd98c', '#fff6d6', '#ff8c5a'];
    for (let i = 0; i < 18; i += 1) {
      const angle = random() * Math.PI * 2;
      const speed = 45 + random() * 140;
      spawnParticle({
        kind: 'star',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 45,
        size: 4 + random() * 4,
        alpha: 1,
        life: 0.55 + random() * 0.3,
        color: colors[Math.floor(random() * colors.length)],
        gravity: 210,
      });
    }
  }

  function step(dt) {
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.size = Math.max(1, p.size + p.grow * dt);
    }
    for (let i = callouts.length - 1; i >= 0; i -= 1) {
      const c = callouts[i];
      c.life -= dt;
      if (c.life <= 0) {
        callouts.splice(i, 1);
        continue;
      }
      c.y += c.vy * dt;
      c.vy *= 0.96;
    }
  }

  function clear() {
    particles.length = 0;
    callouts.length = 0;
  }

  return {
    particles,
    callouts,
    spawnCallout,
    emitSteam,
    emitSmoke,
    emitChopBurst,
    emitWokFlare,
    emitServeBurst,
    step,
    clear,
  };
}
