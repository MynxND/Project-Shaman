import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { author,inspect,styles,stage } from './character_v2_hair_fit_front01.mjs';
import { assertFrozen,nearest } from './character_v2_hair_fit.mjs';
import { load,json,manifestPath,compose } from './character_v2_long_hair.mjs';
import { decodePng,hash } from './prepare_character_v2_hair.mjs';
import { parseCharacterV2Manifest,v2ItemAssets } from '../../packages/shared/dist/character-v2.js';
const require=createRequire(new URL('../../apps/client/package.json',import.meta.url));
const sharp=createRequire(require.resolve('next'))('sharp');
const body=await decodePng(await load('docs/design/character-v2/body-front-02/raw.png')),template=await json(stage+'head-template.json');
test('Exactly three row-authored FRONT pairs are active with original body and pose',async()=>{
  const manifest=parseCharacterV2Manifest(await json(manifestPath)),before=await json(stage+'manifest-before.json');
  assert.deepEqual([...new Set(manifest.assets.filter(asset=>asset.layer==='hair').map(asset=>asset.itemId))],styles.map(style=>style.id));
  assert.deepEqual(manifest.poses,before.poses);
  assert.deepEqual(manifest.assets.filter(asset=>asset.layer!=='hair'),before.assets.filter(asset=>asset.layer!=='hair'));
  for(const pose of manifest.poses)for(const style of styles){
    const pair=v2ItemAssets(manifest,pose,'hair',style.id);assert.equal(pair.length,pose.direction==='south'?2:0);
    for(const asset of pair){assert.equal(asset.provenance.method,'manual');assert.equal(asset.provenance.jobId,null);assert.equal(asset.visualApproved,false);assert.equal(hash(await load(asset.provenance.sourcePath)),asset.provenance.sha256);assert.ok((await load(asset.provenance.sourcePath)).equals(await load('apps/client/public'+asset.url)));}
  }
  for(const archive of manifest.archivedHairDrafts)assert.equal(archive.selectable,false);
  await assertFrozen();
  for(const [path,expected]of Object.entries(await json(stage+'publication-preserved-hashes.json')))assert.equal(hash(await load(path)),expected);
});
test('Source rows replay the exact isolated layers and template edits with zero scalp gaps',async()=>{
  const review=await json(stage+'review.json');
  for(const style of styles){
    const rows=await json(stage+style.id+'-rows.json'),{front,back}=author(style,body);
    for(const [key,expected]of [['hairFront',front],['hairBack',back]]){
      const pixels=Buffer.alloc(65536);
      for(const [row,left,right,color]of rows[key])for(let column=left;column<=right;column++)pixels.set([...rows.palette[color],255],(row*128+column)*4);
      assert.ok(pixels.equals(expected));
    }
    const {composite,metrics}=inspect(style,body,back,front,template);
    assert.equal(metrics.scalpHoles,0);assert.equal(metrics.protectedFeatureMismatch,0);
    assert.deepEqual(review.styles.find(record=>record.id===style.id).metrics,metrics);
    assert.ok((await decodePng(await load(stage+style.id+'-working-on-template.png'))).equals(composite));
    assert.ok((await decodePng(await load(stage+style.id+'-hair-only.png'))).equals(compose(back,front)));
    const dirty=Buffer.from(front);dirty.set([83,85,90,255],(38*128+55)*4);assert.throws(()=>inspect(style,body,back,dirty,template),/Protected face overlap/);
    const gap=Buffer.from(front);gap.fill(0,(20*128+60)*4,(20*128+61)*4);assert.throws(()=>inspect(style,body,back,gap,template));
  }
  const native=await sharp(await load(stage+'row-comparison-native.png')).ensureAlpha().raw().toBuffer();
  const enlarged=await sharp(await load(stage+'row-comparison-nearest4x.png')).ensureAlpha().raw().toBuffer();assert.ok(enlarged.equals(nearest(native,512,128,4)));
  assert.equal(review.hairVisualApproved,false);assert.equal(review.fullMilestone,false);assert.equal(review.generationAttempts,0);
});
test('Actual read-only schema quote6 does not authorize generation or spending',async()=>{
  const schemas=await json(stage+'live-tool-schemas.json'),receipt=await json(stage+'capability-receipt.json');
  assert.equal(schemas.find(schema=>schema.name==='get_pro_flash_capabilities').annotations.readOnlyHint,true);
  assert.ok(schemas.find(schema=>schema.name==='inpaint_image_pro_flash').inputSchema.properties.output_method.enum.includes('New layer with changes'));
  const quote=await json(stage+'live-quote-128.json'),data=JSON.parse(quote.content.find(content=>content.type==='text').text);
  assert.equal(data.cost.total,6);assert.equal(data.cost.provisional,true);assert.equal(receipt.schemaInspectedBeforeCalls,true);assert.equal(receipt.generationAttempts,0);assert.equal(receipt.paidSubmissions,0);assert.equal(receipt.creditsSpent,0);
});