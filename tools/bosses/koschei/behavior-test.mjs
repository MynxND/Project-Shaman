import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { GameState, PlayerState } from '../../../packages/schema/dist/index.js';
import { getMap, newProfile, KOSCHEI_SKILLS, KOSCHEI_HP, KOSCHEI_RELICS, KOSCHEI_NEEDLE, koscheiHit, stepMovement, inKoscheiCourt, isBlocked, FACINGS } from '../../../packages/shared/dist/index.js';
import { CombatSystem } from '../../../apps/server/dist/rooms/combat-system.js';
const out = 'docs/design/bosses/koschei/evidence'; mkdirSync(out, { recursive: true });
let checks = 0; const check = (value, label) => { assert(value, label); checks++; };
function fixture() {
  let now = 1000; const state = new GameState(), profiles = new Map(), events = [], map = getMap('frozen-necropolis');
  const host = { map, state, now: () => now, rng: () => .5, profile: id => profiles.get(id), setProfile: (id, p) => profiles.set(id, p), vitals(id) { const p = profiles.get(id), s = state.players.get(id); if (p && s) { s.hp = p.hp; s.hpMax = p.hpMax; } }, broadcast: e => events.push({ ...e, at: now }), reduceCooldown() {} };
  const c = new CombatSystem(host), p = new PlayerState(); p.x = 24; p.y = 30; state.players.set('p', p);
  const profile = newProfile(map.spawn); profiles.set('p', profile); c.koschei.review('p', { action: 'prepare' });
  profile.hp = profile.hpMax = 100000; profiles.set('p', profile); host.vitals('p');
  const step = (ms = 50) => { now += ms; c.step(ms); }, run = ms => { for (let i = 0; i < ms; i += 50) step(); };
  return { c, e: c.koschei, p, state, profiles, events, map, now: () => now, step, run };
}
const clips = [];
for (const [skill, s] of Object.entries(KOSCHEI_SKILLS)) for (const face of FACINGS) {
  const f = fixture(); f.e.review('p', { action: 'phase', phase: s.phase }); f.run(3650); const angle=Math.PI/2-FACINGS.indexOf(face)*Math.PI/4; f.p.x=f.e.body.x+Math.cos(angle)*6; f.p.y=f.e.body.y+Math.sin(angle)*6; f.e.review('p', { action: 'skill', skill });
  check(f.e.body.facing===face, skill+' authoritative facing '+face);
  const start = f.now(), cues = new Map(), actor = [], stages = new Set();
  const duration = skill === 'the-last-needle' ? 38000 : skill === 'soul-severance' ? 9000 : 7000;
  for (let t = 0; t <= duration; t += 50) {
    for (const h of f.e.state.hazards.values()) cues.set(h.id, { ...h.toJSON(), warnAt: h.warnAt - start, startsAt: h.startsAt - start, endsAt: h.endsAt - start });
    actor.push({ at: t, x: f.e.body.x, y: f.e.body.y, facing: f.e.body.facing, mode: f.e.state.mode, stage: f.e.state.ultimateStage }); stages.add(f.e.state.ultimateStage); f.step();
  }
  check(cues.size > 0, skill + ' has authoritative hazards');
  if(skill==='soul-lance')check(f.events.filter(e=>e.type==='damage'&&e.target.id==='p').reduce((n,e)=>n+e.amount,0)===80,'unbent lance contact '+face);
  check([...cues.values()].every(h => h.startsAt - h.warnAt >= 900 && h.endsAt > h.startsAt), skill + ' readable timestamps');
  check(f.e.state.hazards.size === 0, skill + ' cleans hazards');
  check(f.e.state.mode === 'idle', skill + ' recovers');
  if (skill === 'the-last-needle') check([1, 2, 3, 4, 5].every(x => stages.has(x)), 'all five ultimate stages');
  clips.push({ skill, face, duration, cues: [...cues.values()], actor, source: 'actual CombatSystem recording at50ms; QA arranged phase, stationary guest', damage: f.events.filter(e => e.type === 'damage' && e.target.id === 'p').reduce((n, e) => n + e.amount, 0) });
}const walk=(f,to)=>{let n=0;while(Math.hypot(f.p.x-to.x,f.p.y-to.y)>.2){assert(n++<1000,'route stuck');const dx=to.x-f.p.x,dy=to.y-f.p.y,d=Math.hypot(dx,dy);Object.assign(f.p,stepMovement(f.p,{x:dx/d,y:dy/d,sequence:0},.05,f.map).position);f.step();check(inKoscheiCourt(f.p),'relic route stays in court');}};
{
 const f=fixture();f.c.damageMonster(f.e.body,999999,'p');f.step();check(f.e.body.hp===14700&&f.e.state.phase===2,'70% gate');f.run(3650);f.c.damageMonster(f.e.body,999999,'p');f.step();check(f.e.body.hp===7350&&f.e.state.phase===3,'35% gate');f.run(3650);f.c.damageMonster(f.e.body,999999,'p');f.step();check(f.e.body.hp===1&&f.e.state.mode!=='defeated','external needle prevents death');
 for(const node of KOSCHEI_RELICS){walk(f,node);check(f.e.interact('p',node.id),'open '+node.id);f.run(400);}walk(f,KOSCHEI_NEEDLE);check(f.e.state.needleExposed,'egg reveals actual combat needle');f.c.damageMonster(f.e.needle,9999,'p');f.step();check(f.e.state.needleBroken,'needle broken');f.c.damageMonster(f.e.body,99999,'p');f.step();check(f.e.state.mode==='defeated'&&!f.e.state.hazards.size,'boss can die after needle');f.run(6000);check(!f.e.state.hazards.size,'no delayed postdeath damage');f.run(181000);check(f.e.state.phase===1&&f.e.body.hp===21000&&!f.e.state.needleBroken,'natural respawn resets death relic');
}
{
 const f=fixture();check(!f.e.interact('p','egg'),'wrong unopened stage rejected');check(!f.e.interact('p','oak'),'remote oak rejected');f.e.review('p',{action:'phase',phase:3});f.run(3650);f.e.review('p',{action:'skill',skill:'the-last-needle'});const start=f.now();f.run(1800);for(const node of KOSCHEI_RELICS){walk(f,node);check(f.e.interact('p',node.id),'solo last needle '+node.id);f.run(400);}walk(f,KOSCHEI_NEEDLE);check(f.now()-start<24000,'solo walking route leaves attack budget');f.c.damageMonster(f.e.needle,200,'p');f.step();check(f.e.state.countered&&f.e.state.mode==='stagger','needle interrupts ultimate');check(!f.e.state.hazards.size,'counter removes pending hitboxes');f.run(38000);check(!f.events.some(e=>e.type==='damage'&&e.at>start+32000),'cancelled finale never hits');
}
{
 const f=fixture();f.e.review('p',{action:'phase',phase:2});f.run(3650);f.e.body.hp=14000;f.e.review('p',{action:'skill',skill:'immortal-rebirth'});walk(f,KOSCHEI_RELICS[0]);check(f.e.interact('p','oak'),'rebirth next relic interrupt');check(!f.e.state.healing&&f.e.state.mode==='stagger','rebirth interrupted');const hp=f.e.body.hp;f.run(2500);check(f.e.body.hp===hp,'cancelled heal does not linger');
 const g=fixture();g.e.review('p',{action:'phase',phase:2});g.run(3650);g.e.body.hp=14000;g.e.review('p',{action:'skill',skill:'immortal-rebirth'});g.run(2100);check(g.e.body.hp>14000&&g.e.body.hp<=14700,'rebirth heals within phase ceiling');
}
{
 const f=fixture();f.e.review('p',{action:'skill',skill:'gravefrost-spear'});check(!f.e.start('gravefrost-spear','p'),'cooldown gate');f.state.players.delete('p');f.run(6000);check(f.e.state.mode==='dormant'&&!f.e.state.hazards.size&&f.e.state.relicStage===0,'leave resets encounter');
 const h={shape:'ring',x:24,y:24,toX:24,toY:24,radius:7,width:.5,angle:0,arc:0,startsAt:1000,endsAt:1900};check(!koscheiHit(h,{x:24,y:24},1000),'wave center safe');check(koscheiHit(h,{x:31.77,y:24},1900,1850),'outer band allowance');check(!koscheiHit(h,{x:31.79,y:24},1900,1850),'outside band safe');check(KOSCHEI_RELICS.every(n=>!isBlocked(getMap('frozen-necropolis'),n.x,n.y)),'all relic nodes walkable');
}
mkdirSync('apps/client/public/boss-review/koschei',{recursive:true});writeFileSync('apps/client/public/boss-review/koschei/clips.json',JSON.stringify(clips));writeFileSync(out+'/behavior.json',JSON.stringify({checks,result:'pass',stepMs:50,clips:clips.map(c=>({skill:c.skill,face:c.face,duration:c.duration,hazards:c.cues.length}))},null,2));console.log('PASS',checks,'Koschei behavior checks;88 recorded clips');
