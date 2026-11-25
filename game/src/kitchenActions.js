// Route-planning player actions for Lantern & Ladle: grabbing pantry trays,
// rhythmic chopping, boiling/simmering in the kettle, tossing the wok, layering
// dishes on the assembly board, ringing the service bell, and clearing waste.

import { COOKING_TIMES, STATIONS, UPGRADE_CATALOG } from './config.js';
import {
  ITEM_METADATA,
  RECIPE_BY_ID,
  findCompletedRecipe,
  isPlateReadyPart,
  matchingRecipesForParts,
  resolvePickupItem,
} from './recipes.js';

function stationCenter(station) {
  return { x: station.x + station.w / 2, y: station.y + 42 };
}

export function grabFromPantry(world, ingredientId, particles, audio) {
  const { state } = world;
  const item = resolvePickupItem(ingredientId);
  if (!item) return false;

  const held = state.chef.heldItem;
  if (held && held.startsWith('dish:')) {
    world.setHint('Set your plated dish on the Service Pass first!');
    audio?.playError();
    return false;
  }
  if (held && ITEM_METADATA[held]?.stage === 'ready' && held !== item) {
    world.setHint('Plate or sink your cooked ingredient first!');
    audio?.playError();
    return false;
  }

  state.chef.heldItem = item;
  const meta = ITEM_METADATA[item];
  world.setHint(`Holding ${meta.label} -> bring to ${meta.nextStation.toUpperCase()}`);
  audio?.playPickup();
  return true;
}

export function interactChopBlock(world, particles, audio) {
  const { state } = world;
  const { chop } = state.stations;
  const held = state.chef.heldItem;
  const center = stationCenter(STATIONS.chop);
  state.chef.targetX = STATIONS.chop.interactX;
  state.chef.lastStation = 'chop';

  // Place raw choppable ingredient onto an empty board.
  if (!chop.item) {
    if (held && ITEM_METADATA[held]?.nextStation === 'chop') {
      chop.item = held;
      chop.hits = 0;
      chop.hitsRequired = state.upgrades.cleaver ? 2 : COOKING_TIMES.chopHitsRequired;
      state.chef.heldItem = null;
      world.setHint('Tap CHOP [C] or click board to slice!');
      audio?.playPickup();
      return true;
    }
    world.setHint('Bring Pork, Shrimp, Tofu, or Bok Choy to chop.');
    return false;
  }

  // Chop if still raw.
  if (ITEM_METADATA[chop.item]?.stage === 'raw') {
    chop.hits += 1;
    chop.slashFlash = 0.16;
    state.chef.chopSwing = 1;
    const burstColor = ITEM_METADATA[chop.item]?.color ?? '#f5d27a';
    particles?.emitChopBurst(center.x, center.y + 44, burstColor, Math.random);
    audio?.playChop(chop.hits);

    if (chop.hits >= chop.hitsRequired) {
      chop.item = `chopped_${chop.item}`;
      const next = ITEM_METADATA[chop.item]?.nextStation?.toUpperCase() ?? 'PLATE';
      particles?.spawnCallout('CHOPPED!', center.x, STATIONS.chop.y - 12, '#72e6a4');
      world.setHint(`Prepped! Take ${ITEM_METADATA[chop.item].label} to ${next}.`);
      // Auto-grab into empty hand so fast players flow effortlessly into Wok/Plate!
      if (!state.chef.heldItem) {
        state.chef.heldItem = chop.item;
        chop.item = null;
        chop.hits = 0;
      }
    }
    return true;
  }

  // Pick up finished chopped item if left on board.
  if (!state.chef.heldItem) {
    state.chef.heldItem = chop.item;
    chop.item = null;
    chop.hits = 0;
    audio?.playPickup();
    return true;
  }

  world.setHint('Hands full — free your hand before taking from Chop Block.');
  audio?.playError();
  return false;
}

export function interactKettle(world, particles, audio) {
  const { state } = world;
  const { kettle } = state.stations;
  const held = state.chef.heldItem;
  const center = stationCenter(STATIONS.kettle);
  state.chef.targetX = STATIONS.kettle.interactX;
  state.chef.lastStation = 'kettle';

  if (!kettle.item) {
    if (held && ITEM_METADATA[held]?.nextStation === 'kettle') {
      kettle.item = held;
      kettle.elapsed = 0;
      kettle.status = 'cooking';
      kettle.cookSec = state.upgrades.kettle ? COOKING_TIMES.kettleCookSec * 0.7 : COOKING_TIMES.kettleCookSec;
      state.chef.heldItem = null;
      particles?.emitSteam(center.x, center.y + 10, Math.random);
      world.setHint(`Simmering ${ITEM_METADATA[held].label}...`);
      audio?.playKettleStart();
      return true;
    }
    world.setHint('Load Noodles, Rice, or Miso Stock into the Broth Kettle.');
    return false;
  }

  if (kettle.status === 'ready' || kettle.status === 'overcooked') {
    if (!held) {
      state.chef.heldItem = kettle.item;
      kettle.item = null;
      kettle.elapsed = 0;
      kettle.status = 'idle';
      audio?.playPickup();
      if (state.chef.heldItem === 'burnt_ash') {
        world.setHint('Dump boiled-over scrap in the Wash Sink [X]!');
      } else {
        world.setHint(`Scooped ${ITEM_METADATA[state.chef.heldItem].label} -> Assembly Board [Space]`);
      }
      return true;
    }
    world.setHint('Free your hand before scooping from the Kettle.');
    audio?.playError();
    return false;
  }

  world.setHint('Kettle is still simmering...');
  return false;
}

export function interactWok(world, particles, audio) {
  const { state } = world;
  const { wok } = state.stations;
  const held = state.chef.heldItem;
  const center = stationCenter(STATIONS.wok);
  state.chef.targetX = STATIONS.wok.interactX;
  state.chef.lastStation = 'wok';

  if (!wok.item) {
    if (held && ITEM_METADATA[held]?.nextStation === 'wok') {
      wok.item = held;
      wok.elapsed = 0;
      wok.tossesUsed = 0;
      wok.status = 'searing';
      wok.burnSec = state.upgrades.wok ? COOKING_TIMES.wokBurnSec + 1.8 : COOKING_TIMES.wokBurnSec;
      state.chef.heldItem = null;
      particles?.emitWokFlare(center.x, center.y + 18, Math.random, 10);
      world.setHint('Searing! Tap [F] to Wok Toss for speed + Wok Hei!');
      audio?.playWokSizzle();
      return true;
    }
    if (held && ITEM_METADATA[held]?.nextStation === 'chop') {
      world.setHint('Chop it on the Chop Block [C] before searing in the Wok!');
      audio?.playError();
      return false;
    }
    world.setHint('Bring chopped Pork, Shrimp, or Tofu to sear in the Ember Wok.');
    return false;
  }

  if (wok.status === 'searing') {
    const boost = state.upgrades.wok ? COOKING_TIMES.wokTossBoostSec * 1.35 : COOKING_TIMES.wokTossBoostSec;
    wok.elapsed += boost;
    wok.flareTimer = 0.25;
    particles?.emitWokFlare(center.x, center.y + 12, Math.random, 16);
    world.triggerShake(3.5, 0.14);
    audio?.playWokToss();
    if (wok.tossesUsed < 2) {
      wok.tossesUsed += 1;
      state.score += 3;
      state.shiftScore += 3;
      state.tipsEarned += 3;
      particles?.spawnCallout('WOK HEI! +$3', center.x, STATIONS.wok.y - 12, '#ffb84d');
    }
    if (wok.elapsed >= wok.cookSec) {
      wok.status = 'perfect';
      if (wok.item === 'chopped_pork') wok.item = 'seared_pork';
      else if (wok.item === 'chopped_shrimp') wok.item = 'seared_shrimp';
      else if (wok.item === 'chopped_tofu') wok.item = 'crispy_tofu';
    }
    return true;
  }

  if (wok.status === 'perfect' || wok.status === 'burning' || wok.status === 'burnt') {
    if (!held) {
      state.chef.heldItem = wok.item;
      const wasReady = wok.status === 'perfect' || wok.status === 'burning';
      wok.item = null;
      wok.elapsed = 0;
      wok.status = 'idle';
      wok.tossesUsed = 0;
      audio?.playPickup();
      if (wasReady && ITEM_METADATA[state.chef.heldItem]?.stage === 'ready') {
        world.setHint(`Plucked ${ITEM_METADATA[state.chef.heldItem].label} -> Plate it [Space]!`);
      } else {
        // Handle edge case where wok was still burning before converting to burnt_ash
        if (state.chef.heldItem === 'chopped_pork') state.chef.heldItem = 'seared_pork';
        else if (state.chef.heldItem === 'chopped_shrimp') state.chef.heldItem = 'seared_shrimp';
        else if (state.chef.heldItem === 'chopped_tofu') state.chef.heldItem = 'crispy_tofu';
        if (state.chef.heldItem === 'burnt_ash') world.setHint('Toss burnt scrap into the Wash Sink [X]!');
      }
      return true;
    }
    world.setHint('Hands full — plate or sink held item first.');
    audio?.playError();
    return false;
  }

  return false;
}

export function interactAssemblyBoard(world, particles, audio) {
  const { state } = world;
  const { plate, pass } = state.stations;
  const held = state.chef.heldItem;
  const center = stationCenter(STATIONS.plate);
  state.chef.targetX = STATIONS.plate.interactX;
  state.chef.lastStation = 'plate';

  // If dish is already completed on Assembly Board, lift or auto-slide to Service Pass.
  if (plate.completedRecipeId) {
    const emptySlot = pass.slots.findIndex((s) => s === null);
    if (emptySlot !== -1 && !held) {
      pass.slots[emptySlot] = { recipeId: plate.completedRecipeId };
      const recipe = RECIPE_BY_ID[plate.completedRecipeId];
      plate.parts = [];
      plate.completedRecipeId = null;
      particles?.spawnCallout(`${recipe.shortName} ON PASS!`, STATIONS.pass.x + 120, STATIONS.pass.y - 14, '#72e6a4');
      world.setHint(`${recipe.name} on Pass Window! Ring Service Bell [Enter] to serve!`);
      audio?.playDishComplete();
      return true;
    }
    if (!held) {
      state.chef.heldItem = `dish:${plate.completedRecipeId}`;
      plate.parts = [];
      plate.completedRecipeId = null;
      audio?.playPickup();
      world.setHint('Carry finished dish to the Service Pass [Enter]!');
      return true;
    }
    world.setHint('Service Pass full — serve a waiting plate first!');
    audio?.playError();
    return false;
  }

  if (!held || !isPlateReadyPart(held)) {
    if (held && ITEM_METADATA[held]?.stage === 'raw') {
      world.setHint(`Prep ${ITEM_METADATA[held].label} at ${ITEM_METADATA[held].nextStation.toUpperCase()} first!`);
    } else if (held && ITEM_METADATA[held]?.stage === 'chopped') {
      world.setHint(`Sear ${ITEM_METADATA[held].label} in the Ember Wok [F] first!`);
    } else {
      world.setHint('Bring cooked Noodles, Rice, Broth, Seared Protein, Greens, or Egg here.');
    }
    audio?.playError();
    return false;
  }

  const candidates = matchingRecipesForParts(plate.parts, held);
  if (candidates.length === 0) {
    world.setHint(`${ITEM_METADATA[held].label} doesn't match the current bowl!`);
    audio?.playError();
    return false;
  }

  plate.parts.push(held);
  state.chef.heldItem = null;
  particles?.emitChopBurst(center.x, center.y + 38, ITEM_METADATA[held].color, Math.random);

  const completed = findCompletedRecipe(plate.parts);
  if (completed) {
    plate.completedRecipeId = completed.id;
    particles?.emitServeBurst(center.x, center.y + 36, Math.random);
    particles?.spawnCallout(`${completed.shortName.toUpperCase()} PLATED!`, center.x, STATIONS.plate.y - 12, '#ffd773');
    world.setHint(`${completed.name} finished! Click Assembly or Pass [Enter] to serve!`);
    audio?.playDishComplete();
  } else {
    particles?.spawnCallout(`+ ${ITEM_METADATA[held].label}`, center.x, STATIONS.plate.y - 10, '#fdf7ec', 0.88);
    world.setHint(`${candidates.length} matching recipe(s) — add next ingredient!`);
    audio?.playPlateLayer();
  }
  return true;
}

export function interactServicePass(world, particles, audio, preferredOrderId = null) {
  const { state } = world;
  const { pass, plate } = state.stations;
  const held = state.chef.heldItem;
  state.chef.targetX = STATIONS.pass.interactX;
  state.chef.lastStation = 'pass';

  // If holding a finished dish, place on Service Pass first.
  if (held && held.startsWith('dish:')) {
    const recipeId = held.slice(5);
    const emptySlot = pass.slots.findIndex((s) => s === null);
    if (emptySlot === -1) {
      world.setHint('Service Pass slots full — ring Bell to serve an order first!');
      audio?.playError();
      return false;
    }
    pass.slots[emptySlot] = { recipeId };
    state.chef.heldItem = null;
    audio?.playPlateLayer();
  } else if (plate.completedRecipeId && pass.slots.some((s) => s === null)) {
    // Allow one-click serve directly if a finished bowl is sitting on Assembly Board.
    const emptySlot = pass.slots.findIndex((s) => s === null);
    pass.slots[emptySlot] = { recipeId: plate.completedRecipeId };
    plate.parts = [];
    plate.completedRecipeId = null;
  }

  // Try serving a ready plate against matching ticket (preferred ticket first, else oldest).
  let servedSlot = -1;
  let servedOrderIdx = -1;

  if (preferredOrderId !== null) {
    const idx = state.orders.findIndex((o) => o.id === preferredOrderId);
    if (idx !== -1) {
      const slot = pass.slots.findIndex((s) => s && s.recipeId === state.orders[idx].recipeId);
      if (slot !== -1) {
        servedSlot = slot;
        servedOrderIdx = idx;
      }
    }
  }

  if (servedOrderIdx === -1) {
    for (let i = 0; i < state.orders.length; i += 1) {
      const order = state.orders[i];
      const slot = pass.slots.findIndex((s) => s && s.recipeId === order.recipeId);
      if (slot !== -1) {
        servedSlot = slot;
        servedOrderIdx = i;
        break;
      }
    }
  }

  if (servedOrderIdx === -1) {
    if (pass.slots.some((s) => s !== null)) {
      world.setHint('Dish ready on Pass — waiting for matching customer ticket!');
    } else {
      world.setHint('Finish plating a dish at the Assembly Board before ringing the Bell!');
    }
    audio?.playError();
    return false;
  }

  const order = state.orders[servedOrderIdx];
  const recipe = RECIPE_BY_ID[order.recipeId];
  const slotObj = pass.slots[servedSlot];
  pass.slots[servedSlot] = null;
  pass.bellRing = 0.5;
  state.orders.splice(servedOrderIdx, 1);

  state.combo += 1;
  state.maxCombo = Math.max(state.maxCombo, state.combo);
  state.servedCount += 1;

  const patienceRatio = Math.max(0, order.timeLeft / order.maxTime);
  const speedTip = Math.round(recipe.tipBonus * (0.4 + 0.8 * patienceRatio)) + (state.upgrades.heatlamp ? 6 : 0);
  const comboMult = 1 + Math.min(state.combo - 1, 4) * 0.2;
  const payout = Math.round((recipe.basePay + speedTip) * comboMult);

  state.score += payout;
  state.shiftScore += payout;
  state.tipsEarned += speedTip;
  if (state.score > state.bestScore) state.bestScore = state.score;

  const passCenter = stationCenter(STATIONS.pass);
  particles?.emitServeBurst(passCenter.x, passCenter.y + 14, Math.random);
  const comboLabel = state.combo >= 2 ? ` (${state.combo}x COMBO!)` : '';
  particles?.spawnCallout(`SERVED #${order.ticketNo} +$${payout}${comboLabel}`, passCenter.x - 10, STATIONS.pass.y - 16, '#4cd98c', 1.1);
  world.triggerShake(4.5, 0.18);
  world.setHint(`Served ${recipe.name}! +$${payout}${comboLabel}`);
  audio?.playServeBell(state.combo);
  return true;
}

export function interactWashSink(world, particles, audio) {
  const { state } = world;
  const { chop, kettle, wok, plate } = state.stations;
  const center = stationCenter(STATIONS.trash);
  state.chef.targetX = STATIONS.trash.interactX;
  state.chef.lastStation = 'trash';

  if (state.chef.heldItem) {
    const wasBurnt = state.chef.heldItem === 'burnt_ash';
    state.chef.heldItem = null;
    if (!wasBurnt) {
      state.score = Math.max(0, state.score - 5);
      particles?.spawnCallout('CLEARED -$5', center.x, center.y, '#e8a235');
    } else {
      particles?.spawnCallout('SCRUBBED!', center.x, center.y, '#9fd3e8');
    }
    audio?.playTrash();
    return true;
  }

  // If hands empty, quick-scrub burnt wok/kettle or clear incomplete plate.
  if (wok.status === 'burnt') {
    wok.item = null;
    wok.elapsed = 0;
    wok.status = 'idle';
    particles?.spawnCallout('WOK CLEANED!', center.x, center.y, '#9fd3e8');
    audio?.playTrash();
    return true;
  }
  if (kettle.status === 'overcooked') {
    kettle.item = null;
    kettle.elapsed = 0;
    kettle.status = 'idle';
    particles?.spawnCallout('KETTLE RINSED!', center.x, center.y, '#9fd3e8');
    audio?.playTrash();
    return true;
  }
  if (plate.parts.length > 0 && !plate.completedRecipeId) {
    plate.parts = [];
    state.score = Math.max(0, state.score - 5);
    particles?.spawnCallout('BOWL RESET -$5', center.x, center.y, '#e8a235');
    audio?.playTrash();
    return true;
  }
  if (chop.item) {
    chop.item = null;
    chop.hits = 0;
    audio?.playTrash();
    return true;
  }
  return false;
}

export function interactNearestStation(world, particles, audio) {
  const { chef } = world.state;
  const candidates = [
    { key: 'chop', x: STATIONS.chop.interactX, fn: interactChopBlock },
    { key: 'kettle', x: STATIONS.kettle.interactX, fn: interactKettle },
    { key: 'wok', x: STATIONS.wok.interactX, fn: interactWok },
    { key: 'plate', x: STATIONS.plate.interactX, fn: interactAssemblyBoard },
    { key: 'pass', x: STATIONS.pass.interactX, fn: interactServicePass },
  ];
  let best = candidates[0];
  let bestDist = Infinity;
  for (const c of candidates) {
    const d = Math.abs(chef.x - c.x);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best.fn(world, particles, audio);
}

export function buyUpgrade(world, upgradeId, audio) {
  const { state } = world;
  const spec = UPGRADE_CATALOG.find((u) => u.id === upgradeId);
  if (!spec || state.upgrades[upgradeId]) return false;
  if (state.score < spec.cost) {
    audio?.playError();
    return false;
  }
  state.score -= spec.cost;
  state.upgrades[upgradeId] = true;
  audio?.playServeBell(2);
  return true;
}
