import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { stage } from './character_v2_hair_redesign.mjs';
import { load, json, rasterize, inspect, compose, manifestPath, ledgerPath } from './character_v2_long_hair.mjs';
import { decodePng, hash, BODY_SHA256 } from './prepare_character_v2_hair.mjs';
import { parseCharacterV2Manifest, v2ItemAssets } from '../../packages/shared/dist/character-v2.js';

const art = await json(stage + 'art.json');
const bodyBytes = await load('docs/design/character-v2/body-front-02/raw.png');
const body = await decodePng(bodyBytes);
const back = rasterize(art,'hairBack');
const front = rasterize(art,'hairFront');
const { composite, metrics } = inspect(art,back,front,body);
const latest = await json(manifestPath);
const current = latest.hairFitReview ? await json('docs/design/character-v2/hair-fit-front-01/manifest-before.json') : latest;
const require = createRequire(new URL('../../apps/client/package.json', import.meta.url));
const sharp = createRequire(require.resolve('next'))('sharp');

test('Original silver layers are hair-only, face-safe and genuinely split', () => {
  assert.equal(hash(bodyBytes),BODY_SHA256);
  assert.equal(metrics.protectedFeatureMismatch,0);
  assert.equal(metrics.scalpHoles,0);
  for (const pass of Object.values(metrics.passes)) {
    assert.equal(Object.keys(pass.colors).length,7);
    for (const key of ['hiddenRgb','partialAlpha','skinLikePixels','redPixels','sourceCopies']) assert.equal(pass[key],0);
  }
  assert.ok(!compose(body,back,front).equals(composite));
  assert.ok(!compose(front,body,back).equals(composite));
  const dirty = Buffer.from(front);
  dirty.set([...art.palette.O,255],(38*128+56)*4);
  assert.throws(()=>inspect(art,back,dirty,body),/Face feature/);
  const hidden = Buffer.from(back);
  hidden[0]=1;
  assert.throws(()=>inspect(art,hidden,front,body),/hiddenRgb/);
});

test('Published provenance and nearest diagnostics reproduce original authored pixels', async () => {
  const review = await json(stage+'review.json');
  assert.deepEqual(review.metrics,metrics);
  assert.equal(review.artSha256,hash(await load(stage+'art.json')));
  for (const [name,pixels] of [['hair-back',back],['hair-front',front],['composite-diagnostic',composite]]) {
    assert.ok((await decodePng(await load(stage+name+'.png'))).equals(pixels));
    if (name!=='composite-diagnostic') assert.equal(hash(await load(stage+name+'.png')),review.sources[name]);
  }
  for (const scale of [1,2,6]) {
    const pixels=await sharp(await load(stage+`composite-${scale}x.png`)).ensureAlpha().raw().toBuffer();
    const width=128*scale;
    assert.equal(pixels.length,width*width*4);
    for(let row=0;row<width;row++) for(let column=0;column<width;column++) {
      const offset=(Math.floor(row/scale)*128+Math.floor(column/scale))*4;
      assert.ok(pixels.subarray((row*width+column)*4,(row*width+column)*4+4).equals(composite.subarray(offset,offset+4)));
    }
  }
  assert.equal(review.creditsSpent,0);
  assert.equal(review.jobId,null);
  for(const key of ['hairVisualApproved','userVisualAccepted','productionReady']) assert.equal(review[key],false);
});

test('All four bodies, rejected hair PNGs and paid ledger remain byte-exact',async()=>{
  for(const [path,expected] of Object.entries(await json(stage+'frozen-hashes.json'))) assert.equal(hash(await load(path)),expected,path);
  const ledger=await json(ledgerPath);
  assert.equal(ledger.spent,20);
  assert.equal(ledger.cap,20);
  assert.equal(ledger.remainingUncommitted,0);
});

test('Saved browser evidence covers real sorted pixels and toggles at all three viewports',async()=>{
  const evidence=await json(stage+'browser-evidence.json');
  assert.equal(evidence.results.length,15);
  assert.equal(evidence.actualViewportMatchedRequestedBeforeCapture,true);
  assert.equal(evidence.imageSmoothingEnabledAllCases,false);
  assert.equal(evidence.fullVisualAcceptedAllCases,false);
  assert.equal(evidence.responsiveScreenshotFidelityVerified,false);
  assert.equal(evidence.screenshotsActuallyInspected,true);
  for(const [viewport] of Object.entries(evidence.viewports)){
    const cases=evidence.results.filter(record=>record[0]===viewport);
    assert.deepEqual(cases.map(record=>[record[1],record[2]]),[['south',true],['south',false],['east',false],['north',false],['west',false]]);
    for(const record of cases){
      assert.ok(record[3]>0);
      assert.equal(record[4],0);
      assert.equal(record[5],0);
      assert.equal(record[6],false);
      assert.equal(record[7],record[1]!=='south');
      assert.equal(record[8],record[1]==='south'?art.itemId:'');
    }
    for(const state of ['on','off']) assert.equal((await sharp(await load(stage+`browser-${viewport}-${state}.png`)).metadata()).format,'png');
  }
});

test('Only new SOUTH pair is selectable; missing subpass fails closed and rejected binding remains archived', {skip:!current.hairRedesignReview},async()=>{
  const manifest=parseCharacterV2Manifest(current);
  const before=await json(stage+'manifest-before.json');
  assert.deepEqual(manifest.assets.filter(asset=>asset.layer!=='hair'),before.assets.filter(asset=>asset.layer!=='hair'));
  assert.deepEqual(manifest.poses,before.poses);
  for(const [key,value] of Object.entries(before)) if(!['assets','archivedHairDrafts'].includes(key)) assert.deepEqual(manifest[key],value,key);
  assert.deepEqual(manifest.archivedHairDrafts.slice(0,-1),before.archivedHairDrafts);
  const archive=manifest.archivedHairDrafts.at(-1);
  assert.equal(archive.selectable,false);
  assert.deepEqual(archive.assets,before.assets.filter(asset=>asset.layer==='hair'));
  assert.match(archive.reason,/USER rejected/);
  for(const pose of manifest.poses){
    const pair=v2ItemAssets(manifest,pose,'hair',art.itemId);
    assert.equal(pair.length,pose.direction==='south'?2:0);
    assert.deepEqual(v2ItemAssets(manifest,pose,'hair','ivory-long01-manual'),[]);
    for(const asset of pair){
      assert.equal(asset.visualApproved,false);
      assert.equal(asset.provenance.jobId,null);
      assert.deepEqual(await load('apps/client/public'+asset.url),await load(asset.provenance.sourcePath));
      const missing=structuredClone(manifest);
      missing.assets=missing.assets.filter(candidate=>candidate.id!==asset.id);
      assert.deepEqual(v2ItemAssets(missing,pose,'hair',art.itemId),[]);
    }
  }
  assert.equal(manifest.approvals.userVisualAccepted,false);
});