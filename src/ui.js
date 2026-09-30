// DOM side of the HUD: order tickets, interaction prompt, world-anchored speech
// bubbles, the mini-game card, the recipe book and small overlays.
import * as THREE from 'three';
import { DESSERTS, BY_ID, CATEGORIES, STATIONS, TOPPINGS, TOPPING_BY_ID, ING_PREP, dessertURL, toppingURL } from './desserts.js';
import { ING_BY_ID, ingredientURL } from './ingredients.js';

const $ = (s) => document.querySelector(s);
const v3 = new THREE.Vector3();

function gatherZone(items) {
  const zones = new Set(items.map((id) => ING_BY_ID[id].zone));
  if (zones.size === 2) return 'Dry + Cold Storage';
  return zones.has('cold') ? 'Cold Storage' : 'Dry Storage';
}

export function stepWhere(s) {
  return s.t === 'gather' ? gatherZone(s.items) : STATIONS[s.station].name;
}

const LAYER_COLORS = {
  Bananas: '#FFE27A', Custard: '#FFE9A0', Wafers: '#E9C27E', 'Red layer': '#C84A4A', Frosting: '#FFF6E4',
  Sponge: '#F8DE9C', 'Chocolate layer': '#6A4029', Fudge: '#4E2B1C', Biscuit: '#E9B06A', Strawberries: '#E4605E',
  Graham: '#D9A05B', Chocolate: '#5A3422', Marshmallow: '#FFFBF0',
};
export const layerColor = (l) => LAYER_COLORS[l] || '#F3D9A6';

export function stars(n) {
  return '★★★'.slice(0, n) + '☆☆☆'.slice(0, 3 - n);
}

export class UI {
  constructor() {
    this.labels = $('#labels');
    this.toastEl = $('#toast');
    this.toastT = 0;
    this.promptEl = $('#prompt');
    this.promptKey = $('#promptKey');
    this.promptText = $('#promptText');
    this.cross = $('#crosshair');
    this.ticketsEl = $('#tickets');
    this.carryEl = $('#carry');
    this.coinsEl = $('#coins');
    this.servedEl = $('#served');
    this.game = {
      el: $('#game'), station: $('#gameStation'), title: $('#gameTitle'), hint: $('#gameHint'),
      meter: $('#gameMeter'), fill: $('#gameMeter i'), palette: $('#palette'), seq: $('#gameSeq'),
      tap: $('#gameTap'), leave: $('#gameLeave'), cursor: $('#vcursor'),
      band: $('#gameMeter .band'), timing: $('#gameTiming'), zone: $('#gameTiming .zone'), needle: $('#gameTiming b'),
      pips: $('#gamePips'), alt: $('#gameAlt'), altL: $('#altL'), altR: $('#altR'),
    };
    this.dayEl = $('#dayText');
    this.daySun = $('#daySun');
    this.specialEl = $('#specialPill');
    this.book = { el: $('#book'), tabs: $('#tabs'), grid: $('#grid'), sub: $('#bookSub') };
    this.tab = 'orders';
    this.ticketBars = new Map();
    this.lastTicketsKey = '';
  }

  // ---------------------------------------------------------------- basics

  toast(msg, kind = '') {
    this.toastEl.textContent = msg;
    this.toastEl.className = 'toast show ' + kind;
    this.toastT = Math.max(2.4, msg.length * 0.05);
  }

  tick(dt) {
    if (this.toastT > 0) {
      this.toastT -= dt;
      if (this.toastT <= 0) this.toastEl.classList.remove('show');
    }
  }

  prompt(text, key = 'E') {
    if (!text) {
      this.promptEl.hidden = true;
      this.cross.classList.remove('on');
      return;
    }
    this.promptEl.hidden = false;
    this.cross.classList.add('on');
    if (this.promptText.textContent !== text) this.promptText.textContent = text;
    if (this.promptKey.textContent !== key) this.promptKey.textContent = key;
  }

  crosshair(visible) {
    this.cross.hidden = !visible;
  }

  stats(coins, served) {
    this.coinsEl.textContent = coins;
    this.servedEl.textContent = served;
  }

  bump(id) {
    const el = $(id);
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }

  carry(html) {
    if (!html) {
      this.carryEl.hidden = true;
      return;
    }
    this.carryEl.hidden = false;
    // keep plain text in one flex item so it wraps as a sentence
    if (!html.startsWith('<img')) html = `<span>${html}</span>`;
    if (this.carryHTML !== html) {
      this.carryHTML = html;
      this.carryEl.innerHTML = html;
    }
  }

  day(S, clockText, frac, special) {
    const txt = `Day ${S.day} · ${clockText}`;
    if (this.dayEl.textContent !== txt) this.dayEl.textContent = txt;
    this.daySun.style.setProperty('--k', frac.toFixed(3));
    const key = special ? special.id : '';
    if (this.specialKey !== key) {
      this.specialKey = key;
      this.specialEl.hidden = !special;
      if (special) this.specialEl.innerHTML = `<img src="${dessertURL(special)}" alt=""><span><small>Special</small><b>${special.name}</b></span>`;
    }
  }

  // ---------------------------------------------------------------- world bubbles

  bubble(cls, html = '') {
    const el = document.createElement('div');
    el.className = 'bubble ' + cls;
    el.innerHTML = html;
    el.hidden = true;
    this.labels.appendChild(el);
    return el;
  }

  project(el, pos, cam, maxDist = 9) {
    v3.copy(pos).project(cam);
    const dist = cam.position.distanceTo(pos);
    if (v3.z > 1 || v3.z < -1 || Math.abs(v3.x) > 1.15 || Math.abs(v3.y) > 1.15 || dist > maxDist) {
      el.style.visibility = 'hidden';
      return false;
    }
    el.style.visibility = '';
    const x = (v3.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-v3.y * 0.5 + 0.5) * window.innerHeight;
    const s = Math.max(0.62, Math.min(1.05, 3.2 / Math.max(dist, 0.1)));
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%) scale(${s.toFixed(3)})`;
    return true;
  }

  // ---------------------------------------------------------------- tickets

  ticketHTML(tk, active) {
    const d = tk.d;
    const item = tk.item;
    const stepIdx = item ? item.step : 0;
    const got = item ? item.got : new Set();
    const raw = item ? item.raw : new Set();
    const where = !item ? 'not started' : item.where === 'hands' ? 'in your paws' : item.station && item.station.type === 'spot' ? 'resting on the island' : `at the ${item.station.name}`;
    let body;
    if (active) {
      const steps = tk.steps.map((s, i) => {
        const cls = i < stepIdx ? 'done' : i === stepIdx ? 'now' : '';
        let icons = '';
        if (s.t === 'gather') {
          icons = `<span class="icons">${s.items.map((id) => {
            const have = i < stepIdx || (i === stepIdx && got.has(id));
            const isRaw = i === stepIdx && raw.has(id);
            const prepNote = s.needsPrep.includes(id) ? ` (${ING_PREP[id].label.toLowerCase()} at the Island)` : '';
            return `<span class="ing ${have ? 'got' : ''} ${isRaw ? 'raw' : ''} ${s.needsPrep.includes(id) ? 'prep' : ''}"><img src="${ingredientURL(ING_BY_ID[id])}" alt="${ING_BY_ID[id].name}" title="${ING_BY_ID[id].name}${prepNote}"></span>`;
          }).join('')}</span>`;
          if (i === stepIdx && raw.size) icons += `<span class="rawnote">Prep at the Island: ${[...raw].map((id) => ING_PREP[id].label).join(', ')}</span>`;
        } else if (s.t === 'decor') {
          icons = `<span class="icons">${s.tops.map((t) => `<img src="${toppingURL(TOPPING_BY_ID[t])}" alt="${TOPPING_BY_ID[t].name}" title="${TOPPING_BY_ID[t].name}">`).join('')}</span>`;
        }
        const label = s.t === 'gather' ? 'Gather' : s.t === 'decor' ? 'Decorate' : s.label;
        return `<li class="${cls}"><span class="st-top"><b>${label}</b><em>${stepWhere(s)}</em></span>${icons}</li>`;
      }).join('');
      body = `<ol class="tsteps">${steps}</ol>`;
    } else {
      body = `<div class="tprog">Step ${Math.min(stepIdx + 1, tk.steps.length)} of ${tk.steps.length} · ${where}</div>`;
    }
    const q = item && item.stars < 3 ? `<span class="tq" title="Quality">${stars(item.stars)}</span>` : '';
    const tags = [tk.variant ? `<span class="vtag ${tk.variant.kind}">${tk.variant.label}</span>` : '', tk.combo ? `<span class="vtag combo">${tk.combo}</span>` : '', tk.special ? '<span class="vtag special">Special</span>' : ''].join('');
    return `<article class="ticket ${active ? 'active' : ''}" data-id="${tk.id}" id="ticket-${tk.id}">
      <header><span class="tnum">${tk.num}</span><img class="tst" src="${dessertURL(d)}" alt=""><span class="tname"><b>${d.name}</b><small>for ${tk.customer.name} · ${where}</small></span>${q}</header>
      ${tags ? `<div class="vtags">${tags}</div>` : ''}
      <div class="tbar"><i></i></div>${body}</article>`;
  }

  renderTickets(tickets, activeId) {
    const key = tickets.map((t) => `${t.id}:${t.item ? `${t.item.step}|${[...t.item.got].join(',')}|${[...t.item.raw].join(',')}|${t.item.where}|${t.item.station?.id}|${t.item.stars}` : '-'}`).join(';') + '#' + activeId;
    if (key === this.lastTicketsKey) return;
    this.lastTicketsKey = key;
    const sorted = [...tickets].sort((a, b) => a.num - b.num);
    this.ticketsEl.innerHTML = sorted.length
      ? sorted.map((t) => this.ticketHTML(t, t.id === activeId)).join('')
      : '<p class="notickets">No orders yet. Customers with a <b>!</b> are ready to order.</p>';
    this.ticketBars.clear();
    for (const t of tickets) {
      const el = this.ticketsEl.querySelector(`#ticket-${t.id} .tbar i`);
      if (el) this.ticketBars.set(t.id, el);
    }
  }

  updateTicketBars(tickets) {
    for (const t of tickets) {
      const el = this.ticketBars.get(t.id);
      if (!el) continue;
      const c = t.customer;
      const frac = Math.max(0, Math.min(1, c.patience / c.maxPatience));
      el.style.width = `${(frac * 100).toFixed(1)}%`;
      el.classList.toggle('low', frac < 0.3);
    }
  }

  // ---------------------------------------------------------------- mini-game card

  showGame({ station, title, hint, mode, tapLabel = 'Tap!', decor = null, game = null }) {
    const g = this.game;
    g.el.hidden = false;
    g.station.textContent = station;
    g.title.textContent = title;
    g.hint.textContent = hint;
    g.el.dataset.mode = mode;
    const picks = mode === 'decor' || mode === 'order';
    g.meter.hidden = picks || mode === 'hit' || mode === 'alternate';
    g.band.hidden = mode !== 'fill';
    g.timing.hidden = mode !== 'hit';
    g.pips.hidden = !['hit', 'tap', 'alternate', 'swirl', 'zigzag'].includes(mode) || !game || game.n > 12;
    g.alt.hidden = mode !== 'alternate';
    g.palette.hidden = !picks;
    g.seq.hidden = !picks;
    g.tap.hidden = picks || ['wiggle', 'roll', 'alternate', 'swirl', 'zigzag'].includes(mode);
    g.tap.textContent = tapLabel;
    g.el.classList.remove('done');
    this.pipsKey = '';
    this.setGameProgress(0);
    if (mode === 'decor') this.renderPalette(decor);
    if (mode === 'order') this.renderLayers(game);
    if (game) {
      if (mode === 'fill') {
        g.band.style.left = `${game.band[0] * 100}%`;
        g.band.style.width = `${(game.band[1] - game.band[0]) * 100}%`;
      }
      this.renderMini(game);
    }
  }

  /** Per-frame refresh of the mini-game widgets. */
  renderMini(game) {
    const g = this.game;
    this.setGameProgress(game.progress);
    if (game.mode === 'hit') {
      g.zone.style.left = `${(game.zoneC - game.zoneW / 2) * 100}%`;
      g.zone.style.width = `${game.zoneW * 100}%`;
      g.needle.style.left = `${game.needle * 100}%`;
      g.timing.classList.toggle('in', Math.abs(game.needle - game.zoneC) <= game.zoneW / 2);
    }
    if (!g.pips.hidden) {
      const done = Math.min(game.n, Math.floor(game.count + 1e-6));
      const key = `${done}/${game.n}`;
      if (key !== this.pipsKey) {
        this.pipsKey = key;
        g.pips.innerHTML = Array.from({ length: game.n }, (_, i) => `<i class="${i < done ? 'on' : ''}"></i>`).join('');
      }
    }
    if (game.mode === 'alternate') {
      g.altL.classList.toggle('next', game.expect === 'L' && !game.done);
      g.altR.classList.toggle('next', game.expect === 'R' && !game.done);
    }
    if (game.mode === 'order') this.renderLayerSeq(game);
  }

  renderLayers(game) {
    this.game.palette.innerHTML = game.choices.map((l, i) => `<button class="top layer" type="button" data-layer="${l}" id="layer-${i + 1}"><span class="lswatch" style="--c:${layerColor(l)}"></span><span>${l}</span><kbd>${i + 1}</kbd></button>`).join('');
    this.renderLayerSeq(game);
  }

  renderLayerSeq(game, wrong = null) {
    const key = `${game.count}|${wrong}`;
    if (key === this.layerKey && !wrong) return;
    this.layerKey = key;
    this.game.seq.innerHTML = 'Build it: ' + game.seq.map((l, i) => `<span class="chip ${i < game.count ? 'got' : i === game.count ? 'next' : ''}"><span class="lswatch" style="--c:${layerColor(l)}"></span>${l}</span>`).join('<span class="arrow">›</span>');
    if (wrong) {
      const b = this.game.palette.querySelector(`[data-layer="${wrong}"]`);
      if (b) {
        b.classList.remove('wrong');
        void b.offsetWidth;
        b.classList.add('wrong');
      }
    }
  }

  setGameProgress(k) {
    this.game.fill.style.width = `${Math.max(0, Math.min(1, k)) * 100}%`;
  }

  flashGame(kind) {
    const el = this.game.el;
    el.classList.remove('hit', 'miss');
    void el.offsetWidth;
    el.classList.add(kind);
  }

  gameDone(text = 'Done!') {
    this.game.el.classList.add('done');
    this.game.title.textContent = text;
    this.game.hint.textContent = '';
    this.setGameProgress(1);
  }

  hideGame() {
    this.game.el.hidden = true;
    this.game.cursor.hidden = true;
  }

  renderPalette({ tops, idx }) {
    const g = this.game;
    g.palette.innerHTML = TOPPINGS.map((t) => `<button class="top" type="button" data-top="${t.id}" id="top-${t.id}"><img src="${toppingURL(t)}" alt=""><span>${t.name}</span><kbd>${t.key}</kbd></button>`).join('');
    this.renderSeq(tops, idx);
  }

  renderSeq(tops, idx, wrong = null) {
    this.game.seq.innerHTML = 'Recipe card: ' + tops.map((t, i) => {
      const tp = TOPPING_BY_ID[t];
      return `<span class="chip ${i < idx ? 'got' : i === idx ? 'next' : ''}"><img src="${toppingURL(tp)}" alt="">${tp.name}</span>`;
    }).join('<span class="arrow">›</span>');
    if (wrong) {
      const b = this.game.palette.querySelector(`[data-top="${wrong}"]`);
      if (b) {
        b.classList.remove('wrong');
        void b.offsetWidth;
        b.classList.add('wrong');
      }
    }
  }

  vcursor(show, x, y) {
    const c = this.game.cursor;
    c.hidden = !show;
    if (show) c.style.transform = `translate(${x}px, ${y}px)`;
  }

  // ---------------------------------------------------------------- recipe book

  renderBook(state) {
    const unlocked = CATEGORIES.filter((c) => state.day >= c.day).map((c) => c.id);
    const wanted = state.tickets.map((t) => t.d.id);
    if (this.tab === 'orders' && !wanted.length) this.tab = 'pies';
    this.book.tabs.innerHTML = [
      `<button class="tab ${this.tab === 'orders' ? 'on' : ''}" data-tab="orders" id="tab-orders" type="button">Orders<span class="count">${wanted.length}</span></button>`,
      ...CATEGORIES.map((c) => `<button class="tab ${this.tab === c.id ? 'on' : ''} ${unlocked.includes(c.id) ? '' : 'locked'}" data-tab="${c.id}" id="tab-${c.id}" style="--tab:${c.color}" type="button">${c.name}</button>`),
    ].join('');
    const list = this.tab === 'orders' ? [...new Set(wanted)].map((id) => BY_ID[id]) : DESSERTS.filter((d) => d.cat === this.tab);
    this.book.grid.innerHTML = list.map((d) => {
      const cat = CATEGORIES.find((c) => c.id === d.cat);
      const locked = !unlocked.includes(d.cat);
      const steps = d.steps.map((s) => {
        let icons = '';
        if (s.t === 'gather') icons = s.items.map((id) => `<span class="ing got ${s.needsPrep.includes(id) ? 'prep' : ''}"><img src="${ingredientURL(ING_BY_ID[id])}" alt="${ING_BY_ID[id].name}" title="${ING_BY_ID[id].name}${s.needsPrep.includes(id) ? ` (${ING_PREP[id].label.toLowerCase()} at the Island)` : ''}"></span>`).join('');
        if (s.t === 'decor') icons = s.tops.map((t) => `<img src="${toppingURL(TOPPING_BY_ID[t])}" alt="${TOPPING_BY_ID[t].name}" title="${TOPPING_BY_ID[t].name}">`).join('');
        const label = s.t === 'gather' ? 'Gather' : s.t === 'decor' ? 'Decorate' : s.label;
        return `<li><b>${label}</b> <em>${stepWhere(s)}</em>${icons ? `<span class="icons">${icons}</span>` : ''}</li>`;
      }).join('');
      return `<article class="card ${locked ? 'locked' : ''}" id="card-${d.id}">
        ${wanted.includes(d.id) ? '<span class="badge">Ordered</span>' : ''}
        <img class="card-img" src="${dessertURL(d, locked)}" alt="" width="84" height="84">
        <h3 class="card-name">${d.name}</h3>
        ${locked ? `<p class="card-desc">Joins the menu on day ${cat.day}.</p>` : `<p class="card-desc">${d.desc}</p><ol class="card-steps">${steps}</ol>`}
      </article>`;
    }).join('');
  }
}
