/** Actual three SDK sessions: setup is DEV-only; movement and effigy damage use normal messages. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {mkdirSync,writeFileSync} from 'node:fs';
import {GAME_ROOM,CALON_CONNECTIONS,CALON_SOURCE,CALON_WELLS} from '../../../packages/shared/dist/index.js';
const {Client}=createRequire(resolve('apps/client/package.json'))('@colyseus/sdk');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),port=2616,rooms=[],hits=[],report={cases:[],limits:'DEV HP4000 is collision/counter QA, not party balance or a normal-character victory'};
const server=spawn(process.execPath,['apps/server/dist/index.js'],{env:{...process.env,GAME_SERVER_PORT:String(port),NODE_ENV:'development'},stdio:['ignore','pipe','pipe']});
const boss=()=>rooms[0].state.calon.get('calon-arang'),player=i=>rooms[i].state.players.get(rooms[i].sessionId),cmd=(i,m)=>rooms[i].send('calon:review',m),seq=[0,0,0],move=(i,x,y)=>rooms[i].send('move',{x,y,sequence:++seq[i]});
async function until(fn,label,ms=8000){const end=Date.now()+ms;while(Date.now()<end){if(fn())return;await sleep(30);}throw Error(label);}
async function walk(i,to){const start=Date.now();while(Math.hypot(player(i).x-to.x,player(i).y-to.y)>.3){const p=player(i),dx=to.x-p.x,dy=to.y-p.y,d=Math.hypot(dx,dy);move(i,dx/d,dy/d);await sleep(60);assert(Date.now()-start<13000,'movement stuck');}move(i,0,0);await sleep(90);}
async function setup(phase){for(let i=0;i<3;i++){move(i,0,0);rooms[i].send('attack:stop');cmd(i,{action:'prepare'});await sleep(120);}if(phase>1){cmd(0,{action:'phase',phase});await until(()=>boss().phase===phase,'phase');await sleep(3700);}for(let i=0;i<3;i++)cmd(i,{action:'arrange',...(i<2?CALON_WELLS[i]:{x:24,y:36})});await sleep(200);}
try{
 await new Promise((ok,no)=>{const timer=setTimeout(()=>no(Error('boot')),12000);server.stdout.on('data',b=>{if(b.toString().includes('listening')){clearTimeout(timer);ok();}});server.once('error',no);});
 const sdk=new Client('ws://localhost:'+port);rooms.push(await sdk.create(GAME_ROOM,{mapId:'girah-ruined-temple',calonPartyReview:true}));for(let i=1;i<3;i++)rooms.push(await sdk.joinById(rooms[0].roomId));
 for(const r of rooms)for(const type of['profile','vitals','chat:message','skill','attack:error','combat'])r.onMessage(type,()=>{});
 await until(()=>rooms.every((r,i)=>r.state.players?.get(r.sessionId))&&boss(),'schema');
 rooms[0].onMessage('combat',e=>{if(e.type==='damage')hits.push({...e,at:boss().now});});
 for(const phase of(process.argv.includes('--phase3')?[3]:[1,2,3])){
  await setup(phase);if(phase===3)cmd(0,{action:'skill',skill:'night-of-a-thousand-curses'});
  await sleep(180);const start=boss().now;
  const nodes=CALON_CONNECTIONS.filter(n=>boss().connections.has(n.id));
  await Promise.all([0,1].map(async i=>{for(const n of nodes.filter((_,j)=>j%2===i)){await walk(i,n);rooms[i].send('attack',{monsterId:'calon-link-'+n.id});await until(()=>boss().connections.get(n.id).broken,'sever '+n.id,10000);rooms[i].send('attack:stop');}await walk(i,CALON_WELLS[i]);}));
  for(let i=0;i<2;i++)if(boss().infections.has(rooms[i].sessionId))rooms[i].send('calon:interact','cleanse');await sleep(200);await until(()=>[...boss().wells.values()].every(w=>w.blockedUntil<=boss().now),'wells recover',11000);await walk(2,CALON_SOURCE);report.cases.push({kind:'pre-channel',phase,elapsed:boss().now-start,infections:[...boss().infections.keys()],west:boss().westKeeper,east:boss().eastKeeper,mode:boss().mode,uncut:[...boss().connections.values()].filter(n=>!n.broken).length,wells:[...boss().wells.values()].map(w=>w.toJSON()),players:rooms.map((r,i)=>({id:r.sessionId,x:player(i).x,y:player(i).y,dead:player(i).dead}))});rooms[2].send('calon:interact','purify');await until(()=>boss().exposedUntil>boss().now,'coordinated purification',5000);
  assert.equal(boss().mode,'stagger');if(phase===3)assert(boss().countered,'ultimate counter');
  report.cases.push({phase,elapsed:boss().now-start,countered:boss().countered,exposedUntil:boss().exposedUntil,players:rooms.map((r,i)=>({id:r.sessionId,x:player(i).x,y:player(i).y,hp:player(i).hp}))});console.log('PASS party phase',phase);
 }
 if(process.argv.includes('--failure')){await setup(3);cmd(0,{action:'skill',skill:'night-of-a-thousand-curses'});await until(()=>[...boss().hazards.values()].some(h=>h.shape==='quarantine'),'ultimate published refuge',40000);const h=[...boss().hazards.values()].find(h=>h.shape==='quarantine'),start=hits.length;await Promise.all([0,1].map(i=>walk(i,{x:h.toX,y:h.toY})));await until(()=>boss().now>h.endsAt+150,'quarantine contact',15000);report.failureHits=hits.slice(start);const contact=hits.slice(start).filter(e=>e.amount===180);assert(!contact.some(e=>e.target.id===rooms[0].sessionId||e.target.id===rooms[1].sessionId),'walking refuge protects');assert(contact.some(e=>e.target.id===rooms[2].sessionId),'outside refuge hit');report.cases.push({kind:'ultimate failure refuge',protected:2,outsideHit:1,contact});}
 report.passed=true;
}finally{const out='docs/design/bosses/calon-arang/mechanics-v2/evidence';mkdirSync(out,{recursive:true});writeFileSync(out+'/party-network.json',JSON.stringify(report,null,2));await Promise.all(rooms.map(r=>r.leave()));server.kill();}
