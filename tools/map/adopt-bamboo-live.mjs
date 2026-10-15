import{mkdir,readFile,writeFile,copyFile,access}from'node:fs/promises';
import{materialAt}from'./leveling-preview-model.mjs';
const root='docs/design/maps/mist-bamboo/',mountainRoot='docs/design/maps/mountain-spirit-sanctuary/';
for(const r of[root,mountainRoot]){await mkdir(r+'revision01',{recursive:true});try{await access(r+'revision01/pre-bamboo-live.json');}catch{await copyFile(r+'map.json',r+'revision01/pre-bamboo-live.json');}}
const valley=JSON.parse(await readFile(root+'map.json')),plan=JSON.parse(await readFile(root+'plan.json')),mountain=JSON.parse(await readFile(mountainRoot+'map.json'));
valley.portals=[{id:'sanctuary-gate',area:{x:0,y:44.4,w:2,h:1.2},arrival:{x:4,y:45},to:{mapId:mountain.id,portalId:'bamboo-gate'},label:{th:'กลับสำนักผนึกบนภูเขา · ตะวันตก',en:'Mountain sanctuary'}}];
valley.spawnRegions=plan.camps.map((camp,i)=>({id:camp.id,area:camp.area,respawnMs:18000+i*3000,monsters:[{kind:['bamboo-wisp','bamboo-shadow','bamboo-guardian'][i],count:camp.positions.length}]}));
if(!mountain.portals.some(p=>p.id==='bamboo-gate')){
 mountain.terrain.paint.push({terrain:'dirt',shape:'path',points:[[51,53],[55,48],[61,45],[66,43],[73,43]],r:1.5});
 mountain.portals.push({id:'bamboo-gate',area:{x:72,y:42.4,w:2,h:1.2},arrival:{x:70,y:43},to:{mapId:valley.id,portalId:'sanctuary-gate'},label:{th:'ไปหุบไผ่หมอกคราม · ตะวันออก',en:'Mist bamboo valley'}});
 mountain.safeZones.push({x:65,y:40,w:9,h:7});
 const tree=mountain.objects.find(o=>o.id==='east-canopy-5');tree.x=69;tree.y=38;
 mountain.objects.push({id:'bamboo-boundary-lamp-n',asset:'talisman-lantern',x:73,y:40,footprint:null},{id:'bamboo-boundary-lamp-s',asset:'talisman-lantern',x:73,y:46,footprint:null});
 // Keep wet blockers synchronized with the final paint; new branch stays clear of the pool.
 mountain.blockers=[];for(let y=0;y<mountain.height;y+=.5){let start=null;for(let x=0;x<=mountain.width;x+=.5){const wet=x<mountain.width&&materialAt(mountain,x+.25,y+.25)==='water';if(wet&&start===null)start=x;if(!wet&&start!==null){mountain.blockers.push({x:start-.001,y:y-.001,w:x-start+.002,h:.502});start=null;}}}
}
for(const[r,name,data]of[[root,'mist-bamboo',valley],[mountainRoot,'mountain-spirit-sanctuary',mountain]]){await writeFile(r+'map.json',JSON.stringify(data,null,2));await writeFile(`packages/shared/src/maps/${name}.ts`,`${name==='mountain-spirit-sanctuary'?'// Authored independent geography; no whole-layout scaling.\n':''}// User-authorized canonical live map; layout and provenance remain in docs/design/maps/${name}.\nimport type{MapDefinition}from'../world.js';\nexport const ${name==='mist-bamboo'?'MIST_BAMBOO':'MOUNTAIN_SPIRIT_SANCTUARY'}:MapDefinition=${JSON.stringify(data,null,2)};\n`);await writeFile(`apps/client/src/components/maps/${name==='mist-bamboo'?'bamboo':'sanctuary'}-review-map.json`,JSON.stringify(data,null,2));}
await writeFile('apps/client/src/game/world/bamboo-presentation.json',JSON.stringify({fog:plan.fog,graph:plan.graph},null,2));
console.log('Canonical live valley + additive sanctuary east branch; existing marsh gate retained.');
