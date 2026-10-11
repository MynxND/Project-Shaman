import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Client } from '@colyseus/sdk';
import { GAME_ROOM } from '../../../packages/shared/dist/index.js';
const server=spawn(process.execPath,[fileURLToPath(new URL('../../server/dist/index.js',import.meta.url))],{env:{...process.env,GAME_SERVER_PORT:'2581'},stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const rooms=[];let errors='';server.stderr.on('data',data=>errors+=data);
try {
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('server startup timeout '+errors)),10000);server.stdout.on('data',data=>{if(data.toString().includes('listening')){clearTimeout(timer);resolve();}});server.once('error',reject);});
  const client=new Client('ws://localhost:2581');
  const a=await client.joinOrCreate(GAME_ROOM); rooms.push(a);
  let profile, pending;
  a.onMessage('profile',data=>{profile=data.profile;if(pending && (!pending.expectsResult || data.result)){const resolve=pending.resolve;pending=null;resolve(data);}});
  const send=(type,message)=>new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{pending=null;reject(new Error('NPC response timeout'));},3000);
    pending={expectsResult:type==='npc',resolve:data=>{clearTimeout(timer);resolve(data);}};a.send(type,message);
  });
  await send('profile:get',{}); assert.equal(profile.silver,3000);
  const outOfRange=await send('npc',{npc:'herbalist',action:'buy',itemId:'potion-red',qty:1});
  assert.equal(outOfRange.result.error,'too-far');assert.equal(profile.silver,3000);
  let sequence=0;
  async function walkTo(x,y) {
    const started=Date.now();
    while(Date.now()-started<15000) {
      const me=a.state.players.get(a.sessionId);
      if(!me){await sleep(60);continue;}
      const dx=x-me.x,dy=y-me.y;
      if(Math.hypot(dx,dy)<0.25){a.send('move',{x:0,y:0,sequence:++sequence});await sleep(100);return;}
      a.send('move',{x:Math.abs(dx)>0.15?Math.sign(dx):0,y:Math.abs(dy)>0.15?Math.sign(dy):0,sequence:++sequence});
      await sleep(60);
    }
    throw new Error(`walk to ${x},${y} timed out`);
  }
  await walkTo(37,35);
  assert.ok((await send('npc',{npc:'keeper',action:'heal'})).result.ok);
  assert.equal(profile.hp,profile.hpMax);assert.equal(profile.sp,profile.spMax);
  assert.ok((await send('npc',{npc:'keeper',action:'save'})).result.ok);
  assert.ok(Math.hypot(profile.savePoint.x-37,profile.savePoint.y-35)<0.4);
  for(const p of [[40,37],[54,37],[54,33.5]])await walkTo(...p);
  assert.ok((await send('npc',{npc:'herbalist',action:'buy',itemId:'potion-red',qty:2})).result.ok);
  assert.equal(profile.silver,2900);assert.equal(profile.stacks.find(s=>s.itemId==='potion-red').quantity,7);
  const potion=profile.stacks.find(s=>s.itemId==='potion-red').uid;
  assert.ok((await send('npc',{npc:'herbalist',action:'sell',uid:potion,qty:1})).result.ok);
  assert.equal(profile.silver,2915);
  assert.equal((await send('npc',{npc:'herbalist',action:'heal'})).result.error,'bad-request');
  const b=await client.joinOrCreate(GAME_ROOM);rooms.push(b);let otherProfile;
  b.onMessage('profile',data=>otherProfile=data.profile);b.send('profile:get');await sleep(200);
  assert.equal(otherProfile.silver,3000);assert.ok(otherProfile.hp<otherProfile.hpMax,'services affect requester only');
  assert.equal(a.state.citizens.size,5);assert.equal(b.state.citizens.size,5);
  const previous=a.state.citizens.get('plaza-child').x;await sleep(1500);
  assert.ok(Math.abs(a.state.citizens.get('plaza-child').x-previous)>0.1,'citizen walks without player interaction');
  for(const [id,c] of a.state.citizens){const other=b.state.citizens.get(id);assert.ok(other);assert.ok(Math.hypot(c.x-other.x,c.y-other.y)<0.25,'both clients see same citizen positions');}
  assert.equal((await send('npc',{npc:'plaza-child',action:'talk'})).result.error,'bad-request','ambient citizens cannot be interacted with');
  console.log('PASS: live NPC range/role checks, heal/save, buy/sell, profile isolation, five autonomous citizens and two-client sync');
} finally {for(const room of rooms)await room.leave().catch(()=>{});server.kill();}
