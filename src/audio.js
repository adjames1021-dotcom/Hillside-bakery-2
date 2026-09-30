// Tiny synthesized sound effects. Audio starts only after the first click/key.
let ctx = null;
let muted = false;

try {
  muted = localStorage.getItem('hillside-muted') === '1';
} catch { /* storage may be blocked */ }

export function unlockAudio() {
  if (ctx) return;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    ctx = null;
  }
}

export function isMuted() { return muted; }
export function setMuted(m) {
  muted = m;
  try { localStorage.setItem('hillside-muted', m ? '1' : '0'); } catch { /* ignore */ }
}

function tone(freq, dur, { type = 'sine', vol = 0.15, delay = 0, slide = 0 } = {}) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

export const sfx = {
  pop: () => tone(520, 0.12, { slide: 1.8, vol: 0.12 }),
  place: () => { tone(330, 0.1, { type: 'triangle', vol: 0.12 }); tone(440, 0.12, { type: 'triangle', delay: 0.05, vol: 0.1 }); },
  ding: () => { tone(1046, 0.5, { type: 'triangle', vol: 0.12 }); tone(1318, 0.6, { type: 'triangle', delay: 0.12, vol: 0.1 }); },
  coin: () => { tone(988, 0.08, { type: 'square', vol: 0.05 }); tone(1318, 0.25, { type: 'square', delay: 0.08, vol: 0.05 }); },
  bell: () => { tone(784, 0.4, { type: 'sine', vol: 0.12 }); tone(1175, 0.5, { type: 'sine', delay: 0.02, vol: 0.06 }); },
  nope: () => tone(220, 0.18, { type: 'triangle', slide: 0.7, vol: 0.12 }),
  whoosh: () => tone(300, 0.2, { type: 'sine', slide: 0.4, vol: 0.1 }),
  unlock: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.3, { type: 'triangle', delay: i * 0.09, vol: 0.1 })),
  sad: () => { tone(392, 0.25, { type: 'triangle', vol: 0.08 }); tone(330, 0.35, { type: 'triangle', delay: 0.18, vol: 0.08 }); },
  chop: () => { tone(180, 0.06, { type: 'square', vol: 0.05, slide: 0.6 }); tone(900, 0.03, { type: 'triangle', vol: 0.04 }); },
  whisk: () => tone(620 + Math.random() * 160, 0.05, { type: 'sine', vol: 0.03, slide: 1.3 }),
  stir: () => { tone(260, 0.18, { type: 'sine', vol: 0.08, slide: 1.4 }); tone(390, 0.18, { type: 'sine', delay: 0.08, vol: 0.06 }); },
  alarm: () => { tone(880, 0.12, { type: 'triangle', vol: 0.09 }); tone(880, 0.12, { type: 'triangle', delay: 0.18, vol: 0.09 }); },
  step: () => tone(150 + Math.random() * 40, 0.05, { type: 'sine', vol: 0.025 }),
  star: (n = 3) => [659, 784, 988].slice(0, n).forEach((f, i) => tone(f, 0.22, { type: 'triangle', delay: i * 0.1, vol: 0.09 })),
  door: () => tone(240, 0.16, { type: 'triangle', vol: 0.06, slide: 1.5 }),
  frost: () => { tone(1500, 0.2, { type: 'sine', vol: 0.03, slide: 1.2 }); tone(1900, 0.2, { type: 'sine', delay: 0.06, vol: 0.02 }); },
};
