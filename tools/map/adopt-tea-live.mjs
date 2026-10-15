import{mkdir,readFile,writeFile,copyFile,access}from'node:fs/promises';
const teaRoot='docs/design/maps/cloud-tea-slopes/',bambooRoot='docs/design/maps/mist-bamboo/';
for(const root of [teaRoot,bambooRoot]){await mkdir(root+'revision02',{recursive:true});try{await access(root+'revision02/pre-tea-live.json');}catch{await copyFile(root+'map.json',root+'revision02/pre-tea-live.json');}}
const tea=JSON.parse(await readFile(teaRoot+'map.json')),bamboo=JSON.parse(await readFile(bambooRoot+'map.json')),plan=JSON.parse(await readFile(teaRoot+'plan.json'));
tea.portals=[{id:'bamboo-gate',area:{x:0,y:46.4,w:2,h:1.2},arrival:{x:4,y:47},to:{mapId:bamboo.id,portalId:'tea-gate'},label:{th:'กลับหุบไผ่หมอกคราม · ตะวันตก',en:'Mist Bamboo Valley'}}];
tea.spawnRegions=plan.camps.map((c,i)=>({id:c.id,area:c.area,respawnMs:21000+i*3000,monsters:[{kind:['tea-wisp','tea-shadow','tea-guardian'][i],count:c.positions.length}]}));
if(!bamboo.portals.some(p=>p.id==='tea-gate')){bamboo.portals.push({id:'tea-gate',area:{x:80,y:16.4,w:2,h:1.2},arrival:{x:78,y:17},to:{mapId:tea.id,portalId:'bamboo-gate'},label:{th:'ไปไร่ชาสันเมฆ · ตะวันออก',en:'Cloud Tea Slopes'}});bamboo.terrain.paint.push({terrain:'dirt',shape:'path',points:[[78,17],[81,17]],r:1.8});}
if(!tea.terrain.paint.some(p=>p.shape==='path'&&p.points[0]?.[0]===1&&p.points[0]?.[1]===47))tea.terrain.paint.push({terrain:'dirt',shape:'path',points:[[1,47],[4,47]],r:1.7});
for(const[root,id,data,prefix,symbol]of [[teaRoot,'cloud-tea-slopes',tea,'tea','CLOUD_TEA_SLOPES'],[bambooRoot,'mist-bamboo',bamboo,'bamboo','MIST_BAMBOO']]){
 await writeFile(root+'map.json',JSON.stringify(data,null,2));await writeFile(`apps/client/src/components/maps/${prefix}-review-map.json`,JSON.stringify(data,null,2));
 await writeFile(`packages/shared/src/maps/${id}.ts`,`// User-authorized canonical live map; layout and provenance remain in docs/design/maps/${id}.\n// Tea adoption retains original geometry and snapshots in revision02.\nimport type{MapDefinition}from'../world.js';\nexport const ${symbol}:MapDefinition=${JSON.stringify(data,null,2)};\n`);
}
await writeFile('apps/client/src/game/world/tea-presentation.json',JSON.stringify({fog:plan.fog,graph:plan.graph},null,2));
console.log('Tea live, reciprocal bamboo edge; existing west routes and all camp geometry retained.');
