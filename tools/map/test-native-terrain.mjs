import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
import {materialAt} from './leveling-preview-model.mjs';
import {roundPolyline} from './organic-layout.mjs';
const source=stripTypeScriptTypes(await readFile('apps/client/src/game/world/native-terrain.ts','utf8'));
const {rasterNativeTerrain}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
// Independent point queries verify scanline/raster paint order, concavity and dry crossings.
const fixture={width:12,height:10,terrain:{base:'dirt',paint:[
 {terrain:'water',shape:'polygon',points:[[1,1],[10,1],[10,8],[6,8],[6,4],[1,4]]},
 {terrain:'water',shape:'circle',x:3,y:7,r:2.2},
 {terrain:'water',shape:'path',points:[[0,4],[6,6],[11,9]],r:.7},
 {terrain:'road',shape:'rect',x:5,y:0,w:1.5,h:10}
]}};
for(const map of [fixture,...await Promise.all(['ashwind-volcano','ember-caldera','obsidian-estuary'].map(async id=>JSON.parse(await readFile(`docs/design/maps/${id}/map.json`))))]){
 const r=rasterNativeTerrain(map),stride=map===fixture?1:19;
 for(let y=0;y<r.height;y+=stride)for(let x=0;x<r.width;x+=stride){const i=y*r.width+x,material=materialAt(map,(x+.5)/16,(y+.5)/16);assert.equal(r.water[i]>0,material==='water',`${map.id??'fixture'} water ${x},${y}`);assert.equal(r.materials[i]===1,material==='road');}
 assert.deepEqual(r,rasterNativeTerrain(map));
 console.log('PASS native material agreement',map.id??'concave/circle/capsule/ford fixture');
}
const circle={width:10,height:10,terrain:{base:'dirt',paint:[{terrain:'water',shape:'circle',x:5,y:5,r:4}]}};
const r=rasterNativeTerrain(circle),edges=new Set();for(let y=16;y<80;y++){const row=r.water.subarray(y*160,(y+1)*160);edges.add(row.findIndex(v=>v>0));}assert(edges.size>30,'circle must use native steps, not unit-grid corners');
const p=[[0,0],[10,0],[10,10]],rounded=roundPolyline(p);assert.deepEqual(rounded[0],p[0]);assert.deepEqual(rounded.at(-1),p.at(-1));assert(rounded.every(([x,y])=>Math.min(Math.abs(y),Math.abs(x-10))<=1.5));
assert.throws(()=>rasterNativeTerrain(circle,0));
console.log('PASS native shoreline precision, deterministic paint and bounded authored corners');
