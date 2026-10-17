import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import http from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { Client } from '@colyseus/sdk';
import { GAME_ROOM } from '../../../packages/shared/dist/index.js';
import { SqliteStore } from '../../server/dist/persistence/store.js';

// OPS-01 (docs/ops/DEPLOYMENT.md): batched/skipped saves and async password hashing in the store; a production server
// refuses to start half-configured, rejects foreign browser origins (HTTP and WebSocket), cannot be talked out of the
// login rate limit with a forged X-Forwarded-For, answers /health; the online backup is consistent while the server
// runs and the restore refuses a running server, keeps the old file and brings the saved character back.
const dir = mkdtempSync(join(tmpdir(), 'shaman-ops-'));
const serverJs = fileURLToPath(new URL('../../server/dist/index.js', import.meta.url));
const tool = (name) => fileURLToPath(new URL(`../../../tools/ops/${name}`, import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 2591, ORIGIN = 'https://play.shaman.test', HTTP = `http://127.0.0.1:${PORT}`;
let server, logs = '';

try {
  // --- Store: async hashing, duplicate names, batched saves that skip unchanged characters, checkpoint on close.
  const file = join(dir, 'store.sqlite');
  const s = new SqliteStore(file);
  const a = await s.createAccount('ops_user', 'password-123');
  assert.equal(typeof a, 'object');
  assert.equal(await s.createAccount('OPS_USER', 'password-123'), 'username-taken');
  assert.equal(await s.verifyLogin('ops_user', 'wrong-password'), 'wrong-credentials');
  assert.deepEqual(await s.verifyLogin('ops_user', 'password-123'), a);
  const profile = { level: 7, jobTier: 1, branch: 'achan-saiyasat', silver: 10 };
  const rec = { accountId: a.id, bodyType: 'male', head: 'h', profile, mapId: 'umbral-capital', x: 1, y: 2, updatedAt: 0 };
  s.saveCharacters([rec]);
  const raw = new DatabaseSync(file, { readOnly: true });
  const stampOf = () => raw.prepare('SELECT updated_at AS t FROM characters WHERE account_id = ?').get(a.id).t;
  const first = stampOf();
  await sleep(5);
  s.saveCharacters([{ ...rec, profile: { ...profile } }]);
  assert.equal(stampOf(), first, 'an unchanged character is not rewritten');
  s.saveCharacters([{ ...rec, x: 3 }]);
  assert.notEqual(stampOf(), first, 'a moved character is written');
  raw.close();
  s.close();
  assert.ok(!existsSync(file + '-wal') || statSync(file + '-wal').size === 0, 'close() folds the WAL into the main file');

  // --- Production start-up refuses missing settings.
  const prodEnv = { ...process.env, NODE_ENV: 'production', GAME_SERVER_PORT: String(PORT), GAME_SERVER_HOST: '127.0.0.1', SHAMAN_DB_PATH: join(dir, 'game.sqlite'), SHAMAN_AUTOSAVE_MS: '300', SHAMAN_ALLOWED_ORIGINS: ORIGIN };
  for (const missing of ['SHAMAN_ALLOWED_ORIGINS', 'SHAMAN_DB_PATH']) {
    const env = { ...prodEnv }; delete env[missing];
    assert.throws(() => execFileSync(process.execPath, [serverJs], { env, stdio: 'pipe', timeout: 15000 }), new RegExp(missing), `production without ${missing} must not start`);
  }

  // --- Production server.
  server = spawn(process.execPath, [serverJs], { env: prodEnv, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stderr.on('data', (d) => { logs += d; });
  await new Promise((resolve, reject) => { const t = setTimeout(() => reject(new Error('startup ' + logs)), 15000); server.stdout.on('data', (d) => { if (d.toString().includes('listening')) { clearTimeout(t); resolve(); } }); });

  const health = await fetch(HTTP + '/health').then((r) => r.json());
  assert.equal(health.ok, true);
  assert.equal(typeof health.players, 'number');

  const post = (path, body, headers = {}) => fetch(HTTP + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: ORIGIN, ...headers }, body: JSON.stringify(body) })
    .then(async (r) => ({ status: r.status, body: await r.json(), cors: r.headers.get('access-control-allow-origin') }));
  const foreign = await post('/auth/login', { username: 'x', password: 'y' }, { Origin: 'https://evil.test' });
  assert.equal(foreign.status, 403, 'login from a foreign site is refused');
  const reg = await post('/auth/register', { username: 'ops_player', password: 'password-123' });
  assert.equal(reg.status, 200, JSON.stringify(reg.body));
  assert.equal(reg.cors, ORIGIN);

  // WebSocket handshake from a foreign origin is rejected before any room work.
  const upgrade = (origin) => new Promise((resolve) => {
    const req = http.request({ host: '127.0.0.1', port: PORT, path: '/', headers: { Connection: 'Upgrade', Upgrade: 'websocket', 'Sec-WebSocket-Version': '13', 'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==', Origin: origin } });
    req.on('response', (res) => { resolve(res.statusCode); res.resume(); });
    req.on('upgrade', (_res, socket) => { socket.destroy(); resolve(101); });
    req.on('error', () => resolve(0));
    req.end();
  });
  assert.notEqual(await upgrade('https://evil.test'), 101, 'foreign WebSocket origin refused');
  assert.equal(await upgrade(ORIGIN), 101, 'own origin may upgrade');

  // A signed-in player joins (non-browser client: no Origin) and is saved.
  const room = await new Client(`ws://127.0.0.1:${PORT}`).joinOrCreate(GAME_ROOM, { authToken: reg.body.token });
  for (const t of ['profile', 'account', 'vitals', 'combat', 'skill', 'skill:error', 'cooldown', 'travel']) room.onMessage(t, () => {});
  await sleep(800);

  // Rate limit: a forged X-Forwarded-For does not give fresh attempts (no trusted proxy configured).
  let last = 0;
  for (let i = 0; i < 12; i++) last = (await post('/auth/login', { username: 'ops_player', password: 'nope-nope' }, { 'X-Forwarded-For': `10.0.0.${i}`, 'x-shaman-client-ip': `10.1.0.${i}` })).status;
  assert.equal(last, 429, 'forged forwarding headers cannot bypass the login limit');

  // Online backup while the server runs, then the restore must refuse.
  const backups = join(dir, 'backups');
  const backup = JSON.parse(execFileSync(process.execPath, [tool('db-backup.mjs'), '--db', prodEnv.SHAMAN_DB_PATH, '--out', backups, '--keep', '2']).toString());
  assert.equal(backup.ok, true);
  assert.equal(backup.accounts, 1);
  assert.equal(backup.characters, 1);
  for (let i = 0; i < 2; i++) { await sleep(1100); execFileSync(process.execPath, [tool('db-backup.mjs'), '--db', prodEnv.SHAMAN_DB_PATH, '--out', backups, '--keep', '2']); }
  assert.ok(!existsSync(backup.backup), 'only the newest --keep copies are kept');
  const latest = JSON.parse(execFileSync(process.execPath, [tool('db-backup.mjs'), '--db', prodEnv.SHAMAN_DB_PATH, '--out', backups, '--keep', '2']).toString()).backup;
  assert.throws(() => execFileSync(process.execPath, [tool('db-restore.mjs'), '--from', latest, '--db', prodEnv.SHAMAN_DB_PATH, '--port', String(PORT)], { stdio: 'pipe' }), /Stop it before restoring/);

  await room.leave();
  const exited = new Promise((r) => server.once('exit', r));
  server.kill('SIGINT');
  await exited;
  server = null;

  // Restore into the old path: the previous file is kept aside and the character is back.
  const restored = JSON.parse(execFileSync(process.execPath, [tool('db-restore.mjs'), '--from', latest, '--db', prodEnv.SHAMAN_DB_PATH, '--port', String(PORT)]).toString());
  assert.equal(restored.ok, true);
  assert.ok(restored.previousKeptAs && existsSync(restored.previousKeptAs), 'previous database kept, not deleted');
  const check = new DatabaseSync(prodEnv.SHAMAN_DB_PATH, { readOnly: true });
  assert.equal(check.prepare('SELECT COUNT(*) AS n FROM characters').get().n, 1);
  check.close();

  console.log('ops: batched/skipped saves, async hashing, WAL checkpoint, production config guard, origin checks (HTTP+WS), unforgeable login limit, /health, online backup + rotation, guarded restore passed');
} finally {
  server?.kill();
  await sleep(300);
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* Windows may still hold a handle briefly */ }
}
