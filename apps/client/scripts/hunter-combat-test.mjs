// Ullr Hunter effects in the server CombatSystem with a fake host and a controllable clock (game integration slice 1):
// bow basic attacks, Twin Shot mark, Falcon Strike reveal/blind, Charged Rune Arrow hunt-condition bonus and pierce,
// rune traps (all four runes, limit, Hunter's Patience), Ski Dash displacement + snow trail, Volley, Great Hunt,
// Falcon Storm, synced statuses/zones and the cast rules. Run after `pnpm build`.
import assert from 'node:assert/strict';
import { GameState, PlayerState } from '../../../packages/schema/dist/index.js';
import {
  advanceJob, BASIC_ATTACK, basicAttackFor, castRule, combatStats, companionFor, HUNTER, newProfile, skillCastError, skillRange,
  stepMonster, WHISPERING_SPIRITWOOD as SW,
} from '../../../packages/shared/dist/index.js';
import { CombatSystem } from '../../server/dist/rooms/combat-system.js';

let now = 1000, seed = 7;
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
const run = (ms) => { for (let t = 0; t < ms; t += 50) { now += 50; combat.step(50); } };
const hp = (m) => m.hp;
const has = (m, s) => (m.statuses[s] ?? 0) > now;

// A Hunter profile: advanced from Apprentice through the real job rules, then given skills for the test.
let prof = newProfile(SW.spawn);
prof.level = 30; prof.hp = prof.hpMax = 5000; prof.sp = prof.spMax = 999;
prof.jobLevel = 10; prof.quests['job-apprentice-trial'] = { step: 2, done: true };
const adv = advanceJob(prof, 'ullr-hunter');
assert.ok(adv.ok, 'apprentice advances to Ullr Hunter');
prof = adv.profile;
assert.equal(prof.jobTier, 2); assert.equal(prof.nation, 'no'); assert.equal(prof.jobLevel, 1); assert.equal(prof.level, 30, 'base level kept');
assert.equal(companionFor(prof), '', 'no falcon before Falcon Bond');
Object.assign(prof.skills, { 'twin-shot': 5, 'falcon-strike': 5, 'ski-dash': 3, 'rune-trap-kit': 5, 'charged-rune-arrow': 5, 'bow-mastery': 10, 'falcon-bond': 10, 'trackers-eye': 5 });
assert.equal(companionFor(prof), 'kit-bone-falcon', 'Falcon Bond gives the permanent falcon');
profiles.set('hunter', prof);
const me = new PlayerState(); state.players.set('hunter', me);

// Cast rules and ranges come from the catalogue + provisional combat specs.
assert.equal(castRule('twin-shot').castMs, 0); assert.equal(castRule('twin-shot').cooldownMs, 800);
assert.equal(castRule('charged-rune-arrow', { 'rune-arrow-mastery': 5 }).castMs, 1050, 'Rune Arrow Mastery shortens the charge');
assert.equal(skillRange('twin-shot', prof.skills), 9 + 5, 'Bow Mastery lengthens arrow skills');
assert.equal(skillCastError(prof, 'twin-shot', 0, { casting: false, moving: false }, {}), null);
assert.equal(skillCastError(prof, 'twin-shot', 0, { casting: false, moving: true }, {}), 'moving', 'no casting on the move without Hunter\'s Stride');
assert.equal(skillCastError({ ...prof, skills: { ...prof.skills, 'hunters-stride': 1 } }, 'twin-shot', 0, { casting: false, moving: true }, {}), null, 'Hunter\'s Stride shoots while walking');
assert.equal(skillCastError(prof, 'wood-talisman', 0, { casting: false, moving: false }, {}), 'not-in-game', 'other branches wait for their slice');
assert.equal(skillCastError(prof, 'bow-mastery', 0, { casting: false, moving: false }, {}), 'not-castable', 'passives never cast');
const basic = basicAttackFor(prof, BASIC_ATTACK);
assert.ok(basic.ranged && basic.range === 13 && basic.delayMs < BASIC_ATTACK.delayMs, 'Hunters shoot a bow with Bow Mastery reach and speed');

// Pick a quiet monster and stand 6 units away.
const prey = () => {
  const m = [...combat.monsters.values()].find((x) => x.state !== 'dead' && x.kind !== 'cursed-rootkeeper' && !x.summoned && !x.used);
  m.used = true; m.hp = 100000; m.statuses = {}; m.state = 'idle';
  return m;
};
const place = (m, dx = 6) => { me.x = m.x - dx; me.y = m.y; me.facing = 'east'; };

// Bow basic attack: an arrow event, damage on arrival, from 6 units away.
let m = prey(); place(m);
assert.equal(combat.requestAttack('hunter', m.id, me), null, 'bow reaches 6 units');
events.length = 0; run(400);
assert.ok(events.some((e) => e.type === 'arrow' && e.from === 'hunter' && e.to === m.id), 'arrow event');
assert.ok(events.some((e) => e.type === 'damage' && e.target.id === m.id && e.source === 'hunter'), 'arrow damage lands');
combat.stopAttack('hunter');

// Twin Shot: two hits and a prey mark owned by the hunter.
events.length = 0;
combat.releaseSkill('hunter', 'twin-shot', m.id, m);
run(600);
assert.equal(events.filter((e) => e.type === 'damage' && e.skill === 'twin-shot').length, 2, 'two arrows');
assert.ok(has(m, 'mark') && m.markedBy.playerId === 'hunter', 'prey marked');
assert.ok(m.statuses.mark - now > 25000, "Tracker's Eye lengthens the mark");
assert.ok(state.monsters.get(m.id).statuses.includes('mark'), 'mark synced to clients');

// Falcon Strike on a marked prey: revealed + blind.
combat.releaseSkill('hunter', 'falcon-strike', m.id, m);
run(400);
assert.ok(has(m, 'revealed') && events.some((e) => e.type === 'status' && e.status === 'blind'), 'falcon reveals and blinds the marked prey');
// Blind monsters cannot land blows.
const s = combatStats(prof);
assert.ok(s.dex > 0 && s.luk > 0 && s.atk > 0);

// Charged Rune Arrow: more damage per hunt condition.
const charged = (target) => { events.length = 0; combat.releaseSkill('hunter', 'charged-rune-arrow', target.id, target); run(300); return events.filter((e) => e.type === 'damage' && e.skill === 'charged-rune-arrow' && e.target.id === target.id).reduce((n, e) => n + e.amount, 0); };
const plain = prey(); place(plain);
seed = 99; const base = charged(plain);
place(m); seed = 99; const hunted = charged(m);
assert.ok(hunted > base * 1.35, `two hunt conditions add ~50% (${base} → ${hunted})`);

// Pierce with Rune Arrow Mastery: a monster right behind the target is hit too.
prof.skills['rune-arrow-mastery'] = 1;
const front = prey(), behind = prey();
behind.x = front.x + 1.5; behind.y = front.y; place(front);
const before = hp(behind);
combat.releaseSkill('hunter', 'charged-rune-arrow', front.id, front); run(300);
assert.ok(hp(behind) < before, 'charged arrow pierces to the prey behind');

// Rune traps: each rune's effect, the trapped condition, the trap limit and Hunter's Patience.
prof.skills['hunters-patience'] = 2;
for (const rune of ['snare', 'freeze', 'blast', 'flash']) {
  const t = prey(); place(t, 4);
  const at = { x: t.x, y: t.y };
  events.length = 0; reduced.length = 0;
  combat.releaseSkill('hunter', 'rune-trap-kit', null, at, rune);
  assert.ok([...state.zones.values()].some((z) => z.kind === 'trap' && z.variant === rune), `${rune} trap synced`);
  const hp0 = t.hp;
  run(700);
  assert.ok(has(t, 'trapped'), `${rune} trap counts as a hunt condition`);
  if (rune === 'snare') assert.ok(has(t, 'root'), 'snare roots');
  if (rune === 'freeze') {
    assert.ok(has(t, 'freeze'), 'freeze freezes');
    t.state = 'chase'; t.targetId = 'hunter'; const x0 = t.x;
    assert.deepEqual(stepMonster(t, [{ id: 'hunter', x: me.x, y: me.y, alive: true }], 100, now, SW, Math.random), [], 'frozen monsters do nothing');
    assert.equal(t.x, x0);
  }
  if (rune === 'blast') { assert.ok(t.hp < hp0 && has(t, 'bleed'), 'blast damages and bleeds'); const h = t.hp; run(2100); assert.ok(t.hp < h, 'bleed ticks'); }
  if (rune === 'flash') assert.ok(has(t, 'blind'), 'flash blinds');
  assert.ok(events.some((e) => e.type === 'skillfx' && e.skillId === 'rune-trap-kit' && e.variant === rune), 'trap burst VFX event');
  assert.deepEqual(reduced, [{ id: 'hunter', skillId: 'charged-rune-arrow', ms: 1000 }], "Hunter's Patience cuts the charged arrow cooldown");
}
const far = { x: SW.spawn.x, y: SW.spawn.y };
for (let i = 0; i < 5; i++) combat.releaseSkill('hunter', 'rune-trap-kit', null, { x: far.x + i * 0.1, y: far.y }, 'snare');
assert.equal([...state.zones.values()].filter((z) => z.kind === 'trap').length, HUNTER.trapLimit(0), 'oldest trap breaks past the limit');

// Ski Dash: back 5 units away from the facing, snow trail zone, next-arrow crit buff.
const dashFrom = { x: SW.spawn.x + 2, y: SW.spawn.y };
me.x = dashFrom.x; me.y = dashFrom.y; me.facing = 'east';
combat.releaseSkill('hunter', 'ski-dash', null, me);
assert.ok(me.x < dashFrom.x - 2, `dash moves the hunter back (${dashFrom.x} → ${me.x.toFixed(2)})`);
assert.ok([...state.zones.values()].some((z) => z.kind === 'snow-trail'), 'snow trail zone');
run(100);
assert.ok(me.statuses.includes('dash-crit'), 'next-arrow crit buff synced');

// Ullr's Volley homes on every marked prey in range.
prof.skills['ullrs-volley'] = 1;
const a = prey(), b = prey(); b.x = a.x + 2; b.y = a.y; place(a);
combat.releaseSkill('hunter', 'twin-shot', a.id, a); combat.releaseSkill('hunter', 'twin-shot', b.id, b); run(600);
events.length = 0;
combat.releaseSkill('hunter', 'ullrs-volley', null, me); run(1200);
const volleyHits = events.filter((e) => e.type === 'damage' && e.skill === 'ullrs-volley');
assert.equal(volleyHits.length, HUNTER.volleyArrows(1), '6 + Lv arrows');
{ const hit = new Set(volleyHits.map((e) => e.target.id)); assert.ok(hit.has(a.id) && hit.has(b.id), 'spread over every marked prey'); }

// Great Hunt: a marked prey counts all three conditions; synced buff.
prof.skills['great-hunt'] = 1;
combat.releaseSkill('hunter', 'great-hunt', null, me); run(100);
assert.ok(me.statuses.includes('great-hunt'));
assert.equal(combat.hunter.conditions(a, 'hunter'), 3);

// Falcon Storm: a zone following the prey, ticking damage and blind.
prof.skills['falcon-storm'] = 1;
const c = prey(); place(c);
events.length = 0;
combat.releaseSkill('hunter', 'falcon-storm', c.id, c); run(4200);
assert.ok(events.filter((e) => e.type === 'damage' && e.skill === 'falcon-storm' && e.target.id === c.id).length >= 6, 'storm ticks every 0.5 s');
assert.ok(![...state.zones.values()].some((z) => z.kind === 'falcon-storm'), 'storm zone ends');

// Falcon Bond: basic shots sometimes send the falcon on their own.
const d = prey(); place(d);
events.length = 0;
combat.requestAttack('hunter', d.id, me); run(20000); combat.stopAttack('hunter');
assert.ok(events.some((e) => e.type === 'skillfx' && e.skillId === 'falcon-bond'), 'falcon auto-dives during basic attacks');

// Leaving removes the hunter's zones and buffs.
state.players.delete('hunter'); combat.forget('hunter'); run(100);
assert.equal([...state.zones.values()].filter((z) => z.owner === 'hunter').length, 0, 'zones cleared on leave');
console.log('hunter combat: bow, Twin Shot mark, falcon reveal/blind, charged arrow conditions + pierce, 4 rune traps + limit + patience, Ski Dash, Volley, Great Hunt, Falcon Storm, Falcon Bond, cleanup passed');
