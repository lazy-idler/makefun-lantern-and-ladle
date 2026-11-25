// Kitchen world architecture, warm lantern lighting, hanging ticket rail,
// interactive workstations, Chef Pip sprite, and bottom pantry rail.

import { CHEF_CONFIG, FIELD, FONT_MONO, FONT_UI, PALETTE, PANTRY, STATIONS, TICKET_RAIL } from './config.js';
import { INGREDIENTS, ITEM_METADATA, RECIPE_BY_ID, matchingRecipesForParts } from './recipes.js';
import { drawDishBowl, drawIngredientIcon } from './artFood.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Paint the atmospheric midnight kitchen room, subway tile wall, copper rack, and pass window. */
export function drawKitchenBackdrop(ctx, time) {
  // Upper tiled kitchen wall
  ctx.fillStyle = PALETTE.wallTop;
  ctx.fillRect(0, 54, FIELD.width, 280);

  // Ceramic subway tiles
  const tileW = 64;
  const tileH = 30;
  for (let row = 0; row < 9; row += 1) {
    const ty = 64 + row * tileH;
    const offset = (row % 2) * (tileW / 2);
    for (let col = -1; col < 22; col += 1) {
      const tx = col * tileW + offset;
      ctx.fillStyle = (row + col) % 5 === 0 ? '#313846' : PALETTE.wallTile;
      ctx.fillRect(tx + 1.5, ty + 1.5, tileW - 3, tileH - 3);
    }
  }

  // Service Pass dining window behind Station 5 (right side)
  const wx = 1004;
  const wy = 184;
  const ww = 242;
  const wh = 122;
  const passGlow = ctx.createLinearGradient(wx, wy, wx, wy + wh);
  passGlow.addColorStop(0, '#3e2316');
  passGlow.addColorStop(0.65, '#8c4e24');
  passGlow.addColorStop(1, '#b56e35');
  ctx.fillStyle = passGlow;
  roundRect(ctx, wx, wy, ww, wh, 10);
  ctx.fill();
  ctx.strokeStyle = '#291810';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Warm noren curtain valance at top of Diner Window
  for (let i = 0; i < 6; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? '#bd4633' : '#f2dfbd';
    roundRect(ctx, wx + 6 + i * 39, wy + 3, 35, 22, [0, 0, 5, 5]);
    ctx.fill();
  }
  // Happy seated night diner silhouettes at the ramen bar
  for (const [dx, hatColor] of [[wx + 66, '#e6b450'], [wx + 172, '#8ab4f8']]) {
    // Shoulders
    ctx.fillStyle = '#2e1d16';
    ctx.beginPath();
    ctx.ellipse(dx, wy + 114, 28, 22, 0, Math.PI, 0);
    ctx.fill();
    // Head
    ctx.fillStyle = '#4a2f22';
    ctx.beginPath();
    ctx.arc(dx, wy + 82, 16, 0, Math.PI * 2);
    ctx.fill();
    // Warm pendant glow / chopsticks accent
    ctx.fillStyle = hatColor;
    ctx.beginPath();
    ctx.arc(dx, wy + 68, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255, 232, 184, 0.85)';
  ctx.font = `800 11px ${FONT_UI}`;
  ctx.textAlign = 'center';
  ctx.fillText('NIGHT DINING COUNTER', wx + ww / 2, wy + 44);

  // Oak spice & utensil shelf along wall (left-center)
  ctx.fillStyle = '#6c4128';
  ctx.fillRect(28, 246, 944, 12);
  ctx.fillStyle = '#472817';
  ctx.fillRect(28, 258, 944, 5);

  // Spice jars & stacked ceramic bowls on shelf
  const jars = [
    { x: 52, c: '#d9534f', cap: '#f7e4c6' },
    { x: 88, c: '#e09b3d', cap: '#f7e4c6' },
    { x: 124, c: '#382a24', cap: '#d4a656' },
    { x: 160, c: '#f2d08a', cap: '#8c532b' },
  ];
  for (const jar of jars) {
    ctx.fillStyle = jar.c;
    roundRect(ctx, jar.x, 218, 24, 28, 4);
    ctx.fill();
    ctx.fillStyle = jar.cap;
    roundRect(ctx, jar.x + 2, 213, 20, 6, 2);
    ctx.fill();
  }

  // Hanging copper skillets & brass ladles on iron bar
  ctx.strokeStyle = '#1b1d22';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(240, 198);
  ctx.lineTo(760, 198);
  ctx.stroke();
  for (let i = 0; i < 4; i += 1) {
    const px = 285 + i * 125;
    ctx.strokeStyle = '#8b97a8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(px, 198);
    ctx.lineTo(px, 212);
    ctx.stroke();
    // Pan handle
    ctx.fillStyle = '#5c402c';
    roundRect(ctx, px - 2.5, 207, 5, 16, 2);
    ctx.fill();
    // Copper / steel skillet body
    ctx.fillStyle = i % 2 === 0 ? PALETTE.copper : '#7e8a9c';
    ctx.beginPath();
    ctx.arc(px, 234, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = i % 2 === 0 ? '#5c2c16' : '#303742';
    ctx.beginPath();
    ctx.arc(px, 234, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  // Framed chalkboard Special sign on tile wall (clear of lanterns)
  ctx.fillStyle = '#1e2824';
  roundRect(ctx, 822, 192, 152, 50, 6);
  ctx.fill();
  ctx.strokeStyle = '#7a492d';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd773';
  ctx.font = `800 10px ${FONT_UI}`;
  ctx.fillText('TONIGHT SPECIAL', 898, 210);
  ctx.fillStyle = '#f5ebd6';
  ctx.font = `700 11px ${FONT_UI}`;
  ctx.fillText('Velvet Miso Ramen', 898, 229);

  // Hanging warm paper lanterns casting golden pools over the prep line
  const flicker = 0.94 + Math.sin(time * 3.1) * 0.06;
  for (const lx of [205, 480, 775]) {
    const glow = ctx.createRadialGradient(lx, 216, 10, lx, 270, 175 * flicker);
    glow.addColorStop(0, 'rgba(255, 198, 104, 0.25)');
    glow.addColorStop(1, 'rgba(255, 198, 104, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(lx - 180, 170, 360, 220);

    // Lantern body
    ctx.strokeStyle = '#261a14';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lx, 176);
    ctx.lineTo(lx, 190);
    ctx.stroke();

    ctx.fillStyle = '#f28b30';
    ctx.beginPath();
    ctx.ellipse(lx, 206, 17, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe596';
    ctx.beginPath();
    ctx.ellipse(lx, 206, 9, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Main warm hardwood kitchen counter band & floor aisle
  ctx.fillStyle = PALETTE.counterWood;
  ctx.fillRect(0, 310, FIELD.width, 226);
  ctx.fillStyle = PALETTE.counterTop;
  ctx.fillRect(0, 310, FIELD.width, 16);
  ctx.fillStyle = PALETTE.counterEdge;
  ctx.fillRect(0, 520, FIELD.width, 16);

  // Dark tiled kitchen floor between counter & bottom pantry
  ctx.fillStyle = '#201b19';
  ctx.fillRect(0, 536, FIELD.width, 32);
}

/** Paint the stainless order rail and active customer tickets across the top. */
export function drawTicketRail(ctx, state, hoveredOrderId, time) {
  // Stainless steel hanging bar
  ctx.fillStyle = PALETTE.railSteel;
  ctx.fillRect(14, TICKET_RAIL.y, FIELD.width - 28, 10);
  ctx.fillStyle = PALETTE.railHighlight;
  ctx.fillRect(14, TICKET_RAIL.y + 1, FIELD.width - 28, 3);

  const plateReadyId = state.stations.plate.completedRecipeId;
  const readyOnPass = state.stations.pass.slots.filter(Boolean).map((s) => s.recipeId);
  const partialMatches = state.stations.plate.parts.length > 0
    ? matchingRecipesForParts(state.stations.plate.parts).map((r) => r.id)
    : [];

  for (let i = 0; i < state.orders.length; i += 1) {
    const order = state.orders[i];
    const recipe = RECIPE_BY_ID[order.recipeId];
    const x = TICKET_RAIL.startX + i * (TICKET_RAIL.cardWidth + TICKET_RAIL.gap);
    const y = TICKET_RAIL.y + 8 - order.enteredAnim * 16;
    const w = TICKET_RAIL.cardWidth;
    const h = TICKET_RAIL.cardHeight;

    const patienceRatio = Math.max(0, Math.min(1, order.timeLeft / order.maxTime));
    const isUrgent = patienceRatio < 0.28;
    const isReadyOnPass = readyOnPass.includes(order.recipeId) || plateReadyId === order.recipeId;
    const isBuilding = !isReadyOnPass && partialMatches.includes(order.recipeId);
    const isHover = hoveredOrderId === order.id;

    ctx.save();
    // Pulsing glow when dish is ready to serve!
    if (isReadyOnPass) {
      ctx.shadowColor = '#4cd98c';
      ctx.shadowBlur = 12 + Math.sin(time * 7) * 4;
    } else if (isUrgent) {
      ctx.shadowColor = '#ff483b';
      ctx.shadowBlur = 10 + Math.sin(time * 10) * 4;
    }

    ctx.fillStyle = PALETTE.ticketPaper;
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = isReadyOnPass
      ? '#2fc272'
      : isHover
      ? PALETTE.brassBright
      : isUrgent
      ? PALETTE.ticketUrgent
      : '#b8a992';
    ctx.lineWidth = isReadyOnPass || isHover ? 2.5 : 1.5;
    roundRect(ctx, x, y, w, h, 8);
    ctx.stroke();

    // Brass clip pin at top center
    ctx.fillStyle = PALETTE.brass;
    roundRect(ctx, x + w / 2 - 14, y - 5, 28, 9, 3);
    ctx.fill();

    // Ticket header bar
    ctx.fillStyle = isReadyOnPass ? '#1d593a' : PALETTE.ticketHeader;
    roundRect(ctx, x, y, w, 25, [8, 8, 0, 0]);
    ctx.fill();

    ctx.font = `800 12px ${FONT_UI}`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd773';
    ctx.fillText(`#${order.ticketNo} · ${order.tableLabel}`, x + 8, y + 17);

    ctx.textAlign = 'right';
    ctx.fillStyle = isReadyOnPass ? '#8effc1' : '#f7e7ce';
    ctx.fillText(isReadyOnPass ? 'SERVE!' : `$${recipe.basePay}+`, x + w - 8, y + 17);

    // Dish icon & Title
    drawDishBowl(ctx, recipe.id, x + 28, y + 54, 19);
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.textDark;
    ctx.font = `800 13px ${FONT_UI}`;
    ctx.fillText(recipe.shortName, x + 53, y + 43);

    if (isBuilding) {
      ctx.fillStyle = '#c4791b';
      ctx.font = `700 10px ${FONT_UI}`;
      ctx.fillText('IN PROGRESS', x + 53, y + 55);
    }

    // Compact ingredient chips on ticket
    let cx = x + 53;
    const cy = y + 66;
    for (const partId of recipe.parts) {
      const meta = ITEM_METADATA[partId];
      const alreadyOnPlate = state.stations.plate.parts.includes(partId);
      ctx.fillStyle = alreadyOnPlate ? '#d6f5e3' : '#ece1cc';
      roundRect(ctx, cx, cy, 36, 20, 4);
      ctx.fill();
      ctx.strokeStyle = alreadyOnPlate ? '#3fb573' : '#cabca4';
      ctx.lineWidth = 1;
      ctx.stroke();
      drawIngredientIcon(ctx, partId, cx + 18, cy + 10, 0.42);
      cx += 39;
    }

    // Patience timer bar + explicit seconds text
    const barX = x + 8;
    const barY = y + h - 14;
    const barW = w - 44;
    ctx.fillStyle = '#dfd3be';
    roundRect(ctx, barX, barY, barW, 8, 4);
    ctx.fill();

    ctx.fillStyle = patienceRatio > 0.5 ? PALETTE.ticketSafe : patienceRatio > 0.25 ? PALETTE.ticketWarn : PALETTE.ticketUrgent;
    roundRect(ctx, barX, barY, Math.max(4, barW * patienceRatio), 8, 4);
    ctx.fill();

    ctx.font = `700 11px ${FONT_MONO}`;
    ctx.textAlign = 'right';
    ctx.fillStyle = isUrgent ? PALETTE.ticketUrgent : '#524438';
    ctx.fillText(`${Math.ceil(order.timeLeft)}s`, x + w - 8, barY + 8);
  }
}

function drawStationHeader(ctx, st, isActive, isHintTarget) {
  ctx.fillStyle = isActive ? '#382a22' : '#241c18';
  roundRect(ctx, st.x, st.y, st.w, 28, [8, 8, 0, 0]);
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.fillStyle = isHintTarget ? '#ffd773' : '#f7ecda';
  ctx.font = `800 12px ${FONT_UI}`;
  ctx.fillText(st.label, st.x + 10, st.y + 18);

  // Hotkey pill
  const keyW = Math.max(24, st.keyHint.length * 7 + 12);
  ctx.fillStyle = isHintTarget ? PALETTE.brass : '#463830';
  roundRect(ctx, st.x + st.w - keyW - 7, st.y + 5, keyW, 18, 4);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.fillStyle = isHintTarget ? '#1c1512' : '#fcead0';
  ctx.font = `800 11px ${FONT_MONO}`;
  ctx.fillText(st.keyHint, st.x + st.w - keyW / 2 - 7, st.y + 18);
}

/** Paint all 5 workstations + Wash Sink with live timers, flames, and mid-assembly visuals. */
export function drawStations(ctx, state, hoveredStation, time) {
  const held = state.chef.heldItem;
  const expectedNext = held ? (held.startsWith('dish:') ? 'pass' : ITEM_METADATA[held]?.nextStation) : null;

  // Helper for station card background
  function drawCardBase(st, fillColor) {
    const isHover = hoveredStation === st.id;
    const isTarget = expectedNext === st.id;
    ctx.save();
    if (isTarget) {
      ctx.shadowColor = '#ffd773';
      ctx.shadowBlur = 12 + Math.sin(time * 6) * 4;
    }
    ctx.fillStyle = fillColor;
    roundRect(ctx, st.x, st.y, st.w, st.h, 8);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = isHover ? '#fff0c4' : isTarget ? PALETTE.brassBright : '#332016';
    ctx.lineWidth = isHover || isTarget ? 2.5 : 2;
    roundRect(ctx, st.x, st.y, st.w, st.h, 8);
    ctx.stroke();

    drawStationHeader(ctx, st, isHover || isTarget, isTarget);
  }

  // 1. CHOP BLOCK
  {
    const st = STATIONS.chop;
    const { chop } = state.stations;
    drawCardBase(st, '#8e5a36');

    // Thick end-grain maple cutting board
    ctx.fillStyle = PALETTE.mapleBlock;
    roundRect(ctx, st.x + 18, st.y + 42, st.w - 36, 98, 8);
    ctx.fill();
    ctx.strokeStyle = PALETTE.mapleDark;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Board wood grain lines
    ctx.strokeStyle = 'rgba(156, 102, 50, 0.35)';
    ctx.lineWidth = 1.5;
    for (let gy = st.y + 58; gy <= st.y + 124; gy += 16) {
      ctx.beginPath();
      ctx.moveTo(st.x + 26, gy);
      ctx.lineTo(st.x + st.w - 26, gy);
      ctx.stroke();
    }

    const cx = st.x + st.w / 2;
    const cy = st.y + 88;
    if (chop.item) {
      drawIngredientIcon(ctx, chop.item, cx - 10, cy, 1.45);
      // Segmented chop pips
      for (let i = 0; i < chop.hitsRequired; i += 1) {
        const px = cx - ((chop.hitsRequired - 1) * 20) / 2 + i * 20;
        ctx.fillStyle = i < chop.hits ? '#4cd98c' : '#3a2b20';
        ctx.beginPath();
        ctx.arc(px, st.y + 152, 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff5e0';
      ctx.font = `700 12px ${FONT_UI}`;
      ctx.fillText(
        ITEM_METADATA[chop.item]?.stage === 'raw' ? `TAP [C] TO CHOP (${chop.hits}/${chop.hitsRequired})` : 'CHOPPED! GRAB',
        cx,
        st.y + 173,
      );
    } else {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f2dec2';
      ctx.font = `600 12px ${FONT_UI}`;
      ctx.fillText('Pork · Shrimp · Tofu · Greens', cx, st.y + 165);
    }

    // Gleaming santoku chef knife
    ctx.save();
    ctx.translate(cx + 42, cy - 10);
    ctx.rotate(chop.slashFlash > 0 ? -0.85 : -0.25);
    ctx.fillStyle = '#dce4ed';
    ctx.strokeStyle = '#6f7c8c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-24, -4);
    ctx.lineTo(14, -7);
    ctx.quadraticCurveTo(22, 0, 14, 7);
    ctx.lineTo(-24, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#3d2518';
    roundRect(ctx, -40, -3, 18, 7, 2);
    ctx.fill();
    ctx.restore();
  }

  // 2. BROTH KETTLE
  {
    const st = STATIONS.kettle;
    const { kettle } = state.stations;
    drawCardBase(st, '#2a303a');

    const cx = st.x + st.w / 2;
    const cy = st.y + 92;

    // Gas stove grate & blue flame ring
    ctx.fillStyle = '#191d24';
    ctx.beginPath();
    ctx.arc(cx, cy + 8, 56, 0, Math.PI * 2);
    ctx.fill();
    if (kettle.item) {
      ctx.strokeStyle = kettle.status === 'overcooked' ? '#ff483b' : PALETTE.flameBlue;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy + 8, 50 + Math.sin(time * 12) * 1.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Hammered copper kettle body
    ctx.fillStyle = PALETTE.copper;
    ctx.strokeStyle = '#69341b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy + 4, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Brass handles
    ctx.strokeStyle = PALETTE.brass;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx - 48, cy - 2);
    ctx.lineTo(cx - 40, cy - 2);
    ctx.moveTo(cx + 40, cy - 2);
    ctx.lineTo(cx + 48, cy - 2);
    ctx.stroke();

    // Liquid surface inside kettle
    ctx.fillStyle = kettle.status === 'overcooked'
      ? '#2d2624'
      : kettle.item === 'broth' || kettle.item === 'simmered_broth'
      ? '#df8a2d'
      : kettle.item
      ? '#ebdcb8'
      : '#424b59';
    ctx.beginPath();
    ctx.arc(cx, cy + 4, 35, 0, Math.PI * 2);
    ctx.fill();

    if (kettle.item) {
      drawIngredientIcon(ctx, kettle.item, cx, cy + 4, 1.15);
      // Animated simmering bubbles
      if (kettle.status !== 'overcooked') {
        ctx.fillStyle = 'rgba(255, 250, 224, 0.72)';
        for (let b = 0; b < 4; b += 1) {
          const ang = kettle.bubblePhase * 0.4 + b * 1.57;
          const rBub = 2 + ((kettle.bubblePhase + b) % 3);
          ctx.beginPath();
          ctx.arc(cx + Math.cos(ang) * 19, cy + 4 + Math.sin(ang) * 17, rBub, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Circular progress arc
      const pct = Math.min(1, kettle.elapsed / kettle.cookSec);
      ctx.strokeStyle = kettle.status === 'ready' ? '#4cd98c' : kettle.status === 'overcooked' ? '#ff483b' : '#ffd773';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, cy + 4, 47, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = `800 12px ${FONT_UI}`;
      ctx.fillStyle = kettle.status === 'ready' ? '#72e6a4' : kettle.status === 'overcooked' ? '#ff6f61' : '#ffe299';
      const msg = kettle.status === 'ready' ? 'READY! TAKE [B]' : kettle.status === 'overcooked' ? 'BURNT! TAKE [B]' : `SIMMER ${Math.round(pct * 100)}%`;
      ctx.fillText(msg, cx, st.y + 170);
    } else {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#adb8c7';
      ctx.font = `600 12px ${FONT_UI}`;
      ctx.fillText('Noodles · Rice · Miso Stock', cx, st.y + 168);
    }
  }

  // 3. EMBER WOK
  {
    const st = STATIONS.wok;
    const { wok } = state.stations;
    drawCardBase(st, '#262124');

    const cx = st.x + st.w / 2;
    const cy = st.y + 88;

    // Roaring wok flame tongues underneath
    if (wok.item || wok.flareTimer > 0) {
      const flareScale = wok.flareTimer > 0 ? 1.3 : 1.0;
      ctx.fillStyle = wok.status === 'burning' || wok.status === 'burnt' ? '#ff3b2f' : PALETTE.flameOrange;
      ctx.beginPath();
      ctx.arc(cx, cy + 6, 52 * flareScale + Math.sin(time * 16) * 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.flameCore;
      ctx.beginPath();
      ctx.arc(cx, cy + 6, 44, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cast-iron wok handle
    ctx.fillStyle = '#6d442b';
    ctx.strokeStyle = '#1b1717';
    ctx.lineWidth = 2;
    roundRect(ctx, cx + 36, cy - 2, 42, 12, 5);
    ctx.fill();
    ctx.stroke();

    // Seasoned black carbon-steel wok bowl
    const wokGrad = ctx.createRadialGradient(cx - 10, cy - 8, 6, cx, cy + 4, 46);
    wokGrad.addColorStop(0, '#444852');
    wokGrad.addColorStop(1, '#1a1c21');
    ctx.fillStyle = wokGrad;
    ctx.beginPath();
    ctx.arc(cx, cy + 4, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6a7280';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (wok.item) {
      const bounceY = wok.flareTimer > 0 ? -9 : Math.sin(time * 14) * 1.8;
      drawIngredientIcon(ctx, wok.item, cx, cy + 2 + bounceY, 1.32);

      // Horizontal sear meter bar: Blue (Searing) -> Gold (Perfect) -> Red (Burn)
      const barX = st.x + 22;
      const barY = st.y + 144;
      const barW = st.w - 44;
      ctx.fillStyle = '#161416';
      roundRect(ctx, barX, barY, barW, 10, 5);
      ctx.fill();

      const ratio = Math.min(1, wok.elapsed / wok.burnSec);
      const readyPos = wok.cookSec / wok.burnSec;
      ctx.fillStyle = '#3b9be0';
      roundRect(ctx, barX, barY, barW * readyPos, 10, [5, 0, 0, 5]);
      ctx.fill();
      ctx.fillStyle = '#4cd98c';
      ctx.fillRect(barX + barW * readyPos, barY, barW * 0.42, 10);
      ctx.fillStyle = '#ff483b';
      roundRect(ctx, barX + barW * (readyPos + 0.42), barY, barW * (1 - readyPos - 0.42), 10, [0, 5, 5, 0]);
      ctx.fill();

      // Needle indicator
      const nx = barX + ratio * barW;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(nx - 2, barY - 3, 4, 16);

      ctx.textAlign = 'center';
      ctx.font = `800 12px ${FONT_UI}`;
      ctx.fillStyle =
        wok.status === 'perfect'
          ? '#72e6a4'
          : wok.status === 'burning' || wok.status === 'burnt'
          ? '#ff5f4c'
          : '#ffd773';
      const label =
        wok.status === 'searing'
          ? 'TOSS [F] FOR WOK HEI!'
          : wok.status === 'perfect'
          ? 'PERFECT! SCOOP [F]'
          : wok.status === 'burning'
          ? 'QUICK! PULL NOW [F]'
          : 'BURNT! PULL TO SINK';
      ctx.fillText(label, cx, st.y + 173);
    } else {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#b9aeb3';
      ctx.font = `600 12px ${FONT_UI}`;
      ctx.fillText('Chopped Pork · Shrimp · Tofu', cx, st.y + 168);
    }
  }

  // 4. ASSEMBLY & PLATING BOARD (Shows one dish mid-assembly clearly!)
  {
    const st = STATIONS.plate;
    const { plate } = state.stations;
    drawCardBase(st, PALETTE.slateDeck);

    const cx = st.x + st.w / 2;
    const cy = st.y + 98;

    // Slate serving board under bowl
    ctx.fillStyle = '#20252d';
    roundRect(ctx, st.x + 16, st.y + 38, st.w - 32, 114, 10);
    ctx.fill();
    ctx.strokeStyle = '#4d5666';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const completedRecipe = plate.completedRecipeId ? RECIPE_BY_ID[plate.completedRecipeId] : null;
    const candidates = matchingRecipesForParts(plate.parts);
    const activeTarget = completedRecipe ?? state.orders.map((o) => RECIPE_BY_ID[o.recipeId]).find((r) => candidates.some((c) => c.id === r.id)) ?? candidates[0];

    // Draw the ceramic bowl live mid-assembly!
    drawDishBowl(ctx, activeTarget?.id ?? null, cx - 38, cy, 41, plate.parts);

    // Live Recipe Checklist right next to the mid-assembly bowl!
    if (activeTarget) {
      const lx = st.x + 128;
      let ly = st.y + 46;
      ctx.textAlign = 'left';
      ctx.fillStyle = completedRecipe ? '#72e6a4' : '#ffd773';
      ctx.font = `800 11px ${FONT_UI}`;
      ctx.fillText(completedRecipe ? 'DISH COMPLETE!' : activeTarget.shortName, lx, ly + 8);
      ly += 15;

      const remainingBuilt = [...plate.parts];
      for (const part of activeTarget.parts) {
        const idx = remainingBuilt.indexOf(part);
        const has = idx !== -1;
        if (has) remainingBuilt.splice(idx, 1);

        ctx.fillStyle = has ? 'rgba(76, 217, 140, 0.22)' : 'rgba(255, 255, 255, 0.08)';
        roundRect(ctx, lx, ly, 86, 18, 4);
        ctx.fill();

        ctx.font = `700 10px ${FONT_UI}`;
        ctx.fillStyle = has ? '#72e6a4' : '#d0d7e2';
        const shortLabel = ITEM_METADATA[part]?.label.replace('Boiled ', '').replace('Steamed ', '').replace('Seared ', '').replace('Garlic ', '').replace('Crispy ', '').replace('Crisp ', '').replace('Ajitama ', '') ?? part;
        ctx.fillText(`${has ? '✓' : '○'} ${shortLabel}`, lx + 6, ly + 12.5);
        ly += 20;
      }
    }

    ctx.textAlign = 'center';
    ctx.font = `800 12px ${FONT_UI}`;
    ctx.fillStyle = completedRecipe ? '#72e6a4' : '#e6edf7';
    ctx.fillText(
      completedRecipe
        ? 'SEND TO PASS [Space]'
        : plate.parts.length > 0
        ? `MID-ASSEMBLY (${plate.parts.length}/${activeTarget?.parts.length ?? 4})`
        : 'LAYER COOKED PARTS HERE',
      cx,
      st.y + 172,
    );
  }

  // 5. SERVICE PASS & GOLDEN BELL
  {
    const st = STATIONS.pass;
    const { pass } = state.stations;
    drawCardBase(st, '#4a2e1d');

    // Warm heat-lamp glow over pass trays
    const lampGrad = ctx.createLinearGradient(st.x, st.y + 28, st.x, st.y + st.h);
    lampGrad.addColorStop(0, 'rgba(255, 210, 120, 0.22)');
    lampGrad.addColorStop(1, 'rgba(255, 210, 120, 0.02)');
    ctx.fillStyle = lampGrad;
    ctx.fillRect(st.x + 2, st.y + 28, st.w - 4, st.h - 32);

    // Two Pass Trays
    for (let s = 0; s < 2; s += 1) {
      const tx = st.x + 14 + s * 86;
      const ty = st.y + 42;
      ctx.fillStyle = '#2d1c13';
      roundRect(ctx, tx, ty, 78, 76, 8);
      ctx.fill();
      ctx.strokeStyle = pass.slots[s] ? '#4cd98c' : '#6c4732';
      ctx.lineWidth = pass.slots[s] ? 2.5 : 1.5;
      ctx.stroke();

      const slot = pass.slots[s];
      if (slot) {
        drawDishBowl(ctx, slot.recipeId, tx + 39, ty + 38, 29, null);
        ctx.fillStyle = '#259e5b';
        roundRect(ctx, tx + 6, ty + 62, 66, 15, 4);
        ctx.fill();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = `800 9px ${FONT_UI}`;
        ctx.fillText('READY!', tx + 39, ty + 73);
      } else {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#8b6a55';
        ctx.font = `600 10px ${FONT_UI}`;
        ctx.fillText(`TRAY ${s + 1}`, tx + 39, ty + 42);
      }
    }

    // Brass Service Bell on right side of Pass
    const bx = st.x + 214;
    const by = st.y + 84;
    const ringScale = pass.bellRing > 0 ? 1 + Math.sin(pass.bellRing * 40) * 0.1 : 1;
    ctx.save();
    ctx.translate(bx, by);
    ctx.scale(ringScale, ringScale);

    if (pass.slots.some(Boolean)) {
      ctx.strokeStyle = `rgba(255, 224, 112, ${0.4 + Math.sin(time * 8) * 0.3})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 26 + Math.sin(time * 8) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#332219';
    roundRect(ctx, -20, 8, 40, 9, 4);
    ctx.fill();
    const bellGrad = ctx.createRadialGradient(-5, -6, 2, 0, 0, 18);
    bellGrad.addColorStop(0, '#fff4b8');
    bellGrad.addColorStop(0.5, '#e8b648');
    bellGrad.addColorStop(1, '#9c6c19');
    ctx.fillStyle = bellGrad;
    ctx.beginPath();
    ctx.arc(0, 8, 17, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff1a8';
    ctx.beginPath();
    ctx.arc(0, -10, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.fillStyle = pass.slots.some(Boolean) ? '#8effc1' : '#f2d9b8';
    ctx.font = `800 11px ${FONT_UI}`;
    ctx.fillText(pass.slots.some(Boolean) ? 'RING BELL [Enter] TO SERVE!' : 'SET PLATED DISHES HERE', st.x + st.w / 2, st.y + 137);
  }

  // 6. WASH SINK / TRASH
  {
    const st = STATIONS.trash;
    const isHover = hoveredStation === st.id;
    ctx.fillStyle = isHover ? '#485463' : '#353e4a';
    roundRect(ctx, st.x, st.y, st.w, st.h, 8);
    ctx.fill();
    ctx.strokeStyle = isHover ? '#9ee0ff' : '#1b2028';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Stainless basin
    ctx.fillStyle = '#222830';
    roundRect(ctx, st.x + 8, st.y + 10, 42, 36, 5);
    ctx.fill();
    ctx.strokeStyle = '#92a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(st.x + 29, st.y + 14, 7, Math.PI, 0);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#e2edf7';
    ctx.font = `800 11px ${FONT_UI}`;
    ctx.fillText('SINK [X]', st.x + 56, st.y + 26);
    ctx.fillStyle = '#9ab2c9';
    ctx.font = `600 10px ${FONT_UI}`;
    ctx.fillText('Dump/Wash', st.x + 56, st.y + 42);
  }
}

/** Draw Chef Pip moving smoothly along the kitchen floor carrying the held ingredient. */
export function drawChef(ctx, state) {
  const { chef } = state;
  const bob = Math.abs(chef.targetX - chef.x) > 4 ? Math.sin(chef.walkPhase) * 3 : 0;
  const cx = chef.x;
  const cy = CHEF_CONFIG.y + bob;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(0.88, 0.88);

  // Soft floor shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 22 - bob, 24, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body & terracotta bistro apron
  ctx.fillStyle = '#272c36';
  roundRect(ctx, -18, -8, 36, 28, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.chefApron;
  roundRect(ctx, -13, -3, 26, 23, 5);
  ctx.fill();

  // Head
  ctx.fillStyle = PALETTE.chefSkin;
  ctx.beginPath();
  ctx.arc(0, -18, 14, 0, Math.PI * 2);
  ctx.fill();

  // Eyes facing movement direction
  ctx.fillStyle = '#261c17';
  const look = chef.facing * 3;
  ctx.beginPath();
  ctx.arc(-4 + look, -18, 2, 0, Math.PI * 2);
  ctx.arc(4 + look, -18, 2, 0, Math.PI * 2);
  ctx.fill();

  // Crisp Chef Toque Hat
  ctx.fillStyle = PALETTE.chefWhite;
  ctx.strokeStyle = '#c9bfb0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(-6, -34, 9, 0, Math.PI * 2);
  ctx.arc(6, -34, 9, 0, Math.PI * 2);
  ctx.arc(0, -37, 10, 0, Math.PI * 2);
  ctx.fill();
  roundRect(ctx, -13, -31, 26, 8, 3);
  ctx.fill();
  ctx.stroke();

  // Held ingredient floating cleanly beside Chef Pip in the walkway aisle
  if (chef.heldItem) {
    ctx.fillStyle = 'rgba(26, 20, 17, 0.94)';
    ctx.strokeStyle = PALETTE.brassBright;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(chef.facing * 26, -6, 19, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawIngredientIcon(ctx, chef.heldItem, chef.facing * 26, -6, 0.86);
  }

  ctx.restore();
}

/** Paint the 8 refrigerated ingredient trays across the foreground counter (`[1]`–`[8]`). */
export function drawPantryCounter(ctx, state, hoveredIngId) {
  ctx.fillStyle = '#2b1b13';
  ctx.fillRect(0, PANTRY.y, FIELD.width, PANTRY.height);
  ctx.fillStyle = '#6c422a';
  ctx.fillRect(0, PANTRY.y, FIELD.width, 8);

  const held = state.chef.heldItem;

  for (let i = 0; i < INGREDIENTS.length; i += 1) {
    const ing = INGREDIENTS[i];
    const tx = PANTRY.startX + i * (PANTRY.trayW + PANTRY.gap);
    const ty = PANTRY.trayY;
    const isHover = hoveredIngId === ing.id;
    const isHeldMatch = held === ing.id;

    // Stainless chilled pan exterior
    ctx.fillStyle = isHeldMatch ? '#54462c' : isHover ? '#4a5462' : '#353d49';
    roundRect(ctx, tx, ty, PANTRY.trayW, PANTRY.trayH, 8);
    ctx.fill();
    ctx.strokeStyle = isHeldMatch ? PALETTE.brassBright : isHover ? '#fff4d6' : '#5e6b7c';
    ctx.lineWidth = isHover || isHeldMatch ? 2.5 : 1.5;
    ctx.stroke();

    // Inner ice-cold tray well
    ctx.fillStyle = '#1e242c';
    roundRect(ctx, tx + 8, ty + 8, PANTRY.trayW - 16, 68, 6);
    ctx.fill();

    // Ingredient art
    drawIngredientIcon(ctx, ing.id, tx + PANTRY.trayW / 2, ty + 42, 1.38);

    // Hotkey badge top-left
    ctx.fillStyle = PALETTE.brass;
    roundRect(ctx, tx + 6, ty + 6, 22, 18, 4);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1b1412';
    ctx.font = `800 11px ${FONT_MONO}`;
    ctx.fillText(ing.hotkey, tx + 17, ty + 19);

    // Ingredient title + route subtitle
    ctx.fillStyle = '#fdf7ec';
    ctx.font = `800 13px ${FONT_UI}`;
    ctx.fillText(ing.shortName, tx + PANTRY.trayW / 2, ty + 94);

    ctx.fillStyle = '#b4c0cf';
    ctx.font = `600 10px ${FONT_UI}`;
    const route = ing.needsChop && ing.cookStation
      ? 'Chop -> Wok'
      : ing.needsChop
      ? 'Chop -> Plate'
      : ing.cookStation
      ? 'Kettle -> Plate'
      : 'Ready Garnish';
    ctx.fillText(route, tx + PANTRY.trayW / 2, ty + 110);
  }
}
