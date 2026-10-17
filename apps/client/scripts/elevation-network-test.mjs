import assert from 'node:assert/strict';
import {getMap,terrainHeight} from '@shaman/shared';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {Client} from '@colyseus/sdk';
import {writeFile,mkdir} from 'node:fs/promises';
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),rooms=[],events=[];
const server=spawn(process.execPath,[fileURLToPath(new URL('../../server/dist/index.js',import.meta.url))],{env:{...process.env,GAME_SERVER_PORT:'2581'},stdio:['ignore','pipe','pipe']});
let errors='';server.stderr.on('data',d=>errors+=d);
try {
 await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error(errors||'server timeout')),15000);server.stdout.on('data',d=>{if(d.toString().includes('Shaman server listening')){clearTimeout(t);resolve()}})});
 const c=new Client('ws://localhost:2581');for(let i=0;i<2;i++)rooms.push(await c.joinOrCreate('game',{mapId:'umbral-elevation-lab',bodyType:i?'female':'male'}));
 await sleep(300);assert.equal(rooms[0].roomId,rooms[1].roomId);assert.equal(rooms[0].state.players.size,2);let seq=0;
 async function drive(axis,target){const start=Date.now();while(Date.now()-start<16000){let complete=true;for(const r of rooms){const p=r.state.players.get(r.sessionId),d=target-p[axis];if(Math.abs(d)>.025){complete=false;r.send('move',{x:axis==='x'?Math.max(-1,Math.min(1,d*2)):0,y:axis==='y'?Math.max(-1,Math.min(1,d*2)):0,sequence:++seq,elevation:999});}else r.send('move',{x:0,y:0,sequence:++seq});}if(complete){await sleep(200);return}await sleep(45)}throw Error('stuck '+axis+' '+target+' '+JSON.stringify(rooms.map(r=>{const p=r.state.players.get(r.sessionId);return{x:p.x,y:p.y,z:p.elevation}})))}
 async function check(label,z){for(const r of rooms)r.send('move',{x:0,y:0,sequence:++seq});await sleep(250);const states=rooms.map(r=>[...r.state.players.entries()].map(([id,p])=>({id,x:p.x,y:p.y,z:p.elevation})));for(let i=0;i<2;i++){const a=states[0].find(p=>p.id===rooms[i].sessionId),b=states[1].find(p=>p.id===rooms[i].sessionId);assert(Math.abs(a.x-b.x)<.1&&Math.abs(a.y-b.y)<.1);assert(Math.abs(a.z-z)<.05&&Math.abs(a.z-b.z)<.01)}events.push({label,states});console.log('PASS',label,states[0].map(p=>({x:p.x,y:p.y,z:p.z})));}
 await drive('x',42.25);await drive('y',50);await check('both lower Z0',0);await drive('y',36);await check('both middle Z1',1);await drive('y',19.7);await check('both upper Z2',2);await drive('y',50);await check('both descend Z2 -> Z1 -> Z0',0);
 await drive('x',45);await drive('y',46);
 for(let i=0;i<45;i++){for(const r of rooms)r.send('move',{x:0,y:-1,sequence:++seq,elevation:999});await sleep(45)}
 await check('both blocked at irregular cliff',0);
 for(const r of rooms){const p=r.state.players.get(r.sessionId);assert.equal(terrainHeight(getMap('umbral-elevation-lab'),p.x,p.y),0);assert(terrainHeight(getMap('umbral-elevation-lab'),p.x,p.y-.3)>0)};
 const out=new URL('../../../docs/design/umbral-mountain-art-02/',import.meta.url);await mkdir(out,{recursive:true});await writeFile(new URL('two-clients.json',out),JSON.stringify({passed:true,events,scope:'Two real SDK clients concurrently ascend/descend; spoofed elevation ignored; no position injection'},null,2));
}finally{await Promise.all(rooms.map(r=>r.leave().catch(()=>{})));server.kill()}



