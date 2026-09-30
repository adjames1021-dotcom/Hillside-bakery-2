// Pantry ingredients: 21 in Dry Storage (shelf cubbies + produce crates) and
// 12 in Cold Storage (glass-door fridge). Each has a sticker icon and a little 3D model.
import * as THREE from 'three';
import { G, C, INK, mk, toon } from './toon.js';
import {
  E, Ci, R, P, ts, cloud, tube, line, dots, inEll, pecanHalf, strawberry, cherry as cherrySticker,
  cylinder, prism, drawSticker,
} from './sticker.js';

const FONT = '"Fredoka", "Baloo 2", "Trebuchet MS", sans-serif';

// ------------------------------------------------------------------ stickers

function apple(c, x, y, s, col = '#E4605E') {
  const p = (cc) => {
    cc.beginPath();
    cc.moveTo(x, y - 14 * s);
    cc.bezierCurveTo(x - 30 * s, y - 26 * s, x - 34 * s, y + 18 * s, x - 10 * s, y + 24 * s);
    cc.quadraticCurveTo(x, y + 27 * s, x + 10 * s, y + 24 * s);
    cc.bezierCurveTo(x + 34 * s, y + 18 * s, x + 30 * s, y - 26 * s, x, y - 14 * s);
    cc.closePath();
  };
  ts(c, p, col, { gloss: [x - 12 * s, y - 6 * s, 5 * s] });
  line(c, [[x, y - 13 * s], [x + 3 * s, y - 24 * s]], 3 * s, '#8A5A3B');
  ts(c, E(x + 11 * s, y - 22 * s, 8 * s, 4 * s, -0.4), '#88AE7B', { off: 1, lw: 2 });
}

function bottle(c, x, col, cap, label) {
  const p = (cc) => {
    cc.beginPath();
    cc.moveTo(x - 6, 16);
    cc.lineTo(x + 6, 16);
    cc.lineTo(x + 6, 30);
    cc.quadraticCurveTo(x + 18, 36, x + 18, 50);
    cc.lineTo(x + 18, 86);
    cc.quadraticCurveTo(x + 18, 92, x + 12, 92);
    cc.lineTo(x - 12, 92);
    cc.quadraticCurveTo(x - 18, 92, x - 18, 86);
    cc.lineTo(x - 18, 50);
    cc.quadraticCurveTo(x - 18, 36, x - 6, 30);
    cc.closePath();
  };
  ts(c, p, col, { gloss: [x - 10, 56, 4] });
  ts(c, R(x - 8, 8, 16, 10, 3), cap, { off: 1, lw: 2.4 });
  if (label) ts(c, R(x - 18, 58, 36, 18, 3), label, { off: 1, lw: 2 });
}

function jarIcon(c, fill, lid, rand, bits) {
  ts(c, R(26, 30, 48, 58, 12), fill, { gloss: [36, 46, 5] });
  if (bits) dots(c, rand, 14, (q) => [32 + q() * 36, 40 + q() * 42], bits, 2.6);
  ts(c, R(24, 18, 52, 14, 6), lid, { off: 1.5 });
  ts(c, R(32, 54, 36, 16, 3), '#FFF6E4', { off: 1, lw: 2 });
}

function crateIcon(c, drawTop) {
  ts(c, R(12, 56, 76, 32, 5), '#D9A05B');
  for (const y of [66, 76]) line(c, [[16, y], [84, y]], 1.6, '#B97A43');
  c.save();
  drawTop();
  c.restore();
}

const ICON = {
  flour: (c) => {
    const sack = (cc) => {
      cc.beginPath();
      cc.moveTo(30, 30);
      cc.quadraticCurveTo(50, 22, 70, 30);
      cc.quadraticCurveTo(84, 60, 76, 88);
      cc.quadraticCurveTo(50, 94, 24, 88);
      cc.quadraticCurveTo(16, 60, 30, 30);
      cc.closePath();
    };
    ts(c, sack, '#EFE0C2');
    ts(c, E(50, 26, 14, 6), '#EFE0C2', { off: 1 });
    tube(c, [[36, 32], [64, 32]], '#E4605E', 3, { lw: 1.6 });
    ts(c, R(32, 52, 36, 20, 4), '#FFF6E4', { off: 1, lw: 2 });
    line(c, [[40, 62], [60, 62]], 3, '#C9A56A');
  },
  sugar: (c) => {
    prism(c, 22, 60, 22, 22, 18, '#FFFFFF', '#F3EDE2', '#E9E1D2');
    prism(c, 48, 62, 22, 22, 18, '#FFFFFF', '#F3EDE2', '#E9E1D2');
    prism(c, 34, 36, 22, 22, 18, '#FFFFFF', '#F3EDE2', '#E9E1D2');
  },
  chocolate: (c) => {
    c.save();
    c.translate(50, 54);
    c.rotate(-0.25);
    ts(c, R(-30, -22, 60, 44, 5), '#6A4029');
    for (const x of [-10, 10]) line(c, [[x, -20], [x, 20]], 1.8, '#4E2C1C');
    line(c, [[-28, 0], [28, 0]], 1.8, '#4E2C1C');
    ts(c, R(-32, 4, 64, 22, 4), '#EE93A6', { off: 1.5 });
    c.restore();
  },
  cinnamon: (c) => {
    for (const [x, rot] of [[38, -0.3], [52, 0.05], [64, 0.35]]) {
      c.save();
      c.translate(x, 54);
      c.rotate(rot);
      ts(c, R(-7, -32, 14, 64, 7), '#A8612E');
      line(c, [[-3, -28], [-3, 28]], 1.4, '#7A4420');
      c.restore();
    }
  },
  nuts: (c) => {
    for (const [x, y, rot] of [[34, 60, 0.4], [60, 64, -0.3], [48, 44, 0.1], [66, 42, 0.7]]) pecanHalf(c, x, y, rot, 2.1);
  },
  caramel: (c, r) => {
    jarIcon(c, '#D9822F', '#FFF3DC', r);
    ts(c, R(66, 30, 7, 20, 3.5), '#D9822F', { off: 1, lw: 2 });
  },
  graham: (c) => {
    for (const [x, y, rot] of [[40, 58, -0.2], [58, 46, 0.15]]) {
      c.save();
      c.translate(x, y);
      c.rotate(rot);
      ts(c, R(-24, -20, 48, 40, 5), '#E3AE6B');
      line(c, [[0, -18], [0, 18]], 1.6, '#B97A43');
      for (const dx of [-12, 12]) for (const dy of [-8, 8]) ts(c, Ci(dx, dy, 1.6), '#B97A43', { flat: true, lw: 0 });
      c.restore();
    }
  },
  oats: (c, r) => {
    cylinder(c, 50, 54, 34, 12, 20, '#AFD6EC', '#F3D9A0');
    dots(c, r, 30, inEll(50, 53, 28, 8), '#FFF3DC', 2.2);
    dots(c, r, 16, inEll(50, 53, 28, 8), '#D9B27A', 1.8);
  },
  raisins: (c, r) => {
    for (let i = 0; i < 9; i++) {
      const [x, y] = inEll(50, 58, 26, 18)(r);
      ts(c, E(x, y, 8, 6, r()), '#6E3A3A', { off: 1.5, lw: 2 });
    }
  },
  marshmallows: (c) => {
    for (const [x, y] of [[36, 62], [62, 64], [49, 42]]) cylinder(c, x, y - 8, 14, 6, 18, '#FFF6F0', '#FFFFFF');
  },
  'crispy-rice': (c, r) => {
    ts(c, R(26, 16, 48, 72, 6), '#86BADB');
    ts(c, R(32, 24, 36, 16, 4), '#FFE08A', { off: 1, lw: 2 });
    cylinder(c, 50, 60, 16, 5, 10, '#FFFBF0', '#F0D08E');
    dots(c, r, 12, inEll(50, 59, 13, 4), '#FFF3DC', 1.4);
  },
  'peanut-butter': (c, r) => jarIcon(c, '#D9A05B', '#E4605E', r),
  coconut: (c) => {
    ts(c, E(50, 58, 34, 26), '#8A5A3B');
    ts(c, E(50, 50, 30, 16), '#FFFBF0', { off: 2 });
    ts(c, E(50, 50, 22, 10), '#F6F1E4', { flat: true, lw: 1.4 });
  },
  bread: (c) => {
    const loaf = (cc) => {
      cc.beginPath();
      cc.moveTo(14, 70);
      cc.bezierCurveTo(12, 34, 88, 34, 86, 70);
      cc.quadraticCurveTo(50, 80, 14, 70);
      cc.closePath();
    };
    ts(c, loaf, '#E9A95A', { gloss: [36, 48, 6] });
    for (const x of [36, 50, 64]) line(c, [[x - 5, 50], [x + 5, 60]], 3, '#F6D39A');
  },
  apples: (c) => apple(c, 50, 54, 1),
  peaches: (c) => {
    ts(c, E(50, 56, 30, 28), '#F6A57A', { gloss: [38, 44, 6] });
    ts(c, E(60, 62, 14, 12), '#EE8A6A', { flat: true, lw: 0 });
    line(c, [[50, 30], [46, 60]], 2, '#D9785A');
    ts(c, E(60, 26, 10, 5, -0.4), '#88AE7B', { off: 1, lw: 2 });
  },
  bananas: (c) => {
    for (const [rot, dx] of [[-0.35, -6], [0, 0], [0.35, 6]]) {
      c.save();
      c.translate(50 + dx, 56);
      c.rotate(rot);
      const b = (cc) => {
        cc.beginPath();
        cc.moveTo(-2, -34);
        cc.quadraticCurveTo(2, 16, 30, 26);
        cc.quadraticCurveTo(-26, 34, -16, -30);
        cc.closePath();
      };
      ts(c, b, '#FFE27A', { off: 2 });
      c.restore();
    }
    ts(c, R(40, 16, 12, 10, 3), '#88AE7B', { off: 1, lw: 2 });
  },
  pumpkin: (c) => {
    for (const [x, rx] of [[34, 18], [66, 18], [50, 20]]) ts(c, E(x, 60, rx, 26), '#E8893A', { off: 2 });
    ts(c, R(46, 24, 8, 14, 3), '#88AE7B', { off: 1, lw: 2 });
  },
  'sweet-potato': (c) => {
    ts(c, E(50, 56, 38, 18, -0.3), '#C8764A', { gloss: [36, 48, 5] });
    for (const [x, y] of [[40, 54], [58, 50], [52, 64]]) line(c, [[x - 3, y], [x + 3, y]], 1.6, '#9A5530');
  },
  pineapple: (c) => {
    for (const [x, rot] of [[42, -0.5], [50, 0], [58, 0.5]]) {
      c.save();
      c.translate(x, 30);
      c.rotate(rot);
      ts(c, P([[-6, 4], [0, -22], [6, 4]]), '#88AE7B', { off: 1, lw: 2 });
      c.restore();
    }
    ts(c, E(50, 62, 22, 30), '#F2B84A');
    for (let i = -2; i <= 2; i++) {
      line(c, [[34, 50 + i * 10], [66, 60 + i * 10]], 1.4, '#C98A2E');
      line(c, [[66, 50 + i * 10], [34, 60 + i * 10]], 1.4, '#C98A2E');
    }
  },
  carrots: (c) => {
    for (const [x, rot] of [[40, -0.3], [60, 0.25]]) {
      c.save();
      c.translate(x, 56);
      c.rotate(rot);
      ts(c, P([[-9, -24], [9, -24], [0, 32]]), '#F4A646');
      for (const y of [-12, 0, 12]) line(c, [[-5, y], [0, y + 2]], 1.4, '#C9782E');
      for (const dx of [-5, 0, 5]) ts(c, E(dx, -30, 3, 9, dx * 0.05), '#88AE7B', { off: 1, lw: 1.8 });
      c.restore();
    }
  },
  butter: (c) => {
    ts(c, E(50, 72, 38, 12), '#AFD6EC');
    prism(c, 24, 50, 40, 18, 24, '#FFF0A8', '#FFE27A', '#F2D060');
    ts(c, R(30, 50, 18, 18, 2), '#FFFBF0', { off: 1, lw: 1.6 });
  },
  eggs: (c) => {
    ts(c, R(16, 62, 68, 22, 6), '#E6CC9C');
    for (const x of [30, 50, 70]) ts(c, E(x, 54, 11, 14), '#FFF6E4', { gloss: [x - 4, 48, 3] });
  },
  milk: (c) => bottle(c, 50, '#FFFBF0', '#86BADB', '#AFD6EC'),
  cream: (c) => {
    ts(c, P([[30, 40], [50, 22], [70, 40]]), '#F7B9C4', { off: 1.5 });
    ts(c, R(30, 40, 40, 50, 4), '#FFFBF0');
    ts(c, R(30, 54, 40, 16, 2), '#F7B9C4', { off: 1, lw: 2 });
  },
  'cream-cheese': (c) => {
    prism(c, 18, 52, 50, 24, 26, '#DCEBF2', '#CFE3EC', '#BCD7E4');
    ts(c, R(24, 58, 38, 12, 3), '#FFF6E4', { off: 1, lw: 1.6 });
  },
  'ice-cream': (c) => {
    cylinder(c, 50, 58, 30, 9, 28, '#F7B9C4', '#FFF1D6');
    ts(c, R(20, 70, 60, 8, 2), '#FFFBF0', { off: 1, lw: 1.4 });
    cloud(c, [[50, 46, 16], [38, 52, 8], [62, 52, 8]], '#F9C8D0');
  },
  'root-beer': (c) => bottle(c, 50, '#8A4A22', '#E4605E', '#FFF3DC'),
  strawberries: (c) => { strawberry(c, 36, 56, 2); strawberry(c, 64, 60, 1.8); },
  blueberries: (c, r) => {
    for (let i = 0; i < 7; i++) {
      const [x, y] = inEll(50, 56, 24, 20)(r);
      ts(c, Ci(x, y, 9), '#6D63B5', { off: 1.5, lw: 2.2 });
      ts(c, Ci(x, y - 3, 2.4), '#4F4590', { flat: true, lw: 0 });
    }
  },
  cherries: (c) => { cherrySticker(c, 38, 62, 13); cherrySticker(c, 62, 66, 12); },
  lemons: (c) => {
    ts(c, E(50, 56, 32, 24, -0.2), '#FFE066', { gloss: [38, 46, 5] });
    ts(c, E(20, 62, 5, 4), '#FFE066', { off: 1, lw: 2 });
    ts(c, E(80, 50, 5, 4), '#FFE066', { off: 1, lw: 2 });
  },
  limes: (c) => {
    ts(c, Ci(40, 58, 24), '#9DC25A', { gloss: [32, 50, 5] });
    ts(c, Ci(66, 62, 18), '#C3DC7A');
    ts(c, Ci(66, 62, 13), '#E6F2A8', { off: 1, lw: 1.4 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      line(c, [[66, 62], [66 + Math.cos(a) * 12, 62 + Math.sin(a) * 12]], 1, '#9DBB4A');
    }
  },
};

// ------------------------------------------------------------------ definitions

const DEF = [
  // dry storage shelf
  ['flour', 'Flour', 'dry', '#EFE0C2', '#FFF6E4'],
  ['sugar', 'Sugar', 'dry', '#FFFBF0', '#FFFFFF'],
  ['oats', 'Oats', 'dry', '#E6CC9C', '#F3D9A0'],
  ['bread', 'Bread', 'dry', '#E9A95A', '#E9A95A'],
  ['chocolate', 'Chocolate', 'dry', '#6A4029', '#5A3422'],
  ['graham', 'Graham Crackers', 'dry', '#E3AE6B', '#D9A05B'],
  ['crispy-rice', 'Crispy Rice', 'dry', '#86BADB', '#F0D08E'],
  ['marshmallows', 'Marshmallows', 'dry', '#FFF6F0', '#FFFFFF'],
  ['coconut', 'Coconut', 'dry', '#8A5A3B', '#FFFBF0'],
  ['cinnamon', 'Cinnamon', 'dry', '#A8612E', '#A8612E'],
  ['nuts', 'Pecans', 'dry', '#95512A', '#95512A'],
  ['raisins', 'Raisins', 'dry', '#6E3A3A', '#6E3A3A'],
  ['caramel', 'Caramel', 'dry', '#D9822F', '#D9822F'],
  ['peanut-butter', 'Peanut Butter', 'dry', '#D9A05B', '#C98B55'],
  // dry storage produce crates
  ['apples', 'Apples', 'dry', '#E4605E', '#E4605E'],
  ['peaches', 'Peaches', 'dry', '#F6A57A', '#F6A57A'],
  ['bananas', 'Bananas', 'dry', '#FFE27A', '#FFE9A0'],
  ['pumpkin', 'Pumpkin', 'dry', '#E8893A', '#E8893A'],
  ['sweet-potato', 'Sweet Potatoes', 'dry', '#C8764A', '#D9824A'],
  ['pineapple', 'Pineapple', 'dry', '#F2B84A', '#FFE27A'],
  ['carrots', 'Carrots', 'dry', '#F4A646', '#F4A646'],
  // cold storage
  ['milk', 'Milk', 'cold', '#FFFBF0', '#FFFFFF'],
  ['cream', 'Cream', 'cold', '#F7B9C4', '#FFFBF0'],
  ['root-beer', 'Root Beer', 'cold', '#8A4A22', '#8A4A22'],
  ['butter', 'Butter', 'cold', '#FFE27A', '#FFE9A0'],
  ['eggs', 'Eggs', 'cold', '#FFF6E4', '#FFD86A'],
  ['cream-cheese', 'Cream Cheese', 'cold', '#FFF6E4', '#FFF6E4'],
  ['strawberries', 'Strawberries', 'cold', '#E4605E', '#E4605E'],
  ['blueberries', 'Blueberries', 'cold', '#6D63B5', '#6D63B5'],
  ['cherries', 'Cherries', 'cold', '#D8404E', '#D8404E'],
  ['lemons', 'Lemons', 'cold', '#FFE066', '#FFE066'],
  ['limes', 'Limes', 'cold', '#9DC25A', '#9DC25A'],
  ['ice-cream', 'Ice Cream', 'cold', '#F9C8D0', '#FFF1D6'],
];

export const INGREDIENTS = DEF.map(([id, name, zone, color, bit], i) => ({ id, name, zone, color, bit, n: 200 + i, draw: ICON[id] }));
export const ING_BY_ID = Object.fromEntries(INGREDIENTS.map((g) => [g.id, g]));

const icoUrl = new Map();
export function ingredientURL(g) {
  if (!icoUrl.has(g.id)) icoUrl.set(g.id, drawSticker(96, g.draw, g.n).toDataURL());
  return icoUrl.get(g.id);
}

// ------------------------------------------------------------------ label atlas
// Every hand-lettered tag and sign shares one texture so they batch into a single draw.

const ATLAS_W = 1024, ATLAS_H = 1024, CELL_W = 256, CELL_H = 64;
let atlas = null;

function buildAtlas() {
  const labels = [
    ...INGREDIENTS.map((g) => [g.id, g.name, 1, '#FFF6E4', INK]),
    ['sign-dry', 'Dry Storage', 2, '#88AE7B', '#FFF6E4'],
    ['sign-cold', 'Cold Storage', 2, '#86BADB', '#FFF6E4'],
    ['sign-island', 'Prep Island', 2, '#E8893A', '#FFF6E4'],
    ['sign-welcome', 'welcome', 1, '#F7B9C4', INK],
    ['sack-flour', 'FLOUR', 1, '#FFF6E4', INK],
    ['sack-sugar', 'SUGAR', 1, '#FFF6E4', INK],
    ['sack-oats', 'OATS', 1, '#FFF6E4', INK],
    ['box-crispy', 'Crispy Rice', 1, '#FFE08A', INK],
    ['box-graham', 'Graham', 1, '#FFF6E4', INK],
    ['jar-pb', 'Peanut Butter', 1, '#FFF6E4', INK],
  ];
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_W;
  canvas.height = ATLAS_H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFF6E4';
  ctx.fillRect(0, 0, ATLAS_W, ATLAS_H);
  const cols = ATLAS_W / CELL_W;
  const cells = {};
  let col = 0, row = 0;
  for (const [key, text, span, bg, fg] of labels) {
    if (col + span > cols) { col = 0; row++; }
    const x = col * CELL_W, y = row * CELL_H, w = span * CELL_W;
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, CELL_H);
    ctx.strokeStyle = fg === INK ? '#D9B98A' : 'rgba(255,246,228,0.6)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(x + 7, y + 7, w - 14, CELL_H - 14);
    ctx.setLineDash([]);
    let size = 38;
    ctx.font = `600 ${size}px ${FONT}`;
    while (ctx.measureText(text).width > w - 30 && size > 16) {
      size -= 2;
      ctx.font = `600 ${size}px ${FONT}`;
    }
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + CELL_H / 2 + 2);
    cells[key] = { x, y, w, h: CELL_H };
    col += span;
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const material = toon('#fff', { map: tex });
  return { cells, material };
}

const labelGeoCache = new Map();
/** A flat hand-lettered tag. Width in world units; height follows the cell's aspect. */
export function label(key, width = 0.3) {
  if (!atlas) atlas = buildAtlas();
  const cell = atlas.cells[key];
  const h = width * (cell.h / cell.w);
  const gk = key + width;
  let geo = labelGeoCache.get(gk);
  if (!geo) {
    geo = new THREE.PlaneGeometry(width, h);
    const uv = geo.attributes.uv;
    const u0 = cell.x / ATLAS_W, u1 = (cell.x + cell.w) / ATLAS_W;
    const v1 = 1 - cell.y / ATLAS_H, v0 = 1 - (cell.y + cell.h) / ATLAS_H;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, uv.getX(i) ? u1 : u0, uv.getY(i) ? v1 : v0);
    }
    labelGeoCache.set(gk, geo);
  }
  const m = new THREE.Mesh(geo, atlas.material);
  m.receiveShadow = true;
  return m;
}

// ------------------------------------------------------------------ 3D models

const add = (g, m, x = 0, y = 0, z = 0) => { m.position.set(x, y, z); g.add(m); return m; };
const small = { outline: 'thin' };

function sack3d(key, col) {
  const g = new THREE.Group();
  add(g, mk(G.box(0.36, 0.4, 0.28, 0.12), col, { outline: 'mid' }), 0, 0.2, 0);
  add(g, mk(G.cyl(0.08, 0.13, 0.12, 0.04, 16), col, { outline: 'thin' }), 0, 0.44, 0);
  const tie = add(g, mk(G.torus(0.085, 0.022), C.cherry, small), 0, 0.43, 0);
  tie.rotation.x = Math.PI / 2;
  add(g, label(key, 0.26), 0, 0.2, 0.142);
  return g;
}

function jar3d(fill, lidCol, o = {}) {
  const g = new THREE.Group();
  const h = o.h || 0.28, r = o.r || 0.1;
  add(g, mk(G.cyl(r, r, h, 0.04, 20), fill, { outline: 'mid' }), 0, h / 2, 0);
  add(g, mk(G.cyl(r * 1.02, r * 1.02, 0.035, 0.012, 20), '#EAF4F4', small), 0, h - 0.01, 0);
  if (lidCol) add(g, mk(G.cyl(r * 1.08, r * 1.08, 0.05, 0.02, 20), lidCol, small), 0, h + 0.025, 0);
  const shine = add(g, mk(G.capsule(0.012, h * 0.45), '#FFFBF0', { outline: false }), -r * 0.62, h * 0.52, r * 0.72);
  shine.scale.z = 0.4;
  if (o.label) add(g, label(o.label, r * 1.6), 0, h * 0.42, r + 0.004);
  return g;
}

function crate3d(fillTop) {
  const g = new THREE.Group();
  const W = 0.46, H = 0.2, D = 0.34;
  add(g, mk(G.box(W, H, D, 0.03), C.honey), 0, H / 2, 0);
  for (const y of [0.06, 0.14]) add(g, mk(G.box(W + 0.01, 0.03, 0.02, 0.01), C.honeyDark, { outline: false, cast: false }), 0, y, D / 2);
  add(g, mk(G.box(W - 0.06, 0.02, D - 0.06, 0.01), C.cocoa, { outline: false }), 0, H - 0.005, 0);
  const top = new THREE.Group();
  top.position.y = H;
  g.add(top);
  fillTop(top);
  return g;
}

function scatter(top, n, cols, rows, build, jitter = 0.01) {
  const W = 0.36, D = 0.24;
  let k = 0;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols && k < n; i++, k++) {
      const m = build(k);
      m.position.x += -W / 2 + (W / (cols - 1 || 1)) * i + Math.sin(k * 7.3) * jitter;
      m.position.z += -D / 2 + (D / (rows - 1 || 1)) * j + Math.cos(k * 5.1) * jitter;
      top.add(m);
    }
  }
}

// Real fruit silhouettes as lathe profiles (x = radius, y = height, in units of r).
const PROFILE = {
  apple: [[0.0005, 0.14], [0.35, 0.03], [0.75, 0.1], [0.98, 0.42], [1.0, 0.78], [0.86, 1.12], [0.6, 1.32], [0.3, 1.3], [0.12, 1.2], [0.0005, 1.12]],
  peach: [[0.0005, 0.02], [0.5, 0.06], [0.88, 0.32], [1.0, 0.72], [0.9, 1.15], [0.6, 1.42], [0.25, 1.52], [0.0005, 1.56]],
  lemon: [[0.0005, 0], [0.12, 0.06], [0.35, 0.2], [0.72, 0.5], [0.8, 0.9], [0.72, 1.3], [0.35, 1.6], [0.12, 1.74], [0.0005, 1.8]],
  egg: [[0.0005, 0], [0.5, 0.04], [0.86, 0.3], [0.98, 0.7], [0.9, 1.12], [0.64, 1.45], [0.3, 1.62], [0.0005, 1.66]],
  cherry: [[0.0005, 0.04], [0.55, 0.02], [0.92, 0.3], [1.0, 0.7], [0.8, 1.2], [0.42, 1.44], [0.12, 1.38], [0.0005, 1.3]],
};
const profileGeo = (name, r, seg = 24) => G.lathe(PROFILE[name].map(([x, y]) => new THREE.Vector2(x * r, y * r)), seg);

function fruit(r, col, o = {}) {
  const g = new THREE.Group();
  if (o.shape) {
    const body = mk(profileGeo(o.shape, r), col, { outline: o.outline || 'thin' });
    body.scale.set(o.sx || 1, o.sy || 1, o.sz || 1);
    if (o.shape === 'lemon') {
      // lemons and limes lie on their side
      body.rotation.z = Math.PI / 2;
      body.position.set(0.9 * r * (o.sy || 1), r * 0.78, 0);
    }
    g.add(body);
    const topY = o.shape === 'lemon' ? r * 1.5 : PROFILE[o.shape][PROFILE[o.shape].length - 1][1] * r * (o.sy || 1);
    if (o.stem) {
      const st = mk(G.capsule(0.006, r * 0.6), '#8A5A3B', { outline: false });
      st.position.set(0, topY + r * 0.25, 0);
      st.rotation.z = 0.3;
      g.add(st);
    }
    if (o.leaf) {
      const lf = mk(G.sphere(r * 0.4, 10, 6), C.sageDark, { outline: 'thin' });
      lf.scale.set(1.4, 0.3, 0.7);
      lf.position.set(r * 0.38, topY + r * 0.2, 0);
      lf.rotation.z = 0.35;
      g.add(lf);
    }
    if (o.blush) {
      const b = mk(G.sphere(r * 0.5, 10, 8), o.blush, { outline: false });
      b.scale.set(0.35, 0.8, 0.8);
      b.position.set(r * 0.86, r * 0.75, 0.02 * r);
      g.add(b);
    }
    return g;
  }
  const s = mk(G.sphere(r, 14, 10), col, { outline: o.outline || 'thin' });
  s.scale.set(o.sx || 1, o.sy || 1, o.sz || 1);
  s.position.y = r * (o.sy || 1) * 0.9;
  g.add(s);
  if (o.stem) {
    const st = mk(G.capsule(0.006, r * 0.6), '#8A5A3B', { outline: false });
    st.position.set(0, r * (o.sy || 1) * 1.85, 0);
    st.rotation.z = 0.3;
    g.add(st);
  }
  if (o.leaf) {
    const lf = mk(G.sphere(r * 0.4, 8, 6), C.sageDark, { outline: false });
    lf.scale.set(1.3, 0.35, 0.7);
    lf.position.set(r * 0.35, r * (o.sy || 1) * 1.9, 0);
    g.add(lf);
  }
  return g;
}

function bowl3d(col, r = 0.15) {
  const g = new THREE.Group();
  add(g, mk(G.cyl(r, r * 0.6, r * 0.55, 0.03, 24), col, { outline: 'mid' }), 0, r * 0.27, 0);
  return g;
}

function bottle3d(col, cap, band) {
  const g = new THREE.Group();
  const pts = [[0, 0], [0.045, 0], [0.05, 0.01], [0.05, 0.13], [0.03, 0.17], [0.018, 0.2], [0.018, 0.235], [0.001, 0.235]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  add(g, mk(G.lathe(pts, 18), col, { outline: 'mid' }));
  add(g, mk(G.cyl(0.022, 0.022, 0.025, 0.008, 12), cap, small), 0, 0.24, 0);
  if (band) add(g, mk(G.cyl(0.052, 0.052, 0.05, 0.004, 18), band, { outline: false }), 0, 0.07, 0);
  return g;
}

function bananaMesh() {
  // a curved, tapered tube with a brown tip
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const a = -0.6 + (i / 10) * 1.2;
    pts.push(new THREE.Vector3(Math.sin(a) * 0.12, (1 - Math.cos(a)) * 0.12, 0));
  }
  const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.024, 10);
  const p = tube.attributes.position;
  const uv = tube.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const u = uv.getX(i);
    const k = 0.45 + 0.55 * Math.sin(Math.min(1, u * 1.15) * Math.PI) ** 0.5;
    const cx = Math.sin(-0.6 + u * 1.2) * 0.12, cy = (1 - Math.cos(-0.6 + u * 1.2)) * 0.12;
    p.setXYZ(i, cx + (p.getX(i) - cx) * k, cy + (p.getY(i) - cy) * k, p.getZ(i) * k);
  }
  tube.computeVertexNormals();
  const g = new THREE.Group();
  g.add(mk(tube, '#FFE27A', small));
  const tip = mk(G.sphere(0.01, 8, 6), '#6E4A3A', { outline: false });
  tip.position.set(Math.sin(0.6) * 0.12, (1 - Math.cos(0.6)) * 0.12, 0);
  g.add(tip);
  return g;
}

let pumpkinG = null;
function pumpkinGeo() {
  if (pumpkinG) return pumpkinG;
  const pts = [[0.0005, 0.012], [0.05, 0], [0.085, 0.025], [0.098, 0.055], [0.09, 0.085], [0.06, 0.105], [0.02, 0.1], [0.0005, 0.092]].map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.LatheGeometry(pts, 64);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const k = 1 - 0.1 * Math.abs(Math.sin(4 * Math.atan2(z, x)));
    p.setX(i, x * k);
    p.setZ(i, z * k);
  }
  g.computeVertexNormals();
  pumpkinG = g;
  return g;
}

let carrotG = null;
function carrotGeo() {
  if (carrotG) return carrotG;
  const pts = [[0.0005, -0.085], [0.006, -0.08], [0.016, -0.03], [0.024, 0.03], [0.028, 0.07], [0.024, 0.082], [0.0005, 0.085]].map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.LatheGeometry(pts, 20);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    // soft growth rings along the root
    const k = 1 + 0.07 * Math.sin(p.getY(i) * 160);
    p.setX(i, p.getX(i) * k);
    p.setZ(i, p.getZ(i) * k);
  }
  g.computeVertexNormals();
  carrotG = g;
  return g;
}

function strawberry3d() {
  const g = new THREE.Group();
  const pts = [[0.0005, 0], [0.008, 0.003], [0.02, 0.014], [0.03, 0.03], [0.033, 0.042], [0.026, 0.051], [0.001, 0.054]].map(([x, y]) => new THREE.Vector2(x, y));
  const b = mk(G.lathe(pts, 14), '#E4605E', small);
  g.add(b);
  // little golden seeds dotted over the berry
  for (let i = 0; i < 12; i++) {
    const t = 0.15 + (i % 4) * 0.2, a = i * 2.4;
    const rr = [0.008, 0.02, 0.03, 0.033][i % 4] * 0.98;
    const seed = mk(G.sphere(0.0028, 5, 4), '#FFE08A', { outline: false, cast: false });
    seed.position.set(Math.cos(a) * rr, t * 0.054, Math.sin(a) * rr);
    g.add(seed);
  }
  // a star of sepals on top
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const sep = mk(G.sphere(0.012, 8, 6), C.sageDark, { outline: 'thin', cast: false });
    sep.scale.set(1.5, 0.3, 0.6);
    sep.position.set(Math.cos(a) * 0.012, 0.055, Math.sin(a) * 0.012);
    sep.rotation.y = -a;
    g.add(sep);
  }
  const cap = mk(G.capsule(0.003, 0.012), C.sageDark, { outline: false });
  cap.position.y = 0.064;
  g.add(cap);
  g.rotation.x = Math.PI / 2 - 0.4;
  g.position.y = 0.025;
  return g;
}

const MODEL = {
  flour: () => sack3d('sack-flour', '#EFE0C2'),
  sugar: () => sack3d('sack-sugar', '#FFF8EC'),
  oats: () => sack3d('sack-oats', '#E6CC9C'),
  bread: () => {
    const g = new THREE.Group();
    add(g, mk(G.box(0.42, 0.14, 0.3, 0.05), C.honey, { outline: 'mid' }), 0, 0.07, 0);
    for (const [x, rz, col] of [[-0.08, 0.15, C.bread], [0.09, -0.12, '#DE9A4C']]) {
      const loaf = mk(G.capsule(0.07, 0.16), col, { outline: 'mid' });
      loaf.rotation.set(0.3, 0.2, Math.PI / 2 + rz);
      add(g, loaf, x, 0.2, 0);
    }
    return g;
  },
  chocolate: () => {
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const bar = add(g, mk(G.box(0.3, 0.045, 0.14, 0.015), '#6A4029', { outline: 'mid' }), 0, 0.03 + i * 0.05, 0);
      bar.rotation.y = (i % 2 ? 0.12 : -0.08);
      add(bar, mk(G.box(0.1, 0.05, 0.145, 0.012), i % 2 ? C.pinkDeep : C.butter, { outline: false }), 0.07, 0, 0);
    }
    return g;
  },
  graham: () => {
    const g = new THREE.Group();
    add(g, mk(G.box(0.26, 0.32, 0.1, 0.03), '#E3AE6B', { outline: 'mid' }), 0, 0.16, -0.04);
    add(g, label('box-graham', 0.2), 0, 0.2, 0.012);
    const cr = add(g, mk(G.box(0.14, 0.14, 0.02, 0.01), '#E8BC7A', small), 0.06, 0.08, 0.06);
    cr.rotation.x = -0.25;
    return g;
  },
  'crispy-rice': () => {
    const g = new THREE.Group();
    add(g, mk(G.box(0.28, 0.38, 0.11, 0.03), '#86BADB', { outline: 'mid' }), 0, 0.19, 0);
    add(g, label('box-crispy', 0.22), 0, 0.28, 0.057);
    const b = add(g, bowl3d('#FFFBF0', 0.05), 0, 0.1, 0.058);
    b.rotation.x = Math.PI / 2;
    return g;
  },
  marshmallows: () => {
    const g = new THREE.Group();
    add(g, mk(G.box(0.3, 0.26, 0.16, 0.08), '#FFF0F2', { outline: 'mid' }), 0, 0.13, 0);
    add(g, mk(G.box(0.31, 0.06, 0.17, 0.02), C.pink, { outline: false }), 0, 0.13, 0);
    for (const [x, z] of [[-0.06, 0.12], [0.05, 0.14], [0.13, 0.1]]) {
      add(g, mk(G.cyl(0.03, 0.03, 0.04, 0.012, 12), '#FFFBF0', small), x, 0.02, z);
    }
    return g;
  },
  coconut: () => {
    const g = bowl3d(C.blue, 0.16);
    for (const [x, rz] of [[-0.05, 0.5], [0.06, -0.4]]) {
      const half = new THREE.Group();
      half.position.set(x, 0.1, 0);
      half.rotation.z = rz;
      g.add(half);
      add(half, mk(new THREE.SphereGeometry(0.075, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), '#8A5A3B', { outline: 'mid' }));
      const inner = add(half, mk(G.cyl(0.07, 0.07, 0.012, 0.004, 16), '#FFFBF0', { outline: false }), 0, 0.002, 0);
      inner.scale.y = 0.6;
    }
    return g;
  },
  cinnamon: () => {
    const g = jar3d('#F6E7CF', null, { h: 0.18 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const st = add(g, mk(G.cyl(0.014, 0.014, 0.24, 0.005, 8), '#A8612E', small), Math.cos(a) * 0.04, 0.2, Math.sin(a) * 0.04);
      st.rotation.set(Math.sin(a) * 0.15, 0, Math.cos(a) * 0.15);
    }
    return g;
  },
  nuts: () => {
    const g = jar3d('#95512A', null, { h: 0.2 });
    for (let i = 0; i < 5; i++) {
      const n = add(g, mk(G.sphere(0.03, 10, 8), '#95512A', small), -0.05 + i * 0.025, 0.215, Math.sin(i * 2) * 0.03);
      n.scale.set(1.3, 0.5, 0.8);
    }
    return g;
  },
  raisins: () => jar3d('#6E3A3A', C.butter, { h: 0.24 }),
  caramel: () => {
    const g = jar3d('#D9822F', C.cream2, { h: 0.24 });
    add(g, mk(G.capsule(0.018, 0.06), '#D9822F', small), 0.085, 0.2, 0.05);
    return g;
  },
  'peanut-butter': () => {
    const g = jar3d('#D9A05B', C.cherry, { h: 0.22, r: 0.11 });
    add(g, label('jar-pb', 0.18), 0, 0.1, 0.112);
    return g;
  },
  apples: () => crate3d((top) => scatter(top, 6, 3, 2, () => fruit(0.045, '#E4605E', { shape: 'apple', stem: true, leaf: true, blush: '#F08A7E' }))),
  peaches: () => crate3d((top) => scatter(top, 6, 3, 2, () => fruit(0.042, '#F6A57A', { shape: 'peach', leaf: true, blush: '#F3876A' }))),
  bananas: () => crate3d((top) => {
    for (const [x, ry] of [[-0.08, 0.6], [0.09, -0.6]]) {
      const bunch = new THREE.Group();
      bunch.position.set(x, 0.035, 0);
      bunch.rotation.y = ry;
      top.add(bunch);
      for (let i = 0; i < 3; i++) {
        const b = bananaMesh();
        b.position.set(0, i * 0.012, (i - 1) * 0.034);
        b.rotation.x = (i - 1) * 0.15;
        bunch.add(b);
      }
      const stem = mk(G.cyl(0.012, 0.014, 0.04, 0.004, 8), '#9DB85A', small);
      stem.rotation.z = Math.PI / 2;
      stem.position.set(-0.1, 0.03, 0);
      bunch.add(stem);
    }
  }),
  pumpkin: () => crate3d((top) => {
    for (const [x, s] of [[-0.09, 1], [0.1, 0.85]]) {
      const p = new THREE.Group();
      p.position.set(x, 0.0, 0);
      p.scale.setScalar(s);
      top.add(p);
      add(p, mk(pumpkinGeo(), '#E8893A', small), 0, 0, 0);
      const st = mk(G.cyl(0.01, 0.016, 0.05, 0.005, 8), '#8A7A3A', { outline: 'thin' });
      st.position.set(0.004, 0.105, 0);
      st.rotation.z = -0.25;
      p.add(st);
      const lf = mk(G.sphere(0.025, 10, 6), C.sageDark, { outline: 'thin' });
      lf.scale.set(1.3, 0.3, 0.8);
      lf.position.set(-0.03, 0.098, 0.01);
      p.add(lf);
    }
  }),
  'sweet-potato': () => crate3d((top) => scatter(top, 4, 2, 2, () => {
    const g = new THREE.Group();
    const s = mk(G.capsule(0.035, 0.1), '#C8764A', small);
    s.rotation.set(Math.PI / 2, 0, 0.5);
    s.position.y = 0.035;
    g.add(s);
    return g;
  }, 0.02)),
  pineapple: () => crate3d((top) => {
    const p = new THREE.Group();
    p.position.y = 0.01;
    top.add(p);
    const body = mk(G.sphere(0.075, 16, 12), '#F2B84A', { outline: 'mid' });
    body.scale.set(1, 1.35, 1);
    body.position.y = 0.1;
    p.add(body);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const leaf = mk(G.cyl(0.001, 0.025, 0.14, 0.008, 6), C.sageDark, small);
      leaf.position.set(Math.cos(a) * 0.02, 0.26, Math.sin(a) * 0.02);
      leaf.rotation.set(Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45);
      p.add(leaf);
    }
  }),
  carrots: () => crate3d((top) => scatter(top, 6, 3, 2, () => {
    const g = new THREE.Group();
    const cone = mk(carrotGeo(), '#F4A646', small);
    cone.rotation.z = Math.PI / 2;
    cone.position.set(0.02, 0.028, 0);
    g.add(cone);
    for (let i = -1; i <= 1; i++) {
      const fr = mk(G.capsule(0.007, 0.05), i ? C.sage : C.sageDark, { outline: 'thin' });
      fr.rotation.z = -Math.PI / 2 + i * 0.4;
      fr.position.set(0.12, 0.03 + i * 0.008, i * 0.006);
      g.add(fr);
    }
    return g;
  }, 0.015)),

  milk: () => {
    const g = new THREE.Group();
    for (const x of [-0.07, 0.07]) add(g, bottle3d('#FFFBF0', C.blueDeep, C.blue), x, 0, 0);
    return g;
  },
  cream: () => {
    const g = new THREE.Group();
    for (const x of [-0.07, 0.07]) {
      const carton = add(g, new THREE.Group(), x, 0, 0);
      add(carton, mk(G.box(0.1, 0.16, 0.1, 0.02), '#FFFBF0', small), 0, 0.08, 0);
      add(carton, mk(G.box(0.101, 0.05, 0.101, 0.006), C.pink, { outline: false }), 0, 0.1, 0);
      const roof = add(carton, mk(G.box(0.07, 0.07, 0.1, 0.012), C.pink, small), 0, 0.17, 0);
      roof.rotation.z = Math.PI / 4;
    }
    return g;
  },
  'root-beer': () => {
    const g = new THREE.Group();
    for (const x of [-0.07, 0.07]) add(g, bottle3d('#8A4A22', C.cherry, C.cream2), x, 0, 0);
    return g;
  },
  butter: () => {
    const g = new THREE.Group();
    add(g, mk(G.box(0.3, 0.03, 0.2, 0.012), C.blue, { outline: 'mid' }), 0, 0.015, 0);
    add(g, mk(G.box(0.22, 0.09, 0.13, 0.02), '#FFE27A', { outline: 'mid' }), 0, 0.075, 0);
    add(g, mk(G.box(0.07, 0.012, 0.132, 0.004), '#FFF0A8', { outline: false }), -0.05, 0.12, 0);
    return g;
  },
  eggs: () => {
    const g = new THREE.Group();
    add(g, mk(G.box(0.32, 0.06, 0.18, 0.02), '#E6CC9C', { outline: 'mid' }), 0, 0.03, 0);
    for (let i = 0; i < 6; i++) {
      add(g, mk(profileGeo('egg', 0.033), i % 2 ? '#FFF6E4' : '#F3D9B4', small), -0.1 + (i % 3) * 0.1, 0.045, i < 3 ? -0.04 : 0.04);
    }
    return g;
  },
  'cream-cheese': () => {
    const g = new THREE.Group();
    for (const [x, y, ry] of [[-0.05, 0.03, 0.1], [0.06, 0.03, -0.2], [0, 0.085, 0.05]]) {
      const b = add(g, mk(G.box(0.15, 0.055, 0.09, 0.015), '#D6E8F0', small), x, y, 0);
      b.rotation.y = ry;
      add(b, mk(G.box(0.08, 0.056, 0.091, 0.008), C.cream2, { outline: false }));
    }
    return g;
  },
  'ice-cream': () => {
    const g = new THREE.Group();
    add(g, mk(G.cyl(0.11, 0.09, 0.14, 0.03, 20), '#F7B9C4', { outline: 'mid' }), 0, 0.07, 0);
    add(g, mk(G.cyl(0.112, 0.112, 0.03, 0.01, 20), '#FFFBF0', { outline: false }), 0, 0.1, 0);
    add(g, mk(G.sphere(0.075, 16, 12), '#F9C8D0', { outline: 'mid' }), 0, 0.16, 0);
    add(g, mk(G.sphere(0.05, 12, 10), '#FFF1D6', small), 0.07, 0.15, 0.03);
    return g;
  },
  strawberries: () => {
    const g = new THREE.Group();
    add(g, mk(G.box(0.26, 0.07, 0.18, 0.02), C.sage, { outline: 'mid' }), 0, 0.035, 0);
    for (let i = 0; i < 8; i++) {
      const s = strawberry3d();
      s.position.set(-0.09 + (i % 4) * 0.06, 0.08, i < 4 ? -0.035 : 0.035);
      s.rotation.z = i * 0.7;
      g.add(s);
    }
    return g;
  },
  blueberries: () => {
    const g = new THREE.Group();
    add(g, mk(G.box(0.24, 0.07, 0.16, 0.02), C.blue, { outline: 'mid' }), 0, 0.035, 0);
    for (let i = 0; i < 18; i++) {
      add(g, mk(G.sphere(0.02, 8, 6), '#6D63B5', { outline: false }), -0.09 + (i % 6) * 0.036, 0.08 + (i % 2) * 0.01, -0.05 + Math.floor(i / 6) * 0.05);
    }
    return g;
  },
  cherries: () => {
    const g = bowl3d(C.pink, 0.13);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      add(g, fruit(0.022, '#D8404E', { shape: 'cherry', stem: true, outline: 'thin' }), Math.cos(a) * 0.06, 0.06, Math.sin(a) * 0.05);
    }
    return g;
  },
  lemons: () => {
    const g = bowl3d(C.blue, 0.14);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const l = add(g, fruit(0.03, '#FFE066', { shape: 'lemon', outline: 'thin' }), Math.cos(a) * 0.05, 0.055, Math.sin(a) * 0.045);
      l.rotation.y = a;
    }
    return g;
  },
  limes: () => {
    const g = bowl3d(C.butter, 0.14);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const l = add(g, fruit(0.032, '#9DC25A', { shape: 'lemon', sy: 0.8, outline: 'thin' }), Math.cos(a) * 0.05, 0.055, Math.sin(a) * 0.045);
      l.rotation.y = a;
    }
    return g;
  },
};

export function ingredientModel(id) {
  return MODEL[id]();
}

/** One or two of an ingredient, for the cutting board while you prep it. */
const PREP = {
  apples: () => fruit(0.045, '#E4605E', { shape: 'apple', stem: true, leaf: true, blush: '#F08A7E' }),
  peaches: () => {
    const g = new THREE.Group();
    add(g, fruit(0.042, '#F6A57A', { shape: 'peach', leaf: true, blush: '#F3876A' }), -0.03, 0, 0);
    add(g, fruit(0.038, '#F6A57A', { shape: 'peach', blush: '#F3876A' }), 0.05, 0, 0.02);
    return g;
  },
  bananas: () => {
    const g = new THREE.Group();
    for (let i = 0; i < 2; i++) add(g, bananaMesh(), -0.04, i * 0.012, (i - 0.5) * 0.04).rotation.x = (i - 0.5) * 0.2;
    return g;
  },
  strawberries: () => {
    const g = new THREE.Group();
    for (const [x, z, r] of [[-0.03, 0, 0], [0.03, 0.02, 1.4], [0.0, -0.035, 2.6]]) {
      const s = strawberry3d();
      s.position.x = x;
      s.position.z = z;
      s.rotation.z = r;
      g.add(s);
    }
    return g;
  },
  pineapple: () => {
    const g = new THREE.Group();
    const body = add(g, mk(G.sphere(0.07, 16, 12), '#F2B84A', { outline: 'mid' }), 0, 0.09, 0);
    body.scale.set(1, 1.3, 1);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const leaf = mk(G.cyl(0.001, 0.022, 0.12, 0.008, 6), C.sageDark, small);
      leaf.position.set(Math.cos(a) * 0.02, 0.23, Math.sin(a) * 0.02);
      leaf.rotation.set(Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45);
      g.add(leaf);
    }
    return g;
  },
  cherries: () => {
    const g = new THREE.Group();
    for (let i = 0; i < 5; i++) add(g, fruit(0.02, '#D8404E', { shape: 'cherry', stem: true }), Math.cos(i * 1.3) * 0.04, 0, Math.sin(i * 1.3) * 0.03);
    return g;
  },
  carrots: () => {
    const g = new THREE.Group();
    for (const z of [-0.025, 0.025]) {
      const c = add(g, mk(carrotGeo(), '#F4A646', small), 0, 0.028, z);
      c.rotation.z = Math.PI / 2;
      for (let i = -1; i <= 1; i++) {
        const fr = add(g, mk(G.capsule(0.007, 0.05), i ? C.sage : C.sageDark, small), -0.11, 0.03 + i * 0.008, z + i * 0.006);
        fr.rotation.z = Math.PI / 2 + i * 0.4;
      }
    }
    return g;
  },
  'sweet-potato': () => {
    const g = new THREE.Group();
    for (const [z, r] of [[-0.03, 0.4], [0.03, -0.3]]) {
      const s = add(g, mk(G.capsule(0.032, 0.09), '#C8764A', small), 0, 0.032, z);
      s.rotation.set(Math.PI / 2, 0, r);
      s.scale.set(1, 1, 0.85);
    }
    return g;
  },
  pumpkin: () => {
    const g = new THREE.Group();
    add(g, mk(pumpkinGeo(), '#E8893A', small));
    const st = add(g, mk(G.cyl(0.01, 0.016, 0.05, 0.005, 8), '#8A7A3A', small), 0.004, 0.105, 0);
    st.rotation.z = -0.25;
    return g;
  },
  lemons: () => {
    const g = new THREE.Group();
    add(g, fruit(0.034, '#FFE066', { shape: 'lemon' }), -0.04, 0, 0);
    add(g, fruit(0.03, '#FFE066', { shape: 'lemon' }), 0.03, 0, 0.03).rotation.y = 0.8;
    return g;
  },
  limes: () => {
    const g = new THREE.Group();
    add(g, fruit(0.034, '#9DC25A', { shape: 'lemon', sy: 0.8 }), -0.035, 0, 0);
    add(g, fruit(0.032, '#9DC25A', { shape: 'lemon', sy: 0.8 }), 0.035, 0, 0.02).rotation.y = 1;
    return g;
  },
  eggs: () => {
    const g = new THREE.Group();
    add(g, mk(profileGeo('egg', 0.034), '#FFF6E4', small), -0.03, 0, 0);
    const e = add(g, mk(profileGeo('egg', 0.034), '#F3D9B4', small), 0.035, 0.02, 0.01);
    e.rotation.z = -1.3;
    return g;
  },
  chocolate: () => {
    const g = new THREE.Group();
    add(g, mk(G.box(0.2, 0.022, 0.1, 0.008), '#5A3422', { outline: 'mid' }), 0, 0.011, 0);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) add(g, mk(G.box(0.042, 0.012, 0.04, 0.006), '#6A4029', { outline: false }), -0.072 + i * 0.048, 0.026, -0.023 + j * 0.046);
    return g;
  },
  nuts: () => {
    const g = new THREE.Group();
    for (let i = 0; i < 9; i++) {
      const n = add(g, mk(G.sphere(0.022, 10, 8), '#95512A', small), Math.cos(i * 2.2) * 0.05 * Math.sqrt(i / 9), 0.01 + (i % 3) * 0.006, Math.sin(i * 2.2) * 0.05 * Math.sqrt(i / 9));
      n.scale.set(1.4, 0.5, 0.8);
      n.rotation.y = i;
    }
    return g;
  },
  bread: () => {
    const g = new THREE.Group();
    const loaf = add(g, mk(G.box(0.2, 0.09, 0.11, 0.04), '#E9A95A', { outline: 'mid' }), 0, 0.045, 0);
    for (const x of [-0.05, 0, 0.05]) add(loaf, mk(G.box(0.012, 0.01, 0.08, 0.004), '#F6D49A', { outline: false }), x, 0.045, 0).rotation.y = 0.5;
    return g;
  },
};
export function prepModel(id) {
  return (PREP[id] || MODEL[id])();
}

/** tiny bits dropped into the mixing bowl */
export function ingredientBit(id) {
  const g = ING_BY_ID[id];
  return g ? g.bit : '#FFF3DC';
}

