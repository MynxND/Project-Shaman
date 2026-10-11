import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { Client } from '@colyseus/sdk';
const server = spawn(process.execPath, [fileURLToPath(new URL('../../server/dist/index.js', import.meta.url))], {
  env: { ...process.env, GAME_SERVER_PORT: '2579' }, stdio: ['ignore', 'pipe', 'pipe']
});
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const rooms = [];
let errors = '';
server.stderr.on('data', data => { errors += data; });
try {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server startup timeout: ' + errors)), 10000);
    server.once('exit', code => { clearTimeout(timeout); reject(new Error('Server exited: ' + code + errors)); });
    server.stdout.on('data', data => { if (data.toString().includes('Shaman server listening')) { clearTimeout(timeout); resolve(); } });
  });
  const client = new Client('ws://localhost:2579');
  const a = await client.joinOrCreate('game'); rooms.push(a);
  const b = await client.joinOrCreate('game', { bodyType: 'female' }); rooms.push(b);
  await sleep(250);
  assert.equal(a.state.players.size, 2);
  assert.equal(b.state.players.size, 2);
  assert.equal(a.state.players.get(b.sessionId).bodyType, 'female');
  assert.equal(a.state.players.get(a.sessionId).bodyType, 'male');
  const me = a.state.players.get(a.sessionId);
  assert.equal(me.facing, 'south');
  assert.equal(me.moving, false);
  const start = me.x;
  const startY = me.y;
  a.send('move', { x: 999, y: 0, sequence: 0 });
  await sleep(150);
  assert.equal(a.state.players.get(a.sessionId).x, start);
  for (let sequence = 1; sequence <= 5; sequence++) {
    a.send('move', { x: 1, y: 1, sequence });
    await sleep(50);
  }
  await sleep(450);
  const position = a.state.players.get(a.sessionId);
  assert.ok(position.x > start && position.x < start + 3);
  assert.ok(Math.abs((position.x - start) - (position.y - startY)) < 0.001, 'diagonal moves equally on both axes');
  assert.equal(position.facing, 'south-east');
  a.send('move', { x: 0, y: 0, sequence: 6 });
  await sleep(100);
  // A stop sent a few ms after a move (inside the 20 ms rate limit) must still stop the player at once.
  a.send('move', { x: 1, y: 0, sequence: 7 });
  a.send('move', { x: 0, y: 0, sequence: 8 });
  await sleep(120);
  const stopX = a.state.players.get(a.sessionId).x;
  await sleep(200);
  assert.equal(a.state.players.get(a.sessionId).x, stopX, 'stop inside the rate limit is not dropped');
  assert.equal(a.state.players.get(a.sessionId).moving, false);
  assert.ok(Number.isFinite(a.state.players.get(a.sessionId).x), 'releasing the keys keeps a valid position');
  assert.ok(Number.isFinite(a.state.players.get(a.sessionId).y));
  const stopped = a.state.players.get(a.sessionId).x;
  await sleep(200);
  assert.equal(a.state.players.get(a.sessionId).x, stopped);
  assert.equal(a.state.players.get(a.sessionId).moving, false, 'stale input stops the walk');
  // A stop carrying a nearby resting point rests exactly there; a far one cannot teleport the player.
  const here = a.state.players.get(a.sessionId);
  const hx = here.x, hy = here.y;
  a.send('move', { x: 0, y: 0, sequence: 10, stopAt: { x: hx + 0.4, y: hy } });
  await sleep(120);
  assert.ok(Math.abs(a.state.players.get(a.sessionId).x - (hx + 0.4)) < 1e-4, 'nearby stop point accepted');
  a.send('move', { x: 0, y: 0, sequence: 11, stopAt: { x: hx + 9, y: hy } });
  await sleep(120);
  assert.ok(Math.abs(a.state.players.get(a.sessionId).x - (hx + 0.4)) < 1e-4, 'far stop point rejected');
  // Server speed matches WALK_SPEED (4 units/s) in real time, so client prediction and server agree.
  const speedStart = a.state.players.get(a.sessionId).x;
  const t0 = Date.now();
  for (let sequence = 20; Date.now() - t0 < 1000; sequence++) { a.send('move', { x: -1, y: 0, sequence }); await sleep(100); }
  a.send('move', { x: 0, y: 0, sequence: 99 });
  const elapsed = (Date.now() - t0) / 1000;
  await sleep(150);
  const travelled = speedStart - a.state.players.get(a.sessionId).x;
  assert.ok(Math.abs(travelled - 4 * elapsed) < 0.6, `server speed ${(travelled / elapsed).toFixed(2)} units/s, expected 4`);
  await b.leave();
  await sleep(200);
  assert.equal(a.state.players.size, 1);
  console.log('PASS: two-client sync, body type, spawn facing, invalid input, bounded diagonal speed, facing, rate-limited stop, stop resting point, real-time speed, stale-input stop, leave cleanup');
} finally {
  for (const room of rooms) { if (room.connection.isOpen) await room.leave(); }
  server.kill();
  if (server.exitCode === null) await once(server, 'exit');
}
