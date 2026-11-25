// Core layout, palette, timing constants, shift progression, and upgrade specs
// for Lantern & Ladle. Logical playfield is fixed at 1280x720 and scaled smoothly.

export const FIELD = {
  width: 1280,
  height: 720,
};

export const STEP = 1 / 60;
export const MAX_FRAME = 0.25;
export const BEST_STORAGE_KEY = 'lantern-and-ladle.best.v1';

export const FONT_UI = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
export const FONT_MONO = '"Cascadia Mono", "Consolas", ui-monospace, monospace';

export const PALETTE = {
  backdrop: '#140f0d',
  hudBg: '#1c1512',
  hudBorder: '#6e4c2e',
  wallTop: '#242933',
  wallTile: '#2c323e',
  wallGrout: '#1d2129',
  railSteel: '#596370',
  railHighlight: '#8b97a8',
  counterWood: '#5c3621',
  counterTop: '#7a492d',
  counterEdge: '#3e2214',
  mapleBlock: '#dfb37c',
  mapleDark: '#c08c54',
  slateDeck: '#313742',
  brass: '#e6b450',
  brassBright: '#ffd773',
  copper: '#c96f44',
  copperGlow: '#f29a63',
  flameBlue: '#39b8ff',
  flameCore: '#fff1a8',
  flameOrange: '#ff6f2c',
  steam: 'rgba(255, 248, 236, 0.55)',
  ticketPaper: '#fbf4e4',
  ticketHeader: '#2a2421',
  ticketUrgent: '#e2493f',
  ticketWarn: '#e8a235',
  ticketSafe: '#46b879',
  readyGlow: '#4cd98c',
  burnRed: '#ff483b',
  textLight: '#fdf7ec',
  textMuted: '#b7a99a',
  textDark: '#261c17',
  chefWhite: '#f9f6f0',
  chefApron: '#c95335',
  chefSkin: '#f2c6a0',
};

export const HUD_BAR = {
  height: 54,
};

export const TICKET_RAIL = {
  y: 56,
  height: 118,
  cardWidth: 214,
  cardHeight: 108,
  gap: 14,
  startX: 22,
  maxTickets: 5,
};

// Five primary workstations positioned left-to-right across the main kitchen line.
export const STATIONS = {
  chop: { id: 'chop', label: 'CHOP BLOCK', keyHint: 'C', x: 32, y: 314, w: 212, h: 184, interactX: 138 },
  kettle: { id: 'kettle', label: 'BROTH KETTLE', keyHint: 'B', x: 266, y: 314, w: 212, h: 184, interactX: 372 },
  wok: { id: 'wok', label: 'EMBER WOK', keyHint: 'F', x: 500, y: 314, w: 218, h: 184, interactX: 609 },
  plate: { id: 'plate', label: 'ASSEMBLY', keyHint: 'Space', x: 740, y: 314, w: 238, h: 184, interactX: 859 },
  pass: { id: 'pass', label: 'SERVE PASS', keyHint: 'Enter', x: 1000, y: 308, w: 248, h: 146, interactX: 1106 },
  trash: { id: 'trash', label: 'WASH SINK', keyHint: 'X', x: 1126, y: 462, w: 122, h: 52, interactX: 1172 },
};

export const CHEF_CONFIG = {
  y: 542,
  speed: 480,
  minX: 84,
  maxX: 1200,
};

// Bottom refrigerated ingredient rail (8 distinct crisp trays bound to keys 1..8).
export const PANTRY = {
  y: 564,
  height: 150,
  startX: 28,
  trayW: 144,
  trayH: 120,
  gap: 11,
  trayY: 580,
};

export const COOKING_TIMES = {
  chopHitsRequired: 3,
  kettleCookSec: 2.8,
  kettleOvercookSec: 8.5,
  wokCookSec: 3.0,
  wokPerfectWindowStart: 2.3,
  wokBurnSec: 7.4,
  wokTossBoostSec: 0.65,
};

export const SHIFTS = [
  { shift: 1, name: 'Twilight Service', durationSec: 95, spawnEverySec: 6.2, maxActiveOrders: 4, basePatienceSec: 46, scoreGoal: 320 },
  { shift: 2, name: 'Dinner Rush', durationSec: 105, spawnEverySec: 5.0, maxActiveOrders: 5, basePatienceSec: 42, scoreGoal: 540 },
  { shift: 3, name: 'Midnight Peak', durationSec: 115, spawnEverySec: 4.2, maxActiveOrders: 5, basePatienceSec: 38, scoreGoal: 800 },
];

export const UPGRADE_CATALOG = [
  { id: 'cleaver', name: 'Twin-Edge Cleaver', desc: 'Chop ingredients in 2 crisp strikes instead of 3', cost: 110 },
  { id: 'kettle', name: 'Copper Pressure Kettle', desc: 'Boil noodles, rice & miso broth 30% faster', cost: 130 },
  { id: 'wok', name: 'Seasoned Wok Hei', desc: 'Tossing adds +35% speed & extends safe sear window', cost: 140 },
  { id: 'heatlamp', name: 'Warming Pass Lamps', desc: 'Customers wait +20% longer & tips increase +$6', cost: 150 },
];
