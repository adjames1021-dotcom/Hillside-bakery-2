// Lantern Cliff in 3D: the pantry's ingredients (on the shelf, on the cutting
// board, and in the mixing bowl), every dish on its fine-dining plate, and the
// garnishes. Each dish tags the parts its steps add, so the station builds them live.
import * as THREE from 'three';
import { G, C, mk } from './toon.js';
import { H, registerDishes } from './dessert3d.js';
import {
  registerIngredientModels, curvedLabel, sack3d, glassJar, crate3d, scatter, fruit, bowl3d, berryBasket,
} from './ingredients.js';

const { add, part, base, swirl, lumpyGeo, dotsOn, drizzle, mixHex, TAU, V } = H;
const small = { outline: 'thin' };
const v2 = (pts) => pts.map(([x, y]) => new THREE.Vector2(x, y));

// ------------------------------------------------------------------ produce shapes

function tomato(r = 0.04, col = '#E4483E') {
  const g = new THREE.Group();
  const b = add(g, mk(G.sphere(r, 20, 14), col, small), 0, r * 0.85, 0);
  b.scale.set(1, 0.85, 1);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    const s = add(g, mk(G.capsule(r * 0.08, r * 0.35), '#5E8F3E', { outline: false }), Math.cos(a) * r * 0.2, r * 1.62, Math.sin(a) * r * 0.2);
    s.rotation.set(Math.sin(a) * 1.3, 0, -Math.cos(a) * 1.3);
  }
  add(g, mk(G.cyl(r * 0.08, r * 0.1, r * 0.25, r * 0.03, 8), '#5E8F3E', small), 0, r * 1.72, 0);
  const shine = add(g, mk(G.sphere(r * 0.18, 8, 6), '#FF9A88', { outline: false }), -r * 0.4, r * 1.25, r * 0.45);
  shine.scale.set(1, 0.6, 1);
  shine.userData.noHighlight = true;
  return g;
}

// garlic: a ribbed bulb with a papery tip
const garlicGeo = (() => {
  let g = null;
  return () => {
    if (g) return g;
    g = new THREE.LatheGeometry(v2([[0.0005, 0], [0.018, 0.002], [0.034, 0.014], [0.04, 0.032], [0.034, 0.05], [0.016, 0.064], [0.006, 0.074], [0.0005, 0.08]]), 32);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      const k = 1 + 0.07 * Math.cos(8 * Math.atan2(z, x));
      p.setX(i, x * k);
      p.setZ(i, z * k);
    }
    g.computeVertexNormals();
    return g;
  };
})();
function garlic(s = 1) {
  const g = new THREE.Group();
  const b = add(g, mk(garlicGeo(), '#F6EEDC', small));
  b.scale.setScalar(s);
  add(g, mk(G.capsule(0.0035 * s, 0.014 * s), '#E3D3B0', { outline: false }), 0, 0.085 * s, 0);
  return g;
}

function onion(s = 1, col = '#D9A05B') {
  const g = new THREE.Group();
  add(g, mk(G.lathe(v2([[0.0005, 0], [0.02, 0.003], [0.04, 0.02], [0.046, 0.042], [0.038, 0.064], [0.016, 0.082], [0.006, 0.094], [0.0005, 0.098]].map(([x, y]) => [x * s, y * s])), 28), col, small));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    const line = add(g, mk(G.capsule(0.0018 * s, 0.05 * s), mixHex(col, '#8A5A3B', 0.4), { outline: false }), Math.cos(a) * 0.04 * s, 0.045 * s, Math.sin(a) * 0.04 * s);
    line.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3);
  }
  return g;
}

function potato(s = 1, seed = 1, col = '#C9965A') {
  const p = mk(lumpyGeo(0.035 * s, seed, 2, 1.4), col, small);
  p.scale.set(1.3, 0.8, 0.95);
  p.position.y = 0.026 * s;
  const g = new THREE.Group();
  g.add(p);
  for (let i = 0; i < 3; i++) {
    const e = add(g, mk(G.sphere(0.003 * s, 6, 4), '#8A5A3B', { outline: false }), (i - 1) * 0.02 * s, 0.05 * s, Math.sin(i * 2 + seed) * 0.012 * s);
    e.userData.noHighlight = true;
  }
  return g;
}

function mushroom(s = 1, cap = '#C9A27A') {
  const g = new THREE.Group();
  add(g, mk(G.cyl(0.012 * s, 0.015 * s, 0.035 * s, 0.006, 12), '#F3E6CC', small), 0, 0.0175 * s, 0);
  const c = add(g, mk(G.sphere(0.03 * s, 18, 10), cap, small), 0, 0.034 * s, 0);
  c.scale.y = 0.6;
  const gill = add(g, mk(G.cyl(0.026 * s, 0.026 * s, 0.004, 0.002, 18), '#E9D2B0', { outline: false }), 0, 0.032 * s, 0);
  gill.userData.noHighlight = true;
  return g;
}

function basilLeaf(s = 1, col = '#5E9F4E') {
  const l = mk(G.sphere(0.02 * s, 12, 8), col, small);
  l.scale.set(1.5, 0.22, 0.85);
  return l;
}

function shrimp(s = 1, col = '#F4956A') {
  const g = new THREE.Group();
  const body = add(g, mk(G.torus(0.022 * s, 0.009 * s, Math.PI * 1.25, 18), col, small), 0, 0.009 * s, 0);
  body.rotation.x = Math.PI / 2;
  for (let i = 0; i < 4; i++) {
    const a = 0.3 + i * 0.85;
    const band = add(g, mk(G.torus(0.0092 * s, 0.0016 * s, Math.PI * 2, 10), mixHex(col, '#FFFBF0', 0.45), { outline: false }), Math.cos(a) * 0.022 * s, 0.009 * s, -Math.sin(a) * 0.022 * s);
    band.rotation.y = a;
  }
  const tail = add(g, mk(G.sphere(0.008 * s, 8, 6), mixHex(col, '#C8402E', 0.3), small), Math.cos(Math.PI * 1.3) * 0.022 * s, 0.009 * s, -Math.sin(Math.PI * 1.3) * 0.022 * s);
  tail.scale.set(1.4, 0.4, 1);
  return g;
}

function fillet(len = 0.13, col = '#F6A07E', skin = null) {
  const g = new THREE.Group();
  const f = add(g, mk(G.box(len, 0.03, len * 0.42, 0.013), col, small), 0, 0.015, 0);
  f.scale.set(1, 1, 1);
  for (let i = 0; i < 4; i++) {
    const ln = add(g, mk(G.box(0.003, 0.002, len * 0.36, 0.001), mixHex(col, '#FFFBF0', 0.55), { outline: false }), -len * 0.3 + i * len * 0.2, 0.0305, 0);
    ln.rotation.y = 0.5;
    ln.userData.noHighlight = true;
  }
  if (skin) add(g, mk(G.box(len * 1.01, 0.008, len * 0.43, 0.004), skin, { outline: false }), 0, 0.004, 0);
  return g;
}

function steak(s = 1, col = '#D8606A', seared = false) {
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-0.06, -0.02);
  shape.quadraticCurveTo(-0.055, -0.045, 0.0, -0.042);
  shape.quadraticCurveTo(0.065, -0.04, 0.062, 0.0);
  shape.quadraticCurveTo(0.058, 0.04, 0.0, 0.038);
  shape.quadraticCurveTo(-0.07, 0.035, -0.06, -0.02);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.022, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 12 });
  geo.rotateX(-Math.PI / 2);
  const m = add(g, mk(geo, seared ? '#8A4A2E' : col, small), 0, 0.006, 0);
  m.scale.setScalar(s);
  if (seared) {
    for (let i = 0; i < 4; i++) {
      const mark = add(g, mk(G.box(0.006, 0.002, 0.07, 0.001), '#4E2A1A', { outline: false }), (-0.035 + i * 0.024) * s, 0.0345 * s, 0);
      mark.rotation.y = 0.6;
      mark.userData.noHighlight = true;
    }
  } else {
    const fat = add(g, mk(G.box(0.004, 0.002, 0.05, 0.001), '#F5D2CC', { outline: false }), 0.01 * s, 0.0345 * s, 0);
    fat.rotation.y = 0.3;
  }
  return g;
}

function wholeChicken(s = 1, col = '#F3D2A8') {
  const g = new THREE.Group();
  const body = add(g, mk(G.sphere(0.055 * s, 22, 14), col, { outline: 'mid' }), 0, 0.042 * s, 0);
  body.scale.set(1.15, 0.78, 0.95);
  for (const sx of [-1, 1]) {
    const leg = add(g, mk(G.sphere(0.024 * s, 14, 10), col, small), sx * 0.045 * s, 0.038 * s, 0.035 * s);
    leg.scale.set(1, 0.8, 1.4);
    leg.rotation.y = sx * 0.5;
    add(g, mk(G.sphere(0.008 * s, 8, 6), '#FFFBF0', small), sx * 0.052 * s, 0.045 * s, 0.062 * s);
  }
  return g;
}

// ------------------------------------------------------------------ shelf models

function trayOfIce(w = 0.36, d = 0.24) {
  const g = new THREE.Group();
  add(g, mk(G.box(w, 0.03, d, 0.012), '#C9D4D9', { outline: 'mid' }), 0, 0.015, 0);
  for (let i = 0; i < 14; i++) {
    const cube = add(g, mk(G.box(0.022, 0.016, 0.022, 0.005), '#EAF6FA', { outline: false }), -w * 0.4 + ((i * 37) % 10) / 10 * w * 0.8, 0.035, -d * 0.35 + ((i * 53) % 10) / 10 * d * 0.7);
    cube.rotation.y = i;
  }
  return g;
}

const MODELS = {
  pasta: () => glassJar({ r: 0.085, h: 0.32, lid: '#3E5C76', key: 'jar-pasta', labelY: 0.3, inside: (g, r, h) => {
    for (let i = 0; i < 22; i++) {
      const a = i * 2.39, d = Math.sqrt((i + 0.5) / 22) * r * 0.75;
      const st = add(g, mk(G.cyl(0.0035, 0.0035, h * 0.98, 0.001, 5), i % 3 ? '#F4D58A' : '#E9C26A', { outline: false }), Math.cos(a) * d, h * 0.5, Math.sin(a) * d);
      st.rotation.set(Math.sin(a) * 0.05, 0, Math.cos(a) * 0.05);
    }
  } }),
  rice: () => sack3d('sack-rice', '#E6D3A8', '#FFFBF0', (g) => {
    for (let i = 0; i < 12; i++) {
      const gr = add(g, mk(G.capsule(0.004, 0.008), '#FFFFFF', { outline: false }), Math.cos(i * 2.4) * 0.05 * Math.sqrt(i / 12), 0.462, Math.sin(i * 2.4) * 0.05 * Math.sqrt(i / 12));
      gr.rotation.set(Math.PI / 2, i, 0);
    }
  }),
  'olive-oil': () => {
    const g = new THREE.Group();
    add(g, mk(G.lathe(v2([[0.0005, 0], [0.05, 0], [0.056, 0.014], [0.056, 0.2], [0.046, 0.235], [0.022, 0.27], [0.018, 0.33], [0.0005, 0.33]]), 28), '#8A9A2E', { outline: 'mid' }));
    add(g, mk(G.cyl(0.02, 0.018, 0.035, 0.006, 12), '#B9874A', small), 0, 0.345, 0);
    add(g, curvedLabel('bottle-oil', 0.057, 0.12), 0, 0.12, 0);
    const shine = add(g, mk(G.capsule(0.006, 0.12), '#E6F0A0', { outline: false, cast: false }), -0.04, 0.13, 0.03);
    shine.scale.z = 0.5;
    shine.userData.noHighlight = true;
    // a little dish of olives beside it
    const dish = add(g, bowl3d('#FFFBF0', 0.06), 0.12, 0, 0.04);
    for (let i = 0; i < 5; i++) add(dish, mk(G.sphere(0.012, 10, 8), '#6E7A2E', small), Math.cos(i * 1.3) * 0.02, dish.userData.inner + 0.012, Math.sin(i * 1.3) * 0.02).scale.set(1, 0.8, 1.3);
    return g;
  },
  tomatoes: () => {
    const g = bowl3d('#FFFBF0', 0.15);
    for (const [x, z, r] of [[-0.05, -0.03, 0.04], [0.05, -0.02, 0.042], [0, 0.05, 0.04], [0, -0.0, 0.036]]) add(g, tomato(r), x, g.userData.inner + (x === 0 && z === 0 ? 0.04 : 0), z);
    return g;
  },
  garlic: () => {
    const g = new THREE.Group();
    add(g, mk(G.lathe(v2([[0.0005, 0], [0.12, 0], [0.15, 0.05], [0.155, 0.06], [0.14, 0.055], [0.11, 0.012], [0.0005, 0.01]]), 28), '#E9D2B0', { outline: 'mid' }));
    for (const [x, z, s] of [[-0.05, -0.02, 1.1], [0.05, 0, 1.15], [0, 0.05, 1], [-0.01, -0.04, 1.05]]) add(g, garlic(s), x, 0.01, z);
    return g;
  },
  onions: () => {
    const g = crate3d((top) => scatter(top, 6, 3, 2, (k) => onion(1.05, k % 3 ? '#D9A05B' : '#B95A6A')));
    g.scale.setScalar(0.95);
    return g;
  },
  potatoes: () => crate3d((top) => scatter(top, 6, 3, 2, (k) => potato(1.2, k + 1))),
  mushrooms: () => berryBasket('#8A5A3B', (top) => {
    for (const [x, z, s] of [[-0.05, -0.02, 1], [0.04, -0.03, 1.1], [0, 0.03, 0.95], [0.06, 0.03, 0.85], [-0.06, 0.035, 0.9]]) add(top, mushroom(s), x, 0.0, z);
  }),
  basil: () => {
    const g = new THREE.Group();
    add(g, mk(G.lathe(v2([[0.0005, 0], [0.06, 0], [0.08, 0.1], [0.088, 0.11], [0.08, 0.112], [0.072, 0.1], [0.0005, 0.095]]), 24), C.pumpkin, { outline: 'mid' }));
    for (let i = 0; i < 14; i++) {
      const a = i * 2.4, d = 0.02 + (i % 4) * 0.014, y = 0.11 + (i % 5) * 0.025;
      const l = add(g, basilLeaf(1.2), Math.cos(a) * d, y, Math.sin(a) * d);
      l.rotation.set(0.5 * Math.cos(a), -a, 0.5 * Math.sin(a));
    }
    return g;
  },
  parmesan: () => {
    const g = new THREE.Group();
    add(g, mk(G.box(0.3, 0.025, 0.2, 0.01), C.honeyLight, { outline: 'mid' }), 0, 0.0125, 0);
    const w = new THREE.Shape();
    w.moveTo(0, 0);
    w.lineTo(0.2, 0.02);
    w.lineTo(0.18, 0.11);
    w.lineTo(0, 0.0);
    const geo = new THREE.ExtrudeGeometry(w, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2 });
    geo.rotateX(-Math.PI / 2);
    geo.translate(-0.1, 0.025, 0.05);
    add(g, mk(geo, '#FBE8B0', { outline: 'mid' }));
    // the rind
    const rind = add(g, mk(G.box(0.02, 0.1, 0.1, 0.006), '#C9963A', small), 0.085, 0.07, -0.0);
    rind.rotation.z = 0.2;
    return g;
  },
  mozzarella: () => {
    const g = bowl3d('#AFD6EC', 0.14);
    add(g, mk(G.cyl(0.11, 0.11, 0.01, 0.003, 24), '#E6F6FA', { outline: false }), 0, g.userData.inner + 0.02, 0);
    for (const [x, z] of [[-0.04, -0.02], [0.04, -0.01], [0, 0.04]]) add(g, mk(G.sphere(0.038, 18, 12), '#FFFBF0', small), x, g.userData.inner + 0.035, z);
    return g;
  },
  raspberries: () => berryBasket('#D8406A', (top) => {
    for (let i = 0; i < 12; i++) add(top, raspberry(1), Math.cos(i * 2.4) * 0.06 * Math.sqrt(i / 12), 0.006 + (i % 3) * 0.004, Math.sin(i * 2.4) * 0.045 * Math.sqrt(i / 12));
  }),
  salmon: () => {
    const g = trayOfIce();
    const f = add(g, fillet(0.24, '#F6A07E', '#C9D4D9'), 0, 0.04, 0);
    f.rotation.y = 0.15;
    const lemon = add(g, fruit(0.026, '#FFE066', { shape: 'lemon' }), 0.12, 0.03, 0.08);
    lemon.rotation.y = 0.5;
    return g;
  },
  shrimp: () => {
    const g = trayOfIce(0.3, 0.24);
    for (let i = 0; i < 7; i++) add(g, shrimp(1.5), -0.1 + (i % 4) * 0.065, 0.04 + (i > 3 ? 0.012 : 0), i > 3 ? 0.05 : -0.03).rotation.y = i * 0.9;
    return g;
  },
  steak: () => {
    const g = new THREE.Group();
    const paper = add(g, mk(G.box(0.36, 0.006, 0.26, 0.003), '#F3E6CC', small), 0, 0.003, 0);
    paper.rotation.y = 0.1;
    add(g, steak(1.6), -0.03, 0.006, -0.03).rotation.y = 0.3;
    add(g, steak(1.4), 0.07, 0.03, 0.05).rotation.y = -0.4;
    for (let i = 0; i < 2; i++) add(g, mk(G.capsule(0.004, 0.06), '#5E8F3E', { outline: false }), -0.12, 0.012, 0.08 + i * 0.012).rotation.set(Math.PI / 2, 0, 0.5);
    return g;
  },
  chicken: () => {
    const g = trayOfIce(0.3, 0.24);
    add(g, wholeChicken(1.8), 0, 0.03, 0);
    return g;
  },
};

function raspberry(s = 1) {
  const g = new THREE.Group();
  const core = add(g, mk(G.sphere(0.011 * s, 10, 8), '#C8305A', small), 0, 0.011 * s, 0);
  core.scale.y = 1.1;
  for (let i = 0; i < 9; i++) {
    const a = i * 2.39996, y = 0.004 + (i / 9) * 0.016;
    add(g, mk(G.sphere(0.0048 * s, 8, 6), '#E04A72', { outline: false }), Math.cos(a) * 0.0095 * s, y * s, Math.sin(a) * 0.0095 * s);
  }
  return g;
}

// one or two of each, for the cutting board
const PREPS = {
  tomatoes: () => {
    const g = new THREE.Group();
    add(g, tomato(0.042), -0.035, 0, 0);
    add(g, tomato(0.036), 0.04, 0, 0.02);
    return g;
  },
  garlic: () => garlic(1.4),
  onions: () => onion(1.25),
  potatoes: () => {
    const g = new THREE.Group();
    add(g, potato(1.3, 3), -0.03, 0, 0);
    add(g, potato(1.1, 5), 0.045, 0, 0.02).rotation.y = 0.8;
    return g;
  },
  mushrooms: () => {
    const g = new THREE.Group();
    for (const [x, z, s] of [[-0.03, 0, 1.2], [0.035, 0.015, 1.05], [0.0, -0.035, 0.95]]) add(g, mushroom(s), x, 0, z);
    return g;
  },
  basil: () => {
    const g = new THREE.Group();
    for (let i = 0; i < 7; i++) {
      const l = add(g, basilLeaf(1.5), Math.cos(i * 0.9) * 0.03, 0.006 + i * 0.002, Math.sin(i * 0.9) * 0.025);
      l.rotation.y = i * 0.9;
    }
    add(g, mk(G.capsule(0.003, 0.08), '#4E7F3E', { outline: false }), 0, 0.004, 0).rotation.set(Math.PI / 2, 0, 0.4);
    return g;
  },
  parmesan: () => {
    const g = MODELS.parmesan();
    g.children[0].visible = false; // no board on the board
    return g;
  },
  mozzarella: () => add(new THREE.Group(), mk(G.sphere(0.045, 20, 14), '#FFFBF0', small), 0, 0.04, 0).parent,
  salmon: () => fillet(0.2, '#F6A07E', '#C9D4D9'),
  shrimp: () => {
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++) add(g, shrimp(1.6), -0.04 + (i % 2) * 0.07, 0, -0.03 + Math.floor(i / 2) * 0.06).rotation.y = i * 1.4;
    return g;
  },
  steak: () => steak(1.7),
  chicken: () => wholeChicken(1.7),
};

registerIngredientModels(MODELS, PREPS);

// ------------------------------------------------------------------ in the mixing bowl

const BITS = {
  pasta: ['shreds', '#F4D58A'], rice: ['flakes', '#FFFBF0'], 'olive-oil': ['liquid', '#C9C04A'],
  tomatoes: ['chunks', '#E4483E', '#F07050'], garlic: ['cubes', '#FFF6E4', 0.012], onions: ['chunks', '#F6E6C8', '#E9D2A8'],
  potatoes: ['cubes', '#F6E2A8', 0.02], mushrooms: ['slices', '#D9BC98'], basil: ['flakes', '#6EAF5A'],
  parmesan: ['shreds', '#FBE8B0'], mozzarella: ['scoop', '#FFFBF0'], raspberries: ['berries', '#D8406A', 0.014],
  salmon: ['chunks', '#F6A07E', '#FFD2B8'], shrimp: ['chunks', '#F4956A', '#FFD2B8'], steak: ['chunks', '#C8505A', '#E07070'],
  chicken: ['chunks', '#F6DDB8', '#FFF0D8'],
};

// ------------------------------------------------------------------ plates and dishes

// a wide-rimmed white plate with a navy band; food sits at y = 0.014
function finePlate(g, c, r = 0.2) {
  if (c.noPlate) return null;
  const m = add(g, base(part(G.lathe([V(0.0005, 0), V(r * 0.42, 0), V(r * 0.5, 0.006), V(r * 0.66, 0.016), V(r, 0.026), V(r * 1.02, 0.031), V(r * 0.98, 0.033), V(r * 0.68, 0.022), V(r * 0.5, 0.014), V(0.0005, 0.013)], 48), '#FFFFFF', 'mid')));
  const band = add(g, base(part(G.torus(r * 0.86, 0.0026, TAU, 64), '#3E5C76', false)), 0, 0.0262, 0);
  band.rotation.x = Math.PI / 2;
  band.scale.z = 0.5;
  return m;
}

// a soup bowl on its plate; returns the inner floor height
function soupBowl(g, c, col = '#FFFFFF') {
  finePlate(g, c, 0.17);
  const y0 = c.noPlate ? 0 : 0.014;
  add(g, base(part(G.lathe([V(0.0005, 0), V(0.05, 0), V(0.058, 0.008), V(0.1, 0.042), V(0.118, 0.074), V(0.113, 0.078), V(0.097, 0.046), V(0.055, 0.017), V(0.0005, 0.015)], 40), col, 'mid')), 0, y0, 0);
  return y0 + 0.015;
}

function soupFill(f, y, col, P) {
  add(f, part(G.lathe([V(0.0005, 0), V(0.04, 0), V(0.075, 0.02), V(0.094, 0.04), V(0.097, 0.046), V(0.0005, 0.048)], 36), P(col), false), 0, y, 0);
}

function twirlNest(f, y, col, sauce, P, r = 0.07) {
  for (let i = 0; i < 4; i++) {
    const ring = add(f, part(G.torus(r - i * 0.014, 0.011, TAU, 40), P(i % 2 ? col : mixHex(col, '#FFFBF0', 0.2)), 'thin'), 0, y + 0.011 + i * 0.012, 0);
    ring.rotation.x = Math.PI / 2;
    ring.rotation.z = i;
  }
  if (sauce) {
    const s = add(f, part(G.sphere(0.04, 20, 10), P(sauce), 'thin'), 0, y + 0.05, 0);
    s.scale.y = 0.4;
  }
}

function ramekin(g, y, col = '#FFFFFF', r = 0.06, h = 0.05) {
  const m = add(g, base(part(G.lathe([V(0.0005, 0), V(r, 0), V(r * 1.03, 0.006), V(r * 1.03, h), V(r * 0.98, h + 0.003), V(r * 0.9, h), V(r * 0.9, 0.008), V(0.0005, 0.008)], 40), col, 'mid')), 0, y, 0);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    const rib = add(g, base(part(G.box(0.004, h * 0.8, 0.003, 0.0012), mixHex(col, '#C9D4D9', 0.25), false)), Math.cos(a) * r * 1.035, y + h * 0.5, Math.sin(a) * r * 1.035);
    rib.rotation.y = -a;
  }
  return m;
}

const T = {};

T.caprese = (g, p, c) => {
  const { P } = c;
  finePlate(g, c);
  c.F(g, 'slices', (f) => {
    for (let i = 0; i < 6; i++) {
      const a = Math.PI * (0.15 + i * 0.28);
      const x = Math.cos(a) * 0.09, z = Math.sin(a) * 0.05 - 0.01;
      const kind = i % 3;
      const piece = add(f, new THREE.Group(), x, 0.016 + i * 0.003, z);
      piece.rotation.set(-0.25, -a, 0);
      if (kind === 0) {
        add(piece, part(G.cyl(0.032, 0.032, 0.012, 0.004, 24), P('#E4483E'), 'thin'));
        for (let k = 0; k < 4; k++) add(piece, part(G.sphere(0.006, 8, 6), P('#F6C060'), false), Math.cos(k * 1.6) * 0.016, 0.006, Math.sin(k * 1.6) * 0.016).scale.y = 0.4;
      } else if (kind === 1) add(piece, part(G.cyl(0.03, 0.03, 0.014, 0.005, 24), '#FFFBF0', 'thin'));
      else for (const s of [-1, 1]) add(piece, basilLeaf(1.3), s * 0.01, 0.006, 0).rotation.y = s * 0.6;
    }
  }, 'pieces');
};

T.soup = (g, p, c) => {
  const { P } = c;
  const y = soupBowl(g, c);
  c.F(g, 'soup', (f) => {
    soupFill(f, y, p.soup, P);
    if (p.bits) for (let i = 0; i < 6; i++) add(f, part(G.sphere(0.009, 8, 6), P(p.bits), false), Math.cos(i * 1.1) * 0.05, y + 0.048, Math.sin(i * 1.1) * 0.05).scale.y = 0.5;
  }, 'rise');
  if (p.toast && !c.noPlate) {
    const t = add(g, part(G.box(0.07, 0.014, 0.04, 0.008), P('#D9984A'), 'thin'), 0.13, 0.03, 0.05);
    t.rotation.set(0.1, 0.5, 0.15);
  }
};

T.bruschetta = (g, p, c) => {
  const { P, rand } = c;
  finePlate(g, c);
  const spots = [[-0.08, 0.02, 0.3], [-0.025, -0.035, -0.2], [0.035, 0.03, 0.1], [0.09, -0.02, -0.4]];
  c.F(g, 'toasts', (f) => {
    for (const [x, z, ry] of spots) {
      const t = add(f, part(G.cyl(0.032, 0.032, 0.016, 0.006, 20), P(c.done('toasts') && !c.raw ? '#D9984A' : '#F0C886'), 'thin'), x, 0.022, z);
      t.scale.set(1.25, 1, 0.75);
      t.rotation.y = ry;
      add(t, part(G.cyl(0.026, 0.026, 0.017, 0.004, 20), P('#F6D39A'), false), 0, 0.001, 0);
    }
  }, 'pieces');
  c.F(g, 'topping', (f) => {
    for (const [x, z] of spots) {
      const heap = add(f, new THREE.Group(), x, 0.031, z);
      for (let i = 0; i < 6; i++) add(heap, part(G.box(0.012, 0.01, 0.012, 0.003), '#E4483E', i % 2 ? 'thin' : false), (rand() - 0.5) * 0.04, 0.004 + (i % 3) * 0.004, (rand() - 0.5) * 0.025).rotation.y = rand() * 3;
      add(heap, basilLeaf(0.6), 0, 0.012, 0);
    }
  }, 'pieces');
};

T.spaghetti = (g, p, c) => {
  const { P } = c;
  finePlate(g, c);
  if (c.shown('nest')) c.F(g, 'nest', (f) => twirlNest(f, 0.014, p.pasta, p.sauce, P), 'grow');
  else {
    // tossed noodles, messy, before they're twirled
    c.F(g, 'sauce', (f) => {
      for (let i = 0; i < 9; i++) {
        const r = add(f, part(G.torus(0.035 + (i % 3) * 0.012, 0.007, TAU * 0.7, 24), P(p.pasta), 'thin'), (i % 3 - 1) * 0.03, 0.022 + Math.floor(i / 3) * 0.008, (Math.floor(i / 3) - 1) * 0.025);
        r.rotation.set(Math.PI / 2 + (i % 2 ? 0.3 : -0.3), 0, i);
      }
      if (p.sauce) add(f, part(G.sphere(0.05, 20, 10), P(p.sauce), false), 0, 0.03, 0).scale.y = 0.3;
    }, 'grow');
  }
};

T.fettuccine = (g, p, c) => {
  const { P } = c;
  finePlate(g, c);
  if (p.nest && c.shown('nest')) {
    c.F(g, 'nest', (f) => twirlNest(f, 0.014, p.pasta, p.sauce, P, 0.075), 'grow');
    return;
  }
  if (c.shown('sheet') && !c.done(p.cut)) {
    c.F(g, 'sheet', (f) => add(f, part(G.box(0.24, 0.006, 0.16, 0.003), P('#F6E2A8'), 'thin'), 0, 0.018, 0), 'grow');
  }
  c.F(g, p.cut, (f) => {
    if (p.cut === 'ribbons') {
      for (let i = 0; i < 5; i++) add(f, part(G.box(0.024, 0.008, 0.17, 0.003), P('#F6E2A8'), 'thin'), -0.06 + i * 0.03, 0.025, 0).rotation.y = (i - 2) * 0.05;
    } else {
      for (let i = 0; i < 6; i++) {
        const rv = add(f, part(G.box(0.05, 0.016, 0.05, 0.008), P('#F6E2A8'), 'thin'), -0.06 + (i % 3) * 0.06, 0.024, -0.03 + Math.floor(i / 3) * 0.06);
        rv.rotation.y = i * 0.3;
        add(rv, part(G.sphere(0.017, 10, 8), P('#FFF6E4'), false), 0, 0.006, 0).scale.y = 0.5;
      }
    }
  }, 'pieces');
};

T.risotto = (g, p, c) => {
  const { P, rand } = c;
  finePlate(g, c);
  c.F(g, 'risotto', (f) => {
    const m = add(f, part(lumpyGeo(0.085, 7, 3, 0.5), P('#F3E3B8'), 'thin'), 0, 0.014, 0);
    m.scale.y = 0.3;
    dotsOn(f, rand, 40, 0, 0.038, 0, 0.07, 0.07, '#FFFBF0', 0.003, (x, z, d) => 0.014 + 0.024 * (1 - d * d));
    for (let i = 0; i < 6; i++) {
      const a = i * 1.1, d = 0.025 + (i % 3) * 0.015;
      const mu = add(f, mushroomSlice(), Math.cos(a) * d, 0.014 + 0.025 * (1 - (d / 0.085) ** 2), Math.sin(a) * d);
      mu.rotation.set(-0.2, a, 0);
    }
  }, 'rise');
};

function mushroomSlice() {
  const g = new THREE.Group();
  const cap = add(g, part(G.cyl(0.016, 0.016, 0.006, 0.002, 16, ), '#A8744A', 'thin'), 0, 0.003, 0);
  cap.scale.set(1, 1, 0.7);
  add(g, part(G.box(0.008, 0.0065, 0.016, 0.002), '#E9D2B0', false), 0, 0.003, 0.004);
  return g;
}

T.salmon = (g, p, c) => {
  const { P } = c;
  finePlate(g, c);
  c.F(g, 'puree', (f) => {
    const pts = [];
    for (let i = 0; i <= 12; i++) pts.push([-0.12 + i * 0.02, 0.022, Math.sin(i * 0.5) * 0.02 + 0.03]);
    drizzle(f, pts, '#F6E6C0', 0.017, 'thin');
  }, 'grow');
  const raw = c.raw;
  const fl = add(g, fillet(0.15, raw ? '#F6A07E' : '#F08A5A', raw ? null : '#B9643A'), 0, c.noPlate ? 0.004 : 0.03, -0.01);
  fl.rotation.y = 0.2;
};

T.shrimpPlate = (g, p, c) => {
  const { P } = c;
  finePlate(g, c);
  const pool = add(g, part(G.cyl(0.1, 0.1, 0.006, 0.003, 32), P('#F6D06A'), false), 0, c.noPlate ? 0.003 : 0.016, 0);
  pool.scale.z = 0.8;
  for (let i = 0; i < 7; i++) {
    const a = i * 0.9;
    const s = add(g, shrimp(1.5, c.raw ? '#B9B0A8' : '#F4956A'), Math.cos(a) * 0.055, (c.noPlate ? 0.006 : 0.02) + (i % 2) * 0.006, Math.sin(a) * 0.045);
    s.rotation.y = -a + 1.2;
  }
  for (let i = 0; i < 6; i++) add(g, part(G.box(0.008, 0.006, 0.008, 0.002), '#FFF6E4', false), Math.cos(i * 2) * 0.07, c.noPlate ? 0.01 : 0.024, Math.sin(i * 2) * 0.05);
};

T.paella = (g, p, c) => {
  const { P, rand } = c;
  add(g, base(part(G.lathe([V(0.0005, 0), V(0.17, 0), V(0.19, 0.008), V(0.2, 0.04), V(0.193, 0.042), V(0.18, 0.012), V(0.0005, 0.01)], 48), '#3A3A44', 'mid')));
  for (const sx of [-1, 1]) {
    const h = add(g, base(part(G.torus(0.025, 0.007, TAU, 16), '#3A3A44', 'thin')), sx * 0.215, 0.038, 0);
    h.rotation.x = Math.PI / 2;
    h.scale.x = 1.3;
  }
  add(g, part(G.cyl(0.18, 0.18, 0.02, 0.006, 40), P('#F2B640'), false), 0, 0.02, 0);
  dotsOn(g, rand, 120, 0, 0.031, 0, 0.17, 0.17, P('#FFE08A'), 0.0032);
  for (let i = 0; i < 10; i++) add(g, part(G.box(0.014, 0.008, 0.014, 0.003), P('#E4483E'), false), Math.cos(i * 2.3) * 0.12 * Math.sqrt((i + 1) / 10), 0.033, Math.sin(i * 2.3) * 0.12 * Math.sqrt((i + 1) / 10));
  for (let i = 0; i < 8; i++) add(g, part(G.sphere(0.006, 8, 6), '#7EAF4E', false), Math.cos(i * 1.7 + 1) * 0.1, 0.034, Math.sin(i * 1.7 + 1) * 0.1);
  c.F(g, 'shrimp', (f) => {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU + 0.3;
      const s = add(f, shrimp(1.7), Math.cos(a) * 0.1, 0.034, Math.sin(a) * 0.1);
      s.rotation.y = -a;
    }
  }, 'pieces');
};

T.fishChips = (g, p, c) => {
  const { P, rand } = c;
  finePlate(g, c);
  const y = c.noPlate ? 0.004 : 0.016;
  const fish = add(g, part(lumpyGeo(0.05, 3, 3, 0.6), P(c.raw ? '#F3E3B8' : '#E6A040'), 'mid'), -0.05, y + 0.02, 0);
  fish.scale.set(1.8, 0.5, 0.9);
  fish.rotation.y = 0.2;
  dotsOn(g, rand, 16, -0.05, y + 0.04, 0, 0.07, 0.035, P('#C9842E'), 0.004);
  c.F(g, 'chips', (f) => {
    for (let i = 0; i < 5; i++) {
      const ch = add(f, part(G.box(0.016, 0.016, 0.075, 0.005), P(c.raw ? '#F6E2A8' : '#F2C060'), 'thin'), 0.06 + (i % 3) * 0.022, y + 0.008 + Math.floor(i / 3) * 0.015, -0.01 + (i % 2) * 0.03);
      ch.rotation.y = 0.3 + i * 0.25;
    }
  }, 'pieces');
};

T.steakFrites = (g, p, c) => {
  const { P } = c;
  finePlate(g, c);
  const y = c.noPlate ? 0.003 : 0.016;
  if (!c.noPlate) {
    c.F(g, 'fries', (f) => {
      for (let i = 0; i < 5; i++) {
        const ch = add(f, part(G.box(0.012, 0.012, 0.08, 0.004), P('#F2C060'), 'thin'), 0.07 + (i % 2) * 0.015, y + 0.006 + Math.floor(i / 2) * 0.011, -0.02 + (i % 3) * 0.02);
        ch.rotation.y = 0.5 + i * 0.3;
      }
    }, 'pieces');
  }
  const seared = !c.raw;
  if (c.shown('slice')) {
    c.F(g, 'slice', (f) => {
      for (let i = 0; i < 3; i++) {
        const sl = add(f, new THREE.Group(), -0.07 + i * 0.035, y + 0.012, 0);
        sl.rotation.z = -0.4;
        add(sl, part(G.box(0.028, 0.03, 0.075, 0.006), '#8A4A2E', 'thin'));
        add(sl, part(G.box(0.029, 0.018, 0.06, 0.004), '#E07070', false), 0, 0, 0);
      }
    }, 'pieces');
  } else {
    add(g, steak(1.3, '#D8606A', seared), -0.04, y, 0).rotation.y = 0.3;
  }
};

T.roastChicken = (g, p, c) => {
  const { P } = c;
  finePlate(g, c, 0.22);
  const col = c.raw ? '#F3D2A8' : '#D9903E';
  add(g, wholeChicken(1.6, col), -0.02, 0.014, 0);
  for (let i = 0; i < 5; i++) add(g, potato(0.8, i + 2, c.raw ? '#F6E2A8' : '#E9B060'), Math.cos(i * 1.25) * 0.13, 0.016, Math.sin(i * 1.25) * 0.11);
  add(g, fruit(0.02, '#FFE066', { shape: 'lemon' }), 0.1, 0.02, -0.07).rotation.y = 0.4;
  c.F(g, 'carve', (f) => {
    for (let i = 0; i < 4; i++) {
      const sl = add(f, part(G.box(0.045, 0.008, 0.03, 0.004), '#F6E6CC', 'thin'), 0.09 + (i % 2) * 0.01, 0.022 + i * 0.006, 0.03 + i * 0.012);
      sl.rotation.y = 0.6;
      add(sl, part(G.box(0.046, 0.003, 0.031, 0.001), '#D9903E', false), 0, 0.0045, 0);
    }
  }, 'pieces');
};

T.filet = (g, p, c) => {
  const { P } = c;
  finePlate(g, c);
  c.F(g, 'sauce', (f) => {
    const pool = add(f, part(G.cyl(0.085, 0.085, 0.008, 0.004, 32), P('#E3C8A0'), 'thin'), 0, 0.018, 0);
    pool.scale.z = 0.8;
    for (let i = 0; i < 5; i++) add(f, mushroomSlice(), Math.cos(i * 1.3) * 0.06, 0.022, Math.sin(i * 1.3) * 0.05).rotation.y = i;
  }, 'grow');
  const y = c.noPlate ? 0.004 : 0.024;
  const seared = !c.raw;
  const fil = add(g, part(G.cyl(0.04, 0.042, 0.045, 0.012, 28), seared ? '#7A3E26' : '#D8606A', 'mid'), 0, y + 0.022, 0);
  add(fil, part(G.cyl(0.036, 0.036, 0.004, 0.002, 28), seared ? '#9A5232' : '#E07070', false), 0, 0.023, 0);
  if (seared) for (let i = 0; i < 3; i++) add(fil, part(G.box(0.005, 0.002, 0.05, 0.001), '#4E2A1A', false), -0.015 + i * 0.015, 0.0255, 0).rotation.y = 0.6;
};

T.chickenParm = (g, p, c) => {
  const { P } = c;
  finePlate(g, c);
  const y = c.noPlate ? 0.004 : 0.016;
  if (!c.done('crumb')) {
    const raw = add(g, part(lumpyGeo(0.06, 9, 3, 0.5), '#F3D2C0', 'mid'), 0, y + 0.012, 0);
    raw.scale.set(1.3, 0.28, 0.95);
  }
  c.F(g, 'crumb', (f) => {
    const cut = add(f, part(lumpyGeo(0.064, 9, 3, 0.6), P(c.raw ? '#F0C886' : '#D9903E'), 'mid'), 0, y + 0.012, 0);
    cut.scale.set(1.3, 0.3, 0.95);
    dotsOn(f, c.rand, 20, 0, y + 0.03, 0, 0.07, 0.05, P('#C9802E'), 0.0035);
  }, 'grow');
  if (!c.noPlate) {
    c.F(g, 'cheese', (f) => {
      const sauce = add(f, part(lumpyGeo(0.05, 4, 3, 0.4), '#D8402E', false), 0, y + 0.027, 0);
      sauce.scale.set(1.25, 0.12, 0.9);
      for (const [x, z, r] of [[-0.02, -0.01, 0.024], [0.025, 0.01, 0.022], [0.0, 0.02, 0.018]]) {
        const ch = add(f, part(G.sphere(r, 14, 10), '#FFF6E4', 'thin'), x, y + 0.032, z);
        ch.scale.y = 0.3;
      }
    }, 'grow');
  }
};

T.lavaCake = (g, p, c) => {
  const { P } = c;
  finePlate(g, c);
  c.F(g, 'fill', (f) => {
    const cake = add(f, part(G.cyl(0.045, 0.05, 0.06, 0.012, 32), P('#5A3422'), 'mid'), 0, 0.044, 0);
    add(cake, part(G.cyl(0.04, 0.04, 0.004, 0.002, 28), P('#6A4029'), false), 0, 0.031, 0);
    if (!c.raw) {
      const ooze = add(f, part(lumpyGeo(0.03, 5, 2, 0.6), '#3A1E12', 'thin'), 0.05, 0.018, 0.02);
      ooze.scale.set(1.3, 0.2, 1);
    }
  }, 'rise');
};

T.cremeBrulee = (g, p, c) => {
  const { P } = c;
  finePlate(g, c);
  const y0 = c.noPlate ? 0 : 0.014;
  ramekin(g, y0, '#FFFFFF', 0.07, 0.045);
  c.F(g, 'fill', (f) => {
    add(f, part(G.cyl(0.062, 0.062, 0.03, 0.004, 32), P('#FFE8B0'), false), 0, y0 + 0.024, 0);
  }, 'rise');
  c.F(g, 'crust', (f) => {
    const top = add(f, part(G.cyl(0.062, 0.062, 0.004, 0.002, 32), '#D99A3A', 'thin'), 0, y0 + 0.041, 0);
    for (let i = 0; i < 5; i++) {
      const cr = add(top, part(G.box(0.03, 0.001, 0.002, 0.0005), '#A8612E', false), Math.cos(i * 1.4) * 0.02, 0.0025, Math.sin(i * 1.4) * 0.02);
      cr.rotation.y = i * 0.9;
    }
    add(top, part(G.sphere(0.012, 8, 6), '#F6C066', false), -0.02, 0.002, -0.015).scale.y = 0.15;
  }, 'grow');
};

T.pannaCotta = (g, p, c) => {
  const { P } = c;
  finePlate(g, c);
  const unmolded = c.done('flip') || c.isLive('flip');
  c.F(g, 'fill', (f) => {
    add(f, part(G.lathe([V(0.0005, 0), V(0.05, 0), V(0.047, 0.04), V(0.034, 0.07), V(0.0005, 0.072)], 32), '#FFF6EC', 'mid'), 0, 0.014, 0);
  }, 'rise');
  if (!unmolded) {
    // still in its dariole mold
    add(g, base(part(G.lathe([V(0.0005, 0.07), V(0.036, 0.074), V(0.05, 0.004), V(0.056, 0.0), V(0.0565, 0.004), V(0.042, 0.078), V(0.0005, 0.078)], 32), '#C9D4D9', 'mid')), 0, 0.014, 0);
  } else {
    const top = add(g, part(G.cyl(0.03, 0.034, 0.008, 0.003, 24), '#D8406A', 'thin'), 0, 0.088, 0);
    for (let i = 0; i < 3; i++) {
      const drip = add(g, part(G.capsule(0.005, 0.02), '#D8406A', false), Math.cos(i * 2.1) * 0.038, 0.072, Math.sin(i * 2.1) * 0.038);
      drip.rotation.set(Math.sin(i * 2.1) * 0.4, 0, -Math.cos(i * 2.1) * 0.4);
    }
    const pool = add(g, part(G.cyl(0.08, 0.08, 0.004, 0.002, 32), '#D8406A', false), 0, 0.016, 0);
    pool.scale.z = 0.7;
    top.userData.noHighlight = true;
  }
};

T.wellington = (g, p, c) => {
  const { P } = c;
  finePlate(g, c, 0.22);
  const y = c.noPlate ? 0.004 : 0.016;
  const sliced = c.shown('slice');
  const len = sliced ? 0.13 : 0.18;
  if (!c.shown('pastry')) {
    // the seared beef log on its own
    const beef = add(g, part(G.capsule(0.032, len - 0.06), c.raw && !c.done('pastry') ? '#C8505A' : '#7A3E26', 'mid'), -0.0, y + 0.032, 0);
    beef.rotation.z = Math.PI / 2;
  }
  c.F(g, 'pastry', (f) => {
    const log = add(f, part(G.capsule(0.045, len - 0.08), P(c.raw ? '#F3D9A0' : '#E0A050'), 'mid'), sliced ? -0.03 : 0, y + 0.045, 0);
    log.rotation.z = Math.PI / 2;
    log.scale.set(1, 1, 0.95);
  }, 'grow');
  c.F(g, 'score', (f) => {
    for (let i = 0; i < 5; i++) {
      const sc = add(f, part(G.box(0.004, 0.003, 0.06, 0.001), P('#B97A33'), false), (sliced ? -0.03 : 0) - 0.05 + i * 0.024, y + 0.09, 0);
      sc.rotation.y = 0.6;
    }
  }, 'pieces');
  if (sliced) {
    c.F(g, 'slice', (f) => {
      for (let i = 0; i < 2; i++) {
        const sl = add(f, new THREE.Group(), 0.07 + i * 0.04, y + 0.045, 0.02 * i);
        sl.rotation.z = -0.25;
        const disc = add(sl, part(G.cyl(0.045, 0.045, 0.024, 0.006, 24), '#E0A050', 'thin'));
        disc.rotation.z = Math.PI / 2;
        const mush = add(sl, part(G.cyl(0.036, 0.036, 0.026, 0.004, 24), '#7A5A3A', false));
        mush.rotation.z = Math.PI / 2;
        const meat = add(sl, part(G.cyl(0.028, 0.028, 0.028, 0.004, 24), '#E07070', false));
        meat.rotation.z = Math.PI / 2;
      }
    }, 'pieces');
  }
};

T.bouillabaisse = (g, p, c) => {
  const { P } = c;
  const y = soupBowl(g, c);
  c.F(g, 'soup', (f) => soupFill(f, y, '#E8843A', P), 'rise');
  c.F(g, 'seafood', (f) => {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + 0.4;
      const at = [Math.cos(a) * 0.045, y + 0.05, Math.sin(a) * 0.045];
      if (i % 2) add(f, shrimp(1.3), ...at).rotation.y = -a;
      else add(f, part(G.box(0.03, 0.016, 0.022, 0.006), '#F6A07E', 'thin'), ...at).rotation.y = a;
    }
  }, 'pieces');
  if (!c.noPlate) {
    const t = add(g, part(G.box(0.07, 0.014, 0.04, 0.008), P('#D9984A'), 'thin'), 0.13, 0.03, 0.05);
    t.rotation.set(0.1, 0.5, 0.15);
  }
};

const SPEC = {
  'caprese': ['caprese', {}],
  'tomato-bisque': ['soup', { soup: '#E0573E' }],
  'bruschetta': ['bruschetta', {}],
  'mushroom-soup': ['soup', { soup: '#C9A27A', bits: '#8A5A3B' }],
  'spaghetti': ['spaghetti', { pasta: '#F4D58A', sauce: '#D8402E' }],
  'fettuccine': ['fettuccine', { cut: 'ribbons', nest: true, pasta: '#F6E2A8', sauce: '#FFF3DC' }],
  'risotto': ['risotto', {}],
  'ravioli': ['fettuccine', { cut: 'ravioli', pasta: '#F6E2A8' }],
  'salmon': ['salmon', {}],
  'garlic-shrimp': ['shrimpPlate', {}],
  'paella': ['paella', {}],
  'fish-chips': ['fishChips', {}],
  'steak-frites': ['steakFrites', {}],
  'roast-chicken': ['roastChicken', {}],
  'filet': ['filet', {}],
  'chicken-parm': ['chickenParm', {}],
  'lava-cake': ['lavaCake', {}],
  'creme-brulee': ['cremeBrulee', {}],
  'panna-cotta': ['pannaCotta', {}],
  'wellington': ['wellington', {}],
  'bouillabaisse': ['bouillabaisse', {}],
};

// ------------------------------------------------------------------ garnishes

function leaves(tg, k, n, s, col) {
  for (const h of k.pick(n)) {
    const l = add(tg, basilLeaf(s, col), ...k.on(h, 0.003).toArray());
    l.rotation.set((k.rand() - 0.5) * 0.4, k.rand() * TAU, (k.rand() - 0.5) * 0.4);
  }
}
function wander(k, wiggle = 5, spread = 0.5) {
  const pts = [];
  for (let j = 0; j <= 28; j++) {
    const u = j / 28;
    const h = k.surface(k.cx + (u * 2 - 1) * k.hx * 0.72, k.cz + Math.sin(u * Math.PI * wiggle) * k.hz * spread);
    if (h && h.n.y > 0.2) pts.push(k.on(h, 0.004).toArray());
  }
  return pts;
}

const GARNISH = {
  herbs: (tg, k) => leaves(tg, k, 10, 0.45, '#6E9F4E'),
  basil: (tg, k) => {
    const at = k.on(k.peak, 0.004);
    for (let i = 0; i < 3; i++) {
      const l = add(tg, basilLeaf(1.1), at.x + Math.cos(i * 2.1) * 0.012, at.y + i * 0.002, at.z + Math.sin(i * 2.1) * 0.012);
      l.rotation.set(0.15, i * 2.1, 0);
    }
  },
  parmesan: (tg, k) => {
    for (const h of k.pick(12)) {
      const s = add(tg, part(G.box(0.014, 0.0025, 0.007, 0.001), '#FBE8B0', false), ...k.on(h, 0.003).toArray());
      s.rotation.set(k.rand() * 0.5, k.rand() * TAU, k.rand() * 0.5);
    }
  },
  pepper: (tg, k) => { for (const h of k.pick(40)) add(tg, part(G.sphere(0.0022, 5, 4), '#2E1E14', false), ...k.on(h, 0.001).toArray()); },
  sugar: (tg, k) => { for (const h of k.pick(70)) add(tg, part(G.sphere(0.0026, 6, 4), '#FFFFFF', false), ...k.on(h, 0.001).toArray()); },
  oil: (tg, k) => { const pts = wander(k, 3, 0.4); if (pts.length > 3) drizzle(tg, pts, '#C9C04A', 0.0042, false); },
  balsamic: (tg, k) => { const pts = wander(k, 6, 0.55); if (pts.length > 3) drizzle(tg, pts, '#4E2A2A', 0.0038, 'thin'); },
  sauce: (tg, k) => { const pts = wander(k, 2, 0.3); if (pts.length > 3) drizzle(tg, pts, '#6E2A22', 0.006, 'thin'); },
  cream: (tg, k) => {
    // a spiral of cream on top
    const at = k.on(k.peak, 0.003);
    const pts = [];
    for (let i = 0; i <= 30; i++) {
      const a = i * 0.45, rr = 0.004 + i * 0.0014;
      const h = k.surface(at.x + Math.cos(a) * rr, at.z + Math.sin(a) * rr);
      if (h) pts.push(k.on(h, 0.003).toArray());
    }
    if (pts.length > 3) drizzle(tg, pts, '#FFF6E4', 0.004, false);
  },
  lemon: (tg, k) => {
    const h = k.hits.reduce((b, x) => (Math.hypot(x.p.x - k.cx, x.p.z - k.cz) > Math.hypot(b.p.x - k.cx, b.p.z - k.cz) ? x : b), k.hits[0]);
    const w = add(tg, new THREE.Group(), ...k.on(h, 0.004).toArray());
    const peel = add(w, part(G.cyl(0.022, 0.022, 0.012, 0.004, 16, ), '#FFE066', 'thin'));
    peel.scale.set(1, 1, 0.5);
    peel.rotation.x = Math.PI / 2;
    add(w, part(G.cyl(0.018, 0.018, 0.013, 0.003, 16), '#FFF6A8', false)).rotation.x = Math.PI / 2;
    w.rotation.y = k.rand() * TAU;
  },
  flowers: (tg, k) => {
    const cols = ['#F7B9C4', '#FFE08A', '#C9A2E8'];
    k.pick(4).forEach((h, i) => {
      const f = add(tg, new THREE.Group(), ...k.on(h, 0.003).toArray());
      for (let j = 0; j < 5; j++) add(f, part(G.sphere(0.0055, 8, 6), cols[i % 3], false), Math.cos(j * 1.26) * 0.006, 0, Math.sin(j * 1.26) * 0.006).scale.y = 0.35;
      add(f, part(G.sphere(0.003, 6, 4), '#E8893A', false), 0, 0.001, 0);
    });
  },
  raspberries: (tg, k) => {
    for (const h of [k.peak, ...k.pick(3)]) add(tg, raspberry(1), ...k.on(h, 0.001).toArray());
  },
};

registerDishes({ templates: T, spec: SPEC, bits: BITS, garnish: GARNISH });
