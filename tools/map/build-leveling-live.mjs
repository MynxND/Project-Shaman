import {readFile,writeFile} from 'node:fs/promises';
import {materialAt} from './leveling-preview-model.mjs';
const review=JSON.parse(await readFile('docs/design/maps/leveling-first-four/maps.json'));
const resident={'spirit-buffalo':'clay-guardian','ritual-crab':'clay-guardian','water-lantern':'spirit-flame','mangrove-root':'cursed-strawling','ritual-toad':'shadow-macaque','mist-leech':'leaf-wisp','marsh-wisp':'spirit-flame'};
const portal=(id,x,y,to,portalId,ax,ay,th)=>({id,area:{x:x-1,y:y-.6,w:2,h:1.2},to:{mapId:to,portalId},arrival:{x:ax,y:ay},label:{th,en:to}});
const links={
 'lantern-paddy':[portal('south-gate',1,55,'whispering-spiritwood','paddy-gate',4,55,'กลับชายป่าวิญญาณ · ตะวันตก'),portal('north-gate',75,19,'moon-mangrove','west-gate',72,19,'ไปป่าชายเลนจันทร์ดับ · ตะวันออก')],
 'moon-mangrove':[portal('west-gate',1,51,'lantern-paddy','north-gate',5,51,'กลับทุ่งนาประทีป · ตะวันตก'),portal('east-gate',79,51,'monsoon-marsh','south-gate',75,51,'ไปบึงฝนลืมวิญญาณ · ตะวันออก')],
 'monsoon-marsh':[portal('south-gate',1,57,'moon-mangrove','east-gate',5,57,'กลับป่าชายเลนจันทร์ดับ · ตะวันตก')]
};
const approaches={
 'lantern-paddy':[[[1,55],[28,55],[38,48]],[[38,19],[75,19]]],
 'moon-mangrove':[[[1,51],[15,51]],[[69,51],[79,51]]],
 'monsoon-marsh':[[[1,57],[44,57]]]
};
const maps=review.maps.filter(m=>links[m.id]).map(m=>{
 const {id,name,width,height,spawn,ground,objects,safeZones,landmarks}=m;
 const terrain=structuredClone(m.terrain);
 if(id==='moon-mangrove')terrain.paint.push({terrain:'grass',shape:'rect',x:0,y:48.5,w:10,h:5},{terrain:'grass',shape:'rect',x:70,y:48.5,w:10,h:5});
 for(const points of approaches[id])terrain.paint.push({terrain:'dirt',shape:'path',points,r:1.3});
 const collisionMap={...m,terrain};
 const blockers=[];
 // Bake half-unit wet rows into overlapping shared rectangles. Bridge/causeway paint
 // is already authored grass/dirt, so it stays passable without client-only collision.
 for(let y=0;y<height;y+=.5){let start=null;
  for(let x=0;x<=width;x+=.5){const wet=x<width&&materialAt(collisionMap,x+.25,y+.25)==='water';
   if(wet&&start===null)start=x;
   if(!wet&&start!==null){blockers.push({x:start-.001,y:y-.001,w:x-start+.002,h:.502});start=null;}
  }
 }
 const portals=links[id],spawnRegions=m.spawnRegions.map(r=>({id:r.id,area:r.area,respawnMs:r.respawnMs,monsters:r.monsters.map(s=>({...s,kind:resident[s.kind]??s.kind}))}));
 // Boundary gates flank the walking corridor along Y, so neither marker sits outside the world.
 const gates=portals.flatMap(p=>[{id:p.id+'-lamp-w',asset:'talisman-lantern',x:p.area.x+p.area.w/2,y:p.area.y+.6-2.5,footprint:null},{id:p.id+'-lamp-e',asset:'talisman-lantern',x:p.area.x+p.area.w/2,y:p.area.y+.6+2.5,footprint:null}]);
 const safe=[...(safeZones??[]),...portals.map(p=>({x:p.arrival.x-3,y:p.arrival.y-3,w:6,h:6})),...portals.map(p=>({x:p.area.x-1,y:p.area.y-1,w:p.area.w+2,h:p.area.h+2}))];
 return{id,name,nameEn:id.replaceAll('-',' '),width,height,spawn,terrain,ground,objects:[...objects,...gates],blockers,npcs:[],portals,safeZones:safe,spawnRegions,landmarks:landmarks??m.graph.nodes.map(n=>({id:n.id,name:{th:id==='lantern-paddy'&&n.id==='exit'?'เสาพิธีเหนือ':n.name,en:n.id},x:n.x,y:n.y,kind:'forest'}))};
});
await writeFile('packages/shared/src/maps/leveling-live.ts',`// Generated from the preserved authored review by tools/map/build-leveling-live.mjs.\n// Existing animated residents are provisional; no original monster stats changed.\nimport type {MapDefinition} from '../world.js';\nexport const LEVELING_LIVE:MapDefinition[]=${JSON.stringify(maps,null,2)};\n`);
const presentation=Object.fromEntries(review.maps.map(m=>[m.id,{fog:m.fog,graph:m.graph,locations:m.locations,bridges:m.graph.edges.filter(e=>e.kind==='bridge')}])) ;
presentation['lantern-paddy'].fog=[{id:'north-irrigation-west',x:8,y:7,w:15,h:8,alpha:.06},{id:'north-irrigation-east',x:51,y:7,w:14,h:8,alpha:.06}];
for(const [id,routes]of Object.entries(approaches))for(const [i,points]of routes.entries())presentation[id].graph.edges.push({id:'edge-approach-'+i,points,width:2.6});
presentation['whispering-spiritwood'].graph.edges.push({id:'east-approach',points:[[70,33.6],[79,34]],width:2.4});
await writeFile('apps/client/src/game/world/leveling-presentation.json',JSON.stringify(presentation,null,2));
console.log('Baked three authored maps, reciprocal gates, water blockers and presentation.');
