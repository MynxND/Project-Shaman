// Russia / Indonesia / Thailand effects in the server CombatSystem with a fake host (game integration slice 4):
// Juggernaut Guard + tank skills, Taiga bleed hunt, Santet needles + detonation + link, Keris poison/stealth/pamor,
// Achan sacred thread + Hun Phayon, Mor Phhee jumping prai, plus monster stun/fear/taunt/heal-block and lethal saves.
// Run after `pnpm build`.
import assert from 'node:assert/strict';
import { GameState, PlayerState } from '../../../packages/schema/dist/index.js';
import { castRule, newProfile, skillRange, stepMovement, stepMonster, WHISPERING_SPIRITWOOD as SW } from '../../../packages/shared/dist/index.js';
import { CombatSystem } from '../../server/dist/rooms/combat-system.js';

let now = 1000, seed = 9;
const state = new GameState();
const profiles = new Map();
const events = [];
const reduced = [];
const host = {
  map: SW, state, now: () => now, rng: () => (seed = (seed * 16807) % 2147483647) / 2147483647,
  profile: (id) => profiles.get(id), setProfile: (id, p) => profiles.set(id, p), vitals: () => {}, broadcast: (e) => events.push(e),
  reduceCooldown: (id, skillId, ms) => reduced.push({ id, skillId, ms }),
};
const combat = new CombatSystem(host);
const nx = combat.nations;
const run = (ms) => { for (let t = 0; t < ms; t += 50) { now += 50; combat.step(50); } };
const has = (m, s) => (m.statuses[s] ?? 0) > now;
const player = (id, nation, branch, skills) => {
  const prof = newProfile(SW.spawn);
  Object.assign(prof, { level: 40, hp: 4000, hpMax: 4000, sp: 999, spMax: 999, jobTier: 2, nation, branch, jobLevel: 1 });
  Object.assign(prof.skills, skills); profiles.set(id, prof);
  const p = new PlayerState(); p.x = SW.spawn.x; p.y = SW.spawn.y; state.players.set(id, p);
  return p;
};
const prey = () => {
  const pool = () => [...combat.monsters.values()].filter((x) => x.state !== 'dead' && x.kind !== 'cursed-rootkeeper' && !x.summoned);
  if (!pool().some((x) => !x.used)) for (const x of pool()) x.used = false;
  const m = pool().find((x) => !x.used); m.used = true; m.hp = 1e6; m.statuses = {}; m.state = 'idle'; m.targetId = null; return m;
};
const near = (who, m, dx = 1.5) => { who.x = m.x - dx; who.y = m.y; };
const cast = (id, skill, target, aim) => combat.releaseSkill(id, skill, target?.id ?? null, aim ?? target ?? state.players.get(id));
const dmg = (skill, target) => events.filter((e) => e.type === 'damage' && e.skill === skill && (!target || e.target.id === target.id)).reduce((n, e) => n + e.amount, 0);

// Cast rules: Santet Reach and Transcendent Medium.
assert.equal(skillRange('black-magic-dart', { 'santet-reach': 3 }), 12);
assert.equal(castRule('summon-hun-phayon', { 'transcendent-medium': 5 }).castMs, Math.round(3000 * 0.8));

// ---- Juggernaut ----
const jug = player('jug', 'ru', 'juggernaut', { 'wolf-spirit-armor': 5, 'taunting-howl': 3, 'siberian-frost-step': 3, 'shield-bash': 3, 'snow-fort': 5, 'titan-stomp': 1, 'taigas-absolute-fortress': 1, 'colossus-blood': 1, 'warlords-command': 3 });
{
  const m = prey(); near(jug, m);
  cast('jug', 'taunting-howl'); run(60);
  assert.equal(m.targetId, 'jug'); assert.ok(has(m, 'taunt'), 'taunted');
  assert.equal(jug.gaugeKind, 'guard'); assert.equal(jug.gauge, 20, 'howl gives 20 Guard');
  cast('jug', 'shield-bash', m); assert.ok(has(m, 'stun'), 'bash stuns');
  assert.deepEqual(stepMonster(m, [{ id: 'jug', x: jug.x, y: jug.y, alive: true }], 100, now, SW, Math.random), [], 'stunned monsters do nothing');
  cast('jug', 'wolf-spirit-armor'); assert.ok(nx.taken('jug', 100, false) < 90, 'wolf armor');
  cast('jug', 'snow-fort'); assert.ok(nx.taken('jug', 100, true) < nx.taken('jug', 100, false), 'snow fort cuts ranged/magic');
  cast('jug', 'siberian-frost-step'); run(60);
  assert.ok([...state.zones.values()].some((z) => z.kind === 'ice-ground') && jug.statuses.includes('ice-ground'), 'ice ground buff');
  // Titan Stomp spends all Guard for extra damage.
  const g = nx.job('jug').guard; events.length = 0; cast('jug', 'titan-stomp');
  assert.ok(dmg('titan-stomp', m) > 0 && nx.job('jug').guard === 0 && g > 0, 'stomp spends guard');
  cast('jug', 'taigas-absolute-fortress'); assert.equal(nx.taken('jug', 999, false), 0, 'absolute fortress');
  cast('jug', 'warlords-command'); run(60); assert.ok(jug.statuses.includes('warlord'));
}
// ---- Taiga ----
const taiga = player('taiga', 'ru', 'taiga', { 'slavic-axe-strike': 10, 'berserker-blood': 5, 'wolf-pack-call': 3, 'leap-strike': 3, 'blood-scent': 3, rend: 5, 'frenzy-aspd': 5, 'bloodthirsty-wolf-frenzy': 3, decapitate: 5, 'blood-moon': 1, 'wolf-blood-mastery': 3, 'undying-rage': 1 });
{
  const m = prey(); near(taiga, m);
  let bled = false; for (let i = 0; i < 20 && !bled; i++) { cast('taiga', 'slavic-axe-strike', m); bled = has(m, 'bleed'); }
  assert.ok(bled, 'axe strike bleeds');
  events.length = 0; run(2100); assert.ok(dmg('bleed', m) > 0, 'bleed ticks');
  assert.ok(nx.dealtMul('taiga', m) > 1.05, 'rend + wolf blood vs bleeding prey');
  assert.ok(nx.aspdMul('taiga') > 1, 'frenzy aspd near bleeders');
  const hp0 = profiles.get('taiga').hp; cast('taiga', 'berserker-blood');
  assert.ok(profiles.get('taiga').hp < hp0, 'berserker costs HP'); assert.ok(nx.aspdMul('taiga') > 1.1);
  // Blood Scent dashes to a bleeding prey; the kill resets the cooldown.
  const far = prey(); far.x = taiga.x + 5; far.y = taiga.y; far.statuses.bleed = now + 5000;
  const x0 = taiga.x; cast('taiga', 'blood-scent', far); assert.ok(taiga.x > x0 + 3, 'blood scent dash');
  far.hp = 5; reduced.length = 0; cast('taiga', 'slavic-axe-strike', far);
  assert.ok(reduced.some((r) => r.skillId === 'blood-scent'), 'scent kill resets cooldown');
  // Leap Strike lands next to the prey.
  const l = prey(); l.x = taiga.x + 6; l.y = taiga.y; cast('taiga', 'leap-strike', l); assert.ok(Math.abs(taiga.x - l.x) < 1.5, 'leap');
  // Decapitate executes a weak non-boss sometimes; Undying Rage saves a lethal blow once.
  const d = prey(); near(taiga, d); d.hp = 1; cast('taiga', 'decapitate', d); assert.equal(d.state, 'dead');
  const b = prey(); b.x = taiga.x + 3; b.y = taiga.y; b.statuses.bleed = now + 5000;
  const q = structuredClone(profiles.get('taiga')); q.hp = 1; profiles.set('taiga', q);
  assert.equal(nx.onLethal('taiga'), true, 'undying rage saves'); assert.ok(profiles.get('taiga').hp >= 800);
  assert.equal(nx.onLethal('taiga'), false, 'once per 300 s');
}
// ---- Santet ----
const santet = player('santet', 'id', 'santet', { 'black-magic-dart': 5, 'soul-pluck': 3, 'curse-of-agony': 5, 'poison-cloud': 3, 'voodoo-link': 3, 'endless-agony': 3, 'mass-decay': 1, 'heart-stop': 1, 'overlords-curse': 3, 'hex-amplify': 5, malice: 3 });
{
  const m = prey(); near(santet, m, 4);
  cast('santet', 'black-magic-dart', m); run(1000);
  assert.equal(dmg('black-magic-dart', m), 0, 'dart is delayed');
  run(700); assert.ok(dmg('black-magic-dart', m) > 0, 'dart lands after 1.5 s');
  cast('santet', 'soul-pluck', m); run(1200);
  run(60); assert.equal(state.monsters.get(m.id).stacks, 'needles:3', 'needles embed (1 + 2) and sync');
  cast('santet', 'curse-of-agony', m); assert.ok(has(m, 'def-down') && has(m, 'cursed'));
  assert.ok(nx.dealtMul('santet', m) > 1, "overlord's curse with 2+ debuffs");
  events.length = 0; cast('santet', 'endless-agony', m); run(60);
  assert.ok(dmg('endless-agony', m) > 0 && !state.monsters.get(m.id).stacks.includes('needles'), 'agony detonates the needles');
  // Voodoo Link shares damage with the nearest other monster.
  const o = prey(); o.x = m.x + 1; o.y = m.y; cast('santet', 'voodoo-link', m); events.length = 0;
  cast('santet', 'heart-stop', m); run(60);
  assert.ok(dmg('voodoo-link', o) > 0, 'link shares damage'); assert.ok(has(m, 'stun'), 'heart stop stuns');
  // Heal Block stops the monster healing on its way home.
  cast('santet', 'mass-decay', null, m); m.hp = 100; m.state = 'return'; m.x = m.home.x; m.y = m.home.y;
  stepMonster(m, [], 50, now, SW, Math.random); assert.equal(m.hp, 100, 'heal block');
  // Poison cloud ticks; Malice gives SP back with cursed enemies around.
  const c = prey(); near(santet, c, 3); events.length = 0;
  cast('santet', 'poison-cloud', null, c); run(2200);
  assert.ok(dmg('poison-cloud', c) > 0 && has(c, 'poison'), 'cloud');
  const s0 = structuredClone(profiles.get('santet')); s0.sp = 10; profiles.set('santet', s0); near(santet, m, 2); m.statuses.cursed = now + 10000; run(3100);
  assert.ok(profiles.get('santet').sp > 10, 'malice');
}
// ---- Keris ----
const keris = player('keris', 'id', 'keris', { 'poison-blade': 5, 'keris-thrust': 5, 'shadow-stealth': 3, 'venom-spit': 3, assassinate: 3, 'venom-mastery': 5, 'shadow-flash-strike': 1, 'fatal-assassination': 1, 'shadow-clone': 1, 'venomous-overdrive': 3 });
{
  const m = prey(); near(keris, m);
  cast('keris', 'venom-spit', m); run(300);
  assert.ok(has(m, 'poison') && has(m, 'blind'), 'spit poisons + blinds');
  // Stealth: monsters lose the Keris; the next hit is stronger and reveals.
  m.targetId = 'keris'; m.state = 'chase'; cast('keris', 'shadow-stealth'); run(60);
  assert.ok(keris.statuses.includes('stealth') && m.targetId !== 'keris', 'stealth drops aggro');
  const mul = nx.dealtMul('keris', m); assert.ok(mul >= 1.5, 'stealth opener'); run(60);
  assert.ok(!keris.statuses.includes('stealth'), 'revealed after the hit');
  // Pamor: 3 poison kills per stage; stage shows on the gauge.
  for (let i = 0; i < 3; i++) { const k = prey(); near(keris, k); k.hp = 1; k.statuses.poison = now + 5000; cast('keris', 'keris-thrust', k); }
  run(60); assert.equal(keris.gaugeKind, 'pamor'); assert.equal(keris.gauge, 1, 'stage 1 after 3 poison kills');
  assert.ok(nx.aspdMul('keris') > 1.05, 'stage 1 attack speed');
  cast('keris', 'shadow-clone'); assert.ok([...state.summons.values()].some((s) => s.kind === 'shadow-clone'), 'clone');
  events.length = 0; run(2100); assert.ok(dmg('shadow-clone') > 0, 'clone attacks');
}
// ---- Achan Saiyasat ----
const achan = player('achan', 'th', 'achan-saiyasat', { 'summon-hun-phayon': 3, 'sacred-thread-barrier': 3, 'achans-command': 3, 'phayon-repair': 3, 'guardian-link': 5, 'ward-mastery': 2, 'underworld-soul-pull': 1, 'fortress-of-sacred-thread': 1, 'curse-breaking': 5, 'sacred-aura': 5 });
{
  cast('achan', 'summon-hun-phayon');
  const pup = [...state.summons.values()].find((s) => s.kind === 'hun-phayon');
  assert.ok(pup && pup.hpMax === Math.round(4000 * 1.6), 'puppet HP = caster × (1 + 0.6)');
  const m = prey(); near(achan, m, 3); events.length = 0;
  cast('achan', 'achans-command', m); assert.ok(has(m, 'stun') && dmg('achans-command', m) > 0, 'command strike stuns');
  // Guardian Link sends 20% of hits to the puppet.
  const hp0 = pup.hp; assert.equal(nx.taken('achan', 100, false), 80); assert.equal(pup.hp, hp0 - 20);
  pup.hp = 100; cast('achan', 'phayon-repair'); assert.ok(pup.hp > 100, 'repair');
  // Sacred thread square: monsters inside slowed, allies inside protected.
  cast('achan', 'sacred-thread-barrier', null, { x: achan.x, y: achan.y }); m.x = achan.x + 1; m.y = achan.y; run(100);
  assert.ok(has(m, 'slow') && achan.statuses.includes('sacred-thread'), 'thread square');
  assert.equal([...state.zones.values()].find((z) => z.kind === 'sacred-thread').radius, 4.5, 'ward mastery widens the square');
  // Soul pull drags monsters to the centre and roots them.
  const a = prey(); a.x = achan.x + 4; a.y = achan.y; cast('achan', 'underworld-soul-pull', null, { x: achan.x + 1, y: achan.y });
  assert.ok(Math.abs(a.x - (achan.x + 1)) < 1 && has(a, 'root'), 'pulled + rooted');
  combat.japan.addBuff('achan', 'curse', 6000); cast('achan', 'curse-breaking'); run(60);
  assert.ok(!achan.statuses.includes('curse'), 'curse broken');
  cast('achan', 'fortress-of-sacred-thread'); run(100); assert.ok(nx.taken('achan', 100, false) < 80, 'thread fortress');
}
// ---- Mor Phhee ----
const mor = player('mor', 'th', 'mor-phhee', { 'ghost-possession': 3, 'prai-whispering-curse': 6, 'soul-drain': 3, 'terrorize-howl': 5, 'shadow-snare': 3, 'prai-curse-explosion': 1, 'vampiric-instinct': 5, 'absolute-soul-defense': 3 });
{
  const a = prey(), b = prey(); near(mor, a); b.x = a.x + 2; b.y = a.y;
  cast('mor', 'prai-whispering-curse', a); run(60);
  assert.ok(has(a, 'cursed') && state.monsters.get(a.id).stacks.includes('prai:0'), 'prai possesses');
  events.length = 0; run(2100); assert.ok(dmg('prai-whispering-curse', a) > 0, 'curse ticks');
  // The prai jumps to the next host when its host dies, stronger each jump.
  a.hp = 1; cast('mor', 'soul-drain', a); run(60);
  assert.ok(state.monsters.get(b.id).stacks.includes('prai:1'), 'prai jumped to the next host');
  events.length = 0; cast('mor', 'prai-curse-explosion'); assert.ok(dmg('prai-curse-explosion', b) > 0, 'explosion detonates the prai');
  // Possession: basic hits plant prai; fear makes monsters flee.
  cast('mor', 'ghost-possession'); assert.ok(nx.aspdMul('mor') > 1.05);
  const c = prey(); nx.onBasicHit('mor', c, 10); assert.ok(has(c, 'cursed'), 'possession hits plant prai');
  const f = prey(); near(mor, f, 1); seed = 3;
  for (let i = 0; i < 5 && !has(f, 'fear'); i++) cast('mor', 'terrorize-howl');
  assert.ok(has(f, 'fear'), 'howl fears'); const d0 = Math.hypot(f.x - mor.x, f.y - mor.y);
  stepMonster(f, [{ id: 'mor', x: mor.x, y: mor.y, alive: true }], 500, now, SW, Math.random);
  assert.ok(Math.hypot(f.x - mor.x, f.y - mor.y) > d0, 'feared monster runs away');
  // Absolute Soul Defense: a prai is sacrificed to survive.
  cast('mor', 'prai-whispering-curse', f);
  const q = structuredClone(profiles.get('mor')); q.hp = 1; profiles.set('mor', q);
  assert.equal(nx.onLethal('mor'), true, 'soul defense saves');
}
for (const id of ['jug', 'taiga', 'santet', 'keris', 'achan', 'mor']) { state.players.delete(id); combat.forget(id); }
run(100);
assert.equal(state.summons.size, 0, 'summons cleared');
console.log('nations combat: juggernaut guard/taunt/stun/forts/stomp, taiga bleed/scent reset/leap/execute/undying, santet delay/needles/agony/link/heal-block/malice, keris poison/stealth/pamor/clone, achan puppet/command/link/thread/pull/fortress, mor phhee prai jumps/explosion/possession/fear/soul defense passed');
