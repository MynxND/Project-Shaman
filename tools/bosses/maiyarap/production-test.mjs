import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {writeFileSync} from 'node:fs';
const {Client}=createRequire(resolve('apps/client/package.json'))('@colyseus/sdk');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn(process.execPath,['apps/server/dist/index.js'],{env:{...process.env,GAME_SERVER_PORT:'2605',NODE_ENV:'production'},stdio:['ignore','pipe','pipe']});
let room;
try{
  await new Promise((ok,no)=>{const timer=setTimeout(()=>no(Error('production boot timeout')),8000);server.stdout.on('data',b=>{if(b.toString().includes('listening')){clearTimeout(timer);ok();}});server.once('error',no);});
  room=await new Client('ws://localhost:2605').joinOrCreate('game',{mapId:'maiyarap-palace'});
  for(const type of ['profile','vitals','skill','combat','chat:message'])room.onMessage(type,()=>{});
  for(let i=0;i<100&&!room.state.maiyarap?.get('maiyarap');i++)await sleep(25);
  const b=()=>room.state.maiyarap.get('maiyarap'),p=()=>room.state.players.get(room.sessionId);
  room.send('maiyarap:review',{action:'prepare'});room.send('maiyarap:review',{action:'phase',phase:3});room.send('maiyarap:symbol','flame');await sleep(300);
  assert.equal(b().phase,1);assert.equal(b().mode,'dormant');assert.notEqual(p().hpMax,4000);assert.equal(p().y,42);assert.equal(b().sourceExposed,false);
  writeFileSync('docs/design/bosses/maiyarap/evidence/production.json',JSON.stringify({result:'pass',phase:b().phase,mode:b().mode,hpMax:p().hpMax,y:p().y,sourceExposed:b().sourceExposed,checks:['production rejects review prepare/phase','remote awake symbol cannot expose source']},null,2));
  console.log('PASS production review isolation and remote-symbol rejection');
}finally{
  // Unknown DEV messages can close a production socket before a leave acknowledgement.
  const leaving=room?.leave().catch(()=>{});server.kill();room?.connection?.close();
  await Promise.race([leaving??Promise.resolve(),sleep(1000)]);
}
