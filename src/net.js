// Co-op networking and the lobby. Two chefs meet in a room on the Cloudflare
// Worker (server/worker.js): the host picks the kitchen and the difficulty,
// then both start the day together. The host's browser runs the kitchen and
// the guest's mirrors it; this module only moves messages and runs the lobby.
import { VENUE, MAPS } from './venue.js';

const $ = (s) => document.querySelector(s);
const STORE = 'hillside-coop';
// After `npx wrangler deploy`, put your Worker's address here so a copy of the
// game hosted somewhere else (GitHub Pages, a claude.ai artifact) can find it.
const DEFAULT_SERVER = '';

/** How hard the rush gets. 3 is the solo game's pace before the co-op rush. */
export const DIFFICULTY = {
  1: { name: 'Cozy', patience: 1.5, spawn: 1.35, extra: -1, rush: 0.3, coins: 0.8, penalty: 0, desc: 'Plenty of time for every order. A gentle rush late in the day, and nobody minds a wait.' },
  2: { name: 'Easy', patience: 1.25, spawn: 1.15, extra: 0, rush: 0.45, coins: 0.9, penalty: 4, desc: 'Relaxed guests and a mild rush hour. Good for learning the kitchen together.' },
  3: { name: 'Normal', patience: 1, spawn: 1, extra: 0, rush: 0.6, coins: 1, penalty: 8, desc: 'Steady mornings, a real lunch rush and a busy evening. Split the jobs and talk!' },
  4: { name: 'Busy', patience: 0.85, spawn: 0.85, extra: 1, rush: 0.75, coins: 1.2, penalty: 14, desc: 'Guests are hungrier and less patient, and the rush builds fast. Coins pay 20% more.' },
  5: { name: 'Frantic', patience: 0.7, spawn: 0.7, extra: 2, rush: 0.9, coins: 1.4, penalty: 22, desc: 'Every seat full by the afternoon and short tempers. Pure kitchen chaos, 40% more coins.' },
};

function loadStore() {
  try { return JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch { return {}; }
}
function saveStore(o) {
  try { localStorage.setItem(STORE, JSON.stringify({ ...loadStore(), ...o })); } catch { /* private window */ }
}
const randomId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const roomCode = () => Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');

function hashParams() {
  const parts = (location.hash || '').replace('#', '').split('&').slice(1);
  return Object.fromEntries(parts.map((p) => p.split('=').map(decodeURIComponent)));
}

const listeners = {};
export const net = {
  ws: null,
  cid: '',
  name: '',
  room: '',
  server: '',
  lobby: null,
  role: null, // 'host' | 'guest' once in a room
  playing: false, // a co-op day has started
  partnerHere: false,
  on(type, fn) { (listeners[type] ||= []).push(fn); },
  emit(type, ...a) { for (const fn of listeners[type] || []) fn(...a); },
  send(msg) {
    if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(msg));
  },
  get partnerName() {
    const p = this.lobby && this.lobby.players.find((x) => x.cid !== this.cid);
    return p ? p.name : this.role === 'host' ? 'Guest' : 'Host';
  },
  get difficulty() { return (this.lobby && this.lobby.difficulty) || 3; },
};

/** Where the rooms live: a saved address, this page's own Worker, or the built-in default. */
async function resolveServer(typed) {
  const clean = (u) => u.trim().replace(/\/+$/, '');
  if (typed && clean(typed)) return clean(typed);
  if (/^https?:/.test(location.protocol)) {
    try {
      const r = await fetch(new URL('health', location.href), { cache: 'no-store' });
      const j = r.ok && (await r.json());
      if (j && j.ok) return location.origin + location.pathname.replace(/\/[^/]*$/, '');
    } catch { /* not served by the Worker */ }
  }
  return DEFAULT_SERVER;
}

let retry = 0;
let leaving = false;

function connect() {
  const base = net.server.replace(/^http/, 'ws');
  const url = `${base}/room/${net.room}?cid=${encodeURIComponent(net.cid)}&name=${encodeURIComponent(net.name)}&map=${VENUE}`;
  let ws;
  try { ws = new WebSocket(url); } catch (e) {
    status(`Could not reach the co-op server (${e.message}).`, true);
    return;
  }
  net.ws = ws;
  status('Connecting…');
  ws.onopen = () => { retry = 0; status(''); };
  ws.onmessage = (e) => {
    let m;
    try { m = JSON.parse(e.data); } catch { return; }
    if (m.t === 'lobby') return onLobby(m);
    if (m.t === 'error') { leaving = true; status(m.msg, true); return; }
    if (m.t === 'peerLeft') {
      net.partnerHere = false;
      return net.emit('peerLeft');
    }
    if (m.t === 'chat') return addChat(m.name || net.partnerName, m.text, false);
    net.emit('msg', m);
  };
  ws.onclose = (e) => {
    if (net.ws !== ws) return;
    net.ws = null;
    if (leaving || e.code === 4000 || e.code === 4001) return;
    // try again a few times: a phone switching networks, a sleepy laptop
    if (retry < 6) {
      retry++;
      status(`Connection lost. Reconnecting (${retry})…`, true);
      setTimeout(connect, 600 * retry);
    } else {
      status('Lost the connection to the room.', true);
      net.emit('closed');
    }
  };
}

function onLobby(l) {
  const before = net.lobby;
  net.lobby = l;
  net.role = l.host === net.cid ? 'host' : 'guest';
  const hadPartner = net.partnerHere;
  net.partnerHere = l.players.length > 1;
  // everyone plays in the kitchen the host picked: switch (reload) if needed
  if (l.map !== VENUE && MAPS.includes(l.map)) {
    status(`Heading to ${l.map === 'restaurant' ? 'Lantern Cliff' : 'Hillside Bakery'}…`);
    leaving = true;
    try { localStorage.setItem('hillside-venue', l.map); } catch { /* the hash carries it */ }
    location.hash = `${l.map}&room=${net.room}${net.serverParam()}`;
    location.reload();
    return;
  }
  renderRoom();
  if (net.partnerHere && !hadPartner) net.emit('peerJoined');
  if (l.started && !net.playing) {
    net.playing = true;
    net.emit('start', { role: net.role, difficulty: l.difficulty });
  }
  net.emit('lobby', l, before);
}

net.serverParam = () => {
  const own = location.origin + location.pathname.replace(/\/[^/]*$/, '');
  return net.server && net.server !== own ? `&server=${encodeURIComponent(net.server)}` : '';
};

// ------------------------------------------------------------------ lobby UI

let els = null;
function status(text, bad = false) {
  if (!els) return;
  els.status.textContent = text;
  els.status.classList.toggle('bad', bad);
}

function renderRoom() {
  const l = net.lobby;
  if (!l || !els) return;
  els.join.hidden = true;
  els.roomBox.hidden = false;
  els.code.textContent = net.room;
  const host = net.role === 'host';
  const players = [...l.players].sort((a, b) => (b.host ? 1 : 0) - (a.host ? 1 : 0));
  els.chefs.innerHTML = players.map((p) => `<li class="${p.host ? 'host' : 'guest'}"><i aria-hidden="true"></i><span>${esc(p.name)}${p.cid === net.cid ? ' (you)' : ''}</span><small>${p.host ? 'host' : 'guest'}</small></li>`).join('')
    + (players.length < 2 ? '<li class="empty"><span>Waiting for a friend…</span></li>' : '');
  for (const b of els.maps.querySelectorAll('.venue')) {
    b.setAttribute('aria-checked', String(b.dataset.map === l.map));
    b.disabled = !host;
  }
  els.diff.value = l.difficulty;
  els.diff.disabled = !host;
  const D = DIFFICULTY[l.difficulty];
  els.diffName.textContent = D.name;
  els.diffDesc.textContent = D.desc;
  els.start.hidden = !host;
  els.start.disabled = l.players.length < 2;
  els.start.textContent = l.players.length < 2 ? 'Waiting for your partner…' : 'Start the day together';
  if (!host) status(l.players.length < 2 ? 'The host left. Waiting for them to come back…' : `Waiting for ${net.partnerName} to start the day…`);
  else if (!els.status.classList.contains('bad')) status(l.players.length < 2 ? 'Share the room code or the invite link.' : '');
}

// ------------------------------------------------------------------ chat

/** Everything said in the room this session (lobby and kitchen). */
net.chat = [];
let lastChat = 0;
function addChat(name, text, mine) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 140);
  if (!clean) return;
  const msg = { name: String(name || 'Chef').slice(0, 16), text: clean, mine, at: Date.now() };
  net.chat.push(msg);
  if (net.chat.length > 40) net.chat.shift();
  renderLobbyChat();
  net.emit('chat', msg);
}
/** Say something to the other chef. */
net.say = (text) => {
  const now = Date.now();
  if (now - lastChat < 350 || !net.ws) return false;
  lastChat = now;
  const clean = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 140);
  if (!clean) return false;
  net.send({ t: 'chat', name: net.name, text: clean });
  addChat(net.name, clean, true);
  return true;
};
/** One chat line as safe HTML. */
export const chatLine = (m) => `<p class="cl ${m.mine ? 'mine' : ''}"><b>${esc(m.name)}</b> ${esc(m.text)}</p>`;

function renderLobbyChat() {
  if (!els || !els.chatLog) return;
  els.chatLog.innerHTML = net.chat.slice(-30).map(chatLine).join('') || '<p class="cl empty">Say hi to your partner!</p>';
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function enterRoom(code) {
  const name = els.name.value.trim().slice(0, 16) || 'Chef';
  net.name = name;
  net.room = code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  if (net.room.length < 4) return status('Room codes have four letters.', true);
  net.server = await resolveServer(els.server.value || hashParams().server || '');
  saveStore({ name, server: els.server.value.trim() });
  if (!net.server) {
    els.serverBox.open = true;
    return status('Add your co-op server address first (see the README to deploy one).', true);
  }
  leaving = false;
  retry = 0;
  if (net.ws) { leaving = true; net.ws.close(); leaving = false; }
  // remember the room in the address so a reload (or a map switch) rejoins it
  history.replaceState(null, '', `#${VENUE}&room=${net.room}${net.serverParam()}`);
  connect();
}

/** Leave the room and go back to the title (a fresh page, so nothing lingers). */
export function leaveRoom() {
  leaving = true;
  if (net.ws) net.ws.close();
  location.hash = VENUE;
  location.reload();
}

export function setupLobby({ onOpen, onClose }) {
  els = {
    box: $('#lobby'), join: $('#lobbyJoin'), roomBox: $('#lobbyRoom'), name: $('#lobbyName'), code: $('#roomCode'),
    codeIn: $('#lobbyCode'), server: $('#lobbyServer'), serverBox: $('#lobbyServerBox'), chefs: $('#lobbyChefs'),
    maps: $('#lobbyMaps'), diff: $('#lobbyDiff'), diffName: $('#diffName'), diffDesc: $('#diffDesc'), start: $('#lobbyStart'),
    status: $('#lobbyStatus'), back: $('#lobbyBack'), chatLog: $('#lobbyChatLog'), chatForm: $('#lobbyChatForm'), chatIn: $('#lobbyChatIn'),
  };
  const store = loadStore();
  net.cid = store.cid || randomId();
  saveStore({ cid: net.cid });
  els.name.value = store.name || '';
  els.server.value = store.server || hashParams().server || '';
  els.diffDesc.textContent = DIFFICULTY[3].desc;
  renderLobbyChat();
  els.chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (net.say(els.chatIn.value)) els.chatIn.value = '';
  });

  const open = () => {
    els.box.hidden = false;
    onOpen();
    if (!els.name.value) els.name.focus();
  };
  els.box.addEventListener('keydown', (e) => e.stopPropagation());
  $('#lobbyCreate').addEventListener('click', () => enterRoom(roomCode()));
  $('#lobbyJoinBtn').addEventListener('click', () => enterRoom(els.codeIn.value));
  els.codeIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') enterRoom(els.codeIn.value); });
  els.back.addEventListener('click', () => {
    if (net.room) return leaveRoom();
    els.box.hidden = true;
    onClose();
  });
  $('#copyLink').addEventListener('click', async () => {
    const link = `${location.origin}${location.pathname}#${VENUE}&room=${net.room}${net.serverParam()}`;
    try {
      await navigator.clipboard.writeText(link);
      status('Invite link copied!');
    } catch {
      status(link);
    }
  });
  els.maps.addEventListener('click', (e) => {
    const b = e.target.closest('.venue');
    if (!b || net.role !== 'host') return;
    net.send({ t: 'setup', map: b.dataset.map });
  });
  els.diff.addEventListener('input', () => {
    const D = DIFFICULTY[+els.diff.value];
    els.diffName.textContent = D.name;
    els.diffDesc.textContent = D.desc;
  });
  els.diff.addEventListener('change', () => net.send({ t: 'setup', difficulty: +els.diff.value }));
  els.start.addEventListener('click', () => {
    if (net.role !== 'host' || !net.partnerHere) return;
    net.send({ t: 'setup', started: true });
  });

  // a reload with #map&room=CODE (an invite link, or switching maps) jumps straight in
  const room = hashParams().room;
  if (room) {
    open();
    if (!els.name.value) els.name.value = 'Chef';
    enterRoom(room);
  }
  return { open, hide: () => { els.box.hidden = true; } };
}
