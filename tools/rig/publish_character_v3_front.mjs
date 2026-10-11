import assert from 'node:assert/strict';
import { readFile, mkdir, copyFile } from 'node:fs/promises';
import { author, authorHead, variants, headRows, palette, measure, replicate, root, stage, runtime, sharp, hash, saveJson, savePng, inventory } from './character_v3_front.mjs';

await mkdir(runtime,{recursive:true});
const json = async url => JSON.parse(await readFile(url,'utf8'));
const frozen = await json(new URL('v2-frozen.json',stage));
assert.deepEqual({...await inventory('docs/design/character-v2/'),...await inventory('apps/client/public/assets/character-v2/')},frozen);
const capability = await json(new URL('capability-receipt.json',stage));
assert.equal(capability.paidCalls,0);
const originalPath = 'docs/design/character-v2/body-front-02/raw.png';
const originalBytes = await readFile(new URL(originalPath,root));
const originalPixels = await sharp(originalBytes).ensureAlpha().raw().toBuffer();
assert.equal(hash(originalBytes),'0ed1ddf448b70a93dc5f624617e832a0af593779b6b7257d65db39b61be35958');

function region(pixels,rect) {
  let minX = 128, minY = 128, maxX = -1, maxY = -1, visible = 0;
  for (let row = rect[1]; row <= rect[3]; row++) {
    for (let column = rect[0]; column <= rect[2]; column++) {
      if (!pixels[(row*128+column)*4+3]) continue;
      minX = Math.min(minX,column); maxX = Math.max(maxX,column);
      minY = Math.min(minY,row); maxY = Math.max(maxY,row); visible++;
    }
  }
  return { selectedRect: rect, visible, bounds: { minX,minY,maxX,maxY }, width:maxX-minX+1, height:maxY-minY+1 };
}
function semanticRegions(pixels,variant) {
  const isV2 = variant.id === 'V2';
  const top = variant.top;
  return Object.fromEntries(Object.entries({
    head:[45,top,78,isV2?49:top+29], scalp:[47,top,76,isV2?34:top+13],
    eyeLeft:isV2?[50,35,59,42]:[50,top+15,57,top+21],
    eyeRight:isV2?[64,35,72,42]:[65,top+15,72,top+21],
    shoulders:[isV2?47:43,variant.shoulder,isV2?77:81,variant.shoulder+4],
    torso:[isV2?51:49,variant.shoulder+5,isV2?73:74,variant.waist-1],
    waist:[isV2?51:49,variant.waist,isV2?73:74,variant.waist],
    armLeft:[38,variant.shoulder,48,variant.hand+4], armRight:[76,variant.shoulder,86,variant.hand+4],
    legLeft:[44,variant.crotch+1,59,106], legRight:[64,variant.crotch+1,79,106],
    footLeft:[42,107,57,112], footRight:[67,107,81,112],
  }).map(([name,rect])=>[name,region(pixels,rect)]));
}
const v2 = {id:'V2',top:20,shoulder:53,waist:70,hip:79,crotch:88,knee:99,elbow:69,hand:78};
const v2Measurement = measure(originalPixels);
const panels = [{
  id:'V2', label:'V2 neutral-male-02', role:'unchanged-reference', targetHeads:null,
  headHeight:29, headHeightRange:[28,30], headWidth:31, figureHeight:93, top:20, chin:48,
  ratio:93/29, ratioRange:[93/30,93/28], baseline:112, shoulder:53, waist:70,
  url:'/assets/character-v3/proportion-front-01/V2.png', sha256:hash(originalBytes),
  sourcePath:originalPath, sourceMethod:'unchanged-existing-reference', visualApproved:false,
  measurement:v2Measurement, regions:semanticRegions(originalPixels,v2),
  anchors:{head:{x:62,y:30},neck:{x:62,y:50},shoulderLeft:{x:50,y:55},shoulderRight:{x:74,y:55},elbowLeft:{x:45,y:69},elbowRight:{x:79,y:69},handLeft:{x:43,y:78},handRight:{x:80,y:78},waist:{x:62,y:70},hipLeft:{x:55,y:79},hipRight:{x:69,y:79},kneeLeft:{x:53,y:99},kneeRight:{x:72,y:99},foot:{x:61,y:112},footLeft:{x:49,y:112},footRight:{x:74,y:112},hair:{x:62,y:24},headgear:{x:62,y:20},mainHand:{x:80,y:78},offHand:{x:43,y:78},accessories:{x:62,y:70}},
}];
await copyFile(new URL(originalPath,root),new URL('V2.png',stage));
await copyFile(new URL(originalPath,root),new URL('V2.png',runtime));
const buffers = [originalPixels];
const source = {version:'shaman-original-v3-pixel-art/1',canvas:{width:128,height:128},palette,headRows,headPixelSha256:hash(authorHead()),rasterizer:{path:'tools/rig/character_v3_front.mjs',sha256:hash(await readFile(new URL('tools/rig/character_v3_front.mjs',root))),scope:'Complete original head/face spans, body polygons, collar/elbow/knee/hand/foot clusters and integer rasterization; no source-image inputs'},geometry:[]};
for (const variant of variants) {
  const {pixels,clusters} = author(variant);
  const measurement = measure(pixels);
  assert.equal(measurement.bounds.minY,variant.top);
  assert.equal(measurement.bounds.maxY,112);
  const figureHeight = 113-variant.top;
  assert.equal(figureHeight,Math.round(30*variant.target));
  const filename = `${variant.id}.png`;
  await savePng(new URL(filename,stage),pixels);
  await copyFile(new URL(filename,stage),new URL(filename,runtime));
  const pngBytes = await readFile(new URL(filename,stage));
  assert.equal(Buffer.compare(await sharp(pngBytes).ensureAlpha().raw().toBuffer(),pixels),0);
  const anchors = {
    head:{x:61,y:variant.top+10},neck:{x:61,y:variant.top+31},
    shoulderLeft:{x:46,y:variant.shoulder+3},shoulderRight:{x:78,y:variant.shoulder+3},
    elbowLeft:{x:43,y:variant.elbow},elbowRight:{x:80,y:variant.elbow},
    handLeft:{x:42,y:variant.hand+1},handRight:{x:82,y:variant.hand+1},
    waist:{x:61,y:variant.waist},hipLeft:{x:54,y:variant.hip},hipRight:{x:70,y:variant.hip},
    kneeLeft:{x:52,y:variant.knee},kneeRight:{x:70,y:variant.knee},
    foot:{x:61,y:112},footLeft:{x:49,y:112},footRight:{x:74,y:112},
    hair:{x:61,y:variant.top+4},headgear:{x:61,y:variant.top},
    mainHand:{x:82,y:variant.hand+1},offHand:{x:42,y:variant.hand+1},accessories:{x:61,y:variant.waist},
  };
  for (const [name,point] of Object.entries(anchors)) {
    assert.ok(point.x>=0 && point.x<128 && point.y>=0 && point.y<128,name);
    if (name !== 'foot') assert.ok(pixels[(point.y*128+point.x)*4+3],`Visible anchor ${variant.id}:${name}`);
  }
  panels.push({id:variant.id,label:`V3 ${variant.id}`,role:'provisional-candidate',targetHeads:variant.target,
    headHeight:30,headHeightRange:[30,30],headWidth:34,figureHeight,top:variant.top,chin:variant.top+29,
    ratio:figureHeight/30,ratioRange:[figureHeight/30,figureHeight/30],baseline:112,shoulder:variant.shoulder,waist:variant.waist,
    url:`/assets/character-v3/proportion-front-01/${filename}`,sha256:hash(pngBytes),
    sourcePath:`docs/design/character-v3/proportion-front-01/${filename}`,sourceMethod:'original-manual-pixel-clusters',
    visualApproved:false,measurement,regions:semanticRegions(pixels,variant),anchors});
  source.geometry.push({variant,clusters,anchors});
  buffers.push(pixels);
}
for (let index = 1; index < 4; index++) {
  const id = panels[index].id;
  await savePng(new URL(`${id}-4x.png`,stage),replicate(buffers[index],128,128,4),512,512);
}
await savePng(new URL('V2-4x.png',stage),replicate(originalPixels,128,128,4),512,512);
const sheet = Buffer.alloc(512*128*4);
for (let panel = 0; panel < 4; panel++) {
  for (let row = 0; row < 128; row++) buffers[panel].copy(sheet,(row*512+panel*128)*4,row*128*4,(row+1)*128*4);
}
await savePng(new URL('comparison-native.png',stage),sheet,512,128);
await savePng(new URL('comparison-4x.png',stage),replicate(sheet,512,128,4),2048,512);
for (const filename of ['comparison-native.png','comparison-4x.png']) await copyFile(new URL(filename,stage),new URL(filename,runtime));
await saveJson(new URL('art.json',stage),source);
const ledger = await json(new URL('docs/design/character-v2/cost-ledger.json',root));
assert.equal(ledger.cap,20); assert.equal(ledger.spent,20);
const manifest = {
  version:'shaman-base-character-v3-front-prototype/1',status:'awaiting-user-art-review',
  canvas:{width:128,height:128,origin:{x:61,y:112}},direction:'south',state:'idle',frameCount:1,timeline:[null],
  method:'original-manual-pixel-clusters',jobId:null,paidCalls:0,creditsSpent:0,paidBudgetApproved:false,
  sourceArtPath:'docs/design/character-v3/proportion-front-01/art.json',sourceArtSha256:hash(await readFile(new URL('art.json',stage))),
  referencePolicy:'Owned concept only for visual direction. V2 is measured/displayed only. No V2 pixel sampling, scaling, deformation or third-party sprite input.',
  semanticLandmarksProvisional:true,anchorConvention:'screen-left/right; visible reference coordinates, not skeleton bones or certified equipment bindings',
  review:{userVisualAccepted:false,anchorsApproved:false,bodyLocked:false,productionReady:false},
  gates:{otherDirections:false,hair:false,outfit:false,weapons:false,accessories:false,animation:false,liveIntegration:false},
  budget:{priorV2Cap:20,priorV2Spent:20,priorV2Remaining:0,newPaidBudget:null,additionalCredits:0,pendingJobs:0},
  diagnostics:{nativeUrl:'/assets/character-v3/proportion-front-01/comparison-native.png',nearest4xUrl:'/assets/character-v3/proportion-front-01/comparison-4x.png',method:'Direct RGBA row copies; explicit integer4x replication; no resizing or alignment transforms'},panels,
};
await saveJson(new URL('manifest.json',stage),manifest);
await copyFile(new URL('manifest.json',stage),new URL('manifest.json',runtime));
await saveJson(new URL('pose-rig-template.json',stage),{
  version:'shaman-v3-visible-front-landmarks/1',provisional:true,bindingApproved:false,bodyLocked:false,
  convention:manifest.anchorConvention,deformation:false,skeletonBones:false,
  policy:'Only after USER art approval may the chosen body be locked. Later hair/equipment must bind without changing its exposed body pixels. No attachment assets are present now.',
  poses:panels.slice(1).map(panel=>({id:`base-character-v3-${panel.id}-idle-south`,variant:panel.id,
    direction:'south',state:'idle',mode:'static',canvas:manifest.canvas,frames:[{durationMs:null,anchors:panel.anchors}],
    bodySourceSha256:panel.sha256,visualApproved:false,availableLayers:['body'],missingLayers:['hair','outfit','headgear','mainHand','offHand','accessories'],
  })),
});
await saveJson(new URL('measurements.json',stage),{method:'Alpha scanned within manually selected visible semantic envelopes. Rectangles are not automatic anatomy segmentation; overlapping envelopes can include neighboring skin. Eye bounds are provisional feature envelopes, not alpha-isolated eyeballs.',panels:panels.map(({id,figureHeight,headHeight,headHeightRange,headWidth,ratio,ratioRange,measurement,regions,anchors})=>({id,figureHeight,headHeight,headHeightRange,headWidth,ratio,ratioRange,measurement,regions,anchors}))});
await saveJson(new URL('owned-references.json',stage),{
  references:await Promise.all(['docs/design/comfyui/reference/shamen-base-sheet.webp',originalPath].map(async path=>({path,sha256:hash(await readFile(new URL(path,root))),use:path===originalPath?'Unmodified comparison/measurement only':'Owned Shaman identity, compact silhouette and mature stylized face direction only; no extraction'}))),thirdPartyPixelInputs:[],
});
assert.deepEqual({...await inventory('docs/design/character-v2/'),...await inventory('apps/client/public/assets/character-v2/')},frozen);
console.log(`V3 PUBLICATION PASS: A90/B98/C105; head30x34 shared; foot112; native512x128 and exact4x2048x512; ${Object.keys(frozen).length} V2 files unchanged; paid0; all review gates false.`);