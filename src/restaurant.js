// Lantern Cliff: a fine-dining restaurant on a sea cliff at sunset. An open
// kitchen (navy, marble and copper) runs along the back and left walls; the
// pass, a marble counter under heat lamps, separates it from a dining room
// whose glass walls look out over the sea, a lighthouse and passing sailboats.
// Waiters carry orders to the pass and plates to the tables (see main.js).
import * as THREE from 'three';
import { G, C, INK, mk, toon, glow, blob, worldUV, canvasTex } from './toon.js';
import { signTex, plant, counter, sconce, pendant, frame } from './props.js';
import { label } from './ingredients.js';
import { buildHighlight, mergeStatic } from './merge.js';
import {
  ROOM, FP_LAYER, stationStyle, buildMixer, buildStove, buildOven, buildFreezer, buildDecor, buildScrap, buildIsland,
  buildDryShelf, buildColdStorage, wallPiece, put, dyn, setLayer, V3,
} from './world.js';

const NAVY = '#3E5C76', NAVY_DEEP = '#2E4258', BRASS = '#D9A441', MARBLE = '#F4F1EA', COPPER = '#C8764A', WALNUT = '#7A4E32';

// ------------------------------------------------------------------ textures

function marbleTex() {
  return canvasTex(512, 512, (c) => {
    c.fillStyle = MARBLE;
    c.fillRect(0, 0, 512, 512);
    c.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      c.strokeStyle = i % 3 ? 'rgba(170,165,175,0.35)' : 'rgba(205,170,120,0.35)';
      c.lineWidth = 1 + (i % 3);
      c.beginPath();
      const y = (i * 61) % 512;
      c.moveTo(-20, y);
      c.bezierCurveTo(140, y + 60, 300, y - 50, 540, y + 30);
      c.stroke();
    }
  }, [1, 1]);
}
function tileTex() {
  return canvasTex(256, 256, (c) => {
    c.fillStyle = '#D9D3C6';
    c.fillRect(0, 0, 256, 256);
    for (let row = 0; row < 8; row++) {
      for (let col = -1; col < 5; col++) {
        const x = col * 64 + (row % 2 ? 32 : 0), y = row * 32;
        c.fillStyle = '#F6F3EC';
        c.fillRect(x + 2, y + 2, 60, 28);
        c.fillStyle = 'rgba(255,255,255,0.7)';
        c.fillRect(x + 6, y + 5, 30, 4);
      }
    }
  }, [1, 1]);
}
function checkerTex() {
  return canvasTex(256, 256, (c) => {
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      c.fillStyle = (i + j) % 2 ? '#41607A' : '#ECE6D6';
      c.fillRect(i * 64, j * 64, 64, 64);
      c.fillStyle = (i + j) % 2 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.4)';
      c.fillRect(i * 64 + 6, j * 64 + 6, 52, 8);
    }
  }, [1, 1]);
}
function walnutTex() {
  return canvasTex(512, 512, (c) => {
    const cols = ['#8A5A3A', '#80523A', '#93613F', '#7A4C33'];
    for (let i = 0; i < 4; i++) {
      c.fillStyle = cols[i];
      c.fillRect(0, i * 128, 512, 128);
      c.fillStyle = '#5E3A26';
      c.fillRect(0, i * 128, 512, 4);
      const j = [90, 300, 180, 420][i];
      c.fillRect(j, i * 128, 4, 128);
      c.fillStyle = 'rgba(255,220,180,0.12)';
      c.fillRect(0, i * 128 + 14, 512, 6);
    }
  }, [1, 1]);
}
function navyPaperTex() {
  return canvasTex(256, 256, (c) => {
    c.fillStyle = '#34506A';
    c.fillRect(0, 0, 256, 256);
    c.fillStyle = 'rgba(217,164,65,0.55)';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const x = i * 64 + (j % 2 ? 32 : 0), y = j * 64 + 32;
      c.beginPath();
      c.moveTo(x, y - 9);
      c.lineTo(x + 6, y);
      c.lineTo(x, y + 9);
      c.lineTo(x - 6, y);
      c.closePath();
      c.fill();
    }
    c.strokeStyle = 'rgba(217,164,65,0.18)';
    c.lineWidth = 2;
    for (let i = 0; i <= 4; i++) {
      c.beginPath();
      c.moveTo(i * 64, 0);
      c.lineTo(i * 64, 256);
      c.stroke();
    }
  }, [1, 1]);
}

// A sunset all the way round: deep blue overhead, coral and gold at the horizon,
// a big low sun out over the sea, soft clouds and a few early stars.
function sunsetTex(sunU) {
  return canvasTex(2048, 512, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#4E5C9A');
    gr.addColorStop(0.35, '#8E7AB6');
    gr.addColorStop(0.62, '#E9919A');
    gr.addColorStop(0.82, '#FBB57E');
    gr.addColorStop(1, '#FFD9A0');
    c.fillStyle = gr;
    c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 40; i++) {
      c.beginPath();
      c.arc((i * 523) % w, ((i * 97) % 120) + 8, 1.5 + (i % 3) * 0.6, 0, Math.PI * 2);
      c.fill();
    }
    const sx = sunU * w;
    const halo = c.createRadialGradient(sx, h - 70, 10, sx, h - 70, 260);
    halo.addColorStop(0, 'rgba(255,236,170,0.95)');
    halo.addColorStop(0.3, 'rgba(255,200,140,0.5)');
    halo.addColorStop(1, 'rgba(255,190,150,0)');
    c.fillStyle = halo;
    c.fillRect(sx - 300, h - 380, 600, 380);
    c.fillStyle = '#FFE9A8';
    c.beginPath();
    c.arc(sx, h - 62, 46, 0, Math.PI * 2);
    c.fill();
    // long soft clouds, lit pink underneath
    for (const [x, y, len] of [[0.1, 300, 260], [0.32, 250, 340], [0.55, 320, 220], [0.78, 270, 300], [0.95, 330, 200], [sunU + 0.06, 380, 180]]) {
      const cx = ((x % 1) + 1) % 1 * w;
      c.fillStyle = 'rgba(255,214,200,0.75)';
      c.beginPath();
      c.ellipse(cx, y, len, 16, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = 'rgba(244,150,150,0.55)';
      c.beginPath();
      c.ellipse(cx + 20, y + 9, len * 0.8, 7, 0, 0, Math.PI * 2);
      c.fill();
    }
  });
}

function seaTex() {
  return canvasTex(1024, 1024, (c, w, h) => {
    const gr = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, '#3E8FB0');
    gr.addColorStop(0.45, '#5A9CC0');
    gr.addColorStop(0.8, '#8A9EC8');
    gr.addColorStop(1, '#C9A6C0');
    c.fillStyle = gr;
    c.fillRect(0, 0, w, h);
    // little wave glints
    c.strokeStyle = 'rgba(255,240,220,0.35)';
    c.lineWidth = 2;
    for (let i = 0; i < 520; i++) {
      const a = i * 2.39996, d = Math.sqrt((i + 0.5) / 520) * w * 0.48;
      const x = w / 2 + Math.cos(a) * d, y = h / 2 + Math.sin(a) * d;
      c.beginPath();
      c.moveTo(x - 5, y);
      c.lineTo(x + 5, y);
      c.stroke();
    }
  });
}

// ------------------------------------------------------------------ furniture

function fancyChair(col) {
  const g = new THREE.Group();
  put(g, mk(G.box(0.48, 0.1, 0.46, 0.045), WALNUT), 0, 0.36, 0);
  const cushion = put(g, mk(G.box(0.44, 0.08, 0.42, 0.04), col, { outline: 'thin' }), 0, 0.43, 0);
  cushion.scale.y = 1;
  for (const [x, z] of [[-0.18, -0.16], [0.18, -0.16], [-0.18, 0.16], [0.18, 0.16]]) {
    const leg = put(g, mk(G.cyl(0.035, 0.028, 0.32, 0.012, 10), WALNUT, { outline: 'mid' }), x, 0.16, z);
    leg.rotation.x = z > 0 ? 0.06 : -0.06;
  }
  // a tall upholstered back with brass studs
  put(g, mk(G.box(0.46, 0.56, 0.08, 0.06), col), 0, 0.72, -0.2);
  put(g, mk(G.box(0.5, 0.06, 0.1, 0.03), WALNUT, { outline: 'thin' }), 0, 1.0, -0.2);
  for (let i = 0; i < 5; i++) put(g, mk(G.sphere(0.012, 6, 4), BRASS, { outline: false }), -0.16 + i * 0.08, 0.98, -0.15);
  g.add(blob(0.8, 0.8));
  return g;
}

function diningTable() {
  const g = new THREE.Group();
  // a white tablecloth falling in soft folds to the floor
  const cloth = new THREE.LatheGeometry([
    new THREE.Vector2(0.0005, 0.63), new THREE.Vector2(0.6, 0.63), new THREE.Vector2(0.63, 0.615),
    new THREE.Vector2(0.66, 0.4), new THREE.Vector2(0.7, 0.05), new THREE.Vector2(0.71, 0.0), new THREE.Vector2(0.0005, 0.0),
  ].reverse(), 56);
  const p = cloth.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), y = p.getY(i);
    const k = 1 + (y < 0.6 ? 0.035 * (1 - y / 0.6) * Math.cos(14 * Math.atan2(z, x)) : 0);
    p.setX(i, x * k);
    p.setZ(i, z * k);
  }
  cloth.computeVertexNormals();
  put(g, mk(cloth, '#FFFDF8', { outline: 'mid' }));
  // a navy runner and a little brass lamp
  put(g, mk(G.box(0.24, 0.006, 1.24, 0.003), NAVY, { outline: false }), 0, 0.636, 0);
  put(g, mk(G.cyl(0.035, 0.05, 0.03, 0.01, 14), BRASS, { outline: 'thin' }), 0, 0.65, 0);
  put(g, mk(G.cyl(0.012, 0.012, 0.12, 0.004, 8), BRASS, { outline: false }), 0, 0.72, 0);
  const shade = put(g, mk(G.cyl(0.035, 0.06, 0.07, 0.01, 16), '#FFF3DC', { outline: 'thin', emissive: '#FFD9A0', emissiveIntensity: 0.6 }), 0, 0.8, 0);
  shade.userData.noHighlight = true;
  // salt, pepper and folded napkins at each place
  for (const [x, col] of [[0.07, '#FFFFFF'], [-0.07, '#4B3A30']]) put(g, mk(G.capsule(0.014, 0.03), col, { outline: 'thin' }), x, 0.67, 0.08);
  for (const sz of [-1, 1]) {
    const nap = put(g, mk(G.box(0.1, 0.03, 0.08, 0.012), '#F7B9C4', { outline: 'thin' }), 0.25, 0.65, sz * 0.38);
    nap.rotation.y = 0.2 * sz;
    for (const sx of [-1, 1]) put(g, mk(G.box(0.012, 0.004, 0.13, 0.002), '#DCE6EA', { outline: 'thin' }), sx * 0.22 + (sx < 0 ? 0 : 0.0), 0.638, sz * 0.4);
  }
  g.add(blob(1.7, 1.7));
  return g;
}

function lighthouse() {
  const g = new THREE.Group();
  put(g, mk(lumpyRock(3.2, 2), '#8A6A6A', { outline: 'mid' }), 0, 0.4, 0).scale.set(1.2, 0.5, 1);
  put(g, mk(G.cyl(0.55, 0.85, 5.2, 0.1, 24), '#FFF6EC', { outline: 'mid' }), 0, 3.4, 0);
  for (const [y, r] of [[1.6, 0.8], [3.2, 0.71], [4.8, 0.62]]) put(g, mk(G.cyl(r, r + 0.03, 0.55, 0.05, 24), '#D8404E', { outline: 'thin' }), 0, y + 0.1, 0);
  put(g, mk(G.cyl(0.8, 0.8, 0.14, 0.04, 24), INK, { outline: 'thin' }), 0, 6.05, 0);
  const lamp = put(g, mk(G.cyl(0.42, 0.42, 0.6, 0.06, 16), '#FFE9A8', { outline: 'thin', emissive: '#FFD27A', emissiveIntensity: 1 }), 0, 6.45, 0);
  lamp.userData.noHighlight = true;
  put(g, mk(G.cyl(0.05, 0.6, 0.45, 0.04, 16), '#D8404E', { outline: 'thin' }), 0, 6.98, 0);
  const gl = glow('#FFE3A0', 5, 0.75);
  put(g, gl, 0, 6.45, 0);
  return { group: g, glow: gl };
}

function sailboat(sail = '#FFFBF0') {
  const g = new THREE.Group();
  const hull = put(g, mk(G.box(2.4, 0.5, 0.8, 0.25), '#FFFBF0', { outline: 'mid' }), 0, 0.2, 0);
  hull.scale.set(1, 1, 1);
  put(g, mk(G.box(2.45, 0.12, 0.82, 0.06), '#D8404E', { outline: 'thin' }), 0, 0.02, 0);
  put(g, mk(G.cyl(0.05, 0.05, 3.2, 0.02, 8), WALNUT, { outline: 'thin' }), 0.1, 1.9, 0);
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(1.3, 0);
  s.lineTo(0, 2.8);
  const sg = new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: false });
  put(g, mk(sg, sail, { outline: 'thin' }), 0.16, 0.5, 0);
  const s2 = new THREE.Shape();
  s2.moveTo(0, 0);
  s2.lineTo(-0.9, 0);
  s2.lineTo(0, 2.2);
  put(g, mk(new THREE.ExtrudeGeometry(s2, { depth: 0.03, bevelEnabled: false }), '#F7B9C4', { outline: 'thin' }), 0.04, 0.5, 0);
  return g;
}

const rockCache = new Map();
function lumpyRock(r, seed) {
  const key = `${r},${seed}`;
  if (!rockCache.has(key)) {
    const g = new THREE.IcosahedronGeometry(r, 2);
    const p = g.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      v.multiplyScalar(1 + 0.12 * Math.sin(v.x * 2.1 / r * 3 + seed) + 0.1 * Math.cos(v.z * 2.7 / r * 3 + seed * 2) + 0.06 * Math.sin(v.y * 3.3 / r * 3));
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    rockCache.set(key, g);
  }
  return rockCache.get(key);
}

// ------------------------------------------------------------------ the restaurant

export function buildRestaurant(scene) {
  stationStyle({
    counterTop: MARBLE, mixCounter: NAVY, mixerShell: '#C8384A', cookCounter: NAVY, rangeTop: '#2E2A30', pot: COPPER,
    ovenShell: NAVY, ovenDoor: NAVY_DEEP, freezer: '#C9D4D9', freezerDeep: '#8FA0A8', decorCounter: NAVY,
    cold: '#C9D4D9', coldDeep: '#7F949E', islandBody: NAVY, islandDeep: NAVY_DEEP,
    islandTop: () => toon('#fff', { map: marbleTex() }), board: '#D9A86A',
  });
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

  // --- the cliff the restaurant sits on, and a ring of sea around it (the title diorama)
  put(world, mk(G.box(12.7, 0.55, 10.7, 0.22), '#E9D3B0'), 0, -0.36, 0);
  const cliffCols = ['#D9A47A', '#C98A62', '#E2B086', '#B97A56'];
  put(world, mk(G.box(12.9, 1.3, 10.9, 0.3), cliffCols[0], { cast: false }), 0, -1.25, 0);
  put(world, mk(G.box(12.4, 1.4, 10.4, 0.3), cliffCols[1], { cast: false }), 0.1, -2.5, -0.05);
  // rocky ledges and boulders along the cliff face
  for (let i = 0; i < 34; i++) {
    const a = (i / 34) * Math.PI * 2;
    const rx = Math.cos(a), rz = Math.sin(a);
    const k = 1 / Math.max(Math.abs(rx) / 6.35, Math.abs(rz) / 5.35);
    const rock = put(world, mk(lumpyRock(0.45 + (i % 3) * 0.16, i), cliffCols[i % 4], { outline: 'mid', cast: false }), rx * k, -1.0 - (i % 3) * 0.75, rz * k);
    rock.scale.set(1.5, 0.7 + (i % 4) * 0.12, 1.2);
    rock.rotation.y = -a;
  }
  for (const y of [-1.85, -2.75]) {
    const ledge = put(world, mk(G.box(13.0 - (y < -2 ? 0.3 : 0), 0.12, 11.0 - (y < -2 ? 0.3 : 0), 0.05), '#B97A56', { outline: 'thin', cast: false }), 0.05, y, 0);
    ledge.userData.noHighlight = true;
  }
  const SEA_Y = -3.2;
  const sea = new THREE.Mesh(new THREE.CircleGeometry(16, 64), toon('#5FB0D8', { unique: true }));
  sea.rotation.x = -Math.PI / 2;
  sea.receiveShadow = true;
  put(world, sea, 0, SEA_Y, 0);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const k = 1 / Math.max(Math.abs(Math.cos(a)) / 7.2, Math.abs(Math.sin(a)) / 6.2);
    const foam = put(world, mk(G.sphere(0.55, 12, 8), '#FFFBF0', { outline: 'thin', cast: false }), Math.cos(a) * k, SEA_Y + 0.02, Math.sin(a) * k);
    foam.scale.set(1.6, 0.18, 1);
    foam.rotation.y = -a;
  }
  for (const [x, z, s] of [[-9.5, 7.5, 1.2], [9.8, -6.5, 0.9], [-10.5, -4, 0.8]]) put(world, mk(lumpyRock(s, x), '#B97A56', { outline: 'mid' }), x, SEA_Y + 0.2, z).scale.y = 0.7;
  const boatD = put(world, sailboat(), -9.0, SEA_Y + 0.05, 9.5);
  boatD.scale.setScalar(0.55);
  boatD.rotation.y = 0.6;

  // --- floors: checkered tiles in the kitchen, walnut planks in the dining room
  const kFloor = put(world, mk(G.box(6.0, 0.14, 10, 0.05), toon('#fff', { map: checkerTex() }), { outline: 'mid', cast: false }), -3.0, -0.07, 0);
  worldUV(kFloor, 'xz', 1.6);
  const dFloor = put(world, mk(G.box(6.0, 0.14, 10, 0.05), toon('#fff', { map: walnutTex() }), { outline: 'mid', cast: false }), 3.0, -0.069, 0);
  worldUV(dFloor, 'xz', 2.4);

  // --- back and left walls: subway tile in the kitchen, navy and gold in the dining room
  const tiles = toon('#fff', { map: tileTex() });
  const navyPaper = toon('#fff', { map: navyPaperTex() });
  world.add(wallPiece(0.3, H + 0.1, 10.3, -6.15, H / 2 - 0.05, -0.15, tiles, 'zy', 1.0));
  world.add(wallPiece(6.15, H + 0.1, 0.3, -3.075, H / 2 - 0.05, -5.15, tiles, 'xy', 1.0));
  world.add(wallPiece(6.15, H + 0.1, 0.3, 3.075, H / 2 - 0.05, -5.15, navyPaper, 'xy', 1.2));
  const wains = toon('#fff', { map: walnutTex() });
  world.add(wallPiece(5.9, 1.0, 0.06, 3.05, 0.5, -4.97, wains, 'xy', [1.6, 1.0]));
  put(world, mk(G.box(5.95, 0.07, 0.1, 0.03), BRASS, { outline: 'thin' }), 3.05, 1.02, -4.93);
  put(world, mk(G.box(0.42, 0.18, 10.45, 0.06), WALNUT), -6.15, H + 0.02, -0.15);
  put(world, mk(G.box(12.45, 0.18, 0.42, 0.06), WALNUT), -0.15, H + 0.02, -5.15);
  // a steel range hood over the stove
  const hood = put(world, new THREE.Group(), -2.9, 0, -4.75);
  put(hood, mk(G.box(1.6, 0.5, 0.75, 0.06), '#C9D4D9'), 0, 2.35, 0.1);
  put(hood, mk(G.box(0.7, 1.0, 0.5, 0.05), '#C9D4D9'), 0, 3.1, -0.05);
  put(hood, mk(G.box(1.62, 0.06, 0.77, 0.03), BRASS, { outline: 'thin' }), 0, 2.12, 0.1);

  // --- front and right walls (baker's eyes only): tile in the kitchen, glass over the sea
  fp.add(wallPiece(6.3, H + 0.1, 0.3, -3.0, H / 2 - 0.05, 5.15, tiles, 'xy', 1.0));
  const glassMat = toon('#E6F4FA', { transparent: true, opacity: 0.1, unique: true });
  const frameCol = '#5E4A3A';
  const glassWall = (len, along) => {
    const g = new THREE.Group();
    const n = Math.round(len / 1.45);
    for (let i = 0; i <= n; i++) put(g, mk(G.box(0.1, H + 0.1, 0.14, 0.03), frameCol, { outline: 'thin' }), -len / 2 + (len / n) * i, H / 2 - 0.05, 0);
    for (const y of [0.04, 2.7, H]) put(g, mk(G.box(len, 0.1, 0.16, 0.03), frameCol, { outline: 'thin' }), 0, y, 0);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(len, H), glassMat);
    pane.position.y = H / 2;
    pane.userData.noHighlight = true;
    g.add(pane);
    for (let i = 0; i < n; i++) {
      const sheen = new THREE.Mesh(G.plane(0.12, 1.1), toon('#FFFFFF', { transparent: true, opacity: 0.08 }));
      sheen.rotation.z = 0.4;
      put(g, sheen, -len / 2 + (len / n) * (i + 0.3), 1.6, 0.01);
    }
    if (along === 'x') g.rotation.y = Math.PI;
    return g;
  };
  put(fp, glassWall(6.2, 'x'), 3.05, 0, 5.15);
  const rightGlass = put(fp, glassWall(10.3, 'z'), 6.15, 0, -0.15);
  rightGlass.rotation.y = -Math.PI / 2;
  // ceiling: dark coffered wood with beams
  const ceil = put(fp, mk(G.box(12.6, 0.2, 10.6, 0.05), toon('#fff', { map: walnutTex() }), { cast: false, outline: false }), 0, H + 0.1, 0);
  worldUV(ceil, 'xz', 2.4);
  for (const x of [-4.5, -1.5, 1.5, 4.5]) put(fp, mk(G.box(0.24, 0.22, 10.2, 0.05), '#5E3A26', { cast: false }), x, H - 0.1, 0);

  // --- outside: sunset sky, the sea to the horizon, a lighthouse and sailboats (baker's eyes)
  const sunDir = new THREE.Vector3(1, 0, 0.55).normalize();
  const sunU = (Math.atan2(sunDir.x, sunDir.z) / (Math.PI * 2) + 1) % 1;
  const sky = new THREE.Mesh(new THREE.CylinderGeometry(70, 70, 64, 48, 1, true), new THREE.MeshBasicMaterial({ map: sunsetTex(1 - sunU), side: THREE.BackSide, fog: false }));
  put(fp, sky, 0, SEA_Y + 31.9, 0);
  const seaFar = new THREE.Mesh(new THREE.RingGeometry(16, 72, 64, 1), new THREE.MeshBasicMaterial({ map: seaTex() }));
  // map the ring's uvs across the whole disc so the gradient runs out to the horizon
  {
    const pos = seaFar.geometry.attributes.position, uv = seaFar.geometry.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, 0.5 + pos.getX(i) / 144, 0.5 + pos.getY(i) / 144);
  }
  seaFar.rotation.x = -Math.PI / 2;
  put(fp, seaFar, 0, SEA_Y, 0);
  // the sun's golden path across the water
  const path = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 52), new THREE.MeshBasicMaterial({
    map: canvasTex(64, 512, (c, w, h) => {
      for (let i = 0; i < 120; i++) {
        c.fillStyle = `rgba(255,${200 + (i % 4) * 12},140,${0.25 + (i % 5) * 0.12})`;
        const y = (i * 37) % h, ww = 6 + (i % 7) * 4;
        c.fillRect(w / 2 - ww / 2 + Math.sin(i) * 10, y, ww, 3);
      }
    }), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  path.rotation.x = -Math.PI / 2;
  path.rotation.z = -Math.atan2(sunDir.x, sunDir.z) + Math.PI;
  put(fp, path, sunDir.x * 42, SEA_Y + 0.02, sunDir.z * 42);
  for (const [x, z, s, col] of [[-30, 52, 6, '#8A6A8A'], [40, 48, 8, '#7A6A9A'], [58, 10, 7, '#8A7AA8'], [52, -30, 9, '#7A6A9A'], [-8, 62, 5, '#9A7A9A']]) {
    const isle = put(fp, new THREE.Mesh(lumpyRock(s, x), new THREE.MeshBasicMaterial({ color: col })), x, SEA_Y - s * 0.55, z);
    isle.scale.set(1.8, 0.7, 1.2);
  }
  const lh = lighthouse();
  put(fp, lh.group, 24, SEA_Y, 30);
  glows.push(lh.glow);
  for (const [x, z, ry, s] of [[16, 22, 0.4, 0.8], [34, 8, -0.8, 1], [12, 40, 1.2, 0.7]]) {
    const b = put(fp, sailboat(s > 0.9 ? '#FFFBF0' : '#FFE9A8'), x, SEA_Y + 0.05, z);
    b.rotation.y = ry;
    b.scale.setScalar(s);
  }
  // lanterns on posts along the cliff edge outside the glass
  for (const [x, z] of [[7.0, -3.5], [7.0, 0], [7.0, 3.5], [3.0, 6.0], [0.4, 6.0]]) {
    put(fp, mk(G.cyl(0.04, 0.05, 1.6, 0.02, 8), INK, { outline: 'thin' }), x, 0.8, z);
    const l = put(fp, mk(G.box(0.18, 0.24, 0.18, 0.05), '#FFE3A0', { outline: 'thin', emissive: '#FFC870', emissiveIntensity: 1 }), x, 1.72, z);
    l.userData.noHighlight = true;
    const gl = glow('#FFC870', 0.9, 0.6);
    put(fp, gl, x, 1.72, z);
    glows.push(gl);
  }
  put(fp, mk(G.box(0.8, 0.14, 12.5, 0.06), '#D9A47A', { cast: false }), 6.75, -0.07, 0);
  put(fp, mk(G.box(7.2, 0.14, 0.8, 0.06), '#D9A47A', { cast: false }), 2.9, -0.07, 5.75);

  // --- kitchen stations
  const stations = {};
  const regStation = (id, type, name, built, extra = {}) => {
    const st = { id, type, name, group: built.group, hero: built.hero, face: built.face, built, item: null, t: 0, bounce: 0, blinkT: Math.random() * 3, ...extra };
    stations[id] = st;
    return st;
  };
  const onLeft = (g, z, x = -5.45) => { g.position.set(x, 0, z); g.rotation.y = Math.PI / 2; world.add(g); return g; };
  const onBack = (g, x, z = -4.52) => { g.position.set(x, 0, z); world.add(g); return g; };

  const oven = buildOven();
  onBack(oven.group, -4.6, -4.47);
  regStation('bake', 'bake', 'Hearth Oven', oven);
  const stove = buildStove();
  onBack(stove.group, -2.9);
  regStation('cook', 'cook', 'Range', stove);
  const decor = buildDecor();
  onBack(decor.group, -1.1);
  regStation('decor', 'decor', 'Plating Station', decor);
  const mixer = buildMixer();
  onLeft(mixer.group, -2.3);
  regStation('mix', 'mix', 'Mixer', mixer);
  const freezer = buildFreezer();
  onLeft(freezer.group, -0.55, -5.48);
  regStation('chill', 'chill', 'Chiller', freezer);
  const scrap = buildScrap();
  scrap.group.position.set(-0.75, 0, 4.4);
  world.add(scrap.group);
  regStation('scrap', 'scrap', 'Scrap Bin', scrap);

  const island = buildIsland();
  island.group.position.set(-2.75, 0, 0.75);
  world.add(island.group);
  worldUV(island.top, 'xz', 1.2);
  const prepSt = regStation('prep', 'prep', 'Prep Counter', { group: island.board, hero: island.props, props: island.props, slotLocal: island.slotLocal, sideLocal: island.sideLocal, sideLocalB: island.sideLocalB });
  prepSt.tools = island.tools;
  const spots = island.spots.map((s, i) => regStation(`spot${i + 1}`, 'spot', 'Counter Spot', { group: s.group, hero: null, slotLocal: s.slotLocal }));

  // copper pans hanging over the prep counter (baker's eyes)
  const rack = put(fp, new THREE.Group(), -2.75, H - 0.75, 0.75);
  put(rack, mk(G.box(0.08, 0.06, 2.0, 0.02), INK, { outline: 'thin' }), 0, 0, 0);
  for (const z of [-0.8, 0.8]) put(rack, mk(G.cyl(0.012, 0.012, 0.7, 0.004, 6), INK, { outline: false }), 0, 0.35, z);
  for (let i = 0; i < 5; i++) {
    const pan = put(rack, new THREE.Group(), 0, -0.25, -0.75 + i * 0.37);
    put(pan, mk(G.cyl(0.006, 0.006, 0.2, 0.002, 6), '#5E3A26', { outline: false }), 0, 0.12, 0);
    const body = put(pan, mk(G.cyl(0.13 - (i % 2) * 0.03, 0.11 - (i % 2) * 0.03, 0.08, 0.02, 20), COPPER), 0, -0.04, 0);
    body.rotation.x = Math.PI / 2;
    body.rotation.z = 0.15 * (i % 2 ? 1 : -1);
  }

  // --- pantry and cold room
  const ingredientItems = [];
  const dry = buildDryShelf(ingredientItems, [
    { y: 1.515, ids: ['garlic', 'olive-oil', 'basil', 'chocolate', 'onions'] },
    { y: 0.815, ids: ['pasta', 'rice', 'mushrooms', 'tomatoes', 'lemons'] },
    { y: 0.115, ids: ['flour', 'sugar', 'bread', 'potatoes', null] },
  ], { side: WALNUT, back: NAVY, cubby: '#A8744A', crown: [NAVY, MARBLE], sign: NAVY_DEEP });
  dry.position.set(-5.72, 0, 2.75);
  dry.rotation.y = Math.PI / 2;
  world.add(dry);
  const cold = buildColdStorage(ingredientItems, [
    { y: 1.42, ids: ['cream', 'raspberries', 'parmesan', 'mozzarella'] },
    { y: 0.86, ids: ['butter', 'eggs', 'shrimp', null] },
    { y: 0.3, ids: ['salmon', 'steak', 'chicken', null] },
  ]);
  cold.group.position.set(-3.0, 0, 4.6);
  cold.group.rotation.y = Math.PI;
  fp.add(cold.group);

  // --- the pass: a marble counter under heat lamps between kitchen and dining room
  const PASS_Z0 = -3.1, PASS_Z1 = 0.1, PASS_H = 1.02;
  const pass = put(world, new THREE.Group(), 0, 0, (PASS_Z0 + PASS_Z1) / 2);
  const passLen = PASS_Z1 - PASS_Z0;
  put(pass, mk(G.box(0.56, PASS_H - 0.08, passLen - 0.06, 0.06), NAVY), 0, (PASS_H - 0.08) / 2, 0);
  put(pass, mk(G.box(0.66, 0.08, passLen, 0.03), toon('#fff', { map: marbleTex() })), 0, PASS_H - 0.04, 0);
  for (const sx of [-1, 1]) put(pass, mk(G.box(0.03, 0.03, passLen - 0.1, 0.012), BRASS, { outline: 'thin' }), sx * 0.3, 0.3, 0);
  // the heat-lamp gantry
  for (const z of [-passLen / 2 + 0.12, passLen / 2 - 0.12]) put(pass, mk(G.cyl(0.025, 0.025, 1.0, 0.01, 8), BRASS, { outline: 'thin' }), 0, PASS_H + 0.5, z);
  put(pass, mk(G.box(0.3, 0.08, passLen - 0.1, 0.03), INK), 0, PASS_H + 1.02, 0);
  put(pass, mk(G.box(0.08, 0.32, 1.25, 0.03), NAVY_DEEP, { outline: 'mid' }), 0.0, PASS_H + 1.3, 0);
  for (const sx of [-1, 1]) {
    const sg = put(pass, label('sign-pass', 1.1), sx * 0.045, PASS_H + 1.3, 0);
    sg.rotation.y = sx * Math.PI / 2;
  }
  addCollider(pass);
  const passes = [];
  [-2.55, -1.5, -0.45].forEach((z, i) => {
    const slot = put(world, new THREE.Group(), 0, PASS_H, z);
    put(slot, mk(G.cyl(0.24, 0.24, 0.012, 0.004, 32), '#C9D4D9', { outline: 'thin' }), 0, 0.006, 0);
    const lampHead = put(world, mk(G.cyl(0.08, 0.13, 0.12, 0.02, 16), '#2E2A30', { outline: 'thin' }), 0, PASS_H + 0.92, z);
    lampHead.userData.noHighlight = true;
    const bulb = put(world, mk(G.sphere(0.05, 10, 8), '#FF9A6A', { outline: false, emissive: '#FF7A4A', emissiveIntensity: 1 }), 0, PASS_H + 0.86, z);
    bulb.userData.noHighlight = true;
    const gl = glow('#FF8A50', 0.9, 0.45);
    put(world, gl, 0, PASS_H + 0.82, z);
    glows.push(gl);
    const st = regStation(`pass${i + 1}`, 'pass', 'The Pass', { group: slot, hero: null, slotLocal: V3(0, 0.013, 0) });
    st.pickup = V3(0.72, 0, z);
    passes.push(st);
  });
  // half walls with planters close off the rest of the kitchen, leaving a gap to walk through
  const halfWall = (z0, z1) => {
    const g = put(world, new THREE.Group(), 0, 0, (z0 + z1) / 2);
    const len = z1 - z0;
    put(g, mk(G.box(0.24, 1.0, len, 0.05), NAVY), 0, 0.5, 0);
    put(g, mk(G.box(0.36, 0.08, len + 0.04, 0.03), toon('#fff', { map: marbleTex() })), 0, 1.04, 0);
    for (let i = 0; i < Math.floor(len / 0.7); i++) {
      const p = put(g, plant(0.45, NAVY_DEEP), 0, 1.08, -len / 2 + 0.35 + i * 0.7);
      p.rotation.y = i;
    }
    addCollider(g);
    return g;
  };
  halfWall(-5.0, PASS_Z0);
  halfWall(1.5, 5.0);

  // --- the dining room
  const tables = [[2.0, -2.0], [4.6, -2.0], [2.0, 1.6], [4.6, 1.6]].map(([x, z]) => {
    const g = put(world, diningTable(), x, 0, z);
    colliders.push({ type: 'circle', x, z, r: 0.72 });
    return { x, z, group: g };
  });
  const AISLE_X = 3.3, LANE_X = 0.75, CROSS_Z = -0.2;
  const seatCols = ['#8E2E3E', '#3E5C76'];
  const seats = [];
  tables.forEach((t, ti) => {
    for (const s of [-1, 1]) {
      const x = t.x, z = t.z + s * 0.95, ry = s < 0 ? 0 : Math.PI;
      const ch = put(world, fancyChair(seatCols[ti % 2]), x, 0, z);
      ch.rotation.y = ry;
      colliders.push({ type: 'circle', x, z, r: 0.3 });
      seats.push({
        x, z, ry, table: ti, chair: ch, occupant: null,
        plateSpot: V3(x, 0.64, z - s * 0.48),
        aisle: V3(AISLE_X, 0, z),
        stand: V3(x + (x < AISLE_X ? 0.62 : -0.62), 0, z),
      });
    }
  });
  // the entrance on the back wall, with a host stand
  const DOOR_X = 3.3;
  const door = put(world, new THREE.Group(), DOOR_X, 0, -4.97);
  put(door, mk(G.box(1.7, 2.75, 0.12, 0.06), WALNUT), 0, 1.37, 0);
  for (const sx of [-1, 1]) {
    put(door, mk(G.box(0.68, 2.4, 0.1, 0.06), NAVY_DEEP), sx * 0.36, 1.22, 0.05);
    put(door, new THREE.Mesh(G.plane(0.46, 1.5), new THREE.MeshBasicMaterial({ color: '#F6C29A' })), sx * 0.36, 1.45, 0.106);
    put(door, mk(G.capsule(0.018, 0.3), BRASS, { outline: 'thin' }), sx * 0.08, 1.15, 0.13);
  }
  const lantern = put(door, mk(G.box(0.22, 0.3, 0.22, 0.05), '#FFE3A0', { outline: 'mid', emissive: '#FFC870', emissiveIntensity: 0.9 }), 0, 2.95, 0.2);
  lantern.userData.noHighlight = true;
  const dGlow = glow('#FFC870', 1.0, 0.55);
  put(door, dGlow, 0, 2.95, 0.25);
  glows.push(dGlow);
  const host = put(world, new THREE.Group(), 2.2, 0, -4.4);
  put(host, mk(G.box(0.55, 1.05, 0.4, 0.06), WALNUT), 0, 0.525, 0);
  put(host, mk(G.box(0.6, 0.06, 0.45, 0.02), BRASS, { outline: 'thin' }), 0, 1.07, 0);
  put(host, mk(G.box(0.3, 0.02, 0.22, 0.01), '#FFFBF0', { outline: 'thin' }), 0, 1.1, 0.02).rotation.x = -0.2;
  addCollider(host);
  put(world, mk(G.box(1.2, 0.02, 0.7, 0.01), '#8E2E3E', { outline: 'thin', cast: false }), DOOR_X, 0.012, -4.4).userData.noHighlight = true;

  // a wine wall, the restaurant's name and sea paintings
  const wine = put(world, new THREE.Group(), 0.95, 0, -4.82);
  put(wine, mk(G.box(1.2, 2.3, 0.3, 0.04), WALNUT), 0, 1.15, 0);
  for (let r = 0; r < 6; r++) for (let k = 0; k < 4; k++) {
    const b = put(wine, mk(G.cyl(0.035, 0.035, 0.2, 0.012, 10), ['#5E2A3A', '#3E5C3E', '#2E2A30'][(r + k) % 3], { outline: 'thin' }), -0.42 + k * 0.28, 0.3 + r * 0.33, 0.1);
    b.rotation.x = Math.PI / 2;
    put(wine, mk(G.cyl(0.02, 0.02, 0.02, 0.006, 8), BRASS, { outline: false }), -0.42 + k * 0.28, 0.3 + r * 0.33, 0.21).rotation.x = Math.PI / 2;
  }
  addCollider(wine);
  put(world, mk(G.box(1.6, 0.5, 0.08, 0.05), toon('#fff', { map: signTex('Lantern Cliff', NAVY_DEEP, BRASS) }), { outline: 'mid' }), 5.15, 2.75, -4.95);
  const seaPic = (seed) => canvasTex(160, 120, (c) => {
    const gr = c.createLinearGradient(0, 0, 0, 120);
    gr.addColorStop(0, '#F6B98E');
    gr.addColorStop(0.55, '#F9D7A8');
    gr.addColorStop(0.56, '#5A9CC0');
    gr.addColorStop(1, '#3E7FA0');
    c.fillStyle = gr;
    c.fillRect(0, 0, 160, 120);
    c.fillStyle = '#FFE9A8';
    c.beginPath();
    c.arc(60 + seed * 40, 60, 16, Math.PI, 0);
    c.fill();
    c.fillStyle = '#8A6A6A';
    c.beginPath();
    c.ellipse(130 - seed * 90, 70, 40, 18, 0, Math.PI, 0);
    c.fill();
  });
  for (const [x, y, seed] of [[1.95, 2.0, 0], [5.15, 1.75, 1]]) put(world, frame(0.6, 0.48, seaPic(seed)), x, y, -4.95);
  // big olive trees in the dining room corners
  for (const [x, z, s] of [[0.75, 4.5, 1.0], [5.5, -4.4, 1.1]]) {
    put(fp, plant(s, NAVY), x, 0, z);
    colliders.push({ type: 'circle', x, z, r: 0.42 * s });
  }

  // clock and sconces in the kitchen
  const clock = put(world, new THREE.Group(), -5.93, 2.62, -1.4);
  clock.rotation.y = Math.PI / 2;
  const cf = put(clock, mk(G.cyl(0.36, 0.36, 0.1, 0.04, 28), BRASS));
  cf.rotation.x = Math.PI / 2;
  const cfi = put(clock, mk(G.cyl(0.29, 0.29, 0.04, 0.01, 28), MARBLE, { outline: 'thin' }), 0, 0, 0.05);
  cfi.rotation.x = Math.PI / 2;
  const h1 = dyn(put(clock, new THREE.Group(), 0, 0, 0.08));
  put(h1, mk(G.box(0.03, 0.2, 0.02, 0.01), INK, { outline: false }), 0, 0.09, 0);
  const h2 = dyn(put(clock, new THREE.Group(), 0, 0, 0.085));
  put(h2, mk(G.box(0.03, 0.14, 0.02, 0.01), INK, { outline: false }), 0, 0.06, 0);
  for (const [x, z, ry] of [[-5.93, 0.9, Math.PI / 2], [-5.93, -3.6, Math.PI / 2]]) {
    const s = sconce();
    put(world, s.group, x, 2.4, z).rotation.y = ry;
    glows.push(s.glow);
  }

  // --- lights: pendants over the tables and the kitchen
  const lights = [];
  const lamp = (x, z, col, drop = 0.95) => {
    const p = pendant(drop, col);
    put(fp, p.group, x, H, z);
    glows.push(p.glow);
    const L = new THREE.PointLight('#FFD3A0', 2.4, 6.5, 1.3);
    L.position.set(x, H + p.bulbY, z);
    scene.add(L);
    lights.push(L);
  };
  for (const t of tables) lamp(t.x, t.z, BRASS, 1.25);
  lamp(-2.75, -1.6, NAVY, 0.9);
  lamp(-2.75, 3.0, NAVY, 0.9);
  const warm = new THREE.PointLight('#FFB98A', 1.6, 7, 1.4);
  warm.position.set(3.0, 2.6, 4.2);
  scene.add(warm);
  lights.push(warm);

  // --- dust motes in the sunset light
  const moteGeo = new THREE.BufferGeometry();
  const mp = new Float32Array(90 * 3);
  for (let i = 0; i < 90; i++) {
    mp[i * 3] = 0.5 + Math.random() * 5;
    mp[i * 3 + 1] = 0.5 + Math.random() * 1.8;
    mp[i * 3 + 2] = -4 + Math.random() * 8.5;
  }
  moteGeo.setAttribute('position', new THREE.BufferAttribute(mp, 3));
  const dot = canvasTex(32, 32, (c) => {
    const gr = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.5, 'rgba(255,255,255,.5)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = gr;
    c.fillRect(0, 0, 32, 32);
  });
  const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({ color: '#FFD9B0', map: dot, size: 0.03, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending }));
  fp.add(motes);

  // --- colliders for kitchen furniture
  for (const g of [mixer.group, stove.group, oven.group, freezer.group, decor.group, scrap.group, island.group, dry, cold.group]) addCollider(g);

  setLayer(fp, FP_LAYER);
  for (const L of lights) L.layers.enableAll();

  // --- interactables
  world.updateMatrixWorld(true);
  for (const st of Object.values(stations)) {
    st.slot = st.group.localToWorld(st.built.slotLocal.clone());
    if (st.built.sideLocal) {
      st.sideSlots = [st.built.sideLocal, st.built.sideLocalB || st.built.sideLocal].map((v) => st.group.localToWorld(v.clone()));
      st.sideSlot = st.sideSlots[0];
    }
    if (st.built.potTop) st.potTop = st.group.localToWorld(st.built.potTop.clone());
    interact.push({ kind: 'station', station: st, obj: st.type === 'prep' ? island.board : st.group });
  }
  for (const it of ingredientItems) interact.push({ kind: 'ingredient', id: it.id, zone: it.zone, door: it.door, obj: it.obj });
  for (const it of interact) {
    it.box = new THREE.Box3().setFromObject(it.obj);
    const t = it.kind === 'station' && it.station.type;
    if (t && !['spot', 'prep', 'pass'].includes(t)) it.box.max.y = Math.max(it.box.max.y, 1.3);
    if (t === 'spot' || t === 'prep') it.box.expandByVector(V3(0.06, 0.12, 0.06));
    if (t === 'pass') it.box.expandByVector(V3(0.08, 0.2, 0.04));
    it.hl = buildHighlight(it.obj);
  }

  mergeStatic(world);

  return {
    world, stations, spots, colliders, seats, tables, glows, lights, interact, motes,
    coldDoors: cold.doors, coldFace: cold.face,
    door: V3(DOOR_X, 0, -4.55),
    clockHands: [h1, h2],
    passes,
    waiterHomes: [V3(0.75, 0, -3.75), V3(1.35, 0, -3.6), V3(0.75, 0, -4.35)],
    nav: { aisleX: AISLE_X, laneX: LANE_X, crossZ: CROSS_Z },
    signPos: V3(DOOR_X, 1.3, -4.82),
    bg: '#F3CDBE',
    lighting: { hemi: ['#FFE9D8', '#C9A0A8', 1.3], sun: { color: '#FFC08A', intensity: 1.55, pos: [12, 8, 9] } },
  };
}
