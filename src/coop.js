// Co-op play for two chefs. The host's browser runs the kitchen (customers,
// timers, coins) and sends a snapshot about ten times a second; the guest's
// browser rebuilds that kitchen from the snapshots and sends its actions back
// for the host to carry out. Each side shows the other chef as a fox with a
// name tag, carrying whatever they're carrying. main.js owns the game rules;
// this file moves state between the two kitchens.
import * as THREE from 'three';
import { net } from './net.js';

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const SNAP_EVERY = 0.1;
const POS_EVERY = 0.08;
const r2 = (v) => Math.round(v * 100) / 100;

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function createCoop(G) {
  const { S, W, scene, ui, vm } = G;
  const host = net.role === 'host';
  const stById = G.stations;
  const C = {
    role: net.role,
    host,
    guest: !host,
    difficulty: net.difficulty,
    seq: 0, // guest: actions sent
    ack: 0, // host: guest actions handled
    events: [],
    flushNow: false,
    // a fresh kitchen each time the host starts one: ids restart, so the guest starts over too
    epoch: Math.random().toString(36).slice(2, 8),
  };

  // ------------------------------------------------------------ the other chef
  const mate = {
    name: net.partnerName,
    carry: null, // host only: the guest's carried item
    activeId: null, // host only: the guest's selected ticket
    here: net.partnerHere,
    goal: V3(-0.9, 0, 2.3),
    yaw: 0,
    moving: false,
    held: null,
  };
  C.mate = mate;
  const look = host ? { apron: '#86BADB', cls: 'guest' } : { apron: '#EE93A6', cls: 'host' };
  const avatar = G.makeAnimal('fox', { accessories: ['apron', 'chef'], apronColor: look.apron });
  avatar.root.scale.setScalar(1.3);
  avatar.root.traverse((m) => { m.castShadow = false; });
  avatar.root.position.copy(mate.goal);
  avatar.root.visible = false;
  scene.add(avatar.root);
  const hands = new THREE.Group();
  hands.position.set(0, 0.5, 0.3);
  avatar.bob.add(hands);
  const tag = ui.bubble(`name ${look.cls}`, '');
  tag.textContent = mate.name;
  // what the other chef just said in chat, over their head
  const said = ui.bubble('say chat', '');
  let saidT = 0;
  net.on('chat', (m) => {
    if (m.mine) return;
    said.textContent = m.text;
    saidT = Math.max(3, Math.min(8, m.text.length * 0.12));
  });
  let hideHeldT = 0;
  /** A thrown item is still in the air: keep their paws empty a moment. */
  mate.hideHeld = (t) => { hideHeldT = t; };
  /** Where the other chef's paws are, in the world. */
  mate.handsAt = () => avatar.root.localToWorld(V3(0, 0.62, 0.32));
  const mateBox = new THREE.Box3();
  /** The other chef as something to aim at (null when they're not around). */
  C.mateTarget = () => {
    if (!avatar.root.visible) return null;
    const p = avatar.root.position;
    mateBox.min.set(p.x - 0.4, 0, p.z - 0.4);
    mateBox.max.set(p.x + 0.4, 1.5, p.z + 0.4);
    return mateBox;
  };

  /** Put something in the other chef's paws (null to clear). */
  mate.hold = (obj) => {
    if (mate.held) mate.held.removeFromParent();
    mate.held = obj;
    if (!obj) return;
    obj.position.set(0, 0, 0);
    obj.rotation.set(0, 0, 0);
    obj.scale.setScalar(1);
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(V3());
    const s = 0.24 / Math.max(size.x, size.z, size.y * 0.8, 0.001);
    const c = box.getCenter(V3());
    obj.scale.setScalar(s);
    obj.position.set(-c.x * s, -box.min.y * s, -c.z * s);
    hands.add(obj);
  };

  function setMateName(name) {
    mate.name = name;
    tag.textContent = name;
    G.onMateName(name);
  }

  net.on('lobby', (l) => {
    const p = l.players.find((x) => x.cid !== net.cid);
    if (p && p.name !== mate.name) setMateName(p.name);
  });
  net.on('peerJoined', () => {
    mate.here = true;
    G.onMateJoin(mate.name);
    if (host) { sentDefs.clear(); C.flushNow = true; }
  });
  net.on('peerLeft', () => {
    mate.here = false;
    avatar.root.visible = false;
    tag.hidden = true;
    mate.hold(null);
    G.onMateLeave(mate.name);
  });
  net.on('closed', () => G.onConnectionLost());
  net.on('msg', (m) => (host ? hostReceive(m) : guestReceive(m)));

  // ------------------------------------------------------------ routed effects
  /** Host: queue something for the guest to see or hear (sent with the next snapshot). */
  C.event = (e) => {
    if (!host || !mate.here) return;
    C.events.push(e);
    if (C.events.length > 60) C.flushNow = true;
  };
  const vec = (a) => (a && a.isVector3 ? { v: [r2(a.x), r2(a.y), r2(a.z)] } : a);
  const unvec = (a) => (a && a.v ? V3(...a.v) : a);
  C.fx = (k, args) => C.event({ t: 'fx', k, a: args.map(vec) });

  // ------------------------------------------------------------ pings
  const pings = [];
  C.ping = (pos, who) => {
    const el = ui.bubble(`ping ${who}`, '!');
    pings.push({ el, pos: pos.clone(), t: 0 });
    G.sfx.bell();
    G.fx.sparkles(pos.clone(), 5, 0.3);
    if (pings.length > 4) pings.shift().el.remove();
  };
  C.sendPing = (pos) => {
    C.ping(pos, host ? 'host' : 'guest');
    net.send({ t: 'ping', p: [r2(pos.x), r2(pos.y), r2(pos.z)] });
  };

  // ------------------------------------------------------------ host side
  const sentDefs = new Set();
  const ticketDef = (tk) => ({ id: tk.id, d: tk.d.id, steps: tk.steps, variant: tk.variant, combo: tk.combo, special: tk.special });

  function snapshot() {
    const items = new Map();
    const add = (it, holder = null) => { if (it && !items.has(it.id)) items.set(it.id, { it, holder }); };
    add(S.carry, 'host');
    add(mate.carry, 'guest');
    for (const st of G.stationList) add(st.item);
    for (const tk of S.tickets) add(tk.item);
    const defs = [];
    const needDef = (tk) => {
      if (!tk || sentDefs.has(tk.id)) return;
      sentDefs.add(tk.id);
      defs.push(ticketDef(tk));
    };
    for (const tk of S.tickets) needDef(tk);
    for (const c of S.customers) for (const tk of c.pending || []) needDef(tk);
    for (const { it } of items.values()) needDef(it.stepsFrom);
    const it = [...items.values()].map(({ it: x, holder }) => ({
      id: x.id, d: x.d.id, sid: x.stepsFrom ? x.stepsFrom.id : 0, tid: x.ticket ? x.ticket.id : 0,
      s: x.step, g: [...x.got], r: [...x.raw], q: x.stars, b: x.burnt, sc: x.scorched ? 1 : 0, mi: x.mistakes,
      w: x.where, h: holder, st: x.station ? x.station.id : 0, di: x.decorIdx || 0, pv: x.preview ? 1 : 0, pb: x.previewBurnt || 0,
      pf: x.passFor ? [x.passFor.c.id, x.passFor.tk.id] : 0,
    }));
    const st = {};
    for (const s of G.stationList) {
      if (!s.item && !s.lockedBy && !s.t) continue;
      st[s.id] = [s.item ? s.item.id : 0, r2(s.t || 0), s.done ? 1 : 0, s.phase || 0, s.stirDue ? 1 : 0, r2(s.stirT || 0), s.stirs || 0, s.cookMode || 0, s.cookColor || 0, s.lockedBy || 0];
    }
    const cu = S.customers.map((c) => ({
      id: c.id, k: c.kind, n: c.name, acc: c.accessories, s: W.seats.indexOf(c.seat), o: c.orders.map((d) => d.id),
      st: c.state, m: c.mood, p: r2(c.patience), mp: r2(c.maxPatience), x: r2(c.a.root.position.x), y: r2(c.a.root.position.y), z: r2(c.a.root.position.z),
      ry: r2(c.a.root.rotation.y), tk: c.tickets.map((t) => t.id), pd: c.pending ? 1 : 0, t: r2(c.t), hop: r2(c.hop),
      pl: c.plates.map((p) => p.userData.spec || 0),
    }));
    const wa = G.waiters.map((w) => [r2(w.a.root.position.x), r2(w.a.root.position.z), r2(w.look), w.state === 'pause' && w.task && w.task.kind === 'take' ? 1 : 0, w.plate ? w.plate.userData.spec || 0 : 0]);
    const R = S.report;
    return {
      t: 'snap', ack: C.ack, ep: C.epoch,
      S: {
        coins: S.coins, served: S.served, day: S.day, phase: S.phase, clock: r2(S.clock), sp: S.special ? S.special.id : 0,
        stock: S.stock, up: S.upgrades, de: S.decor, rush: r2(S.rush || 0), wave: S.wave || 0, streak: S.streak || 0,
        rep: { served: R.served, coins: R.coins, tips: R.tips, stars: R.stars, left: R.left, penalty: R.penalty || 0 },
      },
      td: defs, tk: S.tickets.map((t) => [t.id, t.num, t.customer.id || 0]), it, st, cu, wa,
      me: [r2(G.P.x), r2(G.P.z), r2(G.yaw()), G.moving() ? 1 : 0, S.activeId || 0],
      ev: C.events.splice(0),
    };
  }

  function hostReceive(m) {
    if (m.t === 'pos') return mateMoved(m);
    if (m.t === 'ping') return C.ping(V3(...m.p), 'guest');
    if (m.t === 'hello') {
      sentDefs.clear();
      mate.here = true;
      C.flushNow = true;
      return;
    }
    if (m.seq) C.ack = Math.max(C.ack, m.seq);
    if (m.t === 'act') G.guestAct(m);
    else if (m.t === 'focus') G.guestFocus(m);
    C.flushNow = true;
  }

  // ------------------------------------------------------------ guest side
  const defs = new Map();
  const items = new Map();
  const tickets = new Map();
  let lastSnap = null;
  let epoch = null;

  /** Guest: ask the host to do something. */
  C.act = (m) => {
    C.seq += 1;
    net.send({ ...m, seq: C.seq });
  };

  function guestReceive(m) {
    if (m.t === 'pos') return mateMoved(m);
    if (m.t === 'ping') return C.ping(V3(...m.p), 'host');
    if (m.t !== 'snap') return;
    if (m.ep !== epoch) {
      epoch = m.ep;
      for (const it of items.values()) if (it.obj) it.obj.removeFromParent();
      items.clear();
      tickets.clear();
      defs.clear();
      C.seq = 0;
    }
    for (const d of m.td) defs.set(d.id, d);
    // our own actions not handled yet: keep what we see until the host catches up
    if (m.ack >= C.seq) applySnap(m);
    if (m.me) mateMoved({ x: m.me[0], z: m.me[1], yaw: m.me[2], mv: m.me[3], a: m.me[4] });
    for (const e of m.ev) guestEvent(e);
  }

  function guestEvent(e) {
    if (e.t === 'toast') ui.toast(...e.a);
    else if (e.t === 'sfx') G.sfx[e.k] && G.sfx[e.k](...e.a);
    else if (e.t === 'fx') G.fx[e.k] && G.fx[e.k](...e.a.map(unvec));
    else if (e.t === 'say') {
      const c = S.customers.find((x) => x.id === e.c);
      if (c) G.say(c, e.text, e.secs);
    } else if (e.t === 'bump') ui.bump(e.id);
    else if (e.t === 'focus') G.enterFocus(stById[e.st]);
    else if (e.t === 'phase') G.onPhase(e);
    else if (e.t === 'throw') G.onThrow(e);
    else if (e.t === 'banner') G.banner(e.text, e.sub);
  }

  function makeItem(r) {
    const def = defs.get(r.sid);
    return {
      id: r.id, d: G.BY_ID[r.d], steps: def ? def.steps : G.BY_ID[r.d].steps, stepsFrom: null, ticket: null, step: 0, got: new Set(), raw: new Set(),
      stars: 3, burnt: 0, scorched: false, mistakes: 0, where: 'hands', station: null, obj: null, work: null, decorIdx: 0,
    };
  }

  function applySnap(m) {
    const F = S.focus;
    const s = m.S;
    const prevPhase = S.phase;
    const upKey = S.upgrades.join(), deKey = S.decor.join();
    Object.assign(S, { coins: s.coins, served: s.served, day: s.day, phase: s.phase, clock: s.clock, stock: s.stock, upgrades: s.up, decor: s.de, rush: s.rush, wave: s.wave, streak: s.streak });
    Object.assign(S.report, s.rep);
    S.special = s.sp ? G.BY_ID[s.sp] : null;
    if (upKey !== S.upgrades.join()) G.hireWaiters();
    if (deKey !== S.decor.join() || (lastSnap && lastSnap.S.sp !== s.sp)) G.applyDecor();
    if (prevPhase !== S.phase) G.sign.set(S.phase === 'open');
    ui.stats(S.coins, S.served);

    // tickets
    const tlist = [];
    for (const [id, num, cid] of m.tk) {
      let tk = tickets.get(id);
      if (!tk) {
        const d = defs.get(id);
        if (!d) continue;
        tk = { id, num, customer: null, d: G.BY_ID[d.d], steps: d.steps, variant: d.variant, combo: d.combo, special: d.special, item: null };
        tickets.set(id, tk);
      }
      tk.num = num;
      tk.cid = cid;
      tk.item = null;
      tlist.push(tk);
    }

    // items
    const seen = new Set();
    let myCarry = null;
    for (const r of m.it) {
      seen.add(r.id);
      let it = items.get(r.id);
      if (!it) { it = makeItem(r); items.set(r.id, it); }
      const tk = r.tid ? tickets.get(r.tid) || null : null;
      if (tk) tk.item = it;
      if (F && F.it === it) continue; // our own close-up work is ours until we hand it back
      const def = defs.get(r.sid);
      if (def) it.steps = def.steps;
      it.ticket = tk;
      Object.assign(it, { step: r.s, stars: r.q, burnt: r.b, scorched: !!r.sc, mistakes: r.mi, decorIdx: r.di, preview: !!r.pv, previewBurnt: r.pb });
      it.got = new Set(r.g);
      it.raw = new Set(r.r);
      it.where = r.w;
      it.holder = r.h;
      it.station = r.w === 'station' ? stById[r.st] || null : null;
      it.passForIds = r.pf;
      if (r.h === 'guest' && r.w === 'hands') myCarry = it;
      const key = [r.w, r.h, r.st, r.s, r.g.length, r.r.length, r.pv, r.pb, r.b, r.di].join('|');
      if (it.placedKey !== key) {
        it.placedKey = key;
        if (r.w === 'hands') G.withActor(r.h === 'guest' ? 'me' : 'partner', () => G.placeItem(it));
        else G.placeItem(it);
      }
    }
    for (const [id, it] of items) {
      if (seen.has(id) || (F && F.it === it)) continue;
      if (it.obj) it.obj.removeFromParent();
      if (it.holder === 'host' && mate.held === it.obj) mate.hold(null);
      items.delete(id);
    }
    if (S.carry !== myCarry) {
      if (!myCarry) vm.setHeld(null);
      S.carry = myCarry;
    }
    if (mate.held && !m.it.some((r) => r.h === 'host' && r.w === 'hands')) mate.hold(null);

    // stations
    for (const st of G.stationList) {
      if (F && F.st === st) continue;
      const r = m.st[st.id] || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const it = r[0] ? items.get(r[0]) || null : null;
      const had = st.item;
      st.item = it;
      st.t = r[1];
      st.done = !!r[2];
      st.phase = r[3] || null;
      st.stirDue = !!r[4];
      st.stirT = r[5];
      st.stirs = r[6];
      st.cookMode = r[7] || null;
      st.cookColor = r[8] || null;
      st.lockedBy = r[9] || null;
      if (had !== it) {
        st.bounce = 1;
        if (st.type === 'bake') st.doorOpen = it ? 0.7 : 1.2;
        if (st.type === 'chill') { st.lidOpen = 0.8; if (it) st.lift = 0.6; }
      }
    }

    // customers
    const byId = new Map(S.customers.map((c) => [c.id, c]));
    const keep = [];
    for (const r of m.cu) {
      let c = byId.get(r.id);
      byId.delete(r.id);
      if (!c) {
        c = G.newCustomer({ id: r.id, kind: r.k, name: r.n, accessories: r.acc || [], seat: W.seats[r.s], orders: r.o.map((id) => G.BY_ID[id]), pos: V3(r.x, r.y, r.z), ry: r.ry });
      }
      c.goal = V3(r.x, r.y, r.z);
      c.goalRy = r.ry;
      const stateKey = `${r.st}|${r.tk.join(',')}|${r.pd}`;
      c.state = r.st;
      c.mood = r.m;
      c.patience = r.p;
      c.maxPatience = r.mp;
      c.t = r.t;
      if (r.hop > c.hop + 0.25) c.hop = r.hop;
      c.pending = r.pd ? [] : null;
      c.tickets = r.tk.map((id) => tickets.get(id)).filter(Boolean);
      for (const tk of c.tickets) tk.customer = c;
      if (c.stateKey !== stateKey) {
        c.stateKey = stateKey;
        c.bub.classList.toggle('taken', c.state !== 'ready');
        if (c.state === 'wait' && !c.tickets.length) c.bubImgs.innerHTML = c.orders.map((d) => `<span class="bo"><img src="${G.dessertURL(d)}" alt=""></span>`).join('');
        else G.refreshBubble(c);
        if (c.state === 'leave' || c.state === 'eat') c.hl.set(false);
      }
      const plKey = JSON.stringify(r.pl);
      if (c.plateKey !== plKey) {
        c.plateKey = plKey;
        for (const p of c.plates) p.removeFromParent();
        c.plates = r.pl.filter(Boolean).map((spec, i, all) => G.tablePlate(c, spec, i, all.length));
      }
      if (c.seat) c.seat.occupant = c.state === 'leave' ? null : c;
      keep.push(c);
    }
    for (const c of byId.values()) {
      G.fx.puff(c.a.root.position.clone().setY(0.2), 8, 0.55);
      scene.remove(c.a.root);
      c.bub.remove();
      c.say.remove();
      for (const p of c.plates) p.removeFromParent();
      if (c.seat && c.seat.occupant === c) c.seat.occupant = null;
    }
    S.customers = keep;
    for (const tk of tlist) if (!tk.customer) tk.customer = { name: 'a guest', patience: 1, maxPatience: 1, tickets: [] };
    S.tickets = tlist;
    for (const it of items.values()) {
      if (!it.passForIds) { it.passFor = null; continue; }
      const c = S.customers.find((x) => x.id === it.passForIds[0]);
      const tk = tickets.get(it.passForIds[1]);
      it.passFor = c && tk ? { c, tk } : null;
    }
    if (S.activeId && !S.tickets.some((t) => t.id === S.activeId)) S.activeId = null;
    if (!S.activeId && S.tickets.length) S.activeId = S.tickets[0].id;

    // waiters
    G.waiters.forEach((w, i) => {
      const r = m.wa[i];
      w.a.root.visible = !!r;
      if (!r) return;
      w.goal = V3(r[0], 0, r[1]);
      w.look = r[2];
      w.writing = !!r[3];
      const key = JSON.stringify(r[4]);
      if (w.plateKey !== key) {
        w.plateKey = key;
        if (w.plate) { w.plate.removeFromParent(); w.plate = null; }
        w.tray.visible = !!r[4];
        if (r[4]) {
          const [d, burnt, tops] = r[4];
          const plate = G.dessertModel(G.BY_ID[d], { burnt, tops });
          plate.scale.setScalar(0.85);
          plate.position.set(0, 0.01, 0);
          w.tray.add(plate);
          w.plate = plate;
        }
      }
    });
    lastSnap = m;
  }

  // ------------------------------------------------------------ mirrors (guest)
  function mirrorCustomers(dt) {
    for (const c of S.customers) {
      const r = c.a.root;
      const goal = c.goal || r.position;
      const d = V3(goal.x - r.position.x, 0, goal.z - r.position.z);
      const dist = d.length();
      let moving = false;
      if (dist > 2) r.position.set(goal.x, r.position.y, goal.z);
      else if (dist > 0.02) {
        d.normalize();
        r.position.addScaledVector(d, Math.min(dist, 2.4 * dt));
        if (c.state === 'enter' || c.state === 'leave') {
          moving = true;
          r.rotation.y += angleDiff(Math.atan2(d.x, d.z), r.rotation.y) * Math.min(1, dt * 10);
        }
      }
      if (!moving) r.rotation.y += angleDiff(c.goalRy ?? r.rotation.y, r.rotation.y) * Math.min(1, dt * 10);
      r.position.y = goal.y;
      if (c.state === 'ready' || c.state === 'wait') {
        c.patience -= dt;
        const frac = Math.max(0, Math.min(1, c.patience / c.maxPatience));
        c.bubBar.style.width = `${frac * 100}%`;
        c.bub.classList.toggle('low', frac < 0.3);
      } else if (c.state === 'eat') {
        c.t += dt;
        c.a.headG.rotation.x = Math.sin(c.t * 9) * 0.1;
        const bites = Math.floor(c.t / 1.3);
        for (const p of c.plates) G.eatTo(p, 1 - bites * 0.3, c.orders.length > 1 ? 0.85 : 1);
      } else c.a.headG.rotation.x = 0;
      if (c.hop > 0) {
        c.hop = Math.max(0, c.hop - dt * 2.5);
        c.a.bob.position.y = Math.sin(c.hop * Math.PI) * 0.35;
      }
      const dx = G.P.x - r.position.x, dz = G.P.z - r.position.z;
      const near = Math.hypot(dx, dz) < 3.2 && c.state !== 'enter' && c.state !== 'leave';
      G.animateAnimal(c.a, dt, S.time, moving, c.mood, { look: near ? angleDiff(Math.atan2(dx, dz), r.rotation.y) : 0, wave: c.state === 'ready' });
      if (c.sayT > 0) {
        c.sayT -= dt;
        if (c.sayT <= 0) c.say.hidden = true;
      }
    }
  }

  function mirrorWaiters(dt) {
    for (const w of G.waiters) {
      const r = w.a.root;
      const goal = w.goal || r.position;
      const d = V3(goal.x - r.position.x, 0, goal.z - r.position.z);
      const dist = d.length();
      let moving = false;
      if (dist > 2) r.position.set(goal.x, 0, goal.z);
      else if (dist > 0.02) {
        d.normalize();
        r.position.addScaledVector(d, Math.min(dist, 3 * dt));
        moving = dist > 0.05;
      }
      r.rotation.y += angleDiff(w.look, r.rotation.y) * Math.min(1, dt * 10);
      w.a.headG.rotation.x += ((w.writing ? 0.25 : 0) - w.a.headG.rotation.x) * Math.min(1, dt * 8);
      G.animateAnimal(w.a, dt, S.time, moving, 1, { look: 0, wave: false });
    }
  }

  // ------------------------------------------------------------ both sides
  /** Guest: an item by its id (the kitchen as the host last sent it). */
  C.itemById = (id) => items.get(id) || null;
  /** What the other chef is carrying. */
  C.mateCarry = () => {
    if (host) return mate.carry;
    for (const it of items.values()) if (it.holder === 'host' && it.where === 'hands') return it;
    return null;
  };

  function mateMoved(m) {
    if (m.a !== undefined) mate.activeId = m.a || null;
    mate.goal.set(m.x, 0, m.z);
    mate.yaw = m.yaw;
    mate.moving = !!m.mv;
    if (!avatar.root.visible) avatar.root.position.copy(mate.goal);
  }

  let snapT = 0, posT = 0;
  C.update = (dt) => {
    const playing = !['title', 'swoop'].includes(S.mode);
    if (!host && playing) {
      mirrorCustomers(dt);
      mirrorWaiters(dt);
      posT -= dt;
      if (posT <= 0) {
        posT = POS_EVERY;
        net.send({ t: 'pos', x: r2(G.P.x), z: r2(G.P.z), yaw: r2(G.yaw()), mv: G.moving() ? 1 : 0, a: S.activeId || 0 });
      }
    }
    if (host && mate.here) {
      snapT -= dt;
      if (snapT <= 0 || C.flushNow) {
        snapT = SNAP_EVERY;
        C.flushNow = false;
        net.send(snapshot());
      }
    }
    // the other chef
    const r = avatar.root;
    const show = mate.here && playing;
    // too close to the camera (standing in the same spot) it would fill the screen
    r.visible = show && Math.hypot(r.position.x - G.P.x, r.position.z - G.P.z) > 0.45;
    if (show) {
      const d = V3(mate.goal.x - r.position.x, 0, mate.goal.z - r.position.z);
      const dist = d.length();
      if (dist > 3) r.position.copy(mate.goal);
      else r.position.addScaledVector(d, Math.min(1, dt * 12));
      // the fox's face looks where the chef looks (the camera faces -z at yaw 0)
      r.rotation.y += angleDiff(mate.yaw + Math.PI, r.rotation.y) * Math.min(1, dt * 12);
      G.animateAnimal(avatar, dt, S.time, mate.moving || dist > 0.05, 1, { look: 0, wave: false });
      tag.hidden = false;
      ui.project(tag, V3(r.position.x, 1.75, r.position.z), G.cam, 16);
    } else tag.hidden = true;
    hideHeldT = Math.max(0, hideHeldT - dt);
    hands.visible = hideHeldT <= 0;
    saidT = Math.max(0, saidT - dt);
    said.hidden = !(show && saidT > 0);
    if (!said.hidden) ui.project(said, V3(r.position.x, 2.05, r.position.z), G.cam, 20);
    for (let i = pings.length - 1; i >= 0; i--) {
      const p = pings[i];
      p.t += dt;
      if (p.t > 4.5) {
        p.el.remove();
        pings.splice(i, 1);
        continue;
      }
      p.el.hidden = false;
      const bounce = Math.abs(Math.sin(p.t * 5)) * 0.08 * Math.max(0, 1 - p.t / 2);
      ui.project(p.el, V3(p.pos.x, p.pos.y + 0.25 + bounce, p.pos.z), G.cam, 30);
    }
  };

  /** Guest: say hello so the host sends everything from scratch. */
  if (!host) net.send({ t: 'hello' });
  return C;
}
