// Static batching (merge meshes that share a material into one draw) and the
// warm highlight outline shown around whatever the crosshair is aimed at.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { OUT, hullGeo } from './toon.js';

function skipped(obj, root) {
  for (let o = obj; o && o !== root; o = o.parent) {
    if (o.userData.dynamic || o.userData.noMerge) return true;
  }
  return false;
}

/**
 * Bakes every static mesh under `root` into one mesh per material (in root's
 * space). Anything flagged userData.dynamic / noMerge, sprites, lights and
 * transparent materials (unless material.userData.mergeable) are left alone.
 */
export function mergeStatic(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const list = [];
  root.traverse((o) => {
    if (!o.isMesh || o === root || !o.visible) return;
    if (skipped(o, root)) return;
    const m = o.material;
    if (Array.isArray(m)) return;
    if (m.transparent && !m.userData.mergeable) return;
    list.push(o);
  });

  const buckets = new Map();
  const rel = new THREE.Matrix4();
  for (const o of list) {
    const noHl = o.userData.noHighlight ? 1 : 0;
    const key = `${o.material.uuid}|${o.layers.mask}|${o.castShadow ? 1 : 0}${o.receiveShadow ? 1 : 0}|${o.renderOrder}|${noHl}`;
    let b = buckets.get(key);
    if (!b) {
      b = { material: o.material, mask: o.layers.mask, cast: o.castShadow, receive: o.receiveShadow, renderOrder: o.renderOrder, noHl, geos: [] };
      buckets.set(key, b);
    }
    const src = o.geometry;
    const g = src.index ? src.toNonIndexed() : src.clone();
    for (const name of Object.keys(g.attributes)) {
      if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
    }
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.morphAttributes = {};
    g.clearGroups();
    rel.multiplyMatrices(inv, o.matrixWorld);
    g.applyMatrix4(rel);
    b.geos.push(g);
  }

  // re-home children that are not being merged (sprites, dynamic parts, highlights)
  const set = new Set(list);
  for (const o of list) {
    for (const child of [...o.children]) {
      if (set.has(child)) continue;
      let host = o.parent;
      while (host && set.has(host)) host = host.parent;
      (host || root).attach(child);
    }
  }
  for (const o of list) o.removeFromParent();

  const out = [];
  for (const b of buckets.values()) {
    const geo = mergeGeometries(b.geos, false);
    for (const g of b.geos) g.dispose();
    if (!geo) continue;
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, b.material);
    mesh.castShadow = b.cast;
    mesh.receiveShadow = b.receive;
    mesh.layers.mask = b.mask;
    mesh.renderOrder = b.renderOrder;
    mesh.userData.merged = true;
    if (b.noHl) mesh.userData.noHighlight = true;
    root.add(mesh);
    out.push(mesh);
  }
  return out;
}

/**
 * Builds hidden highlight hulls next to every solid mesh of obj. Call before
 * mergeStatic; the hulls are flagged so they survive merging.
 */
export function buildHighlight(obj) {
  const meshes = [];
  const sources = [];
  obj.traverse((m) => {
    if (!m.isMesh || m.userData.outline || m.userData.hl || m.userData.noHighlight) return;
    const mat = m.material;
    // merged ink outlines are ShaderMaterial meshes; they don't need a highlight of their own
    if (Array.isArray(mat) || mat.transparent || mat.isShaderMaterial) return;
    const t = m.geometry.type;
    if (t === 'PlaneGeometry' || t === 'CircleGeometry') return;
    sources.push(m);
  });
  for (const m of sources) {
    const h = new THREE.Mesh(hullGeo(m.geometry), OUT.hl);
    h.userData.hl = true;
    h.userData.noMerge = true;
    h.visible = false;
    h.castShadow = false;
    h.receiveShadow = false;
    h.layers.mask = m.layers.mask;
    h.position.copy(m.position);
    h.quaternion.copy(m.quaternion);
    h.scale.copy(m.scale);
    (m.parent || obj).add(h);
    meshes.push(h);
  }
  return {
    meshes,
    on: false,
    set(on) {
      if (on === this.on) return;
      this.on = on;
      for (const h of meshes) h.visible = on;
    },
  };
}
