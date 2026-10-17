const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const out=path.resolve('docs/design/mountain-sanctuary-phase-d/evidence');fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  try {
    await page.goto('http://localhost:3000/maps/mountain-sanctuary',{waitUntil:'networkidle'});
    await page.waitForSelector('[data-ready="true"]');
    const read=()=>page.getByTestId('mountain-position').evaluate(e=>({x:Number(e.dataset.x),y:Number(e.dataset.y),level:Number(e.dataset.level),scene:e.dataset.scene}));
    const original=await read();
    await page.screenshot({path:path.join(out,'desktop-overview.png')});
    await page.keyboard.down('ArrowUp');await page.waitForTimeout(500);await page.keyboard.up('ArrowUp');await page.waitForTimeout(250);
    assert((await read()).y<original.y-.8,'keyboard walks');
    await page.getByRole('button',{name:'กลับจุดเริ่ม'}).click();
    await page.getByRole('button',{name:'Z2 วัด',exact:true}).click();await page.waitForTimeout(300);
    const summit=await read();
    // focus uses follow camera
    await page.waitForTimeout(250);
    await page.screenshot({path:path.join(out,'desktop-summit.png')});
    for(const [name,file] of [['Z1 ลานพิธี','ritual'],['Z0 หมู่บ้าน','village']]) {
      await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(300);
      await page.screenshot({path:path.join(out,`desktop-${file}.png`)});
    }
    await page.getByRole('button',{name:'Z2 วัด',exact:true}).click();await page.waitForTimeout(300);
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);
    const portrait=await read();assert.equal(portrait.scene,original.scene);assert.equal(portrait.x,summit.x);assert.equal(portrait.y,summit.y);
    await page.screenshot({path:path.join(out,'mobile-portrait-walk.png')});
    await page.getByRole('button',{name:'ดูภาพรวม',exact:true}).click();await page.waitForTimeout(250);
    await page.screenshot({path:path.join(out,'mobile-portrait-overview.png')});
    await page.setViewportSize({width:844,height:390});await page.waitForTimeout(400);
    await page.screenshot({path:path.join(out,'mobile-landscape.png')});
    const button=page.getByRole('button',{name:'←',exact:true});const box=await button.boundingBox();
    await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.waitForTimeout(400);await page.mouse.up();await page.waitForTimeout(250);
    assert((await read()).x<portrait.x-.6,'pointer pad walks');
    assert.equal(await page.locator('canvas').count(),1,'one canvas after orientation changes');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
    assert.deepEqual(errors,[],'no page errors');
    fs.writeFileSync(path.join(out,'qa.json'),JSON.stringify({original,summit,portrait,afterPad:await read(),errors,checks:['keyboard','three zone focus controls','pointer pad','resize retains position and scene','one canvas','no horizontal overflow']},null,2));
    console.log('PASS browser desktop/portrait/landscape; keyboard and pointer movement; three zone focus; resize persistence; no page errors');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
