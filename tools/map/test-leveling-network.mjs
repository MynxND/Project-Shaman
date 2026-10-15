import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {writeFile} from 'node:fs/promises';
import {MAPS,GAME_ROOM,isBlocked} from '../../packages/shared/dist/index.js';
const {Client}=createRequire(resolve('apps/client/package.json'))('@colyseus/sdk');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),port=2586,rooms=[],results=[];
const server=spawn(process.execPath,['apps/server/dist/index.js'],{env:{...process.env,GAME_SERVER_PORT:String(port)},stdio:['ignore','pipe','pipe']});
let errors='';server.stderr.on('data',b=>errors+=b);let seq=0;
const wait=async(fn,label,limit=8000)=>{const begin=Date.now();while(Date.now()-begin<limit){const v=fn();if(v)return v;await sleep(30);}throw Error('timeout '+label);};
function path(map,from,to){const w=map.width*2+1,h=map.height*2+1,prev=new Int32Array(w*h).fill(-1),start=Math.round(from.y*2)*w+Math.round(from.x*2),goal=Math.round(to.y*2)*w+Math.round(to.x*2),q=[start];prev[start]=start;
 for(let i=0;i<q.length;i++){const k=q[i];if(k===goal)break;const x=k%w,y=Math.floor(k/w);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,n=ny*w+nx;if(nx<0||ny<0||nx>=w||ny>=h||prev[n]!==-1||[.25,.5,.75,1].some(t=>isBlocked(map,(x+dx*t)/2,(y+dy*t)/2)))continue;prev[n]=k;q.push(n);}}
 assert(prev[goal]>=0,'route');const points=[];for(let k=goal;;k=prev[k]){points.push({x:k%w/2,y:Math.floor(k/w)/2});if(k===start)break;}points.reverse();return points.filter((p,i)=>i===0||i===points.length-1||p.x-points[i-1].x!==points[i+1].x-p.x||p.y-points[i-1].y!==points[i+1].y-p.y);
}
async function join(client,id,extra={}){const room=await client.joinOrCreate(GAME_ROOM,{mapId:id,...extra});rooms.push(room);const state={profile:null,travel:null};room.onMessage('profile',d=>state.profile=d.profile);room.onMessage('travel',d=>state.travel=d);for(const msg of ['vitals','combat','skill','notify'])room.onMessage(msg,()=>{});room.send('profile:get');await wait(()=>state.profile&&room.state.players.get(room.sessionId),'join '+id);assert.equal(room.state.mapId,id);return{room,state};}
async function walk(test,target){const m=MAPS[test.room.state.mapId],me=test.room.state.players.get(test.room.sessionId);for(const p of path(m,me,target).slice(1)){
 const deadline=Date.now()+30000;
 while(!test.state.travel){const me=test.room.state.players.get(test.room.sessionId),dx=p.x-me.x,dy=p.y-me.y;if(Math.hypot(dx,dy)<.12)break;assert(Date.now()<deadline,'walk timeout');test.room.send('move',{x:Math.abs(dx)>.07?Math.sign(dx):0,y:Math.abs(dy)>.07?Math.sign(dy):0,sequence:++seq});await sleep(35);}
 if(test.state.travel)break;
 }test.room.send('move',{x:0,y:0,sequence:++seq});}
try{
 await new Promise((ok,no)=>{const timer=setTimeout(()=>no(Error(errors||'startup')),10000);server.stdout.on('data',b=>{if(b.toString().includes('listening')){clearTimeout(timer);ok();}});server.once('error',no);});
 const client=new Client('ws://localhost:'+port);
 for(const[from,gate]of[['whispering-spiritwood','paddy-gate'],['lantern-paddy','north-gate'],['moon-mangrove','east-gate']]){
  let test=await join(client,from);const original=structuredClone(test.state.profile),p=MAPS[from].portals.find(p=>p.id===gate);
  await walk(test,{x:p.area.x+p.area.w/2,y:p.area.y+p.area.h/2});const ticket=await wait(()=>test.state.travel,'travel '+gate);
  const dest=await join(client,ticket.mapId,{ticket:ticket.ticket});await test.room.leave();rooms.splice(rooms.indexOf(test.room),1);
  const back=MAPS[ticket.mapId].portals.find(q=>q.id===p.to.portalId),arrived=dest.room.state.players.get(dest.room.sessionId);
  assert(Math.hypot(arrived.x-back.arrival.x,arrived.y-back.arrival.y)<.02);assert.deepEqual(dest.state.profile.stacks,original.stacks);assert.equal(dest.state.profile.silver,original.silver);
  await sleep(350);assert.equal(dest.state.travel,null,'no bounce');await wait(()=>dest.room.state.monsters.size>0,'monsters in '+ticket.mapId);
  await walk(dest,{x:back.area.x+back.area.w/2,y:back.area.y+back.area.h/2});const ret=await wait(()=>dest.state.travel,'return '+gate);assert.equal(ret.mapId,from);
  const returned=await join(client,from,{ticket:ret.ticket});assert.deepEqual(returned.state.profile.skills,original.skills);
  results.push({from,to:ticket.mapId,forward:true,return:true,profilePreserved:true,noBounce:true,monsters:true});console.log('PASS '+from+' ↔ '+ticket.mapId);
  await dest.room.leave();rooms.splice(rooms.indexOf(dest.room),1);await returned.room.leave();rooms.splice(rooms.indexOf(returned.room),1);
 }
 await writeFile('docs/design/maps/spiritwood-refinement-02/network.json',JSON.stringify(results,null,2));
}finally{await Promise.all(rooms.map(r=>r.leave().catch(()=>{})));server.kill();}
