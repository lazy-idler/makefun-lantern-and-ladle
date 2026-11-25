// Top-level frame composer for Sesame & Flame: scales the 1280x720 playfield,
// draws kitchen world, particles, HUD, 10-dish recipe codex, upgrade shop, title, and summary screens.

import { FIELD, FONT_MONO, FONT_UI, HUD_BAR, PALETTE, SHIFTS, UPGRADE_CATALOG } from './config.js';
import { RECIPES, ITEM_METADATA } from './recipes.js';
import { drawDishBowl, drawIngredientIcon } from './artFood.js';
import { drawChef, drawKitchenBackdrop, drawPantryCounter, drawStations, drawTicketRail } from './artKitchen.js';
import { SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_UPGRADE } from './kitchenState.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function formatClock(sec) {
  const s = Math.max(0, Math.ceil(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };

  const hudButtons = {
    recipes: { x: 966, y: 11, w: 108, h: 32 },
    mute: { x: 1084, y: 11, w: 86, h: 32 },
    pause: { x: 1180, y: 11, w: 80, h: 32 },
  };

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  function screenToWorld(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const px = (clientX - rect.left) * ratio;
    const py = (clientY - rect.top) * ratio;
    return {
      x: (px - view.x) / view.scale,
      y: (py - view.y) / view.scale,
    };
  }

  function drawHud(state, muted) {
    ctx.fillStyle = PALETTE.hudBg;
    ctx.fillRect(0, 0, FIELD.width, HUD_BAR.height);
    ctx.fillStyle = PALETTE.hudBorder;
    ctx.fillRect(0, HUD_BAR.height - 2, FIELD.width, 2);

    // Brand crest & active shift pill
    ctx.fillStyle = '#c95335';
    roundRect(ctx, 16, 10, 34, 34, 8);
    ctx.fill();
    ctx.fillStyle = '#ffd773';
    ctx.beginPath();
    ctx.arc(33, 27, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c95335';
    ctx.beginPath();
    ctx.arc(33, 27, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.textLight;
    ctx.font = `900 17px ${FONT_UI}`;
    ctx.fillText('SESAME & FLAME', 58, 24);

    const shiftCfg = SHIFTS[Math.min(state.shiftIndex, SHIFTS.length - 1)];
    ctx.fillStyle = '#ffd773';
    ctx.font = `700 11px ${FONT_UI}`;
    ctx.fillText(`SHIFT ${shiftCfg.shift}/${SHIFTS.length} · ${shiftCfg.name.toUpperCase()}`, 58, 41);

    // Score, Goal, Combo, Served pills
    const pills = [
      { x: 274, w: 136, label: 'EARNINGS', value: `$${state.score}`, color: '#4cd98c' },
      { x: 422, w: 122, label: 'GOAL', value: `$${shiftCfg.scoreGoal}`, color: '#e6edf7' },
      { x: 556, w: 112, label: 'COMBO', value: state.combo >= 2 ? `x${state.combo} HOT` : `${state.combo}x`, color: state.combo >= 2 ? '#ffd773' : '#b7a99a' },
      { x: 680, w: 94, label: 'SERVED', value: String(state.servedCount), color: '#8bd8ff' },
    ];
    for (const p of pills) {
      ctx.fillStyle = '#29201c';
      roundRect(ctx, p.x, 8, p.w, 38, 7);
      ctx.fill();
      ctx.strokeStyle = '#47362c';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#a39382';
      ctx.font = `700 9px ${FONT_UI}`;
      ctx.fillText(p.label, p.x + 10, 20);
      ctx.fillStyle = p.color;
      ctx.font = `800 16px ${FONT_MONO}`;
      ctx.fillText(p.value, p.x + 10, 39);
    }

    // Prominent Shift Timer
    const urgentTime = state.shiftTimeLeft <= 20;
    ctx.fillStyle = urgentTime ? '#541b17' : '#2a221d';
    roundRect(ctx, 790, 7, 158, 40, 8);
    ctx.fill();
    ctx.strokeStyle = urgentTime ? '#ff5447' : PALETTE.brass;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = urgentTime ? '#ffa69e' : '#d6c3a5';
    ctx.font = `800 10px ${FONT_UI}`;
    ctx.fillText('TIMER', 802, 22);
    ctx.textAlign = 'right';
    ctx.fillStyle = urgentTime ? '#ff7c70' : '#fff3d1';
    ctx.font = `900 22px ${FONT_MONO}`;
    ctx.fillText(formatClock(state.shiftTimeLeft), 936, 36);

    // HUD control pills
    const controls = [
      { rect: hudButtons.recipes, text: '[H] Menu', active: state.showRecipeBook },
      { rect: hudButtons.mute, text: muted ? '[M] Off' : '[M] SFX', active: !muted },
      { rect: hudButtons.pause, text: '[P] Pause', active: state.screen === SCREEN_PAUSED },
    ];
    for (const c of controls) {
      ctx.fillStyle = c.active ? '#4d3a2c' : '#2a221e';
      roundRect(ctx, c.rect.x, c.rect.y, c.rect.w, c.rect.h, 6);
      ctx.fill();
      ctx.strokeStyle = c.active ? PALETTE.brass : '#574337';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#faeed9';
      ctx.font = `700 12px ${FONT_UI}`;
      ctx.fillText(c.text, c.rect.x + c.rect.w / 2, c.rect.y + 20);
    }
  }

  function drawParticlesAndCallouts(particles) {
    if (!particles) return;
    for (const p of particles.particles) {
      const ratio = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = p.alpha * ratio;
      ctx.fillStyle = p.color;
      if (p.kind === 'confetti') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.life * 7);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    for (const c of particles.callouts) {
      const ratio = Math.max(0, Math.min(1, c.life / c.maxLife));
      ctx.save();
      ctx.globalAlpha = Math.min(1, ratio * 1.4);
      ctx.font = `900 ${Math.round(16 * c.scale)}px ${FONT_UI}`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(18, 12, 10, 0.9)';
      ctx.strokeText(c.text, c.x, c.y);
      ctx.fillStyle = c.color;
      ctx.fillText(c.text, c.x, c.y);
      ctx.restore();
    }
  }

  function drawHintBanner(state) {
    if (!state.chef.hintText || state.chef.hintTimer <= 0) return;
    const text = state.chef.hintText;
    ctx.font = `700 13px ${FONT_UI}`;
    const w = Math.min(680, ctx.measureText(text).width + 34);
    const x = (FIELD.width - w) / 2;
    const y = 256;
    ctx.fillStyle = 'rgba(20, 15, 13, 0.88)';
    roundRect(ctx, x, y, w, 26, 13);
    ctx.fill();
    ctx.strokeStyle = 'rgba(230, 180, 80, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffebc2';
    ctx.fillText(text, FIELD.width / 2, y + 17);
  }

  function drawRecipeBookOverlay() {
    ctx.fillStyle = 'rgba(14, 10, 9, 0.82)';
    ctx.fillRect(0, HUD_BAR.height, FIELD.width, FIELD.height - HUD_BAR.height);

    const w = 1040;
    const h = 588;
    const x = (FIELD.width - w) / 2;
    const y = 78;

    ctx.fillStyle = '#241b17';
    roundRect(ctx, x, y, w, h, 14);
    ctx.fill();
    ctx.strokeStyle = PALETTE.brass;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd773';
    ctx.font = `900 22px ${FONT_UI}`;
    ctx.fillText('IZAKAYA RECIPE CODEX · 10 SIGNATURE BOWLS  ([H] or Click to Close)', FIELD.width / 2, y + 36);

    for (let i = 0; i < RECIPES.length; i += 1) {
      const r = RECIPES[i];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const rx = x + 24 + col * 500;
      const ry = y + 54 + row * 102;

      ctx.fillStyle = '#332721';
      roundRect(ctx, rx, ry, 488, 92, 9);
      ctx.fill();
      ctx.strokeStyle = '#5c4639';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      drawDishBowl(ctx, r.id, rx + 46, ry + 46, 31);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#fdf7ec';
      ctx.font = `800 15px ${FONT_UI}`;
      ctx.fillText(r.name, rx + 92, ry + 28);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#4cd98c';
      ctx.font = `800 13px ${FONT_MONO}`;
      ctx.fillText(`$${r.basePay} + $${r.tipBonus} tip`, rx + 474, ry + 28);

      let px = rx + 92;
      for (const part of r.parts) {
        ctx.fillStyle = '#221a16';
        roundRect(ctx, px, ry + 40, 88, 42, 6);
        ctx.fill();
        drawIngredientIcon(ctx, part, px + 44, ry + 57, 0.65);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#d9cbb8';
        ctx.font = `600 9px ${FONT_UI}`;
        const label = ITEM_METADATA[part]?.label.split(' ').pop() ?? part;
        ctx.fillText(label, px + 44, ry + 78);
        px += 94;
      }
    }
  }

  function drawTitleOverlay(state) {
    ctx.fillStyle = 'rgba(15, 11, 10, 0.62)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);

    const w = 680;
    const h = 380;
    const x = (FIELD.width - w) / 2;
    const y = (FIELD.height - h) / 2;

    ctx.fillStyle = '#241a16';
    roundRect(ctx, x, y, w, h, 16);
    ctx.fill();
    ctx.strokeStyle = PALETTE.brass;
    ctx.lineWidth = 3;
    ctx.stroke();

    drawDishBowl(ctx, 'velvet_miso_ramen', x + 110, y + 108, 52);
    drawDishBowl(ctx, 'surf_and_turf_don', x + w - 110, y + 108, 52);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd773';
    ctx.font = `900 40px ${FONT_UI}`;
    ctx.fillText('SESAME & FLAME', FIELD.width / 2, y + 90);

    ctx.fillStyle = '#f5e7cf';
    ctx.font = `600 16px ${FONT_UI}`;
    ctx.fillText('Midnight Izakaya & Wok Bistro · 10 Signature Dishes', FIELD.width / 2, y + 122);

    const lines = [
      '1. Grab ingredients [1-8] or click pantry trays; Side Tray [Q] holds 1 item.',
      '2. Prep on Chop Block [C], Kettle [B], and Ember Wok [F] for Wok Hei.',
      '3. Layer bowls at Assembly [Space], then ring Pass Bell [Enter]!',
      `Move faster with [Shift] · Best Service Earnings: $${state.bestScore}`,
    ];
    ctx.font = `600 14px ${FONT_UI}`;
    ctx.fillStyle = '#d9cbb8';
    lines.forEach((line, idx) => {
      ctx.fillText(line, FIELD.width / 2, y + 178 + idx * 28);
    });

    ctx.fillStyle = '#c95335';
    roundRect(ctx, FIELD.width / 2 - 145, y + h - 72, 290, 48, 10);
    ctx.fill();
    ctx.strokeStyle = '#ffd773';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff9ee';
    ctx.font = `900 18px ${FONT_UI}`;
    ctx.fillText('OPEN KITCHEN  [SPACE]', FIELD.width / 2, y + h - 41);
  }

  function drawUpgradeOverlay(state, hoveredUpgradeId) {
    ctx.fillStyle = 'rgba(15, 11, 10, 0.72)';
    ctx.fillRect(0, HUD_BAR.height, FIELD.width, FIELD.height - HUD_BAR.height);

    const w = 920;
    const h = 540;
    const x = (FIELD.width - w) / 2;
    const y = 96;

    ctx.fillStyle = '#241b17';
    roundRect(ctx, x, y, w, h, 14);
    ctx.fill();
    ctx.strokeStyle = PALETTE.brass;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#72e6a4';
    ctx.font = `900 28px ${FONT_UI}`;
    ctx.fillText(`SHIFT ${state.shiftIndex + 1} COMPLETE!  EARNINGS: $${state.score}`, FIELD.width / 2, y + 46);

    ctx.fillStyle = '#d9cbb8';
    ctx.font = `600 15px ${FONT_UI}`;
    ctx.fillText(
      `Served: ${state.servedCount} dishes   ·   Max Combo: x${state.maxCombo}   ·   Invest tips in kitchen gear!`,
      FIELD.width / 2,
      y + 74,
    );

    for (let i = 0; i < UPGRADE_CATALOG.length; i += 1) {
      const up = UPGRADE_CATALOG[i];
      const ux = x + 34 + (i % 2) * 432;
      const uy = y + 96 + Math.floor(i / 2) * 108;
      const owned = state.upgrades[up.id];
      const canAfford = state.score >= up.cost;
      const isHover = hoveredUpgradeId === up.id;

      ctx.fillStyle = owned ? '#1d3b2b' : isHover && canAfford ? '#433329' : '#322620';
      roundRect(ctx, ux, uy, 420, 94, 10);
      ctx.fill();
      ctx.strokeStyle = owned ? '#4cd98c' : isHover && canAfford ? '#ffd773' : '#5e493d';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#fff5e0';
      ctx.font = `800 16px ${FONT_UI}`;
      ctx.fillText(`[${i + 1}] ${up.name}`, ux + 16, uy + 31);

      ctx.fillStyle = '#cbbba8';
      ctx.font = `600 13px ${FONT_UI}`;
      ctx.fillText(up.desc, ux + 16, uy + 58);

      ctx.textAlign = 'right';
      ctx.fillStyle = owned ? '#72e6a4' : canAfford ? '#ffd773' : '#8a7a6c';
      ctx.font = `900 16px ${FONT_MONO}`;
      ctx.fillText(owned ? 'EQUIPPED' : `$${up.cost}`, ux + 404, uy + 31);
    }

    // Showcase the 4 Shift-2+ signature chef specials unlocked for the next rush
    ctx.fillStyle = '#1b1411';
    roundRect(ctx, x + 34, y + 322, w - 68, 128, 10);
    ctx.fill();
    ctx.strokeStyle = '#574337';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd773';
    ctx.font = `800 13px ${FONT_UI}`;
    ctx.fillText('NEXT SHIFT MENU UNLOCKED (10 TOTAL COMBINABLE BOWLS)', FIELD.width / 2, y + 345);

    const previewDishes = RECIPES.slice(6, 10);
    previewDishes.forEach((dish, idx) => {
      const dx = x + 135 + idx * 215;
      const dy = y + 392;
      drawDishBowl(ctx, dish.id, dx, dy, 28);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fdf7ec';
      ctx.font = `700 12px ${FONT_UI}`;
      ctx.fillText(dish.shortName, dx, dy + 44);
    });

    ctx.fillStyle = '#c95335';
    roundRect(ctx, FIELD.width / 2 - 170, y + h - 68, 340, 48, 10);
    ctx.fill();
    ctx.strokeStyle = '#ffd773';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fffaf0';
    ctx.font = `900 18px ${FONT_UI}`;
    ctx.fillText(`START SHIFT ${state.shiftIndex + 2}  [SPACE / ENTER]`, FIELD.width / 2, y + h - 37);
  }

  function drawPauseOrOverOverlay(state) {
    ctx.fillStyle = 'rgba(15, 11, 10, 0.72)';
    ctx.fillRect(0, HUD_BAR.height, FIELD.width, FIELD.height - HUD_BAR.height);

    const isOver = state.screen === SCREEN_OVER;
    const w = 540;
    const h = isOver ? 320 : 220;
    const x = (FIELD.width - w) / 2;
    const y = (FIELD.height - h) / 2;

    ctx.fillStyle = '#241b17';
    roundRect(ctx, x, y, w, h, 14);
    ctx.fill();
    ctx.strokeStyle = PALETTE.brass;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = isOver ? '#ffd773' : '#fdf7ec';
    ctx.font = `900 34px ${FONT_UI}`;
    ctx.fillText(isOver ? 'NIGHT SERVICE COMPLETE!' : 'KITCHEN PAUSED', FIELD.width / 2, y + 66);

    if (isOver) {
      const stars = state.score >= 850 ? '★★★ MASTER BISTRO' : state.score >= 500 ? '★★ CROWD FAVORITE' : '★ RISING CHEF';
      ctx.fillStyle = '#4cd98c';
      ctx.font = `800 20px ${FONT_UI}`;
      ctx.fillText(stars, FIELD.width / 2, y + 108);

      ctx.fillStyle = '#e8dac6';
      ctx.font = `600 16px ${FONT_UI}`;
      ctx.fillText(`Total Earnings: $${state.score}   ·   Best Ever: $${state.bestScore}`, FIELD.width / 2, y + 150);
      ctx.fillText(`Dishes Served: ${state.servedCount}   ·   Max Combo: x${state.maxCombo}`, FIELD.width / 2, y + 180);

      ctx.fillStyle = '#c95335';
      roundRect(ctx, FIELD.width / 2 - 140, y + h - 76, 280, 46, 10);
      ctx.fill();
      ctx.fillStyle = '#fff9ee';
      ctx.font = `900 17px ${FONT_UI}`;
      ctx.fillText('PLAY NEW NIGHT  [SPACE]', FIELD.width / 2, y + h - 46);
    } else {
      ctx.fillStyle = '#d9cbb8';
      ctx.font = `600 16px ${FONT_UI}`;
      ctx.fillText('Orders and burners are held safely on pause.', FIELD.width / 2, y + 116);
      ctx.fillStyle = '#ffd773';
      ctx.font = `800 17px ${FONT_UI}`;
      ctx.fillText('Press [P] or [SPACE] to resume service', FIELD.width / 2, y + 168);
    }
  }

  function draw(state, particles, uiState = {}) {
    const time = state.elapsed;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PALETTE.backdrop;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const shakeX = state.shakeTimer > 0 ? Math.sin(time * 75) * state.shakeAmount : 0;
    const shakeY = state.shakeTimer > 0 ? Math.cos(time * 62) * state.shakeAmount * 0.6 : 0;

    ctx.setTransform(view.scale, 0, 0, view.scale, view.x + shakeX * view.scale, view.y + shakeY * view.scale);

    drawKitchenBackdrop(ctx, time);
    drawTicketRail(ctx, state, uiState.hoveredOrderId ?? null, time);
    drawStations(ctx, state, uiState.hoveredStation ?? null, time);
    drawChef(ctx, state);
    drawPantryCounter(ctx, state, uiState.hoveredIngId ?? null);
    drawParticlesAndCallouts(particles);
    drawHud(state, Boolean(uiState.muted));
    drawHintBanner(state);

    if (state.showRecipeBook) {
      drawRecipeBookOverlay();
    } else if (state.screen === SCREEN_TITLE) {
      drawTitleOverlay(state);
    } else if (state.screen === SCREEN_UPGRADE) {
      drawUpgradeOverlay(state, uiState.hoveredUpgradeId ?? null);
    } else if (state.screen === SCREEN_PAUSED || state.screen === SCREEN_OVER) {
      drawPauseOrOverOverlay(state);
    }
  }

  resize();
  window.addEventListener('resize', resize);

  return {
    draw,
    screenToWorld,
    hudButtons,
  };
}
