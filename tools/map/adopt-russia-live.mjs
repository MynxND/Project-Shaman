import{readFile,writeFile,mkdir}from'node:fs/promises';
const ids=['frost-pine','taiga-blood-trail','winter-seal-kremlin'];
const maps=await Promise.all(ids.map(async id=>JSON.parse(await readFile(`docs/design/maps/${id}/map.json`))));
const gate=(id,x,y,arrival,mapId,portalId,th)=>({id,area:{x,y,w:2,h:2},arrival,to:{mapId,portalId},label:{th,en:mapId}});
const road=(m,points)=>m.terrain.paint.push({terrain:'road',shape:'path',points,r:1.8});
const west=[63,60,63],east=[23,20],prefix=['frost','taiga','winter'];
const services=[[[21,39],[40,35],[11,60]],[[19,47],[47,34],[10,58]],[[19,47],[52,32],[11,61]]];
const camps=[[[12,10,12,10],[67,9,12,10],[40,61,12,10]],[[13,9,12,10],[54,7,12,10],[52,58,12,10]],[[13,8,12,10],[64,8,12,10],[43,64,12,10]]];
const npcNames=[['หมอยาป่าสน','ผู้ดูแลระฆังหนาว','ยามทางหิมะ'],['หมอยาพรานไทกา','ผู้ดูแลค่ายรอยล่า','ยามไทกา'],['หมอยาหน้าป้อม','ผู้รักษาผนึกเหมันต์','ยามป้อมไม้']];
for(const[i,m]of maps.entries()){
 m.portals=[gate(i?'previous-gate':'ireland-gate',0,west[i]-1,{x:4,y:west[i]},i?ids[i-1]:'willow-wake-village',i?'next-gate':'russia-gate','กลับ'+(i?maps[i-1].name:'หมู่บ้านวิลโลว์ม่านฝน')+' · ตะวันตก')];road(m,[[1,west[i]],[4,west[i]]]);
 if(i<2){m.portals.push(gate('next-gate',m.width-2,east[i]-1,{x:m.width-4,y:east[i]},ids[i+1],'previous-gate','ไป'+maps[i+1].name+' · ตะวันออก'));road(m,[[m.width-4,east[i]],[m.width-1,east[i]]]);}
 m.npcs=services[i].map(([x,y],j)=>({id:prefix[i]+'-'+['healer','keeper','watch'][j],sprite:['npc-herbalist','npc-elder','npc-guard'][j],role:['healer','guide','guard'][j],x,y,name:{th:npcNames[i][j],en:prefix[i]+' '+['Healer','Keeper','Watch'][j]},title:['รักษา','นำทาง','เฝ้าทาง'][j],greeting:i===2?'กลับรอยล่าแห่งไทกาได้ทางตะวันตก ลานล่าริมบึงอยู่ทางใต้ของป้อม':j===1?'เดินตามถนนถึงขอบตะวันออกเพื่อไปแมพถัดไป กลับทางตะวันตกได้':'พักในเขตบริการก่อนออกล่าวิญญาณรอบนอก'}));
 m.safeZones=[...m.portals.map(p=>({x:p.arrival.x-3,y:p.arrival.y-3,w:6,h:6})),...m.npcs.map(n=>({x:n.x-3,y:n.y-3,w:6,h:6}))];
 m.spawnRegions=camps[i].map(([x,y,w,h],j)=>({id:prefix[i]+'-camp-'+(j+1),area:{x,y,w,h},respawnMs:24000+j*3000,monsters:[{kind:prefix[i]+'-'+['wisp','shadow','guardian'][j],count:3}]}));
 await writeFile(`docs/design/maps/${m.id}/live01-map.json`,JSON.stringify(m,null,2));
}
await writeFile('packages/shared/src/maps/russia.ts',`// User-authorized Russia live adoption. Reviewed art/layout retained; numerical balance remains provisional.\nimport type{MapDefinition}from'../world.js';\nexport const RUSSIA_MAPS=${JSON.stringify(maps,null,2)} as unknown as MapDefinition[];\n`);
// Add only an Irish east exit; original objects, water, services and gates stay intact.
const g=gate('russia-gate',86,19,{x:84,y:20},ids[0],'ireland-gate','ไปป่าสนขาว · ตะวันออก');
await writeFile('packages/shared/src/maps/willow-russia-link.ts',`import{IRELAND_MAPS}from'./ireland.js';
import type{MapDefinition}from'../world.js';
const willow=IRELAND_MAPS.find(m=>m.id==='willow-wake-village')!;
export const WILLOW_RUSSIA_LINK:MapDefinition={...willow,terrain:{...willow.terrain!,paint:[...willow.terrain!.paint,{terrain:'road',shape:'path',points:[[84,20],[87,20]],r:1.8}]},portals:[...(willow.portals??[]),${JSON.stringify(g)}],safeZones:[...(willow.safeZones??[]),{x:81,y:17,w:6,h:6}]};
`);
// Reuse complete owned animation sheets; names/stat bands remain provisional regional variants.
const original=await readFile('packages/shared/src/ireland-residents.ts','utf8'),templates=JSON.parse(original.slice(original.indexOf('={')+1).trim().replace(/;$/,''));
const levels=[[60,67,75],[70,78,85],[75,83,90]],names=[['ภูตสนหนาว','พยนต์เงาหิมะ','ผู้เฝ้าบึงเหมันต์'],['ภูตรอยล่า','พยนต์พรานหลงทาง','ผู้เฝ้ารากไทกา'],['ภูตโคมเหมันต์','พยนต์เฝ้าป้อม','ผู้พิทักษ์ผนึกหนาว']],residents={};
const manifest=JSON.parse(await readFile('apps/client/public/assets/monsters/manifest.json'));
for(const[i,pre]of prefix.entries())for(const[j,suffix]of ['wisp','shadow','guardian'].entries()){
 const kind=pre+'-'+suffix,level=levels[i][j],base=structuredClone(templates['grove-'+suffix]);
 residents[kind]={...base,kind,name:{th:names[i][j],en:kind},level,hp:400+level*28+j*180,atk:25+level*2+j*10,exp:level*22+j*180};
 manifest.monsters[kind]=structuredClone(manifest.monsters[['leaf-wisp','cursed-strawling','clay-guardian'][j]]);
}
await writeFile('packages/shared/src/russia-residents.ts',`// Provisional Russia variants reuse owned wisp/strawling/guardian animation; original species unchanged.
import type{MonsterDefinition}from'./combat.js';
export const RUSSIA_RESIDENTS:Readonly<Record<string,MonsterDefinition>>=${JSON.stringify(residents,null,2)};
`);
await writeFile('apps/client/public/assets/monsters/manifest.json',JSON.stringify(manifest,null,2)+'\n');
await mkdir('docs/design/maps/russia-three/live01',{recursive:true});
console.log('Russia3 adopted: reciprocal edges,9NPCs/27residents; Ireland preserved.');
