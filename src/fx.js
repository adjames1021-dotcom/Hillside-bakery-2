// Little sprite effects: white puff clouds, hearts, sparkles, floating coins, steam.
import * as THREE from 'three';
import { INK, makeCanvas } from './toon.js';

function stickerTex(draw, size = 96) {
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d');
  ctx.scale(size / 100, size / 100);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  draw(ctx);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function heartPath(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + 30 * s);
  ctx.bezierCurveTo(x - 40 * s, y + 5 * s, x - 30 * s, y - 30 * s, x, y - 12 * s);
  ctx.bezierCurveTo(x + 30 * s, y - 30 * s, x + 40 * s, y + 5 * s, x, y + 30 * s);
  ctx.closePath();
}

const TEX = {
  puff: stickerTex((ctx) => {
    const circles = [[50, 56, 24], [30, 60, 16], [70, 60, 16], [40, 40, 16], [62, 42, 15]];
    ctx.strokeStyle = INK;
    ctx.lineWidth = 7;
    for (const [x, y, r] of circles) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = '#FFFBF0';
    for (const [x, y, r] of circles) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#F3E3CC';
    ctx.beginPath(); ctx.ellipse(56, 70, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
  }),
  heart: stickerTex((ctx) => {
    heartPath(ctx, 50, 50, 1.1);
    ctx.fillStyle = '#F28AA0';
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = '#FFE1E7';
    ctx.beginPath(); ctx.ellipse(36, 36, 7, 4, -0.6, 0, Math.PI * 2); ctx.fill();
  }),
  sparkle: stickerTex((ctx) => {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 ? 12 : 40;
      ctx.lineTo(50 + Math.cos(a) * r, 50 + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fillStyle = '#FFE08A';
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 5;
    ctx.stroke();
  }),
  coin: stickerTex((ctx) => {
    ctx.beginPath(); ctx.arc(50, 50, 36, 0, Math.PI * 2);
    ctx.fillStyle = '#E8A93A'; ctx.fill();
    ctx.beginPath(); ctx.arc(46, 46, 32, 0, Math.PI * 2);
    ctx.fillStyle = '#FFC940'; ctx.fill();
    ctx.beginPath(); ctx.arc(50, 50, 36, 0, Math.PI * 2);
    ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.stroke();
    ctx.beginPath(); ctx.arc(50, 50, 22, 0, Math.PI * 2);
    ctx.strokeStyle = '#D9912E'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#FFF3C4';
    ctx.beginPath(); ctx.ellipse(38, 34, 8, 4, -0.6, 0, Math.PI * 2); ctx.fill();
  }),
  steam: stickerTex((ctx) => {
    ctx.beginPath(); ctx.arc(50, 50, 30, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,251,240,0.9)'; ctx.fill();
  }),
  dots: stickerTex((ctx) => {
    ctx.fillStyle = INK;
    for (const x of [26, 50, 74]) { ctx.beginPath(); ctx.arc(x, 50, 8, 0, Math.PI * 2); ctx.fill(); }
  }),
};

export class FX {
  constructor(scene) {
    this.scene = scene;
    this.parts = [];
    // close-ups at a station shrink the effects so they don't fill the screen
    this.scale = 1;
  }

  spawn(kind, pos, o = {}) {
    const mat = new THREE.SpriteMaterial({ map: TEX[kind], transparent: true, depthWrite: false, opacity: o.opacity ?? 1 });
    const s = new THREE.Sprite(mat);
    s.position.copy(pos);
    const size = (o.size ?? 0.4) * this.scale;
    s.scale.set(size, size, 1);
    s.renderOrder = 20;
    this.scene.add(s);
    this.parts.push({
      s, kind, size,
      vel: (o.vel ? o.vel.clone() : new THREE.Vector3(0, 1, 0)).multiplyScalar(this.scale),
      life: 0, max: o.life ?? 1,
      grow: o.grow ?? 0, grav: o.grav ?? 0, spin: o.spin ?? 0,
      baseOpacity: o.opacity ?? 1,
    });
    return s;
  }

  puff(pos, n = 7, size = 0.5) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
      const v = new THREE.Vector3(Math.cos(a) * 1.4, 0.5 + Math.random() * 0.6, Math.sin(a) * 1.4);
      this.spawn('puff', pos.clone().add(new THREE.Vector3(0, 0.3 * this.scale, 0)), { vel: v, life: 0.6 + Math.random() * 0.3, size: size * (0.8 + Math.random() * 0.5), grow: 0.6 });
    }
  }

  hearts(pos, n = 4) {
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3((Math.random() - 0.5) * 0.8, 1.2 + Math.random() * 0.6, (Math.random() - 0.5) * 0.8);
      this.spawn('heart', pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.4, 0, 0)), { vel: v, life: 1.3, size: 0.32 + Math.random() * 0.14 });
    }
  }

  sparkles(pos, n = 6, spread = 0.6) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = new THREE.Vector3(Math.cos(a) * spread, 0.6 + Math.random(), Math.sin(a) * spread);
      this.spawn('sparkle', pos.clone(), { vel: v, life: 0.8 + Math.random() * 0.4, size: 0.22 + Math.random() * 0.14, spin: 3 });
    }
  }

  coins(pos, n = 5) {
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3((Math.random() - 0.5) * 1.2, 2.4 + Math.random() * 0.8, (Math.random() - 0.5) * 1.2);
      this.spawn('coin', pos.clone(), { vel: v, life: 1.2, size: 0.34, grav: 4.2 });
    }
  }

  steam(pos) {
    const v = new THREE.Vector3((Math.random() - 0.5) * 0.15, 0.7, (Math.random() - 0.5) * 0.15);
    this.spawn('steam', pos, { vel: v, life: 1.4, size: 0.18, grow: 0.5, opacity: 0.8 });
  }

  dots(pos) {
    return this.spawn('dots', pos, { vel: new THREE.Vector3(0, 0.25, 0), life: 1.6, size: 0.45 });
  }

  update(dt) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life += dt;
      const k = p.life / p.max;
      if (k >= 1) {
        this.scene.remove(p.s);
        p.s.material.dispose();
        this.parts.splice(i, 1);
        continue;
      }
      p.vel.y -= p.grav * dt;
      if (p.kind === 'puff') p.vel.multiplyScalar(1 - dt * 3);
      p.s.position.addScaledVector(p.vel, dt);
      // pop in, then drift and fade
      const pop = Math.min(1, p.life / 0.12);
      const sz = p.size * (0.4 + 0.6 * pop) * (1 + p.grow * k);
      p.s.scale.set(sz, sz, 1);
      p.s.material.opacity = p.baseOpacity * (k > 0.6 ? 1 - (k - 0.6) / 0.4 : 1);
      p.s.material.rotation += p.spin * dt;
    }
  }
}
