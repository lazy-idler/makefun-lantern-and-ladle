// Pantry ingredients, station transformation rules, and original bistro recipes
// for Lantern & Ladle. Every ingredient takes part in multiple recipes so cooks
// can overlap kettle simmering, knife prep, and wok searing during a service rush.

export const INGREDIENTS = [
  {
    id: 'noodles',
    name: 'Ramen Noodles',
    shortName: 'Noodles',
    hotkey: '1',
    needsChop: false,
    choppedId: null,
    cookStation: 'kettle',
    cookedId: 'boiled_noodles',
    cookedName: 'Boiled Noodles',
    baseColor: '#f5d27a',
    accentColor: '#d9a441',
  },
  {
    id: 'rice',
    name: 'Jasmine Rice',
    shortName: 'Rice',
    hotkey: '2',
    needsChop: false,
    choppedId: null,
    cookStation: 'kettle',
    cookedId: 'steamed_rice',
    cookedName: 'Steamed Rice',
    baseColor: '#faf6ee',
    accentColor: '#dfd4c0',
  },
  {
    id: 'pork',
    name: 'Pork Belly',
    shortName: 'Pork',
    hotkey: '3',
    needsChop: true,
    choppedId: 'chopped_pork',
    cookStation: 'wok',
    cookedId: 'seared_pork',
    cookedName: 'Seared Chashu',
    baseColor: '#e57c73',
    accentColor: '#f7d8cc',
  },
  {
    id: 'shrimp',
    name: 'Tiger Shrimp',
    shortName: 'Shrimp',
    hotkey: '4',
    needsChop: true,
    choppedId: 'chopped_shrimp',
    cookStation: 'wok',
    cookedId: 'seared_shrimp',
    cookedName: 'Garlic Shrimp',
    baseColor: '#ff8a5c',
    accentColor: '#ffd1ba',
  },
  {
    id: 'tofu',
    name: 'Silk Tofu',
    shortName: 'Tofu',
    hotkey: '5',
    needsChop: true,
    choppedId: 'chopped_tofu',
    cookStation: 'wok',
    cookedId: 'crispy_tofu',
    cookedName: 'Crispy Tofu',
    baseColor: '#f5ebd6',
    accentColor: '#d4a656',
  },
  {
    id: 'bokchoy',
    name: 'Bok Choy',
    shortName: 'Greens',
    hotkey: '6',
    needsChop: true,
    choppedId: 'chopped_bokchoy',
    cookStation: null,
    cookedId: 'chopped_bokchoy',
    cookedName: 'Crisp Greens',
    baseColor: '#52b86f',
    accentColor: '#c3e8a7',
  },
  {
    id: 'broth',
    name: 'Miso Stock',
    shortName: 'Broth',
    hotkey: '7',
    needsChop: false,
    choppedId: null,
    cookStation: 'kettle',
    cookedId: 'simmered_broth',
    cookedName: 'Miso Broth',
    baseColor: '#d98a36',
    accentColor: '#ffd480',
  },
  {
    id: 'egg',
    name: 'Jammy Egg',
    shortName: 'Egg',
    hotkey: '8',
    needsChop: false,
    choppedId: null,
    cookStation: null,
    cookedId: 'soft_egg',
    cookedName: 'Ajitama Egg',
    baseColor: '#fff8ea',
    accentColor: '#f29f24',
  },
];

export const ITEM_METADATA = {
  // Raw pantry items
  noodles: { label: 'Raw Noodles', stage: 'raw', rawId: 'noodles', nextStation: 'kettle', color: '#f5d27a' },
  rice: { label: 'Dry Rice', stage: 'raw', rawId: 'rice', nextStation: 'kettle', color: '#faf6ee' },
  pork: { label: 'Raw Pork', stage: 'raw', rawId: 'pork', nextStation: 'chop', color: '#e57c73' },
  shrimp: { label: 'Raw Shrimp', stage: 'raw', rawId: 'shrimp', nextStation: 'chop', color: '#ff8a5c' },
  tofu: { label: 'Fresh Tofu', stage: 'raw', rawId: 'tofu', nextStation: 'chop', color: '#f5ebd6' },
  bokchoy: { label: 'Whole Bok Choy', stage: 'raw', rawId: 'bokchoy', nextStation: 'chop', color: '#52b86f' },
  broth: { label: 'Cold Stock', stage: 'raw', rawId: 'broth', nextStation: 'kettle', color: '#d98a36' },
  egg: { label: 'Ajitama Egg', stage: 'ready', rawId: 'egg', nextStation: 'plate', color: '#f29f24' },

  // Prepped / chopped items
  chopped_pork: { label: 'Sliced Pork', stage: 'chopped', rawId: 'pork', nextStation: 'wok', color: '#e57c73' },
  chopped_shrimp: { label: 'Peeled Shrimp', stage: 'chopped', rawId: 'shrimp', nextStation: 'wok', color: '#ff8a5c' },
  chopped_tofu: { label: 'Cubed Tofu', stage: 'chopped', rawId: 'tofu', nextStation: 'wok', color: '#f5ebd6' },
  chopped_bokchoy: { label: 'Crisp Greens', stage: 'ready', rawId: 'bokchoy', nextStation: 'plate', color: '#52b86f' },

  // Cooked / plate-ready items
  boiled_noodles: { label: 'Boiled Noodles', stage: 'ready', rawId: 'noodles', nextStation: 'plate', color: '#f7db86' },
  steamed_rice: { label: 'Steamed Rice', stage: 'ready', rawId: 'rice', nextStation: 'plate', color: '#fffcf5' },
  seared_pork: { label: 'Seared Chashu', stage: 'ready', rawId: 'pork', nextStation: 'plate', color: '#c45b3b' },
  seared_shrimp: { label: 'Garlic Shrimp', stage: 'ready', rawId: 'shrimp', nextStation: 'plate', color: '#ff6f43' },
  crispy_tofu: { label: 'Crispy Tofu', stage: 'ready', rawId: 'tofu', nextStation: 'plate', color: '#e3ac4b' },
  simmered_broth: { label: 'Miso Broth', stage: 'ready', rawId: 'broth', nextStation: 'plate', color: '#e39034' },
  soft_egg: { label: 'Ajitama Egg', stage: 'ready', rawId: 'egg', nextStation: 'plate', color: '#f29f24' },

  // Failure state
  burnt_ash: { label: 'Burnt Scrap', stage: 'burnt', rawId: null, nextStation: 'trash', color: '#3b3736' },
};

export const RECIPES = [
  {
    id: 'velvet_miso_ramen',
    name: 'Velvet Miso Ramen',
    shortName: 'Miso Ramen',
    bowlStyle: 'ramen',
    basePay: 36,
    tipBonus: 12,
    parts: ['boiled_noodles', 'simmered_broth', 'seared_pork', 'soft_egg'],
    accent: '#e89b3c',
  },
  {
    id: 'jade_tofu_ramen',
    name: 'Jade Tofu Ramen',
    shortName: 'Tofu Ramen',
    bowlStyle: 'ramen',
    basePay: 34,
    tipBonus: 11,
    parts: ['boiled_noodles', 'simmered_broth', 'crispy_tofu', 'chopped_bokchoy'],
    accent: '#59be78',
  },
  {
    id: 'dragon_shrimp_noodles',
    name: 'Dragon Shrimp Mazemen',
    shortName: 'Shrimp Noodles',
    bowlStyle: 'ramen',
    basePay: 34,
    tipBonus: 11,
    parts: ['boiled_noodles', 'seared_shrimp', 'chopped_bokchoy', 'soft_egg'],
    accent: '#ff7043',
  },
  {
    id: 'midnight_chashu_don',
    name: 'Midnight Chashu Don',
    shortName: 'Chashu Don',
    bowlStyle: 'donburi',
    basePay: 36,
    tipBonus: 12,
    parts: ['steamed_rice', 'seared_pork', 'chopped_bokchoy', 'soft_egg'],
    accent: '#cc5b43',
  },
  {
    id: 'ember_shrimp_bowl',
    name: 'Ember Shrimp Bowl',
    shortName: 'Shrimp Bowl',
    bowlStyle: 'donburi',
    basePay: 28,
    tipBonus: 9,
    parts: ['steamed_rice', 'seared_shrimp', 'chopped_bokchoy'],
    accent: '#ff8e53',
  },
  {
    id: 'golden_ochazuke',
    name: 'Golden Tofu Ochazuke',
    shortName: 'Tofu Ochazuke',
    bowlStyle: 'donburi',
    basePay: 34,
    tipBonus: 11,
    parts: ['steamed_rice', 'simmered_broth', 'crispy_tofu', 'soft_egg'],
    accent: '#f0b849',
  },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

/** Convert a pantry pickup into the item id carried in hand (egg goes straight to ready form). */
export function resolvePickupItem(ingredientId) {
  const ing = INGREDIENT_BY_ID[ingredientId];
  if (!ing) return null;
  if (!ing.needsChop && !ing.cookStation) return ing.cookedId;
  return ing.id;
}

/** Normalize an item id to its plate-ready part id if it is already plate-ready. */
export function isPlateReadyPart(itemId) {
  return ITEM_METADATA[itemId]?.stage === 'ready';
}

/** Find every recipe that contains all currently plated parts plus an optional candidate part. */
export function matchingRecipesForParts(platedParts, candidatePart = null) {
  const combined = candidatePart ? [...platedParts, candidatePart] : platedParts;
  if (combined.length === 0) return RECIPES;
  return RECIPES.filter((recipe) => {
    const remaining = [...recipe.parts];
    for (const part of combined) {
      const idx = remaining.indexOf(part);
      if (idx === -1) return false;
      remaining.splice(idx, 1);
    }
    return true;
  });
}

/** Return the exact completed recipe if platedParts matches a recipe's full ingredient list. */
export function findCompletedRecipe(platedParts) {
  for (const recipe of RECIPES) {
    if (recipe.parts.length !== platedParts.length) continue;
    const sortedA = [...recipe.parts].sort();
    const sortedB = [...platedParts].sort();
    if (sortedA.every((p, idx) => p === sortedB[idx])) return recipe;
  }
  return null;
}
