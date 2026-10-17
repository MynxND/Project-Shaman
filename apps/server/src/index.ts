import http from 'node:http';
import { matchMaker, Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { GAME_ROOM } from '@shaman/shared';
import { RangedReviewRoom } from './rooms/RangedReviewRoom.js';
import { GameRoom } from './rooms/GameRoom.js';
import { authRouter, CLIENT_IP_HEADER } from './persistence/auth-routes.js';
import { flushAllRooms } from './rooms/GameRoom.js';
import { closeStore, store } from './persistence/store.js';
import { loadConfig, originAllowed } from './config.js';

// Settings come from the environment (.env.example, docs/ops/DEPLOYMENT.md); production refuses to start half-configured.
const config = loadConfig();

// Own HTTP server so every request carries the real client address in a header we control (the auth rate limit reads
// it); a client-supplied copy of that header is always discarded.
const httpServer = http.createServer();
const stampClientIp = (req: http.IncomingMessage) => {
  const forwarded = config.trustProxy ? String(req.headers['x-forwarded-for'] ?? '').split(',').map((s) => s.trim()).filter(Boolean).pop() : undefined;
  const ip = forwarded || req.socket.remoteAddress || 'unknown';
  // Colyseus builds its Request from rawHeaders, so the forged copy is removed there as well.
  const raw: string[] = [];
  for (let i = 0; i < req.rawHeaders.length; i += 2) if (req.rawHeaders[i]!.toLowerCase() !== CLIENT_IP_HEADER) raw.push(req.rawHeaders[i]!, req.rawHeaders[i + 1]!);
  raw.push(CLIENT_IP_HEADER, ip);
  req.rawHeaders.splice(0, req.rawHeaders.length, ...raw);
  req.headers[CLIENT_IP_HEADER] = ip;
};
// Colyseus re-registers the 'request' listeners when it starts, so the stamp is applied in emit() itself, ahead of all of them.
const emit = httpServer.emit.bind(httpServer);
httpServer.emit = ((event: string, ...args: unknown[]) => {
  if (event === 'request' || event === 'upgrade') stampClientIp(args[0] as http.IncomingMessage);
  return emit(event, ...args);
}) as typeof httpServer.emit;

// Browsers may only connect from the configured web client origins (WebSocket handshake and HTTP CORS).
const transport = new WebSocketTransport({
  server: httpServer,
  maxPayload: 4096,
  verifyClient: (info: { origin: string }) => originAllowed(config, info.origin),
});
if (config.allowedOrigins.length) {
  matchMaker.controller.getCorsHeaders = (headers: Headers) => {
    const origin = headers.get('origin');
    return { 'Access-Control-Allow-Origin': origin && originAllowed(config, origin) ? origin : config.allowedOrigins[0]!, Vary: 'Origin' };
  };
}

const server = new Server({ transport });
// One room per map: travellers join the room of their destination map (GameRoom reads options.mapId).
server.define(GAME_ROOM, GameRoom).filterBy(['mapId']);
if (!config.production) server.define('ranged-review', RangedReviewRoom);
// Accounts: /auth/register, /auth/login, /auth/me, /auth/logout; monitoring: /health (persistence/auth-routes.ts).
server.router = authRouter(config);

// Ctrl+C / SIGTERM / crash: Colyseus disposes the rooms (each leaving player is saved), then everything still online is
// flushed and the database is checkpointed and closed. A stuck shutdown is forced after 15 s with a last save.
server.onBeforeShutdown(() => { flushAllRooms(); });
server.onShutdown(() => { flushAllRooms(); closeStore(); });
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => setTimeout(() => {
    console.error('Shutdown timed out; saving and exiting');
    try { flushAllRooms(); closeStore(); } finally { process.exit(1); }
  }, 15_000).unref());
}

// Open the database now, so a wrong or unwritable SHAMAN_DB_PATH stops start-up instead of the first login.
store();
await server.listen(config.port, config.host);
console.log(`Shaman server listening on ${config.host}:${config.port} (${config.production ? 'production' : 'development'}${config.allowedOrigins.length ? `, origins ${config.allowedOrigins.join(' ')}` : ', any origin'})`);
