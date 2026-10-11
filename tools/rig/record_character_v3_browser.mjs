import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stage, saveJson, sharp } from './character_v3_front.mjs';

assert.ok(process.argv[2],'Provide the browser tool result file');
const text = await readFile(process.argv[2],'utf8');
const start = text.indexOf('Result: ');
assert.ok(start>=0,'Actual browser result required');
const checks = JSON.parse(text.slice(start+8).split('\n')[0]);
assert.equal(checks.length,6);
for (const check of checks) {
  assert.equal(check.innerWidth,check.viewport.width);
  assert.ok(check.docWidth<=check.viewport.width);
  assert.equal(check.panels.length,4);
  for (const panel of check.panels) {
    assert.equal(panel.mismatch,0);
    assert.equal(panel.width,128*check.scale);
    assert.equal(panel.height,128*check.scale);
    assert.equal(panel.cssWidth,128*check.scale);
    assert.equal(panel.smoothing,false);
    assert.equal(panel.imageRendering,'pixelated');
    assert.ok(panel.visible>0);
  }
  for (const panel of check.overlay) {
    assert.equal(panel.anchors,21); assert.equal(panel.guides.length,5);
    for (const line of panel.guides) assert.equal(line.top,line.expected);
  }
}
const screenshots = [];
for (const filename of ['browser-desktop-native.png','browser-portrait-native.png','browser-landscape-native.png','browser-A-4x.png']) {
  const metadata = await sharp(await readFile(new URL(filename,stage))).metadata();
  screenshots.push({filename,width:metadata.width,height:metadata.height,artEvidence:false,
    limitation:filename==='browser-A-4x.png'?'Host capture is blank/mispositioned; NOT native-art or4x evidence':'Capture reflowed to integrated host viewport; lower panels can be clipped; NOT responsive visual sign-off'});
}
await saveJson(new URL('browser-checks.json',stage),{
  checkedUrl:'http://localhost:3000/characters/v3',checks,screenshots,
  verified:{sourceCanvasPixels:true,nativeAnd4x:true,guides:true,anchors:true,pageOverflowAbsent:true},
  responsiveScreenshotFidelityVerified:false,realDeviceTest:false,visualApproved:false,
  capturedViewportAfter:[{requested:[1280,900],actual:[733,515]},{requested:[390,844],actual:[296,642]},{requested:[844,390],actual:[733,338]}],
  capturePolicy:'Assertions ran at exact requested viewport BEFORE screenshot. Screenshot capture changed viewport. Direct guideless native PNGs and exact nearest4x diagnostics are primary art evidence.',
});
console.log('V3 browser receipt PASS:6 cases/24 canvases, pixel mismatch0, guides20/anchors84 per case, no page overflow; capture fidelity and real device NOT verified.');