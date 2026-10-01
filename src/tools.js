// Kitchen tools used at the stations: a chef's knife, a tapered rolling pin,
// cloth piping bags with star tips, an offset spatula and a wooden spoon.
// Each keeps the pose conventions main.js animates them by (see the notes).
import * as THREE from 'three';
import { G, C, mk } from './toon.js';
import { fluted } from './dessert3d.js';

const V = (x, y) => new THREE.Vector2(x, y);
const put = (parent, obj, x = 0, y = 0, z = 0) => { obj.position.set(x, y, z); parent.add(obj); return obj; };
const STEEL = '#E3ECEC', STEEL_DK = '#B9C6CC', WOOD = '#C98A4A', WOOD_DK = '#A8612E';

/** Chef's knife: blade along +x (tip at +x), lying flat, cutting edge on the +z side. */
export function knifeModel() {
  const k = new THREE.Group();
  const s = new THREE.Shape();
  // spine straight along -z, edge sweeping up to the tip
  s.moveTo(0, -0.013);
  s.lineTo(0.12, -0.013);
  s.quadraticCurveTo(0.158, -0.012, 0.17, -0.004);
  s.quadraticCurveTo(0.14, 0.012, 0.09, 0.015);
  s.lineTo(0.008, 0.016);
  s.quadraticCurveTo(0, 0.016, 0, 0.008);
  s.lineTo(0, -0.013);
  const blade = new THREE.ExtrudeGeometry(s, { depth: 0.0035, bevelEnabled: true, bevelThickness: 0.0008, bevelSize: 0.0008, bevelSegments: 1, curveSegments: 10 });
  blade.rotateX(Math.PI / 2);
  blade.translate(0, 0.00175, 0);
  put(k, mk(blade, STEEL, { outline: 'thin' }));
  // a bright bevel along the edge
  const bev = put(k, mk(G.box(0.085, 0.0042, 0.003, 0.001), '#FFFFFF', { outline: false }), 0.05, 0, 0.0135);
  bev.userData.noHighlight = true;
  put(k, mk(G.box(0.012, 0.012, 0.03, 0.004), STEEL_DK, { outline: 'thin' }), -0.004, 0, 0.001);
  const handle = put(k, mk(G.capsule(0.0115, 0.085), WOOD_DK, { outline: 'thin' }), -0.058, 0, 0.001);
  handle.rotation.z = Math.PI / 2;
  handle.scale.set(1, 1, 0.75);
  for (const x of [-0.035, -0.06, -0.085]) put(k, mk(G.sphere(0.0035, 8, 6), STEEL_DK, { outline: false }), x, 0.0085, 0.001);
  return k;
}

/** Rolling pin: long axis along x, barrel radius 0.034, centered on the origin. */
export function pinModel() {
  const p = new THREE.Group();
  const barrel = put(p, mk(G.lathe([V(0.0005, -0.17), V(0.026, -0.17), V(0.033, -0.158), V(0.035, -0.12), V(0.035, 0.12), V(0.033, 0.158), V(0.026, 0.17), V(0.0005, 0.17)], 28), C.honey, { outline: 'thin' }));
  barrel.rotation.z = Math.PI / 2;
  // two darker grain rings
  for (const x of [-0.09, 0.09]) {
    const ring = put(p, mk(G.torus(0.0352, 0.0012, Math.PI * 2, 28), C.honeyDark, { outline: false }), x, 0, 0);
    ring.rotation.y = Math.PI / 2;
  }
  for (const sx of [-1, 1]) {
    const axle = put(p, mk(G.cyl(0.008, 0.008, 0.02, 0.003, 10), C.honeyDark, { outline: 'thin' }), sx * 0.18, 0, 0);
    axle.rotation.z = Math.PI / 2;
    const grip = put(p, mk(G.lathe([V(0.0005, 0), V(0.012, 0), V(0.016, 0.02), V(0.015, 0.055), V(0.019, 0.066), V(0.012, 0.074), V(0.0005, 0.075)], 18), C.honeyDark, { outline: 'thin' }), sx * 0.19, 0, 0);
    grip.rotation.z = -sx * Math.PI / 2;
  }
  return p;
}

/**
 * Cloth piping bag with a fluted metal star tip. Tip points down (-y) with the
 * nozzle end at y = 0; the filled bag rises to a twisted top. `fill` peeks out
 * of the nozzle. Returns the group; userData.bulb is the squeezable belly.
 */
export function pipingBag(fill = '#FFF3DC', scale = 1) {
  const b = new THREE.Group();
  const s = scale;
  const tip = put(b, mk(fluted(G.cyl(0.006 * s, 0.017 * s, 0.03 * s, 0.003, 24), 8, 0.18, `tip${s}`), STEEL, { outline: 'thin' }), 0, 0.015 * s, 0);
  tip.rotation.x = Math.PI;
  put(b, mk(G.sphere(0.006 * s, 10, 8), fill, { outline: false }), 0, -0.002 * s, 0).scale.y = 0.7;
  const bulb = put(b, new THREE.Group(), 0, 0.03 * s, 0);
  put(bulb, mk(G.lathe([V(0.0005, 0), V(0.016 * s, 0), V(0.045 * s, 0.07 * s), V(0.062 * s, 0.15 * s), V(0.058 * s, 0.2 * s), V(0.035 * s, 0.235 * s), V(0.012 * s, 0.25 * s), V(0.0005, 0.252 * s)], 28), '#FFFBF0', { outline: 'mid' }));
  // frosting showing through near the tip, and a seam line
  const show = put(bulb, mk(G.lathe([V(0.0005, 0), V(0.017 * s, 0), V(0.034 * s, 0.045 * s), V(0.0005, 0.046 * s)], 20), fill, { outline: false }), 0, 0.004 * s, 0);
  show.scale.set(1.04, 1, 1.04);
  const twist = put(bulb, mk(G.cyl(0.011 * s, 0.014 * s, 0.035 * s, 0.006, 12), '#FFFBF0', { outline: 'thin' }), 0, 0.265 * s, 0);
  twist.rotation.y = 0.6;
  const tie = put(bulb, mk(G.torus(0.013 * s, 0.004 * s, Math.PI * 2, 16), C.pinkDeep, { outline: 'thin' }), 0, 0.252 * s, 0);
  tie.rotation.x = Math.PI / 2;
  // the belly squeezes while you pipe, so keep it out of static batching
  bulb.userData.dynamic = true;
  b.userData.bulb = bulb;
  return b;
}

/** Offset spatula: flat blade along +z with a rounded end, wooden handle along -z, raised by a little bend. */
export function spatulaModel(scale = 1) {
  const g = new THREE.Group();
  const s = new THREE.Shape();
  const w = 0.024, L = 0.15;
  s.moveTo(-w / 2, 0);
  s.lineTo(-w / 2, L - w / 2);
  s.absarc(0, L - w / 2, w / 2, Math.PI, 0, true);
  s.lineTo(w / 2, 0);
  s.lineTo(-w / 2, 0);
  const blade = new THREE.ExtrudeGeometry(s, { depth: 0.0025, bevelEnabled: true, bevelThickness: 0.0006, bevelSize: 0.0006, bevelSegments: 1, curveSegments: 10 });
  blade.rotateX(Math.PI / 2);
  put(g, mk(blade, STEEL, { outline: 'thin' }), 0, 0.001, 0.0);
  // a small step up to the handle, so the handle rests on the table too
  const bend = put(g, mk(G.box(0.012, 0.004, 0.02, 0.0015), STEEL_DK, { outline: 'thin' }), 0, 0.006, -0.008);
  bend.rotation.x = 0.55;
  put(g, mk(G.cyl(0.0095, 0.0095, 0.016, 0.003, 12), STEEL_DK, { outline: 'thin' }), 0, 0.0105, -0.024).rotation.x = Math.PI / 2;
  const handle = put(g, mk(G.capsule(0.0105, 0.085), WOOD, { outline: 'thin' }), 0, 0.0105, -0.077);
  handle.rotation.x = Math.PI / 2;
  g.scale.setScalar(scale);
  return g;
}

/** Wooden spoon: an oval bowl at the origin, handle rising toward -z. */
export function woodSpoon() {
  const g = new THREE.Group();
  const bowl = put(g, mk(G.lathe([V(0.0005, 0), V(0.016, 0.001), V(0.026, 0.008), V(0.029, 0.014), V(0.026, 0.016), V(0.023, 0.01), V(0.013, 0.005), V(0.0005, 0.004)], 22), WOOD, { outline: 'thin' }));
  bowl.scale.set(0.8, 1, 1.15);
  const handle = put(g, mk(G.capsule(0.0075, 0.2), WOOD, { outline: 'thin' }), 0, 0.045, -0.115);
  handle.rotation.x = Math.PI / 2 - 0.42;
  return g;
}
