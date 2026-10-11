// Japan effects in the server CombatSystem with a fake host (game integration slice 3): talisman ring + Invoke spell
// choice, residue + Sōshō Flow / Sōkoku Break, Taikyoku Balance, the invoked spells, shikigami behaviour + Ascension,
// Mandala, Ring Seal; Miko purification → blessing, heals, Suzu Bell, Ofuda, Cleansing Rain, resurrection, Sun Pillar,
// and the player buff layer (dealt / taken / dodge). Run after `pnpm build`.
import assert from 'node:assert/strict';
import { GameState, PlayerState } from '../../../packages/schema/dist/index.js';
import {
  BLESSING_OF, heldSpell, invokedSpell, JAPAN, newProfile, residueCombo, spellKind, spellResidue, WHISPERING_SPIRITWOOD as SW,
} from '../../../packages/shared/dist/index.js';
import { CombatSystem } from '../../server/dist/rooms/combat-system.js';

let now = 1000, seed = 5;
const state = new GameState();
const profiles = new Map();
const events = [];
const host = {
  map: SW, state, now: () => now, rng: () => (seed = (seed * 16807) % 2147483647) / 2147483647,
  profile: (id) => profiles.get(id), setProfile: (id, p) => profiles.set(id, p), vitals: () => {}, broadcast: (e) => events.push(e),
  reduceCooldown: () => {},
};
const combat = new CombatSystem(host);
const jp = combat.japan;
const run = (ms) => { for (let t = 0; t < ms; t += 50) { now += 50; combat.step(50); } };
const has = (m, s) => (m.statuses[s] ?? 0) > now;

// Pure rules.
assert.equal(invokedSpell('water', 'fire'), 'steam-burst');
assert.equal(heldSpell(['wood', 'water', 'fire']), 'steam-burst', 'the two newest talismans decide');
assert.equal(spellKind('bonfire-ward'), 'creation'); assert.equal(spellKind('steam-burst'), 'destruction'); assert.equal(spellKind('summon-kitsune'), 'shikigami');
assert.equal(spellResidue('bonfire-ward'), 'fire', 'creation leaves the generated element');
assert.equal(spellResidue('steam-burst'), 'water', 'destruction leaves the winner');
assert.equal(residueCombo('steam-burst', 'fire'), 'break', 'water overcomes a fire residue');
assert.equal(residueCombo('molten-swallows', 'earth'), 'flow', 'earth generates metal');
assert.equal(residueCombo('molten-swallows', 'wood'), 'break', 'metal overcomes wood');

const player = (id, branch, skills) => {
  const prof = newProfile(SW.spawn);
  Object.assign(prof, { level: 40, hp: 4000, hpMax: 4000, sp: 999, spMax: 999, jobTier: 2, nation: 'jp', branch, jobLevel: 1 });
  Object.assign(prof.skills, skills);
  profiles.set(id, prof);
  const p = new PlayerState(); p.x = SW.spawn.x; p.y = SW.spawn.y; state.players.set(id, p);
  return p;
};
const me = player('onmyoji', 'onmyoji', { 'wood-talisman': 5, 'fire-talisman': 5, 'earth-talisman': 5, 'metal-talisman': 5, 'water-talisman': 5, 'onmyo-seal': 3, 'sosho-flow': 3, 'sokoku-break': 3, 'taikyoku-balance': 3, 'shikigami-pact': 5, 'third-talisman': 1 });
const prey = () => {
  const pool = () => [...combat.monsters.values()].filter((x) => x.state !== 'dead' && x.kind !== 'cursed-rootkeeper' && !x.summoned);
  if (!pool().some((x) => !x.used)) for (const x of pool()) x.used = false;
  const m = pool().find((x) => !x.used); m.used = true; m.hp = 1e6; m.statuses = {}; m.state = 'idle'; return m;
};
const place = (m, dx = 4) => { me.x = m.x - dx; me.y = m.y; };
const talisman = (e) => combat.releaseSkill('onmyoji', `${e}-talisman`, null, me);

// Ring: 3 with Third Talisman, oldest drops; Invoke reads the newest two.
for (const e of ['wood', 'fire', 'earth', 'water']) talisman(e);
assert.deepEqual(jp.held('onmyoji'), ['fire', 'earth', 'water']);
assert.equal(jp.invokeSpell('onmyoji'), 'mudslide');
run(60); assert.equal(me.held, 'fire,earth,water', 'held ring synced');
assert.equal(jp.invokeCdMs('onmyoji'), 4000, 'Onmyō Seal Lv3: 4 s');

// Residue + Sōkoku Break: a fire residue broken by Steam Burst blinds; Steam Burst leaves water.
{
  const m = prey(); place(m);
  m.statuses['res-fire'] = now + 5000;
  talisman('water'); talisman('fire');
  combat.releaseSkill('onmyoji', 'steam-burst', m.id, m); run(400);
  assert.ok(has(m, 'blind'), 'fire break / steam blind');
  assert.ok(has(m, 'res-water'), 'steam burst leaves a water residue');
}
// Sōshō Flow: same spell deals more on a generating residue (earth residue → molten swallows' metal).
{
  const hit = (res) => { const m = prey(); place(m); if (res) m.statuses[res] = now + 5000; seed = 77; events.length = 0; combat.releaseSkill('onmyoji', 'molten-swallows', m.id, m); run(700);
    return events.filter((e) => e.type === 'damage' && e.skill === 'molten-swallows' && e.target.id === m.id).reduce((n, e) => n + e.amount, 0); };
  const plain = hit(null), flow = hit('res-earth');
  assert.ok(flow > plain * 1.2, `flow +40% (${plain} → ${flow})`);
}
// Taikyoku Balance: alternating creation/destruction stacks.
{
  const before = jp.om('onmyoji').balance;
  combat.releaseSkill('onmyoji', 'bonfire-ward', null, { x: me.x + 2, y: me.y });
  combat.releaseSkill('onmyoji', 'steam-burst', null, me);
  assert.ok(jp.om('onmyoji').balance > before, 'balance stacks when kinds alternate');
}
// Lines and cones: Root Fissure roots along the line, Mudslide pushes.
{
  const a = prey(); place(a, 3); const b = prey(); b.x = a.x + 1.5; b.y = a.y;
  combat.releaseSkill('onmyoji', 'root-fissure', a.id, a); run(400);
  assert.ok(has(a, 'root') && has(b, 'root'), 'fissure roots everything on the line');
  const c = prey(); place(c, 2); const x0 = c.x;
  combat.releaseSkill('onmyoji', 'mudslide', c.id, c); run(400);
  assert.ok(c.x > x0 + 1, 'mudslide knocks back');
}
// Zones: Bonfire buffs allies inside and burns monsters; Ash Barrier cuts damage taken; Spring Rain heals.
{
  combat.releaseSkill('onmyoji', 'bonfire-ward', null, { x: me.x, y: me.y }); run(300);
  assert.ok(me.statuses.includes('bonfire-ward'), 'bonfire ally buff synced');
  assert.ok(jp.dealtMul('onmyoji') > 1.05, 'bonfire raises damage dealt');
  combat.releaseSkill('onmyoji', 'ash-barrier', null, { x: me.x, y: me.y }); run(300);
  assert.ok(jp.taken('onmyoji', 100) <= 80, 'ash barrier: −20% taken');
  const q = structuredClone(profiles.get('onmyoji')); q.hp = 1000; profiles.set('onmyoji', q);
  combat.releaseSkill('onmyoji', 'spring-rain', null, { x: me.x, y: me.y }); run(2200);
  assert.ok(profiles.get('onmyoji').hp > 1000, 'spring rain heals');
}
// Kongō shield absorbs, then shatters into shards.
{
  combat.releaseSkill('onmyoji', 'kongo-talisman', null, me);
  assert.equal(jp.taken('onmyoji', 50), 0, 'shield absorbs');
  events.length = 0; jp.taken('onmyoji', 99999);
  assert.ok(events.some((e) => e.type === 'skillfx' && e.skillId === 'kongo-talisman' && e.variant === 'shatter'), 'shield shatters');
}
// Shikigami: summoned and synced, act on their own; Pact Lv5 allows two; newest replaces the oldest; Ascension.
{
  const m = prey(); place(m, 3);
  combat.releaseSkill('onmyoji', 'summon-kitsune', null, me);
  combat.releaseSkill('onmyoji', 'summon-nurikabe', null, me);
  assert.equal([...state.summons.values()].filter((s) => s.owner === 'onmyoji').length, 2, 'two shikigami at Pact Lv5');
  combat.releaseSkill('onmyoji', 'summon-kamaitachi', null, me);
  const kinds = [...state.summons.values()].map((s) => s.kind).sort();
  assert.deepEqual(kinds, ['kamaitachi', 'nurikabe'], 'newest replaces the oldest');
  events.length = 0; run(4500);
  assert.ok(events.some((e) => e.type === 'damage' && e.skill === 'summon-kamaitachi'), 'kamaitachi attacks on its own');
  assert.ok(events.some((e) => e.type === 'skillfx' && e.skillId === 'shikigami-nurikabe'), 'nurikabe pulls');
  combat.releaseSkill('onmyoji', 'shikigami-ascension', null, me);
  assert.ok([...state.summons.values()].some((s) => s.great), 'ascension: great form');
}
// Mandala: no Invoke cooldown, residue lasts twice as long. Ring Seal counts distinct residues; 5 → silence.
{
  combat.releaseSkill('onmyoji', 'gogyo-mandala', null, me);
  assert.equal(jp.invokeCdMs('onmyoji'), 0);
  const ms = Array.from({ length: 5 }, () => prey());
  ['wood', 'fire', 'earth', 'metal', 'water'].forEach((e, i) => { ms[i].x = me.x + 1 + i * 0.5; ms[i].y = me.y; ms[i].statuses[`res-${e}`] = now + 5000; });
  combat.releaseSkill('onmyoji', 'gogyo-ring-seal', null, me); run(400);
  assert.ok(ms.every((m) => has(m, 'silence')), 'all five elements: silence');
}

// ---- Miko ----
const miko = player('miko', 'miko', { 'harae-sweep': 4, 'kagura-purification-dance': 3, 'suzu-bell-blessing': 5, 'ofuda-ward-shot': 3, 'cleansing-rain': 1, 'blessing-craft': 2, 'priestess-grace': 5, 'holy-ward': 4, 'divine-miracle-resurrection': 1, 'kotodama-sacred-song': 2, 'sun-pillar': 1 });
const ally = player('ally', null, {});
ally.x = miko.x + 1; ally.y = miko.y;
// Monster blows inflict debuffs (PROVISIONAL), Harae turns them into the paired blessing.
jp.addBuff('ally', 'curse', 6000); jp.addBuff('ally', 'burn', 6000);
assert.ok(jp.dealtMul('ally') < 1, 'curse lowers damage');
combat.releaseSkill('miko', 'harae-sweep', null, miko); run(60);
assert.ok(ally.statuses.includes(BLESSING_OF.curse) && ally.statuses.includes(BLESSING_OF.burn), `debuffs became blessings (${ally.statuses})`);
assert.ok(!ally.statuses.includes('curse'), 'curse cleansed');
assert.ok(jp.dealtMul('ally') > 1.1, 'blessing raises damage');
// Kagura heals with Priestess Grace; Suzu Bell gives attack speed and dodge.
{ const q = structuredClone(profiles.get('ally')); q.hp = 500; profiles.set('ally', q); combat.releaseSkill('miko', 'kagura-purification-dance', null, miko); assert.ok(profiles.get('ally').hp > 500, 'kagura heals allies'); }
combat.releaseSkill('miko', 'suzu-bell-blessing', null, miko);
assert.ok(jp.aspdMul('ally') > 1.05, 'suzu bell attack speed');
{ let dodged = 0; for (let i = 0; i < 200; i++) if (jp.dodges('ally')) dodged++; assert.ok(dodged > 3, `suzu bell dodge (${dodged}/200)`); }
// Ofuda: holy damage + knockback 3.
{ const m = prey(); miko.x = m.x - 3; miko.y = m.y; const x0 = m.x; combat.releaseSkill('miko', 'ofuda-ward-shot', m.id, m); run(300); assert.ok(m.x > x0 + 2, 'ofuda knocks back'); }
// Cleansing Rain: everything cleansed, then immune for a while.
ally.x = miko.x + 1; ally.y = miko.y;
jp.addBuff('ally', 'weaken', 6000);
combat.releaseSkill('miko', 'cleansing-rain', null, miko); run(60);
assert.ok(ally.statuses.includes('guard') && ally.statuses.includes('status-immunity'), 'rain cleanses → guard + immunity');
jp.addBuff('ally', 'poison', 6000); run(60);
assert.ok(!ally.statuses.includes('poison'), 'immunity blocks new debuffs');
// Holy Ward: less damage from undead/demon blows.
{ const flame = [...combat.monsters.values()].find((m) => m.kind === 'spirit-flame'); assert.ok(jp.taken('miko', 100, flame) < 100, 'holy ward'); }
// Resurrection: a downed ally comes back where they fell at full HP and invulnerable.
{
  const q = structuredClone(profiles.get('ally')); q.hp = 0; profiles.set('ally', q);
  combat['downUntil'].set('ally', now + 99999); ally.dead = true;
  combat.releaseSkill('miko', 'divine-miracle-resurrection', null, miko); run(60);
  assert.equal(ally.dead, false); assert.equal(profiles.get('ally').hp, profiles.get('ally').hpMax, 'revived at full HP');
  assert.equal(jp.taken('ally', 500), 0, 'invulnerable after revival');
}
// Sun Pillar: holy damage to monsters and healing to allies inside.
{
  const m = prey(); m.x = miko.x + 1; m.y = miko.y; events.length = 0;
  combat.releaseSkill('miko', 'sun-pillar', null, { x: miko.x + 0.5, y: miko.y }); run(2200);
  assert.ok(events.filter((e) => e.type === 'damage' && e.skill === 'sun-pillar').length >= 2, 'sun pillar ticks');
}
// Leaving clears summons, zones and buffs.
for (const id of ['onmyoji', 'miko', 'ally']) { state.players.delete(id); combat.forget(id); }
run(100);
assert.equal(state.summons.size, 0); assert.equal([...state.zones.values()].filter((z) => ['onmyoji', 'miko'].includes(z.owner)).length, 0);
console.log('japan combat: talisman ring + invoke, residue flow/break, balance, lines/cones/zones, kongō shield, shikigami (two, replace, act, ascension), mandala, ring seal; miko purification → blessing, kagura, suzu, ofuda, cleansing rain + immunity, holy ward, resurrection, sun pillar passed');
