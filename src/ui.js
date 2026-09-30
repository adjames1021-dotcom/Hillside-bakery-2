// DOM side of the HUD: order tickets, interaction prompt, world-anchored speech
// bubbles, the mini-game card, the recipe book and small overlays.
import * as THREE from 'three';
import { DESSERTS, BY_ID, CATEGORIES, STATIONS, TOPPINGS, TOPPING_BY_ID, dessertURL, toppingURL } from './desserts.js';
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
    };
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
    if (this.carryEl.innerHTML !== html) this.carryEl.innerHTML = html;
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
    const where = !item ? 'not started' : item.where === 'hands' ? 'in your paws' : item.station && item.station.type === 'spot' ? 'resting on the island' : `at the ${item.station.name}`;
    let body;
    if (active) {
      const steps = d.steps.map((s, i) => {
        const cls = i < stepIdx ? 'done' : i === stepIdx ? 'now' : '';
        let icons = '';
        if (s.t === 'gather') {
          icons = `<span class="icons">${s.items.map((id) => {
            const have = i < stepIdx || (i === stepIdx && got.has(id));
            return `<img class="${have ? 'got' : ''}" src="${ingredientURL(ING_BY_ID[id])}" alt="${ING_BY_ID[id].name}" title="${ING_BY_ID[id].name}">`;
          }).join('')}</span>`;
        } else if (s.t === 'decor') {
          icons = `<span class="icons">${s.tops.map((t) => `<img src="${toppingURL(TOPPING_BY_ID[t])}" alt="${TOPPING_BY_ID[t].name}" title="${TOPPING_BY_ID[t].name}">`).join('')}</span>`;
        }
        const label = s.t === 'gather' ? 'Gather' : s.t === 'decor' ? 'Decorate' : s.label;
        return `<li class="${cls}"><span class="st-top"><b>${label}</b><em>${stepWhere(s)}</em></span>${icons}</li>`;
      }).join('');
      body = `<ol class="tsteps">${steps}</ol>`;
    } else {
      body = `<div class="tprog">Step ${Math.min(stepIdx + 1, d.steps.length)} of ${d.steps.length} · ${where}</div>`;
    }
    const q = item && item.stars < 3 ? `<span class="tq" title="Quality">${stars(item.stars)}</span>` : '';
    return `<article class="ticket ${active ? 'active' : ''}" data-id="${tk.id}" id="ticket-${tk.id}">
      <header><span class="tnum">${tk.num}</span><img class="tst" src="${dessertURL(d)}" alt=""><span class="tname"><b>${d.name}</b><small>for ${tk.customer.name} · ${where}</small></span>${q}</header>
      <div class="tbar"><i></i></div>${body}</article>`;
  }

  renderTickets(tickets, activeId) {
    const key = tickets.map((t) => `${t.id}:${t.item ? `${t.item.step}|${[...t.item.got].join(',')}|${t.item.where}|${t.item.station?.id}|${t.item.stars}` : '-'}`).join(';') + '#' + activeId;
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

  showGame({ station, title, hint, mode, tapLabel = 'Tap!', decor = null }) {
    const g = this.game;
    g.el.hidden = false;
    g.station.textContent = station;
    g.title.textContent = title;
    g.hint.textContent = hint;
    g.el.dataset.mode = mode;
    g.meter.hidden = mode === 'decor';
    g.palette.hidden = mode !== 'decor';
    g.seq.hidden = mode !== 'decor';
    g.tap.hidden = mode === 'decor' || mode === 'wiggle' || mode === 'roll';
    g.tap.textContent = tapLabel;
    g.el.classList.remove('done');
    this.setGameProgress(0);
    if (mode === 'decor') this.renderPalette(decor);
  }

  setGameProgress(k) {
    this.game.fill.style.width = `${Math.max(0, Math.min(1, k)) * 100}%`;
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
    const unlocked = CATEGORIES.filter((c) => state.served >= c.unlock).map((c) => c.id);
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
      const need = cat.unlock - state.served;
      const steps = d.steps.map((s) => {
        let icons = '';
        if (s.t === 'gather') icons = s.items.map((id) => `<img src="${ingredientURL(ING_BY_ID[id])}" alt="${ING_BY_ID[id].name}" title="${ING_BY_ID[id].name}">`).join('');
        if (s.t === 'decor') icons = s.tops.map((t) => `<img src="${toppingURL(TOPPING_BY_ID[t])}" alt="${TOPPING_BY_ID[t].name}" title="${TOPPING_BY_ID[t].name}">`).join('');
        const label = s.t === 'gather' ? 'Gather' : s.t === 'decor' ? 'Decorate' : s.label;
        return `<li><b>${label}</b> <em>${stepWhere(s)}</em>${icons ? `<span class="icons">${icons}</span>` : ''}</li>`;
      }).join('');
      return `<article class="card ${locked ? 'locked' : ''}" id="card-${d.id}">
        ${wanted.includes(d.id) ? '<span class="badge">Ordered</span>' : ''}
        <img class="card-img" src="${dessertURL(d, locked)}" alt="" width="84" height="84">
        <h3 class="card-name">${d.name}</h3>
        ${locked ? `<p class="card-desc">Serve ${need} more treat${need === 1 ? '' : 's'} to unlock.</p>` : `<p class="card-desc">${d.desc}</p><ol class="card-steps">${steps}</ol>`}
      </article>`;
    }).join('');
  }
}
