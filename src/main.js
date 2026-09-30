import * as THREE from 'three';
import { outlineUniforms, setOutlineScale, setMaxAnisotropy } from './toon.js';
import { buildWorld, ROOM, FP_LAYER } from './world.js';
import { makeAnimal, animateAnimal } from './characters.js';
import { DESSERTS, BY_ID, CATEGORIES, STATIONS, TOPPINGS, TOPPING_BY_ID, ING_PREP, dessertURL } from './desserts.js';
import { ING_BY_ID, prepModel } from './ingredients.js';
import { createGame, MODE_HINT, TAP_LABEL } from './minigames.js';
import { Shop, UPGRADES, DECOR, freshStock } from './shop.js';
import { buildDecorPieces, buildOpenSign } from './decor.js';
import { dessertModel, bowlModel } from './dessert3d.js';
import { buildHighlight } from './merge.js';
import { ViewModel } from './viewmodel.js';
import { Input } from './input.js';
import { UI, stepWhere, stars } from './ui.js';
import { FX } from './fx.js';
import { sfx, unlockAudio, isMuted, setMuted } from './audio.js';

const $ = (s) => document.querySelector(s);
const BG = '#F9E2C8';
const SAVE_KEY = 'hillside-bakery-save';
const REACH = 2.4;
const EYE = 1.25;
const NAMES = {
  cat: ['Miso', 'Toffee', 'Biscuit', 'Nutmeg'],
  bunny: ['Clover', 'Mochi', 'Pip', 'Daisy'],
  bear: ['Honey', 'Bruno', 'Maple', 'Fig'],
  puppy: ['Waffles', 'Pudding', 'Scout', 'Peaches'],
};
const PASSIVE = { bake: true, cook: true, chill: true };
const ACTIVE = { mix: true, prep: true, decor: true };
const BAKE_TOASTY = 7;
// the shop day: 8 AM morning prep, open 9 to 5, last orders at 4:30
const T_MORNING = 8 * 60, T_OPEN = 9 * 60, T_LAST = 16.5 * 60, T_CLOSE = 17 * 60;
const MIN_PER_SEC = 480 / 390; // an open day lasts about six and a half minutes
const EXTRA_TOPS = ['sprinkles', 'cherry', 'whipped', 'fudge', 'caramel', 'strawberry', 'powdered', 'pink', 'shavings'];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const an = (name, cap = false) => `${/^[aeiou]/i.test(name) ? (cap ? 'An' : 'an') : (cap ? 'A' : 'a')} ${name}`;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

const newReport = () => ({ served: 0, coins: 0, tips: 0, stars: 0, left: 0, favs: {} });

function loadSave() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') || {}; } catch { s = {}; }
  const served = s.served | 0;
  // older saves unlocked menus by treats served; carry that over as days
  const day = s.day | 0 || (served >= 14 ? 5 : served >= 10 ? 4 : served >= 6 ? 3 : served >= 3 ? 2 : 1);
  const stock = freshStock();
  if (s.stock) for (const k of Object.keys(stock)) if (typeof s.stock[k] === 'number') stock[k] = s.stock[k];
  const known = (list, ids) => (Array.isArray(ids) ? ids.filter((id) => list.some((u) => u.id === id)) : []);
  return { coins: s.coins | 0, served, day, stock, upgrades: known(UPGRADES, s.upgrades), decor: known(DECOR, s.decor) };
}

async function waitForFonts() {
  try {
    await Promise.race([
      Promise.all([document.fonts.load('600 40px Fredoka'), document.fonts.load('700 40px Fredoka')]),
      new Promise((r) => setTimeout(r, 1800)),
    ]);
  } catch { /* fall back to system font */ }
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

async function start(hotData = {}) {
  await waitForFonts();

  // ---------------------------------------------------------------- renderer
  const canvas = $('#scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  let pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.autoClear = false;
  renderer.setClearColor(BG);
  setMaxAnisotropy(renderer.capabilities.getMaxAnisotropy());

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.add(new THREE.HemisphereLight('#FFF4DE', '#E2BE98', 1.35));
  const sun = new THREE.DirectionalLight('#FFE6C2', 1.5);
  sun.position.set(4.5, 13, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);

  const W = buildWorld(scene);
  renderer.shadowMap.needsUpdate = true;
  const fx = new FX(scene);
  const vm = new ViewModel();
  const ui = new UI();
  const input = new Input(canvas);
  const stations = W.stations;
  const stationList = Object.values(stations);
  const decorPieces = buildDecorPieces(scene);
  const sign = buildOpenSign();
  sign.group.position.set(4.3, 1.3, -4.82);
  scene.add(sign.group);
  {
    const box = new THREE.Box3().setFromObject(sign.group).expandByVector(V3(0.12, 0.12, 0.2));
    W.interact.push({ kind: 'sign', obj: sign.group, box, hl: buildHighlight(sign.group) });
  }

  // ---------------------------------------------------------------- cameras
  const cam = new THREE.PerspectiveCamera(70, 1, 0.05, 200);
  cam.rotation.order = 'YXZ';
  const ELEV = THREE.MathUtils.degToRad(35);
  const isoDir = V3(Math.cos(ELEV) * Math.SQRT1_2, Math.sin(ELEV), Math.cos(ELEV) * Math.SQRT1_2);
  const isoUp = V3(-Math.sin(ELEV) * Math.SQRT1_2, Math.cos(ELEV), -Math.sin(ELEV) * Math.SQRT1_2);
  const isoTarget = isoUp.clone().multiplyScalar(1.1);
  const isoRight = V3(Math.SQRT1_2, 0, -Math.SQRT1_2);
  const TITLE_DIST = 72;
  let aspect = 1;
  const fpFov = () => (aspect < 1 ? 80 : 72);
  const titleFov = () => {
    const halfV = aspect > 1.25 ? Math.max(7.8, 14.5 / aspect) : Math.max(9.5, 9.2 / aspect);
    return THREE.MathUtils.radToDeg(2 * Math.atan(halfV / TITLE_DIST));
  };

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    aspect = w / h;
    renderer.setSize(w, h, false);
    cam.aspect = aspect;
    cam.updateProjectionMatrix();
    outlineUniforms.resolution.value.set(w, h);
    setOutlineScale(clamp(Math.min(w, h) / 820, 0.6, 1.15));
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------------------------------------------------------------- player
  const fox = makeAnimal('fox', { accessories: ['apron', 'chef'], apronColor: '#EE93A6' });
  fox.root.position.set(-0.9, 0, 2.3);
  fox.root.rotation.y = 0.8;
  fox.root.traverse((m) => { m.castShadow = false; });
  scene.add(fox.root);
  const P = fox.root.position;
  let yaw = 0.46, pitch = -0.12, bobPhase = 0, stepAcc = 0;

  // ---------------------------------------------------------------- state
  const saved = { ...loadSave(), ...(hotData.save || {}) };
  const S = {
    mode: 'title',
    coins: saved.coins,
    served: saved.served,
    day: saved.day,
    stock: saved.stock,
    upgrades: saved.upgrades,
    decor: saved.decor,
    phase: 'morning',
    clock: T_MORNING,
    special: null,
    report: newReport(),
    tickets: [],
    activeId: null,
    carry: null,
    customers: [],
    spawnT: 4,
    time: 0,
    timeScale: 1,
    focus: null,
    target: null,
    swoop: null,
    camTween: null,
    tips: {},
  };
  let ticketSeq = 1, itemSeq = 1;
  const saveData = () => ({ coins: S.coins, served: S.served, day: S.day, stock: S.stock, upgrades: S.upgrades, decor: S.decor });
  window.claude?.hot?.snapshot?.(() => ({ save: saveData() }));

  const save = () => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(saveData())); } catch { /* ignore */ }
  };
  const unlockedCats = () => CATEGORIES.filter((c) => S.day >= c.day).map((c) => c.id);
  const activeTicket = () => S.tickets.find((t) => t.id === S.activeId) || null;
  const curStep = (it) => it.steps[it.step];
  const isDone = (it) => it.step >= it.steps.length;
  const has = (id) => S.upgrades.includes(id) || S.decor.includes(id);
  // upgrades tune the stations
  const stepDur = (step) => step.dur * ({ bake: has('oven') ? 0.7 : 1, cook: has('pot') ? 0.7 : 1, chill: has('freezer') ? 0.6 : 1 }[step.t] || 1);
  const goldenWin = () => (has('thermo') ? 14 : 7);
  const patienceMul = () => (has('cushions') ? 1.25 : 1) + DECOR.reduce((a, d) => a + (has(d.id) && d.patience ? d.patience : 0), 0);
  const coinMul = () => 1 + DECOR.reduce((a, d) => a + (has(d.id) && d.coins ? d.coins : 0), 0);
  const stepsFor = (d) => d.steps.map((st) => ({ ...st, tops: st.tops ? [...st.tops] : undefined }));
  const tip = (key, msg) => { if (!S.tips[key]) { S.tips[key] = true; ui.toast(msg, 'tip'); } };
  ui.stats(S.coins, S.served);

  // ---------------------------------------------------------------- items

  function itemLook(it) {
    const steps = it.steps;
    if (it.preview) it = { ...it, step: it.step + 1, burnt: it.previewBurnt || it.burnt };
    let form = 'bowl';
    const bits = [];
    for (let i = 0; i < steps.length && i <= it.step; i++) {
      const s = steps[i];
      if (i < it.step) {
        if (s.t === 'gather') { if (form !== 'model') bits.push(...s.items); }
        else if (s.t === 'mix') { if (form === 'bowl') form = 'batter'; }
        else form = 'model';
      } else if (s.t === 'gather' && form !== 'model') {
        bits.push(...it.got);
      }
    }
    if (form !== 'model') return { kind: 'bowl', bits: form === 'batter' ? bits.slice(-6) : bits, batter: form === 'batter' ? it.d.batter : null };
    const rest = steps.slice(it.step);
    return {
      kind: 'model',
      bare: rest.some((s) => s.t === 'decor'),
      raw: rest.some((s) => s.t === 'bake' || s.t === 'cook'),
      burnt: it.burnt,
    };
  }

  function stationShowsItem(st) {
    if (st.type === 'mix') return false;
    if (st.type === 'chill') return !!st.done;
    return true;
  }

  function placeItem(it) {
    if (it.obj) it.obj.removeFromParent();
    const look = itemLook(it);
    const obj = look.kind === 'bowl' ? bowlModel(look.bits, look.batter) : dessertModel(it.d, look);
    it.obj = obj;
    if (it.where === 'hands') {
      vm.setHeld(obj);
    } else if (it.where === 'station') {
      obj.position.copy(it.station.slot);
      obj.visible = stationShowsItem(it.station);
      scene.add(obj);
    }
  }

  function newItem(tk) {
    const it = { id: itemSeq++, d: tk.d, steps: tk.steps, ticket: tk, step: 0, got: new Set(), raw: new Set(), stars: 3, burnt: 0, scorched: false, mistakes: 0, where: 'hands', station: null, obj: null, work: null, decorIdx: 0 };
    tk.item = it;
    return it;
  }

  function toHands(it) {
    it.where = 'hands';
    it.station = null;
    S.carry = it;
    if (it.ticket) S.activeId = it.ticket.id;
    placeItem(it);
  }

  function nextStepText(it) {
    if (isDone(it)) return it.ticket ? `ready to serve ${it.ticket.customer.name}` : 'ready to serve';
    const s = curStep(it);
    if (s.t === 'gather') {
      const need = s.items.filter((id) => !it.got.has(id)).map((id) => ING_BY_ID[id].name);
      const raw = [...it.raw].map((id) => ING_PREP[id].label.toLowerCase());
      if (!need.length && raw.length) return `${raw.join(', ')} at the Island`;
      return `gather ${need.join(', ')} (${stepWhere(s)})${raw.length ? `, then ${raw.join(', ')} at the Island` : ''}`;
    }
    if (s.t === 'decor') return `decorate at the ${STATIONS.decor.name}`;
    return `${s.label.toLowerCase()} at the ${stepWhere(s)}`;
  }

  // ---------------------------------------------------------------- tickets

  function allItems() {
    const list = [];
    if (S.carry) list.push(S.carry);
    for (const st of stationList) if (st.item) list.push(st.item);
    return list;
  }

  function makeVariant(d) {
    const steps = stepsFor(d);
    const decorIdx = steps.map((x) => x.t).lastIndexOf('decor');
    const allTops = steps.filter((x) => x.t === 'decor').flatMap((x) => x.tops);
    const opts = [];
    const extra = EXTRA_TOPS.filter((t) => !allTops.includes(t));
    if (extra.length) opts.push('extra', 'extra');
    if (allTops.includes('nuts')) opts.push('nonuts', 'nonuts');
    if (steps.some((x) => x.t === 'bake')) opts.push('toasty');
    opts.push('rush');
    const kind = pick(opts);
    if (kind === 'extra') {
      const top = pick(extra);
      if (decorIdx >= 0) steps[decorIdx].tops.push(top);
      else steps.push({ t: 'decor', tops: [top], label: 'Decorate', station: 'decor' });
      const name = TOPPING_BY_ID[top].name;
      return { steps, variant: { kind, top, label: top === 'pink' ? 'Make it pink!' : `+ ${name}`, line: top === 'pink' ? 'and make it pink' : `with extra ${name.toLowerCase()}` } };
    }
    if (kind === 'nonuts') {
      for (const x of steps) if (x.t === 'decor') x.tops = x.tops.filter((t) => t !== 'nuts');
      return { steps: steps.filter((x) => x.t !== 'decor' || x.tops.length), variant: { kind, label: 'No nuts', line: 'but no nuts, please' } };
    }
    if (kind === 'toasty') return { steps, variant: { kind, label: 'Extra toasty', line: 'extra toasty, if you can' } };
    return { steps, variant: { kind, label: 'In a hurry', line: "and I'm in a bit of a hurry" } };
  }

  function createTicket(c, d, combo = null) {
    const used = new Set(S.tickets.map((t) => t.num));
    let num = 1;
    while (used.has(num)) num++;
    const wantsVariant = (S.day >= 2 || S.report.served >= 2) && Math.random() < (S.day >= 3 ? 0.45 : 0.3);
    const { steps, variant } = wantsVariant ? makeVariant(d) : { steps: stepsFor(d), variant: null };
    const tk = { id: ticketSeq++, num, customer: c, d, steps, variant, combo, special: S.special === d, item: null };
    // a treat nobody is waiting for any more can join this order
    const orphan = allItems().find((it) => !it.ticket && it.d.id === d.id);
    if (orphan) {
      orphan.ticket = tk;
      orphan.steps = tk.steps;
      orphan.decorIdx = 0;
      tk.item = orphan;
    }
    c.tickets.push(tk);
    S.tickets.push(tk);
    if (!activeTicket() || !activeTicket().item) S.activeId = tk.id;
    return tk;
  }

  function removeTicket(tk) {
    S.tickets = S.tickets.filter((t) => t !== tk);
    if (tk.item) tk.item.ticket = null;
    tk.customer.tickets = (tk.customer.tickets || []).filter((t) => t !== tk);
    if (S.activeId === tk.id) S.activeId = S.tickets[0]?.id ?? null;
  }

  function selectTicket(num) {
    const tk = S.tickets.find((t) => t.num === num);
    if (!tk) return;
    S.activeId = tk.id;
    sfx.pop();
  }

  function cycleTicket() {
    if (!S.tickets.length) return;
    const sorted = [...S.tickets].sort((a, b) => a.num - b.num);
    const i = sorted.findIndex((t) => t.id === S.activeId);
    S.activeId = sorted[(i + 1) % sorted.length].id;
    sfx.pop();
  }

  // ---------------------------------------------------------------- stock

  function reserved() {
    // ingredients still to be grabbed for open tickets
    const r = {};
    for (const tk of S.tickets) {
      const it = tk.item;
      tk.steps.forEach((st, i) => {
        if (st.t !== 'gather' || (it && i < it.step)) return;
        for (const id of st.items) if (!(it && i === it.step && it.got.has(id))) r[id] = (r[id] || 0) + 1;
      });
    }
    return r;
  }

  function canMake(d, res = reserved()) {
    return d.ingredients.every((id) => (S.stock[id] ?? 0) - (res[id] || 0) >= d.steps.filter((x) => x.t === 'gather' && x.items.includes(id)).length);
  }

  // ---------------------------------------------------------------- customers

  function freeSeats() { return W.seats.filter((s) => !s.occupant); }

  function chooseOrder(exclude = []) {
    const cats = unlockedCats();
    const res = reserved();
    const wanted = [...S.customers.flatMap((c) => c.orders.map((o) => o.id)), ...exclude];
    let options = DESSERTS.filter((d) => cats.includes(d.cat) && !wanted.includes(d.id) && canMake(d, res));
    if (!options.length) options = DESSERTS.filter((d) => cats.includes(d.cat) && canMake(d, res));
    if (!options.length) return null;
    if (S.day === 1 && S.report.served < 3) {
      const short = options.filter((d) => d.steps.length <= 5);
      if (short.length) options = short;
    }
    if (S.special && options.includes(S.special) && Math.random() < 0.25) return S.special;
    // the newest menu section shows up a little more often
    const newest = CATEGORIES.filter((c) => cats.includes(c.id)).slice(-1)[0];
    if (S.day > 1 && Math.random() < 0.3) {
      const fresh = options.filter((d) => d.cat === newest.id);
      if (fresh.length) options = fresh;
    }
    return pick(options);
  }

  function spawnCustomer() {
    const seats = freeSeats();
    if (!seats.length) return null;
    const order = chooseOrder();
    if (!order) {
      tip('emptyPantry', 'The pantry is running low! Nobody can order until you restock at the morning market.');
      return null;
    }
    const orders = [order];
    // regulars sometimes want a treat for a friend too
    if (S.day >= 3 && Math.random() < 0.22) {
      const second = chooseOrder([order.id]);
      if (second && second.steps.length <= 6) orders.push(second);
    }
    const seat = pick(seats);
    const kind = pick(['cat', 'bunny', 'bear', 'puppy']);
    const pool = ['apron', 'beret', 'bowtie', 'scarf'].sort(() => Math.random() - 0.5);
    const accessories = pool.slice(0, Math.floor(Math.random() * 3));
    if (accessories.includes('scarf') && accessories.includes('bowtie')) accessories.splice(accessories.indexOf('scarf'), 1);
    const a = makeAnimal(kind, { accessories });
    a.root.traverse((m) => { m.castShadow = false; });
    const door = W.door.clone();
    a.root.position.copy(door);
    scene.add(a.root);
    const c = {
      a, kind, name: pick(NAMES[kind]), seat, order, orders, state: 'enter', mood: 1,
      path: [V3(door.x, 0, -0.45), seat.aisle.clone(), V3(seat.x, 0, seat.z)],
      patience: 150, maxPatience: 150, t: 0, hop: 0, bites: 0, tickets: [], plates: [], coinBonus: 1,
      bub: ui.bubble('order', '<span class="bang">!</span><span class="imgs"></span><span class="bar"><i></i></span>'),
      say: ui.bubble('say', ''),
      sayT: 0,
      hl: buildHighlight(a.root),
    };
    c.bubImgs = c.bub.querySelector('.imgs');
    c.bubBar = c.bub.querySelector('.bar i');
    refreshBubble(c);
    seat.occupant = c;
    S.customers.push(c);
    fx.puff(door.clone().setY(0.2), 8, 0.55);
    sfx.bell();
    tip('firstCustomer', 'A customer is here! Walk over, look at them and press E to take their order.');
    return c;
  }

  function refreshBubble(c) {
    const list = c.state === 'ready' ? c.orders.map((d) => ({ d, tag: '' })) : c.tickets.map((tk) => ({ d: tk.d, tag: tk.variant ? tk.variant.label : '' }));
    c.bubImgs.innerHTML = list.map(({ d, tag }) => `<span class="bo"><img src="${dessertURL(d)}" alt="">${tag ? `<em>${tag}</em>` : ''}</span>`).join('');
  }

  function say(c, text, secs = 2.4) {
    c.say.textContent = text;
    c.say.hidden = false;
    c.sayT = secs;
  }

  function takeOrder(c) {
    c.state = 'wait';
    const steps = c.orders.reduce((a, d) => a + d.steps.length, 0);
    c.patience = c.maxPatience = (200 + steps * (c.orders.length > 1 ? 38 : 45)) * patienceMul();
    c.bub.classList.add('taken');
    const tks = c.orders.map((d, i) => createTicket(c, d, c.orders.length > 1 ? `${i + 1} of ${c.orders.length}` : null));
    const rush = tks.find((t) => t.variant && t.variant.kind === 'rush');
    if (rush) {
      c.patience = c.maxPatience = c.maxPatience * 0.6;
      c.coinBonus = 1.5;
    }
    refreshBubble(c);
    const first = tks[0];
    let line = c.orders.length > 1
      ? `${an(c.orders[0].name, true)} and ${an(c.orders[1].name)}, please!`
      : pick([`One ${first.d.name}, please!`, `Could I have the ${first.d.name}?`, `${first.d.name}, pretty please!`]);
    const v = tks.find((t) => t.variant);
    if (v) line = line.replace(/[!?]$/, '') + `, ${v.variant.line}!`;
    say(c, line, 3.2);
    sfx.place();
    ui.bump('#tickets');
    tip('firstTicket', 'Your ticket shows the recipe. Start by gathering ingredients from Dry Storage (left wall) and Cold Storage (front).');
    if (v) tip('variant', `Special request! The ticket shows "${v.variant.label}". Follow the ticket, not the recipe book.`);
    if (c.orders.length > 1) tip('combo', `${c.name} ordered two treats. They wait for both before eating.`);
  }

  function leave(c, happy) {
    c.state = 'leave';
    c.mood = happy ? 1 : -1;
    const door = W.door.clone();
    c.path = [c.seat.aisle.clone(), V3(door.x, 0, -0.45), door];
    c.bub.hidden = true;
    c.a.root.position.y = 0;
    c.hl.set(false);
    for (const tk of [...c.tickets]) removeTicket(tk);
    for (const p of c.plates) scene.remove(p);
    c.plates = [];
    if (!happy) {
      fx.dots(c.a.root.position.clone().setY(1.9));
      sfx.sad();
      ui.toast(`${c.name} got tired of waiting and went home.`, 'sad');
      S.report.left += 1;
    }
    c.seat.occupant = null;
  }

  /** The ticket of this customer that the carried treat belongs to, if any. */
  function ticketFor(c, it) {
    if (!it || !isDone(it)) return null;
    if (it.ticket && c.tickets.includes(it.ticket)) return it.ticket;
    return c.tickets.find((t) => t.d.id === it.d.id && (!t.item || t.item === it)) || null;
  }

  function serve(c, tk) {
    const it = S.carry;
    S.carry = null;
    vm.setHeld(null);
    if (it.obj) it.obj.removeFromParent();
    if (it.ticket && it.ticket !== tk) it.ticket.item = null;
    c.hop = 1;
    const frac = clamp(c.patience / c.maxPatience, 0, 1);
    const base = 8 + tk.steps.length * 5 + it.stars * 6 + Math.ceil(frac * 10) + (tk.variant && tk.variant.kind !== 'rush' ? 6 : 0);
    let mul = coinMul() * c.coinBonus;
    if (tk.special) mul *= has('chalkboard') ? 2 : 1.5;
    const earned = Math.round(base * mul);
    const tipCoins = it.stars === 3 && has('tipjar') ? 12 : 0;
    S.coins += earned + tipCoins;
    S.served += 1;
    const R = S.report;
    R.served += 1;
    R.coins += earned + tipCoins;
    R.tips += tipCoins;
    R.stars += it.stars;
    R.favs[it.d.id] = (R.favs[it.d.id] || 0) + it.stars;
    save();
    ui.stats(S.coins, S.served);
    ui.bump('#coinPill');
    removeTicket(tk);
    // plates sit side by side for two-treat orders
    const plate = dessertModel(it.d, { burnt: it.burnt });
    const toTable = V3(W.tables[c.seat.table].x - c.seat.x, 0, W.tables[c.seat.table].z - c.seat.z).normalize();
    const side = V3(-toTable.z, 0, toTable.x).multiplyScalar(c.plates.length ? 0.2 : c.orders.length > 1 ? -0.2 : 0);
    plate.position.copy(c.seat.plateSpot).add(side);
    if (c.orders.length > 1) plate.scale.setScalar(0.85);
    scene.add(plate);
    c.plates.push(plate);
    const head = c.a.root.position.clone().setY(1.6);
    fx.coins(head, 6);
    fx.hearts(head, it.stars + 2);
    fx.sparkles(plate.position.clone().setY(0.9), 6);
    sfx.coin();
    setTimeout(() => sfx.star(it.stars), 250);
    const extra = [tipCoins ? ` +${tipCoins} tip` : '', tk.special ? ' (special!)' : ''].join('');
    if (c.tickets.length) {
      refreshBubble(c);
      say(c, `${stars(it.stars)} Ooh! And my ${c.tickets[0].d.name}?`, 2.8);
      ui.toast(`Served the ${it.d.name}! ${stars(it.stars)} +${earned} coins${extra}. One more for ${c.name}.`, 'good');
      return;
    }
    c.state = 'eat';
    c.t = 0;
    c.bub.hidden = true;
    c.hl.set(false);
    const lines = { 3: ['Perfect!', 'Just like grandma makes!', 'The best in the hills!'], 2: ['Yummy!', 'So tasty!'], 1: ['A little toasty… but sweet!', 'Mmm, crunchy!'] };
    say(c, `${stars(it.stars)} ${pick(lines[it.stars])}`, 2.8);
    ui.toast(`${c.name} loved the ${it.d.name}! ${stars(it.stars)} +${earned} coins${extra}`, 'good');
  }

  function updateCustomers(dt) {
    for (let i = S.customers.length - 1; i >= 0; i--) {
      const c = S.customers[i];
      const r = c.a.root;
      let moving = false;
      if (c.state === 'enter' || c.state === 'leave') {
        const target = c.path[0];
        const d = V3(target.x - r.position.x, 0, target.z - r.position.z);
        const dist = d.length();
        if (dist < 0.05) {
          c.path.shift();
          if (!c.path.length) {
            if (c.state === 'enter') {
              c.state = 'ready';
              r.position.y = 0.3;
              r.rotation.y = c.seat.ry;
            } else {
              fx.puff(r.position.clone().setY(0.2), 8, 0.55);
              scene.remove(r);
              c.bub.remove();
              c.say.remove();
              S.customers.splice(i, 1);
              continue;
            }
          }
        } else {
          d.normalize();
          r.position.addScaledVector(d, Math.min(dist, 1.9 * dt));
          const want = Math.atan2(d.x, d.z);
          r.rotation.y += angleDiff(want, r.rotation.y) * Math.min(1, dt * 10);
          moving = true;
        }
      } else if (c.state === 'ready' || c.state === 'wait') {
        const paused = ['book', 'pause', 'title', 'summary', 'market'].includes(S.mode);
        if (!paused) c.patience -= dt;
        const frac = clamp(c.patience / c.maxPatience, 0, 1);
        c.bubBar.style.width = `${frac * 100}%`;
        c.bub.classList.toggle('low', frac < 0.3);
        r.position.y = 0.3;
        if (c.patience <= 0) leave(c, false);
      } else if (c.state === 'eat') {
        c.t += dt;
        c.a.headG.rotation.x = Math.sin(c.t * 9) * 0.1;
        const bites = Math.floor(c.t / 1.3);
        if (bites > c.bites && c.plates.length) {
          c.bites = bites;
          for (const p of c.plates) p.scale.setScalar(Math.max(0.2, (c.plates.length > 1 ? 0.85 : 1) - bites * 0.28));
          fx.puff(c.seat.plateSpot.clone().setY(0.75), 3, 0.25);
        }
        if (c.t > 1 && Math.random() < dt * 1.2) fx.hearts(r.position.clone().setY(1.7), 1);
        if (c.t > 4.2) {
          c.a.headG.rotation.x = 0;
          if (c.plates.length) {
            fx.sparkles(c.seat.plateSpot.clone().setY(0.8), 4);
            for (const p of c.plates) scene.remove(p);
            c.plates = [];
          }
          leave(c, true);
        }
      }
      if (c.hop > 0) {
        c.hop = Math.max(0, c.hop - dt * 2.5);
        c.a.bob.position.y = Math.sin(c.hop * Math.PI) * 0.35;
      }
      // look at the baker when they're close
      const dx = P.x - r.position.x, dz = P.z - r.position.z;
      const near = Math.hypot(dx, dz) < 3.2 && c.state !== 'enter' && c.state !== 'leave';
      const look = near ? angleDiff(Math.atan2(dx, dz), r.rotation.y) : 0;
      animateAnimal(c.a, dt, S.time, moving, c.mood, { look, wave: c.state === 'ready' });
      if (c.sayT > 0) {
        c.sayT -= dt;
        if (c.sayT <= 0) c.say.hidden = true;
      }
    }
  }

  // ---------------------------------------------------------------- the shop day

  const shop = new Shop({
    onChange: (kind, id) => {
      if (kind === 'nope') return sfx.nope();
      if (kind === 'decor') {
        sfx.unlock();
        applyDecor();
        ui.toast(`${DECOR.find((d) => d.id === id).name} added to the shop!`, 'unlock');
      } else sfx.coin();
      ui.stats(S.coins, S.served);
      save();
    },
    onOpen: () => closeMarket(),
    onShop: () => openMarket(false),
  });
  shop.bind(S);

  function applyDecor() {
    decorPieces.set(S.decor, W.colliders);
    decorPieces.setSpecial(S.special);
    renderer.shadowMap.needsUpdate = true;
  }

  function clockText() {
    const m = Math.floor(S.clock);
    const h = Math.floor(m / 60), mm = m % 60;
    const t = `${((h + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
    if (S.phase === 'morning') return `${t} · Morning`;
    if (S.phase === 'closing') return 'Closing time';
    return t;
  }

  function startMorning() {
    S.phase = 'morning';
    S.clock = T_MORNING;
    S.report = newReport();
    const menu = DESSERTS.filter((d) => unlockedCats().includes(d.cat));
    S.special = pick(menu.filter((d) => canMake(d)).length ? menu.filter((d) => canMake(d)) : menu);
    sign.set(false);
    applyDecor();
    ui.toast(`Good morning! Day ${S.day}. Today's special is the ${S.special.name}. Flip the sign on the front door to open.`, 'tip');
  }

  function flipSign() {
    if (S.phase === 'morning') return openShop();
    if (S.phase === 'open') return ui.toast('The shop is open until 5 PM.');
    ui.toast('Closed for the day. Finish your last orders!');
  }

  function openShop() {
    S.phase = 'open';
    S.clock = Math.max(S.clock, T_OPEN);
    S.spawnT = 2.5;
    sign.set(true);
    sfx.bell();
    fx.sparkles(sign.group.position.clone(), 6, 0.3);
    const fresh = CATEGORIES.filter((c) => c.day === S.day);
    ui.toast(fresh.length && S.day > 1 ? `We're open! New on the menu: ${fresh.map((c) => c.name).join(', ')}.` : "We're open! Customers come in through the front door.", 'good');
  }

  function closeShop() {
    S.phase = 'closing';
    sign.set(false);
    sfx.bell();
    // anyone still waiting gets their treat soon, or heads home
    for (const c of S.customers) if (c.state === 'ready' || c.state === 'wait') c.patience = Math.min(c.patience, 90);
    ui.toast(S.customers.some((c) => c.state === 'ready' || c.state === 'wait') ? "Closing time! Finish the last orders and we'll call it a day." : 'Closing time!', 'tip');
  }

  function endDay() {
    if (S.focus) leaveFocus();
    S.mode = 'summary';
    setTarget(null);
    if (input.locked) expectUnlock = true;
    input.exitLock();
    const R = S.report;
    const favId = Object.entries(R.favs).sort((a, b) => b[1] - a[1])[0]?.[0];
    R.best = favId ? BY_ID[favId] : null;
    shop.showSummary({ report: R });
    S.day += 1;
    save();
    sfx.unlock();
  }

  function openMarket(fromMorning) {
    S.mode = 'market';
    S.marketFromMorning = fromMorning;
    setTarget(null);
    if (input.locked) expectUnlock = true;
    input.exitLock();
    shop.showMarket();
    if (fromMorning) $('#openDay').textContent = 'Back to the kitchen';
    sfx.pop();
  }

  function closeMarket() {
    shop.hideMarket();
    S.mode = 'play';
    if (!S.marketFromMorning) startMorning();
    S.marketFromMorning = false;
    input.requestLock();
    save();
  }

  function updateDay(dt) {
    if (S.phase === 'morning') {
      S.clock += dt * MIN_PER_SEC * 1.6;
      if (S.clock >= T_OPEN) openShop();
    } else if (S.phase === 'open') {
      S.clock = Math.min(T_CLOSE, S.clock + dt * MIN_PER_SEC);
      if (S.clock >= T_CLOSE) closeShop();
      else if (S.clock < T_LAST) {
        S.spawnT -= dt;
        const here = S.customers.filter((c) => c.state !== 'leave').length;
        const maxC = S.day === 1 ? (S.report.served < 2 ? 2 : 3) : S.day === 2 ? 3 : 4;
        if (S.spawnT <= 0) {
          if (here < maxC && freeSeats().length) spawnCustomer();
          S.spawnT = 16 + Math.random() * 10 - Math.min(6, (S.day - 1) * 1.5);
        }
      }
    } else if (S.phase === 'closing') {
      if (!S.customers.length) {
        S.closeT = (S.closeT || 0) + dt;
        if (S.closeT > 1.5) {
          S.closeT = 0;
          S.phase = 'closed';
          endDay();
        }
      }
    }
  }

  // ---------------------------------------------------------------- targeting

  const rayO = V3(), rayD = V3();
  const custBox = new THREE.Box3();
  function rayBox(box) {
    let tmin = 0, tmax = REACH;
    for (const a of ['x', 'y', 'z']) {
      const o = rayO[a], d = rayD[a];
      if (Math.abs(d) < 1e-9) {
        if (o < box.min[a] || o > box.max[a]) return Infinity;
        continue;
      }
      let t0 = (box.min[a] - o) / d, t1 = (box.max[a] - o) / d;
      if (t0 > t1) [t0, t1] = [t1, t0];
      tmin = Math.max(tmin, t0);
      tmax = Math.min(tmax, t1);
      if (tmax < tmin) return Infinity;
    }
    return tmin;
  }

  // Score = distance along the ray + how far the thing's center sits from the
  // crosshair line, so neighbouring shelves and crates don't steal the aim.
  const tmpC = V3();
  function aimScore(box, t) {
    box.getCenter(tmpC);
    const along = tmpC.clone().sub(rayO).dot(rayD);
    const perp = tmpC.sub(rayO).addScaledVector(rayD, -along).length();
    return t + perp * 1.6;
  }

  function findTarget() {
    cam.getWorldPosition(rayO);
    cam.getWorldDirection(rayD);
    let best = null, bestS = Infinity;
    for (const it of W.interact) {
      const t = rayBox(it.box);
      if (t === Infinity) continue;
      const sc = aimScore(it.box, t);
      if (sc < bestS) { bestS = sc; best = it; }
    }
    for (const c of S.customers) {
      if (c.state !== 'ready' && c.state !== 'wait') continue;
      const p = c.a.root.position;
      custBox.min.set(p.x - 0.38, p.y, p.z - 0.38);
      custBox.max.set(p.x + 0.38, p.y + 1.45, p.z + 0.38);
      const t = rayBox(custBox);
      if (t === Infinity) continue;
      const sc = aimScore(custBox, t);
      if (sc < bestS) { bestS = sc; best = { kind: 'customer', c, hl: c.hl }; }
    }
    return best;
  }

  function setTarget(t) {
    if (S.target && S.target !== t && S.target.hl) S.target.hl.set(false);
    S.target = t;
    if (t && t.hl) t.hl.set(true);
  }

  function describe(t) {
    const it = S.carry;
    if (t.kind === 'ingredient') {
      const n = S.stock[t.id] ?? 0;
      return n ? `Grab ${ING_BY_ID[t.id].name} (${n} left)` : `Out of ${ING_BY_ID[t.id].name}!`;
    }
    if (t.kind === 'sign') return S.phase === 'morning' ? 'Flip the sign to Open' : S.phase === 'open' ? 'Open until 5 PM' : 'Closed for the day';
    if (t.kind === 'customer') {
      const c = t.c;
      if (c.state === 'ready') return `Take ${c.name}'s order`;
      if (ticketFor(c, it)) return `Serve the ${it.d.name} to ${c.name}`;
      return `${c.name} is waiting for the ${c.tickets.map((t) => t.d.name).join(' and the ') || c.order.name}`;
    }
    const st = t.station;
    if (st.type === 'scrap') return it ? `Toss the ${it.d.name}` : 'Scrap Basket';
    if (st.type === 'spot') {
      if (st.item && !it) return `Pick up the ${st.item.d.name}`;
      if (!st.item && it) return `Set down the ${it.d.name}`;
      return st.item ? `The ${st.item.d.name} is resting here` : 'Counter spot';
    }
    if (st.item) {
      const si = st.item;
      if (st.type === 'cook' && st.stirDue) return 'Stir the pot!';
      if (st.type === 'bake') {
        const ph = bakePhase(st);
        if (ph === 'baking') return `Baking the ${si.d.name}…`;
        return `Take out the ${si.d.name}${ph === 'golden' ? ' (golden!)' : ph === 'toasty' ? ' (toasty!)' : ' (burnt!)'}`;
      }
      if (PASSIVE[st.type]) return st.done ? `Take the ${si.d.name}` : `${curStep(si).label}…`;
      return it ? `The ${st.name} is busy` : `Keep working on the ${si.d.name}`;
    }
    if (it && !isDone(it)) {
      const s = curStep(it);
      if (s.station === st.type) return s.t === 'decor' ? `Decorate the ${it.d.name}` : s.label;
    }
    return st.name;
  }

  // ---------------------------------------------------------------- interactions

  function nope(msg) {
    if (msg) ui.toast(msg);
    sfx.nope();
  }

  function interact() {
    const t = S.target;
    vm.grab();
    if (!t) return;
    if (t.kind === 'ingredient') return grabIngredient(t);
    if (t.kind === 'customer') return talkTo(t.c);
    if (t.kind === 'sign') return flipSign();
    return useStation(t.station);
  }

  function grabIngredient(t) {
    const ing = ING_BY_ID[t.id];
    let it = S.carry;
    if (it && isDone(it)) return nope(`Your paws are full. The ${it.d.name} is ready to serve!`);
    if (it && curStep(it).t !== 'gather') {
      const s = curStep(it);
      return nope(`First: ${s.t === 'decor' ? 'decorate' : s.label.toLowerCase()} at the ${stepWhere(s)}.`);
    }
    if ((S.stock[ing.id] ?? 0) <= 0) return nope(`Out of ${ing.name}! Restock at the morning market after closing.`);
    if (!it) {
      if (!S.tickets.length) return nope('Take an order from a customer first. Look for the ! bubbles.');
      const free = S.tickets.filter((tk) => !tk.item && tk.steps[0].t === 'gather');
      const act = activeTicket();
      if (act && act.item && act.item.where !== 'hands' && !isDone(act.item) && curStep(act.item).t === 'gather' && curStep(act.item).items.includes(ing.id)) {
        return nope(`Pick up the ${act.d.name} ${act.item.station.type === 'spot' ? 'from the island' : `from the ${act.item.station.name}`} first, then add the ${ing.name}.`);
      }
      if (!free.length) return nope('Every order is already started. Check your tickets!');
      const tk = free.find((x) => x === act && x.steps[0].items.includes(ing.id)) || free.find((x) => x.steps[0].items.includes(ing.id));
      if (!tk) {
        const a = free.includes(act) ? act : free[0];
        return nope(`The ${a.d.name} doesn't use ${ing.name}. It needs ${a.steps[0].items.map((id) => ING_BY_ID[id].name).join(', ')}.`);
      }
      it = newItem(tk);
      toHands(it);
      if (act && tk.id !== act.id) ui.toast(`Started the ${tk.d.name}!`);
    }
    const step = curStep(it);
    if (!step.items.includes(ing.id)) return nope(`The ${it.d.name} doesn't need ${ing.name} right now.`);
    if (it.got.has(ing.id)) return nope(`${ing.name} is already in the bowl.`);
    it.got.add(ing.id);
    S.stock[ing.id] -= 1;
    if (step.needsPrep.includes(ing.id)) it.raw.add(ing.id);
    if (t.zone === 'cold') {
      for (const d of W.coldDoors) if (d.side === t.door) { d.target = 1; d.timer = 1.5; }
      sfx.frost();
    }
    fx.sparkles(t.box.getCenter(V3()), 3, 0.3);
    sfx.pop();
    if (S.stock[ing.id] === 1) ui.toast(`Only one ${ing.name} left on the shelf!`);
    if (step.items.every((id) => it.got.has(id))) {
      if (it.raw.size) {
        sfx.ding();
        ui.toast(`Got everything! Now ${nextStepText(it)}.`, 'good');
        tip('mise', 'Some ingredients need prepping first. Take the bowl to the Island in the middle of the kitchen.');
      } else finishGather(it);
    } else if (it.raw.has(ing.id)) {
      tip('mise', `${ing.name} needs prepping at the Island before it goes in. You can prep now or after gathering.`);
    }
    placeItem(it);
  }

  function finishGather(it) {
    it.step += 1;
    it.got = new Set();
    it.raw = new Set();
    sfx.ding();
    ui.toast(`Got everything! Next: ${nextStepText(it)}.`, 'good');
  }

  function talkTo(c) {
    if (c.state === 'ready') return takeOrder(c);
    const it = S.carry;
    if (c.tickets.length) S.activeId = c.tickets[0].id;
    const want = c.tickets.map((t) => t.d.name).join(' and the ') || c.order.name;
    if (it && isDone(it)) {
      const tk = ticketFor(c, it);
      if (tk) return serve(c, tk);
      say(c, `Hmm, I ordered the ${want}!`, 2);
      c.hop = 0.6;
      return nope();
    }
    say(c, pick([`Can't wait for my ${want}!`, `How's my ${want} coming?`, 'Smells amazing in here!']), 2);
    sfx.pop();
  }

  function stationHint(st) {
    return {
      mix: 'The Mixing Bowl mixes, kneads and whips. Bring a bowl of ingredients.',
      prep: 'The Prep Island is for rolling, chopping, scooping and filling.',
      bake: 'The Oven bakes. Take things out while they are golden!',
      cook: 'The Stove fries and melts. Stir when the pot calls you.',
      chill: 'The Freezer chills and sets desserts.',
      decor: 'The Decorating Table adds toppings from the recipe card.',
      scrap: 'The Scrap Basket is for treats that went wrong.',
      spot: 'A spot to set things down while your paws are busy.',
    }[st.type];
  }

  function bakePhase(st) {
    const dur = stepDur(curStep(st.item));
    if (st.t < dur) return 'baking';
    if (st.t < dur + goldenWin()) return 'golden';
    if (st.t < dur + goldenWin() + BAKE_TOASTY) return 'toasty';
    return 'burnt';
  }
  const wantsToasty = (it) => it.ticket && it.ticket.variant && it.ticket.variant.kind === 'toasty';

  function useStation(st) {
    const it = S.carry;
    if (st.type === 'scrap') {
      if (!it) return ui.toast(stationHint(st));
      if (it.ticket) it.ticket.item = null;
      S.carry = null;
      vm.setHeld(null);
      if (it.obj) it.obj.removeFromParent();
      fx.puff(st.slot.clone(), 6, 0.4);
      sfx.whoosh();
      st.bounce = 1;
      return ui.toast(`Tossed the ${it.d.name}. You can start it again from its ticket.`);
    }
    if (st.type === 'spot') {
      if (st.item && !it) {
        const si = st.item;
        st.item = null;
        toHands(si);
        sfx.pop();
        return;
      }
      if (!st.item && it) {
        S.carry = null;
        vm.setHeld(null);
        it.where = 'station';
        it.station = st;
        st.item = it;
        placeItem(it);
        sfx.place();
        return;
      }
      return nope(st.item ? 'Something is already resting there.' : null);
    }
    if (st.item) {
      const si = st.item;
      if (PASSIVE[st.type]) {
        if (st.type === 'cook' && st.stirDue) return stir(st);
        if (st.type === 'bake' && bakePhase(st) === 'baking') return nope(`Not golden yet. About ${Math.ceil(stepDur(curStep(si)) - st.t)}s to go.`);
        if (st.type !== 'bake' && !st.done) return nope(`${curStep(si).label}… almost there!`);
        if (it) return nope('Your paws are full! Set something down on the island first.');
        return takeFromStation(st);
      }
      if (!it) return enterFocus(st);
      return nope(`The ${st.name} is busy with the ${si.d.name}.`);
    }
    if (!it) return ui.toast(stationHint(st));
    if (isDone(it)) return nope(`The ${it.d.name} is finished! Bring it to ${it.ticket ? it.ticket.customer.name : 'a customer'}.`);
    const step = curStep(it);
    const prepping = step.t === 'gather' && st.type === 'prep' && it.raw.size > 0;
    if (step.t === 'gather' && !prepping) return nope(`First ${nextStepText(it)}.`);
    if (!prepping && step.station !== st.type) return nope(`The ${it.d.name} needs to ${step.t === 'decor' ? 'be decorated' : step.label.toLowerCase()} at the ${stepWhere(step)}.`);
    // hand it over to the station
    S.carry = null;
    vm.setHeld(null);
    it.where = 'station';
    it.station = st;
    st.item = it;
    st.t = 0;
    st.done = false;
    st.phase = null;
    st.stirDue = false;
    st.stirs = 0;
    st.bounce = 1;
    placeItem(it);
    sfx.place();
    if (ACTIVE[st.type]) return enterFocus(st);
    if (st.type === 'bake') {
      ui.toast(wantsToasty(it) ? `Baking the ${it.d.name}. ${it.ticket.customer.name} likes it extra toasty, so wait for the toasty zone!` : `Baking the ${it.d.name}. Take it out when the gauge is golden!`);
      tip('oven', 'Tip: start another order while the oven works. Just come back when it dings.');
    }
    if (st.type === 'cook') ui.toast(`Cooking the ${it.d.name}. Stir when the pot calls you!`);
    if (st.type === 'chill') ui.toast(`Chilling the ${it.d.name}…`);
  }

  function stir(st) {
    st.stirDue = false;
    st.stirs += 1;
    st.spin = 1;
    st.bounce = 1;
    sfx.stir();
    fx.sparkles(st.slot.clone().setY(1.3), 5);
    ui.toast('Stirred! Nice and smooth.', 'good');
  }

  function takeFromStation(st) {
    const it = st.item;
    if (st.type === 'bake') {
      const ph = bakePhase(st);
      const toasty = wantsToasty(it);
      if (ph === 'golden' && toasty) it.stars = Math.max(1, it.stars - 1);
      if (ph === 'toasty') { it.burnt = 1; if (!toasty) it.stars = Math.max(1, it.stars - 1); }
      if (ph === 'burnt') { it.burnt = 2; it.stars = Math.max(1, it.stars - (toasty ? 1 : 2)); }
      st.doorOpen = 1.2;
      sfx.door();
    }
    if (st.type === 'chill') st.lidOpen = 0.9;
    it.preview = false;
    it.previewBurnt = 0;
    it.step += 1;
    st.item = null;
    st.done = false;
    st.t = 0;
    st.phase = null;
    st.stirDue = false;
    st.bounce = 1;
    toHands(it);
    fx.sparkles(st.slot.clone().setY(st.slot.y + 0.2), 6);
    sfx.pop();
    const toastyWish = st.type === 'bake' && wantsToasty(it);
    const msg = toastyWish
      ? (it.burnt === 1 ? 'Extra toasty, just as ordered! ' : it.burnt === 2 ? 'Oops, a little too toasty! ' : 'A bit pale for this customer. ')
      : it.burnt === 1 ? 'A bit toasty, but still tasty. ' : it.burnt === 2 ? 'Oops, a little burnt! ' : '';
    ui.toast(`${msg}${it.d.name}: ${isDone(it) ? 'ready to serve!' : `next, ${nextStepText(it)}.`}`, it.burnt && !(toastyWish && it.burnt === 1) ? 'sad' : 'good');
  }

  function updateStations(dt) {
    for (const st of stationList) {
      const it = st.item;
      if (it && PASSIVE[st.type]) {
        const step = curStep(it);
        st.t += dt;
        if (st.type === 'bake') {
          const ph = bakePhase(st);
          if (ph !== st.phase) {
            if (ph !== 'baking') {
              it.preview = true;
              it.previewBurnt = ph === 'toasty' ? 1 : ph === 'burnt' ? 2 : 0;
              placeItem(it);
            }
            if (ph === 'golden') { sfx.ding(); ui.toast(wantsToasty(it) ? `The ${it.d.name} is golden. A little longer for extra toasty!` : `The ${it.d.name} is golden! Take it out of the oven.`, 'good'); st.bounce = 1; }
            if (ph === 'toasty') { sfx.alarm(); ui.toast(wantsToasty(it) ? `The ${it.d.name} is extra toasty. Take it out now!` : `The ${it.d.name} is getting toasty!`, wantsToasty(it) ? 'good' : 'sad'); }
            if (ph === 'burnt') { sfx.alarm(); ui.toast(`Oh no, the ${it.d.name} is burning!`, 'sad'); }
            st.phase = ph;
          }
          if ((ph === 'toasty' || ph === 'burnt') && Math.random() < dt * (ph === 'burnt' ? 6 : 2.5)) {
            fx.steam(st.group.localToWorld(st.built.chimneyTop.clone()));
          }
        } else if (st.type === 'cook') {
          if (!st.done && !st.stirDue && st.stirs < 2 && st.t >= (stepDur(step) * (st.stirs + 1)) / 3) {
            st.stirDue = true;
            st.stirT = has('pot') ? 8 : 5.5;
            sfx.alarm();
            st.bounce = 1;
            ui.toast(`The pot is bubbling! Stir the ${it.d.name}.`);
          }
          if (st.stirDue) {
            st.t -= dt;
            st.stirT -= dt;
            if (st.stirT <= 0) {
              st.stirDue = false;
              st.stirs += 1;
              if (!it.scorched) {
                it.scorched = true;
                it.stars = Math.max(1, it.stars - 1);
                ui.toast('It scorched a little! Stir when the pot bubbles.', 'sad');
              }
              sfx.sad();
            }
          }
          if (!st.done && st.t >= stepDur(step)) {
            st.done = true;
            sfx.ding();
            ui.toast(`${step.label}: done! Grab it from the stove.`, 'good');
            st.bounce = 1;
          }
          if (Math.random() < dt * 4) fx.steam(st.slot.clone().setY(st.slot.y + 0.25));
        } else if (st.type === 'chill') {
          if (!st.done && st.t >= stepDur(step)) {
            st.done = true;
            if (it.obj) it.obj.visible = true;
            sfx.frost();
            ui.toast(`${step.label}: done! Grab it from the freezer.`, 'good');
            st.bounce = 1;
          }
          if (!st.done && Math.random() < dt * 3) fx.sparkles(st.slot.clone().setY(1.0), 1, 0.25);
        }
      }
      // personalities and props
      const working = !!it && (PASSIVE[st.type] ? !st.done && !(st.type === 'bake' && bakePhase(st) !== 'baking') : S.focus?.st === st);
      const b = st.built;
      if (st.type === 'bake') {
        b.windowMat.emissiveIntensity += ((it ? 0.85 : 0.12) - b.windowMat.emissiveIntensity) * Math.min(1, dt * 4);
        b.lightMat.emissiveIntensity = it ? 0.9 : 0;
        b.glow.material.opacity = it ? 0.45 + Math.sin(S.time * 6) * 0.08 : 0.12;
        st.doorOpen = Math.max(0, (st.doorOpen || 0) - dt);
        const want = st.doorOpen > 0 ? 1.45 : 0;
        b.door.rotation.x += (want - b.door.rotation.x) * Math.min(1, dt * 8);
        if (it && Math.random() < dt * 2.5) fx.steam(st.group.localToWorld(b.chimneyTop.clone()));
      }
      if (st.type === 'cook') {
        b.flame.material.opacity = it && !st.done ? 0.55 + Math.sin(S.time * 14) * 0.12 : 0;
        st.spin = Math.max(0, (st.spin || 0) - dt * 1.5);
        b.spoon.rotation.y += dt * (st.spin * 14 + (it ? 0.6 : 0));
        b.soupMat.color.set(st.stirDue ? '#F0A35A' : it ? '#F3C07A' : '#F3D9A6');
      }
      if (st.type === 'chill') {
        st.lidOpen = Math.max(0, (st.lidOpen || 0) - dt);
        const want = st.lidOpen > 0 || (it && st.done) ? -1.15 : 0;
        b.lid.rotation.x += (want - b.lid.rotation.x) * Math.min(1, dt * 7);
      }
      if (st.type === 'decor' && S.focus?.st === st) {
        b.turntable.rotation.y += dt * 0.9;
        if (it && it.obj) it.obj.rotation.y = b.turntable.rotation.y;
      }
      if (st.hero) {
        st.bounce = Math.max(0, st.bounce - dt * 3);
        const bb = Math.sin(st.bounce * Math.PI) * 0.1;
        const wob = working ? Math.sin(S.time * 18) * 0.02 : 0;
        const breathe = Math.sin(S.time * 2 + st.slot.x) * 0.008;
        st.hero.scale.set(1 - bb * 0.5 + wob, 1 + bb + breathe - wob, 1 - bb * 0.5 + wob);
      }
      if (st.face) {
        st.blinkT -= dt;
        if (st.blinkT < 0) st.blinkT = 2.5 + Math.random() * 3;
        const closed = working || st.blinkT < 0.13;
        for (const e of st.face.eyes) e.scale.y = closed ? 0.25 : 1.2;
      }
      // progress bubble over the busy appliance
      if (!st.bub && PASSIVE[st.type]) {
        st.bub = ui.bubble(`station st-${st.type}`, '<svg viewBox="0 0 44 44"><circle class="track" cx="22" cy="22" r="17"/><circle class="fill" cx="22" cy="22" r="17"/></svg><span class="gauge"><i class="z1"></i><i class="z2"></i><i class="z3"></i><b></b></span><span class="lbl"></span>');
        st.bubFill = st.bub.querySelector('.fill');
        st.bubLbl = st.bub.querySelector('.lbl');
        st.bubNeedle = st.bub.querySelector('.gauge b');
      }
      if (st.bub) {
        const show = !!it && S.mode !== 'title';
        st.bub.hidden = !show;
        if (show) {
          const step = curStep(it);
          let k = 0, lbl = '', cls = '';
          if (st.type === 'bake') {
            const ph = bakePhase(st);
            const dur = stepDur(step);
            const total = dur + goldenWin() + BAKE_TOASTY;
            if (st.bubDur !== total) {
              st.bubDur = total;
              const z = st.bub.querySelectorAll('.gauge i');
              z[0].style.width = `${(dur / total) * 100}%`;
              z[1].style.width = `${(goldenWin() / total) * 100}%`;
              z[2].style.width = `${(BAKE_TOASTY / total) * 100}%`;
            }
            st.bubNeedle.style.left = `${clamp(st.t / total, 0, 1) * 100}%`;
            lbl = wantsToasty(it)
              ? { baking: 'Baking…', golden: 'Golden… wait for toasty', toasty: 'Toasty! Take it out', burnt: 'Burnt!' }[ph]
              : { baking: 'Baking…', golden: 'Golden! Take it out', toasty: 'Toasty!', burnt: 'Burnt!' }[ph];
            cls = wantsToasty(it) ? { golden: 'toasty', toasty: 'golden' }[ph] || ph : ph;
          } else if (st.type === 'cook') {
            k = st.t / stepDur(step);
            lbl = st.stirDue ? 'Stir!' : st.done ? 'Done!' : 'Cooking…';
            cls = st.stirDue ? 'alert' : st.done ? 'golden' : '';
          } else {
            k = st.t / stepDur(step);
            lbl = st.done ? 'Chilled!' : 'Chilling…';
            cls = st.done ? 'golden' : '';
          }
          st.bubFill.style.strokeDashoffset = `${(1 - clamp(k, 0, 1)) * 106.8}`;
          if (st.bubLbl.textContent !== lbl) st.bubLbl.textContent = lbl;
          st.bub.dataset.state = cls;
          ui.project(st.bub, V3(st.slot.x, st.type === 'bake' ? 1.62 : st.slot.y + 0.6, st.slot.z), cam, 14);
        }
      }
    }
    // cold storage doors swing shut after you grab something
    for (const d of W.coldDoors) {
      d.timer = Math.max(0, (d.timer || 0) - dt);
      if (d.timer <= 0) d.target = 0;
      d.open += (d.target - d.open) * Math.min(1, dt * 7);
      d.pivot.rotation.y = d.side * 1.6 * d.open;
    }
  }

  // ---------------------------------------------------------------- focus mini-games

  function focusPose(st) {
    const target = st.slot.clone();
    if (st.type === 'mix') target.y = 1.15;
    if (st.type === 'decor') target.y += 0.08;
    const away = V3(P.x - target.x, 0, P.z - target.z);
    if (away.lengthSq() < 1e-4) away.set(0, 0, 1);
    away.normalize();
    const dist = st.type === 'mix' ? 1.1 : st.type === 'decor' ? 0.95 : 0.85;
    const pos = target.clone().addScaledVector(away, dist).add(V3(0, 0.62, 0));
    // look a little below the work so it sits above the mini-game card
    const look = target.clone().add(V3(0, -0.24, 0));
    const m = new THREE.Matrix4().lookAt(pos, look, V3(0, 1, 0));
    return { pos, quat: new THREE.Quaternion().setFromRotationMatrix(m), fov: 55 };
  }

  function eyePose() {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
    return { pos: V3(P.x, EYE, P.z), quat: q, fov: fpFov() };
  }

  function tweenCam(to, dur = 0.35) {
    S.camTween = { from: { pos: cam.position.clone(), quat: cam.quaternion.clone(), fov: cam.fov }, to, t: 0, dur };
  }

  /** What the station should do with this item right now. */
  function focusTask(st, it) {
    const step = curStep(it);
    if (st.type === 'decor') return { key: `${it.step}:decor`, mode: 'decor', step, title: `Decorate the ${it.d.name}` };
    if (step.t === 'gather') {
      const ing = [...it.raw][0];
      const pd = ING_PREP[ing];
      return { key: `${it.step}:${ing}`, mode: pd.mode, step: { n: pd.n, label: pd.label }, title: pd.label, ing };
    }
    return { key: `${it.step}:${step.t}`, mode: step.mode, step, title: step.label };
  }

  function setupFocus(st, it) {
    const task = focusTask(st, it);
    let game = null;
    if (task.mode !== 'decor') {
      // the kitchen upgrades make some jobs quicker
      const opts = {};
      if (st.type === 'mix' && has('mixer')) { opts.speed = 1.5; opts.countScale = 0.7; }
      if (st.type === 'prep' && has('knife')) {
        opts.zone = 0.28;
        if (task.mode === 'tap' || task.mode === 'hit') opts.countScale = 0.7;
      }
      game = it.work && it.work.key === task.key ? it.work.game : createGame(task.mode, task.step, opts);
    }
    S.focus = { st, it, task, step: task.step, mode: task.mode, game, idx: it.decorIdx || 0, doneT: 0, mistakes: 0, ingObj: null };
    const F = S.focus;
    if (task.ing) {
      // show the whole ingredient on the cutting board while you prep it
      const m = prepModel(task.ing);
      const box = new THREE.Box3().setFromObject(m);
      const size = box.getSize(V3());
      m.scale.setScalar(Math.min(1.3, 0.2 / Math.max(size.x, size.y, size.z, 0.01)));
      m.position.copy(st.group.localToWorld(V3(-0.17, 0.035, 0.1)));
      m.userData.baseScale = m.scale.x;
      scene.add(m);
      F.ingObj = m;
    }
    if (st.type === 'mix') st.built.batterMat.color.set(it.d.batter);
    ui.showGame({
      station: `${st.name} · ${it.d.name}`,
      title: task.title,
      hint: task.ing ? `${ING_BY_ID[task.ing].name} for the ${it.d.name}. ${MODE_HINT[task.mode]}` : MODE_HINT[task.mode],
      mode: task.mode,
      tapLabel: task.step.tapLabel || TAP_LABEL[task.mode] || 'Tap!',
      decor: task.mode === 'decor' ? { tops: step0(it).tops, idx: F.idx } : null,
      game,
    });
    if (!game) ui.setGameProgress(F.idx / step0(it).tops.length);
  }
  const step0 = (it) => curStep(it);

  function enterFocus(st) {
    S.mode = 'focus';
    setTarget(null);
    ui.prompt(null);
    vm.visible = false;
    input.dragLook = false;
    input.consumeMove();
    tweenCam('focus');
    setupFocus(st, st.item);
    tip('focus', 'Press Q or "Step back" to leave a station. Your progress is saved.');
  }

  function clearIngObj(F) {
    if (F.ingObj) {
      F.ingObj.removeFromParent();
      F.ingObj = null;
    }
  }

  function leaveFocus() {
    const F = S.focus;
    if (!F) return;
    if (F.doneT <= 0 && F.it.station === F.st) {
      F.it.work = F.game ? { key: F.task.key, game: F.game } : null;
      F.it.decorIdx = F.idx;
    }
    clearIngObj(F);
    S.focus = null;
    S.mode = 'play';
    ui.hideGame();
    vm.visible = true;
    input.dragLook = true;
    tweenCam('eye');
    if (F.st.type === 'mix') F.st.built.batterMat.color.set('#FFE08A');
  }

  /** Sounds, sparkles and toasts for mini-game events. */
  function handleEvents(F, events) {
    const st = F.st;
    const at = st.slot.clone().setY(st.slot.y + 0.1);
    for (const e of events) {
      if (e.type === 'stroke') {
        if (st.type === 'mix') { sfx.whisk(); fx.puff(at.clone().setY(at.y + 0.1), 1, 0.15); }
        else if (F.mode === 'tap' || F.mode === 'hit') { sfx.chop(); st.chop = 1; fx.puff(at, 2, 0.18); }
        else if (F.mode === 'alternate' || F.mode === 'order') { sfx.place(); st.chop = 0.6; fx.puff(at, 2, 0.15); }
        else sfx.whisk();
        st.whiskBoost = 1;
        if (F.ingObj) F.ingObj.userData.squash = 1;
      } else if (e.type === 'hit') {
        ui.flashGame('hit');
        if (e.perfect) fx.sparkles(at.clone().setY(at.y + 0.1), 3, 0.2);
      } else if (e.type === 'miss') {
        ui.flashGame('miss');
        sfx.nope();
        if (e.msg) ui.toast(e.msg);
      } else if (e.type === 'spill') {
        fx.puff(at, 5, 0.3);
      } else if (e.type === 'penalty') {
        F.it.stars = Math.max(1, F.it.stars - 1);
        ui.toast(F.mode === 'fill' ? 'A little messy! (−1 star)' : 'A few slips there. (−1 star)', 'sad');
      } else if (e.type === 'done') {
        completeFocus();
      } else if (e.type === 'work' && Math.random() < 0.06) {
        sfx.whisk();
      }
    }
    if (F.game && F.mode === 'order' && events.some((e) => e.type === 'miss')) ui.renderLayerSeq(F.game, F.lastPick);
  }

  function focusTap() {
    const F = S.focus;
    if (!F || F.doneT > 0) return;
    if (F.mode === 'decor' || F.mode === 'order' || F.mode === 'alternate') {
      if (input.locked) {
        // with pointer lock the little virtual cursor does the clicking
        const el = document.elementFromPoint(input.cursor.x, input.cursor.y);
        const b = el && el.closest && el.closest('button');
        if (b) b.click();
      }
      return;
    }
    handleEvents(F, F.game.tap());
  }

  function focusAlt(side) {
    const F = S.focus;
    if (!F || F.doneT > 0 || F.mode !== 'alternate') return;
    handleEvents(F, F.game.alt(side));
  }

  function pickLayer(label) {
    const F = S.focus;
    if (!F || F.doneT > 0 || F.mode !== 'order') return;
    F.lastPick = label;
    handleEvents(F, F.game.pick(label));
  }

  function selectTopping(id) {
    const F = S.focus;
    if (!F || F.mode !== 'decor' || F.doneT > 0) return;
    const tops = F.step.tops;
    const want = tops[F.idx];
    if (id === want) {
      F.idx += 1;
      sfx.pop();
      fx.sparkles(F.st.slot.clone().setY(F.st.slot.y + 0.2), 6, 0.25);
      fx.puff(F.st.slot.clone().setY(F.st.slot.y + 0.15), 3, 0.2);
      ui.renderSeq(tops, F.idx);
      ui.setGameProgress(F.idx / tops.length);
      ui.toast(`${TOPPING_BY_ID[id].name} added!`, 'good');
      if (F.idx >= tops.length) completeFocus();
    } else {
      F.mistakes += 1;
      F.it.mistakes += 1;
      sfx.nope();
      ui.renderSeq(tops, F.idx, id);
      ui.toast(`That's not next on the ticket. Look for ${TOPPING_BY_ID[want].name}.`);
    }
  }

  function completeFocus() {
    const F = S.focus;
    if (!F || F.doneT > 0) return;
    const it = F.it;
    F.doneT = 0.75;
    if (F.mode === 'decor' && F.mistakes >= 2) it.stars = Math.max(1, it.stars - 1);
    it.work = null;
    it.decorIdx = 0;
    let msg = F.mode === 'decor' ? 'Beautiful!' : 'Done!';
    if (F.task.ing) {
      it.raw.delete(F.task.ing);
      msg = `${ING_BY_ID[F.task.ing].name}: ready!`;
      if (F.ingObj) fx.puff(F.ingObj.position.clone(), 4, 0.2);
      clearIngObj(F);
      const step = curStep(it);
      if (!it.raw.size && step.items.every((id) => it.got.has(id))) finishGather(it);
    } else {
      it.step += 1;
    }
    sfx.ding();
    fx.sparkles(F.st.slot.clone().setY(F.st.slot.y + 0.25), 8);
    placeItem(it);
    ui.gameDone(msg);
  }

  function finishFocus() {
    const F = S.focus;
    const it = F.it;
    // more ingredients to prep: stay at the island and start the next one
    if (F.task.ing && it.raw.size) {
      setupFocus(F.st, it);
      return;
    }
    F.st.item = null;
    F.st.bounce = 1;
    leaveFocus();
    toHands(it);
    ui.toast(`${it.d.name}: ${isDone(it) ? `ready to serve${it.ticket ? ` ${it.ticket.customer.name}` : ''}!` : `next, ${nextStepText(it)}.`}`, 'good');
  }

  function updateFocus(dt) {
    const F = S.focus;
    if (!F) return;
    const st = F.st;
    const b = st.built;
    if (F.doneT > 0) {
      F.doneT -= dt;
      if (F.doneT <= 0) finishFocus();
      return;
    }
    const mv = input.consumeMove();
    const held = input.primaryDown || input.keys.has(' ') || input.keys.has('e');
    if (F.game) {
      handleEvents(F, F.game.update(dt, mv, held));
      if (S.focus !== F || F.doneT > 0) return;
      ui.renderMini(F.game);
    }
    // props react to the work
    st.whiskBoost = Math.max(0, (st.whiskBoost || 0) - dt * 3);
    const activity = Math.min(1, mv.amt / 40 + st.whiskBoost + (held && (F.mode === 'hold' || F.mode === 'fill') ? 0.6 : 0));
    if (st.type === 'mix') {
      b.whisk.rotation.y += dt * (2 + activity * 30);
      b.whisk.position.x = 0.1 + Math.sin(S.time * 9) * 0.05 * activity;
    }
    if (st.type === 'prep') {
      st.chop = Math.max(0, (st.chop || 0) - dt * 5);
      if (F.mode === 'roll') st.pin.position.z = -0.12 + Math.sin(F.game.progress * 30) * 0.08;
      st.knife.rotation.z = st.chop * 0.7;
      st.knife.position.y = 0.04 + st.chop * 0.06;
      if (F.mode === 'wiggle' || F.mode === 'hold' || F.mode === 'fill' || F.mode === 'swirl') st.pin.rotation.x += dt * activity * 12;
      if (F.it.obj && (F.mode === 'wiggle' || F.mode === 'swirl')) F.it.obj.rotation.y += dt * activity * 4;
    }
    if (F.ingObj) {
      const o = F.ingObj;
      o.userData.squash = Math.max(0, (o.userData.squash || 0) - dt * 5);
      const k = o.userData.baseScale;
      const sq = Math.sin(o.userData.squash * Math.PI) * 0.18;
      const shrink = F.game ? 1 - F.game.progress * 0.35 : 1;
      o.scale.set(k * (1 + sq) * shrink, k * (1 - sq) * shrink, k * (1 + sq) * shrink);
      if (F.mode === 'swirl' || F.mode === 'roll') o.rotation.y += dt * activity * 5;
    }
    const cursor = F.mode === 'decor' || F.mode === 'order' || F.mode === 'alternate';
    ui.vcursor(cursor && input.locked, input.cursor.x, input.cursor.y);
  }

  // ---------------------------------------------------------------- modes

  const title = $('#title');
  const pauseEl = $('#pause');
  let expectUnlock = false;

  function startGame() {
    if (S.mode !== 'title') return;
    unlockAudio();
    title.hidden = true;
    S.mode = 'swoop';
    S.swoop = { t: 0, from: { pos: cam.position.clone(), quat: cam.quaternion.clone(), fov: cam.fov } };
    input.wantLock = true;
    input.requestLock();
    sfx.bell();
  }

  function openBook() {
    if (S.mode !== 'play') return;
    S.mode = 'book';
    if (input.locked) expectUnlock = true;
    input.exitLock();
    if (S.tickets.length) ui.tab = 'orders';
    ui.renderBook(S);
    ui.book.el.hidden = false;
    setTarget(null);
    sfx.pop();
  }

  function closeBook() {
    if (S.mode !== 'book') return;
    ui.book.el.hidden = true;
    S.mode = 'play';
    input.requestLock();
  }

  function pause() {
    if (input.lockFailed || input.coarse) return;
    if (S.focus) leaveFocus();
    S.mode = 'pause';
    pauseEl.hidden = false;
    setTarget(null);
  }

  function resume() {
    pauseEl.hidden = true;
    S.mode = 'play';
    input.requestLock();
  }

  input.on.lockChange = (locked) => {
    if (locked) {
      if (S.mode === 'pause') { pauseEl.hidden = true; S.mode = 'play'; }
      return;
    }
    if (expectUnlock) { expectUnlock = false; return; }
    if (S.mode === 'play' || S.mode === 'focus') pause();
  };
  input.on.lockError = () => {
    pauseEl.hidden = true;
    if (S.mode === 'pause') S.mode = 'play';
    tip('drag', 'Drag with the mouse to look around.');
  };

  input.on.key = (k, e) => {
    unlockAudio();
    if (S.mode === 'title') {
      if (k === 'enter' || k === ' ') { e.preventDefault(); startGame(); }
      return;
    }
    if (S.mode === 'book') {
      if (k === 'escape' || k === 'r') { e.preventDefault(); closeBook(); }
      return;
    }
    if (S.mode === 'pause') {
      if (k === 'enter' || k === ' ') { e.preventDefault(); resume(); }
      return;
    }
    if (S.mode === 'summary' || S.mode === 'market') return;
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'tab'].includes(k)) e.preventDefault();
    if (e.repeat) return;
    if (S.mode === 'focus') {
      const F = S.focus;
      if (k === 'e' || k === ' ' || k === 'enter') focusTap();
      else if (k === 'q' || k === 'backspace' || k === 'escape') leaveFocus();
      else if (F && F.mode === 'alternate' && (k === 'a' || k === 'arrowleft')) focusAlt('L');
      else if (F && F.mode === 'alternate' && (k === 'd' || k === 'arrowright')) focusAlt('R');
      else if (F && F.mode === 'order' && k >= '1' && k <= '9') {
        const l = F.game.choices[+k - 1];
        if (l) pickLayer(l);
      } else {
        const tp = TOPPINGS.find((t) => t.key === k);
        if (tp && F && F.mode === 'decor') selectTopping(tp.id);
      }
      return;
    }
    if (S.mode !== 'play') return;
    if (k === 'e' || k === 'enter' || k === ' ') interact();
    else if (k === 'r') openBook();
    else if (k === 'b') { if (S.phase === 'morning') openMarket(true); else openBook(); }
    else if (k === 'tab') cycleTicket();
    else if (k >= '1' && k <= '4') selectTicket(+k);
    else if (k === 'm') { setMuted(!isMuted()); refreshMute(); }
  };

  input.on.primary = () => {
    unlockAudio();
    if (S.mode === 'play') interact();
    else if (S.mode === 'focus') focusTap();
  };
  input.on.tap = () => {
    if (S.mode === 'play') interact();
    else if (S.mode === 'focus' && !['decor', 'order', 'alternate'].includes(S.focus.mode)) focusTap();
  };
  input.on.touchStart = () => unlockAudio();

  // HUD buttons
  $('#bookBtn').addEventListener('click', () => {
    unlockAudio();
    if (S.mode === 'play') openBook();
    else if (S.mode === 'book') closeBook();
  });
  $('#bookClose').addEventListener('click', closeBook);
  const marketBtn = $('#marketBtn');
  marketBtn.addEventListener('click', () => { if (S.mode === 'play' && S.phase === 'morning') openMarket(true); });
  ui.book.el.addEventListener('click', (e) => { if (e.target === ui.book.el) closeBook(); });
  ui.book.tabs.addEventListener('click', (e) => {
    const b = e.target.closest('.tab');
    if (!b) return;
    ui.tab = b.dataset.tab;
    ui.renderBook(S);
  });
  const muteBtn = $('#muteBtn');
  function refreshMute() {
    muteBtn.textContent = isMuted() ? 'Sound off' : 'Sound on';
    muteBtn.setAttribute('aria-pressed', String(!isMuted()));
  }
  refreshMute();
  muteBtn.addEventListener('click', () => { unlockAudio(); setMuted(!isMuted()); refreshMute(); muteBtn.blur(); });
  $('#startBtn').addEventListener('click', startGame);
  if (S.served > 0 || S.day > 1) $('#startBtn').textContent = `Reopen the shop · Day ${S.day}`;
  pauseEl.addEventListener('click', resume);
  ui.ticketsEl.addEventListener('click', (e) => {
    const t = e.target.closest('.ticket');
    if (!t) return;
    S.activeId = +t.dataset.id;
    sfx.pop();
  });
  ui.game.palette.addEventListener('click', (e) => {
    const b = e.target.closest('.top');
    if (!b) return;
    if (b.dataset.top) selectTopping(b.dataset.top);
    else if (b.dataset.layer) pickLayer(b.dataset.layer);
  });
  ui.game.altL.addEventListener('click', () => focusAlt('L'));
  ui.game.altR.addEventListener('click', () => focusAlt('R'));
  ui.game.leave.addEventListener('click', () => leaveFocus());
  ui.game.tap.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (!input.locked) {
      input.primaryDown = true;
      focusTap();
    }
  });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) ui.game.tap.addEventListener(ev, () => { if (!input.locked) input.primaryDown = false; });
  input.bindTouchControls($('#stick'), $('#knob'), $('#useBtn'));

  // ---------------------------------------------------------------- movement

  function collide(p, r = 0.28) {
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

  function movePlayer(dt) {
    const [lx, ly] = input.consumeLook();
    const sens = input.locked ? 0.0022 : 0.0042;
    yaw -= lx * sens;
    pitch = clamp(pitch - ly * sens, -1.25, 1.05);
    const k = input.keys;
    let f = 0, s = 0;
    if (k.has('w') || k.has('arrowup')) f += 1;
    if (k.has('s') || k.has('arrowdown')) f -= 1;
    if (k.has('a')) s -= 1;
    if (k.has('d')) s += 1;
    if (k.has('arrowleft')) yaw += dt * 2.2;
    if (k.has('arrowright')) yaw -= dt * 2.2;
    if (Math.hypot(input.stick.x, input.stick.y) > 0.12) { f = input.stick.y; s = input.stick.x; }
    const len = Math.hypot(f, s);
    if (len > 1) { f /= len; s /= len; }
    const moving = len > 0.05;
    if (moving) {
      const speed = 2.9;
      const fwd = V3(-Math.sin(yaw), 0, -Math.cos(yaw));
      const right = V3(Math.cos(yaw), 0, -Math.sin(yaw));
      const before = P.clone();
      P.addScaledVector(fwd, f * speed * dt).addScaledVector(right, s * speed * dt);
      collide(P);
      const moved = P.distanceTo(before);
      bobPhase += moved * 6.5;
      stepAcc += moved;
      if (stepAcc > 0.62) { stepAcc = 0; sfx.step(); }
    }
    return moving;
  }

  // ---------------------------------------------------------------- HUD

  function carryHTML() {
    const it = S.carry;
    if (!it) {
      if (!S.tickets.length) {
        if (S.phase === 'morning') return 'Morning prep. Flip the sign on the front door to open the shop.';
        if (S.phase === 'closing') return 'Closing time. The last customers are heading home.';
        return S.customers.some((c) => c.state === 'ready')
          ? `A customer is ready to order. Look at them and press <kbd>${input.coarse ? 'Use' : 'E'}</kbd>`
          : 'Waiting for customers…';
      }
      const tk = activeTicket();
      if (tk && !tk.item) return `Next: gather for the <b>${tk.d.name}</b> in ${stepWhere(tk.steps[0])}.`;
      if (tk && tk.item) return `The <b>${tk.d.name}</b> is ${tk.item.station && tk.item.station.type === 'spot' ? 'resting on the island' : tk.item.station ? `at the ${tk.item.station.name}` : 'waiting'}.`;
      return '';
    }
    return `<img src="${dessertURL(it.d)}" alt=""><span>Carrying <b>${it.d.name}</b> · ${nextStepText(it)}</span>`;
  }

  function updateHUD() {
    ui.day(S, clockText(), S.phase === 'morning' ? 0 : clamp((S.clock - T_OPEN) / (T_CLOSE - T_OPEN), 0, 1), S.special);
    marketBtn.hidden = !(S.phase === 'morning' && S.mode === 'play');
    ui.renderTickets(S.tickets, S.activeId);
    ui.updateTicketBars(S.tickets);
    const playing = S.mode === 'play';
    ui.crosshair(playing);
    if (playing && S.target) ui.prompt(describe(S.target), input.coarse ? 'Use' : 'E');
    else ui.prompt(null);
    ui.carry(playing ? carryHTML() : null);
    for (const c of S.customers) {
      const show = (c.state === 'ready' || c.state === 'wait') && S.mode !== 'title';
      c.bub.hidden = !show;
      const head = V3(c.a.root.position.x, c.a.root.position.y + 1.55, c.a.root.position.z);
      if (show) ui.project(c.bub, head, cam, 14);
      if (!c.say.hidden) ui.project(c.say, head.clone().setY(head.y + (show ? 0.62 : 0.1)), cam, 14);
    }
  }

  // ---------------------------------------------------------------- loop

  const clock = new THREE.Clock();
  let perfAcc = 0, perfFrames = 0, perfDrops = 0;
  function frame() {
    const raw = Math.min(0.05, clock.getDelta());
    const dt = raw * (S.timeScale || 1);
    S.time += dt;

    // adaptive resolution for slower devices
    perfAcc += raw;
    perfFrames++;
    if (perfAcc > 2.5) {
      const fps = perfFrames / perfAcc;
      if (fps < 40 && pixelRatio > 1 && perfDrops < 3 && S.mode !== 'title') {
        pixelRatio = Math.max(1, pixelRatio - 0.35);
        renderer.setPixelRatio(pixelRatio);
        resize();
        perfDrops++;
      }
      perfAcc = 0;
      perfFrames = 0;
    }

    let moving = false;
    if (S.mode === 'play') {
      moving = movePlayer(dt);
      setTarget(findTarget());
    } else {
      input.consumeLook();
    }
    if (S.mode === 'focus') updateFocus(dt);

    // the shop day: morning, open hours, closing
    if (S.mode === 'play' || S.mode === 'focus') updateDay(dt);
    sign.update(dt);
    decorPieces.update(S.time);

    updateStations(dt);
    updateCustomers(dt);
    fx.update(dt);
    ui.tick(dt);

    // ambience
    W.glows.forEach((g, i) => { g.material.opacity = g.userData.baseOpacity * (0.82 + 0.18 * Math.sin(S.time * 1.7 + i * 1.3)); });
    W.clockHands[0].rotation.z = -(((S.clock / 60) % 12) / 12) * Math.PI * 2;
    W.clockHands[1].rotation.z = -((S.clock % 60) / 60) * Math.PI * 2;
    const mp = W.motes.geometry.attributes.position;
    for (let i = 0; i < mp.count; i++) {
      let y = mp.getY(i) + dt * 0.05 * (0.5 + (i % 5) * 0.2);
      if (y > 2.3) y = 0.5;
      mp.setY(i, y);
      mp.setX(i, mp.getX(i) + Math.sin(S.time * 0.3 + i) * dt * 0.02);
    }
    mp.needsUpdate = true;
    if (W.coldFace) {
      const blink = Math.sin(S.time * 0.9) > 0.985;
      for (const e of W.coldFace.eyes) e.scale.y = blink ? 0.25 : 1.2;
    }

    // cameras
    if (document.body.dataset.mode !== S.mode) document.body.dataset.mode = S.mode;
    if (S.mode === 'title') {
      fox.root.visible = true;
      animateAnimal(fox, dt, S.time, false);
      // on wide screens the title card sits on the left, so slide the diorama right
      const target = isoTarget.clone().addScaledVector(isoRight, aspect > 1.25 ? -4.2 : 0);
      if (aspect <= 1.25) target.addScaledVector(isoUp, -2.2);
      const pos = target.clone().addScaledVector(isoDir, TITLE_DIST).addScaledVector(isoUp, Math.sin(S.time * 0.4) * 0.15);
      cam.position.copy(pos);
      cam.fov = titleFov();
      cam.lookAt(target);
      cam.layers.set(0);
      outlineUniforms.distRef.value = 1e6;
    } else if (S.mode === 'swoop') {
      S.swoop.t += raw / 2.1;
      const e = ease(clamp(S.swoop.t, 0, 1));
      const to = eyePose();
      cam.position.lerpVectors(S.swoop.from.pos, to.pos, e);
      cam.quaternion.slerpQuaternions(S.swoop.from.quat, to.quat, e);
      cam.fov = S.swoop.from.fov + (to.fov - S.swoop.from.fov) * e;
      outlineUniforms.distRef.value = 80 + (2.4 - 80) * e;
      if (e > 0.94) cam.layers.enable(FP_LAYER);
      fox.root.visible = e < 0.86;
      if (S.swoop.t >= 1) {
        S.mode = 'play';
        cam.layers.enable(FP_LAYER);
        sun.shadow.camera.layers.enable(FP_LAYER);
        renderer.shadowMap.needsUpdate = true;
        startMorning();
      }
    } else {
      fox.root.visible = false;
      outlineUniforms.distRef.value = 2.4;
      const bob = moving ? Math.sin(bobPhase * 2) * 0.007 : 0;
      if (S.camTween) {
        const T = S.camTween;
        T.t += raw / T.dur;
        const e = ease(clamp(T.t, 0, 1));
        const to = T.to === 'focus' && S.focus ? focusPose(S.focus.st) : eyePose();
        cam.position.lerpVectors(T.from.pos, to.pos, e);
        cam.quaternion.slerpQuaternions(T.from.quat, to.quat, e);
        cam.fov = T.from.fov + (to.fov - T.from.fov) * e;
        if (T.t >= 1) S.camTween = null;
      } else if (S.mode === 'focus' && S.focus) {
        const fp = focusPose(S.focus.st);
        cam.position.copy(fp.pos);
        cam.quaternion.copy(fp.quat);
        cam.fov = fp.fov;
      } else {
        cam.position.set(P.x, EYE + bob, P.z);
        cam.rotation.set(pitch, yaw, 0);
        cam.fov = fpFov();
      }
    }
    cam.updateProjectionMatrix();
    updateHUD();

    renderer.clear();
    renderer.render(scene, cam);
    if (S.mode !== 'title' && S.mode !== 'swoop' && vm.visible) {
      vm.update(raw, { moving, speed: 2.9, aspect });
      renderer.clearDepth();
      renderer.render(vm.scene, vm.camera);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // tiny hook for automated checks
  function syncEye() {
    if (S.mode !== 'play') return;
    cam.position.set(P.x, EYE, P.z);
    cam.rotation.set(pitch, yaw, 0);
    cam.updateMatrixWorld();
  }
  window.__bakery = {
    S, W, renderer, stations, cam, input, ui, vm, P,
    setView: (x, z, y, p) => { P.set(x, 0, z); yaw = y; if (p !== undefined) pitch = p; },
    lookAt: (x, y, z) => {
      const dx = x - P.x, dz = z - P.z;
      yaw = Math.atan2(-dx, -dz);
      pitch = Math.atan2(y - EYE, Math.hypot(dx, dz));
    },
    interactNow: () => { syncEye(); setTarget(findTarget()); interact(); },
    interact, spawnCustomer, startGame, enterFocus, focusTap, focusAlt, pickLayer, selectTopping, completeFocus, leaveFocus, openBook, closeBook,
    openShop, closeShop, endDay, openMarket, closeMarket, shop, decorPieces, sign,
    desserts: DESSERTS,
    give: (id, step = 0) => {
      const d = DESSERTS.find((x) => x.id === id);
      const tk = { id: ticketSeq++, num: 9, customer: { name: 'Test', patience: 1, maxPatience: 1, tickets: [] }, d, steps: stepsFor(d), item: null };
      const it = newItem(tk);
      it.ticket = null;
      it.step = step;
      toHands(it);
      return it;
    },
    findTarget: () => { syncEye(); const t = findTarget(); return t ? (t.kind === 'ingredient' ? t.id : t.kind === 'customer' ? `customer:${t.c.name}` : t.kind === 'sign' ? 'sign' : t.station.id) : null; },
  };
}

const boot = window.claude?.hot?.ready ? (fn) => window.claude.hot.ready(fn) : (fn) => fn(window.claude?.hot?.data ?? {});
boot(start);
