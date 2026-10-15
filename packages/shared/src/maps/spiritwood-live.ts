import {WHISPERING_SPIRITWOOD} from './whispering-spiritwood.js';
import type {MapDefinition} from '../world.js';
// Preserve all original objects, NPCs, monster regions and comments in the source module.
export const SPIRITWOOD_LIVE:MapDefinition={...WHISPERING_SPIRITWOOD,terrain:{...WHISPERING_SPIRITWOOD.terrain!,paint:[...WHISPERING_SPIRITWOOD.terrain!.paint,{terrain:'dirt',shape:'path',points:[[70,33.6],[79,34]],r:1.2}]},portals:[...(WHISPERING_SPIRITWOOD.portals??[]),{
  id:'paddy-gate',area:{x:78,y:32.5,w:1.6,h:3},arrival:{x:76,y:34},
  to:{mapId:'lantern-paddy',portalId:'south-gate'},label:{th:'ไปทุ่งนาประทีป',en:'To Lantern Paddy'}
}],safeZones:[...(WHISPERING_SPIRITWOOD.safeZones??[]),{x:74,y:31,w:6,h:6}]};
