import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url), ts=require('typescript');
const source=readFileSync('apps/client/src/game/vfx/boss/ritual-telegraph.ts','utf8');
const context={exports:{},Math};
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);
const {ritualPerimeter,drawRitualWarning,insideRitual}=context.exports;
let checks=0,segments=0;
for(const shape of ['disk','ring','finale','capsule','charge','sector'])for(let face=0;face<8;face++)for(const arc of [Math.PI/2,Math.PI*1.5])for(const theme of ['koschei','maiyarap']){
 const angle=face*Math.PI/4,h={shape,x:768,y:704,ex:768+Math.cos(angle)*220,ey:704+Math.sin(angle)*220,radius:180,width:30,angle,arc};
 const points=ritualPerimeter(h);
 assert(points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));checks++;
 for(const charge of [0,.5,1]){
  let a;
  const g={lineStyle(){return this},beginPath(){return this},moveTo(x,y){a={x,y};return this},lineTo(x,y){for(const q of [0,.25,.5,.75,1])assert(insideRitual(h,{x:a.x+(x-a.x)*q,y:a.y+(y-a.y)*q}));segments++;return this},strokePath(){return this},fillStyle(){return this},fillCircle(){return this}};
  drawRitualWarning(g,h,theme,charge);checks++;
 }
}
console.log(`PASS ${checks} ritual geometry/render cases; ${segments} bounded ornamental segments; six shapes, eight facings, narrow/wide sectors, two themes, three charge times`);
