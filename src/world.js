// The diorama: slab, two back walls, kitchen stations with faces, café corner and decor.
import * as THREE from 'three';
import { G, C, INK, mk, toon, place, addFace, canvasTex, glow, blob } from './toon.js';

const FONT = '"Fredoka", "Baloo 2", "Trebuchet MS", sans-serif';

// ------------------------------------------------------------------ textures

function planksTex() {
  return canvasTex(256, 256, (ctx) => {
    const cols = ['#E4B374', '#DEAA69', '#E8BA7C', '#DBA563'];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = cols[i];
      ctx.fillRect(0, i * 64, 256, 64);
      ctx.fillStyle = '#B98049';
      ctx.fillRect(0, i * 64, 256, 3);
      const j = [60, 170, 110, 20][i];
      ctx.fillRect(j, i * 64, 3, 64);
      ctx.fillStyle = 'rgba(255,243,220,0.35)';
      ctx.fillRect(0, i * 64 + 6, 256, 4);
    }
  }, [4, 4]);
}

function wallpaperTex(rx, ry) {
  return canvasTex(128, 128, (ctx) => {
    ctx.fillStyle = C.wall;
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#F9DCC8';
    ctx.fillRect(0, 0, 22, 128);
    ctx.fillRect(64, 0, 22, 128);
    ctx.fillStyle = '#F4C9B8';
    for (const [x, y] of [[43, 20], [107, 84], [43, 84], [107, 20]]) {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [rx, ry]);
}

function wainscotTex(rx) {
  return canvasTex(128, 64, (ctx) => {
    ctx.fillStyle = C.sage;
    ctx.fillRect(0, 0, 128, 64);
    ctx.fillStyle = '#9CBD89';
    ctx.fillRect(0, 0, 4, 64);
    ctx.fillRect(64, 0, 4, 64);
    ctx.fillStyle = 'rgba(255,243,220,0.35)';
    ctx.fillRect(8, 0, 4, 64);
    ctx.fillRect(72, 0, 4, 64);
  }, [rx, 1]);
}

function stripesTex(colors, rx = 1, ry = 1, vertical = false) {
  return canvasTex(256, 256, (ctx) => {
    const n = colors.length;
    colors.forEach((c, i) => {
      ctx.fillStyle = c;
      if (vertical) ctx.fillRect((i * 256) / n, 0, 256 / n + 1, 256);
      else ctx.fillRect(0, (i * 256) / n, 256, 256 / n + 1);
    });
  }, [rx, ry]);
}

function ginghamTex(color, r = 4) {
  const t = canvasTex(64, 64, (ctx) => {
    ctx.fillStyle = '#FFFBF0';
    ctx.fillRect(0, 0, 64, 64);
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 32, 64);
    ctx.fillRect(0, 0, 64, 32);
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, 32, 32);
  }, [r, r]);
  t.magFilter = THREE.NearestFilter;
  return t;
}

function labelTex(text, bg, fg, w = 256, h = 128, size = 58) {
  return canvasTex(w, h, (ctx) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = fg;
    ctx.font = `600 ${size}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + 4);
  });
}

function signTex() {
  return canvasTex(512, 160, (ctx) => {
    ctx.fillStyle = C.honey;
    ctx.fillRect(0, 0, 512, 160);
    ctx.fillStyle = '#E3AE6B';
    ctx.fillRect(0, 40, 512, 8);
    ctx.fillRect(0, 110, 512, 8);
    ctx.fillStyle = INK;
    ctx.font = `700 70px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Hillside Bakery', 256, 84);
    ctx.fillStyle = C.cream2;
    ctx.fillText('Hillside Bakery', 253, 79);
  });
}

function menuTex() {
  return canvasTex(384, 256, (ctx) => {
    ctx.fillStyle = '#56644A';
    ctx.fillRect(0, 0, 384, 256);
    ctx.fillStyle = C.cream2;
    ctx.textAlign = 'center';
    ctx.font = `600 44px ${FONT}`;
    ctx.fillText("Today's Treats", 192, 60);
    ctx.font = `500 30px ${FONT}`;
    ctx.fillStyle = C.pink;
    ctx.fillText('pies · cookies · cakes', 192, 118);
    ctx.fillStyle = C.butter;
    ctx.fillText('sundaes · fudge · more', 192, 162);
    ctx.fillStyle = C.cream2;
    ctx.font = `500 26px ${FONT}`;
    ctx.fillText('made with love ♥', 192, 215);
  });
}

function skyTex() {
  return canvasTex(256, 200, (ctx) => {
    ctx.fillStyle = '#BFE3F2';
    ctx.fillRect(0, 0, 256, 200);
    ctx.fillStyle = '#FFFBF0';
    for (const [x, y, r] of [[60, 50, 18], [82, 44, 22], [104, 52, 16], [180, 80, 14], [198, 74, 18]]) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#B8D69A';
    ctx.beginPath();
    ctx.ellipse(70, 210, 150, 70, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9CC585';
    ctx.beginPath();
    ctx.ellipse(220, 220, 130, 80, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.pinkDeep;
    ctx.fillRect(196, 128, 22, 18);
    ctx.fillStyle = C.cherry;
    ctx.beginPath();
    ctx.moveTo(192, 130);
    ctx.lineTo(207, 116);
    ctx.lineTo(222, 130);
    ctx.fill();
  });
}

function weaveTex() {
  return canvasTex(64, 64, (ctx) => {
    ctx.fillStyle = C.honey;
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = C.honeyDark;
    for (let y = 0; y < 64; y += 16) {
      for (let x = 0; x < 64; x += 16) {
        const o = (y / 16) % 2 ? 8 : 0;
        ctx.fillRect(x + o, y, 8, 14);
      }
    }
  }, [6, 3]);
}

// ------------------------------------------------------------------ builders

function scallopAwning(width, colors = [C.pink, C.cream2], depth = 0.7) {
  const g = new THREE.Group();
  const n = Math.round(width / 0.32);
  const sw = width / n;
  const board = new THREE.Group();
  board.rotation.x = 0.5;
  g.add(board);
  for (let i = 0; i < n; i++) {
    const col = colors[i % colors.length];
    const s = mk(G.box(sw, 0.06, depth, 0.02), col, { outline: 'thin', cast: true });
    s.position.set(-width / 2 + sw * (i + 0.5), 0, depth / 2);
    board.add(s);
    const sc = mk(G.cyl(sw / 2, sw / 2, 0.05, 0.02, 16), col, { outline: 'thin' });
    sc.rotation.x = Math.PI / 2;
    sc.position.set(-width / 2 + sw * (i + 0.5), -0.02, depth + 0.02);
    sc.scale.set(1, 1, 1);
    board.add(sc);
  }
  const bar = mk(G.box(width + 0.1, 0.1, 0.1, 0.04), C.honeyDark, { outline: 'thin' });
  bar.position.set(0, 0.02, 0.02);
  g.add(bar);
  return g;
}

function plant(scale = 1, potColor = C.pumpkin) {
  const g = new THREE.Group();
  const pot = mk(G.cyl(0.3, 0.22, 0.45, 0.06), potColor);
  pot.position.y = 0.22;
  g.add(pot);
  const rim = mk(G.cyl(0.33, 0.33, 0.1, 0.04), potColor);
  rim.position.y = 0.44;
  g.add(rim);
  const soil = mk(G.cyl(0.27, 0.27, 0.04, 0.01), C.cocoa, { outline: false });
  soil.position.y = 0.48;
  g.add(soil);
  for (const [x, y, z, r, c] of [
    [0, 0.75, 0, 0.3, C.sage], [-0.2, 0.62, 0.08, 0.2, C.sageDark], [0.2, 0.64, -0.05, 0.22, C.sage],
    [0.05, 1.0, 0.02, 0.2, C.sageDark], [-0.08, 0.66, -0.2, 0.18, C.sage],
  ]) {
    const leaf = mk(G.sphere(r, 16, 12), c, { outline: 'mid' });
    leaf.position.set(x, y, z);
    leaf.scale.y = 1.15;
    g.add(leaf);
  }
  g.scale.setScalar(scale);
  return g;
}

function breadLoaf(len = 0.34, col = C.bread) {
  const g = new THREE.Group();
  const l = mk(G.capsule(0.1, len), col, { outline: 'thin' });
  l.rotation.z = Math.PI / 2;
  l.scale.set(1, 1, 0.9);
  g.add(l);
  for (let i = -1; i <= 1; i++) {
    const s = mk(G.box(0.03, 0.02, 0.12, 0.008), '#F6D39A', { outline: false });
    s.position.set(i * 0.1, 0.095, 0);
    s.rotation.y = 0.6;
    g.add(s);
  }
  return g;
}

function basket(w = 0.6, d = 0.4, withBread = true) {
  const g = new THREE.Group();
  const b = mk(G.box(w, 0.22, d, 0.07), toon('#fff', { map: weaveTex() }), { outline: 'mid' });
  b.position.y = 0.11;
  g.add(b);
  const cloth = mk(G.box(w * 0.95, 0.05, d * 0.9, 0.02), toon('#fff', { map: ginghamTex(C.cherry, 3) }), { outline: 'thin' });
  cloth.position.y = 0.22;
  g.add(cloth);
  if (withBread) {
    for (let i = 0; i < 2; i++) {
      const loaf = breadLoaf(0.2 + i * 0.05, i ? C.bread : '#DE9A4C');
      loaf.position.set(-w * 0.18 + i * w * 0.34, 0.33, (i - 0.5) * 0.08);
      loaf.rotation.y = i ? 0.3 : -0.2;
      loaf.rotation.z = i ? 0.2 : -0.15;
      g.add(loaf);
    }
  }
  return g;
}

function jar(col, h = 0.34) {
  const g = new THREE.Group();
  const body = mk(G.cyl(0.12, 0.12, h, 0.05, 18), '#E9F5FA', { outline: 'thin' });
  body.position.y = h / 2;
  g.add(body);
  const fill = mk(G.cyl(0.1, 0.1, h * 0.65, 0.04, 16), col, { outline: false });
  fill.position.y = h * 0.36;
  g.add(fill);
  const lid = mk(G.cyl(0.13, 0.13, 0.07, 0.03, 18), C.cherry, { outline: 'thin' });
  lid.position.y = h + 0.02;
  g.add(lid);
  return g;
}

function sack(text, col = '#ECD4A8') {
  const g = new THREE.Group();
  const body = mk(G.box(0.6, 0.72, 0.46, 0.2), col);
  body.position.y = 0.36;
  g.add(body);
  const neck = mk(G.cyl(0.12, 0.2, 0.18, 0.05, 16), col, { outline: 'mid' });
  neck.position.y = 0.78;
  g.add(neck);
  const tie = mk(G.torus(0.13, 0.03), C.cherry, { outline: 'thin' });
  tie.rotation.x = Math.PI / 2;
  tie.position.y = 0.76;
  g.add(tie);
  const label = new THREE.Mesh(G.plane(0.42, 0.21), toon('#fff', { map: labelTex(text, '#FFF6E4', INK, 256, 128, 58) }));
  label.position.set(0, 0.36, 0.235);
  g.add(label);
  return g;
}

function counter(w, d, h, bodyCol, topCol = C.cream2) {
  const g = new THREE.Group();
  const body = mk(G.box(w, h - 0.1, d, 0.1), bodyCol);
  body.position.y = (h - 0.1) / 2;
  g.add(body);
  const top = mk(G.box(w + 0.1, 0.12, d + 0.08, 0.05), topCol);
  top.position.y = h - 0.06;
  g.add(top);
  // cupboard doors + knobs
  const n = Math.max(1, Math.round(w / 0.75));
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + (w / n) * (i + 0.5);
    const door = mk(G.box(w / n - 0.14, h - 0.36, 0.04, 0.04), bodyCol, { outline: 'thin', cast: false });
    door.position.set(x, (h - 0.1) / 2, d / 2 + 0.01);
    g.add(door);
    const knob = mk(G.sphere(0.04, 10, 8), C.butter, { outline: 'thin' });
    knob.position.set(x + (i % 2 ? -1 : 1) * (w / n / 2 - 0.16), (h - 0.1) / 2 + 0.05, d / 2 + 0.05);
    g.add(knob);
  }
  const shadow = blob(w + 0.4, d + 0.4);
  shadow.position.z = 0.1;
  g.add(shadow);
  return g;
}

function chair(color) {
  const g = new THREE.Group();
  const seat = mk(G.box(0.5, 0.1, 0.48, 0.045), color);
  seat.position.y = 0.36;
  g.add(seat);
  const cushion = mk(G.box(0.42, 0.06, 0.4, 0.03), C.cream2, { outline: 'thin' });
  cushion.position.y = 0.43;
  g.add(cushion);
  for (const [x, z] of [[-0.18, -0.17], [0.18, -0.17], [-0.18, 0.17], [0.18, 0.17]]) {
    const leg = mk(G.cyl(0.05, 0.045, 0.32, 0.02, 12), C.honeyDark, { outline: 'mid' });
    leg.position.set(x, 0.16, z);
    g.add(leg);
  }
  const back = mk(G.box(0.5, 0.42, 0.08, 0.04), color);
  back.position.set(0, 0.62, -0.21);
  g.add(back);
  const heart = mk(G.sphere(0.06, 10, 8), C.cream2, { outline: 'thin' });
  heart.position.set(0, 0.66, -0.16);
  heart.scale.z = 0.4;
  g.add(heart);
  g.add(blob(0.8, 0.8));
  return g;
}

function cafeTable(clothColor) {
  const g = new THREE.Group();
  const base = mk(G.cyl(0.32, 0.36, 0.08, 0.03), C.honeyDark);
  base.position.y = 0.04;
  g.add(base);
  const stem = mk(G.cyl(0.07, 0.07, 0.5, 0.02, 12), C.honeyDark, { outline: 'mid' });
  stem.position.y = 0.3;
  g.add(stem);
  const top = mk(G.cyl(0.64, 0.64, 0.1, 0.04, 36), C.honey);
  top.position.y = 0.58;
  g.add(top);
  const cloth = new THREE.Mesh(G.circle(0.56), toon('#fff', { map: ginghamTex(clothColor, 5) }));
  cloth.rotation.x = -Math.PI / 2;
  cloth.position.y = 0.636;
  cloth.receiveShadow = true;
  g.add(cloth);
  // little vase with a flower
  const vase = mk(G.cyl(0.05, 0.07, 0.16, 0.03, 12), C.blue, { outline: 'thin' });
  vase.position.set(0, 0.72, 0);
  g.add(vase);
  const stemF = mk(G.cyl(0.012, 0.012, 0.14, 0.005, 6), C.sageDark, { outline: false });
  stemF.position.set(0, 0.86, 0);
  g.add(stemF);
  const flower = mk(G.sphere(0.06, 12, 8), C.pinkDeep, { outline: 'thin' });
  flower.position.set(0, 0.95, 0);
  g.add(flower);
  const center = mk(G.sphere(0.03, 8, 6), C.butter, { outline: false });
  center.position.set(0, 0.97, 0.04);
  g.add(center);
  g.add(blob(1.6, 1.6));
  return g;
}

function sconce() {
  const g = new THREE.Group();
  const plate = mk(G.box(0.2, 0.34, 0.06, 0.03), C.honeyDark, { outline: 'thin' });
  g.add(plate);
  const arm = mk(G.cyl(0.03, 0.03, 0.2, 0.01, 8), C.honeyDark, { outline: 'thin' });
  arm.rotation.x = Math.PI / 2;
  arm.position.set(0, 0, 0.1);
  g.add(arm);
  const shade = mk(G.cyl(0.12, 0.2, 0.22, 0.04, 16), C.butter, { outline: 'mid', emissive: '#FFD27A', emissiveIntensity: 0.35 });
  shade.position.set(0, 0.1, 0.22);
  g.add(shade);
  const gl = glow('#FFD58A', 1.9, 0.5);
  gl.position.set(0, 0.1, 0.3);
  g.add(gl);
  return { group: g, glow: gl };
}

// ------------------------------------------------------------------ stations

function makeStation(id, type, name, group, interact, slot, extra = {}) {
  return { id, type, name, group, interact, slot, item: null, t: 0, dur: 0, done: false, bounce: 0, ...extra };
}

function buildPantry() {
  const g = new THREE.Group();
  const H = 2.35, W = 1.9, D = 0.75;
  const back = mk(G.box(W, H, 0.1, 0.04), C.honeyDark);
  place(back, 0, H / 2, -D / 2 + 0.05, g);
  for (const sx of [-1, 1]) place(mk(G.box(0.12, H, D, 0.05), C.honey), sx * (W / 2 - 0.06), H / 2, 0, g);
  for (const y of [0.1, 0.85, 1.6, H - 0.05]) place(mk(G.box(W, 0.1, D, 0.04), C.honey), 0, y, 0, g);
  // crown with scallops
  const crown = scallopAwning(W + 0.1, [C.sage, C.cream2], 0.45);
  crown.position.set(0, H + 0.02, -D / 2 + 0.05);
  g.add(crown);
  // shelf contents
  const b1 = basket(0.7, 0.45);
  place(b1, -0.4, 0.15, 0.02, g);
  const b2 = basket(0.6, 0.45);
  place(b2, 0.45, 0.15, 0.02, g);
  [C.pinkDeep, C.butter, '#C98B55', C.sage].forEach((col, i) => place(jar(col, 0.36), -0.65 + i * 0.43, 0.9, 0, g));
  const b3 = basket(0.75, 0.45, true);
  place(b3, -0.35, 1.65, 0.02, g);
  place(jar(C.cherry, 0.3), 0.35, 1.65, 0, g);
  place(jar('#F3D9A0', 0.4), 0.68, 1.65, 0, g);
  // recipe book leaning on the top shelf
  const book = mk(G.box(0.36, 0.46, 0.1, 0.03), C.pumpkin);
  book.position.set(0.1, 2.53, 0.02);
  book.rotation.z = 0.1;
  g.add(book);
  const page = mk(G.box(0.3, 0.4, 0.02, 0.01), C.cream2, { outline: false });
  page.position.set(0, 0, 0.055);
  book.add(page);
  const heart = mk(G.sphere(0.06, 10, 8), C.pinkDeep, { outline: 'thin' });
  heart.position.set(0, 0.04, 0.07);
  heart.scale.z = 0.4;
  book.add(heart);
  const pb = blob(W + 0.5, D + 0.6);
  pb.position.z = 0.15;
  g.add(pb);
  return g;
}

function buildMixer() {
  const g = counter(1.5, 0.9, 0.85, C.sage);
  const bowl = new THREE.Group();
  bowl.position.set(0, 0.91, 0.05);
  g.add(bowl);
  const outer = mk(G.cyl(0.44, 0.26, 0.4, 0.1, 32), C.pink);
  outer.position.y = 0.2;
  bowl.add(outer);
  const rim = mk(G.torus(0.42, 0.04), C.pink, { outline: 'thin' });
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.4;
  bowl.add(rim);
  const batter = mk(G.cyl(0.39, 0.39, 0.04, 0.02, 28), C.butter, { outline: false });
  batter.position.y = 0.38;
  bowl.add(batter);
  const face = addFace(bowl, 0.62, { position: new THREE.Vector3(0, 0.2, 0.39) });
  face.face.rotation.x = -0.25;
  // whisk
  const whisk = new THREE.Group();
  whisk.position.set(0.12, 0.55, 0);
  whisk.rotation.z = -0.5;
  bowl.add(whisk);
  const handle = mk(G.capsule(0.04, 0.26), C.honey, { outline: 'thin' });
  handle.position.y = 0.28;
  whisk.add(handle);
  for (let i = 0; i < 3; i++) {
    const loop = mk(G.torus(0.09, 0.012), '#F3E6D0', { outline: 'thin' });
    loop.rotation.y = (i / 3) * Math.PI;
    loop.scale.y = 1.6;
    loop.position.y = 0.02;
    whisk.add(loop);
  }
  // side bits
  place(jar(C.butter, 0.26), -0.55, 0.91, -0.15, g);
  const eggs = new THREE.Group();
  place(eggs, 0.55, 0.91, -0.1, g);
  const cup = mk(G.cyl(0.14, 0.1, 0.12, 0.03, 16), C.blue, { outline: 'thin' });
  cup.position.y = 0.06;
  eggs.add(cup);
  for (const [x, z] of [[-0.05, 0], [0.06, 0.03], [0, -0.06]]) {
    const e = mk(G.sphere(0.06, 12, 8), '#FFF6E4', { outline: 'thin' });
    e.scale.y = 1.25;
    e.position.set(x, 0.16, z);
    eggs.add(e);
  }
  return { group: g, face, anim: bowl, whisk };
}

function buildStove() {
  const g = counter(1.5, 0.9, 0.85, C.blue);
  const plate = mk(G.box(1.1, 0.06, 0.7, 0.03), C.cocoa, { outline: 'thin' });
  plate.position.y = 0.9;
  g.add(plate);
  for (const x of [-0.3, 0.3]) {
    const ring = mk(G.torus(0.17, 0.025), INK, { outline: false });
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, 0.94, 0);
    g.add(ring);
  }
  for (const x of [-0.45, -0.15, 0.15, 0.45]) {
    const knob = mk(G.cyl(0.06, 0.06, 0.06, 0.02, 12), C.cream2, { outline: 'thin' });
    knob.rotation.x = Math.PI / 2;
    knob.position.set(x, 0.72, 0.47);
    g.add(knob);
  }
  const pot = new THREE.Group();
  pot.position.set(-0.3, 0.95, 0);
  g.add(pot);
  const body = mk(G.cyl(0.3, 0.27, 0.36, 0.07, 28), C.pumpkin);
  body.position.y = 0.18;
  pot.add(body);
  const rim = mk(G.torus(0.29, 0.03), C.pumpkin, { outline: 'thin' });
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.36;
  pot.add(rim);
  const soup = mk(G.cyl(0.27, 0.27, 0.03, 0.01, 24), '#F3C07A', { outline: false });
  soup.position.y = 0.33;
  pot.add(soup);
  for (const sx of [-1, 1]) {
    const h = mk(G.capsule(0.035, 0.08), C.pumpkin, { outline: 'thin' });
    h.rotation.z = Math.PI / 2;
    h.position.set(sx * 0.34, 0.28, 0);
    pot.add(h);
  }
  const face = addFace(pot, 0.5, { position: new THREE.Vector3(0, 0.17, 0.29) });
  const flame = glow('#FF9A3C', 0.9, 0);
  flame.position.set(-0.3, 0.98, 0);
  g.add(flame);
  // frying pan on the other burner
  const pan = mk(G.cyl(0.24, 0.2, 0.08, 0.03, 24), '#6E4A3A', { outline: 'mid' });
  pan.position.set(0.3, 0.97, 0);
  g.add(pan);
  const panHandle = mk(G.box(0.36, 0.05, 0.07, 0.02), C.honeyDark, { outline: 'thin' });
  panHandle.position.set(0.62, 0.99, 0.08);
  panHandle.rotation.y = -0.3;
  g.add(panHandle);
  return { group: g, face, anim: pot, flame };
}

function buildOven() {
  const g = new THREE.Group();
  for (const [x, z] of [[-0.6, -0.4], [0.6, -0.4], [-0.6, 0.4], [0.6, 0.4]]) {
    place(mk(G.sphere(0.12, 12, 8), C.honeyDark, { outline: 'mid' }), x, 0.1, z, g);
  }
  const body = new THREE.Group();
  g.add(body);
  const base = mk(G.box(1.75, 1.05, 1.25, 0.24), C.bread);
  base.position.y = 0.7;
  body.add(base);
  const dome = mk(G.capsule(0.62, 0.52, 8, 20), C.bread);
  dome.rotation.z = Math.PI / 2;
  dome.scale.set(0.72, 1, 1);
  dome.position.y = 1.22;
  body.add(dome);
  // score marks on the crust
  for (const x of [-0.42, -0.02, 0.38]) {
    const s = mk(G.box(0.12, 0.05, 0.62, 0.02), '#F6D39A', { outline: 'thin', cast: false });
    s.position.set(x, 1.66, 0.02);
    s.rotation.y = 0.5;
    body.add(s);
  }
  const door = mk(G.box(0.9, 0.52, 0.1, 0.1), C.cocoa);
  door.position.set(0, 0.55, 0.63);
  body.add(door);
  const windowMat = toon('#FFB35C', { emissive: '#FF9A3C', emissiveIntensity: 0.15, unique: true });
  const win = mk(G.box(0.66, 0.28, 0.06, 0.06), windowMat, { outline: 'thin' });
  win.position.set(0, 0.57, 0.68);
  body.add(win);
  const handle = mk(G.capsule(0.03, 0.4), C.butter, { outline: 'thin' });
  handle.rotation.z = Math.PI / 2;
  handle.position.set(0, 0.87, 0.72);
  body.add(handle);
  const face = addFace(body, 0.9, { position: new THREE.Vector3(0, 1.1, 0.64) });
  const chimney = mk(G.cyl(0.13, 0.15, 0.7, 0.04, 16), C.honeyDark);
  chimney.position.set(0.5, 1.9, -0.3);
  body.add(chimney);
  const cap = mk(G.cyl(0.19, 0.19, 0.08, 0.03, 16), C.honeyDark, { outline: 'thin' });
  cap.position.set(0.5, 2.27, -0.3);
  body.add(cap);
  const gl = glow('#FFA24C', 1.3, 0.12);
  gl.position.set(0, 0.6, 0.85);
  body.add(gl);
  g.add(blob(2.2, 1.7));
  return { group: g, face, anim: body, windowMat, glow: gl, chimneyTop: new THREE.Vector3(0.5, 2.35, -0.3) };
}

function buildFridge() {
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);
  const box = mk(G.box(1.1, 1.95, 0.85, 0.26), C.blue);
  box.position.y = 1.02;
  body.add(box);
  const seam = mk(G.box(1.0, 0.04, 0.04, 0.015), C.blueDeep, { outline: false, cast: false });
  seam.position.set(0, 1.35, 0.43);
  body.add(seam);
  for (const y of [1.65, 0.95]) {
    const h = mk(G.capsule(0.035, y > 1.2 ? 0.14 : 0.3), C.cream2, { outline: 'thin' });
    h.position.set(0.4, y, 0.46);
    body.add(h);
  }
  const face = addFace(body, 0.8, { position: new THREE.Vector3(-0.05, 1.62, 0.43) });
  for (const [x, y, c] of [[-0.3, 1.05, C.pinkDeep], [-0.1, 0.8, C.butter], [0.15, 1.1, C.sage]]) {
    const m = mk(G.cyl(0.06, 0.06, 0.03, 0.01, 12), c, { outline: 'thin' });
    m.rotation.x = Math.PI / 2;
    m.position.set(x, y, 0.44);
    body.add(m);
  }
  for (const x of [-0.35, 0.35]) place(mk(G.sphere(0.09, 10, 8), C.blueDeep, { outline: 'mid' }), x, 0.06, 0.2, body);
  // cake box on top
  const cb = mk(G.box(0.5, 0.3, 0.45, 0.06), C.pink, { outline: 'mid' });
  cb.position.set(-0.1, 2.15, 0);
  body.add(cb);
  const ribbon = mk(G.box(0.1, 0.31, 0.46, 0.02), C.cream2, { outline: false });
  ribbon.position.set(-0.1, 2.15, 0);
  body.add(ribbon);
  g.add(blob(1.5, 1.3));
  return { group: g, face, anim: body };
}

function buildDecor() {
  const g = counter(1.6, 0.9, 0.85, C.pink);
  // cake stand turntable
  const stand = mk(G.cyl(0.08, 0.14, 0.2, 0.03, 14), C.cream2, { outline: 'mid' });
  stand.position.set(0, 1.0, 0.05);
  g.add(stand);
  const plateTop = mk(G.cyl(0.36, 0.36, 0.05, 0.02, 28), C.cream2, { outline: 'mid' });
  plateTop.position.set(0, 1.12, 0.05);
  g.add(plateTop);
  // piping bag with a face
  const bag = new THREE.Group();
  bag.position.set(-0.55, 0.91, -0.05);
  g.add(bag);
  const cone = mk(G.cyl(0.02, 0.16, 0.42, 0.03, 18), '#FFFBF0');
  cone.position.y = 0.22;
  cone.rotation.x = Math.PI;
  bag.add(cone);
  const tip = mk(G.cyl(0.02, 0.04, 0.08, 0.01, 10), C.butter, { outline: 'thin' });
  tip.position.y = 0.02;
  tip.rotation.x = Math.PI;
  bag.add(tip);
  const top = mk(G.sphere(0.14, 14, 10), C.pink, { outline: 'mid' });
  top.position.y = 0.45;
  top.scale.y = 0.7;
  bag.add(top);
  const face = addFace(bag, 0.36, { position: new THREE.Vector3(0, 0.3, 0.13) });
  // sprinkle shakers
  [C.pinkDeep, C.blueDeep, C.butter].forEach((c, i) => {
    const s = jar(c, 0.22);
    s.scale.setScalar(0.8);
    place(s, 0.45 + (i % 2) * 0.2, 0.91, -0.2 + i * 0.16, g);
  });
  return { group: g, face, anim: bag };
}

function buildTrash() {
  const g = new THREE.Group();
  const b = mk(G.cyl(0.36, 0.3, 0.62, 0.06, 24), toon('#fff', { map: weaveTex() }));
  b.position.y = 0.31;
  g.add(b);
  const rim = mk(G.torus(0.36, 0.05), C.honeyDark, { outline: 'thin' });
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.62;
  g.add(rim);
  const cloth = mk(G.cyl(0.3, 0.3, 0.04, 0.01, 20), toon('#fff', { map: ginghamTex(C.sage, 3) }), { outline: false });
  cloth.position.y = 0.58;
  g.add(cloth);
  g.add(blob(0.9, 0.9));
  return { group: g, anim: g };
}

// ------------------------------------------------------------------ world

export const ROOM = { x0: -6, x1: 6, z0: -5, z1: 5, h: 4.1 };

export function buildWorld(scene) {
  const world = new THREE.Group();
  scene.add(world);
  const colliders = [];
  const glows = [];
  const fpOnly = [];

  const addCollider = (obj, pad = 0.02) => {
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3();
    obj.traverse((m) => {
      if (m.isMesh && !m.userData.outline && m.geometry.type !== 'PlaneGeometry' && !(m.material && m.material.transparent)) {
        m.geometry.computeBoundingBox();
        box.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld));
      }
    });
    colliders.push({ type: 'box', x0: box.min.x - pad, x1: box.max.x + pad, z0: box.min.z - pad, z1: box.max.z + pad });
  };

  // --- slab: a layered base like a little cake
  const slab = mk(G.box(12.7, 0.55, 10.7, 0.22), '#F1CE96');
  slab.position.y = -0.36;
  world.add(slab);
  const slab2 = mk(G.box(12.5, 0.5, 10.5, 0.22), C.honeyDark);
  slab2.position.y = -0.8;
  world.add(slab2);
  const floor = mk(G.box(12, 0.14, 10, 0.05), toon('#fff', { map: planksTex() }), { outline: 'mid' });
  floor.position.y = -0.07;
  floor.castShadow = false;
  world.add(floor);

  // --- back walls
  const H = ROOM.h;
  const leftWall = mk(G.box(0.3, H + 0.1, 10.3, 0.08), toon('#fff', { map: wallpaperTex(8, 3.2) }));
  leftWall.position.set(-6.15, H / 2 - 0.05, -0.15);
  world.add(leftWall);
  const rightWall = mk(G.box(12.3, H + 0.1, 0.3, 0.08), toon('#fff', { map: wallpaperTex(9.5, 3.2) }));
  rightWall.position.set(-0.15, H / 2 - 0.05, -5.15);
  world.add(rightWall);
  const wL = mk(G.box(0.06, 1.1, 10.0, 0.02), toon('#fff', { map: wainscotTex(10) }), { outline: 'thin', cast: false });
  wL.position.set(-5.97, 0.55, 0);
  world.add(wL);
  const wR = mk(G.box(11.9, 1.1, 0.06, 0.02), toon('#fff', { map: wainscotTex(12) }), { outline: 'thin', cast: false });
  wR.position.set(0.05, 0.55, -4.97);
  world.add(wR);
  for (const [w, x, z, ry] of [[10.05, -5.93, 0, Math.PI / 2], [11.95, 0.05, -4.93, 0]]) {
    const rail = mk(G.box(w, 0.09, 0.1, 0.03), C.honey, { outline: 'thin' });
    rail.position.set(x, 1.12, z);
    rail.rotation.y = ry;
    world.add(rail);
    const base = mk(G.box(w, 0.14, 0.08, 0.03), C.honeyDark, { outline: 'thin', cast: false });
    base.position.set(x, 0.07, z);
    base.rotation.y = ry;
    world.add(base);
  }
  const trimL = mk(G.box(0.42, 0.18, 10.45, 0.06), C.honey);
  trimL.position.set(-6.15, H + 0.02, -0.15);
  world.add(trimL);
  const trimR = mk(G.box(12.45, 0.18, 0.42, 0.06), C.honey);
  trimR.position.set(-0.15, H + 0.02, -5.15);
  world.add(trimR);

  // --- front walls, only seen from the baker's eyes
  const fpMat = toon('#fff', { map: wallpaperTex(9.5, 3.2) });
  for (const [w, x, z, ry] of [[10.3, 6.15, -0.15, Math.PI / 2], [12.3, -0.15, 5.15, 0]]) {
    const fw = mk(G.box(w, H + 0.1, 0.3, 0.08), fpMat, { cast: false });
    fw.position.set(x, H / 2 - 0.05, z);
    fw.rotation.y = ry;
    fw.traverse((o) => o.layers.set(1));
    world.add(fw);
    const ws = mk(G.box(w - 0.3, 1.1, 0.06, 0.02), toon('#fff', { map: wainscotTex(12) }), { outline: 'thin', cast: false });
    ws.position.set(x - Math.sin(ry) * 0.18, 0.55, z - Math.cos(ry) * 0.18);
    ws.rotation.y = ry;
    ws.traverse((o) => o.layers.set(1));
    world.add(ws);
    fpOnly.push(fw, ws);
  }

  // --- stations
  const stations = {};

  // left wall stations face +x
  const onLeft = (g, z) => { g.position.set(-5.45, 0, z); g.rotation.y = Math.PI / 2; world.add(g); };
  const onRight = (g, x) => { g.position.set(x, 0, -4.52); world.add(g); };

  const pantry = buildPantry();
  pantry.position.set(-5.55, 0, 3.25);
  pantry.rotation.y = Math.PI / 2;
  world.add(pantry);
  addCollider(pantry);
  stations.pantry = makeStation('pantry', 'pantry', 'Pantry', pantry, new THREE.Vector3(-4.55, 0, 3.25), new THREE.Vector3(-5.2, 2.2, 3.25), { anim: pantry });

  const mixer = buildMixer();
  onLeft(mixer.group, 1.35);
  addCollider(mixer.group);
  stations.mix = makeStation('mix', 'mix', 'Mixing Bowl', mixer.group, new THREE.Vector3(-4.45, 0, 1.35), new THREE.Vector3(-5.35, 1.95, 1.35), mixer);

  const stove = buildStove();
  onLeft(stove.group, -0.45);
  addCollider(stove.group);
  stations.stove = makeStation('stove', 'stove', 'Stove', stove.group, new THREE.Vector3(-4.45, 0, -0.45), new THREE.Vector3(-5.35, 1.95, -0.45), stove);

  const oven = buildOven();
  oven.group.position.set(-5.25, 0, -2.55);
  oven.group.rotation.y = Math.PI / 2;
  world.add(oven.group);
  addCollider(oven.group);
  stations.bake = makeStation('bake', 'bake', 'Oven', oven.group, new THREE.Vector3(-4.05, 0, -2.55), new THREE.Vector3(-4.9, 2.55, -2.55), oven);

  const fridge = buildFridge();
  onRight(fridge.group, -4.35);
  fridge.group.position.z = -4.48;
  addCollider(fridge.group);
  stations.fridge = makeStation('fridge', 'fridge', 'Fridge', fridge.group, new THREE.Vector3(-4.35, 0, -3.4), new THREE.Vector3(-4.35, 2.95, -4.4), fridge);

  const decor = buildDecor();
  onRight(decor.group, -2.45);
  addCollider(decor.group);
  stations.decor = makeStation('decor', 'decor', 'Decorating Table', decor.group, new THREE.Vector3(-2.45, 0, -3.45), new THREE.Vector3(-2.45, 1.85, -4.45), decor);

  const trash = buildTrash();
  onRight(trash.group, -0.95);
  trash.group.position.z = -4.45;
  addCollider(trash.group);
  stations.trash = makeStation('trash', 'trash', 'Scrap Basket', trash.group, new THREE.Vector3(-0.95, 0, -3.6), new THREE.Vector3(-0.95, 1.4, -4.45), trash);

  // --- window with awning and bread bench (right wall)
  const win = new THREE.Group();
  win.position.set(1.55, 2.25, -4.98);
  world.add(win);
  place(mk(G.box(1.95, 1.55, 0.14, 0.06), C.cream2), 0, 0, 0, win);
  const pane = new THREE.Mesh(G.plane(1.65, 1.25), new THREE.MeshBasicMaterial({ map: skyTex() }));
  pane.position.z = 0.075;
  win.add(pane);
  place(mk(G.box(0.08, 1.3, 0.08, 0.03), C.cream2, { outline: 'thin' }), 0, 0, 0.1, win);
  place(mk(G.box(1.7, 0.08, 0.08, 0.03), C.cream2, { outline: 'thin' }), 0, 0, 0.1, win);
  place(mk(G.box(2.15, 0.1, 0.34, 0.04), C.honey), 0, -0.82, 0.14, win);
  const sillPlant = plant(0.5, C.pink);
  place(sillPlant, 0.65, -0.77, 0.16, win);
  const curtainTex = ginghamTex(C.pinkDeep, 3);
  for (const sx of [-1, 1]) {
    const cur = mk(G.box(0.36, 1.35, 0.06, 0.03), toon('#fff', { map: curtainTex }), { outline: 'thin' });
    cur.position.set(sx * 0.9, 0.05, 0.14);
    win.add(cur);
  }
  const awn = scallopAwning(2.3, [C.pinkDeep, C.cream2]);
  awn.position.set(1.55, 3.2, -4.95);
  world.add(awn);

  const bench = counter(1.7, 0.6, 0.6, C.honey, C.honeyLight);
  bench.position.set(1.55, 0, -4.62);
  world.add(bench);
  place(basket(0.62, 0.42), 1.15, 0.6, -4.62, world);
  place(basket(0.62, 0.42), 1.95, 0.6, -4.62, world);
  addCollider(bench);

  // --- door with awning and welcome mat
  const door = new THREE.Group();
  door.position.set(4.3, 0, -4.97);
  world.add(door);
  place(mk(G.box(1.5, 2.55, 0.12, 0.08), C.honeyDark), 0, 1.27, 0, door);
  place(mk(G.box(1.2, 2.3, 0.12, 0.14), C.pumpkin), 0, 1.17, 0.06, door);
  const round = mk(G.cyl(0.26, 0.26, 0.06, 0.02, 24), C.cream2, { outline: 'mid' });
  round.rotation.x = Math.PI / 2;
  round.position.set(0, 1.75, 0.14);
  door.add(round);
  const roundPane = new THREE.Mesh(G.circle(0.2), new THREE.MeshBasicMaterial({ map: skyTex() }));
  roundPane.position.set(0, 1.75, 0.18);
  door.add(roundPane);
  place(mk(G.sphere(0.06, 10, 8), C.butter, { outline: 'thin' }), 0.42, 1.05, 0.17, door);
  const doorAwn = scallopAwning(1.8, [C.sageDark, C.cream2], 0.55);
  doorAwn.position.set(4.3, 2.85, -4.95);
  world.add(doorAwn);
  const mat = mk(G.box(1.4, 0.04, 0.8, 0.02), toon('#fff', { map: labelTex('welcome', C.pink, INK, 256, 128, 52) }), { outline: 'thin', cast: false });
  mat.position.set(4.3, 0.02, -4.35);
  world.add(mat);

  // --- wall decor
  const sign = mk(G.box(2.3, 0.72, 0.08, 0.06), toon('#fff', { map: signTex() }), { outline: 'mid' });
  sign.position.set(-2.95, 3.08, -4.95);
  world.add(sign);
  const menu = mk(G.box(0.1, 0.95, 1.4, 0.04), toon('#fff', { map: menuTex() }), { outline: 'mid' });
  menu.position.set(-5.95, 3.2, 3.25);
  world.add(menu);
  const menuFrame = mk(G.box(0.08, 1.07, 1.52, 0.05), C.honey, { outline: 'thin' });
  menuFrame.position.set(-5.98, 3.2, 3.25);
  world.add(menuFrame);
  // shelf with jars above the mixer
  const shelf = mk(G.box(0.45, 0.08, 1.7, 0.03), C.honey, { outline: 'mid' });
  shelf.position.set(-5.78, 2.3, 1.2);
  world.add(shelf);
  [C.pink, C.butter, C.sage, C.blue].forEach((c, i) => place(jar(c, 0.3), -5.8, 2.34, 0.62 + i * 0.4, world));
  // clock
  const clock = new THREE.Group();
  clock.position.set(-5.93, 2.65, -0.45);
  clock.rotation.y = Math.PI / 2;
  world.add(clock);
  const cf = mk(G.cyl(0.38, 0.38, 0.1, 0.04, 28), C.pumpkin);
  cf.rotation.x = Math.PI / 2;
  clock.add(cf);
  const cfi = mk(G.cyl(0.3, 0.3, 0.04, 0.01, 28), C.cream2, { outline: 'thin' });
  cfi.rotation.x = Math.PI / 2;
  cfi.position.z = 0.05;
  clock.add(cfi);
  const hand1 = mk(G.box(0.03, 0.2, 0.02, 0.01), INK, { outline: false });
  hand1.geometry = G.box(0.03, 0.2, 0.02, 0.01);
  const h1 = new THREE.Group();
  h1.position.z = 0.08;
  hand1.position.y = 0.09;
  h1.add(hand1);
  clock.add(h1);
  const hand2 = mk(G.box(0.03, 0.14, 0.02, 0.01), INK, { outline: false });
  const h2 = new THREE.Group();
  h2.position.z = 0.085;
  hand2.position.y = 0.06;
  h2.add(hand2);
  clock.add(h2);
  // hanging utensils above the stove area
  for (const [z, c] of [[-1.4, C.honey], [-1.15, C.pinkDeep]]) {
    const sp = mk(G.capsule(0.03, 0.34), c, { outline: 'thin' });
    sp.position.set(-5.9, 2.2, z);
    world.add(sp);
    const head = mk(G.sphere(0.08, 10, 8), c, { outline: 'thin' });
    head.position.set(-5.9, 1.97, z);
    head.scale.set(0.4, 1.2, 1);
    world.add(head);
  }

  // sconces
  for (const [x, z, ry] of [[3.0, -4.93, 0], [5.55, -4.93, 0], [-5.93, 4.45, Math.PI / 2], [-5.93, -3.75, Math.PI / 2]]) {
    const s = sconce();
    s.group.position.set(x, 2.55, z);
    s.group.rotation.y = ry;
    world.add(s.group);
    glows.push(s.glow);
  }

  // string lights along both wall tops
  const bulbs = [];
  const bulbCols = [C.butter, C.pink, C.blue, '#FFD9A0', C.sage];
  const lightRun = (a, b, sagCount) => {
    const pts = [];
    const n = 60;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const p = a.clone().lerp(b, t);
      p.y -= Math.abs(Math.sin(t * Math.PI * sagCount)) * 0.32;
      pts.push(p);
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const wire = new THREE.Mesh(new THREE.TubeGeometry(curve, 120, 0.018, 5), toon(INK));
    world.add(wire);
    const count = sagCount * 5;
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      const p = curve.getPoint(t);
      const col = bulbCols[(i + bulbs.length) % bulbCols.length];
      const bulb = mk(G.sphere(0.07, 10, 8), col, { outline: 'thin', emissive: col, emissiveIntensity: 0.55, cast: false });
      bulb.scale.y = 1.3;
      bulb.position.copy(p).add(new THREE.Vector3(0, -0.08, 0));
      world.add(bulb);
      const gl = glow(col, 0.55, 0.45);
      gl.position.copy(bulb.position);
      world.add(gl);
      glows.push(gl);
      bulbs.push(gl);
    }
  };
  lightRun(new THREE.Vector3(-5.9, 3.95, 4.9), new THREE.Vector3(-5.9, 3.95, -4.9), 4);
  lightRun(new THREE.Vector3(-5.9, 3.95, -4.88), new THREE.Vector3(5.9, 3.95, -4.88), 5);

  // --- café corner
  const rug = mk(G.box(5.8, 0.03, 3.3, 0.01), toon('#fff', { map: stripesTex([C.cream2, C.pink, C.cream2, C.sage, C.cream2, C.blue, C.cream2, C.butter], 1, 1, true) }), { outline: 'thin', cast: false });
  rug.position.set(3.0, 0.015, 1.55);
  world.add(rug);
  const tables = [
    { x: 1.75, z: 1.55, cloth: C.pinkDeep },
    { x: 4.35, z: 1.55, cloth: C.blueDeep },
  ].map((t) => {
    const g = cafeTable(t.cloth);
    g.position.set(t.x, 0, t.z);
    world.add(g);
    colliders.push({ type: 'circle', x: t.x, z: t.z, r: 0.66 });
    return { ...t, group: g };
  });
  const seatDefs = [
    { x: 1.75, z: 0.62, ry: 0, table: 0, col: C.pink },
    { x: 0.8, z: 1.55, ry: Math.PI / 2, table: 0, col: C.sage },
    { x: 4.35, z: 0.62, ry: 0, table: 1, col: C.blue },
    { x: 5.3, z: 1.55, ry: -Math.PI / 2, table: 1, col: C.butter },
  ];
  const seats = seatDefs.map((s) => {
    const ch = chair(s.col);
    ch.position.set(s.x, 0, s.z);
    ch.rotation.y = s.ry;
    world.add(ch);
    colliders.push({ type: 'circle', x: s.x, z: s.z, r: 0.3 });
    const t = tables[s.table];
    const dir = new THREE.Vector3(t.x - s.x, 0, t.z - s.z).normalize();
    return {
      ...s,
      chair: ch,
      occupant: null,
      plateSpot: new THREE.Vector3(s.x + dir.x * 0.62, 0.95, s.z + dir.z * 0.62),
      aisle: new THREE.Vector3(s.x, 0, -0.45),
    };
  });

  // --- plants, sacks, baskets
  const deco = [
    [plant(1.1, C.pumpkin), 5.35, -4.35],
    [plant(0.8, C.blueDeep), -5.45, -4.45],
    [plant(1.0, C.pink), 5.35, 4.3],
    [plant(0.75, C.sage), 0.35, 4.45],
  ];
  for (const [p, x, z] of deco) {
    p.position.set(x, 0, z);
    world.add(p);
    p.add(blob(0.9, 0.9));
    colliders.push({ type: 'circle', x, z, r: 0.38 * p.scale.x });
  }
  const sacks = [
    [sack('FLOUR'), -5.35, 4.55, 0.3],
    [sack('SUGAR', '#F4E0BE'), -4.7, 4.55, -0.2],
    [sack('OATS', '#E6CC9C'), -5.4, 2.0, 1.2],
  ];
  for (const [s, x, z, ry] of sacks) {
    s.position.set(x, 0, z);
    s.rotation.y = ry;
    s.scale.setScalar(0.85);
    world.add(s);
    s.add(blob(0.9, 0.8));
    colliders.push({ type: 'circle', x, z, r: 0.33 });
  }

  // shadows everywhere (except ink hulls)
  world.traverse((m) => {
    if (m.isMesh && m.userData.outline) {
      m.castShadow = false;
      m.receiveShadow = false;
    }
  });

  return {
    world, stations, colliders, seats, tables, glows, bulbs, fpOnly,
    door: new THREE.Vector3(4.3, 0, -4.55),
    clockHands: [h1, h2],
  };
}
