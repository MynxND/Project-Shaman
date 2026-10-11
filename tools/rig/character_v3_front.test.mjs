import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createRequire } from 'node:module';
import { author, variants, measure, replicate, root, stage, runtime, sharp, hash, inventory } from './character_v3_front.mjs';

const typescript = createRequire(new URL('package.json',root))('typescript');
const parserSource = await readFile(new URL('apps/client/src/components/character-v3/manifest.ts',root),'utf8');
const compiled = typescript.transpileModule(parserSource,{compilerOptions:{module:typescript.ModuleKind.ESNext,target:typescript.ScriptTarget.ES2022}}).outputText;
const { parseV3Manifest } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

const json = async url => JSON.parse(await readFile(url,'utf8'));
const manifest = await json(new URL('manifest.json',stage));
const images = await Promise.all(manifest.panels.map(async panel => ({panel,bytes:await readFile(new URL(`${panel.id}.png`,stage))})));
for (const image of images) image.pixels = await sharp(image.bytes).ensureAlpha().raw().toBuffer();

test('front-only unapproved independent manifest; malformed/expanded scope fails closed',async()=>{
  assert.equal(parseV3Manifest(manifest).panels.length,4);
  assert.equal(hash(await readFile(new URL('art.json',stage))),manifest.sourceArtSha256);
  assert.deepEqual(await readFile(new URL('manifest.json',runtime)),await readFile(new URL('manifest.json',stage)));
  for (const [field,value] of [['direction','east'],['frameCount',2],['creditsSpent',6],['jobId','fake']]) {
    assert.throws(()=>parseV3Manifest({...manifest,[field]:value}));
  }
  for (const field of Object.keys(manifest.gates)) assert.throws(()=>parseV3Manifest({...manifest,gates:{...manifest.gates,[field]:true}}));
  assert.throws(()=>parseV3Manifest({...manifest,review:{...manifest.review,bodyLocked:true}}));
  assert.throws(()=>parseV3Manifest({...manifest,panels:manifest.panels.slice(1)}));
  assert.throws(()=>parseV3Manifest({...manifest,panels:manifest.panels.map(panel=>({...panel,url:'/assets/character-v2/manifest.json'}))}));
});

test('all native PNGs match hashes, source bytes, explicit authored pixels and baseline112',async()=>{
  for (const {panel,bytes,pixels} of images) {
    assert.equal(hash(bytes),panel.sha256);
    assert.equal(Buffer.compare(bytes,await readFile(new URL(`${panel.id}.png`,runtime))),0);
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.width,128); assert.equal(metadata.height,128); assert.equal(metadata.hasAlpha,true);
    const measurement = measure(pixels);
    assert.equal(measurement.bounds.maxY,112);
    assert.equal(measurement.bounds.minY,panel.top);
    assert.equal(measurement.bounds.maxY-measurement.bounds.minY+1,panel.figureHeight);
    assert.ok(measurement.visible>2000 && measurement.visible<4000);
    if (panel.id !== 'V2') {
      const variant = variants.find(candidate=>candidate.id===panel.id);
      assert.equal(Buffer.compare(pixels,author(variant).pixels),0);
      assert.equal(measurement.paletteCount,17);
      assert.equal(panel.targetHeads,variant.target);
      assert.equal(panel.figureHeight,Math.round(panel.headHeight*panel.targetHeads));
    }
  }
});

test('all three NEW heads/faces are byte-identical; not derived from V2',()=>{
  const heads = images.slice(1).map(({panel,pixels})=>pixels.subarray(panel.top*128*4,(panel.top+30)*128*4));
  assert.equal(Buffer.compare(heads[0],heads[1]),0);
  assert.equal(Buffer.compare(heads[1],heads[2]),0);
  const v2Head = images[0].pixels.subarray(20*128*4,50*128*4);
  assert.notEqual(hash(v2Head),hash(heads[0]));
});

test('complete original source and three provisional static rigs remain unapproved',async()=>{
  const art = await json(new URL('art.json',stage));
  assert.equal(hash(await readFile(new URL(art.rasterizer.path,root))),art.rasterizer.sha256);
  const rig = await json(new URL('pose-rig-template.json',stage));
  assert.equal(rig.provisional,true); assert.equal(rig.bindingApproved,false);
  assert.equal(rig.bodyLocked,false); assert.equal(rig.deformation,false); assert.equal(rig.skeletonBones,false);
  assert.equal(rig.poses.length,3);
  rig.poses.forEach((pose,index)=>{
    const panel = manifest.panels[index+1];
    assert.equal(pose.direction,'south'); assert.equal(pose.mode,'static'); assert.equal(pose.frames.length,1);
    assert.equal(pose.frames[0].durationMs,null); assert.equal(pose.bodySourceSha256,panel.sha256);
    assert.deepEqual(pose.frames[0].anchors,panel.anchors); assert.deepEqual(pose.availableLayers,['body']);
    assert.equal(pose.visualApproved,false);
  });
});

test('actual browser evidence covers six viewport/scales without false screenshot sign-off',async()=>{
  const evidence = await json(new URL('browser-checks.json',stage));
  assert.equal(evidence.checks.length,6);
  assert.equal(evidence.responsiveScreenshotFidelityVerified,false);
  assert.equal(evidence.realDeviceTest,false);
  for (const width of [1280,390,844]) for (const scale of [1,4]) {
    const check = evidence.checks.find(record=>record.viewport.width===width && record.scale===scale);
    assert.ok(check); assert.equal(check.innerWidth,width); assert.ok(check.docWidth<=width);
    assert.deepEqual(check.panels.map(panel=>panel.id),['V2','A','B','C']);
    for (const panel of check.panels) { assert.equal(panel.mismatch,0); assert.equal(panel.width,128*scale); assert.equal(panel.smoothing,false); }
    for (const panel of check.overlay) { assert.equal(panel.anchors,21); for (const line of panel.guides) assert.equal(line.top,line.expected); }
  }
  for (const screenshot of evidence.screenshots) assert.equal(screenshot.artEvidence,false);
  const followup = await json(new URL('browser-followup.json',stage));
  assert.equal(followup.keyboardTogglesVerified,true);
  assert.equal(followup.guideSourcePixelChanges,0);
  assert.equal(followup.pointerFollowupVerified,false);
  assert.equal(followup.responsiveScreenshotFidelityVerified,false);
});

test('different limb/torso lengths retain native head/shoe size and visible provisional anchors',()=>{
  const candidates = manifest.panels.slice(1);
  assert.deepEqual(candidates.map(panel=>panel.headWidth),[34,34,34]);
  assert.deepEqual(candidates.map(panel=>panel.regions.torso.height),[12,15,18]);
  assert.deepEqual(candidates.map(panel=>panel.regions.armLeft.height),[28,32,35]);
  assert.deepEqual(candidates.map(panel=>panel.regions.legLeft.height),[17,19,21]);
  const shoes = images.slice(1).map(({pixels})=>hash(pixels.subarray(107*128*4,113*128*4)));
  assert.equal(new Set(shoes).size,1);
  for (const {panel,pixels} of images.slice(1)) {
    for (const [name,point] of Object.entries(panel.anchors)) {
      assert.ok(point.x>=0 && point.x<128 && point.y>=0 && point.y<128);
      if (name!=='foot') assert.equal(pixels[(point.y*128+point.x)*4+3],255,`${panel.id}:${name}`);
    }
    assert.equal(panel.visualApproved,false);
  }
});

test('four-panel native sheet is exact row copies and4x is explicit replication',async()=>{
  const native = await sharp(await readFile(new URL('comparison-native.png',stage))).ensureAlpha().raw().toBuffer();
  for (let panel=0;panel<4;panel++) for (let row=0;row<128;row++) {
    assert.equal(Buffer.compare(native.subarray((row*512+panel*128)*4,(row*512+(panel+1)*128)*4),images[panel].pixels.subarray(row*128*4,(row+1)*128*4)),0);
  }
  const diagnostic = await sharp(await readFile(new URL('comparison-4x.png',stage))).ensureAlpha().raw().toBuffer();
  assert.equal(Buffer.compare(diagnostic,replicate(native,512,128,4)),0);
  for (const {panel,pixels} of images) {
    const enlarged = await sharp(await readFile(new URL(`${panel.id}-4x.png`,stage))).ensureAlpha().raw().toBuffer();
    assert.equal(Buffer.compare(enlarged,replicate(pixels,128,128,4)),0);
  }
});

test('entire existing V2 publication and paid archive remain frozen; zero new paid calls',async()=>{
  const frozen = await json(new URL('v2-frozen.json',stage));
  assert.deepEqual({...await inventory('docs/design/character-v2/'),...await inventory('apps/client/public/assets/character-v2/')},frozen);
  assert.equal(Object.keys(frozen).length,192);
  assert.equal(hash(images[0].bytes),hash(await readFile(new URL('docs/design/character-v2/body-front-02/raw.png',root))));
  const ledger = await json(new URL('docs/design/character-v2/cost-ledger.json',root));
  assert.equal(ledger.cap,20); assert.equal(ledger.spent,20);
  const receipt = await json(new URL('capability-receipt.json',stage));
  assert.equal(receipt.paidCalls,0); assert.equal(receipt.chargedCredits,0); assert.deepEqual(receipt.submittedGenerationTools,[]);
  const schemas = await json(new URL('live-tool-schemas.json',stage));
  assert.equal(schemas.find(schema=>schema.name==='get_pro_flash_capabilities').annotations.readOnlyHint,true);
  assert.equal(schemas.find(schema=>schema.name==='create_image_pro_flash').inputSchema.properties.width.maximum,256);
  assert.deepEqual(manifest.timeline,[null]); assert.equal(manifest.budget.additionalCredits,0);
});