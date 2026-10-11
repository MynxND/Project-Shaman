import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Client } from '@colyseus/sdk';
import { GAME_ROOM } from '../../../packages/shared/dist/index.js';

// Live server: skill casts are validated, timed and broadcast by the server; walking cancels a cast.
const server = spawn(process.execPath, [fileURLToPath(new URL('../../server/dist/index.js', import.meta.url))], { env: { ...process.env, GAME_SERVER_PORT: '2582' }, stdio: ['ignore', 'pipe', 'pipe'] });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const rooms = []; let errors = ''; server.stderr.on('data', (d) => errors += d);
try {
  await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('server startup timeout ' + errors)), 10000); server.stdout.on('data', (d) => { if (d.toString().includes('listening')) { clearTimeout(timer); resolve(); } }); server.once('error', reject); });
  const client = new Client('ws://localhost:2582');
  const a = await client.joinOrCreate(GAME_ROOM); rooms.push(a);
  const b = await client.joinOrCreate(GAME_ROOM); rooms.push(b);
  for (const r of rooms) r.onMessage('profile', () => {});
  const seenA = [], seenB = [], errorsA = [];
  a.onMessage('skill', (e) => seenA.push({ ...e, at: Date.now() }));
  b.onMessage('skill', (e) => seenB.push({ ...e, at: Date.now() }));
  a.onMessage('skill:error', (e) => errorsA.push(e.error));
  b.onMessage('skill:error', () => {});
  const waitFor = async (check, label, ms = 4000) => { const t = Date.now(); while (Date.now() - t < ms) { if (check()) return; await sleep(20); } throw new Error('timeout: ' + label); };
  await sleep(300);

  a.send('skill', { skillId: 'amulet-blast' });
  await waitFor(() => errorsA.includes('not-learned'), 'not-learned');
  a.send('skill', { skillId: 'meditation' });
  await waitFor(() => errorsA.includes('not-castable'), 'not-castable');

  // Spirit Bolt (known from the start): start at once, release after the 1.5 s source cast time, seen by both clients.
  const sent = Date.now();
  a.send('skill', { skillId: 'spirit-bolt', facing: 'west' });
  await waitFor(() => seenA.some((e) => e.phase === 'start'), 'start');
  const start = seenA.find((e) => e.phase === 'start');
  assert.equal(start.caster, a.sessionId); assert.equal(start.facing, 'west'); assert.equal(start.castMs, 1500);
  assert.ok(start.aimX < start.x, 'aims west');
  a.send('skill', { skillId: 'spirit-bolt' });
  await waitFor(() => errorsA.includes('busy'), 'busy');
  await waitFor(() => seenA.some((e) => e.phase === 'release'), 'release');
  const released = seenA.find((e) => e.phase === 'release').at - sent;
  assert.ok(released >= 1400 && released < 2200, `release after ${released} ms`);
  await waitFor(() => seenB.some((e) => e.caster === a.sessionId && e.phase === 'release'), 'other client sees release');
  a.send('skill', { skillId: 'spirit-bolt' });
  await waitFor(() => errorsA.includes('cooldown'), 'cooldown');

  // After the 1 s cooldown it casts again; walking cancels it and no release follows.
  await sleep(1100);
  seenA.length = 0;
  a.send('skill', { skillId: 'spirit-bolt' });
  await waitFor(() => seenA.some((e) => e.phase === 'start'), 'second start');
  await sleep(300);
  a.send('move', { x: 1, y: 0, sequence: 1 });
  await waitFor(() => seenA.some((e) => e.phase === 'cancel'), 'cancel');
  a.send('move', { x: 0, y: 0, sequence: 2 });
  await sleep(1600);
  assert.ok(!seenA.some((e) => e.phase === 'release'), 'cancelled cast never releases');
  // Cancel costs no cooldown.
  seenA.length = 0;
  a.send('skill', { skillId: 'spirit-bolt' });
  await waitFor(() => seenA.some((e) => e.phase === 'start'), 'start after cancel');
  console.log('PASS: skill not-learned/passive/busy/cooldown checks, server cast timing, broadcast to other clients, walking cancels without release');
} finally {
  for (const r of rooms) await r.leave().catch(() => {});
  server.kill();
}
