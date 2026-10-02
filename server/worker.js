// Hillside Bakery co-op server: a Cloudflare Worker that serves the game and
// hosts two-player rooms. Each room is a Durable Object that keeps the lobby
// (map, difficulty, who's host) and relays messages between the two chefs.
// The host's browser runs the kitchen; the room just passes messages along.
import { DurableObject } from 'cloudflare:workers';

const MAPS = ['bakery', 'restaurant'];
const MAX_PLAYERS = 2;
// a host who drops out (say, reloading to switch maps) keeps the room this long
const HOST_GRACE_MS = 20000;

export class Room extends DurableObject {
  async lobby() {
    return (await this.ctx.storage.get('lobby')) || { host: null, hostGone: 0, map: 'bakery', difficulty: 3, names: {}, started: false };
  }

  /** The chefs connected right now (one entry per chef), leaving out a closing socket. */
  players(except = null) {
    const seen = new Map();
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === except) continue;
      const a = ws.deserializeAttachment();
      if (a && a.cid) seen.set(a.cid, ws);
    }
    return seen;
  }

  broadcastLobby(l, except = null) {
    const players = [...this.players(except).keys()].map((cid) => ({ cid, name: l.names[cid] || 'Chef', host: cid === l.host }));
    const msg = JSON.stringify({ t: 'lobby', map: l.map, difficulty: l.difficulty, started: l.started, host: l.host, players });
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === except) continue;
      try { ws.send(msg); } catch { /* closing */ }
    }
  }

  async fetch(req) {
    const url = new URL(req.url);
    const cid = (url.searchParams.get('cid') || '').replace(/[^\w-]/g, '').slice(0, 40);
    const name = (url.searchParams.get('name') || 'Chef').slice(0, 16);
    if (!cid) return new Response('missing cid', { status: 400 });
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    const here = this.players();
    // a chef reconnecting (after switching maps) replaces their old socket
    const old = here.get(cid);
    if (old) {
      here.delete(cid);
      try { old.close(4000, 'replaced'); } catch { /* gone */ }
    }
    if (here.size >= MAX_PLAYERS) {
      server.send(JSON.stringify({ t: 'error', msg: 'That room already has two chefs.' }));
      server.close(4001, 'full');
      return new Response(null, { status: 101, webSocket: client });
    }
    server.serializeAttachment({ cid });
    const l = await this.lobby();
    l.names[cid] = name;
    const hostHere = l.host && here.has(l.host);
    const graceOver = !l.hostGone || Date.now() - l.hostGone > HOST_GRACE_MS;
    if (!l.host || l.host === cid || (!hostHere && graceOver)) {
      if (l.host !== cid) {
        // a new host: the room opens in the kitchen they're standing in
        l.started = false;
        const map = url.searchParams.get('map');
        if (MAPS.includes(map)) l.map = map;
      }
      l.host = cid;
      l.hostGone = 0;
    }
    await this.ctx.storage.put('lobby', l);
    this.broadcastLobby(l);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, raw) {
    const me = ws.deserializeAttachment() || {};
    if (typeof raw !== 'string' || raw.length > 256 * 1024) return;
    if (raw.startsWith('{"t":"setup"') || raw.startsWith('{"t":"name"')) {
      let m;
      try { m = JSON.parse(raw); } catch { return; }
      const l = await this.lobby();
      if (m.t === 'setup') {
        if (me.cid !== l.host) return;
        if (MAPS.includes(m.map)) l.map = m.map;
        if (Number.isFinite(m.difficulty)) l.difficulty = Math.max(1, Math.min(5, Math.round(m.difficulty)));
        if (typeof m.started === 'boolean') l.started = m.started;
      } else {
        l.names[me.cid] = String(m.name || 'Chef').slice(0, 16);
      }
      await this.ctx.storage.put('lobby', l);
      this.broadcastLobby(l);
      return;
    }
    // everything else is game traffic for the other chef
    for (const [cid, other] of this.players()) {
      if (cid === me.cid) continue;
      try { other.send(raw); } catch { /* closing */ }
    }
  }

  async webSocketClose(ws) {
    const me = ws.deserializeAttachment() || {};
    try { ws.close(); } catch { /* already closed */ }
    // a socket turned away (room full) never joined
    if (!me.cid) return;
    const left = this.players(ws);
    // replaced by a fresh socket from the same chef: nothing changed
    if (left.has(me.cid)) return;
    const l = await this.lobby();
    if (me.cid === l.host) l.hostGone = Date.now();
    if (!left.size) l.started = false;
    await this.ctx.storage.put('lobby', l);
    this.broadcastLobby(l, ws);
    for (const other of left.values()) {
      try { other.send(JSON.stringify({ t: 'peerLeft', cid: me.cid })); } catch { /* closing */ }
    }
  }

  async webSocketError(ws) { return this.webSocketClose(ws); }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const m = url.pathname.match(/^\/room\/([A-Za-z0-9]{4,8})$/);
    if (m) {
      if (req.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket', { status: 426 });
      const stub = env.ROOMS.get(env.ROOMS.idFromName(m[1].toUpperCase()));
      return stub.fetch(req);
    }
    if (url.pathname === '/health') return Response.json({ ok: true });
    return env.ASSETS.fetch(req);
  },
};
