// Lantern Cliff in 3D: the pantry's ingredients (on the shelf, on the cutting
// board, and in the mixing bowl), every dish on its fine-dining plate, and the
// garnishes. Each dish tags the parts its steps add, so the station builds them live.
import * as THREE from 'three';
import { G, C, mk } from './toon.js';
import { H, registerDishes } from './dessert3d.js';
import { IS_RESTAURANT } from './venue.js';
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

// a wide-rimmed white plate with a navy band and a thin gold line; food sits at y = 0.014
function finePlate(g, c, r = 0.16) {
  if (c.noPlate) return null;
  const m = add(g, base(part(G.lathe([V(0.0005, 0), V(r * 0.5, 0), V(r * 0.58, 0.006), V(r * 0.66, 0.0135), V(r, 0.024), V(r * 1.02, 0.029), V(r * 0.98, 0.031), V(r * 0.68, 0.02), V(r * 0.58, 0.014), V(0.0005, 0.013)], 48), '#FFFFFF', 'mid')));
  const band = add(g, base(part(G.torus(r * 0.86, 0.0028, TAU, 64), '#3E5C76', false)), 0, 0.0244, 0);
  band.rotation.x = Math.PI / 2;
  band.scale.z = 0.5;
  const gold = add(g, base(part(G.torus(r * 0.7, 0.0012, TAU, 64), '#D9A441', false)), 0, 0.0204, 0);
  gold.rotation.x = Math.PI / 2;
  gold.scale.z = 0.5;
  return m;
}

// The food on a plate is drawn 30% larger than its plate coordinates, so a
// dish fills its plate the way it does in a real fine-dining kitchen.
const FOOD = 1.3;
function dish(g, c, r = 0.16) {
  finePlate(g, c, r);
  const f = new THREE.Group();
  f.scale.setScalar(FOOD);
  f.position.y = c.noPlate ? 0 : 0.014 * (1 - FOOD);
  g.add(f);
  return f;
}

// a soup bowl on its plate; returns the inner floor height
function soupBowl(g, c, col = '#FFFFFF') {
  finePlate(g, c, 0.15);
  const y0 = c.noPlate ? 0 : 0.014;
  add(g, base(part(G.lathe([V(0.0005, 0), V(0.05, 0), V(0.058, 0.008), V(0.1, 0.042), V(0.118, 0.074), V(0.113, 0.078), V(0.097, 0.046), V(0.055, 0.017), V(0.0005, 0.015)], 40), col, 'mid')), 0, y0, 0);
  const band = add(g, base(part(G.torus(0.112, 0.0022, TAU, 48), '#3E5C76', false)), 0, y0 + 0.068, 0);
  band.rotation.x = Math.PI / 2;
  return y0 + 0.015;
}

function soupFill(f, y, col, P) {
  add(f, part(G.lathe([V(0.0005, 0), V(0.04, 0), V(0.075, 0.02), V(0.094, 0.04), V(0.097, 0.046), V(0.0005, 0.048)], 36), P(col), false), 0, y, 0);
  // a glossy highlight across the top
  const sh = add(f, part(G.sphere(0.03, 12, 6), mixHex(col, '#FFFBF0', 0.35), false), -0.03, y + 0.0475, -0.02);
  sh.scale.set(1, 0.03, 0.45);
  sh.rotation.y = 0.5;
}

/** A twirled nest of pasta: strands looping around a low dome. */
function pastaNest(f, y, col, P, r = 0.06, ribbon = false) {
  const n = ribbon ? 11 : 15;
  for (let i = 0; i < n; i++) {
    const k = i / n;
    const rad = r * (1 - k * 0.68);
    const arc = TAU * (0.7 + 0.3 * ((i * 7) % 4) / 3);
    const ring = add(f, part(G.torus(rad, ribbon ? 0.0085 : 0.0052, arc, 40), P(i % 3 ? col : mixHex(col, '#FFFBF0', 0.3)), i % 2 ? 'thin' : false), Math.sin(i * 1.7) * 0.004, y + 0.007 + k * (ribbon ? 0.036 : 0.044), Math.cos(i * 1.3) * 0.004);
    ring.rotation.set(Math.PI / 2 + Math.sin(i * 2.3) * 0.2, Math.cos(i * 1.1) * 0.2, i * 0.9);
    if (ribbon) ring.scale.z = 0.4;
  }
  // a few loose strands trailing off the nest
  for (let i = 0; i < 3; i++) {
    const a = i * 2.2 + 0.4;
    const pts = [];
    for (let j = 0; j <= 8; j++) {
      const u = j / 8;
      pts.push([Math.cos(a + u * 0.9) * (r * 0.9 + u * 0.02), y + 0.006 + Math.sin(u * Math.PI) * 0.004, Math.sin(a + u * 0.9) * (r * 0.9 + u * 0.02)]);
    }
    drizzle(f, pts, P(col), ribbon ? 0.006 : 0.004, 'thin');
  }
}

/** Tossed noodles, before they're twirled. */
function pastaTangle(f, y, col, P, rand, r = 0.07) {
  for (let i = 0; i < 12; i++) {
    const ring = add(f, part(G.torus(0.025 + rand() * 0.02, 0.0052, TAU * (0.5 + rand() * 0.4), 28), P(col), i % 2 ? 'thin' : false), (rand() - 0.5) * r, y + 0.008 + (i % 4) * 0.006, (rand() - 0.5) * r * 0.8);
    ring.rotation.set(Math.PI / 2 + (rand() - 0.5) * 0.7, (rand() - 0.5) * 0.5, rand() * TAU);
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

function mushroomSlice(s = 1) {
  const g = new THREE.Group();
  const cap = add(g, part(G.cyl(0.016 * s, 0.016 * s, 0.006 * s, 0.002, 16), '#A8744A', 'thin'), 0, 0.003 * s, 0);
  cap.scale.set(1, 1, 0.7);
  add(g, part(G.box(0.008 * s, 0.0065 * s, 0.016 * s, 0.002), '#E9D2B0', false), 0, 0.003 * s, 0.004 * s);
  return g;
}

function asparagus(f, x, y, z, ry, n = 3, len = 0.12) {
  for (let i = 0; i < n; i++) {
    const sp = add(f, new THREE.Group(), x + (i - (n - 1) / 2) * 0.011, y + 0.005 + (i % 2) * 0.003, z);
    sp.rotation.y = ry + (i - 1) * 0.06;
    const st = add(sp, part(G.capsule(0.0052, len), '#6E9F3E', 'thin'));
    st.rotation.x = Math.PI / 2;
    const tip = add(sp, part(G.sphere(0.0075, 10, 8), '#4E7F2E', 'thin'), 0, 0, len / 2 + 0.004);
    tip.scale.set(1, 1, 1.6);
    for (let k = 0; k < 3; k++) add(sp, part(G.box(0.004, 0.002, 0.006, 0.001), '#4E7F2E', false), 0, 0.005, -len * 0.3 + k * len * 0.25);
  }
}

function friesPile(f, x, y, z, P, col, n = 10) {
  for (let i = 0; i < n; i++) {
    const layer = Math.floor(i / 4);
    const fr = add(f, part(G.box(0.014, 0.014, 0.075, 0.004), P(i % 3 ? col : mixHex(col, '#C9842E', 0.35)), 'thin'), x + ((i % 4) - 1.5) * 0.016, y + 0.007 + layer * 0.012, z + ((i * 7) % 3 - 1) * 0.008);
    fr.rotation.y = (layer % 2 ? 1.2 : 0.2) + ((i * 13) % 5 - 2) * 0.12;
    fr.rotation.z = ((i * 11) % 5 - 2) * 0.06;
  }
}

function lemonHalf(f, x, y, z, s = 1) {
  const g = add(f, new THREE.Group(), x, y, z);
  const peel = add(g, part(new THREE.SphereGeometry(0.024 * s, 16, 10, 0, TAU, 0, Math.PI / 2), '#FFD84A', 'thin'));
  peel.rotation.x = Math.PI / 2;
  add(g, part(G.cyl(0.0225 * s, 0.0225 * s, 0.002, 0.001, 18), '#FFF3A0', false), 0, 0, 0.001).rotation.x = Math.PI / 2;
  for (let i = 0; i < 6; i++) {
    const seg = add(g, part(G.box(0.0015, 0.018 * s, 0.001, 0.0005), '#F6E070', false), 0, 0, 0.0025);
    seg.rotation.z = (i / 6) * Math.PI;
  }
  g.rotation.x = -1.2;
  return g;
}

const T = {};

T.caprese = (g, p, c) => {
  const { P } = c;
  const f0 = dish(g, c);
  c.F(f0, 'slices', (f) => {
    // a rosette of overlapping tomato and mozzarella slices
    const n = 10;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const pivot = add(f, new THREE.Group(), Math.cos(a) * 0.056, 0.022 + i * 0.0008, Math.sin(a) * 0.056);
      pivot.rotation.y = -a;
      const s = add(pivot, new THREE.Group());
      s.rotation.x = 0.38;
      if (i % 2 === 0) {
        add(s, part(G.cyl(0.032, 0.032, 0.01, 0.003, 24), P('#D8382E'), 'thin'));
        add(s, part(G.cyl(0.025, 0.025, 0.0104, 0.002, 20), P('#EE5A44'), false));
        for (let k = 0; k < 5; k++) {
          const sd = add(s, part(G.sphere(0.0045, 8, 6), P('#F6D070'), false), Math.cos(k * 1.26) * 0.014, 0.0052, Math.sin(k * 1.26) * 0.014);
          sd.scale.set(1, 0.35, 0.6);
          sd.rotation.y = -k * 1.26;
        }
        add(s, part(G.cyl(0.006, 0.006, 0.0106, 0.002, 10), P('#F28A70'), false));
      } else {
        const m = add(s, part(G.cyl(0.03, 0.03, 0.013, 0.005, 24), '#FFFBF0', 'thin'));
        m.scale.set(1, 1, 0.92);
      }
    }
    // a little bunch of basil and a cherry tomato in the middle
    for (let i = 0; i < 5; i++) {
      const l = add(f, basilLeaf(1.5), Math.cos(i * 1.25) * 0.012, 0.032 + (i % 2) * 0.003, Math.sin(i * 1.25) * 0.012);
      l.rotation.set(0.35 * Math.cos(i * 1.25), -i * 1.25, 0.35 * Math.sin(i * 1.25));
    }
    add(f, tomato(0.014, '#E4483E'), 0.004, 0.034, 0.002);
  }, 'pieces');
};

T.soup = (g, p, c) => {
  const { P } = c;
  const y = soupBowl(g, c);
  c.F(g, 'soup', (f) => {
    soupFill(f, y, p.soup, P);
    if (p.bits) for (let i = 0; i < 7; i++) add(f, mushroomSlice(0.9), Math.cos(i * 0.9) * 0.05, y + 0.046, Math.sin(i * 0.9) * 0.05).rotation.y = i;
  }, 'rise');
  if (p.toast && !c.noPlate) {
    const t = add(g, part(G.box(0.07, 0.014, 0.04, 0.008), P('#D9984A'), 'thin'), 0.12, 0.03, 0.05);
    t.rotation.set(0.1, 0.5, 0.15);
  }
};

T.bruschetta = (g, p, c) => {
  const { P, rand } = c;
  const f0 = dish(g, c);
  const spots = [[-0.058, 0.026, 0.55], [0.0, -0.022, 0.15], [0.058, 0.026, -0.3]];
  const toasted = c.done('toasts') && !c.raw;
  c.F(f0, 'toasts', (f) => {
    for (const [x, z, ry] of spots) {
      const t = add(f, new THREE.Group(), x, 0.022, z);
      t.rotation.y = ry;
      const crust = add(t, part(G.cyl(0.034, 0.034, 0.016, 0.006, 22), P(toasted ? '#B9702E' : '#E0A860'), 'thin'));
      crust.scale.set(1.35, 1, 0.82);
      const crumb = add(t, part(G.cyl(0.03, 0.03, 0.0164, 0.004, 22), P(toasted ? '#E9B060' : '#F6DDA6'), false), 0, 0.0004, 0);
      crumb.scale.set(1.35, 1, 0.82);
      if (toasted) for (let k = 0; k < 3; k++) add(t, part(G.box(0.05, 0.0012, 0.003, 0.0005), '#8A4E22', false), 0, 0.0088, -0.012 + k * 0.012).rotation.y = 0.3;
    }
  }, 'pieces');
  c.F(f0, 'topping', (f) => {
    for (const [x, z] of spots) {
      const heap = add(f, new THREE.Group(), x, 0.031, z);
      for (let i = 0; i < 10; i++) {
        const d = add(heap, part(G.box(0.012, 0.009, 0.012, 0.003), i % 3 ? '#E4483E' : '#F07A5A', i % 2 ? 'thin' : false), (rand() - 0.5) * 0.05, 0.004 + (i % 3) * 0.004, (rand() - 0.5) * 0.026);
        d.rotation.set(rand(), rand() * 3, rand());
      }
      for (let i = 0; i < 3; i++) add(heap, part(G.box(0.004, 0.003, 0.004, 0.001), '#FFF6E4', false), (rand() - 0.5) * 0.04, 0.012, (rand() - 0.5) * 0.02);
      for (let i = 0; i < 3; i++) {
        const rib = add(heap, part(G.capsule(0.0018, 0.02), '#4E8F3E', false), (rand() - 0.5) * 0.03, 0.015, (rand() - 0.5) * 0.015);
        rib.rotation.set(Math.PI / 2, 0, rand() * 3);
      }
    }
  }, 'pieces');
};

T.spaghetti = (g, p, c) => {
  const { P, rand } = c;
  const f0 = dish(g, c);
  if (c.shown('nest')) {
    c.F(f0, 'nest', (f) => {
      pastaNest(f, 0.014, p.pasta, P, 0.062);
      // a dome of tomato sauce with chunks on top
      const s = add(f, part(lumpyGeo(0.03, 5, 3, 0.5), P(p.sauce), 'thin'), 0, 0.058, 0);
      s.scale.set(1, 0.45, 1);
      for (let i = 0; i < 4; i++) add(f, part(G.box(0.009, 0.007, 0.009, 0.002), P('#E4583E'), false), Math.cos(i * 1.6) * 0.014, 0.068, Math.sin(i * 1.6) * 0.014).rotation.y = i;
    }, 'grow');
  } else {
    c.F(f0, 'sauce', (f) => {
      pastaTangle(f, 0.014, mixHex(p.pasta, p.sauce, 0.25), P, rand);
      const s = add(f, part(lumpyGeo(0.05, 6, 3, 0.4), P(p.sauce), false), 0, 0.024, 0);
      s.scale.set(1.1, 0.2, 0.9);
    }, 'grow');
  }
};

T.fettuccine = (g, p, c) => {
  const { P, rand } = c;
  const f0 = dish(g, c);
  if (p.nest && c.shown('nest')) {
    c.F(f0, 'nest', (f) => {
      // a pool of cream sauce around a nest of ribbons
      const pool = add(f, part(G.cyl(0.078, 0.078, 0.005, 0.003, 36), P(p.sauce), false), 0, 0.016, 0);
      pool.scale.z = 0.9;
      pastaNest(f, 0.016, p.pasta, P, 0.064, true);
      const glaze = add(f, part(lumpyGeo(0.026, 3, 3, 0.4), P(p.sauce), 'thin'), 0, 0.056, 0);
      glaze.scale.set(1, 0.3, 1);
    }, 'grow');
    return;
  }
  if (c.shown('sheet') && !c.done(p.cut)) {
    c.F(f0, 'sheet', (f) => {
      const sh = add(f, part(lumpyGeo(0.08, 4, 3, 0.15), P('#F6E2A8'), 'thin'), 0, 0.017, 0);
      sh.scale.set(1.4, 0.05, 0.95);
      dotsOn(f, rand, 18, 0, 0.0205, 0, 0.09, 0.06, P('#E9CF8A'), 0.002);
    }, 'grow');
  }
  c.F(f0, p.cut, (f) => {
    if (p.cut === 'ribbons') {
      for (let i = 0; i < 7; i++) {
        const rb = add(f, part(G.box(0.02, 0.005, 0.16, 0.002), P('#F6E2A8'), 'thin'), -0.072 + i * 0.024, 0.02 + (i % 2) * 0.002, 0);
        rb.rotation.set((i % 2 ? 1 : -1) * 0.04, (i - 3) * 0.05, 0);
      }
      return;
    }
    // pillowy ravioli with fork-crimped edges in brown butter with sage
    if (!c.noPlate) {
      const butter = add(f, part(G.cyl(0.085, 0.085, 0.003, 0.002, 36), '#D9A24A', false), 0, 0.0155, 0);
      butter.scale.z = 0.85;
    }
    const at = [[0, 0], [-0.052, -0.03], [0.052, -0.03], [-0.04, 0.042], [0.04, 0.042]];
    at.forEach(([x, z], i) => {
      const rv = add(f, new THREE.Group(), x, c.noPlate ? 0.004 : 0.018, z);
      rv.rotation.y = i * 0.45;
      add(rv, part(G.box(0.05, 0.008, 0.05, 0.004), P('#F6E2A8'), 'thin'), 0, 0.004, 0);
      const dome = add(rv, part(G.sphere(0.019, 14, 10), P('#FBEAB8'), 'thin'), 0, 0.007, 0);
      dome.scale.y = 0.55;
      for (let s = 0; s < 4; s++) {
        for (let k = 0; k < 3; k++) {
          const mark = add(rv, part(G.box(0.002, 0.0014, 0.007, 0.0006), '#E3C27A', false), 0, 0.0084, 0);
          const ang = (s / 4) * TAU;
          const along = (k - 1) * 0.013;
          mark.position.set(Math.cos(ang) * 0.021 - Math.sin(ang) * along, 0.0084, Math.sin(ang) * 0.021 + Math.cos(ang) * along);
          mark.rotation.y = -ang;
        }
      }
    });
    if (!c.noPlate) for (let i = 0; i < 3; i++) {
      const sage = add(f, basilLeaf(1.2, '#7E9A6A'), Math.cos(i * 2.1 + 0.6) * 0.05, 0.03, Math.sin(i * 2.1 + 0.6) * 0.05);
      sage.rotation.y = i * 2.1;
    }
  }, 'pieces');
};

T.risotto = (g, p, c) => {
  const { P, rand } = c;
  const f0 = dish(g, c);
  c.F(f0, 'risotto', (f) => {
    const m = add(f, part(lumpyGeo(0.082, 7, 3, 0.35), P('#F1DFAE'), 'thin'), 0, 0.014, 0);
    m.scale.y = 0.28;
    const dome = (x, z) => { const d = Math.min(1, Math.hypot(x, z) / 0.08); return 0.014 + 0.021 * (1 - d * d); };
    // creamy grains of rice all over the top
    for (let i = 0; i < 70; i++) {
      const a = rand() * TAU, d = Math.sqrt(rand()) * 0.072;
      const x = Math.cos(a) * d, z = Math.sin(a) * d;
      const gr = add(f, part(G.capsule(0.0026, 0.0055), i % 4 ? '#FFF8E4' : '#F6E6BC', false), x, dome(x, z) + 0.001, z);
      gr.rotation.set(Math.PI / 2, 0, rand() * TAU);
    }
    for (let i = 0; i < 7; i++) {
      const a = i * 0.9 + 0.3, d = 0.022 + (i % 3) * 0.018;
      const x = Math.cos(a) * d, z = Math.sin(a) * d;
      const mu = add(f, mushroomSlice(1.25), x, dome(x, z), z);
      mu.rotation.set(-0.25, a, 0);
    }
    // a glossy sheen of butter
    const sh = add(f, part(G.sphere(0.03, 12, 6), '#FFF3D0', false), -0.02, dome(-0.02, -0.02) + 0.002, -0.02);
    sh.scale.set(1, 0.04, 0.6);
  }, 'rise');
};

T.salmon = (g, p, c) => {
  const { P, rand } = c;
  const f0 = dish(g, c);
  const plated = !c.noPlate;
  c.F(f0, 'puree', (f) => {
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const u = i / 14;
      pts.push([-0.09 + u * 0.17, 0.022, 0.035 - Math.sin(u * Math.PI) * 0.035 + u * 0.01]);
    }
    drizzle(f, pts, P('#F6E6C0'), 0.016, 'thin');
    add(f, part(G.sphere(0.022, 16, 10), P('#F8ECCB'), 'thin'), -0.09, 0.024, 0.035).scale.y = 0.6;
  }, 'grow');
  if (plated && c.done('puree')) asparagus(f0, 0.0, 0.016, -0.03, 0.15, 3, 0.13);
  // the fillet: pink flesh with white lines, crispy skin when seared
  const raw = c.raw;
  const fl = add(f0, new THREE.Group(), 0.0, plated ? 0.03 : 0.004, 0.0);
  fl.rotation.y = 0.25;
  const shape = new THREE.Shape();
  shape.moveTo(-0.055, -0.022);
  shape.quadraticCurveTo(-0.06, 0.02, -0.035, 0.026);
  shape.lineTo(0.045, 0.024);
  shape.quadraticCurveTo(0.062, 0.0, 0.048, -0.024);
  shape.lineTo(-0.055, -0.022);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.026, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 3, curveSegments: 10 });
  geo.rotateX(-Math.PI / 2);
  add(fl, part(geo, raw ? '#F6A07E' : '#F08A5A', 'mid'), 0, 0.0, 0);
  for (let i = 0; i < 5; i++) {
    const ln = add(fl, part(G.torus(0.03, 0.0016, Math.PI * 0.55, 16), raw ? '#FFE0D0' : '#FFD8C0', false), -0.04 + i * 0.02, 0.0325, 0.03);
    ln.rotation.x = Math.PI / 2;
    ln.rotation.z = Math.PI * 1.2;
  }
  if (!raw) {
    const skin = add(fl, part(geo, '#B9602E', 'thin'), 0, 0.0325, 0);
    skin.scale.y = 0.12;
    dotsOn(fl, rand, 14, 0, 0.0368, 0, 0.045, 0.018, '#8A4A22', 0.0028);
  }
};

T.shrimpPlate = (g, p, c) => {
  const { P } = c;
  const f0 = dish(g, c);
  const y = c.noPlate ? 0.003 : 0.016;
  if (!c.noPlate) {
    const pool = add(f0, part(G.cyl(0.085, 0.085, 0.005, 0.003, 32), P('#F2C860'), false), 0, y, 0);
    pool.scale.z = 0.85;
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    const s = add(f0, shrimp(1.25, c.raw ? '#C9BCB0' : '#F4956A'), Math.cos(a) * 0.052, y + 0.004 + (i % 2) * 0.004, Math.sin(a) * 0.046);
    s.rotation.y = -a + 1.4;
  }
  for (let i = 0; i < 7; i++) {
    const gs = add(f0, part(G.cyl(0.006, 0.006, 0.003, 0.001, 10), '#FFF3D8', 'thin'), Math.cos(i * 2.1) * 0.03, y + 0.008, Math.sin(i * 2.1) * 0.025);
    gs.rotation.x = 0.3;
  }
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
  for (let i = 0; i < 12; i++) add(g, part(G.box(0.016, 0.009, 0.016, 0.003), P('#E4483E'), false), Math.cos(i * 2.3) * 0.13 * Math.sqrt((i + 1) / 12), 0.033, Math.sin(i * 2.3) * 0.13 * Math.sqrt((i + 1) / 12));
  for (let i = 0; i < 10; i++) add(g, part(G.sphere(0.008, 8, 6), '#7EAF4E', false), Math.cos(i * 1.7 + 1) * 0.11, 0.034, Math.sin(i * 1.7 + 1) * 0.11);
  c.F(g, 'shrimp', (f) => {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.3;
      const s = add(f, shrimp(2.2), Math.cos(a) * 0.105, 0.034, Math.sin(a) * 0.105);
      s.rotation.y = -a;
    }
  }, 'pieces');
};

T.fishChips = (g, p, c) => {
  const { P, rand } = c;
  const f0 = dish(g, c);
  const plated = !c.noPlate;
  const y = plated ? 0.016 : 0.004;
  if (plated) {
    // a square of checked paper under the fish
    const paper = add(f0, part(G.box(0.15, 0.0015, 0.11, 0.0007), '#F8F0DC', false), -0.02, 0.0152, 0);
    paper.rotation.y = 0.35;
    for (let i = 0; i < 4; i++) {
      add(paper, part(G.box(0.15, 0.0003, 0.004, 0.0001), '#D8564A', false), 0, 0.0009, -0.04 + i * 0.027);
      add(paper, part(G.box(0.004, 0.0003, 0.11, 0.0001), '#D8564A', false), -0.06 + i * 0.04, 0.0009, 0);
    }
  }
  const fish = add(f0, part(lumpyGeo(0.045, 3, 3, 0.9), P(c.raw ? '#F3E3B8' : '#E2A040'), 'mid'), -0.03, y + 0.015, -0.005);
  fish.scale.set(1.75, 0.55, 0.85);
  fish.rotation.y = 0.35;
  dotsOn(f0, rand, 22, -0.03, y + 0.028, -0.005, 0.06, 0.028, P(c.raw ? '#E9D5A0' : '#C9842E'), 0.004);
  c.F(f0, 'chips', (f) => friesPile(f, 0.058, y, 0.025, P, c.raw ? '#F6E2A8' : '#F2C060', 9), 'pieces');
  if (plated) {
    // a little dish of tartare sauce
    const tt = add(f0, new THREE.Group(), 0.04, 0, -0.058);
    ramekin(tt, y, '#FFFFFF', 0.02, 0.018);
    add(tt, part(G.cyl(0.0175, 0.0175, 0.004, 0.002, 16), '#F3EED0', false), 0, y + 0.015, 0);
    dotsOn(tt, rand, 8, 0, y + 0.0172, 0, 0.012, 0.012, '#8AA86A', 0.0022);
  }
};

T.steakFrites = (g, p, c) => {
  const { P } = c;
  const f0 = dish(g, c);
  const plated = !c.noPlate;
  const y = plated ? 0.016 : 0.003;
  // fries are cut on the board, wait out the searing, then go on the plate
  if (plated || c.isLive('fries')) c.F(f0, 'fries', (f) => friesPile(f, 0.06, y, 0.0, P, plated ? '#F2C060' : '#F6E2A8', 11), 'pieces');
  const seared = !c.raw;
  if (c.shown('slice')) {
    c.F(f0, 'slice', (f) => {
      // fanned slices: a dark crust, a rosy middle
      for (let i = 0; i < 5; i++) {
        const sl = add(f, new THREE.Group(), -0.075 + i * 0.022, y + 0.016, -0.01 + i * 0.006);
        sl.rotation.set(0, 0.25, -0.55);
        add(sl, part(G.box(0.014, 0.034, 0.07, 0.005), '#7A3E26', 'thin'));
        add(sl, part(G.box(0.0144, 0.024, 0.058, 0.004), '#E87878', false));
        add(sl, part(G.box(0.0146, 0.012, 0.04, 0.003), '#F09090', false));
      }
      // a pat of herb butter melting on top
      const pat = add(f, part(G.cyl(0.012, 0.012, 0.006, 0.002, 14), '#FFE08A', 'thin'), -0.03, y + 0.04, 0.0);
      for (let k = 0; k < 4; k++) add(pat, part(G.sphere(0.0018, 5, 4), '#4E8F3E', false), Math.cos(k * 1.5) * 0.006, 0.003, Math.sin(k * 1.5) * 0.006);
    }, 'pieces');
  } else {
    const st = add(f0, steak(1.45, '#D8606A', seared), -0.035, y, 0);
    st.rotation.y = 0.3;
  }
};

T.roastChicken = (g, p, c) => {
  const { P, rand } = c;
  const f0 = dish(g, c, 0.17);
  const col = c.raw ? '#F3D2A8' : '#D9903E';
  add(f0, wholeChicken(1.2, col), -0.015, 0.014, 0);
  if (!c.raw) {
    dotsOn(f0, rand, 14, -0.015, 0.068, 0, 0.035, 0.03, '#B9702E', 0.003);
    const sh = add(f0, part(G.sphere(0.016, 10, 6), '#F6C070', false), -0.03, 0.072, -0.015);
    sh.scale.set(1.2, 0.2, 0.7);
  }
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05 + 0.3;
    const po = add(f0, potato(0.6, i + 2, c.raw ? '#F6E2A8' : '#E9A850'), Math.cos(a) * 0.082, 0.014, Math.sin(a) * 0.068);
    po.rotation.y = a;
  }
  if (!c.noPlate) {
    // rosemary sprigs and a lemon half
    for (let s = 0; s < 2; s++) {
      const sp = add(f0, new THREE.Group(), 0.05 + s * 0.016, 0.018, -0.05 + s * 0.01);
      sp.rotation.y = 0.8 + s * 0.4;
      add(sp, part(G.capsule(0.0015, 0.06), '#6E5A3A', false)).rotation.z = Math.PI / 2;
      for (let k = 0; k < 10; k++) {
        const nd = add(sp, part(G.capsule(0.0012, 0.008), '#4E7F3E', false), -0.025 + k * 0.0055, 0.002, (k % 2 ? 1 : -1) * 0.004);
        nd.rotation.set(Math.PI / 2, 0, (k % 2 ? 1 : -1) * 0.6);
      }
    }
    lemonHalf(f0, 0.06, 0.024, 0.048, 0.8);
  }
  c.F(f0, 'carve', (f) => {
    for (let i = 0; i < 4; i++) {
      const sl = add(f, part(G.box(0.04, 0.007, 0.026, 0.003), '#F6E6CC', 'thin'), 0.062 + (i % 2) * 0.006, 0.02 + i * 0.005, -0.01 + i * 0.01);
      sl.rotation.y = 0.6;
      add(sl, part(G.box(0.046, 0.003, 0.031, 0.001), '#D9903E', false), 0, 0.0045, 0);
    }
  }, 'pieces');
};

T.filet = (g, p, c) => {
  const { P } = c;
  const f0 = dish(g, c);
  const plated = !c.noPlate;
  const y = plated ? 0.016 : 0.004;
  if (plated) {
    // a piped swirl of mash and a bundle of asparagus beside the filet
    swirl(f0, 0.026, 0.03, '#FFF3DC', 0.06, y, 0.035);
    asparagus(f0, 0.035, y, -0.045, 1.3, 3, 0.1);
  }
  c.F(f0, 'sauce', (f) => {
    const pool = add(f, part(G.cyl(0.07, 0.07, 0.005, 0.003, 32), P('#C9A07A'), 'thin'), -0.02, 0.0165, 0.0);
    pool.scale.z = 0.85;
    for (let i = 0; i < 6; i++) add(f, mushroomSlice(1.2), -0.02 + Math.cos(i * 1.05) * 0.052, 0.021, Math.sin(i * 1.05) * 0.045).rotation.y = i;
    const glaze = add(f, part(G.cyl(0.032, 0.03, 0.006, 0.003, 24), P('#B9845A'), false), -0.02, y + 0.049, 0);
    glaze.scale.z = 0.95;
  }, 'grow');
  const seared = c.done('sear');
  const fil = add(f0, new THREE.Group(), -0.02, y + 0.024, 0);
  add(fil, part(G.cyl(0.04, 0.042, 0.046, 0.012, 28), seared ? '#6E3620' : '#D8606A', 'mid'));
  add(fil, part(G.cyl(0.036, 0.036, 0.004, 0.002, 28), seared ? '#8A4A2C' : '#E07070', false), 0, 0.0232, 0);
  c.F(fil, 'sear', (f) => dotsOn(f, c.rand, 10, 0, 0.0245, 0, 0.03, 0.03, '#4E2A1A', 0.0025), 'pieces');
  // butcher's twine
  const twine = add(fil, part(G.torus(0.0418, 0.0016, TAU, 32), '#F3E6CC', false), 0, 0.004, 0);
  twine.rotation.x = Math.PI / 2;
  if (seared) for (let i = 0; i < 3; i++) add(fil, part(G.box(0.005, 0.002, 0.052, 0.001), '#3E2014', false), -0.015 + i * 0.015, 0.0256, 0).rotation.y = 0.6;
};

T.chickenParm = (g, p, c) => {
  const { P, rand } = c;
  const f0 = dish(g, c);
  const plated = !c.noPlate;
  const y = plated ? 0.016 : 0.004;
  const cx = plated ? -0.025 : 0;
  if (plated) {
    // a little nest of spaghetti on the side
    const side = add(f0, new THREE.Group(), 0.07, 0, 0.03);
    side.scale.setScalar(0.62);
    pastaNest(side, 0.026, '#F4D58A', P, 0.06);
    const s = add(side, part(lumpyGeo(0.028, 5, 3, 0.5), '#D8402E', 'thin'), 0, 0.068, 0);
    s.scale.set(1, 0.4, 1);
  }
  if (!c.done('crumb')) {
    const raw = add(f0, part(lumpyGeo(0.062, 9, 3, 0.5), '#F3D2C0', 'mid'), cx, y + 0.012, 0);
    raw.scale.set(1.3, 0.26, 0.95);
  }
  c.F(f0, 'crumb', (f) => {
    const fried = c.done('fried');
    const cut = add(f, part(lumpyGeo(0.066, 9, 3, 0.6), fried ? '#D98E3A' : '#F0C886', 'mid'), cx, y + 0.012, 0);
    cut.scale.set(1.3, 0.28, 0.95);
    dotsOn(f, rand, 34, cx, y + 0.029, 0, 0.075, 0.05, fried ? '#B9702E' : '#E0B070', 0.0035);
  }, 'grow');
  // frying turns the crumb crisp: a few extra crunchy flakes once it's done
  c.F(f0, 'fried', (f) => dotsOn(f, rand, 10, cx, y + 0.031, 0, 0.06, 0.04, '#C9802E', 0.005), 'pieces');
  if (c.shown('cheese')) {
    c.F(f0, 'cheese', (f) => {
      const sauce = add(f, part(lumpyGeo(0.05, 4, 3, 0.4), '#D23A2A', 'thin'), cx, y + 0.027, 0);
      sauce.scale.set(1.25, 0.12, 0.85);
      for (const [x, z, r] of [[-0.02, -0.01, 0.024], [0.022, 0.012, 0.022], [0.0, 0.022, 0.018], [0.03, -0.018, 0.016]]) {
        const ch = add(f, part(G.sphere(r, 14, 10), '#FFF3D8', 'thin'), cx + x, y + 0.033, z);
        ch.scale.y = 0.28;
      }
      // golden blisters on the melted cheese
      for (let i = 0; i < 6; i++) add(f, part(G.sphere(0.004, 6, 4), '#D9A24A', false), cx + (rand() - 0.5) * 0.06, y + 0.039, (rand() - 0.5) * 0.04).scale.y = 0.4;
    }, 'grow');
  }
};

T.lavaCake = (g, p, c) => {
  const { P } = c;
  const f0 = dish(g, c);
  c.F(f0, 'fill', (f) => {
    const cake = add(f, part(G.cyl(0.046, 0.052, 0.062, 0.014, 32), P('#4E2A1A'), 'mid'), 0, 0.045, 0);
    add(cake, part(G.cyl(0.041, 0.041, 0.004, 0.002, 28), P('#5E3422'), false), 0, 0.0315, 0);
    if (!c.raw) {
      // molten chocolate running out of a split in the side
      const ooze = add(f, part(lumpyGeo(0.034, 5, 2, 0.6), '#2E160C', 'thin'), 0.05, 0.017, 0.02);
      ooze.scale.set(1.4, 0.18, 1);
      const shine = add(f, part(G.sphere(0.012, 8, 6), '#7A4A30', false), 0.05, 0.023, 0.016);
      shine.scale.set(1.2, 0.15, 0.5);
      const split = add(f, part(G.box(0.012, 0.03, 0.006, 0.003), '#2E160C', false), 0.04, 0.04, 0.032);
      split.rotation.y = -0.6;
    }
  }, 'rise');
  if (!c.noPlate && !c.raw) {
    // a quenelle of cream
    const q = add(f0, part(G.sphere(0.018, 16, 10), '#FFF8EC', 'thin'), -0.06, 0.024, -0.03);
    q.scale.set(1.6, 0.7, 0.9);
    q.rotation.y = 0.6;
  }
};

T.cremeBrulee = (g, p, c) => {
  const { P } = c;
  const f0 = dish(g, c);
  const y0 = c.noPlate ? 0 : 0.014;
  ramekin(f0, y0, '#FFFFFF', 0.062, 0.042);
  c.F(f0, 'fill', (f) => {
    add(f, part(G.cyl(0.055, 0.055, 0.03, 0.004, 32), P('#FFE8B0'), false), 0, y0 + 0.022, 0);
  }, 'rise');
  c.F(f0, 'crust', (f) => {
    const top = add(f, part(G.cyl(0.055, 0.055, 0.004, 0.002, 32), '#D99A3A', 'thin'), 0, y0 + 0.038, 0);
    for (let i = 0; i < 6; i++) {
      const cr = add(top, part(G.box(0.03, 0.001, 0.002, 0.0005), '#A8612E', false), Math.cos(i * 1.4) * 0.018, 0.0025, Math.sin(i * 1.4) * 0.018);
      cr.rotation.y = i * 0.9;
    }
    add(top, part(G.sphere(0.012, 8, 6), '#F6C066', false), -0.018, 0.002, -0.014).scale.y = 0.15;
  }, 'grow');
};

T.pannaCotta = (g, p, c) => {
  const f0 = dish(g, c);
  const unmolded = c.done('flip') || c.isLive('flip');
  c.F(f0, 'fill', (f) => {
    add(f, part(G.lathe([V(0.0005, 0), V(0.046, 0), V(0.044, 0.038), V(0.032, 0.064), V(0.0005, 0.066)], 32), '#FFF6EC', 'mid'), 0, 0.014, 0);
  }, 'rise');
  if (!unmolded) {
    add(f0, base(part(G.lathe([V(0.0005, 0.064), V(0.034, 0.068), V(0.046, 0.004), V(0.052, 0.0), V(0.0525, 0.004), V(0.04, 0.072), V(0.0005, 0.072)], 32), '#C9D4D9', 'mid')), 0, 0.014, 0);
  } else {
    const top = add(f0, part(G.cyl(0.028, 0.032, 0.008, 0.003, 24), '#D8406A', 'thin'), 0, 0.081, 0);
    for (let i = 0; i < 4; i++) {
      const drip = add(f0, part(G.capsule(0.0045, 0.02), '#D8406A', false), Math.cos(i * 1.6) * 0.035, 0.066, Math.sin(i * 1.6) * 0.035);
      drip.rotation.set(Math.sin(i * 1.6) * 0.4, 0, -Math.cos(i * 1.6) * 0.4);
    }
    const pool = add(f0, part(G.cyl(0.075, 0.075, 0.004, 0.002, 32), '#D8406A', false), 0, 0.016, 0);
    pool.scale.z = 0.7;
    top.userData.noHighlight = true;
  }
};

T.wellington = (g, p, c) => {
  const { P } = c;
  const f0 = dish(g, c, 0.17);
  const y = c.noPlate ? 0.004 : 0.016;
  const sliced = c.shown('slice');
  const len = sliced ? 0.11 : 0.15;
  if (!c.shown('pastry')) {
    if (!c.done('beef')) {
      const beef = add(f0, part(G.capsule(0.03, len - 0.05), '#C8505A', 'mid'), 0, y + 0.03, 0);
      beef.rotation.z = Math.PI / 2;
    }
    c.F(f0, 'beef', (f) => {
      const beef = add(f, part(G.capsule(0.03, len - 0.05), '#6E3620', 'mid'), 0, y + 0.03, 0);
      beef.rotation.z = Math.PI / 2;
      dotsOn(f, c.rand, 16, 0, y + 0.06, 0, 0.05, 0.012, '#4E2A1A', 0.003);
    }, 'pieces');
  }
  c.F(f0, 'pastry', (f) => {
    const log = add(f, part(G.capsule(0.04, len - 0.07), P(c.raw ? '#F3D9A0' : '#D9963E'), 'mid'), sliced ? -0.03 : 0, y + 0.04, 0);
    log.rotation.z = Math.PI / 2;
    log.scale.set(1, 1, 0.95);
  }, 'grow');
  c.F(f0, 'score', (f) => {
    for (let i = 0; i < 6; i++) {
      const sc = add(f, part(G.box(0.0035, 0.003, 0.05, 0.001), P('#A86A2A'), false), (sliced ? -0.03 : 0) - 0.05 + i * 0.02, y + 0.079, 0);
      sc.rotation.y = 0.6;
    }
  }, 'pieces');
  if (sliced) {
    c.F(f0, 'slice', (f) => {
      for (let i = 0; i < 2; i++) {
        const sl = add(f, new THREE.Group(), 0.055 + i * 0.034, y + 0.04, 0.018 * i);
        sl.rotation.z = -0.25;
        for (const [r, col, w] of [[0.04, '#D9963E', 0.02], [0.034, '#E9C27E', 0.0205], [0.03, '#5E4A32', 0.021], [0.024, '#D86068', 0.0215], [0.012, '#E88A90', 0.022]]) {
          const disc = add(sl, part(G.cyl(r, r, w, 0.004, 24), col, r === 0.04 ? 'thin' : false));
          disc.rotation.z = Math.PI / 2;
        }
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
      if (i % 2) add(f, shrimp(1.5), ...at).rotation.y = -a;
      else add(f, part(G.box(0.032, 0.018, 0.024, 0.007), '#F6A07E', 'thin'), ...at).rotation.y = a;
    }
  }, 'pieces');
  if (!c.noPlate) {
    const t = add(g, part(G.box(0.07, 0.014, 0.04, 0.008), P('#D9984A'), 'thin'), 0.12, 0.03, 0.05);
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

// In the restaurant you mix in a steel bowl, and some mixes look like what they are
const BOWL_FILLS = {
  spaghetti: (g, rand) => {
    add(g, part(G.cyl(0.11, 0.11, 0.012, 0.004, 28), '#C8402E', false), 0, 0.05, 0);
    pastaTangle(g, 0.05, '#F0C070', (col) => col, rand, 0.15);
  },
  fettuccine: (g) => {
    const ball = add(g, part(lumpyGeo(0.06, 11, 3, 0.4), '#F6E2A8', 'thin'), 0, 0.055, 0);
    ball.scale.set(1.1, 0.7, 1);
    add(g, part(G.sphere(0.012, 8, 6), '#FBEFC8', false), -0.03, 0.09, -0.02).scale.y = 0.3;
  },
  risotto: (g, rand) => {
    add(g, part(G.cyl(0.12, 0.12, 0.02, 0.006, 28), '#F1DFAE', false), 0, 0.058, 0);
    for (let i = 0; i < 50; i++) {
      const a = rand() * TAU, d = Math.sqrt(rand()) * 0.11;
      add(g, part(G.capsule(0.003, 0.006), '#FFF8E4', false), Math.cos(a) * d, 0.069, Math.sin(a) * d).rotation.set(Math.PI / 2, 0, rand() * 3);
    }
    for (let i = 0; i < 6; i++) add(g, mushroomSlice(1.3), Math.cos(i * 1.1) * 0.06, 0.07, Math.sin(i * 1.1) * 0.06).rotation.y = i;
  },
  paella: (g, rand) => {
    add(g, part(G.cyl(0.12, 0.12, 0.02, 0.006, 28), '#F2B640', false), 0, 0.058, 0);
    for (let i = 0; i < 50; i++) {
      const a = rand() * TAU, d = Math.sqrt(rand()) * 0.11;
      add(g, part(G.capsule(0.003, 0.006), '#FFE08A', false), Math.cos(a) * d, 0.069, Math.sin(a) * d).rotation.set(Math.PI / 2, 0, rand() * 3);
    }
    for (let i = 0; i < 8; i++) add(g, part(G.box(0.014, 0.008, 0.014, 0.003), '#E4483E', false), Math.cos(i * 2.3) * 0.08, 0.07, Math.sin(i * 2.3) * 0.08);
  },
};
BOWL_FILLS.ravioli = BOWL_FILLS.fettuccine;

registerDishes({
  templates: T, spec: SPEC, bits: BITS, garnish: GARNISH,
  bowl: IS_RESTAURANT ? { body: '#D9E2E6', band: '#9AAAB2', fills: BOWL_FILLS } : null,
});
