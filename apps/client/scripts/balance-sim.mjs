// Phase 5 balance simulator: runs every branch's real server effects (CombatSystem + effect modules) against training
// dummies and reports damage over 60 s. Greedy rotation: cast the strongest ready skill the caster can pay for, basic
// attacks in between; cast times block, cooldowns from castRule, SP from combatSpec, no SP regen (in combat).
// Scenarios: "early" (base Lv 15, job tier 2, actives Lv 5) and "late" (base Lv 60, tier 3, every skill at max).
// Usage: node scripts/balance-sim.mjs [--json out.json] [--md out.md]   (run after `pnpm build`)
import { writeFileSync } from 'node:fs';
import { GameState, PlayerState } from '../../../packages/schema/dist/index.js';
import {
  castRule, combatSpec, MONSTERS, NATION_BRANCHES, newProfile, SKILL_BEHAVIOR_POLICY, skillTree, WHISPERING_SPIRITWOOD as SW, maxHpFor, maxSpFor,
  ONMYOJI_SPELL_ELEMENTS,
} from '../../../packages/shared/dist/index.js';
import { CombatSystem } from '../../server/dist/rooms/combat-system.js';

const DUMMY = 'clay-guardian';
const SECONDS = 60, STEP = 50;
const SCENARIOS = [
  { key: 'early', level: 15, tier: 2, active: 5, passive: 0 },
  { key: 'late', level: 60, tier: 3, active: 99, passive: 99 },
];
const MEDIUM_DAMAGE = new Set(['spirit-bolt', 'amulet-blast']);
const only = process.argv.indexOf('--branch');
const branches = only >= 0 ? [process.argv[only + 1]] : NATION_BRANCHES.map((b) => b.branch);

function simulate(branch, sc, targets) {
  let now = 1000, seed = 12345;
  const state = new GameState(), profiles = new Map();
  const host = { map: SW, state, now: () => now, rng: () => (seed = (seed * 16807) % 2147483647) / 2147483647,
    profile: (id) => profiles.get(id), setProfile: (id, p) => profiles.set(id, p), vitals: () => {}, broadcast: (e) => { if (e.type === 'damage' && e.target.kind === 'monster' && e.source === 'p') { dealt += e.amount; bySkill[e.skill ?? 'basic'] = (bySkill[e.skill ?? 'basic'] ?? 0) + e.amount; } },
    reduceCooldown: (id, skillId, ms) => { ready[skillId] = Math.max(now, (ready[skillId] ?? 0) - ms); } };
  let dealt = 0;
  const bySkill = {};
  const ready = {};
  const combat = new CombatSystem(host);
  // Dummies: freeze the AI by keeping them idle at fixed spots with huge HP.
  const dummies = [...combat.monsters.values()].filter((m) => m.kind === DUMMY).slice(0, targets);
  const home = { x: SW.spawn.x, y: SW.spawn.y };
  dummies.forEach((m, i) => { m.x = home.x + 3 + (i % 2) * 0.8; m.y = home.y + Math.floor(i / 2) * 0.8 - 0.4; m.hp = 1e9; m.facing = 'west'; });
  for (const m of combat.monsters.values()) if (!dummies.includes(m)) { m.state = 'dead'; m.hp = 0; }
  const prof = newProfile(SW.spawn);
  const b = NATION_BRANCHES.find((x) => x.branch === branch);
  Object.assign(prof, { level: sc.level, hpMax: maxHpFor(sc.level), hp: maxHpFor(sc.level), spMax: maxSpFor(sc.level), sp: maxSpFor(sc.level), jobTier: sc.tier, nation: b.nation, branch, jobLevel: 1 });
  const trees = [1, 2, ...(sc.tier >= 3 ? [3] : [])].flatMap((t) => skillTree(t, t === 1 ? null : branch));
  for (const k of trees) {
    const active = SKILL_BEHAVIOR_POLICY[k.behavior].hotbar;
    prof.skills[k.id] = Math.min(k.maxLevel, active ? sc.active : sc.passive);
    if (!prof.skills[k.id]) delete prof.skills[k.id];
  }
  profiles.set('p', prof);
  const me = new PlayerState(); me.x = home.x; me.y = home.y; me.facing = 'east'; state.players.set('p', me);
  // Rotation candidates: damaging/useful actives (Medium heals and buffs skipped), Onmyoji invokes damage spells.
  let actives = trees.filter((k) => SKILL_BEHAVIOR_POLICY[k.behavior].hotbar && prof.skills[k.id] && (k.tier > 1 || MEDIUM_DAMAGE.has(k.id)));
  const invokeSpells = branch === 'onmyoji' ? ['steam-burst', 'molten-swallows', 'root-fissure', 'mudslide', 'leaf-blade-storm'] : [];
  const step = (ms) => { for (let t = 0; t < ms; t += STEP) { now += STEP; combat.step(STEP); for (const m of dummies) { m.hp = 1e9; m.state = 'idle'; m.targetId = null; m.facing = 'west'; m.x = home.x + 3 + (dummies.indexOf(m) % 2) * 0.8; } } };
  let busyUntil = now, spUsed = 0, casts = {};
  combat.requestAttack('p', dummies[0].id, me);
  const end = now + SECONDS * 1000;
  while (now < end) {
    if (now >= busyUntil) {
      const p = profiles.get('p');
      const pool = [...actives.map((k) => k.id), ...invokeSpells];
      // Prefer skills not used for the longest time, so the rotation cycles everything (the simulator has no damage oracle).
      const order = pool.filter((id) => (ready[id] ?? 0) <= now && (combatSpec(id)?.sp ?? 0) <= p.sp && (!invokeSpells.includes(id) || (ready.invoke ?? 0) <= now))
        .sort((a, c) => (casts[a] ?? 0) - (casts[c] ?? 0));
      const id = order[0];
      if (id) {
        const rule = castRule(id, p.skills);
        if (invokeSpells.includes(id)) { for (const e of new Set(ONMYOJI_SPELL_ELEMENTS[id])) combat.releaseSkill('p', `${e}-talisman`, null, me); if (ONMYOJI_SPELL_ELEMENTS[id][0] === ONMYOJI_SPELL_ELEMENTS[id][1]) combat.releaseSkill('p', `${ONMYOJI_SPELL_ELEMENTS[id][0]}-talisman`, null, me); ready.invoke = now + combat.japan.invokeCdMs('p'); }
        step(rule.castMs);
        const q = structuredClone(profiles.get('p')); q.sp -= combatSpec(id)?.sp ?? 0; profiles.set('p', q); spUsed += combatSpec(id)?.sp ?? 0;
        const target = dummies[0];
        combat.releaseSkill('p', id, target.id, { x: target.x, y: target.y });
        ready[id] = now + rule.cooldownMs;
        casts[id] = (casts[id] ?? 0) + 1;
        busyUntil = now + 300; // global cooldown between casts (client/server latency)
        combat.requestAttack('p', dummies[0].id, me);
        continue;
      }
    }
    step(STEP);
  }
  step(2000); // let delayed hits land
  return { dps: Math.round(dealt / SECONDS), total: dealt, spUsed, spPool: maxSpFor(sc.level), casts, bySkill };
}

const rows = [];
for (const sc of SCENARIOS) for (const branch of branches) {
  const single = simulate(branch, sc, 1), aoe = simulate(branch, sc, 4);
  rows.push({ scenario: sc.key, branch, single: single.dps, aoe4: aoe.dps, spUsed: single.spUsed, spPool: single.spPool, casts: single.casts, bySkill: single.bySkill });
}
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const lines = ['| ฉาก | สาย | DPS เป้าเดียว | DPS 4 เป้า | SP ใช้ / SP เต็ม | เทียบค่ากลาง |', '|---|---|---|---|---|---|'];
for (const sc of SCENARIOS) {
  const rs = rows.filter((r) => r.scenario === sc.key), med = median(rs.map((r) => r.single));
  for (const r of rs) { r.vsMedian = +(r.single / med).toFixed(2); lines.push(`| ${sc.key} | ${r.branch} | ${r.single} | ${r.aoe4} | ${r.spUsed} / ${r.spPool} | ×${r.vsMedian} |`); }
}
const args = process.argv.slice(2);
const jsonAt = args.indexOf('--json'), mdAt = args.indexOf('--md');
if (jsonAt >= 0) writeFileSync(args[jsonAt + 1], JSON.stringify(rows, null, 2));
if (mdAt >= 0) writeFileSync(args[mdAt + 1], lines.join('\n') + '\n');
console.log(lines.join('\n'));
// --branch: per-skill DPS breakdown and cast counts for that branch.
if (branches.length === 1) for (const r of rows) console.log(r.scenario, JSON.stringify(Object.fromEntries(Object.entries(r.bySkill).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, Math.round(v / SECONDS)]))), JSON.stringify(r.casts));
