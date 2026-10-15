import{readFile,writeFile}from'node:fs/promises';
const base='docs/design/monsters/folklore-01/',roster=JSON.parse(await readFile(base+'roster.json')),drafts=JSON.parse(await readFile('apps/client/public/assets/monsters/folklore-01/drafts.json')),review=JSON.parse(await readFile(base+'review.json'));
const manifest=JSON.parse(await readFile('apps/client/public/assets/monsters/manifest.json')),definitions={},bindings={};
// Authored encounter assignments reuse existing camp footprints; landmarks/water/portals never move.
const motifs=['krasue-embers','frost-breath','shroud-leaves','mourning-hair','drowned-hand','nine-fox-flames','sleeve-knot','river-tresses','river-surge','shroud-wail','sent-curse','crimson-silk','drowning-grasp','fox-mirage','reed-lure','fiddle-wave','nightmare-claw'];
const encounters=JSON.parse(await readFile(base+'encounter-04.json'));
const released={};
for(const m of roster.monsters){
 if(!review.monsters[m.id]?.runtimeAccepted)continue;
 const sheet=drafts.monsters[m.id];if(!sheet?.directions)throw Error('No eight-view sheet '+m.id);
 const encounter=encounters.monsters[m.id];if(!encounter||encounter.nation!==m.nation)throw Error('Missing/mismatched home nation '+m.id);
 if(!['melee','ranged'].includes(encounter.role)||!Number.isFinite(encounter.range)||encounter.range<=0)throw Error('Invalid combat role/range '+m.id);
 if(encounter.role==='ranged'&&(!encounter.projectile||!['spirit','yantra','binding'].includes(encounter.projectile.family)||!Number.isFinite(encounter.projectile.speed)||!(encounter.projectile.speed>0)||!motifs.includes(encounter.projectile.motif)||!(encounter.projectile.originHeight>0&&encounter.projectile.originHeight<1)))throw Error('Invalid projectile '+m.id);
 if(encounter.role==='ranged')for(const f of roster.directions){const p=encounter.projectile.origins?.[f];if(!p||![p.x,p.y].every(Number.isInteger)||p.x<0||p.y<0||p.x>=sheet.frameWidth||p.y>=sheet.frameHeight)throw Error('Invalid release-pose port '+m.id+':'+f);}
 for(const f of roster.directions)for(const a of ['idle','move','attack','hurt','death'])if(!sheet.directions[f]?.[a]?.indices?.length)throw Error('Missing '+m.id+':'+f+':'+a);
 const level=m.level,attack=sheet.directions.south.attack,impact=sheet.attackImpactFrame??(attack.frames>=4?2:1);
 if(!Number.isInteger(impact)||impact<0||impact>=attack.frames)throw Error('Invalid attack impact pose '+m.id);
 definitions[m.id]={kind:m.id,name:m.name,level,race:'undead',behavior:'aggressive',facingMode:'eight',hp:120+level*30,atk:8+level*2,def:5+Math.floor(level*.5),mdef:5+Math.floor(level*.4),speed:['phi-krasue','phi-krahang'].includes(m.id)?2.1:1.6,aggroRange:3.5,leash:5,attackRange:['phi-pret','gashadokuro'].includes(m.id)?1.8:1.3,attackDelayMs:1800,attackWindupMs:Math.round(impact*1000/attack.fps),exp:level*24,drops:[{itemId:'bone',chance:.22},{itemId:'dark-ore',chance:.15}],wander:{pauseMs:[2200,4800],radius:1.3}};
 manifest.monsters[m.id]=sheet;released[m.id]=sheet;
 const def=definitions[m.id];def.attackRange=encounter.range;
 if(encounter.role==='ranged'){if(!encounter.projectile)throw Error('Ranged enemy without projectile '+m.id);def.projectile=encounter.projectile;def.aggroRange=encounter.range+1.3;def.leash=encounter.range+3.3;}
 for(const location of encounter.locations){const {mapId,campIndex,status}=location;if(encounters.mapNations[mapId]!==encounter.nation)throw Error('Cross-nation spawn '+m.id+':'+mapId);if(status!=='live')continue;if(!Number.isInteger(campIndex))throw Error('Missing authored camp '+m.id);(bindings[mapId]??=[]).push({kind:m.id,campIndex,count:1});}
}
await writeFile('packages/shared/src/folklore-releases.ts',`// User-requested folklore enemies. ImageGen exception2026-10-15; stats/lore/map bindings provisional.\nimport type{MonsterDefinition}from'./combat.js';\nexport const FOLKLORE_RESIDENTS:Readonly<Record<string,MonsterDefinition>>=${JSON.stringify(definitions,null,2)};\nexport const FOLKLORE_BINDINGS:Readonly<Record<string,{kind:string;campIndex:number;count:number}[]>>=${JSON.stringify(bindings,null,2)};\n`);
await writeFile('apps/client/public/assets/monsters/manifest.json',JSON.stringify(manifest,null,2)+'\n');
await writeFile('apps/client/public/assets/monsters/folklore-01/releases.json',JSON.stringify({monsters:released},null,2));
console.log(Object.keys(definitions).length,'eight-view species registered;',Object.keys(bindings).length,'existing map bindings');
await writeFile('apps/client/public/assets/monsters/folklore-01/encounters.json',JSON.stringify(encounters,null,2)+'\n');
await writeFile('packages/shared/src/folklore-habitats.ts',`// Authored game-national homes; Ireland grouping reconfirmed by user. Korean habitats remain planned.\nexport const FOLKLORE_HOME_NATIONS:Readonly<Record<string,string>>=${JSON.stringify(Object.fromEntries(Object.entries(encounters.monsters).map(([id,e])=>[id,e.nation])),null,2)};\nexport const FOLKLORE_MAP_NATIONS:Readonly<Record<string,string>>=${JSON.stringify(encounters.mapNations,null,2)};\n`);
