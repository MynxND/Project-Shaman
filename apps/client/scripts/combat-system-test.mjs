// Server CombatSystem with a fake room host and a controllable clock: ranged projectiles (with dodging), the
// Rootkeeper's telegraphed slam and summons, minions that never respawn, and regular respawns. Run after `pnpm build`.
import assert from 'node:assert/strict';
import { GameState, PlayerState } from '../../../packages/schema/dist/index.js';
import { MONSTERS, newProfile, WHISPERING_SPIRITWOOD as SW } from '../../../packages/shared/dist/index.js';
import { CombatSystem } from '../../server/dist/rooms/combat-system.js';

let now = 1000, seed = 3;
const state = new GameState();
const profiles = new Map();
const events = [];
const host = {
  map: SW, state, now: () => now, rng: () => (seed = (seed * 16807) % 2147483647) / 2147483647,
  profile: (id) => profiles.get(id), setProfile: (id, p) => profiles.set(id, p), vitals: () => {}, broadcast: (e) => events.push(e),
};
const combat = new CombatSystem(host);
const counts = {};
for (const m of combat.monsters.values()) counts[m.kind] = (counts[m.kind] ?? 0) + 1;
const expected = {};
for (const region of SW.spawnRegions) for (const g of region.monsters) expected[g.kind] = (expected[g.kind] ?? 0) + g.count;
assert.deepEqual(counts, expected, 'every spawn region is fully populated');
assert.equal(counts['cursed-rootkeeper'], 1); assert.equal(counts['spirit-flame'], 4); assert.equal(counts['clay-guardian'], 3);

const addPlayer = (id, x, y, level = 10) => {
  const p = new PlayerState(); p.x = x; p.y = y; state.players.set(id, p);
  const prof = newProfile(SW.spawn); prof.level = level; prof.hp = prof.hpMax = 2000; profiles.set(id, prof);
  return p;
};
const run = (ms) => { for (let t = 0; t < ms; t += 50) { now += 50; combat.step(50); } };

// Ranged: a spirit flame shoots a projectile; damage lands after the flight.
const flame = [...combat.monsters.values()].find((m) => m.kind === 'spirit-flame');
const archer = addPlayer('archer', flame.x + 4, flame.y);
flame.state = 'chase'; flame.targetId = 'archer';
run(4000);
const shot = events.find((e) => e.type === 'projectile' && e.from === flame.id);
assert.ok(shot && shot.flightMs > 300, 'flame shoots a projectile from range');
assert.ok(events.some((e) => e.type === 'damage' && e.target.id === 'archer' && e.source === flame.id), 'projectile hits a standing player');
assert.ok(Math.hypot(flame.x - archer.x, flame.y - archer.y) > 3, 'ranged monster keeps its distance');
// Dodging: move away right after the shot is fired.
// Let earlier shots land, then wait for a fresh one and step out of its aimed spot.
run(2000);
events.length = 0;
for (let i = 0; i < 200 && !events.some((e) => e.type === 'projectile'); i++) { now += 50; combat.step(50); }
const fresh = events.find((e) => e.type === 'projectile');
archer.y += 2.5;
const before = profiles.get('archer').hp;
run(fresh.flightMs + 100);
assert.equal(profiles.get('archer').hp, before, 'walking out of the aimed spot dodges the shot');
state.players.delete('archer'); combat.forget('archer');

// Boss: telegraph, then slam damage inside the radius; summons once wounded.
const boss = [...combat.monsters.values()].find((m) => m.kind === 'cursed-rootkeeper');
const hero = addPlayer('hero', boss.x, boss.y + 1.5);
boss.state = 'chase'; boss.targetId = 'hero';
events.length = 0;
run(6000);
const tele = events.find((e) => e.type === 'telegraph' && e.source === boss.id);
assert.ok(tele && tele.radius === MONSTERS['cursed-rootkeeper'].boss.slam.radius, 'boss telegraphs its slam');
assert.ok(events.some((e) => e.type === 'damage' && e.target.id === 'hero' && e.amount === MONSTERS['cursed-rootkeeper'].boss.slam.damage), 'slam hits a player inside the warning');
assert.ok(!events.some((e) => e.type === 'summon'), 'no summons at full health');
boss.hp = Math.floor(MONSTERS['cursed-rootkeeper'].hp * 0.5);
run(300);
const summon = events.find((e) => e.type === 'summon');
assert.ok(summon && summon.ids.length >= 1, 'wounded boss summons minions');
const add = combat.monsters.get(summon.ids[0]);
assert.ok(add.summoned && add.aggressive && state.monsters.get(add.id), 'minion is synced, aggressive and marked summoned');
// Killing a minion removes it for good.
add.hp = 1;
combat.requestAttack('hero', add.id, { x: add.x, y: add.y });
state.players.get('hero').x = add.x + 0.5; state.players.get('hero').y = add.y;
run(4000);
assert.equal(combat.monsters.has(add.id), false, 'killed minion is removed');
assert.equal(state.monsters.has(add.id), false, 'and leaves the synced state');
run(30000);
assert.equal(combat.monsters.has(add.id), false, 'minions never respawn');
console.log('combat system: projectiles and dodging, boss telegraph + slam, summons when wounded, minions removed and never respawn passed');
