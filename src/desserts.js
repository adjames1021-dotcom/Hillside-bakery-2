// The 50 desserts: menu data plus a little canvas "sticker" painter for each.
// Icons are drawn in a 100x100 space with flat toon fills and ink outlines.

import {
  INK, TAU, LW, mixHex, dk, lt, rng, E, Ci, R, P, ts, cloud, tube, line, dots, inEll, sprinkles,
  plate, steam, cherry, strawberry, pecanHalf, bananaSlice, cylinder, prism, glassBowl, scoop, drawSticker,
} from './sticker.js';

// Where each kind of recipe step happens.
export const STATIONS = {
  storage: { name: 'Storage', short: 'Gather' },
  mix: { name: 'Mixing Bowl', short: 'Mix' },
  prep: { name: 'Island', short: 'Prep' },
  bake: { name: 'Oven', short: 'Bake' },
  cook: { name: 'Stove', short: 'Cook' },
  chill: { name: 'Freezer', short: 'Chill' },
  decor: { name: 'Decorating Table', short: 'Decorate' },
};
export const STEP_STATION = { gather: 'storage', mix: 'mix', prep: 'prep', bake: 'bake', cook: 'cook', chill: 'chill', decor: 'decor' };

export const CATEGORIES = [
  { id: 'pies', name: 'Pies & Cobblers', color: '#F4A646', day: 1 },
  { id: 'cookies', name: 'Cookies & Bars', color: '#E8BC7A', day: 1 },
  { id: 'pastries', name: 'Pastries & Fried Treats', color: '#F7B9C4', day: 2 },
  { id: 'cakes', name: 'Cakes', color: '#EE93A6', day: 3 },
  { id: 'cold', name: 'Cold & Frozen', color: '#AFD6EC', day: 4 },
  { id: 'candy', name: 'Candy & Campfire', color: '#AFCB9C', day: 5 },
];

// ------------------------------------------------------------------ helpers

// ------------------------------------------------------------------ templates

function pie(c, o, rand) {
  const crust = o.crust || '#EDB266';
  const fx = 50, fy = 55, frx = 30, fry = 10;
  plate(c, 50, 74, 46, 14);
  ts(c, E(50, 63, 40, 14.5), dk(crust, 0.08));
  ts(c, E(50, 55, 40, 14.5), crust, { off: 2 });
  const bumps = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU;
    bumps.push([50 + Math.cos(a) * 36.5, 55 + Math.sin(a) * 12.5, Math.sin(a)]);
  }
  bumps.sort((a, b) => a[2] - b[2]);
  const bump = ([x, y]) => ts(c, Ci(x, y, 3.9), o.edge || crust, { off: 1.2, lw: 1.8 });
  bumps.filter((b) => b[2] < 0).forEach(bump);
  ts(c, E(fx, fy, frx, fry), o.fill, { off: 3, gloss: o.glossy ? [40, 50, 7] : null });
  const clipFill = (fn) => {
    c.save();
    E(fx, fy, frx, fry)(c);
    c.clip();
    fn();
    c.restore();
  };
  if (o.bits) clipFill(() => dots(c, rand, 18, inEll(fx, fy, frx, fry), o.bits, 2.2));
  if (o.top === 'lattice') {
    clipFill(() => {
      for (const x of [28, 42, 56, 70]) tube(c, [[x - 8, 42], [x + 8, 68]], crust, 5, { lw: 1.8 });
      for (const x of [30, 44, 58, 72]) tube(c, [[x + 8, 42], [x - 8, 68]], crust, 5, { lw: 1.8 });
      if (o.sugar) dots(c, rand, 40, inEll(fx, fy, frx, fry), '#FFFBF0', 0.9);
    });
    E(fx, fy, frx, fry)(c);
    c.lineWidth = 2;
    c.strokeStyle = INK;
    c.stroke();
  }
  bumps.filter((b) => b[2] >= 0).forEach(bump);
  if (o.ooze) {
    for (const [x, y] of [[34, 66], [56, 68.5], [70, 65]]) ts(c, E(x, y, 4, 3.4), o.fill, { off: 1, lw: 2 });
  }
  if (o.top === 'pecans') {
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU;
      pecanHalf(c, fx + Math.cos(a) * 20, fy + Math.sin(a) * 6.5, a + 1.2, 0.9);
    }
    pecanHalf(c, fx, fy, 0.3, 1);
  }
  if (o.top === 'rosettes') {
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU + 0.3;
      const x = fx + Math.cos(a) * 22, y = fy + Math.sin(a) * 7;
      cloud(c, [[x, y, 4.2], [x - 1, y - 2.5, 3]], '#FFFBF0', { lw: 2 });
    }
    // lime slice
    ts(c, E(55, 49, 9, 7), '#BFD86A', { off: 1.5 });
    ts(c, E(55, 49, 6.5, 5), '#E6F2A8', { off: 1, lw: 1.5 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      line(c, [[55, 49], [55 + Math.cos(a) * 6, 49 + Math.sin(a) * 4.6]], 1, '#9DBB4A');
    }
  }
  if (o.top === 'dollop') {
    cloud(c, [[50, 51, 9], [44, 53, 6], [56, 53, 6], [50, 44, 5.5]], '#FFFBF0');
    dots(c, rand, 12, inEll(50, 50, 10, 6), '#B8743C', 0.8);
  }
  if (o.top === 'mound') {
    cloud(c, [[50, 48, 14], [36, 52, 9], [64, 52, 9], [43, 42, 8], [57, 42, 8], [50, 36, 7]], '#FFFBF0');
    if (o.bananas) for (const [x, y] of [[38, 47], [60, 45], [48, 38], [55, 52]]) bananaSlice(c, x, y, 4.5);
    c.fillStyle = o.shavings || '#6A4029';
    for (let i = 0; i < 10; i++) {
      const [x, y] = inEll(50, 45, 12, 8)(rand);
      c.fillRect(x, y, 3, 1.4);
    }
  }
  if (o.steam) steam(c, [40, 50, 60], 34);
}

function skillet(c, o, rand) {
  const iron = '#6E4A3A';
  ts(c, R(76, 54, 22, 8, 4), iron, { off: 2 });
  ts(c, E(46, 66, 40, 16), dk(iron, 0.1));
  ts(c, E(46, 58, 40, 15), '#80584A', { off: 2 });
  ts(c, E(46, 58, 34, 11.5), o.fill, { off: 2 });
  dots(c, rand, 7, inEll(46, 58, 30, 9), lt(o.fill, 0.4), 1.6);
  const clumps = [[32, 55], [46, 52], [60, 55], [38, 62], [54, 62], [46, 58]];
  for (const [x, y] of clumps) {
    cloud(c, [[x, y, 5.5], [x + 4, y - 1, 4], [x - 3, y - 2.5, 3.5]], o.top, { lw: 2 });
  }
  dots(c, rand, 20, inEll(46, 57, 28, 8), lt(o.top, 0.6), 0.7);
  if (o.steam) steam(c, [36, 48, 58], 38);
}

function dish(c, o, rand) {
  const d = o.dish || '#F7B9C4';
  ts(c, R(12, 50, 76, 28, 10), dk(d, 0.05));
  ts(c, R(9, 39, 82, 24, 11), lt(d, 0.3), { off: 2 });
  ts(c, R(15, 42, 70, 17, 7), o.fill, { off: 2 });
  c.save();
  R(15, 42, 70, 17, 7)(c);
  c.clip();
  o.detail(c, rand);
  c.restore();
  R(15, 42, 70, 17, 7)(c);
  c.lineWidth = 2;
  c.strokeStyle = INK;
  c.stroke();
  // gingham-free polka dots on the dish
  c.fillStyle = lt(d, 0.6);
  for (const x of [22, 36, 50, 64, 78]) {
    c.beginPath();
    c.arc(x, 70, 2, 0, TAU);
    c.fill();
  }
}

function wedge(c, o, rand) {
  plate(c, 50, 84, 44, 11);
  const h = o.h || 30;
  const tip = [12, 50], fr = [70, 57], br = [88, 41];
  // side (outer) face
  const side = P([fr, br, [br[0], br[1] + h], [fr[0], fr[1] + h]]);
  ts(c, side, o.outside || o.top, { off: 2 });
  // front face in layers following the slope
  let acc = 0;
  for (const [col, f] of o.layers) {
    const a = acc, b = acc + f;
    ts(c, P([[tip[0], tip[1] + a * h], [fr[0], fr[1] + a * h], [fr[0], fr[1] + b * h], [tip[0], tip[1] + b * h]]), col, { off: 2, lw: 0 });
    acc = b;
  }
  if (o.frontDots) {
    c.save();
    P([tip, fr, [fr[0], fr[1] + h], [tip[0], tip[1] + h]])(c);
    c.clip();
    dots(c, rand, 14, (r) => [14 + r() * 54, 54 + r() * h], o.frontDots, 1.3);
    c.restore();
  }
  P([tip, fr, [fr[0], fr[1] + h], [tip[0], tip[1] + h]])(c);
  c.lineWidth = LW;
  c.strokeStyle = INK;
  c.lineJoin = 'round';
  c.stroke();
  // top
  ts(c, P([tip, br, fr]), o.top, { off: 2 });
  if (o.drip) {
    for (let i = 0; i < 6; i++) {
      const t = 0.08 + i * 0.16;
      const x = tip[0] + (fr[0] - tip[0]) * t, y = tip[1] + (fr[1] - tip[1]) * t;
      const len = 4 + ((i * 7) % 5) * 1.8;
      ts(c, R(x - 3, y - 1, 6, len, 3), o.drip, { off: 1, lw: 2 });
    }
    ts(c, P([tip, br, fr]), o.top, { off: 2 });
  }
  if (o.topDots) {
    c.save();
    P([tip, br, fr])(c);
    c.clip();
    dots(c, rand, 22, (r) => {
      const u = r(), v = r() * (1 - u);
      return [tip[0] + (br[0] - tip[0]) * u + (fr[0] - tip[0]) * v, tip[1] + (br[1] - tip[1]) * u + (fr[1] - tip[1]) * v];
    }, o.topDots, 1.2);
    c.restore();
  }
  if (o.extra) o.extra(c, rand);
}

function cookie(c, x, y, r, o, rand) {
  const base = o.base;
  ts(c, E(x, y + 3.5, r, r * 0.78), dk(base, 0.18), { flat: true });
  ts(c, E(x, y, r, r * 0.78), base, { off: 3 });
  c.save();
  E(x, y, r, r * 0.78)(c);
  c.clip();
  const inC = inEll(x, y, r * 0.75, r * 0.55);
  if (o.icing) {
    ts(c, E(x - 1, y - 1, r * 0.8, r * 0.6), o.icing, { off: 2, lw: 2 });
    sprinkles(c, rand, 12, inEll(x - 1, y - 1, r * 0.6, r * 0.42));
  }
  if (o.chips) {
    for (let i = 0; i < 6; i++) {
      const [px, py] = inC(rand);
      ts(c, E(px, py, 3.4, 2.6), '#6A4029', { off: 1, lw: 1.5, gloss: [px - 1, py - 1, 1.2] });
    }
  }
  if (o.cracks) {
    for (let i = 0; i < 5; i++) {
      const [px, py] = inC(rand);
      line(c, [[px - 5, py], [px - 2, py - 2], [px + 1, py + 1], [px + 5, py - 1]], 1.3, dk(base, 0.4));
    }
    dots(c, rand, 26, inEll(x, y, r * 0.9, r * 0.7), '#B06A33', 0.9);
  }
  if (o.oats) {
    dots(c, rand, 14, inC, '#FFF0C8', 1.4);
    for (let i = 0; i < 5; i++) {
      const [px, py] = inC(rand);
      ts(c, E(px, py, 3, 2.3, rand()), '#6E3A3A', { off: 1, lw: 1.4 });
    }
  }
  if (o.fork) {
    for (const d of [-7, 0, 7]) {
      line(c, [[x - 12 + d, y - 9], [x + 8 + d, y + 7]], 1.8, dk(base, 0.35));
      line(c, [[x + 8 + d, y - 9], [x - 12 + d, y + 7]], 1.8, dk(base, 0.35));
    }
  }
  c.restore();
}

function donut(c, x, y, r, glaze, rand, o = {}) {
  const dough = '#E8A45A';
  ts(c, E(x, y + 5, r, r * 0.6), dk(dough, 0.1), { flat: true });
  ts(c, E(x, y, r, r * 0.6), dough, { off: 3 });
  const gp = (cc) => {
    cc.beginPath();
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * TAU;
      const k = 0.84 + Math.sin(a * 7) * 0.05 + (Math.sin(a) > 0 ? Math.sin(a * 5) * 0.04 : 0);
      const px = x + Math.cos(a) * r * k, py = y - 1.5 + Math.sin(a) * r * 0.58 * k;
      i ? cc.lineTo(px, py) : cc.moveTo(px, py);
    }
    cc.closePath();
  };
  ts(c, gp, glaze, { off: 2, lw: 2.2, gloss: [x - r * 0.45, y - r * 0.3, 5] });
  if (o.sprinkles !== false) sprinkles(c, rand, 9, inEll(x, y - 2, r * 0.75, r * 0.4));
  ts(c, E(x, y - 1.5, r * 0.3, r * 0.17), '#B8743C', { flat: true, lw: 2 });
}

// ------------------------------------------------------------------ the menu

const D = [
  // Pies & Cobblers
  ['apple-pie', 'Apple Pie', 'pies', 'Golden lattice crust, cinnamon-apple filling peeking through, steam rising.',
    (c, r) => pie(c, { fill: '#EDB44E', bits: '#F7DB8C', top: 'lattice', steam: true }, r)],
  ['pecan-pie', 'Pecan Pie', 'pies', 'Glossy caramel-brown filling and whole pecan halves in a fluted crust.',
    (c, r) => pie(c, { fill: '#B8652E', top: 'pecans', glossy: true }, r)],
  ['key-lime-pie', 'Key Lime Pie', 'pies', 'Pale green filling, whipped cream rosettes and a lime slice.',
    (c, r) => pie(c, { fill: '#DDEBA2', top: 'rosettes' }, r)],
  ['pumpkin-pie', 'Pumpkin Pie', 'pies', 'Smooth orange filling, a whipped cream dollop and a dusting of nutmeg.',
    (c, r) => pie(c, { fill: '#E8893A', top: 'dollop' }, r)],
  ['cherry-pie', 'Cherry Pie', 'pies', 'Deep red filling bubbling through a sugared lattice crust.',
    (c, r) => pie(c, { fill: '#C8384A', bits: '#E4605E', top: 'lattice', sugar: true }, r)],
  ['banana-cream-pie', 'Banana Cream Pie', 'pies', 'Mounded whipped cream, banana slices and chocolate shavings.',
    (c, r) => pie(c, { fill: '#FFE9A0', top: 'mound', bananas: true }, r)],
  ['blueberry-pie', 'Blueberry Pie', 'pies', 'Purple berry filling oozing from a lattice top.',
    (c, r) => pie(c, { fill: '#6F5AA8', bits: '#8E7CC8', top: 'lattice', ooze: true }, r)],
  ['sweet-potato-pie', 'Sweet Potato Pie', 'pies', 'Smooth orange-brown filling with a lightly toasted crust edge.',
    (c, r) => pie(c, { fill: '#D9824A', edge: '#D99550', glossy: true }, r)],
  ['mud-pie', 'Mississippi Mud Pie', 'pies', 'Dark chocolate layers, a chocolate cookie crust and whipped topping.',
    (c, r) => pie(c, { fill: '#5A3322', crust: '#6E4431', top: 'mound', shavings: '#4E2C1C' }, r)],
  ['peach-cobbler', 'Peach Cobbler', 'pies', 'Bubbling in a cast-iron skillet under a golden, crumbly biscuit topping.',
    (c, r) => skillet(c, { fill: '#F6A55A', top: '#EFC06C', steam: true }, r)],
  ['apple-crisp', 'Apple Crisp', 'pies', 'Baked with a crunchy oat-and-brown-sugar topping.',
    (c, r) => dish(c, {
      dish: '#AFD6EC', fill: '#D9A05B',
      detail: (cc, rr) => { dots(cc, rr, 40, (q) => [16 + q() * 68, 43 + q() * 16], '#F3D9A0', 1.8); dots(cc, rr, 30, (q) => [16 + q() * 68, 43 + q() * 16], '#A8612E', 1.4); },
    }, r)],

  // Cakes
  ['cheesecake', 'New York Cheesecake', 'cakes', 'Graham cracker crust and a glossy strawberry topping.',
    (c, r) => wedge(c, { layers: [['#FFF1D0', 0.8], ['#C98A4A', 0.2]], top: '#D8404E', outside: '#F3D69A', drip: '#D8404E',
      extra: (cc) => { strawberry(cc, 44, 44, 0.8); strawberry(cc, 64, 44, 0.7); } }, r)],
  ['cupcake', 'Cupcake', 'cakes', 'Swirled buttercream, colorful sprinkles and a paper liner.',
    (c, r) => {
      ts(c, P([[26, 60], [74, 60], [67, 90], [33, 90]]), '#F7B9C4', { off: 2 });
      for (const x of [36, 43, 50, 57, 64]) line(c, [[x, 62], [x - (x - 50) * 0.15, 88]], 1.4, '#D98A9C');
      ts(c, E(50, 60, 26, 7), '#E4A55A', { off: 2 });
      cloud(c, [[36, 54, 8], [50, 55, 9], [64, 54, 8], [42, 44, 8], [58, 44, 8], [50, 34, 7], [50, 26, 4]], '#FFF3DC');
      line(c, [[34, 54], [50, 58], [66, 54]], 1.3, '#E6CDA6');
      line(c, [[41, 45], [50, 48], [60, 45]], 1.3, '#E6CDA6');
      sprinkles(c, r, 16, inEll(50, 44, 16, 13));
      cherry(c, 52, 20, 5);
    }],
  ['red-velvet', 'Red Velvet Cake', 'cakes', 'Deep red layers with white cream cheese frosting.',
    (c, r) => wedge(c, { layers: [['#B8323F', 0.3], ['#FFF6E6', 0.12], ['#B8323F', 0.3], ['#FFF6E6', 0.12], ['#B8323F', 0.16]], top: '#FFF6E6', outside: '#FFF6E6', topDots: '#B8323F' }, r)],
  ['boston-cream', 'Boston Cream Pie', 'cakes', 'Sponge layers, custard filling and a dark chocolate ganache drip.',
    (c, r) => wedge(c, { layers: [['#F3D08A', 0.38], ['#FFE066', 0.22], ['#F3D08A', 0.4]], top: '#4E2C1C', outside: '#F3D08A', drip: '#4E2C1C' }, r)],
  ['carrot-cake', 'Carrot Cake', 'cakes', 'Spiced orange layers, cream cheese frosting and chopped walnuts.',
    (c, r) => wedge(c, { layers: [['#D9864A', 0.3], ['#FFF6E6', 0.12], ['#D9864A', 0.3], ['#FFF6E6', 0.12], ['#D9864A', 0.16]], top: '#FFF6E6', outside: '#FFF6E6', frontDots: '#F4A646',
      extra: (cc, rr) => {
        for (const [x, y] of [[40, 45], [52, 43], [62, 47], [70, 44]]) ts(cc, E(x, y, 3, 2.2, rr()), '#B87A45', { off: 1, lw: 1.5 });
        ts(cc, P([[46, 49], [58, 45], [56, 48.5]]), '#F4A646', { off: 1, lw: 1.6 });
        line(cc, [[57, 45], [60, 42]], 2, '#88AE7B');
      } }, r)],
  ['devils-food', "Devil's Food Cake", 'cakes', 'Rich dark chocolate layers with thick fudge frosting.',
    (c, r) => wedge(c, { layers: [['#4E2C1C', 0.28], ['#7A4A30', 0.14], ['#4E2C1C', 0.28], ['#7A4A30', 0.14], ['#4E2C1C', 0.16]], top: '#7A4A30', outside: '#7A4A30',
      extra: (cc) => { for (const [x, y] of [[40, 47], [60, 45]]) line(cc, [[x - 6, y], [x - 2, y - 3], [x + 2, y], [x + 6, y - 3]], 1.6, '#A06A48'); } }, r)],
  ['pineapple-upside-down', 'Pineapple Upside-Down Cake', 'cakes', 'Caramelized pineapple rings and cherries on golden sponge.',
    (c) => {
      plate(c, 50, 78, 45, 13);
      cylinder(c, 50, 52, 38, 13, 18, '#F0C56A', '#E39A3C');
      for (const [x, y] of [[33, 50], [50, 46], [67, 50], [42, 57], [58, 57]]) {
        ts(c, E(x, y, 8, 5), '#FFE27A', { off: 1.5, lw: 2 });
        ts(c, Ci(x, y, 2.8), '#E4605E', { off: 0.8, lw: 1.6 });
      }
    }],
  ['german-chocolate', 'German Chocolate Cake', 'cakes', 'Coconut-pecan frosting between chocolate layers.',
    (c, r) => wedge(c, { layers: [['#6A4029', 0.3], ['#D9B27A', 0.14], ['#6A4029', 0.3], ['#D9B27A', 0.14], ['#6A4029', 0.12]], top: '#D9B27A', outside: '#6A4029', topDots: '#FFF6E6', frontDots: null,
      extra: (cc) => { pecanHalf(cc, 50, 46, 0.2, 0.8); pecanHalf(cc, 66, 44, -0.3, 0.8); } }, r)],
  ['angel-food', 'Angel Food Cake', 'cakes', 'Tall and airy, with a light golden crust and powdered sugar.',
    (c, r) => {
      plate(c, 50, 82, 42, 12);
      cylinder(c, 50, 38, 32, 11, 38, '#E4AC62', '#F6DDA4');
      ts(c, E(50, 38, 9, 3.6), '#B87434', { flat: true, lw: 2 });
      dots(c, r, 50, inEll(50, 38, 30, 10), '#FFFBF0', 1.1);
      dots(c, r, 16, (q) => [22 + q() * 56, 44 + q() * 28], '#F6DDA4', 1);
    }],
  ['pound-cake', 'Pound Cake', 'cakes', 'A golden-crusted loaf, thick slices and a light glaze.',
    (c) => {
      plate(c, 50, 82, 44, 11);
      prism(c, 14, 44, 44, 30, 22, '#DE9A4C', '#E3A052', '#E3A052');
      for (const [x, l] of [[20, 8], [28, 12], [38, 7], [48, 10], [58, 9]]) ts(c, R(x - 3, 40, 6, l, 3), '#FFF6E6', { off: 1, lw: 1.8 });
      ts(c, P([[20, 38], [58, 38], [72, 30], [34, 30]]), '#FFF6E6', { off: 1, lw: 2 });
      for (const [x, rot] of [[64, 0.12], [76, 0.22]]) {
        c.save();
        c.translate(x, 60);
        c.rotate(rot);
        ts(c, R(-6, -18, 12, 34, 4), '#D98E42', { off: 1.5 });
        ts(c, R(-4, -15.5, 8, 29, 3), '#FBE3A2', { off: 1.5, lw: 1.5 });
        c.restore();
      }
    }],
  ['strawberry-shortcake', 'Strawberry Shortcake', 'cakes', 'A split biscuit, fresh strawberries and whipped cream.',
    (c) => {
      plate(c, 50, 84, 42, 11);
      ts(c, R(20, 64, 60, 18, 9), '#EDB86A');
      cloud(c, [[26, 62, 6], [38, 63, 7], [50, 62, 7], [62, 63, 7], [74, 62, 6]], '#FFFBF0');
      strawberry(c, 30, 60, 0.9);
      strawberry(c, 70, 60, 0.9);
      strawberry(c, 50, 62, 0.8);
      const top = (cc) => {
        cc.beginPath();
        cc.moveTo(22, 54);
        cc.bezierCurveTo(22, 34, 78, 34, 78, 54);
        cc.bezierCurveTo(70, 58, 30, 58, 22, 54);
        cc.closePath();
      };
      ts(c, top, '#EDB86A', { gloss: [40, 42, 6] });
      cloud(c, [[50, 38, 7], [44, 40, 5], [56, 40, 5], [50, 32, 4.5]], '#FFFBF0');
      strawberry(c, 52, 28, 0.85);
    }],
  ['whoopie-pies', 'Whoopie Pies', 'cakes', 'Two round chocolate cake halves sandwiching white cream.',
    (c) => {
      const whoopie = (x, y, s) => {
        const low = (cc) => { cc.beginPath(); cc.ellipse(x, y + 6 * s, 22 * s, 4 * s, 0, Math.PI, 0); cc.ellipse(x, y + 6 * s, 22 * s, 12 * s, 0, 0, Math.PI); cc.closePath(); };
        ts(c, low, '#5A3422');
        cloud(c, [[x - 16 * s, y + 2 * s, 5 * s], [x - 6 * s, y + 3 * s, 5.5 * s], [x + 5 * s, y + 3 * s, 5.5 * s], [x + 16 * s, y + 2 * s, 5 * s]], '#FFFBF0', { lw: 2.4 });
        const up = (cc) => { cc.beginPath(); cc.ellipse(x, y, 22 * s, 16 * s, 0, Math.PI, 0); cc.ellipse(x, y, 22 * s, 4 * s, 0, 0, Math.PI); cc.closePath(); };
        ts(c, up, '#6A4029', { gloss: [x - 9 * s, y - 9 * s, 4 * s] });
      };
      whoopie(64, 40, 1.05);
      whoopie(42, 66, 1.3);
    }],

  // Cookies & Bars
  ['chocolate-chip', 'Chocolate Chip Cookies', 'cookies', 'Thick and golden-brown with melted chocolate pools.',
    (c, r) => { cookie(c, 62, 42, 25, { base: '#DFA35A', chips: true }, r); cookie(c, 40, 64, 28, { base: '#E3A95E', chips: true }, r); }],
  ['brownies', 'Brownies', 'cookies', 'Dense fudgy squares with a shiny crackled top.',
    (c) => {
      prism(c, 44, 34, 32, 18, 26, '#7B4A30', '#5A3422', '#5A3422');
      line(c, [[52, 28], [58, 26], [64, 29], [70, 27]], 1.4, '#A87458');
      prism(c, 18, 56, 36, 20, 28, '#7B4A30', '#5A3422', '#5A3422');
      line(c, [[24, 50], [32, 47], [38, 51], [48, 48]], 1.4, '#A87458');
      line(c, [[30, 53], [40, 51], [50, 53]], 1.2, '#A87458');
    }],
  ['snickerdoodles', 'Snickerdoodles', 'cookies', 'Cinnamon-sugar coated with cracked, pillowy tops.',
    (c, r) => { cookie(c, 62, 42, 25, { base: '#EBC98E', cracks: true }, r); cookie(c, 40, 64, 28, { base: '#EFCF96', cracks: true }, r); }],
  ['lemon-bars', 'Lemon Bars', 'cookies', 'Bright yellow custard on shortbread, dusted with powdered sugar.',
    (c, r) => {
      prism(c, 44, 36, 32, 18, 26, '#FFF3B0', [['#FFE066', 0.6], ['#EFC984', 0.4]], null);
      dots(c, r, 18, (q) => [48 + q() * 44, 24 + q() * 10], '#FFFBF0', 1);
      prism(c, 16, 58, 38, 20, 28, '#FFF3B0', [['#FFE066', 0.6], ['#EFC984', 0.4]], null);
      dots(c, r, 24, (q) => [22 + q() * 50, 46 + q() * 10], '#FFFBF0', 1);
    }],
  ['rice-krispies', 'Rice Krispies Treats', 'cookies', 'Golden marshmallow-bound squares, slightly glossy.',
    (c, r) => {
      const bar = (x, y, w, h, d) => {
        prism(c, x, y, w, h, d, '#F0D08E', '#E4BE78', '#E4BE78');
        c.save();
        P([[x, y], [x + d * 0.75, y - d * 0.5], [x + w + d * 0.75, y - d * 0.5], [x + w + d * 0.75, y + h - d * 0.5], [x + w, y + h], [x, y + h]])(c);
        c.clip();
        dots(c, r, 40, (q) => [x + q() * (w + d), y - d * 0.5 + q() * (h + d * 0.5)], '#FFF3DC', 1.2);
        dots(c, r, 24, (q) => [x + q() * (w + d), y - d * 0.5 + q() * (h + d * 0.5)], '#C9994F', 0.9);
        c.restore();
      };
      bar(44, 34, 32, 18, 26);
      bar(16, 56, 38, 20, 28);
    }],
  ['oatmeal-raisin', 'Oatmeal Raisin Cookies', 'cookies', 'Chewy and rustic with plump raisins.',
    (c, r) => { cookie(c, 62, 42, 25, { base: '#D29A58', oats: true }, r); cookie(c, 40, 64, 28, { base: '#D8A05E', oats: true }, r); }],
  ['peanut-butter', 'Peanut Butter Cookies', 'cookies', 'A crisscross fork pattern on top.',
    (c, r) => { cookie(c, 62, 42, 25, { base: '#DDA25E', fork: true }, r); cookie(c, 40, 64, 28, { base: '#E2A964', fork: true }, r); }],
  ['sugar-cookies', 'Frosted Sugar Cookies', 'cookies', 'Bright pastel icing with rainbow sprinkles.',
    (c, r) => { cookie(c, 62, 42, 25, { base: '#F6DDAE', icing: '#AFD6EC' }, r); cookie(c, 40, 64, 28, { base: '#F6DDAE', icing: '#F7B9C4' }, r); }],

  // Pastries & Fried Treats
  ['glazed-donuts', 'Glazed Donuts', 'pastries', 'Soft rings with shiny sugar glaze and a few rainbow sprinkles.',
    (c, r) => { donut(c, 60, 40, 26, '#FFF3DC', r); donut(c, 42, 64, 30, '#F7B9C4', r); }],
  ['cinnamon-rolls', 'Cinnamon Rolls', 'pastries', 'Spiral swirls with thick white icing melting over warm dough.',
    (c, r) => {
      plate(c, 50, 80, 44, 12);
      ts(c, E(50, 66, 36, 20), '#C98240', { flat: true });
      ts(c, E(50, 60, 36, 20), '#E8A962');
      const pts = [];
      for (let i = 0; i <= 90; i++) {
        const t = i / 90, a = t * TAU * 3.2, rr = 3 + t * 29;
        pts.push([50 + Math.cos(a) * rr, 60 + Math.sin(a) * rr * 0.56]);
      }
      tube(c, pts, '#A8612E', 2.4, { lw: 0.8 });
      cloud(c, [[46, 56, 11], [56, 58, 9], [40, 62, 6], [60, 50, 6], [34, 55, 4]], '#FFFBF0', { shade: 0.06 });
      ts(c, R(60, 58, 5, 14, 2.5), '#FFFBF0', { off: 1, lw: 2 });
      ts(c, R(34, 60, 5, 10, 2.5), '#FFFBF0', { off: 1, lw: 2 });
      steam(c, [44, 56], 30);
    }],
  ['funnel-cake', 'Funnel Cake', 'pastries', 'Tangled fried dough ribbons dusted heavily with powdered sugar.',
    (c, r) => {
      plate(c, 50, 74, 46, 16, '#AFD6EC');
      const rand = r;
      for (let k = 0; k < 4; k++) {
        const pts = [];
        let x = 22 + rand() * 10, y = 56 + rand() * 12;
        for (let i = 0; i < 40; i++) {
          const a = i * 0.9 + k;
          pts.push([x + Math.cos(a) * 7, y + Math.sin(a) * 4.5]);
          x += 1.3;
          y += Math.sin(i * 0.4 + k) * 0.8;
        }
        tube(c, pts, '#E4A558', 4.4, { lw: 1.6 });
      }
      dots(c, rand, 120, inEll(50, 62, 30, 11), '#FFFBF0', 1.3);
      cloud(c, [[44, 58, 5], [52, 57, 5.5], [58, 60, 4]], '#FFFBF0', { lw: 1.6 });
    }],
  ['apple-fritters', 'Apple Fritters', 'pastries', 'Craggy golden-fried dough with apple chunks and glaze.',
    (c, r) => {
      plate(c, 50, 80, 44, 12);
      const blobP = (cx, cy, rad, seed) => (cc) => {
        cc.beginPath();
        for (let i = 0; i <= 14; i++) {
          const a = (i / 14) * TAU;
          const k = 1 + Math.sin(a * 5 + seed) * 0.1 + Math.cos(a * 3 + seed) * 0.08;
          const px = cx + Math.cos(a) * rad * k, py = cy + Math.sin(a) * rad * 0.72 * k;
          i ? cc.lineTo(px, py) : cc.moveTo(px, py);
        }
        cc.closePath();
      };
      for (const [cx, cy, rad, s] of [[62, 46, 22, 1], [42, 62, 26, 2]]) {
        ts(c, blobP(cx, cy, rad, s), '#D99447');
        for (let i = 0; i < 5; i++) {
          const [x, y] = inEll(cx, cy, rad * 0.6, rad * 0.4)(r);
          ts(c, R(x - 2.5, y - 2, 5, 4, 1), '#F7E6A8', { off: 0.8, lw: 1.4 });
        }
        c.save();
        blobP(cx, cy, rad, s)(c);
        c.clip();
        c.globalAlpha = 0.6;
        for (let i = 0; i < 4; i++) line(c, [[cx - rad, cy - 8 + i * 5], [cx + rad, cy - 12 + i * 6]], 2.6, '#FFFBF0');
        c.restore();
      }
    }],
  ['blueberry-muffins', 'Blueberry Muffins', 'pastries', 'Domed, sugar-crusted tops with purple-blue berry bursts.',
    (c, r) => {
      ts(c, P([[26, 58], [74, 58], [68, 90], [32, 90]]), '#86BADB', { off: 2 });
      for (const x of [36, 43, 50, 57, 64]) line(c, [[x, 60], [x - (x - 50) * 0.15, 88]], 1.4, '#5F97BE');
      const top = (cc) => {
        cc.beginPath();
        cc.moveTo(20, 60);
        cc.bezierCurveTo(14, 26, 86, 26, 80, 60);
        cc.bezierCurveTo(70, 66, 30, 66, 20, 60);
        cc.closePath();
      };
      ts(c, top, '#E4A55A', { gloss: [38, 38, 7] });
      for (const [x, y] of [[36, 46], [52, 40], [64, 50], [46, 55], [58, 58], [30, 56]]) ts(c, Ci(x, y, 3.8), '#6D63B5', { off: 1, lw: 1.8 });
      dots(c, r, 30, (q) => [26 + q() * 48, 34 + q() * 24], '#FFFBF0', 0.9);
    }],
  ['beignets', 'Beignets', 'pastries', 'Puffy squares buried under a mountain of powdered sugar.',
    (c, r) => {
      plate(c, 50, 78, 44, 13);
      for (const [x, y, rot] of [[34, 64, -0.2], [64, 64, 0.25], [50, 52, 0.05]]) {
        c.save();
        c.translate(x, y);
        c.rotate(rot);
        ts(c, R(-15, -10, 30, 20, 8), '#E6A456');
        c.restore();
      }
      cloud(c, [[50, 46, 12], [38, 52, 9], [62, 52, 9], [30, 60, 6], [70, 60, 6], [50, 36, 8], [44, 58, 7], [56, 58, 7]], '#FFFBF0', { shade: 0.07 });
      dots(c, r, 40, inEll(50, 70, 36, 8), '#FFFBF0', 1);
    }],
  ['bread-pudding', 'Bread Pudding', 'pastries', 'Cubed golden bread baked custardy, drizzled with caramel sauce.',
    (c, r) => dish(c, {
      dish: '#F7B9C4', fill: '#F3D08A',
      detail: (cc, rr) => {
        for (let i = 0; i < 9; i++) {
          const x = 18 + (i % 5) * 14 + rr() * 3, y = 43 + Math.floor(i / 5) * 8 + rr() * 2;
          ts(cc, R(x, y, 11, 8, 2.5), '#E0A050', { off: 1.5, lw: 1.6 });
        }
        tube(cc, [[16, 48], [30, 53], [44, 46], [58, 54], [72, 47], [86, 52]], '#C0692E', 2.6, { lw: 1 });
      },
    }, r)],

  // Cold & Frozen
  ['sundae', 'Ice Cream Sundae', 'cold', 'Vanilla scoops, hot fudge, whipped cream and a red cherry.',
    (c) => {
      glassBowl(c, 50, 50, 30);
      scoop(c, 38, 48, 12, '#FFF1D6');
      scoop(c, 62, 48, 12, '#FFF1D6');
      scoop(c, 50, 38, 13, '#FFF1D6');
      const fudge = (cc) => {
        cc.beginPath();
        cc.moveTo(38, 34);
        cc.bezierCurveTo(40, 22, 60, 22, 62, 34);
        cc.lineTo(62, 44);
        cc.quadraticCurveTo(59, 46, 58, 40);
        cc.lineTo(55, 38);
        cc.lineTo(54, 48);
        cc.quadraticCurveTo(51, 50, 50, 44);
        cc.lineTo(46, 38);
        cc.lineTo(44, 46);
        cc.quadraticCurveTo(41, 47, 40, 42);
        cc.closePath();
      };
      ts(c, fudge, '#5A3422', { gloss: [46, 28, 3] });
      cloud(c, [[50, 24, 7], [44, 26, 5], [56, 26, 5]], '#FFFBF0');
      cherry(c, 50, 15, 5.5);
    }],
  ['milkshake', 'Milkshake', 'cold', 'A tall frosted glass with a whipped cream crown, cherry and striped straw.',
    (c) => {
      // straw
      c.save();
      c.translate(62, 26);
      c.rotate(0.35);
      ts(c, R(-3, -22, 6, 34, 3), '#FFFBF0', { off: 1, lw: 2.4 });
      c.save();
      R(-3, -22, 6, 34, 3)(c);
      c.clip();
      c.fillStyle = '#EE93A6';
      for (let y = -22; y < 12; y += 7) {
        c.beginPath();
        c.moveTo(-4, y);
        c.lineTo(4, y - 3);
        c.lineTo(4, y + 0.5);
        c.lineTo(-4, y + 3.5);
        c.fill();
      }
      c.restore();
      c.restore();
      ts(c, P([[28, 38], [72, 38], [66, 90], [34, 90]]), '#F7B9C4', { gloss: [36, 56, 5] });
      c.fillStyle = 'rgba(255,251,240,0.55)';
      c.fillRect(33, 42, 3, 42);
      ts(c, R(28, 34, 44, 8, 4), '#E9F5FA', { off: 1, lw: 2.2 });
      cloud(c, [[36, 32, 8], [50, 30, 9], [64, 32, 8], [44, 22, 7], [56, 22, 7], [50, 15, 5]], '#FFFBF0');
      cherry(c, 50, 10, 5);
    }],
  ['banana-pudding', 'Banana Pudding', 'cold', 'Layered in a glass dish with vanilla wafers, banana slices and whipped cream.',
    (c) => {
      const glass = R(16, 38, 68, 48, 10);
      ts(c, glass, '#FFF3DC', { off: 2 });
      c.save();
      glass(c);
      c.clip();
      c.fillStyle = '#FFE9A0';
      c.fillRect(16, 38, 68, 48);
      c.fillStyle = '#FFF6E0';
      c.fillRect(16, 60, 68, 10);
      for (let x = 22; x < 84; x += 12) {
        ts(c, E(x, 56, 6, 3.6), '#E4B06A', { off: 1, lw: 1.6 });
        bananaSlice(c, x + 6, 74, 4);
        ts(c, E(x, 82, 6, 3.6), '#E4B06A', { off: 1, lw: 1.6 });
      }
      c.fillStyle = 'rgba(221,240,246,0.45)';
      c.fillRect(16, 38, 68, 48);
      c.restore();
      glass(c);
      c.lineWidth = LW;
      c.strokeStyle = INK;
      c.stroke();
      cloud(c, [[24, 38, 7], [36, 35, 8], [50, 34, 9], [64, 35, 8], [76, 38, 7], [44, 28, 6], [58, 28, 6]], '#FFFBF0');
      ts(c, E(40, 26, 6, 3.8, -0.3), '#E4B06A', { off: 1, lw: 1.8 });
      ts(c, E(60, 25, 6, 3.8, 0.3), '#E4B06A', { off: 1, lw: 1.8 });
    }],
  ['banana-split', 'Banana Split', 'cold', 'Three scoops between a banana, with syrups, nuts and cherries.',
    (c, r) => {
      const boat = (cc) => { cc.beginPath(); cc.moveTo(6, 60); cc.quadraticCurveTo(50, 98, 94, 60); cc.closePath(); };
      ts(c, boat, '#AFD6EC', { gloss: [26, 66, 5] });
      const banana = (y, flip) => (cc) => {
        cc.beginPath();
        cc.moveTo(8, y);
        cc.quadraticCurveTo(50, y + (flip ? -6 : 10), 92, y);
        cc.quadraticCurveTo(50, y + (flip ? 4 : 18), 8, y);
        cc.closePath();
      };
      ts(c, banana(52, true), '#FFE27A');
      scoop(c, 28, 50, 11, '#FFF1D6');
      scoop(c, 50, 47, 12, '#7A4A30');
      scoop(c, 72, 50, 11, '#F7B9C4');
      ts(c, banana(60, false), '#FFE27A');
      tube(c, [[20, 42], [28, 46], [36, 42]], '#5A3422', 2.6, { lw: 1 });
      tube(c, [[64, 42], [72, 46], [80, 42]], '#D8404E', 2.6, { lw: 1 });
      dots(c, r, 16, (q) => [20 + q() * 60, 38 + q() * 8], '#C98A4A', 1.3);
      cherry(c, 28, 36, 4.2);
      cherry(c, 50, 32, 4.5);
      cherry(c, 72, 36, 4.2);
    }],
  ['root-beer-float', 'Root Beer Float', 'cold', 'A frosty mug with foamy vanilla ice cream on top.',
    (c) => {
      tube(c, [[70, 48], [84, 50], [84, 70], [70, 74]], '#E9F5FA', 6, { lw: 2.6 });
      const mug = R(22, 38, 50, 52, 8);
      ts(c, mug, '#B8652E', { gloss: [32, 56, 5] });
      c.save();
      mug(c);
      c.clip();
      c.fillStyle = 'rgba(233,245,250,0.45)';
      c.fillRect(22, 38, 50, 52);
      c.fillStyle = 'rgba(233,245,250,0.7)';
      for (const x of [30, 46, 62]) c.fillRect(x, 44, 3, 40);
      c.restore();
      mug(c);
      c.lineWidth = LW;
      c.strokeStyle = INK;
      c.stroke();
      cloud(c, [[26, 38, 6], [36, 36, 7], [48, 35, 7], [60, 36, 7], [70, 38, 6], [30, 44, 4], [66, 45, 4]], '#FFF1D6');
      scoop(c, 47, 30, 11, '#FFF6E0');
      c.save();
      c.translate(58, 20);
      c.rotate(0.3);
      ts(c, R(-2.5, -16, 5, 22, 2.5), '#E4605E', { off: 1, lw: 2 });
      c.restore();
    }],
  ['baked-alaska', 'Baked Alaska', 'cold', 'A toasted golden meringue dome over ice cream and cake.',
    (c) => {
      plate(c, 50, 80, 44, 12);
      cylinder(c, 50, 72, 32, 9, 6, '#E4AC62', null);
      const puffs = [];
      for (let row = 0; row < 4; row++) {
        const n = 6 - row;
        for (let i = 0; i < n; i++) {
          const x = 50 + (i - (n - 1) / 2) * (10 - row * 0.5);
          puffs.push([x, 68 - row * 11, 8 - row * 0.7]);
        }
      }
      puffs.push([50, 24, 5]);
      cloud(c, puffs, '#FFF3DC');
      for (const [x, y, rr] of puffs) {
        c.fillStyle = '#E3A45C';
        c.beginPath();
        c.ellipse(x - rr * 0.2, y - rr * 0.55, rr * 0.5, rr * 0.3, -0.3, 0, TAU);
        c.fill();
      }
    }],
  ['ice-cream-sandwich', 'Ice Cream Sandwich', 'cold', 'Vanilla ice cream between two chocolate wafer cookies.',
    (c) => {
      prism(c, 14, 44, 50, 34, 34, '#5A3422', [['#5A3422', 0.26], ['#FFF6E0', 0.48], ['#5A3422', 0.26]], null);
      c.fillStyle = '#3F2216';
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
        c.beginPath();
        c.arc(24 + i * 11 + j * 6, 40 - j * 5, 1.4, 0, TAU);
        c.fill();
      }
    }],

  // Candy & Campfire
  ['smores', "S'mores", 'candy', 'A toasted marshmallow, melted chocolate and graham crackers.',
    (c, r) => {
      prism(c, 16, 64, 50, 10, 30, '#DDA55E', '#D09550', null);
      prism(c, 20, 58, 40, 6, 24, '#5A3422', '#4E2C1C', null);
      cloud(c, [[36, 50, 10], [48, 49, 11], [58, 51, 9]], '#FFF3DC');
      c.fillStyle = '#D9934A';
      c.beginPath();
      c.ellipse(44, 44, 12, 5, -0.1, 0, TAU);
      c.fill();
      c.save();
      c.translate(4, -4);
      c.rotate(-0.08);
      prism(c, 16, 38, 50, 10, 30, '#DDA55E', '#D09550', null);
      c.restore();
      dots(c, r, 10, (q) => [26 + q() * 50, 22 + q() * 12], '#B87A43', 1.1);
    }],
  ['caramel-apple', 'Caramel Apple', 'candy', 'Glossy caramel coating and a crushed nut topping on a stick.',
    (c, r) => {
      ts(c, E(50, 86, 34, 8), '#FFFBF0', { off: 1 });
      ts(c, R(46, 6, 8, 36, 3), '#E8BC7A', { off: 1.5 });
      const apple = (cc) => {
        cc.beginPath();
        cc.moveTo(50, 36);
        cc.bezierCurveTo(26, 26, 14, 50, 22, 68);
        cc.bezierCurveTo(30, 88, 44, 86, 50, 84);
        cc.bezierCurveTo(56, 86, 70, 88, 78, 68);
        cc.bezierCurveTo(86, 50, 74, 26, 50, 36);
        cc.closePath();
      };
      ts(c, apple, '#E4605E');
      c.save();
      apple(c);
      c.clip();
      const car = (cc) => {
        cc.beginPath();
        cc.moveTo(10, 20);
        cc.lineTo(90, 20);
        cc.lineTo(90, 62);
        for (let i = 0; i <= 8; i++) {
          const x = 90 - i * 10;
          cc.quadraticCurveTo(x - 5, 62 + (i % 2 ? 12 : 4), x - 10, 62);
        }
        cc.closePath();
      };
      ts(c, car, '#C9782F', { gloss: [36, 44, 7], lw: 2.4 });
      dots(c, r, 26, (q) => [22 + q() * 56, 60 + q() * 8], '#F3D9A0', 1.5);
      c.restore();
      apple(c);
      c.lineWidth = LW;
      c.strokeStyle = INK;
      c.stroke();
    }],
  ['fudge', 'Chocolate Fudge', 'candy', 'Smooth, glossy squares stacked on wax paper.',
    (c) => {
      ts(c, P([[8, 78], [70, 88], [94, 70], [34, 62]]), '#FFFBF0', { off: 1 });
      prism(c, 22, 60, 30, 16, 22, '#7A4A30', '#5A3422', '#5A3422');
      prism(c, 48, 62, 26, 14, 20, '#7A4A30', '#5A3422', '#5A3422');
      prism(c, 34, 42, 30, 16, 22, '#7A4A30', '#5A3422', '#5A3422');
      c.fillStyle = 'rgba(255,251,240,0.6)';
      for (const [x, y] of [[40, 38], [28, 56], [54, 58]]) c.fillRect(x, y, 10, 1.6);
    }],
  ['pralines', 'Pralines', 'candy', 'Round pecan candies with a creamy, sugary caramel surface.',
    (c, r) => {
      ts(c, E(50, 72, 46, 16), '#FFFBF0', { off: 1 });
      for (const [x, y, s] of [[64, 46, 0.85], [34, 52, 0.9], [52, 66, 1]]) {
        const p = (cc) => {
          cc.beginPath();
          for (let i = 0; i <= 16; i++) {
            const a = (i / 16) * TAU;
            const k = 1 + Math.sin(a * 6 + x) * 0.06;
            const px = x + Math.cos(a) * 18 * s * k, py = y + Math.sin(a) * 11 * s * k;
            i ? cc.lineTo(px, py) : cc.moveTo(px, py);
          }
          cc.closePath();
        };
        ts(c, p, '#D89A55', { gloss: [x - 6 * s, y - 4 * s, 4 * s] });
        dots(c, r, 10, inEll(x, y, 14 * s, 8 * s), '#F3D9A0', 1);
        pecanHalf(c, x - 4 * s, y, 0.4, 0.8 * s);
        pecanHalf(c, x + 6 * s, y - 2 * s, -0.5, 0.7 * s);
      }
    }],
  ['cotton-candy', 'Cotton Candy', 'candy', 'A fluffy pink-and-blue cloud on a paper cone.',
    (c) => {
      const cone = P([[38, 60], [62, 60], [50, 96]]);
      ts(c, cone, '#FFFBF0', { off: 1.5 });
      c.save();
      cone(c);
      c.clip();
      c.fillStyle = '#EE93A6';
      for (let y = 56; y < 100; y += 10) {
        c.beginPath();
        c.moveTo(30, y);
        c.lineTo(70, y - 8);
        c.lineTo(70, y - 4);
        c.lineTo(30, y + 4);
        c.fill();
      }
      c.restore();
      cone(c);
      c.lineWidth = LW;
      c.strokeStyle = INK;
      c.stroke();
      cloud(c, [[50, 38, 18], [34, 42, 13], [66, 42, 13], [40, 26, 12], [60, 26, 12], [50, 16, 10], [30, 30, 9], [70, 30, 9], [50, 54, 10]],
        '#F7B9C4', { colors: ['#F7B9C4', '#BFE0F0', '#F9C8D0', '#AFD6EC', '#F7B9C4', '#FBD3DA', '#BFE0F0', '#F7B9C4', '#F9C8D0'] });
    }],
];

// ------------------------------------------------------------------ toppings

function pipingBag(c, col) {
  const bag = (cc) => {
    cc.beginPath();
    cc.moveTo(26, 22);
    cc.quadraticCurveTo(50, 8, 74, 22);
    cc.lineTo(55, 74);
    cc.lineTo(45, 74);
    cc.closePath();
  };
  ts(c, bag, col, { gloss: [40, 30, 5] });
  ts(c, P([[44, 72], [56, 72], [53, 86], [47, 86]]), '#FFE08A', { off: 1, lw: 2.4 });
  for (const x of [46.5, 50, 53.5]) line(c, [[x, 76], [x, 85]], 1.1, '#C99A3A');
  tube(c, [[30, 22], [50, 16], [70, 22]], col, 4, { lw: 1.6 });
}

const TOPPING_ART = {
  whipped: (c) => cloud(c, [[50, 66, 17], [32, 70, 11], [68, 70, 11], [41, 50, 12], [59, 50, 12], [50, 34, 10], [50, 22, 5]], '#FFFBF0'),
  frosting: (c) => pipingBag(c, '#FFF3DC'),
  fudge: (c, r) => {
    ts(c, R(68, 44, 22, 7, 3), '#8A5A3B', { off: 1.5 });
    cylinder(c, 44, 44, 28, 9, 30, '#E8893A', '#5A3422');
    for (const [x, l] of [[28, 10], [40, 16], [54, 12]]) ts(c, R(x, 47, 6, l, 3), '#5A3422', { off: 1, lw: 2 });
    dots(c, r, 5, inEll(44, 43, 20, 5), '#8A5A3B', 1.5);
  },
  pink: (c) => pipingBag(c, '#F7B9C4'),
  glaze: (c) => {
    cylinder(c, 50, 50, 32, 11, 22, '#AFD6EC', '#FFF6E6');
    tube(c, [[56, 22], [62, 40], [58, 50]], '#E8BC7A', 4, { lw: 1.8 });
    ts(c, E(46, 50, 14, 4), '#FFFFFF', { flat: true, lw: 0 });
  },
  sprinkles: (c, r) => {
    ts(c, R(30, 34, 40, 54, 10), '#E9F5FA', { gloss: [38, 48, 4] });
    ts(c, R(28, 22, 44, 14, 6), '#EE93A6', { off: 1.5 });
    for (const x of [40, 50, 60]) ts(c, Ci(x, 28, 2), '#6A4029', { flat: true, lw: 0 });
    sprinkles(c, r, 26, (q) => [36 + q() * 28, 44 + q() * 40]);
  },
  cherry: (c) => { cherry(c, 38, 62, 13); cherry(c, 64, 66, 12); },
  strawberry: (c) => { strawberry(c, 38, 56, 2.1); strawberry(c, 64, 62, 1.8); },
  nuts: (c) => {
    for (const [x, y, rot] of [[34, 62, 0.4], [58, 66, -0.3], [46, 48, 0.1], [66, 46, 0.7], [30, 42, -0.5]]) pecanHalf(c, x, y, rot, 2);
  },
  powdered: (c, r) => {
    ts(c, P([[24, 30], [76, 30], [66, 62], [34, 62]]), '#E8BC7A', { off: 2 });
    ts(c, R(20, 24, 60, 10, 5), '#D9A05B', { off: 1.5 });
    for (const x of [34, 42, 50, 58, 66]) line(c, [[x, 36], [x + (50 - x) * 0.15, 60]], 1.2, '#B97A43');
    ts(c, R(78, 38, 16, 6, 3), '#D9A05B', { off: 1 });
    dots(c, r, 40, (q) => [34 + q() * 32, 66 + q() * 26], '#FFFBF0', 1.6);
    cloud(c, [[50, 88, 7], [40, 90, 5], [60, 90, 5]], '#FFFBF0', { lw: 2 });
  },
  caramel: (c) => {
    ts(c, R(34, 34, 32, 52, 12), '#D9822F', { gloss: [42, 46, 5] });
    ts(c, P([[40, 34], [60, 34], [54, 20], [46, 20]]), '#FFF3DC', { off: 1.5 });
    ts(c, R(47, 8, 6, 14, 3), '#FFF3DC', { off: 1, lw: 2.2 });
    ts(c, R(38, 54, 24, 16, 4), '#FFF3DC', { off: 1, lw: 1.8 });
    ts(c, R(44, 84, 6, 10, 3), '#D9822F', { off: 1, lw: 2 });
  },
  shavings: (c) => {
    for (const [x, y, rot] of [[34, 40, 0.3], [58, 34, -0.4], [46, 60, 0.9], [68, 58, 0.2], [30, 70, -0.8]]) {
      c.save();
      c.translate(x, y);
      c.rotate(rot);
      ts(c, R(-12, -5, 24, 10, 5), '#6A4029', { off: 1.5 });
      line(c, [[-8, 0], [8, 0]], 1.4, '#A06A48');
      c.restore();
    }
  },
};

export const TOPPINGS = [
  ['whipped', 'Whipped Cream', '1', '#FFFBF0'],
  ['frosting', 'Frosting', '2', '#FFF3DC'],
  ['fudge', 'Hot Fudge', '3', '#5A3422'],
  ['pink', 'Pink Icing', '4', '#F7B9C4'],
  ['glaze', 'Sugar Glaze', '5', '#FFF6E6'],
  ['sprinkles', 'Sprinkles', '6', '#EE93A6'],
  ['cherry', 'Cherries', '7', '#E4605E'],
  ['strawberry', 'Strawberries', '8', '#E4605E'],
  ['nuts', 'Chopped Nuts', '9', '#95512A'],
  ['powdered', 'Powdered Sugar', '0', '#FFFBF0'],
  ['caramel', 'Caramel', '-', '#D9822F'],
  ['shavings', 'Chocolate Curls', '=', '#6A4029'],
].map(([id, name, key, color], i) => ({ id, name, key, color, draw: TOPPING_ART[id], n: 90 + i }));
export const TOPPING_BY_ID = Object.fromEntries(TOPPINGS.map((t) => [t.id, t]));

const topUrl = new Map();
export function toppingURL(t) {
  if (!topUrl.has(t.id)) topUrl.set(t.id, drawSticker(96, t.draw, t.n).toDataURL());
  return topUrl.get(t.id);
}

// ------------------------------------------------------------------ recipes
// Every recipe is a little card of steps. Gathering happens at the storage
// corner; the rest happens at the matching station.

const gather = (...items) => ({ t: 'gather', items });
const mix = (label = 'Mix the batter') => ({ t: 'mix', label });
const prep = (label, mode = 'tap', n = 6, seq = null) => ({ t: 'prep', label, mode, n, seq });
const order = (label, seq) => ({ t: 'prep', label, mode: 'order', n: seq.length, seq });
const bake = (label = 'Bake until golden', dur = 10) => ({ t: 'bake', label, dur });
const cook = (label = 'Cook on the stove', dur = 9) => ({ t: 'cook', label, dur });
const chill = (label = 'Chill in the freezer', dur = 7) => ({ t: 'chill', label, dur });
const decor = (...tops) => ({ t: 'decor', tops });

// Ingredients that need prepping at the island before they can be used.
// Staples (flour, sugar, butter, milk...) go straight in, so every recipe's
// prep is shaped by the ingredients that make it special. A "!" after an
// ingredient in a recipe means "use it whole" (e.g. a caramel apple).
export const ING_PREP = {
  eggs: { label: 'Crack the eggs', mode: 'hit', n: 2 },
  apples: { label: 'Peel the apples', mode: 'swirl', n: 2 },
  peaches: { label: 'Slice the peaches', mode: 'tap', n: 5 },
  bananas: { label: 'Peel the bananas', mode: 'zigzag', n: 4 },
  strawberries: { label: 'Hull the strawberries', mode: 'tap', n: 5 },
  pineapple: { label: 'Core the pineapple rings', mode: 'swirl', n: 1 },
  cherries: { label: 'Pit the cherries', mode: 'hit', n: 3 },
  carrots: { label: 'Grate the carrots', mode: 'roll', n: 1 },
  'sweet-potato': { label: 'Mash the sweet potatoes', mode: 'tap', n: 8 },
  pumpkin: { label: 'Scoop & mash the pumpkin', mode: 'tap', n: 8 },
  lemons: { label: 'Zest the lemons', mode: 'roll', n: 1 },
  limes: { label: 'Squeeze the limes', mode: 'hold', n: 1 },
  chocolate: { label: 'Chop the chocolate', mode: 'tap', n: 5 },
  nuts: { label: 'Chop the pecans', mode: 'tap', n: 5 },
  bread: { label: 'Cube the bread', mode: 'tap', n: 5 },
};

const RECIPES = {
  'apple-pie': [gather('flour', 'butter', 'apples', 'cinnamon'), mix('Knead the dough'), prep('Roll out the crust', 'roll'), prep('Weave the lattice', 'alternate', 8), bake()],
  'pecan-pie': [gather('flour', 'butter'), mix('Knead the dough'), prep('Roll out the crust', 'roll'), prep('Crimp the edges', 'hit', 5), gather('nuts', 'caramel', 'eggs'), prep('Pour in the filling', 'fill'), bake('Bake until set')],
  'key-lime-pie': [gather('graham', 'butter'), prep('Press the crumb crust', 'tap', 6), gather('limes', 'milk', 'eggs'), mix('Whisk the lime filling'), prep('Pour into the crust', 'fill'), chill('Chill until set'), decor('whipped')],
  'pumpkin-pie': [gather('flour', 'butter', 'pumpkin', 'cinnamon'), mix('Blend the spiced filling'), prep('Roll out the crust', 'roll'), prep('Crimp the edges', 'hit', 5), bake(), decor('whipped')],
  'cherry-pie': [gather('flour', 'butter', 'cherries', 'sugar'), mix('Knead the dough'), cook('Simmer the cherries'), prep('Roll out the crust', 'roll'), prep('Weave the lattice', 'alternate', 8), bake()],
  'banana-cream-pie': [gather('flour', 'butter'), mix('Knead the dough'), prep('Roll out the crust', 'roll'), bake('Blind-bake the crust', 8), gather('bananas', 'milk', 'eggs'), cook('Stir the custard'), order('Layer the pie', ['Bananas', 'Custard', 'Bananas']), decor('whipped', 'shavings')],
  'blueberry-pie': [gather('flour', 'butter', 'blueberries', 'sugar'), mix('Knead the dough'), prep('Roll out the crust', 'roll'), prep('Cut star vents', 'hit', 5), bake()],
  'sweet-potato-pie': [gather('flour', 'butter', 'sweet-potato', 'cinnamon'), mix('Whip the filling'), prep('Pour into the crust', 'fill'), bake('Bake until set')],
  'mud-pie': [gather('chocolate', 'butter', 'eggs', 'cream'), cook('Melt the chocolate'), mix('Whisk the fudge filling'), prep('Press the cookie crust', 'tap', 6), bake(), chill('Chill until set'), decor('whipped', 'shavings')],
  'peach-cobbler': [gather('peaches', 'sugar', 'flour', 'butter'), cook('Simmer the peaches'), mix('Crumble the biscuit dough'), prep('Drop biscuit spoonfuls', 'hit', 6), bake()],
  'apple-crisp': [gather('apples', 'oats', 'sugar', 'butter'), mix('Rub the oat crumble'), prep('Scatter the topping', 'zigzag', 6), bake()],

  'cheesecake': [gather('graham', 'butter'), prep('Press the crumb crust', 'tap', 6), gather('cream-cheese', 'eggs', 'sugar'), mix('Beat until silky'), prep('Smooth the top', 'swirl', 2), bake('Bake gently'), chill('Chill until firm'), decor('strawberry')],
  'cupcake': [gather('flour', 'butter', 'eggs', 'sugar'), mix('Whisk the batter'), prep('Fill the liners', 'fill'), bake(), prep('Pipe the buttercream swirl', 'swirl', 3), decor('sprinkles', 'cherry')],
  'red-velvet': [gather('flour', 'chocolate', 'eggs', 'cream-cheese'), mix('Whisk the red batter'), prep('Pour the layers', 'fill'), bake(), chill('Cool the layers'), order('Stack the cake', ['Red layer', 'Frosting', 'Red layer']), decor('frosting')],
  'boston-cream': [gather('flour', 'eggs', 'milk', 'sugar'), mix('Whisk the sponge'), bake(), cook('Stir the custard'), order('Layer the cake', ['Sponge', 'Custard', 'Sponge']), decor('fudge')],
  'carrot-cake': [gather('flour', 'carrots', 'eggs', 'cream-cheese'), mix('Fold the spiced batter'), bake(), prep('Spread the frosting', 'swirl', 2), decor('nuts')],
  'devils-food': [gather('flour', 'chocolate', 'eggs', 'sugar'), cook('Bloom the cocoa'), mix('Whisk the batter'), bake(), order('Stack the layers', ['Chocolate layer', 'Fudge', 'Chocolate layer', 'Fudge']), decor('shavings')],
  'pineapple-upside-down': [gather('flour', 'eggs', 'butter', 'sugar'), mix('Whisk the batter'), gather('pineapple', 'cherries'), cook('Caramelize the brown sugar'), prep('Arrange the rings', 'hit', 5), bake(), prep('Flip it over', 'hit', 1)],
  'german-chocolate': [gather('flour', 'chocolate', 'eggs', 'butter'), mix('Whisk the batter'), bake(), gather('coconut', 'nuts'), cook('Cook the coconut-pecan filling'), prep('Spread the filling', 'swirl', 2)],
  'angel-food': [gather('flour', 'eggs', 'sugar'), mix('Whip to stiff peaks'), prep('Fold in gently', 'zigzag', 6), bake(), chill('Cool upside down'), decor('powdered')],
  'pound-cake': [gather('flour', 'butter', 'sugar', 'eggs'), mix('Cream the batter'), prep('Pour into the loaf pan', 'fill'), bake(), prep('Drizzle the glaze', 'zigzag', 6)],
  'strawberry-shortcake': [gather('flour', 'butter', 'strawberries', 'sugar'), mix('Mix the biscuit dough'), prep('Cut the biscuits', 'hit', 4), bake(), order('Layer the shortcake', ['Biscuit', 'Strawberries', 'Biscuit']), decor('whipped', 'strawberry')],
  'whoopie-pies': [gather('flour', 'chocolate', 'butter', 'marshmallows'), mix('Whisk the batter'), prep('Scoop the rounds', 'hit', 6), bake(), prep('Pipe the filling', 'swirl', 2), prep('Sandwich them', 'tap', 3)],

  'chocolate-chip': [gather('flour', 'butter', 'sugar', 'chocolate'), mix('Cream the dough'), prep('Scoop even dough balls', 'hit', 6), bake()],
  'brownies': [gather('chocolate', 'butter', 'eggs', 'sugar'), cook('Melt chocolate & butter'), mix('Whisk the batter'), prep('Swirl the top', 'swirl', 2), bake(), prep('Cut into squares', 'hit', 4)],
  'snickerdoodles': [gather('flour', 'butter', 'sugar', 'cinnamon'), mix('Cream the dough'), prep('Roll in cinnamon sugar', 'swirl', 2), bake()],
  'lemon-bars': [gather('flour', 'butter', 'lemons', 'eggs'), prep('Press the shortbread', 'tap', 6), bake('Bake the base', 8), cook('Stir the lemon curd'), prep('Pour on the curd', 'fill'), chill('Chill until set'), decor('powdered')],
  'rice-krispies': [gather('butter', 'marshmallows', 'crispy-rice'), cook('Melt the marshmallows'), prep('Fold in the cereal', 'zigzag', 6), prep('Press into the pan', 'tap', 5), chill('Let it set'), prep('Cut into squares', 'hit', 4)],
  'oatmeal-raisin': [gather('oats', 'raisins', 'flour', 'butter'), mix('Stir the dough'), prep('Scoop even dough balls', 'hit', 6), bake()],
  'peanut-butter': [gather('peanut-butter', 'flour', 'sugar', 'eggs'), mix('Cream the dough'), prep('Press the fork crisscross', 'alternate', 6), bake()],
  'sugar-cookies': [gather('flour', 'butter', 'sugar', 'eggs'), mix('Cream the dough'), prep('Roll out the dough', 'roll'), prep('Cut out shapes', 'hit', 5), bake(), decor('pink', 'sprinkles')],

  'glazed-donuts': [gather('flour', 'milk', 'eggs', 'sugar'), mix('Knead the dough'), prep('Cut the rings', 'hit', 5), cook('Fry & flip'), prep('Dip in the glaze', 'fill'), decor('sprinkles')],
  'cinnamon-rolls': [gather('flour', 'butter', 'cinnamon', 'sugar'), mix('Knead the dough'), prep('Roll out the dough', 'roll'), prep('Roll up the swirl', 'swirl', 3), bake(), decor('frosting')],
  'funnel-cake': [gather('flour', 'milk', 'eggs', 'sugar'), mix('Whisk the batter'), prep('Fill the funnel', 'fill'), cook('Swirl into the hot oil'), decor('powdered')],
  'apple-fritters': [gather('flour', 'apples', 'cinnamon', 'milk'), mix('Fold the batter'), prep('Shape the fritters', 'hit', 4), cook('Fry & flip'), prep('Drizzle the glaze', 'zigzag', 6)],
  'blueberry-muffins': [gather('flour', 'blueberries', 'eggs', 'sugar'), mix('Fold in the berries gently'), prep('Fill the muffin cups', 'fill'), bake(), decor('powdered')],
  'beignets': [gather('flour', 'milk', 'eggs', 'sugar'), mix('Knead the dough'), prep('Roll out the dough', 'roll'), prep('Cut little squares', 'hit', 6), cook('Fry until puffy'), decor('powdered')],
  'bread-pudding': [gather('bread', 'eggs', 'milk', 'sugar'), mix('Soak in custard'), prep('Pour into the dish', 'fill'), bake(), prep('Drizzle the caramel', 'zigzag', 6)],

  'sundae': [gather('ice-cream', 'chocolate'), cook('Warm the hot fudge'), prep('Scoop three scoops', 'fill'), decor('fudge', 'whipped', 'cherry')],
  'milkshake': [gather('ice-cream', 'milk'), chill('Frost the glass'), mix('Blend until thick'), prep('Pour into the glass', 'fill'), decor('whipped', 'cherry')],
  'banana-pudding': [gather('bananas', 'milk', 'eggs', 'sugar'), cook('Stir the custard'), order('Layer the pudding', ['Wafers', 'Bananas', 'Custard', 'Wafers', 'Bananas', 'Custard']), chill('Chill until set'), decor('whipped')],
  'banana-split': [gather('bananas', 'ice-cream'), prep('Split the banana', 'hit', 1), prep('Scoop three flavors', 'fill'), decor('fudge', 'nuts', 'cherry')],
  'root-beer-float': [gather('root-beer', 'ice-cream'), chill('Frost the mug'), prep('Pour slowly, no spills!', 'fill'), prep('Float a scoop on top', 'hit', 1)],
  'baked-alaska': [gather('ice-cream', 'flour', 'eggs', 'sugar'), prep('Dome the ice cream', 'swirl', 2), chill('Freeze the dome'), mix('Whip the meringue'), prep('Pipe meringue peaks', 'swirl', 3), bake('Toast the meringue', 6)],
  'ice-cream-sandwich': [gather('flour', 'chocolate', 'butter'), mix('Mix the wafer dough'), prep('Roll out the wafers', 'roll'), bake(), gather('ice-cream'), prep('Sandwich & press', 'tap', 3), chill('Freeze until firm')],

  'smores': [gather('graham', 'chocolate!', 'marshmallows'), cook('Toast the marshmallow'), order('Stack it up', ['Graham', 'Chocolate', 'Marshmallow', 'Graham']), prep('Squish it together', 'tap', 3)],
  'caramel-apple': [gather('apples!', 'caramel'), cook('Melt the caramel'), prep('Dip & twirl', 'fill'), decor('nuts'), chill('Let it set')],
  'fudge': [gather('chocolate', 'sugar', 'butter', 'milk'), cook('Stir the fudge'), prep('Beat until glossy', 'wiggle'), prep('Pour into the pan', 'fill'), chill('Let it set'), prep('Cut into squares', 'hit', 4)],
  'pralines': [gather('nuts', 'sugar', 'butter', 'cream'), cook('Cook the praline candy'), prep('Spoon onto wax paper', 'hit', 5)],
  'cotton-candy': [gather('sugar'), cook('Melt the sugar'), prep('Spin the floss', 'swirl', 4)],
};

// batter/dough color shown in the bowl after mixing
const CAT_BATTER = { pies: '#F3D9A6', cookies: '#E9C27E', pastries: '#F6DDA0', cakes: '#F8DE9C', cold: '#FFF1D6', candy: '#E3A45C' };
const BATTER = {
  'mud-pie': '#5A3422', 'red-velvet': '#B8323F', 'devils-food': '#5A3422', 'german-chocolate': '#6A4029',
  'brownies': '#5A3422', 'whoopie-pies': '#5A3422', 'chocolate-chip': '#E3B06E', 'key-lime-pie': '#DDEBA2',
  'lemon-bars': '#FFE066', 'pumpkin-pie': '#E8893A', 'sweet-potato-pie': '#D9824A', 'banana-cream-pie': '#FFE9A0',
  'milkshake': '#F7B9C4', 'ice-cream-sandwich': '#5A3422', 'fudge': '#5A3422', 'peanut-butter': '#D9A05B',
  'carrot-cake': '#E39A5A', 'bread-pudding': '#F3D08A', 'cheesecake': '#FFF1D0', 'baked-alaska': '#FFF6E6',
};

// What each step visibly adds to the treat (see the feature tags in dessert3d.js).
const STEP_FX = {
  'apple-pie': { 'Roll out the crust': 'crust', 'Weave the lattice': 'lattice' },
  'pecan-pie': { 'Roll out the crust': 'crust', 'Crimp the edges': 'crimp', 'Pour in the filling': 'fill' },
  'key-lime-pie': { 'Press the crumb crust': 'crust', 'Pour into the crust': 'fill' },
  'pumpkin-pie': { 'Roll out the crust': 'crust', 'Crimp the edges': 'crimp' },
  'cherry-pie': { 'Roll out the crust': 'crust', 'Weave the lattice': 'lattice' },
  'banana-cream-pie': { 'Roll out the crust': 'crust', 'Layer the pie': 'layers' },
  'blueberry-pie': { 'Roll out the crust': 'crust', 'Cut star vents': 'vents' },
  'sweet-potato-pie': { 'Pour into the crust': 'fill' },
  'mud-pie': { 'Press the cookie crust': 'crust' },
  'peach-cobbler': { 'Drop biscuit spoonfuls': 'biscuits' },
  'apple-crisp': { 'Scatter the topping': 'crumble' },
  'cheesecake': { 'Press the crumb crust': 'crust', 'Smooth the top': 'body' },
  'cupcake': { 'Fill the liners': 'fill', 'Pipe the buttercream swirl': 'frost' },
  'red-velvet': { 'Stack the cake': 'layers' },
  'boston-cream': { 'Layer the cake': 'layers' },
  'carrot-cake': { 'Spread the frosting': 'frost' },
  'devils-food': { 'Stack the layers': 'layers' },
  'pineapple-upside-down': { 'Arrange the rings': 'rings', 'Flip it over': 'flip' },
  'german-chocolate': { 'Spread the filling': 'frost' },
  'pound-cake': { 'Pour into the loaf pan': 'fill', 'Drizzle the glaze': 'glaze' },
  'strawberry-shortcake': { 'Layer the shortcake': 'layers' },
  'whoopie-pies': { 'Scoop the rounds': 'rounds', 'Pipe the filling': 'frost', 'Sandwich them': 'sandwich' },
  'chocolate-chip': { 'Scoop even dough balls': 'scoop' },
  'brownies': { 'Cut into squares': 'cut' },
  'snickerdoodles': { 'Roll in cinnamon sugar': 'sugar' },
  'lemon-bars': { 'Press the shortbread': 'crust', 'Pour on the curd': 'fill' },
  'rice-krispies': { 'Cut into squares': 'cut' },
  'oatmeal-raisin': { 'Scoop even dough balls': 'scoop' },
  'peanut-butter': { 'Press the fork crisscross': 'fork' },
  'sugar-cookies': { 'Roll out the dough': 'dough', 'Cut out shapes': 'cut' },
  'glazed-donuts': { 'Cut the rings': 'cut', 'Dip in the glaze': 'glaze' },
  'cinnamon-rolls': { 'Roll out the dough': 'dough', 'Roll up the swirl': 'roll' },
  'apple-fritters': { 'Shape the fritters': 'shape', 'Drizzle the glaze': 'glaze' },
  'blueberry-muffins': { 'Fill the muffin cups': 'fill' },
  'beignets': { 'Roll out the dough': 'dough', 'Cut little squares': 'cut' },
  'bread-pudding': { 'Pour into the dish': 'fill', 'Drizzle the caramel': 'glaze' },
  'sundae': { 'Scoop three scoops': 'scoops' },
  'milkshake': { 'Pour into the glass': 'fill' },
  'banana-pudding': { 'Layer the pudding': 'layers' },
  'banana-split': { 'Split the banana': 'split', 'Scoop three flavors': 'scoops' },
  'root-beer-float': { 'Pour slowly, no spills!': 'fill', 'Float a scoop on top': 'scoop' },
  'baked-alaska': { 'Dome the ice cream': 'dome', 'Pipe meringue peaks': 'meringue' },
  'ice-cream-sandwich': { 'Sandwich & press': 'sandwich' },
  'smores': { 'Stack it up': 'layers', 'Squish it together': 'squish' },
  'caramel-apple': { 'Dip & twirl': 'dip' },
  'fudge': { 'Pour into the pan': 'fill', 'Cut into squares': 'cut' },
  'pralines': { 'Spoon onto wax paper': 'spoon' },
  'cotton-candy': { 'Spin the floss': 'floss' },
};

// The Mixing Bowl plays differently depending on the verb on the card.
function mixMode(label) {
  if (/knead|crumble|rub/i.test(label)) return { mode: 'tap', n: 8, tapLabel: 'Knead!' };
  if (/fold|stir|soak/i.test(label)) return { mode: 'zigzag', n: 5 };
  if (/whip/i.test(label)) return { mode: 'swirl', n: 4 };
  return { mode: 'swirl', n: 3 }; // whisk, beat, cream, blend
}

function stepLabel(s) {
  if (s.label) return s.label;
  if (s.t === 'gather') return 'Gather ingredients';
  if (s.t === 'decor') return 'Decorate';
  return STATIONS[STEP_STATION[s.t]].short;
}

export const DESSERTS = D.map(([id, name, cat, desc, draw], i) => {
  const steps = RECIPES[id].map((raw) => {
    const s = { ...raw };
    if (s.t === 'gather') {
      // "apples!" = use whole; everything else follows ING_PREP
      s.whole = s.items.filter((x) => x.endsWith('!')).map((x) => x.slice(0, -1));
      s.items = s.items.map((x) => x.replace('!', ''));
      s.needsPrep = s.items.filter((x) => ING_PREP[x] && !s.whole.includes(x));
    }
    if (s.t === 'mix') Object.assign(s, mixMode(s.label || ''));
    s.label = stepLabel(s);
    const fx = STEP_FX[id] && STEP_FX[id][s.label];
    if (fx) s.fx = fx;
    s.station = STEP_STATION[s.t];
    return s;
  });
  const ingredients = [...new Set(steps.filter((s) => s.t === 'gather').flatMap((s) => s.items))];
  return { id, name, cat, desc, draw, n: i + 1, steps, ingredients, batter: BATTER[id] || CAT_BATTER[cat] };
});
export const BY_ID = Object.fromEntries(DESSERTS.map((d) => [d.id, d]));

// ------------------------------------------------------------------ rendering

const iconCache = new Map();

/** Returns a canvas with the dessert sticker. `raw` = unfinished, drawn pale. */
export function dessertCanvas(d, size = 128, raw = false) {
  const key = `${d.id}|${size}|${raw}`;
  if (iconCache.has(key)) return iconCache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.scale(size / 100, size / 100);
  // small breathing room so outlines aren't clipped
  ctx.translate(50, 50);
  ctx.scale(0.92, 0.92);
  ctx.translate(-50, -50);
  d.draw(ctx, rng(d.n * 17 + 3));
  if (raw) {
    // unfinished treats read as a pale, dotted "in progress" sticker
    const img = ctx.getImageData(0, 0, size, size);
    const px = img.data;
    for (let i = 0; i < px.length; i += 4) {
      const g = (px[i] + px[i + 1] + px[i + 2]) / 3;
      px[i] = px[i] * 0.35 + g * 0.3 + 255 * 0.35;
      px[i + 1] = px[i + 1] * 0.35 + g * 0.3 + 243 * 0.35;
      px[i + 2] = px[i + 2] * 0.35 + g * 0.3 + 220 * 0.35;
    }
    ctx.putImageData(img, 0, 0);
  }
  iconCache.set(key, c);
  return c;
}

const urlCache = new Map();
export function dessertURL(d, raw = false) {
  const key = d.id + raw;
  if (!urlCache.has(key)) urlCache.set(key, dessertCanvas(d, 128, raw).toDataURL());
  return urlCache.get(key);
}
