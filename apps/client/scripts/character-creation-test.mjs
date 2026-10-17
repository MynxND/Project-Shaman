import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { Client } from '@colyseus/sdk';
import { HAIRSTYLES, HAIR_COLORS, SSR_DIRECTIONS, SSR_ACTION_IDS, encodeHead, decodeHead, ssrCompose } from '../../../packages/shared/dist/index.js';
const root = new URL('../public/', import.meta.url);
const read = path => JSON.parse(fs.readFileSync(new URL(path, root)));
const ids = read('assets/ssr/parts/index.json');
const parts = Object.fromEntries(ids.map(id => [id, read(`assets/ssr/parts/${id}.json`)]));
const names = new Set();
for (const p of Object.values(parts)) for (const image of p.images) {
  assert(!names.has(image.id), `duplicate texture key ${image.id}`); names.add(image.id);
  assert.equal(createHash('sha256').update(fs.readFileSync(new URL(image.url.slice(1), root))).digest('hex'), image.sha256);
}
for (const hair of HAIRSTYLES) for (const color of HAIR_COLORS) {
  const look = { hair: hair.id, hairColor: color.id, face: 'cold-detached' };
  assert.deepEqual(decodeHead(encodeHead(look)), look);
}
for (const id of ['golden-part','kid-clean','face-fit-short','eye-veil','korean-wolf','swept-spikes','curtain-gold']) {
  for (const facing of SSR_DIRECTIONS) for (const action of SSR_ACTION_IDS) {
    const items = ssrCompose(parts['body.medium-novice'], [parts['headBase.skin'], parts[`hairFront.${id}`], parts['face.cold-detached']], action, facing, 0);
    assert(items.some(i => i.part === `hairFront.${id}`), `${id} ${action} ${facing} lost hair`);
    assert(items.every(i => Number.isFinite(i.x) && Number.isFinite(i.y)));
  }
}
const client = new Client(process.env.CHARACTER_TEST_SERVER ?? 'ws://localhost:2567');
const rooms = [];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
try {
  const first = await client.joinOrCreate('game', { head: { hair:'korean-wolf', hairColor:'gray', face:'cold-detached' } }); rooms.push(first);
  const observer = await client.joinOrCreate('game'); rooms.push(observer);
  await sleep(200);
  assert.equal(observer.state.players.get(first.sessionId).head, 'korean-wolf.gray.cold-detached');
  for (const h of HAIRSTYLES) {
    const look = { hair:h.id, hairColor:'white', face:'teal-soft' };
    first.send('head', look); await sleep(120);
    assert.equal(observer.state.players.get(first.sessionId).head, encodeHead(look), h.id+' not synced');
  }
  first.send('head', { hair:'invalid', hairColor:'invalid', face:'invalid' }); await sleep(120);
  assert.equal(observer.state.players.get(first.sessionId).head, 'natural-short.white.neutral');
  for (const hair of ['side-sweep', 'spiky-up', 'high-topknot']) {
    assert(!HAIRSTYLES.some(h => h.id === hair));
    first.send('head', { hair, hairColor:'red', face:'cold-detached' }); await sleep(120);
    assert.equal(observer.state.players.get(first.sessionId).head, 'natural-short.red.cold-detached');
    assert.deepEqual(decodeHead(`${hair}.red.cold-detached`), {hair:'natural-short',hairColor:'red',face:'cold-detached'});
  }
  console.log(`PASS ${HAIRSTYLES.length} hairstyles, ${HAIR_COLORS.length} colours; PNG hashes; 8 directions × idle/walk/attack/cast; two-client appearance sync and invalid-input fallback`);
} finally { await Promise.all(rooms.map(room => room.leave())); }
