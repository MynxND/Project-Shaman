import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {createRequire} from 'node:module';import {resolve} from 'node:path';
import {GAME_ROOM,FACINGS,SHUTEN_ID} from '../../packages/shared/dist/index.js';
const {Client}=createRequire(resolve('apps/client/package.json'))('@colyseus/sdk');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn){for(let i=0;i<150;i++){if(fn())return;await sleep(30);}throw Error('state timeout');}
const server=spawn(process.execPath,['apps/server/dist/index.js'],{env:{...process.env,GAME_SERVER_PORT:'2599',NODE_ENV:'development'},stdio:['ignore','pipe','pipe']});let a,b;
try{
 await new Promise((ok,no)=>{const timer=setTimeout(()=>no(Error('boot timeout')),8000);server.stdout.on('data',data=>{if(data.toString().includes('listening')){clearTimeout(timer);ok();}});});
 const client=new Client('ws://localhost:2599');a=await client.joinOrCreate(GAME_ROOM,{mapId:'mount-oe-fortress'});for(const t of ['combat','profile','vitals','chat:message','skill'])a.onMessage(t,()=>{});
 await until(()=>a.state?.bosses?.has(SHUTEN_ID));a.send('boss:review',{action:'prepare'});await until(()=>a.state.players.get(a.sessionId)?.hpMax===4000);
 for(const [i,face]of FACINGS.entries()){const angle=Math.PI/2-i*Math.PI/4;a.send('boss:review',{action:'aim',face,skill:'oni-crusher'});await until(()=>Math.abs(a.state.players.get(a.sessionId).x-(24+Math.cos(angle)*3))<.02&&Math.abs(a.state.players.get(a.sessionId).y-(20+Math.sin(angle)*3))<.02);}
 a.send('boss:review',{action:'phase',phase:3});await until(()=>a.state.bosses.get(SHUTEN_ID).phase===3);await sleep(3300);
 for(const [i,face]of FACINGS.entries()){const angle=Math.PI/2-i*Math.PI/4;a.send('boss:review',{action:'aim',face,skill:'wrath-severed-king'});await until(()=>Math.abs(a.state.players.get(a.sessionId).x-(24+Math.cos(angle)*3))<.02&&Math.abs(a.state.players.get(a.sessionId).y-(14+Math.sin(angle)*3))<.02);}
 const before={x:a.state.players.get(a.sessionId).x,y:a.state.players.get(a.sessionId).y};a.send('boss:review',{action:'aim',face:'invalid',skill:'oni-crusher'});await sleep(150);assert.deepEqual({x:a.state.players.get(a.sessionId).x,y:a.state.players.get(a.sessionId).y},before);
 b=await client.joinById(a.roomId,{});for(const t of ['combat','profile','vitals','chat:message','skill'])b.onMessage(t,()=>{});await until(()=>a.state.players.size===2);a.send('boss:review',{action:'aim',face:'east',skill:'oni-crusher'});await sleep(150);assert.deepEqual({x:a.state.players.get(a.sessionId).x,y:a.state.players.get(a.sessionId).y},before,'multi-client aim rejected');
 console.log('PASS real GameRoom: all 8 body + 8 ultimate-head aim positions, invalid input and multiplayer review rejection');
}finally{await b?.leave();await a?.leave();server.kill();}
process.exit(0);
