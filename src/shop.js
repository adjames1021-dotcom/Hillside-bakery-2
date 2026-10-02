// Between days: the end-of-day summary and the morning market, where coins
// buy ingredient restocks, kitchen upgrades and cozy decor.
import { INGREDIENTS, ingredientURL } from './ingredients.js';
import { CATEGORIES, dessertURL } from './desserts.js';
import { shopIconURL } from './shopIcons.js';
import { IS_RESTAURANT, WORDS } from './venue.js';
import { R_PRICE_TIER, R_UPGRADES, R_DECOR } from './rest_data.js';

const $ = (s) => document.querySelector(s);

// price per unit: pantry staples are cheap, fancy things cost more
const B_PRICE_TIER = {
  1: ['flour', 'sugar', 'butter', 'milk', 'eggs', 'oats', 'cinnamon'],
  3: ['chocolate', 'nuts', 'caramel', 'peanut-butter', 'coconut', 'pineapple', 'pumpkin', 'sweet-potato', 'ice-cream'],
};
const PRICE_TIER = IS_RESTAURANT ? R_PRICE_TIER : B_PRICE_TIER;
export function unitPrice(id) {
  if (PRICE_TIER[1].includes(id)) return 1;
  if (PRICE_TIER[3].includes(id)) return 3;
  return 2;
}

const B_UPGRADES = [
  { id: 'oven', name: 'Speedy Oven', desc: 'Everything bakes 30% faster.', price: 180 },
  { id: 'thermo', name: 'Oven Thermometer', desc: 'Treats stay golden twice as long.', price: 140 },
  { id: 'mixer', name: 'Stand Mixer', desc: 'Mixing, whisking and kneading go 50% faster.', price: 160 },
  { id: 'knife', name: 'Sharp Knife', desc: 'Fewer chops and a bigger sweet spot at the island.', price: 120 },
  { id: 'pot', name: 'Copper Pot', desc: 'The stove cooks 30% faster and gives you longer to stir.', price: 130 },
  { id: 'freezer', name: 'Frosty Freezer', desc: 'Chilling takes 40% less time.', price: 130 },
  { id: 'cushions', name: 'Comfy Cushions', desc: 'Customers wait 25% longer.', price: 200 },
  { id: 'tipjar', name: 'Tip Jar', desc: 'Three-star treats earn a tip of 12 coins.', price: 150 },
  { id: 'shelves', name: 'Bigger Shelves', desc: 'Keep up to 14 of every ingredient.', price: 220 },
];

const B_DECOR = [
  { id: 'sunflowers', name: 'Sunflower Planters', desc: 'Big sunny pots by the door. Customers wait 5% longer.', price: 90, patience: 0.05 },
  { id: 'lanterns', name: 'Paper Lanterns', desc: 'Glowing lanterns over the café. +5% coins.', price: 120, coins: 0.05 },
  { id: 'ferns', name: 'Hanging Ferns', desc: 'Leafy baskets from the beams. Customers wait 5% longer.', price: 100, patience: 0.05 },
  { id: 'chalkboard', name: 'Specials Board', desc: "An easel showing today's special. Specials earn double instead of +50%.", price: 140 },
  { id: 'catbed', name: 'Shop Cat', desc: 'A sleepy tabby naps in a basket. Everyone loves it: +8% coins.', price: 250, coins: 0.08 },
];

export const UPGRADES = IS_RESTAURANT ? R_UPGRADES : B_UPGRADES;
export const DECOR = IS_RESTAURANT ? R_DECOR : B_DECOR;

export const baseCap = (S) => (S.upgrades.includes('shelves') ? 14 : 8);

export function freshStock() {
  return Object.fromEntries(INGREDIENTS.map((g) => [g.id, 8]));
}

/** Coins to fill one ingredient (or all of them) back up to the shelf cap. */
export function fillCost(S, id) {
  const cap = baseCap(S);
  if (id) return Math.max(0, cap - (S.stock[id] ?? 0)) * unitPrice(id);
  return INGREDIENTS.reduce((sum, g) => sum + fillCost(S, g.id), 0);
}

export class Shop {
  constructor({ onChange, onOpen, onShop }) {
    this.summary = $('#summary');
    this.market = $('#market');
    this.tabsEl = $('#marketTabs');
    this.grid = $('#marketGrid');
    this.coinsEl = $('#marketCoins');
    this.tab = 'pantry';
    this.onChange = onChange;
    this.tabsEl.addEventListener('click', (e) => {
      const b = e.target.closest('.tab');
      if (!b) return;
      this.tab = b.dataset.tab;
      this.render();
    });
    this.grid.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-buy]');
      if (!b || b.disabled) return;
      this.buy(b.dataset.buy, b.dataset.id);
    });
    $('#fillAll').addEventListener('click', () => this.buy('fill-all'));
    $('#openDay').addEventListener('click', () => onOpen());
    $('#toMarket').addEventListener('click', () => onShop());
  }

  bind(S) { this.S = S; }

  buy(kind, id) {
    const S = this.S;
    let cost = 0;
    if (kind === 'fill') cost = fillCost(S, id);
    else if (kind === 'fill-all') {
      // fill as much as the purse allows, cheapest-first so staples never run dry
      const cap = baseCap(S);
      const order = [...INGREDIENTS].sort((a, b) => unitPrice(a.id) - unitPrice(b.id));
      let bought = 0;
      for (const g of order) {
        while ((S.stock[g.id] ?? 0) < cap && S.coins >= unitPrice(g.id)) {
          S.stock[g.id] = (S.stock[g.id] ?? 0) + 1;
          S.coins -= unitPrice(g.id);
          bought++;
        }
      }
      this.onChange(bought ? 'buy' : 'nope');
      return this.render();
    } else if (kind === 'upgrade') cost = UPGRADES.find((u) => u.id === id).price;
    else if (kind === 'decor') cost = DECOR.find((u) => u.id === id).price;
    if (!cost || cost > S.coins) {
      this.onChange('nope');
      return;
    }
    S.coins -= cost;
    if (kind === 'fill') S.stock[id] = baseCap(S);
    if (kind === 'upgrade') S.upgrades.push(id);
    if (kind === 'decor') S.decor.push(id);
    this.onChange(kind === 'decor' ? 'decor' : 'buy', id);
    this.render();
  }

  showSummary(day) {
    const S = this.S;
    const r = day.report;
    const avg = r.served ? (r.stars / r.served).toFixed(1) : '–';
    const next = CATEGORIES.find((c) => c.day === S.day + 1);
    $('#sumDay').textContent = `Day ${S.day} done!`;
    $('#sumLede').textContent = r.served
      ? pickLine(r)
      : IS_RESTAURANT ? 'A quiet evening on the cliff. Tomorrow will be busier!' : 'A quiet day in the hills. Tomorrow will be busier!';
    $('#sumStats').innerHTML = [
      [WORDS.treats, r.served],
      ['Coins earned', r.coins],
      ['Tips', r.tips],
      ['Average stars', avg],
      ['Went home hungry', r.left],
    ].map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join('');
    const best = r.best ? `<p class="sum-best"><img src="${dessertURL(r.best)}" alt="">Crowd favourite: <b>${r.best.name}</b></p>` : '';
    $('#sumExtra').innerHTML = best + (next ? `<p class="sum-next">Tomorrow <b>${next.name}</b> join${IS_RESTAURANT ? '' : 's'} the menu!</p>` : '');
    this.summary.hidden = false;
  }

  hideSummary() { this.summary.hidden = true; }

  showMarket() {
    this.summary.hidden = true;
    this.market.hidden = false;
    $('#marketDay').textContent = `Morning Market · Day ${this.S.day}`;
    $('#openDay').textContent = `Open the ${WORDS.shop} for Day ${this.S.day}`;
    this.render();
  }

  hideMarket() { this.market.hidden = true; }

  render() {
    const S = this.S;
    this.coinsEl.textContent = S.coins;
    const cap = baseCap(S);
    const low = INGREDIENTS.filter((g) => (S.stock[g.id] ?? 0) < cap).length;
    this.tabsEl.innerHTML = [
      ['pantry', 'Pantry', low],
      ['upgrades', 'Upgrades', UPGRADES.filter((u) => !S.upgrades.includes(u.id)).length],
      ['decor', 'Decor', DECOR.filter((u) => !S.decor.includes(u.id)).length],
    ].map(([id, name, n]) => `<button class="tab ${this.tab === id ? 'on' : ''}" data-tab="${id}" id="mtab-${id}" type="button">${name}${n ? `<span class="count">${n}</span>` : ''}</button>`).join('');
    const all = fillCost(S);
    const fillBtn = $('#fillAll');
    fillBtn.hidden = this.tab !== 'pantry';
    fillBtn.textContent = all ? `Restock everything · ${all} coins` : 'Pantry is full';
    fillBtn.disabled = !all || S.coins < 1;
    if (this.tab === 'pantry') {
      this.grid.className = 'grid market pantry';
      this.grid.innerHTML = INGREDIENTS.map((g) => {
        const have = S.stock[g.id] ?? 0;
        const cost = fillCost(S, g.id);
        return `<article class="mcard ${have === 0 ? 'out' : have <= 2 ? 'low' : ''}">
          <img src="${ingredientURL(g)}" alt="">
          <h3>${g.name}</h3>
          <div class="stockbar" title="${have} of ${cap}"><i style="width:${(have / cap) * 100}%"></i></div>
          <small>${have} / ${cap} · ${unitPrice(g.id)} each</small>
          <button class="btn small" type="button" data-buy="fill" data-id="${g.id}" ${!cost || cost > S.coins ? 'disabled' : ''}>${cost ? `Fill · ${cost}` : 'Full'}</button>
        </article>`;
      }).join('');
    } else {
      const list = this.tab === 'upgrades' ? UPGRADES : DECOR;
      const owned = this.tab === 'upgrades' ? S.upgrades : S.decor;
      this.grid.className = 'grid market goods';
      this.grid.innerHTML = list.map((u) => {
        const has = owned.includes(u.id);
        return `<article class="mcard big ${has ? 'owned' : ''}">
          <img class="mico" src="${shopIconURL(u.id)}" alt="">
          <h3>${u.name}</h3>
          <p>${u.desc}</p>
          <button class="btn ${has ? '' : 'primary'} small" type="button" data-buy="${this.tab === 'upgrades' ? 'upgrade' : 'decor'}" data-id="${u.id}" ${has || u.price > S.coins ? 'disabled' : ''}>${has ? 'Owned' : `Buy · ${u.price}`}</button>
        </article>`;
      }).join('');
    }
  }
}

function pickLine(r) {
  const avg = r.stars / r.served;
  if (IS_RESTAURANT) {
    if (r.left === 0 && avg >= 2.8) return 'Every table left glowing. The critics will be writing about Lantern Cliff!';
    if (avg >= 2.5) return 'A lovely service. The dining room hummed all evening.';
    return 'A busy service! A few plates came out rough, but the sunset made up for it.';
  }
  if (r.left === 0 && avg >= 2.8) return 'Every customer went home happy. The whole hillside is talking about you!';
  if (avg >= 2.5) return 'What a lovely day of baking. Your regulars are smiling.';
  return 'A busy day! A few treats came out toasty, but everyone had fun.';
}

