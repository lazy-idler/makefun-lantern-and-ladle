// Pure simulation state and fixed-timestep kitchen engine for Sesame & Flame.
// Tracks active customer & VIP critic tickets, station timers, side prep tray,
// chef movement, combos, upgrades, and 5-shift progression with zero DOM coupling.

import { CHEF_CONFIG, COOKING_TIMES, SHIFTS, STATIONS } from './config.js';
import { RECIPES } from './recipes.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_UPGRADE = 'upgrade';
export const SCREEN_OVER = 'over';

const TABLE_LABELS = ['Booth 1', 'Bar 2', 'Booth 3', 'Counter 4', 'Lantern 5', 'Patio 6'];

export function createKitchenState(random) {
  let nextOrderSeq = 101;

  const state = {
    screen: SCREEN_TITLE,
    shiftIndex: 0,
    shiftTimeLeft: SHIFTS[0].durationSec,
    elapsed: 0,
    score: 0,
    shiftScore: 0,
    tipsEarned: 0,
    bestScore: 0,
    combo: 0,
    maxCombo: 0,
    servedCount: 0,
    missedCount: 0,
    shakeTimer: 0,
    shakeAmount: 0,
    orderSpawnTimer: 1.5,
    steamTick: 0,

    chef: {
      x: STATIONS.plate.interactX,
      targetX: STATIONS.plate.interactX,
      heldItem: null,
      facing: 1,
      walkPhase: 0,
      chopSwing: 0,
      hintText: 'Click a glowing station or press 1-8 to grab ingredients!',
      hintTimer: 6,
      lastStation: 'plate',
    },

    stations: {
      chop: {
        item: null,
        hits: 0,
        hitsRequired: COOKING_TIMES.chopHitsRequired,
        slashFlash: 0,
      },
      kettle: {
        item: null,
        elapsed: 0,
        cookSec: COOKING_TIMES.kettleCookSec,
        overcookSec: COOKING_TIMES.kettleOvercookSec,
        status: 'idle', // idle | cooking | ready | overcooked
        bubblePhase: 0,
      },
      wok: {
        item: null,
        elapsed: 0,
        cookSec: COOKING_TIMES.wokCookSec,
        perfectStart: COOKING_TIMES.wokPerfectWindowStart,
        burnSec: COOKING_TIMES.wokBurnSec,
        tossesUsed: 0,
        status: 'idle', // idle | searing | perfect | burning | burnt
        flareTimer: 0,
      },
      plate: {
        parts: [],
        completedRecipeId: null,
      },
      pass: {
        slots: [null, null], // each slot: { recipeId } or null
        bellRing: 0,
      },
      hold: {
        item: null,
      },
    },

    orders: [],
    upgrades: {
      cleaver: false,
      kettle: false,
      wok: false,
      heatlamp: false,
    },
    pendingTipMessage: '',
    showRecipeBook: false,
  };

  function currentShiftConfig() {
    return SHIFTS[Math.min(state.shiftIndex, SHIFTS.length - 1)];
  }

  function clearStations() {
    const { chop, kettle, wok, plate, pass, hold } = state.stations;
    chop.item = null;
    chop.hits = 0;
    chop.hitsRequired = state.upgrades.cleaver ? 2 : COOKING_TIMES.chopHitsRequired;
    chop.slashFlash = 0;

    kettle.item = null;
    kettle.elapsed = 0;
    kettle.cookSec = state.upgrades.kettle ? COOKING_TIMES.kettleCookSec * 0.7 : COOKING_TIMES.kettleCookSec;
    kettle.status = 'idle';

    wok.item = null;
    wok.elapsed = 0;
    wok.cookSec = COOKING_TIMES.wokCookSec;
    wok.burnSec = state.upgrades.wok ? COOKING_TIMES.wokBurnSec + 1.8 : COOKING_TIMES.wokBurnSec;
    wok.tossesUsed = 0;
    wok.status = 'idle';
    wok.flareTimer = 0;

    plate.parts = [];
    plate.completedRecipeId = null;
    pass.slots = [null, null];
    pass.bellRing = 0;
    hold.item = null;
  }

  function spawnOrder() {
    const cfg = currentShiftConfig();
    if (state.orders.length >= cfg.maxActiveOrders) return null;
    const pool = state.shiftIndex === 0 ? RECIPES.slice(0, 6) : RECIPES;
    const recipe = pool[Math.floor(random() * pool.length)];
    const hasVipAlready = state.orders.some((o) => o.isVip);
    const isVip = !hasVipAlready && nextOrderSeq % 4 === 1;
    const extraWait = state.upgrades.heatlamp ? 1.2 : 1.0;
    const patience = (cfg.basePatienceSec + Math.floor(random() * 6)) * extraWait * (isVip ? 0.85 : 1.0);
    const tableLabel = isVip ? 'VIP CRITIC' : TABLE_LABELS[(nextOrderSeq + Math.floor(random() * 2)) % TABLE_LABELS.length];
    const order = {
      id: nextOrderSeq,
      ticketNo: nextOrderSeq,
      tableLabel,
      isVip,
      recipeId: recipe.id,
      timeLeft: patience,
      maxTime: patience,
      enteredAnim: 1,
    };
    nextOrderSeq += 1;
    state.orders.push(order);
    return order;
  }

  function startShift(shiftIdx = 0) {
    state.shiftIndex = shiftIdx;
    const cfg = currentShiftConfig();
    state.shiftTimeLeft = cfg.durationSec;
    state.shiftScore = 0;
    state.orders = [];
    state.chef.heldItem = null;
    state.chef.x = STATIONS.plate.interactX;
    state.chef.targetX = STATIONS.plate.interactX;
    state.chef.hintText = `Shift ${cfg.shift}: ${cfg.name} — Goal $${cfg.scoreGoal}`;
    state.chef.hintTimer = 4.5;
    clearStations();
    // Open service with 3 lively orders immediately on the ticket rail.
    spawnOrder();
    spawnOrder();
    spawnOrder();
    state.orderSpawnTimer = cfg.spawnEverySec * 0.65;
    state.screen = SCREEN_PLAY;
  }

  function resetGame() {
    nextOrderSeq = 101;
    state.elapsed = 0;
    state.score = 0;
    state.tipsEarned = 0;
    state.combo = 0;
    state.maxCombo = 0;
    state.servedCount = 0;
    state.missedCount = 0;
    state.shakeTimer = 0;
    state.shakeAmount = 0;
    state.showRecipeBook = false;
    state.upgrades = { cleaver: false, kettle: false, wok: false, heatlamp: false };
    startShift(0);
  }

  function triggerShake(amount, duration = 0.16) {
    state.shakeAmount = Math.max(state.shakeAmount, amount);
    state.shakeTimer = Math.max(state.shakeTimer, duration);
  }

  function setHint(text, duration = 2.6) {
    state.chef.hintText = text;
    state.chef.hintTimer = duration;
  }

  function stepStationTimers(dt, particles, audio) {
    const { chop, kettle, wok, pass } = state.stations;
    if (chop.slashFlash > 0) chop.slashFlash = Math.max(0, chop.slashFlash - dt);
    if (pass.bellRing > 0) pass.bellRing = Math.max(0, pass.bellRing - dt);

    // Kettle progression
    if (kettle.item && kettle.status !== 'overcooked') {
      kettle.elapsed += dt;
      kettle.bubblePhase += dt * 7;
      if (kettle.elapsed >= kettle.overcookSec) {
        kettle.status = 'overcooked';
        kettle.item = 'burnt_ash';
        particles?.emitSmoke(STATIONS.kettle.x + STATIONS.kettle.w / 2, STATIONS.kettle.y + 42, random);
        particles?.spawnCallout('BOILED OVER!', STATIONS.kettle.x + 106, STATIONS.kettle.y - 12, '#ff5f4c');
        audio?.playBurnWarn();
      } else if (kettle.elapsed >= kettle.cookSec && kettle.status === 'cooking') {
        kettle.status = 'ready';
        if (kettle.item === 'noodles') kettle.item = 'boiled_noodles';
        else if (kettle.item === 'rice') kettle.item = 'steamed_rice';
        else if (kettle.item === 'broth') kettle.item = 'simmered_broth';
        particles?.spawnCallout('KETTLE READY!', STATIONS.kettle.x + 106, STATIONS.kettle.y - 12, '#72e6a4');
      }
    }

    // Wok progression
    if (wok.flareTimer > 0) wok.flareTimer = Math.max(0, wok.flareTimer - dt);
    if (wok.item && wok.status !== 'burnt') {
      wok.elapsed += dt;
      if (wok.elapsed >= wok.burnSec) {
        wok.status = 'burnt';
        wok.item = 'burnt_ash';
        particles?.emitSmoke(STATIONS.wok.x + STATIONS.wok.w / 2, STATIONS.wok.y + 46, random);
        particles?.spawnCallout('SCORCHED!', STATIONS.wok.x + 109, STATIONS.wok.y - 12, '#ff483b');
        audio?.playBurnWarn();
      } else if (wok.elapsed >= wok.burnSec - 1.7 && wok.status !== 'burning') {
        wok.status = 'burning';
        audio?.playBurnWarn();
      } else if (wok.elapsed >= wok.cookSec && wok.status === 'searing') {
        wok.status = 'perfect';
        if (wok.item === 'chopped_pork') wok.item = 'seared_pork';
        else if (wok.item === 'chopped_shrimp') wok.item = 'seared_shrimp';
        else if (wok.item === 'chopped_tofu') wok.item = 'crispy_tofu';
        particles?.spawnCallout('WOK READY!', STATIONS.wok.x + 109, STATIONS.wok.y - 12, '#ffd773');
      }
    }
  }

  function stepAmbientParticles(dt, particles) {
    if (!particles) return;
    state.steamTick += dt;
    if (state.steamTick < 0.14) return;
    state.steamTick = 0;

    const { kettle, wok, plate, pass } = state.stations;
    if (kettle.item) {
      if (kettle.status === 'overcooked') {
        particles.emitSmoke(STATIONS.kettle.x + 106, STATIONS.kettle.y + 46, random);
      } else {
        particles.emitSteam(STATIONS.kettle.x + 106, STATIONS.kettle.y + 48, random);
      }
    }
    if (wok.item) {
      if (wok.status === 'burning' || wok.status === 'burnt') {
        particles.emitSmoke(STATIONS.wok.x + 109, STATIONS.wok.y + 52, random);
      } else {
        particles.emitSteam(STATIONS.wok.x + 109, STATIONS.wok.y + 54, random, 'rgba(255, 224, 175, 0.45)');
      }
    }
    if (plate.parts.length > 0) {
      particles.emitSteam(STATIONS.plate.x + 119, STATIONS.plate.y + 62, random, 'rgba(255, 250, 240, 0.36)');
    }
    pass.slots.forEach((slot, idx) => {
      if (slot) {
        const sx = STATIONS.pass.x + 68 + idx * 102;
        particles.emitSteam(sx, STATIONS.pass.y + 50, random, 'rgba(255, 250, 238, 0.48)');
      }
    });
  }

  function step(dt, moveDir = 0, particles = null, audio = null, dash = false) {
    state.elapsed += dt;
    if (state.shakeTimer > 0) {
      state.shakeTimer = Math.max(0, state.shakeTimer - dt);
      if (state.shakeTimer === 0) state.shakeAmount = 0;
    }
    if (state.chef.hintTimer > 0) state.chef.hintTimer = Math.max(0, state.chef.hintTimer - dt);
    if (state.chef.chopSwing > 0) state.chef.chopSwing = Math.max(0, state.chef.chopSwing - dt * 5);

    if (state.screen !== SCREEN_PLAY) {
      stepAmbientParticles(dt, particles);
      return { shiftEnded: false, expiredOrders: 0 };
    }

    // Chef horizontal movement via keyboard direction OR click target
    const chef = state.chef;
    const speedMult = dash ? CHEF_CONFIG.dashMultiplier : 1;
    if (moveDir !== 0) {
      chef.facing = moveDir;
      chef.x = Math.min(CHEF_CONFIG.maxX, Math.max(CHEF_CONFIG.minX, chef.x + moveDir * CHEF_CONFIG.speed * speedMult * dt));
      chef.targetX = chef.x;
      chef.walkPhase += dt * 13 * speedMult;
    } else if (Math.abs(chef.targetX - chef.x) > 4) {
      const dir = Math.sign(chef.targetX - chef.x);
      chef.facing = dir;
      const stepDist = Math.min(Math.abs(chef.targetX - chef.x), CHEF_CONFIG.speed * 1.15 * dt);
      chef.x += dir * stepDist;
      chef.walkPhase += dt * 13;
    }

    stepStationTimers(dt, particles, audio);
    stepAmbientParticles(dt, particles);

    // Order countdowns and spawning
    let expiredOrders = 0;
    for (let i = state.orders.length - 1; i >= 0; i -= 1) {
      const order = state.orders[i];
      if (order.enteredAnim > 0) order.enteredAnim = Math.max(0, order.enteredAnim - dt * 4);
      order.timeLeft -= dt;
      if (order.timeLeft <= 0) {
        state.orders.splice(i, 1);
        state.combo = 0;
        state.missedCount += 1;
        state.score = Math.max(0, state.score - 12);
        expiredOrders += 1;
        particles?.spawnCallout(`TICKET #${order.ticketNo} EXPIRED -$12`, 140 + i * 220, 182, '#ff6859');
        audio?.playError();
      }
    }

    const cfg = currentShiftConfig();
    state.orderSpawnTimer -= dt;
    if (state.orderSpawnTimer <= 0 || state.orders.length < 2) {
      const spawned = spawnOrder();
      if (spawned) audio?.playOrderSpawn();
      state.orderSpawnTimer = state.orders.length < 3 ? cfg.spawnEverySec * 0.55 : cfg.spawnEverySec;
    }

    // Shift timer check
    state.shiftTimeLeft = Math.max(0, state.shiftTimeLeft - dt);
    let shiftEnded = false;
    if (state.shiftTimeLeft <= 0) {
      shiftEnded = true;
      if (state.score > state.bestScore) state.bestScore = state.score;
      audio?.playShiftComplete();
      if (state.shiftIndex < SHIFTS.length - 1) {
        state.screen = SCREEN_UPGRADE;
      } else {
        state.screen = SCREEN_OVER;
      }
    }

    return { shiftEnded, expiredOrders };
  }

  return {
    state,
    currentShiftConfig,
    startShift,
    resetGame,
    spawnOrder,
    triggerShake,
    setHint,
    step,
  };
}
