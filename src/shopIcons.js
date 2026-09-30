// Flat sticker icons for the morning market's upgrades and decor.
import { INK, TAU, dk, E, Ci, R, P, ts, cloud, tube, line, drawSticker } from './sticker.js';

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

const cache = new Map();
export function shopIconURL(id) {
  if (!cache.has(id)) {
    const p = PAINT[id];
    cache.set(id, p ? drawSticker(96, p, 3).toDataURL() : '');
  }
  return cache.get(id);
}
