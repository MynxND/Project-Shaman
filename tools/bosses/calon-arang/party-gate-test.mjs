import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {writeFileSync} from 'node:fs';
const {Client}=createRequire(resolve('apps/client/package.json'))('@colyseus/sdk'),rooms=[],sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn(process.execPath,['apps/server/dist/index.js'],{env:{...process.env,GAME_SERVER_PORT:'2617',NODE_ENV:'development'},stdio:['ignore','pipe','pipe']});
try{await new Promise((ok,no)=>{const timer=setTimeout(()=>no(Error('boot')),10000);server.stdout.on('data',b=>{if(b.toString().includes('listening')){clearTimeout(timer);ok();}});});const client=new Client('ws://localhost:2617');rooms.push(await client.create('game',{mapId:'girah-ruined-temple'}));for(let i=1;i<5;i++)rooms.push(await client.joinById(rooms[0].roomId));for(const r of rooms)for(const t of['profile','vitals','combat','chat:message'])r.onMessage(t,()=>{});let rejected=false;try{const extra=await client.joinById(rooms[0].roomId);await extra.leave();}catch{rejected=true;}assert(rejected,'sixth client rejected');await sleep(200);rooms[0].send('calon:review',{action:'prepare'});await sleep(200);const s=rooms[0].state.calon.get('calon-arang');assert.equal(s.mode,'dormant');assert.notEqual(rooms[0].state.players.get(rooms[0].sessionId).hpMax,4000);writeFileSync('docs/design/bosses/calon-arang/mechanics-v2/evidence/party-gates.json',JSON.stringify({passed:true,clients:5,sixthRejected:rejected,ordinaryMultiplayerReviewRejected:true},null,2));console.log('PASS five-client cap and ordinary-room QA gate');}
finally{await Promise.all(rooms.map(r=>r.leave()));server.kill();}
