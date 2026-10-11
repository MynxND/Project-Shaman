import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@colyseus/sdk';
import { GAME_ROOM } from '../../../packages/shared/dist/index.js';

// Live server, Phase 4 persistence + accounts: register / login / me / wrong password; a signed-in character keeps its
// job, skills and position across leave + rejoin and across a server restart (SQLite file); a second login takes over
// the first session; guests still play unsaved.
const PORT = 2588, URL_HTTP = `http://localhost:${PORT}`, URL_WS = `ws://localhost:${PORT}`;
const dir = mkdtempSync(join(tmpdir(), 'shaman-db-'));
const env = { ...process.env, NODE_ENV: 'development', GAME_SERVER_PORT: String(PORT), SHAMAN_DB_PATH: join(dir, 'test.sqlite'), SHAMAN_AUTOSAVE_MS: '500' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let server, errors = '';
const start = async () => {
  server = spawn(process.execPath, [fileURLToPath(new URL('../../server/dist/index.js', import.meta.url))], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stderr.on('data', (d) => errors += d);
  await new Promise((resolve, reject) => { const t = setTimeout(() => reject(new Error('startup ' + errors)), 10000); server.stdout.on('data', (d) => { if (d.toString().includes('listening')) { clearTimeout(t); resolve(); } }); });
};
const stop = async () => { const done = new Promise((r) => server.once('exit', r)); server.kill('SIGINT'); await done; };
const post = (path, body, token) => fetch(URL_HTTP + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body ?? {}) }).then(async (r) => ({ status: r.status, body: await r.json() }));
const get = (path, token) => fetch(URL_HTTP + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then(async (r) => ({ status: r.status, body: await r.json() }));
const join_ = async (options) => {
  const room = await new Client(URL_WS).joinOrCreate(GAME_ROOM, options);
  const s = { room, profile: null, account: null, left: null };
  room.onMessage('profile', (d) => { s.profile = d.profile; });
  room.onMessage('account', (d) => { s.account = d; });
  for (const t of ['vitals', 'combat', 'skill', 'skill:error', 'cooldown']) room.onMessage(t, () => {});
  room.onLeave((code) => { s.left = code; });
  room.send('profile:get');
  return s;
};
const waitFor = async (check, label, ms = 5000) => { const t = Date.now(); while (Date.now() - t < ms) { if (check()) return; await sleep(25); } throw new Error('timeout: ' + label); };

try {
  await start();
  // Accounts.
  assert.equal((await post('/auth/register', { username: 'ab', password: 'longenough' })).body.error, 'bad-username');
  assert.equal((await post('/auth/register', { username: 'tester', password: 'short' })).body.error, 'bad-password');
  const reg = await post('/auth/register', { username: 'Tester', password: 'correct horse' });
  assert.equal(reg.status, 200); assert.equal(reg.body.username, 'tester'); assert.ok(reg.body.token.length > 30);
  assert.equal((await post('/auth/register', { username: 'tester', password: 'whatever12' })).status, 409, 'username taken');
  assert.equal((await post('/auth/login', { username: 'tester', password: 'wrong pass' })).status, 401, 'wrong password');
  const login = await post('/auth/login', { username: 'TESTER', password: 'correct horse' });
  assert.equal(login.status, 200);
  const token = login.body.token;
  assert.equal((await get('/auth/me', token)).body.username, 'tester');
  assert.equal((await get('/auth/me', 'nope'.repeat(10))).status, 401);

  // Play signed in: job change + skills + a warp, then leave.
  let a = await join_({ authToken: token, bodyType: 'female' });
  await waitFor(() => a.profile && a.account, 'signed-in join');
  assert.equal(a.account.username, 'tester');
  a.room.send('dev:job'); await waitFor(() => a.profile.jobLevel >= 10, 'job');
  a.room.send('dev:advance', { branch: 'ullr-hunter' }); await waitFor(() => a.profile.branch === 'ullr-hunter', 'advance');
  a.room.send('skill:learn', { skillId: 'twin-shot' }); await waitFor(() => a.profile.skills['twin-shot'] === 1, 'learn');
  a.room.send('dev:warp', { x: 44, y: 30 }); await sleep(300);
  const pos = { x: a.room.state.players.get(a.room.sessionId).x, y: a.room.state.players.get(a.room.sessionId).y };
  await a.room.leave(); await sleep(300);
  const me = (await get('/auth/me', token)).body;
  assert.equal(me.character.branch, 'ullr-hunter'); assert.equal(me.character.bodyType, 'female');

  // Rejoin: the same character continues where it stood.
  let b = await join_({ authToken: token, bodyType: 'male' });
  await waitFor(() => b.profile, 'rejoin');
  assert.equal(b.profile.branch, 'ullr-hunter'); assert.equal(b.profile.skills['twin-shot'], 1, 'skills kept');
  const p = b.room.state.players.get(b.room.sessionId);
  assert.ok(Math.abs(p.x - pos.x) < 0.01 && Math.abs(p.y - pos.y) < 0.01, 'position kept'); assert.equal(p.bodyType, 'female', 'saved body type wins');
  // A second login takes over: the first session is saved and disconnected.
  const c = await join_({ authToken: token });
  await waitFor(() => b.left !== null, 'first session kicked');
  assert.equal(b.left, 4001);
  await waitFor(() => c.profile, 'second session');
  assert.equal(c.profile.branch, 'ullr-hunter');
  // Guests still play, unsaved.
  const g = await join_({});
  await waitFor(() => g.profile, 'guest');
  assert.equal(g.account, null); assert.equal(g.profile.branch, null);
  await g.room.leave();
  // Bad token is refused.
  await assert.rejects(new Client(URL_WS).joinOrCreate(GAME_ROOM, { authToken: 'x'.repeat(43) }), 'bad token refused');
  c.room.send('skill:learn', { skillId: 'falcon-strike' }); await waitFor(() => c.profile.skills['falcon-strike'] === 1, 'learn 2');
  await sleep(200);

  // Server restart without a clean shutdown (Windows kills at once): the autosave already wrote the character.
  await sleep(800);
  await stop(); await start();
  const d = await join_({ authToken: token });
  await waitFor(() => d.profile, 'after restart');
  assert.equal(d.profile.skills['falcon-strike'], 1, 'autosaved and loaded after restart');
  await d.room.leave();
  const out = await post('/auth/logout', {}, token);
  assert.equal(out.body.ok, true); assert.equal((await get('/auth/me', token)).status, 401, 'logged out');
  console.log('PASS persistence network: register/login/me/logout validation, signed-in save on leave + rejoin (job, skills, position, look), takeover kick, guests unsaved, bad token refused, autosave survives a hard server restart');
} finally {
  server?.kill();
  await sleep(200);
  try { rmSync(dir, { recursive: true, force: true }); } catch {}
}
