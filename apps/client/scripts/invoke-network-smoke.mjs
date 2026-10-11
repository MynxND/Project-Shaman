import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Client } from '@colyseus/sdk';
import { GAME_ROOM } from '../../../packages/shared/dist/index.js';

// Live server, Onmyoji Invoke (slice 3): job change to Onmyoji (dev commands), learn talismans + Onmyō Seal, Invoke
// refuses without two talismans, the ring is synced, Invoke casts the spell the newest two choose, then cools down.
const server = spawn(process.execPath, [fileURLToPath(new URL('../../server/dist/index.js', import.meta.url))], { env: { ...process.env, NODE_ENV: 'development', GAME_SERVER_PORT: '2586' }, stdio: ['ignore', 'pipe', 'pipe'] });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let room; let errors = ''; server.stderr.on('data', (d) => errors += d);
try {
  await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('server startup timeout ' + errors)), 10000); server.stdout.on('data', (d) => { if (d.toString().includes('listening')) { clearTimeout(timer); resolve(); } }); server.once('error', reject); });
  room = await new Client('ws://localhost:2586').joinOrCreate(GAME_ROOM);
  let profile = null; const casts = [], refusals = [];
  room.onMessage('profile', (d) => { profile = d.profile; });
  room.onMessage('vitals', () => {}); room.onMessage('combat', () => {}); room.onMessage('cooldown', () => {});
  room.onMessage('skill', (e) => casts.push(e));
  room.onMessage('skill:error', (e) => refusals.push(e.error));
  const waitFor = async (check, label, ms = 4000) => { const t = Date.now(); while (Date.now() - t < ms) { if (check()) return; await sleep(20); } throw new Error('timeout: ' + label); };
  room.send('profile:get'); await waitFor(() => profile, 'profile');
  room.send('dev:job'); await waitFor(() => profile.jobLevel >= 10, 'job level');
  room.send('dev:advance', { branch: 'onmyoji' }); await waitFor(() => profile.branch === 'onmyoji', 'advance');
  for (const id of ['wood-talisman', 'water-talisman', 'onmyo-seal']) { room.send('skill:learn', { skillId: id }); await waitFor(() => (profile.skills[id] ?? 0) > 0, id); }

  room.send('skill', { skillId: 'invoke' });
  await waitFor(() => refusals.includes('no-talisman'), 'invoke needs two talismans');
  room.send('skill', { skillId: 'water-talisman' }); await sleep(250);
  room.send('skill', { skillId: 'wood-talisman' }); await sleep(250);
  const self = () => room.state.players.get(room.sessionId);
  await waitFor(() => self()?.held === 'water,wood', 'held ring synced');
  room.send('skill', { skillId: 'invoke', facing: 'east' });
  await waitFor(() => casts.some((e) => e.skillId === 'spring-rain' && e.phase === 'start'), 'invoke casts spring rain ');
  const start = casts.find((e) => e.skillId === 'spring-rain' && e.phase === 'start');
  assert.equal(start.invoke, true); assert.equal(start.invokeCdMs, 6000, 'Onmyō Seal Lv1: 6 s');
  await waitFor(() => casts.some((e) => e.skillId === 'spring-rain' && e.phase === 'release'), 'release');
  await waitFor(() => [...room.state.zones.values()].some((z) => z.kind === 'spring-rain'), 'spring rain zone synced');
  room.send('skill', { skillId: 'invoke' });
  await waitFor(() => refusals.includes('cooldown'), 'invoke cooldown');
  console.log('PASS invoke network: job change, talisman ring sync, no-talisman refusal, invoke → spring rain, zone, invoke cooldown');
} finally {
  await room?.leave().catch(() => {});
  if (errors) console.error('server stderr:', errors.slice(0, 2000));
  server.kill();
}
