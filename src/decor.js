// Decor you can buy at the morning market. Each piece is built once and shown
// when owned. They're dynamic (not merged) so they can pop in between days.
import * as THREE from 'three';
import { G, C, INK, mk, toon, glow, canvasTex } from './toon.js';
import { FONT } from './props.js';
import { FP_LAYER } from './world.js';
import { dessertCanvas } from './desserts.js';
import { IS_RESTAURANT } from './venue.js';

const put = (parent, obj, x = 0, y = 0, z = 0) => { obj.position.set(x, y, z); parent.add(obj); return obj; };

function sunflower(h) {
  const g = new THREE.Group();
  put(g, mk(G.cyl(0.022, 0.028, h, 0.01, 8), C.sageDark, { outline: 'thin' }), 0, h / 2, 0);
  for (const [y, s] of [[h * 0.45, 1], [h * 0.7, -1]]) {
    const leaf = put(g, mk(G.sphere(0.08, 10, 6), C.sage, { outline: 'thin' }), s * 0.07, y, 0);
    leaf.scale.set(1, 0.35, 0.6);
    leaf.rotation.z = s * 0.4;
  }
  const head = put(g, new THREE.Group(), 0, h, 0.02);
  head.rotation.x = -0.35;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const p = put(head, mk(G.sphere(0.06, 10, 6), '#FFD84A', { outline: 'thin' }), Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0);
    p.scale.set(1.2, 0.5, 0.25);
    p.rotation.z = a;
  }
  const c = put(head, mk(G.cyl(0.075, 0.075, 0.04, 0.015, 16), '#8A5A3B', { outline: 'thin' }), 0, 0, 0.02);
  c.rotation.x = Math.PI / 2;
  return g;
}

function sunflowerPot() {
  const g = new THREE.Group();
  put(g, mk(G.cyl(0.24, 0.18, 0.4, 0.05), C.blueDeep), 0, 0.2, 0);
  put(g, mk(G.cyl(0.27, 0.27, 0.08, 0.03), C.blueDeep), 0, 0.4, 0);
  put(g, mk(G.cyl(0.22, 0.22, 0.03, 0.01), C.cocoa, { outline: false }), 0, 0.43, 0);
  for (const [x, z, r] of [[-0.12, 0.08, 0.1], [0.13, 0.04, 0.09], [0.0, -0.12, 0.08]]) {
    const leaf = put(g, mk(G.sphere(r, 12, 8), C.sage, { outline: 'mid' }), x, 0.48, z);
    leaf.scale.y = 0.7;
  }
  for (const [x, z, h] of [[0, 0, 1.0], [-0.1, 0.06, 0.8], [0.11, -0.03, 0.7]]) put(g, sunflower(h), x, 0.43, z);
  return g;
}

function lantern(col) {
  const g = new THREE.Group();
  put(g, mk(G.cyl(0.006, 0.006, 0.6, 0, 4), INK, { outline: false, cast: false }), 0, 0.3, 0);
  const body = put(g, mk(G.sphere(0.2, 20, 14), col, { outline: 'mid', emissive: col, emissiveIntensity: 0.35, cast: false }), 0, -0.05, 0);
  body.scale.y = 0.85;
  for (const y of [0.12, -0.22]) put(g, mk(G.cyl(0.08, 0.08, 0.04, 0.01, 12), C.honeyDark, { outline: 'thin', cast: false }), 0, y, 0);
  for (let i = 0; i < 6; i++) {
    const r = put(g, mk(G.torus(0.19, 0.006, Math.PI, 16), mixCol(col), { outline: false, cast: false }), 0, -0.05, 0);
    r.rotation.y = (i / 6) * Math.PI;
    r.rotation.x = Math.PI / 2;
    r.rotation.order = 'YXZ';
    r.scale.set(1, 0.85, 1);
  }
  const gl = put(g, glow(col, 0.9, 0.35), 0, -0.05, 0);
  gl.userData.baseOpacity = 0.35;
  return { g, glow: gl };
}
const mixCol = (c) => new THREE.Color(c).lerp(new THREE.Color('#8A3E22'), 0.35).getStyle();

function fernBasket() {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const rope = put(g, mk(G.cyl(0.006, 0.006, 0.75, 0, 4), INK, { outline: false, cast: false }), Math.cos(a) * 0.12, 0.33, Math.sin(a) * 0.12);
    rope.rotation.z = -Math.cos(a) * 0.15;
    rope.rotation.x = Math.sin(a) * 0.15;
  }
  put(g, mk(G.cyl(0.24, 0.17, 0.2, 0.05, 18), '#D9A05B', { outline: 'mid', cast: false }), 0, -0.1, 0);
  put(g, mk(G.torus(0.24, 0.025, Math.PI * 2, 20), '#A8612E', { outline: 'thin', cast: false }), 0, 0, 0).rotation.x = Math.PI / 2;
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2;
    const frond = put(g, mk(G.capsule(0.045, 0.34), i % 2 ? C.sage : C.sageDark, { outline: 'thin', cast: false }), Math.cos(a) * 0.2, -0.1, Math.sin(a) * 0.2);
    frond.rotation.order = 'YXZ';
    frond.rotation.y = -a + Math.PI / 2;
    frond.rotation.x = 0;
    frond.rotation.z = 0;
    frond.lookAt(Math.cos(a) * 0.6, -0.55, Math.sin(a) * 0.6);
    frond.rotateX(Math.PI / 2);
    frond.scale.set(1, 1, 0.55);
  }
  const top = put(g, mk(G.sphere(0.2, 14, 10), C.sage, { outline: 'mid', cast: false }), 0, 0.05, 0);
  top.scale.y = 0.55;
  return g;
}

function specialTex(d) {
  return canvasTex(256, 320, (c) => {
    c.fillStyle = '#4F6B57';
    c.fillRect(0, 0, 256, 320);
    c.strokeStyle = 'rgba(255,255,255,.08)';
    c.lineWidth = 10;
    for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(0, 40 + i * 50); c.lineTo(256, 20 + i * 52); c.stroke(); }
    c.fillStyle = '#FFF3DC';
    c.textAlign = 'center';
    c.font = `700 34px ${FONT}`;
    c.fillText("Today's", 128, 48);
    c.fillText('Special', 128, 86);
    if (d) {
      c.drawImage(dessertCanvas(d, 128), 64, 96, 128, 128);
      c.font = `600 ${d.name.length > 16 ? 22 : 28}px ${FONT}`;
      c.fillStyle = '#FFE08A';
      c.fillText(d.name, 128, 256);
      c.font = `600 22px ${FONT}`;
      c.fillStyle = '#F7B9C4';
      c.fillText('extra coins!', 128, 292);
    }
  });
}

function chalkboard() {
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    const leg = put(g, mk(G.box(0.06, 1.25, 0.05, 0.02), C.honeyDark, { outline: 'thin' }), s * 0.28, 0.6, 0.04);
    leg.rotation.z = -s * 0.1;
    leg.rotation.x = -0.12;
  }
  const back = put(g, mk(G.box(0.05, 1.2, 0.05, 0.02), C.honeyDark, { outline: 'thin' }), 0, 0.58, -0.22);
  back.rotation.x = 0.3;
  const frame = put(g, mk(G.box(0.72, 0.88, 0.06, 0.03), C.honey, { outline: 'mid' }), 0, 0.92, 0.08);
  frame.rotation.x = -0.12;
  const board = new THREE.Mesh(G.plane(0.62, 0.78), toon('#fff', { map: specialTex(null) }));
  board.position.set(0, 0, 0.035);
  frame.add(board);
  put(g, mk(G.box(0.62, 0.04, 0.08, 0.015), C.honeyDark, { outline: 'thin' }), 0, 0.46, 0.14);
  return { g, board };
}

function shopCat() {
  const g = new THREE.Group();
  put(g, mk(G.cyl(0.38, 0.32, 0.16, 0.06, 24), '#D9A05B', { outline: 'mid' }), 0, 0.08, 0);
  put(g, mk(G.cyl(0.31, 0.31, 0.06, 0.03, 24), C.pink, { outline: 'thin' }), 0, 0.16, 0);
  const cat = put(g, new THREE.Group(), 0, 0.19, 0);
  const fur = '#F4A646';
  const body = put(cat, mk(G.sphere(0.2, 18, 14), fur, { outline: 'mid' }), -0.03, 0.1, 0);
  body.scale.set(1.25, 0.72, 1);
  const head = put(cat, mk(G.sphere(0.12, 16, 12), fur, { outline: 'mid' }), 0.17, 0.1, 0.1);
  for (const s of [-1, 1]) {
    const ear = put(cat, mk(G.cyl(0.001, 0.05, 0.08, 0, 4), fur, { outline: 'thin' }), 0.17 + s * 0.06, 0.2, 0.08);
    ear.rotation.z = -s * 0.35;
    const eye = put(cat, mk(G.box(0.035, 0.008, 0.01, 0.003), INK, { outline: false }), 0.17 + s * 0.045, 0.11, 0.215);
    eye.rotation.z = s * 0.2;
  }
  put(cat, mk(G.sphere(0.012, 6, 4), C.pinkDeep, { outline: false }), 0.17, 0.085, 0.225);
  for (let i = 0; i < 3; i++) put(cat, mk(G.box(0.012, 0.07, 0.02, 0.005), '#C96A2E', { outline: false }), -0.12 + i * 0.07, 0.22, 0);
  const tail = put(cat, mk(G.capsule(0.04, 0.3), fur, { outline: 'mid' }), -0.05, 0.03, 0.2);
  tail.rotation.set(Math.PI / 2, 0, 1.3);
  return { g, body, head };
}

/** Builds every decor piece (hidden). Call set(owned) to show the ones you own. */
export function buildDecorPieces(scene) {
  if (IS_RESTAURANT) return buildRestaurantDecor(scene);
  const pieces = {};
  const glows = [];
  const add = (id, group, colliders = [], fp = false) => {
    scene.add(group);
    group.visible = false;
    if (fp) group.traverse((o) => o.layers.set(FP_LAYER));
    pieces[id] = { group, colliders };
  };

  const sf = new THREE.Group();
  put(sf, sunflowerPot(), 3.2, 0, -4.5);
  put(sf, sunflowerPot(), 5.45, 0, -2.75).rotation.y = -Math.PI / 2;
  add('sunflowers', sf, [{ type: 'circle', x: 3.2, z: -4.5, r: 0.3 }, { type: 'circle', x: 5.45, z: -2.75, r: 0.3 }]);

  const ln = new THREE.Group();
  [[0.9, 2.75, 2.7, C.pink], [3.05, 2.85, 0.75, C.butter], [5.2, 2.75, 2.75, C.blue], [3.1, 2.95, 2.95, C.sage]].forEach(([x, y, z, col]) => {
    const l = lantern(col);
    put(ln, l.g, x, y, z);
    glows.push(l.glow);
  });
  add('lanterns', ln, [], true);

  const fe = new THREE.Group();
  [[-0.4, 2.75, -2.2], [5.4, 2.7, -0.6], [-4.6, 2.75, 2.4]].forEach(([x, y, z]) => put(fe, fernBasket(), x, y, z));
  add('ferns', fe, [], true);

  const cb = chalkboard();
  put(scene, cb.g, 5.45, 0, -1.7);
  cb.g.rotation.y = -Math.PI / 2;
  add('chalkboard', cb.g, [{ type: 'circle', x: 5.45, z: -1.7, r: 0.35 }]);

  const cat = shopCat();
  put(scene, cat.g, 4.55, 0, 3.4);
  cat.g.rotation.y = 2.1;
  add('catbed', cat.g, [{ type: 'circle', x: 4.55, z: 3.4, r: 0.4 }]);

  const owned = new Set();
  return {
    pieces,
    glows,
    set(ids, colliders) {
      for (const [id, p] of Object.entries(pieces)) {
        const on = ids.includes(id);
        p.group.visible = on;
        if (on && !owned.has(id)) colliders.push(...p.colliders);
        if (on) owned.add(id);
      }
    },
    setSpecial(d) {
      const old = cb.board.material.map;
      cb.board.material.map = specialTex(d);
      cb.board.material.needsUpdate = true;
      if (old) old.dispose();
    },
    update(t) {
      if (pieces.catbed.group.visible) {
        const b = 1 + Math.sin(t * 1.6) * 0.035;
        cat.body.scale.set(1.25 * b, 0.72 * b, 1 * b);
      }
      for (const [i, g] of glows.entries()) g.material.opacity = 0.35 * (0.8 + 0.2 * Math.sin(t * 1.3 + i));
      ln.children.forEach((l, i) => { l.rotation.z = Math.sin(t * 0.7 + i) * 0.04; });
    },
    catHead: () => cat.head.getWorldPosition(new THREE.Vector3()),
  };
}

// ------------------------------------------------------------------ the restaurant's decor

const TABLES = [[2.0, -2.0], [4.6, -2.0], [2.0, 1.6], [4.6, 1.6]];
const BRASS = '#D9A441';

function candles() {
  const g = new THREE.Group();
  const flames = [];
  put(g, mk(G.cyl(0.07, 0.08, 0.02, 0.008, 16), BRASS, { outline: 'thin' }), 0, 0.01, 0);
  [[0, 0.16], [0.04, 0.11], [-0.035, 0.09]].forEach(([x, h], i) => {
    const z = i === 2 ? 0.03 : i ? -0.02 : 0;
    put(g, mk(G.cyl(0.014, 0.014, h, 0.005, 10), '#FFFBF0', { outline: 'thin' }), x, 0.02 + h / 2, z);
    const f = put(g, mk(G.sphere(0.012, 8, 6), '#FFC940', { outline: false, emissive: '#FFB040', emissiveIntensity: 1 }), x, 0.035 + h, z);
    f.scale.y = 1.7;
    const gl = glow('#FFC060', 0.28, 0.6);
    put(g, gl, x, 0.04 + h, z);
    flames.push({ f, gl });
  });
  return { g, flames };
}

function roseVase() {
  const g = new THREE.Group();
  put(g, mk(G.lathe([[0.0005, 0], [0.03, 0], [0.04, 0.05], [0.022, 0.1], [0.026, 0.12], [0.02, 0.12], [0.016, 0.1], [0.0005, 0.1]].map(([x, y]) => new THREE.Vector2(x, y)), 18), '#DDF0F6', { outline: 'thin' }));
  for (const [x, z, h] of [[0, 0, 0.2], [0.03, 0.01, 0.17], [-0.025, 0.02, 0.18]]) {
    put(g, mk(G.cyl(0.003, 0.003, h, 0.001, 5), '#5E8F3E', { outline: false }), x * 0.5, h / 2 + 0.02, z * 0.5);
    const bloom = put(g, mk(G.sphere(0.022, 12, 10), '#D8405A', { outline: 'thin' }), x, h + 0.02, z);
    bloom.scale.y = 0.8;
    put(g, mk(G.torus(0.012, 0.004, Math.PI * 1.6, 10), '#B9284A', { outline: false }), x, h + 0.035, z).rotation.x = Math.PI / 2;
  }
  return g;
}

function grandPiano() {
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-0.7, -0.5);
  shape.lineTo(0.7, -0.5);
  shape.lineTo(0.7, 0.1);
  shape.bezierCurveTo(0.7, 0.9, 0.1, 0.4, -0.25, 0.9);
  shape.bezierCurveTo(-0.55, 1.1, -0.7, 0.9, -0.7, 0.6);
  shape.lineTo(-0.7, -0.5);
  const body = new THREE.ExtrudeGeometry(shape, { depth: 0.32, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 16 });
  body.rotateX(-Math.PI / 2);
  put(g, mk(body, '#2E2A30', { outline: 'mid' }), 0, 0.62, 0);
  for (const [x, z] of [[-0.62, 0.42], [0.62, 0.42], [-0.1, -0.75]]) put(g, mk(G.cyl(0.05, 0.04, 0.62, 0.02, 10), '#2E2A30', { outline: 'thin' }), x, 0.31, z);
  // keys and the open lid
  put(g, mk(G.box(1.3, 0.04, 0.16, 0.01), '#FFFBF0', { outline: 'thin' }), 0, 0.9, 0.56);
  for (let i = 0; i < 12; i++) put(g, mk(G.box(0.035, 0.02, 0.09, 0.005), INK, { outline: false }), -0.55 + i * 0.1, 0.925, 0.53);
  const lid = put(g, mk(new THREE.ShapeGeometry(shape), '#3A3540', { outline: 'thin' }), 0, 0.95, 0);
  lid.rotation.set(-Math.PI / 2 + 0.7, 0, 0);
  put(g, mk(G.box(0.4, 0.26, 0.015, 0.006), '#FFFBF0', { outline: 'thin' }), 0, 1.06, 0.42).rotation.x = -0.25;
  put(g, mk(G.box(0.6, 0.05, 0.3, 0.02), '#2E2A30', { outline: 'thin' }), 0, 0.46, 0.95);
  const notes = [];
  for (let i = 0; i < 3; i++) {
    const n = new THREE.Group();
    put(n, mk(G.sphere(0.035, 10, 8), BRASS, { outline: 'thin' }), 0, 0, 0).scale.set(1.2, 0.85, 0.6);
    put(n, mk(G.box(0.012, 0.13, 0.012, 0.004), BRASS, { outline: false }), 0.035, 0.065, 0);
    g.add(n);
    notes.push(n);
  }
  return { g, notes };
}

function chandelier() {
  const g = new THREE.Group();
  const gl = [];
  put(g, mk(G.cyl(0.01, 0.01, 0.7, 0.004, 6), INK, { outline: false, cast: false }), 0, -0.35, 0);
  const ring = put(g, mk(G.torus(0.45, 0.025, Math.PI * 2, 40), BRASS, { outline: 'thin', cast: false }), 0, -0.8, 0);
  ring.rotation.x = Math.PI / 2;
  put(g, mk(G.sphere(0.09, 14, 10), BRASS, { outline: 'thin', cast: false }), 0, -0.8, 0);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const x = Math.cos(a) * 0.45, z = Math.sin(a) * 0.45;
    put(g, mk(G.cyl(0.02, 0.02, 0.1, 0.006, 8), '#FFFBF0', { outline: 'thin', cast: false }), x, -0.72, z);
    const b = put(g, mk(G.sphere(0.028, 8, 6), '#FFE9A8', { outline: false, emissive: '#FFD27A', emissiveIntensity: 1, cast: false }), x, -0.64, z);
    b.scale.y = 1.5;
    const glw = glow('#FFD27A', 0.5, 0.55);
    put(g, glw, x, -0.64, z);
    gl.push(glw);
    const drop = put(g, mk(G.cyl(0.0, 0.03, 0.08, 0, 6), '#E6F6FA', { outline: 'thin', cast: false }), Math.cos(a + 0.4) * 0.38, -0.92, Math.sin(a + 0.4) * 0.38);
    drop.rotation.x = Math.PI;
  }
  const big = glow('#FFE0A0', 2.4, 0.4);
  put(g, big, 0, -0.75, 0);
  gl.push(big);
  return { g, glows: gl };
}

function buildRestaurantDecor(scene) {
  const pieces = {};
  const glows = [];
  const add = (id, group, colliders = [], fp = false) => {
    scene.add(group);
    group.visible = false;
    if (fp) group.traverse((o) => o.layers.set(FP_LAYER));
    pieces[id] = { group, colliders };
  };
  const cand = new THREE.Group();
  const flames = [];
  for (const [x, z] of TABLES) {
    const c = candles();
    put(cand, c.g, x + 0.14, 0.636, z + 0.08);
    flames.push(...c.flames);
  }
  add('candles', cand);
  const roses = new THREE.Group();
  for (const [x, z] of TABLES) put(roses, roseVase(), x - 0.14, 0.636, z - 0.06);
  add('roses', roses);
  const piano = grandPiano();
  put(scene, piano.g, 5.15, 0, 3.85);
  piano.g.rotation.y = -Math.PI / 2;
  add('piano', piano.g, [{ type: 'box', x0: 4.4, x1: 5.95, z0: 3.1, z1: 4.6 }]);
  const cb = chalkboard();
  put(scene, cb.g, 4.4, 0, -3.95);
  cb.g.rotation.y = -0.5;
  add('chalkboard', cb.g, [{ type: 'circle', x: 4.4, z: -3.95, r: 0.35 }]);
  const ch = chandelier();
  put(scene, ch.g, 3.3, 3.6, -0.2);
  glows.push(...ch.glows);
  add('chandelier', ch.g, [], true);

  const owned = new Set();
  return {
    pieces,
    glows,
    set(ids, colliders) {
      for (const [id, p] of Object.entries(pieces)) {
        const on = ids.includes(id);
        p.group.visible = on;
        if (on && !owned.has(id)) colliders.push(...p.colliders);
        if (on) owned.add(id);
      }
    },
    setSpecial(d) {
      const old = cb.board.material.map;
      cb.board.material.map = specialTex(d);
      cb.board.material.needsUpdate = true;
      if (old) old.dispose();
    },
    update(t) {
      flames.forEach(({ f, gl }, i) => {
        const k = 1 + Math.sin(t * 9 + i * 1.7) * 0.12 + Math.sin(t * 23 + i) * 0.06;
        f.scale.set(1, 1.7 * k, 1);
        gl.material.opacity = 0.5 * k;
      });
      ch.g.rotation.y = Math.sin(t * 0.3) * 0.05;
      piano.notes.forEach((n, i) => {
        const k = ((t * 0.35 + i / 3) % 1);
        n.position.set(0.3 - k * 0.5, 1.2 + k * 0.9, 0.6 + Math.sin(k * 6 + i) * 0.15);
        n.scale.setScalar(Math.sin(k * Math.PI));
      });
    },
    catHead: () => null,
  };
}

function signFace(text, bg) {
  return canvasTex(256, 128, (c) => {
    c.fillStyle = bg;
    c.beginPath();
    c.roundRect(6, 6, 244, 116, 26);
    c.fill();
    c.lineWidth = 10;
    c.strokeStyle = INK;
    c.stroke();
    c.fillStyle = '#FFF3DC';
    c.strokeStyle = INK;
    c.lineWidth = 12;
    c.lineJoin = 'round';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `700 62px ${FONT}`;
    c.strokeText(text, 128, 68);
    c.fillText(text, 128, 68);
  });
}

/** The little Open / Closed sign that hangs on the front door. */
export function buildOpenSign() {
  const g = new THREE.Group();
  const flip = new THREE.Group();
  g.add(flip);
  for (const s of [-1, 1]) {
    const str = put(g, mk(G.cyl(0.006, 0.006, 0.2, 0, 4), INK, { outline: false, cast: false }), s * 0.12, 0.2, -0.01);
    str.rotation.z = s * 0.55;
  }
  put(g, mk(G.sphere(0.022, 8, 6), C.butter, { outline: 'thin', cast: false }), 0, 0.29, -0.01);
  put(flip, mk(G.box(0.5, 0.26, 0.03, 0.02), C.honey, { outline: 'mid', cast: false }));
  const front = new THREE.Mesh(G.plane(0.46, 0.23), toon('#fff', { map: signFace('OPEN', C.sageDark) }));
  front.position.z = 0.017;
  const back = new THREE.Mesh(G.plane(0.46, 0.23), toon('#fff', { map: signFace('CLOSED', C.pinkDeep) }));
  back.position.z = -0.017;
  back.rotation.y = Math.PI;
  flip.add(front, back);
  let want = Math.PI;
  flip.rotation.y = want;
  return {
    group: g,
    set(open) { want = open ? 0 : Math.PI; },
    update(dt) { flip.rotation.y += (want - flip.rotation.y) * Math.min(1, dt * 6); },
  };
}
