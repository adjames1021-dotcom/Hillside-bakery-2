// Reusable cozy furniture, decor and flat canvas textures for the bakery.
import * as THREE from 'three';
import { G, C, INK, mk, toon, canvasTex, glow, blob, addFace } from './toon.js';

export const FONT = '"Fredoka", "Baloo 2", "Trebuchet MS", sans-serif';

// ------------------------------------------------------------------ textures

export function planksTex(light = false) {
  return canvasTex(512, 512, (ctx) => {
    const cols = light ? ['#F0CF9C', '#EBC792', '#F3D5A6', '#E8C28A'] : ['#E4B374', '#DEAA69', '#E8BA7C', '#DBA563'];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = cols[i];
      ctx.fillRect(0, i * 128, 512, 128);
      ctx.fillStyle = light ? '#CFA46A' : '#B98049';
      ctx.fillRect(0, i * 128, 512, 5);
      const j = [120, 340, 220, 40][i];
      ctx.fillRect(j, i * 128, 5, 128);
      ctx.fillStyle = 'rgba(255,243,220,0.3)';
      ctx.fillRect(0, i * 128 + 12, 512, 6);
      ctx.fillStyle = light ? 'rgba(160,110,60,0.18)' : 'rgba(140,85,40,0.2)';
      for (const x of [j - 16, j + 18]) {
        ctx.beginPath();
        ctx.arc(x, i * 128 + 64, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(150,95,50,0.12)';
      ctx.fillRect(0, i * 128 + 84, 512, 3);
    }
  }, [1, 1]);
}

export function wallpaperTex() {
  return canvasTex(256, 256, (ctx) => {
    ctx.fillStyle = C.wall;
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#F9DCC8';
    ctx.fillRect(0, 0, 44, 256);
    ctx.fillRect(128, 0, 44, 256);
    // tiny flowers
    const flower = (x, y, col) => {
      ctx.fillStyle = col;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#FFE08A';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    };
    flower(86, 40, '#F4C9B8');
    flower(214, 168, '#F4C9B8');
    flower(86, 168, '#CFE3D2');
    flower(214, 40, '#CFE3D2');
  }, [1, 1]);
}

export function wainscotTex() {
  return canvasTex(256, 128, (ctx) => {
    ctx.fillStyle = C.sage;
    ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = '#9CBD89';
    ctx.fillRect(0, 0, 6, 128);
    ctx.fillRect(128, 0, 6, 128);
    ctx.fillStyle = 'rgba(255,243,220,0.35)';
    ctx.fillRect(12, 0, 5, 128);
    ctx.fillRect(140, 0, 5, 128);
    ctx.strokeStyle = '#9CBD89';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 22, 80, 84);
    ctx.strokeRect(158, 22, 80, 84);
  }, [1, 1]);
}

export function stripesTex(colors, rx = 1, ry = 1, vertical = false) {
  return canvasTex(256, 256, (ctx) => {
    const n = colors.length;
    colors.forEach((c, i) => {
      ctx.fillStyle = c;
      if (vertical) ctx.fillRect((i * 256) / n, 0, 256 / n + 1, 256);
      else ctx.fillRect(0, (i * 256) / n, 256, 256 / n + 1);
    });
  }, [rx, ry]);
}

const ginghamCache = new Map();
export function ginghamTex(color, r = 4) {
  const key = color + r;
  if (ginghamCache.has(key)) return ginghamCache.get(key);
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
  ginghamCache.set(key, t);
  return t;
}

export function weaveTex(rx = 6, ry = 3) {
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
  }, [rx, ry]);
}

export function signTex(text, bg = C.honey, fg = C.cream2, w = 512, h = 160, size = 70) {
  return canvasTex(w, h, (ctx) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,243,220,0.25)';
    ctx.fillRect(0, h * 0.25, w, 8);
    ctx.fillRect(0, h * 0.7, w, 8);
    ctx.font = `700 ${size}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = INK;
    ctx.fillText(text, w / 2, h / 2 + 5);
    ctx.fillStyle = fg;
    ctx.fillText(text, w / 2 - 3, h / 2);
  });
}

export function menuTex() {
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

/** Little painted outdoor scene used on window panes. */
export function skyTex() {
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
  });
}

/** Wide hillside painting seen through the open windows (flat, no gradients). */
export function hillsideTex(seed = 1) {
  return canvasTex(1024, 400, (ctx) => {
    ctx.fillStyle = '#C3E5F3';
    ctx.fillRect(0, 0, 1024, 400);
    ctx.fillStyle = '#D5EEF7';
    ctx.fillRect(0, 150, 1024, 90);
    // sun
    ctx.fillStyle = '#FFF3C4';
    ctx.beginPath();
    ctx.arc(760 - seed * 300, 80, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFE08A';
    ctx.beginPath();
    ctx.arc(760 - seed * 300, 80, 32, 0, Math.PI * 2);
    ctx.fill();
    // clouds
    ctx.fillStyle = '#FFFBF0';
    const clouds = [[140, 70], [420, 110], [880, 60], [620, 150]];
    for (const [x, y] of clouds) {
      for (const [dx, dy, r] of [[0, 0, 26], [28, -8, 30], [58, 2, 22], [30, 12, 24]]) {
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // far hills
    ctx.fillStyle = '#B9D9A0';
    for (const [x, rx, ry] of [[120, 260, 120], [520, 320, 140], [920, 260, 120]]) {
      ctx.beginPath();
      ctx.ellipse(x, 330, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // houses on the far hill
    for (const [x, y, wall, roof] of [[300, 236, '#FFF3DC', '#E4605E'], [610, 222, '#F7B9C4', '#B97A43'], [820, 246, '#FFF3DC', '#86BADB']]) {
      ctx.fillStyle = wall;
      ctx.fillRect(x, y, 34, 26);
      ctx.fillStyle = roof;
      ctx.beginPath();
      ctx.moveTo(x - 6, y + 2);
      ctx.lineTo(x + 17, y - 18);
      ctx.lineTo(x + 40, y + 2);
      ctx.fill();
      ctx.fillStyle = '#86BADB';
      ctx.fillRect(x + 12, y + 8, 10, 10);
    }
    // near hills
    ctx.fillStyle = '#9CC585';
    for (const [x, rx, ry] of [[0, 360, 150], [700, 460, 170]]) {
      ctx.beginPath();
      ctx.ellipse(x, 410, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // round trees
    for (const [x, y, r] of [[200, 280, 26], [240, 292, 20], [560, 272, 30], [900, 285, 24], [940, 296, 18]]) {
      ctx.fillStyle = '#8B5E3C';
      ctx.fillRect(x - 4, y, 8, 26);
      ctx.fillStyle = '#7FB070';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#95C286';
      ctx.beginPath();
      ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // picket fence
    ctx.fillStyle = '#FFFBF0';
    ctx.fillRect(0, 352, 1024, 8);
    for (let x = 6; x < 1024; x += 28) {
      ctx.fillRect(x, 330, 14, 60);
      ctx.beginPath();
      ctx.moveTo(x, 330);
      ctx.lineTo(x + 7, 322);
      ctx.lineTo(x + 14, 330);
      ctx.fill();
    }
  });
}

// ------------------------------------------------------------------ props

export function scallopAwning(width, colors = [C.pink, C.cream2], depth = 0.7) {
  const g = new THREE.Group();
  const n = Math.round(width / 0.32);
  const sw = width / n;
  const board = new THREE.Group();
  board.rotation.x = 0.5;
  g.add(board);
  for (let i = 0; i < n; i++) {
    const col = colors[i % colors.length];
    const s = mk(G.box(sw, 0.06, depth, 0.02), col, { outline: 'thin' });
    s.position.set(-width / 2 + sw * (i + 0.5), 0, depth / 2);
    board.add(s);
    const sc = mk(G.cyl(sw / 2, sw / 2, 0.05, 0.02, 16), col, { outline: 'thin' });
    sc.rotation.x = Math.PI / 2;
    sc.position.set(-width / 2 + sw * (i + 0.5), -0.02, depth + 0.02);
    board.add(sc);
  }
  const bar = mk(G.box(width + 0.1, 0.1, 0.1, 0.04), C.honeyDark, { outline: 'thin' });
  bar.position.set(0, 0.02, 0.02);
  g.add(bar);
  return g;
}

export function plant(scale = 1, potColor = C.pumpkin) {
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
  g.add(blob(0.9, 0.9));
  return g;
}

export function breadLoaf(len = 0.34, col = C.bread) {
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

export function basket(w = 0.6, d = 0.4, withBread = true) {
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

export function jar(col, h = 0.34, lid = C.cherry) {
  const g = new THREE.Group();
  const body = mk(G.cyl(0.12, 0.12, h, 0.05, 18), '#E9F5FA', { outline: 'thin' });
  body.position.y = h / 2;
  g.add(body);
  const fill = mk(G.cyl(0.1, 0.1, h * 0.65, 0.04, 16), col, { outline: false });
  fill.position.y = h * 0.36;
  g.add(fill);
  const l = mk(G.cyl(0.13, 0.13, 0.07, 0.03, 18), lid, { outline: 'thin' });
  l.position.y = h + 0.02;
  g.add(l);
  return g;
}

export function counter(w, d, h, bodyCol, topCol = C.cream2) {
  const g = new THREE.Group();
  const body = mk(G.box(w, h - 0.1, d, 0.1), bodyCol);
  body.position.y = (h - 0.1) / 2;
  g.add(body);
  const top = mk(G.box(w + 0.1, 0.12, d + 0.08, 0.05), topCol);
  top.position.y = h - 0.06;
  g.add(top);
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
  const kick = mk(G.box(w - 0.04, 0.08, 0.04, 0.02), C.honeyDark, { outline: false, cast: false });
  kick.position.set(0, 0.04, d / 2 - 0.02);
  g.add(kick);
  const shadow = blob(w + 0.4, d + 0.4);
  shadow.position.z = 0.1;
  g.add(shadow);
  return g;
}

export function chair(color) {
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

export function cafeTable(clothColor) {
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

export function sconce() {
  const g = new THREE.Group();
  g.add(mk(G.box(0.2, 0.34, 0.06, 0.03), C.honeyDark, { outline: 'thin' }));
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

/** Hanging dome lamp for the ceiling (first-person only). */
export function pendant(drop, shadeCol) {
  const g = new THREE.Group();
  const cord = mk(G.cyl(0.012, 0.012, drop, 0.004, 6), INK, { outline: false, cast: false });
  cord.position.y = -drop / 2;
  g.add(cord);
  const pts = [[0.001, 0.2], [0.06, 0.2], [0.07, 0.17], [0.16, 0.07], [0.24, 0.0], [0.23, -0.02], [0.14, 0.04], [0.001, 0.08]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const shade = mk(G.lathe(pts, 24), shadeCol, { outline: 'mid', cast: false });
  shade.position.y = -drop - 0.18;
  g.add(shade);
  const bulb = mk(G.sphere(0.07, 12, 8), '#FFF3C4', { outline: false, emissive: '#FFE3A0', emissiveIntensity: 1, cast: false });
  bulb.position.y = -drop - 0.2;
  g.add(bulb);
  const gl = glow('#FFD58A', 1.6, 0.55);
  gl.position.y = -drop - 0.26;
  g.add(gl);
  return { group: g, glow: gl, bulbY: -drop - 0.24 };
}

export function frame(w, h, picture) {
  const g = new THREE.Group();
  g.add(mk(G.box(w, h, 0.06, 0.03), C.honey, { outline: 'mid' }));
  const art = new THREE.Mesh(G.plane(w - 0.12, h - 0.12), toon('#fff', { map: picture }));
  art.position.z = 0.032;
  g.add(art);
  return g;
}

export function catPortrait() {
  return canvasTex(128, 160, (ctx) => {
    ctx.fillStyle = C.blue;
    ctx.fillRect(0, 0, 128, 160);
    ctx.fillStyle = '#F6C489';
    ctx.beginPath();
    ctx.arc(64, 84, 40, 0, Math.PI * 2);
    ctx.fill();
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(64 + s * 16, 52);
      ctx.lineTo(64 + s * 38, 30);
      ctx.lineTo(64 + s * 38, 64);
      ctx.fill();
    }
    ctx.fillStyle = INK;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(64 + s * 14, 84, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = C.pinkDeep;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(64 + s * 24, 96, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(64, 94, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();
  });
}

export function cakePoster() {
  return canvasTex(160, 128, (ctx) => {
    ctx.fillStyle = C.pink;
    ctx.fillRect(0, 0, 160, 128);
    ctx.fillStyle = '#FFF6E6';
    ctx.fillRect(40, 60, 80, 44);
    ctx.fillStyle = '#B8323F';
    ctx.fillRect(40, 72, 80, 10);
    ctx.fillRect(40, 90, 80, 10);
    ctx.fillStyle = '#FFF6E6';
    ctx.beginPath();
    ctx.ellipse(80, 60, 40, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.cherry;
    ctx.beginPath();
    ctx.arc(80, 44, 9, 0, Math.PI * 2);
    ctx.fill();
  });
}

export { addFace };
