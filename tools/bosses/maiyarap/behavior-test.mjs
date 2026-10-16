import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { GameState, PlayerState } from '../../../packages/schema/dist/index.js';
import { getMap, newProfile, MAIYARAP_SKILLS, MAIYARAP_HP, DREAM_SYMBOLS, DREAM_SOURCE, dreamHit, stepMovement, inDreamCourt, isBlocked, FACINGS } from '../../../packages/shared/dist/index.js';
import { CombatSystem } from '../../../apps/server/dist/rooms/combat-system.js';
const out = 'docs/design/bosses/maiyarap/evidence'; mkdirSync(out, { recursive: true });
let checks = 0; const check = (value, label) => { assert(value, label); checks++; };
function fixture() {
  let now = 1000; const state = new GameState(), profiles = new Map(), events = [], map = getMap('maiyarap-palace');
  const host = { map, state, now: () => now, rng: () => .5, profile: id => profiles.get(id), setProfile: (id, p) => profiles.set(id, p), vitals(id) { const p = profiles.get(id), s = state.players.get(id); if (p && s) { s.hp = p.hp; s.hpMax = p.hpMax; } }, broadcast: e => events.push({ ...e, at: now }), reduceCooldown() {} };
  const c = new CombatSystem(host), p = new PlayerState(); p.x = 24; p.y = 30; state.players.set('p', p);
  const profile = newProfile(map.spawn); profiles.set('p', profile); c.maiyarap.review('p', { action: 'prepare' });
  profile.hp = profile.hpMax = 100000; profiles.set('p', profile); host.vitals('p');
  const step = (ms = 50) => { now += ms; c.step(ms); }, run = ms => { for (let i = 0; i < ms; i += 50) step(); };
  return { c, e: c.maiyarap, p, state, profiles, events, map, now: () => now, step, run };
}
const clips = [];
for (const [skill, s] of Object.entries(MAIYARAP_SKILLS)) for (const face of FACINGS) {
  const f = fixture(); f.e.review('p', { action: 'phase', phase: s.phase }); f.run(3650); const angle=Math.PI/2-FACINGS.indexOf(face)*Math.PI/4; f.p.x=f.e.body.x+Math.cos(angle)*6; f.p.y=f.e.body.y+Math.sin(angle)*6; f.e.review('p', { action: 'skill', skill });
  check(f.e.body.facing===face, skill+' authoritative facing '+face);
  const start = f.now(), cues = new Map(), actor = [], stages = new Set();
  const duration = skill === 'eternal-slumber' ? 27000 : skill === 'sleepwalker-hunt' ? 7600 : 6000;
  for (let t = 0; t <= duration; t += 50) {
    for (const h of f.e.state.hazards.values()) cues.set(h.id, { ...h.toJSON(), warnAt: h.warnAt - start, startsAt: h.startsAt - start, endsAt: h.endsAt - start });
    actor.push({ at: t, x: f.e.body.x, y: f.e.body.y, facing: f.e.body.facing, mode: f.e.state.mode, stage: f.e.state.ultimateStage }); stages.add(f.e.state.ultimateStage); f.step();
  }
  check(cues.size > 0, skill + ' has authoritative hazards');
  check([...cues.values()].every(h => h.startsAt - h.warnAt >= 900 && h.endsAt > h.startsAt), skill + ' readable timestamps');
  check(f.e.state.hazards.size === 0, skill + ' cleans hazards');
  check(f.e.state.mode === 'idle', skill + ' recovers');
  if (skill === 'eternal-slumber') check([1, 2, 3, 4, 5].every(x => stages.has(x)), 'all five ultimate stages');
  clips.push({ skill, face, duration, cues: [...cues.values()], actor, source: 'actual CombatSystem recording at50ms; QA arranged phase, stationary guest', damage: f.events.filter(e => e.type === 'damage' && e.target.id === 'p').reduce((n, e) => n + e.amount, 0) });
}
{
  const f = fixture(); f.c.damageMonster(f.e.body, 999999, 'p'); f.step(); check(f.e.body.hp === 12600 && f.e.state.phase === 2, 'phase70% floor, no skipped phase');
  f.run(3650); f.c.damageMonster(f.e.body, 999999, 'p'); f.step(); check(f.e.body.hp === 6300 && f.e.state.phase === 3, 'phase35% floor');
  f.run(3650); f.c.damageMonster(f.e.body, 999999, 'p'); f.step(); check(f.e.state.mode === 'defeated' && f.e.state.hazards.size === 0, 'death clears tasks and hazards');
  f.run(3000); check(f.e.state.hazards.size === 0, 'no delayed damage after death');
}
{
  const f = fixture(); f.e.start('sleep-enchantment', 'p'); check(!f.e.start('sleep-enchantment', 'p'), 'busy/cooldown cannot recast');
  f.run(3500); check(!f.e.start('sleep-enchantment', 'p'), 'cooldown remains after recovery');
  check(f.e.state.dreamers.get('p')?.realm === 'dream', 'sleep enters dream, not stun');
  check(f.e.filterDamage(f.e.body, 100, 'p') === 0, 'dream player cannot hit waking boss');
  check(!f.e.interact('p', 'lotus'), 'remote interaction rejected');
  f.run(25000); check(f.e.state.dreamers.get('p')?.realm === 'awake', 'bounded sleep prevents permanent softlock');
}
{
  const f = fixture(); f.e.review('p', { action: 'phase', phase: 3 }); f.run(3650); f.e.review('p', { action: 'skill', skill: 'eternal-slumber' }); f.run(1800);
  const began = f.now();
  for (const node of DREAM_SYMBOLS) {
    while (Math.hypot(f.p.x - node.x, f.p.y - node.y) > .18) {
      const dx = node.x - f.p.x, dy = node.y - f.p.y, n = Math.hypot(dx, dy);
      const next = stepMovement(f.p, { x: dx / n, y: dy / n, sequence: 0 }, .05, f.map).position; f.p.x = next.x; f.p.y = next.y; f.step();
      check(inDreamCourt(f.p), 'solo route stays in court');
    }
    check(f.e.interact('p', node.id), 'valid ordered symbol ' + node.id);
  }
  check(f.e.state.sourceExposed, 'source exposed');
  while (Math.hypot(f.p.x - DREAM_SOURCE.x, f.p.y - DREAM_SOURCE.y) > 1.5) {
    const dx = DREAM_SOURCE.x - f.p.x, dy = DREAM_SOURCE.y - f.p.y, n = Math.hypot(dx, dy);
    Object.assign(f.p, stepMovement(f.p, { x: dx / n, y: dy / n, sequence: 0 }, .05, f.map).position); f.step();
  }
  check(f.now() - began < 15000, 'full solo puzzle path reaches source in time');
  f.c.damageMonster(f.e.source, 200, 'p'); f.step();
  check(f.e.state.countered && f.e.state.mode === 'stagger', 'source defeat interrupts ultimate');
  check(f.e.state.dreamers.get('p').realm === 'awake' && f.e.state.hazards.size === 0, 'counterplay wakes and cancels damaging finale');
  f.run(27000); check(!f.events.some(e => e.type === 'damage' && e.at > began + 22000), 'no cancelled finale damage');
}
{
  const h = { shape: 'ring', x: 24, y: 24, toX: 24, toY: 24, radius: 7, width: .5, angle: 0, arc: 0, startsAt: 1000, endsAt: 1900 };
  check(!dreamHit(h, { x: 24, y: 24 }, 1000), 'wave center safe at birth');
  check(dreamHit(h, { x: 25.2, y: 24 }, 1000), 'wave initial band hits');
  check(dreamHit(h, { x: 31.77, y: 24 }, 1900, 1850), 'outer band includes width and body');
  check(!dreamHit(h, { x: 31.79, y: 24 }, 1900, 1850), 'outside band safe');
  for (let facing = 0; facing < 8; facing++) { const a = facing * Math.PI / 4; check(dreamHit({ ...h, shape: 'capsule', toX:24+Math.cos(a)*6,toY:24+Math.sin(a)*6 }, {x:24+Math.cos(a)*3,y:24+Math.sin(a)*3},1000), 'eight-direction capsule ' + facing); }
  check(DREAM_SYMBOLS.every(s => !isBlocked(getMap('maiyarap-palace'), s.x, s.y)), 'all shrine nodes walkable');
}
{
  const f = fixture(); f.e.review('p', { action: 'skill', skill: 'sleepwalker-hunt' }); f.state.players.delete('p'); f.run(8000);
  check(f.e.state.mode === 'dormant' && f.e.state.hazards.size === 0 && f.e.state.dreamers.size === 0, 'leave/wipe cancels delayed hunts and dream state');
}
{
  const f=fixture();f.c.nations.dodges=()=>true;f.e.review('p',{action:'skill',skill:'sleep-enchantment'});f.run(2000);
  check((f.e.state.dreamers.get('p')?.realm??'awake')==='awake','existing dodge immunity prevents sleep as well as damage');
  check(!f.events.some(e=>e.type==='damage'&&e.amount>0),'dodged contact has no damage');
}
{
  const f=fixture();f.e.review('p',{action:'phase',phase:3});f.run(3650);
  for(const node of DREAM_SYMBOLS){f.p.x=node.x;f.p.y=node.y;check(f.e.interact('p',node.id),'phase3 intentional lucid symbol');f.run(400);}
  check(f.e.filterDamage(f.e.body,100,'p')===135,'phase3 lucid risk rewards135% boss damage');
  f.c.damageMonster(f.e.body,999999,'p');f.step();check(f.e.state.mode==='defeated'&&f.e.source.state==='dead','defeat retires spell source');
  f.run(181000);check(['dormant','idle'].includes(f.e.state.mode)&&f.e.state.phase===1&&f.e.body.hp===18000,'natural boss respawn resets full encounter; a player still in court may re-engage it');
}
check(clips.every(c=>c.cues.length<=24),'all88 recordings fit critical-warning budget');
{const f=fixture();f.p.y=38.5;check(f.e.filterDamage(f.e.body,999,'p')===0,'cannot cheese boss from outside authoritative court');}
{const f=fixture();f.e.review('p',{action:'skill',skill:'sleepwalker-hunt'});f.run(1800);f.p.x=30;f.p.y=22;f.run(350);check(f.e.body.facing==='north-east','each hunt rush turns toward its newly locked target');}
const asset = 'apps/client/public/boss-review/maiyarap'; mkdirSync(asset, { recursive: true });
writeFileSync(asset + '/clips.json', JSON.stringify(clips));
writeFileSync(out + '/behavior.json', JSON.stringify({ checks, result: 'pass', stepMs: 50, clips: clips.map(c => ({ skill: c.skill, face:c.face, hazards: c.cues.length, duration: c.duration })) }, null, 2));
console.log('PASS', checks, 'Maiyarap behavior checks;88 actual CombatSystem clips exported.');
