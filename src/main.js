import * as THREE from 'three';
import { outlineUniforms, setOutlineScale, spriteFromCanvas } from './toon.js';
import { buildWorld, ROOM } from './world.js';
import { makeAnimal, animateAnimal } from './characters.js';
import { DESSERTS, BY_ID, CATEGORIES, STATIONS, dessertCanvas, dessertURL } from './desserts.js';
import { FX } from './fx.js';
import { sfx, unlockAudio, isMuted, setMuted } from './audio.js';

const $ = (s) => document.querySelector(s);
const BG = '#F9E2C8';
const DUR = { mix: 2.2, bake: 4.5, stove: 3.5, fridge: 3.2, decor: 2.4 };
const NAMES = {
  cat: ['Miso', 'Toffee', 'Biscuit', 'Nutmeg'],
  bunny: ['Clover', 'Mochi', 'Pip', 'Daisy'],
  bear: ['Honey', 'Bruno', 'Maple', 'Fig'],
  puppy: ['Waffles', 'Pudding', 'Scout', 'Peaches'],
};
const SAVE_KEY = 'hillside-bakery-save';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    return { coins: s.coins | 0, served: s.served | 0 };
  } catch {
    return { coins: 0, served: 0 };
  }
}

async function waitForFonts() {
  try {
    await Promise.race([
      Promise.all([document.fonts.load('600 40px Fredoka'), document.fonts.load('700 40px Fredoka')]),
      new Promise((r) => setTimeout(r, 1800)),
    ]);
  } catch { /* fall back to system font */ }
}

async function start(hotData = {}) {
  await waitForFonts();

  // ---------------------------------------------------------------- renderer
  const canvas = $('#scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // the room never moves, so the sun's shadow map is baked once; characters use soft blob shadows
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.setClearColor(BG);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);

  const hemi = new THREE.HemisphereLight('#FFF4DE', '#EBC9A2', 1.55);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#FFE6C2', 1.75);
  sun.position.set(4.5, 13, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 40 });
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);
  scene.add(sun.target);

  // cameras: isometric diorama + baker's eyes
  const ELEV = THREE.MathUtils.degToRad(35);
  const isoDir = new THREE.Vector3(Math.cos(ELEV) * Math.SQRT1_2, Math.sin(ELEV), Math.cos(ELEV) * Math.SQRT1_2);
  const isoCam = new THREE.OrthographicCamera(-10, 10, 7, -7, 0.1, 200);
  const camUp = new THREE.Vector3(-Math.sin(ELEV) * Math.SQRT1_2, Math.cos(ELEV), -Math.sin(ELEV) * Math.SQRT1_2);
  const camRight = new THREE.Vector3(Math.SQRT1_2, 0, -Math.SQRT1_2);
  const isoBase = new THREE.Vector3().addScaledVector(camUp, 1.25);
  const isoTarget = isoBase.clone();
  const fpCam = new THREE.PerspectiveCamera(70, 1, 0.05, 100);
  fpCam.layers.enable(1);
  scene.add(fpCam);

  let halfW = 10;
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    let halfH = Math.max(7.4, 9.6 / aspect);
    if (aspect < 0.9) halfH = Math.max(7.4, 6.6 / aspect); // portrait: closer, camera follows
    halfW = halfH * aspect;
    Object.assign(isoCam, { left: -halfW, right: halfW, top: halfH, bottom: -halfH });
    isoCam.updateProjectionMatrix();
    fpCam.aspect = aspect;
    fpCam.updateProjectionMatrix();
    outlineUniforms.resolution.value.set(w, h);
    setOutlineScale(clamp(Math.min(w, h) / 820, 0.55, 1.15));
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------------------------------------------------------------- world
  const W = buildWorld(scene);
  const fx = new FX(scene);
  const stations = W.stations;
  const stationList = Object.values(stations);

  for (const s of stationList) {
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false }));
    spr.scale.set(0.9, 0.9, 1);
    spr.position.copy(s.slot);
    spr.visible = false;
    spr.renderOrder = 12;
    scene.add(spr);
    s.sprite = spr;
    s.blinkT = Math.random() * 3;
  }

  const texCache = new Map();
  function iconTex(d, raw) {
    const key = d.id + raw;
    if (!texCache.has(key)) {
      const t = new THREE.CanvasTexture(dessertCanvas(d, 128, raw));
      t.colorSpace = THREE.SRGBColorSpace;
      texCache.set(key, t);
    }
    return texCache.get(key);
  }
  function setSpriteIcon(spr, item) {
    if (!item) { spr.visible = false; return; }
    spr.material.map = iconTex(item.d, !isDone(item));
    spr.material.needsUpdate = true;
    spr.visible = true;
  }

  // ---------------------------------------------------------------- player
  const player = makeAnimal('fox', { accessories: ['apron', 'chef'], apronColor: '#EE93A6' });
  player.root.position.set(-2.4, 0, 1.2);
  scene.add(player.root);
  player.root.traverse((m) => { m.castShadow = false; });
  let facing = new THREE.Vector3(1, 0, 1).normalize();
  player.root.rotation.y = Math.atan2(facing.x, facing.z);
  let yaw = player.root.rotation.y;
  let pitch = -0.2;
  let hop = 0;

  const holdSprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false }));
  holdSprite.scale.set(0.85, 0.85, 1);
  holdSprite.renderOrder = 12;
  holdSprite.visible = false;
  scene.add(holdSprite);
  const fpHold = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, depthTest: false }));
  fpHold.scale.set(0.2, 0.2, 1);
  fpHold.position.set(0.2, -0.16, -0.5);
  fpHold.renderOrder = 30;
  fpHold.visible = false;
  fpCam.add(fpHold);

  // ---------------------------------------------------------------- state
  const saved = { ...loadSave(), ...(hotData.save || {}) };
  const S = {
    coins: saved.coins,
    served: saved.served,
    started: !!hotData.started,
    view: 'iso',
    held: null,
    customers: [],
    spawnT: 2.5,
    bookOpen: false,
    bookMode: 'browse',
    tab: 'orders',
    time: 0,
  };
  window.claude?.hot?.snapshot?.(() => ({ save: { coins: S.coins, served: S.served }, started: S.started }));

  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ coins: S.coins, served: S.served })); } catch { /* ignore */ }
  }
  const isDone = (item) => item.step >= item.d.steps.length;
  const unlockedCats = () => CATEGORIES.filter((c) => S.served >= c.unlock).map((c) => c.id);

  // ---------------------------------------------------------------- DOM
  const labels = $('#labels');
  const hint = $('#hint');
  const toastEl = $('#toast');
  let toastTimer = 0;
  function toast(msg, kind = '') {
    toastEl.textContent = msg;
    toastEl.className = 'toast show ' + kind;
    toastTimer = 2.6;
  }

  function bubble(cls, html = '') {
    const el = document.createElement('div');
    el.className = 'bubble ' + cls;
    el.innerHTML = html;
    el.hidden = true;
    labels.appendChild(el);
    return el;
  }
  const tagEl = bubble('tag');
  for (const s of stationList) {
    s.prog = bubble('prog', `<svg viewBox="0 0 44 44"><circle class="track" cx="22" cy="22" r="17"/><circle class="fill" cx="22" cy="22" r="17"/></svg><span class="prog-label"></span>`);
    s.progFill = s.prog.querySelector('.fill');
    s.progLabel = s.prog.querySelector('.prog-label');
  }

  const v3 = new THREE.Vector3();
  function project(el, pos, cam) {
    v3.copy(pos).project(cam);
    const behind = v3.z > 1 || v3.z < -1;
    if (behind || Math.abs(v3.x) > 1.2 || Math.abs(v3.y) > 1.2) {
      el.style.visibility = 'hidden';
      return;
    }
    el.style.visibility = '';
    const x = (v3.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-v3.y * 0.5 + 0.5) * window.innerHeight;
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
  }

  const coinsEl = $('#coins'), servedEl = $('#served');
  function refreshStats() {
    coinsEl.textContent = S.coins;
    servedEl.textContent = S.served;
  }
  refreshStats();

  const holdEl = $('#hold'), holdImg = $('#holdImg'), holdName = $('#holdName'), holdSteps = $('#holdSteps');
  function refreshHold() {
    const it = S.held;
    holdEl.hidden = !it;
    if (!it) {
      holdSprite.visible = fpHold.visible = false;
      return;
    }
    holdImg.src = dessertURL(it.d, !isDone(it));
    holdName.textContent = it.d.name;
    holdSteps.innerHTML = it.d.steps
      .map((st, i) => `<span class="step ${i < it.step ? 'done' : i === it.step ? 'now' : ''}">${STATIONS[st].verb}</span>`)
      .join('<span class="arrow" aria-hidden="true">›</span>') +
      (isDone(it) ? '<span class="step ready">Ready to serve</span>' : '');
    holdSprite.material.map = iconTex(it.d, !isDone(it));
    holdSprite.material.needsUpdate = true;
    fpHold.material.map = holdSprite.material.map;
    fpHold.material.needsUpdate = true;
    holdSprite.visible = S.view === 'iso';
    fpHold.visible = S.view === 'fp';
  }

  // ---------------------------------------------------------------- recipe book
  const book = $('#book'), grid = $('#grid'), tabs = $('#tabs'), bookSub = $('#bookSub');
  function wantedIds() {
    return S.customers.filter((c) => c.state === 'wait' || c.state === 'enter').map((c) => c.order.id);
  }
  function renderTabs() {
    const unlocked = unlockedCats();
    const orders = wantedIds().length;
    tabs.innerHTML = [
      `<button class="tab ${S.tab === 'orders' ? 'on' : ''}" data-tab="orders" id="tab-orders">Orders<span class="count">${orders}</span></button>`,
      ...CATEGORIES.map((c) => `<button class="tab ${S.tab === c.id ? 'on' : ''} ${unlocked.includes(c.id) ? '' : 'locked'}" data-tab="${c.id}" id="tab-${c.id}" style="--tab:${c.color}">${c.name}</button>`),
    ].join('');
  }
  function renderGrid() {
    const unlocked = unlockedCats();
    const wanted = wantedIds();
    let list;
    if (S.tab === 'orders') {
      list = [...new Set(wanted)].map((id) => BY_ID[id]);
    } else {
      list = DESSERTS.filter((d) => d.cat === S.tab);
    }
    if (!list.length) {
      grid.innerHTML = `<p class="empty">No orders yet. Customers will show up at the door soon.</p>`;
      return;
    }
    grid.innerHTML = list.map((d) => {
      const cat = CATEGORIES.find((c) => c.id === d.cat);
      const locked = !unlocked.includes(d.cat);
      const need = cat.unlock - S.served;
      return `<button class="card ${locked ? 'locked' : ''}" data-id="${d.id}" id="card-${d.id}" ${locked ? 'aria-disabled="true"' : ''}>
        ${wanted.includes(d.id) ? '<span class="badge">Ordered</span>' : ''}
        <img src="${dessertURL(d, locked)}" alt="" width="84" height="84">
        <span class="card-name">${d.name}</span>
        <span class="card-desc">${locked ? `Serve ${need} more treat${need === 1 ? '' : 's'} to unlock` : d.desc}</span>
        <span class="route">${d.steps.map((s) => STATIONS[s].verb).join(' › ')}</span>
      </button>`;
    }).join('');
  }
  function openBook(mode) {
    S.bookOpen = true;
    S.bookMode = mode;
    if (S.tab === 'orders' && !wantedIds().length) S.tab = 'pies';
    bookSub.textContent = mode === 'pick'
      ? 'Pick a treat to start. Orders from customers are marked.'
      : 'Browse recipes here. Start baking at the pantry shelf.';
    renderTabs();
    renderGrid();
    book.hidden = false;
    sfx.pop();
  }
  function closeBook() {
    S.bookOpen = false;
    book.hidden = true;
  }
  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('.tab');
    if (!b) return;
    S.tab = b.dataset.tab;
    renderTabs();
    renderGrid();
  });
  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    const d = BY_ID[card.dataset.id];
    if (card.classList.contains('locked')) {
      sfx.nope();
      return;
    }
    if (S.bookMode !== 'pick') {
      toast('Walk to the pantry shelf to start baking.');
      sfx.nope();
      return;
    }
    S.held = { d, step: 0 };
    closeBook();
    refreshHold();
    sfx.pop();
    fx.puff(stations.pantry.interact.clone().setY(0.4), 6, 0.4);
    fx.sparkles(player.root.position.clone().setY(1.6), 5);
    toast(`${d.name}: head to the ${STATIONS[d.steps[0]].name}.`);
  });
  $('#bookClose').addEventListener('click', closeBook);
  book.addEventListener('click', (e) => { if (e.target === book) closeBook(); });

  // ---------------------------------------------------------------- customers
  function freeSeats() { return W.seats.filter((s) => !s.occupant); }

  function spawnCustomer() {
    const seats = freeSeats();
    if (!seats.length) return;
    const seat = pick(seats);
    const kind = pick(['cat', 'bunny', 'bear', 'puppy']);
    const pool = ['apron', 'beret', 'bowtie', 'scarf'].sort(() => Math.random() - 0.5);
    const accessories = pool.slice(0, Math.floor(Math.random() * 3));
    if (accessories.includes('scarf') && accessories.includes('bowtie')) accessories.splice(accessories.indexOf('scarf'), 1);
    const a = makeAnimal(kind, { accessories });
    a.root.traverse((m) => { m.castShadow = false; });
    const cats = unlockedCats();
    const wanted = wantedIds();
    let options = DESSERTS.filter((d) => cats.includes(d.cat) && !wanted.includes(d.id));
    // newly unlocked categories show up more often
    const newest = CATEGORIES.filter((c) => cats.includes(c.id)).slice(-1)[0];
    if (Math.random() < 0.35) {
      const fresh = options.filter((d) => d.cat === newest.id);
      if (fresh.length) options = fresh;
    }
    const order = pick(options);
    const door = W.door.clone();
    a.root.position.copy(door);
    a.root.rotation.y = 0;
    scene.add(a.root);
    const steps = order.steps.length;
    const patience = 70 + steps * 22;
    const c = {
      a, kind, name: pick(NAMES[kind]), seat, order, state: 'enter', mood: 1,
      path: [new THREE.Vector3(door.x, 0, -0.45), seat.aisle.clone(), new THREE.Vector3(seat.x, 0, seat.z)],
      patience, maxPatience: patience, t: 0, hop: 0,
      el: bubble('order', `<img alt=""><span class="bar"><i></i></span>`),
      plate: null,
    };
    c.el.querySelector('img').src = dessertURL(order);
    c.bar = c.el.querySelector('.bar i');
    seat.occupant = c;
    S.customers.push(c);
    fx.puff(door.clone().setY(0.2), 8, 0.55);
    sfx.bell();
    if (S.bookOpen) { renderTabs(); renderGrid(); }
  }

  function leave(c, happy) {
    c.state = 'leave';
    c.mood = happy ? 1 : -1;
    const door = W.door.clone();
    c.path = [c.seat.aisle.clone(), new THREE.Vector3(door.x, 0, -0.45), door];
    c.el.hidden = true;
    c.a.root.position.y = 0;
    if (!happy) {
      fx.dots(c.a.root.position.clone().setY(1.9));
      sfx.sad();
      toast(`${c.name} got tired of waiting.`, 'sad');
    }
    c.seat.occupant = null;
  }

  function serve(c) {
    const item = S.held;
    S.held = null;
    refreshHold();
    c.state = 'eat';
    c.t = 0;
    c.hop = 1;
    c.el.hidden = true;
    const frac = c.patience / c.maxPatience;
    const earned = 10 + item.d.steps.length * 6 + Math.ceil(frac * 10);
    S.coins += earned;
    const before = unlockedCats().length;
    S.served += 1;
    save();
    refreshStats();
    const pos = c.a.root.position.clone().setY(1.6);
    fx.coins(pos, 6);
    fx.hearts(pos, 5);
    fx.sparkles(c.seat.plateSpot.clone(), 6);
    sfx.coin();
    c.plate = spriteFromCanvas(dessertCanvas(item.d, 128), 0.7);
    c.plate.position.copy(c.seat.plateSpot).setY(1.0);
    scene.add(c.plate);
    const coinPill = $('#coinPill');
    coinPill.classList.remove('bump');
    void coinPill.offsetWidth;
    coinPill.classList.add('bump');
    if (unlockedCats().length > before) {
      const cat = CATEGORIES.find((k) => k.id === unlockedCats().slice(-1)[0]);
      setTimeout(() => {
        toast(`New recipes unlocked: ${cat.name}!`, 'unlock');
        sfx.unlock();
      }, 700);
    } else {
      toast(`${c.name} loves the ${item.d.name}! +${earned} coins`, 'good');
    }
  }

  function updateCustomers(dt, cam) {
    for (let i = S.customers.length - 1; i >= 0; i--) {
      const c = S.customers[i];
      const r = c.a.root;
      let moving = false;
      if (c.state === 'enter' || c.state === 'leave') {
        const target = c.path[0];
        const d = new THREE.Vector3(target.x - r.position.x, 0, target.z - r.position.z);
        const dist = d.length();
        const speed = 1.9;
        if (dist < 0.05) {
          c.path.shift();
          if (!c.path.length) {
            if (c.state === 'enter') {
              c.state = 'wait';
              r.position.y = 0.3;
              r.rotation.y = c.seat.ry;
              c.el.hidden = false;
            } else {
              fx.puff(r.position.clone().setY(0.2), 8, 0.55);
              scene.remove(r);
              c.el.remove();
              S.customers.splice(i, 1);
              continue;
            }
          }
        } else {
          d.normalize();
          r.position.addScaledVector(d, Math.min(dist, speed * dt));
          const want = Math.atan2(d.x, d.z);
          r.rotation.y += angleDiff(want, r.rotation.y) * Math.min(1, dt * 10);
          moving = true;
        }
      } else if (c.state === 'wait') {
        if (!S.bookOpen && S.started) c.patience -= dt;
        const frac = clamp(c.patience / c.maxPatience, 0, 1);
        c.bar.style.width = `${frac * 100}%`;
        c.el.classList.toggle('low', frac < 0.3);
        c.a.root.position.y = 0.3;
        if (c.patience <= 0) leave(c, false);
      } else if (c.state === 'eat') {
        c.t += dt;
        c.a.headG.rotation.x = Math.sin(c.t * 9) * 0.1;
        if (c.plate) c.plate.position.y = 1.0 + Math.sin(c.t * 3) * 0.02;
        if (c.t > 1 && Math.random() < dt * 1.2) fx.hearts(r.position.clone().setY(1.7), 1);
        if (c.t > 3.6) {
          c.a.headG.rotation.x = 0;
          if (c.plate) {
            fx.sparkles(c.plate.position.clone(), 4);
            scene.remove(c.plate);
            c.plate = null;
          }
          leave(c, true);
        }
      }
      if (c.hop > 0) {
        c.hop = Math.max(0, c.hop - dt * 2.5);
        c.a.bob.position.y = Math.sin(c.hop * Math.PI) * 0.35;
      }
      animateAnimal(c.a, dt, S.time, moving, c.mood);
      if (c.state === 'wait') {
        project(c.el, v3.copy(r.position).setY(r.position.y + 1.5), cam);
      }
    }
  }

  // ---------------------------------------------------------------- interaction
  function interactables() {
    const list = stationList.map((s) => ({ kind: 'station', s, pos: s.interact, range: 1.35 }));
    for (const c of S.customers) {
      if (c.state === 'wait') list.push({ kind: 'customer', c, pos: c.a.root.position, range: 1.55 });
    }
    return list;
  }

  function findTarget() {
    const p = player.root.position;
    let best = null, bestScore = Infinity;
    for (const it of interactables()) {
      const dx = it.pos.x - p.x, dz = it.pos.z - p.z;
      const dist = Math.hypot(dx, dz);
      if (dist > it.range) continue;
      const cos = dist > 0.01 ? (dx * facing.x + dz * facing.z) / dist : 1;
      const score = dist * (1 + 0.8 * (1 - cos));
      if (score < bestScore) { best = it; bestScore = score; }
    }
    return best;
  }

  function describe(t) {
    const h = S.held;
    if (t.kind === 'customer') {
      const c = t.c;
      if (h && isDone(h)) return h.d.id === c.order.id ? `Serve ${h.d.name}` : `${c.name} wants ${c.order.name}`;
      return `${c.name} wants ${c.order.name}`;
    }
    const s = t.s;
    if (s.type === 'pantry') return h ? 'Pantry (hands full)' : 'Open recipe book';
    if (s.type === 'trash') return h ? `Toss ${h.d.name}` : 'Scrap basket';
    if (s.item) {
      if (s.done) return h ? `${s.name}: hands full` : `Take ${s.item.d.name}`;
      return `${STATIONS[s.type].ing} ${s.item.d.name}…`;
    }
    if (h && !isDone(h) && h.d.steps[h.step] === s.type) return `${STATIONS[s.type].verb} ${h.d.name}`;
    return s.name;
  }

  function interact() {
    if (!S.started || S.bookOpen) return;
    const t = findTarget();
    hop = 1;
    if (!t) return;
    const h = S.held;
    if (t.kind === 'customer') {
      const c = t.c;
      if (!h) {
        toast(`${c.name} would like ${c.order.name}. Start it at the pantry.`);
        sfx.pop();
      } else if (!isDone(h)) {
        toast(`${h.d.name} isn't finished yet. Next: ${STATIONS[h.d.steps[h.step]].name}.`);
        sfx.nope();
      } else if (h.d.id !== c.order.id) {
        toast(`${c.name} ordered ${c.order.name}, not ${h.d.name}.`);
        sfx.nope();
        c.hop = 0.6;
      } else {
        serve(c);
      }
      return;
    }
    const s = t.s;
    s.bounce = 1;
    if (s.type === 'pantry') {
      if (h) { toast('Your paws are full. Finish that treat or toss it in the scrap basket.'); sfx.nope(); return; }
      openBook('pick');
      return;
    }
    if (s.type === 'trash') {
      if (!h) { toast('The scrap basket is for treats that went wrong.'); return; }
      fx.puff(s.slot.clone().setY(0.9), 6, 0.4);
      sfx.whoosh();
      toast(`Tossed the ${h.d.name}.`);
      S.held = null;
      refreshHold();
      return;
    }
    if (s.item) {
      if (!s.done) { toast(`Still ${STATIONS[s.type].ing.toLowerCase()}… almost there!`); return; }
      if (h) { toast('Your paws are full!'); sfx.nope(); return; }
      S.held = s.item;
      s.item = null;
      s.done = false;
      setSpriteIcon(s.sprite, null);
      s.prog.hidden = true;
      refreshHold();
      sfx.pop();
      fx.sparkles(player.root.position.clone().setY(1.7), 4);
      if (isDone(S.held)) toast(`${S.held.d.name} is ready! Bring it to the customer.`, 'good');
      else toast(`Next: ${STATIONS[S.held.d.steps[S.held.step]].name}.`);
      return;
    }
    if (!h) { toast('Grab a recipe from the pantry shelf first.'); return; }
    if (isDone(h)) { toast(`${h.d.name} is ready. Serve it to a customer!`); return; }
    const need = h.d.steps[h.step];
    if (need !== s.type) {
      toast(`${h.d.name} needs the ${STATIONS[need].name} next.`);
      sfx.nope();
      return;
    }
    s.item = h;
    s.t = 0;
    s.dur = DUR[s.type];
    s.done = false;
    S.held = null;
    refreshHold();
    setSpriteIcon(s.sprite, s.item);
    s.prog.hidden = false;
    s.prog.classList.remove('ready');
    s.progLabel.textContent = STATIONS[s.type].ing;
    sfx.place();
    fx.puff(s.slot.clone().setY(s.slot.y - 0.4), 5, 0.35);
  }

  function updateStations(dt, cam) {
    for (const s of stationList) {
      const anim = s.anim;
      const working = s.item && !s.done;
      if (working) {
        s.t += dt;
        const k = Math.min(1, s.t / s.dur);
        s.progFill.style.strokeDashoffset = `${(1 - k) * 106.8}`;
        if (s.t >= s.dur) {
          s.done = true;
          s.item.step += 1;
          setSpriteIcon(s.sprite, s.item);
          s.prog.classList.add('ready');
          s.progLabel.textContent = isDone(s.item) ? 'Ready!' : 'Done!';
          s.progFill.style.strokeDashoffset = '0';
          sfx.ding();
          fx.sparkles(s.slot.clone(), 8);
          fx.puff(s.slot.clone().setY(s.slot.y - 0.3), 5, 0.35);
          s.bounce = 1;
        }
      }
      // appliance personalities
      if (s.type === 'bake') {
        const target = working ? 1.1 : 0.15;
        s.windowMat.emissiveIntensity += (target - s.windowMat.emissiveIntensity) * Math.min(1, dt * 4);
        s.glow.material.opacity = working ? 0.45 + Math.sin(S.time * 6) * 0.08 : 0.12;
        if (working && Math.random() < dt * 5) {
          const p = s.chimneyTop.clone();
          s.group.localToWorld(p);
          fx.steam(p);
        }
      }
      if (s.type === 'stove') {
        s.flame.material.opacity = working ? 0.55 + Math.sin(S.time * 14) * 0.12 : 0;
        if (working && Math.random() < dt * 4) {
          const p = new THREE.Vector3(-0.3, 1.4, 0);
          s.group.localToWorld(p);
          fx.steam(p);
        }
      }
      if (s.type === 'fridge' && working && Math.random() < dt * 3) {
        fx.sparkles(s.slot.clone().setY(1.6).add(new THREE.Vector3(0, 0, 0.6)), 1, 0.3);
      }
      if (s.whisk) s.whisk.rotation.y += working ? dt * 14 : 0;
      if (anim) {
        s.bounce = Math.max(0, s.bounce - dt * 3);
        const b = Math.sin(s.bounce * Math.PI) * 0.1;
        const wob = working ? Math.sin(S.time * 18) * 0.025 : 0;
        const breathe = Math.sin(S.time * 2 + s.slot.x) * 0.008;
        anim.scale.set(1 - b * 0.5 + wob, 1 + b + breathe - wob, 1 - b * 0.5 + wob);
      }
      if (s.face) {
        s.blinkT -= dt;
        if (s.blinkT < 0) s.blinkT = 2.5 + Math.random() * 3;
        const closed = working || s.blinkT < 0.13;
        for (const e of s.face.eyes) e.scale.y = closed ? 0.25 : 1.2;
      }
      // sprites & bubbles
      if (s.sprite.visible) {
        s.sprite.position.y = s.slot.y + Math.sin(S.time * 3 + s.slot.x) * 0.05 + (s.done ? 0.1 : 0);
        const sc = s.done ? 0.95 + Math.sin(S.time * 6) * 0.05 : 0.8;
        s.sprite.scale.set(sc, sc, 1);
        project(s.prog, v3.copy(s.slot).setY(s.slot.y + 0.55), cam);
      }
    }
  }

  function angleDiff(a, b) {
    let d = a - b;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  // ---------------------------------------------------------------- collisions
  function collide(p, r = 0.3) {
    p.x = clamp(p.x, ROOM.x0 + r + 0.05, ROOM.x1 - r - 0.1);
    p.z = clamp(p.z, ROOM.z0 + r + 0.05, ROOM.z1 - r - 0.1);
    for (const c of W.colliders) {
      if (c.type === 'circle') {
        const dx = p.x - c.x, dz = p.z - c.z;
        const d = Math.hypot(dx, dz), min = r + c.r;
        if (d < min && d > 1e-4) {
          p.x = c.x + (dx / d) * min;
          p.z = c.z + (dz / d) * min;
        }
      } else {
        const nx = clamp(p.x, c.x0, c.x1), nz = clamp(p.z, c.z0, c.z1);
        const dx = p.x - nx, dz = p.z - nz;
        const d = Math.hypot(dx, dz);
        if (d < r) {
          if (d > 1e-4) {
            p.x = nx + (dx / d) * r;
            p.z = nz + (dz / d) * r;
          } else {
            const pushes = [[c.x0 - r - p.x, 0], [c.x1 + r - p.x, 0], [0, c.z0 - r - p.z], [0, c.z1 + r - p.z]];
            pushes.sort((a, b) => Math.abs(a[0] + a[1]) - Math.abs(b[0] + b[1]));
            p.x += pushes[0][0];
            p.z += pushes[0][1];
          }
        }
      }
    }
  }

  // ---------------------------------------------------------------- input
  const keys = new Set();
  const stick = { x: 0, y: 0 };
  window.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea')) return;
    const k = e.key.toLowerCase();
    if (!S.started) {
      if (k === 'enter' || k === ' ') { e.preventDefault(); startGame(); }
      return;
    }
    if (S.bookOpen) {
      if (k === 'escape' || k === 'r' || k === 'b') { e.preventDefault(); closeBook(); }
      return;
    }
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (k === 'e' || k === ' ' || k === 'enter') { if (!e.repeat) interact(); return; }
    if (k === 'v') { toggleView(); return; }
    if (k === 'r' || k === 'b') { openBook('browse'); return; }
    keys.add(k);
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => keys.clear());

  // drag to look in baker's eyes view
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    if (S.view !== 'fp') return;
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    yaw -= (e.clientX - drag.x) * 0.006;
    pitch = clamp(pitch - (e.clientY - drag.y) * 0.004, -0.9, 0.5);
    drag.x = e.clientX;
    drag.y = e.clientY;
  });
  const endDrag = () => { drag = null; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  // touch joystick
  const stickEl = $('#stick'), knob = $('#knob');
  let stickId = null;
  function stickMove(e) {
    const r = stickEl.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const max = r.width * 0.36;
    const len = Math.hypot(dx, dy);
    if (len > max) { dx *= max / len; dy *= max / len; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    stick.x = dx / max;
    stick.y = -dy / max;
  }
  stickEl.addEventListener('pointerdown', (e) => { stickId = e.pointerId; stickEl.setPointerCapture(e.pointerId); stickMove(e); unlockAudio(); });
  stickEl.addEventListener('pointermove', (e) => { if (e.pointerId === stickId) stickMove(e); });
  const stickEnd = (e) => {
    if (e.pointerId !== stickId) return;
    stickId = null;
    stick.x = stick.y = 0;
    knob.style.transform = '';
  };
  stickEl.addEventListener('pointerup', stickEnd);
  stickEl.addEventListener('pointercancel', stickEnd);
  $('#useBtn').addEventListener('click', () => { unlockAudio(); interact(); });

  // HUD buttons
  $('#bookBtn').addEventListener('click', () => { unlockAudio(); if (S.started) openBook('browse'); });
  const viewBtn = $('#viewBtn');
  function toggleView() {
    S.view = S.view === 'iso' ? 'fp' : 'iso';
    viewBtn.textContent = S.view === 'iso' ? "Baker's eyes" : 'Diorama view';
    viewBtn.setAttribute('aria-pressed', S.view === 'fp');
    document.body.classList.toggle('fp', S.view === 'fp');
    if (S.view === 'fp') {
      yaw = player.root.rotation.y;
      pitch = -0.2;
      toast('Baker\'s eyes: W/S walk, A/D turn, drag to look around.');
    }
    refreshHold();
  }
  viewBtn.addEventListener('click', () => { unlockAudio(); toggleView(); viewBtn.blur(); });
  const muteBtn = $('#muteBtn');
  const refreshMute = () => {
    muteBtn.textContent = isMuted() ? 'Sound off' : 'Sound on';
    muteBtn.setAttribute('aria-pressed', !isMuted());
  };
  refreshMute();
  muteBtn.addEventListener('click', () => { unlockAudio(); setMuted(!isMuted()); refreshMute(); muteBtn.blur(); });

  // title
  const title = $('#title');
  function startGame() {
    if (S.started && title.hidden) return;
    unlockAudio();
    S.started = true;
    title.hidden = true;
    sfx.bell();
    toast('Welcome! Customers are on their way.');
    fx.sparkles(player.root.position.clone().setY(1.5), 8);
  }
  $('#startBtn').addEventListener('click', startGame);
  if (S.started) title.hidden = true;
  if (S.served > 0) $('#startBtn').textContent = 'Reopen the shop';

  // ---------------------------------------------------------------- loop
  const clock = new THREE.Clock();
  const move = new THREE.Vector3();
  function frame() {
    const dt = Math.min(0.05, clock.getDelta()) * (S.timeScale || 1);
    S.time += dt;
    const cam = S.view === 'iso' ? isoCam : fpCam;

    // input
    let ix = 0, iy = 0;
    if (keys.has('a') || keys.has('arrowleft')) ix -= 1;
    if (keys.has('d') || keys.has('arrowright')) ix += 1;
    if (keys.has('w') || keys.has('arrowup')) iy += 1;
    if (keys.has('s') || keys.has('arrowdown')) iy -= 1;
    if (Math.hypot(stick.x, stick.y) > 0.15) { ix = stick.x; iy = stick.y; }
    const active = S.started && !S.bookOpen;
    let moving = false;
    const p = player.root.position;
    if (active) {
      if (S.view === 'iso') {
        move.set(0, 0, 0).addScaledVector(camRight, ix).addScaledVector(new THREE.Vector3(-Math.SQRT1_2, 0, -Math.SQRT1_2), iy);
        const len = move.length();
        if (len > 0.05) {
          move.multiplyScalar(Math.min(1, len) / len);
          p.addScaledVector(move, 3.6 * dt);
          facing.copy(move).normalize();
          moving = true;
        }
        const want = Math.atan2(facing.x, facing.z);
        player.root.rotation.y += angleDiff(want, player.root.rotation.y) * Math.min(1, dt * 12);
      } else {
        yaw -= ix * dt * 2.4;
        facing.set(Math.sin(yaw), 0, Math.cos(yaw));
        if (Math.abs(iy) > 0.05) {
          p.addScaledVector(facing, iy * 3.2 * dt);
          moving = true;
        }
        player.root.rotation.y = yaw;
      }
      collide(p);
    }
    hop = Math.max(0, hop - dt * 4);
    animateAnimal(player, dt, S.time, moving);
    if (hop > 0) player.bob.position.y += Math.sin(hop * Math.PI) * 0.12;

    // cameras
    if (S.view === 'iso') {
      player.root.visible = true;
      const aspect = window.innerWidth / window.innerHeight;
      const goal = isoBase.clone();
      if (aspect < 0.9) {
        const along = camRight.dot(p);
        const room = 8.3;
        const lim = Math.max(0, room - halfW + 0.6);
        goal.addScaledVector(camRight, clamp(along, -lim, lim));
      }
      isoTarget.lerp(goal, Math.min(1, dt * 4));
      isoCam.position.copy(isoTarget).addScaledVector(isoDir, 60);
      isoCam.lookAt(isoTarget);
    } else {
      player.root.visible = false;
      fpCam.position.set(p.x, 1.2, p.z);
      fpCam.rotation.set(0, 0, 0);
      fpCam.rotation.order = 'YXZ';
      fpCam.rotation.y = yaw + Math.PI;
      fpCam.rotation.x = pitch;
    }

    // held item above the baker
    holdSprite.position.set(p.x, 1.95 + Math.sin(S.time * 3) * 0.05 + player.bob.position.y, p.z);

    // spawning
    if (S.started && !S.bookOpen) {
      S.spawnT -= dt;
      const waiting = S.customers.filter((c) => c.state !== 'leave').length;
      const maxC = S.served < 3 ? 2 : S.served < 10 ? 3 : 4;
      if (S.spawnT <= 0) {
        if (waiting < maxC && freeSeats().length) spawnCustomer();
        S.spawnT = 9 + Math.random() * 7 - Math.min(4, S.served * 0.15);
      }
    }

    updateStations(dt, cam);
    updateCustomers(dt, cam);
    fx.update(dt);

    // glows twinkle
    W.glows.forEach((g, i) => {
      g.material.opacity = g.userData.baseOpacity * (0.82 + 0.18 * Math.sin(S.time * 1.7 + i * 1.3));
    });
    const now = new Date();
    W.clockHands[0].rotation.z = -((now.getHours() % 12) + now.getMinutes() / 60) / 12 * Math.PI * 2;
    W.clockHands[1].rotation.z = -(now.getMinutes() / 60) * Math.PI * 2;

    // target label + hint
    const target = active ? findTarget() : null;
    if (target) {
      tagEl.hidden = false;
      const txt = describe(target);
      if (tagEl.dataset.txt !== txt) {
        tagEl.dataset.txt = txt;
        tagEl.innerHTML = `<kbd>E</kbd>${txt}`;
      }
      const pos = target.kind === 'customer' ? v3.copy(target.pos).setY(0.05) : v3.copy(target.pos).setY(0.05);
      project(tagEl, pos, cam);
      tagEl.style.transform += ' translateY(40px)';
      hint.textContent = '';
    } else {
      tagEl.hidden = true;
      if (S.started && !S.bookOpen) {
        hint.textContent = S.held
          ? isDone(S.held) ? `Bring the ${S.held.d.name} to a customer` : `Next stop: ${STATIONS[S.held.d.steps[S.held.step]].name}`
          : 'Visit the pantry shelf to pick a recipe';
      } else hint.textContent = '';
    }

    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) toastEl.classList.remove('show');
    }

    renderer.render(scene, cam);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // expose a tiny hook for automated checks
  window.__bakery = { S, renderer, stations, interact, spawnCustomer, player, toggleView, openBook, closeBook };
}

const boot = window.claude?.hot?.ready ? (fn) => window.claude.hot.ready(fn) : (fn) => fn(window.claude?.hot?.data ?? {});
boot(start);
