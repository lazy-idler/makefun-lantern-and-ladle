// Entry loop for Sesame & Flame: boots world state, audio synthesizer,
// input controller, renderer, fixed-timestep update loop, and ?shot harness.

import { BEST_STORAGE_KEY, MAX_FRAME, STEP } from './config.js';
import { INGREDIENTS } from './recipes.js';
import { createAudioEngine } from './audio.js';
import { createParticleSystem } from './kitchenParticles.js';
import { createKitchenState, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_UPGRADE } from './kitchenState.js';
import {
  buyUpgrade,
  grabFromPantry,
  interactAssemblyBoard,
  interactChopBlock,
  interactKettle,
  interactNearestStation,
  interactServicePass,
  interactSideTray,
  interactWashSink,
  interactWok,
} from './kitchenActions.js';
import { createRenderer } from './render.js';
import { createInputController } from './input.js';
import { stageShot } from './shots.js';

function createSeededRandom(seed) {
  let s = seed | 0;
  return function random() {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function readBestScore() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_STORAGE_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBestScore(score) {
  try {
    window.localStorage.setItem(BEST_STORAGE_KEY, String(score));
  } catch {
    // Private browsing mode may disable localStorage.
  }
}

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');

const random = createSeededRandom(seed);
const world = createKitchenState(random);
world.state.bestScore = readBestScore();

const particles = createParticleSystem();
const audio = createAudioEngine();
const renderer = createRenderer(canvas);

function announce(message) {
  if (statusEl) statusEl.textContent = message;
}

function runShotMode(name) {
  stageShot(name, world, particles);
  let frames = 0;
  function paintShot() {
    renderer.draw(world.state, particles, { muted: false });
    frames += 1;
    if (frames < 2) {
      requestAnimationFrame(paintShot);
    } else {
      window.__shotReady = true;
    }
  }
  requestAnimationFrame(paintShot);
}

function runInteractiveGame() {
  const input = createInputController(canvas, renderer);
  let accumulator = 0;
  let lastTime = performance.now();

  // Stage an atmospheric live background behind the title screen.
  world.spawnOrder();
  world.spawnOrder();
  world.spawnOrder();

  function dispatchStationAction(stationKey) {
    if (stationKey === 'chop') interactChopBlock(world, particles, audio);
    else if (stationKey === 'kettle') interactKettle(world, particles, audio);
    else if (stationKey === 'wok') interactWok(world, particles, audio);
    else if (stationKey === 'plate') interactAssemblyBoard(world, particles, audio);
    else if (stationKey === 'pass') interactServicePass(world, particles, audio);
    else if (stationKey === 'hold') interactSideTray(world, particles, audio);
    else if (stationKey === 'trash') interactWashSink(world, particles, audio);
  }

  function processActions() {
    const actions = input.takeEvents(world.state);
    const { state } = world;
    for (const act of actions) {
      audio.unlock();

      if (act.type === 'mute') {
        const muted = audio.toggleMute();
        announce(muted ? 'Sound muted.' : 'Sound enabled.');
        continue;
      }
      if (act.type === 'recipes') {
        if (state.screen === SCREEN_PLAY || state.screen === SCREEN_PAUSED) {
          state.showRecipeBook = !state.showRecipeBook;
        }
        continue;
      }
      if (act.type === 'pause') {
        if (state.showRecipeBook) {
          state.showRecipeBook = false;
        } else if (state.screen === SCREEN_PLAY) {
          state.screen = SCREEN_PAUSED;
          announce('Game paused.');
        } else if (state.screen === SCREEN_PAUSED) {
          state.screen = SCREEN_PLAY;
          announce('Game resumed.');
        }
        continue;
      }

      if (state.screen === SCREEN_TITLE || state.screen === SCREEN_OVER) {
        if (act.type === 'space' || act.type === 'enter' || act.type === 'confirm') {
          particles.clear();
          world.resetGame();
          audio.playServeBell(1);
          announce('Shift 1 started!');
        }
        continue;
      }

      if (state.screen === SCREEN_PAUSED) {
        if (act.type === 'space' || act.type === 'confirm') {
          state.screen = SCREEN_PLAY;
          announce('Game resumed.');
        }
        continue;
      }

      if (state.screen === SCREEN_UPGRADE) {
        if (act.type === 'digit' && act.index < 4) {
          const ids = ['cleaver', 'kettle', 'wok', 'heatlamp'];
          buyUpgrade(world, ids[act.index], audio);
        } else if (act.type === 'upgrade') {
          buyUpgrade(world, act.id, audio);
        } else if (act.type === 'space' || act.type === 'enter' || act.type === 'confirm') {
          world.startShift(state.shiftIndex + 1);
          audio.playServeBell(1);
          announce(`Shift ${state.shiftIndex + 1} started!`);
        }
        continue;
      }

      if (state.screen === SCREEN_PLAY && !state.showRecipeBook) {
        if (act.type === 'digit' && act.index < INGREDIENTS.length) {
          grabFromPantry(world, INGREDIENTS[act.index].id, particles, audio);
        } else if (act.type === 'pantry') {
          grabFromPantry(world, act.id, particles, audio);
        } else if (act.type === 'station') {
          dispatchStationAction(act.station);
        } else if (act.type === 'space') {
          interactAssemblyBoard(world, particles, audio);
        } else if (act.type === 'enter') {
          interactServicePass(world, particles, audio);
        } else if (act.type === 'nearest') {
          interactNearestStation(world, particles, audio);
        } else if (act.type === 'ticket') {
          interactServicePass(world, particles, audio, act.orderId);
        }
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const rawDelta = Math.min((now - lastTime) / 1000, MAX_FRAME);
    lastTime = now;
    processActions();

    if (world.state.screen === SCREEN_PLAY && !world.state.showRecipeBook) {
      accumulator += rawDelta;
      const moveDir = input.direction();
      const dash = input.isDashing();
      while (accumulator >= STEP) {
        const res = world.step(STEP, moveDir, particles, audio, dash);
        particles.step(STEP);
        accumulator -= STEP;
        if (res.shiftEnded) {
          saveBestScore(world.state.bestScore);
          announce(`Shift complete. Total earnings $${world.state.score}.`);
          break;
        }
      }
    } else {
      accumulator = 0;
    }

    const hover = input.getHoverState();
    renderer.draw(world.state, particles, {
      ...hover,
      muted: audio.isMuted(),
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && world.state.screen === SCREEN_PLAY) {
      world.state.screen = SCREEN_PAUSED;
      announce('Game paused.');
    }
  });

  announce('Sesame and Flame ready. Press Space or click Open Kitchen to play.');
  requestAnimationFrame(frame);
}

if (shotName) runShotMode(shotName);
else runInteractiveGame();
