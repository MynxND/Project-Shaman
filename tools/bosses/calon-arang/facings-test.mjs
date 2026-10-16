// Full actual-room timelines in8 facings. Split processes are isolated rooms/ports, not browser automation.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {writeFileSync} from 'node:fs';
import {CALON_SKILLS,FACINGS} from '../../../packages/shared/dist/index.js';
const{Client}=createRequire(resolve('apps/client/package.json'))('@colyseus/sdk'),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const part=Number(process.argv[2]??0),port=2613+part,report={part,step:'real30Hz simulation /50ms patches /50ms observations',cases:[]};
const output='docs/design/bosses/calon-arang/evidence/facings-'+part+'.json',save=()=>writeFileSync(output,JSON.stringify(report,null,2));
const server=spawn(process.execPath,['apps/server/dist/index.js'],{env:{...process.env,GAME_SERVER_PORT:String(port),NODE_ENV:'development'},stdio:['ignore','pipe','pipe']});const rooms=[];
async function until(fn,label,ms=7000){const end=Date.now()+ms;while(Date.now()<end){if(fn())return;await sleep(25);}throw Error(label);}
async function runFace(face){const room=await new Client('ws://localhost:'+port).create('game',{mapId:'girah-ruined-temple'});rooms.push(room);let hits=[];const b=()=>room.state.calon.get('calon-arang'),p=()=>room.state.players.get(room.sessionId),send=m=>room.send('calon:review',m);for(const t of['profile','vitals','skill','chat:message'])room.onMessage(t,()=>{});room.onMessage('combat',e=>{if(e.type==='damage'&&e.target.id===room.sessionId)hits.push({at:b().now,...e});});await until(()=>room.state.calon?.get('calon-arang')&&p(),'join');
 for(const[skill,rule]of Object.entries(CALON_SKILLS).filter((_,i)=>i%2===part)){send({action:'prepare'});await until(()=>b().mode==='idle'&&p().hp===4000,'prepare');if(rule.phase>1){send({action:'phase',phase:rule.phase});await until(()=>b().mode==='transition','phase');await until(()=>b().mode==='recovery','phase settle');}const a=Math.PI/2-FACINGS.indexOf(face)*Math.PI/4,x=24+Math.cos(a)*6,y=20+Math.sin(a)*6;send({action:'arrange',x,y});await until(()=>Math.hypot(p().x-x,p().y-y)<.02,'arrange');hits=[];send({action:'skill',skill});await until(()=>b().skill===skill&&['windup','ultimate'].includes(b().mode),'cast');const start=b().actionAt,cues=new Map(),stages=new Set();const body=[...room.state.monsters.values()].find(m=>m.kind==='calon-arang');assert.equal(body.facing,face);const duration=skill==='night-of-a-thousand-curses'?44500:skill==='soul-harvest'?8500:7500;
  while(b().now-start<duration){stages.add(b().ultimateStage);for(const h of b().hazards.values())cues.set(h.id,h.toJSON());await sleep(50);}
  assert(cues.size>0,skill+' cues');for(const hit of hits)assert([...cues.values()].some(h=>hit.at>=h.startsAt-125&&hit.at<=h.endsAt+125),'all damage inside active timestamps');if(skill==='night-of-a-thousand-curses')assert([1,2,3,4,5].every(n=>stages.has(n)),'all ultimate stages');report.cases.push({skill,face,phase:rule.phase,damage:hits.reduce((n,e)=>n+e.amount,0),hits,cues:[...cues.values()],stages:[...stages]});save();console.log(skill,face,'pass');
 }
 await room.leave();}
try{await new Promise((ok,no)=>{const timer=setTimeout(()=>no(Error('boot')),8000);server.stdout.on('data',s=>{if(s.toString().includes('listening')){clearTimeout(timer);ok();}});server.once('error',no);});const results=await Promise.allSettled(FACINGS.map(runFace));for(const r of results)if(r.status==='rejected')throw r.reason;console.log('PASS actual facing matrix part',part,report.cases.length);
}finally{save();for(const room of rooms){room.connection?.close();}server.kill();}
