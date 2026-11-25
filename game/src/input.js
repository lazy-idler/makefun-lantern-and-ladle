// Keyboard and mouse input controller for Lantern & Ladle.
// Supports both hotkeys (1-8, C/B/F/Space/Enter/X, WASD/Arrows) and
// direct canvas mouse clicks on pantry trays, stations, tickets, and overlays.

import { FIELD, PANTRY, STATIONS, TICKET_RAIL, UPGRADE_CATALOG } from './config.js';
import { INGREDIENTS } from './recipes.js';
import { SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_UPGRADE } from './kitchenState.js';

function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function createInputController(canvas, renderer) {
  let left = false;
  let right = false;
  let dashing = false;
  const queuedEvents = [];
  const hoverState = {
    hoveredStation: null,
    hoveredIngId: null,
    hoveredOrderId: null,
    hoveredUpgradeId: null,
  };

  function updateHover(wx, wy, state) {
    hoverState.hoveredStation = null;
    hoverState.hoveredIngId = null;
    hoverState.hoveredOrderId = null;
    hoverState.hoveredUpgradeId = null;

    if (state.screen === SCREEN_UPGRADE) {
      const boxX = (FIELD.width - 920) / 2;
      const boxY = 96;
      for (let i = 0; i < UPGRADE_CATALOG.length; i += 1) {
        const ux = boxX + 34 + (i % 2) * 432;
        const uy = boxY + 96 + Math.floor(i / 2) * 108;
        if (inRect(wx, wy, { x: ux, y: uy, w: 420, h: 94 })) {
          hoverState.hoveredUpgradeId = UPGRADE_CATALOG[i].id;
          return;
        }
      }
      return;
    }

    for (const key of ['chop', 'kettle', 'wok', 'plate', 'pass', 'hold', 'trash']) {
      if (inRect(wx, wy, STATIONS[key])) {
        hoverState.hoveredStation = key;
        return;
      }
    }

    for (let i = 0; i < INGREDIENTS.length; i += 1) {
      const tx = PANTRY.startX + i * (PANTRY.trayW + PANTRY.gap);
      if (inRect(wx, wy, { x: tx, y: PANTRY.trayY, w: PANTRY.trayW, h: PANTRY.trayH })) {
        hoverState.hoveredIngId = INGREDIENTS[i].id;
        return;
      }
    }

    for (let i = 0; i < state.orders.length; i += 1) {
      const ox = TICKET_RAIL.startX + i * (TICKET_RAIL.cardWidth + TICKET_RAIL.gap);
      if (inRect(wx, wy, { x: ox, y: TICKET_RAIL.y + 8, w: TICKET_RAIL.cardWidth, h: TICKET_RAIL.cardHeight })) {
        hoverState.hoveredOrderId = state.orders[i].id;
        return;
      }
    }
  }

  window.addEventListener('keydown', (event) => {
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
      left = true;
      event.preventDefault();
      return;
    }
    if (event.code === 'ArrowRight' || event.code === 'KeyD') {
      right = true;
      event.preventDefault();
      return;
    }
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
      dashing = true;
      return;
    }
    if (event.repeat) return;

    const code = event.code;
    if (code >= 'Digit1' && code <= 'Digit8') {
      queuedEvents.push({ type: 'digit', index: Number(code.slice(5)) - 1 });
    } else if (code === 'KeyC') {
      queuedEvents.push({ type: 'station', station: 'chop' });
    } else if (code === 'KeyB') {
      queuedEvents.push({ type: 'station', station: 'kettle' });
    } else if (code === 'KeyF') {
      queuedEvents.push({ type: 'station', station: 'wok' });
    } else if (code === 'KeyQ') {
      queuedEvents.push({ type: 'station', station: 'hold' });
    } else if (code === 'Space') {
      queuedEvents.push({ type: 'space' });
    } else if (code === 'Enter') {
      queuedEvents.push({ type: 'enter' });
    } else if (code === 'KeyX') {
      queuedEvents.push({ type: 'station', station: 'trash' });
    } else if (code === 'KeyE') {
      queuedEvents.push({ type: 'nearest' });
    } else if (code === 'KeyP' || code === 'Escape') {
      queuedEvents.push({ type: 'pause' });
    } else if (code === 'KeyH') {
      queuedEvents.push({ type: 'recipes' });
    } else if (code === 'KeyM') {
      queuedEvents.push({ type: 'mute' });
    } else {
      return;
    }
    event.preventDefault();
  });

  window.addEventListener('keyup', (event) => {
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') left = false;
    else if (event.code === 'ArrowRight' || event.code === 'KeyD') right = false;
    else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') dashing = false;
  });

  window.addEventListener('blur', () => {
    left = false;
    right = false;
    dashing = false;
  });

  canvas.addEventListener('pointermove', (event) => {
    const pt = renderer.screenToWorld(event.clientX, event.clientY);
    queuedEvents.push({ type: 'hover', x: pt.x, y: pt.y });
  });

  canvas.addEventListener('pointerdown', (event) => {
    const pt = renderer.screenToWorld(event.clientX, event.clientY);
    queuedEvents.push({ type: 'click', x: pt.x, y: pt.y });
  });

  function resolveClick(wx, wy, state) {
    if (inRect(wx, wy, renderer.hudButtons.recipes)) return { type: 'recipes' };
    if (inRect(wx, wy, renderer.hudButtons.mute)) return { type: 'mute' };
    if (inRect(wx, wy, renderer.hudButtons.pause)) return { type: 'pause' };

    if (state.showRecipeBook) return { type: 'recipes' };
    if (state.screen === SCREEN_TITLE || state.screen === SCREEN_OVER || state.screen === SCREEN_PAUSED) {
      return { type: 'confirm' };
    }

    if (state.screen === SCREEN_UPGRADE) {
      const boxX = (FIELD.width - 920) / 2;
      const boxY = 96;
      for (let i = 0; i < UPGRADE_CATALOG.length; i += 1) {
        const ux = boxX + 34 + (i % 2) * 432;
        const uy = boxY + 96 + Math.floor(i / 2) * 108;
        if (inRect(wx, wy, { x: ux, y: uy, w: 420, h: 94 })) {
          return { type: 'upgrade', id: UPGRADE_CATALOG[i].id };
        }
      }
      if (inRect(wx, wy, { x: FIELD.width / 2 - 175, y: boxY + 465, w: 350, h: 60 })) {
        return { type: 'confirm' };
      }
      return null;
    }

    if (state.screen !== SCREEN_PLAY) return null;

    for (let i = 0; i < INGREDIENTS.length; i += 1) {
      const tx = PANTRY.startX + i * (PANTRY.trayW + PANTRY.gap);
      if (inRect(wx, wy, { x: tx, y: PANTRY.trayY, w: PANTRY.trayW, h: PANTRY.trayH })) {
        return { type: 'pantry', id: INGREDIENTS[i].id };
      }
    }

    for (const key of ['chop', 'kettle', 'wok', 'plate', 'pass', 'hold', 'trash']) {
      if (inRect(wx, wy, STATIONS[key])) {
        return { type: 'station', station: key };
      }
    }

    for (let i = 0; i < state.orders.length; i += 1) {
      const ox = TICKET_RAIL.startX + i * (TICKET_RAIL.cardWidth + TICKET_RAIL.gap);
      if (inRect(wx, wy, { x: ox, y: TICKET_RAIL.y + 8, w: TICKET_RAIL.cardWidth, h: TICKET_RAIL.cardHeight })) {
        return { type: 'ticket', orderId: state.orders[i].id };
      }
    }

    return null;
  }

  return {
    direction() {
      return (right ? 1 : 0) - (left ? 1 : 0);
    },
    isDashing() {
      return dashing;
    },
    takeEvents(state) {
      const list = queuedEvents.splice(0, queuedEvents.length);
      const actions = [];
      for (const ev of list) {
        if (ev.type === 'hover') {
          updateHover(ev.x, ev.y, state);
        } else if (ev.type === 'click') {
          const resolved = resolveClick(ev.x, ev.y, state);
          if (resolved) actions.push(resolved);
        } else {
          actions.push(ev);
        }
      }
      return actions;
    },
    getHoverState() {
      return hoverState;
    },
  };
}
