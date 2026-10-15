import{FOLKLORE_BINDINGS}from'../folklore-releases.js';
import{FOLKLORE_HOME_NATIONS,FOLKLORE_MAP_NATIONS}from'../folklore-habitats.js';
import type{MapDefinition}from'../world.js';
/** Add accepted folklore enemies to existing authored encounter areas. Preserve all original residents and geometry. */
export function withFolkloreResidents(map:MapDefinition):MapDefinition{
 const additions=FOLKLORE_BINDINGS[map.id];if(!additions?.length)return map;
 if(!map.spawnRegions?.length)throw Error('No authored camps for '+map.id);
 for(const addition of additions)if(FOLKLORE_HOME_NATIONS[addition.kind]!==FOLKLORE_MAP_NATIONS[map.id])throw Error('Cross-nation folklore spawn '+map.id+':'+addition.kind);
 for(const addition of additions)if(!Number.isInteger(addition.campIndex)||addition.campIndex<0||addition.campIndex>=map.spawnRegions.length)throw Error('Invalid folklore camp '+map.id+':'+addition.kind);
 return{...map,spawnRegions:map.spawnRegions.map((region,i)=>({...region,monsters:[...region.monsters,...additions.filter(a=>a.campIndex===i).map(a=>({kind:a.kind,count:a.count}))]}))};
}
