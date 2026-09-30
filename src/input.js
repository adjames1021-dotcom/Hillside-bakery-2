// Keyboard, mouse (pointer lock with a drag-to-look fallback) and touch input.
// The game reads accumulated look/motion deltas each frame and gets callbacks
// for presses.

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.lookDX = 0;
    this.lookDY = 0;
    this.moveAmt = 0;
    this.moveDX = 0;
    this.moveDY = 0;
    this.primaryDown = false;
    this.locked = false;
    this.lockFailed = false;
    this.wantLock = false;
    this.dragLook = true;
    this.dragging = false;
    this.cursor = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.stick = { x: 0, y: 0 };
    this.coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    this.on = {};
    this.bind();
  }

  emit(name, ...args) {
    const fn = this.on[name];
    if (fn) fn(...args);
  }

  requestLock() {
    if (this.lockFailed || this.coarse || !this.canvas.requestPointerLock) return false;
    try {
      const p = this.canvas.requestPointerLock();
      if (p && p.catch) p.catch(() => { this.lockFailed = true; this.emit('lockError'); });
      return true;
    } catch {
      this.lockFailed = true;
      return false;
    }
  }

  exitLock() {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  consumeLook() {
    const r = [this.lookDX, this.lookDY];
    this.lookDX = this.lookDY = 0;
    return r;
  }

  consumeMove() {
    const r = { amt: this.moveAmt, dx: this.moveDX, dy: this.moveDY };
    this.moveAmt = this.moveDX = this.moveDY = 0;
    return r;
  }

  bind() {
    const c = this.canvas;
    window.addEventListener('keydown', (e) => {
      if (e.target && e.target.closest && e.target.closest('input, textarea')) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase();
      this.keys.add(k);
      this.emit('key', k, e);
    });
    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      this.keys.delete(k);
      this.emit('keyUp', k, e);
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.primaryDown = false;
      this.stick.x = this.stick.y = 0;
    });

    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === c;
      this.emit('lockChange', this.locked);
    });
    document.addEventListener('pointerlockerror', () => {
      this.lockFailed = true;
      this.emit('lockError');
    });

    document.addEventListener('mousemove', (e) => {
      const mx = e.movementX || 0, my = e.movementY || 0;
      if (this.locked) {
        this.lookDX += mx;
        this.lookDY += my;
        this.cursor.x = Math.max(0, Math.min(window.innerWidth, this.cursor.x + mx));
        this.cursor.y = Math.max(0, Math.min(window.innerHeight, this.cursor.y + my));
      } else {
        if (this.dragging && this.dragLook) {
          this.lookDX += mx;
          this.lookDY += my;
        }
        this.cursor.x = e.clientX;
        this.cursor.y = e.clientY;
      }
      this.moveAmt += Math.abs(mx) + Math.abs(my);
      this.moveDX += mx;
      this.moveDY += my;
    });

    c.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      // touch screens also send a compatibility mousedown after a tap; the tap handler owns those
      if (performance.now() - this.lastTouch < 900) return;
      if (this.wantLock && !this.locked && !this.lockFailed && !this.coarse) {
        if (this.requestLock()) return;
      }
      this.primaryDown = true;
      if (!this.locked && this.dragLook) {
        // without pointer lock a press may be the start of a drag-to-look;
        // it only counts as a click if the mouse barely moves
        this.dragging = true;
        this.pressAt = { x: e.clientX, y: e.clientY, t: performance.now() };
        return;
      }
      this.emit('primary', e);
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button !== 0) return;
      this.dragging = false;
      if (this.pressAt) {
        const moved = Math.hypot(e.clientX - this.pressAt.x, e.clientY - this.pressAt.y);
        if (moved < 6 && performance.now() - this.pressAt.t < 600) this.emit('primary', e);
        this.pressAt = null;
      }
      if (this.primaryDown) {
        this.primaryDown = false;
        this.emit('primaryUp');
      }
    });

    // touch: drag anywhere on the scene to look (or to wiggle in mini-games); quick tap = tap
    let lookTouch = null;
    this.lastTouch = -1e4;
    c.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') return;
      this.lastTouch = performance.now();
      lookTouch = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now() };
      c.setPointerCapture(e.pointerId);
    });
    c.addEventListener('pointermove', (e) => {
      if (!lookTouch || e.pointerId !== lookTouch.id) return;
      const dx = e.clientX - lookTouch.x, dy = e.clientY - lookTouch.y;
      this.lookDX += dx * 1.3;
      this.lookDY += dy * 1.3;
      this.moveAmt += Math.abs(dx) + Math.abs(dy);
      this.moveDX += dx;
      this.moveDY += dy;
      lookTouch.x = e.clientX;
      lookTouch.y = e.clientY;
    });
    const endTouch = (e) => {
      if (!lookTouch || e.pointerId !== lookTouch.id) return;
      const moved = Math.hypot(e.clientX - lookTouch.sx, e.clientY - lookTouch.sy);
      if (moved < 12 && performance.now() - lookTouch.t < 300) this.emit('tap', e);
      lookTouch = null;
    };
    c.addEventListener('pointerup', endTouch);
    c.addEventListener('pointercancel', endTouch);
  }

  /** Joystick + Use button for touch screens. */
  bindTouchControls(stickEl, knobEl, useEl) {
    let id = null;
    const move = (e) => {
      const r = stickEl.getBoundingClientRect();
      let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const max = r.width * 0.36;
      const len = Math.hypot(dx, dy);
      if (len > max) { dx *= max / len; dy *= max / len; }
      knobEl.style.transform = `translate(${dx}px, ${dy}px)`;
      this.stick.x = dx / max;
      this.stick.y = -dy / max;
    };
    stickEl.addEventListener('pointerdown', (e) => {
      id = e.pointerId;
      stickEl.setPointerCapture(e.pointerId);
      move(e);
      this.emit('touchStart');
    });
    stickEl.addEventListener('pointermove', (e) => { if (e.pointerId === id) move(e); });
    const end = (e) => {
      if (e.pointerId !== id) return;
      id = null;
      this.stick.x = this.stick.y = 0;
      knobEl.style.transform = '';
    };
    stickEl.addEventListener('pointerup', end);
    stickEl.addEventListener('pointercancel', end);
    useEl.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.lastTouch = performance.now();
      this.primaryDown = true;
      this.emit('primary', e);
      this.emit('touchStart');
    });
    const up = () => {
      if (!this.primaryDown) return;
      this.primaryDown = false;
      this.emit('primaryUp');
    };
    useEl.addEventListener('pointerup', up);
    useEl.addEventListener('pointercancel', up);
    useEl.addEventListener('pointerleave', up);
  }
}
