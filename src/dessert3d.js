// Chunky clay-miniature 3D desserts, built procedurally from ~30 templates.
//
// A treat is built in stages so every recipe step visibly changes it: parts of
// a template are tagged as *features* (crust, crimp, lattice, fill, layers,
// glaze, cut, scoops, floss…) that stay hidden until their step is done, and a
// feature can be built "live" (unmerged) so the station can animate it while you
// play that step's mini-game. Toppings appear one by one at the decorating
// table; toppings a template doesn't draw itself (special requests) are placed
// on the treat's real surface by raycasting.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
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

// the build context of the template currently running (plates are skipped in pans and ovens)
let CUR = null;
const base = (m) => { m.userData.base = true; return m; };

// glass for sundae cups, shakes, mugs and trifle dishes
let GLASS = null;
function glassMat() {
  if (!GLASS) {
    GLASS = toon('#E4F4F8', { transparent: true, opacity: 0.32, unique: true });
    GLASS.userData.mergeable = true;
  }
  return GLASS;
}
function glass(g, pts, seg = 32) {
  const m = new THREE.Mesh(G.lathe(pts, seg), glassMat());
  m.renderOrder = 2;
  base(m);
  return add(g, m);
}

// ------------------------------------------------------------------ shared bits

function plate(g, r = 0.17, col = C.cream2) {
  if (CUR && CUR.noPlate) return null;
  const pts = [V(0.0005, 0), V(r * 0.68, 0), V(r * 0.9, 0.012), V(r, 0.026), V(r * 0.97, 0.031), V(r * 0.84, 0.018), V(r * 0.66, 0.012), V(0.0005, 0.012)];
  const m = add(g, base(part(G.lathe(pts, 40), col, 'mid')));
  const ring = add(g, base(part(G.torus(r * 0.86, 0.0035, TAU, 48), mixHex(col, C.pinkDeep, 0.35), false)), 0, 0.0165, 0);
  ring.rotation.x = Math.PI / 2;
  return m;
}

function board(g, w = 0.3, d = 0.18) {
  if (CUR && CUR.noPlate) return null;
  return add(g, base(part(G.box(w, 0.02, d, 0.008), C.honeyLight, 'thin')), 0, 0.01, 0);
}

function waxPaper(g, w = 0.26, d = 0.2) {
  if (CUR && CUR.noPlate) return null;
  const m = add(g, base(part(G.box(w, 0.004, d, 0.002), '#FFFBF0', 'thin')), 0, 0.002, 0);
  m.rotation.y = 0.08;
  return m;
}

/** Welds a displaced polyhedron so it shades smooth instead of faceted. */
function smooth(g) {
  g.deleteAttribute('normal');
  if (g.attributes.uv) g.deleteAttribute('uv');
  const m = mergeVertices(g, 1e-5);
  m.computeVertexNormals();
  return m;
}

// A star-tip piped swirl: a ridged tube coiling up a cone and ending in a
// little curled kiss, with a solid core so it reads as one dollop of frosting.
function pipedGeo(r, h, turns = 2.3, ridges = 7) {
  return geo(`pp${r},${h},${turns},${ridges}`, () => {
    const segs = Math.round(48 * turns), ring = 16;
    const pos = [], idx = [];
    const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const center = (t) => {
      const a = t * TAU * turns;
      const rr = r * 0.6 * (1 - t) ** 0.9;
      return new THREE.Vector3(Math.cos(a) * rr, h * (0.2 + t * 0.66) + (t > 0.9 ? (t - 0.9) * h * 1.2 : 0), Math.sin(a) * rr);
    };
    const tubeR = (t) => r * 0.42 * (1 - 0.72 * t) * (0.35 + 0.65 * smoothstep(0, 0.06, t)) * (1 - 0.92 * smoothstep(0.88, 1, t));
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const c = center(t);
      const T = center(Math.min(1, t + 0.002)).sub(center(Math.max(0, t - 0.002))).normalize();
      const N = new THREE.Vector3().crossVectors(up, T).normalize();
      const B = new THREE.Vector3().crossVectors(T, N).normalize();
      const tr = tubeR(t);
      for (let j = 0; j < ring; j++) {
        const f = (j / ring) * TAU;
        const rad = tr * (1 + 0.16 * Math.cos(ridges * f));
        pos.push(c.x + (N.x * Math.cos(f) + B.x * Math.sin(f)) * rad, c.y + (N.y * Math.cos(f) + B.y * Math.sin(f)) * rad, c.z + (N.z * Math.cos(f) + B.z * Math.sin(f)) * rad);
      }
    }
    for (let i = 0; i < segs; i++) {
      for (let j = 0; j < ring; j++) {
        const a = i * ring + j, b2 = i * ring + ((j + 1) % ring), c2 = a + ring, d = b2 + ring;
        idx.push(a, b2, c2, b2, d, c2);
      }
    }
    const coil = new THREE.BufferGeometry();
    coil.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    coil.setIndex(idx);
    coil.computeVertexNormals();
    return coil;
  });
}
function coreGeo(r, h) {
  return geo(`core${r},${h}`, () => new THREE.LatheGeometry([V(0.0005, 0), V(r * 0.78, 0), V(r * 0.8, h * 0.12), V(r * 0.45, h * 0.55), V(r * 0.12, h * 0.8), V(0.0005, h * 0.84)], 20));
}
function swirl(g, r, h, col, x = 0, y = 0, z = 0) {
  const s = new THREE.Group();
  s.position.set(x, y, z);
  s.rotation.y = (x * 131 + z * 71) % TAU;
  g.add(s);
  add(s, part(coreGeo(r, h), col, false));
  add(s, part(pipedGeo(r, h), col, 'thin'));
  return s;
}

// Pie crust edge: a torus whose thickness waves in and out, like pinched dough.
function crimpGeo(R, tube, n, amp = 0.28, arc = TAU) {
  return geo(`cr${R},${tube},${n},${amp},${arc}`, () => {
    const g = new THREE.TorusGeometry(R, tube, 12, Math.max(12, Math.round(n * 8 * (arc / TAU))), arc);
    const p = g.attributes.position;
    const v = new THREE.Vector3(), c = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const phi = Math.atan2(v.y, v.x);
      c.set(Math.cos(phi) * R, Math.sin(phi) * R, 0);
      v.sub(c).multiplyScalar(1 + amp * Math.cos(n * phi)).add(c);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  });
}

// Pleats for paper liners, fluted tins and ring cakes: pushes a lathe in and out around its axis.
export function fluted(baseGeo, n, amp, key) {
  return geo(`fl${key},${n},${amp}`, () => {
    const g = baseGeo.clone();
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      const k = 1 + amp * Math.cos(n * Math.atan2(z, x));
      p.setX(i, x * k);
      p.setZ(i, z * k);
    }
    g.computeVertexNormals();
    return g;
  });
}

// Hand-made cookie: a rounded disc with a gently irregular edge and domed middle.
function cookieGeo(r, h, seed) {
  return geo(`ck${r},${h},${seed}`, () => {
    const g = G.cyl(r, r * 0.96, h, h * 0.45, 30).clone();
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), y = p.getY(i);
      const a = Math.atan2(z, x), d = Math.hypot(x, z) / r;
      const k = 1 + 0.05 * Math.sin(5 * a + seed) + 0.035 * Math.sin(9 * a + seed * 2.3);
      p.setX(i, x * k);
      p.setZ(i, z * k);
      if (y > 0) p.setY(i, y + (1 - d * d) * h * 0.35);
    }
    g.computeVertexNormals();
    return g;
  });
}

// Over-under pastry strips for a real woven lattice; each strip is its own piece.
function lattice(g, R, top, col, count = 4, w = 0.011, shine = null) {
  const gap = 0.05;
  const offs = Array.from({ length: count }, (_, i) => (i - (count - 1) / 2) * gap);
  const amp = 0.0045;
  const strips = [];
  for (const dir of [0, 1]) {
    offs.forEach((off, i) => {
      const len = Math.sqrt(Math.max(0, R * R - off * off));
      const pts = [];
      for (let k = 0; k <= 24; k++) {
        const u = -len + (2 * len * k) / 24;
        const wave = amp * Math.cos((Math.PI * (u - offs[0])) / gap + i * Math.PI) * (dir ? -1 : 1);
        pts.push(dir ? new THREE.Vector3(off, wave / 0.45, u) : new THREE.Vector3(u, wave / 0.45, off));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const tg = new THREE.TubeGeometry(curve, 48, w, 8);
      tg.scale(1, 0.45, 1);
      const strip = add(g, part(tg, col, 'thin'), 0, top + 0.006, 0);
      if (shine) {
        // a thin glossy line of egg wash along the top of the strip
        const sg = new THREE.TubeGeometry(curve, 48, w * 0.28, 6);
        sg.scale(1, 0.45, 1);
        sg.translate(0, w * 0.4, 0);
        const sh = add(strip, part(sg, shine, false));
        sh.userData.noHighlight = true;
      }
      strips.push(strip);
    });
  }
  // weave order: alternate directions so each tap lays the next strip
  const order = [];
  for (let i = 0; i < count; i++) order.push(strips[i], strips[count + i]);
  order.forEach((s) => g.add(s));
  return order;
}

// The frosting band around a slice's curved edge: a ring sector with real thickness
// that reaches a hair past both cut faces (a zero-thickness shell would flicker).
function bandGeo(R0, R1, h, ang) {
  return geo(`bd${R0},${R1},${h},${ang}`, () => {
    const d = 0.004 / R1, a0 = -d, a1 = ang + d;
    const s = new THREE.Shape();
    s.moveTo(Math.cos(a0) * R0, Math.sin(a0) * R0);
    s.lineTo(Math.cos(a0) * R1, Math.sin(a0) * R1);
    s.absarc(0, 0, R1, a0, a1, false);
    s.lineTo(Math.cos(a1) * R0, Math.sin(a1) * R0);
    s.absarc(0, 0, R0, a1, a0, true);
    const bev = 0.003;
    const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, h - bev * 2), bevelEnabled: true, bevelThickness: bev, bevelSize: bev * 0.8, bevelSegments: 2, curveSegments: 18 });
    g.rotateX(-Math.PI / 2);
    g.translate(0, bev, 0);
    return g;
  });
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
      depth: Math.max(0.0005, h - bev * 2), bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 16,
    });
    g.rotateX(-Math.PI / 2);
    g.translate(0, bev, 0);
    return g;
  });
}

function lumpyGeo(r, seed, detail = 3, amt = 1) {
  return geo(`lp${r},${seed},${detail},${amt}`, () => {
    const g = new THREE.IcosahedronGeometry(r, detail);
    const p = g.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const k = 1 + amt * (0.1 * Math.sin(v.x * 71 / r * 0.07 + seed) + 0.08 * Math.cos(v.z * 83 / r * 0.07 + seed * 2) + 0.05 * Math.sin(v.y * 97 / r * 0.07 + seed * 3));
      v.multiplyScalar(k);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    return smooth(g);
  });
}

// Rounded star cutout for vented pie tops.
function starGeo(r) {
  return geo(`star${r}`, () => {
    const s = new THREE.Shape();
    for (let i = 0; i <= 10; i++) {
      const a = (i / 10) * TAU - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
      if (i === 0) s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      else s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.003, bevelEnabled: true, bevelThickness: 0.001, bevelSize: 0.001, bevelSegments: 1 });
    g.rotateX(-Math.PI / 2);
    return g;
  });
}

function cherry(g, x, y, z, r = 0.02) {
  const c = new THREE.Group();
  c.position.set(x, y, z);
  // a topping: sprinkles and sugar dusted on afterwards land around it, not on it
  c.userData.topping = 'cherry';
  g.add(c);
  const body = add(c, part(G.sphere(r, 18, 14), '#E4605E', 'thin'), 0, r * 0.9, 0);
  body.scale.set(1.05, 0.95, 1.05);
  add(c, part(G.sphere(r * 0.25, 8, 6), '#FFB0A8', false), -r * 0.4, r * 1.35, r * 0.55);
  const st = add(c, part(G.capsule(0.0028, r * 1.3), '#6E8F4E', false), r * 0.3, r * 2.25, 0);
  st.rotation.z = -0.45;
  return c;
}

function berry(g, x, y, z, s = 1) {
  const b = new THREE.Group();
  b.position.set(x, y, z);
  g.add(b);
  const pts = [V(0.0005, 0), V(0.006, 0.002), V(0.016, 0.012), V(0.023, 0.026), V(0.025, 0.035), V(0.02, 0.042), V(0.0005, 0.044)].map((p) => V(p.x * s, p.y * s));
  add(b, part(G.lathe(pts, 20), '#E4605E', 'thin'));
  for (let i = 0; i < 8; i++) {
    const a = i * 2.4, t = [0.012, 0.022, 0.03, 0.017][i % 4], rr = [0.016, 0.023, 0.025, 0.02][i % 4] * s;
    add(b, part(G.sphere(0.0022 * s, 5, 4), '#FFE08A', false), Math.cos(a) * rr, t * s, Math.sin(a) * rr);
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    const l = add(b, part(G.sphere(0.009 * s, 8, 6), C.sageDark, false), Math.cos(a) * 0.009 * s, 0.044 * s, Math.sin(a) * 0.009 * s);
    l.scale.set(1.5, 0.35, 0.65);
    l.rotation.y = -a;
  }
  return b;
}

// a halved strawberry, cut side up, for cake tops and shortcake
function berryHalf(g, x, y, z, s = 1, ry = 0) {
  const h = new THREE.Group();
  h.position.set(x, y, z);
  h.rotation.y = ry;
  g.add(h);
  const sh = new THREE.Shape();
  sh.moveTo(0, -0.024 * s);
  sh.bezierCurveTo(0.03 * s, -0.016 * s, 0.03 * s, 0.02 * s, 0, 0.022 * s);
  sh.bezierCurveTo(-0.03 * s, 0.02 * s, -0.03 * s, -0.016 * s, 0, -0.024 * s);
  const eg = new THREE.ExtrudeGeometry(sh, { depth: 0.006 * s, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 2 });
  eg.rotateX(-Math.PI / 2);
  add(h, part(eg, '#E4605E', 'thin'));
  const inner = new THREE.ExtrudeGeometry(sh, { depth: 0.001, bevelEnabled: false });
  inner.rotateX(-Math.PI / 2);
  inner.scale(0.7, 1, 0.7);
  add(h, part(inner, '#F7B0A8', false), 0, 0.0095 * s, 0);
  return h;
}

function bananaSlice(g, x, y, z, r = 0.02, tilt = 0) {
  const sl = add(g, part(G.cyl(r, r, 0.008, 0.003), '#FFF0B3', 'thin'), x, y, z);
  sl.rotation.set(tilt, 0, tilt * 0.6);
  for (let i = 0; i < 3; i++) add(sl, part(G.sphere(0.0018, 5, 4), '#B98A4A', false), Math.cos(i * 2.1) * r * 0.35, 0.0045, Math.sin(i * 2.1) * r * 0.35);
  return sl;
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

// a drizzle line wandering over a surface at height yFn(x, z)
function drizzle(g, pts, col, r = 0.0045, outline = false) {
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  return add(g, part(new THREE.TubeGeometry(curve, Math.max(16, pts.length * 6), r, 6), col, outline));
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

// ------------------------------------------------------------------ templates
// Each template gets (g, p, c): g the root group, p the dessert's spec, and c
// the build context: c.P(color) applies raw/toasty tints, c.has(topping) asks
// whether a topping is on, c.F(parent, tag, fn, style) builds a feature only
// once its step is done (or live), and c.done(tag) tells finished steps apart.

const T = {};

// Pie helpers: a baked crust browns on its high points and catches an egg-wash
// shine; fruit fillings show their fruit and bubble up through the gaps.
const browned = (col) => mixHex(col, '#9A5524', 0.32);
const glossOf = (col) => mixHex(col, '#FFF8E8', 0.55);

// glossy streaks: flat, light, unoutlined dabs that read as a shine
function shineDabs(g, col, pts, len = 0.016, r = 0.0026) {
  for (const [x, y, z, a] of pts) {
    const s = add(g, part(G.capsule(r, len), col, false), x, y, z);
    s.rotation.set(Math.PI / 2, 0, a);
    s.scale.y = 1;
    s.userData.noHighlight = true;
  }
}

// a curved highlight across a glossy filling
function fillShine(g, col, y, r = 0.075, a0 = 2.3) {
  const arc = add(g, part(G.torus(r, 0.0032, 1.1, 20), col, false), 0, y, 0);
  arc.rotation.set(Math.PI / 2, 0, a0);
  arc.scale.z = 0.35;
  arc.userData.noHighlight = true;
  const dot = add(g, part(G.sphere(0.0045, 8, 6), col, false), Math.cos(-a0 - 1.35) * r * 0.82, y + 0.001, Math.sin(-a0 - 1.35) * r * 0.82);
  dot.scale.y = 0.3;
}

// an apple slice: a pale crescent with a thin red skin edge
function appleSlice(g, x, y, z, ry, P) {
  const s = add(g, new THREE.Group(), x, y, z);
  s.rotation.set(0.15, ry, 0.1);
  const flesh = add(s, part(G.torus(0.017, 0.0065, Math.PI * 0.95, 12), P('#F6D98A'), 'thin'));
  flesh.rotation.x = Math.PI / 2;
  flesh.scale.z = 0.55;
  const skin = add(s, part(G.torus(0.0225, 0.0022, Math.PI * 0.95, 12), P('#D8564A'), false));
  skin.rotation.x = Math.PI / 2;
  return s;
}

// a pecan half: two ridged lobes with a groove down the middle
function pecanHalf(g, x, y, z, ry, P) {
  const n = add(g, new THREE.Group(), x, y, z);
  n.rotation.y = ry;
  for (const sx of [-1, 1]) {
    const lobe = add(n, part(G.sphere(0.0115, 14, 10), P('#8B4A22'), 'thin'), sx * 0.0075, 0, 0);
    lobe.scale.set(0.75, 0.55, 1.6);
    for (const k of [-1, 0, 1]) {
      const ridge = add(n, part(G.capsule(0.0018, 0.006), P('#6A3416'), false), sx * 0.0075, 0.0058, k * 0.009);
      ridge.rotation.set(0, 0, Math.PI / 2);
    }
  }
  return n;
}

T.pie = (g, p, c) => {
  const { P, rand } = c;
  const baked = !c.raw;
  const crust = p.crust || '#E9A95A';
  const rimCol = p.edge || crust;
  plate(g, 0.19);
  const top = 0.067;
  c.F(g, 'crust', (f) => {
    add(f, part(fluted(G.cyl(0.155, 0.125, 0.05, 0.016, 72), 24, 0.028, 'pietin'), P(crust)), 0, 0.037, 0);
    // the edge: pinched once its crimp step is done (crimping happens arc by arc)
    if (c.done('crimp')) {
      const rim = add(f, part(crimpGeo(0.138, 0.02, 18), P(rimCol)), 0, 0.066, 0);
      rim.rotation.x = Math.PI / 2;
      if (baked) {
        // every pinched peak toasts a shade darker, with a dab of egg-wash shine
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * TAU;
          const pk = add(f, part(G.sphere(0.0125, 10, 8), P(browned(rimCol)), false), Math.cos(a) * 0.14, 0.0835, Math.sin(a) * 0.14);
          pk.scale.set(1.1, 0.45, 1.1);
        }
        shineDabs(f, glossOf(rimCol), Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * TAU + 0.4;
          return [Math.cos(a) * 0.128, 0.0865, Math.sin(a) * 0.128, a + Math.PI / 2];
        }), 0.012, 0.0022);
      }
    } else {
      const rim = add(f, part(G.torus(0.138, 0.0185, TAU, 48), P(rimCol)), 0, 0.066, 0);
      rim.rotation.x = Math.PI / 2;
      if (baked) {
        const band = add(f, part(G.torus(0.138, 0.0085, TAU, 48), P(browned(rimCol)), false), 0, 0.078, 0);
        band.rotation.x = Math.PI / 2;
      }
    }
  }, 'grow');
  c.F(g, 'crimp', (f) => {
    if (!c.isLive('crimp')) return;
    // live: five pinched arcs replace the smooth edge one tap at a time
    for (let i = 0; i < 5; i++) {
      const arc = add(f, part(crimpGeo(0.138, 0.0205, 18, 0.28, TAU / 5 + 0.02), P(rimCol)), 0, 0.0665, 0);
      arc.rotation.set(Math.PI / 2, 0, (i / 5) * TAU);
    }
  }, 'pieces');
  const covered = p.topCrust || p.layered || (p.top === 'mound' && c.has('whipped'));
  if (p.layered) {
    // banana cream: bananas, custard, bananas, laid by the layering game
    c.F(g, 'layers', (f) => {
      const l1 = add(f, new THREE.Group());
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU;
        bananaSlice(l1, Math.cos(a) * 0.07, 0.058, Math.sin(a) * 0.07, 0.02);
      }
      bananaSlice(l1, 0, 0.058, 0, 0.02);
      const l2 = add(f, new THREE.Group());
      add(l2, part(G.lathe([V(0.0005, 0), V(0.128, 0), V(0.12, 0.01), V(0.07, 0.018), V(0.0005, 0.02)], 40), P(p.fill), false), 0, 0.054, 0);
      const l3 = add(f, new THREE.Group());
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + 0.3;
        bananaSlice(l3, Math.cos(a) * 0.065, 0.076, Math.sin(a) * 0.065, 0.019, 0.15);
      }
    }, 'pieces');
  } else {
    c.F(g, 'fill', (f) => {
      add(f, part(G.lathe([V(0.0005, 0), V(0.128, 0), V(0.124, 0.006), V(0.1, 0.011), V(0.05, 0.015), V(0.0005, 0.016)], 48), P(p.fill), false), 0, 0.054, 0);
      if (p.fruit === 'apple') {
        // fanned apple slices mounded under the lattice, dusted with cinnamon
        for (let i = 0; i < 16; i++) {
          const a = i * 2.39996, d = Math.sqrt((i + 0.5) / 16) * 0.105;
          appleSlice(f, Math.cos(a) * d, top - 0.001 + (1 - d / 0.11) * 0.004, Math.sin(a) * d, a + 1.2, P);
        }
        dotsOn(f, rand, 26, 0, top + 0.004, 0, 0.1, 0.1, P('#A8612E'), 0.0022);
      }
      if (p.fruit === 'cherry') {
        for (let i = 0; i < 18; i++) {
          const a = i * 2.39996, d = Math.sqrt((i + 0.5) / 18) * 0.108;
          const ch = add(f, part(G.sphere(0.0115, 14, 10), P('#B5263A'), 'thin'), Math.cos(a) * d, top - 0.002 + (1 - d / 0.11) * 0.004, Math.sin(a) * d);
          ch.scale.y = 0.8;
          const hl = add(ch, part(G.sphere(0.0035, 6, 4), '#F59AA0', false), -0.004, 0.007, 0.004);
          hl.userData.noHighlight = true;
        }
      }
      if (p.pecans) {
        // concentric rings of glossy pecan halves set in caramel
        add(f, part(G.sphere(0.06, 24, 12), P('#C9783A'), false), 0, top - 0.024, 0).scale.y = 0.35;
        for (let i = 0; i < 14; i++) pecanHalf(f, Math.cos((i / 14) * TAU) * 0.1, top + 0.002, Math.sin((i / 14) * TAU) * 0.1, -(i / 14) * TAU, P);
        for (let i = 0; i < 8; i++) pecanHalf(f, Math.cos((i / 8) * TAU + 0.3) * 0.058, top + 0.006, Math.sin((i / 8) * TAU + 0.3) * 0.058, -(i / 8) * TAU - 0.3, P);
        pecanHalf(f, 0, top + 0.01, 0, 0.6, P);
      }
      if (p.specks) dotsOn(f, rand, 34, 0, top - 0.0005, 0, 0.11, 0.11, P(p.specks), 0.0022, (x, z, d) => 0.054 + 0.016 * (1 - d * d * 0.9) + 0.0006);
      if (p.zest) dotsOn(f, rand, 22, 0, top - 0.0005, 0, 0.1, 0.1, '#8FB34A', 0.0024, (x, z, d) => 0.054 + 0.016 * (1 - d * d * 0.9) + 0.0006);
      if (baked && p.smooth) {
        // custard pies set with a slightly darker ring where the filling meets the crust
        const ring = add(f, part(G.torus(0.118, 0.006, TAU, 48), P(mixHex(p.fill, '#7A3A1A', 0.25)), false), 0, 0.0605, 0);
        ring.rotation.x = Math.PI / 2;
        ring.scale.z = 0.4;
      }
      if (!covered && baked) fillShine(f, glossOf(p.fill), p.pecans ? top + 0.009 : 0.0705, p.pecans ? 0.045 : 0.07);
      // juice bubbling up at the edge and between the fruit
      if (baked && (p.fruit || p.pecans)) {
        const juice = P(mixHex(p.fill, '#5A1A12', p.pecans ? 0.2 : 0.28));
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * TAU + rand() * 0.4, d = i % 3 === 0 ? 0.05 : 0.118;
          const b = add(f, part(G.sphere(0.0065 + rand() * 0.003, 10, 8), juice, false), Math.cos(a) * d, top + 0.001, Math.sin(a) * d);
          b.scale.y = 0.55;
        }
      }
    }, 'rise');
  }
  if (p.lattice) {
    c.F(g, 'lattice', (f) => {
      lattice(f, 0.132, top - 0.002, P(crust), 4, 0.012, baked ? glossOf(crust) : null);
      if (p.sugar && c.done('lattice')) dotsOn(f, rand, 36, 0, top + 0.013, 0, 0.11, 0.11, '#FFFBF0', 0.003);
    }, 'pieces');
  }
  if (p.topCrust) {
    // a double crust that gets star vents cut into it
    const lid = add(g, part(G.lathe([V(0.0005, 0), V(0.13, 0), V(0.13, 0.004), V(0.11, 0.016), V(0.06, 0.028), V(0.0005, 0.03)], 48), P(crust)), 0, 0.058, 0);
    lid.userData.noHighlight = true;
    if (baked) {
      // egg-wash shine on the dome, and pastry leaves around the middle vent
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU + 0.7;
        const leaf = add(g, part(G.sphere(0.016, 12, 8), P(browned(crust)), 'thin'), Math.cos(a) * 0.03, 0.0868, Math.sin(a) * 0.03);
        leaf.scale.set(1.5, 0.22, 0.6);
        leaf.rotation.y = -a;
      }
      shineDabs(g, glossOf(crust), [[-0.07, 0.083, -0.03, 0.5], [-0.05, 0.085, -0.06, 0.9], [0.075, 0.082, 0.03, 2.2]], 0.02, 0.0028);
    }
    c.F(g, 'vents', (f) => {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU + 0.3, r = i === 4 ? 0 : 0.062;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        const y = i === 4 ? 0.0885 : 0.0805;
        const st = add(f, part(starGeo(0.014), P(p.fill), false), x, y, z);
        st.rotation.y = a;
        // berries peeking through each vent, glossy juice welling up
        for (let k = 0; k < 2; k++) add(st, part(G.sphere(0.0048, 8, 6), P('#4E3A8A'), false), (k - 0.5) * 0.007, 0.003, (k - 0.5) * 0.004);
      }
    }, 'pieces');
    if (p.sugar) dotsOn(g, rand, 30, 0, 0.088, 0, 0.1, 0.1, '#FFFBF0', 0.003, (x, z, d) => 0.058 + 0.03 * (1 - d * d) + 0.0015);
  }
  if (p.ooze && baked) {
    // filling running down over the crimped edge
    for (const a of [0.6, 2.2, 4.1]) {
      const drip = add(g, part(G.capsule(0.009, 0.018), P(p.fill), 'thin'), Math.cos(a) * 0.152, 0.06, Math.sin(a) * 0.152);
      drip.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
      add(g, part(G.sphere(0.011, 10, 8), P(p.fill), 'thin'), Math.cos(a) * 0.135, 0.075, Math.sin(a) * 0.135).scale.y = 0.6;
    }
  }
  // toppings drawn by the pie itself
  if (p.top === 'rosettes' && c.has('whipped')) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      swirl(g, 0.019, 0.03, '#FFFBF0', Math.cos(a) * 0.1, top, Math.sin(a) * 0.1);
    }
    // a twisted lime wheel in the middle
    const lime = add(g, part(G.cyl(0.035, 0.035, 0.008, 0.003), '#9DC25A', 'thin'), 0, top + 0.025, 0);
    lime.rotation.x = 1.2;
    add(lime, part(G.cyl(0.03, 0.03, 0.009, 0.002), '#E6F2A8', false));
    for (let i = 0; i < 8; i++) {
      const seg = add(lime, part(G.box(0.026, 0.0095, 0.0016, 0.0006), '#C8DE80', false), Math.cos((i / 8) * TAU) * 0.013, 0, Math.sin((i / 8) * TAU) * 0.013);
      seg.rotation.y = -(i / 8) * TAU;
    }
  }
  if (p.top === 'dollop' && c.has('whipped')) {
    swirl(g, 0.045, 0.06, '#FFFBF0', 0, top - 0.004, 0);
    dotsOn(g, rand, 10, 0, top + 0.03, 0, 0.03, 0.03, '#B8743C', 0.003);
  }
  if (p.top === 'mound' && c.has('whipped')) {
    const dome = add(g, part(G.sphere(0.115, 32, 16), '#FFFBF0', 'mid'), 0, top, 0);
    dome.scale.y = 0.5;
    for (let i = 0; i < 6; i++) swirl(g, 0.02, 0.03, '#FFFBF0', Math.cos(i * 1.05) * 0.075, top + 0.03, Math.sin(i * 1.05) * 0.075);
    swirl(g, 0.026, 0.036, '#FFFBF0', 0, top + 0.052, 0);
  }
  if (p.shavings && c.has('shavings')) {
    const y = p.top === 'mound' && c.has('whipped') ? top + 0.05 : top + 0.012;
    for (let i = 0; i < 12; i++) {
      const s = add(g, part(G.torus(0.006, 0.0022, Math.PI * 1.4, 10), '#5A3422', false), (rand() - 0.5) * 0.12, y + rand() * 0.008, (rand() - 0.5) * 0.12);
      s.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    }
  }
};

T.skillet = (g, p, c) => {
  const { P, rand } = c;
  const iron = '#6E4A3A';
  board(g, 0.38, 0.3);
  add(g, base(part(G.lathe([V(0.0005, 0), V(0.14, 0), V(0.155, 0.01), V(0.165, 0.06), V(0.158, 0.064), V(0.146, 0.02), V(0.0005, 0.016)], 40), iron)), 0, 0.02, 0);
  const handle = add(g, base(part(G.box(0.15, 0.028, 0.042, 0.013), iron)), 0.225, 0.07, 0);
  handle.rotation.z = 0.12;
  add(g, base(part(G.torus(0.012, 0.005, TAU, 12), iron, 'thin')), 0.3, 0.079, 0).rotation.x = Math.PI / 2;
  add(g, part(G.cyl(0.143, 0.143, 0.02, 0.006), P(p.fill), false), 0, 0.06, 0);
  // peach slices bubbling between the biscuits
  for (let i = 0; i < 9; i++) {
    const a = rand() * TAU, d = 0.03 + rand() * 0.09;
    const s = add(g, part(G.torus(0.014, 0.006, Math.PI, 10), P('#F9A85A'), 'thin'), Math.cos(a) * d, 0.072, Math.sin(a) * d);
    s.rotation.set(Math.PI / 2, 0, a);
  }
  c.F(g, 'biscuits', (f) => {
    for (let i = 0; i < 7; i++) {
      const a = (i / 6) * TAU + 0.2, r = i === 6 ? 0 : 0.085;
      const b = add(f, part(lumpyGeo(0.036, i + 2, 3, 1.4), P(p.top), 'thin'), Math.cos(a) * r, 0.084, Math.sin(a) * r);
      b.scale.y = 0.6;
      if (!c.raw) {
        const tan = add(b, part(lumpyGeo(0.026, i + 9, 2, 1.2), P(mixHex(p.top, '#A8612E', 0.35)), false), 0, 0.016, 0);
        tan.scale.y = 0.55;
      }
      dotsOn(b, rand, 8, 0, 0.036, 0, 0.022, 0.022, '#FFF3DC', 0.004);
    }
  }, 'pieces');
};

T.dish = (g, p, c) => {
  const { P, rand } = c;
  // a deep baking dish with a rolled rim and two little handles
  add(g, base(part(G.box(0.34, 0.075, 0.24, 0.035), p.dish)), 0, 0.0375, 0);
  add(g, base(part(G.box(0.36, 0.018, 0.26, 0.009), mixHex(p.dish, '#FFFBF0', 0.35), 'thin')), 0, 0.074, 0);
  for (const sx of [-1, 1]) add(g, base(part(G.box(0.03, 0.016, 0.1, 0.008), p.dish, 'thin')), sx * 0.19, 0.066, 0);
  const fillF = c.F(g, 'fill', (f) => {
    add(f, part(G.box(0.3, 0.024, 0.2, 0.01), P(p.fill), false), 0, 0.072, 0);
    if (p.cubes) {
      for (let i = 0; i < 12; i++) {
        const cb = add(f, part(G.box(0.045, 0.035, 0.045, 0.012), P('#E0A050'), 'thin'), -0.11 + (i % 4) * 0.073, 0.088, -0.06 + Math.floor(i / 4) * 0.06);
        cb.rotation.set((rand() - 0.5) * 0.4, rand(), (rand() - 0.5) * 0.4);
      }
    }
  }, 'rise');
  if (p.crumbs) {
    c.F(g, 'crumble', (f) => {
      for (let k = 0; k < 6; k++) {
        const cl = add(f, new THREE.Group());
        for (let i = 0; i < 9; i++) {
          const x = -0.12 + (k % 3) * 0.12 + (rand() - 0.5) * 0.09, z = (k < 3 ? -0.045 : 0.045) + (rand() - 0.5) * 0.08;
          const crumb = add(cl, part(lumpyGeo(0.012 + (i % 3) * 0.003, 20 + i, 1), P(i % 3 ? '#F3D9A0' : '#C98A4A'), i % 2 ? 'thin' : false), x, 0.09, z);
          crumb.scale.y = 0.7;
        }
      }
    }, 'pieces');
  }
  if (p.caramel) {
    c.F(g, 'glaze', (f) => {
      for (let k = 0; k < 3; k++) {
        const pts = [];
        for (let i = 0; i <= 14; i++) pts.push([-0.13 + i * 0.0186, 0.11 + Math.sin(i * 1.7) * 0.004, -0.06 + k * 0.06 + Math.sin(i * 1.3 + k) * 0.03]);
        drizzle(f, pts, '#C0692E', 0.006);
      }
    }, 'pieces');
  }
  return fillF;
};

/** One slice of a layer cake. Layers can stack by the layering game; frosting comes from a topping, a spread step or the last layer. */
T.slice = (g, p, c) => {
  const { P, rand } = c;
  plate(g, 0.16);
  const R = 0.15, ang = 0.8;
  const root = new THREE.Group();
  root.position.set(-R * 0.42, 0.012, R * 0.28);
  g.add(root);
  const ys = [];
  let total = 0;
  for (const [, h] of p.layers) { ys.push(total); total += h; }
  const frosted = p.frostBy === 'layers' ? c.shown('layers') : p.frostBy === 'fx' ? c.shown('frost') : p.frostBy ? c.has(p.frostBy) : false;
  const topCol = frosted && p.decoTop ? p.decoTop : p.top;
  const shellCol = frosted ? (p.decoShell || p.shell) : p.shell;
  const H = total + 0.012;
  const layerPiece = (parent, i) => {
    const piece = add(parent, new THREE.Group());
    add(piece, part(wedgeGeo(R, p.layers[i][1], ang), P(p.layers[i][0]), 'mid'), 0, ys[i], 0);
    return piece;
  };
  const topPiece = (parent) => {
    const t = add(parent, new THREE.Group());
    add(t, part(wedgeGeo(shellCol ? R + 0.008 : R, 0.012, ang), P(topCol), 'mid'), 0, total, 0);
    if (shellCol) add(t, part(bandGeo(R - 0.006, R + 0.009, H - 0.002, ang), P(shellCol), 'thin'), 0, 0.001, 0);
    return t;
  };
  let finished = true;
  if (p.crustLayer) {
    // cheesecake: the crumb crust is pressed, then the creamy body smoothed on top
    c.F(root, 'crust', (f) => layerPiece(f, 0), 'rise');
    c.F(root, 'body', (f) => { for (let i = 1; i < p.layers.length; i++) layerPiece(f, i); }, 'rise');
    finished = c.done('body');
    if (finished) topPiece(root);
  } else if (p.stackFx) {
    // one round baked; the rest are stacked by the layering game, top last
    layerPiece(root, 0);
    c.F(root, 'layers', (f) => { for (let i = 1; i < p.layers.length; i++) layerPiece(f, i); topPiece(f); }, 'pieces');
    finished = c.done('layers');
  } else {
    for (let i = 0; i < p.layers.length; i++) layerPiece(root, i);
    // a spread-on frosting climbs up the sides while you spread it
    if (p.frostBy === 'fx' && c.shown('frost')) c.F(root, 'frost', (f) => topPiece(f), 'grow');
    else topPiece(root);
  }
  if (!finished) return;
  const at = (u, v) => { const a = ang * v, r = R * u; return [Math.cos(a) * r, H, -Math.sin(a) * r]; };
  if (p.coconut && p.frostBy !== 'fx') {
    c.F(root, 'frost', (f) => {
      for (let i = 0; i < 18; i++) add(f, part(G.sphere(0.004, 6, 4), '#FFFBF0', false), ...at(0.3 + rand() * 0.6, 0.15 + rand() * 0.7));
      for (let i = 0; i < 5; i++) add(f, part(G.sphere(0.009, 10, 8), '#8B4A22', 'thin'), ...at(0.35 + rand() * 0.5, 0.2 + rand() * 0.6)).scale.set(1.4, 0.5, 0.8);
    }, 'grow');
  }
  if (p.strawberries && c.has('strawberry')) {
    add(root, part(wedgeGeo(R + 0.002, 0.006, ang), '#D8404E', 'thin'), 0, H - 0.001, 0);
    for (const [u, v, r] of [[0.45, 0.5, 0.3], [0.72, 0.28, 1.4], [0.72, 0.72, 2.2]]) berryHalf(root, ...at(u, v), 1.05, r);
  }
  if (p.drip && c.has('fudge')) {
    for (let i = 0; i < 7; i++) {
      const x = 0.022 + i * 0.019, len = 0.012 + ((i * 7) % 5) * 0.006;
      add(root, part(G.capsule(0.006, len), P(p.drip), 'thin'), x, H - len / 2 - 0.004, 0.006);
    }
  }
  if (p.nuts && c.has('nuts')) {
    for (let i = 0; i < 7; i++) {
      const n = add(root, part(G.sphere(0.011, 10, 8), '#B87A45', 'thin'), ...at(0.35 + rand() * 0.5, 0.2 + rand() * 0.6));
      n.scale.set(1.3, 0.6, 0.9);
    }
  }
  if (p.crumbs && frosted) for (let i = 0; i < 14; i++) add(root, part(G.sphere(0.004, 6, 4), P(p.crumbs), false), ...at(0.3 + rand() * 0.6, 0.15 + rand() * 0.7));
  if (p.shavingTop && c.has('shavings')) {
    for (let i = 0; i < 9; i++) {
      const s = add(root, part(G.torus(0.006, 0.0022, Math.PI * 1.4, 10), '#3E2216', false), ...at(0.3 + rand() * 0.6, 0.2 + rand() * 0.6));
      s.position.y += 0.004;
      s.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    }
  }
  // a piped border along the back edge of frosted slices
  if (frosted && p.rosette !== false && (p.decoTop || p.decoShell)) {
    for (let i = 0; i < 5; i++) swirl(root, 0.012, 0.018, P(p.decoTop || p.decoShell), ...at(0.9, 0.12 + i * 0.19));
  }
};

T.cupcake = (g, p, c) => {
  plate(g, 0.12);
  add(g, part(fluted(G.cyl(0.07, 0.055, 0.075, 0.008, 72), 18, 0.035, 'liner'), stripeMat(p.liner || C.pink), 'mid'), 0, 0.05, 0);
  c.F(g, 'fill', (f) => {
    const dome = add(f, part(lumpyGeo(0.066, 5), c.P('#E4A55A'), 'mid'), 0, 0.088, 0);
    dome.scale.y = 0.5;
  }, 'rise');
  const frosted = c.F(g, 'frost', (f) => { swirl(f, 0.08, 0.11, p.frost || '#FFF3DC', 0, 0.092, 0); }, 'grow');
  const topY = frosted ? 0.2 : 0.12;
  // sprinkles are left to the generic pass, which lands them on the swirl's real surface
  if (c.has('cherry')) cherry(g, 0, topY - 0.004, 0, 0.018);
};

T.roundCake = (g, p, c) => {
  const { P } = c;
  plate(g, 0.18);
  add(g, part(G.cyl(0.15, 0.15, 0.06, 0.012), P('#F0C56A')), 0, 0.042, 0);
  add(g, part(G.cyl(0.152, 0.152, 0.014, 0.005), P('#D9822F'), 'thin'), 0, 0.072, 0);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    add(g, part(G.capsule(0.006, 0.014), P('#D9822F'), false), Math.cos(a) * 0.152, 0.06, Math.sin(a) * 0.152);
  }
  c.F(g, 'rings', (f) => {
    const spots = [[0, 0], ...[0, 1, 2, 3, 4].map((i) => [Math.cos((i / 5) * TAU + 0.3) * 0.092, Math.sin((i / 5) * TAU + 0.3) * 0.092])];
    for (const [x, z] of spots) {
      const pr = add(f, new THREE.Group(), x, 0.081, z);
      const ring = add(pr, part(G.torus(0.032, 0.011, TAU, 28), P('#FFE27A'), 'thin'));
      ring.rotation.x = Math.PI / 2;
      ring.scale.z = 0.55;
      add(pr, part(G.sphere(0.012, 14, 10), P('#D8404E'), 'thin'), 0, 0.003, 0);
    }
  }, 'pieces');
};

T.ringCake = (g, p, c) => {
  const { P, rand } = c;
  plate(g, 0.17);
  const pts = [V(0.04, 0), V(0.125, 0), V(0.135, 0.012), V(0.137, 0.1), V(0.128, 0.118), V(0.1, 0.126), V(0.06, 0.123), V(0.043, 0.113), V(0.037, 0.1), V(0.037, 0.012), V(0.04, 0)];
  add(g, part(fluted(G.lathe(pts, 96), 16, 0.045, 'ring'), P('#E4AC62')), 0, 0.012, 0);
  const crown = add(g, part(G.torus(0.085, 0.022, TAU, 48), P('#F3D08A'), 'thin'), 0, 0.128, 0);
  crown.rotation.x = Math.PI / 2;
  crown.scale.z = 0.45;
  if (c.has('powdered')) {
    for (let i = 0; i < 70; i++) {
      const a = rand() * TAU, r = 0.05 + rand() * 0.075;
      add(g, part(G.sphere(0.0035, 6, 4), '#FFFFFF', false), Math.cos(a) * r, 0.14, Math.sin(a) * r);
    }
  }
};

T.loaf = (g, p, c) => {
  const { P } = c;
  board(g, 0.36, 0.2);
  c.F(g, 'fill', (f) => {
    const loafB = add(f, part(G.box(0.22, 0.09, 0.11, 0.03), P('#E3A052')), -0.04, 0.065, 0);
    loafB.userData.noHighlight = true;
    // the split, domed top of a pound cake
    const dome = add(f, part(G.capsule(0.03, 0.15), P('#D98E42'), 'thin'), -0.04, 0.1, 0);
    dome.rotation.z = Math.PI / 2;
    dome.scale.set(1, 0.7, 1.4);
    add(f, part(G.box(0.15, 0.006, 0.014, 0.003), P('#F6D39A'), false), -0.04, 0.122, 0);
  }, 'rise');
  const sl = new THREE.Group();
  sl.position.set(0.1, 0.066, 0.01);
  sl.rotation.z = -0.35;
  g.add(sl);
  add(sl, part(G.box(0.022, 0.09, 0.11, 0.01), P('#D98E42'), 'thin'));
  add(sl, part(G.box(0.024, 0.074, 0.094, 0.008), P('#FBE3A2'), false));
  c.F(g, 'glaze', (f) => {
    const cap = add(f, part(G.box(0.2, 0.012, 0.09, 0.005), '#FFF6E6', 'thin'), -0.04, 0.124, 0);
    cap.userData.noHighlight = true;
    for (const [x, z, l] of [[-0.12, 0.05, 0.03], [-0.06, 0.052, 0.045], [0.0, 0.05, 0.028], [-0.1, -0.05, 0.035], [0.02, -0.05, 0.03]]) {
      add(f, part(G.capsule(0.007, l), '#FFF6E6', 'thin'), x, 0.11 - l / 2, z);
    }
  }, 'pieces');
};

T.shortcake = (g, p, c) => {
  const { P } = c;
  plate(g, 0.15);
  const bot = add(g, part(lumpyGeo(0.085, 3, 3, 0.5), P('#EDB86A')), 0, 0.04, 0);
  bot.scale.y = 0.38;
  c.F(g, 'layers', (f) => {
    const mid = add(f, new THREE.Group());
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      add(mid, part(G.sphere(0.024, 14, 10), '#FFFBF0', 'thin'), Math.cos(a) * 0.062, 0.066, Math.sin(a) * 0.062);
    }
    add(mid, part(G.cyl(0.07, 0.07, 0.02, 0.008), '#FFFBF0', false), 0, 0.066, 0);
    for (const a of [0.4, 2.0, 3.6, 5.2]) berry(mid, Math.cos(a) * 0.074, 0.048, Math.sin(a) * 0.074, 1.0);
    const topB = add(f, new THREE.Group());
    const t = add(topB, part(lumpyGeo(0.086, 4, 3, 0.5), P('#EDB86A')), 0, 0.09, 0);
    t.scale.y = 0.45;
    dotsOn(topB, c.rand, 10, 0, 0.125, 0, 0.05, 0.05, '#FFF3DC', 0.004);
  }, 'pieces');
  const yTop = c.shown('layers') ? 0.118 : 0.06;
  if (c.has('whipped')) swirl(g, 0.042, 0.05, '#FFFBF0', 0, yTop, 0);
  if (c.has('strawberry')) berry(g, 0.004, yTop + 0.04, 0, 1.2);
};

T.whoopie = (g, p, c) => {
  const { P } = c;
  plate(g, 0.15);
  const half = (parent, x, y, z, rz, s, top) => {
    const h = add(parent, part(lumpyGeo(0.06, top ? 7 : 6, 3, 0.4), P(top ? '#6A4029' : '#5A3422')), x, y, z);
    h.scale.set(s, s * (top ? 0.45 : 0.36), s);
    h.rotation.z = rz;
    return h;
  };
  const spots = [[-0.04, 0.012, 0.03, 0, 1], [0.055, 0.03, -0.035, 0.45, 0.9]];
  c.F(g, 'rounds', (f) => {
    for (const [x, y, z, rz, s] of spots) half(f, x, y + 0.02 * s, z, rz, s, false);
    // tops wait beside the bottoms until they're sandwiched
    if (!c.shown('sandwich')) {
      half(f, -0.08, 0.025, -0.06, 0, 0.8, true);
      half(f, 0.09, 0.025, 0.07, 0, 0.75, true);
    }
  }, 'pieces');
  c.F(g, 'frost', (f) => {
    for (const [x, y, z, rz, s] of spots) {
      const fl = add(f, part(lumpyGeo(0.055, 9, 2, 0.3), '#FFFBF0', 'thin'), x, y + 0.04 * s, z);
      fl.scale.set(s, s * 0.32, s);
      fl.rotation.z = rz;
    }
  }, 'grow');
  c.F(g, 'sandwich', (f) => {
    for (const [x, y, z, rz, s] of spots) half(f, x, y + 0.057 * s, z, rz, s, true);
  }, 'pieces');
};

T.cookies = (g, p, c) => {
  const { P, rand } = c;
  plate(g, 0.16);
  const icings = ['#F7B9C4', '#AFD6EC', '#FFE08A'];
  const spots = [[-0.05, 0.012, 0.035, 0, 0], [0.055, 0.012, 0.03, 0, 0], [0.0, 0.03, -0.035, 0.25, 0.1]];
  const cookie = (parent, [x, y, z, rx, rz], i) => {
    const ck = new THREE.Group();
    ck.position.set(x, y, z);
    ck.rotation.set(rx, rand() * 3, rz);
    parent.add(ck);
    const r = 0.065;
    const raw = c.raw;
    if (raw && p.style !== 'icing') {
      // unbaked: a round dough ball
      const ball = add(ck, part(lumpyGeo(0.038, 30 + i, 2, 0.5), P(p.base)), 0, 0.03, 0);
      ball.scale.y = 0.8;
    } else {
      add(ck, part(cookieGeo(r, 0.022, i + 1), P(p.base)), 0, 0.011, 0);
    }
    const top = raw && p.style !== 'icing' ? 0.055 : 0.026;
    if (p.style === 'chips') for (let k = 0; k < 7; k++) {
      const a = rand() * TAU, d = Math.sqrt(rand()) * (raw ? 0.025 : r * 0.75);
      add(ck, part(G.sphere(0.008, 8, 6), '#4E2C1C', 'thin'), Math.cos(a) * d, top - (raw ? 0.01 * d * 30 : 0), Math.sin(a) * d).scale.y = 0.7;
    }
    if (p.style === 'oats') {
      dotsOn(ck, rand, 6, 0, top, 0, raw ? 0.025 : r * 0.75, raw ? 0.025 : r * 0.75, '#6E3A3A', 0.008);
      dotsOn(ck, rand, 10, 0, top + 0.001, 0, raw ? 0.028 : r * 0.8, raw ? 0.028 : r * 0.8, '#FFF0C8', 0.005);
    }
    return ck;
  };
  if (p.style === 'icing' && !c.done('cut')) {
    // rolled-out dough waiting for the cutters
    c.F(g, 'dough', (f) => {
      const sheet = add(f, part(cookieGeo(0.13, 0.014, 9), P('#F3D9A6')), 0, 0.018, 0);
      sheet.scale.set(1.15, 1, 0.9);
    }, 'grow');
    c.F(g, 'cut', (f) => { spots.forEach((s, i) => cookie(f, s, i)); }, 'pieces');
    return;
  }
  const holder = p.style === 'chips' || p.style === 'oats' ? c.F(g, 'scoop', (f) => spots.forEach((s, i) => cookie(f, s, i)), 'pieces') : null;
  const cookies = holder ? holder.children : p.style === 'icing' ? c.F(g, 'cut', (f) => spots.forEach((s, i) => cookie(f, s, i)), 'pieces')?.children : spots.map((s, i) => cookie(g, s, i));
  if (!cookies) return;
  if (p.style === 'cracks') {
    c.F(g, 'sugar', (f) => {
      cookies.forEach((ck, i) => {
        const piece = add(f, new THREE.Group());
        piece.position.copy(ck.position);
        piece.rotation.copy(ck.rotation);
        for (let k = 0; k < 5; k++) {
          const cr = add(piece, part(G.box(0.03, 0.003, 0.004, 0.001), P('#B98049'), false), (rand() - 0.5) * 0.07, 0.027, (rand() - 0.5) * 0.07);
          cr.rotation.y = rand() * 3;
        }
        dotsOn(piece, rand, 18, 0, 0.027, 0, 0.055, 0.055, '#B06A33', 0.0025);
      });
    }, 'pieces');
  }
  if (p.style === 'fork') {
    c.F(g, 'fork', (f) => {
      cookies.forEach((ck) => {
        for (const ry of [0.78, -0.78]) {
          const mark = add(f, new THREE.Group());
          mark.position.copy(ck.position);
          mark.rotation.copy(ck.rotation);
          for (const d of [-0.022, 0, 0.022]) add(mark, part(G.box(0.1, 0.004, 0.006, 0.002), P('#B98049'), false), 0, 0.027, d).rotation.y = ry;
        }
      });
    }, 'pieces');
  }
  if (p.style === 'icing' && c.has('pink')) {
    cookies.forEach((ck, i) => add(ck, part(cookieGeo(0.052, 0.008, i + 4), icings[i % 3], 'thin'), 0, 0.028, 0));
  }
  if (p.style === 'icing' && c.has('sprinkles')) cookies.forEach((ck) => sprinkles(ck, rand, 9, 0, 0.037, 0, 0.04, 0.04));
};

T.bars = (g, p, c) => {
  const { P, rand } = c;
  const paper = p.style === 'fudge' || p.style === 'krispies';
  if (paper) waxPaper(g); else plate(g, 0.16);
  const y0 = paper ? 0.004 : 0.012;
  const tops = {
    brownie: (b, w, d) => {
      add(b, part(G.box(w, 0.045, d, 0.01), P('#5A3422')), 0, 0.0225, 0);
      add(b, part(G.box(w - 0.006, 0.006, d - 0.006, 0.003), P('#7B4A30'), false), 0, 0.046, 0);
      for (let i = 0; i < Math.round(w * d * 900); i++) add(b, part(G.box(0.014, 0.002, 0.003, 0.001), P('#9A6A4E'), false), (rand() - 0.5) * w * 0.8, 0.0495, (rand() - 0.5) * d * 0.8).rotation.y = rand() * 3;
    },
    lemon: (b, w, d) => {
      c.F(b, 'crust', (f) => add(f, part(G.box(w, 0.02, d, 0.008), P('#EFC984')), 0, 0.01, 0), 'rise');
      c.F(b, 'fill', (f) => add(f, part(G.box(w, 0.024, d, 0.008), P('#FFE066')), 0, 0.032, 0), 'rise');
      if (c.has('powdered')) dotsOn(b, rand, Math.round(w * d * 2800), 0, 0.045, 0, w * 0.45, d * 0.45, '#FFFFFF', 0.0035);
    },
    krispies: (b, w, d) => {
      add(b, part(G.box(w, 0.04, d, 0.012), P('#F0D08E')), 0, 0.02, 0);
      dotsOn(b, rand, Math.round(w * d * 2900), 0, 0.041, 0, w * 0.46, d * 0.46, P('#FFF3DC'), 0.005);
      dotsOn(b, rand, Math.round(w * d * 1300), 0, 0.041, 0, w * 0.46, d * 0.46, P('#C9994F'), 0.004);
    },
    fudge: (b, w, d) => {
      add(b, part(G.box(w, 0.04, d, 0.01), P('#6A3B25')), 0, 0.02, 0);
      add(b, part(G.box(w * 0.6, 0.003, 0.012, 0.0015), '#A87458', false), -w * 0.1, 0.041, -d * 0.2);
    },
  };
  const bar = (parent, x, y, z, ry, w = 0.085, d = 0.085) => {
    const b = new THREE.Group();
    b.position.set(x, y, z);
    b.rotation.y = ry;
    parent.add(b);
    tops[p.style](b, w, d);
    return b;
  };
  const cuts = p.style !== 'lemon';
  if (cuts && !c.done('cut')) {
    // one slab in the pan until it's cut into squares (live: the cut lines appear)
    const slabF = c.F(g, 'fill', (f) => bar(f, 0, y0, 0, 0.05, 0.19, 0.17), 'rise');
    const slab = slabF || (!c.shown('fill') ? null : bar(g, 0, y0, 0, 0.05, 0.19, 0.17));
    if (slab || c.shown('fill')) {
      c.F(g, 'cut', (f) => {
        const hgt = { brownie: 0.05, krispies: 0.043, fudge: 0.043 }[p.style] || 0.045;
        for (let i = 0; i < 4; i++) {
          const ln = add(f, part(G.box(i < 2 ? 0.19 : 0.004, 0.003, i < 2 ? 0.004 : 0.17, 0.0015), '#3E2216', false), i < 2 ? 0 : (i - 2.5) * 0.063, y0 + hgt, i < 2 ? (i - 0.5) * 0.057 : 0);
          ln.rotation.y = 0.05;
        }
      }, 'pieces');
    }
    return;
  }
  bar(g, -0.05, y0, 0.035, 0.1);
  bar(g, 0.055, y0, 0.025, -0.2);
  bar(g, 0.005, y0 + 0.045, -0.02, 0.35);
};

T.donuts = (g, p, c) => {
  const { P, rand } = c;
  plate(g, 0.16);
  const spots = [[-0.04, 0.012, 0.035, 0, '#FFF3DC'], [0.045, 0.045, -0.03, 0.5, '#F7B9C4']];
  const ringsF = c.F(g, 'cut', (f) => {
    for (const [x, y, z, rz] of spots) {
      const d = add(f, new THREE.Group(), x, y, z);
      d.rotation.z = rz;
      const body = add(d, part(G.torus(0.048, 0.029, TAU, 36), P('#E8A45A')), 0, 0.022, 0);
      body.rotation.x = Math.PI / 2;
      body.scale.z = 0.75;
      // a pale fried band around the middle
      const band = add(d, part(G.torus(0.077, 0.006, TAU, 36), P('#F6D39A'), false), 0, 0.022, 0);
      band.rotation.x = Math.PI / 2;
    }
  }, 'pieces');
  if (!ringsF) return;
  const donuts = ringsF.children;
  c.F(g, 'glaze', (f) => {
    spots.forEach(([, , , , col], i) => {
      const gl = add(f, new THREE.Group());
      gl.position.copy(donuts[i].position);
      gl.rotation.copy(donuts[i].rotation);
      const t = add(gl, part(G.torus(0.048, 0.03, TAU, 36), col, 'thin'), 0, 0.03, 0);
      t.rotation.x = Math.PI / 2;
      t.scale.z = 0.55;
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * TAU + 0.3, len = 0.008 + ((k * 5) % 4) * 0.004;
        add(gl, part(G.capsule(0.0065, len), col, false), Math.cos(a) * 0.074, 0.024 - len / 2, Math.sin(a) * 0.074);
      }
    });
  }, 'pieces');
  if (c.has('sprinkles')) donuts.forEach((d) => sprinkles(d, rand, 14, 0, 0, 0, 0.07, 0.07, () => 0.043));
};

T.roll = (g, p, c) => {
  const { P } = c;
  plate(g, 0.15);
  if (!c.shown('roll')) {
    c.F(g, 'dough', (f) => {
      const sheet = add(f, part(G.box(0.22, 0.014, 0.16, 0.007), P('#F3D9A6')), 0, 0.02, 0);
      sheet.userData.noHighlight = true;
      dotsOn(f, c.rand, 30, 0, 0.028, 0, 0.09, 0.06, P('#A8612E'), 0.004);
    }, 'grow');
    return;
  }
  const spiral = (off, rr, y) => {
    const pts = [];
    for (let i = 0; i <= 120; i++) {
      const t = i / 120, a = t * TAU * 2.6 + off, r = 0.012 + t * 0.07;
      pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 180, rr, 10);
  };
  c.F(g, 'roll', (f) => {
    add(f, part(spiral(0, 0.026, 0.038), P('#E8A962'), 'mid'));
    add(f, part(spiral(Math.PI, 0.012, 0.052), P('#A8612E'), false));
    add(f, part(G.sphere(0.022, 12, 10), P('#E8A962'), 'thin'), 0.082 * Math.cos(TAU * 2.6), 0.038, 0.082 * Math.sin(TAU * 2.6)).scale.set(1, 1, 0.8);
  }, 'grow');
  if (c.has('frosting')) {
    const ice = add(g, part(lumpyGeo(0.06, 12, 3, 0.4), '#FFFBF0', 'thin'), 0, 0.066, 0);
    ice.scale.set(1.05, 0.25, 1.0);
    for (const a of [0.3, 1.9, 3.4, 5.0]) add(g, part(G.capsule(0.008, 0.02), '#FFFBF0', 'thin'), Math.cos(a) * 0.06, 0.056, Math.sin(a) * 0.06);
  }
};

T.funnel = (g, p, c) => {
  const { P, rand } = c;
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
    add(g, part(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, 0.011, 8), P('#E4A558'), 'thin'));
  }
  if (c.has('powdered')) {
    dotsOn(g, rand, 120, 0, 0.045, 0, 0.11, 0.08, '#FFFFFF', 0.004);
    for (const [x, z] of [[-0.02, 0], [0.04, 0.03], [0.02, -0.03]]) {
      const pile = add(g, part(lumpyGeo(0.015, x * 100, 2, 0.5), '#FFFFFF', false), x, 0.044, z);
      pile.scale.y = 0.35;
    }
  }
};

T.fritter = (g, p, c) => {
  const { P, rand } = c;
  plate(g, 0.16);
  const spots = [[-0.035, 0.036, 0.025, 1, 1], [0.055, 0.05, -0.035, 0.8, 2]];
  c.F(g, 'shape', (f) => {
    for (const [x, y, z, s, seed] of spots) {
      const fr = add(f, new THREE.Group(), x, y, z);
      const body = add(fr, part(lumpyGeo(0.072, seed, 3, 1.4), P('#D99447')));
      body.scale.set(s, s * 0.5, s);
      for (let i = 0; i < 6; i++) {
        const a = rand() * TAU, d = rand() * 0.045 * s;
        const ch = add(fr, part(G.box(0.014, 0.01, 0.012, 0.003), P('#F7E6A8'), 'thin'), Math.cos(a) * d, 0.03 * s, Math.sin(a) * d);
        ch.rotation.y = rand() * 3;
      }
    }
  }, 'pieces');
  c.F(g, 'glaze', (f) => {
    for (const [x, y, z, s] of spots) {
      for (let i = 0; i < 3; i++) {
        const pts = [];
        for (let j = 0; j <= 6; j++) pts.push([x - 0.05 * s + j * 0.017 * s, y + 0.036 * s, z - 0.02 + i * 0.02 + Math.sin(j) * 0.006]);
        drizzle(f, pts, '#FFFBF0', 0.004);
      }
    }
  }, 'pieces');
};

T.muffin = (g, p, c) => {
  const { P, rand } = c;
  plate(g, 0.12);
  add(g, part(fluted(G.cyl(0.07, 0.055, 0.08, 0.008, 72), 18, 0.035, 'mliner'), stripeMat(C.blueDeep), 'mid'), 0, 0.052, 0);
  c.F(g, 'fill', (f) => {
    const dome = add(f, part(lumpyGeo(0.086, 9), P('#E4A55A')), 0, 0.1, 0);
    dome.scale.y = 0.7;
    for (let i = 0; i < 9; i++) {
      const a = rand() * TAU, t = 0.25 + rand() * 0.6;
      const r = Math.sin(t * 1.4) * 0.082, y = 0.1 + Math.cos(t * 1.4) * 0.062;
      add(f, part(G.sphere(0.011, 10, 8), P('#6D63B5'), 'thin'), Math.cos(a) * r, y, Math.sin(a) * r);
    }
    dotsOn(f, rand, 20, 0, 0, 0, 0.06, 0.06, P('#F3C27A'), 0.004, (x, z, d) => 0.1 + (1 - d * d) * 0.062);
  }, 'rise');
  if (c.has('powdered')) dotsOn(g, rand, 30, 0, 0, 0, 0.06, 0.06, '#FFFFFF', 0.003, (x, z, d) => 0.1 + (1 - d * d) * 0.064);
};

T.beignets = (g, p, c) => {
  const { P, rand } = c;
  plate(g, 0.16);
  if (!c.shown('cut')) {
    c.F(g, 'dough', (f) => {
      const sheet = add(f, part(G.box(0.2, 0.014, 0.16, 0.007), P('#F3D9A6')), 0, 0.02, 0);
      sheet.userData.noHighlight = true;
    }, 'grow');
    return;
  }
  const pillows = [[-0.05, 0.035, 0.3, 0.035], [0.05, 0.03, -0.4, 0.035], [0.0, -0.035, 0.1, 0.05]];
  c.F(g, 'cut', (f) => {
    for (const [x, z, ry, y] of pillows) {
      const b = add(f, part(G.box(0.075, 0.045, 0.075, 0.022), P('#E6A456')), x, y, z);
      b.rotation.y = ry;
      b.scale.set(1, 1.05, 1);
    }
  }, 'pieces');
  if (c.has('powdered')) {
    // a thick snowy dusting on each pillow, a little heap in the middle, and a sprinkle on the plate
    for (const [x, z, ry, y] of pillows) {
      const top = y + 0.0236;
      const cap = add(g, part(G.box(0.066, 0.008, 0.066, 0.004), '#FFFFFF', 'thin'), x, top + 0.001, z);
      cap.rotation.y = ry;
      const heap = add(g, part(lumpyGeo(0.017, x * 300 + 7, 2, 0.5), '#FFFFFF', false), x, top + 0.005, z);
      heap.scale.y = 0.4;
      dotsOn(g, rand, 10, x, top + 0.006, z, 0.03, 0.03, '#FFFFFF', 0.0028);
    }
    dotsOn(g, rand, 40, 0, 0.016, 0, 0.14, 0.12, '#FFFFFF', 0.003);
  }
};

function glassTulip(g) {
  return glass(g, [V(0.0005, 0), V(0.058, 0), V(0.06, 0.008), V(0.014, 0.016), V(0.011, 0.06), V(0.02, 0.07), V(0.07, 0.1), V(0.084, 0.148), V(0.079, 0.153), V(0.064, 0.106), V(0.0005, 0.078)]);
}

T.sundae = (g, p, c) => {
  const { P } = c;
  glassTulip(g);
  add(g, base(part(G.torus(0.0815, 0.004, TAU, 40), '#F2FAFC', 'thin')), 0, 0.15, 0).rotation.x = Math.PI / 2;
  add(g, base(part(G.cyl(0.058, 0.06, 0.012, 0.004), '#EAF5F8', 'thin')), 0, 0.006, 0);
  const scoops = c.F(g, 'scoops', (f) => {
    for (const [x, z, col] of [[-0.032, 0.015, '#FFF1D6'], [0.032, 0.015, '#F9C8D0'], [0, -0.03, '#7A4A30']]) add(f, part(lumpyGeo(0.045, x * 100 + 3, 3, 0.6), P(col)), x, 0.148, z);
    add(f, part(lumpyGeo(0.046, 8, 3, 0.6), P('#FFF1D6')), 0, 0.19, 0);
  }, 'pieces');
  const y = scoops ? 0.203 : 0.12;
  if (c.has('fudge')) {
    const cap = add(g, part(lumpyGeo(0.048, 13, 3, 0.4), '#4E2C1C', 'thin'), 0, y, 0);
    cap.scale.y = 0.5;
    for (const a of [0.4, 1.6, 2.9, 4.2, 5.4]) add(g, part(G.capsule(0.0075, 0.022), '#4E2C1C', 'thin'), Math.cos(a) * 0.043, y - 0.014, Math.sin(a) * 0.043);
  }
  if (c.has('whipped')) swirl(g, 0.034, 0.048, '#FFFBF0', 0, y + 0.019, 0);
  if (c.has('cherry')) cherry(g, 0, y + (c.has('whipped') ? 0.063 : 0.03), 0, 0.016);
};

T.shake = (g, p, c) => {
  const { P } = c;
  glass(g, [V(0.0005, 0), V(0.046, 0), V(0.05, 0.01), V(0.06, 0.172), V(0.057, 0.176), V(0.046, 0.012), V(0.0005, 0.01)]);
  const rim = add(g, base(part(G.torus(0.0585, 0.0045, TAU, 40), '#F2FAFC', 'thin')), 0, 0.174, 0);
  rim.rotation.x = Math.PI / 2;
  c.F(g, 'fill', (f) => {
    add(f, part(G.lathe([V(0.0005, 0.012), V(0.045, 0.012), V(0.054, 0.16), V(0.0005, 0.163)], 32), P('#F7B9C4'), 'thin'));
  }, 'rise');
  const straw = add(g, part(G.cyl(0.007, 0.007, 0.21, 0.003), stripeMat(C.pinkDeep, 1), 'thin'), 0.024, 0.2, 0.01);
  straw.rotation.z = -0.32;
  if (c.has('whipped')) swirl(g, 0.05, 0.07, '#FFFBF0', 0, 0.165, 0);
  if (c.has('cherry')) cherry(g, 0, c.has('whipped') ? 0.232 : 0.168, 0, 0.016);
};

T.trifle = (g, p, c) => {
  const { P, rand } = c;
  glass(g, [V(0.0005, 0), V(0.084, 0), V(0.088, 0.008), V(0.088, 0.17), V(0.084, 0.172), V(0.081, 0.008), V(0.0005, 0.006)]);
  add(g, base(part(G.torus(0.086, 0.004, TAU, 40), '#F2FAFC', 'thin')), 0, 0.171, 0).rotation.x = Math.PI / 2;
  const layers = [['#E4B06A', 0.022, 'wafer'], ['#FFF0B3', 0.022, 'banana'], ['#FFE9A0', 0.028, 'custard'], ['#E4B06A', 0.022, 'wafer'], ['#FFF0B3', 0.022, 'banana'], ['#FFE9A0', 0.028, 'custard']];
  let y = 0.006;
  const lf = c.F(g, 'layers', (f) => {
    for (const [col, h, kind] of layers) {
      const l = add(f, new THREE.Group());
      add(l, part(G.cyl(0.08, 0.08, h, 0.004), P(col), 'thin'), 0, y + h / 2, 0);
      if (kind === 'banana') for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU;
        const s = add(l, part(G.cyl(0.016, 0.016, 0.006, 0.002), '#FFF8D0', false), Math.cos(a) * 0.075, y + h / 2, Math.sin(a) * 0.075);
        s.rotation.set(Math.PI / 2, 0, -a + Math.PI / 2);
      }
      if (kind === 'wafer') for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU + 0.3;
        const s = add(l, part(G.cyl(0.018, 0.018, 0.006, 0.002), '#D99A55', false), Math.cos(a) * 0.076, y + h / 2, Math.sin(a) * 0.076);
        s.rotation.set(Math.PI / 2, 0, -a + Math.PI / 2);
      }
      y += h;
    }
  }, 'pieces');
  if (!lf) y = 0.006;
  if (c.has('whipped')) {
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU;
      swirl(g, 0.022, 0.03, '#FFFBF0', Math.cos(a) * 0.05, y, Math.sin(a) * 0.05);
    }
    swirl(g, 0.03, 0.042, '#FFFBF0', 0, y + 0.004, 0);
    for (const a of [0.8, 3.4]) {
      const w = add(g, part(G.cyl(0.022, 0.022, 0.006, 0.002), '#E4B06A', 'thin'), Math.cos(a) * 0.04, y + 0.04, Math.sin(a) * 0.04);
      w.rotation.set(1.1, a, 0);
    }
    for (let i = 0; i < 3; i++) bananaSlice(g, (rand() - 0.5) * 0.06, y + 0.045, (rand() - 0.5) * 0.06, 0.015, 0.4);
  }
};

T.split = (g, p, c) => {
  const { P, rand } = c;
  const boat = add(g, base(part(G.lathe([V(0.0005, 0), V(0.05, 0), V(0.07, 0.02), V(0.085, 0.05), V(0.08, 0.055), V(0.0005, 0.03)], 40), C.blue, 'mid')));
  boat.scale.set(1.9, 1, 1);
  c.F(g, 'split', (f) => {
    for (const z of [-0.046, 0.046]) {
      const b = add(f, part(G.capsule(0.019, 0.2), P('#FFE27A'), 'thin'), 0, 0.052, z);
      b.rotation.z = Math.PI / 2;
      b.scale.set(1, 1, 0.7);
      add(b, part(G.sphere(0.006, 8, 6), '#6E4A3A', false), 0, 0.12, 0);
    }
  }, 'pieces');
  const scoops = [[-0.065, '#FFF1D6'], [0, '#7A4A30'], [0.065, '#F7B9C4']];
  const sf = c.F(g, 'scoops', (f) => {
    for (const [x, col] of scoops) add(f, part(lumpyGeo(0.036, x * 100 + 5, 3, 0.6), P(col)), x, 0.07, 0);
  }, 'pieces');
  if (!sf) return;
  if (c.has('fudge')) for (const [x] of scoops) {
    const cap = add(g, part(lumpyGeo(0.037, x * 50 + 9, 3, 0.4), '#4E2C1C', 'thin'), x, 0.08, 0);
    cap.scale.y = 0.5;
  }
  if (c.has('nuts')) dotsOn(g, rand, 22, 0, 0.1, 0, 0.1, 0.02, '#C98A4A', 0.0045);
  if (c.has('cherry')) for (const [x] of scoops) cherry(g, x, 0.098, 0, 0.013);
};

T.float = (g, p, c) => {
  const { P } = c;
  glass(g, [V(0.0005, 0), V(0.055, 0), V(0.058, 0.008), V(0.06, 0.15), V(0.056, 0.155), V(0.053, 0.008), V(0.0005, 0.006)]);
  const rim = add(g, base(part(G.torus(0.058, 0.0055, TAU, 40), '#EAF5F8', 'thin')), 0, 0.152, 0);
  rim.rotation.x = Math.PI / 2;
  const handle = add(g, base(part(G.torus(0.032, 0.01, Math.PI, 20), '#EAF5F8', 'thin')), 0.058, 0.08, 0);
  handle.rotation.z = -Math.PI / 2;
  c.F(g, 'fill', (f) => {
    add(f, part(G.lathe([V(0.0005, 0.008), V(0.052, 0.008), V(0.054, 0.14), V(0.0005, 0.14)], 32), P('#8A4A22'), 'thin'));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      add(f, part(G.sphere(0.022, 14, 10), P('#FFF1D6'), 'thin'), Math.cos(a) * 0.034, 0.146, Math.sin(a) * 0.034);
    }
  }, 'rise');
  c.F(g, 'scoop', (f) => { add(f, part(lumpyGeo(0.04, 6, 3, 0.6), P('#FFF6E0')), 0, 0.172, 0); }, 'pieces');
  const straw = add(g, part(G.cyl(0.007, 0.007, 0.2, 0.003), '#E4605E', 'thin'), 0.028, 0.2, -0.01);
  straw.rotation.z = -0.3;
};

T.alaska = (g, p, c) => {
  const { P } = c;
  plate(g, 0.16);
  add(g, part(G.cyl(0.1, 0.1, 0.03, 0.01), P('#E4AC62')), 0, 0.027, 0);
  c.F(g, 'dome', (f) => {
    const dome = add(f, part(G.sphere(0.08, 32, 16, 0, TAU, 0, Math.PI / 2), P('#F9C8D0'), 'mid'), 0, 0.042, 0);
    dome.scale.y = 0.95;
  }, 'grow');
  c.F(g, 'meringue', (f) => {
    const coat = add(f, new THREE.Group());
    add(coat, part(G.sphere(0.088, 32, 16, 0, TAU, 0, Math.PI / 2), P('#FFF3DC')), 0, 0.04, 0).scale.y = 0.92;
    let k = 0;
    for (const [tilt, count, rr] of [[1.15, 9, 0.077], [0.65, 6, 0.048], [0, 1, 0]]) {
      const ringG = add(f, new THREE.Group());
      for (let i = 0; i < count; i++) {
        const a = (i / count) * TAU + k;
        const pk = add(ringG, new THREE.Group(), Math.cos(a) * rr, 0.04 + Math.cos(tilt) * 0.076, Math.sin(a) * rr);
        pk.rotation.set(Math.sin(a) * tilt, 0, -Math.cos(a) * tilt);
        swirl(pk, 0.02, 0.032, P('#FFF3DC'), 0, -0.006, 0);
        add(pk, part(G.sphere(0.006, 8, 6), P('#C9783A'), false), 0, 0.022, 0);
      }
      k += 0.3;
    }
  }, 'pieces');
};

T.sandwich = (g, p, c) => {
  const { P } = c;
  plate(g, 0.13);
  const wafer = (parent, y) => {
    const w = add(parent, part(G.box(0.13, 0.016, 0.075, 0.006), P('#4E2C1C')), 0, y, 0);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) add(w, part(G.cyl(0.004, 0.004, 0.004, 0.001, 6), '#2F1A10', false), -0.045 + i * 0.03, 0.008, -0.015 + j * 0.03);
    return w;
  };
  wafer(g, 0.02);
  c.F(g, 'sandwich', (f) => {
    const cream = add(f, new THREE.Group());
    add(cream, part(G.box(0.124, 0.032, 0.07, 0.01), P('#FFF6E0')), 0, 0.043, 0);
    wafer(add(f, new THREE.Group()), 0.066);
  }, 'pieces');
};

T.smores = (g, p, c) => {
  const { P } = c;
  board(g, 0.2, 0.16);
  const squished = c.done('squish');
  c.F(g, 'layers', (f) => {
    const l1 = add(f, new THREE.Group());
    add(l1, part(G.box(0.09, 0.014, 0.09, 0.006), P('#DDA55E')), 0, 0.027, 0);
    for (let i = 0; i < 4; i++) add(l1, part(G.sphere(0.003, 6, 4), '#B9783A', false), -0.03 + (i % 2) * 0.06, 0.035, -0.03 + Math.floor(i / 2) * 0.06);
    const l2 = add(f, new THREE.Group());
    add(l2, part(G.box(0.07, 0.012, 0.07, 0.005), P('#5A3422')), 0, 0.04, 0);
    const l3 = add(f, new THREE.Group());
    const mm = add(l3, part(G.cyl(0.036, 0.036, 0.04, 0.014), P('#FFF6F0')), 0, 0.066, 0);
    const toast = add(l3, part(G.sphere(0.037, 20, 10), P('#D9934A'), false), 0, 0.083, 0);
    toast.scale.y = 0.2;
    if (squished) {
      mm.scale.set(1.18, 0.75, 1.18);
      mm.position.y = 0.062;
      toast.position.y = 0.076;
      toast.scale.set(1.18, 0.2, 1.18);
      for (const a of [0.5, 2.6, 4.4]) add(l3, part(G.capsule(0.007, 0.012), P('#FFF6F0'), 'thin'), Math.cos(a) * 0.045, 0.056, Math.sin(a) * 0.045);
    }
    if (!c.isLive('squish')) {
      const l4 = add(f, new THREE.Group());
      const lid = add(l4, part(G.box(0.09, 0.014, 0.09, 0.006), P('#DDA55E')), 0.006, squished ? 0.088 : 0.098, 0);
      lid.rotation.set(0.04, 0.3, squished ? 0.03 : 0.12);
    }
  }, 'pieces');
  c.F(g, 'squish', (f) => {
    if (!c.isLive('squish')) return;
    const lid = add(f, part(G.box(0.09, 0.014, 0.09, 0.006), P('#DDA55E')), 0.006, 0.088, 0);
    lid.rotation.set(0.04, 0.3, 0.03);
  }, 'press');
};

T.caramelApple = (g, p, c) => {
  const { P, rand } = c;
  add(g, base(part(G.cyl(0.1, 0.1, 0.004, 0.002), '#FFFBF0', 'thin')), 0, 0.002, 0);
  const apple = add(g, part(G.lathe([V(0.0005, 0.008), V(0.03, 0.002), V(0.054, 0.02), V(0.064, 0.055), V(0.06, 0.09), V(0.045, 0.112), V(0.02, 0.114), V(0.0005, 0.106)], 40), P('#E4605E')), 0, 0.004, 0);
  apple.userData.noHighlight = true;
  add(g, part(G.cyl(0.006, 0.006, 0.12, 0.002), C.honeyLight, 'thin'), 0, 0.16, 0);
  c.F(g, 'dip', (f) => {
    add(f, part(G.lathe([V(0.0005, 0.004), V(0.032, 0.0), V(0.057, 0.018), V(0.067, 0.055), V(0.064, 0.075), V(0.06, 0.078), V(0.0005, 0.06)], 40), P('#C9782F'), 'thin'), 0, 0.002, 0);
    for (const a of [0.5, 1.7, 2.9, 4.1, 5.3]) add(f, part(G.capsule(0.008, 0.012), P('#C9782F'), false), Math.cos(a) * 0.058, 0.03, Math.sin(a) * 0.058);
    add(f, part(G.cyl(0.07, 0.07, 0.006, 0.003), P('#C9782F'), 'thin'), 0, 0.005, 0);
  }, 'rise');
  if (c.has('nuts')) {
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * TAU;
      add(g, part(G.sphere(0.006, 6, 4), '#C98A4A', false), Math.cos(a) * 0.064, 0.026 + (i % 3) * 0.008 + rand() * 0.004, Math.sin(a) * 0.064);
    }
  }
};

T.pralines = (g, p, c) => {
  const { P } = c;
  waxPaper(g);
  c.F(g, 'spoon', (f) => {
    for (const [x, z, seed, s] of [[-0.05, 0.03, 3, 1], [0.05, 0.035, 4, 0.9], [0.0, -0.045, 5, 0.95]]) {
      const pr = add(f, new THREE.Group(), x, 0.012, z);
      const b = add(pr, part(lumpyGeo(0.045, seed, 3, 1.2), P('#D89A55')));
      b.scale.set(s, s * 0.3, s);
      for (const [dx, dz, r] of [[-0.012, 0, 0.4], [0.014, 0.008, -0.6], [0, -0.016, 1.2]]) {
        const n = add(pr, part(G.sphere(0.013, 12, 8), P('#8B4A22'), 'thin'), dx, 0.013, dz);
        n.scale.set(1.4, 0.5, 0.8);
        n.rotation.y = r;
      }
    }
  }, 'pieces');
};

T.cotton = (g, p, c) => {
  const { P } = c;
  add(g, base(part(G.cyl(0.05, 0.055, 0.03, 0.01), C.honey, 'mid')), 0, 0.015, 0);
  const pts = [V(0.0005, 0), V(0.028, 0.13), V(0.026, 0.132), V(0.0005, 0.02)];
  add(g, base(part(G.lathe(pts, 24), stripeMat(C.pinkDeep, 6), 'thin')), 0, 0.01, 0);
  const cols = ['#F7B9C4', '#BFE0F0', '#F9C8D0', '#AFD6EC'];
  const puffs = [[0, 0.2, 0, 0.055], [-0.04, 0.17, 0.01, 0.04], [0.042, 0.172, -0.01, 0.04], [0.0, 0.17, 0.04, 0.04], [0.0, 0.17, -0.04, 0.04], [-0.02, 0.235, 0.0, 0.035], [0.025, 0.23, 0.01, 0.034], [0.0, 0.26, 0, 0.028]];
  c.F(g, 'floss', (f) => {
    puffs.forEach(([x, y, z, r], i) => add(f, part(lumpyGeo(r, i + 40, 3, 1.1), P(cols[i % 4]), 'thin'), x, y, z));
  }, 'pieces');
};

// ------------------------------------------------------------------ menu → model spec

const SPEC = {
  'apple-pie': ['pie', { fill: '#EDB44E', fruit: 'apple', lattice: true, sugar: true }],
  'pecan-pie': ['pie', { fill: '#B8652E', pecans: true }],
  'key-lime-pie': ['pie', { fill: '#DDEBA2', top: 'rosettes', crust: '#DDB27A', zest: true }],
  'pumpkin-pie': ['pie', { fill: '#E8893A', top: 'dollop', smooth: true, specks: '#9A5524' }],
  'cherry-pie': ['pie', { fill: '#C8384A', fruit: 'cherry', lattice: true, sugar: true }],
  'banana-cream-pie': ['pie', { fill: '#FFE9A0', top: 'mound', layered: true, shavings: true }],
  'blueberry-pie': ['pie', { fill: '#6F5AA8', topCrust: true, sugar: true, ooze: true }],
  'sweet-potato-pie': ['pie', { fill: '#D9824A', edge: '#D99550', smooth: true, specks: '#8A4A22' }],
  'mud-pie': ['pie', { fill: '#5A3422', crust: '#6E4431', top: 'mound', shavings: true }],
  'peach-cobbler': ['skillet', { fill: '#F6A55A', top: '#EFC06C' }],
  'apple-crisp': ['dish', { dish: '#AFD6EC', fill: '#D9A05B', crumbs: true }],
  'cheesecake': ['slice', { layers: [['#C98A4A', 0.018], ['#FFF1D0', 0.07]], top: '#FFF1D0', shell: '#F3D69A', crustLayer: true, strawberries: true, rosette: false }],
  'cupcake': ['cupcake', { liner: '#F7B9C4' }],
  'red-velvet': ['slice', { layers: [['#B8323F', 0.03], ['#FFF6E6', 0.012], ['#B8323F', 0.03], ['#FFF6E6', 0.012], ['#B8323F', 0.03]], top: '#B8323F', decoTop: '#FFF6E6', decoShell: '#FFF6E6', frostBy: 'frosting', stackFx: true, crumbs: '#B8323F' }],
  'boston-cream': ['slice', { layers: [['#F3D08A', 0.04], ['#FFE066', 0.022], ['#F3D08A', 0.04]], top: '#F3D08A', decoTop: '#4E2C1C', drip: '#4E2C1C', frostBy: 'fudge', stackFx: true, rosette: false }],
  'carrot-cake': ['slice', { layers: [['#D9864A', 0.035], ['#FFF6E6', 0.012], ['#D9864A', 0.035], ['#FFF6E6', 0.012]], top: '#D9864A', decoTop: '#FFF6E6', decoShell: '#FFF6E6', frostBy: 'fx', nuts: true }],
  'devils-food': ['slice', { layers: [['#4E2C1C', 0.035], ['#7A4A30', 0.015], ['#4E2C1C', 0.035], ['#7A4A30', 0.015]], top: '#4E2C1C', decoTop: '#7A4A30', decoShell: '#7A4A30', frostBy: 'layers', stackFx: true, shavingTop: true }],
  'pineapple-upside-down': ['roundCake', {}],
  'german-chocolate': ['slice', { layers: [['#6A4029', 0.035], ['#D9B27A', 0.016], ['#6A4029', 0.035], ['#D9B27A', 0.016]], top: '#D9B27A', shell: '#6A4029', coconut: true, rosette: false }],
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

// ------------------------------------------------------------------ toppings anywhere

// Toppings a template doesn't draw itself (special requests like "+ sprinkles")
// are placed on the treat's actual top surface, found by raycasting down onto it.
const ray = new THREE.Raycaster();
const DOWN = new THREE.Vector3(0, -1, 0);
const TOP_COLOR = { fudge: '#4E2C1C', caramel: '#C9782F', pink: '#F7B9C4', glaze: '#FFF6E6' };

function foodMeshes(g) {
  const list = [];
  g.traverse((o) => {
    if (!o.isMesh || o.userData.outline || o.userData.hl) return;
    if (o.material.transparent) return;
    for (let q = o; q; q = q.parent) if (q.userData.base || q.userData.topping) return;
    list.push(o);
  });
  return list;
}

function genericToppings(g, list, c) {
  if (!list.length) return;
  g.updateMatrixWorld(true);
  const meshes = foodMeshes(g);
  if (!meshes.length) return;
  const box = new THREE.Box3();
  for (const m of meshes) box.expandByObject(m);
  const cx = (box.min.x + box.max.x) / 2, cz = (box.min.z + box.max.z) / 2;
  const hx = (box.max.x - box.min.x) / 2, hz = (box.max.z - box.min.z) / 2;
  const from = new THREE.Vector3();
  const surface = (x, z) => {
    from.set(x, box.max.y + 0.1, z);
    ray.set(from, DOWN);
    ray.far = 1;
    const hit = ray.intersectObjects(meshes, false)[0];
    if (!hit) return null;
    const n = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : new THREE.Vector3(0, 1, 0);
    return { p: hit.point.clone(), n };
  };
  const hits = [];
  for (let i = 0; i < 110; i++) {
    const a = i * 2.39996, d = Math.sqrt((i + 0.5) / 110) * 0.8;
    const h = surface(cx + Math.cos(a) * d * hx, cz + Math.sin(a) * d * hz);
    if (h && h.n.y > 0.35) hits.push(h);
  }
  if (!hits.length) return;
  const central = hits.filter((h) => Math.hypot(h.p.x - cx, h.p.z - cz) < Math.max(hx, hz) * 0.45);
  const peak = (central.length ? central : hits).reduce((b, h) => (h.p.y > b.p.y ? h : b));
  const r = Math.max(0.018, Math.min(0.045, Math.min(hx, hz) * 0.42));
  const rand = c.rand;
  const pick = (n) => Array.from({ length: n }, () => hits[Math.floor(rand() * hits.length)]);
  const on = (h, lift) => h.p.clone().addScaledVector(h.n, lift);
  for (const t of list) {
    const tg = add(g, new THREE.Group());
    tg.userData.topping = t;
    if (GARNISH[t]) GARNISH[t](tg, { hits, pick, on, peak, r, rand, surface, cx, cz, hx, hz, c });
    else if (t === 'sprinkles') {
      for (const h of pick(26)) {
        const s = add(tg, part(G.capsule(0.0032, 0.009), SPR[Math.floor(rand() * SPR.length)], false), ...on(h, 0.003).toArray());
        s.rotation.set(rand() * 3, rand() * 3, rand() * 3);
      }
    } else if (t === 'powdered') {
      for (const h of pick(80)) add(tg, part(G.sphere(0.0028, 6, 4), '#FFFFFF', false), ...on(h, 0.001).toArray());
    } else if (t === 'nuts') {
      for (const h of pick(12)) add(tg, part(G.sphere(0.008, 10, 8), '#B87A45', 'thin'), ...on(h, 0.002).toArray()).scale.set(1.3, 0.6, 0.9);
    } else if (t === 'shavings') {
      for (const h of pick(10)) add(tg, part(G.torus(0.006, 0.0022, Math.PI * 1.4, 10), '#5A3422', false), ...on(h, 0.004).toArray()).rotation.set(rand() * 3, rand() * 3, rand() * 3);
    } else if (t === 'cherry') {
      cherry(tg, peak.p.x, peak.p.y - 0.003, peak.p.z, Math.min(0.018, r * 0.5));
    } else if (t === 'strawberry') {
      const spots = [peak, ...pick(2)];
      spots.forEach((h, i) => berryHalf(tg, h.p.x, h.p.y + 0.001, h.p.z, Math.min(1.05, r * 28), i * 2.1));
    } else if (t === 'whipped' || t === 'frosting') {
      swirl(tg, r, r * 1.35, t === 'whipped' ? '#FFFBF0' : '#FFF3DC', peak.p.x, peak.p.y - 0.004, peak.p.z);
    } else if (TOP_COLOR[t]) {
      // a wandering drizzle across the top
      const pts = [];
      for (let j = 0; j <= 28; j++) {
        const u = j / 28;
        const h = surface(cx + (u * 2 - 1) * hx * 0.72, cz + Math.sin(u * Math.PI * 5) * hz * 0.5);
        if (h && h.n.y > 0.2) pts.push(on(h, 0.004).toArray());
      }
      if (pts.length > 3) drizzle(tg, pts, TOP_COLOR[t], t === 'glaze' ? 0.006 : 0.0048, 'thin');
    }
  }
}

// ------------------------------------------------------------------ extensions
// The restaurant registers its dish templates, garnishes and bowl bits here.

const GARNISH = {};
// a kitchen can bring its own mixing bowl, and its own look for what's mixed in it
const BOWL = { body: null, band: null, fills: {} };
export function registerDishes({ templates = {}, spec = {}, bits = {}, garnish = {}, bowl = null }) {
  if (bowl) Object.assign(BOWL, bowl, { fills: { ...BOWL.fills, ...(bowl.fills || {}) } });
  Object.assign(T, templates);
  Object.assign(SPEC, spec);
  Object.assign(BIT, bits);
  Object.assign(GARNISH, garnish);
}
/** The shape helpers templates are built from. */
export const H = {
  add, part, base, plate, board, glass, swirl, lumpyGeo, cookieGeo, starGeo, crimpGeo, lattice, dotsOn, drizzle, smooth,
  cherry, berry, berryHalf, bananaSlice, shineDabs, fillShine, stripeMat, fluted, mixHex, rng, TAU, V,
};

// ------------------------------------------------------------------ building

function buildDessert(d, state) {
  const master = new THREE.Group();
  const [tpl, p] = SPEC[d.id];
  const hide = new Set(state.hide || []);
  const live = state.live || null;
  const tops = new Set(state.tops || []);
  const ctx = {
    P: palette(state),
    rand: rng(d.n * 31 + 7),
    raw: !!state.raw,
    noPlate: !!state.noPlate,
    handled: new Set(),
    liveGroup: null,
    done: (t) => !hide.has(t) && t !== live,
    isLive: (t) => t === live,
    shown: (t) => !hide.has(t) || t === live,
    has: (top) => { ctx.handled.add(top); return tops.has(top); },
    F: (parent, tag, fn, style = 'pieces') => {
      if (hide.has(tag) && tag !== live) return null;
      const fg = new THREE.Group();
      fg.userData.feature = tag;
      fg.userData.style = style;
      parent.add(fg);
      fn(fg);
      if (tag === live) {
        fg.userData.dynamic = true;
        ctx.liveGroup = fg;
      }
      return fg;
    },
  };
  CUR = ctx;
  try {
    T[tpl](master, p, ctx);
    genericToppings(master, [...tops].filter((t) => !ctx.handled.has(t)), ctx);
  } finally {
    CUR = null;
  }
  const fg = ctx.liveGroup;
  if (fg) {
    master.updateMatrixWorld(true);
    if (fg.userData.style === 'grow' || fg.userData.style === 'rise') {
      // anchor at the feature's base so it grows up out of the treat
      const box = new THREE.Box3().setFromObject(fg);
      if (!box.isEmpty()) {
        const a = fg.parent.worldToLocal(new THREE.Vector3((box.min.x + box.max.x) / 2, box.min.y, (box.min.z + box.max.z) / 2));
        for (const ch of fg.children) ch.position.sub(a);
        fg.position.add(a);
      }
    }
    for (const ch of fg.children) ch.userData.s0 = ch.scale.toArray();
  }
  mergeStatic(master);
  return master;
}

const modelCache = new Map();
const defaultTops = (d) => d.steps.filter((s) => s.t === 'decor').flatMap((s) => s.tops);

/**
 * A fresh (cloned) model of a dessert.
 * state: raw (unbaked), burnt (0-2), tops (toppings on it; default all of the
 * recipe's), hide (feature tags whose step isn't done), live (feature built
 * unmerged for animating), noPlate (in a pan, on a tray), bare (no toppings).
 */
export function dessertModel(d, state = {}) {
  const tops = state.tops ? [...state.tops] : state.bare ? [] : defaultTops(d);
  const hide = state.hide ? [...state.hide].sort() : [];
  const key = [d.id, state.raw ? 1 : 0, state.burnt || 0, tops.join('+'), hide.join('+'), state.live || '', state.noPlate ? 1 : 0].join('|');
  let master = modelCache.get(key);
  if (!master) {
    master = buildDessert(d, { ...state, tops, hide });
    modelCache.set(key, master);
    if (modelCache.size > 400) modelCache.delete(modelCache.keys().next().value);
  }
  return master.clone();
}

/** The live (animatable) feature group inside a model built with state.live, if any. */
export function liveFeature(obj) {
  let f = null;
  obj.traverse((o) => { if (!f && o.userData.feature && o.userData.dynamic) f = o; });
  return f;
}

/** Show a live feature at progress k (0–1): pieces pop in one by one, layers rise, swirls grow. */
export function featureProgress(fg, k) {
  if (!fg) return;
  k = Math.max(0, Math.min(1, k));
  const st = fg.userData.style;
  if (st === 'pieces') {
    const n = fg.children.length;
    const show = Math.min(n, Math.floor(k * n + 1e-6));
    fg.children.forEach((ch, i) => {
      const on = i < show;
      if (on && !ch.visible) ch.userData.pop = 1;
      if (on && ch.userData.pop === undefined) ch.userData.pop = 0;
      ch.visible = on;
    });
  } else if (st === 'grow') {
    const e = Math.max(0.04, k);
    fg.scale.set(0.5 + 0.5 * e, e, 0.5 + 0.5 * e);
  } else if (st === 'rise') {
    fg.scale.set(1, Math.max(0.03, k), 1);
  } else if (st === 'press') {
    if (fg.userData.y0 === undefined) fg.userData.y0 = fg.position.y;
    fg.position.y = fg.userData.y0 + (1 - k) * 0.022;
  }
}

/** Per-frame bounce for pieces that just appeared. */
export function featureTick(fg, dt) {
  if (!fg) return;
  for (const ch of fg.children) {
    const pop = ch.userData.pop || 0;
    if (pop <= 0 || !ch.userData.s0) continue;
    ch.userData.pop = Math.max(0, pop - dt * 4);
    const e = 1 - ch.userData.pop;
    const b = 0.3 + 0.7 * e + 0.25 * Math.sin(e * Math.PI);
    const [x, y, z] = ch.userData.s0;
    ch.scale.set(x * b, y * b, z * b);
  }
}

/** Every feature tag a dessert's template can show (for checks and docs). */
export function featureTags(d) {
  const tags = new Set();
  const m = buildDessert(d, { tops: defaultTops(d), hide: [], live: null });
  m.traverse((o) => { if (o.userData.feature) tags.add(o.userData.feature); });
  return tags;
}

// ------------------------------------------------------------------ mixing bowl

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

/** A little pile of one prepped ingredient, for the cutting board. */
export function bitPile(id) {
  const g = new THREE.Group();
  addBit(g, id, 0, 0, 0, rng(id.length * 7 + 3));
  mergeStatic(g);
  return g;
}

/** The main color of an ingredient once it's in the bowl. */
export function bitColor(id) {
  const b = BIT[id];
  if (!b) return '#FFF3DC';
  if (b[0] === 'egg') return '#FFC940';
  if (b[0] === 'strawberries') return '#E4605E';
  return b[1];
}

/** The mixing bowl you carry while gathering: each ingredient in its own little pile, or batter once mixed. */
export function bowlModel(ids = [], batter = null, d = null) {
  const g = new THREE.Group();
  const pts = [V(0.0005, 0), V(0.085, 0), V(0.125, 0.03), V(0.152, 0.08), V(0.158, 0.1), V(0.148, 0.102), V(0.14, 0.082), V(0.115, 0.036), V(0.078, 0.013), V(0.0005, 0.013)];
  add(g, part(G.lathe(pts, 28), BOWL.body || C.cream2, 'mid'));
  const band = add(g, part(G.torus(0.152, 0.008, TAU, 28), BOWL.band || C.pinkDeep, false), 0, 0.09, 0);
  band.rotation.x = Math.PI / 2;
  const rand = rng(ids.length * 13 + 5);
  const liquids = ids.filter((id) => BIT[id] && BIT[id][0] === 'liquid');
  const solids = ids.filter((id) => !liquids.includes(id));
  let floor = 0.014;
  const fill = batter && d && BOWL.fills[d.id];
  if (fill) {
    // something that isn't a batter: noodles, a ball of dough, a pan of rice
    fill(g, rand);
    floor = 0.07;
  } else if (batter) {
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
