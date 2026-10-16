const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer, WebSocket } = require('ws');
const PORT = process.env.PORT || 3000;
const GAME = path.join(__dirname, 'Dustline_Off-Road.html');
const clients = new Map();
const server = http.createServer((req, res) => {
  if (req.url === '/health') { res.writeHead(200, {'content-type':'text/plain'}); return res.end('ok'); }
  if (req.url === '/' || req.url.startsWith('/Dustline_Off-Road.html')) {
    fs.readFile(GAME, (err, data) => { if (err) { res.writeHead(500); return res.end('Game file missing'); }
      res.writeHead(200, {'content-type':'text/html; charset=utf-8','cache-control':'no-store'}); res.end(data);
    }); return;
  }
  res.writeHead(404); res.end('Not found');
});
const wss = new WebSocketServer({ server, path: '/ws' });
function safeSend(ws, data) { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data)); }
function members(scope, room) { return [...clients.values()].filter(c => c.scope === scope && c.room === room); }
function snapshot(scope, room) {
  return members(scope, room).map(c => ({ peer:c.id, kind:'viewer', presence:c.presence, updatedAt:c.updatedAt }));
}
function broadcastPeers(scope, room) {
  const peers = snapshot(scope, room);
  for (const c of members(scope, room)) safeSend(c.ws, {type:'peers', peers});
}
function leave(c) {
  if (!c || !c.scope) return;
  const {scope, room} = c;
  clients.delete(c.id);
  broadcastPeers(scope, room);
}
wss.on('connection', ws => {
  const c = { ws, id:Math.random().toString(36).slice(2)+Date.now().toString(36), scope:null, room:null, presence:{}, updatedAt:Date.now() };
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw.toString()); } catch { return; }
    if (m.type === 'hello') {
      if (c.scope) leave(c);
      c.scope = m.scope === 'room' ? 'room' : 'lobby';
      c.room = String(m.room || (c.scope === 'lobby' ? 'lobby' : '')).slice(0,80);
      if (!c.room) { safeSend(ws,{type:'error',message:'Missing room'}); return; }
      c.presence = {}; c.updatedAt = Date.now(); clients.set(c.id,c);
      safeSend(ws,{type:'ready',id:c.id,peers:snapshot(c.scope,c.room)});
      broadcastPeers(c.scope,c.room); return;
    }
    if (!c.scope || !clients.has(c.id)) return;
    if (m.type === 'presence' && m.data && typeof m.data === 'object') {
      for (const [k,v] of Object.entries(m.data)) {
        if (v === null) delete c.presence[k]; else c.presence[k] = v;
      }
      c.updatedAt = Date.now(); broadcastPeers(c.scope,c.room); return;
    }
    if (m.type === 'emit' && typeof m.topic === 'string') {
      for (const other of members(c.scope,c.room)) if (other.id !== c.id) safeSend(other.ws,{type:'event',from:c.id,topic:m.topic,data:m.data});
      return;
    }
    if (m.type === 'leave') { leave(c); c.scope = null; c.room = null; }
  });
  ws.on('close', () => leave(c));
  ws.on('error', () => leave(c));
});
server.listen(PORT, '0.0.0.0', () => console.log(`Dustline multiplayer server listening on ${PORT}`));
