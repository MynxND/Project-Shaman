import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { GAME_ROOM } from '@shaman/shared';
import { GameRoom } from './rooms/GameRoom.js';
import { authRouter } from './persistence/auth-routes.js';
import { flushAllRooms } from './rooms/GameRoom.js';
// Own variable so tools that set PORT for the web client do not move the game server onto it.
const port = Number(process.env.GAME_SERVER_PORT ?? 2567);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid GAME_SERVER_PORT');
const server = new Server({ transport: new WebSocketTransport({ maxPayload: 4096 }) });
// One room per map: travellers join the room of their destination map (GameRoom reads options.mapId).
server.define(GAME_ROOM, GameRoom).filterBy(['mapId']);
// Accounts: /auth/register, /auth/login, /auth/me, /auth/logout (persistence/auth-routes.ts).
server.router = authRouter();
// Save every signed-in character before the process exits (Ctrl+C, tsx watch restart).
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => { flushAllRooms(); process.exit(0); });
await server.listen(port);
console.log('Shaman server listening on', port);
