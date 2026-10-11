import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Client } from '@colyseus/sdk';
import { GAME_ROOM, expToNext } from '../../../packages/shared/dist/index.js';

// Live server: southern gate portal -> Whispering Spiritwood with the profile kept, no bounce-back, hunting Leaf Wisps
// (basic attack + Spirit Bolt), EXP and a level-up, monster respawn, and the return portal.
const PORT = '2583';
const server = spawn(process.execPath, [fileURLToPath(new URL('../../server/dist/index.js', import.meta.url))], { env: { ...process.env, GAME_SERVER_PORT: PORT }, stdio: ['ignore', 'pipe', 'pipe'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rooms = []; let errors = ''; server.stderr.on('data', (d) => errors += d);
const waitFor = async (check, label, ms = 8000) => { const t = Date.now(); while (Date.now() - t < ms) { const v = check(); if (v) return v; await sleep(25); } throw new Error('timeout: ' + label); };

function watch(room) {
  const s = { profile: null, vitals: null, combat: [], travel: null, errors: [] };
  room.onMessage('profile', (d) => { s.profile = d.profile; });
  room.onMessage('vitals', (v) => { s.vitals = v; });
  room.onMessage('combat', (e) => s.combat.push(e));
  room.onMessage('travel', (d) => { s.travel = d; });
  room.onMessage('attack:error', (e) => s.errors.push(e.error));
  room.onMessage('skill:error', (e) => s.errors.push(e.error));
  room.onMessage('skill', () => {});
  return s;
}
let sequence = 0;
async function walkTo(room, x, y, stopEarly = () => false) {
  const t = Date.now();
  while (Date.now() - t < 20000) {
    const me = room.state.players.get(room.sessionId);
    if (!me) { await sleep(50); continue; }
    if (stopEarly()) break;
    const dx = x - me.x, dy = y - me.y;
    if (Math.hypot(dx, dy) < 0.3) break;
    room.send('move', { x: Math.abs(dx) > 0.15 ? Math.sign(dx) : 0, y: Math.abs(dy) > 0.15 ? Math.sign(dy) : 0, sequence: ++sequence });
    await sleep(50);
  }
  room.send('move', { x: 0, y: 0, sequence: ++sequence });
  await sleep(120);
  const me = room.state.players.get(room.sessionId);
  return me;
}
const near = (room, kind) => {
  const me = room.state.players.get(room.sessionId);
  let best = null;
  room.state.monsters.forEach((m, id) => { if (m.kind === kind && m.state !== 'dead') { const d = Math.hypot(m.x - me.x, m.y - me.y); if (!best || d < best.d) best = { id, m, d }; } });
  return best;
};

try {
  await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('server startup timeout ' + errors)), 10000); server.stdout.on('data', (d) => { if (d.toString().includes('listening')) { clearTimeout(timer); resolve(); } }); server.once('error', reject); });
  const client = new Client(`ws://localhost:${PORT}`);
  const city = await client.joinOrCreate(GAME_ROOM, { mapId: 'umbral-capital', bodyType: 'female' }); rooms.push(city);
  const cs = watch(city);
  city.send('profile:get');
  await waitFor(() => cs.profile, 'city profile');
  const before = structuredClone(cs.profile);
  assert.equal(city.state.mapId, 'umbral-capital');
  assert.equal(city.state.monsters.size, 0, 'no monsters in the city');

  // South gate portal.
  await walkTo(city, 40, 57.8);
  await walkTo(city, 40, 59.3, () => cs.travel);
  const travel = await waitFor(() => cs.travel, 'travel from the south gate');
  assert.equal(travel.mapId, 'whispering-spiritwood');
  const forest = await client.joinOrCreate(GAME_ROOM, { mapId: travel.mapId, ticket: travel.ticket }); rooms.push(forest);
  await city.leave(); rooms.splice(rooms.indexOf(city), 1);
  const fsw = watch(forest);
  forest.send('profile:get');
  await waitFor(() => fsw.profile && forest.state.players.get(forest.sessionId), 'forest join');
  assert.equal(forest.state.mapId, 'whispering-spiritwood');
  const arrived = forest.state.players.get(forest.sessionId);
  assert.ok(Math.hypot(arrived.x - 40, arrived.y - 58.6) < 0.01, 'arrives at the village portal arrival point');
  assert.equal(arrived.bodyType, 'female', 'body type travels');
  assert.equal(fsw.profile.silver, before.silver); assert.equal(fsw.profile.stacks.length, before.stacks.length);
  assert.deepEqual(fsw.profile.skills, before.skills, 'profile (bag, skills) travels with the player');
  await waitFor(() => forest.state.monsters.size >= 7, 'monsters spawned');
  // A ticket works once.
  const replay = await client.joinOrCreate(GAME_ROOM, { mapId: travel.mapId, ticket: travel.ticket }); rooms.push(replay);
  await sleep(300);
  const rp = replay.state.players.get(replay.sessionId);
  assert.ok(Math.hypot(rp.x - 40, rp.y - 57.6) < 0.01, 'reused ticket gets a fresh spawn, not the arrival');
  await replay.leave(); rooms.splice(rooms.indexOf(replay), 1);
  await sleep(1000);
  assert.equal(fsw.travel, null, 'no teleport loop on arrival');

  // Hunt: walk to the training forest.
  for (const [x, y] of [[40, 50], [40.6, 44], [33, 42.4], [26, 40.2], [19, 37.6]]) await walkTo(forest, x, y);
  forest.state.monsters.forEach((m) => m.kind === 'leaf-wisp' && (m.state === 'idle' || m.state === 'wander') && assert.ok(m.x >= 7.9 && m.x <= 25.1 && m.y >= 28.9 && m.y <= 42.1, 'wisps stay in their region'));
  let kills = 0, sawSkillDamage = false;
  const killOne = async (useBolt) => {
    const target = await waitFor(() => near(forest, 'leaf-wisp'), 'a living wisp', 15000);
    if (useBolt) {
      if (target.d > 8) await walkTo(forest, target.m.x + 3, target.m.y, () => (near(forest, 'leaf-wisp')?.d ?? 99) < 7);
      const t2 = near(forest, 'leaf-wisp');
      forest.send('skill', { skillId: 'spirit-bolt', targetId: t2.id });
      await waitFor(() => fsw.combat.some((e) => e.type === 'damage' && e.skill === 'spirit-bolt' && e.target.id === t2.id), 'spirit bolt damage', 5000);
      sawSkillDamage = true;
    }
    const goal = near(forest, 'leaf-wisp');
    await walkTo(forest, goal.m.x - 1.0, goal.m.y, () => (near(forest, 'leaf-wisp')?.d ?? 99) < 1.4);
    const t = near(forest, 'leaf-wisp');
    forest.send('attack', { monsterId: t.id });
    const died = await waitFor(() => fsw.combat.find((e) => e.type === 'death' && e.target.kind === 'monster' && e.target.id === t.id), 'wisp dies', 15000);
    assert.equal(died.killer, forest.sessionId);
    await waitFor(() => forest.state.monsters.get(t.id).state === 'dead', 'dead state synced', 1000);
    kills += 1;
    return t.id;
  };
  const firstKill = await killOne(true);
  assert.ok(sawSkillDamage, 'skills deal damage');
  assert.ok(fsw.combat.some((e) => e.type === 'damage' && e.target.kind === 'monster' && !e.skill), 'basic attacks deal damage');
  assert.ok(fsw.combat.some((e) => e.type === 'swing' && e.attacker.kind === 'monster'), 'provoked wisp fights back');
  await waitFor(() => fsw.profile.exp > 0 || fsw.profile.level > 1, 'EXP awarded');
  while (kills < 3) await killOne(false);
  await waitFor(() => fsw.combat.some((e) => e.type === 'levelup' && e.player === forest.sessionId), 'level up');
  await waitFor(() => fsw.profile.level >= 2, 'profile level 2');
  assert.ok(fsw.profile.exp < expToNext(fsw.profile.level));
  // Respawn after the region's timer (9 s).
  await waitFor(() => forest.state.monsters.get(firstKill).state !== 'dead', 'respawn', 15000);

  // Return portal.
  for (const [x, y] of [[26, 40.2], [33, 42.4], [40.6, 44], [40, 52], [40, 61.4]]) await walkTo(forest, x, y);
  await walkTo(forest, 40, 63.0, () => fsw.travel);
  const back = await waitFor(() => fsw.travel, 'travel home');
  assert.equal(back.mapId, 'umbral-capital');
  const home = await client.joinOrCreate(GAME_ROOM, { mapId: back.mapId, ticket: back.ticket }); rooms.push(home);
  const hs = watch(home); home.send('profile:get');
  await waitFor(() => hs.profile, 'home profile');
  const me = home.state.players.get(home.sessionId);
  assert.ok(Math.hypot(me.x - 40, me.y - 55.6) < 0.01, 'arrives inside the city gate');
  assert.ok(hs.profile.level >= 2, 'level comes home');
  console.log(`PASS: south gate portal, profile travel, single-use tickets, no loop, spawn regions, basic + skill damage, monster counter-attack, ${kills} kills, EXP and level ${hs.profile.level}, respawn, return portal`);
} finally {
  for (const r of rooms) await r.leave().catch(() => {});
  server.kill();
}
