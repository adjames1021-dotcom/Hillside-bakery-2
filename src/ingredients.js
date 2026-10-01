// Pantry ingredients: 21 in Dry Storage (shelf cubbies + produce crates) and
// 12 in Cold Storage (glass-door fridge). Each has a sticker icon and a little 3D model.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { G, C, INK, mk, toon, canvasTex } from './toon.js';
import { weaveTex, ginghamTex } from './props.js';
import {
  E, Ci, R, P, ts, cloud, tube, line, dots, inEll, pecanHalf, strawberry, cherry as cherrySticker,
  cylinder, prism, drawSticker,
} from './sticker.js';

const FONT = '"Fredoka", "Baloo 2", "Trebuchet MS", sans-serif';

/** Welds a displaced polyhedron so it shades smooth instead of faceted. */
function smoothGeo(g) {
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  const m = mergeVertices(g, 1e-5);
  m.computeVertexNormals();
  return m;
}

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
const v2 = (pts) => pts.map(([x, y]) => new THREE.Vector2(x, y));

/** A label that wraps around a cylinder of radius r (facing +z), so it hugs round jars instead of floating. */
const curvedCache = new Map();
export function curvedLabel(key, r, width = 0.2) {
  if (!atlas) atlas = buildAtlas();
  const cell = atlas.cells[key];
  const h = width * (cell.h / cell.w);
  const gk = `${key}|${r}|${width}`;
  let geo = curvedCache.get(gk);
  if (!geo) {
    const arc = Math.min(Math.PI * 1.4, width / r);
    geo = new THREE.CylinderGeometry(r, r, h, 24, 1, true, -arc / 2, arc);
    const pos = geo.attributes.position, uv = geo.attributes.uv;
    const u0 = cell.x / ATLAS_W, u1 = (cell.x + cell.w) / ATLAS_W;
    const v1 = 1 - cell.y / ATLAS_H, v0 = 1 - (cell.y + cell.h) / ATLAS_H;
    for (let i = 0; i < pos.count; i++) {
      const t = (Math.atan2(pos.getX(i), pos.getZ(i)) + arc / 2) / arc;
      const k = (pos.getY(i) + h / 2) / h;
      uv.setXY(i, u0 + (u1 - u0) * t, v0 + (v1 - v0) * k);
    }
    curvedCache.set(gk, geo);
  }
  const m = new THREE.Mesh(geo, atlas.material);
  m.receiveShadow = true;
  return m;
}

// see-through jar glass; merges into one draw across the shelves
let GLASS = null;
function glassMat() {
  if (!GLASS) {
    GLASS = toon('#E6F6FA', { transparent: true, opacity: 0.3, unique: true });
    GLASS.userData.mergeable = true;
  }
  return GLASS;
}

// flat package art painted once per kind
const artCache = new Map();
function art(key, w, h, draw) {
  if (!artCache.has(key)) artCache.set(key, toon('#fff', { map: canvasTex(w, h, (c) => draw(c, w, h)) }));
  return artCache.get(key);
}
function decal(mat, w, h) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.receiveShadow = true;
  return m;
}
function artTitle(c, text, x, y, size, fill = '#FFF6E4', stroke = INK) {
  c.font = `700 ${size}px ${FONT}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.lineJoin = 'round';
  c.lineWidth = size * 0.22;
  c.strokeStyle = stroke;
  c.strokeText(text, x, y);
  c.fillStyle = fill;
  c.fillText(text, x, y);
}

// A soft muslin sack: cloth folds gather toward the tied neck and ruffle open at the top.
const SACK_PROFILE = [[0.0005, 0], [0.09, 0.003], [0.145, 0.025], [0.165, 0.08], [0.166, 0.18], [0.155, 0.26], [0.125, 0.325], [0.088, 0.365], [0.074, 0.385], [0.08, 0.4], [0.105, 0.418], [0.124, 0.432], [0.118, 0.442], [0.09, 0.44], [0.0005, 0.428]];
let sackG = null;
function sackGeo() {
  if (sackG) return sackG;
  const g = new THREE.LatheGeometry(v2(SACK_PROFILE), 56);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), y = p.getY(i);
    const a = Math.atan2(z, x);
    const neck = Math.min(1, Math.max(0, (y - 0.12) / 0.24));
    const ruffle = Math.min(1, Math.max(0, (y - 0.39) / 0.02));
    const k = 1 + 0.03 * neck * Math.cos(7 * a + y * 9) + 0.09 * ruffle * Math.cos(9 * a) + 0.012 * Math.sin(3 * a + 1.3);
    p.setX(i, x * k);
    p.setZ(i, z * k);
  }
  g.computeVertexNormals();
  sackG = g;
  return g;
}

function sack3d(key, col, contents, extra) {
  const g = new THREE.Group();
  add(g, mk(sackGeo(), col, { outline: 'mid' }));
  const mound = add(g, mk(G.sphere(0.085, 20, 12), contents, small), 0, 0.428, 0);
  mound.scale.y = 0.42;
  if (extra) extra(g);
  // twine tie with a little bow
  const tie = add(g, mk(G.torus(0.078, 0.011, Math.PI * 2, 32), C.cherry, small), 0, 0.383, 0);
  tie.rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) {
    const loop = add(g, mk(G.torus(0.022, 0.007, Math.PI * 2, 16), C.cherry, small), s * 0.026, 0.39, 0.083);
    loop.rotation.set(0, s * 0.5, s * 0.6);
    const tail = add(g, mk(G.capsule(0.006, 0.04), C.cherry, small), s * 0.016, 0.358, 0.086);
    tail.rotation.z = s * 0.4;
  }
  add(g, curvedLabel(key, 0.176, 0.22), 0, 0.18, 0);
  return g;
}

/** Glass jar you can see into: contents are built by `inside(g, r, h)`. */
function glassJar({ r = 0.09, h = 0.24, lid = C.cherry, fill = null, fillTo = 0.62, key = null, labelW = null, labelY = 0.4, inside = null } = {}) {
  const g = new THREE.Group();
  const glass = new THREE.Mesh(G.lathe(v2([[0.0005, 0.003], [r * 0.88, 0.003], [r, 0.022], [r, h * 0.78], [r * 0.93, h * 0.87], [r * 0.84, h * 0.91], [r * 0.84, h]]), 32), glassMat());
  glass.renderOrder = 2;
  g.add(glass);
  if (fill) add(g, mk(G.lathe(v2([[0.0005, 0.006], [r * 0.85, 0.006], [r * 0.91, 0.022], [r * 0.91, h * fillTo - 0.012], [r * 0.84, h * fillTo], [0.0005, h * fillTo]]), 28), fill, small));
  if (inside) inside(g, r, h);
  const rim = add(g, mk(G.torus(r * 0.84, 0.007, Math.PI * 2, 32), '#F2FAFC', small), 0, h - 0.004, 0);
  rim.rotation.x = Math.PI / 2;
  if (lid) {
    add(g, mk(G.cyl(r * 0.9, r * 0.9, 0.045, 0.016), lid, small), 0, h + 0.02, 0);
    add(g, mk(G.cyl(r * 0.5, r * 0.5, 0.012, 0.005), '#FFFBF0', { outline: false }), 0, h + 0.044, 0);
  }
  const shine = add(g, mk(G.capsule(0.007, h * 0.4), '#FFFFFF', { outline: false, cast: false }), -Math.sin(0.75) * r, h * 0.47, Math.cos(0.75) * r);
  shine.scale.z = 0.5;
  shine.userData.noHighlight = true;
  if (key) add(g, curvedLabel(key, r + 0.004, labelW || r * 1.55), 0, h * labelY, 0);
  return g;
}

// A slatted wooden produce crate: end boards with hand holes, gaps between the side slats.
function crate3d(fillTop) {
  const g = new THREE.Group();
  const W = 0.46, H = 0.2, D = 0.34;
  add(g, mk(G.box(W - 0.02, 0.025, D - 0.02, 0.008), C.honeyDark, { outline: false }), 0, 0.0125, 0);
  add(g, mk(G.box(W - 0.06, 0.02, D - 0.06, 0.008), '#7A4E32', { outline: false }), 0, H - 0.03, 0);
  for (const sx of [-1, 1]) {
    add(g, mk(G.box(0.03, H, D, 0.01), C.honey), sx * (W / 2 - 0.015), H / 2, 0);
    const hole = add(g, mk(G.box(0.032, 0.035, 0.12, 0.016), '#6E4A32', { outline: false }), sx * (W / 2 - 0.015), H - 0.045, 0);
    hole.userData.noHighlight = true;
  }
  for (const sz of [-1, 1]) {
    for (const y of [0.045, 0.145]) add(g, mk(G.box(W - 0.05, 0.075, 0.02, 0.008), y > 0.1 ? C.honeyLight : C.honey, { outline: 'thin' }), 0, y, sz * (D / 2 - 0.01));
  }
  const top = new THREE.Group();
  top.position.y = H - 0.025;
  g.add(top);
  fillTop(top);
  return g;
}

function scatter(top, n, cols, rows, build, jitter = 0.01) {
  const W = 0.34, D = 0.22;
  let k = 0;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols && k < n; i++, k++) {
      const m = build(k);
      m.position.x += -W / 2 + (W / (cols - 1 || 1)) * i + Math.sin(k * 7.3) * jitter;
      m.position.z += -D / 2 + (D / (rows - 1 || 1)) * j + Math.cos(k * 5.1) * jitter;
      m.rotation.y += k * 1.7;
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

/** A ceramic bowl with a real hollow, so fruit sits inside it. */
function bowl3d(col, r = 0.15) {
  const g = new THREE.Group();
  const h = r * 0.55;
  add(g, mk(G.lathe(v2([[0.0005, 0], [r * 0.48, 0], [r * 0.52, 0.012], [r * 0.82, h * 0.45], [r, h * 0.92], [r * 0.97, h], [r * 0.9, h * 0.96], [r * 0.74, h * 0.55], [r * 0.42, h * 0.22], [0.0005, h * 0.2]]), 32), col, { outline: 'mid' }));
  const band = add(g, mk(G.torus(r * 0.985, 0.006, Math.PI * 2, 40), '#FFFBF0', { outline: false }), 0, h * 0.97, 0);
  band.rotation.x = Math.PI / 2;
  g.userData.inner = h * 0.2;
  return g;
}

function bottle3d(col, cap, band, key) {
  const g = new THREE.Group();
  const pts = v2([[0.0005, 0], [0.042, 0], [0.05, 0.012], [0.05, 0.13], [0.044, 0.155], [0.026, 0.18], [0.018, 0.2], [0.018, 0.232], [0.022, 0.236], [0.0005, 0.238]]);
  add(g, mk(G.lathe(pts, 24), col, { outline: 'mid' }));
  // crimped cap
  const capG = new THREE.CylinderGeometry(0.024, 0.024, 0.02, 18);
  add(g, mk(capG, cap, small), 0, 0.244, 0);
  if (band) add(g, mk(G.cyl(0.0525, 0.0525, 0.056, 0.004), band, { outline: false }), 0, 0.075, 0);
  if (key) add(g, curvedLabel(key, 0.053, 0.1), 0, 0.075, 0);
  const shine = add(g, mk(G.capsule(0.005, 0.07), '#FFFFFF', { outline: false, cast: false }), -0.033, 0.12, 0.036);
  shine.scale.z = 0.5;
  return g;
}

// gable-top roof for a carton
function prismGeo(w, h, d) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(0, h);
  s.lineTo(-w / 2, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2 });
  g.translate(0, 0, -d / 2);
  return g;
}

let sweetG = null;
function sweetPotatoGeo() {
  if (sweetG) return sweetG;
  const g = new THREE.LatheGeometry(v2([[0.0005, -0.085], [0.012, -0.08], [0.03, -0.055], [0.043, -0.015], [0.045, 0.02], [0.038, 0.055], [0.02, 0.078], [0.0005, 0.088]]), 24);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 + 0.045 * Math.sin(y * 55 + Math.atan2(z, x) * 2) + 0.03 * Math.cos(Math.atan2(z, x) * 3 + y * 25);
    p.setX(i, x * k);
    p.setZ(i, z * k);
  }
  g.computeVertexNormals();
  sweetG = g;
  return g;
}
function sweetPotato() {
  const g = new THREE.Group();
  const s = add(g, mk(sweetPotatoGeo(), '#C0704F', small), 0, 0.042, 0);
  s.rotation.z = Math.PI / 2;
  for (const t of [-0.05, 0.02, 0.055]) add(g, mk(G.sphere(0.0045, 8, 6), '#E8B08A', { outline: false }), t, 0.084, 0.008);
  return g;
}

let pineTex = null;
function pineappleBody(r = 0.07, h = 0.18) {
  if (!pineTex) {
    pineTex = canvasTex(128, 128, (c) => {
      c.fillStyle = '#F2B84A';
      c.fillRect(0, 0, 128, 128);
      c.strokeStyle = '#B9782A';
      c.lineWidth = 5;
      for (let i = -128; i < 256; i += 32) {
        c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 128, 128); c.stroke();
        c.beginPath(); c.moveTo(i + 128, 0); c.lineTo(i, 128); c.stroke();
      }
      c.fillStyle = '#FFE08A';
      for (let x = 16; x < 128; x += 32) for (let y = 0; y < 128; y += 32) { c.beginPath(); c.arc(x, y + 16, 3.5, 0, Math.PI * 2); c.fill(); }
    }, [5, 3]);
  }
  const g = new THREE.Group();
  add(g, mk(G.lathe(v2([[0.0005, 0], [r * 0.7, 0.004], [r * 0.95, h * 0.18], [r, h * 0.5], [r * 0.92, h * 0.82], [r * 0.62, h * 0.97], [0.0005, h]]), 32), toon('#fff', { map: pineTex }), { outline: 'mid' }));
  for (let ring = 0; ring < 2; ring++) {
    const n = ring ? 5 : 8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ring * 0.4;
      const leaf = add(g, mk(G.cyl(0.002, 0.018, ring ? 0.13 : 0.1, 0.006, 8), ring ? C.sage : C.sageDark, small), Math.cos(a) * 0.012, h + (ring ? 0.07 : 0.04), Math.sin(a) * 0.012);
      const tilt = ring ? 0.25 : 0.7;
      leaf.rotation.set(Math.sin(a) * tilt, 0, -Math.cos(a) * tilt);
      leaf.scale.z = 0.45;
    }
  }
  return g;
}

function pecan(col = '#95512A') {
  const n = mk(G.sphere(0.02, 14, 10), col, small);
  n.scale.set(1.45, 0.55, 0.85);
  return n;
}

function cinnamonStick(len = 0.26) {
  const g = new THREE.Group();
  add(g, mk(G.cyl(0.011, 0.011, len, 0.004, 10), '#A8612E', small), 0, len / 2, 0);
  add(g, mk(G.cyl(0.0075, 0.0075, 0.004, 0.001, 8), '#6E3A1C', { outline: false }), 0, len + 0.001, 0);
  return g;
}

const MODEL = {
  flour: () => sack3d('sack-flour', '#F4E9D2', '#FFFDF6'),
  sugar: () => sack3d('sack-sugar', '#F7F2EA', '#FFFFFF', (g) => {
    for (const [x, z, r] of [[-0.03, 0.02, 0.3], [0.025, -0.01, -0.4], [0.0, 0.035, 0.9]]) add(g, mk(G.box(0.022, 0.022, 0.022, 0.004), '#FFFFFF', small), x, 0.455, z).rotation.set(r, r * 2, 0.2);
  }),
  oats: () => sack3d('sack-oats', '#E7D3A6', '#E6CC9C', (g) => {
    for (let i = 0; i < 10; i++) {
      const f = add(g, mk(G.sphere(0.012, 8, 6), i % 2 ? '#F3DDA6' : '#D9B97A', { outline: false }), Math.cos(i * 2.4) * 0.045 * Math.sqrt(i / 10), 0.462 - (i / 10) * 0.012, Math.sin(i * 2.4) * 0.045 * Math.sqrt(i / 10));
      f.scale.set(1.3, 0.35, 1);
      f.rotation.y = i;
    }
  }),
  bread: () => {
    const g = new THREE.Group();
    const basketB = add(g, mk(G.lathe(v2([[0.0005, 0], [0.14, 0], [0.18, 0.03], [0.2, 0.1], [0.19, 0.105], [0.165, 0.035], [0.0005, 0.02]]), 32), toon('#fff', { map: weaveTex(8, 2) }), { outline: 'mid' }));
    basketB.scale.set(1.15, 1, 0.82);
    const cloth = add(g, mk(G.sphere(0.17, 24, 10), toon('#fff', { map: ginghamTex(C.cherry, 3) }), small), 0, 0.06, 0);
    cloth.scale.set(1.08, 0.22, 0.76);
    const boule = add(g, mk(G.sphere(0.085, 24, 16), '#D98E42', { outline: 'mid' }), -0.06, 0.1, 0.0);
    boule.scale.set(1, 0.72, 1);
    for (const r of [0.6, -0.6]) {
      const sc = add(g, mk(G.box(0.1, 0.008, 0.012, 0.004), '#F6D39A', { outline: false }), -0.06, 0.162, 0);
      sc.rotation.y = r + 0.3;
    }
    // a baguette leaning across, with diagonal scores
    const bag = add(g, new THREE.Group(), 0.08, 0.13, 0.0);
    bag.rotation.set(0.15, 0.5, -0.35);
    add(bag, mk(G.capsule(0.042, 0.28), C.bread, { outline: 'mid' })).rotation.z = Math.PI / 2;
    for (const t of [-0.08, 0, 0.08]) add(bag, mk(G.capsule(0.007, 0.03), '#F6D39A', { outline: false }), t, 0.04, 0).rotation.set(Math.PI / 2, 0, 0.9);
    return g;
  },
  chocolate: () => {
    const g = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const bar = add(g, new THREE.Group(), 0, 0.024 + i * 0.048, 0);
      bar.rotation.y = i % 2 ? 0.14 : -0.08;
      add(bar, mk(G.box(0.3, 0.042, 0.14, 0.012), '#D9DEE2', small));
      const sleeve = add(bar, mk(G.box(0.19, 0.046, 0.144, 0.012), i % 2 ? C.pinkDeep : C.butter, small), 0.045, 0, 0);
      add(sleeve, decal(art(`choco${i % 2}`, 128, 48, (c, w, h) => {
        c.fillStyle = i % 2 ? C.pinkDeep : C.butter;
        c.fillRect(0, 0, w, h);
        artTitle(c, 'COCOA', w / 2, h / 2 + 2, 26, '#FFF6E4');
      }), 0.15, 0.036), 0, 0, 0.0731);
    }
    // the top bar is unwrapped so you can see the squares
    const top = add(g, new THREE.Group(), 0.0, 0.17, 0.0);
    top.rotation.y = -0.2;
    add(top, mk(G.box(0.26, 0.022, 0.12, 0.008), '#5A3422', small));
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) add(top, mk(G.box(0.055, 0.014, 0.05, 0.007), '#6A4029', { outline: false }), -0.093 + i * 0.062, 0.014, -0.028 + j * 0.056);
    return g;
  },
  graham: () => {
    const g = new THREE.Group();
    const W = 0.25, H = 0.3, D = 0.1;
    add(g, mk(G.box(W, H, D, 0.012), '#E3AE6B', { outline: 'mid' }), 0, H / 2, 0);
    add(g, decal(art('graham', 200, 240, (c, w, h) => {
      c.fillStyle = '#EDC184';
      c.fillRect(0, 0, w, h);
      c.fillStyle = '#A8612E';
      c.fillRect(0, 0, w, 62);
      artTitle(c, 'Graham', w / 2, 34, 38);
      for (const [x, y, r] of [[60, 140, -0.2], [130, 150, 0.15], [96, 190, 0.05]]) {
        c.save();
        c.translate(x, y);
        c.rotate(r);
        c.fillStyle = '#D99A55';
        c.strokeStyle = INK;
        c.lineWidth = 4;
        c.beginPath();
        c.roundRect(-36, -26, 72, 52, 8);
        c.fill();
        c.stroke();
        c.fillStyle = '#9A5A2A';
        for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(-20 + (k % 3) * 20, -10 + Math.floor(k / 3) * 20, 3, 0, Math.PI * 2); c.fill(); }
        c.restore();
      }
    }), W - 0.03, H - 0.03), 0, H / 2, D / 2 + 0.002);
    // open flaps with crackers poking out
    for (const sz of [-1, 1]) {
      const flap = add(g, mk(G.box(W - 0.01, 0.006, 0.07, 0.003), '#D99A55', small), 0, H + 0.02, sz * (D / 2 + 0.02));
      flap.rotation.x = sz * 0.9;
    }
    for (const [x, r] of [[-0.05, 0.12], [0.04, -0.1]]) {
      const cr = add(g, mk(G.box(0.1, 0.13, 0.012, 0.006), '#E8BC7A', small), x, H + 0.02, 0);
      cr.rotation.z = r;
    }
    return g;
  },
  'crispy-rice': () => {
    const g = new THREE.Group();
    const W = 0.27, H = 0.36, D = 0.11;
    add(g, mk(G.box(W, H, D, 0.012), '#86BADB', { outline: 'mid' }), 0, H / 2, 0);
    add(g, decal(art('crispy', 200, 270, (c, w, h) => {
      c.fillStyle = '#9FCDE6';
      c.fillRect(0, 0, w, h);
      c.fillStyle = '#E4605E';
      c.fillRect(0, 22, w, 58);
      artTitle(c, 'Crispy', w / 2, 40, 30);
      artTitle(c, 'Rice', w / 2, 66, 26);
      c.fillStyle = '#FFFBF0';
      c.strokeStyle = INK;
      c.lineWidth = 4;
      c.beginPath();
      c.ellipse(w / 2, 200, 70, 18, 0, 0, Math.PI);
      c.lineTo(w / 2 - 70, 200);
      c.fill();
      c.stroke();
      c.fillStyle = '#F0D08E';
      for (let k = 0; k < 26; k++) { c.beginPath(); c.ellipse(w / 2 - 55 + (k * 37) % 110, 186 - (k % 4) * 7, 7, 5, k, 0, Math.PI * 2); c.fill(); c.stroke(); }
      c.fillStyle = '#FFE08A';
      c.beginPath();
      c.ellipse(w / 2 + 50, 160, 10, 14, 0.6, 0, Math.PI * 2);
      c.fill();
      c.stroke();
    }), W - 0.03, H - 0.03), 0, H / 2, D / 2 + 0.002);
    return g;
  },
  marshmallows: () => {
    const g = new THREE.Group();
    const bag = add(g, mk(G.box(0.28, 0.26, 0.13, 0.06), '#FFF4F6', { outline: 'mid' }), 0, 0.13, 0);
    bag.scale.set(1, 1, 1.05);
    add(g, decal(art('mallow', 200, 180, (c, w, h) => {
      c.fillStyle = '#FFF4F6';
      c.fillRect(0, 0, w, h);
      c.fillStyle = C.pink;
      for (let x = -40; x < w; x += 36) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 18, 0); c.lineTo(x + 58, h); c.lineTo(x + 40, h); c.fill(); }
      c.fillStyle = '#FFFBF0';
      c.strokeStyle = INK;
      c.lineWidth = 4;
      c.beginPath();
      c.ellipse(w / 2, h / 2 + 18, 58, 40, 0, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      for (const [x, y] of [[-26, 10], [6, 4], [30, 18], [-8, 30], [20, 40]]) { c.beginPath(); c.ellipse(w / 2 + x, h / 2 + y, 12, 9, 0, 0, Math.PI * 2); c.fillStyle = '#FFFFFF'; c.fill(); c.stroke(); }
      artTitle(c, 'Mallows', w / 2, 28, 32, '#FFF6E4', INK);
    }), 0.21, 0.19), 0, 0.12, 0.069);
    const seal = add(g, mk(G.box(0.29, 0.035, 0.05, 0.01), C.pinkDeep, small), 0, 0.27, 0);
    seal.userData.noHighlight = false;
    for (const [x, z, r] of [[-0.08, 0.13, 0], [0.04, 0.15, 0.6], [0.12, 0.11, 1.2]]) add(g, mk(G.cyl(0.026, 0.026, 0.036, 0.012), '#FFFBF0', small), x, 0.018, z).rotation.y = r;
    return g;
  },
  coconut: () => {
    const g = bowl3d(C.blue, 0.17);
    const base = g.userData.inner;
    const whole = add(g, new THREE.Group(), -0.05, base, -0.01);
    const shell = add(whole, mk(G.sphere(0.068, 24, 16), '#7A4A2E', { outline: 'mid' }), 0, 0.066, 0);
    shell.scale.set(1, 0.95, 1);
    for (const a of [0, 2.1, 4.2]) add(whole, mk(G.sphere(0.009, 8, 6), '#4E2E1C', { outline: false }), Math.cos(a) * 0.016, 0.128, Math.sin(a) * 0.016);
    for (let i = 0; i < 14; i++) {
      const a = i * 2.39, t = 0.2 + (i % 5) * 0.15;
      add(whole, mk(G.box(0.012, 0.003, 0.004, 0.0015), '#A87A55', { outline: false }), Math.cos(a) * 0.068 * Math.sin(t * Math.PI), 0.066 + Math.cos(t * Math.PI) * 0.06, Math.sin(a) * 0.068 * Math.sin(t * Math.PI)).rotation.set(a, a * 2, 0);
    }
    // a cracked half, white inside
    const half = add(g, new THREE.Group(), 0.065, base + 0.005, 0.03);
    half.rotation.set(-0.35, 0, 0.2);
    add(half, mk(G.lathe(v2([[0.0005, 0], [0.04, 0.003], [0.064, 0.024], [0.07, 0.05], [0.068, 0.062], [0.06, 0.066]]), 28), '#7A4A2E', { outline: 'mid' }));
    add(half, mk(G.lathe(v2([[0.06, 0.066], [0.054, 0.056], [0.046, 0.036], [0.026, 0.022], [0.0005, 0.019]]), 28), '#FFFBF0', { outline: false }));
    return g;
  },
  cinnamon: () => glassJar({ r: 0.085, h: 0.2, lid: null, key: 'cinnamon', labelY: 0.3, inside: (g, r, h) => {
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const st = add(g, cinnamonStick(0.27 + (i % 3) * 0.02), Math.cos(a) * r * 0.45, 0.01, Math.sin(a) * r * 0.45);
      st.rotation.set(Math.sin(a) * 0.14, 0, -Math.cos(a) * 0.14);
    }
  } }),
  nuts: () => glassJar({ r: 0.09, h: 0.22, lid: C.honeyDark, fill: '#7E4020', fillTo: 0.62, key: 'nuts', labelY: 0.36, inside: (g, r, h) => {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.3, d = i % 3 ? r * 0.55 : r * 0.2;
      const n = add(g, pecan(i % 2 ? '#95512A' : '#A65E30'), Math.cos(a) * d, h * 0.62 + 0.004, Math.sin(a) * d);
      n.rotation.set(0.2, a, 0.15);
    }
  } }),
  raisins: () => glassJar({ r: 0.09, h: 0.24, lid: C.butter, fill: '#5E3030', fillTo: 0.64, key: 'raisins', labelY: 0.36, inside: (g, r, h) => {
    for (let i = 0; i < 16; i++) {
      const a = i * 2.39, d = Math.sqrt((i + 0.5) / 16) * r * 0.82;
      const b = add(g, mk(G.sphere(0.011, 10, 8), i % 2 ? '#6E3A3A' : '#4E2626', { outline: false }), Math.cos(a) * d, h * 0.64, Math.sin(a) * d);
      b.scale.y = 0.7;
    }
  } }),
  caramel: () => {
    const g = glassJar({ r: 0.095, h: 0.22, lid: C.cream2, fill: '#D9822F', fillTo: 0.74, key: 'caramel', labelY: 0.36 });
    // a drip running down the outside of the glass
    const drip = add(g, mk(G.capsule(0.008, 0.05), '#D9822F', small), 0.05, 0.19, Math.sqrt(0.095 * 0.095 - 0.05 * 0.05) + 0.004);
    drip.scale.z = 0.6;
    add(g, mk(G.sphere(0.011, 10, 8), '#D9822F', small), 0.05, 0.16, Math.sqrt(0.095 * 0.095 - 0.05 * 0.05) + 0.005);
    return g;
  },
  'peanut-butter': () => glassJar({ r: 0.1, h: 0.2, lid: C.cherry, fill: '#C98B55', fillTo: 0.9, key: 'jar-pb', labelW: 0.17, labelY: 0.45 }),

  apples: () => crate3d((top) => scatter(top, 6, 3, 2, () => fruit(0.045, '#E4605E', { shape: 'apple', stem: true, leaf: true, blush: '#F08A7E' }))),
  peaches: () => crate3d((top) => scatter(top, 6, 3, 2, () => fruit(0.042, '#F6A57A', { shape: 'peach', leaf: true, blush: '#F3876A' }))),
  bananas: () => crate3d((top) => {
    for (const [x, ry] of [[-0.085, 0.6], [0.09, -0.6]]) {
      const bunch = new THREE.Group();
      bunch.position.set(x, 0.035, 0);
      bunch.rotation.y = ry;
      bunch.scale.setScalar(1.18);
      top.add(bunch);
      for (let i = 0; i < 4; i++) {
        const b = bananaMesh();
        b.position.set(0, i * 0.01, (i - 1.5) * 0.03);
        b.rotation.x = (i - 1.5) * 0.14;
        bunch.add(b);
      }
      const stem = mk(G.cyl(0.012, 0.016, 0.04, 0.004, 8), '#9DB85A', small);
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
  'sweet-potato': () => crate3d((top) => scatter(top, 4, 2, 2, () => sweetPotato(), 0.015)),
  pineapple: () => crate3d((top) => {
    const p = add(top, pineappleBody(), 0, 0.0, 0);
    p.rotation.z = 0.08;
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
    for (const x of [-0.065, 0.065]) add(g, bottle3d('#FFFBF0', C.blueDeep, null, 'milk'), x, 0, 0);
    return g;
  },
  cream: () => {
    const g = new THREE.Group();
    for (const [x, ry] of [[-0.065, 0.15], [0.065, -0.1]]) {
      const carton = add(g, new THREE.Group(), x, 0, 0);
      carton.rotation.y = ry;
      add(carton, mk(G.box(0.1, 0.15, 0.1, 0.012), '#FFFBF0', small), 0, 0.075, 0);
      const roof = add(carton, mk(prismGeo(0.1, 0.045, 0.1), C.pink, small), 0, 0.15, 0);
      roof.userData.noHighlight = false;
      add(carton, mk(G.box(0.012, 0.03, 0.1, 0.004), C.pinkDeep, small), 0, 0.2, 0);
      add(carton, decal(art('cream', 128, 160, (c, w, h) => {
        c.fillStyle = '#FFFBF0';
        c.fillRect(0, 0, w, h);
        c.fillStyle = C.pink;
        c.fillRect(0, 0, w, 34);
        c.fillRect(0, h - 26, w, 26);
        artTitle(c, 'Cream', w / 2, 58, 30, '#FFFBF0', INK);
        c.fillStyle = '#FFFFFF';
        c.strokeStyle = INK;
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(w / 2, 82);
        c.bezierCurveTo(w / 2 + 26, 112, w / 2 + 18, 130, w / 2, 130);
        c.bezierCurveTo(w / 2 - 18, 130, w / 2 - 26, 112, w / 2, 82);
        c.fill();
        c.stroke();
      }), 0.085, 0.13), 0, 0.075, 0.052);
    }
    return g;
  },
  'root-beer': () => {
    const g = new THREE.Group();
    for (const x of [-0.065, 0.065]) add(g, bottle3d('#7A3E1A', C.cherry, null, 'root-beer'), x, 0, 0);
    return g;
  },
  butter: () => {
    const g = new THREE.Group();
    add(g, mk(G.lathe(v2([[0.0005, 0], [0.13, 0], [0.15, 0.012], [0.155, 0.022], [0.14, 0.024], [0.0005, 0.014]]), 32), C.blue, { outline: 'mid' })).scale.set(1.25, 1, 0.8);
    const block = add(g, new THREE.Group(), -0.01, 0.014, 0);
    add(block, mk(G.box(0.2, 0.07, 0.1, 0.014), '#FFE27A', { outline: 'mid' }), 0, 0.035, 0);
    // wax paper wrapper folded back over half the block
    add(block, mk(G.box(0.1, 0.074, 0.104, 0.014), '#FFFBF0', small), 0.052, 0.035, 0);
    for (const x of [0.03, 0.07]) add(block, mk(G.box(0.006, 0.075, 0.105, 0.002), C.blueDeep, { outline: false }), x, 0.035, 0);
    const curl = add(g, mk(G.torus(0.018, 0.009, Math.PI * 1.5, 16), '#FFE27A', small), -0.09, 0.03, 0.045);
    curl.rotation.set(0.3, 0.6, 0);
    return g;
  },
  eggs: () => {
    const g = new THREE.Group();
    // pulp carton: a tray of six cups with the lid open behind
    add(g, mk(G.box(0.3, 0.035, 0.18, 0.012), '#E3CDA2', { outline: 'mid' }), 0, 0.0175, 0);
    for (let i = 0; i < 6; i++) {
      const x = -0.09 + (i % 3) * 0.09, z = i < 3 ? -0.042 : 0.042;
      add(g, mk(G.cyl(0.04, 0.032, 0.04, 0.01), '#E9D6AE', small), x, 0.05, z);
      add(g, mk(profileGeo('egg', 0.03), i === 4 ? '#F3D9B4' : '#FFF6E4', small), x, 0.042, z);
    }
    const lid = add(g, new THREE.Group(), 0, 0.03, -0.09);
    lid.rotation.x = -1.95;
    add(lid, mk(G.box(0.3, 0.035, 0.18, 0.012), '#E3CDA2', small), 0, 0.0175, 0.09);
    for (let i = 0; i < 3; i++) add(lid, mk(G.sphere(0.03, 14, 10), '#E9D6AE', { outline: false }), -0.09 + i * 0.09, 0.03, 0.09).scale.y = 0.5;
    return g;
  },
  'cream-cheese': () => {
    const g = new THREE.Group();
    for (const [x, y, z, ry] of [[-0.06, 0.026, -0.01, 0.1], [0.06, 0.026, 0.0, -0.15], [-0.005, 0.078, -0.005, 0.05]]) {
      const b = add(g, new THREE.Group(), x, y, z);
      b.rotation.y = ry;
      add(b, mk(G.box(0.13, 0.052, 0.085, 0.012), '#C9D6E0', small));
      add(b, mk(G.box(0.06, 0.054, 0.087, 0.008), '#FFF6E4', { outline: false }));
      add(b, mk(G.box(0.012, 0.055, 0.088, 0.003), C.blueDeep, { outline: false }), -0.02, 0, 0);
    }
    return g;
  },
  'ice-cream': () => {
    const g = new THREE.Group();
    add(g, mk(G.lathe(v2([[0.0005, 0], [0.088, 0], [0.095, 0.01], [0.108, 0.13], [0.112, 0.138], [0.1, 0.14], [0.0005, 0.125]]), 32), '#FFFBF0', { outline: 'mid' }));
    add(g, curvedLabel('ice-cream', 0.1035, 0.15), 0, 0.065, 0);
    const scoop = add(g, mk(lumpy(0.07, 3), '#F9C8D0', { outline: 'mid' }), 0, 0.14, 0);
    scoop.scale.y = 0.75;
    add(g, mk(lumpy(0.045, 4), '#FFF1D6', small), 0.05, 0.16, 0.03).scale.y = 0.8;
    const lid = add(g, mk(G.cyl(0.115, 0.115, 0.02, 0.008), C.pinkDeep, small), -0.11, 0.09, -0.05);
    lid.rotation.z = 1.25;
    return g;
  },
  strawberries: () => berryBasket(C.sage, (top) => {
    for (let i = 0; i < 9; i++) {
      const s = strawberry3d();
      const a = i * 2.39, d = Math.sqrt((i + 0.5) / 9) * 0.075;
      s.position.set(Math.cos(a) * d * 1.3, 0.035 + (i < 3 ? 0.03 : 0), Math.sin(a) * d);
      s.rotation.z = a;
      top.add(s);
    }
  }),
  blueberries: () => berryBasket(C.blue, (top) => {
    for (let i = 0; i < 26; i++) {
      const a = i * 2.39, d = Math.sqrt((i + 0.5) / 26);
      const b = mk(G.sphere(0.019, 14, 10), i % 3 ? '#6D63B5' : '#5A5098', small);
      b.position.set(Math.cos(a) * d * 0.11, 0.022 + (1 - d) * 0.035, Math.sin(a) * d * 0.075);
      top.add(b);
      if (i % 4 === 0) {
        const crown = mk(G.cyl(0.006, 0.004, 0.004, 0.001, 6), '#3E3670', { outline: false });
        crown.position.copy(b.position).add(new THREE.Vector3(0, 0.018, 0));
        top.add(crown);
      }
    }
  }),
  cherries: () => {
    const g = bowl3d(C.pink, 0.13);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const d = i === 8 ? 0 : 0.05;
      add(g, fruit(0.022, '#D8404E', { shape: 'cherry', stem: true, outline: 'thin' }), Math.cos(a) * d, g.userData.inner + (i === 8 ? 0.03 : 0), Math.sin(a) * d * 0.9);
    }
    return g;
  },
  lemons: () => {
    const g = bowl3d(C.blue, 0.14);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const l = add(g, fruit(0.03, '#FFE066', { shape: 'lemon', outline: 'thin' }), Math.cos(a) * 0.045, g.userData.inner + 0.004, Math.sin(a) * 0.04);
      l.rotation.y = a;
    }
    return g;
  },
  limes: () => {
    const g = bowl3d(C.butter, 0.14);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const l = add(g, fruit(0.032, '#9DC25A', { shape: 'lemon', sy: 0.8, outline: 'thin' }), Math.cos(a) * 0.045, g.userData.inner + 0.004, Math.sin(a) * 0.04);
      l.rotation.y = a;
    }
    const half = add(g, new THREE.Group(), 0.0, g.userData.inner + 0.05, 0.02);
    half.rotation.x = -0.9;
    add(half, mk(G.cyl(0.03, 0.03, 0.012, 0.004), '#9DC25A', small));
    add(half, mk(G.cyl(0.025, 0.025, 0.013, 0.003), '#E6F2A8', { outline: false }));
    return g;
  },
};

// pint basket heaped with berries
function berryBasket(col, fill) {
  const g = new THREE.Group();
  const basketG = new THREE.CylinderGeometry(0.16, 0.12, 0.08, 4, 1);
  basketG.rotateY(Math.PI / 4);
  basketG.scale(1, 1, 0.7);
  basketG.translate(0, 0.04, 0);
  add(g, mk(basketG, toon('#fff', { map: weaveTex(6, 2) }), { outline: 'mid' }));
  add(g, mk(G.box(0.2, 0.012, 0.135, 0.004), col, { outline: false }), 0, 0.078, 0);
  const top = add(g, new THREE.Group(), 0, 0.06, 0);
  fill(top);
  return g;
}

let lumpyCache = new Map();
function lumpy(r, seed) {
  const key = `${r},${seed}`;
  if (!lumpyCache.has(key)) {
    const g = new THREE.IcosahedronGeometry(r, 3);
    const p = g.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      v.multiplyScalar(1 + 0.07 * Math.sin(v.x * 90 + seed) + 0.06 * Math.cos(v.z * 80 + seed * 2));
      p.setXYZ(i, v.x, v.y, v.z);
    }
    lumpyCache.set(key, smoothGeo(g));
  }
  return lumpyCache.get(key);
}

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
  pineapple: () => pineappleBody(0.07, 0.17),
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
    add(g, sweetPotato(), 0, 0, -0.03);
    add(g, sweetPotato(), 0.01, 0, 0.035).rotation.y = 0.5;
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
    for (let i = 0; i < 11; i++) {
      const a = i * 2.39, d = Math.sqrt((i + 0.5) / 11) * 0.06;
      const n = add(g, pecan(i % 2 ? '#95512A' : '#A65E30'), Math.cos(a) * d, 0.012 + (i < 3 ? 0.012 : 0), Math.sin(a) * d);
      n.rotation.set(0.15 * (i % 3), a, 0.1);
    }
    return g;
  },
  bread: () => {
    const g = new THREE.Group();
    const loaf = add(g, mk(G.capsule(0.06, 0.16), '#D98E42', { outline: 'mid' }), 0, 0.055, 0);
    loaf.rotation.z = Math.PI / 2;
    loaf.scale.set(1, 1, 0.85);
    for (const t of [-0.06, 0, 0.06]) add(g, mk(G.capsule(0.008, 0.05), '#F6D39A', { outline: false }), t, 0.108, 0).rotation.set(Math.PI / 2, 0, 0.6);
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

