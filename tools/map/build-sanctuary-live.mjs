import {readFile,writeFile}from'node:fs/promises';
import{LEVELING_LIVE}from'../../packages/shared/dist/maps/leveling-live.js';
import{materialAt}from'./leveling-preview-model.mjs';
const original=LEVELING_LIVE.find(m=>m.id==='monsoon-marsh'),m=structuredClone(original);
m.terrain.paint.push({terrain:'grass',shape:'path',points:[[44,57],[56,56],[72,56],[87,56]],r:2.8},{terrain:'dirt',shape:'path',points:[[44,57],[56,56],[72,56],[87,56]],r:1.4});
m.blockers=[];for(let y=0;y<m.height;y+=.5){let start=null;for(let x=0;x<=m.width;x+=.5){const wet=x<m.width&&materialAt(m,x+.25,y+.25)==='water';if(wet&&start===null)start=x;if(!wet&&start!==null){m.blockers.push({x:start-.001,y:y-.001,w:x-start+.002,h:.502});start=null;}}}
m.portals.push({id:'mountain-gate',area:{x:86,y:55.4,w:2,h:1.2},arrival:{x:83,y:56},to:{mapId:'mountain-spirit-sanctuary',portalId:'marsh-gate'},label:{th:'ไปสำนักผนึกบนภูเขา · ตะวันออก',en:'Mountain Spirit Sanctuary'}});
m.safeZones.push({x:80,y:51,w:8,h:10});m.objects.push({id:'mountain-edge-lamp-n',asset:'talisman-lantern',x:87,y:53,footprint:null},{id:'mountain-edge-lamp-s',asset:'talisman-lantern',x:87,y:59,footprint:null});
await writeFile('packages/shared/src/maps/marsh-mountain-link.ts',`// Additive east boundary approach; original LEVELING_LIVE and west portal remain intact.\nimport type {MapDefinition} from '../world.js';\nexport const MARSH_MOUNTAIN_LINK:MapDefinition=${JSON.stringify(m,null,2)};\n`);
const sanctuary=JSON.parse(await readFile('docs/design/maps/mountain-spirit-sanctuary/map.json'));
await writeFile('packages/shared/src/maps/mountain-spirit-sanctuary.ts',`// Authored independent geography; no whole-layout scaling.\nimport type {MapDefinition} from '../world.js';\nexport const MOUNTAIN_SPIRIT_SANCTUARY:MapDefinition=${JSON.stringify(sanctuary,null,2)};\n`);
await writeFile('apps/client/src/components/maps/sanctuary-review-map.json',JSON.stringify(sanctuary,null,2));
console.log('Mountain live map + preserved marsh east-link generated.');
