import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@colyseus/sdk';
import { BRANCH_WEAPONS, GAME_ROOM, NATION_BRANCHES } from '../../../packages/shared/dist/index.js';

// Admin tools (GameRoom admin:*, HUD AdminPanel): development sessions may switch instantly to every branch at tier 2
// and 3 (branch weapon worn, out-of-branch skills refunded) and back to Medium, set Base Level, add skill points and
// heal. A production server refuses them to everyone except SHAMAN_ADMINS accounts.
const dir = mkdtempSync(join(tmpdir(), 'shaman-admin-'));
const serverJs = fileURLToPath(new URL('../../server/dist/index.js', import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let server;
const start = async (port, env) => {
  server = spawn(process.execPath, [serverJs], { env: { ...process.env, GAME_SERVER_PORT: String(port), SHAMAN_DB_PATH: join(dir, `${port}.sqlite`), ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  let logs = ''; server.stderr.on('data', (d) => { logs += d; });
  await new Promise((resolve, reject) => { const t = setTimeout(() => reject(new Error('startup ' + logs)), 15000); server.stdout.on('data', (d) => { if (d.toString().includes('listening')) { clearTimeout(t); resolve(); } }); });
};
const stop = async () => { const done = new Promise((r) => server.once('exit', r)); server.kill(); await done; server = null; };
const join_ = async (url, options = {}) => {
  const room = await new Client(url).joinOrCreate(GAME_ROOM, options);
  const s = { room, profile: null, admin: null, notes: [] };
  room.onMessage('profile', (d) => { s.profile = d.profile; if (d.result) s.notes.push(d.result); });
  room.onMessage('admin', (d) => { s.admin = d.enabled; });
  room.onMessage('*', () => {});
  room.send('profile:get'); room.send('admin:get');
  return s;
};
const waitFor = async (check, label, ms = 5000) => { const t = Date.now(); while (Date.now() - t < ms) { if (check()) return; await sleep(25); } throw new Error('timeout: ' + label); };

try {
  // Development: every session is an admin.
  await start(2596, { NODE_ENV: 'development' });
  const s = await join_('ws://127.0.0.1:2596');
  await waitFor(() => s.admin !== null && s.profile, 'admin flag');
  assert.equal(s.admin, true);
  s.room.send('admin:stats', { skillPoints: 20 });
  await waitFor(() => s.profile.skillPoints >= 20, 'skill points');
  for (const { branch } of NATION_BRANCHES) for (const tier of [2, 3]) {
    s.room.send('admin:job', { branch, tier });
    await waitFor(() => s.profile.branch === branch && s.profile.jobTier === tier, `${branch} ${tier}`);
    assert.equal(s.profile.jobLevel, 1);
    if (BRANCH_WEAPONS[branch]) assert.equal(s.profile.equipment.weapon, BRANCH_WEAPONS[branch], `${branch} weapon worn`);
    await waitFor(() => s.room.state.players.get(s.room.sessionId)?.branch === branch, `${branch} synced to everyone`);
  }
  s.room.send('admin:job', { branch: null, tier: 1 });
  await waitFor(() => s.profile.branch === null && s.profile.jobTier === 1, 'back to Medium');
  s.room.send('admin:stats', { level: 70 });
  await waitFor(() => s.profile.level === 70 && s.profile.hp === s.profile.hpMax, 'level 70 healed');
  const before = s.notes.length;
  s.room.send('admin:job', { branch: 'not-a-branch', tier: 2 });
  await waitFor(() => s.notes.length > before, 'bad branch answered');
  assert.equal(s.notes.at(-1).ok, false);
  await s.room.leave();
  await stop();

  // Production: a guest is not an admin and admin requests change nothing.
  await start(2597, { NODE_ENV: 'production', SHAMAN_ALLOWED_ORIGINS: 'http://admin.test', SHAMAN_ADMINS: 'boss_admin' });
  const g = await join_('ws://127.0.0.1:2597');
  await waitFor(() => g.admin !== null && g.profile, 'production admin flag');
  assert.equal(g.admin, false);
  g.room.send('admin:job', { branch: NATION_BRANCHES[0].branch, tier: 3 });
  g.room.send('admin:stats', { level: 99 });
  await sleep(500);
  assert.equal(g.profile.jobTier, 1);
  assert.notEqual(g.profile.level, 99);
  // A listed account is an admin in production.
  const reg = await fetch('http://127.0.0.1:2597/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'boss_admin', password: 'password-123' }) }).then((r) => r.json());
  const a = await join_('ws://127.0.0.1:2597', { authToken: reg.token });
  await waitFor(() => a.admin !== null && a.profile, 'listed admin flag');
  assert.equal(a.admin, true);
  a.room.send('admin:job', { branch: NATION_BRANCHES[0].branch, tier: 2 });
  await waitFor(() => a.profile.branch === NATION_BRANCHES[0].branch, 'listed admin job change');
  await g.room.leave(); await a.room.leave();
  console.log(`admin tools: ${NATION_BRANCHES.length} branches × tiers 2/3 with worn weapons and synced branch, Medium reset, level/heal/points, bad branch refused; production refuses guests and allows SHAMAN_ADMINS passed`);
} finally {
  if (server) await stop().catch(() => {});
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* handle still open */ }
}
