import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {writeFileSync} from 'node:fs';
const {Client}=createRequire(resolve('apps/client/package.json'))('@colyseus/sdk');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn(process.execPath,['apps/server/dist/index.js'],{env:{...process.env,GAME_SERVER_PORT:'2607',NODE_ENV:'production'},stdio:['ignore','pipe','pipe']});
let room;
try{
  await new Promise((ok,no)=>{const timer=setTimeout(()=>no(Error('production boot timeout')),8000);server.stdout.on('data',b=>{if(b.toString().includes('listening')){clearTimeout(timer);ok();}});server.once('error',no);});
  room=await new Client('ws://localhost:2607').joinOrCreate('game',{mapId:'frozen-necropolis'});
  for(const type of ['profile','vitals','skill','combat','chat:message'])room.onMessage(type,()=>{});
  for(let i=0;i<100&&!room.state.koschei?.get('koschei');i++)await sleep(25);
  const b=()=>room.state.koschei.get('koschei'),p=()=>room.state.players.get(room.sessionId);
  room.send('koschei:review',{action:'prepare'});room.send('koschei:review',{action:'phase',phase:3});room.send('koschei:relic','egg');await sleep(300);
  assert.equal(b().phase,1);assert.equal(b().mode,'dormant');assert.notEqual(p().hpMax,4000);assert.equal(p().y,42);assert.equal(b().needleExposed,false);
  writeFileSync('docs/design/bosses/koschei/evidence/production.json',JSON.stringify({result:'pass',phase:b().phase,mode:b().mode,hpMax:p().hpMax,y:p().y,needleExposed:b().needleExposed,checks:['production rejects review prepare/phase','remote unopened relic cannot expose needle']},null,2));
  console.log('PASS production review isolation and remote-relic rejection');
}finally{
  // Unknown DEV messages can close a production socket before a leave acknowledgement.
  const leaving=room?.leave().catch(()=>{});server.kill();room?.connection?.close();
  await Promise.race([leaving??Promise.resolve(),sleep(1000)]);
}
