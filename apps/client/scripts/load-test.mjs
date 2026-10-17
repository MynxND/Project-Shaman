import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@colyseus/sdk';
import { GAME_ROOM } from '../../../packages/shared/dist/index.js';

// Load test (docs/ops/DEPLOYMENT.md): N signed-in bot players register, join and walk around while /health reports
// the server's event-loop delay and memory. Starts its own isolated production-mode server with a temporary database
// unless --url points at a running one. Bots run in this process, so on one machine they compete with the server
// for CPU: treat the result as a conservative estimate.
//   node apps/client/scripts/load-test.mjs --players 300 --seconds 60 [--url http://127.0.0.1:2567]
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : fallback; };
const players = Number(arg('--players', 100)), seconds = Number(arg('--seconds', 60));
const external = arg('--url'), PORT = 2595;
const HTTP = external ?? `http://127.0.0.1:${PORT}`, WS = HTTP.replace(/^http/, 'ws');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const health = () => fetch(HTTP + '/health').then((r) => r.json());

let server, dir;
if (!external) {
  dir = mkdtempSync(join(tmpdir(), 'shaman-load-'));
  const env = { ...process.env, NODE_ENV: 'production', GAME_SERVER_PORT: String(PORT), GAME_SERVER_HOST: '127.0.0.1', SHAMAN_DB_PATH: join(dir, 'load.sqlite'),
    SHAMAN_ALLOWED_ORIGINS: 'http://load.test', SHAMAN_AUTH_ATTEMPTS_PER_MINUTE: '100000' };
  server = spawn(process.execPath, [fileURLToPath(new URL('../../server/dist/index.js', import.meta.url))], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let logs = '';
  server.stderr.on('data', (d) => { logs += d; });
  await new Promise((resolve, reject) => { const t = setTimeout(() => reject(new Error('startup ' + logs)), 15000); server.stdout.on('data', (d) => { if (d.toString().includes('listening')) { clearTimeout(t); resolve(); } }); });
}

const run = Date.now().toString(36);
const bots = [];
let joinFailures = 0, disconnects = 0;
async function spawnBot(i) {
  const r = await fetch(HTTP + '/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: `ld${run}_${i}`.slice(0, 20), password: 'load-test-pass' }) }).then((x) => x.json());
  if (!r.token) throw new Error('register ' + JSON.stringify(r));
  const room = await new Client(WS).joinOrCreate(GAME_ROOM, { authToken: r.token });
  room.onMessage('*', () => {});
  room.onLeave(() => { disconnects++; });
  const bot = { room, sequence: 0, dx: 0, dy: 0 };
  bots.push(bot);
}

const samples = [];
const sample = async (phase) => { try { const h = await health(); samples.push({ phase, t: Math.round((Date.now() - t0) / 1000), ...h }); console.log(phase.padEnd(6), `players ${h.players} rooms ${h.rooms} loop p50/p99/max ${h.eventLoopMs.p50}/${h.eventLoopMs.p99}/${h.eventLoopMs.max} ms  rss ${h.memoryMb} MB`); } catch (e) { console.log('health failed', e.message); } };
const t0 = Date.now();
try {
  console.log(`load test: ${players} signed-in bots, ${seconds}s, ${external ? HTTP : 'isolated production server'}`);
  await sleep(10_500); await sample('idle');
  // Ramp up in batches, like players arriving.
  for (let i = 0; i < players; i += 20) {
    const batch = await Promise.allSettled(Array.from({ length: Math.min(20, players - i) }, (_, k) => spawnBot(i + k)));
    joinFailures += batch.filter((b) => b.status === 'rejected').length;
    await sleep(250);
  }
  console.log(`joined ${bots.length}/${players} (failures ${joinFailures})`);
  // Walk: 10 inputs/s per bot like the client, a new random heading every ~2 s, sometimes standing still.
  const walker = setInterval(() => {
    for (const b of bots) {
      if (Math.random() < 0.05) { const a = Math.random() * Math.PI * 2, still = Math.random() < 0.25; b.dx = still ? 0 : Math.cos(a); b.dy = still ? 0 : Math.sin(a); }
      try { b.room.send('move', { x: b.dx, y: b.dy, sequence: ++b.sequence }); } catch { /* left */ }
    }
  }, 100);
  const end = Date.now() + seconds * 1000;
  while (Date.now() < end) { await sleep(10_000); await sample('load'); }
  clearInterval(walker);
  const load = samples.filter((s) => s.phase === 'load');
  const worst = load.reduce((m, s) => Math.max(m, s.eventLoopMs.p99), 0), peakRss = load.reduce((m, s) => Math.max(m, s.memoryMb), 0);
  const db = dir ? statSync(join(dir, 'load.sqlite')).size : null;
  console.log(JSON.stringify({ result: { players, joined: bots.length, joinFailures, disconnects, worstLoopP99Ms: worst, peakRssMb: peakRss, dbBytes: db, samples } }));
} finally {
  for (const b of bots) b.room.leave().catch(() => {});
  await sleep(500);
  server?.kill();
  await sleep(300);
  if (dir) try { rmSync(dir, { recursive: true, force: true }); } catch { /* handle still open */ }
  process.exit(0);
}
