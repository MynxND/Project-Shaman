import{readFile,writeFile,mkdir,copyFile,access}from'node:fs/promises';
const ids=['ashwind-volcano','ember-caldera','obsidian-estuary'],load=async id=>JSON.parse(await readFile(`docs/design/maps/${id}/map.json`));
const maps=await Promise.all(ids.map(load)),mountain=await load('mountain-spirit-sanctuary');
for(const m of [...maps,mountain]){const dir=`docs/design/maps/${m.id}/live03/`;await mkdir(dir,{recursive:true});try{await access(dir+'before-map.json');}catch{await copyFile(`docs/design/maps/${m.id}/map.json`,dir+'before-map.json');}}
const path=(m,points,terrain='road')=>m.terrain.paint.push({terrain,shape:'path',points,r:1.8});
const gate=(id,area,arrival,mapId,portalId,th)=>({id,area,arrival,to:{mapId,portalId},label:{th,en:mapId}});
const [ash,ember,estuary]=maps;
// Remove only the discarded approach owned by this adoption, preserving all earlier terrain.
mountain.terrain.paint=mountain.terrain.paint.filter(p=>JSON.stringify(p.points)!==JSON.stringify([[4,54],[6,55],[6,60],[8,63]]));
mountain.portals=mountain.portals.filter(p=>p.id!=='ashwind-gate');
if(!mountain.terrain.paint.some(p=>JSON.stringify(p.points)===JSON.stringify([[40,56],[42,59],[42,63]])))path(mountain,[[40,56],[42,59],[42,63]],'dirt');
mountain.portals.push(gate('ashwind-gate',{x:41,y:62,w:2,h:2},{x:42,y:60},ash.id,'sanctuary-gate','ไปภูเขาไฟเถ้าลม · ใต้'));
ash.portals=[gate('sanctuary-gate',{x:0,y:53,w:2,h:2},{x:4,y:54},mountain.id,'ashwind-gate','กลับสำนักผนึกบนภูเขา · ตะวันตก'),gate('caldera-gate',{x:88,y:15,w:2,h:2},{x:86,y:16},ember.id,'ashwind-gate','ไปปล่องพิธีอัคคี · ตะวันออก')];
ember.portals=[gate('ashwind-gate',{x:0,y:63,w:2,h:2},{x:4,y:64},ash.id,'caldera-gate','กลับภูเขาไฟเถ้าลม · ตะวันตก'),gate('estuary-gate',{x:94,y:46,w:2,h:2},{x:92,y:47},estuary.id,'caldera-gate','ไปปากน้ำออบซิเดียน · ตะวันออก')];
estuary.portals=[gate('caldera-gate',{x:0,y:19,w:2,h:2},{x:4,y:20},ember.id,'estuary-gate','กลับปล่องพิธีอัคคี · ตะวันตก')];
const approaches=[[[1,54],[4,54]],[[84,16],[89,16]],[[1,64],[4,64]],[[91,47],[95,47]],[[1,20],[4,20]]];
for(const[m,points]of[[ash,approaches[0]],[ash,approaches[1]],[ember,approaches[2]],[ember,approaches[3]],[estuary,approaches[4]]])if(!m.terrain.paint.some(p=>JSON.stringify(p.points)===JSON.stringify(points)))path(m,points);
const npc=(id,sprite,role,x,y,th,title,greeting)=>({id,sprite,role,x,y,name:{th,en:id},title,greeting});
ash.npcs=[npc('ash-healer','npc-herbalist','healer',16,48,'ผู้รักษาเถ้าลม','รักษา', 'พักฟื้นที่เพิงก่อนผ่านประตูหินแยก'),npc('ash-keeper','npc-elder','guide',57,29,'ผู้เฝ้าสำนักหินดำ','นำทาง','ตะวันตกกลับสำนักบนภูเขา ตะวันออกไปปล่องพิธีอัคคี'),npc('ash-watch','npc-guard','guard',65,26,'พรานเถ้าลม','เฝ้าทาง','ระวังวิญญาณเถ้าและผู้เฝ้าหินดำรอบปล่อง')];
ember.npcs=[npc('ember-healer','npc-herbalist','healer',74,69,'ผู้รักษาแอ่งแร่','รักษา','พักที่เพิงริมแอ่งแร่ก่อนเดินทาง'),npc('ember-keeper','npc-elder','guide',46,30,'ผู้เฝ้าประตูอัคคี','นำทาง','ตะวันตกไปเถ้าลม ตะวันออกลงสู่ชุมชนปากน้ำ'),npc('ember-watch','npc-guard','guard',18,61,'ยามประตูปล่อง','เฝ้าทาง','ลานเหนือทะเลสาบเป็นทางพิธี กลุ่มมอนสเตอร์อยู่รอบนอก')];
estuary.npcs=[npc('estuary-healer','npc-herbalist','healer',16,56,'ผู้รักษาปากน้ำ','รักษา','พักฟื้นที่ลานช่างก่อนข้ามทางหิน'),npc('estuary-keeper','npc-elder','guide',56,62,'ผู้ดูแลท่าหินดำ','นำทาง','ทางตะวันตกกลับปล่องพิธีอัคคี ทางใต้ยังไม่เปิด'),npc('estuary-watch','npc-guard','guard',16,18,'ยามศาลปากน้ำ','เฝ้าทาง','ข้ามน้ำเฉพาะทางหิน ระวังวิญญาณชายฝั่ง')];
const campData=[[[24,14,10,9],[42,47,10,8],[72,30,9,8]],[[7,24,10,8],[47,55,10,6],[77,35,10,7]],[[8,26,10,8],[8,58,9,7],[44,45,9,6]]];
const prefixes=['ash','ember','estuary'];
for(const[i,m]of maps.entries()){
 m.safeZones=[...m.portals.map(p=>({x:Math.max(0,p.arrival.x-3),y:Math.max(0,p.arrival.y-3),w:6,h:6})),...m.npcs.map(n=>({x:n.x-3,y:n.y-3,w:6,h:6}))];
 m.spawnRegions=campData[i].map(([x,y,w,h],j)=>({id:`${prefixes[i]}-camp-${j+1}`,area:{x,y,w,h},respawnMs:24000+j*3000,monsters:[{kind:`${prefixes[i]}-${['wisp','shadow','guardian'][j]}`,count:3}]}));
 const root=`docs/design/maps/${m.id}/`,p=JSON.parse(await readFile(root+'plan.json'));
 await writeFile(root+'map.json',JSON.stringify(m,null,2));
 const client=prefixes[i]==='ash'?'ashwind-review-map':m.id+'-map';await writeFile(`apps/client/src/components/maps/${client}.json`,JSON.stringify(m,null,2));
 await writeFile(root+'live03/gameplay.json',JSON.stringify({npcIds:m.npcs.map(n=>n.id),camps:m.spawnRegions,portals:m.portals,failedPlacements:[]},null,2));
}
await writeFile('packages/shared/src/maps/indonesia.ts',`// Authorized live adoption. Geometry/art provenance and pre-adoption snapshots: docs/design/maps/*/live03.\nimport type{MapDefinition}from'../world.js';\n// Authoring-only width/waterMode metadata is retained; shared collision uses the existing MapDefinition fields.\nexport const INDONESIA_MAPS=${JSON.stringify(maps,null,2)} as unknown as MapDefinition[];\n`);
await writeFile('docs/design/maps/mountain-spirit-sanctuary/map.json',JSON.stringify(mountain,null,2));await writeFile('apps/client/src/components/maps/sanctuary-review-map.json',JSON.stringify(mountain,null,2));
await writeFile('packages/shared/src/maps/mountain-spirit-sanctuary.ts',`// Authored independent geography; no whole-layout scaling.
// User-authorized canonical live map; layout and provenance remain in docs/design/maps/mountain-spirit-sanctuary.\nimport type{MapDefinition}from'../world.js';\nexport const MOUNTAIN_SPIRIT_SANCTUARY:MapDefinition=${JSON.stringify(mountain,null,2)};\n`);
const profiles=Object.fromEntries(await Promise.all(ids.map(async id=>[id,JSON.parse(await readFile(`docs/design/maps/${id}/plan.json`))])));
await writeFile('apps/client/src/game/world/indonesia-presentation.json',JSON.stringify(profiles,null,2));
console.log('Adopted Indonesia chain; existing mountain west/east portals preserved.');
