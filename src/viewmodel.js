// First-person paws: two fluffy fox paws in chef sleeves that carry whatever
// you're holding. Rendered in their own little scene on top of the world so
// they never clip into counters.
import * as THREE from 'three';
import { G, C, mk } from './toon.js';

const UP = new THREE.Vector3(0, 1, 0);

export class ViewModel {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(58, 1, 0.01, 10);
    this.scene.add(new THREE.HemisphereLight('#FFF4DE', '#E2BE98', 1.45));
    const sun = new THREE.DirectionalLight('#FFE6C2', 1.35);
    sun.position.set(-1, 2.2, 1.4);
    this.scene.add(sun);
    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.arms = [this.makeArm(-1), this.makeArm(1)];
    this.holder = new THREE.Group();
    this.root.add(this.holder);
    this.held = null;
    this.phase = 0;
    this.reach = 0;
    this.lift = 0;
    this.visible = true;
  }

  makeArm(side) {
    const shoulder = new THREE.Vector3(side * 0.3, -0.52, -0.2);
    const sleeve = mk(G.capsule(0.052, 0.3), '#FFFBF0', { outline: 'mid', cast: false });
    const cuff = mk(G.torus(0.05, 0.016, Math.PI * 2, 18), C.pinkDeep, { outline: 'thin', cast: false });
    const paw = new THREE.Group();
    paw.add(mk(G.sphere(0.062, 16, 12), '#E8893A', { outline: 'mid', cast: false }));
    for (let i = -1; i <= 1; i++) {
      const toe = mk(G.sphere(0.022, 10, 8), '#E8893A', { outline: 'thin', cast: false });
      toe.position.set(i * 0.028, 0.03, -0.045);
      paw.add(toe);
      const tip = mk(G.sphere(0.012, 8, 6), '#FFF3DC', { outline: false, cast: false });
      tip.position.set(i * 0.028, 0.04, -0.058);
      paw.add(tip);
    }
    paw.children[0].scale.set(1.05, 0.82, 1.1);
    this.root.add(sleeve, cuff, paw);
    return { side, shoulder, sleeve, cuff, paw, pos: new THREE.Vector3() };
  }

  /** Put an object (dessert, bowl) in the paws, or clear with null. */
  setHeld(obj) {
    if (this.held) this.holder.remove(this.held);
    this.held = obj;
    if (!obj) return;
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const s = 0.26 / Math.max(size.x, size.z, size.y * 0.8, 0.001);
    obj.scale.setScalar(s);
    obj.position.set(0, 0, 0);
    this.holder.add(obj);
    this.lift = 1;
  }

  grab() { this.reach = 1; }

  update(dt, { moving = false, speed = 0, aspect = 1 } = {}) {
    this.camera.aspect = aspect;
    // portrait screens are narrow, so widen the paws' camera to keep them small
    this.camera.fov = aspect < 1 ? 58 + (1 - aspect) * 50 : 58;
    this.camera.updateProjectionMatrix();
    this.phase += dt * (moving ? 9 + speed : 1.6);
    const bobY = moving ? Math.abs(Math.sin(this.phase)) * 0.018 : Math.sin(this.phase) * 0.004;
    const swayX = moving ? Math.sin(this.phase * 0.5) * 0.012 : 0;
    this.root.position.set(swayX, -bobY, 0);
    this.reach = Math.max(0, this.reach - dt * 4);
    this.lift = Math.max(0, this.lift - dt * 3);
    const holding = !!this.held;
    // narrow screens: pull the paws in so they stay on screen
    const squeeze = Math.min(1, Math.max(0.6, aspect * 0.9));
    const low = aspect < 1 ? 0.05 : 0;
    this.holder.position.set(0, -0.26 - low - this.lift * 0.08, -0.62);
    this.holder.rotation.set(0.42, 0.25, 0);
    for (const a of this.arms) {
      const target = holding
        ? new THREE.Vector3(a.side * 0.15 * squeeze, -0.3, -0.52)
        : new THREE.Vector3(a.side * 0.2 * squeeze, -0.34, -0.46);
      if (a.side > 0 && this.reach > 0) {
        const k = Math.sin(this.reach * Math.PI);
        target.lerp(new THREE.Vector3(0.1, -0.17, -0.72), k);
      }
      a.pos.lerp(target, Math.min(1, dt * 14));
      const sh = a.shoulder.clone();
      sh.x *= squeeze;
      const dir = a.pos.clone().sub(sh);
      const len = dir.length();
      a.sleeve.position.copy(sh).addScaledVector(dir, 0.45);
      a.sleeve.quaternion.setFromUnitVectors(UP, dir.clone().normalize());
      a.sleeve.scale.set(1, (len * 0.9) / 0.4, 1);
      a.cuff.position.copy(sh).addScaledVector(dir, 0.84);
      a.cuff.quaternion.copy(a.sleeve.quaternion);
      a.cuff.rotateX(Math.PI / 2);
      a.paw.position.copy(a.pos);
      a.paw.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir.clone().normalize());
    }
    this.root.visible = this.visible;
  }
}
