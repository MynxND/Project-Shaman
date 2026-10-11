import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { stage, load, json, inspectHair, assertFrozen, nearest, manifestPath } from './character_v2_hair_fit.mjs';
import { rasterize, compose } from './character_v2_long_hair.mjs';
import { decodePng, hash, BODY_SHA256 } from './prepare_character_v2_hair.mjs';
import { parseCharacterV2Manifest, v2ItemAssets, v2Sample } from '../../packages/shared/dist/character-v2.js';

const collection = await json(stage + 'art.json');
const template = await json(stage + 'head-template.json');
const review = await json(stage + 'fit-review.json');
const bodyBytes = await load('docs/design/character-v2/body-front-02/raw.png');
const body = await decodePng(bodyBytes);
const manifest = parseCharacterV2Manifest(await json(manifestPath));
const require = createRequire(new URL('../../apps/client/package.json', import.meta.url));
const sharp = createRequire(require.resolve('next'))('sharp');

test('Exactly three new authored hair pairs replay from polygons, not old pixels; eyes, face, neck and scalp conserved', async () => {
  assert.equal(hash(bodyBytes), BODY_SHA256);
  assert.equal(collection.styles.length, 3);
  assert.equal(collection.sourcePixelsCopied, false);
  assert.equal(review.artSha256, hash(await load(stage + 'art.json')));
  assert.deepEqual(template.canvas, { width: 128, height: 128, origin: { x: 61, y: 112 } });
  assert.equal(template.scalpBounds.visible, 270);
  const hashes = [];
  for (const style of collection.styles) {
    const art = { ...style, canvas: collection.canvas, palette: collection.palette };
    const back = rasterize(art, 'hairBack');
    const front = rasterize(art, 'hairFront');
    const result = inspectHair(art, back, front, body, template);
    const record = review.records.find(candidate => candidate.itemId === style.itemId);
    assert.deepEqual(record.metrics, result.metrics);
    assert.equal(result.metrics.scalpHoles, 0);
    assert.equal(result.metrics.protectedFeatureMismatch, 0);
    assert.ok(result.metrics.visibleRearBelowJaw > 0);
    hashes.push(hash(front));
    for (const [name, pixels] of [['hair-back', back], ['hair-front', front], ['hair-only', result.hairOnly], ['composite', result.composite]]) {
      const bytes = await load(stage + style.itemId + '/' + name + '.png');
      assert.equal(hash(bytes), record.sources[name]);
      assert.ok((await decodePng(bytes)).equals(pixels));
      if (name === 'hair-back' || name === 'hair-front') assert.ok(bytes.equals(await load('apps/client/public/assets/character-v2/hair-fit-front-01/' + style.itemId + '/' + name + '.png')), 'Retained runtime PNG is byte-exact even if selection changes');
      const enlarged = await sharp(await load(stage + style.itemId + '/' + name + '-4x.png')).ensureAlpha().raw().toBuffer();
      assert.ok(enlarged.equals(nearest(pixels, 128, 128, 4)), 'Exact nearest4x, no interpolated pixels');
    }
    for (const [column, row] of [[55,38], [49,38], [61,50]]) {
      const dirty = Buffer.from(front);
      dirty.set([...art.palette.O,255], (row*128+column)*4);
      assert.throws(() => inspectHair(art,back,dirty,body,template), /overlap/i);
    }
    const skin = Buffer.from(front);
    skin.set([224,170,124,255], (25*128+60)*4);
    assert.throws(() => inspectHair(art,back,skin,body,template), /nonPalette/);
    const invisibleRgb = Buffer.from(back);
    invisibleRgb[0] = 1;
    assert.throws(() => inspectHair(art,invisibleRgb,front,body,template), /hiddenRgb/);
    const gap = Buffer.from(front);
    gap.fill(0, (25*128+60)*4, (25*128+60)*4+4);
    assert.throws(() => inspectHair(art,back,gap,body,template));
    assert.throws(() => inspectHair(art,Buffer.alloc(back.length),front,body,template), /real hair/);
    assert.ok(!compose(body,back,front).equals(result.composite), 'Split order must be observable');
  }
  assert.equal(new Set(hashes).size, 3);
  assert.equal(hash(bodyBytes), BODY_SHA256);
});

test('Native comparison sheet contains the exact base and three published composites; full sheet exact4x', async () => {
  const native = await sharp(await load(stage+'fit-comparison-native.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(native.info.width,512);
  assert.equal(native.info.height,384);
  const sources=[body,...await Promise.all(collection.styles.map(async style=>decodePng(await load(stage+style.itemId+'/composite.png'))))];
  for (const [index,pixels] of sources.entries()) for(let row=0;row<128;row++) {
    assert.ok(native.data.subarray((row*512+index*128)*4,(row*512+index*128+128)*4).equals(pixels.subarray(row*512,(row+1)*512)));
  }
  const enlarged=await sharp(await load(stage+'fit-comparison-4x.png')).ensureAlpha().raw().toBuffer();
  assert.ok(enlarged.equals(nearest(native.data,512,384,4)));
});

test('Current publication conserves unknown metadata, body approval, all poses, paid ledger and ALL V3 bytes', async () => {
  await assertFrozen();
  const before=await json(stage+'manifest-before.json');
  assert.deepEqual(manifest.poses,before.poses);
  assert.deepEqual(manifest.assets.filter(asset=>asset.layer!=='hair'),before.assets.filter(asset=>asset.layer!=='hair'));
  for(const [key,value] of Object.entries(before)) if(!['assets','archivedHairDrafts'].includes(key)) assert.deepEqual(manifest[key],value,key);
  assert.deepEqual(manifest.archivedHairDrafts.slice(0,-1),before.archivedHairDrafts);
  assert.deepEqual(manifest.archivedHairDrafts.at(-1).assets,before.assets.filter(asset=>asset.layer==='hair'));
  assert.deepEqual(manifest.archivedHairDrafts.at(-1).pose,before.poses.find(pose=>pose.direction==='south'));
  for(const archive of manifest.archivedHairDrafts) {
    assert.equal(archive.selectable,false);
    for(const asset of archive.assets) assert.ok(!manifest.assets.some(current=>current.id===asset.id));
  }
  assert.equal(manifest.assets.length,10);
  for(const pose of manifest.poses) for(const style of collection.styles) {
    const assets=v2ItemAssets(manifest,pose,'hair',style.itemId);
    assert.equal(assets.length,pose.direction==='south'?2:0);
    assert.equal(v2Sample(pose,0),0);
    for(const asset of assets) {
      assert.equal(asset.visualApproved,false);
      assert.equal(asset.provenance.method,'manual');
      assert.equal(asset.provenance.jobId,null);
      assert.deepEqual(asset.timeline,[null]);
      assert.ok((await load(asset.provenance.sourcePath)).equals(await load('apps/client/public'+asset.url)));
      const missing=structuredClone(manifest);
      missing.assets=missing.assets.filter(candidate=>candidate.id!==asset.id);
      assert.deepEqual(v2ItemAssets(missing,pose,'hair',style.itemId),[]);
      for(const field of ['poseId','direction','canvas','timeline']) {
        const mismatch=structuredClone(manifest);
        const changed=mismatch.assets.find(candidate=>candidate.id===asset.id);
        if(field==='canvas') changed.canvas.origin.x++;
        else if(field==='timeline') changed.timeline=[100];
        else changed[field]='incompatible';
        assert.deepEqual(v2ItemAssets(mismatch,pose,'hair',style.itemId),[]);
      }
    }
  }
  assert.equal(manifest.approvals.userVisualAccepted,false);
  assert.equal(manifest.approvals.animationAccepted,false);
  assert.equal(review.creditsSpent,0);
  assert.equal(review.paidCalls,0);
  assert.equal(review.budget.paidBlocked,true);
  assert.equal(review.budget.newNumericalBudgetApproved,false);
});