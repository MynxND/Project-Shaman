// Actual GameRoom transport, normal movement and basic attacks. DEV arranges guest phases only.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { GAME_ROOM, KOSCHEI_SKILLS, KOSCHEI_RELICS, KOSCHEI_NEEDLE, inKoscheiCourt } from '../../../packages/shared/dist/index.js';
const { Client } = createRequire(resolve('apps/client/package.json'))('@colyseus/sdk');
const sleep = ms => new Promise(r => setTimeout(r, ms)), port = Number(process.env.KOSCHEI_QA_PORT ?? 2606);
const extended = process.argv.includes('--extended');
const report = { arrangement: 'isolated actual GameRoom; unsaved guest, DEV pre-cast positions and phases; no post-cast teleport/invulnerability', uncertainty: '30Hz simulation,50ms schema patches,75ms observation; damage receipts ±125ms', cases: [], ai: [], failures: [], counterplay: null };
const path = 'docs/design/bosses/koschei/evidence/'+(extended?'network-extended.json':'network.json'); mkdirSync(resolve(path, '..'), { recursive: true });
const persist = () => writeFileSync(path, JSON.stringify(report, null, 2));
const server = spawn(process.execPath, ['apps/server/dist/index.js'], { env: { ...process.env, GAME_SERVER_PORT: String(port), NODE_ENV: 'development' }, stdio: ['ignore', 'pipe', 'pipe'] });
let room, seq = 0, hits = [], recording = false;
const p = () => room.state.players?.get(room.sessionId), boss = () => room.state.koschei?.get('koschei');
const command = d => room.send('koschei:review', d), move = (x, y) => room.send('move', { x, y, sequence: ++seq });
async function until(fn, label, ms = 7000) { const end = Date.now() + ms; while (Date.now() < end) { if (fn()) return; await sleep(25); } throw Error(label); }
async function setup(phase, x = 24, y = 30) {
  recording = false; room.send('attack:stop'); move(0, 0); command({ action: 'prepare' }); await sleep(170);
  await until(() => boss()?.mode === 'idle' && p().hp === 4000, 'prepare guest');
  if (phase > 1) { command({ action: 'phase', phase }); await until(() => boss().phase === phase && boss().mode === 'transition', 'phase'); await until(() => boss().mode !== 'transition', 'transition'); }
  command({ action: 'arrange', x, y }); await until(() => Math.hypot(p().x - x, p().y - y) < .02, 'pre-cast position'); hits = [];
}
async function walkTo(to, label) {
  const began = Date.now();
  while (Math.hypot(p().x - to.x, p().y - to.y) > .32) {
    const dx = to.x - p().x, dy = to.y - p().y, d = Math.hypot(dx, dy); move(dx / d, dy / d); await sleep(60);
    assert(inKoscheiCourt(p()), label + ': movement left court'); assert(Date.now() - began < 15000, label + ': stuck');
  }
  move(0, 0); await sleep(90);
}
function dodge(skill,t,pos){
 if(skill==='deathstorm')return pos.y>20.15?[0,-1]:[0,0];
 if(skill==='immortal-rebirth'||skill==='royal-necromancy')return pos.y<35?[0,1]:[0,0];
 if(skill==='throne-of-bones')return t<2050?[-1,-1]:pos.x<37?[1,0]:[0,0];
 if(skill==='cursed-needle'||skill==='soul-severance')return t<1600?[1,0]:t<3200?[0,-1]:t<4800?[-1,0]:t<6400?[0,1]:[1,0];
 return t<1100?[1,0]:[0,0];
}
try{
 await new Promise((ok,no)=>{const timer=setTimeout(()=>no(Error('boot timeout')),10000);server.stdout.on('data',b=>{if(b.toString().includes('listening')){clearTimeout(timer);ok();}});server.once('error',no);});
 room=await new Client('ws://localhost:'+port).joinOrCreate(GAME_ROOM,{mapId:'frozen-necropolis'});
 for(const type of ['profile','vitals','chat:message','skill','attack:error'])room.onMessage(type,()=>{});
 room.onMessage('combat',e=>{if(recording&&e.type==='damage')hits.push({at:boss()?.now,...e});});await until(()=>boss()&&p(),'room state');
 if(!extended)for(const[skill,rule]of Object.entries(KOSCHEI_SKILLS).filter(([id])=>id!=='the-last-needle'))for(const mode of['positive','walk-dodge']){
  const at=skill==='immortal-rebirth'?[24,28]:skill==='deathstorm'?[24,26]:skill==='throne-of-bones'?[30,24]:[24,30];
  await setup(rule.phase,...at);recording=true;const previousAction=boss().actionAt;command({action:'skill',skill});await until(()=>boss().actionAt>previousAction&&boss().skill===skill,skill+' start');const start=boss().actionAt,trail=[],cues=new Map(),duration=skill==='soul-severance'?8000:skill==='cursed-needle'?5500:skill==='deathstorm'?5200:skill==='throne-of-bones'?4800:3800;
  while(boss().now-start<duration){const t=boss().now-start;trail.push({at:t,x:p().x,y:p().y,hp:p().hp});for(const h of boss().hazards.values())cues.set(h.id,h.toJSON());const[dx,dy]=mode==='walk-dodge'?dodge(skill,t,p()):[0,0];move(dx,dy);await sleep(75);}move(0,0);recording=false;
  const damage=hits.filter(e=>e.target.id===room.sessionId).reduce((n,e)=>n+e.amount,0),stayedInCourt=trail.every(inKoscheiCourt);report.cases.push({skill,mode,damage,stayedInCourt,trail,cues:[...cues.values()],hits:structuredClone(hits)});if(mode==='positive'&&damage<=0)report.failures.push(skill+': positive missed');if(mode==='walk-dodge'&&damage)report.failures.push(skill+': dodge hit '+damage);if(!stayedInCourt)report.failures.push(skill+': left court');persist();console.log(skill,mode,damage);
 }
 if(!extended){
  await setup(3);recording=true;command({action:'skill',skill:'the-last-needle'});await until(()=>boss().mode==='ultimate','ultimate start');const began=boss().actionAt,route=[];
  for(const node of KOSCHEI_RELICS){await walkTo(node,node.id);room.send('koschei:relic',node.id);await until(()=>boss().relicStage>=KOSCHEI_RELICS.indexOf(node)+1,'open '+node.id);route.push({relic:node.id,at:boss().now-began,x:p().x,y:p().y});}
  await walkTo({x:KOSCHEI_NEEDLE.x,y:KOSCHEI_NEEDLE.y+1.1},'needle approach');room.send('attack',{monsterId:'koschei-hidden-needle'});await until(()=>boss().countered||boss().ultimateStage===5,'normal attacks break needle',24000);room.send('attack:stop');report.counterplay={countered:boss().countered,elapsed:boss().now-began,route,needleHp:room.state.monsters.get('koschei-hidden-needle')?.hp,hits:structuredClone(hits)};if(!boss().countered)report.failures.push('solo ultimate not countered');persist();recording=false;
  for(const phase of[1,2,3]){await setup(phase);command({action:'auto'});const start=boss().now,skills=new Set(),trail=[];while(boss().now-start<11000){skills.add(boss().skill);trail.push({at:boss().now,mode:boss().mode,hp:p().hp});await sleep(100);}report.ai.push({phase,skills:[...skills].filter(Boolean),alive:!p().dead,samples:trail});persist();}
 }
 if(extended){
  const faces=['south','south-east','east','north-east','north','north-west','west','south-west'];
  for(let i=0;i<8;i++){const a=Math.PI/2-i*Math.PI/4;await setup(1,24+Math.cos(a)*6,20+Math.sin(a)*6);recording=true;command({action:'skill',skill:'soul-lance'});await until(()=>boss().skill==='soul-lance','face start');const start=boss().actionAt;await until(()=>boss().now-start>2000,'face impact');recording=false;const body=[...room.state.monsters.values()].find(m=>m.kind==='koschei'),damage=hits.filter(e=>e.target.id===room.sessionId).reduce((n,e)=>n+e.amount,0);assert.equal(body.facing,faces[i]);assert.equal(damage,80);report.cases.push({skill:'soul-lance',facing:faces[i],damage});persist();}
  for(const mode of['outside-refuge','walk-to-refuge']){await setup(3);recording=true;command({action:'skill',skill:'the-last-needle'});await until(()=>boss().mode==='ultimate','ultimate start');const start=boss().actionAt;if(mode==='walk-to-refuge')await walkTo({x:24,y:35},'refuge');await until(()=>boss().now-start>35000,'finale',38000);recording=false;const damage=hits.filter(e=>e.target.id===room.sessionId).reduce((n,e)=>n+e.amount,0);assert.equal(damage,mode==='outside-refuge'?190:0);report.cases.push({skill:'the-last-needle',mode,damage});persist();}
  await setup(1);await walkTo(KOSCHEI_RELICS[0],'oak');room.send('koschei:relic','oak');await until(()=>boss().relicStage===1,'oak opened');const other=await new Client('ws://localhost:'+port).joinOrCreate(GAME_ROOM,{mapId:'frozen-necropolis'});for(const type of['profile','vitals','chat:message','skill','combat'])other.onMessage(type,()=>{});await until(()=>other.state.koschei?.get('koschei')?.relicStage===1,'latejoin relic');command({action:'phase',phase:3});other.send('koschei:relic','chest');await sleep(250);assert.equal(boss().phase,1);assert.equal(boss().relicStage,1);report.cases.push({kind:'latejoin-review-gate',phase:boss().phase,relicStage:boss().relicStage});await other.leave();persist();
 }
 assert.equal(report.failures.length,0,report.failures.join('\n'));console.log('PASS Koschei actual-room suite');
}finally{recording=false;persist();await room?.leave();server.kill();}
