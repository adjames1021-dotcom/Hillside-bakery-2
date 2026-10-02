// Which place you're running: the Hillside Bakery or the Lantern Cliff
// restaurant. Picked on the title screen; switching reloads the page so each
// venue gets its own world, menu, upgrades and save.

const KEY = 'hillside-venue';
const VENUES = ['bakery', 'restaurant'];

function detect() {
  const hash = (typeof location !== 'undefined' && location.hash || '').replace('#', '');
  if (VENUES.includes(hash)) return hash;
  try {
    const v = localStorage.getItem(KEY);
    if (VENUES.includes(v)) return v;
  } catch { /* storage blocked: fall back to the bakery */ }
  return 'bakery';
}

export const VENUE = detect();
export const IS_RESTAURANT = VENUE === 'restaurant';

export function switchVenue(v) {
  if (!VENUES.includes(v) || v === VENUE) return;
  try { localStorage.setItem(KEY, v); } catch { /* the hash still carries it */ }
  location.hash = v;
  location.reload();
}

/** Words and places that differ between the two venues. */
export const WORDS = IS_RESTAURANT
  ? {
    place: 'Lantern Cliff',
    shop: 'restaurant',
    treat: 'dish',
    treats: 'Dishes served',
    dry: 'the Pantry',
    cold: 'the Cold Room',
    storage: 'Pantry + Cold Room',
    saveKey: 'hillside-restaurant-save',
  }
  : {
    place: 'Hillside Bakery',
    shop: 'shop',
    treat: 'treat',
    treats: 'Treats served',
    dry: 'Dry Storage',
    cold: 'Cold Storage',
    storage: 'Dry + Cold Storage',
    saveKey: 'hillside-bakery-save',
  };
