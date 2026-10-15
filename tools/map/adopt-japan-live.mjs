import{readFile,writeFile,mkdir}from'node:fs/promises';
const ids=['cedar-torii-shrine','spirit-waterfall','monsoon-ruins','snowbound-torii'],maps=await Promise.all(ids.map(async id=>JSON.parse(await readFile(`docs/design/maps/${id}/map.json`)))),mountain=JSON.parse(await readFile('docs/design/maps/mountain-spirit-sanctuary/map.json'));
const path=(m,points)=>{if(!m.terrain.paint.some(p=>JSON.stringify(p.points)===JSON.stringify(points)))m.terrain.paint.push({terrain:'road',shape:'path',points,r:1.8});};
const gate=(id,x,y,arrival,mapId,portalId,th,vertical=false)=>({id,area:{x,y,w:2,h:2},arrival,to:{mapId,portalId},label:{th,en:mapId}});
mountain.portals=mountain.portals.filter(p=>p.id!=='japan-gate');path(mountain,[[40,56],[30,59],[30,63]]);mountain.portals.push(gate('japan-gate',29,62,{x:30,y:60},ids[0],'mountain-gate','ไปศาลเจ้าโทริอิป่าซีดาร์ · ใต้'));
const westY=[64,62,56,54],eastY=[34,18,25],prefixes=['cedar','ravine','storm','snow'];
const npc=(id,sprite,role,x,y,th,title,greeting)=>({id,sprite,role,x,y,name:{th,en:id},title,greeting});
const services=[[[20,62],[51,30],[30,62]],[[18,55],[23,34],[30,50]],[[18,54],[43,27],[25,47]],[[20,52],[43,30],[28,54]]];
const camps=[[[10,18,9,7],[24,29,9,7],[54,61,9,7]],[[10,8,9,7],[62,9,9,7],[15,63,9,7]],[[10,10,9,7],[64,14,9,7],[35,55,9,7]],[[9,12,9,7],[49,8,9,7],[42,54,9,7]]];
for(const[i,m]of maps.entries()){
 const pre=prefixes[i];m.portals=[gate(i?'previous-gate':'mountain-gate',0,westY[i]-1,{x:4,y:westY[i]},i?ids[i-1]:mountain.id,i?'next-gate':'japan-gate','กลับ'+(i?maps[i-1].name:mountain.name)+' · ตะวันตก')];path(m,[[1,westY[i]],[4,westY[i]]]);
 if(i<3){m.portals.push(gate('next-gate',m.width-2,eastY[i]-1,{x:m.width-4,y:eastY[i]},ids[i+1],'previous-gate','ไป'+maps[i+1].name+' · ตะวันออก'));path(m,[[m.width-5,eastY[i]],[m.width-1,eastY[i]]]);}
 m.npcs=services[i].map(([x,y],j)=>npc(pre+'-'+['healer','keeper','watch'][j],['npc-herbalist','npc-elder','npc-guard'][j],['healer','guide','guard'][j],x,y,['ผู้รักษาทางศาลเจ้า','ผู้ดูแลผนึก','ยามทางพิธี'][j],['รักษา','นำทาง','เฝ้าทาง'][j],j===1?'เดินตามทางหลักไปขอบแมพเพื่อเดินทางต่อ หิมะอยู่ถัดจากนครร้าง':'พักในเขตบริการก่อนออกล่าวิญญาณรอบนอก'));
 m.safeZones=[...m.portals.map(p=>({x:p.arrival.x-3,y:p.arrival.y-3,w:6,h:6})),...m.npcs.map(n=>({x:n.x-3,y:n.y-3,w:6,h:6}))];
 m.spawnRegions=camps[i].map(([x,y,w,h],j)=>({id:pre+'-camp-'+(j+1),area:{x,y,w,h},respawnMs:24000+j*3000,monsters:[{kind:pre+'-'+['wisp','shadow','guardian'][j],count:3}]}));
 await writeFile(`docs/design/maps/${m.id}/live01-map.json`,JSON.stringify(m,null,2));
}
await writeFile('packages/shared/src/maps/japan.ts',`// User-authorized Japanese boundary chain. Reviewed geometry remains in docs/design/maps; balance is provisional.\nimport type{MapDefinition}from'../world.js';\nexport const JAPAN_MAPS=${JSON.stringify(maps,null,2)} as unknown as MapDefinition[];\n`);
// Add only the new gateway; retain original mountain geometry/comments in the canonical TypeScript via a separate additive binding.
await writeFile('packages/shared/src/maps/mountain-japan-link.ts',`import{MOUNTAIN_SPIRIT_SANCTUARY}from'./mountain-spirit-sanctuary.js';\nimport type{MapDefinition}from'../world.js';\nexport const MOUNTAIN_JAPAN_LINK:MapDefinition={...MOUNTAIN_SPIRIT_SANCTUARY,terrain:{...MOUNTAIN_SPIRIT_SANCTUARY.terrain!,paint:[...MOUNTAIN_SPIRIT_SANCTUARY.terrain!.paint,{terrain:'road',shape:'path',points:[[40,56],[30,59],[30,63]],r:1.8}]},portals:[...(MOUNTAIN_SPIRIT_SANCTUARY.portals??[]),${JSON.stringify(mountain.portals.at(-1))}]};\n`);
console.log('Four Japan maps adopted; mountain existing paths, portals and residents preserved.');
