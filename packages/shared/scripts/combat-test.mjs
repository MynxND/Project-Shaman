// Combat rules, monster AI, quests and the Whispering Spiritwood layout. Run after `pnpm build`.
import assert from 'node:assert/strict';
import {
  createMonster, expToNext, footprintRect, gainExp, getMap, isBlocked, magicDamage, MAPS, MONSTERS, newProfile, physicalDamage,
  pickSpawnPoint, pointInRect, provokeMonster, questEvent, acceptQuest, skillDamage, soulHealAmount, stepMonster,
  UMBRAL_CAPITAL, WHISPERING_SPIRITWOOD as SW, questFor,
} from '../dist/index.js';

// ---- Formulas and levels ----
assert.equal(physicalDamage(10, 3, 0.5), 7);
assert.equal(physicalDamage(1, 50, 0), 1, 'damage is at least 1');
assert.ok(physicalDamage(10, 0, 0) < physicalDamage(10, 0, 1), 'variance roll');
assert.equal(Math.round(skillDamage('spirit-bolt', 1, 14, 'plant')), 16, 'source formula MATK x (1 + Lv x 0.15)');
assert.ok(skillDamage('spirit-bolt', 1, 14, 'undead') > skillDamage('spirit-bolt', 1, 14, 'plant'), 'x1.3 against undead');
assert.equal(skillDamage('amulet-blast', 1, 20, 'plant'), 20 * 1.7);
assert.equal(magicDamage(10, 2, 0.5), 8);
assert.equal(soulHealAmount(1, 14, 40), Math.round(14 * 1.2 + 2));
const p = newProfile({ x: 1, y: 1 });
assert.equal(p.level, 1); assert.equal(p.exp, 0); assert.ok(p.hp < p.hpMax, 'starts a little worn');
assert.equal(gainExp(p, expToNext(1) - 1), 0);
assert.equal(gainExp(p, 1), 1, 'one level');
assert.equal(p.level, 2); assert.equal(p.exp, 0); assert.equal(p.hp, p.hpMax, 'level-up restores HP');
assert.equal(p.skillPoints, 3, 'base levels give no skill points (job levels do)'); assert.equal(p.statusPoints, 3);
assert.equal(gainExp(p, expToNext(2) + expToNext(3) + 5), 2, 'several levels at once');
assert.equal(p.level, 4); assert.equal(p.exp, 5);

// ---- Maps, portals and safe arrival ----
assert.equal(getMap('nope').id, UMBRAL_CAPITAL.id);
for (const map of Object.values(MAPS)) {
  for (const portal of map.portals ?? []) {
    const dest = MAPS[portal.to.mapId];
    assert.ok(dest, `${map.id}/${portal.id} leads to a real map`);
    const back = dest.portals.find((x) => x.id === portal.to.portalId);
    assert.ok(back, `${portal.id} has a partner portal`);
    assert.equal(back.to.mapId, map.id, 'portals pair up both ways');
    assert.ok(!isBlocked(map, portal.arrival.x, portal.arrival.y), `${portal.id} arrival is walkable`);
    assert.ok(!pointInRect(portal.arrival, portal.area), `${portal.id} arrival is outside its trigger (no loop)`);
    const c = { x: portal.area.x + portal.area.w / 2, y: portal.area.y + portal.area.h / 2 };
    assert.ok(!isBlocked(map, c.x, c.y), `${portal.id} trigger can be walked into`);
  }
}

// Walkable flood fill of Spiritwood from the spawn (0.5-unit grid, server collision).
const STEP = 0.5, W = SW.width / STEP, H = SW.height / STEP;
const seen = new Uint8Array(W * H);
const start = [Math.round(SW.spawn.x / STEP), Math.round(SW.spawn.y / STEP)];
const queue = [start]; seen[start[1] * W + start[0]] = 1;
while (queue.length) {
  const [x, y] = queue.pop();
  for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
    if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny * W + nx] || isBlocked(SW, nx * STEP, ny * STEP)) continue;
    seen[ny * W + nx] = 1; queue.push([nx, ny]);
  }
}
const reach = (pt, r = 1.5) => { for (let dy = -r; dy <= r; dy += STEP) for (let dx = -r; dx <= r; dx += STEP) { const x = Math.round((pt.x + dx) / STEP), y = Math.round((pt.y + dy) / STEP); if (seen[y * W + x]) return true; } return false; };
assert.ok(!isBlocked(SW, SW.spawn.x, SW.spawn.y), 'spawn walkable');
assert.ok(SW.safeZones.some((z) => pointInRect(SW.spawn, z)), 'spawn is in the safe village');
for (const npc of SW.npcs) assert.ok(reach(npc, 2.4), `${npc.id} can be approached`);
for (const portal of SW.portals) assert.ok(reach({ x: portal.area.x + portal.area.w / 2, y: portal.area.y + portal.area.h / 2 }, 0.6), 'portal reachable');
for (const l of SW.landmarks) assert.ok(reach(l, 4), `${l.id} reachable`);
let walkable = 0; for (const v of seen) walkable += v;
assert.ok(walkable / (W * H) > 0.6, `most of the forest is walkable (${(walkable / (W * H) * 100).toFixed(0)}%)`);
// No object footprint covers a portal trigger or the arrival point.
for (const o of SW.objects) {
  const r = footprintRect(o);
  if (!r) continue;
  for (const portal of SW.portals) {
    const overlap = r.x < portal.area.x + portal.area.w && portal.area.x < r.x + r.w && r.y < portal.area.y + portal.area.h && portal.area.y < r.y + r.h;
    assert.ok(!overlap, `${o.id} does not cover ${portal.id}`);
  }
}

// ---- Spawn regions ----
let seed = 7; const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
for (const region of SW.spawnRegions) {
  assert.ok(!SW.safeZones.some((z) => region.area.x < z.x + z.w && z.x < region.area.x + region.area.w && region.area.y < z.y + z.h && z.y < region.area.y + region.area.h), `${region.id} is outside safe zones`);
  for (let i = 0; i < 200; i++) {
    const at = pickSpawnPoint(SW, region, rng);
    assert.ok(at, `${region.id} has spawn points`);
    assert.ok(!isBlocked(SW, at.x, at.y) && pointInRect(at, region.area) && reach(at, 0.5), 'spawn points are walkable, reachable and inside the region');
  }
  for (const g of region.monsters) assert.ok(MONSTERS[g.kind], `${g.kind} is defined`);
}

// ---- Monster AI ----
const region = SW.spawnRegions[0];
const home = pickSpawnPoint(SW, region, rng);
const wisp = createMonster('w1', 'leaf-wisp', region, home, 0);
const far = [{ id: 'a', x: home.x + 1, y: home.y, alive: true }];
let t = 0;
for (let i = 0; i < 200; i++) { t += 50; assert.deepEqual(stepMonster(wisp, far, 50, t, SW, rng), [], 'passive monsters never attack first'); }
assert.ok(Math.hypot(wisp.x - home.x, wisp.y - home.y) <= MONSTERS['leaf-wisp'].wander.radius + 0.1, 'wanders near home');
assert.ok(pointInRect(wisp, region.area), 'wanders inside its spawn region');
provokeMonster(wisp, 'a');
const target = [{ id: 'a', x: wisp.x + 1, y: wisp.y, alive: true }];
const events = [];
for (let i = 0; i < 80; i++) { t += 50; events.push(...stepMonster(wisp, target, 50, t, SW, rng)); }
assert.ok(events.some((e) => e.type === 'swing') && events.some((e) => e.type === 'hit' && e.targetId === 'a'), 'provoked wisp swings, then hits');
// Leash: a target far from home makes it give up and walk back, healed.
wisp.hp = 5; wisp.x = home.x + MONSTERS['leaf-wisp'].leash + 1; wisp.state = 'chase';
stepMonster(wisp, target, 50, (t += 50), SW, rng);
assert.equal(wisp.state, 'return');
for (let i = 0; i < 400 && wisp.state === 'return'; i++) stepMonster(wisp, target, 50, (t += 50), SW, rng);
assert.equal(wisp.state, 'idle'); assert.equal(wisp.hp, MONSTERS['leaf-wisp'].hp, 'heals after returning home');
// Dead monsters do nothing; a target standing in a safe zone is dropped.
wisp.state = 'dead';
assert.deepEqual(stepMonster(wisp, target, 50, (t += 50), SW, rng), []);
wisp.state = 'chase'; wisp.targetId = 'a';
stepMonster(wisp, [{ id: 'a', x: SW.spawn.x, y: SW.spawn.y, alive: true }], 50, (t += 50), SW, rng);
assert.equal(wisp.state, 'return', 'never follows into the safe village');

// ---- Kill quest ----
let q = acceptQuest(newProfile(SW.spawn), 'sw-first-hunt').profile;
for (let i = 1; i <= 3; i++) { const r = questEvent(q, { kind: 'kill', monster: 'leaf-wisp' }, 0); assert.ok(r.ok); q = r.profile; }
assert.equal(q.quests['sw-first-hunt'].step, 1, 'three wisps complete the hunt step');
assert.equal(questEvent(q, { kind: 'kill', monster: 'other' }, 0), null);
const done = questEvent(q, { kind: 'talk', npc: 'sw-hunter' }, 0);
assert.ok(done.profile.quests['sw-first-hunt'].done); assert.equal(done.profile.level, 2, 'quest EXP levels up'); assert.equal(done.profile.exp, 40 - expToNext(1), 'quest EXP reward');
// Visit steps are per map: Umbral coordinates never complete in Spiritwood.
let fs = acceptQuest(newProfile(UMBRAL_CAPITAL.spawn), 'first-steps').profile;
assert.equal(questEvent(fs, { kind: 'visit', at: { x: 23.6, y: 18.2 }, mapId: SW.id }, 0), null);
assert.ok(questEvent(fs, { kind: 'visit', at: { x: 23.6, y: 18.2 }, mapId: UMBRAL_CAPITAL.id }, 0));

// ---- Aggressive monsters, roster, quest chain ----
for (const [kind, def] of Object.entries(MONSTERS)) {
  assert.equal(def.kind, kind); assert.ok(def.hp > 0 && def.exp > 0 && def.attackWindupMs < def.attackDelayMs, `${kind} is sane`);
  if (def.boss) assert.ok(MONSTERS[def.boss.summon.kind], 'boss summons a real monster');
}
const strawRegion = SW.spawnRegions.find((r) => r.id === 'west-strawlings');
const sHome = pickSpawnPoint(SW, strawRegion, rng);
const straw = createMonster('s1', 'cursed-strawling', strawRegion, sHome, 0);
stepMonster(straw, [{ id: 'b', x: sHome.x + 2, y: sHome.y, alive: true }], 50, 50, SW, rng);
assert.equal(straw.state, 'chase', 'aggressive monsters engage within detection range');
const straw2 = createMonster('s2', 'cursed-strawling', strawRegion, sHome, 0);
stepMonster(straw2, [{ id: 'b', x: sHome.x + 9, y: sHome.y, alive: true }], 50, 50, SW, rng);
assert.notEqual(straw2.state, 'chase', 'but not from far away');
const summoned = createMonster('w9', 'leaf-wisp', region, home, 0); summoned.aggressive = true;
stepMonster(summoned, [{ id: 'c', x: home.x + 0.5, y: home.y, alive: true }], 50, 50, SW, rng);
assert.equal(summoned.state, 'chase', 'summoned minions are aggressive');
let chain = newProfile(SW.spawn);
assert.equal(questFor(chain, 'sw-hunter').id, 'sw-first-hunt');
assert.equal(acceptQuest(chain, 'sw-cursed-straw').ok, false, 'chain quests need their prerequisite');
for (const id of ['sw-first-hunt', 'sw-cursed-straw', 'sw-spirit-disturbance', 'sw-abandoned-shrine', 'sw-root-of-curse']) {
  assert.equal(questFor(chain, 'sw-hunter').id, id, `hunter offers ${id} next`);
  chain = acceptQuest(chain, id).profile;
  chain.quests[id] = { step: 99, done: true };
}
assert.ok(chain.quests['sw-root-of-curse'].done);
console.log('combat: formulas, level-ups, portals pair up with safe arrivals, Spiritwood reachability, spawn regions, monster AI (passive, provoke, hit, leash, safe zone), kill quests passed');
