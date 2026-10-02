// Lantern Cliff, the restaurant: its ingredients, dishes, garnishes, recipe
// cards, upgrades and decor. Everything here is plain data plus little canvas
// sticker painters in the same toon style as the bakery's.
import {
  INK, TAU, mixHex, dk, lt, E, Ci, R, P, ts, cloud, tube, line, dots, inEll, plate, steam, cylinder,
} from './sticker.js';

// ------------------------------------------------------------------ shared sticker bits

const PLATE = '#FFFFFF';
// a wide-rimmed fine-dining plate with a navy band
function finePlate(c, y = 74, rx = 45, ry = 14) {
  plate(c, 50, y, rx, ry, PLATE);
  c.beginPath();
  c.ellipse(50, y - 0.5, rx * 0.86, ry * 0.8, 0, 0, TAU);
  c.lineWidth = 1.4;
  c.strokeStyle = '#3E5C76';
  c.stroke();
}
function bowlSide(c, y, rx, depth, col = '#FFFFFF') {
  const path = (cc) => {
    cc.beginPath();
    cc.moveTo(50 - rx, y);
    cc.quadraticCurveTo(50 - rx * 0.9, y + depth, 50, y + depth);
    cc.quadraticCurveTo(50 + rx * 0.9, y + depth, 50 + rx, y);
    cc.closePath();
  };
  ts(c, path, col, { off: 2 });
}
function leaf(c, x, y, s = 1, rot = 0, col = '#6E9F4E') {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  ts(c, E(0, 0, 7 * s, 3.6 * s), col, { off: 1, lw: 1.8 });
  line(c, [[-5 * s, 0], [5 * s, 0]], 1, mixHex(col, INK, 0.35));
  c.restore();
}
function drizzleLine(c, pts, col, w = 2.6) { tube(c, pts, col, w, { lw: 1.4 }); }
function shrimpIcon(c, x, y, s = 1, rot = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.beginPath();
  c.arc(0, 0, 9 * s, Math.PI * 0.15, Math.PI * 1.25);
  c.lineWidth = 7 * s;
  c.strokeStyle = INK;
  c.lineCap = 'round';
  c.stroke();
  c.lineWidth = 4.6 * s;
  c.strokeStyle = '#F4956A';
  c.stroke();
  for (let i = 0; i < 3; i++) {
    const a = Math.PI * (0.4 + i * 0.3);
    line(c, [[Math.cos(a) * 6.5 * s, Math.sin(a) * 6.5 * s], [Math.cos(a) * 11 * s, Math.sin(a) * 11 * s]], 1, '#FFD2B8');
  }
  c.restore();
}
function tomatoIcon(c, x, y, r) {
  ts(c, E(x, y, r, r * 0.9), '#E4483E', { gloss: [x - r * 0.35, y - r * 0.35, r * 0.25] });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU - Math.PI / 2;
    line(c, [[x, y - r * 0.8], [x + Math.cos(a) * r * 0.45, y - r * 0.8 + Math.sin(a) * r * 0.25]], 2.2, '#5E8F3E');
  }
}
function steakIcon(c, x, y, s = 1, seared = true) {
  const path = (cc) => {
    cc.beginPath();
    cc.moveTo(x - 20 * s, y - 4 * s);
    cc.quadraticCurveTo(x - 16 * s, y - 14 * s, x + 2 * s, y - 13 * s);
    cc.quadraticCurveTo(x + 22 * s, y - 12 * s, x + 20 * s, y + 2 * s);
    cc.quadraticCurveTo(x + 16 * s, y + 12 * s, x - 2 * s, y + 11 * s);
    cc.quadraticCurveTo(x - 22 * s, y + 8 * s, x - 20 * s, y - 4 * s);
    cc.closePath();
  };
  ts(c, path, seared ? '#8A4A2E' : '#D8606A', { off: 2 });
  if (seared) for (const dx of [-10, -2, 6, 14]) line(c, [[x + dx * s, y - 9 * s], [x + (dx - 6) * s, y + 8 * s]], 2, '#4E2A1A');
  else line(c, [[x - 12 * s, y], [x + 12 * s, y - 2 * s]], 2, '#F5D2CC');
}
function salmonIcon(c, x, y, s = 1, seared = true) {
  ts(c, R(x - 18 * s, y - 9 * s, 36 * s, 18 * s, 7 * s), seared ? '#F08A5A' : '#F6A07E', { off: 2 });
  for (const dx of [-8, 0, 8]) line(c, [[x + dx * s, y - 7 * s], [x + (dx + 4) * s, y + 7 * s]], 1.5, '#FFE2CC');
  if (seared) ts(c, R(x - 18 * s, y - 9 * s, 36 * s, 6 * s, 3 * s), '#B9643A', { off: 1, lw: 1.6 });
}
function pastaNest(c, x, y, rx, col = '#F4D58A') {
  for (let i = 0; i < 4; i++) {
    c.beginPath();
    c.ellipse(x, y, rx - i * 4, (rx - i * 4) * 0.45, 0, 0, TAU);
    c.lineWidth = 6;
    c.strokeStyle = INK;
    c.stroke();
    c.lineWidth = 3.8;
    c.strokeStyle = i % 2 ? col : lt(col, 0.25);
    c.stroke();
  }
}

// ------------------------------------------------------------------ ingredients

// [id, name, zone, color, bit color]; ids shared with the bakery reuse its art
export const R_ING_DEF = [
  ['flour', 'Flour', 'dry', '#EFE0C2', '#FFF6E4'],
  ['sugar', 'Sugar', 'dry', '#FFFBF0', '#FFFFFF'],
  ['pasta', 'Pasta', 'dry', '#F4D58A', '#F4D58A'],
  ['rice', 'Arborio Rice', 'dry', '#F6EFDC', '#FFFBF0'],
  ['olive-oil', 'Olive Oil', 'dry', '#B9B23A', '#D9C85A'],
  ['bread', 'Baguette', 'dry', '#E9A95A', '#E9A95A'],
  ['chocolate', 'Chocolate', 'dry', '#6A4029', '#5A3422'],
  ['tomatoes', 'Tomatoes', 'dry', '#E4483E', '#E4483E'],
  ['garlic', 'Garlic', 'dry', '#F6EEDC', '#FFF6E4'],
  ['onions', 'Onions', 'dry', '#D9A05B', '#F6E6C8'],
  ['potatoes', 'Potatoes', 'dry', '#C9965A', '#F6E2A8'],
  ['mushrooms', 'Mushrooms', 'dry', '#C9A27A', '#D9BC98'],
  ['basil', 'Basil', 'dry', '#5E9F4E', '#6EAF5A'],
  ['lemons', 'Lemons', 'dry', '#FFE066', '#FFE066'],
  ['butter', 'Butter', 'cold', '#FFE27A', '#FFE9A0'],
  ['cream', 'Cream', 'cold', '#F7B9C4', '#FFFBF0'],
  ['eggs', 'Eggs', 'cold', '#FFF6E4', '#FFD86A'],
  ['parmesan', 'Parmesan', 'cold', '#F3D98A', '#FBE8B0'],
  ['mozzarella', 'Mozzarella', 'cold', '#FFFBF0', '#FFFBF0'],
  ['raspberries', 'Raspberries', 'cold', '#D8406A', '#D8406A'],
  ['salmon', 'Salmon', 'cold', '#F6A07E', '#F6A07E'],
  ['shrimp', 'Shrimp', 'cold', '#F4956A', '#F4956A'],
  ['steak', 'Steak', 'cold', '#D8606A', '#C8505A'],
  ['chicken', 'Chicken', 'cold', '#F3D2A8', '#F6DDB8'],
];

export const R_ING_ICON = {
  pasta: (c) => {
    ts(c, R(30, 22, 40, 64, 10), '#E9F5FA', { gloss: [38, 36, 4] });
    for (let i = 0; i < 9; i++) line(c, [[36 + i * 3.5, 28], [35 + i * 3.6, 80]], 2.4, i % 2 ? '#E9C26A' : '#F4D58A');
    ts(c, R(28, 16, 44, 12, 5), '#3E5C76', { off: 1.5 });
  },
  rice: (c, r) => {
    const sack = P([[30, 30], [70, 30], [78, 86], [22, 86]]);
    ts(c, sack, '#E6D3A8');
    ts(c, E(50, 30, 20, 6), '#FFFBF0', { off: 1 });
    dots(c, r, 18, inEll(50, 29, 16, 4), '#E9E0C8', 1.6);
    ts(c, R(32, 52, 36, 18, 4), '#3E5C76', { off: 1, lw: 2 });
    line(c, [[40, 61], [60, 61]], 2.6, '#FFF6E4');
  },
  'olive-oil': (c) => {
    ts(c, P([[40, 36], [60, 36], [66, 50], [66, 88], [34, 88], [34, 50]]), '#B9B23A', { gloss: [44, 60, 4] });
    ts(c, R(44, 18, 12, 18, 3), '#B9B23A', { off: 1, lw: 2.2 });
    ts(c, R(42, 12, 16, 8, 3), '#8A5A3B', { off: 1, lw: 2 });
    ts(c, R(36, 58, 28, 18, 3), '#FFF6E4', { off: 1, lw: 1.8 });
    leaf(c, 50, 67, 0.9, 0.3, '#6E9F4E');
  },
  tomatoes: (c) => { tomatoIcon(c, 36, 60, 17); tomatoIcon(c, 64, 62, 15); tomatoIcon(c, 50, 40, 13); },
  garlic: (c) => {
    for (const [x, y, s] of [[38, 60, 1], [62, 62, 0.9]]) {
      const bulb = (cc) => {
        cc.beginPath();
        cc.moveTo(x, y - 24 * s);
        cc.quadraticCurveTo(x + 22 * s, y - 8 * s, x + 16 * s, y + 14 * s);
        cc.quadraticCurveTo(x, y + 20 * s, x - 16 * s, y + 14 * s);
        cc.quadraticCurveTo(x - 22 * s, y - 8 * s, x, y - 24 * s);
        cc.closePath();
      };
      ts(c, bulb, '#F6EEDC');
      for (const dx of [-7, 0, 7]) line(c, [[x + dx * s * 0.5, y - 18 * s], [x + dx * s, y + 14 * s]], 1.4, '#D9C8A8');
    }
  },
  onions: (c) => {
    for (const [x, y, s] of [[38, 60, 1], [64, 58, 0.85]]) {
      ts(c, E(x, y, 17 * s, 15 * s), '#D9A05B', { gloss: [x - 6 * s, y - 6 * s, 3] });
      ts(c, P([[x - 4 * s, y - 14 * s], [x + 4 * s, y - 14 * s], [x + 1, y - 24 * s], [x - 1, y - 24 * s]]), '#C98A4A', { off: 1, lw: 2 });
      for (const dx of [-8, 0, 8]) line(c, [[x + dx * s * 0.3, y - 13 * s], [x + dx * s, y + 13 * s]], 1.2, '#B97A43');
    }
  },
  potatoes: (c, r) => {
    for (const [x, y, rx, ry, rot] of [[38, 62, 18, 13, 0.3], [62, 56, 16, 12, -0.4], [50, 40, 13, 10, 0.1]]) {
      ts(c, E(x, y, rx, ry, rot), '#C9965A');
      dots(c, r, 4, inEll(x, y, rx * 0.6, ry * 0.6), '#8A5A3B', 1.2);
    }
  },
  mushrooms: (c) => {
    for (const [x, y, s] of [[38, 64, 1], [62, 60, 0.9]]) {
      ts(c, R(x - 6 * s, y - 4 * s, 12 * s, 22 * s, 5 * s), '#F3E6CC', { off: 1 });
      const cap = (cc) => { cc.beginPath(); cc.ellipse(x, y - 4 * s, 18 * s, 14 * s, 0, Math.PI, 0); cc.closePath(); };
      ts(c, cap, '#C9A27A', { gloss: [x - 6 * s, y - 12 * s, 3] });
    }
  },
  basil: (c) => {
    ts(c, P([[36, 70], [64, 70], [60, 90], [40, 90]]), '#E8893A', { off: 1.5 });
    for (const [x, y, rot, s] of [[42, 56, -0.8, 1.4], [58, 54, 0.7, 1.4], [50, 42, -0.1, 1.5], [40, 40, -1.2, 1.1], [60, 40, 1.1, 1.1], [50, 62, 0.2, 1.2]]) leaf(c, x, y, s, rot, '#5E9F4E');
  },
  parmesan: (c, r) => {
    ts(c, P([[20, 70], [80, 54], [76, 76], [24, 88]]), '#E9C67A');
    ts(c, P([[20, 70], [80, 54], [74, 46], [26, 58]]), '#FBE8B0', { off: 2 });
    dots(c, r, 10, inEll(50, 66, 20, 6), '#E3B860', 1.4);
    ts(c, P([[20, 70], [24, 88], [28, 86], [24, 68]]), '#C9963A', { off: 1, lw: 2 });
  },
  mozzarella: (c) => {
    ts(c, E(50, 70, 32, 12), '#AFD6EC', { off: 1.5 });
    for (const [x, y, rr] of [[38, 58, 13], [62, 58, 12], [50, 46, 12]]) ts(c, Ci(x, y, rr), '#FFFBF0', { gloss: [x - 4, y - 4, 3] });
  },
  raspberries: (c) => {
    for (const [x, y] of [[36, 60], [60, 62], [48, 42]]) {
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU;
        ts(c, Ci(x + Math.cos(a) * 6, y + Math.sin(a) * 6, 5), '#D8406A', { off: 1, lw: 1.6 });
      }
      ts(c, Ci(x, y, 5), '#E85A80', { off: 1, lw: 1.6 });
    }
  },
  salmon: (c) => {
    ts(c, E(50, 70, 36, 11), '#AFD6EC', { off: 1.5 });
    salmonIcon(c, 50, 54, 1.3, false);
  },
  shrimp: (c) => {
    ts(c, E(50, 70, 34, 12), '#E9F5FA', { off: 1.5 });
    shrimpIcon(c, 38, 56, 1.3, 0.3);
    shrimpIcon(c, 62, 54, 1.2, -0.4);
  },
  steak: (c) => {
    ts(c, P([[18, 66], [82, 58], [86, 78], [22, 86]]), '#F3E6CC', { off: 1.5 });
    steakIcon(c, 50, 60, 1.4, false);
  },
  chicken: (c) => {
    ts(c, E(50, 74, 36, 11), '#AFD6EC', { off: 1.5 });
    ts(c, E(50, 56, 24, 17), '#F3D2A8', { gloss: [42, 48, 5] });
    for (const sx of [-1, 1]) {
      ts(c, E(50 + sx * 22, 64, 9, 6, sx * 0.6), '#F3D2A8', { off: 1, lw: 2 });
      ts(c, Ci(50 + sx * 29, 68, 3.5), '#FFFBF0', { off: 0.5, lw: 1.6 });
    }
  },
};

// prepping at the counter: special ingredients get worked before they go in
export const R_ING_PREP = {
  tomatoes: { label: 'Slice the tomatoes', mode: 'tap', n: 5 },
  garlic: { label: 'Smash the garlic', mode: 'hit', n: 3 },
  onions: { label: 'Peel the onions', mode: 'swirl', n: 1 },
  potatoes: { label: 'Peel the potatoes', mode: 'swirl', n: 2 },
  mushrooms: { label: 'Slice the mushrooms', mode: 'tap', n: 5 },
  basil: { label: 'Tear the basil', mode: 'zigzag', n: 4 },
  lemons: { label: 'Zest the lemon', mode: 'roll', n: 1 },
  parmesan: { label: 'Grate the parmesan', mode: 'roll', n: 1 },
  mozzarella: { label: 'Slice the mozzarella', mode: 'hit', n: 3 },
  salmon: { label: 'Debone the salmon', mode: 'hit', n: 3 },
  shrimp: { label: 'Peel the shrimp', mode: 'alternate', n: 6 },
  steak: { label: 'Tenderize the steak', mode: 'tap', n: 6 },
  chicken: { label: 'Season the chicken', mode: 'hold', n: 1 },
  eggs: { label: 'Crack the eggs', mode: 'hit', n: 2 },
  chocolate: { label: 'Chop the chocolate', mode: 'tap', n: 5 },
};

// ------------------------------------------------------------------ stations, menu sections

export const R_STATIONS = {
  storage: { name: 'Pantry', short: 'Gather' },
  mix: { name: 'Mixer', short: 'Mix' },
  prep: { name: 'Prep Counter', short: 'Prep' },
  bake: { name: 'Hearth Oven', short: 'Bake' },
  cook: { name: 'Range', short: 'Cook' },
  chill: { name: 'Chiller', short: 'Chill' },
  decor: { name: 'Plating Station', short: 'Plate' },
};

export const R_CATEGORIES = [
  { id: 'starters', name: 'Starters & Soups', color: '#E4835E', day: 1 },
  { id: 'pasta', name: 'Pasta & Risotto', color: '#F4D58A', day: 1 },
  { id: 'sea', name: 'From the Sea', color: '#86BADB', day: 2 },
  { id: 'grill', name: 'From the Grill', color: '#C9784A', day: 3 },
  { id: 'sweet', name: 'Desserts', color: '#EE93A6', day: 4 },
  { id: 'signature', name: "Chef's Signatures", color: '#D9A441', day: 5 },
];

// ------------------------------------------------------------------ the menu

export const R_DISHES = [
  ['caprese', 'Caprese Salad', 'starters', 'Fanned tomato and mozzarella slices with torn basil and a ribbon of olive oil.',
    (c) => {
      finePlate(c);
      for (let i = 0; i < 6; i++) {
        const a = Math.PI * (1.05 + i * 0.18);
        const x = 50 + Math.cos(a) * 22, y = 66 + Math.sin(a) * 9;
        ts(c, E(x, y, 10, 6), i % 2 ? '#FFFBF0' : '#E4483E', { off: 1, lw: 2 });
      }
      leaf(c, 40, 58, 1.1, -0.4, '#5E9F4E');
      leaf(c, 58, 56, 1.1, 0.5, '#5E9F4E');
      drizzleLine(c, [[30, 70], [44, 66], [58, 70], [72, 64]], '#C9C04A', 2.2);
    }],
  ['tomato-bisque', 'Tomato Bisque', 'starters', 'Velvety roasted tomato soup with a swirl of cream and a basil leaf.',
    (c) => {
      finePlate(c, 80, 42, 12);
      ts(c, E(50, 58, 30, 10), '#FFFFFF', { off: 2 });
      bowlSide(c, 58, 30, 22);
      ts(c, E(50, 58, 25, 7.5), '#E0573E', { off: 2, lw: 2 });
      tube(c, [[38, 58], [46, 55], [56, 60], [62, 56]], '#FFF3DC', 2.6, { lw: 1.2 });
      leaf(c, 56, 56, 0.9, 0.4, '#5E9F4E');
      steam(c, [40, 58], 44);
    }],
  ['bruschetta', 'Bruschetta', 'starters', 'Toasted baguette slices piled with garlicky tomatoes, basil and balsamic.',
    (c, r) => {
      finePlate(c);
      for (const [x, y, rot] of [[34, 64, -0.2], [52, 60, 0.1], [68, 66, 0.3]]) {
        c.save();
        c.translate(x, y);
        c.rotate(rot);
        ts(c, E(0, 0, 13, 7), '#D9984A', { off: 1.5 });
        ts(c, E(0, -2, 10, 5), '#F6D39A', { off: 1, lw: 1.6 });
        dots(c, r, 6, inEll(0, -3, 8, 3.5), '#E4483E', 2.3);
        c.restore();
      }
      leaf(c, 52, 54, 0.7, 0.2, '#5E9F4E');
      drizzleLine(c, [[26, 72], [40, 70], [56, 74], [74, 70]], '#4E2A2A', 1.8);
    }],
  ['mushroom-soup', 'Wild Mushroom Soup', 'starters', 'Silky mushroom soup with a drizzle of cream and fresh thyme.',
    (c) => {
      finePlate(c, 80, 42, 12);
      ts(c, E(50, 58, 30, 10), '#FFFFFF', { off: 2 });
      bowlSide(c, 58, 30, 22);
      ts(c, E(50, 58, 25, 7.5), '#C9A27A', { off: 2, lw: 2 });
      tube(c, [[36, 58], [44, 56], [52, 60], [60, 56], [66, 58]], '#FFF3DC', 2.2, { lw: 1.2 });
      for (const [x, y] of [[44, 56], [58, 59]]) {
        const cap = (cc) => { cc.beginPath(); cc.ellipse(x, y, 5, 3.5, 0, Math.PI, 0); cc.closePath(); };
        ts(c, cap, '#8A5A3B', { off: 1, lw: 1.4 });
      }
      steam(c, [42, 58], 44);
    }],
  ['spaghetti', 'Spaghetti Pomodoro', 'pasta', 'A twirled nest of spaghetti in bright tomato sauce with parmesan and basil.',
    (c) => {
      finePlate(c);
      pastaNest(c, 50, 62, 22);
      ts(c, E(50, 58, 13, 5), '#D8402E', { off: 1.5, lw: 2 });
      ts(c, E(48, 56, 6, 2), '#F07050', { flat: true, lw: 0 });
      leaf(c, 56, 52, 0.9, 0.4, '#5E9F4E');
    }],
  ['fettuccine', 'Fettuccine Alfredo', 'pasta', 'Silky hand-cut ribbons in a creamy parmesan sauce with cracked pepper.',
    (c, r) => {
      finePlate(c);
      pastaNest(c, 50, 62, 22, '#F6E2A8');
      ts(c, E(50, 58, 12, 4), '#FFF3DC', { off: 1, lw: 1.6 });
      dots(c, r, 12, inEll(50, 58, 16, 6), '#4B2E1D', 1);
      dots(c, r, 10, inEll(50, 56, 12, 4), '#FBE8B0', 1.6);
    }],
  ['risotto', 'Mushroom Risotto', 'pasta', 'Creamy arborio rice with golden mushrooms, shaved parmesan and herbs.',
    (c, r) => {
      finePlate(c);
      ts(c, E(50, 64, 28, 10), '#F3E3B8', { off: 2 });
      dots(c, r, 30, inEll(50, 64, 24, 8), '#FFFBF0', 1.6);
      for (const [x, y] of [[40, 62], [56, 60], [50, 67], [62, 66]]) {
        const cap = (cc) => { cc.beginPath(); cc.ellipse(x, y, 5, 3.5, 0, Math.PI, 0); cc.closePath(); };
        ts(c, cap, '#A8744A', { off: 1, lw: 1.4 });
      }
      for (const [x, y] of [[46, 58], [54, 64]]) ts(c, R(x - 4, y - 2, 8, 3, 1.5), '#FBE8B0', { off: 0.5, lw: 1.2 });
      dots(c, r, 8, inEll(50, 62, 18, 6), '#6E9F4E', 1.3);
    }],
  ['ravioli', 'Lemon Ravioli', 'pasta', 'Pillowy mozzarella ravioli in lemon butter with herbs.',
    (c, r) => {
      finePlate(c);
      for (const [x, y] of [[36, 62], [52, 58], [64, 66], [46, 70]]) {
        ts(c, R(x - 9, y - 7, 18, 14, 3), '#F6E2A8', { off: 1.5, lw: 2 });
        c.setLineDash([2, 2]);
        line(c, [[x - 7, y - 5], [x + 7, y - 5], [x + 7, y + 5], [x - 7, y + 5], [x - 7, y - 5]], 1, '#C9A25A');
        c.setLineDash([]);
      }
      dots(c, r, 10, inEll(50, 64, 20, 7), '#FFE066', 1.6);
      dots(c, r, 8, inEll(50, 64, 20, 7), '#6E9F4E', 1.2);
    }],
  ['salmon', 'Seared Salmon', 'sea', 'Crispy-skinned salmon on a swoosh of potato purée with lemon.',
    (c) => {
      finePlate(c);
      tube(c, [[26, 70], [42, 64], [60, 68], [74, 62]], '#F6E6C0', 8, { lw: 2 });
      salmonIcon(c, 50, 58, 0.95, true);
      ts(c, P([[66, 60], [76, 58], [72, 50]]), '#FFE066', { off: 1, lw: 1.8 });
      leaf(c, 42, 52, 0.7, -0.5, '#6E9F4E');
    }],
  ['garlic-shrimp', 'Garlic Butter Shrimp', 'sea', 'Sizzling shrimp in garlic butter with lemon and parsley.',
    (c, r) => {
      finePlate(c);
      ts(c, E(50, 66, 26, 8), '#F6D06A', { flat: true, lw: 0 });
      for (const [x, y, rot] of [[36, 62, 0.4], [50, 58, -0.2], [64, 62, 0.8], [44, 68, 1.6], [58, 68, -1]]) shrimpIcon(c, x, y, 0.75, rot);
      dots(c, r, 10, inEll(50, 64, 22, 7), '#6E9F4E', 1.3);
      ts(c, P([[70, 56], [80, 58], [76, 48]]), '#FFE066', { off: 1, lw: 1.8 });
    }],
  ['paella', 'Seafood Paella', 'sea', 'Saffron rice with shrimp and lemon, served sizzling in its pan.',
    (c, r) => {
      ts(c, E(50, 70, 42, 15), '#3A3A44', { off: 2 });
      ts(c, R(84, 64, 14, 6, 3), '#3A3A44', { off: 1, lw: 2 });
      ts(c, E(50, 66, 36, 11), '#F2B640', { off: 2, lw: 2 });
      dots(c, r, 30, inEll(50, 66, 32, 9), '#FFE08A', 1.4);
      dots(c, r, 8, inEll(50, 66, 30, 9), '#E4483E', 2);
      for (const [x, y, rot] of [[36, 64, 0.3], [56, 62, -0.4], [66, 68, 0.9]]) shrimpIcon(c, x, y, 0.7, rot);
      ts(c, P([[44, 70], [54, 72], [48, 64]]), '#FFE066', { off: 1, lw: 1.6 });
    }],
  ['fish-chips', 'Fish & Chips', 'sea', 'Golden battered fish and thick-cut chips with a lemon wedge.',
    (c, r) => {
      finePlate(c);
      for (let i = 0; i < 7; i++) {
        c.save();
        c.translate(62 + (i % 3) * 5, 64 - (i % 2) * 4);
        c.rotate(-0.8 + i * 0.25);
        ts(c, R(-3, -12, 6, 24, 2), '#F2C060', { off: 1, lw: 1.6 });
        c.restore();
      }
      const fish = (cc) => { cc.beginPath(); cc.ellipse(38, 62, 20, 10, -0.15, 0, TAU); };
      ts(c, fish, '#E6A040', { gloss: [32, 57, 3] });
      dots(c, r, 10, inEll(38, 62, 14, 6), '#C9842E', 1.4);
      ts(c, P([[24, 70], [34, 72], [28, 64]]), '#FFE066', { off: 1, lw: 1.6 });
    }],
  ['steak-frites', 'Steak Frites', 'grill', 'Seared steak sliced against the grain with golden fries and a herb butter.',
    (c) => {
      finePlate(c);
      steakIcon(c, 42, 62, 0.85, true);
      for (let i = 0; i < 6; i++) {
        c.save();
        c.translate(66 + (i % 2) * 4, 62 - i * 1.5);
        c.rotate(-0.6 + i * 0.3);
        ts(c, R(-2.5, -11, 5, 22, 2), '#F2C060', { off: 1, lw: 1.5 });
        c.restore();
      }
      ts(c, Ci(42, 56, 4), '#FFE27A', { off: 1, lw: 1.6 });
      leaf(c, 46, 54, 0.5, 0.3, '#6E9F4E');
    }],
  ['roast-chicken', 'Herb Roast Chicken', 'grill', 'A golden roast chicken with lemon, garlic and crispy potatoes.',
    (c, r) => {
      finePlate(c, 76, 46, 15);
      ts(c, E(50, 58, 25, 16), '#D9903E', { gloss: [42, 50, 6] });
      for (const sx of [-1, 1]) {
        ts(c, E(50 + sx * 22, 64, 10, 7, sx * 0.5), '#C9802E', { off: 1, lw: 2 });
        ts(c, Ci(50 + sx * 30, 68, 3.5), '#FFFBF0', { off: 0.5, lw: 1.5 });
      }
      for (const [x, y] of [[28, 74], [72, 74], [62, 78]]) ts(c, E(x, y, 6, 4.5), '#E9B060', { off: 1, lw: 1.6 });
      dots(c, r, 10, inEll(50, 56, 18, 10), '#6E9F4E', 1.3);
    }],
  ['filet', 'Filet Mignon', 'grill', 'A tall seared filet with a creamy mushroom sauce and cracked pepper.',
    (c, r) => {
      finePlate(c);
      cylinder(c, 50, 52, 16, 6, 14, '#7A3E26', '#9A5232');
      for (const dx of [-8, 0, 8]) line(c, [[50 + dx, 48], [46 + dx, 56]], 1.8, '#4E2A1A');
      tube(c, [[28, 70], [40, 74], [60, 74], [72, 70]], '#E3C8A0', 5, { lw: 1.6 });
      dots(c, r, 8, inEll(50, 52, 12, 4), '#2E1E14', 1);
    }],
  ['chicken-parm', 'Chicken Parmesan', 'grill', 'Crispy breaded chicken under melted mozzarella and tomato sauce.',
    (c) => {
      finePlate(c);
      ts(c, E(50, 62, 28, 13, -0.1), '#D9903E', { off: 2 });
      ts(c, E(50, 60, 22, 9, -0.1), '#D8402E', { off: 1, lw: 2 });
      cloud(c, [[44, 58, 7], [54, 57, 7], [50, 61, 6]], '#FFF6E4', { lw: 2 });
      leaf(c, 52, 54, 0.8, 0.3, '#5E9F4E');
    }],
  ['lava-cake', 'Chocolate Lava Cake', 'sweet', 'A warm chocolate cake with a molten middle, raspberries and powdered sugar.',
    (c, r) => {
      finePlate(c);
      cylinder(c, 50, 46, 17, 6, 18, '#4E2C1C', '#5A3422');
      dots(c, r, 18, inEll(50, 46, 14, 4), '#FFFFFF', 1);
      ts(c, P([[56, 62], [68, 64], [72, 70], [58, 70]]), '#3A1E12', { off: 1, lw: 1.6 });
      for (const [x, y] of [[30, 66], [36, 70], [72, 60]]) ts(c, Ci(x, y, 4), '#D8406A', { off: 1, lw: 1.4 });
    }],
  ['creme-brulee', 'Crème Brûlée', 'sweet', 'Silky vanilla custard under a crackly torched sugar top.',
    (c) => {
      finePlate(c);
      cylinder(c, 50, 54, 26, 9, 12, '#FFFFFF', null);
      ts(c, E(50, 54, 22, 7.5), '#D99A3A', { off: 2, lw: 2 });
      line(c, [[40, 54], [48, 52], [54, 56]], 1.2, '#A8612E');
      ts(c, E(46, 52, 6, 2), '#F6C066', { flat: true, lw: 0 });
      for (const [x, y] of [[62, 52], [66, 55]]) ts(c, Ci(x, y, 3.5), '#D8406A', { off: 1, lw: 1.4 });
    }],
  ['panna-cotta', 'Raspberry Panna Cotta', 'sweet', 'A wobbly cream panna cotta with raspberry sauce and edible flowers.',
    (c) => {
      finePlate(c);
      ts(c, P([[36, 66], [64, 66], [58, 40], [42, 40]]), '#FFF6EC', { gloss: [46, 48, 3] });
      ts(c, E(50, 40, 8, 3), '#D8406A', { off: 1, lw: 1.8 });
      tube(c, [[44, 40], [42, 52]], '#D8406A', 3, { lw: 1.2 });
      tube(c, [[56, 40], [58, 48]], '#D8406A', 3, { lw: 1.2 });
      ts(c, E(50, 68, 22, 5), '#D8406A', { off: 1, lw: 1.6 });
      for (const [x, y, col] of [[30, 64, '#F7B9C4'], [70, 66, '#FFE08A']]) {
        for (let i = 0; i < 5; i++) ts(c, Ci(x + Math.cos(i * 1.26) * 3, y + Math.sin(i * 1.26) * 3, 2.4), col, { flat: true, lw: 1 });
        ts(c, Ci(x, y, 1.5), '#E8893A', { flat: true, lw: 0 });
      }
    }],
  ['wellington', 'Beef Wellington', 'signature', 'Seared beef wrapped in mushrooms and a scored golden pastry, sliced to show the pink middle.',
    (c) => {
      finePlate(c);
      const log = (cc) => { cc.beginPath(); cc.roundRect(24, 46, 40, 22, 11); };
      ts(c, log, '#E0A050', { gloss: [32, 52, 4] });
      for (let i = 0; i < 4; i++) line(c, [[30 + i * 9, 48], [36 + i * 9, 66]], 1.4, '#B97A33');
      ts(c, E(64, 57, 7, 11), '#E0A050', { off: 1 });
      ts(c, E(64, 57, 5, 8.5), '#7A5A3A', { off: 0.5, lw: 1 });
      ts(c, E(64, 57, 3.2, 6), '#E07070', { flat: true, lw: 0 });
      tube(c, [[70, 72], [78, 68]], '#6E2A22', 3, { lw: 1.2 });
    }],
  ['bouillabaisse', 'Bouillabaisse', 'signature', 'A saffron seafood stew with salmon and shrimp, served with toast.',
    (c, r) => {
      finePlate(c, 80, 42, 12);
      ts(c, E(50, 56, 32, 10), '#FFFFFF', { off: 2 });
      bowlSide(c, 56, 32, 24);
      ts(c, E(50, 56, 27, 7.5), '#E8843A', { off: 2, lw: 2 });
      shrimpIcon(c, 42, 55, 0.7, 0.4);
      ts(c, R(52, 52, 12, 6, 2), '#F6A07E', { off: 1, lw: 1.6 });
      dots(c, r, 8, inEll(50, 56, 20, 5), '#6E9F4E', 1.2);
      ts(c, E(74, 62, 9, 4, 0.4), '#D9984A', { off: 1, lw: 1.8 });
    }],
];

// ------------------------------------------------------------------ garnishes

export const R_TOPPING_DEF = [
  ['herbs', 'Fresh Herbs', '1', '#6E9F4E'],
  ['basil', 'Basil Leaves', '2', '#5E9F4E'],
  ['parmesan', 'Parmesan', '3', '#FBE8B0'],
  ['pepper', 'Cracked Pepper', '4', '#4B2E1D'],
  ['oil', 'Olive Oil', '5', '#C9C04A'],
  ['balsamic', 'Balsamic Glaze', '6', '#4E2A2A'],
  ['lemon', 'Lemon Wedge', '7', '#FFE066'],
  ['cream', 'Cream Swirl', '8', '#FFF3DC'],
  ['sauce', 'Red Wine Jus', '9', '#6E2A22'],
  ['flowers', 'Edible Flowers', '0', '#F7B9C4'],
  ['raspberries', 'Raspberries', '-', '#D8406A'],
  ['sugar', 'Powdered Sugar', '=', '#FFFFFF'],
];

export const R_TOPPING_ART = {
  herbs: (c) => { for (const [x, y, rot] of [[40, 50, -0.6], [58, 46, 0.5], [48, 64, 0.2], [64, 62, 1.2], [34, 66, -1.3]]) leaf(c, x, y, 1.3, rot, '#6E9F4E'); },
  basil: (c) => { for (const [x, y, rot] of [[38, 54, -0.5], [60, 50, 0.6], [50, 68, 0.1]]) leaf(c, x, y, 2.1, rot, '#5E9F4E'); },
  parmesan: (c, r) => {
    ts(c, P([[24, 64], [70, 48], [76, 70], [30, 84]]), '#FBE8B0');
    dots(c, r, 10, inEll(50, 66, 18, 7), '#E3B860', 1.4);
    for (const [x, y] of [[30, 36], [44, 30], [60, 34]]) ts(c, R(x, y, 10, 4, 2), '#FBE8B0', { off: 0.5, lw: 1.4 });
  },
  pepper: (c, r) => {
    ts(c, R(38, 18, 24, 56, 10), '#6A4029', { gloss: [44, 30, 3] });
    ts(c, R(42, 12, 16, 10, 4), '#C9D4D9', { off: 1, lw: 2 });
    dots(c, r, 24, (q) => [36 + q() * 28, 80 + q() * 12], '#2E1E14', 1.6);
  },
  oil: (c) => {
    ts(c, P([[40, 36], [60, 36], [66, 50], [66, 84], [34, 84], [34, 50]]), '#C9C04A', { gloss: [44, 56, 4] });
    ts(c, R(45, 20, 10, 16, 3), '#C9C04A', { off: 1, lw: 2 });
    tube(c, [[50, 20], [52, 12]], '#C9C04A', 3, { lw: 1.2 });
  },
  balsamic: (c) => {
    ts(c, R(36, 30, 28, 54, 10), '#4E2A2A', { gloss: [42, 44, 4] });
    ts(c, R(44, 18, 12, 14, 3), '#FFF6E4', { off: 1, lw: 2 });
    tube(c, [[22, 90], [36, 84], [50, 90], [64, 84], [78, 90]], '#4E2A2A', 3, { lw: 1.2 });
  },
  lemon: (c) => {
    ts(c, P([[24, 64], [76, 64], [50, 34]]), '#FFE066', { off: 2 });
    ts(c, P([[30, 62], [70, 62], [50, 40]]), '#FFF3A0', { off: 1, lw: 1.6 });
    for (const x of [40, 50, 60]) line(c, [[50, 42], [x, 60]], 1, '#E9C64A');
  },
  cream: (c) => {
    ts(c, E(50, 64, 30, 12), '#E0573E', { off: 2 });
    tube(c, [[28, 64], [40, 58], [52, 66], [64, 58], [72, 64]], '#FFF3DC', 4, { lw: 1.6 });
  },
  sauce: (c) => {
    ts(c, R(34, 34, 32, 40, 10), '#C9D4D9', { gloss: [40, 42, 4] });
    ts(c, R(66, 44, 14, 6, 3), '#C9D4D9', { off: 1, lw: 2 });
    ts(c, E(50, 38, 14, 4), '#6E2A22', { off: 1, lw: 1.6 });
    tube(c, [[26, 86], [40, 82], [56, 86], [72, 82]], '#6E2A22', 4, { lw: 1.4 });
  },
  flowers: (c) => {
    for (const [x, y, col] of [[38, 46, '#F7B9C4'], [62, 52, '#FFE08A'], [46, 68, '#C9A2E8']]) {
      for (let i = 0; i < 5; i++) ts(c, Ci(x + Math.cos(i * 1.26) * 8, y + Math.sin(i * 1.26) * 8, 6), col, { off: 1, lw: 1.6 });
      ts(c, Ci(x, y, 4), '#E8893A', { off: 1, lw: 1.4 });
    }
  },
  raspberries: (c) => {
    for (const [x, y] of [[38, 56], [60, 54], [50, 72]]) {
      for (let i = 0; i < 7; i++) ts(c, Ci(x + Math.cos(i * 0.9) * 7, y + Math.sin(i * 0.9) * 7, 6), '#D8406A', { off: 1, lw: 1.6 });
      ts(c, Ci(x, y, 6), '#E85A80', { off: 1, lw: 1.6 });
    }
  },
  sugar: (c, r) => {
    ts(c, Ci(50, 40, 22), '#C9D4D9', { off: 2 });
    for (let i = 0; i < 4; i++) line(c, [[34 + i * 10, 28], [34 + i * 10, 52]], 1.2, '#8FA0A8');
    ts(c, R(46, 60, 8, 22, 3), '#8A5A3B', { off: 1, lw: 2 });
    dots(c, r, 30, (q) => [30 + q() * 40, 66 + q() * 26], '#FFFFFF', 1.8);
  },
};

// special requests: a garnish the dish doesn't normally get
export const R_EXTRA_SAVORY = ['herbs', 'parmesan', 'pepper', 'oil', 'lemon', 'balsamic'];
export const R_EXTRA_SWEET = ['raspberries', 'sugar', 'flowers', 'cream'];

// ------------------------------------------------------------------ recipes

const gather = (...items) => ({ t: 'gather', items });
const mix = (label) => ({ t: 'mix', label });
const prep = (label, mode = 'tap', n = 6, seq = null) => ({ t: 'prep', label, mode, n, seq });
const order = (label, seq) => ({ t: 'prep', label, mode: 'order', n: seq.length, seq });
const bake = (label = 'Bake until golden', dur = 10) => ({ t: 'bake', label, dur });
const cook = (label, dur = 9) => ({ t: 'cook', label, dur });
const chill = (label = 'Chill until set', dur = 7) => ({ t: 'chill', label, dur });
const plateUp = (...tops) => ({ t: 'decor', tops });

export const R_RECIPES = {
  'caprese': [gather('tomatoes', 'mozzarella', 'basil', 'olive-oil'), order('Fan out the slices', ['Tomato', 'Mozzarella', 'Basil', 'Tomato', 'Mozzarella', 'Basil']), plateUp('oil', 'pepper')],
  'tomato-bisque': [gather('tomatoes', 'onions', 'garlic', 'cream'), cook('Simmer the tomatoes'), mix('Blend until velvety'), prep('Ladle into the bowl', 'fill'), plateUp('cream', 'basil')],
  'bruschetta': [gather('bread', 'tomatoes', 'garlic', 'basil'), prep('Slice the baguette', 'hit', 4), bake('Toast the bread', 7), prep('Spoon on the tomatoes', 'hit', 4), plateUp('balsamic', 'oil')],
  'mushroom-soup': [gather('mushrooms', 'onions', 'butter', 'cream'), cook('Sauté the mushrooms'), mix('Blend until silky'), prep('Ladle into the bowl', 'fill'), plateUp('cream', 'herbs')],
  'spaghetti': [gather('pasta', 'tomatoes', 'garlic', 'olive-oil'), cook('Boil the spaghetti'), prep('Toss in the sauce', 'zigzag', 5), prep('Twirl a nest', 'swirl', 2), plateUp('parmesan', 'basil')],
  'fettuccine': [gather('flour', 'eggs'), mix('Knead the pasta dough'), prep('Roll it thin', 'roll'), prep('Cut the ribbons', 'hit', 5), gather('cream', 'butter', 'parmesan'), cook('Simmer in the cream'), prep('Twirl a nest', 'swirl', 2), plateUp('parmesan', 'pepper')],
  'risotto': [gather('rice', 'mushrooms', 'onions', 'butter'), cook('Stir the risotto', 11), prep('Beat in the butter', 'wiggle'), plateUp('parmesan', 'herbs')],
  'ravioli': [gather('flour', 'eggs', 'mozzarella', 'lemons'), mix('Knead the pasta dough'), prep('Roll it thin', 'roll'), prep('Fill & seal the ravioli', 'hit', 6), cook('Boil gently', 8), plateUp('oil', 'herbs')],
  'salmon': [gather('salmon', 'potatoes', 'butter', 'lemons'), cook('Sear the salmon'), mix('Whip the potato purée'), prep('Swoosh the purée', 'zigzag', 4), plateUp('lemon', 'herbs')],
  'garlic-shrimp': [gather('shrimp', 'garlic', 'butter', 'lemons'), cook('Pan-fry in garlic butter', 8), plateUp('lemon', 'herbs')],
  'paella': [gather('rice', 'shrimp', 'tomatoes', 'onions'), cook('Simmer the saffron rice', 11), prep('Arrange the shrimp', 'hit', 5), bake('Crisp the bottom', 6), plateUp('lemon', 'herbs')],
  'fish-chips': [gather('salmon', 'potatoes', 'flour', 'eggs'), mix('Whisk the batter'), prep('Cut thick chips', 'hit', 5), cook('Fry until golden'), plateUp('lemon', 'pepper')],
  'steak-frites': [gather('steak', 'potatoes', 'butter', 'garlic'), prep('Cut the fries', 'hit', 5), cook('Sear the steak'), prep('Slice against the grain', 'hit', 3), plateUp('herbs', 'sauce')],
  'roast-chicken': [gather('chicken', 'potatoes', 'lemons', 'garlic'), prep('Stuff with lemon & garlic', 'tap', 4), bake('Roast until golden', 12), prep('Carve the chicken', 'hit', 4), plateUp('herbs', 'sauce')],
  'filet': [gather('steak', 'mushrooms', 'cream', 'butter'), cook('Sear the filet'), cook('Simmer the mushroom sauce', 8), prep('Spoon over the sauce', 'fill'), plateUp('herbs', 'pepper')],
  'chicken-parm': [gather('chicken', 'flour', 'eggs', 'tomatoes'), order('Bread the chicken', ['Flour', 'Egg', 'Crumbs']), cook('Fry until crisp'), gather('mozzarella'), bake('Melt the cheese', 7), plateUp('basil', 'parmesan')],
  'lava-cake': [gather('chocolate', 'butter', 'eggs', 'sugar'), cook('Melt the chocolate'), mix('Whisk the batter'), prep('Fill the ramekins', 'fill'), bake('Bake, but not too long!', 7), plateUp('raspberries', 'sugar')],
  'creme-brulee': [gather('cream', 'eggs', 'sugar'), mix('Whisk the custard'), prep('Pour into ramekins', 'fill'), bake('Bake in a water bath', 9), chill('Chill until set'), prep('Torch the sugar', 'hold'), plateUp('raspberries')],
  'panna-cotta': [gather('cream', 'sugar', 'raspberries'), cook('Warm the cream'), prep('Pour into molds', 'fill'), chill('Set in the chiller'), prep('Unmold onto the plate', 'hit', 1), plateUp('raspberries', 'flowers')],
  'wellington': [gather('steak', 'mushrooms', 'flour', 'butter'), cook('Sear the beef'), mix('Knead the pastry'), prep('Wrap in pastry', 'roll'), prep('Score the top', 'hit', 5), bake('Bake until golden', 11), prep('Slice it', 'hit', 3), plateUp('sauce', 'herbs')],
  'bouillabaisse': [gather('salmon', 'shrimp', 'tomatoes', 'garlic'), cook('Simmer the saffron broth', 11), prep('Ladle into the bowl', 'fill'), order('Add the seafood', ['Salmon', 'Shrimp', 'Salmon', 'Shrimp']), plateUp('herbs', 'oil')],
};

const R_CAT_BATTER = { starters: '#E0573E', pasta: '#F6E2A8', sea: '#F6E6C0', grill: '#E9C27E', sweet: '#F8DE9C', signature: '#E9C27E' };
export const R_BATTER = Object.fromEntries(Object.keys(R_RECIPES).map((id) => [id, null]));
Object.assign(R_BATTER, {
  'caprese': '#E4483E', 'tomato-bisque': '#E0573E', 'bruschetta': '#E4483E', 'mushroom-soup': '#C9A27A',
  'spaghetti': '#D8402E', 'fettuccine': '#F6E2A8', 'risotto': '#F3E3B8', 'ravioli': '#F6E2A8',
  'salmon': '#F6E6C0', 'garlic-shrimp': '#F6D06A', 'paella': '#F2B640', 'fish-chips': '#F2D08A',
  'steak-frites': '#E9C27E', 'roast-chicken': '#E9C27E', 'filet': '#E3C8A0', 'chicken-parm': '#E9C27E',
  'lava-cake': '#5A3422', 'creme-brulee': '#FFE8B0', 'panna-cotta': '#FFF6EC', 'wellington': '#F3D9A0', 'bouillabaisse': '#E8843A',
});
for (const [id, cat] of R_DISHES.map((d) => [d[0], d[2]])) if (!R_BATTER[id]) R_BATTER[id] = R_CAT_BATTER[cat];

// What each step visibly adds to the dish (feature tags in rest3d.js).
export const R_STEP_FX = {
  'caprese': { 'Fan out the slices': 'slices' },
  'tomato-bisque': { 'Ladle into the bowl': 'soup' },
  'bruschetta': { 'Slice the baguette': 'toasts', 'Spoon on the tomatoes': 'topping' },
  'mushroom-soup': { 'Ladle into the bowl': 'soup' },
  'spaghetti': { 'Toss in the sauce': 'sauce', 'Twirl a nest': 'nest' },
  'fettuccine': { 'Roll it thin': 'sheet', 'Cut the ribbons': 'ribbons', 'Twirl a nest': 'nest' },
  'risotto': { 'Beat in the butter': 'risotto' },
  'ravioli': { 'Roll it thin': 'sheet', 'Fill & seal the ravioli': 'ravioli' },
  'salmon': { 'Swoosh the purée': 'puree' },
  'paella': { 'Arrange the shrimp': 'shrimp' },
  'fish-chips': { 'Cut thick chips': 'chips' },
  'steak-frites': { 'Cut the fries': 'fries', 'Slice against the grain': 'slice' },
  'roast-chicken': { 'Carve the chicken': 'carve' },
  'filet': { 'Sear the filet': 'sear', 'Spoon over the sauce': 'sauce' },
  'chicken-parm': { 'Bread the chicken': 'crumb', 'Fry until crisp': 'fried', 'Melt the cheese': 'cheese' },
  'lava-cake': { 'Fill the ramekins': 'fill' },
  'creme-brulee': { 'Pour into ramekins': 'fill', 'Torch the sugar': 'crust' },
  'panna-cotta': { 'Pour into molds': 'fill', 'Unmold onto the plate': 'flip' },
  'wellington': { 'Sear the beef': 'beef', 'Wrap in pastry': 'pastry', 'Score the top': 'score', 'Slice it': 'slice' },
  'bouillabaisse': { 'Ladle into the bowl': 'soup', 'Add the seafood': 'seafood' },
};

// ------------------------------------------------------------------ the market

export const R_PRICE_TIER = {
  1: ['flour', 'sugar', 'rice', 'pasta', 'garlic', 'onions', 'potatoes', 'tomatoes', 'basil', 'eggs', 'butter', 'lemons'],
  3: ['salmon', 'shrimp', 'steak', 'chicken', 'parmesan', 'chocolate', 'mozzarella'],
};

export const R_UPGRADES = [
  { id: 'oven', name: 'Stone Hearth Oven', desc: 'Everything bakes and roasts 30% faster.', price: 260 },
  { id: 'thermo', name: 'Probe Thermometer', desc: 'Dishes stay perfect in the oven twice as long.', price: 200 },
  { id: 'mixer', name: 'Pro Blender', desc: 'Mixing, blending and kneading go 50% faster.', price: 220 },
  { id: 'knife', name: 'Japanese Knife Set', desc: 'Fewer cuts and a bigger sweet spot at the prep counter.', price: 180 },
  { id: 'pot', name: 'Copper Cookware', desc: 'The range cooks 30% faster and gives you longer to stir and flip.', price: 220 },
  { id: 'freezer', name: 'Turbo Chiller', desc: 'Chilling takes 40% less time.', price: 180 },
  { id: 'waiter', name: 'Third Waiter', desc: 'Another waiter joins the floor, so orders and plates move faster.', price: 320 },
  { id: 'runners', name: 'Quick Runners', desc: 'Your waiters walk 40% faster.', price: 200 },
  { id: 'cushions', name: 'Velvet Chairs', desc: 'Guests happily wait 25% longer.', price: 260 },
  { id: 'tipjar', name: "Maître d'", desc: 'Three-star dishes earn a 20 coin tip.', price: 240 },
  { id: 'shelves', name: 'Walk-in Pantry', desc: 'Keep up to 14 of every ingredient.', price: 280 },
];

export const R_DECOR = [
  { id: 'candles', name: 'Table Candles', desc: 'Flickering candles on every table. +5% coins.', price: 130, coins: 0.05 },
  { id: 'roses', name: 'Rose Centerpieces', desc: 'Little vases of roses. Guests wait 5% longer.', price: 120, patience: 0.05 },
  { id: 'piano', name: 'Grand Piano', desc: 'A pianist plays soft tunes in the corner. Guests wait 8% longer.', price: 300, patience: 0.08 },
  { id: 'chalkboard', name: "Chef's Menu Board", desc: "An easel showing today's special. Specials earn double instead of +50%.", price: 160 },
  { id: 'chandelier', name: 'Crystal Chandelier', desc: 'Sparkling light over the dining room. +8% coins.', price: 320, coins: 0.08 },
];
