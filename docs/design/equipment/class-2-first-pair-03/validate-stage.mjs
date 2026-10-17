import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {sharp, hash} from '../../../../tools/rig/body-eight-lib.mjs';

const root = 'docs/design/equipment/class-2-first-pair-03/';
const json = async path => JSON.parse(await readFile(path, 'utf8'));
const repairs = spawnSync(process.execPath, [root + 'verify-repair.mjs'], {encoding:'utf8'});
assert.equal(repairs.status, 0, repairs.stderr || repairs.stdout);
const metadata = await json(root + 'axe-orientation-metadata.json');
const source = await readFile('apps/client/public/assets/equipment/axe-juggernaut/south.png');
assert.equal(hash(source), metadata.sourceSha256, 'Production axe source drift');
const candidate = await readFile(root + 'axe-south-outward.png');
const sm = await sharp(source).metadata(), cm = await sharp(candidate).metadata();
assert.equal(cm.width, sm.width); assert.equal(cm.height, sm.height);
const a = await sharp(source).ensureAlpha().raw().toBuffer();
const b = await sharp(candidate).ensureAlpha().raw().toBuffer();
for (let y=0; y<sm.height; y++) for (let x=0; x<sm.width; x++) {
  const i=(y*sm.width+x)*4, j=(y*sm.width+sm.width-1-x)*4;
  assert.ok(b.subarray(i,i+4).equals(a.subarray(j,j+4)), `Axe reflection mismatch at ${x},${y}`);
}
assert.equal(metadata.correctedGripX, 1-metadata.originalGripX);
const head = await readFile('apps/client/public/assets/character-v3/head-eight-01/south.png');
assert.equal(hash(head), '1ac5ca0956848a2886484a8955e3d4d5f4206bc513c96581b55ade60bf6a4215');
const audit = spawnSync(process.execPath, [root+'rig-audit/audit.mjs'], {
  encoding:'utf8', env:{...process.env, AXE_OUTWARD:'1'},
});
assert.equal(audit.status, 0, audit.stderr || audit.stdout);
const report = await json(root+'axe-outward/report.json');
const axe = report.results.juggernaut.gear.find(g=>g.texture==='gear:axe-juggernaut:south');
assert.ok(axe, 'Missing SOUTH axe placement');
assert.equal(axe.origin[0], metadata.correctedGripX);
assert.equal(axe.origin[1], .8);
assert.deepEqual(axe.scale, [.7,.7]);
assert.deepEqual(report.results.juggernaut.hands[0].grip, [41.5,80]);
const repairsReport=await json(root+'repair-verification.json');
for (const id of ['achan','juggernaut']) {
  assert.equal(report.results[id].candidateSha256, repairsReport.results[id].sha256);
}
const directions=['south','south-east','east','north-east','north','north-west','west','south-west'];
const result={
  scope:'Offline male SOUTH static candidates only; not a production manifest or runtime certification',
  staticChecksPassed:true,
  checks:['body repair bounds/contact/ground/source hash','head source hash','axe source hash/dimensions/exact reflection','mirrored axe grip origin/scale/hand pin','audit candidate hashes'],
  candidateAxeSha256:hash(candidate),
  coverage:Object.fromEntries(['achan-saiyasat','juggernaut'].map(id=>[id,Object.fromEntries(directions.map(d=>[d,{idle:d==='south'?'one static candidate':'missing',walk:'missing',attack:'missing',cast:'missing',hurt:'unsupported by current V3',death:'unsupported by current V3'}]))])),
  unresolved:['visual acceptance of repaired costume geometry','candidate-specific fingers-over-shaft overlays','complete neck/skin protection masks','outfit architecture and appearance policy approval','live Phaser/SSR review','seven remaining static directions','supported action clips'],
  runtimeCompatible:false,
  paidGenerationsThisStep:0,
};
await writeFile(root+'stage-validation.json', JSON.stringify(result,null,2)+'\n');
console.log('PASS: offline SOUTH body/head/axe invariants. Other directions and motion remain missing.');
