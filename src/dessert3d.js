// Chunky clay-miniature 3D desserts, built procedurally from ~30 templates.
// Each dessert can be shown "bare" (before its decorating step), "raw" (before
// baking/cooking) or "burnt" (left in the oven too long), so the treat you carry
// changes as you work through its recipe.
import * as THREE from 'three';
import { G, C, mk, toon, canvasTex } from './toon.js';
import { mergeStatic } from './merge.js';
import { mixHex, rng } from './sticker.js';

const TAU = Math.PI * 2;
const V = (x, y) => new THREE.Vector2(x, y);
const SPR = ['#EE93A6', '#86BADB', '#FFE08A', '#AFCB9C', '#F4A646'];

const add = (parent, m, x = 0, y = 0, z = 0) => { m.position.set(x, y, z); parent.add(m); return m; };
const part = (geo, color, outline = 'mid') => mk(geo, color, { outline, cast: false, receive: true });

const localGeo = new Map();
const geo = (key, fn) => { if (!localGeo.has(key)) localGeo.set(key, fn()); return localGeo.get(key); };

// ------------------------------------------------------------------ shared bits

function plate(g, r = 0.17, col = C.cream2) {
  const pts = [V(0.0005, 0), V(r * 0.68, 0), V(r * 0.9, 0.012), V(r, 0.026), V(r * 0.97, 0.031), V(r * 0.84, 0.018), V(r * 0.66, 0.012), V(0.0005, 0.012)];
  return add(g, part(G.lathe(pts, 32), col, 'mid'));
}

function board(g, w = 0.3, d = 0.18) {
  return add(g, part(G.box(w, 0.02, d, 0.008), C.honeyLight, 'thin'), 0, 0.01, 0);
}

function waxPaper(g, w = 0.26, d = 0.2) {
  return add(g, part(G.box(w, 0.004, d, 0.002), '#FFFBF0', 'thin'), 0, 0.002, 0);
}

function swirlGeo(r, h) {
  return geo(`sw${r},${h}`, () => {
    const pts = [V(0.0005, 0)];
    for (let i = 0; i < 3; i++) {
      const t0 = i / 3, t1 = (i + 1) / 3;
      const rr = r * (1 - t0 * 0.7);
      pts.push(V(rr * 0.92, h * t0));
      pts.push(V(rr, h * (t0 + 0.1)));
      pts.push(V(rr * 0.72, h * (t1 - 0.03)));
    }
    pts.push(V(r * 0.1, h * 0.97));
    pts.push(V(0.0005, h));
    return new THREE.LatheGeometry(pts, 16);
  });
}
const swirl = (g, r, h, col, x = 0, y = 0, z = 0) => add(g, part(swirlGeo(r, h), col, 'thin'), x, y, z);

function cherry(g, x, y, z, r = 0.02) {
  add(g, part(G.sphere(r, 12, 10), '#E4605E', 'thin'), x, y + r * 0.9, z);
  const st = add(g, part(G.capsule(0.003, r * 1.3), '#6E8F4E', false), x + r * 0.35, y + r * 2.3, z);
  st.rotation.z = -0.45;
}

function berry(g, x, y, z, s = 1) {
  const pts = [V(0.0005, 0), V(0.01, 0.004), V(0.02, 0.018), V(0.024, 0.03), V(0.021, 0.04), V(0.0005, 0.043)].map((p) => V(p.x * s, p.y * s));
  const b = add(g, part(G.lathe(pts, 12), '#E4605E', 'thin'), x, y, z);
  const cap = add(g, part(G.cyl(0.018 * s, 0.014 * s, 0.008 * s, 0.003, 8), C.sageDark, false), x, y + 0.043 * s, z);
  b.rotation.x = cap.rotation.x = 0;
}

function sprinkles(g, rand, n, cx, cy, cz, rx, rz, yFn) {
  for (let i = 0; i < n; i++) {
    const a = rand() * TAU, d = Math.sqrt(rand());
    const x = cx + Math.cos(a) * rx * d, z = cz + Math.sin(a) * rz * d;
    const s = part(G.capsule(0.0032, 0.009), SPR[i % SPR.length], false);
    s.position.set(x, yFn ? yFn(x, z, d) : cy, z);
    s.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    g.add(s);
  }
}

function dotsOn(g, rand, n, cx, cy, cz, rx, rz, col, r = 0.004, yFn) {
  for (let i = 0; i < n; i++) {
    const a = rand() * TAU, d = Math.sqrt(rand());
    const x = cx + Math.cos(a) * rx * d, z = cz + Math.sin(a) * rz * d;
    add(g, part(G.sphere(r, 6, 4), col, false), x, yFn ? yFn(x, z, d) : cy, z);
  }
}

const stripeCache = new Map();
function stripeMat(col, n = 10) {
  const key = col + n;
  if (!stripeCache.has(key)) {
    const tex = canvasTex(128, 16, (ctx) => {
      ctx.fillStyle = '#FFFBF0';
      ctx.fillRect(0, 0, 128, 16);
      ctx.fillStyle = col;
      ctx.fillRect(0, 0, 64, 16);
    }, [n, 1]);
    stripeCache.set(key, toon('#fff', { map: tex }));
  }
  return stripeCache.get(key);
}

function wedgeGeo(R, h, ang) {
  return geo(`wd${R},${h},${ang}`, () => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(R, 0);
    s.absarc(0, 0, R, 0, ang, false);
    s.lineTo(0, 0);
    const bev = Math.min(0.004, h * 0.3);
    const g = new THREE.ExtrudeGeometry(s, {
      depth: Math.max(0.0005, h - bev * 2), bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 12,
    });
    g.rotateX(-Math.PI / 2);
    g.translate(0, bev, 0);
    return g;
  });
}

function lumpyGeo(r, seed, detail = 2) {
  return geo(`lp${r},${seed}`, () => {
    const g = new THREE.IcosahedronGeometry(r, detail);
    const p = g.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const k = 1 + 0.12 * Math.sin(v.x * 71 + seed) + 0.1 * Math.cos(v.z * 83 + seed * 2) + 0.06 * Math.sin(v.y * 97 + seed * 3);
      v.multiplyScalar(k);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  });
}

// ------------------------------------------------------------------ templates

const T = {};

T.pie = (g, p, { P, bare, rand }) => {
  const crust = p.crust || '#E9A95A';
  plate(g, 0.19);
  add(g, part(G.cyl(0.155, 0.125, 0.05, 0.016, 32), P(crust)), 0, 0.037, 0);
  const rimC = P(p.edge || crust);
  const rim = add(g, part(G.torus(0.14, 0.019, TAU, 32), rimC), 0, 0.064, 0);
  rim.rotation.x = Math.PI / 2;
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * TAU;
    add(g, part(G.sphere(0.021, 8, 6), rimC, 'thin'), Math.cos(a) * 0.14, 0.068, Math.sin(a) * 0.14);
  }
  add(g, part(G.cyl(0.126, 0.126, 0.014, 0.005, 32), P(p.fill), false), 0, 0.06, 0);
  const top = 0.067;
  if (p.bits) dotsOn(g, rand, 10, 0, top, 0, 0.1, 0.1, P(p.bits), 0.011);
  if (p.lattice) {
    for (const off of [-0.075, -0.025, 0.025, 0.075]) {
      const len = 2 * Math.sqrt(0.132 * 0.132 - off * off);
      add(g, part(G.box(len, 0.01, 0.022, 0.005), P(crust), 'thin'), 0, top + 0.004, off);
      add(g, part(G.box(0.022, 0.01, len, 0.005), P(crust), 'thin'), off, top + 0.008, 0);
    }
    if (p.sugar) dotsOn(g, rand, 30, 0, top + 0.014, 0, 0.11, 0.11, '#FFFBF0', 0.0035);
  }
  if (p.ooze) for (const a of [0.6, 2.2, 4.1]) add(g, part(G.sphere(0.016, 8, 6), P(p.fill), 'thin'), Math.cos(a) * 0.15, 0.058, Math.sin(a) * 0.15);
  if (p.pecans) {
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU;
      const n = add(g, part(G.sphere(0.022, 10, 8), P('#8B4A22'), 'thin'), Math.cos(a) * 0.085, top + 0.004, Math.sin(a) * 0.085);
      n.scale.set(1.4, 0.45, 0.8);
      n.rotation.y = -a;
    }
    const c = add(g, part(G.sphere(0.024, 10, 8), P('#8B4A22'), 'thin'), 0, top + 0.004, 0);
    c.scale.set(1.4, 0.45, 0.8);
  }
  if (p.top === 'mound' && (bare || p.bananas)) {
    if (p.bananas) for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.3;
      add(g, part(G.cyl(0.02, 0.02, 0.008, 0.003, 12), P('#FFF0B3'), 'thin'), Math.cos(a) * 0.07, top + 0.003, Math.sin(a) * 0.07);
    }
  }
  if (bare) return;
  if (p.top === 'rosettes') {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      swirl(g, 0.018, 0.028, '#FFFBF0', Math.cos(a) * 0.1, top, Math.sin(a) * 0.1);
    }
    const lime = add(g, part(G.cyl(0.035, 0.035, 0.008, 0.003, 18), '#9DC25A', 'thin'), 0, top + 0.025, 0);
    lime.rotation.x = 1.2;
    add(lime, part(G.cyl(0.03, 0.03, 0.009, 0.002, 18), '#E6F2A8', false));
  }
  if (p.top === 'dollop') {
    swirl(g, 0.045, 0.06, '#FFFBF0', 0, top, 0);
    dotsOn(g, rand, 10, 0, top + 0.03, 0, 0.03, 0.03, '#B8743C', 0.003);
  }
  if (p.top === 'mound') {
    const dome = add(g, part(G.sphere(0.115, 24, 14), '#FFFBF0', 'mid'), 0, top, 0);
    dome.scale.y = 0.5;
    for (let i = 0; i < 5; i++) swirl(g, 0.018, 0.026, '#FFFBF0', Math.cos(i * 1.25) * 0.06, top + 0.035, Math.sin(i * 1.25) * 0.06);
    if (p.bananas) for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      const s = add(g, part(G.cyl(0.02, 0.02, 0.008, 0.003, 12), '#FFF0B3', 'thin'), Math.cos(a) * 0.045, top + 0.052, Math.sin(a) * 0.045);
      s.rotation.set(rand() * 0.5, 0, rand() * 0.5);
    }
    if (p.shavings) for (let i = 0; i < 10; i++) {
      const s = add(g, part(G.box(0.024, 0.006, 0.01, 0.003), '#5A3422', false), (rand() - 0.5) * 0.12, top + 0.055, (rand() - 0.5) * 0.12);
      s.rotation.set(rand(), rand() * 3, rand());
    }
  }
};

T.skillet = (g, p, { P, rand }) => {
  const iron = '#6E4A3A';
  board(g, 0.36, 0.3);
  add(g, part(G.cyl(0.16, 0.14, 0.055, 0.015, 32), iron), 0, 0.048, 0);
  add(g, part(G.box(0.14, 0.028, 0.04, 0.012), iron), 0.21, 0.064, 0);
  add(g, part(G.cyl(0.14, 0.14, 0.012, 0.004, 32), P(p.fill), false), 0, 0.07, 0);
  dotsOn(g, rand, 8, 0, 0.077, 0, 0.12, 0.12, P('#FFD9A0'), 0.008);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU + 0.2, r = i === 6 ? 0 : 0.08;
    const b = add(g, part(lumpyGeo(0.034, i), P(p.top), 'thin'), Math.cos(a) * r, 0.082, Math.sin(a) * r);
    b.scale.y = 0.55;
  }
};

T.dish = (g, p, { P, bare, rand }) => {
  add(g, part(G.box(0.34, 0.07, 0.24, 0.03), p.dish), 0, 0.035, 0);
  add(g, part(G.box(0.36, 0.02, 0.26, 0.01), mixHex(p.dish, '#FFFBF0', 0.35), 'thin'), 0, 0.072, 0);
  add(g, part(G.box(0.3, 0.02, 0.2, 0.008), P(p.fill), false), 0, 0.074, 0);
  if (p.crumbs) {
    dotsOn(g, rand, 45, 0, 0.086, 0, 0.14, 0.09, P('#F3D9A0'), 0.008);
    dotsOn(g, rand, 30, 0, 0.087, 0, 0.14, 0.09, P('#A8612E'), 0.006);
  }
  if (p.cubes) {
    for (let i = 0; i < 12; i++) {
      const c = add(g, part(G.box(0.045, 0.035, 0.045, 0.01), P('#E0A050'), 'thin'), -0.11 + (i % 4) * 0.073, 0.092, -0.06 + Math.floor(i / 4) * 0.06);
      c.rotation.set((rand() - 0.5) * 0.4, rand(), (rand() - 0.5) * 0.4);
    }
  }
  if (p.caramel && !bare) {
    const pts = [];
    for (let i = 0; i <= 24; i++) pts.push(new THREE.Vector3(-0.13 + i * 0.011, 0.115, Math.sin(i * 1.3) * 0.07));
    add(g, part(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.006, 6), '#C0692E', false));
  }
};

T.slice = (g, p, { P, bare, rand }) => {
  plate(g, 0.16);
  const R = 0.15, ang = 0.8;
  const root = new THREE.Group();
  root.position.set(-R * 0.42, 0.012, R * 0.28);
  g.add(root);
  let y = 0;
  for (const [col, h] of p.layers) {
    add(root, part(wedgeGeo(R, h, ang), P(col), 'mid'), 0, y, 0);
    y += h;
  }
  const topCol = bare ? p.top : (p.decoTop || p.top);
  add(root, part(wedgeGeo(R, 0.012, ang), P(topCol), 'mid'), 0, y, 0);
  const H = y + 0.012;
  const shellCol = bare ? p.shell : (p.decoShell || p.shell);
  if (shellCol) {
    add(root, part(new THREE.CylinderGeometry(R + 0.004, R + 0.004, H, 16, 1, true, Math.PI / 2, ang), P(shellCol), 'thin'), 0, H / 2, 0);
  }
  const at = (u, v) => { const a = ang * v, r = R * u; return [Math.cos(a) * r, H, -Math.sin(a) * r]; };
  if (p.coconut) for (let i = 0; i < 18; i++) add(root, part(G.sphere(0.004, 6, 4), '#FFFBF0', false), ...at(0.3 + rand() * 0.6, 0.15 + rand() * 0.7));
  if (bare) return;
  if (p.strawberries) for (const [u, v] of [[0.45, 0.5], [0.72, 0.28], [0.72, 0.72]]) berry(root, ...at(u, v), 1.1);
  if (p.drip) {
    for (let i = 0; i < 6; i++) {
      const x = 0.025 + i * 0.022, len = 0.012 + ((i * 7) % 5) * 0.006;
      add(root, part(G.capsule(0.006, len), P(p.drip), 'thin'), x, H - len / 2 - 0.004, 0.005);
    }
  }
  if (p.nuts) for (let i = 0; i < 6; i++) {
    const n = add(root, part(G.sphere(0.011, 8, 6), '#B87A45', 'thin'), ...at(0.35 + rand() * 0.5, 0.2 + rand() * 0.6));
    n.scale.set(1.3, 0.6, 0.9);
  }
  if (p.crumbs) for (let i = 0; i < 14; i++) add(root, part(G.sphere(0.004, 6, 4), P(p.crumbs), false), ...at(0.3 + rand() * 0.6, 0.15 + rand() * 0.7));
  if (p.rosette !== false && (p.decoTop || p.decoShell)) swirl(root, 0.018, 0.028, P(p.decoTop || p.decoShell), ...at(0.82, 0.5));
};

T.cupcake = (g, p, { P, bare, rand }) => {
  plate(g, 0.12);
  add(g, part(G.cyl(0.07, 0.055, 0.075, 0.008, 24), stripeMat(p.liner || C.pink), 'mid'), 0, 0.05, 0);
  const dome = add(g, part(G.sphere(0.074, 20, 12), P('#E4A55A'), 'mid'), 0, 0.088, 0);
  dome.scale.y = 0.55;
  if (bare) return;
  swirl(g, 0.072, 0.1, p.frost || '#FFF3DC', 0, 0.1, 0);
  sprinkles(g, rand, 22, 0, 0, 0, 0.06, 0.06, (x, z, d) => 0.1 + (1 - d) * 0.07 + 0.012);
  if (p.cherry) cherry(g, 0, 0.198, 0, 0.018);
};

T.roundCake = (g, p, { P }) => {
  plate(g, 0.18);
  add(g, part(G.cyl(0.15, 0.15, 0.06, 0.012, 32), P('#F0C56A')), 0, 0.042, 0);
  add(g, part(G.cyl(0.148, 0.148, 0.012, 0.004, 32), P('#E39A3C'), false), 0, 0.072, 0);
  const spots = [[0, 0], ...[0, 1, 2, 3, 4].map((i) => [Math.cos((i / 5) * TAU) * 0.09, Math.sin((i / 5) * TAU) * 0.09])];
  for (const [x, z] of spots) {
    const ring = add(g, part(G.torus(0.032, 0.011, TAU, 20), P('#FFE27A'), 'thin'), x, 0.08, z);
    ring.rotation.x = Math.PI / 2;
    ring.scale.z = 0.55;
    add(g, part(G.sphere(0.012, 10, 8), P('#D8404E'), 'thin'), x, 0.083, z);
  }
};

T.ringCake = (g, p, { P, bare, rand }) => {
  plate(g, 0.17);
  const pts = [V(0.04, 0), V(0.125, 0), V(0.135, 0.012), V(0.137, 0.1), V(0.128, 0.118), V(0.1, 0.126), V(0.06, 0.123), V(0.043, 0.113), V(0.037, 0.1), V(0.037, 0.012), V(0.04, 0)];
  add(g, part(G.lathe(pts, 32), P('#E4AC62')), 0, 0.012, 0);
  const crown = add(g, part(G.torus(0.085, 0.022, TAU, 32), P('#F3D08A'), 'thin'), 0, 0.128, 0);
  crown.rotation.x = Math.PI / 2;
  crown.scale.z = 0.45;
  if (bare) return;
  for (let i = 0; i < 60; i++) {
    const a = rand() * TAU, r = 0.05 + rand() * 0.07;
    add(g, part(G.sphere(0.0035, 6, 4), '#FFFFFF', false), Math.cos(a) * r, 0.14, Math.sin(a) * r);
  }
};

T.loaf = (g, p, { P, bare }) => {
  board(g, 0.34, 0.18);
  add(g, part(G.box(0.22, 0.09, 0.11, 0.03), P('#E3A052')), -0.04, 0.065, 0);
  add(g, part(G.box(0.19, 0.022, 0.05, 0.01), P('#D98E42'), 'thin'), -0.04, 0.11, 0);
  const sl = new THREE.Group();
  sl.position.set(0.1, 0.066, 0.01);
  sl.rotation.z = -0.35;
  g.add(sl);
  add(sl, part(G.box(0.022, 0.09, 0.11, 0.01), P('#D98E42'), 'thin'));
  add(sl, part(G.box(0.024, 0.074, 0.094, 0.008), P('#FBE3A2'), false));
  if (bare) return;
  add(g, part(G.box(0.2, 0.012, 0.09, 0.005), '#FFF6E6', 'thin'), -0.04, 0.12, 0);
  for (const [x, z, l] of [[-0.12, 0.05, 0.03], [-0.06, 0.052, 0.045], [0.0, 0.05, 0.028], [-0.1, -0.05, 0.035], [0.02, -0.05, 0.03]]) {
    add(g, part(G.capsule(0.007, l), '#FFF6E6', 'thin'), x, 0.11 - l / 2, z);
  }
};

T.shortcake = (g, p, { P, bare }) => {
  plate(g, 0.15);
  add(g, part(G.cyl(0.085, 0.08, 0.045, 0.015, 24), P('#EDB86A')), 0, 0.035, 0);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    add(g, part(G.sphere(0.024, 10, 8), '#FFFBF0', 'thin'), Math.cos(a) * 0.062, 0.066, Math.sin(a) * 0.062);
  }
  for (const a of [0.4, 2.0, 3.6, 5.2]) berry(g, Math.cos(a) * 0.07, 0.05, Math.sin(a) * 0.07, 1.0);
  const top = add(g, part(G.sphere(0.086, 24, 12), P('#EDB86A')), 0, 0.083, 0);
  top.scale.y = 0.5;
  if (bare) return;
  swirl(g, 0.042, 0.05, '#FFFBF0', 0, 0.118, 0);
  berry(g, 0.004, 0.158, 0, 1.2);
};

T.whoopie = (g, p, { P }) => {
  plate(g, 0.15);
  const sandwich = (x, y, z, rz, s) => {
    const w = new THREE.Group();
    w.position.set(x, y, z);
    w.rotation.z = rz;
    w.scale.setScalar(s);
    g.add(w);
    const bot = add(w, part(G.sphere(0.06, 20, 12), P('#5A3422')), 0, 0.02, 0);
    bot.scale.y = 0.36;
    add(w, part(G.cyl(0.056, 0.056, 0.024, 0.01, 20), '#FFFBF0', 'thin'), 0, 0.04, 0);
    const topp = add(w, part(G.sphere(0.06, 20, 12), P('#6A4029')), 0, 0.057, 0);
    topp.scale.y = 0.45;
  };
  sandwich(-0.04, 0.012, 0.03, 0, 1);
  sandwich(0.055, 0.03, -0.035, 0.45, 0.9);
};

T.cookies = (g, p, { P, bare, rand }) => {
  plate(g, 0.16);
  const icings = ['#F7B9C4', '#AFD6EC', '#FFE08A'];
  const cookie = (x, y, z, rx, rz, i) => {
    const c = new THREE.Group();
    c.position.set(x, y, z);
    c.rotation.set(rx, rand() * 3, rz);
    g.add(c);
    const r = 0.065;
    add(c, part(G.cyl(r, r * 0.97, 0.022, 0.009, 22), P(p.base)), 0, 0.011, 0);
    const top = 0.022;
    if (p.style === 'chips') for (let k = 0; k < 7; k++) {
      const a = rand() * TAU, d = Math.sqrt(rand()) * r * 0.75;
      add(c, part(G.sphere(0.008, 8, 6), '#5A3422', false), Math.cos(a) * d, top, Math.sin(a) * d);
    }
    if (p.style === 'cracks') {
      for (let k = 0; k < 5; k++) {
        const cr = add(c, part(G.box(0.03, 0.003, 0.004, 0.001), P('#B98049'), false), (rand() - 0.5) * 0.07, top + 0.001, (rand() - 0.5) * 0.07);
        cr.rotation.y = rand() * 3;
      }
      dotsOn(c, rand, 18, 0, top + 0.001, 0, r * 0.85, r * 0.85, '#B06A33', 0.0025);
    }
    if (p.style === 'oats') {
      dotsOn(c, rand, 6, 0, top, 0, r * 0.75, r * 0.75, '#6E3A3A', 0.008);
      dotsOn(c, rand, 10, 0, top + 0.001, 0, r * 0.8, r * 0.8, '#FFF0C8', 0.005);
    }
    if (p.style === 'fork') {
      for (const d of [-0.025, 0, 0.025]) {
        add(c, part(G.box(0.1, 0.003, 0.006, 0.002), P('#B98049'), false), 0, top + 0.001, d).rotation.y = 0.78;
        add(c, part(G.box(0.1, 0.003, 0.006, 0.002), P('#B98049'), false), 0, top + 0.001, d).rotation.y = -0.78;
      }
    }
    if (p.style === 'icing' && !bare) {
      add(c, part(G.cyl(r * 0.82, r * 0.82, 0.006, 0.003, 22), icings[i % 3], 'thin'), 0, top + 0.002, 0);
      sprinkles(c, rand, 8, 0, top + 0.006, 0, r * 0.6, r * 0.6);
    }
  };
  cookie(-0.05, 0.012, 0.035, 0, 0, 0);
  cookie(0.055, 0.012, 0.03, 0, 0, 1);
  cookie(0.0, 0.03, -0.035, 0.25, 0.1, 2);
};

T.bars = (g, p, { P, bare, rand }) => {
  if (p.style === 'fudge' || p.style === 'krispies') waxPaper(g);
  else plate(g, 0.16);
  const base = p.style === 'fudge' || p.style === 'krispies' ? 0.004 : 0.012;
  const bar = (x, y, z, ry) => {
    const b = new THREE.Group();
    b.position.set(x, y, z);
    b.rotation.y = ry;
    g.add(b);
    if (p.style === 'brownie') {
      add(b, part(G.box(0.085, 0.045, 0.085, 0.01), P('#5A3422')), 0, 0.0225, 0);
      add(b, part(G.box(0.078, 0.006, 0.078, 0.003), P('#7B4A30'), false), 0, 0.046, 0);
    } else if (p.style === 'lemon') {
      add(b, part(G.box(0.085, 0.02, 0.085, 0.008), P('#EFC984')), 0, 0.01, 0);
      add(b, part(G.box(0.085, 0.024, 0.085, 0.008), P('#FFE066')), 0, 0.032, 0);
      if (!bare) dotsOn(b, rand, 20, 0, 0.045, 0, 0.04, 0.04, '#FFFFFF', 0.0035);
    } else if (p.style === 'krispies') {
      add(b, part(G.box(0.09, 0.04, 0.09, 0.012), P('#F0D08E')), 0, 0.02, 0);
      dotsOn(b, rand, 22, 0, 0.041, 0, 0.042, 0.042, P('#FFF3DC'), 0.005);
      dotsOn(b, rand, 10, 0, 0.041, 0, 0.042, 0.042, P('#C9994F'), 0.004);
    } else {
      add(b, part(G.box(0.08, 0.04, 0.08, 0.01), P('#6A3B25')), 0, 0.02, 0);
      add(b, part(G.box(0.05, 0.003, 0.012, 0.0015), '#A87458', false), -0.01, 0.041, -0.02);
    }
  };
  bar(-0.05, base, 0.035, 0.1);
  bar(0.055, base, 0.025, -0.2);
  bar(0.005, base + 0.045, -0.02, 0.35);
};

T.donuts = (g, p, { P, bare, rand }) => {
  plate(g, 0.16);
  const donut = (x, y, z, rz, glazeCol) => {
    const d = new THREE.Group();
    d.position.set(x, y, z);
    d.rotation.z = rz;
    g.add(d);
    const body = add(d, part(G.torus(0.048, 0.029, TAU, 24), P('#E8A45A')), 0, 0.022, 0);
    body.rotation.x = Math.PI / 2;
    body.scale.z = 0.75;
    if (bare) return;
    const gl = add(d, part(G.torus(0.048, 0.03, TAU, 24), glazeCol, 'thin'), 0, 0.03, 0);
    gl.rotation.x = Math.PI / 2;
    gl.scale.z = 0.55;
    sprinkles(d, rand, 12, 0, 0, 0, 0.07, 0.07, () => 0.042);
  };
  donut(-0.04, 0.012, 0.035, 0, '#FFF3DC');
  donut(0.045, 0.045, -0.03, 0.5, '#F7B9C4');
};

T.roll = (g, p, { P, bare }) => {
  plate(g, 0.15);
  const spiral = (off, rr, y) => {
    const pts = [];
    for (let i = 0; i <= 90; i++) {
      const t = i / 90, a = t * TAU * 2.6 + off, r = 0.012 + t * 0.07;
      pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 140, rr, 8);
  };
  add(g, part(spiral(0, 0.026, 0.038), P('#E8A962'), 'mid'));
  add(g, part(spiral(Math.PI, 0.012, 0.052), P('#A8612E'), false));
  if (bare) return;
  const ice = add(g, part(G.sphere(0.055, 20, 12), '#FFFBF0', 'thin'), 0, 0.066, 0);
  ice.scale.set(1.1, 0.3, 1.05);
  for (const a of [0.3, 1.9, 3.4, 5.0]) add(g, part(G.capsule(0.008, 0.02), '#FFFBF0', 'thin'), Math.cos(a) * 0.058, 0.058, Math.sin(a) * 0.058);
};

T.funnel = (g, p, { P, bare, rand }) => {
  plate(g, 0.18, C.blue);
  for (let k = 0; k < 4; k++) {
    const pts = [];
    let x = -0.1, z = -0.06 + k * 0.04;
    for (let i = 0; i < 44; i++) {
      const a = i * 0.9 + k;
      pts.push(new THREE.Vector3(x + Math.cos(a) * 0.028, 0.03 + (i % 5) * 0.002, z + Math.sin(a) * 0.022));
      x += 0.0048;
      z += Math.sin(i * 0.4 + k) * 0.004;
    }
    add(g, part(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.011, 6), P('#E4A558'), 'thin'));
  }
  if (bare) return;
  dotsOn(g, rand, 120, 0, 0.045, 0, 0.11, 0.08, '#FFFFFF', 0.004);
  for (const [x, z] of [[-0.02, 0], [0.04, 0.03], [0.02, -0.03]]) {
    const pile = add(g, part(G.sphere(0.022, 10, 8), '#FFFFFF', 'thin'), x, 0.045, z);
    pile.scale.y = 0.5;
  }
};

T.fritter = (g, p, { P, bare, rand }) => {
  plate(g, 0.16);
  for (const [x, y, z, s, seed] of [[-0.035, 0.036, 0.025, 1, 1], [0.055, 0.05, -0.035, 0.8, 2]]) {
    const f = add(g, part(lumpyGeo(0.072, seed), P('#D99447')), x, y, z);
    f.scale.set(s, s * 0.5, s);
    for (let i = 0; i < 5; i++) {
      const a = rand() * TAU, d = rand() * 0.045 * s;
      const c = add(g, part(G.box(0.014, 0.01, 0.012, 0.003), P('#F7E6A8'), false), x + Math.cos(a) * d, y + 0.03 * s, z + Math.sin(a) * d);
      c.rotation.y = rand() * 3;
    }
    if (!bare) for (let i = 0; i < 3; i++) {
      const pts = [];
      for (let j = 0; j <= 6; j++) pts.push(new THREE.Vector3(x - 0.05 * s + j * 0.017 * s, y + 0.034 * s, z - 0.02 + i * 0.02 + Math.sin(j) * 0.006));
      add(g, part(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.004, 5), '#FFFBF0', false));
    }
  }
};

T.muffin = (g, p, { P, rand }) => {
  plate(g, 0.12);
  add(g, part(G.cyl(0.07, 0.055, 0.08, 0.008, 24), stripeMat(C.blueDeep), 'mid'), 0, 0.052, 0);
  const dome = add(g, part(G.sphere(0.085, 22, 14), P('#E4A55A')), 0, 0.1, 0);
  dome.scale.y = 0.72;
  for (let i = 0; i < 8; i++) {
    const a = rand() * TAU, t = 0.25 + rand() * 0.6;
    const r = Math.sin(t * 1.4) * 0.08, y = 0.1 + Math.cos(t * 1.4) * 0.061;
    add(g, part(G.sphere(0.011, 8, 6), P('#6D63B5'), false), Math.cos(a) * r, y, Math.sin(a) * r);
  }
  dotsOn(g, rand, 24, 0, 0, 0, 0.06, 0.06, '#FFFBF0', 0.003, (x, z, d) => 0.1 + (1 - d * d) * 0.06);
};

T.beignets = (g, p, { P, bare, rand }) => {
  plate(g, 0.16);
  for (const [x, z, ry, y] of [[-0.05, 0.035, 0.3, 0.035], [0.05, 0.03, -0.4, 0.035], [0.0, -0.035, 0.1, 0.05]]) {
    const b = add(g, part(G.box(0.075, 0.045, 0.075, 0.02), P('#E6A456')), x, y, z);
    b.rotation.y = ry;
  }
  if (bare) return;
  for (const [x, y, z, r] of [[0, 0.08, -0.02, 0.035], [-0.04, 0.066, 0.03, 0.028], [0.045, 0.066, 0.025, 0.027], [0.01, 0.1, 0.0, 0.022]]) {
    const s = add(g, part(G.sphere(r, 12, 10), '#FFFFFF', 'thin'), x, y, z);
    s.scale.y = 0.75;
  }
  dotsOn(g, rand, 50, 0, 0.018, 0, 0.14, 0.12, '#FFFFFF', 0.003);
};

function glassTulip(g) {
  const pts = [V(0.0005, 0), V(0.058, 0), V(0.06, 0.008), V(0.014, 0.016), V(0.011, 0.06), V(0.02, 0.07), V(0.07, 0.1), V(0.084, 0.148), V(0.079, 0.153), V(0.064, 0.106), V(0.0005, 0.078)];
  return add(g, part(G.lathe(pts, 24), '#DDF0F6', 'mid'));
}

T.sundae = (g, p, { P, bare }) => {
  glassTulip(g);
  for (const [x, z] of [[-0.032, 0.015], [0.032, 0.015], [0, -0.03]]) add(g, part(G.sphere(0.045, 18, 12), P('#FFF1D6')), x, 0.148, z);
  add(g, part(G.sphere(0.046, 18, 12), P('#FFF1D6')), 0, 0.19, 0);
  if (bare) return;
  const cap = add(g, part(G.sphere(0.048, 18, 12), '#5A3422', 'thin'), 0, 0.203, 0);
  cap.scale.y = 0.55;
  for (const a of [0.4, 1.6, 2.9, 4.2, 5.4]) add(g, part(G.capsule(0.007, 0.02), '#5A3422', 'thin'), Math.cos(a) * 0.042, 0.19, Math.sin(a) * 0.042);
  swirl(g, 0.034, 0.048, '#FFFBF0', 0, 0.222, 0);
  cherry(g, 0, 0.266, 0, 0.016);
};

T.shake = (g, p, { P, bare }) => {
  const pts = [V(0.0005, 0), V(0.045, 0), V(0.05, 0.01), V(0.058, 0.17), V(0.055, 0.176), V(0.0005, 0.176)];
  add(g, part(G.lathe(pts, 24), P('#F7B9C4'), 'mid'));
  const rim = add(g, part(G.torus(0.056, 0.006, TAU, 24), '#EAF5F8', false), 0, 0.172, 0);
  rim.rotation.x = Math.PI / 2;
  const straw = add(g, part(G.cyl(0.007, 0.007, 0.2, 0.003, 10), stripeMat(C.pinkDeep, 1), 'thin'), 0.022, 0.2, 0.01);
  straw.rotation.z = -0.32;
  if (bare) return;
  swirl(g, 0.05, 0.07, '#FFFBF0', 0, 0.176, 0);
  cherry(g, 0, 0.244, 0, 0.016);
};

T.trifle = (g, p, { P, bare, rand }) => {
  let y = 0;
  const layers = [['#FFF6E0', 0.03], ['#E4B06A', 0.018], ['#FFE9A0', 0.024], ['#FFF6E0', 0.028], ['#E4B06A', 0.018], ['#FFE9A0', 0.02]];
  for (const [col, h] of layers) {
    add(g, part(G.cyl(0.08, 0.08, h, 0.004, 28), P(col), 'thin'), 0, y + h / 2, 0);
    y += h;
  }
  const rim = add(g, part(G.torus(0.082, 0.006, TAU, 28), '#DDF0F6', false), 0, y, 0);
  rim.rotation.x = Math.PI / 2;
  if (bare) return;
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU;
    add(g, part(G.sphere(0.028, 10, 8), '#FFFBF0', 'thin'), Math.cos(a) * 0.045, y + 0.012, Math.sin(a) * 0.045);
  }
  add(g, part(G.sphere(0.035, 12, 10), '#FFFBF0', 'thin'), 0, y + 0.022, 0);
  for (const a of [0.8, 3.4]) {
    const w = add(g, part(G.cyl(0.022, 0.022, 0.006, 0.002, 14), '#E4B06A', 'thin'), Math.cos(a) * 0.04, y + 0.04, Math.sin(a) * 0.04);
    w.rotation.set(1.1, a, 0);
  }
  for (let i = 0; i < 3; i++) add(g, part(G.cyl(0.015, 0.015, 0.006, 0.002, 12), '#FFF0B3', 'thin'), (rand() - 0.5) * 0.06, y + 0.045, (rand() - 0.5) * 0.06);
};

T.split = (g, p, { P, bare, rand }) => {
  const pts = [V(0.0005, 0), V(0.05, 0), V(0.07, 0.02), V(0.085, 0.05), V(0.08, 0.055), V(0.0005, 0.03)];
  const boat = add(g, part(G.lathe(pts, 24), C.blue, 'mid'));
  boat.scale.set(1.9, 1, 1);
  for (const z of [-0.045, 0.045]) {
    const b = add(g, part(G.capsule(0.018, 0.2), P('#FFE27A'), 'thin'), 0, 0.052, z);
    b.rotation.z = Math.PI / 2;
  }
  const scoops = [[-0.065, '#FFF1D6'], [0, '#7A4A30'], [0.065, '#F7B9C4']];
  for (const [x, col] of scoops) add(g, part(G.sphere(0.036, 16, 12), P(col)), x, 0.07, 0);
  if (bare) return;
  for (const [x] of scoops) {
    const cap = add(g, part(G.sphere(0.037, 14, 10), '#5A3422', 'thin'), x, 0.08, 0);
    cap.scale.y = 0.5;
    cherry(g, x, 0.098, 0, 0.013);
  }
  dotsOn(g, rand, 18, 0, 0.1, 0, 0.1, 0.02, '#C98A4A', 0.004);
};

T.float = (g, p, { P }) => {
  const pts = [V(0.0005, 0), V(0.055, 0), V(0.058, 0.008), V(0.06, 0.15), V(0.056, 0.155), V(0.0005, 0.155)];
  add(g, part(G.lathe(pts, 24), P('#8A4A22'), 'mid'));
  const rim = add(g, part(G.torus(0.058, 0.007, TAU, 24), '#EAF5F8', false), 0, 0.152, 0);
  rim.rotation.x = Math.PI / 2;
  const handle = add(g, part(G.torus(0.032, 0.01, Math.PI, 16), '#EAF5F8', 'thin'), 0.058, 0.08, 0);
  handle.rotation.z = -Math.PI / 2;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    add(g, part(G.sphere(0.024, 10, 8), P('#FFF1D6'), 'thin'), Math.cos(a) * 0.036, 0.158, Math.sin(a) * 0.036);
  }
  add(g, part(G.sphere(0.04, 16, 12), P('#FFF6E0')), 0, 0.18, 0);
  const straw = add(g, part(G.cyl(0.007, 0.007, 0.2, 0.003, 10), '#E4605E', 'thin'), 0.028, 0.2, -0.01);
  straw.rotation.z = -0.3;
};

T.alaska = (g, p, { P }) => {
  plate(g, 0.16);
  add(g, part(G.cyl(0.1, 0.1, 0.03, 0.01, 28), P('#E4AC62')), 0, 0.027, 0);
  const dome = add(g, part(G.sphere(0.085, 24, 16), P('#FFF3DC')), 0, 0.045, 0);
  dome.scale.y = 0.85;
  const cone = G.cyl(0.001, 0.018, 0.04, 0.004, 10);
  let k = 0;
  for (const [tilt, count, rr] of [[1.1, 8, 0.075], [0.6, 5, 0.045], [0, 1, 0]]) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU + k;
      const c = add(g, part(cone, P('#FFF3DC'), 'thin'), Math.cos(a) * rr, 0.045 + Math.cos(tilt) * 0.07 + 0.012, Math.sin(a) * rr);
      c.rotation.set(Math.sin(a) * tilt, 0, -Math.cos(a) * tilt);
      add(c, part(G.sphere(0.008, 6, 4), P('#D08A45'), false), 0, 0.018, 0);
    }
    k += 0.3;
  }
};

T.sandwich = (g, p, { P }) => {
  plate(g, 0.13);
  add(g, part(G.box(0.13, 0.016, 0.075, 0.006), P('#4E2C1C')), 0, 0.02, 0);
  add(g, part(G.box(0.124, 0.032, 0.07, 0.008), P('#FFF6E0')), 0, 0.043, 0);
  add(g, part(G.box(0.13, 0.016, 0.075, 0.006), P('#4E2C1C')), 0, 0.066, 0);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
    add(g, part(G.cyl(0.004, 0.004, 0.004, 0.001, 6), '#2F1A10', false), -0.045 + i * 0.03, 0.075, -0.015 + j * 0.03);
  }
};

T.smores = (g, p, { P }) => {
  board(g, 0.2, 0.16);
  add(g, part(G.box(0.09, 0.014, 0.09, 0.006), P('#DDA55E')), 0, 0.027, 0);
  add(g, part(G.box(0.07, 0.012, 0.07, 0.005), P('#5A3422')), 0, 0.04, 0);
  add(g, part(G.cyl(0.036, 0.036, 0.04, 0.012, 18), P('#FFF6F0')), 0, 0.066, 0);
  const toast = add(g, part(G.sphere(0.036, 16, 8), P('#D9934A'), false), 0, 0.083, 0);
  toast.scale.y = 0.2;
  const top = add(g, part(G.box(0.09, 0.014, 0.09, 0.006), P('#DDA55E')), 0.008, 0.098, 0);
  top.rotation.set(0.05, 0.3, 0.12);
};

T.caramelApple = (g, p, { P, bare }) => {
  add(g, part(G.cyl(0.1, 0.1, 0.004, 0.002, 24), '#FFFBF0', 'thin'), 0, 0.002, 0);
  add(g, part(G.sphere(0.06, 22, 16), P('#E4605E')), 0, 0.062, 0);
  add(g, part(new THREE.SphereGeometry(0.063, 22, 14, 0, TAU, 0, Math.PI * 0.62), P('#C9782F'), 'thin'), 0, 0.062, 0);
  for (const a of [0.5, 1.7, 2.9, 4.1, 5.3]) add(g, part(G.capsule(0.008, 0.012), P('#C9782F'), false), Math.cos(a) * 0.056, 0.036, Math.sin(a) * 0.056);
  add(g, part(G.cyl(0.006, 0.006, 0.12, 0.002, 8), C.honeyLight, 'thin'), 0, 0.15, 0);
  if (bare) return;
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * TAU;
    add(g, part(G.sphere(0.006, 6, 4), '#C98A4A', false), Math.cos(a) * 0.058, 0.04 + (i % 3) * 0.004, Math.sin(a) * 0.058);
  }
};

T.pralines = (g, p, { P }) => {
  waxPaper(g);
  for (const [x, z, seed, s] of [[-0.05, 0.03, 3, 1], [0.05, 0.035, 4, 0.9], [0.0, -0.045, 5, 0.95]]) {
    const b = add(g, part(lumpyGeo(0.045, seed), P('#D89A55')), x, 0.012, z);
    b.scale.set(s, s * 0.3, s);
    for (const [dx, dz, r] of [[-0.012, 0, 0.4], [0.014, 0.008, -0.6]]) {
      const n = add(g, part(G.sphere(0.013, 8, 6), P('#8B4A22'), false), x + dx, 0.025, z + dz);
      n.scale.set(1.4, 0.5, 0.8);
      n.rotation.y = r;
    }
  }
};

T.cotton = (g, p, { P }) => {
  add(g, part(G.cyl(0.05, 0.055, 0.03, 0.01, 18), C.honey, 'mid'), 0, 0.015, 0);
  const pts = [V(0.0005, 0), V(0.028, 0.13), V(0.026, 0.132), V(0.0005, 0.02)];
  add(g, part(G.lathe(pts, 18), stripeMat(C.pinkDeep, 6), 'thin'), 0, 0.01, 0);
  const cols = ['#F7B9C4', '#BFE0F0', '#F9C8D0', '#AFD6EC'];
  const puffs = [[0, 0.2, 0, 0.055], [-0.04, 0.17, 0.01, 0.04], [0.042, 0.172, -0.01, 0.04], [0.0, 0.17, 0.04, 0.04], [0.0, 0.17, -0.04, 0.04], [-0.02, 0.235, 0.0, 0.035], [0.025, 0.23, 0.01, 0.034], [0.0, 0.26, 0, 0.028]];
  puffs.forEach(([x, y, z, r], i) => add(g, part(G.sphere(r, 14, 10), P(cols[i % 4]), 'thin'), x, y, z));
};

// ------------------------------------------------------------------ menu → model spec

const SPEC = {
  'apple-pie': ['pie', { fill: '#EDB44E', bits: '#F7DB8C', lattice: true }],
  'pecan-pie': ['pie', { fill: '#B8652E', pecans: true }],
  'key-lime-pie': ['pie', { fill: '#DDEBA2', top: 'rosettes', crust: '#DDB27A' }],
  'pumpkin-pie': ['pie', { fill: '#E8893A', top: 'dollop' }],
  'cherry-pie': ['pie', { fill: '#C8384A', bits: '#E4605E', lattice: true, sugar: true }],
  'banana-cream-pie': ['pie', { fill: '#FFE9A0', top: 'mound', bananas: true, shavings: true }],
  'blueberry-pie': ['pie', { fill: '#6F5AA8', bits: '#8E7CC8', lattice: true, ooze: true }],
  'sweet-potato-pie': ['pie', { fill: '#D9824A', edge: '#D99550' }],
  'mud-pie': ['pie', { fill: '#5A3422', crust: '#6E4431', top: 'mound', shavings: true }],
  'peach-cobbler': ['skillet', { fill: '#F6A55A', top: '#EFC06C' }],
  'apple-crisp': ['dish', { dish: '#AFD6EC', fill: '#D9A05B', crumbs: true }],
  'cheesecake': ['slice', { layers: [['#C98A4A', 0.018], ['#FFF1D0', 0.07]], top: '#FFF1D0', decoTop: '#D8404E', shell: '#F3D69A', strawberries: true, rosette: false }],
  'cupcake': ['cupcake', { liner: '#F7B9C4', cherry: true }],
  'red-velvet': ['slice', { layers: [['#B8323F', 0.03], ['#FFF6E6', 0.012], ['#B8323F', 0.03], ['#FFF6E6', 0.012], ['#B8323F', 0.03]], top: '#B8323F', decoTop: '#FFF6E6', decoShell: '#FFF6E6', crumbs: '#B8323F' }],
  'boston-cream': ['slice', { layers: [['#F3D08A', 0.04], ['#FFE066', 0.022], ['#F3D08A', 0.04]], top: '#F3D08A', decoTop: '#4E2C1C', drip: '#4E2C1C', rosette: false }],
  'carrot-cake': ['slice', { layers: [['#D9864A', 0.035], ['#FFF6E6', 0.012], ['#D9864A', 0.035], ['#FFF6E6', 0.012]], top: '#D9864A', decoTop: '#FFF6E6', decoShell: '#FFF6E6', nuts: true }],
  'devils-food': ['slice', { layers: [['#4E2C1C', 0.035], ['#7A4A30', 0.015], ['#4E2C1C', 0.035], ['#7A4A30', 0.015]], top: '#4E2C1C', decoTop: '#7A4A30', decoShell: '#7A4A30' }],
  'pineapple-upside-down': ['roundCake', {}],
  'german-chocolate': ['slice', { layers: [['#6A4029', 0.035], ['#D9B27A', 0.016], ['#6A4029', 0.035], ['#D9B27A', 0.016]], top: '#D9B27A', shell: '#6A4029', nuts: true, coconut: true, rosette: false }],
  'angel-food': ['ringCake', {}],
  'pound-cake': ['loaf', {}],
  'strawberry-shortcake': ['shortcake', {}],
  'whoopie-pies': ['whoopie', {}],
  'chocolate-chip': ['cookies', { base: '#DFA35A', style: 'chips' }],
  'brownies': ['bars', { style: 'brownie' }],
  'snickerdoodles': ['cookies', { base: '#EBC98E', style: 'cracks' }],
  'lemon-bars': ['bars', { style: 'lemon' }],
  'rice-krispies': ['bars', { style: 'krispies' }],
  'oatmeal-raisin': ['cookies', { base: '#D29A58', style: 'oats' }],
  'peanut-butter': ['cookies', { base: '#DDA25E', style: 'fork' }],
  'sugar-cookies': ['cookies', { base: '#F6DDAE', style: 'icing' }],
  'glazed-donuts': ['donuts', {}],
  'cinnamon-rolls': ['roll', {}],
  'funnel-cake': ['funnel', {}],
  'apple-fritters': ['fritter', {}],
  'blueberry-muffins': ['muffin', {}],
  'beignets': ['beignets', {}],
  'bread-pudding': ['dish', { dish: '#F7B9C4', fill: '#F3D08A', cubes: true, caramel: true }],
  'sundae': ['sundae', {}],
  'milkshake': ['shake', {}],
  'banana-pudding': ['trifle', {}],
  'banana-split': ['split', {}],
  'root-beer-float': ['float', {}],
  'baked-alaska': ['alaska', {}],
  'ice-cream-sandwich': ['sandwich', {}],
  'smores': ['smores', {}],
  'caramel-apple': ['caramelApple', {}],
  'fudge': ['bars', { style: 'fudge' }],
  'pralines': ['pralines', {}],
  'cotton-candy': ['cotton', {}],
};

function palette({ raw, burnt }) {
  return (c) => {
    let out = c;
    if (raw) out = mixHex(out, '#F4E4C6', 0.5);
    if (burnt) out = mixHex(out, '#4E2C1C', burnt >= 2 ? 0.45 : 0.22);
    return out;
  };
}

const modelCache = new Map();

/** A fresh (cloned) model of a dessert in the given state. */
export function dessertModel(d, state = {}) {
  const key = `${d.id}|${state.bare ? 1 : 0}|${state.raw ? 1 : 0}|${state.burnt || 0}`;
  let master = modelCache.get(key);
  if (!master) {
    master = new THREE.Group();
    const [tpl, p] = SPEC[d.id];
    T[tpl](master, p, { P: palette(state), bare: !!state.bare, rand: rng(d.n * 31 + 7) });
    mergeStatic(master);
    modelCache.set(key, master);
  }
  return master.clone();
}

// How each ingredient looks once it's tipped into the mixing bowl.
const BIT = {
  flour: ['mound', '#FFF8EC'], sugar: ['cubes', '#FFFFFF', 0.018], oats: ['flakes', '#E6CC9C'], bread: ['cubes', '#E9A95A', 0.026],
  chocolate: ['cubes', '#5A3422', 0.022], graham: ['cubes', '#E3AE6B', 0.024], 'crispy-rice': ['flakes', '#F0D08E'],
  marshmallows: ['puffs', '#FFFBF0'], coconut: ['flakes', '#FFFBF0'], cinnamon: ['sticks', '#A8612E'], nuts: ['nuts', '#95512A'],
  raisins: ['berries', '#6E3A3A', 0.011], caramel: ['liquid', '#D9822F'], 'peanut-butter': ['dollop', '#D9A05B'],
  apples: ['chunks', '#F7E6A8', '#E4605E'], peaches: ['chunks', '#F9CB94', '#F6A57A'], bananas: ['slices', '#FFF0B3'],
  pumpkin: ['dollop', '#E8893A'], 'sweet-potato': ['dollop', '#D9824A'], pineapple: ['chunks', '#FFE27A', '#F2B84A'],
  carrots: ['shreds', '#F4A646'], milk: ['liquid', '#EEF4EE'], cream: ['liquid', '#FFF3E6'], 'root-beer': ['liquid', '#8A4A22'],
  butter: ['cubes', '#FFE27A', 0.028], eggs: ['egg'], 'cream-cheese': ['dollop', '#FFF6E4'], strawberries: ['strawberries'],
  blueberries: ['berries', '#6D63B5', 0.013], cherries: ['berries', '#D8404E', 0.016], lemons: ['slices', '#FFE066'],
  limes: ['slices', '#9DC25A'], 'ice-cream': ['scoop', '#F9C8D0'],
};

function addBit(g, id, x, y, z, rand) {
  const [kind, col, extra] = BIT[id] || ['mound', '#FFF3DC'];
  const at = (m, dx = 0, dy = 0, dz = 0) => add(g, m, x + dx, y + dy, z + dz);
  const ring = (n, r, fn) => { for (let i = 0; i < n; i++) { const a = (i / n) * TAU + rand(); fn(Math.cos(a) * r, Math.sin(a) * r, i); } };
  if (kind === 'mound') {
    const m = at(part(G.sphere(0.036, 14, 10), col, 'thin'));
    m.scale.y = 0.55;
    const tip = at(part(G.sphere(0.018, 10, 8), col, false), 0, 0.016, 0);
    tip.scale.y = 0.7;
  } else if (kind === 'cubes') {
    const size = extra || 0.02;
    ring(3, 0.018, (dx, dz) => {
      const c = at(part(G.box(size, size, size, size * 0.2), col, 'thin'), dx, size / 2, dz);
      c.rotation.set(rand() * 0.6, rand() * 3, rand() * 0.6);
    });
  } else if (kind === 'flakes') {
    for (let i = 0; i < 9; i++) {
      const f = at(part(G.sphere(0.009, 6, 4), col, false), (rand() - 0.5) * 0.05, 0.004 + rand() * 0.01, (rand() - 0.5) * 0.05);
      f.scale.set(1.4, 0.4, 1);
    }
  } else if (kind === 'puffs') {
    ring(3, 0.017, (dx, dz) => at(part(G.cyl(0.014, 0.014, 0.018, 0.006, 10), col, 'thin'), dx, 0.009, dz));
  } else if (kind === 'sticks') {
    for (const r of [-0.4, 0.3]) {
      const st = at(part(G.cyl(0.007, 0.007, 0.07, 0.003, 8), col, 'thin'), 0, 0.01, r * 0.03);
      st.rotation.set(Math.PI / 2, r, 0);
    }
  } else if (kind === 'nuts') {
    ring(4, 0.016, (dx, dz, i) => {
      const n = at(part(G.sphere(0.012, 8, 6), col, 'thin'), dx, 0.006, dz);
      n.scale.set(1.4, 0.5, 0.8);
      n.rotation.y = i;
    });
  } else if (kind === 'berries') {
    const r = extra || 0.013;
    for (let i = 0; i < 6; i++) at(part(G.sphere(r, 10, 8), col, 'thin'), (rand() - 0.5) * 0.045, r * 0.8 + (i > 3 ? r : 0), (rand() - 0.5) * 0.045);
  } else if (kind === 'strawberries') {
    for (const [dx, dz] of [[-0.014, 0], [0.016, 0.01], [0, -0.016]]) berry(g, x + dx, y, z + dz, 0.75);
  } else if (kind === 'chunks') {
    ring(4, 0.018, (dx, dz) => {
      const c = at(part(G.box(0.018, 0.014, 0.016, 0.004), col, 'thin'), dx, 0.007, dz);
      c.rotation.y = rand() * 3;
      add(c, part(G.box(0.019, 0.005, 0.017, 0.002), extra, false), 0, 0.006, 0);
    });
  } else if (kind === 'slices') {
    ring(3, 0.016, (dx, dz) => {
      const sl = at(part(G.cyl(0.016, 0.016, 0.006, 0.002, 14), col, 'thin'), dx, 0.006, dz);
      sl.rotation.set(rand() * 0.5, 0, rand() * 0.5);
      add(sl, part(G.cyl(0.011, 0.011, 0.007, 0.002, 12), mixHex(col, '#FFFBF0', 0.45), false));
    });
  } else if (kind === 'shreds') {
    for (let i = 0; i < 6; i++) {
      const sh = at(part(G.capsule(0.004, 0.03), col, false), (rand() - 0.5) * 0.04, 0.006, (rand() - 0.5) * 0.04);
      sh.rotation.set(Math.PI / 2, rand() * 3, 0);
    }
  } else if (kind === 'dollop') {
    swirl(g, 0.026, 0.03, col, x, y, z);
  } else if (kind === 'egg') {
    const white = at(part(G.cyl(0.03, 0.03, 0.006, 0.003, 18), '#FFFBF0', 'thin'), 0, 0.003, 0);
    white.scale.z = 0.85;
    const yolk = at(part(G.sphere(0.014, 12, 10), '#FFC940', 'thin'), 0.004, 0.009, 0);
    yolk.scale.y = 0.7;
  } else if (kind === 'scoop') {
    at(part(G.sphere(0.03, 14, 10), col, 'thin'), 0, 0.022, 0);
  }
}

/** The mixing bowl you carry while gathering: each ingredient in its own little pile, or batter once mixed. */
export function bowlModel(ids = [], batter = null) {
  const g = new THREE.Group();
  const pts = [V(0.0005, 0), V(0.085, 0), V(0.125, 0.03), V(0.152, 0.08), V(0.158, 0.1), V(0.148, 0.102), V(0.14, 0.082), V(0.115, 0.036), V(0.078, 0.013), V(0.0005, 0.013)];
  add(g, part(G.lathe(pts, 28), C.cream2, 'mid'));
  const band = add(g, part(G.torus(0.152, 0.008, TAU, 28), C.pinkDeep, false), 0, 0.09, 0);
  band.rotation.x = Math.PI / 2;
  const rand = rng(ids.length * 13 + 5);
  const liquids = ids.filter((id) => BIT[id] && BIT[id][0] === 'liquid');
  const solids = ids.filter((id) => !liquids.includes(id));
  let floor = 0.014;
  if (batter) {
    add(g, part(G.cyl(0.128, 0.128, 0.02, 0.006, 28), batter, false), 0, 0.058, 0);
    const sw = add(g, part(G.torus(0.05, 0.008, TAU * 0.8, 20), mixHex(batter, '#FFFBF0', 0.3), false), 0, 0.07, 0);
    sw.rotation.x = Math.PI / 2;
    floor = 0.07;
  } else if (liquids.length) {
    const col = liquids.length === 1 ? BIT[liquids[0]][1] : mixHex(BIT[liquids[0]][1], BIT[liquids[1]][1], 0.5);
    add(g, part(G.cyl(0.1, 0.1, 0.016, 0.005, 28), col, false), 0, 0.03, 0);
    if (liquids.length > 1) {
      const sw = add(g, part(G.torus(0.04, 0.006, TAU * 0.75, 20), BIT[liquids[1]][1], false), 0, 0.039, 0);
      sw.rotation.x = Math.PI / 2;
    }
    floor = 0.038;
  }
  // piles sit around the bowl like a little mise en place
  const n = solids.length;
  solids.forEach((id, i) => {
    const a = (i / Math.max(n, 1)) * TAU + 0.6;
    const r = n === 1 ? 0 : n === 2 ? 0.045 : 0.06;
    const lift = floor;
    addBit(g, id, Math.cos(a) * r, lift, Math.sin(a) * r, rand);
  });
  mergeStatic(g);
  return g;
}
