// Station close-up mini-games. Each one is a tiny state machine fed with
// taps, holds and mouse/finger motion; main.js turns its events into sounds,
// sparkles and stars. Modes:
//   tap       chop, press, knead: one tap per stroke
//   hold      squeeze, pour: hold the button
//   roll      roll the pin: move the mouse up and down
//   wiggle    beat: wiggle the mouse any way
//   hit       timing: tap while the slider is in the sweet spot (crimp, cut, scoop)
//   fill      pour to the line: hold, then let go inside the band
//   swirl     circles: pipe swirls, whisk, peel round and round
//   zigzag    side to side: fold, scatter, drizzle
//   alternate left, right, left: weave a lattice, fork crisscross
//   order     press the layers in the right order

export const MODE_HINT = {
  tap: 'Click, tap or press Space for each one.',
  hold: 'Hold the mouse button or Space.',
  roll: 'Move the mouse up and down to roll.',
  wiggle: 'Wiggle the mouse (or drag) to work it.',
  hit: 'Tap when the slider is inside the green zone.',
  fill: 'Hold to pour, and let go inside the line.',
  swirl: 'Move the mouse (or drag) in smooth circles.',
  zigzag: 'Sweep the mouse (or drag) left and right.',
  alternate: 'Alternate left and right: A / D, arrow keys, flick the mouse or tap the buttons.',
  order: 'Add the layers in order. Click them or press their number.',
  decor: 'Add the toppings in recipe-card order. Keys 1–9, 0, - and = work too.',
};

export const TAP_LABEL = { tap: 'Chop!', hold: 'Hold to pour', hit: 'Now!', fill: 'Hold to pour', swirl: 'Swirl', zigzag: 'Sweep' };

const TAU = Math.PI * 2;
const shuffle = (a) => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

/**
 * @param {string} mode
 * @param {object} step    recipe step ({ n, seq, label })
 * @param {object} opts    { speed: progress multiplier, zone: hit zone width, tapLabel }
 */
export function createGame(mode, step, opts = {}) {
  const speed = opts.speed || 1;
  const n = Math.max(1, Math.round((step.n || 6) * (opts.countScale || 1)));
  const g = {
    mode, n, progress: 0, count: 0, mistakes: 0, penalty: 0, done: false,
    // hit
    needle: 0, dir: 1, zoneC: 0.5, zoneW: opts.zone || 0.2, rate: 0.95,
    // fill
    level: 0, band: [0.7, 0.88], held: false, poured: false,
    // swirl
    angle: 0, lastDir: null,
    // zigzag / alternate
    travel: 0, sweepSign: 0,
    expect: 'L',
    // order
    seq: step.seq || [], choices: step.seq ? shuffle([...new Set(step.seq)]) : [],
  };
  if (mode === 'hit') g.zoneC = 0.3 + Math.random() * 0.4;

  const events = [];
  const ev = (type, extra = {}) => events.push({ type, ...extra });
  const mistake = (limit, msg) => {
    g.mistakes += 1;
    ev('miss', { msg });
    if (g.mistakes >= limit && !g.penalty) {
      g.penalty = 1;
      ev('penalty');
    }
  };
  const finish = () => {
    if (g.done) return;
    g.done = true;
    g.progress = 1;
    ev('done');
  };
  const stroke = (k = 1) => {
    g.count += k;
    g.progress = Math.min(1, g.count / n);
    ev('stroke');
    if (g.count >= n - 1e-6) finish();
  };

  g.tap = () => {
    if (g.done) return events.splice(0);
    switch (mode) {
      case 'tap': stroke(1); break;
      case 'roll': case 'wiggle': g.progress = Math.min(1, g.progress + 0.05 * speed); ev('stroke'); if (g.progress >= 0.999) finish(); break;
      case 'swirl': g.angle += TAU * 0.12; ev('stroke'); break;
      case 'zigzag': stroke(0.5); break;
      case 'hit': {
        const off = Math.abs(g.needle - g.zoneC);
        if (off <= g.zoneW / 2) {
          ev('hit', { perfect: off < g.zoneW * 0.18 });
          g.zoneC = 0.15 + Math.random() * 0.7;
          g.rate = Math.min(1.5, g.rate + 0.06);
          stroke(1);
        } else mistake(3, 'Missed! Wait for the green zone.');
        break;
      }
      default: break;
    }
    return events.splice(0);
  };

  const doAlt = (side) => {
    if (g.done || mode !== 'alternate') return;
    if (side === g.expect) {
      g.expect = side === 'L' ? 'R' : 'L';
      stroke(1);
    } else mistake(3, side === 'L' ? 'Other side! Go right.' : 'Other side! Go left.');
  };
  g.alt = (side) => { doAlt(side); return events.splice(0); };

  g.pick = (label) => {
    if (g.done || mode !== 'order') return events.splice(0);
    if (label === g.seq[g.count]) stroke(1);
    else mistake(2, `Not yet! Next is the ${g.seq[g.count]}.`);
    return events.splice(0);
  };

  /** held: primary button or Space is down. mv: { dx, dy, amt } mouse motion this frame. */
  g.update = (dt, mv, held) => {
    if (g.done) return events.splice(0);
    const m = mv || { dx: 0, dy: 0, amt: 0 };
    switch (mode) {
      case 'hold':
        if (held) { g.progress = Math.min(1, g.progress + (dt / 1.7) * speed); ev('work'); }
        if (g.progress >= 0.999) finish();
        break;
      case 'roll':
        g.progress = Math.min(1, g.progress + (Math.abs(m.dy) * 0.0021 + Math.abs(m.dx) * 0.0004) * speed);
        if (m.amt > 4) ev('work');
        if (g.progress >= 0.999) finish();
        break;
      case 'wiggle':
        g.progress = Math.min(1, g.progress + m.amt * 0.0012 * speed);
        if (m.amt > 4) ev('work');
        if (g.progress >= 0.999) finish();
        break;
      case 'hit': {
        g.needle += g.dir * dt * g.rate;
        if (g.needle > 1) { g.needle = 2 - g.needle; g.dir = -1; }
        if (g.needle < 0) { g.needle = -g.needle; g.dir = 1; }
        break;
      }
      case 'fill': {
        if (held) {
          g.held = true;
          g.level = Math.min(1.05, g.level + (dt / 2.4) * (0.6 + g.level * 0.7));
          ev('work');
          if (g.level >= 1) {
            ev('spill');
            if (!g.penalty) { g.penalty = 1; ev('penalty'); }
            finish();
          }
        } else if (g.held) {
          g.held = false;
          if (g.level >= g.band[0]) {
            if (g.level > g.band[1]) {
              ev('miss', { msg: 'A little too full!' });
              if (!g.penalty) { g.penalty = 1; ev('penalty'); }
            } else ev('hit', { perfect: true });
            finish();
          } else ev('miss', { msg: 'Not full yet! Keep pouring.' });
        }
        g.progress = Math.min(1, g.level);
        break;
      }
      case 'swirl': {
        const len = Math.hypot(m.dx, m.dy);
        if (len > 1.5) {
          const d = [m.dx / len, m.dy / len];
          if (g.lastDir) {
            const cross = g.lastDir[0] * d[1] - g.lastDir[1] * d[0];
            const dot = g.lastDir[0] * d[0] + g.lastDir[1] * d[1];
            const a = Math.atan2(cross, dot);
            // big jumps are direction reversals, not circles
            if (Math.abs(a) < 1.6) g.angle += a * speed;
          }
          g.lastDir = d;
          ev('work');
        }
        const k = Math.abs(g.angle) / (TAU * n);
        g.count = Math.floor(Math.abs(g.angle) / TAU);
        g.progress = Math.min(1, k);
        if (k >= 1) finish();
        break;
      }
      case 'zigzag': {
        if (Math.abs(m.dx) > 0.5) {
          const s = Math.sign(m.dx);
          if (s !== g.sweepSign) {
            if (g.travel > 70) stroke(1);
            g.sweepSign = s;
            g.travel = 0;
          }
          g.travel += Math.abs(m.dx) * speed;
          ev('work');
        }
        break;
      }
      case 'alternate': {
        // a sideways flick of the mouse works like a key press
        if (Math.abs(m.dx) > 0.5) {
          const s = Math.sign(m.dx);
          if (s !== g.sweepSign) { g.sweepSign = s; g.travel = 0; }
          g.travel += Math.abs(m.dx);
          const side = s < 0 ? 'L' : 'R';
          if (g.travel > 60 && side === g.expect) {
            g.travel = -1e9; // one stroke per flick
            doAlt(side);
          }
        }
        break;
      }
      default: break;
    }
    return events.splice(0);
  };

  return g;
}
