import { createEndpoint, createRouter } from '@colyseus/core';
import { store, type AuthError } from './store.js';

// Account HTTP endpoints, served by the Colyseus router on the game server port (CORS headers come from Colyseus):
//   POST /auth/register {username, password}  → {token, username, character}
//   POST /auth/login    {username, password}  → {token, username, character}
//   GET  /auth/me       (Authorization: Bearer <token>) → {username, character}
//   POST /auth/logout   (Authorization: Bearer <token>) → {ok}
// `character` is a short summary (map, level, job) or null before the first join. Login attempts are rate limited per IP.

const AUTH_ERROR_STATUS: Readonly<Record<AuthError, number>> = { 'bad-username': 400, 'bad-password': 400, 'username-taken': 409, 'wrong-credentials': 401 };
const attempts = new Map<string, { count: number; reset: number }>();
const LIMIT = 10, WINDOW_MS = 60_000;

function limited(ip: string): boolean {
  const now = Date.now(), a = attempts.get(ip);
  if (!a || a.reset < now) { attempts.set(ip, { count: 1, reset: now + WINDOW_MS }); return false; }
  a.count++;
  return a.count > LIMIT;
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const bearer = (req: Request | undefined) => req?.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
const ipOf = (req: Request | undefined) => req?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
function summary(accountId: number) {
  const c = store().loadCharacter(accountId);
  return c ? { mapId: c.mapId, level: c.profile.level, jobTier: c.profile.jobTier, branch: c.profile.branch, bodyType: c.bodyType, head: c.head } : null;
}
function credentials(body: unknown): { username: string; password: string } | null {
  const b = body as { username?: unknown; password?: unknown } | null;
  return b && typeof b.username === 'string' && typeof b.password === 'string' ? { username: b.username, password: b.password } : null;
}

export function authRouter() {
  return createRouter({
    register: createEndpoint('/auth/register', { method: 'POST' }, async (ctx) => {
      if (limited(ipOf(ctx.request))) return json({ error: 'too-many-attempts' }, 429);
      const c = credentials(ctx.body);
      if (!c) return json({ error: 'bad-request' }, 400);
      const account = store().createAccount(c.username, c.password);
      if (typeof account === 'string') return json({ error: account }, AUTH_ERROR_STATUS[account]);
      return json({ token: store().createSession(account.id), username: account.username, character: null });
    }),
    login: createEndpoint('/auth/login', { method: 'POST' }, async (ctx) => {
      if (limited(ipOf(ctx.request))) return json({ error: 'too-many-attempts' }, 429);
      const c = credentials(ctx.body);
      if (!c) return json({ error: 'bad-request' }, 400);
      const account = store().verifyLogin(c.username, c.password);
      if (typeof account === 'string') return json({ error: account }, AUTH_ERROR_STATUS[account]);
      return json({ token: store().createSession(account.id), username: account.username, character: summary(account.id) });
    }),
    me: createEndpoint('/auth/me', { method: 'GET' }, async (ctx) => {
      const account = store().accountForToken(bearer(ctx.request));
      if (!account) return json({ error: 'not-signed-in' }, 401);
      return json({ username: account.username, character: summary(account.id) });
    }),
    logout: createEndpoint('/auth/logout', { method: 'POST' }, async (ctx) => {
      const token = bearer(ctx.request);
      if (token) store().endSession(token);
      return json({ ok: true });
    }),
  });
}
