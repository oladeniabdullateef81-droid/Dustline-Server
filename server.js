const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 20000
});
const PORT = process.env.PORT || 3000;
const MAX_ROOM_PLAYERS = 8;
const users = new Map();

app.get('/health', (_req, res) => res.json({ ok: true, service: 'Dustline multiplayer', players: users.size }));
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.use(express.static(__dirname));

function roomMembers(roomId) {
  return [...users.values()].filter(u => u.room === roomId);
}
function publicPeer(u, currentId) {
  return {
    peer: u.id,
    kind: 'viewer',
    isMe: u.id === currentId,
    sameTab: u.id === currentId,
    room: u.room,
    presence: u.presence,
    updatedAt: u.updatedAt
  };
}
function broadcastPeers() {
  for (const u of users.values()) {
    io.to(u.id).emit('peers', [...users.values()].map(p => publicPeer(p, u.id)));
  }
}
function validRoom(value) {
  return typeof value === 'string' && /^dl-[a-z0-9]{1,12}$/.test(value);
}

io.on('connection', socket => {
  const user = { id: socket.id, room: null, presence: {}, updatedAt: Date.now() };
  users.set(socket.id, user);
  socket.emit('peers', [...users.values()].map(p => publicPeer(p, socket.id)));
  broadcastPeers();

  socket.on('get-peers', callback => {
    const list = [...users.values()].map(p => publicPeer(p, socket.id));
    if (typeof callback === 'function') callback(list);
    else socket.emit('peers', list);
  });

  socket.on('presence', (data, callback) => {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      // Presence is per connected player; clients can update just the fields that changed.
      Object.assign(user.presence, data);
      user.updatedAt = Date.now();
      broadcastPeers();
    }
    if (typeof callback === 'function') callback({ ok: true });
  });

  socket.on('join-room', (roomId, callback) => {
    if (!validRoom(roomId)) return typeof callback === 'function' && callback(false);
    const members = roomMembers(roomId);
    if (!user.room && members.length >= MAX_ROOM_PLAYERS) return typeof callback === 'function' && callback(false);
    if (user.room && user.room !== roomId) socket.leave(user.room);
    user.room = roomId;
    socket.join(roomId);
    user.updatedAt = Date.now();
    broadcastPeers();
    if (typeof callback === 'function') callback(true);
  });

  socket.on('leave-room', callback => {
    if (user.room) socket.leave(user.room);
    user.room = null;
    user.updatedAt = Date.now();
    broadcastPeers();
    if (typeof callback === 'function') callback(true);
  });

  socket.on('room-event', packet => {
    if (!packet || packet.room !== user.room || typeof packet.event !== 'string') return;
    const eventPacket = { room: user.room, from: socket.id, data: packet.data };
    if (packet.data && typeof packet.data.to === 'string') {
      const target = users.get(packet.data.to);
      if (target && target.room === user.room) io.to(target.id).emit('room-event:' + packet.event, eventPacket);
    } else {
      socket.to(user.room).emit('room-event:' + packet.event, eventPacket);
    }
  });

  socket.on('disconnect', () => {
    users.delete(socket.id);
    broadcastPeers();
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Dustline multiplayer server listening on ${PORT}`);
});
