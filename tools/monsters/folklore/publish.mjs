import{readFile,writeFile}from'node:fs/promises';
const base='docs/design/monsters/folklore-01/',roster=JSON.parse(await readFile(base+'roster.json')),drafts=JSON.parse(await readFile('apps/client/public/assets/monsters/folklore-01/drafts.json')),review=JSON.parse(await readFile(base+'review.json'));
const manifest=JSON.parse(await readFile('apps/client/public/assets/monsters/manifest.json')),definitions={},bindings={};
// Authored encounter assignments reuse existing camp footprints; landmarks/water/portals never move.
const camps={draugur:[1],afturganga:[0],utburdur:[0],uppvakningur:[2],sending:[2],tilberi:[1],'phi-pret':[1,2],'phi-pop':[0,0],'phi-krasue':[1,1],'phi-krahang':[2,1],onryo:[0,0],'yuki-onna':[1],'kuchisake-onna':[1],rokurokubi:[2,0],ubume:[1],gashadokuro:[2],rusalka:[1,1],leshy:[2],domovoi:[0,0],kikimora:[0,1],vodyanoy:[1,2],bannik:[0],jiangshi:[0,0],'nu-gui':[1],'e-gui':[1],'shui-gui':[2,2],'wutou-gui':[1],'huli-jing':[1,0],draugen:[0,1],huldra:[2,0],nokken:[1,1],fossegrim:[1],nisse:[0],mare:[2]};
const released={};
for(const m of roster.monsters){
 if(!review.monsters[m.id]?.runtimeAccepted)continue;
 const sheet=drafts.monsters[m.id];if(!sheet?.directions)throw Error('No eight-view sheet '+m.id);
 for(const f of roster.directions)for(const a of ['idle','move','attack','hurt','death'])if(!sheet.directions[f]?.[a]?.indices?.length)throw Error('Missing '+m.id+':'+f+':'+a);
 const level=m.level,attack=sheet.directions.south.attack;
 definitions[m.id]={kind:m.id,name:m.name,level,race:'undead',behavior:'aggressive',facingMode:'eight',hp:120+level*30,atk:8+level*2,def:5+Math.floor(level*.5),mdef:5+Math.floor(level*.4),speed:['phi-krasue','phi-krahang'].includes(m.id)?2.1:1.6,aggroRange:3.5,leash:5,attackRange:['phi-pret','gashadokuro'].includes(m.id)?1.8:1.3,attackDelayMs:1800,attackWindupMs:(attack.frames>=4?2:1)*125,exp:level*24,drops:[{itemId:'bone',chance:.22},{itemId:'dark-ore',chance:.15}],wander:{pauseMs:[2200,4800],radius:1.3}};
 manifest.monsters[m.id]=sheet;released[m.id]=sheet;
 m.mapIds.forEach((mapId,i)=>{(bindings[mapId]??=[]).push({kind:m.id,campIndex:camps[m.id]?.[i]??0,count:1});});
}
await writeFile('packages/shared/src/folklore-releases.ts',`// User-requested folklore enemies. ImageGen exception2026-10-15; stats/lore/map bindings provisional.\nimport type{MonsterDefinition}from'./combat.js';\nexport const FOLKLORE_RESIDENTS:Readonly<Record<string,MonsterDefinition>>=${JSON.stringify(definitions,null,2)};\nexport const FOLKLORE_BINDINGS:Readonly<Record<string,{kind:string;campIndex:number;count:number}[]>>=${JSON.stringify(bindings,null,2)};\n`);
await writeFile('apps/client/public/assets/monsters/manifest.json',JSON.stringify(manifest,null,2)+'\n');
await writeFile('apps/client/public/assets/monsters/folklore-01/releases.json',JSON.stringify({monsters:released},null,2));
console.log(Object.keys(definitions).length,'eight-view species registered;',Object.keys(bindings).length,'existing map bindings');
