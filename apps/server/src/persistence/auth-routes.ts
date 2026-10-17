import { createEndpoint, createRouter } from '@colyseus/core';
import { store, type AuthError } from './store.js';
import { roomStats } from '../rooms/GameRoom.js';
import { originAllowed, type ServerConfig } from '../config.js';
import { loopDelay, memoryMb } from '../metrics.js';

// Account HTTP endpoints, served by the Colyseus router on the game server port (CORS headers come from Colyseus):
//   POST /auth/register {username, password}  → {token, username, character}
//   POST /auth/login    {username, password}  → {token, username, character}
//   GET  /auth/me       (Authorization: Bearer <token>) → {username, character}
//   POST /auth/logout   (Authorization: Bearer <token>) → {ok}
//   GET  /health        → {ok, rooms, players, uptimeSeconds, eventLoopMs, memoryMb} for monitoring (no player data)
// `character` is a short summary (map, level, job) or null before the first join. Login attempts are rate limited per IP.

/** Set by index.ts from the socket (or the trusted proxy) on every request; never taken from the client. */
export const CLIENT_IP_HEADER = 'x-shaman-client-ip';
const AUTH_ERROR_STATUS: Readonly<Record<AuthError, number>> = { 'bad-username': 400, 'bad-password': 400, 'username-taken': 409, 'wrong-credentials': 401 };
const attempts = new Map<string, { count: number; reset: number }>();
const WINDOW_MS = 60_000;

function limited(ip: string, limit: number): boolean {
  const now = Date.now(), a = attempts.get(ip);
  if (!a || a.reset < now) {
    // Forget expired windows now and then so the table cannot grow without bound.
    if (attempts.size > 10_000) for (const [k, v] of attempts) if (v.reset < now) attempts.delete(k);
    attempts.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  a.count++;
  return a.count > limit;
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const bearer = (req: Request | undefined) => req?.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
const ipOf = (req: Request | undefined) => req?.headers.get(CLIENT_IP_HEADER) || 'unknown';
function summary(accountId: number) {
  const c = store().loadCharacter(accountId);
  return c ? { mapId: c.mapId, level: c.profile.level, jobTier: c.profile.jobTier, branch: c.profile.branch, bodyType: c.bodyType, head: c.head } : null;
}
function credentials(body: unknown): { username: string; password: string } | null {
  const b = body as { username?: unknown; password?: unknown } | null;
  return b && typeof b.username === 'string' && typeof b.password === 'string' ? { username: b.username, password: b.password } : null;
}

export function authRouter(config: ServerConfig) {
  /** Browsers from other sites are refused before any work (CORS alone would still let the request run). */
  const refused = (req: Request | undefined) => !originAllowed(config, req?.headers.get('origin'));
  const startedAt = Date.now();
  return createRouter({
    register: createEndpoint('/auth/register', { method: 'POST' }, async (ctx) => {
      if (refused(ctx.request)) return json({ error: 'origin-not-allowed' }, 403);
      if (limited(ipOf(ctx.request), config.authAttemptsPerMinute)) return json({ error: 'too-many-attempts' }, 429);
      const c = credentials(ctx.body);
      if (!c) return json({ error: 'bad-request' }, 400);
      const account = await store().createAccount(c.username, c.password);
      if (typeof account === 'string') return json({ error: account }, AUTH_ERROR_STATUS[account]);
      return json({ token: store().createSession(account.id), username: account.username, character: null });
    }),
    login: createEndpoint('/auth/login', { method: 'POST' }, async (ctx) => {
      if (refused(ctx.request)) return json({ error: 'origin-not-allowed' }, 403);
      if (limited(ipOf(ctx.request), config.authAttemptsPerMinute)) return json({ error: 'too-many-attempts' }, 429);
      const c = credentials(ctx.body);
      if (!c) return json({ error: 'bad-request' }, 400);
      const account = await store().verifyLogin(c.username, c.password);
      if (typeof account === 'string') return json({ error: account }, AUTH_ERROR_STATUS[account]);
      return json({ token: store().createSession(account.id), username: account.username, character: summary(account.id) });
    }),
    me: createEndpoint('/auth/me', { method: 'GET' }, async (ctx) => {
      if (refused(ctx.request)) return json({ error: 'origin-not-allowed' }, 403);
      const account = store().accountForToken(bearer(ctx.request));
      if (!account) return json({ error: 'not-signed-in' }, 401);
      return json({ username: account.username, character: summary(account.id) });
    }),
    logout: createEndpoint('/auth/logout', { method: 'POST' }, async (ctx) => {
      if (refused(ctx.request)) return json({ error: 'origin-not-allowed' }, 403);
      const token = bearer(ctx.request);
      if (token) store().endSession(token);
      return json({ ok: true });
    }),
    health: createEndpoint('/health', { method: 'GET' }, async () =>
      json({ ok: true, ...roomStats(), uptimeSeconds: Math.round((Date.now() - startedAt) / 1000), eventLoopMs: loopDelay(), memoryMb: memoryMb() })),
  });
}
