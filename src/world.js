// The bakery room: kitchen stations with faces, a center prep island, Dry and
// Cold Storage, a café corner and cozy decor. Things only seen through the
// baker's eyes (front walls, ceiling, pendants, front-wall furniture, the
// hillside outside) live on layer 1, so the title diorama stays a cutaway.
import * as THREE from 'three';
import { G, C, INK, mk, toon, addFace, glow, blob, worldUV } from './toon.js';
import {
  planksTex, wallpaperTex, wainscotTex, stripesTex, ginghamTex, weaveTex, signTex, menuTex, skyTex, hillsideTex,
  scallopAwning, plant, basket, jar, counter, chair, cafeTable, sconce, pendant, frame, catPortrait, cakePoster,
} from './props.js';
import { ingredientModel, label } from './ingredients.js';
import { BY_ID } from './desserts.js';
import { dessertModel } from './dessert3d.js';
import { buildHighlight, mergeStatic } from './merge.js';

export const ROOM = { x0: -6, x1: 6, z0: -5, z1: 5, h: 3.6 };
export const FP_LAYER = 1;

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const dyn = (o) => { o.userData.dynamic = true; return o; };
const put = (parent, obj, x = 0, y = 0, z = 0) => { obj.position.set(x, y, z); parent.add(obj); return obj; };
function setLayer(obj, layer) { obj.traverse((o) => o.layers.set(layer)); return obj; }

// ------------------------------------------------------------------ stations

function buildMixer() {
  const g = counter(1.5, 0.9, 0.85, C.sage);
  const bowl = dyn(put(g, new THREE.Group(), 0, 0.91, 0.05));
  put(bowl, mk(G.cyl(0.44, 0.26, 0.4, 0.1, 32), C.pink), 0, 0.2, 0);
  const rim = put(bowl, mk(G.torus(0.42, 0.04), C.pink, { outline: 'thin' }), 0, 0.4, 0);
  rim.rotation.x = Math.PI / 2;
  const batterMat = toon(C.butter, { unique: true });
  put(bowl, mk(G.cyl(0.39, 0.39, 0.04, 0.02, 28), batterMat, { outline: false }), 0, 0.38, 0);
  const face = addFace(bowl, 0.62, { position: V3(0, 0.2, 0.39) });
  face.face.rotation.x = -0.25;
  const whisk = put(bowl, new THREE.Group(), 0.1, 0.55, 0);
  whisk.rotation.z = -0.35;
  put(whisk, mk(G.capsule(0.04, 0.26), C.honey, { outline: 'thin' }), 0, 0.28, 0);
  for (let i = 0; i < 3; i++) {
    const loop = put(whisk, mk(G.torus(0.09, 0.012), '#F3E6D0', { outline: 'thin' }), 0, 0.02, 0);
    loop.rotation.y = (i / 3) * Math.PI;
    loop.scale.y = 1.6;
  }
  put(g, jar(C.butter, 0.26), -0.55, 0.91, -0.15);
  const eggs = put(g, new THREE.Group(), 0.55, 0.91, -0.1);
  put(eggs, mk(G.cyl(0.14, 0.1, 0.12, 0.03, 16), C.blue, { outline: 'thin' }), 0, 0.06, 0);
  for (const [x, z] of [[-0.05, 0], [0.06, 0.03], [0, -0.06]]) {
    const e = put(eggs, mk(G.sphere(0.06, 12, 8), '#FFF6E4', { outline: 'thin' }), x, 0.16, z);
    e.scale.y = 1.25;
  }
  return { group: g, hero: bowl, face, whisk, batterMat, slotLocal: V3(0, 1.36, 0.05) };
}

function buildStove() {
  const g = counter(1.5, 0.9, 0.85, C.blue);
  put(g, mk(G.box(1.1, 0.06, 0.7, 0.03), C.cocoa, { outline: 'thin' }), 0, 0.9, 0);
  for (const x of [-0.3, 0.3]) {
    const ring = put(g, mk(G.torus(0.17, 0.025), INK, { outline: false }), x, 0.94, 0);
    ring.rotation.x = Math.PI / 2;
  }
  for (const x of [-0.45, -0.15, 0.15, 0.45]) {
    const knob = put(g, mk(G.cyl(0.06, 0.06, 0.06, 0.02, 12), C.cream2, { outline: 'thin' }), x, 0.72, 0.47);
    knob.rotation.x = Math.PI / 2;
  }
  const pot = dyn(put(g, new THREE.Group(), -0.3, 0.95, 0));
  put(pot, mk(G.cyl(0.3, 0.27, 0.36, 0.07, 28), C.pumpkin), 0, 0.18, 0);
  const rim = put(pot, mk(G.torus(0.29, 0.03), C.pumpkin, { outline: 'thin' }), 0, 0.36, 0);
  rim.rotation.x = Math.PI / 2;
  const soupMat = toon('#F3C07A', { unique: true });
  put(pot, mk(G.cyl(0.27, 0.27, 0.03, 0.01, 24), soupMat, { outline: false }), 0, 0.33, 0);
  for (const sx of [-1, 1]) {
    const h = put(pot, mk(G.capsule(0.035, 0.08), C.pumpkin, { outline: 'thin' }), sx * 0.34, 0.28, 0);
    h.rotation.z = Math.PI / 2;
  }
  const spoon = put(pot, new THREE.Group(), 0, 0.3, 0);
  const sp = put(spoon, mk(G.capsule(0.022, 0.4), C.honey, { outline: 'thin' }), 0.12, 0.16, 0);
  sp.rotation.z = -0.5;
  const face = addFace(pot, 0.5, { position: V3(0, 0.17, 0.29) });
  const flame = glow('#FF9A3C', 0.9, 0);
  put(g, flame, 0.3, 0.98, 0);
  put(g, mk(G.cyl(0.24, 0.2, 0.08, 0.03, 24), '#6E4A3A', { outline: 'mid' }), 0.3, 0.97, 0);
  const panHandle = put(g, mk(G.box(0.36, 0.05, 0.07, 0.02), C.honeyDark, { outline: 'thin' }), 0.62, 0.99, 0.08);
  panHandle.rotation.y = -0.3;
  return { group: g, hero: pot, face, flame, spoon, soupMat, slotLocal: V3(0.3, 1.02, 0) };
}

function buildOven() {
  const g = new THREE.Group();
  for (const [x, z] of [[-0.6, -0.4], [0.6, -0.4], [-0.6, 0.4], [0.6, 0.4]]) put(g, mk(G.sphere(0.12, 12, 8), C.honeyDark, { outline: 'mid' }), x, 0.1, z);
  const body = dyn(put(g, new THREE.Group()));
  put(body, mk(G.box(1.75, 1.05, 1.25, 0.24), C.bread), 0, 0.7, 0);
  const dome = put(body, mk(G.capsule(0.62, 0.52, 8, 20), C.bread), 0, 1.22, 0);
  dome.rotation.z = Math.PI / 2;
  dome.scale.set(0.72, 1, 1);
  for (const x of [-0.42, -0.02, 0.38]) {
    const s = put(body, mk(G.box(0.12, 0.05, 0.62, 0.02), '#F6D39A', { outline: 'thin', cast: false }), x, 1.66, 0.02);
    s.rotation.y = 0.5;
  }
  // bottom-hinged door that drops open when the bake is done
  const door = put(body, new THREE.Group(), 0, 0.3, 0.64);
  put(door, mk(G.box(0.9, 0.52, 0.1, 0.1), C.cocoa), 0, 0.26, 0);
  const windowMat = toon('#FFB35C', { emissive: '#FF9A3C', emissiveIntensity: 0.15, unique: true });
  put(door, mk(G.box(0.66, 0.28, 0.06, 0.06), windowMat, { outline: 'thin' }), 0, 0.28, 0.04);
  const handle = put(door, mk(G.capsule(0.03, 0.4), C.butter, { outline: 'thin' }), 0, 0.47, 0.09);
  handle.rotation.z = Math.PI / 2;
  const face = addFace(body, 0.9, { position: V3(0, 1.1, 0.64) });
  put(body, mk(G.cyl(0.13, 0.15, 0.7, 0.04, 16), C.honeyDark), 0.5, 1.9, -0.3);
  put(body, mk(G.cyl(0.19, 0.19, 0.08, 0.03, 16), C.honeyDark, { outline: 'thin' }), 0.5, 2.27, -0.3);
  const gl = glow('#FFA24C', 1.3, 0.12);
  put(body, gl, 0, 0.6, 0.85);
  g.add(blob(2.2, 1.7));
  return { group: g, hero: body, face, door, windowMat, glow: gl, chimneyTop: V3(0.5, 2.35, -0.3), slotLocal: V3(0, 0.38, 0.95) };
}

function buildFreezer() {
  const g = new THREE.Group();
  const body = dyn(put(g, new THREE.Group()));
  put(body, mk(G.box(1.3, 0.82, 0.8, 0.18), C.blue), 0, 0.47, 0);
  put(body, mk(G.box(1.26, 0.08, 0.76, 0.03), C.blueDeep, { outline: false }), 0, 0.08, 0);
  for (const x of [-0.45, 0.45]) put(body, mk(G.sphere(0.08, 10, 8), C.blueDeep, { outline: 'mid' }), x, 0.05, 0.25);
  put(body, mk(G.box(1.08, 0.03, 0.6, 0.01), '#E4F2F7', { outline: false }), 0, 0.87, 0.02);
  for (const [x, z] of [[-0.4, -0.2], [0.35, -0.22], [-0.1, 0.2]]) {
    const f = put(body, mk(G.sphere(0.05, 8, 6), '#FFFFFF', { outline: false }), x, 0.88, z);
    f.scale.y = 0.4;
  }
  const lid = put(body, new THREE.Group(), 0, 0.88, -0.4);
  put(lid, mk(G.box(1.32, 0.1, 0.82, 0.05), C.blue), 0, 0.04, 0.41);
  const lh = put(lid, mk(G.capsule(0.03, 0.34), C.cream2, { outline: 'thin' }), 0, 0.02, 0.84);
  lh.rotation.z = Math.PI / 2;
  const snow = put(lid, mk(G.cyl(0.07, 0.07, 0.02, 0.008, 12), '#FFFFFF', { outline: 'thin' }), 0.4, 0.1, 0.5);
  snow.scale.set(1, 1, 1);
  const face = addFace(body, 0.75, { position: V3(0, 0.52, 0.41) });
  g.add(blob(1.6, 1.2));
  return { group: g, hero: body, face, lid, slotLocal: V3(0, 0.92, 0.05) };
}

function buildDecor() {
  const g = counter(1.6, 0.9, 0.85, C.pink);
  const turn = dyn(put(g, new THREE.Group(), 0, 0.91, 0.08));
  put(turn, mk(G.cyl(0.08, 0.14, 0.2, 0.03, 14), C.cream2, { outline: 'mid' }), 0, 0.1, 0);
  put(turn, mk(G.cyl(0.36, 0.36, 0.05, 0.02, 28), C.cream2, { outline: 'mid' }), 0, 0.22, 0);
  const bag = dyn(put(g, new THREE.Group(), -0.58, 0.91, -0.08));
  const cone = put(bag, mk(G.cyl(0.02, 0.16, 0.42, 0.03, 18), '#FFFBF0'), 0, 0.22, 0);
  cone.rotation.x = Math.PI;
  const tip = put(bag, mk(G.cyl(0.02, 0.04, 0.08, 0.01, 10), C.butter, { outline: 'thin' }), 0, 0.02, 0);
  tip.rotation.x = Math.PI;
  const top = put(bag, mk(G.sphere(0.14, 14, 10), C.pink, { outline: 'mid' }), 0, 0.45, 0);
  top.scale.y = 0.7;
  const face = addFace(bag, 0.36, { position: V3(0, 0.3, 0.13) });
  // the topping palette lined up along the back
  const shelfItems = [[C.pinkDeep, 0.2], [C.blueDeep, 0.22], ['#5A3422', 0.18], [C.butter, 0.2], ['#E4605E', 0.16]];
  shelfItems.forEach(([col, h], i) => {
    const s = jar(col, h, i % 2 ? C.cream2 : C.cherry);
    s.scale.setScalar(0.62);
    put(g, s, 0.22 + i * 0.13, 0.91, -0.3);
  });
  return { group: g, hero: bag, face, turntable: turn, slotLocal: V3(0, 1.16, 0.08) };
}

function buildScrap() {
  const g = new THREE.Group();
  const basketG = dyn(put(g, new THREE.Group()));
  put(basketG, mk(G.cyl(0.36, 0.3, 0.62, 0.06, 24), toon('#fff', { map: weaveTex() })), 0, 0.31, 0);
  const rim = put(basketG, mk(G.torus(0.36, 0.05), C.honeyDark, { outline: 'thin' }), 0, 0.62, 0);
  rim.rotation.x = Math.PI / 2;
  put(basketG, mk(G.cyl(0.3, 0.3, 0.04, 0.01, 20), toon('#fff', { map: ginghamTex(C.sage, 3) }), { outline: false }), 0, 0.58, 0);
  g.add(blob(0.9, 0.9));
  return { group: g, hero: basketG, slotLocal: V3(0, 0.9, 0) };
}

function buildIsland() {
  const g = new THREE.Group();
  const H = 0.92;
  put(g, mk(G.box(0.9, 0.8, 2.1, 0.1), C.blue), 0, 0.42, 0);
  put(g, mk(G.box(0.86, 0.08, 2.06, 0.03), C.blueDeep, { outline: false }), 0, 0.04, 0);
  for (const sx of [-1, 1]) {
    for (const z of [-0.62, 0, 0.62]) {
      put(g, mk(G.box(0.04, 0.56, 0.52, 0.03), C.blue, { outline: 'thin', cast: false }), sx * 0.46, 0.44, z);
      put(g, mk(G.sphere(0.035, 10, 8), C.butter, { outline: 'thin' }), sx * 0.49, 0.56, z + 0.16);
    }
  }
  const topMesh = put(g, mk(G.box(1.1, 0.1, 2.32, 0.04), toon('#fff', { map: planksTex(true) })), 0, H - 0.05, 0);
  // cutting board + rolling pin + knife (the prep station)
  const board = put(g, new THREE.Group(), 0, H, 0.55);
  put(board, mk(G.box(0.62, 0.035, 0.44, 0.015), C.honeyLight, { outline: 'mid' }), 0, 0.018, 0);
  const props = dyn(put(board, new THREE.Group()));
  const pin = put(props, new THREE.Group(), 0, 0.06, -0.12);
  const pinBody = put(pin, mk(G.capsule(0.035, 0.34), C.honey, { outline: 'thin' }));
  pinBody.rotation.z = Math.PI / 2;
  for (const sx of [-1, 1]) {
    const hd = put(pin, mk(G.capsule(0.018, 0.07), C.honeyDark, { outline: 'thin' }), sx * 0.25, 0, 0);
    hd.rotation.z = Math.PI / 2;
  }
  const knife = put(props, new THREE.Group(), 0.2, 0.04, 0.12);
  put(knife, mk(G.box(0.16, 0.012, 0.05, 0.005), '#EAF1F0', { outline: 'thin' }), 0.06, 0, 0);
  put(knife, mk(G.box(0.1, 0.025, 0.03, 0.01), C.honeyDark, { outline: 'thin' }), -0.08, 0, 0);
  knife.rotation.y = -0.4;
  // two set-down spots
  const spots = [];
  for (const z of [-0.22, -0.74]) {
    const spot = put(g, new THREE.Group(), 0, H, z);
    put(spot, mk(G.cyl(0.21, 0.19, 0.02, 0.008, 28), C.cream2, { outline: 'mid' }), 0, 0.01, 0);
    const doily = new THREE.Mesh(G.circle(0.17), toon('#fff', { map: ginghamTex(C.pinkDeep, 3) }));
    doily.rotation.x = -Math.PI / 2;
    put(spot, doily, 0, 0.021, 0);
    spots.push({ group: spot, slotLocal: V3(0, 0.025, 0) });
  }
  // utensil crock and flour dust
  const crock = put(g, new THREE.Group(), 0.34, H, 0.12);
  put(crock, mk(G.cyl(0.08, 0.07, 0.18, 0.02, 16), C.pumpkin, { outline: 'thin' }), 0, 0.09, 0);
  for (const [a, col] of [[0.3, C.honey], [-0.25, C.pinkDeep], [0.05, C.honeyDark]]) {
    const u = put(crock, mk(G.capsule(0.015, 0.26), col, { outline: 'thin' }), Math.sin(a) * 0.03, 0.26, Math.cos(a) * 0.02);
    u.rotation.z = a;
  }
  for (let i = 0; i < 14; i++) {
    const d = put(g, mk(G.sphere(0.012, 6, 4), '#FFFBF0', { outline: false, cast: false }), -0.2 + Math.sin(i * 7.1) * 0.16, H + 0.003, 0.3 + Math.cos(i * 3.3) * 0.08);
    d.scale.y = 0.25;
  }
  for (const sx of [-1, 1]) {
    const sign = label('sign-island', 0.72);
    sign.rotation.y = sx * Math.PI / 2;
    put(g, sign, sx * 0.455, 0.72, -0.62);
  }
  g.add(blob(1.5, 2.7));
  return { group: g, top: topMesh, board, props, pin, knife, spots, slotLocal: V3(0, 0.04, 0) };
}

// ------------------------------------------------------------------ storage

const DRY_ROWS = [
  { y: 1.515, ids: ['cinnamon', 'nuts', 'raisins', 'caramel', 'peanut-butter'] },
  { y: 0.815, ids: ['chocolate', 'graham', 'crispy-rice', 'marshmallows', 'coconut'] },
  { y: 0.115, ids: ['flour', 'sugar', 'oats', 'bread', null] },
];

function buildDryShelf(items) {
  const g = new THREE.Group();
  const W = 2.8, H = 2.2, D = 0.5;
  put(g, mk(G.box(W, H, 0.06, 0.03), C.sage), 0, H / 2, -D / 2 + 0.03);
  for (const sx of [-1, 1]) put(g, mk(G.box(0.08, H, D, 0.03), C.honey), sx * (W / 2 - 0.04), H / 2, 0);
  for (const y of [0.08, 0.78, 1.48, H - 0.04]) put(g, mk(G.box(W, 0.07, D, 0.025), C.honey), 0, y, 0);
  for (const base of [0.08, 0.78, 1.48]) {
    for (let k = 1; k < 5; k++) put(g, mk(G.box(0.045, 0.63, D - 0.06, 0.015), C.honeyLight, { outline: 'thin' }), -W / 2 + (W / 5) * k, base + 0.35, -0.02);
  }
  const crown = scallopAwning(W + 0.1, [C.sage, C.cream2], 0.34);
  put(g, crown, 0, H + 0.02, -D / 2 + 0.04);
  put(g, mk(G.box(1.3, 0.32, 0.05, 0.03), C.honeyDark, { outline: 'mid' }), 0, H + 0.42, -D / 2 + 0.08);
  put(g, label('sign-dry', 1.18), 0, H + 0.42, -D / 2 + 0.11);
  DRY_ROWS.forEach((row) => {
    row.ids.forEach((id, i) => {
      const x = -W / 2 + (W / 5) * (i + 0.5);
      if (!id) {
        for (let k = 0; k < 3; k++) put(g, mk(G.cyl(0.17 - k * 0.02, 0.1, 0.1, 0.03, 18), [C.cream2, C.pink, C.blue][k], { outline: 'thin' }), x, row.y + 0.05 + k * 0.07, 0);
        return;
      }
      const m = put(g, ingredientModel(id), x, row.y, 0.02);
      items.push({ id, obj: m, zone: 'dry' });
      put(g, label(id, 0.46), x, row.y - 0.035, D / 2 + 0.006);
    });
  });
  const pb = blob(W + 0.4, D + 0.6);
  pb.position.z = 0.2;
  g.add(pb);
  return g;
}

function buildProduceStand(items) {
  const g = new THREE.Group();
  put(g, mk(G.box(2.0, 0.3, 0.72, 0.06), C.honey), 0, 0.15, 0);
  put(g, mk(G.box(2.0, 0.3, 0.36, 0.05), C.honeyDark), 0, 0.45, -0.18);
  [['apples', -0.72], ['peaches', -0.24], ['pumpkin', 0.24], ['sweet-potato', 0.72]].forEach(([id, x]) => {
    const c = put(g, ingredientModel(id), x, 0.3, 0.14);
    c.rotation.x = 0.28;
    put(c, label(id, 0.4), 0, 0.1, 0.178);
    items.push({ id, obj: c, zone: 'dry' });
  });
  [['bananas', -0.5], ['pineapple', 0], ['carrots', 0.5]].forEach(([id, x]) => {
    const c = put(g, ingredientModel(id), x, 0.6, -0.17);
    c.rotation.x = 0.2;
    put(c, label(id, 0.4), 0, 0.1, 0.178);
    items.push({ id, obj: c, zone: 'dry' });
  });
  for (const sx of [-1, 1]) put(g, mk(G.cyl(0.04, 0.04, 2.1, 0.015, 10), C.honeyDark, { outline: 'mid' }), sx * 0.98, 1.05, -0.3);
  const awn = scallopAwning(2.2, [C.pinkDeep, C.cream2], 0.42);
  put(g, awn, 0, 2.08, -0.32);
  g.add(blob(2.4, 1.1));
  return g;
}

const COLD_ROWS = [
  { y: 1.42, ids: ['milk', 'cream', 'root-beer', 'ice-cream'] },
  { y: 0.86, ids: ['butter', 'eggs', 'cream-cheese', 'lemons'] },
  { y: 0.3, ids: ['strawberries', 'blueberries', 'cherries', 'limes'] },
];

function buildColdStorage(items) {
  const g = new THREE.Group();
  const W = 2.2, H = 2.15, D = 0.72;
  put(g, mk(G.box(W, 0.14, D, 0.05), C.blueDeep), 0, 0.07, 0);
  for (const sx of [-1, 1]) put(g, mk(G.box(0.1, H, D, 0.04), C.blue), sx * (W / 2 - 0.05), H / 2, 0);
  put(g, mk(G.box(W, H, 0.08, 0.03), C.blue), 0, H / 2, -D / 2 + 0.04);
  put(g, mk(G.box(W - 0.2, H - 0.3, 0.02, 0.01), toon('#F6F4EA', { emissive: '#FFF6DA', emissiveIntensity: 0.25 }), { outline: false }), 0, 0.14 + (H - 0.3) / 2, -D / 2 + 0.09);
  const header = put(g, mk(G.box(W, 0.38, D + 0.04, 0.08), C.blue), 0, H + 0.17, 0.02);
  const face = addFace(g, 0.62, { position: V3(0, H + 0.19, D / 2 + 0.045) });
  put(g, mk(G.box(1.32, 0.32, 0.05, 0.03), C.blueDeep, { outline: 'mid' }), 0, H + 0.58, 0);
  put(g, label('sign-cold', 1.2), 0, H + 0.58, 0.03);
  const xs = [-0.8, -0.29, 0.29, 0.8];
  COLD_ROWS.forEach((row) => {
    put(g, mk(G.box(W - 0.2, 0.04, D - 0.12, 0.015), '#FFFBF0', { outline: 'thin' }), 0, row.y - 0.02, -0.02);
    put(g, mk(G.box(W - 0.2, 0.06, 0.03, 0.012), C.blueDeep, { outline: false }), 0, row.y - 0.03, D / 2 - 0.08);
    row.ids.forEach((id, i) => {
      const m = put(g, ingredientModel(id), xs[i], row.y, -0.05);
      items.push({ id, obj: m, zone: 'cold', door: xs[i] < 0 ? -1 : 1 });
      put(g, label(id, 0.42), xs[i], row.y - 0.03, D / 2 - 0.062);
    });
  });
  // glass doors, hinged at the outer edges
  const doors = [];
  for (const s of [-1, 1]) {
    const pivot = dyn(put(g, new THREE.Group(), s * (W / 2 - 0.1), 0.14, D / 2 - 0.02));
    const dw = W / 2 - 0.1, dh = H - 0.2;
    put(pivot, mk(G.box(0.06, dh, 0.05, 0.02), C.blueDeep, { outline: 'thin' }), -s * 0.03, dh / 2, 0);
    put(pivot, mk(G.box(0.06, dh, 0.05, 0.02), C.blueDeep, { outline: 'thin' }), -s * (dw - 0.03), dh / 2, 0);
    for (const y of [0.03, dh - 0.03]) put(pivot, mk(G.box(dw, 0.06, 0.05, 0.02), C.blueDeep, { outline: 'thin' }), -s * dw / 2, y, 0);
    const glass = new THREE.Mesh(G.plane(dw - 0.08, dh - 0.08), toon('#DDF0F6', { transparent: true, opacity: 0.2 }));
    put(pivot, glass, -s * dw / 2, dh / 2, 0);
    for (const [len, off] of [[0.34, 0], [0.18, 0.09]]) {
      const shine = put(pivot, mk(G.box(0.022, len, 0.008, 0.004), '#FFFFFF', { outline: false, cast: false }), -s * (dw * 0.72 - off), dh * 0.84 - off, 0.012);
      shine.rotation.z = 0.6;
      shine.userData.noHighlight = true;
    }
    const handle = put(pivot, mk(G.capsule(0.022, 0.36), C.butter, { outline: 'thin' }), -s * (dw - 0.12), dh * 0.52, 0.05);
    handle.userData.noHighlight = true;
    doors.push({ pivot, side: s, open: 0, target: 0, timer: 0 });
  }
  const gl = glow('#FFF4D6', 1.8, 0.3);
  put(g, gl, 0, H - 0.25, 0);
  g.add(blob(2.6, 1.2));
  return { group: g, doors, face, glow: gl };
}

// ------------------------------------------------------------------ walls

function wallPiece(w, h, t, x, y, z, mat, plane, tile) {
  const m = mk(G.box(w, h, t, 0.06), mat, { cast: false });
  m.position.set(x, y, z);
  worldUV(m, plane, tile);
  return m;
}

// ------------------------------------------------------------------ world

export function buildWorld(scene) {
  const world = new THREE.Group();
  scene.add(world);
  const fp = new THREE.Group();
  world.add(fp);
  const colliders = [];
  const glows = [];
  const interact = [];
  const H = ROOM.h;

  const addCollider = (obj, pad = 0.02) => {
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3();
    obj.traverse((m) => {
      if (m.isMesh && !m.userData.outline && m.geometry.type !== 'PlaneGeometry' && m.geometry.type !== 'CircleGeometry' && !(m.material && m.material.transparent)) {
        m.geometry.computeBoundingBox();
        box.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld));
      }
    });
    colliders.push({ type: 'box', x0: box.min.x - pad, x1: box.max.x + pad, z0: box.min.z - pad, z1: box.max.z + pad });
  };

  // --- slab and floor
  put(world, mk(G.box(12.7, 0.55, 10.7, 0.22), '#F1CE96'), 0, -0.36, 0);
  put(world, mk(G.box(12.5, 0.5, 10.5, 0.22), C.honeyDark), 0, -0.8, 0);
  const floor = put(world, mk(G.box(12, 0.14, 10, 0.05), toon('#fff', { map: planksTex() }), { outline: 'mid', cast: false }), 0, -0.07, 0);
  worldUV(floor, 'xz', 2.4);

  // --- back walls (seen in the diorama too)
  const paper = toon('#fff', { map: wallpaperTex() });
  const wains = toon('#fff', { map: wainscotTex() });
  world.add(wallPiece(0.3, H + 0.1, 10.3, -6.15, H / 2 - 0.05, -0.15, paper, 'zy', 1.2));
  world.add(wallPiece(12.3, H + 0.1, 0.3, -0.15, H / 2 - 0.05, -5.15, paper, 'xy', 1.2));
  const wL = wallPiece(0.06, 1.1, 10.0, -5.97, 0.55, 0, wains, 'zy', [1.4, 1.1]);
  const wB = wallPiece(11.9, 1.1, 0.06, 0.05, 0.55, -4.97, wains, 'xy', [1.4, 1.1]);
  world.add(wL, wB);
  const trims = (group, list) => {
    for (const [w, x, z, ry] of list) {
      const rail = put(group, mk(G.box(w, 0.09, 0.1, 0.03), C.honey, { outline: 'thin' }), x, 1.12, z);
      rail.rotation.y = ry;
      const base = put(group, mk(G.box(w, 0.14, 0.08, 0.03), C.honeyDark, { outline: 'thin', cast: false }), x, 0.07, z);
      base.rotation.y = ry;
    }
  };
  trims(world, [[10.05, -5.93, 0, Math.PI / 2], [11.95, 0.05, -4.93, 0]]);
  put(world, mk(G.box(0.42, 0.18, 10.45, 0.06), C.honey), -6.15, H + 0.02, -0.15);
  put(world, mk(G.box(12.45, 0.18, 0.42, 0.06), C.honey), -0.15, H + 0.02, -5.15);

  // --- front walls with real window openings + ceiling (baker's eyes only)
  const win = { y0: 1.15, y1: 2.65 };
  // front wall z = 5.15, opening x 1.8..4.2
  fp.add(wallPiece(8.1, H + 0.1, 0.3, -2.25, H / 2 - 0.05, 5.15, paper, 'xy', 1.2));
  fp.add(wallPiece(2.1, H + 0.1, 0.3, 5.25, H / 2 - 0.05, 5.15, paper, 'xy', 1.2));
  fp.add(wallPiece(2.4, win.y0 + 0.05, 0.3, 3.0, win.y0 / 2 - 0.025, 5.15, paper, 'xy', 1.2));
  fp.add(wallPiece(2.4, H + 0.05 - win.y1, 0.3, 3.0, (H + 0.05 + win.y1) / 2, 5.15, paper, 'xy', 1.2));
  // right wall x = 6.15, opening z -2.7..-0.7
  fp.add(wallPiece(0.3, H + 0.1, 2.6, 6.15, H / 2 - 0.05, -4.0, paper, 'zy', 1.2));
  fp.add(wallPiece(0.3, H + 0.1, 6.0, 6.15, H / 2 - 0.05, 2.3, paper, 'zy', 1.2));
  fp.add(wallPiece(0.3, win.y0 + 0.05, 2.0, 6.15, win.y0 / 2 - 0.025, -1.7, paper, 'zy', 1.2));
  fp.add(wallPiece(0.3, H + 0.05 - win.y1, 2.0, 6.15, (H + 0.05 + win.y1) / 2, -1.7, paper, 'zy', 1.2));
  fp.add(wallPiece(12.0, 1.1, 0.06, 0, 0.55, 4.97, wains, 'xy', [1.4, 1.1]));
  fp.add(wallPiece(0.06, 1.1, 10.0, 5.97, 0.55, 0, wains, 'zy', [1.4, 1.1]));
  trims(fp, [[11.95, 0, 4.93, 0], [10.05, 5.93, 0, Math.PI / 2]]);
  const windowFrame = (w, h) => {
    const f = new THREE.Group();
    for (const sx of [-1, 1]) put(f, mk(G.box(0.12, h + 0.12, 0.36, 0.04), C.cream2), sx * (w / 2), h / 2, 0);
    put(f, mk(G.box(w + 0.24, 0.12, 0.36, 0.04), C.cream2), 0, h, 0);
    put(f, mk(G.box(w + 0.4, 0.1, 0.5, 0.04), C.honey), 0, -0.02, -0.08);
    put(f, mk(G.box(0.06, h, 0.06, 0.02), C.cream2, { outline: 'thin' }), 0, h / 2, 0);
    put(f, mk(G.box(w, 0.06, 0.06, 0.02), C.cream2, { outline: 'thin' }), 0, h * 0.62, 0);
    const tex = ginghamTex(C.pinkDeep, 3);
    for (const sx of [-1, 1]) {
      const cur = put(f, mk(G.box(0.34, h + 0.1, 0.05, 0.03), toon('#fff', { map: tex }), { outline: 'thin' }), sx * (w / 2 + 0.12), h / 2 + 0.02, -0.22);
      cur.rotation.z = sx * 0.04;
    }
    const box = put(f, mk(G.box(w * 0.8, 0.16, 0.2, 0.05), C.pinkDeep, { outline: 'mid' }), 0, 0.1, -0.25);
    for (let i = 0; i < 7; i++) {
      const x = -w * 0.36 + (w * 0.72 * i) / 6;
      put(box, mk(G.sphere(0.07, 10, 8), C.sageDark, { outline: 'thin' }), x, 0.1, 0);
      put(box, mk(G.sphere(0.035, 8, 6), [C.pink, C.butter, '#FFFBF0'][i % 3], { outline: 'thin' }), x + 0.02, 0.17, 0.03);
    }
    return f;
  };
  const fw = put(fp, windowFrame(2.4, win.y1 - win.y0), 3.0, win.y0, 5.02);
  fw.rotation.y = Math.PI;
  const rw = put(fp, windowFrame(2.0, win.y1 - win.y0), 6.02, win.y0, -1.7);
  rw.rotation.y = -Math.PI / 2;
  // the hillside outside
  const hillFront = new THREE.Mesh(G.plane(18, 7), new THREE.MeshBasicMaterial({ map: hillsideTex(0) }));
  put(fp, hillFront, 3.0, 1.6, 9.5);
  hillFront.rotation.y = Math.PI;
  const hillRight = new THREE.Mesh(G.plane(16, 7), new THREE.MeshBasicMaterial({ map: hillsideTex(1) }));
  put(fp, hillRight, 10.0, 1.6, -1.7);
  hillRight.rotation.y = -Math.PI / 2;
  // ceiling with beams
  const ceil = put(fp, mk(G.box(12.6, 0.2, 10.6, 0.05), toon('#fff', { map: planksTex(true) }), { cast: false, outline: false }), 0, H + 0.1, 0);
  worldUV(ceil, 'xz', 2.4);
  for (const x of [-4.8, -2.4, 0, 2.4, 4.8]) put(fp, mk(G.box(0.26, 0.22, 10.2, 0.05), C.honeyDark, { cast: false }), x, H - 0.1, 0);
  // bunting between beams
  for (const [z, cols] of [[-1.6, [C.pink, C.butter, C.blue, C.sage]], [2.6, [C.butter, C.pinkDeep, C.sage, C.blue]]]) {
    for (let i = 0; i < 22; i++) {
      const x = -5.4 + i * 0.5;
      const sag = Math.abs(Math.sin(((x + 6) / 2.4) * Math.PI)) * 0.22;
      const flag = put(fp, mk(G.cyl(0.001, 0.1, 0.2, 0.01, 3), cols[i % 4], { outline: 'thin', cast: false }), x, H - 0.28 - sag, z);
      flag.rotation.x = Math.PI;
    }
  }

  // --- kitchen stations
  const stations = {};
  const regStation = (id, type, name, built, extra = {}) => {
    const st = { id, type, name, group: built.group, hero: built.hero, face: built.face, built, item: null, t: 0, bounce: 0, blinkT: Math.random() * 3, ...extra };
    stations[id] = st;
    return st;
  };
  const onLeft = (g, z, x = -5.45) => { g.position.set(x, 0, z); g.rotation.y = Math.PI / 2; world.add(g); return g; };
  const onBack = (g, x, z = -4.52) => { g.position.set(x, 0, z); world.add(g); return g; };

  const mixer = buildMixer();
  onLeft(mixer.group, 1.2);
  regStation('mix', 'mix', 'Mixing Bowl', mixer);
  const stove = buildStove();
  onLeft(stove.group, -0.55);
  regStation('cook', 'cook', 'Stove', stove);
  const oven = buildOven();
  onLeft(oven.group, -2.6, -5.25);
  regStation('bake', 'bake', 'Oven', oven);
  const freezer = buildFreezer();
  onBack(freezer.group, -4.3, -4.48);
  regStation('chill', 'chill', 'Freezer', freezer);
  const decor = buildDecor();
  onBack(decor.group, -2.4);
  regStation('decor', 'decor', 'Decorating Table', decor);
  const scrap = buildScrap();
  onBack(scrap.group, -0.95, -4.45);
  regStation('scrap', 'scrap', 'Scrap Basket', scrap);

  const island = buildIsland();
  island.group.position.set(-2.6, 0, 0.35);
  world.add(island.group);
  worldUV(island.top, 'xz', 1.2);
  const prepSt = regStation('prep', 'prep', 'Prep Island', { group: island.board, hero: island.props, slotLocal: island.slotLocal });
  prepSt.pin = island.pin;
  prepSt.knife = island.knife;
  const spots = island.spots.map((s, i) => regStation(`spot${i + 1}`, 'spot', 'Counter Spot', { group: s.group, hero: null, slotLocal: s.slotLocal }));

  // --- storage corner
  const ingredientItems = [];
  const dry = buildDryShelf(ingredientItems);
  dry.position.set(-5.72, 0, 3.55);
  dry.rotation.y = Math.PI / 2;
  world.add(dry);
  const produce = buildProduceStand(ingredientItems);
  produce.position.set(-2.55, 0, 4.58);
  produce.rotation.y = Math.PI;
  fp.add(produce);
  const cold = buildColdStorage(ingredientItems);
  cold.group.position.set(0.1, 0, 4.6);
  cold.group.rotation.y = Math.PI;
  fp.add(cold.group);

  // --- back-wall window, bench and door
  const bwin = put(world, new THREE.Group(), 1.55, 2.2, -4.98);
  put(bwin, mk(G.box(1.95, 1.55, 0.14, 0.06), C.cream2));
  put(bwin, new THREE.Mesh(G.plane(1.65, 1.25), new THREE.MeshBasicMaterial({ map: skyTex() })), 0, 0, 0.075);
  put(bwin, mk(G.box(0.08, 1.3, 0.08, 0.03), C.cream2, { outline: 'thin' }), 0, 0, 0.1);
  put(bwin, mk(G.box(1.7, 0.08, 0.08, 0.03), C.cream2, { outline: 'thin' }), 0, 0, 0.1);
  put(bwin, mk(G.box(2.15, 0.1, 0.34, 0.04), C.honey), 0, -0.82, 0.14);
  put(bwin, plant(0.5, C.pink), 0.65, -0.77, 0.16);
  for (const sx of [-1, 1]) put(bwin, mk(G.box(0.36, 1.35, 0.06, 0.03), toon('#fff', { map: ginghamTex(C.pinkDeep, 3) }), { outline: 'thin' }), sx * 0.9, 0.05, 0.14);
  put(world, scallopAwning(2.3, [C.pinkDeep, C.cream2]), 1.55, 3.12, -4.95);
  const bench = counter(1.7, 0.6, 0.6, C.honey, C.honeyLight);
  onBack(bench, 1.55, -4.62);
  put(world, basket(0.62, 0.42), 1.15, 0.6, -4.62);
  put(world, basket(0.62, 0.42), 1.95, 0.6, -4.62);
  addCollider(bench);

  const door = put(world, new THREE.Group(), 4.3, 0, -4.97);
  put(door, mk(G.box(1.5, 2.55, 0.12, 0.08), C.honeyDark), 0, 1.27, 0);
  put(door, mk(G.box(1.2, 2.3, 0.12, 0.14), C.pumpkin), 0, 1.17, 0.06);
  const round = put(door, mk(G.cyl(0.26, 0.26, 0.06, 0.02, 24), C.cream2, { outline: 'mid' }), 0, 1.75, 0.14);
  round.rotation.x = Math.PI / 2;
  put(door, new THREE.Mesh(G.circle(0.2), new THREE.MeshBasicMaterial({ map: skyTex() })), 0, 1.75, 0.18);
  put(door, mk(G.sphere(0.06, 10, 8), C.butter, { outline: 'thin' }), 0.42, 1.05, 0.17);
  put(world, scallopAwning(1.8, [C.sageDark, C.cream2], 0.55), 4.3, 2.85, -4.95);
  const mat = put(world, mk(G.box(1.4, 0.04, 0.8, 0.02), toon('#fff', { map: signTex('welcome', C.pink, C.cream2, 256, 128, 52) }), { outline: 'thin', cast: false }), 4.3, 0.02, -4.35);
  mat.userData.noHighlight = true;

  // --- wall decor
  put(world, mk(G.box(2.3, 0.72, 0.08, 0.06), toon('#fff', { map: signTex('Hillside Bakery') }), { outline: 'mid' }), -3.35, 2.85, -4.95);
  const menu = put(world, mk(G.box(1.2, 0.82, 0.08, 0.04), toon('#fff', { map: menuTex() }), { outline: 'mid' }), -0.95, 2.2, -4.95);
  menu.userData.noHighlight = true;
  put(world, mk(G.box(0.45, 0.08, 1.7, 0.03), C.honey, { outline: 'mid' }), -5.78, 2.3, 1.1);
  [C.pink, C.butter, C.sage, C.blue].forEach((c, i) => put(world, jar(c, 0.3), -5.8, 2.34, 0.52 + i * 0.4));
  const clock = put(world, new THREE.Group(), -5.93, 2.62, -0.55);
  clock.rotation.y = Math.PI / 2;
  const cf = put(clock, mk(G.cyl(0.38, 0.38, 0.1, 0.04, 28), C.pumpkin));
  cf.rotation.x = Math.PI / 2;
  const cfi = put(clock, mk(G.cyl(0.3, 0.3, 0.04, 0.01, 28), C.cream2, { outline: 'thin' }), 0, 0, 0.05);
  cfi.rotation.x = Math.PI / 2;
  const h1 = dyn(put(clock, new THREE.Group(), 0, 0, 0.08));
  put(h1, mk(G.box(0.03, 0.2, 0.02, 0.01), INK, { outline: false }), 0, 0.09, 0);
  const h2 = dyn(put(clock, new THREE.Group(), 0, 0, 0.085));
  put(h2, mk(G.box(0.03, 0.14, 0.02, 0.01), INK, { outline: false }), 0, 0.06, 0);
  for (const [z, c] of [[-1.45, C.honey], [-1.2, C.pinkDeep]]) {
    put(world, mk(G.capsule(0.03, 0.34), c, { outline: 'thin' }), -5.9, 2.2, z);
    const head = put(world, mk(G.sphere(0.08, 10, 8), c, { outline: 'thin' }), -5.9, 1.97, z);
    head.scale.set(0.4, 1.2, 1);
  }
  for (const [x, z, ry] of [[3.0, -4.93, 0], [5.55, -4.93, 0], [-5.93, -3.8, Math.PI / 2]]) {
    const s = sconce();
    put(world, s.group, x, 2.5, z).rotation.y = ry;
    glows.push(s.glow);
  }
  // string lights along both back walls
  const bulbCols = [C.butter, C.pink, C.blue, '#FFD9A0', C.sage];
  let bulbN = 0;
  const lightRun = (a, b, sagCount) => {
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const p = a.clone().lerp(b, t);
      p.y -= Math.abs(Math.sin(t * Math.PI * sagCount)) * 0.28;
      pts.push(p);
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    world.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 120, 0.018, 5), toon(INK)));
    const count = sagCount * 5;
    for (let i = 0; i < count; i++) {
      const p = curve.getPoint((i + 0.5) / count);
      const col = bulbCols[bulbN++ % bulbCols.length];
      const bulb = put(world, mk(G.sphere(0.07, 10, 8), col, { outline: 'thin', emissive: col, emissiveIntensity: 0.55, cast: false }), p.x, p.y - 0.08, p.z);
      bulb.scale.y = 1.3;
      const gl = glow(col, 0.55, 0.45);
      gl.position.copy(bulb.position);
      world.add(gl);
      glows.push(gl);
    }
  };
  lightRun(V3(-5.9, H - 0.12, 4.9), V3(-5.9, H - 0.12, -4.9), 4);
  lightRun(V3(-5.9, H - 0.12, -4.88), V3(5.9, H - 0.12, -4.88), 5);

  // --- café corner
  const rug = put(world, mk(G.box(5.8, 0.03, 3.3, 0.01), toon('#fff', { map: stripesTex([C.cream2, C.pink, C.cream2, C.sage, C.cream2, C.blue, C.cream2, C.butter], 1, 1, true) }), { outline: 'thin', cast: false }), 3.0, 0.015, 1.55);
  rug.userData.noHighlight = true;
  const tables = [{ x: 1.75, z: 1.55, cloth: C.pinkDeep }, { x: 4.35, z: 1.55, cloth: C.blueDeep }].map((t) => {
    const g = put(world, cafeTable(t.cloth), t.x, 0, t.z);
    colliders.push({ type: 'circle', x: t.x, z: t.z, r: 0.66 });
    return { ...t, group: g };
  });
  const seats = [
    { x: 1.75, z: 0.62, ry: 0, table: 0, col: C.pink },
    { x: 0.8, z: 1.55, ry: Math.PI / 2, table: 0, col: C.sage },
    { x: 4.35, z: 0.62, ry: 0, table: 1, col: C.blue },
    { x: 5.3, z: 1.55, ry: -Math.PI / 2, table: 1, col: C.butter },
  ].map((s) => {
    const ch = put(world, chair(s.col), s.x, 0, s.z);
    ch.rotation.y = s.ry;
    colliders.push({ type: 'circle', x: s.x, z: s.z, r: 0.3 });
    const t = tables[s.table];
    const dir = V3(t.x - s.x, 0, t.z - s.z).normalize();
    return { ...s, chair: ch, occupant: null, plateSpot: V3(s.x + dir.x * 0.5, 0.645, s.z + dir.z * 0.5), aisle: V3(s.x, 0, -0.45) };
  });

  // window seat under the front window and a cake sideboard on the right wall
  const seat = put(fp, new THREE.Group(), 3.0, 0, 4.66);
  put(seat, mk(G.box(2.3, 0.44, 0.56, 0.08), C.honey), 0, 0.22, 0);
  put(seat, mk(G.box(2.2, 0.1, 0.5, 0.05), toon('#fff', { map: ginghamTex(C.sageDark, 6) })), 0, 0.49, 0);
  for (const [x, c] of [[-0.75, C.pink], [0.1, C.butter], [0.8, C.blue]]) {
    const p = put(seat, mk(G.box(0.38, 0.3, 0.14, 0.1), c, { outline: 'mid' }), x, 0.68, 0.14);
    p.rotation.x = -0.25;
  }
  addCollider(seat);
  const side = put(fp, counter(2.0, 0.55, 0.9, C.pink), 5.62, 0, 3.1);
  side.rotation.y = -Math.PI / 2;
  addCollider(side);
  ['strawberry-shortcake', 'cupcake', 'cherry-pie'].forEach((id, i) => {
    const stand = put(side, new THREE.Group(), -0.62 + i * 0.62, 0.9, 0);
    put(stand, mk(G.cyl(0.05, 0.08, 0.1, 0.02, 12), C.cream2, { outline: 'thin' }), 0, 0.05, 0);
    put(stand, mk(G.cyl(0.21, 0.21, 0.03, 0.01, 24), C.cream2, { outline: 'thin' }), 0, 0.11, 0);
    const model = put(stand, dessertModel(BY_ID[id]), 0, 0.12, 0);
    model.scale.setScalar(0.95);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon('#E6F4F8', { transparent: true, opacity: 0.22 }));
    put(stand, dome, 0, 0.12, 0);
    put(stand, mk(G.sphere(0.03, 8, 6), C.butter, { outline: 'thin' }), 0, 0.35, 0);
  });
  put(fp, frame(0.7, 0.85, catPortrait()), 0.6, 2.1, 4.97).rotation.y = Math.PI;
  put(fp, frame(0.9, 0.72, cakePoster()), 5.97, 2.15, 1.3).rotation.y = -Math.PI / 2;
  put(fp, plant(1.0, C.pink), 5.35, 0, 4.35);
  put(fp, plant(0.7, C.sage), 1.55, 0, 4.55);
  put(fp, plant(0.9, C.blueDeep), 5.4, 0, -3.55);
  colliders.push({ type: 'circle', x: 5.35, z: 4.35, r: 0.38 }, { type: 'circle', x: 1.55, z: 4.55, r: 0.28 }, { type: 'circle', x: 5.4, z: -3.55, r: 0.34 });
  for (const [p, x, z] of [[plant(1.1, C.pumpkin), 5.35, -4.35], [plant(0.8, C.blueDeep), -5.45, -4.45]]) {
    put(world, p, x, 0, z);
    colliders.push({ type: 'circle', x, z, r: 0.38 * p.scale.x });
  }

  // --- lights: pendants (baker's eyes) and the point lights they cast
  const lights = [];
  const lamp = (x, z, col) => {
    const p = pendant(0.95, col);
    put(fp, p.group, x, H, z);
    glows.push(p.glow);
    const L = new THREE.PointLight('#FFD9A0', 2.6, 6.5, 1.3);
    L.position.set(x, H + p.bulbY, z);
    scene.add(L);
    lights.push(L);
  };
  lamp(-2.6, 0.35, C.butter);
  lamp(1.75, 1.55, C.pink);
  lamp(4.35, 1.55, C.sage);
  const corner = new THREE.PointLight('#FFE3B8', 1.8, 6, 1.3);
  corner.position.set(-3.2, 2.7, 3.6);
  scene.add(corner);
  lights.push(corner);
  const flush = put(fp, mk(G.cyl(0.3, 0.26, 0.1, 0.04, 20), C.cream2, { outline: 'mid', emissive: '#FFE8B8', emissiveIntensity: 0.5, cast: false }), -3.2, H - 0.05, 3.6);
  flush.userData.noHighlight = true;
  const fg = glow('#FFE3A8', 1.4, 0.4);
  put(fp, fg, -3.2, H - 0.2, 3.6);
  glows.push(fg);

  // --- dust motes drifting in the window light (baker's eyes)
  const moteGeo = new THREE.BufferGeometry();
  const mp = new Float32Array(90 * 3);
  for (let i = 0; i < 90; i++) {
    mp[i * 3] = 0.5 + Math.random() * 5;
    mp[i * 3 + 1] = 0.5 + Math.random() * 1.8;
    mp[i * 3 + 2] = -2 + Math.random() * 6.5;
  }
  moteGeo.setAttribute('position', new THREE.BufferAttribute(mp, 3));
  const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({ color: '#FFF1C8', size: 0.028, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending }));
  fp.add(motes);

  // --- colliders for kitchen furniture
  for (const g of [mixer.group, stove.group, oven.group, freezer.group, decor.group, scrap.group, island.group, dry, produce, cold.group]) addCollider(g);

  // --- first-person-only layer
  setLayer(fp, FP_LAYER);
  for (const L of lights) L.layers.enableAll();

  // --- interactables: stations, storage items, spots
  world.updateMatrixWorld(true);
  for (const st of Object.values(stations)) {
    st.slot = st.group.localToWorld(st.built.slotLocal.clone());
    interact.push({ kind: 'station', station: st, obj: st.type === 'prep' ? island.board : st.group });
  }
  for (const it of ingredientItems) interact.push({ kind: 'ingredient', id: it.id, zone: it.zone, door: it.door, obj: it.obj });
  for (const it of interact) {
    it.box = new THREE.Box3().setFromObject(it.obj);
    if (it.kind === 'station' && it.station.type !== 'spot' && it.station.type !== 'prep') it.box.max.y = Math.max(it.box.max.y, 1.3);
    if (it.kind === 'station' && (it.station.type === 'spot' || it.station.type === 'prep')) it.box.expandByVector(V3(0.06, 0.12, 0.06));
    it.hl = buildHighlight(it.obj);
  }

  // --- batch everything static into a handful of draws
  mergeStatic(world);

  return {
    world, stations, spots, colliders, seats, tables, glows, lights, interact, motes,
    coldDoors: cold.doors, coldFace: cold.face,
    door: V3(4.3, 0, -4.55),
    clockHands: [h1, h2],
  };
}
