// Real transport/GameRoom test. Review commands arrange isolated unsaved-guest phases only;
// movement, hazards, damage, normal AI and collision run through the actual server.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {mkdirSync,writeFileSync} from 'node:fs';
import {GAME_ROOM,SHUTEN_ID,SHUTEN_SKILLS,inOeCourt} from '../../packages/shared/dist/index.js';
const {Client}=createRequire(resolve('apps/client/package.json'))('@colyseus/sdk');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const probeOnly=process.argv.includes('--probe'),port=Number(process.env.SHUTEN_QA_PORT??2601);
const out=resolve('docs/design/bosses/shuten-doji/combat-review/evidence/'+(probeOnly?'boundary-probe.json':'network.json'));
mkdirSync(resolve(out,'..'),{recursive:true});
const report={arrangement:'guest-only development commands; real authoritative GameRoom and movement',cases:[],ai:[],failures:[]};
const server=spawn(process.execPath,['apps/server/dist/index.js'],{env:{...process.env,GAME_SERVER_PORT:String(port),NODE_ENV:'development'},stdio:['ignore','pipe','pipe']});
let room,seq=0,events=[],running=false;
async function until(fn,label){for(let i=0;i<250;i++){if(fn())return;await sleep(20);}throw Error(label);}
const boss=()=>room.state.bosses.get(SHUTEN_ID),player=()=>room.state.players.get(room.sessionId);
const command=d=>room.send('boss:review',d),move=(x,y)=>room.send('move',{x,y,sequence:++seq});
const persist=()=>writeFileSync(out,JSON.stringify(report,null,2));
async function setup(phase,skill){
 if(player().dead)await until(()=>!player().dead,'natural respawn before next arranged case');
 running=false;move(0,0);command({action:'phase',phase:1});await until(()=>boss().phase===1&&boss().hp===14000,'reset');
 command({action:'prepare'});await until(()=>player().hp===4000&&Math.abs(player().y-24)<.01,'heal');
 if(phase>1){command({action:'phase',phase});await until(()=>boss().phase===phase,'phase');await until(()=>boss().mode!=='transition','transition complete');}
 command({action:'aim',face:'south',skill});await sleep(120);events=[];
}
const duration={'oni-crusher':2100,'demon-sake':5050,'mountain-stomp':3250,'oni-war-cry':1600,'hellfire-sweep':2300,'demon-legion':2400,'blood-moon-leap':4050,'cursed-head':1900,'headless-rampage':3050,'mount-oe-cataclysm':3800,'wrath-severed-king':8500};
function direction(skill,t){
 if(skill==='wrath-severed-king'){
  if(t<1100)return[1,-1];if(t>=2700&&t<3500)return[0,-1];if(t>=4600&&t<7350)return[1,0];return[0,0];
 }
 if(skill==='oni-war-cry'||skill==='demon-sake'||skill==='mount-oe-cataclysm'||skill==='blood-moon-leap'||skill==='cursed-head')return[1,0];
 return[0,1];
}
try{
 await new Promise((ok,no)=>{const timer=setTimeout(()=>no(Error('boot timeout')),8000);server.stdout.on('data',b=>{if(b.toString().includes('listening')){clearTimeout(timer);ok();}});server.once('error',no);});
 room=await new Client('ws://localhost:'+port).joinOrCreate(GAME_ROOM,{mapId:'mount-oe-fortress'});
 for(const type of ['profile','vitals','chat:message','skill'])room.onMessage(type,()=>{});
 room.onMessage('combat',e=>{if(running&&e.type==='damage'&&e.target?.id===room.sessionId)events.push({amount:e.amount,source:e.source,observedServerAt:boss().now,position:{x:player().x,y:player().y},hazards:[...boss().hazards.values()].map(h=>h.toJSON())});});
 await until(()=>room.state?.bosses?.has(SHUTEN_ID),'schema');
 // A player can stand beyond the old nominal warning while still inside its .3 body-contact allowance.
 await setup(1,'oni-crusher');move(0,.2);const probeMove=setInterval(()=>move(0,.2),100);try{await until(()=>player().y>=23.5,'boundary position');}finally{clearInterval(probeMove);move(0,0);}await sleep(100);
 command({action:'skill',skill:'oni-crusher'});await until(()=>boss().skill==='oni-crusher'&&boss().hazards.size,'probe cast');running=true;await sleep(1150);running=false;
 report.boundaryProbe={position:{x:player().x,y:player().y},events:structuredClone(events),description:'Nominal first cone radius3.4; server body allowance extends to3.7. Compare rendered warning to this real hit.'};persist();
 for(const [skill,rule] of probeOnly?[]:Object.entries(SHUTEN_SKILLS))for(const mode of ['stand','walk-dodge']){
  await setup(rule.phase,skill);command({action:'skill',skill});await until(()=>boss().skill===skill&&boss().actionAt>0,'cast');const start=boss().actionAt,trail=[],cues=new Map();running=true;
  while(boss().now-start<duration[skill]){
   const t=boss().now-start,p=player();trail.push({at:t,x:p.x,y:p.y,hp:p.hp});for(const h of boss().hazards.values())cues.set(h.id,h.toJSON());
   if(mode==='walk-dodge'){let[x,y]=direction(skill,t);if(p.x>38.5&&x>0||p.x<9.5&&x<0)x=0;if(p.y>36.5&&y>0||p.y<10.6&&y<0)y=0;move(x,y);}else if(skill==='mount-oe-cataclysm'&&t<700)move(-1,-1);else move(0,0);await sleep(75);
  }
  running=false;move(0,0);
  const result={skill,phase:rule.phase,mode,arrangement:skill==='mount-oe-cataclysm'&&mode==='stand'?'walk into first fixed fist marker, then stand':'normal aim arrangement',start,damage:events.reduce((n,e)=>n+e.amount,0),hits:structuredClone(events),trail,cues:[...cues.values()],stayedInArena:trail.every(inOeCourt)};
  const damaging=skill!=='demon-legion';
  if(mode==='stand'&&damaging&&!result.damage)report.failures.push(skill+': no stand damage observed');
  if(mode==='walk-dodge'&&damaging&&result.damage)report.failures.push(skill+': walking route took '+result.damage);
  if(!result.stayedInArena)report.failures.push(skill+': route left court');
  const earliest=Math.min(...result.cues.filter(h=>!['sake','portal','faces'].includes(h.effect)).map(h=>h.startsAt));
  if(events.some(e=>e.source?.includes('shuten-doji')&&e.observedServerAt+100<earliest))report.failures.push(skill+': damage before warning deadline');
  report.cases.push(result);persist();console.log(rule.phase,skill,mode,'damage',result.damage,'in court',result.stayedInArena);
 }
 for(const phase of probeOnly?[]:[1,2,3]){
  await setup(phase,phase===3?'headless-rampage':'oni-crusher');command({action:'ai'});running=true;const start=boss().now,seen=new Set(),samples=[];
  while(boss().now-start<27000){const b=boss();if(b.skill)seen.add(b.skill);if(b.headSkill)seen.add(b.headSkill);samples.push({at:b.now-start,phase:b.phase,mode:b.mode,skill:b.skill,headSkill:b.headSkill,hp:player().hp,hazards:b.hazards.size});await sleep(100);}
  running=false;report.ai.push({phase,skills:[...seen],samples,damage:events.reduce((n,e)=>n+e.amount,0),alive:!player().dead});persist();console.log('normal AI phase',phase,[...seen]);
 }
 if(probeOnly)assert(report.boundaryProbe.events.some(e=>e.amount===60),'real player just beyond old nominal line receives contact damage');
 else{assert.equal(report.cases.length,22);assert.equal(report.ai.length,3);assert.equal(report.failures.length,0,report.failures.join('\n'));}
 console.log(probeOnly?'PASS real-room boundary contact probe':'PASS three-phase real-room stand/dodge/AI review');
}finally{running=false;persist();await room?.leave();server.kill();}
