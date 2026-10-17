import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { Client } from '@colyseus/sdk';
import { BRANCH_WEAPONS, GAME_ROOM, facingFromVector } from '../../../packages/shared/dist/index.js';

// QA-01: real room protocol, two peers, all branches. Test-only server and in-memory database;
// no accounts, persistent player data, live development process or gameplay rules are modified.
const port = 2594;
const server = spawn(process.execPath, [fileURLToPath(new URL('../../server/dist/index.js', import.meta.url))], {
  env: { ...process.env, NODE_ENV: 'development', GAME_SERVER_PORT: String(port), SHAMAN_DB_PATH: ':memory:' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
const exited = once(server, 'exit');
let diagnostics = '';
server.stderr.on('data', chunk => diagnostics += chunk);
const rooms = new Set();
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(check, label) {
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    if (check()) return;
    if (server.exitCode !== null) throw Error(`server exited during ${label}: ${diagnostics}`);
    await sleep(20);
  }
  throw Error(`timeout ${label}: ${diagnostics}`);
}
async function join(client, bodyType) {
  const room = await client.joinOrCreate(GAME_ROOM, { bodyType });
  rooms.add(room);
  const view = { room, profile: null, result: null, replies: 0 };
  room.onMessage('profile', data => { view.profile = data.profile; view.result = data.result; view.replies++; });
  for (const type of ['vitals', 'combat', 'skill', 'cooldown', 'skill:error', 'attack:error']) room.onMessage(type, () => {});
  room.send('profile:get');
  await until(() => view.profile !== null, 'initial profile');
  return view;
}
async function request(view, type, payload = {}) {
  const previous = view.replies;
  view.room.send(type, payload);
  await until(() => view.replies > previous, `${type} reply`);
  return view.result;
}
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error(`server startup timeout: ${diagnostics}`)), 10000);
    const finish = error => { clearTimeout(timer); server.off('error', fail); server.off('exit', fail); error ? reject(error) : resolve(); };
    const fail = () => finish(Error(`server startup failed: ${diagnostics}`));
    server.once('error', fail); server.once('exit', fail);
    server.stdout.on('data', chunk => { if (String(chunk).includes('Shaman server listening')) finish(); });
  });
  const client = new Client(`ws://localhost:${port}`);
  const observer = await join(client, 'female');
  const observerBefore = structuredClone(observer.profile);
  let sequence = 0;
  for (const [branch, weapon] of Object.entries(BRANCH_WEAPONS)) {
    const actor = await join(client, 'male');
    assert.equal(actor.room.roomId, observer.room.roomId, 'peers share the actual room');
    const peer = () => observer.room.state.players.get(actor.room.sessionId);
    assert.equal((await request(actor, 'dev:job')).ok, true);
    assert.equal((await request(actor, 'dev:advance', { branch })).ok, true);
    assert.equal(actor.profile.branch, branch);
    assert.equal(actor.profile.equipment.weapon, weapon);
    assert.equal(actor.profile.stacks.filter(s => s.itemId === weapon).length, 1);
    await until(() => peer()?.look === `weapon:${weapon}` && peer()?.branch === branch, `${branch} job/look patch`);
    assert.equal(peer().bodyType, 'male');
    const silver = actor.profile.silver;
    // Advance tier again: grants must not duplicate the owned branch item.
    await request(actor, 'dev:job');
    assert.equal((await request(actor, 'dev:advance')).ok, true);
    assert.equal(actor.profile.jobTier, 3);
    assert.equal(actor.profile.stacks.filter(s => s.itemId === weapon).length, 1);
    for (const vector of [[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]]) {
      const [x,y] = vector, facing = facingFromVector(x,y);
      actor.room.send('move', {x,y,sequence:++sequence});
      await until(() => peer()?.facing === facing && peer()?.moving, `${branch}/${facing} movement patch`);
      assert.equal(peer().look, `weapon:${weapon}`, 'walking preserves equipment');
      actor.room.send('move', {x:0,y:0,sequence:++sequence});
      await until(() => peer()?.moving === false, `${branch}/${facing} stop patch`);
    }
    const foreign = Object.values(BRANCH_WEAPONS).find(id => id !== weapon);
    assert.equal((await request(actor,'equipment',{slot:'weapon',itemId:foreign})).ok,false,'unowned foreign branch item refused');
    assert.equal(actor.profile.equipment.weapon,weapon);
    for (const itemId of [null, 'staff-bell', weapon, null, weapon]) {
      assert.equal((await request(actor,'equipment',{slot:'weapon',itemId})).ok,true);
      await until(() => peer()?.look === (itemId ? `weapon:${itemId}` : ''), `${branch} equip ${itemId} patch`);
      assert.equal(actor.profile.silver,silver,'swapping does not alter Silver');
      assert.equal(observer.room.state.players.get(observer.room.sessionId)?.look,'weapon:staff-bell','observer equipment remains isolated');
    }
    await request(observer,'profile:get');
    const {hp:beforeHp,sp:beforeSp,...beforeStable}=observerBefore;
    const {hp:afterHp,sp:afterSp,...afterStable}=observer.profile;
    assert.deepEqual(afterStable,beforeStable,'another player cannot alter observer progression/inventory/equipment');
    assert.ok(afterHp>=beforeHp&&afterHp<=observer.profile.hpMax,'observer HP permits ordinary safe-town regeneration');
    assert.ok(afterSp>=beforeSp&&afterSp<=observer.profile.spMax,'observer SP permits ordinary safe-town regeneration');
    await actor.room.leave(); rooms.delete(actor.room);
    await until(() => !peer(), `${branch} actor removed from peer`);
    console.log(`PASS ${branch}: ${weapon}; tier 2/3, eight facings, foreign-item refusal, five swaps, observer isolation, leave cleanup`);
  }
  console.log('PASS QA-01: ten branches on a real server, 80 direction changes, 50 swaps; female observer / male actors. Renderer appearance and visual approval remain separate.');
} finally {
  for (const room of rooms) await room.leave().catch(() => {});
  if (server.exitCode === null) server.kill();
  await exited.catch(() => {});
}
