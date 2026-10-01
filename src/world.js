// The bakery room: kitchen stations with faces, a center prep island, Dry and
// Cold Storage, a café corner and cozy decor. Things only seen through the
// baker's eyes (front walls, ceiling, pendants, front-wall furniture, the
// hillside outside) live on layer 1, so the title diorama stays a cutaway.
import * as THREE from 'three';
import { G, C, INK, mk, toon, glow, blob, worldUV, canvasTex } from './toon.js';
import {
  planksTex, wallpaperTex, wainscotTex, stripesTex, ginghamTex, weaveTex, signTex, menuTex, skyTex, hillsideTex,
  scallopAwning, plant, basket, jar, counter, chair, cafeTable, sconce, pendant, frame, catPortrait, cakePoster,
} from './props.js';
import { ingredientModel, label } from './ingredients.js';
import { BY_ID } from './desserts.js';
import { dessertModel, fluted } from './dessert3d.js';
import { buildHighlight, mergeStatic } from './merge.js';
import { knifeModel, pinModel, pipingBag, spatulaModel, woodSpoon } from './tools.js';

export const ROOM = { x0: -6, x1: 6, z0: -5, z1: 5, h: 3.6 };
export const FP_LAYER = 1;

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const dyn = (o) => { o.userData.dynamic = true; return o; };
const put = (parent, obj, x = 0, y = 0, z = 0) => { obj.position.set(x, y, z); parent.add(obj); return obj; };
function setLayer(obj, layer) { obj.traverse((o) => o.layers.set(layer)); return obj; }

// ------------------------------------------------------------------ stations

const v2 = (pts) => pts.map(([x, y]) => new THREE.Vector2(x, y));
// a tool that rests somewhere and gets animated while you work
const tool = (parent, obj, x, y, z, rx = 0, ry = 0, rz = 0) => {
  put(parent, obj, x, y, z);
  obj.rotation.set(rx, ry, rz);
  obj.userData.rest = { p: obj.position.clone(), r: obj.rotation.clone() };
  obj.userData.dynamic = true;
  return obj;
};

/** A pastel stand mixer on a counter. The bowl shows the batter coming together while you mix. */
function buildMixer() {
  const g = counter(1.5, 0.9, 0.91, C.sage);
  const H = 0.91;
  const shell = '#F4A6B6';
  const stand = dyn(put(g, new THREE.Group(), 0.0, H, 0.04));
  put(stand, mk(G.box(0.62, 0.07, 0.4, 0.035), shell), 0, 0.035, 0.0);
  put(stand, mk(G.box(0.58, 0.012, 0.36, 0.006), C.cream2, { outline: false }), 0, 0.071, 0.0);
  put(stand, mk(G.box(0.19, 0.48, 0.17, 0.08), shell), -0.22, 0.3, 0);
  const head = put(stand, new THREE.Group(), -0.06, 0.565, 0);
  put(head, mk(G.capsule(0.105, 0.32), shell)).rotation.z = Math.PI / 2;
  const band = put(head, mk(G.torus(0.108, 0.013, Math.PI * 2, 40), C.cream2, { outline: 'thin' }), 0.04, 0, 0);
  band.rotation.y = Math.PI / 2;
  const hub = put(head, mk(G.cyl(0.065, 0.065, 0.035, 0.012), C.cream2, { outline: 'thin' }), 0.272, 0, 0);
  hub.rotation.z = Math.PI / 2;
  put(head, mk(G.cyl(0.03, 0.03, 0.03, 0.01), '#DCE6EA', { outline: 'thin' }), 0.15, -0.1, 0);
  const lever = put(stand, mk(G.capsule(0.012, 0.06), C.cream2, { outline: 'thin' }), -0.21, 0.48, 0.1);
  lever.rotation.x = 0.7;
  put(stand, mk(G.sphere(0.028, 14, 10), C.cherry, { outline: 'thin' }), -0.22, 0.34, 0.088);
  // the steel bowl: outer wall up, rim, inner wall down
  const bowl = put(stand, new THREE.Group(), 0.1, 0.071, 0);
  put(bowl, mk(G.lathe(v2([[0.0005, 0], [0.09, 0], [0.122, 0.02], [0.166, 0.1], [0.18, 0.2], [0.173, 0.206], [0.158, 0.106], [0.113, 0.031], [0.0005, 0.024]]), 40), '#DCE6EA', { outline: 'mid' }));
  const handle = put(bowl, mk(G.torus(0.04, 0.009, Math.PI, 16), '#C9D4D9', { outline: 'thin' }), 0, 0.13, 0.178);
  handle.rotation.set(0, Math.PI / 2, -Math.PI / 2);
  // what's inside: a batter surface that rises and blends, plus ingredient bits that melt into it
  const contents = dyn(put(bowl, new THREE.Group()));
  const batterMat = toon(C.butter, { unique: true });
  const surface = put(contents, mk(G.lathe(v2([[0.0005, 0], [0.15, 0], [0.153, 0.006], [0.1, 0.014], [0.0005, 0.018]]), 40), batterMat, { outline: false }), 0, 0.1, 0);
  const swirlMat = toon('#FFF3DC', { unique: true });
  const swirlRing = put(contents, mk(G.torus(0.07, 0.008, Math.PI * 1.6, 40), swirlMat, { outline: false }), 0, 0.118, 0);
  swirlRing.rotation.x = Math.PI / 2;
  const bits = dyn(put(contents, new THREE.Group(), 0, 0.1, 0));
  const dough = put(contents, mk(G.sphere(0.075, 24, 16), batterMat, { outline: 'thin' }), 0, 0.1, 0);
  dough.scale.y = 0.75;
  dough.visible = false;
  // the beater on its shaft: whisk, dough hook or flat paddle
  const beater = dyn(put(stand, new THREE.Group(), 0.1, 0.455, 0));
  put(beater, mk(G.cyl(0.011, 0.011, 0.12, 0.004), '#C9D4D9', { outline: 'thin' }), 0, -0.05, 0);
  const whisk = dyn(put(beater, new THREE.Group(), 0, -0.2, 0));
  for (let i = 0; i < 4; i++) {
    const loop = put(whisk, mk(G.torus(0.055, 0.005, Math.PI * 2, 32), '#EEF2F4', { outline: 'thin' }));
    loop.rotation.y = (i / 4) * Math.PI;
    loop.scale.set(1, 1.7, 1);
  }
  const hook = dyn(put(beater, new THREE.Group(), 0, -0.12, 0));
  const hookPts = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    hookPts.push(new THREE.Vector3(Math.sin(t * 2.4) * 0.05 * t, -t * 0.16, Math.cos(t * 2.4) * 0.04 * t));
  }
  put(hook, mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hookPts), 40, 0.012, 8), '#EEF2F4', { outline: 'thin' }));
  const paddle = dyn(put(beater, new THREE.Group(), 0, -0.19, 0));
  const pd = put(paddle, mk(G.torus(0.06, 0.012, Math.PI * 2, 32), '#EEF2F4', { outline: 'thin' }));
  pd.scale.set(0.8, 1.25, 1);
  put(paddle, mk(G.box(0.012, 0.13, 0.01, 0.004), '#EEF2F4', { outline: false }));
  for (const grp of [stand, whisk, hook, paddle]) mergeStatic(grp);
  hook.visible = paddle.visible = false;
  // a butter jar and a bowl of eggs nearby
  put(g, jar(C.butter, 0.26), -0.55, H, -0.15);
  const eggs = put(g, new THREE.Group(), 0.55, H, -0.1);
  put(eggs, mk(G.lathe(v2([[0.0005, 0], [0.08, 0], [0.13, 0.06], [0.14, 0.12], [0.13, 0.125], [0.12, 0.065], [0.075, 0.015], [0.0005, 0.012]]), 32), C.blue, { outline: 'thin' }));
  for (const [x, z, r] of [[-0.04, 0, 0.3], [0.05, 0.03, -0.4], [0, -0.05, 0.1]]) {
    const e = put(eggs, mk(G.lathe(v2([[0.0005, 0], [0.03, 0.002], [0.05, 0.02], [0.056, 0.045], [0.05, 0.072], [0.032, 0.09], [0.0005, 0.094]]), 24), '#FFF6E4', { outline: 'thin' }), x, 0.02, z);
    e.rotation.z = r;
  }
  return {
    group: g, hero: stand, face: null, head, bowl, contents, surface, batterMat, swirlMat, swirlRing, bits, dough, beater,
    attach: { whisk, hook, paddle }, whisk: beater, slotLocal: V3(0.1, H + 0.2, 0.04),
  };
}

/** A range top with an open pot (you can see what's cooking) and a frying pan of oil. */
function buildStove() {
  const g = counter(1.5, 0.9, 0.91, C.blue);
  const H = 0.91;
  put(g, mk(G.box(1.22, 0.05, 0.76, 0.025), '#5A3E32', { outline: 'thin' }), 0, H + 0.005, 0);
  const top = H + 0.03;
  for (const [x, z] of [[-0.3, 0.12], [0.3, 0.12], [-0.3, -0.22], [0.3, -0.22]]) {
    const ring = put(g, mk(G.torus(0.12, 0.016, Math.PI * 2, 40), '#2E221C', { outline: false }), x, top + 0.004, z);
    ring.rotation.x = Math.PI / 2;
    for (const ry of [0, Math.PI / 2]) put(g, mk(G.box(0.24, 0.014, 0.02, 0.006), '#3A2C24', { outline: false }), x, top + 0.008, z).rotation.y = ry + 0.4;
  }
  for (const x of [-0.45, -0.15, 0.15, 0.45]) {
    const knob = put(g, mk(G.cyl(0.055, 0.055, 0.05, 0.018), C.cream2, { outline: 'thin' }), x, 0.72, 0.475);
    knob.rotation.x = Math.PI / 2;
    put(g, mk(G.box(0.01, 0.05, 0.01, 0.004), C.cocoa, { outline: false }), x, 0.72, 0.503);
  }
  // the pot, open so you can watch it simmer
  const pot = dyn(put(g, new THREE.Group(), -0.3, top + 0.008, 0.12));
  put(pot, mk(G.lathe(v2([[0.0005, 0], [0.19, 0], [0.207, 0.014], [0.214, 0.122], [0.226, 0.134], [0.22, 0.144], [0.198, 0.132], [0.195, 0.02], [0.0005, 0.02]]), 48), C.pumpkin, { outline: 'mid' }));
  for (const sx of [-1, 1]) {
    const h = put(pot, mk(G.capsule(0.022, 0.07), C.pumpkin, { outline: 'thin' }), sx * 0.25, 0.1, 0);
    h.rotation.z = Math.PI / 2;
  }
  const soupMat = toon('#F3C07A', { unique: true });
  const soup = put(pot, mk(G.lathe(v2([[0.0005, 0], [0.194, 0], [0.194, 0.006], [0.12, 0.014], [0.0005, 0.018]]), 40), soupMat, { outline: false }), 0, 0.094, 0);
  const bubbleMat = toon('#FFE6B8', { unique: true });
  const bubbles = [];
  for (let i = 0; i < 7; i++) {
    const a = i * 2.39, d = 0.04 + (i % 3) * 0.045;
    const b = put(pot, mk(G.sphere(0.014, 12, 8), bubbleMat, { outline: 'thin' }), Math.cos(a) * d, 0.109, Math.sin(a) * d);
    b.scale.setScalar(0.01);
    b.userData.phase = i * 0.37;
    b.userData.dynamic = true;
    bubbles.push(b);
  }
  const spoon = dyn(put(pot, new THREE.Group(), 0, 0.1, 0));
  const sp = put(spoon, mk(G.capsule(0.016, 0.36), C.honey, { outline: 'thin' }), 0.1, 0.17, 0);
  sp.rotation.z = -0.45;
  put(spoon, mk(G.sphere(0.035, 16, 10), C.honey, { outline: 'thin' }), 0.02, 0.0, 0).scale.set(1, 0.35, 0.75);
  // the frying pan with shimmering oil
  const pan = dyn(put(g, new THREE.Group(), 0.3, top + 0.008, 0.12));
  put(pan, mk(G.lathe(v2([[0.0005, 0], [0.17, 0], [0.19, 0.01], [0.205, 0.058], [0.198, 0.064], [0.181, 0.017], [0.0005, 0.013]]), 48), '#4A3A36', { outline: 'mid' }));
  const oilMat = toon('#F6C35A', { emissive: '#FFB347', emissiveIntensity: 0.0, unique: true });
  put(pan, mk(G.lathe(v2([[0.0005, 0], [0.18, 0], [0.18, 0.004], [0.0005, 0.006]]), 40), oilMat, { outline: false }), 0, 0.016, 0);
  const ph = put(pan, mk(G.box(0.27, 0.026, 0.045, 0.012), C.honeyDark, { outline: 'thin' }), 0.33, 0.055, 0);
  ph.rotation.z = 0.12;
  // a marshmallow on a skewer for toasting
  const skewer = dyn(put(g, new THREE.Group(), 0.3, top + 0.16, 0.12));
  const stick = put(skewer, mk(G.cyl(0.006, 0.006, 0.42, 0.002), C.honeyLight, { outline: 'thin' }), 0.2, 0, 0);
  stick.rotation.z = Math.PI / 2 - 0.25;
  const mallowMat = toon('#FFF6F0', { unique: true });
  put(skewer, mk(G.cyl(0.035, 0.035, 0.045, 0.014), mallowMat, { outline: 'thin' }), 0, -0.005, 0).rotation.z = Math.PI / 2 - 0.25;
  skewer.visible = false;
  const flame = glow('#FF9A3C', 0.9, 0);
  put(g, flame, -0.3, top + 0.03, 0.12);
  const panFlame = glow('#FF9A3C', 0.8, 0);
  put(g, panFlame, 0.3, top + 0.03, 0.12);
  for (const grp of [pot, pan, skewer]) mergeStatic(grp);
  return {
    group: g, hero: pot, face: null, pot, pan, flame, panFlame, spoon, soup, soupMat, bubbles, bubbleMat, oilMat, skewer, mallowMat,
    potTop: V3(-0.3, top + 0.12, 0.12), slotLocal: V3(0.3, top + 0.03, 0.12),
  };
}

function buildOven() {
  // a chunky retro range oven: glass door, glowing cavity and a wire rack you can see the treat on
  const g = new THREE.Group();
  const W = 1.5, H = 1.34, D = 0.95;
  for (const [x, z] of [[-0.6, -0.36], [0.6, -0.36], [-0.6, 0.36], [0.6, 0.36]]) put(g, mk(G.cyl(0.07, 0.09, 0.1, 0.03, 12), C.honeyDark, { outline: 'mid' }), x, 0.05, z);
  const body = dyn(put(g, new THREE.Group()));
  const shell = C.apricot;
  put(body, mk(G.box(W, 0.28, D, 0.08), shell), 0, 0.24, 0);
  put(body, mk(G.box(W, 0.36, D, 0.1), shell), 0, H - 0.18, 0);
  for (const sx of [-1, 1]) put(body, mk(G.box(0.18, 0.66, D, 0.05), shell), sx * (W / 2 - 0.09), 0.69, 0);
  put(body, mk(G.box(W - 0.3, 0.66, 0.08, 0.03), shell), 0, 0.69, -D / 2 + 0.04);
  // the cavity lining glows while baking
  const windowMat = toon('#7A4630', { emissive: '#FF8A3C', emissiveIntensity: 0.12, unique: true });
  const lining = [
    [W - 0.36, 0.02, D - 0.14, 0, 0.385, 0.02],
    [W - 0.36, 0.02, D - 0.14, 0, 0.995, 0.02],
    [0.02, 0.62, D - 0.14, -(W / 2 - 0.19), 0.69, 0.02],
    [0.02, 0.62, D - 0.14, W / 2 - 0.19, 0.69, 0.02],
    [W - 0.36, 0.62, 0.02, 0, 0.69, -D / 2 + 0.1],
  ];
  for (const [w, h, d, x, y, z] of lining) put(body, mk(G.box(w, h, d, 0.005), windowMat, { outline: false, cast: false }), x, y, z);
  // wire rack
  for (const x of [-0.42, -0.21, 0, 0.21, 0.42]) put(body, mk(G.box(0.02, 0.02, D - 0.2, 0.008), '#F3E6D0', { outline: false, cast: false }), x, 0.53, 0.02);
  for (const z of [-0.25, 0.28]) put(body, mk(G.box(W - 0.4, 0.022, 0.022, 0.008), '#F3E6D0', { outline: false, cast: false }), 0, 0.535, z);
  // a baking sheet on the rack: treats bake on this, not on a dinner plate
  put(body, mk(G.box(0.86, 0.012, 0.6, 0.006), '#C9D4D9', { outline: 'thin', cast: false }), 0, 0.548, 0.03);
  for (const [w, d, x, z] of [[0.86, 0.016, 0, 0.32], [0.86, 0.016, 0, -0.26], [0.016, 0.6, 0.42, 0.03], [0.016, 0.6, -0.42, 0.03]]) put(body, mk(G.box(w, 0.025, d, 0.006), '#B9C6CC', { outline: false, cast: false }), x, 0.558, z);
  // control panel with knobs, a dial and an indicator light
  put(body, mk(G.box(W - 0.2, 0.22, 0.04, 0.03), C.cream2, { outline: 'thin' }), 0, H - 0.17, D / 2 + 0.01);
  for (const x of [-0.5, -0.3, 0.3, 0.5]) {
    const k = put(body, mk(G.cyl(0.06, 0.06, 0.06, 0.02, 14), C.cocoa, { outline: 'thin' }), x, H - 0.17, D / 2 + 0.05);
    k.rotation.x = Math.PI / 2;
  }
  const dial = put(body, mk(G.cyl(0.09, 0.09, 0.04, 0.015, 20), '#FFFBF0', { outline: 'thin' }), 0, H - 0.17, D / 2 + 0.04);
  dial.rotation.x = Math.PI / 2;
  const lightMat = toon('#E4605E', { emissive: '#FF5A3C', emissiveIntensity: 0, unique: true });
  put(body, mk(G.sphere(0.025, 10, 8), lightMat, { outline: 'thin' }), 0.15, H - 0.17, D / 2 + 0.04);
  // bottom-hinged glass door
  const door = dyn(put(body, new THREE.Group(), 0, 0.38, D / 2 + 0.02));
  const DW = W - 0.3, DH = 0.64;
  put(door, mk(G.box(DW, 0.1, 0.07, 0.03), C.pumpkin), 0, 0.05, 0);
  put(door, mk(G.box(DW, 0.1, 0.07, 0.03), C.pumpkin), 0, DH - 0.05, 0);
  for (const sx of [-1, 1]) put(door, mk(G.box(0.1, DH, 0.07, 0.03), C.pumpkin), sx * (DW / 2 - 0.05), DH / 2, 0);
  const glass = new THREE.Mesh(G.plane(DW - 0.2, DH - 0.2), toon('#FFE2B0', { transparent: true, opacity: 0.22 }));
  put(door, glass, 0, DH / 2, 0.005);
  const shine = put(door, mk(G.box(0.025, 0.2, 0.006, 0.003), '#FFFFFF', { outline: false, cast: false }), -DW / 2 + 0.2, DH / 2 + 0.06, 0.012);
  shine.rotation.z = 0.6;
  shine.userData.noHighlight = true;
  const handle = put(door, mk(G.capsule(0.028, DW - 0.36), C.butter, { outline: 'thin' }), 0, DH + 0.02, 0.1);
  handle.rotation.z = Math.PI / 2;
  for (const sx of [-1, 1]) put(door, mk(G.box(0.03, 0.03, 0.08, 0.01), C.butter, { outline: 'thin' }), sx * (DW / 2 - 0.2), DH + 0.02, 0.05);
  // little vent pipe on top for steam
  put(body, mk(G.cyl(0.09, 0.1, 0.3, 0.03, 14), C.honeyDark), 0.45, H + 0.15, -0.25);
  const gl = glow('#FFA24C', 1.1, 0.1);
  put(body, gl, 0, 0.7, 0.1);
  mergeStatic(door);
  mergeStatic(body);
  g.add(blob(2.0, 1.4));
  return { group: g, hero: body, face: null, door, windowMat, lightMat, glow: gl, chimneyTop: V3(0.45, H + 0.32, -0.25), slotLocal: V3(0, 0.555, 0.03) };
}

/** A hollow chest freezer: lift the lid and the treat sits inside on a frosty floor. */
function buildFreezer() {
  const g = new THREE.Group();
  const body = dyn(put(g, new THREE.Group()));
  const W = 1.3, D = 0.8, Hh = 0.86, t = 0.07;
  put(body, mk(G.box(W, 0.14, D, 0.06), C.blue), 0, 0.09, 0);
  for (const sz of [-1, 1]) put(body, mk(G.box(W, Hh - 0.15, t, 0.03), C.blue), 0, (Hh + 0.15) / 2, sz * (D / 2 - t / 2));
  for (const sx of [-1, 1]) put(body, mk(G.box(t, Hh - 0.15, D - 2 * t, 0.03), C.blue), sx * (W / 2 - t / 2), (Hh + 0.15) / 2, 0);
  put(body, mk(G.box(W - 2 * t, 0.02, D - 2 * t, 0.008), '#EAF6FA', { outline: false }), 0, 0.17, 0);
  for (const [x, z, s] of [[-0.45, -0.25, 1], [0.48, 0.22, 0.8], [0.4, -0.26, 0.7], [-0.47, 0.24, 0.9]]) {
    const f = put(body, mk(G.sphere(0.05 * s, 12, 8), '#FFFFFF', { outline: 'thin' }), x, 0.18, z);
    f.scale.y = 0.5;
  }
  put(body, mk(G.box(W - 0.06, 0.03, 0.035, 0.012), '#EAF6FA', { outline: 'thin' }), 0, Hh - 0.01, D / 2 - 0.02);
  // the lift: a wire tray on a post that brings the treat up to the rim
  const tray = dyn(put(body, new THREE.Group(), 0, 0.181, 0.02));
  put(tray, mk(G.box(0.62, 0.014, 0.5, 0.006), '#EAF6FA', { outline: 'thin', cast: false }), 0, 0.007, 0);
  for (const x of [-0.2, -0.1, 0, 0.1, 0.2]) put(tray, mk(G.box(0.012, 0.006, 0.46, 0.003), '#C7E3EC', { outline: false, cast: false }), x, 0.016, 0);
  for (const sz of [-1, 1]) put(tray, mk(G.box(0.62, 0.022, 0.016, 0.006), '#C7E3EC', { outline: 'thin', cast: false }), 0, 0.012, sz * 0.242);
  mergeStatic(tray);
  const post = dyn(put(body, mk(G.cyl(0.035, 0.035, 1, 0.004), '#C7E3EC', { outline: 'thin', cast: false }), 0, 0.181, 0.02));
  post.scale.y = 0.001;
  // front: a vent grille and a snowflake badge
  for (let i = 0; i < 4; i++) put(body, mk(G.box(0.5, 0.016, 0.01, 0.006), C.blueDeep, { outline: false }), 0, 0.2 + i * 0.035, D / 2 + 0.003);
  const badge = put(body, mk(G.cyl(0.07, 0.07, 0.02, 0.008), '#FFFBF0', { outline: 'thin' }), 0, 0.52, D / 2 + 0.008);
  badge.rotation.x = Math.PI / 2;
  for (let i = 0; i < 3; i++) put(body, mk(G.box(0.09, 0.012, 0.006, 0.004), C.blueDeep, { outline: false }), 0, 0.52, D / 2 + 0.02).rotation.z = (i / 3) * Math.PI;
  for (const x of [-0.5, 0.5]) for (const z of [-0.3, 0.3]) put(body, mk(G.cyl(0.05, 0.06, 0.03, 0.01), C.blueDeep, { outline: 'thin' }), x, 0.015, z);
  // the lid, hinged along the back
  const lid = dyn(put(body, new THREE.Group(), 0, Hh, -D / 2));
  put(lid, mk(G.box(W + 0.03, 0.09, D + 0.03, 0.04), C.blue), 0, 0.045, D / 2);
  const lh = put(lid, mk(G.capsule(0.022, 0.3), C.cream2, { outline: 'thin' }), 0, 0.03, D + 0.035);
  lh.rotation.z = Math.PI / 2;
  for (const [x, z, s] of [[-0.38, 0.28, 1], [0.32, 0.52, 0.75], [0.0, 0.16, 0.6]]) {
    const f = put(lid, mk(G.cyl(0.07 * s, 0.075 * s, 0.008, 0.004), '#F4FBFD', { outline: false }), x, 0.09, z);
    f.scale.set(1.4, 1, 1);
    f.userData.noHighlight = true;
  }
  mergeStatic(body);
  mergeStatic(lid);
  g.add(blob(1.6, 1.2));
  return { group: g, hero: body, face: null, lid, tray, post, trayY: 0.181, slotLocal: V3(0, 0.197, 0.02) };
}

/** The decorating table: a turntable cake stand and the topping tools that pipe, shake and drizzle. */
function buildDecor() {
  const g = counter(1.6, 0.9, 0.91, C.pink);
  const H = 0.91;
  const turn = dyn(put(g, new THREE.Group(), 0, H, 0.08));
  put(turn, mk(G.cyl(0.14, 0.15, 0.03, 0.012), C.cream2, { outline: 'mid' }), 0, 0.015, 0);
  put(turn, mk(G.cyl(0.045, 0.06, 0.15, 0.02), C.cream2, { outline: 'mid' }), 0, 0.1, 0);
  put(turn, mk(G.cyl(0.34, 0.33, 0.035, 0.014), C.cream2, { outline: 'mid' }), 0, 0.19, 0);
  put(turn, mk(fluted(G.cyl(0.28, 0.28, 0.005, 0.002), 18, 0.05, 'doily'), '#FFFFFF', { outline: 'thin' }), 0, 0.209, 0);
  const tools = {};
  // piping bag standing in a cup
  const cup = put(g, mk(G.cyl(0.07, 0.06, 0.12, 0.02), C.blue, { outline: 'thin' }), -0.6, H + 0.06, -0.15);
  cup.userData.noHighlight = false;
  tools.bag = tool(g, pipingBag('#FFF3DC', 0.85), -0.6, H + 0.035, -0.15);
  // sprinkle shaker and powdered sugar shaker
  const shaker = (body, lid) => {
    const s = new THREE.Group();
    put(s, mk(G.cyl(0.045, 0.045, 0.13, 0.02), body, { outline: 'mid' }), 0, 0.065, 0);
    put(s, mk(G.cyl(0.047, 0.047, 0.035, 0.012), lid, { outline: 'thin' }), 0, 0.14, 0);
    for (let i = 0; i < 5; i++) put(s, mk(G.sphere(0.006, 6, 4), '#4B2E1D', { outline: false }), Math.cos(i * 1.26) * 0.022, 0.158, Math.sin(i * 1.26) * 0.022);
    return s;
  };
  const sprinkleJar = shaker('#FFFBF0', C.pinkDeep);
  for (let i = 0; i < 10; i++) put(sprinkleJar, mk(G.capsule(0.004, 0.01), ['#EE93A6', '#86BADB', '#FFE08A', '#AFCB9C'][i % 4], { outline: false }), Math.cos(i * 2.1) * 0.046, 0.03 + (i % 5) * 0.02, Math.sin(i * 2.1) * 0.046).rotation.set(i, i * 2, 0);
  tools.shaker = tool(g, sprinkleJar, -0.36, H, -0.28);
  tools.sugar = tool(g, shaker('#FFFFFF', '#DCE6EA'), -0.22, H, -0.3);
  // squeeze bottles for fudge, caramel and icing
  const bottle = (col) => {
    const b = new THREE.Group();
    put(b, mk(G.cyl(0.04, 0.042, 0.16, 0.025), col, { outline: 'mid' }), 0, 0.08, 0);
    put(b, mk(G.cyl(0.02, 0.035, 0.04, 0.01), '#FFFBF0', { outline: 'thin' }), 0, 0.18, 0);
    put(b, mk(G.cyl(0.004, 0.012, 0.05, 0.003), '#FFFBF0', { outline: 'thin' }), 0, 0.22, 0);
    return b;
  };
  tools.fudge = tool(g, bottle('#5A3422'), 0.24, H, -0.3);
  tools.caramel = tool(g, bottle('#D9822F'), 0.35, H, -0.3);
  tools.pink = tool(g, bottle(C.pink), 0.46, H, -0.3);
  // little bowls of fruit and nuts
  const dish = (col, fill) => {
    const d = new THREE.Group();
    put(d, mk(G.lathe(v2([[0.0005, 0], [0.04, 0], [0.07, 0.035], [0.075, 0.05], [0.07, 0.052], [0.064, 0.038], [0.035, 0.008], [0.0005, 0.008]]), 28), col, { outline: 'thin' }));
    fill(d);
    return d;
  };
  tools.cherries = tool(g, dish(C.cream2, (d) => {
    for (let i = 0; i < 4; i++) {
      put(d, mk(G.sphere(0.018, 14, 10), '#E4605E', { outline: 'thin' }), Math.cos(i * 1.6) * 0.025, 0.03, Math.sin(i * 1.6) * 0.025);
      put(d, mk(G.capsule(0.002, 0.02), '#6E8F4E', { outline: false }), Math.cos(i * 1.6) * 0.025, 0.055, Math.sin(i * 1.6) * 0.025).rotation.z = 0.4;
    }
  }), 0.62, H, -0.05);
  tools.nuts = tool(g, dish(C.blue, (d) => {
    for (let i = 0; i < 7; i++) put(d, mk(G.sphere(0.012, 10, 8), '#B87A45', { outline: 'thin' }), Math.cos(i * 2.4) * 0.03 * Math.sqrt(i / 7), 0.03, Math.sin(i * 2.4) * 0.03 * Math.sqrt(i / 7)).scale.set(1.3, 0.6, 0.9);
  }), 0.62, H, 0.17);
  // a spatula for spreading frosting
  tools.spatula = tool(g, spatulaModel(), -0.42, H + 0.002, 0.25, 0, 0.5, 0);
  mergeStatic(turn);
  for (const t of Object.values(tools)) mergeStatic(t);
  return { group: g, hero: turn, face: null, turntable: turn, tools, slotLocal: V3(0, H + 0.212, 0.08) };
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

/** The center island: a butcher-block top, a cutting board with tools, two set-down spots. */
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
  // the cutting board (the prep station) and its tools
  const board = put(g, new THREE.Group(), 0, H, 0.5);
  put(board, mk(G.box(0.7, 0.035, 0.48, 0.016), C.honeyLight, { outline: 'mid' }), 0, 0.0175, 0);
  put(board, mk(G.box(0.62, 0.003, 0.4, 0.002), '#EDC992', { outline: false }), 0, 0.036, 0);
  const hole = put(board, mk(G.cyl(0.025, 0.025, 0.037, 0.008), '#C9965A', { outline: false }), -0.3, 0.0175, 0.0);
  hole.scale.set(1.6, 1, 1);
  const props = dyn(put(board, new THREE.Group()));
  const tools = {};
  tools.pin = tool(props, pinModel(), -0.45, 0.035, 0, 0, Math.PI / 2, 0);
  tools.knife = tool(props, knifeModel(), 0.28, 0.0405, 0.06, 0, Math.PI / 2 + 0.15, 0);
  // tools that only come out while you use them
  tools.bag = tool(props, pipingBag('#FFF3DC'), 0, 0.3, 0);
  tools.spatula = tool(props, spatulaModel(), 0, 0.3, 0);
  const scoop = new THREE.Group();
  put(scoop, mk(G.lathe(v2([[0.0005, 0], [0.022, 0.003], [0.035, 0.016], [0.039, 0.032], [0.035, 0.034], [0.031, 0.019], [0.019, 0.009], [0.0005, 0.007]]), 28), '#DCE6EA', { outline: 'thin' }));
  put(scoop, mk(G.cyl(0.011, 0.011, 0.14, 0.005), C.honeyDark, { outline: 'thin' }), 0, 0.075, -0.07).rotation.x = -0.9;
  tools.scoop = tool(props, scoop, 0, 0.3, 0);
  const pitcher = new THREE.Group();
  put(pitcher, mk(G.lathe(v2([[0.0005, 0], [0.05, 0], [0.06, 0.02], [0.062, 0.12], [0.07, 0.14], [0.066, 0.145], [0.055, 0.125], [0.052, 0.02], [0.0005, 0.016]]), 28), C.cream2, { outline: 'mid' }));
  put(pitcher, mk(G.torus(0.035, 0.008, Math.PI, 14), C.cream2, { outline: 'thin' }), -0.065, 0.07, 0).rotation.z = Math.PI / 2;
  put(pitcher, mk(G.box(0.03, 0.01, 0.025, 0.005), C.cream2, { outline: 'thin' }), 0.07, 0.14, 0);
  tools.pitcher = tool(props, pitcher, 0, 0.3, 0);
  const fork = new THREE.Group();
  put(fork, mk(G.box(0.025, 0.006, 0.1, 0.003), '#EAF1F0', { outline: 'thin' }), 0, 0, 0.05);
  for (const x of [-0.009, 0, 0.009]) put(fork, mk(G.box(0.004, 0.005, 0.04, 0.002), '#EAF1F0', { outline: false }), x, 0, 0.12);
  put(fork, mk(G.box(0.02, 0.012, 0.09, 0.005), C.pinkDeep, { outline: 'thin' }), 0, 0.002, -0.04);
  tools.fork = tool(props, fork, 0, 0.3, 0);
  const tamper = new THREE.Group();
  put(tamper, mk(G.cyl(0.05, 0.055, 0.07, 0.02), C.blue, { outline: 'mid' }), 0, 0.035, 0);
  put(tamper, mk(G.cyl(0.015, 0.015, 0.12, 0.006), C.honeyDark, { outline: 'thin' }), 0, 0.12, 0);
  tools.tamper = tool(props, tamper, 0, 0.3, 0);
  tools.spoon = tool(props, woodSpoon(), 0, 0.3, 0);
  // a fox paw for the jobs done by hand: crimping, cracking, laying strips, layering
  const paw = new THREE.Group();
  put(paw, mk(G.sphere(0.05, 20, 14), '#E8893A', { outline: 'mid' })).scale.set(1.05, 0.72, 1.1);
  // four chubby toes along the front, each with a pink bean you can see from above
  for (let i = 0; i < 4; i++) {
    const x = (i - 1.5) * 0.022, z = 0.046 - Math.abs(i - 1.5) * 0.006;
    put(paw, mk(G.sphere(0.0155, 12, 8), '#E8893A', { outline: 'thin' }), x, 0.006, z).scale.set(1, 0.85, 1.1);
    put(paw, mk(G.sphere(0.0065, 8, 6), '#F7A8B4', { outline: false }), x, 0.0055, z + 0.012).scale.set(1, 0.7, 0.6);
  }
  // a cream fluff cuff at the wrist
  put(paw, mk(G.sphere(0.034, 14, 10), '#FFF3DC', { outline: 'thin' }), 0, 0.012, -0.042).scale.set(1.25, 0.8, 0.7);
  tools.paw = tool(props, paw, 0, 0.3, 0);
  for (const k of ['bag', 'spatula', 'scoop', 'pitcher', 'fork', 'tamper', 'spoon', 'paw']) tools[k].visible = false;
  // two set-down spots
  const spots = [];
  for (const z of [-0.3, -0.82]) {
    const spot = put(g, new THREE.Group(), 0, H, z);
    put(spot, mk(G.cyl(0.21, 0.19, 0.02, 0.008, 28), C.cream2, { outline: 'mid' }), 0, 0.01, 0);
    const doily = new THREE.Mesh(G.circle(0.17), toon('#fff', { map: ginghamTex(C.pinkDeep, 3) }));
    doily.rotation.x = -Math.PI / 2;
    put(spot, doily, 0, 0.021, 0);
    spots.push({ group: spot, slotLocal: V3(0, 0.025, 0) });
  }
  // utensil crock and a dusting of flour, clear of the board's tools
  const crock = put(g, new THREE.Group(), 0.36, H, -0.02);
  put(crock, mk(G.cyl(0.08, 0.07, 0.18, 0.02, 16), C.pumpkin, { outline: 'thin' }), 0, 0.09, 0);
  for (const [a, col] of [[0.3, C.honey], [-0.25, C.pinkDeep], [0.05, C.honeyDark]]) {
    const u = put(crock, mk(G.capsule(0.015, 0.26), col, { outline: 'thin' }), Math.sin(a) * 0.03, 0.26, Math.cos(a) * 0.02);
    u.rotation.z = a;
  }
  for (let i = 0; i < 14; i++) {
    const d = put(g, mk(G.sphere(0.012, 6, 4), '#FFFBF0', { outline: false, cast: false }), -0.25 + Math.sin(i * 7.1) * 0.12, H + 0.003, 0.1 + Math.cos(i * 3.3) * 0.06);
    d.scale.y = 0.25;
  }
  for (const sz of [-1, 1]) {
    const sign = label('sign-island', 0.62);
    sign.rotation.y = sz > 0 ? 0 : Math.PI;
    put(g, sign, 0, 0.6, sz * 1.056);
  }
  for (const t of Object.values(tools)) mergeStatic(t);
  g.add(blob(1.5, 2.7));
  return { group: g, top: topMesh, board, props, tools, spots, slotLocal: V3(0, 0.036, 0), sideLocal: V3(0, 0.001, 0.44), sideLocalB: V3(0, 0.001, -0.42) };
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
  // the scalloped crown sits on the front edge so it never hangs inside the cubbies
  const crown = scallopAwning(W + 0.1, [C.sage, C.cream2], 0.26);
  put(g, crown, 0, H + 0.03, D / 2 - 0.02);
  put(g, mk(G.box(1.3, 0.32, 0.05, 0.03), C.honeyDark, { outline: 'mid' }), 0, H + 0.4, -D / 2 + 0.1);
  put(g, label('sign-dry', 1.18), 0, H + 0.4, -D / 2 + 0.1 + 0.027);
  DRY_ROWS.forEach((row) => {
    row.ids.forEach((id, i) => {
      const x = -W / 2 + (W / 5) * (i + 0.5);
      if (!id) {
        for (let k = 0; k < 3; k++) put(g, mk(G.cyl(0.17 - k * 0.02, 0.1, 0.1, 0.03, 18), [C.cream2, C.pink, C.blue][k], { outline: 'thin' }), x, row.y + 0.05 + k * 0.07, 0);
        return;
      }
      const m = put(g, ingredientModel(id), x, row.y, 0.02);
      items.push({ id, obj: m, zone: 'dry' });
      // a little tag hanging from the shelf edge, clear of the treats above
      put(g, label(id, 0.34), x, row.y - 0.06, D / 2 + 0.008);
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
    put(c, label(id, 0.36), 0, 0.1, 0.193);
    items.push({ id, obj: c, zone: 'dry' });
  });
  [['bananas', -0.5], ['pineapple', 0], ['carrots', 0.5]].forEach(([id, x]) => {
    const c = put(g, ingredientModel(id), x, 0.6, -0.17);
    c.rotation.x = 0.2;
    put(c, label(id, 0.36), 0, 0.1, 0.193);
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
  const face = null;
  put(g, mk(G.box(1.32, 0.32, 0.05, 0.03), C.blueDeep, { outline: 'mid' }), 0, H + 0.58, 0);
  put(g, label('sign-cold', 1.2), 0, H + 0.58, 0.03);
  const xs = [-0.75, -0.25, 0.25, 0.75];
  COLD_ROWS.forEach((row) => {
    put(g, mk(G.box(W - 0.2, 0.04, D - 0.12, 0.015), '#FFFBF0', { outline: 'thin' }), 0, row.y - 0.02, -0.02);
    put(g, mk(G.box(W - 0.2, 0.06, 0.03, 0.012), C.blueDeep, { outline: false }), 0, row.y - 0.03, D / 2 - 0.08);
    row.ids.forEach((id, i) => {
      const m = put(g, ingredientModel(id), xs[i], row.y, -0.05);
      items.push({ id, obj: m, zone: 'cold', door: xs[i] < 0 ? -1 : 1 });
      put(g, label(id, 0.36), xs[i], row.y - 0.035, D / 2 - 0.06);
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
    // a soft sheen across the glass instead of solid sticks
    for (const [w, off] of [[0.16, 0], [0.07, 0.17]]) {
      const sheen = new THREE.Mesh(G.plane(w, dh * 0.5), toon('#FFFFFF', { transparent: true, opacity: 0.12 }));
      sheen.rotation.z = 0.35;
      sheen.userData.noHighlight = true;
      put(pivot, sheen, -s * (dw * 0.62 - off), dh * 0.68, 0.006);
    }
    const handle = put(pivot, mk(G.capsule(0.017, 0.22), C.butter, { outline: 'thin' }), -s * (dw - 0.1), dh * 0.52, 0.045);
    handle.userData.noHighlight = true;
    for (const dy of [-0.13, 0.13]) put(pivot, mk(G.box(0.03, 0.025, 0.05, 0.01), C.butter, { outline: 'thin' }), -s * (dw - 0.1), dh * 0.52 + dy, 0.02).userData.noHighlight = true;
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
  onLeft(oven.group, -2.6, -5.47);
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
  const prepSt = regStation('prep', 'prep', 'Prep Island', { group: island.board, hero: island.props, props: island.props, slotLocal: island.slotLocal, sideLocal: island.sideLocal, sideLocalB: island.sideLocalB });
  prepSt.tools = island.tools;
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
    return { ...s, chair: ch, occupant: null, plateSpot: V3(s.x + dir.x * 0.5, 0.637, s.z + dir.z * 0.5), aisle: V3(s.x, 0, -0.45) };
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
    const model = put(stand, dessertModel(BY_ID[id]), 0, 0.126, 0);
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
  // soft round dots (plain points render as squares when they drift close to the eye)
  const dot = canvasTex(32, 32, (c) => {
    const gr = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.5, 'rgba(255,255,255,.5)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = gr;
    c.fillRect(0, 0, 32, 32);
  });
  const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({ color: '#FFF1C8', map: dot, size: 0.03, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending }));
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
    if (st.built.sideLocal) {
      // the bowl waits beside the board while ingredients are prepped: on either side of it
      st.sideSlots = [st.built.sideLocal, st.built.sideLocalB || st.built.sideLocal].map((v) => st.group.localToWorld(v.clone()));
      st.sideSlot = st.sideSlots[0];
    }
    if (st.built.potTop) st.potTop = st.group.localToWorld(st.built.potTop.clone());
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
