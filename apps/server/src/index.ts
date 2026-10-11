import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { GAME_ROOM } from '@shaman/shared';
import { GameRoom } from './rooms/GameRoom.js';
// Own variable so tools that set PORT for the web client do not move the game server onto it.
const port = Number(process.env.GAME_SERVER_PORT ?? 2567);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid GAME_SERVER_PORT');
const server = new Server({ transport: new WebSocketTransport({ maxPayload: 4096 }) });
// One room per map: travellers join the room of their destination map (GameRoom reads options.mapId).
server.define(GAME_ROOM, GameRoom).filterBy(['mapId']);
await server.listen(port);
console.log('Shaman server listening on', port);
