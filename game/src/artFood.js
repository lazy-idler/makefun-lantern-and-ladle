// Detailed vector-canvas illustrations for raw, chopped, and cooked ingredients,
// plus layered ceramic bowls rendered mid-assembly or ready to serve.

import { RECIPE_BY_ID } from './recipes.js';

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Draw an expressive, multi-layered ingredient icon centered at (x, y). */
export function drawIngredientIcon(ctx, itemId, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  switch (itemId) {
    case 'noodles':
    case 'boiled_noodles': {
      const cooked = itemId === 'boiled_noodles';
      ctx.fillStyle = cooked ? '#f7d87c' : '#e8be63';
      ctx.strokeStyle = cooked ? '#b37920' : '#9c6c25';
      ctx.lineWidth = 2;
      // Wavy coiled noodle nest
      for (let row = -2; row <= 2; row += 1) {
        ctx.beginPath();
        const ry = row * 4.5;
        ctx.moveTo(-17, ry);
        ctx.bezierCurveTo(-8, ry - 6, 0, ry + 6, 8, ry - 4);
        ctx.bezierCurveTo(13, ry - 7, 16, ry + 2, 18, ry);
        ctx.lineWidth = 4.2;
        ctx.strokeStyle = cooked ? '#ffe89c' : '#f2ca70';
        ctx.stroke();
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = cooked ? '#c48622' : '#9e6e24';
        ctx.stroke();
      }
      if (!cooked) {
        // Paper band around dry ramen bundle
        ctx.fillStyle = '#c84b31';
        drawRoundedRect(ctx, -6, -13, 12, 26, 3);
        ctx.fill();
      }
      break;
    }

    case 'rice':
    case 'steamed_rice': {
      const cooked = itemId === 'steamed_rice';
      // Wooden scoop / fluffy mound
      ctx.fillStyle = cooked ? '#fffdf7' : '#efe7d6';
      ctx.strokeStyle = '#c2b59b';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 3, 16, Math.PI, 0);
      ctx.quadraticCurveTo(16, 13, 0, 13);
      ctx.quadraticCurveTo(-16, 13, -16, 3);
      ctx.fill();
      ctx.stroke();
      // Rice grain highlights
      ctx.fillStyle = cooked ? '#ffffff' : '#dfd2b8';
      const grains = [[-7, 0], [0, -5], [6, 1], [-4, 6], [4, 7], [-9, 6], [8, -3]];
      for (const [gx, gy] of grains) {
        ctx.beginPath();
        ctx.ellipse(gx, gy, 3, 1.7, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      if (cooked) {
        // Toasted black sesame garnish specks
        ctx.fillStyle = '#2d2622';
        for (const [sx, sy] of [[-3, -2], [3, 2], [0, 4], [5, -4]]) {
          ctx.beginPath();
          ctx.arc(sx, sy, 1.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }

    case 'pork':
    case 'chopped_pork':
    case 'seared_pork': {
      const slices = itemId === 'pork' ? 1 : 3;
      const seared = itemId === 'seared_pork';
      for (let i = 0; i < slices; i += 1) {
        ctx.save();
        if (slices > 1) ctx.translate((i - 1) * 7, (i - 1) * 2.5);
        // Outer fat / seared crust rim
        ctx.fillStyle = seared ? '#78341e' : '#f7dfd4';
        ctx.strokeStyle = seared ? '#4a1b0d' : '#a84942';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(0, 0, slices === 1 ? 18 : 11, slices === 1 ? 12 : 9, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Tender meat center
        ctx.fillStyle = seared ? '#c4633e' : '#df6c63';
        ctx.beginPath();
        ctx.ellipse(0, 1, slices === 1 ? 13 : 8, slices === 1 ? 8 : 6, -0.2, 0, Math.PI * 2);
        ctx.fill();
        // Marbling / char lines
        ctx.strokeStyle = seared ? '#471b0e' : '#f7d5cb';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-6, -2);
        ctx.lineTo(6, 2);
        ctx.stroke();
        ctx.restore();
      }
      break;
    }

    case 'shrimp':
    case 'chopped_shrimp':
    case 'seared_shrimp': {
      const seared = itemId === 'seared_shrimp';
      const count = itemId === 'shrimp' ? 1 : 2;
      for (let i = 0; i < count; i += 1) {
        ctx.save();
        if (count > 1) ctx.translate((i - 0.5) * 10, (i - 0.5) * 3);
        ctx.strokeStyle = seared ? '#b83b14' : '#c95c3c';
        ctx.fillStyle = seared ? '#ff6f3c' : '#ffa180';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, 2, 12, Math.PI * 0.9, Math.PI * 2.15);
        ctx.arc(2, 4, 5.5, Math.PI * 2.1, Math.PI * 0.9, true);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Tail fan
        ctx.fillStyle = seared ? '#e04819' : '#f07154';
        ctx.beginPath();
        ctx.moveTo(10, 6);
        ctx.lineTo(17, 11);
        ctx.lineTo(12, 13);
        ctx.closePath();
        ctx.fill();
        // Sear stripes
        ctx.strokeStyle = seared ? '#ffd8a8' : '#ffd5c2';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-4, -8);
        ctx.lineTo(-2, -3);
        ctx.moveTo(3, -8);
        ctx.lineTo(2, -3);
        ctx.stroke();
        ctx.restore();
      }
      break;
    }

    case 'tofu':
    case 'chopped_tofu':
    case 'crispy_tofu': {
      const crispy = itemId === 'crispy_tofu';
      const cubes = itemId === 'tofu' ? [[0, 0, 22, 18]] : [[-8, -4, 12, 11], [6, -6, 12, 11], [-2, 6, 13, 11]];
      for (const [cx, cy, cw, ch] of cubes) {
        ctx.fillStyle = crispy ? '#e8aa46' : '#f7efdf';
        ctx.strokeStyle = crispy ? '#9e6216' : '#c9bca3';
        ctx.lineWidth = 1.8;
        drawRoundedRect(ctx, cx - cw / 2, cy - ch / 2, cw, ch, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = crispy ? '#ffd584' : '#ffffff';
        ctx.fillRect(cx - cw / 2 + 2, cy - ch / 2 + 2, cw - 5, 3);
      }
      break;
    }

    case 'bokchoy':
    case 'chopped_bokchoy': {
      if (itemId === 'bokchoy') {
        // Plump crisp stalks & jade leaves
        ctx.fillStyle = '#3c9e58';
        ctx.strokeStyle = '#1f5e32';
        ctx.lineWidth = 1.6;
        for (const angle of [-0.4, 0, 0.4]) {
          ctx.save();
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.ellipse(0, -6, 6.5, 11, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        ctx.fillStyle = '#d4efc1';
        ctx.beginPath();
        ctx.ellipse(0, 7, 8, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        // Chopped leafy ribbons & scallion rings
        ctx.fillStyle = '#48b868';
        ctx.strokeStyle = '#205e32';
        ctx.lineWidth = 1.5;
        for (const [lx, ly, rot] of [[-7, -2, -0.5], [5, -4, 0.4], [-2, 6, 0.15], [7, 5, -0.3]]) {
          ctx.save();
          ctx.translate(lx, ly);
          ctx.rotate(rot);
          drawRoundedRect(ctx, -6, -3.5, 12, 7, 3);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }
      break;
    }

    case 'broth':
    case 'simmered_broth': {
      const hot = itemId === 'simmered_broth';
      ctx.fillStyle = hot ? '#df8428' : '#b86c28';
      ctx.strokeStyle = '#6e3b11';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 1, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Rich broth sheen swirl
      ctx.strokeStyle = hot ? '#ffe194' : '#e0a967';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-2, 0, 9, 0.2, Math.PI * 1.4);
      ctx.stroke();
      if (hot) {
        ctx.fillStyle = '#fff0ba';
        ctx.beginPath();
        ctx.arc(6, -5, 2.3, 0, Math.PI * 2);
        ctx.arc(-6, 5, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'egg':
    case 'soft_egg': {
      for (const [ex, ey, rot] of [[-7, 1, -0.2], [7, -1, 0.22]]) {
        ctx.save();
        ctx.translate(ex, ey);
        ctx.rotate(rot);
        ctx.fillStyle = '#fff9ee';
        ctx.strokeStyle = '#c4b193';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Jammy amber yolk
        ctx.fillStyle = '#f59b1d';
        ctx.beginPath();
        ctx.arc(0, 2, 4.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd269';
        ctx.beginPath();
        ctx.arc(-1.2, 0.6, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      break;
    }

    case 'burnt_ash': {
      ctx.fillStyle = '#332e2c';
      ctx.strokeStyle = '#171413';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-4, 2, 9, 0, Math.PI * 2);
      ctx.arc(6, 0, 8, 0, Math.PI * 2);
      ctx.arc(0, -5, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ff5436';
      ctx.beginPath();
      ctx.arc(-2, 1, 1.8, 0, Math.PI * 2);
      ctx.arc(5, -2, 1.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    default: {
      if (itemId && itemId.startsWith('dish:')) {
        drawDishBowl(ctx, itemId.slice(5), 0, 0, 18, null);
      }
    }
  }

  ctx.restore();
}

/**
 * Draw a glazed ceramic bowl at (x, y) with radius `r`.
 * Pass `partsOverride` to render an in-progress dish mid-assembly!
 */
export function drawDishBowl(ctx, recipeId, x, y, r, partsOverride = null) {
  const recipe = recipeId ? RECIPE_BY_ID[recipeId] : null;
  const parts = partsOverride ?? (recipe ? recipe.parts : []);

  ctx.save();
  ctx.translate(x, y);

  // Drop shadow on counter
  ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.22, r * 1.04, r * 0.88, 0, 0, Math.PI * 2);
  ctx.fill();

  // Outer glazed ceramic bowl
  const isDonburi = recipe?.bowlStyle === 'donburi' || parts.includes('steamed_rice');
  ctx.fillStyle = isDonburi ? '#8f3426' : '#263447';
  ctx.strokeStyle = '#161414';
  ctx.lineWidth = Math.max(1.5, r * 0.08);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Inner cream ceramic rim
  ctx.fillStyle = '#f3ead8';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.84, 0, Math.PI * 2);
  ctx.fill();

  // Interior dark depth if bowl is empty
  ctx.fillStyle = '#ddd0b8';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
  ctx.fill();

  // Layer 1: Broth pool (if present)
  if (parts.includes('simmered_broth')) {
    const grad = ctx.createRadialGradient(-r * 0.15, -r * 0.15, r * 0.1, 0, 0, r * 0.78);
    grad.addColorStop(0, '#f2a944');
    grad.addColorStop(1, '#c7691c');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
    ctx.fill();
    // Aromatic chili-sesame oil droplets
    ctx.fillStyle = 'rgba(255, 224, 150, 0.7)';
    for (const [ox, oy, or] of [[-0.4, -0.2, 0.08], [0.35, 0.25, 0.07], [-0.15, 0.42, 0.06]]) {
      ctx.beginPath();
      ctx.arc(r * ox, r * oy, r * or, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Layer 2: Base carb (Boiled Noodles or Steamed Rice)
  if (parts.includes('boiled_noodles')) {
    drawIngredientIcon(ctx, 'boiled_noodles', 0, r * 0.04, (r / 24) * 1.05);
  }
  if (parts.includes('steamed_rice')) {
    drawIngredientIcon(ctx, 'steamed_rice', 0, r * 0.05, (r / 22) * 1.08);
  }

  // Layer 3: Protein toppings nestled around top-left / top-right
  if (parts.includes('seared_pork')) {
    drawIngredientIcon(ctx, 'seared_pork', -r * 0.3, -r * 0.24, r / 30);
  }
  if (parts.includes('seared_shrimp')) {
    drawIngredientIcon(ctx, 'seared_shrimp', r * 0.24, -r * 0.24, r / 29);
  }
  if (parts.includes('crispy_tofu')) {
    drawIngredientIcon(ctx, 'crispy_tofu', -r * 0.26, -r * 0.24, r / 29);
  }

  // Layer 4: Fresh greens and Jammy Egg
  if (parts.includes('chopped_bokchoy')) {
    drawIngredientIcon(ctx, 'chopped_bokchoy', -r * 0.28, r * 0.3, r / 30);
  }
  if (parts.includes('soft_egg')) {
    drawIngredientIcon(ctx, 'soft_egg', r * 0.32, r * 0.24, r / 28);
  }

  // Finished chopsticks, roasted nori strip, narutomaki fishcake, and scallion garnish when completed
  if (!partsOverride || (recipe && parts.length === recipe.parts.length)) {
    // Roasted nori seaweed sheet tucked along top-left rim
    ctx.save();
    ctx.translate(-r * 0.44, -r * 0.42);
    ctx.rotate(-0.42);
    ctx.fillStyle = '#1d2b22';
    ctx.strokeStyle = '#0e1712';
    ctx.lineWidth = 1.2;
    drawRoundedRect(ctx, -r * 0.24, -r * 0.14, r * 0.48, r * 0.28, 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Narutomaki swirl slice if ramen bowl
    if (recipe?.bowlStyle === 'ramen') {
      ctx.fillStyle = '#fff9f0';
      ctx.strokeStyle = '#d1c2ab';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(r * 0.08, -r * 0.36, r * 0.17, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#f0718d';
      ctx.lineWidth = Math.max(1.4, r * 0.045);
      ctx.beginPath();
      ctx.arc(r * 0.08, -r * 0.36, r * 0.09, 0, Math.PI * 1.6);
      ctx.stroke();
    }

    // Bamboo chopsticks across upper rim
    ctx.strokeStyle = '#6b3e22';
    ctx.lineWidth = Math.max(2, r * 0.09);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * 0.95, -r * 0.72);
    ctx.lineTo(r * 0.85, -r * 0.84);
    ctx.moveTo(-r * 0.92, -r * 0.56);
    ctx.lineTo(r * 0.88, -r * 0.74);
    ctx.stroke();

    // Scallion garnish & sesame dots
    ctx.fillStyle = '#4cd98c';
    for (const [sx, sy] of [[0, -0.05], [0.12, 0.14], [-0.08, 0.16]]) {
      ctx.beginPath();
      ctx.arc(r * sx, r * sy, Math.max(1.4, r * 0.06), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
