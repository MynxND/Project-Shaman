import test from 'node:test';
import assert from 'node:assert/strict';
import { author,inspect,styles,stage } from './character_v2_hair_fit_front01.mjs';
import { assertFrozen } from './character_v2_hair_fit.mjs';
import { load,json,manifestPath,compose } from './character_v2_long_hair.mjs';
import { decodePng,hash,BODY_SHA256 } from './prepare_character_v2_hair.mjs';
import { parseCharacterV2Manifest,v2ItemAssets } from '../../packages/shared/dist/character-v2.js';
const bodyBytes=await load('docs/design/character-v2/body-front-02/raw.png'),body=await decodePng(bodyBytes),template=await json(stage+'head-template.json');
test('Three original head-anchored hair pairs cover measured scalp and preserve face',()=>{
  assert.equal(hash(bodyBytes),BODY_SHA256);
  assert.equal(styles.length,3);
  const silhouettes=[];
  for(const style of styles) {
    const {front,back}=author(style,body),{metrics,composite}=inspect(style,body,back,front,template);
    assert.equal(metrics.scalpHoles,0);assert.equal(metrics.protectedFeatureMismatch,0);
    assert.ok(metrics.visibleRear>0);
    assert.ok(compose(body).equals(body));
    silhouettes.push(hash(front));
    const dirty=Buffer.from(front);dirty.set([83,85,90,255],(38*128+55)*4);
    assert.throws(()=>inspect(style,body,back,dirty,template),/Protected face overlap/);
    assert.ok(!composite.equals(body));
  }
  assert.equal(new Set(silhouettes).size,3);
});
test('Body4, ledger, old hair, and V3 snapshots remain byte-exact',async()=>{await assertFrozen();});
test('Published only three FRONT pairs, exact provenance, no direction fallback or false approval',async()=>{
  const current=await json(manifestPath);
  assert.ok(current.hairFitReview,'Head-fit publication required');
  const manifest=parseCharacterV2Manifest(current),before=await json(stage+'manifest-before.json');
  assert.deepEqual(manifest.poses,before.poses);
  assert.deepEqual(manifest.assets.filter(asset=>asset.layer!=='hair'),before.assets.filter(asset=>asset.layer!=='hair'));
  assert.equal(manifest.assets.filter(asset=>asset.layer==='hair').length,6);
  const publicationReview = await json(current.hairFitReview.reviewPath);
  const publishedStyles = publicationReview.records ? publicationReview.records.map(record => ({ id: record.itemId })) : publicationReview.styles;
  assert.equal(publishedStyles.length,3);
  for(const pose of manifest.poses) for(const style of publishedStyles) {
    const pair=v2ItemAssets(manifest,pose,'hair',style.id);
    assert.equal(pair.length,pose.direction==='south'?2:0);
    for(const asset of pair) {
      assert.equal(asset.visualApproved,false);assert.equal(asset.provenance.method,'manual');assert.equal(asset.provenance.jobId,null);
      assert.equal(hash(await load(asset.provenance.sourcePath)),asset.provenance.sha256);
      assert.ok((await load(asset.provenance.sourcePath)).equals(await load('apps/client/public'+asset.url)));
      const missing=structuredClone(manifest);missing.assets=missing.assets.filter(candidate=>candidate.id!==asset.id);
      assert.deepEqual(v2ItemAssets(missing,pose,'hair',style.id),[]);
    }
  }
  assert.equal(manifest.approvals.userVisualAccepted,false);
  assert.equal(manifest.archivedHairDrafts.at(-1).selectable,false);
  for(const [path,expected] of Object.entries(await json(stage+'publication-preserved-hashes.json'))) assert.equal(hash(await load(path)),expected,path);
});