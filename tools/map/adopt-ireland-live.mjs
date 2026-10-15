import{readFile,writeFile,mkdir}from'node:fs/promises';
const ids=['golden-spiritwood','stone-oath-moor','willow-wake-village'];
const maps=await Promise.all(ids.map(async id=>JSON.parse(await readFile(`docs/design/maps/${id}/map.json`))));
const gate=(id,x,y,arrival,mapId,portalId,th)=>({id,area:{x,y,w:2,h:2},arrival,to:{mapId,portalId},label:{th,en:mapId}});
const road=(m,points)=>m.terrain.paint.push({terrain:'road',shape:'path',points,r:1.8});
const west=[58,60,48],east=[21,22],prefix=['grove','oath','willow'];
const services=[[[23,38],[65,30],[11,56]],[[21,48],[51,38],[11,58]],[[11,64],[39,31],[11,46]]];
const camps=[[[8,8,10,10],[67,47,11,10],[20,60,11,10]],[[7,9,11,10],[62,10,10,9],[34,57,12,10]],[[6,8,12,10],[68,51,12,10],[53,59,10,10]]];
const npcNames=[['หมอยาป่าใบผลัด','ผู้ดูแลลานรากไม้','ยามทางป่า'],['ผู้รักษาชายทุ่ง','ผู้เฝ้าคำสัตย์หิน','ยามทุ่งหิน'],['หมอยาวิลโลว์','ผู้ดูแลหมู่บ้าน','ยามม่านฝน']];
for(const[i,m]of maps.entries()){
 m.portals=[gate(i?'previous-gate':'norway-gate',0,west[i]-1,{x:4,y:west[i]},i?ids[i-1]:'aurora-pass',i?'next-gate':'ireland-gate','กลับ'+(i?maps[i-1].name:'ช่องเขาแสงเหนือ')+' · ตะวันตก')];road(m,[[1,west[i]],[4,west[i]]]);
 if(i<2){m.portals.push(gate('next-gate',m.width-2,east[i]-1,{x:m.width-4,y:east[i]},ids[i+1],'previous-gate','ไป'+maps[i+1].name+' · ตะวันออก'));road(m,[[m.width-4,east[i]],[m.width-1,east[i]]]);}
 m.npcs=services[i].map(([x,y],j)=>({id:prefix[i]+'-'+['healer','keeper','watch'][j],sprite:['npc-herbalist','npc-elder','npc-guard'][j],role:['healer','guide','guard'][j],x,y,name:{th:npcNames[i][j],en:prefix[i]+' '+['Healer','Keeper','Watch'][j]},title:['รักษา','นำทาง','เฝ้าทาง'][j],greeting:i===2?'เส้นทางตะวันตกกลับทุ่งหิน ลานล่ารอบนอกอยู่ห่างจากจุดพัก':j===1?'เดินตามถนนถึงขอบตะวันออกเพื่อไปแมพถัดไป กลับทางตะวันตกได้':'พักในเขตบริการก่อนออกล่าวิญญาณรอบนอก'}));
 m.safeZones=[...m.portals.map(p=>({x:p.arrival.x-3,y:p.arrival.y-3,w:6,h:6})),...m.npcs.map(n=>({x:n.x-3,y:n.y-3,w:6,h:6}))];
 m.spawnRegions=camps[i].map(([x,y,w,h],j)=>({id:prefix[i]+'-camp-'+(j+1),area:{x,y,w,h},respawnMs:24000+j*3000,monsters:[{kind:prefix[i]+'-'+['wisp','shadow','guardian'][j],count:3}]}));
 await writeFile(`docs/design/maps/${m.id}/live01-map.json`,JSON.stringify(m,null,2));
}
await writeFile('packages/shared/src/maps/ireland.ts',`// User-authorized Ireland live adoption. Reviewed art/layout retained; numerical balance remains provisional.\nimport type{MapDefinition}from'../world.js';\nexport const IRELAND_MAPS=${JSON.stringify(maps,null,2)} as unknown as MapDefinition[];\n`);
// Add only a Norwegian east exit; original objects, water, services and gates stay intact.
const g=gate('ireland-gate',90,19,{x:88,y:20},ids[0],'norway-gate','ไปป่าใบผลัดอาคม · ตะวันออก');
await writeFile('packages/shared/src/maps/aurora-ireland-link.ts',`import{NORWAY_MAPS}from'./norway.js';
import type{MapDefinition}from'../world.js';
const aurora=NORWAY_MAPS.find(m=>m.id==='aurora-pass')!;
export const AURORA_IRELAND_LINK:MapDefinition={...aurora,terrain:{...aurora.terrain!,paint:[...aurora.terrain!.paint,{terrain:'road',shape:'path',points:[[88,20],[91,20]],r:1.8}]},portals:[...(aurora.portals??[]),${JSON.stringify(g)}],safeZones:[...(aurora.safeZones??[]),{x:85,y:17,w:6,h:6}]};
`);
await mkdir('docs/design/maps/ireland-three/live01',{recursive:true});
console.log('Ireland3 adopted: reciprocal edges,9NPCs/27residents; Norway additive only.');
