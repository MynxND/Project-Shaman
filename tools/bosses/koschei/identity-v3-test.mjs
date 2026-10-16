import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {GameState,PlayerState} from '../../../packages/schema/dist/index.js';
import {getMap,newProfile,KOSCHEI_SKILLS,KOSCHEI_RELICS,KOSCHEI_NEEDLE,koscheiHit,FACINGS} from '../../../packages/shared/dist/index.js';
import {CombatSystem} from '../../../apps/server/dist/rooms/combat-system.js';
const out='docs/design/bosses/motion-identity-v3/koschei/evidence';mkdirSync(out,{recursive:true});
let checks=0;const check=(v,s)=>{assert(v,s);checks++;};
export function fixture() {
  let now = 1000; const state = new GameState(), profiles = new Map(), events = [], map = getMap('frozen-necropolis');
  const host = { map, state, now: () => now, rng: () => .5, profile: id => profiles.get(id), setProfile: (id, p) => profiles.set(id, p), vitals(id) { const p = profiles.get(id), s = state.players.get(id); if (p && s) { s.hp = p.hp; s.hpMax = p.hpMax; } }, broadcast: e => events.push({ ...e, at: now }), reduceCooldown() {} };
  const c = new CombatSystem(host), p = new PlayerState(); p.x = 24; p.y = 30; state.players.set('p', p);
  const profile = newProfile(map.spawn); profiles.set('p', profile); c.koschei.review('p', { action: 'prepare' });
  profile.hp = profile.hpMax = 100000; profiles.set('p', profile); host.vitals('p');
  const step = (ms = 50) => { now += ms; c.step(ms); }, run = ms => { for (let i = 0; i < ms; i += 50) step(); };
  return { c, e: c.koschei, p, state, profiles, events, map, now: () => now, step, run };
}

const phase=(f,n=3)=>{f.e.review('p',{action:'phase',phase:n});f.run(3650);};
{const f=fixture();phase(f);f.e.review('p',{action:'skill',skill:'deathstorm'});check(f.e.state.hazards.size===5,'storm originates at five remaining vessels');const first=[...f.e.state.hazards.values()][0];check(first.x===KOSCHEI_RELICS[0].x,'oak source');Object.assign(f.p,KOSCHEI_RELICS[0]);check(f.e.interact('p','oak'),'open next');f.step();check(f.e.state.hazards.size===4,'opening cancels source lane');}
{const f=fixture();phase(f);f.e.review('p',{action:'skill',skill:'throne-of-bones'});check([...f.e.state.hazards.values()].every(h=>h.radius===6&&h.x!==24||h.y!==24),'no global quadrant copy');check(f.e.state.hazards.size===5,'five vessel sectors');}
{const f=fixture();phase(f);f.e.review('p',{action:'skill',skill:'soul-severance'});check(f.e.state.hazards.size===1,'one committed defense not triple rush');const h=[...f.e.state.hazards.values()][0];check(h.toX===16&&h.toY===27,'defends oak instead of chasing player');Object.assign(f.p,KOSCHEI_RELICS[0]);f.e.interact('p','oak');f.step();check(f.e.state.mode==='stagger'&&!f.e.state.hazards.size,'relic interrupts defense');}
{const f=fixture();phase(f,2);f.e.body.hp-=500;f.e.review('p',{action:'skill',skill:'immortal-rebirth'});const h=[...f.e.state.hazards.values()][0];check(h.shape==='ritual'&&!koscheiHit(h,f.e.body,h.startsAt),'healing ritual is not false damage ring');f.run(1800);check(f.e.body.hp>14200,'heal occurs');Object.assign(f.p,KOSCHEI_RELICS[0]);f.e.interact('p','oak');check(f.e.state.mode==='stagger'&&!f.e.state.healing,'relic interrupt heal');}
{const f=fixture();phase(f);f.e.review('p',{action:'skill',skill:'the-last-needle'});for(const n of KOSCHEI_RELICS.slice(0,2)){Object.assign(f.p,n);check(f.e.interact('p',n.id),'ordered progress');f.run(400);}f.run(31300);const hazards=[...f.e.state.hazards.values()].filter(h=>h.skill==='the-last-needle');check(hazards.length===3&&hazards.every(h=>h.shape==='disk'),'unfinished three vessels erupt, no global refuge');f.run(8000);check(f.e.state.hazards.size===0&&f.e.state.mode==='idle','failure recovers');}
writeFileSync(out+'/behavior.json',JSON.stringify({checks,passed:true,limits:'server unit arrangement, not walking/group balance proof'},null,2));console.log('PASS',checks,'Koschei identity cases');
if(process.argv.includes('--record')){const clips=[];for(const[skill,s]of Object.entries(KOSCHEI_SKILLS))for(const face of FACINGS){const f=fixture();phase(f,s.phase);const a=Math.PI/2-FACINGS.indexOf(face)*Math.PI/4;f.p.x=f.e.body.x+Math.cos(a)*6;f.p.y=f.e.body.y+Math.sin(a)*6;f.e.review('p',{action:'skill',skill});const start=f.now(),duration=skill==='the-last-needle'?42000:10000,cues=new Map(),actor=[];for(let at=0;at<=duration;at+=50){for(const h of f.e.state.hazards.values())cues.set(h.id,{...h.toJSON(),warnAt:h.warnAt-start,startsAt:h.startsAt-start,endsAt:h.endsAt-start});actor.push({at,x:f.e.body.x,y:f.e.body.y,facing:f.e.body.facing,mode:f.e.state.mode,stage:f.e.state.ultimateStage});f.step();}clips.push({skill,face,duration,cues:[...cues.values()],actor});}writeFileSync('apps/client/public/boss-review/koschei/clips-v3.json',JSON.stringify(clips));console.log('Recorded',clips.length);}
