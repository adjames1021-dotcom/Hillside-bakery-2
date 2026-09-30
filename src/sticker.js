// Shared 2D "sticker" painter helpers: flat toon fills, a lit side toward the
// upper-left sun and even chocolate-brown ink lines. Everything draws in a 100x100 space.

export const INK = '#4B2E1D';
export const TAU = Math.PI * 2;
export const LW = 3;

export function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function mixHex(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  const r = A.map((v, i) => Math.round(v + (B[i] - v) * t));
  return '#' + r.map((v) => v.toString(16).padStart(2, '0')).join('');
}
export const dk = (c, t = 0.2) => mixHex(c, '#8A3E22', t);
export const lt = (c, t = 0.35) => mixHex(c, '#FFFBF0', t);

export function rng(seed) {
  let a = seed * 9301 + 49297;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// path builders
export const E = (x, y, rx, ry, rot = 0) => (c) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); };
export const Ci = (x, y, r) => E(x, y, r, r);
export const R = (x, y, w, h, r) => (c) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
export const P = (pts) => (c) => {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
};

/** Toon fill: shadow color, lit color shifted toward the upper-left sun, ink edge. */
export function ts(c, path, color, o = {}) {
  const off = o.off ?? 4;
  c.save();
  path(c);
  c.fillStyle = o.flat ? color : dk(color, o.shade ?? 0.16);
  c.fill();
  if (!o.flat) {
    c.clip();
    c.translate(-off, -off * 0.8);
    path(c);
    c.fillStyle = color;
    c.fill();
  }
  c.restore();
  if (o.gloss) {
    c.save();
    path(c);
    c.clip();
    c.fillStyle = 'rgba(255,251,240,0.75)';
    const [gx, gy, gr] = o.gloss;
    c.beginPath();
    c.ellipse(gx, gy, gr, gr * 0.55, -0.5, 0, TAU);
    c.fill();
    c.restore();
  }
  if (o.lw !== 0) {
    path(c);
    c.lineWidth = o.lw ?? LW;
    c.strokeStyle = INK;
    c.lineJoin = 'round';
    c.stroke();
  }
}

/** Union of circles with a single outer ink line (whipped cream, clouds, puffs). */
export function cloud(c, circles, color, o = {}) {
  const lw = o.lw ?? LW;
  c.save();
  c.strokeStyle = INK;
  c.lineWidth = lw * 2;
  for (const [x, y, r] of circles) {
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.stroke();
  }
  c.beginPath();
  for (const [x, y, r] of circles) {
    c.moveTo(x + r, y);
    c.arc(x, y, r, 0, TAU);
  }
  c.fillStyle = o.flat ? color : dk(color, o.shade ?? 0.1);
  c.fill();
  if (!o.flat) {
    c.clip();
    c.beginPath();
    for (const [x, y, r] of circles) {
      c.moveTo(x + r - 2.5, y - 2.2);
      c.arc(x - 2.5, y - 2.2, r, 0, TAU);
    }
    c.fillStyle = color;
    c.fill();
  }
  c.restore();
  if (o.colors) {
    // multi-colored cloud (cotton candy): refill each circle, then keep outer line
    circles.forEach(([x, y, r], i) => {
      c.beginPath();
      c.arc(x, y, r, 0, TAU);
      c.fillStyle = o.colors[i % o.colors.length];
      c.fill();
    });
  }
}

/** Ink tube stroke: outlined ribbon along a path (straws, drizzle, dough ribbons). */
export function tube(c, pts, color, w, o = {}) {
  const draw = () => {
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  };
  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';
  draw();
  c.strokeStyle = INK;
  c.lineWidth = w + (o.lw ?? LW) * 2 - 1;
  c.stroke();
  draw();
  c.strokeStyle = color;
  c.lineWidth = w;
  c.stroke();
  c.restore();
}

export function line(c, pts, lw = 2, color = INK) {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.lineWidth = lw;
  c.strokeStyle = color;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.stroke();
}

export function dots(c, rand, n, fx, color, r = 1.3) {
  c.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const [x, y] = fx(rand);
    c.beginPath();
    c.arc(x, y, r * (0.7 + rand() * 0.6), 0, TAU);
    c.fill();
  }
}
export const inEll = (x, y, rx, ry) => (rand) => {
  const a = rand() * TAU, d = Math.sqrt(rand());
  return [x + Math.cos(a) * rx * d, y + Math.sin(a) * ry * d];
};

export function sprinkles(c, rand, n, fx, colors = ['#EE93A6', '#86BADB', '#FFE08A', '#AFCB9C', '#F4A646']) {
  for (let i = 0; i < n; i++) {
    const [x, y] = fx(rand);
    c.save();
    c.translate(x, y);
    c.rotate(rand() * Math.PI);
    c.fillStyle = colors[i % colors.length];
    c.beginPath();
    c.roundRect(-2.6, -0.9, 5.2, 1.8, 0.9);
    c.fill();
    c.restore();
  }
}

export function plate(c, x = 50, y = 80, rx = 44, ry = 13, col = '#FFF3DC') {
  ts(c, E(x, y + 2.5, rx, ry), dk(col, 0.1), { flat: true });
  ts(c, E(x, y, rx, ry), col, { off: 2 });
  c.beginPath();
  c.ellipse(x, y - 0.5, rx * 0.72, ry * 0.62, 0, 0, TAU);
  c.lineWidth = 1.4;
  c.strokeStyle = mixHex(col, INK, 0.3);
  c.stroke();
}

export function steam(c, xs, y) {
  for (const x of xs) {
    const pts = [];
    for (let i = 0; i <= 10; i++) pts.push([x + Math.sin(i * 0.8) * 3, y - i * 2.2]);
    tube(c, pts, '#FFFBF0', 2.6, { lw: 1.6 });
  }
}

export function cherry(c, x, y, r = 5.5) {
  line(c, [[x, y - r + 1], [x + 3, y - r - 7], [x + 7, y - r - 9]], 2.2, '#6E8F4E');
  line(c, [[x, y - r + 1], [x + 3, y - r - 7], [x + 7, y - r - 9]], 1.1, '#9CC37A');
  ts(c, Ci(x, y, r), '#E4605E', { off: 2, gloss: [x - 1.8, y - 2, 2.2] });
}

export function strawberry(c, x, y, s = 1) {
  const p = (cc) => {
    cc.beginPath();
    cc.moveTo(x, y + 8 * s);
    cc.bezierCurveTo(x - 9 * s, y + 2 * s, x - 7 * s, y - 6 * s, x, y - 5 * s);
    cc.bezierCurveTo(x + 7 * s, y - 6 * s, x + 9 * s, y + 2 * s, x, y + 8 * s);
    cc.closePath();
  };
  ts(c, p, '#E4605E', { off: 2 });
  c.fillStyle = '#FFE08A';
  for (const [dx, dy] of [[-3, -1], [2, -2], [0, 2], [-2, 4], [3, 3]]) {
    c.beginPath();
    c.ellipse(x + dx * s, y + dy * s, 0.8, 1.2, 0, 0, TAU);
    c.fill();
  }
  ts(c, P([[x - 5 * s, y - 5 * s], [x, y - 8 * s], [x + 5 * s, y - 5 * s], [x, y - 3 * s]]), '#88AE7B', { off: 1, lw: 1.8 });
}

export function pecanHalf(c, x, y, rot = 0, s = 1) {
  ts(c, E(x, y, 5.5 * s, 3.3 * s, rot), '#95512A', { off: 1.5, lw: 2 });
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  line(c, [[-4 * s, 0], [4 * s, 0]], 1.2, '#5E3219');
  line(c, [[-2 * s, -1.8 * s], [-2 * s, 1.8 * s]], 1, '#5E3219');
  line(c, [[1.5 * s, -1.8 * s], [1.5 * s, 1.8 * s]], 1, '#5E3219');
  c.restore();
}

export function bananaSlice(c, x, y, r = 5) {
  ts(c, E(x, y, r, r * 0.75), '#FFF0B3', { off: 1.2, lw: 2 });
  c.fillStyle = '#C9A55B';
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU;
    c.beginPath();
    c.arc(x + Math.cos(a) * r * 0.3, y + Math.sin(a) * r * 0.22, 0.7, 0, TAU);
    c.fill();
  }
}

export function cylinder(c, x, yTop, rx, ry, h, side, top, o = {}) {
  const sidePath = (cc) => {
    cc.beginPath();
    cc.moveTo(x - rx, yTop);
    cc.lineTo(x - rx, yTop + h);
    cc.ellipse(x, yTop + h, rx, ry, 0, Math.PI, 0, true);
    cc.lineTo(x + rx, yTop);
    cc.closePath();
  };
  ts(c, sidePath, side, o);
  if (top) ts(c, E(x, yTop, rx, ry), top, { off: 3 });
}

export function prism(c, x, y, w, h, d, top, front, side, o = {}) {
  const dx = d * 0.75, dy = d * 0.5;
  const bands = Array.isArray(front) ? front : [[front, 1]];
  // front face bands
  let acc = 0;
  for (const [col, f] of bands) {
    const y0 = y + acc * h, y1 = y + (acc + f) * h;
    ts(c, R(x, y0, w, y1 - y0, 1.5), col, { off: 2, lw: 0 });
    acc += f;
  }
  const sideBands = o.sideBands || bands;
  acc = 0;
  for (const [col, f] of sideBands) {
    const y0 = y + acc * h, y1 = y + (acc + f) * h;
    ts(c, P([[x + w, y0], [x + w + dx, y0 - dy], [x + w + dx, y1 - dy], [x + w, y1]]), dk(side || col, 0.12), { flat: true, lw: 0 });
    acc += f;
  }
  ts(c, P([[x, y], [x + w, y], [x + w + dx, y - dy], [x + dx, y - dy]]), top, { off: 2, lw: 0 });
  // outline of the whole block
  const outline = P([[x, y], [x + dx, y - dy], [x + w + dx, y - dy], [x + w + dx, y + h - dy], [x + w, y + h], [x, y + h]]);
  outline(c);
  c.lineWidth = o.lw ?? LW;
  c.strokeStyle = INK;
  c.lineJoin = 'round';
  c.stroke();
  line(c, [[x, y], [x + w, y], [x + w + dx, y - dy]], 1.6);
  line(c, [[x + w, y], [x + w, y + h]], 1.6);
  return { topPath: P([[x, y], [x + w, y], [x + w + dx, y - dy], [x + dx, y - dy]]) };
}

export function glassBowl(c, x, y, w) {
  const glass = '#DDF0F6';
  ts(c, E(x, 88, 14, 4.5), glass, { off: 1 });
  ts(c, R(x - 3, 74, 6, 14, 2), glass, { off: 1, lw: 2.4 });
  const bowl = (cc) => {
    cc.beginPath();
    cc.moveTo(x - w, y);
    cc.bezierCurveTo(x - w, y + 18, x - 10, y + 26, x, y + 26);
    cc.bezierCurveTo(x + 10, y + 26, x + w, y + 18, x + w, y);
    cc.closePath();
  };
  ts(c, bowl, glass, { off: 3, gloss: [x - w * 0.55, y + 8, 4] });
}

export function scoop(c, x, y, r, col) {
  const p = (cc) => {
    cc.beginPath();
    cc.arc(x, y, r, Math.PI * 0.95, Math.PI * 0.05);
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      const px = x + r - t * 2 * r;
      cc.lineTo(px, y + r * 0.35 + (i % 2 ? r * 0.18 : 0));
    }
    cc.closePath();
  };
  ts(c, p, col, { off: 2.5 });
}

/** Paint a sticker into a fresh canvas (with a little breathing room for outlines). */
export function drawSticker(size, draw, seed = 1) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.scale(size / 100, size / 100);
  ctx.translate(50, 50);
  ctx.scale(0.92, 0.92);
  ctx.translate(-50, -50);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  draw(ctx, rng(seed));
  return c;
}
