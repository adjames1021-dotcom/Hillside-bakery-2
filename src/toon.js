// Shared toon look: 4-step cel materials, screen-space inverted-hull outlines,
// rounded geometry helpers, additive glow sprites and flat canvas textures.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export const INK = '#4B2E1D';

export const C = {
  cream: '#F8E8C8',
  cream2: '#FFF3DC',
  white: '#FFFBF0',
  apricot: '#F4A646',
  pumpkin: '#E8893A',
  honey: '#D9A05B',
  honeyLight: '#E8BC7A',
  honeyDark: '#B97A43',
  butcher: '#E6B67A',
  butter: '#FFE08A',
  pink: '#F7B9C4',
  pinkDeep: '#EE93A6',
  sage: '#AFCB9C',
  sageDark: '#88AE7B',
  blue: '#AFD6EC',
  blueDeep: '#86BADB',
  cocoa: '#8A5A3B',
  choco: '#6A4029',
  cherry: '#E4605E',
  wall: '#FCEBD2',
  gold: '#FFC940',
  bread: '#E9A95A',
  breadDark: '#C98240',
};

let maxAniso = 4;
export function setMaxAnisotropy(n) { maxAniso = Math.max(1, Math.min(16, n)); }

// ---------------------------------------------------------------- materials

// 4 hard light steps. The darkest step stays fairly bright so shade is warm
// and gentle instead of muddy.
const gradientMap = (() => {
  const data = new Uint8Array([128, 176, 218, 255]);
  const t = new THREE.DataTexture(data, 4, 1, THREE.RedFormat);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
})();

const matCache = new Map();
export function toon(color, opts = {}) {
  const key = `${color}|${opts.emissive || ''}|${opts.emissiveIntensity ?? ''}|${opts.transparent ? opts.opacity : ''}`;
  if (!opts.map && !opts.unique && matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshToonMaterial({
    color: opts.map ? '#ffffff' : color,
    map: opts.map || null,
    gradientMap,
    emissive: opts.emissive || '#000000',
    emissiveIntensity: opts.emissiveIntensity ?? 1,
    transparent: !!opts.transparent,
    opacity: opts.opacity ?? 1,
    depthWrite: opts.transparent ? false : true,
  });
  if (!opts.map && !opts.unique) matCache.set(key, m);
  return m;
}

// ---------------------------------------------------------------- outlines

export const outlineUniforms = {
  resolution: { value: new THREE.Vector2(1, 1) },
  // lines keep full weight up to this view depth, then thin out (perspective only)
  distRef: { value: 1e6 },
};

const outlineVert = /* glsl */ `
  uniform vec2 resolution;
  uniform float thickness;
  uniform float distRef;
  void main() {
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * normal);
    vec4 clipN = projectionMatrix * vec4(n, 0.0);
    vec2 dir = clipN.xy * resolution;
    float len = length(dir);
    dir = len > 1e-5 ? dir / len : vec2(0.0);
    float w = max(clip.w, 1e-3);
    float px = thickness * clamp(distRef / w, 0.42, 1.0);
    clip.xy += dir * px * 2.0 / resolution * clip.w;
    gl_Position = clip;
  }
`;
const outlineFrag = /* glsl */ `
  uniform vec3 color;
  void main() {
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

function outlineMaterial(px, color = INK) {
  return new THREE.ShaderMaterial({
    uniforms: {
      resolution: outlineUniforms.resolution,
      distRef: outlineUniforms.distRef,
      thickness: { value: px },
      color: { value: new THREE.Color(color) },
    },
    vertexShader: outlineVert,
    fragmentShader: outlineFrag,
    side: THREE.BackSide,
  });
}

const BASE = { thick: 3.0, mid: 2.2, thin: 1.4, hl: 7.0 };
export const OUT = {
  thick: outlineMaterial(BASE.thick),
  mid: outlineMaterial(BASE.mid),
  thin: outlineMaterial(BASE.thin),
  // warm glow line drawn around whatever the crosshair is on
  hl: outlineMaterial(BASE.hl, '#FFD27A'),
};

export function setOutlineScale(s) {
  for (const k in BASE) OUT[k].uniforms.thickness.value = BASE[k] * s;
}

/**
 * Hull geometry with averaged normals, so the ink line has no gaps at hard
 * edges (cylinder caps, extrusions, box corners).
 */
const hullCache = new WeakMap();
export function hullGeo(geo) {
  let h = hullCache.get(geo);
  if (h) return h;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', geo.attributes.position.clone());
  if (geo.index) g.setIndex(geo.index.clone());
  h = mergeVertices(g, 1e-4);
  h.computeVertexNormals();
  hullCache.set(geo, h);
  return h;
}

/** Toon mesh with an ink hull child. */
export function mk(geo, color, o = {}) {
  const mat = color instanceof THREE.Material ? color : toon(color, o);
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = o.cast ?? true;
  m.receiveShadow = o.receive ?? true;
  const ol = o.outline === undefined ? 'thick' : o.outline;
  if (ol) {
    const h = new THREE.Mesh(hullGeo(geo), OUT[ol]);
    h.castShadow = false;
    h.receiveShadow = false;
    h.userData.outline = true;
    m.add(h);
  }
  return m;
}

export function place(obj, x = 0, y = 0, z = 0, parent) {
  obj.position.set(x, y, z);
  if (parent) parent.add(obj);
  return obj;
}

// ---------------------------------------------------------------- geometry

const gcache = new Map();
function cached(key, fn) {
  if (!gcache.has(key)) gcache.set(key, fn());
  return gcache.get(key);
}

function roundedProfile(rt, rb, h, bevel, steps = 4) {
  const pts = [];
  const b = Math.min(bevel, h / 2 - 0.001, Math.max(rt, rb) - 0.001);
  const y0 = -h / 2, y1 = h / 2;
  pts.push(new THREE.Vector2(0, y0));
  for (let i = 0; i <= steps; i++) {
    const a = -Math.PI / 2 + (i / steps) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(0.0001, rb - b + Math.cos(a) * b), y0 + b + Math.sin(a) * b));
  }
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(0.0001, rt - b + Math.cos(a) * b), y1 - b + Math.sin(a) * b));
  }
  pts.push(new THREE.Vector2(0, y1));
  return pts;
}

// Minimum smoothness by size: big shapes get more segments so the toon light
// bands stay round up close, tiny crumbs and sprinkles stay cheap.
const segFor = (r, asked, big = 32, mid = 20, small = 12) => Math.max(asked, r >= 0.09 ? big : r >= 0.025 ? mid : r >= 0.008 ? small : asked);

export const G = {
  box: (w, h, d, r = 0.08) =>
    cached(`box${w},${h},${d},${r}`, () =>
      new RoundedBoxGeometry(w, h, d, Math.max(w, h, d) > 0.3 ? 4 : 3, Math.max(0.004, Math.min(r, w / 2 - 0.003, h / 2 - 0.003, d / 2 - 0.003)))),
  sphere: (r, ws = 24, hs = 16) => {
    const w = segFor(r, ws, 32, 20, 12);
    const h = Math.max(hs, Math.round(w * 0.66));
    return cached(`sph${r},${w},${h}`, () => new THREE.SphereGeometry(r, w, h));
  },
  capsule: (r, l) => cached(`cap${r},${l}`, () => new THREE.CapsuleGeometry(r, l, r >= 0.02 ? 8 : 5, segFor(r, 16, 24, 18, 12))),
  cyl: (rt, rb, h, bevel = 0.04, seg = 28) => {
    const n = segFor(Math.max(rt, rb), seg, 40, 24, 14);
    return cached(`cyl${rt},${rb},${h},${bevel},${n}`, () => new THREE.LatheGeometry(roundedProfile(rt, rb, h, bevel, Math.max(rt, rb) >= 0.05 ? 5 : 4), n));
  },
  lathe: (pts, seg = 24) => {
    const n = segFor(pts.reduce((m, p) => Math.max(m, p.x), 0), seg, 40, 24, 14);
    return cached(`lat${n}|${pts.map((p) => `${p.x.toFixed(4)},${p.y.toFixed(4)}`).join(';')}`, () => new THREE.LatheGeometry(pts, n));
  },
  torus: (r, t, arc = Math.PI * 2, seg = 24) => {
    const n = Math.max(seg, Math.round(segFor(r, seg, 48, 32, 20) * Math.max(0.3, arc / (Math.PI * 2))));
    return cached(`tor${r},${t},${arc},${n}`, () => new THREE.TorusGeometry(r, t, t >= 0.015 ? 12 : 8, n, arc));
  },
  circle: (r) => cached(`cir${r}`, () => new THREE.CircleGeometry(r, 24)),
  plane: (w, h) => cached(`pl${w},${h}`, () => new THREE.PlaneGeometry(w, h)),
};

/**
 * Re-maps a mesh's UVs from its world position so tiled textures keep the same
 * scale on every wall segment. plane: 'zy' (walls along z), 'xy', or 'xz' (floors).
 */
export function worldUV(mesh, plane, tile, offset = [0, 0]) {
  const [tu, tv] = Array.isArray(tile) ? tile : [tile, tile];
  mesh.updateMatrixWorld(true);
  const geo = mesh.geometry.clone();
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
    let a, b;
    if (plane === 'zy') { a = v.z; b = v.y; }
    else if (plane === 'xy') { a = v.x; b = v.y; }
    else { a = v.x; b = -v.z; }
    uv.setXY(i, a / tu + offset[0], b / tv + offset[1]);
  }
  uv.needsUpdate = true;
  mesh.geometry = geo;
  for (const c of mesh.children) if (c.userData.outline) c.geometry = hullGeo(geo);
  return mesh;
}

// ---------------------------------------------------------------- faces

/**
 * Kawaii face built on a local +z facing surface. Returns eyes for blinking.
 * s = overall scale.
 */
export function addFace(parent, s = 1, o = {}) {
  const face = new THREE.Group();
  const eyeGeo = G.sphere(0.055 * s, 12, 8);
  const eyes = [];
  for (const sx of [-1, 1]) {
    const e = new THREE.Mesh(eyeGeo, toon(INK));
    e.scale.set(1, 1.2, 0.5);
    e.position.set(sx * 0.17 * s, 0.03 * s, 0);
    face.add(e);
    const hl = new THREE.Mesh(G.sphere(0.018 * s, 8, 6), toon(C.white));
    hl.position.set(-0.018 * s, 0.022 * s, 0.03 * s);
    e.add(hl);
    eyes.push(e);
    const blush = new THREE.Mesh(G.circle(0.07 * s), toon(C.pinkDeep));
    blush.position.set(sx * 0.3 * s, -0.07 * s, 0.005);
    blush.scale.set(1, 0.65, 1);
    face.add(blush);
  }
  const smile = new THREE.Mesh(G.torus(0.06 * s, 0.014 * s, Math.PI), toon(INK));
  smile.rotation.z = Math.PI;
  smile.position.set(0, -0.06 * s, 0.005);
  face.add(smile);
  if (o.position) face.position.copy(o.position);
  parent.add(face);
  return { face, eyes, smile };
}

// ---------------------------------------------------------------- sprites

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function canvasTex(w, h, draw, repeat) {
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = maxAniso;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

let GLOW_TEX = null;
function glowTex() {
  if (!GLOW_TEX) {
    GLOW_TEX = canvasTex(128, 128, (ctx) => {
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
      g.addColorStop(0.6, 'rgba(255,255,255,0.14)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
    });
  }
  return GLOW_TEX;
}

export function glow(color, size, opacity = 0.55) {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTex(),
      color,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      opacity,
    }),
  );
  s.scale.set(size, size, 1);
  s.userData.baseOpacity = opacity;
  s.renderOrder = 5;
  return s;
}

/** Soft faint ambient-occlusion blob placed flat on the floor (shared material, merges into one draw). */
let BLOB_MAT = null;
export function blob(w, d = w) {
  if (!BLOB_MAT) {
    const tex = canvasTex(64, 64, (ctx) => {
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(120,70,40,0.5)');
      g.addColorStop(0.6, 'rgba(120,70,40,0.22)');
      g.addColorStop(1, 'rgba(120,70,40,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
    });
    BLOB_MAT = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    BLOB_MAT.userData.mergeable = true;
  }
  const m = new THREE.Mesh(G.plane(1, 1), BLOB_MAT);
  m.rotation.x = -Math.PI / 2;
  m.scale.set(w, d, 1);
  m.position.y = 0.012;
  m.renderOrder = 1;
  return m;
}

export function spriteFromCanvas(canvas, size) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  s.scale.set(size, size, 1);
  s.renderOrder = 10;
  return s;
}

// ---------------------------------------------------------------- color utils

export function mix(a, b, t) {
  const ca = new THREE.Color(a), cb = new THREE.Color(b);
  return '#' + ca.lerp(cb, t).getHexString();
}
