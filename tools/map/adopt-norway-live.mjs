import{readFile,writeFile,mkdir}from'node:fs/promises';
const ids=['storm-fjord','spirit-timber-harbor','aurora-pass'];
const maps=await Promise.all(ids.map(async id=>JSON.parse(await readFile(`docs/design/maps/${id}/map.json`))));
const gate=(id,x,y,arrival,mapId,portalId,th)=>({id,area:{x,y,w:2,h:2},arrival,to:{mapId,portalId},label:{th,en:mapId}});
const road=(m,points)=>m.terrain.paint.push({terrain:'road',shape:'path',points,r:1.8});
const west=[65,51,65],east=[24,19],prefix=['fjord','timber','aurora'];
const services=[[[17,54],[47,29],[10,62]],[[25,44],[47,27],[10,48]],[[25,49],[53,27],[10,62]]];
const camps=[[[7,7,10,9],[71,35,10,9],[20,68,9,7]],[[7,7,11,10],[67,36,10,10],[6,58,9,4]],[[7,7,11,10],[68,35,10,10],[23,65,10,10]]];
const npcNames=[['ผู้รักษาชายฝั่ง','ผู้ดูแลประภาคาร','ยามฟยอร์ด'],['หมอยาท่าเรือ','ผู้เฝ้าเรือนไม้','ยามท่าเรือ'],['ผู้รักษาทางหนาว','ผู้ดูแลลานผนึก','ยามช่องเขา']];
for(const[i,m]of maps.entries()){
 m.portals=[gate(i?'previous-gate':'snow-gate',0,west[i]-1,{x:4,y:west[i]},i?ids[i-1]:'snowbound-torii',i?'next-gate':'norway-gate','กลับ'+(i?maps[i-1].name:'ศาลเจ้าหิมะผนึกเงา')+' · ตะวันตก')];road(m,[[1,west[i]],[4,west[i]]]);
 if(i<2){m.portals.push(gate('next-gate',m.width-2,east[i]-1,{x:m.width-4,y:east[i]},ids[i+1],'previous-gate','ไป'+maps[i+1].name+' · ตะวันออก'));road(m,[[m.width-4,east[i]],[m.width-1,east[i]]]);}
 m.npcs=services[i].map(([x,y],j)=>({id:prefix[i]+'-'+['healer','keeper','watch'][j],sprite:['npc-herbalist','npc-elder','npc-guard'][j],role:['healer','guide','guard'][j],x,y,name:{th:npcNames[i][j],en:prefix[i]+' '+['Healer','Keeper','Watch'][j]},title:['รักษา','นำทาง','เฝ้าทาง'][j],greeting:i===2?'เส้นทางตะวันตกกลับท่าเรือ ลานล่ารอบนอกอยู่ห่างจากจุดพัก':j===1?'เดินตามถนนถึงขอบตะวันออกเพื่อไปแมพถัดไป กลับทางตะวันตกได้':'พักในเขตบริการก่อนออกล่าวิญญาณรอบนอก'}));
 m.safeZones=[...m.portals.map(p=>({x:p.arrival.x-3,y:p.arrival.y-3,w:6,h:6})),...m.npcs.map(n=>({x:n.x-3,y:n.y-3,w:6,h:6}))];
 m.spawnRegions=camps[i].map(([x,y,w,h],j)=>({id:prefix[i]+'-camp-'+(j+1),area:{x,y,w,h},respawnMs:24000+j*3000,monsters:[{kind:prefix[i]+'-'+['wisp','shadow','guardian'][j],count:3}]}));
 await writeFile(`docs/design/maps/${m.id}/live01-map.json`,JSON.stringify(m,null,2));
}
await writeFile('packages/shared/src/maps/norway.ts',`// User-authorized Norway live adoption. Reviewed art/layout retained; numerical balance remains provisional.\nimport type{MapDefinition}from'../world.js';\nexport const NORWAY_MAPS=${JSON.stringify(maps,null,2)} as unknown as MapDefinition[];\n`);
// Add one north exit without rewriting Japanese objects, paths, NPCs, camps or existing gates/comments.
const g=gate('norway-gate',54,0,{x:55,y:4},ids[0],'snow-gate','ไปฟยอร์ดพายุคราม · เหนือ');
await writeFile('packages/shared/src/maps/snow-norway-link.ts',`import{JAPAN_MAPS}from'./japan.js';\nimport type{MapDefinition}from'../world.js';\nconst snow=JAPAN_MAPS.find(m=>m.id==='snowbound-torii')!;\nexport const SNOW_NORWAY_LINK:MapDefinition={...snow,terrain:{...snow.terrain!,paint:[...snow.terrain!.paint,{terrain:'road',shape:'path',points:[[55,22],[55,12],[55,1]],r:1.8}]},portals:[...(snow.portals??[]),${JSON.stringify(g)}],safeZones:[...(snow.safeZones??[]),{x:52,y:1,w:6,h:6}]};\n`);
await mkdir('docs/design/maps/norway-three/live01',{recursive:true});
console.log('Norway3 adopted with reciprocal boundary gates,9 NPCs and27 residents; snow link additive.');
