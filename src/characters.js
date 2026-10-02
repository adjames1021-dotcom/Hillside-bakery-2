// Chibi animals: big round heads, tiny bodies, dot eyes, blush, small smiles.
import * as THREE from 'three';
import { G, C, INK, mk, toon, canvasTex, blob } from './toon.js';
import { mergeStatic } from './merge.js';

const HEAD_Y = 0.9;
const HEAD_R = 0.4;

export const SPECIES = {
  cat: { fur: ['#F6C489', '#FFF1DC', '#E8B07A', '#F3D2A8'], inner: C.pinkDeep },
  bunny: { fur: ['#FFF4E4', '#F6DCC8', '#FBE6E6'], inner: C.pink },
  bear: { fur: ['#C98B55', '#B07446', '#D9A06A'], inner: '#F3D2A8' },
  puppy: { fur: ['#EBC08E', '#FFF1DC', '#DDB079'], inner: '#B07A4F' },
  fox: { fur: ['#E8893A'], inner: '#FFF3DC' },
};

const ginghamCache = new Map();
function gingham(color) {
  if (ginghamCache.has(color)) return ginghamCache.get(color);
  const t = canvasTex(64, 64, (ctx) => {
    ctx.fillStyle = '#FFFBF0';
    ctx.fillRect(0, 0, 64, 64);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 32, 64);
    ctx.fillRect(0, 0, 64, 32);
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 32, 32);
  }, [2, 2]);
  t.magFilter = THREE.NearestFilter;
  ginghamCache.set(color, t);
  return t;
}

/** point on the head sphere surface from front-facing x/y offsets */
const SX = 1.1, SY = 0.94;
function onHead(x, y, lift = 0) {
  const u = x / (HEAD_R * SX), v = y / (HEAD_R * SY);
  const z = HEAD_R * Math.sqrt(Math.max(0, 1 - u * u - v * v));
  const n = new THREE.Vector3(x / (SX * SX), y / (SY * SY), z).normalize();
  return { pos: new THREE.Vector3(x, y + HEAD_Y, z).addScaledVector(n, lift), n };
}

function orientTo(mesh, n) {
  mesh.lookAt(mesh.position.clone().add(n));
}

export function makeAnimal(kind, o = {}) {
  const spec = SPECIES[kind];
  const fur = o.fur || spec.fur[Math.floor(Math.random() * spec.fur.length)];
  const root = new THREE.Group();
  const bob = new THREE.Group();
  root.add(bob);
  const shadow = blob(0.9, 0.75);
  root.add(shadow);

  const light = kind === 'bunny' ? '#FFFBF0' : '#FFF3DC';

  // feet
  const feet = [];
  for (const sx of [-1, 1]) {
    const f = mk(G.sphere(0.1, 14, 10), fur, { outline: 'mid' });
    f.scale.set(1, 0.7, 1.3);
    f.position.set(sx * 0.12, 0.07, 0.03);
    bob.add(f);
    feet.push(f);
  }
  // body
  const body = mk(G.capsule(0.2, 0.14), fur, { outline: 'mid' });
  body.position.y = 0.36;
  body.scale.set(1.05, 1, 0.95);
  bob.add(body);
  const belly = mk(G.sphere(0.13, 14, 10), light, { outline: false });
  belly.scale.set(1, 1.15, 0.5);
  belly.position.set(0, 0.33, 0.14);
  bob.add(belly);

  // arms
  const arms = [];
  for (const sx of [-1, 1]) {
    const a = mk(G.capsule(0.065, 0.1), fur, { outline: 'mid' });
    a.position.set(sx * 0.23, 0.38, 0.02);
    a.rotation.z = sx * 0.5;
    bob.add(a);
    arms.push(a);
  }

  // tail
  let tail = null;
  if (kind === 'cat' || kind === 'fox') {
    tail = mk(G.capsule(kind === 'fox' ? 0.1 : 0.05, 0.3), fur, { outline: 'mid' });
    tail.position.set(0, 0.32, -0.25);
    tail.rotation.x = -0.9;
    if (kind === 'fox') {
      const tip = mk(G.sphere(0.1, 12, 8), '#FFF3DC', { outline: 'thin' });
      tip.position.y = 0.2;
      tail.add(tip);
    }
  } else if (kind === 'bunny' || kind === 'bear') {
    tail = mk(G.sphere(kind === 'bunny' ? 0.09 : 0.07, 12, 8), kind === 'bunny' ? '#FFFBF0' : fur, { outline: 'mid' });
    tail.position.set(0, 0.24, -0.2);
  } else {
    tail = mk(G.capsule(0.045, 0.14), fur, { outline: 'mid' });
    tail.position.set(0, 0.34, -0.22);
    tail.rotation.x = -0.6;
  }
  bob.add(tail);

  // head
  const headG = new THREE.Group();
  bob.add(headG);
  const head = mk(G.sphere(HEAD_R, 32, 22), fur);
  head.position.y = HEAD_Y;
  head.scale.set(SX, SY, 1);
  headG.add(head);

  // ears
  const earMat = fur;
  if (kind === 'cat' || kind === 'fox') {
    const big = kind === 'fox' ? 1.25 : 1;
    for (const sx of [-1, 1]) {
      const ear = mk(G.cyl(0.02, 0.13 * big, 0.26 * big, 0.03, 16), earMat, { outline: 'mid' });
      ear.position.set(sx * 0.24, HEAD_Y + 0.3, -0.02);
      ear.rotation.z = -sx * 0.42;
      headG.add(ear);
      const inner = mk(G.cyl(0.01, 0.07 * big, 0.16 * big, 0.02, 12), spec.inner, { outline: false });
      inner.position.set(0, -0.03, 0.065);
      inner.rotation.x = 0.12;
      ear.add(inner);
    }
  } else if (kind === 'bunny') {
    for (const sx of [-1, 1]) {
      const ear = mk(G.capsule(0.075, 0.34), earMat, { outline: 'mid' });
      ear.position.set(sx * 0.14, HEAD_Y + 0.52, -0.03);
      ear.rotation.z = -sx * 0.14;
      headG.add(ear);
      const inner = mk(G.capsule(0.04, 0.26), spec.inner, { outline: false });
      inner.position.set(0, 0, 0.045);
      inner.scale.z = 0.5;
      ear.add(inner);
    }
  } else if (kind === 'bear') {
    for (const sx of [-1, 1]) {
      const ear = mk(G.sphere(0.12, 16, 12), earMat, { outline: 'mid' });
      ear.position.set(sx * 0.29, HEAD_Y + 0.27, -0.02);
      ear.scale.z = 0.7;
      headG.add(ear);
      const inner = mk(G.sphere(0.065, 12, 8), spec.inner, { outline: false });
      inner.position.z = 0.07;
      inner.scale.z = 0.4;
      ear.add(inner);
    }
  } else if (kind === 'puppy') {
    for (const sx of [-1, 1]) {
      const ear = mk(G.capsule(0.1, 0.2), spec.inner, { outline: 'mid' });
      ear.position.set(sx * 0.4, HEAD_Y + 0.05, 0);
      ear.rotation.z = sx * 0.35;
      ear.scale.z = 0.55;
      headG.add(ear);
    }
  }

  // face
  const eyes = [];
  for (const sx of [-1, 1]) {
    const { pos, n } = onHead(sx * 0.15, 0.02, 0.0);
    const e = new THREE.Mesh(G.sphere(0.045, 12, 8), toon(INK));
    e.position.copy(pos);
    orientTo(e, n);
    e.scale.set(1, 1.25, 0.5);
    headG.add(e);
    const hl = new THREE.Mesh(G.sphere(0.014, 8, 6), toon('#FFFBF0'));
    hl.position.set(-0.015, 0.018, 0.03);
    e.add(hl);
    eyes.push(e);
    const b = onHead(sx * 0.25, -0.08, 0.004);
    const blush = new THREE.Mesh(G.circle(0.065), toon(C.pinkDeep));
    blush.position.copy(b.pos);
    orientTo(blush, b.n);
    blush.scale.set(1, 0.62, 1);
    headG.add(blush);
  }
  let noseY = -0.07;
  if (kind === 'bear' || kind === 'puppy' || kind === 'fox') {
    const m = onHead(0, -0.1, -0.02);
    const muzzle = mk(G.sphere(0.13, 16, 12), kind === 'bear' ? '#F3D2A8' : '#FFF3DC', { outline: 'thin' });
    muzzle.position.copy(m.pos);
    muzzle.scale.set(1.25, 0.85, 0.7);
    headG.add(muzzle);
    noseY = -0.05;
  }
  const np = onHead(0, noseY, 0.05);
  const nose = new THREE.Mesh(G.sphere(0.032, 10, 8), toon(kind === 'cat' || kind === 'bunny' ? C.pinkDeep : INK));
  nose.position.copy(np.pos);
  nose.scale.set(1.3, 0.9, 0.8);
  headG.add(nose);
  const sp = onHead(0, noseY - 0.07, 0.03);
  const smile = new THREE.Mesh(G.torus(0.045, 0.011, Math.PI), toon(INK));
  smile.position.copy(sp.pos);
  orientTo(smile, sp.n);
  smile.rotateZ(Math.PI);
  headG.add(smile);

  // accessories
  const acc = o.accessories || [];
  if (acc.includes('apron')) {
    const col = o.apronColor || [C.pink, C.sage, C.blue][Math.floor(Math.random() * 3)];
    const apron = mk(G.box(0.3, 0.3, 0.05, 0.02), toon('#fff', { map: gingham(col) }), { outline: 'thin' });
    apron.position.set(0, 0.33, 0.18);
    apron.rotation.x = -0.12;
    bob.add(apron);
    const pocket = mk(G.box(0.12, 0.07, 0.02, 0.01), '#FFFBF0', { outline: 'thin' });
    pocket.position.set(0, -0.05, 0.03);
    apron.add(pocket);
  }
  if (acc.includes('waiter')) {
    // a navy waistcoat over a crisp white shirt, and a towel over one arm
    const vest = mk(G.box(0.34, 0.3, 0.06, 0.03), '#2E4258', { outline: 'thin' });
    vest.position.set(0, 0.36, 0.165);
    vest.rotation.x = -0.1;
    bob.add(vest);
    const shirt = mk(G.cyl(0.001, 0.07, 0.16, 0.002, 3), '#FFFBF0', { outline: false });
    shirt.rotation.set(Math.PI - 0.1, 0, 0);
    shirt.position.set(0, 0.43, 0.2);
    shirt.scale.z = 0.3;
    bob.add(shirt);
    for (const y of [0.33, 0.27]) {
      const btn = mk(G.sphere(0.012, 6, 4), '#D9A441', { outline: false });
      btn.position.set(0, y, 0.2);
      bob.add(btn);
    }
    const towel = mk(G.box(0.08, 0.16, 0.05, 0.02), '#FFFFFF', { outline: 'thin' });
    towel.position.set(-0.27, 0.3, 0.06);
    bob.add(towel);
  }
  if (acc.includes('bowtie')) {
    const col = o.bowColor || [C.blueDeep, C.pinkDeep, C.cherry][Math.floor(Math.random() * 3)];
    for (const sx of [-1, 1]) {
      const w = mk(G.cyl(0.015, 0.06, 0.1, 0.015, 10), col, { outline: 'thin' });
      w.position.set(sx * 0.06, 0.55, 0.16);
      w.rotation.z = sx * Math.PI / 2;
      bob.add(w);
    }
    const knot = mk(G.sphere(0.03, 10, 8), col, { outline: 'thin' });
    knot.position.set(0, 0.55, 0.18);
    bob.add(knot);
  }
  if (acc.includes('beret')) {
    const col = o.beretColor || [C.pinkDeep, C.blueDeep, C.cherry, C.sageDark][Math.floor(Math.random() * 4)];
    const beret = mk(G.sphere(0.3, 20, 12), col, { outline: 'mid' });
    beret.scale.set(1, 0.32, 1);
    beret.position.set(0.06, HEAD_Y + 0.33, -0.02);
    beret.rotation.z = -0.25;
    headG.add(beret);
    const stem = mk(G.capsule(0.02, 0.04), col, { outline: 'thin' });
    stem.position.set(0.08, HEAD_Y + 0.44, -0.02);
    headG.add(stem);
  }
  if (acc.includes('chef')) {
    const band = mk(G.cyl(0.24, 0.24, 0.14, 0.03, 24), '#FFFBF0', { outline: 'mid' });
    band.position.set(0, HEAD_Y + 0.37, -0.02);
    headG.add(band);
    const puffs = [[0, 0.17, 0, 0.19], [-0.13, 0.13, 0, 0.13], [0.13, 0.13, 0, 0.13], [0, 0.13, -0.12, 0.13], [0, 0.13, 0.12, 0.12]];
    const puffGroup = new THREE.Group();
    puffGroup.position.set(0, HEAD_Y + 0.37, -0.02);
    headG.add(puffGroup);
    for (const [x, y, z, r] of puffs) {
      const p = mk(G.sphere(r, 16, 12), '#FFFBF0', { outline: 'mid' });
      p.position.set(x, y, z);
      puffGroup.add(p);
    }
  }
  if (acc.includes('scarf')) {
    const s = mk(G.torus(0.17, 0.05), C.sage, { outline: 'thin' });
    s.rotation.x = Math.PI / 2;
    s.position.y = 0.56;
    bob.add(s);
  }

  root.traverse((m) => {
    if (m.isMesh && !m.userData.outline) m.castShadow = true;
  });

  // batch the rigid parts: animated limbs, head, eyes and smile stay separate
  for (const o of [...feet, ...arms, tail, headG, ...eyes, smile]) if (o) o.userData.dynamic = true;
  mergeStatic(headG);
  mergeStatic(bob);

  return {
    kind, root, bob, headG, head, eyes, smile, arms, feet, tail, shadow,
    blinkT: 1 + Math.random() * 3,
    walkPhase: 0,
  };
}

/** Per-frame animation: walking bounce, idle breathing, blinking, waving, looking. */
export function animateAnimal(a, dt, t, moving, mood = 1, extra = {}) {
  a.blinkT -= dt;
  const blinking = a.blinkT < 0.12;
  if (a.blinkT < 0) a.blinkT = 2 + Math.random() * 3.5;
  for (const e of a.eyes) e.scale.y = blinking ? 0.2 : 1.25;
  a.smile.scale.y = mood < 0 ? -1 : 1;

  if (moving) {
    a.walkPhase += dt * 13;
    const s = Math.sin(a.walkPhase);
    a.bob.position.y = Math.abs(s) * 0.07;
    a.bob.rotation.z = s * 0.06;
    a.feet[0].position.z = 0.03 + s * 0.08;
    a.feet[1].position.z = 0.03 - s * 0.08;
    a.arms[0].rotation.x = s * 0.6;
    a.arms[1].rotation.x = -s * 0.6;
    a.bob.scale.set(1, 1, 1);
  } else {
    a.walkPhase = 0;
    const br = Math.sin(t * 2.4) * 0.02;
    a.bob.position.y *= 0.8;
    a.bob.rotation.z *= 0.8;
    a.bob.scale.set(1 - br * 0.5, 1 + br, 1 - br * 0.5);
    a.feet[0].position.z = a.feet[1].position.z = 0.03;
    a.arms[0].rotation.x = a.arms[1].rotation.x = 0;
  }
  if (a.tail) a.tail.rotation.z = Math.sin(t * 3 + a.root.id) * 0.25;
  a.headG.rotation.z = Math.sin(t * 1.3 + a.root.id) * 0.03;
  const look = Math.max(-0.9, Math.min(0.9, extra.look || 0));
  a.headG.rotation.y += (look - a.headG.rotation.y) * Math.min(1, dt * 6);
  const arm = a.arms[1];
  if (extra.wave) {
    arm.position.y = 0.5;
    arm.rotation.z = -0.5 + Math.sin(t * 12) * 0.45;
  } else {
    arm.position.y += (0.38 - arm.position.y) * Math.min(1, dt * 8);
    if (!moving) arm.rotation.z += (0.5 - arm.rotation.z) * Math.min(1, dt * 8);
  }
}
