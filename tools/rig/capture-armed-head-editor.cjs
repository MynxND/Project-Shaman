const {chromium}=require('C:/Users/nikza/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const detail=process.argv.includes('--detail'),origin='http://127.0.0.1:'+(detail?8771:8770);
 const out='docs/design/equipment/'+(detail?'class-2-imagegen-detail-01':'class-2-imagegen-armed-01')+'/head-editor-evidence';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const ready=()=>page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('พร้อมจัดหัว'));
 try{
  await page.goto(origin+'/head-editor');await ready();
  if(detail)assert.ok((await page.locator('#phaser').getAttribute('href')).includes('outfitDetail=1'));
  assert.equal(await page.locator('#strip button').count(),8);
  const startX=Number(await page.locator('#x').inputValue()),expectedX=String(Math.min(24,startX+1));
  await page.locator('#stage').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#x').inputValue(),expectedX);
  await page.click('#seed');await page.click('#track');await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('เสนอ'));
  const tracking=await page.locator('#status').textContent();assert.equal(await page.locator('#x').inputValue(),expectedX,'tracking preserves seed');
  await page.reload();await ready();assert.equal(await page.locator('#x').inputValue(),expectedX,'local draft survives reload');
  await page.click('#orderright');assert.ok((await page.locator('#strip button').nth(0).textContent()).includes('#1'));
  assert.equal(await page.locator('#x').inputValue(),expectedX,'head follows moved source frame');
  await page.reload();await ready();assert.ok((await page.locator('#strip button').nth(0).textContent()).includes('#1'),'order survives local reload');
  await page.screenshot({path:out+'/frame-order-desktop.png',fullPage:true});
  await page.click('#orderreset');assert.ok((await page.locator('#strip button').nth(0).textContent()).includes('#0'));await page.locator('#strip button').nth(0).click();
  // Verify outgoing save payload without storing synthetic QA offsets in the project.
  let saved;await page.route('**/head-save',async route=>{saved=route.request().postDataJSON();await route.fulfill({json:{saved:saved.offsets.length,applied:false}});});
  await page.click('#save');await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('บันทึก '));const seed=saved.offsets.find(f=>f.key==='santet/walk/south/0');assert.equal(seed.dx,Number(expectedX));assert.equal(seed.status,'manual');
  await page.unroute('**/head-save');
  const refused=await page.request.post(origin+'/head-save',{headers:{Origin:'http://wrong.example'},data:saved});assert.equal(refused.status(),403);
  const invalid=await page.request.post(origin+'/head-apply',{headers:{Origin:origin},data:{...saved,sourceFingerprint:'stale'}});assert.equal(invalid.status(),400);
  for(const id of ['santet','keris','onmyoji','miko','rune-seer','ullr-hunter']){
   await page.selectOption('#class',id);await ready();assert.equal(await page.locator('#strip button').count(),8);
  }
  await page.selectOption('#class','onmyoji');await ready();await page.screenshot({path:out+'/desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:out+'/portrait.png',fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.setViewportSize({width:844,height:390});await page.screenshot({path:out+'/landscape.png',fullPage:true});
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/report.json',JSON.stringify({errors,tracking,classes:6,keyboard:true,localDraft:true,savePayload:true,realWriteGuard:true,application:'pure-manifest behavioral test; QA does not write synthetic offsets',mobileLayout:true},null,2));
  console.log('Six-class editor, integer nudges, proposal seed protection, reload persistence, save payload, real API rejection and responsive layouts pass.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
