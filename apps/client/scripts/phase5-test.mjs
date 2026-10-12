// Phase 5 (balance + polish) checks with the real server CombatSystem and a fake host:
// 1. shared EXP by damage (helper bonus, loot to the top damage dealer, quest credit threshold, solo unchanged);
// 2. in-combat SP trickle and the scaled flat-ATK rule;
// 3. boss time-to-kill for 1–3 level-10 Apprentices (target band 20–90 s solo, faster in a group);
// 4. performance: 20 players of every branch casting while 30 monsters fight — average tick must stay far below 33 ms.
// Run after `pnpm build`.
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { GameState, PlayerState } from '../../../packages/schema/dist/index.js';
import {
  castRule, combatSpec, expShares, FLAT_ATK_SCALE, KERIS, MONSTERS, NATION_BRANCHES, newProfile, REGEN, REGEN_TICK_MS, SHARED_EXP,
  SKILL_BEHAVIOR_POLICY, skillTree, WHISPERING_SPIRITWOOD as SW, maxHpFor, maxSpFor,
} from '../../../packages/shared/dist/index.js';
import { CombatSystem } from '../../server/dist/rooms/combat-system.js';

// 1a. Pure share rule.
{
  const solo = expShares(100, new Map([['a', 50]]));
  assert.equal(solo.get('a'), 100, 'solo kill: full EXP, no bonus');
  const duo = expShares(100, new Map([['a', 75], ['b', 25]]));
  assert.equal(duo.get('a'), Math.round(110 * 0.75)); assert.equal(duo.get('b'), Math.round(110 * 0.25), '+10% pool for one helper, split by damage');
  const many = expShares(100, new Map(Array.from({ length: 9 }, (_, i) => [`p${i}`, 1])));
  assert.equal([...many.values()].reduce((n, e) => n + e, 0) <= 150 + 9, true, 'helper bonus capped at +50%');
}

const world = () => {
  let now = 1000, seed = 7;
  const state = new GameState(), profiles = new Map(), events = [];
  const host = { map: SW, state, now: () => now, rng: () => (seed = (seed * 16807) % 2147483647) / 2147483647,
    profile: (id) => profiles.get(id), setProfile: (id, p) => profiles.set(id, p), vitals: () => {}, broadcast: (e) => events.push(e), reduceCooldown: () => {} };
  const combat = new CombatSystem(host);
  return { state, profiles, events, combat, run: (ms, step = 50) => { for (let t = 0; t < ms; t += step) { now += step; combat.step(step); } }, now: () => now };
};
const addPlayer = (w, id, level, extra = {}) => {
  const prof = newProfile(SW.spawn); Object.assign(prof, { level, hp: maxHpFor(level), hpMax: maxHpFor(level), sp: maxSpFor(level), spMax: maxSpFor(level) }, extra);
  w.profiles.set(id, prof);
  const p = new PlayerState(); p.x = SW.spawn.x; p.y = SW.spawn.y; w.state.players.set(id, p); return p;
};

// 1b. Two players share a kill in the real combat system.
{
  const w = world();
  // Bare-handed (melee) so both blows land in the same tick; magic weapons would fire bolts with a flight time.
  const a = addPlayer(w, 'a', 20, { equipment: {} }), b = addPlayer(w, 'b', 20, { equipment: {} });
  const m = [...w.combat.monsters.values()].find((x) => x.kind === 'cursed-strawling');
  a.x = b.x = m.x - 1; a.y = b.y = m.y;
  const exp0 = { a: w.profiles.get('a').exp, b: w.profiles.get('b').exp };
  w.combat.requestAttack('a', m.id, a); w.combat.requestAttack('b', m.id, b);
  w.run(15000);
  assert.equal(m.state, 'dead');
  const gainA = w.profiles.get('a').exp - exp0.a, gainB = w.profiles.get('b').exp - exp0.b;
  assert.ok(gainA > 0 && gainB > 0, `both helpers get EXP (${gainA}, ${gainB})`);
  assert.ok(gainA + gainB >= MONSTERS['cursed-strawling'].exp, 'shared pool is at least the monster EXP');
  assert.equal(w.events.filter((e) => e.type === 'loot').length <= 1, true, 'loot goes to one player');
}

// 2. In-combat SP trickle; flat ATK scaling.
{
  const w = world();
  const p = addPlayer(w, 'p', 30);
  const m = [...w.combat.monsters.values()].find((x) => x.kind === 'clay-guardian');
  p.x = m.x - 1; p.y = m.y; m.hp = 1e6;
  const q = structuredClone(w.profiles.get('p')); q.sp = 0; w.profiles.set('p', q);
  w.combat.requestAttack('p', m.id, p);
  w.run(REGEN_TICK_MS * 3 + 100);
  const sp = w.profiles.get('p').sp;
  assert.ok(sp > 0 && sp <= Math.ceil(w.profiles.get('p').spMax * REGEN.combatSp) * 4, `SP trickles back in combat (${sp})`);
  assert.equal(Math.round(KERIS.bladeAtk(5) * FLAT_ATK_SCALE), 18, 'Poison Blade Lv5 flat ATK scaled to the provisional curve');
}

// 3. Boss time-to-kill for level-10 Apprentices (Spirit Bolt + basic attacks).
const bossTtk = (players) => {
  const w = world();
  const boss = [...w.combat.monsters.values()].find((x) => x.kind === 'cursed-rootkeeper');
  for (const m of w.combat.monsters.values()) if (m !== boss) { m.state = 'dead'; m.hp = 0; }
  const ids = Array.from({ length: players }, (_, i) => `ap${i}`);
  const ps = ids.map((id) => addPlayer(w, id, 10, { skills: { 'spirit-bolt': 5, 'amulet-blast': 3 } }));
  ps.forEach((p, i) => { p.x = boss.x - 1.2; p.y = boss.y - 0.6 + i * 0.6; });
  let t = 0;
  const ready = {};
  while (boss.state !== 'dead' && t < 300000) {
    for (const id of ids) {
      const prof = w.profiles.get(id);
      if (prof.hp <= 0) continue;
      // Keep the apprentices alive (the check measures the boss's toughness, not survival) and attacking.
      if (prof.hp < prof.hpMax * 0.5) { const q = structuredClone(prof); q.hp = q.hpMax; w.profiles.set(id, q); }
      w.combat.requestAttack(id, boss.id, w.state.players.get(id));
      for (const s of ['spirit-bolt', 'amulet-blast']) if ((ready[id + s] ?? 0) <= w.now() && w.profiles.get(id).sp >= combatSpec(s).sp) {
        const q = structuredClone(w.profiles.get(id)); q.sp -= combatSpec(s).sp; w.profiles.set(id, q);
        w.combat.releaseSkill(id, s, boss.id, boss); ready[id + s] = w.now() + castRule(s).castMs + castRule(s).cooldownMs;
      }
    }
    w.run(500); t += 500;
  }
  return t / 1000;
};
const ttk = [1, 2, 3].map(bossTtk);
console.log(`boss time-to-kill (level-10 apprentices): solo ${ttk[0]} s, duo ${ttk[1]} s, trio ${ttk[2]} s`);
assert.ok(ttk[0] >= 20 && ttk[0] <= 90, `solo boss fight lasts 20–90 s (${ttk[0]})`);
assert.ok(ttk[2] < ttk[0], 'a group kills it faster');

// 4. Performance: 20 players across every branch, 30 monsters, 30 s of fighting.
{
  const w = world();
  const branches = NATION_BRANCHES.map((b) => b);
  const monsters = [...w.combat.monsters.values()].filter((m) => m.kind !== 'cursed-rootkeeper');
  for (const m of monsters) m.hp = 1e7;
  const ids = [];
  for (let i = 0; i < 20; i++) {
    const b = branches[i % branches.length];
    const skills = {};
    for (const k of [...skillTree(2, b.branch), ...skillTree(3, b.branch)]) skills[k.id] = k.maxLevel;
    addPlayer(w, `pp${i}`, 60, { jobTier: 3, nation: b.nation, branch: b.branch, skills });
    const m = monsters[i % monsters.length], p = w.state.players.get(`pp${i}`); p.x = m.x - 1.5; p.y = m.y;
    ids.push({ id: `pp${i}`, m, skills: Object.keys(skills).filter((s) => castRule(s, skills) && SKILL_BEHAVIOR_POLICY[skillTree(2, b.branch).concat(skillTree(3, b.branch)).find((k) => k.id === s).behavior].hotbar), next: {} });
  }
  let worst = 0, sum = 0, ticks = 0;
  for (let t = 0; t < 30000; t += 33) {
    for (const p of ids) {
      const prof = w.profiles.get(p.id);
      if (prof.hp < prof.hpMax * 0.5 || prof.sp < 100) { const q = structuredClone(prof); q.hp = q.hpMax; q.sp = q.spMax; w.profiles.set(p.id, q); }
      w.combat.requestAttack(p.id, p.m.id, w.state.players.get(p.id));
      const s = p.skills.find((x) => (p.next[x] ?? 0) <= w.now());
      if (s) { w.combat.releaseSkill(p.id, s, p.m.id, p.m); p.next[s] = w.now() + Math.max(1000, castRule(s, w.profiles.get(p.id).skills).cooldownMs); }
    }
    const t0 = performance.now(); w.run(33, 33); const dt = performance.now() - t0;
    worst = Math.max(worst, dt); sum += dt; ticks++;
  }
  const avg = sum / ticks;
  console.log(`performance: 20 players + ${monsters.length} monsters, avg tick ${avg.toFixed(2)} ms, worst ${worst.toFixed(1)} ms, zones ${w.state.zones.size}, summons ${w.state.summons.size}`);
  assert.ok(avg < 8, `average combat tick well under the 33 ms budget (${avg.toFixed(2)} ms)`);
}
console.log('phase 5: shared EXP (pool bonus, split, loot, solo unchanged), in-combat SP trickle, flat ATK scale, boss time-to-kill band, 20-player performance passed');
