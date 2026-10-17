const {chromium}=require('C:/Users/nikza/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const detail=process.argv.includes('--detail'),armed=detail||process.argv.includes('--armed');
 const out='docs/design/equipment/'+(detail?'class-2-imagegen-detail-01':armed?'class-2-imagegen-armed-01':'class-2-imagegen-motion-01')+'/phaser-evidence';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:1440,height:1600}});
 const report={errors:[],boards:[],note:'Isolated development draft, not world adoption or art approval'};
 page.on('pageerror',e=>report.errors.push(String(e)));page.on('response',r=>{if(r.status()>=400&&r.url().includes('/assets/'))report.errors.push(r.status()+' '+r.url());});
 try{
 for(const [id,weapon]of Object.entries({santet:'wand-santet',keris:'keris',onmyoji:'fan-onmyoji',miko:'gohei-miko','rune-seer':'staff-rune-seer','ullr-hunter':'bow-ullr'})){
  const url='http://localhost:3000/?carryReview=1&outfit=1&outfitDraft=1'+(armed?'&outfitBaked=1':'')+(detail?'&outfitDetail=1':'')+'&weapon='+weapon;
  await page.goto(url,{waitUntil:'domcontentloaded'});
  const canvas=page.locator('canvas[data-carry-ready="'+weapon+'"]');await canvas.waitFor({timeout:120000});
  const count=Number(await canvas.getAttribute('data-class-outfit-count'));assert.equal(count,96,'draft is actual costume art in every board row, not novice fallback');
  const separate=Number(await canvas.getAttribute('data-separate-equipment-count'));
  if(armed)assert.equal(separate,0,'baked art must never also draw a separate main/off-hand item');
  await page.waitForTimeout(1600);await canvas.screenshot({path:path.join(out,id+'-all-motions.png')});
  report.boards.push({id,weapon,url,actualOutfitSprites:count,separateEquipment:separate,facings:8,rows:12});
 }
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'portrait.png')});
 await page.setViewportSize({width:844,height:390});await page.screenshot({path:path.join(out,'landscape.png')});
 }finally{await browser.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));}
 assert.equal(report.errors.length,0,JSON.stringify(report.errors));console.log('6 real Phaser draft boards:576 costume sprites over idle/walk/attack/cast, no asset/page errors.');
})().catch(e=>{console.error(e);process.exitCode=1;});
