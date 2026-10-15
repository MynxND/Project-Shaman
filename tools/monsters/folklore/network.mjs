import assert from'node:assert/strict';import{spawn}from'node:child_process';import{createRequire}from'node:module';import{resolve}from'node:path';import{readFile,writeFile}from'node:fs/promises';
import{MAPS,MONSTERS,GAME_ROOM,isBlocked,elevationPassage,terrainHeight}from'../../../packages/shared/dist/index.js';
const{Client}=createRequire(resolve('apps/client/package.json'))('@colyseus/sdk'),port=2598,rooms=[],sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn(process.execPath,['apps/server/dist/index.js'],{env:{...process.env,GAME_SERVER_PORT:String(port),NODE_ENV:'development'},stdio:['ignore','pipe','pipe']});let errors='';server.stderr.on('data',b=>errors+=b);let seq=0;
const wait=async(fn,label,limit=10000)=>{const t=Date.now();while(Date.now()-t<limit){const v=fn();if(v)return v;await sleep(35);}throw Error('timeout '+label);};
function path(map,a,b){const W=map.width*2+1,H=map.height*2+1,prev=new Int32Array(W*H).fill(-1),start=Math.round(a.y*2)*W+Math.round(a.x*2),goal=Math.round(b.y*2)*W+Math.round(b.x*2),q=[start];prev[start]=start;for(let i=0;i<q.length;i++){const k=q[i];if(k===goal)break;const p={x:k%W/2,y:Math.floor(k/W)/2};for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const x=k%W+dx,y=Math.floor(k/W)+dy,n=y*W+x;if(x<0||y<0||x>=W||y>=H||prev[n]!==-1)continue;const to={x:x/2,y:y/2};if([.25,.5,.75,1].some(t=>[[0,0],[-.22,0],[.22,0],[0,-.22],[0,.22]].some(([ox,oy])=>isBlocked(map,p.x+dx*.5*t+ox,p.y+dy*.5*t+oy)))||!elevationPassage(map,p,to))continue;prev[n]=k;q.push(n);}}assert(prev[goal]>=0,'route '+map.id);const points=[];for(let k=goal;;k=prev[k]){points.push({x:k%W/2,y:Math.floor(k/W)/2});if(k===start)break;}points.reverse();return points.filter((p,i)=>i===0||i===points.length-1||p.x-points[i-1].x!==points[i+1].x-p.x||p.y-points[i-1].y!==points[i+1].y-p.y);}
async function join(client,id,extra={}){const room=await client.joinOrCreate(GAME_ROOM,{mapId:id,...extra});rooms.push(room);const s={profile:null,last:null,travel:null,combat:[],casts:[],errors:[],samples:[]};room.onMessage('profile',d=>{s.profile=d.profile;s.last=d;});room.onMessage('travel',d=>s.travel=d);room.onMessage('combat',d=>s.combat.push(d));room.onMessage('skill',d=>s.casts.push(d));for(const k of ['vitals','notify'])room.onMessage(k,()=>{});for(const k of ['attack:error','skill:error'])room.onMessage(k,d=>s.errors.push(d));room.send('profile:get');await wait(()=>s.profile&&room.state.players.get(room.sessionId),'join '+id);assert.equal(room.state.mapId,id);return{room,s};}
async function walk(t,to){const map=MAPS[t.room.state.mapId];for(const p of path(map,t.room.state.players.get(t.room.sessionId),to).slice(1)){const here=t.room.state.players.get(t.room.sessionId),end=Date.now()+Math.max(20000,(Math.hypot(p.x-here.x,p.y-here.y)/4+8)*1000);while(!t.s.travel){const me=t.room.state.players.get(t.room.sessionId),dx=p.x-me.x,dy=p.y-me.y;if(Math.hypot(dx,dy)<.24)break;assert(Date.now()<end,'walking stalled '+JSON.stringify({p,x:me.x,y:me.y,elevation:me.elevation}));t.room.send('move',{x:Math.abs(dx)>.08?Math.sign(dx):0,y:Math.abs(dy)>.08?Math.sign(dy):0,sequence:++seq});if(map.elevation){assert(Math.abs(me.elevation-terrainHeight(map,me.x,me.y))<.03);t.s.samples.push(me.elevation);}await sleep(45);}if(t.s.travel)break;}t.room.send('move',{x:0,y:0,sequence:++seq});await sleep(120);}
const bindings=await import('../../../packages/shared/dist/folklore-releases.js');
try{
 await new Promise((ok,no)=>{const timer=setTimeout(()=>no(Error(errors||'startup')),10000);server.stdout.on('data',b=>{if(b.toString().includes('listening')){clearTimeout(timer);ok();}});server.once('error',no);});
 const client=new Client('ws://localhost:'+port),results=[];
 for(const id of Object.keys(bindings.FOLKLORE_BINDINGS)){
  const t=await join(client,id),map=MAPS[id],expected=map.spawnRegions.flatMap(r=>r.monsters).reduce((n,m)=>n+m.count,0);
  await wait(()=>t.room.state.monsters.size===expected,'resident count '+id);
  for(const b of bindings.FOLKLORE_BINDINGS[id])assert([...t.room.state.monsters.values()].some(m=>m.kind===b.kind),'missing '+b.kind);
  assert([...t.room.state.monsters.values()].every(m=>!isBlocked(map,m.x,m.y)));
  results.push({map:id,residents:expected});console.log('PASS real room',id,expected);
  await t.room.leave();rooms.splice(rooms.indexOf(t.room),1);
 }
 const t=await join(client,'lantern-paddy');t.room.send('dev:level',{});await wait(()=>t.s.profile.level>=60,'combat fixture');
 const [targetId,target]=[...t.room.state.monsters.entries()].find(([id,m])=>m.kind==='phi-pop');
 await walk(t,{x:target.x,y:target.y+1});t.room.send('attack',{monsterId:targetId});
 await wait(()=>t.s.combat.some(e=>e.type==='death'&&e.target?.id===targetId),'folklore death',30000);t.room.send('attack:stop',{});
 assert(t.s.combat.some(e=>e.type==='damage'&&e.target?.id===targetId));
 await writeFile('docs/design/monsters/folklore-01/network.json',JSON.stringify({maps:results,serverDeathAndDamage:true},null,2));
 console.log('PASS folklore damage/death and all17 authoritative rooms');
}finally{await Promise.all(rooms.map(r=>r.leave().catch(()=>{})));server.kill();}
