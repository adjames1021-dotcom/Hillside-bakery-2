// Flat sticker icons for the morning market's upgrades and decor.
import { INK, TAU, dk, E, Ci, R, P, ts, cloud, tube, line, drawSticker } from './sticker.js';
import { IS_RESTAURANT } from './venue.js';

const PAINT = {
  oven(c) {
    ts(c, R(18, 22, 64, 62, 12), '#F4A646');
    ts(c, R(26, 44, 48, 32, 8), '#FFF3DC');
    ts(c, R(31, 49, 38, 22, 6), '#F6C35A', { off: 2 });
    ts(c, E(50, 62, 12, 5), '#E4A05C', { off: 1.5 });
    for (const x of [30, 44, 58, 72]) ts(c, Ci(x - 2, 32, 4), '#FFF3DC', { off: 1, lw: 2 });
    tube(c, [[40, 18], [44, 10], [48, 18]], '#FFE08A', 5, { lw: 2 });
  },
  thermo(c) {
    ts(c, Ci(50, 50, 30), '#FFF3DC');
    ts(c, Ci(50, 50, 22), '#fff', { off: 2 });
    c.save();
    c.beginPath();
    c.moveTo(50, 50);
    c.arc(50, 50, 22, -2.2, -1.2);
    c.closePath();
    c.fillStyle = '#FFE08A';
    c.fill();
    c.restore();
    line(c, [[50, 50], [62, 36]], 3.5);
    ts(c, Ci(50, 50, 4), INK, { flat: true, lw: 0 });
    ts(c, R(44, 76, 12, 14, 4), '#AFCB9C', { lw: 2.4 });
  },
  mixer(c) {
    ts(c, R(22, 76, 56, 12, 6), '#EE93A6');
    ts(c, R(62, 26, 14, 54, 7), '#EE93A6');
    ts(c, R(26, 20, 52, 18, 9), '#EE93A6');
    ts(c, P([[28, 56], [60, 56], [56, 76], [32, 76]]), '#DDEAF2');
    ts(c, E(44, 56, 16, 5), '#FFF3DC', { off: 1 });
    line(c, [[44, 38], [44, 58]], 3);
    ts(c, E(44, 62, 5, 7), '#fff', { lw: 2 });
  },
  knife(c) {
    c.save();
    c.translate(50, 50);
    c.rotate(-0.7);
    ts(c, P([[-6, -36], [8, -36], [8, 8], [-6, 8], [-10, -20]]), '#EEF4F4');
    ts(c, R(-7, 8, 16, 30, 6), '#A8612E');
    for (const y of [16, 28]) ts(c, Ci(1, y, 2.4), '#FFE08A', { lw: 1.6, off: 0.5 });
    c.restore();
    for (const [x, y] of [[74, 24], [80, 36], [26, 74]]) cloud(c, [[x, y, 3]], '#FFE08A', { lw: 1.8 });
  },
  pot(c) {
    ts(c, R(22, 40, 56, 40, 14), '#E8893A');
    ts(c, E(50, 40, 28, 8), '#C96A2E', { off: 1.5 });
    ts(c, E(50, 40, 22, 5.5), '#F3C07A', { off: 1 });
    ts(c, R(10, 48, 14, 8, 4), '#E8893A', { lw: 2.4 });
    ts(c, R(76, 48, 14, 8, 4), '#E8893A', { lw: 2.4 });
    for (const x of [40, 50, 60]) tube(c, [[x, 30], [x - 3, 24], [x + 1, 16]], '#fff', 3.5, { lw: 1.8 });
  },
  freezer(c) {
    ts(c, R(18, 30, 64, 52, 12), '#AFD6EC');
    ts(c, R(14, 22, 72, 16, 8), '#86BADB');
    ts(c, R(40, 26, 20, 7, 3.5), '#FFF3DC', { lw: 2 });
    const flake = (x, y, r) => {
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI;
        line(c, [[x - Math.cos(a) * r, y - Math.sin(a) * r], [x + Math.cos(a) * r, y + Math.sin(a) * r]], 2.6, '#fff');
      }
    };
    flake(40, 58, 10);
    flake(64, 64, 7);
  },
  cushions(c) {
    ts(c, R(16, 54, 68, 26, 13), '#EE93A6');
    ts(c, R(22, 26, 56, 32, 14), '#F7B9C4');
    for (const [x, y] of [[36, 42], [64, 42], [36, 67], [64, 67]]) ts(c, Ci(x, y, 2.6), '#fff', { lw: 1.6, off: 0.5 });
    tube(c, [[44, 42], [56, 42]], '#fff', 2, { lw: 0 });
  },
  tipjar(c) {
    ts(c, R(26, 32, 48, 52, 14), '#E6F4F8');
    ts(c, R(30, 24, 40, 10, 4), '#A8612E');
    for (const [x, y] of [[40, 70], [56, 72], [48, 60], [60, 58]]) {
      ts(c, E(x, y, 8, 5), '#FFD86A', { off: 1, lw: 2 });
    }
    ts(c, R(34, 44, 32, 10, 5), '#FFF3DC', { lw: 2 });
    ts(c, E(50, 49, 8, 2), '#E8893A', { flat: true, lw: 0 });
  },
  shelves(c) {
    ts(c, R(18, 16, 64, 72, 8), '#D9A05B');
    for (const y of [38, 60]) ts(c, R(22, y, 56, 5, 2), '#A8612E', { lw: 2 });
    ts(c, R(26, 22, 14, 16, 4), '#EFE0C2', { lw: 2 });
    ts(c, R(44, 26, 12, 12, 3), '#F7B9C4', { lw: 2 });
    ts(c, R(60, 22, 12, 16, 4), '#FFE08A', { lw: 2 });
    ts(c, Ci(32, 54, 6), '#E4605E', { lw: 2 });
    ts(c, Ci(46, 54, 6), '#E4605E', { lw: 2 });
    ts(c, R(56, 46, 18, 14, 4), '#AFD6EC', { lw: 2 });
    ts(c, R(26, 68, 20, 16, 5), '#E6CC9C', { lw: 2 });
    ts(c, R(52, 70, 22, 14, 5), '#EE93A6', { lw: 2 });
  },
  sunflowers(c) {
    ts(c, P([[32, 60], [68, 60], [62, 88], [38, 88]]), '#E8893A');
    ts(c, R(28, 56, 44, 10, 4), '#F4A646', { lw: 2.4 });
    line(c, [[50, 56], [50, 36]], 4, '#7FA86A');
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      ts(c, E(50 + Math.cos(a) * 14, 30 + Math.sin(a) * 14, 7, 4.2, a), '#FFD84A', { lw: 2, off: 1 });
    }
    ts(c, Ci(50, 30, 9), '#8A5A3B', { off: 1.5 });
    ts(c, E(38, 48, 8, 4, -0.6), '#9DC25A', { lw: 2, off: 1 });
  },
  lanterns(c) {
    line(c, [[10, 16], [90, 20]], 2.4);
    const lan = (x, y, col, s) => {
      line(c, [[x, y - 14 * s], [x, y - 22 * s]], 2);
      ts(c, E(x, y, 16 * s, 14 * s), col);
      for (const k of [-8, 0, 8]) line(c, [[x + k * s, y - 12 * s], [x + k * s * 1.2, y + 12 * s]], 1.6, dk(col, 0.4));
      ts(c, R(x - 6 * s, y + 12 * s, 12 * s, 5 * s, 2), '#A8612E', { lw: 1.6 });
    };
    lan(30, 48, '#F7B9C4', 1);
    lan(68, 56, '#FFE08A', 1.2);
  },
  ferns(c) {
    line(c, [[50, 6], [34, 40]], 2);
    line(c, [[50, 6], [66, 40]], 2);
    ts(c, P([[28, 40], [72, 40], [64, 60], [36, 60]]), '#D9A05B');
    for (let i = 0; i < 7; i++) {
      const x = 30 + i * 7;
      const len = 18 + (i % 3) * 8;
      tube(c, [[x + 3, 50], [x - 2 + (i - 3) * 2, 60 + len * 0.6], [x + (i - 3) * 4, 60 + len]], i % 2 ? '#7FA86A' : '#9DC25A', 6, { lw: 1.8 });
    }
    ts(c, R(32, 38, 36, 6, 3), '#A8612E', { lw: 2 });
  },
  chalkboard(c) {
    line(c, [[34, 30], [22, 92]], 4, '#A8612E');
    line(c, [[66, 30], [78, 92]], 4, '#A8612E');
    ts(c, R(22, 14, 56, 50, 6), '#A8612E');
    ts(c, R(27, 19, 46, 40, 4), '#4F6B57', { off: 1.5 });
    line(c, [[34, 30], [66, 30]], 2.2, '#FFF3DC');
    line(c, [[36, 40], [58, 40]], 2.2, '#FFF3DC');
    cloud(c, [[56, 48, 5], [62, 46, 4]], '#F7B9C4', { lw: 1.6 });
  },
  catbed(c) {
    ts(c, E(50, 70, 36, 16), '#D9A05B');
    ts(c, E(50, 64, 30, 11), '#EE93A6', { off: 1.5 });
    ts(c, E(46, 58, 20, 12), '#F4A646');
    ts(c, Ci(66, 56, 10), '#F4A646');
    ts(c, P([[59, 50], [62, 40], [67, 48]]), '#F4A646', { lw: 2.2 });
    ts(c, P([[67, 47], [72, 40], [74, 50]]), '#F4A646', { lw: 2.2 });
    line(c, [[62, 57], [65, 58]], 2);
    line(c, [[69, 58], [72, 57]], 2);
    tube(c, [[28, 62], [22, 56], [30, 52]], '#F4A646', 5, { lw: 2 });
    for (const [x, y] of [[40, 52], [48, 54]]) line(c, [[x, y], [x + 3, y + 5]], 2, dk('#F4A646', 0.4));
    c.fillStyle = INK;
    c.font = '700 12px Fredoka, sans-serif';
    c.fillText('z', 80, 40);
    c.fillText('z', 86, 30);
  },
};

// the restaurant's upgrades and decor (its cushions/tip jar/shelves replace the bakery's art)
const B_PAINT = { cushions: PAINT.cushions, tipjar: PAINT.tipjar, shelves: PAINT.shelves };
Object.assign(PAINT, {
  waiter(c) {
    ts(c, Ci(50, 34, 16), '#F4A646');
    for (const sx of [-1, 1]) ts(c, P([[50 + sx * 10, 22], [50 + sx * 16, 10], [50 + sx * 4, 20]]), '#F4A646', { off: 1, lw: 2 });
    ts(c, P([[30, 88], [70, 88], [64, 52], [36, 52]]), '#3E5C76');
    ts(c, P([[44, 52], [56, 52], [50, 70]]), '#FFFBF0', { off: 1, lw: 2 });
    for (const sx of [-1, 1]) ts(c, E(50 + sx * 7, 54, 6, 3.5), '#C8384A', { off: 1, lw: 1.8 });
    ts(c, E(78, 50, 16, 4), '#C9D4D9', { off: 1.5 });
    ts(c, Ci(78, 44, 6), '#E4483E', { off: 1, lw: 1.8 });
  },
  runners(c) {
    for (const [x, y] of [[30, 50], [62, 50]]) {
      ts(c, P([[x - 14, y + 16], [x + 16, y + 16], [x + 14, y + 6], [x, y], [x - 12, y + 4]]), '#3E5C76');
      ts(c, R(x - 15, y + 15, 32, 6, 3), '#FFFBF0', { off: 1, lw: 2 });
    }
    for (const y of [36, 46, 56]) line(c, [[10, y], [22, y]], 3, '#86BADB');
  },
  cushions(c) {
    ts(c, R(22, 22, 56, 40, 12), '#B9384A');
    for (const x of [36, 50, 64]) ts(c, Ci(x, 42, 2.6), '#D9A441', { flat: true, lw: 1 });
    ts(c, R(18, 58, 64, 16, 8), '#C8485A');
    for (const x of [26, 70]) ts(c, R(x - 3, 72, 6, 16, 3), '#6E4A32', { lw: 2.2 });
  },
  tipjar(c) {
    ts(c, Ci(50, 30, 14), '#FFFBF0');
    ts(c, P([[30, 88], [70, 88], [66, 46], [34, 46]]), '#2E3A48');
    ts(c, P([[44, 46], [56, 46], [50, 62]]), '#FFFBF0', { off: 1, lw: 2 });
    ts(c, E(50, 48, 6, 3), '#2E3A48', { off: 1, lw: 1.6 });
    ts(c, Ci(78, 70, 9), '#FFC940', { lw: 2 });
    ts(c, Ci(84, 58, 7), '#FFC940', { lw: 2 });
  },
  shelves(c) {
    ts(c, R(16, 14, 68, 74, 6), '#3E5C76');
    ts(c, R(22, 20, 56, 62, 4), '#E9E2D2', { off: 1 });
    for (const y of [40, 60]) ts(c, R(22, y, 56, 4, 2), '#6E4A32', { off: 0.5, lw: 1.6 });
    for (const [x, y, col] of [[30, 30, '#E4483E'], [46, 30, '#F4D58A'], [62, 30, '#B9B23A'], [32, 50, '#FFE066'], [50, 50, '#D9A05B'], [66, 50, '#6E9F4E'], [38, 72, '#C9965A'], [58, 72, '#F6EEDC']]) ts(c, Ci(x, y, 6), col, { off: 1, lw: 1.8 });
  },
  candles(c) {
    for (const [x, h] of [[38, 40], [60, 30]]) {
      ts(c, R(x - 6, 80 - h, 12, h, 3), '#FFF6E4');
      ts(c, E(x, 78 - h - 6, 4, 8), '#FFC940', { off: 1, lw: 1.8 });
    }
    ts(c, E(50, 84, 30, 6), '#D9A441');
  },
  roses(c) {
    ts(c, P([[38, 88], [62, 88], [58, 58], [42, 58]]), '#AFD6EC', { gloss: [46, 70, 3] });
    for (const [x, y] of [[40, 38], [58, 34], [50, 48]]) {
      ts(c, Ci(x, y, 10), '#D8405A');
      tube(c, [[x - 4, y], [x, y - 4], [x + 4, y]], '#B9284A', 2, { lw: 1 });
    }
    for (const [x, y, r] of [[34, 52, -0.6], [66, 50, 0.6]]) { c.save(); c.translate(x, y); c.rotate(r); ts(c, E(0, 0, 8, 4), '#6E9F4E', { lw: 1.8 }); c.restore(); }
  },
  piano(c) {
    ts(c, P([[14, 46], [70, 30], [88, 44], [86, 62], [14, 62]]), '#2E2A30');
    ts(c, R(14, 58, 72, 10, 3), '#FFFBF0', { off: 1 });
    for (let i = 0; i < 9; i++) line(c, [[20 + i * 7.5, 58], [20 + i * 7.5, 68]], 1.4);
    for (const x of [22, 80]) ts(c, R(x - 3, 66, 6, 20, 3), '#2E2A30', { lw: 2 });
    tube(c, [[60, 22], [66, 14], [72, 20]], '#D9A441', 3, { lw: 1.4 });
  },
  chandelier(c) {
    line(c, [[50, 6], [50, 26]], 2.5);
    ts(c, E(50, 30, 24, 7), '#D9A441');
    for (const x of [30, 42, 58, 70]) {
      ts(c, R(x - 3, 32, 6, 14, 2), '#FFF6E4', { off: 0.5, lw: 1.6 });
      ts(c, E(x, 30, 3, 5), '#FFC940', { off: 0.5, lw: 1.4 });
    }
    for (const x of [34, 50, 66]) ts(c, P([[x, 48], [x + 5, 58], [x, 70], [x - 5, 58]]), '#E6F6FA', { off: 1, lw: 1.8 });
  },
});

const cache = new Map();
const R_ONLY = { cushions: true, tipjar: true, shelves: true };
export function shopIconURL(id) {
  if (!cache.has(id)) {
    const p = IS_RESTAURANT || !R_ONLY[id] ? PAINT[id] : B_PAINT[id];
    cache.set(id, p ? drawSticker(96, p, 3).toDataURL() : '');
  }
  return cache.get(id);
}
