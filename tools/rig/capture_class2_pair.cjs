// Local real-renderer evidence. No PixelLab calls, accounts or gameplay sessions.
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
 const baselineOnly=process.argv.includes('--baseline-only');
 const out=path.resolve('docs/design/equipment/class-2-production-01/runtime-evidence');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const errors=[],requests=[],consoleWarnings=[];
 const page=await browser.newPage({viewport:{width:1440,height:1400},recordVideo:{dir:out,size:{width:1440,height:1400}}}).catch(async e=>{await browser.close();throw e;});
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(['warning','error'].includes(m.type()))consoleWarnings.push(m.text());});
 page.on('response',r=>{if(r.status()>=400&&r.url().includes('/assets/'))errors.push(`${r.status()} ${r.url()}`);});
 page.on('websocket',s=>requests.push(s.url()));
 try{
  for(const [id,weapon]of [['achan','staff-achan'],['juggernaut','axe-juggernaut']]){
   for(const motion of ['idle','walk','attack','cast']){
    for(const outfit of baselineOnly?[false]:[false,true]){
     if(!outfit&&fs.existsSync(path.join(out,`${id}-${motion}-before.png`)))continue;
     await page.goto(`http://localhost:3000/?carryReview=1&weapon=${weapon}&motion=${motion}${outfit?'&outfit=1':''}`,{waitUntil:'domcontentloaded'});
     const canvas=page.locator(`canvas[data-carry-ready="${weapon}"]`);await canvas.waitFor({timeout:120000});
     const count=Number(await canvas.getAttribute('data-class-outfit-count'));
     assert.equal(count,outfit?(motion==='idle'||motion==='walk'?8:40):0,'actual costume sprites, not a mislabeled novice fallback');
     if(outfit&&motion!=='idle')await page.waitForTimeout(2200);
     const boardHeight=(motion==='idle'||motion==='walk'?170:610)*1440/950;
     await page.screenshot({path:path.join(out,`${id}-${motion}-${outfit?'after':'before'}.png`),clip:{x:0,y:Math.floor((1400-boardHeight)/2)-10,width:1440,height:Math.ceil(boardHeight)+20}});
    }
   }
  }
  if(!baselineOnly){await page.setViewportSize({width:390,height:844});await page.goto('http://localhost:3000/?carryReview=1&weapon=axe-juggernaut&outfit=1&motion=idle');await page.locator('canvas[data-class-outfit-count="8"]').waitFor({timeout:120000});
  await page.screenshot({path:path.join(out,'mobile-portrait.png')});
  await page.setViewportSize({width:844,height:390});await page.screenshot({path:path.join(out,'mobile-landscape.png')});}
  assert.equal(errors.length,0,errors.join('\n'));assert.ok(requests.every(url=>!url.includes(':2567')),'review must not join gameplay WebSocket');
  fs.writeFileSync(path.join(out,baselineOnly?'baseline-report.json':'report.json'),JSON.stringify({errors,consoleWarnings,websockets:requests,scope:'Actual CharacterSprite/EquipmentLayers before/after8directions, live walk/attack/cast and static contact poses. Browser resizing, not physical touch QA.'},null,2));
 }finally{const video=page.video();await page.close();if(video)await video.saveAs(path.join(out,baselineOnly?'baseline-motions.webm':'pair-supported-motions.webm'));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
