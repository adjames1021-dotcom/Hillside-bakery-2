import * as THREE from 'three';
import { G, mk, toon, outlineUniforms, setOutlineScale, setMaxAnisotropy } from './toon.js';
import { buildWorld, ROOM, FP_LAYER } from './world.js';
import { buildRestaurant } from './restaurant.js';
import { IS_RESTAURANT, WORDS, VENUE, switchVenue } from './venue.js';
import './rest3d.js';
import { makeAnimal, animateAnimal } from './characters.js';
import { DESSERTS, BY_ID, CATEGORIES, STATIONS, TOPPINGS, TOPPING_BY_ID, ING_PREP, dessertURL, extraTops } from './desserts.js';
import { ING_BY_ID, prepModel } from './ingredients.js';
import { createGame, MODE_HINT, TAP_LABEL } from './minigames.js';
import { Shop, UPGRADES, DECOR, freshStock } from './shop.js';
import { buildDecorPieces, buildOpenSign } from './decor.js';
import { dessertModel, bowlModel, liveFeature, featureProgress, featureTick, bitPile, bitColor, eatTo } from './dessert3d.js';
import { buildHighlight } from './merge.js';
import { ViewModel } from './viewmodel.js';
import { Input } from './input.js';
import { UI, stepWhere, stars } from './ui.js';
import { FX } from './fx.js';
import { sfx as sfxRaw, unlockAudio, isMuted, setMuted } from './audio.js';
import { net, setupLobby, leaveRoom, DIFFICULTY, chatLine } from './net.js';
import { createCoop } from './coop.js';

const $ = (s) => document.querySelector(s);
const BG = '#F9E2C8';
const SAVE_KEY = WORDS.saveKey;
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
// the restaurant's plates are pricier, and so are its tips
const COIN_SCALE = IS_RESTAURANT ? 1.6 : 1;
const TIP = IS_RESTAURANT ? 20 : 12;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const an = (name, cap = false) => `${/^[aeiou]/i.test(name) ? (cap ? 'An' : 'an') : (cap ? 'A' : 'a')} ${name}`;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const ROOM_CENTER = new THREE.Vector3(0, 1.2, 0);

const newReport = () => ({ served: 0, coins: 0, tips: 0, stars: 0, left: 0, penalty: 0, favs: {} });

// In co-op the host's sounds, toasts and sparkles can be sent on to the guest;
// start() installs the router once it knows who is who.
let ROUTE = null;
const sfx = new Proxy(sfxRaw, {
  get: (o, k) => (typeof o[k] === 'function' ? (...a) => (ROUTE ? ROUTE('sfx', k, a, () => o[k](...a)) : o[k](...a)) : o[k]),
});

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
  const W = IS_RESTAURANT ? buildRestaurant(scene) : buildWorld(scene);
  const LIT = W.lighting || { hemi: ['#FFF4DE', '#E2BE98', 1.35], sun: { color: '#FFE6C2', intensity: 1.5, pos: [4.5, 13, 10] } };
  if (W.bg) {
    scene.background = new THREE.Color(W.bg);
    renderer.setClearColor(W.bg);
  }
  scene.add(new THREE.HemisphereLight(...LIT.hemi));
  const sun = new THREE.DirectionalLight(LIT.sun.color, LIT.sun.intensity);
  sun.position.set(...LIT.sun.pos);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);

  renderer.shadowMap.needsUpdate = true;
  const fx = new FX(scene);
  for (const k of ['puff', 'hearts', 'sparkles', 'coins', 'dots']) {
    const raw = fx[k].bind(fx);
    fx[k] = (...a) => (ROUTE ? ROUTE('fx', k, a, () => raw(...a)) : raw(...a));
  }
  const vm = new ViewModel();
  const ui = new UI();

  // ---------------------------------------------------------------- co-op routing
  // Whose action is running decides who sees and hears it: 'me' (this chef),
  // 'partner' (the host doing the guest's action), 'world' (customers, the day)
  // or 'sim' (station timers, which both kitchens run for themselves).
  let coop = null;
  let actor = 'me';
  const isGuest = () => !!coop && coop.guest;
  const isHost = () => !!coop && coop.host;
  function withActor(who, fn) {
    const prev = actor;
    actor = who;
    try { return fn(); } finally { actor = prev; }
  }
  ROUTE = (kind, key, args, local) => {
    if (!coop || !coop.host || actor === 'me' || actor === 'sim') return local();
    if (kind === 'sfx') coop.event({ t: 'sfx', k: key, a: args });
    else if (kind === 'toast') coop.event({ t: 'toast', a: args });
    else if (kind === 'fx') coop.fx(key, args);
    // the guest's own sounds and messages are for the guest; sparkles are for everyone
    return actor === 'world' || kind === 'fx' ? local() : undefined;
  };
  {
    const toastRaw = ui.toast.bind(ui);
    ui.toast = (...a) => ROUTE('toast', 'toast', a, () => toastRaw(...a));
    const bumpRaw = ui.bump.bind(ui);
    ui.bump = (id) => { if (isHost() && actor !== 'sim') coop.event({ t: 'bump', id }); return bumpRaw(id); };
  }
  const input = new Input(canvas);
  const stations = W.stations;
  const stationList = Object.values(stations);
  const decorPieces = buildDecorPieces(scene);
  const sign = buildOpenSign();
  sign.group.position.copy(W.signPos || V3(4.3, 1.3, -4.82));
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
    const halfV = (aspect > 1.25 ? Math.max(7.8, 14.5 / aspect) : Math.max(9.5, 9.2 / aspect)) * (W.title && aspect > 1.25 ? W.title.zoom : 1);
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
    rush: 0, // co-op: how busy it is right now (0 calm … 1+ frantic)
    wave: 0, // co-op: rush waves so far today
    streak: 0, // co-op: guests served in a row without a walkout
  };
  let ticketSeq = 1, itemSeq = 1, custSeq = 1;
  const saveData = () => ({ coins: S.coins, served: S.served, day: S.day, stock: S.stock, upgrades: S.upgrades, decor: S.decor });
  window.claude?.hot?.snapshot?.(() => ({ save: saveData() }));

  // the host keeps the team's progress; a guest's own save stays untouched
  const save = () => {
    if (isGuest()) return;
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
  // co-op difficulty, the team streak and the rush (solo days play as before)
  const DIFF = () => DIFFICULTY[coop ? coop.difficulty : 3];
  const streakMul = () => 1 + Math.min(4, Math.max(0, (S.streak || 0) - 1)) * 0.1;
  const rushPatience = () => (coop ? DIFF().patience * (1 - 0.3 * (S.rush || 0) * DIFF().rush) : 1);
  const stepsFor = (d) => d.steps.map((st) => ({ ...st, tops: st.tops ? [...st.tops] : undefined }));
  const tip = (key, msg) => { if (!S.tips[key]) { S.tips[key] = true; ui.toast(msg, 'tip'); } };
  ui.stats(S.coins, S.served);

  // ---------------------------------------------------------------- items

  const isFryStep = (s) => !!s && s.t === 'cook' && /fry|sear|\boil\b/i.test(s.label);
  const isToastStep = (s) => !!s && s.t === 'cook' && /toast/i.test(s.label);
  const COOK_COLORS = [
    [/cherr/i, '#C8384A'], [/peach/i, '#F6A55A'], [/custard|curd/i, '#FFE066'], [/hot fudge|fudge|cocoa|chocolate/i, '#5A3422'],
    [/marshmallow/i, '#FFF6F0'], [/caramel|brown sugar|praline/i, '#C9782F'], [/coconut/i, '#D9B27A'], [/sugar/i, '#FFF3DC'],
    // the restaurant's pots
    [/saffron/i, '#F2B640'], [/risotto/i, '#F3E3B8'], [/tomato/i, '#D8402E'], [/mushroom/i, '#C9A27A'], [/cream/i, '#FFF3DC'], [/spaghetti|boil/i, '#F4D58A'],
  ];
  function cookColor(step, it) {
    for (const [re, col] of COOK_COLORS) if (re.test(step.label)) return col;
    return it.d.batter;
  }

  // How a treat looks right now: a bowl of ingredients, a bowl of batter, or the
  // treat itself with the features of unfinished steps hidden (and the step being
  // played built live, so the station can grow it as you work).
  function itemLook(it) {
    const steps = it.steps;
    let k = it.step;
    let burnt = it.burnt;
    if (it.preview) { k += 1; burnt = it.previewBurnt || it.burnt; }
    let form = 'bowl';
    const bits = [];
    for (let i = 0; i < k && i < steps.length; i++) {
      const s = steps[i];
      if (s.t === 'gather') { if (form !== 'model') bits.push(...s.items); }
      else if (s.t === 'cook' && isFryStep(s)) form = 'model';
      else if (s.t === 'mix' || s.t === 'cook' || s.t === 'chill') {
        // whatever was in the bowl is mixed (or melted) into the batter now
        if (form === 'bowl') form = 'batter';
        bits.length = 0;
      } else form = 'model';
    }
    const cur = it.preview ? null : steps[k];
    const st = it.where === 'station' ? it.station : null;
    const F = S.focus && S.focus.it === it ? S.focus : null;
    const live = F && !F.task.ing && cur && cur.fx && cur.fx !== 'flip' ? cur.fx : null;
    // shaping at the island and baking in the oven turn the batter into the treat right there
    // so does searing or frying in a pan
    if (form !== 'model' && cur && ((live && cur.t === 'prep') || (st && st.type === 'bake' && cur.t === 'bake') || (st && st.type === 'cook' && isFryStep(cur)))) form = 'model';
    if (form !== 'model') {
      if (cur && cur.t === 'gather') bits.push(...it.got);
      const batter = form === 'batter' ? it.d.batter : null;
      return { kind: 'bowl', bits: bits.slice(-8), batter };
    }
    const rest = steps.slice(k);
    const tops = steps.slice(0, k).filter((s) => s.t === 'decor').flatMap((s) => s.tops);
    if (cur && cur.t === 'decor') tops.push(...cur.tops.slice(0, F ? F.idx : it.decorIdx || 0));
    return {
      kind: 'model',
      hide: rest.filter((s) => s.fx).map((s) => s.fx),
      live,
      tops,
      raw: rest.some((s) => s.t === 'bake' || s.t === 'cook'),
      burnt,
      // in a pan or on an oven tray; in the restaurant, raw food is prepped on the board and only plated once it's cooked
      noPlate: (!!st && (st.type === 'bake' || (st.type === 'cook' && isFryStep(cur)))) || (IS_RESTAURANT && rest.some((s) => s.t === 'bake' || s.t === 'cook')),
      flip: !!F && !F.task.ing && !!cur && cur.fx === 'flip',
    };
  }

  function stationShowsItem(st, look) {
    if (st.type === 'mix') return false;
    if (st.type === 'cook') return look.kind === 'model' && st.cookMode === 'pan';
    return true;
  }

  // the biggest footprint (radius) and height each spot holds, so treats sit in
  // pans, on trays and on the board without poking through anything
  const FIT = { pass: [0.22, 0.42], prep: [0.2, 0.34], spot: [0.18, 0.42], decor: [0.3, 0.6], bake: [0.3, 0.32], cook: [0.165, 0.16], chill: [0.3, 0.5], mix: [0.3, 1] };

  function placeItem(it) {
    if (it.obj) it.obj.removeFromParent();
    const look = itemLook(it);
    let obj = look.kind === 'bowl' ? bowlModel(look.bits, look.batter, it.d) : dessertModel(it.d, look);
    it.look = look;
    it.live = look.kind === 'model' && look.live ? liveFeature(obj) : null;
    if (it.where === 'hands') {
      it.obj = obj;
      setHeld(obj);
      return;
    }
    if (it.where !== 'station') {
      it.obj = obj;
      return;
    }
    const st = it.station;
    const F = S.focus && S.focus.it === it ? S.focus : null;
    // while prepping ingredients the bowl waits beside the cutting board
    const side = !!st.sideSlot && (F ? !!F.task.ing : !!curStep(it) && curStep(it).t === 'gather');
    const slot = side ? st.sideSlot : st.slot;
    const [r, h] = side ? [0.17, 0.3] : FIT[st.type] || [0.3, 0.6];
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(V3()), c = box.getCenter(V3());
    const s = Math.min(1, r / Math.max(size.x / 2, size.z / 2, 1e-3), h / Math.max(size.y, 1e-3));
    obj.scale.setScalar(s);
    obj.position.set(slot.x - c.x * s, slot.y - box.min.y * s, slot.z - c.z * s);
    obj.userData.y0 = obj.position.y;
    obj.userData.top = slot.y + size.y * s;
    obj.userData.radius = Math.max(size.x, size.z) * s * 0.5;
    if (look.flip) {
      // turn the cake over around its middle
      const pivot = new THREE.Group();
      pivot.position.set(slot.x, slot.y + size.y * s * 0.5, slot.z);
      obj.position.sub(pivot.position);
      pivot.add(obj);
      pivot.rotation.x = Math.PI;
      pivot.userData = { ...obj.userData, flip: true };
      obj = pivot;
    }
    it.obj = obj;
    obj.visible = stationShowsItem(st, look);
    scene.add(obj);
    if (it.live) featureProgress(it.live, F && F.game ? F.game.progress : 0);
  }

  /** The paws that hold things: mine, or (when the host runs the guest's action) the other chef's. */
  function setHeld(obj) {
    if (actor === 'partner' && coop) coop.mate.hold(obj);
    else vm.setHeld(obj);
  }

  function newItem(tk) {
    const it = { id: itemSeq++, d: tk.d, steps: tk.steps, stepsFrom: tk, ticket: tk, step: 0, got: new Set(), raw: new Set(), stars: 3, burnt: 0, scorched: false, mistakes: 0, where: 'hands', station: null, obj: null, work: null, decorIdx: 0 };
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
    if (isDone(it)) {
      if (IS_RESTAURANT) return 'ready! Put it on the pass';
      return it.ticket ? `ready to serve ${it.ticket.customer.name}` : 'ready to serve';
    }
    const s = curStep(it);
    if (s.t === 'gather') {
      const need = s.items.filter((id) => !it.got.has(id)).map((id) => ING_BY_ID[id].name);
      const raw = [...it.raw].map((id) => ING_PREP[id].label.toLowerCase());
      if (!need.length && raw.length) return `${raw.join(', ')} at the ${STATIONS.prep.name}`;
      return `gather ${need.join(', ')} (${stepWhere(s)})${raw.length ? `, then ${raw.join(', ')} at the ${STATIONS.prep.name}` : ''}`;
    }
    if (s.t === 'decor') return `${IS_RESTAURANT ? 'plate' : 'decorate'} at the ${STATIONS.decor.name}`;
    return `${s.label.toLowerCase()} at the ${stepWhere(s)}`;
  }

  // ---------------------------------------------------------------- tickets

  function allItems() {
    const list = [];
    if (S.carry) list.push(S.carry);
    // the other chef's paws count too
    const other = actor === 'partner' ? hostCarry : coop && coop.host ? coop.mate.carry : null;
    if (other && other !== S.carry) list.push(other);
    for (const st of stationList) if (st.item) list.push(st.item);
    return list;
  }

  function makeVariant(d) {
    const steps = stepsFor(d);
    const decorIdx = steps.map((x) => x.t).lastIndexOf('decor');
    const allTops = steps.filter((x) => x.t === 'decor').flatMap((x) => x.tops);
    const opts = [];
    const extra = extraTops(d).filter((t) => !allTops.includes(t));
    if (extra.length) opts.push('extra', 'extra');
    if (allTops.includes('nuts')) opts.push('nonuts', 'nonuts');
    if (steps.some((x) => x.t === 'bake')) opts.push('toasty');
    opts.push('rush');
    const kind = pick(opts);
    if (kind === 'extra') {
      const top = pick(extra);
      if (decorIdx >= 0) steps[decorIdx].tops.push(top);
      else steps.push({ t: 'decor', tops: [top], label: IS_RESTAURANT ? 'Plate' : 'Decorate', station: 'decor' });
      const name = TOPPING_BY_ID[top].name;
      return { steps, variant: { kind, top, label: top === 'pink' ? 'Make it pink!' : `+ ${name}`, line: top === 'pink' ? 'and make it pink' : `with extra ${name.toLowerCase()}` } };
    }
    if (kind === 'nonuts') {
      for (const x of steps) if (x.t === 'decor') x.tops = x.tops.filter((t) => t !== 'nuts');
      return { steps: steps.filter((x) => x.t !== 'decor' || x.tops.length), variant: { kind, label: 'No nuts', line: 'but no nuts, please' } };
    }
    if (kind === 'toasty') return { steps, variant: { kind, label: IS_RESTAURANT ? 'Well done' : 'Extra toasty', line: IS_RESTAURANT ? 'well done, please' : 'extra toasty, if you can' } };
    return { steps, variant: { kind, label: 'In a hurry', line: "and I'm in a bit of a hurry" } };
  }

  function createTicket(c, d, combo = null, hold = false) {
    let num = 0;
    if (!hold) {
      const used = new Set(S.tickets.map((t) => t.num));
      num = 1;
      while (used.has(num)) num++;
    }
    const wantsVariant = (S.day >= 2 || S.report.served >= 2) && Math.random() < (S.day >= 3 ? 0.45 : 0.3);
    const { steps, variant } = wantsVariant ? makeVariant(d) : { steps: stepsFor(d), variant: null };
    const tk = { id: ticketSeq++, num, customer: c, d, steps, variant, combo, special: S.special === d, item: null };
    // a treat nobody is waiting for any more can join this order
    const orphan = allItems().find((it) => !it.ticket && it.d.id === d.id);
    if (orphan) {
      orphan.ticket = tk;
      orphan.steps = tk.steps;
      orphan.stepsFrom = tk;
      orphan.decorIdx = 0;
      tk.item = orphan;
    }
    if (hold) return tk;
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
    // regulars sometimes want a treat for a friend too (more often in a rush)
    if ((S.day >= 3 || (coop && S.rush > 0.5)) && Math.random() < 0.22 + (coop ? S.rush * 0.2 : 0)) {
      const second = chooseOrder([order.id]);
      if (second && second.steps.length <= 6) orders.push(second);
    }
    const seat = pick(seats);
    const kind = pick(['cat', 'bunny', 'bear', 'puppy']);
    const pool = ['apron', 'beret', 'bowtie', 'scarf'].sort(() => Math.random() - 0.5);
    const accessories = pool.slice(0, Math.floor(Math.random() * 3));
    if (accessories.includes('scarf') && accessories.includes('bowtie')) accessories.splice(accessories.indexOf('scarf'), 1);
    const door = W.door.clone();
    const c = newCustomer({ id: custSeq++, kind, name: pick(NAMES[kind]), accessories, seat, orders, pos: door });
    c.path = IS_RESTAURANT ? [seat.aisle.clone(), V3(seat.x, 0, seat.z)] : [V3(door.x, 0, -0.45), seat.aisle.clone(), V3(seat.x, 0, seat.z)];
    S.customers.push(c);
    fx.puff(door.clone().setY(0.2), 8, 0.55);
    sfx.bell();
    tip('firstCustomer', IS_RESTAURANT
      ? 'Guests are arriving! Your waiters take their orders and bring the tickets to the pass.'
      : 'A customer is here! Walk over, look at them and press E to take their order.');
    return c;
  }

  /** A customer in the room: their animal, bubbles and highlight (the guest builds these from snapshots too). */
  function newCustomer({ id, kind, name, accessories, seat, orders, pos, ry = 0 }) {
    const a = makeAnimal(kind, { accessories });
    a.root.traverse((m) => { m.castShadow = false; });
    a.root.position.copy(pos);
    a.root.rotation.y = ry;
    scene.add(a.root);
    const c = {
      id, a, kind, name, accessories, seat, order: orders[0], orders, state: 'enter', mood: 1, path: [],
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
    return c;
  }

  /** A served plate on the table in front of the customer. */
  function tablePlate(c, spec, i, n) {
    const [did, burnt] = spec;
    const plate = dessertModel(BY_ID[did], { burnt, split: true });
    plate.userData.spec = spec;
    const toTable = V3(W.tables[c.seat.table].x - c.seat.x, 0, W.tables[c.seat.table].z - c.seat.z).normalize();
    const side = V3(-toTable.z, 0, toTable.x).multiplyScalar(i ? 0.2 : n > 1 || c.orders.length > 1 ? -0.2 : 0);
    plate.position.copy(c.seat.plateSpot).add(side);
    if (c.orders.length > 1) plate.scale.setScalar(0.85);
    scene.add(plate);
    return plate;
  }

  function refreshBubble(c) {
    const list = c.state === 'ready' ? c.orders.map((d) => ({ d, tag: '' })) : c.tickets.map((tk) => ({ d: tk.d, tag: tk.variant ? tk.variant.label : '' }));
    c.bubImgs.innerHTML = list.map(({ d, tag }) => `<span class="bo"><img src="${dessertURL(d)}" alt="">${tag ? `<em>${tag}</em>` : ''}</span>`).join('');
  }

  function say(c, text, secs = 2.4) {
    if (isHost() && actor !== 'sim') coop.event({ t: 'say', c: c.id, text, secs });
    c.say.textContent = text;
    c.say.hidden = false;
    c.sayT = secs;
  }

  function takeOrder(c) {
    noteOrder(c);
    postOrder(c);
  }

  /** The customer tells you (or the waiter) what they'd like. */
  function noteOrder(c) {
    c.state = 'wait';
    const steps = c.orders.reduce((a, d) => a + d.steps.length, 0);
    c.patience = c.maxPatience = (200 + steps * (c.orders.length > 1 ? 38 : 45)) * patienceMul() * rushPatience();
    c.bub.classList.add('taken');
    const tks = c.orders.map((d, i) => createTicket(c, d, c.orders.length > 1 ? `${i + 1} of ${c.orders.length}` : null, true));
    c.pending = tks;
    const rush = tks.find((t) => t.variant && t.variant.kind === 'rush');
    if (rush) {
      c.patience = c.maxPatience = c.maxPatience * 0.6;
      c.coinBonus = 1.5;
    }
    const first = tks[0];
    let line = c.orders.length > 1
      ? `${an(c.orders[0].name, true)} and ${an(c.orders[1].name)}, please!`
      : IS_RESTAURANT
        ? pick([`I'll have the ${first.d.name}, please.`, `The ${first.d.name}, if you please!`, `One ${first.d.name}, thank you!`])
        : pick([`One ${first.d.name}, please!`, `Could I have the ${first.d.name}?`, `${first.d.name}, pretty please!`]);
    const v = tks.find((t) => t.variant);
    if (v) line = line.replace(/[!?.]$/, '') + `, ${v.variant.line}!`;
    say(c, line, 3.2);
    c.bubImgs.innerHTML = c.orders.map((d) => `<span class="bo"><img src="${dessertURL(d)}" alt=""></span>`).join('');
  }

  /** The order's tickets go up in the kitchen. */
  function postOrder(c) {
    const tks = c.pending || [];
    c.pending = null;
    for (const tk of tks) {
      const used = new Set(S.tickets.map((t) => t.num));
      let num = 1;
      while (used.has(num)) num++;
      tk.num = num;
      c.tickets.push(tk);
      S.tickets.push(tk);
      if (!activeTicket() || !activeTicket().item) S.activeId = tk.id;
    }
    refreshBubble(c);
    sfx.place();
    ui.bump('#tickets');
    const v = tks.find((t) => t.variant);
    tip('firstTicket', IS_RESTAURANT
      ? 'Order in! The ticket shows the recipe. Gather from the Pantry (left wall) and the Cold Room (front), cook it, then put the plate on the pass.'
      : 'Your ticket shows the recipe. Start by gathering ingredients from Dry Storage (left wall) and Cold Storage (front).');
    if (v) tip('variant', `Special request! The ticket shows "${v.variant.label}". Follow the ticket, not the recipe book.`);
    if (c.orders.length > 1) tip('combo', `${c.name} ordered two ${IS_RESTAURANT ? 'dishes' : 'treats'}. They wait for both before eating.`);
  }

  function leave(c, happy) {
    c.state = 'leave';
    c.mood = happy ? 1 : -1;
    const door = W.door.clone();
    c.path = IS_RESTAURANT ? [c.seat.aisle.clone(), door] : [c.seat.aisle.clone(), V3(door.x, 0, -0.45), door];
    c.bub.hidden = true;
    c.a.root.position.y = 0;
    c.hl.set(false);
    for (const tk of [...c.tickets]) removeTicket(tk);
    for (const p of c.plates) scene.remove(p);
    c.plates = [];
    if (!happy) {
      fx.dots(c.a.root.position.clone().setY(1.9));
      sfx.sad();
      S.report.left += 1;
      // in co-op a walkout costs the team its streak and a few coins
      const fine = coop ? Math.min(S.coins, DIFF().penalty) : 0;
      if (coop) {
        S.streak = 0;
        S.coins -= fine;
        S.report.penalty += fine;
        ui.stats(S.coins, S.served);
      }
      ui.toast(`${c.name} got tired of waiting and went home.${fine ? ` −${fine} coins` : ''}`, 'sad');
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
    setHeld(null);
    if (it.obj) it.obj.removeFromParent();
    deliver(c, tk, it);
  }

  function deliver(c, tk, it) {
    if (it.ticket && it.ticket !== tk) it.ticket.item = null;
    c.hop = 1;
    const frac = clamp(c.patience / c.maxPatience, 0, 1);
    const base = 8 + tk.steps.length * 5 + it.stars * 6 + Math.ceil(frac * 10) + (tk.variant && tk.variant.kind !== 'rush' ? 6 : 0);
    let mul = coinMul() * c.coinBonus * COIN_SCALE;
    // co-op: harder days pay more, and a streak of happy guests adds a team bonus
    if (coop) {
      S.streak = (S.streak || 0) + 1;
      mul *= DIFF().coins * streakMul();
    }
    if (tk.special) mul *= has('chalkboard') ? 2 : 1.5;
    const earned = Math.round(base * mul);
    const tipCoins = it.stars === 3 && has('tipjar') ? TIP : 0;
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
    const plate = tablePlate(c, [it.d.id, it.burnt], c.plates.length, c.orders.length);
    c.plates.push(plate);
    const head = c.a.root.position.clone().setY(1.6);
    fx.coins(head, 6);
    fx.hearts(head, it.stars + 2);
    fx.sparkles(plate.position.clone().setY(0.9), 6);
    sfx.coin();
    setTimeout(() => sfx.star(it.stars), 250);
    const extra = [tipCoins ? ` +${tipCoins} tip` : '', tk.special ? ' (special!)' : '', coop && S.streak > 1 ? ` · streak ×${streakMul().toFixed(1)}` : ''].join('');
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
    const lines = IS_RESTAURANT
      ? { 3: ['Magnifique!', 'My compliments to the chef!', 'Worth the view!'], 2: ['Delicious!', 'Very nice!'], 1: ['A little overdone… but tasty!', 'Hmm, rustic!'] }
      : { 3: ['Perfect!', 'Just like grandma makes!', 'The best in the hills!'], 2: ['Yummy!', 'So tasty!'], 1: ['A little toasty… but sweet!', 'Mmm, crunchy!'] };
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
        // two chefs share one clock: a co-op kitchen doesn't stop for a tea break
        const paused = (coop ? ['title', 'summary', 'market'] : ['book', 'pause', 'title', 'summary', 'market']).includes(S.mode);
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
          for (const p of c.plates) eatTo(p, 1 - bites * 0.3, c.orders.length > 1 ? 0.85 : 1);
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


  // ---------------------------------------------------------------- waiters (the restaurant)
  // Waiters take orders at the tables, carry the tickets to the pass, and run
  // finished plates from the pass to the guests. You cook; they serve.

  const waiters = [];
  const WAITER_LOOK = [['cat', 'Pierre', '#F4A646'], ['bunny', 'Lulu', '#FFF3E6'], ['puppy', 'Basil', '#D9A05B']];

  function trayModel() {
    const g = new THREE.Group();
    g.add(mk(G.cyl(0.2, 0.2, 0.016, 0.006, 28), '#C9D4D9', { outline: 'thin', cast: false }));
    const rim = mk(G.torus(0.2, 0.008, Math.PI * 2, 32), '#DCE6EA', { outline: false, cast: false });
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.01;
    g.add(rim);
    return g;
  }

  function hireWaiters() {
    if (!IS_RESTAURANT) return;
    const want = has('waiter') ? 3 : 2;
    while (waiters.length < want) {
      const i = waiters.length;
      const [kind, name] = WAITER_LOOK[i];
      const a = makeAnimal(kind, { accessories: ['waiter', 'bowtie'], bowColor: '#B9284A' });
      a.root.traverse((m) => { m.castShadow = false; });
      const home = W.waiterHomes[i].clone();
      a.root.position.copy(home);
      a.root.rotation.y = Math.PI / 2;
      scene.add(a.root);
      const tray = trayModel();
      tray.position.set(0.05, 0.52, 0.34);
      tray.visible = false;
      a.bob.add(tray);
      const w = { a, name, home, path: [], task: null, state: 'idle', t: 0, plate: null, tray, look: Math.PI / 2 };
      waiters.push(w);
      if (S.mode !== 'title' && i > 1) fx.puff(home.clone().setY(0.4), 6, 0.4);
    }
  }

  const inLane = (p) => p.x < 1.4;
  /** Waypoints through the dining room: the lane by the pass, the cross aisle, the middle aisle. */
  function route(from, to) {
    const { laneX, aisleX, crossZ } = W.nav;
    const pts = [];
    if (inLane(from) && inLane(to)) pts.push(to.clone());
    else if (inLane(from)) pts.push(V3(laneX, 0, crossZ), V3(aisleX, 0, crossZ), V3(aisleX, 0, to.z), to.clone());
    else if (inLane(to)) pts.push(V3(aisleX, 0, from.z), V3(aisleX, 0, crossZ), V3(laneX, 0, crossZ), to.clone());
    else pts.push(V3(aisleX, 0, from.z), V3(aisleX, 0, to.z), to.clone());
    return pts;
  }

  function sendWaiter(w, to, then) {
    w.path = route(w.a.root.position, to);
    w.state = 'walk';
    w.then = then;
  }

  const waitingFor = (c) => S.customers.includes(c) && c.state === 'wait';

  /** Which waiting guest a finished plate on the pass is for. */
  function passTarget(it) {
    const busy = new Set(waiters.filter((w) => w.task && w.task.tk).map((w) => w.task.tk));
    for (const st of W.passes || []) if (st.item && st.item !== it && st.item.passFor) busy.add(st.item.passFor.tk);
    if (it.ticket && !busy.has(it.ticket) && waitingFor(it.ticket.customer)) return { c: it.ticket.customer, tk: it.ticket };
    for (const c of S.customers) {
      if (!waitingFor(c)) continue;
      const tk = c.tickets.find((t) => t.d.id === it.d.id && (!t.item || t.item === it) && !busy.has(t));
      if (tk) return { c, tk };
    }
    return null;
  }

  function nextWaiterTask() {
    const taken = new Set(waiters.map((w) => w.task && (w.task.st || w.task.c)).filter(Boolean));
    // plates first, while they're hot
    for (const st of W.passes || []) {
      if (!st.item || taken.has(st)) continue;
      const pf = st.item.passFor;
      if ((pf && waitingFor(pf.c)) || passTarget(st.item)) return { kind: 'deliver', st };
    }
    const ready = S.customers.filter((c) => c.state === 'ready' && !taken.has(c));
    if (ready.length) return { kind: 'take', c: ready[0] };
    return null;
  }

  function startWaiterTask(w, task) {
    w.task = task;
    if (task.kind === 'take') {
      const c = task.c;
      sendWaiter(w, c.seat.stand, () => {
        if (!S.customers.includes(c) || c.state !== 'ready') return waiterDone(w);
        w.look = Math.atan2(c.seat.x - w.a.root.position.x, c.seat.z - w.a.root.position.z);
        w.state = 'pause';
        w.t = 1.3;
        noteOrder(c);
        w.then = () => {
          // back to the kitchen with the ticket
          const pass = (W.passes && W.passes[1]) || null;
          sendWaiter(w, pass ? pass.pickup : w.home, () => {
            if (S.customers.includes(c) && c.pending) {
              postOrder(c);
              sfx.bell();
              ui.toast(`Order in! ${c.tickets.map((t) => t.d.name).join(' and ')} for ${c.name}.`, 'good');
            }
            waiterDone(w);
          });
        };
      });
    } else if (task.kind === 'deliver') {
      const st = task.st;
      sendWaiter(w, st.pickup, () => {
        const it = st.item;
        if (!it) return waiterDone(w);
        const target = it.passFor && waitingFor(it.passFor.c) ? it.passFor : passTarget(it);
        if (!target) return waiterDone(w);
        // pick the plate up onto the tray
        st.item = null;
        st.bounce = 1;
        it.where = 'waiter';
        it.station = null;
        if (it.obj) it.obj.removeFromParent();
        const tops = itemLook(it).tops;
        const plate = dessertModel(it.d, { burnt: it.burnt, tops });
        plate.userData.spec = [it.d.id, it.burnt, tops];
        plate.scale.setScalar(0.85);
        plate.position.set(0, 0.01, 0);
        w.tray.add(plate);
        w.tray.visible = true;
        w.plate = plate;
        w.task = { ...task, it, c: target.c, tk: target.tk };
        sfx.pop();
        sendWaiter(w, target.c.seat.stand, () => {
          const c = w.task.c;
          w.tray.visible = false;
          if (w.plate) { w.plate.removeFromParent(); w.plate = null; }
          if (waitingFor(c) && c.tickets.includes(w.task.tk)) {
            w.look = Math.atan2(c.seat.x - w.a.root.position.x, c.seat.z - w.a.root.position.z);
            deliver(c, w.task.tk, it);
          } else {
            // the guest gave up: the plate goes back on the pass for the next order
            const free = (W.passes || []).find((p) => !p.item);
            if (free) {
              it.where = 'station';
              it.station = free;
              it.passFor = null;
              free.item = it;
              placeItem(it);
            } else if (it.ticket) it.ticket.item = null;
          }
          w.state = 'pause';
          w.t = 0.6;
          w.then = () => waiterDone(w);
        });
      });
    }
  }

  function waiterDone(w) {
    w.task = null;
    w.state = 'idle';
    if (w.a.root.position.distanceTo(w.home) > 0.1) {
      const task = nextWaiterTask();
      if (task) return startWaiterTask(w, task);
      sendWaiter(w, w.home, () => { w.state = 'idle'; w.look = Math.PI / 2; });
    }
  }

  function updateWaiters(dt) {
    const speed = 1.8 * (has('runners') ? 1.4 : 1);
    for (const w of waiters) {
      const r = w.a.root;
      let moving = false;
      if (w.state === 'idle' && S.mode !== 'title') {
        const task = nextWaiterTask();
        if (task) startWaiterTask(w, task);
      }
      if (w.state === 'walk') {
        const target = w.path[0];
        const d = V3(target.x - r.position.x, 0, target.z - r.position.z);
        const dist = d.length();
        if (dist < 0.05) {
          w.path.shift();
          if (!w.path.length) {
            w.state = 'arrived';
            const then = w.then;
            w.then = null;
            if (then) then();
            if (w.state === 'arrived') w.state = 'idle';
          }
        } else {
          d.normalize();
          r.position.addScaledVector(d, Math.min(dist, speed * dt));
          w.look = Math.atan2(d.x, d.z);
          moving = true;
        }
      } else if (w.state === 'pause') {
        w.t -= dt;
        if (w.t <= 0) {
          w.state = 'arrived';
          const then = w.then;
          w.then = null;
          if (then) then();
          if (w.state === 'arrived') w.state = 'idle';
        }
      }
      r.rotation.y += angleDiff(w.look, r.rotation.y) * Math.min(1, dt * 10);
      // a little bow while writing an order down
      const writing = w.state === 'pause' && w.task && w.task.kind === 'take';
      w.a.headG.rotation.x += ((writing ? 0.25 : 0) - w.a.headG.rotation.x) * Math.min(1, dt * 8);
      animateAnimal(w.a, dt, S.time, moving, 1, { look: 0, wave: false });
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
      if (id === 'waiter') hireWaiters();
      ui.stats(S.coins, S.served);
      save();
    },
    onOpen: () => closeMarket(),
    onShop: () => openMarket(false),
  });
  shop.bind(S);
  hireWaiters();

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
    if (isGuest()) return;
    if (coop) {
      S.wave = 0;
      S.rush = 0;
      S.streak = 0;
      coop.event({ t: 'phase', p: 'morning' });
      coop.flushNow = true;
    }
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
    if (coop) announce('Closing time!', 'Finish the last orders together');
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
    if (coop) {
      teamSummary(R);
      coop.event({ t: 'phase', p: 'summary', day: S.day, rep: { ...R, best: R.best ? R.best.id : 0, favs: {} } });
      coop.flushNow = true;
    }
    S.day += 1;
    save();
    sfx.unlock();
  }

  function openMarket(fromMorning) {
    if (isGuest()) return ui.toast(`${coop.mate.name} runs the market. Ask them to stock up!`);
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

  // Like a busy service: the day starts calm, builds steadily, and rush waves
  // (with banners) bring a burst of guests. The difficulty sets how hard it hits.
  const RUSH_WAVES = [
    { at: 0.25, name: IS_RESTAURANT ? 'Sunset rush!' : 'Lunch rush!', sub: 'Here come the crowds' },
    { at: 0.58, name: IS_RESTAURANT ? 'Dinner rush!' : 'Afternoon rush!', sub: 'Every seat wants filling' },
    { at: 0.84, name: 'Final rush!', sub: 'Last orders soon. Hang on!' },
  ];
  function updateRush() {
    const k = clamp((S.clock - T_OPEN) / (T_LAST - T_OPEN), 0, 1);
    let surge = 0;
    for (const w of RUSH_WAVES) {
      const d = k - w.at;
      if (d >= 0 && d < 0.1) surge = Math.max(surge, 0.25 * (1 - d / 0.1));
    }
    S.rush = clamp(0.1 + k * 0.8 + surge, 0, 1.15);
    const wave = RUSH_WAVES.filter((w) => k >= w.at).length;
    if (wave > S.wave && wave <= RUSH_WAVES.length) {
      S.wave = wave;
      const w = RUSH_WAVES[wave - 1];
      announce(w.name, w.sub);
      // the wave walks in right away
      S.spawnT = Math.min(S.spawnT, 1.2);
    }
  }

  const bannerEl = $('#banner');
  let bannerT = 0;
  function banner(text, sub = '') {
    $('#bannerText').textContent = text;
    $('#bannerSub').textContent = sub;
    $('#bannerSub').hidden = !sub;
    bannerEl.classList.add('show');
    bannerT = 2.6;
  }
  /** A big banner for both chefs. */
  function announce(text, sub) {
    banner(text, sub);
    sfx.alarm();
    if (isHost()) coop.event({ t: 'banner', text, sub });
  }

  /** Co-op: how the team did today. */
  function teamSummary(R) {
    const avg = R.served ? R.stars / R.served : 0;
    const rating = R.served && R.left === 0 && avg >= 2.5 ? 3 : R.served && R.left <= 2 && avg >= 2 ? 2 : 1;
    const li = (k, v) => `<li><span>${k}</span><b>${v}</b></li>`;
    $('#sumStats').insertAdjacentHTML('afterbegin', li('Team rating', stars(rating)) + li('Difficulty', DIFF().name));
    if (R.penalty) $('#sumStats').insertAdjacentHTML('beforeend', li('Walkout penalties', `−${R.penalty}`));
  }

  function updateDay(dt) {
    if (S.phase === 'morning') {
      S.clock += dt * MIN_PER_SEC * 1.6;
      if (S.clock >= T_OPEN) openShop();
    } else if (S.phase === 'open') {
      S.clock = Math.min(T_CLOSE, S.clock + dt * MIN_PER_SEC);
      if (S.clock >= T_CLOSE) closeShop();
      else if (S.clock < T_LAST) {
        updateRush();
        S.spawnT -= dt;
        const here = S.customers.filter((c) => c.state !== 'leave').length;
        let maxC = S.day === 1 ? (S.report.served < 2 ? 2 : 3) : S.day === 2 ? 3 : 4;
        // two chefs can handle more, and the rush packs the room
        if (coop) maxC = Math.max(2, maxC + 1 + DIFF().extra + (S.rush > 0.5 ? 1 : 0) + (S.rush > 0.85 ? 1 : 0));
        if (S.spawnT <= 0) {
          if (here < maxC && freeSeats().length) spawnCustomer();
          let next = 16 + Math.random() * 10 - Math.min(6, (S.day - 1) * 1.5);
          if (coop) next = (next * 0.75 * DIFF().spawn) / (1 + 1.4 * S.rush * DIFF().rush);
          S.spawnT = next;
        }
      } else if (coop && S.wave < RUSH_WAVES.length + 1) {
        S.wave = RUSH_WAVES.length + 1;
        announce('Last orders!', 'No new guests. Finish what you have');
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
    // co-op: aim at the other chef to throw them what you're holding
    const mb = coop && S.carry ? coop.mateTarget() : null;
    if (mb) {
      const t = rayBox(mb);
      if (t !== Infinity) {
        const sc = aimScore(mb, t);
        if (sc < bestS) { bestS = sc; best = { kind: 'mate', box: mb }; }
      }
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
    if (t.kind === 'mate') return it ? `Throw the ${it.d.name} to ${mateName()}` : mateName();
    if (t.kind === 'sign') return S.phase === 'morning' ? 'Flip the sign to Open' : S.phase === 'open' ? 'Open until 5 PM' : 'Closed for the day';
    if (t.kind === 'customer') {
      const c = t.c;
      if (IS_RESTAURANT) {
        if (c.state === 'ready') return `${c.name} is waiting for a waiter`;
        return `${c.name} is waiting for the ${c.tickets.map((t) => t.d.name).join(' and the ') || c.order.name}`;
      }
      if (c.state === 'ready') return `Take ${c.name}'s order`;
      if (ticketFor(c, it)) return `Serve the ${it.d.name} to ${c.name}`;
      return `${c.name} is waiting for the ${c.tickets.map((t) => t.d.name).join(' and the ') || c.order.name}`;
    }
    const st = t.station;
    if (st.type === 'scrap') return it ? `Toss the ${it.d.name}` : st.name;
    if (st.type === 'pass') {
      if (st.item) return !it && !waiters.some((w) => w.task && w.task.st === st) ? `Take back the ${st.item.d.name}` : `The ${st.item.d.name} is waiting for a waiter`;
      if (it && isDone(it)) return `Send out the ${it.d.name}`;
      return 'The Pass';
    }
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
      if (s.station === st.type) return s.t === 'decor' ? `${IS_RESTAURANT ? 'Plate' : 'Decorate'} the ${it.d.name}` : s.label;
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
    // the guest asks the host's kitchen to do it
    if (t.kind === 'mate') return throwToMate();
    if (isGuest()) return coop.act({ t: 'act', ...(t.kind === 'customer' ? { c: t.c.id } : { i: W.interact.indexOf(t) }), active: S.activeId });
    if (t.kind === 'ingredient') return grabIngredient(t);
    if (t.kind === 'customer') return talkTo(t.c);
    if (t.kind === 'sign') return flipSign();
    return useStation(t.station);
  }

  // ---------------------------------------------------------------- co-op: the guest's actions, run by the host
  let hostCarry = null;
  /** Run fn as the guest: their paws, their selected ticket, their messages. */
  function withPartner(activeId, fn) {
    const m = coop.mate;
    const mine = { carry: S.carry, activeId: S.activeId };
    hostCarry = S.carry;
    S.carry = m.carry;
    S.activeId = activeId ?? m.activeId;
    try {
      withActor('partner', fn);
    } finally {
      m.carry = S.carry;
      m.activeId = S.activeId;
      S.carry = mine.carry;
      S.activeId = mine.activeId;
      hostCarry = null;
    }
  }

  function guestAct(m) {
    if (!['play', 'focus', 'book', 'pause'].includes(S.mode)) return;
    if (m.throw) return hostThrow(true);
    const t = m.c ? S.customers.find((c) => c.id === m.c) : W.interact[m.i];
    if (!t) return;
    withPartner(m.active, () => {
      if (m.c) return (t.state === 'ready' || t.state === 'wait') && talkTo(t);
      if (t.kind === 'ingredient') return grabIngredient(t);
      if (t.kind === 'sign') return flipSign();
      return useStation(t.station);
    });
  }

  /** The guest finished (or stepped back from) a close-up job at a station. */
  function guestFocus(m) {
    const st = stations[m.st];
    if (!st) return;
    if (m.end !== 'stay' && st.lockedBy === 'guest') st.lockedBy = null;
    const it = st.item;
    if (!it || it.id !== m.id) return;
    Object.assign(it, { step: m.s, stars: m.q, mistakes: m.mi, decorIdx: m.di, burnt: m.b, work: null });
    it.got = new Set(m.g);
    it.raw = new Set(m.r);
    if (m.end === 'take') {
      st.item = null;
      st.bounce = 1;
      withPartner(null, () => toHands(it));
    } else placeItem(it);
  }

  /** Guest: tell the host how the close-up job went. */
  function reportFocus(F, end) {
    const it = F.it;
    coop.act({ t: 'focus', st: F.st.id, id: it.id, end, s: it.step, g: [...it.got], r: [...it.raw], q: it.stars, mi: it.mistakes, di: it.decorIdx || 0, b: it.burnt });
  }

  /** Guest: the host says a station is ours to work at. */
  function guestEnterFocus(st) {
    if (!st) return;
    if (S.mode !== 'play' || !st.item) {
      coop.act({ t: 'focus', st: st.id, id: 0, end: 'leave' });
      return;
    }
    enterFocus(st);
  }

  const mateName = () => (coop ? coop.mate.name : 'Someone');

  // ---------------------------------------------------------------- co-op: throwing to the other chef
  const THROW_RANGE = 8;
  let heldHideT = 0;
  /** A copy of what an item looks like right now, for flying through the air. */
  function itemCopy(it) {
    const look = itemLook(it);
    const m = look.kind === 'bowl' ? bowlModel(look.bits, look.batter, it.d) : dessertModel(it.d, look);
    const box = new THREE.Box3().setFromObject(m);
    const size = box.getSize(V3());
    m.scale.setScalar(0.3 / Math.max(size.x, size.y, size.z, 0.001));
    return m;
  }
  const myHands = () => V3(P.x - Math.sin(yaw) * 0.35, 0.95, P.z - Math.cos(yaw) * 0.35);
  /** The arc a thrown item takes, on whichever screen this is. */
  function throwFlight(it, from, to) {
    if (!it) return;
    const m = itemCopy(it);
    m.position.copy(from);
    scene.add(m);
    fly(m, to, 0.5, 0.55, null, true);
    sfx.whoosh();
  }

  /** Throw what you're holding to the other chef (the host decides if it lands). */
  function throwToMate() {
    if (!coop || !coop.mate.here) return;
    if (!S.carry) return nope('Your paws are empty.');
    vm.grab();
    if (isGuest()) return coop.act({ t: 'act', throw: 1 });
    hostThrow(false);
  }

  /** Host: move an item from one chef's paws to the other's. */
  function hostThrow(byGuest) {
    const m = coop.mate;
    const run = (fn) => (byGuest ? withPartner(null, fn) : fn());
    const giver = byGuest ? m.carry : S.carry;
    const taker = byGuest ? S.carry : m.carry;
    const takerName = byGuest ? net.name || 'The host' : m.name;
    if (!giver) return run(() => nope('Your paws are empty.'));
    if (taker) return run(() => nope(`${takerName}'s paws are full!`));
    const busy = byGuest ? !!S.focus : stationList.some((st) => st.lockedBy === 'guest');
    if (busy) return run(() => nope(`${takerName} is busy at a station.`));
    const mp = coop.mate.goal;
    if (Math.hypot(P.x - mp.x, P.z - mp.z) > THROW_RANGE) return run(() => nope(`${takerName} is too far away to catch it.`));
    const it = giver;
    const hostHands = myHands(), guestHands = m.handsAt();
    const [from, to] = byGuest ? [guestHands, hostHands] : [hostHands, guestHands];
    if (byGuest) {
      m.carry = null;
      m.hold(null);
      toHands(it);
      heldHideT = 0.5;
      ui.toast(`${m.name} threw you the ${it.d.name}!`, 'good');
    } else {
      S.carry = null;
      vm.setHeld(null);
      withPartner(null, () => toHands(it));
      m.hideHeld(0.5);
      withPartner(null, () => ui.toast(`${net.name || 'The host'} threw you the ${it.d.name}!`, 'good'));
    }
    throwFlight(it, from, to);
    coop.event({ t: 'throw', id: it.id, to: byGuest ? 'host' : 'guest', from: from.toArray(), at: to.toArray() });
    coop.flushNow = true;
  }

  /** Guest: the host says something flew through the air. */
  function onThrow(e) {
    const it = coop.itemById(e.id);
    if (e.to === 'guest') heldHideT = 0.5;
    else coop.mate.hideHeld(0.5);
    throwFlight(it, V3(...e.from), V3(...e.at));
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
        tip('mise', `Some ingredients need prepping first. Take the bowl to the ${STATIONS.prep.name} in the middle of the kitchen.`);
      } else finishGather(it);
    } else if (it.raw.has(ing.id)) {
      tip('mise', `${ing.name} needs prepping at the ${STATIONS.prep.name} before it goes in. You can prep now or after gathering.`);
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
    if (IS_RESTAURANT) {
      const want = c.tickets.map((t) => t.d.name).join(' and the ');
      say(c, c.state === 'ready' ? pick(['Good evening, chef! A waiter will be right with us.', 'What a view!']) : want ? pick([`Looking forward to the ${want}!`, 'Is that the sunset? Wonderful.']) : 'Just deciding…', 2.2);
      if (S.carry && isDone(S.carry)) ui.toast('Put finished plates on the pass. The waiters serve the tables.');
      sfx.pop();
      return;
    }
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
      mix: `The ${st.name} mixes, kneads and whips. Bring a bowl of ingredients.`,
      prep: `The ${st.name} is for rolling, chopping, scooping and filling.`,
      bake: `The ${st.name} bakes and roasts. Take things out while they are golden!`,
      cook: `The ${st.name} simmers, sears and fries. Stir or flip when it calls you.`,
      chill: `The ${st.name} chills and sets ${IS_RESTAURANT ? 'dishes' : 'desserts'}.`,
      decor: IS_RESTAURANT ? 'The Plating Station adds garnishes from the ticket.' : 'The Decorating Table adds toppings from the recipe card.',
      scrap: `The ${st.name} is for ${IS_RESTAURANT ? 'dishes' : 'treats'} that went wrong.`,
      pass: 'The Pass: put finished plates here and a waiter carries them to the table.',
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
    // two chefs, one station: whoever is working there has it
    const me = actor === 'partner' ? 'guest' : 'host';
    if (st.lockedBy && st.lockedBy !== me && st.type !== 'scrap') return nope(`${mateName()} is working at the ${st.name}.`);
    if (st.type === 'scrap') {
      if (!it) return ui.toast(stationHint(st));
      if (it.ticket) it.ticket.item = null;
      S.carry = null;
      setHeld(null);
      if (it.obj) it.obj.removeFromParent();
      fx.puff(st.slot.clone(), 6, 0.4);
      sfx.whoosh();
      st.bounce = 1;
      return ui.toast(`Tossed the ${it.d.name}. You can start it again from its ticket.`);
    }
    if (st.type === 'pass') return usePass(st);
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
        setHeld(null);
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
      if (!it) {
        // nothing left to do here (a finished step): just pick it back up
        if (isDone(si) || (curStep(si).t === 'gather' && !si.raw.size)) {
          st.item = null;
          toHands(si);
          sfx.pop();
          return;
        }
        return enterFocus(st);
      }
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
    setHeld(null);
    it.where = 'station';
    it.station = st;
    st.item = it;
    st.t = 0;
    st.done = false;
    st.phase = null;
    st.stirDue = false;
    st.stirs = 0;
    st.flipT = 0;
    st.bounce = 1;
    if (st.type === 'cook') {
      // fry in the pan, toast on a skewer, everything else simmers in the pot
      st.cookMode = isToastStep(step) ? 'toast' : itemLook(it).kind === 'model' && isFryStep(step) ? 'pan' : 'pot';
      st.cookColor = cookColor(step, it);
    }
    if (st.type === 'bake') { st.doorOpen = 0.7; sfx.door(); }
    // the freezer tray waits up at the rim, then lowers the treat in
    if (st.type === 'chill') { st.lidOpen = 0.8; st.lift = LIFT; }
    placeItem(it);
    sfx.place();
    if (ACTIVE[st.type]) return enterFocus(st);
    if (st.type === 'bake') {
      ui.toast(wantsToasty(it) ? `Baking the ${it.d.name}. ${it.ticket.customer.name} likes it extra toasty, so wait for the toasty zone!` : `Baking the ${it.d.name}. Take it out when the gauge is golden!`);
      tip('oven', 'Tip: start another order while the oven works. Just come back when it dings.');
    }
    if (st.type === 'cook') ui.toast(st.cookMode === 'pan' ? `Frying the ${it.d.name}. Flip it when the pan sizzles!` : st.cookMode === 'toast' ? 'Toasting the marshmallow. Turn it when it starts to brown!' : `${step.label}. Stir when the pot bubbles!`);
    if (st.type === 'chill') ui.toast(`Chilling the ${it.d.name}…`);
  }

  /** Finished plates go on the pass; a waiter carries them out. */
  function usePass(st) {
    const it = S.carry;
    if (st.item) {
      const si = st.item;
      const coming = waiters.some((w) => w.task && w.task.st === st);
      if (!it && !coming) {
        st.item = null;
        si.passFor = null;
        toHands(si);
        sfx.pop();
        return;
      }
      return nope(coming ? `${waiters.find((w) => w.task && w.task.st === st).name} is coming for the ${si.d.name}.` : 'That spot on the pass is taken.');
    }
    if (!it) return ui.toast(stationHint(st));
    if (!isDone(it)) return nope(`The ${it.d.name} isn't ready yet: ${nextStepText(it)}.`);
    const target = passTarget(it);
    if (!target) return nope(`Nobody is waiting for the ${it.d.name} right now. Set it on a counter spot for the next order.`);
    S.carry = null;
    setHeld(null);
    it.where = 'station';
    it.station = st;
    it.passFor = target;
    st.item = it;
    st.bounce = 1;
    placeItem(it);
    sfx.bell();
    fx.sparkles(st.slot.clone().setY(st.slot.y + 0.25), 6, 0.3);
    ui.toast(`Order up! ${target.tk.d.name} for ${target.c.name}.`, 'good');
    tip('pass', 'A waiter will pick the plate up and carry it to the table.');
  }

  const stirWord = (st) => (st.cookMode === 'pan' ? 'Flip' : st.cookMode === 'toast' ? 'Turn' : 'Stir');

  function stir(st) {
    st.stirDue = false;
    st.stirs += 1;
    st.bounce = 1;
    if (st.cookMode === 'pan') {
      st.flipT = 1;
      sfx.whoosh();
      ui.toast('Flipped! Golden on both sides.', 'good');
    } else {
      st.spin = 1;
      sfx.stir();
      ui.toast(st.cookMode === 'toast' ? 'Turned! Toasty all the way around.' : 'Stirred! Nice and smooth.', 'good');
    }
    fx.sparkles((st.cookMode === 'pot' ? st.potTop : st.slot).clone().add(V3(0, 0.12, 0)), 5);
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
    st.cookMode = null;
    toHands(it);
    fx.sparkles(st.slot.clone().setY(st.slot.y + 0.2), 6);
    sfx.pop();
    const toastyWish = st.type === 'bake' && wantsToasty(it);
    const msg = toastyWish
      ? (it.burnt === 1 ? 'Extra toasty, just as ordered! ' : it.burnt === 2 ? 'Oops, a little too toasty! ' : 'A bit pale for this customer. ')
      : it.burnt === 1 ? 'A bit toasty, but still tasty. ' : it.burnt === 2 ? 'Oops, a little burnt! ' : '';
    ui.toast(`${msg}${it.d.name}: ${isDone(it) ? 'ready to serve!' : `next, ${nextStepText(it)}.`}`, it.burnt && !(toastyWish && it.burnt === 1) ? 'sad' : 'good');
  }

  const tmpCol = new THREE.Color(), tmpCol2 = new THREE.Color();
  const LIFT = 0.6; // how far the freezer tray rises
  const mixCol = (a, b, k) => tmpCol.set(a).lerp(tmpCol2.set(b), clamp(k, 0, 1));

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
          // treats puff up gently as they bake
          if (it.obj && ph === 'baking') {
            const k = clamp(st.t / stepDur(step), 0, 1);
            it.obj.scale.y = it.obj.scale.x * (0.9 + 0.1 * k);
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
            ui.toast(st.cookMode === 'pan' ? `The pan is sizzling! Flip the ${it.d.name}.` : st.cookMode === 'toast' ? 'The marshmallow is browning! Turn it.' : `The pot is bubbling! Stir the ${it.d.name}.`);
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
                ui.toast(st.cookMode === 'pot' ? 'It scorched a little! Stir when the pot bubbles.' : 'One side got a bit dark! Catch it next time.', 'sad');
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
          if (Math.random() < dt * 4) fx.steam((st.cookMode === 'pot' ? st.potTop : st.slot).clone().add(V3(0, 0.12, 0)));
        } else if (st.type === 'chill') {
          if (!st.done && st.t >= stepDur(step)) {
            st.done = true;
            sfx.frost();
            ui.toast(`${step.label}: done! Grab it from the freezer.`, 'good');
            st.bounce = 1;
            fx.sparkles(st.slot.clone().setY(st.slot.y + 0.3), 10, 0.3);
          }
          if (!st.done && Math.random() < dt * 3) fx.sparkles(st.slot.clone().setY(0.98), 1, 0.25);
        }
      }
      // props and appliances react
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
        const mode = it ? st.cookMode : null;
        const cooking = !!it && !st.done;
        b.flame.material.opacity = mode === 'pot' && cooking ? 0.55 + Math.sin(S.time * 14) * 0.12 : 0;
        b.panFlame.material.opacity = (mode === 'pan' || mode === 'toast') && cooking ? 0.5 + Math.sin(S.time * 13) * 0.12 : 0;
        // the pot shows what's simmering, with bubbles that pop faster when it needs stirring
        const contents = mode === 'pot' ? st.cookColor : '#F3D9A6';
        b.soupMat.color.copy(mixCol(contents, '#8A3E22', st.stirDue ? 0.15 : 0));
        b.bubbleMat.color.copy(mixCol(contents, '#FFFBF0', 0.45));
        for (const bb of b.bubbles) {
          const ph = (S.time * (st.stirDue ? 3.2 : 1.5) + bb.userData.phase) % 1;
          bb.scale.setScalar(mode === 'pot' && cooking ? Math.max(0.01, Math.sin(ph * Math.PI)) : 0.01);
        }
        st.spin = Math.max(0, (st.spin || 0) - dt * 1.5);
        b.spoon.rotation.y += dt * (st.spin * 14 + (mode === 'pot' && cooking ? 0.8 : 0));
        // the pan shimmers; a flip tosses the treat up and over
        b.oilMat.emissiveIntensity = mode === 'pan' && cooking ? 0.2 + Math.sin(S.time * 9) * 0.06 : 0;
        if (mode === 'pan' && it.obj) {
          st.flipT = Math.max(0, (st.flipT || 0) - dt * 2.2);
          const f = st.flipT;
          it.obj.position.y = it.obj.userData.y0 + Math.sin(f * Math.PI) * 0.16;
          it.obj.rotation.x = (1 - f) * Math.PI * 2 * (f > 0 ? 1 : 0);
          if (cooking && Math.random() < dt * 3) fx.sparkles(st.slot.clone().add(V3((Math.random() - 0.5) * 0.2, 0.03, (Math.random() - 0.5) * 0.2)), 1, 0.12);
        }
        // a marshmallow on a stick turns golden over the open flame (the pan steps aside)
        b.skewer.visible = mode === 'toast';
        b.pan.visible = mode !== 'toast';
        if (mode === 'toast') {
          b.mallowMat.color.copy(mixCol('#FFF6F0', '#C9783A', st.t / stepDur(curStep(it))));
          b.skewer.rotation.x += dt * (st.spin * 10 + 0.5);
        }
      }
      if (st.type === 'chill') {
        // the tray brings a set treat up to the rim; the lid stays up while it's raised
        st.lidOpen = Math.max(0, (st.lidOpen || 0) - dt);
        const liftTo = it && st.done ? LIFT : st.lidOpen > 0.35 && st.lift > LIFT * 0.9 ? LIFT : 0;
        st.lift = (st.lift || 0) + (liftTo - (st.lift || 0)) * Math.min(1, dt * 3.5);
        if (Math.abs(st.lift - liftTo) < 0.002) st.lift = liftTo;
        b.tray.position.y = b.trayY + st.lift;
        b.post.position.y = b.trayY + st.lift / 2;
        b.post.scale.y = Math.max(0.001, st.lift);
        if (it && it.obj) it.obj.position.y = it.obj.userData.y0 + st.lift;
        const want = st.lidOpen > 0 || st.lift > 0.02 || (it && st.done) ? -1.15 : 0;
        b.lid.rotation.x += (want - b.lid.rotation.x) * Math.min(1, dt * 7);
      }
      if (st.type === 'mix') b.contents.visible = !!it;
      if (st.type === 'decor' && S.focus?.st === st) {
        b.turntable.rotation.y += dt * 0.9;
        if (it && it.obj) it.obj.rotation.y = b.turntable.rotation.y;
      }
      // the oven is a heavy appliance: it stays put (its door, glow and steam do the talking)
      if (st.hero && st.type !== 'bake') {
        st.bounce = Math.max(0, st.bounce - dt * 3);
        const bb = Math.sin(st.bounce * Math.PI) * 0.1;
        const wob = working && st.type !== 'prep' ? Math.sin(S.time * 18) * 0.02 : 0;
        const breathe = Math.sin(S.time * 2 + st.slot.x) * 0.008;
        st.hero.scale.set(1 - bb * 0.5 + wob, 1 + bb + breathe - wob, 1 - bb * 0.5 + wob);
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
            lbl = st.stirDue ? `${stirWord(st)}!` : st.done ? 'Done!' : st.cookMode === 'pan' ? 'Frying…' : st.cookMode === 'toast' ? 'Toasting…' : 'Cooking…';
            cls = st.stirDue ? 'alert' : st.done ? 'golden' : '';
          } else {
            k = st.t / stepDur(step);
            lbl = st.done ? 'Chilled!' : 'Chilling…';
            cls = st.done ? 'golden' : '';
          }
          st.bubFill.style.strokeDashoffset = `${(1 - clamp(k, 0, 1)) * 106.8}`;
          if (st.bubLbl.textContent !== lbl) st.bubLbl.textContent = lbl;
          st.bub.dataset.state = cls;
          const at = st.type === 'cook' && st.cookMode === 'pot' ? st.potTop : st.slot;
          const y = st.type === 'bake' ? 1.62 : at.y + 0.6 + (st.type === 'chill' ? st.lift || 0 : 0);
          ui.project(st.bub, V3(at.x, y, at.z), cam, 14);
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
    updateFlyers(dt);
    updateCrumbs(dt);
  }

  // crumbs, chips and sprinkles: tiny bits that fly off a knife or fall from a shaker
  const crumbs = [];
  function spawnCrumbs(at, col, n, { spread = 0.3, up = 0.5, floor = at.y - 0.05, size = 1, life = 0.9 } = {}) {
    for (let i = 0; i < n; i++) {
      const m = mk(G.sphere(0.0045, 8, 6), col, { outline: false, cast: false });
      m.scale.set(1.2, 0.7, 1).multiplyScalar(size * (0.7 + Math.random() * 0.6));
      m.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      m.position.copy(at).add(V3((Math.random() - 0.5) * 0.02, 0, (Math.random() - 0.5) * 0.02));
      scene.add(m);
      crumbs.push({ m, v: V3((Math.random() - 0.5) * spread, up * (0.5 + Math.random()), (Math.random() - 0.5) * spread), floor, t: 0, life, s0: m.scale.clone() });
    }
  }
  function updateCrumbs(dt) {
    for (let i = crumbs.length - 1; i >= 0; i--) {
      const c = crumbs[i];
      c.t += dt;
      c.v.y -= 2.6 * dt;
      c.m.position.addScaledVector(c.v, dt);
      const fl = typeof c.floor === 'function' ? c.floor(c.m.position.x, c.m.position.z) : c.floor;
      if (c.m.position.y < fl) { c.m.position.y = fl; c.v.multiplyScalar(0); }
      const k = c.t > c.life * 0.7 ? Math.max(0, 1 - (c.t - c.life * 0.7) / (c.life * 0.3)) : 1;
      c.m.scale.copy(c.s0).multiplyScalar(Math.max(0.01, k));
      if (c.t >= c.life) {
        c.m.removeFromParent();
        crumbs.splice(i, 1);
      }
    }
  }

  // little things flying between spots (a prepped pile hopping into the bowl)
  const flyers = [];
  function fly(obj, to, dur = 0.45, arc = 0.18, done = null, thrown = false) {
    scene.attach(obj);
    flyers.push({ obj, from: obj.position.clone(), to: to.clone(), t: 0, dur, arc, s0: obj.scale.x, done, thrown });
  }
  function updateFlyers(dt) {
    for (let i = flyers.length - 1; i >= 0; i--) {
      const f = flyers[i];
      f.t = Math.min(1, f.t + dt / f.dur);
      const e = ease(f.t);
      f.obj.position.lerpVectors(f.from, f.to, e);
      f.obj.position.y += Math.sin(f.t * Math.PI) * f.arc;
      if (f.thrown) f.obj.rotation.y = f.t * Math.PI * 2;
      else f.obj.scale.setScalar(f.s0 * (1 - 0.6 * f.t));
      if (f.t >= 1) {
        f.obj.removeFromParent();
        flyers.splice(i, 1);
        if (f.done) f.done();
      }
    }
  }

  // ---------------------------------------------------------------- focus mini-games

  function focusPose(st) {
    const F = S.focus;
    const target = st.slot.clone();
    // while prepping ingredients, frame both the cutting board and the bowl beside it
    if (st.type === 'prep' && F && F.task && F.task.ing && st.sideSlot) target.lerp(st.sideSlot, 0.42);
    if (st.type === 'decor') target.y += 0.1;
    if (st.type === 'mix') target.y += 0.02;
    // a fixed, square-on view: the station's front, or the island side you're nearest
    const away = F && F.st === st && F.viewDir ? F.viewDir : viewDir(st);
    if (F && F.st === st) F.viewDir = away;
    let dist = { mix: 0.95, decor: 0.9, prep: F && F.task && F.task.ing ? 0.95 : 0.8 }[st.type] || 0.85;
    let rise = { mix: 0.8, prep: 0.56 }[st.type] || 0.6;
    // narrow screens back off a little so the whole job fits across
    if (aspect < 1) { const k = 1 + (1 - aspect) * 0.8; dist *= k; rise *= k; }
    const pos = target.clone().addScaledVector(away, dist).add(V3(0, rise, 0));
    const fov = 55;
    const m = new THREE.Matrix4().lookAt(pos, target, V3(0, 1, 0));
    const quat = new THREE.Quaternion().setFromRotationMatrix(m);
    // tip the view down so the work sits in the clear space between the HUD and the mini-game card
    const H = window.innerHeight;
    // (layout position, so the card's wiggle animation doesn't shake the camera)
    const el = ui.game.el;
    const cardTop = !el.hidden && el.offsetHeight ? el.offsetTop + (el.offsetParent ? el.offsetParent.getBoundingClientRect().top : 0) : H * 0.62;
    const yFree = clamp((70 + cardTop) / 2, H * 0.2, H * 0.5);
    const off = Math.atan(((H / 2 - yFree) / (H / 2)) * Math.tan(THREE.MathUtils.degToRad(fov / 2)));
    quat.multiply(new THREE.Quaternion().setFromAxisAngle(V3(1, 0, 0), -off));
    return { pos, quat, fov };
  }

  function viewDir(st) {
    const q = st.group.getWorldQuaternion(new THREE.Quaternion());
    if (st.type !== 'prep') return V3(0, 0, 1).applyQuaternion(q).setY(0).normalize();
    const toP = V3(P.x - st.slot.x, 0, P.z - st.slot.z);
    let best = null, bestK = -Infinity;
    for (const d of [V3(1, 0, 0), V3(-1, 0, 0), V3(0, 0, 1), V3(0, 0, -1)]) {
      d.applyQuaternion(q).setY(0).normalize();
      const k = d.dot(toP);
      if (k > bestK) { bestK = k; best = d; }
    }
    return best;
  }

  function eyePose() {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
    return { pos: V3(P.x, EYE, P.z), quat: q, fov: fpFov() };
  }

  function tweenCam(to, dur = 0.55) {
    S.camTween = { from: { pos: cam.position.clone(), quat: cam.quaternion.clone(), fov: cam.fov }, to, t: 0, dur };
  }

  /** What the station should do with this item right now. */
  function focusTask(st, it) {
    const step = curStep(it);
    if (st.type === 'decor') return { key: `${it.step}:decor`, mode: 'decor', step, title: `${IS_RESTAURANT ? 'Plate' : 'Decorate'} the ${it.d.name}` };
    if (step.t === 'gather') {
      const ing = [...it.raw][0];
      const pd = ING_PREP[ing];
      return { key: `${it.step}:${ing}`, mode: pd.mode, step: { n: pd.n, label: pd.label }, title: pd.label, ing };
    }
    return { key: `${it.step}:${step.t}`, mode: step.mode, step, title: step.label };
  }

  /** Which island tool does this job. */
  function chooseTool(task) {
    const L = (task.title || '').toLowerCase();
    switch (task.mode) {
      case 'roll': return /grate|zest/.test(L) ? 'knife' : 'pin';
      case 'swirl': return /pipe|meringue/.test(L) ? 'bag' : /peel|core/.test(L) ? 'knife' : /smooth|spread|swirl the top|dome|roll up/.test(L) ? 'spatula' : 'spoon';
      case 'zigzag': return /drizzle|glaze/.test(L) ? 'bag' : /fold/.test(L) ? 'spatula' : /peel/.test(L) ? 'paw' : 'spoon';
      case 'fill': return /scoop/.test(L) ? 'scoop' : 'pitcher';
      case 'hit': return /scoop|spoon|drop|float/.test(L) ? 'scoop' : /cut|split|pit/.test(L) ? 'knife' : 'paw';
      case 'tap': return /press|squish|sandwich|mash/.test(L) ? 'tamper' : 'knife';
      case 'alternate': return /fork/.test(L) ? 'fork' : 'paw';
      case 'hold': return 'paw';
      case 'wiggle': return 'spoon';
      default: return null;
    }
  }

  // What's on the board, in board-local coordinates, for the tools to aim at:
  // the ingredient being prepped, the part of the treat this step builds (at its
  // finished size), or the batter in a bowl.
  function refreshTarget(F) {
    const st = F.st;
    const it = F.it;
    const live = !F.ingObj && it.live;
    const obj = F.ingObj || live || it.obj;
    if (!obj) return;
    let saved = null;
    if (live) {
      saved = [live.scale.clone(), live.position.clone()];
      live.scale.set(1, 1, 1);
      if (live.userData.y0 !== undefined) live.position.y = live.userData.y0;
    }
    // parents first: a treat that was only just placed hasn't been rendered yet
    obj.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(obj);
    if (saved) {
      live.scale.copy(saved[0]);
      live.position.copy(saved[1]);
      live.updateWorldMatrix(false, true);
    }
    if (box.isEmpty()) return;
    const c = box.getCenter(V3());
    let topY = box.max.y;
    let reach = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) * 0.5;
    if (!F.ingObj && it.look && it.look.kind === 'bowl') {
      // work the batter inside the bowl, not its rim
      topY = box.min.y + (box.max.y - box.min.y) * 0.62;
      reach *= 0.62;
    }
    F.target = st.group.worldToLocal(V3(c.x, topY, c.z));
    F.baseY = st.group.worldToLocal(V3(c.x, box.min.y, c.z)).y;
    // layers that grow or rise get worked at their current height, not their finished one
    F.growing = !!live && (live.userData.style === 'grow' || live.userData.style === 'rise');
    F.reach = Math.max(0.04, reach);
    F.height = box.max.y - box.min.y;
  }

  // board directions of screen-right and screen-down for the close-up camera
  function screenAxes(st) {
    const pose = focusPose(st);
    const right = V3(1, 0, 0).applyQuaternion(pose.quat).setY(0).normalize();
    const fwd = V3(0, 0, -1).applyQuaternion(pose.quat).setY(0).normalize();
    const inv = st.group.getWorldQuaternion(new THREE.Quaternion()).invert();
    return { ax: right.applyQuaternion(inv), ay: fwd.negate().applyQuaternion(inv) };
  }

  // the bowl waits beside the board on the side away from you when you work from its end
  function chooseSide(st) {
    if (!st.sideSlots) return;
    const [a, b] = st.sideSlots;
    // never between you and the board: when you look along the board, it goes on the far side
    const d = viewDir(st);
    st.sideSlot = a.clone().sub(st.slot).dot(d) > 0.1 ? b : a;
  }

  function resetTools(st) {
    for (const [k, t] of Object.entries(st.tools || st.built.tools || {})) {
      const rest = t.userData.rest;
      t.position.copy(rest.p);
      t.rotation.copy(rest.r);
      t.scale.setScalar(1);
      if (k !== 'pin' && k !== 'knife' && (st.type === 'prep')) t.visible = false;
    }
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
    S.focus = { st, it, task, step: task.step, mode: task.mode, game, idx: it.decorIdx || 0, doneT: 0, mistakes: 0, ingObj: null, pile: null, tool: null, chop: 0, rollPos: 0, pop: 0, side: 1, refreshT: 0 };
    const F = S.focus;
    if (st.type === 'prep') {
      resetTools(st);
      F.tool = chooseTool(task);
      if (F.tool) st.tools[F.tool].visible = true;
      Object.assign(F, screenAxes(st));
      // the bowl moves beside the board while ingredients are prepped; recipe steps build the treat live
      if (task.ing) chooseSide(st);
      placeItem(it);
      if (task.ing) {
        const m = prepModel(task.ing);
        const box = new THREE.Box3().setFromObject(m);
        const size = box.getSize(V3());
        const s0 = Math.min(1.3, 0.2 / Math.max(size.x, size.y, size.z, 0.01));
        m.scale.setScalar(s0);
        const c = box.getCenter(V3());
        // the whole ingredient sits a little left of center; its prepped pile grows to the right
        const spot = V3(0, 0.036, 0).addScaledVector(F.ax, -0.05);
        m.position.copy(st.group.localToWorld(V3(spot.x - c.x * s0, spot.y - box.min.y * s0, spot.z - c.z * s0)));
        m.userData.s0 = s0;
        scene.add(m);
        F.ingObj = m;
        const pile = bitPile(task.ing);
        const pp = V3(0, 0.036, 0).addScaledVector(F.ax, 0.19).addScaledVector(F.ay, -0.07);
        pile.position.set(clamp(pp.x, -0.27, 0.27), 0.036, clamp(pp.z, -0.17, 0.17));
        pile.userData.s0 = 1.6;
        pile.scale.setScalar(0.01);
        st.built.props.add(pile);
        F.pile = pile;
      }
      refreshTarget(F);
      if (F.tool === 'pitcher') {
        // a thin stream from the spout while you pour
        const col = task.ing ? bitColor(task.ing) : it.d.batter || '#F3D9A6';
        const stream = mk(G.cyl(0.008, 0.006, 1, 0.003, 10), toon(col), { outline: 'thin', cast: false });
        stream.visible = false;
        st.built.props.add(stream);
        F.stream = stream;
      }
    }
    if (st.type === 'mix') setupMixer(st, it, task);
    if (st.type === 'decor') placeItem(it);
    ui.showGame({
      station: `${st.name} · ${it.d.name}`,
      title: task.title,
      hint: task.ing ? `${ING_BY_ID[task.ing].name} for the ${it.d.name}. ${MODE_HINT[task.mode]}` : task.mode === 'decor' && IS_RESTAURANT ? 'Add the garnishes in ticket order. Keys 1–9, 0, - and = work too.' : MODE_HINT[task.mode],
      mode: task.mode,
      tapLabel: task.step.tapLabel || TAP_LABEL[task.mode] || 'Tap!',
      decor: task.mode === 'decor' ? { tops: curStep(it).tops, idx: F.idx } : null,
      game,
    });
    if (!game) ui.setGameProgress(F.idx / curStep(it).tops.length);
  }

  // The stand mixer: pick the attachment, fill the bowl with what you gathered.
  function setupMixer(st, it, task) {
    const b = st.built;
    const att = task.mode === 'tap' ? 'hook' : task.mode === 'zigzag' ? 'paddle' : 'whisk';
    for (const [k, g] of Object.entries(b.attach)) g.visible = k === att;
    const ids = it.steps.slice(0, it.step).filter((s) => s.t === 'gather').flatMap((s) => s.items);
    const cols = ids.map(bitColor);
    const avg = new THREE.Color(0, 0, 0);
    for (const c of cols) avg.add(new THREE.Color(c));
    if (cols.length) avg.multiplyScalar(1 / cols.length);
    st.mixFrom = cols.length ? '#' + avg.getHexString() : '#F3D9A6';
    st.mixTo = it.d.batter;
    b.batterMat.color.set(st.mixFrom);
    b.surface.visible = att !== 'hook';
    b.dough.visible = att === 'hook';
    b.dough.scale.set(1, 0.75, 1);
    b.bits.clear();
    ids.forEach((id, i) => {
      const a = i * 2.39996, d = 0.035 + (i % 3) * 0.035;
      const chunk = mk(G.sphere(0.018 + (i % 2) * 0.006, 12, 8), bitColor(id), { outline: 'thin', cast: false });
      chunk.position.set(Math.cos(a) * d, 0.012, Math.sin(a) * d);
      chunk.scale.y = 0.7;
      b.bits.add(chunk);
    });
  }

  function enterFocus(st) {
    // the host hands the guest the station; the guest plays the close-up at home
    if (actor === 'partner') {
      st.lockedBy = 'guest';
      coop.event({ t: 'focus', st: st.id });
      return;
    }
    if (isHost()) st.lockedBy = 'host';
    S.mode = 'focus';
    fx.scale = 0.45;
    setTarget(null);
    ui.prompt(null);
    vm.visible = false;
    input.dragLook = false;
    input.consumeMove();
    setupFocus(st, st.item);
    tweenCam('focus');
    tip('focus', 'Press Q or "Step back" to leave a station. Your progress is saved.');
  }

  function clearIngObj(F) {
    if (F.ingObj) {
      F.ingObj.removeFromParent();
      F.ingObj = null;
    }
    if (F.pile && F.pile.parent === F.st.built.props) {
      F.pile.removeFromParent();
      F.pile = null;
    }
    if (F.stream) {
      F.stream.removeFromParent();
      F.stream = null;
    }
  }

  function leaveFocus() {
    const F = S.focus;
    if (!F) return;
    // a topping still on its way lands now, and a step that just finished hands the treat back
    if (F.pendingTop !== undefined && F.pendingTop !== null) {
      F.pendingTop = null;
      if (F.idx >= F.step.tops.length) completeFocus();
    }
    F.st.toolAnim = null;
    if (F.doneT > 0 && !(F.task.ing && F.it.raw.size)) {
      F.doneT = 0;
      F.finished = true;
      finishFocus();
      return;
    }
    if (F.doneT <= 0 && !F.finished && F.it.station === F.st) {
      F.it.work = F.game ? { key: F.task.key, game: F.game } : null;
      F.it.decorIdx = F.idx;
    }
    if (isGuest() && !F.finished) reportFocus(F, 'leave');
    if (F.st.lockedBy === 'host') F.st.lockedBy = null;
    clearIngObj(F);
    S.focus = null;
    S.mode = 'play';
    fx.scale = 1;
    ui.hideGame();
    vm.visible = true;
    input.dragLook = true;
    tweenCam('eye');
    if (F.st.type === 'prep' || F.st.type === 'decor') resetTools(F.st);
    // the treat goes back to its resting look (no half-built live parts)
    if (F.it.station === F.st && F.it.where === 'station') placeItem(F.it);
  }

  /** Sounds, sparkles and toasts for mini-game events. */
  function handleEvents(F, events) {
    const st = F.st;
    const at = (F.ingObj ? F.ingObj.position : st.slot).clone().setY(st.slot.y + 0.1);
    for (const e of events) {
      if (e.type === 'stroke') {
        if (st.type === 'mix') { sfx.whisk(); fx.puff(st.slot.clone().setY(st.slot.y + 0.08), 1, 0.15); }
        else if (F.mode === 'tap' || F.mode === 'hit') { sfx.chop(); fx.puff(at, 2, 0.16); }
        else if (F.mode === 'alternate' || F.mode === 'order') { sfx.place(); fx.puff(at, 2, 0.14); }
        else sfx.whisk();
        F.chop = 1;
        F.side = -F.side;
        // chips and crumbs fly off the knife, tamper or paw on the board
        if (st.type === 'prep' && F.target && ['knife', 'tamper', 'paw', 'fork', 'scoop'].includes(F.tool)) {
          const col = F.task.ing ? bitColor(F.task.ing) : F.it.d.batter || '#E9A95A';
          const top = st.group.localToWorld(F.target.clone());
          const reach = F.reach * 0.85, board = st.slot.y + 0.002;
          // they settle on top of the food, or on the board if they fly clear of it
          const floor = (x, z) => (Math.hypot(x - top.x, z - top.z) < reach ? top.y - 0.003 : board);
          spawnCrumbs(top, col, F.tool === 'knife' ? 3 : 2, { spread: 0.35, up: 0.45, floor, life: 1.1 });
        }
        if (F.mode === 'roll' || F.mode === 'wiggle') F.rollPos = F.side * (F.reach || 0.1) * 0.6;
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
    if (!F || F.doneT > 0) return;
    if (F.mode === 'alternate') handleEvents(F, F.game.alt(side));
    else if (F.mode === 'zigzag' && F.game.key) handleEvents(F, F.game.key(side));
  }

  function pickLayer(label) {
    const F = S.focus;
    if (!F || F.doneT > 0 || F.mode !== 'order') return;
    F.lastPick = label;
    handleEvents(F, F.game.pick(label));
  }

  // which decorating tool lays down each topping
  const TOP_TOOL = IS_RESTAURANT
    ? { herbs: 'tweezers', basil: 'tweezers', flowers: 'tweezers', parmesan: 'grater', pepper: 'mill', sugar: 'sifter', oil: 'oil', balsamic: 'balsamic', sauce: 'sauce', cream: 'cream', lemon: 'lemons', raspberries: 'berries' }
    : { whipped: 'bag', frosting: 'bag', glaze: 'bag', pink: 'pink', sprinkles: 'shaker', powdered: 'sugar', fudge: 'fudge', caramel: 'caramel', cherry: 'cherries', strawberry: 'cherries', nuts: 'nuts', shavings: 'spatula' };

  function selectTopping(id) {
    const F = S.focus;
    if (!F || F.mode !== 'decor' || F.doneT > 0) return;
    const tops = F.step.tops;
    const want = tops[F.idx];
    if (id === want) {
      F.idx += 1;
      F.it.decorIdx = F.idx;
      sfx.pop();
      F.st.toolAnim = { key: TOP_TOOL[id], t: 0 };
      F.pendingTop = 0.38;
      ui.renderSeq(tops, F.idx);
      ui.setGameProgress(F.idx / tops.length);
      ui.toast(`${TOPPING_BY_ID[id].name} added!`, 'good');
    } else {
      F.mistakes += 1;
      F.it.mistakes += 1;
      sfx.nope();
      ui.renderSeq(tops, F.idx, id);
      ui.toast(`That's not next on the ticket. Look for ${TOPPING_BY_ID[want].name}.`);
    }
  }

  // the topping lands while the tool is over the treat
  function landTopping(F) {
    placeItem(F.it);
    F.pop = 1;
    fx.sparkles(F.st.slot.clone().setY(F.st.slot.y + 0.2), 6, 0.25);
    fx.puff(F.st.slot.clone().setY(F.st.slot.y + 0.15), 3, 0.2);
    if (F.idx >= F.step.tops.length) completeFocus();
  }

  function completeFocus() {
    const F = S.focus;
    if (!F || F.doneT > 0) return;
    const it = F.it;
    F.doneT = 0.85;
    F.finished = true;
    if (F.mode === 'decor' && F.mistakes >= 2) it.stars = Math.max(1, it.stars - 1);
    it.work = null;
    it.decorIdx = 0;
    let msg = F.mode === 'decor' ? 'Beautiful!' : 'Done!';
    if (F.task.ing) {
      const ing = F.task.ing;
      it.raw.delete(ing);
      msg = `${ING_BY_ID[ing].name}: ready!`;
      if (F.ingObj) fx.puff(F.ingObj.position.clone(), 4, 0.2);
      if (F.ingObj) { F.ingObj.removeFromParent(); F.ingObj = null; }
      // the prepped pile hops into the bowl
      const st = F.st;
      if (F.pile) {
        const pile = F.pile;
        F.pile = null;
        fly(pile, st.sideSlot.clone().add(V3(0, 0.07, 0)), 0.45, 0.16, () => {
          sfx.pop();
          fx.puff(st.sideSlot.clone().add(V3(0, 0.1, 0)), 2, 0.15);
        });
      }
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
      clearIngObj(F);
      setupFocus(F.st, it);
      if (isGuest()) reportFocus(S.focus, 'stay');
      return;
    }
    F.st.item = null;
    F.st.bounce = 1;
    leaveFocus();
    toHands(it);
    if (isGuest()) reportFocus(F, 'take');
    ui.toast(`${it.d.name}: ${isDone(it) ? `ready to serve${it.ticket ? ` ${it.ticket.customer.name}` : ''}!` : `next, ${nextStepText(it)}.`}`, 'good');
  }

  const lerpTo = (o, p, k) => o.position.lerp(p, k);
  const AX = V3(1, 0, 0), AY = V3(0, 1, 0), AZ = V3(0, 0, 1);
  const qTmp = new THREE.Quaternion();
  // a tool's pose: turn to a heading, then tip it about its own axes
  function toolQuat(out, yaw, ...tips) {
    out.setFromAxisAngle(AY, yaw);
    for (const [axis, ang] of tips) out.multiply(qTmp.setFromAxisAngle(axis, ang));
    return out;
  }
  // headings that point a tool's own +x (or +z) along a board direction
  const yawX = (d) => Math.atan2(-d.z, d.x);
  const yawZ = (d) => Math.atan2(d.x, d.z);

  // Island tools follow your input, worked out in screen terms so they move the
  // way your mouse does from wherever you stand: the knife chops where the slider
  // is, the pin rolls under the mouse, the piping bag and spoon trace your circles,
  // the pitcher tips while you hold.
  function animateIslandTools(F, dt, mv, held) {
    const st = F.st;
    const tl = st.tools;
    const g = F.game;
    if (!F.target || !F.tool || !g) return;
    const T = F.target, R = F.reach, k = clamp(g.progress, 0, 1);
    const ax = F.ax, ay = F.ay; // board directions of screen-right and screen-down (toward you)
    const away = ay.clone().negate();
    const t = tl[F.tool];
    const want = V3();
    const q = new THREE.Quaternion();
    const Ty = F.growing ? F.baseY + (T.y - F.baseY) * Math.max(0.15, k) : T.y;
    const at = (u, v, h) => want.copy(T).addScaledVector(ax, u).addScaledVector(ay, v).setY(Ty + h);
    const dirAt = (a) => ax.clone().multiplyScalar(Math.cos(a)).addScaledVector(ay, Math.sin(a));
    const a = g.angle || 0;
    const sweep = (g.sweepPos || 0) * R * 0.8;
    F.chop = Math.max(0, F.chop - dt * 6);
    F.rollPos = clamp((F.rollPos || 0) + mv.dy * 0.0011, -R * 0.75, R * 0.75);
    switch (F.tool) {
      case 'knife': {
        if (F.mode === 'swirl') {
          // a paring knife working round the fruit
          const d = dirAt(a);
          want.copy(T).addScaledVector(d, R * 0.92).setY(T.y - F.height * 0.4);
          toolQuat(q, yawX(dirAt(a + Math.PI / 2)), [AX, Math.PI / 2], [AY, -0.25]);
        } else if (F.mode === 'roll') {
          // zesting: the blade scrapes back and forth over the top
          at(F.rollPos * 0.8, 0, 0.012);
          toolQuat(q, yawX(away), [AY, -0.15]);
        } else {
          // chopping: side-on to you, edge down, the handle lifting between cuts
          const u = F.mode === 'hit' ? (g.needle - 0.5) * 2 * R * 0.85 : Math.sin(g.count * 2.1) * R * 0.5;
          // down fast, slide through the cut, then lift; a gentle hover while you wait
          const c = F.chop, down = c > 0.7 ? 1 : c / 0.7;
          const lift = (1 - down) * (1 - down) * 0.045 + Math.sin(S.time * 3) * 0.003 * (1 - down);
          at(u + 0.07, 0, 0.022 + lift).addScaledVector(away, Math.sin(c * Math.PI) * 0.025);
          toolQuat(q, yawX(ax.clone().negate()), [AX, Math.PI / 2], [AY, -0.35 * (1 - down)]);
        }
        break;
      }
      case 'pin': {
        // the pin lies across your view and rolls toward and away from you
        at(0, F.rollPos, 0.028);
        toolQuat(q, yawX(ax), [AX, -F.rollPos / 0.034]);
        break;
      }
      case 'bag': {
        // leaning away from you so you can see the tip meet the treat
        const lean = qTmp.setFromAxisAngle(ax, -0.45).clone();
        if (F.mode === 'zigzag') {
          at(sweep, Math.sin(S.time * 3) * R * 0.25, 0.018);
          q.setFromAxisAngle(ay, -(g.sweepPos || 0) * 0.35).multiply(lean);
        } else {
          const rr = R * 0.55 * (1 - k * 0.8);
          want.copy(T).addScaledVector(dirAt(a), rr).setY(Ty + 0.01);
          q.setFromAxisAngle(dirAt(a + Math.PI / 2), 0.2).multiply(lean);
        }
        const bulb = t.userData.bulb;
        if (bulb) {
          const squeeze = Math.min(1, (F.activity || 0) * 1.5) * 0.08;
          bulb.scale.set(1 + squeeze, Math.max(0.55, 1 - k * 0.4) * (1 - squeeze), 1 + squeeze);
        }
        break;
      }
      case 'spatula': case 'spoon': {
        // the handle comes toward you, like you're holding it
        const tilt = F.tool === 'spatula' ? 0.35 : 0.15;
        if (F.mode === 'zigzag') {
          at(sweep, 0, 0.02);
          toolQuat(q, yawZ(away) + (g.sweepPos || 0) * 0.5, [AX, tilt]);
        } else if (F.mode === 'wiggle') {
          const w = S.time * 7;
          const r = R * 0.4 * Math.min(1, 0.3 + (F.activity || 0));
          want.copy(T).addScaledVector(dirAt(w), r).setY(Ty + 0.02);
          toolQuat(q, yawZ(away) + Math.sin(w) * 0.3, [AX, tilt]);
        } else {
          want.copy(T).addScaledVector(dirAt(a), R * 0.45).setY(Ty + 0.015);
          toolQuat(q, yawZ(dirAt(a + Math.PI / 2)), [AX, tilt]);
        }
        break;
      }
      case 'scoop': {
        const u = F.mode === 'hit' ? (g.needle - 0.5) * 2 * R * 0.8 : 0;
        const dip = F.mode === 'fill' ? (held ? 0.5 + 0.5 * Math.sin(S.time * 8) : 0) : F.chop;
        at(u, 0, 0.07 - dip * 0.035);
        toolQuat(q, yawZ(away), [AX, dip * 0.9]);
        break;
      }
      case 'pitcher': {
        // stands to your left of the treat and tips its spout over the middle
        F.tilt = (F.tilt || 0) + ((held ? 1 : 0) - (F.tilt || 0)) * Math.min(1, dt * 8);
        at(-0.16, 0, 0.1);
        toolQuat(q, yawX(ax), [AZ, -F.tilt * 1.1]);
        if (F.stream) {
          const spout = V3(0.075, 0.14, 0).applyQuaternion(t.quaternion).add(t.position);
          const drop = Math.max(0.01, spout.y - Ty);
          F.stream.visible = F.tilt > 0.6;
          F.stream.position.set(spout.x, spout.y - drop / 2, spout.z);
          F.stream.scale.set(1, drop, 1);
        }
        break;
      }
      case 'tamper': {
        at(Math.sin(g.count * 2.4) * R * 0.4, Math.cos(g.count * 1.7) * R * 0.3, 0.003 + 0.05 * (1 - F.chop));
        break;
      }
      case 'fork': {
        // crisscross: the fork presses in at alternating angles
        const side = g.expect === 'L' ? 1 : -1;
        at(side * R * 0.3, 0, 0.004 + 0.03 * (1 - F.chop));
        toolQuat(q, yawZ(away) + side * 0.78, [AX, 0.12]);
        break;
      }
      case 'paw': default: {
        // works from the edge nearest you: laying strips, peeling, pressing
        const side = F.mode === 'alternate' ? (g.expect === 'L' ? 1 : -1) : F.mode === 'zigzag' ? (g.sweepPos || 0) : Math.sin(g.count * 2.3) * 0.5;
        const press = F.mode === 'hold' ? (held ? 0.7 + Math.sin(S.time * 14) * 0.15 : 0) : F.chop;
        at(side * R * 0.6, R * 0.55, 0.035 - press * 0.03);
        toolQuat(q, yawZ(away), [AX, 0.3 + press * 0.3]);
      }
    }
    const s = Math.min(1, dt * 14);
    lerpTo(t, want, s);
    t.quaternion.slerp(q, s);
    // a paring-sized knife for peeling and zesting, a small piping bag
    const size = F.tool === 'knife' && (F.mode === 'swirl' || F.mode === 'roll') ? 0.7 : F.tool === 'bag' ? 0.6 : F.tool === 'paw' ? 0.72 : F.tool === 'pin' ? 0.82 : 1;
    t.scale.setScalar(size);
    // the resting pin and knife stay put when they aren't the tool in use
    for (const key of ['pin', 'knife']) {
      if (key === F.tool) continue;
      const rest = tl[key].userData.rest;
      lerpTo(tl[key], rest.p, Math.min(1, dt * 10));
      tl[key].quaternion.slerp(qTmp.setFromEuler(rest.r), Math.min(1, dt * 10));
    }
  }

  // decorating tools hop over the treat, shake/pipe/drizzle, and hop back
  const SPRINKLE_COLS = ['#EE93A6', '#86BADB', '#FFE08A', '#AFCB9C', '#F4A646'];
  const POUR_COL = { fudge: '#5A3422', caramel: '#D9822F', pink: '#F7B9C4', bag: '#FFF3DC', oil: '#C9C04A', balsamic: '#4E2A2A', sauce: '#6E2A22', cream: '#FFF6E4' };
  // what falls from the shaking and placing tools, and where it comes out of them
  const CRUMB_COL = { sugar: '#FFFFFF', nuts: '#B87A45', cherries: '#E4605E', mill: '#2E1E14', grater: '#FBE8B0', sifter: '#FFFFFF', tweezers: '#6E9F4E', lemons: '#FFE066', berries: '#D8406A' };
  const CRUMB_FROM = { shaker: V3(0, 0.16, 0), sugar: V3(0, 0.16, 0), mill: V3(0, 0.002, 0), grater: V3(0, 0.18, 0.01), sifter: V3(0, 0.0, 0), tweezers: V3(0, 0.0, 0) };
  const qRot = new THREE.Quaternion();
  function animateDecorTools(F, dt) {
    const st = F.st;
    const A = st.toolAnim;
    const tools = st.built.tools;
    if (st.decorStream) st.decorStream.visible = false;
    if (!A || !tools[A.key]) return;
    const t = tools[A.key];
    A.t = Math.min(1, A.t + dt / 0.95);
    const rest = t.userData.rest;
    const topY = F.it.obj ? F.it.obj.userData.top : st.slot.y + 0.12;
    const over = st.group.worldToLocal(st.slot.clone().setY(topY + 0.1));
    const key = A.key;
    const pours = !!POUR_COL[key];
    const shakes = key === 'shaker' || key === 'sugar' || key === 'grater' || key === 'sifter' || key === 'mill';
    let p, r = rest.r.clone(), w = 0;
    if (A.t < 0.3) p = rest.p.clone().lerp(over, ease(A.t / 0.3));
    else if (A.t < 0.75) {
      p = over.clone();
      w = (A.t - 0.3) / 0.45;
      if (key === 'mill') { r.set(0, w * 16, 0); p.y += 0.08; }
      else if (key === 'grater') { r.set(-0.5, 0, 0); p.y += 0.02; p.x += Math.sin(w * 40) * 0.012; }
      else if (key === 'sifter') { r.set(0, 0, Math.sin(w * 30) * 0.18); p.y += 0.09; }
      else if (key === 'tweezers') { r.set(0, 0, 0); p.y += 0.02 - Math.sin(w * Math.PI) * 0.05; }
      else if (shakes) { r.set(Math.PI * 0.85, 0, Math.sin(w * 30) * 0.25); p.y += 0.06; }
      else if (key === 'cherries' || key === 'nuts' || key === 'lemons' || key === 'berries') { r.set(0, 0, 0.9 * Math.sin(w * Math.PI)); p.y -= 0.02; }
      else if (key === 'spatula') { r.set(0, w * 6, 0); p.y -= 0.07; }
      else if (key === 'bag') { r.set(0.25, 0, 0); p.y -= 0.045; }
      else { r.set(Math.PI * 0.92, 0, Math.sin(w * Math.PI * 4) * 0.15); p.y += 0.14; }
      // trace a little circle over the treat while the topping goes on
      p.x += Math.cos(w * Math.PI * 2) * 0.035;
      p.z += Math.sin(w * Math.PI * 2) * 0.035;
    } else p = over.clone().lerp(rest.p, ease((A.t - 0.75) / 0.25));
    t.position.copy(p);
    // turn smoothly instead of snapping between poses
    qRot.setFromEuler(A.t >= 0.75 ? rest.r : r);
    t.quaternion.slerp(qRot, A.t >= 0.999 ? 1 : Math.min(1, dt * 14));
    // what comes out of the tool: a stream from bottles and the bag, sprinkles and sugar from shakers
    if (w > 0.12 && w < 0.95) {
      t.updateMatrixWorld(true);
      if (pours) {
        const nozzle = t.localToWorld(key === 'bag' ? V3(0, -0.004, 0) : V3(0, 0.245, 0));
        if (!st.decorStream) {
          st.decorStream = mk(G.cyl(0.0055, 0.0045, 1, 0.002, 10), toon('#FFFFFF', { unique: true }), { outline: 'thin', cast: false });
          scene.add(st.decorStream);
        }
        const sm = st.decorStream;
        sm.material.color.set(POUR_COL[key]);
        const drop = Math.max(0.005, nozzle.y - topY);
        sm.visible = true;
        sm.position.set(nozzle.x, nozzle.y - drop / 2, nozzle.z);
        sm.scale.set(1, drop, 1);
      } else if (Math.random() < dt * (shakes ? 40 : 7)) {
        const from = t.localToWorld((CRUMB_FROM[key] || V3(0, 0.04, 0)).clone());
        const col = key === 'shaker' ? pick(SPRINKLE_COLS) : CRUMB_COL[key] || '#5A3422';
        const big = { cherries: 2.2, nuts: 1.5, lemons: 1.8, berries: 1.8, tweezers: 1.4 }[key] || 0.7;
        spawnCrumbs(from, col, shakes ? 2 : 1, { spread: 0.12, up: -0.1, floor: topY - 0.01, size: big, life: 0.7 });
      }
    }
    if (A.t >= 1) st.toolAnim = null;
  }

  function updateMixer(F, dt, mv, activity) {
    const b = F.st.built;
    const k = F.game ? clamp(F.game.progress, 0, 1) : 0;
    b.beater.rotation.y += dt * (2.5 + activity * 26);
    // planetary wobble around the bowl
    const w = S.time * 3.5;
    b.beater.position.x = 0.1 + Math.cos(w) * 0.02 * Math.min(1, activity + 0.2);
    b.beater.position.z = Math.sin(w) * 0.02 * Math.min(1, activity + 0.2);
    b.batterMat.color.copy(mixCol(F.st.mixFrom, F.st.mixTo, k * 1.15));
    b.surface.position.y = 0.09 + k * 0.025;
    b.swirlRing.visible = k > 0.15 && k < 0.98 && b.surface.visible;
    b.swirlRing.rotation.z += dt * (1 + activity * 8);
    b.swirlMat.color.copy(mixCol(F.st.mixTo, '#FFFBF0', 0.35));
    b.bits.children.forEach((ch, i) => {
      const s = Math.max(0.01, 1 - k * 1.4 + (i % 3) * 0.05);
      ch.scale.set(s, s * 0.7, s);
      ch.position.y = 0.012 + k * 0.02;
    });
    b.bits.rotation.y += dt * (0.5 + activity * 4);
    if (b.dough.visible) {
      F.chop = Math.max(0, F.chop - dt * 5);
      const sq = Math.sin(F.chop * Math.PI) * 0.25;
      b.dough.scale.set(1 + sq, 0.75 * (1 - sq) + k * 0.15, 1 + sq);
    }
  }

  function updateFocus(dt) {
    const F = S.focus;
    if (!F) return;
    const st = F.st;
    if (F.doneT > 0) {
      F.doneT -= dt;
      if (st.type === 'decor') animateDecorTools(F, dt);
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
    st.whiskBoost = Math.max(0, (st.whiskBoost || 0) - dt * 3);
    const activity = Math.min(1, mv.amt / 40 + st.whiskBoost + (held && (F.mode === 'hold' || F.mode === 'fill') ? 0.6 : 0));
    const it = F.it;
    // the treat grows the part this step adds
    if (it.live) {
      featureProgress(it.live, F.game ? F.game.progress : 0);
      featureTick(it.live, dt);
    }
    if (it.obj && it.obj.userData.flip) {
      const wantRot = Math.PI * (1 - clamp(F.game ? F.game.progress : 0, 0, 1));
      it.obj.rotation.x += (wantRot - it.obj.rotation.x) * Math.min(1, dt * 6);
    }
    if (st.type === 'mix') updateMixer(F, dt, mv, activity);
    if (st.type === 'prep') {
      F.activity = activity;
      F.refreshT -= dt;
      if (F.ingObj && F.refreshT <= 0) {
        refreshTarget(F);
        F.refreshT = 0.2;
      }
      animateIslandTools(F, dt, mv, held);
      if (F.ingObj) {
        // the whole ingredient shrinks as its prepped pile grows
        const o = F.ingObj;
        o.userData.squash = Math.max(0, (o.userData.squash || 0) - dt * 5);
        const k = F.game ? clamp(F.game.progress, 0, 1) : 0;
        const s0 = o.userData.s0;
        const sq = Math.sin(o.userData.squash * Math.PI) * 0.16;
        const shrink = 1 - k * 0.6;
        o.scale.set(s0 * (1 + sq) * shrink, s0 * (1 - sq) * shrink, s0 * (1 + sq) * shrink);
        if (F.mode === 'swirl' || F.mode === 'roll') o.rotation.y += dt * activity * 4;
        if (F.pile) {
          const ps = F.pile.userData.s0 * (0.15 + 0.85 * k);
          F.pile.scale.setScalar(k > 0.02 ? ps : 0.01);
        }
      }
    }
    if (st.type === 'decor') {
      animateDecorTools(F, dt);
      if (F.pendingTop !== undefined && F.pendingTop !== null) {
        F.pendingTop -= dt;
        if (F.pendingTop <= 0) {
          F.pendingTop = null;
          landTopping(F);
          if (S.focus !== F || F.doneT > 0) return;
        }
      }
      if (it.obj && F.pop > 0) {
        F.pop = Math.max(0, F.pop - dt * 3);
        const b = 1 + Math.sin(F.pop * Math.PI) * 0.12;
        const s = it.obj.userData.s || it.obj.scale.x;
        it.obj.userData.s = s;
        it.obj.scale.set(s * b, s / b, s * b);
      }
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
    if (chatOpen) return;
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
      else if (F && (F.mode === 'alternate' || F.mode === 'zigzag') && (k === 'a' || k === 'arrowleft')) focusAlt('L');
      else if (F && (F.mode === 'alternate' || F.mode === 'zigzag') && (k === 'd' || k === 'arrowright')) focusAlt('R');
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
    if (k === 'enter' && coop) { e.preventDefault(); openChat(); }
    else if (k === 'e' || k === 'enter' || k === ' ') interact();
    else if (k === 't' && coop) throwToMate();
    else if (k === 'r') openBook();
    else if (k === 'b') { if (S.phase === 'morning') openMarket(true); else openBook(); }
    else if (k === 'tab') cycleTicket();
    else if (k >= '1' && k <= '4') selectTicket(+k);
    else if (k === 'm') { setMuted(!isMuted()); refreshMute(); }
    else if (k === 'g' && coop) ping();
  };

  /** Co-op: mark the spot you're looking at for the other chef. */
  function ping() {
    syncEye();
    let at = null;
    if (S.target) {
      at = S.target.kind === 'customer' ? S.target.c.a.root.position.clone().setY(1.5) : S.target.box.getCenter(V3());
    } else {
      cam.getWorldPosition(rayO);
      cam.getWorldDirection(rayD);
      const t = rayD.y < -0.05 ? Math.min(6, -rayO.y / rayD.y) : 2.5;
      at = rayO.clone().addScaledVector(rayD, t);
    }
    coop.sendPing(at);
  }

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
  // the title card: which venue, and how far along each one is
  if (IS_RESTAURANT) {
    $('#titleEyebrow').textContent = 'A first-person cooking game';
    $('#titleName').innerHTML = 'Lantern <span>Cliff</span>';
    $('#titleLede').textContent = 'Run the open kitchen of a seaside restaurant at sunset. Cook 21 dishes while your waiters take orders and carry plates to the tables.';
    $('#startBtn').textContent = 'Open the restaurant';
    document.title = 'Lantern Cliff · Hillside Bakery';
  }
  if (S.served > 0 || S.day > 1) $('#startBtn').textContent = `Reopen the ${WORDS.shop} · Day ${S.day}`;
  for (const b of document.querySelectorAll('.venue')) {
    const v = b.dataset.venue;
    b.setAttribute('aria-checked', String(v === VENUE));
    let day = 0;
    try { day = (JSON.parse(localStorage.getItem(v === 'restaurant' ? 'hillside-restaurant-save' : 'hillside-bakery-save') || '{}') || {}).day | 0; } catch { day = 0; }
    if (day > 1) b.querySelector('small').textContent += ` · Day ${day}`;
    b.addEventListener('click', () => { if (v !== VENUE) switchVenue(v); });
  }
  pauseEl.addEventListener('click', resume);
  ui.ticketsEl.addEventListener('click', (e) => {
    const tog = e.target.closest('.ttog');
    if (tog) {
      const id = +tog.dataset.tog;
      if (pinned.has(id)) pinned.delete(id);
      else pinned.add(id);
      sfx.pop();
      return;
    }
    const t = e.target.closest('.ticket');
    if (!t) return;
    S.activeId = +t.dataset.id;
    sfx.pop();
  });

  // co-op tickets: yours open, your partner's open with their name, and any you pin open
  const pinned = new Set();
  function coTickets() {
    const mateIt = coop.mateCarry();
    const mateTk = new Set([coop.mate.activeId, mateIt && mateIt.ticket && mateIt.ticket.id].filter(Boolean));
    for (const id of pinned) if (!S.tickets.some((t) => t.id === id)) pinned.delete(id);
    return {
      open: new Set([...pinned, ...mateTk]),
      owner: (t) => (mateTk.has(t.id) && t.id !== S.activeId ? coop.mate.name : mateTk.has(t.id) ? `+ ${coop.mate.name}` : null),
      ownerCls: coop.guest ? 'host' : '',
      paws: (item) => (item === S.carry ? 'in your paws' : `in ${coop.mate.name}'s paws`),
    };
  }
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
        if (S.phase === 'morning') return `${IS_RESTAURANT ? 'Evening prep' : 'Morning prep'}. Flip the sign on the front door to open the ${WORDS.shop}.`;
        if (S.phase === 'closing') return IS_RESTAURANT ? 'Last service. The final guests are finishing up.' : 'Closing time. The last customers are heading home.';
        if (IS_RESTAURANT) return S.customers.some((c) => c.state === 'ready' || c.pending) ? 'A waiter is taking an order…' : 'Waiting for guests…';
        return S.customers.some((c) => c.state === 'ready')
          ? `A customer is ready to order. Look at them and press <kbd>${input.coarse ? 'Use' : 'E'}</kbd>`
          : 'Waiting for customers…';
      }
      const tk = activeTicket();
      if (tk && !tk.item) return `Next: gather for the <b>${tk.d.name}</b> in ${stepWhere(tk.steps[0])}.`;
      if (tk && tk.item) return `The <b>${tk.d.name}</b> is ${tk.item.where === 'waiter' ? 'on its way to the table' : tk.item.station && tk.item.station.type === 'spot' ? 'resting on the counter' : tk.item.station && tk.item.station.type === 'pass' ? 'on the pass' : tk.item.station ? `at the ${tk.item.station.name}` : 'waiting'}.`;
      return '';
    }
    return `<img src="${dessertURL(it.d)}" alt=""><span>Carrying <b>${it.d.name}</b> · ${nextStepText(it)}</span>`;
  }

  const rushPill = $('#rushPill'), streakPill = $('#streakPill'), partnerPill = $('#partnerPill');
  function updateCoopHUD() {
    const on = !!coop && S.mode !== 'title' && S.mode !== 'swoop';
    rushPill.hidden = !on || S.phase !== 'open';
    streakPill.hidden = !on || !(S.streak > 1);
    partnerPill.hidden = !on;
    if (!on) return;
    const r = S.rush || 0;
    const level = r < 0.3 ? 0 : r < 0.55 ? 1 : r < 0.85 ? 2 : 3;
    const label = ['Calm', 'Busy', 'Rush!', 'Frantic!'][level];
    if (rushPill.dataset.level !== String(level)) {
      rushPill.dataset.level = String(level);
      $('#rushText').textContent = label;
    }
    $('#rushBar').style.width = `${Math.min(100, (r / 1.15) * 100).toFixed(0)}%`;
    const st = `×${streakMul().toFixed(1)}`;
    if ($('#streakText').textContent !== st) $('#streakText').textContent = st;
    streakPill.dataset.hot = S.streak >= 5 ? '1' : '0';
    partnerPill.classList.toggle('off', !coop.mate.here);
    const tb = $('#throwBtn');
    const canThrow = !!S.carry && S.mode === 'play' && coop.mate.here;
    if (tb.hidden === canThrow) tb.hidden = !canThrow;
  }

  function updateHUD() {
    updateCoopHUD();
    ui.day(S, clockText(), S.phase === 'morning' ? 0 : clamp((S.clock - T_OPEN) / (T_CLOSE - T_OPEN), 0, 1), S.special);
    marketBtn.hidden = !(S.phase === 'morning' && S.mode === 'play');
    ui.renderTickets(S.tickets, S.activeId, coop ? coTickets() : null);
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
  let lastMoving = false;
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
    lastMoving = moving;
    if (S.mode === 'focus') updateFocus(dt);

    // the shop day: morning, open hours, closing (the host runs it for both chefs)
    const running = coop ? !['title', 'swoop', 'summary', 'market'].includes(S.mode) : S.mode === 'play' || S.mode === 'focus';
    if (running && !isGuest()) withActor('world', () => updateDay(dt));
    sign.update(dt);
    decorPieces.update(S.time);

    withActor('sim', () => updateStations(dt));
    if (!isGuest()) {
      withActor('world', () => {
        updateCustomers(dt);
        updateWaiters(dt);
      });
    }
    if (coop) coop.update(dt);
    if (bannerT > 0) {
      bannerT -= raw;
      if (bannerT <= 0) bannerEl.classList.remove('show');
    }
    fx.update(dt);
    ui.tick(dt);

    // ambience
    if (W.update) W.update(dt, S.time);
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
      // a tall diorama (the cliff) frames a little lower
      const TT = W.title || { zoom: 1, drop: 0, dropTall: 3.6 };
      target.addScaledVector(isoUp, -(aspect > 1.25 ? TT.drop : TT.dropTall));
      const pos = target.clone().addScaledVector(isoDir, TITLE_DIST).addScaledVector(isoUp, Math.sin(S.time * 0.4) * 0.15);
      cam.position.copy(pos);
      cam.fov = titleFov();
      cam.lookAt(target);
      // the diorama is ~72 m away: a tight near/far keeps depth precise so nothing flickers
      cam.near = TITLE_DIST - 22;
      cam.far = TITLE_DIST + 30;
      cam.layers.set(0);
      outlineUniforms.distRef.value = 1e6;
    } else if (S.mode === 'swoop') {
      S.swoop.t += raw / 2.1;
      const e = ease(clamp(S.swoop.t, 0, 1));
      const to = eyePose();
      cam.position.lerpVectors(S.swoop.from.pos, to.pos, e);
      cam.quaternion.slerpQuaternions(S.swoop.from.quat, to.quat, e);
      cam.fov = S.swoop.from.fov + (to.fov - S.swoop.from.fov) * e;
      const away = cam.position.distanceTo(ROOM_CENTER);
      cam.near = clamp(away - 16, 0.05, TITLE_DIST - 22);
      cam.far = Math.max(200, away + 30);
      outlineUniforms.distRef.value = 80 + (2.4 - 80) * e;
      if (e > 0.94) cam.layers.enable(FP_LAYER);
      fox.root.visible = e < 0.86;
      if (S.swoop.t >= 1) {
        S.mode = 'play';
        cam.layers.enable(FP_LAYER);
        sun.shadow.camera.layers.enable(FP_LAYER);
        renderer.shadowMap.needsUpdate = true;
        startMorning();
        if (isGuest()) ui.toast(`You're in ${coop.mate.name}'s ${WORDS.shop}! Grab tickets, cook together, and press G to ping a spot.`, 'tip');
      }
    } else {
      fox.root.visible = false;
      cam.near = 0.05;
      cam.far = 200;
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
      heldHideT = Math.max(0, heldHideT - raw);
      if (vm.held) vm.held.visible = heldHideT <= 0;
      vm.update(raw, { moving, speed: 2.9, aspect });
      renderer.clearDepth();
      renderer.render(vm.scene, vm.camera);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------------------------------------------------------------- co-op lobby and start
  const lobby = setupLobby({
    onOpen: () => { title.hidden = true; },
    onClose: () => { title.hidden = false; },
  });
  $('#coopBtn').addEventListener('click', () => { unlockAudio(); lobby.open(); });

  function onPhase(e) {
    if (e.p === 'summary') {
      if (S.focus) leaveFocus();
      S.mode = 'summary';
      setTarget(null);
      if (input.locked) expectUnlock = true;
      input.exitLock();
      const day = S.day;
      S.day = e.day;
      const rep = { ...e.rep, best: e.rep.best ? BY_ID[e.rep.best] : null };
      shop.showSummary({ report: rep });
      teamSummary(rep);
      S.day = day;
      $('#toMarket').hidden = true;
      $('#sumExtra').insertAdjacentHTML('beforeend', `<p class="coop-wait">${coop.mate.name} is shopping at the morning market. You'll be back in the ${WORDS.shop} soon!</p>`);
      sfx.unlock();
    } else if (e.p === 'morning' && S.mode === 'summary') {
      shop.hideSummary();
      $('#toMarket').hidden = false;
      // a click brings the mouse back into the kitchen
      if (input.coarse) S.mode = 'play';
      else {
        S.mode = 'pause';
        pauseEl.hidden = false;
      }
      ui.toast(`Good morning! Day ${S.day}. ${S.special ? `Today's special is the ${S.special.name}.` : ''}`, 'tip');
    }
  }

  function startCoop() {
    if (coop) return;
    coop = createCoop({
      S, W, scene, ui, vm, fx, sfx, cam, P, stations, stationList, waiters, BY_ID,
      makeAnimal, animateAnimal, dessertModel, dessertURL, placeItem, refreshBubble, hireWaiters, applyDecor, sign, say,
      newCustomer, tablePlate, withActor, guestAct, guestFocus, banner, onThrow, eatTo,
      yaw: () => yaw,
      moving: () => lastMoving,
      enterFocus: guestEnterFocus,
      onPhase,
      onMateName: (name) => { $('#partnerName').textContent = name; },
      onMateJoin: (name) => ui.toast(`${name} is in the kitchen!`, 'good'),
      onMateLeave: (name) => {
        if (coop.host) {
          // whatever the guest was holding goes back to its ticket
          const it = coop.mate.carry;
          if (it) {
            if (it.ticket) it.ticket.item = null;
            if (it.obj) it.obj.removeFromParent();
            coop.mate.carry = null;
          }
          for (const st of stationList) if (st.lockedBy === 'guest') st.lockedBy = null;
          ui.toast(`${name} left the kitchen. You can keep cooking; they can rejoin with the room code.`, 'sad');
        } else ui.toast(`${name} (the host) left. Waiting for them to come back…`, 'sad');
      },
      onConnectionLost: () => ui.toast('Lost the connection to the co-op room. Reload the page to rejoin.', 'sad'),
    });
    $('#partnerName').textContent = coop.mate.name;
    partnerPill.classList.toggle('host', coop.guest);
    document.body.classList.add('coop');
    chatEl.hidden = false;
    $('#chatBtn').hidden = false;
    renderChat();
    $('#leaveCoop').hidden = false;
    pauseEl.querySelector('h2').textContent = 'Quick breather';
    pauseEl.querySelector('.lede').textContent = 'The kitchen keeps going without you! Click anywhere to jump back in.';
    // the guest starts a step to the side, not inside the host
    if (coop.guest) {
      P.x += 1.1;
      P.z += 0.5;
      collide(P);
    }
    lobby.hide();
    title.hidden = true;
    if (coop.guest) {
      // the guest's kitchen is a mirror: the host's customers, tickets and coins
      for (const c of S.customers) { scene.remove(c.a.root); c.bub.remove(); c.say.remove(); }
      S.customers = [];
    }
    if (S.mode === 'title') startGame();
  }
  net.on('start', startCoop);

  // ---------------------------------------------------------------- co-op chat
  const chatEl = $('#chat'), chatLogEl = $('#chatLog'), chatForm = $('#chatForm'), chatIn = $('#chatIn');
  let chatOpen = false;
  function renderChat() {
    const now = Date.now();
    chatLogEl.innerHTML = net.chat.slice(chatOpen ? -20 : -5).map((m) => chatLine(m).replace('class="cl', `class="cl${now - m.at > 12000 ? ' old' : ''}`)).join('');
    chatLogEl.scrollTop = chatLogEl.scrollHeight;
  }
  setInterval(() => { if (coop && !chatOpen) renderChat(); }, 2000);
  net.on('chat', (m) => {
    renderChat();
    if (!m.mine && coop) sfx.pop();
  });
  function openChat() {
    if (!coop || chatOpen) return;
    chatOpen = true;
    input.keys.clear();
    chatEl.classList.add('open');
    chatForm.hidden = false;
    renderChat();
    chatIn.focus();
  }
  function closeChat() {
    if (!chatOpen) return;
    chatOpen = false;
    chatEl.classList.remove('open');
    chatForm.hidden = true;
    chatIn.blur();
    renderChat();
  }
  chatIn.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') { e.preventDefault(); closeChat(); }
  });
  chatIn.addEventListener('keyup', (e) => e.stopPropagation());
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    net.say(chatIn.value);
    chatIn.value = '';
    closeChat();
  });
  $('#chatBtn').addEventListener('click', () => {
    if (input.locked) expectUnlock = true;
    input.exitLock();
    openChat();
  });
  $('#throwBtn').addEventListener('click', () => throwToMate());
  $('#leaveCoop').addEventListener('click', (e) => {
    e.stopPropagation();
    leaveRoom();
  });

  // tiny hook for automated checks
  function syncEye() {
    if (S.mode !== 'play') return;
    cam.position.set(P.x, EYE, P.z);
    cam.rotation.set(pitch, yaw, 0);
    cam.updateMatrixWorld();
  }
  window.__bakery = {
    S, W, renderer, stations, cam, input, ui, vm, P, fx, placeItem, waiters,
    setView: (x, z, y, p) => { P.set(x, 0, z); yaw = y; if (p !== undefined) pitch = p; },
    lookAt: (x, y, z) => {
      const dx = x - P.x, dz = z - P.z;
      yaw = Math.atan2(-dx, -dz);
      pitch = Math.atan2(y - EYE, Math.hypot(dx, dz));
    },
    interactNow: () => { syncEye(); setTarget(findTarget()); interact(); },
    get coop() { return coop; },
    net, leaveRoom,
    interact, spawnCustomer, startGame, enterFocus, focusTap, focusAlt, pickLayer, selectTopping, completeFocus, leaveFocus, openBook, closeBook,
    __tickDay: (dt) => withActor('world', () => updateDay(dt)),
    tablePlate,
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
