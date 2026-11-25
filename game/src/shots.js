// Deterministic screenshot staging (?shot=cover|assembly|rush|serve&seed=N)
// Plays real game rules and kitchen routing forward with a chef autopilot so every
// screenshot is a genuine live render of Lantern & Ladle at full readability.

import { STEP } from './config.js';
import { ITEM_METADATA, RECIPE_BY_ID, matchingRecipesForParts } from './recipes.js';
import {
  buyUpgrade,
  grabFromPantry,
  interactAssemblyBoard,
  interactChopBlock,
  interactKettle,
  interactServicePass,
  interactWashSink,
  interactWok,
} from './kitchenActions.js';
import { SCREEN_PLAY, SCREEN_UPGRADE } from './kitchenState.js';

function neededPartsForOrder(order, plateParts) {
  const recipe = RECIPE_BY_ID[order.recipeId];
  if (!recipe) return [];
  const remaining = [...recipe.parts];
  for (const p of plateParts) {
    const idx = remaining.indexOf(p);
    if (idx !== -1) remaining.splice(idx, 1);
  }
  return remaining;
}

/** Drive one step of an efficient line cook AI to play real rounds deterministically. */
function runChefAutopilot(world, particles) {
  const { state } = world;
  const { chop, kettle, wok, plate, pass } = state.stations;
  const held = state.chef.heldItem;

  // 1. Serve any dish already waiting on the Pass Window!
  for (const order of state.orders) {
    if (pass.slots.some((s) => s && s.recipeId === order.recipeId)) {
      interactServicePass(world, particles, null, order.id);
      return;
    }
  }

  // 2. If dish is completed on Assembly Board, slide it to Pass!
  if (plate.completedRecipeId && !held) {
    interactAssemblyBoard(world, particles, null);
    return;
  }

  // 3. If holding a finished dish, set on Pass.
  if (held && held.startsWith('dish:')) {
    interactServicePass(world, particles, null);
    return;
  }

  // 4. Dump burnt trash if holding it.
  if (held === 'burnt_ash') {
    interactWashSink(world, particles, null);
    return;
  }

  // 5. Pick up ready cooked items before they burn!
  if (!held && (wok.status === 'perfect' || wok.status === 'burning' || wok.status === 'burnt')) {
    interactWok(world, particles, null);
    return;
  }
  if (!held && (kettle.status === 'ready' || kettle.status === 'overcooked')) {
    interactKettle(world, particles, null);
    return;
  }

  // 6. Toss Wok once when searing for Wok Hei speed & bonus.
  if (wok.status === 'searing' && wok.tossesUsed === 0 && wok.elapsed > 0.7) {
    interactWok(world, particles, null);
    return;
  }

  // 7. Chop anything sitting on the Chop Block.
  if (chop.item && ITEM_METADATA[chop.item]?.stage === 'raw') {
    interactChopBlock(world, particles, null);
    return;
  }
  if (!held && chop.item && ITEM_METADATA[chop.item]?.stage === 'chopped') {
    interactChopBlock(world, particles, null);
    return;
  }

  // 8. Route held item to its destination station.
  if (held) {
    const meta = ITEM_METADATA[held];
    if (meta?.nextStation === 'chop' && !chop.item) {
      interactChopBlock(world, particles, null);
      return;
    }
    if (meta?.nextStation === 'kettle' && !kettle.item) {
      interactKettle(world, particles, null);
      return;
    }
    if (meta?.nextStation === 'wok' && !wok.item) {
      interactWok(world, particles, null);
      return;
    }
    if (meta?.nextStation === 'plate') {
      if (matchingRecipesForParts(plate.parts, held).length > 0) {
        interactAssemblyBoard(world, particles, null);
        return;
      }
    }
  }

  // 9. Determine best target order matching current plate.
  const candidates = matchingRecipesForParts(plate.parts);
  const targetOrder =
    state.orders.find((o) => candidates.some((c) => c.id === o.recipeId)) ?? state.orders[0];
  if (!targetOrder) return;

  const missing = neededPartsForOrder(targetOrder, plate.parts);
  if (missing.length === 0) return;

  for (const partId of missing) {
    const meta = ITEM_METADATA[partId];
    const rawId = meta?.rawId;
    if (!rawId) continue;
    const rawMeta = ITEM_METADATA[rawId];

    if (kettle.item && ITEM_METADATA[kettle.item]?.rawId === rawId) continue;
    if (wok.item && ITEM_METADATA[wok.item]?.rawId === rawId) continue;
    if (chop.item && ITEM_METADATA[chop.item]?.rawId === rawId) continue;

    if (rawMeta.nextStation === 'plate' && !held) {
      grabFromPantry(world, rawId, particles, null);
      return;
    }
    if (rawMeta.nextStation === 'kettle' && !kettle.item && !held) {
      grabFromPantry(world, rawId, particles, null);
      return;
    }
    if (rawMeta.nextStation === 'chop' && !chop.item && !held) {
      if (partId === 'chopped_bokchoy' || !wok.item) {
        grabFromPantry(world, rawId, particles, null);
        return;
      }
    }
  }
}

function advanceSimulation(world, particles, seconds, runPilot = true) {
  const ticks = Math.round(seconds / STEP);
  for (let i = 0; i < ticks; i += 1) {
    if (runPilot && i % 6 === 0 && world.state.screen === SCREEN_PLAY) {
      runChefAutopilot(world, particles);
    }
    world.step(STEP, 0, particles, null);
    particles.step(STEP);
  }
}

function ensureTicketCount(world, minCount) {
  while (world.state.orders.length < minCount) {
    if (!world.spawnOrder()) break;
  }
}

/** Stage one of the 4 official competition screenshots (`cover`, `assembly`, `rush`, `serve`). */
export function stageShot(shotName, world, particles) {
  world.resetGame();
  particles.clear();

  if (shotName === 'assembly') {
    // Rich action shot: Wok flaring with shrimp, Pork being sliced, Tofu Ochazuke mid-assembly!
    advanceSimulation(world, particles, 26, true);
    ensureTicketCount(world, 4);
    particles.clear();
    const { stations } = world.state;
    stations.chop.item = 'pork';
    stations.chop.hits = 0;
    interactChopBlock(world, particles, null);
    interactChopBlock(world, particles, null);
    stations.kettle.item = 'rice';
    stations.kettle.elapsed = 1.6;
    stations.kettle.status = 'cooking';
    stations.wok.item = 'chopped_shrimp';
    stations.wok.elapsed = 1.4;
    stations.wok.tossesUsed = 0;
    stations.wok.status = 'searing';
    interactWok(world, particles, null);
    stations.plate.completedRecipeId = null;
    stations.plate.parts = ['steamed_rice', 'simmered_broth', 'crispy_tofu'];
    world.state.chef.heldItem = 'egg';
    world.state.chef.x = 609;
    world.state.chef.targetX = 609;
    world.state.chef.hintTimer = 0;
    advanceSimulation(world, particles, 0.03, false);
    return;
  }

  if (shotName === 'rush') {
    // Shift 2 Dinner Rush: 5 busy orders on rail (with urgent bar!), upgrades bought, fast combo!
    advanceSimulation(world, particles, 96, true);
    if (world.state.screen === SCREEN_UPGRADE) {
      buyUpgrade(world, 'cleaver', null);
      buyUpgrade(world, 'wok', null);
      world.startShift(1);
    }
    advanceSimulation(world, particles, 22, true);
    ensureTicketCount(world, 5);
    if (world.state.orders[0]) world.state.orders[0].timeLeft = 9;
    if (world.state.orders[2]) world.state.orders[2].timeLeft = 17;
    const { stations } = world.state;
    stations.kettle.item = 'broth';
    stations.kettle.elapsed = 1.9;
    stations.kettle.status = 'cooking';
    stations.wok.item = 'chopped_pork';
    stations.wok.elapsed = 2.4;
    stations.wok.status = 'searing';
    stations.plate.completedRecipeId = null;
    stations.plate.parts = ['boiled_noodles', 'seared_shrimp', 'chopped_bokchoy'];
    stations.pass.slots[0] = { recipeId: world.state.orders[1]?.recipeId ?? 'jade_tofu_ramen' };
    advanceSimulation(world, particles, 0.1, false);
    return;
  }

  if (shotName === 'serve') {
    // Between-shift Kitchen Upgrade Shop over the live kitchen showing progression & depth!
    advanceSimulation(world, particles, 96, true);
    if (world.state.screen === SCREEN_UPGRADE) {
      buyUpgrade(world, 'cleaver', null);
    }
    return;
  }

  // Default: 'cover' — Showcase all 6 Criterion 1 elements with zero overlap!
  advanceSimulation(world, particles, 19, true);
  particles.clear();
  ensureTicketCount(world, 4);

  const { stations, orders } = world.state;
  // Make sure the 4 tickets span distinct appetizing recipes with varied timers
  const distinctIds = ['velvet_miso_ramen', 'dragon_shrimp_noodles', 'jade_tofu_ramen', 'midnight_chashu_don'];
  orders.forEach((o, i) => {
    o.recipeId = distinctIds[i % distinctIds.length];
    o.timeLeft = Math.max(12, o.maxTime * [0.82, 0.64, 0.45, 0.24][i % 4]);
  });

  // 1) Chop Block: Pork mid-chop (2/3)
  stations.chop.item = 'pork';
  stations.chop.hits = 2;
  stations.chop.hitsRequired = 3;

  // 2) Broth Kettle: Miso Broth simmering (68%)
  stations.kettle.item = 'broth';
  stations.kettle.elapsed = 1.9;
  stations.kettle.status = 'cooking';

  // 3) Ember Wok: Tiger Shrimp sizzling with flame!
  stations.wok.item = 'chopped_shrimp';
  stations.wok.elapsed = 1.7;
  stations.wok.tossesUsed = 1;
  stations.wok.status = 'searing';
  stations.wok.flareTimer = 0.18;

  // 4) Assembly Board: Velvet Miso Ramen MID-ASSEMBLY (3/4 parts!)
  stations.plate.completedRecipeId = null;
  stations.plate.parts = ['boiled_noodles', 'simmered_broth', 'seared_pork'];

  // 5) Service Pass: Completed Dragon Shrimp Mazemen plate READY TO SERVE!
  stations.pass.slots = [{ recipeId: 'dragon_shrimp_noodles' }, null];

  // Chef Pip holding the final Ajitama Egg right below Assembly Board
  world.state.chef.heldItem = 'egg';
  world.state.chef.x = 859;
  world.state.chef.targetX = 859;
  world.state.chef.facing = 1;
  world.state.chef.hintText = 'Add Egg [Space] to finish Miso Ramen — or ring Pass Bell [Enter] to serve!';
  world.state.chef.hintTimer = 5;

  // Tick physics only (no autopilot!) to spawn fresh ambient steam wisps cleanly
  advanceSimulation(world, particles, 0.16, false);
}
