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
  swirl: 'Move the mouse (or drag) in circles, any size, either way.',
  zigzag: 'Sweep the mouse (or drag) left and right, or tap A and D.',
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
    needle: 0, dir: 1, zoneC: 0.5, zoneW: opts.zone || 0.22, rate: 0.9,
    // fill
    level: 0, band: [0.68, 0.9], held: false, poured: false,
    // swirl: a virtual pointer circling a center that lags behind it
    angle: 0, turned: 0, net: 0, spin: 0, px: 0, py: 0, cx: 0, cy: 0, lastA: null,
    // zigzag / alternate
    travel: 0, rev: 0, sweepSign: 0, counted: false, keySide: 0, sweepPos: 0,
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
      case 'swirl': g.angle += TAU * 0.12; g.turned += TAU * 0.12 * speed; g.net = g.turned; ev('stroke'); break;
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

  // zigzag by keyboard: A then D then A... each change of side is one sweep
  g.key = (side) => {
    if (g.done || mode !== 'zigzag') return events.splice(0);
    const s = side === 'L' ? -1 : 1;
    g.sweepPos = s;
    if (s !== g.keySide) {
      g.keySide = s;
      stroke(1);
    }
    return events.splice(0);
  };

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
        // Track the pointer's angle around a center that trails behind it, so
        // circles of any size, speed or direction count and jitter doesn't.
        g.px += m.dx;
        g.py += m.dy;
        const lag = 1 - Math.exp(-Math.max(dt, 1e-3) / 0.22);
        g.cx += (g.px - g.cx) * lag;
        g.cy += (g.py - g.cy) * lag;
        const rx = g.px - g.cx, ry = g.py - g.cy;
        if (Math.hypot(rx, ry) > 9) {
          const a = Math.atan2(ry, rx);
          let d = g.lastA === null ? 0 : a - g.lastA;
          while (d > Math.PI) d -= TAU;
          while (d < -Math.PI) d += TAU;
          if (g.lastA === null) {
            // pick up where the tool is, without a jump
            let j = a - g.angle;
            while (j > Math.PI) j -= TAU;
            while (j < -Math.PI) j += TAU;
            g.angle += j;
          } else if (Math.abs(d) < 1.3) {
            // a sudden half-turn is a back-and-forth, not a circle
            g.angle += d;
            // count turning one way; aimless wiggles cancel out, and going back
            // half a turn switches direction without losing what you've done
            if (!g.spin) g.spin = Math.sign(d) || 1;
            // (a little extra makes up for the moment the center takes to settle)
            g.net += d * g.spin * speed * 1.15;
            if (g.net > g.turned) g.turned = g.net;
            else if (g.net < g.turned - Math.PI) { g.spin = -g.spin; g.net = g.turned; }
          }
          g.lastA = a;
          if (Math.hypot(m.dx, m.dy) > 1) ev('work');
        } else g.lastA = null;
        const k = g.turned / (TAU * n);
        g.count = Math.floor(g.turned / TAU);
        g.progress = Math.min(1, k);
        if (k >= 1) finish();
        break;
      }
      case 'zigzag': {
        // a sweep counts once it has gone far enough; a short wobble back doesn't end it
        const dx = m.dx * speed;
        if (Math.abs(dx) > 0.2) {
          const s = Math.sign(dx);
          if (!g.sweepSign) g.sweepSign = s;
          if (s === g.sweepSign) {
            g.travel += Math.abs(dx);
            g.rev = 0;
            if (!g.counted && g.travel > 42) { g.counted = true; stroke(1); }
          } else {
            g.rev += Math.abs(dx);
            if (g.rev > 8) {
              g.sweepSign = s;
              g.travel = g.rev;
              g.rev = 0;
              g.counted = false;
            }
          }
          if (Math.abs(m.dx) > 0.5) ev('work');
        }
        g.sweepPos = Math.max(-1, Math.min(1, g.sweepPos + m.dx / 110));
        break;
      }
      case 'alternate': {
        // a sideways flick of the mouse works like a key press
        if (Math.abs(m.dx) > 0.5) {
          const s = Math.sign(m.dx);
          if (s !== g.sweepSign) { g.sweepSign = s; g.travel = 0; }
          g.travel += Math.abs(m.dx);
          const side = s < 0 ? 'L' : 'R';
          if (g.travel > 40 && side === g.expect) {
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
