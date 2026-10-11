// Rune Seer effects in the server CombatSystem with a fake host (game integration slice 2): Rune Cast queue, rune
// effects (ice freeze ×2, storm knockback/area, fate crit + SP refund, hearth shield), Runestone echo, Cast the Lots
// reorder, Rune Mastery, Frost Bolt, Blizzard, the blocking breakable Ice Wall, Shatter Rune, Absolute Zero,
// Fimbulwinter, Chilling Aura and cast rules. Run after `pnpm build`.
import assert from 'node:assert/strict';
import { GameState, PlayerState } from '../../../packages/schema/dist/index.js';
import {
  advanceJob, castRule, iceWallCells, isBlocked, newProfile, RUNE_SEER, skillCastError, stepMovement, WHISPERING_SPIRITWOOD as SW,
} from '../../../packages/shared/dist/index.js';
import { CombatSystem } from '../../server/dist/rooms/combat-system.js';

let now = 1000, seed = 11;
const state = new GameState();
const profiles = new Map();
const events = [];
const host = {
  map: SW, state, now: () => now, rng: () => (seed = (seed * 16807) % 2147483647) / 2147483647,
  profile: (id) => profiles.get(id), setProfile: (id, p) => profiles.set(id, p), vitals: () => {}, broadcast: (e) => events.push(e),
  reduceCooldown: () => {},
};
const combat = new CombatSystem(host);
const rs = combat.runeSeer;
const run = (ms) => { for (let t = 0; t < ms; t += 50) { now += 50; combat.step(50); } };
const has = (m, s) => (m.statuses[s] ?? 0) > now;

let prof = newProfile(SW.spawn);
prof.level = 40; prof.hp = prof.hpMax = 5000; prof.sp = 100; prof.spMax = 999;
prof.jobLevel = 10; prof.quests['job-apprentice-trial'] = { step: 2, done: true };
prof = advanceJob(prof, 'rune-seer').profile;
assert.equal(prof.branch, 'rune-seer');
Object.assign(prof.skills, { 'frost-bolt': 5, 'blizzard-storm': 5, 'ice-wall': 3, 'rune-trap': 3, prophecy: 4, 'rune-reading': 2, 'chilling-aura': 5, 'winters-grasp': 2 });
profiles.set('seer', prof);
const me = new PlayerState(); me.x = SW.spawn.x; me.y = SW.spawn.y; state.players.set('seer', me);

// Cast rules: Rune Reading shortens ground spells, Rune Mastery cools water spells; other Norway spells are castable now.
assert.equal(castRule('blizzard-storm', { 'rune-reading': 5 }).castMs, Math.round(2500 * 0.8));
assert.equal(castRule('frost-bolt', { 'rune-mastery': 5 }).cooldownMs, Math.round(1500 * 0.7));
assert.equal(skillCastError(prof, 'frost-bolt', 0, { casting: false, moving: false }, {}), null);

// Queue: 3 visible (4 with Rune Reading), synced.
run(100);
assert.equal(me.runes.split(',').length, 4, 'Rune Reading shows 4 runes');
const queue = () => rs.seer('seer').queue;

const prey = () => {
  const pool = () => [...combat.monsters.values()].filter((x) => x.state !== 'dead' && x.kind !== 'cursed-rootkeeper' && !x.summoned);
  if (!pool().some((x) => !x.used)) for (const x of pool()) x.used = false;
  const m = pool().find((x) => !x.used);
  m.used = true; m.hp = 1e6; m.statuses = {}; m.state = 'idle';
  return m;
};
const place = (m, dx = 5) => { me.x = m.x - dx; me.y = m.y; };

// Frost Bolt consumes the front rune and the queue refills.
let m = prey(); place(m);
const front = queue()[0], second = queue()[1];
events.length = 0;
combat.releaseSkill('seer', 'frost-bolt', m.id, m); run(300);
assert.equal(queue()[0], second, 'front rune consumed');
assert.equal(queue().length, RUNE_SEER.queueLength, 'queue refilled');
assert.ok(events.some((e) => e.type === 'skillfx' && e.skillId === 'rune-cast' && e.variant === front), 'rune flare event');
assert.ok(events.some((e) => e.type === 'damage' && e.skill === 'frost-bolt'), 'frost bolt damage');

// Each rune effect, forced at the front.
const cast = (rune, skill = 'frost-bolt') => { rs.seer('seer').queue[0] = rune; const t = prey(); place(t); events.length = 0; combat.releaseSkill('seer', skill, t.id, t); run(300); return t; };
// storm: knockback 2.
{ const t = prey(); place(t); const x0 = t.x; rs.seer('seer').queue[0] = 'storm'; combat.releaseSkill('seer', 'frost-bolt', t.id, t); run(300); assert.ok(t.x > x0 + 1.5, `storm knocks back (${x0.toFixed(1)} → ${t.x.toFixed(1)})`); }
// fate: refund 20% SP of the cost.
{ const q = structuredClone(profiles.get('seer')); q.sp = 50; profiles.set('seer', q); cast('fate'); assert.ok(profiles.get('seer').sp > 50, 'fate refunds SP'); }
// hearth: shield 5% max HP absorbs a hit.
{
  cast('hearth'); run(60);
  assert.ok(me.statuses.includes('hearth-shield'), 'hearth shield synced');
  assert.equal(rs.absorb('seer', 100), 0, 'shield absorbs the hit');
}
// ice: double freeze chance — over many casts freezes happen.
{ let frozen = 0; for (let i = 0; i < 40; i++) { const t = cast('ice'); if (has(t, 'freeze')) frozen++; } assert.ok(frozen >= 2, `ice rune freezes sometimes (${frozen}/40)`); }

// Runestone echo: a hearth rune cast next to the stone gives a double shield.
combat.releaseSkill('seer', 'rune-trap', null, { x: me.x, y: me.y });
assert.ok([...state.zones.values()].some((z) => z.kind === 'runestone'), 'runestone synced');
rs.seer('seer').shield = 0;
{ const st = [...state.zones.values()].find((z) => z.kind === 'runestone'); rs.seer('seer').queue[0] = 'hearth'; const t = prey(); t.x = st.x + 1; t.y = st.y; me.x = st.x; me.y = st.y; combat.releaseSkill('seer', 'frost-bolt', t.id, t); run(300);
  assert.equal(rs.seer('seer').shield, Math.round(profiles.get('seer').hpMax * RUNE_SEER.hearthShield * 2), 'runestone echoes the rune (double shield)'); }

// Cast the Lots: redraw, reorder within the window, +bonus for 3 spells.
combat.releaseSkill('seer', 'prophecy', null, me); run(60);
assert.ok(me.statuses.includes('cast-the-lots'));
const before = queue().slice(0, 3);
assert.ok(rs.order('seer', [2, 0, 1]));
assert.deepEqual(queue().slice(0, 3), [before[2], before[0], before[1]], 'reordered');
assert.equal(rs.order('seer', [0, 0, 1]), false, 'not a permutation');
run(RUNE_SEER.lotsMs + 100);
assert.equal(rs.order('seer', [1, 0, 2]), false, 'window closed');

// Rune Mastery: change the front rune once per 10 s.
assert.equal(rs.setFront('seer', 'ice'), false, 'needs Rune Mastery');
profiles.get('seer').skills['rune-mastery'] = 1;
assert.ok(rs.setFront('seer', 'fate')); assert.equal(queue()[0], 'fate');
assert.equal(rs.setFront('seer', 'ice'), false, 'once per 10 s');

// Blizzard: zone ticks, slows; storm rune widens it.
{
  const t = prey(); place(t, 3); rs.seer('seer').queue[0] = 'storm'; events.length = 0;
  combat.releaseSkill('seer', 'blizzard-storm', null, { x: t.x, y: t.y });
  const z = [...state.zones.values()].find((z) => z.kind === 'blizzard');
  assert.equal(z.radius, RUNE_SEER.blizzardCells / 2 + 1, 'storm rune adds a cell');
  run(2000);
  assert.ok(events.filter((e) => e.type === 'damage' && e.skill === 'blizzard-storm' && e.target.id === t.id).length >= 3, 'blizzard ticks');
  assert.ok(has(t, 'slow'), 'blizzard slows');
  run(4000);
  assert.ok(![...state.zones.values()].some((z) => z.kind === 'blizzard'), 'blizzard ends');
}

// Ice Wall: 3 + Lv cells perpendicular to the cast, blocks walking, synced HP, melts after 15 s, breaks under attacks.
{
  me.x = SW.spawn.x; me.y = SW.spawn.y;
  const aim = { x: me.x + 3, y: me.y };
  assert.equal(iceWallCells(me, aim, 3).length, 6);
  combat.releaseSkill('seer', 'ice-wall', null, aim);
  const segs = [...state.zones.values()].filter((z) => z.kind === 'ice-wall');
  assert.ok(segs.length >= 4 && segs[0].hp === 9000, `wall cells synced with HP (${segs.length})`);
  assert.ok(segs.every((z) => isBlocked(combat.walkMap, z.x, z.y)), 'wall cells block');
  // Walking east into the wall stops at it.
  const mid = segs.reduce((a, z) => (Math.abs(z.y - me.y) < Math.abs(a.y - me.y) ? z : a));
  let p = { x: me.x, y: mid.y };
  for (let i = 0; i < 60; i++) p = stepMovement(p, { x: 1, y: 0, sequence: i }, 0.05, combat.walkMap).position;
  assert.ok(p.x < mid.x - 0.4, `walking stops at the wall (${p.x.toFixed(2)} < ${mid.x.toFixed(2)})`);
  run(15100);
  assert.ok(![...state.zones.values()].some((z) => z.kind === 'ice-wall'), 'wall melts');
  assert.equal(isBlocked(combat.walkMap, mid.x, mid.y), isBlocked(SW, mid.x, mid.y), 'walk map restored');
  // A monster pressed against a wall cracks it.
  combat.releaseSkill('seer', 'ice-wall', null, aim);
  const t = prey(); t.x = mid.x + 0.9; t.y = mid.y; t.state = 'chase'; t.targetId = 'seer';
  const hp0 = [...state.zones.values()].find((z) => z.kind === 'ice-wall').hp;
  run(3000);
  const hp1 = [...state.zones.values()].find((z) => z.kind === 'ice-wall')?.hp ?? 0;
  assert.ok(hp1 < hp0, `monsters crack the wall (${hp0} → ${hp1})`);
}

// Tier 3: Shatter consumes the visible queue, Absolute Zero freezes (bosses too), Fimbulwinter draws only ice.
Object.assign(profiles.get('seer').skills, { 'shatter-rune': 1, 'absolute-zero-field': 1, fimbulwinter: 1 });
{
  const t = prey(); place(t); const q0 = queue().slice(); events.length = 0;
  combat.releaseSkill('seer', 'shatter-rune', t.id, t); run(400);
  assert.equal(events.filter((e) => e.type === 'skillfx' && e.skillId === 'rune-cast').length, 4, 'shatter eats the visible queue');
  assert.notDeepEqual(queue(), q0);
  const boss = [...combat.monsters.values()].find((x) => x.kind === 'cursed-rootkeeper');
  combat.releaseSkill('seer', 'absolute-zero-field', boss.id, boss);
  assert.ok(has(boss, 'freeze'), 'absolute zero freezes a boss');
  const f = prey(); place(f, 4); events.length = 0;
  combat.releaseSkill('seer', 'fimbulwinter', null, me); run(3100);
  assert.ok(events.filter((e) => e.type === 'damage' && e.skill === 'fimbulwinter').length >= 3, 'fimbulwinter ticks');
  for (let i = 0; i < 4; i++) { const t2 = prey(); place(t2); combat.releaseSkill('seer', 'frost-bolt', t2.id, t2); run(250); }
  assert.ok(queue().slice(-2).every((r) => r === 'ice'), 'runes drawn during Fimbulwinter are ice');
}

// Chilling Aura slows nearby monsters' attacks.
{ const t = prey(); place(t, 2); run(100); assert.ok(t.attackDelayMul > 1.1, 'chilling aura'); }

state.players.delete('seer'); combat.forget('seer'); run(100);
assert.equal([...state.zones.values()].filter((z) => z.owner === 'seer').length, 0, 'zones and walls cleared on leave');
console.log('rune seer combat: rune queue + 4 rune effects, runestone, cast the lots, rune mastery, frost bolt, blizzard, ice wall (block/melt/break), shatter, absolute zero, fimbulwinter, chilling aura passed');
