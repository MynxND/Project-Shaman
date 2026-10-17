const {chromium}=require('C:/Users/nikza/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const out='docs/design/equipment/class-2-imagegen-motion-01/browser-evidence';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:1440,height:1100}});
 const report={errors:[],views:[],note:'Offline review UI/asset loading only; not Phaser/network/physical-touch acceptance'};
 page.on('pageerror',e=>report.errors.push(String(e)));page.on('response',r=>{if(r.status()>=400&&r.url().endsWith('.png'))report.errors.push(r.url());});
 try{
  await page.goto('http://127.0.0.1:8769/',{waitUntil:'networkidle'});
  for(const id of ['santet','keris','onmyoji','miko','rune-seer','ullr-hunter'])for(const action of ['idle','walk','attack','cast']){
   await page.selectOption('#class',id);await page.selectOption('#action',action);
   await page.waitForFunction(({id,action})=>document.querySelector('#class').value===id&&document.querySelector('#action').value===action&&!document.querySelector('#status').textContent.startsWith('กำลังโหลด')&&!document.querySelector('#status').textContent.includes('ไม่สำเร็จ'),{id,action});
   const count=await page.locator('#board canvas').count();if(count!==8)throw Error('Missing facing canvases');
   report.views.push({id,action,canvases:count,status:await page.locator('#status').textContent()});
  }
  await page.locator('#play').click();await page.locator('#frame').fill('3');
  await page.screenshot({path:path.join(out,'desktop-ullr-cast.png')});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'portrait-ullr-cast.png')});
  await page.setViewportSize({width:844,height:390});await page.screenshot({path:path.join(out,'landscape-ullr-cast.png')});
 }finally{await browser.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));}
 if(report.errors.length)throw Error(JSON.stringify(report.errors));console.log('24 class/action views load8 facing canvases each; no page or PNG errors.');
})().catch(e=>{console.error(e);process.exitCode=1;});
